'use strict';

var budo = require('budo');
var wrapHtml = require('./util/wrap-html');
var url = require('url');
var lr = require('inject-lr-script-stream');
var resolve = require('./util/content-resolver');
var toStr = require('stream-to-string');
var metaTagInjector = require('./util/meta-tag-injector');
var metadata = require('../metadata');
var path = require('path');

var app = budo('src/static.js', {
  watchGlob: 'src/**/*.{html,css,js}',
  live: true,
  dir: 'src',
  port: 9966,
  open: true,
  stream: process.stdout,
  defaultIndex: wrapHtml(),

  middleware: function (req, res, next) {
    var pathname = url.parse(req.url).pathname

    // Wrap index.html in the layout, if present:
    if (pathname.match(/\/$/) || !path.basename(pathname).match(/\./)) {
      pathname = path.join(pathname, 'index.html');
    }

    if (pathname.match(/\.html$/)) {
      try{
        var streams = resolve(path.join(__dirname, '/../src'), pathname, {
          defaultCss: 'index.css',
        }, function (err, streams, data) {
          res.statusCode = 200;

          wrapHtml(streams.html)({
            entry: data.staticRel,
            title: 'Page',
            js: streams.js,
            css: data.cssRel
          })
            .pipe(lr())
            .pipe(metaTagInjector(metadata.metaTags))
            .pipe(res);
        });
      } catch(e) {
        console.error(e.stack);
      }
    } else {
      next();
    }
  }
});
