/* render/foes.js
   Drawing invaders (spiders, beetles, wasps, centipedes) and the effects layer on top.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

// invaders, dying invaders and effects go on top of the ants, so ants passing behind a big beetle are hidden by it
function drawFoesFx(now) {
    cx.save();
    cx.translate(0, -cam);
    foes.forEach(function (f) {
        var a = at(f.p), sz = foeSz(f), fl = f.tp === 2 ? Math.sin(now * .006 + f.o) * 1.5 : 0, lim = tunW() * .3;
        f.o = Math.max(-lim, Math.min(lim, f.o));
        // knocked back by hits, lunges forward when it bites
        var ak = f.atk > 0 ? Math.sin((1 - f.atk / .32) * Math.PI) : 0, push = ak * sz * .7 - (f.kb || 0), fx0 = a.x + a.nx * (f.o + fl) + Math.cos(a.ang) * push, fy0 = a.y + a.ny * (f.o + fl) + Math.sin(a.ang) * push;
        FOEST = { hf: f.hf || 0, atk: ak, egg: !!f.egg };
        drawFoe(fx0, fy0, a.ang + (f.dir < 0 ? Math.PI : 0) + (f.kb || 0) * .03 * (f.o > 0 ? 1 : -1), sz, f.tp, now * .012 + f.o);
        FOEST = null;
        var bw = f.boss ? 50 : 28, hx = a.x + a.nx * f.o - bw / 2, hy = a.y + a.ny * f.o - sz * 2.2, pr = Math.max(0, f.hp / f.max), pd = Math.max(pr, (f.hd == null ? f.hp : f.hd) / f.max);
        cx.fillStyle = 'rgba(0,0,0,.6)';
        rrect(hx - 1.2, hy - 1.2, bw + 2.4, 6.4, 3.2);
        cx.fill();
        cx.fillStyle = 'rgba(255,240,220,.85)';
        rrect(hx, hy, bw * pd, 4, 2);
        cx.fill();
        cx.fillStyle = f.boss ? '#c43fe0' : pr < .3 ? '#ff7a3a' : '#e0553f';
        rrect(hx, hy, bw * pr, 4, 2);
        cx.fill();
    });
    dyingF.forEach(function (d) {
        var a = at(Math.min(1, d.p)), t = d.t, fl = Math.min(1, t / .28);
        cx.save();
        cx.globalAlpha = t > .7 ? Math.max(0, 1 - (t - .7) / .4) : 1;
        cx.translate(a.x + a.nx * d.o, a.y + a.ny * d.o - Math.sin(fl * Math.PI) * d.sz * .8);
        cx.rotate(a.ang + fl * .5);
        cx.scale(1 - t * .12, Math.cos(fl * Math.PI));
        FOEST = { hf: Math.max(0, .35 - t) * 2, atk: 0, dead: 1 };
        drawFoe(0, 0, 0, d.sz, d.tp, t < .8 ? now * .05 * (1 - t) : 0);
        FOEST = null;
        cx.restore();
    });
    fx.forEach(function (p) {
        cx.globalAlpha = Math.max(0, Math.min(1, p.l * 2));
        if (p.t && p.t[0] === '@')
            glyph(p.t, p.x, p.y, p.f || 14);
        else if (p.t && p.pop) {
            // pops in big, settles, floats off
            if (p.l0 == null)
                p.l0 = p.l;
            var age = p.l0 - p.l, sc2 = age < .1 ? 1.5 - age * 5 : 1, fs = (p.f || 12) * sc2;
            cx.font = '800 ' + fs.toFixed(1) + 'px system-ui';
            cx.textAlign = 'center';
            cx.lineJoin = 'round';
            cx.lineWidth = Math.max(1.5, fs * .22);
            cx.strokeStyle = 'rgba(40,14,4,.85)';
            cx.strokeText(p.t, p.x, p.y);
            cx.fillStyle = p.c || '#fff';
            cx.fillText(p.t, p.x, p.y);
        }
        else if (p.t) {
            cx.font = (p.c ? '700 ' : '') + (p.f || 22) + 'px ' + (p.c ? 'system-ui' : 'serif');
            cx.textAlign = 'center';
            cx.fillStyle = p.c || '#fff';
            cx.fillText(p.t, p.x, p.y);
        }
        else if (p.shell) {
            p.rot += p.spin * .016;
            cx.save();
            cx.translate(p.x, p.y);
            cx.rotate(p.rot);
            cx.fillStyle = p.c;
            cx.beginPath();
            cx.ellipse(0, 0, 2.8, 3.6, 0, p.shell < 0 ? Math.PI : 0, p.shell < 0 ? 2 * Math.PI : Math.PI);
            cx.closePath();
            cx.fill();
            cx.restore();
        }
        else if (p.star) {
            var r1 = p.star * (.6 + p.l * 2), r2 = r1 * .28;
            cx.fillStyle = p.c;
            cx.beginPath();
            for (var si = 0; si < 8; si++) {
                var ra = si % 2 ? r2 : r1, an2 = si * Math.PI / 4 + .4;
                cx.lineTo(p.x + Math.cos(an2) * ra, p.y + Math.sin(an2) * ra);
            }
            cx.closePath();
            cx.fill();
        }
        else if (p.slash) {
            cx.strokeStyle = p.c;
            cx.lineWidth = 1.6 * p.l / .3 + .4;
            cx.lineCap = 'round';
            for (var sl = -1; sl <= 1; sl += 2) {
                cx.beginPath();
                cx.arc(p.x - Math.cos(p.ang) * p.slash * .5, p.y - Math.sin(p.ang) * p.slash * .5, p.slash * (.7 + (.3 - p.l) * 1.5), p.ang + sl * .2 - .55, p.ang + sl * .2 + .55);
                cx.stroke();
            }
        }
        else {
            cx.fillStyle = p.c;
            if (p.ring) {
                cx.strokeStyle = p.c;
                cx.lineWidth = 2 * p.l;
                cx.beginPath();
                cx.arc(p.x, p.y, p.ring + (1 - p.l) * 16, 0, 7);
                cx.stroke();
            }
            else {
                cx.fillStyle = p.c;
                cx.beginPath();
                cx.arc(p.x, p.y, (p.s || 3) * .5, 0, 7);
                cx.fill();
            }
        }
    });
    cx.globalAlpha = 1;
    cx.restore();
}

function drawFoe(x, y, ang, sz, tp, ph) {
    var st = FOEST;
    if (st && st.hf > 0) {
        drawFoe0(x, y, ang, sz, tp, ph);
        cx.save();
        cx.globalCompositeOperation = 'lighter';
        cx.translate(x, y);
        cx.rotate(ang);
        glow(-sz * .2, 0, sz * 2, '255,250,235', Math.min(.75, st.hf * 4.5));
        cx.restore();
        return;
    }
    drawFoe0(x, y, ang, sz, tp, ph);
}
// the four invaders (build 72 redesign: shaded armour, jointed legs, proper heads). Seen from above, head to +x.
// tp: 0 beetle, 1 spider, 2 wasp, 3 wood louse. FOEST carries the bite (atk) and dying (dead) state.
function drawFoe0(x, y, ang, sz, tp, ph) {
    cx.save();
    cx.translate(x, y);
    cx.rotate(ang);
    cx.lineJoin = 'round';
    cx.lineCap = 'round';
    cx.fillStyle = 'rgba(0,0,0,.3)';
    cx.beginPath();
    cx.ellipse(-sz * .1, sz * .4, sz * 1.9, sz * .85, 0, 0, 7);
    cx.fill();
    var atk = FOEST ? FOEST.atk || 0 : 0, dead = FOEST && FOEST.dead;
    if (tp === 4) foeRival(sz, ph, FOEST && FOEST.egg);
    else if (tp === 3) foeLouse(sz, ph);
    else if (tp === 2) foeWasp(sz, ph);
    else if (tp === 1) foeSpider(sz, ph, atk, dead);
    else foeBeetle(sz, ph, atk, dead);
    cx.restore();
}

function foeGrad(x0, y0, x1, y1, r1, stops) { var g = cx.createRadialGradient(x0, y0, 0, x1, y1, r1); stops.forEach(function (c, k) { g.addColorStop(k / (stops.length - 1), c); }); return g; }

// jointed legs: n pairs spread along the body, femur + tibia, a pale edge
function foeLegs(sz, ph, n, span, reach, col, w, dead) {
    var L = sz * reach * (dead ? .55 : 1), j;
    for (j = 0; j < n; j++) {
        var o = (j - (n - 1) / 2) * sz * span, sw = Math.sin(ph + j * 1.7) * sz * .25, fwd = (j - (n - 1) / 2) * .35;
        [1, -1].forEach(function (d) {
            var s2 = d * sw, kx = o + s2 + sz * (.25 + fwd), ky = d * L * .62, fx = o + s2 * 1.4 + sz * (.1 + fwd * 1.8), fy = d * L;
            cx.strokeStyle = col; cx.lineWidth = w;
            cx.beginPath(); cx.moveTo(o, d * sz * .2); cx.lineTo(kx, ky); cx.lineTo(fx, fy); cx.stroke();
            cx.strokeStyle = 'rgba(255,255,255,.16)'; cx.lineWidth = w * .4;
            cx.beginPath(); cx.moveTo(o, d * sz * .2); cx.lineTo(kx, ky - d * w * .3); cx.stroke();
        });
    }
}

function foeBeetle(sz, ph, atk, dead) {
    foeLegs(sz, ph, 3, .55, 1.25, '#0b1018', Math.max(1.2, sz * .2), dead);
    // wing cases: metallic blue-green with a split down the middle
    cx.fillStyle = foeGrad(-sz * .1, -sz * .5, -sz * .3, 0, sz * 1.5, ['#7fb8e8', '#2c5a9a', '#14284a', '#070d18']);
    cx.beginPath(); cx.ellipse(-sz * .35, 0, sz * 1.35, sz * .98, 0, 0, 7); cx.fill();
    cx.strokeStyle = 'rgba(0,0,0,.65)'; cx.lineWidth = Math.max(.8, sz * .08);
    cx.beginPath(); cx.moveTo(-sz * 1.6, 0); cx.lineTo(sz * .75, 0); cx.stroke();
    cx.strokeStyle = 'rgba(120,230,200,.35)'; cx.lineWidth = Math.max(.6, sz * .06);
    [-1, 1].forEach(function (d) { cx.beginPath(); cx.ellipse(-sz * .4, d * sz * .45, sz * 1.0, sz * .32, 0, d < 0 ? Math.PI : 0, d < 0 ? Math.PI * 2 : Math.PI); cx.stroke(); });
    cx.fillStyle = 'rgba(255,255,255,.35)'; cx.beginPath(); cx.ellipse(-sz * .5, -sz * .5, sz * .7, sz * .14, -.1, 0, 7); cx.fill();
    // pronotum and head
    cx.fillStyle = foeGrad(sz * .85, -sz * .25, sz * .95, 0, sz * .7, ['#3a5a8a', '#14243e', '#060a12']);
    cx.beginPath(); cx.ellipse(sz * .95, 0, sz * .55, sz * .62, 0, 0, 7); cx.fill();
    cx.fillStyle = foeGrad(sz * 1.4, -sz * .2, sz * 1.5, 0, sz * .5, ['#2a3a5a', '#0a1220']);
    cx.beginPath(); cx.ellipse(sz * 1.5, 0, sz * .42, sz * .4, 0, 0, 7); cx.fill();
    cx.fillStyle = '#e8f0ff';
    [-1, 1].forEach(function (d) { cx.beginPath(); cx.arc(sz * 1.62, d * sz * .27, Math.max(.7, sz * .08), 0, 7); cx.fill(); });
    // curved horned jaws that open to bite
    var ho = atk * .45;
    [-1, 1].forEach(function (d) {
        cx.fillStyle = foeGrad(sz * 2, d * -sz * .3, sz * 2.2, d * sz * .4, sz * .9, ['#4a5a7a', '#0c1424']);
        cx.beginPath(); cx.moveTo(sz * 1.75, d * sz * .12);
        cx.quadraticCurveTo(sz * 2.6, d * sz * (.75 + ho), sz * 2.6, d * sz * (.1 + ho));
        cx.quadraticCurveTo(sz * 2.35, d * sz * (.45 + ho), sz * 1.8, d * sz * .32);
        cx.closePath(); cx.fill();
    });
}

function foeSpider(sz, ph, atk, dead) {
    foeLegs(sz, ph * 1.2, 4, .42, 1.75, '#1a0f1c', Math.max(1, sz * .15), dead);
    // abdomen: dark and hairy with red chevrons and a pale rim light
    cx.fillStyle = foeGrad(-sz * .7, -sz * .4, -sz * .8, 0, sz * 1.1, ['#6a4a72', '#3a2244', '#160a1a']);
    cx.beginPath(); cx.ellipse(-sz * .85, 0, sz * 1.05, sz * .85, 0, 0, 7); cx.fill();
    cx.strokeStyle = 'rgba(200,170,210,.3)'; cx.lineWidth = .6;
    for (var k = 0; k < 22; k++) { var a = k / 22 * 6.283, rx = Math.cos(a) * sz * 1.02, ry = Math.sin(a) * sz * .82; cx.beginPath(); cx.moveTo(-sz * .85 + rx, ry); cx.lineTo(-sz * .85 + rx * 1.12, ry * 1.12); cx.stroke(); }
    cx.fillStyle = '#e0402e';
    [[-.45, .3], [-.95, .32], [-1.4, .25]].forEach(function (c) { cx.beginPath(); cx.moveTo(sz * (c[0] + .2), -sz * c[1]); cx.lineTo(sz * c[0], 0); cx.lineTo(sz * (c[0] + .2), sz * c[1]); cx.lineTo(sz * (c[0] + .05), 0); cx.closePath(); cx.fill(); });
    cx.fillStyle = 'rgba(255,255,255,.18)'; cx.beginPath(); cx.ellipse(-sz * .9, -sz * .45, sz * .55, sz * .14, 0, 0, 7); cx.fill();
    // head and body in one, a cluster of red eyes, fangs that strike
    cx.fillStyle = foeGrad(sz * .4, -sz * .25, sz * .5, 0, sz * .65, ['#5a3a62', '#2a1630', '#100612']);
    cx.beginPath(); cx.ellipse(sz * .5, 0, sz * .62, sz * .55, 0, 0, 7); cx.fill();
    cx.fillStyle = '#ff4a3a';
    [[.88, -.18, .1], [.88, .18, .1], [.98, -.07, .07], [.98, .07, .07], [.76, -.3, .06], [.76, .3, .06]].forEach(function (e) { cx.beginPath(); cx.arc(sz * e[0], sz * e[1], Math.max(.6, sz * e[2]), 0, 7); cx.fill(); });
    cx.fillStyle = 'rgba(255,220,200,.8)'; cx.beginPath(); cx.arc(sz * .9, -sz * .2, Math.max(.3, sz * .03), 0, 7); cx.fill();
    [-1, 1].forEach(function (d) {
        cx.fillStyle = '#2a1630'; cx.beginPath(); cx.ellipse(sz * 1.05, d * sz * .15, sz * .18, sz * .12, 0, 0, 7); cx.fill();
        cx.strokeStyle = '#efe4d0'; cx.lineWidth = Math.max(.7, sz * .07);
        cx.beginPath(); cx.moveTo(sz * 1.15, d * sz * .15); cx.quadraticCurveTo(sz * (1.35 + atk * .2), d * sz * (.2 + atk * .3), sz * (1.3 + atk * .15), d * sz * (.02 + atk * .25)); cx.stroke();
    });
}

function foeWasp(sz, ph) {
    var wf = Math.sin(ph * 3) * .35;
    foeLegs(sz, ph, 3, .4, 1.0, '#2a1a05', Math.max(.8, sz * .1), false);
    // banded abdomen with a sting
    cx.fillStyle = foeGrad(-sz * .7, -sz * .35, -sz * .8, 0, sz * 1.1, ['#ffe27a', '#f0b820', '#a87006']);
    cx.beginPath(); cx.ellipse(-sz * .85, 0, sz * 1.1, sz * .6, 0, 0, 7); cx.fill();
    cx.save(); cx.beginPath(); cx.ellipse(-sz * .85, 0, sz * 1.1, sz * .6, 0, 0, 7); cx.clip();
    cx.fillStyle = '#1a1205';
    for (var j = 0; j < 3; j++) { cx.beginPath(); cx.ellipse(-sz * (1.25 - j * .42), 0, sz * .12, sz * .7, 0, 0, 7); cx.fill(); }
    cx.restore();
    cx.fillStyle = 'rgba(255,255,255,.35)'; cx.beginPath(); cx.ellipse(-sz * .8, -sz * .32, sz * .6, sz * .11, 0, 0, 7); cx.fill();
    cx.fillStyle = '#1a1205'; cx.beginPath(); cx.moveTo(-sz * 1.9, -sz * .1); cx.lineTo(-sz * 2.5, 0); cx.lineTo(-sz * 1.9, sz * .1); cx.closePath(); cx.fill();
    // fuzzy thorax
    cx.fillStyle = foeGrad(sz * .1, -sz * .2, sz * .15, 0, sz * .55, ['#6a4a1a', '#2a1a05']);
    cx.beginPath(); cx.ellipse(sz * .15, 0, sz * .5, sz * .44, 0, 0, 7); cx.fill();
    cx.strokeStyle = 'rgba(240,200,120,.35)'; cx.lineWidth = .5;
    for (j = 0; j < 14; j++) { var a = j / 14 * 6.283; cx.beginPath(); cx.moveTo(sz * .15 + Math.cos(a) * sz * .45, Math.sin(a) * sz * .4); cx.lineTo(sz * .15 + Math.cos(a) * sz * .56, Math.sin(a) * sz * .5); cx.stroke(); }
    // veined see-through wings, beating
    [-1, 1].forEach(function (d) {
        cx.save(); cx.translate(sz * .1, d * sz * .2); cx.rotate(d * (.55 - wf));
        cx.fillStyle = 'rgba(225,240,255,.42)'; cx.strokeStyle = 'rgba(120,140,170,.75)'; cx.lineWidth = .6;
        cx.beginPath(); cx.ellipse(-sz * .55, d * sz * .55, sz * 1.25, sz * .38, 0, 0, 7); cx.fill(); cx.stroke();
        cx.beginPath(); cx.moveTo(0, 0); cx.lineTo(-sz * 1.6, d * sz * .55); cx.moveTo(-sz * .5, d * sz * .25); cx.lineTo(-sz * 1.2, d * sz * .85); cx.stroke();
        cx.restore();
    });
    // head with big compound eyes
    cx.fillStyle = foeGrad(sz * .78, -sz * .2, sz * .8, 0, sz * .48, ['#f6cc40', '#c08a0e']);
    cx.beginPath(); cx.arc(sz * .8, 0, sz * .44, 0, 7); cx.fill();
    [-1, 1].forEach(function (d) {
        cx.fillStyle = foeGrad(sz * .86, d * sz * .24, sz * .9, d * sz * .26, sz * .3, ['#5a4020', '#1a0f05']);
        cx.beginPath(); cx.ellipse(sz * .9, d * sz * .26, sz * .2, sz * .28, d * .3, 0, 7); cx.fill();
        cx.fillStyle = 'rgba(255,255,255,.7)'; cx.beginPath(); cx.arc(sz * .86, d * sz * .3, Math.max(.4, sz * .05), 0, 7); cx.fill();
        cx.strokeStyle = '#1a1205'; cx.lineWidth = Math.max(.6, sz * .06); cx.beginPath(); cx.moveTo(sz * 1.1, d * sz * .1); cx.lineTo(sz * 1.6, d * sz * .45); cx.stroke();
    });
}

function foeLouse(sz, ph) {
    var j;
    cx.strokeStyle = '#2a2f38'; cx.lineWidth = Math.max(.8, sz * .09);
    for (j = 0; j < 7; j++) {
        var lx = sz * (1.1 - j * .42), lw = Math.sin(ph * 3 + j) * sz * .18;
        cx.beginPath(); cx.moveTo(lx, 0); cx.lineTo(lx + lw, sz * .98); cx.moveTo(lx, 0); cx.lineTo(lx - lw, -sz * .98); cx.stroke();
    }
    for (j = 6; j >= 0; j--) {
        var bx = sz * (1.3 - j * .42), rr = sz * (.8 - Math.abs(j - 2.5) * .06);
        cx.fillStyle = foeGrad(bx + sz * .05, -rr * .5, bx, 0, rr * 1.2, ['#c4ccd8', '#7c8594', '#454c58']);
        cx.beginPath(); cx.ellipse(bx, 0, sz * .56, rr, 0, 0, 7); cx.fill();
        cx.strokeStyle = 'rgba(20,24,32,.6)'; cx.lineWidth = Math.max(.5, sz * .05); cx.stroke();
        cx.fillStyle = 'rgba(255,255,255,.28)'; cx.beginPath(); cx.ellipse(bx + sz * .05, -rr * .4, sz * .28, rr * .2, 0, 0, 7); cx.fill();
        cx.fillStyle = 'rgba(40,46,56,.5)'; for (var k = -2; k <= 2; k++) { cx.beginPath(); cx.arc(bx, k * rr * .3, Math.max(.3, sz * .03), 0, 7); cx.fill(); }
    }
    cx.strokeStyle = '#2a2f38'; cx.lineWidth = Math.max(.8, sz * .08);
    cx.beginPath(); cx.moveTo(sz * 1.7, -sz * .15); cx.quadraticCurveTo(sz * 2.2, -sz * .3, sz * 2.4, -sz * .6); cx.moveTo(sz * 1.7, sz * .15); cx.quadraticCurveTo(sz * 2.2, sz * .3, sz * 2.4, sz * .6); cx.stroke();
    cx.fillStyle = '#111';
    [-1, 1].forEach(function (d) { cx.beginPath(); cx.arc(sz * 1.62, d * sz * .25, Math.max(.6, sz * .1), 0, 7); cx.fill(); });
}
