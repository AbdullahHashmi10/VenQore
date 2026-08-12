# 04 — The UI Programme

**This is the visible work.** It happens in a separate folder, it cannot break the running product, and no business rule inside it is ever written twice.

---

## 01 — The requirement, restated

You asked for two things that appear to conflict:

> *"Something we can work on separately without breaking anything in the old system — but in such a way that we don't have to do our work twice."*

They only conflict if the thing being duplicated is **logic**. The resolution is a hard split:

| What | Where it lives | Duplicated? |
|---|---|---|
| Business rules, validation, totals, tax, stock effects | PHP services (`app/Engines/`) | Never |
| Data fetching, form state, derived values, submit handlers | **Headless hooks** in `resources/js/Domain/` | Never |
| Markup, layout, spacing, colour, motion, arrangement | `resources/js/Next/` (new) and `resources/js/Pages/` (old) | **Yes — deliberately** |

**Markup is the only thing you want two of.** That is the whole point: the new interface should look and feel nothing like the old one. Everything underneath is shared, so a bug fixed once is fixed in both, and a feature added once appears in both.

This is not a theory. **`resources/js/Hooks/useTransactionEngine.js` already exists in this codebase** and is exactly this pattern — transaction logic pulled out of a page into a hook. The programme generalises what you already started.

---

## 02 — The extraction contract

> **Nothing in `Next/` may begin until this contract is agreed, because this contract is what stops the work being done twice.**

### 02.1 — The rule

```
A page component may contain NO logic.

It may:   read from a hook, render markup, call handlers the hook returned
It may not: fetch, transform, validate, calculate, or decide

If a line of code in Next/ would be identical in Pages/, it belongs in a hook.
```

### 02.2 — The folder layout

```
resources/js/
├── Domain/                    ← NEW. Shared. Zero JSX. The single source of behaviour.
│   ├── invoice/
│   │   ├── useInvoiceForm.js       lines, totals, tax, discount, validation, submit
│   │   ├── useInvoiceList.js       filters, pagination, sort, bulk actions
│   │   └── invoiceSchema.js        field definitions, used by BOTH shells
│   ├── expense/
│   ├── product/
│   ├── party/
│   ├── pos/
│   ├── job/                        (new — see 03_SERVICES)
│   ├── report/
│   └── shared/
│       ├── useCapability.js        is this capability on for this tenant?
│       ├── useTerms.js             t() / tp() — see 01_BACKEND_AND_DATA §05
│       ├── useAppearance.js        theme, colours, density (already half-built)
│       └── useLayoutPrefs.js       user's card arrangement
│
├── Pages/                     ← EXISTING. 297 files. Kept alive, unchanged in shape.
│   └── (progressively slimmed as logic moves to Domain/ — never restyled)
│
├── Next/                      ← NEW. The new product. Presentation only.
│   ├── System/                     the design system
│   │   ├── tokens.js               reads theme/contract.js — no new colour source
│   │   ├── Button.jsx  Field.jsx  Table.jsx  Sheet.jsx  Card.jsx
│   │   ├── Money.jsx  DatePicker.jsx  Combobox.jsx  EmptyState.jsx
│   │   └── motion.js               one place for every transition
│   ├── Shell/
│   │   ├── AppShell.jsx            the new frame: nav, command bar, org switcher
│   │   ├── Nav.jsx                 renders from the capability registry
│   │   ├── CommandBar.jsx          single entry point: search + actions + Vena
│   │   └── CardGrid.jsx            12-column, snapping, user-rearrangeable
│   ├── Screens/                    one file per screen, markup only
│   │   ├── Invoice/ Expense/ Pos/ Product/ Party/ Job/ Report/ Settings/
│   └── Studio/                     screens with no old equivalent
│       ├── Onboarding/             business type → questions → recommendation → build
│       ├── MyErp/                  capability browser, dependency dialog
│       ├── Terminology/            rename anything
│       ├── Appearance/             theme, colours, density, radius
│       └── Vena/                   discovery panel, proposal review
│
└── theme/                     ← EXISTING and already good. Do not replace.
```

### 02.3 — How a screen gets converted — the exact sequence

Take Invoice as the worked example.

**Step 1 — Extract (touches `Pages/`, ships to production, invisible).**
Move every non-render line out of `Pages/Sales/Invoice.jsx` into `Domain/invoice/useInvoiceForm.js`. The old page now imports the hook and renders exactly the same markup with exactly the same data.

*Acceptance:* the rendered DOM of the old page is **byte-identical** before and after. Snapshot test proves it. This is a refactor with zero behaviour change and it ships the same week it is written.

**Step 2 — Build (touches `Next/` only, never reachable).**
`Next/Screens/Invoice/InvoiceForm.jsx` imports the *same* `useInvoiceForm` and renders completely new markup with the new design system. Different layout, different components, different everything visible.

