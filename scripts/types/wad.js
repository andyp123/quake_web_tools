/**
* Quake Web Tools Application.
*
* @module QuakeWebTools
*/
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

    this.initHeader();
    this.initDirectory();
}

QuakeWebTools.WAD.TYPE_PALETTE = "@".charCodeAt(0);
QuakeWebTools.WAD.TYPE_STATUS  = "B".charCodeAt(0);
QuakeWebTools.WAD.TYPE_MIPTEX  = "D".charCodeAt(0);
QuakeWebTools.WAD.TYPE_CONSOLE = "E".charCodeAt(0);

/**
* Initialize the WAD header.
*/
QuakeWebTools.WAD.prototype.initHeader = function() {
    var data = new DataView(this.ab);
    var header = {};
    var le = true; // little endian

    header.wad_id = QuakeWebTools.FileUtil.getString(data, 0, 4, le);
    header.dir_entries = data.getInt32(4, le);
    header.dir_offset = data.getInt32(8, le);
    header.dir_size = header.dir_entries * 32; // size of directory entry is 32 bytes

    this.header = header;
}

/*
* Initialize the WAD directory.
*/
QuakeWebTools.WAD.prototype.initDirectory = function() {
    var data = new DataView(this.ab, this.header.dir_offset, this.header.dir_size);
    var directory = [];
    var le = true; // little endian

    var getString = QuakeWebTools.FileUtil.getString;

    for (var i = 0; i < this.header.dir_entries; ++i) {
        var entry = {};
        var byteofs = i * 32;

        entry.offset = data.getInt32(byteofs, le);      byteofs += 4;
        entry.dsize = data.getInt32(byteofs, le);       byteofs += 4;
        entry.size = data.getInt32(byteofs, le);        byteofs += 4;
        entry.type = data.getUint8(byteofs, le);        byteofs += 1;
        entry.compression = data.getUint8(byteofs, le); byteofs += 3; // compression is 1 byte, but there are also 2 bytes of padding
        entry.name = getString(data, byteofs, 16, le);

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

/**
* Decode all the images and add them to the current page.
* @param {PAL} palette - The palette file to use for image decoding.
*/
QuakeWebTools.WAD.prototype.generateHTMLPreview = function(palette) {
    var fragment = new DocumentFragment();
    var IU = QuakeWebTools.ImageUtil;

    for (var i = 0; i < this.directory.length; ++i) {
        var entry = this.directory[i];
        var image_data = IU.getImageData(entry.name, this.ab, entry);
        var img = IU.expandImageData(image_data, palette);
            img.title = entry.name + " (" + image_data.width + "x" + image_data.height + ", " + entry.size + " bytes)";
            img.download = name + ".png";
        var div = document.createElement("div");
        div.appendChild(img);
        div.innerHTML += "<p style=\"position:relative;top:" + -(img.height + 8) + ";left:" + (img.width + 8) + "\">"
                       + entry.name + "<br>(" + image_data.width + "x" + image_data.height +")<br>" + entry.size + " bytes</p>";
        fragment.appendChild(div);
    }

    document.getElementById("main").appendChild(fragment);
}