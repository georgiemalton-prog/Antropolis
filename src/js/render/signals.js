/* render/signals.js
   Ants talking to each other (build 86, from the Living Colony prototype). Purely what you see: no numbers change.
   - Alarm: when danger arrives, the alarm spreads out from it ant to ant at walking pace. Each ant it reaches
     flashes as it is touched and glows red for a while; nest ants on the Nest tab catch it as it comes in.
   - Recruiting: when food is found, a scout runs home along the tunnel laying a glowing green trail, and taps
     antennae with the ants at the nest (green sparks) to send foragers out.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

var ALM = null, MSGR = [];
var SIGT = { alarmSpeed: 70, alarmFor: 14, msgFor: 4.5 };

// danger at world point (x, y): start an alarm wave there (a new one replaces an older one)
function alarmAt(x, y) {
    ALM = { x: x, y: y, t: 0, seen: 0 };
    marchers.forEach(function (m) { m.al = 0; });
}
// food found at main-tunnel position p: a scout runs home with the news
function recruitFrom(p) {
    if (MSGR.length < 3)
        MSGR.push({ p: p, t: 0, last: null });
}

function signalsTick(dt) {
    if (ALM) {
        ALM.t += dt;
        var r = ALM.t * SIGT.alarmSpeed, n = 0;
        // ants within reach of the spreading front catch the alarm, each a moment after its neighbours
        marchers.forEach(function (m) {
            if (m.al > 0 || m.wx == null)
                return;
            var d = Math.hypot(m.wx - ALM.x, m.wy - ALM.y) * (.85 + (m.u || 0) * .3);
            if (d < r) {
                m.al = SIGT.alarmFor;
                if (n++ < 6 && tab === 'tun')
                    fx.push({ x: m.wx, y: m.wy, vx: 0, vy: 0, l: .45, ring: 5, c: 'rgba(255,80,50,.9)', g: 0 });
            }
        });
        if (ALM.t > SIGT.alarmFor + 20)
            ALM = null;
    }
    marchers.forEach(function (m) { if (m.al > 0) m.al = Math.max(0, m.al - dt); });
    for (var i = MSGR.length - 1; i >= 0; i--) {
        var g = MSGR[i];
        g.t += dt;
        // the scout hurries home along the main tunnel, dropping scent as it goes
        g.p = Math.min(1, g.p + dt * .16);
        var a = at(g.p);
        if (!g.last || Math.hypot(a.x - g.last.x, a.y - g.last.y) > 5) {
            g.last = { x: a.x, y: a.y };
            SCENT.push({ x: a.x + Math.sin(g.t * 37) * 1, y: a.y + Math.cos(g.t * 23) * 1, l: 18 });
        }
        if (g.p >= 1) {
            // home: antennae tapped with the ants round the queen, and off they go
            for (var k = 0; k < 6; k++)
                fx.push({ x: QX + Math.sin(k * 2.4) * 20, y: QY - 8 + Math.cos(k * 1.7) * 8, vx: 0, vy: 0, l: .5 + k * .08, ring: 6, c: 'rgba(140,240,110,.9)', g: 0 });
            fx.push({ x: QX, y: QY - 26, vx: 0, vy: -14, l: 1.6, t: 'Food found! Foragers, follow my trail', f: 10, c: '#b6f59a', g: 0 });
            MSGR.splice(i, 1);
        }
    }
    for (var s = SCENT.length - 1; s >= 0; s--) {
        SCENT[s].l -= dt;
        if (SCENT[s].l <= 0)
            SCENT.splice(s, 1);
    }
}
var SCENT = [];

// drawn under the ants in the Tunnel view: the green trail, red glows under alarmed ants, the running scouts
function drawSignals(now) {
    cx.save();
    cx.translate(0, -cam);
    var i;
    if (SCENT.length) {
        cx.globalCompositeOperation = 'lighter';
        cx.fillStyle = 'rgba(120,240,100,.75)';
        for (i = 0; i < SCENT.length; i++) {
            var sc = SCENT[i];
            cx.globalAlpha = Math.min(1, sc.l / 6);
            cx.beginPath();
            cx.arc(sc.x, sc.y, 1.6, 0, 7);
            cx.fill();
        }
        cx.globalAlpha = 1;
        cx.globalCompositeOperation = 'source-over';
    }
    var any = false;
    for (i = 0; i < marchers.length; i++)
        if (marchers[i].al > 0) { any = true; break; }
    if (any) {
        cx.globalCompositeOperation = 'lighter';
        marchers.forEach(function (m) {
            if (!(m.al > 0) || m.wx == null)
                return;
            var a = Math.min(1, m.al / 3) * (.42 + .16 * Math.sin(now * .012 + (m.u || 0) * 9));
            cx.fillStyle = 'rgba(255,60,30,' + a + ')';
            cx.beginPath();
            cx.arc(m.wx, m.wy, 8.5, 0, 7);
            cx.fill();
        });
        cx.globalCompositeOperation = 'source-over';
    }
    MSGR.forEach(function (g) {
        var a = at(g.p);
        cx.fillStyle = 'rgba(140,240,110,.45)';
        cx.beginPath();
        cx.arc(a.x, a.y, 11, 0, 7);
        cx.fill();
        drawAnt(a.x, a.y, a.ang, SZ[3] * 1.5, false, now * .03, 6);
    });
    cx.restore();
}
