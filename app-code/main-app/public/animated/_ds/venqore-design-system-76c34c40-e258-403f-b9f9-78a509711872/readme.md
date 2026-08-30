# VenQore Design System — v5 "Qore"

VenQore is **the AI ERP builder**: you describe how your business actually works in
plain sentences, it drafts a *Blueprint* (modules, fields in your words, tax rules,
roles, approvals), you edit and approve it, and the live system exists. Every module
— sales, purchases, stock, payroll, expenses — posts through one double-entry
accounting engine, *Core Ledger*.

> AI decides what your system looks like. It never decides what your numbers say.

Named product parts (these are the nav, the feature pages and the module names):
**Blueprint** (the builder), **Core Ledger** (the engine), **SmartCapture**
(photo/voice → transaction), **VenSynQ** (multi-channel order & stock sync),
**Vena** (in-product assistant), **Signals** (retention & risk intelligence).

## Why v5 exists

v2/v4 of this system capped brand chroma at 0.071 and enforced "mechanical
precision, never playfulness". Applied to the product it read grey, flat and
lifeless, and the v4 dark mode was green-on-green. v5 keeps everything that was
*correct* about those documents — the z-index ladder, tabular figures, semantic
colour discipline, the reduced-motion contract, the "no meaning in colour alone"
rule — and changes the register:

| | v2 / v4 | **v5** |
|---|---|---|
| Brand chroma | 0.071 (grey-teal `#327882`) | ~0.13 (mint-teal `#0BAA8F` / `#23C4A6`) |
| Page | white, grey cards | soft green-grey page, **white cards that float** |
| Radius base / ceiling | 10 / 24px | 14 / 36px |
| Type | Inter + JetBrains Mono + Instrument Serif | **Bricolage Grotesque + Plus Jakarta Sans + Space Grotesk** |
| Motion | "nothing overshoots" | springs on entrances, toggles, chips, gauges |
| Colour beyond teal | 11 muted module accents | 5 saturated "playmates" (lime, butter, coral, sky, plum) |
| Dark mode | tinted green surfaces | near-neutral charcoal, mint only on actionable things |
| Focal point | none | exactly **one** mint-filled card per screen |

## Sources this was built from

- Local folder `Hero Section/` — the landing page the founder likes
  (`index.html`, `style.css`, ReactBits components `LaserFlow`, `ShinyText`,
  `FoldText`, `AnimatedList`, `OptionWheel`), plus `VENQORE-DESIGN-RULES.md`,
  `venqore-tokens.css`, `venqore.tailwind.js` and `VenQore-Copy-Bible.md`
  (positioning, site map, all approved copy).
- `uploads/preview.webp` — landing hero, the look to keep.
- `uploads/preview (1..3).webp` — three generations of the ERP dashboard (indigo
  original, teal-on-dark, v2-applied). Component inventory comes from these.
- `uploads/preview (5).webp` — the Dribbble "Donezo" dashboard the founder cited as
  the playfulness target: soft page, white floaters, one filled green KPI card,
  chunky radii, friendly gauges.
- `uploads/ICON.png` → `assets/logo-mark.png` — the isometric Q-cube mark.
- Previous single-file systems: `uploads/VenQore-Design-System{,-v2,-v3,-v4}.html`.

The app codebase itself (`app-code/main-app`, 463 `.jsx` files) was **not** attached —
only the audit numbers quoted in `VENQORE-DESIGN-RULES.md`. Anything about the real
component tree is inference from screenshots and that document.

---

# CONTENT FUNDAMENTALS

**Voice: a builder talking to an owner.** Confident, specific, unhurried. Never
breathless, never "revolutionary", never "seamlessly".

- **You, not we.** "Describe how you actually work." "Your books are not." *We*
  appears only in the promise: "Tell us your business. We'll build the system."
- **Sentence case everywhere.** Headings, buttons, nav, table headers are the
  exception: table headers and eyebrows are UPPERCASE mono at 11px with +12%
  tracking. Never Title Case A Whole Sentence.
- **Short declaratives, then a mechanism.** Claim → how it works → the number.
  "AI configures it. Double-entry guarantees it."
- **Name the enemy, never a competitor.** The enemy is the six-month
  implementation and the five-tools sprawl. "Every other system asks your business
  to change shape. This one changes shape for you."
- **No invented proof.** No fake logos, counts, testimonials, uptime or SOC 2.
  Publishable claims only: 7 correctness checks, 73 tests across 20 modules,
  2 live businesses, 240+ features, Amazon SP-API approval.
- **No lifetime-deal language** anywhere in product or site copy.
- **Buttons say the verb and the object.** "Approve blueprint", "Record payment",
  "Delete invoice INV-2291" — never "Confirm", never "Submit".
