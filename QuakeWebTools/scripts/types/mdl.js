var QuakeWebTools = QuakeWebTools || {};

/*
typedef struct
{ long id;                     // 0x4F504449 = "IDPO" for IDPOLYGON
  long version;                // Version = 6
  vec3_t scale;                // Model scale factors.
  vec3_t origin;               // Model origin.
  scalar_t radius;             // Model bounding radius.
  vec3_t offsets;              // Eye position (useless?)
  long numskins ;              // the number of skin textures
  long skinwidth;              // Width of skin texture
                               //           must be multiple of 8
  long skinheight;             // Height of skin texture
                               //           must be multiple of 8
  long numverts;               // Number of vertices
  long numtris;                // Number of triangles surfaces
  long numframes;              // Number of frames
  long synctype;               // 0= synchron, 1= random
  long flags;                  // 0 (see Alias models)
  scalar_t size;               // average size of triangles
} mdl_t;
*/

/**
* MDL file representation.
* @constructor
* @param {String} path The path and filename.
* @param {ArrayBuffer} arraybuffer The file data as an ArrayBuffer.
*/
QuakeWebTools.MDL = function(path, arraybuffer) {
  this.filename = QuakeWebTools.FileUtil.getFilename(path);
  this.ab = arraybuffer;

  this.header = null;
  this.skins = [];

  this.init();
}

QuakeWebTools.MDL.VECTOR3_T = [
  "x", "float32",
  "y", "float32",
  "z", "float32"
];

QuakeWebTools.MDL.VERTEX_T = [
  "x",                "uint8", // packed from float into unsigned char
  "y",                "uint8", // to convert, multiply by scale then add origin
  "z",                "uint8",
  "lni",              "uint8" // light normal index
];

QuakeWebTools.MDL.SKINVERT_T = [
  "onseam",           "int32",
  "s",                "int32", // u = s / width
  "t",                "int32"  // v = t / height
];

QuakeWebTools.MDL.TRIANGLE_T = [
  "front_facing",     "int32", // boolean
  "vert_indices",     ["[]", "int32", 3]
];

QuakeWebTools.MDL.FRAME_T = [
  "min",              QuakeWebTools.MDL.VERTEX_T,
  "max",              QuakeWebTools.MDL.VERTEX_T,
  "name",             "string:16"
];

QuakeWebTools.MDL.HEADER_T = [
  "mdl_id",           "string:4",                   // IDPO
  "mdl_version",      "int32",                      // 6
  "scale",            QuakeWebTools.MDL.VECTOR3_T,
  "scale_origin",     QuakeWebTools.MDL.VECTOR3_T,
  "bounding_radius",  "float32",
  "eye_position",     QuakeWebTools.MDL.VECTOR3_T,  // eyes position (player...) 
  "num_skins",        "int32",
  "skin_width",       "int32",
  "skin_height",      "int32",
  "num_verts",        "int32",
  "num_tris",         "int32",
  "num_frames",       "int32",
  "synch_type",       "int32",                      // 0 = synchronized, 1 = random
  "flags",            "int32",                      // 0
  "size",             "float32"                     // average triangle size...
];

QuakeWebTools.MDL.prototype.init = function() {
  var QWT = QuakeWebTools;
  var ds = new DataStream(this.ab, 0, DataStream.LITTLE_ENDIAN);
  var trim = QuakeWebTools.FileUtil.trimNullTerminatedString;

  // read header
  var header = ds.readStruct(QWT.MDL.HEADER_T);
  this.header = header;

  // read skins
  var skins = []; // image_data (see ImageUtil.newImageData)
  var skin_groups = []; // { index, num_skins }

  var name = QWT.FileUtil.getFilenameNoExtension(this.filename) + "_";
  var skin_size = header.skin_width * header.skin_height;
  for (var i = 0; i < header.num_skins; ++i) {
    var group = ds.readInt32();
    var num_skins = 1;
    if (group != 0) {
      // create and add skin group
      num_skins = ds.readInt32();
      var skin_group = {
        index: skins.length,
        num_skins: num_skins
      };
      skin_groups[skin_groups.length] = skin_group;
    }
    // add skins
    for (var j = 0; j < num_skins; ++j) {
      var image_data = QWT.ImageUtil.newImageData(name + i,
          header.skin_width, header.skin_height);
      image_data.pixels = ds.readUint8Array(skin_size);
      skins[skins.length] = image_data; 
    }
  }
  this.skins = skins;
  this.skin_groups = skin_groups;

  // read skin verts and triangles
  this.skin_verts = ds.readType(["[]", QWT.MDL.SKINVERT_T, this.header.num_verts]);
  this.triangles = ds.readType(["[]", QWT.MDL.TRIANGLE_T, this.header.num_tris]);

  // read frames
  var frames = [];
  var frame_groups = [];

  for (var i = 0; i < header.num_frames; ++i) {
    var group = ds.readInt32();
    var num_frames = 1;
    if (group != 0) {
      // create and add frame group
      var frame_group = {
        index: frames.length,
        num_frames: ds.readInt32(),
        min: ds.readType(QWT.MDL.VERTEX_T),
        max: ds.readType(QWT.MDL.VERTEX_T)
      };
      num_frames = frame_group.num_frames;
      frame_group.times = ds.readType(["[]", "float32", num_frames]);
      frame_groups[frame_groups.length] = frame_group;
    }
    // add frames
    for (var j = 0; j < num_frames; ++j) {
      var frame = ds.readType(QWT.MDL.FRAME_T);
      frame.verts = ds.readType(["[]", QWT.MDL.VERTEX_T, this.header.num_verts]);
      frame.name = trim(frame.name);
      frames[frames.length] = frame;
    }
  }
  this.frames = frames;
  this.frame_groups = frame_groups;
}

