# VenQore Design Rules — v3.0

**Supersedes v2.0 (18 Aug 2026) in full.** Every *value* in v2.0 was wrong. Every
*structure* in v2.0 was right. This document keeps the structures and replaces the
values with V6.

It is written to be enforced by an agent, not admired by a human. Every rule is
checkable, and most of them are checkable with `grep`.

---

## 0. Precedence — read this before you resolve any disagreement

Three documents govern the look of this product. When they disagree, this is the
order:

| Rank | Document | Owns |
|---|---|---|
| 1 | **`VENQORE_LAYOUT_LAW.md` v2.0** | Geometry. Grid, gutters, row track, breakpoints, card fits, shell regions, nav thresholds |
| 2 | **The V6 design system** — `extras/Design System/VenQore Design System/tokens/*.css` | Values. Colour, type, radius, elevation, motion, density |
| 3 | **This file** | Structure. Z-index, hover contract, component contracts, chart rules, the marketing/product line, CI enforcement |

Rank 3 never overrides rank 1 or 2 on a value. Rank 3 exists for everything ranks
1 and 2 do not say.

**Anything not in one of those three is not a rule.** `venqore.tailwind.js`,
`VENQORE_CARD_BUILDER_BUILD_SPEC.md` §7.2 and `resources/css/venqore-tokens.css`
are all superseded artefacts. See §17.

> **Naming note.** The V6 design system's own file comments call it "v5"
> (`radius.css`: *"v5 shape: soft and chunky"*). The folder also ships
> `VenQore Design System v5.html`. **"V6" and "v5" name the same token set** —
> the one with `--vq-r-lg: 20px`, Plus Jakarta Sans and `--vq-dur-1: 120ms`.
> The values are the identity, not the label.

### What v2.0 got wrong

v2.0 was written from an audit of the app, and it codified a token set that the
V6 design work had already replaced. These are the conflicts, all resolved in
V6's favour:

| | v2.0 said | **V6 says — this is the law** |
|---|---|---|
| Card radius (`--vq-r-lg`) | 14px | **20px** |
| Radius base (`--vq-r-md`) | 10px | **14px** |
| Radius ceiling | 24px (`2xl`) | **36px** (`2xl`), with `xl` at 28px |
| Radius floor (`xs`/`sm`) | 4px / 6px | **8px / 12px** |
| Brand chroma | 0.071 — deliberately quiet | **~0.13 at the 400 step — deliberately hot** |
| Teal 500 | `#327882` | **`#0BAA8F`** |
| Neutrals | true grey | **green-cast ink** (160° hue) |
| UI / body face | Inter | **Plus Jakarta Sans** |
| Display face | Inter | **Bricolage Grotesque** |
| Numerals | JetBrains Mono | **Space Grotesk** |
| Weight ceiling | 600 | **700** (`--vq-fw-bold`) |
| Display size | 60px | **56px** (plus a 76px `hero`) |
| Motion vocabulary | `instant/fast/base/slow` 100/180/280/480 | **`--vq-dur-1..4` 120/200/320/520** |
| Easing | `cubic-bezier(.16,1,.3,1)` | **`cubic-bezier(.22,1,.36,1)`** + two springs |
| Series slot 1 | `#0091A0` | **`#0BAA8F`** (all eight slots differ) |
| Elevation | single-part shadows | **two-part: contact + bloom**, plus `--vq-glow-accent` |
| Dark surface | `#12141A` neutral | **`#141B19` near-black green** |
| Light page | white | **`#F1F5F2` — never pure white** |
| Charts | recharts | **bklit** (see §12) |

### What v2.0 got right and this document keeps

The z-index ladder (§3), the hover contract (§9), never-encode-in-colour-alone
(§1 law 4), the marketing/product line (§14), the component contracts (§13), the
CI grep checks (§16), and the observation that *the token system was never the
problem — components bypassing it was*.

---

## 1. The five laws

1. **No raw values in components.** No hex, no `px` radius, no `z-[…]`, no
   `duration-[…]`. If the value you want is not a token, the system is missing a
   token — add it to the V6 token files first, then use it.
2. **Teal is the brand, and V6 teal is loud.** Primary actions, active states and
   focus are teal. Nothing else is teal. v2.0's low-chroma teal is gone; V6 runs
   the brand hot on purpose and keeps the neutrals faintly green so saturated
   teal never looks pasted on.
3. **Module colour is wayfinding. Semantic colour is data. Playmates are
   delight.** Three systems, three jobs, they never swap. See §5.
4. **Nothing that means anything is encoded in colour alone.** A negative figure
   gets a minus sign *and* parentheses. A status chip gets an icon *and* a word.
   A delta gets a glyph *and* a number. Roughly 1 in 12 men cannot reliably
   separate your red from your green.
5. **Marketing may be expressive. The product may not.** The hero gradient, the
   fluid canvas, the ambient drift — public pages only. Inside the app the only
   motion is state feedback.

---

## 2. Tokens — one source, and the bridge that makes it reach Tailwind

### The source

`extras/Design System/VenQore Design System/tokens/` — nine files, loaded in the
order `_ds_manifest.json → globalCssPaths` declares. 286 resolved tokens. This is
the only place a value is allowed to be typed.

```
tokens/fonts.css       @import of the three Google faces
tokens/colors.css      raw ramps — teal, ink, playmates, series, seq, div
tokens/typography.css  faces, sizes, line-heights, tracking, weights
tokens/spacing.css     space scale, control heights, layout dims, z ladder
tokens/radius.css      the seven radii
tokens/elevation.css   four levels + inset + accent glow + focus ring
tokens/motion.css      four durations + four easings + stagger
tokens/theme.css       the semantic layer, light and dark
tokens/base.css        the handful of globals
```

### The bridge — this is the part that is currently broken

Tailwind does not read `--vq-r-lg`. It reads `--vq-radius-lg`, because
`tailwind.config.js` maps every utility through `resources/js/theme/contract.js`.
Those two names are not the same token and never have been.

```
V6 tokens/*.css              --vq-r-lg: 20px        ← the law
resources/css/venqore-tokens.css  --vq-r-lg: 14px   ← superseded, delete
resources/css/theme.generated.css --vq-radius-lg: 0.5rem  ← what actually renders
```

**`rounded-lg` renders at 8px today.** Not 14, not 20 — 8, because the generated
theme was never given design-system values and still carries stock Tailwind
defaults. The same is true of `--vq-duration-*` (150/250/400ms — stock) and
`--vq-ease-standard` (`cubic-bezier(.4,0,.2,1)` — stock Material).

