/* ui/music.js
   Background music: an 8-bit colony march.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

// ---- music: an 8-bit colony march ----
/* The traditional tune of "When Johnny Comes Marching Home" / "The Ants Go Marching" (1863, public domain),
   moved into A minor. The first ten bars are the traditional melody; the last six are our own ending.
   MEL is the melody, one list per bar: [note, length in eighth notes]. MCH is the chord for each bar.
   musicEngine builds the instruments; E.play is called once per eighth note and decides what plays. */
var MUS = { on: true, eng: null, gain: null, timer: null };
var MEL = [
    [['A4', 2], ['A4', 1], ['A4', 2], ['B4', 1]], [['C5', 2], ['B4', 1], ['C5', 2], ['A4', 1]], [['G4', 3], [null, 2], ['E4', 1]], [['G4', 3], [null, 2], ['E4', 1]],
    [['A4', 2], ['A4', 1], ['A4', 2], ['B4', 1]], [['C5', 2], ['B4', 1], ['C5', 2], ['D5', 1]], [['E5', 3], [null, 2], ['C5', 1]], [['E5', 3], [null, 2], ['C5', 1]],
    [['E5', 2], ['E5', 1], ['E5', 2], ['C5', 1]], [['D5', 2], ['D5', 1], ['D5', 2], ['B4', 1]], [['C5', 2], ['C5', 1], ['C5', 2], ['A4', 1]], [['B4', 2], ['B4', 1], ['B4', 2], ['G#4', 1]],
    [['A4', 2], ['B4', 1], ['C5', 2], ['D5', 1]], [['E5', 2], ['D5', 1], ['C5', 2], ['B4', 1]], [['C5', 2], ['B4', 1], ['G#4', 2], ['B4', 1]], [['A4', 3], [null, 2], ['E4', 1]],
    // verse B: the same marching rhythm lifted into C major, then home to A minor. Our own tune
    [['E5', 2], ['E5', 1], ['E5', 2], ['G5', 1]], [['G5', 2], ['F5', 1], ['G5', 2], ['E5', 1]], [['F5', 3], [null, 2], ['C5', 1]], [['E5', 3], [null, 2], ['C5', 1]],
    [['E5', 2], ['E5', 1], ['E5', 2], ['G5', 1]], [['G5', 2], ['E5', 1], ['G5', 2], ['A5', 1]], [['G5', 3], [null, 2], ['D5', 1]], [['D5', 3], [null, 2], ['B4', 1]],
    [['F5', 2], ['F5', 1], ['F5', 2], ['E5', 1]], [['E5', 2], ['E5', 1], ['E5', 2], ['C5', 1]], [['D5', 2], ['D5', 1], ['D5', 2], ['B4', 1]], [['D5', 2], ['E5', 1], ['D5', 2], ['B4', 1]],
    [['F5', 2], ['E5', 1], ['D5', 2], ['C5', 1]], [['B4', 2], ['C5', 1], ['D5', 2], ['G5', 1]], [['E5', 2], ['D5', 1], ['B4', 2], ['G#4', 1]], [['A4', 3], [null, 2], ['E4', 1]]
];
var MCH = ['Am', 'Am', 'C', 'Am', 'Am', 'Am', 'C', 'C', 'C', 'G', 'Am', 'E', 'Am', 'G', 'E', 'Am', 'C', 'C', 'F', 'C', 'C', 'Am', 'G', 'G', 'F', 'C', 'G', 'G', 'Dm', 'G', 'E', 'Am'];
var CHN = { Am: ['A', 'C', 'E'], G: ['G', 'B', 'D'], F: ['F', 'A', 'C'], C: ['C', 'E', 'G'], Dm: ['D', 'F', 'A'], E: ['E', 'G#', 'B'] };

