/* ui/ads.js
   Optional rewarded ads and the ad-free purchase hooks.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

var Ads = {
    pending: null,
    timer: null,
    native: function () { return !!(window.AndroidAds && typeof window.AndroidAds.showRewarded === 'function'); },
    ready: function (key, mins) { return (Date.now() - ((P.adT && P.adT[key]) || 0)) > mins * 60000; },
    left: function (key, mins) { return Math.max(0, Math.ceil((mins * 60000 - (Date.now() - ((P.adT && P.adT[key]) || 0))) / 60000)); },
    mark: function (key) { P.adT = P.adT || {}; P.adT[key] = Date.now(); },
    show: function (key, title, text, onReward) {
        if (P.adfree) {
            onReward();
            return;
        }
        Ads.pending = { key: key, cb: onReward };
        if (Ads.native()) {
            try {
                window.AndroidAds.showRewarded(key);
                return;
            }
            catch (e) { }
        }
        $('adt').textContent = title;
        $('adp').textContent = text + ' (Preview: in the Android app a short real ad plays here.)';
        var n = 3, go = $('adgo');
        go.disabled = true;
        $('adgot').textContent = 'Please wait ' + n + '...';
        $('adov').classList.add('on');
        clearInterval(Ads.timer);
        Ads.timer = setInterval(function () {
            n--;
            if (n > 0)
                $('adgot').textContent = 'Please wait ' + n + '...';
            else {
                clearInterval(Ads.timer);
                go.disabled = false;
                $('adgot').textContent = 'Claim reward';
            }
        }, 1000);
    },
    done: function (key, ok) {
        var p = Ads.pending;
        if (!p || p.key !== key)
            return;
        Ads.pending = null;
        if (ok)
            p.cb();
    }
};

function adBoost() {
    if (S.tier < 1 || !Ads.ready('boost', 15))
        return;
    Ads.show('boost', 'Colony boost', 'Get a stock of food and some royal jelly for your colony.', function () {
        Ads.mark('boost');
        S.food = Math.min(foodCap(), S.food + Math.round(foodCap() * .15));
        gainJelly(1 + Math.floor(S.tier / 2));
        burst(QX, QY, 24, ['#ffd23f', '#fff'], 100);
        SFX.win();
        toast('Boost! Food and jelly added.');
    });
}

function adRevive() {
    if (!dead || S.revived)
        return;
    Ads.show('revive', 'Save the queen', 'Heal the queen, drive the invaders out, and carry on with your colony.', function () {
        S.revived = 1;
        dead = false;
        foes = [];
        S.queenHp = hpMax();
        $('over').classList.remove('on');
        nf = performance.now() + 60000;
        toast('The colony rallies! The queen is safe.');
        SFX.win();
    });
}
var rs = 0;
