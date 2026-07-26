# VenQore Design Language · Edition 1.3

> **A quiet operating system for the business of running a business.**
> VenQore is an offline-first retail operating system: point of sale, inventory, manufacturing, accounting and business intelligence in one multi-tenant platform. Its interface is used ten hours a day by people who did not choose software as a career. This document defines the visual and interaction language that must hold for the next fifteen years — its colors, type, spacing, geometry, elevation, motion, components and laws.

---

## System Quick Reference

* **Primary Accent:** Cypress (`#114A42`)
* **Secondary Accent:** Brass (`#8A6A1E` / `#C59B27`)
* **Neutrals:** Quarry Scale (`Quarry 0 #FAF9F6` to `Quarry 950 #121210`)
* **Typography:** Instrument Sans · Source Serif 4 · IBM Plex Mono
* **Grid:** 4pt base · 8pt rhythm · 3 density modes (Compact 32px, Comfortable 44px, Touch 56px)
* **Contrast Floor:** 7:1 body text (AAA), 4.5:1 all UI & icons

---

# SECTION 01: BRAND PHILOSOPHY

VenQore's brand is not a logo or a color. It is the feeling of a shopkeeper closing the till at 9pm and knowing the numbers are right. Every visual decision serves that single emotional outcome: **your business is under control** — communicated without ever saying it.

### Mission
Give every merchant — one counter or four hundred — the operational clarity of an enterprise, with software that works when the power and the internet do not.

### Personality
The senior accountant who never raises their voice. Precise, unhurried, literate, discreet. Speaks in verified numbers, not adjectives.

### Emotional Response
Relief, then trust, then speed. In the first three seconds a user should feel nothing is wrong; by the tenth, they should have already completed the task.

### Visual DNA
* **Quarried Stone:** Neutrals with a mineral, slightly warm cast. Never pure grey, never blue-grey.
* **Ledger Geometry:** Hairlines, aligned columns, tabular figures. The page remembers paper accounting.
* **One Deep Green:** Cypress carries every primary action. Scarce, so it always means "act here".
* **Brass Detail:** A single metallic secondary for intelligence, insight and long-term value.
* **Flat Light:** Shadows describe layers, not drama. One light source, always above.
* **Silence:** Empty space is a feature. Density comes from alignment, not from filling.

### Six Design Principles

| Principle | Meaning in Practice | Acceptance Test |
| :--- | :--- | :--- |
| **Numbers first** | Figures get the strongest typographic treatment on any screen. Decoration never outranks data. | Squint: do you see the number? |
| **Legible at arm's length** | Counter staff read a 24" monitor from a metre away, standing, in fluorescent light. | Readable at 70% zoom out? |
| **Truthful state** | Offline, syncing, stale, draft, posted, locked — always visible, never inferred. | Can the user be surprised? |
| **Reversible by default** | Undo beats confirmation dialogs. Confirmation is reserved for money leaving the business. | Count the modals: fewer? |
| **Keyboard is the fast path** | Every repeated operation has a shortcut; the mouse is the fallback, not the design target. | Full sale, no mouse? |
| **Age gracefully** | No effect that dates the product: no gradient meshes, glass stacks, neon glows, or 2020s illustration. | Plausible in 2010 and 2040? |

### Anti-Brand — What VenQore Must Never Become
* 🚫 **Never** a blue-violet startup dashboard with a gradient hero and a floating 3D mockup.
* 🚫 **Never** a gamified POS — no confetti, no mascots, no celebratory sounds over a sale.
* 🚫 **Never** a wall of 40 KPI tiles that no one reads, sold as "powerful".
* 🚫 **Never** AI theatre — sparkles, purple shimmer, or a chatbot occupying the primary column.
* 🚫 **Never** legacy ERP either: grey bevels, 11px text, 14 nested tabs, unlabelled toolbar icons.
* 🚫 **Never** decorative Dribbble beauty that breaks with 12,000 rows and a 19-character SKU.

---

# SECTION 02: SIGNATURE COLOR SYSTEM

Three families, no more. **Quarry** — mineral neutrals that carry 92% of every screen. **Cypress** — one deep green for primary action and brand. **Brass** — one metallic secondary for intelligence, value and attention. Semantics borrow from a fourth, tightly ruled set. Nothing else is permitted to enter the product.

Every hue sits between 150° and 90° in OKLCH with chroma capped at 0.09 for surfaces and 0.13 for accents, so the palette never vibrates under long exposure.

### Quarry — Neutral Scale
Hue held at ~95° with chroma 0.004–0.010: a stone warmth that reads as paper, not as beige.

