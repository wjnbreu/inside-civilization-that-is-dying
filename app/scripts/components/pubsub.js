'use strict';


// -------------------------------------------------
//
// Pubsub
// 
// -------------------------------------------------
const EventEmitter = require('events').EventEmitter;
const pubsub = new EventEmitter();


exports.pubsub = pubsub;