- **Empty states say what goes here, then offer the action.** Never "No data".
- **Numbers are written the way an accountant writes them:** `Rs 6,636,549.20`,
  negatives with a sign *and* parentheses — `−(3,900.00)`.
- **Emoji: never.** Not in product, not in marketing, not in empty states. The
  playfulness is carried by colour, shape and motion, not by 🎉.
- **Sparing wit, no jokes.** "Month-end is archaeology." One line like that per
  page is the ceiling.

---

# VISUAL FOUNDATIONS

**Colour.** One brand hue — Qore Teal, mint at `--vq-teal-400 #23C4A6`, fills at
`600 #088975`. Neutrals ("ink") carry a 160° green cast so saturated teal never
looks pasted on; a pure grey (`#808080`) goes dirty against them and is banned.
Five "playmates" — lime, butter, coral, sky, plum — exist for delight (avatar
fallbacks, browser dots, illustration) and for the 8-slot categorical chart palette.
Semantic colour (success/warning/danger/info) is *data* and never doubles as brand.
Max two background values per screen: the page and the card.

**Type.** Three families, each with one job. **Bricolage Grotesque** 600 for
display and card titles (tracking −2.4% to −3.8%; the slightly irregular grotesque
is where the "a designer made this" feeling comes from). **Plus Jakarta Sans**
400/500/600 for everything read as prose or a label. **Space Grotesk** for every
figure, eyebrow and code string, always with `tnum` so money columns align.
Weight 700 exists for hero display only; UI labels top out at 600.

**Spacing & layout.** 4px base. Dashboard cards sit on a 20px gutter
(`--vq-gutter`); marketing sections breathe at 112px (`--vq-section-y`). Rail 248px
expanded / 76px collapsed, top bar 68px, page max 1240px. Prose caps at 68ch.
Fixed elements: the rail (`z-rail`), the glass top bar (`z-nav`), the marketing nav.

**Backgrounds.** No photography anywhere yet (none was supplied). The public site
uses one signature gradient — `--vq-grad-hero`, pine → mint → page — with a slow
9s radial drift behind it, disabled below 768px and under `prefers-reduced-motion`.
Inside the product: flat `--vq-bg`, no gradient, no texture, no illustration
except the tinted glyph tile in an empty state. Glass (`--vq-glass` +
`backdrop-filter: blur(18px)`) appears in exactly two places: the app top bar and
the marketing nav.

**Cards.** 20px radius (28px for KPI tiles and modals, 36px for hero/app frames),
1px `--vq-line`, and a two-part neutral shadow (tight contact + wide soft bloom).
Border *or* shadow, never a heavy pair. Three tones: white floater, the single
mint-gradient focal card, and the ink card for the second-loudest slot. Nesting
rule: inner radius = outer radius − inner padding.

**Elevation.** Four levels. Light mode uses shadow; dark mode uses surface
lightness (`#0C1211 → #141B19 → #1D2624`) because a black shadow on near-black is
invisible. One coloured shadow exists in the whole system: `--vq-glow-accent`, and
it only ever sits under a primary action or the focal card.

**Motion.** 120 / 200 / 320 / 520ms. Colour and hover changes use
`--vq-ease-out` and stay at 120–200ms so they feel instant. Entrances, toggles,
chips, tab thumbs, gauge sweeps and bar growth use `--vq-ease-spring`
(`cubic-bezier(.34,1.56,.64,1)`) — a ~6% overshoot, once, never a second bounce.
Charts draw themselves in on mount (line stroke-dash sweep, bars staggered 45ms).
Never animate a ledger figure counting up. Never animate anything that shifts
layout after paint. Ambient loops are marketing-only and above the fold.

**Hover / press.** Button: fill deepens one step + `translateY(-1px)`; press
`scale(.97)`. Card: `translateY(-2px)` + elevation 1→2, only when the whole card is
clickable. Table row: background → `--vq-sunken`, nothing else. Sidebar item:
background + colour, **never** a transform. Standalone icon: colour only, never
scale. Media thumbnail: the image scales inside a fixed-ratio clipped frame — the
only legitimate scale-plus-clip in the system. Chip/avatar: fill or ring, no scale.

**Borders & lines.** 1px, always. `--vq-line` for structure, `--vq-line-soft` for
table rows, `--vq-line-strong` for a totals rule or an input at rest. Tables have
horizontal rules only — vertical lines make it a spreadsheet, and the point is that
you replaced the spreadsheet.

