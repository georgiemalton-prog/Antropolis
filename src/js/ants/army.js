/* ants/army.js
   Soldiers and super majors: guard posts, mustering for waves, charging invaders, rally and alarm.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

var alarmT = 0, restList = [], bossWarned = false;

/* moveArmy runs once a frame and moves every marching ant that is not a forager:
   the injured, nurses, scouts, soldiers and super majors. First it counts who is busy with what
   (armyCounts), then each ant takes one step of whatever it is doing (armyStep).

   Jobs an ant can be on (each is a small state object on the ant, null when off duty):
     m.kp  nurse looking after a room          (keeperStep,  ants/nurses.js)
     m.ld  nurse stocking the Larder           (larderStep,  layers/larder.js)
     m.cr  scout mapping the Crystal Caves     (crystalStep, layers/caves.js)
     m.mo  soldier in the Giant Mole battle     (moleStep,    threats/mole.js)
     m.tr  soldier meeting a termite raid       (trmStep,     threats/termites.js)
     m.dr  soldier drilling in the Armoury, or fighting cave crickets (drillStep, layers/armoury.js)
   With no job, soldiers guard their posts or charge invaders, scouts patrol the side tunnels
   and nurses tend eggs, help the injured or tidy the nest. */
function moveArmy(dt, t) {
    alarmT = Math.max(0, alarmT - dt);
    restList.length = 0;
    var C = armyCounts();
    marchers.forEach(function (m) { armyStep(m, dt, t, C); });
}

// one pass over the colony: how many ants are on each job, and how many each job may take right now
function armyCounts() {
    var C = { lo: 1 - S.dug, slot: 0, nid: 0, injPos: [], nN: 0, keepOpen: {}, keepCnt: {}, keepTot: 0 };
    var ni = injN(), ipf = infPos();
    C.tend = Math.min(ni * 2, Math.max(1, Math.ceil(S.nurses / 3)));
    C.keepRooms = TUNING.tunnelRooms ? openRooms() : [];
    C.keepRooms.forEach(function (r) { C.keepOpen[r] = true; C.keepCnt[r] = 0; });
    marchers.forEach(function (m) { if (m.k === 0 && !m.inj && m.kp && C.keepOpen[m.kp.i] && m.kp.ph !== 'out' && m.kp.ph !== 'down' && m.kp.ph !== 'home') {
        C.keepCnt[m.kp.i]++;
        C.keepTot++;
    } });
    marchers.forEach(function (m) { if (m.k === 0 && !m.inj)
        C.nN++; if (m.inj) {
        if (m.st === 0) {
            var a0 = at(m.p);
            if (Math.hypot(a0.x - ipf.x, a0.y - ipf.y) < 80)
                C.injPos.push({ x: a0.x, y: a0.y });
        }
        else
            C.injPos.push({ x: m.px, y: m.py });
    } });
    C.ldTot = 0;
    C.ldCap = larderOn() ? Math.min(TUNING.larder.carriers, Math.floor(C.nN / TUNING.larder.nursesPer)) : 0;
    C.drTot = 0;
    C.drCap = armouryOn() && !foes.length ? Math.min(TUNING.armoury.drillers, Math.floor(S.soldiers / TUNING.armoury.soldiersPer)) : 0;
    C.crTot = 0;
    C.crCap = cavesOn() ? Math.min(TUNING.caves.scouts, Math.max(1, Math.floor(S.scouts / TUNING.caves.scoutsPer))) : 0;
    C.moTot = 0;
    C.moCap = 36;
    C.trTot = 0;
    var trOn = trm.length && !trm.res && !foes.length && termOpen();
    C.trCap = trOn ? Math.min(30, 6 + Math.floor(S.soldiers / 8)) : 0;
    trmDef = -1;
    marchers.forEach(function (m) { if (m.ld) C.ldTot++; if (m.dr) C.drTot++; if (m.cr) C.crTot++; if (m.mo) C.moTot++; if (m.tr) {
        C.trTot++;
        if (m.tr.ph === 'tun' && m.tr.s > trmDef)
            trmDef = m.tr.s;
    } });
    if (trm.length)
        C.drCap = 0;
    C.crLive = cricLive();
    cricDef.length = 0;
    if (C.crLive && !foes.length && !trm.length)
        C.drCap = Math.max(C.drCap, Math.min(8, 2 + Math.floor(S.soldiers / 20)));
    // door guards (build 83): like real soldier ants plugging the nest holes, a couple of the biggest stand in the
    // tunnel mouth and a couple at the queen's door, heads facing out; super majors first, then soldiers
    var cand = [];
    marchers.forEach(function (m) { if ((m.k === 2 || m.k === 4) && !m.inj && !m.tired && !m.mo && !m.tr && !m.dr && !(m.nap > 0)) cand.push(m); });
    cand.sort(function (a, b) { return (b.k - a.k) || (a.u - b.u); });
    C.doorTop = S.dug >= 1 && tunOK() ? cand.slice(0, 2) : [];
    C.doorNest = cand.slice(C.doorTop.length, C.doorTop.length + 2);
    C.keepCap = C.keepRooms.length ? Math.min(C.keepRooms.length * 2, Math.floor(C.nN / 4)) : 0;
    C.keepRecall = C.injPos.length > 0 && C.nN - C.keepTot < C.tend + 1;
    return C;
}

