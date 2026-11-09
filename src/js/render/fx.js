/* render/fx.js
   Particle effects and celebrations.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

// ---- effects ----

function burst(x, y, n, cols, sp) { for (var i = 0; i < n; i++) {
    var a = Math.random() * 6.28, v = sp * (.4 + Math.random() * .6);
    fx.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: .7 + Math.random() * .6, c: cols[i % cols.length], s: 2 + Math.random() * 2, g: 40 });
} }

function pulseRing(c) { rings.push({ x: QX, y: QY, r: 10, l: 1, c: c || '255,210,120' }); }

function celebrate(t) { gainJelly(2); flash = .6; pulseRing(); pulseRing('120,230,255'); burst(QX, QY, 60, ['#ffd35a', '#7fcf8f', '#fff', '#e0553f', '#6fa8ff'], 160); SFX.win(); toast(t + '! ' + fmt(S.totalHatched) + ' ants hatched.'); shake = .5; }

function goldFanfare() { var g = $('gold'); g.classList.remove('on'); void g.offsetWidth; g.classList.add('on'); setTimeout(function () { g.classList.remove('on'); }, 3300); [523, 659, 784, 1047, 1319].forEach(function (f, i) { setTimeout(function () { tn(f, .28, 'triangle', .09); }, i * 120); }); try {
    navigator.vibrate && navigator.vibrate([80, 40, 80, 40, 220]);
}
catch (e) { } }
