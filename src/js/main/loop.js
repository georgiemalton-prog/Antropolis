/* main/loop.js
   The main loop: one frame of simulation and drawing.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

function frame(n) {
    var fpsCap = fpsCapNow();
    // frame limiter: keep to an even beat (every 2nd frame on a 60Hz screen, every 4th on 120Hz).
    // Each frame is due one interval after the last one was due, with a little slack for timing noise,
    // so frames never drift and skip a beat (that showed as all the ants hitching at once).
    if (fpsCap) {
        var iv = 1000 / fpsCap;
        if (frame.due && n < frame.due - iv * .2) {
            requestAnimationFrame(frame);
            return;
        }
        frame.due = frame.due && n - frame.due < iv ? frame.due + iv : n + iv;
    }
    else
        frame.due = 0;
    var dt = Math.min((n - lt) / 1000, .1);
    lt = n;
    statsTick(dt);
    if (tab !== 'col' && !battery)
        rqTick(dt);
    if (!dead) {
        S.days = (S.days || 0) + dt / 180;
        if (!foes.length)
            S.queenHp = Math.min(hpMax(), S.queenHp + (S.classLevel[0] >= 4 ? .24 : .08) * dt);
        firstFoesTick(dt);
        if (S.dug >= 1 && !foes.length && !wvi.w && n > nf) {
            if ((S.wave + 1) % 10 === 0 && !bossWarned) {
                bossWarned = true;
                nf = n + (healthy(3) > 0 ? 45000 : 4000);
                toast(healthy(3) > 0 ? 'Scouts spotted a giant coming! You have about 45 seconds: raise the guards, stock food and build a Barracks.' : 'Something huge is coming!');
            }
            else
                wave();
        }
        var team = dps() * (.8 + .5 * S.orders.gd / 100) / (foes.length || 1), softShare = Math.max(0, 1 - majorDps() / Math.max(1, dps())), armBlock = .4 * softShare * Math.max(.1, 1 - .2 * S.bld.rax);
        foes = foes.filter(function (f) {
            f.p = Math.min(1, f.p + .02 * (f.tp === 3 ? .55 : 1) * dt);
            var a = at(f.p);
            if (f.p > .05) {
                var d = team * dt * (f.tp === 0 ? 1 - armBlock : 1);
                f.hp -= d;
                f.acc += d;
                f.tm -= dt;
                f.at -= dt;
                if (f.kl > 0) {
                    f.kt -= dt;
                    if (f.kt <= 0) {
                        f.kt = 1.6;
                        f.kl--;
                        kill();
                        fx.push({ x: a.x, y: a.y - 10, vx: 0, vy: -26, l: .9, t: '-1 ant', f: 11, c: '#ff8a7a', g: 0 });
                    }
                }
                if (f.p >= 1)
                    S.queenHp -= (1 + S.wave * .15) * (f.boss ? 2.5 : 1) * dt;
                if (f.tm <= 0) {
                    f.tm = .45;
                    var big = f.acc > f.max * .08;
                    fx.push({ x: a.x + a.nx * f.o + Math.random() * 16 - 8, y: a.y - 12, vx: (Math.random() - .5) * 18, vy: -38, l: .85, t: fmt(Math.max(1, Math.round(f.acc))), f: big ? 14 : 11, c: big ? '#ffe27a' : '#ffd35a', g: 30, pop: 1 });
                    f.acc = 0;
                    f.hf = .16;
                    f.kb = Math.min(3.5, (f.kb || 0) + 2.2);
                }
                if (f.at <= 0) {
                    f.at = .7 + Math.random() * .4;
                    f.atk = .32;
                    shake = Math.max(shake, f.boss ? .3 : .1);
                    SFX.hit();
                    var hx3 = a.x + Math.cos(a.ang) * foeSz(f) * 1.8, hy3 = a.y + Math.sin(a.ang) * foeSz(f) * 1.8;
                    fx.push({ x: hx3, y: hy3, vx: 0, vy: 0, l: .3, slash: foeSz(f) * 1.3, ang: a.ang, c: '#ff8a6a', g: 0 });
                    for (var j = 0; j < 4; j++)
                        fx.push({ x: hx3, y: hy3, vx: Math.random() * 90 - 45, vy: Math.random() * 90 - 55, l: .3, c: '#b8342a', s: 2.2, g: 120 });
                }
                f.hf = Math.max(0, (f.hf || 0) - dt);
                f.atk = Math.max(0, (f.atk || 0) - dt);
                f.kb = Math.max(0, (f.kb || 0) - dt * 14);
                f.hd = f.hd == null ? f.hp : Math.max(f.hp, f.hd - f.max * .5 * dt);
            }
            if (f.hp <= 0) {
                for (var k = 0; k < 16; k++)
                    fx.push({ x: a.x, y: a.y, vx: Math.random() * 160 - 80, vy: Math.random() * 160 - 80, l: .7, c: k % 2 ? '#ffd35a' : '#fff', s: 4, g: 80 });
                fx.push({ x: a.x, y: a.y, vx: 0, vy: 0, l: .6, ring: 4, c: 'rgba(255,220,140,.9)', g: 0 });
                if (f.boss) {
                    shake = .7;
                    SFX.boom();
                }
                lastP = f.p;
                // flips over, twitches and sinks; the carcass is left once it has settled
                dyingF.push({ p: f.p, o: f.o, tp: f.tp, sz: foeSz(f), boss: f.boss, t: 0, c: { x: a.x, y: a.y, t: 10, tp: f.tp, v: Math.ceil((4 + S.tier * 5) * (f.boss ? 4 : 1)) } });
                return false;
            }
            return true;
        });
        for (var di = dyingF.length - 1; di >= 0; di--) {
            dyingF[di].t += dt;
            if (dyingF[di].t >= 1.1) {
                carc.push(dyingF[di].c);
                dyingF.splice(di, 1);
            }
        }
        if (wvi.w && !foes.length) {
            wvi.w = 0;
            loot(lastP, wvi);
            nf = n + 90000 + Math.random() * 60000;
        }
        if (S.queenHp <= 0)
            lose();
    }
    if (n - sy > 1000) {
        trackRates((n - sy) / 1000);
        sy = n;
        sync();
        save();
    }
    pulse = Math.max(0, pulse - dt * 5);
    queenWalk(dt);
    fallenTick(dt);
    if (shake > 0) {
        shake = Math.max(0, shake - dt);
        var s = shake * 14;
        cv.style.transform = still ? '' : 'translate(' + (Math.random() * s - s / 2) + 'px,' + (Math.random() * s - s / 2) + 'px)';
    }
    else if (cv.style.transform)
        cv.style.transform = '';
    fx = fx.filter(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g || 0) * dt; p.l -= dt; return p.l > 0; });
    var lo = 1 - S.dug;
    marchers.forEach(function (m) { energyStep(m, dt); if (m.nap > 0)
        return; if (m.k === 1) {
        forageStep(m, dt, .06);
        return;
    } if (m.k === 2 || m.k === 4 || m.cr) {
        // soldiers and super majors are walked to their guard posts in moveArmy; this old end-to-end march only made them shuttle
        m.ph += dt * 8 * m.v;
        return;
    } m.p += m.d * m.v * (still ? 0 : 26 / Math.max(1, LEN)) * dt; if (m.p > 1) {
        m.p = 1;
        m.d = -1;
    }
    else if (m.p < lo) {
        m.p = lo;
        m.d = 1;
    } m.ph += dt * 8 * m.v; });
    crewA.forEach(function (a) { if (a.en == null)
        a.en = 55 + Math.random() * 45; a.en = a.st === 'idle' ? Math.min(100, a.en + dt * 5) : Math.max(32, a.en - dt * 100 / 700); });
    if (sel && selFollow && tab === 'tun' && sel.o.wx != null) {
        camT = camClamp(sel.o.wy - H / (2 * uz));
        camX += (camXc(sel.o.wx - W / (2 * uz)) - camX) * Math.min(1, dt * 8);
        follow = performance.now() + 3000;
    }
    queueForagers();
    cam += (camT - cam) * Math.min(1, dt * 8);
    if (tab === 'nest' && !mapIsOpen())
        drawNest(n);
    else if (tab !== 'col' && !mapIsOpen())
        drawT(n);
    updateSel();
    simTick();
    if (!(n - (frame.ut || 0) < 160)) {
        frame.ut = n;
        ui();
    }
    requestAnimationFrame(frame);
}

function drawDeadQueen() {
    if (S.tier > 0 || !cav)
        return;
    var cvn = cav(), sdw = QX < W * .5 ? -1 : 1, x = QX - sdw * 92, y = QY + 30, ex = (x - cvn.x) / (cvn.rx - 16), ey = (y - cvn.y) / (cvn.ry - 14), r2 = ex * ex + ey * ey, k = Math.max(.35, Math.min(1, S.food / 40 + .3));
    if (r2 > 1) {
        x = cvn.x + (x - cvn.x) / Math.sqrt(r2);
        y = cvn.y + (y - cvn.y) / Math.sqrt(r2);
    }
    cx.save();
    cx.translate(x, y - cam);
    cx.rotate(sdw * .18);
    cx.scale(sdw * k, k);
    cx.globalAlpha = .9;
    cx.fillStyle = 'rgba(0,0,0,.28)';
    cx.beginPath();
    cx.ellipse(0, 6, 17, 4.5, 0, 0, 7);
    cx.fill();
    cx.strokeStyle = '#4a3a2c';
    cx.lineWidth = 1;
    for (var l = 0; l < 3; l++) {
        cx.beginPath();
        cx.moveTo(-1 + l * 3, 2);
        cx.quadraticCurveTo(-3 + l * 3, -6 - l, 1 + l * 3, -7);
        cx.stroke();
        cx.beginPath();
        cx.moveTo(-1 + l * 3, 4);
        cx.quadraticCurveTo(-6 + l * 3, 9, -3 + l * 3, 11);
        cx.stroke();
    }
    cx.fillStyle = '#5b4637';
    cx.beginPath();
    cx.ellipse(-9, 3, 9, 5.5, 0, 0, 7);
    cx.fill();
    cx.fillStyle = '#6b5443';
    cx.beginPath();
    cx.ellipse(3, 2.5, 4.5, 3.6, 0, 0, 7);
    cx.fill();
    cx.fillStyle = '#5b4637';
    cx.beginPath();
    cx.ellipse(11, 3.5, 3.6, 3, .2, 0, 7);
    cx.fill();
    cx.strokeStyle = 'rgba(200,190,170,.35)';
    cx.lineWidth = .8;
    cx.beginPath();
    cx.moveTo(1, 0);
    cx.lineTo(-7, -4);
    cx.moveTo(2, 0);
    cx.lineTo(-4, -6);
    cx.stroke();
    cx.restore();
}

function drawT(now) { drawWorld(now); drawTrails(now); drawRooms(now); drawLarder(now); drawArmoury(now); drawCrickets(now); drawCaves(now); drawMole(now); drawHill(now); drawFood(now); drawGold(now); drawDeadQueen(); lighting(now); eggs(now); drawArmy(now); drawCrew(now); drawFarDig(now); drawFoesFx(now); drawSel(now); deco(now); }
var lastTouchEnd = 0;
