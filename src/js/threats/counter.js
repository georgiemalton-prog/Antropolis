/* threats/counter.js
   Counter-raid (build 91). After a rival raid ends, a Raid token appears beside Rally and Alarm for a few
   minutes. Tap it and a squad of soldiers marches up the side tunnel the raiders came down and out of sight into
   the rival nest. After a while they come back: a win brings food and jelly and keeps the rivals away longer; a
   loss sends a few soldiers home injured. Not saved (like the mole battle): a reload just drops the offer.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

var XR = null;

function counterOffer(k) {
    if (!BP[k] || S.sideDug[k] < 1)
        return;
    XR = { k: k, ph: 'ready', until: TUNING.counter.window, t: 0, n: 0, in: 0 };
    feed('Strike back! Tap the Raid token to send a squad into the rival nest.', 'info', function () { return XR ? at(1, BP[XR.k]) : null; });
    abilityUi(true);
}

function counterGo() {
    var C = TUNING.counter;
    if (!XR || XR.ph !== 'ready')
        return;
    if (foes.length || (MF && !MF.end))
        return toast('Finish this fight first.');
    var want = Math.min(C.squadMax, 4 + Math.floor((S.soldiers + S.superMajors) / 15)), sq = [];
    marchers.forEach(function (m) { if (sq.length < want && (m.k === 2 || m.k === 4) && !m.inj && !m.tired && !m.mo && !m.tr && !m.dr && !m.xr && m.hero == null && !(m.nap > 0)) sq.push(m); });
    if (sq.length < C.squadMin)
        return toast('Not enough rested soldiers for a raid right now.');
    sq.forEach(function (m, i) { m.xr = { k: XR.k, ph: 'main', s: 0, slot: i, dir: 1 }; });
    XR.ph = 'go';
    XR.n = sq.length;
    XR.t = 0;
    XR.in = 0;
    toast('A squad of ' + sq.length + ' sets off for the rival nest.');
    feed('A squad of ' + sq.length + ' marches on the rival nest.', 'info', function () { var m = marchers.filter(function (o) { return o.xr && o.xr.ph !== 'away'; })[0]; return m && m.wx != null ? { x: m.wx, y: m.wy } : null; });
    SFX.rally && SFX.rally();
    abilityUi(true);
}

function counterTick(dt) {
    if (!XR)
        return;
    var C = TUNING.counter;
    if (XR.ph === 'ready') {
        XR.until -= dt;
        if (XR.until <= 0)
            XR = null;
        return;
    }
    XR.t += dt;
    if (XR.ph === 'go' && (XR.in >= XR.n || XR.t > 90)) {
        XR.ph = 'in';
        XR.t = 0;
    }
    if (XR.ph === 'in' && XR.t >= C.away)
        counterResolve();
    if (XR.ph === 'back' && !marchers.some(function (m) { return m.xr; }))
        XR = null;
}

function counterResolve() {
    var C = TUNING.counter, win = Math.random() < Math.min(.9, C.baseWin + .04 * (XR.n - C.squadMin) + .03 * (S.classLevel[2] || 0));
    XR.ph = 'back';
    if (win) {
        var f = Math.round(foodCap() * C.foodShare);
        S.food = Math.min(foodCap(), S.food + f);
        gainJelly(C.jelly);
        rvT += C.delay;
        S.xrWins = (S.xrWins || 0) + 1;
        toast('The counter-raid worked! Your squad is bringing back ' + fmt(f) + ' food and ' + C.jelly + ' jelly, and the rivals will think twice.');
        feed('Counter-raid won! The squad is heading home with the loot.', 'good', function () { return XR ? at(1, BP[XR.k]) : null; });
        SFX.victory();
    }
    else {
        var h = Math.min(S.soldiers - S.injured[2], C.hurtMin + Math.floor(Math.random() * (C.hurtMax - C.hurtMin + 1)));
        if (h > 0)
            S.injured[2] += h;
        toast('The rivals were ready for us. ' + (h > 0 ? h + ' soldiers are limping home injured.' : 'The squad is falling back.'));
        feed('The counter-raid failed. The squad is falling back.', 'bad', function () { return XR ? at(1, BP[XR.k]) : null; });
    }
}

// one step for a squad soldier; false hands it back to its usual job
function xrStep(m, dt) {
    var o = m.xr, B = BP[o.k], V = (m.k === 4 ? 40 : 55) * (m.v || 1) * dt;
    if (!B || !XR) {
        m.xr = null;
        return false;
    }
    if (o.ph === 'main') {
        var J = juncP(o.k), d = J - m.p;
        m.p += Math.sign(d) * Math.min(Math.abs(d), V / Math.max(1, LEN));
        m.d = d > 0 ? 1 : -1;
        m.act = 'Marching on the rival nest';
        if (Math.abs(d) < 1e-4) {
            o.ph = 'tun';
            o.s = 0;
        }
        return true;
    }
    if (o.ph === 'tun') {
        o.s = Math.min(1, o.s + V / B.LEN);
        o.dir = 1;
        m.act = 'Marching on the rival nest';
        if (o.s >= 1) {
            o.ph = 'away';
            XR.in++;
        }
        return true;
    }
    if (o.ph === 'away') {
        m.act = 'Raiding the rival nest';
        if (XR.ph === 'back') {
            o.ph = 'ret';
            o.s = 1;
        }
        return true;
    }
    // home again down the side tunnel, then back to normal duty
    o.s = Math.max(0, o.s - V / B.LEN);
    o.dir = -1;
    m.act = 'Coming home from the raid';
    if (o.s <= 0) {
        m.xr = null;
        m.p = juncP(o.k);
        m.d = -1;
    }
    return true;
}
