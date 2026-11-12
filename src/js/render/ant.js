/* render/ant.js
   Drawing one ant (every class), with cached pictures for speed when there are lots.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

/* Big colonies: only about 1,400 ants are drawn (VCAP per class: nurses, foragers, soldiers,
   scouts, super majors). The counts and balance do not change. */
var VCAP = [250, 600, 400, 80, 80], SPR = {}, SPRN = 0;

// normal ants are drawn from small cached pictures when there are lots of them, which is much faster
function antDraw(x, y, ang, sz, leaf, ph, kd, fast) {
    if (!fast || kd === 3 || kd === 7 || sz > 8 || BITE) {
        drawAnt(x, y, ang, sz, leaf, ph, kd);
        return;
    }
    var sb = Math.max(.25, Math.ceil(dpr * K * uz * 4) / 4), pb = Math.floor((((ph % 6.2832) + 6.2832) % 6.2832) / 6.2832 * 12), key = kd + '|' + pb + '|' + (leaf || 0) + '|' + Math.round(sz * 10) + '|' + sb, sp = SPR[key], half = sz * 1.7 + 2;
    if (!sp) {
        if (SPRN > 700) {
            SPR = {};
            SPRN = 0;
        }
        var c = document.createElement('canvas'), g, old = cx;
        c.width = c.height = Math.max(2, Math.ceil(half * 2 * sb));
        g = c.getContext('2d');
        g.setTransform(sb, 0, 0, sb, c.width / 2, c.height / 2);
        cx = g;
        drawAnt(0, 0, 0, sz, leaf, (pb + .5) / 12 * 6.2832, kd);
        cx = old;
        sp = SPR[key] = { c: c, w: c.width / sb };
        SPRN++;
    }
    cx.save();
    cx.translate(x, y);
    cx.rotate(ang);
    cx.drawImage(sp.c, -sp.w / 2, -sp.w / 2, sp.w, sp.w);
    cx.restore();
}

function drawAnt(x, y, ang, sz, leaf, ph, kd) {
    cx.save();
    cx.translate(x, y);
    cx.rotate(ang);
    if (kd === 3) {
        queen(sz / Math.sqrt(ZM[S.tier]), ph);
        cx.restore();
        return;
    }
    sz *= 1.55;
    cx.translate(0, Math.sin(ph * 1.7) * sz * .04);
    if (K * uz < .68) {
        cx.fillStyle = 'rgba(255,235,190,.13)';
        cx.beginPath();
        cx.ellipse(sz * .3, 0, sz * .9, sz * .42, 0, 0, 7);
        cx.fill();
        var u2 = sz / 3.6 * .72, sk = kd === 7 ? '#3a0f0a' : skinCol();
        cx.strokeStyle = '#120a05';
        cx.lineWidth = Math.max(.3, u2 * .4);
        cx.lineCap = 'round';
        cx.beginPath();
        for (var j2 = -1; j2 <= 1; j2++) {
            var s2 = Math.sin(ph + (j2 === 0 ? Math.PI : 0)) * u2 * .45, b2 = j2 * u2 * .55 + u2 * .1;
            cx.moveTo(b2, 0);
            cx.lineTo(b2 + u2 * .6 + s2, u2 * 1.5);
            cx.moveTo(b2, 0);
            cx.lineTo(b2 + u2 * .6 - s2, -u2 * 1.5);
        }
        cx.moveTo(u2 * 1.5, -u2 * .3);
        cx.lineTo(u2 * 2.7, -u2 * .8);
        cx.moveTo(u2 * 1.5, u2 * .3);
        cx.lineTo(u2 * 2.7, u2 * .8);
        cx.stroke();
        cx.fillStyle = AB[kd] || sk;
        cx.beginPath();
        cx.ellipse(-u2 * 1.35, 0, u2 * .9, u2 * .75, 0, 0, 7);
        cx.fill();
        cx.fillStyle = sk;
        cx.beginPath();
        cx.ellipse(0, 0, u2 * .62, u2 * .46, 0, 0, 7);
        cx.ellipse(u2 * 1.2, 0, u2 * .7, u2 * .6, 0, 0, 7);
        cx.fill();
        cx.restore();
        return;
    }
    var u = sz / 3.6 * .72;
    antBody(u, ph, kd);
    if (leaf >= 6)
        drawBits(u, leaf - 5);
    else if (leaf) {
        cx.save();
        cx.translate(u * 3.4, Math.sin(ph * .8) * u * .15);
        cx.scale(1.35, 1.35);
        var cg = leaf === true ? 1 : leaf;
        if (cg === 2) {
            cx.save();
            cx.globalCompositeOperation = 'lighter';
            var gg = cx.createRadialGradient(0, 0, 0, 0, 0, u * 2.2);
            gg.addColorStop(0, 'rgba(120,255,200,.55)');
            gg.addColorStop(1, 'rgba(120,255,200,0)');
            cx.fillStyle = gg;
            cx.beginPath();
            cx.arc(0, 0, u * 2.2, 0, 7);
            cx.fill();
            cx.restore();
            cx.fillStyle = '#8ff5d0';
            cx.strokeStyle = '#2a8a6a';
            cx.lineWidth = u * .14;
            cx.beginPath();
            cx.arc(0, 0, u * .95, 0, 7);
            cx.fill();
            cx.stroke();
            cx.fillStyle = 'rgba(255,255,255,.7)';
            cx.beginPath();
            cx.arc(-u * .3, -u * .3, u * .3, 0, 7);
            cx.fill();
        }
        else if (cg === 3) {
            cx.rotate(.5);
            cx.fillStyle = '#e0cfa0';
            cx.strokeStyle = '#6a5428';
            cx.lineWidth = u * .14;
            cx.beginPath();
            cx.moveTo(-u * 1.0, 0);
            cx.lineTo(-u * .4, -u * .8);
            cx.lineTo(u * .7, -u * .7);
            cx.lineTo(u * 1.1, u * .1);
            cx.lineTo(u * .3, u * .8);
            cx.lineTo(-u * .7, u * .6);
            cx.closePath();
            cx.fill();
            cx.stroke();
        }
        else if (cg === 4) {
            cx.fillStyle = '#5a3a22';
            cx.strokeStyle = '#2a170a';
            cx.lineWidth = u * .14;
            cx.beginPath();
            cx.arc(0, 0, u * .85, 0, 7);
            cx.fill();
            cx.stroke();
            cx.fillStyle = 'rgba(255,220,170,.25)';
            cx.beginPath();
            cx.arc(-u * .25, -u * .25, u * .3, 0, 7);
            cx.fill();
        }
        else {
            cx.rotate(.3);
            cx.fillStyle = '#74c653';
            cx.strokeStyle = '#2f6a1e';
            cx.lineWidth = u * .16;
            cx.beginPath();
            cx.ellipse(0, 0, u * 1.9, u * 1.15, 0, 0, 7);
            cx.fill();
            cx.stroke();
            cx.strokeStyle = 'rgba(30,80,20,.7)';
            cx.lineWidth = u * .14;
            cx.beginPath();
            cx.moveTo(-u * 1.7, 0);
            cx.lineTo(u * 1.7, 0);
            cx.moveTo(-u * .4, 0);
            cx.lineTo(u * .3, -u * .7);
            cx.moveTo(u * .3, 0);
            cx.lineTo(u * 1, -u * .6);
            cx.stroke();
        }
        cx.restore();
    }
    cx.restore();
}

