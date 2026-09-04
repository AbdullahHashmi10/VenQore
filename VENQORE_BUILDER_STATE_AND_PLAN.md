# VenQore — The AI Builder: where it actually is, and what stands between here and launch

**3 September 2026.** Written against the code, not the plan documents. Every claim below
carries a file path you can check. Where a planning document and the code disagree, the code
wins and the document is named as stale.

This answers, in order: what exists · what is broken · how a user creates their system ·
how pages, cards and modules vary per business · what the POS does · what the audit must cover ·
what is left · what to cut · how far you are.

---

## 0. The answer in one paragraph

**You built the two hard ends and skipped the middle.** The engine end is real and good: a
46-module registry with a dependency graph, a single-writer configuration service, a validator,
a route-ownership map that derives itself, and 19 integrity tests that prove the registry cannot
lie. The surface end is real and good: a 5,067-line V6 dashboard verified across 18 viewports, a
provisioning flow that creates a tenant from a preset, 42 live modules. **What is missing is the
wiring between them** — nine specific connections, seven of which are configuration or a few
dozen lines each. The gate that enforces the Rulebook is written but never registered. The
navigation that derives itself is computed on every request and read by nothing. The dashboard
that would show a bakery bakery-numbers is drawing seeded random data. `business_type` — the
column every per-business default keys off — is never written by anything.

**This is much better news than "we need to build a builder."** It is also worse news than "the
dashboard is nearly there," because the dashboard's beauty is currently unattached to any
customer's data. The distance to a sellable AI-builder product is roughly **12–16 focused working
days**, and almost none of it is new invention.

---

## 1. What is verified built

| Layer | Evidence | State |
|---|---|---|
| **Module registry** | `config/modules.php` — 100 KB, 46 modules: **42 live, 2 beta** (`landed_cost`, `composite_items`), **2 building** (`services`, `quotations`) | Solid |
| **Dependency graph** | `app/Engines/ModuleDependencyResolver.php` + `CapabilityDependencyResolver.php` | Solid |
| **Registry integrity** | `tests/tests/Feature/Module/ModuleRegistryIntegrityTest.php` — 19 tests incl. *every route pattern matches a real route*, *every page path exists on disk*, *presets only combine live modules*, *presets are dependency-complete*, *dependency graph has no cycles* | Solid — this is your best asset |
| **Single writer** | `app/Services/AiBuilder/ApplyConfigurationService.php` — transaction, pre-write snapshot, version, full registry row set, cache invalidation | Solid |
| **Validator + AI proposal** | `ConfigurationAIService.php` (Gemini, with spend cap, rate limit, build counter, deterministic `guessPreset()` fallback), `ConfigurationValidator.php`, `ModificationParser.php` | Built |
| **Presets** | `config/ai_builder.php` — **15 presets**, each with `modules`, `terms`, `cards` | Built |
| **Discovery questions** | `config/ai_builder.php['discovery']` — 6 questions with `implies` maps | Built, **not delivered** (see break #7) |
| **Route ownership** | `app/Support/ModuleRouteMap.php` — derives 464 owned route names from the registry, cached on a registry hash | Built, **unused** |
| **Derived navigation** | `app/Support/ModuleNavBuilder.php` — three filters (enabled → live → permitted), labels from `Terms::` | Built, **half-consumed** |
| **Terminology** | `app/Support/Terms.php` + `tenant_terminology` table, shared as an Inertia prop | Built |
| **Metrics — classic** | `app/Services/Dashboard/DashboardRegistry.php` — **20 cards** | Live on the classic dashboard |
| **Metrics — V6** | `app/Reckoner/` — 4,655 lines, 12 source classes, `ReckonerRegistry` with **25 readings** across 4 domains | Live in the API, **not on the V6 dashboard** |
| **Dashboard CRUD API** | `app/Http/Controllers/Api/DashboardController.php` — 757 lines: create/read/update/delete boards, add/update/remove cards, save layout, reset, publish, per-business default board | Built, **zero frontend consumers** |
| **V6 dashboard UI** | `resources/js/Pages/NewDashboard.jsx` — 5,067 lines, six card categories, Layout-Law fit resolver, verified 18 widths × light/dark/mesh, 0 overflow | Built, **on demo data** |
| **Provisioning** | `WorkspaceBuilderController::provision()` — user + tenant + pivot + 14-day trial + modules through the single writer, in one transaction | Working |
| **Test suite** | `tests/VerificationCenter/runs/latest.json` — **1,621 passed, 0 failed, green** | Green **as of 15 Aug** — no full run since |
| **Surface count** | 319 Inertia pages · 152 components · 50 report pages · 1,031 named routes | — |

**Read that table twice.** The proportion of this that is genuinely finished is higher than you
think it is, and it is finished in the places that are expensive to build and cheap to verify.

---

## 2. The nine breaks

Ordered by what they cost you, not by effort. Each is a cut wire, not a missing machine.

### Break 1 — The Rulebook has no teeth *(launch blocker)*

`app/Http/Middleware/EnsureModule.php` exists, is well written, fails open deliberately, and
redirects refusals to the builder rather than to billing. It is:

- **not** in the alias list — `bootstrap/app.php:40-50` registers nine aliases; `module` is not one
- **not** in the web stack — `bootstrap/app.php:24-34` appends nine middleware; this is not one
- **not** on any route — `grep -c "module:" routes/web.php` returns **0**

So today: a cafe that "built" a five-module system can type
`/s/their-shop/production` and use manufacturing. Every module you hide is still reachable by
URL. The Rulebook's three parts are *AI never offers it* (works), *nav never shows it* (half
works), *URL doesn't work* (**does not exist**). Two out of three is a leak, and it is the leak
that turns "I built my own system" into "the menu is just shorter."

