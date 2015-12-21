'use strict';


// -------------------------------------------------
//
// Individual Stem(Track)
// 
// -------------------------------------------------
const q = require('q');
const $ = require('jquery');
const Events = require('./pubsub');
const Howl = require('howler').Howl;
const Howler = require('howler').Howler;


class Stem {

	constructor( name, part, mp3, id, domElement, otherPlayers, startTime ){
		this.name = name || null;
		this.part = part || null;
		this.src = mp3 || null;
		this.id = id || null;
		this.domElement = domElement || null;
		this.otherPlayers = otherPlayers;
		this.startTime = startTime || 0;

		this.buf = null;

		this.alreadyStarted = false;
		this.playing = false;
		this.soloVolume = 0.75;
		this.quietVolume = 0.01;
		this.refVolume = 0.5;
		this.volume = this.quietVolume;
		this.duration = 0;
		this.loaded = false;
		this.muted = false;
		this.currentPos = 0;
		this.allTracksLoaded = false;
		this.allMuted = false;
		this.timerVisible = true;

	}


	// ------------------------------------------------
	// Load track
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


		if (this.id === 'ref'){
			this.volume = this.soloVolume;
		}


		this.buf = new Howl({
			urls: [self.src],
			volume: self.volume,
			

			onload: function(){


				self.bindClicks();

				deferred.resolve('loaded');
			},


			onloaderror: function(err){
				deferred.reject(err);
			},


			onend: function(){
				console.log('ended');
			},


			onpause: function(){
				self.playing = false;
			},


			onplay: function(){
				self.playing = true;
			},

			//allow play before load?
			buffer: true
		});

		return deferred.promise;

	}


	// ------------------------------------------------
	// Bind clicks
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


			if (self.muted){
				return null;
			}

			else{
				
				if (self.volume === self.quietVolume){

					
					setTimeout(function(){
						self.volume = this.soloVolume;
						self.buf.fade(self.quietVolume, self.soloVolume, 200);
						self.domElement.addClass('solo');
						self.playing = true;

						//swap background
						// let altBg = $('#item-' + self.id).data('alt');

						// $('#item-' + self.id).css({
						// 	background: altBg
						// });

					}, 100);


					$('#instructions').html('<p>' + self.name + ' / ' + self.part + '</p>');

					// ------------------------------------------------
					// Scroll to anchor
					//
					self.scrollToAnchor(ev, 1000);
				}

				else {
					
					setTimeout(function(){
						self.volume = self.quietVolume;
						self.buf.fade(self.soloVolume, self.quietVolume, 200);
						self.domElement.removeClass('solo');
						self.playing = false;

						//swap background
						// let mainBg = $('#item-' + self.id).data('main');

						// $('#item-' + self.id).css({
						// 	background: mainBg
						// });

					}, 100);

					$('#instructions').html('<p>Click individual players above to toggle their parts.</p>');
				}
			}
		}
	}


	// ------------------------------------------------
	// Play
	//

	play(){


		this.buf.play();
		this.playing = true;
	}


	// ------------------------------------------------
	// Pause
	//
	pause(){
		this.buf.pause();
		this.playing = false;
	}


	// ------------------------------------------------
	// Anchor scrolling
	//
	
	scrollToAnchor(ev, scrollDuration){
		// let anchor = ev.target.getAttribute('data-anchor');

		// $('html,body').animate({
		// 	scrollTop: $('#' + anchor).offset().top - 100
		// }, scrollDuration);
		
		return null;

	}

	// ------------------------------------------------
	// Turns down the ref track at 30s
	// called from timer in controls.js
	//
	
	turnRefDown(){

		if (this.id === 'ref'){
			this.buf.fade(this.soloVolume, this.refVolume, 5000);
		}

		else{
			return;
		}
		
	}


	showCountdown(currentTime){

		if (this.timerVisible){

			let timerId = $('#time-' + this.id);
			let start = this.startTime;
			let remaining = Math.abs(currentTime - start);

			timerId.text('Starting in ' + remaining.toFixed(4) + 's');

			if (currentTime > start){
				this.timerVisible = false;
				timerId.remove();
			}

		}

		else{
			return null;
		}

		
	}


	getPosition(){
		return this.buf.pos();
	}

	setPosition(pos){
		this.buf.pos(pos);
	}

};


module.exports = Stem;



