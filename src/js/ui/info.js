/* ui/info.js
   The ant info card: who an ant is, where it is and what it is doing.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

function antIdent(s) {
    var o = s.o;
    if (o.ident)
        return o.ident;
    if (s.t === 'f') {
        var h = 0, ki;
        for (ki = 0; ki < o.key.length; ki++)
            h = (h * 31 + o.key.charCodeAt(ki)) % 100003;
        return (o.ident = { name: NAMES[(h + S.seed % 97) % NAMES.length], id: 3000 + h % 6000, k: o.k, birth: (S.days || 0) * o.u * .9 });
    }
    if (o.hero != null && S.heroes && S.heroes[o.hero])
        return (o.ident = { name: S.heroes[o.hero].n + ' ' + S.heroes[o.hero].t, id: 900 + o.hero, k: o.k, birth: S.heroes[o.hero].bd || 0, hero: S.heroes[o.hero] });
    var k = s.t === 'a' ? 5 : o.k, list = s.t === 'a' ? crewA : marchers, ord = 0, tot = 0, i, d = S.days || 0;
    for (i = 0; i < list.length; i++) {
        if (s.t !== 'a' && list[i].k !== k)
            continue;
        if (list[i] === o)
            ord = tot;
        tot++;
    }
    o.ident = { name: NAMES[(ord * 7 + k * 13 + (S.seed % 97)) % NAMES.length], id: ord * 6 + k + 1, k: k, birth: d * ((ord + .5) / Math.max(1, tot)) * .9 };
    return o.ident;
}

function antWhere(o) {
    var x = o.wx, y = o.wy, i, p, q, best = 1e9, bn = '', dd;
    if (S.deep && y >= deepTop())
        return 'The ' + DLAY[Math.max(0, Math.min(S.deep - 1, Math.floor((y - deepTop()) / LH())))].n.toLowerCase() + ' layer';
    if (o.fa)
        return 'The far tunnels';
    if (y < 22)
        return 'On the surface';
    if (y > QY - 34)
        return y > QY + 40 ? 'The infirmary area' : 'The royal nest';
    for (i = 0; i < (TUNING.tunnelRooms ? S.tier : 0) && i < 4; i++) {
        var rp = PT[CI[i]];
        if (Math.hypot(rp[0] + (i % 2 ? -34 : 34) - x, rp[1] - y) < 30)
            return ROOMS[i].n;
    }
    for (p = 0; p <= 1.001; p += .04) {
        q = at(p);
        dd = Math.hypot(q.x - x, q.y - y);
        if (dd < best) {
            best = dd;
            bn = (y < WH * .3 ? 'Upper' : y < WH * .62 ? 'Middle' : 'Lower') + ' main tunnel';
        }
    }
    for (i = 0; i < S.sideTunnels && i < BP.length; i++) {
        if (!(S.sideDug[i] > 0))
            continue;
        for (p = 0; p <= 1.001; p += .1) {
            q = at(p, BP[i]);
            dd = Math.hypot(q.x - x, q.y - y);
            if (dd < best - 2) {
                best = dd;
                bn = (BP[i].PT[BP[i].PT.length - 1][0] < W / 2 ? 'Western' : 'Eastern') + ' side tunnel';
            }
        }
    }
    return bn || 'The tunnels';
}

function antInfo(s) {
    var o = s.o;
    if (s.t !== 'a' && !o.inj) {
        if (o.nap > 0)
            return [CN[o.k], o.k === 0 ? 'Resting in the nest' : 'Resting at the nest entrance'];
        if (o.tired && o.k !== 0 && o.k !== 3)
            return [CN[o.k], 'Heading home to rest'];
    }
    return antInfo0(s);
}

function antInfo0(s) {
    var o = s.o, t, a;
    if (s.t === 'f')
        return [CN[o.k], o.deep ? ['Tending the deep stores', 'Carrying crumbs down to the deep chambers', 'Patrolling the deep tunnels'][o.k] : ['Tidying the far tunnels', 'Bringing food along the far tunnels', 'Patrolling the far tunnels'][o.k]];
    if (s.t === 'a')
        return ['Worker', { dig: o.kind === 'cav' ? 'Widening the nest cavern' : 'Chewing at the tunnel face', out: 'Carrying dirt away', drop: 'Tossing dirt onto the spoil pile', back: 'Heading back to dig', idle: 'Resting between jobs', tgo: o.then ? 'Walking to a new digging spot' : o.pile ? 'Going to clear a spoil pile' : 'Going to smooth the tunnel walls', twork: o.pile ? 'Shovelling up loose dirt' : 'Scraping the tunnel walls smooth', tret: S.dug >= 1 ? 'Carrying dirt up to the anthill' : 'Carrying dirt to the spoil heap', tdump: S.dug >= 1 ? 'Tipping dirt onto the anthill' : 'Tipping dirt onto the spoil heap' }[o.st] || ''];
    t = CN[o.k];
    if (o.inj)
        return [t, o.st === 2 ? 'Resting while nurses heal it' : 'Limping to the infirmary'];
    if (o.ex)
        return [t, 'Surveying the new chamber'];
    if (o.k === 1 && o.sf)
        return [t, o.sf.side ? (o.sf.pk > 0 ? 'Gathering food in a side chamber' : o.sf.back ? 'Carrying food out of a side chamber' : 'Heading down a side tunnel') : o.sf.pk > 0 ? 'Snipping a leaf on the surface' : o.sf.back ? 'Carrying a leaf back to the entrance' : 'Heading out across the grass'];
    if (o.k === 1 && o.pk > 0)
        return [t, 'Picking food from the wall'];
    if (o.gt > 0)
        return [t, o.gtx || 'Touching antennae with a friend'];
    if (o.k === 0)
        a = o.act || 'Tidying the nest';
    else if (o.k === 1)
        a = o.wait > 0 ? 'Waiting for a food spot' : o.cg ? (o.si >= 0 ? 'Carrying food from an underground spot' : o.si <= -2 ? 'Carrying food from a side chamber' : 'Carrying a leaf home') : o.d === -1 ? 'Heading out to forage' : 'Heading home';
    else if (o.k === 3)
        a = o.cr && o.act ? o.act : 'Exploring the side tunnels';
    else
        a = (o.dr || o.mo) && o.act ? o.act : foes.length ? 'Fighting invaders' : o.act || 'Standing guard';
    return [t, a];
}

function greetTick(dt) {
    marchers.forEach(function (m) { if (m.gt > 0)
        m.gt -= dt; });
    personaTick(dt);
    gAcc -= dt;
    if (gAcc > 0)
        return;
    gAcc = .4;
    var l = marchers.filter(function (m) { return m.k === 1 && !m.inj && !(m.wait > 0) && !(m.gt > 0); }).sort(function (a, b) { return a.p - b.p; }), i;
    for (i = 0; i < l.length - 1; i++) {
        var a = l[i], b = l[i + 1];
        if (a.d !== b.d && Math.abs(a.p - b.p) * LEN < 9 && Math.random() < (pers(a) === 2 || pers(b) === 2 ? .9 : .35)) {
            a.gt = b.gt = .9;
            a.gtx = b.gtx = null;
            mem(a).g++;
            mem(b).g++;
            var q = at((a.p + b.p) / 2);
            fx.push({ x: q.x, y: q.y - 6, vx: 0, vy: -10, l: .6, t: '\u00b7', f: 14, c: '#fff3c4', g: 0 });
            i++;
        }
    }
}
