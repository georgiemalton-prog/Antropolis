/* ui/observe.js
   Observe mode (build 87): a colony-growth simulation to sit back and watch. The buttons fade away and a camera
   director moves close in (so the ants are big) from one point of interest to the next - diggers at a tunnel
   face, foragers carrying food home, the queen laying, soldiers on patrol, the deep layers - with a caption
   saying what is happening. Anything big (a raid, a wave, the alarm, food found) cuts straight to it.
   Tapping the screen looks around by hand for a few seconds; Exit returns to the normal view.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

var OBS = { on: false, shot: null, t: 0, hold: 0, z0: 1, last: '' };

function obsStart() {
    if (OBS.on)
        return;
    if (tab !== 'tun')
        go('tun');
    OBS.on = true;
    OBS.z0 = uz;
    OBS.shot = null;
    OBS.t = 0;
    OBS.hold = 0;
    document.body.classList.add('obs');
    obsCap('Watching your colony. Tap Exit to take over again.');
}
function obsStop() {
    if (!OBS.on)
        return;
    OBS.on = false;
    document.body.classList.remove('obs');
    follow = 0;
    setZoom(Math.max(uzMin(), Math.min(uzMax(), OBS.z0)));
}
function obsCap(t) {
    var c = $('obscap');
    if (c && OBS.last !== t) {
        OBS.last = t;
        c.classList.remove('in');
        void c.offsetWidth;
        c.textContent = t;
        c.classList.add('in');
    }
}

// what's worth looking at right now, most urgent first; each is { x, y (world), z (zoom), say, follow }
function obsUrgent() {
    var f = foes[0];
    if (f) {
        var a = at(f.p);
        return { x: a.x, y: a.y, z: 2.4, k: 'foe', say: f.rv ? 'Rival ants are raiding for your eggs! Your soldiers race to stop them.' : 'Invaders in the tunnel! The alarm spreads ant to ant and the soldiers charge.', track: function () { var g = foes[0]; return g ? at(g.p) : null; } };
    }
    if (MSGR.length) {
        var m = MSGR[0], b = at(m.p);
        return { x: b.x, y: b.y, z: 2.8, k: 'msg', say: 'A scout found food! It runs home laying a scent trail to call the foragers.', track: function () { return MSGR[0] ? at(MSGR[0].p) : null; } };
    }
    if (RV && RV.ph === 'scout' && BP[RV.k]) {
        var c = at(RV.u, BP[RV.k]);
        return { x: c.x, y: c.y, z: 2.8, k: 'scout', say: 'A rival scout is creeping down one of your side tunnels. A raid is coming.', track: function () { return RV && RV.ph === 'scout' && BP[RV.k] ? at(RV.u, BP[RV.k]) : null; } };
    }
    if (trm.length) {
        var tp = trm[0];
        if (tp.x != null)
            return { x: tp.x, y: tp.y, z: 2.4, k: 'trm', say: 'Termites are raiding from the far east tunnel. Soldiers march out to meet them.' };
    }
    if (cric.length && cric[0].x != null)
        return { x: cric[0].x, y: cric[0].y, z: 2.6, k: 'cric', say: 'Cave crickets are creeping up from the Armoury. The drillers turn to fight.' };
    return null;
}
function obsCalm() {
    var o = [], i;
    // the dig faces
    if (S.dug < 1) { var d = at(1 - S.dug); o.push({ x: d.x, y: d.y, z: 2.8, w: 3, say: 'Workers chew at the tunnel face, pushing up towards the grass.' }); }
    DIGF.forEach(function (e) { var st = e.deep ? S.ddg : S.fdg, p = at(st[e.i] || 0, e.q); o.push({ x: p.x, y: p.y, z: 2.8, w: 2, say: e.deep ? 'Workers dig a new gallery deep in the ' + ['clay', 'stone', 'deep dark', 'bedrock'][e.L || 0] + '.' : 'Workers dig a new tunnel out through the soil, a crumb at a time.' }); });
    crewA.forEach(function (a) { if (a.wx != null && (a.st === 'dig' || a.st === 'out')) o.push({ x: a.wx, y: a.wy, z: 3, w: .4, say: a.st === 'dig' ? 'A worker digs at the face and kicks the soil back.' : 'A worker carries soil away to the spoil heap.' }); });
    // foragers on their way home with food
    var fo = marchers.filter(function (m) { return m.k === 1 && m.cg && m.wx != null; });
    if (fo.length) { var f = fo[Math.floor(Math.random() * fo.length)]; o.push({ x: f.wx, y: f.wy, z: 3, w: 2.5, say: 'Foragers stream home along the trail, each carrying a load of food.', m: f }); }
    // soldiers about their rounds
    var so = marchers.filter(function (m) { return (m.k === 2 || m.k === 4) && m.wx != null && m.act; });
    if (so.length) { var s = so[Math.floor(Math.random() * so.length)]; o.push({ x: s.wx, y: s.wy, z: 3, w: 1.5, say: s.act === 'On patrol' ? 'Soldiers patrol their stretch of tunnel.' : s.act === 'Guarding the tunnel mouth' ? 'Door guards hold the tunnel mouth, heads facing out.' : s.act === 'Guarding the queen\'s door' ? 'Guards keep the queen\'s door.' : s.act + '.', m: s }); }
    // the queen and her brood
    o.push({ x: QX, y: QY - 6, z: 2.4, w: 1.5, say: S.eggs.length ? 'The queen lays; nurses tend ' + S.eggs.length + ' egg' + (S.eggs.length > 1 ? 's' : '') + ' beside her.' : 'The queen rests in her chamber.' });
    // the deep layers, once they are open
    [[typeof larderPos === 'function' && larderPos(), 'Nurses stack seeds in the Larder, deep in the clay.'], [typeof armouryPos === 'function' && armouryPos(), 'Soldiers drill in the Armoury.'], [typeof cavesPos === 'function' && cavesPos(), 'Scouts map the glowing Crystal Caves.'], [typeof molePos === 'function' && molePos(), S.moleWon ? 'The Great Hall, where the Giant Mole once slept.' : 'The Giant Mole sleeps in the bedrock.']].forEach(function (q) { if (q[0] && q[0].x != null) o.push({ x: q[0].x, y: q[0].y, z: 2.4, w: .8, say: q[1] }); });
    // the surface, once the tunnel is open
    if (S.dug >= 1) o.push({ x: PT[0][0], y: 30, z: 2, w: .8, say: 'Up on the grass, foragers cut leaves and seeds to carry down.' });
    if (!o.length)
        return null;
    var tot = 0;
    for (i = 0; i < o.length; i++) tot += o[i].w || 1;
    var r = Math.random() * tot;
    for (i = 0; i < o.length; i++) { r -= o[i].w || 1; if (r <= 0) return o[i]; }
    return o[0];
}

// each frame: pick shots, move the camera smoothly to them
function obsTick(dt) {
    if (!OBS.on)
        return;
    if (tab !== 'tun' || dead) { obsStop(); return; }
    follow = performance.now() + 2000;
    OBS.hold -= dt;
    if (OBS.hold > 0)
        return;
    OBS.t -= dt;
    var u = obsUrgent();
    if (u && (!OBS.shot || OBS.shot.k !== u.k)) { OBS.shot = u; OBS.t = 12; obsCap(u.say); }
    else if (!u && (OBS.t <= 0 || !OBS.shot || OBS.shot.k)) { var c = obsCalm(); if (c) { OBS.shot = c; OBS.t = 7 + Math.random() * 4; obsCap(c.say); } }
    var s = OBS.shot;
    if (!s)
        return;
    // keep up with what it's watching
    if (s.track) { var p = s.track(); if (p) { s.x = p.x; s.y = p.y; } else if (OBS.shot === s) OBS.t = 0; }
    else if (s.m && s.m.wx != null) { s.x = s.m.wx; s.y = s.m.wy; }
    var k = Math.min(1, dt * 1.6), z = Math.max(uzMin(), Math.min(uzMax(), s.z));
    uz += (z - uz) * k;
    var tx = s.x - W / (2 * uz), ty = s.y - H * .5 / uz;
    camX = camXc(camX + (tx - camX) * k);
    camT = camClamp(camT + (ty - camT) * k);
}
// a tap during Observe looks around by hand for a few seconds
function obsTouch() { if (OBS.on) OBS.hold = 6; }
