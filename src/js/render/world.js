/* render/world.js
   Drawing the world each frame: background, tunnels, trails, lighting and decorations.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

// a dug tunnel: dark disturbed soil round it, a packed wall, light catching the top lip, a mid-tone hollow
// (so the dark ants show up), the roof's shadow, a lit floor the ants walk on and crumbly edges.
// build() lays down the tunnel's path; it is called once per layer, shifted up or down for the lip and floor.
function strokeTun(tw, build) {
    function pass(dy, w, col, dash) {
        cx.save();
        cx.translate(0, dy);
        build();
        cx.restore();
        if (dash)
            cx.setLineDash(dash);
        cx.strokeStyle = col;
        cx.lineWidth = w;
        cx.stroke();
        if (dash)
            cx.setLineDash([]);
    }
    cx.lineCap = 'round';
    cx.lineJoin = 'round';
    WOB = Math.max(.4, tw * .13);
    try {
        pass(0, tw + 9, 'rgba(8,3,1,.38)');
        pass(0, tw + 5.5, 'rgba(150,100,60,.55)', [.7, 3.3]);
        pass(.6, tw + 4.6, 'rgba(10,4,2,.6)', [.9, 4.1]);
        pass(0, tw + 3.4, '#24140a');
        pass(-tw * .12, tw + 1, 'rgba(255,170,90,.42)');
        pass(0, tw, '#5a3820');
        pass(tw * .08, tw * .55, '#6e4626');
        pass(-tw * .3, tw * .42, 'rgba(8,3,1,.55)');
        pass(tw * .32, tw * .3, '#8a5a30');
        pass(tw * .2, Math.max(.5, tw * .06), 'rgba(255,190,110,.3)');
    }
    finally { WOB = 0; }
}

// glowing amber droplets and fungus along a dug stretch of tunnel (p0 to p1 of route q; no q = main)
function tunGlow(q, p0, p1, tw, seed) {
    var L = (q || MAIN).LEN * (p1 - p0), n = Math.floor(L / 46), r = rng(seed), i;
    for (i = 0; i < n; i++) {
        var p = p0 + (p1 - p0) * (i + .3 + r() * .4) / n, a = at(p, q), sd = r() < .5 ? 1 : -1, x = a.x + a.nx * sd * (tw / 2 + 1), y = a.y + a.ny * sd * (tw / 2 + 1), amb = r() < .55, col = amb ? '255,170,70' : '120,230,200';
        if (r() < .25 || x < VR.x0 || x > VR.x1 || y < VR.y0 || y > VR.y1)
            continue;
        cx.save();
        cx.globalCompositeOperation = 'lighter';
        var lg = cx.createRadialGradient(x, y, 0, x, y, 15);
        lg.addColorStop(0, 'rgba(' + col + ',.3)');
        lg.addColorStop(1, 'rgba(' + col + ',0)');
        cx.fillStyle = lg;
        cx.beginPath();
        cx.arc(x, y, 15, 0, 7);
        cx.fill();
        cx.restore();
        if (amb) {
            cx.fillStyle = 'rgba(255,200,110,.95)';
            cx.beginPath();
            cx.ellipse(x, y, 1.1, 1.5, 0, 0, 7);
            cx.fill();
            cx.fillStyle = '#fff6d8';
            cx.beginPath();
            cx.arc(x - .3, y - .4, .4, 0, 7);
            cx.fill();
        }
        else {
            for (var k = 0; k < 3; k++) {
                var fx2 = x + (k - 1) * 1.6, fy2 = y + (k === 1 ? -.8 : 0);
                cx.strokeStyle = 'rgba(150,240,210,.8)';
                cx.lineWidth = .4;
                cx.beginPath();
                cx.moveTo(fx2, fy2 + 1.5);
                cx.lineTo(fx2, fy2);
                cx.stroke();
                cx.fillStyle = 'rgba(170,255,225,.95)';
                cx.beginPath();
                cx.ellipse(fx2, fy2, .9, .5, 0, Math.PI, 0);
                cx.fill();
            }
        }
    }
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

// the biome's colours, or the shop theme's
function worldBio() {
    var bp = bio(), th = THM[P.theme];
    if (th)
        bp = { top: th.top, bot: th.bot, tint: th.tint, sky: bp.sky };
    return bp;
}

// the nest chambers, side-tunnel and deep-layer end rooms that are open
function worldRooms() {
    var rooms = [], i;
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
    return rooms;
}

/* The ground layer: soil, stones, tunnels, chambers and the queen's cavern. None of it moves, so it is
   drawn once into WC (the screen plus a margin) and copied each frame; it is redrawn only when the view
   leaves the margin, the zoom changes or something is dug (wKey). While pinching it is drawn directly.
   WPASS: 1 = only the still parts, 2 = only the twinkles and other moving bits, 0 = everything. */
var WPASS = 0, WC = { c: null, key: '', zs: 0, x0: 0, y0: 0, w: 0, h: 0 }, WZ = { lz: 0, zt: 0 };

