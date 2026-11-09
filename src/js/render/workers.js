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

function eggs(now) {
    cx.save();
    cx.translate(0, -cam);
    S.eggs.forEach(function (e, i) {
        var p = eggPos(i), s = popIn(Math.max(0, Math.min(1, (now - (e.b || 0)) / 450))), w = e.t < 5 ? Math.sin(now * .02 * (6 - e.t)) * .35 * (1 - e.t / 8) : 0, gd = e.c === 4, sh = gd ? '#ffd23f' : '#f4efe0';
        cx.save();
        cx.translate(p.x, p.y);
        cx.rotate(w);
        cx.scale(s * (gd ? 1.7 : 1.3), s * (gd ? 1.7 : 1.3));
        if (gd) {
            cx.save();
            cx.globalCompositeOperation = 'lighter';
            glow(0, 0, 9, '255,210,60', .5 + .3 * Math.sin(now * .006));
            cx.restore();
        }
        if (e.t < .8) {
            var o = (.8 - e.t) * 4;
            cx.fillStyle = sh;
            cx.beginPath();
            cx.ellipse(0, o, 2.8, 3.6, 0, 0, Math.PI);
            cx.fill();
            cx.beginPath();
            cx.ellipse(0, -o, 2.8, 3.6, 0, Math.PI, 2 * Math.PI);
            cx.fill();
            cx.fillStyle = 'rgba(255,255,200,.9)';
            cx.beginPath();
            cx.arc(0, 0, 2, 0, 7);
            cx.fill();
        }
        else {
            cx.fillStyle = sh;
            cx.beginPath();
            cx.ellipse(0, 0, 2.8, 3.6, 0, 0, 7);
            cx.fill();
            cx.fillStyle = 'rgba(255,255,255,.7)';
            cx.beginPath();
            cx.ellipse(-.9, -1.2, .8, 1.2, 0, 0, 7);
            cx.fill();
            if (e.t < 2.5) {
                cx.strokeStyle = '#7a5636';
                cx.lineWidth = .5;
                cx.beginPath();
                cx.moveTo(-2, -.5);
                cx.lineTo(-.8, .4);
                cx.lineTo(.4, -.6);
                cx.lineTo(1.6, .3);
                cx.stroke();
            }
        }
        cx.restore();
    });
    cx.restore();
}
