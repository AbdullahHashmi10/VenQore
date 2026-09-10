# V6 Rollout — Audit & Plan

**21 Aug 2026 · no code changed except `DESIGN-RULES.md` (v2.0 → v3.0)**
**Scope: `app-code/main-app`. 312 pages, 140,406 LOC, 120 components.**

---

## The short version

You asked whether "change it in one place and it changes everywhere" is the right
approach.

**It is the right approach, it is already built, and it is pointed at the wrong
values.** `tailwind.config.js` already resolves every colour, radius, shadow,
duration and spacing utility through a CSS custom property. That means
`bg-indigo-600` is not a colour — it is a lookup — and there are 37,715 of those
lookups sitting in your pages waiting to be redirected.

On the active theme they currently resolve to **stock Tailwind defaults**. The
shipped CSS says so literally:

```css
/* public/build/assets/app-BrdwXlyq.css */
.rounded-lg{border-radius:var(--vq-radius-lg)}
/* resources/css/theme.generated.css :root */
--vq-radius-lg: 0.5rem;   /* = 8px */
```

`rounded-lg` renders at **8px**. V6 says 20px. Nobody ever authored the
design-system values into the active theme, so the whole indirection layer is
running empty.

Fix that one file and **all 312 pages change at once**, without a single JSX edit.
By my count **182 of the 254 app pages (72%) need no hand-work at all** beyond it.

That is the plan. Everything below is detail, ordering and cost.

---

## Part 1 — What I found

### 1.1 There are four token vocabularies, and only one of them reaches the screen

| # | Where | Names it uses | Who reads it | Status |
|---|---|---|---|---|
| 1 | `extras/Design System/…/tokens/*.css` | `--vq-r-lg: 20px` | **nobody in the app** | **V6 — the law** |
| 2 | `resources/css/venqore-tokens.css` | `--vq-r-lg: 14px` | 5 JSX files + `DashboardCardFrame` | v2.0, superseded |
| 3 | `venqore.tailwind.js` (17.7 KB) | `--vq-r-*` | **nobody** — never merged | dead |
| 4 | `resources/css/theme.generated.css` | `--vq-radius-lg: 0.5rem` | **`tailwind.config.js` — this is what renders** | stock defaults |

`--vq-r-lg` and `--vq-radius-lg` are different tokens that have never been
connected. Same for motion:

```
V6                     --vq-dur-1: 120ms          --vq-ease-out: cubic-bezier(.22,1,.36,1)
venqore-tokens.css     --vq-dur-fast: 180ms       --vq-ease: cubic-bezier(.16,1,.3,1)
theme.generated.css    --vq-duration-fast: 150ms  --vq-ease-standard: cubic-bezier(.4,0,.2,1)   ← renders
```

`cubic-bezier(.4, 0, .2, 1)` is Material Design's standard curve. It is in your
product because nobody replaced the placeholder.

**One nuance, in fairness to whoever built this.** `theme.generated.css` carries
several theme blocks, and not all of them are placeholders — `daylight-calm`
authors real values (`--vq-radius-lg: 0.6875rem`, `--vq-duration-fast: 180ms`,
its own easing curve), and there are six radius presets defined at L2722–2787.
But `theme/active.js` sets `ACTIVE_THEME = 'midnight-nebula'`, and *that* block
plus `:root` are the stock ones. So the shipping product runs on defaults; the
generator itself works fine. **This is a content problem, not an architecture
problem** — which is exactly why Phase 0 is cheap.

Only **six** JSX files read the `--vq-r-*` / `--vq-dur-*` vocabulary at all:
`Components/Bklit/Charts.jsx`, `Dashboard/components/DashboardBuilderSheet.jsx`,
`Dashboard/components/DashboardCardFrame.jsx`, `Pages/Admin/ExecutiveDashboard.jsx`,
`Pages/Dashboard.jsx`, `Pages/Workspace/Dashboard.jsx`. That is the entire
repointing cost.

**This is the whole problem in one sentence: the machine is built, wired and
running — on factory defaults.**

### 1.2 The design system is real code, not mockups

`extras/Design System/VenQore Design System/` is better than I expected:

- **26 React components** — `core` 5, `data` 7, `feedback` 5, `forms` 5,
  `navigation` 3, `surfaces` 1 — each shipped as a complete triplet, `X.jsx` +
  `X.d.ts` + `X.prompt.md`, 26/26/26 with none missing. Genuinely token-driven:
  `Button.jsx` styles entirely through `var(--vq-accent-fill)`,
  `var(--vq-control-md)`, `var(--vq-elev-1)`, **zero Tailwind classes**.
