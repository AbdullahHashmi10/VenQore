# VenQore Layout Law

**v2.0.0** · supersedes v1.0.0 · generated from `layout-law.json`

---

v1.0 answered one question: **how does a card survive every screen?**
v2.0 answers the whole of it: **how does a screen survive every screen?**

Everything below is derived or measured. Nothing is a preference. Where a number
looks arbitrary, the derivation is written next to it — and if the derivation is
not written down, the number does not belong in this document.

Three things make it enforceable rather than advisory:

1. **One resolver.** A dashboard card, a POS pane and a document zone are the
   same object — a rectangle that knows several ways to lay its inside out,
   each with a pixel floor. One function resolves all three, so the dashboard
   and the register can never disagree about what the law says.
2. **A validator, not a linter.** `validate()` rejects an illegal layout before
   render. That is the contract that lets Reckoner author dashboards: it emits
   card *descriptors*, the engine turns them into geometry, and a descriptor
   list that would produce an illegal layout never reaches the DOM.
3. **A continuous sweep.** Every integer width from 320 to 3440 is checked, not
   a handful of breakpoints. Three of the findings in this document — the
   1280 laptop cliff, the v1.0 subnav defect, and the fact that a pushing
   sidebar can never arrive for free — are invisible if you only test at the
   breakpoints you chose.

---

## Contents

