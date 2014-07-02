
/*
TODO:

Some kind of file manager is required to simplify dealing with loading many files asynchronously.
In reality the files will probably be mostly loaded from a pak file, but support for dealing with
multiple files robustly is required.

*/


/**
* A wrapper for ArrayBuffers that make reading data from them easier.
* Basically my own version of DataStream.js.
* Note: I only made it for learning really.
* @constructor
* @param {ArrayBuffer} arraybuffer - An ArrayBuffer containing the data to be read.
* @param {Number} start - The initial start position of the data pointer (byteofs).
*/
QuakeWebTools.FileUtil.DataStream = function(arraybuffer, initial_offset) {
    this.ab = arraybuffer;
    this.dataview = new DataView(arraybuffer);

    this.byteofs = 0;
    this.little_endian = true;
}

QuakeWebTools.FileUtil.DataStream.LITTLE_ENDIAN = true;
QuakeWebTools.FileUtil.DataStream.BIG_ENDIAN = false;

// Supported types (Note: In attempt to be compatible with datastream.js if I later decide to switch, I've kept them the same)
QuakeWebTools.FileUtil.DataStream.int8 = "int8";
QuakeWebTools.FileUtil.DataStream.uint8 = "uint8";
QuakeWebTools.FileUtil.DataStream.int16 = "int16";
QuakeWebTools.FileUtil.DataStream.uint16 = "uint16";
QuakeWebTools.FileUtil.DataStream.int32 = "int32";
QuakeWebTools.FileUtil.DataStream.uint32 = "uint32";
QuakeWebTools.FileUtil.DataStream.float32 = "float32";
QuakeWebTools.FileUtil.DataStream.float64 = "float64";
QuakeWebTools.FileUtil.DataStream.cstring = "cstring"; // null terminated string
QuakeWebTools.FileUtil.DataStream.string = "string"; // string of given length (format: "string:<length>")
QuakeWebTools.FileUtil.DataStream.padding = "padding"; //padding of given length (format: "padding:<bytes>")

QuakeWebTools.FileUtil.DataStream.prototype.setOffset = function(offset) {
    this.byteofs = (offset < 0) ? 0 : offset;
}

QuakeWebTools.FileUtil.DataStream.prototype.isEOF = function() {
    return (this.byteofs >= this.ab.byteLength) ? true : false;
}

QuakeWebTools.FileUtil.DataStream.prototype.setLittleEndian = function(true_false) {
    this.little_endian = (true_false == true) ? true : false;
}

QuakeWebTools.FileUtil.DataStream.prototype.isLittleEndian = function() {
    return this.little_endian;
}

// see "detect endianness" at https://developer.mozilla.org/en-US/docs/Web/API/DataView
QuakeWebTools.FileUtil.DataStream.SYSTEM_ENDIANNESS = (function() {
    var buffer = new ArrayBuffer(2);
    new DataView(buffer).setInt16(0, 256, true);
    return new Int16Array(buffer)[0] === 256;
})();

// READ DATA

// BASIC TYPES
QuakeWebTools.FileUtil.DataStream.prototype.getInt8 = function() {
    var rv = this.dataview.getInt8(this.byteofs, this.little_endian);
    this.byteofs += 1;
    return rv;
}

QuakeWebTools.FileUtil.DataStream.prototype.getUint8 = function() {
    var rv = this.dataview.getUint8(this.byteofs, this.little_endian);
    this.byteofs += 1;
    return rv;
}

QuakeWebTools.FileUtil.DataStream.prototype.getInt16 = function() {
    var rv = this.dataview.getInt16(this.byteofs, this.little_endian);
    this.byteofs += 2;
    return rv;
}

QuakeWebTools.FileUtil.DataStream.prototype.getUint16 = function() {
    var rv = this.dataview.getUint16(this.byteofs, this.little_endian);
    this.byteofs += 2;
    return rv;
}

QuakeWebTools.FileUtil.DataStream.prototype.getInt32 = function() {
    var rv = this.dataview.getInt32(this.byteofs, this.little_endian);
    this.byteofs += 4;
    return rv;
}

QuakeWebTools.FileUtil.DataStream.prototype.getUint32 = function() {
    var rv = this.dataview.getUint32(this.byteofs, this.little_endian);
    this.byteofs += 4;
    return rv;
}

