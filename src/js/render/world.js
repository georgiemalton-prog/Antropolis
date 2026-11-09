/* render/world.js
   Drawing the world each frame: background, tunnels, trails, lighting and decorations.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

function strokeTun(tw) {
    cx.lineCap = 'round';
    cx.lineJoin = 'round';
    cx.strokeStyle = 'rgba(15,7,3,.28)';
    cx.lineWidth = tw + 9;
    cx.stroke();
    cx.strokeStyle = 'rgba(15,7,3,.3)';
    cx.lineWidth = tw + 6;
    cx.stroke();
    cx.strokeStyle = '#120a05';
    cx.lineWidth = tw + 4;
    cx.stroke();
    cx.strokeStyle = '#6b4a2f';
    cx.lineWidth = tw + 2;
    cx.stroke();
    cx.strokeStyle = '#3a2414';
    cx.lineWidth = tw;
    cx.stroke();
    cx.strokeStyle = '#6e4d2f';
    cx.lineWidth = tw * .82;
    cx.stroke();
    cx.strokeStyle = '#a67c50';
    cx.lineWidth = tw * .56;
    cx.stroke();
    cx.strokeStyle = '#c29a68';
    cx.lineWidth = tw * .24;
    cx.stroke();
    cx.strokeStyle = 'rgba(255,235,200,.18)';
    cx.lineWidth = Math.max(1, tw * .1);
    cx.stroke();
    cx.lineCap = 'butt';
    cx.setLineDash([.9, 11]);
    cx.strokeStyle = 'rgba(205,165,115,.4)';
    cx.lineWidth = tw + 3;
    cx.stroke();
    cx.setLineDash([]);
    cx.lineCap = 'round';
}
function drawFarmAnts(now, x0, x1, y0, y1) {
    if (FAOv !== layoutV) {
        FAO = {};
        FAOv = layoutV;
    }
    var dt0 = S.deep ? deepTop() : 1e9;
    farmAnts(now, function (a, fwd, k, n, c) {
        var key = n + '|' + c, o = FAO[key] || (FAO[key] = { fa: 1, key: key, k: k, u: ((n * 7919 + c * 104729) % 1000) / 1000 });
        o.wx = a.x;
        o.wy = a.y;
        o.wa = fwd ? a.ang : a.ang + Math.PI;
        o.deep = a.y >= dt0;
        o.seen = now;
        if (a.x < x0 || a.x > x1 || a.y < y0 || a.y > y1)
            return;
        drawAnt(a.x, a.y, fwd ? a.ang : a.ang + Math.PI, SZ[k] * .9, !fwd && c % 2 === 0, now * .012 + n + c, KD[k]);
    });
}

function drawWorld(now) {
    var zs = dpr * K * uz;
    cx.setTransform(zs, 0, 0, zs, -camX * zs, 0);
    setVR();
    cx.save();
    cx.translate(0, -cam);
    var g = cx.createLinearGradient(0, 0, 0, WH);
    var bp = bio(), th = THM[P.theme];
    if (th)
        bp = { top: th.top, bot: th.bot, tint: th.tint, sky: bp.sky };
    g.addColorStop(0, bp.top || '#4a3322');
    g.addColorStop(1, bp.bot || '#241710');
    cx.fillStyle = g;
    cx.fillRect(wideL() - 20, 0, wideR() - wideL() + 40, WH);
    if (S.deep)
        drawDeepBg(now);
    soilTex();
    pebs.forEach(function (p) { cx.fillStyle = p[3] > .5 ? '#6a4c36' : '#1e130c'; cx.globalAlpha = .6; cx.beginPath(); cx.arc(p[0], p[1], p[2], 0, 7); cx.fill(); });
    cx.globalAlpha = 1;
    drawSoil(now);
    if (bp.tint) {
        cx.fillStyle = bp.tint;
        cx.fillRect(wideL() - 20, 20, wideR() - wideL() + 40, WH - 20);
    }
    var sg = cx.createLinearGradient(0, -SK, 0, 24);
    sg.addColorStop(0, bp.sky ? bp.sky[0] : '#5fa6d0');
    sg.addColorStop(.7, bp.sky ? bp.sky[1] : '#a9d3df');
    sg.addColorStop(1, bp.sky ? bp.sky[2] : '#d3e8da');
    cx.fillStyle = sg;
    cx.fillRect(wideL() - 20, -SK - 4, wideR() - wideL() + 40, 24 + SK + 4);
    var dn = dayState();
    if (dn.night > .01) {
        cx.fillStyle = 'rgba(8,12,46,' + dn.night * .78 + ')';
        cx.fillRect(wideL() - 20, -SK - 4, wideR() - wideL() + 40, 24 + SK + 4);
        var sr = rng(S.seed + 55), sxn = Math.round((wideR() - wideL()) / 9);
        for (var si = 0; si < sxn; si++) {
            var stx = wideL() + sr() * (wideR() - wideL()), sty = -SK + sr() * (SK - 14), sta = (.4 + .6 * Math.abs(Math.sin(now * .002 * (.5 + sr()) + si))) * dn.night;
            cx.fillStyle = 'rgba(255,255,235,' + sta + ')';
            cx.fillRect(stx, sty, 1.3, 1.3);
        }
    }
    for (var ck = 0; ck < 5; ck++) {
        var cxx = wideL() + (now * .003 * (1 + ck * .4) + ck * 97) % (wideR() - wideL() + 140) - 70, cyy = -SK + 14 + ck * (SK - 30) / 5;
        cx.fillStyle = 'rgba(255,255,255,.78)';
        cx.beginPath();
        cx.ellipse(cxx, cyy, 16, 5, 0, 0, 7);
        cx.ellipse(cxx + 9, cyy - 3, 10, 5, 0, 0, 7);
        cx.ellipse(cxx - 9, cyy - 2, 9, 4, 0, 0, 7);
        cx.fill();
    }
    cx.fillStyle = bp.grass || '#5b8f3a';
    cx.fillRect(wideL() - 20, 20, wideR() - wideL() + 40, 6);
    var e = PT[0], mr = 28 + S.tier * 8;
    cx.fillStyle = bp.hill || '#7a5636';
    cx.beginPath();
    cx.ellipse(e[0], 24, mr, mr * .5 + S.tier * 2 + (S.hillGrowth || 0), 0, Math.PI, 0);
    cx.fill();
    var tw = tunW(), rooms = [], i;
    for (i = 0; i < S.tier && i < 4; i++) {
        var q = PT[CI[i]], ec = exc && exc.i === i ? Math.min(1, exc.t / exc.dur) : 1;
        if (ec < .1)
            continue;
        var cxn = q[0] + (i % 2 ? -34 : 34), es = Math.max(.45, ec);
        rooms.push({ x: cxn, y: q[1], rx: 26 * es * feat().sx[i] * (1 + .07 * rl(i)), ry: 16 * es * feat().sy[i] * (1 + .07 * rl(i)), ic: IC[i], s: [q[0], q[1], q[0] + (cxn - q[0]) * Math.min(1, ec * 1.4), q[1]] });
    }
    for (i = 0; i < S.sideTunnels && i < BP.length; i++)
        if (S.sideDug[i] >= 1) {
            var en = BP[i].PT[BP[i].PT.length - 1];
            rooms.push({ x: en[0], y: en[1], rx: 12 * feat().sx[4 + i % 4], ry: 8 * feat().sy[4 + i % 4], ic: DI[dType(i)] });
        }
    deepList().forEach(function (o) {
        if (o.pr >= 1 && o.f.ch) {
            var de = o.f.q.PT[o.f.q.PT.length - 1];
            rooms.push({ x: de[0], y: de[1], rx: o.f.ch === 2 ? 17 : 7 + (de[0] * 7 % 4), ry: o.f.ch === 2 ? 10 : 5 + (de[1] * 3 % 3), ic: o.f.ch === 2 && o.f.L === 0 ? '@seed' : null });
        }
    });
    farmList().forEach(function (o) {
        if (o.pr >= 1 && o.f.ch) {
            var fe = o.f.q.PT[o.f.q.PT.length - 1];
            rooms.push({ x: fe[0], y: fe[1], rx: 7 + (fe[0] * 7 % 4), ry: 5 + (fe[1] * 3 % 3), ic: null });
        }
    });
    var rx = 62 + S.tier * 5;
    cavernRim();
    rooms = rooms.filter(function (r) { return r.x + r.rx + 12 > VR.x0 && r.x - r.rx - 12 < VR.x1 && r.y + r.ry + 12 > VR.y0 && r.y - r.ry - 12 < VR.y1; });
    rooms.forEach(function (r) { chamberRim(r.x, r.y, r.rx, r.ry); });
    var farmL = farmList();
    if (farmL.length) {
        cx.beginPath();
        farmL.forEach(function (o) {
            var q = o.f.q, d = o.pr * q.LEN, e2, u, lx2 = q.PT[0][0], ly2 = q.PT[0][1];
            cx.moveTo(lx2, ly2);
            for (u = 1; u < q.PT.length; u++)
                if (q.CUM[u] < d) {
                    vto(lx2, ly2, q.PT[u][0], q.PT[u][1]);
                    lx2 = q.PT[u][0];
                    ly2 = q.PT[u][1];
                }
            e2 = at(o.pr, q);
            vto(lx2, ly2, e2.x, e2.y);
        });
        strokeTun(tw * .42);
    }
    var deepL = deepList();
    if (deepL.length) {
        [0, 1].forEach(function (trk) {
            var any = false;
            cx.beginPath();
            deepL.forEach(function (o) {
                if (!!o.f.t !== !!trk)
                    return;
                any = true;
                var q = o.f.q, d = o.pr * q.LEN, e2, u, lx3 = q.PT[0][0], ly3 = q.PT[0][1];
                cx.moveTo(lx3, ly3);
                for (u = 1; u < q.PT.length; u++)
                    if (q.CUM[u] < d) {
                        vto(lx3, ly3, q.PT[u][0], q.PT[u][1]);
                        lx3 = q.PT[u][0];
                        ly3 = q.PT[u][1];
                    }
                e2 = at(o.pr, q);
                vto(lx3, ly3, e2.x, e2.y);
            });
            if (any)
                strokeTun(tw * (trk ? .8 : .42));
        });
    }
    if (S.dug > .003) {
        tpath();
        rooms.forEach(function (r) { if (r.s) {
            cx.moveTo(r.s[0], r.s[1]);
            cx.lineTo(r.s[2], r.s[3]);
        } });
        strokeTun(tw);
    }
    cavernIn();
    rooms.forEach(function (r) { chamberIn(r.x, r.y, r.rx, r.ry, r.ic); });
    if (S.dug >= 1) {
        cx.fillStyle = '#150c07';
        cx.beginPath();
        cx.ellipse(e[0], 24, tw * .6, 5, 0, 0, 7);
        cx.fill();
    }
    var nl = Math.min(28, Math.floor(S.food));
    for (i = 0; i < nl; i++) {
        cx.fillStyle = i % 2 ? '#6fbf4a' : '#4f9a35';
        cx.beginPath();
        cx.ellipse(QX - rx * .72 + ((i * 17) % 9) * 4, QY + 2 + (i % 5) * 5, 4, 2.4, i, 0, 7);
        cx.fill();
    }
    drawCushion(now);
    var qp = qPos(); drawAnt(qp.x, qp.y, Q.tilt, 17 + pulse * 3, false, Q.ph, 3);
    cx.globalAlpha = 1;
    cx.restore();
}

function drawTrails(now) {
    if (S.dug < .99)
        return;
    var dt = Math.min(.1, Math.max(0, (now - lastTr) / 1000));
    lastTr = now;
    ph1 = Math.max(0, ph1 - dt * .03);
    cx.save();
    cx.translate(0, -cam);
    var n = Math.max(8, Math.floor(LEN / 7)), off = (now * .0004) % 1, i, a, k;
    for (i = 0; i < n; i++) {
        a = at((i + off) / n);
        cx.fillStyle = 'rgba(190,255,140,' + (.07 + .3 * ph1) + ')';
        cx.beginPath();
        cx.arc(a.x, a.y, 1 + ph1 * .6, 0, 7);
        cx.fill();
    }
    for (k = 0; k < S.sideTunnels && k < BP.length; k++) {
        var q = BP[k], pr = S.sideDug[k] == null ? 1 : S.sideDug[k], b = bph[k] || 0;
        bph[k] = Math.max(0, b - dt * .015);
        if (pr < .2)
            continue;
        var m2 = Math.max(4, Math.floor(q.LEN * pr / 7));
        for (i = 0; i < m2; i++) {
            a = at(((i + off) / m2) * pr, q);
            cx.fillStyle = 'rgba(120,220,255,' + (.06 + .3 * b) + ')';
            cx.beginPath();
            cx.arc(a.x, a.y, 1 + b * .5, 0, 7);
            cx.fill();
        }
    }
    cx.restore();
}

function lighting(now) {
    var i, t = now * .001;
    cx.save();
    cx.translate(0, -cam);
    for (i = 0; i < 3; i++) {
        var cxp = (t * 4 + i * 130) % (W + 80) - 40;
        cx.fillStyle = 'rgba(255,255,255,.5)';
        cx.beginPath();
        cx.ellipse(cxp, 8 + i % 2 * 4, 16, 4, 0, 0, 7);
        cx.fill();
    }
    cx.strokeStyle = '#4f8a35';
    cx.lineWidth = 1;
    cx.beginPath();
    for (var x = Math.floor(wideL() / 4) * 4; x < wideR(); x += 4) {
        var sw = Math.sin(t * 1.5 + x * .3) * 1.6;
        cx.moveTo(x, 24);
        cx.lineTo(x + sw, 17 - (Math.abs(x * 7) % 5));
    }
    cx.stroke();
    if (S.tier >= 2) {
        for (x = Math.floor(wideL() / 23) * 23 + 6; x < wideR(); x += 23) {
            cx.fillStyle = x % 2 ? '#f2c94c' : '#ff8fb1';
            cx.beginPath();
            cx.arc(x + Math.sin(t + x) * 1.2, 15, 1.4, 0, 7);
            cx.fill();
        }
    }
    cx.globalCompositeOperation = 'lighter';
    var fed = 1, rx = 62 + S.tier * 5;
    glow(QX, QY, rx * (1.3 + .05 * Math.sin(t * 2)) + S.tier * 8, '255,170,70', .16 * fed);
    var cl = ['90,220,255', '255,240,200', '255,200,60', '190,110,255'];
    for (i = 0; i < S.tier && i < 4; i++) {
        var p = PT[CI[i]];
        glow(p[0] + (i % 2 ? -34 : 34), p[1], 34 + 4 * Math.sin(t * 1.7 + i), cl[i], .22);
    }
    if (S.tier >= 1 && S.dug >= 1)
        for (i = 1; i < PT.length - 1; i += 2)
            glow(PT[i][0], PT[i][1], 16 + 2 * Math.sin(t * 9 + i * 3), '255,160,60', .09 + .03 * Math.sin(t * 13 + i));
    if (S.dug >= 1) {
        var e = PT[0], gr = cx.createLinearGradient(0, 26, 0, 26 + H * .45);
        gr.addColorStop(0, 'rgba(255,240,180,.30)');
        gr.addColorStop(1, 'rgba(255,240,180,0)');
        cx.fillStyle = gr;
        cx.beginPath();
        cx.moveTo(e[0] - 6, 26);
        cx.lineTo(e[0] + 6, 26);
        cx.lineTo(e[0] + 26, 26 + H * .45);
        cx.lineTo(e[0] - 26, 26 + H * .45);
        cx.fill();
    }
    var n = Math.min(26, 8 + S.tier * 4);
    for (i = 0; i < n; i++) {
        var m = motes[i], fy = (m.y + t * (.006 + m.s * .01)) % 1, mx = ((m.x + Math.sin(t * m.s + m.a) * .01 + 1) % 1) * W, my = 24 + fy * WH;
        cx.fillStyle = 'rgba(70,48,30,' + (.35 + .25 * Math.sin(m.a * 3)) + ')';
        cx.fillRect(mx, my, 1.6 + m.s * 1.6, 1.4 + m.s * 1.2);
    }
    if (rainT > 0 && cam < 60) {
        cx.strokeStyle = 'rgba(190,220,255,.55)';
        cx.lineWidth = 1;
        cx.beginPath();
        for (var rd = 0; rd < 70; rd++) {
            var rx0 = camX + ((rd * 97.3 + t * 140) % (W / uz + 20)), ry0 = -SK + ((rd * 53.1 + t * 520) % (SK + 30));
            cx.moveTo(rx0, ry0);
            cx.lineTo(rx0 - 2, ry0 + 8);
        }
        cx.stroke();
    }
    var dnn = dayState().night;
    if (dnn > .02) {
        cx.fillStyle = 'rgba(6,10,44,' + dnn * .2 + ')';
        cx.fillRect(wideL() - 20, 24, wideR() - wideL() + 40, WHX() - WH + WH + 40);
    }
    rings = rings.filter(function (r) { r.l -= .016; r.r += 3.2; return r.l > 0; });
    rings.forEach(function (r) { cx.strokeStyle = 'rgba(' + r.c + ',' + r.l * .8 + ')'; cx.lineWidth = 3 * r.l + 1; cx.beginPath(); cx.arc(r.x, r.y, r.r, 0, 7); cx.stroke(); });
    cx.restore();
    cx.save();
    cx.setTransform(dpr * K, 0, 0, dpr * K, 0, 0);
    if (S.reach && tab === 'tun') {
        var bx0 = W * .3, bw = W * .4, tot = wideR() - wideL(), by0 = H - 7;
        cx.fillStyle = 'rgba(0,0,0,.45)';
        cx.fillRect(bx0 - 2, by0 - 3, bw + 4, 8);
        cx.fillStyle = 'rgba(255,255,255,.25)';
        cx.fillRect(bx0 + (0 - wideL()) / tot * bw, by0 - 1, W / tot * bw, 4);
        cx.fillStyle = '#ffd23f';
        cx.fillRect(bx0 + (camX - wideL()) / tot * bw, by0 - 2, Math.max(3, W / uz / tot * bw), 6);
    }
    if (foes.length) {
        var vg = cx.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * .8);
        vg.addColorStop(0, 'rgba(200,30,20,0)');
        vg.addColorStop(1, 'rgba(200,30,20,' + (.22 + .08 * Math.sin(t * 6)) + ')');
        cx.fillStyle = vg;
        cx.fillRect(0, 0, W, H);
    }
    if (flash > 0) {
        cx.fillStyle = 'rgba(255,245,210,' + flash * .5 + ')';
        cx.fillRect(0, 0, W, H);
        flash = Math.max(0, flash - .035);
    }
    cx.restore();
}

function deco(now) {
    cx.save();
    cx.translate(0, -cam);
    if (cam < 40) {
        cx.save();
        cx.globalCompositeOperation = 'lighter';
        var dn2 = dayState(), up = dn2.s >= 0, fr = up ? dn2.d * 2 : (dn2.d - .5) * 2, hx = W * (.1 + .8 * fr), hy = 10 - Math.abs(dn2.s) * (SK - 28);
        if (up) {
            glow(hx, hy, 34, '255,238,160', .5 * (1 - dn2.night));
            cx.restore();
            cx.fillStyle = 'rgba(255,246,196,' + (1 - dn2.night * .8) + ')';
            cx.beginPath();
            cx.arc(hx, hy, 5, 0, 7);
            cx.fill();
        }
        else {
            glow(hx, hy, 26, '190,210,255', .35);
            cx.restore();
            cx.fillStyle = '#e6edfb';
            cx.beginPath();
            cx.arc(hx, hy, 4.5, 0, 7);
            cx.fill();
            cx.fillStyle = 'rgba(20,28,70,.55)';
            cx.beginPath();
            cx.arc(hx + 2, hy - 1, 3.8, 0, 7);
            cx.fill();
        }
        cx.strokeStyle = '#26221c';
        cx.lineWidth = .8;
        for (var i = 0; i < 2; i++) {
            var bx = (now * .018 * (i + 1) + i * 150) % (W + 80) - 40, by = -SK * .3 - i * 14 + Math.sin(now * .003 + i * 2) * 3, fl = Math.sin(now * .02 + i) * 2;
            cx.beginPath();
            cx.moveTo(bx - 3, by - fl);
            cx.lineTo(bx, by);
            cx.lineTo(bx + 3, by - fl);
            cx.stroke();
        }
    }
    S.eggs.forEach(function (e, i) { if (e.c !== 4)
        return; var p = eggPos(i); for (var k = 0; k < 4; k++) {
        var a = now * .003 + k * 1.57, r = 5 + Math.sin(now * .01 + k) * 1.5, sx = p.x + Math.cos(a) * r, sy = p.y + Math.sin(a) * r, tw2 = .5 + .5 * Math.sin(now * .012 + k * 2);
        cx.fillStyle = 'rgba(255,240,170,' + tw2 + ')';
        cx.fillRect(sx - .5, sy - 1.5, 1, 3);
        cx.fillRect(sx - 1.5, sy - .5, 3, 1);
    } });
    cx.restore();
}

// ---- drawing ants and invaders ----

function drawBits(u, n) { var BITPOS = [[.2, 0], [-.9, -.55], [-.9, .55]]; for (var j = 0; j < n && j < 3; j++) {
    var x = BITPOS[j][0] * u, y = BITPOS[j][1] * u;
    cx.fillStyle = '#b88a5a';
    cx.strokeStyle = '#4a2c16';
    cx.lineWidth = u * .14;
    cx.beginPath();
    cx.ellipse(x, y, u * .9, u * .72, j, 0, 7);
    cx.fill();
    cx.stroke();
    cx.fillStyle = 'rgba(255,220,170,.3)';
    cx.beginPath();
    cx.ellipse(x - u * .2, y - u * .2, u * .28, u * .2, j, 0, 7);
    cx.fill();
} }

function featTick(dt) {
    if (S.dug < .02 || !WH)
        return;
    var fy = frontY(), f = feat(), cap = foodCap(), sd = soilAt(fy), quiet = !featInit;
    featInit = true;
    if (lastSoil >= 0 && sd !== lastSoil && S.dug < 1 && S.tier >= 2)
        toast('Your workers reached ' + SOILN[sd].toLowerCase() + (sd === 1 ? '. Digging slows down.' : sd === 3 ? '. This will be slow going.' : sd === 2 ? '. Digging speeds up.' : '.'));
    lastSoil = sd;
    f.finds.forEach(function (fd) {
        if (S.rare[fd.id] || fy > wy(fd.fy))
            return;
        S.rare[fd.id] = 1;
        if (quiet) {
            if (fd.id === 'spores')
                S.spores = 1;
            return;
        }
        var m = 'Workers unearthed ' + FINDN[fd.id] + '! ';
        if (fd.id === 'fossil') {
            gainJelly(3);
            m += '+3 jelly.';
        }
        else if (fd.id === 'amber') {
            S.food = Math.min(cap, S.food + cap * .1);
            m += 'Traded for food.';
        }
        else if (fd.id === 'seeds') {
            S.food = Math.min(cap, S.food + cap * .15);
            m += 'A feast of seeds.';
        }
        else if (fd.id === 'spores') {
            S.spores = 1;
            m += 'Fungus farms cost 25% less and grow 25% faster.';
        }
        else {
            S.food = Math.min(cap, S.food + cap * .05);
            m += 'It holds some old supplies.';
        }
        toast(m);
        SFX.win();
        burst(fd.fx * W, wy(fd.fy), 18, ['#ffd23f', '#fff', '#9bffc8'], 70);
    });
    if (S.reach)
        f.far.forEach(function (ff) {
            var k = 12 + ff.w, id = 'far' + ff.w;
            if (S.rare[id] || !BP[k] || k >= S.sideTunnels || !(S.sideDug[k] >= ff.pf))
                return;
            S.rare[id] = 1;
            if (quiet)
                return;
            var m = 'Workers found ' + FARN[ff.t] + '! ';
            if (ff.t === 'geode') {
                gainJelly(4);
                m += '+4 jelly.';
            }
            else if (ff.t === 'bones') {
                gainJelly(2);
                S.food = Math.min(cap, S.food + cap * .05);
                m += '+2 jelly and some food.';
            }
            else if (ff.t === 'spring') {
                m += 'Fungus farms grow faster.';
            }
            else {
                S.food = Math.min(cap, S.food + cap * (ff.t === 'honey' ? .18 : .12));
                m += 'A big haul of food.';
            }
            toast(m);
            SFX.win();
            var fp = at(ff.pf, BP[k]);
            burst(fp.x, fp.y, 18, ['#ffd23f', '#fff', '#9bffc8'], 70);
        });
    termRaidTick(dt, quiet);
    if (S.tier >= 2 && !S.rare.nb && fy <= wy(f.nb.fy)) {
        S.rare.nb = 1;
        if (!quiet)
            toast(f.nb.kind === 'termites' ? 'Workers broke into a termite colony next door! They are peaceful and will trade food.' : 'Workers found a colony tending aphids! The aphids give sweet honeydew in trade.');
        SFX.win();
    }
    if (S.rare.nb) {
        tradeT -= dt;
        if (tradeT <= 0) {
            tradeT = 90 + Math.random() * 40;
            var gift = Math.ceil(cap * .02);
            S.food = Math.min(cap, S.food + gift);
            fx.push({ x: f.nb.fx * W, y: wy(f.nb.fy) - 12, vx: 0, vy: -14, l: 1.4, t: '+' + gift + ' trade', f: 11, c: '#ffe08a', g: 0 });
        }
    }
}
