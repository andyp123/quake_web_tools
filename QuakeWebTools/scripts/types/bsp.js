var QuakeWebTools = QuakeWebTools || {};

/*
TODO:
+ add vertex uvs
+ add face normals
+ generate materials for three.js
+ use three.js fps camera for viewing controls
*/

/**
* BSP file representation.
* @constructor
* @param {String} path - The path and filename.
* @param {ArrayBuffer} arraybuffer - The file data as an ArrayBuffer.
*/
QuakeWebTools.BSP = function(path, arraybuffer) {
  this.filename = QuakeWebTools.FileUtil.getFilename(path);
  this.ab = arraybuffer;

  this.init();
}

// 12 bytes
QuakeWebTools.BSP.VECTOR3_T = [
  "x",            "float32",
  "y",            "float32",
  "z",            "float32"
];

// 4 bytes
QuakeWebTools.BSP.EDGE_T = [
  "v1",           "uint16",
  "v2",           "uint16"
];

// 40 bytes
QuakeWebTools.BSP.TEXINFO_T = [
  "vec_s",        QuakeWebTools.BSP.VECTOR3_T,
  "dist_s",       "float32",
  "vec_t",        QuakeWebTools.BSP.VECTOR3_T,
  "dist_t",       "float32",
  "tex_id",       "uint32",
  "animated",     "uint32"
];

// 20 bytes
QuakeWebTools.BSP.FACE_T = [
  "plane_id",     "uint16",
  "side",         "uint16",
  "edge_id",      "int32",
  "num_edges",    "uint16",
  "texinfo_id",   "uint16",
  "light_type",   "uint8",
  "light_base",   "uint8",
  "light",        ["[]", "uint8", 2],
  "lightmap",     "int32"
];

// 24 bytes
QuakeWebTools.BSP.BBOX_T = [
  "min",          QuakeWebTools.BSP.VECTOR3_T,
  "max",          QuakeWebTools.BSP.VECTOR3_T
];

// 64 bytes
QuakeWebTools.BSP.MODEL_T = [
  "bbox",           QuakeWebTools.BSP.BBOX_T,
  "origin",         QuakeWebTools.BSP.VECTOR3_T,
  "node_id0",       "int32",
  "node_id1",       "int32",
  "node_id2",       "int32",
  "node_id3",       "int32",
  "num_leafs",      "int32",
  "face_id",        "int32",
  "num_faces",      "int32"
];

// 40 bytes
QuakeWebTools.BSP.MIPTEX_T = [
  "name",         "string:16",
  "width",        "int32",
  "height",       "int32",
  "ofs1",         "int32", // offsets to pixels
  "ofs2",         "int32",
  "ofs3",         "int32",
  "ofs4",         "int32"
];

QuakeWebTools.BSP.MIPTEX_DIRECTORY_T = [
  "num_miptex",   "int32",
  "offsets",      ["[]", "int32", function(struct, dataStream, type) { return struct.num_miptex; }]
];

QuakeWebTools.BSP.ENTRY_T = [
  "offset",       "int32",
  "size",         "int32"
];

QuakeWebTools.BSP.HEADER_T = [
  "version",      "int32",    // most likely 29, must check for !29
  "entities",     QuakeWebTools.BSP.ENTRY_T,
  "planes",       QuakeWebTools.BSP.ENTRY_T,
  "miptex",       QuakeWebTools.BSP.ENTRY_T,
  "vertices",     QuakeWebTools.BSP.ENTRY_T,
  "visilist",     QuakeWebTools.BSP.ENTRY_T,
  "nodes",        QuakeWebTools.BSP.ENTRY_T,
  "texinfos",     QuakeWebTools.BSP.ENTRY_T,
  "faces",        QuakeWebTools.BSP.ENTRY_T,
  "lightmaps",    QuakeWebTools.BSP.ENTRY_T,
  "clipnodes",    QuakeWebTools.BSP.ENTRY_T,
  "leaves",       QuakeWebTools.BSP.ENTRY_T,
  "lface",        QuakeWebTools.BSP.ENTRY_T,
  "edges",        QuakeWebTools.BSP.ENTRY_T,
  "ledges",       QuakeWebTools.BSP.ENTRY_T,
  "models",       QuakeWebTools.BSP.ENTRY_T,
];

/**
* Initialize the BSP.
*/
QuakeWebTools.BSP.prototype.init = function() {
  var ds = new DataStream(this.ab, 0, DataStream.LITTLE_ENDIAN);

  this.initHeader(ds);
  this.initMiptexDirectory(ds);
  this.initGeometry(ds);
}

