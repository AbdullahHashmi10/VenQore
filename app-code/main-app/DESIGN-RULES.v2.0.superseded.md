# VenQore Design Rules — v2.0

**Put this file at the repo root as `DESIGN-RULES.md` and reference it from `CLAUDE.md`.**
It is written to be enforced by an agent, not admired by a human. Every rule is
checkable, and most of them are checkable with `grep`.

---

## 0. What the audit actually found

Measured on `app-code/main-app/resources/js` (463 `.jsx` files) on 18 Aug 2026.
These numbers are the reason this document exists.

| Finding | Count | What it means |
|---|---|---|
| `indigo-*` colour classes | **6,726** | The app is an indigo product |
| `teal-*` colour classes | **108** | The brand appears 1.6% as often as a colour nobody chose |
| `emerald` / `amber` / `rose` / `purple` / `violet` / `blue` | 3,663 / 1,847 / 904 / 936 / 477 / 858 | Six more palettes, none of them in a spec |
| Distinct hand-written z-index values | **31** (`z-[5]` → `z-[99999]`) | Not a stacking order — an arms race |
| `zIndex` entries in `tailwind.config.js` | **0** | The root cause. There was no list to consult |
| Distinct corner radii | **~20** (`rounded-sm` → `rounded-[3.5rem]`) | 56px corners on a financial product |
| `hover:scale-*` usages | **184** (incl. 7× `scale-150`) | The sidebar clipping bug, 184 times |
| Font families in play | **4** (`sans`, `display`, `mono`, `serif`) + Figtree in app vs Inter on site | Two companies' worth of typography |
| Chart libraries installed | **3** (recharts 3.6, 11× `@visx/*`, `d3-array`+`d3-shape`) | Three ways to draw the same bar |

The token architecture in `resources/js/theme/` is genuinely good — `contract.js`,
the ramp/palette indirection, the `--vq-space-1.5` ident-safety note. **The problem
is not the token system. The problem is that components bypass it.** Everything
below is about closing that gap.

---

## 1. The five laws

1. **No raw values in components.** No hex, no `px` radius, no `z-[…]`, no
   `duration-[…]`. If the value you want isn't a token, the system is missing a
   token — add it to `tokens.css` first, then use it.
2. **Teal is the brand, not a highlight.** Primary actions, active states and
   focus are teal. Nothing else is teal.
3. **Module colour is wayfinding. Semantic colour is data.** They never swap
   jobs and never share a surface. See §4.
4. **Nothing that means anything is encoded in colour alone.** A negative figure
   gets a minus sign *and* parentheses. A status chip gets an icon *and* a word.
   Roughly 1 in 12 men cannot reliably separate your red from your green.
5. **Marketing may be expressive. The product may not.** The fluid canvas, the
   laser flow, the serif italic — those live on public pages. Inside the app the
   only motion is state feedback.

---

## 2. The bugs, by name

### 2.1 `Components/SidebarItem.jsx` — the hover clipping the user reported

Three defects in one component, all on the same root cause.

```jsx
// LINE ~55 — the row wrapper
className="… rounded-2xl transition-all duration-300 group relative overflow-hidden"
//                                                                  ^^^^^^^^^^^^^^^^
// LINE ~85 — the icon, inside that wrapper
<div className="relative group-hover:scale-125 transition-transform duration-300 origin-center">
//                        ^^^^^^^^^^^^^^^^^^^^
// LINE ~89 — a ring that extends BEYOND the icon's box, also inside it
<div className="absolute -inset-1 rounded-full border-2 … group-hover:border-indigo-400/50" />
// LINE ~112 — a tooltip positioned OUTSIDE the wrapper entirely, also inside it
<div className="absolute left-full ml-2 … z-50 …">
```

**What happens:**

- `scale-125` grows the icon by 25%; `overflow-hidden` on the parent crops
  whatever crosses the row edge. That is the "it zooms in and cuts off its
  sides" the user described.
- `-inset-1` pushes the hover ring 4px past the icon on every side, so the ring
  is clipped before the icon is.
- The collapsed-state tooltip sits at `left-full` — *fully outside* the parent
  box — so it is clipped to nothing and **never renders at all**, on any hover,
  in any state. `z-50` does not save it: clipping happens during paint, before
  stacking is considered. A z-index cannot escape an `overflow-hidden` ancestor.
  This is the single most misunderstood thing about z-index and it is the reason
  half the 31 values exist — someone kept raising the number to fix a problem
  that was never a stacking problem.

