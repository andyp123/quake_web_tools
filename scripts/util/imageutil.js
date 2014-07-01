/**
* Quake Web Tools Application.
*
* @module QuakeWebTools
*/
var QuakeWebTools = QuakeWebTools || {};


/*
* A Library of tools for manipulating Quake's paletized images.
* @static
*/
QuakeWebTools.ImageUtil = {};

// values correspond to byte size of header
QuakeWebTools.ImageUtil.HEADER_NONE = 0;
QuakeWebTools.ImageUtil.HEADER_SIMPLE = 8;
QuakeWebTools.ImageUtil.HEADER_MIPTEX = 40;

// number of bytes per pixel
QuakeWebTools.ImageUtil.PIXELTYPE_PALETISED = 1;
QuakeWebTools.ImageUtil.PIXELTYPE_RGB = 3;

QuakeWebTools.ImageUtil.SPECIAL_CASE = {
    "CONCHARS": {size: 16384, width: 128, height: 128, header_type: QuakeWebTools.ImageUtil.HEADER_NONE},
    "pop.lmp": {size: 256, width: 16, height: 16, header_type: QuakeWebTools.ImageUtil.HEADER_NONE},
    "colormap.lmp": {size: 16385, width: 256, height: 64, header_type: QuakeWebTools.ImageUtil.HEADER_NONE}
};

/**
* Gets image data in the form { name, width, height, pixels, pixel_type }
* where pixels is an arraybuffer containing paletised image data.
* The 'entry' parameter is required when extracting image data from WAD or
* BSP files, and should be undefined or null when working with lmp files.
* @param {String} name - Name of the file or directory entry.
* @param {ArrayBuffer} arraybuffer - An array buffer that represents the file containing the image.
* @param {WADEntry} entry - A WAD or BSP directory entry containing detailed information about the image.
* @return {QuakeImageData} Returns the image data.
* @static
*/
QuakeWebTools.ImageUtil.getImageData = function(name, arraybuffer, entry) {
    var IU = QuakeWebTools.ImageUtil;
    var WAD = QuakeWebTools.WAD;

    // most non-miptex and non-special case are this format
    var header_type = IU.HEADER_SIMPLE;

    // basic image data structure
    var image_data = {
        name: name,
        width: 0,
        height: 0,
        pixels: null,
        pixel_type: IU.PIXELTYPE_PALETISED
    };

    // define simple entry for dealing seemlessly with single files (TYPE_STATUS is same format as HEADER_SIMPLE)
    entry = (!entry) ? { offset: 0, size: arraybuffer.byteLength, type: WAD.TYPE_STATUS} : entry;

    var data = new DataView(arraybuffer);
    var le = true; //little endian

    var special_case_info = IU.SPECIAL_CASE[name];
    if (special_case_info !== undefined) {
        // special cases
        image_data.width = special_case_info.width;
        image_data.height = special_case_info.height;
        header_type = special_case_info.header_type;
    } else if (entry.size == 768 && entry.type !== WAD.TYPE_MIPTEX) {
        // palette file signature detected
        // 768 bytes of pixels is common, but not without a header (776 bytes or more)
        image_data.width = 16;
        image_data.height = 16;
        image_data.pixel_type = IU.PIXELTYPE_RGB;
        header_type = IU.HEADER_NONE;
    }

    if (special_case_info === undefined && entry.type === WAD.TYPE_MIPTEX) {
        header_type = IU.HEADER_MIPTEX;
    }

    // FIXME: convert to use DataStream.js
    var byteofs = entry.offset;

    switch (header_type) {
    case IU.HEADER_MIPTEX:
        // get all parameters
        /*image_data.name = getString(data, byteofs, 16, le);*/ byteofs += 16;
        image_data.width = data.getInt32(byteofs, le);          byteofs += 4;
        image_data.height = data.getInt32(byteofs, le);         byteofs += 4;
        var ofs1 = entry.offset + data.getInt32(byteofs, le);   byteofs += 4;
        var ofs2 = entry.offset + data.getInt32(byteofs, le);   byteofs += 4;
        var ofs3 = entry.offset + data.getInt32(byteofs, le);   byteofs += 4;
        var ofs4 = entry.offset + data.getInt32(byteofs, le);
        // get pixels at various mip levels
        image_data.pixels  = new Uint8Array(arraybuffer.slice(ofs1, ofs1 + image_data.width * image_data.height));
        image_data.pixels2 = new Uint8Array(arraybuffer.slice(ofs2, ofs2 + Math.floor((image_data.width * image_data.height) / 4)));
        image_data.pixels3 = new Uint8Array(arraybuffer.slice(ofs3, ofs3 + Math.floor((image_data.width * image_data.height) / 8)));
        image_data.pixels4 = new Uint8Array(arraybuffer.slice(ofs4, ofs4 + Math.floor((image_data.width * image_data.height) / 16)));
        break;
    case IU.HEADER_SIMPLE:
        image_data.width = data.getInt32(byteofs, le);      byteofs += 4;
        image_data.height = data.getInt32(byteofs, le);     byteofs += 4;
        image_data.pixels = new Uint8Array(arraybuffer.slice(byteofs, byteofs + entry.size));
        break;
    case IU.HEADER_NONE:
        // this will be special case and palette only, so width and height are already set
        image_data.pixels = new Uint8Array(arraybuffer.slice(byteofs, byteofs + entry.size));
        break;
    default: // FIXME: can never happen. Delete?
        console.log("Error reading image data: Unrecognised header type, '" + header_type + "'");
        return null;
    }
    
    return image_data;
}

