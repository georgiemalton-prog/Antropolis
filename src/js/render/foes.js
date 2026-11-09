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
        FOEST = { hf: f.hf || 0, atk: ak };
        drawFoe(fx0, fy0, a.ang + (f.kb || 0) * .03 * (f.o > 0 ? 1 : -1), sz, f.tp, now * .012 + f.o);
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
function drawFoe0(x, y, ang, sz, tp, ph) {
    cx.save();
    cx.translate(x, y);
    cx.rotate(ang);
    var j, n, L, w, o;
    cx.lineJoin = 'round';
    cx.fillStyle = 'rgba(0,0,0,.28)';
    cx.beginPath();
    cx.ellipse(0, sz * .35, sz * 1.8, sz * .8, 0, 0, 7);
    cx.fill();
    if (tp === 3) {
        cx.strokeStyle = '#3a3f48';
        cx.lineWidth = 1;
        cx.beginPath();
        for (j = 0; j < 7; j++) {
            var lx = sz * (1.1 - j * .42), lw = Math.sin(ph * 3 + j) * 1.6;
            cx.moveTo(lx, 0);
            cx.lineTo(lx + lw, sz * .95);
            cx.moveTo(lx, 0);
            cx.lineTo(lx - lw, -sz * .95);
        }
        cx.stroke();
        for (j = 0; j < 7; j++) {
            var bx = sz * (1.3 - j * .42), rr = sz * (.78 - Math.abs(j - 2.5) * .06);
            cx.fillStyle = j % 2 ? '#8a93a2' : '#79828f';
            cx.beginPath();
            cx.ellipse(bx, 0, sz * .55, rr, 0, 0, 7);
            cx.fill();
            cx.strokeStyle = 'rgba(20,24,32,.55)';
            cx.lineWidth = .7;
            cx.stroke();
            cx.fillStyle = 'rgba(255,255,255,.18)';
            cx.beginPath();
            cx.ellipse(bx + sz * .05, -rr * .35, sz * .3, rr * .25, 0, 0, 7);
            cx.fill();
        }
        cx.strokeStyle = '#2a2f38';
        cx.lineWidth = 1;
        cx.beginPath();
        cx.moveTo(sz * 1.7, -sz * .15);
        cx.lineTo(sz * 2.3, -sz * .5);
        cx.moveTo(sz * 1.7, sz * .15);
        cx.lineTo(sz * 2.3, sz * .5);
        cx.stroke();
        cx.fillStyle = '#111';
        cx.beginPath();
        cx.arc(sz * 1.65, -sz * .25, sz * .1, 0, 7);
        cx.arc(sz * 1.65, sz * .25, sz * .1, 0, 7);
        cx.fill();
        cx.restore();
        return;
    }
    if (tp === 2) {
        var wf = Math.sin(ph * 3) * .35;
        cx.fillStyle = 'rgba(235,245,255,.55)';
        cx.strokeStyle = 'rgba(120,140,170,.7)';
        cx.lineWidth = .5;
        [-1, 1].forEach(function (sd) { cx.save(); cx.rotate(sd * (.5 - wf)); cx.beginPath(); cx.ellipse(-sz * .2, sd * sz * .9, sz * 1.3, sz * .4, 0, 0, 7); cx.fill(); cx.stroke(); cx.beginPath(); cx.moveTo(-sz * 1.2, sd * sz * .9); cx.lineTo(sz * .8, sd * sz * .9); cx.stroke(); cx.restore(); });
        cx.strokeStyle = '#2a1a05';
        cx.lineWidth = 1;
        cx.beginPath();
        for (j = 0; j < 3; j++) {
            cx.moveTo(sz * (.2 - j * .4), 0);
            cx.lineTo(sz * (.1 - j * .4) + Math.sin(ph + j) * 2, sz * .9);
            cx.moveTo(sz * (.2 - j * .4), 0);
            cx.lineTo(sz * (.1 - j * .4) - Math.sin(ph + j) * 2, -sz * .9);
        }
        cx.stroke();
        cx.fillStyle = '#f0b820';
        cx.beginPath();
        cx.ellipse(-sz * .8, 0, sz * 1.1, sz * .62, 0, 0, 7);
        cx.fill();
        cx.strokeStyle = '#1a1205';
        cx.lineWidth = 2;
        cx.beginPath();
        for (j = 0; j < 3; j++) {
            cx.moveTo(-sz * (1.2 - j * .4), -sz * .55);
            cx.lineTo(-sz * (1.2 - j * .4), sz * .55);
        }
        cx.moveTo(-sz * 1.9, 0);
        cx.lineTo(-sz * 2.5, 0);
        cx.stroke();
        cx.fillStyle = 'rgba(255,255,255,.3)';
        cx.beginPath();
        cx.ellipse(-sz * .8, -sz * .3, sz * .6, sz * .14, 0, 0, 7);
        cx.fill();
        cx.fillStyle = '#2a1a05';
        cx.beginPath();
        cx.ellipse(sz * .1, 0, sz * .5, sz * .42, 0, 0, 7);
        cx.fill();
        cx.fillStyle = '#d9a014';
        cx.beginPath();
        cx.arc(sz * .8, 0, sz * .45, 0, 7);
        cx.fill();
        cx.fillStyle = '#1a0f05';
        cx.beginPath();
        cx.ellipse(sz * .9, -sz * .25, sz * .2, sz * .28, 0, 0, 7);
        cx.ellipse(sz * .9, sz * .25, sz * .2, sz * .28, 0, 0, 7);
        cx.fill();
        cx.fillStyle = '#fff';
        cx.fillRect(sz * .9, -sz * .32, 1, 1);
        cx.fillRect(sz * .9, sz * .2, 1, 1);
        cx.restore();
        return;
    }
    var sp = tp === 1;
    n = sp ? 4 : 3;
    L = sz * (sp ? 1.7 : 1.2) * (FOEST && FOEST.dead ? .55 : 1);
    cx.strokeStyle = '#0c0705';
    cx.lineWidth = sp ? 1.2 : 1.8;
    cx.beginPath();
    for (j = 0; j < n; j++) {
        o = (j - (n - 1) / 2) * sz * .55;
        w = Math.sin(ph + j * 1.7) * sz * .25;
        cx.moveTo(o, 0);
        cx.lineTo(o + w + sz * .3, L * .6);
        cx.lineTo(o + w + sz * .1, L);
        cx.moveTo(o, 0);
        cx.lineTo(o - w + sz * .3, -L * .6);
        cx.lineTo(o - w + sz * .1, -L);
    }
    cx.stroke();
    if (sp) {
        cx.fillStyle = '#3f2447';
        cx.beginPath();
        cx.ellipse(-sz * .8, 0, sz, sz * .8, 0, 0, 7);
        cx.fill();
        cx.fillStyle = '#d83a2e';
        cx.beginPath();
        cx.moveTo(-sz * 1.1, -sz * .35);
        cx.lineTo(-sz * .5, 0);
        cx.lineTo(-sz * 1.1, sz * .35);
        cx.moveTo(-sz * 1.4, -sz * .3);
        cx.lineTo(-sz * 1.9, 0);
        cx.lineTo(-sz * 1.4, sz * .3);
        cx.fill();
        cx.fillStyle = 'rgba(255,255,255,.12)';
        cx.beginPath();
        cx.ellipse(-sz * .9, -sz * .4, sz * .5, sz * .15, 0, 0, 7);
        cx.fill();
        cx.fillStyle = '#2f1a36';
        cx.beginPath();
        cx.arc(sz * .5, 0, sz * .52, 0, 7);
        cx.fill();
        cx.fillStyle = '#ff4a3a';
        for (j = 0; j < 4; j++) {
            cx.beginPath();
            cx.arc(sz * .85, (j - 1.5) * sz * .16, Math.max(.7, sz * .08), 0, 7);
            cx.fill();
        }
        var fo = FOEST ? FOEST.atk : 0;
        cx.strokeStyle = '#e8d9c0';
        cx.lineWidth = 1;
        cx.beginPath();
        cx.moveTo(sz * 1, -sz * .15);
        cx.lineTo(sz * (1.3 + fo * .2), -sz * (.25 + fo * .35));
        cx.moveTo(sz * 1, sz * .15);
        cx.lineTo(sz * (1.3 + fo * .2), sz * (.25 + fo * .35));
        cx.stroke();
    }
    else {
        cx.fillStyle = '#2c4670';
        cx.beginPath();
        cx.ellipse(-sz * .3, 0, sz * 1.3, sz * .95, 0, 0, 7);
        cx.fill();
        cx.fillStyle = 'rgba(160,200,255,.3)';
        cx.beginPath();
        cx.ellipse(-sz * .5, -sz * .4, sz * .8, sz * .22, -.1, 0, 7);
        cx.fill();
        cx.strokeStyle = '#6f8fc4';
        cx.lineWidth = 1;
        cx.beginPath();
        cx.moveTo(-sz * 1.5, 0);
        cx.lineTo(sz * .8, 0);
        for (j = 0; j < 3; j++) {
            cx.moveTo(-sz * (1.1 - j * .5), -sz * .8);
            cx.quadraticCurveTo(-sz * (1.3 - j * .5), 0, -sz * (1.1 - j * .5), sz * .8);
        }
        cx.stroke();
        cx.fillStyle = '#223654';
        cx.beginPath();
        cx.ellipse(sz * .95, 0, sz * .5, sz * .55, 0, 0, 7);
        cx.fill();
        cx.fillStyle = '#16223a';
        cx.beginPath();
        cx.ellipse(sz * 1.45, 0, sz * .45, sz * .42, 0, 0, 7);
        cx.fill();
        cx.fillStyle = '#fff';
        cx.beginPath();
        cx.arc(sz * 1.6, -sz * .28, Math.max(.8, sz * .1), 0, 7);
        cx.arc(sz * 1.6, sz * .28, Math.max(.8, sz * .1), 0, 7);
        cx.fill();
        cx.strokeStyle = '#0e1626';
        cx.lineWidth = 2.2;
        cx.beginPath();
        var ho = FOEST ? FOEST.atk * .45 : 0;
        cx.moveTo(sz * 1.8, -sz * .2);
        cx.quadraticCurveTo(sz * 2.6, -sz * (.7 + ho), sz * 2.5, -sz * (.1 + ho));
        cx.moveTo(sz * 1.8, sz * .2);
        cx.quadraticCurveTo(sz * 2.6, sz * (.7 + ho), sz * 2.5, sz * (.1 + ho));
        cx.stroke();
    }
    cx.restore();
}
