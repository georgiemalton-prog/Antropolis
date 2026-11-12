/* threats/waves.js
   Invader waves, loot, losing the queen, the anthill raiders and the spider threat.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

function wave() {
    S.wave++;
    var boss = S.wave % 10 === 0, cnt = boss ? 3 : 1 + Math.floor(S.tier * .8) + (Math.random() < .4 ? 1 : 0), ty = [0, 3, 3];
    if (S.tier >= 2)
        ty.push(1);
    if (S.tier >= 3)
        ty.push(2);
    var tp = ty[Math.floor(Math.random() * ty.length)], base = (bio().en || 1) * 30 * Math.pow(1 + S.totalHatched / 150, .5), prep = 0;
    if (boss) {
        bossWarned = false;
        prep = (S.food >= foodCap() * .4 ? 1 : 0) + (S.orders.gd >= 60 ? 1 : 0) + (S.bld.rax >= 1 ? 1 : 0);
        base *= 1 - .12 * prep;
    }
    foes = [];
    /* Waves grow with your defence so a fight takes roughly the same time however big the colony is.
       Armoured beetles and bosses then take longer unless you have the right answer. */
    var unit = dps() * .85 * (8 + Math.min(S.tier, 4) * 1.2) / cnt * (boss ? 1 - .12 * prep : 1) * (1 - .08 * S.bld.tower);
    for (var i = 0; i < cnt; i++) {
        var b = boss && i === 0, h = Math.max(base * (b ? 2.2 : .65), unit * (b ? 2.2 : 1)) * (tp === 3 ? 1.4 : 1);
        foes.push({ p: -.06 * i, tp: tp, boss: b, hp: h, max: h, kl: tp === 3 ? 1 + Math.floor(Math.random() * 2) : 0, kt: 1.2, at: .5 + Math.random() * .6, tm: .3, acc: 0, o: (i - (cnt - 1) / 2) * 2 });
    }
    wvi = { n: cnt, boss: boss, w: 1 };
    SFX.alarm();
    alarmT = 5;
    var en = at(0);
    alarmAt(en.x, en.y);
    burst(en.x, en.y, boss ? 26 : 14, ['#a07a50', '#7a5636', '#c9a46a'], boss ? 90 : 60);
    fx.push({ x: en.x, y: en.y, vx: 0, vy: 0, l: .7, ring: 6, c: 'rgba(255,90,60,.9)', g: 0 });
    fx.push({ x: en.x, y: en.y - 16, vx: 0, vy: -14, l: 1.2, t: '!', f: boss ? 22 : 17, c: '#ff5a3a', g: 0, pop: 1 });
    if (boss)
        shake = Math.max(shake, .4);
    toast(boss ? 'Boss wave! A giant ' + FN[tp] + ' leads the attack. Preparation ' + prep + ' of 3: it is ' + prep * 12 + '% weaker.' : tp === 0 ? 'Armoured beetles! Soldiers struggle; Super Majors and Barracks cut through the armour.' : 'Wave ' + S.wave + ': ' + cnt + ' ' + FN[tp] + (cnt > 1 ? 's' : '') + ' in the tunnel!');
}

/* The first fight comes early: once the colony is a Burrow with a couple of soldiers, two wood lice dig
   into the half-dug tunnel and crawl towards the queen, long before real waves start at the surface.
   Once per colony (optional save field S.firstFoes). Does not count as a wave. */