/**
* Initialize the BSP header.
*/
QuakeWebTools.BSP.prototype.initHeader = function(ds) {
  var h = ds.readStruct(QuakeWebTools.BSP.HEADER_T);

  // get the number of each element. This used total_size / sizeof(type) in C.
  h.vertices.count = h.vertices.size / 12;
  h.edges.count = h.edges.size / 4;
  h.ledges.count = h.ledges.size / 4;
  h.faces.count = h.faces.size / 20;
  h.texinfos.count = h.texinfos.size / 40;
  h.models.count = h.models.size / 64;
  //h.planes.count
  //h.nodes.count
  //h.leaves.count
  //h.clipnodes.count

  this.header = h;

  if (h.version != 29) {
    throw "ERROR: BSP version " + this.header.version + " is currently unsupported.";
  }
}

/**
* Initialize the BSP geometry.
*/
QuakeWebTools.BSP.prototype.initGeometry = function(ds) {
  var geometry = {
    expanded: false
  };
  var h = this.header;

  ds.seek(h.vertices.offset);
  geometry.vertices = ds.readType(["[]", QuakeWebTools.BSP.VECTOR3_T, h.vertices.count]);

  ds.seek(h.edges.offset);
  geometry.edges = ds.readType(["[]",  QuakeWebTools.BSP.EDGE_T, h.edges.count]);

  ds.seek(h.faces.offset);
  geometry.faces = ds.readType(["[]", QuakeWebTools.BSP.FACE_T, h.faces.count]);

  ds.seek(h.texinfos.offset);
  geometry.texinfos = ds.readType(["[]", QuakeWebTools.BSP.TEXINFO_T, h.texinfos.count]);

  ds.seek(h.models.offset);
  geometry.models = ds.readType(["[]", QuakeWebTools.BSP.MODEL_T, h.models.count]);

  ds.seek(h.ledges.offset);
  geometry.edge_list = ds.readType(["[]", "int32", h.ledges.count]);

  this.geometry = this.expandGeometry(geometry);
}



QuakeWebTools.BSP.prototype.expandGeometry = function(geometry) {
  var models = [];

  for (var i = 0; i < geometry.models.length; ++i) {
    models[i] = this.expandModel(geometry, geometry.models[i]);
  }

  return {
    expanded: true,
    models: models
  };
}

QuakeWebTools.BSP.prototype.expandModel = function(geometry, model) {
  var face_id_lists = this.getFaceIdsPerTexture(geometry, model);
  var faces = geometry.faces;

  var geometries = [];

  for (var i in face_id_lists) {
    var miptex_entry = this.miptex_directory[i];
    var buffer_geometry = this.expandModelFaces(geometry, face_id_lists[i], miptex_entry);
    geometries[geometries.length] = {
      tex_id: i,
      geometry: buffer_geometry
    };
  }

  return { geometries: geometries };
}

QuakeWebTools.BSP.prototype.expandModelFaces = function(geometry, face_ids, miptex_entry) {
  var faces = geometry.faces;

  // get number of triangles required to build model
  var num_tris = 0;
  for (var i = 0; i < face_ids.length; ++i) {
    var face = faces[face_ids[i]];
    num_tris += face.num_edges - 2;
  }

  var verts = new Float32Array(num_tris * 9); // 3 vertices, xyz per tri
  var uvs = new Float32Array(num_tris * 6); // 3 uvs, uv per tri
  var verts_ofs = 0;
  
  for (var i = 0; i < face_ids.length; ++i) {
    var face = faces[face_ids[i]];
    verts_ofs = this.addFaceVerts(geometry, face, verts, uvs, verts_ofs, miptex_entry);
  }

  // build and return a three.js BufferGeometry
  var buffer_geometry = new THREE.BufferGeometry();
  buffer_geometry.attributes = {
    position: { itemSize: 3, array: verts },
    uv: { itemSize: 2, array: uvs }
  };
  buffer_geometry.computeBoundingSphere();

  return buffer_geometry;
}

/**
* Expand the raw geometry into something useable by THREE.js
*/
QuakeWebTools.BSP.prototype.getFaceIdsPerTexture = function(geometry, model) {
  var texinfos = geometry.texinfos;
  var faces = geometry.faces;

  var face_id_lists = {}; // important to note that this is a hash

  var start = model.face_id;
  var end = start + model.num_faces;
  for (var i = start; i < end; ++i) {
    var face = faces[i];
    var tex_id = texinfos[face.texinfo_id].tex_id;
    var face_ids = face_id_lists[tex_id] || [];
    face_ids[face_ids.length] = i;
    face_id_lists[tex_id] = face_ids;
  }

  return face_id_lists;
}