// one step for one ant
function armyStep(m, dt, t, C) {
    var k = m.k;
    if (m.inj) {
        injuredStep(m, dt, C);
        return;
    }
    if (m.nap > 0) {
        m.tend = 0;
        m.act = 'Resting';
        if (k === 0)
            C.nid++;
        return;
    }
    if (k === 0) {
        nurseStep(m, dt, t, C);
        return;
    }
    if (k === 3 && m.cr) {
        if (crystalStep(m, dt, t))
            return;
    }
    if (k === 3 && S.sideTunnels > 0 && S.dug >= .3) {
        scoutPatrol(m, dt, t, C);
        return;
    }
    if (k === 2 || k === 4)
        soldierStep(m, dt, t, C);
}

// injured ants are carried down to the infirmary and lie in a slot until healed
function injuredStep(m, dt, C) {
    if (m.st === 0) {
        m.p = Math.min(1, m.p + dt * .1);
        if (m.p >= 1) {
            m.st = 1;
            m.px = QX;
            m.py = QY;
        }
    }
    else {
        var s = slotPos(C.slot++);
        m.px += (s.x - m.px) * Math.min(1, dt * 1.2);
        m.py += (s.y - m.py) * Math.min(1, dt * 1.2);
        m.st = Math.hypot(s.x - m.px, s.y - m.py) < 1.2 ? 2 : 1;
    }
    m.rt = m.st === 2 ? (m.rt || 0) + dt : 0;
}

// nurses: a room or Larder job first, otherwise help the injured, tend eggs, or tidy the nest
function nurseStep(m, dt, t, C) {
    if (nurseJob(m, dt, t, C)) {
        C.nid++;
        return;
    }
    var tg = nurseTarget(m, dt, t, C), tx = tg.x, ty = tg.y;
    var dx = tx - m.px, dy = ty - m.py;
    if (Math.hypot(dx, dy) > 2.5)
        m.ang = Math.atan2(dy, dx);
    else if (m.tend && m.face)
        m.ang = Math.atan2(m.face.y - m.py, m.face.x - m.px);
    var dd = Math.hypot(dx, dy), stp = Math.min(dd, (dd > 30 ? 30 : 10 + dd * .67) * (m.v || 1) * briskness(m) * dt);
    if (dd > .01) {
        m.px += dx / dd * stp;
        m.py += dy / dd * stp;
    }
    C.nid++;
}

// room keeping (m.kp) and stocking the Larder (m.ld). True when the nurse is busy with one this frame.
function nurseJob(m, dt, t, C) {
    var ci = -1;
    if (m.kp)
        ci = C.keepRecall || !C.keepOpen[m.kp.i] ? -1 : m.kp.i;
    else if (!m.ld && !C.keepRecall && !(m.kcool > t) && C.keepTot < C.keepCap && C.nid >= C.tend) {
        var best = -1;
        C.keepRooms.forEach(function (r) { if (best < 0 || C.keepCnt[r] < C.keepCnt[best])
            best = r; });
        if (best >= 0 && C.keepCnt[best] < 2) {
            ci = best;
            C.keepCnt[best]++;
            C.keepTot++;
        }
    }
    if (ci >= 0 || m.kp) {
        m.cst = 0;
        m.carry = 0;
        if (keeperStep(m, dt, ci, t))
            return true;
    }
    if (!m.ld && !m.kp && !C.keepRecall && C.ldTot < C.ldCap && C.nid >= C.tend && !(m.lcool > t) && larderPos()) {
        m.ld = { ph: 'go', s: 0, wt: 0 };
        C.ldTot++;
    }
    if (m.ld && (C.keepRecall || foes.length)) {
        if (m.ld.ph === 'down' || m.ld.ph === 'stay')
            m.ld.ph = 'up';
        else if (m.ld.ph === 'go')
            m.ld.ph = 'home';
    }
    return !!(m.ld && larderStep(m, dt, t));
}

