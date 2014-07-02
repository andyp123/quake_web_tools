Quake Web Tools
===============

Tools for viewing Quake 1 file formats on the web.

See this page for more information about types:
http://www.gamers.org/dEngine/quake/spec/quake-spec32.html

LIST OF TYPES:
.WAV    Sound files (RIFF/WAVE)
.BSP    Levels (map and textures)
.MDL    3D models (Alias)
.SPR    Sprite models
.DAT    Pseudo-code
.RC     Resources
.CFG    Config Files
.LMP    Lump files
.BIN    End screen
.WAD    WAD2 file

.MAP    Level source
.FGD    Entity definition
.DEF    Entity definition

TODO:
+ Implement a simple but robust file manager
  + file manager is exposed to user and allows them to upload/download files

+ Allow files to be loaded locally, from a URL or from inside a PAK file
  + drag and drop input via dropzone.js

+ Implement faster directory for browsing PAK, WAD and BSP files
  + fuzzy search algorithms using regex or simple substring matching

+ PAK needs proper directory support

+ Modify PAK files
  + Move file (change path)
  + Delete file (remove from PAK, compress PAK)
  + Rename file (change path)
  + Add file (add new data, rewrite directory)
  + Move folder (change path of all subfolders and files)
  + Delete folder (remove all subfolders and files from PAK, compress PAK)
  + Rename folder (change path of all subfolders and files)
  + Add folder (add new folder and files, rewrite directory)

+ Save modified PAK support

+ Implement Quake file type read support
  + PAK [done]
  + WAD [done]
  + LMP [done]
  + PAL [done]
  + SPR
  + BSP
  + MDL

  + DAT [no support planned]
  + BIN [no support planned]
  + RC  [ascii format]
  + CFG [ascii format]
  + WAV [native browser support]

  + MAP
  + FGD
  + DEF

+ Add support for displaying animated images (WAD using +0-9, SPR)

+ Extract individual images from BSP and WAD

+ Export textures in BSP to WAD and save file (should not be hard... I guess)

+ Implement Quake file write support

+ Implement a basic 3d view

+ View MDL files in the 3d view