/* layers/caves.js
   Deep dark layer: the Crystal Caves and the scouts who map them.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

// the Crystal Caves: the chamber at the end of the deep-dark shaft
function cavesOn() { return (S.deep || 0) >= 3; }
function cavesPos() {
    var qs = [trunkQ(0), trunkQ(1), trunkQ(2)];
    if (!qs[0] || !qs[1] || !qs[2])
        return null;
    var pe = qs[2].PT[qs[2].PT.length - 1];
    return { qs: qs, x: pe[0], y: pe[1] };
}
function drawCaves(now) {
    var cp = cavesPos(), sc, i, gl;
    if (!cp)
        return;
    cx.save();
    cx.translate(0, -cam);
    cx.save();
    cx.globalCompositeOperation = 'lighter';
    gl = .22 + .08 * Math.sin(now * .0018);
    glow(cp.x, cp.y, 34, '120,170,255', gl);
    cx.restore();
    var P3 = [[-11, 7, 2, 8], [-6, 8, 2.6, 12], [-1, 8, 3.2, 16], [5, 8, 2.4, 11], [10, 7, 1.8, 7]];
    for (i = 0; i < P3.length; i++)
        prism(cp.x + P3[i][0], cp.y + P3[i][1], P3[i][2], P3[i][3], i);
    sc = .7 / (K * uz);
    cx.font = '700 ' + (8 * sc) + 'px system-ui';
    cx.textAlign = 'center';
    cx.lineWidth = 2 * sc;
    cx.strokeStyle = 'rgba(0,0,0,.65)';
    cx.fillStyle = 'rgba(220,235,255,.95)';
    cx.strokeText('The Crystal Caves', cp.x, cp.y - 18 * sc);
    cx.fillText('The Crystal Caves', cp.x, cp.y - 18 * sc);
    cx.restore();
}
// Six shards make one jelly, at most 4 jelly a day (S.crS shards, S.crD day, S.crN jelly given that day)
function crystalFind(x, y) {
    var d = new Date().toDateString();
    S.crS = (S.crS || 0) + 1;
    fx.push({ x: x, y: y - 8, vx: 0, vy: -16, l: 1.2, t: '+1 crystal', f: 11, c: '#a9c8ff', g: 0 });
    if (!S.crSeen) {
        S.crSeen = 1;
        toast('A scout brought back a crystal shard from the Crystal Caves. Every six shards make 1 royal jelly.');
    }
    if (S.crD !== d) {
        S.crD = d;
        S.crN = 0;
    }
    if (S.crS >= TUNING.caves.shardsPerJelly) {
        if (S.crN < TUNING.caves.jellyPerDay) {
            S.crS -= 6;
            S.crN++;
            gainJelly(1);
            toast('Six crystal shards polished into 1 royal jelly.');
        }
        else
            S.crS = 6;
    }
}
// a scout walks down the main tunnel, across the nest and down all three shafts, maps the caves, then climbs back
function crystalStep(m, dt, t) {
    var c = m.cr, cp = cavesPos(), V = 30 * (m.v || 1) * dt, a, q;
    if (!cp) {
        m.cr = null;
        return false;
    }
    if (c.ph === 'main') {
        m.p = Math.min(1, m.p + V / Math.max(1, LEN));
        m.d = 1;
        m.act = 'Heading down to the Crystal Caves';
        if (m.p >= 1) {
            c.ph = 'nest';
            a = at(1);
            m.px = a.x;
            m.py = a.y;
        }
        return true;
    }
    if (c.ph === 'nest') {
        a = at(0, cp.qs[0]);
        m.act = 'Heading down to the Crystal Caves';
        if (walkTo(m, a.x, a.y, V)) {
            c.ph = 'down';
            c.i = 0;
            c.s = 0;
        }
        return true;
    }
    if (c.ph === 'map') {
        c.wt -= dt;
        m.act = 'Mapping the Crystal Caves';
        m.px = cp.x + Math.cos(t * .7 + m.ph) * 11;
        m.py = cp.y + 1 + Math.sin(t * 1.1 + m.ph) * 4;
        m.ang = Math.atan2(Math.cos(t * 1.1 + m.ph) * 4.4, -Math.sin(t * .7 + m.ph) * 7.7);
        if (Math.random() < dt * .6)
            fx.push({ x: m.px, y: m.py - 6, vx: 0, vy: -12, l: .8, t: '\u2726', f: 9, c: '#a9c8ff', g: 0 });
        if (c.wt <= 0) {
            crystalFind(m.px, m.py);
            c.ph = 'up';
            c.i = 2;
            c.s = 1;
        }
        return true;
    }
    if (c.ph === 'down' || c.ph === 'up') {
        q = cp.qs[c.i];
        c.s += (c.ph === 'down' ? 1 : -1) * V / Math.max(1, q.LEN);
        if (c.ph === 'down' && c.s >= 1) {
            if (c.i < 2) {
                c.i++;
                c.s = 0;
            }
            else {
                c.s = 1;
                c.ph = 'map';
                c.wt = 18 + Math.random() * 10;
            }
        }
        else if (c.ph === 'up' && c.s <= 0) {
            if (c.i > 0) {
                c.i--;
                c.s = 1;
            }
            else {
                c.s = 0;
                c.ph = 'nestB';
            }
        }
        q = cp.qs[c.i];
        a = at(Math.max(0, Math.min(1, c.s)), q);
        m.px = a.x;
        m.py = a.y;
        m.ang = c.ph === 'down' ? a.ang : a.ang + Math.PI;
        m.act = c.ph === 'down' ? 'Heading down to the Crystal Caves' : 'Climbing back up from the Crystal Caves';
        return true;
    }
    if (c.ph === 'nestB') {
        m.act = 'Climbing back up from the Crystal Caves';
        if (walkTo(m, QX, QY, V)) {
            m.p = 1;
            m.d = -1;
            c.ph = 'mainB';
        }
        return true;
    }
    m.cr = null;
    m.ccool = t + 60 + Math.random() * 60;
    return false;
}
