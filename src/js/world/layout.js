/* world/layout.js
   The map: main tunnel, side tunnels, ant-farm branches, pebbles, soil, screen size and the path helper at().
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

// changes only when the tunnels themselves move (new colony, new nest size, new screen width), not on a tab switch
function geoKey() { return Math.round(W * 10) + '|' + Math.round(LEN) + '|' + Math.round(PT[0][0] * 10) + '|' + (BP[0] ? Math.round(BP[0].LEN) : 0); }

// ---- world layout, paths and camera ----

function gen() {
    var r = rng(S.seed);
    MP = [[.15 + r() * .7, .05]];
    for (var i = 1; i < 8; i++)
        MP.push([.1 + r() * .8, .05 + .83 * i / 9 + (r() - .5) * .03]);
    MP.push([.3 + r() * .4, .88]);
    BRN = [];
    var YS = 3.6, segs = [], wsegs = [], ii;
    for (ii = 0; ii < MP.length - 1; ii++) {
        var sg = [MP[ii][0], MP[ii][1] * YS, MP[ii + 1][0], MP[ii + 1][1] * YS, ii];
        segs.push(sg);
        wsegs.push(sg);
    }
    function ccw(ax, ay, bx, by, qx, qy) { return (qy - ay) * (bx - ax) > (by - ay) * (qx - ax); }
    function crosses(a, b, c, d) { return ccw(a[0], a[1], c[0], c[1], d[0], d[1]) !== ccw(b[0], b[1], c[0], c[1], d[0], d[1]) && ccw(a[0], a[1], b[0], b[1], c[0], c[1]) !== ccw(a[0], a[1], b[0], b[1], d[0], d[1]); }
    function pseg(px, py, g) {
        var dx = g[2] - g[0], dy = g[3] - g[1], l2 = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((px - g[0]) * dx + (py - g[1]) * dy) / l2));
        return Math.hypot(px - g[0] - dx * t, py - g[1] - dy * t);
    }
    function clear(p0, p1, list, skipIdx) {
        var A = [p0[0], p0[1] * YS], B = [p1[0], p1[1] * YS];
        for (var u = 0; u < list.length; u++) {
            var g = list[u];
            if (skipIdx.indexOf(g[4]) >= 0 && g.length === 5)
                continue;
            if (crosses(A, B, [g[0], g[1]], [g[2], g[3]]))
                return false;
            if (pseg(B[0], B[1], g) < .055 || pseg(g[0], g[1], [A[0], A[1], B[0], B[1]]) < .055 || pseg(g[2], g[3], [A[0], A[1], B[0], B[1]]) < .055)
                return false;
        }
        return true;
    }
    for (var k = 0; k < 12; k++) {
        var q = rng(S.seed + k * 977 + 13), j = 1 + Math.floor(q() * 7), a = MP[j], pts = [a], dir = q() < .5 ? -1 : 1, x = a[0], y = a[1], m = 3 + Math.floor(q() * 3);
        for (i = 0; i < m; i++) {
            var okp = false, nx, ny, nd, att, first = null;
            for (att = 0; att < 6 && !okp; att++) {
                nd = dir;
                nx = x + nd * (.1 + q() * .14);
                ny = y + (q() - .3) * .1 * (att % 2 ? -1.6 : 1);
                if (nx < .05 || nx > .95) {
                    nd = -nd;
                    nx = Math.max(.05, Math.min(.95, nx));
                }
                ny = Math.max(.08, Math.min(.9, ny));
                if (!first)
                    first = [nx, ny, nd];
                okp = clear([x, y], [nx, ny], segs, i === 0 ? [j - 1, j] : []);
            }
            if (!okp) {
                if (i > 0)
                    break;
                nx = first[0];
                ny = first[1];
                nd = first[2];
            }
            dir = nd;
            x = nx;
            y = ny;
            pts.push([x, y]);
        }
        for (i = 1; i < pts.length; i++)
            segs.push([pts[i - 1][0], pts[i - 1][1] * YS, pts[i][0], pts[i][1] * YS, 100 + k, 1]);
        BRN.push(pts);
    }
    if (S.deepFirst)
        BRN.sort(function (a, b) { return b[0][1] - a[0][1]; });
    for (var w = 0; w < 8; w++) {
        var q2 = rng(S.seed + 9000 + w * 613), j2 = 2 + Math.floor(q2() * 5), a2 = MP[j2], p2 = [a2], d2 = w % 2 ? 1 : -1, lim = w < 4 ? 1 : 2, x2 = a2[0], y2 = a2[1], m2 = 5 + Math.floor(q2() * 3);
        for (var i2 = 0; i2 < m2; i2++) {
            var bx2, by2, ok2 = false, at2;
            for (at2 = 0; at2 < 6 && !ok2; at2++) {
                bx2 = x2 + d2 * (.28 + q2() * .22);
                by2 = Math.max(.1, Math.min(.9, y2 + (q2() - .45) * .09 * (at2 % 2 ? -1.8 : 1) + (at2 > 1 ? (at2 % 2 ? -.04 : .04) : 0)));
                ok2 = clear([x2, y2], [bx2, by2], wsegs, i2 === 0 ? [j2 - 1, j2] : []);
            }
            x2 = bx2;
            y2 = by2;
            var lx = d2 < 0 ? -lim + .06 : lim + .94;
            if (d2 < 0 ? x2 < lx : x2 > lx) {
                x2 = lx;
                p2.push([x2, y2]);
                break;
            }
            p2.push([x2, y2]);
        }
        for (var s2 = 1; s2 < p2.length; s2++)
            wsegs.push([p2[s2 - 1][0], p2[s2 - 1][1] * YS, p2[s2][0], p2[s2][1] * YS, 200 + w, 1]);
        BRN.push(p2);
    }
    /* Ant-farm network: dense, winding side tunnels that spread through the dirt as the colony grows.
       Every colony seed grows its own pattern: a mix of angular cracks (like sand-and-glass ant farms)
       and organic wandering tunnels, that loop back and join up. Purely visual. */
    FARM = [];
    var fall = segs.concat(wsegs), fsrc = [{ p: MP, r: -1 }], fi;
    BRN.forEach(function (b, bi) { fsrc.push({ p: b, r: bi }); });
    // every tunnel winds smoothly, never crosses another and keeps a little room from its neighbours;
    // now and then one joins another, so there are a few loops but no tangle (see netGrow)
    var fgrid = netGrid(.05);
    fall.forEach(function (g) { fgrid.add(g); });
    for (fi = 0; fi < 2000 && FARM.length < 160; fi++) {
        var fq = rng(S.seed + 31000 + fi * 331), pf = FARM.length > 5 && fq() < .6 ? FARM[Math.floor(fq() * FARM.length)] : null, sc = pf ? { p: pf.pts, r: pf.par } : fsrc[Math.floor(fq() * fsrc.length)],
            sgi = Math.floor(fq() * (sc.p.length - 1)), ft = .15 + .7 * fq(),
            fx0 = sc.p[sgi][0] + (sc.p[sgi + 1][0] - sc.p[sgi][0]) * ft, fy0 = sc.p[sgi][1] + (sc.p[sgi + 1][1] - sc.p[sgi][1]) * ft, ow = fx0 < .5 ? -1 : 1, side = fx0 >= 0 && fx0 <= 1;
        if (fy0 < .1 || fy0 > .86)
            continue;
        var sdx = sc.p[sgi + 1][0] - sc.p[sgi][0], sdy = (sc.p[sgi + 1][1] - sc.p[sgi][1]) * YS, pd = Math.atan2(sdy, sdx), sa;
        // off the main tunnel: straight out to one side (mostly the nearer edge); off a branch: a fork at 30-60
        // degrees that keeps going the same way
        if (!pf && sc.r < 0)
            sa = (fq() < .7 ? ow > 0 : fq() < .5) ? (fq() - .5) * .6 : Math.PI + (fq() - .5) * .6;
        else
            sa = pd + (fq() < .5 ? 1 : -1) * (.5 + fq() * .5);
        var fpts = netGrow(fgrid, fq, [fx0, fy0 * YS], sa, 3 + Math.floor(fq() * 4), {
            u0: .05, u1: .085, turn: .42, clr: .02, snap: .03, join: .28,
            x0: side ? .02 : -1.95, x1: side ? .98 : 2.95, y0: .08 * YS, y1: .86 * YS
        });
        if (!fpts)
            continue;
        FARM.push({ pts: fpts.p.map(function (p) { return [p[0], p[1] / YS]; }), par: sc.r, pi: pf ? FARM.indexOf(pf) : -1, ch: !fpts.joined && fq() < .4 });
    }
}

