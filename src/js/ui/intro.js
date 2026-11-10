/* ui/intro.js
   How to play, the What's new card and the title screen.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

function introShow(i) { ii = i; $('ipg').innerHTML = IP[i]; var d = ''; for (var k = 0; k < IP.length; k++)
    d += '<i' + (k === i ? ' class="on"' : '') + '></i>'; $('idots').innerHTML = d; $('iback').style.visibility = i ? 'visible' : 'hidden'; $('inext').textContent = i === IP.length - 1 ? 'Start playing' : 'Next'; }

function introOpen(full) { if ($('intro').classList.contains('on'))
    return; IP = full === true ? IP_FULL : IP_QUICK; introWasDead = dead; dead = true; $('intro').classList.add('on'); introShow(0); }

function introClose() { $('intro').classList.remove('on'); dead = introWasDead; try {
    localStorage.setItem('thecolony_intro', '1');
}
catch (e) { } }

// ---- startup ----
var IP_FULL;
var IP_QUICK = ['<h3>Welcome to Antropolis</h3><p>You are a queen ant starting a new colony underground.</p><p><b>Tap the queen</b> on the Nest tab to lay eggs faster.</p>',
    '<h3>Grow your colony</h3><p>Your ants dig, find food and fight invaders.</p><p>Follow the <b>Goal</b> card. It always shows what to do next.</p><p class="mute">Need more help? Open the menu and tap How to play.</p>'];
// shown once to returning players after an update; new players skip it
var WN_V = 50, IP_NEW = ['<h3>What\u2019s new</h3><p><b>Deep layers:</b> each generation digs one layer deeper. Find the Larder, the Armoury, the Crystal Caves and, at the very bottom, the <b>Giant Mole</b>. Beat it to build the Great Hall.</p><p><b>Your army has jobs:</b> soldiers drill in the Armoury, march out to fight termite raids and fight off cave crickets. Scouts map the Crystal Caves.</p><p><b>Also:</b> the nest grows as workers dig it out, foragers spread to every tunnel, and the Ready now card jumps straight to the upgrade.</p>'];

// first visit: show How to play (called once from boot.js)
function initFirstVisit() {
    try {
        if (!localStorage.getItem('thecolony_intro')) {
            P.wn = WN_V;
            if (navigator.webdriver)
                introOpen();
            else {
                // a new player: the opening scene plays after PLAY, then How to play; hold the game still until then
                OPEN_PENDING = { dead: dead };
                dead = true;
            }
        }
    }
    catch (e) {
        introOpen();
    }
}

// title screen
// the title screen (called once from boot.js)
function initTitleScreen() {
    (function () {
        var t = $('title');
        if (navigator.webdriver) {
            t.className = 'off';
            t.style.display = 'none';
            return;
        }
        $('tgo').textContent = S.totalHatched > 0 || S.dug > 0 ? 'CONTINUE' : 'PLAY';
        function go() {
            t.className = 'off';
            setTimeout(function () { t.style.display = 'none'; }, 800);
            musicStart();
            if (OPEN_PENDING) {
                dead = OPEN_PENDING.dead;
                OPEN_PENDING = null;
                openingPlay(function () { introOpen(); });
            }
        }
        $('tgo').onclick = go;
        if ($('tver'))
            $('tver').textContent = 'Version ' + APP_VER + ' \u00b7 build ' + BUILD;
        $('thelp').onclick = function () { var op = !!OPEN_PENDING; go(); if (!op) setTimeout(function () { introOpen(true); }, 300); };
    })();
}