**The rule this creates:** V6 is the source, and the generated theme is derived
from it, never authored beside it. A value that exists in
`resources/js/theme/themes/*.js` and disagrees with the V6 token files is a bug
in the theme file, always. See §17.

### The consequence, which is the good news

Because `tailwind.config.js` resolves every colour, radius, shadow, duration and
spacing utility through a CSS variable, **correcting the generated theme restyles
all 312 pages without editing one line of JSX.** `bg-slate-800` (4,949 uses) and
`bg-indigo-600` (1,345 uses) are not colours; they are lookups. Redefine the
lookup and every usage follows.

The wart is real: a class can say "indigo" while rendering teal. The answer is
the role aliases — `bg-surface`, `text-ink`, `bg-brand-600` — which new code must
use and old files adopt opportunistically. Both vocabularies resolve to the same
tokens, so the cleanup never has to be a big bang.

---

## 3. Z-index: the only legal ladder

Unchanged from v2.0. V6's `tokens/spacing.css` declares the same twelve values,
so there is no conflict — v2.0's `debug` step is the only addition and it never
ships.

```
base      0     page content
raised   10     hover-lifted card, sticky first column
sticky  100     sticky table header, sticky section bar
nav     200     app top bar
rail    300     left sidebar
dropdown 400    select, combobox, autocomplete, context menu
drawer  500     right panel, filter drawer, cart      (scrim 499)
modal   600     dialog, confirm                        (scrim 599)
popover 700     popover anchored inside a modal
tooltip 800     always above the thing it describes
toast   900     must clear an open modal
command 1000    command palette / global search
debug   9999    dev only, never ships
```

**Why this order.** Roughly: how much of the screen a thing owns, then what has
to be dismissable on top of what. A tooltip outranks a modal because you can have
a tooltip *on* a modal. A toast outranks both because a "Saved" confirmation that
appears behind the dialog that triggered it is worse than useless.

**Three rules that prevent the next 31 values:**

- Every scrim is its owner's level **minus one**. Never a separate number.
- If a thing is invisible, check for an `overflow-hidden` ancestor **before**
  touching z-index. Clipping is not a stacking problem and z-index cannot fix it.
  This is the single most misunderstood thing about z-index and it is the reason
  half the 31 values in the app exist — someone kept raising the number to fix a
  problem that was never a stacking problem.
- Anything that must escape its container — tooltip, dropdown, popover — is
  **portalled to `<body>`**. Not raised. Portalled. The app already ships
  `@headlessui/react`; use its `Portal`.

**Migration is mechanical:**

| Old | New |
|---|---|
| `z-0`, `z-[5]` | `z-base` |
| `z-10`, `z-20`, `z-30` | `z-raised` |
| `z-40`, `z-[55]`, `z-[60]`, `z-[70]`, `z-[75]` | `z-sticky` or `z-nav` — read the component |
| `z-50` on a nav/sidebar | `z-nav` / `z-rail` |
| `z-50` on a dropdown | `z-dropdown` |
| `z-[80]`…`z-[120]` | `z-drawer` or `z-modal` |
| `z-[150]`, `z-[151]`, `z-[200]`, `z-[201]`, `z-[210]` | `z-modal` (+ `z-modal-scrim`) |
| `z-[300]`, `z-[301]`, `z-[999]`, `z-[1500]`, `z-[2000]` | `z-tooltip` or `z-toast` |
| `z-[9998]`…`z-[99999]` | `z-command`, or delete — these are almost all "I gave up" |

---

## 4. Colour — the ramps

Verbatim from `tokens/colors.css`. Nothing here is a preference.

### Qore Teal — the brand. Mint at the top, deep pine at the bottom.

```
50  #E6FBF5    300 #59DBC0    600 #088975    900 #0B3A35
100 #C6F5E9    400 #23C4A6    700 #076B5E    950 #062421
200 #93EBD6    500 #0BAA8F    800 #0A5049
```

v2.0 capped brand chroma at 0.071 and the product read grey. V6 runs the brand
hot — chroma ~0.13 at the 400 step — and keeps the neutrals faintly green so
saturated teal never looks pasted on. **That is a deliberate reversal, not drift.**

### Ink — neutrals with a 160° cast, so they sit *with* the teal

```
0   #FFFFFF    100 #E6ECE8    400 #8B9A93    700 #3C4841    950  #0D1412
25  #F8FAF8    200 #D3DCD7    500 #6B7A73    800 #29332D    1000 #060A09
50  #F1F5F2    300 #B4C0BA    600 #536159    900 #17201B
```

Never substitute a Tailwind grey. `slate`, `zinc`, `neutral` and `stone` are all
true-neutral and will read cold against this teal.

### Playmates — three warm counterpoints and one cool

`lime` · `coral` · `butter` · `sky` · `plum`, each at 100/300/400/500/700.

Used for delight and for categorical data. **Never for good/bad meaning** — that
is the semantic system's job, and a lime that sometimes means "pass" and
sometimes means "category 5" means nothing.

### Semantic — state

| Role | Light | Dark | Means |
|---|---|---|---|
| success | `#12855C` | `#4BD99B` | posted, reconciled, in stock, passing |
| warning | `#A6690A` | `#F7C05A` | low stock, nearing expiry, needs approval |
| danger | `#C4443A` | `#FF8A7E` | out of balance, failed, overdue, destructive |
| info | `#1B7096` | `#7BD4E6` | neutral system notice |

Each ships with a `-bg` wash and a `-line` border. On dark these become low-alpha
washes, never the light pastels flipped.

Never use teal to mean "good" and never use semantic green as a brand accent. The
moment a user learns green means *reconciled*, a green button becomes a lie.

### Surfaces

**Light is not white-on-white.** The page is `#F1F5F2` — a soft green-grey — and
cards are pure `#FFFFFF`, so every card floats. That contrast is where the
liveliness comes from; v2.0 put grey cards on a white page and everything sank.

**Dark is selected, not inverted.** Surfaces are near-black green (`--vq-surface:
#141B19`), never neutral grey. Text is off-white. Mint appears only on things you
can act on. An earlier dark mode failed because everything was green — green
surfaces, green text, green chrome.

### Module accents — wayfinding

Eleven modules. Chroma capped **below every semantic colour** so an alert always
out-shouts the furniture. Accounting wears the brand teal because the double-entry
engine *is* the moat. Platform is neutral ink because admin chrome should be quiet.