/* The ant body (build 71 redesign, matching the queen): glossy dark armour in the player's skin colour with
   a warm sheen, the class colour on a segmented abdomen with glowing seams, a waist node, a shaped head with
   jaws, jointed legs and elbowed antennae. Seen from above, head to +x; u = size unit, ph = walk phase.
   kd: 1 soldier, 4 nurse, 5 forager, 6 scout, 7 super major, 8 worker. */
function antShade(hex, m) { var n = parseInt(hex.slice(1), 16); return antRgb([n >> 16 & 255, n >> 8 & 255, n & 255], m); }
var ANTC = {
    1: { a: [168, 44, 26], g: '255,110,70', name: 'Soldier' },
    4: { a: [214, 120, 152], g: '255,170,200', name: 'Nurse' },
    5: { a: [88, 140, 46], g: '170,240,110', name: 'Forager' },
    6: { a: [44, 120, 190], g: '120,200,255', name: 'Scout' },
    7: { a: [120, 28, 18], g: '255,80,50', name: 'Super major' },
    8: { a: [214, 150, 46], g: '255,210,110', name: 'Worker' },
    // rival colony raiders (threats/rivals.js)
    9: { a: [96, 60, 150], g: '200,160,255', name: 'Rival' }
};
function antRgb(c, m) { return 'rgb(' + Math.round(Math.min(255, c[0] * m)) + ',' + Math.round(Math.min(255, c[1] * m)) + ',' + Math.round(Math.min(255, c[2] * m)) + ')'; }

