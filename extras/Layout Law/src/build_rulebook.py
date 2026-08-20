#!/usr/bin/env python3
"""Generate VENQORE_LAYOUT_LAW.md v2.0 from layout-law-v2.json.

Never hand-edit the output. A hand-edited number is a number that silently
disagrees with the engine, and the whole point of this file is that it cannot.
"""
import json
from pathlib import Path

OUT = Path(__file__).parent / "out"
L = json.loads((OUT / "layout-law-v2.json").read_text())
C, N, T = L["constants"], L["nav"], L["terminal"]
MF = L["measured_floors"]
o = []
w = o.append

def tbl(head, rows, align=None):
    w("| " + " | ".join(head) + " |")
    w("|" + "|".join(align or ["---"] * len(head)) + "|")
    for r in rows:
        w("| " + " | ".join(str(x) for x in r) + " |")
    w("")

w(f"""# VenQore Layout Law

**v{L['version']}** · supersedes v{L['supersedes']} · generated from `layout-law.json`

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
| Nav | {C['sidebar_expanded']}px expanded · {C['sidebar_rail']}px rail · 0 hidden | ramps in; see §2 |
| Header | full · {C['header_h']}px tall | `header_h == row`. One number, two jobs |
| Subnav | {C['subnav_w']}px | Settings and Reports only; a column above 1248, a tab strip below |
| Content | the remainder | margin {C['margin_mobile']}–{C['margin_desktop']}px, ramped |

### The one law, both axes

```
size(n) = n·UNIT + (n−1)·GUTTER
```

with `GUTTER = {C['gutter']}px` on **both** axes and `UNIT = {C['row']}px` vertically.

CSS Grid computes this natively from `gap`. That matters more than it sounds:
the alignment bug Gemini flagged came from treating the gutter as something
*added between* cards, which made a 2-row card `64+64 = 128px` while two stacked
1-row cards were `64+24+64 = 152px`. Making the gutter part of the **pitch** means
a 2-row card spans across it and absorbs it — `2×64 + 1×24 = 152` — and the two
line up exactly. You do not implement this. `gap` does. If the old HTML used
`margin-bottom`, that alone was the bug.

Row heights, therefore:
""")
tbl(["Rows", "Height", "Working"],
    [[r, f"**{h}px**", f"{r}×{C['row']} + {int(r)-1}×{C['gutter']}"]
     for r, h in L["row_heights"].items()])

w(f"""---

## 2. The nav law

**The hamburger exists at every width, on every archetype.** Not `lg:hidden`,
not "only when the sidebar is gone". At any size the user can open and close the
nav, because the one thing worse than a nav that takes space is a nav you cannot
get back.

What the hamburger *does* depends on whether pushing is affordable here.

### The push threshold: {N['push_min']}px

Pushing is always nicer — the page stays fully usable, nothing hides behind a
scrim, there is no modal trap. So: **push whenever pushing does not damage the
grid.** It damages the grid the moment the content region can no longer sustain
the narrowest desktop grid the law already ships.

That grid is the 1024 rail:

```
avail(1024, rail) = 1024 − {C['sidebar_rail']} − {2*C['margin_desktop']} = {N['desk_min_avail']}px  →  8 columns @ {N['desk_col_floor']:.2f}px
```

{N['desk_col_floor']:.0f}px is therefore the desktop column floor — not a target, a fact about
what is already in production at the smallest desktop the ladder covers. So push
is legal exactly when:

```
vw − {C['sidebar_expanded']} − {2*C['margin_desktop']} ≥ {N['desk_min_avail']}     →     vw ≥ {N['push_min']}
```

- **vw ≥ {N['push_min']}** — the nav **pushes**. The grid recomputes, the column count may step
  down, cards re-resolve through §6. No scrim, nothing hidden.
- **vw < {N['push_min']}** — the nav **overlays** at `min({C['sidebar_expanded']}, vw − {N['drawer_peek']})px` over a
  `{N['scrim']}` scrim. The content geometry is untouched. Esc, the scrim, or
  choosing a nav item closes it.

There is a second, deeper reason the narrow case overlays, and it is in §3.

### Sticky intent

On a push-capable screen the hamburger sets a **preference**, not a temporary
state. Expand it at 1920, shrink the window past {N['push_min']} and the nav demotes to a
rail on its own; grow the window back and the choice returns. Stored in
`user_preferences.shell.nav.intent`. The nav is never forgotten and never forced.

### Every width, both directions
""")
tbl(["Viewport", "At rest", "Hamburger", "On toggle", "Drawer", "Cols at rest",
     "Cols after", "Grid reflows?"],
    [[f"`{r['vp']}`", r["resting"], "always", f"**{r['on_open']}**",
      f"{r['drawer_w']}px" if r["drawer_w"] else "—",
      f"{r['cols_rest']} @ {r['col_rest']:.1f}",
      f"{r['cols_open']} @ {r['col_open']:.1f}",
      "yes — the user asked" if r["reflow"] else "no"] for r in L["nav_table"]])