var ffT = TUNING.start.firstFoesDelay;
var ffW = 0;
function firstFoesTick(dt) {
    if (S.firstFoes || S.dug >= 1 || S.tier < 1 || S.dug < .15 || healthy(2) < 2 || foes.length || wvi.w || RAID || trm.length)
        return;
    ffT -= dt;
    if (ffT > 0)
        return;
    // the very first invaders: if the player is not watching the tunnel, warn first and let them break in when the
    // Tunnel tab is opened (or after 20 seconds anyway), so the first fight is seen rather than read about
    if (tab !== 'tun' && ffW < 20) {
        if (!ffW)
            toast('Something is scratching at your tunnel! Open the Tunnel tab to see.');
        ffW += dt;
        return;
    }
    S.firstFoes = 1;
    var p0 = 1 - S.dug + .01, cnt = TUNING.start.firstFoes, h = Math.max(4, dps() * TUNING.start.firstFoesHp), a = at(p0), i;
    foes = [];
    for (i = 0; i < cnt; i++)
        foes.push({ p: p0 - .03 * i, tp: 3, boss: false, hp: h, max: h, kl: 0, kt: 1.2, at: .5 + Math.random() * .6, tm: .3, acc: 0, o: (i - (cnt - 1) / 2) * 2 });
    wvi = { n: cnt, boss: false, w: 1, ff: 1 };
    SFX.alarm();
    alarmT = 5;
    burst(a.x, a.y, 16, ['#a07a50', '#7a5636', '#c9a46a'], 60);
    fx.push({ x: a.x, y: a.y, vx: 0, vy: 0, l: .7, ring: 6, c: 'rgba(255,90,60,.9)', g: 0 });
    fx.push({ x: a.x, y: a.y - 16, vx: 0, vy: -14, l: 1.2, t: '!', f: 17, c: '#ff5a3a', g: 0, pop: 1 });
    var fa = at(Math.max(0, 1 - S.dug));
    alarmAt(fa.x, fa.y);
    toast('Wood lice dug into your tunnel! Your soldiers march out to stop them.' + (tab === 'tun' ? '' : ' Watch on the Tunnel tab.'));
}

function loot(p, w) {
    var a = at(p), f = Math.ceil((2 + S.tier * 2) * (w.boss ? 5 : 1 + .5 * w.n));
    S.food = Math.min(foodCap(), S.food + f);
    gainJelly(w.boss ? 5 : 1);
    SFX.victory();
    fx.push({ x: a.x, y: a.y - 10, vx: 0, vy: -28, l: 2, t: '@leaf', f: 22, g: 0 });
    toast((w.boss ? 'Boss defeated! ' : w.ff ? 'The wood lice are beaten! ' : 'Wave cleared! ') + '+' + f + ' food.');
}

function loseGame() {
    dead = true;
    foes = [];
    SFX.lose();
    var h = Math.floor(gain() / 2);
    $('overp').textContent = 'Invaders broke through to the queen. You hatched ' + fmt(S.totalHatched) + ' ants this colony. ' + (h ? 'You keep ' + h + ' legacy.' : 'Hatch more next time to earn legacy.');
    $('adrev').style.display = S.revived ? 'none' : '';
    $('over').classList.add('on');
}

function lose() { loseGame(); if (!(S.nurses + S.foragers + S.soldiers))
    $('overp').textContent = 'Every ant is gone and no eggs remain. The colony has died out.'; }

function discover(k) {
    var t = dType(k), a = at(S.sideDug[k] == null ? 1 : S.sideDug[k], BP[k]), f = Math.ceil(1.6 * (2 + S.tier * 3) * (.6 + Math.random()) * (1 + .3 * S.classLevel[3])), msg = '';
    bph[k] = 1;
    if (t === 0)
        f *= 2;
    if (t === 1 && Math.random() < .4 && gj1())
        msg = ' and a gem';
    if (t === 3 && gj1())
        msg = ' and a fossil';
    if (S.classLevel[3] >= 4)
        f *= 2;
    if (S.classLevel[3] >= 8)
        gj1();
    S.food = Math.min(foodCap(), S.food + f);
    earnAcc += f;
    fx.push({ x: a.x, y: a.y - 8, vx: 0, vy: -24, l: 1.3, t: '+' + f + ' food' + msg, f: 11, c: '#9be07a', g: 0 });
    S.findsSeen = S.findsSeen || {};
    if (!S.findsSeen[t]) {
        S.findsSeen[t] = 1;
        toast('Scouts found a ' + DN[t] + '!');
    }
}

