/* ui/quests.js
   Quests: send a party out and collect the haul.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

/* Quests: send a party out for a set time and collect the haul when it is back. The clock is a real timestamp, so it keeps running while the game is closed. S.quest = { k, end, done }. */
var QDEF = [
    { id: 'scout', n: 'Scout the meadow', d: 'A few scouts roam above ground.', t: 0, dur: 120, cost: .03, rf: .07, rj: 0 },
    { id: 'raid', n: 'Raid a rival nest', d: 'Soldiers sneak out to steal supplies.', t: 1, dur: 900, cost: .08, rf: .16, rj: 1 },
    { id: 'trek', n: 'Long expedition', d: 'A big party heads far from the nest.', t: 2, dur: 7200, cost: .15, rf: .32, rj: 3 }
];
var QSTORY = ['They came back dusty and proud.', 'A few ants carried home something shiny.', 'The party marched home singing.', 'They found a quiet patch of seeds.', 'One scout swears it saw a giant.'];
function qDur(d) { return d >= 3600 ? Math.round(d / 360) / 10 + ' hr' : Math.round(d / 60) + ' min'; }
function qJelly(q) { return q.rj ? q.rj + Math.floor(S.tier / 2) : 0; }
function qFood(q) { return Math.round(foodCap() * q.rf * (1 + Math.min(.5, S.scouts * .01))); }
function questStart(id) {
    var q = QDEF.filter(function (x) { return x.id === id; })[0], c = Math.round(foodCap() * q.cost);
    if (S.quest || S.tier < q.t || S.food < c)
        return;
    S.food -= c;
    S.quest = { k: id, end: Date.now() + q.dur * 1000, done: 0 };
    SFX.buy();
    toast('The party sets off: ' + q.n + '.');
    save();
    questsUi(true);
}
function questCollect() {
    var Q = S.quest;
    if (!Q || Date.now() < Q.end)
        return;
    var q = QDEF.filter(function (x) { return x.id === Q.k; })[0], f = qFood(q), j = qJelly(q);
    S.food = Math.min(foodCap(), S.food + f);
    if (j)
        gainJelly(j);
    S.quest = null;
    S.questN = (S.questN || 0) + 1;
    burst(QX, QY, 22, ['#ffd23f', '#fff3b0', '#e8b04a'], 90);
    SFX.claim();
    toast(QSTORY[Math.floor(Math.random() * QSTORY.length)] + ' +' + fmt(f) + ' food' + (j ? ', +' + j + ' jelly' : '') + '.');
    save();
    questsUi(true);
}
var qKey = '';
function questsUi(force) {
    var el = $('quests');
    if (!el)
        return;
    if (S.dug < 1) {
        el.innerHTML = '<p class="mute" style="margin:0">Dig your first tunnel to the surface to send out parties.</p>';
        return;
    }
    var Q = S.quest, h = '', left = Q ? Math.max(0, Math.ceil((Q.end - Date.now()) / 1000)) : 0, key = JSON.stringify([Q && Q.k, left > 0 ? Math.floor(left / 2) : -1, S.tier, Math.floor(S.food / 20)]);
    if (!force && key === qKey)
        return;
    qKey = key;
    QDEF.forEach(function (q) {
        var c = Math.round(foodCap() * q.cost), mine = Q && Q.k === q.id, lock = S.tier < q.t, j = qJelly(q);
        if (mine) {
            if (left <= 0)
                h += '<button class="card dig" onclick="questCollect()" style="margin:0 0 6px;outline:2px solid #ffd23f"><span><b>' + q.n + '</b><span class="mute">The party is back. Tap to collect.</span></span><span class="r">Collect</span></button>';
            else
                h += '<div class="card" style="margin:0 0 6px;opacity:.9"><span><b>' + q.n + '</b><span class="mute">Away. Back in ' + (left >= 3600 ? Math.floor(left / 3600) + 'h ' + Math.floor(left % 3600 / 60) + 'm' : left >= 60 ? Math.floor(left / 60) + 'm ' + left % 60 + 's' : left + 's') + '</span></span><span class="r">Out</span></div>';
            return;
        }
        h += '<button class="card dig" ' + (Q || lock || S.food < c ? 'disabled ' : '') + 'onclick="questStart(\'' + q.id + '\')" style="margin:0 0 6px"><span><b>' + q.n + ' (' + qDur(q.dur) + ')</b><span class="mute">' + (lock ? 'Needs ' + T[q.t].n : q.d + ' Wins about ' + fmt(qFood(q)) + ' food' + (j ? ' and ' + j + ' jelly' : '')) + '</span></span><span class="r">' + fmt(c) + ' food</span></button>';
    });
    el.innerHTML = h;
}
