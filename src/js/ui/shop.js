/* ui/shop.js
   The jelly shop and the Store (crowns, skins, nest themes, boosts).
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

/* Shop: spend jelly on small boosts. */
var SDEF = [
    { id: 'lure', n: 'Golden beetle lure', d: 'Brings a golden beetle to the tunnels right now.', j: 2 },
    { id: 'recharge', n: 'Fresh orders', d: 'Rally and Sound the alarm are ready again.', j: 1 },
    { id: 'feast', n: 'Seed feast', d: 'A huge store of seeds: a quarter of your food cap.', j: 3 }
];
function shopBuy(id) {
    var it = SDEF.filter(function (x) { return x.id === id; })[0];
    if (!it || S.jelly < it.j)
        return;
    if (id === 'lure') {
        if (gold) {
            toast('A golden beetle is already out there.');
            return;
        }
        if (popn() < 8) {
            toast('The colony needs at least 8 ants first.');
            return;
        }
        goldNext = 0;
        gold = null;
        S.jelly -= it.j;
        goldTick(.1);
        if (!gold) {
            goldNext = 0;
            goldTick(.1);
        }
        toast('The beetle lure is out. Watch the Tunnel tab!');
    }
    else if (id === 'recharge') {
        if (rallyCd <= 0 && alarmCd <= 0) {
            toast('Both are ready already.');
            return;
        }
        S.jelly -= it.j;
        rallyCd = 0;
        alarmCd = 0;
        toast('Orders refreshed.');
    }
    else {
        S.jelly -= it.j;
        S.food = Math.min(foodCap(), S.food + Math.round(foodCap() * .25));
        toast('The seed feast fills the stores.');
    }
    SFX.buy();
    save();
    shopUi(true);
}
var shKey = '';
function shopUi(force) {
    var el = $('shop');
    if (!el)
        return;
    var key = S.jelly + ':' + (gold ? 1 : 0);
    if (!force && key === shKey)
        return;
    shKey = key;
    el.innerHTML = '<p class="mute" style="margin:0 0 6px">Spend royal jelly on small boosts.</p>' + SDEF.map(function (it) {
        return '<button class="card dig" ' + (S.jelly < it.j ? 'disabled ' : '') + 'onclick="shopBuy(\'' + it.id + '\')" style="margin:0 0 6px"><span><b>' + it.n + '</b><span class="mute">' + it.d + '</span></span><span class="r">' + it.j + ' jelly</span></button>';
    }).join('');
}

