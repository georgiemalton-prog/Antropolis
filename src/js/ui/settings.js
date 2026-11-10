/* ui/settings.js
   Settings menu, power modes, feedback and the version label.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

// the Reset button asks twice before wiping the colony (called once from boot.js)
function initResetButton() {
    $('reset').onclick = function () {
        if (!rs) {
            rs = 1;
            this.textContent = 'Tap again to erase everything';
            setTimeout(function () { rs = 0; $('reset').textContent = 'Erase everything'; }, 3000);
            return;
        }
        P = { legacy: 0, legacyEver: 0, perks: {}, wn: WN_V };
        rs = 0;
        this.textContent = 'Erase everything';
        newRun(0);
    };
}

// ---- settings: backups, loading a backup, battery saver ----
// power: 'auto' (default: 30 frames a second once the colony is big, 60 while it's small), 'smooth' (always 60), 'saver' (30 and a lighter picture)
var battery = false, power = 'auto';

function setPower(m) {
    power = m;
    battery = m === 'saver';
    try {
        localStorage.setItem('thecolony_power', m);
    }
    catch (e) { }
    if (battery && rqStep < 1) {
        rqStep = 1;
        dpr = rqDpr();
        cv.width = Math.round((sizeT.cw || cv.clientWidth) * dpr);
        cv.height = Math.round((parseFloat(cv.style.height) || cv.clientHeight) * dpr);
    }
    batteryLabel();
}
// frames-a-second cap for the main loop (0 = no cap)
function fpsCapNow() {
    if (tab === 'col')
        return 12;
    if (mapIsOpen())
        return 20;
    if (power === 'saver')
        return 30;
    if (power === 'smooth')
        return 0;
    return popn() > 200 ? 30 : 0;
}

function batteryLabel() { var b = $('setbat'); if (b)
    b.textContent = power === 'saver' ? 'Battery saver: 30 frames a second, lighter picture' : power === 'smooth' ? 'Smooth: always 60 frames a second (uses more battery)' : 'Auto (recommended): 60 frames a second, 30 once the colony is big'; }

// APP_VER is what players see and goes up with each public update; BUILD counts every build we make
var APP_VER = '1.0', BUILD = 67, FEEDBACK_EMAIL = 'CHANGE-ME@example.com', GAME_VER;
function sendFeedback() {
    var txt = ($('fbtext').value || '').trim();
    if (!txt) { setNote('Type a short message first.'); return; }
    var info = 'Game ' + GAME_VER + ' | stage ' + S.tier + ' | ants ' + Math.floor(popn()) + ' | gen ' + genNum() + ' | ' + (navigator.userAgent || '').slice(0, 120);
    var url = 'mailto:' + FEEDBACK_EMAIL + '?subject=' + encodeURIComponent('Antropolis feedback: ' + $('fbtype').value) + '&body=' + encodeURIComponent(txt + '\n\n---\n' + info);
    setNote('Opening your email app. Press send there to finish.');
    try { window.location.href = url; } catch (e) { }
}

function openSettings() {
    var el = $('settings');
    if (!el) {
        el = document.createElement('div');
        el.className = 'intro';
        el.id = 'settings';
        el.setAttribute('role', 'dialog');
        el.setAttribute('aria-modal', 'true');
        el.innerHTML = '<div class="icard"><h3>Menu</h3><div class="irow" id="setquick" style="margin-bottom:10px;flex-wrap:wrap"></div>' +
            '<p class="mute" style="margin-top:-4px">Your colony saves itself on this device every second, and keeps a backup copy. You can also keep your own backup.</p>' +
            '<div class="irow" style="flex-wrap:wrap"><button class="card" id="setdl">Download backup file</button><button class="card" id="setcp">Copy save code</button></div>' +
            '<p style="margin:12px 0 4px"><b>Load a backup</b></p>' +
            '<textarea id="setcode" rows="3" placeholder="Paste a save code here, or choose a backup file" style="width:100%;font:12px monospace;border-radius:12px;border:1px solid var(--line);background:var(--bg);color:var(--ink);padding:8px"></textarea>' +
            '<div class="irow" style="margin-top:6px;flex-wrap:wrap"><label class="card" style="margin:0;justify-content:center;cursor:pointer">Choose file<input id="setfile" type="file" accept=".json,.txt,application/json,text/plain" style="display:none"></label><button class="card" id="setload">Load this backup</button></div>' +
            (DEV ? '<p style="margin:12px 0 4px"><b>Preview tools</b></p><button class="card" id="setdev">Open preview tools</button>' : '') +
            '<button class="card" id="setopen">Watch the opening</button>' +
            '<p style="margin:12px 0 4px"><b>Power</b> <span class="mute">(tap to change)</span></p>' +
            '<button class="card" id="setbat"></button>' +
            (STATS_CODE && !DEV ? '<p style="margin:12px 0 4px"><b>Anonymous play stats</b> <span class="mute">(helps us improve the game)</span></p><button class="card" id="setstats"></button>' : '') +
            (FEEDBACK_EMAIL.indexOf('CHANGE-ME') === 0 ? '' : (
            '<p style="margin:12px 0 4px"><b>Send feedback</b></p>' +
            '<div class="irow" style="margin-bottom:6px"><select id="fbtype" style="flex:1;padding:8px;border-radius:12px;border:1px solid var(--line);background:var(--bg);color:var(--ink)"><option>Bug</option><option>Idea</option><option>Something confusing</option></select></div>' +
            '<textarea id="fbtext" rows="3" placeholder="What happened, or what would you like to see?" style="width:100%;font:13px sans-serif;border-radius:12px;border:1px solid var(--line);background:var(--bg);color:var(--ink);padding:8px"></textarea>' +
            '<button class="card" id="fbsend" style="margin-top:6px">Send feedback</button>')) +
            '<p id="setnote" class="mute" style="min-height:1.4em;margin:10px 0" aria-live="polite"></p>' +
            '<p class="mute" style="font-size:12px;text-align:center;margin:4px 0 0">Antropolis version ' + APP_VER + ' \u00b7 build ' + BUILD + '</p>' +
            '<div class="irow"><button class="card dig" id="setok">Done</button></div></div>';
        document.body.appendChild(el);
        ['snd', 'mus', 'help'].forEach(function (id) { var b = $(id); b.className = 'card'; b.style.cssText = 'margin:0;justify-content:center;flex:1;min-width:90px'; $('setquick').appendChild(b); });
        $('help').addEventListener('click', function () { el.classList.remove('on'); });
        $('setdl').onclick = downloadSave;
        $('setcp').onclick = copySave;
        $('setload').onclick = function () { tryLoadSave($('setcode').value); };
        $('setcode').oninput = function () { pendingLoad = null; $('setload').textContent = 'Load this backup'; };
        $('setfile').onchange = function () { var f = this.files && this.files[0]; if (!f)
            return; var r = new FileReader(); r.onload = function () { $('setcode').value = String(r.result); pendingLoad = null; tryLoadSave($('setcode').value); }; r.readAsText(f); };
        $('setbat').onclick = function () { setPower(power === 'auto' ? 'saver' : power === 'saver' ? 'smooth' : 'auto'); };
        $('setopen').onclick = function () { el.classList.remove('on'); openingPlay(); };
        if ($('setstats'))
            $('setstats').onclick = statsToggle;
        if ($('fbsend'))
            $('fbsend').onclick = sendFeedback;
        if (DEV)
            $('setdev').onclick = function () { el.classList.remove('on'); devPanel(); };
        $('setok').onclick = function () { el.classList.remove('on'); pendingLoad = null; $('setload').textContent = 'Load this backup'; setNote(''); };
    }
    batteryLabel();
    statsLabel();
    el.classList.add('on');
}
