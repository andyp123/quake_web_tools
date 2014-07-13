var QuakeWebTools = QuakeWebTools || {};

/*
need to parse bsp and organise into geometry sutiable for displaying with
three.js buffer geometries. Note that what will probably need to happen is
for it to be separated into different buffers by texture, unless I can figure
out how to get multiple materials on one BufferGeometry.

Mesh preprocessing must deal with this.
1. generate list of textures.
NOTE: currently skipping indexed materials that are corrupted. They need replacing
with a default texture instead, in order to keep the indices correct!
2. calculate num_tris PER MATERIAL.
This allows buffer of the correct size to be allocated.
3. Allocate buffers in an array mirroring the materials array
4. Iterate polygons and


use three fps camera for viewing controls

file type idea:
completely OT, but how about a binary file with an UTF-8 JSON header that
defines the file structure. This way the header is readable and the data is
nicely compressed and structured.
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

  this.header = null;
  this.directory = null;

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

  console.log(this);
}

/**
* Initialize the BSP header.
*/
QuakeWebTools.BSP.prototype.initHeader = function(ds) {
  var h = ds.readStruct(QuakeWebTools.BSP.HEADER_T);

  // get the number of each element. This used total_size / sizeof(type) in C.
  h.vertices.count = h.vertices.size / 12;
  h.edges.count = h.edges.size / 4;
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
  geometry.edge_list = ds.readType(["[]", "int32", h.edges.count]);

  this.geometry = this.expandGeometry(geometry);
}

/**
* Expand the raw geometry into something useable by THREE.js
*/
QuakeWebTools.BSP.prototype.expandGeometry = function(geometry) {
  return geometry;
}

/**
* Initialise the mip texture directory.
*/
QuakeWebTools.BSP.prototype.initMiptexDirectory = function(ds) {
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
      name: trim(miptex.name)
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
* Get a String representing the basic file information.
*/
QuakeWebTools.BSP.prototype.toString = function() {
  var str = "BSP: '" + this.filename + "' Version " + this.header.version + ", "
      + this.miptex_directory.length + " miptex in lump";
  return str;
}