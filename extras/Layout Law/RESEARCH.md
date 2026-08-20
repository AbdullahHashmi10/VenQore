# What shipping POS products actually do — and what we take

Researched: Odoo 18 (source), Toast, Shopify POS, Square, Lightspeed S/X, Loyverse,
Dynamics 365 Commerce, Xero, QuickBooks, react-grid-layout, Gridstack, Grafana, Datadog.

## The three findings that change the design

**1. On a phone, nobody composes — they SWAP.**
Odoo mounts exactly one pane below 767px (`pos.mobile_pane`), with a persistent
bottom bar of two half-width buttons: **Pay** (running total printed inside the
button) and **Cart · N items**. Toast Go stacks the check on top of the menu.
Dynamics abandons drag-and-drop entirely below 1024×768 and allows property-only
config. *A composer that tries to keep two panes below ~768px is fighting every
shipping product.* → the catalog is never resident on a phone or a portrait
tablet; it is one button away, full screen.

**2. "Auto-compact vs allow gaps" is a first-class USER setting in every mature
editor, not an implementation detail.**
Gridstack has `float` (gravity off = gaps preserved) and `compact('compact'|'list')`
where `list` "keeps left→right order the same, even if that means leaving an empty
slot". react-grid-layout v2 made compaction pluggable — `verticalCompactor` /
`noCompactor` ("free positioning") — plus a clean three-way: push, block-and-
snap-back, or overlap. Grafana ships it as two named modes: "Auto grid" vs
"Custom layout". → the dashboard gets a **Flow / Free** switch instead of always
packing left.

**3. Percentage panes need pixel clamps.**
The only source-verified proportion in the entire industry is Odoo's, and it is
ABSOLUTE: `$left-pane-width: 500px`, `400px` below 1200. That reads as 26% at
1920 and 52% at a 768 portrait iPad — which is exactly why a fixed-px cart
degrades in portrait. Apple's `UISplitViewController` does the same thing from
the other side: a fraction bounded by `minimum`/`maximumPrimaryColumnWidth`
(default max 320pt). → the user picks a %, and the measured floors clamp it.

## Smaller things taken directly

- **Drop target is a translucent ghost, not a line.** RGL paints
  `.react-grid-placeholder { background: red; opacity: .2 }` at the snapped
  destination, z-index 2, under the dragged item at z-index 3. Gridstack does the
  same with `rgba(0,0,0,.1)`. → ghost + dotted outline at the destination.
- **Resize handle: south-east only, 20×20px hit area** (RGL default
  `resizeHandles: ['se']`). Gridstack uses all four corners with `autohide`.
- **Grid density is expressed as rows × columns**, not px. Toast: default 8×5,
  adjustable per device. Lightspeed S: a 30-space panel, each tile spanning
  "1 to all 30". → catalog density is tiles-per-row, and it is a user setting.
- **Two-step add on mobile.** Shopify made tapping a product open a detail page
  with an explicit *Add to cart*, and says it "improved user confidence that they
  performed the right action by almost 2x" — accidental adds from the search page
  were being undone constantly.
- **Touch target floor.** Odoo's POS pay/switch buttons carry `min-height: 70px`.
- **Measure the GRID, not the window.** Gridstack v2 changed `oneColumnMode` from
  `window.width < 768` to measuring the grid's own width — "more correct and
  supports nesting". Our container queries already do this.
- **Xero re-tuned line-item column widths centrally** after sustained complaints
  that the invoice grid was built for widescreen and forced side-to-side scrolling
  on laptops. Validates capping density by measured width rather than by taste.

## Where we deliberately go further

Nobody on the list ships **resizable panes**. Toast exposes rows×columns,
Lightspeed exposes tile spanning, Loyverse exposes grid-vs-list, Shopify and
Square expose tile *content* only. Free-form pane geometry exists only in
Dynamics 365 Commerce — and there it is per-resolution static layouts authored in
an admin tool, exported as XML, assigned store → register → user.

So a POS the operator composes at the register, live, with the law keeping it
legal, is genuinely not something the category has. That is the right place for
VenQore to be different, given the positioning.

## Where the research came up empty — stated, not guessed

- No published cart-vs-tender proportion for Square, Shopify, Lightspeed or Loyverse.
  Anyone quoting "70/30" for those is reading screenshots.
- No vendor publishes portrait-vs-landscape composition rules except Dynamics
  ("you must define a screen layout for each mode").
