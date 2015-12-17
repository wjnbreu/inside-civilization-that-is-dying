'use strict';

// -------------------------------------------------
//
// Track Class - Individual Stem
// 
// -------------------------------------------------

const q = require('q');
const $ = require('jquery');
const Events = require('./pubsub');

class Track {

	constructor(name, mp3, id, ctx, domElement, otherPlayers){
		this.name = name || null;
		this.src = mp3 || null;
		this.id = id || null;
		this.ctx = ctx || null;
		this.domElement = domElement || null;
		this.otherPlayers = otherPlayers;

		this.buf = null;

		this.alreadyStarted = false;
		this.playing = false;
		this.volume = 0.15;
		this.duration = 0;
		this.loaded = false;
		this.muted = true;
		this.currentPos = 0;
		this.allTracksLoaded = false;
		this.allMuted = false;
	}


	// ------------------------------------------------
	// Load audio
	//
	
	load(){

		let self = this;


		//subscribe to pubsub
		Events.pubsub.on('tracks:loaded', function(msg){
			self.allTracksLoaded = true;
		});

		Events.pubsub.on('tracks:muted', function(msg){
			self.allMuted = true;
		});

		Events.pubsub.on('tracks:unmuted', function(msg){
			self.allMuted = false;
		});

		
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
				self.duration = buffer.duration;

				//remove loader
				const loadTarget = $('#' + self.id);
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

			self.domElement.on('click', function(ev){
				self.onClick(ev);
			});
		}


	}


	// ------------------------------------------------
	// On Click
	//
	onClick(ev){


		let self = this;

		if (self.allTracksLoaded){


			if (self.allMuted){
				return null;
			}

			else{

				if (self.volume === 0.15){
					//make sure this triggers after global event listener
					setTimeout(function(){
						self.volume = 1;
						self.gainNode.gain.value = 1;
						self.domElement.addClass('solo');
					},100);

					// ------------------------------------------------
					// Scroll to anchor
					//
					self.scrollToAnchor(ev, 800);

				}

				else{
					setTimeout(function(){
						self.volume = 0.15;
						self.gainNode.gain.value = self.volume;
						self.domElement.removeClass('solo');
					}, 100);
				}
			}
		}

		else{
			return null;
		}


		

		

		

	}


	scrollToAnchor(ev, scrollDuration){
		let anchor = ev.target.getAttribute('data-anchor');

		const scrollHeight = $(document).height();
		const scrollStep = Math.PI / (scrollDuration / 15);

		$('html,body').animate({
			scrollTop: $('#' + anchor).offset().top - 100
		}, scrollDuration);

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
			this.volume = 0.2;
			this.gainNode.gain.value = 0.2;
		}

		//listen for clicks
		self.bindClicks();

		//get reference 

	}


	// ------------------------------------------------
	// Play Method
	//
	play(pos){

		let self = this;


		//start buffer
		self.bufferSource.start(0, pos);

		self.muted = false;
		self.alreadyStarted = true;

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
	// Start
	//
	unmute(){
		let self = this;
		self.gainNode.gain.value = 1;
		self.muted = false;
	}

	getDuration(){

		return this.duration;
	}
	
};


module.exports = Track;