- **`_ds_manifest.json`** — a machine-readable registry: every component mapped to
  its source path, **286 resolved tokens** each as `{name, value, kind, definedIn}`,
  25 preview cards, the ordered CSS load list.
- **`_ds_bundle.js`** — the same components as one IIFE namespace.
- **`_adherence.oxlintrc.json`** — lint rules for raw hex, raw px, illegal
  font-family, plus per-component prop and enum whitelists (~52 generated selectors).
- **`ui_kits/app`** — AppShell, DashboardScreen, LedgerScreen, BlueprintScreen.
- **`ui_kits/marketing`** — Hero, Sections.

None of it is installed. The oxlint config is not wired (no `.oxlintrc.json`, no
`oxlint` script, no dependency), and every rule is severity `warn` anyway.

**You do not need to build a component library. You need to import one.**

### 1.3 The measured surface

| | Files | LOC | palette classes | raw hex | `z-[n]` | illegal radius | `hover:scale` | `font-extrabold/black` | `style={{` | illegal duration | `<table` |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **App** | 204 | 105,730 | 28,439 | 762 | 89 | 257 | 116 | 1,226 | 1,577 | 263 | 120 |
| **Reports** | 50 | 13,264 | 4,119 | 7 | 2 | 11 | 12 | 178 | 16 | 34 | 45 |
| **Marketing** | 58 | 21,412 | 5,157 | 119 | 5 | 80 | 54 | 544 | 67 | 77 | 20 |
| **Total** | **312** | **140,406** | **37,715** | **888** | **96** | **348** | **182** | **1,948** | **1,660** | **374** | **185** |

Read it this way: the 37,715 palette classes are **not work** — they are the
lookups that fix themselves in Part 2, Phase 0. The columns to the right of them
*are* the work, and they total roughly **5,200 sites**, most of them scriptable.

The genuinely expensive number is **1,660 inline `style={{}}` objects**. Tailwind
cannot see them, the theme cannot reach them, and no codemod can safely rewrite
them. 1,577 of those are in the app.

### 1.4 Page tiering — the number that decides the budget

Grading the 254 app + report pages by *manual* fix load (everything a codemod
cannot do: raw hex, inline styles, arbitrary radius, hover-scale, illegal
durations, arbitrary z-index):

| Tier | Manual sites | Pages | Share | What it means |
|---|---|---|---|---|
| **T0 — clean** | 0 | **85** | 33% | Phase 0 alone finishes these |
| **T1 — light** | 1–5 | **97** | 38% | ~15 min each, mostly one-liners |
| **T2 — medium** | 6–20 | **41** | 16% | ~1–2 h each |
| **T3 — heavy** | 21–60 | **17** | 7% | ~half a day each |
| **T4 — rewrite** | 60+ | **14** | 6% | ~1–2 days each |

**182 of 254 pages (72%) are T0 or T1.** The long tail is 31 pages.

The 14 T4 pages, worst first:

```
178  Pages/Platform/Views.jsx                 1373 LOC
176  Pages/SuperAdmin/Plans/Index.jsx         1302
154  Pages/Next/Dashboard.jsx                  904   ← dead code, delete instead
147  Pages/VenSynQ/Settings.jsx                626
136  Pages/Workspace/Overview.jsx              730
135  Pages/Admin/ExecutiveDashboard.jsx        770
128  Pages/VenSynQ/Dashboard.jsx               453
125  Pages/Store/Staff/Index.jsx               507
119  Pages/Dashboards/AccountantDashboard.jsx  268   ← superseded by the card system
105  Pages/Dashboards/PurchasingDashboard.jsx  216   ← superseded
 99  Pages/LandingPage.jsx                    1917
 70  Pages/VenSynQ/Payouts.jsx                 433
 68  Pages/Platform/Overview.jsx               275
 64  Pages/Dashboards/CashierDashboard.jsx     194   ← superseded
```

Four of those fourteen should be **deleted rather than migrated** (see 1.6).

### 1.5 The shell is fragmented, but less than it looks

| Layout | LOC | Pages | Verdict |
|---|---|---|---|
| `OneGlanceLayout` | **1,912** | **115 direct + 38 via ReportsLayout = 153** | **canonical** |
| `ReportsLayout` | 228 | 38 | wraps OneGlance — fine |
| `PlatformShell` → `PlatformLayout` | 15 + 372 | 15 | **inline styles — tokens cannot reach it** |
| `GlobalProviderLayout` | 280 | all 312 | provider stack, no chrome |
| `AuthenticatedLayout` / `GuestLayout` / `SuperAdminLayout` | 182 / 18 / 160 | **0** | **dead — delete** |
| `Next/Shell/*` | 572 | **0** | unused prototype, but written in the *correct* token vocabulary |
| `Marketing/Shared/MarketingLayout` | 832 | **58** (all of them) | single marketing chokepoint |

