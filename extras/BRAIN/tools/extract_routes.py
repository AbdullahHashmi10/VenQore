#!/usr/bin/env python3
"""
Static route-name extractor for routes/web.php.

WHY THIS EXISTS
---------------
`grep "->name("` is NOT enough and will mislead you three separate ways:

  1. Route groups add name prefixes, and the groups NEST. routes/web.php has
     more than one `->name('store.')` group, opened on different lines, some
     declared across four lines of method chaining.
  2. `Route::resource()` registers seven names WITHOUT any ->name() call,
     honouring ->only([]) / ->except([]).
  3. A route name declared inside a group is NOT the name you gate on.

Getting any of these wrong means writing a route gate against patterns that
match nothing, which means a "disabled" module stays reachable by URL.

This is a static approximation of `php artisan route:list`. Regenerate the real
list before launch and diff the two:

    php artisan route:list --json > route_list_current.json

Usage: python3 extract_routes.py <path/to/web.php> [--csv]
Output: name <TAB> line <TAB> uri <TAB> middleware-hints
"""
import re
import sys

RESOURCE_ACTIONS = ['index', 'create', 'store', 'show', 'edit', 'update', 'destroy']

path = sys.argv[1]
raw = open(path, encoding='utf-8', errors='replace').read()
lines = raw.split('\n')

# ---------------------------------------------------------------------------
# Pass 1: build the group stack by walking brace depth line by line.
# A group's name prefix is whatever ->name('x.') or 'as' => 'x.' appears in the
# chain that opened it. Chains may span several lines, so we look back a few.
# ---------------------------------------------------------------------------
stack = []            # list of (depth_at_open, prefix)
depth = 0
prefix_at_line = []   # prefix in effect for each line

group_open = re.compile(r"->group\(function\s*\([^)]*\)\s*\{|,\s*function\s*\([^)]*\)\s*\{")
name_frag = re.compile(r"(?:->|::)name\('([a-zA-Z0-9_.\-]+\.)'\)|'as'\s*=>\s*'([a-zA-Z0-9_.\-]+\.)'")

for i, line in enumerate(lines):
    prefix_at_line.append(''.join(p for _, p in stack))

    opens = line.count('{')
    closes = line.count('}')

    if group_open.search(line):
        # look back up to 6 lines for the prefix declared in this chain
        chunk = '\n'.join(lines[max(0, i - 6):i + 1])
        # only take fragments after the last 'Route::' that starts this chain
        start = chunk.rfind('Route::')
        chunk = chunk[start:] if start != -1 else chunk
        found = name_frag.findall(chunk)
        pfx = ''.join((a or b) for a, b in found)
        stack.append((depth, pfx))

    depth += opens - closes

    while stack and depth <= stack[-1][0]:
        stack.pop()

# ---------------------------------------------------------------------------
# Pass 2: collect route names
# ---------------------------------------------------------------------------
uri_re = re.compile(r"Route::(get|post|put|patch|delete|any|match)\s*\(\s*'([^']*)'")
name_re = re.compile(r"->name\('([a-zA-Z0-9_.\-]+)'\)")
res_re = re.compile(r"Route::(?:api)?[Rr]esource\(\s*'([a-zA-Z0-9_\-/{}\.]+)'")
mw_re = re.compile(r"(plan\.feature:[a-z_0-9]+|permission:[a-z_.]+|plan\.limit:[a-z_]+)")

routes = {}   # name -> (line, uri, middleware)

for i, line in enumerate(lines):
    pre = prefix_at_line[i]

    for m in name_re.finditer(line):
        n = m.group(1)
        if n.endswith('.'):
            continue
        u = uri_re.search(line)
        routes.setdefault(pre + n, (i + 1, u.group(2) if u else '', ','.join(mw_re.findall(line))))

    m = res_re.search(line)
    if m:
        base = m.group(1).replace('/', '.')
        chunk = line
        for j in range(i + 1, min(i + 8, len(lines))):
            if ';' in chunk:
                break
            chunk += lines[j]
        only = re.search(r"->only\(\[([^\]]*)\]", chunk)
        exc = re.search(r"->except\(\[([^\]]*)\]", chunk)
        actions = list(RESOURCE_ACTIONS)
        if only:
            actions = [a.strip().strip("'\"") for a in only.group(1).split(',') if a.strip()]
        if exc:
            drop = [a.strip().strip("'\"") for a in exc.group(1).split(',') if a.strip()]
            actions = [a for a in actions if a not in drop]
        mws = ','.join(mw_re.findall(chunk))
        for a in actions:
            routes.setdefault(f"{pre}{base}.{a}", (i + 1, base, mws))

if '--csv' in sys.argv:
    print('name,line,uri,middleware')
    for n in sorted(routes):
        l, u, mw = routes[n]
        print(f'"{n}",{l},"{u}","{mw}"')
else:
    for n in sorted(routes):
        l, u, mw = routes[n]
        print(f"{n}\t{l}\t{u}\t{mw}")
