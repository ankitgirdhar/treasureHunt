class Game{
	constructor(){

		this.player = { }; //object, walk , cameras
		this.treasure = false;
		this.treasurecount = 0;
		this.container = document.createElement( 'div' );
		this.container.style.height = '100%';
		document.body.appendChild( this.container );
		const game = this;
		this.anims = ["character" , "walk" , "look-around" , "jump", "samba"];
		this.assetsPath = '../assets/';
		document.getElementById("camera-btn").onclick = function(){ game.switchCamera(); };
		this.clock = new THREE.Clock();
		game.init();
		game.animate();
		window.onError = function(error){
			console.error(JSON.stringify(error));
		}
	}

	switchCamera(fade=0.05){
		const cams = Object.keys(this.player.cameras);
		cams.splice(cams.indexOf('active'), 1);
		let index;
		for(let prop in this.player.cameras){
			if (this.player.cameras[prop]==this.player.cameras.active){
				index = cams.indexOf(prop) + 1;
				if (index>=cams.length) index = 0;
				this.player.cameras.active = this.player.cameras[cams[index]];
				break;
			}
		}
		this.cameraFade = fade;
	}
	
	set activeCamera(object){
		this.player.cameras.active = object;
	}
	
	init() {

		this.camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
		
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color( 0x034D79 );
		this.scene.fog = new THREE.Fog( 0xa0a0a0, 200, 2500 );

		let light = new THREE.HemisphereLight( 0xffffff, 0x444444 );
		light.position.set( 0, 200, 0 );
		this.scene.add( light );

		light = new THREE.DirectionalLight( 0xffffff );
		light.position.set( 0, 200, 100 );
		light.castShadow = true;
		light.shadow.camera.top = 180;
		light.shadow.camera.bottom = -100;
		light.shadow.camera.left = -120;
		light.shadow.camera.right = 120;
		this.scene.add( light );

		// ground
		var text = new THREE.TextureLoader().load( 'stone_texture.jpg' );
		const mat = new THREE.MeshBasicMaterial( { map: text } );
		var mesh = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2500, 2500 ), mat );
		mesh.rotation.x = - Math.PI / 2;
		mesh.receiveShadow = true;
		this.scene.add( mesh );

		var grid = new THREE.GridHelper( 2000, 40, 0x000000, 0x000000 );
		grid.material.opacity = 0.2;
		grid.material.transparent = true;
		//this.scene.add( grid );


		// sound
		var listener = new THREE.AudioListener();
		this.camera.add( listener );

		// create a global audio source
		var sound = new THREE.Audio( listener );

		// load a sound and set it as the Audio object's buffer
		var audioLoader = new THREE.AudioLoader();
		audioLoader.load( 'suspense.wav', function( buffer ) {
			sound.setBuffer( buffer );
			sound.setLoop( true );
			sound.setVolume( 0.4 );
			sound.play();
		});
		var list = new THREE.AudioListener();
		var s = new THREE.Audio( list );
		var aud = new THREE.AudioLoader();
		aud.load( 'crack.wav', function( buffer ) {
			s.setBuffer( buffer );
			s.setVolume( 0.8 );
		});
		var li = new THREE.AudioListener();
		var so = new THREE.Audio( li );
		var au = new THREE.AudioLoader();
		au.load( 'victory.mp3', function( buffer ) {
			so.setBuffer( buffer );
			so.setVolume( 1 );
		});


		// model
		const loader = new THREE.FBXLoader();
		const game = this;
		loader.load( `${this.assetsPath}fbx/character.fbx`, ( animation ) => {
			game.player.mixer = new THREE.AnimationMixer( animation );
			animation.traverse( ( child ) => {
				if ( child.isMesh ) {
					child.castShadow = true;
					child.receiveShadow = true;		
				}
			} );
			game.scene.add(animation);
			game.player.object = animation;
			game.joystick = new JoyStick({
				onMove: game.playerControl,
				game: game
			});
			game.createCameras();
			game.loadNextAnim(loader);
			game.createDummyEnvironment();
		} );

		window.onkeyup = (e) => {
			if(e.keyCode == 32)
			{
				game.action = "jump";
				s.play();
				if(this.treasure)
				{
					document.getElementById("message_fail").innerHTML = 'Treasure Found!';
					console.log('Treasure Found!');
					game.action = "samba";
					s.stop();
					sound.pause();
					so.play();
					sound.play();
					this.treasurecount++;
					document.getElementById("score").innerHTML = `Jewels Collected: ${this.treasurecount}`;
				}
				else
				{
					document.getElementById("message_fail").innerHTML = 'Error 404 Treasure not Found!';
					console.log('Error 404 Treasure not Found!');
				}
				setTimeout(function(){ document.getElementById("message_fail").innerHTML = ''}, 3000);
				this.treasure = false;

			}

		};
		this.renderer = new THREE.WebGLRenderer( { antialias: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		this.renderer.shadowMap.enabled = true;
		this.container.appendChild( this.renderer.domElement );
		window.addEventListener( 'resize', function(){ game.onWindowResize(); }, false );
	}

	playerControl(forward, turn){
		if (forward>0){
			if (this.player.action!="walk") this.action = "walk";
		}else{
			if (this.player.action=="walk") this.action = "look-around";
		}
		if (forward==0 && turn==0){
			delete this.player.move;
			this.action = "look-around"
		}else{
			this.player.move = { forward, turn }; 
		}
	}
	
	createCameras(){
		const front = new THREE.Object3D();
		front.position.set(112, 100, 350);
		front.parent = this.player.object;
		const back = new THREE.Object3D();
		back.position.set(0, 200, -480);
		back.parent = this.player.object;
		const wide = new THREE.Object3D();
		wide.position.set(178, 139, 465);
		wide.parent = this.player.object;
		const overhead = new THREE.Object3D();
		overhead.position.set(0, 400, 0);
		overhead.parent = this.player.object;
		this.player.cameras = { front, back, wide, overhead};
		game.activeCamera = this.player.cameras.wide;
		game.cameraFade = 0.1;
		setTimeout( () => {
			game.activeCamera = game.player.cameras.back;
		}, 2000)
	}

	createDummyEnvironment(){
		const env = new THREE.Group();
		env.name = "Environment";
		this.scene.add(env);
		
		const geometry = new THREE.BoxBufferGeometry( 150, 150, 150 );
		var texture = new THREE.TextureLoader().load( 'crate.jpg' );
		const material = new THREE.MeshBasicMaterial( { map: texture } );
		
		for(let x=-1000; x<1000; x+=800){
			for(let z=-1000; z<1000; z+=800){
				const block = new THREE.Mesh(geometry, material);
				block.position.set(x, 75, z);
				env.add(block);
			}
		}
		
		this.environmentProxy = env;
	}
	
	loadNextAnim(loader){
		let anim = this.anims.pop();
		const game = this;
		loader.load( `${this.assetsPath}fbx/${anim}.fbx`, function( object ){
			game.player[anim] = object.animations[0];
			if (game.anims.length>0){
				game.loadNextAnim(loader);
			}else{
				delete game.anims;
				game.action = "look-around";
				game.mode = 'active';
			}
		});	
	}

	onWindowResize() {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize( window.innerWidth, window.innerHeight );
	}

	set action(name){
		const anim = this.player[name];
		const action = this.player.mixer.clipAction(anim);
        action.time = 0;
		this.player.mixer.stopAllAction();
        if (this.player.action == "jump"){
            delete this.player.mixer._listeners['finished'];
        }
        if (name=="jump"){
            action.loop = THREE.LoopOnce;
            const game = this;
            this.player.mixer.addEventListener('finished', function(){ 
                game.action = 'look-around';
            });
        }
        if (this.player.action == "samba"){
            delete this.player.mixer._listeners['finished'];
        }
        if (name=="samba"){
            action.loop = THREE.LoopOnce;
            const game = this;
            this.player.mixer.addEventListener('finished', function(){ 
                game.action = 'look-around';
            });
        }
		this.player.action = name;
		action.fadeIn(0.5);	
		action.play();
	}


	movePlayer(dt){
		const pos = this.player.object.position.clone();
		pos.y += 60;
		let dir = this.player.object.getWorldDirection();
		let raycaster = new THREE.Raycaster(pos, dir);
		let blocked = false;
		
		for(let box of this.environmentProxy.children){
			const intersect = raycaster.intersectObject(box);
			if (intersect.length>0){
				if (intersect[0].distance<50){
					let position = new THREE.Vector3();
					position.setFromMatrixPosition( box.matrixWorld );
					console.log(position);
					if(position.x==600 && position.z==-1000)
					{
						this.treasure = true;
					}
					if(position.x==-1000 && position.z==600)
					{
						this.treasure = true;
					}
					blocked = true;
					break;
				}
			}
		}
		
		if (!blocked && this.player.move.forward > 0) this.player.object.translateZ(dt*130);
		

		
		//cast left
		dir.set(-1,0,0);
		dir.applyMatrix4(this.player.object.matrix);
		dir.normalize();
		raycaster = new THREE.Raycaster(pos, dir);
		
		for(let box of this.environmentProxy.children){
			const intersect = raycaster.intersectObject(box);
			if (intersect.length>0){
				if (intersect[0].distance<80){
					this.player.object.translateX(-(intersect[0].distance-80));
					break;
				}
			}
		}
		
		//cast right
		dir.set(1,0,0);
		dir.applyMatrix4(this.player.object.matrix);
		dir.normalize();
		raycaster = new THREE.Raycaster(pos, dir);
		
		for(let box of this.environmentProxy.children){
			const intersect = raycaster.intersectObject(box);
			if (intersect.length>0){
				if (intersect[0].distance<80){
					this.player.object.translateX(intersect[0].distance-80);
					break;
				}
			}
		}
	}


	
	animate() {
		const game = this;
		const dt = this.clock.getDelta();
		requestAnimationFrame( function(){ game.animate(); } );
		
		if (this.player.mixer!=undefined && this.mode=='active') this.player.mixer.update(dt);


		if (this.player.move!=undefined){
			this.movePlayer(dt);
			this.player.object.rotateY(this.player.move.turn*-1*dt);
		}
		
		if (this.player.cameras!=undefined && this.player.cameras.active!=undefined){
			this.camera.position.lerp(this.player.cameras.active.getWorldPosition(new THREE.Vector3()), 0.05);
			const pos = this.player.object.position.clone();
			pos.y += 60;
			this.camera.lookAt(pos);
		}
		this.renderer.render( this.scene, this.camera );

	}
}


