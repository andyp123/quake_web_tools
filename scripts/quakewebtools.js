/**
* Quake Web Tools Application.
*
* @module QuakeWebTools
*/
var QuakeWebTools = QuakeWebTools || {};

/*
TODO:

LARGE TASKS
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
*/


// TEST FUNCTIONS

// table to store files (path as table key)
QuakeWebTools.DATA = {};

/**
* An object to contain globals.
*/
QuakeWebTools.GLOBAL = {
  "FILEMANAGER": null,
};

function app_init() {
  console.log("app_init...");

  var QWT = QuakeWebTools;
  var G = QWT.GLOBAL;

  G.FILEMANAGER = new QuakeWebTools.FileManager();

  var pal_file = "data/quake.pal";
  G.FILEMANAGER.queueFile(pal_file, [function() {
      QWT.DEFAULT_PALETTE = G.FILEMANAGER.getFile(pal_file, "obj");
      app_main();
    }]);

  G.FILEMANAGER.loadAllQueued();

/*
  // load default palette before continuing (should have an embedded version...)
  QWT.DATA["data/quake.pal"] = QWT.FileUtil.getFile("data/quake.pal", "arraybuffer", function() {
    var file = QWT.DATA["data/quake.pal"];
    var pal = new QWT.PAL(file.path, file.data);
    QWT.DEFAULT_PALETTE = pal;

    app_main();
  });*/
}

function app_main() {
  console.log("app_main...");

  var QWT = QuakeWebTools;

}


function loadPAK(path, arraybuffer) {
  var pak = new QuakeWebTools.PAK(path, arraybuffer);
  var header = pak.header;
  var directory = pak.directory;

  console.log(pak.toString());

  var div_content = document.getElementById("file-content");
  
  // create div of links to files in the pak
  var ul = document.createElement("ol");
  for (var j = 0; j < directory.length; ++j) {
    var li = document.createElement("li");
    var a = pak.getDownloadLink(directory[j]);
    li.appendChild(a);
    ul.appendChild(li);
  }

  div_content.appendChild(ul);
}