**Why this is cheap:** `ModuleRouteMap` derives ownership from the registry automatically. You do
not annotate 464 routes. You register one alias, append one class to the web group, and run the
suite.

### Break 2 — The real shell ignores the derived nav *(launch blocker)*

`HandleInertiaRequests.php:180-182` computes `nav` from `ModuleNavBuilder` on every request.

- `resources/js/Pages/NewDashboard.jsx:4381` reads it. Correct.
- `resources/js/Layouts/OneGlanceLayout.jsx` — **the shell for ~158 pages** — does not. Its
  sidebar is a hardcoded `appMenuItems` array filtered at line 808 by **role and permission only**
  (`MENU_PERMISSIONS`). Modules are not consulted.

So the V6 dashboard shows a bakery its bakery menu, and every other page in the product shows it
the full ERP menu. **Two shells disagreeing about what the product is, is worse than one shell
being wrong.**

### Break 3 — The V6 dashboard draws invented numbers *(launch blocker)*

`routes/web.php:1084`:

```php
Route::get('/new-dashboard', fn() => Inertia::render('NewDashboard'))->name('new-dashboard');
```

No controller. No props beyond the shared ones. Inside the page, `seed(str)` at line 349 generates
deterministic pseudo-random values keyed off each card's name — every metric, sparkline, heatmap
and geo chart on that dashboard is fabricated.

Meanwhile `Api/DashboardController` (757 lines) can serve exactly this page real, permission-gated,
Reckoner-backed readings and persist the user's layout. **Nothing in `resources/js` calls
`/api/dashboards`.** One `AddCardModal.jsx` calls `/api/reckoner`; that is the entire consumption
of your metrics API.

This is the single largest gap between what you believe ("the dashboard is nearly there") and what
a customer would get. The *interface* is nearly there. It is not yet a dashboard — it is a
rendering of a dashboard.

### Break 4 — `business_type` is never written *(launch blocker, trivial fix)*

The column exists (`2026_08_11_100000_add_business_type_to_tenants_table.php`). It is read in three
places, most importantly `Api/DashboardController::defaultBoardFor()` (line ~752), which resolves
`config/dashboard_presets.php` → the right starting board for a pharmacy vs a restaurant.