class JoyStick{
	constructor(options){
		const circle = document.createElement("div");
		circle.style.cssText = "position:absolute; bottom:35px; width:80px; height:80px; background:rgba(126, 126, 126, 0.5); border:#444 solid medium; border-radius:50%; left:50%; transform:translateX(-50%);";
		const thumb = document.createElement("div");
		thumb.style.cssText = "position: absolute; left: 20px; top: 20px; width: 40px; height: 40px; border-radius: 50%; background: #684628;";
		circle.appendChild(thumb);
		document.body.appendChild(circle);
		this.domElement = thumb;
		this.maxRadius = 40;
		this.maxRadiusSquared = this.maxRadius * this.maxRadius;
		this.onMove = options.onMove;
		this.game = options.game;
		this.origin = { left:this.domElement.offsetLeft, top:this.domElement.offsetTop };
		
		const joystick = this;
		if ('ontouchstart' in window){
			this.domElement.addEventListener('touchstart', function(evt){ joystick.tap(evt); });
		}else{
			this.domElement.addEventListener('mousedown', function(evt){ joystick.tap(evt); });
		}

	}
	
	getMousePosition(evt){
		return { x:evt.clientX, y:evt.clientY };
	}
	
	tap(evt){
		this.offset = this.getMousePosition(evt);
		const joystick = this;
		if ('ontouchstart' in window){
			document.ontouchmove = function(evt){ joystick.move(evt); };
			document.ontouchend =  function(evt){ joystick.up(evt); };
		}else{
			document.onmousemove = function(evt){ joystick.move(evt); };
			document.onmouseup = function(evt){ joystick.up(evt); };
		}
	}
	
