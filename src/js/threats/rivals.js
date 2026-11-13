/* threats/rivals.js
   Rival ant colonies raid the nest for its brood (build 85), like slave-making ants in the wild: a scout is seen
   first in one of the side tunnels, then a column of raiders comes out of that tunnel into the main tunnel and
   heads for the queen's eggs. Each raider that reaches them grabs an egg and runs back the way it came; one that
   gets away takes the egg with it. Kill a carrier and the egg is saved. The raiders are invaders (in foes, with
   f.rv set), so soldiers charge them and damage works as in any wave; only where they go and what they do differ.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

// RV: the current raid (null between raids): k = side tunnel they use, ph 'scout' | 'raid', t = time in phase,
// u = the scout's place along the side tunnel, lost / saved = eggs taken / rescued
var RV = null, rvT = TUNING.rivals.firstAt;

function rivalsOn() { return S.tier >= 2 && S.dug >= 1 && tunOK() && rivalTunnels().length > 0; }
// finished side tunnels the raiders can come from
function rivalTunnels() { var o = [], k; for (k = 0; k < S.sideTunnels && k < BP.length; k++) if (S.sideDug[k] >= 1) o.push(k); return o; }

function rivalTick(dt) {
    if (dead)
        return;
    if (!RV) {
        if (!rivalsOn() || foes.length || wvi.w || (MF && !MF.end) || trm.length)
            return;
        rvT -= dt;
        if (rvT > 0)
            return;
        var ks = rivalTunnels();
        RV = { k: ks[Math.floor(Math.random() * ks.length)], ph: 'scout', t: 0, u: 1, lost: 0, saved: 0 };
        feed('A rival scout is creeping down a side tunnel.', 'bad', function () { return RV && RV.ph === 'scout' && BP[RV.k] ? at(RV.u, BP[RV.k]) : null; });
        toast('A rival ant scout is sniffing round one of your side tunnels! A raid on your eggs is coming.');
        SFX.alarm();
        return;
    }
    RV.t += dt;
    if (RV.ph === 'scout') {
        // the scout creeps down the side tunnel towards the main tunnel, then turns and runs home to fetch the raiders
        var lead = TUNING.rivals.scoutLead, h = RV.t / lead;
        RV.u = h < .6 ? 1 - h / .6 * .85 : .15 + (h - .6) / .4 * .85;
        if (RV.t >= lead) {
            if (!rivalTunnels().length || S.sideDug[RV.k] < 1) { RV = null; rvT = 120; return; }
            rivalRaid();
        }
        return;
    }
    // the raid ends when no raider is left in the tunnels
    if (!foes.some(function (f) { return f.rv; })) {
        rivalEnd();
    }
}

function rivalRaid() {
    var R = TUNING.rivals, cnt = R.count + S.tier + Math.floor(S.wave / 12), jp = juncP(RV.k);
    // toughness follows the colony's soldiers like a wave, but varies raid to raid, and a colony that keeps more
    // soldiers on guard (Orders) meets the raiders sooner, so they arrive weaker
    var unit = dps() * .85 * (8 + Math.min(S.tier, 4) * 1.2) / cnt * R.hpMul * (.75 + Math.random() * .75) * (1.25 - .5 * S.orders.gd / 100);
    RV.ph = 'raid';
    RV.t = 0;
    RV.n = cnt;
    for (var i = 0; i < cnt; i++)
        foes.push({ p: jp - .015 * i, rv: 1, ex: jp, dir: 1, tp: 4, boss: false, hp: unit, max: unit, kl: 0, kt: 9, at: .5 + Math.random() * .6, tm: .3, acc: 0, o: (i % 3 - 1) * 2 });
    var a = at(jp);
    alarmAt(a.x, a.y);
    feed(cnt + ' rival raiders are after your eggs!', 'bad', function () { var g = foes.filter(function (o) { return o.rv; })[0]; return g ? at(g.p) : null; });
    burst(a.x, a.y, 16, ['#5a3a8a', '#2a1a40', '#c9a6ff'], 70);
    fx.push({ x: a.x, y: a.y - 16, vx: 0, vy: -14, l: 1.2, t: '!', f: 17, c: '#c9a6ff', g: 0, pop: 1 });
    toast('Raid! ' + cnt + ' rival ants are coming for your eggs. Your soldiers are on their way.');
    SFX.alarm();
    alarmT = 5;
}

// called from the main loop for each raider: moves it, takes an egg at the nest, and says when it got away
function rivalStep(f, dt) {
    var sp = TUNING.rivals.speed;
    if (f.dir > 0) {
        f.p = Math.min(1, f.p + sp * dt);
        if (f.p >= 1) {
            // at the brood: grab an egg (or, with none, a mouthful of food) and turn for home
            var R = TUNING.rivals, nu = healthy(0), hide = R.hideMax * nu / (nu + R.hideNurses);
            if (S.eggs.length && Math.random() < hide) {
                // panic alarm: the nurses have carried the brood deeper and the raider finds an empty bed
                RV.hid = (RV.hid || 0) + 1;
                fx.push({ x: QX, y: QY - 14, vx: 0, vy: -20, l: 1.1, t: 'nurses hid the eggs!', f: 12, c: '#b6ffd6', g: 0 });
            }
            else if (S.eggs.length) {
                f.egg = S.eggs.splice(Math.floor(Math.random() * S.eggs.length), 1)[0];
                fx.push({ x: QX, y: QY - 14, vx: 0, vy: -20, l: 1, t: '-1 egg', f: 12, c: '#c9a6ff', g: 0 });
            }
            else {
                var fd = Math.round(S.food * TUNING.rivals.foodShare);
                S.food -= fd;
                f.fd = fd;
                fx.push({ x: QX, y: QY - 14, vx: 0, vy: -20, l: 1, t: '-' + fmt(fd) + ' food', f: 12, c: '#c9a6ff', g: 0 });
            }
            f.dir = -1;
        }
        return true;
    }
    f.p -= sp * 1.15 * dt;
    if (f.p <= f.ex) {
        // got away
        if (f.egg)
            RV.lost++;
        return false;
    }
    return true;
}

// a raider died: an egg it was carrying is dropped and saved
function rivalDrop(f) {
    if (f.egg) {
        S.eggs.push(f.egg);
        RV && RV.saved++;
        var a = at(f.p);
        fx.push({ x: a.x, y: a.y - 12, vx: 0, vy: -22, l: 1.2, t: 'egg saved!', f: 12, c: '#fff3c4', g: 0 });
    }
    else if (f.fd)
        S.food = Math.min(foodCap(), S.food + f.fd);
}

function rivalEnd() {
    var R = TUNING.rivals, lost = RV.lost;
    if (lost) {
        feed('The raiders got away with ' + lost + ' egg' + (lost > 1 ? 's' : '') + '.', 'bad', null);
        toast('The raiders got away with ' + lost + ' egg' + (lost > 1 ? 's' : '') + '. More soldiers on patrol would stop them sooner.');
        SFX.lose && tn(220, .4, 'sawtooth', .08, .5);
    }
    else {
        var f = Math.round(foodCap() * R.lootShare);
        S.food = Math.min(foodCap(), S.food + f);
        gainJelly(R.winJelly);
        S.rvWins = (S.rvWins || 0) + 1;
        feed('Raid beaten! Not one egg lost.', 'good', null);
        toast('Raid beaten! Not one egg lost. +' + fmt(f) + ' food from the raiders.' + (RV.saved ? ' ' + RV.saved + ' egg' + (RV.saved > 1 ? 's' : '') + ' rescued.' : ''));
        SFX.victory();
    }
    if (RV.hid)
        feed('Your nurses hid the brood from ' + RV.hid + ' raider' + (RV.hid > 1 ? 's' : '') + '.', 'good', null);
    counterOffer(RV.k);
    RV = null;
    rvT = R.gapMin + Math.random() * R.gapRand;
}

// the scout, drawn in its side tunnel during the warning
function drawRivalScout(now) {
    if (!RV || RV.ph !== 'scout' || !BP[RV.k])
        return;
    var q = BP[RV.k], a = at(RV.u, q), back = RV.t / TUNING.rivals.scoutLead >= .6;
    cx.save();
    cx.translate(0, -cam);
    drawFoe(a.x, a.y, a.ang + (back ? 0 : Math.PI), rivalSz(), 4, now * .02);
    cx.restore();
}
function rivalSz() { return 4.6 + S.tier * .5; }
// a rival ant: dark violet armour with a pale glow, so it never looks like one of yours
function foeRival(sz, ph, carry) {
    antBody(sz * .42, ph, 9);
    if (carry) {
        cx.fillStyle = '#fff7e2';
        cx.beginPath();
        cx.ellipse(sz * 1.25, 0, sz * .32, sz * .24, 0, 0, 7);
        cx.fill();
    }
}

function nsRaiderAt(f) {
    var u = Math.max(0, (f.p - .9) / .1), x0 = NS.W * .5 + f.o * 6, y0 = nsY(0) - 6, x1 = nsXf().x + 58 + f.o * 4, y1 = nsQY() + 10;
    return { x: x0 + (x1 - x0) * u, y: y0 + (y1 - y0) * u, ang: Math.atan2(y1 - y0, x1 - x0) };
}
// the raid seen in the Nest tab: raiders come in at the top and run for the egg pile and back out
function nsRaiders(g, t) {
    foes.forEach(function (f) {
        if (!f.rv || f.p < .9)
            return;
        var r = nsRaiderAt(f);
        g.save();
        g.translate(r.x, r.y);
        g.rotate(r.ang + (f.dir < 0 ? Math.PI : 0));
        var c0 = cx;
        cx = g;
        foeRival(rivalSz() * 1.8, t * 12 + f.o, !!f.egg);
        cx = c0;
        g.restore();
    });
}
