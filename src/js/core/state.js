/* core/state.js
   The colony state S, legacy P and the global game variables (canvas, camera, ants, invaders, effects).
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

var S, P = { legacy: 0, legacyEver: 0, perks: {} }, mut = false, dead = false;
var fly;
var cv, cx, W = 320, H = 267, WH = 534, K = 1.1, dpr = 1, cam = 0, PT = [], CUM = [], LEN = 0, pebs = [], marchers = [], fx = [], foes = [], wvi = { n: 0 }, nf = 0, QX = 160, QY = 480, pulse = 0, shake = 0, lastP = 0;
var FN = ['beetle', 'spider', 'wasp', 'wood louse'], IC = ['', '', '', ''], CI = [6, 7, 5, 4];
var still;
var lt, sy = 0;
var DEEP = [], DEEPP = [], FARM = [], FARMP = [], BRN = [], BP = [], MP = [], MAIN = null, nbt = 25, ltx, follow = 0;
var rings = [], flash = 0, motes = [];
var CAPS = [12, 40, 120, 400, 1500], TP = [0, 10, 35, 110, 360], TF = [0, 30, 250, 1500, 8000], digging = false;
var MSD = [[5, 'First Brood'], [10, 'A Real Colony'], [25, 'The Colony Grows'], [50, 'Fifty Strong'], [100, 'A Hundred Legs'], [250, 'The Great Swarm'], [500, 'Ant Nation'], [1000, 'The Endless March']];
var GOLD = 1 / 5000, ORD = [6, 0, 1, 2, 3], CW = [22, 28, 26, 14, 10], CN = ['Nurse', 'Forager', 'Soldier', 'Scout', 'Super Major'], CC = ['#f2a6c1', '#6fbf4a', '#d9452b', '#4aa8d8', '#b5382a'], KD = [4, 5, 1, 6, 7], SZ = [3.4, 3.6, 4.8, 3.6, 14.4];
var RD = ['Tend the eggs and heal injured ants (about one every 9 seconds each).', 'Carry food home through the tunnel. Eggs and upgrades all need it.', 'Guard the tunnel mouth and fight invaders. 3 damage per second.', 'Explore side tunnels for food caches and warn you about waves.', 'Hatched from a golden egg. Fights like 10 soldiers.'];
var soilP = null;
var ZM = [1, .9, .78, .68, .6], CL = [1, 1, 1, 2, 3], AB = { 1: '#b8341a', 4: '#e48cab', 5: '#5f9a2e', 6: '#2f86cc', 7: '#6b1d14', 8: '#e2a52e' };
var CE = ['Next: +15% healing speed, 6% faster hatching.', 'Next: +20% food per leaf.', 'Next: +25% damage.', 'Next: bigger food finds.', 'Next: +25% damage.', 'Next: lays 7% sooner and +20 health.', 'Next: +25% digging speed.'];
var ph1 = 0, bph = [], lastTr = 0;
var ROOMS = [{ n: 'Fungus Garden', b: 'colony eats 30% less food' }, { n: 'Nursery', b: 'eggs hatch 15% faster' }, { n: 'Barracks', b: 'soldiers deal 15% more damage' }, { n: 'Royal Court', b: 'the queen lays 10% sooner' }];
var DN = ['seed stash', 'crystal vein', 'fungus grove', 'fossil bed'], DI = ['@seed', '@crystal', '@fungus', '@relic'];
var carc = [];
var uz = 1, camX = 0, SK = 110, ptrs = {}, pd0 = 0, uz0 = 1;
var MST = [['the queen heals 3x faster', 'healing is 50% faster'], ['10% of trips bring a triple haul', '20% of trips bring a triple haul'], ['soldiers hit 15% harder', 'soldiers hit 25% harder again'], ['discoveries give double', 'every discovery also gives 1 jelly'], ['super majors hit 25% harder', 'super majors hit 25% harder again'], ['golden eggs are 5x more likely', '25% of clutches are doubled'], ['carry an extra bit of dirt per trip', 'dig 30% faster again']];
var RT = [{ n: 'Frog', hp: 8, sp: 16, dmg: 5, s: 13 }, { n: 'Hunting spider', hp: 12, sp: 22, dmg: 8, s: 11 }, { n: 'Anteater', hp: 20, sp: 11, dmg: 12, s: 20 }, { n: 'Crow', hp: 16, sp: 30, dmg: 10, s: 12 }];
var HN = ['Watch posts', 'Stone wall', 'Thorn barricade', 'Dew pond', 'Royal spire'], HB = ['Soldiers watch the surface and guard the hill.', 'Raiders deal 12% less damage per level.', 'Soldiers hit raiders harder.', 'Dew gives +10% food from leaves.', 'Raid rewards are doubled.'], HF = [2500, 5000, 8000, 12000, 18000], HJ = [40, 90, 160, 260, 400];
var RAID = null, rsp = 0;
var seenTier = -1;
var jpc = [];
var exc = null, crewA = [], spoil = [], cavHeap = 0;
var IP = [], ii = 0, introWasDead = false;

var GOALS = [
    { t: 'Tap the queen to hurry an egg', h: 'Tap her on the Nest tab.', tab: 'nest', n: function () { return Math.min(3, S.queenTaps || 0) + ' / 3'; }, ok: function () { return (S.queenTaps || 0) >= 3; }, fd: 15, r: '+15 food' },
    { t: 'Hatch your first new ant', h: 'Eggs hatch by themselves. Keep tapping to speed them up.', tab: 'nest', ok: function () { return S.totalHatched >= 1; }, fd: 20, r: '+20 food' },
    { t: 'Workers discover a food spot', h: 'Your workers are digging. Watch the Tunnel tab.', tab: 'tun', ok: function () { return S.foodSpots.length >= 1; }, fd: 25, r: '+25 food' },
    { t: 'A forager brings food home', h: 'Foragers carry food along the tunnel to the queen.', tab: 'tun', ok: function () { return (S.deliveries || 0) >= 1; }, jl: 3, fd: 20, r: '+3 royal jelly' },
    { t: 'Reach 10 ants', h: 'Every egg costs a little food. Foragers keep it coming.', tab: 'nest', n: function () { return Math.min(10, popn()) + ' / 10'; }, ok: function () { return popn() >= 10; }, fd: 40, r: '+40 food' },
    { t: 'Dig your first nest upgrade', h: 'Open the Colony tab and tap Dig a Burrow.', tab: 'col', ok: function () { return S.tier >= 1; }, jl: 3, r: '+3 royal jelly' },
    { t: 'Level up an ant with royal jelly', h: 'Colony tab, Your ants and queen. Tap a card to spend jelly.', tab: 'col', ok: function () { return S.queenLevel > 0 || S.classLevel.some(function (l) { return l > 0; }); }, fd: 40, r: '+40 food' },
    { t: 'Reach 15 ants', h: 'Keep the eggs coming.', tab: 'nest', n: function () { return Math.min(15, popn()) + ' / 15'; }, ok: function () { return popn() >= 15; }, fd: 40, r: '+40 food' },
    { t: 'Bring home 15 loads of food', h: 'More foragers means more food.', tab: 'tun', n: function () { return Math.min(15, S.deliveries || 0) + ' / 15'; }, ok: function () { return (S.deliveries || 0) >= 15; }, jl: 2, r: '+2 royal jelly' },
    { t: 'Reach 20 ants', h: 'More ants means more foragers and more food.', tab: 'nest', n: function () { return Math.min(20, popn()) + ' / 20'; }, ok: function () { return popn() >= 20; }, jl: 1, fd: 40, r: '+1 jelly, +40 food' },
    { t: 'Reach 25 ants', h: 'Bigger nests hold more ants.', tab: 'nest', n: function () { return Math.min(25, popn()) + ' / 25'; }, ok: function () { return popn() >= 25; }, fd: 60, r: '+60 food' },
    { t: 'Bring home 40 loads of food', h: 'Send more foragers out by hatching more eggs.', tab: 'tun', n: function () { return Math.min(40, S.deliveries || 0) + ' / 40'; }, ok: function () { return (S.deliveries || 0) >= 40; }, fd: 80, r: '+80 food' },
    { t: 'Dig your first side tunnel', h: 'Workers dig it by themselves. It leads to chambers and finds.', tab: 'tun', ok: function () { return S.sideTunnels > 0 && S.sideDug[0] >= 1; }, jl: 2, r: '+2 royal jelly' },
    { t: 'Reach 30 ants', h: 'Your nest fits 40. Keep the eggs coming.', tab: 'nest', n: function () { return Math.min(30, popn()) + ' / 30'; }, ok: function () { return popn() >= 30; }, jl: 1, fd: 60, r: '+1 jelly, +60 food' },
    { t: 'Dig the Colony nest stage', h: 'Colony tab, tap Dig a Colony. It needs 35 ants and 250 food.', tab: 'col', ok: function () { return S.tier >= 2; }, jl: 4, r: '+4 royal jelly' },
    { t: 'Reach 40 ants', h: 'The tunnel waits just under the grass until the colony has 40 ants.', tab: 'nest', n: function () { return Math.min(40, popn()) + ' / 40'; }, ok: function () { return popn() >= 40; }, jl: 2, fd: 80, r: '+2 jelly, +80 food' },
    { t: 'Break through to the surface', h: 'Your tunnel is nearly at the grass. Invaders come next.', tab: 'tun', ok: function () { return S.dug >= 1; }, jl: 5, r: '+5 royal jelly' },
    { t: 'Beat your first invader wave', h: 'Soldiers fight at the tunnel mouth. Keep them healthy.', tab: 'tun', ok: function () { return S.wave >= 1; }, jl: 4, r: '+4 royal jelly' },
    { t: 'Reach 45 ants', h: 'Almost a full colony.', tab: 'nest', n: function () { return Math.min(45, popn()) + ' / 45'; }, ok: function () { return popn() >= 45; }, fd: 90, r: '+90 food' },
    { t: 'Reach 50 ants', h: 'Your colony is growing up.', tab: 'nest', n: function () { return Math.min(50, popn()) + ' / 50'; }, ok: function () { return popn() >= 50; }, jl: 5, fd: 100, r: '+5 jelly, +100 food' }
];
var layoutV = 0, followIx = -1, lastFd = 0, sel = null, selFollow = false, tdn = null, gAcc = 0, worm = null;
var antLbl;

// ant energy: it drains while an ant works
var NAMES = ['Dave', 'Bella', 'Hugo', 'Maisie', 'Stan', 'Ruby', 'Otis', 'Pip', 'Nell', 'Gus', 'Mabel', 'Fred', 'Daisy', 'Walt', 'Ivy', 'Barney', 'Poppy', 'Clive', 'Elsie', 'Rex', 'Tilly', 'Alfie', 'Nora', 'Bert', 'Hattie', 'Monty', 'Edie', 'Ned', 'Wren', 'Duke', 'Cora', 'Sid', 'Flo', 'Arlo', 'Dot', 'Mo', 'Pearl', 'Ziggy', 'Hazel', 'Colin', 'Queenie', 'Ralph', 'Mina', 'Tom', 'Olive', 'Jasper', 'Peggy', 'Ozzy', 'Lottie', 'Boris'];
var ROLES = ['Nest nurse', 'Food gatherer', 'Tunnel guard', 'Explorer', 'Elite defender', 'Tunnel digger'];