Two real problems, not seven:

1. **`Platform/ui.jsx` + `Platform/theme.js`** (631 LOC, 15 pages) render through
   inline `style={{}}` objects. This is the **one area a token swap physically
   cannot reach**, so it is the only migration that is *required* rather than
   merely beneficial.
2. **`OneGlanceLayout` is 1,912 lines** — sidebar, header, clock, toasts, mobile
   nav, command palette, omnisearch, onboarding hooks and idle logout in one file.
   It is the chrome for half the product and it should be four files.

`Next/Shell/AppShell.jsx` is worth keeping as a **reference implementation** — it
already writes `bg-app text-ink border-border bg-surface/85`, which is the
vocabulary everything else should converge on. Do not maintain it as a second
shell; harvest it.

### 1.6 The card system: 4 knobs shipped against 11 designed

**The prototype** (`extras/Cards/v6/VenQore Card Builder (LIVE).html`) exposes:
title · period · chart type (21) · **variant/look (60+)** · multi-series compare ·
**category C1–C6** · **fit (18, with per-chart legibility floors)** · custom
drag-resize · **accent emphasis (board-wide singleton)** · period-picker
preference · theme.

**The shipped builder** (`Dashboard/components/DashboardBuilderSheet.jsx`) exposes
four: domain (4 hardcoded) → metric → chart → size (12 hardcoded presets
`2x4 … 8x8`).

What is already right:

- `chartRegistry.js` carries all 21 chart types.
- `DashboardCardFrame.jsx` is **100% CSS custom properties, zero Tailwind** — it
  is the best-written component in the repo and the template for everything else.
- Persistence is real and already has room: `dashboards` + `dashboard_cards`
  tables, with `args` and `style` JSON columns. `args` **is** consumed
  (`Pages/Dashboard.jsx:116` posts it to `/api/reckoner/read`); **`style`,
  `variant` and `accent` are read by nothing at all**. The slot for the missing
  knobs is already in the database, unused.
- Full API surface exists (`updateCard`, `saveLayout`, `reset`, `publish`).

What is wrong:

| | Shipped | Law |
|---|---|---|
| Grid row height | `rowHeight={80}` | **64px** |
| Grid gutter | `margin={[16,16]}` | **24px** |
| Sizes | 12 presets `2x4…8x8` | **C1–C6 × 18 fits** |
| Per-card edit | `onEdit` prop exists, **never passed** | required |
| Legibility floors | none — a pie can persist at 2×4 | `minSizeFor()` |
| Variants | none | 60+ |
| Number ladder | flat unit switch | `full4 → … → bare` |
| Chart ink | `charts/palette.js` is an indigo-led rainbow | M5: one accent + neutrals |
| Chart components | 9 files, **zero `var(--vq-*)`**, all hardcoded Tailwind | tokens only |

`StatChart.jsx:77` breaks four rules in one line:

```jsx
className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight
           transition-all duration-300 group-hover:scale-[1.02] origin-left"
//          ^font-extrabold  ^slate    ^duration-300 (not 320)  ^hover:scale
```

### ⚠️ Two "just delete it" traps I nearly walked into

`Pages/Dashboards/{Accountant,Cashier,Purchasing,Viewer}Dashboard.jsx` are the
**old static role dashboards** — last touched 7 Jun, importing none of the card
system, three of them in the T4 list. They look like dead code. **They are live.**
`DashboardController::index()` renders all four (L93, L152, L213, L228), routed at
`routes/web.php:1021` (`GET /dashboard`) and `:1034` (`GET /dashboard-v1`).
Deleting them breaks role-based dashboards for every non-owner user. They must be
**replaced** by the card system with `dashboards.for_role`, not removed.

`Pages/Next/Dashboard.jsx` (154 manual sites) is the same trap: it is routed
**twice** — `routes/web.php:85` as a public preview `GET /next-dashboard`, and
`:1060` as an authenticated route. What *is* safely deletable is the shim layer:
`resources/js/Next/Dashboard.jsx` and `Next/Screens/Dashboard.jsx` are one-line
re-exports (`export { default } from '@/Pages/Next/Dashboard'`) that nothing
imports, alongside `Next/Shell/`, `Next/System/` and `Next/Screens/Invoice/`.

The lesson generalises: **check `routes/web.php` before deleting any page in this
repo.** Zero imports means nothing when Inertia resolves pages by string name.

And only **35 of 85 catalogue cards** have a Reckoner reading behind them —
`CARD_CATALOGUE.md` §2 lists the 50 that need a data source before they can exist.
That is backend work, not design work, and it is on the critical path for a
complete dashboard.

### 1.7 Marketing — better than the app in one way, worse in another

