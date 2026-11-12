/* core/audio.js
   Sound effects and vibration.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

var AC = null;
var SFX = {
    lay: function () { tn(480 + Math.random() * 140, .09, 'triangle', .12, 1.6); vib(8); },
    buy: function () { seq([660, 990], 70, 'square', .07); vib(15); },
    hit: function () { tn(130, .08, 'square', .07, .5); vib(6); },
    boom: function () { tn(90, .4, 'sawtooth', .2, .3); vib([40, 30, 60]); },
    win: function () { seq([523, 659, 784, 1047], 110); vib([30, 40, 30, 40, 60]); },
    alarm: function () { seq([330, 247, 330, 247], 140, 'square', .07); vib([80, 60, 80]); },
    tier: function () { seq([440, 440, 440, 494, 523, 494, 523, 659, 880], 95, 'square', .06); vib([40, 30, 40, 30, 90]); },
    fan: function () { seq([523, 659, 784, 1047, 784, 1047, 1319, 1568], 120, 'square', .07); vib([60, 40, 60, 40, 200]); },
    lose: function () { tn(300, .9, 'sawtooth', .15, .2); vib(300); },
    dig: function () { if (digging)
        tn(70 + Math.random() * 30, .07, 'square', .04, .6); },
    // build 82 sound pass: each big moment has its own sound, and busy ones are rate-limited
    hatch: function (c) { if (sfxGap('hatch', 120)) return; tn(620 + c * 90, .05, 'triangle', .06, 1.5); setTimeout(function () { tn(980 + c * 90, .07, 'sine', .05); }, 45); },
    tap: function () { tn(220, .12, 'sine', .07, 1.35); noiz(.06, 1800, .04); vib(6); },
    goal: function () { seq([784, 988, 1175, 1568], 85, 'triangle', .09); setTimeout(function () { tn(2093, .5, 'sine', .04); }, 340); vib([20, 30, 20]); },
    build: function () { noiz(.05, 700, .14); setTimeout(function () { noiz(.05, 600, .12); }, 130); setTimeout(function () { seq([523, 784, 1047], 90, 'triangle', .09); }, 280); vib([25, 60, 25]); },
    claim: function () { seq([1319, 1760], 70, 'sine', .08); setTimeout(function () { tn(2637, .35, 'sine', .035); }, 150); vib(12); },
    victory: function () { seq([392, 523, 659, 784, 659, 784, 1047], 95, 'square', .065); vib([30, 40, 30, 40, 80]); },
    squish: function () { if (sfxGap('squish', 90)) return; noiz(.09, 450, .12); tn(160, .1, 'sine', .07, .45); },
    jelly: function () { if (sfxGap('jelly', 250)) return; tn(1568, .16, 'sine', .05); setTimeout(function () { tn(2093, .22, 'sine', .035); }, 60); },
    find: function () { seq([660, 880, 1320], 80, 'sine', .08); setTimeout(function () { tn(1760, .4, 'triangle', .04); }, 260); },
    rally: function () { seq([196, 262, 330, 392], 70, 'sawtooth', .06); vib([30, 20, 30]); },
    drip: function () { var f = 900 + dripR() * 900; tn(f, .09, 'sine', .035, 1.8); setTimeout(function () { tn(f * 1.4, .06, 'sine', .015, 1.5); }, 70); }
};
// a short burst of filtered noise: soil, knocks and squashes
var NZ = null;
function noiz(d, f, v) {
    if (mut)
        return;
    var a = au();
    if (!a)
        return;
    try {
        if (!NZ) {
            NZ = a.createBuffer(1, a.sampleRate * .5, a.sampleRate);
            var ch = NZ.getChannelData(0);
            // its own random numbers, so making the noise never changes how the game plays out
            var nr = rng(777);
            for (var i = 0; i < ch.length; i++)
                ch[i] = nr() * 2 - 1;
        }
        var s = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain(), t = a.currentTime;
        s.buffer = NZ;
        fl.type = 'bandpass';
        fl.frequency.value = f;
        fl.Q.value = 1.2;
        g.gain.setValueAtTime(v, t);
        g.gain.exponentialRampToValueAtTime(.0001, t + d);
        s.connect(fl);
        fl.connect(g);
        g.connect(a.destination);
        s.start(t);
        s.stop(t + d + .02);
    }
    catch (e) { }
}
// true (skip) if this sound played less than ms ago, so busy moments don't turn into a buzz
var SFXT = {};
function sfxGap(k, ms) { var n = performance.now(); if (n - (SFXT[k] || 0) < ms) return true; SFXT[k] = n; return false; }
// water dripping somewhere in the soil, every few seconds while the Nest or Tunnel is on screen
var dripT = 6, dripR = rng(4242);   // its own random numbers, so sound never changes how the game plays out
function ambTick(rdt) {
    if (mut || document.hidden || (tab !== 'nest' && tab !== 'tun') || !AC)
        return;
    dripT -= rdt;
    if (dripT <= 0) {
        dripT = 5 + dripR() * 9;
        SFX.drip();
    }
}

// ---- audio and haptics ----

function au() { if (!AC) {
    try {
        AC = new (window.AudioContext || window.webkitAudioContext)();
    }
    catch (e) { }
} if (AC && AC.state === 'suspended')
    AC.resume(); return AC; }

function tn(f, d, ty, v, sl) {
    if (mut)
        return;
    var a = au();
    if (!a)
        return;
    var o = a.createOscillator(), g = a.createGain(), t = a.currentTime;
    o.type = ty || 'sine';
    o.frequency.setValueAtTime(f, t);
    if (sl)
        o.frequency.exponentialRampToValueAtTime(Math.max(30, f * sl), t + d);
    g.gain.setValueAtTime(v || .12, t);
    g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g);
    g.connect(a.destination);
    o.start(t);
    o.stop(t + d);
}

function vib(p) { try {
    if (!mut && navigator.vibrate)
        navigator.vibrate(p);
}
catch (e) { } }
