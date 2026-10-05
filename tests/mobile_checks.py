"""Phone/tablet route coverage and shared mobile interaction contracts.

Run after npm run build with a preview at KERNEL_TEST_URL (default :4173).
Chromium emulation covers layout and interactions; physical-device checks remain separate.
"""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_server import preview_server
from waiting import wait_until

# The app's own heading: the build also writes each page's text (with an <h1>) for search engines, and the app replaces it.
APP_H1 = '.shell h1, #root > main:not(.prerendered) h1'

PROGRAM = 'rhel9-ansible'
BASE = os.environ.get('KERNEL_TEST_URL', os.environ.get('PLAYBOOK_TEST_URL', 'http://127.0.0.1:4173/'))
ROOT = Path(__file__).resolve().parents[1]
ROUTES = json.loads((ROOT / 'node_modules/.cache/kernel-path/routes.json').read_text())

def go(page, route):
    page.goto(BASE + '#/' + PROGRAM + route)
    page.locator(APP_H1).first.wait_for()
    page.wait_for_load_state('networkidle')
    wait_until(page, "!document.querySelector('.skeleton, .prose .widget[role=status]')")
    assert not page.locator('.load-error').count(), route
    assert 'This activity could not load' not in page.inner_text('body'), route

def fits(page, element):
    rect = element.bounding_box()
    size = page.viewport_size
    assert rect and rect['x'] >= -1 and rect['y'] >= -1, rect
    assert rect['x'] + rect['width'] <= size['width'] + 1, rect
    assert rect['y'] + rect['height'] <= size['height'] + 1, rect

def check_code_headers(page):
    problems = page.locator('.code-head').evaluate_all("""headers => headers.filter(h => h.clientWidth).flatMap(h => {
        const frame = h.getBoundingClientRect();
        const issues = [];
        for (const child of h.querySelectorAll('.code-label, .is-file, .code-lang, .code-actions, .code-copy, .ayaml-hint')) {
            const r = child.getBoundingClientRect();
            if (r.width && (r.top < frame.top - 1 || r.bottom > frame.bottom + 1 || r.left < frame.left - 1 || r.right > frame.right + 1))
                issues.push('header does not contain ' + child.className + ': ' + child.textContent);
        }
        const label = h.querySelector('.code-label')?.getBoundingClientRect();
        const actions = h.querySelector('.code-actions')?.getBoundingClientRect();
        if (label && actions && label.left < actions.right && label.right > actions.left && label.top < actions.bottom && label.bottom > actions.top)
            issues.push('title overlaps actions');
        const code = h.nextElementSibling?.getBoundingClientRect();
        if (code && code.top < frame.bottom - 1) issues.push('header overlaps code');
        return issues;
    })""")
    assert not problems, (page.url, page.viewport_size, problems)

