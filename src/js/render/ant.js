/* render/ant.js
   Drawing one ant (every class), with cached pictures for speed when there are lots.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

/* Big colonies: only about 1,400 ants are drawn (VCAP per class: nurses, foragers, soldiers,
   scouts, super majors). The counts and balance do not change. */
var VCAP = [250, 600, 400, 80, 80], SPR = {}, SPRN = 0;

// normal ants are drawn from small cached pictures when there are lots of them, which is much faster
function antDraw(x, y, ang, sz, leaf, ph, kd, fast) {
    if (!fast || kd === 3 || kd === 7 || sz > 8 || BITE) {
        drawAnt(x, y, ang, sz, leaf, ph, kd);
        return;
    }
    var sb = Math.max(.25, Math.round(dpr * K * uz * 4) / 4), pb = Math.floor((((ph % 6.2832) + 6.2832) % 6.2832) / 6.2832 * 12), key = kd + '|' + pb + '|' + (leaf || 0) + '|' + Math.round(sz * 10) + '|' + sb, sp = SPR[key], half = sz * 1.7 + 2;
    if (!sp) {
        if (SPRN > 700) {
            SPR = {};
            SPRN = 0;
        }
        var c = document.createElement('canvas'), g, old = cx;
        c.width = c.height = Math.max(2, Math.ceil(half * 2 * sb));
        g = c.getContext('2d');
        g.setTransform(sb, 0, 0, sb, c.width / 2, c.height / 2);
        cx = g;
        drawAnt(0, 0, 0, sz, leaf, (pb + .5) / 12 * 6.2832, kd);
        cx = old;
        sp = SPR[key] = { c: c, w: c.width / sb };
        SPRN++;
    }
    cx.save();
    cx.translate(x, y);
    cx.rotate(ang);
    cx.drawImage(sp.c, -sp.w / 2, -sp.w / 2, sp.w, sp.w);
    cx.restore();
}

