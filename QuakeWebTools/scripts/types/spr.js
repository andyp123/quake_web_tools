var QuakeWebTools = QuakeWebTools || {};

/**
* SPR file representation.
* @constructor
* @param {String} path - The path and filename.
* @param {ArrayBuffer} arraybuffer - The file data as an ArrayBuffer.
*/
QuakeWebTools.SPR = function(path, arraybuffer) {
  this.filename = QuakeWebTools.FileUtil.getFilename(path);
  this.ab = arraybuffer;

  this.header = null;
  this.frame_groups = null;

  this.init();
}

QuakeWebTools.SPR.PICTURE_T = [
  "offset_x",     "int32",
  "offset_y",     "int32",
  "width",        "int32",
  "height",       "int32",
  "pixels",       ["[]", "uint8", function(struct, dataStream, type) { return struct.width * struct.height; }]
];

QuakeWebTools.SPR.FRAME_T = [
  "frames",       ["[]", QuakeWebTools.SPR.PICTURE_T, 1]
];

QuakeWebTools.SPR.FRAMEGROUP_T = [
  "num_frames",   "int32",
  "times",        "float32",
  "frames",       ["[]", QuakeWebTools.SPR.PICTURE_T, function(struct, dataStream, type) { return struct.num_frames; }]
];

QuakeWebTools.SPR.HEADER_T = [
  "spr_id",       "string:4", // "IDSP"
  "spr_version",  "int32",    // 1
  "type",         "int32",    // type
                              //    0 = vp parallel upright
                              //    1 = facing upright
                              //    2 = vp parallel
                              //    3 = oriented
                              //    4 = vp parallel oriented
  "radius",       "float32",  // bounding radius
  "max_width",    "int32",
  "max_height",   "int32",
  "num_frames",   "int32",
  "beam_length",  "float32",  // ?
  "sync_type",    "int32"     // 0 = synchronized, 1 = random
];

/**
* Initialize the SPR.
*/
QuakeWebTools.SPR.prototype.init = function() {
  var ds = new DataStream(this.ab, 0, DataStream.LITTLE_ENDIAN);

  this.header = ds.readStruct(QuakeWebTools.SPR.HEADER_T);

  var frames = [];
  var frame_groups = [];
  while (!ds.isEof()) {
    var frame_type = ds.readInt32();
    var group;
    if (frame_type) {
      group = ds.readStruct(QuakeWebTools.SPR.FRAMEGROUP_T);
    } else {
      group = ds.readStruct(QuakeWebTools.SPR.FRAME_T);
    }

    var group_frames = group.frames;
    for (var i = 0; i < group_frames.length; ++i) {
      frames[frames.length] = group_frames[i];
    }
    if (group_frames.length > 1) {
      group.index = frames.length - group_frames.length;
      frame_groups[frame_groups.length] = group;
      delete group.frames;
    }
  }
  this.frames = frames;
  this.frame_groups = frame_groups;
}

// get all frame images in image_data form
QuakeWebTools.SPR.prototype.getImageData = function() {
  var IU = QuakeWebTools.ImageUtil;
  var image_datas = [];
  var frames = this.frames;
  var name = this.filename + "_";

  for (var i = 0; i < frames.length; ++i) {
    var frame = frames[i];
    var image_data = IU.newImageData(name + i, frame.width, frame.height);
    image_data.pixels = frame.pixels;
    image_datas[i] = image_data;
  }

  return image_datas;
}


