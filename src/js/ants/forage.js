/* ants/forage.js
   Foragers: food spots, surface and side-store trips, harvesting.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

function addSpotAt(p, quiet) {
    var sp = { p: p, stock: 3, cap: 6 + 2 * S.tier, rg: .05 * (1 + .5 * S.tier), side: Math.random() < .5 ? 1 : -1, ty: Math.floor(Math.random() * 3) };
    S.foodSpots.push(sp);
    if (!quiet) {
        var a = at(p);
        toast(S.foodSpots.length === 1 ? 'Your workers found a food spot! Foragers will harvest it, and it slowly grows back.' : 'Your workers found another food spot.');
        SFX.buy();
        for (var i = 0; i < 8; i++)
            fx.push({ x: a.x, y: a.y - 4, vx: (Math.random() - .5) * 40, vy: -10 - Math.random() * 20, l: .8, t: '\u2726', f: 10, c: '#9bffc8', g: 20 });
    }
    return sp;
}

// Side-chamber food stores. A side trip is shorter or longer than a surface trip, so each load is scaled
// to give the same food per second of walking as a surface leaf; that keeps the colony's income where it was.
var SIDE_W = 1, SIDE_K = .4;
// rough round-trip time: main-tunnel walking goes at about .027 of the tunnel per second, side and surface walks at about 34 px/s
function tripT(pMain, offL) { return 2 * pMain / .027 + 2 * offL / 34 + .9; }
function surfL() { var e0 = PT[0][0], d = Math.abs(PT[0][1] - 23), j, a = 0; for (j = 0; j < 8; j++) a += Math.abs(surfaceSpot(j) - e0); return d + a / 8; }
function sideYield(k) { var b = BP[k]; if (!b) return 1.52; return SIDE_K * 1.52 * Math.max(.25, Math.min(1.6, tripT(1 - juncP(k), b.LEN) / tripT(1, surfL()))); }

function spotMax() { return Math.min(10, 3 + S.tier * 2); }

function spotsTick(dt) { S.foodSpots.forEach(function (s) { s.stock = Math.min(s.cap, s.stock + s.rg * dt); }); }

// until the first tunnel is dug far enough to move about in, everyone stays in the nest
// (4%: about when workers find the first food spot, so foragers can start on it straight away)
function tunOK() { return S.dug >= TUNING.start.tunnelOpen; }

function pickTarget(m) {
    if (!tunOK())
        return null;
    var c = [], w = 0, i, s, r;
    for (i = 0; i < S.foodSpots.length; i++) {
        s = S.foodSpots[i];
        if (s.stock >= 1 && s.p >= 1 - S.dug - .001) {
            var fw = 1 + s.stock / 2, fm = S.orders.fg;
            if (fm === 1)
                fw = .3 + s.p * 5;
            else if (fm === 2)
                fw = .2 + s.stock * s.stock / 2;
            else if (fm === 3)
                fw = (s.lair > 0 ? .1 : 1) * (1 + s.stock / 2);
            c.push({ i: i, p: s.p, w: fw });
            w += fw;
        }
    }
    if (S.dug >= 1) {
        var sw = S.orders.fg === 3 ? 1 : S.orders.fg === 1 ? 1.5 : 4;
        c.push({ i: -1, p: 0, w: sw });
        w += sw;
    }
    // side chambers (Anthill stage on): every finished side tunnel ends in a food store, which spreads foragers across the whole nest
    if (S.tier >= 3)
    for (i = 0; i < S.sideTunnels && i < BP.length; i++)
        if (S.sideDug[i] >= 1 && juncP(i) >= 1 - S.dug) {
            c.push({ i: -2 - i, p: juncP(i), w: SIDE_W });
            w += SIDE_W;
        }
    if (!c.length)
        return null;
    r = Math.random() * w;
    for (i = 0; i < c.length; i++) {
        r -= c[i].w;
        if (r <= 0) {
            m.si = c[i].i;
            return c[i].p;
        }
    }
    m.si = c[0].i;
    return c[0].p;
}

function harvest(m) {
    var s = m.si >= 0 ? S.foodSpots[m.si] : null;
    if (s && s.stock >= 1) {
        s.stock -= 1;
        m.cg = 1;
    }
    else if (m.si < 0 && S.dug >= 1)
        m.cg = 1;
    else
        m.cg = 0;
}
function forageStep(m, dt, sp) {
    if (m.gt > 0)
        return;
    if (m.pk > 0) {
        m.pk -= dt;
        if (Math.random() < dt * 3 && m.si >= 0 && S.foodSpots[m.si]) {
            var qa = at(m.p), sd0 = S.foodSpots[m.si].side;
            fx.push({ x: qa.x + qa.nx * sd0 * 3, y: qa.y + qa.ny * sd0 * 3, vx: (Math.random() - .5) * 14, vy: -6 - Math.random() * 8, l: .4, c: '#cfe8a0', s: 1.6, g: 30 });
        }
        return;
    }
    if (m.sf && m.sf.lv !== geoKey()) {
        // the nest was redrawn (new size or layout) while this forager was out: its old path no longer matches, so it heads home
        m.p = m.sf.rp || 0;
        m.sf = null;
        m.home = 1;
    }
    if (m.sf) {
        var sf = m.sf, V2 = 34 * (m.v || 1) * dt;
        if (sf.pk > 0) {
            sf.pk -= dt;
            if (sf.pk <= 0) {
                m.cg = 1;
                sf.back = 1;
            }
        }
        else if (!sf.back) {
            sf.d = Math.min(sf.L, sf.d + V2);
            if (sf.d >= sf.L)
                sf.pk = .9;
        }
        else {
            sf.d = Math.max(0, sf.d - V2);
            if (sf.d <= 0) {
                m.p = m.sf.rp || 0;
                m.sf = null;
                m.home = 1;
            }
        }
        return;
    }
    var v = m.v * sp * .45 * (m.pan > 0 ? 2.4 : 1);
    if (m.pan > 0) {
        m.pan -= dt;
        if (!m.home && m.wait <= 0 && m.tp != null)
            m.home = 1;
    }
    if (m.wait > 0) {
        m.wait -= dt;
        var qp = Math.max(1 - .004 - ((m.fi || 0) % 14) * .004, 1 - S.dug * .9);
        m.p += (qp - m.p) * Math.min(1, dt * 3);
        m.d = -1;
        m.cg = 0;
        m.ph += dt * 2;
        return;
    }
    if (m.tp == null) {
        m.tp = pickTarget(m);
        m.home = 0;
        if (m.tp == null) {
            m.wait = 2 + Math.random() * 3;
            return;
        }
    }
    if (!m.home) {
        var dir = m.tp < m.p ? -1 : 1;
        m.d = dir;
        m.p += dir * v * dt;
        if ((dir === -1 && m.p <= m.tp) || (dir === 1 && m.p >= m.tp)) {
            m.p = m.tp;
            if (m.si <= -2 && BP[-2 - m.si]) {
                var sk = -2 - m.si, srt = [brSeg(BP[sk], 0, 1)];
                m.sf = { rt: srt, L: srt[0].n, d: 0, pk: 0, back: 0, rp: m.p, side: 1, lv: geoKey() };
                m.cg = 0;
                return;
            }
            if (m.si < 0 && S.dug >= 1) {
                var a0 = at(0), e0 = PT[0][0], gx = surfaceSpot(Math.floor(Math.random() * 8)), rt = [lnSeg(a0.x, a0.y, e0, 23), lnSeg(e0, 23, gx, 22)];
                m.sf = { rt: rt, L: rt[0].n + rt[1].n, d: 0, pk: 0, back: 0, lv: geoKey() };
                m.cg = 0;
                return;
            }
            m.home = 1;
            harvest(m);
            if (m.si >= 0)
                m.pk = .7;
        }
    }
    else {
        m.d = 1;
        m.p += v * dt;
        if (m.p >= 1) {
            m.p = 1;
            if (m.cg) {
                var y = deposit(m);
                m.cg = 0;
                fx.push({ x: QX - 20 + (Math.random() * 16 - 8), y: QY - 20, vx: 0, vy: -16, l: .9, t: '+' + (y < 10 ? y.toFixed(1) : Math.round(y)), f: 11, c: '#9be07a', g: 0 });
                m.wait = .8;
            }
            m.tp = null;
            m.home = 0;
        }
    }
    m.ph += dt * 8 * m.v;
}

function surfaceSpot(j) { var e0 = PT[0][0], mr = 28 + S.tier * 8, sd = j % 2 ? 1 : -1; return Math.max(8, Math.min(W - 8, e0 + sd * (mr + 8 + Math.floor(j / 2) * 12))); }

// keeps foragers in the same lane at least 5 px apart, so busy tunnels form neat queues.
// Runs every frame: every other frame made queued ants shuffle forward and back.
function queueForagers() {
    var G = {}, gap = 5 / LEN;
    marchers.forEach(function (m) { if (m.k !== 1 || m.inj || m.wait > 0 || m.tp == null || m.gt > 0 || m.sf)
        return; var key = (m.d > 0 ? 'h' : 'o') + (m.l > .33 ? 2 : m.l < -.33 ? 0 : 1); (G[key] || (G[key] = [])).push(m); });
    Object.keys(G).forEach(function (key) {
        var L = G[key], home = key[0] === 'h';
        L.sort(function (a, b) { return home ? b.p - a.p : a.p - b.p; });
        for (var n = 1; n < L.length; n++) {
            if (home && L[n].p > L[n - 1].p - gap)
                L[n].p = L[n - 1].p - gap;
            if (!home && L[n].p < L[n - 1].p + gap && L[n].p < 1)
                L[n].p = Math.min(1, L[n - 1].p + gap);
        }
    });
}
