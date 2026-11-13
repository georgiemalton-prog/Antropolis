/* threats/queenguard.js
   Protecting the queen (build 94). When invaders get close to the queen her royal guard (super majors first,
   then soldiers) runs home and forms a ring around her; she stops laying and hides until the danger has passed.
   Invaders that reach her do less harm for every guard in the ring. A hurt queen lays more slowly until the
   nurses have healed her, so letting invaders through costs the colony growth, not just a health bar.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

var QG = { on: 0, t: 0, warned: 0, n: 0 };

function queenThreat() {
    for (var i = 0; i < foes.length; i++)
        if (foes[i].p > TUNING.queen.near && !(foes[i].rv && foes[i].dir < 0))
            return true;
    return false;
}
function guardsIn() {
    var n = 0;
    for (var i = 0; i < marchers.length; i++)
        if (marchers[i].rg && marchers[i].rg.in >= 1)
            n++;
    return n;
}
// share of an invader's damage that still reaches the queen
function qgShield() { return Math.max(TUNING.queen.minHarm, 1 - TUNING.queen.perGuard * guardsIn()); }
function queenHurt() { return S.queenHp < hpMax() * TUNING.queen.hurtAt; }
// egg timer speed: 0 while she hides, slower while she is hurt
function layMul() { return QG.on ? 0 : queenHurt() ? TUNING.queen.hurtLay : 1; }
function layWhy() { return QG.on ? 'Queen hiding' : ''; }

function qgTick(dt) {
    var Tq = TUNING.queen, th = queenThreat();
    if (th && !QG.on) {
        QG.on = 1;
        QG.t = 0;
        var want = Math.min(Tq.guardMax, 2 + Math.floor((S.soldiers + S.superMajors) / 20)), c = [];
        marchers.forEach(function (m) { if ((m.k === 2 || m.k === 4) && !m.inj && !m.mo && !m.tr && !m.dr && !m.xr && m.hero == null) c.push(m); });
        c.sort(function (a, b) { return (b.k === 4) - (a.k === 4) || b.p - a.p; });
        QG.n = Math.min(want, c.length);
        for (var i = 0; i < QG.n; i++)
            c[i].rg = { slot: i, in: 0 };
        feed('Invaders are near the queen! Her royal guard closes ranks around her.', 'bad', function () { var q = qPos(); return { x: q.x, y: q.y }; });
        SFX.rally && SFX.rally();
    }
    else if (!th && QG.on) {
        QG.t += dt;
        if (QG.t > Tq.stayAfter) {
            QG.on = 0;
            marchers.forEach(function (m) { m.rg = null; });
            feed('The danger has passed. The queen is laying again.', 'good', null);
        }
    }
    else
        QG.t = 0;
    if (!QG.warned && foes.some(function (f) { return f.p >= 1 && !f.rv; })) {
        QG.warned = 1;
        toast('The queen is under attack! Every guard by her side softens the blows.');
        feed('The queen is under attack!', 'bad', function () { var q = qPos(); return { x: q.x, y: q.y }; });
    }
    if (!foes.length)
        QG.warned = 0;
}

// one step for a royal guard; true while she is on guard duty
function guardStep(m, dt) {
    if (!QG.on) {
        m.rg = null;
        return false;
    }
    var d = 1 - m.p;
    if (d > .002) {
        m.p += Math.min(d, dt * (m.k === 4 ? 70 : 105) * (m.v || 1) / Math.max(1, LEN));
        m.d = 1;
        m.act = 'Running home to guard the queen';
    }
    else {
        m.rg.in = Math.min(1, m.rg.in + dt * 1.6);
        m.act = 'Guarding the queen';
    }
    return true;
}

// where a royal guard stands: a ring round the queen, facing out
function guardPos(m) {
    var q = qPos(), n = Math.max(1, QG.n), an = -Math.PI / 2 + (m.rg.slot + .5) / n * Math.PI * 2, rx = qSize() * 2.5, ry = qSize() * 1.35, a = at(1), t = m.rg.in;
    return { x: a.x + (q.x + Math.cos(an) * rx - a.x) * t, y: a.y + (q.y - 2 + Math.sin(an) * ry - a.y) * t, ang: an };
}

// faint shield ring on the floor round the queen while the guard is up; brighter for every guard in place
function qgRing(g, x, y, rx, ry, now) {
    if (!QG.on)
        return;
    var gi = guardsIn(), a = .18 + .1 * gi / Math.max(1, QG.n) + .06 * Math.sin(now * .006);
    g.save();
    g.strokeStyle = 'rgba(255,200,90,' + a + ')';
    g.lineWidth = 2;
    g.setLineDash([5, 4]);
    g.lineDashOffset = -now * .01;
    g.beginPath();
    g.ellipse(x, y, rx, ry, 0, 0, 7);
    g.stroke();
    g.restore();
}

// Nest tab: the same guards drawn in a ring round the queen on her bed
function nsRoyalGuard(g, t, now) {
    if (!QG.on)
        return;
    var xf = nsXf(), qp = qPos(), qx = xf.x + xf.s * (qp.x - QX - 7), qy = xf.y + xf.s * (qp.y - QY + 3), s = qSize() * xf.s, rx = s * 3, ry = s * 1.55;
    qgRing(g, qx, qy, rx, ry, now);
    marchers.forEach(function (m) {
        if (!m.rg || !(m.rg.in > 0))
            return;
        var an = -Math.PI / 2 + (m.rg.slot + .5) / Math.max(1, QG.n) * Math.PI * 2, e = m.rg.in;
        g.globalAlpha = e;
        nsAnt(g, qx + Math.cos(an) * rx, qy + Math.sin(an) * ry - (1 - e) * 30, an + Math.sin(t * 6 + m.rg.slot) * .12, m.k, t * 4, false);
        g.globalAlpha = 1;
    });
}
