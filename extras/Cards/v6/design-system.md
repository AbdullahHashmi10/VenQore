# design-system.md — objective adherence rules

Extracted from `VenQore Design System v6 (COMPLETE standalone).html` and
`VENQORE_LAYOUT_LAW.md` v2.0. These are the two sources the user named authoritative.

The System critic judges **only** this file. Every rule is binary and checkable from
rendered output plus the emitted CSS. No aesthetic judgement — that is the craft critic's job.

---

## 1. Tokens only. No raw values.

The full v6 token layer is available as `v6-tokens.css` and must be included verbatim.

**Fail on any of these appearing in a card's styles:**

- A hex colour (`#0BAA8F`, `#fff`, …) outside `v6-tokens.css`
- An `rgb()` / `rgba()` literal outside `v6-tokens.css`
- A raw pixel radius (`border-radius: 14px`)
- A raw `z-index` integer
- A raw transition duration (`transition: all 0.3s`)
- Any Tailwind palette class: `slate-*`, `emerald-*`, `indigo-*`, `amber-*`, `rose-*`,
  `purple-*`, `violet-*`, `blue-*`, `gray-*`, `green-*`, `red-*`

> The old cards fail this heavily — `text-slate-800`, `text-emerald-600`, `bg-emerald-50`,
> `text-xs font-bold text-slate-500 uppercase` appear 88× across the inventory.
> Every one of those must be gone.

## 2. Colour law

| Rule | Check |
|---|---|
| Teal is the brand and nothing else is teal | Primary action, active state and focus all use `--vq-accent*`. No decorative teal. |
| Module colour is wayfinding; semantic colour is data | They never swap jobs, never share a surface. |
| Nothing meaningful is colour-alone | A negative figure gets a minus sign **and** parentheses. A status chip gets an icon **and** a word. A delta gets a glyph **and** a number. |
| Categorical series use the fixed slots | `--vq-series-1` … `--vq-series-8`, in order, never cycled or reordered. Slot 1 is the brand. |
| Magnitude uses the sequential ramp | `--vq-seq-1..5`. Polarity uses `--vq-div-neg-2..--vq-div-pos-2`. Never a categorical slot for either. |

## 3. Shape

- **Card face:** `--vq-r-lg` (20px). Always, every category.
- **A nested panel inside a card** (an IN/OUT tile, a sub-surface): `--vq-r-md` (14px).
  This is what the reference does; a nested panel at 20px reads as a second card.
- **Pills, chips, avatars, icon buttons:** `--vq-r-full`.
- **Chart marks** (bar caps, etc.) use a mark radius, not a surface radius: 6px.
  A chart mark is geometry, not a surface, and is exempt from the surface scale.
- Nothing else. Legal surface radii: `--vq-r-xs 8 · sm 12 · md 14 · lg 20 · xl 28 · 2xl 36 · full 999`.
- Elevation is `--vq-elev-0..3` + `--vq-elev-inset`. No hand-written `box-shadow`.
- Dark-mode accent bloom uses `--vq-glow-accent` / `--vq-glow-accent-strong`.

## 4. Type

- Display voice: **Bricolage Grotesque** (`--vq-font-display`).
- Text voice: **Plus Jakarta Sans** (`--vq-font-sans`).
- All numerals: **Space Grotesk** (`--vq-font-numeric`), tabular.
- Metric values: `--vq-fs-metric` (38px) or `--vq-fs-metric-sm` (26px). No other size.
- Eyebrow: `--vq-fs-eyebrow` (11px), uppercase, `--vq-ls-eyebrow` (0.12em).
- Weights: only 400 / 500 / 600 / 700 (`--vq-fw-*`). **No `font-black` / 800 / 900.**

## 5. Motion

- Durations: **`--vq-dur-1` 120ms · `-2` 200ms · `-3` 320ms · `-4` 520ms** only.
  (`--vq-dur-amb` 9000ms is for ambient marketing surfaces, never inside a card.)
- Easing: `--vq-ease-out`, `--vq-ease-in-out`, `--vq-ease-spring`, `--vq-ease-spring-soft`.
- **No `hover:scale-*` anywhere.** This is a named, fixed bug — it caused the sidebar
  clipping defect 184 times.
- Inside the app the only motion is state feedback. Ambient/looping motion is
  marketing-only and must not appear in a card.
- Respect `prefers-reduced-motion`: entrance animations resolve instantly, no draw-in.

## 6. Z-index

Twelve legal values, all tokens, no exceptions:

`base 0 · raised 10 · sticky 100 · nav 200 · rail 300 · dropdown 400 · drawer 500 ·
modal 600 · popover 700 · tooltip 800 · toast 900 · command 1000`

## 7. Grid geometry — Layout Law v2.0

- Gutter **24px**, both axes, implemented as `gap`. **Never `margin-bottom`** — that
  alone was the documented alignment bug.
