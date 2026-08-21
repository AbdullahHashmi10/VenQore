#!/usr/bin/env python3
"""
Context sweep — recover intent from where a class sits.

    python3 scripts/v6-context.py           # dry run
    python3 scripts/v6-context.py --apply

── The problem this solves ─────────────────────────────────────────────────

`bg-slate-100` records a PIGMENT. It does not record why. Four different V6
tokens are all light grey in light mode — a well, a hover state, the page, a
disabled control — and they diverge hard in dark mode. So a wrong guess is
invisible today and obvious the first time someone flips the theme.

The earlier passes only collapsed light/dark PAIRS, because a pair carries its
own second data point: "white in light, dark grey in dark" can only mean card.

But a class also sits somewhere, and where it sits is a second data point too.
`hover:bg-slate-100` is a hover state. A `bg-slate-50` inside a `<th>` is a
table header. That is what this reads.

── What it will not guess ──────────────────────────────────────────────────

A bare background with no variant prefix and no structural clue on its line. It
could be a well, a page section, a badge or a chart gridline, and nothing local
says which. Those are reported, not rewritten.
"""

import argparse, os, re
from collections import Counter

NEUTRAL = r'(?:slate|zinc|gray|neutral|stone)'

# Order matters: the variant-prefixed rules must run before the bare ones, or a
# `hover:bg-slate-100` gets eaten as a plain background.
RULES = [
    # ── Interaction, from the variant prefix ────────────────────────────────
    ('hover',    rf'\b(hover|group-hover):bg-{NEUTRAL}-\d{{2,3}}(?:/\d+)?\b',  r'\1:bg-interactive-hover'),
    ('active',   rf'\b(focus|focus-within|active):bg-{NEUTRAL}-\d{{2,3}}(?:/\d+)?\b', r'\1:bg-interactive-active'),
    ('hover ln', rf'\b(hover|group-hover|focus|focus-within):border-{NEUTRAL}-\d{{2,3}}(?:/\d+)?\b', r'\1:border-line-strong'),
    ('hover tx', rf'\b(hover|group-hover):text-{NEUTRAL}-(?:[5-9]\d{{2}})\b', r'\1:text-ink'),

    # ── Orphan dark halves ──────────────────────────────────────────────────
    # An element with only a `dark:` background wants a surface IN DARK ONLY.
    # The semantic token is mode-aware, but keeping the `dark:` prefix keeps
    # the rule mode-scoped, so light mode gains nothing it did not have.
    # Depth is preserved: 900 is the page, 800 the card, 700/600 what sits on it.
    ('dark bg',  rf'\bdark:bg-{NEUTRAL}-(?:900|950)(?:/\d+)?\b', 'dark:bg-app'),
    ('dark bg',  rf'\bdark:bg-{NEUTRAL}-800(?:/\d+)?\b',         'dark:bg-surface'),
    ('dark bg',  rf'\bdark:bg-{NEUTRAL}-(?:600|700)(?:/\d+)?\b', 'dark:bg-raised'),
    ('dark tx',  rf'\bdark:text-{NEUTRAL}-(?:50|100|200)\b',     'dark:text-ink'),
    ('dark tx',  rf'\bdark:text-{NEUTRAL}-(?:300|400)\b',        'dark:text-ink-secondary'),
    ('dark tx',  rf'\bdark:text-{NEUTRAL}-(?:500|600)\b',        'dark:text-ink-muted'),
    ('dark ln',  rf'\bdark:(border|divide|ring)-{NEUTRAL}-\d{{2,3}}(?:/\d+)?\b', r'dark:\1-line'),

    # ── Lines. A hairline is a hairline at every stop. ──────────────────────
    ('line',     rf'\b(border|divide|ring)-{NEUTRAL}-(?:50|100|200|300)(?:/\d+)?\b', r'\1-line'),
    ('line',     rf'\b(border|divide|ring)-{NEUTRAL}-(?:400|500)(?:/\d+)?\b',        r'\1-line-strong'),

    # ── Remaining text singletons, by weight ────────────────────────────────
    ('text',     rf'\btext-{NEUTRAL}-(?:800|900|950)\b',  'text-ink'),
    ('text',     rf'\btext-{NEUTRAL}-(?:600|700)\b',      'text-ink-secondary'),
    ('text',     rf'\btext-{NEUTRAL}-(?:400|500)\b',      'text-ink-muted'),
]

# Structural clues, applied line by line where the line says what it is.
STRUCTURAL = [
    ('header',   re.compile(r'<th|thead', re.I),                    rf'\bbg-{NEUTRAL}-(?:50|100|200)(?:/\d+)?\b', 'bg-sunken'),
    ('disabled', re.compile(r'disabled', re.I),                     rf'\bbg-{NEUTRAL}-(?:50|100|200)(?:/\d+)?\b', 'bg-sunken'),
    ('placeholder', re.compile(r'placeholder', re.I),               rf'\btext-{NEUTRAL}-(?:300|400)\b',           'text-ink-faint'),
]

UNKNOWN = re.compile(rf'\bbg-{NEUTRAL}-\d{{2,3}}(?:/\d+)?\b')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--apply', action='store_true')
    args = ap.parse_args()

    hits, touched, unknown = Counter(), 0, Counter()

    for dirpath, dirnames, filenames in os.walk('resources/js'):
        dirnames[:] = [d for d in dirnames if d not in {'node_modules', '.git'}]
        for fn in filenames:
            if not fn.endswith('.jsx'):
                continue
            path = os.path.join(dirpath, fn)
            with open(path, encoding='utf-8') as f:
                src = f.read()

            out_lines = []
            for line in src.split('\n'):
                new = line
                for label, clue, pat, rep in STRUCTURAL:
                    if clue.search(new):
                        new, n = re.subn(pat, rep, new)
                        hits[label] += n
                for label, pat, rep in RULES:
                    new, n = re.subn(pat, rep, new)
                    hits[label] += n
                for m in UNKNOWN.finditer(new):
                    unknown[m.group(0)] += 1
                out_lines.append(new)

            out = '\n'.join(out_lines)
            out = re.sub(r'(className=(["\'`])[^"\'`]*?)  +', r'\1 ', out)

            if out != src:
                touched += 1
                if args.apply:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(out)

    print(f"{'APPLIED' if args.apply else 'DRY RUN'} — {touched} files\n")
    for k, v in hits.most_common():
        print(f"  {k:<10} {v:>5}")
    print(f"  {'—'*10}\n  {'total':<10} {sum(hits.values()):>5}")

    if unknown:
        print(f"\n  Not guessed — a bare background with no variant and no structural\n"
              f"  clue on its line. {sum(unknown.values())} of them, most common:")
        for k, v in unknown.most_common(8):
            print(f"    {k:<24} {v:>4}")


main()
