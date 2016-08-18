'use strict';

window.d3 = require('d3');
window.ndarray = require('ndarray');
window.qrComplex = require('ndarray-householder-qr-complex');
window.pack = require('ndarray-pack');
window.unpack = require('ndarray-unpack');
window.show = require('ndarray-show');
window.pool = require('ndarray-scratch');
window.cwise = require('cwise');
window.ops = require('ndarray-ops');
window.cops = require('ndarray-complex');
window.fill = require('ndarray-fill');
window.linspace = require('ndarray-linspace');
window.controlPanel = require('control-panel');
window.PID = require('node-pid-controller');

window.Animation = require('./animation');
window.Plotter = require('./plotter');
window.Timer = require('./timer');
window.scatter = require('./scatter');
