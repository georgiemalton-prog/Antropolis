#!/usr/bin/env python3
"""Lint the game script with ESLint.

The files in src/js share one global scope, so they are linted joined together,
the same way tools/build.py joins them. Functions that are only called from
onclick="..." text in the HTML are listed as exported so they don't count as unused.

Usage:  python3 tools/lint.py          (needs eslint on PATH or in node_modules)
Messages point at src/js/<file>:<line>.
"""
import json, os, re, shutil, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JS = os.path.join(ROOT, 'src', 'js')


def files():
    for line in open(os.path.join(JS, 'ORDER')):
        line = line.strip()
        if line and not line.startswith('#'):
            yield line


def eslint():
    for c in [os.path.join(ROOT, 'node_modules', '.bin', 'eslint'), shutil.which('eslint') or '',
              '/opt/node-tools/node_modules/.bin/eslint']:
        if c and os.path.exists(c):
            return c
    sys.exit('eslint not found: run "npm install eslint" or put it on PATH')


def main():
    parts, where = [], []          # where[i] = (file, line) for joined line i+1
    text = open(os.path.join(ROOT, 'src', 'index.html')).read()
    for f in files():
        s = open(os.path.join(JS, f)).read()
        text += s
        for n, _ in enumerate(s.split('\n')):
            where.append((f, n + 1))
        parts.append(s)
    # names called from inline handlers like onclick="upHall()" (in HTML or in JS strings)
    handlers = sorted(set(re.findall(r'\bon[a-z]+=\\?["\']\s*(?:return\s+)?([A-Za-z_$][\w$]*)\s*\(', text)))
    head = '/* exported ' + ', '.join(handlers) + ' */\n'
    where.insert(0, ('(exported list)', 0))
    tmp = tempfile.mkdtemp()
    p = os.path.join(tmp, 'game.js')
    open(p, 'w').write(head + '\n'.join(parts))
    r = subprocess.run([eslint(), '-c', os.path.join(ROOT, 'eslint.config.js'), '-f', 'json', p],
                       capture_output=True, text=True, cwd=tmp,
                       env=dict(os.environ, NODE_PATH=os.environ.get('NODE_PATH', '/opt/node-tools/node_modules')))
    try:
        msgs = json.loads(r.stdout)[0]['messages']
    except Exception:
        sys.exit(r.stdout + r.stderr)
    bad = 0
    for m in msgs:
        f, n = where[m.get('line', 1) - 1] if m.get('line') else ('?', 0)
        kind = 'error' if m['severity'] == 2 else 'warning'
        bad += m['severity'] == 2
        print('src/js/%s:%d  %s  %s (%s)' % (f, n, kind, m['message'], m.get('ruleId')))
    print('%d problems, %d errors' % (len(msgs), bad))
    sys.exit(1 if msgs else 0)


if __name__ == '__main__':
    main()
