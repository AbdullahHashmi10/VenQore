"""Validate the documentation package, not application business behavior."""
from pathlib import Path
import json,csv,re,fnmatch
OUT=Path(__file__).resolve().parent.parent;APP=OUT.parent.parent
D=json.loads((OUT/'registry-evidence.json').read_text(encoding='utf-8-sig'))
errors=[];checks=0
def check(ok,msg):
    global checks
    checks+=1
    if not ok:errors.append(msg)
def rows(file):return list(csv.DictReader((OUT/file).open(encoding='utf-8')))
for p in OUT.glob('*.md'):
    text=p.read_text(encoding='utf-8')
    for target in re.findall(r'\[[^\]\n]+\]\(([^)]+)\)',text):
        if '://' in target or target.startswith('#'):continue
        check((p.parent/target.split('#')[0]).exists(),f'Broken link in {p.name}: {target}')
caps=rows('capability-catalog.csv'); pages=rows('page-inventory.csv'); pagecaps=rows('page-capabilities.csv')
check(len({r['id'] for r in caps})==len(caps),'Duplicate capability IDs')
check(len({r['capability'] for r in caps})==len(caps),'Duplicate capability titles')
check(len(pages)==len(pagecaps),'Page reference misses source pages')
check({r['page'] for r in pages}=={r['page'] for r in pagecaps},'Page sets differ')
check(len(rows('business-type-scenario-matrix.csv'))==len(D['business_types']['types']),'Business types missing')
for k,b in D['business_types']['types'].items():
    check(b['preset'] in D['builder_presets'],f'{k} has missing preset')
    check(b['sector'] in D['business_types']['sectors'],f'{k} has missing sector')
for k,m in D['modules'].items():
    for p in m.get('pages',[]):check((APP/'resources/js/Pages'/p).exists(),f'{k} page missing: {p}')
    for pattern in m.get('routes',[]):check(any(r['name'] and fnmatch.fnmatchcase(r['name'],pattern) for r in D['routes']),f'{k} route pattern unmatched: {pattern}')
names={r['name'] for r in D['routes']}
for k,g in D['guides'].items():
    refs=[g.get('route')]+[s.get('route') for s in g.get('steps',[]) if isinstance(s,dict)]
    for ref in refs:
        if ref:check(ref in names,f'Guide {k} route missing: {ref}')
check(not D['manifest']['warnings'],'Manifest collector warnings')
check(not any(r.get('source_error') for r in D['routes']),'Route target reflection errors')
for r in rows('report-catalog.csv'):check(r['route'] in names,f'Report target missing: {r["route"]}')
result={'checks':checks,'errors':errors,'capability_rows':len(caps),'page_references':len(pagecaps),'business_types':len(D['business_types']['types']),'presets':len(D['builder_presets']),'qualification':'Documentation integrity only; not an application test pass.'}
(OUT/'validation-result.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result,indent=2));raise SystemExit(bool(errors))
