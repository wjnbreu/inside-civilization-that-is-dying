'use strict';

// -------------------------------------------------
//
// Track Class - Individual Stem
// 
// -------------------------------------------------

const q = require('q');

class Track {

	constructor(name, mp3, id, ctx, domElement){
		this.name = name || null;
		this.src = mp3 || null;
		this.id = id || null;
		this.ctx = ctx || null;
		this.domElement = domElement || null;

		this.buf = null;

		this.playing = false;
		this.volume = 1;
		this.duration = 0;
		this.loaded = false;
		this.muted = true;
	}


	// ------------------------------------------------
	// Load audio
	//
	
	load(){

		let self = this;
		let deferred = q.defer();

		let req = new XMLHttpRequest();
		req.open('GET', self.src, true);
		req.responseType = 'arraybuffer';

		// ------------------------------------------------
		// Request load callback
		//
		req.onload = function(response){

			self.ctx.decodeAudioData(req.response, function(buffer){


				//get a reference to the buffer and add to object
				self.buf = buffer;

				//get song length in seconds
				self.songLength = buffer.duration;

				//remove loader
				let loadTarget = document.getElementById(self.id);

				if (loadTarget){
					loadTarget.remove();
				}

				//init all properties
				self.init();

				
				deferred.resolve(self.buf);
				
			});
		};

		// ------------------------------------------------
		// Send request
		//
		req.send();

		return deferred.promise;

	}


	// ------------------------------------------------
	// Listen for clicks on artist
	//
	bindClicks(){
		let self = this;

		if (self.domElement !== null){
			self.domElement.addEventListener('click', function(){
				self.onClick();
			}, false);
		}

		console.log(self.domElement);

	}


	// ------------------------------------------------
	// On Click
	//
	onClick(){

		// ------------------------------------------------
		// Need to loop through on any player click and 
		// find out which tracks are playing
		// If none are selected, boost volume of ref track
		//

		//turn down
		if (this.volume === 1){
			this.gainNode.gain.value = 0.15;
			this.volume = 0.15;
			this.domElement.classList.add('down');
			this.domElement.classList.remove('up');

		}

		else{
			this.gainNode.gain.value = 1;
			this.volume = 1;
			this.domElement.classList.add('up');
			this.domElement.classList.remove('down');
		}

	}



	init(){
		let self = this;



		//set up new buffersource
		self.bufferSource = self.ctx.createBufferSource();

		//set buffer to equal original source buffer from XMLHttp request
		self.bufferSource.buffer = self.buf;

		//create gain node
		self.gainNode = self.ctx.createGain();

		self.gainNode.gain.value = self.volume;

		//connect sound buffer to gain node
		self.bufferSource.connect(self.gainNode);

		//connect gain node to speakers
		self.gainNode.connect(self.ctx.destination);


		if (this.id === 'ref'){
			this.volume = 0.33;
			this.gainNode.gain.value = 0.33;
		}

		//listen for clicks
		self.bindClicks();

	}


	// ------------------------------------------------
	// Play Method
	//
	play(pos){

		let self = this;

		pos = pos || 0;

		//start buffer
		self.bufferSource.start(pos);

		self.muted = false;

	}


	// ------------------------------------------------
	// Stop
	//
	mute(){
		let self = this;
		self.gainNode.gain.value = 0;
		self.muted = true;
	}
	


	// ------------------------------------------------
	// Volume Change Method
	//
	changeVolume(vol){

	}
	


	

};


module.exports = Track;