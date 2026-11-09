#!/usr/bin/env python3
"""Builds the game from src/ into the files that get uploaded.

    python3 tools/build.py          build index.html and the-colony.html (release, preview tools off)
                                    and dev.html (preview tools on, for testing; not committed)
    python3 tools/build.py --check  fail if index.html is out of date with src/ (used by the GitHub check)

The game is still one self-contained HTML file when it ships, so hosting and the Android
wrapper work exactly as before. Edit the files in src/, never index.html directly."""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src')

def read(p):
    with open(p, encoding='utf-8') as f:
        return f.read()

def build(dev=False):
    tpl = read(os.path.join(SRC, 'index.html'))
    css = read(os.path.join(SRC, 'styles.css'))
    order = [l.strip() for l in read(os.path.join(SRC, 'js', 'ORDER')).splitlines() if l.strip() and not l.startswith('#')]
    parts = []
    for f in order:
        p = os.path.join(SRC, 'js', f)
        if not os.path.exists(p):
            sys.exit('build: %s is listed in src/js/ORDER but does not exist' % f)
        parts.append(read(p))
    listed = set(order)
    for d, _, fs in os.walk(os.path.join(SRC, 'js')):
        for f in fs:
            rel = os.path.relpath(os.path.join(d, f), os.path.join(SRC, 'js')).replace(os.sep, '/')
            if rel.endswith('.js') and rel not in listed:
                sys.exit('build: src/js/%s is not listed in src/js/ORDER, so it would be left out' % rel)
    js = '\n'.join(parts)
    if js.count('var DEV = false;') != 1:
        sys.exit('build: expected exactly one "var DEV = false;" in the source')
    if dev:
        js = js.replace('var DEV = false;', 'var DEV = true;')
    out = tpl.replace('\n<!-- @css: src/styles.css goes here -->\n', '\n' + css)
    out = out.replace('\n<!-- @js: the files listed in src/js/ORDER go here -->\n', '\n' + js)
    if '<!-- @css' in out or '<!-- @js' in out:
        sys.exit('build: a placeholder in src/index.html was not filled')
    return out

def build_number(js_text):
    m = re.search(r"\bBUILD = (\d+)", js_text)
    return int(m.group(1)) if m else None

def main():
    release = build(False)
    dev = build(True)
    sw = read(os.path.join(ROOT, 'sw.js'))
    n = build_number(release)
    sw_new = re.sub(r"var CACHE = 'colony-v\d+';", "var CACHE = 'colony-v%d';" % n, sw)
    targets = {'index.html': release, 'the-colony.html': release, 'sw.js': sw_new}
    if '--check' in sys.argv:
        stale = [f for f, t in targets.items() if read(os.path.join(ROOT, f)) != t]
        if stale:
            sys.exit('Out of date: %s. Run python3 tools/build.py and commit the result.' % ', '.join(stale))
        print('Built files are up to date (build %d).' % n)
        return
    for f, t in targets.items():
        with open(os.path.join(ROOT, f), 'w', encoding='utf-8') as h:
            h.write(t)
    with open(os.path.join(ROOT, 'dev.html'), 'w', encoding='utf-8') as h:
        h.write(dev)
    print('Built build %d: index.html, the-colony.html, sw.js (cache colony-v%d) and dev.html (preview tools on).' % (n, n))

if __name__ == '__main__':
    main()