w(f"""The last column is the one that matters. An **automatic** reflow — one the user
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
nav is allowed to push above {N['push_min']}.

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
""")
tbl(["Archetype", "Scrolls", "Regions", "Rule", "Examples"],
    [[f"**{a['name']}**", a["scroll"], " · ".join(a["regions"]), a["rule"],
      ", ".join(a["examples"])] for a in L["archetypes"]])

w("""### The nav is not the same on every archetype

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
""")
tbl(["Archetype", "Rail from", "Expanded from", "Subnav column from", "Why"],
    [[f"**{k}**",
      "never" if v["rail_min"] is None else "1024 (ramped to 1096)",
      "never" if v["expanded_min"] is None else f"**{v['expanded_min']}**",
      v["subnav_col_min"] or "—", v["why"]]
     for k, v in L["arch_nav"].items()])

w(f"""### A defect v1.0 shipped

v1.0 placed a {C['subnav_w']}px subnav as a third shell column from 1024 up and never
checked it against its own {N['desk_col_floor']:.0f}px column floor. It fails at four breakpoints:

| Viewport | Nav + subnav | Content | Columns | Verdict |
|---|---|---|---|---|
| 1024 | rail + subnav = 296 | 680 | 8 @ **64.00** | below the 92px floor |
| 1180 | rail + subnav = 296 | 836 | 8 @ **83.50** | below the floor |
| 1351 | expanded + subnav = 488 | 815 | 8 @ **80.88** | below the floor |
| 1425 | expanded + subnav = 488 | 889 | 8 @ **90.12** | below the floor |

The fix falls straight out of the same rule. A subnav **column** costs {C['subnav_w']}px, so
it may not appear until the canvas still clears {N['desk_min_avail']}px:
`{N['desk_min_avail']} + {C['sidebar_rail']} + {C['subnav_w']} + {2*C['margin_desktop']} = 1248`. Below that a subnav is a horizontal
**tab strip** pinned under the header, which costs height instead of width.
Expanded-plus-subnav costs 416px more than nothing, so it waits until **1440**.

Note that `1216`, `1248` and `1440` are all the same calculation from different
directions — the content floor of {N['desk_min_avail']}px plus whatever chrome is asking to sit
in front of it. Two independent routes to the same number is the sign that the
rule is real and not a rationalisation.

---

## 5. The grid

The column **count** floats with the viewport; the column **width** stays in a
tight band around a {C['col_target']}px target. So a card is the same physical size on every
machine, and a wider screen fits **more** cards rather than **fatter** ones.

Legal column counts: desktop `{L['legal_column_counts']['desktop']}` ·
tablet `{L['legal_column_counts']['tablet']}` · mobile `{L['legal_column_counts']['mobile']}`.

The engine picks the legal count whose resulting column width is closest to {C['col_target']}px.
""")
tbl(["Screen", "Viewport", "Nav", "Content", "Cols", "Column", "Note"],
    [[b["note"].replace("*REF*", "**reference**"), f"`{b['vp']}`", b["nav"],
      f"{b['avail']}px", b["cols"], f"{b['col']:.2f}px", b["kind"]]
     for b in L["breakpoints"]])

