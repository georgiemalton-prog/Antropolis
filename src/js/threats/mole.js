/* threats/mole.js
   The Giant Mole in the Bedrock and the Great Hall that replaces it.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

/* ---- the Giant Mole (Bedrock) ----
   Saved: S.moleHp (health left, damage sticks between attacks), S.moleWon, S.hall (Great Hall level 0-4).
   The battle itself (MF) is not saved: closing the game mid-fight simply ends it. */
var MOLE_MAX = TUNING.mole.maxHp, MF = null;
function moleOn() { return (S.deep || 0) >= 4; }
function molePos() {
    var qs = [trunkQ(0), trunkQ(1), trunkQ(2), trunkQ(3)];
    if (!qs[0] || !qs[1] || !qs[2] || !qs[3])
        return null;
    var pe = qs[3].PT[qs[3].PT.length - 1];
    return { qs: qs, x: pe[0], y: pe[1] + 18 };
}
function moleHp() { return S.moleHp == null ? MOLE_MAX : S.moleHp; }
function moleGo() {
    if (!moleOn() || S.moleWon || MF || foes.length || !molePos() || healthy(2) + healthy(4) < 20)
        return;
    MF = { t: 0, d0: dps(), kt: 3, end: 0, fight: 0 };
    nf = Math.max(nf, performance.now() + 240000);
    SFX.alarm();
    toast('Your army marches down to the Mole\'s Cavern! The battle starts when they arrive.');
    go('tun');
    var mp = molePos();
    camT = camClamp(mp.y - H / (2 * uz));
    follow = performance.now() + 6000;
}
function moleTick(dt) {
    if (!moleOn() || S.moleWon)
        return;
    if (!MF) {
        // the mole slowly licks its wounds: 5% of its health back per hour
        if (S.moleHp != null && S.moleHp < MOLE_MAX)
            S.moleHp = Math.min(MOLE_MAX, S.moleHp + MOLE_MAX * TUNING.mole.regenPerHour / 3600 * dt);
        return;
    }
    if (MF.end) {
        // wait for the army to climb back up, then the battle is over
        MF.t += dt;
        if (MF.t > 240 || !marchers.some(function (m) { return m.mo; }))
            MF = null;
        return;
    }
    var mp = molePos(), there = 0;
    if (!mp) {
        MF.end = 1;
        return;
    }
    marchers.forEach(function (m) { if (m.mo && m.mo.ph === 'fight') there++; });
    if (!MF.fight) {
        if (there < 4) {
            MF.t += dt;
            if (MF.t > 200)
                MF.fight = 1;
            return;
        }
        MF.fight = 1;
        MF.t = 0;
        shake = .5;
        SFX.boom();
        toast('The Giant Mole wakes up!');
    }
    MF.t += dt;
    // about half the army reaches the cavern and fights
    var hit = dps() * .6 * dt;
    S.moleHp = Math.max(0, moleHp() - hit);
    MF.acc = (MF.acc || 0) + hit;
    MF.nt = (MF.nt || 0) - dt;
    MF.hf = Math.max(0, (MF.hf || 0) - dt);
    MF.swp = Math.max(0, (MF.swp || 0) - dt);
    if (MF.nt <= 0) {
        MF.nt = .55;
        fx.push({ x: mp.x - 4 + (Math.random() - .5) * 40, y: mp.y - 44, vx: (Math.random() - .5) * 20, vy: -36, l: .85, t: fmt(Math.round(MF.acc)), f: 13, c: '#ffe27a', g: 30, pop: 1 });
        MF.acc = 0;
        MF.hf = .14;
        var sa = Math.random() * 6.283;
        fx.push({ x: mp.x - 4 + Math.cos(sa) * 30, y: mp.y + 4 + Math.sin(sa) * 14, vx: 0, vy: 0, l: .22, star: 4, c: '#fff4c2', g: 0 });
    }
    // the mole swipes back: soldiers fall
    MF.kt -= dt;
    if (MF.kt <= 0) {
        MF.kt = 2;
        var n = Math.max(1, Math.round(S.soldiers * TUNING.mole.lossPerHit));
        S.soldiers = Math.max(0, S.soldiers - n);
        if (S.injured[2] > S.soldiers)
            S.injured[2] = S.soldiers;
        if (S.superMajors > 0 && Math.random() < TUNING.mole.superLoss)
            S.superMajors--;
        if (healthy(2) > 0 && Math.random() < TUNING.mole.injureChance)
            S.injured[2]++;
        shake = Math.max(shake, .2);
        SFX.hit();
        MF.swp = .45;
        fx.push({ x: mp.x + 30, y: mp.y + 10, vx: 0, vy: 0, l: .3, slash: 22, ang: (Math.random() - .5) * .8, c: '#ffb0a0', g: 0 });
        burst(mp.x + 30, mp.y + 8, 6, ['#8a6340', '#5a3d22', '#c9b48c'], 50);
        // the swipe sends a soldier or two flying
        for (var fl2 = 0; fl2 < Math.min(2, n); fl2++)
            fallen.push({ x: mp.x + 30 + Math.random() * 10, y: mp.y + 6, ang: Math.random() * 6.28, k: 2, t: 4, s: 0, vx: 50 + Math.random() * 70, vy: -60 - Math.random() * 40, sp: (Math.random() - .5) * 20 });
        while (fallen.length > 14)
            fallen.shift();
        sync();
    }
    if (S.moleHp <= 0) {
        moleWin();
        return;
    }
    if (dps() < MF.d0 * TUNING.mole.retreatAt) {
        MF.end = 1;
        MF.t = 0;
        toast('Your army falls back from the Giant Mole with ' + Math.round(S.moleHp / MOLE_MAX * 100) + '% of its health left. The damage sticks; regroup and try again.');
    }
}
function moleWin() {
    var mp = molePos();
    S.moleWon = 1;
    S.moleHp = 0;
    MF.end = 1;
    MF.t = 0;
    gainJelly(TUNING.mole.winJelly);
    S.food = foodCap();
    flash = 1;
    shake = .8;
    if (mp) {
        burst(mp.x, mp.y, 80, ['#ffd23f', '#fff', '#c9b48c', '#e0553f'], 180);
        pulseRing('255,210,60');
    }
    SFX.fan();
    toast('VICTORY! The Giant Mole is beaten. +' + TUNING.mole.winJelly + ' royal jelly, a full food store, and the cavern is yours: build the Great Hall in it.');
}
function hallCost() { var lv = S.hall || 0; return { f: Math.round(foodCap() * (TUNING.hall.foodBase + TUNING.hall.foodStep * lv)), j: TUNING.hall.jellyBase + TUNING.hall.jellyStep * lv }; }
function upHall() {
    var lv = S.hall || 0, c = hallCost();
    if (!S.moleWon || lv >= TUNING.hall.maxLevel || S.food < c.f || S.jelly < c.j)
        return;
    S.food -= c.f;
    S.jelly -= c.j;
    S.hall = lv + 1;
    SFX.buy();
    flash = .5;
    pulseRing('255,210,60');
    toast('The Great Hall is now level ' + S.hall + '. Food and soldier damage +' + Math.round(S.hall * TUNING.hall.bonus * 100) + '%.');
}
function moleCard() {
    if (!moleOn())
        return '';
    var hp = moleHp(), pc = Math.ceil(hp / MOLE_MAX * 100), lv = S.hall || 0, c;
    if (S.moleWon) {
        c = hallCost();
        return '<button class="card dig" ' + (lv >= TUNING.hall.maxLevel || S.food < c.f || S.jelly < c.j ? 'disabled ' : '') + 'onclick="upHall()" style="margin:0 0 6px"><span><b>' + ico('deep') + 'Great Hall ' + lv + '/' + TUNING.hall.maxLevel + '</b><span class="mute">Built in the Giant Mole\'s old cavern. Each level: +10% food and soldier damage</span></span><span class="r">' + (lv >= 4 ? 'Maxed' : fmt(c.f) + ' food, ' + c.j + ' jelly') + '</span></button>';
    }
    if (MF)
        return '<div class="card info" style="margin:0 0 6px;display:block"><b>' + (MF.end ? 'Your army is climbing back up' : MF.fight ? 'Battle with the Giant Mole!' : 'Your army is marching down') + '</b><div class="bar" style="margin:6px 0 2px"><i style="width:' + pc + '%;background:#c43fe0"></i></div><span class="mute">Mole health ' + pc + '%</span></div>';
    var ok = !foes.length && healthy(2) + healthy(4) >= 20 && !!molePos();
    return '<button class="card dig" ' + (ok ? '' : 'disabled ') + 'onclick="moleGo()" style="margin:0 0 6px"><span><b>' + ico('deep') + 'Attack the Giant Mole</b><span class="mute">' + (!molePos() ? 'Finish digging the bedrock shaft first' : 'Mole health ' + pc + '%. Your army deals ' + fmt(dps() * .6) + ' damage a second down there. It hits back hard; damage stays between attacks. Beat it for 30 jelly and the Great Hall') + '</span></span><span class="r">Fight</span></button>';
}
// soldiers and super majors march down all four shafts and surround the mole, then climb back when the battle ends
function moleStep(m, dt, t) {
    var o = m.mo, mp = molePos(), V = (m.k === 4 ? 24 : 32) * (m.v || 1) * dt, a, q;
    if (!mp) {
        m.mo = null;
        return false;
    }
    var back = !MF || MF.end;
    if (back && (o.ph === 'main' || o.ph === 'nest' || o.ph === 'down' || o.ph === 'fight')) {
        if (o.ph === 'main')
            o.ph = 'mainB';
        else if (o.ph === 'nest')
            o.ph = 'nestB';
        else if (o.ph === 'fight') {
            o.ph = 'up';
            o.i = 3;
            o.s = 1;
        }
        else
            o.ph = 'up';
    }
    if (o.ph === 'main') {
        m.p = Math.min(1, m.p + V / Math.max(1, LEN));
        m.d = 1;
        m.act = 'Marching to the Mole\'s Cavern';
        if (m.p >= 1) {
            o.ph = 'nest';
            a = at(1);
            m.px = a.x;
            m.py = a.y;
        }
        return true;
    }
    if (o.ph === 'nest' || o.ph === 'nestB') {
        if (o.ph === 'nest') {
            a = at(0, mp.qs[0]);
            m.act = 'Marching to the Mole\'s Cavern';
            if (walkTo(m, a.x, a.y, V)) {
                o.ph = 'down';
                o.i = 0;
                o.s = 0;
            }
        }
        else {
            m.act = 'Heading back to guard duty';
            if (walkTo(m, QX, QY, V)) {
                m.p = 1;
                m.d = -1;
                o.ph = 'mainB';
            }
        }
        return true;
    }
    if (o.ph === 'fight') {
        // a ring around the mole, darting in to bite
        var an = o.slot * 2.39996, rr = 47 + (o.slot % 3) * 6, lunge = Math.max(0, Math.sin(t * 3 + o.slot)) * 6;
        m.px = mp.x + Math.cos(an) * (rr - lunge);
        m.py = mp.y + 4 + Math.sin(an) * (rr - lunge) * .5;
        m.ang = Math.atan2(mp.y - m.py, mp.x - m.px);
        m.act = MF && MF.fight ? 'Fighting the Giant Mole' : 'Waiting for the battle';
        return true;
    }
    if (o.ph === 'down' || o.ph === 'up') {
        q = mp.qs[o.i];
        o.s += (o.ph === 'down' ? 1 : -1) * V / Math.max(1, q.LEN);
        if (o.ph === 'down' && o.s >= 1) {
            if (o.i < 3) {
                o.i++;
                o.s = 0;
            }
            else {
                o.s = 1;
                o.ph = 'fight';
            }
        }
        else if (o.ph === 'up' && o.s <= 0) {
            if (o.i > 0) {
                o.i--;
                o.s = 1;
            }
            else {
                o.s = 0;
                o.ph = 'nestB';
            }
        }
        q = mp.qs[o.i];
        a = at(Math.max(0, Math.min(1, o.s)), q);
        m.px = a.x;
        m.py = a.y;
        m.ang = o.ph === 'down' ? a.ang : a.ang + Math.PI;
        m.act = o.ph === 'down' ? 'Marching to the Mole\'s Cavern' : 'Heading back to guard duty';
        return true;
    }
    m.mo = null;
    return false;
}
// the cavern, the mole and (after the win) the Great Hall
function drawMole(now) {
    var mp = molePos(), t = now * .001, sc, i, hp, fight = MF && MF.fight && !MF.end, br;
    if (!mp)
        return;
    cx.save();
    cx.translate(0, -cam);
    cx.fillStyle = '#0d0907';
    cx.beginPath();
    cx.ellipse(mp.x, mp.y - 4, 74, 36, 0, 0, 7);
    cx.fill();
    cx.fillStyle = '#3a2d24';
    cx.beginPath();
    cx.ellipse(mp.x, mp.y - 4, 71, 33, 0, 0, 7);
    cx.fill();
    var gg = cx.createRadialGradient(mp.x, mp.y - 10, 4, mp.x, mp.y, 70);
    gg.addColorStop(0, '#6b5240');
    gg.addColorStop(1, '#3a2d24');
    cx.fillStyle = gg;
    cx.beginPath();
    cx.ellipse(mp.x, mp.y - 4, 68, 30, 0, 0, 7);
    cx.fill();
    if (!S.moleWon) {
        // the Giant Mole: a velvet body, spade claws and a pink star nose. Asleep it breathes slowly; awake it swipes.
        br = 1 + Math.sin(t * (fight ? 4 : 1.2)) * .03;
        var sw = fight ? (MF.swp > 0 ? Math.sin((1 - MF.swp / .45) * Math.PI) * 2.2 : Math.sin(t * 5) * .6) : 0, x0 = mp.x - 4 + (fight && MF.swp > 0 ? Math.sin((1 - MF.swp / .45) * Math.PI) * 5 : 0), y0 = mp.y + 4;
        cx.fillStyle = 'rgba(0,0,0,.35)';
        cx.beginPath();
        cx.ellipse(x0, y0 + 14, 40, 6, 0, 0, 7);
        cx.fill();
        var mg = cx.createRadialGradient(x0 - 6, y0 - 9, 2, x0, y0, 36 * br);
        mg.addColorStop(0, '#5a4c44'); mg.addColorStop(.55, '#2d2622'); mg.addColorStop(1, '#120e0c');
        cx.fillStyle = mg;
        cx.beginPath();
        cx.ellipse(x0, y0, 34 * br, 18 * br, 0, 0, 7);
        cx.fill();
        // velvet fur strokes
        cx.strokeStyle = 'rgba(160,140,125,.22)';
        cx.lineWidth = .8;
        for (i = 0; i < 16; i++) {
            var fx2 = x0 - 26 + i * 3.4, fy2 = y0 - 10 + Math.sin(i * 1.7) * 5;
            cx.beginPath(); cx.moveTo(fx2, fy2); cx.quadraticCurveTo(fx2 - 2, fy2 + 2, fx2 - 4, fy2 + 1.5); cx.stroke();
        }
        cx.strokeStyle = 'rgba(255,215,185,.28)';
        cx.lineWidth = 1.4;
        cx.stroke();
        cx.fillStyle = 'rgba(255,255,255,.08)';
        cx.beginPath();
        cx.ellipse(x0 - 6, y0 - 8, 20, 6, -.1, 0, 7);
        cx.fill();
        cx.fillStyle = '#e9a7a0';
        [[-1, 0], [1, 0]].forEach(function (d) {
            cx.save();
            cx.translate(x0 + 24, y0 + 8 + d[0] * 2);
            cx.rotate(.5 + d[0] * .2 + sw * .5 * d[0]);
            var pg = cx.createRadialGradient(4, -2, .5, 6, 0, 10);
            pg.addColorStop(0, '#f6c8c0'); pg.addColorStop(1, '#b06a66');
            cx.fillStyle = pg;
            cx.beginPath();
            cx.ellipse(6, 0, 9, 5, 0, 0, 7);
            cx.fill();
            cx.strokeStyle = 'rgba(90,40,40,.5)'; cx.lineWidth = .6; cx.stroke();
            cx.fillStyle = '#f4e6dc';
            for (var c2 = 0; c2 < 4; c2++) {
                cx.beginPath();
                cx.moveTo(13, -4 + c2 * 2.6);
                cx.lineTo(19, -3.6 + c2 * 2.6);
                cx.lineTo(13, -2.4 + c2 * 2.6);
                cx.fill();
            }
            cx.fillStyle = '#e9a7a0';
            cx.restore();
        });
        var hg = cx.createRadialGradient(x0 + 28, y0 - 7, 1, x0 + 30, y0 - 3, 12);
        hg.addColorStop(0, '#5a4c44'); hg.addColorStop(1, '#1a1412');
        cx.fillStyle = hg;
        cx.beginPath();
        cx.ellipse(x0 + 30, y0 - 3, 11, 9, 0, 0, 7);
        cx.fill();
        // tapering snout
        cx.fillStyle = '#3a302a';
        cx.beginPath(); cx.moveTo(x0 + 36, y0 - 8); cx.quadraticCurveTo(x0 + 42, y0 - 6, x0 + 41, y0 - 3); cx.quadraticCurveTo(x0 + 42, y0, x0 + 36, y0 + 2); cx.fill();
        cx.strokeStyle = 'rgba(230,220,210,.35)'; cx.lineWidth = .5;
        for (i = -2; i <= 2; i++) { cx.beginPath(); cx.moveTo(x0 + 38, y0 - 3 + i); cx.lineTo(x0 + 46, y0 - 3 + i * 3); cx.stroke(); }
        cx.fillStyle = '#ef8fa0';
        for (i = 0; i < 10; i++) {
            var a2 = i / 10 * 6.283 + Math.sin(t * 6) * .1;
            cx.beginPath();
            cx.ellipse(x0 + 42 + Math.cos(a2) * 3.2, y0 - 3 + Math.sin(a2) * 3.2, 2.4, 1, a2, 0, 7);
            cx.fill();
        }
        cx.fillStyle = '#0a0706';
        cx.beginPath();
        cx.arc(x0 + 33, y0 - 7, 1, 0, 7);
        cx.fill();
        if (!fight) {
            cx.font = '700 9px system-ui';
            cx.fillStyle = 'rgba(255,255,255,' + (.4 + .3 * Math.sin(t * 1.2)) + ')';
            cx.fillText('z', x0 + 38, y0 - 18 - (t * 4 % 8));
        }
        if (fight && MF.hf > 0) {
            cx.save();
            cx.globalCompositeOperation = 'lighter';
            glow(x0 + 10, y0, 46, '255,245,230', Math.min(.5, MF.hf * 3.5));
            cx.restore();
        }
        hp = moleHp() / MOLE_MAX;
        cx.fillStyle = 'rgba(0,0,0,.65)';
        rrect(mp.x - 36, mp.y - 34, 72, 6, 3);
        cx.fill();
        cx.fillStyle = '#c43fe0';
        rrect(mp.x - 35, mp.y - 33, 70 * hp, 4, 2);
        cx.fill();
    }
    else {
        // the Great Hall: one more pillar and lamp per level
        var lv = S.hall || 0;
        for (i = 0; i < 4; i++) {
            var px = mp.x - 45 + i * 30;
            cx.fillStyle = i < lv ? '#c9a46a' : 'rgba(201,164,106,.18)';
            cx.fillRect(px - 3, mp.y - 22, 6, 30);
            cx.fillRect(px - 5, mp.y - 24, 10, 3);
            if (i < lv) {
                cx.save();
                cx.globalCompositeOperation = 'lighter';
                glow(px, mp.y - 26, 12, '255,200,90', .25 + .06 * Math.sin(t * 3 + i));
                cx.restore();
            }
        }
    }
    sc = .7 / (K * uz);
    cx.font = '700 ' + (8 * sc) + 'px system-ui';
    cx.textAlign = 'center';
    cx.lineWidth = 2 * sc;
    cx.strokeStyle = 'rgba(0,0,0,.65)';
    cx.fillStyle = 'rgba(255,235,210,.95)';
    var lab = S.moleWon ? 'The Great Hall' : 'The Mole\'s Cavern';
    cx.strokeText(lab, mp.x, mp.y - 40 - 4 * sc);
    cx.fillText(lab, mp.x, mp.y - 40 - 4 * sc);
    cx.restore();
}
