"""Python port of tests/Scripts/update_suites.php (for machines without PHP).
Run from app-code/main-app:  python3 tests/Scripts/update_suites.py
Also drops members whose file no longer exists."""
import os, re, yaml
REG = 'tests/VerificationCenter/registry/suites.yaml'
data = yaml.safe_load(open(REG, encoding='utf-8'))

def count_methods(p):
    s = open(p, encoding='utf-8', errors='replace').read()
    n  = len(re.findall(r'function\s+test[A-Za-z0-9_]*\s*\(', s))
    n += len(re.findall(r'/\*\*[^*]*@test\b', s))
    n += len(re.findall(r'#\[Test\]', s))
    n += len(re.findall(r'^\s*(?:it|test)\(', s, re.M))
    return n

live = []
for root, _, files in os.walk('tests/tests'):
    for f in files:
        if f.endswith('Test.php'):
            p = os.path.join(root, f).replace('\\', '/')
            if '/_archive/' not in p:
                live.append(p)

for suite in data['suites']:
    seen = {}
    for m in suite.get('members') or []:
        fp = m.get('file')
        if fp and fp not in seen and os.path.isfile('tests/' + fp):
            seen[fp] = m
    suite['members'] = list(seen.values())

for full in live:
    rel = full[len('tests/'):]
    meth = count_methods(full)
    best, blen = None, -1
    for suite in data['suites']:
        sp = suite.get('path') or ''
        if sp and rel.startswith(sp) and len(sp) > blen:
            best, blen = suite, len(sp)
    if best is None:
        print('NO SUITE FOR', rel); continue
    for m in best['members']:
        if m.get('file') == rel:
            m['test_methods'] = meth; break
    else:
        best['members'].append({'file': rel, 'test_methods': meth, 'oracle_tier': 'T1'})

for suite in data['suites']:
    suite['members'].sort(key=lambda m: m.get('file', ''))
    suite['files'] = len(suite['members'])
    suite['test_methods'] = sum(int(m.get('test_methods', 0)) for m in suite['members'])

total = sum(count_methods(f) for f in live)
data['meta']['phpunit_test_methods_total'] = total
with open(REG, 'w', encoding='utf-8', newline='\n') as fh:
    yaml.safe_dump(data, fh, sort_keys=False, default_flow_style=False, allow_unicode=True, width=1000)
print('updated suites.yaml, total', total, 'live files', len(live))