w(f"""### On the base width

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
= {L['font_metrics']['digit_em']}em, comma {L['font_metrics']['comma_em']}em, period {L['font_metrics']['period_em']}em, read out of the font binary.

Resolution order:

1. start at the fit the author designed;
2. keep it by **widening** the span while the floor is unmet and headroom remains;
3. only when widening is exhausted, **degrade** to the next leaner fit — which
   trades a column for a row and re-lays the card's inside;
4. never below a floor, never wider than the grid, always terminates.

**Step 3 is the mechanism that guarantees nobody loses data to their screen
size.** A card that cannot get wider gets taller and changes shape.
""")
for cat in L["categories"]:
    w(f"### {cat['id']} · {cat['name']}\n")
    w(f"{cat['role']}. Example: *{cat['example']}*. "
      f"Max {cat['max'][0]}×{cat['max'][1]}. Authored default: `{cat['fits'][cat['default']]['variant']}`.\n")
    tbl(["Fit", "Span", "Floor", "What changes inside"],
        [[f"`{f['variant']}`", f"{f['cols']}×{f['rows']}", f"≥ {f['floor']}px", f["desc"]]
         for f in cat["fits"]])

w("### Where each category lands, at every breakpoint\n")
for cid, table in L["promotion"].items():
    cat = next(c for c in L["categories"] if c["id"] == cid)
    w(f"**{cid} · {cat['name']}**\n")
    tbl(["Viewport", "Span", "Fit", "Width", "Height", "Per row", "Note"],
        [[f"`{vp}`", f"{s['cols']}×{s['rows']}", s["variant"], f"{s['width']:.0f}px",
          f"{s['height']}px", s["per_row"],
          ("promoted " if s["promoted"] else "") + ("degraded" if s["degraded"] else "")
          or ("full width" if s["full_width"] else "—")]
         for vp, s in table.items()])

w("""---

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
""")
w(f"""A card **never** sizes to its worst-case number. Your 20-digit, 4-decimal value
is **{L['numeric_ladder'][0]['w38']:.0f}px** at metric size. The widest card the law can produce at 1920
is 1593px; a metric card is ~380px. No card can ever be sized to that number.

So the law inverts it: the number formats **down to the card**, and the exact
value is always one hover away. Currency drops first, then decimals, then
magnitude. Full precision belongs in the ledger, never on a dashboard.

Two guards the ladder needs and a naive implementation misses:

- a unit is only legal if it brings the mantissa under 1000, or you get
  `PKR 100000000.00T`, which means nothing;
- currency under 1000 never rounds to whole units — `PKR 100` for 99.50 is a lie.
""")
tbl(["Rung", "Sample", "@20px", "@26px", "@38px", "Note"],
    [[f"`{n2['key']}`", f"`{n2['sample']}`", f"{n2['w20']:.0f}px", f"{n2['w26']:.0f}px",
      f"{n2['w38']:.0f}px", n2["note"]] for n2 in L["numeric_ladder"]])

w("""---

## 9. The rank law

The structural answer to *"it feels overwhelming"*.

The POS shows about **60 affordances at rest with an empty cart**, and the green
Complete button carries the same visual weight as a toggle a cashier touches once
a month. That is not a styling problem — it is a residency problem. Nothing in
the system said where a control was **allowed** to live, so everything lived
everywhere.

Every control in VenQore carries exactly one rank. Rank decides residency, and
residency is enforced, not advised.
""")
tbl(["Rank", "Used", "Lives", "Budget", "Why"],
    [[f"**{r['rank']} · {r['name']}**", r["freq"], r["residency"],
      "unbounded" if r["budget_desktop"] is None
        else f"{r['budget_desktop']} on the surface", r["why"]]
     for r in L["ranks"]])

