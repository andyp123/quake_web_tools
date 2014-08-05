/**
* Quake Web Tools Application.
*
* @module QuakeWebTools
*/
var QuakeWebTools = QuakeWebTools || {};

/*
TODO:

Start to think about creating various parts of the app as web components.
Initially the app is going to be a viewer for various types, which will then
later be built upon so that files opened in the app can be modified and saved,
and eventually created from scratch.

component ideas:
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

/*
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
*/

  G.FILEMANAGER.loadAllQueued();
}

function app_main() {
  console.log("app_main...");

  var QWT = QuakeWebTools;
  var G = QuakeWebTools.GLOBAL;

  // tests
  var path = "id1/pak0.pak|maps/e1m1.bsp|CLIP";
  var path_info = QuakeWebTools.FileUtil.getPathInfo(path);
  //console.log(path_info);
}


// TODO: move this functionality to suitable place and tidy up code
function viewPAK(pak) {
  var header = pak.header;
  var directory = pak.directory;

  var div_content = document.getElementById("file-content");
  
  // create div of links to files in the pak
  var div = document.createElement("div");
  div.style = "padding: 0; margin: 0; text-align: left";
  var ul = document.createElement("ol");

  for (var j = 0; j < directory.length; ++j) {
    var li = document.createElement("li");
    var a = pak.getDownloadLink(directory[j]);
    li.appendChild(a);
    ul.appendChild(li);
  }

  div.appendChild(ul);
  div_content.appendChild(div);
}

function viewBSP(bsp) {
  var clock;
  var scene, camera, renderer;
  var light_ambient, light_directional;
  var controls;

  var animate_id = 0;
  var frame_id = 0;

  function init() {
    var div_content = document.getElementById("file-content");
    var width = div_content.offsetWidth;
    var height = 300;

    clock = new THREE.Clock();
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, width / height, 1, 10000);

    var materials = bsp.getThreeMaterialDirectory();
    var models = bsp.geometry.models;

    for (var i = 0; i < models.length; ++i) {
      var geometries = models[i].geometries;

      for (var j = 0; j < geometries.length; ++j) {
        var geometry = geometries[j].geometry;
        var mat_id = geometries[j].tex_id;
        var mesh = new THREE.Mesh(geometry, materials[mat_id]);
        scene.add(mesh);
        mesh.rotation.x = -90 * Math.PI / 180;
        mesh.rotation.z = -90 * Math.PI / 180;

        // wfh is temporary
        var wfh = new THREE.WireframeHelper(mesh, 0x666666);
        wfh.material.linewidth = 2;
        scene.add(wfh);
        wfh.rotation.x = -90 * Math.PI / 180;
        wfh.rotation.z = -90 * Math.PI / 180;
      }
    }

    camera.position.z = 10;

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);

    div_content.appendChild(renderer.domElement);

    controls = new THREE.FirstPersonControls(camera, renderer.domElement);
    controls.movementSpeed = 500;
    controls.lookSpeed = 0.5;
  }

  function render() {
    renderer.render(scene, camera);
  }

  function animate() {
    var QWT = QuakeWebTools;
    if (QWT.STATS !== undefined) stats.begin();

    animate_id = requestAnimationFrame(animate);
    controls.update( clock.getDelta() );
    render();

    if(QWT.STATS !== undefined) stats.end();
  }

  init();
  animate();

  // need a way to deal with all these kind of "threads"
  return animate_id;
}

function viewMDL(mdl) {
  var scene, camera, renderer;
  var box, model, material, mesh, boxmesh;
  var controls;

  var animate_id = 0;
  var frame_id = 0;

  function init() {
    var div_content = document.getElementById("file-content");
    var width = div_content.offsetWidth;
    var height = 300;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, width / height, 1, 10000);
    // 12 (player head)
    // 230 (cthon)

    box = new THREE.BoxGeometry(50, 50, 50);
    model = mdl.toThreeBufferGeometry(0);
    material = mdl.toThreeMaterial();

    // Basic wireframe materials.
    // var darkMaterial = new THREE.MeshBasicMaterial( { color: 0xff00ff } );
    // var wireframeMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff, wireframe: true, transparent: true } ); 
    // var multiMaterial = [ material, wireframeMaterial ];
    // mesh = THREE.SceneUtils.createMultiMaterialObject(model, multiMaterial);
    mesh = new THREE.Mesh(model, material);

    // console.log(mesh);

    scene.add(mesh);
    //scene.add(boxmesh);

    var radius = model.boundingSphere.radius;

    camera.position.z = radius * 2;
    mesh.rotation.x = -90 * Math.PI / 180;
    mesh.rotation.z = -90 * Math.PI / 180;
    mesh.position.y -= radius / 3;

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);

    div_content.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.addEventListener( 'change', render );
  }

  function render() {
    renderer.render(scene, camera);
  }

  function animate() {
    var QWT = QuakeWebTools;
    if (QWT.STATS !== undefined) stats.begin();

    animate_id = requestAnimationFrame(animate);

    mdl.blendBufferGeometryFrame(model, frame_id);
    frame_id = (frame_id + 1/6) % mdl.geometry.frames.length; // assuming 60fps

    render();

    if(QWT.STATS !== undefined) stats.end();
  }

  init();
  animate();

  // need a way to deal with all these kind of "threads"
  return animate_id;
}
