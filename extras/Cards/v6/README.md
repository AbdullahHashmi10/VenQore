# VenQore Cards v6 — design loop output

Three rounds, nine fresh-context critic passes. What is here and what it is for.

## Files

| File | What it is |
|---|---|
| `cards-v6.html` | **The foundation.** Six card categories at all 18 declared fits, four body states, light + dark. This is the visual spec the IDE builds against. |
| `cards-catalogue.html` | **All 85 real cards** from the old card file, rebuilt on the system and sorted role → area → module → category. Role filter across the top. |
| `CARD_CATALOGUE.md` | The same inventory as a document. §2 is the build plan: the 50 cards with no Reckoner reading yet, grouped by owning Source. |
| `bklit-bridge.css` | **The whole bklit translation.** bklit reads 41 CSS variables; this maps every one to a v6 token. No forking, no restyling. |
| `design-system.md` | The checkable adherence rules the System critic judged against. Corrected twice by the critics. |
| `bar.md` | The seven craft mechanisms extracted from the v6 dashboard. |
| `progress.html` | The live loop page — verdicts and the full gap history, round by round. |

## Verified state

Measured, not asserted:

- **18 of 18 fits** at exact geometry — 0 ladder mismatches across 39 foundation cards and 292 catalogue cards (all 10 roles)
- **0 contrast failures** — 151 text nodes and 29 data marks, both themes, alpha-composited and gradient-resolved
- **0** Tailwind palette classes, raw hex outside three documented tokens, raw radii, raw z-index, raw durations, `hover:scale`, or weights above 700
- **0** console errors

## Two places the design system itself needed correcting

1. `--vq-series-1` (#0BAA8F) measures **2.93:1** on a white card — under the 3:1 floor for a
   data mark. `--vq-series-1-ink` (teal-600, 4.33:1) is used for marks in light; dark keeps
   series-1 at 7.58:1.
2. Plus Jakarta Sans ships a **0.17em word space** where ~0.25em is normal (0.29 space/a
   against 0.52 for system-ui). At 13–14px words run together. Corrected with
   `word-spacing: 0.08em`.

## Two places the SPEC was wrong, not the build

Both found by critics and corrected in `design-system.md`:

1. There is no per-category "minimum size". `layout-law-v2.json` has a **max** plus an
   ordered list of **fits**, each with a pixel-width floor. The leanest fit *is* the minimum.
2. `VENQORE_CARD_BUILDER_BUILD_SPEC.md` §7.2's four presets
   (`small/medium/large/full`) are **superseded** by Layout Law v2.0's C1–C6.

## Not done

- bklit is not yet installed in the app. `components.json` registers `@react-bits` only —
  the `@bklit` namespace is missing. The bridge is written and its variable coverage is
  verified against the vendored source, but no bklit component has been rendered yet.
- The charts here are hand-built SVG in the v6 idiom, matching what v6 itself does
  ("library-free, draw-in on mount, slot-1 mint"). Swapping in bklit is the next piece.
- Modals, popups and the remaining 13 categories of the old card file are untouched.