	move(evt){
		
		const mouse = this.getMousePosition(evt);
		let left = mouse.x - this.offset.x;
		let top = mouse.y - this.offset.y;
		
		const sqMag = left*left + top*top;
		if (sqMag>this.maxRadiusSquared){
			const magnitude = Math.sqrt(sqMag);
			left /= magnitude;
			top /= magnitude;
			left *= this.maxRadius;
			top *= this.maxRadius;
		}
        
		this.domElement.style.top = `${top + this.domElement.clientHeight/2}px`;
		this.domElement.style.left = `${left + this.domElement.clientHeight/2}px`;
		
		const forward = -(top - this.origin.top + this.domElement.clientHeight/2)/this.maxRadius;
		const turn = (left - this.origin.left + this.domElement.clientWidth/2)/this.maxRadius;
		
		if (this.onMove!=undefined) this.onMove.call(this.game, forward, turn);
	}
	
	up(evt){
		if ('ontouchstart' in window){
			document.ontouchmove = null;
			document.touchend = null;
		}else{
			document.onmousemove = null;
			document.onmouseup = null;
		}
		this.domElement.style.top = `${this.origin.top}px`;
		this.domElement.style.left = `${this.origin.left}px`;
		
		this.onMove.call(this.game, 0, 0);
	}
}