QuakeWebTools.FileUtil.DataStream.prototype.getFloat32 = function() {
    var rv = this.dataview.getFloat32(this.byteofs, this.little_endian);
    this.byteofs += 4;
    return rv;
}

QuakeWebTools.FileUtil.DataStream.prototype.getFloat64 = function() {
    var rv = this.dataview.getFloat32(this.byteofs, this.little_endian);
    this.byteofs += 8;
    return rv;
}

// ARRAY TYPES
// FIXME: These support little endian systems and files only. This is a problem...
QuakeWebTools.FileUtil.DataStream.prototype.getInt8Array = function(length) {
    var arr = [];
    var dataview = new Int8Array(this.ab, this.byteofs, length);
    for (var i = 0; i < length; ++i) {
        arr[i] = dataview[i];
    }
    this.byteofs += length;
    
    return arr;
}

QuakeWebTools.FileUtil.DataStream.prototype.getUint8Array = function(length) {
    var arr = [];
    var dataview = new Uint8Array(this.ab, this.byteofs, length);
    for (var i = 0; i < length; ++i) {
        arr[i] = dataview[i];
    }
    this.byteofs += length;
    
    return arr;
}

QuakeWebTools.FileUtil.DataStream.prototype.getInt16Array = function(length) {
    var arr = [];
    var dataview = new Int16Array(this.ab, this.byteofs, length);
    for (var i = 0; i < length; ++i) {
        arr[i] = dataview[i];
    }
    this.byteofs += length * 2;
    
    return arr;
}

QuakeWebTools.FileUtil.DataStream.prototype.getUint16Array = function(length) {
    var arr = [];
    var dataview = new Uint16Array(this.ab, this.byteofs, length);
    for (var i = 0; i < length; ++i) {
        arr[i] = dataview[i];
    }
    this.byteofs += length * 2;
    
    return arr;
}

QuakeWebTools.FileUtil.DataStream.prototype.getInt32Array = function(length) {
    var arr = [];
    var dataview = new Int32Array(this.ab, this.byteofs, length);
    for (var i = 0; i < length; ++i) {
        arr[i] = dataview[i];
    }
    this.byteofs += length * 4;
    
    return arr;
}

QuakeWebTools.FileUtil.DataStream.prototype.getUint32Array = function(length) {
    var arr = [];
    var dataview = new Uint32Array(this.ab, this.byteofs, length);
    for (var i = 0; i < length; ++i) {
        arr[i] = dataview[i];
    }
    this.byteofs += length * 4;
    
    return arr;
}

QuakeWebTools.FileUtil.DataStream.prototype.getFloat32Array = function(length) {
    var arr = [];
    var dataview = new Float32Array(this.ab, this.byteofs, length);
    for (var i = 0; i < length; ++i) {
        arr[i] = dataview[i];
    }
    this.byteofs += length * 4;
    
    return arr;
}

QuakeWebTools.FileUtil.DataStream.prototype.getFloat64Array = function(length) {
    var arr = [];
    var dataview = new Float64Array(this.ab, this.byteofs, length);
    for (var i = 0; i < length; ++i) {
        arr[i] = dataview[i];
    }
    this.byteofs += length * 4;
    
    return arr;
}

/**
* Get a null terminated string from the data stream. Will not stop adding chars to the string
* unless it finds '\0' in it.
* @returns {String} String that was read.
*/
QuakeWebTools.FileUtil.DataStream.prototype.getCstring = function() {
    var dataview = this.dataview;
    var byteofs = this.byteofs;
    var limit = this.ab.byteLength;
    var le = this.little_endian;

    var str = "";

    for (byteofs; byteofs < limit; ++byteofs) {
        var charcode = dataview.getUint8(byteofs, le);
        if (charcode == 0) break;
        str += String.fromCharCode(charcode);
    }

    this.byteofs = byteofs;

    return str;
}

/**
* Get a string of specified length from the data stream.
* @param {Number} length Length of the string.
* @returns {String} String that was read.
*/
QuakeWebTools.FileUtil.DataStream.prototype.getString = function(length) {
    var dataview = this.dataview;
    var byteofs = this.byteofs;
    var limit = this.byteofs + length;
    var le = this.little_endian;
    
    var str = "";
    
    for (byteofs; byteofs < limit; ++byteofs) {
        var charcode = dataview.getUint8(byteofs, le);
        if (charcode == 0) break; // TODO: support null padded strings?
        str += String.fromCharCode(charcode);
    }

    this.byteofs = limit;

    return str;
}

