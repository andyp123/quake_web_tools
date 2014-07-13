var QuakeWebTools = QuakeWebTools || {};

/**
* MDL file representation.
* @constructor
* @param {String} path The path and filename.
* @param {ArrayBuffer} arraybuffer The file data as an ArrayBuffer.
*/
QuakeWebTools.MDL = function(path, arraybuffer) {
  this.filename = QuakeWebTools.FileUtil.getFilename(path);
  this.ab = arraybuffer;
  
  this.init();
}

QuakeWebTools.MDL.VECTOR3_T = [
  "x",                "float32",
  "y",                "float32",
  "z",                "float32"
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
        num_skins: num_skins,
        times: ds.readType(["[]", "float32", num_skins])
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

  // read geometry
  var geometry = {
    expanded: false
  };

  // read skin verts and triangles
  geometry.skin_verts = ds.readType(["[]", QWT.MDL.SKINVERT_T, this.header.num_verts]);
  geometry.triangles = ds.readType(["[]", QWT.MDL.TRIANGLE_T, this.header.num_tris]);

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
  geometry.frames = frames;
  geometry.frame_groups = frame_groups;

  this.geometry = this.expandGeometry(geometry);
  this.animations = this.detectAnimations();
}

QuakeWebTools.MDL.prototype.expandGeometry = function(geometry) {
  var triangles = geometry.triangles;
  var skin_verts = geometry.skin_verts;
  var num_tris = triangles.length;
  var sw = this.header.skin_width;
  var sh = this.header.skin_height;

  // expand uvs
  var uvs = new Float32Array(num_tris * 6); // 3 per face, size 2 (u, v)
  for (var i = 0; i < num_tris; ++i) {
    var t = triangles[i];
    var ff = t.front_facing;
    var a = t.vert_indices[0];
    var b = t.vert_indices[1];
    var c = t.vert_indices[2];

    var idx, uv;
    idx = i * 6;
    uv = skin_verts[c];
    uvs[idx + 0] = (!ff && uv.onseam) ? uv.s / sw + 0.5 : uv.s / sw;
    uvs[idx + 1] = 1 - uv.t / sh; // uvs are upside down so invert
    uv = skin_verts[b];
    uvs[idx + 2] = (!ff && uv.onseam) ? uv.s / sw + 0.5 : uv.s / sw;
    uvs[idx + 3] = 1 - uv.t / sh;
    uv = skin_verts[a];
    uvs[idx + 4] = (!ff && uv.onseam) ? uv.s / sw + 0.5 : uv.s / sw;
    uvs[idx + 5] = 1 - uv.t / sh;
  }

  // expand frames
  var sx = this.header.scale.x;
  var sy = this.header.scale.y;
  var sz = this.header.scale.z;
  var ox = this.header.scale_origin.x;
  var oy = this.header.scale_origin.y;
  var oz = this.header.scale_origin.z;

  var frames = geometry.frames;
  var new_frames = [];
  for (var j = 0; j < frames.length; ++j) {
    var f = frames[j];
    var verts = new Float32Array(num_tris * 9); // 3 per face, size 3 (x, y, z)

    for (var i = 0; i < num_tris; ++i) {
      var t = triangles[i];
      var a = t.vert_indices[0];
      var b = t.vert_indices[1];
      var c = t.vert_indices[2];

      var idx, vert;
      idx = i * 9;
      vert = f.verts[c];
      verts[idx + 0] = vert.x * sx + ox;
      verts[idx + 1] = vert.y * sy + oy;
      verts[idx + 2] = vert.z * sz + oz;
      vert = f.verts[b];
      verts[idx + 3] = vert.x * sx + ox;
      verts[idx + 4] = vert.y * sy + oy;
      verts[idx + 5] = vert.z * sz + oz;
      vert = f.verts[a];
      verts[idx + 6] = vert.x * sx + ox;
      verts[idx + 7] = vert.y * sy + oy;
      verts[idx + 8] = vert.z * sz + oz;
    }

    new_frames[j] = {
      name: f.name,
      verts: verts
    };
  }

  return {
    uvs: uvs,
    frames: new_frames,
    frame_groups: geometry.frame_groups,
    expanded: true
  };
}

