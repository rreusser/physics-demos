'use strict';

var buildDist = require('./util/build-dist');
var meta = require('../metadata');
var argv = require('minimist')(process.argv.slice(2));

buildDist({
  appName: meta.appName,
  pattern: argv.pattern || 'src/*.html',
  destpath: argv.dest || 'dist',
  codepen: false,
  defaultCss: 'styles.css'
});