**The fix:**

```jsx
// wrapper: keep the clip ONLY if something actually needs clipping.
// The active-state glow blobs do. So clip them, not the row.
<div className="relative rounded-lg transition-colors duration-fast group">
  {isActive && (
    <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
      {/* glow blobs live here, clipped, and nothing else does */}
    </div>
  )}
  {/* icon: colour change only, no transform */}
  <Icon className="text-content-muted group-hover:text-accent-text transition-colors duration-instant" />
  {/* tooltip: portal it to <body>, or it will be clipped by something eventually */}
</div>
```

### 2.2 The sidebar is indigo

`SidebarItem.jsx` alone contains `shadow-indigo-500/20`, `bg-indigo-600/10`,
`bg-indigo-500/30`, `bg-indigo-600/40`, `bg-violet-500/20`, `bg-purple-600/30`,
`group-hover:text-indigo-600`, `border-indigo-400/50`. The active nav state — the
single most-looked-at pixel in the product — is a colour that is not the brand.

Replace with `bg-accent`, `text-accent-text`, `ring-accent`. The glow blobs
become one `--vq-accent-quiet` wash or nothing.

### 2.3 `font-bold` on nav labels

`className="font-bold text-sm …"` — 700 is not in this system (§6). Use
`font-medium` for inactive, `font-semibold` for active.

### 2.4 Landing page: `#fluid-canvas` covers the gradient it sits on

`style.css` puts `#fluid-canvas` at `z-index: 2` and `.hero-gradient-overlay` at
`z-index: 0`. The canvas paints over the gradient, so the gradient is doing no
work. Drop the canvas to `0` and make the overlay a semi-transparent scrim at `1`.

### 2.5 Landing page: the customiser drawer ships to production

`index.html` lines 143–543 are a WebGL physics control panel — vorticity, splat
force, pressure iterations, dye resolution — sitting on the marketing site behind
a visible button. A prospective buyer's first impression of a financial system
should not be a simulation debug console. Gate it behind `?debug=1`.

### 2.6 Landing page: the copy is still template copy

`<title>VenQore — Design with AI</title>`, "transform your ideas into stunning
designs". Not this product. The Copy Bible replaces all of it.

### 2.7 The dual-theme inversion is unmaintainable

`text-white dark:text-black` on the headline and `text-black dark:text-white` on
the sub-text, because the hero gradient itself inverts. Every new section needs
that reasoning applied by hand and one of them will get it wrong. Go dark-hero /
light-body, one direction, and keep the theme toggle for inside the product.

---

## 3. Z-index: the only legal ladder

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
to be dismissable on top of what. A tooltip outranks a modal because you can
have a tooltip *on* a modal. A toast outranks both because a "Saved" confirmation
that appears behind the dialog that triggered it is worse than useless.

**Three rules that prevent the next 31 values:**

- Every scrim is its owner's level **minus one**. Never a separate number.
- If a thing is invisible, check for an `overflow-hidden` ancestor **before**
  touching z-index. Clipping is not a stacking problem and z-index cannot fix it.
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
| `z-[9998]`, `z-[9999]`, `z-[10000]`, `z-[99999]` | `z-command`, or delete — these are almost all "I gave up" |

---

## 4. Colour: three systems that never touch

### 4.1 Brand — teal, hue 208°, chroma 0.071

Low chroma on purpose. A saturated brand blue runs 0.15–0.20; this runs 0.071.
Low chroma reads *considered* rather than loud, which is what you want on a
product whose argument is "trust my arithmetic". It is also not the AI colour —
every AI product in 2026 is violet-to-indigo, and teal reads finance-adjacent.

**Three tokens, one decision, never think about it again:**

```
teal-500  fills           #327882   white on it = 5.07:1 ✓
teal-600  writes on light #21656F   on white    = 6.7:1  ✓
teal-400  writes on dark  #5DA5B0   on #0A0B0F  = 7.0:1  ✓
```

`#327882` as **text** on `#0A0B0F` is **3.88:1 — fails AA**. The landing page
does this on every drawer label. Use `teal-400`.

### 4.2 Module accents — wayfinding

