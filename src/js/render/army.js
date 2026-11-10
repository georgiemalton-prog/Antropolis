/* render/army.js
   Drawing the marching ants each frame (smoothing, fights, jobs), the fallen and the selection ring.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

// ants that fall in battle lie curled on their backs for a few seconds, then fade
var fallen = [], BITE = 0, dyingF = [], FOEST = null;

function fallenTick(dt) { for (var i = fallen.length - 1; i >= 0; i--) {
    var fa = fallen[i];
    if (fa.vx) {
        // knocked flying, tumbling, then it lies still
        fa.x += fa.vx * dt;
        fa.y += fa.vy * dt;
        fa.vy += 160 * dt;
        fa.ang += fa.sp * dt;
        var dmp = Math.max(0, 1 - 5 * dt);
        fa.vx *= dmp;
        fa.sp *= dmp;
        if (fa.t < 4.55) {
            fa.vx = 0;
            fa.vy = 0;
        }
    }
    fallen[i].t -= dt;
    if (fallen[i].t <= 0)
        fallen.splice(i, 1);
} }

function drawFallen() {
    for (var i = 0; i < fallen.length; i++) {
        var f = fallen[i], u = SZ[f.k] * 1.55 / 3.6 * .72, j;
        cx.save();
        cx.globalAlpha = Math.min(1, f.t / 1.5) * .9;
        cx.translate(f.x, f.y);
        cx.rotate(f.ang + f.s * .7);
        cx.fillStyle = 'rgba(0,0,0,.22)';
        cx.beginPath();
        cx.ellipse(0, u * .3, u * 2.2, u * .9, 0, 0, 7);
        cx.fill();
        cx.strokeStyle = '#120a05';
        cx.lineWidth = Math.max(.3, u * .35);
        cx.lineCap = 'round';
        cx.beginPath();
        for (j = -1; j <= 1; j++) {
            cx.moveTo(j * u * .55, -u * .2);
            cx.lineTo(j * u * .55 + u * .3, -u * 1.1);
            cx.lineTo(j * u * .55 - u * .2, -u * 1.6);
            cx.moveTo(j * u * .55, u * .2);
            cx.lineTo(j * u * .55 + u * .3, u * 1.1);
            cx.lineTo(j * u * .55 - u * .2, u * 1.5);
        }
        cx.stroke();
        cx.fillStyle = '#2b1509';
        cx.beginPath();
        cx.ellipse(-u * 1.5, 0, u * 1.1, u * .8, 0, 0, 7);
        cx.fill();
        cx.beginPath();
        cx.ellipse(0, 0, u * .7, u * .5, 0, 0, 7);
        cx.fill();
        cx.beginPath();
        cx.arc(u * 1.2, 0, u * .6, 0, 7);
        cx.fill();
        cx.fillStyle = CC[f.k];
        cx.globalAlpha *= .55;
        cx.beginPath();
        cx.ellipse(-u * 1.5, 0, u * .6, u * .4, 0, 0, 7);
        cx.fill();
        cx.restore();
    }
}

function smoothPos(o, x, y, ang, now) {
    // a bad position (eg a job that has not set its spot yet) is skipped, and a broken smoothed one is reset,
    // so one bad frame can never leave an ant stuck as 'not a number' for good
    if (!isFinite(x) || !isFinite(y)) {
        x = isFinite(o.sx) ? o.sx : 0;
        y = isFinite(o.sy) ? o.sy : 0;
    }
    if (!isFinite(ang))
        ang = isFinite(o.sa) ? o.sa : 0;
    if (!isFinite(o.sx) || !isFinite(o.sy) || !isFinite(o.sa))
        o.sx = null;
    var dt = (now - (o.lt || 0)) / 1000;
    o.lt = now;
    if (o.gp == null || !isFinite(o.gp))
        o.gp = Math.random() * 6;
    if (dt > 0 && dt < .25) {
        var still = o.rx != null && Math.abs(x - o.rx) < .06 && Math.abs(y - o.ry) < .06;
        o.it = still ? (o.it || 0) + dt : 0;
        if (o.it > 1.2) {
            o.ft = (o.ft || 0) - dt;
            if (o.ft <= 0) {
                o.ft = 1.4 + Math.random() * 3.6;
                o.fa2 = (Math.random() - .5) * .9;
                o.fs2 = Math.random() < .45 ? (Math.random() - .35) * 1.6 : 0;
            }
        }
        else {
            o.fa2 = 0;
            o.fs2 = 0;
        }
        o.fa1 = (o.fa1 || 0) + ((o.fa2 || 0) - (o.fa1 || 0)) * Math.min(1, dt * 3);
        o.fs1 = (o.fs1 || 0) + ((o.fs2 || 0) - (o.fs1 || 0)) * Math.min(1, dt * 3);
    }
    o.rx = x;
    o.ry = y;
    if (o.fa1 || o.fs1) {
        ang += o.fa1 || 0;
        x += Math.cos(ang) * (o.fs1 || 0);
        y += Math.sin(ang) * (o.fs1 || 0);
    }
    if (o.sx == null || o.lv !== layoutV || dt > .25 || dt <= 0) {
        o.sx = x;
        o.sy = y;
        o.sa = ang;
        o.lv = layoutV;
        o.al = 1;
        o.fo = 0;
        o.fin = 0;
        return o;
    }
    o.al = 1;
    if (o.fo > 0) {
        o.fo -= dt * 4;
        o.al = Math.max(0, o.fo);
        if (o.fo <= 0) {
            o.sx = x;
            o.sy = y;
            o.sa = ang;
            o.fin = 1;
            o.al = 0;
        }
        return o;
    }
    if (o.fin > 0) {
        o.fin -= dt * 4;
        o.al = 1 - Math.max(0, o.fin);
    }
    var dx = x - o.sx, dy = y - o.sy, d = Math.hypot(dx, dy), mx = 180 * dt, ox = o.sx, oy = o.sy, oa = o.sa;
    if (d > 140) {
        o.fo = 1;
        return o;
    }
    if (d <= mx) {
        o.sx = x;
        o.sy = y;
    }
    else {
        o.sx += dx / d * mx;
        o.sy += dy / d * mx;
    }
    var da = ((ang - o.sa) % 6.2832 + 9.4248) % 6.2832 - 3.1416, ta = 9 * dt;
    o.sa += Math.max(-ta, Math.min(ta, da));
    o.gp += Math.min(4, Math.hypot(o.sx - ox, o.sy - oy)) * .62 + Math.min(.3, Math.abs(o.sa - oa)) * .7;
    return o;
}

function drawArmy(now) {
    cx.save();
    cx.translate(0, -cam);
    drawBuild(now);
    var tw = tunW(), ip = infPos(), ry = 36 + S.tier * 2;
    cx.lineCap = 'round';
    cx.strokeStyle = '#150c07';
    cx.lineWidth = 12;
    cx.beginPath();
    cx.moveTo(ip.x, QY + ry - 6);
    cx.lineTo(ip.x, ip.y);
    cx.stroke();
    cx.strokeStyle = '#8a6340';
    cx.lineWidth = 8;
    cx.stroke();
    chamber(ip.x, ip.y, 46, 17);
    cx.fillStyle = '#c0392b';
    cx.fillRect(ip.x - 1.2, ip.y - 15, 2.4, 7);
    cx.fillRect(ip.x - 3.6, ip.y - 12.8, 7.2, 2.4);
    if (injN() && healthy(0) > 0) {
        cx.save();
        cx.globalCompositeOperation = 'lighter';
        glow(ip.x, ip.y, 44, '120,255,160', .12 + .05 * Math.sin(now * .004));
        cx.restore();
    }
    var vx0 = camX - 26, vx1 = camX + W / uz + 26, vy0 = cam - 26, vy1 = cam + H / uz + 26, fast = marchers.length > 350, hv5 = [0, 0, 0, 0, 0];
    marchers.forEach(function (m) {
        var k = m.k, a, x, y, ang, leaf = false, ph = m.ph;
        hv5[k]++;
        if (m.inj) {
            if (m.st === 0) {
                a = at(m.p);
                var lm = Math.sin(now * .009 + m.ph) * .9;
                x = a.x + a.nx * lm;
                y = a.y + a.ny * lm;
                ang = a.ang;
                ph = m.ph * .5 + now * .005;
            }
            else {
                x = m.px;
                y = m.py;
                ang = Math.PI / 2;
                ph = m.st === 2 ? 0 : now * .005;
            }
        }
        else if (k === 0) {
            x = m.px == null ? QX : m.px;
            y = m.py == null ? QY : m.py;
            ang = m.ang || 0;
            if (m.tend)
                y += Math.sin(now * .012 + m.ph * 4) * .5;
        }
        else if (m.ex || (m.dr && m.dr.ph !== 'main' && m.dr.ph !== 'mainB') || (m.cr && m.cr.ph !== 'main' && m.cr.ph !== 'mainB') || (m.mo && m.mo.ph !== 'main' && m.mo.ph !== 'mainB')) {
            x = m.px;
            y = m.py;
            ang = m.ang;
        }
        else if (m.tr && m.tr.ph !== 'main' && BP[17]) {
            var tb = BP[17], tl = ((m.tr.slot % 3) - 1) * tw * .32, lg = trm.fT > 0 && m.tr.slot < 6 ? Math.max(0, Math.sin(now * .013 + m.ph * 5)) * 2.5 / tb.LEN : 0;
            a = at(Math.max(0, Math.min(1, m.tr.s + lg)), tb);
            x = a.x + a.nx * tl;
            y = a.y + a.ny * tl;
            ang = m.tr.dir < 0 ? a.ang + Math.PI : a.ang;
        }
        else if (k === 3 && m.xf && m.mp != null) {
            a = at(m.mp);
            x = a.x + a.nx * m.l * tw * .3;
            y = a.y + a.ny * m.l * tw * .3;
            ang = m.mt < m.mp ? a.ang + Math.PI : a.ang;
        }
        else if (k === 3 && m.q != null && S.sideTunnels > 0 && S.dug >= .3 && BP[m.q]) {
            var pr = S.sideDug[m.q] == null ? 1 : S.sideDug[m.q];
            a = at(m.s * pr, BP[m.q]);
            x = a.x + a.nx * m.l * tw * .3;
            y = a.y + a.ny * m.l * tw * .3;
            ang = (m.sd > 0 ? a.ang : a.ang + Math.PI) + (m.pz > 0 ? Math.sin(now * .0035 + m.ph) * .6 : 0);
        }
        else if (k === 1 && m.sf) {
            var rq = routeAt(m.sf.rt, m.sf.d);
            x = rq.x;
            y = rq.y;
            ang = m.sf.back ? rq.ang + Math.PI : rq.ang;
            if (m.sf.pk > 0)
                ang += Math.sin(now * .01 + m.ph) * .25;
            leaf = m.cg ? (m.sf.side ? 4 : (m.ph * 13) % 1 < .25 ? 3 : 1) : false;
        }
        else {
            a = at(m.p);
            var o = ((k === 2 || k === 4) && !foes.length ? ((m.u * 7.3) % 1) * 2 - 1 : m.l) * tw * .3;
            x = a.x + a.nx * o;
            y = a.y + a.ny * o;
            ang = m.d === 1 ? a.ang : a.ang + Math.PI;
            leaf = k === 1 && m.cg && m.d === 1 ? (m.si >= 0 ? 2 : m.si <= -2 ? 4 : ((m.ph * 13) % 1 < .25 ? 3 : 1)) : false;
            if (k === 1 && m.pk > 0 && m.si >= 0 && S.foodSpots[m.si]) {
                var sdp = S.foodSpots[m.si].side;
                x = a.x + a.nx * sdp * tw * .3;
                y = a.y + a.ny * sdp * tw * .3;
                ang = a.ang + sdp * 1.35 + Math.sin(now * .012 + m.ph) * .12;
            }
            if (m.wait > 0 && k === 1 && !m.inj)
                ang += Math.sin(now * .004 + m.ph * 7) * .45;
            else if (!foes.length && (k === 2 || k === 4) && !m.inj)
                ang += Math.sin(now * .0015 + m.ph * 5) * .35;
            if (!foes.length)
                m.eng = 0;
            if ((k === 2 || k === 4) && foes.length) {
                var f = foes[m.fi % foes.length];
                if (f) {
                    var dd = Math.abs(f.p - m.p);
                    if (dd < .05)
                        m.eng = 1;
                    else if (dd > .09)
                        m.eng = 0;
                }
                if (f && m.eng) {
                    var side = m.fi % 2 ? -1 : 1, rank = Math.floor(m.u * 8), fsz = foeSz(f), lw0 = Math.sin(now * .012 + m.ph * 5), lunge = rank < 2 ? Math.max(0, lw0) * 4.5 : 0, pq = Math.max(0, Math.min(1, f.p + side * (fsz * (side > 0 ? 2.25 : 1.95) + rank * 4.5 - lunge) / LEN)), bq = at(pq), ln2 = (((m.u * 5.7) % 1) * 2 - 1) * tw * .3;
                    x = bq.x + bq.nx * ln2;
                    y = bq.y + bq.ny * ln2;
                    ang = side > 0 ? bq.ang + Math.PI : bq.ang;
                    m.bite = rank < 2 ? Math.max(0, lw0) : rank < 4 ? .35 + .35 * Math.sin(now * .02 + m.ph * 3) : 0;
                    // a spark where the jaws land, once per lunge
                    if (rank < 2 && lw0 > .96 && !(m.lsp > now - 300) && fx.length < 260) {
                        m.lsp = now;
                        var hx2 = x + Math.cos(ang) * 4.5, hy2 = y + Math.sin(ang) * 4.5;
                        fx.push({ x: hx2, y: hy2, vx: 0, vy: 0, l: .22, star: 3.2 + Math.random() * 1.6, c: '#fff4c2', g: 0 });
                        for (var sk2 = 0; sk2 < 2; sk2++)
                            fx.push({ x: hx2, y: hy2, vx: Math.cos(ang + (Math.random() - .5) * 2) * 40, vy: Math.sin(ang + (Math.random() - .5) * 2) * 40 - 10, l: .25, c: '#ffd35a', s: 1.6, g: 60 });
                        f.hf = Math.max(f.hf || 0, .12);
                    }
                }
            }
        }
        if (m.gt > 0)
            ang += Math.sin(now * .02 + m.ph) * .12;
        smoothPos(m, x, y, ang, now);
        x = m.sx;
        y = m.sy;
        ang = m.sa;
        ph = m.gp;
        m.wx = x;
        m.wy = y;
        m.wa = ang;
        m.wp = ph;
        if (x < vx0 || x > vx1 || y < vy0 || y > vy1)
            return;
        if (k === 4) {
            cx.save();
            cx.globalCompositeOperation = 'lighter';
            glow(x, y, 18, '170,40,30', .3 + .1 * Math.sin(now * .008 + m.ph));
            cx.restore();
        }
        cx.globalAlpha = m.al == null ? 1 : m.al;
        var grown = !m.born || now - m.born >= 700;
        var hs = m.hero != null ? HSC : 1;
        BITE = m.eng && foes.length && m.bite ? m.bite : 0;
        if (grown)
            antDraw(x, y, ang, SZ[k] * hs, leaf, ph, KD[k], fast && m.hero == null);
        else
            drawAnt(x, y, ang, SZ[k] * hs * popIn(Math.min(1, (now - m.born) / 700)), leaf, ph, KD[k]);
        BITE = 0;
        cx.globalAlpha = 1;
        if (m.hero != null)
            heroMark(x, y, m, now, ang);
        if (m.carry && k === 0 && !m.inj) {
            var ex = x + Math.cos(ang) * SZ[0] * .95, ey = y + Math.sin(ang) * SZ[0] * .95;
            cx.fillStyle = m.carry === 2 ? '#b07a3c' : '#f3ead2';
            cx.beginPath();
            cx.ellipse(ex, ey, 2.6, 1.9, ang, 0, 7);
            cx.fill();
        }
        var hv = -1;
        if (m.inj)
            hv = m.st === 2 ? Math.min(1, .3 + (m.rt || 0) / 4.5) : .3;
        else if (foes.length && (k === 2 || k === 4) && m.eng && Math.floor(m.u * 8) < 2)
            hv = Math.max(.25, 1 - S.injured[k] / Math.max(1, cnt(k)) * 3);
        if (hv >= 0) {
            var by = y - 10 - (k === 4 ? 10 : 0);
            cx.fillStyle = 'rgba(0,0,0,.65)';
            cx.fillRect(x - 6, by, 12, 3);
            cx.fillStyle = hv > .6 ? '#7fcf8f' : hv > .35 ? '#e8c24a' : '#e0553f';
            cx.fillRect(x - 5.5, by + .5, 11 * hv, 2);
        }
        if (m.inj) {
            cx.fillStyle = '#ff5a4a';
            cx.beginPath();
            cx.arc(x, y - 3.2, .9, 0, 7);
            cx.fill();
        }
    });
    drawRaid();
    drawFarmAnts(now, vx0, vx1, vy0, vy1);
    drawFallen();
    cx.restore();
    drawLurker(performance.now());
}

function updateSel() {
    var el = antLbl;
    if (!sel || tab === 'col' || (sel.t === 'f' ? FAO[sel.o.key] !== sel.o || performance.now() - sel.o.seen > 1500 : sel.t === 'm' ? marchers.indexOf(sel.o) < 0 : crewA.indexOf(sel.o) < 0) || sel.o.wx == null) {
        sel = null;
        el.style.display = 'none';
        return;
    }
    var r = cv.getBoundingClientRect(), s = sel, inf = antInfo(sel);
    var id = antIdent(s), o2 = sel.o, en = Math.round(o2.en == null ? 80 : o2.en), age = Math.floor((S.days || 0) - id.birth), role = s.t === 'a' ? 'Worker ant' : CN[o2.k] + ' ant';
    var ec = en > 55 ? '#7fcf8f' : en > 28 ? '#e8c24a' : '#e0553f', ids = '' + id.id;
    while (ids.length < 5)
        ids = '0' + ids;
    el.style.display = 'block';
    el.style.width = Math.min(r.width - 16, 300) + 'px';
    el.style.left = (r.left + (r.width - Math.min(r.width - 16, 300)) / 2) + 'px';
    el.style.top = Math.max(r.top + 8, r.bottom - 205) + 'px';
    var st = inf[1] || 'Busy';
    var hh = id.hero;
    el.innerHTML = (hh ? '<b style="color:' + hh.c + '">' + id.name + '</b><span class="asub">Hero ' + role.toLowerCase() + ' \u00b7 ' + HTRAIT[hh.k].t + '</span>' : '<b>' + id.name + '</b><span class="asub">' + role + ' \u00b7 ID #' + ids + '</span>') +
        (hh ? '<p style="margin:4px 0 6px;font-size:12px;opacity:.85">' + hh.s + '</p>' : '') +
        '<div class="arow"><i>Age</i><span>' + (age < 1 ? 'Newly hatched' : age + (age === 1 ? ' day' : ' days')) + '</span></div>' +
        '<div class="arow"><i>Status</i><span>' + st + '</span></div>' +
        '<div class="arow"><i>Location</i><span>' + antWhere(o2) + '</span></div>' +
        '<div class="arow"><i>Energy</i><span><span class="ebar"><u style="width:' + en + '%;background:' + ec + '"></u></span>' + en + '%</span></div>' +
        '<div class="arow"><i>Assigned role</i><span>' + ROLES[s.t === 'a' ? 5 : o2.k] + '</span></div>';
}

function drawSel(now) {
    if (!sel || sel.o.wx == null)
        return;
    cx.save();
    cx.translate(0, -cam);
    cx.strokeStyle = '#ffe27a';
    cx.lineWidth = 1.6;
    cx.setLineDash([3, 3]);
    cx.beginPath();
    cx.arc(sel.o.wx, sel.o.wy, 8 + Math.sin(now * .008), 0, 7);
    cx.stroke();
    cx.restore();
}