function dType(k) { return Math.floor(rng(S.seed + k * 131 + 5)() * 4); }

// ---- anthill and raiders ----

function hhMax() { return 200 + 100 * (S.hillLevel || 0); }

function hillUi() {
    var b = $('hillbtn'), t = $('hilltx'), hl = S.hillLevel || 0;
    if (!b)
        return;
    if (S.tier < 4) {
        t.textContent = 'Dig the nest all the way to the Supercolony to unlock the anthill on the surface.';
        b.style.display = 'none';
        return;
    }
    b.style.display = '';
    var s = 'Anthill level ' + hl + ' of 5. ' + (hl ? HN.slice(0, hl).join(', ') + '.' : 'Not built yet.') + ' Each level adds 250 ant capacity.';
    if (RAID)
        s += ' A ' + RT[RAID.t].n.toLowerCase() + ' is raiding the hill! (' + Math.max(0, Math.round(RAID.hp / RAID.mhp * 100)) + '% health left)';
    else if (hl)
        s += ' Next raid in about ' + Math.max(1, Math.round(S.raidTimer || 0)) + 's.';
    if (hl < 5) {
        s += ' Next: ' + HN[hl] + '. ' + HB[hl];
        b.textContent = 'Build ' + HN[hl] + ': ' + fmt(HF[hl]) + ' food, ' + HJ[hl] + ' jelly';
        b.disabled = S.food < HF[hl] || S.jelly < HJ[hl];
    }
    else {
        b.textContent = 'Anthill complete';
        b.disabled = true;
    }
    t.textContent = s;
}

function buildHill() { var hl = S.hillLevel || 0; if (S.tier < 4 || hl >= 5 || S.food < HF[hl] || S.jelly < HJ[hl])
    return; S.food -= HF[hl]; S.jelly -= HJ[hl]; S.hillLevel = hl + 1; S.hillHp = hhMax(); if (S.raidTimer == null || S.raidTimer > 150)
    S.raidTimer = 90; SFX.buy(); flash = .7; shake = .6; pulseRing('255,210,60'); burst(PT[0][0], 24, 50, ['#ffd23f', '#fff', '#a07a4a'], 140); toast('Built: ' + HN[hl] + '!'); hillUi(); }

function spawnRaid() {
    var hl = S.hillLevel || 0, t = Math.floor(Math.random() * Math.min(4, 1 + hl)), mx = PT[0][0], side = Math.random() < .5 ? -1 : 1, T = RT[t].hp * (1 + .15 * Math.min(S.raidsWon || 0, 12));
    RAID = { t: t, x: mx + side * Math.min(W * .5, 230), mhp: Math.max(dps(), 50) * T, hp: 0, sp: RT[t].sp, sx: 0 };
    RAID.hp = RAID.mhp;
    toast('A ' + RT[t].n.toLowerCase() + ' is heading for your hill! Check the Surface in the Tunnel tab.');
    SFX.alarm && SFX.alarm();
}

