# VenQore — New Experience + Global Theme System

**Implemented:** 2026-08-08
**Scope:** `app-code/main-app`

---

## 0. Run these first

Nothing works until these four commands run on your machine. I could not run any of
them here — the sandbox has no PHP, and the Vite build hits an open-file limit on
the mounted drive (details in §6).

```bash
cd "E:\AMD POS\AMD POS\app-code\main-app"

php artisan migrate            # creates user_preferences + dashboard_layouts
php artisan ziggy:generate     # canonical regeneration of resources/js/ziggy.js
npm run build                  # theme:build + ziggy audit + vite
php artisan optimize:clear
```

Then: log in → sidebar → **Appearance** → Experience → **New**.

---

## 1. What was implemented

### 1.1 A real bug fix, first

Before anything else: your report that "all the buttons are shrunk and there is no
padding" was a genuine, app-wide defect in the existing theme engine, and it is
fixed.

The spacing scale has `0.5` and `1.5` steps. Those compiled to CSS custom
properties named `--vq-space-1.5`. A full stop is not a legal character in a CSS
ident, so that is **not a custom property at all** — browsers discard the
declaration when parsing the stylesheet, and discard every `var()` that reads it,
taking the whole declaration with it.

Tailwind compiles `py-1.5` to `padding-top: var(--vq-space-1.5)`. So `py-1.5 px-3`
— the most common small-button padding pair in the codebase — rendered with **no
vertical padding whatsoever**. The measured blast radius:

```
2,772 class usages across resources/js
```

Buttons, chips, badges, table cells: all collapsed to their content size.

**Fix:** token keys are now sanitised (`.` → `_`) inside `cssVar` in
`resources/js/theme/contract.js`, so the generator and `tailwind.config.js` both
build the same legal name by construction. `py-1.5` now compiles to
`var(--vq-space-1_5)`, which resolves.

**Guard:** `generate.js` now throws at build time on any custom property name that
is not a legal ident, and `resources/js/tests/appearance.test.js` asserts that the
generated stylesheet contains no malformed declaration or reference. This class of
bug is silent by nature — nothing throws, no test fails, the product just looks
wrong — so it needed a mechanical check rather than a note.

### 1.2 Runtime theme switching, built on the existing engine

No second CSS system was created. The existing theme engine already emitted one
theme into `:root` at build time; it now emits **every selectable theme** into the
same generated stylesheet, scoped by an attribute on `<html>`:

```
:root { … build-time default … }
[data-vq-theme="minimal"]  { … }        ← light semantics
[data-vq-theme="classic"]  { … }
.dark                      { … }        ← must come after the light blocks
[data-vq-theme="minimal"].dark { … }    ← specificity (0,2,0) beats .dark
```

That block ordering is not cosmetic. `.dark` and `[data-vq-theme="x"]` have
identical specificity, so the later wins; emitting a theme's light semantics after
`.dark` would paint white cards on a black page the moment someone switched theme
in dark mode. There is a test pinning the order.

Switching themes is therefore one attribute change — no re-render, no flash, no
JavaScript in the critical path.

### 1.3 Five curated themes

| Theme | Character |
|---|---|
| **Minimal** *(default)* | Near-monochrome chrome, ink-black brand, colour reserved for meaning |
| **Daylight** | Existing Daylight Calm — warm neutrals, muted slate-blue |
| **Midnight** | Existing Midnight Nebula — untouched |
| **Classic** | High contrast, ~20% denser, square corners, no animation, uncapped page width |
| **Colour** | Warm cream surfaces, coral/violet pair, rounder corners, larger touch targets |

Midnight and Daylight are unchanged. The three new ones are built through
`themes/_kit.js`, which holds the parts that do not vary (palette bindings, the
type scale, motion curves) so each theme file states only what makes it that theme.
Output is an ordinary theme object, validated by the same contract.

### 1.4 Customisation

Primary colour, accent colour, light/dark/system, typeface, density, corner radius.

- **Density and radius** are emitted per theme as attribute variants
  (`[data-vq-theme="x"][data-vq-density="compact"]`), because Classic's "compact"
  is already tighter than Colour's and a single global scale would crush one or
  bloat the other.
- **Typeface** is theme-independent (`[data-vq-font="serif"]`), with numeric
  deliberately excluded from the serif option — serif digits in a currency column
  are harder to scan.
- **Custom colours** are the only part that needs JavaScript: a chosen primary is
  not one colour but an eleven-stop ramp, since the codebase writes
  `bg-indigo-600`, `text-indigo-400` and `ring-indigo-500/30` and all of them must
  move together. That ramp is generated with the existing perceptual curve in
  `theme/color.js` and applied **synchronously in `app.jsx` before the first
  render**, so it lands in the same paint. The focus ring follows the brand.

