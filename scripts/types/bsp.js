/**
* Quake Web Tools Application.
*
* @module QuakeWebTools
*/
var QuakeWebTools = QuakeWebTools || {};


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

QuakeWebTools.BSP.ENTRY_T = [
    "offset",       "int32",
    "size",         "int32"
];

QuakeWebTools.BSP.HEADER_T = [
    "version",      "int32",    // most likely 29
    "entities",     QuakeWebTools.BSP.ENTRY_T,
    "planes",       QuakeWebTools.BSP.ENTRY_T,
    "miptex",       QuakeWebTools.BSP.ENTRY_T,
    "vertices",     QuakeWebTools.BSP.ENTRY_T,
    "visilist",     QuakeWebTools.BSP.ENTRY_T,
    "nodes",        QuakeWebTools.BSP.ENTRY_T,
    "faces",        QuakeWebTools.BSP.ENTRY_T,
    "lightmaps",    QuakeWebTools.BSP.ENTRY_T,
    "clipnodes",    QuakeWebTools.BSP.ENTRY_T,
    "leaves",       QuakeWebTools.BSP.ENTRY_T,
    "lface",        QuakeWebTools.BSP.ENTRY_T,
    "edges",        QuakeWebTools.BSP.ENTRY_T,
    "ledges",       QuakeWebTools.BSP.ENTRY_T,
    "models",       QuakeWebTools.BSP.ENTRY_T,
];

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

/**
* Initialize the BSP
*/
QuakeWebTools.BSP.prototype.init = function() {
    var ds = new DataStream(this.ab, 0, DataStream.LITTLE_ENDIAN);
    var trim = QuakeWebTools.FileUtil.trimNullTerminatedString;

    this.header = ds.readStruct(QuakeWebTools.BSP.HEADER_T);

    this.initMiptexDirectory(ds);
}

QuakeWebTools.BSP.prototype.initMiptexDirectory = function(ds) {
    // get offsets to each texture
    var base_offset = this.header.miptex.offset;
    ds.seek(base_offset);
    var miptex_offsets = ds.readStruct(QuakeWebTools.BSP.MIPTEX_DIRECTORY_T).offsets;

    // create entries
    var trim = QuakeWebTools.FileUtil.trimNullTerminatedString;
    var miptex_directory = [];
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

        miptex_directory[i] = entry;
    }

    this.miptex_directory = miptex_directory;
}