/* Store: jelly turns into crowns, crowns buy looks, maps and boosts. Crowns and purchases live in P so they survive royal flights. */
var CROWN_RATE = 10;
var SKIN_DEF = [
    { id: 'classic', n: 'Classic black', c: '#2b1509', cr: 0 },
    { id: 'ember', n: 'Ember', c: '#8c2f16', cr: 4 },
    { id: 'dusk', n: 'Dusk blue', c: '#27396b', cr: 5 },
    { id: 'moss', n: 'Moss green', c: '#35692c', cr: 5 },
    { id: 'gilt', n: 'Gilded', c: '#b98a1e', cr: 8 }
];
var SKM = {};
function skinCol() { return SKM[P.skin] || '#2b1509'; }
var THEME_DEF = [
    { id: 'meadow', n: 'Meadow soil', cr: 0 },
    { id: 'obsidian', n: 'Obsidian', cr: 5, top: '#2a2a33', bot: '#111117', tint: 'rgba(120,120,200,.12)' },
    { id: 'clay', n: 'Red clay', cr: 5, top: '#7a3d28', bot: '#401e12', tint: 'rgba(220,100,60,.15)' },
    { id: 'mossy', n: 'Mossy dark', cr: 5, top: '#2c4129', bot: '#14200f', tint: 'rgba(80,170,80,.14)' }
];
var THM = {};
var BOOST_DEF = [
    { id: 'pantry', n: 'Full pantry', d: 'Fills your food store to the top.', cr: 2 },
    { id: 'beetle', n: 'Golden beetle', d: 'Sends a golden beetle into the tunnels now.', cr: 1 }
];
function owns(k) { return !!(P.own && P.own[k]); }
function crownBuy(n) {
    var c = n * CROWN_RATE;
    if (S.jelly < c)
        return;
    S.jelly -= c;
    P.crowns = (P.crowns || 0) + n;
    SFX.buy();
    toast('+' + n + ' crown' + (n > 1 ? 's' : '') + '.');
    save();
    storeUi(true);
}
function storeBuy(kind, id) {
    var list = kind === 'skin' ? SKIN_DEF : kind === 'theme' ? THEME_DEF : kind === 'map' ? null : BOOST_DEF, it, key = kind + id;
    if (kind === 'map') {
        var b = BIOMES[+id];
        it = { cr: b.cr, n: b.n };
        key = 'map' + id;
    }
    else
        it = list.filter(function (x) { return x.id === id; })[0];
    if (!it)
        return;
    var have = it.cr === 0 || owns(key);
    if (kind === 'boost') {
        if (crowns0() < it.cr)
            return;
        if (id === 'beetle') {
            if (gold) {
                toast('A golden beetle is already out there.');
                return;
            }
            if (popn() < 8) {
                toast('The colony needs at least 8 ants first.');
                return;
            }
            goldNext = 0;
            gold = null;
            goldTick(.1);
            if (!gold) {
                goldNext = 0;
                goldTick(.1);
            }
            toast('A golden beetle is on its way. Watch the Tunnel tab!');
        }
        else {
            if (S.food >= foodCap() - 1) {
                toast('The pantry is already full.');
                return;
            }
            S.food = foodCap();
            toast('The pantry is full to the brim.');
        }
        P.crowns -= it.cr;
    }
    else if (have) {
        if (kind === 'skin')
            P.skin = id;
        else if (kind === 'theme')
            P.theme = id;
        else
            return;
        toast(it.n + ' equipped.');
    }
    else {
        if (crowns0() < it.cr)
            return;
        P.crowns -= it.cr;
        P.own = P.own || {};
        P.own[key] = 1;
        if (kind === 'skin')
            P.skin = id;
        else if (kind === 'theme')
            P.theme = id;
        toast(kind === 'map' ? it.n + ' unlocked. Pick it on your next royal flight.' : it.n + ' bought and equipped.');
    }
    SFX.buy();
    save();
    storeUi(true);
}
function crowns0() { return P.crowns || 0; }
var stKey = '';
function storeUi(force) {
    var el = $('store');
    if (!el)
        return;
    var key = [S.jelly, P.crowns, P.skin, P.theme, JSON.stringify(P.own), S.food > foodCap() - 1, !!gold].join('|');
    if (!force && key === stKey)
        return;
    stKey = key;
    var cr = crowns0();
    function card(kind, id, name, desc, price, state, extra) {
        var dis = state === 'on' || (state === 'own' && kind === 'map') || (state === 'buy' && cr < price);
        return '<button class="card dig" ' + (dis ? 'disabled ' : '') + 'onclick="storeBuy(\'' + kind + '\',\'' + id + '\')" style="margin:0 0 6px;' + (state === 'on' ? 'outline:2px solid #ffd23f' : '') + '"><span><b>' + (extra || '') + name + '</b><span class="mute">' + desc + '</span></span><span class="r">' + (state === 'on' ? 'Equipped' : state === 'own' ? (kind === 'map' ? 'Owned' : 'Equip') : price + ' crown' + (price > 1 ? 's' : '')) + '</span></button>';
    }
    function dot(c) { return '<i style="display:inline-block;width:12px;height:12px;border-radius:50%;background:' + c + ';margin-right:6px;vertical-align:-1px;border:1px solid rgba(255,255,255,.4)"></i>'; }
    var h = '<h2>Crowns</h2><div style="border:1px solid var(--line);border-radius:16px;padding:12px;margin:10px 0 6px;display:flex;justify-content:space-between;align-items:center;gap:8px"><span><b style="font-size:22px">' + cr + ' crown' + (cr === 1 ? '' : 's') + '</b><br><span class="mute">You have ' + fmt(S.jelly) + ' royal jelly.</span></span></div>';
    h += '<p class="mute" style="margin:0 0 6px">Crowns buy looks and maps. Turn royal jelly into crowns: ' + CROWN_RATE + ' jelly makes 1 crown.</p><div style="display:flex;gap:6px;margin-bottom:6px"><button class="card dig" ' + (S.jelly < CROWN_RATE ? 'disabled ' : '') + 'onclick="crownBuy(1)" style="margin:0;justify-content:center"><b>1 crown</b> <span class="r">' + CROWN_RATE + ' jelly</span></button><button class="card dig" ' + (S.jelly < CROWN_RATE * 5 ? 'disabled ' : '') + 'onclick="crownBuy(5)" style="margin:0;justify-content:center"><b>5 crowns</b> <span class="r">' + CROWN_RATE * 5 + ' jelly</span></button></div>';
    h += '<h2>Ant skins</h2>' + SKIN_DEF.map(function (k) {
        var own = k.cr === 0 || owns('skin' + k.id), on = (P.skin || 'classic') === k.id;
        return card('skin', k.id, k.n, 'Changes the colour of your ants.', k.cr, on ? 'on' : own ? 'own' : 'buy', dot(k.c));
    }).join('');
    h += '<h2>Maps</h2><p class="mute" style="margin:0 0 6px">Unlock a colony type early. You choose it when you take a royal flight.</p>' + BIOMES.map(function (b, i) {
        if (!b.cr)
            return '';
        var own = owns('map' + i) || (P.gen || 0) >= b.gen;
        return card('map', i, b.n, b.d, b.cr, own ? 'own' : 'buy');
    }).join('');
    h += '<h2>Nest themes</h2>' + THEME_DEF.map(function (k) {
        var own = k.cr === 0 || owns('theme' + k.id), on = (P.theme || 'meadow') === k.id;
        return card('theme', k.id, k.n, 'Changes the colour of the soil around your nest.', k.cr, on ? 'on' : own ? 'own' : 'buy', dot(k.top || '#4a3322'));
    }).join('');
    el.innerHTML = h;
}