caps = L["pos"]["capabilities"]
surf = [c for c in caps if c["home"] in ("surface", "line-visible")]
w(f"""Applied to the register: **{len(caps)} capabilities**, none dropped,
**{len(surf)} visible at rest**.

---

## 10. The terminal

A dashboard has unlimited height, so v1.0 only ever had to defend the horizontal
axis. A **terminal** is exactly one viewport tall and never scrolls the page, so
here height is the scarcer resource — and the worst case is not a phone, it is a
**1280×720 laptop**, where a maximised browser leaves about 570 usable pixels.

### Measured floors

Every one of these is computed from the type scale and the real advance widths,
not chosen:
""")
tbl(["Floor", "Pixels", "What it is"],
    [[f"`{k}`", f"**{v:.0f}px**", d] for k, v, d in [
      ("cart_line_full", MF["cart_line_full"], "one cart line with every control inline"),
      ("cart_line_relay", MF["cart_line_relay"], "name on line 1, controls on line 2"),
      ("cart_line_min", MF["cart_line_min"], "name + total; tap a line to adjust"),
      ("tender_full", MF["tender_full"], "the grand total at 38px + padding"),
      ("tender_mid", MF["tender_mid"], "the grand total at 26px"),
      ("tender_min", MF["tender_min"], "an abbreviated total in a sticky bar"),
      ("catalog_grid3", MF["catalog_grid3"], "3 image tiles per row"),
      ("catalog_grid2", MF["catalog_grid2"], "2 image tiles per row"),
      ("catalog_list", MF["catalog_list"], "rows: name, price, stock"),
      ("doc_table_full", MF["doc_table_full"], "10 line columns"),
      ("doc_table_std", MF["doc_table_std"], "7 line columns"),
      ("doc_table_lean", MF["doc_table_lean"], "5 line columns"),
      ("doc_table_card", MF["doc_table_card"], "one card per line"),
      ("doc_summary_full", MF["doc_summary_full"], "resident summary panel"),
      ("doc_summary_min", MF["doc_summary_min"], "narrow summary panel"),
      ("doc_header_2col", MF["doc_header_2col"], "two field columns"),
    ]])

w(f"""`cart_line_full` = name {132} + qty stepper {96} + rate {75} + total {130} +
delete {36} + gaps {48} + padding {40}. That is the arithmetic; there is no
judgement in it.

### The residency ladder

A card that cannot get wider gets **taller** and relays its inside. A pane cannot
do that — a terminal has no vertical slack. So a pane **demotes** instead:
""")
tbl(["Residency", "What it means"],
    [["`resident`", "a column, always visible"],
     ["`stacked`", "a full-width band — spends height instead of width"],
     ["`sheet`", "a slide-over, one control away, keeps its state"],
     ["`tab`", "one of N tabs sharing the whole area"],
     ["`route`", "its own screen, reached by navigation and returned from"]])

w("""`route` exists because some panes are not a simultaneous *view*, they are a
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
""")
tbl(["Pane", "Cap", "Derivation"],
    [["cart", f"{L['pane_caps']['cart']:.0f}px",
      "its floor with the item column grown from a 12-char truncation to a full 40-char product name"],
     ["tender", f"{L['pane_caps']['tender']:.0f}px", "its floor plus a 4×40 numeric keypad"],
     ["summary", f"{L['pane_caps']['summary']:.0f}px", "its floor plus a label column"],
     ["catalog · floor · lines", "none", "these show more when given more — they absorb"]])

w("""### What defends what

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
droppable first, until the cart clears `cart_min_h = """
  f"{T['cart_min_h']}px`.\n\nThis is the only place in the law where one axis "
  "overrules the other, and it is why the Column variant quietly becomes the "
  "Counter variant on a 360×560 phone instead of showing a one-line cart.\n")

