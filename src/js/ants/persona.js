/* ants/persona.js
   Every ant is somebody (build 93). Each drawn ant has a personality fixed from its seed, and it changes what
   she visibly does: Bold ants lead the charge, Curious ones stop to sniff, Friendly ones greet every sister,
   Tireless ones work on when others rest, Gentle ones stop to check on the hurt. Ants also remember what they
   have done this session (waves fought, loads carried, sisters met) and become Veterans, marked with a gold
   chevron and shown on the info card. Memories live on the drawn ants only (not saved).
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

var PERS = [
    { n: 'Bold', d: 'First into every fight' },
    { n: 'Curious', d: 'Stops to sniff at everything' },
    { n: 'Friendly', d: 'Greets every sister she passes' },
    { n: 'Tireless', d: 'Works on long after the others rest' },
    { n: 'Gentle', d: 'Always stops to check on the hurt' }
];
// fighters can be Bold, the rest Curious instead; Friendly, Tireless and Gentle can be anyone
function pers(m) { if (!m || m.u == null) return -1; var i = Math.floor(trait(m, 6) * 4) % 4; return i ? i + 1 : m.k === 2 || m.k === 4 ? 0 : 1; }
function mem(m) { return m.mem || (m.mem = { w: 0, l: 0, g: 0, h: 0, s: 0 }); }
function isVet(m) { var o = m.mem; return !!o && (o.w >= 3 || o.l >= 30); }

// small idle behaviours that read as thought: curious foragers stop to sniff
function personaTick(dt) {
    for (var i = 0; i < marchers.length; i++) {
        var m = marchers[i];
        if (m.k === 1 && pers(m) === 1 && !m.inj && !(m.gt > 0) && !(m.wait > 0) && !m.sf && !(m.pk > 0) && m.p < .97 && Math.random() < dt * .02) {
            m.gt = 1.5;
            m.gtx = 'Sniffing at something interesting';
            mem(m).s++;
            var a = at(m.p);
            fx.push({ x: a.x, y: a.y - 9, vx: 0, vy: -9, l: .9, t: '?', f: 11, c: '#cfe9d8', g: 0 });
        }
    }
}

// a sister was just hurt: those close by stop to check on her (Gentle ants from further off)
function sisterHurt(h) {
    if (h.wx == null)
        return;
    for (var i = 0; i < marchers.length; i++) {
        var m = marchers[i];
        if (m === h || m.inj || m.gt > 0 || m.wx == null || ((m.k === 2 || m.k === 4) && foes.length))
            continue;
        var r = pers(m) === 4 ? 46 : 16;
        if (Math.abs(m.wx - h.wx) < r && Math.abs(m.wy - h.wy) < r) {
            m.gt = 1.6;
            m.gtx = 'Checking on a hurt sister';
            mem(m).h++;
            fx.push({ x: m.wx, y: m.wy - 9, vx: 0, vy: -10, l: 1, t: '♥', f: 11, c: '#ff9db0', g: 0 });
        }
    }
}

// called when a wave or raid is beaten: everyone who stood in the fight remembers it
function fightMemory() {
    var told = 0;
    marchers.forEach(function (m) { if (!m.fw)
        return;
    m.fw = 0;
    if ((m.k === 2 || m.k === 4) && !m.inj) {
        var o = mem(m), was = isVet(m);
        o.w++;
        if (!was && isVet(m) && m.wx != null) {
            if (!told++)
                feed(antIdent({ t: 'm', o: m }).name + ' the ' + CN[m.k].toLowerCase() + ' is now a veteran of ' + o.w + ' fights.', 'good', function () { return m.wx != null ? { x: m.wx, y: m.wy } : null; });
            fx.push({ x: m.wx, y: m.wy - 14, vx: 0, vy: -16, l: 1.6, t: 'Veteran!', f: 12, c: '#ffd35a', g: 0 });
        }
    } });
}

// gold chevron over a veteran, only when zoomed in enough to read it
function vetMark(x, y, m) {
    if (uz < 1.3 || !isVet(m))
        return;
    var by = y - (m.k === 4 ? 15 : 9);
    cx.strokeStyle = '#ffd35a';
    cx.lineWidth = 1.3;
    cx.beginPath();
    cx.moveTo(x - 2.6, by - 1.2);
    cx.lineTo(x, by + 1);
    cx.lineTo(x + 2.6, by - 1.2);
    cx.stroke();
}

// extra info-card rows: personality and the ant's story so far
function personaRows(s) {
    if (s.t !== 'm')
        return '';
    var o = s.o, p = pers(o), m = o.mem, st = [];
    if (p < 0)
        return '';
    if (m) {
        if (m.w)
            st.push(m.w + (m.w === 1 ? ' fight' : ' fights'));
        if (m.l)
            st.push(m.l + (m.l === 1 ? ' load carried' : ' loads carried'));
        if (m.g)
            st.push(m.g + (m.g === 1 ? ' sister met' : ' sisters met'));
        if (m.h)
            st.push('checked on ' + m.h + ' hurt');
        if (m.s)
            st.push('sniffed out ' + m.s + ' things');
    }
    return '<div class="arow"><i>Personality</i><span>' + PERS[p].n + ': ' + PERS[p].d.toLowerCase() + '</span></div>' +
        (st.length ? '<div class="arow"><i>' + (isVet(o) ? 'Veteran' : 'Story') + '</i><span>' + st.join(' · ') + '</span></div>' : '');
}