// where a nurse with no job heads this frame: an injured ant, an egg (or fetching one), or a spot in the nest
function nurseTarget(m, dt, t, C) {
    var tx, ty, nid = C.nid, tend = C.tend, injPos = C.injPos, nN = C.nN;
    if (nid < tend && injPos.length) {
        var tg = injPos[nid % injPos.length];
        tx = tg.x + (nid % 2 ? -4 : 4);
        ty = tg.y - 4;
        m.tend = 0;
        m.act = 'Helping an injured ant';
    }
    else if (S.eggs.length && nid - tend < Math.min(nN - tend, Math.ceil(S.eggs.length * 1.5))) {
        var ei = ((nid - tend) >> 1) % S.eggs.length, ep = eggPos(ei), sd = (nid - tend) & 1 ? 1 : -1;
        tx = ep.x + sd * 6;
        ty = ep.y - 5;
        m.tend = 1;
        m.act = 'Tending an egg';
        m.face = ep;
        // some nurses now and then fetch an egg from the queen and carry it to the pile
        if (!m.cst) {
            m.cwt = (m.cwt == null ? 5 + m.u * 20 : m.cwt) - dt;
            if (m.cwt <= 0 && trait(m, 2) > .35)
                m.cst = 1;
        }
        if (m.cst === 1) {
            tx = QX + sd * 8;
            ty = QY + 12;
            m.tend = 0;
            m.act = 'Fetching an egg from the queen';
            if (Math.hypot(tx - m.px, ty - m.py) < 4) {
                m.cst = 2;
                m.carry = 1;
            }
        }
        else if (m.cst === 2) {
            tx = ep.x + sd * 3;
            ty = ep.y - 3;
            m.tend = 0;
            m.act = 'Carrying an egg to the pile';
            if (Math.hypot(tx - m.px, ty - m.py) < 4) {
                m.cst = 0;
                m.carry = 0;
                m.cwt = 12 + Math.random() * 25;
                m.face = ep;
            }
        }
    }
    else
        return nurseIdle(m, dt, t, C);
    return { x: tx, y: ty };
}

// nothing urgent: wander the nest, rest and share food, visit a building, or shelter by the queen when invaders are in
function nurseIdle(m, dt, t, C) {
    var tx, ty, nid = C.nid;
    m.tend = 0;
    m.cst = 0;
    m.carry = 0;
    m.act = 'Tidying the nest';
    var N = Math.max(1, C.nN), R = Math.sqrt((nid + .5) / N), th = nid * 2.39996 + t * .02, y0 = QY + 30, y1 = WH - 14;
    m.wt = (m.wt || 0) - dt;
    if (m.rest > 0) {
        m.rest -= dt;
        m.act = 'Resting';
        for (var ri = Math.max(0, restList.length - 8); ri < restList.length; ri++) {
            var rm = restList[ri];
            if (Math.hypot(rm.px - m.px, rm.py - m.py) < 14) {
                m.act = rm.act = 'Sharing food with a nestmate';
                if (Math.random() < dt * 1.5)
                    fx.push({ x: (rm.px + m.px) / 2, y: (rm.py + m.py) / 2 - 3, vx: 0, vy: -8, l: .7, t: '•', f: 8, c: '#ffd98a', g: 0 });
                break;
            }
        }
        restList.push(m);
    }
    if (m.wt <= 0) {
        m.wt = (2.5 + Math.random() * 4) * (.7 + trait(m, 3) * 1.4);
        if (trait(m, 4) > .6 && Math.random() < .25)
            m.rest = 4 + Math.random() * 8;
        m.jx = (Math.random() - .5) * 10;
        m.jy = (Math.random() - .5) * 6;
        if (!(m.rest > 0) && Math.random() < .45) {
            var vl = [], vi;
            for (vi = 0; vi < BDEF.length; vi++)
                if (S.bld[BDEF[vi].id] > 0)
                    vl.push(vi);
            if (vl.length) {
                m.vb = vl[Math.floor(Math.random() * vl.length)];
                m.vt = 6 + Math.random() * 8;
            }
        }
    }
    tx = W * .5 + Math.cos(th) * R * W * .42 + (m.jx || 0);
    ty = (y0 + y1) / 2 + Math.sin(th) * R * Math.max(10, (y1 - y0) / 2) + (m.jy || 0);
    if (m.vb != null) {
        m.vt -= dt;
        if (m.vt <= 0 || !(S.bld[BDEF[m.vb].id] > 0))
            m.vb = null;
        else if (!(m.rest > 0)) {
            var bq = bpos(m.vb);
            tx = bq.x + (m.jx || 0) * 2.2;
            ty = bq.y + 7 + (m.jy || 0);
            m.act = 'Visiting the ' + BSHORT[m.vb];
        }
    }
    if (m.rest > 0) {
        tx = m.px;
        ty = m.py;
    }
    else if (foes.length && trait(m, 7) > .3) {
        // danger in the tunnel: the nurses huddle close to the queen
        tx = QX + Math.cos(th * 3) * (14 + trait(m, 8) * 26);
        ty = QY + 24 + Math.sin(th * 3) * 10;
        m.act = 'Sheltering near the queen';
    }
    return { x: tx, y: ty };
}

