'use strict';

module.exports = resolve;

var fs = require('fs');
var path = require('path');

function resolve (basePath, htmlPath, options, cb) {
  var htmlPath = path.resolve(htmlPath);
  var dirname = path.dirname(htmlPath);
  var basename = path.basename(htmlPath, path.extname(htmlPath));
  var jsPath = path.resolve(dirname, basename + '.js');
  var cssPath = path.resolve(dirname, basename + '.css');

  var numUp = dirname.split('/').length - 1;
  var toRoot = [];
  for (var i = 0; i < numUp; i++) {
    toRoot.push('..');
  }
  var pathToRoot = path.join.apply(null, toRoot);

  fs.access(path.join(basePath, cssPath), fs.F_OK, function (err) {
    if (err) {
      cssPath = options.defaultCss
    }
    doResolve();
  });

  function doResolve () {
    var data = {
      htmlPath: htmlPath,
      basePath: basePath,
      dirname: dirname,
      basename: basename,
      jsPath: jsPath,
      cssPath: cssPath,
      cssRel: path.basename(cssPath, dirname),
      jsRel: path.basename(jsPath, dirname),
      pathToRoot: pathToRoot,
      staticRel: path.join(pathToRoot, 'static.js')
    };

    if (!data.htmlPath.match(/\.html$/)) {
      if (data.htmlPath.match(/\/$/)) {
        data.htmlPath += 'index.html';
      }
    }

    var streams = {
      html: fs.createReadStream(path.join(data.basePath, htmlPath)),
      js: fs.createReadStream(path.join(data.basePath, jsPath)),
      css: fs.createReadStream(path.join(data.basePath, cssPath))
    };

    var completeCnt = 0;
    function complete () {
      completeCnt++;
      if (completeCnt === Object.keys(streams).length) {
        cb(null, streams, data);
      }
    }

    for (var sstream in streams) {
      (function (stream) {
        streams[stream].on('error', function () {
          streams[stream] = null;
          complete();
        }).on('open', complete);
      }(sstream));
    }
  }
}
