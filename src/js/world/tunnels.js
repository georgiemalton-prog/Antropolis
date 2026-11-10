/* world/tunnels.js
   Ant-farm branches and deep-layer tunnels: which are unlocked, which are dug, and the workers digging them.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

// worked out once per change instead of ~20 times a frame
var DLC = { k: null, v: null }, FLC = { k: null, v: null }, FDV = 0, FQ = [], DQ = [], DIGF = [];
/* Ant-farm branches and deep-layer tunnels: hatching eggs unlocks the next one (as before, one per 24 hatches, deep one per 14),
   but now the workers actually dig each one out (S.fdg / S.ddg: index -> 0..1). Older saves keep what was already open. */
function farInit() {
    if (S.fdg && S.ddg)
        return;
    var f = {}, d = {};
    if (!S.fdg)
        farmListOld().forEach(function (o) { f[o.i] = o.pr; });
    if (!S.ddg)
        deepListOld().forEach(function (o) { d[o.i] = o.pr; });
    S.fdg = S.fdg || f;
    S.ddg = S.ddg || d;
    FDV++;
}
/* Build 74 redrew the ant-farm and deep-layer tunnels (smooth, never crossing). Saved dig progress is kept
   per tunnel number, which now means a different tunnel, so once per save the same number of finished tunnels
   is dug again in the new layout, in the usual order (shafts keep theirs). S.net (optional) marks it done. */
// 2 = build 75: the layout no longer shifts between loads, so build 74 saves are fitted once more
var NETV = 2;
function netMigrate() {
    S.net = S.net || {};
    var i, n, k;
    if ((S.net.f || 0) < NETV && FARMP.length) {
        S.net.f = NETV;
        n = 0;
        for (k in S.fdg)
            if (S.fdg[k] >= 1)
                n++;
        S.fdg = {};
        for (i = 0; i < n; i++) {
            farmList0();
            if (!FQ.length)
                break;
            S.fdg[FQ[0].i] = 1;
        }
        FDV++;
    }
    if ((S.net.d || 0) < NETV && DEEPP.length) {
        S.net.d = NETV;
        var per = [0, 0, 0, 0], keep = {};
        for (k in S.ddg) {
            var e = DEEPP[k];
            if (e && e.t)
                keep[k] = S.ddg[k];
            else if (e && S.ddg[k] >= 1)
                per[e.L]++;
        }
        S.ddg = keep;
        for (var guard = 0; guard < 400; guard++) {
            deepList0();
            var pick = null;
            DQ.forEach(function (q) { if (!pick && !DEEPP[q.i].t && per[q.L] > 0) pick = q; });
            if (!pick)
                break;
            S.ddg[pick.i] = 1;
            per[pick.L]--;
        }
        FDV++;
    }
}
function deepList0() {
    farInit();
    if (!S.net || (S.net.d || 0) < NETV)
        netMigrate();
    var o = [], cnt = [0, 0, 0, 0], inc = [], rc = S.reach || 0, i, e, pr, at = S.deepAt || [], dd = S.ddg;
    DQ = [];
    if (!S.deep)
        return o;
    for (i = 0; i < DEEPP.length; i++) {
        e = DEEPP[i];
        if (e.L >= S.deep || e.lo < -rc + .015 || e.hi > 1 + rc - .015 || (e.pi >= 0 && !inc[e.pi]))
            continue;
        var ok = cnt[e.L]++ < (S.totalHatched - (at[e.L] || 0)) / 14;
        pr = Math.min(1, dd[i] || 0);
        if (pr >= 1)
            inc[i] = 1;
        else if (ok)
            DQ.push({ i: i, q: e.q, deep: 1, L: e.L, t: e.t });
        if (pr > 0)
            o.push({ f: e, pr: pr, i: i });
    }
    return o;
}
function farmList0() {
    farInit();
    if (!S.net || (S.net.f || 0) < NETV)
        netMigrate();
    var o = [], i, pr, n = 0, inc = [], rc = S.reach || 0, fd = S.fdg;
    FQ = [];
    for (i = 0; i < FARMP.length; i++) {
        // only inside the part of the map that is unlocked, and only once the tunnel it grows from is finished
        if (!farmOpen(FARMP[i].par) || FARMP[i].lo < -rc + .015 || FARMP[i].hi > 1 + rc - .015 || (FARMP[i].pi >= 0 && !inc[FARMP[i].pi]))
            continue;
        var ok = n++ < S.totalHatched / 24;
        pr = Math.min(1, fd[i] || 0);
        if (pr >= 1)
            inc[i] = 1;
        else if (ok)
            FQ.push({ i: i, q: FARMP[i].q });
        if (pr > 0)
            o.push({ f: FARMP[i], pr: pr, i: i });
        else if (!ok)
            break;
    }
    return o;
}
// the workers dig the next few unlocked tunnels; deep shafts first
function farDigTick(dt) {
    if (!MAIN || !FARMP)
        return;
    farmList();
    deepList();
    var w = S.workers || 0, q = DQ.concat(FQ);
    DIGF = [];
    if (!w || !q.length)
        return;
    var F = Math.min(q.length, 1 + Math.floor(w / 15), 4), rate = 2 * Math.pow(Math.min(w, 150), .8) * (1 + .25 * S.classLevel[6]) * (S.orders.wk === 0 ? 1.3 : S.orders.wk === 2 ? .7 : 1);
    for (var j = 0; j < F; j++) {
        var e = q[j], st = e.deep ? S.ddg : S.fdg, b = st[e.i] || 0;
        st[e.i] = Math.min(1, b + rate / F * dt / Math.max(20, e.q.LEN));
        DIGF.push(e);
        if (st[e.i] >= 1 && e.deep && e.t && dt < 5)
            toast('Your workers dug the shaft down into the ' + ['clay', 'stone layer', 'deep dark', 'bedrock'][e.L] + '.');
    }
    FDV++;
}
function deepList() {
    var dk = FDV + '|' + S.totalHatched + '|' + S.deep + '|' + (S.reach || 0) + '|' + (S.deepAt || []).join(',') + '|' + DEEPP.length + '|' + layoutV;
    if (DLC.k === dk && DLC.s === S)
        return DLC.v;
    DLC.k = dk;
    DLC.s = S;
    return (DLC.v = deepList0());
}
function deepListOld() {
    var o = [], cnt = [0, 0, 0, 0], inc = [], rc = S.reach || 0, i, e, pr, at = S.deepAt || [];
    if (!S.deep)
        return o;
    for (i = 0; i < DEEPP.length; i++) {
        e = DEEPP[i];
        if (e.L >= S.deep || e.lo < -rc + .015 || e.hi > 1 + rc - .015 || (e.pi >= 0 && !inc[e.pi]))
            continue;
        inc[i] = 1;
        pr = Math.min(1, (S.totalHatched - (at[e.L] || 0)) / 14 - cnt[e.L]++);
        if (pr > 0)
            o.push({ f: e, pr: pr, i: i });
    }
    return o;
}

