# VenQore V3 Programme — Master Index

**Prepared:** 11 August 2026
**Status:** the plan to build from
**Supersedes on sequencing, UI strategy and scope:** `VENQORE_BLUEPRINT_V2_SILENT_BUILD_AND_REVEAL.md`
**Still authoritative for engine inventory and AI architecture:** `VENQORE_FINAL_IMPLEMENTATION_BLUEPRINT.md` (§03 asset inventory, §12–13 Vena + AI cost model, §14 Protocol 7)
**Still authoritative for the entitlement findings:** `VENQORE_AUDIT_II_BUILD_YOUR_OWN_ERP.md`

---

## What this programme is

VenQore stops being *a retail POS with an ERP attached* and becomes **a system that assembles a business's software out of pre-built, already-tested components.**

The claim we can honestly make at the end of V1:

> *Describe your business. VenQore assembles it from components that have been running in production for two years — not generated on the spot, not one-shot AI code. Then you rename it, arrange it and colour it until it is yours.*

The thing we are **not** building is an AI that writes code at runtime. We are building a **composition engine** over ~250 capability keys backed by 13 verified engines, plus an AI layer whose only job is to choose which components to switch on and what to call them.

---

## The four decisions that shaped this plan

| # | Decision | Chosen |
|---|---|---|
| 1 | How deep does Services go in V1? | **Full field service.** Service product type + Job/Work Order engine + quotation→job→invoice + technician assignment + van stock + AMC contracts. Covers electrician, plumber, AC technician, appliance repair, IT/AMC. No Scheduling family in V1. |
| 2 | New UI folder vs. change in place | **Headless split.** Page logic is extracted out of the 297 existing pages into shared hooks. Both the old shell and the new folder consume the same hooks. New UI is built entirely separately, cannot break the old system, and no rule is ever written twice. |
| 3 | Which businesses in V1 | **Tier A + Tier B + Services** — approximately **48 business types.** |
| 4 | Document set | This new numbered set. Older docs keep a supersession banner. |

**Decision 2 is the one that needed care.** You asked for two things that pull against each other: *work on the new UI separately so nothing breaks*, and *don't do the work twice*. Both are achievable, but only if the thing that gets duplicated is the **markup**, never the **logic**. §04 is the whole mechanism.

---

## The documents

| File | Scope | Who it is for |
|---|---|---|
| **`00_MASTER_INDEX.md`** | This file — decisions, sequencing, how the parts fit | Read first, always |
| **`VENQORE_V1_CANONICAL_BUSINESS_VOCABULARY.md`** | **The semantic contract.** Canonical model, capability registry rules, terminology schema, all 48 businesses mapped, code/database/UI matrices, AI resolution rules, never-rename list. **Nothing in `01` may begin until this is agreed.** | Everyone — engineering, AI, UI, sales |
| **`01_BACKEND_AND_DATA.md`** | Code, database, table names, function names, capability registry, terminology. **No visible change anywhere.** | The silent-work backlog |
| **`02_LEGACY_TO_V3.md`** | Deleting the duplicate service generation; migrating call sites | Do before §01's normalisation |
| **`03_SERVICES_AND_FIELD_WORK.md`** | The one genuinely new engine family: services as products, jobs, technicians, contracts | The new build |
| **`04_UI_PROGRAM.md`** | The headless split, the new folder, the design system, personalisation and theming | The visible work |
| **`05_SCREEN_SPECS.md`** | Screen by screen: invoice, expense, POS, products, parties, dashboard, reports, settings | Build order for the new UI |
| **`06_BUSINESS_CATALOGUE_V1.md`** | Every business type V1 serves, what it needs, its capability set and terminology map | Sales, marketing, onboarding templates |
| **`07_SEQUENCE_AND_ACCEPTANCE.md`** | Phases, timeline, parity suites, rollout rings, definition of done | Weekly driving document |

---

## What changed since Blueprint V2 — verified in the code, 11 August 2026

Three findings materially alter the plan. All were checked directly, not assumed.

### 1. The theming and experience-switch work is already built, and currently switched off

`app/Support/Appearance.php` exists and already resolves **theme · mode · custom primary · custom accent · font · density · corner radius · experience** with a four-level precedence chain (user-per-store → user-account-wide → store default → system default). `resources/js/theme/appearance.js` already turns a user's chosen hex into a full eleven-stop perceptual ramp. `app.blade.php` already writes `data-vq-theme`, `data-vq-density`, `data-vq-radius` onto `<html>` before first paint, so there is no flash and SSR still works.

Most importantly, `Appearance::EXPERIENCES = ['classic', 'new']` already exists — **this is the `ui_version` switch Blueprint V2 proposed, already implemented, at per-user granularity rather than per-tenant.**

It is all behind one kill switch:

```php
// app/Support/Appearance.php
public const NEW_EXPERIENCE_ENABLED = false;   // set 2026-08-09
```

