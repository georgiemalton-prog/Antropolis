/* ui/unlock.js
   A gentler first ten minutes (build 95).
   1. Buttons and tabs appear when they first matter, not all at once. Each feature has a rule; while it is false
      the body lacks class u-<key> and CSS hides the feature. When it turns true during play the feature glows and
      one line says what it is for. Once unlocked it stays (S.unl, optional save field). On a game's first check
      (old saves, stage jumps) everything already earned unlocks quietly.
   2. The 22 opening goals are told as five short chapters with a title card between them (S.chap, optional).
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

var UNL = [
    { k: 'tun', ok: function () { return S.goalIndex >= 2 || S.tier >= 1; }, sel: '.nav button[data-t="tun"]', tx: 'New: the Tunnel tab. Watch your workers dig and your foragers carry food home.' },
    { k: 'col', ok: function () { return S.goalIndex >= 5 || S.tier >= 1; }, sel: '.nav button[data-t="col"]', tx: 'New: the Colony tab. Dig bigger nests, build, and level up your ants there.' },
    { k: 'ants', ok: function () { return S.goalIndex >= 6 || S.tier >= 2; }, sel: '#ctabs [data-c="ants"]', tx: 'New on the Colony tab: Ants. Spend royal jelly to level them up.' },
    { k: 'jelly', ok: function () { return S.jelly > 0 || S.goalIndex >= 4 || S.tier >= 1; }, sel: '.jlc', tx: '' },
    { k: 'nav2', ok: function () { return S.tier >= 1; }, sel: '#tmap', tx: 'New: the colony map and Watch mode. Sit back and the camera follows the action.' },
    { k: 'today', ok: function () { return S.tier >= 1 && S.goalIndex >= 9; }, sel: '#ctabs [data-c="today"]', tx: 'New on the Colony tab: Today. Daily tasks and quests for extra jelly.' },
    { k: 'feed', ok: function () { return S.goalIndex >= 12 || S.tier >= 2; }, sel: '', tx: '' },
    { k: 'more', ok: function () { return S.tier >= 2; }, sel: '#ctabs [data-c="more"]', tx: 'New on the Colony tab: More. Orders, achievements and, one day, the royal flight.' },
    { k: 'store', ok: function () { return S.goalIndex >= 19 || S.tier >= 3 || (P.gen || 0) > 0; }, sel: '.nav button[data-t="store"]', tx: 'New: the Store. Skins, biomes and nest themes for your colony.' }
];
var UNLI = { init: 0, t: 0 };

function unlockTick() {
    if (!S || !document.body)
        return;
    var u = S.unl || (S.unl = {}), b = document.body.classList, quiet = !UNLI.init || (P.gen || 0) > 0, told = 0;
    UNL.forEach(function (f) {
        if (!u[f.k] && ((P.gen || 0) > 0 || f.ok())) {
            u[f.k] = 1;
            if (!quiet && f.tx && !told++) {
                toast(f.tx);
                var e = f.sel && document.querySelector(f.sel);
                if (e) {
                    e.classList.remove('newly');
                    void e.offsetWidth;
                    e.classList.add('newly');
                    setTimeout(function () { e.classList.remove('newly'); }, 4200);
                }
            }
        }
        if (b.contains('u-' + f.k) !== !!u[f.k])
            b.toggle('u-' + f.k, !!u[f.k]);
    });
    UNLI.init = 1;
}

// ---- chapters ----
var CHAPS = [
    { at: 0, t: 'The First Egg', s: 'Deep beneath the roots, a queen begins her colony.' },
    { at: 5, t: 'Breaking Ground', s: 'Your first workers dig. The nest must grow.' },
    { at: 10, t: 'A Growing Nest', s: 'More mouths, more tunnels, more food to find.' },
    { at: 16, t: 'A Real Colony', s: 'The colony reaches for the surface and the sky.' },
    { at: 19, t: 'The First Defence', s: 'The world above has noticed you. Stand your ground.' }
];
function chapOf(i) { var c = 0; for (var j = 0; j < CHAPS.length; j++) if (i >= CHAPS[j].at) c = j; return c; }
// header for the goal card: chapter name and a dot for each goal in the chapter
function chapHead(i) {
    var c = chapOf(i), a = CHAPS[c].at, z = c + 1 < CHAPS.length ? CHAPS[c + 1].at : GOALS.length, d = '';
    for (var j = a; j < z; j++)
        d += '<i class="' + (j < i ? 'd' : j === i ? 'c' : '') + '"></i>';
    return 'Chapter ' + (c + 1) + ' · ' + CHAPS[c].t + ' <b class="cdots">' + d + '</b>';
}
function chapTick() {
    if (S.goalIndex >= GOALS.length || dead || OPEN_PENDING)
        return;
    var c = chapOf(S.goalIndex) + 1;
    if (S.chap == null && (S.goalIndex > 0 || (P.gen || 0) > 0)) {
        S.chap = c;
        return;
    }
    if ((S.chap || 0) >= c || document.querySelector('.intro.on,.over.on'))
        return;
    S.chap = c;
    var el = $('chapc');
    if (!el)
        return;
    el.innerHTML = '<small>Chapter ' + c + '</small><b>' + CHAPS[c - 1].t + '</b><span>' + CHAPS[c - 1].s + '</span>';
    el.className = 'on';
    clearTimeout(UNLI.t);
    UNLI.t = setTimeout(function () { el.className = ''; }, 3600);
    SFX.goal && SFX.goal();
}
