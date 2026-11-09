#!/usr/bin/env python3
"""Proves the game still behaves exactly the same.

    python3 tools/test/check.py            build, then replay and compare with the saved baseline
    python3 tools/test/check.py --record   save a new baseline (only after a change that is MEANT to
                                           change gameplay or visuals; say so in the commit message)

A pure tidy-up (moving code, renaming, splitting functions) must match the baseline at every
checkpoint. Needs Python 3 and Playwright: pip install playwright && playwright install chromium"""
import functools, http.server, json, os, subprocess, sys, threading

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
BASE = os.path.join(HERE, 'replay-baseline.json')

def serve():
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
    h = functools.partial(Quiet, directory=ROOT)
    s = http.server.ThreadingHTTPServer(('127.0.0.1', 0), h)
    threading.Thread(target=s.serve_forever, daemon=True).start()
    return s

def main():
    subprocess.run([sys.executable, os.path.join(ROOT, 'tools', 'build.py')], check=True)
    os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
    out = os.path.join(HERE, 'out', 'replay.json')
    srv = serve()
    url = 'http://127.0.0.1:%d/dev.html' % srv.server_address[1]
    print('Replaying a fixed game session (takes a few minutes)...')
    subprocess.run([sys.executable, os.path.join(HERE, 'replay.py'), url, out], check=True, stdout=subprocess.DEVNULL)
    srv.shutdown()
    res = json.load(open(out))
    if res.get('pageerrors'):
        print('Errors on the page:', res['pageerrors'])
    if '--record' in sys.argv:
        json.dump(res, open(BASE, 'w'), indent=1)
        print('Saved a new baseline.')
        return
    base = json.load(open(BASE))
    diff = [k for k in base if k != 'pageerrors' and base[k] != res.get(k)]
    if diff or res.get('pageerrors'):
        print('DIFFERENT from the baseline at:', ', '.join(diff) or '(errors only)')
        print('If that was not meant to happen, the change altered the game. Snapshots are in tools/test/out/.')
        sys.exit(1)
    print('Identical to the baseline at every checkpoint (%d checkpoints).' % len([k for k in base if k != 'pageerrors']))

if __name__ == '__main__':
    main()
