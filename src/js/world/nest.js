/* world/nest.js
   The queen's cavern: its lumpy shape, how it grows, and where the floor and ceiling are.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

// the nest cavern starts small and grows with the colony. cavFull() is the biggest it gets (deep layers hang off it).
var CAVG = { s: null, v: 1 };
function cavFull() { var top = QY - (36 + S.tier * 2) - 14, cy = WH + 34; return { x: W / 2, y: cy, rx: W / 2 - 5, ry: cy - top, top: top }; }
function cavGoal() {
    if (S.deep > 0)
        return 1;
    var f = Math.min(1, Math.log(Math.max(1, popn())) / Math.log(1500));
    f = Math.max(f, Math.min(1, (S.cavLevel || 0) / 10));
    return .4 + .6 * f;
}
function cavInit() {
    CAVG.s = S;
    S.cavG = Math.max(S.cavG || 0, cavGoal());
    CAVG.v = S.cavG;
}
function cavTick(dt) {
    if (CAVG.s !== S)
        cavInit();
    var g = cavGoal();
    if (g > (S.cavG || 0))
        S.cavG = g;
    if (S.deep > 0)
        S.cavG = 1;
    if (S.deep > 0)
        CAVG.v = 1;
    else if (CAVG.v < S.cavG && S.workers < 1)
        CAVG.v = Math.min(S.cavG, CAVG.v + dt * .003);
    // workers start widening once the nest is noticeably behind the colony's size, and keep going until it has caught up
    if (CAVG.dig && S.cavG - CAVG.v < .0005)
        CAVG.dig = 0;
    else if (!CAVG.dig && S.cavG - CAVG.v > .004 && S.workers > 0 && !(S.deep > 0))
        CAVG.dig = 1;
}
// where the crew chews at the cavern wall: one of four spots round the sides and floor, moving on as the nest grows
var CAVA = [.15, Math.PI - .15, .95, Math.PI - .95];
function cavFace() {
    var c = cav(), a = CAVA[Math.floor(CAVG.v * 12) % 4], m = cavM(a);
    return { x: c.x + Math.cos(a) * c.rx * m * .97, y: c.y + Math.sin(a) * c.ry * m * .97, ang: a };
}
function cav() {
    var f = cavFull();
    if (CAVG.s !== S)
        cavInit();
    var g = CAVG.v;
    if (g >= .999)
        return f;
    var ry = f.ry * g;
    return { x: f.x, y: f.top + ry, rx: f.rx * (.55 + .45 * g), ry: ry, top: f.top };
}

var CAVP = { k: -1, b: [], p: [] };
function cavParams() {
    if (CAVP.k === S.seed)
        return CAVP;
    var r = rng(S.seed + 4242), i;
    CAVP.k = S.seed;
    CAVP.p = [r() * 6.28, r() * 6.28, r() * 6.28];
    CAVP.b = [];
    for (i = 0; i < 5; i++)
        CAVP.b.push({ a: Math.PI * (1.08 + .84 * (i + .2 + r() * .6) / 5), w: .09 + r() * .08, h: .025 + r() * .03 });
    CAVP.f = [];
    for (i = 0; i < 7; i++)
        CAVP.f.push({ a: Math.PI * (.06 + .88 * (i + .15 + r() * .7) / 7), w: .07 + r() * .09, h: (r() < .6 ? 1 : -.7) * (.03 + r() * .045) });
    return CAVP;
}
// how far the cave wall bulges out past the plain oval at angle a
function cavM(a) {
    var P2 = cavParams(), up = Math.max(0, -Math.sin(a)), m = 0, i, d;
    m += .012 * (1 + Math.sin(3 * a + P2.p[0])) + .012 * (1 + Math.sin(7 * a + P2.p[1])) + .007 * (1 + Math.sin(13 * a + P2.p[2]));
    for (i = 0; i < P2.b.length; i++) {
        d = (a - P2.b[i].a) / P2.b[i].w;
        m += P2.b[i].h * Math.exp(-d * d);
    }
    var dn = Math.max(0, Math.sin(a)), fm = 0;
    if (dn > 0 && P2.f) {
        // the floor and lower walls get their own lumps so the bottom isn't a clean oval
        fm += .02 * Math.sin(5 * a + P2.p[1]) + .014 * Math.sin(11 * a + P2.p[2]);
        for (i = 0; i < P2.f.length; i++) {
            d = (a - P2.f[i].a) / P2.f[i].w;
            fm += P2.f[i].h * Math.exp(-d * d);
        }
    }
    return 1 + m * (.25 + .75 * up) + fm * Math.min(1, dn * 1.6);
}
// floor height at world x
function cavBot(x) {
    var c = cav(), u = Math.max(-.98, Math.min(.98, (x - c.x) / c.rx)), a = Math.acos(u), i, m = cavM(a);
    for (i = 0; i < 3; i++) {
        a = Math.atan2(Math.sqrt(Math.max(0, 1 - (u / m) * (u / m))), u / m);
        m = cavM(a);
    }
    return c.y + Math.sin(a) * c.ry * m;
}
function cavPath(grow) {
    var c = cav(), n = 120, i, a, m;
    cx.beginPath();
    for (i = 0; i <= n; i++) {
        a = Math.PI * 2 * i / n;
        m = cavM(a);
        var x = c.x + Math.cos(a) * (c.rx * m + grow), y = c.y + Math.sin(a) * (c.ry * m + grow);
        if (i)
            cx.lineTo(x, y);
        else
            cx.moveTo(x, y);
    }
    cx.closePath();
}
// ceiling height at world x, matching the lumpy outline
function cavTop(x) {
    var c = cav(), u = Math.max(-.98, Math.min(.98, (x - c.x) / c.rx)), a = -Math.acos(u), i, m = cavM(a);
    for (i = 0; i < 3; i++) {
        a = Math.atan2(-Math.sqrt(Math.max(0, 1 - (u / m) * (u / m))), u / m);
        m = cavM(a);
    }
    return c.y + Math.sin(a) * c.ry * m;
}
