/* core/helpers.js
   Small helpers used everywhere: DOM lookup, number formatting, random numbers, toasts, cards, shapes.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

// safety: a canvas ellipse with a negative radius throws and would stop the frame, so clamp radii at zero
// a canvas ellipse with a negative radius throws and would stop the frame, so clamp radii at zero (called once from boot.js)
function patchCanvasEllipse() {
    (function () { var E = CanvasRenderingContext2D.prototype.ellipse; CanvasRenderingContext2D.prototype.ellipse = function (x, y, rx, ry, r, a0, a1, ccw) { if (!(rx >= 0))
        rx = rx < 0 ? -rx : 0; if (!(ry >= 0))
        ry = ry < 0 ? -ry : 0; return E.call(this, x, y, rx, ry, r, a0, a1, ccw); }; })();
}
/* THE COLONY - a single-file ant colony game (canvas + vanilla JS).

   How this file is laid out
   0. Game data and state: tables, constants and every global variable (S is the saved game state).
   1..16. Modules: each is a group of related functions.
      1. Helpers
      2. Audio and haptics
      3. Saving, loading and starting a new colony
      4. Counting ants
      5. Economy: eggs, food and rewards
      6. Upgrades, masteries and jelly
      7. World layout, paths and camera
      8. Digging: workers, crews and explorers
      9. Ant behaviour: eggs, injuries and movement
      10. Combat: waves, invaders and loot
      11. Anthill and raiders
      12. Drawing the world and the nest
      13. Drawing ants and invaders
      14. Effects
      15. HUD, screens and tutorial
      16. Main loop
      17. Offline progress
      18. Music
      19. Settings: backups and battery saver
   Last: startup code that loads the save and starts the game.

   Tests: open test.html (next to this file on your website) and press "Run checks".

   Functions are hoisted, so their order in the file does not affect how the game runs. */

// ---- game data and state ----
/* ----------------------------------------------------------------------
   GLOSSARY: what the saved colony (S) holds
     tier          nest stage, 0 = Dirt hole ... 4 = Supercolony
     dug           how much of the main tunnel is dug, 0 to 1 (1 = reached the surface)
     food, jelly   the two currencies
     nurses, foragers, soldiers, scouts, workers, superMajors   ant counts by class
     injured       injured ants per class (same order as CN below)
     eggs          eggs waiting to hatch: { t: seconds left, c: class }
     layTimer      seconds until the queen lays again
     queenHp       queen's health; queenLevel and classLevel[] are royal jelly upgrade levels
     sideTunnels   how many side tunnels have been started; sideDug[k] is how dug each one is, 0 to 1
     foodSpots     food spots the workers uncovered: { p: position along the tunnel, stock, cap }
     wave          invader waves so far; hillLevel, hillHp, raidTimer, raidsWon are the surface anthill
     totalHatched  ants ever hatched; milestone, goalIndex, queenTaps, deliveries track progress
     foodRate, foragersAtRate, digRate   measured rates used for offline progress
     savedAt       when the game was last saved (used to work out time away)
   P holds what survives a royal flight: legacy points and perks.

   GLOSSARY: what each ant on screen holds (the 'marchers' list; m in the code)
     k     class: 0 nurse, 1 forager, 2 soldier, 3 scout, 4 super major (CN gives the names)
     p, d  position along the main tunnel (0 = surface end, 1 = queen) and direction (+1 / -1)
     l     which lane of the tunnel it walks in, -1 to 1
     v, ph walking speed multiplier and leg animation phase
     px, py  free position for ants not on a tunnel path (nurses, injured ants)
     inj, st, rt   injured?, recovery stage (0 walking, 1 to bed, 2 resting), rest time
     q, s, sd      scouts: which side tunnel, position in it, direction
     tp, si, cg, home   foragers: target, which food spot, carrying food?, heading home?
     sf    foragers on a surface trip; kp = nurses working in a chamber
     wx, wy, wa    where it was last drawn (used for tapping and following)
     sx, sy, sa    smoothed drawing position (stops jumps and spins)
   Worker ants live in 'crewA': st is their job step (dig, out, drop, back, or t... for upkeep).
   ---------------------------------------------------------------------- */
var $ = function (i) { return document.getElementById(i); };
var T = [{ n: 'Dirt hole', c: 0 }, { n: 'Burrow', c: 1500 }, { n: 'Colony', c: 20000 }, { n: 'Anthill', c: 200000 }, { n: 'Supercolony', c: 1000000 }];
var LG = [
    { id: 'swift', n: 'Swift diggers', d: 'Tunnels dig 50% faster per level.' },
    { id: 'found', n: 'Founding brood', d: 'Start each colony with 3 more nurses per level.' },
    { id: 'hardy', n: 'Hardy eggs', d: 'Soldiers deal 15% more per level.' },
    { id: 'fat', n: 'Rich larder', d: 'Eggs cost 15% less food per level.' },
    { id: 'wisdom', n: 'Ancestral wisdom', d: 'Class upgrades cost 8% less jelly per level.', gen: 1, gl: 'Generation II' },
    { id: 'heir', n: 'Royal heirs', d: 'Each new colony starts with 2 more jelly per level.', gen: 2, gl: 'Generation III' }
];
var ROM = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
function genNum() { return (P.gen || 0) + 1; }
function genName(n) { return n <= 10 ? ROM[n - 1] : String(n); }
var tab = 'nest', camT = 0;

