#!/usr/bin/env python3
"""
Marketing gradients — one gradient, not two brands.

    python3 scripts/v6-marketing-gradient.py           # dry run
    python3 scripts/v6-marketing-gradient.py --apply

DESIGN-RULES v3.0 §14: public pages get teal, ink and ONE gradient. The
marketing surface had been building its own out of `from-indigo via-purple
to-violet` chains — a second brand, assembled per component.

The indigo half is already teal, from the vocabulary sweep. What is left is the
violet/purple half riding along beside it, which reads as a two-colour brand.

── What this changes ───────────────────────────────────────────────────────

Only chains that ALREADY contain a brand stop. A standalone `bg-purple-100`
badge is left alone — purple is bound to V6's plum playmate, which is a real
colour in the system and a legitimate accent. The problem is not plum; it is
plum sharing a gradient with the brand and reading as part of it.

  from-brand-400 via-purple-400 to-brand-300  ->  from-brand-400 to-brand-300
  from-violet-600 to-brand-600                ->  from-brand-500 to-brand-700

The second form keeps the direction of travel — light to dark, or dark to light
— by mapping the non-brand stop onto the brand ramp at a comparable lightness,
rather than flattening both ends to the same stop and producing a flat fill
where a gradient used to be.
"""

import argparse, os, re
from collections import Counter

# Where a violet/purple stop sits on the brand ramp. Same lightness step, so a
# gradient that ran light-to-dark still does.
STOP = {'50':'50','100':'100','200':'200','300':'300','400':'400',
        '500':'500','600':'600','700':'700','800':'800','900':'900','950':'950'}

VIA_IN_BRAND = re.compile(
    r'(\bfrom-brand-\d{2,3}(?:/\[?[\d.]+\]?)?\s+)'
    r'via-(?:violet|purple|fuchsia|pink)-\d{2,3}(?:/\[?[\d.]+\]?)?\s+'
    r'(to-brand-\d{2,3})'
)

NON_BRAND_STOP = re.compile(
    r'\b(from|to|via)-(?:violet|purple|fuchsia)-(\d{2,3})((?:/\[?[\d.]+\]?)?)\b'
    r'(?=[^"\'`]*\b(?:from|to)-brand-)'
)

BRAND_THEN_NON = re.compile(
    r'(\b(?:from|to)-brand-\d{2,3}(?:/\[?[\d.]+\]?)?[^"\'`]{0,80}?)'
    r'\b(from|to|via)-(?:violet|purple|fuchsia)-(\d{2,3})((?:/\[?[\d.]+\]?)?)\b'
)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--apply', action='store_true')
    args = ap.parse_args()

    hits = Counter()
    touched = 0
    root = 'resources/js/Pages/Marketing'

    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in {'node_modules', '.git'}]
        for fn in filenames:
            if not fn.endswith('.jsx'):
                continue
            path = os.path.join(dirpath, fn)
            with open(path, encoding='utf-8') as f:
                src = f.read()
            out = src

            # A `via` between two brand stops is a third colour in a two-colour
            # gradient. Drop it; the ramp interpolates on its own.
            out, n = VIA_IN_BRAND.subn(r'\1\2', out)
            hits['via dropped'] += n

            # A non-brand stop sharing a chain with a brand stop, either order.
            out, n = NON_BRAND_STOP.subn(lambda m: f"{m.group(1)}-brand-{STOP.get(m.group(2), m.group(2))}{m.group(3)}", out)
            hits['stop -> brand'] += n
            out, n = BRAND_THEN_NON.subn(lambda m: f"{m.group(1)}{m.group(2)}-brand-{STOP.get(m.group(3), m.group(3))}{m.group(4)}", out)
            hits['stop -> brand'] += n

            if out != src:
                touched += 1
                if args.apply:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(out)

    print(f"{'APPLIED' if args.apply else 'DRY RUN'} — {touched} files\n")
    for k, v in hits.most_common():
        print(f"  {k:<16} {v:>4}")


main()
