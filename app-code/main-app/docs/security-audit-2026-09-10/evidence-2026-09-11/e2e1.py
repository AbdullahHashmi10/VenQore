import re,time,json,sys,subprocess
from playwright.sync_api import sync_playwright
B='http://127.0.0.1:8010'
LOG='/home/claude/vq/main/storage/logs/laravel.log'
res=[]
def ok(name,cond,info=''):
    res.append((name,bool(cond),info)); print(('PASS ' if cond else 'FAIL ')+name+(' | '+str(info)[:300] if info else ''),flush=True)
def latest_code(email,after):
    for _ in range(30):
        try: s=open(LOG,errors='replace').read()[after:]
        except FileNotFoundError: s=''
        i=s.rfind(email)
        m=re.findall(r'\b(\d{6})\b',s[i:] if i>=0 else '')
        if i>=0 and m: return m[0]
        time.sleep(0.5)
    return None
def logsize():
    try: return len(open(LOG,errors='replace').read())
    except FileNotFoundError: return 0
def here(page): return page.evaluate('location.pathname')
with sync_playwright() as p:
    br=p.chromium.launch(executable_path='/opt/pw-browsers/chromium' if __import__('os').path.isfile('/opt/pw-browsers/chromium') else None)
    ctx=br.new_context(viewport={'width':1280,'height':900})
    page=ctx.new_page()
    errs=[]
    page.on('pageerror',lambda e: errs.append(('pageerror',page.url,str(e))))
    page.on('console',lambda m: errs.append(('console',page.url,m.text)) if m.type=='error' else None)
    for u in ['/','/pricing','/features','/contact','/about','/blog','/help','/tools','/demo','/login','/register','/terms','/privacy','/nope-404-page']:
        errs.clear()
        r=page.goto(B+u,wait_until='networkidle',timeout=60000)
        body=page.inner_text('body')[:2000]
        real=[e for e in errs if 'googletagmanager' not in e[2] and 'turnstile' not in e[2].lower() and 'challenges.cloudflare' not in e[2]]
        ok(f'page {u} renders', (r.status==200 or (u=='/nope-404-page' and r.status==404)) and len(body.strip())>40 and not [e for e in real if e[0]=='pageerror'], f'status={r.status} errs={real[:3]}')
    # signup
    email=f'e2e{int(time.time())}@example.com'; pw='Str0ng!Passw0rd#2026'
    page.goto(B+'/register',wait_until='networkidle')
    page.fill('input[name=name]','E2E Owner'); page.fill('input[name=email]',email)
    page.fill('input[name=password]',pw); page.fill('input[name=password_confirmation]',pw)
    t=page.locator('#terms-checkbox')
    if t.count(): t.click()
    before=logsize()
    page.click('#register-submit')
    try: page.wait_for_function("location.pathname.startsWith('/verify-code')",timeout=20000)
    except Exception: pass
    ok('signup goes to code step','/verify-code' in here(page), page.url+' '+page.inner_text('body')[:200])
    code=latest_code(email,before); ok('signup code emailed (log mailer)',code,code)
    page.fill('#otp-code','000000'); page.click('form button[type=submit]'); time.sleep(3)
    ok('wrong code rejected','/verify-code' in here(page) and ('incorrect' in page.inner_text('body').lower() or 'invalid' in page.inner_text('body').lower() or 'wrong' in page.inner_text('body').lower() or 'not right' in page.inner_text('body').lower()), page.inner_text('body')[:300])
    page.fill('#otp-code',code or ''); page.click('form button[type=submit]')
    try: page.wait_for_function("!location.pathname.startsWith('/verify-code')",timeout=20000)
    except Exception: pass
    ok('right code signs in','/verify-code' not in here(page) and '/login' not in here(page), page.url+' '+page.inner_text('body')[:150])
    json.dump({'email':email,'pw':pw},open('/tmp/e2e/acct_new.json','w'))
    page.screenshot(path='/tmp/e2e/after_signup.png')
    # logout via POST
    page.evaluate("""async()=>{const t=document.querySelector('meta[name=csrf-token]').content;await fetch('/logout',{method:'POST',headers:{'X-CSRF-TOKEN':t,'X-Requested-With':'XMLHttpRequest'}})}""")
    ctx.clear_cookies()
    page.goto(B+'/login',wait_until='networkidle')
    page.fill('input[name=email]',email); page.fill('input[name=password]','wrong-password-1')
    page.click('form button[type=submit]'); page.wait_for_load_state('networkidle'); time.sleep(2)
    ok('wrong password stays on login','/login' in here(page), page.inner_text('body')[:200])
    page.fill('input[name=password]',pw); before=logsize()
    page.click('form button[type=submit]')
    try: page.wait_for_function("location.pathname.startsWith('/verify-code')",timeout=20000)
    except Exception: pass
    ok('login asks for emailed code','/verify-code' in here(page), page.url+' '+page.inner_text('body')[:300])
    code=latest_code(email,before); ok('login code emailed',code)
    page.fill('#otp-code',code or ''); page.click('form button[type=submit]')
    try: page.wait_for_function("!location.pathname.startsWith('/verify-code')",timeout=20000)
    except Exception: pass
    ok('login completes','/verify-code' not in here(page) and '/login' not in here(page), page.url)
    page.screenshot(path='/tmp/e2e/after_login.png')
    ctx.storage_state(path='/tmp/e2e/state_new.json')
    br.close()
print('SUMMARY',sum(r[1] for r in res),'/',len(res))
