import re,urllib.request,html,collections,sys
B='http://127.0.0.1:8010'
def get(u):
    try:
        r=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 crawler'}),timeout=60)
        return r.status,r.read().decode('utf-8','replace')
    except urllib.error.HTTPError as e: return e.code,e.read().decode('utf-8','replace')
_,sm=get(B+'/sitemap.xml')
locs=re.findall(r'<loc>(.*?)</loc>',sm)
# nested sitemaps
urls=[]
for l in locs:
    p=re.sub(r'^https?://[^/]+','',html.unescape(l))
    if p.endswith('.xml'):
        _,s2=get(B+p); urls+= [re.sub(r'^https?://[^/]+','',html.unescape(x)) for x in re.findall(r'<loc>(.*?)</loc>',s2)]
    else: urls.append(p)
urls=sorted(set(urls or ['/']))
print('urls',len(urls))
titles=collections.defaultdict(list);descs=collections.defaultdict(list);probs=[]
for p in urls:
    st,b=get(B+(p or '/'))
    t=re.search(r'<title[^>]*>(.*?)</title>',b,re.S); t=html.unescape(t.group(1).strip()) if t else ''
    d=re.search(r'<meta name="description" content="([^"]*)"',b); d=html.unescape(d.group(1)) if d else ''
    c=re.search(r'<link rel="canonical" href="([^"]*)"',b)
    ns=re.search(r'<noscript>(.*?)</noscript>',b,re.S)
    h1=bool(ns and '<h1' in ns.group(1))
    issues=[]
    if st!=200: issues.append(f'status {st}')
    if not t: issues.append('no title')
    elif len(t)>70: issues.append(f'title {len(t)}ch')
    if not d: issues.append('no description')
    elif len(d)<50 or len(d)>170: issues.append(f'desc {len(d)}ch')
    if not c: issues.append('no canonical')
    if not h1: issues.append('no h1 in static html')
    titles[t].append(p); descs[d].append(p)
    if issues: probs.append((p,issues))
for p,i in probs: print('ISSUE',p,'|',', '.join(i))
for t,ps in titles.items():
    if len(ps)>1: print('DUP TITLE',repr(t[:60]),len(ps),ps[:4])
for d,ps in descs.items():
    if len(ps)>1 and d: print('DUP DESC',repr(d[:60]),len(ps),ps[:4])
print('pages with issues',len(probs),'of',len(urls))
