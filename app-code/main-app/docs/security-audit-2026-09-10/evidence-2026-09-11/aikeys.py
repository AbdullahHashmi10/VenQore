import time, sys
from playwright.sync_api import sync_playwright
from common import B, totp
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium' if False else None)
    pg=b.new_page(viewport={'width':1400,'height':1000})
    pg.goto(B+'/VenQore-login', wait_until='networkidle')
    pg.fill('input[name=email]','owner-e2e@example.test'); pg.fill('input[name=password]','Str0ng!Passw0rd#2026')
    pg.click('form button[type=submit]'); time.sleep(3)
    print('after login', pg.evaluate('location.pathname'))
    if pg.evaluate('location.pathname').startswith('/2fa'):
        pg.locator('input[name=code]').first.fill(totp('JBSWY3DPEHPK3PXP')); pg.keyboard.press('Enter'); time.sleep(3)
    print('after 2fa', pg.evaluate('location.pathname'))
    pg.goto(B+'/VenQore?view=settings', wait_until='networkidle'); time.sleep(2)
    h=pg.get_by_text('AI provider keys').first
    h.scroll_into_view_if_needed(); time.sleep(0.5)
    pg.screenshot(path='/tmp/e2e/aikeys-before.png', full_page=True)
    pg.locator('input[placeholder="Paste key"]').nth(0).fill('AIzaFREE-e2e-9876')
    pg.locator('input[placeholder="Paste key"]').nth(2).fill('sk-ant-e2e-5555')
    pg.locator('select').last.select_option('anthropic')
    pg.get_by_role('button', name='Save AI keys').click(); time.sleep(3)
    pg.goto(B+'/VenQore?view=settings', wait_until='networkidle'); time.sleep(2)
    html=pg.content()
    ok1='ends 9876' in html; ok2='ends 5555' in html; leak='AIzaFREE-e2e-9876' in html or 'sk-ant-e2e-5555' in html
    print(('PASS' if pg.evaluate('location.pathname')=='/VenQore' else 'FAIL'), 'platform owner: first 2FA code after /VenQore-login accepted (no 419)')
    print(('PASS' if ok1 and ok2 else 'FAIL'), 'free Gemini key and paid Claude key saved side by side, shown masked')
    print(('PASS' if not leak else 'FAIL'), 'no key in the dashboard HTML')
    pg.get_by_text('AI provider keys').first.scroll_into_view_if_needed()
    pg.screenshot(path='/tmp/e2e/aikeys-after.png', full_page=True)
    pub=p.chromium.launch().new_page(); pub.goto(B+'/pricing', wait_until='networkidle')
    pl='AIzaFREE-e2e-9876' in pub.content() or 'sk-ant-e2e-5555' in pub.content()
    print(('PASS' if not pl else 'FAIL'), 'no key on the public /pricing page')
    b.close()
