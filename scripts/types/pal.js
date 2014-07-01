/**
* Quake Web Tools Application.
*
* @module QuakeWebTools
*/
var QuakeWebTools = QuakeWebTools || {};


/**
* PAL file representation.
* @constructor
* @param {String} path - The path and filename.
* @param {ArrayBuffer} arraybuffer - The file data as an ArrayBuffer.
*/
QuakeWebTools.PAL = function(path, arraybuffer) {
    this.filename = QuakeWebTools.FileUtil.getFilename(path);
    this.ab = arraybuffer;

    this.colors = new Uint8Array(this.ab);
}

/** @const Colors at indices above and including 240 are unlit in the Quake engine. */
QuakeWebTools.PAL.FULLBRITE_INDEX = 240;

/*
* Expands an array of paletized pixel data into an Image object that can be displayed
* in a browser.
* @param {QuakeImageData} image_data - Image data in the form { name, width, height, pixels }.
* @return {Image} Returns an Image object.
*/
// QuakeWebTools.PAL.prototype.expandImageData = function(image_data) {
//     var canvas = document.createElement("canvas");
//         canvas.width = image_data.width;
//         canvas.height = image_data.height;
//     var ctx = canvas.getContext("2d");
//     var imgd = ctx.createImageData(image_data.width, image_data.height);

//     var image_size = image_data.width * image_data.height;
//     var pixels = image_data.pixels;
//     var colors = this.colors;
//     for (var i = 0; i < image_size; ++i) {
//         var p = 4 * i;
//         var c = 3 * pixels[i];
//         imgd.data[p    ] = colors[c];
//         imgd.data[p + 1] = colors[c + 1];
//         imgd.data[p + 2] = colors[c + 2];
//         imgd.data[p + 3] = 255;
//     }

//     ctx.putImageData(imgd, 0, 0);
//     var img = new Image();
//         img.src = canvas.toDataURL("image/png");

//     return img;
// }

/**
* Get a String representing the basic file information.
*/
QuakeWebTools.PAL.prototype.toString = function() {
    var str = "PAL: '" + this.filename + "' RGB (256)";
    return str;
}

/**
* Get a String representing the file content.
* @param {Bool} verbose - If true, use verbose output.
* @param {Bool} use_br - If true, line breaks will be in HTML format using '<BR>'.
* @return {String} A String of the directory content.
*/
QuakeWebTools.PAL.prototype.toString_ListContents = function(verbose, use_br) {
    var str = "";
    var newline = (use_br) ? "<br>" : "\n";

    for (var i = 0; i < 256; ++i) {
        var c = this.colors[i];
        if (verbose) {
            str += i + ": r=" + c[0] + ", g=" + c[1] + ", b=" + c[2];
        } else {
            str += i + ": (" + c[0] + ", " + c[1] + ", " + c[2] + ")";
        }
        str += newline;
    }

    return str;
}