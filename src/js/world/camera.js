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
// WOB > 0 (only while the ground layer draws tunnels): segments get a gentle hand-dug wobble of up to
// WOB world px, fixed by position so every layer of the tunnel wobbles the same way; ends stay put
var WOB = 0;
function vto(px, py, x, y) {
    if ((px < VR.x0 && x < VR.x0) || (px > VR.x1 && x > VR.x1) || (py < VR.y0 && y < VR.y0) || (py > VR.y1 && y > VR.y1))
        cx.moveTo(x, y);
    else if (WOB) {
        var dx = x - px, dy = y - py, L = Math.hypot(dx, dy), n = Math.floor(L / 5), k;
        for (k = 1; k < n; k++) {
            var t = k / n, ox = px + dx * t, oy = py + dy * t, w = (Math.sin(ox * .31 + oy * .17) * .6 + Math.sin(ox * .11 - oy * .23 + 1.7) * .4) * WOB * Math.sin(Math.PI * t);
            cx.lineTo(ox - dy / L * w, oy + dx / L * w);
        }
        cx.lineTo(x, y);
    }
    else
        cx.lineTo(x, y);
}

function dayState() {
    var d = ((S.days || 0) / 3.4 + .08) % 1, sn = Math.sin(d * 6.2832);
    return { d: d, s: sn, night: Math.max(0, Math.min(1, (.12 - sn) / .55)) };
}

function wideL() { return -(S.reach || 0) * W; }
function wideR() { return W + (S.reach || 0) * W; }
// zoomed out wider than the world: keep it in the middle of the screen
function camXc(v) { var vw = W / uz; if (vw >= wideR() - wideL()) return (wideL() + wideR() - vw) / 2; return Math.max(wideL(), Math.min(wideR() - vw, v)); }

// the view can scroll far enough for the bottom of the world to clear the tab bar
function camClamp(v) { return Math.max(-SK, Math.min(Math.max(-SK, WHX() - H / uz + navPad() / (K * uz)), v)); }

// closest zoom: as the colony grows the world gets wider and is shrunk to fit the screen, so the cap
// grows with it and the closest view stays the same size as in a new colony (4x at the start)
function uzMax() { return Math.max(4, 4.4 / K); }

// furthest zoom (build 84): out until the whole colony fits top to bottom, but no further than .3 (so ants stay
// visible as dots and phones aren't asked to draw too much at once)
function uzMin() { return Math.min(1, Math.max(.3, H / (WHX() + SK + 60))); }
function setZoom(z) { var o = uz; z = Math.max(uzMin(), Math.min(uzMax(), z)); if (z === o)
    return; var cwx = camX + W / (2 * o), cwy = camT + H / (2 * o); uz = z; camX = camXc(cwx - W / (2 * z)); camT = camClamp(cwy - H / (2 * z)); follow = performance.now() + 5000; }

function pdist() { var k = Object.keys(ptrs), a = ptrs[k[0]], b = ptrs[k[1]]; return Math.hypot(a.x - b.x, a.y - b.y); }

function pend(e) { delete ptrs[e.pointerId]; pd0 = 0; }
