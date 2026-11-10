/* render/chambers.js
   Side rooms and caves: outlines, interiors, crystals, mushrooms and the little symbols.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

function chamber(x, y, rx, ry, ic) {
    chamberRim(x, y, rx, ry);
    chamberIn(x, y, rx, ry, ic);
}

// an irregular cave outline instead of a neat oval. The same k always gives the same shape
function caveP(x, y, rx, ry, k, amp) {
    var n = 11, pts = [], i, a, h, r, p0, p1;
    amp = amp || .2;
    for (i = 0; i < n; i++) {
        a = i / n * 6.2832 + k * .37;
        h = Math.sin(k * 12.9898 + i * 78.233) * 43758.5453;
        r = 1 - amp * .5 + amp * (h - Math.floor(h));
        pts.push([x + Math.cos(a) * rx * r, y + Math.sin(a) * ry * r]);
    }
    cx.beginPath();
    cx.moveTo((pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2);
    for (i = 0; i < n; i++) {
        p0 = pts[i];
        p1 = pts[(i + 1) % n];
        cx.quadraticCurveTo(p0[0], p0[1], (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2);
    }
    cx.closePath();
}

function caveK(x, y) { return Math.round(x * .37 + y * .61) % 997; }

function chamberRim(x, y, rx, ry) {
    var k = caveK(x, y);
    cx.fillStyle = 'rgba(8,3,1,.4)';
    caveP(x, y, rx + 6, ry + 6, k);
    cx.fill();
    cx.fillStyle = '#24140a';
    caveP(x, y, rx + 3, ry + 3, k);
    cx.fill();
    cx.fillStyle = 'rgba(255,170,90,.42)';
    caveP(x, y - 1, rx + 1.2, ry + 1.2, k);
    cx.fill();
}

// faceted crystal prism, pointing up. x is the centre, b the base, w half width, h height
var CRY = [['#9fe3ff', '#55abdc', '#e4f8ff'], ['#8ed6f7', '#4a9bd0', '#d4f1ff'], ['#b2ecff', '#62b6e4', '#f0fbff']];
function prism(x, b, w, h, k) {
    var c = CRY[k % 3], sh = h * .26;
    cx.fillStyle = c[0];
    cx.beginPath();
    cx.moveTo(x - w, b);
    cx.lineTo(x - w, b - h + sh);
    cx.lineTo(x, b - h);
    cx.lineTo(x, b);
    cx.closePath();
    cx.fill();
    cx.fillStyle = c[1];
    cx.beginPath();
    cx.moveTo(x, b);
    cx.lineTo(x, b - h);
    cx.lineTo(x + w, b - h + sh);
    cx.lineTo(x + w, b);
    cx.closePath();
    cx.fill();
    cx.fillStyle = c[2];
    cx.beginPath();
    cx.moveTo(x - w, b - h + sh);
    cx.lineTo(x, b - h);
    cx.lineTo(x + w, b - h + sh);
    cx.lineTo(x, b - h + sh * 2.1);
    cx.closePath();
    cx.fill();
    cx.strokeStyle = 'rgba(25,70,115,.55)';
    cx.lineWidth = .6;
    cx.beginPath();
    cx.moveTo(x - w, b);
    cx.lineTo(x - w, b - h + sh);
    cx.lineTo(x, b - h);
    cx.lineTo(x + w, b - h + sh);
    cx.lineTo(x + w, b);
    cx.moveTo(x, b - h + sh * 2.1);
    cx.lineTo(x, b);
    cx.stroke();
}

// small mushroom: stem, domed cap with a shaded underside and a couple of spots
var SHCAP = [['#d9a066', '#b97a45'], ['#e6c58c', '#c39a58'], ['#b9d3b6', '#84a88a']];
function shroom(x, y, h, w, k, sd) {
    var c = SHCAP[k % 3];
    cx.fillStyle = '#e8dcc2';
    cx.beginPath();
    cx.moveTo(x - w * .2, y);
    cx.quadraticCurveTo(x - w * .1, y - h * .5, x - w * .14, y - h);
    cx.lineTo(x + w * .14, y - h);
    cx.quadraticCurveTo(x + w * .1, y - h * .5, x + w * .2, y);
    cx.closePath();
    cx.fill();
    cx.fillStyle = 'rgba(110,80,40,.28)';
    cx.beginPath();
    cx.moveTo(x + w * .04, y);
    cx.lineTo(x + w * .04, y - h);
    cx.lineTo(x + w * .14, y - h);
    cx.quadraticCurveTo(x + w * .1, y - h * .5, x + w * .2, y);
    cx.closePath();
    cx.fill();
    cx.fillStyle = '#6e5035';
    cx.beginPath();
    cx.ellipse(x, y - h, w * .5, w * .13, 0, 0, Math.PI);
    cx.fill();
    cx.fillStyle = c[0];
    cx.beginPath();
    cx.ellipse(x, y - h, w * .5, w * .4, 0, Math.PI, 2 * Math.PI);
    cx.fill();
    cx.strokeStyle = c[1];
    cx.lineWidth = Math.max(.5, w * .08);
    cx.beginPath();
    cx.ellipse(x, y - h, w * .5, w * .4, 0, Math.PI * 1.55, Math.PI * 2.02);
    cx.stroke();
    cx.fillStyle = 'rgba(255,255,255,.34)';
    cx.beginPath();
    cx.ellipse(x - w * .17, y - h - w * .24, w * .16, w * .07, -.4, 0, 7);
    cx.fill();
    cx.fillStyle = 'rgba(250,240,215,.85)';
    cx.beginPath();
    cx.arc(x + w * .14, y - h - w * .2, w * .06, 0, 7);
    cx.arc(x - w * .06, y - h - w * .1, w * .045, 0, 7);
    cx.fill();
}

// small hand-drawn symbols (no emoji): egg, skull, leaf and the underground finds
function glyph(n, x, y, sz) {
    var u = sz / 16;
    cx.save();
    cx.translate(x, y);
    cx.scale(u, u);
    cx.lineJoin = 'round';
    cx.lineCap = 'round';
    if (n === '@egg') {
        cx.fillStyle = '#f2e6c8';
        cx.beginPath();
        cx.ellipse(0, 0, 4.6, 6, 0, 0, 7);
        cx.fill();
        cx.fillStyle = 'rgba(120,90,50,.25)';
        cx.beginPath();
        cx.ellipse(1.5, 1.5, 2.6, 3.8, 0, 0, 7);
        cx.fill();
    }
    else if (n === '@skull') {
        cx.fillStyle = '#e8e0cf';
        cx.beginPath();
        cx.arc(0, -1.5, 6, 0, 7);
        cx.fill();
        cx.fillRect(-3.4, 2, 6.8, 4.5);
        cx.fillStyle = '#1a100a';
        cx.beginPath();
        cx.arc(-2.4, -1.4, 1.7, 0, 7);
        cx.arc(2.4, -1.4, 1.7, 0, 7);
        cx.fill();
        cx.fillRect(-.6, 1.2, 1.2, 1.6);
    }
    else if (n === '@leaf') {
        cx.fillStyle = '#7fc46a';
        cx.beginPath();
        cx.moveTo(-6, 5);
        cx.quadraticCurveTo(-6, -6, 6, -6);
        cx.quadraticCurveTo(6, 6, -6, 5);
        cx.fill();
        cx.strokeStyle = '#3f7a35';
        cx.lineWidth = 1.2;
        cx.beginPath();
        cx.moveTo(-6, 5);
        cx.lineTo(3, -3);
        cx.stroke();
    }
    else if (n === '@seed') {
        cx.fillStyle = '#b07a3c';
        cx.beginPath();
        cx.ellipse(0, 1.5, 4.6, 5.2, 0, 0, 7);
        cx.fill();
        cx.fillStyle = '#6b4520';
        cx.beginPath();
        cx.ellipse(0, -3, 5.2, 2.6, 0, Math.PI, 0);
        cx.fill();
        cx.fillRect(-.7, -6.5, 1.4, 2.5);
    }
    else if (n === '@crystal') {
        cx.fillStyle = 'rgba(120,210,255,.18)';
        cx.beginPath();
        cx.arc(0, 1, 8.5, 0, 7);
        cx.fill();
        prism(-4.4, 7, 2.1, 8.5, 0);
        prism(4.5, 7.5, 2.3, 10, 1);
        prism(0, 8, 2.9, 14.5, 2);
    }
    else if (n === '@fungus') {
        shroom(-3.6, 7, 6.5, 7, 1, 0);
        shroom(4, 7.5, 8.5, 9, 0, 1);
        shroom(.2, 8, 5.5, 5.6, 2, 2);
    }
    else if (n === '@relic') {
        cx.fillStyle = '#9a8f7b';
        cx.beginPath();
        cx.moveTo(-7, -1);
        cx.quadraticCurveTo(-6, -6.5, 0, -6.5);
        cx.quadraticCurveTo(7, -6, 7, .5);
        cx.quadraticCurveTo(6.5, 6, -.5, 6.2);
        cx.quadraticCurveTo(-7, 5.5, -7, -1);
        cx.fill();
        cx.fillStyle = '#d3cab6';
        cx.beginPath();
        cx.arc(0, 0, 4.9, 0, 7);
        cx.fill();
        cx.strokeStyle = '#6a5f4d';
        cx.lineWidth = 1.1;
        cx.beginPath();
        for (var q = 0; q < 12.6; q += .3) {
            var rr = .4 + q * .36;
            cx.lineTo(Math.cos(q + 1) * rr, Math.sin(q + 1) * rr);
        }
        cx.stroke();
        cx.lineWidth = .6;
        cx.strokeStyle = 'rgba(106,95,77,.7)';
        cx.beginPath();
        for (var q2 = 0; q2 < 6.3; q2 += 1.05) {
            cx.moveTo(Math.cos(q2) * 2.2, Math.sin(q2) * 2.2);
            cx.lineTo(Math.cos(q2) * 4.8, Math.sin(q2) * 4.8);
        }
        cx.stroke();
    }
    cx.restore();
}

function chamberIn(x, y, rx, ry, ic) {
    var g = cx.createRadialGradient(x, y - ry * .3, 2, x, y, rx);
    g.addColorStop(0, '#86562e');
    g.addColorStop(.7, '#5a3820');
    g.addColorStop(1, '#2a160a');
    cx.fillStyle = g;
    caveP(x, y, rx, ry, caveK(x, y));
    cx.fill();
    cx.strokeStyle = 'rgba(20,10,4,.4)';
    cx.lineWidth = 2;
    caveP(x, y, rx - 1, ry - 1, caveK(x, y));
    cx.stroke();
    cx.fillStyle = 'rgba(255,230,190,.22)';
    for (var i = 0; i < 7; i++) {
        cx.beginPath();
        cx.arc(x + Math.sin(i * 5.1 + x) * rx * .7, y + Math.cos(i * 3.7 + y) * ry * .6, .8 + (i % 3) * .4, 0, 7);
        cx.fill();
    }
    if (ic) {
        glyph(ic, x, y + 1, 16);
    }
}

function drawRooms(now) {
    var t = now * .001, i, j;
    cx.save();
    cx.translate(0, -cam);
    for (i = 0; i < (TUNING.tunnelRooms ? S.tier : 0) && i < 4; i++) {
        if (exc && exc.i === i)
            continue;
        var q = PT[CI[i]], x = q[0] + (i % 2 ? -34 : 34), y = q[1];
        if (i === 0) {
            cx.fillStyle = 'rgba(38,22,10,.62)';
            cx.beginPath();
            cx.ellipse(x, y + 7, 23, 6.5, 0, 0, 7);
            cx.fill();
            for (j = 0; j < 9; j++) {
                cx.fillStyle = j % 3 ? '#5f8c3c' : '#7aa64a';
                cx.beginPath();
                cx.ellipse(x - 19 + j * 4.7, y + 7.5 + Math.sin(j * 2.3) * 2, 2.4, 1.2, j * .9, 0, 7);
                cx.fill();
            }
            var SH = [[-16, 2, 5, 6, 1], [-9, 5, 7.5, 8, 0], [-2, 3, 5.5, 6, 2], [5, 6, 9, 9.5, 0], [12, 3, 6, 6.5, 1], [17, 6, 4.5, 5, 2], [-13, 7, 4, 4.5, 0]];
            for (j = 0; j < SH.length; j++)
                shroom(x + SH[j][0], y + SH[j][1] + 4, SH[j][2], SH[j][3], SH[j][4], j);
            cx.save();
            cx.globalCompositeOperation = 'lighter';
            glow(x, y, 26, '150,230,170', .1 + .04 * Math.sin(t * 2));
            cx.restore();
        }
        else if (i === 1) {
            cx.strokeStyle = '#b8964a';
            cx.lineWidth = 1.2;
            for (j = 0; j < 3; j++) {
                var gx = x - 12 + j * 12;
                cx.beginPath();
                cx.ellipse(gx, y + 4, 5, 2.6, 0, 0, 7);
                cx.stroke();
                cx.fillStyle = '#f6f1e2';
                cx.beginPath();
                cx.ellipse(gx + Math.sin(t * 3 + j) * .8, y + 3.5, 2.3, 1.6, 0, 0, 7);
                cx.fill();
            }
        }
        else if (i === 2) {
            cx.fillStyle = '#8a6a40';
            cx.fillRect(x - 1, y - 12, 2, 16);
            cx.fillStyle = '#c0392b';
            cx.beginPath();
            cx.moveTo(x + 1, y - 12);
            cx.lineTo(x + 11 + Math.sin(t * 2) * 1.2, y - 9);
            cx.lineTo(x + 1, y - 5);
            cx.fill();
            cx.fillStyle = '#8a8a92';
            cx.beginPath();
            cx.arc(x - 12, y + 2, 4, 0, 7);
            cx.fill();
            cx.strokeStyle = '#cfcfd6';
            cx.lineWidth = .8;
            cx.stroke();
        }
        else {
            cx.fillStyle = '#d9a82e';
            cx.fillRect(x - 7, y - 4, 14, 9);
            cx.fillStyle = '#f4cf5a';
            cx.beginPath();
            cx.moveTo(x - 7, y - 4);
            cx.lineTo(x - 5, y - 12);
            cx.lineTo(x, y - 7);
            cx.lineTo(x + 5, y - 12);
            cx.lineTo(x + 7, y - 4);
            cx.fill();
            cx.save();
            cx.globalCompositeOperation = 'lighter';
            glow(x, y, 26, '255,210,90', .2);
            cx.restore();
        }
        var sc = .7 / (K * uz);
        cx.font = '700 ' + (8 * sc) + 'px system-ui';
        cx.textAlign = 'center';
        cx.fillStyle = 'rgba(255,245,220,.92)';
        cx.strokeStyle = 'rgba(0,0,0,.65)';
        cx.lineWidth = 2 * sc;
        var rlv = rl(i), rlab = ROOMS[i].n + (rlv ? '  Lv ' + (rlv + 1) : '');
        for (j = 0; j < rlv; j++) {
            var lx = x + (j % 2 ? 1 : -1) * (24 + Math.floor(j / 2) * 7) * (1 + .07 * rlv), ly = y - 6;
            cx.strokeStyle = '#4a3320';
            cx.lineWidth = 1;
            cx.beginPath();
            cx.moveTo(lx, ly - 7);
            cx.lineTo(lx, ly + 1);
            cx.stroke();
            cx.fillStyle = '#e8b04a';
            cx.fillRect(lx - 1.8, ly - 2, 3.6, 4);
            cx.save();
            cx.globalCompositeOperation = 'lighter';
            glow(lx, ly, 9, '255,190,90', .22 + .06 * Math.sin(t * 3 + j));
            cx.restore();
        }
        cx.strokeText(rlab, x, y - 15 * sc);
        cx.fillText(rlab, x, y - 15 * sc);
        if (roomCanUp(i)) {
            // a gold arrow by the name: this chamber can be upgraded now (tap it)
            var aw = cx.measureText(rlab).width / 2 + 7 * sc, ax = x + aw, ay = y - 18 * sc + Math.sin(t * 4) * 1.5 * sc;
            cx.fillStyle = '#ffd35a';
            cx.strokeStyle = 'rgba(0,0,0,.7)';
            cx.lineWidth = 1.5 * sc;
            cx.beginPath();
            cx.moveTo(ax, ay - 5 * sc);
            cx.lineTo(ax + 4.5 * sc, ay + 1 * sc);
            cx.lineTo(ax + 1.6 * sc, ay + 1 * sc);
            cx.lineTo(ax + 1.6 * sc, ay + 5 * sc);
            cx.lineTo(ax - 1.6 * sc, ay + 5 * sc);
            cx.lineTo(ax - 1.6 * sc, ay + 1 * sc);
            cx.lineTo(ax - 4.5 * sc, ay + 1 * sc);
            cx.closePath();
            cx.stroke();
            cx.fill();
        }
    }
    var fl = rng(S.seed + 11);
    for (i = 2; i < PT.length - 1; i += 2) {
        if (S.dug < 1)
            break;
        var sd = fl() < .5 ? -1 : 1, fx0 = PT[i][0] + sd * (10 + S.tier), fy0 = PT[i][1] + 4, gl = .5 + .5 * Math.sin(t * 2 + i);
        for (j = 0; j < 3; j++)
            shroom(fx0 + j * 3.6 * sd, fy0 + (j % 2), 2.6 + j * .9, 3 + (j === 1 ? 1.2 : 0), 2 - (j % 2) * 2, j);
        cx.save();
        cx.globalCompositeOperation = 'lighter';
        glow(fx0 + 3 * sd, fy0 - 3, 9, '150,235,190', .07 * gl + .04);
        cx.restore();
    }
    [.2, .5, .78].forEach(function (p0, n) { if (S.dug < 1 || p0 < 1 - S.dug)
        return; var a = at(p0), w = 10 + S.tier; [1, -1].forEach(function (sd) { var rx = a.x + a.nx * sd * w * .75, ry = a.y + a.ny * sd * w * .75; cx.fillStyle = '#4a382a'; cx.beginPath(); cx.ellipse(rx, ry, 4.5, 3.2, n, 0, 7); cx.fill(); cx.fillStyle = 'rgba(255,230,190,.18)'; cx.beginPath(); cx.ellipse(rx - 1, ry - 1, 2.2, 1.2, n, 0, 7); cx.fill(); }); });
    cx.restore();
}