**Better:** SEO infrastructure is substantial and server-side —
`SitemapController` (199 LOC, categorised index + per-type sub-sitemaps),
`MarketingSeo.php` emitting `BlogPosting` / `Person` / `Organization` /
`ContactPoint` JSON-LD, `ToolSeo.php` with 55 per-tool entries, a curated
`robots.txt` that deliberately allow-lists GPTBot / ClaudeBot / PerplexityBot,
and a `llms.txt`. One shell (`MarketingLayout`, 832 LOC) covers all 58 pages.

**Worse:** the public face of the product is on a **different brand colour
entirely** — 241 `indigo|violet|purple` classes across 39 of the 58 files, against
a design system whose identity is mint-to-pine teal. Plus 1,028 hardcoded font
weights (one every 20 lines) and 121 raw hex.

Two outliers worth naming: `Pricing.jsx` is **2,140 LOC**, four times the next
largest page; and `Tools/SmartCapture.jsx` (1,082 LOC) duplicates the top-level
`SmartCapture.jsx` (139 LOC).

`open-seo/` at the repo root is a vendored clone of the OpenSEO OSS project — a
research tool, unrelated to the build. It is not part of any of this.

### 1.8 Three places V6 contradicts the Layout Law

The Layout Law outranks the token files on geometry. These are defects in
`tokens/spacing.css`:

| Token | V6 says | Layout Law says | Consequence |
|---|---|---|---|
| `--vq-gutter` | 20px | **24px** | breaks `size(n) = n·64 + (n−1)·24`; every multi-row card height drifts |
| `--vq-topbar-h` | 68px | **64px** | breaks `header_h == row` |
| `--vq-rail-w` / `-min` | 248 / 76 | **264 / 72** | breaks the nav ramp |

Fix these in the token file in Phase 0. If they ship as-is, every card taller than
one row is misaligned and no amount of CSS will explain why.

### 1.9 One gap V6 has not filled — now closed by decision

`DESIGN-RULES` names eleven module accent colours for wayfinding. **V6 ships
ramps for teal, ink and five playmates — no module ramps.**

**Decision taken 21 Aug: module wayfinding is ink chrome + the module icon. No
module colour ships.**

Concretely, on the three surfaces where module identity is allowed to appear —
active sidebar item, the 3px rule under the page title, the module badge — the
module is identified by its **icon and its label**, rendered in `--vq-text-2` /
`--vq-accent` like everything else. There is no eleventh hue, no per-module tint,
no exceptions.

This is the safe call and it costs nothing later: if real ramps are commissioned,
they drop into the same three surfaces without un-doing anything. Improvising
eleven hues now is precisely how the app got to 6,726 indigo classes in the first
place.

**This makes the Phase 3 colour codemod simpler, not harder.** Every `indigo-*` in
chrome maps to `accent`; none of it needs a per-module judgement call.

---

## Part 2 — The plan

### The principle

> **One source. One generator. One vocabulary. Enforced at build time.**

V6 `tokens/*.css` is the source. `theme/build/generate.js` is the generator.
Tailwind utilities + the 28 DS components are the vocabulary. `tailwind.config.js`
and CI make the wrong thing fail to compile.

Nothing in this plan requires touching 312 files at once, and nothing in it leaves
the product broken between phases.

---

### Phase 0 — Connect V6 to the renderer · **3–5 days** · ⭐ the whole plan hinges on this

The one phase where a small edit changes everything.

1. **Extend `theme/contract.js`** to cover what V6 has and the contract does not:
   metric sizes, control heights, `--vq-row-h`, rail/topbar dims, the 12-value
   z ladder, two spring easings, `--vq-glow-accent*`, `--vq-ring-focus`,
   `--vq-elev-inset`, the 8 series / 5 sequential / 5 diverging slots, chart
   surface/grid/axis/label/track.
2. **Author `theme/themes/venqore-v6.js`** from the 286 tokens in
   `_ds_manifest.json`. `midnight-nebula.js` (691 lines) is the shape to copy.
   Generate it from the manifest rather than typing it.
3. **Correct the three Layout Law conflicts** (§1.8) in `tokens/spacing.css`.
4. **Set `theme/active.js` → `venqore-v6`**, run `npm run theme:build`, then
   `npm run theme:verify`.
5. **Load the three faces.** `tokens/fonts.css` uses a Google CDN `@import`;
   self-host Bricolage Grotesque, Plus Jakarta Sans and Space Grotesk as `.woff2`
   for an offline-capable POS. Keep the `word-spacing: 0.08em` correction on Plus
   Jakarta Sans.
6. **Delete** `resources/css/venqore-tokens.css` and `venqore.tailwind.js`; drop
   the import from `app.css`. Repoint the 5 files and `DashboardCardFrame` that
   read `--vq-r-*` / `--vq-dur-*` at the generated names.