| Module | Covers |
|---|---|
| `accounting` | Ledger, banking, reconciliation, payments, tax |
| `reports` | Reports, dashboards, exports, scheduled sends |
| `sales` | POS, invoices, sales orders, returns, quotes |
| `inventory` | Products, stock ops, batches, serials, transfers |
| `purchasing` | Purchase orders, suppliers, debit notes, expenses |
| `parties` | Customers, contacts, reminders, loyalty |
| `staff` | Users, roles, attendance, shifts |
| `production` | BOM, work orders, assemblies, wastage |
| `growth` | Campaigns, growth engine, proposals, pre-sales |
| `channels` | VenSynQ, WooCommerce, Amazon, eBay, storefront |
| `platform` | Settings, billing, licences, super admin, HQ |

**The hard rule, and it is the one that keeps this from becoming a circus:**

> A module accent never appears inside a data region. Not in a table cell, not in
> a chart, not in a status chip, not on a KPI figure. It lives in chrome: sidebar
> item, page-header rule, module badge, breadcrumb, empty-state art. Nothing else.

At most **three** module-accented surfaces per screen. A page tinted end-to-end in
violet is not wayfinding, it is a theme.

> **Settled 21 Aug 2026 — module colour does not ship.**
>
> V6 provides ramps for teal, ink and five playmates. It provides **no module
> ramps**, and none will be improvised.
>
> On the three surfaces above, a module is identified by **its icon and its
> label**, rendered in `--vq-text-2` / `--vq-accent` like everything else. There
> is no eleventh hue and no per-module tint. The eleven-module table stays in this
> document because it is the correct *taxonomy* — it is what a module *is* — and
> because if ramps are ever commissioned they drop into those same three surfaces
> without un-doing anything.
>
> Anyone reaching for a module colour today is reaching for a hue that does not
> exist. Improvising one is exactly how this codebase reached 6,726 indigo classes.

---

## 5. Data colour

### Categorical — eight slots, fixed order, never cycled

| Slot | Light | Dark | |
|---|---|---|---|
| 1 | `#0BAA8F` | `#2CD3B3` | brand teal |
| 2 | `#F26A47` | `#FF8A6B` | coral |
| 3 | `#2BA5D1` | `#55C4EC` | sky |
| 4 | `#F5B32E` | `#FFCD5B` | butter |
| 5 | `#8CCB2E` | `#A9E34B` | lime |
| 6 | `#B266A8` | `#C98BC9` | plum |
| 7 | `#0B3A35` | `#C6F5E9` | pine / mint |
| 8 | `#8B9A93` | `#8B9A93` | ink |

Slot 1 is the brand hue, so the first series in every chart is VenQore teal.
A ninth series folds into "Other", becomes small multiples, or the chart is wrong.

> **Known correction, already applied in the card work.** `--vq-series-1`
> (`#0BAA8F`) measures **2.93:1** on a white card — under the 3:1 floor for a data
> mark. Light mode uses `--vq-series-1-ink` (teal-600, 4.33:1) for marks; dark
> keeps series-1 at 7.58:1.

**Scatter, bubble, choropleth and small multiples cap at three series** — in those
forms any two marks can end up adjacent, which is a strictly harder test than
eight colours can pass. More than three: fold to "Other", or facet.

### Sequential — magnitude, one hue

Light `#C6F5E9 → #59DBC0 → #0BAA8F → #076B5E → #0B3A35`. Dark runs the reverse.

### Diverging — polarity, two hues with a **neutral** midpoint, never a hue

`#C4443A · #F0A79E · #E6ECE8 · #6FDCC3 · #088975`

Never a categorical slot for magnitude or polarity.

---

## 6. Type

Three faces, three jobs.

| Face | Role | Token |
|---|---|---|
| **Bricolage Grotesque** | Display voice — h1/h2/h3, hero, marketing headlines | `--vq-font-display` |
| **Plus Jakarta Sans** | UI and body — every label, every paragraph, every control | `--vq-font-sans` |
| **Space Grotesk** | Numerals, eyebrows, code, version numbers, counts | `--vq-font-numeric` / `--vq-font-mono` |

**Display voice is opt-in.** Bricolage on headings, **never on UI labels**. A
button that wears the display face is a fail.

| Role | Size / line / tracking | Weight |
|---|---|---|
| hero | 76 / 0.98 / −3.8% | 600 — marketing only |
| display | 56 / 1.02 / −3.2% | 600 |
| h1 | 40 / 1.08 / −2.8% | 600 |
| h2 | 30 / 1.16 / −2.4% | 600 |
| h3 | 21 / 1.30 / −1.6% | 600 |
| lede | 19 / 1.55 / −0.8% | 400 |
| body | 16 / 1.60 / −0.2% | 400 |
| small | 14 / 1.50 / 0 | 400 |
| caption | 13 / 1.45 / 0 | 400 |
| metric | 38 / 1.00 / −3.0% | Space Grotesk, tabular |
| metric-sm | 26 / — | Space Grotesk, tabular |
| eyebrow | 11 / 1.20 / +12% uppercase | 500, Space Grotesk |

- **Weights 400 / 500 / 600 / 700.** `--vq-fw-bold` (700) is legal in V6 —
  this reverses v2.0. **800 and 900 are not.** `font-extrabold` and `font-black`
  are still failures.
- **Metric values are 38px or 26px. No other size.** A KPI figure at 32px is a
  fail even if it looks fine.
- **`font-variant-numeric: tabular-nums` on every number that means money, stock
  or a count.** Proportional figures in a money column are a typo you can see
  from across the room. `html` also sets `ss01` and `cv11` globally.
- **Plus Jakarta Sans ships a 0.17em word space** where ~0.25em is normal. At
  13–14px words run together. Corrected with `word-spacing: 0.08em` — this is in
  the system, do not remove it.
- Measure `--vq-measure: 68ch` on prose.

---

## 7. Shape

```
none   0px
xs     8px   checkbox, cell chip
sm    12px   badge, tag, tooltip, small inner tile
md    14px   BASE — input, select, menu item
lg    20px   card, panel, dropdown surface, button
xl    28px   modal, drawer, big feature tile, KPI card
2xl   36px   CEILING — hero card, app frame
full 999px   pill, avatar, toggle, tab pill, icon button
```

V6's shape is *soft and chunky*: v2.0's 10px base read like a bank form, and the
register this product wants lives between 14 and 28.

**Nothing above 36px except `full`.** `rounded-3xl`, `rounded-[3.5rem]` and every
arbitrary value are removed from the Tailwind config, so they stop compiling. That
is the migration signal, not a bug.

**Nesting rule:** inner radius = outer radius − inner padding. A 20px card with
16px padding takes a 4px inner element — round it to `xs` (8px) only if the
padding is 12px or less. A nested panel inside a card is `--vq-r-md` (14px); at
20px it reads as a second card.

