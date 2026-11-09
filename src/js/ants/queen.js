/* ants/queen.js
   The queen walking about her chamber.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

// the queen wanders slowly around her chamber and goes back to her bed now and then
var Q = { ox: 7, oy: -3, tx: 7, ty: -3, fx: 1, tf: 1, ph: 0, wait: 4, tilt: 0, n: 0, sv: 0 };
function qPos() { return { x: QX + Q.ox, y: QY + Q.oy }; }
function qRear() { var s = 17 / Math.sqrt(ZM[S.tier]); return { x: QX + Q.ox - Q.fx * s * 2.3, y: QY + Q.oy + 5 }; }
function queenWalk(dt) {
    var dx, dy, d, v = 0, vt = 0, sg, tr, wx, mv;
    if (still) { Q.ox = 7; Q.oy = -3; Q.sv = 0; return; }
    if (Q.wait > 0)
        Q.wait -= dt;
    else {
        dx = Q.tx - Q.ox;
        dy = Q.ty - Q.oy;
        d = Math.hypot(dx, dy);
        if (d < 1.2) {
            var home = Q.tx === 7 && Q.ty === -3;
            Q.wait = home ? 7 + Math.random() * 8 : 1.5 + Math.random() * 4;
            Q.n++;
            wx = 24 + S.tier * 4;
            if (!home && Q.n % 3 === 0) { Q.tx = 7; Q.ty = -3; }
            else
                for (tr = 0; tr < 4; tr++) {
                    Q.tx = 7 + (Math.random() * 2 - 1) * wx;
                    Q.ty = -6 + Math.random() * 20;
                    if (Math.hypot(Q.tx - Q.ox, Q.ty - Q.oy) > 12)
                        break;
                }
        }
        else {
            sg = dx > 2 ? 1 : dx < -2 ? -1 : Q.tf;
            Q.tf = sg;
            if (Math.abs(Q.fx - sg) < .12) {
                vt = Math.min(6.5 + S.tier * .4, d * 1.3 + 1.2);
            }
        }
    }
    Q.sv += (vt - Q.sv) * Math.min(1, dt * 2.2);
    if (vt > 0 && Q.sv > .05) {
        mv = Math.min(Q.sv * dt, Math.hypot(Q.tx - Q.ox, Q.ty - Q.oy));
        d = Math.hypot(Q.tx - Q.ox, Q.ty - Q.oy) || 1;
        Q.ox += (Q.tx - Q.ox) / d * mv;
        Q.oy += (Q.ty - Q.oy) / d * mv;
    }
    v = Q.sv;
    Q.fx += (Q.tf - Q.fx) * Math.min(1, dt * 7);
    Q.ph += v * dt * 1.2;
    Q.tilt += ((vt > 0 ? Math.atan2(Q.ty - Q.oy, Math.max(8, Math.abs(Q.tx - Q.ox))) * .4 * Q.tf : 0) - Q.tilt) * Math.min(1, dt * 3);
}
