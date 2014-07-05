var QuakeWebTools = QuakeWebTools || {};

/**
* Library to simplify dealing with files
* @static
*/
QuakeWebTools.FileUtil = {};

/** 
* Get the constructor for a file type object from its associated extension.
* @param {String} type File type.
* @return {function} A constructor function or null 
*/
QuakeWebTools.FileUtil.getFileObject = function(type, path, arraybuffer) {
  var FU = QuakeWebTools.FileUtil;
  FU.NATIVE_TYPES = FU.NATIVE_TYPES || {
    "pak": QuakeWebTools.PAK,
    "wad": QuakeWebTools.WAD,
    "bsp": QuakeWebTools.BSP,
    "lmp": QuakeWebTools.LMP,
    "spr": QuakeWebTools.SPR,
    "pal": QuakeWebTools.PAL,
    "mdl": QuakeWebTools.MDL,
    //"map": QuakeWebTools.MAP,
  };

  var constructor = FU.NATIVE_TYPES[type];
  if (constructor !== undefined) {
    return new constructor(path, arraybuffer);
  }

  return null;
};

/**
* Read a null-terminated string of maximum length from a dataview
* @param {DataView} dataview - The DataView (or ArrayBuffer) to read characters from.
* @param {Number} offset - Initial offset into the data view.
* @param {Number} length - Number of bytes to read.
* @static
*/
QuakeWebTools.FileUtil.getString = function(dataview, offset, length) {
  var str = "";

  for (var i = 0; i < length; ++i) {
    var charcode = dataview.getUint8(offset + i);
    if (charcode == 0) break;
    str += String.fromCharCode(charcode);
  }

  return str;
}

/**
* Trims a null-terminated string to get rid off extra garbage characters
* @static
*/
QuakeWebTools.FileUtil.trimNullTerminatedString = function(str) {
  for (var i in str) {
    if (str.charCodeAt(i) == 0) {
      return str.substring(0, i);
    }
  }
  return str;
}

/**
* Get just the filename component of a path.
* @param {String} path File path.
* @return {String} The filename. This assumes there might be no extension.
* @static
*/
QuakeWebTools.FileUtil.getFilename = function(path) {
  var index = path.lastIndexOf("/");

  if (index != -1) {
    return path.substring(index + 1);
  }
  return path;
}

/**
* Get only the filename. No extension or directory.
* @param {String} path File path.
* @return {String} The filename.
* @static 
*/
QuakeWebTools.FileUtil.getFilenameNoExtension = function(path) {
  var index = path.lastIndexOf(".");
  if (index != -1) {
    path = path.substring(0, index);
  }

  index = path.lastIndexOf("/");
  if (index != -1) {
    path = path.substring(index + 1);
  }

  return path;
}

/**
* Get just the directory component of a path.
* @param {String} path File path.
* @return {String} The directory or "" if there is none.
* @static
*/
QuakeWebTools.FileUtil.getDirectory = function(path) {
  var index = path.lastIndexOf(".");
      
  if (index != -1) {
    index = path.lastIndexOf("/");
    return (index != -1) ? path.substring(0, index + 1) : "";
  }
  return path;
}

/**
* Get just the file extension from a path.
* @param {String} path File path.
* @return {String} The file extension or "" if there is none.
* @static
*/
QuakeWebTools.FileUtil.getExtension = function(path) {
  var index = path.lastIndexOf(".");

  if (index != -1) {
    return path.substring(index + 1).toLowerCase(); // for comparisons
  }
  return "";
}

// TODO: remove this function?
/**
* Splits a string containing a path, filename and extension into components. Components
* not present in the path will be left as empty strings.
* @param {String} path - A path to a file.
* @returns {Object} Returns an object in the form {path, filename, extension}
* @static
*/
QuakeWebTools.FileUtil.getDirectoryFilenameExtension = function(path) {
  var rv = {path: "", filename:"", extension:""};    
  var index_dot = path.lastIndexOf(".");
  var index_slash = path.lastIndexOf("/");

  if (index_dot != -1) {
    rv.extension = path.substring(index_dot + 1);
    path = path.substring(0, index_dot);
    if (index_slash != -1) {
      rv.filename = path.substring(index_slash + 1);
      rv.path = path.substring(0, index_slash + 1);
    } else {
      rv.filename = path;
    }
  } else {
    rv.path = path;
  }

  return rv;
}

/**
* Simple file loading helper.
*/
QuakeWebTools.FileUtil.getFile = function(path, responseType, callback) {
  var result = {
    path: path,
    data: undefined,
    status: "queued"
  };

  var req = new XMLHttpRequest();
  req.open("GET", path, true);
  req.responseType = responseType;
  req.onload = function(e) {
    result.data = req.response;
    result.status = "loaded";
    console.log("loaded: " + path);
    callback();
  };
  req.send(); // async

  return result;
}
