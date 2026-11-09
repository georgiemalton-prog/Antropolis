/* ui/events.js
   Random events, achievements, the golden beetle and worms.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

// golden beetle: a rare shiny visitor that scuttles across the soil
var gold = null, goldNext = 150;
function goldTick(dt) {
    if (!gold) {
        if (popn() < 8)
            return;
        goldNext -= dt * heroB(3);
        if (goldNext > 0)
            return;
        var gd = Math.random() < .5 ? 1 : -1;
        gold = { x: gd > 0 ? wideL() - 20 : wideR() + 20, y: Math.max(90, Math.min(QY - 160, H * (.2 + Math.random() * .55))), d: gd, t: 0, ph: Math.random() * 6 };
        if (!S.goldSeen) {
            S.goldSeen = 1;
            toast('A golden beetle! Tap it on the Tunnel tab before it gets away.');
        }
        return;
    }
    gold.t += dt;
    gold.x += 24 * gold.d * dt;
    if (gold.x > wideR() + 30 || gold.x < wideL() - 30 || gold.t > 60) {
        gold = null;
        goldNext = 240 + Math.random() * 240;
    }
}
function goldTap(wx, wy) {
    if (!gold || Math.hypot(gold.x - wx, gold.y + Math.sin(gold.t * 2 + gold.ph) * 3 - wy) > 24 + 10 / uz)
        return false;
    var r = Math.random(), f = Math.max(20, Math.round(foodCap() * .04)), j = 1 + Math.floor(S.tier / 2), msg;
    if (r < .55) {
        S.food = Math.min(foodCap(), S.food + f);
        msg = '+' + fmt(f) + ' food';
    }
    else if (r < .9) {
        gainJelly(j);
        msg = '+' + j + ' royal jelly';
    }
    else {
        S.food = Math.min(foodCap(), S.food + f);
        gainJelly(j);
        msg = '+' + fmt(f) + ' food and +' + j + ' jelly';
    }
    S.goldN = (S.goldN || 0) + 1;
    burst(gold.x, gold.y, 26, ['#ffd23f', '#fff3b0', '#ffb300'], 90);
    toast('Caught the golden beetle! ' + msg);
    SFX.win();
    gold = null;
    goldNext = 240 + Math.random() * 240;
    return true;
}
function drawGold(now) {
    if (!gold)
        return;
    var t = now * .001, y = gold.y + Math.sin(gold.t * 2 + gold.ph) * 3, k, a;
    cx.save();
    cx.translate(0, -cam);
    cx.save();
    cx.globalCompositeOperation = 'lighter';
    glow(gold.x, y, 26, '255,200,70', .45 + .15 * Math.sin(t * 6));
    cx.restore();
    cx.translate(gold.x, y);
    cx.scale(gold.d, 1);
    cx.strokeStyle = '#6a4a10';
    cx.lineWidth = 1;
    for (k = -1; k <= 1; k++) {
        a = Math.sin(t * 18 + k * 2) * 2;
        cx.beginPath();
        cx.moveTo(k * 3, 2);
        cx.lineTo(k * 3 + a - 2, 7);
        cx.moveTo(k * 3, -2);
        cx.lineTo(k * 3 + a - 2, -7);
        cx.stroke();
    }
    cx.fillStyle = '#c98a10';
    cx.beginPath();
    cx.ellipse(0, 0, 8, 5.5, 0, 0, 7);
    cx.fill();
    cx.fillStyle = '#ffd23f';
    cx.beginPath();
    cx.ellipse(-.5, -.6, 7, 4.6, 0, 0, 7);
    cx.fill();
    cx.strokeStyle = '#a06a08';
    cx.beginPath();
    cx.moveTo(-6, 0);
    cx.lineTo(7, 0);
    cx.stroke();
    cx.fillStyle = 'rgba(255,255,255,.7)';
    cx.beginPath();
    cx.ellipse(-2, -2.4, 3, 1.1, -.2, 0, 7);
    cx.fill();
    cx.fillStyle = '#8a5a08';
    cx.beginPath();
    cx.ellipse(8.4, 0, 3, 2.6, 0, 0, 7);
    cx.fill();
    cx.restore();
}

var wormNext = 40;

function wormTick(dt) {
    if (!worm && popn() >= 8) {
        wormNext -= dt;
        if (wormNext <= 0) {
            var wd = Math.random() < .5 ? 1 : -1, wyy = Math.max(70, Math.min(QY - 150, (tab === 'col' ? 0 : cam) + H * (.25 + Math.random() * .5)));
            worm = { x: wd > 0 ? wideL() - 40 : wideR() + 40, y: wyy, t: 0, d: wd };
            wormNext = 110 + Math.random() * 150;
            if (!S.wormSeen) {
                S.wormSeen = 1;
                toast('An earthworm wriggles through the soil. Watch for it.');
            }
        }
    }
    if (worm) {
        worm.t += dt;
        worm.x += 16 * worm.d * dt;
        if (worm.x > wideR() + 50 || worm.x < wideL() - 50) {
            worm = null;
            var wf = Math.min(foodCap() - S.food, Math.max(12, Math.round(foodCap() * .008)));
            S.food += Math.max(0, wf);
            S.wormN = (S.wormN || 0) + 1;
            if (S.wormN <= 3)
                toast('The worm left rich castings behind. +' + Math.round(wf) + ' food.');
        }
    }
}

// random events: good surprises, trouble and two-way choices
var evT = 300, rainT = 0, rainSeed = 0;
function evPct(p) { return Math.round(foodCap() * p); }
function evSpot() { var q = BP && BP.length && S.sideTunnels > 0 ? BP[Math.floor(Math.random() * Math.min(S.sideTunnels, BP.length))] : MAIN, a = at(.2 + Math.random() * .7, q); return a; }
var EV_GOOD = [
    { n: 'lucky', t: 1, f: function () { var f = evPct(.08); S.food = Math.min(foodCap(), S.food + f); var a = evSpot(); burst(a.x, a.y, 20, ['#ffd23f', '#fff'], 70); toast('Workers dug into a seed hoard. +' + fmt(f) + ' food.'); } },
    { n: 'rain', t: 1, f: function () { rainT = 25; var f = evPct(.06); S.food = Math.min(foodCap(), S.food + f); toast('Warm rain! The surface blooms with food. +' + fmt(f) + ' food.'); } },
    { n: 'bloom', t: 2, f: function () { gainJelly(1 + Math.floor(S.tier / 2)); toast('A flower bloom! Foragers bring back royal nectar.'); } },
    { n: 'rest', t: 1, f: function () { marchers.forEach(function (m) { m.en = Math.min(100, (m.en == null ? 80 : m.en) + 30); }); toast('A calm, cool day. The whole colony feels rested.'); } }
];
var EV_BAD = [
    { n: 'cavein', t: 2, f: function () { var f = Math.min(S.food, evPct(.05)), a = evSpot(); S.food -= f; burst(a.x, a.y, 30, ['#8a6340', '#5a3d26', '#c9a070'], 60); shake = Math.max(shake, .3); toast('Cave-in! Workers spent ' + fmt(f) + ' food clearing the rubble.'); } },
    { n: 'flood', t: 2, f: function () { var f = Math.min(S.food, evPct(.06)); S.food -= f; var a = evSpot(); burst(a.x, a.y, 22, ['#6fb4e0', '#cfe8f7'], 60); toast('A spring overflowed! ' + fmt(f) + ' food was spoiled by the water.'); } },
    { n: 'sick', t: 2, f: function () { S.mites = Math.min(1, (S.mites || 0) + .35); toast('Sickness in the nest! Put nurses on the infirmary.'); } },
    { n: 'heat', t: 3, f: function () { marchers.forEach(function (m) { m.en = Math.max(8, (m.en == null ? 80 : m.en) - 40); }); toast('A heatwave! The ants are worn out and need rest.'); } }
];
var EV_CHOICE = [
    { n: 'trader', t: 2, title: 'A travelling beetle', text: 'A beetle trader offers rare royal jelly for a hefty price in food.',
      a: function () { return { l: 'Trade ' + fmt(evPct(.25)) + ' food for ' + (2 + S.tier) + ' jelly', ok: S.food >= evPct(.25), f: function () { S.food -= evPct(.25); gainJelly(2 + S.tier); toast('A fair trade. The beetle wanders off, happy.'); } }; },
      b: function () { return { l: 'Send him away', f: function () { toast('The beetle shrugs and crawls on.'); } }; } },
    { n: 'egg', t: 2, title: 'A strange egg', text: 'Nurses found an odd golden egg in the pile. It might hatch something special, but it needs feeding.',
      a: function () { return { l: 'Nurture it (' + fmt(evPct(.12)) + ' food)', ok: S.food >= evPct(.12), f: function () { S.food -= evPct(.12); if (Math.random() < .6) { addc(4, 1); toast('It hatches into a Super Major!'); } else { addc(2, 3); toast('Three strong soldiers hatch from the egg.'); } } }; },
      b: function () { return { l: 'Leave it', f: function () { toast('The nurses leave the egg alone.'); } }; } },
    { n: 'scouts', t: 3, title: 'Rival scouts', text: 'Scouts from a rival colony are probing your outer tunnels.',
      a: function () { return { l: 'Drive them off (soldiers)', f: function () { var str = S.soldiers * (1 + .25 * S.classLevel[2]) + S.superMajors * 10; if (str >= 40 + S.tier * 40) { var g = evPct(.06); S.food = Math.min(foodCap(), S.food + g); toast('Your soldiers chase them off and take ' + fmt(g) + ' food.'); } else { var l = Math.min(S.food, evPct(.05)); S.food -= l; toast('The scouts slip away with ' + fmt(l) + ' food.'); } } }; },
      b: function () { return { l: 'Pay tribute (' + fmt(evPct(.08)) + ' food)', ok: S.food >= evPct(.08), f: function () { S.food -= evPct(.08); toast('The scouts leave peacefully.'); } }; } }
];

function evShow(e) {
    var A = e.a(), B = e.b();
    $('evtt').textContent = e.title;
    $('evtp').textContent = e.text;
    [['evta', A], ['evtb', B]].forEach(function (p) {
        var el = $(p[0]), o = p[1];
        el.innerHTML = '<b>' + o.l + '</b>';
        el.disabled = o.ok === false;
        el.onclick = function () { $('evt').classList.remove('on'); S.evN = (S.evN || 0) + 1; o.f(); };
    });
    $('evt').classList.add('on');
    SFX.win();
}

function evTick(dt) {
    if (rainT > 0)
        rainT -= dt;
    if (S.tier < 1 || popn() < 15 || dead)
        return;
    evT -= dt;
    if (evT > 0)
        return;
    if (foes.length || document.querySelector('.over.on, .intro.on')) {
        evT = 20;
        return;
    }
    evT = 420 + Math.random() * 300;
    var r = Math.random(), L = r < .45 ? EV_GOOD : r < .75 ? EV_BAD : EV_CHOICE;
    L = L.filter(function (e) { return e.t <= S.tier; });
    if (!L.length)
        return;
    var e = L[Math.floor(Math.random() * L.length)];
    S.evN = (S.evN || 0) + (e.title ? 0 : 1);
    if (e.title)
        evShow(e);
    else
        e.f();
}

var ACH = [
    { id: 'h1k', n: 'First thousand', d: 'Hatch 1,000 ants in one colony.', v: function () { return S.totalHatched; }, m: 1000, r: 1 },
    { id: 'h10k', n: 'Ten thousand strong', d: 'Hatch 10,000 ants in one colony.', v: function () { return S.totalHatched; }, m: 10000, r: 2 },
    { id: 'h50k', n: 'A living city', d: 'Hatch 50,000 ants in one colony.', v: function () { return S.totalHatched; }, m: 50000, r: 4 },
    { id: 'p1k', n: 'Crowded halls', d: 'Have 1,000 ants alive at once.', v: function () { return popn(); }, m: 1000, r: 1 },
    { id: 'p3k', n: 'Standing room only', d: 'Have 3,000 ants alive at once.', v: function () { return popn(); }, m: 3000, r: 2 },
    { id: 'w25', n: 'Holding the line', d: 'Survive 25 waves.', v: function () { return S.wave; }, m: 25, r: 1 },
    { id: 'w50', n: 'Unbreakable', d: 'Survive 50 waves.', v: function () { return S.wave; }, m: 50, r: 2 },
    { id: 'w100', n: 'Legend of the tunnels', d: 'Survive 100 waves.', v: function () { return S.wave; }, m: 100, r: 4 },
    { id: 't3', n: 'Anthill raised', d: 'Reach the Anthill stage.', v: function () { return S.tier; }, m: 3, r: 1 },
    { id: 't4', n: 'Supercolony', d: 'Reach the Supercolony stage.', v: function () { return S.tier; }, m: 4, r: 2 },
    { id: 'tn12', n: 'Honeycomb', d: 'Dig 12 side tunnels.', v: function () { return S.sideTunnels; }, m: 12, r: 1 },
    { id: 'tn19', n: 'Master diggers', d: 'Dig all 19 side tunnels.', v: function () { return S.sideTunnels; }, m: 19, r: 3 },
    { id: 'rch', n: 'Far horizons', d: 'Dig sideways twice.', v: function () { return S.reach || 0; }, m: 2, r: 2 },
    { id: 'dp', n: 'Deep diggers', d: 'Dig all four deep layers.', v: function () { return S.deep || 0; }, m: 4, r: 3 },
    { id: 'fnd', n: 'Treasure hunters', d: 'Uncover 14 finds.', v: function () { return Object.keys(S.rare).length; }, m: 14, r: 2 },
    { id: 'trm', n: 'Termite terror', d: 'Beat 5 termite raids.', v: function () { return S.termWins || 0; }, m: 5, r: 2 },
    { id: 'cav', n: 'Grand cavern', d: 'Raise the nest cavern to level 11.', v: function () { return S.cavLevel || 0; }, m: 10, r: 3 },
    { id: 'bld', n: 'Master builders', d: 'Own all seven buildings.', v: function () { var c = 0; for (var k in S.bld) if (S.bld[k] > 0) c++; return c; }, m: 7, r: 1 },
    { id: 'cl8', n: 'Peak of the class', d: 'Take any ant class to level 8.', v: function () { return Math.max(S.queenLevel || 0, Math.max.apply(null, S.classLevel)); }, m: 8, r: 2 },
    { id: 'bq', n: 'Royal feasts', d: 'Hold 10 royal banquets.', v: function () { return S.banqN || 0; }, m: 10, r: 1 },
    { id: 'g2', n: 'The heir', d: 'Begin Generation II.', v: function () { return P.gen || 0; }, m: 1, r: 1 },
    { id: 'g4', n: 'Dynasty', d: 'Begin Generation IV.', v: function () { return P.gen || 0; }, m: 3, r: 3 }
];
var achT = 0;

function achTick(dt) {
    achT -= dt;
    if (achT > 0)
        return;
    achT = 2;
    P.ach = P.ach || {};
    ACH.forEach(function (a) {
        if (P.ach[a.id] || !(a.v() >= a.m))
            return;
        P.ach[a.id] = 1;
        P.legacy += a.r;
        toast('Achievement: ' + a.n + '! +' + a.r + ' legacy.');
        SFX.win();
        flash = Math.max(flash, .3);
    });
}

function achHtml() {
    var done = 0, rows = ACH.map(function (a) {
        var got = P.ach && P.ach[a.id], v = Math.min(a.m, Math.floor(a.v()));
        if (got)
            done++;
        return '<div style="display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.06);opacity:' + (got ? 1 : .7) + '"><span><b style="color:' + (got ? '#ffd23f' : 'inherit') + '">' + (got ? '\u2605 ' : '') + a.n + '</b><br><span class="mute">' + a.d + '</span></span><span class="mute" style="white-space:nowrap;text-align:right">' + (got ? 'Done' : fmt(v) + ' / ' + fmt(a.m)) + '<br>+' + a.r + ' legacy</span></div>';
    });
    return '<p class="mute" style="margin:0 0 4px">' + done + ' of ' + ACH.length + ' earned. Each one gives legacy to spend on perks.</p>' + rows.join('');
}