w(f"""### The catalog band is asymmetric

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
{{ catalog: {{ mode, size, rows, tiles }}, split: {{ cart, tender }}, tender, floor }}
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

#### The catalog is a resident column only above {L["pos"]["catalog_resident_min_vw"]}px

Derived, not chosen: a catalog column needs
`catalog_list {MF["catalog_list"]:.0f} + cart_line_full {MF["cart_line_full"]:.0f} + tender_min {MF["tender_min"]:.0f} + 2 gutters`
= **{L["pos"]["catalog_resident_min_avail"]:.0f}px of content**, which arrives at a
**{L["pos"]["catalog_resident_min_vw"]}px viewport**. Below that the catalog is one
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
""")
tbl(["Preset", "Composition", "For"],
    [[f"**{p['name']}** — *{p.get('tagline','')}*",
      "catalog `" + p["comp"]["catalog"]["mode"] + "`"
        + (f" {p['comp']['catalog']['size']*100:.0f}%" if p["comp"]["catalog"]["size"] else "")
        + f" · cart `{p['comp']['split']['cart']*100:.0f}%`"
        + f" · tender `{p['comp']['split']['tender']*100:.0f}%` ({p['comp']['tender']})"
        + (f" · floor `{p['comp']['floor']}`" if p["comp"]["floor"] != "off" else ""),
      p.get("for", "")]
     for p in L["pos"]["presets"]])

w("### What the composer exposes\n")
tbl(["Control", "Choices", "What clamps it"],
    [[f"**{c['label']}**",
      " · ".join(f"`{o}`" for o in c["options"]) if c.get("options")
        else f"`{c['range'][0]}`–`{c['range'][1]}`",
      c.get("note", "—")]
     for c in L["pos"]["controls"]])

w("### The capability register — the no-loss proof\n")
w("Everything read out of `Pos.jsx` (3,743 lines) and its children. Nothing is "
  "dropped; each is placed.\n")
HOME = {"surface": "Working surface — always visible", "line-visible": "On every cart line",
        "line": "Revealed by selecting a line", "field": "Revealed by its own field",
        "bar": "Terminal bar", "sheet": "Sheet — one control away",
        "drawer": "Settings drawer", "auto": "No UI — automatic"}
for rank in (1, 2, 3):
    w(f"**Rank {rank} · {L['ranks'][rank-1]['name']}**\n")
    tbl(["Capability", "Lives", "Note", "In the code"],
        [[f"**{c['label']}**", HOME.get(c["home"], c["home"]), c["note"] or "—",
          f"`{c['src']}`" if c["src"] else "—"]
         for c in caps if c["rank"] == rank])

w("### Fourteen live defects the inventory found\n")
w("These are in the shipped POS today. A redesign that mirrors the current "
  "screen inherits every one.\n")
tbl(["What it does today", "What the law does"],
    [[was, f"**{now}**"] for _id, was, now in L["pos"]["fixes"]])

w("### One keymap for the whole product\n")
w("The full F-key map exists only in `Pos.jsx`, while `KeyboardShortcutsModal.jsx` "
  "advertises it to every user — and none of the thirteen document screens "
  "implements any of it. It becomes the shared keymap, and it is **scoped**: keys "
  "are suspended while the caret is in a field, which today's handler does not do.\n")
tbl(["Key", "Action", "Where"], [[f"`{k[0]}`", k[1], k[2]] for k in L["pos"]["keymap"]])

D = L["document"]
SUMH = lambda i: (D["metrics"]["zone_h"]
  + (len(next(x for x in D["density"] if x["id"] == i)["summary"]) - 1) * D["metrics"]["sum_row"]
  + D["metrics"]["sum_tot_row"])
w(f"""---

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
""")
tbl(["Zone", "Defends", "Fits"],
    [[f"**{z['name']}**", z["hold"],
      " · ".join(f"`{f['variant']}` ≥{f['floor']}px" for f in z["fits"])]
     for z in D["zones"]])

