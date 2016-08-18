'use strict'

var argv = require('minimist')(process.argv.slice(2));
var glob = require('glob');
var path = require('path');
var cp = require('cp');
var mkdirp = require('mkdirp');

var src = argv.src || 'src';
var srcAbs = path.resolve(path.join(process.cwd(), src));
var dest = argv.dest || 'dist';
var destAbs = path.resolve(path.join(process.cwd(), dest));

function error (msg) {
  if (msg) {
    console.error(err);
    process.exit(1);
  }
}
glob('src/**/*.' + argv.ext, function (err, files) {
  error(err);

  var i = 0;
  function nextFile () {
    (function (file) {
      var inputPath = path.resolve(file);
      var inputRel = path.relative(srcAbs, inputPath);
      var outputPath = path.join(destAbs, inputRel);
      var dir = path.dirname(outputPath);

      mkdirp(dir, function (err) {
        error(err);
        cp(inputPath, outputPath, function (err) {
          error(err);

          if (i < files.length) {
            nextFile();
          }
        });
      });
    })(files[i++]);
  }

  nextFile();
});
