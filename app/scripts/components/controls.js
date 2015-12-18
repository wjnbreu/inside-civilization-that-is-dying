'use strict';


const async = require('async');
const Track = require('./stem');
const $ = require('jquery');
const Events = require('./pubsub');
const Howler = require('howler').Howler;


// -------------------------------------------------
//
// Audio. Controls track components
// 
// -------------------------------------------------



class Audio {

	constructor(){

		
		// ------------------------------------------------
		// Global ref to current song position
		//
		this.currentPos = 0;


		this.currentlyPlaying = false;
		this.songStarted = false;
		this.currentPos = 0;

		//duration in seconds
		this.duration = 370.0796;

		this.startStopButton = null;

		// ------------------------------------------------
		// Array of loaded stems
		//
		this.stems = [];

		//divs
		this.domElements = [];

		//timer interval
		this.interval = null;

		//timer element
		this.timerElement = null;

		//current time in seconds
		this.currentTime = 0;

		//global mute
		this.allMuted = false;

		this.scrubber = null;
		this.scrubValue = 0;

		//has ref been turned down
		this.refTurnedDown = false;

		

	}


	
	init(){
		let self = this;

		
		// ------------------------------------------------
		// Set up play/mute button
		//

		this.startStopButton = $('#play');
		this.timerElement = $('#timer');
		this.scrubber = $('#scrubber');
		this.domElements = $('.player');

		// ------------------------------------------------
		// Scrubber listeners
		//
		this.scrubber.on('input', function(val){
			self.handleScrubInput(val);
		});

		this.scrubber.on('change', function(val){
			self.handleScrubChange(val);
		})
		


		this.startStopButton.on('click', function(ev){
			if (self.currentlyPlaying){
				self.muteSounds();
			}
			else{
				self.startSounds(self.currentPos);
			}
		});



		// ------------------------------------------------
		// Grab data
		//
		self.fetchData();
		
		
	}






	// ------------------------------------------------
	// Grab JSON of audio data
	//
	fetchData(){
		
		let self = this;


		$.ajax({
			url: 'data/data.json',
			type: 'GET',
			success: function(data){
				self.trackData = data;
				self.initAudio();
			},	
			error: function(err){
				console.log('Error fetching data');
			}
		});
	}



	// ------------------------------------------------
	// Set up audio objects
	//
	
	initAudio(){

		let self = this;

		// ------------------------------------------------
		// Make new object and instantiate stem
		//
		$.each(self.trackData, function(index, value){
			let domElement = $('#item-' + this.id);


			let stem = new Track(
				this.name,
				this.part,
				this.mp3,
				this.id,
				domElement,
				self.otherPlayers
			);


			self.stems.push(stem);
		});

		



		// ------------------------------------------------
		// Loop through all stems and load
		//
		async.each(self.stems, function(track, callback){

			// ------------------------------------------------
			// Load tracks from load method on object
			// Returns promise
			//
			
			track.load().then(function(response){


				//async callback
				callback();

			// ------------------------------------------------
			// Promise error handling
			//
			}, function(err){
				console.log(err);
			});

		// ------------------------------------------------
		// Final async callback
		//
		}, function(err){

			if (err){
				return console.log('Error loading one of the stems');
			}

			// ------------------------------------------------
			// All tracks loaded son!
			//

			//send message
			Events.pubsub.emit('tracks:loaded', 'loaded');


			// ------------------------------------------------
			// Show audio control bar
			//

			const bar = $('#audio');
			bar.addClass('loaded');

			// ------------------------------------------------
			// Add event listeners on tracks
			//

			self.domElements.on('click', function(ev){
				self.handleClick(ev);
			});

		});
	}



	// ------------------------------------------------
	// Start playing all sounds
	//
	
	startSounds(pos){
		let self = this;

		// ------------------------------------------------
		// If ctx is already started, then just trigger volume change
		//
		if (self.songStarted === true){

			self.unmuteSounds();

		}

		// ------------------------------------------------
		// Song hasn't been started yet
		//
		
		else{

			self.startTimer();

			setTimeout(function(){
				for (let i = 0; i < self.stems.length; i++ ){
					//play with start position as attribute
					self.stems[i].play();
				}
			},0);
			


			//set to play
			self.currentlyPlaying = true;

			//make sure we flag that song has already start (we can't use start more than once)
			self.songStarted = true;

			//toggle color inversion
			this.startStopButton.removeClass('off').addClass('on');

		}

	}


	// ------------------------------------------------
	// Timer
	//
	startTimer(){

		let self = this;
		

		this.interval = setInterval(function(){
			self.currentTime = self.stems[0].getPosition();

			self.timerElement.text(self.currentTime.toFixed(4) + 's / ' + self.duration.toFixed(4) + 's');

			//calc percent
			let percent = Math.floor((self.currentTime / self.duration) * 100);

			//advance scrubber
			// self.scrubber.val(percent);

			if (Math.floor(self.currentTime) === 35){

				if (self.refTurnedDown === false){

					for (let i = 0; i < self.stems.length; i++ ){
						let stem = self.stems[i];

						stem.turnRefDown();
					}

					self.refTurnedDown = true;

				}
			}
			



			if (self.currentTime >= self.duration){
				clearInterval(self.interval);
				self.currentTime = 0;
			}
			

		}, 100);


	}
	


	// ------------------------------------------------
	// Unmute all sound
	//
	unmuteSounds(){
		let self = this;

		for (let i = 0; i < self.stems.length; i++ ){
			let stem = self.stems[i];

			stem.play();
		}



		//send message
		Events.pubsub.emit('tracks:unmuted', 'muted');


		self.currentlyPlaying = true;
		self.startStopButton.removeClass('off').addClass('on');
	}
	


	// ------------------------------------------------
	// Mute ALL sounds
	//
	muteSounds(){
		let self = this;

		for (let i = 0; i < self.stems.length; i++ ){
			let stem = self.stems[i];

			stem.pause();
		}



		//send message
		Events.pubsub.emit('tracks:muted', 'muted');

		

		self.currentlyPlaying = false;
		self.startStopButton.removeClass('on');
		self.startStopButton.addClass('off');

	}


	// ------------------------------------------------
	// Handle clicks
	//
	handleClick(ev){
		ev.stopPropagation();

		if (this.songStarted === false){
			this.startSounds(this.currentPos);

		}

		else{
			return null;
		}
	}



	// ------------------------------------------------
	// scrubber change
	//
	handleScrubInput(val){

		if (this.currentlyPlaying){
			//cancel timeout
			clearInterval(this.interval);
		}

		else{
			return;
		}
		
		
	}

	// ------------------------------------------------
	// Mouseup on scrubber
	//
	handleScrubChange(){

		if (this.currentlyPlaying){

			let self = this;

			let val = this.scrubber.val();

			//turn val to seconds
			let duration = this.duration;

			let percentDecimal = val / 100;

			let newPos = duration * percentDecimal;


			setTimeout(function(){
				for (let i = 0; i < self.stems.length; i++ ){
					//play with start position as attribute
					self.stems[i].setPosition(newPos);
				}
			},0);


			this.startTimer();

		}

		else{
			this.scrubber.val(0);
		}

		
	}
	
	
}



module.exports = Audio;