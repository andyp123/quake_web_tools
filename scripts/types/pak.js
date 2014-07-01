/**
* Quake Web Tools Application.
*
* @module QuakeWebTools
*/
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

    this.initHeader();
    this.initDirectory();
}

/**
* Initialize the PAK header
*/
QuakeWebTools.PAK.prototype.initHeader = function() {
    var data = new DataView(this.ab);
    var header = {};
    var le = true; // little endian

    header.pak_id = QuakeWebTools.FileUtil.getString(data, 0, 4, le);
    header.dir_offset = data.getInt32(4, le);
    header.dir_size = data.getInt32(8, le);
    header.dir_entries = header.dir_size / 64; // size of directory entry is 64 bytes

    this.header = header;
}

/**
* Initialize the PAK directory
*/
QuakeWebTools.PAK.prototype.initDirectory = function() {
    var data = new DataView(this.ab, this.header.dir_offset, this.header.dir_size);
    var directory = [];
    var le = true; // little endian

    var getString = QuakeWebTools.FileUtil.getString;

    for (var i = 0; i < this.header.dir_entries; ++i) {
        var entry = {};
        var byteofs = i * 64;

        entry.path = getString(data, byteofs, 56, le);  byteofs += 56;
        entry.offset = data.getInt32(byteofs, le);      byteofs += 4;
        entry.size = data.getInt32(byteofs, le);

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
    var a = document.createElement("a");
        a.href = "#" + entry.path;
        a.innerHTML = entry.path;// + " (" + entry.size + " bytes)";
        var that = this;
        a.onclick = (function() { that.saveEntryAsFile(entry); });
    return a;
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
            str += " (offset=" + entry.offset
                 + ", size=" + entry.size + ")";
        }
        str += newline;
    }

    return str;
}