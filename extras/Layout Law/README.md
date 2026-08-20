# VenQore Layout Law v2.1 — delivery

`v1.0` answered one question: how does a **card** survive every screen?
`v2.0` answered the whole of it: how does a **screen** survive every screen?
`v2.1` answers the one you asked next: **how does the person using it decide?**

Three surfaces stopped being layouts we chose and became **compositions they
compose** — the dashboard, the register and the document editor. The law's job is
no longer to pick an arrangement. It is to stop theirs from breaking.

## Open these first

| File | What it is |
|---|---|
| **`venqore-shell.html`** | The sidebar question, answered live — and now **edit mode for real**: corner drag-to-resize that stops at the law, a dotted-outline placeholder at the snapped destination, a **Flow / Free** placement switch so the right side stays empty if you leave it empty, and a Windows-style **splitter** on the nav with magnetic stops. |
| **`venqore-pos.html`** | The register you compose. Seven starting points, then every knob: where the catalog goes and how much room it gets, how the cart and the tender split, whether the tender is a column, a bar or a button. **Drag the dividers in the screen itself.** |
| **`venqore-document.html`** | One editor, thirteen types — composed. Collapse the customer block and hand the height to the items; put the summary right, below or nowhere; decide what happens to it when you scroll. |
| **`VENQORE_LAYOUT_LAW.md`** | The rule book, 1,472 lines, generated. Start at §3 (no-regression), then §10 (the register), §11 (the document) and §12 (Flow/Free, resize, splitter). |
| **`RESEARCH.md`** | What Odoo, Toast, Shopify, Square, Lightspeed, Loyverse, Dynamics, Gridstack, react-grid-layout and Grafana actually do — and the four places we deliberately go past them. |

## The seven things from your review, and where each one went

| What you said | Where it is |
|---|---|
| “the resizeable option is not working” | A real pointer drag on the SE corner, 20×20px hit area, snapping to whole columns and rows and **stopping** at the category's travel — it cannot be dragged to a box that holds no fit. §12 |
| “I wanted a dotted outline where it is going to stay” | Dotted outline + translucent fill at the **snapped destination**; in Flow it is a real participant in the pack, so it shows the reflow landing there causes. The card follows the pointer so the outline stays visible. §12 |
| “it should not always be moving towards the left side” | **Flow / Free** switch. Free stores a box per column class, preserves gaps, and settles collisions **downward only**. §12 |
| “like in Windows, make the sidebar bigger and smaller” | A splitter wherever something expands. It stops at `vw − 2·margin − 904` — the No-Regression Rule made into a hard stop — and is magnetic at every width that puts the content column at exactly 112px. §12 |
| “let the user decide how their POS should look” | The composer. Six fixed variants became seven starting points plus every knob behind them. §10 |
| “summary on the right, or collapsible details at the top” + “dock it bottom-right on scroll, specially for Pro” | Both, as switches — and **Pro is derived, not chosen**: a summary's height *is* its density, so Pro is the first density that stops being stickable. §11 |
| “the tablet and phone screens are not good” | A catalog is a resident column only above **1182px**; a summary column only survives while the lines are still a table. Below those, one button / one panel, full screen — and a line card opens its own controls in place when you tap it. §10, §11 |

## Two defects the sweep found that nobody reported

- **At 1708 a Pro ledger lost its tenth line column when the nav expanded.**
  §4's `expanded_min` was derived from the *default* zone weights; widen the
  summary and the arithmetic changes. The No-Regression Rule moved from
  derivation time to run time — the nav now **holds the rail** wherever
  expanding would cost *this* composition a fit.
- **A summary column measured 36px per row and painted 38**, so the law called a
  505px column stickable in 398px of room and *Complete sale* sat 13px below the
  fold. The design system's box heights are now the law's own, written onto the
  screen as custom properties. One source of truth, both directions.

## What ships into the app

| File | Where it goes |
|---|---|
| `layout-law-v2.json` | `extras/Layout Law/` — the single source of truth |
| `venqore-layout-engine.js` | `resources/js/layout/` — ES module, zero deps |
| `venqore-layout.css` | `resources/css/` — shell, grid, terminal, document, edit |
| `tokens-spacing-v2.css` | replaces `extras/VenQore Design System/tokens/spacing.css` |
| `VenQore Design System v6 (COMPLETE standalone).html` | replaces the v5 bundle |

> **The v5 standalone never rendered**, and “COMPLETE standalone” was not true
> either. `@babel/standalone` 7.29 defaults `preset-react` to the automatic JSX
> runtime, which emits an ESM `import` into a plain `<script>` that every browser
> refuses — and React itself was still being fetched from unpkg, so the file
> showed nothing on a laptop with no network. v6 precompiles the JSX at build
> time, drops Babel, and **inlines React and ReactDOM**. It now opens from a USB
> stick on a plane.

## Regenerating

Numbers live in `law_v2.py` and nowhere else.

```
python3 law_v2.py               # re-solve + re-validate  -> layout-law-v2.json
python3 build_engine.py         # -> venqore-layout-engine.js
python3 build_css.py            # -> venqore-layout.css
python3 build_rulebook.py       # -> VENQORE_LAYOUT_LAW.md
python3 build_pages.py          # -> the three proof pages
python3 build_ds.py             # -> design system v6
cd out && node _crosscheck.mjs  # engine vs solver, must agree
python3 drive.py                # drives the shell with real pointer gestures
python3 drivedoc.py             # drives the document, scrolls it, drags its divider
```

Never hand-edit a number in the `.md`, the `.css`, the `.js` or the design-system
HTML. They are all generated, and a hand edit is a number that will silently
disagree with the engine — which is the exact class of bug this exists to prevent.

## Verification status

- JS engine vs. independent Python solver: **35,255 checks, 0 disagreements** —
  every terminal preset × viewport, every document preset × viewport, every nav
  row, every category × breakpoint, the resize handle's travel for all six
  categories, the placement projection through every column class, the splitter's
  travel and snaps at every width, and continuous 320→3440 sweeps of all of it.
- **Reachability sweep**, every 8px from 320 to 3440, every preset: nothing is
  ever stranded off-screen and no pane falls below its measured floor.
- **Fit-monotonicity**, every integer width: no region ever comes out of an
  `avail` dip poorer than it went in.
- **Rendered-DOM verification** (`verify.py`, all three pages × 11 devices ×
  every preset and both placement modes, plus the splitter parked at both ends of
  its travel): **0 escapes, 0 covered rank-1 controls, 0 drift between the law's
  box heights and the ones the stylesheet paints, 0 page errors**, and card
  heights land exactly on the row ladder — 64 / 152 / 328 / 504 / 680.
- **Driven in a real browser** (`drive.py`, `drivedoc.py`) — cards dragged to the
  right leaving 22 empty cells, corners resized past their maximum and stopped at
  6×4, the nav dragged 1400px past its travel and stopped at 313px where the
  column is exactly 92.00, documents scrolled to the very bottom with the dock and
  the last line never intersecting.
- Rank budget: **7 rank-1 on the surface, 0 rank-3**.
