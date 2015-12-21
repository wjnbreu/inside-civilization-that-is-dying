'use strict';

const $ = require('jquery');
const MobileDetect = require('mobile-detect');
const Headroom = require('headroom.js');
const Audio = require('./components/controls');
const social = require('./components/social');


class Piece {
	constructor(){

		this.init();

	}


	init(){

		let self = this;


		self.setupNav();
		self.bindSocials();

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


	// ------------------------------------------------
	// Add headroom
	//
	
	setupNav(){
		let header = document.getElementById('nav');
		let headroom = new Headroom(header);
		headroom.init();
	}



	// ------------------------------------------------
	// Listen for social click events
	//
	
	bindSocials(){
		let self = this;
		let socials = document.getElementsByClassName('share-icon');

		for (let i = 0; i < socials.length; i++ ){
			socials[i].addEventListener('click', self.share, false);
		}
	}


	// ------------------------------------------------
	// Share to correct platform
	//
	
	share(ev){

		ev.preventDefault();

		let site = this.getAttribute('data-site');
		social(site);

	}

}


let piece = new Piece();

