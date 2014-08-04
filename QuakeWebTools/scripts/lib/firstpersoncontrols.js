/**
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 * @author paulirish / http://paulirish.com/
 */

THREE.FirstPersonControls = function ( object, domElement ) {

  this.object = object;
  this.target = new THREE.Vector3( 0, 0, 0 );

  this.domElement = ( domElement !== undefined ) ? domElement : document;

  this.movementSpeed = 1.0;
  this.lookSpeed = 0.5;

  this.constrainVertical = false;
  this.verticalMin = 0;
  this.verticalMax = Math.PI;

  this.mouseX = 0;
  this.mouseY = 0;
  this.mousePrevX = 0;
  this.mousePrevY = 0;

  this.lat = 0;
  this.lon = 0;
  this.phi = 0;
  this.theta = 0;

  this.moveForward = false;
  this.moveBackward = false;
  this.moveLeft = false;
  this.moveRight = false;
  this.freeze = false;

  this.mouseDragOn = false;

  if ( this.domElement === document ) {
    this.viewHalfX = window.innerWidth / 2;
    this.viewHalfY = window.innerHeight / 2;
  } else {
    this.viewHalfX = this.domElement.offsetWidth / 2;
    this.viewHalfY = this.domElement.offsetHeight / 2;
    this.domElement.setAttribute( 'tabindex', -1 );
  }

  this.onMouseDown = function ( event ) {
    if ( this.domElement !== document ) {
      this.domElement.focus();
    }

    event.preventDefault();
    event.stopPropagation();

    this.mouseDragOn = true;
  };

  this.onMouseUp = function ( event ) {
    event.preventDefault();
    event.stopPropagation();

    this.mouseDragOn = false;
  };

  this.onMouseMove = function ( event ) {
    if ( this.domElement === document ) {
      this.mouseX = event.pageX - this.viewHalfX;
      this.mouseY = event.pageY - this.viewHalfY;
    } else {
      this.mouseX = event.pageX - this.domElement.offsetLeft - this.viewHalfX;
      this.mouseY = event.pageY - this.domElement.offsetTop - this.viewHalfY;
    }
  };

  this.onKeyDown = function ( event ) {
    switch( event.keyCode ) {
      case 38: /*up*/
      case 87: /*W*/ this.moveForward = true; break;

      case 37: /*left*/
      case 65: /*A*/ this.moveLeft = true; break;

      case 40: /*down*/
      case 83: /*S*/ this.moveBackward = true; break;

      case 39: /*right*/
      case 68: /*D*/ this.moveRight = true; break;

      case 82: /*R*/ this.moveUp = true; break;
      case 70: /*F*/ this.moveDown = true; break;

      case 81: /*Q*/ this.freeze = !this.freeze; break;
    }
  };

  this.onKeyUp = function ( event ) {
    switch( event.keyCode ) {
      case 38: /*up*/
      case 87: /*W*/ this.moveForward = false; break;

      case 37: /*left*/
      case 65: /*A*/ this.moveLeft = false; break;

      case 40: /*down*/
      case 83: /*S*/ this.moveBackward = false; break;

      case 39: /*right*/
      case 68: /*D*/ this.moveRight = false; break;

      case 82: /*R*/ this.moveUp = false; break;
      case 70: /*F*/ this.moveDown = false; break;
    }
  };

  this.update = function( delta ) {
    var actualMoveSpeed = delta * this.movementSpeed;
    if ( this.moveForward  ) this.object.translateZ( - ( actualMoveSpeed ) );
    if ( this.moveBackward ) this.object.translateZ( actualMoveSpeed );
    if ( this.moveLeft ) this.object.translateX( - actualMoveSpeed );
    if ( this.moveRight ) this.object.translateX( actualMoveSpeed );
    if ( this.moveUp ) this.object.translateY( actualMoveSpeed );
    if ( this.moveDown ) this.object.translateY( - actualMoveSpeed );

    if (this.mouseDragOn) {
      var mdx = this.mouseX - this.mousePrevX;
      var mdy = this.mouseY - this.mousePrevY;
      //console.log("mouse x,y: " + mdx + "," + mdy);
      this.lon += mdx * this.lookSpeed;
      this.lat -= mdy * this.lookSpeed;

      this.lat = Math.max( - 85, Math.min( 85, this.lat ) );
      this.phi = ( 90 - this.lat ) * Math.PI / 180;
      this.theta = this.lon * Math.PI / 180;

      var targetPosition = this.target;
      var position = this.object.position;

      targetPosition.x = position.x + 100 * Math.sin( this.phi ) * Math.cos( this.theta );
      targetPosition.y = position.y + 100 * Math.cos( this.phi );
      targetPosition.z = position.z + 100 * Math.sin( this.phi ) * Math.sin( this.theta );

      this.object.lookAt( targetPosition );
    }

    this.mousePrevX = this.mouseX;
    this.mousePrevY = this.mouseY;
  };


  this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );

  this.domElement.addEventListener( 'mousemove', bind( this, this.onMouseMove ), false );
  this.domElement.addEventListener( 'mousedown', bind( this, this.onMouseDown ), false );
  this.domElement.addEventListener( 'mouseup', bind( this, this.onMouseUp ), false );
  this.domElement.addEventListener( 'keydown', bind( this, this.onKeyDown ), false );
  this.domElement.addEventListener( 'keyup', bind( this, this.onKeyUp ), false );

  function bind( scope, fn ) {
    return function () {
      fn.apply( scope, arguments );
    };
  };
};