- **Nobody documents whether an invoice totals block docks on scroll**, or whether
  the document header is collapsible — not Zoho, QuickBooks, Xero or Odoo. Odoo's
  totals sit *below* the lines at colspan 4 of 12 and do not stick. So the docked
  summary is our own call, not a copied pattern.

---

# Round 2 — the dashboard editor and the splitter

Researched: Gridstack v12/v13 (docs + source), react-grid-layout v1/v2, Grafana
dashboard layouts, Dynamics 365 Commerce screen layouts, WAI-ARIA APG.

## Gridstack names the projection problem and ships six answers

`columnOpts.layout` is the setting for what happens when the column count
changes, and the values are documented verbatim:

| value | what it does |
|---|---|
| `moveScale` | "Scale and move items by the ratio of newColumnCount / oldColumnCount" |
| `list` | "Treat items as a sorted list, keeping them sequentially without resizing (unless too big)" |
| `compact` | "Similar to list, but uses compact() method to fill empty slots by reordering" |
| `move` | "Only move items, keep their sizes" |
| `scale` | "Only scale items, keep their positions" |
| `none` | "Leave items unchanged unless they don't fit in the new column count" |

→ **We take `moveScale`** — it is the only one that preserves both things a user
authored: *where* across the width (`col/N`) and *how much* of the width (`w/N`).
`list` is Flow by another name, and we already have Flow.

Gridstack also ships `columnWidth` — "wanted width to maintain (±50%) to
dynamically pick a column count" — which is the same shape as our
`col_target = 112` with a set of legal column counts. Our grid law and the most
widely used dashboard grid independently arrived at the same responsive model.

## Where we go past the prior art

Nobody solves the **drift** problem. RGL keeps a `layouts` map per breakpoint and
generates missing ones from the closest larger; Gridstack caches per column
count. Neither states the rule that stops rounding compounding, and RGL issue
**#1663** is users reporting exactly that symptom — a layout that does not pop
back when the window grows again.

→ **Always project from an authored class, never from a projection.** One hop,
ever. It costs nothing and it makes the round trip exact.

Nobody clamps the projected box to what it can *hold*, either — both libraries
treat a box as a rectangle with no content. Ours knows the category, so a metric
card scaled 24→8 is clamped back into its own travel instead of landing one
column wide and rendering nothing.

## The affordances, taken directly

- **Drop target** — RGL paints `.react-grid-placeholder { background: red;
  opacity: .2 }` at the *snapped destination*, z-index 2, under the dragged item
  at z-index 3. Gridstack uses `rgba(0,0,0,.1)`. → dotted outline + translucent
  fill at the destination, and the dragged card follows the pointer so the
  placeholder stays visible.
- **Resize handle** — RGL's default is `resizeHandles: ['se']` with a 20×20px
  hit area. Gridstack offers all four corners with `autohide`. → south-east only.
- **Free vs packed is a named user setting** — Gridstack `float`, RGL v2
  `noCompactor` ("free positioning"), Grafana **Auto grid** vs **Custom layout**.
- **Where to stop offering it** — Dynamics 365 Commerce abandons drag-and-drop
  below 1024×768 and allows property-only configuration. → Free placement exists
  at 6 columns and above; at 4 it is Flow.

## The splitter

The **WAI-ARIA APG Window Splitter** pattern is the spec, and it is small:
`role="separator"`, `aria-valuenow` / `aria-valuemin` / `aria-valuemax`,
`aria-controls`, an accessible name; arrows move it, **Enter toggles
collapse/restore**, Home minimises, End maximises, F6 cycles panes. We implement
all of it plus Escape-to-cancel and double-click-to-default.

One deliberate divergence: **arrow keys ignore the magnets.** A magnet radius
larger than the key step swallows every press and the handle never moves —
verified by driving the real page. Keyboard is for precision; magnets are for the
pointer.

## Where the research came up empty — stated, not guessed

- **No vendor documents an invoice summary that docks on scroll.** Odoo's totals
  sit below the lines at colspan 4 of 12 and do not stick; Zoho, QuickBooks and
  Xero do not publish a rule. So the docked summary, and the height test that
  decides when it appears, are ours.
- **No dashboard library bounds a splitter by what the content beside it needs.**
  They all take a `minSize`/`maxSize` in pixels or percent. Deriving the maximum
  from the content's own floor — `vw − 2·margin − 904` — is ours.
