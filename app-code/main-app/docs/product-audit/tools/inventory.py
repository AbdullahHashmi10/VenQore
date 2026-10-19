"""Rebuild source evidence without reading credentials or changing business data."""
from pathlib import Path
import csv, hashlib, json, re
from collections import Counter

OUT = Path(__file__).resolve().parent.parent
APP = OUT.parent.parent
ROOT = APP.parent.parent
DATA = json.loads((OUT/'registry-evidence.json').read_text(encoding='utf-8-sig'))
SKIP = {'.git', 'node_modules', 'vendor', '.dart_tool', '.gradle', '.idea', '.claude', '.release-tmp', 'build', 'dist', 'Pods', '.next', '.venv', '__pycache__'}
TEXT = {'.php','.js','.jsx','.ts','.tsx','.dart','.md','.json','.html','.css','.yml','.yaml','.xml','.ps1','.py','.cjs','.mjs','.sql','.txt'}
records=[]; pages=[]; docs=[]; skipped=Counter(); errors=[]
import os
for base, dirs, files in os.walk(ROOT):
    rel=Path(base).relative_to(ROOT)
    if 'product-audit' in rel.parts:
        dirs[:]=[]
        continue
    dirs[:] = sorted(d for d in dirs if d not in SKIP)
    # Backups, private data, installed libraries and unrelated projects are catalogued by scope, not mined for claims.
    for name in sorted(files):
        p=Path(base)/name; r=p.relative_to(ROOT).as_posix(); parts=p.relative_to(ROOT).parts
        canonical = r.startswith(('app-code/main-app/app/','app-code/main-app/routes/','app-code/main-app/config/','app-code/main-app/resources/','app-code/main-app/database/','app-code/main-app/tests/','app-code/main-app/docs/','app-code/main-app/public/sw.js','app-code/main-app/public/offline.html','app-code/mobile-app/lib/','app-code/mobile-app/test/','app-code/windows-app/lib/','app-code/windows-app/tests/'))
        topdoc = p.suffix.lower()=='.md' and (len(parts)==1 or parts[0] in {'extras','Pricing','claude','Claude outputs'} or r in {'app-code/mobile-app/README.md','app-code/windows-app/README.md','app-code/windows-app/STATION_4.0.0_CHANGES.md'})
        station = r.startswith('app-code/windows-app/') and len(parts)==3 and p.suffix.lower() in TEXT
        excluded = any(x in parts for x in {'_archive','_extra-legacy','_superseded','production-clean-repo','_old_v2','_private','storage','security-audit-2026-09-10'}) or any(x.startswith('AMD_POS_Update') for x in parts) or 'product-audit' in parts
        if excluded: scope='historical/duplicate/private/generated; excluded from current claims'
        elif canonical or topdoc or station: scope='source-inspected' if p.suffix.lower() in TEXT else 'asset; metadata only'
        else: scope='supporting/unrelated/binary; metadata only'
        row={'path':r,'scope':scope}
        try: row['bytes']=p.stat().st_size
        except OSError as e: errors.append({'path':r,'error':str(e)}); continue
        if scope=='source-inspected':
            try:
                raw=p.read_bytes(); s=raw.decode('utf-8-sig',errors='replace')
                row.update(sha256=hashlib.sha256(raw).hexdigest(),lines=len(s.splitlines()))
                functions=re.findall(r'(?:public\s+(?:static\s+)?function|function)\s+(\w+)\s*\(',s)
                routes=list(dict.fromkeys(re.findall(r'''(?:route|storeRoute)\(\s*['"]([^'"]+)''',s)))
                renders=list(dict.fromkeys(re.findall(r'''Inertia::render\(\s*['"]([^'"]+)''',s)))
                headings=list(dict.fromkeys(re.sub(r'\s+',' ',x).strip() for x in re.findall(r'<h[1-4][^>]*>([^<{}]+)</h[1-4]>',s)))
                flags=Counter(re.findall(r'\b(TODO|FIXME|HACK|stub|placeholder|not implemented)\b',s,re.I))
                row.update(functions=functions,route_refs=routes,renders=renders,headings=headings,review_flags=dict(flags))
                if '/resources/js/Pages/' in r and p.suffix in {'.jsx','.tsx','.js'}:
                    page=r.split('/resources/js/Pages/')[1]
                    row['page']=page; pages.append(row)
                if p.suffix.lower()=='.md':
                    hs=re.findall(r'^#{1,4}\s+(.+)',s,re.M)
                    docs.append({'path':r,'headings':hs,'flags':dict(flags),'sha256':row['sha256']})
            except OSError as e: errors.append({'path':r,'error':str(e)}); row['scope']='read failed'
        records.append(row)

