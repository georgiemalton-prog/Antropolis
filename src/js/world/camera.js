/* world/camera.js
   Camera, zoom, panning, render quality and the visible-area rectangle.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

function panTo(x) { camX = camXc(x - W / (2 * uz)); selFollow = false; follow = performance.now() + 8000; }

/* Render quality: phones have very dense screens, so drawing every pixel is slow. Start at a sensible cap,
   and step down automatically if the game cannot keep up (remembered for next time). */
var rqStep = 0, RQ = [2, 1.5, 1.2, 1, .8], rqAcc = 0, rqN = 0, rqWarm = 45;

function rqDpr() { return Math.min(window.devicePixelRatio || 1, RQ[rqStep]); }

// cap = the frame limiter's frames a second (0 = none): a capped frame is slow only if it runs well past the cap
function rqTick(dt, cap) {
    if (rqWarm > 0) {
        rqWarm--;
        return;
    }
    if (dt <= 0)  // very slow frames (dt held at .1) count too, so the slowest phones step down
        return;
    rqAcc += dt;
    if (++rqN < 45)
        return;
    var avg = rqAcc / rqN;
    rqAcc = rqN = 0;
    if (avg > (cap ? 1.3 / cap : .027) && rqStep < RQ.length - 1 && rqDpr() > RQ[RQ.length - 1]) {
        rqStep++;
        try { localStorage.setItem('thecolony_rq2', String(rqStep)); }
        catch (e) { }
        dpr = rqDpr();
        cv.width = Math.round((sizeT.cw || cv.clientWidth) * dpr);
        cv.height = Math.round((parseFloat(cv.style.height) || cv.clientHeight) * dpr);
        rqWarm = 30;
    }
}

// the part of the world on screen (with a margin); tunnel segments wholly outside it are skipped
var VR = { x0: -1e9, x1: 1e9, y0: -1e9, y1: 1e9 };
function setVR() { var m = 40; VR.x0 = camX - m; VR.x1 = camX + W / uz + m; VR.y0 = cam - m; VR.y1 = cam + H / uz + m; }
function vto(px, py, x, y) {
    if ((px < VR.x0 && x < VR.x0) || (px > VR.x1 && x > VR.x1) || (py < VR.y0 && y < VR.y0) || (py > VR.y1 && y > VR.y1))
        cx.moveTo(x, y);
    else
        cx.lineTo(x, y);
}

function dayState() {
    var d = ((S.days || 0) / 3.4 + .08) % 1, sn = Math.sin(d * 6.2832);
    return { d: d, s: sn, night: Math.max(0, Math.min(1, (.12 - sn) / .55)) };
}

function wideL() { return -(S.reach || 0) * W; }
function wideR() { return W + (S.reach || 0) * W; }
function camXc(v) { return Math.max(wideL(), Math.min(wideR() - W / uz, v)); }

function camClamp(v) { return Math.max(-SK, Math.min(WHX() - H / uz, v)); }

// closest zoom: as the colony grows the world gets wider and is shrunk to fit the screen, so the cap
// grows with it and the closest view stays the same size as in a new colony (4x at the start)
function uzMax() { return Math.max(4, 4.4 / K); }

function setZoom(z) { var o = uz; z = Math.max(1, Math.min(uzMax(), z)); if (z === o)
    return; var cwx = camX + W / (2 * o), cwy = camT + H / (2 * o); uz = z; camX = camXc(cwx - W / (2 * z)); camT = camClamp(cwy - H / (2 * z)); follow = performance.now() + 5000; }

function pdist() { var k = Object.keys(ptrs), a = ptrs[k[0]], b = ptrs[k[1]]; return Math.hypot(a.x - b.x, a.y - b.y); }

function pend(e) { delete ptrs[e.pointerId]; pd0 = 0; }