QuakeWebTools.MDL.prototype.detectAnimations = function() {
  var anims = {};
  var frames = this.geometry.frames;

  var notNumber = function(charcode) {
    return (charcode < 48 || charcode > 57);
  } 

  for (var i = 0; i < frames.length; ++i) {
    var name = frames[i].name;
    for (var c = name.length - 1; c >= 0; --c) {
      if (notNumber(name.charCodeAt(c))) break;
    }
    var name_base = name.substring(0, c + 1);
    var anim = anims[name_base];
    if (anim === undefined) {
      anims[name_base] = {
        start: i,
        length: 1
      }
    } else {
      anim.length += 1;
    }
  }

  return anims;
}

QuakeWebTools.MDL.prototype.getAverageCenter = function(frame_id) {
  frame_id = frame_id || 0;
  var verts = this.geometry.frames[0].verts;
  var average = {x: 0, y: 0, z: 0};

  var limit = Math.floor(verts.length / 3);
  for (var i = 0; i < limit; ++i) {
    var vi = i * 3;
    average.x += verts[vi];
    average.y += verts[vi + 1];
    average.z += verts[vi + 2];
  }

  average.x /= limit;
  average.y /= limit;
  average.z /= limit;

  return average;
}

QuakeWebTools.MDL.prototype.toThreeMaterial = function(skin_id) {
  var QWT = QuakeWebTools;

  skin_id = skin_id || 0;
  var skin = this.skins[skin_id];

  // for data texture format, see THREE.ImageUtils.generateDataTexture
  var data = QWT.ImageUtil.expandImageData(skin, QWT.DEFAULT_PALETTE, null, true);
  var texture = new THREE.DataTexture(data, this.header.skin_width, this.header.skin_height, THREE.RGBAFormat);
  texture.needsUpdate = true;

  return new THREE.MeshBasicMaterial({ map: texture });
}

QuakeWebTools.MDL.prototype.toThreeBufferGeometry = function() {
  var geometry = new THREE.BufferGeometry();
  geometry.attributes = {
    position: { itemSize: 3, array: new Float32Array(this.geometry.frames[0].verts.length) },
    uv: { itemSize: 2, array: this.geometry.uvs }
  }

  this.setBufferGeometryFrame(geometry, 0);

  geometry.computeBoundingSphere();
  geometry.computeBoundingBox();

  return geometry;
}

QuakeWebTools.MDL.prototype.setBufferGeometryFrame = function(geometry, frame_id) {
  var verts = this.geometry.frames[frame_id].verts;
  var vertsb = geometry.attributes.position.array;

  for (var i = 0; i < verts.length; ++i) {
    vertsb[i] = verts[i];
  }

  geometry.attributes.position.needsUpdate = true;
}

QuakeWebTools.MDL.prototype.blendBufferGeometryFrame = function(geometry, frame_id_float) {
  var frames = this.geometry.frames;

  var frame_id = Math.floor(frame_id_float);
  var t = frame_id_float - frame_id;
  var verts1 = frames[frame_id].verts;
  var verts2 = frames[(frame_id + 1) % frames.length].verts;
  var vertsb = geometry.attributes.position.array;

  for (var i = 0; i < vertsb.length; ++i) {
    vertsb[i] = verts1[i] + (verts2[i] - verts1[i]) * t;
  }

  geometry.attributes.position.needsUpdate = true;
}

/**
* Get a String representing the basic file information.
*/
QuakeWebTools.MDL.prototype.toString = function() {
  var str = "MDL: '" + this.filename + "' " + this.header.mdl_id;
  return str;
}

