/* ui/gift.js
   The Queen's daily gift.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

// the Queen's Gift: one reward each calendar day, with a 7-day streak
function dayKey(d) { d = d || new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }

function giftState() {
    var g = P.gift || { last: '', streak: 0 }, y = new Date();
    if (g.last === dayKey())
        return null;
    y.setDate(y.getDate() - 1);
    var st = g.last === dayKey(y) ? g.streak + 1 : 1;
    return { streak: st, day: (st - 1) % 7 + 1 };
}

function giftReward(day) { return { food: Math.round(foodCap() * (.04 + .01 * day)), jelly: day === 7 ? 6 : day >= 4 ? 2 : 1, egg: day === 7 }; }

function giftShow() {
    var st = giftState(), r, h = '', i;
    if (!st)
        return false;
    r = giftReward(st.day);
    h = '<h3>The Queen\u2019s Gift</h3><p>' + (st.streak > 1 ? 'Day ' + st.day + ' of 7 in a row. Welcome back!' : !(P.gift && P.gift.last) ? 'Your first gift from the colony. A new one waits every day you play.' : 'A gift from the colony for coming back today.') + '</p><div class="idots" style="gap:10px">';
    for (i = 1; i <= 7; i++)
        h += '<i class="' + (i === st.day ? 'on' : '') + '" style="' + (i < st.day ? 'background:var(--accent2)' : '') + '"></i>';
    h += '</div><p><b>+' + fmt(r.food) + ' food, +' + r.jelly + ' royal jelly' + (r.egg ? ', and a golden egg' : '') + '</b></p>' + (st.day < 7 ? '<p class="mute">Come back tomorrow for a bigger gift. Day 7 brings a golden egg.</p>' : '');
    $('giftt').innerHTML = h;
    $('gift').classList.add('on');
    return true;
}

function giftClaim() {
    var st = giftState(), r;
    $('gift').classList.remove('on');
    if (!st)
        return;
    r = giftReward(st.day);
    S.food = Math.min(foodCap(), S.food + r.food);
    gainJelly(r.jelly);
    if (r.egg)
        S.eggs.push({ t: 12, b: performance.now(), c: 4 });
    P.gift = { last: dayKey(), streak: st.streak };
    SFX.win();
    burst(QX, QY - 20, 30, ['#ffe27a', '#fff', '#9be07a'], 120);
    toast('Queen\u2019s Gift claimed: +' + fmt(r.food) + ' food, +' + r.jelly + ' jelly' + (r.egg ? ', golden egg!' : '.'));
    save();
}

function giftCheck() {
    var t = $('title');
    if (dead || S.totalHatched < 5 || (t && t.style.display !== 'none' && !navigator.webdriver))
        return;
    if ($('intro').classList.contains('on') || ($('away') && $('away').classList.contains('on')) || $('endscr').classList.contains('on') || $('gift').classList.contains('on'))
        return;
    if ((P.wn || 0) < WN_V) {
        P.wn = WN_V;
        save();
        IP = IP_NEW;
        introWasDead = dead;
        dead = true;
        $('intro').classList.add('on');
        introShow(0);
        return;
    }
    giftShow();
}
