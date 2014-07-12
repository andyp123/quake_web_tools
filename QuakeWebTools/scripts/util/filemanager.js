var QuakeWebTools = QuakeWebTools || {};

/*
TODO:
+ [DONE] add local file upload support
+ [DONE] store files in the filemanager (path, arraybuffer, loaded file in typed
  container)
+ allow downloading files from url?

Queue files
Load queued files

html5 drag and drop for files
html5 upload files with button (click on dropzone to do this perhaps?)

Should dropping files onto an element/dropzone be done via functions built into
FileManager?

Think about file path more:
ID1/pak0.pak
quoth/pak0.pak
currently works fine. However, drag+dropped files only have a filename. Could
compare byte size of files with duplicate names to see if they are the same.

FILE URLS
---------
CLASS : FROM
1       filesystem (under PATH.BASE)
2       drag+drop (filename only)
2       user select (will have path?)
3       from url (less important)
4       within PAK, WAD, BSP

1 can be loaded automatically from config. Prefer these files!
2 temp working files only? can't be loaded automatically
3 can be loaded automatically, but maybe same class as 2
4 need special url? e.g. pak0.pak|maps/e1m1.bsp
                         gfx.wad|CONCHARS
  when a url has a subfile link in (path contains '|' with subfile name), the
  file manager must check the parent file has been loaded, then load the subfile
  via a callback.

each loaded file stores the following:
name : name of the item
  PAK -> filename (with extension)
  WAD -> texturename
extension : extension/filetype
path : full path to the item
  normal file -> id1/maps/e1m1.bsp
  contained -> id1/pak0.pak|maps/e1m1.bsp
            -> id1/pak0.pak|gfx.wad|CONCHARS



dealing with duplicates
*/

/**
* A file manager that allows the user to upload, load (into a project etc.) and
* download files.
* @constructor
*/
QuakeWebTools.FileManager = function() {
  this.file_queue = {};
  this.file_directory = {};

/*
  when queueFiles is called, a callback can be set that is triggered when ALL
  files in the group have loaded. Each group of files can have a different
  callback. Callbacks have the form [<function>, <this_object>, [args]], but
  the progress of the files as a group must be monitored, so more information
  is stored.
  The size of this array will grow indefinitely, but callbacks that have been
  triggered will be set to null.
*/
  this.group_callbacks = [];
}

QuakeWebTools.FileManager.prototype.checkGroupCallback = function(group_id, status) {
  var FM = QuakeWebTools.FileManager;

  if (group_id !== undefined && this.group_callbacks[group_id] !== undefined) {
    var cbinfo = this.group_callbacks[group_id];

    if (status == FM.STATUS.LOAD_OK) {
      cbinfo.files_received += 1;
    } else if (status == FM.STATUS.LOAD_FAIL) {
      cbinfo.files_failed += 1;
    }

    if (cbinfo.files_received + cbinfo.files_failed == cbinfo.files_total) {
      cbinfo.callback.apply(cbinfo.callback_this, cbinfo.callback_args);
      this.group_callbacks[group_id] = null;
    }
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
QuakeWebTools.FileManager.newQueueEntry = function(path, callback, group_id) {
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
  if (group_id !== undefined) {
    entry.group_id = group_id;
  }

  return entry;
}

/** @static */
QuakeWebTools.FileManager.newFileEntry = function(path, arraybuffer) {
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
  var file_entry = QuakeWebTools.FileManager.newFileEntry(path, arraybuffer);
  this.file_directory[path] = file_entry;
  console.log("LOAD_OK: '" + path + "' (" + arraybuffer.byteLength + " bytes)" 
      + ((file_entry.obj) ? (" > " + file_entry.obj.toString()) : ""));
  delete this.file_queue[path];
}

/**
* Add a file to the queue. Files in the queue will be asynchronously loaded
* when loadAllQueued is called.
* @param {String} path The path to the file, including filename.
* @param {Object} callback An optional callback for when the file is loaded.
*   Callback form [<function>, <this_object>, [args]]
* @return {Number} 1 if the file was queued, 0 if it failed.
*/
QuakeWebTools.FileManager.prototype.queueFile = function(path, callback, group_id) {
  var FM = QuakeWebTools.FileManager;

  if (this.isKnownPath(path)) {
    if (this.file_directory[path]) {
      console.log("error: The file '" + path + "' is already loaded.");
    } else {
      console.log("error: The file '" + path + "' is already queued.");
    }
    return 0;
  }

  var entry = FM.newQueueEntry(path, callback, group_id);
  this.file_queue[path] = entry;
  console.log("QUEUED: '" + path + "'");

  return 1;
}

/**
*
* @param {Array} file_paths Array of file path strings.
* @param {Object} callback An optional callback for when ALL files in the group
*    have loaded.
*    Callback form [<function>, <this_object>, [args]]
*/
QuakeWebTools.FileManager.prototype.queueFiles = function(file_paths, callback) {
  var FM = QuakeWebTools.FileManager;
  var callback_id = (callback) ? this.group_callbacks.length : null;
  var files_queued = 0;

  for (var i = 0; i < file_paths.length; ++i) {
    var path = file_paths[i];
    files_queued += this.queueFile(path, null, callback_id);
  }

  if (callback && files_queued > 0) {
    var cbinfo = {
      group_id: callback_id,
      callback: callback[0],
      callback_this: callback[1] || null,
      callback_args: callback[2] || null,
      files_total: files_queued,
      files_received: 0,
      files_failed: 0
    };
    this.group_callbacks[callback_id] = cbinfo;
  }
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
      fm._addFile(result.path, req.response);

      // deal with callbacks
      fm.checkGroupCallback(result.group_id, FM.STATUS.LOAD_OK);
      if (typeof result.callback == "function") {
        result.callback.apply(result.callback_this, result.callback_args);
      } 
    } else {
      result.status = FM.STATUS.LOAD_FAIL;
      console.log("LOAD_FAIL: '" + result.path + "'");
      fm.checkGroupCallback(result.group_id, FM.STATUS.LOAD_FAIL);
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
    console.log("error,LOAD_FAIL: '" + result.path + "'");
    fm.checkGroupCallback(result.group_id, FM.STATUS.LOAD_FAIL);
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

/**
* Return a string representation of the File Manager
*/
QuakeWebTools.FileManager.prototype.toString = function() {
  var str = "FileManager:\n";
  var entry;  

  str += "QUEUED:\n";
  for (var path in this.file_queue) {
    entry = this.file_queue[path];
    str += "'" + entry.path + "'\n";
  }
  str += "LOADED:\n";
  for (var path in this.file_directory) {
    entry = this.file_directory[path];
    str += "'" + entry.path + "' (" + entry.data.byteLength + " bytes)\n"; 
  }

  return str;
}

