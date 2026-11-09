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
        g.fillStyle = 'rgba(150,108,66,.35)';
        g.fill();
        g.strokeStyle = 'rgba(255,220,160,.45)';
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
        g.fillStyle = '#e8b04a';
        g.beginPath();
        g.arc(X(QX), Y(QY), Math.max(4, 9 * sc), 0, 7);
        g.fill();
        g.strokeStyle = '#fff3c4';
        g.lineWidth = 1.5;
        g.stroke();
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
        g.fillStyle = col;
        g.beginPath();
        g.arc(X(x), Y(y), r || R, 0, 7);
        g.fill();
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
        var a = at(Math.min(1, f.p));
        g.fillStyle = '#ff3b2b';
        g.strokeStyle = '#fff';
        g.lineWidth = 1;
        g.beginPath();
        g.arc(X(a.x), Y(a.y), R * (f.boss ? 3 : 1.8), 0, 7);
        g.fill();
        g.stroke();
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
    function dot2(x, y, col) { g.fillStyle = col; g.beginPath(); g.arc(x, y, 3.5, 0, 7); g.fill(); }
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