**No code writes it.** Not `WorkspaceBuilderController::provision()`, not
`OnboardingExperienceController::applyPreset()`, not `ApplyConfigurationService`. Every tenant
falls through to `business.default`, so the 33 KB of per-business dashboard presets you wrote is
inert. Two lines fix it.

### Break 5 — There is no way to change your system after signup *(launch blocker)*

- No `store.builder` route exists (`EnsureModule::refuse()` already tries to redirect there and
  falls back to the dashboard).
- `resources/js/Pages/Settings/` contains three files: `Appearance`, `ChatbotSettings`,
  `SettingsPanel`. No module management.
- The post-signup wizard (`Onboarding/Wizard.jsx` + `AiDiscovery.jsx`, which *does* call the real
  Gemini pipeline) is routed at `store.onboarding.v2` but **linked from nowhere in the UI**.

Your own copy strategy is *"Start with what you need today. Add modules any time — no extra cost
within your plan."* Right now that sentence is not true. A customer who picks wrong is stuck.
This is the promise that makes the whole positioning safe to buy; it cannot ship missing.

### Break 6 — The public "AI" is keyword matching

`WorkspaceBuilderController::analyze()` deliberately uses `guessPreset()` — the deterministic
alias-scored matcher — because the pre-signup path has no tenant to rate-limit or bill against.
**That reasoning is correct and I would not change it.** But it means the landing-page experience
labelled as AI is a preset match, and if a visitor types something outside the 15 presets they get
`retail_shop`.