**What lands:** every one of the 37,715 palette classes, every `rounded-*`, every
`shadow-*`, every `duration-*` and every spacing class across all 312 pages now
resolves to V6. Card corners go 8px → 20px. The product becomes mint-and-pine on
a soft green-grey page, in both themes, in one commit.

**Verification gate:** screenshot 20 representative pages before and after, both
themes. Nothing may be *broken*; everything should be *different*.

---

### Phase 1 — Make the wrong thing stop compiling · **1–2 days**

1. Close `borderRadius` to the seven V6 radii. `rounded-3xl` and every
   `rounded-[…]` stop compiling — **that is the worklist, generated by the build.**
2. Close `zIndex` to the twelve legal values. **`tailwind.config.js` has no
   `zIndex` key at all** — verified. That absence is the root cause of the 31
   hand-written values: there was never a list to consult.
3. Close `transitionDuration` to `dur-1..4`.
4. Remove `extrabold` and `black` from `fontWeight`. Keep `bold` — V6 legalises 700.
5. Add the nine CI greps from `DESIGN-RULES.md` §16 to `.github/` as a
   **non-blocking report**. Wire `_adherence.oxlintrc.json` at `warn`.

**What lands:** the build now tells you every violation, by file and line, and no
new ones can be added. A check that has always failed is a check nobody reads —
so it reports first, blocks later.

---

### Phase 2 — The chokepoints · **5–8 days**

Ranked by screens-changed-per-file-edited:

1. **`Platform/ui.jsx` + `Platform/theme.js`** (631 LOC → 15 pages). Port off
   inline style objects onto Tailwind role classes. **This is the only migration
   that is required rather than beneficial** — Phase 0 cannot reach it.
2. **`OneGlanceLayout.jsx`** (1,912 LOC → 153 pages). Split into shell / sidebar /
   header / toast host / mobile nav. Harvest `Next/Shell/AppShell.jsx` semantics
   into it, then delete `Next/Shell/` and `Next/Screens/`.
3. **`SidebarItem.jsx`** (328 LOC). The named hover-clipping bug: `scale-125`
   inside `overflow-hidden`, a `-inset-1` ring clipped before the icon, and a
   collapsed tooltip at `left-full` that **never renders at all, in any state**.
   Fix per `DESIGN-RULES` §3 and §9 — portal the tooltip, clip only the glow.
4. **`FormModal.jsx`** (561 LOC, 17 pages) and **`PageHeader.jsx`** (82 LOC, 13
   pages) as the two token-native exemplars everything else copies.
5. **Delete what is genuinely dead** — verified zero references, and no route:
   - `Layouts/{AuthenticatedLayout,GuestLayout,SuperAdminLayout}.jsx` — 360 LOC.
     `app.jsx:45` and `ssr.jsx:28` wrap every page in `GlobalProviderLayout`, so
     there is no implicit-default risk.
   - `resources/js/Next/` — the shim layer only. **Keep `Pages/Next/Dashboard.jsx`**;
     it is routed twice.
   - `venqore.tailwind.js` (17.7 KB) — zero references repo-wide.
   - `Components/ReactBits/{DecryptedText,AnimatedList,ShinyText}.jsx` — imported
     by **nothing**. `SplitText` and `LaserFlow` are imported by exactly one file,
     `Pages/Admin/ExecutiveDashboard.jsx:16-17`; removing `SplitText` per
     `DESIGN-RULES` §14 means editing that page, not just deleting the component.

   **Do not delete the four role dashboards** — see the trap above. They come out
   in Phase 5, replaced.

---

### Phase 3 — Mechanical codemods · **2–3 days**

Scripted, reviewed in one pass each, near-zero risk — and **the tooling already
exists**, which is the pleasant surprise of this audit:

- `theme/build/codemod.js` (448 lines) rewrites raw hex and arbitrary Tailwind
  colour/font-size values into theme tokens. Exact-match only, ≤4/255 per-channel
  tolerance, **dry-run by default**. Run it via `npm run theme:codemod`.
- `theme/build/verify-parity.js` (153 lines) asserts that routing colour classes
  through the theme engine is a **visual no-op** on the baseline theme, by diffing
  23 palettes × 11 stops against Tailwind's own colour table. This is your safety
  net for Phase 0 — run it before and after.

