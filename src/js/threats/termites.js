/* threats/termites.js
   Termite raids from the far east tunnel and the soldiers who march out to meet them.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

// termite raid: soldiers and super majors march to the far east tunnel and hold the line there
function termOpen() { return !!BP[17] && S.sideTunnels > 17 && S.sideDug[17] >= 1 && !!S.rare.nbf; }
function trmFront() {
    var f = 2;
    trm.forEach(function (t) { if (t.w <= 0 && t.p < f) f = t.p; });
    return f;
}
function trmStep(m, dt, t) {
    var o = m.tr, B = BP[17], J = juncP(17), V = (m.k === 4 ? 34 : 46) * (m.v || 1) * dt, d, tg, f;
    if (!B || foes.length || !termOpen()) {
        m.tr = null;
        return false;
    }
    if (o.ph !== 'back' && (!trm.length || (trm.res && !(trm.chT > 0))))
        o.ph = o.ph === 'main' ? 'drop' : 'back';
    if (o.ph === 'drop') {
        m.tr = null;
        return false;
    }
    if (o.ph === 'main') {
        d = J - m.p;
        m.p += Math.sign(d) * Math.min(Math.abs(d), V / Math.max(1, LEN));
        m.d = d > 0 ? 1 : -1;
        m.act = 'Marching out to meet the termites';
        if (Math.abs(d) < 1e-4) {
            o.ph = 'tun';
            o.s = 0;
        }
        return true;
    }
    var rk = Math.floor(o.slot / 3), gap = (6 + rk * 5) / Math.max(1, B.LEN);
    if (o.ph === 'tun') {
        f = trmFront();
        if (trm.ms != null && !trm.res)
            tg = trm.ms - rk * 5 / B.LEN;
        else if (trm.res)
            tg = Math.min(.92, f - 14 / B.LEN) - gap;
        else
            tg = Math.max(o.s, Math.min(.92, f - 14 / B.LEN) - gap);
        tg = Math.max(0, Math.min(.95, tg));
        d = tg - o.s;
        o.s += Math.sign(d) * Math.min(Math.abs(d), V * (trm.res ? 1.25 : 1) / B.LEN);
        o.dir = Math.abs(d) > 2 / B.LEN ? (d > 0 ? 1 : -1) : 1;
        m.act = trm.fT > 0 ? 'Fighting termites in the far east tunnel' : trm.res ? 'Chasing the termites off' : 'Marching out to meet the termites';
        if (trm.fT > 0 && rk < 2 && Math.random() < dt * .8) {
            var a = at(Math.min(1, o.s + 5 / B.LEN), B);
            fx.push({ x: a.x, y: a.y - 2, vx: (Math.random() - .5) * 30, vy: -20, l: .35, t: '\u2022', f: 7, c: '#fff2b0', g: 40 });
        }
        return true;
    }
    // back down the tunnel to the main tunnel, then the usual guard post walk takes over
    o.s = Math.max(0, o.s - V / B.LEN);
    o.dir = -1;
    m.act = 'Heading back to guard duty';
    if (o.s <= 0) {
        m.tr = null;
        m.p = J;
        m.d = -1;
    }
    return true;
}
var trm = [], trmT = 120, trmDef = -1;

function termRaidTick(dt, quiet) {
    var B = BP[17];
    if (trm.length && !termOpen()) {
        // a raid can't outlive its tunnel
        trm.length = 0;
        trm.res = 0;
        trm.ms = null;
        trm.fT = 0;
        trm.chT = 0;
    }
    if (!B || !S.reach)
        return;
    if (!S.rare.nbf) {
        if (S.sideTunnels > 17 && S.sideDug[17] >= 1) {
            S.rare.nbf = 1;
            trmT = 90;
            if (!quiet) {
                toast('Workers found a termite nest in the far east tunnel. Not friendly!');
                SFX.win();
            }
        }
        return;
    }
    trmT -= dt;
    if (trmT <= 0 && !trm.length && !foes.length) {
        trmT = 240 + Math.random() * 180;
        var size = 14 + S.tier * 8 + Math.floor(popn() / 70) + Math.floor(Math.random() * 8), n = Math.min(30, 12 + Math.floor(size / 5));
        for (var i = 0; i < n; i++)
            trm.push({ p: 1, w: i * .55, back: 0, size: size, i: i });
        toast('Termite raiders are marching down the far east tunnel!');
    }
    var sp = 38 / Math.max(1, B.LEN) * dt, def = quiet ? -1 : trmDef;
    if (trm.fT > 0) {
        trm.fT -= dt;
        if (trm.fT <= 0)
            trmResolve(B);
    }
    if (trm.chT > 0)
        trm.chT -= dt;
    for (var j = trm.length - 1; j >= 0; j--) {
        var t = trm[j];
        if (t.w > 0) {
            t.w -= dt;
            continue;
        }
        if (!t.back) {
            var stop = trm.ms != null ? trm.ms + (8 + (t.i || 0) * 3.2) / B.LEN : def >= 0 ? def + 8 / B.LEN : -1;
            if (stop >= 0 && t.p - sp <= stop) {
                t.p = Math.max(t.p - sp, Math.min(t.p, stop));
                t.hold = 1;
                if (trm.ms == null && !trm.res) {
                    trm.ms = def;
                    trm.fT = 6 + Math.min(4, t.size / 20);
                    toast('Your soldiers met the termites in the far east tunnel!');
                    SFX.hit && SFX.hit();
                }
                continue;
            }
            t.hold = 0;
            t.p -= sp;
            if (t.p <= .04) {
                t.back = 1;
                if (!trm.res) {
                    trmResolve(B);
                }
            }
        }
        else {
            t.p += sp * 1.3;
            if (t.p >= 1)
                trm.splice(j, 1);
        }
    }
    if (!trm.length) {
        trm.res = 0;
        trm.ms = null;
        trm.fT = 0;
        trm.chT = 0;
    }
}

// the outcome is settled by numbers, as before; the soldiers on the line only show it
function trmResolve(B) {
    if (trm.res)
        return;
    trm.res = 1;
    trm.fT = 0;
    trm.forEach(function (t) { t.back = 1; t.hold = 0; });
    var sz = trm.length ? trm[0].size : 0, str = (S.soldiers * (1 + .25 * S.classLevel[2]) + S.superMajors * 10) * (armouryOn() ? TUNING.termites.armouryBonus : 1), cap = foodCap();
    if (str >= sz * 6) {
        trm.chT = trm.ms != null ? 5 : 0;
        S.termWins = (S.termWins || 0) + 1;
        var loot = Math.ceil(cap * TUNING.termites.lootShare);
        S.food = Math.min(cap, S.food + loot);
        toast('Your soldiers drove the termites back and took ' + fmt(loot) + ' food from them.');
        if (Math.random() < .25)
            gainJelly(1);
    }
    else {
        var lost = Math.min(S.food, Math.ceil(cap * TUNING.termites.lossShare));
        S.food -= lost;
        toast('The termites stole ' + fmt(lost) + ' food before running off. More soldiers would stop them.');
    }
}

function drawRaid() {
    var B = BP[17];
    if (!B || !trm.length)
        return;
    trm.forEach(function (t) {
        if (t.w > 0)
            return;
        var jg = t.hold && trm.fT > 0 && (t.i || 0) < 6 ? -Math.max(0, Math.sin(performance.now() * .012 + (t.i || 0) * 1.7)) * 2.2 / B.LEN : 0, q = at(Math.max(0, Math.min(1, t.p + jg)), B);
        critter(q.x, q.y, q.ang + (t.back ? 0 : Math.PI) + (t.hold ? Math.sin(performance.now() * .009 + (t.i || 0)) * .3 : 0), 2.6, false);
    });
}
