#!/usr/bin/env python3
"""Quick health check with no saved baseline, so it gives the same answer on any machine (it runs on GitHub
on every push). Three parts:

  1. Sweep: a fresh player on the real page, then every nest stage on every tab, the map, a wave, the deep
     layers, crickets, termites and the Giant Mole. Fails on any script error or sideways page overflow.
  2. Tunnel layout is the same on four screen sizes (a colony must look the same on every phone).
  3. No tunnel crosses another, on six colony seeds.

    python3 tools/test/smoke.py            run it
    python3 tools/test/smoke.py --shots    also save a screenshot of every screen in tools/test/out/sweep/

Needs Python 3 and Playwright: pip install playwright && playwright install chromium"""
import functools, http.server, json, os, subprocess, sys, threading, time
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))

def serve(d):
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
    s = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=d))
    threading.Thread(target=s.serve_forever, daemon=True).start()
    return 'http://127.0.0.1:%d/' % s.server_address[1]

SHOTS = '--shots' in sys.argv
OUT = os.path.join(HERE, 'out', 'sweep')
U = serve(ROOT)
shots=[];probs=[]
def dis(pg):
    for _ in range(6):
        n=pg.evaluate('''(()=>{var n=0;document.querySelectorAll('button').forEach(b=>{var t=(b.textContent||'').trim();if(b.offsetParent&&/^(Close|Claim|Next|Got it|OK|Done|Let.s go|Start)$/i.test(t)&&!b.closest('#ctabs,nav')){b.click();n++}});return n})()''')
        if not n: break
        pg.wait_for_timeout(300)
def chk(pg,name,keep=False):
    if not keep: dis(pg)
    ov=pg.evaluate("Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)")
    e=pg.evaluate("(window.__errs||[]).map(String)")
    if ov>390: probs.append((name,'overflow',ov))
    if e: probs.append((name,'frameerr',e[:3])); pg.evaluate("window.__errs=[]")
    shots.append(name)
    if SHOTS: pg.screenshot(path=os.path.join(OUT, name + '.png'))
