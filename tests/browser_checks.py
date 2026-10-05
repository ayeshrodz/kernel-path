"""Production-route and learning-flow checks; starts a local preview when needed."""
from contextlib import contextmanager
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import re
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import threading
from playwright.sync_api import sync_playwright
from browser_server import preview_server
from waiting import wait_until

# The app's own heading: the build also writes each page's text (with an <h1>) for search engines, and the app replaces it.
APP_H1 = '.shell h1, #root > main:not(.prerendered) h1'

ROOT = Path(__file__).resolve().parents[1]
PROGRAM = 'rhel9-ansible'
BASE = os.environ.get('PLAYBOOK_TEST_URL', 'http://127.0.0.1:4173/')

# Any security-policy violation is a failure: scripts, styles, fonts and connections stay on this site.
CSP_WATCH = "window.__csp = []; document.addEventListener('securitypolicyviolation', e => window.__csp.push(e.violatedDirective + ' ' + e.blockedURI));"


@contextmanager
def site_with_content(origin, public_key=None):
    """A copy of the built engine, served on its own port, configured to load content from `origin`.
    A deployment does the same: the configuration names the content and the page's security policy lists
    it (the build writes the policy; here it is edited to match). Yields the copy's base URL."""
    with tempfile.TemporaryDirectory() as temp:
        copy = Path(temp) / 'site'
        shutil.copytree(ROOT / 'dist', copy, ignore=shutil.ignore_patterns('content', 'lab'))
        assert 'connect-src &#39;self&#39;' in (copy / 'index.html').read_text()
        # Every page the build wrote carries the policy (404.html and the prerendered pages too).
        for page_file in copy.rglob('*.html'):
            html = page_file.read_text()
            page_file.write_text(html.replace('connect-src &#39;self&#39;', 'connect-src &#39;self&#39; ' + origin.rstrip('/')))
        config = {'contentBase': origin, **({'publicKey': public_key} if public_key else {})}
        (copy / 'kernel.config.json').write_text(json.dumps(config))
        server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(copy)))
        threading.Thread(target=server.serve_forever, daemon=True).start()
        try:
            yield f'http://127.0.0.1:{server.server_address[1]}/'
        finally:
            server.shutdown()
            server.server_close()


def go(page, route, base=None):
    page.goto((base or BASE) + '#/' + PROGRAM + route)
    page.locator(APP_H1).first.wait_for()
    page.wait_for_load_state('networkidle')
    wait_until(page, "!document.querySelector('.skeleton')")
    assert not page.evaluate('window.__csp || []'), ('security policy violation', route, page.evaluate('window.__csp'))


def engine_has_no_course_text():
    """The built engine is generic: no chapter or section title from the content bundle appears in its code."""
    site = json.loads((ROOT / 'dist/content/site.json').read_text())
    manifest = json.loads((ROOT / 'dist/content' / next(p for p in site['programs'] if p['id'] == PROGRAM)['manifest']).read_text())
    titles = {c['title'] for c in manifest['chapters']} | {s['title'] for c in manifest['chapters'] for s in c['sections']}
    code = ''.join(f.read_text() for f in (ROOT / 'dist/assets').glob('*.js'))
    leaked = sorted(t for t in titles if t in code)
    assert not leaked, f'course text compiled into the engine: {leaked}'


class QuietHandler(SimpleHTTPRequestHandler):
    """Serves like GitHub Pages: an address without a file gets 404.html, where the app takes over."""

    def send_head(self):
        target = Path(self.translate_path(self.path))
        if not target.exists() and not Path(self.path.split('?')[0]).suffix and (Path(self.directory) / '404.html').exists():
            self.path = '/404.html'
        return super().send_head()

    def log_message(self, *args):
        pass


class CorsHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def log_message(self, *args):
        pass


def content_from_another_origin(browser):
    """The engine loads its content from whatever origin kernel.config.json names."""
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(CorsHandler, directory=str(ROOT / 'dist/content')))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    origin = f'http://127.0.0.1:{server.server_address[1]}/'
    try:
        with site_with_content(origin) as base:
            context = browser.new_context()
            page = context.new_page()
            requested = []
            page.on('request', lambda r: requested.append(r.url))
            page.goto(base + '#/' + PROGRAM + '/ch03/inventory')
            page.locator(APP_H1).first.wait_for()
            assert page.locator('h1').first.inner_text().endswith('Building an Ansible inventory')
            wait_until(page, "document.querySelectorAll('pre.shiki').length > 3")
            assert any(url.startswith(origin + 'p/') for url in requested), 'pages came from the content origin'
            assert not any(url.startswith(base + 'content/') for url in requested), 'nothing came from this site'
            context.close()
    finally:
        server.shutdown()