with preview_server(BASE, ROOT):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, reduced_motion='reduce')
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        for width, height in [(320, 740), (390, 844), (768, 1024)]:
            page.set_viewport_size({'width': width, 'height': height})
            for route in ROUTES:
                go(page, route)
                assert page.evaluate('(width) => document.documentElement.scrollWidth <= width && innerWidth <= width', width), (width, route)
                overflowing_diagrams = page.locator('.diagram-viewport').evaluate_all("""elements => elements.filter(e =>
                    e.clientWidth && (e.scrollWidth > e.clientWidth + 1 || e.querySelector('svg').getBoundingClientRect().width > e.clientWidth + 1)
                ).map(e => e.querySelector('svg').getAttribute('aria-label'))""")
                assert not overflowing_diagrams, (width, route, overflowing_diagrams)
                check_code_headers(page)
                tiny_editors = page.locator('textarea, input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]), select').evaluate_all("""elements => elements.filter(e => {
                    const r = e.getBoundingClientRect();
                    return r.width && r.height && parseFloat(getComputedStyle(e).fontSize) < 16;
                }).map(e => e.className)""")
                assert not tiny_editors, (width, route, tiny_editors)
        # Resize the same mounted page between breakpoints, including intermediate widths.
        for route in ['/', '/ch01/create-and-verify-vms', '/ch02/architecture', '/ch03/writing-playbooks', '/ch05/task-failure']:
            go(page, route)
            for width in [320, 360, 412, 480, 540, 640, 700, 820, 960, 1200, 1440]:
                page.set_viewport_size({'width': width, 'height': 900})
                wait_until(page, '(width) => innerWidth === width', width)
                assert page.evaluate('(width) => document.documentElement.scrollWidth <= width', width), (route, width)
                check_code_headers(page)
                badge = page.locator('.brand-pill').bounding_box()
                logo = page.locator('.brand svg').bounding_box()
                assert badge['height'] <= logo['height'] + 1, (route, width, badge)
                for diagram in page.locator('.diagram-viewport').all():
                    assert diagram.evaluate('(e) => e.scrollWidth <= e.clientWidth + 1'), (route, width)
        # All overlays fit narrow, normal and landscape phone viewports in both themes.
        for theme in ['light', 'dark']:
            for width, height in [(320, 740), (390, 844), (844, 390)]:
                page.set_viewport_size({'width': width, 'height': height})
                go(page, '/ch03/inventory')
                page.evaluate('(theme) => document.documentElement.dataset.theme = theme', theme)
                for name, dialog_name, close in [('Open navigation', 'Course navigation', 'Escape'), ('Search', 'Search', 'Escape'), ('Your progress', 'Your progress', 'Escape')]:
                    opener = page.locator('.search-icon-only:visible, .search-trigger:visible') if name == 'Search' else page.get_by_role('button', name=name, exact=True)
                    opener.click()
                    dialog = page.get_by_role('dialog', name=dialog_name, exact=True)
                    dialog.wait_for(); fits(page, dialog)
                    assert page.evaluate("document.body.style.overflow === 'hidden'")
                    page.keyboard.press('Shift+Tab')
                    assert dialog.evaluate('(e) => e.contains(document.activeElement)')
                    page.keyboard.press(close)
                    assert opener.evaluate('(e) => e === document.activeElement')
                    assert page.evaluate("document.body.style.overflow !== 'hidden'")
        page.set_viewport_size({'width': 390, 'height': 844})
        go(page, '/ch03/inventory')
        outline = page.locator('.page-outline'); outline.locator('summary').click()
        heading_button = outline.locator('button').first
        heading_text = heading_button.inner_text()
        heading_button.click()
        assert not outline.evaluate('(e) => e.open')
        assert page.evaluate("document.activeElement.matches('h2, h3')")
        # The drawer opens with focus on Close (no keyboard pops up), shows the open page, and swipes closed.
        page.get_by_role('button', name='Open navigation', exact=True).click()
        drawer = page.get_by_role('dialog', name='Course navigation', exact=True); drawer.wait_for()
        assert page.evaluate("document.activeElement.getAttribute('aria-label')") == 'Close navigation'
        swipe = """(n, path) => { const ev = (type, [x, y]) => n.dispatchEvent(new PointerEvent(type, {pointerType: 'touch', clientX: x, clientY: y, bubbles: true}));
            ev('pointerdown', path[0]); for (const point of path.slice(1)) ev('pointermove', point); ev('pointerup', path.at(-1)); }"""
        drawer.evaluate(swipe, [[300, 400], [295, 300], [290, 200]])
        assert drawer.count(), 'a vertical drag must not close the drawer'
        drawer.evaluate(swipe, [[300, 400], [260, 402], [160, 404], [90, 405]])
        wait_until(page, "!document.querySelector('[role=dialog][aria-label=\"Course navigation\"]')")
        # Header overlays share one controller: switching never stacks focus traps.
        page.get_by_role('button', name='Open navigation', exact=True).click()
        page.get_by_role('button', name='Your progress', exact=True).click()
        progress = page.get_by_role('dialog', name='Your progress', exact=True)
        progress.wait_for()
        assert not page.get_by_role('dialog', name='Course navigation').count()
        page.keyboard.press('Control+k')
        search = page.get_by_role('dialog', name='Search', exact=True)
        search.wait_for()
        assert not page.get_by_role('dialog', name='Your progress', exact=True).count()
        assert search.evaluate('(e) => e.contains(document.activeElement)')
        assert page.evaluate("document.body.style.overflow === 'hidden'")
        page.keyboard.press('Escape')
        # The program selector opens as a sheet that fits the phone, and the site home needs no sidebar.
        go(page, '/ch03/inventory')
        page.get_by_role('button', name='Program: Ansible automation on RHEL 9. Switch program').click()
        selector = page.get_by_role('dialog', name='Programs', exact=True); selector.wait_for()
        assert selector.evaluate('(e) => { const r = e.getBoundingClientRect(); return r.left >= -1 && r.right <= innerWidth + 1; }')
        # It shares the header's overlay controller: opening search replaces it instead of stacking.
        page.keyboard.press('Control+k')
        page.get_by_role('dialog', name='Search', exact=True).wait_for()
        assert not page.get_by_role('dialog', name='Programs', exact=True).count()
        page.keyboard.press('Escape')
        assert not page.get_by_role('dialog', name='Search', exact=True).count()
        page.goto(BASE + '#/')
        page.get_by_role('heading', name='Learn Linux and automation by doing', level=1).wait_for()
        page.locator('.showcase .sc').first.wait_for()
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), 'the site home must not scroll sideways'
        go(page, '/ch03/inventory')
        # Controlled editors retain selection and state through shared tool interactions.
        editor = page.locator('.code-editor').first
        area = editor.locator('textarea')
        area.fill('[web]\nservera')
        area.evaluate('(e) => e.setSelectionRange(6, 13)')
        editor.get_by_role('button', name='Indent', exact=True).click()
        assert area.input_value() == '[web]\n  servera'
        editor.get_by_role('button', name='Outdent', exact=True).click()
        assert area.input_value() == '[web]\nservera'
        assert area.get_attribute('autocapitalize') == 'off'
        assert area.evaluate('(e) => getComputedStyle(e).fontSize') == '16px'
        editor.get_by_role('button', name='Wrap lines').click()
        assert area.get_attribute('wrap') == 'off'
        area.focus(); page.keyboard.press('Tab')
        assert not area.evaluate('(e) => e === document.activeElement')
        # Diagrams fit by default. Extra zoom is an explicit, reversible choice.
        go(page, '/ch03/writing-playbooks')
        diagram = page.locator('.diagram').first
        assert diagram.locator('.diagram-viewport').evaluate('(e) => e.scrollWidth <= e.clientWidth + 1')
        opener = diagram.get_by_role('button', name='Enlarge diagram')
        opener.click(); dialog = page.get_by_role('dialog'); dialog.wait_for()
        fits(page, page.locator('.lightbox-body'))
        assert dialog.locator('.lightbox-viewport').evaluate('(e) => e.scrollWidth <= e.clientWidth + 1')
        dialog.get_by_role('button', name='Zoom in').click()
        wait_until(page, "document.querySelector('.lightbox-viewport').scrollWidth > document.querySelector('.lightbox-viewport').clientWidth")
        dialog.get_by_role('button', name='Fit to screen').click()
        wait_until(page, "document.querySelector('.lightbox-viewport').classList.contains('is-fit') && document.querySelector('.lightbox-viewport').scrollWidth <= document.querySelector('.lightbox-viewport').clientWidth + 1")
        dialog.get_by_role('button', name='Close diagram').click()
        assert opener.evaluate('(e) => e === document.activeElement')
        # Visual wrapping preserves exact source text and copied code.
        go(page, '/ch03/writing-playbooks')
        block = page.locator('.code-block').first
        source = block.locator('pre').text_content()
        block.get_by_role('button', name='Wrap lines').click()
        assert block.locator('pre').text_content() == source
        page.evaluate("Object.defineProperty(navigator, 'clipboard', {configurable:true, value:{writeText: async text => {window.copiedCode=text;}}})")
        block.get_by_role('button', name='Copy code', exact=True).click()
        assert page.evaluate('window.copiedCode') == source
        # Repeated activity runs retain state after a shell/theme render.
        go(page, '/ch03/modules-and-yaml')
        activity = page.locator('.cvm')
        activity.get_by_role('button', name='Run playbook').click()
        page.get_by_role('button', name='Theme:', exact=False).click()
        assert activity.get_by_role('button', name='Run #2').count()
        assert not errors, errors
        browser.close()
print(f'Mobile checks passed: {len(ROUTES)} routes at three widths, shared overlays, outline, editors, diagrams and activity state.')
