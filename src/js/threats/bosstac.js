/* threats/bosstac.js
   Boss fights you play (build 96).
   1. Tactic: when a boss wave breaks in the boss waits at the tunnel mouth while you pick how to meet it:
      Hold the line (super majors plug the tunnel, the boss crawls), Ambush (soldiers strike from a side tunnel,
      more damage to the boss) or Bait (spend food on a trap that tears off part of its health). If you do not
      choose in time the colony picks for you, so idle players are never stuck.
   2. Weak spots: during the fight glowing spots open on the boss for a moment. Tap one for a heavy hit.
      Good hits earn extra jelly when the boss falls.
   Ordinary waves stay automatic. Nothing here is saved (a reload mid-fight just plays on without a tactic).
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

var BT = null;

function bossTacs() {
    var C = TUNING.boss;
    return [
        { k: 'hold', n: 'Hold the line', d: 'Super majors plug the tunnel. The boss crawls at a third of its speed.', ok: S.superMajors > 0, why: 'Needs super majors' },
        { k: 'amb', n: 'Ambush', d: 'Soldiers strike from a side tunnel: +' + Math.round(C.ambush * 100) + '% damage to the boss.', ok: S.sideTunnels > 0 && S.sideDug[0] >= 1, why: 'Needs a side tunnel' },
        { k: 'bait', n: 'Bait trap', d: 'Spend ' + fmt(baitCost()) + ' food on a trap. It tears off ' + Math.round(C.bait * 100) + '% of the boss’s health.', ok: S.food >= baitCost(), why: 'Needs ' + fmt(baitCost()) + ' food' }
    ];
}
function baitCost() { return Math.max(30, Math.round(foodCap() * TUNING.boss.baitCost)); }
function bossFoe() { for (var i = 0; i < foes.length; i++) if (foes[i].boss) return foes[i]; return null; }

// called from wave() when a boss wave starts
function bossStart() {
    BT = { ph: 'pick', t: TUNING.boss.pickTime, tac: null, ws: null, wt: 1.5, hits: 0 };
    bossCard();
}
function bossCard() {
    var el = $('bossc');
    if (!el || !BT)
        return;
    el.innerHTML = '<small>Boss wave</small><b>How do we meet it?</b>' + bossTacs().map(function (t) {
        return '<button class="card bt' + (t.ok ? '' : ' no') + '" data-k="' + t.k + '"' + (t.ok ? '' : ' disabled') + '><strong>' + t.n + '</strong><span>' + (t.ok ? t.d : t.why) + '</span></button>';
    }).join('') + '<em id="bctime"></em>';
    el.className = 'on';
    [].forEach.call(el.querySelectorAll('button.bt'), function (b) { b.onclick = function () { bossPick(b.getAttribute('data-k')); }; });
}
function bossPick(k, auto) {
    if (!BT || BT.ph !== 'pick')
        return;
    var C = TUNING.boss, f = bossFoe();
    BT.ph = 'fight';
    BT.tac = k;
    $('bossc').className = '';
    if (k === 'bait' && f) {
        S.food = Math.max(0, S.food - baitCost());
        f.hp -= f.max * C.bait;
        var a = at(Math.max(0, f.p));
        burst(a.x, a.y, 22, ['#f5b23c', '#c98a2a', '#ffe08a'], 80);
        fx.push({ x: a.x, y: a.y - 20, vx: 0, vy: -18, l: 1.4, t: 'TRAP!', f: 18, c: '#ffd35a', g: 0, pop: 1 });
    }
    var T = bossTacs().filter(function (t) { return t.k === k; })[0];
    toast((auto ? 'No orders, so the colony chose: ' : '') + (T ? T.n + '! ' : '') + 'Tap the glowing weak spots on the boss for heavy hits.');
    feed('Tactic: ' + (T ? T.n : 'charge') + '. Tap the weak spots on the boss!', 'info', function () { var b = bossFoe(); return b ? at(Math.max(0, b.p)) : null; });
    SFX.rally && SFX.rally();
}

// boss movement multiplier: still while you choose, a crawl when the line holds
function bossSpd(f) {
    if (!BT || !f.boss)
        return BT && BT.ph === 'pick' ? 0 : 1;
    return BT.ph === 'pick' ? 0 : BT.tac === 'hold' ? TUNING.boss.holdSlow : 1;
}
// boss damage multiplier from the ambush
function bossDmg(f) { return f.boss && BT && BT.tac === 'amb' ? 1 + TUNING.boss.ambush : 1; }

function bossTick(dt) {
    if (!BT)
        return;
    var C = TUNING.boss, f = bossFoe();
    if (!f) {
        if (BT.ph !== 'pick' && BT.hits) {
            var j = Math.min(C.hitJellyMax, Math.floor(BT.hits / C.hitsPerJelly));
            if (j > 0) {
                gainJelly(j);
                toast(BT.hits + ' weak-spot hits! +' + j + ' extra royal jelly.');
            }
        }
        $('bossc').className = '';
        BT = null;
        return;
    }
    if (BT.ph === 'pick') {
        BT.t -= dt;
        var e = $('bctime');
        if (e)
            e.textContent = 'The colony decides in ' + Math.max(0, Math.ceil(BT.t)) + 's';
        if (BT.t <= 0) {
            var ok = bossTacs().filter(function (t) { return t.ok && t.k !== 'bait'; });
            bossPick(ok.length ? ok[0].k : 'none', true);
        }
        return;
    }
    // weak spots: one at a time, open for a moment on the boss's body
    if (BT.ws) {
        BT.ws.l -= dt;
        if (BT.ws.l <= 0)
            BT.ws = null;
    }
    else if (f.p > .02) {
        BT.wt -= dt;
        if (BT.wt <= 0) {
            BT.wt = C.spotGap * (.7 + Math.random() * .6);
            BT.ws = { l: C.spotLife, L: C.spotLife, ox: (Math.random() - .5) * 18, oy: (Math.random() - .5) * 10 };
        }
    }
}
function spotPos(f) { var a = at(Math.max(0, f.p)); return { x: a.x + BT.ws.ox, y: a.y + BT.ws.oy - 4 }; }

// a tap on the canvas (world coordinates); true if it hit a weak spot
function bossTap(wx, wy) {
    var f = bossFoe();
    if (!BT || !BT.ws || !f)
        return false;
    var s = spotPos(f), r = 16 + 14 / uz;
    if (Math.hypot(wx - s.x, wy - s.y) > r)
        return false;
    var d = f.max * TUNING.boss.spotHit;
    f.hp -= d;
    f.hf = 1;
    BT.hits++;
    BT.ws = null;
    BT.wt = TUNING.boss.spotGap * .6;
    burst(s.x, s.y, 14, ['#fff3b0', '#ffd35a', '#ff8a3a'], 90);
    fx.push({ x: s.x, y: s.y - 12, vx: 0, vy: -22, l: 1.1, t: 'WEAK SPOT! ' + fmt(d), f: 14, c: '#ffe27a', g: 0, pop: 1 });
    shake = Math.max(shake, .18);
    SFX.squish && SFX.squish();
    return true;
}

function drawBossFx(now) {
    var f = bossFoe();
    if (!BT || !BT.ws || !f)
        return;
    var s = spotPos(f), k = BT.ws.l / BT.ws.L, r = 7 + 3 * Math.sin(now * .02);
    cx.save();
    cx.globalCompositeOperation = 'lighter';
    glow(s.x, s.y, 26, '255,210,90', .35 + .25 * k);
    cx.restore();
    cx.strokeStyle = 'rgba(255,230,140,' + (.5 + .5 * k) + ')';
    cx.lineWidth = 2.2;
    cx.beginPath();
    cx.arc(s.x, s.y, r, 0, 7);
    cx.stroke();
    cx.strokeStyle = 'rgba(255,255,255,.8)';
    cx.lineWidth = 1.4;
    cx.beginPath();
    cx.arc(s.x, s.y, r + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k);
    cx.stroke();
}