function raidTick(dt) {
    var hl = S.hillLevel || 0;
    if (hl < 1)
        return;
    if (S.hillHp == null)
        S.hillHp = hhMax();
    if (!RAID) {
        S.hillHp = Math.min(hhMax(), S.hillHp + 2 * dt);
        S.raidTimer = (S.raidTimer == null ? 90 : S.raidTimer) - dt;
        if (S.raidTimer <= 0)
            spawnRaid();
        return;
    }
    var r = RAID, tp = RT[r.t], mx = PT[0][0], d = Math.abs(r.x - mx), mr = 28 + S.tier * 8;
    rsp -= dt;
    if (d > mr + 6)
        r.x += (mx > r.x ? 1 : -1) * r.sp * dt;
    if (d < 170 + 20 * hl) {
        r.hp -= dps() * .35 * (1 + .12 * hl) * dt;
        if (rsp <= 0) {
            rsp = .25;
            fx.push({ x: r.x + (Math.random() - .5) * 14, y: 10, vx: (Math.random() - .5) * 50, vy: -30, l: .5, t: '\u2726', f: 10, c: '#ffd23f', g: 60 });
        }
    }
    if (d <= mr + 6) {
        S.hillHp -= tp.dmg * (1 + .2 * (S.raidsWon || 0) / 4) * (1 - .12 * hl) * dt;
    }
    if (r.hp <= 0) {
        var j = 2 + hl * 2;
        if (hl >= 5)
            j *= 2;
        gainJelly(j);
        S.food = Math.min(foodCap(), S.food + 150 * (S.tier + 1) * (hl >= 5 ? 2 : 1));
        S.raidsWon = (S.raidsWon || 0) + 1;
        burst(r.x, 16, 30, ['#ffd23f', '#fff', '#7fcf8f'], 120);
        toast('Raid defeated! +' + j + ' jelly');
        SFX.victory();
        RAID = null;
        S.raidTimer = 150 + Math.random() * 60;
    }
    else if (S.hillHp <= 0) {
        var lost = Math.floor(S.food * .2);
        S.food -= lost;
        toast('The ' + tp.n.toLowerCase() + ' ransacked the hill and ate ' + lost + ' food!');
        RAID = null;
        S.hillHp = hhMax();
        S.raidTimer = 170 + Math.random() * 60;
    }
}

function blockChance() {
    var patrol = (1 - S.orders.gd / 100) * Math.min(1, S.soldiers / 15) * .85;
    return 1 - (1 - patrol) * (1 - (S.orders.fg === 3 ? .5 : 0));
}

// where the spider is lurking: at the food spot it is guarding, or near the middle of the tunnel
function lairPos() {
    var sp = S.foodSpots.filter(function (x) { return x.lair > 0; })[0], a = at(sp ? sp.p : .5);
    return { x: a.x + a.nx * (sp ? sp.side * 5 : 0), y: a.y + a.ny * (sp ? sp.side * 5 : 0), ang: a.ang, p: sp ? sp.p : .5 };
}

function scareForagers(lp) { marchers.forEach(function (m) { if (m.k === 1 && !m.inj && m.sf == null && Math.abs(m.p - lp.p) < .14)
    m.pan = 3; }); }

function drawLurker(now) {
    if (!THR || THR.k !== 'spider' || S.dug < .2)
        return;
    var lp = lairPos();
    cx.save();
    cx.translate(0, -cam);
    drawFoe(lp.x, lp.y, lp.ang + Math.sin(now * .002) * .3, 4.2 + S.tier * .4, 1, now * .006);
    cx.restore();
}

function threatText(m) { var t = $('thr'); if (t) t.textContent = m || ''; }

function startThreat() {
    var kinds = ['mites', 'spider'];
    if (S.tier >= 2)
        kinds.push('flood', 'rival');
    var k = kinds[Math.floor(Math.random() * kinds.length)];
    if (k === 'mites') {
        S.mites = Math.min(1, (S.mites || 0) + .7);
        toast('Mites in the nest! Put more nurses on the infirmary to clean the colony.');
    }
    else if (k === 'spider') {
        THR = { k: k, t: 20 + S.tier * 4, a: 4 };
        if (S.foodSpots.length)
            S.foodSpots[Math.floor(Math.random() * S.foodSpots.length)].lair = 1;
        toast('A spider lurks in the tunnels. Send guards on patrol or set foragers to Safest.');
    }
    else if (k === 'flood') {
        THR = { k: k, t: 18 };
        toast('Rain is coming! Set workers to Build and maintain.');
    }
    else {
        THR = { k: k, t: 28, a: 5 };
        toast('Rival ants are raiding your food! Soldiers on patrol can stop them.');
    }
}

