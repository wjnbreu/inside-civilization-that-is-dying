'use strict';


const async = require('async');
const Track = require('./track');


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

		this.startStopButton = null;

		// ------------------------------------------------
		// Array of loaded stems
		//
		this.stems = [];

		

	}


	
	init(){
		let self = this;

		
		// ------------------------------------------------
		// Set up play/mute button
		//
		this.startStopButton = document.getElementById('play');
		this.startStopButton.addEventListener('click', function(ev){
			if (self.currentlyPlaying){
				self.muteSounds();
			}
			else{
				self.startSounds();
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

		let req = new XMLHttpRequest();
		req.open('GET', '/data/data.json', true);

		// ------------------------------------------------
		// Onload callback
		//
		req.onload = function(){
			// ------------------------------------------------
			// AJAX success
			//
			
			if (req.status >= 200 && req.status < 400){
				self.trackData = JSON.parse(req.responseText);
				
				//start loading audio
				self.initAudio();
			}
			else{
				console.log('Error fetching data', req.status);
			}
		};

		req.onerror = function(){
			console.log('There was an error fetching data');
		};

		// ------------------------------------------------
		// Fire off request
		//
		req.send();
	}




	initAudio(){

		let self = this;

		// ------------------------------------------------
		// Make new array of objects containing buffers for each source
		//
		for (let i = 0; i < self.trackData.length; i++ ){


			// ------------------------------------------------
			// Instantiate new Track
			// passing in track name, mp3 src, id, and 
			// reference to global Audio context
			//
			
			let stem = new Track(
				self.trackData[i].name,
				self.trackData[i].mp3,
				self.trackData[i].id,
				self.ctx
			);

			// ------------------------------------------------
			// Push track to master array of tracks
			//
			self.stems.push(stem);
		}


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
			// ------------------------------------------------
			// Show audio control bar
			//

			const bar = document.getElementById('audio');
			bar.classList.add('loaded');
			console.log('All stems loaded');
		});
	}



	// ------------------------------------------------
	// Start playing all sounds
	//
	
	startSounds(){
		let self = this;

		for (let i = 0; i < self.stems.length; i++ ){
			let stem = self.stems[i];

			//play with start position as attribute
			stem.play(0);
		}

		self.currentlyPlaying = true;
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

		self.currentlyPlaying = false;
	}
	
}



module.exports = Audio;