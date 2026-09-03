# New Dashboard (v6) — card system rebuild

**Files changed:** `resources/js/Pages/NewDashboard.jsx`, `resources/js/Pages/NewDashboard.css`

**Authorities followed**
| Source | What it settles |
|---|---|
| `extras/Design System/VenQore Design System/tokens/typography.css` | the type scale, bumped 1–2pt on 22 Aug 2026 for POS legibility |
| `…/tokens/radius.css` | the shape law — **two** shapes only: 14px, and pill |
| `scratch/card-preview/vq-cards-light.html` | the card anatomy: frame, header, tools, number block, body, strip grid |
| `extras/Design System/VenQore Card System Rules & Padding Workbench.html` | the six categories, their min/max bounds and fits |
| `VENQORE_LAYOUT_LAW.md` v2.0 | the grid, the 24px pitch, the nav law, the fit resolver |

**Verified:** headless Chromium — 18 viewport widths (360→3425) × every chart type × every legal category × every legal fit × 4 card tones × light / dark / mesh. **0 overflow, 0 collisions, 0 clipping. All text passes WCAG AA on all three page backgrounds.**

---

## Round 2 — what the first pass got wrong

The first pass built a "resolution layer" that **restated** the card system with
values of its own invention, and quietly beat the real one on every point of
conflict. That is the "you skipped rules and font sizes" in the report, and it
was the single biggest defect. It is gone.

### The type scale was the pre-August one, and then overridden anyway

`typography.css` carries a dated decision:

> *The scale was bumped one to two points on 22 Aug 2026. It was drawn for a
> marketing site read at arm's length; a cashier reads a POS terminal from
> further away, standing, often over 50, and the 13px caption and 11px eyebrow
> were the first things people asked to make bigger.*

`NewDashboard.css` still held the pre-bump values, and my layer then replaced
them with `clamp()` expressions that went **smaller still**:

| | design system | this file (before) | my layer (before) | now |
|---|---|---|---|---|
| metric | 40px | 38px | `clamp(15px … 34px)` | **40px** |
| metric-sm | 28px | 26px | — | **28px** |
| eyebrow | 12px | 11px | `clamp(10px … 12.5px)` | **12px** |
| caption | 14px | 13px | 11px | **14px** |
| body | 17px | 16px | — | **17px** |
| h3 | 23px | 21px | — | **23px** |

Fixed at the **token** level, so every rule in the file lands correctly at once.
Every hard-coded 9 / 9.5 / 10 / 10.5 / 11 / 11.5 / 12.5px in the shell, the
cards and the wizard was mapped onto a scale step. There is no raw font size in
the card layer any more.

### The radius ladder was declared twice, and both copies were wrong

```
line  188   --vq-r-xs 8   sm 12   md 14   lg 20   xl 28   2xl 36
line 1739   --vq-r-xs 6   sm  8   md 12   lg 16   xl 18   2xl 24   ← this one won
radius.css  every rung 14px, pill for meaning-bearing shapes only
```

So a card the first block called 20px rendered at 16px, and my layer asked for
18px on top. All three are now the one V6 shape: **14px, or a pill.**

### Three named bugs shipped with `!important`

```css
.vqc {
  justify-content: space-between !important;   /* ← */
  border-radius: var(--vq-r-xl, 18px) !important;
  transition: all var(--vq-dur-2) !important;
}
```

The card system calls the first out by name — *"`space-between` on a column
pushes the header up and the body down, so a card holding one number stretched
that number across whatever height the grid gave it. The fit decides the box;
the content sits at the top of it."* That is why a 3×2 strip left two thirds of
itself empty in the preview. `transition: all` animated layout properties, so
every reflow became a 180ms slide. Block removed; the reference's own `.vqc`,
`.vqc-hd` and `.vqc-head` now apply.

### The strip's own layout was a flex row

The reference lays the inline strip as a **three-column grid** — label | value |
window — *"because a flex row lets the label push the number off the end"*, with
a stated priority: the value never shrinks, the window truncates next, the label
gives way first. The file had a flex row with `space-between`, and keyed its
stacked form off `.vqc--c2-stacked`, a class no renderer has emitted in a long
time. Both forms now use the reference's grid and class names, and the strip is
centred in its card.

### An opaque pill was painted over every strip

