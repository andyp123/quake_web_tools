var QuakeWebTools = QuakeWebTools || {};

/**
* LMP file representation.
* @constructor
* @param {String} path - The path and filename.
* @param {ArrayBuffer} arraybuffer - The file data as an ArrayBuffer.
*/
QuakeWebTools.LMP = function(path, arraybuffer) {
  this.filename = QuakeWebTools.FileUtil.getFilename(path);
  this.ab = arraybuffer;
}

/**
* Get a String representing the basic file information.
*/
QuakeWebTools.LMP.prototype.toString = function() {
  return "LMP: '" + this.filename + "'";
}