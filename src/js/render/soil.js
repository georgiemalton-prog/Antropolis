/* render/soil.js
   The soil: textures, layers, finds and the deep-layer backgrounds.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

function drawDeepBg(now) {
    var top = deepTop(), lh = LH(), x0 = wideL() - 20, ww = wideR() - wideL() + 40, v0 = VR.y0 + 30, v1 = VR.y1 - 30, L, i, g, r, a, st = WPASS !== 2, lv = WPASS !== 1;
    g = cx.createLinearGradient(0, WH - 2, 0, top);
    g.addColorStop(0, '#241710');
    g.addColorStop(1, DLAY[0].a);
    cx.fillStyle = g;
    if (st)
        cx.fillRect(x0, WH - 2, ww, top - WH + 4);
    for (L = 0; L < S.deep; L++) {
        var y0 = top + L * lh, y1 = y0 + lh;
        g = cx.createLinearGradient(0, y0, 0, y1);
        g.addColorStop(0, DLAY[L].a);
        g.addColorStop(1, DLAY[L].b);
        cx.fillStyle = g;
        if (st) {
            cx.fillRect(x0, y0, ww, lh + 1);
            cx.strokeStyle = 'rgba(0,0,0,.35)';
            cx.lineWidth = 3;
            cx.beginPath();
            for (i = 0; i <= ww; i += 16)
                cx.lineTo(x0 + i, y0 + Math.sin((x0 + i) * .03 + L * 2) * 3);
            cx.stroke();
        }
        if (y1 < v0 || y0 > v1)
            continue;
        r = rng(S.seed + 5000 + L * 97);
        var n = Math.round(ww * lh / 2600);
        for (i = 0; i < n; i++) {
            var rx = x0 + r() * ww, ry = y0 + 6 + r() * (lh - 12), rs = 1.5 + r() * (L === 1 ? 6 : 3.5), kd = r();
            if (ry < v0 - 10 || ry > v1 + 10)
                continue;
            if (L === 1 || (L === 0 && kd < .3) || L === 3) {
                if (!st)
                    continue;
                cx.fillStyle = L === 0 ? '#5a3a20' : L === 1 ? '#4d4740' : '#2c2c30';
                cx.beginPath();
                cx.ellipse(rx, ry, rs * 1.4, rs, 0, 0, 7);
                cx.fill();
                cx.fillStyle = 'rgba(255,255,255,.1)';
                cx.beginPath();
                cx.ellipse(rx - rs * .3, ry - rs * .3, rs * .8, rs * .4, 0, 0, 7);
                cx.fill();
            }
            else if (L === 2 && kd > .86) {
                if (!lv)
                    continue;
                a = .5 + .3 * Math.sin(now * .002 + rx);
                cx.fillStyle = 'rgba(120,170,255,' + a + ')';
                cx.beginPath();
                cx.moveTo(rx, ry - rs * 2.2);
                cx.lineTo(rx + rs * .8, ry);
                cx.lineTo(rx - rs * .8, ry);
                cx.fill();
                cx.save();
                cx.globalCompositeOperation = 'lighter';
                glow(rx, ry - rs, 14, '110,160,255', .12 * a);
                cx.restore();
            }
            else if (L === 3 && kd > .8) {
                if (!lv)
                    continue;
                a = .4 + .3 * Math.sin(now * .0016 + ry);
                cx.strokeStyle = 'rgba(230,150,50,' + a + ')';
                cx.lineWidth = 1.2;
                cx.beginPath();
                cx.moveTo(rx - 8, ry);
                cx.lineTo(rx, ry + rs);
                cx.lineTo(rx + 9, ry - rs * .5);
                cx.stroke();
            }
            else if (st) {
                cx.fillStyle = 'rgba(0,0,0,.18)';
                cx.fillRect(rx, ry, 2, 1.4);
            }
        }
    }
}

// ---- drawing the world and the nest ----

function soilTex() {
    if (!soilP) {
        var c = document.createElement('canvas');
        c.width = c.height = 96;
        var g = c.getContext('2d');
        for (var i = 0; i < 260; i++) {
            g.fillStyle = Math.random() < .5 ? 'rgba(0,0,0,.18)' : 'rgba(255,220,170,.07)';
            g.fillRect(Math.random() * 96, Math.random() * 96, 1 + Math.random() * 2, 1 + Math.random() * 2);
        }
        soilP = cx.createPattern(c, 'repeat');
    }
    var XL = wideL() - 20, XR = wideR() + 20, XW = XR - XL, WWf = Math.round(XW / W);
    cx.fillStyle = soilP;
    cx.fillRect(XL, 0, XW, WH);
    var r = rng(S.seed + 3), x;
    for (i = 0; i < 7; i++) {
        var y = 60 + i * WH / 7 + r() * 30;
        cx.fillStyle = i % 2 ? 'rgba(0,0,0,.10)' : 'rgba(255,200,140,.05)';
        cx.beginPath();
        cx.moveTo(XL, y);
        for (x = XL; x <= XR; x += 20)
            cx.lineTo(x, y + Math.sin(x * .03 + i * 2) * 6);
        cx.lineTo(XR, y + 28);
        for (x = XR; x >= XL; x -= 20)
            cx.lineTo(x, y + 28 + Math.sin(x * .02 + i) * 5);
        cx.fill();
    }
    // roots from the grass: tapering, with side shoots
    cx.lineCap = 'round';
    for (i = 0; i < 8 * WWf; i++) {
        var r0 = XL + r() * XW, len = 30 + r() * 60, w0 = 1.4 + r() * 1.4, px = r0, py = 26, k, rs = rng(S.seed + 31 + i);
        if (r0 < VR.x0 - 20 || r0 > VR.x1 + 20 || VR.y0 > 26 + len + 15)
            continue;
        for (k = 0; k < 6; k++) {
            var nx = px + (rs() - .5) * 9, ny = py + len / 6;
            cx.strokeStyle = 'rgba(70,46,26,.85)';
            cx.lineWidth = w0 * (1 - k / 7);
            cx.beginPath();
            cx.moveTo(px, py);
            cx.quadraticCurveTo(px + (rs() - .5) * 7, py + len / 12, nx, ny);
            cx.stroke();
            if (rs() < .35) {
                cx.lineWidth = w0 * .3;
                cx.beginPath();
                cx.moveTo(nx, ny);
                cx.quadraticCurveTo(nx + (rs() - .5) * 9, ny + 4, nx + (rs() - .5) * 13, ny + 7 + rs() * 6);
                cx.stroke();
            }
            px = nx;
            py = ny;
        }
        cx.strokeStyle = 'rgba(255,215,160,.12)';
        cx.lineWidth = .5;
        cx.beginPath();
        cx.moveTo(r0 - .4, 26);
        cx.quadraticCurveTo(r0 + 2, 26 + len * .3, r0 + 1, 26 + len * .5);
        cx.stroke();
    }
    for (i = 0; i < 34 * WWf; i++) {
        var sx = XL + r() * XW, sy = 60 + r() * (WH - 80), sr = 1.6 + r() * r() * 6.5, rot = r() * 3;
        if (sx < VR.x0 - 12 || sx > VR.x1 + 12 || sy < VR.y0 - 12 || sy > VR.y1 + 12)
            continue;
        // a shaded stone with a contact shadow
        cx.fillStyle = 'rgba(0,0,0,.35)';
        cx.beginPath();
        cx.ellipse(sx + .8, sy + 1.4, sr * 1.3, sr * .95, rot, 0, 7);
        cx.fill();
        var sg = cx.createRadialGradient(sx - sr * .4, sy - sr * .5, sr * .1, sx, sy, sr * 1.4);
        sg.addColorStop(0, '#8a7a6a');
        sg.addColorStop(.6, '#4a3c30');
        sg.addColorStop(1, '#1e150e');
        cx.fillStyle = sg;
        cx.beginPath();
        cx.ellipse(sx, sy, sr * 1.3, sr, rot, 0, 7);
        cx.fill();
    }
    // little things buried in the soil: seed husks, snail shells and tiny bones
    var rb = rng(S.seed + 4471);
    for (i = 0; i < 14 * WWf; i++) {
        var bx = XL + rb() * XW, by = 70 + rb() * (WH - 100), kind = rb(), ba = rb() * 6.28;
        if (bx < VR.x0 - 10 || bx > VR.x1 + 10 || by < VR.y0 - 10 || by > VR.y1 + 10)
            continue;
        cx.save();
        cx.translate(bx, by);
        cx.rotate(ba);
        if (kind < .45) {
            cx.fillStyle = '#8a6a3a';
            cx.beginPath();
            cx.ellipse(0, 0, 3.2, 1.6, 0, 0, 7);
            cx.fill();
            cx.strokeStyle = 'rgba(40,20,8,.6)';
            cx.lineWidth = .4;
            cx.beginPath();
            cx.moveTo(-3, 0);
            cx.lineTo(3, 0);
            cx.stroke();
        }
        else if (kind < .75) {
            var shg = cx.createRadialGradient(-1, -1, .3, 0, 0, 4);
            shg.addColorStop(0, '#e8d2b0');
            shg.addColorStop(1, '#7a5a3a');
            cx.fillStyle = shg;
            cx.beginPath();
            cx.arc(0, 0, 3.4, 0, 7);
            cx.fill();
            cx.strokeStyle = 'rgba(70,44,24,.8)';
            cx.lineWidth = .45;
            cx.beginPath();
            for (var tt = 0; tt < 14; tt += .35)
                cx.lineTo(Math.cos(tt) * 3.2 * (1 - tt / 14), Math.sin(tt) * 3.2 * (1 - tt / 14));
            cx.stroke();
        }
        else {
            cx.strokeStyle = 'rgba(225,215,190,.7)';
            cx.lineWidth = 1.1;
            cx.lineCap = 'round';
            cx.beginPath();
            cx.moveTo(-3.5, 0);
            cx.lineTo(3.5, 0);
            cx.stroke();
            cx.fillStyle = 'rgba(225,215,190,.8)';
            [-3.5, 3.5].forEach(function (ex) { cx.beginPath(); cx.arc(ex, -.6, .8, 0, 7); cx.arc(ex, .6, .8, 0, 7); cx.fill(); });
        }
        cx.restore();
    }
}

function farDecor(now) {
    var r = rng(S.seed + 4242), n = 16 * (S.reach || 0) * 2, i, span = (S.reach || 0) * W, side, x, y, t, k;
    for (i = 0; i < n; i++) {
        side = i % 2 ? 1 : -1;
        x = side < 0 ? -r() * span : W + r() * span;
        y = 60 + r() * (WH - 110);
        t = Math.floor(r() * 4);
        if (x < VR.x0 || x > VR.x1)
            continue;
        if (WPASS === 2 && t !== 1)
            continue;
        if (t === 0) {
            cx.strokeStyle = 'rgba(150,110,70,.7)';
            cx.lineWidth = 1.2;
            cx.lineCap = 'round';
            for (k = 0; k < 3; k++) {
                cx.beginPath();
                cx.moveTo(x, y);
                cx.bezierCurveTo(x + (k - 1) * 9, y + 10, x + (k - 1) * 14 + 4, y + 20, x + (k - 1) * 18, y + 30 + k * 4);
                cx.stroke();
            }
        }
        else if (t === 1) {
            cx.strokeStyle = r() < .5 ? 'rgba(230,190,90,.75)' : 'rgba(110,200,210,.7)';
            if (WPASS !== 2) {
                cx.lineWidth = 1.6;
                cx.beginPath();
                cx.moveTo(x - 10, y + 5);
                cx.lineTo(x - 2, y - 2);
                cx.lineTo(x + 4, y + 3);
                cx.lineTo(x + 12, y - 5);
                cx.stroke();
            }
            if (WPASS !== 1) {
                cx.fillStyle = 'rgba(255,255,255,' + (.25 + .25 * Math.sin(now * .004 + i)) + ')';
                cx.fillRect(x + 3, y + 1, 1.6, 1.6);
            }
        }
        else if (t === 2) {
            cx.fillStyle = '#4b3a2a';
            cx.beginPath();
            cx.ellipse(x, y, 11, 7, .3, 0, 7);
            cx.fill();
            cx.fillStyle = 'rgba(255,230,190,.16)';
            cx.beginPath();
            cx.ellipse(x - 3, y - 2.5, 5, 2.6, .3, 0, 7);
            cx.fill();
        }
        else {
            cx.strokeStyle = 'rgba(205,195,170,.5)';
            cx.lineWidth = 1;
            cx.beginPath();
            for (k = 0; k < 24; k++) {
                var ang = k * .5, rr = 1 + k * .35;
                cx.lineTo(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr);
            }
            cx.stroke();
        }
    }
}

function drawSoil(now) {
    var f = feat(), n = f.bands.length, y0 = 30, hh = WH - 50, i, x, st = WPASS !== 2, lv = WPASS !== 1;
    for (i = 0; i < n && st; i++) {
        var b = f.bands[i];
        if (!b.t)
            continue;
        cx.fillStyle = SOILC[b.t];
        cx.beginPath();
        var ta = y0 + hh * i / n, tb = y0 + hh * (i + 1) / n;
        for (x = wideL() - 20; x <= wideR() + 20; x += 20)
            cx.lineTo(x, ta + Math.sin(x * .02 + b.ph) * 5);
        for (x = wideR() + 20; x >= wideL() - 20; x -= 20)
            cx.lineTo(x, tb + Math.sin(x * .02 + b.ph + 1.7) * 5);
        cx.fill();
        if (b.t === 3) {
            cx.fillStyle = 'rgba(190,195,205,.35)';
            b.sp.forEach(function (q) { cx.fillRect(q[0] * W, ta + q[1] * (tb - ta), 3, 2); });
        }
    }
    var fy = frontY();
    f.springs.forEach(function (sp) {
        if (S.dug <= .02 || fy > wy(sp.fy))
            return;
        var x = sp.fx * W, y = wy(sp.fy);
        if (st) {
            cx.fillStyle = 'rgba(70,140,200,.55)';
            cx.beginPath();
            cx.ellipse(x, y, 16, 7, 0, 0, 7);
            cx.fill();
        }
        if (lv) {
            cx.fillStyle = 'rgba(190,230,255,' + (.25 + .15 * Math.sin(now * .003 + x)) + ')';
            cx.beginPath();
            cx.ellipse(x - 4, y - 2, 6, 2, 0, 0, 7);
            cx.fill();
        }
    });
    f.finds.forEach(function (fd) {
        if (!S.rare[fd.id] || !st)
            return;
        var x = fd.fx * W, y = wy(fd.fy);
        if (fd.id === 'old') {
            cx.strokeStyle = 'rgba(20,12,7,.55)';
            cx.lineWidth = 4;
            cx.lineCap = 'round';
            cx.beginPath();
            cx.moveTo(x - 50, y);
            cx.quadraticCurveTo(x, y + 14, x + 50, y - 4);
            cx.stroke();
        }
        else {
            cx.fillStyle = fd.id === 'fossil' ? '#cfc7b4' : fd.id === 'amber' ? '#e0902a' : fd.id === 'seeds' ? '#8a5a2c' : '#b89ad8';
            cx.beginPath();
            cx.ellipse(x, y, 5, 3.4, .4, 0, 7);
            cx.fill();
            if (fd.id === 'fossil') {
                cx.strokeStyle = '#8f8878';
                cx.lineWidth = 1;
                cx.beginPath();
                cx.arc(x, y, 2, 0, 5);
                cx.stroke();
            }
        }
    });
    if (S.reach)
        farDecor(now);
    if (S.reach)
        f.far.forEach(function (ff) {
            if (!S.rare['far' + ff.w] || !BP[12 + ff.w])
                return;
            var q = at(ff.pf, BP[12 + ff.w]), x = q.x + q.nx * ff.sd * 13, y = q.y + q.ny * ff.sd * 13;
            if (ff.t === 'spring') {
                if (st) {
                    cx.fillStyle = 'rgba(70,140,200,.6)';
                    cx.beginPath();
                    cx.ellipse(x, y, 14, 6, 0, 0, 7);
                    cx.fill();
                }
                if (lv) {
                    cx.fillStyle = 'rgba(190,230,255,' + (.25 + .15 * Math.sin(now * .003 + x)) + ')';
                    cx.beginPath();
                    cx.ellipse(x - 3, y - 2, 5, 1.8, 0, 0, 7);
                    cx.fill();
                }
            }
            else if (!st)
                return;
            else if (ff.t === 'geode') {
                cx.fillStyle = '#7a5a8a';
                cx.beginPath();
                cx.ellipse(x, y, 6, 4.6, .3, 0, 7);
                cx.fill();
                cx.fillStyle = '#c28bf0';
                cx.beginPath();
                cx.moveTo(x - 3, y + 1);
                cx.lineTo(x - 1, y - 4);
                cx.lineTo(x + 1, y + 1);
                cx.lineTo(x + 3, y - 3);
                cx.lineTo(x + 4, y + 2);
                cx.fill();
            }
            else if (ff.t === 'roots') {
                cx.strokeStyle = '#a07a4a';
                cx.lineWidth = 1.4;
                cx.lineCap = 'round';
                cx.beginPath();
                cx.moveTo(x - 9, y - 4);
                cx.quadraticCurveTo(x - 2, y + 6, x + 4, y - 2);
                cx.quadraticCurveTo(x + 8, y - 6, x + 11, y + 3);
                cx.moveTo(x - 2, y + 2);
                cx.lineTo(x - 5, y + 8);
                cx.stroke();
            }
            else if (ff.t === 'bones') {
                cx.strokeStyle = '#e9e2cf';
                cx.lineWidth = 2.2;
                cx.lineCap = 'round';
                cx.beginPath();
                cx.moveTo(x - 7, y - 3);
                cx.lineTo(x + 7, y + 3);
                cx.moveTo(x - 6, y + 4);
                cx.lineTo(x + 5, y - 5);
                cx.stroke();
            }
            else {
                cx.fillStyle = '#e8b030';
                for (var hi = 0; hi < 3; hi++) {
                    cx.beginPath();
                    cx.arc(x - 6 + hi * 6, y + (hi % 2) * 4, 3.4, 0, 7);
                    cx.fill();
                }
            }
        });
    if (!lv)
        return;
    if (S.rare.nb)
        drawNeighbour(f.nb, now);
    if (S.rare.nbf && BP[17]) {
        var fnn = farNest();
        drawNeighbour(fnn, now, BP[17], Math.min(1, S.sideDug[17] == null ? 1 : S.sideDug[17]));
        cx.fillStyle = 'rgba(255,150,130,.95)';
        cx.font = '600 8px sans-serif';
        cx.textAlign = 'center';
        cx.fillText('Hostile termites', fnn.fx * W, fnn.ya * WH + 33);
    }
}
