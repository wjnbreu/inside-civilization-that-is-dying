'use strict';


const async = require('async');
const Track = require('./track');
const $ = require('jquery');
const Events = require('./pubsub');

window.AudioContext = window.AudioContext || window.webkitAudioContext;


// -------------------------------------------------
//
// Audio. Controls track components
// 
// -------------------------------------------------



class Audio {

	constructor(){

		// ------------------------------------------------
		// Global Audio Context instance
		//
		this.ctx = null;
		
		// ------------------------------------------------
		// Global ref to current song position
		//
		this.currentPos = 0;


		this.currentlyPlaying = false;
		this.songStarted = false;
		this.currentPos = 0;
		this.duration = 0;

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

		

	}


	
	init(){
		let self = this;

		
		// ------------------------------------------------
		// Set up play/mute button
		//

		this.startStopButton = $('#play');
		this.timerElement = $('#timer');
		
		this.domElements = $('.player');


		this.startStopButton.on('click', function(ev){
			if (self.currentlyPlaying){
				self.muteSounds();
			}
			else{
				self.startSounds(self.currentPos);
			}
		});



		
		// ------------------------------------------------
		// Test to see if audio context is valid
		//
		try{
			self.ctx = new AudioContext();
			self.fetchData();
		}
		catch(err){
			console.log('No Web Audio API Support', err);
		}
		
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
				self.ctx,
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

				self.duration = track.getDuration();

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


		let position = pos || self.currentPos;

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

			for (let i = 0; i < self.stems.length; i++ ){
				let stem = self.stems[i];

				//play with start position as attribute
				stem.play(position);

			}


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
			self.currentTime = (self.currentTime + 0.1);

			self.timerElement.text(self.currentTime.toFixed(3) + 's /' + self.duration.toFixed(3) + 's');

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

			stem.unmute();
		}

		// ------------------------------------------------
		// Toggle class
		//
		self.domElements.removeClass('down').addClass('up');


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

			stem.mute();
		}

		// ------------------------------------------------
		// Toggle class
		//

		self.domElements.removeClass('up').addClass('down');


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
}



module.exports = Audio;