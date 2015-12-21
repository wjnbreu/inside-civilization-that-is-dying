'use strict';

const config = require('../config');

module.exports = function(site){

    if (site === 'twitter'){
        var tweet = config.twitter + '#RBMADaily';
        window.open('https://twitter.com/home?status=' +
            (encodeURIComponent(tweet + ' ' +
            window.location.href)),
            'Twitter',
            'toolbar=no,width=450,height=400,directories=no,status=no,scrollbars=yes,resize=no,menubar=no,top=200,left=200');
    }

    if (site === 'facebook'){
        window.open('https://www.facebook.com/sharer/sharer.php?u=' +
            (encodeURIComponent(window.location.href)),
            'Facebook',
            'toolbar=no,width=450,height=400,directories=no,status=no,scrollbars=yes,resize=no,menubar=no,top=200,left=200');
    }
};
