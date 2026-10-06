"""Capture and compare rendered lesson HTML for every route.

    python3 tests/snapshots.py capture OUT.json   # from a built site (preview on :4173)
    python3 tests/snapshots.py compare A.json B.json

Used to prove that a change in how pages are produced (for example rendering from the
compiled content bundle) leaves what readers see unchanged. Capture normalises markup that
legitimately varies between renders (React ids), then compares route by route.
"""
import difflib
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROGRAM = 'rhel9-ansible'
BASE = os.environ.get('KERNEL_TEST_URL', 'http://127.0.0.1:4173/')

NORMALISE = [
    (re.compile(r'#/rhel9-ansible/?'), '#/'),
    (re.compile(r'\b(id|for|aria-controls|aria-labelledby|aria-describedby|href)="([^"]*?)«?:r[0-9a-z]+:»?([^"]*)"'), r'\1="\2(rid)\3"'),
    (re.compile(r'«r[0-9a-z]+»|:r[0-9a-z]+:|_r_[0-9a-z]+_'), '(rid)'),
    (re.compile(r'\s+'), ' '),
    (re.compile(r'> <'), '><'),
]


def normalise(html):
    for pattern, replacement in NORMALISE:
        html = pattern.sub(replacement, html)
    return html.strip()


def capture(out):
    sys.path.insert(0, str(ROOT / 'tests'))
    from playwright.sync_api import sync_playwright
    from browser_server import preview_server
from waiting import wait_until

# The app's own heading: the build also writes each page's text (with an <h1>) for search engines, and the app replaces it.
APP_H1 = '.shell h1, #root > main:not(.prerendered) h1'

    routes = json.loads((ROOT / 'node_modules/.cache/kernel-path/routes.json').read_text())
    snapshots = {}
    with preview_server(BASE, ROOT):
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_context(viewport={'width': 1280, 'height': 900}, reduced_motion='reduce').new_page()
            for route in routes:
                page.goto(BASE + '#/' + PROGRAM + route)
                page.locator(APP_H1).first.wait_for()
                wait_until(page, "!document.querySelector('.skeleton, .prose .widget[role=status]')")
                height = page.evaluate('document.body.scrollHeight')
                for y in range(0, height, 900):
                    page.evaluate(f'window.scrollTo(0, {y})')
                page.wait_for_timeout(300)
                snapshots[route] = {
                    'title': page.locator('h1').first.inner_text(),
                    'html': normalise(page.locator('main').first.inner_html()),
                }
            browser.close()
    Path(out).write_text(json.dumps(snapshots, indent=1, sort_keys=True))
    print(f'captured {len(snapshots)} routes into {out}')


def compare(a, b):
    left, right = json.loads(Path(a).read_text()), json.loads(Path(b).read_text())
    missing = sorted(set(left) ^ set(right))
    changed = sorted(r for r in set(left) & set(right) if left[r] != right[r])
    for route in missing:
        print(f'only in {"A" if route in left else "B"}: {route}')
    for route in changed[:20]:
        print(f'--- {route}')
        diff = difflib.unified_diff(
            re.sub(r'><', '>\n<', left[route]['html']).splitlines(),
            re.sub(r'><', '>\n<', right[route]['html']).splitlines(),
            lineterm='', n=1,
        )
        print('\n'.join(list(diff)[:30]))
    print(f'{len(left)} vs {len(right)} routes: {len(changed)} changed, {len(missing)} missing')
    return 0 if not changed and not missing else 1


if __name__ == '__main__':
    if len(sys.argv) == 3 and sys.argv[1] == 'capture':
        capture(sys.argv[2])
    elif len(sys.argv) == 4 and sys.argv[1] == 'compare':
        sys.exit(compare(sys.argv[2], sys.argv[3]))
    else:
        print(__doc__)
        sys.exit(2)
