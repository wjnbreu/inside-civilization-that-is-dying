'use strict';

const $ = require('jquery');
const MobileDetect = require('mobile-detect');
const Headroom = require('headroom.js');
const Audio = require('./components/controls');


class Piece {
	constructor(){

		this.init();

	}


	init(){

		let self = this;


		self.setupNav();

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


	setupNav(){
		let header = document.getElementById('nav');
		let headroom = new Headroom(header);
		headroom.init();
	}

}


let piece = new Piece();