/* ---- growing tunnels that wind but never cross ----
   netGrid: segments [x0, y0, x1, y1, ...] bucketed into square cells of size cs, for quick neighbour checks. */
function netGrid(cs) {
    var m = {}, segs = [];
    function cells(x0, y0, x1, y1, fn) {
        for (var cx2 = Math.floor(Math.min(x0, x1) / cs); cx2 <= Math.floor(Math.max(x0, x1) / cs); cx2++)
            for (var cy2 = Math.floor(Math.min(y0, y1) / cs); cy2 <= Math.floor(Math.max(y0, y1) / cs); cy2++)
                fn(cx2 + ',' + cy2);
    }
    return {
        add: function (g) {
            var i = segs.length;
            segs.push(g);
            cells(g[0], g[1], g[2], g[3], function (k) { (m[k] = m[k] || []).push(i); });
        },
        near: function (x0, y0, x1, y1, pad) {
            var seen = {}, out = [];
            cells(Math.min(x0, x1) - pad, Math.min(y0, y1) - pad, Math.max(x0, x1) + pad, Math.max(y0, y1) + pad, function (k) {
                (m[k] || []).forEach(function (i) { if (!seen[i] && !segs[i].dead) { seen[i] = 1; out.push(segs[i]); } });
            });
            return out;
        }
    };
}
function netPS(px, py, g) {
    var dx = g[2] - g[0], dy = g[3] - g[1], l2 = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((px - g[0]) * dx + (py - g[1]) * dy) / l2)), x = g[0] + dx * t, y = g[1] + dy * t;
    return [x, y, Math.hypot(px - x, py - y)];
}
function netCross(a, b) {
    function o(ax, ay, bx, by, qx, qy) { var v = (by - ay) * (qx - bx) - (bx - ax) * (qy - by); return v > 1e-12 ? 1 : v < -1e-12 ? 2 : 0; }
    var o1 = o(a[0], a[1], a[2], a[3], b[0], b[1]), o2 = o(a[0], a[1], a[2], a[3], b[2], b[3]), o3 = o(b[0], b[1], b[2], b[3], a[0], a[1]), o4 = o(b[0], b[1], b[2], b[3], a[2], a[3]);
    return o1 && o2 && o3 && o4 && o1 !== o2 && o3 !== o4;
}
// distance between two segments that do not cross
function netSS(a, b) { return Math.min(netPS(a[0], a[1], b)[2], netPS(a[2], a[3], b)[2], netPS(b[0], b[1], a)[2], netPS(b[2], b[3], a)[2]); }
/* Grow one tunnel from start (on its parent) heading sa, up to n steps. Each step turns a little; a step that
   would cross or crowd another tunnel is tried again in another direction, or stops the tunnel. Close to another
   tunnel it may join it instead (o.join). Returns { p: points, joined } with a smoothed path, or null. */
