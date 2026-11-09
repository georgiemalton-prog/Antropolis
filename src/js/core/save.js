/* core/save.js
   Saving, loading, save upgrades and backups. Rule: new fields are optional, never bump the save version.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

// ---- saving, loading and starting a new colony ----

function fresh() { return { totalHatched: 0, upgrades: {}, tier: 0, dug: 0, food: 14, queenHp: 100, wave: 0, savedAt: Date.now(), seed: (Math.random() * 4e9) >>> 0, sideTunnels: 0, sideDug: [], nurses: 1, foragers: 2, soldiers: 1, scouts: 1, superMajors: 0, workers: 1, injured: [0, 0, 0, 0, 0, 0, 0], eggs: [], layTimer: 8, killTimer: 5, injuryTimer: 2, healProgress: 0, classLevel: [0, 0, 0, 0, 0, 0, 0], queenLevel: 0, jelly: 0, foodSpots: [], goalIndex: 0, goalV: 3, queenTaps: 0, deliveries: 0, deepFirst: 1, orders: { wk: 1, fg: 0, gd: 50, nu: 50 }, bld: { store: 0, nest: 0, farm: 0, rax: 0, archive: 0, hatch: 0, tower: 0 }, proj: null, rare: {}, spores: 0 }; }

/* Saves are stored as { v: version, S: colony, P: legacy perks, m: muted }.
   Version 3 renamed the short field names (fd, dg, ...) to readable ones.
   OLD_NAMES lists the renames so older saves can be upgraded when they load. */
var SAVE_KEY = 'thecolony2', SAVE_VERSION = 3;
var OLD_NAMES = { tot: 'totalHatched', dg: 'dug', fd: 'food', hp: 'queenHp', wv: 'wave', t: 'savedAt', nb: 'sideTunnels', bg: 'sideDug', w: 'nurses', fo: 'foragers', so: 'soldiers', sc: 'scouts', sup: 'superMajors', wk: 'workers', ij: 'injured', eg: 'eggs', lay: 'layTimer', kt: 'killTimer', it: 'injuryTimer', hc: 'healProgress', cl: 'classLevel', ql: 'queenLevel', jl: 'jelly', sp: 'foodSpots', gl: 'goalIndex', gt: 'queenTaps', dep: 'deliveries', bro: 'deepFirst', up: 'upgrades', hl: 'hillLevel', hh: 'hillHp', rt: 'raidTimer', rn: 'raidsWon', mh: 'hillGrowth', sd: 'findsSeen', wm: 'wormSeen', ms: 'milestone', sv: 'starveTimer', fr: 'foodRate', frf: 'foragersAtRate', dr: 'digRate' };
var OLD_PERK_NAMES = { lp: 'legacy', ev: 'legacyEver', pk: 'perks' };
var RETIRED = ['a', 'cnt', 'st', 'fed', 'rs'];

var BACKUP_KEY, lastBackup = 0;

function saveText() { return JSON.stringify({ v: SAVE_VERSION, S: S, P: P, m: mut }); }

function save() {
    if (loadingBackup)
        return;
    S.savedAt = Date.now();
    try {
        var prev = localStorage.getItem(SAVE_KEY);
        if (prev && Date.now() - lastBackup > 5 * 60 * 1000 && readSave(prev)) {
            localStorage.setItem(BACKUP_KEY, prev);
            lastBackup = Date.now();
        }
        localStorage.setItem(SAVE_KEY, saveText());
    }
    catch (e) { }
}

function readSave(text) {
    try {
        return upgradeSave(JSON.parse(text));
    }
    catch (e) {
        return null;
    }
}

function upgradeSave(d) {
    if (!d || !d.S)
        return null;
    if (!d.v || d.v < 3) {
        var s = {}, p = {};
        Object.keys(d.S).forEach(function (k) { if (RETIRED.indexOf(k) < 0)
            s[OLD_NAMES[k] || k] = d.S[k]; });
        Object.keys(d.P || {}).forEach(function (k) { p[OLD_PERK_NAMES[k] || k] = d.P[k]; });
        d = { v: 3, S: s, P: p, m: d.m };
    }
    return typeof d.S.tier === 'number' ? d : null;
}