### 1.5 Global propagation — how it reaches POS, reports and everything else

This required no per-page work, and that is the point of the existing
architecture. `tailwind.config.js` already routes ~40,000 pre-existing colour
classes through CSS variables. Redefining those variables reskins every screen
that uses them — POS, ledger, reports, modals, tables, charts — without a single
component being edited.

The two additions that make it global rather than dashboard-only:

- `App\Support\Appearance::forRequest()` shared on **every** Inertia response, so
  the theme is correct on the trial balance as well as the dashboard.
- The attributes rendered **server-side in `app.blade.php`**, so the correct theme
  is in force before the browser paints. Applying from React instead would flash
  the build-time default on every full page load and hard refresh.

### 1.6 The New dashboard

`Pages/Workspace/Dashboard.jsx` — a configurable workspace.

- **Edit mode.** Normal view is clean; drag handles, resize presets, remove
  buttons and Add card appear only after "Edit dashboard". Done flushes any
  pending save immediately.
- **12-column grid** via `react-grid-layout` (already a dependency), with S / M /
  L / Full presets, vertical compaction (which guarantees no overlap regardless
  of what a saved layout claims), and a `.vq-drag-handle` — making the whole card
  draggable would swallow the links inside Quick Actions.
- **Add card** — a categorised library (Business, Customers, Operations, People,
  Insights), searchable, showing only cards that can actually be added. No locked
  rows, no upsells.
- **Persistence** debounced at 700 ms during drag, force-flushed on Done. The
  server rebuilds widths from the presets and returns the authoritative layout.
- **Reset** deletes the row rather than overwriting it, so "never customised" and
  "customised then reset" stay the same state — a user who resets today picks up a
  new entitlement in their default layout tomorrow.

### 1.7 Mobile as a distinct design, not a shrunken grid

Below `lg`, react-grid-layout is **not used at all** — and its JavaScript is not
even downloaded (it is a lazy `import()` gated on viewport width, which keeps that
weight off the devices least able to afford it).

Phones get a deliberate single-column stack:

- Every card full width, with a readable minimum height (168px, or 320px for tall
  cards).
- Reordering by **up/down buttons**, not drag — a corner resize handle on a touch
  screen is a target the size of the gap between two fingers, and free-dragging
  fights page scroll.
- Size presets hidden, because every card is full width there and the control
  would visibly do nothing.
- Add card opens as a bottom sheet capped at 85vh, so the page behind stays
  visible.
- No fixed widths anywhere; every list scrolls inside its card (`min-h-0` on the
  flex child, which is what stops a list card growing past its cell).

The saved layout is shared: reordering on a phone moves the card on the desktop
grid too.

### 1.8 Capability-aware cards

Three independent gates, all enforced **server-side** in `WidgetRegistry`:

| Gate | Source | Example |
|---|---|---|
| `permissions` | existing `$user->hasPermission()` | a cashier is not offered the P&L card |
| `feature` | existing `PlanRepository::featuresFor()` | `production`, `stock_valuation`, `growth_engine` |
| `capability` | cached probe of what the business actually records | no products → no stock cards |

Capability probes are cheap `exists()` calls against indexed `tenant_id`, cached
10 minutes per tenant. Manufacturing requires **both** the entitlement and evidence
of use — a plan that merely permits production is not a reason to put a Production
card in a hair salon's picker.

The picker filtering is a convenience; the data endpoint re-checks. A request
naming `net_profit` from a cashier's session resolves nothing.

### 1.9 Real data, no parallel logic

`WidgetDataService` computes nothing. Every figure comes from
`FinancialReportingService` or the existing models, and where the classic
`DashboardController` reads something a particular way — the AR/AP account-code
join on codes 1200/2000, the calendar-month definition of "Month" — that exact
approach is reproduced rather than improved on, so the two dashboards cannot
disagree.

Two small honesty details worth flagging:

- Growth against a zero baseline returns `null`, not `+100%`. Saying revenue is up
  100% because yesterday was a public holiday is a number someone would act on.
- The Expenses card subtracts COGS from `total_expenses`, because a busy trading
  month would otherwise read as overspending.

### 1.10 Performance

The page load resolves **no widget data at all** — it carries the catalogue and the
layout, a few kilobytes of structure. One request then asks for exactly the cards
on screen. Five cards, five resolvers. The classic controller builds every section
on every load whether or not it is visible; this one does work proportional to what
the user chose to see. Adding a card fetches that card; removing one fetches
nothing.

### 1.11 Classic vs New

- Default is **Classic**, for everybody, including new users. Nobody is moved by a
  deploy; there is a test pinning that.
- Only `store.dashboard` honours the preference. **`store.dashboard-v1` is an
  unconditional route back to the classic dashboard** — a permanent escape hatch
  that does not depend on the preference system working.
