import json,re,threading,subprocess,requests,time
B='http://127.0.0.1:8010'
st=json.load(open('state.json'))
def q(sql): return subprocess.run(['mysql','-uroot','-N','amd_pos_e2e','-e',sql],capture_output=True,text=True).stdout.strip()
s=requests.Session()
for c in st['cookies']: s.cookies.set(c['name'],c['value'],domain=c['domain'],path=c['path'])
h=s.get(B+'/s/e2e-mart/pos').text
tok=re.search(r'name="csrf-token" content="([^"]+)"',h).group(1)
pl=json.loads(json.load(open('salepayload.json'))['body'])
# leave exactly 1 unit
PID=pl['items'][0]['product_id']
q(f"update inventory_batches set remaining_qty=1 where purchase_invoice_id='opening-e2e'; update stocks set quantity=1 where product_id='{PID}'")
n0=int(q('select count(*) from sales'))
out=[]
def fire():
    r=s.post(B+'/s/e2e-mart/sales',json=pl,headers={'X-CSRF-TOKEN':tok,'X-Requested-With':'XMLHttpRequest','Accept':'application/json'})
    out.append((r.status_code,r.text[:160]))
ts=[threading.Thread(target=fire) for _ in range(2)]
[t.start() for t in ts]; [t.join() for t in ts]
print(out)
print('sales created',int(q('select count(*) from sales'))-n0,'| batch remaining',q("select remaining_qty from inventory_batches where purchase_invoice_id='opening-e2e'"),'| stocks (this product)',q(f"select sum(quantity) from stocks where product_id='{PID}'"))
print('ledger diff',q('select round(sum(debit)-sum(credit),2) from journal_items'))