*Acceptance:* both shells, driven by the same hook, produce the same totals, the same validation errors and the same POST body. A single test suite runs against the hook and covers both.

**Step 3 — Nothing.**
There is no step 3. No merge, no migration, no cutover for this screen. When `experience = 'new'`, the resolver picks the `Next/` file. When it is `'classic'`, it picks the old one. Both were already in production.

### 02.4 — Why this satisfies both halves of your requirement

| Your requirement | How it is met |
|---|---|
| Work on it separately | `Next/` is a separate tree, code-split, never imported at `experience = 'classic'`. You can spend three months perfecting it. |
| Don't break the old system | Step 1 is a pure refactor with a byte-identical DOM test. Step 2 never touches `Pages/`. |
| Don't do the work twice | Every rule lives in `Domain/`. A tax change, a validation fix, a new field — written once, appears in both. |
| Plug and play when ready | One resolver, five lines. Per-tenant and per-user, reversible instantly. |
| One hour to flip | It is a database default change. There is no deployment. |

---

## 03 — The resolver

`app.jsx` currently resolves pages with a single glob:

```js
resolve: (name) => resolvePageComponent(
    `./Pages/${name}.jsx`,
    import.meta.glob('./Pages/**/*.jsx'),
)
```

The change is small and additive:

```js
const classicPages = import.meta.glob('./Pages/**/*.jsx');
const nextPages    = import.meta.glob('./Next/Screens/**/*.jsx');

resolve: (name) => {
    const isNext = window.__vqExperience === 'new';          // written by Blade, pre-boot
    const nextKey = `./Next/Screens/${name}.jsx`;

    return isNext && nextPages[nextKey]
        ? resolvePageComponent(nextKey, nextPages)
        : resolvePageComponent(`./Pages/${name}.jsx`, classicPages);
}
```

**Note the fallback.** If a screen has not been built in `Next/` yet, a `new`-experience user silently gets the classic page inside the new shell. That means the new experience is usable from the very first screen — you are never blocked waiting for all 297.

`window.__vqExperience` comes from Blade, alongside the theme attributes `Appearance::htmlAttributes()` already writes. It must be resolved before React boots so there is no flash.

---

## 04 — Personalisation: making it feel like theirs

Four independent axes. **All four are stored per user, defaulting to a store-level default set by the owner.** The precedence chain in `App\Support\Appearance` already does this correctly — user-per-store → user-account-wide → store default → system default. Do not rebuild it.

### 04.1 — Colour

**Already built.** `applyAppearance()` in `resources/js/theme/appearance.js` takes a user's chosen hex and generates a full eleven-stop perceptual ramp through `theme/color.js`, applied as inline custom properties on `<html>` synchronously before the first React render.

What remains:

- **Constrain the picker.** Offer a curated set of hues with pre-computed, contrast-checked ramps, plus a free hex field that is validated. `theme/color.js` already has `contrastRatio()` and there is a build-time parity verifier — **reuse the verifier at runtime and reject any combination that fails WCAG AA.** A business owner is not a designer, and an unconstrained picker produces unreadable screens and support tickets.
- **Two colours only:** primary and accent. Everything else derives.

### 04.2 — Theme

`Appearance::THEMES` is currently pinned to `['midnight-nebula', 'daylight-calm']`, with an honest comment that Minimal, Classic and Colour *"were built but never verified across all screens, and a theme that has not been looked at on every page is a promise the product cannot keep."*

**That reasoning is correct — keep it.** The five themes return to the picker only when every screen in `Next/` has been reviewed in each. That review is a checklist item per screen in `05_SCREEN_SPECS.md`, not a separate project.

### 04.3 — Density, radius, typeface

`Appearance::sanitize()` currently **pins** font, density and radius to defaults regardless of what is submitted — a deliberate gate while the picker was withdrawn. Unpinning is one line, gated on the same per-screen verification as themes. Ship the new UI with them pinned; unpin per axis as screens are signed off.

### 04.4 — Arrangement

This is the one that most makes an interface feel owned — and the storage for it **already exists**. `dashboard_layouts` (created 2026-08-08) is already keyed on `tenant_id · user_id · dashboard_key`, with the migration explicitly noting that `dashboard_key` is there *"so a second configurable surface does not need a schema change."*

Reuse it. `01_BACKEND_AND_DATA.md` §07 renames it to `layout_preferences` / `surface` and adds a store-default row — that is the entire schema work.

**Three surfaces are rearrangeable in V1, and no more:**

1. **Dashboard** — drag, resize and pin cards on a 12-column snapping grid
2. **POS** — reorder category tiles, choose grid vs list, set the quick-action row
3. **List views** — column choice, order and width, saved per user per list

