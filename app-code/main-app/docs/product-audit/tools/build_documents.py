"""Render documentation snapshots from canonical registries and editorial capability rows."""
from pathlib import Path
import csv, json, re, fnmatch
from collections import Counter
OUT=Path(__file__).resolve().parent.parent
APP=OUT.parent.parent
ROOT=APP.parent.parent
D=json.loads((OUT/'registry-evidence.json').read_text(encoding='utf-8-sig'))
S=json.loads((OUT/'coverage-summary.json').read_text())
def cell(v): return str(v or '—').replace('|',' / ').replace('\n',' ')
def table(h,rs): return '\n'.join(['| '+' | '.join(h)+' |','| '+' | '.join(['---']*len(h))+' |']+['| '+' | '.join(map(cell,r))+' |' for r in rs])
def link(p):return f'[{p}](../../{p})'
def write(n,s): (OUT/n).write_text(s+'\n',encoding='utf-8')
def csvout(n,rows,fields):
    with (OUT/n).open('w',newline='',encoding='utf-8') as f:
        w=csv.DictWriter(f,fields,extrasaction='ignore'); w.writeheader(); w.writerows(rows)

caps=[]; group=''; evidence=[]
for line in (OUT/'tools/capabilities.txt').read_text(encoding='utf-8').splitlines():
    if line.startswith('## '):
        group,ev=line[3:].split(' | ',1); evidence=ev.split(';')
        for path in evidence:
            p=ROOT/path[5:] if path.startswith('repo:') else APP/path
            assert p.exists(), f'Missing editorial evidence: {p}'
    elif line and not line.startswith('#'):
        title,benefit,how=line.split(' | ',2)
        caps.append(dict(id=f'CAP-{len(caps)+1:03}',group=group,capability=title,benefit=benefit,how=how,evidence='; '.join(evidence),validation='source-backed candidate; end-to-end validation pending'))
csvout('capability-catalog.csv',caps,list(caps[0]))
modules=D['modules']; routes=D['routes']; entries=D['manifest']['entries']
reports=[]
rs=(APP/'resources/js/lib/reportCatalog.js').read_text(encoding='utf-8')
for m in re.finditer(r"\{ key: '([^']+)', title: ([\"'])(.*?)\2, description: ([\"'])(.*?)\4, route: '([^']+)'",rs):
    reports.append(dict(key=m[1],title=m[3],description=m[5],route=m[6]))
csvout('report-catalog.csv',reports,['key','title','description','route'])
assert len(reports)==len(re.findall(r'\{ key:',rs)), 'Report parser missed a catalogue row'
readings=[e for e in entries if e['type']=='reading']; cards=[e for e in entries if e['type']=='card']
csvout('metric-catalog.csv',[{'key':e['id'],'title':e['title'],**{k:json.dumps(v,ensure_ascii=False) if isinstance(v,(list,dict)) else v for k,v in e['meta'].items()}} for e in readings],['key','title','domain','shape','unit','periods','permissions','scope'])
counts=[('Registered business types',len(D['business_types']['types'])),('Business sectors',len(D['business_types']['sectors'])),('Registered configurable modules',len(modules)),('Modules marked live by source registry',sum(m['status']=='live' for m in modules.values())),('Modules marked beta',sum(m['status']=='beta' for m in modules.values())),('Modules still building',sum(m['status']=='building' for m in modules.values())),('Editorial capability rows, including qualifications and internal operations',len(caps)),('Report-hub destinations',len(reports)),('Registered metric definitions, including platform-scoped readings',len(readings)),('Legacy dashboard card definitions exported by Vena',len(cards)),('Canonical how-to guides',len(D['guides'])),('Registered HTTP route entries, including API/actions/redirects',len(routes)),('React Pages files, including helper and legacy pages',S['pages'])]
catalog=['# VenQore feature and capability catalog','', 'Snapshot: 16 October 2026 · Audience: product, customer success and sales enablement.','',
'## What this count means','', 'This replaces the old approximate feature-count summary for this snapshot. There is no defensible single count of everything a customer can do: modules, reports, device integrations, workflow actions and metric definitions overlap. The following counts remain separate. The itemized capability rows are an editorial inventory of source-backed capabilities and candidates, not a count of production-certified features. No customer-facing marketing should lead with these counts.','',table(['Inventory unit','Count'],counts),'',
'## Evidence and readiness','', 'The application bootstrapped successfully and its router and canonical registries were exported without invoking business actions. Every route controller target that reflection could inspect existed; that check does not execute its logic or prove permissions, database correctness or usability. Source extraction read files and recorded functions, route references, render references, headings and review markers. It is not a claim of line-by-line human review. No complete regression suite or exhaustive authenticated browser walkthrough has passed as part of this snapshot.','',
'A registry status of live is the product’s own classification. It does not mean tested in this review, enabled on the deployed site, included in every plan or available on every device. The evidence JSON preserves module verify notes, permissions, dependency rules and route patterns. The review intentionally leaves uncertain claims visible.','',
'**Availability conflicts found in source:** bank reconciliation is marked live in the registry but its import method is a placeholder and its index returns empty data. E-invoicing is marked live but generation and waybill actions return HTTP 501. Marketing campaign creation and saving are placeholders. Do not treat the registry live count as a count of working workflows. See IMPLEMENTATION_MARKERS.md and VERIFICATION_AND_CLAIMS.md.','',
'## Capability inventory','', 'Each row describes something a customer or platform operator can do, its purpose, and its operating qualification. Evidence is grouped by the relevant implementation area; a referenced file is evidence of the workflow family, not independent proof of every sentence. Detailed route and page inventories are linked below.']
for g in dict.fromkeys(c['group'] for c in caps):
    cs=[c for c in caps if c['group']==g]
    catalog+=['',f'### {g}','', 'Source family: '+cs[0]['evidence']+'.','',table(['ID','Capability','Customer purpose','How / qualification'],[(c['id'],c['capability'],c['benefit'],c['how']) for c in cs])]