function noteF(n) {
    var m = /^([A-G])(#|b)?(\d)$/.exec(n), b = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    return 440 * Math.pow(2, (b + (+m[3] - 4) * 12) / 12);
}

function musicEngine(ctx, out) {
    var E = { step: 0, next: 0 }, sr = ctx.sampleRate, i, c;
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 3;
    comp.connect(out);
    var bus = ctx.createGain(), dry = ctx.createGain(), wet = ctx.createGain(), conv = ctx.createConvolver(), ir = ctx.createBuffer(2, Math.floor(sr * 2.4), sr);
    for (c = 0; c < 2; c++) {
        var d = ir.getChannelData(c);
        for (i = 0; i < d.length; i++)
            d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3.2);
    }
    conv.buffer = ir;
    dry.gain.value = 1;
    wet.gain.value = .04;
    // soften the top end: pulse waves are very bright, so roll off the highs and add a gentle low-mid warmth
    var tone = lp(2600, .4), shelf = ctx.createBiquadFilter();
    shelf.type = 'highshelf';
    shelf.frequency.value = 1400;
    shelf.gain.value = -5;
    bus.connect(tone);
    tone.connect(shelf);
    shelf.connect(dry);
    shelf.connect(conv);
    conv.connect(wet);
    dry.connect(comp);
    wet.connect(comp);
    var nb = ctx.createBuffer(1, Math.floor(sr * .5), sr), nd = nb.getChannelData(0);
    for (i = 0; i < nd.length; i++)
        nd[i] = Math.random() * 2 - 1;
    function osc(type, f, t, end, det) { var o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); if (det)
        o.detune.setValueAtTime(det, t); o.start(t); o.stop(end); return o; }
    function vca(t, a, v, hold, rel) { var g = ctx.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.setValueAtTime(v, t + Math.max(a, hold)); g.gain.exponentialRampToValueAtTime(.0001, t + Math.max(a, hold) + rel); return g; }
    function lp(f, q) { var b = ctx.createBiquadFilter(); b.type = 'lowpass'; b.frequency.value = f; b.Q.value = q || .7; return b; }
    // 8-bit style: pulse-wave lead, triangle bass, noise drums, no reverb
    var PW = {};
    function pulse(d) {
        if (!PW[d]) {
            var n = 40, re = new Float32Array(n), im = new Float32Array(n);
            for (var k = 1; k < n; k++)
                re[k] = 2 * Math.sin(k * Math.PI * d) / (k * Math.PI);
            PW[d] = ctx.createPeriodicWave(re, im);
        }
        return PW[d];
    }
    function pOsc(d, f, t, end) { var o = ctx.createOscillator(); o.setPeriodicWave(pulse(d)); o.frequency.setValueAtTime(f, t); o.start(t); o.stop(end); return o; }
    E.pizz = function (f, t, v) {
        var o = osc('triangle', f, t, t + .3), g = vca(t, .003, v * 2.2, .02, .2);
        o.connect(g);
        g.connect(bus);
    };
    E.clar = function (f, t, dur, v) {
        var o = pOsc(.25, f, t, t + dur + .1), g = vca(t, .006, v * .8, dur * .75, .05);
        o.connect(g);
        g.connect(bus);
    };
    E.str = function (fs, t, dur, v) {
        if (fs.length === 1) {
            var o1 = pOsc(.125, fs[0], t, t + dur + .05), g1 = vca(t, .006, v * .5, dur * .8, .04);
            o1.connect(g1);
            g1.connect(bus);
            return;
        }
        var n = 6, step = dur / n;
        for (var j = 0; j < n; j++) {
            var o = pOsc(.125, fs[[0, 1, 2, 1, 2, 1][j]], t + j * step, t + (j + 1) * step), g = vca(t + j * step, .004, v * .55, step * .6, .03);
            o.connect(g);
            g.connect(bus);
        }
    };
    // brass: a sawtooth and a square wave through a filter that opens on the attack, like a horn blat, with a little 8-bit edge from the square
    E.brass = function (f, t, dur, v) {
        var e = t + dur + .1, o1 = osc('sawtooth', f, t, e), o2 = pOsc(.5, f * 1.004, t, e), fl = lp(f * 1.6, 1.1), g = vca(t, .028, v * .75, dur * .85, .07), m = ctx.createGain();
        m.gain.value = .5;
        fl.frequency.setValueAtTime(f * 1.6, t);
        fl.frequency.linearRampToValueAtTime(f * 5, t + .07);
        fl.frequency.exponentialRampToValueAtTime(f * 2.6, t + Math.max(.12, dur));
        o1.connect(fl);
        o2.connect(m);
        m.connect(fl);
        fl.connect(g);
        g.connect(bus);
    };
    E.glock = function (f, t, v) {
        var o = osc('triangle', f, t, t + .22), g = vca(t, .002, v * 1.4, .01, .16);
        o.connect(g);
        g.connect(bus);
    };
    E.snare = function (t, v) {
        var s = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), g = vca(t, .001, v * .6, .003, .07);
        s.buffer = nb;
        hp.type = 'highpass';
        hp.frequency.value = 1100;
        s.connect(hp);
        hp.connect(g);
        g.connect(bus);
        s.start(t);
        s.stop(t + .12);
    };
    E.timp = function (f, t, v) {
        var o = osc('triangle', f * 2, t, t + .25), g = vca(t, .002, v * 1.3, .01, .2);
        o.frequency.exponentialRampToValueAtTime(Math.max(30, f * .6), t + .18);
        o.connect(g);
        g.connect(bus);
    };
    E.play = function (t, step, L, sd) {
        var s = step % 192, bar = Math.floor(s / 6), pos = s % 6, cyc = Math.floor(step / 192), quiet = (cyc % 4 === 3 && bar < 8 || L.night) && !L.battle, ch = CHN[MCH[bar]], root = ch[0], k, at = 0, ev = null;
        for (k = 0; k < MEL[bar].length; k++) {
            if (at === pos)
                ev = MEL[bar][k];
            at += MEL[bar][k][1];
        }
        if (pos === 0)
            E.pizz(noteF(root + (root < 'C' ? '2' : '2')), t, .2);
        if (pos === 3)
            E.pizz(noteF(ch[2] + '2'), t, .15);
        if (pos === 5 && !quiet)
            E.pizz(noteF(root + '3'), t, .07);
        if (!quiet) {
            var sv = L.battle ? .32 : .13;
            if (pos === 0 || pos === 3)
                E.snare(t, sv * (pos === 0 ? 1 : .85));
            else if (pos === 2 || pos === 5)
                E.snare(t, sv * .35);
            if (L.battle && bar % 8 === 7 && pos >= 3)
                for (k = 0; k < 3; k++)
                    E.snare(t + k * sd / 3, sv * (.5 + k * .15));
        }
        if (ev && ev[0]) {
            var f = noteF(ev[0]), dur = ev[1] * sd;
            E.clar(f, t, dur * .92, quiet ? .04 : (L.brass ? .055 : .085));
            if (L.strings && bar >= 8)
                E.str([f], t, dur * .95, .06);
            if (L.brass || L.battle) {
                E.brass(f, t, dur * .9, quiet ? .04 : .06);
                E.brass(f / 2, t, dur * .9, quiet ? .025 : .04);
            }
            if (L.glock && pos === 0)
                E.glock(f * 2, t, .05);
        }
        if (L.strings && pos === 0 && !quiet)
            E.str(ch.map(function (n, j) { return noteF(n + (j === 0 ? '3' : '4')); }), t, sd * 6, .07);
        if ((L.brass || L.battle) && (bar === 3 || bar === 7 || bar === 12 || bar === 15 || bar === 23 || bar === 31) && (pos === 0 || pos === 3)) {
            var top = noteF('E5');
            E.brass(top, t, sd * 1.6, .075);
            E.brass(top * .7937, t, sd * 1.6, .06);
            E.brass(top * .6674, t, sd * 1.6, .055);
            E.timp(noteF(root + '2'), t, .3);
        }
        if ((L.brass || L.battle) && pos === 0 && bar % 4 === 0)
            E.timp(noteF(root + '2'), t, L.battle ? .32 : .2);
        if (L.boss && pos === 3)
            E.timp(noteF('E2'), t, .22);
    };
    return E;
}