**Consequence for this plan:** Blueprint V2's §04 (themes) and §06 (the `ui_version` switch) are largely *done*, not *to do*. What remains is (a) re-verifying the three retired themes across every screen, (b) promoting `experience` from a user preference to a tenant-level default with a per-user override, and (c) building the screens the switch points at. Do not rebuild any of it.

### 2. `products.type` is already an enum — Services is a one-line schema change

```php
// 2025_12_29_153358_create_amd_tables.php:17
$table->enum('type', ['standard', 'weighted', 'composite'])->default('standard');
```

Adding `'service'` is a single `ALTER`. The hard part of Services was never the product record; it is the Job engine and the stock-bypass rules. §03 covers both.

### 3. Four service-shaped industry presets already ship with no engine behind them

`config/industries.php` contains 21 presets, and four of them — **MobileRepair, Solar, IT, Consulting** — are already sold as supported despite there being no job, work-order or labour concept in the product. That is a promise the code cannot currently keep, and §03 closes it. It also means the market signal for Services was already there.

---

## How the parts fit together

```
                       ┌──────────────────────────────────────────┐
   02 LEGACY→V3        │ delete the duplicate service generation  │  invisible
        ↓              └──────────────────────────────────────────┘
                       ┌──────────────────────────────────────────┐
   01 BACKEND & DATA   │ capability registry · dependency graph   │  invisible
        ↓              │ terminology t() · generic renames        │  ships to prod
                       │ occupancy unification · enforcement      │  continuously
                       └──────────────────────────────────────────┘
                       ┌──────────────────────────────────────────┐
   03 SERVICES         │ service product type · Job engine        │  invisible until
        ↓              │ technicians · van stock · AMC            │  a capability is on
                       └──────────────────────────────────────────┘
                       ┌──────────────────────────────────────────┐
   04 UI PROGRAM       │ headless hooks extracted from old pages  │  new folder,
   05 SCREEN SPECS     │ new design system · new screens          │  unreachable,
        ↓              │ personalisation · arrangement            │  perfected offline
                       └──────────────────────────────────────────┘
                       ┌──────────────────────────────────────────┐
   06 CATALOGUE        │ 48 business templates over the registry  │  config only
        ↓              └──────────────────────────────────────────┘
                       ┌──────────────────────────────────────────┐
   07 ACCEPTANCE       │ parity green 14 days → rings → reveal    │
                       └──────────────────────────────────────────┘
```

**The three rules that govern every commit in this programme:**

1. **Every backend change ships to production immediately, with a default that reproduces today's behaviour exactly.** If a PR changes what a tenant with no configuration sees, it does not merge.
2. **No business rule is written twice.** Logic lives in one place — a service, or a headless hook. The new UI folder contains presentation only.
3. **The new UI folder is never reachable at `experience = 'classic'`.** It is code-split; a classic user never downloads it.

---

## Honest scope statement for V1

**What we will be able to say, truthfully, on reveal day:**

- 48 business types, each with a working template — not a marketing list
- Every capability the user sees is genuinely enforced on web, API, jobs and exports
- Users rename anything, choose their theme and colours, arrange their own dashboard
- Vena answers "do we have X?" and switches capabilities on with the user's approval, at near-zero AI cost
- Existing customers keep their exact interface for 12 months, switchable both ways with no data change

**What we will not be able to say, and must not imply:**

- Anything requiring the Scheduling family — salon, gym, clinic, lab, academy, rentals, coworking. That is the next build after V1 and it unlocks 16 businesses in one go.
- Anything requiring Projects — construction, agencies, law, accounting practices.
- Hotel. It sits behind three engine families and is the worst possible early target.
- "AI writes your software." It does not. It composes tested components, and that is a *better* claim — say that one.

---

## Next action

1. **Agree `VENQORE_V1_CANONICAL_BUSINESS_VOCABULARY.md`.** It is the semantic contract, and every rename, capability key and terminology decision downstream depends on it. Sign off §27's checklist first.
2. Read `07_SEQUENCE_AND_ACCEPTANCE.md` for the week-by-week ordering.
3. Start at `02_LEGACY_TO_V3.md` — it can run in parallel with (1), because deleting duplicate services depends on no vocabulary decision.

Nothing in `04`/`05` may begin until the headless extraction contract in `04_UI_PROGRAM.md` §02.2 is agreed, because that contract is what stops the work being done twice.

## Two honest gaps found while writing the vocabulary document

Both sit inside Tier A, which we were about to claim as "ready today":

- **Optical** needs somewhere to record a lens prescription. **Tailoring** needs somewhere to record measurements. Neither has anywhere to live until the custom-field sidecar exists (~8 days). Either ship it in V1, or sell those two without field capture and say so.
- **Jewellery** has no live metal-rate mechanism. A jeweller enters today's rate manually. That is how most shops work, but do not claim automatic rate feeds.
