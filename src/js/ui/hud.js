/* ui/hud.js
   The HUD, tabs, the Next up card, goals and the Great Colony.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

// ---- hud, screens and tutorial ----

function ui() { ordersUi(); greatUi(); hudColony(); hudClasses(); renderGoals(); var n = performance.now(), dt = Math.min(.1, (n - ltx) / 1000); ltx = n; extra(dt); }

function hudColony() {
    var pop = popn(), cap = capN(), gap = layGap();
    $('ants').textContent = pop;
    var fv = Math.floor(S.food);
    if (fv > lastFd) {
        var ae = $('aps');
        ae.classList.remove('bump');
        void ae.offsetWidth;
        ae.classList.add('bump');
    }
    lastFd = fv;
    $('aps').textContent = fv;
    $('jel').textContent = S.jelly;
    $('hpt').textContent = Math.ceil(S.queenHp) + ' / ' + hpMax();
    $('hpb').style.width = Math.max(0, S.queenHp / hpMax() * 100) + '%';
    $('stb').style.width = (Math.max(0, 1 - S.layTimer / gap) * 100) + '%';
    $('stt').textContent = pop + S.eggs.length >= cap ? 'Nest full' : S.food < eggCost() ? 'Need food' : Math.ceil(S.layTimer) + 's';
    $('hint').textContent = restTxt() + 'Ants ' + pop + ' of ' + cap + '. Eggs ' + S.eggs.length + '. ' + (S.dug < 1 ? (S.workers < 1 ? 'You need a worker to dig. Keep hatching eggs. ' : 'Your workers are digging out. ') : 'Foragers bring food, soldiers guard the nest. ') + 'Tap the queen to hurry the next egg.';
    $('tst').innerHTML = S.dug < 1 ? (S.workers < 1 ? 'No workers left to dig. Hatch a <b>worker</b> to continue.' : (S.dug >= .8 && digCap() < 1 ? 'The tunnel is held just below the surface. Reach the ' + T[2].n + ' with 40 ants to break through. Until then your ants gather food underground.' : 'Your workers are digging up to the surface: <b>' + Math.floor(S.dug * 100) + '%</b>')) : foes.length ? '<b>Invaders in the tunnel: ' + foes.length + '</b>' : 'The tunnel is open. Foragers are out gathering food.';
    $('tdf').textContent = 'Digging through ' + SOILN[soilAt(frontY())].toLowerCase() + (S.tier < 2 ? '' : SOILM[soilAt(frontY())] < 1 ? ' (slow)' : SOILM[soilAt(frontY())] > 1 ? ' (fast)' : '') + '. Soldiers ' + S.soldiers + ', foragers ' + S.foragers + '. Defense ' + fmt(dps()) + ' damage/s. Wave ' + (S.wave + 1) + ' is next.';
    var nt = T[S.tier + 1], tb = $('tierbtn');
    if (nt) {
        tb.innerHTML = '<span><b>Dig a ' + nt.n + '</b><span class="mute">Needs ' + TP[S.tier + 1] + ' ants and ' + TF[S.tier + 1] + ' food. Room for ' + CAPS[S.tier + 1] + ' ants and a new chamber.</span></span>';
        tb.disabled = pop < TP[S.tier + 1] || S.food < TF[S.tier + 1];
    }
    else {
        tb.innerHTML = '<span><b>Fully dug</b><span class="mute">Take a royal flight to start stronger.</span></span>';
        tb.disabled = true;
    }
    if (!hudColony.at || performance.now() - hudColony.at > 2000) {
        hudColony.at = performance.now();
        nextUpUi();
        dailyUi();
        questsUi();
        shopUi();
        storeUi();
        heroUi();
        $('ach').innerHTML = achHtml();
    }
    var g = gain();
    $('prinfo').textContent = 'Generation ' + genName(genNum()) + '. A new queen restarts your colony. You keep legacy, which strengthens every future colony. Legacy to spend: ' + P.legacy + '.';
    fly.innerHTML = '<span><b>Royal flight</b><span class="mute">' + (g >= 1 ? 'Found Generation ' + genName(genNum() + 1) + ' and earn ' + g + ' legacy. ' + headText(genNum()) : 'Dig out an Anthill to unlock royal flights.') + '</span></span>';
    fly.disabled = g < 1;
    LG.forEach(function (l) { var el = $('l-' + l.id), lv = pk(l.id), c = (lv + 1) * 2, lk = (P.gen || 0) < (l.gen || 0); el.innerHTML = '<span><b>' + l.n + ' ' + lv + '/5</b><span class="mute">' + (lk ? 'Unlocks in ' + l.gl + '.' : l.d) + '</span></span><span class="r">' + (lk ? 'Locked' : lv >= 5 ? 'Maxed' : c + ' legacy') + '</span>'; el.disabled = lk || lv >= 5 || P.legacy < c; });
}

// the "Next up" card: one clear suggestion, so the player does not have to read every list
function nextUp() {
    var pop = popn(), c = [], nt = T[S.tier + 1], i, f = S.food, j = S.jelly;
    function add(k, name, ok, f1, j1, to, extra) { c.push({ k: k, n: name, ok: ok, f: f1 || 0, j: j1 || 0, to: to, pf: Math.min(1, f1 ? f / f1 : 1, j1 ? j / j1 : 1), x: extra }); }
    if (nt)
        c.push({ k: 'nest', n: 'Dig a ' + nt.n, ok: pop >= TP[S.tier + 1] && f >= TF[S.tier + 1], f: TF[S.tier + 1], j: 0, to: 'tier', pf: Math.min(1, pop / TP[S.tier + 1], f / TF[S.tier + 1]), x: 'Needs ' + TP[S.tier + 1] + ' ants and ' + fmt(TF[S.tier + 1]) + ' food.' });
    [6, 0, 1, 2, 3, 4, 5].forEach(function (ri) {
        var q = ri === 5, lv = q ? S.queenLevel : S.classLevel[ri];
        if (lv < 8 && (ri !== 4 || S.superMajors > 0 || S.tier >= 3))
            add('cl' + ri, (q ? 'The Queen' : CN[ri] + 's') + ' to level ' + (lv + 1), j >= clCost(ri), 0, clCost(ri), 'bl', 'Costs ' + clCost(ri) + ' jelly.');
    });
    BDEF.forEach(function (b, bi) {
        var lv = S.bld[b.id];
        if (!S.proj && lv < 4 && S.tier >= b.t)
            add('b' + bi, b.n + ' level ' + (lv + 1), f >= bCost(bi), bCost(bi), 0, 'build', 'Costs ' + fmt(bCost(bi)) + ' food.');
    });
    for (i = 0; i < 4; i++)
        if (S.tier > i && rl(i) < 4)
            add('r' + i, ROOMS[i].n + ' level ' + (rl(i) + 2), f >= roomCost(i).f && j >= roomCost(i).j, roomCost(i).f, roomCost(i).j, 'rooms', 'Costs ' + fmt(roomCost(i).f) + ' food, ' + roomCost(i).j + ' jelly.');
    if (S.tier >= 2 && (S.cavLevel || 0) < 10 && !((S.cavLevel || 0) >= 5 && S.tier < 4))
        add('cav', 'Nest cavern level ' + ((S.cavLevel || 0) + 2), f >= cavCost().f && j >= cavCost().j, cavCost().f, cavCost().j, 'rooms', 'More room for ants. Costs ' + fmt(cavCost().f) + ' food, ' + cavCost().j + ' jelly.');
    if (S.tier >= 3 && (S.reach || 0) < 2 && S.tier >= 3 + (S.reach || 0))
        add('rch', 'Dig sideways', f >= reachCost().f && j >= reachCost().j, reachCost().f, reachCost().j, 'rooms', 'New ground to explore. Costs ' + fmt(reachCost().f) + ' food, ' + reachCost().j + ' jelly.');
    if (S.tier >= 3 && (S.deep || 0) < 4 && deepGenOk(S.deep || 0) && S.tier >= ((S.deep || 0) < 2 ? 3 : 4))
        add('dp', 'Dig deeper', f >= deepCost().f && j >= deepCost().j, deepCost().f, deepCost().j, 'rooms', 'A new soil layer below the queen. Costs ' + fmt(deepCost().f) + ' food, ' + deepCost().j + ' jelly.');
    var ready = c.filter(function (x) { return x.ok; });
    if (ready.length)
        return { t: ready[0].n, d: ready[0].x, ready: true, more: ready.length - 1, to: ready[0].to, k: ready[0].k };
    c.sort(function (a, b) { return b.pf - a.pf; });
    if (!c.length)
        return { t: 'Everything is built', d: 'Take a royal flight to start a stronger colony.', ready: false, more: 0, to: null };
    return { t: 'Saving up: ' + c[0].n, d: Math.round(c[0].pf * 100) + '% there. ' + (c[0].x || ''), ready: false, more: 0, to: c[0].to, k: c[0].k };
}

function nextUpUi() {
    var el = $('nextup'), nu = nextUp(), h;
    if (!el)
        return;
    h = '<button class="card' + (nu.ready ? ' dig' : '') + '" style="margin:0 0 10px;display:block;width:100%;text-align:left" ' + (nu.to ? 'onclick="nextGo(\'' + nu.to + '\',\'' + (nu.k || '') + '\')"' : '') + '><span><span class="mute" style="font-size:12px;letter-spacing:.12em">' + (nu.ready ? 'READY NOW' : 'NEXT UP') + '</span><br><b>' + nu.t + '</b><span class="mute">' + nu.d + (nu.more ? ' ' + nu.more + ' more thing' + (nu.more > 1 ? 's' : '') + ' ready too.' : '') + '</span></span></button>';
    if (el.getAttribute('data-h') !== h) {
        el.setAttribute('data-h', h);
        el.innerHTML = h;
    }
}

function nextGo(to, k) {
    var t = $(to === 'rooms' ? 'rooms' : to === 'build' ? 'build' : to === 'bl' ? 'bl' : 'tier'), g = to === 'bl' ? 'ants' : 'build', tb, sec, el = null, f;
    if (!t)
        return;
    tb = document.querySelector('#ctabs button[data-c="' + g + '"]');
    if (tb && $('p-col').getAttribute('data-g') !== g)
        tb.click();
    sec = t.closest ? t.closest('.sec') : null;
    if (sec && sec.style.display === 'none' && sec.previousSibling)
        sec.previousSibling.click();
    k = k || '';
    // the button for this exact upgrade
    if (k === 'nest')
        el = $('tierbtn');
    else if (k.indexOf('cl') === 0)
        el = $('ro-' + k.slice(2));
    else {
        f = k[0] === 'b' ? 'startBuild(' + k.slice(1) + ')' : k[0] === 'r' && k !== 'rch' ? 'upRoom(' + k.slice(1) + ')' : k === 'cav' ? 'upCav()' : k === 'rch' ? 'upReach()' : k === 'dp' ? 'upDeep()' : '';
        if (f)
            el = $('p-col').querySelector('button[onclick="' + f + '"]');
    }
    el = el || t;
    setTimeout(function () {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (el.tagName === 'BUTTON') {
            el.classList.remove('flashme');
            void el.offsetWidth;
            el.classList.add('flashme');
            setTimeout(function () { el.classList.remove('flashme'); }, 2200);
        }
    }, 60);
}

function hudClasses() {
    var pop = popn(), ij = injN(), i;
    var rt = '<div class="ol" style="margin:4px 0 6px">Nest chambers</div>';
    for (i = 0; i < 4; i++) {
        if (S.tier <= i) {
            rt += '<div class="mute" style="margin:0 0 6px">' + ico(RICO[i]) + 'Locked: ' + ROOMS[i].n + ', ' + ROOMS[i].b + '</div>';
            continue;
        }
        var lv = rl(i), c = roomCost(i), bt = ROOMT[i].replace('%s', Math.round(ROOMB[i] * (1 + .2 * lv) * 100) + '%');
        rt += '<button class="card dig" ' + (lv >= 4 || S.food < c.f || S.jelly < c.j ? 'disabled ' : '') + 'onclick="upRoom(' + i + ')" style="margin:0 0 6px"><span><b>' + ico(RICO[i]) + ROOMS[i].n + ' ' + (lv + 1) + '/5</b><span class="mute">Bonus: ' + bt + '</span></span><span class="r">' + (lv >= 4 ? 'Maxed' : fmt(c.f) + ' food, ' + c.j + ' jelly') + '</span></button>';
    }
    if (S.tier >= 2) {
        var cl = S.cavLevel || 0, cc = cavCost(), clk = cl >= 5 && S.tier < 4;
        rt += '<button class="card dig" ' + (cl >= 10 || clk || S.food < cc.f || S.jelly < cc.j ? 'disabled ' : '') + 'onclick="upCav()" style="margin:0 0 6px"><span><b>' + ico('cave') + 'Nest cavern ' + (cl + 1) + '/11</b><span class="mute">' + (clk ? 'Needs ' + T[4].n + ' for more levels' : 'Room for ' + Math.round(CAPS[S.tier] * .2) + ' more ants per level') + '</span></span><span class="r">' + (cl >= 10 ? 'Maxed' : fmt(cc.f) + ' food, ' + cc.j + ' jelly') + '</span></button>';
    }
    if (S.tier >= 3)
        rt += '<div class="ol" style="margin:12px 0 6px">Expand and boost</div>';
    if (S.tier >= 3) {
        var bq = banqReady(), bc = banqCost();
        rt += '<button class="card dig" ' + (!bq || S.food < bc ? 'disabled ' : '') + 'onclick="upBanq()" style="margin:0 0 6px"><span><b>' + ico('jelly') + 'Royal banquet</b><span class="mute">Turn spare food into ' + banqYield() + ' royal jelly. ' + (bq ? 'Ready.' : 'Needs more food.') + '</span></span><span class="r">' + fmt(bc) + ' food</span></button>';
    }
    if (S.tier >= 3 || S.reach) {
        var rc = S.reach || 0, rcc = reachCost(), lockedR = S.tier < 3 + rc;
        rt += '<button class="card dig" ' + (rc >= 2 || lockedR || S.food < rcc.f || S.jelly < rcc.j ? 'disabled ' : '') + 'onclick="upReach()" style="margin:0 0 6px"><span><b>' + ico('reach') + 'Dig sideways ' + (rc + 1) + ' of 2</b><span class="mute">' + (rc >= 2 ? 'The whole underground is open' : lockedR ? 'Needs ' + T[3 + rc].n : 'Opens new ground west and east') + '</span></span><span class="r">' + (rc >= 2 ? 'Maxed' : fmt(rcc.f) + ' food, ' + rcc.j + ' jelly') + '</span></button>';
    }
    if (S.tier >= 3 || S.deep) {
        var dl2 = S.deep || 0, dcc = deepCost(), lockedD = S.tier < (dl2 < 2 ? 3 : 4), genLk = dl2 < 4 && !deepGenOk(dl2);
        rt += '<button class="card dig" ' + (dl2 >= 4 || lockedD || genLk || S.food < dcc.f || S.jelly < dcc.j ? 'disabled ' : '') + 'onclick="upDeep()" style="margin:0 0 6px"><span><b>' + ico('deep') + 'Dig deeper ' + Math.min(4, dl2 + 1) + ' of 4' + (dl2 < 4 ? ': ' + DLAY[dl2].n : '') + '</b><span class="mute">' + (dl2 >= 4 ? 'You have reached bedrock' : genLk ? deepGenTxt(dl2) : lockedD ? 'Needs ' + T[4].n : (dl2 === 0 ? 'The Larder: food store +25% and ants work 10 hours while you are away' : dl2 === 1 ? 'The Armoury: a quarter fewer soldier injuries, and termite raids are fought 20% harder' : dl2 === 2 ? 'The Crystal Caves: scouts bring back crystal for up to 4 jelly a day, and golden eggs are 50% more likely' : dl2 === 3 ? 'Bedrock: the bottom of the world, and the Giant Mole\'s cavern' : 'A new soil layer below the queen, with 8% more food storage')) + '</span></span><span class="r">' + (dl2 >= 4 ? 'Maxed' : fmt(dcc.f) + ' food, ' + dcc.j + ' jelly') + '</span></button>';
        rt += moleCard();
    }
    if (S.tier >= 1) {
        var abr = Ads.ready('boost', 15);
        rt += '<button class="card dig" ' + (abr ? '' : 'disabled ') + 'onclick="adBoost()" style="margin:0 0 6px"><span><b>Colony boost</b><span class="mute">' + (P.adfree ? 'Food and jelly for your colony.' : 'Watch a short ad for food and jelly.') + (abr ? '' : ' Ready in ' + Ads.left('boost', 15) + ' min.') + '</span></span><span class="r">' + (P.adfree ? 'Free' : 'Ad') + '</span></button>';
    }
    $('wrow').style.display = S.reach ? 'flex' : 'none';
    $('rooms').innerHTML = rt;
    hillUi();
    $('goal').innerHTML = goalText();
    $('ants').textContent = pop;
    var ch = '';
    ORD.forEach(function (c, n) { ch += '<span class="chip"><i style="background:' + CC[c] + '"></i>' + CN[c] + ' ' + CW[n] + '%</span>'; });
    ch += '<span class="chip gold"><i style="background:' + CC[4] + '"></i>Golden ' + (GOLD * 100).toFixed(2) + '% (1 in ' + Math.round(1 / GOLD) + ')</span>';
    $('chance').innerHTML = ch;
    $('hint').textContent = restTxt() + 'Ants ' + pop + ' of ' + capN() + ', eggs ' + S.eggs.length + '. ' + (S.dug < 1 ? 'Your ants are digging out. ' : 'Foragers bring food, soldiers guard the tunnel. ') + (ij ? ij + ' injured ants are resting. ' : '') + 'Tap the queen to hurry the next egg.';
    var nw = Math.ceil((nf - performance.now()) / 1000);
    $('tst').innerHTML = (RAID ? '<b>Raid on the hill: ' + RT[RAID.t].n + ' (' + Math.max(0, Math.round(RAID.hp / RAID.mhp * 100)) + '% health left)</b><br>' : '') + (S.dug < 1 ? (S.dug >= .8 && digCap() < 1 ? 'The tunnel is held just below the surface. Reach the ' + T[2].n + ' with 40 ants to break through. Until then your ants gather food underground.' : 'Your workers are digging up to the surface: <b>' + Math.floor(S.dug * 100) + '%</b>') : foes.length ? '<b>Invaders in the tunnel: ' + foes.length + '</b>' : (healthy(3) > 0 && nw > 0 ? 'Scouts report the next wave in about <b>' + nw + 's</b>.' : 'The tunnel is open. ' + (healthy(3) > 0 ? 'Scouts are watching.' : 'Hatch a scout to get warning of waves.')));
    $('tdf').textContent = 'Soldiers ' + healthy(2) + (S.superMajors ? ', super majors ' + healthy(4) : '') + ', foragers ' + healthy(1) + ', scouts ' + healthy(3) + '. Defense ' + fmt(dps()) + ' damage per second.';
    $('tin').textContent = ij ? 'Injured and recovering: ' + ij + '. ' + (healthy(0) > 0 ? 'Nurses heal one about every ' + (9 / Math.min(8, healthy(0))).toFixed(1) + 's.' : 'You have no healthy nurses to heal them!') : 'No injured ants.';
    for (i = 0; i < 7; i++) {
        var el = $('ro-' + i), q = i === 5, lv = q ? S.queenLevel : S.classLevel[i], c = clCost(i);
        el.innerHTML = '<span><b><span style="color:' + (q ? '#ffd23f' : CC[i]) + '">\u25cf</span> ' + (q ? 'The Queen' : CN[i] + 's') + ' <span class="mute">level ' + lv + '/8</span></b><span class="mute">' + RD[i] + ' ' + ((lv >= 8 ? 'Mastered: ' + MST[i][1] + '.' : CE[i] + ' ' + (lv < 4 ? 'Mastery at level 4: ' : 'Mastery at level 8: ') + MST[i][lv < 4 ? 0 : 1] + '.')) + '</span></span><span class="r"><span class="own">' + (q ? '' : cnt(i)) + '</span>' + (!q && S.injured[i] ? '<br>' + S.injured[i] + ' injured' : '') + '<br>' + (lv >= 8 ? 'Maxed' : c + ' jelly') + '</span>';
        el.disabled = lv >= 8 || S.jelly < c;
        el.style.display = (i === 4 && !S.superMajors) ? 'none' : '';
    }
}

function goalText() {
    var nt = T[S.tier + 1], pop = popn();
    if (S.dug < 1)
        return '<b>Goal:</b> your workers are digging the tunnel out to the surface. Keep laying eggs for more workers.';
    if (!S.foragers)
        return '<b>Goal:</b> you have no foragers yet. Keep hatching eggs until one appears.';
    if (nt)
        return '<b>Goal:</b> dig a ' + nt.n + ' on the Colony tab. You have ' + pop + ' of ' + TP[S.tier + 1] + ' ants and ' + Math.floor(Math.min(S.food, TF[S.tier + 1])) + ' of ' + TF[S.tier + 1] + ' food.';
    if (S.hillLevel < 5)
        return '<b>Goal:</b> your nest is fully dug. Build the next anthill level on the Colony tab. Raiders will come for it, so keep your soldiers strong.';
    var gn = GREAT.filter(function (g) { return !g.ok(); })[0];
    if (gn)
        return '<b>Great Colony:</b> ' + gn.t + ' (' + gn.n() + '). See the Colony tab.';
    var dl = S.deep || 0;
    if (moleOn() && !S.moleWon)
        return '<b>Goal:</b> the Giant Mole sleeps in the Bedrock (' + Math.ceil(moleHp() / MOLE_MAX * 100) + '% health). Grow your soldiers and attack it from the Colony tab.';
    if (S.moleWon && (S.hall || 0) < 4)
        return '<b>Goal:</b> the Giant Mole is beaten. Raise the Great Hall to level 4 on the Colony tab.';
    if (dl < 4 && deepGenOk(dl))
        return '<b>Goal:</b> dig down to the ' + ['Clay', 'Stone', 'Deep dark', 'Bedrock'][dl] + ' layer on the Colony tab.';
    if (dl < 4)
        return '<b>The Great Colony stands.</b> Take a Royal Flight to reach the ' + ['Clay', 'Stone', 'Deep dark', 'Bedrock'][dl] + ' layer next generation.';
    return '<b>The Great Colony stands.</b> Master every ant class, or start a Royal Flight.';
}

var GREAT = [
    { t: 'Raise the anthill to level 2', n: function () { return Math.min(2, S.hillLevel || 0) + ' / 2'; }, ok: function () { return (S.hillLevel || 0) >= 2; } },
    { t: 'Reach 1,000 ants', n: function () { return fmt(Math.min(1000, popn())) + ' / 1000'; }, ok: function () { return popn() >= 1000; } },
    { t: 'Beat 30 invader waves', n: function () { return Math.min(30, S.wave) + ' / 30'; }, ok: function () { return S.wave >= 30; } },
    { t: 'Raise all three Metropolis districts to level 2', n: function () { return Math.min(2, S.bld.archive) + Math.min(2, S.bld.hatch) + Math.min(2, S.bld.tower) + ' / 6'; }, ok: function () { return S.bld.archive >= 2 && S.bld.hatch >= 2 && S.bld.tower >= 2; } },
    { t: 'Raise the queen to level 6', n: function () { return Math.min(6, S.queenLevel) + ' / 6'; }, ok: function () { return S.queenLevel >= 6; } }
];

function greatDone() { var n = 0; GREAT.forEach(function (g) { if (g.ok())
    n++; }); return n; }

function greatUi() {
    var el = $('great');
    if (!el)
        return;
    var h = '<div class="gcard"><div class="gh">Progress <span>' + greatDone() + ' of ' + GREAT.length + (S.founder ? ' \u2022 Founder' : '') + '</span></div><div class="bar" style="margin:4px 0 8px"><i style="width:' + Math.round(greatDone() / GREAT.length * 100) + '%;background:var(--accent)"></i></div>';
    GREAT.forEach(function (g) { var ok = g.ok(); h += '<div class="gi' + (ok ? '' : ' on') + '"><span class="gk">' + (ok ? '\u2714' : '\u25B6') + '</span><span class="gt">' + g.t + (ok ? '' : ' <em>' + g.n() + '</em>') + '</span></div>'; });
    el.innerHTML = h + '</div>';
}

function showEnding() {
    var e = $('endscr');
    if (e)
        e.classList.add('on');
}

function goalsTick() {
    var G;
    if (!S.founder && S.tier >= 4 && greatDone() >= GREAT.length) {
        S.founder = 1;
        gainJelly(25);
        flash = 1;
        burst(QX, QY, 80, ['#ffd35a', '#fff', '#7fcf8f'], 200);
        SFX.fan();
        showEnding();
    }
    while (S.goalIndex < GOALS.length && GOALS[S.goalIndex].ok()) {
        G = GOALS[S.goalIndex];
        if (G.fd)
            S.food = Math.min(foodCap(), S.food + G.fd);
        if (G.jl)
            gainJelly(G.jl);
        toast('Goal complete: ' + G.t + '  (' + G.r + ')');
        SFX.win();
        pulseRing('255,233,168');
        burst(QX, QY - 20, 24, ['#ffe27a', '#fff', '#9be07a'], 110);
        S.goalIndex++;
    }
}

function renderGoals() {
    var g = $('goals'), p = $('goal'), G;
    if (S.goalIndex >= GOALS.length) {
        document.querySelectorAll('.nav button.nudge').forEach(function (b) { b.classList.remove('nudge'); });
        g.innerHTML = '';
        p.style.display = '';
        return;
    }
    p.style.display = 'none';
    G = GOALS[S.goalIndex];
    g.innerHTML = '<div class="gcard"><div class="gh">Goal ' + (S.goalIndex + 1) + ' of ' + GOALS.length + ' <span>Reward: ' + G.r + '</span></div><div class="gi on"><span class="gk">▶</span><span class="gt">' + G.t + (G.n ? ' <em>' + G.n() + '</em>' : '') + '</span></div>' + (G.h ? '<div class="gh2">' + G.h + '</div>' : '') + '</div>';
    document.querySelectorAll('.nav button').forEach(function (b) { b.classList.toggle('nudge', !!G.tab && b.dataset.t === G.tab && tab !== G.tab); });
}

function foldSections() {
    var root = $('p-col'), sv = {};
    try {
        sv = JSON.parse(localStorage.getItem('thecolony_fold') || '{}');
    }
    catch (e) { }
    [].slice.call(root.querySelectorAll('h2')).forEach(function (h2) {
        var name = h2.textContent.trim(), body = document.createElement('div'), n = h2.nextSibling, nx;
        body.className = 'sec';
        while (n && n.tagName !== 'H2') {
            nx = n.nextSibling;
            body.appendChild(n);
            n = nx;
        }
        h2.parentNode.insertBefore(body, h2.nextSibling);
        var open = sv[name] != null ? sv[name] : (name === 'Next nest' || name === 'Build and upgrade' || name === 'Quests' || name === 'Your ants and queen' || name === 'Heroes' || ((name === 'The Anthill' || name === 'The Great Colony') && S.tier >= 4));
        h2.className = 'fold';
        h2.tabIndex = 0;
        h2.setAttribute('role', 'button');
        function set(o) { open = o; h2.setAttribute('aria-expanded', o); body.style.display = o ? '' : 'none'; h2.classList.toggle('shut', !o); }
        function tg() { set(!open); sv[name] = open; try {
            localStorage.setItem('thecolony_fold', JSON.stringify(sv));
        }
        catch (e) { } }
        set(open);
        h2.onclick = tg;
        h2.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            tg();
        } };
    });

    var CG = { 'Quests': 'today', 'Next nest': 'build', 'Build and upgrade': 'build', 'The Anthill': 'build', 'The Great Colony': 'build', 'Colony orders': 'build', 'Your ants and queen': 'ants', 'Heroes': 'ants', 'Achievements': 'more', 'Royal flight': 'more' };
    [].slice.call(root.querySelectorAll('h2.fold')).forEach(function (h) {
        var g = CG[h.textContent.trim()] || 'more';
        h.setAttribute('data-g', g);
        if (h.nextSibling)
            h.nextSibling.setAttribute('data-g', g);
    });
    $('daily').setAttribute('data-g', 'today');
    var bar = $('ctabs'), TL = [['build', 'Build'], ['ants', 'Ants'], ['today', 'Today'], ['more', 'More']], cg = 'build';
    try {
        cg = localStorage.getItem('thecolony_ct') || 'build';
    }
    catch (e) { }
    if (!CG.Quests || !TL.some(function (t) { return t[0] === cg; }))
        cg = 'build';
    function showG(g) {
        root.setAttribute('data-g', g);
        [].forEach.call(bar.children, function (b) { b.classList.toggle('on', b.getAttribute('data-c') === g); });
        try {
            localStorage.setItem('thecolony_ct', g);
        }
        catch (e) { }
    }
    bar.innerHTML = TL.map(function (t) { return '<button data-c="' + t[0] + '">' + t[1] + '</button>'; }).join('');
    [].forEach.call(bar.children, function (b) { b.onclick = function () { showG(b.getAttribute('data-c')); }; });
    showG(cg);
}

function goTab(t) {
    mapClose();
    tab = t === 'store' ? 'col' : t;
    cv.classList.toggle('tunmode', t === 'tun');
    cv.classList.toggle('nestmode', t !== 'tun');
    document.body.classList.toggle('tt', t === 'tun');
    try {
        localStorage.setItem('thecolony_tab', t);
    }
    catch (e) { }
    sel = null;
    selFollow = false;
    ['nest', 'tun', 'col', 'store'].forEach(function (x) { $('p-' + x).classList.toggle('on', x === t); });
    document.querySelectorAll('.nav button').forEach(function (b) { b.classList.toggle('on', b.dataset.t === t); });
    $('view').style.display = tab === 'col' ? 'none' : '';
    if (t === 'store')
        storeUi(true);
    if (tab !== 'col') {
        sizeT();
        camT = t === 'tun' ? (S.dug < 1 ? camClamp(at(1 - S.dug).y - H / 2) : 0) : WH - H;
        cam = camT;
    }
    tn(400, .05, 'square', .05);
}

function go(t) { goTab(t); cv.style.touchAction = t === 'tun' ? 'none' : 'manipulation'; }

function poll() {
    var n = 0;
    while (n < MSD.length && S.totalHatched >= MSD[n][0])
        n++;
    if (n > (S.milestone || 0)) {
        S.milestone = n;
        celebrate(MSD[n - 1][1]);
    }
    var nt = T[S.tier + 1], f = nt ? Math.min(1, popn() / TP[S.tier + 1], S.food / TF[S.tier + 1]) : 1;
    $('tpb').style.width = (f * 100) + '%';
    $('tpl').textContent = nt ? 'Next nest: ' + nt.n + ' (' + Math.floor(f * 100) + '%)' : 'Fully dug';
}