function netGrow(grid, rnd, start, sa, n, o) {
    var pts = [start], x = start[0], y = start[1], th = sa, joined = false, st, at, mine = [];
    for (st = 0; st < n && !joined; st++) {
        var ok = false, nx, ny, seg;
        for (at = 0; at < 8 && !ok; at++) {
            var u = o.u0 + rnd() * (o.u1 - o.u0), t2 = th + (rnd() - .5) * o.turn * 2 * (1 + at * .35) + (o.down || 0);
            nx = x + Math.cos(t2) * u;
            ny = y + Math.sin(t2) * u;
            if (nx < o.x0 || nx > o.x1 || ny < o.y0 || ny > o.y1)
                continue;
            seg = [x, y, nx, ny];
            var near = grid.near(x, y, nx, ny, Math.max(o.clr, o.snap)), bad = false, best = null;
            for (var k = 0; k < near.length && !bad; k++) {
                var g = near[k];
                if (mine.indexOf(g) >= 0 && mine.indexOf(g) >= mine.length - 1)
                    continue;
                var d0 = netPS(x, y, g)[2];
                if (d0 < 1e-6) {
                    // the parent (or our own last step) touches where we start: only make sure we head away from it
                    if (netPS(nx, ny, g)[2] < o.clr * .8)
                        bad = true;
                    continue;
                }
                if (netCross(seg, g)) {
                    bad = true;
                    break;
                }
                var e = netPS(nx, ny, g);
                if (e[2] < o.snap && (!best || e[2] < best[2]))
                    best = e;
                if (netSS(seg, g) < o.clr)
                    bad = 'close';
            }
            if (best && st >= 1 && rnd() < o.join) {
                // join the nearby tunnel: end exactly on it, as long as that short step crosses nothing
                var js = [x, y, best[0], best[1]], clash = false;
                grid.near(x, y, best[0], best[1], 1e-3).forEach(function (g) { if (netPS(x, y, g)[2] > 1e-6 && netPS(best[0], best[1], g)[2] > 1e-6 && netCross(js, g)) clash = true; });
                if (!clash && Math.hypot(best[0] - x, best[1] - y) > o.u0 * .3) {
                    nx = best[0];
                    ny = best[1];
                    seg = js;
                    joined = true;
                    ok = true;
                    break;
                }
            }
            if (bad)
                continue;
            ok = true;
            th = Math.atan2(ny - y, nx - x);
        }
        if (!ok)
            break;
        grid.add(seg);
        mine.push(seg);
        x = nx;
        y = ny;
        pts.push([x, y]);
    }
    if (pts.length < 2)
        return null;
    // round the corners (one pass of corner cutting; the two ends stay put)
    if (pts.length > 2) {
        var sm = [pts[0]], i;
        for (i = 0; i < pts.length - 1; i++) {
            var p0 = pts[i], p1 = pts[i + 1];
            if (i > 0)
                sm.push([p0[0] * .75 + p1[0] * .25, p0[1] * .75 + p1[1] * .25]);
            if (i < pts.length - 2)
                sm.push([p0[0] * .25 + p1[0] * .75, p0[1] * .25 + p1[1] * .75]);
        }
        sm.push(pts[pts.length - 1]);
        // keep the sharper path if rounding it would cut across another tunnel
        var cuts = false;
        for (i = 1; i < sm.length && !cuts; i++) {
            var sg2 = [sm[i - 1][0], sm[i - 1][1], sm[i][0], sm[i][1]];
            grid.near(sg2[0], sg2[1], sg2[2], sg2[3], 1e-3).forEach(function (g) {
                if (mine.indexOf(g) < 0 && netPS(start[0], start[1], g)[2] > 1e-6 && netPS(x, y, g)[2] > 1e-6 && netCross(sg2, g))
                    cuts = true;
            });
        }
        if (!cuts) {
            // from now on other tunnels are checked against the rounded path, which is the one drawn
            mine.forEach(function (g) { g.dead = 1; });
            for (i = 1; i < sm.length; i++)
                grid.add([sm[i - 1][0], sm[i - 1][1], sm[i][0], sm[i][1]]);
            pts = sm;
        }
    }
    return { p: pts, joined: joined };
}

