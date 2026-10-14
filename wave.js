/* =========================================================
   LinkPoint — Geometric Wave Animation
   FPS-independent via delta-time (requestAnimationFrame timestamp).
   Two low-poly layers, straight-line segments, glowing vertex dots.
   ========================================================= */
(function () {
  'use strict';

  var canvas = document.getElementById('heroWave');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var W = 0, H = 0, t = 0, raf = null;
  var lastTs = null;

  /* Target speed in radians/second — same visual feel at any refresh rate.
     Derived from old 0.014/frame × 60fps = 0.84 rad/sec base. */
  var BASE_SPEED = 0.84;

  /* Two distinct layers: lighter behind, darker in front.
     Both fill from y=0 downward; layer 2 covers the top portion.
     The lighter band is visible between the two wave lines. */
  var LAYERS = [
    /* Layer 1 — bright teal, lower (behind). Low n = big low-poly facets. */
    { y: 0.82, a: 0.09, f: 2.1, spd: 0.70, ph: 0.00, n: 6, fill: '#2DD4BF', lc: 'rgba(13,148,136,0.85)', dc: '#0D9488', dr: 5   },
    /* Layer 2 — mid teal, higher (in front). Even fewer points. */
    { y: 0.45, a: 0.15, f: 1.8, spd: 0.52, ph: 2.09, n: 5, fill: '#0D9488', lc: 'rgba(4,60,54,0.85)',    dc: '#064E48', dr: 4.5 },
  ];

  function resize() {
    var dpr  = window.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function buildPoints(layer) {
    var count = layer.n + 2; /* +2 anchors at left/right edges */
    var pts = [];
    for (var i = 0; i < count; i++) {
      var p     = i / (count - 1);
      var angle = p * layer.f * Math.PI + t * layer.spd + layer.ph;
      pts.push([p * W, layer.y * H + Math.sin(angle) * layer.a * H]);
    }
    return pts;
  }

  function drawLayer(layer) {
    var pts = buildPoints(layer);

    /* Filled polygon: top-left → wave → top-right */
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.lineTo(W, 0);
    ctx.closePath();
    ctx.fillStyle = layer.fill;
    ctx.fill();

    /* Wave outline — straight segments, miter joins */
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (var j = 1; j < pts.length; j++) ctx.lineTo(pts[j][0], pts[j][1]);
    ctx.strokeStyle = layer.lc;
    ctx.lineWidth   = 2;
    ctx.lineJoin    = 'miter';
    ctx.miterLimit  = 10;
    ctx.stroke();

    /* Glowing dots at interior vertices */
    for (var k = 1; k < pts.length - 1; k++) {
      var x = pts[k][0], y = pts[k][1];

      /* Soft halo */
      var halo = ctx.createRadialGradient(x, y, 0, x, y, layer.dr * 4.5);
      halo.addColorStop(0, layer.dc + '55');
      halo.addColorStop(1, layer.dc + '00');
      ctx.beginPath();
      ctx.arc(x, y, layer.dr * 4.5, 0, Math.PI * 2);
      ctx.fillStyle = halo;
      ctx.fill();

      /* Solid core */
      ctx.beginPath();
      ctx.arc(x, y, layer.dr, 0, Math.PI * 2);
      ctx.fillStyle = layer.dc;
      ctx.fill();
    }
  }

  function frame(timestamp) {
    /* Delta-time: capped at 100 ms to swallow tab-switch / focus pauses */
    if (lastTs === null) lastTs = timestamp;
    var dt = Math.min((timestamp - lastTs) / 1000, 0.1);
    lastTs = timestamp;

    t += BASE_SPEED * dt;

    ctx.clearRect(0, 0, W, H);
    for (var l = 0; l < LAYERS.length; l++) drawLayer(LAYERS[l]);
    raf = requestAnimationFrame(frame);
  }

  var debounce;
  window.addEventListener('resize', function () {
    clearTimeout(debounce);
    debounce = setTimeout(function () {
      cancelAnimationFrame(raf);
      resize();
      lastTs = null;
      raf = requestAnimationFrame(frame);
    }, 80);
  });

  resize();
  raf = requestAnimationFrame(frame);
}());