**Two radii on a dashboard card, and only two: 20 and full.** No 8, no 12, no 28
anywhere on a card face. A third radius on one card is a fail. (Mechanism M4.)

**Chart marks are geometry, not surfaces** — bar caps use a 6px mark radius and are
exempt from this scale.

---

## 8. Elevation

Four levels. Two-part shadows: a tight contact shadow plus a wide soft bloom.

| Level | Light | Dark |
|---|---|---|
| 0 flat | `none` — 1px `--vq-line` instead | `none` — 1px `rgb(255 255 255/.10)` |
| 1 card | `0 1px 2px /.05, 0 2px 8px -4px /.06` | `0 1px 0 rgb(255 255 255/.04)` |
| 2 raised | `0 1px 2px /.05, 0 10px 24px -10px /.12` | + `0 12px 28px -14px rgb(0 0 0/.7)` |
| 3 overlay | `0 2px 4px /.06, 0 24px 56px -16px /.20` | + `0 28px 64px -20px rgb(0 0 0/.8)` |

All light shadows are `rgb(13 20 18 / …)` — the ink-950 hue, not black.

**In dark mode, elevation is carried by surface lightness first** (`#0C1211` page
→ `#141B19` card → `#1D2624` raised) and by a 1px top highlight second. A black
shadow on a near-black background is invisible, and reaching for one anyway is the
most common dark-mode mistake in existence.

**One deliberate coloured light exists in the whole system:** `--vq-glow-accent`
/ `--vq-glow-accent-strong`, on primary buttons and the one accent-filled KPI
card. Every other shadow is neutral. A teal-tinted shadow anywhere else looks like
a mistake at 100% zoom and a bug at 200%.

`--vq-ring-focus` is the focus bloom. `--vq-elev-inset` is the top highlight.
**1px border *or* a shadow, never both.**

---

## 9. Motion

V6 motion has a pulse. Things arrive with a little overshoot, settle, and never
wobble twice.

| Token | Duration | Applied to |
|---|---|---|
| `--vq-dur-1` | **120ms** | hover colour, focus ring, instant feedback |
| `--vq-dur-2` | **200ms** | buttons, chips, small state changes |
| `--vq-dur-3` | **320ms** | dropdowns, tabs, accordions |
| `--vq-dur-4` | **520ms** | drawers, modals, chart draw-in, scroll reveals |
| `--vq-dur-amb` | 9000ms | ambient drift — **marketing only, never in a card** |

| Easing | Curve | Use |
|---|---|---|
| `--vq-ease-out` | `cubic-bezier(.22, 1, .36, 1)` | everything that is not an entrance |
| `--vq-ease-in-out` | `cubic-bezier(.65, 0, .35, 1)` | symmetric moves |
| `--vq-ease-spring` | `cubic-bezier(.34, 1.56, .64, 1)` | entrances, toggles, chips, counters |
| `--vq-ease-spring-soft` | `cubic-bezier(.32, 1.28, .5, 1)` | the gentler entrance |

`--vq-stagger: 60ms` between items in a revealed group.

**Springs are for entrances, toggles, chips and counters. Colour and hover changes
stay on `--vq-ease-out` so they feel instant.** A spring on a hover colour reads as
lag.

**Any duration outside those four is a fail.** `duration-300` is not 320.

### The hover contract

The app has **182** `hover:scale-*` usages in Pages, seven of them `scale-150`.
This is one rule, applied everywhere:

| Element | Hover response |
|---|---|
| Button | background darkens one ramp step + `translateY(-1px)` |
| Card / tile | border colour + elevation 1 → 2. **No transform** |
| Table row | background → `--vq-sunken`. Nothing else |
| Sidebar / nav item | background + text colour. **Never a transform** |
| Icon (standalone) | colour only. **Never scale** |
| Icon (inside a button) | inherits the button. No independent hover |
| Link | colour + underline |
| Avatar / chip | ring appears. No scale |
| Media thumbnail | the **image** scales inside a fixed-ratio `overflow-hidden` frame — the only legitimate scale-plus-clip in the system |

**Never scale a button on hover** — it makes the layout feel unstable, and at
`scale-150` it makes the layout feel broken.

**Never scale anything whose parent has `overflow-hidden`,** unless the clipping
*is* the effect (the media-thumbnail row above). Everywhere else,
`overflow-hidden` + `scale` is the sidebar clipping bug, 182 times.

### Never animate

- A number counting up on a financial figure. It reads as a slot machine.
- Anything that shifts layout after paint.
- Ambient loops below the fold, or anywhere inside the product.
- A card on hover, by transform, ever.

### Charts draw in on mount

The line traces, the wash fades up behind it, once, inside `--vq-dur-4`. Nothing
loops. Nothing bounces twice. A chart library whose loading shimmer does not match
`--vq-dur-*` is a fail even if it is objectively a nice chart.

### Theme switching is instant

A colour transition bound to a theme custom property can be left painted at the
*old* theme's resolved value. The toggle adds `.vq-theming` to `<html>`, flips
`data-theme`, and removes it on the next frame. That class kills every transition.
Do not remove it.

### `prefers-reduced-motion`

Reveals become instant opacity fades; charts render their final frame with no
draw-in; ambient loops stop. One media query — it is in `tokens/base.css` — and it
is an accessibility requirement, not an option.

---

## 10. Geometry — from the Layout Law, which outranks this file

```
size(n) = n·UNIT + (n−1)·GUTTER      UNIT = 64px vertical, GUTTER = 24px both axes
```

| Rows | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 12 |
|---|---|---|---|---|---|---|---|---|
| Height | 64 | **152** | 240 | 328 | 416 | 504 | 680 | 1032 |

The gutter is part of the **pitch**, not something added between cards. CSS Grid
computes this natively from `gap`. **Never `margin-bottom`** — that alone was the
documented alignment bug that made a 2-row card 128px while two stacked 1-row
cards were 152px.

Twelve columns. Shell regions: nav 264 expanded / 72 rail / 0 hidden; header 64
(`header_h == row` — one number, two jobs); subnav 224; content the remainder at
16–24px margin. Nav push threshold **1216px**.

> ⚠️ **Three live conflicts between V6 `tokens/spacing.css` and the Layout Law.**
> The Layout Law wins all three. These are defects in the token file and must be
> corrected there:
>
> | Token | Says | Layout Law says | |
> |---|---|---|---|
> | `--vq-gutter` | 20px | **24px** | breaks `size(n)`; every card height drifts |
> | `--vq-topbar-h` | 68px | **64px** | breaks `header_h == row` |
> | `--vq-rail-w` / `-min` | 248 / 76 | **264 / 72** | breaks the nav ramp |
>
> Until they are corrected in the token file, code reads the Layout Law numbers.