function mk(pts) { var P2 = pts.map(function (p) { return [p[0] * W, p[1] * WH]; }), C = [0], L = 0; for (var i = 1; i < P2.length; i++) {
    L += Math.hypot(P2[i][0] - P2[i - 1][0], P2[i][1] - P2[i - 1][1]);
    C.push(L);
} return { PT: P2, CUM: C, LEN: L }; }

// how tall the map is: as much of the screen as fits, between 400 and 640 pixels
function genPebs() {
    pebs = [];
    for (var k = 0, tot = 260 * (1 + (S.reach || 0) * 2) * WHX() / WH; k < tot; k++)
        pebs.push([wideL() + Math.random() * (wideR() - wideL()), 24 + Math.random() * (WHX() - 24), 1 + Math.random() * 2, Math.random()]);
}

function viewH() {
    var nv = document.querySelector('.nav'), nt = nv ? nv.getBoundingClientRect().top : document.documentElement.clientHeight - 100;
    if (document.body.classList.contains('tt'))
        return Math.max(340, Math.round(nt - 28));
    // the Nest tab is just the nest: the cavern runs from under the goal card down to the tab bar
    if (document.body.classList.contains('nt')) {
        var vt = $('view').getBoundingClientRect().top + (window.scrollY || 0);
        return Math.max(300, Math.round(nt - vt - 10));
    }
    return Math.max(400, Math.min(640, Math.round((document.documentElement.clientHeight - 300) / 20) * 20));
}

