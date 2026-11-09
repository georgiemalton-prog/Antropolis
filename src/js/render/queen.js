/* render/queen.js
   Drawing the queen.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

function queen(s, ph) {
    var tm = performance.now() * .002, br = 1 + Math.sin(tm) * .03 + pulse * .08, j, i, g, fl = Math.abs(Q.fx) < .04 ? .04 : Math.abs(Q.fx);
    cx.scale(Q.fx < 0 ? -fl : fl, 1);
    cx.fillStyle = 'rgba(0,0,0,.35)';
    cx.beginPath();
    cx.ellipse(-s * .5, s * .95, s * 2.4, s * .45, 0, 0, 7);
    cx.fill();
    var wk = Math.min(1, Q.sv / 5), idl = Math.sin(tm * 1.1) * .012;
    function glossy(x0, y0, r0, x1, y1, r1, a, b, c) {
        var gr = cx.createRadialGradient(x0, y0, r0, x1, y1, r1);
        gr.addColorStop(0, a);
        gr.addColorStop(.5, b);
        gr.addColorStop(1, c);
        return gr;
    }
    cx.save();
    cx.translate(0, Math.sin(ph * 2) * s * .045 * wk + Math.sin(tm * 1.3) * s * .015);
    cx.rotate(Math.sin(ph) * .035 * wk + idl);
    cx.lineJoin = 'round';
    cx.lineCap = 'round';
    // legs: thigh, knee, shin and a little claw, dark and glossy
    for (j = -1; j <= 1; j++) {
        var w = Math.sin(ph + j * 2) * s * (.04 + .13 * wk) + Math.sin(tm * 2.2 + j * 1.7) * s * .02, x0 = s * .3 + j * s * .32;
        [1, -1].forEach(function (d, n) {
            var w2 = n ? -w : w, kx = x0 + j * s * .3 + w2 * .6, ky = d * s * .74, fx2 = x0 + j * s * .72 + w2, fy = d * s * 1.12;
            cx.strokeStyle = '#1c0e06';
            cx.lineWidth = s * .15;
            cx.beginPath();
            cx.moveTo(x0, d * s * .28);
            cx.lineTo(kx, ky);
            cx.lineTo(fx2, fy);
            cx.stroke();
            cx.lineWidth = s * .075;
            cx.strokeStyle = '#5c2e15';
            cx.beginPath();
            cx.moveTo(x0, d * s * .28);
            cx.lineTo(kx, ky);
            cx.stroke();
            cx.strokeStyle = '#7a4020';
            cx.beginPath();
            cx.moveTo(kx, ky);
            cx.lineTo(fx2, fy);
            cx.stroke();
            cx.fillStyle = '#2a140a';
            cx.beginPath();
            cx.arc(kx, ky, s * .09, 0, 7);
            cx.fill();
            cx.strokeStyle = '#1c0e06';
            cx.lineWidth = s * .05;
            cx.beginPath();
            cx.moveTo(fx2, fy);
            cx.lineTo(fx2 + j * s * .1 + d * 0, fy + d * s * .1);
            cx.stroke();
        });
    }
    // gaster: a pointed teardrop of dark glossy plates with amber edges
    cx.save();
    cx.translate(-s * .1, 0);
    cx.rotate(Math.sin(tm * .9) * .035 + Math.sin(ph + 1.2) * .05 * wk);
    cx.translate(s * .1 - s * .42, 0);
    function gp() {
        cx.beginPath();
        cx.moveTo(-s * .18, -s * .2);
        cx.bezierCurveTo(-s * .7, -s * .98 * br, -s * 2.1, -s * .98 * br, -s * 2.85, -s * .1);
        cx.quadraticCurveTo(-s * 3.0, 0, -s * 2.85, s * .1);
        cx.bezierCurveTo(-s * 2.1, s * .98 * br, -s * .7, s * .98 * br, -s * .18, s * .2);
        cx.closePath();
    }
    gp();
    cx.fillStyle = glossy(-s * 1.3, -s * .4, s * .1, -s * 1.4, 0, s * 1.7, '#7a5238', '#2e1b12', '#120904');
    cx.fill();
    cx.save();
    gp();
    cx.clip();
    for (i = 0; i < 6; i++) {
        var bx = -s * (.5 + i * .4), bh = s * 1.05 * br;
        cx.strokeStyle = 'rgba(0,0,0,.5)';
        cx.lineWidth = s * .09;
        cx.beginPath();
        cx.ellipse(bx - s * .06, 0, s * .3, bh, 0, -1.5, 1.5);
        cx.stroke();
        cx.strokeStyle = i % 2 ? 'rgba(210,150,70,.55)' : 'rgba(190,120,50,.4)';
        cx.lineWidth = s * .045;
        cx.beginPath();
        cx.ellipse(bx + s * .02, 0, s * .3, bh, 0, -1.5, 1.5);
        cx.stroke();
    }
    cx.fillStyle = 'rgba(255,225,190,.2)';
    cx.beginPath();
    cx.ellipse(-s * 1.45, -s * .52, s * .95, s * .13, -.06, 0, 7);
    cx.fill();
    cx.fillStyle = 'rgba(255,150,60,.12)';
    cx.beginPath();
    cx.ellipse(-s * 1.4, s * .72, s * 1.0, s * .08, .04, 0, 7);
    cx.fill();
    cx.restore();
    if (pulse > .3) {
        cx.fillStyle = 'rgba(250,245,230,' + Math.min(1, pulse) + ')';
        cx.beginPath();
        cx.ellipse(-s * 2.95 - pulse * s * .4, s * .05, s * .2, s * .26, 0, 0, 7);
        cx.fill();
    }
    cx.restore();
    // wing scars: the queen shed her wings, only pale stubs remain
    cx.fillStyle = 'rgba(232,212,165,.2)';
    cx.strokeStyle = 'rgba(210,180,120,.4)';
    cx.lineWidth = s * .03;
    [1, -1].forEach(function (d) { cx.beginPath(); cx.ellipse(-s * .4, d * s * .5, s * .8, s * .2, d * .2, 0, 7); cx.fill(); cx.stroke(); });
    // waist: a narrow stalk with a small node
    cx.fillStyle = '#2a140a';
    cx.beginPath();
    cx.ellipse(-s * .4, 0, s * .34, s * .1, 0, 0, 7);
    cx.fill();
    cx.fillStyle = '#5a2c12';
    cx.beginPath();
    cx.ellipse(-s * .5, 0, s * .1, s * .19, 0, 0, 7);
    cx.fill();
    // thorax: three plated lobes, rusty red
    var th = [[-.12, .26, .26], [.24, .4, .35], [.62, .27, .34]];
    th.forEach(function (t, n) {
        cx.fillStyle = glossy(s * (t[0] - .1), -s * t[2] * .5, s * .04, s * t[0], 0, s * .62, '#bd5a2a', '#7c3014', '#321206');
        cx.beginPath();
        cx.ellipse(s * t[0], 0, s * t[1], s * t[2], 0, 0, 7);
        cx.fill();
        cx.strokeStyle = 'rgba(25,8,2,.55)';
        cx.lineWidth = s * .05;
        cx.stroke();
        cx.fillStyle = 'rgba(255,215,170,.28)';
        cx.beginPath();
        cx.ellipse(s * (t[0] - .03), -s * t[2] * .5, s * t[1] * .55, s * t[2] * .14, 0, 0, 7);
        cx.fill();
    });
    // head: wider, with big eyes, hooked jaws and bent antennae
    cx.save();
    cx.translate(s * .95, 0);
    cx.rotate(Math.sin(tm * .8) * .1 + Math.sin(tm * 2.1) * .035 + Math.sin(ph * 2) * .03 * wk);
    cx.translate(-s * .95, 0);
    g = glossy(s * 1.15, -s * .25, s * .05, s * 1.3, 0, s * .72, '#bd5a2a', '#7c3014', '#321206');
    cx.fillStyle = g;
    cx.beginPath();
    cx.moveTo(s * .9, -s * .2);
    cx.bezierCurveTo(s * 1.0, -s * .62, s * 1.55, -s * .6, s * 1.78, -s * .22);
    cx.quadraticCurveTo(s * 1.86, 0, s * 1.78, s * .22);
    cx.bezierCurveTo(s * 1.55, s * .6, s * 1.0, s * .62, s * .9, s * .2);
    cx.closePath();
    cx.fill();
    cx.strokeStyle = 'rgba(25,8,2,.55)';
    cx.lineWidth = s * .05;
    cx.stroke();
    cx.fillStyle = 'rgba(255,215,170,.25)';
    cx.beginPath();
    cx.ellipse(s * 1.3, -s * .38, s * .3, s * .07, 0, 0, 7);
    cx.fill();
    [1, -1].forEach(function (d) {
        var aw = Math.sin(tm * 2.3 + d * 1.9) * s * .1 + Math.sin(tm * .7 + d) * s * .06 + Math.sin(ph * .9 + d) * s * .06 * wk;
        // mandibles
        cx.fillStyle = '#26120a';
        cx.beginPath();
        cx.moveTo(s * 1.68, d * s * .08);
        cx.quadraticCurveTo(s * 2.1, d * s * .2, s * 2.02, -d * s * .12);
        cx.quadraticCurveTo(s * 1.92, d * s * .04, s * 1.68, d * s * .2);
        cx.closePath();
        cx.fill();
        cx.fillStyle = '#e0a860';
        cx.beginPath();
        cx.arc(s * 2.0, -d * s * .1, s * .035, 0, 7);
        cx.fill();
        // antennae: scape, elbow, then a segmented tip
        cx.strokeStyle = '#1c0e06';
        cx.lineWidth = s * .075;
        cx.beginPath();
        cx.moveTo(s * 1.55, d * s * .2);
        cx.lineTo(s * 1.9, d * s * .55 + aw * .5);
        cx.lineTo(s * 2.3, d * s * .5 + aw);
        cx.lineTo(s * 2.55, d * s * .72 + aw * 1.4);
        cx.stroke();
        cx.fillStyle = '#1c0e06';
        cx.beginPath();
        cx.arc(s * 1.9, d * s * .55 + aw * .5, s * .06, 0, 7);
        cx.arc(s * 2.58, d * s * .74 + aw * 1.4, s * .08, 0, 7);
        cx.fill();
        // compound eye
        cx.fillStyle = '#0c0504';
        cx.beginPath();
        cx.ellipse(s * 1.42, d * s * .33, s * .17, s * .15, d * .5, 0, 7);
        cx.fill();
        cx.fillStyle = 'rgba(255,200,150,.85)';
        cx.beginPath();
        cx.arc(s * 1.37, d * s * .29, s * .05, 0, 7);
        cx.fill();
        cx.fillStyle = 'rgba(255,255,255,.4)';
        cx.beginPath();
        cx.arc(s * 1.46, d * s * .37, s * .025, 0, 7);
        cx.fill();
    });
    cx.restore();
    cx.restore();
}