* `Quarry 0` (`#FAF9F6`): Light theme paper ground
* `Quarry 50` (`#F4F3EF`): Light surface / secondary row fill
* `Quarry 100` (`#E6E4DF`): Component edges & inner hairlines
* `Quarry 200` (`#D0CEB8`): Control borders
* `Quarry 400` (`#9C9B93`): Muted text & icons
* `Quarry 700` (`#4A4A45`): Body text secondary
* `Quarry 900` (`#1C1B18`): Ink text primary (Light theme)
* `Quarry 950` (`#121210`): Dark theme ground

### Cypress — Primary Accent Scale
A deep, desaturated green-teal: the color of ledger cloth and safe doors. Deliberately not emerald (money cliché) and not blue (SaaS default).
* `Cypress 700` (`#114A42`): Only fill permitted on a primary button in light theme.
* `Cypress 500` (`#1D685E`): Interactive focus ring & active control edges.
* `Cypress 300` (`#74A79D`): Only accent text permitted on dark ground.
* `Cypress 100` (`#EAF2F0`): Active row selection wash (Light theme).

### Brass — Secondary Accent Scale
Brass is the intelligence layer: AI suggestions, insights, forecast bands, "worth your attention". Never a primary button, never a success state. Used at most twice per screen.
* `Brass 500` (`#8A6A1E`): Primary brass ink.
* `Brass 300` (`#C59B27`): Dark theme brass highlight.
* `Brass 100` (`#F7F3E8`): Insight background wash.

### Dark Theme Mapping
Dark theme ground is `Quarry 950` (`#121210`), never pure black — pure black plus bright text causes halation and is exhausting on a 10-hour shift.
* **Ground:** `#121210`
* **Surface:** `#1C1B18`
* **Raised:** `#23221E`
* **Overlay:** `#2C2B27`
* **Accent Wash:** `#0D3A34`
* **Accent Ink:** `#74A79D`
* **Text Primary:** `#F4F3EF` (14.9:1 AAA)
* **Text Secondary:** `#BEBDB5` (8.4:1 AAA)
* **Text Tertiary:** `#9C9B93` (5.6:1 AAA)

### Module Hues & Identity Colors
* **Sales / POS:** `#114A42` (Cypress)
* **Inventory:** `#35647D` (Slate Cyan)
* **Warehouse:** `#4A4A45` (Quarry Neutral)
* **Manufacturing:** `#9C5A22` (Industrial Copper)
* **Accounting:** `#8A6A1E` (Brass)
* **Finance:** `#7A4A55` (Plum)
* **Returns:** `#B0402C` (Terracotta)
* **Purchasing:** `#4C7A2B` (Olive)

---

# SECTION 03: TYPOGRAPHY SYSTEM

Three faces, each with one job:

1. **Product Voice — Instrument Sans** (400, 500, 600 only): Neo-grotesque, narrow build. Legible at 13px, composed at 48px.
2. **Editorial Voice — Source Serif 4** (300, 400, 600): Marketing headlines, invoices, reports, and master HIG section titles.
3. **Data Voice — IBM Plex Mono** (400, 500 only): SKUs, invoice numbers, batch IDs, shortcuts.

### Type Scale

| Role | Font & Weight | Size / Line Height | Tracking | Token | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `display-xl` | Serif 300 | `64px / 68px` | `-0.02em` | `--vq-text-display-xl` | Hero headlines |
| `display-l` | Serif 400 | `42px / 46px` | `-0.015em` | `--vq-text-display-l` | Section titles |
| `title-l` | Sans 600 | `24px / 30px` | `-0.01em` | `--vq-text-title-l` | Page heading |
| `title-m` | Sans 600 | `18px / 24px` | `0.00em` | `--vq-text-title-m` | Card title |
| `body-l` | Sans 400 | `16px / 26px` | `0.00em` | `--vq-text-body-l` | Reading prose & forms |
| `body-m` | Sans 400 | `14px / 22px` | `0.00em` | `--vq-text-body-m` | Table cells, default UI |
| `label` | Sans 500 | `13px / 18px` | `0.00em` | `--vq-text-label` | Field labels |
| `overline` | Mono 500 | `11px / 12px` | `+0.10em CAPS`| `--vq-text-overline` | Column group headers |
| `numeric-hero`| Sans 500 tnum| `36px / 40px` | `-0.02em` | `--vq-text-num-hero` | Net position ($4,82,910.00) |
| `numeric-cell`| Sans 500 tnum| `14px / 22px` | `0.00em` | `--vq-text-num-cell` | Table metrics (12,480.50) |

