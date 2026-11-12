/* ui/map.js
   The full colony map.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

/* Colony map: every tunnel at once, with a dot for each ant. Tap it to jump the tunnel view to that spot. */
var mapT = 0, mapG = null, mapV = { z: 1, cx: null, cy: null };
function mapOpen() {
    var o = $('mapov'), nv = document.querySelector('.nav'), h = Math.round((nv ? nv.getBoundingClientRect().top : innerHeight - 100) - 6);
    o.classList.add('on');
    o.style.height = h + 'px';
    mapV = { z: 1, cx: null, cy: null };
    mapChips();
    var c = $('mapcv'), d = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(innerWidth * d);
    c.height = Math.round(h * d);
    c.style.height = h + 'px';
    mapDraw();
    clearInterval(mapT);
    mapT = setInterval(mapDraw, 300);
}
// the map reaches down past the nest floor (the cavern bulges below the old world bottom)
function mapY1() { var c = cav(); return Math.max(WHX(), QY + 80, c.y + c.ry * 1.12 + 10); }
function mapView(ya, yb) {
    var c = $('mapcv'), cw = c.clientWidth, vh = c.clientHeight - 34, x0 = wideL() - 12, x1 = wideR() + 12, y0 = -SK + 40, y1 = mapY1(), sc0 = Math.min((cw - 28) / (x1 - x0), (vh - 28) / (y1 - y0));
    if (ya == null) {
        mapV = { z: 1, cx: null, cy: null };
    }
    else {
        var t = Math.min((cw - 28) / (x1 - x0), (vh - 28) / (yb - ya));
        mapV = { z: Math.max(1, Math.min(12, t / sc0)), cx: (x0 + x1) / 2, cy: (ya + yb) / 2 };
    }
    mapDraw();
}
function mapChips() {
    var el = $('mapch'), h = '<button class="card" data-m="a">All</button><button class="card" data-m="n">Nest</button>', L;
    for (L = 0; L < (S.deep || 0); L++)
        h += '<button class="card" data-m="' + L + '">Deep ' + (L + 1) + '</button>';
    el.innerHTML = h;
    [].forEach.call(el.children, function (b) {
        b.onclick = function () {
            var m = b.getAttribute('data-m');
            if (m === 'a')
                mapView();
            else if (m === 'n')
                mapView(-SK + 40, S.deep ? deepTop() : mapY1());
            else
                mapView(deepTop() + +m * LH(), deepTop() + (+m + 1) * LH());
        };
    });
}
function mapClose() {
    clearInterval(mapT);
    $('mapov').classList.remove('on');
}
function mapPath(q, pr, from) {
    var n = Math.max(4, Math.floor(q.LEN * (pr - from) / 8)), i, a, o = [];
    for (i = 0; i <= n; i++) {
        a = at(from + (pr - from) * i / n, q);
        o.push([a.x, a.y]);
    }
    return o;
}
var MAPC = null;
function mapKey(cw, ch, d) {
    var t = 0, k;
    for (k = 0; k < S.sideTunnels && k < BP.length; k++)
        t += Math.round((S.sideDug[k] == null ? 1 : S.sideDug[k]) * 50);
    farmList().forEach(function (e) { t += Math.round(e.pr * 50) + 7; });
    deepList().forEach(function (e) { t += Math.round(e.pr * 50) + 3; });
    var c0 = cav();
    return [layoutV, cw, ch, d, mapV.z.toFixed(3), Math.round(mapV.cx), Math.round(mapV.cy), t, Math.round(S.dug * 200), Math.round(c0.rx), P.theme || 0, S.biome || 0].join('|');
}
function mapDraw() {
    var c = $('mapcv');
    if (!c || !$('mapov').classList.contains('on') || !MAIN)
        return;
    var g = c.getContext('2d'), cw = c.clientWidth, ch = c.clientHeight, d = c.width / cw;
    var x0 = wideL() - 12, x1 = wideR() + 12, y0 = -SK + 40, y1 = mapY1(), pad = 14;
    var vh = ch - 34, sc0 = Math.min((cw - pad * 2) / (x1 - x0), (vh - pad * 2) / (y1 - y0));
    if (mapV.cx == null) {
        mapV.cx = (x0 + x1) / 2;
        mapV.cy = (y0 + y1) / 2;
    }
    var sc = sc0 * mapV.z, vx = cw / 2, vy = vh / 2;
    mapG = { sc: sc, cx: mapV.cx, cy: mapV.cy, vx: vx, vy: vy, sc0: sc0 };
    function X(x) { return vx + (x - mapV.cx) * sc; }
    function Y(y) { return vy + (y - mapV.cy) * sc; }
    // the tunnels only change when something is dug or the view moves: draw them once into a cache, then just add the ants on top
    var mk = mapKey(cw, ch, d);
    if (!MAPC || MAPC.k !== mk) {
        MAPC = MAPC || { c: document.createElement('canvas') };
        MAPC.k = mk;
        MAPC.c.width = c.width;
        MAPC.c.height = c.height;
        var gMain = g;
        g = MAPC.c.getContext('2d');
        g.setTransform(d, 0, 0, d, 0, 0);
        g.clearRect(0, 0, cw, ch);
        var bp = bio(), gr = g.createLinearGradient(0, Y(22), 0, Y(y1));
        gr.addColorStop(0, bp.top || '#4a3322');
        gr.addColorStop(1, bp.bot || '#241710');
        g.fillStyle = '#150d07';
        g.fillRect(0, 0, cw, ch);
        g.save();
        g.beginPath();
        g.rect(0, 0, cw, vh);
        g.clip();
        g.fillStyle = gr;
        g.fillRect(X(x0), Y(22), (x1 - x0) * sc, (y1 - 22) * sc);
        g.fillStyle = bp.sky ? bp.sky[1] : '#a9d3df';
        g.globalAlpha = .55;
        g.fillRect(X(x0), Y(y0), (x1 - x0) * sc, (22 - y0) * sc);
        g.globalAlpha = 1;
        g.fillStyle = bp.grass || '#4f9a3c';
        g.fillRect(X(x0), Y(18), (x1 - x0) * sc, 5 * sc + 1);
        // the whole nest cavern, floor included, in its real lumpy shape
        var cv0 = cav(), ca, cm;
        g.beginPath();
        for (i = 0; i <= 72; i++) {
            ca = Math.PI * 2 * i / 72;
            cm = cavM(ca);
            var cxp = X(cv0.x + Math.cos(ca) * cv0.rx * cm), cyp = Y(cv0.y + Math.sin(ca) * cv0.ry * cm);
            if (i)
                g.lineTo(cxp, cyp);
            else
                g.moveTo(cxp, cyp);
        }
        g.closePath();
        // the same dark cavern as the Nest tab, glowing warm round the queen
        var cg = g.createRadialGradient(X(QX), Y(QY), 2, X(QX), Y(QY), Math.max(8, cv0.rx * sc * 1.05));
        cg.addColorStop(0, '#8a4020');
        cg.addColorStop(.35, '#5a2814');
        cg.addColorStop(1, '#1c0b05');
        g.fillStyle = cg;
        g.fill();
        g.strokeStyle = 'rgba(255,150,90,.55)';
        g.lineWidth = 1.5;
        g.stroke();
        function line(pts, w, col) {
            g.beginPath();
            pts.forEach(function (p, i) { if (i)
                g.lineTo(X(p[0]), Y(p[1]));
            else
                g.moveTo(X(p[0]), Y(p[1])); });
            g.lineCap = 'round';
            g.lineJoin = 'round';
            g.strokeStyle = 'rgba(10,5,2,.7)';
            g.lineWidth = w + 3;
            g.stroke();
            g.strokeStyle = col;
            g.lineWidth = w;
            g.stroke();
        }
        var i, k, pr;
        var tw = Math.min(16, Math.max(2, 5 * sc));
        for (k = 0; k < S.sideTunnels && k < BP.length; k++) {
            pr = S.sideDug[k] == null ? 1 : S.sideDug[k];
            if (pr > .02)
                line(mapPath(BP[k], pr, 0), tw, '#cfa46a');
        }
        farmList().forEach(function (e2) { line(mapPath(e2.f.q, e2.pr, 0), tw, '#c49a62'); if (e2.pr >= 1 && e2.f.ch) {
            var l = e2.f.q.PT[e2.f.q.PT.length - 1];
            g.fillStyle = '#7fd08a';
            g.beginPath();
            g.arc(X(l[0]), Y(l[1]), Math.max(3, 7 * sc), 0, 7);
            g.fill();
        } });
        deepList().forEach(function (e2) { line(mapPath(e2.f.q, e2.pr, 0), tw, '#9a8a78'); });
        line(mapPath(MAIN, 1, Math.max(0, 1 - S.dug)), tw * 1.25, '#e0b878');
        mapQueen(g, X(QX), Y(QY), Math.max(8, 13 * sc));
        g.restore();
        g = gMain;
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, c.width, c.height);
    g.drawImage(MAPC.c, 0, 0);
    g.setTransform(d, 0, 0, d, 0, 0);
    g.save();
    g.beginPath();
    g.rect(0, 0, cw, vh);
    g.clip();
    var R = Math.min(6, Math.max(1.3, 2.2 * sc)), heroes = [];
    function dot(x, y, col, r) {
        var sp = mapAnt(col, r || R, d);
        g.drawImage(sp, X(x) - sp.width / d / 2, Y(y) - sp.height / d / 2, sp.width / d, sp.height / d);
    }
    farmAnts(performance.now(), function (fa, fwd, k) { dot(fa.x, fa.y, CC[k]); });
    crewA.forEach(function (a) { if (a.wx != null)
        dot(a.wx, a.wy, '#e8cf9a'); });
    marchers.forEach(function (m) {
        if (m.wx == null)
            return;
        if (m.hero != null && S.heroes && S.heroes[m.hero])
            heroes.push(m);
        else
            dot(m.wx, m.wy, CC[m.k] || '#fff', m.k === 4 ? R * 1.8 : R);
    });
    foes.forEach(function (f) {
        if (f.p < 0)
            return;
        var a = at(Math.min(1, f.p)), sp = mapFoe(R * (f.boss ? 3 : 1.8), d);
        g.drawImage(sp, X(a.x) - sp.width / d / 2, Y(a.y) - sp.height / d / 2, sp.width / d, sp.height / d);
    });
    if (gold && gold.x != null)
        dot(gold.x, gold.y, '#ffd23f', R * 2);
    g.font = '700 11px sans-serif';
    g.textAlign = 'left';
    heroes.forEach(function (m) {
        var h = S.heroes[m.hero];
        g.save();
        g.shadowColor = h.c;
        g.shadowBlur = 8;
        dot(m.wx, m.wy, h.c, R * 2.4);
        g.restore();
        mapStar(g, X(m.wx), Y(m.wy) - R * 3, Math.max(2.5, R * 1.1), h.c);
        g.lineWidth = 3;
        g.strokeStyle = 'rgba(20,10,4,.85)';
        g.strokeText(h.n, X(m.wx) + 7, Y(m.wy) + 4);
        g.fillStyle = h.c;
        g.fillText(h.n, X(m.wx) + 7, Y(m.wy) + 4);
    });
    g.strokeStyle = 'rgba(255,255,255,.75)';
    g.lineWidth = 1.5;
    g.strokeRect(X(camX), Y(camT), W / uz * sc, H / uz * sc);
    g.restore();
    var lg = [['Workers', '#e8cf9a'], ['Nurses', CC[0]], ['Foragers', CC[1]], ['Soldiers', CC[2]], ['Scouts', CC[3]], ['Invaders', '#ff3b2b']], lx = 12;
    g.font = '600 11px sans-serif';
    lg.forEach(function (l) {
        dot2(lx + 4, ch - 16, l[1]);
        g.fillStyle = '#e8d9bd';
        g.fillText(l[0], lx + 11, ch - 12);
        lx += 18 + g.measureText(l[0]).width;
    });
    function dot2(x, y, col) { var sp = col === '#ff3b2b' ? mapFoe(4, d) : mapAnt(col, 3, d); g.drawImage(sp, x - sp.width / d / 2, y - sp.height / d / 2, sp.width / d, sp.height / d); }
}
function mapJump(px, py) {
    if (!mapG)
        return;
    var wx = (px - mapG.vx) / mapG.sc + mapG.cx, wy = (py - mapG.vy) / mapG.sc + mapG.cy;
    mapClose();
    go('tun');
    setZoom(Math.max(uz, 1.6));
    camX = camXc(wx - W / (2 * uz));
    camT = camClamp(wy - H / (2 * uz));
    selFollow = false;
    sel = null;
    follow = performance.now() + 8000;
}
function mapZoomAt(f, px, py) {
    if (!mapG)
        return;
    var wx = (px - mapG.vx) / mapG.sc + mapG.cx, wy = (py - mapG.vy) / mapG.sc + mapG.cy;
    mapV.z = Math.max(1, Math.min(14, mapV.z * f));
    var sc = mapG.sc0 * mapV.z;
    mapV.cx = wx - (px - mapG.vx) / sc;
    mapV.cy = wy - (py - mapG.vy) / sc;
    mapDraw();
}

