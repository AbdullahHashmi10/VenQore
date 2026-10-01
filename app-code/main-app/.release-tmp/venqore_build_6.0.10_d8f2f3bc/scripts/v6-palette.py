#!/usr/bin/env python3
"""
V6 palette sweep — collapse light/dark pairs onto the semantic tokens.

    python3 scripts/v6-palette.py           # dry run
    python3 scripts/v6-palette.py --apply

── What this does and does not change ──────────────────────────────────────

`tailwind.config.js` already rebinds every pigment family to a V6 ramp, so
`bg-white dark:bg-slate-800` renders V6 colours today. This pass is therefore
NOT a repair of what the classes look like — it is two other things:

  1. **Deleting the twin.** `bg-surface` is mode-aware in the token layer, so
     the `dark:` half is redundant. 8,126 pairs become 8,126 single classes.

  2. **Correcting the dark surfaces.** This one IS a visual fix.
     `dark:bg-slate-800` resolves to ink-800 (#29332D), which in V6 is a
     border-and-raised tone, not a card. The card surface is #141B19. So every
     dark card in the product is currently two steps too light, and only the
     semantic token knows the right answer.

── Why pairs and not every slate class ─────────────────────────────────────

A pair states its own intent: `bg-white dark:bg-slate-800` can only mean "this
is a card". A bare `bg-slate-100` could be a well, a hover state, a disabled
control or a chart gridline, and those are four different tokens. Bare classes
are left alone — they already render V6, and guessing at 18,000 sites is how a
sweep like this turns into a week of visual regressions.

Ordering matters: the specific text patterns run before the general ones, so
`text-slate-900 dark:text-white` is not first eaten by a looser rule.
"""

import argparse, os, re
from collections import Counter

ROOT = 'resources/js'
SKIP_DIRS = {'node_modules', '.git'}

# Each entry: (label, pattern, replacement). `\s+` between the halves because
# the two classes are always adjacent in practice but not always single-spaced.
RULES = [
    # ── Surfaces ────────────────────────────────────────────────────────────
    # The real fix. A card in dark mode moves from ink-800 to the V6 card
    # surface, which is what --vq-bg-surface has always meant.
    ('card surface',
     r'\bbg-white\s+dark:bg-slate-(?:8|9)\d{2}(?:/\d+)?\b',
     'bg-surface'),

    # slate-50 IS the V6 page colour (ink-50 = #F1F5F2), so this is a rename.
    ('page well',
     r'\bbg-slate-50\s+dark:bg-slate-(?:8|9)\d{2}(?:/\d+)?\b',
     'bg-app'),
    ('sunken well',
     r'\bbg-slate-100\s+dark:bg-slate-(?:8|9)\d{2}(?:/\d+)?\b',
     'bg-sunken'),

    # ── Text, loudest first ─────────────────────────────────────────────────
    ('ink',
     r'\btext-slate-(?:8|9)\d{2}\s+dark:text-(?:white|slate-(?:50|100|200))\b',
     'text-ink'),
    ('ink secondary',
     r'\btext-slate-(?:6|7)\d{2}\s+dark:text-slate-(?:3|4)\d{2}\b',
     'text-ink-secondary'),
    ('ink muted',
     r'\btext-slate-(?:4|5)\d{2}\s+dark:text-slate-(?:4|5|6)\d{2}\b',
     'text-ink-muted'),

    # ── Lines ───────────────────────────────────────────────────────────────
    ('line',
     r'\bborder-slate-(?:1|2)\d{2}\s+dark:border-slate-(?:7|8)\d{2}(?:/\d+)?\b',
     'border-line'),
    ('divide',
     r'\bdivide-slate-(?:1|2)\d{2}\s+dark:divide-slate-(?:7|8)\d{2}(?:/\d+)?\b',
     'divide-line'),
]

# The same pairs written dark-first. Rare, but a missed one leaves a stray
# `dark:` class behind that now contradicts its mode-aware partner.
REVERSED = [
    (label, re.sub(r'^\\b(.+?)\\s\+(dark:.+)$', r'\\b\2\\s+\1', pat), rep)
    for label, pat, rep in RULES
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
            src = io_read(path)
            out = src

            for label, pat, rep in RULES:
                out, n = re.subn(pat, rep, out)
                hits[label] += n

            # Tidy the double space a collapse leaves behind, inside className
            # strings only — indentation elsewhere is not ours to touch.
            out = re.sub(r'(className=(["\'`])[^"\'`]*?)  +', r'\1 ', out)

            if out != src:
                touched += 1
                if args.apply:
                    io_write(path, out)

    print(f"{'APPLIED' if args.apply else 'DRY RUN'} — {touched} files\n")
    total = 0
    for label, _, _ in RULES:
        print(f"  {label:<18} {hits[label]:>6}")
        total += hits[label]
    print(f"  {'':<18} {'—' * 6}")
    print(f"  {'pairs collapsed':<18} {total:>6}   ({total * 2} classes -> {total})")


def io_read(p):
    with open(p, encoding='utf-8') as f:
        return f.read()


def io_write(p, s):
    with open(p, 'w', encoding='utf-8') as f:
        f.write(s)


main()
