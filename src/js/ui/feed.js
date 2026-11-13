/* ui/feed.js
   Colony feed (build 90): a slim line above the Rally and Alarm tokens on the Tunnel tab saying what just
   happened in the colony ("A scout found food and is running home to tell the others"). Tap it and the camera
   jumps to the spot. The line glows for a few seconds, then dims and finally hides, so it never clutters.
   Purely visual: it reads the game, never changes it, and uses no Math.random (the replay test stays exact).
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

var FEED = { last: null, shown: null }, FEEDK = { bad: '#ff6a4a', food: '#7ee08a', dig: '#f5b23c', good: '#b6ffd6', info: '#cfe9d8' };

// kind: bad | food | dig | good | info; where: {x, y} in the world, or a function returning one (or null when gone)
function feed(text, kind, where) {
    FEED.last = { t: text, k: kind || 'info', w: where || null, at: performance.now() };
}
function feedTick() {
    var el = $('feed');
    if (!el)
        return;
    var e = FEED.last, age = e ? (performance.now() - e.at) / 1000 : 1e9;
    if (!e || age > 40 || tab !== 'tun') {
        if (el.className !== '')
            el.className = '';
        return;
    }
    if (FEED.shown !== e) {
        FEED.shown = e;
        el.innerHTML = '<i style="background:' + (FEEDK[e.k] || FEEDK.info) + ';color:' + (FEEDK[e.k] || FEEDK.info) + '"></i><span></span>' + (e.w ? '<b aria-hidden="true">›</b>' : '');
        el.children[1].textContent = e.t;
        el.setAttribute('aria-label', e.t + (e.w ? '. Tap to look.' : ''));
    }
    var c = age < 8 ? 'on' : 'on dim';
    if (el.className !== c)
        el.className = c;
}
function feedGo() {
    var e = FEED.last;
    if (!e || !e.w)
        return;
    var p = typeof e.w === 'function' ? e.w() : e.w;
    if (!p)
        return toast('That has moved on now.');
    if (tab !== 'tun')
        go('tun');
    if (uz < 2)
        setZoom(2.2);
    camX = camXc(p.x - W / (2 * uz));
    camT = camClamp(p.y - H * .45 / uz);
    follow = performance.now() + 8000;
    e.at = Math.min(e.at, performance.now() - 8000);
}
