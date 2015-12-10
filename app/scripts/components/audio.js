'use strict';


const async = require('async');


// -------------------------------------------------
//
// Audio. Controls track components
// 
// -------------------------------------------------



class Track {

	constructor(){

		this.ctx = null;
		
		this.songLength = 0;
		this.currentPos = 0;
		this.currentlyPlaying = false;
		this.songStarted = false;

		this.startStopButton = null;

		this.trackData = [];
		this.sourceObjects = [];

		this.init();

	}


	// ------------------------------------------------
	// Simply tests for web audio support. TO-DO: Add message
	// to audio bar if not
	//
	
	init(){
		let self = this;

		this.startStopButton = document.getElementById('play');

		this.startStopButton.addEventListener('click', self.onStartStopClick.bind(this));


		// ------------------------------------------------
		// Listen for clicks on players
		//
		self.addPlayerClicks();
		

		// ------------------------------------------------
		// Test to see if audio context is valid
		//
		try{
			self.ctx = new AudioContext();
			self.initData();
		}
		catch(err){
			console.log('No Web Audio API Support', err);
		}
		
	}


	initData(){
		let self = this;

		let req = new XMLHttpRequest();
		req.open('GET', '/data/data.json', true);

		req.onload = function(){
			// ------------------------------------------------
			// AJAX success
			//
			
			if (req.status >= 200 && req.status < 400){
				self.trackData = JSON.parse(req.responseText);
				self.initAudio();
			}
			else{
				console.log('Error fetching data');
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
			
			let trackObject = {
				name: self.trackData[i].name,
				src: self.trackData[i].mp3,
				id: self.trackData[i].id,
				buf: null,
				playing: false,
				volume: 1,
				duration: 0
			};

			self.sourceObjects.push(trackObject);
		}

		// ------------------------------------------------
		// Loop through new array and load audio
		//
		async.each(self.sourceObjects, function(track, callback){


			let req = new XMLHttpRequest();


			req.open('GET', track.src, true);
			req.responseType = 'arraybuffer';


			// ------------------------------------------------
			// Request load callback
			//
			req.onload = function(response){


				
				self.ctx.decodeAudioData(req.response, function(buffer){


					//get a reference to the buffer and add to object
					track.buf = buffer;

					//get song length in seconds
					self.songLength = buffer.duration;

					//remove loader
					let loadTarget = document.getElementById(track.id);

					if (loadTarget){
						loadTarget.remove();
					}
					

					callback();
				});
			};


			// ------------------------------------------------
			// Send request
			//
			req.send();
			
			
		// ------------------------------------------------
		// Final async callback
		//
		
		}, function(err){
			if (err){
				console.log('A file failed to load');
			}

			else{

				console.log('All sounds loaded');

				//show audio bar
				let bar = document.getElementById('audio');
				
				//show control bar
				bar.classList.add('loaded');

				
			}
		});
	}




	// ------------------------------------------------
	// Add player clicks
	//
	addPlayerClicks(){

		let self = this;

		let players = document.getElementsByClassName('player');

		for (let i = 0; i < players.length; i++ ){
			
			

			players[i].addEventListener('click', self.onPlayerClick, false);


		}
	}


	onPlayerClick(ev){
		let playerName = this.getAttribute('data-name');
		console.log(playerName);
	}
	


	// ------------------------------------------------
	// Start playing all sounds
	//
	
	startSounds(){
		let self = this;

		for (let i = 0; i < self.sourceObjects.length; i++ ){
			self.play(self.sourceObjects[i]);
			self.sourceObjects[i].playing = true;
		}

		self.currentlyPlaying = true;
		self.songStarted = true;

		const timerContainer = document.getElementById('timer');


		// ------------------------------------------------
		// Starts timer
		//
		
		self.timer = setInterval(function(){
			self.currentPos = self.ctx.currentTime;
			self.currentPos = self.currentPos.toFixed(3);

			timerContainer.innerHTML = 'Current Time: ' + self.currentPos + 's';
		}, 100);

	}


	// ------------------------------------------------
	// Play
	//
	play(track, pos){

		let self = this;


		pos = pos || 0;

		//set up new buffersource
		track.bufferSource = self.ctx.createBufferSource();

		//set buffer to equal original source buffer from XMLHttp request
		track.bufferSource.buffer = track.buf;

		//create gain node
		track.gainNode = self.ctx.createGain();

		track.gainNode.gain.value = track.volume;

		//connect sound buffer to gain node
		track.bufferSource.connect(track.gainNode);

		//connect gain node to speakers
		track.gainNode.connect(self.ctx.destination);

		//start buffer
		track.bufferSource.start(0);

	}


	unMute(track){
		track.gainNode.gain.value = 1;
	}



	mute(track){
		track.gainNode.gain.value = 0;
	}



	// ------------------------------------------------
	// Stop (actually just mutes)
	//
	stopSounds(){

		let self = this;

		for (let i = 0; i < self.sourceObjects.length; i++ ){
			self.mute(self.sourceObjects[i]);
			self.sourceObjects[i].playing = true;
		}

	}

	restartSounds(){
		let self = this;
		for (let i = 0; i < self.sourceObjects.length; i++ ){
			self.unMute(self.sourceObjects[i]);
			self.sourceObjects[i].playing = false;
		}

	}
	



	// ------------------------------------------------
	// Start/Stop handler
	//
	onStartStopClick(){

		let self = this;

		if (!self.currentlyPlaying){
			if (!self.songStarted){
				self.startSounds();
				self.startStopButton.classList.add('off');
				self.currentlyPlaying = true;
			}

			else{
				self.restartSounds();
				self.startStopButton.classList.add('off');
				self.currentlyPlaying = true;
			}
			
		}

		else{
			self.stopSounds();
			self.startStopButton.classList.remove('off');
			self.currentlyPlaying = false;
		}
	}
	
	

}



module.exports = Track;