QuakeWebTools.MDL.prototype.expandVertices = function(frame) {
  // get key variables in scope
  var sx = this.header.scale.x;
  var sy = this.header.scale.y;
  var sz = this.header.scale.z;
  var ox = this.header.scale_origin.x;
  var oy = this.header.scale_origin.y;
  var oz = this.header.scale_origin.z;
  var num_verts = this.header.num_verts;

  // expand vertices and uvs
  var verts = [];

  for (var i = 0; i < num_verts; ++i) {
    var pv = frame.verts[i]; // packed vertex
    var ev = { // expanded vertex
      x: pv.x * sx + ox,
      y: pv.y * sy + oy,
      z: pv.z * sz + oz
    };
    verts[i] = ev;
  }

 return verts;
}

QuakeWebTools.MDL.prototype.expandTriangles = function() {
  // get key variables in scope
  var tris = this.triangles;
  var skin_verts = this.skin_verts;
  var skin_width = this.header.skin_width;
  var skin_height = this.header.skin_height;

  var triangles = [];

  for (var i = 0; i < tris.length; ++i) {
    var pt = tris[i];
    var ff = pt.front_facing;

    var puv = skin_verts[pt.vert_indices[0]];
    var eva = {
      vi: pt.vert_indices[0],
      u: puv.s / skin_width,
      v: puv.t / skin_height
    };
    if (ff && puv.onseam) { eva.u += 0.5; }

    var puv = skin_verts[pt.vert_indices[1]];
    var evb = {
      vi: pt.vert_indices[1],
      u: puv.s / skin_width,
      v: puv.t / skin_height
    };
    if (ff && puv.onseam) { evb.u += 0.5; }

    var puv = skin_verts[pt.vert_indices[2]];
    var evc = {
      vi: pt.vert_indices[2],
      u: puv.s / skin_width,
      v: puv.t / skin_height
    };
    if (ff && puv.onseam) { evc.u += 0.5; }

    triangles[i] = {"a": eva, "b": evb, "c": evc};
  }

  return triangles;
}

QuakeWebTools.MDL.prototype.toThreeMaterial = function(skin_id) {
  var QWT = QuakeWebTools;

  skin_id = (skin_id >= 0 && skin_id < this.skins.length) ? skin_id : 0;
  var skin = this.skins[skin_id];

  // for data texture format, see THREE.ImageUtils.generateDataTexture
  var data = QWT.ImageUtil.expandImageData(skin, QWT.DEFAULT_PALETTE, null, true);
  var texture = new THREE.DataTexture(data, this.header.skin_width, this.header.skin_height, THREE.RGBAFormat);
  texture.needsUpdate = true;

  return new THREE.MeshBasicMaterial({ map: texture });
}

QuakeWebTools.MDL.prototype.toThreeBufferGeometry = function(frame_id) {
  frame_id = (frame_id >= 0 && frame_id < this.frames.length) ? frame_id : 0;
  var frame = this.frames[frame_id];

  // expand model data
  var triangles = this.expandTriangles();
  var vertices = this.expandVertices(frame);

  // create geometry and attributes
  var geometry = new THREE.BufferGeometry();

  var uvs = new THREE.Float32Attribute(this.header.num_tris * 3, 2);
  var verts = new THREE.Float32Attribute(this.header.num_verts, 3);
  var faces = new THREE.Uint8Attribute(this.header.num_tris, 3);

  for (var i = 0; i < vertices.length; ++i) {
    var v = vertices[i];
    verts.setXYZ(i, v.x, v.y, v.z);
  }
  for (var i = 0; i < triangles.length; ++i) {
    // get triangle vertices a, b, c
    var tri = triangles[i];
    var a = tri.a,
        b = tri.b,
        c = tri.c;
    // write uvs
    var vi = i * 6; // 3 uvs per face
    var arr = uvs.array;
    arr[vi]     = a.u;
    arr[vi + 1] = a.v;
    arr[vi + 2] = b.u;
    arr[vi + 3] = b.v;
    arr[vi + 4] = c.u;
    arr[vi + 5] = c.v;
    // write faces (indices to verts and uvs)
    // https://github.com/mrdoob/three.js/wiki/JSON-Model-format-3
    var fi = i * 3;
    var arr = faces.array;
    // arr[fi]     = 2; // face type: face_vert_uvs
    arr[fi + 2] = a.vi; // reverse the order for correct normals
    arr[fi + 1] = b.vi;
    arr[fi + 0] = c.vi;
    // arr[fi + 4] = i;
    // arr[fi + 5] = i + 1;
    // arr[fi + 6] = i + 2;
  }

  geometry.addAttribute("position", verts);
  geometry.addAttribute("index", faces);
  geometry.addAttribute("uv", uvs);
  /*geometry.offsets = [
    {
      start: 0,
      index: 0,
      count: faces.length
    }
  ];*/

  // update geometry
  geometry.computeBoundingSphere();
  geometry.computeBoundingBox();

  return geometry;
}

/**
* Get a String representing the basic file information.
*/
QuakeWebTools.MDL.prototype.toString = function() {
  var str = "MDL: '" + this.filename + "' " + this.header.mdl_id;
  return str;
}

