'use strict';

global.isProd = false;

var gulp = require('gulp');
var config = require('./config');

var sourcemaps = require('gulp-sourcemaps');
var gulpif = require('gulp-if');
var browserSync = require('browser-sync');
var del = require('del');
var changed = require('gulp-changed');
var imagemin = require('gulp-imagemin');
var browserify = require('browserify');
var babelify = require('babelify');
var sass = require('gulp-sass');
var autoprefixer = require('autoprefixer-core');
var postcss = require('gulp-postcss');
var gutil = require('gulp-util');
var express = require('express');
var http = require('http');
var morgan = require('morgan');
var runSequence = require('run-sequence');
var plumber = require('gulp-plumber');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var size = require('gulp-size');
var jade = require('gulp-jade');
var watchify = require('watchify');
var s3 = require('gulp-s3');
var fs = require('fs');
var rev = require('gulp-rev');
var revReplace = require('gulp-rev-replace');
var revNapkin = require('gulp-rev-napkin');
var assign = require('lodash.assign');
var merge = require('utils-merge');
var gzip = require('gulp-gzip');

// -------------------------------------------------
//
// Apply production enviro
// 
// -------------------------------------------------
gulp.task('apply-prod-environment', function(){
    process.env.NODE_ENV = 'production';
});

// -------------------------------------------------
//
// Apply dev enviro
// 
// -------------------------------------------------
gulp.task('apply-dev-environment', function(){
    process.env.NODE_ENV = 'development';
});


// -------------------------------------------------
//
// Copy libraries
// 
// -------------------------------------------------
gulp.task('lib', function(){
    return gulp.src(config.lib.src)
        .pipe(uglify())
        .pipe(gulp.dest(config.lib.dest));
});

// -------------------------------------------------
//
// Data
// 
// -------------------------------------------------
gulp.task('data', function(){
    return gulp.src(config.data.src)
        .pipe(gulp.dest(config.data.dest));
});


// -------------------------------------------------
//
// Clean
// 
// -------------------------------------------------

gulp.task('clean', function(cb){
    return del([config.dist.root], cb);
});


// -------------------------------------------------
//
// Fonts
// 
// -------------------------------------------------

gulp.task('fonts', function(){
    return gulp.src(config.fonts.src)
        .pipe(changed(config.fonts.dest))
        .pipe(gulp.dest(config.fonts.dest));
});



// -------------------------------------------------
//
// Audio
// 
// -------------------------------------------------
gulp.task('audio', function(){
    return gulp.src(config.audio.src)
        .pipe(gulp.dest(config.audio.dest));
});

// -------------------------------------------------
//
// Images -- Only MIN called in production
// 
// -------------------------------------------------

gulp.task('images', function(){

    return gulp.src(config.images.src)
        .pipe(changed(config.images.dest))
        .pipe(gulpif(global.isProd, imagemin()))
        .pipe(gulp.dest(config.images.dest));
});



