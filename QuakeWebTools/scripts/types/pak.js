var QuakeWebTools = QuakeWebTools || {};

/**
* PAK file representation.
* @constructor
* @param {String} path - The path and filename.
* @param {ArrayBuffer} arraybuffer - The file data as an ArrayBuffer.
*/
QuakeWebTools.PAK = function(path, arraybuffer) {
  this.filename = QuakeWebTools.FileUtil.getFilename(path);
  this.ab = arraybuffer;

  this.header = null;
  this.directory = null;

  this.init();
}

QuakeWebTools.PAK.HEADER_T = [
  "pak_id",       "string:4", // "PACK"
  "dir_offset",   "int32",
  "dir_size",     "int32"
];

QuakeWebTools.PAK.ENTRY_T = [
  "path",         "string:56",
  "offset",       "int32",
  "size",         "int32"
];

/**
* Initialize the PAK.
*/
QuakeWebTools.PAK.prototype.init = function() {
  var ds = new DataStream(this.ab, 0, DataStream.LITTLE_ENDIAN);

  this.header = ds.readStruct(QuakeWebTools.PAK.HEADER_T);
  this.header.dir_entries = this.header.dir_size / 64; // size of ENTRY_T is 64 bytes

  var trim = QuakeWebTools.FileUtil.trimNullTerminatedString;
  var directory = [];
  var ENTRY_T = QuakeWebTools.PAK.ENTRY_T;
  ds.seek(this.header.dir_offset);
  for (var i = 0; i < this.header.dir_entries; ++i) {
    var entry = ds.readStruct(ENTRY_T);
    entry.path = trim(entry.path); // must trim the string because DataStream.js leaves it 0 padded
    directory[i] = entry;
  }
  this.directory = directory;
}

/**
* Find an entry from the PAK directory and return it.
* @param {String} path - The path to the file (e.g. 'maps/e1m1.bsp').
* @return {PAKEntry} The file entry or null if not found.
*/
QuakeWebTools.PAK.prototype.findEntryByPath = function(path) {
  for (var i = 0; i < this.directory.length; ++i) {
    var entry = this.directory[i];
    if (path == entry.path) {
      return entry;
    }
  }

  return null;
}

/**
* Get file data from the PAK.
* @param {PAKEntry} entry - The entry to be retrieved.
* @return {ArrayBuffer} The file data.
*/
QuakeWebTools.PAK.prototype.getEntryData = function(entry) {
  return this.ab.slice(entry.offset, entry.offset + entry.size);
}

QuakeWebTools.PAK.prototype.saveEntryAsFile = function(entry) {
  var file_data = this.getEntryData(entry);
  var file_blob = new Blob([file_data]);
  var filename = entry.path;
  var path_separator = filename.lastIndexOf("/");
  if (path_separator != -1) {
    filename = filename.substring(path_separator + 1);
  }
  var a = document.createElement("a");
  a.download = filename;
  a.href = window.URL.createObjectURL(file_blob);
  a.click();
}

QuakeWebTools.PAK.prototype.getDownloadLink = function(entry) {
  var that = this;
  var a = document.createElement("a");
  a.href = "#" + entry.path;
  a.innerHTML = entry.path;// + " (" + entry.size + " bytes)";
  a.onclick = (function() { that.saveEntryAsFile(entry); });
  return a;
}

QuakeWebTools.PAK.prototype.generateFileLinks = function(element_id) {
  var directory = this.directory;

  // create div of links to files in the pak
  var ul = document.createElement("ol");
  for (var j = 0; j < directory.length; ++j) {
    var li = document.createElement("li");
    var a = this.getDownloadLink(directory[j]);
    li.appendChild(a);
    ul.appendChild(li);
  }

  var element = document.getElementById(element_id);
  if (element) {
    element.appendChild(ul);
  } else {
    document.body.appendChild(ul);
  }
}

/**
* Get a String representing the basic file information.
*/
QuakeWebTools.PAK.prototype.toString = function() {
  var str = "PAK: '" + this.filename + "' " + this.header.pak_id + " (" + this.header.dir_entries + ")";
  return str;
}

/**
* Get a String representing the file content.
* @param {Bool} verbose - If true, use verbose output.
* @param {Bool} use_br - If true, line breaks will be in HTML format using '<BR>'.
* @return {String} A String of the directory content
*/
QuakeWebTools.PAK.prototype.toString_ListContents = function(verbose, use_br) {
  var str = "";
  var newline = (use_br) ? "<br>" : "\n";

  for (var i = 0; i < this.directory.length; ++i) {
    var entry = this.directory[i];
    str += i + ": " + entry.path;
    if (verbose) {
      str += " (offset=" + entry.offset +  ", size=" + entry.size + ")";
    }
    str += newline;
  }

  return str;
}