function sizeT() {
    layoutV++;
    var oW = W, oWH = WH;
    K = 1.1 * ZM[S.tier];
    dpr = rqDpr();
    var cw = cv.clientWidth || sizeT.cw || 320;
    if (cv.clientWidth)
        sizeT.cw = cv.clientWidth;
    W = cw / K;
    var ch = viewH();
    H = ch / K;
    WH = H * 2.6;
    cv.width = cw * dpr;
    cv.height = ch * dpr;
    cv.style.height = ch + 'px';
    gen();
    if (oW && oWH && (oW !== W || oWH !== WH))
        rescaleWorld(W / oW, WH / oWH);
    MAIN = mk(MP);
    PT = MAIN.PT;
    CUM = MAIN.CUM;
    LEN = MAIN.LEN;
    BP = BRN.map(mk);
    FARMP = FARM.map(function (f) {
        var lo = 9, hi = -9;
        f.pts.forEach(function (p) { lo = Math.min(lo, p[0]); hi = Math.max(hi, p[0]); });
        return { q: mk(f.pts), par: f.par, pi: f.pi, ch: f.ch, lo: lo, hi: hi };
    });
    QX = PT[8][0];
    QY = PT[8][1];
    genDeep();
    genPebs();
    var gk = geoKey();
    if (sizeT.gk && sizeT.gk !== gk)
        crewA.length = 0;
    sizeT.gk = gk;
    camT = tab === 'tun' ? (S.dug < 1 ? camClamp(at(1 - S.dug).y - H / 2) : -SK) : WH - H;
    cam = camT;
    uz = 1;
    camX = 0;
}

function at(p, q) {
    q = q || MAIN;
    p = Math.max(0, Math.min(1, p));
    var P2 = q.PT, C = q.CUM, d = p * q.LEN, i = 1;
    while (i < C.length - 1 && C[i] < d)
        i++;
    var a = P2[i - 1], b = P2[i], t = Math.max(0, Math.min(1, (d - C[i - 1]) / ((C[i] - C[i - 1]) || 1))), dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    return { x: a[0] + dx * t, y: a[1] + dy * t, nx: -dy / l, ny: dx / l, ang: Math.atan2(dy, dx) };
}

