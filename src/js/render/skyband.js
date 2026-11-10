/* render/skyband.js
   Daylight at the top of the Nest view: a strip of sky, grass and flowers with light falling into the
   soil, so the nest reads as a cutaway under a living world instead of a wall of empty soil.
   Nest tab only, and only while the camera sits at its usual place by the queen (it fades out if you
   pan up, where the real surface is). Follows the day and night cycle and the colony's biome.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

var SKYB = null;

function skyBandBits() {
    if (SKYB && SKYB.w === W)
        return SKYB;
    var r = rng(77), i, b = { w: W, blades: [], flowers: [], stones: [], rays: [] };
    for (i = 0; i < W / 2.2; i++)
        b.blades.push({ x: r() * W, h: 6 + r() * 14, l: (r() - .5) * 5, k: r() });
    for (i = 0; i < W / 28; i++)
        b.flowers.push({ x: 8 + r() * (W - 16), h: 10 + r() * 12, c: ['#f2a7c3', '#ffd35a', '#f4f1e8', '#c99cf0'][Math.floor(r() * 4)], s: 1.8 + r() * 1.6 });
    for (i = 0; i < W / 60; i++)
        b.stones.push({ x: r() * W, w: 5 + r() * 9, h: 3 + r() * 4 });
    for (i = 0; i < 4; i++)
        b.rays.push({ x: .12 + i * .24 + (r() - .5) * .08, w: .05 + r() * .06, p: r() * 7 });
    SKYB = b;
    return b;
}

function drawSkyBand(now) {
    if (tab !== 'nest' || uz > 1.05)
        return;
    var vis = Math.max(0, Math.min(1, 1 - Math.abs(cam - (WH - H)) / 70));
    if (vis <= 0)
        return;
    var bt = skyBandBits(), bp = bio(), ds = dayState(), nt = ds.night, t = now * .001, i;
    var bh = Math.min(H * .2, 120), gy = bh * .56;                // band height, grass line
    var sky = bp.sky || ['#4f8fd0', '#9cc8e8', '#dcefd8'], grass = bp.grass || '#4c8a2a';
    cx.save();
    cx.setTransform(dpr * K, 0, 0, dpr * K, 0, 0);
    cx.globalAlpha = vis;
    // sky, darkening towards night
    var g = cx.createLinearGradient(0, 0, 0, gy);
    g.addColorStop(0, sky[0]);
    g.addColorStop(.6, sky[1]);
    g.addColorStop(1, sky[2]);
    cx.fillStyle = g;
    cx.fillRect(0, 0, W, gy + 1);
    if (nt > 0) {
        cx.fillStyle = 'rgba(8,12,40,' + nt * .85 + ')';
        cx.fillRect(0, 0, W, gy + 1);
        cx.fillStyle = 'rgba(255,255,240,' + nt * .8 + ')';
        for (i = 0; i < 18; i++)
            cx.fillRect((i * 97 % W), (i * 37 % (gy * .8)), 1, 1);
    }
    // soil under the grass, fading into the real soil below
    var sg = cx.createLinearGradient(0, gy, 0, bh * 1.35);
    sg.addColorStop(0, bp.top || '#5a3a20');
    sg.addColorStop(.35, 'rgba(40,24,12,.85)');
    sg.addColorStop(1, 'rgba(40,24,12,0)');
    cx.fillStyle = sg;
    cx.fillRect(0, gy, W, bh * 1.35 - gy);
    // light falling down into the soil (daytime)
    var day = 1 - nt;
    if (day > .05) {
        cx.save();
        cx.globalCompositeOperation = 'lighter';
        bt.rays.forEach(function (r) {
            var x = r.x * W, w = r.w * W, a = (.05 + .03 * Math.sin(t * .5 + r.p)) * day;
            var rg = cx.createLinearGradient(0, gy, 0, bh * 2.4);
            rg.addColorStop(0, 'rgba(255,230,170,' + a + ')');
            rg.addColorStop(1, 'rgba(255,230,170,0)');
            cx.fillStyle = rg;
            cx.beginPath();
            cx.moveTo(x - w * .5, gy);
            cx.lineTo(x + w * .5, gy);
            cx.lineTo(x + w * 1.6 + 20, bh * 2.4);
            cx.lineTo(x - w * .2 + 20, bh * 2.4);
            cx.closePath();
            cx.fill();
        });
        cx.restore();
    }
    // the ground line, stones, the nest entrance and grass
    cx.fillStyle = bp.top || '#5a3a20';
    cx.fillRect(0, gy - 2, W, 5);
    bt.stones.forEach(function (s) {
        cx.fillStyle = 'rgba(120,110,100,.9)';
        cx.beginPath(); cx.ellipse(s.x, gy, s.w, s.h, 0, Math.PI, 0); cx.fill();
    });
    if (S.dug >= 1) {
        // once the workers have broken through, the nest entrance shows in the grass
        var ex = (PT[0] ? PT[0][0] : W / 2) - camX;
        cx.fillStyle = 'rgba(110,72,40,.95)';
        cx.beginPath(); cx.ellipse(ex, gy + 1, 22, 9, 0, Math.PI, 0); cx.fill();
        cx.fillStyle = '#140a04';
        cx.beginPath(); cx.ellipse(ex, gy + 1, 8, 5, 0, 0, 7); cx.fill();
    }
    cx.lineCap = 'round';
    bt.blades.forEach(function (b) {
        var sw = Math.sin(t * 1.4 + b.x * .05) * 1.6;
        cx.strokeStyle = b.k < .5 ? grass : 'rgba(30,60,20,.9)';
        cx.lineWidth = 1.4;
        cx.beginPath();
        cx.moveTo(b.x, gy + 1);
        cx.quadraticCurveTo(b.x + b.l * .5, gy - b.h * .6, b.x + b.l + sw, gy - b.h);
        cx.stroke();
    });
    bt.flowers.forEach(function (f) {
        var sw = Math.sin(t * 1.2 + f.x) * 1.4, fx = f.x + sw, fy = gy - f.h;
        cx.strokeStyle = 'rgba(40,80,30,.95)';
        cx.lineWidth = 1;
        cx.beginPath(); cx.moveTo(f.x, gy); cx.lineTo(fx, fy); cx.stroke();
        cx.fillStyle = f.c;
        for (i = 0; i < 5; i++) { cx.beginPath(); cx.arc(fx + Math.cos(i * 1.257) * f.s, fy + Math.sin(i * 1.257) * f.s, f.s * .7, 0, 7); cx.fill(); }
        cx.fillStyle = '#e8a53a';
        cx.beginPath(); cx.arc(fx, fy, f.s * .55, 0, 7); cx.fill();
    });
    cx.restore();
}
