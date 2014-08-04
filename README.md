#Quake Web Tools

Tools for viewing Quake 1 file formats on the web.

See this page for more information about types:  
http://www.gamers.org/dEngine/quake/spec/quake-spec32.html

---

###LIST OF TYPES:

+ .WAV    Sound files (RIFF/WAVE)
+ .BSP    Levels (map and textures)  
+ .MDL    3D models (Alias)  
+ .SPR    Sprite models  
+ .DAT    Pseudo-code  
+ .RC     Resources  
+ .CFG    Config Files    
+ .LMP    Lump files  
+ .BIN    End screen  
+ .WAD    WAD2 file  
+ .MAP    Level source  
+ .FGD    Entity definition  
+ .DEF    Entity definition  

###TODO

+ Implement a simple but robust file manager
    - file manager is exposed to user and allows them to upload/download files
    - Allow files to be loaded locally, from a URL or from inside a PAK file
    - drag and drop input
    - file 'url' should support files inside other files
    - how deep should this go? (e.g. texture in a WAD inside a PAK)
+ Implement faster directory for browsing PAK, WAD and BSP files
    - fuzzy search algorithms using regex or simple substring matching
+ PAK needs proper directory support
+ Modify PAK files
    - Move file (change path)
    - Delete file (remove from PAK, compress PAK)
    - Rename file (change path)
    - Add file (add new data, rewrite directory)
    - Move folder (change path of all subfolders and files)
    - Delete folder (remove all subfolders and files from PAK, compress PAK)
    - Rename folder (change path of all subfolders and files)
    - Add folder (add new folder and files, rewrite directory)
+ Save modified PAK support
+ Implement Quake file type read support
    - PAK [done]
    - WAD [done] + animation
    - LMP [done]
    - PAL [done]
    - SPR [done] + animation
    - BSP [50%] + miptex animation
    - MDL [done]
    - DAT [no support planned]
    - BIN [no support planned]
    - RC  [ascii format]
    - CFG [ascii format]
    - WAV [native browser support]
    - MAP [parsed type]
    - FGD [parsed type]
    - DEF [parsed type]
+ Add support for displaying animated images (WAD using +0-9, SPR)
+ Extract individual images from BSP and WAD
+ Export textures in BSP to WAD and save file (should not be hard... I guess)
+ Implement Quake file write support
+ Implement a basic 3d view
    - View MDL files in the 3d view
    - View BSP files in the 3d view
    - Use 3d view for a MAP editor... (later, very big task)
+ Think about configuration files for auto-loading files from the Quake directory:  

<pre><code>[Quake]
    Quake.exe
    QuakeWebTools.html - executing from here gets around many access problems
    [QuakeWebTools]
        [configs]
            default.txt
            mymap.txt - config files store files to load for a project
        [scripts]
        [img]
    [ID1]
        pak0.pak
        pak1.pak
        [maps]
    [WADS]</code></pre>