// deep layers: soil below the queen's cavern
function LH() { return Math.round(H * .7); }
function deepTop() { var c = cavFull(); return c.y + c.ry + 28; }
function WHX() { return S.deep ? deepTop() + S.deep * LH() : WH; }
var DLAY = [
    { n: 'Clay', a: '#2f1d10', b: '#3b2412', c: '#6e4426' },
    { n: 'Stone', a: '#2a2018', b: '#27231f', c: '#6a625a' },
    { n: 'Deep dark', a: '#1d1815', b: '#15151b', c: '#4d6a9a' },
    { n: 'Bedrock', a: '#1b1a1b', b: '#111113', c: '#c98a2f' }
];

function genDeep() {
    DEEP = [];
    DEEPP = [];
    var top = deepTop(), lh = LH(), c = cavFull(), r = rng(S.seed + 91000), L, i, segsD = [], byL = [[], [], [], []];
    function addSegs(pts) { for (var j = 1; j < pts.length; j++) segsD.push([pts[j - 1][0] * W, pts[j - 1][1] * WH, pts[j][0] * W, pts[j][1] * WH]); }
    var px = .5, py = c.y + c.ry - 8;
    for (L = 0; L < 4; L++) {
        var by = top + (L + 1) * lh - lh * .22, pts = [[px, py / WH]], n = 4;
        for (i = 1; i <= n; i++) {
            px = Math.max(.3, Math.min(.7, px + (r() - .5) * .3));
            pts.push([px, (py + (by - py) * i / n) / WH]);
        }
        py = by;
        DEEP.push({ pts: pts, L: L, pi: L ? L - 1 : -1, t: 1, ch: 2 });
        byL[L].push(DEEP.length - 1);
        addSegs(pts);
    }
    var dgrid = netGrid(30);
    segsD.forEach(function (g) { dgrid.add(g); });
    for (L = 0; L < 4; L++) {
        var yA = top + L * lh + 10, yB = top + (L + 1) * lh - 10, made = 0, fi;
        for (fi = 0; fi < 900 && made < 48; fi++) {
            var fq = rng(S.seed + 92000 + L * 7919 + fi * 331), srcI = byL[L][Math.floor(fq() * byL[L].length)], src = DEEP[srcI], sg = Math.floor(fq() * (src.pts.length - 1)), ft = .15 + .7 * fq(),
                fx = (src.pts[sg][0] + (src.pts[sg + 1][0] - src.pts[sg][0]) * ft) * W, fy = (src.pts[sg][1] + (src.pts[sg + 1][1] - src.pts[sg][1]) * ft) * WH;
            if (fy < yA || fy > yB)
                continue;
            // galleries leave their parent at right angles, lean out towards the nearer edge and slope gently down
            // off the shaft: a gallery heads straight out to one side; off a gallery: a fork at 30-60 degrees
            // that keeps going the same way, so the layer spreads wide instead of folding back on itself
            var pd = Math.atan2((src.pts[sg + 1][1] - src.pts[sg][1]) * WH, (src.pts[sg + 1][0] - src.pts[sg][0]) * W), sa;
            if (src.t)
                sa = (fq() < .5 ? 0 : Math.PI) + (fq() - .5) * .5;
            else
                sa = pd + (fq() < .5 ? 1 : -1) * (.5 + fq() * .5);
            var wide = made >= 32, dp = netGrow(dgrid, fq, [fx, fy], sa, 4 + Math.floor(fq() * 5), {
                u0: .07 * W, u1: .12 * W, turn: .38, clr: 9, snap: 13, join: .22, down: .06,
                x0: wide ? -1.95 * W : .04 * W, x1: wide ? 2.95 * W : .96 * W, y0: yA, y1: yB
            });
            if (!dp)
                continue;
            DEEP.push({ pts: dp.p.map(function (p) { return [p[0] / W, p[1] / WH]; }), L: L, pi: srcI, t: 0, ch: !dp.joined && fq() < .4 ? 1 : 0 });
            byL[L].push(DEEP.length - 1);
            made++;
        }
    }
    DEEPP = DEEP.map(function (f) {
        var lo = 9, hi = -9;
        f.pts.forEach(function (p) { lo = Math.min(lo, p[0]); hi = Math.max(hi, p[0]); });
        return { q: mk(f.pts), L: f.L, pi: f.pi, t: f.t, ch: f.ch, lo: lo, hi: hi };
    });
}

