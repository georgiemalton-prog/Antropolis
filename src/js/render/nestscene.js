/* render/nestscene.js
   The Nest tab (build 68): one great cavern, the Queen's Chamber, filling the screen. It is drawn on its
   own, separate from the tunnel world (the Tunnel tab still shows the real map). Buildings are part of the
   cavern itself and appear as the colony builds them; unbuilt spots are bare rock with a chalk mark.
   The still parts (rock, buildings) are drawn once into a cache and only redrawn when something changes;
   each frame adds the glows, the ants, the queen, her eggs and the effects.
   The queen, eggs, rings and effects are the real ones from the world, drawn through a transform that
   puts the queen's home spot on her bed (nsXf).
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

// where each feature sits, as a share of the scene's width and usable height
var NSF = [
    { id: 'barracks', n: 'Barracks', x: .5, y: .09 },
    { id: 'tower', n: 'Watchtower', x: .17, y: .15 },
    { id: 'archive', n: 'Archive', x: .83, y: .15 },
    { id: 'fungus', n: 'Fungus Garden', x: .17, y: .35 },
    { id: 'infirmary', n: 'Infirmary', x: .83, y: .35 },
    { id: 'store', n: 'Food Store', x: .2, y: .89 },
    { id: 'nursery', n: 'Nursery', x: .8, y: .89 }
];
var NS = { c: null, key: '', W: 0, H: 0, Hs: 0, T: 0, ants: null, lt: 0 };

// the colony's real progress for each feature: built?, level dots, under construction (0..1 or -1), can upgrade now?
function nsState(id) {
    var b = S.bld, pj = S.proj, prog = -1, lv = 0, on = false, up = false;
    function bp(k) { if (pj && pj.k === k) prog = 1 - pj.left / pj.tot; }
    function room(i) { if (S.tier > i) { lv += 1 + rl(i); on = true; if (roomCanUp(i)) up = true; } }
    function bl(k) { var i = bIdx(k); lv += b[k] || 0; if (b[k] > 0) on = true; bp(k); if (i >= 0 && bCanUp(i)) up = true; }
    if (id === 'store') { on = true; bl('store'); }
    else if (id === 'nursery') { on = true; room(1); bl('nest'); bl('hatch'); }
    else if (id === 'fungus') { room(0); bl('farm'); }
    else if (id === 'barracks') { room(2); bl('rax'); }
    else if (id === 'archive') bl('archive');
    else if (id === 'tower') bl('tower');
    else if (id === 'infirmary') on = true;
    return { on: on || prog >= 0, lv: Math.min(5, lv), prog: prog, up: up };
}
function bIdx(k) { for (var i = 0; i < BDEF.length; i++) if (BDEF[i].id === k) return i; return -1; }
function bCanUp(i) { var b = BDEF[i]; return !S.proj && S.bld[b.id] < 4 && S.tier >= b.t && S.food >= bCost(i); }

// scene size: the canvas, minus the strip hidden behind the tab bar (Hs) and the strip under the
// counters and goal card at the top (T); the buildings and the queen are laid out between the two
function nsSize() {
    var cw = cv.clientWidth || 360, ch = cv.clientHeight || 540, nv = document.querySelector('.nav'), hs = ch, r = cv.getBoundingClientRect(), top = 0;
    if (nv) { var nt = nv.getBoundingClientRect().top - r.top; if (nt > ch * .5 && nt < ch) hs = nt; }
    if (document.body.classList.contains('nt')) {
        top = 62;
        ['goals', 'goal'].forEach(function (id) { var e = $(id), b = e && e.offsetHeight ? e.getBoundingClientRect().bottom - r.top : 0; if (b > top && b < ch * .4) top = b; });
        top = Math.ceil(top / 6) * 6;
        var ni = $('ninfo'); if (ni && ni.style.top !== top + 8 + 'px') ni.style.top = top + 8 + 'px';
    }
    NS.W = cw; NS.H = ch; NS.Hs = hs; NS.T = top;
}
// a height in the laid-out part of the scene: 0 = just under the top strip, 1 = the tab bar
function nsY(f) { return NS.T + f * (NS.Hs - NS.T); }
// where the queen's bed sits: the middle of the cavern
function nsQY() { return nsY(.6); }

// world -> scene: the queen's home spot lands on her bed, at a fixed scale
function nsXf() { return { s: 1.1, x: NS.W * .5 - 14, y: nsQY() - 30 }; }

function drawNest(now) {
    nsSize();
    var W = NS.W, H = NS.H, Hs = NS.Hs, t = now * .001, d = dpr, ouz = uz;
    // the nest is a close view: draw every ant in full detail
    uz = Math.max(uz, 1.2 / K);
    var key = [W, H, Hs, NS.T, d, S.tier, P.theme || ''].concat(NSF.map(function (f) { var s = nsState(f.id); return (s.on ? 1 : 0) + ':' + s.lv + ':' + (s.prog >= 0 ? Math.floor(s.prog * 10) : -1); })).join('|') + '|' + Math.round(Math.min(1, S.food / foodCap()) * 6);
    if (key !== NS.key || !NS.c) {
        NS.key = key;
        NS.c = NS.c || document.createElement('canvas');
        NS.c.width = Math.round(W * d);
        NS.c.height = Math.round(H * d);
        var g0 = NS.c.getContext('2d');
        g0.setTransform(d, 0, 0, d, 0, 0);
        nsStatic(g0, W, H, Hs);
    }
    cx.setTransform(1, 0, 0, 1, 0, 0);
    cx.drawImage(NS.c, 0, 0);
    cx.setTransform(d, 0, 0, d, 0, 0);
    var g = cx;
    // living light: the queen's glow, fungus, jelly, the lookout lamp, the healing drop
    nsDynamic(g, W, Hs, t);
    // the colony's ants roaming the cavern
    nsRoam(g, W, Hs, t);
    // the real queen, her eggs, rings and effects, through the world transform
    var xf = nsXf(), qh = { x: QX + 7, y: QY - 3 };
    g.save();
    g.setTransform(d * xf.s, 0, 0, d * xf.s, d * (xf.x - xf.s * qh.x), d * (xf.y - xf.s * (qh.y - cam)));
    eggs(now, 1.7);
    g.save();
    g.translate(0, -cam);
    var qp = qPos();
    drawAnt(qp.x, qp.y, Q.tilt, qSize() + pulse * 3, false, Q.ph, 3);
    rings = rings.filter(function (r) { r.l -= .016; r.r += 3.2; return r.l > 0; });
    rings.forEach(function (r) { g.strokeStyle = 'rgba(' + r.c + ',' + r.l * .8 + ')'; g.lineWidth = 3 * r.l + 1; g.beginPath(); g.arc(r.x, r.y, r.r, 0, 7); g.stroke(); });
    g.restore();
    drawFoesFx(now);
    g.restore();
    cx.setTransform(d, 0, 0, d, 0, 0);
    nsQueenInfo(g, W, Hs, t, xf);
    // upgrade arrows and building progress on top
    NSF.forEach(function (f) {
        var s = nsState(f.id), x = f.x * W, y = nsY(f.y);
        if (s.prog >= 0) nsBuilding(g, f, x, y, t, s.prog);
        else if (s.on && s.up) { g.font = '600 9.5px Inter, system-ui, sans-serif'; var tw = g.measureText(f.n).width / 2 + 8, ay = y + 14 + Math.sin(t * 4) * 1.5; g.fillStyle = '#ffd35a'; g.beginPath(); g.moveTo(x + tw, ay - 5); g.lineTo(x + tw + 4.5, ay + 1); g.lineTo(x + tw - 4.5, ay + 1); g.closePath(); g.fill(); }
    });
    uz = ouz;
}

// the feature under a tap at canvas css point (px, py), or null
function nsFeatureAt(px, py) {
    var best = null, bd = 44;
    NSF.forEach(function (f) { var d = Math.hypot(f.x * NS.W - px, nsY(f.y) - 14 - py); if (d < bd) { bd = d; best = f; } });
    return best;
}

// ---- drawing helpers ----
function nsRand(seed) { return rng(seed); }
function nsLerp(a, b, u) { return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * u) + ',' + Math.round(a[1] + (b[1] - a[1]) * u) + ',' + Math.round(a[2] + (b[2] - a[2]) * u) + ')'; }
function nsShadow(g, x, y, rx, ry, a) { var sg = g.createRadialGradient(x, y, 1, x, y, rx); sg.addColorStop(0, 'rgba(0,0,0,' + a + ')'); sg.addColorStop(1, 'rgba(0,0,0,0)'); g.save(); g.translate(x, y); g.scale(1, ry / rx); g.translate(-x, -y); g.fillStyle = sg; g.beginPath(); g.arc(x, y, rx, 0, 7); g.fill(); g.restore(); }
function nsGlow(g, x, y, r, col, a) { g.save(); g.globalCompositeOperation = 'lighter'; var gg = g.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, 'rgba(' + col + ',' + a + ')'); gg.addColorStop(1, 'rgba(' + col + ',0)'); g.fillStyle = gg; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore(); }
function nsRR(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function nsMound(g, x, y, w, h, col, seed) {
    var R = nsRand(seed), i, n = 18;
    nsShadow(g, x, y + 2, w * .62, h * .35, .55);
    g.beginPath(); g.moveTo(x - w / 2, y);
    for (i = 0; i <= n; i++) { var a = Math.PI + Math.PI * i / n, b = 1 + (R() - .5) * .12; g.lineTo(x + Math.cos(a) * w / 2 * b, y + Math.sin(a) * h * b); }
    g.closePath();
    var mg = g.createLinearGradient(0, y - h, 0, y);
    mg.addColorStop(0, nsLerp(col, [255, 220, 180], .25)); mg.addColorStop(.5, nsLerp(col, [0, 0, 0], .1)); mg.addColorStop(1, nsLerp(col, [0, 0, 0], .55));
    g.fillStyle = mg; g.fill();
    for (i = 0; i < w * .8; i++) { g.fillStyle = R() < .5 ? 'rgba(255,230,200,.18)' : 'rgba(0,0,0,.22)'; var px = x + (R() - .5) * w * .85, py = y - R() * h * .85 * (1 - Math.pow((px - x) / (w / 2), 2)); g.fillRect(px, py, 1.3, 1.3); }
}
function nsTag(g, x, y, name, lv, on) {
    g.font = '600 9.5px Inter, system-ui, sans-serif'; g.textAlign = 'center';
    g.lineWidth = 3; g.strokeStyle = 'rgba(10,4,2,.85)'; g.strokeText(name, x, y); g.fillStyle = on ? 'rgba(245,225,205,.9)' : 'rgba(225,185,150,.5)'; g.fillText(name, x, y);
    if (on && lv > 0) for (var i = 0; i < 5; i++) { g.fillStyle = i < lv ? '#f0a050' : 'rgba(240,160,80,.22)'; g.beginPath(); g.arc(x - 12 + i * 6, y + 7, 1.8, 0, 7); g.fill(); }
}

// ---- the still picture: rock, roof, floor, every built feature ----
function nsStatic(g, W, H, Hs) {
    var R = nsRand(42), i, j;
    var bg = g.createRadialGradient(W * .5, Hs * .72, 10, W * .5, Hs * .55, Hs * .75);
    bg.addColorStop(0, '#7e3419'); bg.addColorStop(.3, '#5a2412'); bg.addColorStop(.65, '#2e130a'); bg.addColorStop(1, '#120705');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    for (i = 0; i < 9; i++) {
        g.strokeStyle = 'rgba(' + (i % 2 ? '140,70,35' : '25,10,5') + ',' + (.07 + R() * .08) + ')'; g.lineWidth = 6 + R() * 16;
        var yy = Hs * (.06 + i * .1 + R() * .03);
        g.beginPath(); g.moveTo(-10, yy); g.bezierCurveTo(W * .3, yy + (R() - .5) * 30, W * .7, yy + (R() - .5) * 30, W + 10, yy + (R() - .5) * 20); g.stroke();
    }
    for (i = 0; i < W * H / 280; i++) { g.fillStyle = 'rgba(' + (R() < .55 ? '160,90,55' : '20,8,4') + ',' + (.1 + R() * .25) + ')'; g.fillRect(R() * W, R() * H, 1 + R() * 1.4, 1 + R() * 1.4); }
    [-1, 1].forEach(function (dd) {
        var ex = dd < 0 ? 0 : W, wg = g.createLinearGradient(ex, 0, ex - dd * W * .2, 0);
        wg.addColorStop(0, 'rgba(10,4,2,.95)'); wg.addColorStop(1, 'rgba(10,4,2,0)');
        g.fillStyle = wg; g.fillRect(dd < 0 ? 0 : W * .8, 0, W * .2, H);
        for (i = 0; i < 9; i++) {
            var by = Hs * (.05 + i * .11 + R() * .04), bs = 14 + R() * 20, bx = ex + dd * (-bs * .3 - R() * 10);
            var rg = g.createRadialGradient(bx - dd * bs * .35, by - bs * .35, 2, bx, by, bs * 1.1);
            rg.addColorStop(0, 'rgba(110,62,38,.45)'); rg.addColorStop(.6, 'rgba(50,24,12,.6)'); rg.addColorStop(1, 'rgba(15,6,3,0)');
            g.fillStyle = rg; g.beginPath(); g.ellipse(bx, by, bs, bs * .8, R(), 0, 7); g.fill();
        }
    });
    var rg2 = g.createLinearGradient(0, 0, 0, Hs * .14); rg2.addColorStop(0, 'rgba(8,3,2,.95)'); rg2.addColorStop(1, 'rgba(8,3,2,0)');
    g.fillStyle = rg2; g.fillRect(0, 0, W, Hs * .14);
    var eg = g.createRadialGradient(W * .5, 0, 2, W * .5, 0, 34); eg.addColorStop(0, '#000'); eg.addColorStop(.7, 'rgba(0,0,0,.9)'); eg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = eg; g.beginPath(); g.ellipse(W * .5, 0, 34, 30, 0, 0, 7); g.fill();
    g.lineCap = 'round';
    for (i = 0; i < 13; i++) {
        var x0 = W * (i + R() * .7) / 13, L = Hs * (.04 + R() * .1), c = (R() - .5) * 18;
        if (Math.abs(x0 - W * .5) < 30) continue;
        if (i % 4 === 0) { var sg = g.createLinearGradient(x0 - 5, 0, x0 + 5, 0); sg.addColorStop(0, '#1e0d06'); sg.addColorStop(.5, '#5a3020'); sg.addColorStop(1, '#1e0d06'); g.fillStyle = sg; g.beginPath(); g.moveTo(x0 - 6, 0); g.lineTo(x0 + 6, 0); g.lineTo(x0 + 1, L * .9); g.closePath(); g.fill(); continue; }
        for (j = 0; j < 7; j++) { var u0 = j / 7, u1 = (j + 1) / 7; g.strokeStyle = 'rgba(30,13,7,.95)'; g.lineWidth = Math.max(.6, (2.5 + R() * 3) * (1 - u0 * .85)); g.beginPath(); g.moveTo(x0 + c * u0 * u0, L * u0); g.lineTo(x0 + c * u1 * u1, L * u1); g.stroke(); }
    }
    var fg = g.createLinearGradient(0, Hs * .8, 0, H);
    fg.addColorStop(0, 'rgba(130,75,42,0)'); fg.addColorStop(.3, 'rgba(118,66,36,.9)'); fg.addColorStop(1, '#2c150a');
    g.fillStyle = fg; g.fillRect(0, Hs * .8, W, H - Hs * .8);
    for (i = 0; i < 40; i++) { var px = R() * W, py = Hs * (.86 + R() * .13), ps = 1 + R() * 3; g.fillStyle = 'rgba(30,14,7,.6)'; g.beginPath(); g.ellipse(px, py + 1, ps * 1.2, ps * .5, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(170,120,90,.6)'; g.beginPath(); g.ellipse(px, py, ps, ps * .6, 0, 0, 7); g.fill(); }
    // the queen's bed (and the Royal Court's lit pillars once it is open)
    nsBed(g, nsXf().x + 14, nsQY());
    NSF.forEach(function (f) {
        var s = nsState(f.id), x = f.x * W, y = nsY(f.y);
        if (s.prog >= 0) { g.save(); g.globalAlpha = .3 + .7 * s.prog; nsFeature(g, f.id, x, y); g.restore(); }
        else if (s.on) nsFeature(g, f.id, x, y);
        else nsMark(g, x, y);
        nsTag(g, x, y + 18, f.n, s.lv, s.on);
    });
}

function nsMark(g, x, y) {
    g.setLineDash([3, 4]); g.strokeStyle = 'rgba(235,195,155,.3)'; g.lineWidth = 1.2;
    g.beginPath(); g.ellipse(x, y - 14, 38, 22, 0, 0, 7); g.stroke(); g.setLineDash([]);
    g.strokeStyle = 'rgba(235,195,155,.55)'; g.lineWidth = 1.8;
    g.beginPath(); g.moveTo(x - 6, y - 8); g.lineTo(x + 5, y - 19); g.moveTo(x + 1, y - 22); g.quadraticCurveTo(x + 8, y - 21, x + 9, y - 14); g.stroke();
}

function nsBed(g, x, fl) {
    var R = nsRand(9), i;
    if (S.tier > 3) {
        [-1, 1].forEach(function (dd) {
            var px = x + dd * 118, pg = g.createLinearGradient(px - 7, 0, px + 7, 0); pg.addColorStop(0, '#3a1e10'); pg.addColorStop(.5, '#7a4428'); pg.addColorStop(1, '#2a140a');
            g.fillStyle = pg; g.fillRect(px - 6, fl - 92, 12, 92);
            g.fillStyle = 'rgba(0,0,0,.35)'; for (var k = 0; k < 5; k++) g.fillRect(px - 6, fl - 20 - k * 16, 12, 2);
            g.fillStyle = '#ff6a4a'; g.beginPath(); g.ellipse(px, fl - 64, 5, 3.5, 0, 0, 7); g.fill();
        });
    }
    nsShadow(g, x, fl, 110, 22, .5);
    var bgr = g.createRadialGradient(x, fl - 10, 4, x, fl - 4, 104); bgr.addColorStop(0, '#d8b070'); bgr.addColorStop(.7, '#9a7038'); bgr.addColorStop(1, '#5a3e1c');
    g.fillStyle = bgr; g.beginPath(); g.ellipse(x, fl - 6, 100, 20, 0, 0, 7); g.fill();
    for (i = 0; i < 140; i++) { var a = R() * 6.283, r2 = Math.sqrt(R()), sx = x + Math.cos(a) * 98 * r2, sy = fl - 6 + Math.sin(a) * 19 * r2, ln = 6 + R() * 10, an = a + Math.PI / 2 + (R() - .5); g.strokeStyle = R() < .5 ? 'rgba(240,205,140,.7)' : 'rgba(120,85,40,.7)'; g.lineWidth = .8; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + Math.cos(an) * ln, sy + Math.sin(an) * ln * .3); g.stroke(); }
    g.strokeStyle = 'rgba(255,245,230,.25)'; g.lineWidth = .6; for (i = 0; i < 12; i++) { g.beginPath(); g.moveTo(x - 90 + R() * 180, fl - 6 + (R() - .5) * 30); g.quadraticCurveTo(x + (R() - .5) * 100, fl - 30 - R() * 10, x - 90 + R() * 180, fl - 6 + (R() - .5) * 30); g.stroke(); }
}

function nsSeed(g, x, y, R) {
    var k = Math.floor(R() * 3), r = R() * 6.283;
    g.save(); g.translate(x, y); g.rotate(r);
    if (k === 0) { var sg = g.createLinearGradient(-3, 0, 3, 0); sg.addColorStop(0, '#3a2a1a'); sg.addColorStop(.5, '#6a5236'); sg.addColorStop(1, '#2a1c10'); g.fillStyle = sg; g.beginPath(); g.ellipse(0, 0, 4.2, 2.2, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(240,230,210,.6)'; g.lineWidth = .5; g.beginPath(); g.moveTo(-3.5, 0); g.lineTo(3.5, 0); g.stroke(); }
    else if (k === 1) { var mg = g.createRadialGradient(-1, -1, .3, 0, 0, 3); mg.addColorStop(0, '#fff2c8'); mg.addColorStop(1, '#c89a4a'); g.fillStyle = mg; g.beginPath(); g.arc(0, 0, 2.6, 0, 7); g.fill(); }
    else { var wg = g.createLinearGradient(0, -2, 0, 2); wg.addColorStop(0, '#f0d090'); wg.addColorStop(1, '#a87830'); g.fillStyle = wg; g.beginPath(); g.ellipse(0, 0, 3.8, 1.9, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(120,80,30,.6)'; g.fillRect(-2.5, -.3, 5, .6); }
    g.restore();
}

function nsMush(g, x, y, s) {
    nsShadow(g, x, y + 1, s * .6, s * .15, .4);
    var st = g.createLinearGradient(x - s * .15, 0, x + s * .15, 0); st.addColorStop(0, '#a89c84'); st.addColorStop(.5, '#f2ead8'); st.addColorStop(1, '#9a8e76');
    g.fillStyle = st; g.beginPath(); g.moveTo(x - s * .16, y); g.quadraticCurveTo(x - s * .08, y - s * .55, x - s * .1, y - s * .95); g.lineTo(x + s * .1, y - s * .95); g.quadraticCurveTo(x + s * .08, y - s * .55, x + s * .16, y); g.closePath(); g.fill();
    var cy = y - s * .92, cg = g.createRadialGradient(x - s * .2, cy - s * .35, s * .05, x, cy - s * .1, s * .75);
    cg.addColorStop(0, '#e8fff2'); cg.addColorStop(.35, '#8af0c0'); cg.addColorStop(1, '#2a8a64');
    g.fillStyle = cg; g.beginPath(); g.moveTo(x - s * .62, cy); g.bezierCurveTo(x - s * .6, cy - s * .55, x + s * .6, cy - s * .55, x + s * .62, cy); g.quadraticCurveTo(x, cy + s * .12, x - s * .62, cy); g.fill();
    g.strokeStyle = 'rgba(20,80,55,.6)'; g.lineWidth = .5; for (var i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(x + i * s * .08, cy + s * .02); g.lineTo(x + i * s * .16, cy + s * .08); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.ellipse(x - s * .2, cy - s * .3, s * .14, s * .06, -.3, 0, 7); g.fill();
}

var NS_MUSH = [[-34, 7], [-26, 11], [-17, 8], [-9, 15], [0, 10], [9, 18], [18, 9], [26, 13], [34, 7], [-4, 6], [14, 6]];
var NS_COMB = (function () { var c = [], r, k; for (r = 0; r < 5; r++) for (k = 0; k < 4; k++) c.push([-18 + k * 12.25 + (r % 2) * 6.1, -52 + r * 10.5]); return c; })();

// one feature's still drawing, centred on its floor point (x, y)
function nsFeature(g, id, x, y) {
    var R = nsRand(id.length * 991 + 3), i, k;
    if (id === 'store') {
        nsShadow(g, x, y + 2, 64, 14, .6);
        var bw = g.createLinearGradient(0, y - 10, 0, y + 6); bw.addColorStop(0, '#2a140a'); bw.addColorStop(1, '#5a3420');
        g.fillStyle = bw; g.beginPath(); g.ellipse(x, y, 56, 12, 0, 0, 7); g.fill();
        g.strokeStyle = 'rgba(200,140,90,.35)'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(x, y, 56, 12, 0, .1, Math.PI - .1); g.stroke();
        // the heap grows with how full the food store is
        var full = Math.max(0, Math.min(1, S.food / foodCap())), hh = 8 + 40 * full, n = Math.round(40 + 260 * full);
        R = nsRand(5);
        for (k = 0; k < n; k++) { var u = R() * 2 - 1, cap = Math.sqrt(Math.max(0, 1 - u * u)), v = Math.sqrt(R()), sx = x + u * 50, sy = y - 2 - v * hh * cap; nsSeed(g, sx, sy, R); }
        g.fillStyle = 'rgba(255,240,200,.12)'; g.beginPath(); g.ellipse(x - 8, y - hh * .7, 22, 6, 0, 0, 7); g.fill();
        var lf = g.createLinearGradient(x + 40, y - 8, x + 62, y); lf.addColorStop(0, '#8ac050'); lf.addColorStop(1, '#3a6a20'); g.fillStyle = lf; g.beginPath(); g.moveTo(x + 40, y - 2); g.quadraticCurveTo(x + 52, y - 16, x + 66, y - 6); g.quadraticCurveTo(x + 54, y + 2, x + 40, y - 2); g.fill();
        g.strokeStyle = 'rgba(30,60,15,.7)'; g.lineWidth = .7; g.beginPath(); g.moveTo(x + 41, y - 2); g.lineTo(x + 64, y - 6); g.stroke();
    } else if (id === 'nursery') {
        nsShadow(g, x, y + 2, 60, 12, .55);
        var nb = g.createRadialGradient(x, y - 6, 2, x, y - 2, 58); nb.addColorStop(0, '#9ab868'); nb.addColorStop(.7, '#5a7a34'); nb.addColorStop(1, '#2e4218');
        g.fillStyle = nb; g.beginPath(); g.ellipse(x, y - 3, 56, 13, 0, 0, 7); g.fill();
        g.strokeStyle = 'rgba(255,250,235,.35)'; g.lineWidth = .6; for (i = 0; i < 18; i++) { g.beginPath(); g.moveTo(x - 50 + R() * 100, y - 3 + (R() - .5) * 18); g.quadraticCurveTo(x + (R() - .5) * 60, y - 14, x - 50 + R() * 100, y - 3 + (R() - .5) * 18); g.stroke(); }
        for (i = 0; i < 6; i++) {
            var lx = x - 44 + i * 12 + (i % 2) * 3, ly = y - 9 - (i % 2) * 5;
            g.save(); g.translate(lx, ly); g.rotate((i % 3 - 1) * .2);
            var lg = g.createRadialGradient(-1, -2, .5, 0, 0, 7); lg.addColorStop(0, '#fffdf6'); lg.addColorStop(1, '#d8ccb0');
            g.fillStyle = lg; g.beginPath(); g.ellipse(0, 0, 6.5, 4.6, 0, 0, 7); g.fill();
            g.strokeStyle = 'rgba(160,140,110,.55)'; g.lineWidth = .6; for (k = -2; k <= 2; k++) { g.beginPath(); g.ellipse(k * 2.2, 0, .8, 4.2, 0, -1.4, 1.4); g.stroke(); }
            g.fillStyle = '#b89a6a'; g.beginPath(); g.arc(5.6, -1, 1.6, 0, 7); g.fill();
            g.restore();
        }
        for (i = 0; i < 4; i++) {
            var cxx = x + 16 + i * 10, cy = y - 12 - (i % 2) * 3, cg = g.createLinearGradient(cxx - 5, 0, cxx + 5, 0);
            cg.addColorStop(0, '#9a7a4a'); cg.addColorStop(.45, '#f0dca8'); cg.addColorStop(1, '#7a5a30');
            g.fillStyle = cg; g.beginPath(); g.ellipse(cxx, cy, 4.6, 8.2, .12, 0, 7); g.fill();
            g.strokeStyle = 'rgba(255,250,230,.45)'; g.lineWidth = .5; for (k = 0; k < 5; k++) { g.beginPath(); g.moveTo(cxx - 4, cy - 6 + k * 3); g.lineTo(cxx + 4, cy - 4 + k * 3); g.stroke(); }
        }
    } else if (id === 'fungus') {
        g.strokeStyle = 'rgba(200,255,225,.22)'; g.lineWidth = .7;
        for (i = 0; i < 14; i++) { var mx = x - 30 + R() * 60; g.beginPath(); g.moveTo(mx, y - 10); g.bezierCurveTo(mx + (R() - .5) * 30, y - 40, mx + (R() - .5) * 40, y - 60, mx + (R() - .5) * 50, y - 80 - R() * 30); g.stroke(); }
        nsMound(g, x, y, 92, 22, [70, 50, 32], 11);
        for (i = 0; i < 40; i++) { g.fillStyle = ['rgba(120,90,50,.8)', 'rgba(90,110,50,.6)', 'rgba(40,25,15,.8)'][i % 3]; g.beginPath(); g.ellipse(x + (R() - .5) * 80, y - R() * 16, 2 + R() * 2, 1, R() * 3, 0, 7); g.fill(); }
        NS_MUSH.forEach(function (m, k2) { nsMush(g, x + m[0], y - 6 - (k2 % 3) * 3, m[1]); });
    } else if (id === 'infirmary') {
        [[-30, 0, 30, 13], [4, -3, 34, 15], [36, 1, 26, 11]].forEach(function (c) {
            var cx2 = x + c[0], cy2 = y + c[1];
            nsShadow(g, cx2, cy2 + 2, c[2] * .9, 6, .5);
            var mg = g.createRadialGradient(cx2 - c[2] * .3, cy2 - c[3] * .8, 2, cx2, cy2 - c[3] * .3, c[2]);
            mg.addColorStop(0, '#b8e070'); mg.addColorStop(.5, '#5c9a34'); mg.addColorStop(1, '#2a4a16');
            g.fillStyle = mg; g.beginPath(); g.ellipse(cx2, cy2 - c[3] * .45, c[2], c[3], 0, Math.PI, 0); g.lineTo(cx2 + c[2], cy2); g.lineTo(cx2 - c[2], cy2); g.fill();
            for (var q = 0; q < c[2] * 2.2; q++) { var a = Math.PI + R() * Math.PI, r3 = Math.sqrt(R()); g.fillStyle = R() < .5 ? 'rgba(220,255,160,.45)' : 'rgba(20,50,10,.4)'; g.fillRect(cx2 + Math.cos(a) * c[2] * r3, cy2 - c[3] * .45 + Math.sin(a) * c[3] * r3, 1.2, 1.2); }
            g.fillStyle = 'rgba(220,250,255,.9)'; g.beginPath(); g.arc(cx2 - c[2] * .3, cy2 - c[3] * 1.1, 1.4, 0, 7); g.fill();
        });
    } else if (id === 'archive') {
        var s = 7;
        nsShadow(g, x, y - 22, 40, 34, .5);
        g.fillStyle = '#6a4416'; g.beginPath();
        for (k = 0; k < 14; k++) { var a2 = k / 14 * 6.283, r4 = 34 + Math.sin(k * 2.3) * 5; g[k ? 'lineTo' : 'moveTo'](x + Math.cos(a2) * r4 * .85, y - 26 + Math.sin(a2) * r4); }
        g.closePath(); g.fill();
        NS_COMB.forEach(function (c, k3) {
            var hx = x + c[0], hy = y + c[1], q;
            g.beginPath(); for (q = 0; q < 6; q++) { var a3 = q * Math.PI / 3 + Math.PI / 6; g[q ? 'lineTo' : 'moveTo'](hx + Math.cos(a3) * s, hy + Math.sin(a3) * s); } g.closePath();
            g.fillStyle = '#3a2208'; g.fill();
            var capped = k3 % 5 === 2 || k3 % 7 === 4;
            g.beginPath(); for (q = 0; q < 6; q++) { var a4 = q * Math.PI / 3 + Math.PI / 6; g[q ? 'lineTo' : 'moveTo'](hx + Math.cos(a4) * s * .78, hy + Math.sin(a4) * s * .78); } g.closePath();
            var fg2;
            if (capped) { fg2 = g.createRadialGradient(hx - 1.5, hy - 1.5, .5, hx, hy, s); fg2.addColorStop(0, '#fff0c0'); fg2.addColorStop(1, '#c89a50'); }
            else { fg2 = g.createRadialGradient(hx - 1.5, hy - 2, .4, hx, hy, s * .9); fg2.addColorStop(0, '#fff6c0'); fg2.addColorStop(.4, '#ffbe32'); fg2.addColorStop(1, '#a85a08'); }
            g.fillStyle = fg2; g.fill();
            if (!capped) { g.fillStyle = 'rgba(255,255,240,.7)'; g.beginPath(); g.ellipse(hx - 2, hy - 2.5, 1.6, .8, -.5, 0, 7); g.fill(); }
        });
    } else if (id === 'barracks') {
        nsMound(g, x, y, 120, 12, [96, 56, 32], 21);
        for (i = 0; i < 11; i++) {
            var sx2 = x - 52 + i * 10.4, ht = 26 + (i % 3) * 6, lean = (i - 5) * .02;
            var tg = g.createLinearGradient(sx2 - 3, 0, sx2 + 3, 0); tg.addColorStop(0, '#3a1408'); tg.addColorStop(.5, '#9a4a26'); tg.addColorStop(1, '#3a1408');
            g.fillStyle = tg; g.beginPath(); g.moveTo(sx2 - 3, y - 6); g.quadraticCurveTo(sx2 - 2 + lean * 40, y - 6 - ht * .6, sx2 + lean * ht * 2, y - 6 - ht); g.quadraticCurveTo(sx2 + 2 + lean * 40, y - 6 - ht * .6, sx2 + 3, y - 6); g.closePath(); g.fill();
            g.fillStyle = 'rgba(255,200,160,.35)'; g.beginPath(); g.moveTo(sx2 - .5, y - 8); g.lineTo(sx2 + lean * ht * 2, y - 5 - ht); g.lineTo(sx2 + .6, y - 8); g.fill();
        }
        g.strokeStyle = '#5a3a1e'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(x - 56, y - 18); g.quadraticCurveTo(x, y - 14, x + 56, y - 18); g.stroke();
        [-38, 38].forEach(function (o) { var shx = x + o, shy = y - 12; nsShadow(g, shx, shy + 8, 10, 3, .5); var sg2 = g.createRadialGradient(shx - 3, shy - 4, 1, shx, shy, 10); sg2.addColorStop(0, '#d8d0c4'); sg2.addColorStop(.6, '#7a726a'); sg2.addColorStop(1, '#3a3430'); g.fillStyle = sg2; g.beginPath(); g.ellipse(shx, shy, 9, 10, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 1; g.stroke(); g.fillStyle = 'rgba(80,70,60,.6)'; for (var q = 0; q < 6; q++) g.fillRect(shx - 5 + R() * 10, shy - 6 + R() * 12, 1.4, 1.4); });
    } else if (id === 'tower') {
        nsMound(g, x, y, 54, 10, [96, 56, 32], 31);
        for (k = 0; k < 3; k++) {
            g.strokeStyle = ['#4a2c16', '#6a4224', '#3a200e'][k]; g.lineWidth = 6 - k;
            g.beginPath(); g.moveTo(x - 8 + k * 6, y - 4);
            for (i = 1; i <= 10; i++) g.lineTo(x - 4 + k * 3 + Math.sin(i * .9 + k * 2) * 5, y - 4 - i * 6);
            g.stroke();
        }
        g.strokeStyle = 'rgba(255,210,170,.25)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x - 6, y - 6); for (i = 1; i <= 10; i++) g.lineTo(x - 3 + Math.sin(i * .9) * 5, y - 6 - i * 6); g.stroke();
        var pg2 = g.createLinearGradient(0, y - 70, 0, y - 62); pg2.addColorStop(0, '#9a6a3a'); pg2.addColorStop(1, '#4a2c14'); g.fillStyle = pg2; g.beginPath(); g.ellipse(x, y - 66, 18, 5, 0, 0, 7); g.fill();
        g.strokeStyle = 'rgba(30,15,6,.6)'; g.lineWidth = .7; for (i = 0; i < 4; i++) { g.beginPath(); g.ellipse(x, y - 66, 18 - i * 4, 5 - i * 1.1, 0, 0, 7); g.stroke(); }
        g.strokeStyle = 'rgba(40,20,10,.8)'; g.lineWidth = .7; g.beginPath(); g.moveTo(x - 14, y - 100); g.lineTo(x - 14, y - 86); g.stroke();
    }
}

// ---- what moves and glows each frame ----
function nsDynamic(g, W, Hs, t) {
    var i, R = nsRand(77);
    g.save(); g.globalCompositeOperation = 'lighter';
    var qx = nsXf().x + 14, ql = g.createRadialGradient(qx, nsQY() - 40, 10, qx, nsQY() - 40, W * .8);
    ql.addColorStop(0, 'rgba(255,70,40,' + (.13 + .04 * Math.sin(t * 2)) + ')'); ql.addColorStop(1, 'rgba(255,70,40,0)');
    g.fillStyle = ql; g.fillRect(0, 0, W, Hs); g.restore();
    if (S.tier > 3) [-1, 1].forEach(function (dd) { nsGlow(g, qx + dd * 118, nsQY() - 64, 34, '255,90,60', .4 + .1 * Math.sin(t * 2.2 + dd)); });
    NSF.forEach(function (f) {
        var s = nsState(f.id), x = f.x * W, y = nsY(f.y);
        if (!s.on || s.prog >= 0) return;
        if (f.id === 'fungus') {
            NS_MUSH.forEach(function (m, k) { var s2 = m[1]; nsGlow(g, x + m[0], y - 6 - (k % 3) * 3 - s2 * 1.1, s2 * 1.8, '120,255,190', .12 + .05 * Math.sin(t * 2 + k)); });
            for (i = 0; i < 12; i++) { var u = (t * .07 + i / 12) % 1; g.fillStyle = 'rgba(200,255,225,' + (.7 * (1 - u)) + ')'; g.beginPath(); g.arc(x - 30 + R() * 60 + Math.sin(t * 1.3 + i) * 5, y - 20 - u * 60, 1.1, 0, 7); g.fill(); }
            nsGlow(g, x, y - 18, 70, '110,255,180', .22 + .05 * Math.sin(t * 1.7));
        } else if (f.id === 'archive') {
            var du = (t * .3) % 1; g.fillStyle = '#ffb030'; g.beginPath(); g.ellipse(x + 4, y - 4 + du * 14, 1.8, 2.6, 0, 0, 7); g.fill();
            nsGlow(g, x, y - 30, 56, '255,170,50', .3 + .06 * Math.sin(t * 2));
        } else if (f.id === 'tower') {
            var gw = y - 84 + Math.sin(t * 1.4) * 2; g.fillStyle = '#d8f8ff'; g.beginPath(); g.ellipse(x - 14, gw, 2.4, 3.4, 0, 0, 7); g.fill(); nsGlow(g, x - 14, gw, 30, '180,230,255', .45 + .1 * Math.sin(t * 2));
            nsAnt(g, x + 2, y - 72, -Math.PI / 2, 3, t * 3);
        } else if (f.id === 'infirmary') {
            var hurt = Math.min(3, S.injured.reduce(function (a, b) { return a + b; }, 0));
            if (hurt > 0) nsAnt(g, x - 30, y - 15, -.2, 2, 0);
            if (hurt > 1) nsAnt(g, x + 6, y - 19, .25, 1, 0);
            if (hurt > 2) nsAnt(g, x + 34, y - 12, -.1, 2, 0);
            if (hurt > 0) { var dy = y - 40 + Math.sin(t * 2) * 3; g.fillStyle = '#c8ffc8'; g.beginPath(); g.arc(x - 12, dy, 2.8, 0, 7); g.fill(); nsGlow(g, x - 12, dy, 20, '150,240,150', .4); }
        } else if (f.id === 'barracks') {
            nsAnt(g, x - 16, y - 9, 0, 2, t * 2);
            nsAnt(g, x + 18, y - 9, Math.PI, 2, t * 2 + 3);
            nsGlow(g, x, y - 20, 56, '255,140,70', .16);
        } else if (f.id === 'store') nsGlow(g, x, y - 20, 50, '255,210,120', .1);
        else if (f.id === 'nursery') nsGlow(g, x, y - 12, 50, '255,220,180', .1);
    });
}

// workers building a feature: a twig frame, dust, ants carrying, a progress bar
function nsBuilding(g, f, x, y, t, p) {
    g.strokeStyle = 'rgba(170,125,75,.95)'; g.lineWidth = 1.6;
    for (var i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(x + i * 17, y + 2); g.lineTo(x + i * 17 + 3, y - 44); g.stroke(); }
    g.beginPath(); g.moveTo(x - 38, y - 28); g.lineTo(x + 40, y - 26); g.moveTo(x - 36, y - 12); g.lineTo(x + 38, y - 10); g.stroke();
    for (i = 0; i < 6; i++) { var dx = Math.sin(t * 3 + i * 2) * 30, a = (t * 1.6 + i * .17) % 1; g.fillStyle = 'rgba(200,160,120,' + (.45 * (1 - a)) + ')'; g.beginPath(); g.arc(x + dx, y - 8 - a * 22, 2 + a * 5, 0, 7); g.fill(); }
    for (i = 0; i < 3; i++) { var u = (t * .25 + i / 3) % 1; nsAnt(g, x - 36 + u * 72, y - 2, 0, 6, t * 10 + i, false); }
    g.fillStyle = 'rgba(0,0,0,.6)'; nsRR(g, x - 34, y + 26, 68, 6, 3); g.fill(); g.fillStyle = '#f0a050'; nsRR(g, x - 33, y + 27, 66 * p, 4, 2); g.fill();
}

// one of the colony's ants, drawn at the nest's closer scale. k: 0 nurse, 1 forager, 2 soldier, 3 scout, 4 super major, 6 worker (index into SZ and KD)
function nsAnt(g, x, y, a, k, ph, leaf) {
    antDraw(x, y, a, SZ[k] * (k === 4 ? .9 : 1.8), leaf ? 1 : false, ph, KD[k], true);
}

// the colony's ants wander the cavern freely and stop at buildings now and then
function nsRoam(g, W, Hs, t) {
    var c = [S.nurses, S.foragers, S.soldiers, S.scouts, S.superMajors], tot = c[0] + c[1] + c[2] + c[3] + c[4], n = Math.max(4, Math.min(36, Math.round(4 + Math.sqrt(tot) * 2.2))), i;
    if (!NS.ants || NS.ants.n !== n || NS.ants.W !== W) {
        var R = nsRand(7), old = NS.ants ? NS.ants.a : [], a = [];
        for (i = 0; i < n; i++) {
            var pick = R() * Math.max(1, tot), k = 0, acc = c[0];
            while (k < 4 && pick > acc) { k++; acc += c[k]; }
            var o = old[i] || { x: W * (.15 + R() * .7), y: nsY(.08 + R() * .88), tx: 0, ty: 0, w: 0, ph: R() * 6, a: 0 };
            o.k = tot ? k : 0;
            a.push(o);
        }
        NS.ants = { n: n, W: W, a: a };
    }
    var dt = Math.min(.05, Math.max(0, t - (NS.lt || t))); NS.lt = t;
    NS.ants.a.forEach(function (a, k) {
        if (a.w > 0) a.w -= dt;
        else {
            var dx = a.tx - a.x, dy = a.ty - a.y, d = Math.hypot(dx, dy);
            if (!a.tx || d < 3) {
                if (Math.random() < .35) { var f = NSF[Math.floor(Math.random() * NSF.length)]; a.tx = f.x * W + (Math.random() - .5) * 40; a.ty = nsY(f.y) - 4; }
                else { a.tx = W * (.12 + Math.random() * .76); a.ty = nsY(.06 + Math.random() * .9); }
                a.w = Math.random() < .5 ? .5 + Math.random() * 2 : 0;
            } else {
                var sp = 26 * (a.k === 4 ? .6 : 1), ta = Math.atan2(dy, dx), da = ((ta - a.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
                a.a += da * Math.min(1, dt * 6);
                a.x += Math.cos(a.a) * sp * dt; a.y += Math.sin(a.a) * sp * dt; a.ph += dt * 10;
            }
        }
        nsAnt(g, a.x, a.y, a.a, a.k, a.ph, a.k === 1 && k % 3 === 0);
    });
}

// is the queen under a tap? (press and hold her for the Royal Court; see main/input.js)
// is the scene point (px, py) on the queen?
function nsQueenAt(px, py) {
    var xf = nsXf(), qp = qPos(), qx = xf.x + xf.s * (qp.x - QX - 7), qy = xf.y + xf.s * (qp.y - QY + 3);
    return Math.hypot(px - qx, py - qy) < 60;
}

// the queen and egg details (health, next egg, egg chances, room) move out of the panel under the nest into
// a card opened by the i button; the same elements, so the HUD keeps updating them (called once from boot.js)
function initNestInfo() {
    var el = document.createElement('div'), pn = $('p-nest');
    el.className = 'intro';
    el.id = 'nestinfo';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.innerHTML = '<div class="icard"><h3>The Queen’s Chamber</h3><div id="nibody"></div><div class="irow"><button class="card dig" id="niok">Close</button></div></div>';
    document.body.appendChild(el);
    while (pn.firstChild)
        $('nibody').appendChild(pn.firstChild);
    function close() { el.classList.remove('on'); }
    $('niok').onclick = close;
    el.addEventListener('click', function (e) { if (e.target === el) close(); });
    $('ninfo').onclick = function () { el.classList.add('on'); };
}

// in the scene: a health bar over the queen when she is hurt, and the next-egg ring at the foot of the cavern
function nsQueenInfo(g, W, Hs, t, xf) {
    var hp = S.queenHp / hpMax(), qp = qPos(), qx = xf.x + xf.s * (qp.x - QX - 7), qy = xf.y + xf.s * (qp.y - QY + 3);
    if (hp < .999) {
        var bw = 70, by = qy - 52;
        g.fillStyle = 'rgba(0,0,0,.6)'; nsRR(g, qx - bw / 2 - 1, by - 1, bw + 2, 7, 3.5); g.fill();
        g.fillStyle = hp < .35 ? '#ff4a3a' : '#c0452d'; nsRR(g, qx - bw / 2, by, Math.max(2, bw * hp), 5, 2.5); g.fill();
        g.font = '600 9px Inter, system-ui, sans-serif'; g.textAlign = 'center'; g.lineWidth = 3; g.strokeStyle = 'rgba(10,4,2,.85)';
        var tx = Math.ceil(S.queenHp) + ' / ' + hpMax(); g.strokeText(tx, qx, by - 4); g.fillStyle = '#ffd8c8'; g.fillText(tx, qx, by - 4);
    }
    // next egg: a ring that fills as the next egg comes, with the seconds (or why no egg is coming)
    var cap = capN(), pop = popn(), gap = layGap(), x = W * .5, y = Hs - 22, r = 13, why = pop + S.eggs.length >= cap ? 'Nest full' : S.food < eggCost() ? 'Need food' : '';
    var f = why ? 0 : Math.max(0, Math.min(1, 1 - S.layTimer / gap));
    g.fillStyle = 'rgba(20,10,6,.72)'; g.beginPath(); g.arc(x, y, r + 4, 0, 7); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke();
    g.strokeStyle = why ? '#e0803a' : '#7fd06a'; g.beginPath(); g.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + f * 6.283); g.stroke();
    g.fillStyle = '#fbf2e4'; g.beginPath(); g.ellipse(x, y, 4.2, 5.6, 0, 0, 7); g.fill();
    g.font = '600 10px Inter, system-ui, sans-serif'; g.textAlign = 'left'; g.lineWidth = 3; g.strokeStyle = 'rgba(10,4,2,.85)';
    var lb = why || ('Next egg ' + Math.ceil(S.layTimer) + 's');
    g.strokeText(lb, x + r + 9, y + 3.5); g.fillStyle = why ? '#ffc890' : '#f2e2cc'; g.fillText(lb, x + r + 9, y + 3.5);
    g.textAlign = 'right';
    var ln = 'Ants ' + pop + ' of ' + cap;
    g.strokeText(ln, x - r - 9, y + 3.5); g.fillStyle = '#f2e2cc'; g.fillText(ln, x - r - 9, y + 3.5);
}
