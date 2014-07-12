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
* Split a path into an object containing the components of the path.
* Assumes the path points to a file, so the returned components will always
* have a filename parameter, even for a string like "CONCHARS".
* @param {String} path The path to process.
* @return {Object} The processed path.
* @static
*/
QuakeWebTools.FileUtil.getPathComponents = function(path) {
  var components = {
    full_path: path,
    path_root: "",
    filename: "",
    extension: ""
  }
  var index_dot = path.lastIndexOf(".");
  if (index_dot != -1) {
    components.extension = path.substring(index_dot + 1);
    path = path.substring(0, index_dot);
  }
  var index_slash = path.lastIndexOf("/");
  if (index_slash != -1) {
    components.path_root = path.substring(0, index_slash + 1);
    path = path.substring(index_slash + 1);
  }
  components.filename = path;

  return components;
}

/**
* Split a path into a list of path components; One for each sub path.
* Sub paths are denoted by the | character.
* @param {String} path The path to process.
* @return {Object} The processed path.
* @static
*/
QuakeWebTools.FileUtil.getPathInfo = function(path) {
  var path_info = {
    full_path: path,
    sub_paths: []
  };

  // split by |
  var path_strings = [];
  var split_index = path.indexOf("|");
  while (split_index != -1) {
    path_strings[path_strings.length] = path.substring(0, split_index);
    path = path.substring(split_index + 1);
    split_index = path.indexOf("|");
  }
  path_strings[path_strings.length] = path;

  var getPathComponents = QuakeWebTools.FileUtil.getPathComponents;
  var sub_paths = path_info.sub_paths;
  for (var i = 0; i < path_strings.length; ++i) {
    sub_paths[i] = getPathComponents(path_strings[i]);
  }

  return path_info;
}

// TODO: remove the following two functions

QuakeWebTools.FileUtil.getExtension = function(path) {
  var index_dot = path.lastIndexOf(".");
  if (index_dot != -1) {
    return path.substring(index_dot + 1);
  }
  return "";
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
