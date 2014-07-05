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

QuakeWebTools.MDL.HEADER_T = [
  "mdl_id",         "string:4",                   // IDPO
  "mdl_version",    "int32",                      // 6
  "scale",          QuakeWebTools.MDL.VECTOR3_T,  // scale factors
  "origin",         QuakeWebTools.MDL.VECTOR3_T,  // origin
  "radius",         "float32",                    // bounding radius
  "offsets",        QuakeWebTools.MDL.VECTOR3_T,  // eyes position (player...) 
  "num_skins",      "int32",
  "skin_width",     "int32",
  "skin_height",    "int32",
  "num_verts",      "int32",
  "num_tris",       "int32",
  "num_frames",     "int32",
  "synch_type",     "int32",                      // 0 = synchronized, 1 = random
  "flags",          "int32",                      // 0
  "size",           QuakeWebTools.MDL.VECTOR3_T   // average triangle size...
];

QuakeWebTools.MDL.prototype.init = function() {
  var QWT = QuakeWebTools;
  var ds = new DataStream(this.ab, 0, DataStream.LITTLE_ENDIAN);

  // read header
  var header = ds.readStruct(QWT.MDL.HEADER_T);
  this.header = header;
  console.log(this.header);

  // read skins
  var name = QWT.FileUtil.getFilenameNoExtension(this.filename) + "_";
  var skin_size = header.skin_width * header.skin_height;
  for (var i = 0; i < header.num_skins; ++i) {
    var group = ds.readInt32();
    var image_data = QWT.ImageUtil.newImageData(name + i,
        header.skin_width, header.skin_height);
    if (group) {
      var image_group = [];
      var num = ds.readInt32();
      for (var j = 0; j < num; ++j) {
        var image_data = QWT.ImageUtil.newImageData(name + i + "|" + j,
            header.skin_width, header.skin_height);
      }
    } else {
      image_data.pixels = ds.readUint8Array(skin_size);
    }
  }
}

/**
* Get a String representing the basic file information.
*/
QuakeWebTools.MDL.prototype.toString = function() {
  var str = "MDL: '" + this.filename + "' " + this.header.mdl_id;
  return str;
}

