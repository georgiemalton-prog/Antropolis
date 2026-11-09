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
        for (var i = 0; i < m; i++) {
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
    var fall = segs.concat(wsegs), fsrc = [{ p: MP, r: -1 }], fi, amix = .25 + rng(S.seed + 777)() * .65;
    BRN.forEach(function (b, bi) { fsrc.push({ p: b, r: bi }); });
    function nearP(px, py, g) {
        var dx = g[2] - g[0], dy = g[3] - g[1], l2 = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((px - g[0]) * dx + (py - g[1]) * dy) / l2)), x = g[0] + dx * t, y = g[1] + dy * t;
        return [x, y, Math.hypot(px - x, py - y)];
    }
    for (fi = 0; fi < 520 && FARM.length < 160; fi++) {
        var fq = rng(S.seed + 31000 + fi * 331), pf = FARM.length > 5 && fq() < .6 ? FARM[Math.floor(fq() * FARM.length)] : null, sc = pf ? { p: pf.pts, r: pf.par } : fsrc[Math.floor(fq() * fsrc.length)],
            sgi = Math.floor(fq() * (sc.p.length - 1)), ft = .15 + .7 * fq(),
            fx0 = sc.p[sgi][0] + (sc.p[sgi + 1][0] - sc.p[sgi][0]) * ft, fy0 = sc.p[sgi][1] + (sc.p[sgi + 1][1] - sc.p[sgi][1]) * ft, ow = fx0 < .5 ? -1 : 1,
            ang = fq() < amix, vert = fq() < .45, th = Math.PI / 2 + (fq() - .5) * 2.4 + (fq() < .5 ? -Math.PI / 2 * (fq() < .75 ? ow : -ow) : 0),
            fm = 3 + Math.floor(fq() * 5), fpts = [[fx0, fy0]], fx = fx0, fy = fy0, fst, fat, fnx, fny, snapped = false;
        if (fy0 < .1 || fy0 > .86)
            continue;
        for (fst = 0; fst < fm && !snapped; fst++) {
            var got = false;
            for (fat = 0; fat < 6 && !got; fat++) {
                var u = .05 + fq() * (ang ? .1 : .06), ddx, ddy;
                if (ang) {
                    if (fst > 0 && fq() < .75)
                        vert = !vert;
                    var sg2 = vert ? (fq() < .72 ? 1 : -1) : (fq() < .72 ? ow : -ow);
                    ddx = vert ? (fq() - .5) * u * .5 : sg2 * u;
                    ddy = vert ? sg2 * u : (fq() - .5) * u * .4;
                }
                else {
                    th += (fq() - .5) * 1.3;
                    ddx = Math.cos(th) * u;
                    ddy = Math.sin(th) * u;
                }
                fnx = fx0 >= 0 && fx0 <= 1 ? Math.max(.02, Math.min(.98, fx + ddx)) : Math.max(-1.95, Math.min(2.95, fx + ddx));
                fny = Math.max(.08, Math.min(.86, fy + ddy / YS));
                if (Math.hypot(fnx - fx, (fny - fy) * YS) < .025)
                    continue;
                got = true;
                var best = null, gu;
                for (gu = 0; gu < fall.length; gu++) {
                    var gg = fall[gu], pa = pseg(fx, fy * YS, gg);
                    if (pa < .012)
                        continue;
                    var np = nearP(fnx, fny * YS, gg);
                    if (np[2] < (fst === 0 ? .03 : .045) && (!best || np[2] < best[2]))
                        best = np;
                }
                if (best) {
                    if (fst === 0)
                        got = false;
                    else {
                        fnx = best[0];
                        fny = best[1] / YS;
                        snapped = true;
                    }
                }
            }
            if (!got)
                break;
            fx = fnx;
            fy = fny;
            fpts.push([fx, fy]);
        }
        if (fpts.length < 2)
            continue;
        for (var fs = 1; fs < fpts.length; fs++)
            fall.push([fpts[fs - 1][0], fpts[fs - 1][1] * YS, fpts[fs][0], fpts[fs][1] * YS, 300 + fi, 1]);
        FARM.push({ pts: fpts, par: sc.r, pi: pf ? FARM.indexOf(pf) : -1, ch: !snapped && fq() < .4 });
    }
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
    if (document.body.classList.contains('tt')) {
        var nv = document.querySelector('.nav'), nt = nv ? nv.getBoundingClientRect().top : document.documentElement.clientHeight - 100;
        return Math.max(340, Math.round(nt - 28));
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
    var top = deepTop(), lh = LH(), c = cavFull(), r = rng(S.seed + 91000), L, i, k, trunk = [], amix = .25 + rng(S.seed + 778)() * .65, segsD = [], byL = [[], [], [], []];
    function addSegs(pts) { for (var j = 1; j < pts.length; j++) segsD.push([pts[j - 1][0] * W, pts[j - 1][1] * WH, pts[j][0] * W, pts[j][1] * WH]); }
    function dseg(px, py, g) {
        var dx = g[2] - g[0], dy = g[3] - g[1], l2 = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((px - g[0]) * dx + (py - g[1]) * dy) / l2)), x = g[0] + dx * t, y = g[1] + dy * t;
        return [x, y, Math.hypot(px - x, py - y)];
    }
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
    for (L = 0; L < 4; L++) {
        var yA = top + L * lh + 10, yB = top + (L + 1) * lh - 10, made = 0, fi;
        for (fi = 0; fi < 700 && made < 48; fi++) {
            var fq = rng(S.seed + 92000 + L * 7919 + fi * 331), srcI = byL[L][Math.floor(fq() * byL[L].length)], src = DEEP[srcI], sg = Math.floor(fq() * (src.pts.length - 1)), ft = .15 + .7 * fq(),
                fx = (src.pts[sg][0] + (src.pts[sg + 1][0] - src.pts[sg][0]) * ft) * W, fy = (src.pts[sg][1] + (src.pts[sg + 1][1] - src.pts[sg][1]) * ft) * WH,
                ow = fx < W / 2 ? -1 : 1, ang = fq() < amix, vert = fq() < .42, th = (fq() - .5) * 6.28, fm = 5 + Math.floor(fq() * 7), fpts = [[fx / W, fy / WH]], snapped = false, st, at, got, nx, ny;
            if (fy < yA || fy > yB)
                continue;
            // wandering tunnels set off towards the nearer edge so the sides of the deep layers fill in too
            th = Math.atan2(Math.sin(th), Math.abs(Math.cos(th)) * ow);
            for (st = 0; st < fm && !snapped; st++) {
                got = false;
                for (at = 0; at < 6 && !got; at++) {
                    var u = (.06 + fq() * (ang ? .11 : .08)) * W, ddx, ddy;
                    if (ang) {
                        if (st > 0 && fq() < .75)
                            vert = !vert;
                        var sg2 = vert ? (fq() < .5 ? 1 : -1) : (fq() < .68 ? ow : -ow);
                        ddx = vert ? (fq() - .5) * u * .5 : sg2 * u;
                        ddy = vert ? sg2 * u : (fq() - .5) * u * .4;
                    }
                    else {
                        th += (fq() - .5) * 1.3;
                        ddx = Math.cos(th) * u;
                        ddy = Math.sin(th) * u;
                    }
                    nx = made < 32 ? Math.max(.04 * W, Math.min(.96 * W, fx + ddx)) : Math.max(-1.95 * W, Math.min(2.95 * W, fx + ddx));
                    ny = Math.max(yA, Math.min(yB, fy + ddy));
                    if (Math.hypot(nx - fx, ny - fy) < 8)
                        continue;
                    got = true;
                    var best = null, gu;
                    for (gu = 0; gu < segsD.length; gu++) {
                        var gg = segsD[gu];
                        if (dseg(fx, fy, gg)[2] < 4)
                            continue;
                        var np = dseg(nx, ny, gg);
                        if (np[2] < (st === 0 ? 10 : 15) && (!best || np[2] < best[2]))
                            best = np;
                    }
                    if (best) {
                        if (st === 0)
                            got = false;
                        else {
                            nx = best[0];
                            ny = best[1];
                            snapped = true;
                        }
                    }
                }
                if (!got)
                    break;
                fx = nx;
                fy = ny;
                fpts.push([fx / W, fy / WH]);
            }
            if (fpts.length < 2)
                continue;
            addSegs(fpts);
            DEEP.push({ pts: fpts, L: L, pi: srcI, t: 0, ch: !snapped && fq() < .4 ? 1 : 0 });
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