### The six card categories — the only legal sizes

| Cat | Role | Max | Fits (cols×rows @ width floor) |
|---|---|---|---|
| **C1 Tile** | Shortcut, quick action, single-glyph stat | 3×2 | **2×1 ≥124** · 1×1 ≥52 |
| **C2 Strip** | One KPI on one line — label left, value right | 6×2 | **4×1 ≥356** · 3×2 stacked ≥200 |
| **C3 Metric** | KPI with delta, sparkline or comparison | 6×4 | 4×3 ≥386 · **3×2 ≥274** · 2×2 ≥200 · 2×3 ≥163 |
| **C4 Panel** | Ranked list, breakdown, small chart, table excerpt | 6×6 | 4×4 ≥492 · **3×4 ≥356** · 3×5 ≥200 · 2×6 ≥200 |
| **C5 Board** | Full chart, multi-series, wide table | 12×9 | **6×6 ≥593** · 5×7 ≥415 · 4×8 ≥295 |
| **C6 Canvas** | Hero chart, P&L, cohort grid, map | 12×16 | **8×8 ≥733** · 6×10 ≥533 · 4×12 ≥295 |

Bold is the default fit. There is no separate "minimum size" — the leanest fit
*is* the minimum. **A card widens before it degrades**, and only drops to a leaner
fit when widening is exhausted; degrading trades a column for a row and re-lays
its inside.

Rendering a card outside its category's declared fits is a fail. So is rendering a
fit at the wrong row span.

