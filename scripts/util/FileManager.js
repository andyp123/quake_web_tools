var QuakeWebTools = QuakeWebTools || {};

/*
TODO:
+ add local file upload support
+ store files in the filemanager (path, arraybuffer, loaded file in typed
  container)
+ allow downloading files
+ allow load/unload operations? (leak prone?)
+ drag and drop file support (dropzone.js? etc.)

html5 drag and drop for files
html5 upload files with button

*/

/**
* A file manager that allows the user to upload, load (into a project etc.) and
* download files.
* @constructor
*/
QuakeWebTools.FileManager = function() {
  this.files = {};
}

QuakeWebTools.FileManager.prototype.loadFile = function(path) {

}

QuakeWebTools.FileManager.prototype.toString = function() {

}

QuakeWebTools.FileManager.prototype.toString_ListContents = function() {

}