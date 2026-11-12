/* dev/preview-tools.js
   Preview tools (only when DEV is true): jump to stages, skip time, trigger events.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

/* Preview tools: jump straight to any stage to see the art and features without playing for hours.
   Set DEV to false before the Play Store release so players never see this. */
var DEV = false;

function devStage(t) {
    var cp = CAPS[t] || 100, k;
    foes.length = 0;
    S.tier = t;
    S.dug = 1;
    S.nurses = Math.round(cp * .12);
    S.foragers = Math.round(cp * .3);
    S.soldiers = Math.round(cp * .12);
    S.scouts = Math.round(cp * .03);
    S.superMajors = t >= 3 ? Math.round(cp * .01) : 0;
    S.workers = 6 + t * 2;
    S.sideTunnels = Math.min(12, 3 + t * 2);
    for (k = 0; k < S.sideTunnels; k++)
        S.sideDug[k] = 1;
    S.totalHatched = Math.max(S.totalHatched, cp);
    S.wave = Math.max(S.wave, t * 8);
    S.food = foodCap() * .7;
    S.jelly = Math.max(S.jelly, 20);
    nf = performance.now() + 120000;
    sync();
    sizeT();
    camT = camClamp(-SK);
}

function devPanel() {
    var el = $('devp');
    if (!el) {
        el = document.createElement('div');
        el.className = 'intro';
        el.id = 'devp';
        el.setAttribute('role', 'dialog');
        var B = [
            ['Save and undo', null],
            ['Back up my save', function () { try { localStorage.setItem('thecolony_devbak', JSON.stringify({ S: S, P: P })); devNote('Backed up.'); } catch (e) { devNote('Could not back up.'); } }],
            ['Restore my backup', function () { try { var d = JSON.parse(localStorage.getItem('thecolony_devbak')); S = d.S; P = d.P; foes.length = 0; sync(); sizeT(); save(); devNote('Restored.'); } catch (e) { devNote('No backup found.'); } }],
            ['Jump to a stage', null],
            ['Burrow', function () { devStage(1); }],
            ['Colony', function () { devStage(2); }],
            ['Anthill', function () { devStage(3); }],
            ['Supercolony', function () { devStage(4); }],
            ['Resources', null],
            ['Fill food', function () { S.food = foodCap(); }],
            ['+50 jelly', function () { S.jelly += 50; }],
            ['+20 legacy', function () { P.legacy += 20; P.legacyEver += 20; }],
            ['Max cavern + hill', function () { S.cavLevel = 10; S.hillLevel = 5; }],
            ['Far lands', null],
            ['Open far lands + all tunnels', function () { devStage(4); S.reach = 2; S.sideTunnels = 19; for (var k = 0; k < 19; k++) S.sideDug[k] = 1; genPebs(); go('tun'); }],
            ['Unlock next deep layer', function () { P.gen = Math.max(P.gen || 0, (S.deep || 0) + 1); S.tier = Math.max(S.tier, 4); S.food = foodCap(); S.jelly += 100; upDeep(); go('tun'); camT = camClamp(deepTop() - H * .3); }],
            ['All 4 deep layers', function () { S.tier = Math.max(S.tier, 4); S.deep = 4; S.deepAt = [0, 0, 0, 0]; layoutV++; genDeep(); genPebs(); go('tun'); camT = camClamp(deepTop() - H * .3); }],
            ['Go to deep layers', function () { go('tun'); camT = camClamp(deepTop() - H * .3); }],
            ['Finish all tunnel digging', function () { farInit(); for (var r = 0; r < 60; r++) { farmList(); deepList(); var q = DQ.concat(FQ); if (!q.length) break; q.forEach(function (e) { (e.deep ? S.ddg : S.fdg)[e.i] = 1; }); FDV++; } toast('All unlocked tunnels dug.'); }],
            ['Rival raid now', function () { if (!rivalsOn()) { toast('Needs the Colony stage, the tunnel open and a finished side tunnel.'); return; } foes.length = 0; wvi.w = 0; RV = null; rvT = 0; go('tun'); }],
            ['Cave crickets now', function () { if (!armouryOn()) { toast('Unlock the Stone layer first.'); return; } cricT = 0; cric.length = 0; foes.length = 0; trm.length = 0; go('tun'); }],
            ['Termite raid now', function () { devStage(4); S.reach = 2; S.sideTunnels = 19; for (var k = 0; k < 19; k++) S.sideDug[k] = 1; S.rare.nbf = 1; trmT = 0; genPebs(); go('tun'); }],
            ['Events', null],
            ['Good surprise', function () { EV_GOOD[Math.floor(Math.random() * EV_GOOD.length)].f(); }],
            ['Trouble', function () { EV_BAD[Math.floor(Math.random() * EV_BAD.length)].f(); }],
            ['A choice', function () { evShow(EV_CHOICE[Math.floor(Math.random() * EV_CHOICE.length)]); }],
            ['Welcome back', null],
            ['Pretend I was away 3 hours', function () { dead = false; foes.length = 0; $('devp').classList.remove('on'); S.savedAt = Date.now() - 3 * 3600 * 1000; resumeFromAway(); }],
            ['Pretend I was away 8 hours', function () { dead = false; foes.length = 0; $('devp').classList.remove('on'); S.savedAt = Date.now() - 8 * 3600 * 1000; resumeFromAway(); }],
            ['Time of day', null],
            ['Day', function () { S.days = .58; }],
            ['Night', function () { S.days = 2.28; }],
            ['Generations', null],
            ['Royal flight now', function () { if (gain() < 1) { S.tier = Math.max(S.tier, 3); S.totalHatched = Math.max(S.totalHatched, 2000); } royal(); }],
            ['Set generation 3', function () { P.gen = 2; }],
            ['Set generation 6', function () { P.gen = 5; }],
            ['Check achievements', function () { achT = 0; achTick(.1); }],
            ['Ads', null],
            ['Test colony boost ad', function () { P.adT = {}; adBoost(); }],
            ['Test save-the-queen ad', function () { S.revived = 0; loseGame(); }]
        ], h = '<div class="icard"><h3>Preview tools</h3><p class="mute" style="margin-top:-6px">These change your real save. Tap Back up first, and Restore afterwards.</p>';
        B.forEach(function (b, i) {
            h += b[1] ? '<button class="card" data-i="' + i + '" style="margin:0 6px 6px 0;display:inline-flex;width:auto;padding:8px 12px">' + b[0] + '</button>' : '<p style="margin:10px 0 4px"><b>' + b[0] + '</b></p>';
        });
        h += '<p id="devnote" class="mute" style="min-height:1.4em;margin:8px 0" aria-live="polite"></p><div class="irow"><button class="card dig" id="devok">Close</button></div></div>';
        el.innerHTML = h;
        document.body.appendChild(el);
        [].forEach.call(el.querySelectorAll('button[data-i]'), function (bt) {
            bt.onclick = function () { var f = B[+bt.getAttribute('data-i')][1]; try { f(); } catch (e) { devNote('Error: ' + e.message); return; } save(); if (!$('devnote').textContent)
                devNote('Done.'); ui(); };
        });
        $('devok').onclick = function () { el.classList.remove('on'); };
    }
    $('devnote').textContent = '';
    el.classList.add('on');
    try {
        if (!localStorage.getItem('thecolony_devbak'))
            localStorage.setItem('thecolony_devbak', JSON.stringify({ S: S, P: P }));
    }
    catch (e) { }
}

function devNote(m) { $('devnote').textContent = m; }