// panning, pinching and tapping on the colony map (called once from boot.js)
function initMapGestures() {
    (function () {
        var c = $('mapcv'), pts = {}, moved = false, d0 = 0;
        function rel(e) { var r = c.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
        c.addEventListener('pointerdown', function (e) {
            pts[e.pointerId] = rel(e);
            moved = false;
            d0 = 0;
            try {
                c.setPointerCapture(e.pointerId);
            }
            catch (er) { }
        });
        c.addEventListener('pointermove', function (e) {
            var p = pts[e.pointerId], n = rel(e), k = Object.keys(pts);
            if (!p || !mapG)
                return;
            if (k.length >= 2) {
                var o = pts[k[0] === '' + e.pointerId ? k[1] : k[0]], dOld = Math.hypot(p.x - o.x, p.y - o.y);
                pts[e.pointerId] = n;
                var dNew = Math.hypot(n.x - o.x, n.y - o.y);
                if (dOld > 0)
                    mapZoomAt(dNew / dOld, (n.x + o.x) / 2, (n.y + o.y) / 2);
                moved = true;
                return;
            }
            var dx = n.x - p.x, dy = n.y - p.y;
            if (Math.hypot(dx, dy) < 1)
                return;
            pts[e.pointerId] = n;
            d0 += Math.hypot(dx, dy);
            if (d0 > 6)
                moved = true;
            if (moved) {
                mapV.cx -= dx / mapG.sc;
                mapV.cy -= dy / mapG.sc;
                mapDraw();
            }
        });
        function up(e) {
            var p = pts[e.pointerId], n = Object.keys(pts).length;
            delete pts[e.pointerId];
            if (p && n === 1 && !moved)
                mapJump(p.x, p.y);
        }
        c.addEventListener('pointerup', up);
        c.addEventListener('pointercancel', function (e) { delete pts[e.pointerId]; });
        c.addEventListener('wheel', function (e) { e.preventDefault(); var p = rel(e); mapZoomAt(e.deltaY < 0 ? 1.25 : .8, p.x, p.y); }, { passive: false });
    })();
}
function mapIsOpen() { var o = $('mapov'); return !!(o && o.classList.contains('on')); }

// ---- map icons: little shaded ants, a spiky invader badge, the queen's crown. Ant and invader icons are
// drawn once per colour and size into a cache, so a busy map is still just image copies.
var MAPI = {};
function mapIco(key, w, h, d, fn) {
    var c = MAPI[key];
    if (c)
        return c;
    c = document.createElement('canvas');
    c.width = Math.ceil(w * d);
    c.height = Math.ceil(h * d);
    var g = c.getContext('2d');
    g.scale(d, d);
    fn(g);
    if (Object.keys(MAPI).length > 200)
        MAPI = {};
    MAPI[key] = c;
    return c;
}
function mapAnt(col, r, d) {
    col = col || '#ffffff';
    r = Math.round(r * 4) / 4;
    var w = r * 3.4 + 2, h = r * 4.6 + 2;
    return mapIco('a' + col + r + 'x' + d, w, h, d, function (g) {
        var cx2 = w / 2, cy2 = h / 2;
        g.strokeStyle = 'rgba(10,5,2,.9)';
        g.lineWidth = Math.max(.6, r * .28);
        g.lineCap = 'round';
        var ty = cy2 - r * .1;
        for (var j = -1; j <= 1; j++)
            for (var sd = -1; sd <= 1; sd += 2) {
                g.beginPath();
                g.moveTo(cx2, ty + j * r * .2);
                g.lineTo(cx2 + sd * r * .85, ty + j * r * .25 - r * .2);
                g.lineTo(cx2 + sd * r * 1.45, ty + j * r * .95 + r * .15);
                g.stroke();
            }
        [0, 1, 2].forEach(function (i) {
            var by = cy2 + (i === 0 ? -r * 1.45 : i === 1 ? -r * .1 : r * 1.25), br = i === 0 ? r * .6 : i === 1 ? r * .5 : r * .78;
            var gg = g.createRadialGradient(cx2 - br * .35, by - br * .4, br * .1, cx2, by, br * 1.1);
            gg.addColorStop(0, antShade(col, 1.6));
            gg.addColorStop(.6, col);
            gg.addColorStop(1, antShade(col, .35));
            g.fillStyle = gg;
            g.beginPath();
            g.arc(cx2, by, br, 0, 7);
            g.fill();
            g.strokeStyle = 'rgba(10,5,2,.75)';
            g.lineWidth = Math.max(.4, r * .14);
            g.stroke();
        });
    });
}
function mapFoe(r, d) {
    r = Math.round(r * 4) / 4;
    var w = r * 2.9 + 2;
    return mapIco('f' + r + 'x' + d, w, w, d, function (g) {
        var c = w / 2, i, a;
        g.beginPath();
        for (i = 0; i < 16; i++) {
            a = i / 16 * 6.283;
            var rr = i % 2 ? r * 1.05 : r * 1.4;
            g.lineTo(c + Math.cos(a) * rr, c + Math.sin(a) * rr);
        }
        g.closePath();
        var gg = g.createRadialGradient(c - r * .3, c - r * .4, r * .1, c, c, r * 1.4);
        gg.addColorStop(0, '#ff8a6a');
        gg.addColorStop(.6, '#e02a1a');
        gg.addColorStop(1, '#6a0c06');
        g.fillStyle = gg;
        g.fill();
        g.strokeStyle = 'rgba(255,240,230,.9)';
        g.lineWidth = Math.max(.7, r * .16);
        g.stroke();
        // a little bug mark: body and two feelers
        g.fillStyle = 'rgba(30,4,2,.85)';
        g.beginPath();
        g.ellipse(c, c + r * .15, r * .32, r * .45, 0, 0, 7);
        g.arc(c, c - r * .38, r * .2, 0, 7);
        g.fill();
        g.strokeStyle = 'rgba(30,4,2,.85)';
        g.lineWidth = Math.max(.5, r * .1);
        g.beginPath();
        g.moveTo(c - r * .1, c - r * .5);
        g.lineTo(c - r * .4, c - r * .8);
        g.moveTo(c + r * .1, c - r * .5);
        g.lineTo(c + r * .4, c - r * .8);
        g.stroke();
    });
}
// the queen on the map: a small top-down copy of the new queen (dark-red armour, glowing gem eyes) on a gold-ringed badge
function mapQueen(g, x, y, r) {
    var gg = g.createRadialGradient(x - r * .3, y - r * .35, r * .1, x, y, r * 1.1);
    gg.addColorStop(0, '#5a1a12');
    gg.addColorStop(1, '#14050a');
    g.fillStyle = gg;
    g.beginPath();
    g.arc(x, y, r, 0, 7);
    g.fill();
    g.strokeStyle = '#ffd27a';
    g.lineWidth = 1.5;
    g.stroke();
    var u = r / 10;
    g.save();
    g.translate(x, y);
    // legs
    g.strokeStyle = '#0e0506';
    g.lineWidth = Math.max(.8, u * .9);
    g.lineCap = 'round';
    g.beginPath();
    [[-1.2, -4], [0, -5.5], [1.2, -4]].forEach(function (l, k) {
        [1, -1].forEach(function (d) { g.moveTo(d * u * 1.2, u * (l[0] - 1.5)); g.lineTo(d * u * 5.5, u * (l[0] - 1.5 + (k - 1) * 3.2)); });
    });
    g.stroke();
    function blob(cy, rx, ry, lit) {
        var b = g.createRadialGradient(-rx * .3, cy - ry * .4, ry * .1, 0, cy, Math.max(rx, ry));
        b.addColorStop(0, lit);
        b.addColorStop(.6, '#2a0c0a');
        b.addColorStop(1, '#070203');
        g.fillStyle = b;
        g.beginPath();
        g.ellipse(0, cy, rx, ry, 0, 0, 7);
        g.fill();
    }
    blob(u * 3.6, u * 3.4, u * 4.2, '#7a2418');
    blob(u * -1.3, u * 1.5, u * 2, '#6a2016');
    blob(u * -4.6, u * 2.2, u * 1.9, '#7a2418');
    // glowing seam on the abdomen and the two gem eyes
    g.strokeStyle = 'rgba(255,90,50,.7)';
    g.lineWidth = Math.max(.6, u * .5);
    g.beginPath();
    g.ellipse(0, u * 3.6, u * 2.6, u * 1.2, 0, Math.PI * 1.1, Math.PI * 1.9);
    g.stroke();
    g.fillStyle = '#ff7a30';
    [1, -1].forEach(function (d) { g.beginPath(); g.arc(d * u * 1.3, u * -5.2, Math.max(.7, u * .7), 0, 7); g.fill(); });
    g.restore();
}
function mapStar(g, x, y, r, col) {
    g.fillStyle = col;
    g.strokeStyle = 'rgba(20,10,4,.85)';
    g.lineWidth = 1;
    g.beginPath();
    for (var i = 0; i < 10; i++) {
        var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r;
        g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    g.closePath();
    g.stroke();
    g.fill();
}