// scouts walk to a side tunnel, patrol it end to end, make discoveries, and sometimes head off to the Crystal Caves
function scoutPatrol(m, dt, t, C) {
    if (m.q == null || m.q >= S.sideTunnels) {
        m.q = Math.floor(Math.random() * S.sideTunnels);
        m.s = 0;
        m.sd = 1;
        m.mp = m.p == null ? 1 : m.p;
        m.mt = juncP(m.q);
        m.xf = 1;
    }
    if (m.xf) {
        var dm = m.mt - m.mp;
        m.mp += Math.sign(dm) * Math.min(Math.abs(dm), dt * 30 * (m.v || 1) / Math.max(1, LEN));
        m.p = m.mp;
        m.ph += dt * 8 * m.v;
        if (Math.abs(m.mt - m.mp) < 1e-4)
            m.xf = 0;
        return;
    }
    if (m.pz > 0) {
        m.pz -= dt;
        return;
    }
    if (Math.random() < dt * .12)
        m.pz = 1.5;
    var pr = S.sideDug[m.q] == null ? 1 : S.sideDug[m.q];
    m.s += m.sd * dt * 24 * (m.v || 1) / Math.max(1, BP[m.q] ? BP[m.q].LEN * pr : 600);
    if (m.s > 1) {
        m.s = 1;
        m.sd = -1;
        if (pr >= 1 && performance.now() > (m.cool || 0)) {
            m.cool = performance.now() + 45000;
            discover(m.q);
        }
    }
    else if (m.s < 0 && C.crTot < C.crCap && !(m.ccool > t) && m.hero == null && trait(m, 11) > .4 && cavesPos()) {
        m.cr = { ph: 'main', i: 0, s: 0, wt: 0 };
        C.crTot++;
        m.p = juncP(m.q);
        m.d = 1;
        m.q = null;
        m.xf = 0;
        return;
    }
    else if (m.s < 0) {
        var nq = Math.floor(Math.random() * S.sideTunnels);
        m.s = 0;
        m.sd = 1;
        if (nq !== m.q) {
            m.mp = juncP(m.q);
            m.mt = juncP(nq);
            m.xf = 1;
        }
        m.q = nq;
    }
}

// soldiers and super majors: a job if there is one (mole battle, termite line, Armoury), otherwise fight or guard
function soldierStep(m, dt, t, C) {
    var k = m.k;
    if (m.mo || (MF && !MF.end && C.moTot < C.moCap && m.hero == null && trait(m, 12) < .55)) {
        if (!m.mo) {
            if (m.dr) {
                m.dr = null;
                m.dcool = t + 30;
            }
            m.mo = { ph: 'main', i: 0, s: 0, slot: C.moTot };
            C.moTot++;
        }
        if (moleStep(m, dt, t) || m.mo)
            return;
    }
    if (!m.mo && (m.tr || (C.trTot < C.trCap && !m.dr && m.hero == null && !m.tired && !m.ex))) {
        if (!m.tr) {
            m.tr = { ph: 'main', s: 0, slot: C.trTot };
            C.trTot++;
        }
        if (trmStep(m, dt, t))
            return;
    }
    if (k === 2) {
        if (!m.dr && C.drTot < C.drCap && m.hero == null && (C.crLive ? !m.tired && !m.tr : !(m.dcool > t) && trait(m, 9) > .5) && armouryPos()) {
            m.dr = { ph: 'main', s: 0, wt: 0 };
            C.drTot++;
        }
        if (m.dr) {
            if (drillStep(m, dt, t) || m.dr)
                return;
        }
    }
    if (foes.length)
        soldierCharge(m, dt);
    else
        soldierGuard(m, dt, t, C);
}