function musicLayers() { var p = popn(); return { strings: p >= 15, brass: p >= 12, glock: S.tier >= 2, battle: foes.length > 0 || !!RAID, night: (function () { var h = new Date().getHours(); return h >= 21 || h < 6; })(), boss: foes.some(function (f) { return f.boss; }) }; }

function musicStepDur(L) { return L.battle ? .2 : L.night ? .29 : .25; }

function musicTick() {
    if (!MUS.eng || !AC || AC.state !== 'running')
        return;
    var now = AC.currentTime, E = MUS.eng;
    if (E.next < now)
        E.next = now + .06;
    while (E.next < now + .3) {
        var L = musicLayers(), sd = musicStepDur(L);
        E.play(E.next, E.step, L, sd);
        E.next += sd;
        E.step++;
    }
}

function musicSync() {
    if (!MUS.gain || !AC)
        return;
    var want = MUS.on && !mut && !document.hidden ? .153 : 0;
    MUS.gain.gain.setTargetAtTime(want, AC.currentTime, .25);
    var b = $('mus');
    if (b)
        b.textContent = MUS.on ? 'Music on' : 'Music off';
    if (want && !MUS.timer)
        MUS.timer = setInterval(musicTick, 60);
    if (!want && MUS.timer) {
        clearInterval(MUS.timer);
        MUS.timer = null;
    }
}

function musicStart() {
    var a = au();
    if (!a || MUS.eng)
        return musicSync();
    MUS.gain = a.createGain();
    MUS.gain.gain.value = 0;
    MUS.gain.connect(a.destination);
    MUS.eng = musicEngine(a, MUS.gain);
    musicSync();
}

// the Music on/off button (called once from boot.js)
function initMusicButton() {
    $('mus').onclick = function () {
        MUS.on = !MUS.on;
        try {
            localStorage.setItem('thecolony_music', MUS.on ? '1' : '0');
        }
        catch (e) { }
        musicStart();
        musicSync();
    };
}
