'use strict';

module.exports = {
    
    'browserPort': 9000,
    'UIPort': 9001,
    'serverPort': 9002,

    'lib': {
        'src': 'app/lib/**/*.js',
        'dest': 'build/lib'
    },

    'styles': {
        'src': 'app/styles/**/*.scss',
        'dest': 'build/css'
    },

    'scripts': {
        'src': ['app/scripts/**/*.js'],
        'dest': 'build/js',
        'main': 'app/scripts/main.js'
    },

    'views': {
        'src': 'app/**/*.jade',
        'dest': 'build'
    },

    'images': {
        'src': 'app/images/**/*',
        'dest': 'build/images'
    },

    'fonts': {
        'src': 'app/fonts/**/*',
        'dest': 'build/fonts'
    },

    'audio': {
        'src': 'app/audio/**/*',
        'dest': 'build/audio'
    },

    'dist': {
        'root': 'build'
    },

    'icons': {
        'src': 'app/icons/*',
        'dest': 'build/icons'
    },

    'data': {
        'src': 'app/data/*',
        'dest': 'build/data'
    },

    'src': 'app/',

    extras: ['app/robots.txt', 'app/favicon.ico', 'app/icons/*']
};