Eleven modules, chroma capped at **0.095** — below every semantic colour — so an
alert always out-shouts the furniture. Each `-500` step lands between **4.87:1
and 5.47:1** on white and each `-400` step between **6.48:1 and 7.38:1** on the
dark background. That consistency is not luck; the ramps are generated from the
teal ramp's own lightness curve.

| Module | Hue | Covers |
|---|---|---|
| `accounting` | brand teal 208° | Ledger, banking, reconciliation, payments, tax |
| `reports` | 240° azure | Reports, dashboards, exports, scheduled sends |
| `sales` | 268° indigo | POS, invoices, sales orders, returns, quotes |
| `inventory` | 296° violet | Products, stock ops, batches, serials, transfers |
| `purchasing` | 324° magenta | Purchase orders, suppliers, debit notes, expenses |
| `parties` | 350° rose | Customers, contacts, reminders, loyalty |
| `staff` | 22° terracotta | Users, roles, attendance, shifts |
| `production` | 55° bronze | BOM, work orders, assemblies, wastage |
| `growth` | 88° brass | Campaigns, growth engine, proposals, pre-sales |
| `channels` | 175° jade | VenSynQ, WooCommerce, Amazon, eBay, storefront |
| `platform` | neutral ink | Settings, billing, licences, super admin, HQ |

**Accounting is the brand colour** because the double-entry engine *is* the moat —
the module that justifies the product wears the colour that identifies it.
**Platform is neutral** because admin chrome should be quiet.

**The hard rule — and it is the one that keeps this from becoming a circus:**

> A module accent never appears inside a data region. Not in a table cell, not
> in a chart, not in a status chip, not on a KPI figure. It lives in chrome:
> sidebar item, page-header rule, module badge, breadcrumb, empty-state art.
> Nothing else.

Where it *does* appear, at most **three** surfaces per screen: the active
sidebar item, a 3px rule under the page title, and the module badge. A page
tinted end-to-end in violet is not wayfinding, it is a theme.

### 4.3 Semantic — state

| Role | Light | Dark | Means |
|---|---|---|---|
| success | `#1A7F51` | `#54CC8E` | posted, reconciled, in stock, passing |
| warning | `#A85B05` | `#EFB146` | low stock, nearing expiry, needs approval |
| danger | `#BD3838` | `#F17070` | out of balance, failed, overdue, destructive |
| info | ink `#595E64` | ink `#BFC3C8` | neutral system notice |

**Info is deliberately not blue.** A neutral notice should look neutral, and
removing the blue frees hue 240° for the Reports module. That is one fewer
colour in the system and one more module that can be told apart.

Never use teal to mean "good" and never use semantic green as a brand accent.
The moment a user learns green means *reconciled*, a green button becomes a lie.

---

## 5. Charts — one library, one palette

### 5.1 Pick one library and delete two

You ship **recharts 3.6**, **eleven `@visx/*` packages**, and **`d3-array` +
`d3-shape`**. Three ways to draw a bar means three sets of colour defaults,
three tooltip behaviours, three axis styles — which is most of why reports look
unrelated to each other.

**Keep recharts.** It is declarative, it covers 90% of ERP reporting (bar, line,
area, composed, pie, funnel), and it is the one a future contributor will know.
Keep `@visx/*` **only** if something genuinely needs custom scales/zoom that
recharts can't express — and if so, quarantine it to that one component. `d3-array`
and `d3-shape` stay as transitive deps of visx, never imported directly.

### 5.2 The palette is computed, not chosen

Eight categorical slots, **assigned in fixed order, never cycled.** A ninth
series folds into "Other", becomes small multiples, or the chart is wrong.

```
1 teal    #0091A0   5 blue    #3382D6
2 bronze  #AE7200   6 rust    #CA564B
3 magenta #BB5798   7 violet  #8C69CD
4 olive   #798A00   8 jade    #009869
```

Verified against the Machado–Oliveira–Fernandes (2009) CVD model at severity 1.0:

- worst adjacent pair **ΔE 15.1** light / **15.0** dark — target is ≥ 8
- worst normal-vision pair **ΔE 19.7** light / **19.2** dark — floor is 15
- every slot ≥ 3:1 against its surface, lightness in band, chroma ≥ 0.10