// invaders in the tunnel: run at them (faster while the alarm is sounding)
function soldierCharge(m, dt) {
    var fo = foes[m.fi % foes.length];
    var dpf = fo.p - m.p;
    m.p += Math.sign(dpf) * Math.min(Math.abs(dpf), dt * (m.k === 4 ? 60 : 95) * (m.v || 1) * (alarmT > 0 ? 1.6 : 1) / Math.max(1, LEN));
    m.d = dpf > 0 ? 1 : -1;
}

// no invaders. Build 83, after how real colonies defend: a few door guards plug the entrances (heads out), the rest
// patrol a stretch of tunnel each, or keep watch where a side tunnel joins. When a wave is due the patrols spread out
// into a defensive line down the upper tunnel instead of all crowding the mouth. Tired soldiers wait in the nest.
function soldierGuard(m, dt, t, C) {
    var k = m.k, lo = C.lo, top = C.doorTop.indexOf(m), nest = C.doorNest.indexOf(m), post, spd = k === 4 ? 12 : 26, look = false;
    var G = 3 + Math.min(S.sideTunnels, 6), isG = m.u < S.orders.gd / 100 || G === 3, sl = isG ? m.fi % 3 : 3 + m.fi % (G - 3);
    var due = nf - performance.now(), mu = S.dug >= 1 && due < 25000 && due > -5000 && !(MF && !MF.end) && !m.tired && tunOK();
    if (!tunOK() || m.tired)
        post = Math.max(1 - .006 - (m.fi % 14) * .004, 1 - S.dug * .9);
    else if (top >= 0) {
        // in the tunnel mouth, one just behind the other
        post = lo + .006 + top * .007;
        look = true;
    }
    else if (nest >= 0) {
        post = 1 - .012 - nest * .008;
        look = true;
    }
    else if (mu) {
        // a defensive line: spread along the upper third of the tunnel, a little way apart
        post = lo + .03 + m.u * .32 * (1 - lo);
        spd = k === 4 ? 50 : 80;
    }
    else if (!isG && S.sideDug[sl - 3] >= 1) {
        // watch post where a side tunnel joins
        post = juncP(sl - 3) + (m.u * .03 - .015);
        look = true;
    }
    else {
        // patrol: each soldier walks up and down its own stretch of the tunnel, stopping now and then to look about
        var a = lo + .04, span = Math.max(.02, (1 - .05) - a), sec = Math.floor(trait(m, 3) * 4), s0 = a + sec * span / 4;
        if (m.pt == null || m.pt < s0 - .001 || m.pt > s0 + span / 4 + .001)
            m.pt = s0 + trait(m, 4) * span / 4;
        if (Math.abs(m.pt - m.p) < .004) {
            m.pw = (m.pw || 0) - dt;
            if (m.pw <= 0) {
                m.pt = s0 + Math.random() * span / 4;
                m.pw = 1.5 + Math.random() * 4;
            }
        }
        post = m.pt;
    }
    if (k === 4 && !look && !mu && tunOK() && !m.tired)
        post += Math.sin(t * .05 + mSeed(m)) * Math.min(.03, 40 / Math.max(1, LEN));
    m.sp = (m.sp || 0) - dt;
    if (m.sp <= 0) {
        m.sp = (3 + Math.random() * 5) * (.7 + trait(m, 6));
        m.mode = k !== 4 && !look && Math.random() < .15 + trait(m, 5) * .45 ? 1 : 0;
    }
    var d2 = post - m.p;
    m.act = top >= 0 ? 'Guarding the tunnel mouth' : nest >= 0 ? 'Guarding the queen\'s door' : mu ? 'Holding the line: a wave is coming' : m.pt != null && post === m.pt ? 'On patrol' : null;
    if (Math.abs(d2) > .004) {
        m.p += Math.sign(d2) * Math.min(Math.abs(d2), dt * spd * (m.v || 1) / Math.max(1, LEN));
        m.d = d2 > 0 ? 1 : -1;
    }
    else if (m.mode === 1) {
        m.d = m.fi % 2 ? -1 : 1;
        m.p = post + Math.sin(t * 5 + mSeed(m)) * .0022;
    }
    else {
        // standing still: face out, towards where trouble comes from
        m.d = -1;
        m.p = post;
    }
}

// ---- combat: waves, invaders and loot ----

function foeSz(f) { return (8 + S.tier * 1.5) * (f.boss ? 1.9 : 1); }

