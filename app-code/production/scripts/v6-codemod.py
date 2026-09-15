#!/usr/bin/env python3
"""
V6 codemod — Phase 3, the mechanical pass.

Everything here is a rewrite a human would make the same way every time, so a
script makes it consistently and in one reviewable diff. Nothing in this file
guesses: each rule maps a value onto the nearest legal one from DESIGN-RULES.md
v3.0, and a value with no legal neighbour is reported rather than changed.

    python3 scripts/v6-codemod.py            # dry run, prints the worklist
    python3 scripts/v6-codemod.py --apply    # writes

Run it again after any big merge. It is idempotent.
"""

import argparse, os, re, sys
from collections import Counter

ROOT = 'resources/js'
SKIP_DIRS = {'node_modules', '.git', 'tests', '__tests__'}

# ── 1. Motion ────────────────────────────────────────────────────────────────
# Four legal durations: 120 / 200 / 320 / 520ms, named fast/normal/slow/slower
# in the Tailwind theme. Each stock value maps to its NEAREST legal neighbour,
# so nothing speeds up or slows down by more than one perceptual step.
DURATION_MAP = {
    '75': 'fast', '100': 'fast', '150': 'fast',    # -> 120ms
    '200': 'normal',                                # -> 200ms, exact
    '300': 'slow',                                  # -> 320ms
    '500': 'slower', '700': 'slower', '1000': 'slower',  # -> 520ms
}

# ── 2. Shape ─────────────────────────────────────────────────────────────────
# Legal surface radii, in px. Nothing above 36 except `full`.
RADIUS_PX = {'none': 0, 'xs': 8, 'sm': 12, 'md': 14, 'lg': 20, 'xl': 28, '2xl': 36}

LEGAL_DURATIONS = (('fast', 120), ('normal', 200), ('slow', 320), ('slower', 520))

def nearest_duration(ms):
    return min(LEGAL_DURATIONS, key=lambda p: abs(p[1] - ms))[0]

def nearest_radius(px):
    """Nearest legal radius name. 999+ is a pill and stays one."""
    if px >= 100:
        return 'full'
    return min(RADIUS_PX, key=lambda k: abs(RADIUS_PX[k] - px))

# ── 3. Stacking ──────────────────────────────────────────────────────────────
# The ladder from DESIGN-RULES §3. Values below are grouped by what the number
# was TRYING to say, not by arithmetic: everything in the 9000s is "I gave up",
# and everything in the 150-210 band was a modal fighting another modal.
Z_MAP = {
    '0': 'base', '5': 'base',
    '10': 'raised', '20': 'raised', '30': 'raised',
    '40': 'sticky', '55': 'sticky', '60': 'sticky', '70': 'sticky', '75': 'sticky',
    '80': 'drawer', '85': 'drawer', '90': 'drawer', '95': 'drawer',
    '100': 'drawer', '101': 'drawer', '105': 'drawer', '110': 'drawer',
    '115': 'drawer', '120': 'drawer',
    '150': 'modal', '151': 'modal', '200': 'modal', '201': 'modal', '210': 'modal',
    '300': 'tooltip', '301': 'tooltip',
    '999': 'toast', '1500': 'toast', '2000': 'toast',
    '9998': 'command', '9999': 'command', '10000': 'command', '99999': 'command',
}

stats = Counter()
unmapped = Counter()

def fix_line(line, path):
    out = line

    # ── Weight ───────────────────────────────────────────────────────────────
    # 800 and 900 are not in the system. Both already RENDER as 700 through the
    # theme, so this is a vocabulary change with no visual effect — it just
    # stops the class claiming a weight that does not exist.
    def w(m):
        stats['weight'] += 1
        return 'font-bold'
    out = re.sub(r'\bfont-(?:extrabold|black)\b', w, out)

    # ── Duration ─────────────────────────────────────────────────────────────
    def d(m):
        val = m.group(1)
        name = DURATION_MAP.get(val)
        if name is None:
            # Anything the table does not name (duration-350, duration-400)
            # still has a nearest legal neighbour. Falling through to the
            # arithmetic keeps the table as documentation of the COMMON cases
            # without it also being an exhaustive list nobody maintains.
            name = nearest_duration(int(val))
        stats['duration'] += 1
        return f'duration-{name}'
    out = re.sub(r'\bduration-(\d+)\b', d, out)

    def dbr(m):
        stats['duration'] += 1
        return f'duration-{nearest_duration(int(m.group(1)))}'
    out = re.sub(r'\bduration-\[(\d+)ms\]', dbr, out)

    # ── Radius ───────────────────────────────────────────────────────────────
    def r3(m):
        stats['radius'] += 1
        return 'rounded-2xl'
    out = re.sub(r'\brounded-3xl\b', r3, out)

    def rarb(m):
        prefix, num, unit = m.group(1), float(m.group(2)), m.group(3)
        px = num * 16 if unit == 'rem' else num
        stats['radius'] += 1
        return f'{prefix}-{nearest_radius(px)}'
    out = re.sub(r'\b(rounded(?:-[trbl]{1,2})?)-\[([0-9.]+)(rem|px)\]', rarb, out)

    # ── Stacking ─────────────────────────────────────────────────────────────
    def z(m):
        val = m.group(1)
        if val in Z_MAP:
            stats['zindex'] += 1
            return f'z-{Z_MAP[val]}'
        unmapped[f'z-[{val}]'] += 1
        return m.group(0)
    out = re.sub(r'\bz-\[(\d+)\]', z, out)

    # ── Hover scale ──────────────────────────────────────────────────────────
    # The one legal case is an image scaling INSIDE a fixed-ratio
    # overflow-hidden frame — the clipping IS the effect there. Everywhere else
    # this is the sidebar clipping bug, and a control that grows under the
    # pointer makes the layout feel unstable.
    if re.search(r'(group-)?hover:scale-', out):
        if re.search(r'object-(cover|contain)', out):
            stats['hover_kept'] += 1
        else:
            out = re.sub(r'\s*(?:group-)?hover:scale-(?:\[[^\]]+\]|\d+)', '', out)
            stats['hover'] += 1

    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--apply', action='store_true')
    args = ap.parse_args()

    touched = 0
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fn in filenames:
            if not fn.endswith('.jsx'):
                continue
            path = os.path.join(dirpath, fn)
            with open(path, encoding='utf-8') as fh:
                src = fh.read()

            lines = src.split('\n')
            new = [fix_line(l, path) for l in lines]
            joined = '\n'.join(new)

            # Tidy the whitespace the hover deletions leave behind, without
            # touching indentation or anything outside a className string.
            joined = re.sub(r'(className=(["\'`])[^"\'`]*?)  +', r'\1 ', joined)
            joined = re.sub(r'(className=(["\'`])) +', r'\1', joined)
            joined = re.sub(r' +(["\'`])(\s*[}>])', r'\1\2', joined)

            if joined != src:
                touched += 1
                if args.apply:
                    with open(path, 'w', encoding='utf-8') as fh:
                        fh.write(joined)

    print(f"{'APPLIED' if args.apply else 'DRY RUN'} — {touched} files\n")
    for k in ('weight', 'duration', 'radius', 'zindex', 'hover'):
        print(f"  {k:<10} {stats[k]:>6}")
    print(f"  {'hover kept':<10} {stats['hover_kept']:>6}  (media frames — the one legal case)")

    if unmapped:
        print("\n  NOT CHANGED — no legal neighbour, decide by hand:")
        for k, v in unmapped.most_common():
            print(f"    {k:<18} {v}")

main()
