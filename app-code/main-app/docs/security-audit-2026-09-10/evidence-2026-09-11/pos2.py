import time,json,subprocess
from playwright.sync_api import sync_playwright
B='http://127.0.0.1:8010'
res=[]
def ok(n,c,i=''): res.append(c); print(('PASS ' if c else 'FAIL ')+n+(' | '+str(i)[:300] if i else ''),flush=True)
def q(sql): return subprocess.run(['mysql','-uroot','-N','amd_pos_e2e','-e',sql],capture_output=True,text=True).stdout.strip()
sales0=int(q("select count(*) from sales") or 0)
st0=float(q("select sum(quantity) from stocks")); b0=float(q("select remaining_qty from inventory_batches where purchase_invoice_id='opening-e2e'"))
with sync_playwright() as p:
    br=p.chromium.launch(); ctx=br.new_context(storage_state='state.json',viewport={'width':1440,'height':900}); page=ctx.new_page()
    posts=[]
    page.on('dialog',lambda d:(print('DIALOG',d.message[:300]),d.dismiss()))
    page.on('pageerror',lambda e: print('PAGEERR',str(e)[:200]))
    page.on('response',lambda r: (posts.append((r.request.method,r.status,r.url)),print('RESP',r.request.method,r.status,r.url)) if r.request.method!='GET' or r.status>=400 else None)
    page.goto(B+'/s/e2e-mart/pos',wait_until='networkidle'); time.sleep(3)
    d=page.locator('[role=dialog][aria-label="Set up this register"]')
    if d.count():
        d.get_by_role('button',name='Skip for now').click(); time.sleep(1)
    s=page.locator('input[placeholder^="Scan barcode"]').first
    s.fill('E2E Wid'); time.sleep(3)
    page.get_by_text('SKU: E2E-WIDGET').first.click(); time.sleep(2)
    body=page.inner_text('body')
    ok('item added to cart','1,500' in body and ('1 LINES' in body.upper() or '1 LINE' in body.upper()), body[:300])
    page.get_by_role('button',name='Exact').first.click(); time.sleep(1)
    page.screenshot(path='pos3.png')
    page.get_by_role('button',name='Complete & Print').first.click(); time.sleep(8)
    page.screenshot(path='pos4.png')
    sp=[x for x in posts if x[0]=='POST' and x[2].rstrip('/').endswith('/sales')]
    ok('checkout POST /sales succeeded', sp and sp[-1][1] in (200,201,302), sp)
    sales1=int(q("select count(*) from sales") or 0)
    ok('sale row written', sales1==sales0+1, f'{sales0}->{sales1}')
    ok('stock decremented by 1', float(q("select sum(quantity) from stocks"))==st0-1, (st0,q("select sum(quantity) from stocks")))
    ok('FIFO batch consumed by 1', float(q("select remaining_qty from inventory_batches where purchase_invoice_id='opening-e2e'"))==b0-1, b0)
    tb=q("select round(sum(debit)-sum(credit),2) from journal_items") if q("show tables like 'journal_items'") else q("select round(sum(debit)-sum(credit),2) from journal_entry_lines")
    ok('ledger balanced', tb in ('0.00','0','-0.00'), tb)
    ok('browser heartbeat accepted', any(x[1]==200 and x[2].endswith('/api/heartbeat') for x in posts) and not any(x[1]>=400 and x[2].endswith('/api/heartbeat') for x in posts))
    br.close()
print('SUMMARY',sum(res),'/',len(res))