- Row track **64px**. `height(n) = n·64 + (n−1)·24` → 1:64 · 2:152 · 3:240 · 4:328 · 5:416 · 6:504.
- Twelve columns.

### The six card categories — the only legal sizes

Each category declares a **max** and an ordered list of **fits**. A fit is
`cols × rows` plus a **pixel-width floor** — the narrowest the card may render
and still use that fit. There is no separate "minimum size": the leanest fit
*is* the minimum.

| Cat | Role | Max | Fits (cols×rows @ width floor) |
|---|---|---|---|
| **C1 Tile** | Shortcut, quick action, single-glyph stat | 3×2 | **2×1 icon+label ≥124** (default) · 1×1 icon ≥52 |
| **C2 Strip** | One KPI on one line — label left, value right | 6×2 | **4×1 inline ≥356** (default) · 3×2 stacked ≥200 |
| **C3 Metric** | KPI with delta, sparkline or comparison | 6×4 | 4×3 full ≥386 · **3×2 standard ≥274** (default) · 2×2 compact ≥200 · 2×3 stacked ≥163 |
| **C4 Panel** | Ranked list, breakdown, small chart, table excerpt | 6×6 | 4×4 full ≥492 · **3×4 standard ≥356** (default) · 3×5 compact ≥200 · 2×6 list ≥200 |
| **C5 Board** | Full chart, multi-series, wide table | 12×9 | **6×6 full ≥593** (default) · 5×7 narrow ≥415 · 4×8 min ≥295 |
| **C6 Canvas** | Hero chart, P&L, cohort grid, map | 12×16 | **8×8 full ≥733** (default) · 6×10 narrow ≥533 · 4×12 min ≥295 |

A card **widens before it degrades**. It only drops to a leaner fit when
widening is exhausted, and degrading trades a column for a row and re-lays its
inside. Rendering a card outside its category's declared fits is a fail; so is
rendering a fit at the wrong row span.

> ⚠️ `VENQORE_CARD_BUILDER_BUILD_SPEC.md` §7.2 declares a different, older taxonomy
> (`small 3×2 · medium 6×2 · large 6×4 · full 12×3`). **Layout Law v2.0 supersedes it.**
> C1–C6 is authoritative for this run.

## 8. Number rendering — the number ladder

Currency drops first, then decimals, then magnitude:

`full4 → full2 → full → grouped → abbr2 → abbr1 → abbr0 → bare`

- Full precision belongs in the ledger, **never on a dashboard card**.
- The exact value is always **one hover away**.
- A value must never overflow, clip, or ellipsize its card — it steps down the ladder instead.

## 9. The rank law — action budget

| Rank | Lives | Budget on surface |
|---|---|---|
| 1 · Act | always visible on the working surface | **max 7** |
| 2 · Adjust | one gesture away, contextual to the selected object | unbounded |
| 3 · Configure | settings drawer only | **0** |

A card exposes at most its rank-1 actions at rest. Configure never sits on the card face.

## 10. Chart binding legality

A chart may only render a shape it is legal for. From the Reckoner:

| Shape | Legal charts |
|---|---|
| SCALAR | `stat`, `sparkline`, `gauge` |
| STATUS | `status` |
| SERIES | `line`, `area`, `bar`, `profit_loss_line`, `sparkline` |
| MULTI_SERIES | `composed`, `line`, `area` |
| BREAKDOWN | `pie`, `ring`, `sunburst`, `funnel`, `bar` |
| RANKING | `bar`, `table`, `funnel` |
| TABLE | `table`, `heatmap` (2-dim) |
| GAUGE | `gauge`, `ring` |
| FEED | `feed` |

**Candlestick is excluded from the entire system** — VenQore has no OHLC data.

## 11. Accessibility

- Contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text and UI boundaries, in **both** themes.
- **Non-text graphics that carry data** must clear **3:1** against their surface.
  The test is whether the mark *encodes a quantity*:
  - An **inactive bar** in a bar chart encodes the other days → **3:1 required**.
  - A **gauge track** encodes the remainder ("the other 67%") → **3:1 required**.
  - A **series line** or a **ranking bar fill** encodes the value → **3:1 required**.
  - A **ranking groove** behind a proportional fill encodes nothing — the fill
    carries the value and the number is printed beside it → **decoration, exempt**.
- **Control boundaries** need 3:1 only where the boundary is the *only* means of
  identifying the control. A segmented control identified by its labels and by a
  raised, accent-tinted selected member does not depend on its outer hairline, so
  the hairline may stay at the `--vq-line` value.
- Focus is always visible and uses `--vq-focus`.
- Roughly 1 in 12 men cannot separate the red from the green — see §2, rule 3.

## 12. Both themes, always

Every card renders correctly at `data-theme="light"` **and** `data-theme="dark"`.
Dark surfaces are the near-black greens (`--vq-surface: #141B19`), never neutral grey.
A card that only works in one theme is a fail regardless of how good it looks.
