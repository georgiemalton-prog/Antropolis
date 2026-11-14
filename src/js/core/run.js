/* core/run.js
   Starting a colony, Royal Flights, generations, colony types and legacy.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

function newRunBase(lp) { P.legacy += lp; P.legacyEver += lp; S = fresh(); foes = []; MF = null; clearOldRun(); wvi = { n: 0 }; nf = 0; dead = false; $('over').classList.remove('on'); marchers.length = 0; sync(); save(); }

function headStart() {
    var gn = P.gen || 0;
    if (gn < 1)
        return;
    var t = gn >= 2 ? 2 : 1;
    S.tier = t;
    // dug to just under the grass, as in any colony: it breaks through (and invaders start coming) at the Colony
    // stage with 40 ants. Dug right through, a new colony met waves at once and lost ants as fast as it laid them
    S.dug = .8;
    S.food = Math.min(foodCap(), 60 + 140 * gn);
    S.nurses += 2 + 2 * gn;
    S.foragers += 4 + 4 * gn;
    S.soldiers += 2 * gn;
    // diggers too, and the first side tunnel comes dug like the main tunnel: with the tunnel already open the
    // workers live up on the surface, so a new colony waited minutes on the "Dig your first side tunnel" goal
    S.workers += 2 + gn;
    S.sideTunnels = 1;
    S.sideDug = [1];
    // food spots are found while the main tunnel is being dug, and this one starts dug: put them in now (as loading does)
    [.25, .5, .75].forEach(function (f) { addSpotAt(f, true); });
    S.jelly += Math.min(12, 3 * gn);
}

function headText(gn) {
    var t = gn >= 2 ? 'Colony' : 'Burrow';
    return 'Starts as a ' + t + ' with the tunnel dug almost to the surface, ' + (2 + 2 * gn + 4 + 4 * gn + 2 * gn + 2 + gn) + ' ants, ' + Math.min(12, 3 * gn) + ' jelly and a store of food.';
}

function newRunFound(lp) { newRunBase(lp); S.nurses += 3 * pk('found'); headStart(); S.jelly += 2 * pk('heir'); sync(); }

function newRun(lp) { newRunFound(lp); sizeT(); nbt = 25; }

function royal() {
    var g = gain();
    if (g < 1)
        return;
    var hatched = S.totalHatched, oldG = P.gen || 0;
    P.gen = oldG + 1;
    newRun(g);
    save();
    toast('A new queen founds a colony. Legacy +' + g + '.');
    SFX.win();
    flash = 1;
    shake = .5;
    genShow(g, hatched);
}

function genShow(g, hatched) {
    var n = genNum(), lines = [];
    lines.push('<b>+' + g + ' legacy</b> from ' + fmt(hatched) + ' ants hatched. You now have ' + P.legacy + ' to spend.');
    lines.push('Head start: ' + headText(P.gen));
    lines.push('Future flights earn ' + (10 * P.gen) + '% more legacy plus a bonus of ' + (4 + 2 * P.gen) + '.');
    LG.forEach(function (l) { if (l.gen === P.gen)
        lines.push('<b>Unlocked: ' + l.n + '.</b> ' + l.d); });
    if (P.gen >= 1 && P.gen <= 4)
        lines.push('<b>New ground: the ' + DLAY[P.gen - 1].n + ' layer.</b> Your colonies can now dig down to it once they are ' + (P.gen <= 2 ? 'an ' + T[3].n : 'a ' + T[4].n) + '.');
    lines.push('The Hall of Queens in your nest now holds ' + Math.min(P.gen, 8) + ' statue' + (P.gen > 1 ? 's' : '') + '.');
    $('gent').textContent = 'Generation ' + genName(n);
    $('genp').innerHTML = '<p class="mute" style="margin:0 0 6px">The old queen is honoured. A new queen takes the throne.</p>' + lines.map(function (l) { return '<p style="margin:5px 0">' + l + '</p>'; }).join('');
    biomePick();
    $('gen').classList.add('on');
}

function biomePick() {
    var el = document.createElement('div');
    el.innerHTML = '<p style="margin:10px 0 4px"><b>Choose your new colony</b></p>' + BIOMES.map(function (b, i) {
        var ok = (P.gen || 0) >= b.gen || owns('map' + i);
        return '<button class="card" data-bi="' + i + '" style="margin:4px 0;' + (ok ? '' : 'opacity:.45') + '"' + (ok ? '' : ' disabled') + '><span><b>' + b.n + '</b><span class="mute">' + (ok ? b.d : (b.gen > 50 ? 'Buy this map in the Store.' : 'Unlocks after ' + b.gen + ' royal flight' + (b.gen > 1 ? 's' : '') + ', or buy it in the Store.')) + '</span></span></button>';
    }).join('');
    function mark() {
        [].forEach.call(el.querySelectorAll('button'), function (b) { b.style.outline = +b.getAttribute('data-bi') === (S.biome || 0) ? '2px solid #ffd23f' : 'none'; });
    }
    [].forEach.call(el.querySelectorAll('button'), function (b) {
        b.onclick = function () {
            S.biome = +b.getAttribute('data-bi');
            save();
            mark();
            SFX.buy && SFX.buy();
        };
    });
    mark();
    $('genp').appendChild(el);
}

function gain() { return S.tier >= 3 ? Math.floor(Math.sqrt(S.totalHatched / 40) * (1 + .1 * (P.gen || 0))) + 4 + 2 * (P.gen || 0) : 0; }

// leftovers from the old colony (raids, crickets, dig crews) walk tunnels the new colony hasn't dug, so they go
function clearOldRun() {
    ALM = null;
    MSGR.length = 0;
    SCENT.length = 0;
    RV = null;
    XR = null;
    QG = { on: 0, t: 0, warned: 0, n: 0 };
    BT = null;
    rvT = TUNING.rivals.firstAt;
    ffT = TUNING.start.firstFoesDelay;
    trm.length = 0;
    trm.res = 0;
    trm.ms = null;
    trm.fT = 0;
    trm.chT = 0;
    trmT = 120;
    cric.length = 0;
    cric.done = 0;
    cricT = 300;
    crewA.length = 0;
}

// colony types, chosen when a Royal Flight founds a new colony
var BIOMES = [
    { n: 'Meadow', d: 'Balanced. The classic colony.', gen: 0 },
    { n: 'Dunes', d: 'Eggs hatch 12% faster. Food is 15% scarcer.', gen: 1, cr: 6, eg: .88, fd: .85, tint: 'rgba(222,150,50,.2)', top: '#6a4a24', bot: '#3a2812', sky: ['#e39b4f', '#f2cf94', '#f6e6c0'], grass: '#b79a4c', hill: '#a8793f' },
    { n: 'Jungle', d: 'Food is 20% richer. Invaders are 20% stronger.', gen: 2, cr: 8, en: 1.2, fd: 1.2, tint: 'rgba(30,130,60,.2)', top: '#2f3b24', bot: '#18200f', sky: ['#3f8f8a', '#8bc9a5', '#c7e6b8'], grass: '#2f7a2f', hill: '#4a6a34' },
    { n: 'Frostlands', d: 'Royal jelly is 25% richer. Eggs hatch 12% slower.', gen: 3, cr: 10, eg: 1.12, jl: 1.25, tint: 'rgba(150,200,255,.22)', top: '#4a5560', bot: '#222a33', sky: ['#7da6cc', '#bcd6ea', '#eaf3f8'], grass: '#cfe3e8', hill: '#8a96a2' },
    { n: 'Autumn Grove', d: 'Food is 10% richer. Eggs hatch 6% faster.', gen: 99, cr: 12, eg: .94, fd: 1.1, tint: 'rgba(200,90,30,.18)', top: '#4a2c1a', bot: '#25140c', sky: ['#c8683a', '#f0b074', '#f7dcae'], grass: '#b5622a', hill: '#8a4a28' }
];
function bio() { return BIOMES[S.biome || 0] || BIOMES[0]; }
