/* render/surface.js
   Above ground and next door: the anthill, the neighbour colony and its insects.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

function drawHill(now) {
    var hl = S.hillLevel || 0;
    if (hl < 1 && !RAID)
        return;
    var mx = PT[0][0], mr = 28 + S.tier * 8, t = now * .001, i;
    cx.save();
    cx.translate(0, -cam);
    if (hl >= 1) {
        cx.fillStyle = '#8a6440';
        cx.beginPath();
        cx.ellipse(mx, 24, mr + 6 + hl * 5, mr * .5 + hl * 5, 0, Math.PI, 0);
        cx.fill();
        cx.fillStyle = 'rgba(255,230,190,.16)';
        cx.beginPath();
        cx.ellipse(mx - 8, 16, mr * .45, 5, 0, Math.PI, 0);
        cx.fill();
        [-1, 1].forEach(function (d) { var x = mx + d * (mr + 14); cx.fillStyle = '#6a4a2a'; cx.fillRect(x - 2, 8, 4, 16); cx.fillStyle = '#8a5a2a'; cx.beginPath(); cx.moveTo(x - 5, 9); cx.lineTo(x, 3); cx.lineTo(x + 5, 9); cx.fill(); cx.save(); cx.globalCompositeOperation = 'lighter'; glow(x, 12, 9, '255,200,90', .3 + .1 * Math.sin(t * 3 + d)); cx.restore(); });
    }
    if (hl >= 2) {
        for (i = 0; i < 6; i++)
            [-1, 1].forEach(function (d) { var x = mx + d * (mr + 26 + i * 7); cx.fillStyle = i % 2 ? '#8d8d96' : '#a2a2aa'; cx.fillRect(x - 3.5, 17, 7, 8); cx.strokeStyle = 'rgba(0,0,0,.35)'; cx.lineWidth = .6; cx.strokeRect(x - 3.5, 17, 7, 8); });
    }
    if (hl >= 3) {
        cx.fillStyle = '#3f5a22';
        for (i = 0; i < 7; i++)
            [-1, 1].forEach(function (d) { var x = mx + d * (mr + 72 + i * 6); cx.beginPath(); cx.moveTo(x - 3, 25); cx.lineTo(x, 15); cx.lineTo(x + 3, 25); cx.fill(); });
    }
    if (hl >= 4) {
        cx.fillStyle = 'rgba(110,190,235,.85)';
        cx.beginPath();
        cx.ellipse(mx + mr + 40, 24, 14, 3, 0, 0, 7);
        cx.fill();
        cx.fillStyle = 'rgba(255,255,255,.7)';
        cx.fillRect(mx + mr + 36 + Math.sin(t * 2) * 4, 23, 3, 1);
    }
    if (hl >= 5) {
        cx.fillStyle = '#e8c256';
        cx.beginPath();
        cx.moveTo(mx - 5, 20);
        cx.lineTo(mx, -26);
        cx.lineTo(mx + 5, 20);
        cx.fill();
        cx.fillStyle = '#c0392b';
        cx.beginPath();
        cx.moveTo(mx, -25);
        cx.lineTo(mx + 13 + Math.sin(t * 3) * 1.5, -20);
        cx.lineTo(mx, -15);
        cx.fill();
        cx.save();
        cx.globalCompositeOperation = 'lighter';
        glow(mx, -14, 26, '255,210,90', .25);
        cx.restore();
    }
    if (RAID) {
        var r = RAID, tp = RT[r.t], s = tp.s * 1.8, dir = mx > r.x ? 1 : -1, y = 22, n = Math.min(8, S.soldiers || 0);
        for (i = 0; i < n; i++) {
            var sx = mx + (r.x - mx) * (.2 + .6 * i / n) + Math.sin(t * 6 + i) * 2;
            cx.fillStyle = '#2a1208';
            cx.beginPath();
            cx.ellipse(sx, 22 + Math.sin(t * 9 + i) * .8, 2.4, 1.5, 0, 0, 7);
            cx.fill();
            cx.fillStyle = '#d84a30';
            cx.fillRect(sx + 1, 21, 1.2, 1.2);
        }
        cx.save();
        cx.translate(r.x, y);
        cx.scale(dir, 1);
        var w = Math.sin(t * 8);
        cx.fillStyle = 'rgba(0,0,0,.25)';
        cx.beginPath();
        cx.ellipse(0, 3, s * .9, s * .2, 0, 0, 7);
        cx.fill();
        if (r.t === 0) {
            cx.fillStyle = '#4f9a3e';
            cx.beginPath();
            cx.ellipse(0, -s * .45, s * .85, s * .5, 0, 0, 7);
            cx.fill();
            cx.beginPath();
            cx.ellipse(s * .6, -s * .7, s * .4, s * .35, 0, 0, 7);
            cx.fill();
            cx.fillStyle = '#fff';
            cx.beginPath();
            cx.arc(s * .7, -s * .95, 2.2, 0, 7);
            cx.fill();
            cx.fillStyle = '#111';
            cx.beginPath();
            cx.arc(s * .75, -s * .95, 1, 0, 7);
            cx.fill();
            cx.strokeStyle = '#3a7a2e';
            cx.lineWidth = 2.4;
            cx.beginPath();
            cx.moveTo(-s * .5, -s * .2);
            cx.lineTo(-s * .9, -s * .1 + w);
            cx.lineTo(-s * .4, s * .1);
            cx.stroke();
        }
        else if (r.t === 1) {
            cx.strokeStyle = '#2a1636';
            cx.lineWidth = 1.2;
            cx.beginPath();
            for (i = 0; i < 4; i++) {
                var a = (i - 1.5) * .5;
                cx.moveTo(0, -s * .5);
                cx.lineTo(s * Math.cos(a + 1.3) * 1.2 + w * .8, -s * .5 - s * .5 + i);
                cx.moveTo(0, -s * .5);
                cx.lineTo(-s * Math.cos(a + 1.3) * 1.2 - w * .8, -s * .5 - s * .5 + i);
            }
            cx.stroke();
            cx.fillStyle = '#5a2d6e';
            cx.beginPath();
            cx.arc(0, -s * .5, s * .55, 0, 7);
            cx.fill();
            cx.beginPath();
            cx.arc(s * .55, -s * .5, s * .3, 0, 7);
            cx.fill();
            cx.fillStyle = '#ff4040';
            cx.fillRect(s * .6, -s * .6, 1.6, 1.6);
        }
        else if (r.t === 2) {
            cx.fillStyle = '#8a7a6a';
            cx.beginPath();
            cx.ellipse(0, -s * .5, s * .95, s * .5, 0, 0, 7);
            cx.fill();
            cx.strokeStyle = '#8a7a6a';
            cx.lineWidth = s * .14;
            cx.lineCap = 'round';
            cx.beginPath();
            cx.moveTo(s * .8, -s * .6);
            cx.lineTo(s * 1.7, -s * .4);
            cx.stroke();
            cx.fillStyle = '#4a3f36';
            cx.beginPath();
            cx.ellipse(-s * .9, -s * .7, s * .6, s * .35, -.5, 0, 7);
            cx.fill();
            cx.fillStyle = '#111';
            cx.fillRect(s * .75, -s * .85, 1.6, 1.6);
            cx.strokeStyle = '#5a4f46';
            cx.lineWidth = 2.4;
            cx.beginPath();
            cx.moveTo(-s * .3, -s * .1);
            cx.lineTo(-s * .3 + w * 2, s * .15);
            cx.moveTo(s * .4, -s * .1);
            cx.lineTo(s * .4 - w * 2, s * .15);
            cx.stroke();
        }
        else {
            y = -6 + Math.sin(t * 3) * 3;
            cx.translate(0, y - 20);
            cx.fillStyle = '#1a1a22';
            cx.beginPath();
            cx.ellipse(0, -s * .5, s * .8, s * .45, 0, 0, 7);
            cx.fill();
            cx.beginPath();
            cx.arc(s * .75, -s * .7, s * .32, 0, 7);
            cx.fill();
            cx.fillStyle = '#e0a030';
            cx.beginPath();
            cx.moveTo(s * 1, -s * .75);
            cx.lineTo(s * 1.5, -s * .62);
            cx.lineTo(s * 1, -s * .55);
            cx.fill();
            cx.fillStyle = '#2a2a36';
            cx.beginPath();
            cx.moveTo(-s * .2, -s * .6);
            cx.lineTo(-s * .6, -s * .6 - s * 1.1 * w);
            cx.lineTo(s * .2, -s * .6);
            cx.fill();
        }
        cx.restore();
        var bw = 30, fr = Math.max(0, r.hp / r.mhp);
        cx.fillStyle = 'rgba(0,0,0,.6)';
        cx.fillRect(r.x - bw / 2, -28, bw, 4);
        cx.fillStyle = '#e0553f';
        cx.fillRect(r.x - bw / 2 + .5, -27.5, (bw - 1) * fr, 3);
        var hf = Math.max(0, S.hillHp / hhMax());
        cx.fillStyle = 'rgba(0,0,0,.6)';
        cx.fillRect(mx - 20, -40, 40, 4);
        cx.fillStyle = '#7fcf8f';
        cx.fillRect(mx - 19.5, -39.5, 39 * hf, 3);
    }
    cx.restore();
}

function farNest() {
    var pts = BRN[17], e = pts[pts.length - 1];
    return { fx: e[0] - .09, ya: e[1] + 40 / (WH || 500), kind: 'termites', hostile: 1 };
}

// tiny side-on insect for the neighbour colony: termite (pale, long) or aphid (green, pear shaped)
function critter(x, y, ang, s, aph) {
    cx.save();
    cx.translate(x, y);
    cx.rotate(ang);
    cx.strokeStyle = aph ? '#4e6a26' : '#8a6a40';
    cx.lineWidth = .5;
    cx.beginPath();
    for (var k = -1; k <= 1; k++) {
        cx.moveTo(s * .2 + k * s * .5, 0);
        cx.lineTo(s * .2 + k * s * .7, -s * 1.1);
        cx.moveTo(s * .2 + k * s * .5, 0);
        cx.lineTo(s * .2 + k * s * .7, s * 1.1);
    }
    cx.stroke();
    if (aph) {
        cx.fillStyle = '#9ccf5e';
        cx.beginPath();
        cx.ellipse(-s * .4, 0, s * 1.5, s * 1.05, 0, 0, 7);
        cx.fill();
        cx.fillStyle = '#b9e27d';
        cx.beginPath();
        cx.ellipse(-s * .6, -s * .35, s * .7, s * .3, 0, 0, 7);
        cx.fill();
        cx.fillStyle = '#6f9a3c';
        cx.beginPath();
        cx.ellipse(s * 1.2, 0, s * .6, s * .5, 0, 0, 7);
        cx.fill();
        cx.fillRect(-s * 1.6, -s * .9, s * .5, s * .3);
        cx.fillRect(-s * 1.6, s * .6, s * .5, s * .3);
    }
    else {
        cx.fillStyle = '#efe3c4';
        cx.beginPath();
        cx.ellipse(-s * 1.1, 0, s * 1.3, s * .85, 0, 0, 7);
        cx.fill();
        cx.beginPath();
        cx.ellipse(s * .3, 0, s * .75, s * .6, 0, 0, 7);
        cx.fill();
        cx.fillStyle = 'rgba(150,115,60,.35)';
        cx.fillRect(-s * 1.7, -s * .1, s * 1.3, s * .2);
        cx.fillStyle = '#c99a5a';
        cx.beginPath();
        cx.ellipse(s * 1.2, 0, s * .6, s * .55, 0, 0, 7);
        cx.fill();
    }
    cx.restore();
}

function drawNeighbour(nb, now, br, bdug) {
    var nx = nb.fx * W, ny = nb.ya != null ? nb.ya * WH : wy(nb.fy), term = nb.kind === 'termites', t = now * .001, i, g, sc = .7 / (K * uz);
    function blob(rx, ry) { caveP(nx, ny, rx, ry, Math.round(nb.fx * 997) + 5, .34); }
    cx.lineCap = 'round';
    var bp = null, bd = 1e9, pp, q0, dd, lim = Math.max(.02, S.dug);
    for (pp = br ? 0 : 1 - lim; pp <= (br ? bdug : 1) + .0001; pp += .02) {
        q0 = at(Math.min(1, pp), br);
        dd = Math.hypot(q0.x - nx, q0.y - ny);
        if (dd < bd) {
            bd = dd;
            bp = q0;
        }
    }
    if (bp && bd > 12) {
        var mxp = (bp.x + nx) / 2 + (ny - bp.y) * .12, myp = (bp.y + ny) / 2 + (bp.x - nx) * .12, tw0 = Math.max(5, tunW() * .8);
        cx.beginPath();
        cx.moveTo(bp.x, bp.y);
        cx.quadraticCurveTo(mxp, myp, nx, ny);
        cx.strokeStyle = '#150c07';
        cx.lineWidth = tw0 + 4;
        cx.stroke();
        cx.strokeStyle = '#5a3d26';
        cx.lineWidth = tw0 + 2;
        cx.stroke();
        cx.strokeStyle = '#8a6340';
        cx.lineWidth = tw0;
        cx.stroke();
        cx.strokeStyle = '#a67c50';
        cx.lineWidth = tw0 * .5;
        cx.stroke();
    }
    cx.fillStyle = '#150c07';
    blob(37, 22);
    cx.fill();
    cx.fillStyle = '#5a3d26';
    blob(35.2, 20.2);
    cx.fill();
    g = cx.createRadialGradient(nx, ny - 5, 3, nx, ny, 36);
    g.addColorStop(0, term ? '#b99a70' : '#8f8c52');
    g.addColorStop(1, term ? '#76593b' : '#4f5a2f');
    cx.fillStyle = g;
    blob(33.6, 18.6);
    cx.fill();
    cx.fillStyle = 'rgba(255,230,190,.14)';
    for (i = 0; i < 6; i++) {
        cx.beginPath();
        cx.arc(nx + Math.sin(i * 5.1 + nx) * 24, ny + Math.cos(i * 3.7 + ny) * 11, .9 + (i % 3) * .4, 0, 7);
        cx.fill();
    }
    if (term) {
        cx.fillStyle = '#d8c9a4';
        for (i = 0; i < 5; i++) {
            cx.beginPath();
            cx.ellipse(nx - 12 + i * 6, ny + 9 - Math.abs(i - 2) * 1.2, 2.4, 1.7, 0, 0, 7);
            cx.fill();
        }
        cx.fillStyle = 'rgba(80,55,30,.35)';
        cx.fillRect(nx - 7, ny - 4, 14, 1.2);
    }
    else {
        cx.strokeStyle = '#d8c79a';
        cx.lineWidth = 1.6;
        cx.beginPath();
        cx.moveTo(nx - 31, ny - 6);
        cx.quadraticCurveTo(nx, ny + 2, nx + 31, ny - 7);
        cx.stroke();
        cx.lineWidth = .6;
        for (i = 0; i < 7; i++) {
            cx.beginPath();
            cx.moveTo(nx - 24 + i * 8, ny - 3 + Math.sin(i) * 1.5);
            cx.lineTo(nx - 26 + i * 8, ny + 3);
            cx.stroke();
        }
    }
    for (i = 0; i < 5; i++) {
        var w = t * .45 * (1 + i * .15) + i * 1.3, px = nx + Math.cos(w) * 19, py = ny + 2 + Math.sin(w * 1.3) * 8;
        if (term)
            critter(px, py, Math.atan2(Math.cos(w * 1.3) * 10.4, -Math.sin(w) * 19), 2.1, 0);
        else
            critter(nx - 22 + i * 11, ny - 4 + (i % 2) * 7, Math.PI * (i % 2 ? .1 : -.1) + Math.sin(t * .8 + i) * .12, 1.9, 1);
    }
    if (!term) {
        for (i = 0; i < 3; i++) {
            var hp = (t * .25 + i * .33) % 1;
            cx.fillStyle = 'rgba(255,214,110,' + (.8 * (1 - hp)) + ')';
            cx.beginPath();
            cx.arc(nx - 14 + i * 14, ny + 2 + hp * 9, 1.1, 0, 7);
            cx.fill();
        }
    }
    cx.font = '700 ' + (8 * sc) + 'px system-ui';
    cx.textAlign = 'center';
    cx.fillStyle = 'rgba(255,245,220,.92)';
    cx.strokeStyle = 'rgba(0,0,0,.65)';
    cx.lineWidth = 2 * sc;
    cx.strokeText(term ? 'Termite colony' : 'Aphid farm', nx, ny - 26 * sc);
    cx.fillText(term ? 'Termite colony' : 'Aphid farm', nx, ny - 26 * sc);
}