function deepGenOk(lv) { return (P.gen || 0) >= lv + 1; }
function deepGenTxt(lv) { return 'Unlocks in Generation ' + genName(lv + 2) + '. Take a royal flight to reach it.'; }
function deepCost() { var lv = S.deep || 0; return { f: Math.round(foodCap() * (.5 + .3 * lv)), j: 25 + 20 * lv }; }
var DEEPT = ['Clay below the cavern. The cool clay makes a perfect Larder: food stores grow by a quarter, and your ants keep working for 10 hours while you are away.', 'Cold stone layer. Your soldiers set up an Armoury down here: they drill between fights, take a quarter fewer injuries, and fight termite raids 20% harder. Watch out for cave crickets creeping up from below to raid the Larder.', 'The deep dark. Your scouts have found the Crystal Caves: every few mapping trips bring back enough crystal for a drop of jelly, and the glow makes golden eggs more likely.', 'Bedrock. At the very bottom of the world your diggers have broken into a huge cavern, and something enormous is sleeping in it: the Giant Mole.'];
function upDeep() {
    var lv = S.deep || 0, c = deepCost();
    if (lv >= 4 || !deepGenOk(lv) || S.tier < (lv < 2 ? 3 : 4) || S.food < c.f || S.jelly < c.j)
        return;
    S.food -= c.f;
    S.jelly -= c.j;
    S.deepAt = S.deepAt || [];
    S.deepAt[lv] = S.totalHatched;
    S.deep = lv + 1;
    layoutV++;
    genDeep();
    genPebs();
    SFX.buy();
    flash = .6;
    shake = .4;
    pulseRing('255,210,60');
    toast(DEEPT[lv]);
}

function farmOpen(par) { return par < 0 ? S.dug >= 1 : (par < S.sideTunnels && S.sideDug[par] >= 1); }

function farmList() {
    var fk = FDV + '|' + S.totalHatched + '|' + S.sideTunnels + '|' + S.sideDug.join(',') + '|' + (S.reach || 0) + '|' + (S.dug >= 1 ? 1 : 0) + '|' + FARMP.length + '|' + layoutV;
    if (FLC.k === fk && FLC.s === S)
        return FLC.v;
    FLC.k = fk;
    FLC.s = S;
    return (FLC.v = farmList0());
}
function farmListOld() {
    var o = [], i, pr, n = 0, inc = [], rc = S.reach || 0;
    for (i = 0; i < FARMP.length; i++) {
        // only inside the part of the map that is unlocked, and only if the tunnel it grows from is there too
        if (!farmOpen(FARMP[i].par) || FARMP[i].lo < -rc + .015 || FARMP[i].hi > 1 + rc - .015 || (FARMP[i].pi >= 0 && !inc[FARMP[i].pi]))
            continue;
        inc[i] = 1;
        pr = Math.min(1, S.totalHatched / 24 - n++);
        if (pr <= 0)
            break;
        o.push({ f: FARMP[i], pr: pr, i: i });
    }
    return o;
}

// the little ants walking the ant-farm and deep-layer tunnels. Worked out from the clock alone, so the
// tunnel view and the colony map always agree on where each one is.
function farmAnts(now, fn) {
    farmList().concat(deepList()).forEach(function (o, n) {
        var q = o.f.q, len = q.LEN * o.pr, cnt, c, k;
        if (len < 24)
            return;
        cnt = Math.min(3, 1 + Math.floor(len / 100));
        for (c = 0; c < cnt; c++) {
            var sp = 15 + (n * 7 + c * 5) % 9, per = len / sp * 2, u = ((now / 1000 + n * 3.7 + c * per / cnt) % per) / per * 2, fwd = u < 1, a = at((fwd ? u : 2 - u) * o.pr, q);
            k = (n + c) % 3;
            fn(a, fwd, k, n, c);
        }
    });
}

// FAO keeps one small record per tunnel ant (keyed by tunnel and slot) so it can be tapped, named and followed
var FAO = {}, FAOv = -1;

// the main shaft of deep layer L (0 clay .. 3 bedrock), once it is fully dug
function trunkQ(L) {
    var o = null;
    deepList().forEach(function (e) { if (!o && e.f.L === L && e.f.t && e.pr >= 1) o = e; });
    return o ? o.f.q : null;
}
