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

  // call when files have all loaded
  this.callback = {
    func: null,
    this_obj: null,
    args: []
  }
}

QuakeWebTools.FileManager.STATUS = {
  "QUEUED":    0,
  "LOAD":      1,
  "LOAD_OK":   2,
  "LOAD_FAIL": 3
};


// Callback form [ <function>, <this_object>, [args] ]
// <function> is the only required component
/** @static */
QuakeWebTools.FileManager.makeQueueEntry = function(path, callback) {
  var entry = {
    status: QuakeWebTools.FileManager.STATUS.QUEUED,
    path: path,
    bytes_total: 0,
    bytes_received: 0,
  };
  if (callback && typeof callback[0] == "function") {
    entry.callback = callback[0];
    entry.callback_this = callback[1] || null;
    entry.callback_args = callback[2] || null;
  }

  return entry;
}

/** @static */
QuakeWebTools.FileManager.makeFileEntry = function(path, arraybuffer) {
  var entry = {
    path: path,
    data: arraybuffer,
    type: QuakeWebTools.FileUtil.getExtension(path),
    obj: null
  };

  entry.obj = QuakeWebTools.FileUtil.getFileObject(entry.type, path, arraybuffer);

  return entry;
}

/**
* Get a file from the directory, or optionally directly get an attribute of it.
* @param {String} path The file path to get.
* @param {String} attr The attribute name to get (optional).
*/
QuakeWebTools.FileManager.prototype.getFile = function(path, attr) {
  var entry = this.file_directory[path];

  if (entry !== undefined) {
    if (attr) {
      if (entry[attr] === undefined) {
        return null;
      }
      return entry[attr];
    }
    return entry;
  }

  return null;
}

/**
* Test whether a given file is queued/loaded in the FileManager.
* @param {String} path The path to test.
* @return {Boolean} True / False.
*/
QuakeWebTools.FileManager.prototype.isKnownPath = function(path) {
  return (this.file_queue[path] || this.file_directory[path]);
}


/**
* Add a file to the filemanager directly from data that is already loaded.
* @param {String} path The file path.
* @param {ArrayBuffer} arraybuffer An ArrayBuffer containing file data.
* @return {Object} The file data that was added (or already there)
*/
QuakeWebTools.FileManager.prototype.addFile = function(path, arraybuffer) {
  if (!this.isKnownPath(path)) {
    this._addFile(path, arraybuffer);
  }
  return this.file_directory[path];
}

/**
* Internal function that does the work of addFile without checking duplicates.
*/
QuakeWebTools.FileManager.prototype._addFile = function(path, arraybuffer) {
  var file_entry = QuakeWebTools.FileManager.makeFileEntry(path, arraybuffer);
  this.file_directory[path] = file_entry;
  console.log("LOAD_OK: '" + path + "' (" + arraybuffer.byteLength + " bytes)" 
      + ((file_entry.obj) ? (" > " + file_entry.obj.toString()) : ""));  
}

/**
* Add a file to the queue. Files in the queue will be asynchronously loaded
* when loadAllQueued is called.
* @param {String} path The path to the file, including filename.
* @param {Object} callback An optional callback for when the file is loaded.
*   Callback form [<function>, <this_object>, [args]]
*/
QuakeWebTools.FileManager.prototype.queueFile = function(path, callback) {
  var FM = QuakeWebTools.FileManager;

  if (this.isKnownPath(path)) {
    if (this.file_directory[path]) {
      console.log("error: The file '" + path + "' is already loaded.");
    } else {
      console.log("error: The file '" + path + "' is already queued.");
    }
    return 0;
  }

  var entry = FM.makeQueueEntry(path, callback);
  this.file_queue[path] = entry;
  console.log("QUEUED: '" + path + "'");

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
  var QWT = QuakeWebTools;
  var FM = QWT.FileManager;
  var fm = this;

  var result = queue_entry;
  result.status = FM.STATUS.LOAD;

  var success = function(e) {
    if (req.status == 200) {
      result.status = FM.STATUS.LOAD_OK;
      // Store file data
/*      var file_entry = FM.makeFileEntry(result.path, req.response);
      fm.file_directory[result.path] = file_entry;
      console.log("LOAD_OK: '" + result.path + "' (" + e.total + " bytes)" 
          + ((file_entry.obj) ? (" > " + file_entry.obj.toString()) : ""));
      delete fm.file_queue[result.path];
*/
      fm._addFile(result.path, req.response);

      if (typeof result.callback == "function") {
        result.callback.apply(result.callback_this, result.callback_args);
      } 
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

// TODO: delete unless there is a reason for this function
/**
* Clear all the queued files, except those that are loading
*/
QuakeWebTools.FileManager.prototype.clearAllQueued = function() {
  for (var path in this.file_queue) {
    var entry = this.file_queue[path];
    if (entry.status !== FM.STATUS.LOAD) {
      delete this.file_queue[path];
    }
  }
}

QuakeWebTools.FileManager.prototype.toString = function() {
  var str = "FileManager:\n";
  var entry;  

  str += "QUEUED:\n";
  for (var path in this.file_queue) {
    entry = this.file_queue[path];
    str += "'" + entry.path + "'";
  }
  str += "LOADED:\n";
  for (var path in this.file_directory) {
    entry = this.file_directory[path];
    str += "'" + entry.path + "'' (" + entry.data.byteLength + " bytes)\n"; 
  }
}

