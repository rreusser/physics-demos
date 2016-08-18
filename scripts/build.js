'use strict';

var buildDist = require('./util/build-dist');
var meta = require('../metadata');
var argv = require('minimist')(process.argv.slice(2));
var path = require('path');

buildDist({
  appName: meta.appName,
  basePath: argv.basePath || path.join(__dirname, '..', 'src'),
  pattern: argv.pattern || '**/*.html',
  destpath: argv.dest || path.join(__dirname, '..', 'dist'),
  codepen: false,
  defaultCss: 'styles.css'
});