1. [The shell](#1-the-shell)
2. [The nav law](#2-the-nav-law) — push vs overlay, and why 1216
3. [The no-regression rule](#3-the-no-regression-rule)
4. [Archetypes](#4-archetypes)
5. [The grid](#5-the-grid)
6. [Cards](#6-cards)
7. [Bands](#7-bands)
8. [Numbers](#8-numbers)
9. [The rank law](#9-the-rank-law)
10. [The terminal](#10-the-terminal) — a register you compose
11. [The document](#11-the-document) — one editor, thirteen types, composed
12. [Edit mode](#12-edit-mode) — Flow/Free, resize, and the splitter
13. [Underflow](#13-underflow)
14. [Verification](#14-verification)
15. [How to change a number](#15-how-to-change-a-number)

---

## 1. The shell

Three regions, and only three. Every screen in the product is one of six
compositions of them, and nothing else may position itself against the viewport.

| Region | Width | Note |
|---|---|---|
| Nav | 264px expanded · 72px rail · 0 hidden | ramps in; see §2 |
| Header | full · 64px tall | `header_h == row`. One number, two jobs |
| Subnav | 224px | Settings and Reports only; a column above 1248, a tab strip below |
| Content | the remainder | margin 16–24px, ramped |

### The one law, both axes

```
size(n) = n·UNIT + (n−1)·GUTTER
```

with `GUTTER = 24px` on **both** axes and `UNIT = 64px` vertically.

CSS Grid computes this natively from `gap`. That matters more than it sounds:
the alignment bug Gemini flagged came from treating the gutter as something
*added between* cards, which made a 2-row card `64+64 = 128px` while two stacked
1-row cards were `64+24+64 = 152px`. Making the gutter part of the **pitch** means
a 2-row card spans across it and absorbs it — `2×64 + 1×24 = 152` — and the two
line up exactly. You do not implement this. `gap` does. If the old HTML used
`margin-bottom`, that alone was the bug.

Row heights, therefore:

| Rows | Height | Working |
|---|---|---|
| 1 | **64px** | 1×64 + 0×24 |
| 2 | **152px** | 2×64 + 1×24 |
| 3 | **240px** | 3×64 + 2×24 |
| 4 | **328px** | 4×64 + 3×24 |
| 5 | **416px** | 5×64 + 4×24 |
| 6 | **504px** | 6×64 + 5×24 |
| 7 | **592px** | 7×64 + 6×24 |
| 8 | **680px** | 8×64 + 7×24 |
| 9 | **768px** | 9×64 + 8×24 |
| 10 | **856px** | 10×64 + 9×24 |
| 12 | **1032px** | 12×64 + 11×24 |
| 16 | **1384px** | 16×64 + 15×24 |

---

## 2. The nav law

**The hamburger exists at every width, on every archetype.** Not `lg:hidden`,
not "only when the sidebar is gone". At any size the user can open and close the
nav, because the one thing worse than a nav that takes space is a nav you cannot
get back.

What the hamburger *does* depends on whether pushing is affordable here.

### The push threshold: 1216px

Pushing is always nicer — the page stays fully usable, nothing hides behind a
scrim, there is no modal trap. So: **push whenever pushing does not damage the
grid.** It damages the grid the moment the content region can no longer sustain
the narrowest desktop grid the law already ships.

That grid is the 1024 rail:

```
avail(1024, rail) = 1024 − 72 − 48 = 904px  →  8 columns @ 92.00px
```

92px is therefore the desktop column floor — not a target, a fact about
what is already in production at the smallest desktop the ladder covers. So push
is legal exactly when:

```
vw − 264 − 48 ≥ 904     →     vw ≥ 1216
```

- **vw ≥ 1216** — the nav **pushes**. The grid recomputes, the column count may step
  down, cards re-resolve through §6. No scrim, nothing hidden.
- **vw < 1216** — the nav **overlays** at `min(264, vw − 56)px` over a
  `rgba(9,11,20,.56)` scrim. The content geometry is untouched. Esc, the scrim, or
  choosing a nav item closes it.

There is a second, deeper reason the narrow case overlays, and it is in §3.

### Sticky intent

On a push-capable screen the hamburger sets a **preference**, not a temporary
state. Expand it at 1920, shrink the window past 1216 and the nav demotes to a
rail on its own; grow the window back and the choice returns. Stored in
`user_preferences.shell.nav.intent`. The nav is never forgotten and never forced.

### Every width, both directions

| Viewport | At rest | Hamburger | On toggle | Drawer | Cols at rest | Cols after | Grid reflows? |
|---|---|---|---|---|---|---|---|
| `360` | hidden | always | **overlay** | 264px | 4 @ 64.0 | 4 @ 64.0 | no |
| `390` | hidden | always | **overlay** | 264px | 4 @ 71.5 | 4 @ 71.5 | no |
| `414` | hidden | always | **overlay** | 264px | 4 @ 77.5 | 4 @ 77.5 | no |
| `600` | hidden | always | **overlay** | 264px | 6 @ 74.7 | 6 @ 74.7 | no |
| `768` | hidden | always | **overlay** | 264px | 6 @ 100.0 | 6 @ 100.0 | no |
| `820` | hidden | always | **overlay** | 264px | 6 @ 108.7 | 6 @ 108.7 | no |
| `1024` | rail | always | **overlay** | 264px | 8 @ 101.0 | 8 @ 101.0 | no |
| `1180` | rail | always | **overlay** | 264px | 8 @ 111.5 | 8 @ 111.5 | no |
| `1216` | rail | always | **push** | — | 8 @ 116.0 | 8 @ 92.0 | yes — the user asked |
| `1265` | rail | always | **push** | — | 8 @ 122.1 | 8 @ 98.1 | yes — the user asked |
| `1280` | expanded | always | **push** | — | 8 @ 100.0 | 8 @ 100.0 | no |
| `1351` | expanded | always | **push** | — | 8 @ 108.9 | 8 @ 108.9 | no |
| `1425` | expanded | always | **push** | — | 8 @ 118.1 | 8 @ 118.1 | no |
| `1521` | expanded | always | **push** | — | 10 @ 99.3 | 10 @ 99.3 | no |
| `1585` | expanded | always | **push** | — | 10 @ 105.7 | 10 @ 105.7 | no |
| `1905` | expanded | always | **push** | — | 12 @ 110.8 | 12 @ 110.8 | no |
| `2545` | expanded | always | **push** | — | 16 @ 117.1 | 16 @ 117.1 | no |
| `3425` | expanded | always | **push** | — | 24 @ 106.7 | 24 @ 106.7 | no |

The last column is the one that matters. An **automatic** reflow — one the user
did not ask for — is a jolt. A reflow that happens *because* they pressed the
hamburger is feedback. The only rows that reflow are the ones where they asked.

---

## 3. The no-regression rule

The continuous sweep exposed something no breakpoint test would: **the content
region is not monotonic in the viewport.** Shell chrome arrives at fixed widths
and takes its cut, so the content can *shrink* as the window *grows*.

```
vw 599   margin 16, no nav        →  avail  567
vw 600   margin 24, no nav        →  avail  552    −15px for +1px of window
vw 1023  rail hidden              →  avail  975
vw 1024  rail arrives (72px)      →  avail  904    −71px for +1px of window
vw 1279  rail                     →  avail 1159
vw 1280  expanded arrives (264px) →  avail  968   −191px for +1px of window
```

Every one of those is a visible jolt: drag a window one pixel wider and the
layout gets worse.

The first attempt at a rule said *"chrome that costs C pixels arrives C pixels
later"*. That is wrong, and the sweep proved it — by the time you reach `D+C`
the no-chrome baseline has also grown by `C`, so the deficit is exactly as large
as it was. Solve it properly:

```
arriving at A is free  ⟺  A − C − 2m ≥ (A−1) − 2m  ⟺  C ≤ 1
```

**A step of pushing chrome is never free, at any width, for any C > 1.** There is
no clever threshold. There are three honest ways out, and the law uses all
three, each where it belongs:

**RAMP** — the chrome's width is a `clamp()` over a band at least as long as its
own width, so `d(chrome)/d(vw) ≤ 1` and the content never steps down. Across the
band the extra window width goes entirely to the chrome and the content simply
holds still. Two lines of CSS, no media queries:

```css
--vq-margin: clamp(16px, calc(16px + (100vw - 600px) / 6), 24px);
--vq-rail-w: clamp(0px,  calc((100vw - 1024px) * 1),        72px);
```

**OVERLAY** — the chrome takes zero width. This is the real reason a narrow
window overlays: not "the grid gets small", but "an automatic push can never be
free". The user pressing the hamburger is not automatic, which is why the same
nav is allowed to push above 1216.

**ABSORB** — the step is permitted where no region *loses a fit* because of it:
only fewer cards per row, or a table column that demotes by priority. That is a
checkable property, not an opinion, and it is what separates the dashboard
(absorbs at 1280) from the document (cannot — see §4) and the terminal (never).

The invariant is therefore about **fits, not pixels**: `avail` may dip where
chrome absorbs, but no region may ever come out of that dip poorer. §14 is the
test that enforces it.

---

## 4. Archetypes

Every screen in the product is one of six.

| Archetype | Scrolls | Regions | Rule | Examples |
|---|---|---|---|---|
| **Dashboard** | page | nav · header · canvas | cards on the grid; §6 card law applies verbatim; edit mode available | Home, Dashboard, Workspace, role dashboards |
| **Index** | page | nav · header · toolbar · table · pagination | one sticky toolbar row; columns demote right-to-left by declared priority; below 600 rows become cards | Products, Customers, Sales list, Purchases list, Expenses |
| **Document** | page | nav · header · docheader · lines · summary · actionbar | three zones; summary is resident beside lines while it clears its floor, else it becomes a sticky action bar | Invoice, Purchase, Quotation, Order, Return, Expense |
| **Terminal** | panes | nav · header · panes | exactly one viewport tall; the page never scrolls; panes scroll internally; columns-vs-bands is an aspect question; the residency ladder applies | POS, Kitchen display, Table floor |
| **Console** | page | nav · header · subnav · canvas | the 224px subnav is a THIRD shell column from 1248 (where the canvas still clears 904px) and a horizontal tab strip below it; the nav itself waits until 1440 | Settings, Reports, Accounting |
| **Focus** | page | canvas | no nav, no header; content capped at 6 columns and centred; the only archetype allowed to cap width | Login, Onboarding wizard, Print preview, Checkout |

### The nav is not the same on every archetype

Solving the document editor turned up a cliff at the single most common laptop
transition:

- at **1265** the nav is a 72px rail and the line table gets **807px** — seven
  columns, Standard density;
- at **1280** the nav becomes the 264px sidebar, the table drops to **680px**,
  and the same invoice **loses a column on a bigger screen**.

Buying a wider laptop made the invoice worse. The cause is that v1.0 gave the nav
one global default. But a nav is not equally useful on every surface:

> You navigate **from** a dashboard or a list — the nav is part of the task.
> You do not navigate from an invoice or a register — there it is parked chrome,
> and 192px of parked chrome is a whole table column.

So:

> **The nav defaults to the widest state that does not cost the archetype its
> richest layout.**

One sentence, and every number below is derived from it by search, per archetype.
The hamburger is still present at every width on every archetype, so the user can
always overrule the default — this only decides what they see first.

| Archetype | Rail from | Expanded from | Subnav column from | Why |
|---|---|---|---|---|
| **dashboard** | 1024 (ramped to 1096) | **1280** | — | You navigate FROM a dashboard. Cards adapt to any column count by §6, so an expanded nav never costs the surface its richest layout -- it only shows fewer cards per row. Keep the global default. |
| **index** | 1024 (ramped to 1096) | **1280** | — | Same as dashboard: a list is a place you navigate from, and table columns demote by priority rather than breaking. |
| **document** | 1024 (ramped to 1096) | **1708** | — | A document is a work surface, not a place you navigate from. Hold the rail until an expanded nav is free -- which is the first width at which the 10-column line table AND the summary panel both still clear their floors. |
| **terminal** | 1024 (ramped to 1096) | never | — | A register is a single-purpose surface you stand at for a shift. The nav tree is not part of the task, and the operator wants a way BACK, not a way ANYWHERE. Rail always; the hamburger still opens the full nav as an overlay. |
| **console** | 1024 (ramped to 1096) | **1440** | 1248 | Settings and Reports carry a 224px subnav. Two nav columns cost 488px, so the expanded nav has to wait until the canvas still clears 904px -- and below subnav_col_min the subnav itself stops being a column and becomes a tab strip under the header. |
| **focus** | never | never | — | No nav at all. The only archetype allowed to cap its own width. |

### A defect v1.0 shipped

v1.0 placed a 224px subnav as a third shell column from 1024 up and never
checked it against its own 92px column floor. It fails at four breakpoints:

| Viewport | Nav + subnav | Content | Columns | Verdict |
|---|---|---|---|---|
| 1024 | rail + subnav = 296 | 680 | 8 @ **64.00** | below the 92px floor |
| 1180 | rail + subnav = 296 | 836 | 8 @ **83.50** | below the floor |
| 1351 | expanded + subnav = 488 | 815 | 8 @ **80.88** | below the floor |
| 1425 | expanded + subnav = 488 | 889 | 8 @ **90.12** | below the floor |

The fix falls straight out of the same rule. A subnav **column** costs 224px, so
it may not appear until the canvas still clears 904px:
`904 + 72 + 224 + 48 = 1248`. Below that a subnav is a horizontal
**tab strip** pinned under the header, which costs height instead of width.
Expanded-plus-subnav costs 416px more than nothing, so it waits until **1440**.

Note that `1216`, `1248` and `1440` are all the same calculation from different
directions — the content floor of 904px plus whatever chrome is asking to sit
in front of it. Two independent routes to the same number is the sign that the
rule is real and not a rationalisation.

---

## 5. The grid

The column **count** floats with the viewport; the column **width** stays in a
tight band around a 112px target. So a card is the same physical size on every
machine, and a wider screen fits **more** cards rather than **fatter** ones.

Legal column counts: desktop `[8, 10, 12, 14, 16, 18, 20, 24]` ·
tablet `[6, 8, 10, 12]` · mobile `[4]`.

The engine picks the legal count whose resulting column width is closest to 112px.

| Screen | Viewport | Nav | Content | Cols | Column | Note |
|---|---|---|---|---|---|---|
| Android baseline | `360` | drawer | 328px | 4 | 64.00px | mobile |
| iPhone 12-15 | `390` | drawer | 358px | 4 | 71.50px | mobile |
| iPhone Plus / Max | `414` | drawer | 382px | 4 | 77.50px | mobile |
| iPad 9.7 portrait | `768` | drawer | 720px | 6 | 100.00px | tablet |
| iPad Air portrait | `820` | drawer | 772px | 6 | 108.67px | tablet |
| iPad 9.7 landscape | `1024` | rail | 904px | 8 | 92.00px | tablet |
| iPad Air landscape | `1180` | rail | 1060px | 8 | 111.50px | tablet |
| 1280 screen (FHD @150%) | `1265` | rail | 1145px | 8 | 122.12px | laptop |
| 1366 screen (HD laptop) | `1351` | expanded | 1039px | 8 | 108.88px | laptop |
| 1440 screen (MBP13) | `1425` | expanded | 1113px | 8 | 118.12px | laptop |
| 1536 screen (FHD @125%) | `1521` | expanded | 1209px | 10 | 99.30px | laptop |
| 1600 screen | `1585` | expanded | 1273px | 10 | 105.70px | desktop |
| 1920 screen (FHD)  **reference** | `1905` | expanded | 1593px | 12 | 110.75px | desktop |
| 2560 screen (QHD) | `2545` | expanded | 2233px | 16 | 117.06px | desktop |
| 3440 ultrawide | `3425` | expanded | 3113px | 24 | 106.71px | desktop |

### On the base width

1920 is about 22% of desktops — but StatCounter reports **CSS pixels**, so
1536×864 (7.3%) and 1280×720 (5.4%) are the same 1080p laptops at 125% and 150%
Windows scaling. Measuring your own screen at 100% designs for the minority of
your own hardware class.

So: **author at 1920 / 12 columns, but the layout must be complete at 1280** —
and it is. Every table in this document includes 1265, which is a 1280 screen
minus the scrollbar.

---

## 6. Cards

A category is **not a size**. It is an ordered list of **fits**, each with a
pixel floor measured from real advance widths — Space Grotesk 600 tabular digit
= 0.62em, comma 0.284em, period 0.287em, read out of the font binary.

Resolution order:

1. start at the fit the author designed;
2. keep it by **widening** the span while the floor is unmet and headroom remains;
3. only when widening is exhausted, **degrade** to the next leaner fit — which
   trades a column for a row and re-lays the card's inside;
4. never below a floor, never wider than the grid, always terminates.

**Step 3 is the mechanism that guarantees nobody loses data to their screen
size.** A card that cannot get wider gets taller and changes shape.

### C1 · Tile

Shortcut, quick action, custom button, single glyph stat. Example: *New sale - Open till - Scan barcode*. Max 3×2. Authored default: `icon+label`.

| Fit | Span | Floor | What changes inside |
|---|---|---|---|
| `icon+label` | 2×1 | ≥ 124px | icon left, label right |
| `icon` | 1×1 | ≥ 52px | icon only, label in tooltip |

### C2 · Strip

One KPI on one line - label left, value right. Example: *Today's sales*. Max 6×2. Authored default: `inline`.

| Fit | Span | Floor | What changes inside |
|---|---|---|---|
| `inline` | 4×1 | ≥ 356px | label and value share one line |
| `stacked` | 3×2 | ≥ 200px | label above value - gains a row |

### C3 · Metric

KPI with delta, sparkline or period comparison. Example: *Gross revenue*. Max 6×4. Authored default: `standard`.

| Fit | Span | Floor | What changes inside |
|---|---|---|---|
| `full` | 4×3 | ≥ 386px | value + sparkline side by side |
| `standard` | 3×2 | ≥ 274px | value, delta chip below |
| `compact` | 2×2 | ≥ 200px | abbreviated value, no sparkline |
| `stacked` | 2×3 | ≥ 163px | label / value / delta on three lines |

### C4 · Panel

Ranked list, breakdown, small chart, table excerpt. Example: *Sales by module*. Max 6×6. Authored default: `standard`.

| Fit | Span | Floor | What changes inside |
|---|---|---|---|
| `full` | 4×4 | ≥ 492px | label + bar + value |
| `standard` | 3×4 | ≥ 356px | label + value, no bar |
| `compact` | 3×5 | ≥ 200px | label over value - gains a row |
| `list` | 2×6 | ≥ 200px | narrow list, one item per row |

### C5 · Board

Full chart, multi-series, wide table. Example: *Cash flow & revenue*. Max 12×9. Authored default: `full`.

| Fit | Span | Floor | What changes inside |
|---|---|---|---|
| `full` | 6×6 | ≥ 593px | chart + right-hand legend |
| `narrow` | 5×7 | ≥ 415px | legend moves below chart - gains a row |
| `min` | 4×8 | ≥ 295px | chart only, table view behind a toggle |

### C6 · Canvas

Hero chart, P&L statement, cohort grid, map. Example: *Profit & loss statement*. Max 12×16. Authored default: `full`.

| Fit | Span | Floor | What changes inside |
|---|---|---|---|
| `full` | 8×8 | ≥ 733px | full canvas with controls rail |
| `narrow` | 6×10 | ≥ 533px | controls move above - gains 2 rows |
| `min` | 4×12 | ≥ 295px | vertical scroll inside the card |

### Where each category lands, at every breakpoint

**C1 · Tile**

| Viewport | Span | Fit | Width | Height | Per row | Note |
|---|---|---|---|---|---|---|
| `360` | 2×1 | icon+label | 152px | 64px | 2 | — |
| `390` | 2×1 | icon+label | 167px | 64px | 2 | — |
| `414` | 2×1 | icon+label | 179px | 64px | 2 | — |
| `768` | 2×1 | icon+label | 224px | 64px | 3 | — |
| `820` | 2×1 | icon+label | 241px | 64px | 3 | — |
| `1024` | 2×1 | icon+label | 226px | 64px | 4 | — |
| `1180` | 2×1 | icon+label | 247px | 64px | 4 | — |
| `1265` | 2×1 | icon+label | 268px | 64px | 4 | — |
| `1351` | 2×1 | icon+label | 242px | 64px | 4 | — |
| `1425` | 2×1 | icon+label | 260px | 64px | 4 | — |
| `1521` | 2×1 | icon+label | 223px | 64px | 5 | — |
| `1585` | 2×1 | icon+label | 235px | 64px | 5 | — |
| `1905` | 2×1 | icon+label | 246px | 64px | 6 | — |
| `2545` | 2×1 | icon+label | 258px | 64px | 8 | — |
| `3425` | 2×1 | icon+label | 237px | 64px | 12 | — |

**C2 · Strip**

| Viewport | Span | Fit | Width | Height | Per row | Note |
|---|---|---|---|---|---|---|
| `360` | 4×2 | stacked | 328px | 152px | 1 | promoted degraded |
| `390` | 4×1 | inline | 358px | 64px | 1 | full width |
| `414` | 4×1 | inline | 382px | 64px | 1 | full width |
| `768` | 4×1 | inline | 472px | 64px | 1 | — |
| `820` | 4×1 | inline | 507px | 64px | 1 | — |
| `1024` | 4×1 | inline | 476px | 64px | 2 | — |
| `1180` | 4×1 | inline | 518px | 64px | 2 | — |
| `1265` | 4×1 | inline | 560px | 64px | 2 | — |
| `1351` | 4×1 | inline | 508px | 64px | 2 | — |
| `1425` | 4×1 | inline | 544px | 64px | 2 | — |
| `1521` | 4×1 | inline | 469px | 64px | 2 | — |
| `1585` | 4×1 | inline | 495px | 64px | 2 | — |
| `1905` | 4×1 | inline | 515px | 64px | 3 | — |
| `2545` | 4×1 | inline | 540px | 64px | 4 | — |
| `3425` | 4×1 | inline | 499px | 64px | 6 | — |

**C3 · Metric**

| Viewport | Span | Fit | Width | Height | Per row | Note |
|---|---|---|---|---|---|---|
| `360` | 4×2 | standard | 328px | 152px | 1 | promoted  |
| `390` | 4×2 | standard | 358px | 152px | 1 | promoted  |
| `414` | 4×2 | standard | 382px | 152px | 1 | promoted  |
| `768` | 3×2 | standard | 348px | 152px | 2 | — |
| `820` | 3×2 | standard | 374px | 152px | 2 | — |
| `1024` | 3×2 | standard | 351px | 152px | 2 | — |
| `1180` | 3×2 | standard | 382px | 152px | 2 | — |
| `1265` | 3×2 | standard | 414px | 152px | 2 | — |
| `1351` | 3×2 | standard | 375px | 152px | 2 | — |
| `1425` | 3×2 | standard | 402px | 152px | 2 | — |
| `1521` | 3×2 | standard | 346px | 152px | 3 | — |
| `1585` | 3×2 | standard | 365px | 152px | 3 | — |
| `1905` | 3×2 | standard | 380px | 152px | 4 | — |
| `2545` | 3×2 | standard | 399px | 152px | 5 | — |
| `3425` | 3×2 | standard | 368px | 152px | 8 | — |

**C4 · Panel**

| Viewport | Span | Fit | Width | Height | Per row | Note |
|---|---|---|---|---|---|---|
| `360` | 4×5 | compact | 328px | 416px | 1 | promoted degraded |
| `390` | 4×4 | standard | 358px | 328px | 1 | promoted  |
| `414` | 4×4 | standard | 382px | 328px | 1 | promoted  |
| `768` | 4×4 | standard | 472px | 328px | 1 | promoted  |
| `820` | 3×4 | standard | 374px | 328px | 2 | — |
| `1024` | 4×4 | standard | 476px | 328px | 2 | promoted  |
| `1180` | 3×4 | standard | 382px | 328px | 2 | — |
| `1265` | 3×4 | standard | 414px | 328px | 2 | — |
| `1351` | 3×4 | standard | 375px | 328px | 2 | — |
| `1425` | 3×4 | standard | 402px | 328px | 2 | — |
| `1521` | 4×4 | standard | 469px | 328px | 2 | promoted  |
| `1585` | 3×4 | standard | 365px | 328px | 3 | — |
| `1905` | 3×4 | standard | 380px | 328px | 4 | — |
| `2545` | 3×4 | standard | 399px | 328px | 5 | — |
| `3425` | 3×4 | standard | 368px | 328px | 8 | — |

**C5 · Board**

| Viewport | Span | Fit | Width | Height | Per row | Note |
|---|---|---|---|---|---|---|
| `360` | 4×8 | min | 328px | 680px | 1 | degraded |
| `390` | 4×8 | min | 358px | 680px | 1 | degraded |
| `414` | 4×8 | min | 382px | 680px | 1 | degraded |
| `768` | 6×6 | full | 720px | 504px | 1 | full width |
| `820` | 6×6 | full | 772px | 504px | 1 | full width |
| `1024` | 6×6 | full | 726px | 504px | 1 | — |
| `1180` | 6×6 | full | 789px | 504px | 1 | — |
| `1265` | 6×6 | full | 853px | 504px | 1 | — |
| `1351` | 6×6 | full | 773px | 504px | 1 | — |
| `1425` | 6×6 | full | 829px | 504px | 1 | — |
| `1521` | 6×6 | full | 716px | 504px | 1 | — |
| `1585` | 6×6 | full | 754px | 504px | 1 | — |
| `1905` | 6×6 | full | 784px | 504px | 2 | — |
| `2545` | 6×6 | full | 822px | 504px | 2 | — |
| `3425` | 6×6 | full | 760px | 504px | 4 | — |

**C6 · Canvas**

| Viewport | Span | Fit | Width | Height | Per row | Note |
|---|---|---|---|---|---|---|
| `360` | 4×12 | min | 328px | 1032px | 1 | degraded |
| `390` | 4×12 | min | 358px | 1032px | 1 | degraded |
| `414` | 4×12 | min | 382px | 1032px | 1 | degraded |
| `768` | 6×10 | narrow | 720px | 856px | 1 | degraded |
| `820` | 6×10 | narrow | 772px | 856px | 1 | degraded |
| `1024` | 8×8 | full | 976px | 680px | 1 | full width |
| `1180` | 8×8 | full | 1060px | 680px | 1 | full width |
| `1265` | 8×8 | full | 1145px | 680px | 1 | full width |
| `1351` | 8×8 | full | 1039px | 680px | 1 | full width |
| `1425` | 8×8 | full | 1113px | 680px | 1 | full width |
| `1521` | 8×8 | full | 962px | 680px | 1 | — |
| `1585` | 8×8 | full | 1014px | 680px | 1 | — |
| `1905` | 8×8 | full | 1054px | 680px | 1 | — |
| `2545` | 8×8 | full | 1104px | 680px | 2 | — |
| `3425` | 8×8 | full | 1022px | 680px | 3 | — |

---

## 7. Bands

A grid row **band** contains only cards of equal row-span. A card taller than its
neighbours starts a new band rather than sitting beside them and leaving a hole
underneath.

Two things fall out of that, and both matter more than the tidiness:

- a VenQore dashboard reads as **bands of equal-height cards** rather than a
  ragged collage;
- the AI builder can reason about a dashboard as a **list of bands** instead of
  a 2D packing problem, which is a very large difference in how easy it is to
  get right.

Within a band, leftover columns are handed back to cards that have not reached
their category maximum — one column at a time, round-robin, until the band is
flush or every card is at max. **Cards never reorder.** The author's sequence is
the reading order on every screen, which is what makes a layout authored at any
width legal at every width.

---

## 8. Numbers

A card **never** sizes to its worst-case number. Your 20-digit, 4-decimal value
is **723px** at metric size. The widest card the law can produce at 1920
is 1593px; a metric card is ~380px. No card can ever be sized to that number.

So the law inverts it: the number formats **down to the card**, and the exact
value is always one hover away. Currency drops first, then decimals, then
magnitude. Full precision belongs in the ledger, never on a dashboard.

Two guards the ladder needs and a naive implementation misses:

- a unit is only legal if it brings the mantissa under 1000, or you get
  `PKR 100000000.00T`, which means nothing;
- currency under 1000 never rounds to whole units — `PKR 100` for 99.50 is a lie.

| Rung | Sample | @20px | @26px | @38px | Note |
|---|---|---|---|---|---|
| `full4` | `PKR 99,999,999,999,999,999,999.9999` | 380px | 494px | 723px | 20 int + 4 dp - ledger & detail view only |
| `full2` | `PKR 9,999,999,999,999.99` | 257px | 335px | 489px | 13 int + 2 dp |
| `full` | `PKR 999,999,999.99` | 196px | 255px | 373px | 9 int + 2 dp - full precision |
| `grouped` | `PKR 9,999,999.99` | 172px | 223px | 326px | 7 int + 2 dp |
| `abbr2` | `PKR 999.99M` | 123px | 160px | 234px | abbreviated, 2 dp |
| `abbr1` | `PKR 999.9M` | 111px | 144px | 211px | abbreviated, 1 dp |
| `abbr0` | `PKR 999M` | 93px | 120px | 176px | abbreviated, 0 dp |
| `bare` | `999M` | 50px | 65px | 95px | no currency - chip / axis |

---

## 9. The rank law

The structural answer to *"it feels overwhelming"*.

The POS shows about **60 affordances at rest with an empty cart**, and the green
Complete button carries the same visual weight as a toggle a cashier touches once
a month. That is not a styling problem — it is a residency problem. Nothing in
the system said where a control was **allowed** to live, so everything lived
everywhere.

Every control in VenQore carries exactly one rank. Rank decides residency, and
residency is enforced, not advised.

| Rank | Used | Lives | Budget | Why |
|---|---|---|---|---|
| **1 · Act** | every transaction | always visible on the working surface | 7 on the surface | 7 is the working-memory span; past it the user scans instead of acting |
| **2 · Adjust** | some transactions | one gesture away, and contextual to the selected object | unbounded | revealed by the thing it acts on, so it costs nothing until needed |
| **3 · Configure** | once per setup, shift or month | settings drawer only -- never on the working surface | 0 on the surface | a monthly control docked permanently is 30 days of noise for 1 day of use |

Applied to the register: **60 capabilities**, none dropped,
**9 visible at rest**.

---

## 10. The terminal

A dashboard has unlimited height, so v1.0 only ever had to defend the horizontal
axis. A **terminal** is exactly one viewport tall and never scrolls the page, so
here height is the scarcer resource — and the worst case is not a phone, it is a
**1280×720 laptop**, where a maximised browser leaves about 570 usable pixels.

### Measured floors

Every one of these is computed from the type scale and the real advance widths,
not chosen:

| Floor | Pixels | What it is |
|---|---|---|
| `cart_line_full` | **559px** | one cart line with every control inline |
| `cart_line_relay` | **359px** | name on line 1, controls on line 2 |
| `cart_line_min` | **305px** | name + total; tap a line to adjust |
| `tender_full` | **367px** | the grand total at 38px + padding |
| `tender_mid` | **264px** | the grand total at 26px |
| `tender_min` | **201px** | an abbreviated total in a sticky bar |
| `catalog_grid3` | **484px** | 3 image tiles per row |
| `catalog_grid2` | **328px** | 2 image tiles per row |
| `catalog_list` | **254px** | rows: name, price, stock |
| `doc_table_full` | **933px** | 10 line columns |
| `doc_table_std` | **693px** | 7 line columns |
| `doc_table_lean` | **561px** | 5 line columns |
| `doc_table_card` | **305px** | one card per line |
| `doc_summary_full` | **384px** | resident summary panel |
| `doc_summary_min` | **249px** | narrow summary panel |
| `doc_header_2col` | **584px** | two field columns |

`cart_line_full` = name 132 + qty stepper 96 + rate 75 + total 130 +
delete 36 + gaps 48 + padding 40. That is the arithmetic; there is no
judgement in it.

### The residency ladder

A card that cannot get wider gets **taller** and relays its inside. A pane cannot
do that — a terminal has no vertical slack. So a pane **demotes** instead:

| Residency | What it means |
|---|---|
| `resident` | a column, always visible |
| `stacked` | a full-width band — spends height instead of width |
| `sheet` | a slide-over, one control away, keeps its state |
| `tab` | one of N tabs sharing the whole area |
| `route` | its own screen, reached by navigation and returned from |

`route` exists because some panes are not a simultaneous *view*, they are a
*step*. A restaurant server on a phone does not want the floor plan and the order
side by side — they pick a table, then they take the order. Squeezing both onto a
360×560 screen is the wrong answer to the right question.

**The rank-1 residency rule.** A rank-1 pane may be `resident` or `stacked`
freely. It may be `sheet` or `route` only if the variant lists it in a declared
`sequence` — an explicit, ordered set of steps with a guaranteed return path. It
may **never** be `tab`: a tab implies peers you switch between at will, and a
rank-1 pane must have a guaranteed moment, not a competed-for one.

### Columns or bands is an aspect question

Splitting a terminal into columns costs nothing vertically and stacking costs a
lot. Whether columns are right is therefore not a width question:

- a **768×950 portrait** iPad wants **bands** — there is height to spend and no
  width to spare;
- a **1024×695 landscape** iPad wants **columns** — exactly the reverse.

The choice is computed once per composition, not scored per width, so the only
shape change a user ever sees on a terminal is the portrait/landscape one — the
same change a phone makes when it is rotated.

### Rank governs allocation, not just demotion

v1.0's approach — split width by weight, let each pane relay into whatever it
got — breaks the moment a rank-2 pane exists. On a 1024 iPad the catalog would
take 291px and push the cart down to its **minimal** fit, while the same cart on
an 820px iPad — a *smaller* screen — got its **relay** fit, because there the
catalog had not fitted at all. A bigger screen made the primary surface worse.

So the waterfall is rank-ordered:

1. every resident pane reserves its **leanest** floor, in rank order;
2. panes are upgraded one fit-step at a time, **all of rank 1 before any of
   rank 2**, and within a rank by weight — and a *presence-holder* never buys
   itself a richer fit while a *fit-holder* is still short of its next step;
3. whatever is left is shared by weight, respecting caps.

### Fixed-information panes cap

The law says a wider screen shows **more**, not **bigger** — and that applies to
panes exactly as it applies to cards. A cart shows the same five columns however
wide it is, so past a point extra width is pure margin. A catalog genuinely shows
more items, so it absorbs the surplus.

| Pane | Cap | Derivation |
|---|---|---|
| cart | 805px | its floor with the item column grown from a 12-char truncation to a full 40-char product name |
| tender | 551px | its floor plus a 4×40 numeric keypad |
| summary | 544px | its floor plus a label column |
| catalog · floor · lines | none | these show more when given more — they absorb |

### What defends what

A pane declares what it protects when width runs short:

- **`hold: fit`** — the *layout* is the information. A 10-column line table beats
  a present-but-stacked-cards line table. Give up residency to keep the fit.
  *(lines, summary, cart, tender)*
- **`hold: residency`** — *presence* is the information. A catalog you can see
  beats a richer catalog you have to open a sheet for. Give up the fit to stay on
  screen. *(catalog, floor plan)*

Without this distinction one global rule has to serve both, and it cannot:
scoring residency first drops a document's line table to stacked cards at 615px,
and scoring fit first deletes the catalog from the Column variant — the one thing
that variant exists for.

### The vertical pass

`hold: residency` defends a pane on the horizontal axis, where losing only means
"you have to open a sheet". The vertical axis has no such mercy: **a cart showing
fewer than three lines is not a cart, it is a receipt preview.** So the height
floor *overrides* the horizontal choice — stacked panes are demoted, most
droppable first, until the cart clears `cart_min_h = 244px`.

This is the only place in the law where one axis overrules the other, and it is why the Column variant quietly becomes the Counter variant on a 360×560 phone instead of showing a one-line cart.

### The catalog band is asymmetric

The **first** row of tiles is worth squeezing the cart to its floor (3 lines) for
— without it there is no touch picker at all. The **second** row is a
convenience, so it may only take height the cart does not need to reach a
comfortable 5 lines.

---

### The composer — the register is composed, not chosen

v2.0's first pass shipped six fixed terminals and let the user pick one. That was
the wrong shape, and the review said why: *"let the user decide how their POS
should look like. If they want the catalogue, they can have it. If they do not
want it, it is 50/50, it is 60/40, 70/30, however they want it."*

So the six survive as **starting points** and every knob behind them is exposed.
A composition is:

```
{ catalog: { mode, size, rows, tiles }, split: { cart, tender }, tender, floor }
```

The fractions are the user's; the **floors are the law's**. Fractions normalise
to ≤ 1 and are then clamped by the measured floor of every pane, so a pane's
pixels can only ever grow with the viewport — monotonicity stops being something
the sweep has to prove and becomes something the arithmetic cannot violate.

**Nobody in the category ships this.** Toast exposes the menu grid's rows ×
columns per device, Lightspeed lets a tile span 1 to 30 spaces, Loyverse has a
grid/list toggle, and Shopify and Square let you edit tile *contents* only. The
one product with free pane geometry is Dynamics 365 Commerce, where layouts are
authored per-resolution in an admin tool and exported as XML — not dragged at the
register.

#### The catalog is a resident column only above 1182px

Derived, not chosen: a catalog column needs
`catalog_list 254 + cart_line_full 559 + tender_min 201 + 2 gutters`
= **1062px of content**, which arrives at a
**1182px viewport**. Below that the catalog is one
button, full screen, with a live in-cart count on every tile — which is what
every shipping product does below ~768px anyway. Odoo mounts exactly one pane
below 767px (`pos.mobile_pane`); Dynamics abandons drag-and-drop entirely below
1024×768.

#### The dock is a layout row

A trigger floated over a pane can cover it, and in the first pass one did — the
Counter variant's *Browse catalog* button sat on top of the payment panel. So a
dock is **a real row whose height is subtracted before anything vertical is
measured**. It cannot overlap anything by construction, and the sweep asserts
`dock_h > 0` wherever a dock exists.

#### Pinned actions

A pane pins its actions and scrolls only its body — `.pane-h` / `.pane-b` /
`.pane-f` — so *Complete*, *Hold* and *Drawer* can never be pushed below the
fold. That is the direct fix for the Scan register's money detail being
unreachable on a short screen.

### The seven starting points

| Preset | Composition | For |
|---|---|---|
| **Scan** — *No catalog. Scanner and keyboard only.* | catalog `off` · cart `62%` · tender `38%` (column) | Large inventory (>2,000 SKUs), barcode-driven. Pharmacy, hardware, grocery, distribution. |
| **Column** — *A narrow catalog column, and a big cart.* | catalog `left` 20% · cart `50%` · tender `30%` (column) | Mixed inventory (200-2,000 SKUs) where staff both scan and browse. General retail. |
| **Row** — *A tile strip on top, cart underneath.* | catalog `top` · cart `70%` · tender `30%` (column) | Small inventory (<200 SKUs), fast repeat items. Cafe, bakery, kiosk, pharmacy counter. |
| **Grid** — *Catalog and cart share the screen 40 / 60.* | catalog `left` 40% · cart `60%` · tender `0%` (sheet) | Visual products, walk-up counters, staff who point rather than type. Cafe, QSR, boutique. |
| **Stack** — *Catalog above, cart below, pay takes the screen.* | catalog `top` 40% · cart `100%` · tender `0%` (sheet) | Wide-but-short screens, and anyone who prefers to look down rather than across. |
| **Counter** — *One column. Cart first, everything docked.* | catalog `overlay` · cart `100%` · tender `0%` (bar) | Phone and small tablet, market stalls, delivery riders, single-hand use. |
| **Table** — *Floor plan, then order.* | catalog `top` · cart `70%` · tender `30%` (column) · floor `overlay` | Restaurants, cafes with table service, salons, any seat or slot business. |

### What the composer exposes

| Control | Choices | What clamps it |
|---|---|---|
| **Catalog** | `off` · `left` · `right` · `top` · `bottom` · `overlay` | off = scanner only. left/right = a column. top/bottom = a tile strip. overlay = one button, full screen. |
| **Catalog share** | `0.12`–`0.55` | Of the width for a column, of the height for a strip. Clamped to the catalog's measured floor. |
| **Strip rows** | `1` · `2` · `3` | Only for a top or bottom strip. Rows the height cannot pay for are not offered. |
| **Tiles per row** | `1`–`8` | The industry's real density control -- Toast ships rows x columns per device, default 8 x 5. |
| **Cart share** | `0.3`–`1.0` | Clamped so the cart never drops below its own floor. |
| **Tender share** | `0.0`–`0.45` | 0 turns the tender into a sheet behind Take payment. |
| **Tender** | `column` · `bar` · `sheet` | column = always visible. bar = a docked total + Pay. sheet = full screen on demand. |
| **Floor plan** | `off` · `left` · `overlay` | Restaurants only. A column on a wide screen, a step on a narrow one. |

### The capability register — the no-loss proof

Everything read out of `Pos.jsx` (3,743 lines) and its children. Nothing is dropped; each is placed.

**Rank 1 · Act**

| Capability | Lives | Note | In the code |
|---|---|---|---|
| **Scan / search item** | Working surface — always visible | barcode-first: exact SKU or barcode wins before fuzzy search | `Pos.jsx:799` |
| **Cart lines** | Working surface — always visible | — | `Pos.jsx:2440` |
| **Quantity + / -** | On every cart line | visible on every line, not behind selection -- but it belongs to the cart-lines object and costs one unit of attention, not one per line | `Pos.jsx:875` |
| **Remove line** | Revealed by selecting a line | — | `Pos.jsx:2572` |
| **Running total** | Working surface — always visible | formatToFit; exact value on hover | `Pos.jsx:938` |
| **Customer / walk-in** | Working surface — always visible | selecting a party with default_discount auto-applies it and says so | `Pos.jsx:2638` |
| **Amount tendered + change** | Working surface — always visible | — | `Pos.jsx:2908` |
| **Complete sale** | Working surface — always visible | — | `Pos.jsx:3010` |
| **Hold / park** | Working surface — always visible | — | `Pos.jsx:3031` |
| **Cart rescue after a crash** | No UI — automatic | — | `Pos.jsx:555` |
| **Offline queue + auto sync** | No UI — automatic | — | `Hooks/useOfflineSync.js` |
| **Idempotency key** | No UI — automatic | — | `SaleController` |
| **Wholesale price banding** | No UI — automatic | — | `Utils/settings.js` |
| **Auto-manufacture from recipe** | No UI — automatic | — | `Pos.jsx:2287` |
| **Multi-tab session persistence** | No UI — automatic | — | `Contexts/WorkspaceContext.jsx` |

**Rank 2 · Adjust**

| Capability | Lives | Note | In the code |
|---|---|---|---|
| **Line discount (amount or %)** | Revealed by selecting a line | — | `Pos.jsx:3454` |
| **Price override** | Revealed by selecting a line | — | `Pos.jsx:3599` |
| **Free / bonus quantity** | Revealed by selecting a line | was a global column toggle; now a per-line control on the line that needs it | `Pos.jsx:2534` |
| **Price / qty / total back-solve** | Revealed by selecting a line | merged with line discount into ONE line editor -- the old pair of near-identical modals was a top overwhelm complaint | `Pos.jsx:3563` |
| **Variant picker** | Sheet — one control away | — | `Pos.jsx:3102` |
| **Document discount** | Revealed by its own field | presets are long-pressable | `Pos.jsx:3180` |
| **Split tender** | Revealed by its own field | cash / bank / card / UPI / credit; UPI existed only here, now everywhere | `Pos/PaymentModal.jsx` |
| **Payment method** | Revealed by its own field | — | `Pos.jsx:2690` |
| **Deposit-to account** | Revealed by its own field | — | `Pos.jsx:2739` |
| **Tax inclusive / exclusive** | Revealed by its own field | — | `Pos.jsx:2809` |
| **Tax rate** | Revealed by its own field | from settings.tax_rates | `Pos.jsx:2821` |
| **Local stock / dropship** | Revealed by its own field | — | `Pos.jsx:2867` |
| **Location** | Revealed by its own field | FIXED: warehouses were passed to the screen and had no UI at all -- a multi-branch store could not choose | `Pos.jsx:190` |
| **Parked sales** | Sheet — one control away | — | `Pos.jsx:2088` |
| **Recent invoices + reprint** | Sheet — one control away | — | `Pos.jsx:2019` |
| **Return mode** | Terminal bar | three policies: reference / customer-or-reference / open | `Pos.jsx:1971` |
| **Load sale for return** | Sheet — one control away | — | `Pos.jsx:1785` |
| **Create product inline** | Sheet — one control away | opened the full 1,768-line six-tab editor; now a 5-field sheet with Full editor behind a link | `Pos.jsx:3418` |
| **Create / edit customer inline** | Sheet — one control away | — | `Pos.jsx:3405` |
| **Create bank account inline** | Sheet — one control away | — | `Pos.jsx:3305` |
| **Overpayment: change or ledger** | Sheet — one control away | — | `Pos.jsx:3430` |
| **Offline sync hub** | Sheet — one control away | per-sale retry, error, recall, delete | `Pos.jsx:3646` |
| **Multiple sales open at once** | Terminal bar | — | `Pos.jsx:1933` |
| **Bill breakup** | Revealed by its own field | was Ctrl+F only; now a tap on the total | `Pos.jsx:1499` |
| **Sale remarks** | Revealed by its own field | FIXED: F12 collected remarks and the main checkout path threw them away | `Pos.jsx:1484` |
| **Additional charges** | Revealed by its own field | FIXED: F8 stored a charge that no total ever read | `Pos.jsx:1460` |
| **Keyboard map** | Sheet — one control away | the full map, not the 10 the old strip advertised | `Pos.jsx:3052` |
| **Reprint last receipt** | Sheet — one control away | — | `Pos.jsx:2050` |
| **Open cash drawer** | Working surface — always visible | ADDED: AMDStation.openDrawer() and thermal_open_drawer both existed with no button anywhere | `Utils/AMDStation.js` |
| **Leave the register** | Terminal bar | Rehan asked for this explicitly: with the nav hidden there must still be a way back | `Pos.jsx:584` |

**Rank 3 · Configure**

| Capability | Lives | Note | In the code |
|---|---|---|---|
| **Large text mode** | Settings drawer | — | `Pos.jsx:1954` |
| **Auto-print on complete** | Settings drawer | — | `Pos.jsx:2952` |
| **Interface scale** | Settings drawer | — | `OneGlanceLayout.jsx:836` |
| **POS layout variant** | Settings drawer | the six terminals; per user, per device | — |
| **Catalog placement** | Settings drawer | column / row / dominant / sheet / none | — |
| **Default tax rate** | Settings drawer | — | `settings.default_tax_rate` |
| **Return policy** | Settings drawer | — | `settings.pos_return_mode` |
| **Allow overselling** | Settings drawer | — | `settings.stop_sale_negative_stock` |
| **Round off totals** | Settings drawer | — | `settings.round_off_total` |
| **Discount presets** | Settings drawer | — | `localStorage pos_discount_presets` |
| **Auto-fill exact cash** | Settings drawer | — | `settings.pos_auto_fill_cash` |
| **Show margin** | Settings drawer | — | `settings.show_margin_percentage` |
| **Online / offline** | Terminal bar | read-out. shape must differ from a toggle | `Pos.jsx:2068` |
| **Printer / drawer status** | Terminal bar | read-out | `Pos.jsx:2074` |
| **Queued offline sales** | Terminal bar | read-out, opens the sync hub | `Pos.jsx:2081` |

### Fourteen live defects the inventory found

These are in the shipped POS today. A redesign that mirrors the current screen inherits every one.

| What it does today | What the law does |
|---|---|
| Any server error -- including a 422 validation error or a plan-limit rejection -- was caught and queued as an 'offline sale'. | **Only a genuine network failure queues. A 4xx surfaces as a validation error on the field that caused it.** |
| F8 additional charges were stored on the session and never added to any total. | **Charges are a document field and part of the total, on every screen.** |
| F9 bill discount wrote `discount`, which the total formula never read because `discountValue` was always defined. | **One discount value, one formula.** |
| F12 remarks reached the server only on Ctrl+S/P/N; the normal Complete path sent notes:''. | **Notes are a resident field with one payload path.** |
| item.key_price was read in the subtotal and never written anywhere. | **Removed.** |
| The reserved-stock backorder confirm used `if (!window.confirm(...))` against a Promise-returning override, so it never blocked anything. | **Awaited confirm; the sale genuinely pauses.** |
| Margin display required item.cost_price, which was never set on cart items. | **cost_price travels with the line; margin is a rank-2 peek.** |
| pos_return_window and pos_return_window_behavior were parsed and discarded. | **Both enforced by the return policy.** |
| F6 (change unit) and F10 (loyalty) advertised behaviour that only emitted a 'coming soon' toast. | **Either implemented or absent from the map. Never advertised and dead.** |
| Cancel wiped the cart with no confirmation and no undo. | **Cancel is undoable for 10 seconds; no dialog, no loss.** |
| The global keydown handler had no 'am I typing?' guard, so F-keys fired from inside modal inputs. | **The keymap is scoped to the surface and suspended inside a field or sheet.** |
| Sale tabs were labelled with a raw Date.now() millisecond timestamp. | **Tabs carry the document number, or the party name until one exists.** |
| pos.void_item and pos.refund were defined in config/permissions.php and checked nowhere -- any cashier could run a return or delete a line. | **Both enforced at the control.** |
| AMDStation.openDrawer() and the thermal_open_drawer setting both existed with no button anywhere in the UI. | **Open drawer is a rank-2 control on the surface.** |

### One keymap for the whole product

The full F-key map exists only in `Pos.jsx`, while `KeyboardShortcutsModal.jsx` advertises it to every user — and none of the thirteen document screens implements any of it. It becomes the shared keymap, and it is **scoped**: keys are suspended while the caret is in a field, which today's handler does not do.

| Key | Action | Where |
|---|---|---|
| `F1` | Focus scan / search | terminal document |
| `F2` | Quantity on the active line | terminal document |
| `F3` | Discount on the active line | terminal document |
| `F4` | Remove the active line | terminal document |
| `F5` | Rate on the active line | terminal document |
| `F6` | Unit on the active line | document |
| `F7` | Document tax | terminal document |
| `F8` | Additional charges | terminal document |
| `F9` | Document discount | terminal document |
| `F11` | Party | terminal document |
| `F12` | Notes | terminal document |
| `Ctrl+S` | Save | terminal document |
| `Ctrl+P` | Save and print | terminal document |
| `Ctrl+N` | Save and start a new one | terminal document |
| `Ctrl+D` | New party | terminal document |
| `Ctrl+T` | New tab | terminal document |
| `Ctrl+W` | Close tab | terminal document |
| `Ctrl+Tab` | Next tab | terminal document |
| `Ctrl+F` | Breakdown | terminal document |
| `Ctrl+K` | Command palette | everywhere |
| `Ctrl+1..9` | Select line n | terminal document |
| `Alt+Z` | Fullscreen | terminal |
| `Esc` | Close the top layer | everywhere |
| `?` | Show this map | everywhere |

---

## 11. The document

Eight of the thirteen document screens are the same file copy-pasted — same
imports, same `patchInvoice`, same drag-reorder, same scan modal, same profit
peek — with the labels swapped and a handful of fields silently dropped from the
payload. That is *why* `Terms` is decorative on every one of them, why a
quotation has no `Valid until`, and why a debit note never restores stock: a fix
applied to the sales invoice never reached the other seven.

**A type is not a screen. It is a configuration** — a set of capability switches
and label overrides on one editor.

### Three zones

| Zone | Defends | Fits |
|---|---|---|
| **Header** | fit | `2col` ≥584px · `1col` ≥300px |
| **Lines** | fit | `full` ≥933px · `std` ≥693px · `lean` ≥561px · `cards` ≥305px |
| **Summary** | fit | `panel` ≥384px · `tight` ≥249px |

### The document is composed too

The register stopped being a menu of six layouts; the document editor stopped
being one arrangement with breakpoints. A composition is:

```
{ details, summary, pin, split, density }
```

- **details** `open` · `collapsed` — collapsed is one line (party, number, date,
  running total) and it is worth **five to ten more visible item rows** on a
  laptop. The screen prints the number so the trade is not a matter of taste.
- **summary** `auto` · `right` · `below` · `off`
- **pin** `auto` · `sticky` · `dock` · `none` — what happens to the summary when
  you scroll.
- **split** the summary's share, clamped by the measured floors of both zones and
  draggable at the divider.

#### Why the docked summary lands on Pro — a derived sentence

Holding a panel still while the page scrolls past only works if the whole panel
fits on screen; a sticky element taller than its viewport still scrolls, it just
scrolls late. And **the summary's height is its density** — the density list is
literally the list of summary rows. So:

```
pin = sticky   while   summary_h + actions_h <= usable_h
pin = dock     otherwise
```

| Density | Summary rows | Column height | Sticks on a 1280×570 laptop? |
|---|---|---|---|
| **Simple** | 3 | **235px** | yes — it holds still |
| **Standard** | 7 | **379px** | yes — it holds still |
| **Pro** | 10 | **487px** | **no — it docks bottom-right** (398px of room) |

Pro is the first density that stops fitting, and the law names it without
being told to.

#### The dock is a row, not a float

The Counter register had a browse button floating over the payment panel. A
summary card floated into the bottom-right corner is the same defect: it covers
the last line of the table and no amount of scrolling reveals it. So the dock's
height — **60px** — is a real row at the bottom of the scroller,
reserved before anything is measured. It is anchored right so the left of the
last row stays visible, and the space it occupies belongs to it. Verified in a
real browser: at every preset and every device, scrolled to the very bottom, the
dock and the last line do not intersect.

#### The nav now knows what you composed

Section 4 derived `expanded_min = 1708`
for a document from the **default** zone weights. Widen the summary and that
arithmetic changes — and the sweep caught it: at 1708 a Pro ledger with a 32%
summary lost its tenth line column the moment the nav expanded. Buying a bigger
screen made the invoice worse again, one composition further along.

So the No-Regression Rule moved from derivation time to **run time**. The nav
holds the rail wherever expanding it would cost *this* composition a fit.

#### A summary column may cost line columns; it may not cost the table

`auto` keeps the summary resident while the lines still clear
`doc_table_lean` = 561px — a summary panel is worth more
than the 8th, 9th and 10th line column, and less than the table itself. An
explicit `right` keeps it wherever it is physically possible
(≥ 305px) and the readout says what it cost.

### Six starting points

| Preset | Composition | For |
|---|---|---|
| **Side panel** | details `open` · summary `auto` · pin `auto` · `30%` · `standard` | the default — details open, summary resident on the right at 30% |
| **Wide lines** | details `collapsed` · summary `auto` · pin `auto` · `26%` · `standard` | your own suggestion: collapse the customer block and give the items the width |
| **Focus** | details `collapsed` · summary `off` · pin `dock` · `30%` · `standard` | nothing but the line table; the money lives in the dock |
| **Stacked** | details `open` · summary `below` · pin `dock` · `30%` · `standard` | summary under the last line, dock carries Total and Complete |
| **Pro ledger** | details `open` · summary `auto` · pin `auto` · `32%` · `pro` | ten line columns, twelve header fields, the full summary — and the docked total |
| **Touch** | details `collapsed` · summary `off` · pin `dock` · `30%` · `simple` | a phone or a warehouse tablet: cards, one action, nothing else |

### Three densities

Density is a preference — an accountant wants ten line columns, a cashier wants five — but it is a preference the width has to be able to honour. Below the floor the law **caps** the density rather than letting the user pick something that will silently mangle the screen.

| Density | For | Header fields | Line columns |
|---|---|---|---|
| **Simple** | first-time users, cashiers, single-product shops | party · date | item · qty · rate · total · del |
| **Standard** | the default for every type | party · docno · date · terms · due · method · account | idx · item · qty · rate · disc · total · del |
| **Pro** | accountants, wholesalers, multi-warehouse, tax-heavy | party · docno · partyref · date · due · terms · method · account · location · project · currency · fx | idx · item · qty · free · uom · rate · disc · tax · total · del |

### What the width decides

| Viewport | Nav | Content | Header | Line table | Max density | Summary |
|---|---|---|---|---|---|---|
| `360` | hidden | 328px | 1col | cards @ 328px | **simple** | stacked |
| `390` | hidden | 358px | 1col | cards @ 358px | **simple** | stacked |
| `414` | hidden | 382px | 1col | cards @ 382px | **simple** | stacked |
| `600` | hidden | 568px | 1col | lean @ 568px | **simple** | stacked |
| `768` | hidden | 720px | 2col | std @ 720px | **standard** | stacked |
| `820` | hidden | 772px | 2col | std @ 772px | **standard** | stacked |
| `1024` | rail | 976px | 2col | full @ 976px | **pro** | stacked |
| `1180` | rail | 1060px | 2col | full @ 1060px | **pro** | stacked |
| `1216` | rail | 1096px | 2col | full @ 1096px | **pro** | stacked |
| `1248` | rail | 1128px | 2col | full @ 1128px | **pro** | stacked |
| `1265` | rail | 1145px | 2col | full @ 1145px | **pro** | stacked |
| `1280` | rail | 1160px | 2col | full @ 1160px | **pro** | stacked |
| `1351` | rail | 1231px | 2col | full @ 1231px | **pro** | stacked |
| `1425` | rail | 1305px | 2col | full @ 1305px | **pro** | stacked |
| `1440` | rail | 1320px | 2col | full @ 1320px | **pro** | stacked |
| `1521` | rail | 1401px | 2col | full @ 976px | **pro** | resident |
| `1585` | rail | 1465px | 2col | full @ 1022px | **pro** | resident |
| `1708` | expanded | 1396px | 2col | full @ 973px | **pro** | resident |
| `1905` | expanded | 1593px | 2col | full @ 1114px | **pro** | resident |
| `2545` | expanded | 2233px | 2col | full @ 1665px | **pro** | resident |
| `3425` | expanded | 3113px | 2col | full @ 2545px | **pro** | resident |

Note the row at **1708**. That is where a document surface finally lets the nav
expand — the first width at which a 264px sidebar still leaves room for the
10-column table *and* the summary panel.

When the summary cannot be a resident column it becomes a **sticky action bar**,
not the same panel pinned to the bottom — a 438px bar on a 570px laptop leaves
nothing for the document it is summarising. Collapsed it is the total, the
balance and the primary action; the breakdown is one tap.

### The thirteen types

| Type | Prefix | Side | Default density | Party is called | Save says |
|---|---|---|---|---|---|
| **Sales invoice** | `INV` | sell | standard | Customer | Complete sale |
| **Purchase invoice** | `BILL` | buy | pro | Supplier | Post purchase |
| **Quotation** | `QT` | sell | standard | Customer | Save quote |
| **Sales order** | `SO` | sell | standard | Customer | Confirm order |
| **Purchase order** | `PO` | buy | standard | Supplier | Place order |
| **Sale return** | `SRET` | sell | standard | Customer | Confirm return |
| **Purchase return** | `PRET` | buy | standard | Supplier | Confirm return |
| **Debit note** | `DN` | buy | standard | Supplier | Create debit note |
| **Goods receipt** | `GRN` | buy | standard | Supplier | Receive goods |
| **Expense** | `EXP` | buy | simple | Payee | Save record |
| **Stock transfer** | `TRF` | stock | simple | — | Create transfer |
| **Stock audit** | `AUD` | stock | simple | — | Save audit |
| **Recurring invoice** | `REC` | sell | standard | Customer | Save template |

### The capability matrix

Rows are every distinct capability found across all thirteen screens. This is the definition of what the unified editor must support — and the answer to *will we lose something*: if a cell is filled today, it is filled here.

| Capability | INV | BILL | QT | SO | PO | SRET | PRET | DN | GRN | EXP | TRF | AUD | REC |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| line-item table | ● | ● | ● | ● | ● | ● | ● | ● | · | · | · | · | ● |
| document has no line items | · | · | · | · | · | · | · | · | · | ● | · | · | · |
| party card shows balance and address | ● | · | · | · | · | · | · | · | · | · | · | · | · |
| free / bonus quantity column | ● | · | ● | ● | · | · | · | · | · | · | · | · | ● |
| create a party without leaving the document | ● | · | ● | · | · | · | · | · | · | · | · | · | · |
| create a product without leaving the document | ● | · | ● | · | · | · | · | · | · | · | · | · | · |
| barcode scan-to-add buffer | ● | · | · | · | · | · | · | · | · | · | · | · | · |
| single-row rapid add (Alt+Q) | ● | · | · | · | · | · | · | · | · | · | · | · | · |
| give change vs credit to ledger decision | ● | · | · | · | · | · | · | · | · | · | · | · | · |
| tax rate from settings.tax_rates, not free text | ● | · | · | · | · | · | · | · | · | · | · | · | · |
| round_off_total applied from settings | ● | · | · | · | · | ● | · | · | · | · | · | · | ● |
| explicit editable round-off | · | ● | · | · | · | · | · | · | · | · | · | · | · |
| save and print | ● | · | ● | ● | ● | ● | · | · | · | · | · | · | · |
| convert to another document type | · | · | ● | ● | · | · | · | · | · | · | · | · | · |
| no conversion target | ● | · | · | · | · | · | · | · | · | · | · | · | · |
| posted document becomes read-only | ● | · | · | · | · | · | · | · | · | · | · | · | · |
| multiple documents open at once | ● | · | · | · | · | · | · | · | · | · | · | · | · |
| freight/duty allocation block | · | ● | · | · | · | · | · | · | · | · | · | · | · |
| tax rate per line | · | ● | · | · | · | · | · | · | · | · | · | · | · |
| business vs personal cost split | · | ● | · | · | · | · | · | · | · | · | · | · | · |
| received now vs not yet received | · | ● | · | · | ● | · | · | · | · | · | · | · | · |
| warehouse / location picker | · | ● | · | ● | ● | ● | ● | ● | ● | · | · | ● | ● |
| notes textarea | · | ● | · | · | · | · | · | · | ● | · | ● | ● | · |
| zero unit cost acknowledgement | · | ● | · | · | · | · | · | · | · | · | · | · | · |
| cash-to-pay vs payable label flip | · | ● | · | · | · | · | · | · | · | · | · | · | · |
| offer expiry date | · | · | ● | · | · | · | · | · | · | · | · | · | · |
| draft / sent / accepted lifecycle | · | · | ● | · | · | · | · | · | · | · | ● | ● | · |
| reserve without deducting | · | · | · | ● | · | · | · | · | · | · | · | · | · |
| expected delivery date | · | · | · | ● | ● | · | · | · | · | · | · | · | · |
| prices include tax | · | · | · | · | ● | · | · | · | · | · | · | · | · |
| partial goods receipt | · | · | · | · | ● | · | · | · | · | · | · | · | · |
| linked to a parent document | · | · | · | · | · | ● | ● | · | ● | · | · | · | · |
| quantity capped by the parent document | · | · | · | · | · | ● | ● | · | ● | · | · | · | · |
| mandatory structured reason | · | · | · | · | · | ● | ● | ● | · | · | · | · | · |
| which account the refund moves through | · | · | · | · | · | ● | · | ● | · | · | · | · | · |
| choose a batch | · | · | · | · | · | · | ● | · | · | · | · | · | · |
| record a batch number | · | · | · | · | · | · | · | · | ● | · | · | · | · |
| record an expiry date | · | · | · | · | · | · | · | · | ● | · | · | · | · |
| ordered / received / remaining columns | · | · | · | · | · | · | · | · | ● | · | · | · | · |
| unit rate is editable | · | · | · | · | · | · | · | · | · | · | · | · | · |
| discount column | · | · | · | · | · | · | · | · | · | · | · | · | · |
| money summary panel | · | · | · | · | · | · | · | · | · | · | · | · | · |
| expense category | · | · | · | · | · | · | · | · | · | ● | · | · | · |
| file attachment | · | · | · | · | · | · | · | · | · | ● | · | · | · |
| tax as an amount, not a rate | · | · | · | · | · | · | · | · | · | ● | · | · | · |
| required description | · | · | · | · | · | · | · | · | · | ● | · | · | · |
| cash / bank settlement toggle | · | · | · | · | · | · | · | · | · | ● | · | · | · |
| source and destination location | · | · | · | · | · | · | · | · | · | · | ● | · | · |
| quantity only, no money | · | · | · | · | · | · | · | · | · | · | ● | · | · |
| expected / counted / difference columns | · | · | · | · | · | · | · | · | · | · | · | ● | · |
| billing frequency | · | · | · | · | · | · | · | · | · | · | · | · | ● |
| next run date | · | · | · | · | · | · | · | · | · | · | · | · | ● |
| active / paused | · | · | · | · | · | · | · | · | · | · | · | · | ● |
| manually editable document number | · | · | · | · | · | · | · | · | · | · | · | · | · |
| party picker | · | · | · | · | · | · | · | · | · | · | · | · | · |
| unit rate column | · | · | · | · | · | · | · | · | · | · | · | · | · |
| tax | · | · | · | · | · | · | · | · | · | · | · | · | · |

### Same field, different wording — collapse these

| Concept | Wordings found in the codebase | Neutral term |
|---|---|---|
| The other side of the transaction | `Customer`, `Supplier`, `Payee / Vendor`, `Search Party`, and a `customer` state mapped to `supplier_id` | **Party**, with a per-type display label |
| The document's own number | `Invoice #`, `Po #`, `Return Ref`, `Reference #`, `order_number`, `reference_number` | **Document no.**, per-type prefix |
| The counterparty's number | `Supplier Invoice #`, `Reference No.`, `Reference` | **Party reference** |
| Document date | `Date`, `Purchase Date`, `Transfer Date`, `Audit Date`, `Date of Expense`, `Return Date` | **Document date** |
| Header discount | `Invoice Discount`, `Return Discount`, `Header discount` | **Document discount** |
| Money already settled | `Amount Paid`, `Refund Amount`, `Refund Received` | **Amount settled**, per-type label |
| Outstanding remainder | `Balance Due`, `Net Credited` | **Balance** |
| Line unit money | `Price`, `Unit Cost`, `Batch Unit Cost` | **Unit rate** (*Price* sell-side, *Cost* buy-side) |
| Which warehouse | `Warehouse`, `From/To Warehouse`, implicit `Warehouse::first()` | **Location** |
| Payment channel | `CASH`/`CREDIT`, `CASH`/`BANK`, `Payment Method`, `refund_method` | **Settlement method** — one enum |
| Which ledger account | `Deposit To`, `Refund From`, `Bank Account` | **Money account** |
| Lifecycle state | `Status`, `Goods Status`, `ORDERED/RECEIVED`, `workflow_status` | **Workflow status** and **Payment status**, split |
| Save button | `COMPLETE SALE`, `COMPLETE ORDER`, `SAVE PROPOSAL`, `CONFIRM RETURN`, `Post Purchase`, … | **Save**, with the type and total on a secondary line |

### 17 gaps the inventory found

These exist *because* there are eight copies: a fix applied to the sales invoice never reached the other seven.

| Live defect in the shipped screens | What one editor does instead |
|---|---|
| Notes is in the payload of SI, QT, SO, SR and PO and in WorkspaceContext's default document, and NONE of the eight clone screens renders a textarea for it. | **A resident field on every type, in the one payload builder.** |
| The Net 7/15/30/60 select is never submitted on any screen; due_date is sent from a `dueDate` key that no input writes. | **Terms WRITES the due date. One control, not two, and the due date is editable.** |
| A quotation has no Valid Until input at all, though it is the defining field of a quote. The payload sends currentInvoice.dueDate, which is always null. | **Required on quotation, absent everywhere else.** |
| Purchase order requires warehouse_id server-side and renders no input; it silently falls back to warehouses[0]. | **Location is a resident field wherever the server needs one.** |
| Quotation collects tax, delivery, extra charges, amount paid, free quantity, date and reference in the UI and drops all seven from the payload. | **One payload builder for all thirteen types — a field that renders is a field that posts.** |
| Sales order sends notes, reference, header discount, tax and per-line discount, and SalesOrderController::store ignores every one. | **Same builder, same contract, verified against the V3 endpoints.** |
| Debit note never sends warehouse_id, so DebitNoteController::returnStock() never fires and returned stock is never restored. | **Location is resident, so the guard that skips the restock cannot be reached.** |
| Sale return hard-codes warehouse_id to Warehouse::first() and forces tax and discount to 0 server-side while the UI collects both. | **Location resident; collected totals are the posted totals.** |
| Only the sales invoice reads settings.tax_rates. Every other screen makes the user type a raw percentage. | **Every type reads the same tax source.** |
| Only sales invoice and recurring invoice apply roundTotal(), so the same cart totals differently per document type. | **Round-off is a document property, applied once.** |
| Free quantity reaches the database from 2 of 7 sell-side types. On the other five it inflates the on-screen subtotal and is then dropped. | **A capability with one implementation — on or off, never half.** |
| Every party picker except V3 Purchase uses type=all, so a purchase order will happily accept a customer. | **Party type is derived from the document's side.** |
| No email, WhatsApp, PDF, duplicate or record-payment action exists on any editor; email and WhatsApp live only on Sales/Show.jsx. | **All of them are document actions, available from the editor.** |
| The documented F-key map exists only in Pos.jsx. KeyboardShortcutsModal.jsx advertises it to every user and no document screen implements any of it. | **One scoped keymap, shared by the terminal and the document.** |
| No UoM, batch, serial, HSN, per-line warehouse or per-line note anywhere on the sell side, though Product carries all of them and V3 StoreSaleRequest already REQUIRES items.*.sale_uom. | **Pro density exposes them; the V3 endpoints can finally be reached from a screen.** |
| No currency, exchange rate, salesperson, project or cost centre on any of the thirteen screens — zero occurrences. | **Pro density carries them.** |
| Sales/CreatePreSale.jsx (2,427 lines) is a live but stale duplicate of SalesOrders/CreatePreSale.jsx, reachable at store.presales.create. | **One editor. There is nothing left to duplicate.** |

---

## 12. Edit mode

Edit mode changes what the user may CHANGE, never what the law ALLOWS. Every gesture is snapped to the law before it is committed, so a user cannot save a layout the law would reject.

| Gesture | Does | Snapped to |
|---|---|---|
| **move** | drag the card header | nearest column and row; reading order follows the DOM, never x/y |
| **resize** | drag the bottom-right corner | integer columns and rows, clamped to the category min and max fits |
| **add** | + in the band gutter | inserts at that index with the category default fit |
| **remove** | x on the card header | band re-flushes; no hole is ever left |
| **swap** | pick a different reading | category may change; span re-resolves through §6 |
| **resize_band** | drag the band divider | changes rows for every card in the band at once |

### Flow and Free — packing left is one of two answers

v2.0's packer flushed every band to the left and grew cards to eat the slack, so
a deliberate gap was impossible to author. That was a real limitation, not a
taste call — but it was solving a real problem: **a layout authored at 24 columns
must still be legal at 8, and at 4.** Flow solved it by never storing a position
at all. Free has to store one, so Free needs a projection.

Every mature editor ships both under some name: Gridstack's `float` versus
gravity; react-grid-layout v2's pluggable compaction with `noCompactor` ("free
positioning"); Grafana's **Auto grid** versus **Custom layout**. So it is a user
setting here too.

| Mode | Stores | Packs | Why it exists | Prior art |
|---|---|---|---|---|
| **Flow** | `{order, fit}` | bands, flushed left, no holes | nothing can be wrong because nothing is stored; the layout is re-derived at every width | Gridstack compact / RGL verticalCompactor / Grafana 'Auto grid' |
| **Free** | `{col,row,w,h} @ column class N` | exactly where you put it; gaps preserved; collisions push DOWN only | you asked for the right side to stay empty if you leave it empty | Gridstack float:true / RGL noCompactor / Grafana 'Custom layout' |

#### The projection

Between column classes, take Gridstack's `moveScale` — *"scale and move items by
the ratio of newColumnCount / oldColumnCount"*:

```
r = N'/N        w'   = clamp(round(w*r), 1, N')
                col' = clamp(round(col*r), 0, N' - w')
                row' = row
```

then resolve collisions **downward only**, in row-major order. Down-only is the
whole reason the right side stays empty if you left it empty. Two rules on top of
that are ours:

- **Always project from an authored class, never from a projection.**
  `round()` is lossy, so chaining 24→20→16→12 drifts — the complaint in
  react-grid-layout issue #1663, that a layout does not pop back when the window
  grows again. One hop, ever. A class is *authored* when the user edited in it;
  everything else is derived on arrival from the nearest authored class,
  preferring the nearest larger one. Returning to the class you authored in
  restores it exactly, and the cross-check asserts it.
- **The ratio does not know what is in the box.** A C3 metric scaled 24→8 lands
  one column wide, and one column holds no fit at all. So every projected box is
  clamped back into its category's own travel — the same travel the resize handle
  uses — before it settles.

Free placement exists at **6 columns and above**. At 4 the
leanest card the law can make is 2 columns, half the grid, so a "gap" there is
one card's worth of damage rather than composition — the line Dynamics 365
Commerce also draws, dropping drag-and-drop entirely below 1024×768. The boxes
are kept, sorted row-major into reading order, and restored the moment the grid
can carry them again.

### Where the resize handle stops

The handle's travel is the category's fit list read backwards. `resolveCard` asks
*"how wide must the box be for this fit"*; a resize handle asks *"what is the
best thing I can put in this box"*. Same ordered fits, same measured floors, so
the two readings cannot disagree — and the solver asserts it at every breakpoint.
The gesture is a real pointer drag on the south-east corner with a 20×20px hit
area (react-grid-layout's default), snapping to whole columns and rows, and it
**stops** rather than springing back.

The drop target is a **dotted outline plus a translucent fill at the snapped
destination** — RGL paints `.react-grid-placeholder`, Gridstack paints
`rgba(0,0,0,.1)` — and in Flow the placeholder is a real participant in the pack,
so the outline shows the slot including the reflow that landing there causes.
The dragged card follows the pointer; the ghost holds the cell.

### The splitter

*"Like in Windows"* — wherever the law offers expand and collapse, it offers a
divider. Where it stops is not a new rule, it is the No-Regression Rule made into
a hard stop:

```
navMax(vw) = vw - 2*margin(vw) - contentFloor(archetype)
```

On a dashboard the content floor is the same **92px × 8 = 904px**
that gives us 1216, so the handle physically cannot be dragged into breaking the
grid. Below the push threshold the nav overlays and costs the content nothing, so
there the stop is instead the widest sidebar the narrowest *pushing* screen can
carry — `1216 - 48 - 904 = 264`, the default, arrived at from the other side.

**264 was never a taste call.** At a 1920 viewport,
`1920 - 48 - 264 = 1608 = 12x112 + 11x24`. The default sidebar is exactly the
width that yields twelve columns at exactly the 112px
target — so the splitter is magnetic at every width with that property, for every
legal column count, and the readout names which one you are on.

| Splitter | Minimum | Maximum | Snaps to | Persists as |
|---|---|---|---|---|
| **shell.nav** — primary navigation | rail width at this viewport (0 while the nav overlays) | vw - 2*margin - 904, the No-Regression Rule made into a hard stop | rail, the 264 default, and every nav width that puts the content column at exactly 112px | `user_preferences.shell.nav.width` |
| **shell.subnav** — secondary sidebar (Settings, Reports, Console) | 0 -- it collapses to a select in the header | nav max, less the primary nav | the 224 default | `user_preferences.shell.subnav.width` |
| **pos.cart|tender|catalog** — register panes | the measured floor of the pane's leanest fit | whatever leaves every other pane above its own floor | the preset's own fractions | `user_preferences.shell.pos` |
| **doc.summary** — document summary column | DOC_SUM_MIN | whatever leaves the line table above its lean floor | the density default | `user_preferences.shell.doc` |

Keyboard is the WAI-ARIA APG **Window Splitter** pattern verbatim: `role=separator`, `aria-valuenow/min/max`, and:

| Key | Does |
|---|---|
| `ArrowLeft/ArrowRight` | nudge 8px |
| `Enter` | toggle collapse / restore |
| `Home` | minimise the primary pane |
| `End` | maximise the primary pane |
| `Escape` | cancel the drag, restore the width it started at |

Double-click restores the archetype default. A splitter stops where the No-Regression Rule says the region beside it would lose a fit. It never lets go of an illegal width and snaps back -- it simply does not travel there.

### Invariants

- A card can never be dragged below its category floor -- the resize handle stops.
- A card can never exceed its category max -- the resize handle stops.
- A band contains only cards of equal row-span, so no hole can be created by a move.
- Reading order is the DOM order on every screen; moving a card on a 24-column screen changes its order on a 4-column phone identically.
- A layout authored at any width is legal at every width, because spans are stored as AUTHORED FITS, never as pixels or as x/y.
- Undo is a stack of layout snapshots, not of gestures.

### Where it is stored

`user_preferences`, key `shell`.

already exists (2026_08_08_000001), already does store-specific-then-account-wide fallback in one query via UserPreference::resolve(), and deliberately avoids the HasTenant global scope so null-tenant rows stay readable

surface layouts stay in layout_preferences (already migrated, already has a `surface` column for exactly this); user_preferences.shell holds only chrome choices. Two stores, two jobs, no overlap.

```json
{
  "nav": {
    "desktop": "expanded|rail",
    "tablet": "rail|hidden",
    "intent": "expanded",
    "note": "intent is what the user last chose on a wide screen; it is restored when the window grows back"
  },
  "density": "simple|standard|pro",
  "pos_variant": "scan|column|row|grid|counter|table",
  "pos_catalog": "column|row|dominant|sheet|none",
  "dashboards": {
    "<surface>": [
      {
        "card": "id",
        "cat": "C3",
        "fit": "standard",
        "order": 0
      }
    ]
  }
}
```

### The Reckoner contract

Reckoner emits a card DESCRIPTOR, never a layout. {reading, category, fit?, period?, chart?}. The engine turns descriptors into geometry. That separation is why an AI-authored dashboard cannot produce an illegal layout.

validate() runs on every descriptor list before render. An illegal layout is rejected, not warned about.

---

## 13. Underflow

The continuous sweep found the one width where the law genuinely runs out. At a
320px viewport the content region is 288px, and the leanest fits of **Board (C5)**
and **Canvas (C6)** both need 295px. Seven pixels.

Pretending otherwise would be the dishonest fix, so the law says two things
instead:

- **`min_viewport = 360`** — the designed minimum. Every guarantee in this
  document holds from 360px up. 360 is the Android baseline and the narrowest
  width in the breakpoint table, so this is a statement of what was designed for,
  not a retreat from it.
- **Underflow** — below 360 the card does not break, it **scrolls**. It keeps its
  leanest fit's floor as a `min-width` and scrolls horizontally inside its own
  border. Content stays reachable, the grid is intact, and the *page* still never
  scrolls sideways — only the one card that could not fit does.

295px is what a legible chart with an axis actually needs. Lowering it to 288 to make a table go green would move the failure from the validator into the user's screen.

---

## 14. Verification

- JS engine vs. the independent Python solver: **35,255 checks, 0 disagreements**
  across every terminal preset × viewport, every document preset × viewport, every
  nav row, every category × breakpoint, the resize handle's travel for all six
  categories, the placement projection through every column class, the splitter's
  travel and snaps at every width, and continuous 320–3440 sweeps of all of it.
- **Fit-monotonicity sweep** — every integer width 320→3440: no card, no document
  zone and no POS pane ever comes out of an `avail` dip poorer than it went in.
  This is the test that licenses the 1280 expanded step and the one that refused
  it for documents.
- **Vertical budget** — every POS variant at every representative viewport keeps
  the cart at three lines or more.
- **Rank budget** — 7 rank-1 controls on the surface, 0 rank-3.
- **Rendered DOM** measured in a real browser at 1905 / 1265 / 768 / 390: card
  heights land exactly on 64 / 152 / 328 / 504 / 680.

Run `python3 law_v2.py` to re-solve and re-validate; run `node _crosscheck.mjs`
to re-check the engine against the solver.

---

## 15. How to change a number

Numbers live in **one** place. To change one:

```
edit law_v2.py                  # the solver, and the only place a constant is authored
python3 law_v2.py               # re-solves, re-validates, rewrites layout-law.json
python3 build_engine.py         # regenerates the JS engine
python3 build_css.py            # regenerates the CSS
python3 build_rulebook.py       # regenerates this document
python3 build_pages.py          # regenerates the proofs
cd out && node _crosscheck.mjs  # asserts the engine and the solver still agree
```

Never hand-edit a number in the `.md`, the `.css`, the `.js` or the design-system
HTML. They are all generated, and a hand edit is a number that will silently
disagree with the engine — which is precisely the class of bug this whole
document exists to make impossible.