def sweep(b):
    # 1: fresh player on the live page, real title + opening
    pg=b.new_page(viewport={'width':390,'height':844})
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.add_init_script("Object.defineProperty(navigator,'webdriver',{get:()=>false})")
    pg.goto(U+'index.html');pg.wait_for_timeout(2500);chk(pg,'00title',True)
    pg.evaluate("var t=document.getElementById('tgo');t&&t.click()");pg.wait_for_timeout(3500);chk(pg,'01opening',True)
    pg.wait_for_timeout(12000);pg.mouse.click(195,420);pg.wait_for_timeout(3000);chk(pg,'02first',True)
    pg.wait_for_timeout(20000);chk(pg,'03first30s')
    if errs: probs.append(('index',errs[:3]))
    pg.close()
    # 2: dev page, every stage on every tab
    pg=b.new_page(viewport={'width':390,'height':844})
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto(U+'dev.html');pg.wait_for_timeout(2000)
    pg.evaluate("localStorage.setItem('thecolony_intro','1');document.querySelectorAll('.intro.on').forEach(e=>e.classList.remove('on'));dead=false")
    for st in range(5):
        pg.evaluate("devStage(%d)"%st)
        for t in ['nest','tun','col']:
            pg.evaluate("go('%s')"%t);pg.wait_for_timeout(2500);chk(pg,'s%d_%s'%(st,t))
        for c in ['ants','today','more','build']:
            pg.evaluate("var b=document.querySelector('#ctabs button[data-c=\"%s\"]');b&&b.click()"%c);pg.wait_for_timeout(500)
            if st in (0,4): chk(pg,'s%d_col_%s'%(st,c))
        pg.evaluate("go('store')");pg.wait_for_timeout(800)
        if st in (0,4): chk(pg,'s%d_store'%st)
        pg.evaluate("go('tun');mapOpen()");pg.wait_for_timeout(1500);chk(pg,'s%d_map'%st);pg.evaluate("mapClose()")
    # nest info card, room card, tap features
    pg.evaluate("go('nest')");pg.wait_for_timeout(800)
    pg.evaluate("var b=document.getElementById('ninfo');b&&b.click()");pg.wait_for_timeout(800);chk(pg,'nest_info',True)
    pg.evaluate("var b=document.getElementById('ninfo');b&&b.click()");pg.wait_for_timeout(500)
    pg.evaluate("try{roomCard(0)}catch(e){window.__errs=(window.__errs||[]).concat([String(e)])}");pg.wait_for_timeout(800);chk(pg,'room0',True)
    pg.keyboard.press('Escape');pg.evaluate("document.querySelectorAll('.sheet.on,.modal.on,#rcard.on').forEach(e=>e.classList.remove('on'))")
    # wave
    pg.evaluate("go('tun');foes.length=0;nf=performance.now()+500");pg.wait_for_timeout(6000)
    pg.evaluate("if(foes[0]){var a=at(Math.min(1,Math.max(0,foes[0].p)));camT=camClamp(a.y-H/2/uz)}");pg.wait_for_timeout(1200);chk(pg,'wave')
    # deep + crickets + termites + mole
    pg.evaluate("S.reach=2;S.sideTunnels=19;for(var k=0;k<19;k++)S.sideDug[k]=1;S.rare.nbf=1;genPebs();S.tier=Math.max(S.tier,4);S.deep=4;S.deepAt=[0,0,0,0];layoutV++;genDeep();genPebs();farInit();for(var r=0;r<60;r++){farmList();deepList();var q=DQ.concat(FQ);if(!q.length)break;q.forEach(function(e){(e.deep?S.ddg:S.fdg)[e.i]=1});FDV++}")
    pg.wait_for_timeout(1500)
    pg.evaluate("go('tun');camT=camClamp(deepTop()-H*.3)");pg.wait_for_timeout(2000);chk(pg,'deep')
    pg.evaluate("cricT=0;cric.length=0;foes.length=0;trm.length=0");pg.wait_for_timeout(9000)
    pg.evaluate("var c=cric.find(function(c){return c.w<=0});if(c){var ap=armouryPos();var a=at(Math.max(0,Math.min(1,c.s)),ap.q1);camT=camClamp(a.y-H/2/uz)}");pg.wait_for_timeout(800);chk(pg,'crickets')
    pg.evaluate("trmT=0");pg.wait_for_timeout(9000)
    pg.evaluate("try{var f=trmFront();if(f&&f.y!=null)camT=camClamp(f.y-H/2/uz)}catch(e){}");pg.wait_for_timeout(800);chk(pg,'termites')
    pg.evaluate("var m=molePos();if(m)camT=camClamp(m.y-H/2/uz)");pg.wait_for_timeout(1500);chk(pg,'mole_sleep')
    pg.evaluate("try{moleGo()}catch(e){window.__errs=(window.__errs||[]).concat([String(e)])}");pg.wait_for_timeout(5000)
    pg.evaluate("var m=molePos();if(m)camT=camClamp(m.y-H/2/uz)");pg.wait_for_timeout(800);chk(pg,'mole_fight')
    pg.evaluate("S.moleWon=1;S.hall=2");pg.wait_for_timeout(1500);chk(pg,'hall')
    pg.evaluate("go('nest')");pg.wait_for_timeout(3000);chk(pg,'nest_end')
    pg.evaluate("mapOpen()");pg.wait_for_timeout(1500);chk(pg,'map_end')
    if errs: probs.append(('dev',errs[:5]))

