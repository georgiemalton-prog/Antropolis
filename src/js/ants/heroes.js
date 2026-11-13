/* ants/heroes.js
   Named hero ants, their gear and following them.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

/* Heroes: a few named ants earn a place in the colony. Each is one of the real marching ants, picked out with a coloured glow and name. S.heroes = [{ n, t, k, c, g, s, bd }] */
var HMILE = [60, 300, 1000, 3000];
var HNAMES = ['Aurelia', 'Brutus', 'Cassia', 'Dorian', 'Esme', 'Flint', 'Gwendolyn', 'Hector', 'Isolde', 'Jasper', 'Kestrel', 'Linnea', 'Magnus', 'Nyx', 'Orion', 'Persephone'];
var HCOL = [['#ffd23f', '255,210,63'], ['#8fe3ff', '143,227,255'], ['#ff8fb3', '255,143,179'], ['#a9f08a', '169,240,138'], ['#c9a3ff', '201,163,255'], ['#ff9b54', '255,155,84']];
var HTRAIT = {
    1: { t: 'Pathfinder: +3% food', ep: ['Pathfinder', 'Seedbearer', 'Longstride'], st: ['once carried a seed four times her size across the whole meadow.', 'knows every shortcut in the grass and never gets lost.', 'is always first to find the good crumbs.'] },
    2: { t: 'Ironjaw: +4% defence', ep: ['Ironjaw', 'the Unbroken', 'Shieldbreaker'], st: ['held the tunnel alone until the others arrived.', 'has the scars to prove every invader regretted it.', 'sleeps standing up, just in case.'] },
    3: { t: 'Lucky: beetles come sooner', ep: ['Eagle-eye', 'Stargazer', 'the Lucky'], st: ['spotted the golden beetle before anyone else did.', 'swears the grass whispers where the treasure is.', 'has never once come back empty-handed.'] }
};
function heroB(k) {
    var n = 0, i, H = S.heroes;
    if (!H)
        return 1;
    for (i = 0; i < H.length; i++)
        if (H[i].k === k)
            n++;
    return 1 + (k === 3 ? .1 : k === 2 ? .04 : .03) * n;
}
function heroBorn() {
    var H = S.heroes || (S.heroes = []), avail = [], k, i, n;
    [[1, S.foragers], [2, S.soldiers], [3, S.scouts]].forEach(function (c) { if (c[1] > 0)
        avail.push(c[0]); });
    if (!avail.length)
        return false;
    avail.sort(function (a, b) { return H.filter(function (h) { return h.k === a; }).length - H.filter(function (h) { return h.k === b; }).length; });
    k = avail[0];
    var used = H.map(function (h) { return h.n; }), ni = ((S.seed || 0) + H.length * 5) % HNAMES.length;
    for (i = 0; i < HNAMES.length && used.indexOf(HNAMES[ni]) >= 0; i++)
        ni = (ni + 1) % HNAMES.length;
    n = HNAMES[ni];
    var tr = HTRAIT[k], c = HCOL[H.length % HCOL.length], same = H.filter(function (h) { return h.k === k; }).length;
    H.push({ n: n, t: tr.ep[same % 3], k: k, c: c[0], g: c[1], s: n + ' ' + tr.st[(ni + same) % 3], bd: S.days || 0 });
    SFX.win();
    feed('A hero hatched: ' + n + '!', 'good', { x: QX, y: QY });
    toast('A hero hatched: ' + n + ' ' + tr.ep[same % 3] + '! Find her in the Colony tab.');
    save();
    heroUi(true);
    return true;
}
var hrT = 0;
function heroTick(dt) {
    hrT -= dt;
    if (hrT > 0)
        return;
    hrT = 2;
    var H = S.heroes || [];
    if (H.length < HMILE.length && S.totalHatched >= HMILE[H.length])
        heroBorn();
    H = S.heroes || [];
    H.forEach(function (h, i) {
        var has = marchers.some(function (m) { return m.hero === i; });
        if (has)
            return;
        var pool = marchers.filter(function (m) { return m.k === h.k && m.hero == null && !m.inj && m.wx != null; });
        if (pool.length) {
            var m = pool[Math.floor(Math.random() * pool.length)];
            m.hero = i;
            m.ident = null;
        }
    });
}
var HSC = 2.2;
function heroMark(x, y, m, now, ang) {
    var h = S.heroes && S.heroes[m.hero];
    if (!h)
        return;
    cx.save();
    cx.globalCompositeOperation = 'lighter';
    glow(x, y, 22, h.g, .3 + .1 * Math.sin(now * .006 + m.ph));
    cx.restore();
    heroGear(x, y, ang || 0, m, now, h);
    if (K * uz >= 1) {
        cx.font = '700 8px sans-serif';
        cx.textAlign = 'center';
        cx.lineWidth = 2;
        cx.strokeStyle = 'rgba(20,10,4,.8)';
        cx.strokeText(h.n, x, y - SZ[m.k] * HSC * .8 - 4);
        cx.fillStyle = h.c;
        cx.fillText(h.n, x, y - SZ[m.k] * HSC * .8 - 4);
    }
}

