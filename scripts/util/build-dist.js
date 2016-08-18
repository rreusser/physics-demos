'use strict';

var build = require('./build');
var glob = require('glob');
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');

module.exports = buildDist;

function buildDist (config, cb) {
  console.log('config:', config);
  mkdirp.sync(config.destpath);

  console.log('config', config);
  glob(path.join(config.basePath, config.pattern), function(err, files) {

    var i = 0;

    function nextFile () {
      (function (file) {
        console.log('Processing input: "[0;33;1m' + file + '"[0m');

        var opts = {};
        opts.codepen = !!config.codepen;
        opts.defaultCss = config.defaultCss || 'styles.css';

        if (config.externalJS) {
          opts.externalJS = config.externalJS;
        }

        var htmlRel = '/' + path.relative(config.basePath, file);
        build(config.basePath, htmlRel, opts, function(err, stream, meta) {
          if (err) {
            console.error(err);
            setImmediate(nextFile);
            return;
          }

          stream.on('end', function () {
            if (i < files.length) {
              setImmediate(nextFile);
            } else {
              cb && cb(null);
            }
          });

          var dest = path.join(config.destpath, htmlRel);
          mkdirp.sync(path.dirname(dest));

          console.log('Writing output: "[0;32;1m' + dest + '"[0m\n');

          stream.pipe(fs.createWriteStream(dest));
        });

      }(files[i++]));
    }

    nextFile();
  });
}