function dps() { return heroB(2) * (rallyT > 0 ? 1.5 : 1) * (healthy(2) * 3 * (1 + .25 * S.classLevel[2]) * (S.classLevel[2] >= 4 ? 1.15 : 1) * (S.classLevel[2] >= 8 ? 1.25 : 1) + healthy(4) * 30 * (1 + .25 * S.classLevel[4]) * (S.classLevel[4] >= 4 ? 1.25 : 1) * (S.classLevel[4] >= 8 ? 1.25 : 1) + (healthy(0) + healthy(1) + healthy(3)) * .3) * (1 + .15 * pk('hardy')) * (S.tier >= 3 ? 1 + .15 * (1 + .2 * rl(2)) : 1) * (1 + .12 * S.bld.rax) * (1 + TUNING.hall.bonus * (S.hall || 0)); }

function majorDps() { return (rallyT > 0 ? 1.5 : 1) * healthy(4) * 30 * (1 + .25 * S.classLevel[4]) * (S.classLevel[4] >= 4 ? 1.25 : 1) * (S.classLevel[4] >= 8 ? 1.25 : 1) * (1 + .15 * pk('hardy')) * (S.tier >= 3 ? 1 + .15 * (1 + .2 * rl(2)) : 1) * (1 + .12 * S.bld.rax); }

// active abilities for fights
var rallyT = 0, rallyCd = 0, alarmCd = 0, abT = 0;
function fighting() { return !!(foes.length || RAID || (typeof trm !== 'undefined' && trm.length)); }
function rallyGo() {
    if (rallyCd > 0 || rallyT > 0)
        return;
    if (!fighting()) {
        toast('No enemies right now. Save Rally for a fight.');
        return;
    }
    if (healthy(2) + healthy(4) < 1) {
        toast('You need soldiers to rally.');
        return;
    }
    rallyT = 10;
    rallyCd = 40;
    pulseRing('255,150,60');
    flash = .35;
    SFX.rally();
    toast('Rally! Soldiers hit 50% harder for 10 seconds.');
    abilityUi(true);
}
function alarmGo() {
    if (alarmCd > 0)
        return;
    if (injN() < 1) {
        toast('Nobody is hurt right now.');
        return;
    }
    var n = 0;
    while (n < 15 && healOne())
        n++;
    alarmCd = 50;
    pulseRing('120,230,140');
    SFX.buy();
    toast('Alarm! Nurses rushed ' + n + ' ant' + (n === 1 ? '' : 's') + ' back to health.');
    abilityUi(true);
}
function abilityTick(dt) {
    if (rallyT > 0)
        rallyT = Math.max(0, rallyT - dt);
    if (rallyCd > 0)
        rallyCd = Math.max(0, rallyCd - dt);
    if (alarmCd > 0)
        alarmCd = Math.max(0, alarmCd - dt);
    if (!S.rallyTip && S.tier >= 1 && foes.length) {
        S.rallyTip = 1;
        toast('Tip: on the Tunnel tab, tap Rally to hit harder in a fight.');
    }
    abT -= dt;
    if (abT <= 0) {
        abT = .25;
        abilityUi(false);
    }
}
function abilityUi(force) {
    var r = $('abR'), a = $('abA'), box = $('abil');
    if (!r || !box)
        return;
    var show = S.tier >= 1 && S.dug >= 1 && !dead;
    box.style.display = show ? 'flex' : 'none';
    if (!show)
        return;
    var rt = rallyT > 0 ? 'Rallying ' + Math.ceil(rallyT) + 's' : rallyCd > 0 ? 'Ready in ' + Math.ceil(rallyCd) + 's' : fighting() ? 'Tap to rally!' : 'Ready for a fight', at = alarmCd > 0 ? 'Ready in ' + Math.ceil(alarmCd) + 's' : injN() > 0 ? injN() + ' hurt. Tap to heal!' : 'Ready';
    r.innerHTML = '<span><b>Rally</b><span class="mute">' + rt + '</span></span>';
    a.innerHTML = '<span><b>Sound the alarm</b><span class="mute">' + at + '</span></span>';
    r.style.opacity = rallyCd > 0 || rallyT > 0 ? .55 : 1;
    a.style.opacity = alarmCd > 0 ? .55 : 1;
    r.style.outline = fighting() && rallyCd <= 0 ? '2px solid #ffd23f' : 'none';
    a.style.outline = injN() > 0 && alarmCd <= 0 ? '2px solid #7ee08a' : 'none';
}
