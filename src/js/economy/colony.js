/* economy/colony.js
   Counting ants, eggs, food, rooms, rewards, upgrades and the main colony tick.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

// ---- counting ants ----

function cnt(c) { return [S.nurses, S.foragers, S.soldiers, S.scouts, S.superMajors, 0, S.workers][c]; }

function addc(c, d) { if (c === 0)
    S.nurses += d;
else if (c === 1)
    S.foragers += d;
else if (c === 2)
    S.soldiers += d;
else if (c === 3)
    S.scouts += d;
else if (c === 6)
    S.workers += d;
else
    S.superMajors += d; }

function popn() { return S.nurses + S.foragers + S.soldiers + S.scouts + S.superMajors + S.workers; }

function healthy(c) { return Math.max(0, cnt(c) - S.injured[c]); }

function injN() { return S.injured[0] + S.injured[1] + S.injured[2] + S.injured[3] + S.injured[4]; }

// ---- economy: eggs, food and rewards ----

function layGap() { return (bio().eg || 1) * 30 * (1 - .04 * S.queenLevel) * (S.tier >= 4 ? 1 - .1 * (1 + .2 * rl(3)) : 1); }

function eggCost() { return Math.max(1, Math.ceil((1 + S.tier) * (1 - .15 * pk('fat')))); }

function foodCap() { return Math.round(400 * Math.pow(2.2, S.tier + 1) * (1 + .25 * S.bld.store) * (1 + .08 * (S.deep || 0)) * (larderOn() ? TUNING.larder.storeBonus : 1)); }

function leaf() { return heroB(1) * (bio().fd || 1) * 2 * (1 + .15 * S.tier) * (S.tier === 0 ? 3.2 : S.tier === 1 ? 2.2 : S.tier === 2 ? 1.3 : 1) * (1 + .05 * P.legacyEver) * (1 + .2 * S.classLevel[1]) * ((S.hillLevel || 0) >= 4 ? 1.1 : 1) * (1 + TUNING.hall.bonus * (S.hall || 0)); }

function capN() { return CAPS[S.tier] + (S.tier >= 4 ? 250 * (S.hillLevel || 0) : 0) + (S.cavLevel || 0) * Math.round(CAPS[S.tier] * .2); }

// chamber levels: each of the four rooms can be upgraded to make its bonus stronger
var ROOMB = [.3, .15, .15, .1], ROOMT = ['the colony eats %s less food', 'eggs hatch %s faster', 'soldiers deal %s more damage', 'the queen lays %s sooner'];
function rl(i) { return (S.roomLv && S.roomLv[i]) || 0; }
function roomCost(i) { var lv = rl(i); return { f: Math.round(260 * Math.pow(2.2, lv) * (1 + S.tier * .5)), j: 3 + 3 * lv }; }
function upRoom(i) {
    var lv = rl(i), c = roomCost(i);
    if (S.tier <= i || lv >= 4 || S.food < c.f || S.jelly < c.j)
        return;
    S.food -= c.f;
    S.jelly -= c.j;
    S.roomLv = S.roomLv || [0, 0, 0, 0];
    S.roomLv[i] = lv + 1;
    SFX.buy();
    pulseRing('255,210,60');
    burst(QX, QY, 18, ['#ffd23f', '#fff'], 90);
    toast(ROOMS[i].n + ' is now level ' + (lv + 2) + '.');
}
function cavCost() { var lv = S.cavLevel || 0; return lv < 5 ? { f: Math.round(foodCap() * (.15 + .1 * lv)), j: 6 + 6 * lv } : { f: Math.round(foodCap() * Math.min(.85, .6 + .05 * (lv - 5))), j: 16 + 4 * (lv - 5) }; }
function upCav() {
    var lv = S.cavLevel || 0, c = cavCost();
    if (S.tier < 2 || lv >= 10 || (lv >= 5 && S.tier < 4) || S.food < c.f || S.jelly < c.j)
        return;
    S.food -= c.f;
    S.jelly -= c.j;
    S.cavLevel = lv + 1;
    SFX.buy();
    flash = .6;
    shake = .4;
    pulseRing('255,210,60');
    burst(QX, QY, 30, ['#ffd23f', '#fff', '#a07a4a'], 120);
    toast('The nest cavern grew. Room for ' + capN() + ' ants.');
}

function reachCost() { var lv = S.reach || 0; return { f: Math.round(foodCap() * (.3 + .2 * lv)), j: 10 + 10 * lv }; }
function upReach() {
    var lv = S.reach || 0, c = reachCost();
    if (lv >= 2 || S.tier < 3 + lv || S.food < c.f || S.jelly < c.j)
        return;
    S.food -= c.f;
    S.jelly -= c.j;
    S.reach = lv + 1;
    layoutV++;
    genPebs();
    SFX.buy();
    flash = .6;
    shake = .4;
    pulseRing('255,210,60');
    toast('New ground to dig! Explore West and East, and four more side tunnels are open.');
}

function banqCost() { return Math.round(foodCap() * .4); }
function banqYield() { return Math.max(1, S.tier - 1); }
function banqReady() { return (S.days || 0) - (S.banq == null ? -9 : S.banq) >= .8; }
function upBanq() {
    if (S.tier < 3 || !banqReady() || S.food < banqCost())
        return;
    S.food -= banqCost();
    S.banq = S.days || 0;
    S.banqN = (S.banqN || 0) + 1;
    gainJelly(banqYield());
    SFX.buy();
    flash = .4;
    pulseRing('255,210,60');
    burst(QX, QY, 26, ['#ffd23f', '#fff', '#9bd36a'], 110);
    toast('The royal banquet is a feast! +' + banqYield() + ' jelly.');
}

function hpMax() { return 100 + 20 * S.queenLevel; }

function clutch() { return (Math.max(1, Math.round(CL[S.tier] * (1 + .08 * S.queenLevel))) + S.bld.nest) * (S.queenLevel >= 8 && Math.random() < .25 ? 2 : 1); }

function rollClass() { if (Math.random() < GOLD * (S.queenLevel >= 4 ? 5 : 1) * (cavesOn() ? TUNING.caves.goldenMul : 1))
    return 4; var r = Math.random() * 100, a = 0; for (var n = 0; n < ORD.length; n++) {
    a += CW[n];
    if (r < a)
        return ORD[n];
} return 0; }

function upkeepRate(pop) { return Math.max(0, pop - 8) * .014 * (S.tier >= 1 ? 1 - .3 * (1 + .2 * rl(0)) : 1) * (S.tier === 0 ? .3 : S.tier === 1 ? .6 : 1); }

function deposit(m) {
    var y = leaf() * haul() * (m && m.si < 0 ? (m.si === -1 ? 1.52 : sideYield(-2 - m.si)) : 1) * restMul();
    S.food = Math.min(foodCap(), S.food + y);
    earnAcc += y;
    S.deliveries = (S.deliveries || 0) + 1;
    ph1 = Math.min(1, ph1 + .06);
    return y;
}

function gainJelly(n) { var jx = n * (bio().jl || 1); n = Math.floor(jx) + (Math.random() < jx % 1 ? 1 : 0); S.jelly += n; fx.push({ x: QX, y: QY - 48, vx: 0, vy: -18, l: 1.4, t: '+' + n + ' jelly', f: 13, c: '#ffd23f', g: 0 }); }

function gj1() { var n = performance.now(); if (n > (gj1.t || 0)) {
    gj1.t = n + 6000;
    gainJelly(1);
    return 1;
} return 0; }

function haul() { var c = S.classLevel[1] >= 8 ? .2 : S.classLevel[1] >= 4 ? .1 : 0; return c && Math.random() < c ? 3 : 1; }

// ---- upgrades, masteries and jelly ----

function perk(l) { var lv = pk(l.id), c = (lv + 1) * 2; if (lv >= 5 || P.legacy < c || (P.gen || 0) < (l.gen || 0))
    return; P.legacy -= c; P.perks[l.id] = lv + 1; SFX.buy(); }

function clCost(i) { return Math.max(1, Math.ceil(3 * Math.pow(1.75, i === 5 ? S.queenLevel : S.classLevel[i]) * (1 - .08 * pk('wisdom')))); }

function upgClass(i) { var q = i === 5, lv = q ? S.queenLevel : S.classLevel[i]; if (lv >= 8 || S.jelly < clCost(i))
    return; S.jelly -= clCost(i); if (q)
    S.queenLevel++;
else
    S.classLevel[i]++; var nl = q ? S.queenLevel : S.classLevel[i]; shake = Math.max(shake, .25); pulseRing(q ? '255,210,60' : null); if (nl === 4 || nl === 8)
    masteryFx(i, nl); SFX.buy(); burst(QX, QY, 16, [q ? '#ffd23f' : CC[i], '#fff'], 80); toast((q ? 'The Queen' : CN[i] + 's') + ' reached level ' + (lv + 1) + '.'); }

function masteryFx(i, l) { var q = i === 5; toast('Mastery unlocked: ' + (q ? 'The Queen' : CN[i]) + ' - ' + MST[i][l === 4 ? 0 : 1] + '!'); flash = .8; shake = .5; pulseRing('255,255,255'); pulseRing(q ? '255,210,60' : null); SFX.win(); burst(QX, QY, 50, [q ? '#ffd23f' : CC[i], '#fff', '#ffd23f'], 140); }

function lifeTick(dt) {
    if (S.tier < seenTier) {
        exc = null;
        spoil.length = 0;
    }
    if (seenTier < 0 || S.tier < seenTier)
        seenTier = S.tier;
    if (S.tier > seenTier) {
        seenTier = S.tier;
        if (!exc && TUNING.tunnelRooms)
            exc = { i: S.tier - 1, t: 0, dur: 24 };
    }
    if (exc) {
        exc.t += dt;
        if (exc.t >= exc.dur) {
            startExplore(exc.i);
            exc = null;
        }
    }
    marchers.forEach(function (m) {
        if (m.k === 0 && !m.inj && m.tend && Math.random() < dt * .35)
            fx.push({ x: m.px, y: m.py - 7, vx: 0, vy: -12, l: .9, t: '\u2661', f: 9, c: '#ff9db0', g: 0 });
        if (m.inj && m.st === 2 && Math.random() < dt * 1.1)
            fx.push({ x: m.px + (Math.random() - .5) * 6, y: m.py - 6, vx: 0, vy: -14, l: .9, t: '+', f: 11, c: '#7fe08a', g: 0 });
        if (m.ex) {
            if (m.inj) {
                m.ex = null;
                return;
            }
            var e = m.ex;
            e.t += dt;
            if (e.t < 0) {
                var a0 = at(Math.min(1, juncP2(e.i) + .1));
                m.px = a0.x;
                m.py = a0.y;
                m.ang = a0.ang + Math.PI;
                return;
            }
            var jp = PT[CI[e.i]], cxn = jp[0] + (e.i % 2 ? -34 : 34), cyn = jp[1], pj = juncP2(e.i), T1 = 5, T2 = 7.5, T3 = 20.5, T4 = 23, T5 = 27, a;
            if (e.t < T1) {
                a = at(Math.min(1, pj + .1 * (1 - e.t / T1)));
                m.px = a.x;
                m.py = a.y;
                m.ang = a.ang + Math.PI;
            }
            else if (e.t < T2) {
                var u = (e.t - T1) / (T2 - T1);
                m.px = jp[0] + (cxn - jp[0]) * u;
                m.py = jp[1] + (cyn - jp[1]) * u;
                m.ang = Math.atan2(cyn - jp[1], cxn - jp[0]);
            }
            else if (e.t < T3) {
                var w = e.t * 1.1 + e.ph;
                m.px = cxn + Math.cos(w) * 15;
                m.py = cyn + Math.sin(w * 1.3) * 6;
                m.ang = Math.atan2(Math.cos(w * 1.3) * 7.8, -Math.sin(w) * 15) + (((e.t * .9) | 0) % 3 === 0 ? Math.sin(e.t * 7) * .7 : 0);
                if (Math.random() < dt * .5)
                    fx.push({ x: m.px, y: m.py - 7, vx: 0, vy: -14, l: .8, t: '\u2726', f: 9, c: '#ffe27a', g: 0 });
            }
            else if (e.t < T4) {
                var u2 = (e.t - T3) / (T4 - T3);
                m.px = cxn + (jp[0] - cxn) * u2;
                m.py = cyn + (jp[1] - cyn) * u2;
                m.ang = Math.atan2(jp[1] - cyn, jp[0] - cxn);
            }
            else if (e.t < T5) {
                a = at(Math.min(1, pj + .1 * ((e.t - T4) / (T5 - T4))));
                m.px = a.x;
                m.py = a.y;
                m.ang = a.ang;
            }
            else
                m.ex = null;
        }
    });
}

function carcTick(dt) { for (var i = carc.length - 1; i >= 0; i--) {
    var c = carc[i];
    c.t -= dt;
    if (c.t <= 0) {
        if (S.foragers > 0) {
            S.food = Math.min(foodCap(), S.food + c.v);
            earnAcc += c.v;
            fx.push({ x: c.x, y: c.y - 8, vx: 0, vy: -22, l: 1.1, t: '+' + c.v + ' scavenged', f: 11, c: '#9be07a', g: 0 });
        }
        carc.splice(i, 1);
    }
} }

function unInj(m) { m.rt = 0; m.inj = 0; m.p = 1; m.d = -1; m.st = 0; }

function hatch(p, e) {
    var c = e.c == null ? rollClass() : e.c;
    addc(c, 1);
    S.totalHatched++;
    pulse = .6;
    burst(p.x, p.y, c === 4 ? 45 : 8, [CC[c], '#fff6d8', '#ffd35a'], c === 4 ? 130 : 50);
    // the two shell halves spring apart
    for (var sh = -1; sh <= 1; sh += 2)
        fx.push({ x: p.x, y: p.y + sh, vx: sh * (14 + Math.random() * 10), vy: -26 - Math.random() * 10, l: .75, shell: sh, rot: 0, spin: sh * (4 + Math.random() * 4), c: c === 4 ? '#ffd23f' : '#f4efe0', g: 150 });
    tn(800 + c * 120, .06, 'triangle', .06);
    if (c === 4) {
        gainJelly(10);
        flash = .8;
        pulseRing('255,210,60');
        pulseRing('255,255,255');
        shake = .5;
        SFX.win();
        goldFanfare();
        toast('A Golden Egg hatched! A Super Major joins your colony.');
    }
    sync();
}

function kill() {
    var c = [S.nurses, S.foragers, S.soldiers, S.scouts, S.superMajors * .3], t = 0, k = 0;
    c.forEach(function (x) { t += x; });
    if (t <= 0)
        return;
    var r = Math.random() * t;
    while (k < 4 && r >= c[k]) {
        r -= c[k];
        k++;
    }
    addc(k, -1);
    if (S.injured[k] > cnt(k))
        S.injured[k] = Math.max(0, cnt(k));
    SFX.hit();
    var vic = marchers.filter(function (m) { return m.k === k && !m.inj && m.wx != null; })[0];
    if (vic) {
        fallen.push({ x: vic.wx, y: vic.wy, ang: vic.wa || 0, k: k, t: 5, s: Math.random() * 2 - 1, vx: (Math.random() - .5) * 90, vy: -30 - Math.random() * 30, sp: (Math.random() - .5) * 16 });
        if (fallen.length > 14)
            fallen.shift();
        burst(vic.wx, vic.wy, 5, ['#8a6340', '#5a3d22'], 30);
    }
    else
        fx.push({ x: QX, y: QY - 20, vx: 0, vy: -20, l: .8, t: '@skull', f: 14, g: 0 });
    sync();
}

function injure() {
    var h = [healthy(2) * 3, healthy(4) * .6, healthy(1), healthy(3)], ks = [2, 4, 1, 3], t = h[0] + h[1] + h[2] + h[3];
    if (t <= 0) {
        kill();
        return;
    }
    var r = Math.random() * t, i = 0;
    while (i < 3 && r >= h[i]) {
        r -= h[i];
        i++;
    }
    S.injured[ks[i]]++;
    SFX.hit();
    sync();
}

function healOne() {
    var o = [4, 2, 1, 3, 0], k, i, m = null;
    for (i = 0; i < 5 && !m; i++) {
        k = o[i];
        marchers.forEach(function (x) { if (!m && x.k === k && x.inj && x.st === 2 && x.rt >= 3)
            m = x; });
    }
    if (!m) {
        var vis = 0;
        marchers.forEach(function (x) { if (x.inj)
            vis++; });
        if (vis)
            return false;
        for (i = 0; i < 5; i++)
            if (S.injured[o[i]] > 0) {
                S.injured[o[i]]--;
                return true;
            }
        return false;
    }
    S.injured[m.k]--;
    var px = m.px, py = m.py;
    unInj(m);
    fx.push({ x: px, y: py - 6, vx: 0, vy: -24, l: .9, t: '+', f: 16, c: '#7ee08a', g: 0 });
    burst(px, py, 5, ['#7ee08a', '#fff'], 35);
    return true;
}

function sync() {
    var c = [S.nurses, S.foragers, S.soldiers, S.scouts, S.superMajors], cap = VCAP, have = [0, 0, 0, 0, 0], k, i;
    marchers.forEach(function (m) { have[m.k]++; });
    for (k = 0; k < 5; k++) {
        var want = Math.min(cap[k], c[k]);
        while (have[k] < want) {
            marchers.push({ u: Math.random(), born: performance.now(), k: k, p: 1, d: -1, l: Math.random() * 2 - 1, v: (.8 + Math.random() * .4) * (k === 4 ? .6 : 1), ph: Math.random() * 6, sd: Math.random() < .5 ? 1 : -1, s: Math.random(), fi: Math.floor(Math.random() * 8), px: QX, py: QY });
            have[k]++;
        }
        while (have[k] > want) {
            for (i = marchers.length - 1; i >= 0; i--)
                if (marchers[i].k === k && !marchers[i].inj) {
                    marchers.splice(i, 1);
                    break;
                }
            have[k]--;
        }
    }
    for (k = 0; k < 5; k++) {
        var inj = 0;
        for (i = 0; i < marchers.length; i++)
            if (marchers[i].k === k && marchers[i].inj)
                inj++;
        var w2 = Math.min(S.injured[k], have[k]);
        while (inj < w2) {
            for (i = 0; i < marchers.length; i++)
                if (marchers[i].k === k && !marchers[i].inj) {
                    var m = marchers[i];
                    m.inj = 1;
                    m.st = 0;
                    m.q = null;
                    m.d = 1;
                    break;
                }
            inj++;
        }
        while (inj > w2) {
            for (i = 0; i < marchers.length; i++)
                if (marchers[i].k === k && marchers[i].inj) {
                    unInj(marchers[i]);
                    break;
                }
            inj--;
        }
    }
}

// ---- main loop ----

function colony(dt) {
    if (dead)
        return;
    raidTick(dt);
    carcTick(dt);
    lifeTick(dt);
    crewTick(dt);
    spotsTick(dt);
    buildTick(dt);
    featTick(dt);
    threatTick(dt);
    goalsTick();
    greetTick(dt);
    wormTick(dt);
    goldTick(dt);
    heroTick(dt);
    cavTick(dt);
    moleTick(dt);
    restTick(dt);
    abilityTick(dt);
    dlyT -= dt;
    if (dlyT <= 0) {
        dlyT = 2;
        dailyTick();
    }
    var pop = popn(), cap = capN(), i, t = performance.now() * .001;
    digging = S.dug < digCap() && S.workers > 0;
    S.food = Math.max(0, S.food - upkeepRate(pop) * dt);
    if (S.food <= 0 && pop > 0) {
        S.starveTimer = (S.starveTimer || 0) + dt;
        if (S.starveTimer > 10) {
            S.starveTimer = 0;
            kill();
            toast('The colony is starving. You need more foragers.');
        }
    }
    else
        S.starveTimer = 0;
    S.layTimer -= dt;
    if (S.layTimer <= 0) {
        var room = cap - pop - S.eggs.length, n = Math.min(clutch(), room, Math.floor(S.food / eggCost()));
        if (n > 0) {
            S.food -= n * eggCost();
            for (i = 0; i < n; i++) {
                // d: the egg's whole time to hatch (optional save field), used to draw it growing egg -> larva -> pupa
                var et = 18 * (1 - .06 * S.classLevel[0]) * (S.tier >= 2 ? 1 - .15 * (1 + .2 * rl(1)) : 1) * (1 - .1 * S.bld.hatch) * (.9 + Math.random() * .3);
                S.eggs.push({ t: et, d: et, b: performance.now(), c: rollClass() });
            }
            S.layTimer = layGap();
            pulse = 1;
            SFX.lay();
            var qr = qRear(); fx.push({ x: qr.x, y: qr.y - 2, vx: Q.fx * -20, vy: -20, l: .9, t: '@egg', f: 10, g: 140 });
        }
        else
            S.layTimer = 0;
    }
    for (i = S.eggs.length - 1; i >= 0; i--) {
        var e = S.eggs[i];
        e.t -= dt * (1.3 - .6 * S.orders.nu / 100);
        if (e.t <= 0) {
            var p = broodPos(i);
            S.eggs.splice(i, 1);
            hatch(p, e);
        }
    }
    S.healProgress = (S.healProgress || 0) + dt * (.5 + S.orders.nu / 100) * Math.min(8, healthy(0)) / 9 * (1 + .15 * S.classLevel[0]) * (S.classLevel[0] >= 8 ? 1.5 : 1);
    if (!injN())
        S.healProgress = Math.min(S.healProgress, 1);
    else if (S.healProgress >= 1 && healOne())
        S.healProgress -= 1;
    else
        S.healProgress = Math.min(S.healProgress, 1.5);
    var eng = foes.filter(function (f) { return f.p > .05; }).length;
    if (eng) {
        S.injuryTimer -= dt;
        if (S.injuryTimer <= 0) {
            S.injuryTimer = 4 / eng;
            if (Math.random() < .75 * (armouryOn() ? TUNING.armoury.injuryMul : 1))
                injure();
        }
    }
    var nr = foes.filter(function (f) { return f.p >= .9; }).length;
    if (nr) {
        S.killTimer -= dt;
        if (S.killTimer <= 0) {
            S.killTimer = 6 / nr;
            if (Math.random() < .6)
                kill();
        }
    }
    moveArmy(dt, t);
    cricTick(dt);
    farDigTick(dt);
    if (pop === 0 && !S.eggs.length)
        lose();
}

function extra(dt) { branches(dt); poll(); colony(dt); achTick(dt); evTick(dt); larderTick(dt); }
