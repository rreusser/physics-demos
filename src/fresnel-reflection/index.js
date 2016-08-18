'use strict';

var plot = new Plotter({
  base: 'plot',
  aspectRatio: 1
});

function computeMagnitudes (Er, Ei, x1, x2, k) {
  var ck0x1 = Math.cos(k[0] * x1);
  var sk0x1 = Math.sin(k[0] * x1);
  var ck1x1 = Math.cos(k[1] * x1);
  var sk1x1 = Math.sin(k[1] * x1);
  var ck1x2 = Math.cos(k[1] * x2);
  var sk1x2 = Math.sin(k[1] * x2);
  var ck2x2 = Math.cos(k[2] * x2);
  var sk2x2 = Math.sin(k[2] * x2);

  var A = pack([[
    [ck0x1, -ck1x1, -ck1x1, 0],
    [0, ck1x2, ck1x2, -ck2x2],
    [-k[0] * sk0x1, k[1] * sk1x1, k[1] * sk1x1, 0],
    [0, -k[1] * sk1x2, -k[1] * sk1x2, k[2] * sk2x2]
  ], [
    [-sk0x1, -sk1x1, sk1x1, 0],
    [0, sk1x2, -sk1x2, -sk2x2],
    [-k[0] * ck0x1, -k[1] * ck1x1, k[1] * ck1x1, 0],
    [0, k[1] * ck1x2, -k[1] * ck1x2, -k[2] * ck2x2]
  ]]);

  ops.assign(Er, ndarray([-ck0x1, 0, k[0] * sk0x1, 0]));
  ops.assign(Ei, ndarray([-sk0x1, 0, -k[0] * ck0x1, 0]));

  var Ar = A.pick(0);
  var Ai = A.pick(1);
  var dr = ndarray([0, 0, 0, 0]);
  var di = ndarray([0, 0, 0, 0]);

  qrComplex.factor(Ar, Ai, dr, di);
  qrComplex.solve(Ar, Ai, dr, di, Er, Ei);
}

var state = {
  superposition: 1,
  backface: 0,
  ior: 1.5,
  wavelength: 1,
  x1: 0,
  x2: 1
};

var E = pool.zeros([2, 5]);
ops.assign(E.pick(null, 0), ndarray([1, 0]));
var Esolve = E.lo(0, 1);
var Er = Esolve.pick(0);
var Ei = Esolve.pick(1);
var k0 = 2 * Math.PI / state.wavelength;
var x, y;
var omega = 4;
var dx = 0.01;
var prevN1;
var shift = -computeThickness() * 0.5;
var controllers = {};

function computeK () {
  return [k0, k0 / state.ior, k0 * state.backface + (k0 / state.ior) * (1 - state.backface)];
}
function computeXrange () { return [-1, 1]; }
function computeYrange () { return [-2.5, 3.5]; }
function computeThickness () { return state.x2 - state.x1; }

function rescale () {
  plot.resizeSVG();
  plot.setXrange(computeXrange());
  plot.setYrange(computeYrange());
  allocate();
}

function computeN1 () {
  return Math.round(state.x2 * 1e6) / 1e6;
}

function needsAllocation () {
  return computeN1() !== prevN1;
}

function allocate () {
  var n1 = Math.max(0, Math.round((state.x1 - plot.xrange[0]) / dx));
  var n2 = Math.max(0, Math.round(computeThickness() / dx));
  var n3 = Math.max(0, Math.round((plot.xrange[1] - state.x2) / dx));
  x = [
    linspace(plot.xrange[0], state.x1, n1),
    linspace(state.x1, state.x2, n2),
    linspace(state.x2, plot.xrange[1], n3)
  ]

  if (y) {
    for (var i = 0; i < y.length; i++) {
      if (y[i]) pool.free(y[i]);
    }
  }

  y = [
    pool.zeros(x[0].shape),
    pool.zeros(x[0].shape),
    pool.zeros(x[1].shape),
    pool.zeros(x[1].shape),
    pool.zeros(x[2].shape)
  ];

  prevN1 = computeN1();
}

function createControllers () {
  for (var key in state) {
    controllers[key] = new PID({k_p: 0.2, k_i: 0.0, k_d: 0.0});
    controllers[key].setTarget(state[key]);
  }
}

function updateControllers () {
  for (var key in controllers) {
    state[key] += controllers[key].update(state[key]);
  }
}

