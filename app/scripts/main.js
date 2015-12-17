'use strict';

const $ = require('jquery');
const MobileDetect = require('mobile-detect');
const Audio = require('./components/controls');


class Piece {
	constructor(){

		this.init();

	}


	init(){

		let self = this;

		let md = new MobileDetect(window.navigator.userAgent);

		if (md.mobile()){
			return null;
		}

		else{

			let audio = new Audio();
			
			audio.init();

			$('.title').on('click', function(){
				$('html,body').animate({
					scrollTop: $(window).height() - 100
				},500);
			});
		}
	}

}


let piece = new Piece();

