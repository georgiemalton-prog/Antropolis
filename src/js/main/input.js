/* main/input.js
   Touch controls: tapping the nest, dragging and pinching the tunnel view, tapping ants, following a worker.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

// tapping in the nest view (called once from boot.js)
// press and hold a building (or the queen) to open its card; a quick tap on a building says so
var NHOLD = null;
function initNestTaps() {
    function stop() { if (NHOLD) clearTimeout(NHOLD.t); NHOLD = null; }
    cv.addEventListener('pointermove', function (e) { if (NHOLD && Math.hypot(e.clientX - NHOLD.x, e.clientY - NHOLD.y) > 12) stop(); });
    cv.addEventListener('pointerup', function () {
        if (NHOLD && !NHOLD.done && NHOLD.f)
            toast('Press and hold the ' + NHOLD.f.n + ' to see its upgrades.');
        stop();
    });
    cv.addEventListener('pointercancel', stop);
    cv.addEventListener('pointerdown', function (e) {
        if (tab !== 'nest' || dead)
            return;
        var r = cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top, nf = nsFeatureAt(px, py), nq = !nf && nsQueenAt(px, py);
        stop();
        if (nf || nq) {
            var h = NHOLD = { x: e.clientX, y: e.clientY, f: nf, done: false };
            h.t = setTimeout(function () {
                h.done = true;
                try { if (navigator.vibrate) navigator.vibrate(12); }
                catch (x) { }
                bcard(nf ? nf.id : 'queen');
            }, 450);
        }
        if (nf)
            return;
        var cut = Math.min(2, layGap() * .05);
        S.layTimer = Math.max(0, S.layTimer - cut);
        S.queenTaps = (S.queenTaps || 0) + 1;
        pulseRing('255,233,168');
        pulse = 1;
        SFX.tap();
        fx.push({ x: QX + Q.ox + Math.random() * 50 - 25, y: QY + Q.oy - 31, vx: 0, vy: -40, l: .9, t: '-' + cut.toFixed(1) + 's', f: 13, c: '#ffe9a8', g: 0 });
    });
}

// starting a drag or pinch in the tunnel view (called once from boot.js)
function initTunnelDrag() {
    cv.addEventListener('pointerdown', function (e) { if (tab !== 'tun')
        return; ptrs[e.pointerId] = { x: e.clientX, y: e.clientY }; try {
        cv.setPointerCapture(e.pointerId);
    }
    catch (x) { } if (Object.keys(ptrs).length === 2) {
        pd0 = pdist();
        uz0 = uz;
    } });
}

// dragging and pinching the tunnel view (called once from boot.js)
function initTunnelPinch() {
    cv.addEventListener('pointermove', function (e) {
        var p = ptrs[e.pointerId];
        if (!p || tab !== 'tun')
            return;
        if (Object.keys(ptrs).length === 2) {
            p.x = e.clientX;
            p.y = e.clientY;
            if (pd0 > 0)
                setZoom(uz0 * pdist() / pd0);
            return;
        }
        var dx = e.clientX - p.x, dy = e.clientY - p.y, s = K * uz;
        p.x = e.clientX;
        p.y = e.clientY;
        camT = camClamp(camT - dy / s);
        camX = camXc(camX - dx / s);
        selFollow = false;
        follow = performance.now() + 5000;
    });
}

// tapping an ant to select it (called once from boot.js)
function initTapToSelect() {
    cv.addEventListener('pointerup', function (e) {
        if (!tdn || dead || tab === 'col')
            return;
        var moved = Math.hypot(e.clientX - tdn.x, e.clientY - tdn.y), dtp = performance.now() - tdn.t;
        tdn = null;
        if (moved > 8 || dtp > 450)
            return;
        if (tab === 'nest')
            return;
        var r0 = cv.getBoundingClientRect(), ri = roomAt(camX + (e.clientX - r0.left) / (K * uz), cam + (e.clientY - r0.top) / (K * uz));
        if (ri >= 0) {
            roomCard(ri);
            return;
        }
        if (tab !== 'tun') {
            sel = null;
            return;
        }
        var r = cv.getBoundingClientRect(), sc = K * uz, wx = camX + (e.clientX - r.left) / sc, wy = cam + (e.clientY - r.top) / sc, best = null, bd = 12 + 8 / uz;
        if (bossTap(wx, wy) || goldTap(wx, wy))
            return;
        marchers.forEach(function (m) { if (m.wx == null)
            return; var d = Math.hypot(m.wx - wx, m.wy - wy); if (d < bd) {
            bd = d;
            best = { t: 'm', o: m };
        } });
        crewA.forEach(function (a) { if (a.wx == null)
            return; var d = Math.hypot(a.wx - wx, a.wy - wy); if (d < bd) {
            bd = d;
            best = { t: 'a', o: a };
        } });
        Object.keys(FAO).forEach(function (key) { var a = FAO[key]; if (a.wx == null || performance.now() - a.seen > 500)
            return; var d = Math.hypot(a.wx - wx, a.wy - wy); if (d < bd) {
            bd = d;
            best = { t: 'f', o: a };
        } });
        sel = best;
        if (sel && tab === 'tun') {
            selFollow = true;
            if (uz < 2.4)
                setZoom(2.4);
        }
    });
}

// the follow-a-worker button (called once from boot.js)
function initFollowButton() {
    $('zfol').onclick = function () {
        var pool = [];
        crewA.forEach(function (a) { if (a.wx != null && a.st !== 'idle')
            pool.push({ t: 'a', o: a }); });
        marchers.forEach(function (m) { if (m.wx != null && !m.inj && (m.k === 1 || m.k === 3))
            pool.push({ t: 'm', o: m }); });
        if (!pool.length)
            return toast('No busy ants to follow right now.');
        followIx = (followIx + 1) % pool.length;
        sel = pool[followIx];
        selFollow = true;
        if (uz < 2.4)
            setZoom(2.4);
    };
}
