/* render/nest.js
   The queen's cavern: walls, floor, beds, cushion, food piles, lanterns and statues.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

function cavernRim() {
    cx.fillStyle = 'rgba(8,3,1,.5)';
    cavPath(8);
    cx.fill();
    cx.fillStyle = '#0c0503';
    cavPath(4);
    cx.fill();
    cx.fillStyle = '#4a2414';
    cavPath(1.5);
    cx.fill();
}

function cavernIn() {
    var c = cav(), i, g;
    if (c.x + c.rx < VR.x0 || c.x - c.rx > VR.x1 || c.y + c.ry < VR.y0 || c.y - c.ry > VR.y1)
        return;
    // the same dark, glowing cavern as the Nest tab: warm red-brown round the queen, near-black at the walls
    g = cx.createRadialGradient(QX, QY, 6, QX, QY + 10, c.rx * 1.05);
    g.addColorStop(0, '#8a4020');
    g.addColorStop(.3, '#64301a');
    g.addColorStop(.65, '#38190c');
    g.addColorStop(1, '#170905');
    cx.fillStyle = g;
    cavPath(0);
    cx.fill();
    cx.save();
    cx.globalCompositeOperation = 'lighter';
    glow(QX, QY - 4, c.rx * .8, '255,120,60', .16);
    cx.restore();
    // shadow along the ceiling and walls so the room has depth
    cx.save();
    cavPath(0);
    cx.clip();
    cx.strokeStyle = 'rgba(20,10,4,.38)';
    cx.lineWidth = 9;
    cavPath(2);
    cx.stroke();
    cx.strokeStyle = 'rgba(20,10,4,.3)';
    cx.lineWidth = 4;
    cavPath(-3);
    cx.stroke();
    var r = rng(S.seed + 77), cl = rng(S.seed + 5150);
    var nbot = c.y + c.ry - QY - 40, npb = Math.round(26 * Math.max(1, nbot / Math.max(60, WH - QY - 36)) * 1.6);
    for (i = 0; i < npb; i++) {
        var px = c.x + (r() * 1.8 - .9) * c.rx, py = QY + 30 + r() * nbot, pr = 1 + r() * 2.2;
        cx.fillStyle = 'rgba(60,36,20,.45)';
        cx.beginPath();
        cx.ellipse(px, py, pr * 1.6, pr, 0, 0, 7);
        cx.fill();
        cx.fillStyle = 'rgba(255,230,190,.12)';
        cx.beginPath();
        cx.ellipse(px - .5, py - .5, pr, pr * .5, 0, 0, 7);
        cx.fill();
    }
    // pebbles and rocks set into the walls near the ceiling
    for (i = 0; i < 22; i++) {
        var ux = (cl() * 1.8 - .9) * c.rx, tx = c.x + ux, ty = cavTop(tx) + 3 + cl() * 22, rr = 1.6 + cl() * 3.2;
        cx.fillStyle = 'rgba(40,26,16,.7)';
        cx.beginPath();
        cx.ellipse(tx, ty + .8, rr * 1.3, rr, 0, 0, 7);
        cx.fill();
        cx.fillStyle = ['#8a7a68', '#7a6a58', '#9a8a74'][i % 3];
        cx.beginPath();
        cx.ellipse(tx, ty, rr * 1.2, rr * .85, 0, 0, 7);
        cx.fill();
        cx.fillStyle = 'rgba(255,245,225,.28)';
        cx.beginPath();
        cx.ellipse(tx - rr * .3, ty - rr * .3, rr * .55, rr * .3, 0, 0, 7);
        cx.fill();
    }
    // hanging roots from the ceiling
    for (i = 0; i < 12; i++) {
        var rx0 = c.x + (cl() * 1.7 - .85) * c.rx, ry0 = cavTop(rx0) + 1, ln = 10 + cl() * 28, sw = (cl() - .5) * 14;
        cx.strokeStyle = i % 3 ? 'rgba(92,62,34,.9)' : 'rgba(130,98,60,.85)';
        cx.lineWidth = .8 + cl() * 1.1;
        cx.beginPath();
        cx.moveTo(rx0, ry0);
        cx.quadraticCurveTo(rx0 + sw * .3, ry0 + ln * .5, rx0 + sw, ry0 + ln);
        cx.stroke();
        cx.beginPath();
        cx.moveTo(rx0 + sw * .55, ry0 + ln * .6);
        cx.quadraticCurveTo(rx0 + sw * .9, ry0 + ln * .7, rx0 + sw * 1.4, ry0 + ln * .85);
        cx.lineWidth = .6;
        cx.stroke();
    }
    // dripping stalactites
    for (i = 0; i < 9; i++) {
        var sx = c.x + (cl() * 1.7 - .85) * c.rx, sy = cavTop(sx), sl = 4 + cl() * 8;
        cx.fillStyle = 'rgba(70,46,28,.95)';
        cx.beginPath();
        cx.moveTo(sx - 2.2, sy - 1);
        cx.lineTo(sx + 2.2, sy - 1);
        cx.lineTo(sx + .3, sy + sl);
        cx.closePath();
        cx.fill();
    }
    // the floor: soil layers, rubble, stalagmites, a puddle and mushrooms so the bottom has as much life as the top
    var fl = rng(S.seed + 6161), fbx, fby, fh, fr, fg = cx.createLinearGradient(0, c.y + c.ry * .3, 0, c.y + c.ry);
    fg.addColorStop(0, 'rgba(24,12,6,0)');
    fg.addColorStop(1, 'rgba(24,12,6,.34)');
    cx.fillStyle = fg;
    cavPath(0);
    cx.fill();
    cx.strokeStyle = 'rgba(40,24,12,.22)';
    cx.lineWidth = 1.3;
    for (i = 0; i < 9; i++) {
        fbx = c.x + (fl() * 1.5 - .75) * c.rx;
        fby = c.y - c.ry * .15 + fl() * c.ry * 1.05;
        fh = 26 + fl() * 50;
        cx.beginPath();
        cx.moveTo(fbx - fh, fby + 2);
        cx.quadraticCurveTo(fbx, fby - 5 - fl() * 4, fbx + fh, fby + 1);
        cx.stroke();
    }
    // shallow puddle
    fbx = c.x + (fl() * .9 - .45) * c.rx;
    fby = cavBot(fbx) - 12 - c.ry * .05;
    cx.fillStyle = 'rgba(30,22,16,.5)';
    cx.beginPath();
    cx.ellipse(fbx, fby, 17 + fl() * 9, 4.2, 0, 0, 7);
    cx.fill();
    cx.fillStyle = 'rgba(150,185,215,.22)';
    cx.beginPath();
    cx.ellipse(fbx - 2, fby - .6, 12, 2.4, 0, 0, 7);
    cx.fill();
    // rubble piles and pebbles resting on the floor
    for (i = 0; i < 26; i++) {
        fbx = c.x + (fl() * 1.76 - .88) * c.rx;
        fby = cavBot(fbx) - 1.5 - fl() * 16;
        fr = 1.3 + fl() * 3.6;
        cx.fillStyle = 'rgba(30,18,10,.55)';
        cx.beginPath();
        cx.ellipse(fbx, fby + 1, fr * 1.5, fr * .8, 0, 0, 7);
        cx.fill();
        cx.fillStyle = ['#8a7a68', '#6f6050', '#9a8a74', '#7a5f44'][i & 3];
        cx.beginPath();
        cx.ellipse(fbx, fby, fr * 1.2, fr * .8, 0, 0, 7);
        cx.fill();
        cx.fillStyle = 'rgba(255,245,225,.25)';
        cx.beginPath();
        cx.ellipse(fbx - fr * .3, fby - fr * .3, fr * .5, fr * .26, 0, 0, 7);
        cx.fill();
    }
    // stalagmites rising from the floor
    for (i = 0; i < 9; i++) {
        fbx = c.x + (fl() * 1.7 - .85) * c.rx;
        fby = cavBot(fbx);
        fh = 6 + fl() * 14;
        cx.fillStyle = 'rgba(78,52,32,.96)';
        cx.beginPath();
        cx.moveTo(fbx - 3.4, fby + 1);
        cx.lineTo(fbx + 3.4, fby + 1);
        cx.lineTo(fbx + .4, fby - fh);
        cx.closePath();
        cx.fill();
        cx.fillStyle = 'rgba(255,230,190,.14)';
        cx.beginPath();
        cx.moveTo(fbx - 1.2, fby);
        cx.lineTo(fbx + .3, fby - fh * .85);
        cx.lineTo(fbx - 2.8, fby);
        cx.closePath();
        cx.fill();
    }
    // pale mushrooms in little clusters
    for (i = 0; i < 6; i++) {
        fbx = c.x + (fl() * 1.6 - .8) * c.rx;
        fby = cavBot(fbx) - 3 - fl() * 6;
        for (var mi = 0; mi < 3; mi++) {
            var mx = fbx + mi * 4.2 - 4, mh = 3 + fl() * 4, my = fby + (mi & 1);
            cx.fillStyle = 'rgba(214,196,160,.9)';
            cx.fillRect(mx - .6, my - mh, 1.2, mh);
            cx.fillStyle = i % 2 ? '#d9b6a0' : '#c9c0d8';
            cx.beginPath();
            cx.ellipse(mx, my - mh, 2.4 + mi * .3, 1.5, 0, Math.PI, 0);
            cx.fill();
        }
    }
    cx.restore();
    // soft glow from fungus on the floor
    cx.save();
    cx.globalCompositeOperation = 'lighter';
    for (i = 0; i < 4; i++) {
        fbx = c.x + (fl() * 1.6 - .8) * c.rx;
        glow(fbx, cavBot(fbx) - 8, 12, i % 2 ? '120,230,170' : '170,200,255', .12 + .04 * Math.sin(performance.now() * .002 + i * 2.1));
    }
    cx.restore();
    // glowing fungus clumps on the wall
    var tn = performance.now();
    cx.save();
    cx.globalCompositeOperation = 'lighter';
    for (i = 0; i < 7; i++) {
        var fx0 = c.x + (cl() * 1.7 - .85) * c.rx, fy0 = cavTop(fx0) + 10 + cl() * 26;
        glow(fx0, fy0, 11, i % 2 ? '120,230,170' : '170,200,255', .16 + .05 * Math.sin(tn * .002 + i * 1.7));
    }
    cx.restore();
    for (i = 0; i < 7; i++) {
        var gx0 = c.x + (cl() * 1.7 - .85) * c.rx, gy0 = cavTop(gx0) + 12 + cl() * 24;
        cx.fillStyle = i % 2 ? '#7fe3b0' : '#a9c8ff';
        cx.beginPath();
        cx.arc(gx0, gy0, 1.3, 0, 7);
        cx.arc(gx0 + 2.6, gy0 + 1.1, 1, 0, 7);
        cx.arc(gx0 - 2.2, gy0 + .8, .9, 0, 7);
        cx.fill();
    }
}

var BEDS = { k: '', a: [] }, STRAW = ['#d6bb78', '#c2a05a', '#a98440', '#7d6030', '#6a5028', '#8a6c38'];
function bedStraw(ex, ey) {
    var k = ex + ',' + ey, sd = 7, i, inner;
    if (BEDS.k === k)
        return BEDS.a;
    var r = function () { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
    BEDS.a = [];
    for (i = 0; i < 130; i++) {
        inner = i >= 70;
        BEDS.a.push({ a: r() * 6.283, r: inner ? .1 + r() * .65 : .78 + r() * .3, l: inner ? 5 + r() * 7 : 7 + r() * 10, j: (r() - .5) * 1.2, c: Math.floor(r() * 3) + (inner ? 3 : 0) });
    }
    BEDS.k = k;
    return BEDS.a;
}

function drawCushion(now) {
    var c = cav(), rx = 62 + S.tier * 5, ry = 36 + S.tier * 2, i, g, cxc = QX - 4, cyc = QY + 7, ex = rx * .86, ey = ry * .68, u, x, yt, st = bedStraw(Math.round(ex), Math.round(ey));
    cx.strokeStyle = 'rgba(90,60,36,.85)';
    cx.lineWidth = 1.1;
    for (i = 0; i < 9; i++) {
        u = -.82 + i * .205;
        x = c.x + u * c.rx;
        yt = cavTop(x) + 3;
        cx.beginPath();
        cx.moveTo(x, yt);
        cx.quadraticCurveTo(x + 3, yt + 9, x - 1, yt + 13 + (i % 3) * 5);
        cx.stroke();
    }
    // clay lamps at the edges of the cavern
    [[-.84, 0], [.84, 1]].forEach(function (q) {
        var x0 = c.x + q[0] * c.rx, y0 = WH - 16, k = q[1], fl = .8 + .2 * Math.sin(now * .011 + k * 2.4) + .08 * Math.sin(now * .027 + k);
        cx.save();
        cx.globalCompositeOperation = 'lighter';
        var dl = dayState().night;
        glow(x0, y0 - 6, 22 + 16 * dl, '255,160,70', .3 * fl * (1 + 1.3 * dl));
        cx.restore();
        cx.fillStyle = '#6e4a2a';
        cx.strokeStyle = '#2e1c0e';
        cx.lineWidth = .9;
        cx.beginPath();
        cx.moveTo(x0 - 7, y0 - 2);
        cx.quadraticCurveTo(x0 - 8, y0 + 5, x0, y0 + 6);
        cx.quadraticCurveTo(x0 + 8, y0 + 5, x0 + 7, y0 - 2);
        cx.closePath();
        cx.fill();
        cx.stroke();
        cx.fillStyle = '#8a6038';
        cx.beginPath();
        cx.ellipse(x0, y0 - 2, 7, 2.2, 0, 0, 7);
        cx.fill();
        cx.stroke();
        cx.fillStyle = '#ffcf6a';
        cx.beginPath();
        cx.moveTo(x0 - 2.2, y0 - 2.5);
        cx.quadraticCurveTo(x0 - 2.6, y0 - 7 * fl, x0, y0 - 10 * fl);
        cx.quadraticCurveTo(x0 + 2.6, y0 - 7 * fl, x0 + 2.2, y0 - 2.5);
        cx.fill();
        cx.fillStyle = '#fff0b0';
        cx.beginPath();
        cx.ellipse(x0, y0 - 4.5, 1, 2.2 * fl, 0, 0, 7);
        cx.fill();
    });
    // the nest bed: a woven ring of straw and twigs, lined with moss
    cx.fillStyle = 'rgba(0,0,0,.28)';
    cx.beginPath();
    cx.ellipse(cxc + 2, cyc + 5, ex * 1.04, ey * 1.06, 0, 0, 7);
    cx.fill();
    g = cx.createRadialGradient(cxc - 6, cyc - 4, 3, cxc, cyc, ex);
    g.addColorStop(0, '#7b6234');
    g.addColorStop(.7, '#4e3b1e');
    g.addColorStop(1, '#33260f');
    cx.fillStyle = g;
    cx.beginPath();
    cx.ellipse(cxc, cyc, ex, ey, 0, 0, 7);
    cx.fill();
    cx.lineCap = 'round';
    cx.lineWidth = 1.4;
    for (var ci = 3; ci < 6; ci++) {
        cx.strokeStyle = STRAW[ci];
        cx.beginPath();
        st.forEach(function (p) { if (p.c !== ci) return; var px = cxc + Math.cos(p.a) * ex * p.r, py = cyc + Math.sin(p.a) * ey * p.r, t = p.a + 1.571 + p.j; cx.moveTo(px, py); cx.lineTo(px + Math.cos(t) * p.l, py + Math.sin(t) * p.l * .5); });
        cx.stroke();
    }
    for (ci = 0; ci < 3; ci++) {
        cx.strokeStyle = STRAW[ci];
        cx.lineWidth = 1.7;
        cx.beginPath();
        st.forEach(function (p) { if (p.c !== ci) return; var px = cxc + Math.cos(p.a) * ex * p.r, py = cyc + Math.sin(p.a) * ey * p.r, t = p.a + 1.571 + p.j; cx.moveTo(px, py); cx.lineTo(px + Math.cos(t) * p.l, py + Math.sin(t) * p.l * .5); });
        cx.stroke();
    }
    for (i = 0; i < 11; i++) {
        var a0 = i * .57 + .2, kk = 1 + (i % 3) * .03;
        cx.strokeStyle = '#3f2a18';
        cx.lineWidth = 2.8;
        cx.beginPath();
        cx.ellipse(cxc, cyc, ex * kk, ey * kk, 0, a0, a0 + .62);
        cx.stroke();
        cx.strokeStyle = 'rgba(190,150,95,.55)';
        cx.lineWidth = .9;
        cx.beginPath();
        cx.ellipse(cxc, cyc, ex * kk, ey * kk, 0, a0 + .05, a0 + .55);
        cx.stroke();
    }
    [.4, 1.7, 2.9, 4.1, 5.3].forEach(function (a, n) {
        var mx = cxc + Math.cos(a) * ex * .96, my = cyc + Math.sin(a) * ey * .96;
        cx.fillStyle = '#566f2e';
        cx.beginPath();
        cx.ellipse(mx, my, 6, 2.6, a, 0, 7);
        cx.fill();
        cx.fillStyle = '#86a346';
        cx.beginPath();
        cx.arc(mx - 1.5, my - .6, 1, 0, 7);
        cx.arc(mx + 2, my + .4, .8, 0, 7);
        cx.fill();
    });
    cx.fillStyle = '#6b5a45';
    [[.9, .55], [-1.05, .35], [.15, .92]].forEach(function (p) { cx.beginPath(); cx.ellipse(cxc + p[0] * ex, cyc + p[1] * ey, 2.4, 1.6, 0, 0, 7); cx.fill(); });
    cx.save();
    cx.globalCompositeOperation = 'lighter';
    glow(QX, QY, rx * 1.1, '255,185,100', .09 + .035 * Math.sin(now * .003));
    cx.restore();
}

function drawFood(now) {
    var t = now * .001, i;
    cx.save();
    cx.translate(0, -cam);
    if (worm) {
        for (var j = 15; j >= 0; j--) {
            var wx = worm.x - worm.d * j * 5.2, wy = worm.y + Math.sin(worm.t * 3 - j * .55) * 5, wr = j === 0 ? 4 : 3.6 - Math.min(j, 15) * .03;
            cx.fillStyle = 'rgba(0,0,0,.25)';
            cx.beginPath();
            cx.arc(wx + .5, wy + 1.6, wr, 0, 7);
            cx.fill();
            cx.fillStyle = j === 0 ? '#e9a6a2' : (j >= 4 && j <= 6) ? '#e8b3a8' : j % 2 ? '#d98782' : '#cd7a76';
            cx.beginPath();
            cx.arc(wx, wy, wr, 0, 7);
            cx.fill();
            cx.fillStyle = 'rgba(255,225,215,.35)';
            cx.beginPath();
            cx.arc(wx - .6, wy - 1.1, wr * .45, 0, 7);
            cx.fill();
        }
    }
    S.foodSpots.forEach(function (sp, n) {
        var q = at(sp.p), off = tunW() / 2 + 5, px = q.x + q.nx * sp.side * off, py = q.y + q.ny * sp.side * off, f = sp.stock / sp.cap, pu = .5 + .5 * Math.sin(t * 2 + n), cnt = 1 + Math.round(f * 4);
        cx.save();
        cx.globalCompositeOperation = 'lighter';
        glow(px, py - 3, 10 + 8 * f, sp.ty === 1 ? '255,220,140' : sp.ty === 2 ? '255,190,90' : '140,255,170', .08 + .2 * f * (.7 + .3 * pu));
        cx.restore();
        for (var m = 0; m < cnt; m++) {
            var ox = px + (m - (cnt - 1) / 2) * 3.2, hh = 2 + (m % 3) * 1.3 + f * 1.5;
            if (sp.ty === 0) {
                cx.strokeStyle = '#cfe8c0';
                cx.lineWidth = .8;
                cx.beginPath();
                cx.moveTo(ox, py + 2);
                cx.lineTo(ox, py + 2 - hh);
                cx.stroke();
                cx.fillStyle = 'rgba(150,255,190,' + (.5 + .4 * pu) + ')';
                cx.beginPath();
                cx.arc(ox, py + 2 - hh, 1.5, 0, 7);
                cx.fill();
            }
            else if (sp.ty === 1) {
                cx.fillStyle = m % 2 ? '#d9b974' : '#c9a45a';
                cx.beginPath();
                cx.ellipse(ox, py + 1 - (m % 2), 1.8, 1.1, m, 0, 7);
                cx.fill();
            }
            else {
                cx.fillStyle = 'rgba(255,190,80,' + (.6 + .3 * pu) + ')';
                cx.beginPath();
                cx.moveTo(ox, py + 2 - hh);
                cx.lineTo(ox - 1.2, py + 2 - hh + 2.6);
                cx.lineTo(ox + 1.2, py + 2 - hh + 2.6);
                cx.fill();
            }
        }
    });
    if (S.dug >= 1) {
        for (var lj = 0; lj < 8; lj++) {
            var lx = surfaceSpot(lj), lsd = lj % 2 ? 1 : -1;
            cx.fillStyle = lj % 2 ? '#5aa845' : '#78c25a';
            cx.beginPath();
            cx.ellipse(lx, 21.5, 4.2, 2.1, .5 * lsd, 0, 7);
            cx.fill();
            cx.strokeStyle = 'rgba(40,80,30,.7)';
            cx.lineWidth = .6;
            cx.beginPath();
            cx.moveTo(lx - 3, 22.5);
            cx.lineTo(lx + 3, 20.5);
            cx.stroke();
        }
    }
    for (var bf = 0; bf < 2; bf++) {
        var bx = (now * .016 * (1 + bf * .35) + bf * 210) % (W + 80) - 40, by = 4 - bf * 16 + Math.sin(now * .0021 + bf * 2) * 9, fl2 = Math.abs(Math.sin(now * .018 + bf * 3));
        cx.fillStyle = bf ? '#f2a6d8' : '#f6c945';
        cx.beginPath();
        cx.ellipse(bx - 2.2, by, 2.6, 2.6 * fl2 + .3, -.4, 0, 7);
        cx.ellipse(bx + 2.2, by, 2.6, 2.6 * fl2 + .3, .4, 0, 7);
        cx.fill();
        cx.fillStyle = '#2a1a10';
        cx.fillRect(bx - .4, by - 2, .8, 4);
    }
    var lbx = (now * .004) % (W + 40) - 20;
    cx.fillStyle = '#c8261e';
    cx.beginPath();
    cx.arc(lbx, 21.2, 2, 0, 7);
    cx.fill();
    cx.fillStyle = '#111';
    cx.beginPath();
    cx.arc(lbx + 1.9, 21.2, .9, 0, 7);
    cx.arc(lbx - .5, 20.6, .45, 0, 7);
    cx.arc(lbx - .6, 21.9, .45, 0, 7);
    cx.fill();
    carc.forEach(function (c) { var al = Math.min(1, c.t / 2); cx.globalAlpha = al; cx.fillStyle = c.tp === 3 ? '#7a828e' : c.tp === 1 ? '#4a2a5a' : c.tp === 2 ? '#c9a02a' : '#3a3a3a'; cx.beginPath(); cx.ellipse(c.x, c.y, 5, 3, .3, 0, 7); cx.fill(); cx.strokeStyle = 'rgba(0,0,0,.6)'; cx.lineWidth = .8; cx.beginPath(); for (i = -1; i <= 1; i++) {
        cx.moveTo(c.x + i * 2.2, c.y - 2);
        cx.lineTo(c.x + i * 3.2, c.y - 5);
        cx.moveTo(c.x + i * 2.2, c.y + 2);
        cx.lineTo(c.x + i * 3.2, c.y + 5);
    } cx.stroke(); cx.globalAlpha = 1; });
    cx.restore();
}

var BFN, BDET, BSHORT = ['Store', 'Nursery', 'Farm', 'Barracks', 'Archive', 'Hatchery', 'Tower'], dustT = 0;

// lanterns that hang from the ceiling of the main cavern, one more for each cavern level
function statue(x, y, k, latest, now) {
    cx.fillStyle = 'rgba(0,0,0,.3)';
    cx.beginPath();
    cx.ellipse(x, y + 1, 6.5, 2, 0, 0, 7);
    cx.fill();
    cx.fillStyle = '#6f6a60';
    cx.fillRect(x - 5, y - 4, 10, 5);
    cx.fillStyle = '#8c867a';
    cx.fillRect(x - 5, y - 4, 10, 1.4);
    cx.fillStyle = '#9b9588';
    cx.beginPath();
    cx.moveTo(x - 3.4, y - 4);
    cx.quadraticCurveTo(x - 4.5, y - 11, x - 1.6, y - 14);
    cx.lineTo(x + 1.6, y - 14);
    cx.quadraticCurveTo(x + 4.5, y - 11, x + 3.4, y - 4);
    cx.fill();
    cx.beginPath();
    cx.arc(x, y - 16, 2.5, 0, 7);
    cx.fill();
    cx.fillStyle = latest ? '#ffd23f' : '#c9a24a';
    cx.beginPath();
    cx.moveTo(x - 2.6, y - 17.5);
    cx.lineTo(x - 2.8, y - 21);
    cx.lineTo(x - 1, y - 19);
    cx.lineTo(x, y - 22);
    cx.lineTo(x + 1, y - 19);
    cx.lineTo(x + 2.8, y - 21);
    cx.lineTo(x + 2.6, y - 17.5);
    cx.fill();
    cx.fillStyle = '#2f2b25';
    cx.font = '700 4.4px sans-serif';
    cx.textAlign = 'center';
    cx.fillText(genName(k + 1), x, y - .6);
    if (latest) {
        cx.save();
        cx.globalCompositeOperation = 'lighter';
        glow(x, y - 12, 16, '255,210,90', .22 + .06 * Math.sin(now * .003));
        cx.restore();
    }
}

function drawCavern(now) {
    var cl = S.cavLevel || 0, c, k;
    if (typeof cav !== 'function')
        return;
    c = cav();
    var ns = Math.min(P.gen || 0, 8);
    for (k = 0; k < ns; k++) {
        var ga = Math.PI * (1.08 + .84 * (k + .5) / ns), gx = c.x + Math.cos(ga) * (c.rx + 3), gyy = c.y + Math.sin(ga) * (c.ry + 3), en = PT[PT.length - 1][0];
        if (Math.abs(gx - QX) < 30 || Math.abs(gx - en) < 30) {
            ga += (gx < QX ? -1 : 1) * .12;
            gx = c.x + Math.cos(ga) * (c.rx + 3);
            gyy = c.y + Math.sin(ga) * (c.ry + 3);
        }
        cx.save();
        cx.translate(gx, gyy + 2);
        cx.scale(1.3, 1.3);
        statue(0, 0, k, k === ns - 1, now);
        cx.restore();
    }
    if (S.deep) {
        var nj = S.deep * 5, fillF = Math.min(1, S.food / Math.max(1, foodCap()));
        for (k = 0; k < nj; k++) {
            var ja = Math.PI * (.14 + .72 * (k + .5) / nj), jx = c.x + Math.cos(ja) * c.rx * .8, jy = c.y + Math.sin(ja) * c.ry * .74 - 8 + (k % 2) * 6;
            cx.fillStyle = 'rgba(0,0,0,.25)';
            cx.beginPath();
            cx.ellipse(jx, jy + 9, 7, 2.4, 0, 0, 7);
            cx.fill();
            cx.fillStyle = '#4a3320';
            cx.fillRect(jx - 5, jy - 8, 10, 17);
            cx.fillStyle = '#e8b04a';
            cx.fillRect(jx - 4, jy + 8 - 15 * (.25 + .75 * fillF), 8, 15 * (.25 + .75 * fillF));
            cx.fillStyle = '#7a5530';
            cx.fillRect(jx - 6, jy - 10, 12, 3);
        }
    }
    if (!cl)
        return;
    for (k = 0; k < cl; k++) {
        var a = Math.PI * (1.12 + .76 * (k + .5) / Math.max(5, cl)), x = c.x + Math.cos(a) * c.rx * .94, y = c.y + Math.sin(a) * c.ry * .94 + 3, len = 10 + (k % 2) * 6;
        cx.strokeStyle = '#4a3320';
        cx.lineWidth = 1;
        cx.beginPath();
        cx.moveTo(x, y);
        cx.lineTo(x, y + len);
        cx.stroke();
        cx.fillStyle = '#e8b04a';
        cx.fillRect(x - 2.6, y + len, 5.2, 6);
        cx.fillStyle = '#7a5530';
        cx.fillRect(x - 3.2, y + len - 1.2, 6.4, 1.6);
        cx.save();
        cx.globalCompositeOperation = 'lighter';
        glow(x, y + len + 3, 22, '255,190,90', .26 + .06 * Math.sin(now * .004 + k * 2));
        cx.restore();
    }
}
