#!/usr/bin/env python3
"""Checks a save from an older build still loads in this one with nothing lost. Takes the built game from an
older commit (default: origin/main, the live site), makes a late-game colony in it, then opens the current
build on the same save and prints the tunnel counts before and after. The numbers must match.

    python3 tools/test/oldsave.py [commit]

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

import tempfile
REF = sys.argv[1] if len(sys.argv) > 1 else 'origin/main'
TMP = tempfile.mkdtemp()
os.makedirs(os.path.join(TMP, 'old'))
old = subprocess.run(['git', '-C', ROOT, 'show', REF + ':index.html'], check=True, capture_output=True).stdout.decode()
# the preview tools (devStage) are only in dev.html; switch them on in the old copy
open(os.path.join(TMP, 'old', 'index.html'), 'w').write(old.replace('var DEV = false;', 'var DEV = true;', 1))
open(os.path.join(TMP, 'index.html'), 'w').write(open(os.path.join(ROOT, 'index.html')).read())
U = serve(TMP)
CNT="""JSON.stringify({farmDug:Object.keys(S.fdg||{}).filter(function(k){return S.fdg[k]>=1}).length,farmShown:farmList().filter(function(o){return o.pr>=1}).length,
deepDug:[0,1,2,3].map(function(L){return Object.keys(S.ddg||{}).filter(function(k){return S.ddg[k]>=1&&DEEPP[k]&&DEEPP[k].L===L&&!DEEPP[k].t}).length}),
deepShown:[0,1,2,3].map(function(L){return deepList().filter(function(o){return o.pr>=1&&o.f.L===L&&!o.f.t}).length}),
shafts:[0,1,2,3].map(function(L){return !!trunkQ(L)}),armoury:typeof armouryOn==='function'?armouryOn():null,net:S.net||null,food:Math.round(S.food)})"""
with sync_playwright() as p:
    b=p.chromium.launch()
    ctx=b.new_context(viewport={'width':390,'height':844});pg=ctx.new_page()
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto(U+'old/index.html');pg.wait_for_timeout(2000)
    pg.evaluate("localStorage.setItem('thecolony_intro','1');devStage(4);S.reach=2;S.sideTunnels=19;for(var k=0;k<19;k++)S.sideDug[k]=1;S.tier=Math.max(S.tier,4);S.deep=4;S.deepAt=[0,0,0,0];S.totalHatched=Math.max(S.totalHatched,3000);layoutV++;genDeep();farInit();for(var r=0;r<400;r++){farmList0();deepList0();var q=DQ.concat(FQ);if(!q.length)break;q.forEach(function(e){(e.deep?S.ddg:S.fdg)[e.i]=1});FDV++}FLC.k=null;DLC.k=null;save()")
    pg.wait_for_timeout(1500)
    print('old ',pg.evaluate(CNT),errs)
    pg.goto(U+'index.html');pg.wait_for_timeout(5000)
    print('new ',pg.evaluate(CNT),errs)
    pg.evaluate("save()");pg.wait_for_timeout(500);pg.reload();pg.wait_for_timeout(5000)
    print('again',pg.evaluate(CNT),errs)
    b.close()