/* each hero wears gear for her job and trails embers in her own colour */
function heroGear(x, y, ang, m, now, h) {
    var k = m.k, u = SZ[k] * HSC * .31, t = now * .006 + m.ph, rg = h.g, i, j, sd, w = Math.sin(t * 1.4) * u * .35;
    cx.save();
    cx.translate(x, y);
    cx.rotate(ang);
    cx.globalCompositeOperation = 'lighter';
    for (i = 0; i < 6; i++) {
        var f = (now * .0013 + i * .17 + m.ph) % 1;
        cx.fillStyle = 'rgba(' + rg + ',' + (.75 * (1 - f)) + ')';
        cx.beginPath();
        cx.arc(-u * (1.6 + f * 3.4), Math.sin(i * 2.3 + now * .004) * u * 1.1 * f, u * .26 * (1 - f) + .15, 0, 7);
        cx.fill();
    }
    cx.globalCompositeOperation = 'source-over';
    cx.lineJoin = 'round';
    cx.lineCap = 'round';
    if (k === 1) {
        cx.fillStyle = 'rgba(' + rg + ',.88)';
        cx.strokeStyle = 'rgba(20,10,4,.7)';
        cx.lineWidth = u * .1;
        cx.beginPath();
        cx.moveTo(u * .55, -u * .6);
        cx.quadraticCurveTo(-u * 1.6, -u * 1.7 + w, -u * 4.4, -u * 1.5 + w * 1.4);
        cx.lineTo(-u * 3.6, -u * .5 + w * 1.1);
        cx.lineTo(-u * 4.0, w * .8);
        cx.lineTo(-u * 3.6, u * .5 + w * 1.2);
        cx.lineTo(-u * 4.4, u * 1.5 + w * 1.5);
        cx.quadraticCurveTo(-u * 1.6, u * 1.7 + w, u * .55, u * .6);
        cx.closePath();
        cx.fill();
        cx.stroke();
        for (sd = -1; sd <= 1; sd += 2) {
            cx.fillStyle = '#23272e';
            cx.strokeStyle = '#d0d3d8';
            cx.lineWidth = u * .12;
            cx.beginPath();
            cx.arc(u * 1.4, sd * u * .4, u * .3, 0, 7);
            cx.fill();
            cx.stroke();
            cx.fillStyle = h.c;
            cx.beginPath();
            cx.arc(u * 1.45, sd * u * .4, u * .16, 0, 7);
            cx.fill();
        }
    }
    else if (k === 2) {
        for (sd = -1; sd <= 1; sd += 2) {
            for (i = 0; i < 4; i++) {
                var sx = -u * 2.3 + i * u * .6;
                cx.fillStyle = '#c7ccd4';
                cx.strokeStyle = '#1a1d22';
                cx.lineWidth = u * .06;
                cx.beginPath();
                cx.moveTo(sx - u * .17, sd * u * .55);
                cx.lineTo(sx + u * .17, sd * u * .55);
                cx.lineTo(sx - u * .02, sd * u * 1.15);
                cx.closePath();
                cx.fill();
                cx.stroke();
            }
            cx.strokeStyle = '#14161a';
            cx.lineWidth = u * .34;
            cx.beginPath();
            cx.moveTo(u * 1.05, sd * u * .45);
            cx.quadraticCurveTo(u * 1.8, sd * u * 1.3, u * 2.7, sd * u * 1.15);
            cx.stroke();
            cx.strokeStyle = '#d9dde3';
            cx.lineWidth = u * .2;
            cx.stroke();
        }
        cx.fillStyle = 'rgba(160,166,176,.85)';
        cx.strokeStyle = '#14161a';
        cx.lineWidth = u * .1;
        cx.beginPath();
        cx.ellipse(u * .15, 0, u * .72, u * .6, 0, 0, 7);
        cx.fill();
        cx.stroke();
    }
    else {
        cx.strokeStyle = h.c;
        cx.lineWidth = u * .24;
        cx.beginPath();
        cx.moveTo(u * .8, u * .5);
        for (j = 1; j <= 9; j++)
            cx.lineTo(u * .8 - j * u * .5, u * .5 + Math.sin(t * 2 + j * .7) * u * .3 * j / 4);
        cx.stroke();
        cx.fillStyle = '#10202c';
        cx.beginPath();
        cx.ellipse(u * 1.45, 0, u * .45, u * .66, 0, 0, 7);
        cx.fill();
        cx.strokeStyle = h.c;
        cx.lineWidth = u * .14;
        cx.beginPath();
        cx.moveTo(u * 1.6, -u * .52);
        cx.lineTo(u * 1.6, u * .52);
        cx.stroke();
        cx.globalCompositeOperation = 'lighter';
        cx.fillStyle = h.c;
        for (sd = -1; sd <= 1; sd += 2) {
            cx.beginPath();
            cx.arc(u * 2.9, sd * u * .62, u * .2, 0, 7);
            cx.fill();
        }
        cx.globalCompositeOperation = 'source-over';
    }
    cx.globalCompositeOperation = 'lighter';
    cx.fillStyle = k === 2 ? '#ff4a3a' : h.c;
    for (sd = -1; sd <= 1; sd += 2) {
        cx.beginPath();
        cx.arc(u * 1.6, sd * u * .28, u * .15, 0, 7);
        cx.fill();
    }
    cx.restore();
}
function heroFollow(i) {
    var m = marchers.filter(function (q) { return q.hero === i && q.wx != null; })[0];
    if (!m)
        return toast('She is out of sight for a moment. Try again in a few seconds.');
    go('tun');
    sel = { t: 'm', o: m };
    selFollow = true;
    setZoom(2.4);
}
var hrKey = '';
function heroUi(force) {
    var el = $('heroes');
    if (!el)
        return;
    var H = S.heroes || [], key = H.length + ':' + (H.length < HMILE.length ? Math.min(99, Math.floor(S.totalHatched / HMILE[H.length] * 100)) : 100);
    if (!force && key === hrKey)
        return;
    hrKey = key;
    var h = H.map(function (q, i) {
        return '<div class="card" style="margin:0 0 6px;display:block;cursor:default"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><b><i style="display:inline-block;width:12px;height:12px;border-radius:50%;background:' + q.c + ';margin-right:7px;vertical-align:-1px"></i>' + q.n + ' ' + q.t + '</b><button class="link" onclick="heroFollow(' + i + ')">Find</button></div><div class="mute" style="margin-top:3px">' + CN[q.k] + ' &middot; ' + HTRAIT[q.k].t + '</div><div style="margin-top:4px;font-size:13px">' + q.s + '</div></div>';
    }).join('');
    if (H.length < HMILE.length)
        h += '<p class="mute" style="margin:0 0 6px">' + (H.length ? 'Next hero' : 'Your first hero') + ' hatches after ' + HMILE[H.length] + ' ants (' + Math.min(S.totalHatched, HMILE[H.length]) + ' so far).</p>';
    el.innerHTML = h;
}