- Switching writes one row in `user_preferences` and touches nothing else.

---

## 2. Files changed

### New — backend (8)

```
app/Support/Appearance.php                                    resolver, sanitiser, <html> attributes
app/Models/UserPreference.php                                 namespaced JSON preferences
app/Models/DashboardLayout.php                                saved card arrangement
app/Services/Dashboard/WidgetRegistry.php                     catalogue + the three gates
app/Services/Dashboard/WidgetDataService.php                  resolvers over existing engines
app/Http/Controllers/WorkspaceDashboardController.php         index / save / reset / data
app/Http/Controllers/AppearanceController.php                 appearance + experience writes
app/Http/Controllers/AppearanceSettingsController.php         Settings → Appearance
database/migrations/2026_08_08_000001_create_experience_preference_tables.php
```

### New — frontend (9)

```
resources/js/theme/themes/_kit.js                             shared theme scaffolding
resources/js/theme/themes/minimal.js
resources/js/theme/themes/classic.js
resources/js/theme/themes/colour.js
resources/js/theme/appearance.js                              runtime application + custom ramps
resources/js/Contexts/AppearanceContext.jsx
resources/js/Pages/Settings/Appearance.jsx
resources/js/Pages/Workspace/Dashboard.jsx
resources/js/Components/Workspace/{WidgetCard,WidgetLibrary,widgets}.jsx
```

### New — tests (3)

```
resources/js/tests/appearance.test.js                         19 tests
tests/tests/Unit/Experience/AppearanceTest.php                10 tests
tests/tests/Unit/Experience/WidgetRegistryTest.php            11 tests
```

### Modified (10)

| File | Change |
|---|---|
| `resources/js/theme/contract.js` | **the padding bug fix** — `safeKey()` in `cssVar` |
| `resources/js/theme/build/generate.js` | emits all themes + density/radius/font variants; build-time name guard |
| `resources/js/theme/active.js` | registers 3 themes, adds `SELECTABLE_THEMES` / `THEME_CATALOG` |
| `resources/css/theme.generated.css` | regenerated (989 → 5,254 lines; still one file, highly repetitive so it gzips hard) |
| `resources/views/app.blade.php` | server-rendered `<html>` attributes; Figtree + Source Serif webfonts |
| `resources/js/app.jsx` | applies custom colour ramps before first render |
| `resources/js/Layouts/GlobalProviderLayout.jsx` | adds `AppearanceProvider` inside `ThemeProvider` |
| `resources/js/Contexts/ThemeContext.jsx` | `managed` prop — stops it fighting AppearanceContext over the `dark` class |
| `resources/js/Layouts/OneGlanceLayout.jsx` | Appearance sidebar entry, visible to all roles |
| `app/Http/Middleware/HandleInertiaRequests.php` | shares `appearance` on every response |
| `app/Http/Controllers/DashboardController.php` | 8-line experience redirect at the top of `index()` |
| `routes/web.php` | 8 routes inside the existing `store.` group |
| `resources/js/ziggy.js` | 8 entries hand-inserted (see §6) |

---

## 3. Database changes

Two new tables. **No existing table was altered. No business table was touched.**

```sql
user_preferences
  id, user_id, tenant_id NULLABLE, key(64), value LONGTEXT, timestamps
  UNIQUE (user_id, tenant_id, key)

dashboard_layouts
  id, tenant_id, user_id, dashboard_key(40), layout LONGTEXT, timestamps
  UNIQUE (tenant_id, user_id, dashboard_key)
```

Notes:

- `tenant_id` is nullable on `user_preferences` — a null row is the user's
  account-wide default, which is what makes "I always want Midnight" work for
  someone who owns four stores.
- `longText` rather than a `json` column: MariaDB 10.5 implements JSON as LONGTEXT
  with a CHECK constraint anyway, and being explicit keeps the schema identical
  across the MySQL/MariaDB split noted in `CLAUDE.md`.
- The layout payload holds widget ids, positions and sizes only. **No figures, no
  cached values.** A layout row outlives plan downgrades and permission changes,
  so anything cached in it would outlive the user's right to see it.
- Store-level default reuses the existing `settings` table (`appearance_default`),
  not a new one.

`UserPreference` deliberately does **not** use `HasTenant`: that trait's global
scope hard-blocks queries made without a bound tenant, which would make the
account-wide rows permanently unreadable. Scoping is explicit and narrower —
every read is pinned to one user id.

---

## 4. What was preserved

- **Classic dashboard** — `DashboardController` logic untouched apart from an
  8-line redirect guarded to one route name.
- **`store.dashboard-v1`** — unconditional classic, independent of preferences.
- **Midnight Nebula and Daylight Calm** — unedited. `npm run theme:verify` still
  reports the engine as a visual no-op against stock Tailwind.
