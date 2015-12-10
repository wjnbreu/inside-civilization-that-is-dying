'use strict';

// -------------------------------------------------
//
// Track Class - Individual Stem
// 
// -------------------------------------------------

const q = require('q');

class Track {

	constructor(name, mp3, id, ctx){
		this.name = name || null;
		this.src = mp3 || null;
		this.id = id || null;
		this.ctx = ctx || null;

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
	// Play Method
	//
	play(pos){

		let self = this;

		pos = pos || 0;

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

		//start buffer
		self.bufferSource.start(0);

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