QuakeWebTools.FileUtil.DataStream.prototype.getArrayOfType = function(type, length) {
    // typed array supported types
    // typed arrays only support little endian, so don't use them if little_endian is not set
    if (this.little_endian)
    {
        switch (type) {
        case DS.int8:
            return this.getInt8Array(length);
        case DS.uint8:
            return this.getUint8Array(length);
        case DS.int16:
            return this.getInt16Array(length);
        case DS.uint16:
            return this.getUint16Array(length);
        case DS.int32:
            return this.getInt32Array(length);
        case DS.uint32:
            return this.getUint32Array(length);
        case DS.float32:
            return this.getFloat32Array(length);
        case DS.float64:
            return this.getFloat64Array(length);
        }
    }

    // other types
    var arr = [];
    for (var i = 0; i < length; ++i) {
        arr[i] = this.getType(type); // FIXME: struct should be passed?
    }

    return arr;
}

QuakeWebTools.FileUtil.DataStream.prototype.getType = function(type, struct) {
    var DS = QuakeWebTools.FileUtil.DataStream;

    if (type.isArray !== undefined) {
        if (type[0] == "[]") {
            var length = (typeof type[2] === "function") ? type[2](struct) : type[2];
            return this.getArrayOfType(type[1], length);
        } else {
            return this.getStruct(type);
        }
    }

    switch (type) {
    case DS.int8:
        return this.getInt8();
    case DS.uint8:
        return this.getUint8();
    case DS.int16:
        return this.getInt16();
    case DS.uint16:
        return this.getUint16();
    case DS.int32:
        return this.getInt32();
    case DS.uint32:
        return this.getUint32();
    case DS.float32:
        return this.getFloat32();
    case DS.float64:
        return this.getFloat64();
    case DS.cstring:
        return this.getCstring();
    default:
        var colon_index = type.lastIndexOf(":");
        var length = 1;
        if (colon_index != -1) {
            length = parseInt(type.substring(colon_index + 1));
            type = type.substring(0, colon_index);
            if (length === NaN) break;
        }

        if (type == DS.string) {
            return this.getString(length);
        } else if( type == DS.padding) {
            this.byteofs += length;
            return undefined; // <struct>[<param>] = undefined; has no effect on struct.
        }
    }

    // FIXME: throw some kind of type error
}

/*
Example struct template:

var STRUCT_SPR = [
    "spr_id",       "string:4",
    "spr_type",     "int32",
    "radius",       "float32",
    "max_width",    "int32",
    "max_height",   "int32",
    "num_frames",   "int32",
    "beam_length",  "float32",
    "sync_type",    "int32"
];
*/

/**
* Reads values from the ArrayBuffer in sequence according to a template struct definition, which is an array
* in the format ["param1_name", "param1_type", "param2_name", "param2_type"...].
* The format is the same as that used by datastream.js for compatibility, although this supports less types
* than datastream.js
* Types:
*   'Int8'                      8-bit int.
*   'uint8'                     8-bit unsigned int.
*   'int16'                     16-bit int.
*   'uint16'                    16-bit unsigned int.
*   'int32'                     32-bit int.
*   'uint32'                    32-bit unsigned int.
*   'float32'                   32-bit float.
*   'float64'                   64-bit double precision float.
*   'cstring'                   C-style string. Will attempt to keep reading chars until the null terminator ('\0') is found
*   'string:<length>'           String of <length> characters.
*   'padding:<length>'          Padding of <length> bytes. Used to skip bytes in the struct without adding the parameter.
*   ['[]', <type>, <length>]    An array of any type (intended mostly for use with typed arrays).
*   <struct_template>           Another struct template (can be a reference, of course).
* @param {Array} - Array of parameters that define the struct to be read from the stream.
* @returns {Object} - An object containing the parameters and values that were read in.
*/
QuakeWebTools.FileUtil.DataStream.prototype.getStruct = function(template) {
    var struct = {};

    for (var i = 0; i < template.length; i += 2) {
        var name = template[i];
        var type = template[i + 1];

        // struct is passed as an arg so that if it contains function calls referencing values, they can be accessed.
        struct[name] = this.getType(type, struct);
    }

    return struct;
}