function drawAnt(x, y, ang, sz, leaf, ph, kd) {
    cx.save();
    cx.translate(x, y);
    cx.rotate(ang);
    if (kd === 3) {
        queen(sz / Math.sqrt(ZM[S.tier]), ph);
        cx.restore();
        return;
    }
    sz *= 1.55;
    cx.fillStyle = 'rgba(255,235,190,.13)';
    cx.beginPath();
    cx.ellipse(sz * .3, 0, sz * .9, sz * .42, 0, 0, 7);
    cx.fill();
    cx.translate(0, Math.sin(ph * 1.7) * sz * .04);
    if (K * uz < .68) {
        var u2 = sz / 3.6 * .72, sk = kd === 7 ? '#3a0f0a' : skinCol();
        cx.strokeStyle = '#120a05';
        cx.lineWidth = Math.max(.3, u2 * .4);
        cx.lineCap = 'round';
        cx.beginPath();
        for (var j2 = -1; j2 <= 1; j2++) {
            var s2 = Math.sin(ph + (j2 === 0 ? Math.PI : 0)) * u2 * .45, b2 = j2 * u2 * .55 + u2 * .1;
            cx.moveTo(b2, 0);
            cx.lineTo(b2 + u2 * .6 + s2, u2 * 1.5);
            cx.moveTo(b2, 0);
            cx.lineTo(b2 + u2 * .6 - s2, -u2 * 1.5);
        }
        cx.moveTo(u2 * 1.5, -u2 * .3);
        cx.lineTo(u2 * 2.7, -u2 * .8);
        cx.moveTo(u2 * 1.5, u2 * .3);
        cx.lineTo(u2 * 2.7, u2 * .8);
        cx.stroke();
        cx.fillStyle = AB[kd] || sk;
        cx.beginPath();
        cx.ellipse(-u2 * 1.35, 0, u2 * .9, u2 * .75, 0, 0, 7);
        cx.fill();
        cx.fillStyle = sk;
        cx.beginPath();
        cx.ellipse(0, 0, u2 * .62, u2 * .46, 0, 0, 7);
        cx.ellipse(u2 * 1.2, 0, u2 * .7, u2 * .6, 0, 0, 7);
        cx.fill();
        cx.restore();
        return;
    }
    var u = sz / 3.6 * .72, sc = kd === 6, so = kd === 1 || kd === 7, ab = { 1: '#b8341a', 4: '#e48cab', 5: '#5f9a2e', 6: '#2f86cc', 7: '#6b1d14', 8: '#e2a52e' }[kd] || skinCol(), L = sc ? 1.5 : 1.2, j, s;
    cx.fillStyle = 'rgba(0,0,0,.22)';
    cx.beginPath();
    cx.ellipse(-u * .3, u * .55, u * 2.3, u * .9, 0, 0, 7);
    cx.fill();
    cx.rotate(Math.sin(ph) * .045);
    cx.strokeStyle = '#120a05';
    cx.lineWidth = Math.max(.3, u * .4);
    cx.lineJoin = 'round';
    cx.beginPath();
    for (j = -1; j <= 1; j++) {
        // tripod gait: this side's front and rear legs move with the other side's middle leg
        var gpj = ph + (j === 0 ? Math.PI : 0), sw = Math.sin(gpj), lf = Math.max(0, Math.cos(gpj)), bx = j * u * .32 + u * .05, spr = j === 1 ? .75 : j === -1 ? -.85 : -.05;
        s = sw * u * .5;
        // left side (sw), then right side (-sw, so the lift is on the other phase)
        cx.moveTo(bx, 0);
        cx.lineTo(bx + u * (.5 + spr) + s, u * L);
        cx.lineTo(bx + u * (.2 + spr * 1.6) + s * 1.6, u * L * 1.7 * (1 - .16 * lf));
        var lr = Math.max(0, -Math.cos(gpj));
        cx.moveTo(bx, 0);
        cx.lineTo(bx + u * (.5 + spr) - s, -u * L);
        cx.lineTo(bx + u * (.2 + spr * 1.6) - s * 1.6, -u * L * 1.7 * (1 - .16 * lr));
    }
    var aw = Math.sin(ph * .5) * u * .3;
    cx.moveTo(u * 1.5, -u * .3);
    cx.lineTo(u * 2.3, -u * .9 + aw);
    cx.lineTo(u * 2.9, -u * .6 + aw);
    cx.moveTo(u * 1.5, u * .3);
    cx.lineTo(u * 2.3, u * .9 - aw);
    cx.lineTo(u * 2.9, u * .6 - aw);
    cx.stroke();
    cx.fillStyle = ab;
    cx.beginPath();
    cx.ellipse(-u * 1.35, 0, u * (sc ? .95 : .9), u * (sc ? .62 : .78), 0, 0, 7);
    cx.fill();
    cx.fillStyle = 'rgba(255,255,255,.28)';
    cx.beginPath();
    cx.ellipse(-u * 1.5, -u * .28, u * .5, u * .2, 0, 0, 7);
    cx.fill();
    if (kd === 4) {
        cx.strokeStyle = 'rgba(255,255,255,.9)';
        cx.lineWidth = u * .3;
        cx.beginPath();
        cx.moveTo(-u * 1.3, -u * .7);
        cx.lineTo(-u * 1.3, u * .7);
        cx.stroke();
    }
    if (so) {
        cx.strokeStyle = 'rgba(20,5,2,.7)';
        cx.lineWidth = u * .22;
        cx.beginPath();
        cx.moveTo(-u * 1.6, -u * .6);
        cx.lineTo(-u * 1.6, u * .6);
        cx.moveTo(-u * 1.1, -u * .65);
        cx.lineTo(-u * 1.1, u * .65);
        cx.stroke();
    }
    if (kd === 7) {
        cx.fillStyle = '#2a0a06';
        for (j = 0; j < 3; j++) {
            cx.beginPath();
            cx.moveTo(-u * (1.9 - j * .6), -u * .7);
            cx.lineTo(-u * (1.6 - j * .6), -u * 1.5);
            cx.lineTo(-u * (1.3 - j * .6), -u * .7);
            cx.fill();
        }
    }
    cx.fillStyle = kd === 7 ? '#3a0f0a' : skinCol();
    cx.beginPath();
    cx.ellipse(0, 0, u * .62, u * .46, 0, 0, 7);
    cx.fill();
    cx.fillStyle = 'rgba(255,255,255,.12)';
    cx.beginPath();
    cx.ellipse(-u * .1, -u * .18, u * .35, u * .14, 0, 0, 7);
    cx.fill();
    cx.fillStyle = so ? '#3a0f08' : skinCol();
    cx.beginPath();
    cx.ellipse(u * 1.2, 0, u * (kd === 7 ? 1.15 : kd === 8 ? .8 : so ? .9 : .65), u * (kd === 7 ? 1.05 : kd === 8 ? .7 : so ? .78 : .58), 0, 0, 7);
    cx.fill();
    if (kd === 7) {
        var ch = .25 + Math.sin(ph * .6) * .12;
        cx.fillStyle = '#f1e6cf';
        cx.strokeStyle = '#5a3a12';
        cx.lineWidth = u * .12;
        [1, -1].forEach(function (d) { cx.beginPath(); cx.moveTo(u * 1.9, d * u * .35); cx.bezierCurveTo(u * 3.1, d * u * (.95 + ch), u * 4.1, d * u * (.95 + ch), u * 4.7, d * u * (.15 + ch * .2)); cx.bezierCurveTo(u * 4, d * u * (.5 + ch * .3), u * 3, d * u * .5, u * 2, d * u * .05); cx.closePath(); cx.fill(); cx.stroke(); cx.fillStyle = '#c9b48c'; for (var q = 0; q < 3; q++) {
            var tx = u * (3.1 + q * .5), ty = d * u * (.5 + ch * .5 - q * .1);
            cx.beginPath();
            cx.moveTo(tx, ty);
            cx.lineTo(tx + u * .12, ty - d * u * .32);
            cx.lineTo(tx + u * .3, ty);
            cx.fill();
        } cx.fillStyle = '#f1e6cf'; });
        cx.fillStyle = '#ff4a2a';
        cx.beginPath();
        cx.arc(u * 1.5, -u * .45, u * .14, 0, 7);
        cx.arc(u * 1.5, u * .45, u * .14, 0, 7);
        cx.fill();
    }
    if ((so || kd === 8) && kd !== 7) {
        var bo = BITE * .55;
        cx.strokeStyle = '#e8d9c0';
        cx.lineWidth = u * .28;
        cx.beginPath();
        cx.moveTo(u * 1.9, -u * .25);
        cx.lineTo(u * (2.5 + bo * .3), -u * (.65 + bo));
        cx.lineTo(u * (2.85 + bo * .2), -u * (.3 + bo * .6));
        cx.moveTo(u * 1.9, u * .25);
        cx.lineTo(u * (2.5 + bo * .3), u * (.65 + bo));
        cx.lineTo(u * (2.85 + bo * .2), u * (.3 + bo * .6));
        cx.stroke();
    }
    cx.fillStyle = '#fff';
    var er = Math.max(.26, u * .2);
    cx.beginPath();
    cx.arc(u * 1.45, -u * .32, er, 0, 7);
    cx.fill();
    cx.beginPath();
    cx.arc(u * 1.45, u * .32, er, 0, 7);
    cx.fill();
    if (leaf >= 6)
        drawBits(u, leaf - 5);
    else if (leaf) {
        cx.save();
        cx.translate(u * 3.1, Math.sin(ph * .8) * u * .15);
        cx.scale(1.35, 1.35);
        var cg = leaf === true ? 1 : leaf;
        if (cg === 2) {
            cx.save();
            cx.globalCompositeOperation = 'lighter';
            var gg = cx.createRadialGradient(0, 0, 0, 0, 0, u * 2.2);
            gg.addColorStop(0, 'rgba(120,255,200,.55)');
            gg.addColorStop(1, 'rgba(120,255,200,0)');
            cx.fillStyle = gg;
            cx.beginPath();
            cx.arc(0, 0, u * 2.2, 0, 7);
            cx.fill();
            cx.restore();
            cx.fillStyle = '#8ff5d0';
            cx.strokeStyle = '#2a8a6a';
            cx.lineWidth = u * .14;
            cx.beginPath();
            cx.arc(0, 0, u * .95, 0, 7);
            cx.fill();
            cx.stroke();
            cx.fillStyle = 'rgba(255,255,255,.7)';
            cx.beginPath();
            cx.arc(-u * .3, -u * .3, u * .3, 0, 7);
            cx.fill();
        }
        else if (cg === 3) {
            cx.rotate(.5);
            cx.fillStyle = '#e0cfa0';
            cx.strokeStyle = '#6a5428';
            cx.lineWidth = u * .14;
            cx.beginPath();
            cx.moveTo(-u * 1.0, 0);
            cx.lineTo(-u * .4, -u * .8);
            cx.lineTo(u * .7, -u * .7);
            cx.lineTo(u * 1.1, u * .1);
            cx.lineTo(u * .3, u * .8);
            cx.lineTo(-u * .7, u * .6);
            cx.closePath();
            cx.fill();
            cx.stroke();
        }
        else if (cg === 4) {
            cx.fillStyle = '#5a3a22';
            cx.strokeStyle = '#2a170a';
            cx.lineWidth = u * .14;
            cx.beginPath();
            cx.arc(0, 0, u * .85, 0, 7);
            cx.fill();
            cx.stroke();
            cx.fillStyle = 'rgba(255,220,170,.25)';
            cx.beginPath();
            cx.arc(-u * .25, -u * .25, u * .3, 0, 7);
            cx.fill();
        }
        else {
            cx.rotate(.3);
            cx.fillStyle = '#74c653';
            cx.strokeStyle = '#2f6a1e';
            cx.lineWidth = u * .16;
            cx.beginPath();
            cx.ellipse(0, 0, u * 1.9, u * 1.15, 0, 0, 7);
            cx.fill();
            cx.stroke();
            cx.strokeStyle = 'rgba(30,80,20,.7)';
            cx.lineWidth = u * .14;
            cx.beginPath();
            cx.moveTo(-u * 1.7, 0);
            cx.lineTo(u * 1.7, 0);
            cx.moveTo(-u * .4, 0);
            cx.lineTo(u * .3, -u * .7);
            cx.moveTo(u * .3, 0);
            cx.lineTo(u * 1, -u * .6);
            cx.stroke();
        }
        cx.restore();
    }
    cx.restore();
}
