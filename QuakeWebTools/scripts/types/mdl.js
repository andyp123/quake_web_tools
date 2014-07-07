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

  console.log(this);
}

/**
* Get a String representing the basic file information.
*/
QuakeWebTools.MDL.prototype.toString = function() {
  var str = "MDL: '" + this.filename + "' " + this.header.mdl_id;
  return str;
}