/**
* Converts image data in the form { name, width, height, pixels, pixel_type } to an image
* using a data URL that can be displayed in browsers.
* @param {QuakeImageData} image_data - The image data to expand.
* @param {PAL} palette - A 256 color palette (not required if image_data.pixel_type is ImageUtil.PIXELTYPE_RGB).
* @param {Number} mip_level - A number between 1 and 4 that lets the caller choose which pixel array to use for mip mapped textures.
* @return {Image} Returns an Image object.
* @static
*/
QuakeWebTools.ImageUtil.expandImageData = function(image_data, palette, mip_level) {
    var pixels;
    var width = image_data.width;
    var height = image_data.height;
    if (mip_level && mip_level > 1 && mip_level < 5 && image_data["pixels" + mip_level]) {
        pixels = image_data["pixels" + mip_level];
        width >>= mip_level - 1;
        height >>= mip_level - 1;
    } else {
        pixels = image_data.pixels;
    }
    var image_size = width * height;

    var canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
    var ctx = canvas.getContext("2d");
    var imgd = ctx.createImageData(width, height);


    // small hack for CONCHARS, which uses the wrong transparency index
    var trans_index = (image_data.name == "CONCHARS") ? 0 : 255;

    if (image_data.pixel_type == QuakeWebTools.ImageUtil.PIXELTYPE_PALETISED) {
        var colors = palette.colors;
        for (var i = 0; i < image_size; ++i) {
            var p = 4 * i;
            if (pixels[i] == trans_index) {
                imgd.data[p + 3] = 0;
            } else {
                var c = 3 * pixels[i];
                imgd.data[p    ] = colors[c];
                imgd.data[p + 1] = colors[c + 1];
                imgd.data[p + 2] = colors[c + 2];
                imgd.data[p + 3] = 255;
            }
        }
    } else {
        for (var i = 0; i < image_size; ++i) {
            var c = 3 * i;
            var p = 4 * i;
            imgd.data[p    ] = pixels[c];
            imgd.data[p + 1] = pixels[c + 1];
            imgd.data[p + 2] = pixels[c + 2];
            imgd.data[p + 3] = 255;
        }
    }

    ctx.putImageData(imgd, 0, 0);
    var img = new Image();
        img.src = canvas.toDataURL("image/png");
        img.title = image_data.name;

    return img;
}
