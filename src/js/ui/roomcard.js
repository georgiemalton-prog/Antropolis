/* ui/roomcard.js
   Tap a chamber in the Nest or Tunnel view to upgrade it right there: a small card with its level,
   bonus and cost. Chambers you can afford to upgrade show a gold arrow by their name (render/chambers.js).
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

// where chamber i sits in the world (the same spot drawRooms uses)
function roomXY(i) { var q = PT[CI[i]]; return q ? { x: q[0] + (i % 2 ? -34 : 34), y: q[1] } : null; }

function roomCanUp(i) { var c = roomCost(i); return S.tier > i && rl(i) < 4 && S.food >= c.f && S.jelly >= c.j; }

// the chamber under a tap at world point (wx, wy), or -1
function roomAt(wx, wy) {
    var best = -1, bd = 30, i, p;
    for (i = 0; i < (TUNING.tunnelRooms ? S.tier : 0) && i < 4; i++) {
        p = roomXY(i);
        if (!p)
            continue;
        var d = Math.hypot(p.x - wx, p.y - wy);
        if (d < bd) { bd = d; best = i; }
    }
    return best;
}

function roomCard(i) {
    var el = $('roomcard');
    if (!el) {
        el = document.createElement('div');
        el.className = 'intro';
        el.id = 'roomcard';
        el.setAttribute('role', 'dialog');
        el.setAttribute('aria-modal', 'true');
        el.innerHTML = '<div class="icard"><div id="rcbody"></div><div class="irow"><button class="card" id="rcclose">Close</button><button class="card dig" id="rcup">Upgrade</button></div></div>';
        document.body.appendChild(el);
        $('rcclose').onclick = function () { el.classList.remove('on'); };
        el.addEventListener('click', function (e) { if (e.target === el) el.classList.remove('on'); });
    }
    function fill() {
        var lv = rl(i), c = roomCost(i), max = lv >= 4, bt = ROOMT[i].replace('%s', Math.round(ROOMB[i] * (1 + .2 * lv) * 100) + '%'),
            nx = max ? '' : ROOMT[i].replace('%s', Math.round(ROOMB[i] * (1 + .2 * (lv + 1)) * 100) + '%');
        $('rcbody').innerHTML = '<h3>' + ico(RICO[i]) + ROOMS[i].n + '</h3><p>Level ' + (lv + 1) + ' of 5. Right now ' + bt + '.</p>' +
            (max ? '<p class="mute">This chamber is fully upgraded.</p>' : '<p>Next level: ' + nx + '.</p><p class="mute">Costs ' + fmt(c.f) + ' food and ' + c.j + ' royal jelly. You have ' + fmt(S.food) + ' food and ' + S.jelly + ' jelly.</p>');
        $('rcup').style.display = max ? 'none' : '';
        $('rcup').disabled = !roomCanUp(i);
    }
    $('rcup').onclick = function () { upRoom(i); fill(); };
    fill();
    el.classList.add('on');
}

/* ---- Building cards: press and hold a building in the Nest tab ----
   One card per building with everything you can do to it: its chamber's level (the old Nest chambers list) and
   its building upgrades (the old Buildings list), each with its own button. The queen opens the Royal Court. */
