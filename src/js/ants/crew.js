/* ants/crew.js
   Workers: digging the main tunnel, side tunnels and the nest wall, carrying spoil, exploring.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

// ---- digging: workers, crews and explorers ----

function digCap() { return S.dug >= 1 || (S.tier >= 2 && popn() >= 40) ? 1 : .8; }

function digNest() { var n = T[S.tier + 1]; if (!n || popn() < TP[S.tier + 1] || S.food < TF[S.tier + 1])
    return; S.food -= TF[S.tier + 1]; S.tier++; SFX.tier(); toast('Your nest is now a ' + n.n + '. Room for ' + capN() + ' ants.'); }

function dig() { var t = S.tier; digNest(); if (S.tier > t) {
    sizeT();
    cv.classList.remove('zin');
    void cv.offsetWidth;
    cv.classList.add('zin');
    flash = 1;
    pulseRing();
    pulseRing('255,255,255');
    burst(QX, QY, 70, ['#ffd35a', '#fff', '#7fcf8f'], 190);
    shake = .6;
    fx.push({ x: QX, y: QY - 70, vx: 0, vy: -12, l: 2.2, t: T[S.tier].n + '!', f: 28, c: '#ffe9a8', g: 0 });
} }

function sg(n, f) { return { n: Math.max(1, n), f: f }; }

function mainSeg(p0, p1) { return sg(Math.abs(p1 - p0) * LEN, function (u) { var q = at(p0 + (p1 - p0) * u); return { x: q.x, y: q.y, ang: q.ang + (p1 > p0 ? 0 : Math.PI), nx: q.nx, ny: q.ny }; }); }

function brSeg(b, s0, s1) { return sg(Math.abs(s1 - s0) * b.LEN, function (u) { var q = at(s0 + (s1 - s0) * u, b); return { x: q.x, y: q.y, ang: q.ang + (s1 > s0 ? 0 : Math.PI), nx: q.nx, ny: q.ny }; }); }

function lnSeg(x0, y0, x1, y1) { var a = Math.atan2(y1 - y0, x1 - x0); return sg(Math.hypot(x1 - x0, y1 - y0), function (u) { return { x: x0 + (x1 - x0) * u, y: y0 + (y1 - y0) * u, ang: a, nx: -Math.sin(a), ny: Math.cos(a) }; }); }

function routeAt(rt, d) { var i = 0; while (i < rt.length - 1 && d > rt[i].n) {
    d -= rt[i].n;
    i++;
} return rt[i].f(Math.max(0, Math.min(1, d / rt[i].n))); }

function breakthrough() {
    toast('You reached the surface! Foragers can now gather leaves. Expect visitors.');
    SFX.win();
    flash = .8;
    shake = .5;
    nf = performance.now() + 150000;
}

function crewSites(now) {
    var s = [], D = 60;
    function cl(f) { return function (i) { var c = Math.cos(f.ang), sn = Math.sin(f.ang), l = (i % 3 - 1) * 3.4, bk = 2 + Math.floor(i / 3) * 3.6; return { x: f.x - c * bk - sn * l, y: f.y - sn * bk + c * l, ang: f.ang }; }; }
    function mk2(kind, f, rt, adv, home, w) { var L = 0; rt.forEach(function (g) { L += g.n; }); return { kind: kind, f: f, fa: cl(f), rt: rt, L: L, adv: adv, home: home, w: w || 1 }; }
    if (S.dug < digCap()) {
        var a = at(1 - S.dug), mL = Math.min(D, S.dug * LEN), rt = [], sd = QX < W * .5 ? 1 : -1, ex = QX + sd * (D - mL) * .9, ey = QY + (D - mL) * .45;
        if (mL > 1)
            rt.push(mainSeg(1 - S.dug, 1 - S.dug + mL / LEN));
        if (mL < D)
            rt.push(lnSeg(QX, QY, ex, ey));
        s.push(mk2('main', { x: a.x, y: a.y, ang: a.ang + Math.PI }, rt, function (len) { var before = S.dug; S.dug = Math.min(digCap(), S.dug + len / LEN); if (before < 1 && S.dug >= 1)
            breakthrough(); }, mL < D ? { c: [ex, ey] } : { m: 1 - S.dug + mL / LEN }, 2));
    }
    for (var k = 0; k < S.sideTunnels; k++)
        if (BP[k] && S.sideDug[k] < 1)
            (function (k) {
                var pr = S.sideDug[k], b = BP[k], a2 = at(pr, b), bl = Math.max(2, Math.min(D, pr * b.LEN)), sEnd = Math.max(0, pr - bl / b.LEN);
                s.push(mk2('b' + k, { x: a2.x, y: a2.y, ang: a2.ang }, [brSeg(b, pr, sEnd)], function (len) { S.sideDug[k] = Math.min(1, S.sideDug[k] + len * (k === 0 ? TUNING.start.firstSide : 1) / b.LEN); if (S.sideDug[k] >= 1) {
                    toast('Your workers finished digging a new side tunnel.');
                    SFX.buy();
                    nbt = 4;
                } }, { b: k, s: sEnd }));
            })(k);
    if (CAVG.dig) {
        var cf = cavFace(), cpx = cf.x - Math.cos(cf.ang) * 34, cpy = cf.y - Math.sin(cf.ang) * 34;
        // each bit of wall chewed away widens the nest a little; a pair of diggers keeps roughly the old pace
        s.push(mk2('cav', { x: cf.x, y: cf.y, ang: cf.ang }, [lnSeg(cf.x, cf.y, cpx, cpy)], function (len) { CAVG.v = Math.min(S.cavG, CAVG.v + len * .0011); }, { c: [cf.x, cf.y] }, 1));
    }
    if (exc) {
        var jp = PT[CI[exc.i]], x0 = jp[0] + (exc.i % 2 ? -34 : 34), y0 = jp[1], ec = Math.min(1, exc.t / exc.dur);
        var st = mk2('chamber', { x: x0, y: y0, ang: 0 }, [lnSeg(x0, y0, jp[0], jp[1])], null, { m: CUM[CI[exc.i]] / LEN }, 1);
        st.fa = function (i) { var th = i * 6.283 / 8; return { x: x0 + Math.cos(th) * 24 * ec * .85, y: y0 + Math.sin(th) * 14 * ec * .85, ang: th }; };
        s.push(st);
    }
    return s;
}

function addSpoil(s, a, i) {
    var q = routeAt(s.rt, s.L), side = i % 2 ? 1 : -1, off = tunW() / 2 + 3.5, x = q.x + q.nx * side * off, y = q.y + q.ny * side * off, p = null, j;
    for (j = 0; j < spoil.length; j++)
        if (Math.hypot(spoil[j].x - x, spoil[j].y - y) < 9) {
            p = spoil[j];
            break;
        }
    if (!p) {
        p = { x: x, y: y, n: 0, tg: s.home, side: side };
        spoil.push(p);
        if (spoil.length > 14)
            spoil.shift();
    }
    p.n = Math.min(p.n + a.carry, 18);
    S.soil = (S.soil || 0) + a.carry * 2;
    for (j = 0; j < 4; j++)
        fx.push({ x: x, y: y - 2, vx: (Math.random() - .5) * 28, vy: -8 - Math.random() * 12, l: .45, c: '#a67c52', s: 2, g: 50 });
}

function crewFree() { var n = 0; crewA.forEach(function (a) { if (!a.kind)
    n++; }); return n; }

function tendHome() {
    if (S.dug >= 1) {
        var e0 = PT[0][0], mr = 28 + S.tier * 8, hh = mr * .5 + S.tier * 2 + (S.hillGrowth || 0), sd = QX < W * .5 ? -1 : 1;
        return { x: e0 + sd * mr * .5, y: 24 - hh * .86, surf: 1 };
    }
    var sdw = QX < W * .5 ? -1 : 1, x = Math.max(30, Math.min(W - 30, QX + sdw * (80 + S.tier * 4))), y = QY + 40, c = cav(), ex = (x - c.x) / (c.rx - 14), ey = (y - c.y) / (c.ry - 14), r2 = ex * ex + ey * ey;
    if (r2 > 1) {
        x = c.x + (x - c.x) / Math.sqrt(r2);
        y = c.y + (y - c.y) / Math.sqrt(r2);
    }
    return { x: x, y: y, surf: 0 };
}

function tendRoute(H, tg) {
    var r = [], e0 = PT[0][0];
    if (H.surf) {
        r.push(lnSeg(H.x, H.y, e0, 23));
        r.push(lnSeg(e0, 23, PT[0][0], PT[0][1]));
        if (tg.c) {
            r.push(mainSeg(0, 1));
            r.push(lnSeg(QX, QY, tg.c[0], tg.c[1]));
        }
        else if (tg.b != null) {
            r.push(mainSeg(0, juncP(tg.b)));
            r.push(brSeg(BP[tg.b], 0, tg.s));
        }
        else
            r.push(mainSeg(0, tg.m));
    }
    else {
        r.push(lnSeg(H.x, H.y, QX, QY));
        if (tg.c)
            r.push(lnSeg(QX, QY, tg.c[0], tg.c[1]));
        else if (tg.b != null) {
            r.push(mainSeg(1, juncP(tg.b)));
            r.push(brSeg(BP[tg.b], 0, tg.s));
        }
        else
            r.push(mainSeg(1, tg.m));
    }
    return r;
}

function homeAnchor(h) { return h.c ? { t: 'c', c: h.c } : h.b != null ? { t: 'b', b: h.b, s: h.s } : { t: 'm', m: h.m }; }

// walking route between two work-site homes through the real tunnels (no teleporting)
function siteRoute(A, B) {
    var r = [], mp;
    if (A.c) {
        r.push(lnSeg(A.c[0], A.c[1], QX, QY));
        mp = 1;
    }
    else if (A.b != null) {
        r.push(brSeg(BP[A.b], A.s, 0));
        mp = juncP(A.b);
    }
    else
        mp = A.m;
    if (B.c) {
        r.push(mainSeg(mp, 1));
        r.push(lnSeg(QX, QY, B.c[0], B.c[1]));
    }
    else if (B.b != null) {
        r.push(mainSeg(mp, juncP(B.b)));
        r.push(brSeg(BP[B.b], 0, B.s));
    }
    else
        r.push(mainSeg(mp, B.m));
    return r;
}

function startTravel(a, rt, tg, kind) {
    var L = 0;
    rt.forEach(function (g) { L += g.n; });
    a.kind = null;
    a.then = kind;
    a.st = 'tgo';
    a.trt = rt;
    a.tL = L;
    a.tg = tg;
    a.tlv = layoutV;
    a.xr = 1;
    a.d = 0;
    a.pile = null;
    a.carry = 0;
}

function tendPick(a) {
    var piles = spoil.filter(function (p) { return p.n >= 1 && p.tg && (p.tg.b == null || (BP[p.tg.b] && p.tg.b < S.sideTunnels)) && (p.res || 0) < 2; }), tg, pile = null;
    if (piles.length) {
        pile = piles[Math.floor(Math.random() * piles.length)];
        pile.res = (pile.res || 0) + 1;
        tg = pile.tg;
    }
    else {
        var dugB = [];
        for (var k = 0; k < S.sideTunnels; k++)
            if (BP[k] && S.sideDug[k] > .2)
                dugB.push(k);
        var lo = 1 - S.dug, bestL = 1e9, H0 = tendHome();
        if (S.dug <= .06 && !dugB.length)
            return false;
        for (var c = 0; c < 3; c++) {
            var cand;
            if (dugB.length && Math.random() < .45) {
                var kb = dugB[Math.floor(Math.random() * dugB.length)];
                cand = { b: kb, s: Math.min(S.sideDug[kb], 1) * (.2 + Math.random() * .7) };
            }
            else
                cand = { m: lo + .02 + Math.random() * Math.max(.01, .95 - lo - .02) };
            var cl2 = 0;
            tendRoute(H0, cand).forEach(function (g) { cl2 += g.n; });
            if (cl2 < bestL) {
                bestL = cl2;
                tg = cand;
            }
        }
    }
    var H = tendHome(), rt = tendRoute(H, tg), L = 0;
    rt.forEach(function (g) { L += g.n; });
    a.kind = null;
    a.then = null;
    a.xr = 0;
    a.st = 'tgo';
    a.trt = rt;
    a.tL = L;
    a.tg = tg;
    a.tlv = layoutV;
    a.d = 0;
    a.pile = pile;
    a.side = pile ? pile.side : (Math.random() < .5 ? 1 : -1);
    a.carry = 0;
    return true;
}

function tendStep(a, dt, SP, bits) {
    var v = SP * (a.spd || 1) * dt;
    if (a.trt && a.tg && a.tlv !== layoutV && !a.xr) {
        var oldL = a.tL, nL = 0;
        a.trt = tendRoute(tendHome(), a.tg);
        a.trt.forEach(function (g) { nL += g.n; });
        a.d = oldL ? a.d * nL / oldL : 0;
        a.tL = nL;
        a.tlv = layoutV;
    }
    if (a.st === 'tarr')
        return;
    if (a.st !== 'tgo' && a.st !== 'twork' && a.st !== 'tret' && a.st !== 'tdump') {
        if (a.noPick || !tendPick(a)) {
            a.st = 'idle';
            a.si = -1;
        }
        return;
    }
    if (a.st === 'tgo') {
        a.d += v;
        if (a.d >= a.tL) {
            a.d = a.tL;
            if (a.then) {
                a.st = 'tarr';
                return;
            }
            a.st = 'twork';
            a.t = 0;
            a.hit = 0;
        }
    }
    else if (a.st === 'twork') {
        a.t += dt;
        a.hit -= dt;
        if (a.hit <= 0 && a.wx != null) {
            a.hit = .3;
            fx.push({ x: a.wx + (Math.random() - .5) * 4, y: a.wy + (Math.random() - .5) * 4, vx: (Math.random() - .5) * 18, vy: -6 - Math.random() * 10, l: .45, c: '#8a6340', s: 1.6, g: 40 });
        }
        if (a.t >= 1.8 * (a.dgt || 1)) {
            if (a.pile) {
                var take = Math.min(bits, a.pile.n);
                a.pile.n -= take;
                a.pile.res = Math.max(0, (a.pile.res || 1) - 1);
                if (a.pile.n < 1) {
                    var ix = spoil.indexOf(a.pile);
                    if (ix >= 0)
                        spoil.splice(ix, 1);
                }
                a.carry = Math.max(1, Math.round(take));
            }
            else
                a.carry = 1;
            a.pile = null;
            a.st = 'tret';
        }
    }
    else if (a.st === 'tret') {
        a.d -= v;
        if (a.d <= 0) {
            a.d = 0;
            a.st = 'tdump';
            a.t = 0;
        }
    }
    else {
        a.t += dt;
        if (a.t >= .8) {
            var H = tendHome();
            if (H.surf)
                S.hillGrowth = Math.min(9, (S.hillGrowth || 0) + a.carry * .02);
            else
                cavHeap = Math.min(40, cavHeap + a.carry);
            for (var j = 0; j < 4; j++)
                fx.push({ x: H.x, y: H.y - 2, vx: (Math.random() - .5) * 26, vy: -8 - Math.random() * 12, l: .45, c: '#a67c52', s: 2, g: 50 });
            a.carry = 0;
            if (a.noPick || !tendPick(a)) {
                a.st = 'idle';
                a.si = -1;
            }
        }
    }
}

function crewTick(dt) {
    if (dead)
        return;
    var nW = Math.min(S.workers, 18), now = performance.now(), ss = crewSites(now), SP = 26, DIG_T = 3.6, bits = 2 + (S.classLevel[6] >= 4 ? 1 : 0);
    while (crewA.length < nW)
        crewA.push({ st: 'idle', d: 0, t: Math.random() * 2, si: -1, j: 0, carry: 0, hit: 0, spd: .85 + Math.random() * .3, dgt: .8 + Math.random() * .45, ln: Math.random() * 2 - 1, dd: Math.random() * 12 });
    crewA.length = nW;
    var biteLen = 20 * Math.pow(S.workers / Math.max(1, nW), .85) * (1 + .25 * S.classLevel[6]) * (S.classLevel[6] >= 8 ? 1.3 : 1) * (1 + .5 * pk('swift')) * (S.orders.wk === 0 ? 1.3 : S.orders.wk === 2 ? .7 : 1);
    for (var q = spoil.length - 1; q >= 0; q--) {
        spoil[q].n -= dt * .06;
        if (spoil[q].n <= 0)
            spoil.splice(q, 1);
    }
    cavHeap = Math.max(0, cavHeap - dt * .03 * (S.orders.wk === 2 ? 4 : 1));
    var byKind = {}, cnt = {};
    ss.forEach(function (s) { byKind[s.kind] = s; cnt[s.kind] = 0; });
    crewA.forEach(function (a) { var kk = a.kind || a.then; if (kk && byKind[kk])
        cnt[kk]++; });
    function rehome(a, from) {
        var sv = ss.length ? leastBusy() : null;
        if (sv) {
            cnt[sv.kind]++;
            startTravel(a, siteRoute(from, sv.home), sv.home, sv.kind);
        }
        else {
            var Hh = tendHome(), rtH = tendRoute(Hh, from), LH = 0;
            rtH.forEach(function (g) { LH += g.n; });
            a.kind = null;
            a.then = null;
            a.xr = 0;
            a.trt = rtH;
            a.tL = LH;
            a.tg = from;
            a.tlv = layoutV;
            a.d = LH;
            a.st = 'tret';
            a.carry = 0;
            a.pile = null;
        }
    }
    function leastBusy() { var best = null; ss.forEach(function (s) { if (!best || cnt[s.kind] / s.w < cnt[best.kind] / best.w)
        best = s; }); return best; }
    crewA.forEach(function (a, i) {
        var s = a.kind ? byKind[a.kind] : null;
        a.noPick = ss.length > 0;
        if (a.noPick && !s && !a.then && (a.st === 'tgo' || a.st === 'twork')) {
            // a digging job opened up: finish the walk home first, then take it
            if (a.pile)
                a.pile.res = Math.max(0, (a.pile.res || 1) - 1);
            a.pile = null;
            a.carry = 0;
            a.st = 'tret';
        }
        if (s)
            a.hm = homeAnchor(s.home);
        else if (a.kind && a.hm && !a.then) {
            // their job vanished (tunnel finished): walk on from where they are, no popping
            rehome(a, a.hm);
            a.hm = null;
        }
        if (!s && ss.length && !a.then && !(a.st && a.st[0] === 't' && a.st !== 'tarr')) {
            if (a.pile)
                a.pile.res = Math.max(0, (a.pile.res || 1) - 1);
            var s0 = leastBusy();
            cnt[s0.kind]++;
            // Walk to the new face through the tunnels instead of popping up there
            startTravel(a, tendRoute(tendHome(), s0.home), s0.home, s0.kind);
        }
        if (!s) {
            a.kind = null;
            a.si = -1;
            tendStep(a, dt, SP, bits);
            if (a.st === 'tarr') {
                var s2 = byKind[a.then];
                a.then = null;
                a.xr = 0;
                a.trt = null;
                if (s2) {
                    a.kind = s2.kind;
                    a.d = s2.L;
                    a.st = 'back';
                }
                else
                    rehome(a, a.tg);
            }
            return;
        }
        a.si = ss.indexOf(s);
        if (a.st === 'dig') {
            a.t += dt;
            a.hit -= dt;
            if (a.hit <= 0) {
                a.hit = .22;
                fx.push({ x: s.f.x + Math.cos(s.f.ang) * 3, y: s.f.y + Math.sin(s.f.ang) * 3, vx: (Math.random() - .5) * 26, vy: -8 - Math.random() * 14, l: .5, c: '#8a6340', s: 2, g: 50 });
                if (Math.random() < .5) {
                    digging = true;
                    SFX.dig();
                }
            }
            if (s.adv)
                s.adv(biteLen * dt / DIG_T * soilMul(s.f.y));
            if (a.t >= DIG_T * (a.dgt || 1)) {
                a.st = 'out';
                a.carry = bits;
                if (s.kind === 'main' && S.foodSpots.length < spotMax()) {
                    var lastP = S.foodSpots.length ? S.foodSpots[S.foodSpots.length - 1].p : 2;
                    if ((S.foodSpots.length === 0 && S.dug >= .03) || (Math.abs((1 - S.dug) - lastP) * LEN > 30 && Math.random() < .12))
                        addSpotAt(Math.max(0, 1 - S.dug + .012));
                }
            }
        }
        else if (a.st === 'out') {
            a.d += SP * (a.spd || 1) * dt;
            if (a.d >= s.L - (a.dd || 0)) {
                a.d = s.L - (a.dd || 0);
                a.st = 'drop';
                a.t = 0;
            }
        }
        else if (a.st === 'drop') {
            a.t += dt;
            if (a.t >= .8) {
                addSpoil(s, a, i);
                a.carry = 0;
                a.st = 'back';
                var lb = leastBusy();
                if (lb && lb !== s && cnt[s.kind] / s.w > cnt[lb.kind] / lb.w + 1.01) {
                    cnt[s.kind]--;
                    cnt[lb.kind]++;
                    startTravel(a, siteRoute(homeAnchor(s.home), homeAnchor(lb.home)), lb.home, lb.kind);
                    a.si = -1;
                }
            }
        }
        else if (a.st === 'back') {
            a.d -= SP * (a.spd || 1) * dt;
            if (a.d <= 0) {
                a.d = 0;
                a.st = 'dig';
                a.t = 0;
                a.hit = 0;
            }
        }
        else {
            a.st = 'back';
            a.d = Math.min(a.d || s.L, s.L);
        }
    });
    var lanes = {};
    crewA.forEach(function (a) { var go = a.st === 'out' || a.st === 'tgo', bk = a.st === 'back' || a.st === 'tret';
        if (!go && !bk)
            return; var key = (a.kind || 'tend') + (a.st[0] === 't' ? 't' : '') + (go ? 'o' : 'b') + (a.ln > 0 ? 'r' : 'l'); (lanes[key] || (lanes[key] = [])).push(a); });
    Object.keys(lanes).forEach(function (key) {
        var L = lanes[key], up = L[0].st === 'out' || L[0].st === 'tret';
        L.sort(function (p, q) { return up ? q.d - p.d : p.d - q.d; });
        for (var n = 1; n < L.length; n++) {
            if (up && L[n].d > L[n - 1].d - 5)
                L[n].d = Math.max(0, L[n - 1].d - 5);
            if (!up && L[n].d < L[n - 1].d + 5)
                L[n].d = L[n - 1].d + 5;
        }
    });
}

function startExplore(i) { var n = 0, sc = []; marchers.forEach(function (m) { if (m.k === 3 && !m.inj && !m.ex)
    sc.push(m); }); sc.slice(0, 3).forEach(function (m) { m.ex = { i: i, t: -n * 1.2, ph: Math.random() * 6 }; n++; }); if (n)
    toast('Scouts are exploring the new ' + ROOMS[i].n + '.'); }