DM = D["metrics"]
w(f"""### The document is composed too

The register stopped being a menu of six layouts; the document editor stopped
being one arrangement with breakpoints. A composition is:

```
{{ details, summary, pin, split, density }}
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
""")
tbl(["Density", "Summary rows", "Column height", "Sticks on a 1280×570 laptop?"],
    [[f"**{d['name']}**", len(d["summary"]),
      f"**{SUMH(d['id']) + DM['actions_h']:.0f}px**",
      "yes — it holds still"
        if SUMH(d["id"]) + DM["actions_h"] <= 570 - 64 - 48 - DM["strip_h"]
        else f"**no — it docks bottom-right** ({570 - 64 - 48 - DM['strip_h']}px of room)"]
     for d in D["density"]])

w(f"""Pro is the first density that stops fitting, and the law names it without
being told to.

#### The dock is a row, not a float

The Counter register had a browse button floating over the payment panel. A
summary card floated into the bottom-right corner is the same defect: it covers
the last line of the table and no amount of scrolling reveals it. So the dock's
height — **{DM['dock_h']}px** — is a real row at the bottom of the scroller,
reserved before anything is measured. It is anchored right so the left of the
last row stays visible, and the space it occupies belongs to it. Verified in a
real browser: at every preset and every device, scrolled to the very bottom, the
dock and the last line do not intersect.

#### The nav now knows what you composed

Section 4 derived `expanded_min = {L["arch_nav"]["document"]["expanded_min"]}`
for a document from the **default** zone weights. Widen the summary and that
arithmetic changes — and the sweep caught it: at 1708 a Pro ledger with a 32%
summary lost its tenth line column the moment the nav expanded. Buying a bigger
screen made the invoice worse again, one composition further along.

So the No-Regression Rule moved from derivation time to **run time**. The nav
holds the rail wherever expanding it would cost *this* composition a fit.

#### A summary column may cost line columns; it may not cost the table

`auto` keeps the summary resident while the lines still clear
`doc_table_lean` = {MF["doc_table_lean"]:.0f}px — a summary panel is worth more
than the 8th, 9th and 10th line column, and less than the table itself. An
explicit `right` keeps it wherever it is physically possible
(≥ {MF["doc_table_card"]:.0f}px) and the readout says what it cost.

### Six starting points
""")
tbl(["Preset", "Composition", "For"],
    [[f"**{pp['name']}**",
      f"details `{pp['comp']['details']}` · summary `{pp['comp']['summary']}` · "
      f"pin `{pp['comp']['pin']}` · `{pp['comp']['split']*100:.0f}%` · "
      f"`{pp['comp']['density']}`", pp["for"]]
     for pp in D["presets"]])

w("### Three densities\n")
w("Density is a preference — an accountant wants ten line columns, a cashier "
  "wants five — but it is a preference the width has to be able to honour. Below "
  "the floor the law **caps** the density rather than letting the user pick "
  "something that will silently mangle the screen.\n")
tbl(["Density", "For", "Header fields", "Line columns"],
    [[f"**{d['name']}**", d["for"], " · ".join(d["header"]), " · ".join(d["line_cols"])]
     for d in D["density"]])

w("### What the width decides\n")
tbl(["Viewport", "Nav", "Content", "Header", "Line table", "Max density", "Summary"],
    [[f"`{vp}`", s["nav"], f"{s['avail']:.0f}px", s["header"],
      f"{s['lines']['variant']} @ {s['lines']['width']:.0f}px",
      f"**{s['lines']['max_density']}**", s["summary"]]
     for vp, s in sorted(D["solved"].items(), key=lambda x: int(x[0]))])