| Codemod | Sites | Rule |
|---|---|---|
| z-index | 96 | the `DESIGN-RULES` §3 mapping table |
| radius | 348 | `3xl`/arbitrary → `2xl`; card `2xl` → `lg` |
| hover scale | 182 | delete outside a media frame |
| font weight | **1,948** (1,865 `font-black` + 83 `font-extrabold`) | → `semibold` or `bold`. **`font-bold` stays** — V6 legalises 700, so the 4,530 `font-bold` uses are fine |
| duration | 374 | snap to `dur-1..4` |
| `bg-white dark:bg-slate-800` pairs | ~1,900 | → `bg-surface` (deletes the dark twin) |

That last one is worth doing carefully: there are **4,011 `dark:bg-` classes** in
Pages, and the mode-aware semantic tokens exist to delete most of them.

---

### Phase 4 — Import the component library · **5–8 days**

1. Vendor the 26 DS components into `resources/js/Components/ds/`. They are
   already React, already typed, already token-driven — this is an import, not a
   build.
2. Fill the five gaps the DS does not cover and the app does not have: a generic
   **Card**, **Badge**, **Tabs**, **Tooltip**, and a real **Table**.
3. Adopt in order of leverage. The headline number: **145 pages hand-roll
   `<table>` against 2 that use `DataTable`.** Every table migrated is a page that
   inherits row height, tabular figures, negative-number formatting, sticky header
   and the horizontal-rules-only rule for free.
4. `PrimaryButton`, `SecondaryButton`, `DangerButton`, `TextInput`, `Checkbox`,
   `InputLabel` and `EmptyState` have **zero page adoption** — replace them with
   the DS equivalents rather than migrating them.

---

### Phase 5 — The card system · **10–15 days**

The largest single feature chunk, and the thing you actually asked for.

1. **Fix the geometry first** — `rowHeight` 80 → 64, `margin` [16,16] → [24,24].
   Every persisted card height is currently mis-scaled; do this before anyone
   builds new dashboards on top of the wrong grid.
2. **Replace the 12 presets with C1–C6 × 18 fits** in both
   `DashboardBuilderSheet.jsx` and `app/Reckoner/DashboardSanitizer.php`. Port
   `minSizeFor()` so a pie can no longer persist at 2×4, and `fitsFor()` /
   `catsFor()` so a card widens before it degrades.
3. **Wire the knobs into the existing `style` / `args` JSON columns** — variant,
   accent, period-picker, extra series. The database is already waiting; only
   `variant` may need its own column.
4. **Wire `onEdit`.** The prop exists on `DashboardCardFrame`, the API endpoint
   exists (`updateCard`), and `Pages/Dashboard.jsx` simply never connects them.
   Today a card can be added and deleted but never edited.
5. **Port the 9 chart components onto tokens** — they are currently zero-token,
   all Tailwind. Apply M5 (one hue + neutrals, dashed horizontal grid only, no
   spines, no Y labels) and replace `charts/palette.js` with `--vq-series-*`.
6. **Implement the number ladder** in `utils/format.js`. A value must step down,
   never clip.
7. **Enforce M1** — exactly one accent-filled card per board.

**Parallel backend track:** the 50 catalogue cards with no Reckoner reading
(`CARD_CATALOGUE.md` §2 — 18 Sales, 12 Finance, 12 Inventory, 4 Purchasing, 3
Staff). Start this at Phase 0 so it is not the thing that blocks launch.

---

### Phase 6 — Charts: one adapter, library deferred · **5–7 days**

There are **two different files called `bklit-bridge.css`** and it matters:

| File | Size | Status |
|---|---|---|
| `extras/Cards/v6/bklit-bridge.css` | 5,649 B | the **full** V6 translation — all 41 bklit variables, including motion. **Not installed** |
| `resources/css/bklit-bridge.css` | 879 B | a **minimal stub** mapping VQ series tokens onto `--chart-1..5`. Imported at `app.css:7` and shipping |

They differ from line 1. So the bridge is *partly* wired — enough for series
colours, not enough for radius, elevation, motion or tooltip chrome. Phase 6
replaces the stub with the full bridge.

bklit itself is still absent: `components.json` registers `@react-bits` only, the
`@bklit` namespace is missing, and `Components/Bklit/Charts.jsx` is a separate
hand-rolled implementation rather than the library.

#### Decision taken: build the adapter, defer the library

The bklit-vs-recharts call is open, so **Phase 6 does not make it.** Instead it
puts the chart layer behind one interface so either library slots in later
without touching a single calling page.

```
Dashboard/charts/*.jsx   →   <Chart shape= data= variant= />   →   adapter
                                                                    ├── recharts   (today)
                                                                    └── bklit      (later)
```

The adapter owns everything the *design system* cares about, so neither library
gets to have an opinion about it:

- the eight `--vq-series-*` slots, in fixed order, never cycled
- the sequential and diverging ramps
- M5 — one accent hue + neutrals, dashed horizontal gridlines only, no axis
  spine, no Y-axis tick labels, one bar coloured and the rest neutral