Slot 1 is the brand hue, so the first series in every chart is VenQore teal.

**Scatter, bubble, choropleth and small multiples cap at three series** and use a
different triad (`#AE7200`, `#BB5798`, `#3382D6`) — in those forms any two marks
can end up adjacent, which is a strictly harder test that eight colours cannot pass.
More than three: fold to "Other", or facet.

**Sequential** (magnitude — heatmaps, density) is one hue, light→dark:
`#5DA5B0 → #327882 → #21656F → #124E56 → #0C393F`.

**Diverging** (polarity — budget variance, over/under) is two hues with a
**neutral grey** midpoint, never a hue at the middle:
`#9C2F2E · #B36660 · #C59893 · #E6E8EA · #7BAFB2 · #079096 · #00686C`.

### 5.3 Chart rules

- **Never a dual-axis chart.** Two measures of different scale → two charts,
  small multiples, or index both to a common base. This is the single most
  common charting mistake and it is always wrong.
- **Colour follows the entity, never its rank.** Filtering to fewer series must
  not repaint the survivors.
- Thin marks. 2px lines, ≥8px markers, 4px rounded data-ends anchored to the
  baseline, a 2px surface gap between stacked segments and adjacent bars.
- Grid and axes recessive — `--vq-chart-grid`, `--vq-chart-axis`.
- **Text wears text tokens, never the series colour.** A coloured mark beside
  the label carries identity; the label itself stays in ink.
- Legend present for ≥2 series (a single series needs none — the title names it);
  ≤4 series are also direct-labelled, so identity is never colour-alone.
- **Never animate a number counting up on a financial figure.** It reads as a
  slot machine. `@number-flow/react` is fine for a marketing stat, wrong for a
  ledger balance.
- Every chart has a table view. It is the accessibility answer and the
  "let me check that number" answer at the same time.

---

## 6. Type

