/* render/queen.js
   Drawing the queen (build 77 redesign): a proper ant seen from above - broad head, narrow thorax with
   wing scars, two waist beads and a big round abdomen - in glossy black-red armour with glowing seams
   and faceted garnet eyes lit from inside. Jointed legs walk in a tripod gait; the abdomen swells and an
   egg slips out when she lays.
   Head to +x. s = size unit, ph = walk phase. Uses the globals cx, pulse and Q.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

// colours: black-red armour (lit, mid, shadow), red sheen, glowing seams, legs
var QCOL = { b0: '#3a1210', b1: '#14070a', b2: '#050203', hi: '255,120,100', seam: 'rgba(255,90,50,', leg: '#0e0506' };

function queen(s, ph) {
    var C = QCOL, tm = performance.now() * .002, br = 1 + Math.sin(tm * .8) * .025 + pulse * .07, fl = Math.abs(Q.fx) < .04 ? .04 : Math.abs(Q.fx);
    var wk = Math.min(1, Q.sv / 5), idl = Math.sin(tm * 1.1) * .012;
    cx.scale(Q.fx < 0 ? -fl : fl, 1);
    function rad(x0, y0, r0, x1, y1, r1, a, b, c) { var q = cx.createRadialGradient(x0, y0, r0, x1, y1, r1); q.addColorStop(0, a); q.addColorStop(.55, b); q.addColorStop(1, c); return q; }
    // shadow
    cx.fillStyle = 'rgba(0,0,0,.4)'; cx.beginPath(); cx.ellipse(-s * .7, s * .25, s * 3, s * 1.2, 0, 0, 7); cx.fill();
    cx.save();
    cx.translate(0, Math.sin(ph * 2) * s * .04 * wk + Math.sin(tm * 1.3) * s * .012);
    cx.rotate(Math.sin(ph) * .03 * wk + idl);
    cx.lineJoin = 'round';
    cx.lineCap = 'round';
    // legs: three pairs from the thorax, jointed, thin, tripod gait
    // femur angle (from the body's forward axis, outwards) and tibia angle for front, middle and hind legs
    var LG = [[.66, 1.0, .35], [.32, 1.62, 2.0], [.0, 2.15, 2.65]];
    LG.forEach(function (L, j) {
        [1, -1].forEach(function (d) {
            var sw = Math.sin(ph + (j % 2 ? Math.PI : 0) + (d < 0 ? Math.PI : 0)) * (.03 + .15 * wk) + Math.sin(tm * 1.6 + j * 1.7 + d) * .03, bx = s * L[0], by = d * s * .28,
                fa = L[1] + sw, ta = L[2] + sw * 1.2,
                kx = bx + Math.cos(fa) * s * .95, ky = by + d * Math.sin(fa) * s * .95,
                tx = kx + Math.cos(ta) * s * 1.0, ty = ky + d * Math.abs(Math.sin(ta)) * s * .55 + d * s * .1,
                fx = tx + Math.cos(ta) * s * .32, fy = ty + d * s * .1;
            cx.strokeStyle = C.leg; cx.lineWidth = s * .17; cx.beginPath(); cx.moveTo(bx, by); cx.lineTo(kx, ky); cx.stroke();
            cx.lineWidth = s * .12; cx.beginPath(); cx.moveTo(kx, ky); cx.lineTo(tx, ty); cx.stroke();
            cx.lineWidth = s * .07; cx.beginPath(); cx.moveTo(tx, ty); cx.lineTo(fx, fy); cx.stroke();
            cx.lineWidth = s * .04; cx.beginPath(); cx.moveTo(fx, fy); cx.lineTo(fx + Math.cos(ta - .6) * s * .14, fy + d * s * .1); cx.moveTo(fx, fy); cx.lineTo(fx + Math.cos(ta + .6) * s * .14, fy + d * s * .02); cx.stroke();
            cx.fillStyle = C.b1; cx.beginPath(); cx.arc(kx, ky, s * .1, 0, 7); cx.arc(tx, ty, s * .075, 0, 7); cx.fill();
            cx.strokeStyle = 'rgba(' + C.hi + ',.25)'; cx.lineWidth = s * .045; cx.beginPath(); cx.moveTo(bx, by - d * s * .04); cx.lineTo(kx, ky - d * s * .04); cx.stroke();
        });
    });
    // abdomen (gaster): big, round, glossy, a few overlapping plates
    var gx = -s * 1.95, grx = s * 1.38, gry = s * 1.12 * br;
    cx.fillStyle = rad(gx + s * .3, -s * .45, s * .1, gx, 0, grx * 1.15, C.b0, C.b1, C.b2);
    // an egg: full and round at the back, narrowing to a short neck at the waist
    cx.beginPath(); cx.moveTo(gx + grx + s * .1, 0);
    cx.bezierCurveTo(gx + grx * .95, -gry * .55, gx + grx * .5, -gry, gx, -gry);
    cx.bezierCurveTo(gx - grx * .65, -gry, gx - grx * 1.02, -gry * .5, gx - grx * 1.02, 0);
    cx.bezierCurveTo(gx - grx * 1.02, gry * .5, gx - grx * .65, gry, gx, gry);
    cx.bezierCurveTo(gx + grx * .5, gry, gx + grx * .95, gry * .55, gx + grx + s * .1, 0); cx.fill();
    // two soft bands across the back, like the reference
    for (var k = 0; k < 2; k++) {
        var px = gx + grx * (.2 - k * .5), hh = gry * Math.sqrt(Math.max(0, 1 - Math.pow((px - gx) / (grx * 1.02), 2))) * .97;
        cx.strokeStyle = C.seam + Math.min(1, .5 + .2 * Math.sin(tm * 1.5 + k) + pulse * .4) + ')'; cx.lineWidth = s * (.1 + pulse * .05);
        cx.beginPath(); cx.moveTo(px + s * .18, -hh); cx.quadraticCurveTo(px - s * .2, 0, px + s * .18, hh); cx.stroke();
    }
    cx.fillStyle = 'rgba(' + C.hi + ',.3)'; cx.beginPath(); cx.ellipse(gx + s * .15, -gry * .5, grx * .45, gry * .15, -.1, 0, 7); cx.fill();
    // laying: an egg slips out at the back as the queen pulses
    if (pulse > .3) {
        cx.fillStyle = 'rgba(250,240,215,' + Math.min(1, pulse) + ')';
        cx.beginPath(); cx.ellipse(gx - grx * 1.02 - pulse * s * .4, 0, s * .22, s * .28, 0, 0, 7); cx.fill();
        cx.fillStyle = 'rgba(255,140,100,' + Math.min(.6, pulse * .6) + ')';
        cx.beginPath(); cx.arc(gx - grx * 1.02 - pulse * s * .4, 0, s * .4, 0, 7); cx.fill();
    }
    // waist: two little beads (the petiole) - the pinch that makes an ant an ant
    [[-s * .5, s * .2, s * .24], [-s * .18, s * .17, s * .2]].forEach(function (n) {
        cx.fillStyle = rad(n[0] - s * .05, -s * .08, s * .02, n[0], 0, n[1] * 1.2, C.b0, C.b1, C.b2);
        cx.beginPath(); cx.ellipse(n[0], 0, n[1], n[2], 0, 0, 7); cx.fill();
    });
    // thorax: narrow, humped, wing scars of a queen
    cx.fillStyle = rad(s * .3, -s * .18, s * .03, s * .3, 0, s * .8, C.b0, C.b1, C.b2);
    cx.beginPath(); cx.moveTo(s * .02, 0);
    cx.bezierCurveTo(s * .05, -s * .42, s * .5, -s * .5, s * .72, -s * .34);
    cx.quadraticCurveTo(s * .98, -s * .2, s * .96, 0); cx.quadraticCurveTo(s * .98, s * .2, s * .72, s * .34);
    cx.bezierCurveTo(s * .5, s * .5, s * .05, s * .42, s * .02, 0); cx.fill();
    cx.strokeStyle = 'rgba(0,0,0,.5)'; cx.lineWidth = s * .04; cx.beginPath(); cx.moveTo(s * .62, -s * .36); cx.quadraticCurveTo(s * .55, 0, s * .62, s * .36); cx.stroke();
    cx.fillStyle = 'rgba(255,150,120,.35)';
    [1, -1].forEach(function (d) { cx.beginPath(); cx.ellipse(s * .32, d * s * .36, s * .14, s * .06, d * .3, 0, 7); cx.fill(); });
    cx.fillStyle = 'rgba(' + C.hi + ',.3)'; cx.beginPath(); cx.ellipse(s * .45, -s * .2, s * .28, s * .07, -.1, 0, 7); cx.fill();
    // head: broad, rounded at the back, big jaws
    var hx = s * 1.55, aw = Math.sin(tm * 1.2) * .08;
    // antennae: long straight scape out to the side, then the bent, longer part forward (as the reference)
    [1, -1].forEach(function (d) {
        var bx = hx + s * .4, by = d * s * .26, ex = bx + s * .25, ey = d * s * 1.0, tx = ex + s * 1.3, ty = d * s * (1.55 + aw * 2) ;
        cx.strokeStyle = C.leg; cx.lineWidth = s * .09; cx.beginPath(); cx.moveTo(bx, by); cx.lineTo(ex, ey); cx.stroke();
        cx.lineWidth = s * .07; cx.beginPath(); cx.moveTo(ex, ey); cx.quadraticCurveTo(ex + s * .6, ey + d * s * .2, tx, ty); cx.stroke();
        cx.fillStyle = C.leg; cx.beginPath(); cx.ellipse(tx, ty, s * .11, s * .07, .3 * d, 0, 7); cx.fill();
    });
    cx.fillStyle = rad(hx - s * .1, -s * .25, s * .03, hx, 0, s * .8, C.b0, C.b1, C.b2);
    cx.beginPath(); cx.moveTo(hx - s * .55, 0);
    cx.bezierCurveTo(hx - s * .62, -s * .72, hx + s * .35, -s * .8, hx + s * .56, -s * .32);
    cx.quadraticCurveTo(hx + s * .66, 0, hx + s * .56, s * .32);
    cx.bezierCurveTo(hx + s * .35, s * .8, hx - s * .62, s * .72, hx - s * .55, 0); cx.fill();
    cx.strokeStyle = 'rgba(0,0,0,.45)'; cx.lineWidth = s * .035; cx.beginPath(); cx.moveTo(hx - s * .42, 0); cx.lineTo(hx + s * .3, 0); cx.stroke();
    cx.fillStyle = 'rgba(' + C.hi + ',.28)'; cx.beginPath(); cx.ellipse(hx - s * .05, -s * .32, s * .26, s * .07, -.2, 0, 7); cx.fill();
    // eyes: big faceted gems wrapped round the sides of the head, lit from inside
    var pl = .75 + .25 * Math.sin(tm * 2.1);
    [1, -1].forEach(function (d) {
        cx.save(); cx.translate(hx + s * .1, d * s * .5);
        // the glow spills onto the head
        cx.save(); cx.globalCompositeOperation = 'lighter';
        var gl = cx.createRadialGradient(0, 0, 0, 0, 0, s * .55); gl.addColorStop(0, 'rgba(255,70,30,' + (.5 * pl) + ')'); gl.addColorStop(1, 'rgba(255,70,30,0)');
        cx.fillStyle = gl; cx.beginPath(); cx.arc(0, 0, s * .55, 0, 7); cx.fill(); cx.restore();
        cx.rotate(d * .35);
        cx.fillStyle = '#060102'; cx.beginPath(); cx.ellipse(0, 0, s * .27, s * .19, 0, 0, 7); cx.fill();
        var gg = cx.createRadialGradient(s * .06, -d * s * .05, s * .01, 0, 0, s * .25); gg.addColorStop(0, '#ffe2a0'); gg.addColorStop(.3, '#ff7a30'); gg.addColorStop(.75, '#c41c10'); gg.addColorStop(1, '#4a0804');
        cx.fillStyle = gg; cx.beginPath(); cx.ellipse(0, 0, s * .23, s * .15, 0, 0, 7); cx.fill();
        // the facets
        cx.save(); cx.beginPath(); cx.ellipse(0, 0, s * .23, s * .15, 0, 0, 7); cx.clip();
        cx.strokeStyle = 'rgba(40,4,2,.55)'; cx.lineWidth = s * .014;
        cx.beginPath();
        for (var q = -4; q <= 4; q++) { cx.moveTo(q * s * .07 - s * .2, -s * .2); cx.lineTo(q * s * .07 + s * .2, s * .2); cx.moveTo(q * s * .07 + s * .2, -s * .2); cx.lineTo(q * s * .07 - s * .2, s * .2); }
        cx.stroke();
        cx.restore();
        cx.fillStyle = 'rgba(255,255,255,.85)'; cx.beginPath(); cx.arc(s * .08, -d * s * .06, s * .03, 0, 7); cx.fill();
        cx.restore();
    });
    // jaws: curved, toothed, slightly open and working
    var op = .18 + Math.max(0, Math.sin(tm * 2.2)) * .1 + pulse * .1;
    [1, -1].forEach(function (d) {
        var jx = hx + s * .5, jy = d * s * .2;
        cx.fillStyle = '#2a0c0a'; cx.strokeStyle = 'rgba(0,0,0,.6)'; cx.lineWidth = s * .03;
        cx.beginPath(); cx.moveTo(jx, jy - d * s * .08);
        cx.quadraticCurveTo(jx + s * .45, jy + d * s * (.12 + op), jx + s * .55, jy - d * s * (.05 + op * .2));
        cx.quadraticCurveTo(jx + s * .3, jy + d * s * (.05 + op * .3), jx, jy + d * s * .1); cx.closePath(); cx.fill(); cx.stroke();
        cx.fillStyle = 'rgba(255,240,220,.5)';
        for (var t = 0; t < 3; t++) { cx.beginPath(); cx.arc(jx + s * (.2 + t * .1), jy + d * s * (.02 + op * .25), s * .025, 0, 7); cx.fill(); }
    });
    cx.restore();
}
