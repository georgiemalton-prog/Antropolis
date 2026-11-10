/* render/workers.js
   Drawing workers at work: spoil heaps, dirt kicks, tunnel diggers, the crew, and the egg pile.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

function drawSpoil() {
    if (cavHeap > .5 && S.dug < 1) {
        var Hh = tendHome(), hw = 5 + Math.sqrt(cavHeap) * 2.4, hh2 = 2 + Math.sqrt(cavHeap) * 1.3;
        cx.fillStyle = '#7d5232';
        cx.beginPath();
        cx.ellipse(Hh.x, Hh.y + 3, hw, hh2, 0, Math.PI, 0);
        cx.fill();
        cx.fillStyle = 'rgba(255,220,170,.15)';
        cx.beginPath();
        cx.ellipse(Hh.x - hw * .25, Hh.y + 3 - hh2 * .6, hw * .35, hh2 * .25, 0, 0, 7);
        cx.fill();
    }
    spoil.forEach(function (p) {
        var n = p.n, r = 0, row = 5, i = 0;
        while (n > 0) {
            var k = Math.min(row, Math.ceil(n));
            for (var j = 0; j < k; j++) {
                var x = p.x + (j - (k - 1) / 2) * 3.6, y = p.y + 2 - r * 2.6;
                cx.fillStyle = i % 3 === 0 ? '#9a6e44' : i % 3 === 1 ? '#b58a5c' : '#82593a';
                cx.beginPath();
                cx.ellipse(x, y, 2.1, 1.7, i * .7, 0, 7);
                cx.fill();
                i++;
            }
            n -= k;
            row = Math.max(1, row - 1);
            r++;
        }
    });
}

function dirtKick(a, x, y, ang, now) {
    a.dft = now;
    if (fx.length > 240)
        return;
    var hx = x + Math.cos(ang) * 4, hy = y + Math.sin(ang) * 4, cols = ['#8a6340', '#6b4a2c', '#a8814f'];
    for (var k = 0; k < 2; k++) {
        var ba = ang + Math.PI + (Math.random() - .5) * 1.4, sp = 26 + Math.random() * 26;
        fx.push({ x: hx, y: hy, vx: Math.cos(ba) * sp, vy: Math.sin(ba) * sp - 14, l: .32 + Math.random() * .15, c: cols[(Math.random() * 3) | 0], s: 1.5 + Math.random(), g: 110 });
    }
}
// two workers chewing at the end of each tunnel being dug
var DIGO = {};
function drawFarDig(now) {
    if (!DIGF.length)
        return;
    cx.save();
    cx.translate(0, -cam);
    DIGF.forEach(function (e, n) {
        var st = e.deep ? S.ddg : S.fdg, pr = Math.max(.002, Math.min(1, st[e.i] || 0)), a = at(pr, e.q);
        if (a.x < VR.x0 || a.x > VR.x1 || a.y < VR.y0 || a.y > VR.y1)
            return;
        for (var k = 0; k < 2; k++) {
            var id = (e.deep ? 'd' : 'f') + e.i + '_' + k, o = DIGO[id] || (DIGO[id] = {}), dw = Math.sin(now * .011 + k * 2.3 + n), back = 3 + k * 4.5, side = (k ? -1 : 1) * 1.6;
            var x = a.x - Math.cos(a.ang) * (back - Math.max(0, dw) * 1.8) + a.nx * side, y = a.y - Math.sin(a.ang) * (back - Math.max(0, dw) * 1.8) + a.ny * side, an = a.ang + Math.max(0, dw) * Math.sin(now * .04 + k) * .12;
            if (dw > .95 && !(o.dft > now - 300))
                dirtKick(o, x, y, an, now);
            drawAnt(x, y, an, SZ[6], false, now * .01 + k * 3, KD[6]);
        }
    });
    cx.restore();
}
function drawCrew(now) {
    cx.save();
    cx.translate(0, -cam);
    drawSpoil();
    var ss = crewSites(now), slotN = {};
    crewA.forEach(function (a, i) {
        var s = a.si >= 0 ? ss[a.si] : null, x, y, ang, carry = false, q;
        if (a.st && a.st[0] === 't' && a.trt) {
            q = routeAt(a.trt, Math.max(0, Math.min(a.tL, a.d)));
            var lnT = (a.ln || 0) * tunW() * .32, outT = a.st === 'tgo';
            x = q.x + q.nx * lnT;
            y = q.y + q.ny * lnT;
            ang = outT || a.st === 'twork' ? q.ang : q.ang + Math.PI;
            if (a.st === 'twork') {
                var sdT = a.side || 1, scr = Math.max(0, Math.sin(now * .012 + i)) * 1.2;
                if (scr > 1.15 && !(a.dft > now - 400))
                    dirtKick(a, q.x + q.nx * sdT * tunW() * .3, q.y + q.ny * sdT * tunW() * .3, q.ang + sdT * 1.4, now);
                x = q.x + q.nx * sdT * tunW() * .3 + Math.cos(q.ang + sdT * 1.4) * scr;
                y = q.y + q.ny * sdT * tunW() * .3 + Math.sin(q.ang + sdT * 1.4) * scr;
                ang = q.ang + sdT * 1.4;
            }
            if (a.st === 'tdump')
                ang += 1.1 * Math.sin(Math.PI * Math.min(1, a.t / .8));
            if ((a.st === 'tret' || a.st === 'tdump') && a.carry)
                carry = 5 + Math.min(3, a.carry);
        }
        else if (!s || a.st === 'idle') {
            var sdw = QX < W * .5 ? -1 : 1, hx = Math.max(30, Math.min(W - 30, QX + sdw * (95 + S.tier * 4)));
            var rr = 4 + Math.sqrt(i) * 7.5, th2 = i * 2.39996;
            x = hx + Math.cos(th2) * rr + Math.sin(now * .0005 + i * 2.1) * 2.5;
            y = QY + 30 + Math.sin(th2) * rr * .55 + Math.sin(now * .0007 + i * 1.3) * 1.5;
            ang = (sdw > 0 ? 3.1416 : 0) + Math.sin(now * .0004 + i) * .5;
            var cvn = cav(), ex = (x - cvn.x) / (cvn.rx - 10), ey = (y - cvn.y) / (cvn.ry - 10), r2 = ex * ex + ey * ey;
            if (r2 > 1) {
                x = cvn.x + (x - cvn.x) / Math.sqrt(r2);
                y = cvn.y + (y - cvn.y) / Math.sqrt(r2);
            }
        }
        else if (a.st === 'dig') {
            slotN[a.si] = (slotN[a.si] || 0) + 1;
            q = s.fa(slotN[a.si] - 1);
            var dw = Math.sin(now * .011 + i * 1.7), nud = Math.max(0, dw) * 1.8;
            x = q.x + Math.cos(q.ang) * nud;
            y = q.y + Math.sin(q.ang) * nud;
            ang = q.ang + Math.sin(now * .006 + i) * .06 + Math.max(0, dw) * Math.sin(now * .04 + i) * .12;
            // each push into the face kicks a little soil back past the digger
            if (dw > .95 && !(a.dft > now - 260))
                dirtKick(a, x, y, ang, now);
        }
        else {
            q = routeAt(s.rt, a.d);
            var ln = (a.ln || 0) * tunW() * .32, fwd = a.st === 'out' || a.st === 'drop';
            x = q.x + q.nx * ln;
            y = q.y + q.ny * ln;
            ang = fwd ? q.ang : q.ang + Math.PI;
            if (a.st === 'drop')
                ang += (i % 2 ? 1 : -1) * 1.2 * Math.sin(Math.PI * Math.min(1, a.t / .8));
            if (fwd)
                carry = 5 + a.carry;
        }
        smoothPos(a, x, y, ang, now);
        x = a.sx;
        y = a.sy;
        ang = a.sa;
        var gph = a.gp;
        a.wx = x;
        a.wy = y;
        a.wa = ang;
        a.wp = gph;
        cx.globalAlpha = a.al == null ? 1 : a.al;
        drawAnt(x, y, ang, SZ[6], carry, gph, KD[6]);
        cx.globalAlpha = 1;
    });
    cx.restore();
}

// the brood: each egg grows through the real life stages as it develops, from a tiny glossy egg to a curled
// larva (gut showing through) to a pale pupa whose eyes darken just before it hatches. big: drawing scale (nest scene)
function eggs(now, big) {
    cx.save();
    cx.translate(0, -cam);
    S.eggs.forEach(function (e, i) {
        var p = big ? nestEggPos(i) : eggPos(i), s = popIn(Math.max(0, Math.min(1, (now - (e.b || 0)) / 450))), d = e.d || Math.max(e.t, 18), u = Math.max(0, Math.min(1, 1 - e.t / d)),
            w = e.t < 5 ? Math.sin(now * .02 * (6 - e.t)) * .3 * (1 - e.t / 8) : 0, gd = e.c === 4, sc = s * (big || 1.3) * (gd ? 1.25 : 1);
        cx.save();
        cx.translate(p.x, p.y);
        cx.rotate(w + (i % 3 - 1) * .5);
        cx.scale(sc, sc);
        if (gd) {
            cx.save();
            cx.globalCompositeOperation = 'lighter';
            glow(0, 0, 9, '255,210,60', .5 + .3 * Math.sin(now * .006));
            cx.restore();
        }
        if (u < .3)
            broodEgg(u / .3, gd);
        else if (u < .7)
            broodLarva((u - .3) / .4, gd, now * .003 + i);
        else
            broodPupa((u - .7) / .3, gd);
        cx.restore();
    });
    cx.restore();
}

// a tiny glossy egg, slightly see-through, growing a little
function broodEgg(v, gd) {
    var a = 1.5 + .5 * v, b = 2.4 + .8 * v, g = cx.createRadialGradient(-a * .3, -b * .35, .2, 0, 0, b * 1.1);
    g.addColorStop(0, gd ? '#fff6c8' : '#ffffff'); g.addColorStop(.6, gd ? 'rgba(255,215,90,.92)' : 'rgba(242,236,222,.9)'); g.addColorStop(1, gd ? 'rgba(200,150,40,.85)' : 'rgba(200,190,170,.75)');
    cx.fillStyle = g; cx.beginPath(); cx.ellipse(0, 0, a, b, 0, 0, 7); cx.fill();
    cx.fillStyle = 'rgba(255,255,255,.85)'; cx.beginPath(); cx.ellipse(-a * .35, -b * .45, a * .25, b * .2, -.3, 0, 7); cx.fill();
    if (v > .5) { cx.fillStyle = 'rgba(120,70,40,' + (v - .5) * .5 + ')'; cx.beginPath(); cx.ellipse(0, b * .1, a * .3, b * .25, 0, 0, 7); cx.fill(); }
}

// a plump larva curled into a C, its gut showing dark through the skin, wriggling now and then
function broodLarva(v, gd, ph) {
    var r = 2.4 + 1.8 * v, th = 1.6 + 1.1 * v, wr = Math.sin(ph * 2.3) * .12, a0 = .5 + wr, a1 = 4.9 + wr, k;
    cx.lineCap = 'round';
    cx.strokeStyle = gd ? '#f3d27a' : '#efe6d2'; cx.lineWidth = th * 2;
    cx.beginPath(); cx.arc(0, 0, r, a0, a1); cx.stroke();
    cx.strokeStyle = gd ? 'rgba(255,240,190,.9)' : 'rgba(255,253,246,.95)'; cx.lineWidth = th * 1.1;
    cx.beginPath(); cx.arc(0, 0, r + th * .25, a0 + .2, a1 - .2); cx.stroke();
    cx.strokeStyle = 'rgba(120,80,50,' + (.25 + .35 * v) + ')'; cx.lineWidth = th * .55;
    cx.beginPath(); cx.arc(0, 0, r - th * .15, a0 + .8, a1 - 1.2); cx.stroke();
    cx.strokeStyle = 'rgba(150,130,100,.5)'; cx.lineWidth = .35;
    for (k = 0; k < 9; k++) { var aa = a0 + .3 + k * (a1 - a0 - .6) / 8; cx.beginPath(); cx.moveTo(Math.cos(aa) * (r - th), Math.sin(aa) * (r - th)); cx.lineTo(Math.cos(aa) * (r + th), Math.sin(aa) * (r + th)); cx.stroke(); }
    cx.fillStyle = '#c8a878'; cx.beginPath(); cx.arc(Math.cos(a1) * r, Math.sin(a1) * r, th * .55, 0, 7); cx.fill();
}

// a pale pupa: an ant with its legs folded in, eyes darkening as it gets ready to hatch
function broodPupa(v, gd) {
    var body = gd ? '#f6dc8a' : '#f4ede0', edge = gd ? '#c9a040' : '#cfc4ae';
    function blob(x, y, a, b) { var g = cx.createRadialGradient(x - a * .3, y - b * .4, .2, x, y, Math.max(a, b) * 1.1); g.addColorStop(0, '#fffdf6'); g.addColorStop(.55, body); g.addColorStop(1, edge); cx.fillStyle = g; cx.beginPath(); cx.ellipse(x, y, a, b, 0, 0, 7); cx.fill(); }
    blob(0, 3.2, 2.5, 3.3);
    blob(0, -.9, 1.7, 1.9);
    blob(0, -3.9, 1.8, 1.6);
    cx.strokeStyle = edge; cx.lineWidth = .5;
    for (var k = 0; k < 3; k++) { cx.beginPath(); cx.moveTo(-2.3, 2 + k * 1.2); cx.lineTo(2.3, 2 + k * 1.2); cx.stroke(); }
    cx.strokeStyle = 'rgba(200,185,160,.9)'; cx.lineWidth = .45;
    [-1, 1].forEach(function (s2) { cx.beginPath(); cx.moveTo(s2 * .8, -.9); cx.quadraticCurveTo(s2 * 2.1, .3, s2 * 1.1, 2.6); cx.moveTo(s2 * .6, -3.4); cx.quadraticCurveTo(s2 * 1.8, -1.6, s2 * .7, .4); cx.stroke(); });
    var ea = .15 + .85 * v * v;
    cx.fillStyle = 'rgba(25,12,8,' + ea + ')';
    cx.beginPath(); cx.ellipse(-1, -4.3, .55, .65, 0, 0, 7); cx.ellipse(1, -4.3, .55, .65, 0, 0, 7); cx.fill();
}