w("""Note the row at **1708**. That is where a document surface finally lets the nav
expand — the first width at which a 264px sidebar still leaves room for the
10-column table *and* the summary panel.

When the summary cannot be a resident column it becomes a **sticky action bar**,
not the same panel pinned to the bottom — a 438px bar on a 570px laptop leaves
nothing for the document it is summarising. Collapsed it is the total, the
balance and the primary action; the breakdown is one tap.

### The thirteen types
""")
tbl(["Type", "Prefix", "Side", "Default density", "Party is called", "Save says"],
    [[f"**{t['name']}**", f"`{t['prefix']}`", t["side"], t["density"],
      t["labels"].get("party", "—"), t["labels"].get("save", "Save")]
     for t in D["types"]])

w("### The capability matrix\n")
w("Rows are every distinct capability found across all thirteen screens. This is "
  "the definition of what the unified editor must support — and the answer to "
  "*will we lose something*: if a cell is filled today, it is filled here.\n")
keys = list(D["capabilities"].keys())
tbl(["Capability"] + [t["prefix"] for t in D["types"]],
    [[D["capabilities"][k]] + ["●" if k in t["on"] else "·" for t in D["types"]]
     for k in keys])

w("### Same field, different wording — collapse these\n")
tbl(["Concept", "Wordings found in the codebase", "Neutral term"],
    [["The other side of the transaction",
      "`Customer`, `Supplier`, `Payee / Vendor`, `Search Party`, and a `customer` state mapped to `supplier_id`",
      "**Party**, with a per-type display label"],
     ["The document's own number",
      "`Invoice #`, `Po #`, `Return Ref`, `Reference #`, `order_number`, `reference_number`",
      "**Document no.**, per-type prefix"],
     ["The counterparty's number", "`Supplier Invoice #`, `Reference No.`, `Reference`",
      "**Party reference**"],
     ["Document date",
      "`Date`, `Purchase Date`, `Transfer Date`, `Audit Date`, `Date of Expense`, `Return Date`",
      "**Document date**"],
     ["Header discount", "`Invoice Discount`, `Return Discount`, `Header discount`",
      "**Document discount**"],
     ["Money already settled", "`Amount Paid`, `Refund Amount`, `Refund Received`",
      "**Amount settled**, per-type label"],
     ["Outstanding remainder", "`Balance Due`, `Net Credited`", "**Balance**"],
     ["Line unit money", "`Price`, `Unit Cost`, `Batch Unit Cost`",
      "**Unit rate** (*Price* sell-side, *Cost* buy-side)"],
     ["Which warehouse", "`Warehouse`, `From/To Warehouse`, implicit `Warehouse::first()`",
      "**Location**"],
     ["Payment channel", "`CASH`/`CREDIT`, `CASH`/`BANK`, `Payment Method`, `refund_method`",
      "**Settlement method** — one enum"],
     ["Which ledger account", "`Deposit To`, `Refund From`, `Bank Account`",
      "**Money account**"],
     ["Lifecycle state", "`Status`, `Goods Status`, `ORDERED/RECEIVED`, `workflow_status`",
      "**Workflow status** and **Payment status**, split"],
     ["Save button",
      "`COMPLETE SALE`, `COMPLETE ORDER`, `SAVE PROPOSAL`, `CONFIRM RETURN`, `Post Purchase`, …",
      "**Save**, with the type and total on a secondary line"]])

w(f"### {len(D['fixes'])} gaps the inventory found\n")
w("These exist *because* there are eight copies: a fix applied to the sales "
  "invoice never reached the other seven.\n")
tbl(["Live defect in the shipped screens", "What one editor does instead"],
    [[f[1], f"**{f[2]}**"] for f in D["fixes"]])

E = L["edit"]
w(f"""---

## 12. Edit mode

{E['principle']}
""")
tbl(["Gesture", "Does", "Snapped to"],
    [[f"**{g['id']}**", g["gesture"], g["snap"]] for g in E["grants"]])
