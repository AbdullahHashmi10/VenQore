#!/usr/bin/env python3
"""
V6 vocabulary sweep — pigment names to role names.

    python3 scripts/v6-vocabulary.py           # dry run
    python3 scripts/v6-vocabulary.py --apply

Runs after v6-palette.py, which handles light/dark pairs. This one handles the
singletons, and only the ones where the right answer is unambiguous.

── indigo -> brand ─────────────────────────────────────────────────────────

Byte-identical today: `--vq-indigo-600` and `--vq-brand-600` both resolve to
`8 137 117`, because the theme binds the `indigo` family and the `brand` role
to the same teal ramp. So the base render does not move.

It is NOT a no-op in one case, and that case is the reason to do it. When a
tenant sets a custom primary colour, `theme/appearance.js` writes
`--vq-ramp-brand-*` as inline properties on <html>. Role-named classes follow
that; `bg-indigo-600` points at `--vq-ramp-teal-*` and does not. So today a
tenant who picks their own brand colour gets it on perhaps a tenth of the
product. After this, they get it everywhere — which is what the feature was
always supposed to mean.

── Coloured shadows -> neutral ─────────────────────────────────────────────

DESIGN-RULES v3.0 §8: shadows are always neutral and never coloured. A
teal-tinted shadow looks like a mistake at 100% zoom and a bug at 200%. The one
deliberate exception in the whole system is `--vq-glow-accent`, on primary
buttons and the accent KPI card, and that is a token rather than a utility.

── Text and border singletons ──────────────────────────────────────────────

Mapped by stop weight, because text on a light surface is unambiguous in a way
a background is not: `text-slate-500` can only be quiet text, whereas
`bg-slate-100` might be a well, a hover state, a disabled control or a chart
gridline — four different tokens. Backgrounds are left alone.

Stops 50-300 are also left alone: a bare `text-slate-200` is almost always
something already sitting on a dark surface, and mapping it to an ink token
would invert it.
"""

import argparse, os, re
from collections import Counter

ROOT = 'resources/js'
SKIP_DIRS = {'node_modules', '.git'}

RULES = [
    # ── Coloured shadows. Run FIRST: `shadow-indigo-500/20` must not be
    #    renamed to `shadow-brand-500/20` before this can remove it. ─────────
    ('coloured shadow',
     r'\bshadow-(?:indigo|violet|purple|teal|emerald|blue|sky|rose|red|amber)-\d{2,3}(?:/\d+)?\b',
     ''),

    # ── indigo -> brand, every utility prefix ────────────────────────────────
    ('indigo -> brand',
     r'\b(bg|text|border|ring|divide|from|to|via|outline|decoration|caret|accent|fill|stroke)-indigo-(\d{2,3})(/\d+)?\b',
     r'\1-brand-\2\3'),
    ('dark:indigo -> brand',
     r'\bdark:(bg|text|border|ring|divide|from|to|via)-indigo-(\d{2,3})(/\d+)?\b',
     r'dark:\1-brand-\2\3'),

    # ── Text singletons, by weight ──────────────────────────────────────────
    ('text -> ink',
     r'\btext-slate-(?:800|900|950)\b', 'text-ink'),
    ('text -> ink-secondary',
     r'\btext-slate-(?:600|700)\b', 'text-ink-secondary'),
    ('text -> ink-muted',
     r'\btext-slate-(?:400|500)\b', 'text-ink-muted'),

    # ── Border singletons, light stops only ─────────────────────────────────
    ('border -> line',
     r'\bborder-slate-(?:100|200|300)(?:/\d+)?\b', 'border-line'),
    ('divide -> line',
     r'\bdivide-slate-(?:100|200|300)(?:/\d+)?\b', 'divide-line'),
]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--apply', action='store_true')
    args = ap.parse_args()

    hits = Counter()
    touched = 0

    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fn in filenames:
            if not fn.endswith('.jsx'):
                continue
            path = os.path.join(dirpath, fn)
            with open(path, encoding='utf-8') as f:
                src = f.read()
            out = src

            for label, pat, rep in RULES:
                out, n = re.subn(pat, rep, out)
                hits[label] += n

            out = re.sub(r'(className=(["\'`])[^"\'`]*?)  +', r'\1 ', out)
            out = re.sub(r'(className=(["\'`])) +', r'\1', out)

            if out != src:
                touched += 1
                if args.apply:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(out)

    print(f"{'APPLIED' if args.apply else 'DRY RUN'} — {touched} files\n")
    for label, _, _ in RULES:
        print(f"  {label:<22} {hits[label]:>6}")
    print(f"  {'':<22} {'—' * 6}")
    print(f"  {'total':<22} {sum(hits.values()):>6}")


main()