function wStatic(bp) {
    var tw = tunW(), now = 0, i;
    var g = cx.createLinearGradient(0, 0, 0, WH);
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
    // the glow-lit look: the soil sits a little darker so the tunnel lights stand out
    cx.fillStyle = 'rgba(12,5,2,.24)';
    cx.fillRect(wideL() - 20, 20, wideR() - wideL() + 40, WH - 20);
    var rooms = worldRooms().filter(function (r) { return r.x + r.rx + 12 > VR.x0 && r.x - r.rx - 12 < VR.x1 && r.y + r.ry + 12 > VR.y0 && r.y - r.ry - 12 < VR.y1; });
    cavernRim();
    rooms.forEach(function (r) { chamberRim(r.x, r.y, r.rx, r.ry); });
    var farmL = wQL(farmList());
    if (farmL.length) {
        strokeTun(tw * .42, function () {
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
        });
    }
    var deepL = wQL(deepList());
    if (deepL.length) {
        [0, 1].forEach(function (trk) {
            var any = deepL.some(function (o) { return !!o.f.t === !!trk; });
            if (any)
                strokeTun(tw * (trk ? .8 : .42), function () {
            cx.beginPath();
            deepL.forEach(function (o) {
                if (!!o.f.t !== !!trk)
                    return;
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
                });
        });
    }
    if (S.dug > .003) {
        strokeTun(tw, function () {
            tpath();
            rooms.forEach(function (r) { if (r.s) {
                cx.moveTo(r.s[0], r.s[1]);
                cx.lineTo(r.s[2], r.s[3]);
            } });
        });
        // glow lights along the dug tunnels
        tunGlow(null, 1 - S.dug, 1, tw, S.seed + 61);
        for (i = 0; i < S.sideTunnels && i < BP.length; i++)
            tunGlow(BP[i], 0, S.sideDug[i] == null ? 1 : S.sideDug[i], tw, S.seed + 300 + i);
    }
    cavernIn();
    rooms.forEach(function (r) { chamberIn(r.x, r.y, r.rx, r.ry, r.ic); });
}

// what the ground layer depends on: anything here changing redraws it
function wKey(bp) {
    var k = [WH, W, QX, QY, S.tier, S.deep || 0, S.reach || 0, layoutV, FDV, S.seed, P.theme || '', bp.top, bp.bot, bp.tint, wQ(S.dug, LEN), S.sideTunnels, pebs.length, Object.keys(S.rare || {}).join(','), Math.round(frontY() / 4)], i;
    for (i = 0; i < S.sideTunnels && i < BP.length; i++)
        k.push(wQ(S.sideDug[i] == null ? 1 : S.sideDug[i], BP[i].LEN));
    farmList().concat(deepList()).forEach(function (o) { k.push(wQ(o.pr, o.f.q.LEN)); });
    worldRooms().forEach(function (r) { k.push(Math.round(r.x) + ':' + Math.round(r.y) + ':' + Math.round(r.rx * 2) + ':' + Math.round(r.ry * 2) + ':' + (r.ic || '')); });
    var c = cav();
    k.push(Math.round(c.x) + ':' + Math.round(c.y) + ':' + Math.round(c.rx * 2) + ':' + Math.round(c.ry * 2));
    return k.join('|');
}

// Digging: the cached layer holds each tunnel only up to its last 24 px step (wQ); the growing tip beyond
// that is drawn live each frame (wTips), so the cache is not redrawn every frame while ants dig
var WQ = false;
function wQ(p, L) { return p >= 1 ? 1 : Math.floor(p * L / 24) * 24 / Math.max(1, L); }
function wQL(list) { return WQ ? list.map(function (o) { return { f: o.f, pr: wQ(o.pr, o.f.q.LEN), i: o.i }; }) : list; }

// draw the ground layer into a cache canvas c at scale zs with world origin x0,y0, only the rows y0b..y1b
function wRender(c, bp, zs, x0, y0, y0b, y1b) {
    var g = c.getContext('2d'), ovr = VR, occ = cx, odug = S.dug, oside = S.sideDug;
    g.setTransform(zs, 0, 0, zs, -x0 * zs, -y0 * zs);
    g.save();
    g.beginPath();
    g.rect(x0 - 1, y0b, c.width / zs + 2, y1b - y0b);
    g.clip();
    g.clearRect(x0 - 1, y0b, c.width / zs + 2, y1b - y0b);
    VR = { x0: x0 - 40, x1: x0 + c.width / zs + 40, y0: y0b - 40, y1: y1b + 40 };
    cx = g;
    WPASS = 1;
    WQ = true;
    S.dug = wQ(S.dug, LEN);
    S.sideDug = oside.map(function (v, i) { return v == null || !BP[i] ? v : wQ(v, BP[i].LEN); });
    try { wStatic(bp); }
    finally {
        S.dug = odug;
        S.sideDug = oside;
        WQ = false;
        WPASS = 0;
        cx = occ;
        VR = ovr;
        g.restore();
    }
}

// copy the cached ground layer to the screen; false = draw it directly instead (no room for a cache).
// The cache covers the screen plus a 30% margin. Out of it, or zoomed: redrawn at once. Near its edge,
// or something changed: a fresh copy is built in the background a quarter at a time (WB) and swapped in.
var WB = { c: null, b: -1 };
function wBlit(bp, zs) {
    var vw = cv.width / zs, vh = cv.height / zs, m = .3, key = wKey(bp), nb = 4;
    var pw = Math.ceil(cv.width * (1 + 2 * m)), ph = Math.ceil(cv.height * (1 + 2 * m));
    if (pw * ph > 16e6)
        return false;
    function place(o) {
        o.zs = zs;
        o.x0 = Math.floor((camX - vw * m) * zs) / zs;
        o.y0 = Math.floor((cam - vh * m) * zs) / zs;
        o.w = pw / zs;
        o.h = ph / zs;
        o.key = key;
        o.c = o.c || document.createElement('canvas');
        if (o.c.width !== pw || o.c.height !== ph) {
            o.c.width = pw;
            o.c.height = ph;
        }
    }
    var out = !WC.c || zs !== WC.zs || camX < WC.x0 || cam < WC.y0 || camX + vw > WC.x0 + WC.w || cam + vh > WC.y0 + WC.h;
    if (out) {
        place(WC);
        wRender(WC.c, bp, zs, WC.x0, WC.y0, WC.y0, WC.y0 + WC.h);
        WB.b = -1;
    }
    else {
        var edge = Math.min(camX - WC.x0, WC.x0 + WC.w - camX - vw) < vw * m * .45 || Math.min(cam - WC.y0, WC.y0 + WC.h - cam - vh) < vh * m * .45;
        if (WB.b < 0 && (key !== WC.key || edge)) {
            place(WB);
            WB.b = 0;
        }
        else if (WB.b >= 0 && WB.zs !== zs)
            WB.b = -1;
        if (WB.b >= 0) {
            wRender(WB.c, bp, zs, WB.x0, WB.y0, WB.y0 + WB.h * WB.b / nb, WB.y0 + WB.h * (WB.b + 1) / nb);
            if (++WB.b >= nb) {
                var t = WC;
                WC = WB;
                WB = t;
                WB.b = -1;
            }
        }
    }
    cx.save();
    cx.setTransform(1, 0, 0, 1, 0, 0);
    cx.drawImage(WC.c, Math.round((WC.x0 - camX) * zs), Math.round((WC.y0 - cam) * zs));
    cx.restore();
    return true;
}

// the live tips of tunnels still being dug: from the cached step (wQ) to where the diggers have got to
function wTips() {
    var tw = tunW(), i;
    function part(q, p0, p1, w) {
        if (p1 - p0 <= 1e-6)
            return;
        strokeTun(w, function () {
            var R = q || MAIN, a = at(p0, q), b = at(p1, q), lx = a.x, ly = a.y, j;
            cx.beginPath();
            cx.moveTo(a.x, a.y);
            for (j = 1; j < R.PT.length; j++)
                if (R.CUM[j] > p0 * R.LEN && R.CUM[j] < p1 * R.LEN) {
                    vto(lx, ly, R.PT[j][0], R.PT[j][1]);
                    lx = R.PT[j][0];
                    ly = R.PT[j][1];
                }
            vto(lx, ly, b.x, b.y);
        });
    }
    if (S.dug > .003 && S.dug < 1)
        part(null, 1 - S.dug, 1 - wQ(S.dug, LEN), tw);
    for (i = 0; i < S.sideTunnels && i < BP.length; i++)
        if (S.sideDug[i] != null && S.sideDug[i] < 1)
            part(BP[i], wQ(S.sideDug[i], BP[i].LEN), S.sideDug[i], tw);
    farmList().forEach(function (o) { if (o.pr < 1) part(o.f.q, wQ(o.pr, o.f.q.LEN), o.pr, tw * .42); });
    deepList().forEach(function (o) { if (o.pr < 1) part(o.f.q, wQ(o.pr, o.f.q.LEN), o.pr, tw * (o.f.t ? .8 : .42)); });
}

function drawWorld(now) {
    var zs = dpr * K * uz, bp = worldBio(), tw = tunW(), i;
    if (zs !== WZ.lz) {
        WZ.lz = zs;
        WZ.zt = now;
    }
    cx.setTransform(zs, 0, 0, zs, -camX * zs, 0);
    setVR();
    if (now - WZ.zt < 250 || !wBlit(bp, zs)) {
        cx.save();
        cx.translate(0, -cam);
        WPASS = 1;
        try { wStatic(bp); }
        finally { WPASS = 0; }
        cx.restore();
    }
    else {
        cx.save();
        cx.translate(0, -cam);
        wTips();
        cx.restore();
    }
    cx.save();
    cx.translate(0, -cam);
    // the moving bits of the ground: twinkling crystals, springs, neighbour colonies
    WPASS = 2;
    try {
        if (S.deep)
            drawDeepBg(now);
        drawSoil(now);
    }
    finally { WPASS = 0; }
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
    var rx = 62 + S.tier * 5;
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
    var qp = qPos(); drawAnt(qp.x, qp.y, Q.tilt, qSize() + pulse * 3, false, Q.ph, 3);
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
