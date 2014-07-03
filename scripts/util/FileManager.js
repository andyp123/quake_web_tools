var QuakeWebTools = QuakeWebTools || {};

/*
TODO:
+ add local file upload support
+ store files in the filemanager (path, arraybuffer, loaded file in typed
  container)
+ allow downloading files
+ allow load/unload operations? (leak prone?)
+ drag and drop file support (dropzone.js? etc.)

Queue files
Load queued files

html5 drag and drop for files
html5 upload files with button

*/

/**
* A file manager that allows the user to upload, load (into a project etc.) and
* download files.
* @constructor
*/
QuakeWebTools.FileManager = function() {
  this.file_queue = {};
  this.file_directory = {};

  this.callback = {
    func: null,
    this_obj: null,
    args: []
  }
}

QuakeWebTools.FileManager.NATIVE_TYPES = {
  "pak": QuakeWebTools.PAK,
  "wad": QuakeWebTools.WAD,
  "bsp": QuakeWebTools.BSP,
  "lmp": QuakeWebTools.LMP,
  "spr": QuakeWebTools.SPR,
  "pal": QuakeWebTools.PAL,
  //"mdl": QuakeWebTools.MDL,
  //"map": QuakeWebTools.MAP,
};

QuakeWebTools.FileManager.STATUS = {
  "QUEUED":    0,
  "LOAD":      1,
  "LOAD_OK":   2,
  "LOAD_FAIL": 3
};

/** @static */
QuakeWebTools.FileManager.makeQueueEntry = function(path) {
  var FM = QWT.FileManager;
  var entry = {
    status: FM.STATUS.QUEUED,
    path: path,
    data: null,
    bytes_total: 0,
    bytes_received: 0,
  };
  return entry;
}

/** @static */
QuakeWebTools.FileManager.makeFileEntry = function(path, arraybuffer) {
  var entry = {
    path: path,
    data: arraybuffer,
    type: "",
    obj: null
  };
  return entry;
}

/**
* Add a file to the queue. Files in the queue will be asynchronously loaded
* when loadAllQueued is called.
* @param {String} path The path to the file, including filename.
* @param {Object} callback An optional callback for when the file is loaded.
*   Callback form {func: <function>, this_obj: <object>, args: <array of args>}
*/
QuakeWebTools.FileManager.prototype.queueFile = function(path, callback) {
  var FM = QuakeWebTools.FileManager;

  if (this.file_directory[path] !== undefined) {
    console.log("error: The file '" + path + "' is already loaded.");
    return 0;
  }
  if (this.file_queue[path] !== undefined) {
    console.log("error: The file '" + path + "' is already queued.");
    return 0;
  }

  var entry = FM.makeQueueEntry(path, callback);
  if (callback !== undefined) {
    entry.callback = callback.func;
    entry.callback_this = callback.this_obj;
    entry.callback_args = callback.args;
  }
  this.file_queue[path] = entry;

  return 1;
}

/**
* Load all queued files.
*/
QuakeWebTools.FileManager.prototype.loadAllQueued = function() {
  for (var path in this.file_queue) {
    var entry = this.file_queue[path];
    this.loadQueuedFile(entry);
  }
}

/**
* Load a specific file
* @param {QueueEntry} queue_entry Information about the file to load.
*/
QuakeWebTools.FileManager.prototype.loadQueuedFile = function(queue_entry) {
  var FM = QWT.FileManager;
  var fm = this;

  var result = queue_entry;
  result.status = FM.STATUS.LOAD;

  var success = function(e) {
    if (req.status == 200) {
      result.data = req.response;
      result.status = FM.STATUS.LOAD_OK;
      result.progress = 1.0;

      if (typeof result.callback == "function") {
        result.callback.apply(result.callback_this, result.callback_args);
      }

      this.file_directory[result.path] = FM.makeFileEntry(path, req.response);
      delete this.file_queue[result.path];
    } else {
      result.status = FM.STATUS.LOAD_FAIL;
    }
  };
  var progress = function(e) {
    if (e.lengthComputable) {
      result.bytes_total = e.total;
      result.bytes_received = e.loaded;
    }
  };
  var failure = function(e) {
    result.status = FM.STATUS.LOAD_FAIL;
  };

  var req = new XMLHttpRequest();
  req.open("GET", result.path, true);
  req.responseType = "arraybuffer";
  req.onload = success;
  req.onprogress = progress;
  req.onerror = failure;
  req.ontimeout = failure;
  req.send();
}

/**
* Clear all the queued files, except those that are loading
*/
QuakeWebTools.FileManager.clearAllQueued = function() {
  for (var path in this.file_queue) {
    var entry = this.file_queue[path];
    if (entry.status !== FM.STATUS.LOAD) {
      delete this.file_queue[path];
    }
  }
}

