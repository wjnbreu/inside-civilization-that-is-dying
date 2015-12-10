'use strict';


// const Track = require('./components/audio');
const Audio = require('./components/controls');


class Piece {
	constructor(){

		this.init();

	}


	init(){
		// let track = new Track();
		let audio = new Audio();
		audio.init();
	}
}


let piece = new Piece();