QuakeWebTools.BSP.prototype.addFaceVerts = function(geometry, face, verts, uvs, verts_ofs, miptex_entry) {
  var edge_list = geometry.edge_list;
  var edges = geometry.edges;
  var vertices = geometry.vertices;
  var texinfo = geometry.texinfos[face.texinfo_id];
  var tex_width = miptex_entry.width;
  var tex_height = miptex_entry.height;

  var vert_ids = [];
  var start = face.edge_id;
  var end = start + face.num_edges;

  var dot = function(a, b) {
    return (a.x * b.x + a.y * b.y + a.z * b.z);
  }

  for (var i = start; i < end; ++i) {
    var edge_id = edge_list[i];
    var edge = edges[Math.abs(edge_id)];
    if (edge_id > 0) {
      vert_ids[vert_ids.length] = edge.v1;
    } else {
      vert_ids[vert_ids.length] = edge.v2;
    }
  }

  var num_tris = vert_ids.length - 2;
  for (var i = 0; i < num_tris; ++i) {
    // reverse winding order to have correct normals
    var c = vert_ids[0];
    var b = vert_ids[i + 1];
    var a = vert_ids[i + 2];

    var vert, vi, uvi;
    vi = (verts_ofs + i) * 9;
    uvi = (verts_ofs + i) * 6;
    vert = vertices[a];
    verts[vi]     = vert.x;
    verts[vi + 1] = vert.y;
    verts[vi + 2] = vert.z;
    uvs[uvi]     =  (dot(vert, texinfo.vec_s) + texinfo.dist_s) / tex_width;
    uvs[uvi + 1] = -(dot(vert, texinfo.vec_t) + texinfo.dist_t) / tex_height;

    vert = vertices[b];
    verts[vi + 3] = vert.x;
    verts[vi + 4] = vert.y;
    verts[vi + 5] = vert.z;
    uvs[uvi + 2] =  (dot(vert, texinfo.vec_s) + texinfo.dist_s) / tex_width;
    uvs[uvi + 3] = -(dot(vert, texinfo.vec_t) + texinfo.dist_t) / tex_height;

    vert = vertices[c];
    verts[vi + 6] = vert.x;
    verts[vi + 7] = vert.y;
    verts[vi + 8] = vert.z;
    uvs[uvi + 4] =  (dot(vert, texinfo.vec_s) + texinfo.dist_s) / tex_width;
    uvs[uvi + 5] = -(dot(vert, texinfo.vec_t) + texinfo.dist_t) / tex_height;
  }

  return verts_ofs + i; // next position in verts
}

/**
* Initialise the mip texture directory.
*/
QuakeWebTools.BSP.prototype.initMiptexDirectory = function(ds) {
  var IU = QuakeWebTools.ImageUtil;

  // get offsets to each texture
  var base_offset = this.header.miptex.offset;
  ds.seek(base_offset);
  var miptex_offsets = ds.readStruct(QuakeWebTools.BSP.MIPTEX_DIRECTORY_T).offsets;

  // create entries
  var trim = QuakeWebTools.FileUtil.trimNullTerminatedString;
  var miptex_directory = [];
  var garbage_entries = 0;
  for (var i = 0; i < miptex_offsets.length; ++i) {
    var offset = base_offset + miptex_offsets[i];

    ds.seek(offset);
    var miptex = ds.readStruct(QuakeWebTools.BSP.MIPTEX_T);

    var entry = {
      offset: offset,
      dsize: (miptex.width * miptex.height),
      size: (miptex.width * miptex.height),
      type: "D".charCodeAt(0),
      compression: 0,
      name: trim(miptex.name),
      // additional parameters useful for generating uvs
      width: miptex.width,
      height: miptex.height
    };

    if (entry.name == "") {
      garbage_entries += 1;
      console.log("Warning: BSP miptex entry at index " + i + " is unreadable. Name: '" +  miptex.name + "'");
      console.log(entry);
    } else {
      miptex_directory[i - garbage_entries] = entry;
    }
  }

  this.miptex_directory = miptex_directory;
}

/**
* Generate an array of THREE.js materials and return them
*/
QuakeWebTools.BSP.prototype.getThreeMaterialDirectory = function() {
  if (this.materials === undefined) {
    var QWT = QuakeWebTools;

    var materials = [];

    for (var i in this.miptex_directory) {
      var entry = this.miptex_directory[i];
      var image_data = QWT.ImageUtil.getImageData(entry.name, this.ab, entry);
      var data = QWT.ImageUtil.expandImageData(image_data, QWT.DEFAULT_PALETTE, null, true);
      var texture = new THREE.DataTexture(data, image_data.width, image_data.height, THREE.RGBAFormat);
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.needsUpdate = true;
      materials[i] = new THREE.MeshBasicMaterial({ map: texture });
    }

    this.materials = materials;
  }

  return this.materials;
}

/**
* Get a String representing the basic file information.
*/
QuakeWebTools.BSP.prototype.toString = function() {
  var str = "BSP: '" + this.filename + "' Version " + this.header.version + ", "
      + this.miptex_directory.length + " miptex in lump";
  return str;
}