// -------------------------------------------------
//
// Script bundling
// 
// -------------------------------------------------
function bundleJs(bundler){

    return bundler.bundle()
        .on('error', function(err){
            gutil.log(err.message);
            browserSync.notify('Browserify error!');
            this.emit('end');
        })
        .pipe(plumber())
        .pipe(source('bundle.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(config.scripts.dest))
        .pipe(size({showFiles: true}))
        .pipe(browserSync.stream({once: true}));
}


function bundleJsProd(bundler, cb){

    bundler.bundle()
        .on('error', function(err){
            gutil.log(err.message);
            browserSync.notify('Browserify error!');
            this.emit('end');
        })
        .pipe(plumber())
        .pipe(source('bundle.js'))
        .pipe(buffer())
        .pipe(uglify())
        .pipe(gulp.dest(config.scripts.dest))
        .pipe(size({showFiles: true}));

    cb();
}




// -------------------------------------------------
//
// JS-Dev
// 
// -------------------------------------------------
gulp.task('scripts', function(){
    var args = merge(watchify.args, {debug: true});
    
    var bundler = watchify(browserify({
        entries: config.scripts.main,
        transform: [babelify],
        debug: true,
        cache: {},
        packageCache: {},
        fullPaths: true
    }, args));

    bundleJs(bundler);

    bundler.on('update', function(){
        bundleJs(bundler);
    });
});


// -------------------------------------------------
//
// JS-Prod
// 
// -------------------------------------------------
gulp.task('scripts-prod', function(cb){

    var args = merge(watchify.args, {debug: true});

    var bundler = watchify(browserify({
        entries: config.scripts.main,
        transform: [babelify],
        debug: true,
        cache: {},
        packageCache: {},
        fullPaths: true
    }, args));


    bundleJsProd(bundler, function(){
        cb();
    });

    

});



// -------------------------------------------------
//
// Dev Styles
// 
// -------------------------------------------------
gulp.task('styles', function(){

    return gulp.src(config.styles.src)
        .pipe(plumber())
        .pipe(sass({
            includePaths: require('node-bourbon').includePaths,
            sourceComments: 'map',
            sourceMap: 'sass',
            outputStyle: 'nested'
        }))
        .pipe(postcss([autoprefixer({browsers: ['last 2 versions']})]))
        .on('error', gutil.log)
        .pipe(gulp.dest(config.styles.dest))
        .pipe(size({showFiles: true}))
        .pipe(browserSync.stream());
});


// -------------------------------------------------
//
// Production Styles
// 
// -------------------------------------------------
gulp.task('styles-prod', function(){

    return gulp.src(config.styles.src)
        .pipe(plumber())
        .pipe(sass({
            includePaths: require('node-bourbon').includePaths,
            sourceComments: 'none',
            sourceMap: 'sass',
            outputStyle: 'compressed'
        }))

        .pipe(postcss([autoprefixer({browsers: ['last 2 versions']})]))
        .on('error', gutil.log)
        .pipe(gulp.dest(config.styles.dest))
        .pipe(size({showFiles: true}))
        .pipe(browserSync.stream());
});



// -------------------------------------------------
//
// Views
// 
// -------------------------------------------------

gulp.task('views', function(){
    return gulp.src(config.views.src)
        .pipe(plumber())
        .pipe(jade())
        .on('error', gutil.log)
        .pipe(gulp.dest(config.views.dest));

});



// -------------------------------------------------
//
// Extras
// 
// -------------------------------------------------

gulp.task('extras', function(){
    return gulp.src(config.extras, {base: config.src})
        .pipe(gulp.dest('build'));
});



// -------------------------------------------------
//
// Rev
// 
// -------------------------------------------------
gulp.task('rev', function(){

    gulp.src(['build/**/*.css', 'build/**/*.js'])
        .pipe(rev())
        .pipe(gulp.dest('build/'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('build/'));

    console.log('Rev finished');
});


gulp.task('rev-replace', ['rev'], function(){

    console.log('Replace started');

    let manifest = gulp.src('./build/rev-manifest.json');

    

    gulp.src('./build/index.html')
        .pipe(revReplace({
            manifest: manifest
        }))
        .on('error', gutil.log)
        .pipe(plumber())
        .pipe(gulp.dest(config.dist.root));



        

});



// -------------------------------------------------
//
// Serve
// 
// -------------------------------------------------

gulp.task('serve', function(){

    var server = express();

    //log all requests to console
    server.use(morgan('dev'));
    server.use(express.static(config.dist.root));

    //give index.html for all routes, leaving routing to Angular
    server.all('/*', function(req, res){

        res.sendFile('index.html', {root: 'build'});

    });

    //start server
    var s = http.createServer(server);

    s.on('error', function(err){

        if (err.code === 'EADDRINUSE'){
            gutil.log('Dev server already started on port');
        }
        else{
            throw(err);
        }

    });

    s.listen(config.serverPort);

});


// -------------------------------------------------
//
// Sync
// 
// -------------------------------------------------

gulp.task('browser-sync', function(){

    browserSync({
        port: config.browserPort,
        ui: {
            port: config.UIPort
        },
        proxy: 'localhost:' + config.serverPort
    });

});





// ------------------------------------------------
// Reloads + Streams
//

gulp.task('reload-js', ['scripts'], function(){
    browserSync.reload();
});

gulp.task('reload-views', ['views'], function(){
    browserSync.reload();
});

gulp.task('reload-images', ['images'], function(){
    browserSync.reload();
});

gulp.task('reload-data', ['data'], function(){
    browserSync.reload();
});

gulp.task('reload-audio', ['audio'], function(){
    browserSync.reload();
});


// ------------------------------------------------
// Main Tasks
//

gulp.task('dev', ['clean'], function(){

    global.isProd = false;



    runSequence([
        'apply-dev-environment',
        'audio',
        'extras',
        'lib',
        'data',
        'views',
        'fonts',
        'styles',
        'scripts',
        'images'
        ], ['browser-sync', 'serve']);


    gulp.watch(config.styles.src, ['styles']);
    gulp.watch(config.views.src, ['reload-views']);
    gulp.watch(config.images.src, ['reload-images']);
    gulp.watch(config.data.src, ['reload-data']);
    gulp.watch(config.audio.src, ['reload-audio']);
    // gulp.watch(config.scripts.src, ['reload-js']);

});



gulp.task('prod', ['clean'], function(){

    global.isProd = true;

    runSequence([
        'apply-prod-environment',
        'audio',
        'extras',
        'data',
        'scripts-prod',
        'lib',
        'views',
        'fonts',
        'styles-prod',
        'images'
        ], ['rev-replace']);
});



gulp.task('default', ['dev']);