// ---- helpers ----

function pk(i) { return P.perks[i] || 0; }

function fmt(n) {
    if (n < 1000)
        return n < 10 && n % 1 ? n.toFixed(n < 1 ? 2 : 1) : Math.floor(n).toString();
    var s = ['K', 'M', 'B', 'T', 'Qa'], i = -1;
    while (n >= 1000 && i < s.length - 1) {
        n /= 1000;
        i++;
    }
    return (n < 10 ? n.toFixed(2) : n < 100 ? n.toFixed(1) : Math.floor(n)) + s[i];
}

function rng(s) { return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

// 0 to 1 with a small bounce past full size
function popIn(t) { var c = 1.9; t -= 1; return Math.max(.2, 1 + (c + 1) * t * t * t + c * t * t); }
function rrect(x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); cx.beginPath(); if (w <= 0) return; cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }
function glow(x, y, r, c, a) { var g = cx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(' + c + ',' + a + ')'); g.addColorStop(1, 'rgba(' + c + ',0)'); cx.fillStyle = g; cx.fillRect(x - r, y - r, 2 * r, 2 * r); }

function toast(m) {
    var Q = toast.q || (toast.q = []);
    if (toast.cur === m || Q.indexOf(m) >= 0)
        return;
    Q.push(m);
    if (Q.length > 4)
        Q.shift();
    if (!toast.busy)
        toastNext();
}

function toastNext() {
    var t = $('toast'), Q = toast.q || [];
    clearTimeout(toast.h);
    if (!Q.length) {
        toast.busy = false;
        toast.cur = null;
        t.classList.remove('on');
        return;
    }
    toast.busy = true;
    toast.cur = Q.shift();
    t.textContent = toast.cur;
    t.classList.add('on');
    toast.h = setTimeout(toastNext, Q.length ? 2300 : 3400);
}

function card(par, id, fn) { var b = document.createElement('button'); b.className = 'card'; b.id = id; b.onclick = fn; par.appendChild(b); return b; }

function seq(fs, gap, ty, v) { fs.forEach(function (f, i) { setTimeout(function () { tn(f, .18, ty || 'triangle', v || .12); }, i * gap); }); }

function chipRow(a) { return a.map(function (i) { return '<span class="chip" style="margin:0 6px 6px 0"><i style="background:' + CC[i] + '"></i>' + CN[i] + '</span>'; }).join(''); }

// ---- colony orders, buildings and threats ----

/* little card icons, drawn as inline SVG so they stay sharp at any size */
var ICO = {
    store: '<path d="M6 7Q10 3 14 7L16 16Q10 19 4 16Z"/><path d="M7 7H13" stroke="#2b1a0e" stroke-width="1.4" fill="none"/>',
    nest: '<ellipse cx="10" cy="11" rx="5" ry="7"/>',
    farm: '<path d="M3 10Q10 0 17 10Z"/><rect x="8" y="10" width="4" height="7" rx="1.5"/>',
    rax: '<path d="M10 2L17 5V10Q17 16 10 18Q3 16 3 10V5Z"/>',
    archive: '<rect x="4" y="3" width="12" height="14" rx="1.5"/><path d="M7 7H13M7 10H13" stroke="#2b1a0e" stroke-width="1.2" fill="none"/>',
    hatch: '<ellipse cx="10" cy="12" rx="4.5" ry="6"/><path d="M10 1L11 3.5L13.5 4L11.5 5.5L12 8L10 6.6L8 8L8.5 5.5L6.5 4L9 3.5Z"/>',
    tower: '<path d="M6 17V7H5V3H8V5H9V3H11V5H12V3H15V7H14V17Z"/>',
    court: '<path d="M3 16L4 6L8 10L10 4L12 10L16 6L17 16Z"/>',
    cave: '<path d="M2 17Q2 4 10 4Q18 4 18 17Z"/>',
    reach: '<path d="M2 10H18M5 7L2 10L5 13M15 7L18 10L15 13" fill="none" stroke="#e8b04a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    deep: '<path d="M10 2V17M5 12L10 17L15 12" fill="none" stroke="#e8b04a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    jelly: '<path d="M10 2L16 6V14L10 18L4 14V6Z"/>'
};
function ico(k) { return ICO[k] ? '<svg viewBox="0 0 20 20" width="18" height="18" fill="#e8b04a" style="vertical-align:-3px;margin-right:7px">' + ICO[k] + '</svg>' : ''; }
var RICO = ['farm', 'nest', 'rax', 'court'];
