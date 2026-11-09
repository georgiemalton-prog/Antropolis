/* ui/daily.js
   Daily tasks.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

// daily tasks: three each day, picked by the date
var DTASKS = [
    { id: 'hatch', t: function () { return 'Hatch ' + dTarget('hatch') + ' ants'; }, cur: function () { return S.totalHatched; } },
    { id: 'wave', t: function () { return 'Beat ' + dTarget('wave') + ' invader waves'; }, cur: function () { return S.wave; } },
    { id: 'gold', t: function () { return 'Catch a golden beetle'; }, cur: function () { return S.goldN || 0; } },
    { id: 'quest', t: function () { return 'Finish an expedition'; }, cur: function () { return S.questN || 0; } },
    { id: 'taps', t: function () { return 'Tap the queen ' + dTarget('taps') + ' times'; }, cur: function () { return S.queenTaps || 0; } }
];
function dTarget(id) { return id === 'hatch' ? 40 * (1 + 2 * S.tier) : id === 'wave' ? 3 : id === 'gold' || id === 'quest' ? 1 : 40; }
function dReward() { return 2 + Math.floor(S.tier / 2); }
function dailyState() {
    var k = dayKey(), D = P.daily;
    if (!D || D.day !== k) {
        var n = Math.floor(Date.now() / 864e5), ids = DTASKS.map(function (t) { return t.id; }), pick = [];
        while (pick.length < 3)
            pick.push(ids.splice((n + pick.length * 2) % ids.length, 1)[0]);
        D = P.daily = { day: k, ids: pick, base: {}, done: {}, all: 0 };
        DTASKS.forEach(function (t) { D.base[t.id] = t.cur(); });
        save();
    }
    return D;
}
function dailyTick() {
    var D = dailyState(), any = false;
    D.ids.forEach(function (id) {
        var t = DTASKS.filter(function (x) { return x.id === id; })[0], c = t.cur();
        if (c < D.base[id])
            D.base[id] = 0;
        if (!D.done[id] && c - D.base[id] >= dTarget(id)) {
            D.done[id] = 1;
            any = true;
            gainJelly(dReward());
            toast('Daily task done: ' + t.t() + '. +' + dReward() + ' jelly.');
            SFX.win();
        }
    });
    if (!D.all && D.ids.every(function (id) { return D.done[id]; })) {
        D.all = 1;
        any = true;
        gainJelly(3);
        toast('All of today\u2019s tasks done! +3 bonus jelly.');
    }
    if (any)
        save();
}
function dailyUi() {
    var D = dailyState(), el = $('daily');
    if (!el)
        return;
    var done = D.ids.filter(function (id) { return D.done[id]; }).length;
    el.innerHTML = '<div style="border:1px solid var(--line);border-radius:16px;padding:10px 12px;margin:0 0 10px"><b>Today\u2019s tasks</b> <span class="mute">' + done + ' / 3 &middot; all three give +3 bonus jelly</span>' + D.ids.map(function (id) {
        var t = DTASKS.filter(function (x) { return x.id === id; })[0], c = Math.max(0, Math.min(dTarget(id), t.cur() - D.base[id]));
        return '<div style="display:flex;justify-content:space-between;gap:8px;margin-top:6px;' + (D.done[id] ? 'opacity:.55' : '') + '"><span>' + (D.done[id] ? '\u2713 ' : '') + t.t() + '</span><span class="mute">' + (D.done[id] ? 'done' : c + ' / ' + dTarget(id) + ' &middot; +' + dReward()) + '</span></div>';
    }).join('') + '</div>';
}
var dlyT = 0;
