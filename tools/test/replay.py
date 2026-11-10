"""Fixed-seed replay: plays the same scripted session and fingerprints the colony.

Randomness and the clock are replaced with fixed ones, so the same game code always produces exactly
the same colony. The session runs through every system (waves, termites, digging, deep layers, crickets,
the Giant Mole, time away, a Royal Flight, the map) and records a fingerprint at each checkpoint of:
the colony state, every ant, the page layout and the pixels on screen.

Usually run through check.py. Directly: python3 replay.py URL OUT.json"""
import asyncio, sys, json, hashlib
from playwright.async_api import async_playwright
INIT = r"""
(function(){
  var seed = 987654321;
  Math.random = function(){ seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  var T = 100000, D0 = 1762600000000;
  performance.now = function(){ return T; };
  var RD = Date; window.Date = function(a,b,c,d,e,f,g){ if (!arguments.length) return new RD(D0 + T); return new (Function.prototype.bind.apply(RD,[null].concat([].slice.call(arguments))))(); };
  Date.now = function(){ return D0 + T; }; Date.prototype = RD.prototype; Date.UTC = RD.UTC; Date.parse = RD.parse;
  var raf = [], timers = [], tid = 1;
  window.requestAnimationFrame = function(cb){ raf.push(cb); return raf.length; };
  window.cancelAnimationFrame = function(){};
  window.setTimeout = function(fn, ms){ var id = tid++; timers.push({id:id, t:T + (ms||0), fn:fn}); return id; };
  window.setInterval = function(fn, ms){ var id = tid++; timers.push({id:id, t:T + (ms||0), fn:fn, iv: Math.max(16, ms||0)}); return id; };
  window.clearTimeout = window.clearInterval = function(id){ timers = timers.filter(function(x){ return x.id !== id; }); };
  window.__step = function(n, dt){
    for (var i = 0; i < n; i++) {
      T += dt || 16.667;
      var due = timers.filter(function(x){ return x.t <= T; }).sort(function(a,b){ return a.t - b.t || a.id - b.id; });
      due.forEach(function(x){ if (x.iv) x.t += x.iv; else timers = timers.filter(function(y){ return y !== x; }); try { typeof x.fn === 'function' && x.fn(); } catch(e) { window.__errs = (window.__errs||[]).concat(String(e)); } });
      var c = raf; raf = [];
      c.forEach(function(f){ try { f(T); } catch(e) { window.__errs = (window.__errs||[]).concat(String(e && e.stack || e).slice(0,300)); } });
    }
  };
})();
"""
SNAP = r"""(function(){
  function r(v){ return typeof v === 'number' ? Math.round(v * 1e6) / 1e6 : v; }
  function clean(o, d){ if (d > 6) return null; if (Array.isArray(o)) return o.map(function(x){ return clean(x, d+1); }); if (o && typeof o === 'object') { var out = {}; Object.keys(o).sort().forEach(function(k){ var v = o[k]; if (typeof v === 'function') return; if (v && typeof v === 'object' && v.PT) return; out[k] = clean(v, d+1); }); return out; } return r(o); }
  var ms = marchers.map(function(m){ return [m.k, r(m.p), r(m.wx), r(m.wy), m.eng?1:0, m.dr?m.dr.ph:'', m.tr?m.tr.ph:'', m.mo?m.mo.ph:'', m.cr?m.cr.ph:'', m.ld?m.ld.ph:'', m.sf?r(m.sf.d):'', m.hero==null?'':m.hero]; });
  return JSON.stringify({ S: clean(S, 0), P: clean(P, 0), marchers: ms, foes: clean(foes, 0), trm: clean(trm, 0), cric: clean(cric, 0), crew: crewA.map(function(a){ return [a.st, a.kind, r(a.d), r(a.wx), r(a.wy)]; }), fx: fx.length, errs: window.__errs || [], dom: (function(){ var h = 0, b = document.body.cloneNode(true); b.querySelectorAll('script').forEach(function(x){ x.remove(); }); var t = b.innerHTML; for (var i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0; return h; })(), px: (function(){ try { var d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data, h = 0; for (var i = 0; i < d.length; i += 7) h = (h * 31 + d[i]) | 0; return h; } catch (e) { return 'n/a'; } })() });
})()"""
# scripted session: each step = (label, js to run first, frames to play)
SESSION = [
  ('start',      "document.getElementById('tgo') && document.getElementById('tgo').click();", 600),
  ('stage2',     "go('tun'); devStage(2);", 1800),
  ('wave',       "nf = performance.now() + 3000;", 2400),
  ('stage4',     "devStage(4); S.reach = 2; S.sideTunnels = 19; for (var k = 0; k < 19; k++) S.sideDug[k] = 1; S.rare.nbf = 1; genPebs();", 1800),
  ('termites',   "trmT = 0; foes.length = 0; nf = performance.now() + 1e9;", 3000),
  ('digging',    "S.totalHatched += 400; FDV++;", 2400),
  ('deep',       "P.gen = 4; S.deep = 2; S.deepAt = [S.totalHatched - 60, S.totalHatched - 60]; layoutV++; genDeep(); farInit(); for (var r = 0; r < 60; r++) { farmList(); deepList(); var q = DQ.concat(FQ); if (!q.length) break; q.forEach(function (e) { (e.deep ? S.ddg : S.fdg)[e.i] = 1; }); FDV++; }", 1200),
  ('crickets',   "trm.length = 0; foes.length = 0; nf = performance.now() + 1e9; cricT = 0;", 3600),
  ('mole',       "S.deep = 4; S.deepAt = [S.totalHatched-90,S.totalHatched-90,S.totalHatched-90,S.totalHatched-90]; layoutV++; genDeep(); farInit(); for (var r = 0; r < 60; r++) { farmList(); deepList(); var q = DQ.concat(FQ); if (!q.length) break; q.forEach(function (e) { (e.deep ? S.ddg : S.fdg)[e.i] = 1; }); FDV++; } foes.length = 0; nf = performance.now() + 1e9; S.classLevel[2] = 8; S.classLevel[4] = 8; S.bld.rax = 4; sync(); moleGo();", 15000),
  ('away',       "catchUp(3 * 3600);", 600),
  ('flight',     "newRunFound(4);", 1800),
  ('tabs',       "go('nest');", 300),
  ('tabs2',      "go('col');", 300),
  ('tabs3',      "go('tun'); mapOpen();", 300),
  ('end',        "mapClose(); save();", 120),
]
async def main():
    url, out = sys.argv[1], sys.argv[2]
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width':390,'height':844}, device_scale_factor=1)
        await ctx.add_init_script(INIT)
        pg = await ctx.new_page()
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(url)
        await pg.evaluate("window.__step(30)")
        # the same pop-up handling in every run: close how-to-play, claim the queen's gift, keep the queen alive
        await pg.evaluate("""window.__tidy = function(){
          var i = document.getElementById('intro'); if (i && i.classList.contains('on')) introClose();
          var g = document.getElementById('gift'); if (g && g.classList.contains('on')) giftClaim();
          document.querySelectorAll('.on').forEach(function(e){ if (e.id === 'away' || e.id === 'awayov') e.classList.remove('on'); });
          if (typeof S !== 'undefined' && S.queenHp != null) S.queenHp = hpMax();
          dead = false;
        }; 0""")
        res = {}
        for label, js, frames in SESSION:
            try:
                await pg.evaluate("(function(){" + js + "})();0")
            except Exception as e:
                errs.append(label + ': ' + str(e)[:200])
            # play in chunks so the page stays responsive
            left = frames
            while left > 0:
                n = min(300, left); left -= n
                await pg.evaluate("window.__step(%d); window.__tidy()" % n)
            snap = await pg.evaluate(SNAP)
            res[label] = hashlib.sha1(snap.encode()).hexdigest()[:12]
            if label in ('termites', 'mole', 'flight', 'end'):
                open(out[:-5] + '_' + label + '.snap', 'w').write(snap)
        # errors thrown inside game frames and timers are caught by the fake clock; report them too
        errs += await pg.evaluate("window.__errs || []")
        res['pageerrors'] = errs
        json.dump(res, open(out, 'w'), indent=1)
        print(json.dumps(res))
        await b.close()
asyncio.run(main())