H="""()=>{function h(a){var x=0;var t=JSON.stringify(a);for(var i=0;i<t.length;i++)x=(x*31+t.charCodeAt(i))|0;return x}
var f=FARM.map(function(t){return [t.pi,t.par,t.pts.map(function(p){return [+p[0].toFixed(3),+p[1].toFixed(3)]})]});
var d=DEEP.map(function(t){return [t.pi,t.L,t.pts.map(function(p){return +p[0].toFixed(3)})]});
return 'farm '+FARM.length+' '+h(f)+'  deep '+DEEP.length+' '+h(d)}"""
JS="""()=>{
function segs(list,sx,sy){var o=[];list.forEach(function(f,fi){for(var j=1;j<f.pts.length;j++)o.push([f.pts[j-1][0]*sx,f.pts[j-1][1]*sy,f.pts[j][0]*sx,f.pts[j][1]*sy,fi])});return o}
function cr(a,b){function o(ax,ay,bx,by,cx,cy){var v=(by-ay)*(cx-bx)-(bx-ax)*(cy-by);return Math.abs(v)<1e-9?0:v>0?1:2}
 var p=[a[0],a[1]],q=[a[2],a[3]],r=[b[0],b[1]],s=[b[2],b[3]];
 function near(x,y,X,Y){return Math.hypot(x-X,y-Y)<1e-4}
 if(near(p[0],p[1],r[0],r[1])||near(p[0],p[1],s[0],s[1])||near(q[0],q[1],r[0],r[1])||near(q[0],q[1],s[0],s[1]))return false;
 var o1=o(p[0],p[1],q[0],q[1],r[0],r[1]),o2=o(p[0],p[1],q[0],q[1],s[0],s[1]),o3=o(r[0],r[1],s[0],s[1],p[0],p[1]),o4=o(r[0],r[1],s[0],s[1],q[0],q[1]);
 return o1&&o2&&o3&&o4&&o1!==o2&&o3!==o4}
function count(S2){var n=0;for(var i=0;i<S2.length;i++)for(var j=i+1;j<S2.length;j++)if(S2[i][4]!==S2[j][4]&&cr(S2[i],S2[j]))n++;return n}
function sharp(list,sx,sy){var n=0,t=0;list.forEach(function(f){for(var j=2;j<f.pts.length;j++){var a=Math.atan2((f.pts[j-1][1]-f.pts[j-2][1])*sy,(f.pts[j-1][0]-f.pts[j-2][0])*sx),b=Math.atan2((f.pts[j][1]-f.pts[j-1][1])*sy,(f.pts[j][0]-f.pts[j-1][0])*sx),d=Math.abs(((b-a)+Math.PI*3)%(2*Math.PI)-Math.PI);t++;if(d>1.2)n++}});return [n,t]}
var res={farm:FARM.length,deep:DEEP.length};
res.farmCross=count(segs(FARM,W,WH));
var bl=[[],[],[],[]];DEEP.forEach(function(f){bl[f.L].push(f)});res.deepCross=bl.map(function(l){return count(segs(l,W,WH))});
res.farmSharp=sharp(FARM,W,WH);res.deepSharp=sharp(DEEP,W,WH);
res.perL=bl.map(function(l){return l.length});return JSON.stringify(res)}"""

def layout(b):
    seen = {}
    for vw, vh in [(390, 844), (390, 760), (430, 932), (360, 640)]:
        pg = b.new_page(viewport={'width': vw, 'height': vh})
        pg.goto(U + 'dev.html'); pg.wait_for_timeout(1500)
        for st in (2, 4):
            pg.evaluate("localStorage.setItem('thecolony_intro','1');devStage(%d);S.seed=777;S.deep=4;layoutV++;sizeT()" % st); pg.wait_for_timeout(300)
            seen.setdefault(st, set()).add(pg.evaluate(H))
        pg.close()
    for st in seen:
        if len(seen[st]) > 1: probs.append(('layout differs between screen sizes at stage %d' % st, sorted(seen[st])))
    pg = b.new_page(viewport={'width': 390, 'height': 844})
    pg.goto(U + 'dev.html'); pg.wait_for_timeout(2000)
    for seed in (11, 222, 3333, 7, 98765, 4242):
        pg.evaluate("localStorage.setItem('thecolony_intro','1');document.querySelectorAll('.intro.on').forEach(e=>e.classList.remove('on'));devStage(4);S.seed=%d;layoutV++;gen();genDeep()" % seed)
        r = json.loads(pg.evaluate(JS))
        if r['farmCross'] or sum(r['deepCross']): probs.append(('tunnels cross, seed %d' % seed, r))
        if r['farm'] < 100 or min(r['perL']) < 40: probs.append(('too few tunnels, seed %d' % seed, r))
    pg.close()

def main():
    subprocess.run([sys.executable, os.path.join(ROOT, 'tools', 'build.py'), '--check'], check=True)
    if SHOTS: os.makedirs(OUT, exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch()
        sweep(b)
        layout(b)
        b.close()
    if probs:
        print(json.dumps(probs, indent=1))
        print('%d problem(s).' % len(probs))
        sys.exit(1)
    print('Smoke test passed: %d screens, layout the same on 4 screen sizes, no crossings on 6 seeds.' % len(shots))

if __name__ == '__main__':
    main()
