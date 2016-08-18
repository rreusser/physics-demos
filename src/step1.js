'use strict';

var timer = new Timer({followFocus: window});
var plot = new Plotter({base: 'plot', aspectRatio: 1});

function computeMagnitudes (Er, Ei, l, k) {
  var c1 = Math.cos(k[1] * l);
  var s1 = Math.sin(k[1] * l);
  var c2 = Math.cos(k[2] * l);
  var s2 = Math.sin(k[2] * l);

  var A = pack([[
    [1, -1, -1, 0],
    [0, c1, c1, -c2],
    [0, 0, 0, 0],
    [0, -k[1] * s1, -k[1] * s1, k[2] * s2]
  ], [
    [0, 0, 0, 0],
    [0, s1, -s1, -s2],
    [-k[0], -k[1], k[1], 0],
    [0, k[1] * c1, -k[1] * c1, -k[2] * c2]
  ]]);

  ops.assign(Er, ndarray([-1, 0, 0, 0]));
  ops.assign(Ei, ndarray([0, 0, -k[0], 0]));

  var Ar = A.pick(0);
  var Ai = A.pick(1);
  var dr = ndarray([0, 0, 0, 0]);
  var di = ndarray([0, 0, 0, 0]);

  qrComplex.factor(Ar, Ai, dr, di);
  qrComplex.solve(Ar, Ai, dr, di, Er, Ei);
}

var E = pool.zeros([2, 5]);
ops.assign(E.pick(null, 0), ndarray([1, 0]));
var Esolve = E.lo(0, 1);
var Er = Esolve.pick(0);
var Ei = Esolve.pick(1);
var wavelength = 1;
var k0 = 2 * Math.PI / wavelength;
var ior = 1.5;
var k = [k0, k0 / ior, k0];
var l = 1;
var x, y;
var omega = 4;
var n = 100;
var prevN1;
var superposition = 1;

function computeXrange () { return [-1 + l * 0.5, 1 + l * 0.5]; }
function computeYrange () { return [-2.5, 3.5]; }

function rescale () {
  plot.resizeSVG();
  plot.setXrange(computeXrange());
  plot.setYrange(computeYrange());
  allocate();
}

function computeN1 () {
  return Math.round(l * n);
}

function needsAllocation () {
  return computeN1() !== prevN1;
}

function allocate () {
  x = [
    linspace(plot.xrange[0], 0, Math.round(-plot.xrange[0] * n + 1)),
    linspace(0, l, Math.round(l * n + 1)),
    linspace(l, plot.xrange[1], Math.round((plot.xrange[1] - l) * n + 1))
  ]

  y = [
    pool.zeros(x[0].shape),
    pool.zeros(x[0].shape),
    pool.zeros(x[1].shape),
    pool.zeros(x[1].shape),
    pool.zeros(x[2].shape)
  ];

  prevN1 = computeN1();
}

// Animation controllers:
var superpositionCtrl = new PID({k_p: 0.2, k_i: 0.0, k_d: 0.0});
var iorCtrl = new PID({k_p: 0.2, k_i: 0.0, k_d: 0.0});
var wavelengthCtrl = new PID({k_p: 0.2, k_i: 0.0, k_d: 0.0});
var thicknessCtrl = new PID({k_p: 0.2, k_i: 0.0, k_d: 0.0});
superpositionCtrl.setTarget(superposition);
iorCtrl.setTarget(ior);
wavelengthCtrl.setTarget(wavelength);
thicknessCtrl.setTarget(l);

