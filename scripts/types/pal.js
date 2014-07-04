var QuakeWebTools = QuakeWebTools || {};

/**
* PAL file representation.
* @constructor
* @param {String} path The path and filename.
* @param {ArrayBuffer} arraybuffer The file data as an ArrayBuffer.
*/
QuakeWebTools.PAL = function(path, arraybuffer) {
  this.filename = QuakeWebTools.FileUtil.getFilename(path);
  this.ab = arraybuffer;

  this.colors = new Uint8Array(this.ab);
}

/** @const Colors at indices above and including 240 are unlit in the Quake engine. */
QuakeWebTools.PAL.FULLBRITE_INDEX = 240;

/**
* Get a String representing the basic file information.
*/
QuakeWebTools.PAL.prototype.toString = function() {
  var str = "PAL: '" + this.filename + "'";
  return str;
}

/**
* Get a String representing the file content.
* @param {Bool} verbose If true, use verbose output. (Note: Has no effect here)
* @param {Bool} use_br If true, line breaks will be in HTML format using '<BR>'.
* @return {String} A String of the directory content.
*/
QuakeWebTools.PAL.prototype.toString_ListContents = function(verbose, use_br) {
  var str = "";
  var newline = (use_br) ? "<br>" : "\n";

  for (var i = 0; i < 256; ++i) {
    var c = this.colors[i];
    str += i + ": (" + c[0] + ", " + c[1] + ", " + c[2] + ")" + newline;
  }

  return str;
}