catalog+=['','## Every configurable module','', 'Generated from config/modules.php, not a second entitlement registry. Snapshot only; runtime availability comes from the actual module, plan, permission and capability gates.']
names={r['name'] for r in routes if r['name']}
for k,m in modules.items():
    matched=[r for r in routes if r['name'] and any(fnmatch.fnmatchcase(r['name'],pat) for pat in m.get('routes',[]))]
    unmatched=[pat for pat in m.get('routes',[]) if not any(r['name'] and fnmatch.fnmatchcase(r['name'],pat) for r in routes)]
    catalog+=['',f"### {m['id']}. {m['label']} (`{k}`)",'',m['description'],'',f"Registry status: **{m['status']}**. Billing classification: `{m.get('billing')}`. Matching route entries: {len(matched)}.",'',
    'Entry routes: '+', '.join(f"`{n['route']}`" for n in m.get('nav',[]) if n.get('route'))+'.',
    'Permissions: '+', '.join(f'`{x}`' for x in m.get('permissions',[]))+'.',
    'Required modules: '+', '.join(m.get('requires',[]))+'. Alternative dependency sets: '+json.dumps(m.get('requires_one',[]))+'.',
    'Page declarations: '+', '.join(f'`{x}`' for x in m.get('pages',[]))+'.']
    if unmatched:catalog+=['','Unmatched route declarations: '+', '.join(f'`{p}`' for p in unmatched)+'. These need investigation before using the declaration as evidence.']
    if m.get('verify'):catalog+=['','Recorded verification notes (some are historical or already resolved):']+['- '+x for x in m['verify']]
catalog+=['','## Reports and analysis destinations','', 'Generated from resources/js/lib/reportCatalog.js. A hub destination can be a report, analytics view, loyalty screen or another business view. Availability varies by module, role and plan; do not advertise this as an unconditional number of reports.','',table(['Title','Question answered','Route'],[(r['title'],r['description'],r['route']) for r in reports]),'','## Further evidence','', '- [Every page and source scope](PAGE_AND_SOURCE_COVERAGE.md)\n- [Customer problems, workflows and all business types](CUSTOMER_PROBLEMS_AND_WORKFLOWS.md)\n- [Outcome-led marketing](MARKETING_BY_BUSINESS.md)\n- [Complete router export](route-inventory.csv)\n- [Metric definitions](metric-catalog.csv)\n- [Canonical registry evidence](registry-evidence.json)\n- [Remaining verification](VERIFICATION_AND_CLAIMS.md)']
write('FEATURE_CATALOG.md','\n'.join(catalog))

guides=['','## How to perform the documented workflows','', 'The procedures below are generated verbatim in substance from config/vena_guides.php. Terminology can differ by business. The source guides themselves can contain stale advice: the quotation guide uses Pre-Sales, while a dedicated Quotations module remains building. Bank reconciliation import and government e-invoice generation also have incomplete controller actions despite registry/guide references. This snapshot preserves the source instructions for review; it does not certify them. Check VERIFICATION_AND_CLAIMS.md and the actual screen when these disagree. Role, plan, module and device restrictions apply.']
for k,g in D['guides'].items():
    guides+=['',f"### {g['title']}",'',g.get('summary','')]
    if g.get('route'):guides+=['',f"Entry route: `{g['route']}`. Permission: `{g.get('needs','as permitted')}`. Module: `{g.get('module','core / not specified')}`."]
    guides+=['']
    for n,step in enumerate(g.get('steps',[]),1):
        guides.append(f"{n}. "+(step if isinstance(step,str) else step['text']+(f" (`{step['route']}`)" if step.get('route') else '')))
    if g.get('tips'):guides+=['','Notes: '+' '.join(g['tips'])]
