var QuakeWebTools = QuakeWebTools || {};

/**
* WAD file representation.
* @constructor
* @param {String} path - The path and filename.
* @param {ArrayBuffer} arraybuffer - The file data as an ArrayBuffer.
*/
QuakeWebTools.WAD = function(path, arraybuffer) {
  this.filename = QuakeWebTools.FileUtil.getFilename(path);
  this.ab = arraybuffer;

  this.header = null;
  this.directory = null;

  this.init();
}

QuakeWebTools.WAD.HEADER_T = [
  "wad_id",       "string:4",
  "dir_entries",  "int32",
  "dir_offset",   "int32"
];

QuakeWebTools.WAD.ENTRY_T = [
  "offset",       "int32",
  "dsize",        "int32",
  "size",         "int32",
  "type",         "uint8",
  "compression",  "uint8",
  "padding",      "uint16",
  "name",         "string:16"
];

QuakeWebTools.WAD.TYPE_PALETTE = "@".charCodeAt(0);
QuakeWebTools.WAD.TYPE_STATUS  = "B".charCodeAt(0);
QuakeWebTools.WAD.TYPE_MIPTEX  = "D".charCodeAt(0);
QuakeWebTools.WAD.TYPE_CONSOLE = "E".charCodeAt(0);

/**
* Initialize the WAD.
*/
QuakeWebTools.WAD.prototype.init = function() {
  var ds = new DataStream(this.ab, 0, DataStream.LITTLE_ENDIAN);

  this.header = ds.readStruct(QuakeWebTools.WAD.HEADER_T);
  this.header.dir_size = this.header.dir_entries * 32; // size of ENTRY_T is 32 bytes

  var trim = QuakeWebTools.FileUtil.trimNullTerminatedString;
  var directory = [];
  var ENTRY_T = QuakeWebTools.WAD.ENTRY_T;
  ds.seek(this.header.dir_offset);
  for (var i = 0; i < this.header.dir_entries; ++i) {
    var entry = ds.readStruct(ENTRY_T);
    entry.name = trim(entry.name);
    directory[i] = entry;
  }
  this.directory = directory;
}

/**
* Find an entry from the WAD directory and return it.
* @param {String} name - The name of the entry (e.g. 'city5_7').
* @return {WADEntry} The entry or null if not found.
*/
QuakeWebTools.WAD.prototype.findEntryByName = function(name) {
  for (var i = 0; i < this.directory.length; ++i) {
    var entry = this.directory[i];
    if (entry.name == name) {
      return entry;
    }
  }

  return null;
}

/**
* Get a String representing the basic file information.
*/
QuakeWebTools.WAD.prototype.toString = function() {
  var str = "WAD: '" + this.filename + "' " + this.header.wad_id + " (" + this.header.dir_entries + ")";
  return str;
}

/**
* Get a String representing the file content.
* @param {Bool} verbose - If true, use verbose output.
* @param {Bool} use_br - If true, line breaks will be in HTML format using '<BR>'.
* @return {String} A String of the directory content.
*/
QuakeWebTools.WAD.prototype.toString_ListContents = function(verbose, use_br) {
  var str = "";
  var newline = (use_br) ? "<br>" : "\n";

  for (var i = 0; i < this.directory.length; ++i) {
    var entry = this.directory[i];
    str += i + ": " + entry.name;
    if (verbose) {
      str += " (offset=" + entry.offset
           + ", dsize=" + entry.dsize
           + ", size=" + entry.size
           + ", type=" + String.fromCharCode(entry.type)
           + ", compression=" + entry.compression + ")";
    }
    str += newline;
  }

  return str;
}