> `VENQORE_CARD_BUILDER_BUILD_SPEC.md` §7.2's `small 3×2 / medium 6×2 / large 6×4
> / full 12×3` is **superseded**. So are the twelve `2x4 … 8x8` presets currently
> hardcoded in `DashboardBuilderSheet.jsx` and `DashboardSanitizer.php`.

---

## 11. The card — seven mechanisms

Binary checks against rendered output. No scores.

**M1 · One filled card per grid, and it is the most important number.**
Exactly one card on a surface carries a solid accent fill with inverted text.
Every other card is plain surface with a hairline. Fail at 0. Fail at ≥2. Pass
only at exactly 1, and only if it is the headline metric.

**M2 · Three type sizes in the number block. Never two, never four.**
Eyebrow 11px uppercase `--vq-text-3` → value 38px or 26px Space Grotesk tabular →
unit (`Rs`, `%`, `items`) at ≤50% of the value, demoted, baseline-aligned. The
label-to-value jump is **≥2.3×**. Nothing sits between them.

**M3 · Delta is a pill with a glyph, and it is the smallest thing on the card.**
`▲ 8.2%` on a tinted pill, then plain context (`vs last month`) beside it at
`--vq-text-3`. The pill carries semantic colour; the context sentence never does.
Fail on colour-only. Fail if the delta is larger than the unit.

**M4 · Two radii on a card. Twenty and full. No third.**

**M5 · Chart ink: one hue, horizontal-only dashed grid, no spines, no Y labels.**
One accent + neutrals in the plot area. Gridlines dashed and horizontal only. No
axis spine. No Y-axis tick labels. X labels bare at `--vq-text-3`. A bar chart
colours **one** bar teal and leaves the rest neutral. A rainbow fails.

**M6 · Dark mode is a re-render, not an inversion.**
Near-black green surfaces, never neutral grey. The accent card *blooms* — it gains
`--vq-glow-accent`, which the light version does not have. Semantic tints become
low-alpha washes, not the same pastels flipped.

**M7 · Motion is one of four durations and resolves in one direction.**
Every transition lands inside 520ms and settles once.

### The number ladder

`full4 → full2 → full → grouped → abbr2 → abbr1 → abbr0 → bare`

Currency drops first, then decimals, then magnitude. Full precision belongs in
the ledger, **never on a dashboard card**. The exact value is always one hover
away. **A value must never overflow, clip or ellipsize its card — it steps down
the ladder instead.**

### The rank law — action budget

| Rank | Lives | Budget |
|---|---|---|
| 1 · Act | visible on the working surface | **max 7** |
| 2 · Adjust | one gesture away, contextual | unbounded |
| 3 · Configure | settings drawer only | **0** |

A card exposes at most its rank-1 actions at rest. Configure never sits on the
card face.

---

## 12. Charts

### One library

The app currently ships **recharts 3.6**, **eleven `@visx/*` packages**, and
**`d3-array` + `d3-shape`**. Three ways to draw a bar means three sets of colour
defaults, three tooltip behaviours, three axis styles — which is most of why
reports look unrelated to each other.

**Settled 21 Aug 2026: the chart layer sits behind one adapter, and the library
choice is deferred.**

```
Dashboard/charts/*.jsx  →  <Chart shape= data= variant= />  →  adapter
                                                                ├── recharts  (today)
                                                                └── bklit     (later)
```

**The adapter owns everything this document cares about**, so no library gets an
opinion about it: the eight `--vq-series-*` slots in fixed order, the sequential
and diverging ramps, the M5 ink law, the M7 motion law, the number ladder on every
axis and tooltip, and the mandatory table view. Swapping the library becomes a
one-file change instead of a re-migration.

**Two `bklit-bridge.css` files exist and they are not the same file.**
`extras/Cards/v6/bklit-bridge.css` (5,649 B) is the full V6 translation of all 41
variables bklit reads, including motion — **not installed**.
`resources/css/bklit-bridge.css` (879 B) is a minimal stub mapping series tokens
onto `--chart-1..5` — imported at `app.css:7` and shipping. Replace the stub with
the full bridge.

bklit itself is absent: `components.json` registers `@react-bits` only, the
`@bklit` namespace is missing, and `Components/Bklit/Charts.jsx` is a separate
hand-rolled implementation, not the library.

**The gate, when bklit is evaluated:** a bklit chart that arrives with its own
palette, its own tooltip chrome, its own axis spines, or a shimmer that is not
`--vq-dur-*` is a fail even if it is objectively a nice chart.

Meanwhile recharts drives the adapter, `@visx/*` is quarantined to the one
component that genuinely needs custom scales, and `d3-array` / `d3-shape` stay as
transitive deps, never imported directly. **Do not add a fourth library.**

### Chart binding legality

A chart may only render a shape it is legal for:

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

### Chart rules

- **Never a dual-axis chart.** Two measures of different scale → two charts, small
  multiples, or index both to a common base. This is the single most common
  charting mistake and it is always wrong.
- **Colour follows the entity, never its rank.** Filtering to fewer series must
  not repaint the survivors.
- Thin marks. 2px lines, ≥8px markers, 6px rounded data-ends anchored to the
  baseline, a 2px surface gap between stacked segments and adjacent bars.
- Grid and axes recessive — `--vq-chart-grid`, `--vq-chart-axis`. Unfilled track
  is `--vq-chart-track`.
- **Text wears text tokens, never the series colour.** A coloured mark beside the
  label carries identity; the label itself stays in ink.
- Legend for ≥2 series. A single series needs none — the title names it. ≤4 series
  are also direct-labelled, so identity is never colour-alone.
- Every chart has a table view. It is the accessibility answer and the "let me
  check that number" answer at the same time.

---

## 13. Component contracts

Retuned to V6 numbers. Only the ones the app gets wrong today.

**Button** — height `--vq-control-md` 42 / `-lg` 48 (touch floor) / `-xl` 56
(mobile primary). Horizontal padding 22px; buttons that hug their label look
cheap. Radius `--vq-r-lg` (20px) for standard, `--vq-r-full` for pills — **not
`md`**; V6 lists button under `lg`. **One primary per view.** Primary carries
`--vq-glow-accent`. Focus: `--vq-ring-focus`.

**Input** — height `--vq-control-lg` 48, radius `--vq-r-md` (14px), 1px
`--vq-line`, 16px internal padding. **Font-size 16px minimum** — anything smaller
makes iOS Safari zoom on focus, which feels broken. Label above the field, always,
13px `--vq-text-2`. Placeholder is never a substitute for a label. Focus: border →
`--vq-focus` plus `--vq-ring-focus`.

**Data table** — the component the app has more of than any other, and where a
financial product either looks trustworthy or does not.

- Numbers right-aligned, Space Grotesk, tabular. Non-negotiable.
- Labels left-aligned, Plus Jakarta Sans. Never centre anything except a status chip.
- Row `--vq-row-h` 52px, header `--vq-row-head-h` 40px, header text 11px Space
  Grotesk uppercase in `--vq-text-3`.
- **Horizontal rules only.** Vertical lines make it look like a spreadsheet, and
  the whole point is that you replaced the spreadsheet.
- Negative numbers in `--vq-danger` **and** in parentheses.
- Totals row: 1px `--vq-line` above, weight 600, never a filled background.
- Sticky header at `z-sticky`. Sticky first column at `z-raised`.

**Sidebar** — width 264 expanded / 72 collapsed (Layout Law). Item height 40,
radius `--vq-r-md`, 8px gap. Active = `--vq-accent-quiet` background + 3px
`--vq-accent` left rule + `--vq-accent-text` label at 600. Inactive =
`--vq-text-2` at 500. Hover = **background and colour only, never a transform**.
Collapsed tooltips **portalled to body** at `z-tooltip`.

**Modal** — radius `--vq-r-xl` (28px), elevation 3, `z-modal`, scrim
`--vq-scrim` at `z-modal` − 1. Max-width 560 confirm / 720 form / 960 data. Focus
trapped, Escape closes, focus returns to the trigger. Destructive confirms name
the object in the button label — "Delete invoice INV-2291", not "Confirm".

**Toast** — `z-toast`, bottom-right desktop / top mobile, 4s auto-dismiss for
success, **never auto-dismiss for error**. Icon + text, always.

**KPI card** — radius `--vq-r-xl` (28px) per V6, or `lg` on a dashboard grid where
M4 applies. Follows M1–M3 exactly.

**Empty state** — icon in ink at 10% alpha, one line of what goes here, one
primary action. Never a shrug illustration and never "No data".

**Login / auth** — single centred card, max-width 400, radius `--vq-r-xl`,
elevation 2, on `--vq-bg`. Logo 32px above. No hero art, no gradient, no canvas.
The login page's job is to be fast and boring; it is the page users see most often
and least want to look at.

---

## 14. Marketing vs product — the line

| | Public pages | Inside the app |
|---|---|---|
| Background | `--vq-grad-hero`, `--vq-grad-spot`, fluid canvas | flat `--vq-bg`. Nothing else |
| Display face | Bricolage at hero/display sizes | Bricolage on h1–h3 only, capped at 40px |
| Ambient motion | yes, above the fold, ≥768px, reduced-motion aware | never |
| Hover scale | media thumbnails only | media thumbnails only |
| Theme | dark hero → light body, one direction | full light/dark toggle |
| Density | roomy, `--vq-section-y` 112px | compact, `--vq-row-h` 52px |
| Type ceiling | hero 76px | h1 40px; the data is the headline |
| Colour | teal + ink + one gradient | teal + ink + module accent in chrome + semantic in data |
| Playmates | freely, for delight | categorical data only |

The hero gradient is a real "made by someone who cares" signal and costs nothing
at the top of a marketing page. Four conditions: it must not be covered by a
canvas painted over it; it is disabled below 768px (continuous WebGL is a battery
and thermal problem on a phone); it respects `prefers-reduced-motion`; and it
fades below the fold so it reads as the top of the page rather than as a
background the whole site sits on.

**ReactBits is a marketing dependency.** Public pages may use it freely. Inside
the product exactly three animated things are allowed:

1. A count-up on a **marketing** dashboard KPI — never a ledger balance.
2. A skeleton/shimmer while data loads — not decoration; it is the honest answer
   to "is this broken or is it slow".
3. A stepper for the setup wizard — progress through a multi-step flow is
   information.

`SplitText` and `DecryptedText` are currently installed in the app under
`Components/ReactBits/`. **Remove both.** Animating headings inside an ERP is
motion with no information in it, and scrambling characters where a user is
reading a figure is actively hostile.

Everything else in the app is `--vq-dur-1` on a colour change. That restraint *is*
the enterprise feel.

---

## 15. Accessibility

- Contrast ≥ **4.5:1** for body text, ≥ **3:1** for large text and UI boundaries,
  in **both** themes.
- **Non-text graphics that carry data clear 3:1.** The test is whether the mark
  *encodes a quantity*:
  - An **inactive bar** in a bar chart encodes the other days → **3:1 required**.
  - A **gauge track** encodes the remainder → **3:1 required**.
  - A **series line** or **ranking bar fill** encodes the value → **3:1 required**.
  - A **ranking groove** behind a proportional fill encodes nothing — the fill
    carries the value and the number is printed beside it → **decoration, exempt**.
- **Control boundaries** need 3:1 only where the boundary is the *only* means of
  identifying the control. A segmented control identified by its labels and by a
  raised, accent-tinted selected member may keep a `--vq-line` hairline.
- Focus is always visible, uses `--vq-focus`, and is never removed.
- Every card renders correctly at `data-theme="light"` **and** `data-theme="dark"`.
  A card that only works in one theme is a fail regardless of how good it looks.

---

## 16. Enforcement

### The three sweeps

Mechanical conformance is a script's job, not a reviewer's. All three are dry-run
by default and idempotent — run them after any large merge.

| Script | What it rewrites |
|---|---|
| `scripts/v6-codemod.py` | weights above 700, illegal durations, illegal radii, arbitrary z-index, `hover:scale` |
| `scripts/v6-palette.py` | light/dark **pairs** onto the mode-aware semantic tokens |
| `scripts/v6-vocabulary.py` | pigment names to role names, coloured shadows, text and border singletons |
| `npm run theme:codemod` | hex and arbitrary font sizes that match a live theme token |
| `scripts/v6-legacy-hex.py` | stock Tailwind hexes frozen into style objects and gradient strings |
| `scripts/v6-marketing-gradient.py` | public-page gradients that built a second brand out of plum |

Each declines to guess where the answer is genuinely ambiguous, and prints what
it left behind. A bare `bg-slate-100` could be a well, a hover state, a disabled
control or a chart gridline; those are four different tokens and no script can
tell them apart.

### The greps

Run against `resources/js --include=*.jsx`.

```bash
# ✅ at zero — make these BLOCKING
grep -rnE 'z-\[[0-9]+\]' resources/js --include=*.jsx                       # arbitrary z-index
grep -rnE 'rounded-(3xl|\[[0-9.]+(rem|px)\])' resources/js --include=*.jsx   # radius above the ceiling
grep -rnE 'font-(extrabold|black)' resources/js --include=*.jsx              # weight above 700
grep -rnE 'duration-(75|100|150|300|500|700|1000)\b|duration-\[[0-9]+ms\]' resources/js --include=*.jsx
grep -rnE 'shadow-(indigo|violet|purple|teal|emerald|blue|sky|rose|red|amber)-[0-9]' resources/js --include=*.jsx
grep -rnE '\b(bg|text|border|ring|divide|from|to|via)-indigo-[0-9]{2,3}' resources/js --include=*.jsx
grep -rn  'yAxisId' resources/js --include=*.jsx                             # dual-axis charts

# ⚠️ still above zero — these are the worklist, not yet blocking
grep -rnE '#[0-9a-fA-F]{3,8}\b' resources/js --include=*.jsx                             # 684
grep -rnE '\b(bg|text|border|ring|divide|from|to|via)-(slate|zinc|gray|neutral|stone)-[0-9]{2,3}' resources/js --include=*.jsx   # 4,082
grep -rnE 'dark:(bg|text|border|divide)-slate-' resources/js --include=*.jsx              # 548
grep -rnE '(group-)?hover:scale-' resources/js --include=*.jsx                            # 3 — all legal, see below

# ✅ also at zero — a class on a stop Tailwind does not have compiles to
#    NOTHING, so the element silently inherits. 73 of these had been shipping.
grep -rnE '\-(slate|gray|indigo|brand)-(150|250|350|450|550|650|750|850)\b' resources/js --include=*.jsx
```

Wire the first group as **blocking** now. Wire the second as a **non-blocking
report** with the counts above as a ratchet: a PR may not raise them. A check
that has always failed is a check nobody reads, which is why the two groups are
separate.

### Three notes on reading the results

**`hover:scale` at 3 is correct, not a residue.** All three are an image scaling
inside a fixed-ratio `overflow-hidden` frame, which §9 names as the one
legitimate scale-plus-clip in the system. The check should assert *3*, not *0* —
or exclude lines matching `object-(cover|contain)`.

**`violet` / `purple` / `pink` / `fuchsia` are not off-system.** They are bound
to V6's **plum** playmate, which is a real colour in the system. They read as
pigment names, which is a vocabulary wart, but renaming them without exposing
`plum` as its own Tailwind family would break them. `indigo` was different — it
was bound to the brand, so it had a role name to move to.

**Raw hex is not automatically a violation.** Genuine third-party brand colours
— Amazon's `#ff9900`, TikTok's `#69c9d0`, a payment provider's logo fill — are
supposed to be literal. The V6 system does not own them. `theme:codemod` reports
these separately for exactly this reason.

### Offline — the font rule

Every face the app can render is vendored under `resources/fonts/` and declared
in `resources/css`. Nothing fetches a typeface at paint time, and design-check
blocks the string `fonts.googleapis.com` reappearing anywhere in
`resources/css` or `resources/views`.

This is a correctness rule, not a performance one. A `<link>` to a font CDN
fails **silently** on a till with no uplink — CSS has no error for a stylesheet
that did not arrive — so the screen paints in `system-ui` and looks merely
*slightly wrong*. The expensive part is not the display voice: `system-ui` has
**proportional** figures, so every currency column on the terminal stops
aligning, which is the one thing `--vq-font-numeric` exists to guarantee.

```bash
npm run fonts:vendor    # copy the .woff2 files and regenerate the @font-face sheets
npm run fonts:check     # fail if what is on disk is not what the generator produces
```

`scripts/fonts-vendor.mjs` is the only thing that may write those three sheets.
The `unicode-range` declarations are copied verbatim out of the fontsource
package that ships each binary, so a declaration and the file it names cannot
disagree. Six families, latin + latin-ext, one variable file per subset.
`latin-ext` is not optional: ₹ (U+20B9) and ₨ (U+20A8) live in U+20A0–20C0.

### The lint config

`extras/Design System/VenQore Design System/_adherence.oxlintrc.json` — the
file this section used to point at — **cannot be wired in.** It expresses all 26
component whitelists through `no-restricted-syntax`, and oxlint does not
implement that rule; the config fails to *parse*, so it was never one severity
bump away from working. Two further problems would have survived fixing that:

- Its selectors key on the bare JSX name (`JSXOpeningElement[name.name='StatCard']`).
  `StatCard`, `SidebarItem` and `DataTable` each exist **twice** in this
  codebase with different props — see the note in `ds/index.js` — so it would
  have flagged every use of the app's own three.
- It whitelists `className` on every component. Not one DS component declares
  `className`; they style themselves entirely through `var(--vq-*)`. So
  `<Badge className="mt-2">` — a class that silently does nothing — passes.

What replaces it:

| File | Role |
|---|---|
| `resources/js/Components/ds/*.d.ts` | source of truth — already states every prop and every union |
| `scripts/ds-adherence.mjs` | derives the contract from those files; `--check` fails on drift |
| `resources/js/Components/ds/_adherence.json` | the contract. GENERATED, committed, do not hand-edit |
| `scripts/ds-adherence-plugin.mjs` | the oxlint JS plugin holding the three rules |
| `resources/js/Components/ds/_adherence.oxlintrc.json` | wiring |

```bash
npm run ds:contract   # regenerate _adherence.json from the .d.ts files
npm run ds:check      # contract freshness + the three rules, all at error
```

| Rule | Catches |
|---|---|
| `ds/no-unknown-prop` | `<Badge className="mt-2">` — React drops it without a word |
| `ds/enum` | `<Alert tone="urgent">` — falls through the component's own switch to its default |
| `ds/required-prop` | `<IconButton />` — `label` is required; the glyph is not a name |

All three depend on **which** component an attribute sits on, which is precisely
what the greps above cannot see. All three are silent failures today: the screen
renders, looks nearly right, and is wrong — worse than a crash, because nothing
draws your attention to it.

**The harness self-tests before it reports.** oxlint exits 1 for "found
problems" *and* for "your config is broken", and a missing native binding —
npm's optional-dependency bug, which bites whenever a lockfile crosses
platforms — crashes node before a file is read. All three produce an empty
diagnostic list, which a naive check greps, finds nothing in, and prints as a
green zero. So `design-check.sh` runs both oxlint passes against
`scripts/ds-adherence.fixture.jsx` first — a file kept deliberately wrong — and
refuses to report a count until it has watched each rule catch a planted
violation. The fixture also uses the app's own `SidebarItem`; if that shows up
in the output, the rule is matching bare JSX names instead of resolving imports,
and the check says so rather than reporting the noise. Do not "fix" that file.

The contract is derived rather than typed. The `.d.ts` files already state every
union and are what the editor reads for autocomplete; copying those unions into a
lint config by hand creates a second source of truth for the same fact, and the
copy starts rotting the first time somebody adds a variant. `ds:check` refuses a
build where the two have drifted — the same shape as `theme:check`.

Where it deliberately says nothing: `{...spread}` suppresses the required-prop
check, a non-literal value (`tone={t}`) is not policed, and a union that is not
purely string literals (`"sm" | number`) gets no whitelist at all. Each is a
place where a stricter rule would reject legal code, and a rule that cries wolf
is a rule somebody switches off.

Two rules from the old file are **not** carried over. Raw hex is already covered
twice — by `no-restricted-syntax` in `.eslintrc.json`, which has the carve-out
for genuine third-party brand colours, and by the ratchet above. And its
font-family rule allowed only the three V6 faces, which is wrong for this
codebase: Appearance offers six typeface choices and all six are legitimate.

### oxlint

`.oxlintrc.json` at the root runs oxlint's `correctness` category over
`resources/js` — the tier for code that is outright wrong, not style. It is a
**ratchet**, and its ceiling is not a design decision, so it is recorded rather
than typed:

```bash
npm run design:baseline   # write today's count to scripts/.oxlint-ceiling
npm run lint              # the raw report
npm run lint:fix          # the subset oxlint can fix safely
```

From then on the number may fall and may not rise. ESLint stays for
`no-restricted-syntax`, which oxlint has no equivalent for.

### What blocks a build

`npm run build` runs `fonts:check` and `ds:check` first. Both are at zero
today, so neither can fail on anything that was already here — only on something
newly introduced. The **ratchets** are deliberately not in `build`: a hotfix
should not be blocked by raw-hex drift somebody else added. `npm run verify`
is where those live, along with `theme:check`.

---

## 16a. The class vocabulary — what actually compiles

Two of these are easy to get wrong, and a class that does not exist fails
silently: Tailwind emits nothing and the element renders unstyled.

| Want | Class | Not |
|---|---|---|
| default hairline | `border-line` | ~~`border-border`~~ |
| emphasised divider | `border-line-strong` | |
| page | `bg-app` | |
| card | `bg-surface` | |
| well, table header | `bg-sunken` | |
| on top of a card | `bg-raised` | |
| dropdown, popover | `bg-overlay` | |
| headings, values | `text-ink` | |
| body copy | `text-ink-secondary` | |
| labels, captions | `text-ink-muted` | |
| placeholder, disabled | `text-ink-faint` | |
| hover / active / selected | `bg-interactive-hover` · `-active` · `-selected` | |
| focus ring | `ring-focus` | |

The line tokens are named `line` rather than `border` on purpose, so the class
reads `border-line-strong` instead of `border-border-strong`.

**The accent has both forms.** A ramp stop is one pigment; the identity colour is
a *different stop* in dark mode, and only the semantic form knows that.

| | |
|---|---|
| `bg-accent-500` | a fixed pigment, the same in both modes |
| `bg-accent` | the identity colour — teal-500 light, teal-400 dark |
| `bg-accent-quiet` | the tint wash; takes ink text on top |
| `text-accent-text` | links and inline accent, contrast-safe in both modes |
| `bg-accent-fill` / `bg-accent-fill-hover` | solid buttons; white on top |
| `text-accent-on` | the text colour that goes on an accent fill |

The six semantic forms hold resolved colours rather than channel triplets, so
`/50` opacity modifiers do not apply to them. That is correct — they are
already-composed values, and an alpha on top of a tint is how you get mud.

**Geometry is reachable too:** `gap-gutter` (24px), `h-topbar-h` (64px),
`w-rail-w` (264px), `w-rail-min` (72px), `h-row-unit` (64px).

---

## 17. How to change a value

**One place. Always.**

1. Edit the token in `extras/Design System/VenQore Design System/tokens/*.css`.
2. Regenerate the theme so Tailwind sees it: `npm run theme:build`.
3. Verify: `npm run theme:verify`.

**Never** edit `resources/css/theme.generated.css` — it is a build output.
**Never** add a colour, radius or duration to `tailwind.config.js` — that file
describes *shape*; the token files supply *values*.
**Never** reintroduce a value into a component.

### Superseded artefacts — do not read these, do not follow these

| File | Status |
|---|---|
| `resources/css/venqore-tokens.css` | v2.0 values. Superseded by V6 `tokens/*.css`. Delete after the bridge lands |
| `venqore.tailwind.js` | v2.0 fragment, never merged into `tailwind.config.js`. Dead |
| `VENQORE_CARD_BUILDER_BUILD_SPEC.md` §7.2 | Card size taxonomy superseded by Layout Law C1–C6 |
| `DESIGN-RULES.md` v2.0 | This document |

If you find a fifth token file, it is also superseded. There is one source.

---

**v3.1 · 21 Aug 2026 · aligned to V6 tokens + Layout Law v2.0**
**v3.1 records the class vocabulary (§16a) and the five sweeps, after the first rollout pass.**
