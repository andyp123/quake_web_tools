/**
* Quake Web Tools Application.
*
* @module QuakeWebTools
*/
var QuakeWebTools = QuakeWebTools || {};

/*
TODO:

Start building polymer/web components:
MDL viewer
WAD viewer
File tree

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


/**
* Globals objects.
*/
QuakeWebTools.GLOBAL = {
  "FILEMANAGER": null,
};

/**
* Important application paths.
*/
QuakeWebTools.PATH = {
  BASE: "QuakeWebTools/",
  DATA: "QuakeWebTools/data/",
  CFG: "QuakeWebTools/config/"
};

function app_init() {
  console.log("app_init...");

  var QWT = QuakeWebTools;
  var G = QWT.GLOBAL;
  var PATH = QWT.PATH;

  G.FILEMANAGER = new QuakeWebTools.FileManager();

  var pal_file = PATH.DATA + "quake.pal";
  G.FILEMANAGER.queueFile(pal_file, [function() {
      QWT.DEFAULT_PALETTE = G.FILEMANAGER.getFile(pal_file, "obj");
      app_main();
    }]);

  var files = [
    "id1/pak0.pak",
    "id1/pak1.pak",
  ];
  G.FILEMANAGER.queueFiles(files, [function() {
      console.log("GROUP 1 LOADED");
    }]);
  var files = [
    "quoth/pak0.pak",
    "quoth/pak1.pak",
    "quoth/pak2.pak"
  ];
  G.FILEMANAGER.queueFiles(files, [function() {
      console.log("GROUP 2 LOADED");
    }]);

  G.FILEMANAGER.loadAllQueued();
}

function app_main() {
  console.log("app_main...");

  var QWT = QuakeWebTools;
  var G = QuakeWebTools.GLOBAL;

  var pak =  G.FILEMANAGER.getFile("id1/pak0.pak", "obj");
  if (pak) {
    pak.generateFileLinks("file-content");
  }

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