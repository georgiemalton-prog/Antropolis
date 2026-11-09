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
        tn(70 + Math.random() * 30, .07, 'square', .04, .6); }
};

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