- M7 — draw-in on mount inside `--vq-dur-4`, no loops, no hover transform
- the number ladder on every axis and tooltip figure
- the mandatory table view

Work that is **unconditional** either way, and is where Phase 6's effort goes:

1. Port the 9 chart components off hardcoded Tailwind onto tokens (they contain
   **zero** `var(--vq-*)` today).
2. Delete `charts/palette.js` — the indigo-led rainbow — and read `--vq-series-*`.
3. Replace the 879 B stub bridge with the full 5,649 B V6 bridge, which is
   already written and verified.
4. Quarantine `@visx/*` to the one component that needs custom scales; delete the
   other ten packages. Never import `d3-array` / `d3-shape` directly.

**Cost:** ~5–7 days for the adapter plus the unconditional work — roughly what the
bklit path alone would have cost, and it makes the eventual swap a one-file change
instead of a re-migration. Whichever library wins, the charts already look right.

**The gate for bklit, when you decide:** a bklit chart that arrives with its own
palette, its own tooltip chrome, its own axis spines, or a shimmer that is not
`--vq-dur-*` is a fail even if it is objectively a nice chart. If it cannot be
made to wear V6 clothing through the bridge, that is the answer.

Install bklit, wire the bridge, and hold it to M5 + M7: a bklit chart that arrives
with its own palette, its own tooltip chrome, its own axis spines, or a shimmer
that is not `--vq-dur-*` is a fail even if it is objectively a nice chart.

Quarantine `@visx/*` to the one component that needs custom scales; delete the
other ten packages. Never import `d3-array` / `d3-shape` directly.

---

### Phase 7 — The page sweep · **6–8 weeks, and it parallelises**

| Tier | Pages | Rate | Cost |
|---|---|---|---|
| T0 | 85 | done by Phase 0 | **0** |
| T1 | 97 | ~15 min | ~3 days |
| T2 | 41 | ~1.5 h | ~8 days |
| T3 | 17 | ~4 h | ~9 days |
| T4 | 14 → **11** (three role dashboards are replaced in Phase 5, not migrated) | ~1.5 days | ~17 days |

≈ **35 developer-days**, and unlike every earlier phase this one shards cleanly —
by module, across people or agents, with no shared state. Run it module by module
(Sales, then Inventory, then Accounting) and the pattern is obvious by the third.

---

### Phase 8 — Public pages · **8–12 days**

58 pages, one shell. After Phase 0 most of the restyle is already done; what
remains is specific:

1. `MarketingLayout.jsx` (832 LOC) — the single chokepoint for all 58.
2. The **241 indigo/violet/purple** classes across 39 files → teal/ink. This is
   the one that matters: your shop window is currently a different brand.
3. Adopt `ui_kits/marketing/{Hero,Sections}.jsx` for the hero and section rhythm.
4. Split `Pricing.jsx` (2,140 LOC) and de-duplicate `Tools/SmartCapture.jsx`
   against the top-level `SmartCapture.jsx`.
5. Marketing keeps what the product may not: `--vq-grad-hero`, ambient motion
   above the fold ≥768px, hero at 76px, playmates for delight.

---

## Part 3 — Sequencing: your SEO question

You asked whether public pages should go first, since SEO takes time to index.

**The instinct is right; the target is slightly off.**

Re-indexing a **restyle of existing URLs** is fast — days to a few weeks — and a
visual change does not reset ranking the way new URLs or changed routes would.
Your URLs, sitemap, JSON-LD, canonicals and `robots.txt` are all staying exactly
as they are. So "design first because SEO is slow" does not really apply to a
reskin.

Where the SEO clock **does** bite is **content velocity**. Every marketing page,
blog post, comparison page and tool page you write between now and the redesign is
a page you will have to redesign later. That is the real cost, and it argues for
doing the marketing pass *early* — not because Google is slow, but because you
should only write each page once.

**So the answer is neither "app first" nor "public first". It is:**

```
Phase 0 + Phase 1          shared infrastructure — no choice, both tracks need it
        ↓                                                          ≈ 1 week
Phase 8 (marketing), timeboxed                                   ≈ 1.5–2 weeks
        ↓                  one shell, 58 pages, mostly free after Phase 0
        ↓                  → from here, ALL new SEO content is written in V6, once
Phases 2–7 (the app)                                              ≈ 8–10 weeks
        ↑
   backend: the 50 missing Reckoner readings — runs in parallel from day one
```

Phase 8 costs you about two weeks and buys back every future content page. After
it, your writers are never blocked by the redesign again, and the app track can
take as long as it needs.

The one thing I would **not** do is start Phase 8 before Phase 0. Restyling 58
marketing pages by hand against tokens that are about to change is the most
expensive possible ordering.