Not a blocker. It *is* a copy and design problem: the moment the visitor sees a result that
obviously ignored what they typed, the "AI ERP builder" claim dies. Fix it in the interface (echo
their words back, name the matched business type, show the modules with reasons, offer *"not
quite? tell us"* → `demand_log`) rather than by making an unauthenticated model call.

### Break 7 — The onboarding wizard receives an empty question set

`OnboardingExperienceController::index()` passes `config('ai_builder.questions')`. That key **does
not exist** — the questions live under `discovery`. `Wizard.jsx:11` defaults `questions = []` and
`AiDiscovery.jsx` never references the prop at all. One-word fix in the controller, then the
discovery UI needs to actually consume it.

### Break 8 — Two metric engines, four dashboard generations

Nine dashboard surfaces are rendered from controllers today:

`Dashboard` · `NewDashboard` · `Workspace/Dashboard` · `Workspace/Overview` ·
`Dashboards/CashierDashboard` · `AccountantDashboard` · `PurchasingDashboard` · `ViewerDashboard`
· `Workspace/BuildWorkspace`

And two independent metric systems that do not share a line of code: `DashboardRegistry` (20 cards,
its own queries, no Reckoner) and `ReckonerRegistry` (25 readings, 12 sources, permission-aware).
Presets reference the *DashboardRegistry* card keys; the V6 card modal reads the *Reckoner*
catalogue.

This is the thing that will eat weeks quietly if you do not decide it now. Section 5 decides it.

### Break 9 — Reports and the POS are not module-aware

- `app/Support/ReportModuleMap.php` — 237 lines mapping reports to owning modules — is imported by
  **nothing**. All 50 report pages are visible to everyone.
- `resources/js/Pages/Pos.jsx` — 6,065 lines — contains **zero** references to the `modules` prop.
  A five-module cafe and a fourteen-module grocery get an identical POS screen.

---

## 3. How a user actually gets their software

This is the flow to build. Six stages. Stages 1–4 mostly exist; 5–6 are the gap.

### Stage 1 — Landing (exists)
`LandingPage.jsx:1375` sends the typed sentence to `/build-workspace?prompt=…`. Keep this. One
input, one sentence, no signup wall. It is the strongest thing in the funnel.

### Stage 2 — The read-back (exists, needs rework)
`/build-workspace` → `analyze()` → preset. **Redesign what is shown.** Three things must appear:

1. **Their words, quoted.** "You said: *I run a bakery and take wedding orders.*"
2. **The named result.** "That's a **Bakery**. Here's the system." — never "Custom Workspace,"
   which reads as a failure to understand.
3. **Modules with reasons, not a checklist.** "Recipes & Production — because you bake what you
   sell." "Custom Orders — because you take orders ahead of time." A reason per module is what
   makes this feel built rather than matched.

Plus: **"Not quite right? Tell us what you do."** → `demand_log`. Every miss becomes a named
prospect for a preset you now know is worth writing.

### Stage 3 — Adjust before committing (partly exists)
`show()` already ships the full live-module catalogue for adding. What it needs: dependency
feedback in the UI. Turning off Products should visibly grey out POS and explain why — the
resolver already knows this, the interface never says it.

### Stage 4 — Provision (exists, two additions)
`provision()` works. Add: **write `business_type`** (break 4), and **seed the first board** from
the preset's `cards` via `Api/DashboardController`'s own creation path — so the customer's first
screen is already theirs, not a default that they then have to fix.

### Stage 5 — The reveal *(missing — build this)*
Land them on the **V6 dashboard with their real, empty numbers**, not the classic one. An empty
state that says *"Your bakery system is ready. Nothing recorded yet — here's the first thing to
do"* is a far better first impression than a full ERP menu they didn't ask for. Route
`store.dashboard` to `NewDashboard` once break 3 is fixed.

### Stage 6 — Change it later *(missing — build this)*
`/s/{slug}/builder`. One screen, three affordances:

- the current system as module cards, grouped A–G, each toggleable
- a plain-language box → `ModificationParser` (already written) for *"add customer credit"*
- what a switch-off will hide, from `ModuleService::dataAtStake()` (already written) — **never
  delete data on disable**; hide it and say so

This screen is also where `EnsureModule` sends people, so it must exist before the gate is turned on.

---

## 4. How variation actually works — the four dials

You have asked how different businesses get different pages, cards and modules. There are exactly
four dials, and it is worth being strict that there are only four, because the fifth idea — a
page whose *structure* changes per business — is where this project would die.

| Dial | Mechanism | State |
|---|---|---|
| **1. Which surfaces exist** | `tenant_modules` → nav, route gate, report visibility | Data layer done; nav half-wired, gate off, reports unwired |
| **2. What things are called** | `tenant_terminology` → `Terms::` → nav labels, page headings | Done server-side; almost nothing on the frontend reads it |
| **3. Which numbers are shown** | preset `cards` → board → Reckoner readings | Both halves built, not joined |
| **4. What the defaults are** | `business_type` → `dashboard_presets.php`; module defaults per preset | Inert until `business_type` is written |

**Everything else is the same product for everyone, and that is correct.** A pharmacy's invoice
page and a bakery's invoice page are the same page with a different word at the top and different
columns hidden. The moment you allow per-business page *layouts*, you have 40 products to test
instead of one, and the 1,621-test suite that makes your numbers trustworthy stops meaning
anything.

**Say this publicly as a strength**, because it is one: *"the same tested engine, arranged for your
business."* Not *"custom software."* You cannot support custom software at $36/month and you should
never promise it.

### On the 150+ contextual cards
Defer, as you decided — but for a sharper reason than "we only have 20." You have 20 curated
dashboard cards and 25 Reckoner readings, and the placement layer (a metric strip at the top of
each listing page) does not exist in any form. Building it now means designing, building and
testing a second card system while the first one is not yet connected to real data. **Connect the
first one. Ship. Then place the strip on the five listing pages that matter, using the same
Reckoner readings and the same card components.** The engine will be waiting and the components
will already be proven.

---

## 5. The dashboard decision

You have four generations of dashboard alive at once. Pick one now, in this order:

1. **`NewDashboard.jsx` is the product dashboard.** It is the only one built to the Layout Law and
   the only one that is module-aware. Wire it to `Api/DashboardController`, kill the seed
   functions, and point `store.dashboard` at it.
2. **`ReckonerRegistry` is the one metrics engine.** It is permission-aware, cache-aware,
   shape-typed and drill-routed. `DashboardRegistry`'s 20 cards become *reading keys plus a default
   board*, not a second query layer. All 16 preset card keys already exist in it in name; the
   mapping is a table, not a rewrite.
3. **The four role dashboards become boards, not pages.** `dashboards.for_role` already exists in
   the schema. A cashier board is a row, not a `CashierDashboard.jsx`.
4. **`Workspace/Dashboard` and `Workspace/Overview` are archived** unless one of them is the actual
   V6 target — decide, then delete the other. Dead dashboards are how the next audit gets the
   wrong answer.

You were right in `06_EXPECTATION_VS_REALITY.md` to push back on freezing the dashboard builder,
and the code agrees with you: the builder exists on the server and has no client. Your instinct
that a system which cannot lay out 7 role dashboards will not survive 40 business types is
correct — but the fix is *connect the one good system*, not build a fifth.

---

## 6. The POS

The POS is the screen your customers stand in front of for eight hours, and it is currently
identical for all 15 presets. It does not need per-business layouts. It needs **four
module-conditional regions**, driven by the `modules` prop it already receives and ignores:

| Region | Shown when | Today |
|---|---|---|
| Table / floor map | `table_service` | Always available via its own route |
| Hold / park & recall | `park_recall` | Always |
| Khata / credit tender | `khata_credit` | Always |
| Batch or serial picker at the line | `batches_expiry` / `serials` | Always |

Plus terminology: a restaurant's "Sale" is an "Order," its "Customer" a "Table" — both already in
`config/ai_builder.php`'s preset `terms`, both already reaching the frontend as `props.terms`,
both currently unread by `Pos.jsx`.

That is the whole POS job: **one prop read, four conditionals, one terminology helper.** Not a
rewrite. Resist any instinct to build a second POS.

---

## 7. The 319 pages

Do not audit 319 pages. Sort them into four buckets and treat each bucket once.

| Bucket | Count (approx) | Treatment |
|---|---|---|
| **Gated by a module** | most of the 319 | `EnsureModule` handles all of them at once via `ModuleRouteMap`. No per-page work. |
| **Always on** | settings, billing, profile, backups | On the always-on list. No work. |
| **Reports** | 50 | Wire `ReportModuleMap` into the reports nav + the route gate. One integration, 50 pages fixed. |
| **Needs terminology** | ~15–20 high-traffic pages | Read `props.terms` for the heading and the primary noun. Do the top 15 only: POS, Sales, Invoices, Customers, Suppliers, Products, Inventory, Purchases, Expenses, Payments, Reports index, Dashboard, and the three listing pages your presets touch most. |

Everything left is a V6 styling sweep, and `V6_COMPLETION_AUDIT.md` §4 already ranks it by
worst-adopted. That is a separate track from the builder and must not be allowed to block it.

---

## 8. The audit you asked for

Run these in order. Each is a script or a test, not a reading exercise — the reading has already
been done twice and produced documents that are now partly stale.

1. **Route gate coverage.** With `EnsureModule` registered, assert for each of the 46 modules: with
   the module off, every route `ModuleRouteMap` says it owns returns 403/redirect. This is a
   generated test, ~40 lines, and it is the proof the Rulebook holds.
2. **Nav ↔ gate agreement.** For 20 sampled module combinations, assert every nav item resolves to
   a route the gate allows, and no allowed store route is missing from the nav. Catches both leak
   directions.
3. **Preset smoke.** For all 15 presets: provision a tenant, apply, load the dashboard, the POS and
   each nav destination, assert 200 and no console error. This is the test that tells you whether
   you can actually sell 15 business types.
4. **Reading coverage.** Every card key in every preset resolves to a Reckoner reading, returns a
   value for an empty tenant without erroring, and respects permissions. Empty-tenant behaviour is
   what every trial user sees first and it is the least-tested state in the product.
5. **Terminology sweep.** Every `Terms::` key used in `config/modules.php` and preset `terms` has a
   fallback, and no page prints a hardcoded noun that a preset renames.
6. **Full suite re-run.** The last green run is **15 August**. Everything in the V6 pass, the
   dashboard rebuild and the auth rework landed after it. You do not currently know that you are
   green. Run it before anything else in section 9, so you are measuring from a known point.

Two things from `V6_COMPLETION_AUDIT.md` §3 also need answering because they are security- or
regression-shaped, not cosmetic: **`public/v6/` is publicly crawlable** and currently serves
internal audit notes and pricing rationale — move it out of the docroot this week; and
**`public/v6/src/` has diverged from `public/v6/assets/`**, so anyone running `node build.mjs`
reverts months of work — reconcile or delete `src/`.

---

## 9. The plan, with a cut line

Everything above the line is required to sell "the AI ERP builder" honestly. Everything below it
is a real improvement that does not block a sale. **Estimates assume your working pattern with an
IDE agent.**

### Above the line — 12–16 days

| # | Work | Days |
|---|---|---|
| 0 | Full suite re-run; fix what the 3 weeks since 15 Aug broke | 1–2 |
| 1 | Register `EnsureModule` (alias + web stack); build the generated gate-coverage test | 1 |
| 2 | Build `/s/{slug}/builder` — module cards, plain-language box, data-at-stake warnings | 2 |
| 3 | Wire `OneGlanceLayout` to the shared `nav` prop; delete the hardcoded menu | 1–2 |
| 4 | Connect `NewDashboard` to `Api/DashboardController`; delete `seed()`; point `store.dashboard` at it | 2–3 |
| 5 | Write `business_type` on provision; seed the first board from the preset's `cards` | 0.5 |
| 6 | Reports: wire `ReportModuleMap` into nav + gate | 1 |
| 7 | POS: read `props.modules` and `props.terms`; four conditional regions | 1 |
| 8 | Terminology on the top 15 pages | 1 |
| 9 | Rework the `/build-workspace` read-back (quote, name, reasons, "not quite?") | 1 |
| 10 | Fix the `questions`/`discovery` key; link the post-signup wizard; empty-state first run | 0.5 |
| 11 | Preset smoke test across all 15; move `public/v6/` out of the docroot | 1 |

### Below the line — after launch, in this order

Contextual metric strips on listing pages · themes, colours, bklit charts · the conversational
dashboard ("add a card showing past sales") · `Platform/ui.jsx` inline-style migration · the 501
z-index stops · `DataTable` adoption across the 146 hand-rolled tables · `OneGlanceLayout` split
into four files · `services` and `quotations` promoted from `building` to live.

**The conversational dashboard is the one I would most warn you about.** It is the most exciting
item on your list and it is worth building — *after* the dashboard is showing real numbers.
Natural-language editing of a board that draws fabricated data is a demo, and demos are what have
been absorbing your months.

---

## 10. How far are you

**From a defensible AI-builder launch: 12–16 working days**, assuming step 0 does not turn up
something large. That is a genuine estimate against a verified gap list, not an encouragement.

Three things could extend it, and you should watch for them by name:

- **Step 0 turns red.** Three weeks of V6, auth and dashboard work landed on an unverified suite.
  If the Aug 15 green has decayed badly, add 2–4 days.
- **Step 4 is the one with real depth.** Connecting a 5,067-line card system to a 757-line API is
  not wiring in the trivial sense; it is a day of contract-matching and two of making empty and
  error states not look broken.
- **The design sweep pulls you in.** `V6_COMPLETION_AUDIT.md` §4 is a long, satisfying, highly
  visible list, and every hour spent on it is an hour the product still cannot honestly be called
  a builder. Freeze it below the line.

**What you should not do before launch:** atomise the 46 modules further (you settled this
correctly in August — say "about 30 modules and the AI picks the right ones," never "250 building
blocks"); rebuild billing (plans become ceilings, the Builder decides usage — zero code changes);
build the contextual card placement layer; or add a sixteenth preset. Fifteen business types
honestly delivered beat forty listed and three that work.

---

## 11. The two sentences to hold onto

**On the product:** the same tested engine, arranged for your business — not custom software.

**On where you are:** you are not missing a builder. You are missing nine wires, and you have the
test suite to prove each one once it is connected.