`.vqc--c2 .vqc-tools` carries `background: var(--vq-surface)` so the controls
read against the number when they appear. My layer forced that container
visible at rest so the open arrow could live in it — which painted a white
lozenge over the right end of every strip. It had been eating the last three
letters of "Today" and "Month" in every screenshot. The ground now arrives with
the controls, not before them.

### A stat in a Metric card had no chart at all

`defaultVariant('stat')` is `number`, and `number` is the *bare* variant — the
renderer draws no chart host for it. Correct in a tile or a strip, which have no
body; wrong from C3 up, where it left one figure floating in 240px of nothing.
The rule is now explicit: **the bare number is the tile and strip interior; a
stat with a body to fill gets the sparkline.**

### The Law's pixel floors were never checked

A fit's floor is a pixel measurement — *"4×1 inline ≥ 356px"* — so it cannot be
chosen from column counts alone: four columns is 520px on a desktop and 330px on
a phone, and only one of those can hold an inline strip. The board's real column
width is measured once per draw and carried on the geometry, and the strip picks
its fit against it.

### The gutter was being tightened on small screens

I had dropped it to 14px on phones. The gutter is not decoration — **it is the
pitch**: row height is `n·64 + (n−1)·24`, which is what makes a 2-row card
(152px) exactly equal two stacked 1-row cards (64+24+64). Change it and every
multi-row card drifts out of alignment with its neighbours. It is 24px on both
axes at every width, and the margin ramps rather than steps so the canvas never
loses width for a pixel of window growth.

### The header menu had no stylesheet at all

"Edit layout / Add a card / Reset layout" rendered as three inline buttons with
their icons floating above the words, over whatever was behind them. It is a
popover now: positioning context, raised surface, 14px corner, rows with hover.

---

## What the author can and cannot set

Per your decisions:

**Cannot** — the card names itself. A reading card takes the reading's label, a
hub its template's name, a shortcut its destination. No title field, no subtitle
field, so two boards of the same data read the same way.

**Cannot** — no URL is ever typed. A shortcut's destination is picked from a
grid of the pages that exist; a reading's and a hub's are derived.

**Can** — size and category (presets plus a column/row stepper over every legal
size), chart type and variant, default timeframe, background tone, and four
switches for the card face:

| Switch | Default | Overridden by geometry when |
|---|---|---|
| Open arrow | on | — |
| Change pill | on | card is 1 column |
| Timeframe caption | on | card is under 4 rows |
| Timeframe picker | on | card is under 3 columns |
| Star border · glare | off | — |

A switch says *"I want this"*; the geometry says *"there is room"*. The panel
tells the author which is about to happen, in amber, next to the switch — so a
preference can never cause an overflow and never silently does nothing.

---

## Carried over from round 1

- **The page scrolls.** `app.css` locks `html, body, #app` for the POS terminal;
  the shell is now its own scroll container rather than unlocking 312 pages.
- **Sizes are generated from the Law**, not from a hand-written list, by one
  resolver the wizard, the drag handle, the board and the preview all call.
- **`boardCols()` reads the declared count.** It used to read the *used* track
  list — but a too-wide card makes Grid mint implicit columns, so the clamp
  meant to stop the overflow read its own bug as the truth and held it there.
- **The preview draws at true geometry** (`w·112+(w−1)·24` by `h·64+(h−1)·24`)
  and scales to fit, with a Fit/100% toggle. 39 distinct sizes for one reading.