write('GENERATED_HOW_TO_GUIDES.md','# Canonical customer how-to guide snapshot\n\nGenerated 16 October 2026. Source of truth: ../../config/vena_guides.php.\n'+'\n'.join(guides))

# Cover every business label and every preset without pretending that labels prove industry support.
presets=D.get('builder_presets') or {}
sector_work={
'retail':('Selling, stock and customer balances get recorded in separate places.','Scan a sale → receive a part payment → return an item → inspect stock, party balance and cash close.','Checkout time; stock-count differences; overdue customer balances.'),
'wholesale':('Pack sizes, negotiated prices, credit and fulfilment are hard to reconcile.','Buy cartons → sell in allowed units at a customer tier → receive part payment → inspect outstanding and dispatch records.','Order-entry time; overdue balances; fulfilment discrepancies.'),
'food':('Orders and changes are lost between the guest, counter and kitchen.','Open table/takeaway/delivery → add a modifier → fire a kitchen ticket → complete payment → inspect the day.','Order errors; unclosed tickets; time to prepare and settle.'),
'services':('Work, people, equipment and billing live in different conversations.','Book a job → schedule and assign → record progress/tool use → complete → create invoice → collect.','Uninvoiced completed jobs; time to invoice; overdue balances; tool returns.'),
'manufacturing':('Materials and finished goods are counted separately from the work that connects them.','Receive materials → define recipe → post production → inspect inputs/output → sell output → inspect cost.','Recorded input usage; production yield differences; cost changes; stock availability.')}
matrix=[]
for k,b in D['business_types']['types'].items():
    preset=presets.get(b.get('preset'),{})
    # A candidate selection, not a reimplementation of the runtime dependency resolver.
    selected=list(dict.fromkeys(preset.get('modules',[])+b.get('modules',[])))
    constraints=[f'{x}: {modules[x]["status"]}' if x in modules else f'{x}: not in module registry' for x in selected if x not in modules or modules[x]['status']!='live']
    pain,demo,measure=sector_work[b['sector']]
    matrix.append({'key':k,'business_type':b['label'],'sector':b['sector'],'preset':b.get('preset'),'customer_problem':pain,'demonstration':demo,'measure':measure,'candidate_modules':', '.join(selected),'non_live_or_unknown':'; '.join(constraints),'specialist_note_unverified':b.get('note',''),'validation':'configuration/source only; business-specific journey pending'})
csvout('business-type-scenario-matrix.csv',matrix,list(matrix[0]))
bm=['# Every business type and its scenario','', 'Generated from config/business_types.php and config/ai_builder.php on 16 October 2026. A business label or descriptive note is positioning metadata, not proof of specialist capability. Candidate modules combine the base preset and type extras before dependency resolution, capability checks, plans, roles and non-live filtering. No specialized clinical, regulated-product, legal-practice, school administration or industrial ERP capability is implied.','']
for sec,meta in D['business_types']['sectors'].items():
    bm+=[f"## {meta['name']}",'',table(['Business','Starting preset','Non-live / unknown candidates','Specialist note to verify'],[(r['business_type'],r['preset'],r['non_live_or_unknown'],r['specialist_note_unverified']) for r in matrix if r['sector']==sec]),'']
bm+=['## Every starting preset','',table(['Preset','Label','Candidate modules','Non-live candidates'],[(k,p.get('label'),', '.join(p.get('modules',[])),', '.join(x for x in p.get('modules',[]) if x not in modules or modules[x]['status']!='live')) for k,p in presets.items()]),'', 'The CSV includes the problem, full scenario and measurement for every type. Run a journey for every unique preset and every type-specific module difference; do not call the whole type family tested because one example passed.']
write('BUSINESS_TYPE_COVERAGE.md','\n'.join(bm))
write('COUNTS.md','# Internal inventory counts\n\nSnapshot: 16 October 2026. Do not use these as customer benefit claims.\n\n'+table(['Unit','Count'],counts))
print(json.dumps({'capability_rows':len(caps),'report_destinations':len(reports),'business_types':len(matrix),'presets':len(presets),'source_evidence_paths_valid':True},indent=2))
