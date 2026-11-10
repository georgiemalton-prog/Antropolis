/* render/queen.js
   Drawing the queen (build 62 redesign): an original dark queen with glossy black-red armour, a crown
   of spines, sickle jaws, slit eyes that glow, spidery spiked legs, and a huge swollen egg sac glowing
   between its plates (real ant and termite queens swell like this).
   Seen from above, head to +x. s = size unit, ph = walk phase. Uses the globals cx, pulse and Q.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

// colours: black-red armour, red sheen, pink-red skin under the plates, red glow
var QCOL = { ch: '#0c0405', ch2: '#2a0d0f', hi: '220,90,90', mem0: '#e8c8b8', mem1: '#a06a60', mem2: '#4a2224', egg: '255,140,100', eye: '255,60,40' };

function queen(s, ph) {
    var P = QCOL, tm = performance.now() * .002, br = 1 + Math.sin(tm * .8) * .025 + pulse * .07, i, j, fl = Math.abs(Q.fx) < .04 ? .04 : Math.abs(Q.fx);
    var wk = Math.min(1, Q.sv / 5), idl = Math.sin(tm * 1.1) * .012;
    cx.scale(Q.fx < 0 ? -fl : fl, 1);
    function rg(x0, y0, r0, x1, y1, r1, stops) { var g = cx.createRadialGradient(x0, y0, r0, x1, y1, r1); stops.forEach(function (c, k) { g.addColorStop(k / (stops.length - 1), c); }); return g; }
    function hi(a) { return 'rgba(' + P.hi + ',' + a + ')'; }
    // shadow
    cx.fillStyle = 'rgba(0,0,0,.45)';
    cx.beginPath();
    cx.ellipse(-s * .8, 0, s * 2.9, s * 1.35, 0, 0, 7);
    cx.fill();
    cx.save();
    cx.translate(0, Math.sin(ph * 2) * s * .04 * wk + Math.sin(tm * 1.3) * s * .012);
    cx.rotate(Math.sin(ph) * .03 * wk + idl);
    cx.lineJoin = 'round';
    cx.lineCap = 'round';

    // ---- legs: long and spiked, front pair reaching forward, back pair trailing, knees raised
    for (j = -1; j <= 1; j++) {
        var w = Math.sin(ph + j * 2) * s * (.04 + .12 * wk) + Math.sin(tm * 1.6 + j * 1.7) * s * .025, x0 = s * .32 + j * s * .3;
        [1, -1].forEach(function (d, n) {
            var w2 = n ? -w : w,
                kx = x0 + j * s * .45 + w2 * .5 + s * .05, ky = d * s * .9,
                ax = x0 + j * s * 1.25 + w2, ay = d * s * 1.5 - (j ? 0 : -d * s * .1),
                tx = ax + j * s * .3, ty = ay + d * s * .12;
            cx.strokeStyle = P.ch;
            cx.lineWidth = s * .17;
            cx.beginPath(); cx.moveTo(x0, d * s * .24); cx.lineTo(kx, ky); cx.stroke();
            cx.lineWidth = s * .09;
            cx.beginPath(); cx.moveTo(kx, ky); cx.lineTo(ax, ay); cx.stroke();
            cx.lineWidth = s * .05;
            cx.beginPath(); cx.moveTo(ax, ay); cx.lineTo(tx, ty); cx.stroke();
            cx.strokeStyle = hi(.45);
            cx.lineWidth = s * .035;
            cx.beginPath(); cx.moveTo(x0 + s * .02, d * s * .26); cx.lineTo(kx, ky - d * s * .05); cx.stroke();
            cx.strokeStyle = hi(.25);
            cx.lineWidth = s * .02;
            cx.beginPath(); cx.moveTo(kx, ky); cx.lineTo(ax, ay - d * s * .03); cx.stroke();
            // knee spike and shin spurs
            cx.fillStyle = P.ch;
            cx.beginPath(); cx.moveTo(kx - s * .08, ky); cx.lineTo(kx + s * .02 + j * s * .08, ky + d * s * .26); cx.lineTo(kx + s * .08, ky); cx.closePath(); cx.fill();
            cx.strokeStyle = P.ch;
            cx.lineWidth = s * .035;
            for (i = 1; i < 3; i++) {
                var sx = kx + (ax - kx) * i / 3, sy = ky + (ay - ky) * i / 3;
                cx.beginPath(); cx.moveTo(sx, sy); cx.lineTo(sx - s * .14, sy + d * s * .02); cx.stroke();
            }
        });
    }

    // ---- the egg sac (gaster): swollen pale skin, dark plates pulled apart, eggs glowing inside
    cx.save();
    cx.translate(-s * .55, 0);
    cx.rotate(Math.sin(tm * .7) * .03 + Math.sin(ph + 1.2) * .04 * wk);
    function sac() {
        cx.beginPath();
        cx.moveTo(-s * .05, -s * .26);
        cx.bezierCurveTo(-s * .55, -s * 1.25 * br, -s * 2.55, -s * 1.3 * br, -s * 3.2, -s * .3);
        cx.quadraticCurveTo(-s * 3.42, 0, -s * 3.2, s * .3);
        cx.bezierCurveTo(-s * 2.55, s * 1.3 * br, -s * .55, s * 1.25 * br, -s * .05, s * .26);
        cx.closePath();
    }
    sac();
    // under the plates: hot, translucent skin full of eggs
    cx.fillStyle = rg(-s * 1.7, 0, s * .1, -s * 1.7, 0, s * 1.9, [P.mem0, P.mem1, P.mem2]);
    cx.fill();
    cx.save();
    sac();
    cx.clip();
    for (i = 0; i < 16; i++) {
        var u = ((i * .37 + tm * .015) % 1), ex = -s * (.4 + u * 2.7), ey = Math.sin(i * 2.3) * s * .8 * Math.sin(Math.PI * Math.min(1, u * 1.1 + .05)), ea = .35 + .25 * Math.sin(tm * 1.5 + i);
        cx.fillStyle = 'rgba(255,245,220,' + ea + ')';
        cx.beginPath(); cx.ellipse(ex, ey, s * .13, s * .085, .3, 0, 7); cx.fill();
    }
    // the plates: big dark glossy bands with only narrow glowing seams between them
    var NP = 6;
    for (i = 0; i < NP; i++) {
        var x1 = -s * (.1 + i * .54) - s * .06, x2 = x1 - s * .46, mid = (x1 + x2) / 2, hh = s * 1.45 * br;
        cx.beginPath();
        cx.moveTo(x1, -hh);
        cx.quadraticCurveTo(x1 + s * .12, 0, x1, hh);
        cx.lineTo(x2, hh);
        cx.quadraticCurveTo(x2 + s * .12, 0, x2, -hh);
        cx.closePath();
        cx.fillStyle = rg(mid + s * .1, -s * .55, s * .02, mid, -s * .1, s * 1.5, [P.ch2, P.ch, P.ch]);
        cx.fill();
        // a curved sheen on each plate
        cx.strokeStyle = hi(.3);
        cx.lineWidth = s * .03;
        cx.beginPath(); cx.moveTo(x1 - s * .06, -s * .9 * br); cx.quadraticCurveTo(x1 + s * .02, -s * .3, x1 - s * .05, s * .1); cx.stroke();
        // small spines on the plate edges
        cx.fillStyle = P.ch;
        [1, -1].forEach(function (d) { var yy = d * s * (.55 + .1 * Math.sin(i)); cx.beginPath(); cx.moveTo(x2 + s * .05, yy); cx.lineTo(x2 - s * .16, yy + d * s * .05); cx.lineTo(x2 + s * .05, yy + d * s * .14); cx.closePath(); cx.fill(); });
    }
    // glow bleeding out of the seams
    for (i = 0; i <= NP; i++) {
        var gx = -s * (.1 + i * .54) - s * .03, ga2 = .35 + .2 * Math.sin(tm * 1.7 + i * .9) + pulse * .3;
        cx.strokeStyle = 'rgba(' + P.egg + ',' + ga2 + ')';
        cx.lineWidth = s * .05;
        cx.beginPath(); cx.moveTo(gx, -s * 1.4); cx.quadraticCurveTo(gx + s * .12, 0, gx, s * 1.4); cx.stroke();
    }
    // wet sheen across the top
    cx.fillStyle = 'rgba(255,250,235,.16)';
    cx.beginPath(); cx.ellipse(-s * 1.7, -s * .85, s * 1.2, s * .09, -.05, 0, 7); cx.fill();
    cx.restore();
    // the sac's edge
    sac();
    cx.strokeStyle = 'rgba(0,0,0,.55)';
    cx.lineWidth = s * .05;
    cx.stroke();
    // an egg sliding out of the tip when she lays
    if (pulse > .3) {
        cx.fillStyle = 'rgba(250,240,215,' + Math.min(1, pulse) + ')';
        cx.beginPath(); cx.ellipse(-s * 3.4 - pulse * s * .4, 0, s * .22, s * .28, 0, 0, 7); cx.fill();
        cx.fillStyle = 'rgba(' + P.egg + ',' + Math.min(.6, pulse * .6) + ')';
        cx.beginPath(); cx.arc(-s * 3.4 - pulse * s * .4, 0, s * .4, 0, 7); cx.fill();
    }
    cx.restore();

    // ---- waist: two spiked nodes
    [[-.32, .15], [-.6, .17]].forEach(function (nd) {
        cx.fillStyle = rg(s * nd[0], -s * .08, s * .01, s * nd[0], 0, s * .25, [P.ch2, P.ch]);
        cx.beginPath(); cx.ellipse(s * nd[0], 0, s * .13, s * nd[1], 0, 0, 7); cx.fill();
        cx.fillStyle = P.ch;
        [1, -1].forEach(function (d) { cx.beginPath(); cx.moveTo(s * (nd[0] - .06), d * s * nd[1] * .7); cx.lineTo(s * (nd[0] + .02), d * s * (nd[1] + .17)); cx.lineTo(s * (nd[0] + .07), d * s * nd[1] * .6); cx.closePath(); cx.fill(); });
    });

    // ---- thorax: ribbed armour with spines along the sides
    var th = [[-.08, .27, .3], [.3, .4, .42], [.7, .28, .36]];
    th.forEach(function (t) {
        cx.fillStyle = rg(s * (t[0] - .05), -s * t[2] * .55, s * .02, s * t[0], 0, s * .6, [P.ch2, P.ch, P.ch]);
        cx.beginPath(); cx.ellipse(s * t[0], 0, s * t[1], s * t[2], 0, 0, 7); cx.fill();
        cx.strokeStyle = 'rgba(0,0,0,.9)';
        cx.lineWidth = s * .035;
        cx.beginPath(); cx.ellipse(s * (t[0] - t[1] * .35), 0, s * t[1] * .15, s * t[2] * .9, 0, -1.3, 1.3); cx.stroke();
        cx.strokeStyle = hi(.4);
        cx.lineWidth = s * .03;
        cx.beginPath(); cx.ellipse(s * t[0], 0, s * t[1] * .8, s * t[2] * .8, 0, -2.5, -.65); cx.stroke();
    });
    cx.fillStyle = P.ch;
    [1, -1].forEach(function (d) {
        [[.1, .38], [.38, .45], [.66, .38]].forEach(function (sp) {
            cx.beginPath(); cx.moveTo(s * (sp[0] - .09), d * s * (sp[1] - .1)); cx.lineTo(s * (sp[0] - .2), d * s * (sp[1] + .2)); cx.lineTo(s * (sp[0] + .06), d * s * (sp[1] - .08)); cx.closePath(); cx.fill();
        });
    });

    // ---- head
    cx.save();
    cx.translate(s * .95, 0);
    cx.rotate(Math.sin(tm * .6) * .09 + Math.sin(tm * 1.9) * .03 + Math.sin(ph * 2) * .03 * wk);
    cx.scale(1.22, 1.3);
    cx.translate(-s * .95, 0);
    // crown of spines round the back of the head
    cx.fillStyle = P.ch;
    for (i = 0; i < 9; i++) {
        var a = Math.PI * (.62 + .76 * i / 8), bx = s * 1.25 + Math.cos(a) * s * .5, by = Math.sin(a) * s * .55, ln = s * (.3 + .14 * (i % 2 ? 0 : 1) + (i === 4 ? .1 : 0));
        cx.beginPath();
        cx.moveTo(bx - Math.sin(a) * s * .08, by + Math.cos(a) * s * .08);
        cx.lineTo(bx + Math.cos(a) * ln, by + Math.sin(a) * ln);
        cx.lineTo(bx + Math.sin(a) * s * .08, by - Math.cos(a) * s * .08);
        cx.closePath();
        cx.fill();
    }
    // the head plate: broad at the back, narrowing to the jaws
    cx.beginPath();
    cx.moveTo(s * .85, -s * .25);
    cx.bezierCurveTo(s * .9, -s * .72, s * 1.55, -s * .7, s * 1.85, -s * .3);
    cx.quadraticCurveTo(s * 1.98, 0, s * 1.85, s * .3);
    cx.bezierCurveTo(s * 1.55, s * .7, s * .9, s * .72, s * .85, s * .25);
    cx.closePath();
    cx.fillStyle = rg(s * 1.2, -s * .35, s * .02, s * 1.3, 0, s * .8, [P.ch2, P.ch, P.ch]);
    cx.fill();
    cx.strokeStyle = hi(.45);
    cx.lineWidth = s * .035;
    cx.beginPath(); cx.ellipse(s * 1.32, 0, s * .45, s * .5, 0, -2.4, -.5); cx.stroke();
    // a ridge down the middle
    cx.strokeStyle = 'rgba(0,0,0,.9)';
    cx.lineWidth = s * .04;
    cx.beginPath(); cx.moveTo(s * .95, 0); cx.lineTo(s * 1.75, 0); cx.stroke();
    cx.strokeStyle = hi(.25);
    cx.lineWidth = s * .02;
    cx.beginPath(); cx.moveTo(s * .98, -s * .03); cx.lineTo(s * 1.7, -s * .03); cx.stroke();
    [1, -1].forEach(function (d) {
        var aw = Math.sin(tm * 1.9 + d * 1.9) * s * .1 + Math.sin(tm * .6 + d) * s * .07 + Math.sin(ph * .9 + d) * s * .06 * wk,
            jo = (Math.sin(tm * .9 + d) * .5 + .5) * .12 + pulse * .1;
        // long sickle jaws with teeth on the inside
        cx.save();
        cx.translate(s * 1.78, d * s * .17);
        cx.rotate(d * jo);
        cx.fillStyle = P.ch;
        cx.beginPath();
        cx.moveTo(-s * .04, -d * s * .09);
        cx.bezierCurveTo(s * .45, -d * s * .02, s * .85, d * s * .25, s * 1.0, -d * s * .2);
        cx.quadraticCurveTo(s * .62, d * s * .1, -s * .04, d * s * .13);
        cx.closePath();
        cx.fill();
        cx.strokeStyle = hi(.45);
        cx.lineWidth = s * .025;
        cx.beginPath(); cx.moveTo(s * .05, -d * s * .06); cx.bezierCurveTo(s * .45, -d * s * .0, s * .8, d * s * .2, s * .95, -d * s * .16); cx.stroke();
        cx.fillStyle = P.ch;
        for (i = 1; i < 5; i++) { var tx2 = s * (.12 + i * .15), ty2 = d * s * (.05 + i * .025); cx.beginPath(); cx.moveTo(tx2, ty2); cx.lineTo(tx2 + s * .04, ty2 - d * s * .12); cx.lineTo(tx2 + s * .09, ty2); cx.closePath(); cx.fill(); }
        cx.restore();
        // antennae: long, elbowed, beaded
        cx.strokeStyle = P.ch;
        cx.lineWidth = s * .06;
        var e1x = s * 2.0, e1y = d * s * .62 + aw * .5, e2x = s * 2.5, e2y = d * s * .55 + aw, e3x = s * 2.85, e3y = d * s * .85 + aw * 1.5;
        cx.beginPath(); cx.moveTo(s * 1.6, d * s * .24); cx.lineTo(e1x, e1y); cx.lineTo(e2x, e2y); cx.lineTo(e3x, e3y); cx.stroke();
        cx.fillStyle = P.ch;
        for (i = 1; i <= 5; i++) { var q = i / 5; cx.beginPath(); cx.arc(e2x + (e3x - e2x) * q, e2y + (e3y - e2y) * q, s * (.04 + .012 * i), 0, 7); cx.fill(); }
        cx.beginPath(); cx.arc(e1x, e1y, s * .06, 0, 7); cx.fill();
        // glowing eyes
        var ex2 = s * 1.45, ey2 = d * s * .38, eg2 = cx.createRadialGradient(ex2, ey2, 0, ex2, ey2, s * .45), ga = .45 + .15 * Math.sin(tm * 2.2 + d);
        eg2.addColorStop(0, 'rgba(' + P.eye + ',' + ga + ')');
        eg2.addColorStop(1, 'rgba(' + P.eye + ',0)');
        cx.fillStyle = eg2;
        cx.beginPath(); cx.arc(ex2, ey2, s * .45, 0, 7); cx.fill();
        // a dark socket with a narrow, slanted slit of light
        cx.fillStyle = '#050304';
        cx.beginPath(); cx.ellipse(ex2, ey2, s * .2, s * .11, -d * .55, 0, 7); cx.fill();
        cx.fillStyle = 'rgba(' + P.eye + ',.95)';
        cx.beginPath(); cx.ellipse(ex2 + s * .01, ey2, s * .15, s * .035, -d * .55, 0, 7); cx.fill();
        cx.fillStyle = 'rgba(255,240,200,.85)';
        cx.beginPath(); cx.ellipse(ex2 + s * .05, ey2 - d * s * .02, s * .04, s * .015, -d * .55, 0, 7); cx.fill();
    });
    cx.restore();
    cx.restore();
}
