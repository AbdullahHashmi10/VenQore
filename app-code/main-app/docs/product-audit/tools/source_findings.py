"""Extract explicit implementation warnings and a function inventory for follow-up."""
from pathlib import Path
import csv,re,json
OUT=Path(__file__).resolve().parent.parent; APP=OUT.parent.parent
findings=[]; functions=[]
patterns=[('implementation marker',re.compile(r'\b(?:TODO|FIXME|HACK|to implement|not implemented)\b',re.I)),('explicit not-implemented HTTP response',re.compile(r'abort\s*\(\s*501|HTTP_NOT_IMPLEMENTED')),('not-implemented exception',re.compile(r'throw new .*?(?:NotImplemented|BadMethodCallException)'))]
for base in ['app','routes','config','resources/js','../mobile-app/lib','../windows-app/lib']:
    root=APP/base
    if not root.exists():continue
    for p in sorted(root.rglob('*')):
        if not p.is_file() or p.suffix not in {'.php','.jsx','.js','.ts','.tsx','.dart','.cjs','.mjs'}:continue
        if any(x in p.parts for x in {'node_modules','vendor','_superseded','tests','test'}):continue
        s=p.read_text(encoding='utf-8-sig',errors='replace'); rel=p.relative_to(APP.parent.parent).as_posix()
        for n,line in enumerate(s.splitlines(),1):
            for category,pattern in patterns:
                if pattern.search(line):findings.append({'path':rel,'line':n,'category':category,'excerpt':line.strip()[:260],'treatment':'Review marker; not automatically a defect or unavailable feature.'})
            for m in re.finditer(r'\b(public\s+(?:static\s+)?function|(?:export\s+)?(?:async\s+)?function)\s+(\w+)\s*\(',line):functions.append({'path':rel,'line':n,'name':m[2]})
for name,rows,fields in [('implementation-markers.csv',findings,['path','line','category','excerpt','treatment']),('source-function-index.csv',functions,['path','line','name'])]:
    with (OUT/name).open('w',newline='',encoding='utf-8') as f:
        w=csv.DictWriter(f,fields);w.writeheader();w.writerows(rows)
doc=['# Explicit source markers requiring review','', 'Automated extraction from current application implementation areas on 16 October 2026. A TODO or placeholder word can be a comment, a deliberately unsupported option or a false positive. The list is a queue for review, not a defect count. No secrets, configuration values from the environment or customer records are included.','', 'A confirmed availability conflict is MarketingCampaignController: its index returns empty campaign data and its create/store methods contain `to implement` placeholders. Earlier broad feature documents must not be reused as evidence that campaign automation works.','', '| Source | Line | Marker | Excerpt |','| --- | --- | --- | --- |']
doc += ['| '+r['path']+' | '+str(r['line'])+' | '+r['category']+' | `'+r['excerpt'].replace('|',' / ').replace('`',"'")+'` |' for r in findings]
(OUT/'IMPLEMENTATION_MARKERS.md').write_text('\n'.join(doc)+'\n',encoding='utf-8')
print(json.dumps({'explicit_review_markers':len(findings),'function_index_entries':len(functions)}))
