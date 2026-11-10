/* layers/larder.js
   Clay layer: the Larder and the nurses who stock it.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

// the Larder: the chamber at the end of the clay layer's main shaft, ready once that shaft is dug
function larderOn() { return (S.deep || 0) >= 1; }
// the Larder reserve (S.lres, optional): food put by while away when the store was full. It holds up to one
// more full store and pours back into the store whenever there is room, a little each second.
function larderRoom() { return Math.max(0, foodCap() * TUNING.larder.reserve - (S.lres || 0)); }
function larderTick(dt) {
    if (!(S.lres > 0))
        return;
    var mv = Math.min(S.lres, Math.max(0, foodCap() - S.food), foodCap() * TUNING.larder.refill * dt);
    if (mv > 0) {
        S.food += mv;
        S.lres -= mv;
    }
}
function larderPos() {
    var o = null;
    deepList().forEach(function (e) { if (!o && e.f.L === 0 && e.f.t && e.pr >= 1) o = e; });
    if (!o)
        return null;
    var q = o.f.q, pe = q.PT[q.PT.length - 1];
    return { q: q, x: pe[0], y: pe[1] };
}
function drawLarder(now) {
    var lp = larderPos(), i, sc;
    if (!lp)
        return;
    cx.save();
    cx.translate(0, -cam);
    for (i = 0; i < 9; i++) {
        cx.fillStyle = i % 3 ? '#b07a3c' : '#8d5e2a';
        cx.beginPath();
        cx.ellipse(lp.x - 11 + (i % 5) * 5 + (i > 4 ? 2.5 : 0), lp.y + 6 - (i > 4 ? 3 : 0), 2.4, 1.7, i, 0, 7);
        cx.fill();
    }
    sc = .7 / (K * uz);
    cx.font = '700 ' + (8 * sc) + 'px system-ui';
    cx.textAlign = 'center';
    cx.lineWidth = 2 * sc;
    cx.strokeStyle = 'rgba(0,0,0,.65)';
    cx.fillStyle = 'rgba(255,245,220,.92)';
    var lt = S.lres >= 1 ? 'The Larder · ' + fmt(Math.round(S.lres)) + ' put by' : 'The Larder';
    cx.strokeText(lt, lp.x, lp.y - 15 * sc);
    cx.fillText(lt, lp.x, lp.y - 15 * sc);
    cx.restore();
}

// a few nurses carry food from the nest down the clay shaft to the Larder and come back
function larderStep(m, dt, t) {
    var ld = m.ld, lp = larderPos(), V = 34 * (m.v || 1) * dt, c, a;
    if (!lp) {
        m.ld = null;
        m.carry = 0;
        return false;
    }
    c = cav();
    var top = at(0, lp.q);
    m.tend = 0;
    if (ld.ph === 'go') {
        m.carry = 2;
        m.act = 'Carrying food down to the Larder';
        if (walkTo(m, top.x, top.y, V)) {
            ld.ph = 'down';
            ld.s = 0;
        }
    }
    else if (ld.ph === 'down' || ld.ph === 'up') {
        ld.s += (ld.ph === 'down' ? 1 : -1) * V / Math.max(1, lp.q.LEN);
        if (ld.ph === 'down' && ld.s >= 1) {
            ld.s = 1;
            ld.ph = 'stay';
            ld.wt = 4 + Math.random() * 5;
        }
        if (ld.ph === 'up' && ld.s <= 0) {
            ld.s = 0;
            ld.ph = 'home';
        }
        a = at(ld.s, lp.q);
        m.px = a.x + a.nx * (m.l || 0) * 2;
        m.py = a.y + a.ny * (m.l || 0) * 2;
        m.ang = ld.ph === 'down' ? a.ang : a.ang + Math.PI;
        m.act = ld.ph === 'down' ? 'Carrying food down to the Larder' : 'Heading back up to the nest';
    }
    else if (ld.ph === 'stay') {
        m.carry = 0;
        m.act = 'Stacking seeds in the Larder';
        ld.wt -= dt;
        m.ang += Math.sin(t * 3 + m.ph) * dt;
        if (ld.wt <= 0)
            ld.ph = 'up';
    }
    else {
        m.act = 'Heading back up to the nest';
        if (walkTo(m, c.x + (m.l || 0) * 30, QY + 30, V)) {
            m.ld = null;
            m.lcool = t + 40 + Math.random() * 40;
        }
    }
    return true;
}
