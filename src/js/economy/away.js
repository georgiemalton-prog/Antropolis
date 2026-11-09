/* economy/away.js
   Offline progress, the welcome-back screen and the rested-colony boost.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

// Rested colony: after a long break the ants come back keen, and foragers carry 25% more food for a few minutes.
// Saved as S.restT (seconds left); old saves without it simply have no boost.
var REST_MUL = 1.25;
function restMul() { return S.restT > 0 ? REST_MUL : 1; }
function restMins(secs) { return secs >= 3600 ? Math.round(Math.min(15, Math.max(5, secs / 7200 * 5))) : 0; }
function restTick(dt) {
    if (!(S.restT > 0))
        return;
    S.restT = Math.max(0, S.restT - dt);
    if (S.restT === 0)
        toast('The rested-colony boost has worn off. Your foragers are back to their usual pace.');
}
function restTxt() { return S.restT > 0 ? 'Rested colony: foragers carry 25% more food (' + Math.floor(S.restT / 60) + ':' + ('0' + Math.floor(S.restT % 60)).slice(-2) + ' left). ' : ''; }

// a couple of little moments from the colony's day, shown on the welcome-back screen
function diaryLines() {
    var L = ['The queen took a slow walk around her chamber and looked over every egg.', 'Nurses groomed the newest ants until they shone.', 'Two foragers tugged at the same seed for a whole minute. The bigger one won.', 'A worker pushed a pebble out of the tunnel. It took five tries.'], H = S.heroes || [], o = [], i, j;
    if (S.sideTunnels > 0)
        L.push('Your scouts walked every side tunnel and came home dusty.');
    if (S.dug >= 1)
        L.push('A soldier stood guard at the tunnel mouth all night without moving once.', 'Foragers found a fallen leaf on the surface and cut it into a hundred pieces.');
    if (S.deep > 0)
        L.push('Ants in the deep layers dug a new little chamber in the ' + DLAY[Math.min(3, S.deep - 1)].n.toLowerCase() + '.');
    if (H.length) {
        var h = H[Math.floor(Math.random() * H.length)];
        if (h && h.n)
            L.push('<b>' + h.n + '</b> led a patrol through the tunnels and came back proud.');
    }
    for (i = 0; i < 2 && L.length; i++) {
        j = Math.floor(Math.random() * L.length);
        o.push(L.splice(j, 1)[0]);
    }
    return o;
}

// ---- offline progress (the colony keeps working while you are away) ----
var earnAcc = 0, digPrev = null, AWAY_MAX = 8 * 3600;
function awayMax() { return (larderOn() ? 10 : 8) * 3600; }

function trackRates(el) {
    if (dead || el <= 0 || el > 5) {
        earnAcc = 0;
        digPrev = S.dug;
        return;
    }
    var r = earnAcc / el;
    earnAcc = 0;
    S.foodRate = S.foodRate == null ? r : S.foodRate * .985 + r * .015;
    S.foragersAtRate = S.foragersAtRate == null ? S.foragers : S.foragersAtRate * .985 + S.foragers * .015;
    if (digPrev != null && S.dug < digCap() && S.dug > digPrev) {
        var d = (S.dug - digPrev) / el;
        S.digRate = S.digRate == null ? d : S.digRate * .97 + d * .03;
    }
    digPrev = S.dug;
}

function catchUp(secs) {
    if (dead || !(secs >= 60) || (S.totalHatched < 1 && S.dug < .02))
        return null;
    var capped = secs > awayMax();
    secs = Math.min(secs, awayMax());
    var rate = S.foodRate != null ? S.foodRate : Math.max(0, S.foragers) * leaf() / 70, r = { secs: secs, capped: capped, f0: S.food, got: 0, born: [0, 0, 0, 0, 0, 0, 0], gold: 0, dg0: S.dug, healed: 0, full: false, hungry: false }, t = 0, lay = Math.max(0, S.layTimer || 0);
    while (t < secs) {
        var dt = Math.min(30, secs - t);
        t += dt;
        var before = S.food, rf = S.foragersAtRate > 0 ? Math.min(3, S.foragers / S.foragersAtRate) : 1;
        S.food = Math.min(foodCap(), S.food + rate * rf * dt);
        r.got += S.food - before;
        S.food = Math.max(0, S.food - upkeepRate(popn()) * dt);
        lay -= dt;
        while (lay <= 0) {
            var room = capN() - popn() - S.eggs.length, n = Math.min(clutch(), room, Math.floor(S.food / eggCost()));
            if (room <= 0)
                r.full = true;
            else if (n <= 0)
                r.hungry = true;
            for (var i = 0; i < n; i++) {
                var c = rollClass();
                addc(c, 1);
                S.totalHatched++;
                r.born[c]++;
                if (c === 4)
                    r.gold++;
            }
            if (n > 0)
                S.food -= n * eggCost();
            lay += layGap();
        }
        if (S.dug < digCap() && S.workers > 0 && S.digRate)
            S.dug = Math.min(digCap(), S.dug + S.digRate * dt);
        farDigTick(dt);
    }
    S.layTimer = Math.min(layGap(), Math.max(1, lay));
    S.injured.forEach(function (n) { r.healed += n; });
    S.injured = S.injured.map(function () { return 0; });
    marchers.forEach(function (m) { if (m.inj)
        unInj(m); });
    S.queenHp = hpMax();
    S.foodSpots.forEach(function (sp) { sp.stock = sp.cap; });
    if (r.gold)
        gainJelly(10 * r.gold);
    if (r.dg0 < 1 && S.dug >= 1)
        breakthrough();
    r.rest = restMins(r.secs);
    if (r.rest)
        S.restT = Math.max(S.restT || 0, r.rest * 60);
    S.savedAt = Date.now();
    sync();
    ui();
    save();
    return r;
}

function awayText(r) {
    var hrs = Math.floor(r.secs / 3600), mins = Math.round((r.secs % 3600) / 60), dur = hrs ? hrs + 'h ' + mins + 'm' : mins + ' minutes', total = 0, parts = [];
    r.born.forEach(function (n, c) { if (n) {
        total += n;
        parts.push(n + ' ' + CN[c].toLowerCase() + (n > 1 ? 's' : ''));
    } });
    var s = '<h3>While you were away</h3><p class="mute" style="margin-top:-4px">' + dur + (r.capped ? ' (your ants work for up to ' + awayMax() / 3600 + ' hours)' : '') + '</p>';
    s += '<p>Your foragers gathered <b>' + fmt(Math.round(r.got)) + ' food</b>.</p>';
    s += total ? '<p>The queen raised <b>' + total + ' new ant' + (total > 1 ? 's' : '') + '</b>: ' + parts.join(', ') + '.</p>' : '';
    if (r.gold)
        s += '<p>A golden egg hatched a <b>Super Major</b>! +' + 10 * r.gold + ' jelly.</p>';
    if (r.dg0 < 1 && S.dug >= 1)
        s += '<p>Your workers <b>broke through to the surface</b>. Invaders will come soon.</p>';
    else if (S.dug > r.dg0 + .005)
        s += '<p>Your workers dug the tunnel <b>' + Math.round((S.dug - r.dg0) * 100) + '%</b> further.</p>';
    if (r.healed)
        s += '<p>Nurses healed <b>' + r.healed + ' injured ant' + (r.healed > 1 ? 's' : '') + '</b>.</p>';
    s += '<p>The queen is rested and the food spots have grown back.</p>';
    if (r.rest)
        s += '<p style="border-left:3px solid var(--accent2);padding-left:9px"><b>Rested colony!</b> Your foragers carry <b>25% more food</b> for the next ' + r.rest + ' minutes.</p>';
    if (r.full)
        s += '<p class="mute">The nest filled up. Dig a bigger nest to keep growing.</p>';
    else if (r.hungry)
        s += '<p class="mute">The colony ran short of food for eggs. More foragers would help.</p>';
    var dl = diaryLines();
    if (dl.length)
        s += '<p class="mute" style="margin-bottom:4px"><b>From the colony diary</b></p>' + dl.map(function (l) { return '<p class="mute" style="margin:0 0 6px;font-style:italic">' + l + '</p>'; }).join('');
    return s;
}

function showAway(r) {
    var el = $('away');
    if (!el) {
        el = document.createElement('div');
        el.className = 'intro';
        el.id = 'away';
        el.setAttribute('role', 'dialog');
        el.setAttribute('aria-modal', 'true');
        el.innerHTML = '<div class="icard"><div id="awayt"></div><div class="irow"><button class="card dig" id="awaydbl" style="display:none">Watch an ad to double the food</button><button class="card dig" id="awayok">Back to the colony</button></div></div>';
        document.body.appendChild(el);
        $('awayok').onclick = function () { el.classList.remove('on'); if (el.gold)
            goldFanfare(); };
    }
    $('awayt').innerHTML = awayText(r);
    var db = $('awaydbl'), extraF = Math.min(Math.round(r.got || 0), Math.max(0, foodCap() - Math.round(S.food)));
    db.style.display = extraF >= 10 ? '' : 'none';
    db.disabled = false;
    db.textContent = P.adfree ? 'Double the food (+' + fmt(extraF) + ')' : 'Watch an ad to double the food (+' + fmt(extraF) + ')';
    db.onclick = function () {
        Ads.show('away', 'Double your earnings', 'Get the same amount of food again for the time you were away.', function () {
            S.food = Math.min(foodCap(), S.food + extraF);
            db.style.display = 'none';
            toast('Doubled! +' + fmt(extraF) + ' food.');
            SFX.win();
        });
    };
    el.gold = r.gold;
    el.classList.add('on');
    SFX.win();
}

function resumeFromAway() {
    if (!S.savedAt)
        return;
    try {
        var r = catchUp((Date.now() - S.savedAt) / 1000);
        if (r)
            showAway(r);
    }
    catch (e) { }
}