**Transparency & blur.** Only for: the two glass bars, the modal scrim
(`--vq-scrim` + 6px blur), tint washes over the mint gradient
(`rgb(255 255 255 / .16)`), and dark-mode lines. Never for a card on a page.

**Focus.** 2px `--vq-focus` outline at 2px offset, plus `--vq-ring-focus` (4px mint
at 30%) on fields. Always visible — hiding it is the keyboard equivalent of hiding
the cursor.

**Imagery vibe (when it exists).** Cool, high-key, plenty of white, one mint object
in frame. No dark moody product shots, no warm film grain, no stock handshakes.

**Accessibility rules that outrank aesthetics.** Meaning is never colour alone
(icon + word + sign). Text stops at `--vq-text-3`. Touch targets ≥44px.
`prefers-reduced-motion` collapses every transition to ~0 and freezes ambient loops.

---

# ICONOGRAPHY

No icon font, sprite or SVG set was supplied with the sources — the app is a Laravel
+ React codebase whose icon layer wasn't attached, and the screenshots show a
thin-stroke outline set consistent with **Lucide**.

**The rule for v5:** outline icons, 1.9px stroke, 24px grid, round caps and joins,
`currentColor`, 18px in rails and buttons / 16px inline / 24px+ in empty states.
Icons are never the only label on a control (`IconButton` requires a `label` prop).

- Components in this system accept icons as `ReactNode` and ship a handful of
  inline primitives only where the control needs one (search, chevron, tick, dot,
  close, sun/moon). These are trivial geometric glyphs, not brand illustration.
- **Substitution flagged:** UI kits draw their nav/module glyphs as inline Lucide-
  equivalent paths, matched to Lucide's 24/1.9 outline style. If the app already
  depends on a specific set (Lucide, Phosphor, Heroicons), point us at it and these
  will be swapped one-for-one.
- Emoji are never used as icons. Unicode is used for exactly three things: the delta
  arrows `▴ ▾`, the activity `+ / −` bubbles, and `···` on overflow buttons.
- The only brand image asset is `assets/logo-mark.png` (the isometric Q-cube from
  `uploads/ICON.png`). **No wordmark file was supplied**, so the lockup is the mark
  beside "VenQore" set in Bricolage Grotesque 600 at −3% tracking. Nothing here was
  drawn or reconstructed from memory.

---

# Index

**Root**
- `styles.css` — the only file consumers link; `@import`s everything below.
- `thumbnail.html` — homepage tile.
- `VenQore Design System v5.html` — the one-page spec sheet (light + dark toggle).
- `SKILL.md` — Agent-Skills wrapper.

**`tokens/`** — `fonts.css` (Google Fonts CDN), `colors.css` (raw ramps),
`typography.css`, `spacing.css` (space, density, z-index), `radius.css`,
`elevation.css`, `motion.css`, `theme.css` (semantic light + dark), `base.css`.

**`guidelines/`** — 16 specimen cards: brand/ink/playmate/semantic/series/surface
colour, display/body/numeric type, radius, elevation, space scale, density, motion,
logo lockup, gradients.

**`components/`**
- `core/` — **Button**, **IconButton**, **Badge**, **Chip**, **Avatar**, **AvatarStack**
- `forms/` — **Input**, **Select**, **Checkbox**, **Switch**, **SearchField**
- `surfaces/` — **Card**
- `data/` — **StatCard**, **ProgressRing**, **BarMeter**, **DataTable**,
  **ActivityRow**, **AreaChart**, **BarChart**
- `feedback/` — **Alert**, **Toast**, **Modal**, **EmptyState**, **Skeleton**, **Tooltip**
- `navigation/` — **SidebarItem**, **Tabs**, **ThemeToggle**

**`ui_kits/`**
- `app/` — `index.html` (click-through), `AppShell`, `DashboardScreen`,
  `BlueprintScreen`, `LedgerScreen`.
- `marketing/` — `index.html`, `Hero`, `Sections`.

**Intentional additions** (no counterpart in the sources, added because the screens
need them): `AreaChart` / `BarChart` (the app ships three chart libraries and none
was attached — these are dependency-free stand-ins that carry the v5 chart rules),
`ThemeToggle` (both themes are first-class here, so the switch is part of the
system), `Skeleton` (the honest answer to "is this broken or just slow").

**Not built, because nothing in the sources defines them:** POS terminal, payroll,
VenSynQ channel setup, reports builder, login/auth, and the 11-module accent
wayfinding scheme from v2 (v5 replaces it — see below).

**Dropped from v2 on purpose:** the eleven muted module accents. Eleven near-grey
hues cost the product its brand colour and bought wayfinding nobody asked for. In
v5 the module is identified by its icon, its name and the page header; colour stays
brand + semantic + categorical.