// Tabluate the solutions:
function compute (t) {
  var k = computeK();
  var wt = omega * t;

  fill(y[0], function(i) {
    var kx = k[0] * x[0].get(i);
    return (Math.cos(kx - wt)) +
           (E.get(0, 1) * Math.cos(-kx - wt) - E.get(1, 1) * Math.sin(-kx - wt)) * state.superposition;
  });

  fill(y[1], function(i) {
    var kx = k[0] * x[0].get(i);
    return (Math.cos(kx - wt)) * state.superposition +
           (E.get(0, 1) * Math.cos(-kx - wt) - E.get(1, 1) * Math.sin(-kx - wt));
  });

  fill(y[2], function(i) {
    var kx = k[1] * x[1].get(i);
    return (E.get(0, 2) * Math.cos(kx - wt) - E.get(1, 2) * Math.sin(kx - wt)) * state.superposition+
           (E.get(0, 3) * Math.cos(-kx - wt) - E.get(1, 3) * Math.sin(-kx - wt));
  });

  fill(y[3], function(i) {
    var kx = k[1] * x[1].get(i);
    return (E.get(0, 2) * Math.cos(kx - wt) - E.get(1, 2) * Math.sin(kx - wt)) +
           (E.get(0, 3) * Math.cos(-kx - wt) - E.get(1, 3) * Math.sin(-kx - wt)) * state.superposition;
  });

  fill(y[4], function(i) {
    var kxwt = k[2] * x[2].get(i) - wt;
    return E.get(0, 4) * Math.cos(kxwt) - E.get(1, 4) * Math.sin(kxwt)
  });
}

controlPanel([
  {type: 'range', label: 'wavelength', initial: state.wavelength, min: 0.2, max: 2, steps: 180},
  {type: 'range', label: 'thickness', initial: state.x2 - state.x1, min: 0.0, max: 4, steps: 400},
  {type: 'range', label: 'ior', initial: state.ior, min: 0.5, max: 4, steps: 350},
  {type: 'checkbox', label: 'superposition', initial: true},
  {type: 'checkbox', label: 'backface', initial: false}
], {theme: 'light'}).on('input', function (data) {
  controllers.superposition.setTarget(data.superposition ? 1 : 0);
  controllers.ior.setTarget(data.ior);
  controllers.wavelength.setTarget(data.wavelength);
  controllers.x1.setTarget(data.thickness * (data.backface ? -0.5 : 0));
  controllers.x2.setTarget(data.thickness * (data.backface ? 0.5 : 1))
  controllers.backface.setTarget(data.backface ? 1 : 0);
});

function incidentColor () {
  var val = Math.max(0, Math.min(255, Math.round((1 - state.superposition) * 230)));
  return 'rgb(0,50,' + val + ')';
}

function reflectedColor () {
  var val = Math.max(0, Math.min(255, Math.round((1 - state.superposition) * 230)));
  return 'rgb(' + val + ',50,0)';
}

function drawWaves () {
  var inc = incidentColor();
  var ref = reflectedColor();
  scatter(plot, 'y0I', x[0], y[0], {width: 2, color: inc});
  scatter(plot, 'y0R', x[0], y[1], {width: 2, color: ref});
  scatter(plot, 'y1R', x[1], y[2], {width: 2, color: ref, opacity: state.backface});
  scatter(plot, 'y1I', x[1], y[3], {width: 2, color: inc});
  scatter(plot, 'y2', x[2], y[4], {width: 2, color: inc});
}

function drawGlass () {
  var yL = plot.yrange[0] - 1;
  var yH = plot.yrange[1] + 1;

  scatter(plot, 'fill1',
    [state.x2, state.x1, state.x1, state.x2], [yL, yL, yH, yH], {
      fill: 'rgba(128, 128, 128, 0.2)',
      color: 'rgba(50, 50, 50, 0.4)',
      width: 1,
    }
  )

  scatter(plot, 'fill-divider',
    [state.x2, state.x2], [yL, yH], {
      color: 'rgba(50, 50, 50, 0.4)',
      width: 1,
      opacity: state.backface
    }
  )

  scatter(plot, 'fill2',
    [state.x2, plot.xrange[1] + 1, plot.xrange[1] + 1, state.x2], [yL, yL, yH, yH], {
      fill: 'rgba(128, 128, 128, 0.2)',
      opacity: 1 - state.backface
    }
  )
}

var incOutput = document.getElementById('incident-amplitude');
var reflOutput = document.getElementById('reflected-amplitude');
var transOutput = document.getElementById('transmitted-amplitude');
var powerOutput = document.getElementById('total-power');

function writeAmplitudes () {
  var R = ops.norm2(E.pick(null, 1));
  var T = ops.norm2(E.pick(null, 4)) / (state.backface + (1 - state.backface) * Math.sqrt(state.ior));
  incOutput.textContent = ops.norm2(E.pick(null, 0)).toFixed(3);
  reflOutput.textContent = R.toFixed(3);
  transOutput.textContent = T.toFixed(3);
  powerOutput.textContent = (R * R + T * T).toFixed(3);

}

plot.on('resize', function () {
  rescale();
  drawWaves();
  drawGlass();
});

function onFrame (t, frame) {
  updateControllers();

  if (needsAllocation()) {
    rescale();
  }

  drawGlass();

  k0 = 2 * Math.PI / state.wavelength;
  computeMagnitudes(Er, Ei, state.x1, state.x2, computeK());
  compute(t / 1000);
  drawWaves();

  writeAmplitudes();
}

createControllers();
new Animation().on('frame', onFrame).start();