def serve_bundle(directory):
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(CorsHandler, directory=str(directory)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server, f'http://127.0.0.1:{server.server_address[1]}/'


def slow_program_switch(browser, origin, base=None):
    """Moving A → B → A while B is still loading leaves A in charge: B's late data is not installed."""
    base = base or BASE
    context = browser.new_context()
    page = context.new_page()
    if base == BASE:
        page.route('**/kernel.config.json', lambda route: route.fulfill(json={'contentBase': origin}))
    held = []
    page.route('**/p/second-program/manifest.*.json', lambda route: held.append(route))
    page.goto(base + '#/rhel9-ansible/ch02/why-automate')
    page.locator(APP_H1).first.wait_for()
    page.evaluate("location.hash = '#/second-program/ch01/hello'")
    for _ in range(100):
        if held:
            break
        page.wait_for_timeout(50)
    assert held, 'the second program started loading'
    page.evaluate("location.hash = '#/rhel9-ansible/ch03/inventory'")
    page.get_by_role('heading', name='Building an Ansible inventory').first.wait_for()
    held[0].continue_()
    page.wait_for_timeout(800)
    assert page.locator('h1').first.inner_text().endswith('Building an Ansible inventory')
    page.get_by_role('button', name='Mark this section complete').click()
    assert page.evaluate("JSON.parse(localStorage.getItem('rhce:rhel9-ansible@completed') || '[]')") == ['ch03/inventory']
    assert page.evaluate("localStorage.getItem('rhce:second-program@completed')") is None, 'progress went to the program on screen'
    context.close()


def programs_stay_separate(browser):
    """A second program has its own pages, search and progress; old addresses still open the first."""
    with tempfile.TemporaryDirectory() as temp:
        content = Path(temp) / 'content'
        shutil.copytree(ROOT / 'content', content)
        second = content / 'programs' / 'second-program'
        shutil.copytree(ROOT / 'packages/compiler/test/fixtures/second-program', second)
        # Only the two programs this test is about: the course and a small fixture.
        (content / 'site.yml').write_text((content / 'site.yml').read_text().replace('  - rhel9-sysadmin\n', '') + '  - second-program\n')
        out = Path(temp) / 'bundle'
        subprocess.run(['node', str(ROOT / 'packages/compiler/src/cli.js'), 'build', str(content), '--out', str(out)], check=True, capture_output=True)
        server, origin = serve_bundle(out)
        site = site_with_content(origin)
        try:
            base = site.__enter__()
            context = browser.new_context()
            page = context.new_page()
            # The site home lists every program, with the reader's progress in each.
            page.goto(base + '#/'); page.reload()
            page.get_by_role('heading', name='Learn Linux and automation by doing', level=1).wait_for()
            cards = page.locator('.showcase .sc')
            cards.first.wait_for()
            assert cards.count() == 2, page.locator('main').inner_text()[:600]
            assert 'Ansible automation on RHEL' in cards.nth(0).inner_text()
            assert 'Linux basics' in cards.nth(1).inner_text()
            assert not page.locator('.sidebar, .search-trigger').count(), 'the site home has no program navigation'
            # The first program keeps its own progress.
            go(page, '/ch02/why-automate', base)
            page.evaluate("localStorage.setItem('rhce:rhel9-ansible@completed', JSON.stringify(['ch02/why-automate']))")
            # The second program opens beside it, with its own navigation and empty progress.
            page.goto(base + '#/second-program/ch01/hello'); page.reload()
            page.locator(APP_H1).first.wait_for()
            assert page.locator('h1').first.inner_text().endswith('Saying hello')
            assert page.evaluate("JSON.parse(localStorage.getItem('rhce:second-program@completed') || '[]').length") == 0
            page.get_by_role('button', name='Mark this section complete').click()
            assert page.evaluate("JSON.parse(localStorage.getItem('rhce:second-program@completed'))") == ['ch01/hello']
            assert page.evaluate("JSON.parse(localStorage.getItem('rhce:rhel9-ansible@completed'))") == ['ch02/why-automate']
            page.get_by_role('link', name='Looking around').first.click()
            page.wait_for_url('**/second-program/ch01/next')
            assert not page.get_by_role('link', name='Building an Ansible inventory').count(), 'only this program is listed'
            # The program selector lists both programs and switches between them.
            page.get_by_role('button', name='Program: Linux basics (test fixture). Switch program').click()
            panel = page.get_by_role('dialog', name='Programs')
            assert panel.get_by_role('link', name='Ansible automation on RHEL 9').count() == 1
            panel.get_by_role('link', name='Ansible automation on RHEL 9').click()
            page.wait_for_url('**/rhel9-ansible')
            page.get_by_role('button', name='Program: Ansible automation on RHEL 9. Switch program').click()
            page.get_by_role('dialog', name='Programs').get_by_role('link', name='Linux basics (test fixture)').click()
            page.wait_for_url('**/second-program')
            page.get_by_role('heading', name='Linux basics (test fixture)', level=1).wait_for()
            page.goto(base + '#/second-program/ch01/next'); page.locator(APP_H1).first.wait_for()
            page.goto(base + '#/second-program/progress')
            page.get_by_role('heading', name='Your learning', level=1).wait_for()
            assert '0 of 2 sections complete' in page.locator('.reference-intro').inner_text() or '1 of 2 sections complete' in page.locator('.reference-intro').inner_text()
            page.goto(base + '#/second-program/ch01/next'); page.locator(APP_H1).first.wait_for()
            # Search covers this program only.
            page.get_by_role('button', name='Search the course').click()
            dialog = page.get_by_role('dialog', name='Search', exact=True); dialog.wait_for()
            box = dialog.get_by_role('combobox'); box.fill('zebrafish')
            dialog.get_by_role('option').first.wait_for()
            box.fill('inventory'); page.wait_for_timeout(300)
            assert dialog.get_by_role('option').count() == 0, 'the other program is not searched'
            page.keyboard.press('Escape')
            # The first program does not find the second one's words.
            go(page, '/ch02/why-automate', base)
            page.get_by_role('button', name='Search the course').click()
            dialog = page.get_by_role('dialog', name='Search', exact=True); dialog.wait_for()
            dialog.get_by_role('combobox').fill('zebrafish'); page.wait_for_timeout(300)
            assert dialog.get_by_role('option').count() == 0
            page.keyboard.press('Escape')
            # Addresses from before programs existed still work; unknown programs are a 404.
            page.goto(base + '#/ch03/inventory')
            page.wait_for_url('**/rhel9-ansible/ch03/inventory')
            page.goto(base + '#/no-such-program/ch01/x')
            page.get_by_role('heading', name="That page isn't here").wait_for()
            assert page.locator('.site-footer').count() == 1, 'the 404 page has the site frame'
            context.close()
            slow_program_switch(browser, origin, base)
        finally:
            site.__exit__(None, None, None)
            server.shutdown()


def planned_program_is_listed(browser):
    """Cards and authored/planned chapter states follow the compiled content for every program."""
    site = json.loads((ROOT / 'dist/content/site.json').read_text())
    context = browser.new_context()
    page = context.new_page()
    for entry in site['programs']:
        manifest = json.loads((ROOT / 'dist/content' / entry['manifest']).read_text())
        page.goto(BASE + '#/')
        cards = page.locator('.showcase .sc')
        cards.nth(len(site['programs']) - 1).wait_for()
        card = cards.filter(has_text=entry.get('showcase', {}).get('title', entry['title']))
        assert card.count() == 1, entry['id']
        assert ('Growing' in card.inner_text()) == (entry['status'] == 'planned')
        card.click()
        page.wait_for_url('**/' + entry['id'])
        page.locator(APP_H1).first.wait_for()
        assert not page.locator('.load-error').count(), entry['id']
        expected = sum(c['status'] == 'planned' or not c['sections'] for c in manifest['chapters'])
        wait_until(page, "document.querySelectorAll('.chapter-card').length === " + str(len(manifest['chapters'])))
        assert page.locator('.chapter-card.is-soon').count() == expected, entry['id']
        authored = next((c for c in manifest['chapters'] if c['sections']), None)
        if authored:
            section = authored['sections'][0]
            page.goto(BASE + '#/' + entry['id'] + '/' + authored['id'] + '/' + section['slug'])
            page.locator(APP_H1).first.wait_for()
            assert section['title'] in page.locator('h1').first.inner_text()
    context.close()


def new_signing_key(directory):
    """Make a signing key with the compiler's own command; returns (private key file, public JWK)."""
    key = Path(directory) / 'signing-key.pem'
    out = subprocess.run(['node', str(ROOT / 'packages/compiler/src/cli.js'), 'keygen', str(key)], check=True, capture_output=True, text=True).stdout
    return key, json.loads(out[out.index('{'):])['publicKey']


def signed_content(browser):
    """With a public key configured, only content signed by the matching private key is used."""
    with tempfile.TemporaryDirectory() as temp:
        key, public_key = new_signing_key(temp)
        (Path(temp) / 'other').mkdir()
        _, other_public = new_signing_key(Path(temp) / 'other')
        signed = Path(temp) / 'signed'
        subprocess.run(['node', str(ROOT / 'packages/compiler/src/cli.js'), 'build', str(ROOT / 'content'), '--out', str(signed), '--sign-key', str(key)], check=True, capture_output=True)
        server, origin = serve_bundle(signed)
        try:
            def open_with(configured_key, source_origin=origin):
                with site_with_content(source_origin, configured_key) as base:
                    context = browser.new_context()
                    page = context.new_page()
                    page.goto(base + '#/' + PROGRAM + '/ch03/inventory')
                    try:
                        page.locator(APP_H1).first.wait_for()
                        return page.locator('h1').first.inner_text(), context
                    except Exception:
                        return None, context

            title, context = open_with(public_key)
            assert title and title.endswith('Building an Ansible inventory'), 'signed content with the right key is used'
            context.close()
            title, context = open_with(other_public)
            assert title and 'could not load' in title.lower(), 'content signed by another key is refused'
            context.close()
        finally:
            server.shutdown()
        # Unsigned content is refused once a key is pinned.
        server, origin = serve_bundle(ROOT / 'dist/content')
        try:
            with site_with_content(origin, public_key) as base:
                context = browser.new_context()
                page = context.new_page()
                page.goto(base + '#/')
                page.locator('.boot-error').wait_for()
                assert 'not signed' in page.locator('.boot-error').inner_text()
                context.close()
        finally:
            server.shutdown()


def tampered_content_is_refused(browser):
    """A page whose JSON was altered in transit to carry markup or a script link is refused: its content
    no longer matches the fingerprint in its file name, so it is never parsed, let alone rendered."""
    for tamper in [
        lambda page: page['tree'].append({'t': 'el', 'tag': 'script', 'c': [{'t': 'text', 'v': 'window.pwned = 1'}]}),
        lambda page: page['tree'].append({'t': 'el', 'tag': 'a', 'attrs': {'href': 'javascript:window.pwned=1'}, 'c': [{'t': 'text', 'v': 'x'}]}),
        lambda page: page['tree'].append({'t': 'tag', 'name': 'callout', 'attrs': {'title': {'object': True}}}),
    ]:
        context = browser.new_context()
        page = context.new_page()

        def handler(change):
            def fulfill(route):
                body = route.fetch().json()
                change(body)
                route.fulfill(json=body)
            return fulfill

        page.route('**/p/*/pages/ch03-inventory.*.json', handler(tamper))
        page.goto(BASE + '#/' + PROGRAM + '/ch03/inventory')
        page.locator('.load-error').wait_for()
        assert 'published fingerprint' in page.locator('.load-error').inner_text()
        assert page.evaluate('window.pwned') is None
        context.close()


engine_has_no_course_text()

with preview_server(BASE, ROOT):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        content_from_another_origin(browser)
        planned_program_is_listed(browser)
        tampered_content_is_refused(browser)
        signed_content(browser)
        programs_stay_separate(browser)
        context = browser.new_context(reduced_motion='reduce')
        context.add_init_script(CSP_WATCH)
        page = context.new_page(); errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        routes = json.loads((ROOT / 'node_modules/.cache/kernel-path/routes.json').read_text())
        for route in routes:
            go(page, route)
            wait_until(page, "!document.querySelector('.prose .widget[role=status]')")
            assert 'Page not found' not in page.locator('h1').first.inner_text(), route
            assert not page.locator('.load-error').count(), route
            assert 'This activity could not load' not in page.inner_text('body'), route
            assert 'Kernel Path' in page.title(), route
            assert page.locator('.brand-name').inner_text() == 'Kernel Path', route
            assert 'Playbook Path' not in page.inner_text('body'), route
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), route
            overflowing_tables = page.locator('.table-wrap').evaluate_all('(tables) => tables.filter(t => t.clientWidth && t.scrollWidth > t.clientWidth + 1).map(t => t.querySelector("thead")?.textContent)')
            assert not overflowing_tables, f'tables overflow on {route}: {overflowing_tables}'
        # Shared tables fit their containers, retain header associations and never alter commands.
        table_routes = ['/ch01/troubleshooting', '/ch01/overview', '/ch01/create-and-verify-vms', '/ch03/lab-inventory', '/ch06/file-modules', '/ch10/storage', '/platform']
        for theme in ['light', 'dark']:
            for width in [390, 768, 1024, 1440]:
                page.set_viewport_size({'width': width, 'height': 1000})
                for route in table_routes:
                    go(page, route)
                    page.evaluate('(theme) => document.documentElement.dataset.theme = theme', theme)
                    errors_in_tables = page.locator('.table-wrap').evaluate_all("""(tables) => tables.filter(t => t.clientWidth).flatMap(t => {
                        const problems = [];
                        if (t.scrollWidth > t.clientWidth + 1) problems.push('horizontal scrolling');
                        for (const c of t.querySelectorAll('td, th')) {
                            if (c.clientWidth && c.scrollWidth > c.clientWidth + 1) problems.push('overflowing cell');
                        }
                        const table = t.querySelector('table');
                        if (table.getAttribute('role') !== 'table') problems.push('missing table semantics');
                        const labels = [...table.querySelectorAll('thead th')].map(h => h.textContent.trim());
                        if ([...table.querySelectorAll('thead th')].some(h => h.scope !== 'col')) problems.push('missing header scope');
                        for (const row of table.querySelectorAll('tbody tr')) {
                            [...row.cells].forEach((cell, i) => {
                                if (cell.dataset.label !== labels[i]) problems.push('incorrect mobile label');
                            });
                        }
                        if (t.clientWidth <= 640 && getComputedStyle(table).display !== 'block') problems.push('missing row cards');
                        if (t.clientWidth > 640 && getComputedStyle(table).tableLayout !== 'fixed') problems.push('missing desktop columns');
                        return problems;
                    })""")
                    assert not errors_in_tables, f'{route} {theme} {width}: {errors_in_tables}'
                    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        page.set_viewport_size({'width': 1440, 'height': 1000}); go(page, '/ch01/troubleshooting#general-problems')
        command = page.locator('.content-table code').filter(has_text='sudo iptables -I DOCKER-USER -i rhcebr0 -j ACCEPT').first
        assert command.inner_text() == 'sudo iptables -I DOCKER-USER -i rhcebr0 -j ACCEPT'
        selected_command = command.evaluate("""(e) => {
            const range = document.createRange(); range.selectNodeContents(e);
            const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
            const text = selection.toString(); selection.removeAllRanges(); return text;
        }""")
        assert selected_command == command.text_content(), 'Soft wrapping must preserve copied commands'
        table = page.locator('.table-wrap').nth(1)
        row = table.locator('tbody tr').filter(has_text="VMs can't reach the internet")
        page.wait_for_timeout(1500)  # let the jump to #general-problems settle before scrolling the row
        row.evaluate("(e) => e.scrollIntoView({block: 'start', behavior: 'instant'})")
        pinned_header = table.locator('thead th').first.bounding_box()
        assert abs(pinned_header['y'] - page.locator('.header').bounding_box()['height']) <= 1
        link = table.get_by_role('link', name='repair the lab', exact=True).first
        link.focus(); assert link.evaluate('(e) => e === document.activeElement')
        link.click(); wait_until(page, "document.getElementById('repair-an-existing-lab').getBoundingClientRect().top < 150")
        # The platform badge navigates to a track-owned reference page.
        go(page, '/')
        lesson_before_reference = page.evaluate("localStorage.getItem('rhce:rhel9-ansible@lastVisited')")
        page.get_by_role('button', name='Program: Ansible automation on RHEL 9. Switch program').click()
        page.get_by_role('link', name='RHEL 9: Platform and versions', exact=True).click()
        page.get_by_role('heading', name='RHEL 9: Platform and versions', exact=True).wait_for()
        assert page.url.endswith('/rhel9-ansible/platform')
        assert not page.get_by_role('dialog').count()
        assert page.title() == 'RHEL 9: Platform and versions · Kernel Path'
        page.get_by_role('tab', name='Home lab', exact=True).click()
        diagram = page.locator('.tabs-panel:not([hidden]) .diagram')
        diagram.get_by_role('button', name='Runtime', exact=True).click()
        assert 'baseline disables execution environments' in diagram.locator('.dg-info-text').inner_text()
        page.get_by_role('tab', name='Classroom reference', exact=True).click()
        diagram = page.locator('.tabs-panel:not([hidden]) .diagram')
        runtime = diagram.get_by_role('button', name='EE container', exact=True)
        runtime.focus(); page.keyboard.press('Enter')
        assert 'does not mean the managed hosts must run RHEL 8' in diagram.locator('.dg-info-text').inner_text()
        assert runtime.get_attribute('aria-pressed') == 'true'
        diagram.locator('.dg-node').first.click()
        assert diagram.get_by_role('button', name='Project', exact=True).get_attribute('aria-pressed') == 'true'
        page.get_by_role('tab', name='Classroom reference', exact=True).focus(); page.keyboard.press('Home')
        assert page.get_by_role('tab', name='Home lab', exact=True).get_attribute('aria-selected') == 'true'
        assert page.evaluate("JSON.parse(localStorage.getItem('rhce:rhel9-ansible@completed') || '[]').length") == 0
        assert not page.locator('.complete-btn').count()
        assert page.evaluate("localStorage.getItem('rhce:rhel9-ansible@lastVisited')") == lesson_before_reference
        for theme in ['light', 'dark']:
            for width in [390, 1440]:
                page.set_viewport_size({'width': width, 'height': 1000})
                go(page, '/platform#check-what-will-actually-run')
                page.evaluate('(theme) => document.documentElement.dataset.theme = theme', theme)
                wait_until(page, "document.getElementById('check-what-will-actually-run').getBoundingClientRect().top < 150")
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'platform {theme} {width}'
                page.reload(); page.locator('#check-what-will-actually-run').wait_for()
                assert page.title() == 'RHEL 9: Platform and versions · Kernel Path'
        page.set_viewport_size({'width': 1440, 'height': 1000})
        # Every graded lab has a separately authored challenge; help is closed by default.
        lab_routes = [exercise['lesson'][1:] for exercise in json.loads((ROOT / 'packages/engine/src/data/labReportSchema.json').read_text())['exercises'].values()]
        for route in lab_routes:
            go(page, route)
            page.get_by_role('button', name='Challenge', exact=True).click()
            brief = page.locator('.lab-challenge')
            assert brief.is_visible() and brief.locator('li').count() >= 2, route
            walkthrough = page.locator('.lab-walkthrough')
            assert walkthrough.get_attribute('open') is None, route
            assert not page.locator('.lab-task').first.is_visible(), route
            assert not brief.locator('pre').count(), route
            assert not page.get_by_text('Open hints and steps', exact=True).count(), route
            walkthrough.locator(':scope > summary').click()
            assert page.locator('.lab-task').first.is_visible(), route
            assert all(text.strip() for text in page.locator('.lab-task').all_inner_texts()), route
            page.get_by_role('button', name='Guided', exact=True).click()
            assert not page.locator('.lab-challenge').count(), route
            assert page.locator('.lab-task').first.is_visible(), route
        # Setup instructions remain a walkthrough; task checks survive mode changes/reload.
        go(page, '/ch01/prepare-host')
        assert not page.locator('.lab-mode').count()
        go(page, '/ch10/lab-archives')
        task = page.locator('.lab-task').first
        task.get_by_role('checkbox').click()
        page.get_by_role('button', name='Challenge', exact=True).click()
        page.reload(); page.locator('.lab-walkthrough > summary').click()
        assert page.locator('.lab-task').first.get_by_role('checkbox').get_attribute('aria-checked') == 'true'
        go(page, '/ch10/lab-archives#task-56ef7e8d45cf')
        wait_until(page, "document.querySelector('.lab-walkthrough').open")
        assert page.locator('#task-56ef7e8d45cf').is_visible()
        page.get_by_role('button', name='Guided', exact=True).click()
        assert page.locator('.lab-mode').evaluate('(e) => e.classList.contains("option-switch")')
        assert not page.locator('.lab-mode .btn-primary').count()
        assert page.locator('h1').inner_text().endswith('Exercise: Archiving and restoring files')
        # Dashboard typography and action spacing in both themes and viewports.
        for theme in ['light', 'dark']:
            for width in [390, 1440]:
                page.set_viewport_size({'width': width, 'height': 1000}); go(page, '/progress')
                page.evaluate('(theme) => document.documentElement.dataset.theme = theme', theme)
                assert page.locator('h1').evaluate('(e) => getComputedStyle(e).fontWeight') == '500'
                assert page.locator('.dashboard-card h2').first.evaluate('(e) => getComputedStyle(e).marginTop') == '0px'
                assert not page.locator('.learning-dashboard .btn-primary').count()
                assert page.get_by_role('link', name='Continue lesson').evaluate('(e) => e.getBoundingClientRect().height') == page.locator('.dashboard-actions .btn').evaluate('(e) => e.getBoundingClientRect().height')
                assert page.locator('.dashboard-actions').evaluate('(e) => parseFloat(getComputedStyle(e).marginBottom)') >= 16
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        for route in ['/platform', '/progress', '/ch02/quiz', '/ch03/inventory', '/ch06/jinja2-templates', '/ch11/assessment-release', '/ch11/assessment-operations']:
            page.set_viewport_size({'width': 390, 'height': 844}); go(page, route)
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'mobile {route}'
        # Mobile drawer focus and Escape return.
        go(page, '/')
        opener = page.get_by_role('button', name='Open navigation')
        opener.click()
        assert page.evaluate("document.querySelector('#course-navigation').contains(document.activeElement)")
        page.keyboard.press('Escape'); assert opener.evaluate('(e) => e === document.activeElement')
        page.set_viewport_size({'width': 1440, 'height': 1000})
        # Course map: filter, sliding highlight, one open chapter, rail flyouts.
        go(page, '/ch04/variables')
        nav = page.locator('#course-navigation')
        mark = "() => { const m = document.querySelector('.map-chapter.is-open .map-marker'), a = document.querySelector('.map-chapter.is-open a[aria-current=page]'); return Math.abs(m.getBoundingClientRect().top - a.getBoundingClientRect().top) }"
        assert page.evaluate(mark) < 1
        nav.locator('a[href$="/ch04/facts"]').click(); page.wait_for_timeout(700)
        assert page.evaluate(mark) < 1
        nav.get_by_role('button', name='Expand chapter 5').click()
        assert nav.get_by_role('button', name='Collapse chapter 5').count() and not nav.get_by_role('button', name='Collapse chapter 4').count()
        assert nav.locator('#map-ch04').get_attribute('inert') is not None
        box = nav.get_by_role('searchbox', name='Filter sections by title or number')
        box.fill('vault')
        visible = nav.locator('.map-section-link').evaluate_all('(ls) => ls.filter((l) => !l.closest("[inert]")).length')
        assert visible >= 1 and nav.locator('mark').count() >= 1
        box.press('Enter'); page.locator('h1').filter(has_text='Vault').wait_for()
        box.fill('no such section'); assert nav.locator('.map-empty').is_visible()
        box.press('Escape'); assert box.input_value() == ''
        nav.get_by_role('button', name='Collapse sidebar').click(); entry = page.locator('.rail-entry').nth(3); entry.hover()
        flyout = entry.locator('.rail-flyout'); flyout.wait_for(state='visible')
        assert page.evaluate('(e) => e.getBoundingClientRect().right <= innerWidth', flyout.element_handle())
        flyout.locator('a').first.click(); page.locator('h1').filter(has_text='4.1').wait_for()
        nav.get_by_role('button', name='Expand sidebar').click()
        # Keyboard dialog containment and focus return.
        search = page.get_by_role('button', name='Search the course')
        search.click(); dialog = page.get_by_role('dialog', name='Search', exact=True); dialog.wait_for()
        page.keyboard.press('Shift+Tab'); assert dialog.evaluate('(e) => e.contains(document.activeElement)')
        page.keyboard.press('Escape'); assert search.evaluate('(e) => e === document.activeElement')
        # Diagrams drawn from data: selecting a box explains it, and steps move through a sequence.
        go(page, '/ch02/architecture')
        figure = page.locator('figure.diagram').first
        figure.locator('.dg-node.is-clickable').first.click()
        assert figure.locator('.dg-info-title').count() == 1 and figure.locator('.dg-node.is-active').count() == 1
        figure.locator('.dg-node.is-clickable').first.click()
        assert figure.locator('.dg-node.is-active').count() == 0 and figure.locator('.dg-info-hint').count() == 1
        # A selectable group works from the keyboard too.
        go(page, '/ch02/automation-platform')
        group = page.locator('figure.diagram .dg-group-select').first
        group.focus(); page.keyboard.press('Enter')
        assert group.get_attribute('aria-pressed') == 'true'
        assert 'execution environment' in page.locator('figure.diagram .dg-info-title').first.inner_text().lower()
        go(page, '/ch02/architecture')
        stepped = page.locator('figure.diagram').nth(1)
        before = stepped.locator('.dg-arrow.is-hot').count()
        stepped.get_by_role('button', name='Next').click()
        assert re.search(r'\b2\b', stepped.locator('.step-index').inner_text()), 'the second step is shown'
        assert stepped.locator('.dg-badge text').text_content() == '2'
        # Links into optional detail still open the containing reveal.
        go(page, '/ch03/configuration')
        heading = page.locator('details .quiz-item[id]').first
        assert heading.count(), 'Optional details must preserve heading targets'
        if heading.count():
            target = heading.get_attribute('id')
            go(page, '/ch03/configuration#' + target)
            wait_until(page, '(id) => { const e = document.getElementById(id); return e && e.closest("details").open }', target)
        # Quiz attempt, reload, and review queue.
        go(page, '/ch02/quiz')
        first = page.locator('.quiz-item').first
        first.locator('.quiz-option').nth(1).click()
        page.reload(); first.wait_for(); assert 'Not quite.' in first.inner_text()
        go(page, '/progress'); assert page.get_by_role('link', name='Which term best describes the Ansible architecture?').count()
        # Chapter practice uses the same multiple-choice quiz as every other question,
        # logs attempts for the dashboard, and stays independent of reading completion.
        go(page, '/ch02/quiz'); activity = page.locator('.quiz').nth(1)
        assert activity.locator('#challenge-desired-state').count()
        assert not activity.get_by_role('button', name='Check answer').count()
        assert not activity.locator('textarea').count()
        quiz = page.locator('.quiz').first
        for property in ['padding', 'borderRadius', 'backgroundColor']:
            assert activity.evaluate('(e, prop) => getComputedStyle(e)[prop]', property) == quiz.evaluate('(e, prop) => getComputedStyle(e)[prop]', property)
        activity.locator('#challenge-desired-state').get_by_role('button', name='ok', exact=True).click()
        assert activity.locator('.quiz-explain.is-correct').count() == 1
        assert page.evaluate("JSON.parse(localStorage.getItem('rhce:rhel9-ansible@challenge:desired-state')).at(-1).passed")
        page.reload(); activity.wait_for(); assert activity.locator('.quiz-explain.is-correct').count() == 1
        assert page.evaluate("JSON.parse(localStorage.getItem('rhce:rhel9-ansible@completed') || '[]').length") == 0
        # Optional timer survives reload.
        go(page, '/ch11/assessment-release'); page.get_by_role('button', name='Start 90-minute timer').click()
        page.reload(); page.locator('[role=timer]').wait_for(); assert 'remaining' in page.locator('[role=timer]').inner_text()
        # Backups through the actual UI, malformed rejection, and valid restoration.
        page.locator('.header-progress').click()
        with page.expect_download() as downloaded: page.get_by_role('button', name='Export', exact=True).click()
        assert downloaded.value.suggested_filename.startswith('kernel-path-progress-')
        with tempfile.TemporaryDirectory() as temp:
            file = Path(temp) / 'progress.json'; downloaded.value.save_as(file)
            backup = json.loads(file.read_text()); assert backup['version'] == 3 and backup['program'] == PROGRAM
            assert backup['app'] == 'kernel-path'
            malformed = Path(temp) / 'invalid.json'; malformed.write_text(json.dumps({**backup, 'data': {'completed': False}}))
            page.locator('.progress-panel input[type=file]').set_input_files(malformed)
            page.get_by_text('Invalid progress entry: completed', exact=True).wait_for()
            assert json.loads(page.evaluate("localStorage.getItem('rhce:rhel9-ansible@challenge:desired-state')"))[0]['passed']
            page.locator('.progress-panel input[type=file]').set_input_files(file)
            page.locator('.progress-message').filter(has_text='Restored').wait_for()
        page.keyboard.press('Escape')
        # Complete grading reports import as independent practice evidence.
        go(page, '/progress')
        catalog = json.loads((ROOT / 'packages/engine/src/data/labReportSchema.json').read_text())
        exercise = catalog['exercises']['system-archive']; cp = exercise['checkpoints']['final']
        ids = ['file:' + f for f in cp['files']] + [x['id'] for x in cp.get('local', [])] + ['group:' + g for g in cp.get('groups', {})] + [probe['id'] + ':' + host for probe in cp['probes'] for host in probe['targets']]
        report = {'app': 'playbook-path-lab', 'version': 1, 'exerciseId': 'system-archive', 'exerciseVersion': exercise['version'], 'checkpointId': 'final', 'checkedAt': '2026-10-02T00:00:00Z', 'checks': [{'id': id, 'status': 'pass', 'message': 'Requirement observed', 'lesson': exercise['lesson']} for id in ids]}
        with tempfile.TemporaryDirectory() as temp:
            file = Path(temp) / 'lab-report.json'; file.write_text(json.dumps(report))
            page.locator('article input[type=file]').set_input_files(file)
            page.get_by_text('Saved system-archive / final.', exact=False).wait_for()
            assert page.evaluate("JSON.parse(localStorage.getItem('rhce:rhel9-ansible@labReports')).length") == 1
            assert page.evaluate("JSON.parse(localStorage.getItem('rhce:rhel9-ansible@completed') || '[]').length") == 0
            file.write_text(json.dumps({**report, 'checks': report['checks'][1:]}))
            page.locator('article input[type=file]').set_input_files(file)
            page.get_by_text('The lab report is incomplete:', exact=False).wait_for()
            assert page.evaluate("JSON.parse(localStorage.getItem('rhce:rhel9-ansible@labReports')).length") == 1
        # Cross-tab updates.
        go(page, '/progress'); other = context.new_page(); go(other, '/')
        other.evaluate("localStorage.setItem('rhce:rhel9-ansible@completed', JSON.stringify(['ch02/why-automate']))")
        wait_until(page, "document.querySelector('.dashboard-stats dd').innerText.trim().split(/\\s+/)[0] === '1'")
        # Readiness migration and preference updates should stay independent.
        other.close()
        blocked = browser.new_context()
        blocked.add_init_script("Storage.prototype.getItem = Storage.prototype.setItem = () => { throw new Error('blocked') }")
        blocked_page = blocked.new_page(); go(blocked_page, '/progress')
        assert 'storage is unavailable' in blocked_page.inner_text('body')
        corrupt = browser.new_context()
        corrupt.add_init_script("localStorage.setItem('rhce:rhel9-ansible@completed', 'false'); localStorage.setItem('rhce:rhel9-ansible@readiness', '{broken')")
        corrupt_page = corrupt.new_page(); go(corrupt_page, '/progress')
        assert corrupt_page.locator('h1').inner_text() == 'Your learning'
        assert corrupt_page.evaluate("localStorage.getItem('rhce:rhel9-ansible@completed')") == 'false'
        assert not errors, errors
        print(f'PASS: {len(routes)} routes, {len(lab_routes)} authored lab modes, light/dark dashboard spacing, mobile layouts, keyboard dialogs, responsive table layouts, unchanged command selection, activity feedback, timer persistence, progress round trips, cross-tab updates and unavailable storage')
        browser.close()
