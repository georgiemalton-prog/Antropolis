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
    for (i = 0; i < S.tier && i < 4; i++) {
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