var BFEAT = {
    fungus: { r: 0, b: ['farm'] },
    nursery: { r: 1, b: ['nest', 'hatch'] },
    barracks: { r: 2, b: ['rax'] },
    store: { b: ['store'] },
    archive: { b: ['archive'] },
    tower: { b: ['tower'] },
    infirmary: { n: 'Infirmary' },
    queen: { r: 3, n: 'The Queen\u2019s bed' }
};
// the building card that holds the upgrade behind a Next-up key (b3 = building 3, r1 = chamber 1)
function bfeatFor(k) {
    var f;
    if (k && k[0] === 'r' && k !== 'rch')
        return ['fungus', 'nursery', 'barracks', 'queen'][+k.slice(1)] || null;
    if (k && k[0] === 'b' && BDEF[+k.slice(1)])
        for (f in BFEAT)
            if ((BFEAT[f].b || []).indexOf(BDEF[+k.slice(1)].id) >= 0)
                return f;
    return null;
}
function bcRoom(i) {
    var lv = rl(i), c = roomCost(i), btn;
    if (S.tier <= i)
        return '<div class="bcrow off"><b>' + ico(RICO[i]) + ROOMS[i].n + '</b><span class="mute">Opens when your nest becomes a ' + T[i + 1].n + '. Then ' + ROOMS[i].b + '.</span></div>';
    var bt = ROOMT[i].replace('%s', Math.round(ROOMB[i] * (1 + .2 * lv) * 100) + '%');
    if (lv >= 4)
        return '<div class="bcrow"><b>' + ico(RICO[i]) + ROOMS[i].n + ' 5/5</b><span class="mute">' + bt + '. Fully upgraded.</span></div>';
    btn = '<button class="card dig" ' + (roomCanUp(i) ? '' : 'disabled ') + 'onclick="upRoom(' + i + ');bcFill()">Upgrade<span class="mute">' + fmt(c.f) + ' food, ' + c.j + ' jelly</span></button>';
    return '<div class="bcrow"><b>' + ico(RICO[i]) + ROOMS[i].n + ' ' + (lv + 1) + '/5</b><span class="mute">Now ' + bt + '. Next level: ' + ROOMT[i].replace('%s', Math.round(ROOMB[i] * (1 + .2 * (lv + 1)) * 100) + '%') + '.</span>' + btn + '</div>';
}
function bcBuild(id) {
    var i = bIdx(id), b = BDEF[i], lv = S.bld[id], pj = S.proj;
    if (S.tier < b.t)
        return '<div class="bcrow off"><b>' + ico(b.id) + b.n + '</b><span class="mute">Unlocks at the ' + T[b.t].n + ' stage. ' + b.d + '.</span></div>';
    var head = '<div class="bcrow"><b>' + ico(b.id) + b.n + ' ' + lv + '/4</b><span class="mute">' + b.d + '.</span>';
    if (pj && pj.k === id)
        return head + '<div class="bar"><i style="width:' + Math.round((1 - pj.left / pj.tot) * 100) + '%;background:var(--accent)"></i></div><span class="mute">Workers are building it now.</span></div>';
    if (lv >= 4)
        return head + '<span class="mute">Fully built.</span></div>';
    return head + '<button class="card dig" ' + (bCanUp(i) ? '' : 'disabled ') + 'onclick="startBuild(' + i + ');bcFill()">' + (lv ? 'Upgrade' : 'Build') + '<span class="mute">' + fmt(bCost(i)) + ' food' + (pj && pj.k !== id ? ' (workers are busy)' : '') + '</span></button></div>';
}
var BC = { id: null, h: '', iv: 0 };
function bcFill() {
    var id = BC.id, F = BFEAT[id], nf = null, h;
    if (!F)
        return;
    NSF.forEach(function (f) { if (f.id === id) nf = f; });
    h = '<h3>' + (F.n || (nf ? nf.n : id)) + '</h3>';
    if (id === 'infirmary')
        h += '<p>Nurses heal injured ants here. ' + (injN() ? injN() + ' injured ' + (injN() > 1 ? 'ants are' : 'ant is') + ' resting now.' : 'Nobody is hurt right now.') + '</p>';
    if (id === 'queen')
        h += '<p>Tap the queen to hurry her next egg.</p>';
    if (F.r != null)
        h += bcRoom(F.r);
    (F.b || []).forEach(function (k) { h += bcBuild(k); });
    h += '<p class="mute" style="margin:8px 0 0">You have ' + fmt(Math.floor(S.food)) + ' food and ' + S.jelly + ' royal jelly.</p>';
    if (h !== BC.h) {
        BC.h = h;
        $('bcbody').innerHTML = h;
    }
}
function bcard(id) {
    var el = $('bcard');
    if (!BFEAT[id])
        return;
    if (!el) {
        el = document.createElement('div');
        el.className = 'intro';
        el.id = 'bcard';
        el.setAttribute('role', 'dialog');
        el.setAttribute('aria-modal', 'true');
        el.innerHTML = '<div class="icard"><div id="bcbody"></div><div class="irow"><button class="card" id="bcclose">Close</button></div></div>';
        document.body.appendChild(el);
        var close = function () { el.classList.remove('on'); clearInterval(BC.iv); BC.id = null; };
        $('bcclose').onclick = close;
        el.addEventListener('click', function (e) { if (e.target === el) close(); });
    }
    BC.id = id;
    BC.h = '';
    bcFill();
    clearInterval(BC.iv);
    BC.iv = setInterval(bcFill, 500);
    el.classList.add('on');
}