- **Charts measure layout, not paint** (`clientWidth`, not the rect, which
  includes the entry animation's `scale(.985)`), and a ResizeObserver re-cuts
  each chart when its host changes for any reason.
- **The nav law**: overlay below 1216, rail to 1279, expanded from 1280,
  hamburger at every width, column ladder stated per nav state.
- **Truncation set on inline spans does nothing** — all blockified.
- **A legacy star border** drew two pseudo-elements 300% of the card wide at
  `left:-250%`, adding 2,400px of phantom scroll to every accent card.
- Reset no longer duplicates the board; the engine no longer leaks listeners on
  Inertia navigation; the store slug comes from props or the URL, not a literal;
  titles are HTML-escaped.

---

## Known limit

A 4×1 strip on a 4-column phone is ~330px, under the inline fit's 356px floor,
and has no second row to trade a column for. It degrades by priority instead —
window first, then the label — with the value intact. Giving the resolver the
ability to *add a row* when a pixel floor cannot be met would fix it properly,
at the cost of a board that re-flows its own row heights.

## Optional follow-up

`routes/web.php` renders `NewDashboard` with no props on the store route. Passing
the real `store` (with `slug`) and `auth` would let the page drop its URL
fallback. It works either way.

---

# Round 3 — 2 Sep 2026 · production pass

**Files:** `resources/js/Pages/NewDashboard.jsx`, `resources/js/Pages/NewDashboard.css` (only).
**Verified:** headless Chromium — 6 viewport widths (390→2100) × 3 themes (light / dark / mesh)
× a 34-card matrix covering every reading shape, every card family, floors, maxima and all
four tones: **0 content cut, 0 in-card scrollbars, 0 clipped values.** Add → persist →
reload → edit → delete → preset-switch all pass end to end.

## The no-clip contract

A number is never cut, anywhere, ever. `headlineOf` now carries both the full and the
abbreviated figure; every value lands through one `valueHTML()` with `data-full` /
`data-compact`, and `fitValues()` walks the board after every layout-affecting event
(draw, relayout, resize drag, period change, preview render) stepping each value down:
**full figure → abbreviated (Rs 4.8M) → abbreviated at a smaller rung.** Measured against
real layout, deterministic, no scrolling. The bank hub's boxes joined the same contract.
Hover re-reads honour the fitted form (`headCompact()`), so a crosshair can no longer
push a fitted headline past its box.

## The strip, settled

The old inline strip was a three-column grid that stranded the timeframe caption in the
middle of the card. The canonical form is now **two zones**: left stacks the label over a
quiet timeframe caption (both truncate), right is the number and its change pill, pinned
to the right edge, never shrunk. Stacked (2-row) form: label / number+pill / caption.
The app-level V6 `cards.css` still right-aligns a bare strip caption, so the page block
out-specifies it deliberately. The two later "patch layers" that re-declared strip layout
in this file are gone; one block owns it.

## Lists never scroll

Radial legends emit only the rows that fit and fold the rest into one quiet
"+N more in the full view" line. Table/feed capacity is counted at the real row pitch
(38px, was 32) and `.ck-tb` / `.ck-leg` are `overflow:hidden` — the belt to the counted
suspender.

## The wizard speaks user

- The folder launcher is gone. **Add card** (a real button now) opens one picker with
  three family tabs: *Metrics & charts · Smart panels · Shortcuts*.
- Every reading carries a hand-written plain-language description (`READING_DESC`, 110+
  entries) — the picker and the editor show the name and that sentence. **No backend key,
  no SCALAR/SERIES tag, no module name, anywhere a user looks.**
- Step 2 ("Make it yours") replaced the C1–C6 category tabs, fit names, column/row
  steppers and px readouts with a handful of **named sizes** (One-line / Compact /
  Standard / Large / Extra large) plus **drag-the-corner resize on the live preview** —
  the handle lives outside the re-rendered host, snaps through the Law's legality tables,
  auto-promotes the interior (a strip dragged taller becomes a metric with its sparkline)
  and a drag that ends over the overlay is squelched so it can't read as a close-click.
- Chart names: Stat→Number, Composed→Combo. "Visual variant"→"Style".

## Boards persist, and start from somewhere

- Every change writes to `localStorage` (`vq-dashboard-v6:<store-slug>`, schema v2) and
  comes back on the next visit. Unknown keys are dropped on load.
- **Starting layouts** (`PRESETS`): Retail overview (default), Money & accounts,
  Stock & purchasing, Start simple. "Reset layout" is now "Start fresh…" — a picker that
  says plainly it replaces the board.
- New library entries the old dashboard had and this one lacked: **Expense trend**
  (series) and **Recent activity** (feed).

## Also fixed on the way through

- `wirePeriod` wrote the new value into `.vqc-head-val .nf` — a selector no markup has
  emitted in weeks. Period changes now update value, delta pill and caption, and re-fit.
- The board subtitle no longer explains grid columns and crosshairs to shopkeepers.
- Preset modal, phone-width action bar wrap, identity description wraps instead of
  truncating.

## Known, accepted

- The app-level `venqore-v6/cards.css` still paints `.vqc--accent::before/::after` at
  300% width; it is clipped invisible by the card's `overflow:hidden` and only inflates
  scroll metrics, not paint. Left alone because it is shared chrome for other pages.
- The engine's legacy side-drawer editor (`openEdit`) is unreachable from the UI (the
  React editor owns the pencil); it still knows reading keys. Dead weight, not debt.

