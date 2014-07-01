Quake Web Tools
===============

Tools for viewing Quake 1 file formats on the web.

See this page for more information about types:
http://www.gamers.org/dEngine/quake/spec/quake-spec32.html

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

TODO:
+ Implement a simple but robust file manager

+ Allow files to be loaded locally, from a URL or within a PAK file
  + drag and drop input via dropzone.js

+ Implement Quake file type read support
  + PAK [done]
  + WAD [done]
  + LMP [done]
  + PAL [done]
  + SPR
  + MDL
  + BSP

+ Add support for displaying animated images (WAD using +0-9, SPR)

+ Extract individual images from BSP and WAD

+ Implement Quake file write support