def writecsv(name, rows, fields):
    with (OUT/name).open('w',newline='',encoding='utf-8') as f:
        w=csv.DictWriter(f,fields,extrasaction='ignore');w.writeheader()
        for row in rows: w.writerow({k:json.dumps(v,ensure_ascii=False) if isinstance(v,(list,dict)) else v for k,v in row.items()})
writecsv('file-coverage.csv',records,['path','scope','bytes','lines','sha256','functions','route_refs','renders','headings','review_flags'])
writecsv('document-index.csv',docs,['path','headings','flags','sha256'])
routes=DATA['routes']
writecsv('route-inventory.csv',routes,['name','uri','methods','action','middleware','source','source_error'])

# Connect each Inertia page to literal render references across all inspected sources.
render_index={}
for r in records:
    for page in r.get('renders',[]):render_index.setdefault(page,[]).append(r['path'])
for p in pages:
    key=re.sub(r'\.(jsx|tsx|js)$','',p['page'])
    p['render_sources']=render_index.get(key,[])
    p['validation']='source only; browser walkthrough pending'
writecsv('page-inventory.csv',pages,['page','path','render_sources','route_refs','headings','review_flags','validation'])

def cell(v):return str(v or '').replace('|',' / ').replace('\n',' ')
def table(headers,rows):return '\n'.join(['| '+' | '.join(headers)+' |','| '+' | '.join(['---']*len(headers))+' |']+['| '+' | '.join(cell(x) for x in row)+' |' for row in rows])
stats={'files_catalogued':len(records),'source_files_read':sum(r['scope']=='source-inspected' for r in records),'source_lines':sum(r.get('lines',0) for r in records),'pages':len(pages),'documents_indexed':len(docs),'route_entries':len(routes),'module_status':dict(Counter(m['status'] for m in DATA['modules'].values())),'manifest':DATA['manifest']['counts'],'read_errors':errors,'page_without_literal_render':sum(not p['render_sources'] for p in pages)}
(OUT/'coverage-summary.json').write_text(json.dumps(stats,indent=2),encoding='utf-8')
inventory=['# Page and source coverage','', 'Snapshot: 16 October 2026. This is a source inventory, not a record of browser passes. Every page below still needs the authenticated walkthrough. A page file may be a component, redirect target, retired implementation or dynamically rendered page; file count is not feature count.','',table(['Measure','Count'],stats.items().__iter__() if False else [(k,v) for k,v in stats.items() if isinstance(v,int)]),'','## Every React page file','',table(['Page / component','Literal render source(s)','Referenced routes','Validation'],[(p['page'],'; '.join(p['render_sources']),'; '.join(p['route_refs']),'Source only') for p in pages]),'','## Exclusions','', 'Installed dependencies and generated build directories named in tools/inventory.py are pruned before traversal. Credentials (.env), personal backups, databases, logs, uploaded customer records and private directories are not inspected for product claims. Historical copies and unrelated projects are listed by path and scope when traversed, but are not treated as current functionality. File metadata coverage is not a claim that every file was semantically read.','', 'See file-coverage.csv for file-level scope and hashes; document-index.csv for document headings; route-inventory.csv for the complete bootstrapped route table.']
(OUT/'PAGE_AND_SOURCE_COVERAGE.md').write_text('\n'.join(inventory)+'\n',encoding='utf-8')
print(json.dumps(stats,indent=2))
