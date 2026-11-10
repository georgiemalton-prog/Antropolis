/* ants/nurses.js
   Nurses and the nest: rooms, carrying eggs, tending the injured, energy and naps, temperament.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

// ---- ant behaviour: eggs, injuries and movement ----

// in the new nest the brood is piled between the queen's bed and the Nursery (world units around the queen's home spot)
function nestEggPos(i) { var row = Math.floor(i / 6), col = i % 6; return { x: QX + 7 + (84 + col * 11 + (row % 2) * 5.5 - Math.min(row, 5) * 2) / 1.1, y: QY - 3 + (8 - Math.min(row, 6) * 8 - (col % 2) * 2.5) / 1.1 }; }
// where egg i is drawn and hatches: the nest scene on the Nest tab, the world nest otherwise
function broodPos(i) { return tab === 'nest' ? nestEggPos(i) : eggPos(i); }
function eggPos(i) { var sd = QX < W * .5 ? 1 : -1; return { x: QX + sd * (72 + S.tier * 5 + (i % 6) * 9), y: QY + 14 + Math.floor(i / 6) * 9 }; }

function slotPos(i) { var p = infPos(); return { x: p.x + ((i % 6) - 2.5) * 7, y: p.y + Math.floor(i / 6) * 6 - 3 }; }

function infPos() { return { x: QX - 20, y: QY + 58 + S.tier * 2 }; }

/* Temperament: every ant gets a few lasting traits worked out from its own random number m.u,
   so they need no saving. Same ant, same character, every time the game loads. */
function trait(m, n) { return (m.u * (n * 7.31 + 3.7)) % 1; }
function briskness(m) { return .8 + trait(m, 1) * .45; }

var ROOMACT = ['Tending the fungus garden', 'Caring for larvae in the Nursery', 'Keeping the Barracks tidy', 'Attending the Royal Court'];

function openRooms() { var r = []; for (var i = 0; i < S.tier && i < 4; i++)
    if (!(exc && exc.i === i))
        r.push(i); return r; }

function walkTo(m, tx, ty, v) {
    var dx = tx - m.px, dy = ty - m.py, d = Math.hypot(dx, dy);
    if (d < .01)
        return true;
    if (d > .5)
        m.ang = Math.atan2(dy, dx);
    var st = Math.min(d, v);
    m.px += dx / d * st;
    m.py += dy / d * st;
    return d <= v;
}

function keeperStep(m, dt, ci, t) {
    var kp = m.kp;
    if (!kp) {
        if (ci < 0)
            return false;
        kp = m.kp = { i: ci, ph: 'enter', p: 1, s: 0, wt: 0, tx: 0, ty: 0, pz: 0 };
    }
    if ((ci !== kp.i || ci < 0) && (kp.ph === 'work' || kp.ph === 'stub' || kp.ph === 'up' || kp.ph === 'enter'))
        kp.ph = kp.ph === 'enter' ? 'home' : kp.ph === 'up' ? 'down' : kp.ph === 'stub' ? 'out' : 'out';
    if (kp.i >= S.tier) {
        m.kp = null;
        return false;
    }
    var V = 24 * (m.v || 1) * dt, jp = PT[CI[kp.i]], pj = CUM[CI[kp.i]] / LEN, cxn = jp[0] + (kp.i % 2 ? -34 : 34), a, ln = (m.l || 0) * tunW() * .3;
    m.tend = 0;
    m.act = kp.ph === 'work' ? ROOMACT[kp.i] : kp.ph === 'out' || kp.ph === 'down' || kp.ph === 'home' ? 'Heading back to the nest' : 'Walking to the ' + ROOMS[kp.i].n;
    if (kp.ph === 'enter') {
        if (walkTo(m, QX, QY - 4, V)) {
            kp.ph = 'up';
            kp.p = 1;
        }
    }
    else if (kp.ph === 'up' || kp.ph === 'down') {
        kp.p += (kp.ph === 'up' ? -1 : 1) * V / LEN;
        if (kp.ph === 'up' && kp.p <= pj) {
            kp.p = pj;
            kp.ph = 'stub';
            kp.s = 0;
        }
        if (kp.ph === 'down' && kp.p >= 1) {
            kp.p = 1;
            kp.ph = 'home';
        }
        a = at(kp.p);
        m.px = a.x + a.nx * ln;
        m.py = a.y + a.ny * ln;
        m.ang = kp.ph === 'up' ? a.ang + Math.PI : a.ang;
    }
    else if (kp.ph === 'stub' || kp.ph === 'out') {
        kp.s += (kp.ph === 'stub' ? 1 : -1) * V / 34;
        if (kp.ph === 'stub' && kp.s >= 1) {
            kp.s = 1;
            kp.ph = 'work';
            kp.wt = 40 + Math.random() * 50;
        }
        if (kp.ph === 'out' && kp.s <= 0) {
            kp.s = 0;
            kp.ph = 'down';
            kp.p = pj;
        }
        m.px = jp[0] + (cxn - jp[0]) * kp.s;
        m.py = jp[1] + ln * .5;
        m.ang = (cxn > jp[0]) === (kp.ph === 'stub') ? 0 : Math.PI;
    }
    else if (kp.ph === 'work') {
        kp.wt -= dt;
        if (kp.pz > 0)
            kp.pz -= dt;
        else if (walkTo(m, kp.tx || cxn, kp.ty || jp[1], V * .6)) {
            var r = Math.random();
            kp.tx = cxn + (r * 2 - 1) * 15;
            kp.ty = jp[1] + (Math.random() * 2 - 1) * 6;
            kp.pz = .8 + Math.random() * 2.2;
        }
        if (kp.wt <= 0)
            kp.ph = 'out';
    }
    else if (kp.ph === 'home') {
        if (walkTo(m, QX + (m.l || 0) * 30, QY + 26, V)) {
            m.kp = null;
            m.kcool = t + 15 + Math.random() * 25;
        }
    }
    return true;
}

function energyStep(m, dt) {
    if (m.en == null)
        m.en = 55 + ((m.u || .5) * 37 % 1) * 45;
    if (m.inj)
        return;
    if (m.nap > 0) {
        m.nap -= dt;
        m.en = Math.min(100, m.en + dt * 100 / 16 * (1 + Math.min(1.2, S.nurses / 18)));
        if (m.en >= 100 || m.nap <= 0) {
            m.nap = 0;
            m.tired = 0;
            m.en = Math.max(m.en, 90);
        }
        else if (Math.random() < dt * .6 && m.wx != null)
            fx.push({ x: m.wx + 3, y: m.wy - 7, vx: 3, vy: -8, l: 1, t: 'z', f: 9, c: '#cfe4ff', g: 0 });
        return;
    }
    m.en = Math.max(0, m.en - dt * 100 / 520);
    if (m.en < 22 && !m.tired && !(m.k === 1 && m.sf))
        m.tired = 1;
    if (!m.tired)
        return;
    var k = m.k, rest = k === 0 || k === 3 || m.en <= 1;
    if (k === 1 && !m.sf && !m.cg && !m.home && m.tp != null)
        m.home = 1;
    if (k === 1 && !m.cg && !m.sf && m.p >= .985)
        rest = true;
    if ((k === 2 || k === 4) && Math.abs(m.p - Math.max(1 - .006 - (m.fi % 14) * .004, 1 - S.dug * .9)) < .012)
        rest = true;
    if (k === 1 && m.sf && m.en <= 1)
        rest = false;
    if (rest) {
        m.nap = 16;
        m.tired = 1;
    }
}
