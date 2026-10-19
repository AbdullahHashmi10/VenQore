"""Give every source page a review card without pretending extraction is a UI test."""
from pathlib import Path
import csv,json,re
from collections import defaultdict
OUT=Path(__file__).resolve().parent.parent; APP=OUT.parent.parent; ROOT=APP.parent.parent
D=json.loads((OUT/'registry-evidence.json').read_text(encoding='utf-8-sig'))
P=list(csv.DictReader((OUT/'page-inventory.csv').open(encoding='utf-8')))
by_page=defaultdict(list)
for r in D['routes']:
    source=r.get('source')
    if not source:continue
    path=APP/source['file']
    if not path.exists():continue
    s='\n'.join(path.read_text(encoding='utf-8-sig',errors='replace').splitlines()[source['start']-1:source['end']])
    for name in re.findall(r'''Inertia::render\(\s*['"]([^'"]+)''',s):by_page[name].append(r)

purposes={
 'Inventory':'Maintain the product catalogue and inspect recorded stock.', 'V3':'Use the relevant inventory, accounting, purchasing or production workflow.',
 'Services':'Follow service requests, appointments, people, tools and billing.', 'Sales':'Find, create or inspect customer sales and their settlement.',
 'Foh':'Run table, takeaway and delivery service.', 'Restaurant':'Coordinate restaurant preparation and fulfilment.', 'TableService':'Configure or run dining-room work.',
 'Purchases':'Record and inspect supplier buying.', 'PurchaseOrders':'Manage intended purchases and receiving.', 'Payments':'Record and inspect incoming or outgoing settlements.',
 'Parties':'Maintain trading relationships and inspect balances.', 'Suppliers':'Maintain suppliers and inspect buying relationships.',
 'Reports':'Answer a business question using a filtered view; verify definitions and source totals.',
 'Commerce':'Give shoppers a catalogue, cart, checkout or order-follow-up experience.', 'OnlineStore':'Manage public-store settings, goods, promotions and incoming orders.',
 'OnsiteCatalogue':'Configure browsing or supported QR ordering at the business.', 'Marketing':'Explain the product, business fit, commercial offer or public resources.',
 'SuperAdmin':'Operate platform-wide business/account controls as an authorised platform operator.', 'Platform':'Operate platform-wide controls with privileged access.',
 'PlatformOwner':'Operate owner-only platform tools.', 'Accounting':'Inspect or maintain the accounting workspace.',
 'Staff':'Manage people, roles and their business access.', 'StaffAttendance':'Record and inspect staff presence.',
 'Auth':'Complete the relevant authentication or account-recovery step.', 'Settings':'Configure business behavior and connected tools.',
 'Builder':'Describe, review or change a workspace setup.', 'builder':'Support the workspace-building experience.', 'Workspace':'Review or create the business workspace.',
 'StockTransfers':'Move recorded stock between locations.', 'StockTake':'Count physical goods and review recorded differences.',
 'BankAccounts':'Maintain business bank-account records.', 'BankReconciliation':'Compare bank records with the books.', 'ChequeBooks':'Track cheque books, leaves and their lifecycle.',
 'BatchTracking':'Follow batches and expiry information.', 'SerialTracking':'Follow individual goods by serial or IMEI.', 'Cookbook':'Define and inspect recipes and their material costs.',
 'Manufacturing':'Record production inputs, output and history.', 'Returns':'Correct a sale or purchase through the supported return process.', 'DebitNotes':'Record supplier-side adjustments.',
 'Approvals':'Submit or decide sensitive business requests.', 'Billing':'Inspect account charges, plans, allowances and subscription actions.',
 'AiUsage':'Inspect AI usage and allowance.', 'GrowthEngine':'Review business insights with their supporting data.',
 'Dashboards':'Inspect or arrange a relevant view of the business.', 'VenSynQ':'Configure or inspect enabled marketplace connections.', 'WooCommerce':'Configure or inspect the supported website connection.',
 'Loyalty':'Inspect or manage supported repeat-customer points.', 'Gift':'Use the supported gift or redemption experience.',
 'Hub':'Select or organise the businesses the user can access.', 'Onboarding':'Complete business setup and learn the initial workflow.',
 'Profile':'Maintain the signed-in person’s details, access and preferences.', 'Help':'Find product guidance or assistance.', 'Apps':'Find supported device applications.',
 'Expenses':'Record and inspect operating spending.', 'Funds':'Inspect account balances and supported cash movements.', 'Finance':'Inspect business money and supported finance actions.',
 'SalesOrders':'Manage customer orders before fulfilment.', 'Proposals':'Prepare and follow a business proposal.', 'RecurringInvoices':'Configure and inspect repeat billing.',
 'Reminders':'Configure or inspect supported follow-up reminders.', 'Labels':'Prepare product and barcode print output.',
 'Notifications':'Review messages or events directed to the user.', 'Storefront':'Give visitors the supported public business experience.',
 'Updater':'Manage a supported application update, subject to release policy.', 'Installer':'Set up an installation; deployment checks still apply.', 'Demo':'Explore sample workflows.',
 'Errors':'Explain an unavailable, failed or refused operation.', 'Transactions':'Inspect the relevant recorded transaction.', 'Store':'Configure or select the business.',
 'Invite':'Accept or inspect a supported invitation.', 'Admin':'Use store administration or legacy administration surfaces.'}