function antBody(u, ph, kd) {
    var g = cx, bite = BITE;
    u *= 1.18;
    var C = ANTC[kd] || ANTC[8], sol = kd === 1 || kd === 7 || kd === 9, big = kd === 7, sc = kd === 6, nur = kd === 4;
    var hw = big ? 1.25 : sol ? 1.0 : kd === 8 ? .85 : .74, hl = big ? 1.15 : sol ? .95 : .76;   // head width / length
    var gl = sc ? 1.05 : nur ? 1.18 : 1.08, gw = sc ? .7 : nur ? .95 : .88;                     // abdomen
    var L = sc ? 1.3 : 1.05, sk = skinCol(), chit = antShade(sk, .85), chit2 = antShade(sk, 1.7), lite = antShade(sk, 2.8);
    g.lineCap = 'round'; g.lineJoin = 'round';
    // soft contact shadow
    g.fillStyle = 'rgba(255,235,190,.1)'; g.beginPath(); g.ellipse(0, 0, u * 2.6, u * 1.25, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(-u * .25, u * .5, u * 2.4, u * .95, 0, 0, 7); g.fill();
    // legs: three pairs, tripod gait, femur + tibia + foot, a lighter edge
    for (var j = -1; j <= 1; j++) {
        var gp = ph + (j === 0 ? Math.PI : 0), sw = Math.sin(gp), bx = j * u * .3 + u * .08, spr = j === 1 ? .8 : j === -1 ? -.9 : -.05;
        [1, -1].forEach(function (d) {
            var s = sw * u * .5 * d, lift = Math.max(0, d * Math.cos(gp)), kx = bx + u * (.45 + spr) + s, ky = d * u * L, fx = bx + u * (.2 + spr * 1.7) + s * 1.6, fy = d * u * L * 1.6 * (1 - .14 * lift);
            g.strokeStyle = chit; g.lineWidth = u * .32; g.beginPath(); g.moveTo(bx, d * u * .2); g.lineTo(kx, ky); g.stroke();
            g.lineWidth = u * .22; g.beginPath(); g.moveTo(kx, ky); g.lineTo(fx, fy); g.stroke();
            g.lineWidth = u * .1; g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx + u * .22 * (spr > 0 ? 1 : -1), fy + d * u * .12); g.stroke();
            g.strokeStyle = 'rgba(255,190,150,.35)'; g.lineWidth = u * .09; g.beginPath(); g.moveTo(bx, d * u * .18); g.lineTo(kx, ky - d * u * .05); g.stroke();
        });
    }
    // antennae: long scape, elbow, clubbed tip
    var aw = Math.sin(ph * .5) * u * .25;
    [1, -1].forEach(function (d) {
        var ex = u * (1.2 + hl * .9), ey = d * u * hw * .5, kx2 = ex + u * .7, ky2 = d * u * (hw * .5 + .75) + d * aw * .4, tx = kx2 + u * .9, ty = d * u * (hw * .5 + .45) + d * aw;
        g.strokeStyle = chit; g.lineWidth = u * .12; g.beginPath(); g.moveTo(ex, ey); g.lineTo(kx2, ky2); g.lineTo(tx, ty); g.stroke();
        g.fillStyle = chit; g.beginPath(); g.ellipse(tx, ty, u * .16, u * .11, Math.atan2(ty - ky2, tx - kx2), 0, 7); g.fill();
    });
    // abdomen: class colour under dark armour plates, glowing seams, a wet highlight
    var gx = -u * (1.25 + gl * .35), gg = g.createRadialGradient(gx + u * .2, -u * gw * .4, u * .05, gx, 0, u * gl * 1.1);
    gg.addColorStop(0, antRgb(C.a, 1.45)); gg.addColorStop(.55, antRgb(C.a, .9)); gg.addColorStop(1, antRgb(C.a, .38));
    g.fillStyle = gg; g.beginPath(); g.ellipse(gx, 0, u * gl, u * gw, 0, 0, 7); g.fill();
    g.save(); g.beginPath(); g.ellipse(gx, 0, u * gl, u * gw, 0, 0, 7); g.clip();
    for (var k = 0; k < 3; k++) {
        var px = gx + u * gl * (.55 - k * .55);
        g.fillStyle = 'rgba(20,8,5,' + (.45 - k * .05) + ')';
        g.beginPath(); g.ellipse(px - u * .14, 0, u * .22, u * gw * 1.05, 0, -Math.PI / 2, Math.PI / 2); g.fill();
        g.strokeStyle = 'rgba(' + C.g + ',.75)'; g.lineWidth = u * .07;
        g.beginPath(); g.ellipse(px + u * .06, 0, u * .1, u * gw * .95, 0, -Math.PI / 2, Math.PI / 2); g.stroke();
    }
    g.restore();
    g.fillStyle = 'rgba(255,250,240,.38)'; g.beginPath(); g.ellipse(gx + u * .05, -u * gw * .45, u * gl * .5, u * gw * .18, 0, 0, 7); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = u * .08; g.beginPath(); g.ellipse(gx, 0, u * gl, u * gw, 0, 0, 7); g.stroke();
    if (nur) { g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(gx - u * .1, 0, u * .16, 0, 7); g.fill(); }
    if (big) { g.fillStyle = chit; for (k = 0; k < 3; k++) { g.beginPath(); g.moveTo(gx - u * .7 + k * u * .55, -u * gw * .9); g.lineTo(gx - u * .5 + k * u * .55, -u * gw * 1.45); g.lineTo(gx - u * .3 + k * u * .55, -u * gw * .9); g.fill(); } }
    // waist node
    var ng = g.createRadialGradient(-u * .7, -u * .1, u * .02, -u * .65, 0, u * .3); ng.addColorStop(0, chit2); ng.addColorStop(1, chit);
    g.fillStyle = ng; g.beginPath(); g.ellipse(-u * .66, 0, u * .2, u * .24, 0, 0, 7); g.fill();
    // thorax: two lobes with a sheen
    var tg = g.createRadialGradient(u * .05, -u * .2, u * .02, u * .1, 0, u * .7); tg.addColorStop(0, lite); tg.addColorStop(.6, chit); tg.addColorStop(1, '#0a0503');
    g.fillStyle = tg; g.beginPath(); g.ellipse(-u * .2, 0, u * .32, u * .3, 0, 0, 7); g.ellipse(u * .32, 0, u * .42, u * .36, 0, 0, 7); g.fill();
    g.strokeStyle = 'rgba(255,180,140,.35)'; g.lineWidth = u * .06; g.beginPath(); g.ellipse(u * .32, 0, u * .32, u * .26, 0, -2.5, -.7); g.stroke();
    // head: broad at the back, narrowing to the jaws
    var hx = u * (1.15 + hl * .35), hg = g.createRadialGradient(hx - u * .1, -u * hw * .35, u * .03, hx, 0, u * hw * 1.1);
    hg.addColorStop(0, sol ? antRgb(C.a, 1.2) : lite); hg.addColorStop(.55, sol ? antRgb(C.a, .6) : chit); hg.addColorStop(1, '#080302');
    g.fillStyle = hg;
    g.beginPath(); g.moveTo(hx - u * hl * .65, -u * hw * .55);
    g.bezierCurveTo(hx - u * hl * .7, -u * hw * 1.05, hx + u * hl * .5, -u * hw * 1.0, hx + u * hl * .75, -u * hw * .35);
    g.quadraticCurveTo(hx + u * hl * .9, 0, hx + u * hl * .75, u * hw * .35);
    g.bezierCurveTo(hx + u * hl * .5, u * hw * 1.0, hx - u * hl * .7, u * hw * 1.05, hx - u * hl * .65, u * hw * .55);
    g.closePath(); g.fill();
    if (sol) { g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = u * .07; g.beginPath(); g.moveTo(hx - u * hl * .5, 0); g.lineTo(hx + u * hl * .45, 0); g.stroke(); }
    g.strokeStyle = 'rgba(255,190,150,.4)'; g.lineWidth = u * .06; g.beginPath(); g.ellipse(hx, 0, u * hl * .5, u * hw * .6, 0, -2.4, -.6); g.stroke();
    // eyes
    [1, -1].forEach(function (d) {
        var ex = hx + u * hl * .15, ey = d * u * hw * .55;
        if (sc) { var eg = g.createRadialGradient(ex, ey, 0, ex, ey, u * .45); eg.addColorStop(0, 'rgba(' + C.g + ',.8)'); eg.addColorStop(1, 'rgba(' + C.g + ',0)'); g.fillStyle = eg; g.beginPath(); g.arc(ex, ey, u * .45, 0, 7); g.fill(); }
        g.fillStyle = sc ? 'rgb(' + C.g + ')' : '#050302'; g.beginPath(); g.ellipse(ex, ey, u * .2, u * .14, d * .4, 0, 7); g.fill();
        g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.arc(ex + u * .06, ey - d * u * .03, u * .05, 0, 7); g.fill();
    });
    // jaws: small for most, long sickles for soldiers and super majors
    var jl = big ? 1.5 : sol ? 1.0 : .5, op = (bite || 0) * .5 + .15;
    [1, -1].forEach(function (d) {
        var bx2 = hx + u * hl * .7, by2 = d * u * hw * .25;
        g.fillStyle = sol ? '#f0e2c6' : chit; g.strokeStyle = 'rgba(40,20,8,.8)'; g.lineWidth = u * .05;
        g.beginPath(); g.moveTo(bx2, by2 - d * u * .08);
        g.quadraticCurveTo(bx2 + u * jl * .6, by2 + d * u * (jl * .5 + op), bx2 + u * jl, by2 - d * u * (.05 - op * .3));
        g.quadraticCurveTo(bx2 + u * jl * .5, by2 + d * u * (.12 + op * .3), bx2, by2 + d * u * .1);
        g.closePath(); g.fill(); if (sol) g.stroke();
    });
}
