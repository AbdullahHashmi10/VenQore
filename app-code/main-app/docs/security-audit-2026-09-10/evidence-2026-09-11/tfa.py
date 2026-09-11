import time,json,re,hmac,hashlib,struct,base64
from playwright.sync_api import sync_playwright
B='http://127.0.0.1:8010'; LOG='/home/claude/vq/main/storage/logs/laravel.log'
a=json.load(open('acct.json'))
def totp(secret,t=None):
    k=base64.b32decode(secret.upper()+'='*((8-len(secret)%8)%8)); c=int((t or time.time())//30)
    h=hmac.new(k,struct.pack('>Q',c),hashlib.sha1).digest(); o=h[-1]&15
    return '%06d'%((struct.unpack('>I',h[o:o+4])[0]&0x7fffffff)%1000000)
res=[]
def ok(n,c,i=''): res.append(bool(c)); print(('PASS ' if c else 'FAIL ')+n+(' | '+str(i)[:300] if i else ''),flush=True)
def here(p): return p.evaluate('location.pathname')
def logsize(): return len(open(LOG,errors='replace').read())
with sync_playwright() as p:
    import sys; sys.path.insert(0,'/tmp/e2e'); from common import login as _login
    br=p.chromium.launch(); ctx=br.new_context(); page=ctx.new_page()
    page.on('dialog',lambda d:d.dismiss())
    _login(page,a['email'],a['pw'])
    page.goto(B+'/2fa/setup',wait_until='networkidle')
    key=re.search(r'Key:\s*([A-Z2-7]{16,})',page.inner_text('body')).group(1)
    page.fill('input[name=code], input#code, input[inputmode=numeric]','123456'); page.get_by_role('button',name='Confirm & Enable').click(); time.sleep(3)
    ok('2FA wrong code refused', here(page)=='/2fa/setup', page.inner_text('body')[:200])
    k2=re.search(r'Key:\s*([A-Z2-7]{16,})',page.inner_text('body'))
    ok('setup key unchanged after a wrong code', k2 and k2.group(1)==key, (key, k2 and k2.group(1)))
    page.fill('input[name=code], input#code, input[inputmode=numeric]',totp(key)); page.get_by_role('button',name='Confirm & Enable').click(); time.sleep(4)
    ok('2FA enabled with authenticator code', here(page)!='/2fa/setup' or 'recovery' in page.inner_text('body').lower(), here(page)+' '+page.inner_text('body')[:300])
    json.dump({'key':key},open('tfa.json','w'))
    ctx.storage_state(path='state.json')
    # fresh login
    ctx2=br.new_context(); pg=ctx2.new_page(); pg.on('dialog',lambda d:d.dismiss())
    pg.goto(B+'/login',wait_until='networkidle'); pg.fill('input[name=email]',a['email']); pg.fill('input[name=password]',a['pw'])
    before=logsize(); pg.click('form button[type=submit]')
    pg.wait_for_function("location.pathname.startsWith('/verify-code')",timeout=20000)
    time.sleep(1); s=open(LOG,errors='replace').read()[before:]; code=re.findall(r'code: (\d{6})',s)[-1]
    pg.fill('#otp-code',code); pg.click('form button[type=submit]'); time.sleep(4)
    print('AFTER EMAIL CODE',here(pg),pg.inner_text('body')[:400])
    if not here(pg).startswith('/2fa'):
        pg.goto(B+'/s/e2e-mart/dashboard',wait_until='networkidle'); time.sleep(2); print('AFTER STORE NAV',here(pg))
    ok('after email code, 2FA is asked', here(pg).startswith('/2fa'), here(pg)+' '+pg.inner_text('body')[:200])
    inp=pg.locator('input[name=code], input#code, input[inputmode=numeric]').first
    inp.fill('000000'); pg.keyboard.press('Enter'); time.sleep(3)
    ok('2FA wrong code refused at login', here(pg).startswith('/2fa'), here(pg))
    time.sleep(1); inp=pg.locator('input[name=code], input#code, input[inputmode=numeric]').first
    inp.fill(totp(key)); pg.keyboard.press('Enter'); time.sleep(4)
    ok('2FA code completes login', not here(pg).startswith('/2fa') and here(pg)!='/login', here(pg))
    # contact form
    pg3=br.new_context().new_page()
    pg3.goto(B+'/contact',wait_until='networkidle'); posts=[]
    pg3.on('response',lambda r: posts.append((r.status,r.url)) if r.request.method=='POST' else None)
    pg3.fill('#c-name','E2E Tester'); pg3.fill('#c-biz','E2E Mart'); pg3.fill('#c-email','e2e.contact@example.com'); pg3.fill('#c-msg','Hello, this is an end-to-end test of the contact form. Please ignore.')
    pg3.locator('#c-msg').locator('xpath=ancestor::form[1]').locator('button').last.click(); time.sleep(5)
    st=pg3.locator('[role=status],[role=alert],[aria-live]').all_inner_texts()
    ok('contact form submits and confirms', any(p[0] in (200,201) and p[1].endswith('/contact') for p in posts) and any('Thank you' in t for t in st), (posts,st))
    json.dump({'key':key},open('tfa.json','w'))
    br.close()
print('SUMMARY',sum(res),'/',len(res))
