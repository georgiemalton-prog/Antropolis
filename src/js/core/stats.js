/* core/stats.js
   Anonymous play stats, so we can see how far players get and where they stop.
   Sends a tiny "this happened" ping to GoatCounter (goatcounter.com): no cookies, no names,
   no save data, nothing that identifies the player. Each milestone is sent once per device.
   Also counts script errors (build number and line only), so a broken build does not go unseen.
   Off when STATS_CODE is empty, in dev.html, or when the player turns it off in the Menu.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

// the GoatCounter site code (the "abc" in abc.goatcounter.com); empty = stats off
var STATS_CODE = '';
var STATS_KEY = 'thecolony_stats';   // localStorage: { off, first (day number), sent: { name: 1 } }
var ST = null, stPlay = 0, stNext = 0;

function statsOn() {
    return !!STATS_CODE && !DEV && !!ST && !ST.off;
}

function statsLoad() {
    try {
        ST = JSON.parse(localStorage.getItem(STATS_KEY) || 'null');
    }
    catch (e) { }
    if (!ST || typeof ST !== 'object')
        ST = {};
    if (!ST.sent)
        ST.sent = {};
    if (ST.first == null)
        ST.first = statsDay();
}

function statsSave() {
    try {
        localStorage.setItem(STATS_KEY, JSON.stringify(ST));
    }
    catch (e) { }
}

function statsDay() {
    return Math.floor(Date.now() / 86400000);
}

// web page, home-screen app or the Android app
function statsPlatform() {
    if (window.Capacitor)
        return 'android';
    try {
        if (matchMedia('(display-mode: standalone)').matches || navigator.standalone)
            return 'home-screen';
    }
    catch (e) { }
    return 'web';
}

// send one milestone, once per device
function statsOnce(name) {
    if (!statsOn() || ST.sent[name])
        return;
    ST.sent[name] = 1;
    statsSave();
    try {
        var img = new Image();
        img.src = 'https://' + STATS_CODE + '.goatcounter.com/count?e=true&p=' + encodeURIComponent(name) +
            '&t=' + encodeURIComponent(statsPlatform() + ' ' + APP_VER) + '&rnd=' + Date.now();
    }
    catch (e) { }
}

// the game hit a script error: count it (build and line only, never the player's data), at most three
// different ones per device and build, so a broken build shows up in the stats instead of going unseen
function statsError(line) {
    if (!ST)
        statsLoad();
    var b = 'error-build-' + BUILD, n = Object.keys(ST.sent).filter(function (k) { return k.indexOf(b) === 0; }).length;
    if (n < 3)
        statsOnce(b + '-line-' + (line || 0));
}

// called from the main loop with the real time step; checks milestones every few seconds
function statsTick(rdt) {
    if (!statsOn())
        return;
    if (!document.hidden)
        stPlay += rdt;
    stNext -= rdt;
    if (stNext > 0)
        return;
    stNext = 5;
    var d = statsDay() - ST.first;
    statsOnce('open');
    [1, 2, 3, 7, 14, 30].forEach(function (n) { if (d >= n) statsOnce('back-day-' + n); });
    // total play time on this device
    ST.play = (ST.play || 0) + stPlay;
    stPlay = 0;
    statsSave();
    [1, 3, 5, 10, 20, 30, 60, 120, 300, 600].forEach(function (m) { if (ST.play >= m * 60) statsOnce('played-' + m + '-min'); });
    try {
        if (localStorage.getItem('thecolony_intro'))
            statsOnce('finished-how-to-play');
    }
    catch (e) { }
    // how far through the opening goals; a save that skipped them (goalIndex 99) is not counted
    if (S.goalIndex <= GOALS.length)
        for (var gi = 1; gi <= S.goalIndex; gi++)
            statsOnce('goal-' + gi);
    for (var i = 1; i <= S.tier && i < T.length; i++)
        statsOnce('stage-' + i + '-' + T[i].n.toLowerCase().replace(/ /g, '-'));
    for (i = 2; i <= Math.min(genNum(), 10); i++)
        statsOnce('generation-' + i);
    for (i = 1; i <= Math.min(S.deep || 0, 4); i++)
        statsOnce('deep-layer-' + i);
    if (S.moleWon)
        statsOnce('beat-the-mole');
    for (i = 1; i <= (S.hall || 0); i++)
        statsOnce('great-hall-' + i);
}

function statsToggle() {
    ST.off = !ST.off;
    statsSave();
    statsLabel();
}

function statsLabel() {
    var b = $('setstats');
    if (b)
        b.textContent = ST && ST.off ? 'Off. Tap to share anonymous play stats' : 'On: shares how far you get, nothing personal';
}
