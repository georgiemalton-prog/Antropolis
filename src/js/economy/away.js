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
var earnAcc = 0, digPrev = null;
function awayMax() { return (larderOn() ? TUNING.larder.awayHours : TUNING.larder.awayHoursOff) * 3600; }

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

// finished ant-farm and deep tunnels, for the story
function farDone() { var n = 0, k; for (k in (S.fdg || {})) if (S.fdg[k] >= 1) n++; for (k in (S.ddg || {})) if (S.ddg[k] >= 1) n++; return n; }
function catchUp(secs) {
    if (dead || !(secs >= 60) || (S.totalHatched < 1 && S.dug < .02))
        return null;
    var capped = secs > awayMax();
    secs = Math.min(secs, awayMax());
    var rate = S.foodRate != null ? S.foodRate : Math.max(0, S.foragers) * leaf() / 70, r = { secs: secs, capped: capped, f0: S.food, got: 0, born: [0, 0, 0, 0, 0, 0, 0], gold: 0, dg0: S.dug, healed: 0, full: false, hungry: false }, t = 0, lay = Math.max(0, S.layTimer || 0);
    var fin0 = farDone();
    while (t < secs) {
        var dt = Math.min(30, secs - t);
        t += dt;
        var before = S.food, rf = S.foragersAtRate > 0 ? Math.min(3, S.foragers / S.foragersAtRate) : 1;
        var add = rate * rf * dt;
        S.food = Math.min(foodCap(), S.food + add);
        r.got += S.food - before;
        // with the Larder, what does not fit in a full store is put by as a reserve (S.lres) for later
        if (larderOn() && add > S.food - before) {
            var put = Math.min(add - (S.food - before), larderRoom());
            S.lres = (S.lres || 0) + put;
            r.got += put;
            r.res = (r.res || 0) + put;
        }
        else if (add > S.food - before)
            r.lost = (r.lost || 0) + add - (S.food - before);
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
    r.tun = Math.max(0, farDone() - fin0);
    if (secs >= 1800)
        r.find = Math.floor(Math.random() * FINDS.length);
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

/* Welcome back as a story (build 97): what happened, told as a few moments with named ants, then one find
   your scouts made while you were gone and a choice of what to do with it (after 30 minutes or more away). */
var FINDS = [
    { t: 'a dead beetle near the tunnel mouth', o: [
        { n: 'Feast on it', d: '+25% of the food store', go: function () { S.food = Math.min(foodCap(), S.food + foodCap() * .25); } },
        { n: 'Leave it as bait', d: 'The next wave starts 30% weaker', go: function () { S.baitNext = .7; } }] },
    { t: 'a buried cache of seeds', o: [
        { n: 'Carry it home', d: '+15% of the food store', go: function () { S.food = Math.min(foodCap(), S.food + foodCap() * .15); } },
        { n: 'Feed it to the fungus', d: '+2 royal jelly', go: function () { gainJelly(2); } }] },
    { t: 'a drop of sweet honeydew on a grass stem', o: [
        { n: 'Share it with the nurses', d: 'Heals the queen fully and hurries the next egg', go: function () { S.queenHp = hpMax(); S.layTimer = 1; } },
        { n: 'Turn it into jelly', d: '+3 royal jelly', go: function () { gainJelly(3); } }] },
    { t: 'an empty snail shell by a root', o: [
        { n: 'Use it as a lookout', d: 'Scouts warn of the next wave sooner', go: function () { nf += 30000; } },
        { n: 'Grind it for the nursery', d: 'The next 3 eggs come quickly', go: function () { S.layTimer = 1; S.quickEggs = 3; } }] }
];
function awayName(i) { var n = (S.seed || 7) + i * 7919 + Math.floor((r0 || 0) * 3); return NAMES[Math.abs(n) % NAMES.length]; }
var r0 = 0;
function awayText(r) {
    var hrs = Math.floor(r.secs / 3600), mins = Math.round((r.secs % 3600) / 60), dur = hrs ? hrs + 'h ' + mins + 'm' : mins + ' minutes', total = 0, parts = [], st = [];
    r0 = r.secs;
    r.born.forEach(function (n, c) { if (n) {
        total += n;
        parts.push(n + ' ' + CN[c].toLowerCase() + (n > 1 ? 's' : ''));
    } });
    function beat(c, h) { st.push('<li><i style="background:' + c + '"></i><p>' + h + '</p></li>'); }
    beat('#7ee08a', r.got < 1 ? 'The foragers kept the tunnels busy but found little to bring home. More foragers would help.' : '<b>' + awayName(1) + '</b> led the foragers out again and again. They brought home <b>' + fmt(Math.round(r.got)) + ' food</b>.' + (r.res >= 1 ? ' The store filled up, so <b>' + fmt(Math.round(r.res)) + '</b> went into the Larder.' : r.lost >= 1 ? ' The store filled up and ' + fmt(Math.round(r.lost)) + ' was left on the surface.' : ''));
    if (total)
        beat('#ffd35a', 'The queen laid and the nurses raised <b>' + total + ' new ant' + (total > 1 ? 's' : '') + '</b>: ' + parts.join(', ') + '.' + (r.gold ? ' A golden egg hatched a <b>Super Major</b>! +' + 10 * r.gold + ' jelly.' : ''));
    if (r.dg0 < 1 && S.dug >= 1)
        beat('#f5b23c', 'With a last push, <b>' + awayName(2) + '</b> broke through to the <b>surface</b>. Invaders will come soon.');
    else if (S.dug > r.dg0 + .005 || r.tun > 0)
        beat('#f5b23c', 'The diggers worked on' + (S.dug > r.dg0 + .005 ? ', pushing the tunnel <b>' + Math.round((S.dug - r.dg0) * 100) + '%</b> further' : '') + (r.tun > 0 ? (S.dug > r.dg0 + .005 ? ' and finishing ' : ' and finished ') + '<b>' + r.tun + ' new tunnel' + (r.tun > 1 ? 's' : '') + '</b>' : '') + '.');
    if (r.healed)
        beat('#ff9db0', 'Nurses tended <b>' + r.healed + ' hurt ant' + (r.healed > 1 ? 's' : '') + '</b> until they were well again.');
    if (S.dug >= 1)
        beat('#cfe9d8', '<b>' + awayName(3) + '</b> the soldier stood guard at the tunnel mouth all the while.');
    diaryLines().filter(function (l) { return l.indexOf('stood guard') < 0; }).slice(0, 1).forEach(function (l) { beat('#93bfa4', '<i>' + l + '</i>'); });
    var s = '<h3>While you were away</h3><p class="mute" style="margin-top:-4px">' + dur + (r.capped ? ' (your ants work for up to ' + awayMax() / 3600 + ' hours)' : '') + '</p><ul class="story">' + st.join('') + '</ul>';
    if (r.rest)
        s += '<p style="border-left:3px solid var(--accent2);padding-left:9px"><b>Rested colony!</b> Your foragers carry <b>25% more food</b> for the next ' + r.rest + ' minutes.</p>';
    if (r.full)
        s += '<p class="mute">The nest filled up. Dig a bigger nest to keep growing.</p>';
    else if (r.hungry && r.got >= 1)
        s += '<p class="mute">The colony ran short of food for eggs. More foragers would help.</p>';
    if (r.find != null) {
        var F = FINDS[r.find];
        s += '<div class="afind" id="afind"><b>Your scouts found ' + F.t + '.</b><span>What should the colony do?</span>' + F.o.map(function (o, i) { return '<button class="card" data-i="' + i + '"><strong>' + o.n + '</strong><em>' + o.d + '</em></button>'; }).join('') + '</div>';
    }
    return s;
}
function awayFind(r) {
    var box = $('afind');
    if (!box || r.find == null)
        return;
    [].forEach.call(box.querySelectorAll('button'), function (b) {
        b.onclick = function () {
            var o = FINDS[r.find].o[+b.getAttribute('data-i')];
            o.go();
            r.find = null;
            box.innerHTML = '<b>' + o.n + '.</b><span>' + o.d + '. Done!</span>';
            SFX.claim && SFX.claim();
            sync();
            save();
        };
    });
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
    awayFind(r);
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