// Tabluate the solutions:
function compute (dt, frame) {
  var wt = omega * timer.t;

  fill(y[0], function(i) {
    var kx = k[0] * x[0].get(i);
    return (Math.cos(kx - wt)) +
           (E.get(0, 1) * Math.cos(-kx - wt) - E.get(1, 1) * Math.sin(-kx - wt)) * superposition;
  });

  fill(y[1], function(i) {
    var kx = k[0] * x[0].get(i);
    return (Math.cos(kx - wt)) * superposition +
           (E.get(0, 1) * Math.cos(-kx - wt) - E.get(1, 1) * Math.sin(-kx - wt));
  });

  fill(y[2], function(i) {
    var kx = k[1] * x[1].get(i);
    return (E.get(0, 2) * Math.cos(kx - wt) - E.get(1, 2) * Math.sin(kx - wt)) * superposition+
           (E.get(0, 3) * Math.cos(-kx - wt) - E.get(1, 3) * Math.sin(-kx - wt));
  });

  fill(y[3], function(i) {
    var kx = k[1] * x[1].get(i);
    return (E.get(0, 2) * Math.cos(kx - wt) - E.get(1, 2) * Math.sin(kx - wt)) +
           (E.get(0, 3) * Math.cos(-kx - wt) - E.get(1, 3) * Math.sin(-kx - wt)) * superposition;
  });

  fill(y[4], function(i) {
    var kxwt = k[2] * x[2].get(i) - wt;
    return E.get(0, 4) * Math.cos(kxwt) - E.get(1, 4) * Math.sin(kxwt)
  });
}

controlPanel([
  {type: 'range', label: 'wavelength', initial: wavelength, min: 0.2, max: 2, steps: 180},
  {type: 'range', label: 'thickness', initial: l, min: 0.0, max: 4, steps: 400},
  {type: 'range', label: 'ior', initial: ior, min: 0.5, max: 4, steps: 350},
  {type: 'checkbox', label: 'superimposed', initial: true}
], {theme: 'light'}).on('input', function (data) {
  superpositionCtrl.setTarget(data.superimposed ? 1 : 0);
  iorCtrl.setTarget(data.ior);
  wavelengthCtrl.setTarget(data.wavelength);
  thicknessCtrl.setTarget(data.thickness);
});

function incidentColor () {
  var val = Math.max(0, Math.min(255, Math.round((1 - superposition) * 230)));
  return 'rgb(0,50,' + val + ')';
}

function reflectedColor () {
  var val = Math.max(0, Math.min(255, Math.round((1 - superposition) * 230)));
  return 'rgb(' + val + ',50,0)';
}

function drawWaves () {
  var inc = incidentColor();
  var ref = reflectedColor();
  scatter(plot, 'y0I', x[0], y[0], {width: 2, color: inc});
  scatter(plot, 'y0R', x[0], y[1], {width: 2, color: ref});
  scatter(plot, 'y1R', x[1], y[2], {width: 2, color: ref});
  scatter(plot, 'y1I', x[1], y[3], {width: 2, color: inc});
  scatter(plot, 'y2', x[2], y[4], {width: 2, color: inc});
}

function drawGlass () {
  scatter(plot, 'fill',
    [0, 0, l, l], [
    plot.yrange[0] - 1, plot.yrange[1] + 1,
    plot.yrange[1] + 1, plot.yrange[0] - 1], {
      fill: 'rgba(128, 128, 128, 0.2)',
      color: 'rgba(50, 50, 50, 0.4)',
      width: 1,
    }
  )
}

var incOutput = document.getElementById('incident-amplitude');
var reflOutput = document.getElementById('reflected-amplitude');
var transOutput = document.getElementById('transmitted-amplitude');

function writeAmplitudes () {
  incOutput.textContent = ops.norm2(E.pick(null, 0)).toFixed(3);
  reflOutput.textContent = ops.norm2(E.pick(null, 1)).toFixed(3);
  transOutput.textContent = ops.norm2(E.pick(null, 4)).toFixed(3);
}

plot.on('resize', function () {
  rescale();
  drawWaves();
  drawGlass();
});

function onFrame () {
  superposition += superpositionCtrl.update(superposition);
  ior += iorCtrl.update(ior);
  wavelength += wavelengthCtrl.update(wavelength);
  l += thicknessCtrl.update(l);

  if (needsAllocation()) {
    rescale();
    drawGlass();
  }

  k0 = 2 * Math.PI / wavelength;
  k = [k0, k0 / ior, k0];
  computeMagnitudes(Er, Ei, l, k);
  compute();
  drawWaves();

  writeAmplitudes();
}

onFrame();
timer.start();
new Animation().on('frame', onFrame).start();