---

## Part 4 — Cost summary

| Phase | Work | Days | Blocks what |
|---|---|---|---|
| **0** | Connect V6 to the renderer | **3–5** | **everything** |
| **1** | Close the config, wire CI | 1–2 | 3 |
| **2** | Chokepoints + deletions | 5–8 | 7 |
| **3** | Mechanical codemods | 2–3 | 7 |
| **4** | Import the DS component library | 5–8 | 5, 7 |
| **5** | The card system | 10–15 | — |
| **6** | Chart adapter + token port | 5–7 | — |
| **7** | Page sweep (shards) | ~35 | — |
| **8** | Public pages | 8–12 | — |
| — | Reckoner: 50 missing readings *(parallel, backend)* | ~15 | 5 |

**Sequential total ≈ 75–95 developer-days.** With Phase 7 sharded across two or
three workers and the Reckoner track running in parallel from day one, **calendar
≈ 10–13 weeks**.

**But the product looks V6 at the end of week one.** Phase 0 alone changes 72% of
the app. Everything after it is correctness, consistency and the card system —
not appearance.

---

## Part 5 — What I would do in the first week

1. **Day 1** — extend `contract.js`; generate `venqore-v6.js` from
   `_ds_manifest.json` rather than hand-typing 286 tokens.
2. **Day 2** — fix the three Layout Law conflicts; self-host the three faces;
   build; screenshot 20 pages in both themes, before and after.
3. **Day 3** — delete `venqore-tokens.css` and `venqore.tailwind.js`; repoint the
   6 files that read them; delete the three dead layouts, the `Next/` shims and
   the three unimported ReactBits components. **Check `routes/web.php` before
   every deletion.**
4. **Day 4** — close `borderRadius`, `zIndex`, `transitionDuration` and
   `fontWeight` in the config. Let the build produce the violation list.
5. **Day 5** — run the z-index, radius and hover-scale codemods against that list;
   wire the nine CI greps as a non-blocking report.

At the end of that week the product is V6, wrong values cannot be typed any more,
and you have a machine-generated worklist for everything that remains.

---

## Appendix — decisions

### Settled 21 Aug 2026

1. **Module accent ramps** → **ink chrome + icon only.** No module colour ships.
   See §1.9. Simplifies the Phase 3 colour codemod.
2. **bklit vs recharts** → **build the adapter, defer the library.** Phase 6 puts
   the chart layer behind one interface; recharts drives it today, bklit slots in
   later as a one-file change. See Phase 6.

### Still open

3. **Google Fonts CDN vs self-hosted.** `tokens/fonts.css` uses a CDN `@import`.
   The POS is offline-capable, so I have assumed self-hosted `.woff2` for
   Bricolage Grotesque, Plus Jakarta Sans and Space Grotesk. **Confirm before
   Phase 0** — it is a Phase 0 task either way, but the CDN route means an
   offline terminal renders in a fallback face.
4. **Who owns `layout-law.json`.** `VENQORE_LAYOUT_LAW.md` says it is generated
   from that file. I could not find it anywhere in the repo. If it exists, it
   should be the source for the geometry tokens too — that is how §1.8's three
   conflicts stop recurring rather than being hand-corrected once.
5. **Phase 7 parallelism.** ~37 developer-days that shard cleanly by module, with
   no shared state. How many workers or agents do you want running at once? This
   is the single biggest lever on calendar time.
6. **The 50 missing Reckoner readings.** Backend, ~15 days, and it is on the
   critical path for a complete dashboard. Worth starting at Phase 0 rather than
   discovering it at Phase 5.

---

## Appendix — how this document was checked

Every count came from a script run against the working tree on 21 Aug 2026, not
from an estimate. Twelve load-bearing claims were then handed to an independent
pass with instructions to falsify them. **Four came back wrong and are corrected
above:**

| Claim as first drafted | Verdict |
|---|---|
| "`args` and `style` are both unread" | **wrong** — `args` is consumed at `Pages/Dashboard.jsx:116` |
| "the four role dashboards are dead — delete them" | **wrong and dangerous** — live at `web.php:1021`/`:1034` |
| "`Pages/Next/Dashboard.jsx` is unrouted" | **wrong** — routed twice, `web.php:85` and `:1060` |
| "the bklit bridge is imported nowhere" | **wrong** — a minimal 879 B stub ships at `app.css:7`; the full 5.6 KB bridge is the one that is missing |
| "28 DS components" | **wrong** — 26 |
| "`theme.generated.css` is entirely stock defaults" | **partial** — true of `:root` and the *active* theme; `daylight-calm` has authored values |

If you find a seventh error, the numbers to re-run are in Part 1 §1.3 and §1.4.
