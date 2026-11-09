/* layers/armoury.js
   Stone layer: the Armoury and the soldiers who drill there.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

// the Armoury: the chamber at the end of the stone layer's shaft
function armouryOn() { return (S.deep || 0) >= 2; }
function armouryPos() {
    var q0 = trunkQ(0), q1 = trunkQ(1);
    if (!q0 || !q1)
        return null;
    var pe = q1.PT[q1.PT.length - 1];
    return { q0: q0, q1: q1, x: pe[0], y: pe[1] };
}
function drawArmoury(now) {
    var ap = armouryPos(), i, sc, x;
    if (!ap)
        return;
    cx.save();
    cx.translate(0, -cam);
    // thorn spears leaning in a rack, and a pebble shield
    cx.strokeStyle = '#7a5a34';
    cx.lineWidth = 1.2;
    for (i = 0; i < 4; i++) {
        x = ap.x - 12 + i * 3.2;
        cx.beginPath();
        cx.moveTo(x, ap.y + 7);
        cx.lineTo(x + 2, ap.y - 6);
        cx.stroke();
        cx.fillStyle = '#d9d2c2';
        cx.beginPath();
        cx.moveTo(x + 2, ap.y - 6);
        cx.lineTo(x + 3.4, ap.y - 10);
        cx.lineTo(x + .8, ap.y - 6.6);
        cx.fill();
    }
    cx.fillStyle = '#8a8a92';
    cx.beginPath();
    cx.arc(ap.x + 9, ap.y + 3, 4.2, 0, 7);
    cx.fill();
    cx.strokeStyle = '#cfcfd6';
    cx.lineWidth = .8;
    cx.stroke();
    sc = .7 / (K * uz);
    cx.font = '700 ' + (8 * sc) + 'px system-ui';
    cx.textAlign = 'center';
    cx.lineWidth = 2 * sc;
    cx.strokeStyle = 'rgba(0,0,0,.65)';
    cx.fillStyle = 'rgba(255,245,220,.92)';
    cx.strokeText('The Armoury', ap.x, ap.y - 15 * sc);
    cx.fillText('The Armoury', ap.x, ap.y - 15 * sc);
    cx.restore();
}

// a few soldiers leave their posts between fights, walk down through the nest and the clay shaft, drill in the Armoury and come back
function drillStep(m, dt, t) {
    var d = m.dr, ap = armouryPos(), V = 30 * (m.v || 1) * dt * (cric.length && !cric.done ? 1.8 : 1), a, top;
    if (!ap) {
        m.dr = null;
        return false;
    }
    if (foes.length && d.ph !== 'up1' && d.ph !== 'up0' && d.ph !== 'nestB' && d.ph !== 'mainB') {
        // invaders: drop the drill and hurry back up
        d.ph = d.ph === 'main' ? 'mainB' : d.ph === 'nest' ? 'nestB' : d.ph === 'down0' ? 'up0' : 'up1';
    }
    if (d.ph === 'main' || d.ph === 'mainB') {
        if (d.ph === 'main') {
            m.p = Math.min(1, m.p + V / Math.max(1, LEN));
            m.d = 1;
            m.act = 'Heading down to the Armoury';
            if (m.p >= 1) {
                d.ph = 'nest';
                a = at(1);
                m.px = a.x;
                m.py = a.y;
            }
            return false;
        }
        m.dr = null;
        m.dcool = t + 60 + Math.random() * 60;
        return false;
    }
    if (d.ph === 'nest' || d.ph === 'nestB') {
        top = at(0, ap.q0);
        if (d.ph === 'nest') {
            m.act = 'Heading down to the Armoury';
            if (walkTo(m, top.x, top.y, V)) {
                d.ph = 'down0';
                d.s = 0;
            }
        }
        else {
            m.act = 'Heading back to guard duty';
            if (walkTo(m, QX, QY, V)) {
                m.p = 1;
                m.d = -1;
                d.ph = 'mainB';
            }
        }
        return true;
    }
    if (cricLive() && (d.ph === 'down1' || d.ph === 'drill' || d.ph === 'up1')) {
        if (d.ph === 'drill')
            d.s = 1;
        d.ph = 'cf';
    }
    if (d.ph === 'cf')
        return cricFight(m, d, ap, V, t);
    var q = d.ph === 'down0' || d.ph === 'up0' ? ap.q0 : ap.q1, dn = d.ph === 'down0' || d.ph === 'down1';
    if (d.ph === 'drill') {
        d.wt -= dt;
        m.act = 'Drilling in the Armoury';
        if (d.wt <= 0)
            d.ph = 'up1';
        // short lunges back and forth on the practice floor
        a = at(1, ap.q1);
        m.px = ap.x - 6 + Math.sin(t * 2.2 + m.ph) * 7;
        m.py = ap.y + 2 + Math.cos(t * 1.3 + m.ph) * 3;
        m.ang = Math.cos(t * 2.2 + m.ph) > 0 ? 0 : Math.PI;
        return true;
    }
    d.s += (dn ? 1 : -1) * V / Math.max(1, q.LEN);
    if (dn && d.s >= 1) {
        d.s = d.ph === 'down0' ? 0 : 1;
        if (d.ph === 'down0')
            d.ph = 'down1';
        else {
            d.ph = 'drill';
            d.wt = 15 + Math.random() * 15;
        }
    }
    else if (!dn && d.s <= 0) {
        d.s = d.ph === 'up1' ? 1 : 0;
        if (d.ph === 'up1')
            d.ph = 'up0';
        else
            d.ph = 'nestB';
    }
    a = at(Math.max(0, Math.min(1, d.s)), q);
    m.px = a.x;
    m.py = a.y;
    m.ang = dn ? a.ang : a.ang + Math.PI;
    m.act = dn ? 'Heading down to the Armoury' : 'Heading back to guard duty';
    return true;
}
