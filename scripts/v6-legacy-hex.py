#!/usr/bin/env python3
"""
Legacy hex sweep — stock Tailwind values frozen into strings.

    python3 scripts/v6-legacy-hex.py           # dry run
    python3 scripts/v6-legacy-hex.py --apply

`theme:codemod` leaves these alone because it matches a hex against the ACTIVE
theme's ramps, and these are the OLD palette — #6366f1 was indigo-500 when
indigo meant indigo. Under V6 it matches nothing, so the codemod correctly
declines to guess and reports it as "probably a deliberate third-party colour".

Most of them are not. They are the pre-V6 product, written into a style object
or a gradient string where no class could reach them, and they are now the last
places the old indigo-and-slate look survives.

── What each becomes ───────────────────────────────────────────────────────

The same pigment name it always was, as a themed variable:

    '#94a3b8'  ->  'rgb(var(--vq-slate-400))'

That is a 1:1 translation, not a reinterpretation — `--vq-slate-400` is exactly
what `text-slate-400` resolves to. It renders V6's green-cast ink today and
follows any future theme, and no judgement is made about what the colour MEANT.

`rgb(...)` wraps it because the variables hold bare channel triplets — the
format that keeps Tailwind's `/50` opacity modifiers working. A bare
`var(--vq-slate-400)` in a colour position is invalid CSS and renders nothing.

── Where it does NOT touch ─────────────────────────────────────────────────

**SVG presentation attributes.** `fill`, `stroke` and `stopColor` render as
HTML attributes, and `var()` is only legal inside a CSS declaration. Those need
`vq.slate[400]` from `@/theme/runtime` and an import, which is a different
edit — see the note runtime.js opens with.

**Bare constants and props.** A hex in `const COLORS = [...]` may well end up on
an SVG attribute two files away, so the same restriction applies and cannot be
proven from here.

Both are reported rather than changed.
"""

import argparse, os, re
from collections import Counter

LEGACY = {
    '#eef2ff':'indigo-50','#e0e7ff':'indigo-100','#c7d2fe':'indigo-200','#a5b4fc':'indigo-300',
    '#818cf8':'indigo-400','#6366f1':'indigo-500','#4f46e5':'indigo-600','#4338ca':'indigo-700',
    '#3730a3':'indigo-800','#312e81':'indigo-900',
    '#f8fafc':'slate-50','#f1f5f9':'slate-100','#e2e8f0':'slate-200','#cbd5e1':'slate-300',
    '#94a3b8':'slate-400','#64748b':'slate-500','#475569':'slate-600','#334155':'slate-700',
    '#1e293b':'slate-800','#0f172a':'slate-900','#020617':'slate-950',
    '#ecfdf5':'emerald-50','#d1fae5':'emerald-100','#6ee7b7':'emerald-300','#34d399':'emerald-400',
    '#10b981':'emerald-500','#059669':'emerald-600','#047857':'emerald-700',
    '#fffbeb':'amber-50','#fef3c7':'amber-100','#fbbf24':'amber-400','#f59e0b':'amber-500','#d97706':'amber-600',
    '#fef2f2':'red-50','#fee2e2':'red-100','#f87171':'red-400','#ef4444':'red-500','#dc2626':'red-600',
    '#eff6ff':'blue-50','#dbeafe':'blue-100','#60a5fa':'blue-400','#3b82f6':'blue-500','#2563eb':'blue-600',
    '#a78bfa':'violet-400','#8b5cf6':'violet-500','#7c3aed':'violet-600',
    '#f0abfc':'fuchsia-300','#d946ef':'fuchsia-500',
    '#fb7185':'rose-400','#f43f5e':'rose-500','#e11d48':'rose-600',
}

HEX_RE = re.compile(r'#[0-9a-fA-F]{6}\b')
SVG_ATTR = re.compile(r'(fill|stroke|stopColor)\s*=\s*["\'{]', re.I)
STYLEISH = re.compile(r'style=\{|linear-?gradient|radial-?gradient|box-?[Ss]hadow|background|borderColor|boxShadow|color:', re.I)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--apply', action='store_true')
    args = ap.parse_args()

    changed, skipped = Counter(), Counter()
    touched = 0

    for dirpath, dirnames, filenames in os.walk('resources/js'):
        dirnames[:] = [d for d in dirnames if d not in {'node_modules', '.git'}]
        for fn in filenames:
            if not fn.endswith('.jsx'):
                continue
            path = os.path.join(dirpath, fn)
            with open(path, encoding='utf-8') as f:
                lines = f.read().split('\n')

            out, dirty = [], False
            for line in lines:
                hits = [h for h in HEX_RE.findall(line) if h.lower() in LEGACY]
                if not hits:
                    out.append(line)
                    continue

                # An SVG attribute cannot hold a var(); neither can a bare
                # constant that might become one downstream.
                if SVG_ATTR.search(line) or not STYLEISH.search(line):
                    for h in hits:
                        skipped[LEGACY[h.lower()]] += 1
                    out.append(line)
                    continue

                new = line
                for h in hits:
                    new = new.replace(h, f'rgb(var(--vq-{LEGACY[h.lower()]}))')
                    changed[LEGACY[h.lower()]] += 1
                out.append(new)
                dirty = True

            if dirty:
                touched += 1
                if args.apply:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write('\n'.join(out))

    print(f"{'APPLIED' if args.apply else 'DRY RUN'} — {touched} files\n")
    print(f"  converted  {sum(changed.values()):>4}")
    print(f"  left alone {sum(skipped.values()):>4}   (SVG attributes and bare constants — need vq.* + an import)")
    if skipped:
        print("\n  the untouched ones, by family:")
        fams = Counter()
        for k, v in skipped.items():
            fams[k.split('-')[0]] += v
        for k, v in fams.most_common():
            print(f"    {k:<10} {v:>4}")


main()
