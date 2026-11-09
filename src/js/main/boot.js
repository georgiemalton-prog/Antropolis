/* main/boot.js
   Everything that runs when the page opens, in order: safety patches, wiring buttons and touch,
   loading the save, starting the music and the main loop. Order matters here: keep new start-up
   steps in the right place rather than at the bottom. */

// ---- core/helpers ----
patchCanvasEllipse();
window.onerror = function (m, s, l) { if (!l && /^Script error\.?$/.test(m))
    return true; /* no details: comes from the browser or an extension, not the game */ var d = document.createElement('div'); d.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99;background:#7a1f12;color:#fff;padding:8px 12px;font:13px system-ui'; d.textContent = 'The Colony hit an error: ' + m + ' (line ' + l + '). Please screenshot this and send it to the developer.'; document.body.appendChild(d); };

// ---- core/state ----
S = fresh();

// ---- core/audio ----
card($('tier'), 'tierbtn', function () { dig(); }).classList.add('dig');

// ---- core/state ----
fly = card($('pr'), 'fly', function () { royal(); });
$('abR').onclick = rallyGo;
$('abA').onclick = alarmGo;
$('gencont').onclick = function () { $('gen').classList.remove('on'); };
fly.classList.add('dig');
LG.forEach(function (l) { card($('pr'), 'l-' + l.id, function () { perk(l); }); });
$('giftok').onclick = giftClaim;
setInterval(giftCheck, 2500);
$('endok').onclick = function () { $('endscr').classList.remove('on'); };
$('again').onclick = function () { newRun(Math.floor(gain() / 2)); };

// ---- ui/ads ----
window.onRewardedAd = function (key, ok) { Ads.done(key, !!ok); };
window.onAdFreePurchased = function () { P.adfree = 1; save(); toast('Thank you! Ads are removed and rewards are yours without watching.'); };
$('adgo').onclick = function () { $('adov').classList.remove('on'); var p = Ads.pending; if (p)
    Ads.done(p.key, true); };
$('adno').onclick = function () { clearInterval(Ads.timer); $('adov').classList.remove('on'); Ads.pending = null; };
$('adrev').onclick = adRevive;

// ---- ui/settings ----
initResetButton();

// ---- ui/ads ----
$('snd').onclick = function () { mut = !mut; this.textContent = mut ? 'Sound off' : 'Sound on'; if (!mut)
    SFX.buy(); };

// ---- core/helpers ----
document.querySelectorAll('.nav button').forEach(function (b) { b.onclick = function () { go(b.dataset.t); }; });

// ---- core/state ----
cv = $('cv');
cx = cv.getContext('2d');
still = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
lt = performance.now();

// ---- main/input ----
initNestTaps();

// ---- core/state ----
ltx = performance.now();
// speed trick: skip re-setting innerHTML when the text has not changed (the HUD updates every frame)
try {
    (function () { var d = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML'); Object.defineProperty(Element.prototype, 'innerHTML', { get: d.get, set: function (v) { if (this._h === v)
            return; this._h = v; d.set.call(this, v); }, configurable: true }); })();
}
catch (e) { }
for (var mi = 0; mi < 40; mi++)
    motes.push({ a: Math.random() * 6.28, b: Math.random() * 6.28, s: .2 + Math.random() * .6, x: Math.random(), y: Math.random() });
cv.addEventListener('pointerdown', function () { if (tab === 'nest' && !dead) {
    var qr = qRear(); fx.push({ x: qr.x, y: qr.y - 2, vx: Q.fx * (-26 - Math.random() * 14), vy: -26, l: .9, t: '@egg', f: 10, g: 140 });
    if (Math.random() < .3)
        pulseRing('255,235,200');
} });

// ---- core/state ----
CN[6] = 'Worker';
CC[6] = '#c9962f';
KD[6] = 8;
SZ[6] = 5;
$('bl').textContent = '';
[6, 0, 1, 2, 3, 4, 5].forEach(function (ri) { card($('bl'), 'ro-' + ri, function () { upgClass(ri); }); });
$('j0').onclick = function () { camT = -SK; follow = performance.now() + 8000; };
$('j1').onclick = function () { var pa = foes.length ? at(foes[0].p) : at(.2), y = pa.y; camX = camXc(pa.x - W / (2 * uz)); camT = camClamp(y - H / 2 / uz); follow = performance.now() + 8000; };

