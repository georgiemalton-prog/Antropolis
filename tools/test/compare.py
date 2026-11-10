#!/usr/bin/env python3
"""Replay the same fixed session on the last commit and on your working copy, and say which
parts differ (game state S, profile P, ants, invaders, termites, crickets, crews, page, picture).

Use it when check.py reports a difference, to see whether only text/visuals changed or the
game itself did.   python3 tools/test/compare.py   (or: compare.py <git-ref> to compare with another commit)
"""
import json, os, shutil, subprocess, sys, tempfile, threading, functools, http.server

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HERE = os.path.dirname(os.path.abspath(__file__))


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def run(tree):
    subprocess.run([sys.executable, os.path.join(tree, 'tools', 'build.py')], check=True, stdout=subprocess.DEVNULL, cwd=tree)
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=tree))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    out = os.path.join(tree, 'cmp.json')
    rp = os.path.join(HERE, 'replay.py')
    src = open(rp).read().replace("if label in", "if True or label in")   # keep every snapshot
    tmp = os.path.join(tree, 'replay_all.py')
    open(tmp, 'w').write(src)
    subprocess.run([sys.executable, tmp, 'http://127.0.0.1:%d/dev.html' % srv.server_address[1], out], check=True, stdout=subprocess.DEVNULL)
    srv.shutdown()
    snaps = {}
    for label in json.load(open(out)):          # checkpoints in the order they were played
        p = os.path.join(tree, 'cmp_' + label + '.snap')
        if os.path.exists(p):
            snaps[label] = json.loads(open(p).read())
    return snaps


def main():
    ref = sys.argv[1] if len(sys.argv) > 1 else 'HEAD'
    old = tempfile.mkdtemp()
    subprocess.run('git archive %s | tar -x -C %s' % (ref, old), shell=True, check=True, cwd=ROOT)
    for f in ['logo.jpg']:
        if os.path.exists(os.path.join(ROOT, f)):
            shutil.copy(os.path.join(ROOT, f), old)
    new = tempfile.mkdtemp()
    subprocess.run('git ls-files -co --exclude-standard | tar -cT - | tar -x -C %s' % new, shell=True, check=True, cwd=ROOT)
    print('Replaying %s and your working copy (a few minutes each)...' % ref)
    a, b = run(old), run(new)
    for label in a:
        if label not in b:
            continue
        diff = [k for k in a[label] if a[label][k] != b[label].get(k)]
        print('%-10s %s' % (label, ', '.join(diff) if diff else 'same'))


if __name__ == '__main__':
    main()