function tpath() {
    var k, i;
    var lo = 1 - S.dug, a = at(lo);
    cx.beginPath();
    if (S.dug >= 1) {
        cx.moveTo(PT[0][0], PT[0][1]);
        cx.lineTo(PT[0][0], 23);
    }
    cx.moveTo(a.x, a.y);
    var lx = a.x, ly = a.y;
    for (i = 1; i < PT.length; i++)
        if (CUM[i] > lo * LEN) {
            vto(lx, ly, PT[i][0], PT[i][1]);
            lx = PT[i][0];
            ly = PT[i][1];
        }
    for (k = 0; k < S.sideTunnels && k < BP.length; k++) {
        var q = BP[k], pr = S.sideDug[k] == null ? 1 : S.sideDug[k], d = pr * q.LEN;
        cx.moveTo(q.PT[0][0], q.PT[0][1]);
        lx = q.PT[0][0];
        ly = q.PT[0][1];
        for (i = 1; i < q.PT.length; i++)
            if (q.CUM[i] < d) {
                vto(lx, ly, q.PT[i][0], q.PT[i][1]);
                lx = q.PT[i][0];
                ly = q.PT[i][1];
            }
        var e = at(pr, q);
        vto(lx, ly, e.x, e.y);
    }
}

function branches(dt) {
    if (dead || !BP.length)
        return;
    if (S.dug >= .3) {
        var k = S.sideTunnels, cap = Math.min(12, 3 + S.tier * 2) + 4 * (S.reach || 0), openB = 0, j;
        for (j = 0; j < S.sideTunnels; j++)
            if (S.sideDug[j] < 1)
                openB++;
        nbt -= dt;
        if (k < cap && S.workers > 0 && nbt <= 0 && openB < Math.min(3, 1 + Math.floor(S.workers / 6)) && (openB === 0 || crewFree() > 0) && brDug(k)) {
            S.sideDug[k] = 0;
            S.sideTunnels = k + 1;
            nbt = 6;
        }
    }
    if (tab === 'tun' && foes.length && performance.now() > follow) {
        var a = at(foes[0].p);
        camT = camClamp(a.y - H / 2 / uz);
        camX = camXc(a.x - W / (2 * uz));
    }
}

function juncP(k) { if (jpc.K !== K) {
    jpc = [];
    jpc.K = K;
} if (jpc[k] != null)
    return jpc[k]; var b = BP[k]; if (!b)
    return .5; var p = b.PT[0]; for (var i = 0; i < PT.length; i++)
    if (PT[i][0] === p[0] && PT[i][1] === p[1])
        return jpc[k] = CUM[i] / LEN; return .5; }

function juncP2(i) { return CUM[CI[i]] / LEN; }

function brDug(k) { var b = BP[k]; if (!b || S.dug >= 1)
    return true; var p = b.PT[0], i; for (i = 0; i < PT.length; i++)
    if (PT[i][0] === p[0] && PT[i][1] === p[1])
        return CUM[i] / LEN >= 1 - S.dug + .02; return false; }

function rescaleWorld(sx, sy) {
    marchers.forEach(function (m) {
        if (m.px != null) {
            m.px *= sx;
            m.py *= sy;
        }
        if (m.kp) {
            m.kp.tx *= sx;
            m.kp.ty *= sy;
        }
    });
    spoil.forEach(function (p) { p.x *= sx; p.y *= sy; });
    carc.forEach(function (c) { c.x *= sx; c.y *= sy; });
    if (worm) {
        worm.x *= sx;
        worm.y *= sy;
    }
    if (RAID)
        RAID.x *= sx;
}

