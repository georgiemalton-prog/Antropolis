/* ui/buildings.js
   Colony orders, the seven buildings (costs, building, drawing) and their icons.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

var BDEF = [
    { id: 'store', n: 'Food store', d: 'Holds 25% more food per level', t: 1, c: 150 },
    { id: 'nest', n: 'Extra nursery', d: 'One more egg per clutch, each level', t: 1, c: 220 },
    { id: 'farm', n: 'Fungus farm', d: 'Grows food slowly. Needs nurses', t: 2, c: 300 },
    { id: 'rax', n: 'Barracks wing', d: 'Soldiers hit 12% harder, each level', t: 2, c: 260 },
    { id: 'archive', n: 'Archive', d: 'Slowly makes royal jelly', t: 4, c: 1500, g: 1.75 },
    { id: 'hatch', n: 'Grand hatchery', d: 'Eggs hatch 10% faster, each level', t: 4, c: 1500, g: 1.75 },
    { id: 'tower', n: 'Watchtower', d: 'Invaders hit 8% weaker, each level', t: 4, c: 1500, g: 1.75 }
];
var ODEF = [
    { k: 'wk', n: 'Workers', o: ['Dig tunnels', 'Balanced', 'Build and maintain'], d: 'Maintaining builds faster, clears debris, and limits flood damage.' },
    { k: 'fg', n: 'Foragers', o: ['Balanced', 'Nearest', 'Richest', 'Safest'], d: 'Safest avoids dangerous spots and is hard for spiders to ambush.' },
    { k: 'gd', n: 'Soldiers at the entrance', o: [0, 25, 50, 75, 100], d: 'Guards fight waves harder. The rest patrol the tunnels against spiders and rivals.', pct: 1 },
    { k: 'nu', n: 'Nurses', o: [0, 25, 50, 75, 100], d: 'More on the infirmary heals and cleans mites faster. More in the nursery hatches eggs faster.', pct: 1, lab: ['Nursery', '', 'Even', '', 'Infirmary'] }
];
var THR = null, thT = 100, ordKey = '', mitesT = 7;

function setOrd(k, v) { S.orders[k] = v; ordKey = ''; ordersUi(); }

function bCost(i) { var b = BDEF[i]; return Math.round(b.c * (1 + S.tier * .9) * Math.pow(b.g || 2.8, S.bld[b.id]) * (b.id === 'farm' && S.spores ? .75 : 1)); }

function startBuild(i) {
    var b = BDEF[i], lv = S.bld[b.id];
    if (S.proj || lv >= 4 || S.tier < b.t || S.food < bCost(i))
        return;
    S.food -= bCost(i);
    S.proj = { k: b.id, left: 90 * (lv + 1), tot: 90 * (lv + 1) };
    SFX.buy();
    toast('Workers started building: ' + b.n + '.');
    ordKey = '';
    ordersUi();
}

function buildTick(dt) {
    var pj = S.proj;
    if (pj)
        projTick(dt, pj);
    if (S.bld.archive) {
        S.archT = (S.archT || 0) + dt;
        if (S.archT >= 240 / S.bld.archive) {
            S.archT = 0;
            gainJelly(1);
        }
    }
    if (S.bld.farm) {
        var g = S.bld.farm * (.12 + .04 * S.tier) * (1 + .25 * springCount()) * (S.spores ? 1.25 : 1) * Math.min(1, healthy(0) / (S.bld.farm * 4)) * dt;
        S.food = Math.min(foodCap(), S.food + g);
        earnAcc += g;
    }
}

function projTick(dt, pj) {
    var rate = (1 + Math.min(S.workers, 18) / 6) * (S.orders.wk === 2 ? 1.8 : S.orders.wk === 0 ? .6 : 1);
    pj.left -= dt * rate;
    if (pj.left <= 0) {
        S.bld[pj.k]++;
        S.proj = null;
        var b = BDEF.filter(function (x) { return x.id === pj.k; })[0];
        toast('Built: ' + b.n + ' (level ' + S.bld[pj.k] + ')!');
        SFX.win();
        burst(W * .5, WH - 20, 24, ['#ffd23f', '#fff', '#a07a4a'], 90);
        ordKey = '';
    }
}

function ordersUi() {
    var el = $('orders'), bl = $('build');
    if (!el || !bl)
        return;
    var pj = S.proj, key = JSON.stringify([S.orders, S.bld, S.tier, S.proj && Math.floor(S.proj.left / 3), Math.floor(S.food / 5)]);
    if (key === ordKey)
        return;
    ordKey = key;
    var h = '';
    ODEF.forEach(function (o) {
        h += '<div class="ol">' + o.n + '</div><div class="seg">';
        o.o.forEach(function (v, i) {
            var val = o.pct ? v : i, lab = o.pct ? (o.lab && o.lab[i] ? o.lab[i] : v + '%') : v;
            h += '<button class="' + (S.orders[o.k] === val ? 'on' : '') + '" onclick="setOrd(\'' + o.k + '\',' + val + ')">' + lab + '</button>';
        });
        h += '</div><div class="mute" style="margin:-8px 0 6px;font-size:13px">' + o.d + '</div>';
    });
    el.innerHTML = h;
    h = '';
    if (pj) {
        var b0 = BDEF.filter(function (x) { return x.id === pj.k; })[0];
        h += '<div class="ol">Building: ' + b0.n + '</div><div class="bar"><i style="width:' + Math.round((1 - pj.left / pj.tot) * 100) + '%;background:var(--accent)"></i></div>';
    }
    h += '<div class="ol" style="margin:12px 0 6px">Buildings</div>';
    BDEF.forEach(function (b, i) {
        var lv = S.bld[b.id], locked = S.tier < b.t;
        h += '<button class="card" ' + (locked || lv >= 4 || pj || S.food < bCost(i) ? 'disabled ' : '') + 'onclick="startBuild(' + i + ')"><span><b>' + ico(b.id) + b.n + ' ' + lv + '/4</b><span class="mute">' + b.d + '</span></span><span class="r">' + (locked ? 'Needs nest stage ' + b.t : lv >= 4 ? 'Maxed' : fmt(bCost(i)) + ' food') + '</span></button>';
    });
    bl.innerHTML = h;
}

// the seven buildings are real structures on the floor of the nest. They grow with each level
var BLAY = [[.12, .35], [.27, .9], [.79, .9], [.51, .3], [.39, .95], [.66, .45], [.92, .4]];
function bpos(i) {
    var y0 = QY + (WH - QY) * .58, y1 = WH - 30, t = BLAY[i];
    return { x: Math.max(30, Math.min(W - 30, W * t[0])), y: y0 + t[1] * (y1 - y0), s: Math.max(.8, Math.min(1.3, W / 330)) };
}

function bGround(w) {
    cx.fillStyle = 'rgba(0,0,0,.3)';
    cx.beginPath();
    cx.ellipse(0, 1, w, 3.4, 0, 0, 7);
    cx.fill();
}

function bStore(lv) {
    var j;
    bGround(17);
    cx.fillStyle = '#8f6a3f';
    cx.beginPath();
    cx.moveTo(-14, 0);
    cx.quadraticCurveTo(-15, -17, 0, -18);
    cx.quadraticCurveTo(15, -17, 14, 0);
    cx.closePath();
    cx.fill();
    cx.fillStyle = 'rgba(255,230,180,.2)';
    cx.beginPath();
    cx.ellipse(-5, -12.5, 7, 3.6, -.4, 0, 7);
    cx.fill();
    cx.fillStyle = '#2b1a0e';
    cx.beginPath();
    cx.moveTo(-4.5, 0);
    cx.lineTo(-4.5, -7);
    cx.arc(0, -7, 4.5, Math.PI, 0);
    cx.lineTo(4.5, 0);
    cx.closePath();
    cx.fill();
    cx.strokeStyle = '#5a3d26';
    cx.lineWidth = 1.2;
    cx.beginPath();
    cx.arc(0, -7, 5.4, Math.PI, 0);
    cx.stroke();
    for (j = 0; j < lv * 3; j++) {
        cx.fillStyle = j % 3 ? '#d9b45a' : '#b88a3a';
        cx.beginPath();
        cx.ellipse(-16 + (j * 7) % 32, 1.5 + (j % 2) * 2.2, 2.6, 1.7, j, 0, 7);
        cx.fill();
    }
    if (lv >= 3) {
        cx.fillStyle = '#c9a868';
        cx.beginPath();
        cx.ellipse(15, -4, 4, 5, 0, 0, 7);
        cx.fill();
        cx.fillStyle = '#7a5530';
        cx.fillRect(12.5, -9, 5, 1.6);
    }
}

function bNursery(lv) {
    var j, n = lv + 2;
    bGround(16);
    cx.fillStyle = '#b8964a';
    cx.beginPath();
    cx.ellipse(0, -3, 15, 6.4, 0, 0, 7);
    cx.fill();
    cx.fillStyle = '#e2c987';
    cx.beginPath();
    cx.ellipse(0, -4.2, 12, 4.4, 0, 0, 7);
    cx.fill();
    cx.strokeStyle = '#a07c36';
    cx.lineWidth = .7;
    for (j = 0; j < 10; j++) {
        cx.beginPath();
        cx.moveTo(-13 + j * 2.9, -2.4);
        cx.lineTo(-12 + j * 2.9 + (j % 3), -7.8);
        cx.stroke();
    }
    for (j = 0; j < n; j++) {
        var ex = -9 + j * 18 / Math.max(1, n - 1), ey = -6.6 - (j % 2) * 1.8;
        cx.fillStyle = '#f6edd4';
        cx.beginPath();
        cx.ellipse(ex, ey, 2.7, 3.4, 0, 0, 7);
        cx.fill();
        cx.fillStyle = 'rgba(255,255,255,.7)';
        cx.beginPath();
        cx.ellipse(ex - .8, ey - 1, .8, 1.2, 0, 0, 7);
        cx.fill();
    }
}

function bFarm(lv) {
    var j, n = lv + 2;
    bGround(18);
    cx.fillStyle = '#2f1d0e';
    cx.beginPath();
    cx.ellipse(0, -2.4, 17, 6.6, 0, 0, 7);
    cx.fill();
    cx.fillStyle = '#4b3220';
    cx.beginPath();
    cx.ellipse(0, -3.2, 14.5, 4.8, 0, 0, 7);
    cx.fill();
    for (j = 0; j < 7; j++) {
        cx.fillStyle = j % 2 ? '#5f8c3c' : '#7aa64a';
        cx.beginPath();
        cx.ellipse(-13 + j * 4.4, -1 + (j % 3) * .5, 2.2, 1.1, j, 0, 7);
        cx.fill();
    }
    for (j = 0; j < n; j++)
        shroom(-11 + j * 22 / Math.max(1, n - 1), -2.5 + (j % 2) * 1.8, 6 + (j * 5 % 3) * 2.2, 6.2 + (j % 3) * 1.6, j % 3, j);
}

function bBarracks(lv, now) {
    var j, n = 4 + lv, h, x, w = Math.sin(now * .004) * 1.6;
    bGround(17);
    cx.strokeStyle = '#4a3320';
    cx.lineWidth = 1.2;
    cx.beginPath();
    cx.moveTo(0, -6);
    cx.lineTo(0, -27);
    cx.stroke();
    cx.fillStyle = '#c0392b';
    cx.beginPath();
    cx.moveTo(.6, -27);
    cx.quadraticCurveTo(7, -26 + w, 12, -23 + w);
    cx.quadraticCurveTo(7, -22 + w * .5, .6, -20);
    cx.closePath();
    cx.fill();
    for (j = 0; j < n; j++) {
        x = -14 + j * 28 / (n - 1);
        h = 13 + (j * 5) % 4;
        cx.fillStyle = '#7a5530';
        cx.beginPath();
        cx.moveTo(x - 1.9, 0);
        cx.lineTo(x - 1.9, -h + 4.5);
        cx.lineTo(x, -h);
        cx.lineTo(x + 1.9, -h + 4.5);
        cx.lineTo(x + 1.9, 0);
        cx.closePath();
        cx.fill();
        cx.fillStyle = 'rgba(0,0,0,.2)';
        cx.fillRect(x, -h + 3, 1.9, h - 3);
    }
    cx.strokeStyle = '#4a3320';
    cx.lineWidth = 1.1;
    cx.beginPath();
    cx.moveTo(-15, -4.5);
    cx.lineTo(15, -4.5);
    cx.moveTo(-15, -9);
    cx.lineTo(15, -9);
    cx.stroke();
}

function bArchive(lv) {
    var j;
    bGround(15);
    for (j = 0; j <= lv; j++) {
        var yy = -5.6 - j * 5.6, ww = 25 - (j % 2) * 5, xx = -ww / 2 + (j % 2 ? 1.5 : -1);
        cx.fillStyle = j % 2 ? '#c2ac84' : '#b39a70';
        cx.fillRect(xx, yy, ww, 5.2);
        cx.strokeStyle = '#6a5436';
        cx.lineWidth = .6;
        cx.strokeRect(xx, yy, ww, 5.2);
        cx.strokeStyle = 'rgba(80,58,30,.7)';
        cx.lineWidth = .6;
        cx.beginPath();
        for (var g = 0; g < 4; g++) {
            cx.moveTo(xx + 3 + g * (ww - 6) / 3, yy + 1.3);
            cx.lineTo(xx + 3 + g * (ww - 6) / 3 + 2.2, yy + 3.9);
        }
        cx.stroke();
    }
}

function bHatch(lv, now) {
    bGround(18);
    cx.fillStyle = '#b98e22';
    cx.beginPath();
    cx.moveTo(-16, 0);
    cx.quadraticCurveTo(-16, -21, 0, -21);
    cx.quadraticCurveTo(16, -21, 16, 0);
    cx.closePath();
    cx.fill();
    cx.fillStyle = '#e3b93e';
    cx.beginPath();
    cx.moveTo(-12.5, 0);
    cx.quadraticCurveTo(-12.5, -17, 0, -17);
    cx.quadraticCurveTo(12.5, -17, 12.5, 0);
    cx.closePath();
    cx.fill();
    cx.fillStyle = '#2b1a0e';
    cx.beginPath();
    cx.moveTo(-7, 0);
    cx.quadraticCurveTo(-7, -11, 0, -11);
    cx.quadraticCurveTo(7, -11, 7, 0);
    cx.closePath();
    cx.fill();
    cx.fillStyle = '#f5ecc8';
    cx.beginPath();
    cx.ellipse(0, -4.5, 3.6, 4.8, 0, 0, 7);
    cx.fill();
    if (lv >= 2) {
        cx.beginPath();
        cx.ellipse(-12, 1, 2.8, 3.4, 0, 0, 7);
        cx.ellipse(12.5, 1, 2.8, 3.4, 0, 0, 7);
        cx.fill();
    }
    cx.save();
    cx.globalCompositeOperation = 'lighter';
    glow(0, -8, 26, '255,206,90', .16 + .05 * Math.sin(now * .003));
    cx.restore();
}

function bTower(lv, now) {
    var h = 16 + lv * 8, r, rows = Math.round(h / 4.5);
    bGround(11);
    cx.fillStyle = '#85704f';
    cx.beginPath();
    cx.moveTo(-8, 0);
    cx.lineTo(-5.4, -h);
    cx.lineTo(5.4, -h);
    cx.lineTo(8, 0);
    cx.closePath();
    cx.fill();
    cx.fillStyle = 'rgba(0,0,0,.2)';
    cx.beginPath();
    cx.moveTo(1, 0);
    cx.lineTo(1.5, -h);
    cx.lineTo(5.4, -h);
    cx.lineTo(8, 0);
    cx.closePath();
    cx.fill();
    cx.strokeStyle = 'rgba(40,28,14,.5)';
    cx.lineWidth = .6;
    for (r = 1; r < rows; r++) {
        cx.beginPath();
        cx.moveTo(-8 + 2.6 * r / rows * 0 - (1 - r / rows) * 0, -r * 4.5);
        cx.lineTo(8 - r * .6, -r * 4.5);
        cx.stroke();
    }
    cx.fillStyle = '#2b1a0e';
    cx.beginPath();
    cx.moveTo(-1.8, -h * .55);
    cx.lineTo(-1.8, -h * .55 - 3.4);
    cx.arc(0, -h * .55 - 3.4, 1.8, Math.PI, 0);
    cx.lineTo(1.8, -h * .55);
    cx.closePath();
    cx.fill();
    cx.fillStyle = '#6f5a3c';
    for (r = -1; r <= 1; r++)
        cx.fillRect(r * 3.6 - 1.2, -h - 2.4, 2.4, 2.6);
    cx.fillStyle = '#4a3320';
    cx.fillRect(-.5, -h - 7, 1, 5);
    var fl = .75 + .25 * Math.sin(now * .012);
    cx.fillStyle = 'rgba(255,170,60,' + fl + ')';
    cx.beginPath();
    cx.ellipse(0, -h - 9, 1.7, 2.6, 0, 0, 7);
    cx.fill();
    cx.fillStyle = '#ffe9a0';
    cx.beginPath();
    cx.ellipse(0, -h - 8.5, .8, 1.4, 0, 0, 7);
    cx.fill();
    cx.save();
    cx.globalCompositeOperation = 'lighter';
    glow(0, -h - 9, 16, '255,190,80', .22);
    cx.restore();
}

function dStore(lv, now) {
    cx.fillStyle = '#4a3320';
    cx.fillRect(-7, -11, 1.8, 11);
    cx.fillRect(5.2, -11, 1.8, 11);
    cx.fillRect(-7.6, -13, 15.2, 2);
    cx.fillStyle = '#5f8c3c';
    [[-8, -15.5, -.5], [0, -18.2, .1], [8, -14.5, .6]].forEach(function (l) {
        cx.beginPath();
        cx.ellipse(l[0], l[1], 5, 2.2, l[2], 0, 7);
        cx.fill();
    });
    cx.strokeStyle = '#3f6a2a';
    cx.lineWidth = .5;
    cx.beginPath();
    cx.moveTo(-12, -14.5);
    cx.lineTo(-4, -16.5);
    cx.moveTo(-4, -17.5);
    cx.lineTo(4, -18.8);
    cx.moveTo(4, -14);
    cx.lineTo(12, -14.8);
    cx.stroke();
    if (lv >= 2) {
        cx.fillStyle = '#c9a868';
        cx.beginPath();
        cx.ellipse(-18, -3.5, 3.8, 4.6, 0, 0, 7);
        cx.fill();
        cx.fillStyle = '#7a5530';
        cx.fillRect(-19.6, -8.6, 3.2, 1.4);
    }
    if (lv >= 4) {
        cx.fillStyle = '#d6b878';
        cx.beginPath();
        cx.ellipse(-18, -11, 3.4, 4, 0, 0, 7);
        cx.fill();
    }
    cx.fillStyle = '#e8b04a';
    cx.fillRect(-1.2, -12, 2.4, 3);
    cx.save();
    cx.globalCompositeOperation = 'lighter';
    glow(0, -10.5, 11, '255,190,90', .22 + .05 * Math.sin(now * .004));
    cx.restore();
}

function dNursery(lv, now) {
    var j;
    cx.strokeStyle = 'rgba(138,106,56,.9)';
    cx.lineWidth = 1.2;
    cx.beginPath();
    cx.moveTo(-14, -3);
    cx.quadraticCurveTo(0, -25, 14, -3);
    cx.moveTo(-9.5, -3);
    cx.quadraticCurveTo(0, -18, 9.5, -3);
    cx.stroke();
    cx.lineWidth = .8;
    cx.strokeStyle = 'rgba(160,126,64,.8)';
    cx.beginPath();
    cx.moveTo(-11, -12);
    cx.lineTo(11, -12);
    cx.stroke();
    cx.fillStyle = '#f6edd4';
    for (j = 0; j < 2; j++) {
        var lx = -6 + j * 12 + Math.sin(now * .004 + j * 3) * 1.2;
        cx.beginPath();
        cx.ellipse(lx, -1.4, 3, 1.3, Math.sin(now * .005 + j) * .3, 0, 7);
        cx.fill();
    }
    cx.save();
    cx.globalCompositeOperation = 'lighter';
    glow(0, -7, 15, '255,225,150', .14);
    cx.restore();
}

function dFarm(lv, now) {
    var j;
    cx.fillStyle = '#6b4a2a';
    cx.fillRect(-17, -17, 1.8, 17);
    cx.fillRect(15.2, -17, 1.8, 17);
    cx.fillRect(-17.5, -18.6, 35, 1.8);
    cx.strokeStyle = '#4f8a35';
    cx.lineWidth = .7;
    for (j = 0; j < 4; j++) {
        cx.beginPath();
        cx.moveTo(-12 + j * 8, -17);
        cx.quadraticCurveTo(-13 + j * 8, -13, -11 + j * 8, -10 - (j % 2) * 3);
        cx.stroke();
    }
    var dy = (now * .012) % 16;
    cx.fillStyle = 'rgba(140,200,240,' + (1 - dy / 16) + ')';
    cx.beginPath();
    cx.arc(2, -16 + dy, 1, 0, 7);
    cx.fill();
    for (j = 0; j < 3; j++) {
        var sy = -6 - ((now * .006 + j * 5) % 14);
        cx.fillStyle = 'rgba(235,245,225,' + Math.max(0, .5 - (-sy - 6) / 28) + ')';
        cx.beginPath();
        cx.arc(-8 + j * 8 + Math.sin(now * .004 + j) * 2, sy, .9, 0, 7);
        cx.fill();
    }
}

function dBarracks(lv, now) {
    cx.strokeStyle = '#4a3320';
    cx.lineWidth = 1.2;
    cx.beginPath();
    cx.moveTo(21, 0);
    cx.lineTo(24, -17);
    cx.moveTo(18.5, 0);
    cx.lineTo(20, -16);
    cx.stroke();
    cx.fillStyle = '#b9bec4';
    cx.beginPath();
    cx.moveTo(24, -17);
    cx.lineTo(22.6, -20.4);
    cx.lineTo(25.4, -20);
    cx.closePath();
    cx.fill();
    cx.beginPath();
    cx.moveTo(20, -16);
    cx.lineTo(18.7, -19.2);
    cx.lineTo(21.3, -19);
    cx.closePath();
    cx.fill();
    cx.fillStyle = '#6b4a2a';
    cx.fillRect(-21, -14, 1.5, 14);
    cx.fillRect(-24.5, -10, 8.5, 1.6);
    cx.fillStyle = '#c9a868';
    cx.beginPath();
    cx.ellipse(-20.2, -6.5, 3.2, 4, 0, 0, 7);
    cx.fill();
    cx.fillStyle = '#d6bb78';
    cx.beginPath();
    cx.arc(-20.2, -16.6, 2.6, 0, 7);
    cx.fill();
    cx.fillStyle = '#7a5530';
    cx.fillRect(-23.2, -19.4, 6, 1.2);
}

function dArchive(lv, now) {
    var top = 5.6 + lv * 5.6 + 5.2;
    cx.fillStyle = '#f1e6c8';
    cx.fillRect(5, -top - 4.4, 2.2, 4.4);
    cx.fillStyle = 'rgba(255,200,90,' + (.75 + .25 * Math.sin(now * .012)) + ')';
    cx.beginPath();
    cx.ellipse(6.1, -top - 6.2, 1.1, 1.9, 0, 0, 7);
    cx.fill();
    cx.save();
    cx.globalCompositeOperation = 'lighter';
    glow(6.1, -top - 6, 12, '255,200,100', .2);
    cx.restore();
    cx.fillStyle = '#e8dcb8';
    cx.beginPath();
    cx.ellipse(-16, -2.6, 3.6, 2.2, 0, 0, 7);
    cx.fill();
    cx.strokeStyle = '#a58c5e';
    cx.lineWidth = .6;
    cx.beginPath();
    cx.arc(-18, -2.6, 1.3, 0, 7);
    cx.moveTo(-17, -3.4);
    cx.lineTo(-13.5, -3.4);
    cx.stroke();
    cx.fillStyle = '#8e7a58';
    cx.fillRect(12, -4.4, 3.6, 4.4);
    cx.fillRect(11.4, -5.6, 4.8, 1.4);
}

function dHatch(lv, now) {
    var j;
    cx.fillStyle = '#e3b93e';
    [-19, 19].forEach(function (x) {
        cx.fillRect(x - 1.6, -15, 3.2, 15);
        cx.fillStyle = '#f4d56a';
        cx.fillRect(x - 2.4, -16.4, 4.8, 1.8);
        cx.fillStyle = '#e3b93e';
    });
    cx.strokeStyle = 'rgba(90,60,20,.7)';
    cx.lineWidth = .6;
    cx.beginPath();
    cx.moveTo(-1.5, -9);
    cx.lineTo(.3, -7.6);
    cx.lineTo(-.8, -6.2);
    cx.lineTo(1.2, -4.8);
    cx.stroke();
    for (j = 0; j < 3; j++) {
        var sy = -22 - ((now * .01 + j * 6) % 12);
        cx.strokeStyle = 'rgba(255,230,160,' + Math.max(0, .4 - (-sy - 22) / 30) + ')';
        cx.lineWidth = .8;
        cx.beginPath();
        cx.moveTo(-5 + j * 5 + Math.sin(now * .005 + j) * 1.5, sy);
        cx.lineTo(-5 + j * 5 + Math.sin(now * .005 + j + 1) * 1.5, sy - 4);
        cx.stroke();
    }
}

function dTower(lv, now) {
    var h = 16 + lv * 8, w = Math.sin(now * .005) * 1;
    cx.strokeStyle = '#4a3320';
    cx.lineWidth = 1;
    cx.beginPath();
    cx.moveTo(-5.8, -h - 2);
    cx.lineTo(-5.8, -h - 13);
    cx.stroke();
    cx.fillStyle = '#c0392b';
    cx.beginPath();
    cx.moveTo(-5.5, -h - 13);
    cx.quadraticCurveTo(-1 + w, -h - 12, 2.5, -h - 9.5 + w);
    cx.lineTo(-5.5, -h - 8);
    cx.closePath();
    cx.fill();
    cx.fillStyle = 'rgba(255,200,100,.9)';
    cx.fillRect(-1.1, -h * .28 - 4, 2.2, 3.4);
    cx.save();
    cx.globalCompositeOperation = 'lighter';
    glow(0, -h * .28 - 2.5, 8, '255,190,90', .2);
    cx.restore();
}

function drawBuild(now) {
    var scb = .7 / (K * uz), order = [0, 1, 2, 3, 4, 5, 6].sort(function (a, b) { return bpos(a).y - bpos(b).y; });
    drawCavern(now);
    order.forEach(function (i) {
        var b = BDEF[i], lv = S.bld[b.id], bp = bpos(i), building = S.proj && S.proj.k === b.id;
        if (lv > 0) {
            cx.save();
            cx.translate(bp.x, bp.y);
            cx.scale(bp.s * (1 + lv * .06), bp.s * (1 + lv * .06));
            BFN[i](lv, now);
            BDET[i](lv, now);
            cx.restore();
        }
        if (building) {
            var fr = 1 - S.proj.left / S.proj.tot;
            cx.save();
            cx.translate(bp.x, bp.y);
            cx.scale(bp.s, bp.s);
            cx.strokeStyle = 'rgba(255,225,150,.75)';
            cx.lineWidth = 1;
            cx.setLineDash([3, 2]);
            cx.strokeRect(-15, -20, 30, 21);
            cx.setLineDash([]);
            cx.fillStyle = 'rgba(255,225,150,.28)';
            cx.fillRect(-15, 1 - 21 * fr, 30, 21 * fr);
            cx.restore();
            if (now > dustT) {
                dustT = now + 280;
                fx.push({ x: bp.x + (Math.random() * 20 - 10), y: bp.y - 4, vx: (Math.random() - .5) * 8, vy: -10, l: .7, t: '•', f: 7, c: '#d9bf92', g: 0 });
            }
        }
        if (lv > 0 || building) {
            cx.font = '700 ' + (7.4 * scb) + 'px system-ui';
            cx.textAlign = 'center';
            cx.fillStyle = 'rgba(255,240,205,.92)';
            cx.strokeStyle = 'rgba(0,0,0,.65)';
            cx.lineWidth = 1.8 * scb;
            var tx = building ? BSHORT[i] + ' (building)' : BSHORT[i] + ' ' + lv;
            cx.strokeText(tx, bp.x, bp.y + 10 * scb);
            cx.fillText(tx, bp.x, bp.y + 10 * scb);
        }
    });
}