// ---- world/camera ----
$('jw').onclick = function () { panTo(wideL() + W * .5); };
$('jh').onclick = function () { panTo(W * .5); };
$('je').onclick = function () { panTo(wideR() - W * .5); };
$('j2').onclick = function () { camT = WH - H / uz; follow = performance.now() + 8000; };

// ---- core/state ----
RD[5] = 'Lays the eggs and keeps the colony alive. Her health and egg speed grow with each level.';
RD[6] = 'Dig every tunnel and chamber. Only workers can dig. Each trip they carry several bits of dirt back to the nest.';
RD.push('Her egg-laying and health. Lays more eggs at levels 3 and 5.');

// ---- main/input ----
initTunnelDrag();
initTunnelPinch();

// ---- core/state ----
cv.addEventListener('pointerup', pend);
cv.addEventListener('pointercancel', pend);
cv.addEventListener('wheel', function (e) { if (tab !== 'tun')
    return; e.preventDefault(); setZoom(uz * (e.deltaY < 0 ? 1.15 : 1 / 1.15)); }, { passive: false });
$('zin').onclick = function () { setZoom(uz * 1.5); };
$('zout').onclick = function () { setZoom(uz / 1.5); };
$('zfit').onclick = function () { setZoom(1); camX = camXc(0); };
$('hillbtn').onclick = buildHill;
antLbl = document.createElement('div');
antLbl.id = 'antlbl';
document.body.appendChild(antLbl);
cv.addEventListener('pointerdown', function (e) { tdn = { x: e.clientX, y: e.clientY, t: performance.now() }; });

// ---- main/input ----
initTapToSelect();

// ---- core/save ----
BACKUP_KEY = SAVE_KEY + '_backup';

// ---- world/camera ----
try { rqStep = Math.min(RQ.length - 1, Math.max(0, parseInt(localStorage.getItem('thecolony_rq'), 10) || 0)); }
catch (e) { }
if (!rqStep && window.matchMedia && window.matchMedia('(pointer:coarse)').matches)
    rqStep = 1;

// ---- ui/shop ----
SKIN_DEF.forEach(function (k) { SKM[k.id] = k.c; });
THEME_DEF.forEach(function (k) { if (k.top)
    THM[k.id] = k; });

// ---- ui/map ----
initMapGestures();
$('tmap').onclick = mapOpen;
$('mapx').onclick = function (e) { e.stopPropagation(); mapClose(); };
window.addEventListener('keydown', function (e) { if (e.key === 'Escape')
    mapClose(); });

// ---- ui/music ----
try {
    MUS.on = localStorage.getItem('thecolony_music') !== '0';
}
catch (e) { }

// ---- ui/settings ----
try {
    power = localStorage.getItem('thecolony_power') || (localStorage.getItem('thecolony_battery') === '1' ? 'saver' : 'auto');
}
catch (e) { }
battery = power === 'saver';
GAME_VER = APP_VER + ' (build ' + BUILD + ')';

// ---- render/nest ----
BFN = [bStore, bNursery, bFarm, bBarracks, bArchive, bHatch, bTower];
BDET = [dStore, dNursery, dFarm, dBarracks, dArchive, dHatch, dTower];

// ---- render/surface ----
// offline and home-screen support (only works when the game is served from a web address)
try {
    if ('serviceWorker' in navigator && /^https?:/.test(location.protocol))
        window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () { }); });
}
catch (e) { }