function threatTick(dt) {
    if (dead || S.dug < 1 || S.tier < 1)
        return;
    if (!THR || THR.k !== 'spider')
        S.foodSpots.forEach(function (x) { x.lair = 0; });
    if (S.mites > 0) {
        S.mites = Math.max(0, S.mites - dt * (.012 + .05 * (S.orders.nu / 100) * Math.min(1, S.nurses / 12)));
        mitesT -= dt;
        if (mitesT <= 0) {
            mitesT = 7;
            if (Math.random() < S.mites * .8 && healthy(1) + healthy(2) > 0) {
                injure();
                fx.push({ x: QX, y: QY + 20, vx: 0, vy: -16, l: 1, t: 'mites!', f: 11, c: '#c9a0e8', g: 0 });
            }
        }
    }
    if (foes.length || RAID)
        return;
    if (!THR) {
        thT -= dt;
        if (thT <= 0) {
            thT = 70 + Math.random() * 60;
            startThreat();
        }
        threatText(S.mites > .05 ? 'Mites in the colony (' + Math.round(S.mites * 100) + '%). Nurses on the infirmary clean them.' : '');
        return;
    }
    var T2 = THR;
    T2.t -= dt;
    if (T2.k === 'flood') {
        threatText('Flood in ' + Math.max(0, Math.ceil(T2.t)) + 's. Workers set to Build and maintain take 70% less damage.');
        if (T2.t <= 0) {
            var cut = S.orders.wk === 2 ? .3 : 1, loss = Math.floor(S.food * (.1 + Math.random() * .08) * cut);
            S.food -= loss;
            S.layTimer += 8 * cut;
            var lostE = Math.floor(S.eggs.length * .3 * cut);
            if (lostE)
                S.eggs.splice(0, lostE);
            shake = .4;
            toast('The flood hit! ' + (cut < 1 ? 'Your workers held it back: only ' : 'The colony lost ') + fmt(loss) + ' food.');
            THR = null;
        }
        return;
    }
    T2.a -= dt;
    threatText((T2.k === 'spider' ? 'A spider is on the hunt.' : 'Rival ants are raiding.') + ' Chance patrols stop it: ' + Math.round(blockChance() * 100) + '%.');
    if (T2.a <= 0) {
        T2.a = 4;
        T2.n = (T2.n || 0) + 1;
        if (Math.random() < blockChance()) {
            var lq = lairPos();
            fx.push({ x: lq.x, y: lq.y - 8, vx: 0, vy: -20, l: 1.3, t: 'driven off', f: 12, c: '#7ee08a', g: 0 });
            if (Math.random() < .5)
                THR = null;
        }
        else if (T2.k === 'spider') {
            if (healthy(1) > 0) {
                var lp = lairPos();
                scareForagers(lp);
                if (S.orders.nu < 75 && S.foragers > 4 && Math.random() < .25) {
                    addc(1, -1);
                    sync();
                    SFX.hit();
                    fallen.push({ x: lp.x, y: lp.y, ang: Math.random() * 6, k: 1, t: 5, s: Math.random() * 2 - 1 });
                    fx.push({ x: lp.x, y: lp.y - 8, vx: 0, vy: -20, l: 1.4, t: 'forager lost!', f: 12, c: '#ff8a7a', g: 0 });
                }
                else {
                    S.injured[1]++;
                    sync();
                    SFX.hit();
                    fx.push({ x: lp.x, y: lp.y - 8, vx: 0, vy: -20, l: 1.4, t: 'ambushed!', f: 12, c: '#ff8a7a', g: 0 });
                }
            }
        }
        else {
            var sp = S.foodSpots.filter(function (x) { return x.stock >= 1; });
            if (sp.length) {
                sp[Math.floor(Math.random() * sp.length)].stock = 0;
                S.food -= Math.floor(S.food * .05);
                fx.push({ x: QX, y: QY - 20, vx: 0, vy: -20, l: 1.2, t: 'food stolen!', f: 12, c: '#ff8a7a', g: 0 });
            }
        }
    }
    if (T2.t <= 0)
        THR = null;
}