function load() {
    try {
        var main = localStorage.getItem(SAVE_KEY), d = main ? readSave(main) : null;
        if (main && !d) {
            d = readSave(localStorage.getItem(BACKUP_KEY));
            if (d)
                setTimeout(function () { toast('Your save was damaged, so a backup from a few minutes earlier was restored.'); }, 1500);
        }
        if (d) {
            S = Object.assign(fresh(), d.S);
            (S.eggs || []).forEach(function (e) { e.b = 0; });
            if (!d.S.goalV && S.goalIndex >= 9)
                S.goalIndex = 99;
            else if (d.S.goalV === 2 && S.goalIndex < 99) {
                // three stepping-stone goals were added: move saved colonies along so none repeats or is skipped
                if (S.goalIndex >= 16)
                    S.goalIndex += 3;
                else if (S.goalIndex >= 14)
                    S.goalIndex += 2;
                else if (S.goalIndex >= 13)
                    S.goalIndex += 1;
            }
            S.goalV = 3;
            S.orders = Object.assign(fresh().orders, S.orders);
            S.bld = Object.assign(fresh().bld, S.bld);
            P = Object.assign({ legacy: 0, legacyEver: 0, perks: {} }, d.P);
            mut = !!d.m;
            $('snd').textContent = mut ? 'Sound off' : 'Sound on';
        }
    }
    catch (e) { }
}

function saveCode() { return 'COLONY:' + btoa(unescape(encodeURIComponent(saveText()))); }

function decodeSave(text) {
    text = String(text || '').trim();
    if (!text)
        return null;
    try {
        if (text[0] !== '{')
            text = decodeURIComponent(escape(atob(text.replace(/^COLONY:/, '').replace(/\s+/g, ''))));
        return upgradeSave(JSON.parse(text));
    }
    catch (e) {
        return null;
    }
}

function downloadSave() {
    save();
    var d = new Date(), name = 'the-colony-save-' + d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2) + '.json';
    try {
        var url = URL.createObjectURL(new Blob([saveText()], { type: 'application/json' })), a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
        $('setcode').value = saveCode();
        setNote('Backup file saved as ' + name + '. If no file appeared, copy the save code now shown in the box instead.');
    }
    catch (e) {
        setNote('Your browser blocked the download. Use "Copy save code" instead.');
    }
}

function copySave() {
    save();
    var code = saveCode(), box = $('setcode');
    box.value = code;
    function done() { setNote('Save code copied. Paste it somewhere safe, like your Notes app.'); }
    try {
        navigator.clipboard.writeText(code).then(done, function () { box.select(); setNote('Select the code in the box and copy it.'); });
    }
    catch (e) {
        box.select();
        setNote('Select the code in the box and copy it.');
    }
}

var pendingLoad = null;

function tryLoadSave(text) {
    var d = decodeSave(text), b = $('setload') || {};
    if (!d) {
        pendingLoad = null;
        b.textContent = 'Load this backup';
        return setNote('That does not look like a save from Antropolis.');
    }
    if (pendingLoad !== text) {
        pendingLoad = text;
        b.textContent = 'Tap again to replace your colony';
        return setNote('This backup has ' + (d.S.totalHatched || 0) + ' ants hatched and reaches nest stage ' + (d.S.tier + 1) + '. Loading it replaces your current colony.');
    }
    try {
        localStorage.setItem(BACKUP_KEY, saveText());
        localStorage.setItem(SAVE_KEY, JSON.stringify(d));
    }
    catch (e) {
        return setNote('Could not store the backup on this device.');
    }
    setNote('Backup loaded. Restarting...');
    loadingBackup = true;
    setTimeout(function () { location.reload(); }, 400);
}

var loadingBackup = false;

function setNote(t) { var n = $('setnote'); if (n)
    n.textContent = t; }