function tunW() { return 6 + S.tier * .8; }

/* ======================================================================
   21. THE UNDERGROUND: SOIL, WATER, RARE FINDS AND NEIGHBOURS
   Every colony has its own seed, so the layers, springs, buried finds and
   neighbours are in different places each time. They are worked out from the
   seed, so nothing needs saving except which finds were already uncovered.
   ====================================================================== */

var SOILN = ['Loamy soil', 'Heavy clay', 'Loose sand', 'Hard rock'], SOILM = [1, .8, 1.2, .65];
var SOILC = ['', 'rgba(160,72,40,.26)', 'rgba(226,196,120,.22)', 'rgba(120,128,140,.3)'];
var FINDN = { fossil: 'an ancient fossil', amber: 'a lump of amber', seeds: 'a buried seed cache', spores: 'rare fungus spores', old: 'an abandoned tunnel' };
var FEAT = null;

function feat() {
    if (FEAT && FEAT.sd === S.seed)
        return FEAT;
    var r = rng((S.seed ^ 0x9e3779b9) >>> 0), i, n = 5, rocks = 0, f = { sd: S.seed, bands: [], springs: [], finds: [], sx: [], sy: [] };
    for (i = 0; i < n; i++) {
        var t = i === n - 1 ? 0 : [0, 1, 2, 3, 1, 2][Math.floor(r() * 6)];
        if (t === 3 && ++rocks > 1)
            t = 1;
        var sp = [];
        for (var j = 0; j < 14; j++)
            sp.push([r(), r()]);
        f.bands.push({ t: t, ph: r() * 6, sp: sp });
    }
    var ns = 2 + (r() < .5 ? 1 : 0);
    for (i = 0; i < ns; i++)
        f.springs.push({ fx: .1 + .8 * r(), fy: .2 + .7 * r() });
    ['fossil', 'amber', 'seeds', 'spores', 'old'].forEach(function (k) { f.finds.push({ id: k, fx: .08 + .84 * r(), fy: .15 + .75 * r() }); });
    f.nb = { fx: .12 + .76 * r(), fy: .35 + .45 * r(), kind: r() < .5 ? 'termites' : 'aphids' };
    for (i = 0; i < 8; i++) {
        f.sx.push(1 + r() * .28);
        f.sy.push(1 + r() * .22);
    }
    var fr = rng((S.seed ^ 0x51ed270b) >>> 0), FT = ['geode', 'roots', 'bones', 'honey'];
    f.far = [];
    for (i = 0; i < 8; i++)
        f.far.push({ w: i, t: i % 3 === 1 ? 'spring' : FT[Math.floor(fr() * 4)], pf: .35 + .5 * fr(), sd: fr() < .5 ? -1 : 1 });
    FEAT = f;
    return f;
}

function wy(fy) { return 40 + fy * (WH - 70); }

function soilAt(y) { var f = feat(), q = Math.max(0, Math.min(.999, (y - 30) / Math.max(1, WH - 50))); return f.bands[Math.floor(q * f.bands.length)].t; }

function soilMul(y) { return S.tier < 2 ? 1 : SOILM[soilAt(y)]; }

function frontY() { return S.dug >= 1 ? 24 : at(1 - S.dug).y; }

function springCount() { var fy = frontY(), n = 0; feat().far.forEach(function (ff) { if (ff.t === 'spring' && S.rare['far' + ff.w]) n++; }); feat().springs.forEach(function (sp) { if (fy <= wy(sp.fy) && S.dug > .02) n++; }); return n; }

var lastSoil = -1, tradeT = 90, featInit = false;
var FARN = { geode: 'a glittering geode', roots: 'a tangle of nutritious roots', bones: 'ancient bones', honey: 'a hidden honey store', spring: 'an underground spring' };