---

# Round 4 — 2 Sep 2026 · the platform pass

**Files:** the same two. **Verified:** sweep re-run (6 widths × 3 themes × 34-card
matrix — 0 violations), all 8 side-panel rails overflow-checked at 1360/1520/1920,
add → persist → edit → delete → preset e2e green.

## Two production bugs from the first live screenshot

- **The board touched the sidebar.** The 24px canvas margin lived on a
  `.vq-shell .app` selector this page never renders. `.vq-canvas` now carries
  `padding: 24px 24px 48px` itself — 24px of air on all four sides at every width.
- **Overlapping digits in the headline roller.** The digit columns slid by
  `translateY(-N × 10%)` — a percentage of the column, which is only correct while
  every digit row measures exactly 1em against the full app cascade. The slide is
  now written in the same unit the rows are sized in: `translateY(-N em)`, with
  `line-height: 1` pinned on the rows. The two can no longer disagree.

## The side panel (right rails)

The old dashboard's fixed right panel is back as an **opt-in, composable side
panel**: eight rail designs — Cash & accounts, Today at a glance, Recent activity,
Actions required, Quick actions, Growth & targets, Top performers, Payment
reminders — toggled from ⋯ → Side panel…, stacked in a fixed 312px column with
24px gutters, persisted per store. Needs ≥1360px; below that the cards take the
full width. While the panel is open the board's column count is re-derived from
its **measured** width and written as an inline `--vq-cols` (the stylesheet's
viewport media queries can't know about the panel), and removed again when it
closes.

## Module gating — the library fits the business

Every reading carries the module key(s) that produce its data (`READING_MODULE_RULES`,
same keys as `config/modules.php`). The engine takes the shared Inertia `modules`
prop at boot: a five-module kiryana sees ~56 cards instead of 112, area chips it
can't use disappear, hubs gate too (`bank_liquidity` needs `bank_accounts`),
presets and saved boards silently drop cards whose module is off, and alert rows
inside the alerts hub and alerts rail filter individually. No prop → no gating
(dev harness, store-less route).

## The real left sidebar

When the shared `nav` prop is present the sidebar is **derived from it** — same
contract, groups and lucide icon names as QoreShell (`Catalog / Sell / Stock /
Buy / Make / Money / Grow`), Ziggy-guarded hrefs — so this shell can never
disagree with the module switches. The hardcoded groups remain only as the
fallback for the store-less route.

## Presets: six, drawn, and one for migrants

The preset picker now shows a **layout thumbnail per preset** (the grid's own
auto-placement simulated at 8 columns) plus which side panel it ships with.
New: **Familiar (like the old dashboard)** — KPI strips on top, trend + alerts
mid, top products + recent purchases below, Cash & accounts + Recent activity
rails: the migration path for old-dashboard users. And **Command centre** — the
revenue chart front and centre. Applying a preset sets the board AND its panel.

## Also

- **Launchpad** — a second operations hub with a fixed four actions at every
  size, for people who found the growing-lane hub unsettling. The original hub's
  description now says plainly that it grows.
- New library cards: **Total Liquid Net**, **Recent purchases** — and the bank
  figures (Total Balance, Cash on Hand) were already standalone readings, so
  every number in the liquidity hub can now live as its own card.
- Alert copy, hub rows and rails all speak module-aware truth.

---

# Round 5 — 2 Sep 2026 · light-first, one panel, honest numbers

**Verified:** sweep 6 widths × 3 themes — 0 violations; e2e green; sticky panel,
collapse, theme cycle and mesh ground all screenshot-checked.

- **Numbers are plain text now.** The per-digit rolling columns survived one
  production cascade bug and immediately met another; the mechanism was fragile
  by construction (every digit row had to measure exactly 1em against whatever
  CSS the app ships next). `buildRoller`/`setRoller` keep their API but render
  plain tabular text with a 340ms opacity pulse on change. A number that is
  always readable beats one that sometimes dances.
- **Light is the default, and the theme is React state.** The engine no longer
  binds the theme button. `themeMode` (light → dark → mesh, persisted per
  browser as `vq-dashboard-v6-theme`) writes `data-theme`/`data-bg` and asks the
  engine to repaint. The button shows sun / moon / sparkle per mode. The mesh
  ground was invisible in-shell (its fixed layer sat at z −1 behind the body's
  own background); the shell now lifts to z 1 over a z 0 mesh.
- **Inner surfaces are tints, not slabs.** Everything that sits inside a card —
  alert rows, bank boxes, hub buttons, rail minis — shares one recipe: on dark,
  4.5% white fill with a 7% hairline; on light, the sunken tone with a soft
  hairline; 14px corners everywhere, per the shape law.
- **The side panel is ONE container** (like the old dashboard's): a single
  surface with a header row (Customize · collapse chevron) and the rails as
  divided sections inside. It is **sticky by default** — full viewport height,
  its own inner scroll — with options in the Customize sheet: width (Cosy 300 /
  Comfortable 340 / Wide 380) and Stays-in-place vs Scrolls-with-cards. The
  chevron collapses it to a slim reopen tab; everything persists
  (`{ids, sticky, width, collapsed}`, old array payloads migrate).
- **Quick actions rail = the old three:** New Invoice (primary), New Purchase,
  More actions (opens the Quick Actions sheet).
- **The "Your dashboard" header block is gone.** Cards start 24px below the app
  header; the page breadcrumb already names the place. ~90px of height returned
  to the board.
- **Nav groups fold.** Every derived group (Catalog / Sell / Stock / Buy / Make /
  Money / Grow) collapses from its header, remembered per browser; Main and
  System stay pinned open, POS is pinned into Main when the module is on, and a
  System → Settings entry closes the sidebar.

---

# Round 6 — 3 Sep 2026 · the grid settles, the panel becomes a product

**Verified:** sweep 6 widths × 3 themes × 34-card matrix — 0 violations (one tile
truncation-priority bug found by the sweep and fixed); add → persist → edit →
delete → preset e2e green; free placement, panel designs, mesh, and the fixed
grid all screenshot-checked.

## The grid is a fixed 12 columns
Collapsing the nav or opening the side panel now STRETCHES/SQUEEZES the same
twelve tracks — the arrangement never re-flows. Only real device classes step
down: 8 columns under 1024px, 4 under 600px. The per-nav-state column ladders
are gone from both the stylesheet and the engine. Presets are composed for 12
and every band sums to 12 — symmetric at any width; on the 8-column tablet the
composition scales by 8/12.

## Place any card anywhere
In edit mode the whole card face is a drag handle (the grip still works
everywhere). While dragging, a dashed ghost shows the snapped 12-column cell;
dropping pins the card there (`gx`/`gy`), pinned cards keep their spot, unpinned
cards flow around them, and collisions nudge to the next free row. Phones and
tablets ignore pins and stack in order — a desktop arrangement is never forced
onto a screen that cannot hold it. Presets clear pins.

## Six pre-built side panels, pick one
The compose-your-own rail toggles are gone. `PANEL_DESIGNS`: **Money desk**
(the old dashboard's panel — Sale/Purchase/Actions round buttons, cash &
accounts, activity), **Operations desk**, **Sales pulse**, **Credit control**,
**Growth**, **Minimal**, plus "No side panel". The panel is one deep container
(sunken in light, near-black in dark, glass over mesh) with each rail as its own
rounded card inside — the old dashboard's look. The in-panel Customize button
and the floating collapse tab are gone: a panel icon in the top header toggles
it, and ⋯ → Side panel… opens the chooser (width and sticky options live there).

## Mesh, blended
The legacy rule that painted every card BODY as its own lighter box in mesh is
deleted; inner pieces in mesh now sink darker into the glass
(`rgb(0 0 0 / .25)` + hairline) instead of floating lighter on it.

## Answers of record (theming)
- **Accent colour**: one place — `resources/css/venqore-v6/tokens/colors.css` /
  `theme.css`. Every accent in this page resolves through `var(--vq-accent…)`
  (all 10 hex occurrences are var() fallbacks only).
- **Corner radius**: one place — `tokens/radius.css`; every rung resolves to
  `--vq-r-*`. Change `--vq-r-md/lg` and the whole product follows.
