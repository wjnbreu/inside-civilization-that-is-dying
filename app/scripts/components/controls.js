'use strict';


const async = require('async');
const Track = require('./track');
const $ = require('jquery');


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

		//slider
		this.slider = $('#slider');

		//timer element
		this.timerElement = null;

		

	}


	
	init(){
		let self = this;

		
		// ------------------------------------------------
		// Set up play/mute button
		//

		this.startStopButton = $('#play');
		this.timerElement = $('#timer');
		
		this.domElements = $('.player');

		this.slider.on('mousedown', function(ev){
			self.onSliderMouseDown(ev);
		});

		

		// ------------------------------------------------
		// Release
		//
		
		this.slider.on('mouseup', function(ev){
			self.onSliderMouseUp(ev);
		});

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

		console.log(pos);

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
			self.currentPos = self.ctx.currentTime;
			self.timerElement.text(self.currentPos);

			let percent = Math.floor((self.currentPos / self.duration) * 100);
			
			self.slider.val(percent);

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
		for (let i = 0; i < self.domElements.length; i++ ){
			self.domElements[i].removeClass('down');
			self.domElements[i].addClass('up');
		}

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
		for (let i = 0; i < self.domElements.length; i++ ){
			self.domElements[i].classList.remove('up');
			self.domElements[i].classList.add('down');
		}
		

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
			console.log('starting');
			this.startSounds(this.currentPos);
		}

		else{
			console.log('returning');
			return null;
		}


	}


	

	// ------------------------------------------------
	// Slider start
	//
	onSliderMouseDown(ev){

		let self = this;
		//stop interval
		clearInterval(self.interval);
	}
	


	// ------------------------------------------------
	// Slider change
	//
	onSliderMouseUp(ev){

		let self = this;

		//percent in decimal
		let newPercent = self.slider.val() / 100;

		//turn percent into position
		let newPos = newPercent * self.duration;

		//restart interval
		if (self.songStarted){
			self.currentPos = newPos;
			self.startTimer();
		}

		else{
			self.currentPos = newPos;
		}

		console.log('newpos', self.currentPos);
		
	}
	
	
	


	
}



module.exports = Audio;