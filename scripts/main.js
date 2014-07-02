/*
TODO:

LARGE TASKS
+ datastream.js style wrapper for array buffer reading (or just use datastream.js ;) )
+ file manager class for dealing with files more cleanly
+ animated image support
+ support for sprite frames in image loader

SMALLER TASKS



GOAL:
To make a simple web-based Quake editing suite. To start with, it should be able to handle all of the
various file types used by Quake.

LIBRARIES:
dropzone.js - file uploading (drag and drop)
datastream.js - handle binary file data in a more c like manner
filesaver.js - save files in a simple and cross-browser (should all work the same, but...)

C++?
Is it best to handle this in C, then get it working on the web via asm.js?
If so, it might be worth trying to port trenchbroom as long as it uses asm.js compatible libraries

ROUGH PLAN:
Read binary files in a generic and flexible manner
support reading basic quake file types
PAK first
list PAK contents
extract PAK contents
modify PAK contents (delete, move, rename)
add to PAK contents

preview wav in page
preview lmp in page (as png)
preview txt types in page
preview images inside bsp and wad
 
LIST OF TYPES:
.WAV    Sound files (RIFF/WAVE)
.BSP    levels (map and textures)
.MDL    3D models (Alias)
.SPR    Sprite models
.DAT    Pseudo-code
.RC     Resources
.CFG    Config Files
.LMP    Lump files
.BIN    End screen
.WAD    WAD2 file


PAK
[DONE] Load existing PAK files
[DONE] Save modified PAK files
[DONE] Show a list of contained files/data
[DONE] Extract entries as files
Insert new entries
Delete entries
Rename entries
Move entries
Create, rename, delete and move folders (note: folders don't exist as actual entries)

Should also be able to preview files in the PAK

WAD
[DONE] Load existing WAD files
Save modified WAD files
[DONE] Show a list of textures in the WAD
[DONE] Extract textures as files/data
Insert new textures, with appropriate color conversion
Delete textures
Rename textures

Should be able to preview and edit textures easily.
Texture editing operations should be limited to simple, texmex style things like remove fullbrites, rotate, flip etc.
Should be able to paste textures or drag files and have the correct colour conversion and mip-mapping performed




TODO:
+ get some kind of generic system for reading binary files and structs.
    (can probably just use datastream.js for this, instead of making my own)
+ create a system that can extract binary blobs out of existing files and load them as files
    PAK - contains arbitary files
    WAD - contains mostly (only) textures
    BSP - contains a built-in texture directory (same format as .WAD?)

texture formats are inconsistent in Quake
1. pixels
2. width, height, pixels
3. name, width, height, pixels1, pixels2, pixels3, pixels4

1. EXCEPTIONS: pal (256 colors), colormap (128*64), conchars (128x128)
2. all lmps - colormap.lmp and palette.lmp
3. all textures - conchars

detect exceptions by name and signature
pop.lmp (pak1) 256bytes - 16x16
palette.lmp (pak0, pak2) - palette format
colormap.lmp (pak0) - ???
CONCHARS (pak0/gfx.wad) - 128x128
*/








// TEST FUNCTIONS

// table to store files (path as table key)
var g_DATA = {};

function app_init() {
    console.log("starting app...");

    var QWT = QuakeWebTools;

    // load default palette before continuing (should have an embedded version...)
    g_DATA["data/quake.pal"] = QWT.FileUtil.getFile("data/quake.pal", "arraybuffer", function() {
        var file = g_DATA["data/quake.pal"];
        var pal = new QWT.PAL(file.path, file.data);

        QWT.DEFAULT_PALETTE = pal;
        app_main();
    });
}

function app_main() {
    var QWT = QuakeWebTools;

    // g_DATA["data/s_explod.spr"] = QWT.FileUtil.getFile("data/s_explod.spr", "arraybuffer", function() {
    //     var file = g_DATA["data/s_explod.spr"];
    //     var spr = new QWT.SPR(file.path, file.data);
    // });

    // g_DATA["data/pak0.pak"] = QWT.FileUtil.getFile("data/pak0.pak", "arraybuffer", function() {
    //     var file = g_DATA["data/pak0.pak"];

    //     loadPAK(file.path, file.data);

    //     // var pak = new QWT.PAK(file.path, file.data);
    // });
    // g_DATA["data/e1m1.bsp"] = QWT.FileUtil.getFile("data/e1m1.bsp", "arraybuffer", function() {
    //     var file = g_DATA["data/e1m1.bsp"];
    //     var bsp = new QWT.BSP(file.path, file.data);

    //     QWT.ImageUtil.generateHTMLPreview(bsp.miptex_directory, bsp.ab, QWT.DEFAULT_PALETTE);
    // });
   //  g_DATA["data/colormap.lmp"] = QWT.FileUtil.getFile("data/colormap.lmp", "arraybuffer", function() {
   //      var file = g_DATA["data/colormap.lmp"];
   //      var lmp = new QWT.LMP(file.path, file.data);
   //      console.log(lmp.toString());

   //      // test file
   //      var image_data = QWT.ImageUtil.getImageData(lmp.filename, lmp.ab);
   //      var img = QWT.ImageUtil.expandImageData(image_data, QWT.DEFAULT_PALETTE);
   //      document.body.appendChild(img);
   //  });
   //  g_DATA["gfx.wad"] = QWT.FileUtil.getFile("data/common.wad", "arraybuffer", function() {
   //      var file = g_DATA["gfx.wad"];
   //      var wad = new QWT.WAD(file.path, file.data);

   //      wad.generateHTMLPreview(QWT.DEFAULT_PALETTE);
   // });
}


function loadPAK(path, arraybuffer) {
    var pak = new QuakeWebTools.PAK(path, arraybuffer);
    var header = pak.header;
    var directory = pak.directory;

    console.log(pak.toString());

    var div_main = document.getElementById("main");
    
    // create div of links to files in the pak
    var ul = document.createElement("ol");
    for (var j = 0; j < directory.length; ++j) {
            var li = document.createElement("li");
            var a = pak.getDownloadLink(directory[j]);
            li.appendChild(a);
            ul.appendChild(li);
    }

    div_main.appendChild(ul);
}
