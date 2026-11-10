#!/usr/bin/env python3
"""A pretend new player: opens the real page and plays for a while the way the game tells it to (follows the
flashing tab, taps the queen, taps whatever the goal card asks for). Writes what happened, with the time,
to tools/test/out/bot/log.txt and saves a screenshot at each goal. Read the log to see how long each goal
takes and where a new player would get stuck. Not part of the automatic checks: it runs in real time.

    python3 tools/test/bot.py [minutes]    default 10

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

import re
D = os.path.join(HERE, 'out', 'bot')
MIN = float(sys.argv[1]) if len(sys.argv) > 1 else 10
U = serve(ROOT)
os.makedirs(D, exist_ok=True)
log=open(D+'/log.txt','w')
def L(*a):
    t='%5.0fs '%(time.time()-T0)+' '.join(str(x) for x in a); print(t); log.write(t+'\n'); log.flush()
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844},has_touch=True)
    errs=[];pg.on('pageerror',lambda e:(errs.append(str(e)),L('PAGE ERROR',e)))
    pg.goto(U+'index.html');pg.wait_for_timeout(1000)
    T0=time.time(); seen=set(); gi=-1; lastshot=0; tier=-1; taps=0; lasttab=None; toastseen=set()
    while time.time()-T0<MIN*60:
        st=pg.evaluate("""(()=>{var r=cv.getBoundingClientRect();return {gi:S.goalIndex,goal:(document.querySelector('.gcard')||document.querySelector('#goal')||{}).innerText,tab:tab,
          qx:r.left+(QX-camX)*uz, qy:r.top+(QY-cam)*uz, ch:r.height, ct:r.top, ants:Math.round(popn()),food:Math.round(S.food),cap:Math.round(foodCap()),jelly:S.jelly,tier:S.tier,
          nudge:(document.querySelector('.nav button.nudge')||{dataset:{}}).dataset.t,
          modal:[...document.querySelectorAll('.intro.on')].map(e=>e.innerText.slice(0,500)).join(' || '),
          toast:[...document.querySelectorAll('.toast.on, #toast.on, .toast')].map(e=>e.innerText).filter(x=>x).join(' | '),
          wave:S.wave, foes:foes.length, sold:healthy(2), dug:+S.dug.toFixed(2)}})()""")
        if st['toast'] and st['toast'] not in toastseen: toastseen.add(st['toast']); L('TOAST',st['toast'][:200])
        if st['modal']:
            k=st['modal'][:40]
            if k not in seen:
                seen.add(k); L('MODAL',st['modal'].replace('\n',' / ')[:500]); pg.screenshot(path=D+'/m%02d.png'%len(seen))
            pg.wait_for_timeout(1500)
            btns=pg.locator('.intro.on button'); 
            if btns.count(): btns.last.click()
            continue
        if st['gi']!=gi:
            gi=st['gi']; L('GOAL',gi+1,(st['goal'] or '').replace('\n',' / ')[:200],'| ants',st['ants'],'food',st['food'],'/',st['cap'],'jelly',st['jelly'],'tier',st['tier'],'dug',st['dug']); pg.screenshot(path=D+'/g%02d.png'%(gi+1))
        if st['foes'] and not getattr(sys.modules[__name__],'fs',0):
            sys.modules[__name__].fs=1; L('FOES',st['foes'],'soldiers',st['sold']); pg.screenshot(path=D+'/fight0.png')
            for k in range(1,5):
                pg.wait_for_timeout(2500); pg.screenshot(path=D+'/fight%d.png'%k); L('fight',pg.evaluate("JSON.stringify(foes.map(f=>[+f.p.toFixed(3),Math.round(f.hp)]))+' queen '+Math.round(S.queenHp)+' tab '+tab"))
        if st['tier']!=tier: tier=st['tier']; L('TIER',tier)
        if time.time()-lastshot>60: lastshot=time.time(); pg.screenshot(path=D+'/t%03d.png'%int(time.time()-T0)); L('STATUS ants',st['ants'],'food',st['food'],'/',st['cap'],'jelly',st['jelly'],'tab',st['tab'],'wave',st['wave'],'dug',st['dug'],'queenTaps',taps)
        if st['nudge'] and st['nudge']!=st['tab']:
            pg.wait_for_timeout(1500); pg.click('.nav button.nudge'); L('TAB ->',st['nudge']); continue
        if st['tab']=='nest' and st['ct']<st['qy']<st['ct']+st['ch']:
            pg.touchscreen.tap(st['qx']+8,st['qy']); taps+=1
        if st['tab']=='col' and 'Level up' in (st['goal'] or ''):
            c=pg.evaluate("""(()=>{var t=[...document.querySelectorAll('#ctabs button')].find(b=>b.innerText.trim()=='Ants'); if(t&&!t.classList.contains('on'))t.click(); var r=[...document.querySelectorAll('[id^=ro-]')].find(b=>b.offsetParent&&!b.disabled); if(r){r.click();return r.innerText.slice(0,100)} return ''})()""")
            if c: L('LEVEL',c.replace('\n',' / '))
        if st['tab']=='nest' and ('building' in (st['goal'] or '') or 'chamber' in (st['goal'] or '')):
            c=pg.evaluate("""(()=>{var ids='building'.length&&%s?['store','nursery']:['fungus','nursery'];for(var id of ids){bcard(id);var b=document.querySelector('#bcard.on button.dig:not([disabled])');if(b){var t=b.innerText;b.click();$('bcclose').click();return id+': '+t}}$('bcclose').click();return ''})()""" % ('true' if 'building' in (st['goal'] or '') else 'false'))
            if c: L('NEST CARD',c.replace('\n',' / '))
        if st['tab']=='col' and ('building' in (st['goal'] or '') or 'chamber' in (st['goal'] or '')):
            sel = "button[onclick^='startBuild']" if 'building' in st['goal'] else "button[onclick^='upRoom']"
            c=pg.evaluate('''(sel)=>{var t=[...document.querySelectorAll('#ctabs button')].find(b=>b.innerText.trim()=='Build'); if(t)t.click(); var r=[...document.querySelectorAll(sel)].find(b=>!b.disabled); if(r){r.click();return r.innerText.slice(0,80)} return ''}''', sel)
            if c: L('BUILD',c.replace('\n',' / '))
        if st['tab']=='col':
            # tap any affordable highlighted action that matches the goal
            clicked=pg.evaluate("""(()=>{var bs=[...document.querySelectorAll('#p-col button, #p-col .card')].filter(b=>b.offsetParent&&!b.disabled&&!b.classList.contains('off')&&!b.classList.contains('dim'));
               var want=/^Dig a|Level up|Lv /i; for(var b of bs){var t=b.innerText; if(want.test(t)&&!/locked/i.test(t)){b.click();return t.slice(0,120)}} return ''})()""")
            if clicked: L('CLICK',clicked.replace('\n',' / '))
        pg.wait_for_timeout(1200)
    L('END errors',errs)
    pg.screenshot(path=D+'/end.png')
    b.close()