### Numbers Discipline
* **Correct:** `1,240.00` · `18,905.50` · `-2,110.75` (Tabular figures, right aligned, decimal aligned, two fixed decimals, leading minus sign).
* **Forbidden:** `1240` · `18,905.5` · `(2110.75)` (Proportional figures, ragged decimals, left alignment).

---

# SECTION 04: SPACING SYSTEM & DENSITY MODES

4pt base, 8pt rhythm. Components step by 4 (`4`, `8`, `12`, `16`); sections step by 8 (`16`, `24`, `32`, `48`, `64`, `96`).

### Layout Density Modes

| Mode | Row Height | Cell Padding | Control Height | Text Size | Visible Rows / 1080px | Recommended Usage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Compact** | `32px` | `6px / 12px` | `32px` | `13px` | ~26 rows | Reconciliation, stock counts, audit |
| **Comfortable**| `44px` | `10px / 14px`| `40px` | `14px` | ~19 rows | **Default everywhere** |
| **Touch** | `56px` | `16px / 16px`| `56px` | `16px` | ~14 rows | POS, warehouse tablets, gloves |

---

# SECTION 05: SHAPE LANGUAGE & GEOMETRY

* `radius-xs` (`2px`): Chart bars, swatches, progress bars, table hairlines.
* `radius-s` (`4px`): Checkbox, tag, keyboard hint badge, small icon button.
* `radius-m` (`6px`): **The Workhorse** — Buttons, inputs, selects, badges, dropdown menu items.
* `radius-l` (`10px`): Cards, widgets, table containers, popovers.
* `radius-xl` (`14px`): Dialogs, sheets, command palette (`⌘K`), onboarding panels.
* `radius-full`: Avatars, status dots, toggles ONLY. Never a button.

---

# SECTION 06: ELEVATION & MOTION LANGUAGE

### Elevation & Lighting
Single light source, always above. Shadows describe layers, never drama.
* `elev-0` (Flat): Cards, tables, page surfaces. Hairline only (`1px Quarry 200`).
* `elev-2` (Popover): Dropdowns, filters, tooltips.
* `elev-3` (Dialog): Modals, side sheets, command palette (`⌘K`). Scrim 28% Quarry 950.

### Motion Budget (Max 240ms Total)
* **Instant (0ms):** Typing, cell edit commit, barcode scan feedback, keyboard row movement (`J`/`K`).
* **Fast (70ms linear):** Hover, press, focus ring, checkbox toggle.
* **Base (140ms cubic-bezier(.2,0,.2,1)):** Dropdowns, tooltips, popovers, tab underline.
* **Enter (200ms cubic-bezier(.16,1,.3,1)):** Dialogs & sheets appearing (fade + 8px rise).
* **Exit (120ms):** Everything dismissing. Exits are always faster than entrances.

---

# SECTION 07: COMPONENT CONTRACTS & BLUEPRINTS

* **Primary Button:** Cypress fill (`#114A42`) with white text. Exactly ONE per view.
* **Secondary Button:** Hairline border (`1px Quarry 200`) with Quarry 900 text.
* **Destructive Button:** Hairline border in Oxide ink (`#DC2626`). Never a solid red fill.
* **Brass AI Button:** Brass outline (`1px #8A6A1E`) carrying AI-proposed action with exact proposed value in label.
* **Form Inputs:** 40px tall, radius 6px, 1px Quarry 200 border, 8px gap between label and field, 24px between fields.
* **Tables:** Sticky header, frozen SKU/ID column with 1px Quarry 300 edge, right-aligned monospaced numbers.

---

# SECTION 08: TEN GOLDEN LAWS

1. **Numbers First:** Figures get the strongest typographic treatment on any screen.
2. **Legible at Arm's Length:** Counter staff read 24" monitors from 1 metre away.
3. **Truthful State:** Offline, syncing, draft, posted, locked — always visible, never inferred.
4. **Reversible by Default:** Undo beats confirmation dialogs.
5. **Keyboard is the Fast Path:** Mouse is the fallback; every operation has a key shortcut.
6. **Age Gracefully:** No gradient meshes, neon glows, glass stacks, or 2020s illustration.
7. **One Deep Green:** Cypress (`#114A42`) is reserved strictly for primary execution actions.
8. **Brass for Insight:** Secondary Brass accent used at most twice per screen for intelligence.
9. **Tabular Decimals:** All financial data right-aligned with fixed 2 decimal places.
10. **4pt / 8pt Architectural Rhythm:** Spacing steps by 4 inside components, by 8 between sections.
