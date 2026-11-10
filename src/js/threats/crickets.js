/* threats/crickets.js
   Cave crickets creeping up the stone shaft towards the Larder.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

// ---- cave crickets: now and then a band creeps up the stone shaft from the Armoury towards the Larder to eat seeds ----
var cric = [], cricT = TUNING.crickets.firstAt, cricDef = [], cricStole = 0;
function cricLive() {
    for (var i = 0; i < cric.length; i++)
        if (!cric[i].back && cric[i].hp > 0)
            return true;
    return false;
}
function cricSpawn() {
    var n = 3 + Math.floor(Math.random() * 3) + ((S.deep || 0) >= 3 ? 1 : 0);
    cric.length = 0;
    cricStole = 0;
    for (var i = 0; i < n; i++)
        cric.push({ s: 1, w: i * 1.6, hp: TUNING.crickets.hp, mhp: TUNING.crickets.hp, back: 0, i: i, ph: Math.random() * 6, ate: 0 });
    toast('Cave crickets are creeping up from the stone layer towards the Larder! Soldiers are on their way.');
    SFX.hit();
}
function cricTick(dt) {
    var ap = armouryPos(), cap, i, c, L;
    if (!ap || !armouryOn()) {
        cric.length = 0;
        return;
    }
    if (!cric.length) {
        if (foes.length || trm.length || (MF && !MF.end) || (S.soldiers || 0) < 4)
            return;
        cricT -= dt;
        if (cricT <= 0) {
            cricT = TUNING.crickets.gapMin + Math.random() * TUNING.crickets.gapRand;
            cricSpawn();
        }
        return;
    }
    L = Math.max(1, ap.q1.LEN);
    cap = foodCap();
    for (i = cric.length - 1; i >= 0; i--) {
        c = cric[i];
        if (c.w > 0) {
            c.w -= dt;
            continue;
        }
        if (c.hp <= 0) {
            c.dt = (c.dt || 0) + dt;
            if (c.dt > 1.2)
                cric.splice(i, 1);
            continue;
        }
        if (c.back) {
            c.s += 30 * dt / L;
            if (c.s >= 1)
                cric.splice(i, 1);
            continue;
        }
        // a soldier standing just above blocks the way up
        var blk = false;
        for (var j = 0; j < cricDef.length; j++) {
            var g = (c.s - cricDef[j]) * L;
            if (g > 0 && g < 10) {
                blk = true;
                break;
            }
        }
        for (j = 0; !blk && j < cric.length; j++) {
            var o2 = cric[j], g2 = (c.s - o2.s) * L;
            if (o2 !== c && o2.w <= 0 && o2.hp > 0 && !o2.back && g2 > 0 && g2 < 9)
                blk = true;
        }
        c.hold = blk;
        if (!blk)
            c.s -= 12 * dt / L;
        if (c.s <= .02) {
            c.s = .02;
            c.back = 1;
            var take = Math.min(S.food, Math.ceil(cap * TUNING.crickets.stealShare));
            S.food -= take;
            cricStole += take;
            if (!c.ate) {
                c.ate = 1;
                var lp = larderPos();
                if (lp)
                    burst(lp.x, lp.y, 8, ['#e8d39a', '#b98d4a'], 40);
            }
        }
    }
    if (!cricLive() && cric.length && !cric.done) {
        cric.done = 1;
        if (cricStole > 0)
            toast('The cave crickets ate ' + fmt(cricStole) + ' food from the Larder. More soldiers would stop them.');
        else {
            var loot = Math.ceil(cap * TUNING.crickets.lootShare);
            S.food = Math.min(cap, S.food + loot);
            S.cricWins = (S.cricWins || 0) + 1;
            toast('Your soldiers squashed the cave crickets! +' + fmt(loot) + ' food.');
            if (Math.random() < .2)
                gainJelly(1);
            SFX.win();
        }
    }
    if (!cric.length)
        cric.done = 0;
}
// soldiers on the stone shaft go for the nearest cricket and hold the way to the Larder
function cricFight(m, d, ap, V, t) {
    var q = ap.q1, L = Math.max(1, q.LEN), best = null, bd = 9, i, c, a, side, tg, dd, sl = ((m.u * 7.3) % 1) * 2 - 1;
    if (!cricLive()) {
        d.ph = 'up1';
        a = at(Math.max(0, Math.min(1, d.s)), q);
        m.px = a.x;
        m.py = a.y;
        return true;
    }
    for (i = 0; i < cric.length; i++) {
        c = cric[i];
        if (c.w > 0 || c.back || c.hp <= 0)
            continue;
        dd = Math.abs(c.s - d.s);
        if (dd < bd) {
            bd = dd;
            best = c;
        }
    }
    m.act = 'Fighting cave crickets on the stone shaft';
    if (best) {
        side = d.s < best.s ? -1 : 1;
        tg = best.s + side * (7 + (m.k === 4 ? 2 : 0)) / L;
        dd = tg - d.s;
        d.s += Math.sign(dd) * Math.min(Math.abs(dd), V * 1.3 / L);
        if (Math.abs(dd) * L < 3) {
            best.hp -= (m.k === 4 ? 3 : 1) * (1 + .1 * S.classLevel[2]) * V / (54 * (m.v || 1));
            if (best.hp <= 0) {
                a = at(best.s, q);
                burst(a.x, a.y, 10, ['#c9a66b', '#7a5a34', '#fff'], 50);
            }
            else if (Math.random() < .05) {
                a = at(best.s, q);
                fx.push({ x: a.x, y: a.y - 2, vx: (Math.random() - .5) * 26, vy: -18, l: .3, t: '\u2022', f: 7, c: '#fff2b0', g: 40 });
            }
        }
        if (d.s < best.s)
            cricDef.push(d.s);
        a = at(Math.max(0, Math.min(1, d.s + (Math.abs(dd) * L < 3 ? -side * Math.max(0, Math.sin(t * 9 + m.ph * 5)) * 2 / L : 0))), q);
        m.ang = side < 0 ? a.ang : a.ang + Math.PI;
    }
    else {
        a = at(Math.max(0, Math.min(1, d.s)), q);
        m.ang = a.ang + Math.PI;
    }
    m.px = a.x + a.nx * sl * 2.5;
    m.py = a.y + a.ny * sl * 2.5;
    return true;
}
function drawCrickets(now) {
    var ap = armouryPos();
    if (!ap || !cric.length)
        return;
    var q = ap.q1, i, c, a, hop, l;
    cx.save();
    cx.translate(0, -cam);
    for (i = 0; i < cric.length; i++) {
        c = cric[i];
        if (c.w > 0)
            continue;
        a = at(Math.max(0, Math.min(1, c.s)), q);
        hop = c.hp > 0 && !c.hold ? Math.abs(Math.sin(now * .006 + c.ph)) * 1.6 : 0;
        cx.save();
        cx.translate(a.x, a.y - hop);
        cx.rotate(a.ang + (c.back ? 0 : Math.PI));
        cx.scale(1.35, 1.35);
        cx.globalAlpha = c.hp > 0 ? 1 : Math.max(0, 1 - (c.dt || 0) / 1.2);
        if (c.hp <= 0)
            cx.rotate(Math.PI * .5);
        // long jumping legs: a thick shaded thigh, a spiny shin, short front legs
        for (l = -1; l <= 1; l += 2) {
            var fg = cx.createLinearGradient(-1, l * 1.2, -3.5, l * 3.6);
            fg.addColorStop(0, '#a8804e'); fg.addColorStop(1, '#4a3018');
            cx.fillStyle = fg;
            cx.beginPath(); cx.moveTo(-.2, l * 1.2); cx.quadraticCurveTo(-2.4, l * 5, -4.6, l * 4.8); cx.quadraticCurveTo(-2.6, l * 3, -1.8, l * 1.2); cx.closePath(); cx.fill();
            cx.strokeStyle = '#6a4a2a'; cx.lineWidth = .7;
            cx.beginPath(); cx.moveTo(-4.4, l * 4.7); cx.lineTo(-7.8, l * 2.4); cx.stroke();
            cx.lineWidth = .35;
            for (var sp = 0; sp < 3; sp++) { var sx2 = -5.3 - sp * .9, sy2 = l * (4.2 - sp * .6); cx.beginPath(); cx.moveTo(sx2, sy2); cx.lineTo(sx2 - .3, sy2 + l * .6); cx.stroke(); }
            cx.lineWidth = .6; cx.strokeStyle = '#4a3420';
            cx.beginPath(); cx.moveTo(1.5, l * 1); cx.lineTo(2.6, l * 2.4); cx.lineTo(3.4, l * 2.9); cx.moveTo(.4, l * 1.1); cx.lineTo(.8, l * 2.6); cx.stroke();
        }
        // humped, banded body with a sheen
        var bg2 = cx.createRadialGradient(-.8, -1.1, .2, -.6, 0, 4.6);
        bg2.addColorStop(0, '#9a7448'); bg2.addColorStop(.5, '#5a4026'); bg2.addColorStop(1, '#2a1c10');
        cx.fillStyle = bg2;
        cx.beginPath(); cx.ellipse(-.6, 0, 4.4, 2.3, 0, 0, 7); cx.fill();
        cx.strokeStyle = 'rgba(20,12,6,.8)'; cx.lineWidth = .45; cx.stroke();
        cx.strokeStyle = 'rgba(200,160,100,.5)'; cx.lineWidth = .45;
        for (l = -2.6; l < 2; l += 1.3) { cx.beginPath(); cx.moveTo(l, -2); cx.quadraticCurveTo(l - .4, 0, l, 2); cx.stroke(); }
        cx.fillStyle = 'rgba(255,240,210,.35)'; cx.beginPath(); cx.ellipse(-.8, -1.1, 2.6, .5, 0, 0, 7); cx.fill();
        // head with an eye
        var hg2 = cx.createRadialGradient(3.6, -.5, .1, 3.8, 0, 1.8);
        hg2.addColorStop(0, '#7a5838'); hg2.addColorStop(1, '#2e2012');
        cx.fillStyle = hg2; cx.beginPath(); cx.arc(3.8, 0, 1.6, 0, 7); cx.fill();
        cx.fillStyle = '#0a0604'; cx.beginPath(); cx.arc(4.3, -.8, .45, 0, 7); cx.arc(4.3, .8, .45, 0, 7); cx.fill();
        cx.fillStyle = 'rgba(255,240,220,.8)'; cx.beginPath(); cx.arc(4.4, -.9, .15, 0, 7); cx.fill();
        // very long feelers
        cx.strokeStyle = 'rgba(40,28,16,.9)';
        cx.lineWidth = .45;
        for (l = -1; l <= 1; l += 2) {
            cx.beginPath();
            cx.moveTo(5, l * .5);
            cx.quadraticCurveTo(9, l * (2 + Math.sin(now * .004 + c.ph) * 1.2), 13, l * 4.5);
            cx.stroke();
        }
        cx.restore();
        if (c.hp > 0 && c.hp < c.mhp) {
            cx.fillStyle = 'rgba(0,0,0,.6)';
            cx.fillRect(a.x - 5, a.y - 8, 10, 1.6);
            cx.fillStyle = '#e74c3c';
            cx.fillRect(a.x - 5, a.y - 8, 10 * c.hp / c.mhp, 1.6);
        }
    }
    cx.restore();
}
