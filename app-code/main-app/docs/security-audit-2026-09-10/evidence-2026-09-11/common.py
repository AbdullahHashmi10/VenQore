import time,hmac,hashlib,struct,base64,json
B='http://127.0.0.1:8010'
def totp(secret,t=None):
    k=base64.b32decode(secret.upper()+'='*((8-len(secret)%8)%8)); c=int((t or time.time())//30)
    h=hmac.new(k,struct.pack('>Q',c),hashlib.sha1).digest(); o=h[-1]&15
    return '%06d'%((struct.unpack('>I',h[o:o+4])[0]&0x7fffffff)%1000000)
def pass2fa(page):
    if page.evaluate('location.pathname').startswith('/2fa/verify'):
        key=json.load(open('/tmp/e2e/tfa.json'))['key']
        page.locator('input[name=code]').first.fill(totp(key)); page.keyboard.press('Enter'); time.sleep(4)

LOG='/home/claude/vq/main/storage/logs/laravel.log'
def login(page, email, pw):
    import re, time
    page.goto(B+'/login', wait_until='networkidle')
    page.fill('input[name=email]', email); page.fill('input[name=password]', pw)
    before=len(open(LOG,errors='replace').read())
    page.click('form button[type=submit]')
    page.wait_for_function("location.pathname.startsWith('/verify-code')", timeout=20000)
    code=None
    for _ in range(30):
        s=open(LOG,errors='replace').read()[before:]
        m=re.findall(r'code: (\d{6})', s)
        if m: code=m[-1]; break
        time.sleep(0.5)
    page.fill('#otp-code', code); page.click('form button[type=submit]')
    page.wait_for_function("!location.pathname.startsWith('/verify-code')", timeout=20000)
    time.sleep(1)
    pass2fa(page)