// ---- ui/intro ----
IP_FULL = ['<h3>Welcome to Antropolis</h3><p>You are a queen ant starting a new colony deep underground.</p><p>You lay an egg every <b>30 seconds</b>. Tap the queen on the <b>Nest</b> tab to lay faster.</p>',
    '<h3>Five kinds of ant</h3><p>' + chipRow([6, 0, 1, 2, 3]) + '</p><p><b>Workers</b> dig. <b>Nurses</b> heal. <b>Foragers</b> fetch food. <b>Soldiers</b> fight. <b>Scouts</b> find treasure.</p><p>Every egg hatches into a random one. Rarely, a golden egg hatches a mighty Super Major.</p>',
    '<h3>Food</h3><p>Foragers bring food home. Eggs, upgrades and digging all cost food, and ants starve without it.</p><p>Keep some foragers working.</p>',
    '<h3>Defend your nest</h3><p>Once your tunnel reaches the surface, invaders attack in waves. Soldiers fight them. Nurses heal the hurt.</p><p>Watch the fights on the <b>Tunnel</b> tab.</p>',
    '<h3>Grow</h3><p>On the <b>Colony</b> tab, dig a bigger nest and spend <b>royal jelly</b> to level up your ants.</p><p>The <b>Goal</b> card always shows what to do next. Tap any ant to follow it.</p>',
    '<h3>Going deeper</h3><p>Each new generation (after a <b>Royal Flight</b>) lets you dig one layer deeper below the nest.</p><p><b>Clay:</b> the Larder. <b>Stone:</b> the Armoury, and cave crickets. <b>Deep dark:</b> the Crystal Caves. <b>Bedrock:</b> the Giant Mole.</p><p>Beat the mole to build the Great Hall.</p>'];
IP = IP_QUICK;
$('inext').onclick = function () { if (ii >= IP.length - 1)
    introClose();
else
    introShow(ii + 1); };
$('iback').onclick = function () { if (ii > 0)
    introShow(ii - 1); };
$('help').onclick = function () { introOpen(true); };
load();
if (S.workers == null)
    S.workers = 1;
if (!S.foodSpots)
    S.foodSpots = [];
if (S.goalIndex == null) {
    S.goalIndex = S.totalHatched > 40 ? 99 : 0;
    S.queenTaps = 0;
    S.deliveries = 0;
}
if (!S.foodSpots.length && S.dug > .1)
    [.25, .5, .75].forEach(function (f) { addSpotAt(1 - S.dug + S.dug * f, true); });
while (S.classLevel.length < 7)
    S.classLevel.push(0);
while (S.injured.length < 7)
    S.injured.push(0);
if (S.queenHp <= 0)
    S.queenHp = 50;
sizeT();
sync();
ui();
foldSections();
resumeFromAway();
document.addEventListener('visibilitychange', function () { if (document.hidden) {
    if (!loadingBackup)
        save();
}
else
    resumeFromAway(); });
window.addEventListener('pagehide', function () { if (!loadingBackup)
    save(); });
$('setb').onclick = openSettings;
$('mus').textContent = MUS.on ? 'Music on' : 'Music off';

// ---- ui/music ----
initMusicButton();

// ---- ui/intro ----
$('snd').addEventListener('click', function () { musicStart(); musicSync(); });
document.addEventListener('pointerdown', function first() { document.removeEventListener('pointerdown', first); musicStart(); });
document.addEventListener('visibilitychange', musicSync);
initFirstVisit();
initTitleScreen();
if (S.totalHatched === 0 && S.dug === 0)
    toast('A new colony begins. Tap the queen to lay an egg.');
window.addEventListener('resize', sizeT);
cv.classList.toggle('tunmode', tab === 'tun');
cv.classList.toggle('nestmode', tab !== 'tun');
['gesturestart', 'gesturechange', 'gestureend'].forEach(function (ev) { document.addEventListener(ev, function (e) { e.preventDefault(); }, { passive: false }); });
document.addEventListener('dblclick', function (e) { e.preventDefault(); }, { passive: false });

// ---- main/loop ----
cv.addEventListener('touchend', function (e) { var n = Date.now(); if (n - lastTouchEnd < 400)
    e.preventDefault(); lastTouchEnd = n; }, { passive: false });
$('tstw').onclick = function () { $('tinfo').classList.toggle('on'); };

// ---- main/input ----
initFollowButton();

// ---- main/loop ----
try {
    var lastTab = localStorage.getItem('thecolony_tab');
    if (lastTab === 'tun' || lastTab === 'col' || lastTab === 'store')
        go(lastTab);
}
catch (e) { }
requestAnimationFrame(frame);
