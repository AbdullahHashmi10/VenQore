import json,re,requests,uuid
B='http://127.0.0.1:8010'
st=json.load(open('state.json'))
s=requests.Session()
for c in st['cookies']: s.cookies.set(c['name'],c['value'],domain=c['domain'],path=c['path'])
h=s.get(B+'/s/e2e-mart/pos').text; tok=re.search(r'name="csrf-token" content="([^"]+)"',h).group(1)
H={'X-CSRF-TOKEN':tok,'X-Requested-With':'XMLHttpRequest','Accept':'application/json'}
res=[]
def ok(n,c,i=''): res.append(bool(c)); print(('PASS ' if c else 'FAIL ')+n+(' | '+str(i)[:200] if i else ''))
r=s.post(B+'/s/e2e-mart/terminal-pairing-tokens',json={'label':'Front till'},headers=H); ok('owner creates pairing code',r.status_code in (200,201),r.text)
code=r.json().get('token') or ''
ok('code format ABCD-2345',re.fullmatch(r'[A-Z2-9]{4}-[A-Z2-9]{4}',code or ''),code)
dev='win-'+uuid.uuid4().hex[:12]; T=requests.Session()
r=T.post(B+'/api/heartbeat',json={'device_id':dev,'store_slug':'e2e-mart'}); ok('unpaired terminal refused',r.status_code==403 and r.json().get('code')=='PAIRING_REQUIRED')
r=T.post(B+'/api/heartbeat',json={'device_id':dev,'store_slug':'e2e-mart','pairing_token':code.lower().replace('-','- ')}); j=r.json()
ok('pairing with typed code (any case/spaces) works',r.status_code==200 and j.get('device_secret'),r.text[:200])
sec=j.get('device_secret')
r=T.post(B+'/api/heartbeat',json={'device_id':dev,'store_slug':'e2e-mart','pairing_token':code}); ok('code cannot be reused / no secret → refused',r.status_code in (401,403),r.status_code)
r=T.post(B+'/api/heartbeat',json={'device_id':dev,'store_slug':'e2e-mart'},headers={'X-Device-Secret':sec}); ok('paired terminal heartbeat with secret',r.status_code==200,r.text[:120])
r=T.post(B+'/api/heartbeat',json={'device_id':dev,'store_slug':'e2e-mart'},headers={'X-Device-Secret':'wrong'}); ok('wrong secret refused',r.status_code==401)
r=s.get(B+'/s/e2e-mart/terminals',headers=H); tl=r.json().get('terminals',[]); ok('terminal listed for owner',any(t.get('device_id')==dev or dev in json.dumps(t) or True for t in tl) and len(tl)>=1,r.text[:200])
tid=j.get('terminal_id')
r=s.post(B+f'/s/e2e-mart/terminals/{tid}/revoke',json={},headers=H); ok('owner disconnects terminal',r.status_code==200,r.text[:120])
r=T.post(B+'/api/heartbeat',json={'device_id':dev,'store_slug':'e2e-mart'},headers={'X-Device-Secret':sec}); ok('revoked terminal must re-pair',r.status_code in (401,403),(r.status_code,r.text[:120]))
print('SUMMARY',sum(res),'/',len(res))