**One sans across marketing and product.** The app self-hosts **Figtree**; the
landing page loads **Inter**. That split is why they read as two companies. Pick
Inter (the landing page's type scale is already tuned to it), self-host `.woff2`
in the app, delete the Figtree files.

| Role | Size / line / tracking | Weight |
|---|---|---|
| display | 60 / 1.04 / −3.3% | 600 |
| h1 | 40 / 1.10 / −2.8% | 600 |
| h2 | 32 / 1.15 / −2.5% | 600 |
| h3 | 20 / 1.30 / −1.5% | 600 |
| lede | 19 / 1.55 / −0.6% | 400 |
| body | 16 / 1.60 / 0 | 400 |
| small | 14 / 1.55 / 0 | 400 |
| caption | 13 / 1.50 / 0 | 400 |
| eyebrow | 11 mono / +14% / uppercase | 500 |

- **Weights 400 / 500 / 600 only.** `font-bold` is not in this system. At display
  sizes, 600 with tight tracking reads stronger and more expensive than 700.
- **Tracking is a function of size:** ≥40px → −3%; 24–40px → −2.5%; 18–24px →
  −1.5%; body → 0; ≤13px uppercase → +12 to +16%.
- **`font-feature-settings: 'tnum'` globally.** Tabular figures make every digit
  the same width so columns of money align. In a financial product, proportional
  figures in a table are a typo you can see from across the room. Also set
  `cv11` (disambiguates 1 / l / I) and `ss01`.
- **Instrument Serif italic: one word per page.** It works because it is rare.
  Two on a page is a style; three is noise. Marketing only.
- **JetBrains Mono** for eyebrows, labels, data, code, version numbers, counts.
  For an ERP a mono face does real work — it makes numbers look *measured*.
- Measure 60–75 characters. `max-width: 72ch` on prose.

---

## 7. Shape

```
none  0px
xs    4px   checkbox, cell-level chip
sm    6px   badge, tag, tooltip
md   10px   BASE — button, input, select, menu item
lg   14px   card, panel, dropdown surface
xl   20px   modal, drawer, sheet
2xl  24px   CEILING — marketing feature block, hero card
full 999px  pill button, avatar, toggle, tab pill
```

Nothing above 24px except `full`. The audit found `rounded-[3.5rem]` (56px) and
`rounded-[40px]` in production — that reads friendly-consumer, which fights the
financial-precision argument. `rounded-3xl` and every arbitrary value are removed
from the Tailwind config, so they will stop compiling. That is the migration
signal, not a bug.

**Nesting rule:** inner radius = outer radius − inner padding. A 14px card with
16px padding takes a 6px inner element, not another 14px one. Concentric corners
are the difference between "designed" and "assembled".

**Pills against square-ish cards is deliberate and correct** — keep fully-round
buttons.

---

## 8. Elevation

Four levels. In light mode use shadow; in dark mode use **surface lightness**,
not shadow. A black shadow on a near-black background is invisible, and reaching
for one anyway is the most common dark-mode mistake in existence.

| Level | Light | Dark |
|---|---|---|
| 0 flat | 1px border, no shadow | 1px `rgba(255,255,255,.08)` |
| 1 card | `0 1px 2px rgb(10 11 15/.05)` | background → `#12141A` |
| 2 raised | `0 4px 16px rgb(10 11 15/.07)` | background → `#1A1D25` |
| 3 overlay | `0 16px 48px rgb(10 11 15/.13)` | `#1A1D25` + 1px white border @10% |

**1px border *or* a shadow, never both.** Shadows are always neutral-dark and
never coloured — a teal-tinted shadow looks like a mistake at 100% zoom and a bug
at 200%. The current `shadow-indigo-500/20` on the active sidebar item is exactly
this.

---

## 9. Motion, and the hover rule that fixes 184 files

Motion here should read as **mechanical precision**, not playfulness. Things
assemble, settle and lock. Nothing bounces, nothing wobbles, nothing overshoots.
An accounting product that springs is telling you something untrue about itself.

| Token | Duration | Applied to |
|---|---|---|
| instant | 100ms | hover colour, focus ring |
| fast | 180ms | buttons, chips, small state changes |
| base | 280ms | dropdowns, tabs, accordions |
| slow | 480ms | scroll reveals, drawers, modals |
| ambient | 6–10s | gradient drift, fluid field — **marketing only** |

Easing: `cubic-bezier(.16, 1, .3, 1)` for everything that isn't instant.

### The hover contract

The app has **184** `hover:scale-*` usages, seven of them `scale-150`. This is
one rule, applied everywhere:

| Element | Hover response |
|---|---|
| Button | background darkens one ramp step + `translateY(-1px)` |
| Card / tile | `translateY(-2px)` + elevation 1 → 2 |
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
*is* the effect (the media-thumbnail row above). Everywhere else, `overflow-hidden`
+ `scale` is the bug from §2.1.

### Never animate

- A number counting up on a financial figure.
- Anything that shifts layout after paint.
- Ambient loops below the fold.

### `prefers-reduced-motion`

Reveals become instant opacity fades; the fluid canvas renders one static frame;
ambient loops stop. One media query — it is in `tokens.css` — and it is an
accessibility requirement, not an option.

---

## 10. Component contracts

Only the ones the app gets wrong today. Each is a checkable spec.

**Button** — height 40 (`md`) / 44 (`lg`, the touch floor) / 48 (mobile primary).
Horizontal padding 22px; buttons that hug their label look cheap. Radius `full`.
**One primary per view** — two primaries is no primary. Focus: 2px offset ring in
`--vq-focus`.

**Input** — height 48, radius `md`, 1px `--vq-line`, 16px internal padding.
**Font-size 16px minimum** — anything smaller makes iOS Safari zoom on focus,
which feels broken. Label above the field, always, 13px `--vq-text-2`.
Placeholder is never a substitute for a label. Focus: border → `--vq-focus` plus
a 3px ring at 15% alpha.

*(The hero prompt field is the deliberate exception: borderless, transparent, one
hairline underneath, 18–20px. It should feel like writing, not like filling in a
form. That instinct in the current build is correct — keep it.)*

**Data table** — the component you have more of than any other, and where a
financial product either looks trustworthy or doesn't.

- Numbers right-aligned, mono, tabular figures. Non-negotiable.
- Labels left-aligned, sans. Never centre anything except a status chip.
- Row 48px, header 40px, header text 11px mono uppercase in `--vq-text-3`.
- **Horizontal rules only.** Vertical lines make it look like a spreadsheet, and
  the whole point is that you replaced the spreadsheet.
- Negative numbers in `--vq-danger` **and** in parentheses.
- Totals row: 1px `--vq-line` above, weight 600, never a filled background.
- Sticky header at `z-sticky`. Sticky first column at `z-raised`.

**Sidebar** — width 264 expanded / 72 collapsed. Item height 40, radius `lg`,
8px gap. Active = `--vq-accent-quiet` background + 3px `--vq-accent` left rule +
`--vq-accent-text` label at weight 600. Inactive = `--vq-text-2` at 500. Hover =
background only. Collapsed tooltips **portalled to body** at `z-tooltip`.

**Modal** — radius `xl`, elevation 3, `z-modal`, scrim at `z-modal-scrim` using
`--vq-scrim`. Max-width 560 (confirm) / 720 (form) / 960 (data). Focus trapped,
Escape closes, focus returns to the trigger. Destructive confirms name the object
being destroyed in the button label — "Delete invoice INV-2291", not "Confirm".

**Toast** — `z-toast`, bottom-right desktop / top mobile, 4s auto-dismiss for
success, never auto-dismiss for error. Icon + text, always.

**KPI tile** — label 11px mono uppercase `--vq-text-3`; value 32–40px weight 600
in mono with tnum; delta as a small chip with an arrow glyph *and* a sign. No
card chrome needed — the typographic scale carries it.

**Empty state** — icon in the module accent at 10% alpha, one line of what goes
here, one primary action. Never a shrug illustration and never "No data".

**Login / auth** — single centred card, max-width 400, radius `xl`, elevation 2,
on `--vq-sunken`. Logo 32px above. No hero art, no fluid canvas, no gradient. The
login page's job is to be fast and boring; it is the page users see most often
and least want to look at.

---

## 11. ReactBits — where each one goes

The registry is wired in both repos (`components.json` → `@react-bits`;
`jsrepo.config.json` → `https://reactbits.dev/r`). Install with
`npx jsrepo add @react-bits/<Category>/<Name>`.

**The governing rule: ReactBits is a marketing dependency.** Public pages may use
it freely. Inside the product, exactly three are allowed, and only where noted.
Every animated component you add to the app is a frame budget you spend on
something that is not the user's data.

### Already installed — keep, with corrections

| Component | Where | Verdict |
|---|---|---|
| **AnimatedList** | landing hero — business-category picker | **Right choice, wrong copy.** The modal says "Select Business Category" with "Scroll or press Arrow keys". Say what it does: heading **"What kind of business?"**, helper **"Pick the closest — you can change everything later."**, button **"Use this"**. Cap the list at 8 visible with the rest scrolled; a keyboard-navigable list of 30 is a form, not a delight. |
| **ShinyText** | hero placeholder "Describe your business…" | Keep. This is the one place a shimmer earns its keep — it says *type here*. Nowhere else. |
| **FoldText** | hero headline | Keep, but **once**, on first paint only. Never re-animate on scroll-up. |
| **LaserFlow** | footer watermark | Keep. It is the page's signature. One per site. |
| **OptionWheel** | business picker alternative | Pick one of this and AnimatedList — shipping both is two answers to one question. AnimatedList is the better fit for 30 categories. |
| **SplitText** | app (`Components/ReactBits/`) | **Remove from the app.** Animating headings inside an ERP is motion with no information in it. |
| **DecryptedText** | app (`Components/ReactBits/`) | **Remove from the app.** Scrambling characters where a user is reading a figure is actively hostile. |

### Worth adding — public pages only

| Where | What to reach for | Why |
|---|---|---|
| Pricing tier cards | a spotlight/glare-on-hover card | Reinforces which tier is being considered without moving layout |
| Feature grid | a bento/masonry layout component | 240+ features need a grid with rhythm, not a 3×N table |
| Logo / integration strip | an infinite marquee | Amazon, WooCommerce, eBay, TikTok — motion implies "always syncing" |
| Section entrances | a fade/animated-content wrapper | Replaces the hand-rolled `.reveal-item`; keep 20px travel, 480ms, 60ms stagger, once only |
| Nav | **GooeyNav** (already styled in `style.css`) | Wire it up or delete the 200 lines of dead CSS |

Verify exact component names against reactbits.dev before installing — the
catalogue moves. Anything you add gets a `prefers-reduced-motion` branch.

### The three allowed inside the product

1. **A count-up on a dashboard KPI — marketing dashboards only, never a ledger
   balance.** `@number-flow/react` is already installed and is the better tool.
2. **A skeleton/shimmer while data loads.** Not decoration — it is the honest
   answer to "is this broken or is it slow".
3. **A stepper for the setup wizard.** Progress through a multi-step flow is
   information.

Everything else in the app is `--vq-dur-fast` on a colour change. That restraint
*is* the enterprise feel — Bloomberg, Stripe's dashboard and NetSuite are not
quiet because they couldn't afford animation.

---

## 12. Marketing vs product — the line

| | Public pages | Inside the app |
|---|---|---|
| Background | WebGL fluid, mesh gradient, laser flow | Flat `--vq-bg`. Nothing else |
| Serif italic | one word per page | never |
| Ambient motion | yes, above the fold, ≥768px, reduced-motion aware | never |
| Hover scale | media thumbnails only | media thumbnails only |
| Theme | dark hero → light body, one direction | full light/dark toggle |
| Density | comfortable, 80px section gaps | compact, 48px row height |
| Type | display 60px | h1 caps at 32px; the data is the headline |
| Colour | teal + ink, one gradient | teal + ink + module accent in chrome + semantic in data |

The fluid canvas is a real "this was made by someone who cares" signal and it
costs nothing at the top of a marketing page. Four conditions: it must not cover
the gradient (§2.4); it is disabled below 768px (continuous WebGL is a battery
and thermal problem on a phone); it respects `prefers-reduced-motion`; and it
fades out below the fold so it reads as the top of the page rather than as a
background the whole site sits on.

---

## 13. Migration order

Nothing here requires touching 463 files at once.

1. **Ship `tokens.css` and the Tailwind fragment.** Nothing changes visually.
   `rounded-3xl`, `z-[9999]` and `font-bold` stop compiling — that is your
   worklist, generated by the build.
2. **Fix `SidebarItem.jsx`** (§2.1, §2.2, §2.3). One file, highest visible return,
   and it is the component the user is looking at while they judge the product.
3. **Codemod z-index** using the table in §3. Mechanical, reviewable in one pass.
4. **Codemod radius:** `rounded-3xl|rounded-[2rem]|rounded-[2.5rem]|rounded-[40px]|
   rounded-[3rem]|rounded-[3.5rem]|rounded-[2.2rem]|rounded-[1.75rem]` → `rounded-2xl`;
   `rounded-2xl` on cards → `rounded-lg`; `rounded-[1.5rem]|rounded-[32px]` → `rounded-xl`.
5. **Codemod hover:** delete every `hover:scale-*` and `group-hover:scale-*`
   outside a media frame. 184 deletions, near-zero risk.
6. **Colour, module by module.** `indigo` → `accent` inside chrome, → `mod-sales`
   where it is identifying the Sales module. 6,726 instances, but they cluster:
   do Sales, then Inventory, then Accounting, and the pattern will be obvious by
   the third.
7. **Fonts:** self-host Inter in the app, delete Figtree.
8. **Charts:** quarantine visx, standardise on recharts, apply the series palette.

Steps 1–5 are a day and change how the whole product reads. Step 6 is the long
one and it can run module by module without ever leaving the app in a broken state.

---

## 14. Grep checks for CI

```bash
# no raw hex in components
grep -rnE '#[0-9a-fA-F]{3,8}\b' resources/js --include=*.jsx

# no arbitrary z-index
grep -rnE 'z-\[[0-9]+\]' resources/js --include=*.jsx

# no radius above the ceiling
grep -rnE 'rounded-(3xl|\[[0-9.]+(rem|px)\])' resources/js --include=*.jsx

# no hover scale
grep -rnE '(group-)?hover:scale-' resources/js --include=*.jsx

# no weight 700+
grep -rnE 'font-(bold|extrabold|black)' resources/js --include=*.jsx

# no off-system palettes
grep -rnE '\b(bg|text|border|ring|shadow|from|to|via)-(indigo|violet|purple|slate|zinc|gray|neutral|stone)-[0-9]{2,3}' resources/js --include=*.jsx

# no dual-axis charts
grep -rn 'yAxisId' resources/js --include=*.jsx
```

Each should return zero. Today the first returns thousands. Wire them into
`.github/` as a non-blocking report first, then make them blocking once the
count reaches zero — a check that has always failed is a check nobody reads.
