/* ui/opening.js
   The opening scene for new players: a dark cavern, the queen slowly lit from the dark, her eyes
   ignite, she lays the first egg, and the title rises. About 9 seconds; a tap skips it or carries on.
   Plays every time the game is opened, after PLAY on the title screen (new players then get How to play).
   The Menu can replay it.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

var OPEN_PENDING = null;

function openingPlay(done) {
    var el = document.createElement('div'), c, g, t0 = performance.now(), wasDead = dead, fin = false, i, laid = false, lit = false, rised = false;
    var motes = [], rocks = [], reduce = false;
    try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { }
    el.id = 'opening';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Opening scene. Tap to continue.');
    el.innerHTML = '<canvas></canvas><div class="op-t" id="opt1">Deep beneath the roots…</div><div class="op-t" id="opt2">…a queen awakens.</div>' +
        '<img src="logo.jpg" alt="Antropolis" id="oplogo"><div class="op-skip" id="opskip">Tap to skip</div>';
    document.body.appendChild(el);
    c = el.querySelector('canvas');
    g = c.getContext('2d');
    dead = true;
    for (i = 0; i < 70; i++)
        motes.push({ x: Math.random(), y: Math.random(), v: .006 + Math.random() * .018, r: .5 + Math.random() * 1.6, p: Math.random() * 7 });
    // roots hanging down from the ceiling, thick at the top and tapering
    for (i = 0; i < 11; i++)
        rocks.push({ x: (i + Math.random() * .8) / 11, l: .16 + Math.random() * .3, w: 3 + Math.random() * 7, c: (Math.random() - .5) * .12, p: Math.random() * 7 });
    function size() {
        var d = Math.min(2, window.devicePixelRatio || 1);
        c.width = Math.round(innerWidth * d);
        c.height = Math.round(innerHeight * d);
        g.setTransform(d, 0, 0, d, 0, 0);
    }
    size();
    window.addEventListener('resize', size);
    function cl(v) { return Math.max(0, Math.min(1, v)); }
    function ease(v) { v = cl(v); return v * v * (3 - 2 * v); }
    function show(id, on) { var e = document.getElementById(id); if (e) e.classList.toggle('on', on); }
    function step(now) {
        if (fin)
            return;
        var t = (now - t0) / 1000, W = innerWidth, H = innerHeight, mx = W / 2, my = H * .43;
        var rev = reduce ? 1 : ease((t - .8) / 3.6), s = Math.min(W * .95, H * .55) / 8 * (reduce ? 1 : .86 + .14 * ease((t - .5) / 7));
        // the cavern: black at first, then lit warm red around the queen
        g.fillStyle = '#000';
        g.fillRect(0, 0, W, H);
        var R = Math.max(W, H) * (.3 + .5 * rev), gr = g.createRadialGradient(mx, my, 4, mx, my, R);
        gr.addColorStop(0, 'rgba(84,26,16,' + .95 * rev + ')');
        gr.addColorStop(.45, 'rgba(40,12,7,' + .85 * rev + ')');
        gr.addColorStop(1, 'rgba(0,0,0,1)');
        g.fillStyle = gr;
        g.fillRect(0, 0, W, H);
        // roots hanging from the ceiling, swaying a little, lit faintly from below
        g.lineCap = 'round';
        rocks.forEach(function (r) {
            var x0 = r.x * W, L = r.l * H, sw = Math.sin(t * .6 + r.p) * 6, n = 8, k;
            for (k = 0; k < n; k++) {
                var u0 = k / n, u1 = (k + 1) / n;
                g.strokeStyle = 'rgba(14,5,3,' + (.95 - .3 * u0) + ')';
                g.lineWidth = Math.max(.6, r.w * (1 - u0 * .85));
                g.beginPath();
                g.moveTo(x0 + r.c * W * u0 * u0 + sw * u0 * u0, L * u0 - 4);
                g.lineTo(x0 + r.c * W * u1 * u1 + sw * u1 * u1, L * u1 - 4);
                g.stroke();
            }
            g.strokeStyle = 'rgba(255,90,60,' + .12 * rev + ')';
            g.lineWidth = 1;
            g.beginPath();
            g.moveTo(x0 + 1, 0);
            g.quadraticCurveTo(x0 + r.c * W * .25 + sw * .25 + 1, L * .5, x0 + r.c * W + sw + 1, L);
            g.stroke();
        });
        // a pulsing backlight so her black armour shows against the dark
        var bl = (.35 + .1 * Math.sin(t * 2.1)) * rev, bg2 = g.createRadialGradient(mx, my, s * .5, mx, my, s * 4.2);
        bg2.addColorStop(0, 'rgba(255,70,40,' + bl + ')');
        bg2.addColorStop(1, 'rgba(255,70,40,0)');
        g.fillStyle = bg2;
        g.fillRect(0, 0, W, H);
        // the queen, head up, swapped onto this canvas for a moment
        var oc = cx, op = pulse, ofx = Q.fx, osv = Q.sv, ep = t >= 5.4 && t < 6.2 ? Math.max(0, 1 - (t - 5.4) / .8) : 0;
        cx = g;
        pulse = ep;
        Q.fx = 1;
        Q.sv = 0;
        g.save();
        g.globalAlpha = reduce ? 1 : cl((t - .6) / 2.6);
        g.translate(mx, my);
        g.rotate(-Math.PI / 2);
        try { queen(s, 0); } catch (e) { }
        g.restore();
        cx = oc;
        pulse = op;
        Q.fx = ofx;
        Q.sv = osv;
        // her eyes ignite
        var hy = my - s * 1.75, fl = t > 4 ? Math.max(0, 1 - (t - 4) / 1.4) : 0;
        if (t > 4 && !lit) { lit = true; try { SFX.boom(); } catch (e) { } }
        if (fl > 0) {
            g.save();
            g.globalCompositeOperation = 'lighter';
            var fg = g.createRadialGradient(mx, hy, 0, mx, hy, s * (1.2 + 2.5 * (1 - fl)));
            fg.addColorStop(0, 'rgba(255,90,60,' + .8 * fl + ')');
            fg.addColorStop(1, 'rgba(255,40,20,0)');
            g.fillStyle = fg;
            g.fillRect(0, 0, W, H);
            g.restore();
        }
        // the first egg rolls out of the sac and glows
        if (t >= 5.4) {
            if (!laid) { laid = true; try { SFX.lay(); } catch (e) { } }
            var et = ease((t - 5.4) / 1.4), ey = my + s * (3.5 + 1.1 * et), ea = cl((t - 5.5) / .4);
            var eg = g.createRadialGradient(mx, ey, 0, mx, ey, s * 1.1);
            eg.addColorStop(0, 'rgba(255,170,120,' + .55 * ea + ')');
            eg.addColorStop(1, 'rgba(255,120,80,0)');
            g.fillStyle = eg;
            g.beginPath(); g.arc(mx, ey, s * 1.1, 0, 7); g.fill();
            g.fillStyle = 'rgba(250,238,215,' + ea + ')';
            g.beginPath(); g.ellipse(mx, ey, s * .26, s * .34, 0, 0, 7); g.fill();
            g.fillStyle = 'rgba(255,255,255,' + .6 * ea + ')';
            g.beginPath(); g.ellipse(mx - s * .08, ey - s * .12, s * .06, s * .09, -.4, 0, 7); g.fill();
        }
        // dust drifting up through the light
        motes.forEach(function (m) {
            m.y -= m.v * .016;
            if (m.y < -.02) m.y = 1.02;
            var a = (.15 + .35 * (.5 + .5 * Math.sin(t * 1.3 + m.p))) * rev;
            g.fillStyle = 'rgba(255,190,150,' + a + ')';
            g.beginPath(); g.arc(m.x * W + Math.sin(t * .7 + m.p) * 8, m.y * H, m.r, 0, 7); g.fill();
        });
        // vignette
        var vg = g.createRadialGradient(mx, my, Math.min(W, H) * .35, mx, my, Math.max(W, H) * .75);
        vg.addColorStop(0, 'rgba(0,0,0,0)');
        vg.addColorStop(1, 'rgba(0,0,0,.75)');
        g.fillStyle = vg;
        g.fillRect(0, 0, W, H);
        show('opt1', t > 1.2 && t < 3.3);
        show('opt2', t > 4.3 && t < 6.8);
        if (t > 7 && !rised) {
            rised = true;
            show('oplogo', true);
            var sk = document.getElementById('opskip');
            if (sk) { sk.textContent = 'Tap to begin'; sk.classList.add('go'); }
        }
        requestAnimationFrame(step);
    }
    function end() {
        if (fin)
            return;
        fin = true;
        el.classList.add('out');
        setTimeout(function () {
            if (el.parentNode)
                el.parentNode.removeChild(el);
            window.removeEventListener('resize', size);
            dead = wasDead;
            if (done)
                done();
        }, 600);
    }
    el.addEventListener('click', end);
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') end(); });
    el.tabIndex = 0;
    try { el.focus(); } catch (e) { }
    requestAnimationFrame(step);
}