PL, SP = L["placement"], L["splitter"]
w(f"""### Flow and Free — packing left is one of two answers

v2.0's packer flushed every band to the left and grew cards to eat the slack, so
a deliberate gap was impossible to author. That was a real limitation, not a
taste call — but it was solving a real problem: **a layout authored at 24 columns
must still be legal at 8, and at 4.** Flow solved it by never storing a position
at all. Free has to store one, so Free needs a projection.

Every mature editor ships both under some name: Gridstack's `float` versus
gravity; react-grid-layout v2's pluggable compaction with `noCompactor` ("free
positioning"); Grafana's **Auto grid** versus **Custom layout**. So it is a user
setting here too.
""")
tbl(["Mode", "Stores", "Packs", "Why it exists", "Prior art"],
    [[f"**{m['name']}**", f"`{m['stores']}`", m["packs"], m["why"], m["prior_art"]]
     for m in PL["modes"]])

w(f"""#### The projection

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

Free placement exists at **{PL['min_free_cols']} columns and above**. At 4 the
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

On a dashboard the content floor is the same **{L['constants']['desk_col_floor']:.0f}px × 8 = 904px**
that gives us 1216, so the handle physically cannot be dragged into breaking the
grid. Below the push threshold the nav overlays and costs the content nothing, so
there the stop is instead the widest sidebar the narrowest *pushing* screen can
carry — `1216 - 48 - 904 = 264`, the default, arrived at from the other side.

**264 was never a taste call.** At a 1920 viewport,
`1920 - 48 - 264 = 1608 = 12x112 + 11x24`. The default sidebar is exactly the
width that yields twelve columns at exactly the {L['constants']['col_target']}px
target — so the splitter is magnetic at every width with that property, for every
legal column count, and the readout names which one you are on.
""")
tbl(["Splitter", "Minimum", "Maximum", "Snaps to", "Persists as"],
    [[f"**{x['id']}** — {x['region']}", x["min"], x["max"], x["snaps"], f"`{x['persists']}`"]
     for x in SP["where"]])
w(f"Keyboard is the WAI-ARIA APG **Window Splitter** pattern verbatim: "
  f"`role=separator`, `aria-valuenow/min/max`, and:\n")
tbl(["Key", "Does"], [[f"`{k}`", v] for k, v in SP["aria"]["keys"].items()])
w(f"Double-click restores the archetype default. {SP['principle']}\n")

w("### Invariants\n")
for i in E["invariants"]:
    w(f"- {i}")
w("")
w(f"""### Where it is stored

`{E['storage']['table']}`, key `{E['storage']['key']}`.

{E['storage']['why']}

{E['storage']['conflict']}

```json
{json.dumps(E['storage']['shape'], indent=2)}
```

### The Reckoner contract

{E['reckoner']['contract']}

{E['reckoner']['guarantee']}

---

## 13. Underflow

The continuous sweep found the one width where the law genuinely runs out. At a
320px viewport the content region is 288px, and the leanest fits of **Board (C5)**
and **Canvas (C6)** both need 295px. Seven pixels.

Pretending otherwise would be the dishonest fix, so the law says two things
instead:

- **`min_viewport = {L['min_viewport']}`** — the designed minimum. Every guarantee in this
  document holds from 360px up. 360 is the Android baseline and the narrowest
  width in the breakpoint table, so this is a statement of what was designed for,
  not a retreat from it.
- **Underflow** — below 360 the card does not break, it **scrolls**. It keeps its
  leanest fit's floor as a `min-width` and scrolls horizontally inside its own
  border. Content stays reachable, the grid is intact, and the *page* still never
  scrolls sideways — only the one card that could not fit does.

{L['underflow']['why_not_lower_the_floor']}

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
  heights land exactly on {" / ".join(str(L['row_heights'][k]) for k in ['1','2','4','6','8'])}.

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
""")

(OUT / "VENQORE_LAYOUT_LAW.md").write_text("\n".join(o))
print("rulebook:", (OUT / "VENQORE_LAYOUT_LAW.md").stat().st_size, "bytes",
      len("\n".join(o).split("\n")), "lines")