out=['# Page-by-page reference','', 'Snapshot: 16 October 2026. Every React Pages file in the source inventory receives an entry below, including helper, compatibility and legacy files. Descriptions are editorial interpretations of the source area. Literal UI text and route bindings are extracted from code, not proof that the page rendered or an action succeeded. Some pages contain dynamic labels or indirect rendering that extraction cannot resolve. See the verification record for the limited screens actually inspected in a browser.','']
rows=[]
for p in P:
    name=p['page']; key=re.sub(r'\.(jsx|tsx|js)$','',name); path=ROOT/p['path']; text=path.read_text(encoding='utf-8-sig',errors='replace')
    # Only visible-copy-shaped literals, not arbitrary string constants or secrets.
    labels=[]
    for pattern in [r'''\b(?:title|label|placeholder|aria-label|description)=["']([^"'{}<>]{2,130})["']''',r'''<(?:button|h[1-6])[^>]*>\s*([^<>{}\n]{2,100})\s*</(?:button|h[1-6])>''']:
        labels+=re.findall(pattern,text)
    labels=list(dict.fromkeys(x.strip() for x in labels if x.strip()))
    matching=by_page.get(key,[])
    owners=[]
    for k,m in D['modules'].items():
        for declared in m.get('pages',[]):
            if name==declared or (declared.endswith('/') and name.startswith(declared)) or (not Path(declared).suffix and name.startswith(declared.rstrip('/')+'/')):
                owners.append(k);break
    area=name.split('/')[0] if '/' in name else 'Shared/root'
    description=purposes.get(area,'Support the shared application or the workflow named by this source page; determine exact entry and active status before demonstrating it.')
    row={'page':name,'purpose':description,'declared_modules':', '.join(owners),'direct_render_routes':'; '.join(f"{','.join(r['methods'])} /{r['uri']} [{r['name']}]" for r in matching),'literal_ui_text':'; '.join(labels),'route_refs':'; '.join(json.loads(p['route_refs'] or '[]')),'source':p['path'],'validation':'source extraction; see browser observation log separately'}
    rows.append(row)
    out+=['',f'## {name}','',description,'',f"Source: `{p['path']}`. Module declaration: {', '.join(owners) or 'not explicitly declared by path'}."]
    if matching:out+=['','Direct render route(s):']+['- `'+','.join(r['methods'])+' /'+r['uri']+'` — `'+str(r['name'])+'`' for r in matching]
    else:out+=['','No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.']
    if labels:out+=['','Literal interface text: '+ '; '.join(labels)+'.']
    refs=json.loads(p['route_refs'] or '[]')
    if refs:out+=['','Action/navigation references: '+', '.join('`'+x+'`' for x in refs)+'.']
    out+=['','How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.']
(OUT/'PAGE_BY_PAGE_REFERENCE.md').write_text('\n'.join(out)+'\n',encoding='utf-8')
with (OUT/'page-capabilities.csv').open('w',newline='',encoding='utf-8') as f:
    w=csv.DictWriter(f,list(rows[0]));w.writeheader();w.writerows(rows)

historical=(ROOT/'extras/Features/venqore_feature_catalog.md').read_text(encoding='utf-8-sig',errors='replace')
legacy=re.findall(r'^- (\d+)\. (.+)',historical,re.M)
hs=['# Historical feature-claim register','', 'The numbered claims below are preserved from extras/Features/venqore_feature_catalog.md so earlier promises are not lost. Their Built/Partial/Coming Soon labels belong to the old document and have not been re-certified. Some have been superseded by current source and browser evidence. Do not total these claims as current features. Use the current catalog and verification record for availability.','']
hs+=['| Historical ID | Historical description and evidence | Current review treatment |','| --- | --- | --- |']
for number,claim in legacy:hs.append('| '+number+' | '+claim.replace('|',' / ')+' | Historical claim; reconcile against current workflow before reuse |')
(OUT/'HISTORICAL_CLAIM_REGISTER.md').write_text('\n'.join(hs)+'\n',encoding='utf-8')
print(json.dumps({'page_reference_entries':len(rows),'pages_with_direct_route_bindings':sum(bool(r['direct_render_routes']) for r in rows),'historical_claims_preserved':len(legacy)}))