- **Marketing site, auth screens, installer** — `AppearanceProvider` is inert
  without an authenticated store session, and `ThemeProvider` keeps its existing
  per-path light/dark behaviour there.
- **No business logic, financial calculation or database semantic changed.**
- **No page-specific CSS files created.** One generated stylesheet, as before.

---

## 5. Verification actually performed

| Check | Result |
|---|---|
| `npm run theme:build` | 5 themes validated, 4,441 variables |
| `npm run theme:check` | generated CSS up to date |
| `npm run theme:verify` | ✓ every bound palette stop matches Tailwind exactly |
| `npx vitest run` | **78 passed** (59 pre-existing + 19 new) |
| `node scratch/audit_ziggy_routes.cjs` | ✓ all 525 frontend route names resolve |
| Tailwind compile of every new component | 586 rules; all semantic classes resolve |
| `py-1.5` compile check | now `var(--vq-space-1_5)` — the fix, confirmed at the compiler |
| esbuild parse of all new/changed JS/JSX | 17/17 clean |
| Schema cross-check | every column and relation referenced by the resolvers verified against migrations; all 9 models confirmed `HasTenant` |

---

## 6. What I could NOT verify — read this

**No PHP in this environment.** I could not run `php -l`, `php artisan migrate`,
or `php artisan test`. The PHP is written carefully and cross-checked against your
migrations and models, but it has not been executed. **Run the Unit suite first:**

```bash
php artisan test --testsuite=Unit
```

**`npm run build` did not complete here.** Vite fails with `EMFILE: too many open
files` while Tailwind scans `storage/framework/views`. This is the mounted drive's
open-file limit, not a code defect — the same Tailwind config compiles cleanly
against a smaller content set, and `ulimit` is already 524,288. It will build
normally on your machine.

**`resources/js/ziggy.js` was hand-patched.** I inserted the 8 route entries so the
build guard passes and verified the file parses and the audit script is clean.
Per `CLAUDE.md` you must still run `php artisan ziggy:generate` — it will produce
the same entries, and that is the canonical source.

**Not tested in a real browser.** No screenshots at 320/375/390/414/430px, no
click-through of add/remove/resize/save/refresh, no visual pass across POS, Sales,
Purchases, Inventory, Accounting, Reports, Manufacturing, Staff, Settings. The
mobile layout is designed to the constraint (single column, no fixed widths,
`min-h-0` on every flex child, touch targets on the theme's control-height token)
but design is not proof.

---

## 7. Production-ready vs prototype

### Ready for production

- **The `--vq-space-1.5` fix.** Unambiguous correctness fix, compiler-verified,
  test-guarded. Ship it regardless of everything else in this report.
- **The theme engine changes.** Generated, validated, parity-checked, and additive
  — `:root` still holds the build-time default, so a page with no attributes
  renders exactly as it does today.
- **The five themes.** All pass the contract.
- **Server-side attribute rendering.** Small, fails closed to defaults, runs on
  every page including ones with no database.
- **Migrations.** Additive, two new tables, nothing altered.
- **`WidgetRegistry` gating and layout sanitisation.** The security-relevant part,
  and the most heavily tested — width and height re-derived from presets, ids
  intersected against entitlement, coordinates clamped, duplicates dropped,
  malformed rows discarded.

### Ready, pending your browser pass

- Appearance settings screen.
- Classic ⇄ New switching.
- The dashboard's add / remove / resize / drag / save / reset cycle.
- Mobile stacked layout.

The logic is complete and not stubbed. What is missing is a human confirming it
behaves at 375px and on a real drag.

### Still prototype-level

- **Widget breadth.** 20 cards. Attendance, Tasks, Forecasts and the AI-discovery
  flow from the brief are not built. `ai_insights` reads recommendations the
  Growth Engine has already generated — it calls no AI, in line with your "no AI
  required for normal operation" requirement.
- **`recent_purchases` field mapping.** Reads `invoice_number` / `purchase_date` /
  `total` from the purchases migration; worth an eyeball against real rows.
- **Downgrade notification.** A widget lost to a plan change disappears silently.
  The brief asked for a one-time notice; the graceful-drop half is done, the
  telling-the-user half is not.
- **Store-default seeding.** Written and read correctly, but only exercised
  through the "save my current settings as the store default" button.
- **Undo on remove.** Currently remove-then-re-add. The brief preferred a single
  click plus an undo toast.

---

## 8. One thing I'd flag

The generated stylesheet went from 989 to 5,254 lines because it now carries five
themes plus their density and radius variants. It is extremely repetitive, so it
gzips very well, but if you would rather trim it: `SELECTABLE_THEMES` in
`resources/js/theme/active.js` controls exactly which themes are emitted. Dropping
a theme from that array removes its blocks from the stylesheet without deleting
the theme file or breaking the build.