**Deliberately not rearrangeable in V1:** form layouts. Letting users move fields around an invoice form produces broken tab order, broken validation focus and unprintable documents. Offer field *visibility* (hide the fields your business doesn't use) instead of field *position*. That gets 90% of the felt ownership at 10% of the risk.

### 04.5 — Terminology as personalisation

Renaming is personalisation, not configuration. It belongs in the same Studio section as colour, not buried in Settings. `Next/Studio/Terminology/` shows a table of the ~25 term keys with a live preview of the nav and a sample invoice updating as they type.

---

## 05 — The design system

**One rule: `Next/System/tokens.js` reads from `theme/contract.js`. It never defines a colour.** The existing theme contract is a well-built subsystem with palette ramps, semantic tokens, a template and a build-time parity verifier that fails the build on a malformed theme. A second colour source would immediately drift from it.

**Component budget for V1 — deliberately small:**

```
Button · IconButton · Field · Input · Select · Combobox · Checkbox · Toggle
Table · Row · Cell · Pagination · Filter · SearchInput
Card · StatCard · Sheet · Modal · Drawer · Tabs · Toast · EmptyState · Skeleton
Money · Qty · DateRange · PartyPicker · ProductPicker
```

Roughly 28 components. Anything not on this list needs a written justification, because every extra component is a thing that must be verified in five themes, three densities and two colour choices.

**Motion in one file.** `Next/System/motion.js` holds every duration and easing. A product where different screens animate differently feels assembled by different people — which is the exact opposite of the impression we are selling.

---

## 06 — What must never happen

| Rule | Why |
|---|---|
| **No `Next/` file may contain a `fetch`, `router.post`, or `useForm`** | That is logic. It belongs in `Domain/`. CI check: grep `Next/` for these tokens and fail. |
| **No `Next/` file may hardcode a hex colour** | It breaks theming silently. CI check: regex for `#[0-9a-f]{3,8}` in `Next/`. |
| **No `Next/` file may duplicate a calculation from `Pages/`** | The failure mode this whole document exists to prevent |
| **`Pages/` is never restyled** | Old customers keep their exact interface. Touching it invites drift and costs review time for zero return. |
| **No new colour source, no second theme system** | `theme/contract.js` is the only one |
| **No user-facing string in `Next/` bypasses `t()`** | It would be un-renameable, and terminology is a headline feature |

---

## 07 — Sequencing inside the UI programme

```
Weeks 1–2    Design system: tokens, 28 components, motion, five-theme review harness
Weeks 2–4    AppShell + Nav (registry-driven) + CommandBar
             ▸ At this point a 'new' user can log in and every classic screen
               renders inside the new shell via the resolver fallback. Usable.
Weeks 3–12   Screen conversion, in the order in 05_SCREEN_SPECS.md §01.
             Each screen = extract-to-Domain (ships) then build-in-Next (hidden).
Weeks 8–14   Studio: Onboarding · MyErp · Terminology · Appearance
Weeks 12–16  Vena discovery panel (tiers 0–2, no LLM call)
Weeks 14–18  Arrangement: dashboard grid, POS tiles, list columns
Weeks 16–20  Five-theme × three-density sweep across every screen; unpin what passes
```

The shell landing in week 4 is the important milestone. **From then on the new experience is continuously usable and continuously demonstrable**, which is what makes ring 0 and ring 1 (your own store, then the public demo store) possible months before the reveal.

---

## 08 — Acceptance criteria

**Extraction**

- [ ] Every converted screen's logic lives in `Domain/`, imported by both shells
- [ ] Each Step-1 refactor proven DOM-byte-identical by snapshot test
- [ ] One test suite per domain hook, covering both shells' behaviour
- [ ] CI: no `fetch` / `router.post` / `useForm` anywhere under `Next/`
- [ ] CI: no hardcoded hex under `Next/`
- [ ] CI: no user-facing string literal under `Next/` outside `t()`

**Shell**

- [ ] Resolver falls back to the classic page for any screen not yet built in `Next/`
- [ ] `Next/` is fully code-split; a `classic` user downloads none of it — verified in the network tab
- [ ] Nav renders from the capability registry, hide-not-lock for chosen-off, locked-with-upgrade for plan-excluded

**Personalisation**

- [ ] Colour picker rejects any combination failing WCAG AA, using the existing `contrastRatio()`
- [ ] Theme switch is a server-rendered attribute — no flash on full page load, SSR intact
- [ ] Dashboard, POS tiles and list columns rearrangeable and persisted per user
- [ ] Store owner can set a default that seeds new staff without overriding existing choices
- [ ] Every screen reviewed in all offered themes before that theme returns to `Appearance::THEMES`

**Reversibility**

- [ ] `classic ↔ new` switches in both directions with zero data change
- [ ] Switch is per tenant with a per-user override
- [ ] Rollback for any tenant is a single `UPDATE`

**Estimate:** 16–20 weeks solo with AI assistance; 8–11 weeks with one senior React engineer. This is the single largest block in the programme and the one where a second pair of hands helps most.
