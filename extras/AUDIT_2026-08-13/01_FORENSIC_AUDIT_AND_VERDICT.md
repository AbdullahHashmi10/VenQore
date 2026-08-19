# VenQore — Forensic Audit & Launch Verdict
**Audit date:** 13 August 2026
**Method:** Direct inspection of the repository at `E:\AMD POS\AMD POS` (git history, migrations, seeders, services, routes, frontend, last test-run artifacts). No claim below is taken from previous AI reports or from your documentation.

Every statement is tagged:
- **FACT** — verified in the repo, evidence given
- **INFERENCE** — my reading of the facts
- **RECOMMENDATION** — my opinion

---

## 1. EXECUTIVE VERDICT

**Backend verdict: B — MOSTLY COMPLETE, but split in two.**

There are actually two backends in this repo, and they are at completely different maturity levels:

| Layer | State | Age |
|---|---|---|
| Classic ERP / POS / accounting engine | **MOSTLY COMPLETE** — deep, real, largely tested | ~3 months of work |
| "Build Your Own ERP" AI-configurator layer | **SKELETON** — tables + seeder exist, almost nothing is wired | **2 days old** |

**FACT.** The AI-builder foundation is dated in the repo itself:
- `database/migrations/2026_08_11_100000_add_business_type_to_tenants_table.php` — **2 days ago**
- `database/migrations/2026_08_12_062316_create_capabilities_tables.php` — **yesterday**

So when several agents told you "the backend is done," they were right about the *ERP* and wrong about the *AI Builder*. The AI Builder foundation was laid 48 hours ago and is not connected to the running application yet.

**AppSumo verdict: WAIT — but not 10–12 days of building. ~12–14 days, and only ~5 of those days are AI Builder work. The rest is fixing what is currently red.**

The blocker for AppSumo today is **not** positioning. It is that your last full test run failed.

---

## 2. HISTORICAL TIMELINE (verified from git)

**FACT.**
- First commit: **2026-05-16** ("Initial commit from AMD POS")
- Today: **2026-08-13**
- **Elapsed: 89 days ≈ 3 months.**

**INFERENCE on the "six months" estimate.** You remember being told this would take six months. You are 3 months in and the classic ERP is genuinely at a 3-months-of-a-team level (716 PHP files in `app/`, 307 migrations, 250 test files, 301 frontend pages, ~191,000 lines of JS/JSX). Working 15–16 hour days with AI assistance, you have compressed roughly the schedule that was predicted. That estimate was not wrong — you beat it by working at an unusual rate. **You have not, however, beaten it on the AI Builder, because the AI Builder is a different product that you started 2 days ago.**

Recent git history confirms where the energy went: `V3` consolidation, plan/entitlement consolidation, dashboard builder, permissions/sidebar. Latest commit: *"Complete Composable Dashboard Builder (Phases B0-B4)"*.

---

## 3. CURRENT REPOSITORY REALITY

**FACT — scale:**

| Metric | Count |
|---|---|
| PHP files in `app/` | 716 |
| Eloquent models | ~200 (`app/Models`) |
| Migrations | 307 |
| Test files | 250 |
| Frontend pages (`resources/js/Pages/*.jsx`) | 301 |
| Total JS/JSX lines | ~191,349 |
| `routes/web.php` | 2,166 lines |
| Plan/feature enforcement points in `routes/web.php` | **132** (grep `plan.feature\|feature:`) |

**FACT — repo hygiene problem.** The root of `app-code/main-app` contains **200+ loose debug/throwaway scripts** committed alongside the application: `tmp_*.php` (~50 files), `debug_*.php`, `check_*.php`, `audit_*.php`, `fix_*.ps1`, `restore_vyapar_*.php` (8 variants), `test.php`, `test2.php`, `race1.log`, `safe.env`, a file literally named `first()))`, and `node_modules`/`vendor` visible in the tree.

**RECOMMENDATION.** `safe.env` in the repo root is a red flag — check immediately whether it contains live credentials and whether it is gitignored. Before any AppSumo submission or code handover, move all `tmp_*`, `debug_*`, `check_*`, `audit_*`, `restore_*`, `fix_*`, `test_*.php` root scripts into `scratch/` and gitignore it. This is a 30-minute job and it is the cheapest credibility win available. It is also a real security surface: several of those scripts (`create_test_user.php`, `fix_admin_passcode.php`, `truncate_tables.php`, `clean_db.php`, `wipe_test_data.php`) are dangerous if they ship inside a web-accessible directory.

---

## 4. BACKEND FORENSIC AUDIT

### 4.1 Core ERP — verified present and substantial

**FACT.** The business engine lives in `app/Engines/` and is a genuine service layer, not stubs:

`AccountingService`, `FifoService`, `InventoryService`, `ManufacturingService`, `PaymentService`, `PurchaseService`, `SaleService`, `SaleReversalService`, `SettlementService`, `TaxService`, `UomService`, `PartyService`, `OccupancyEngine`, `ServiceEngine`, `AuditService`, `CapabilityDependencyResolver`.

**FACT.** Domain models exist for every subsystem you listed, including the hard ones: `JournalEntry` / `JournalItem` (double-entry), `InventoryBatch` / `SaleItemBatch` (FIFO by batch), `StockTransfer`, `StockTake`, `Composition` / `ManufacturingRule` / `ProductionRun` (manufacturing), `ProductSerial` (IMEI), `Occupancy` / `RestaurantTable` (restaurant), `WooConnection` / `WooSyncQueue` / `WooSyncLog` (WooCommerce), `AppSumoCode`, `TenantPlanOverride`.

| Subsystem | Verdict | Evidence |
|---|---|---|
| Products / categories / units / variants / serials / batches | COMPLETE | models + engines + tests passing |
| Sales / POS / returns / parked sales | COMPLETE | POS area 28/28 tests passing |
| Purchases / suppliers / purchase orders | COMPLETE | Purchasing 6/6 passing |
| Inventory / FIFO / warehouses / transfers / stock takes | COMPLETE | Inventory 15/15 passing |
| Double-entry accounting / ledgers | MOSTLY COMPLETE | Accounting 158/159 passing |
| Financial reports | NEEDS VALIDATION | see §4.4 — Golden suite is red |
| Manufacturing / compositions | MOSTLY COMPLETE | engine + tests present |
| Multi-tenancy & isolation | MOSTLY COMPLETE | Tenant Isolation 13/13 passing |
| Plans / entitlements / overrides | MOSTLY COMPLETE | see §4.2 |
| WooCommerce | MOSTLY COMPLETE | Integrations 39/40 |
| Billing / Lemon Squeezy | MOSTLY COMPLETE | Billing 81/82 |
| AI (chat/reports layer) | COMPLETE for what it is | AI 79/79 passing |
| **AI Builder / configurator** | **SKELETON** | see §5 |

### 4.2 SaaS entitlement infrastructure — your earlier notes were accurate

**FACT.** The things you remembered do still exist and are real:
- `database/migrations/2026_04_21_000005_create_tenant_plan_overrides_table.php` — table exists
- `App\Services\PlanRepository::getEffectiveLimit()` — exists (line 96), with per-tenant override lookup + `Cache::remember` + expiry filtering
- `PlanRepository::canUseFeature()` (line 185), `featuresFor()` (line 251), `limitsFor()` (line 293), `invalidateTenantCache()` (line 173)
- `override_key` / `applied_by` / `expires_at` columns — referenced in code and migrations
- **132** route-level enforcement points in `routes/web.php` (you remembered ~134 — close enough that I consider your number verified)
- `PlanFeatureMatrixSeeder.php` — exists; `CapabilitiesRegistrySeeder` parses it and reports **12 capability groups** (`onboarding, pos, invoicing, procurement, inventory, ecommerce, accounting, reports, infrastructure, ai, chat, support`)

**Verdict: MOSTLY COMPLETE.** This is the strongest, most launch-ready part of your SaaS layer.

### 4.3 The one architectural problem in the entitlement layer

**FACT.** `CapabilitiesRegistrySeeder` does not define capabilities. It **regex-scrapes `PlanFeatureMatrixSeeder.php` source code line by line** and derives capability keys and labels from it:

```php
$content = file_get_contents(database_path('seeders/PlanFeatureMatrixSeeder.php'));
...
if (preg_match('/^\s*\'([a-z0-9_]+)\'\s*=>\s*\[/', $line, $matches)) {
    $key = $matches[1];
    $label = ucwords(str_replace('_', ' ', $key));
```

**INFERENCE — and this is the single most important architectural finding in this audit.** Your "capability registry" is not a canonical ERP capability model. It is your **billing/pricing feature list**, auto-converted. Those are two different things:

- A *billing feature* answers "has this tenant paid for X?"
- A *capability* answers "does this business do X?"

A grocery store on your top plan has *paid for* manufacturing but does not *do* manufacturing. Your registry currently cannot express that difference, because both concepts are stored in the same place — `tenant_plan_overrides` — which is exactly what `TenantDefaultSeeder::seedTemplateBuildingBlocks()` does today:

```php
// 1. Seed capabilities into tenant_plan_overrides
foreach ($selectedTemplate['capabilities'] as $capKey) {
    DB::table('tenant_plan_overrides')->updateOrInsert(...'applied_by' => 'system_template'...);
}
```

**RECOMMENDATION.** This must be separated before you build the AI Builder, and it is a ~1 day job, not a rewrite. Two questions, two tables:
- `tenant_plan_overrides` = **entitlement** (what they're allowed to buy/use) — keep exactly as is
- `tenant_capabilities` (new) = **configuration** (what this business has turned on)

Effective visibility = `entitled AND configured`. If you skip this, then the day a user says "remove manufacturing," you will be writing to their billing entitlements, and their plan will silently degrade. That is a refund-generating bug on AppSumo. Details in Document 02.

Also derive the registry from a **hand-written PHP config file** (`config/capabilities.php`), not by regex-parsing another seeder's source. Parsing source code to build a runtime registry is fragile: any reformat of `PlanFeatureMatrixSeeder.php` silently changes your capability list. **FACT:** the guardrail suite already caught drift of this kind — `RegistryDriftTest` failed with *"Registry declares 1500 phpunit test methods but the filesystem has 1525."*

### 4.4 Testing — the real launch blocker

**FACT.** `tests/reports/last-run.json`, finished **2026-08-10T04:06:56Z** (3 days ago):

| | |
|---|---|
| Expected | 1,474 |
| Executed | 1,474 |
| **Passed** | **1,227** |
| **Failed** | **197** |
| Skipped | 6 |
| Incomplete | 44 |
| Assertions | 6,997 |
| Duration | 592s |
| **Exit code** | **2 (FAILING)** |

Your remembered numbers (701 tests / 258 golden) are **out of date** — the suite has grown to ~1,474 and 250 test files. Failing areas as of that run: **Financial Engine, Security, Routes, Guardrails, Integrations, Billing, Unit, Feature(general)**.

**FACT — the good news, and it is very good news.** Of 100 recorded failure entries, **90 share one identical message**:

```
InvalidArgumentException: Invoice not found: gc-pur-001-000000000000000000001.
Tenant: 999991. Type: purchase.
  at app\Services\V3\PaymentService.php:184
  at database\seeders\GoldenCompanySeeder.php:516
```

**INFERENCE.** This is **one fixture bug, not 90 broken features.** `GoldenCompanySeeder` (line ~516) calls `$this->payments->allocate()` for `TXN-VP-001` against `self::PUR_001`, and `PaymentService::…:223` cannot find that id in the `purchases` table for tenant 999991. Because the seeder dies there, every Golden test class that depends on the seeded company fails at setup — `EdgeCasesTimeConcurrencyTest` (15), `AdversarialCorruptionTest` (13), `CrossSurfaceConsistencyTest` (11), `FinancialCoreVerificationTest` (11), `DashboardOutputTest` (10), `FifoBatchVerificationTest` (8), `FilterMatrixTest` (8), `ClockPositionConsistencyTest` (7), `CogsReconciliationTest` (7).

**FACT — and this tells you the cause.** The stack trace names `app\Services\V3\PaymentService.php`, but **`app/Services/V3/` no longer exists** in the current tree (`ls: cannot access 'app/Services/V3'`). The code moved to `app/Engines/PaymentService.php`. That file still carries the stale comment: *"V3 purchases live in the `purchases` table. This must stay in step with V3\PurchaseService…"*

So: the 10 Aug failure was almost certainly collateral damage from the **V3 → Engines consolidation** — the purchase-creation path and the payment-allocation path fell out of sync on where/under what id a purchase is written. That is a targeted **half-day to one-day fix**, not a broken accounting engine.

**RECOMMENDATION.** Do not accept this from me on faith and do not accept it from another agent. **Re-run the full suite today**, before anything else. That run is 3 days old and predates recent commits. Concretely:
1. Fix the `PUR_001` id mismatch between the purchase-creation path and `PaymentService::…` line 223's `purchases` lookup.
2. Re-run `RUN_FULL.bat`.
3. Target: **exit code 0**, or a written, signed-off list of every remaining failure with a reason.

The other ~10 failures are small and individually nameable: 2× `RegistryDriftTest` (suites.yaml regeneration), 3× `Tests\Unit\Experience\AppearanceTest`, 1× `PlanTruthFailClosedTest` (`growth_engine` should be off by default on `ltd_2` — **this one is AppSumo-relevant and must be fixed, it's an LTD entitlement leak**), 1× CSRF header assertion, 1× `SuiteIntegrityTest` (expects an archived `Tester/Golden/tests` path), 1× `AppSumo\CodeStackingTest`, 2× route sweep.

**`AppSumo\CodeStackingTest` failing is a hard blocker.** Code stacking is how AppSumo Tier upgrades work. If stacking is broken, buyers who stack 3 codes get the wrong plan, and that produces refunds and 1-star reviews on day one.

---

## 5. AI BUILDER READINESS — the honest part

**Verdict: SKELETON. Roughly 15% built.**

### What genuinely exists (FACT)

| Component | State | Evidence |
|---|---|---|
| `capabilities` table (with `requires`, `conflicts`, `provides_nav`, `provides_cards`, `provides_terms`) | EXISTS | migration 2026_08_12 |
| `capability_search_index` (soundex/metaphone/fulltext/embedding column) | EXISTS, EMPTY | same migration |
| `tenant_terminology` table | EXISTS | same migration |
| `tenants.experience` column (`classic` default) | EXISTS | same migration |
| `tenants.business_type` | EXISTS | migration 2026_08_11 |
| `BusinessTemplatesSeeder` — preset definitions | EXISTS, ~9 presets | 270 lines |
| `App\Support\Terms` — terminology resolver with fallbacks | EXISTS | 26 fallback term keys |
| `CapabilityDependencyResolver` | EXISTS but tiny | **86 lines** |
| `resources/js/Next/` — new shell | EXISTS but tiny | **7 files total** |

The `capabilities` table schema is genuinely well designed. Whoever specified `provides_nav` / `provides_cards` / `provides_terms` / `requires` / `conflicts` understood the problem. That schema is the right foundation.

### What does NOT exist — the gaps that make the positioning untrue today

**GAP 1 — The onboarding wizard does not configure anything. (CRITICAL)**

**FACT.** `SetupController::complete()` — the live onboarding path (`routes/web.php:367-368`) — writes `Setting` rows (business name, email, phone, currency, industry) and seeds categories/units from `config('industries')`. It **never writes to `tenant_terminology`, never writes capabilities, never touches the `capabilities` table.** The presets and the wizard the user actually walks through are not connected.

`TenantDefaultSeeder::seedTemplateBuildingBlocks()` *does* apply a template — but it's called from `ProvisionTenantJob`, `StoreController:377`, `FullDemoDeployCommand` at provisioning time, from `$tenant->industry_type`, **before the user has chosen anything in the wizard.** So the preset is guessed at signup and never revised by the user's actual answers.

**GAP 2 — Terminology is 99% unused. (CRITICAL)**

**FACT.** `Terms::` appears in exactly **one** place in the entire codebase:
```
app/Http/Middleware/HandleInertiaRequests.php:230:  return $tenantId ? \App\Support\Terms::forTenant($tenantId) : [];
```
It is shared to the frontend, and consumed by `useTerms()` in `resources/js/Next/Shell/Nav.jsx` — **the new shell's sidebar only.** Across **301 page components**, page titles, buttons, table headers, form labels and reports are still hardcoded "Customer", "Product", "Stock". Renaming Inventory → Materials today changes one sidebar label and nothing else. A user will notice this in 30 seconds.

**GAP 3 — There is no AI configuration layer at all.**

**FACT.** `app/Services/Ai/` contains exactly three files: `AiRateLimiter.php`, `AiSpendGuard.php`, `AiUsageRecorder.php` — governance, no intelligence. `ChatAIService.php` (511 lines) plus `config/ai_intents.php` is a **reporting** assistant with 5 hardcoded intents (`sales_today`, `low_stock`, `receivables`, `payables`, `top_sellers`). There is no business-discovery service, no capability-recommendation service, no natural-language→configuration mapper, no "add manufacturing"/"call inventory Stock" command handler. **Nothing in this repo can turn a sentence about a business into a system configuration.**

**GAP 4 — Two parallel UIs, both incomplete for this purpose.**

**FACT.** `resources/js/Next/` has 7 files (`Dashboard`, `Screens/Dashboard`, `Screens/Invoice/InvoiceForm`, `Shell/AppShell`, `Shell/CommandBar`, `Shell/Nav`, `System/tokens.js`). `AppearanceController::switchExperience()` flips between them and routes to `store.overview` vs `store.dashboard-v1`. So the "new experience" currently covers a dashboard and one invoice form, against 301 classic pages. **FACT:** `Tests\Unit\Experience\AppearanceTest` had 3 failures in the last run — the experience switch itself is not green.

**GAP 5 — Nav is gated by plan features + permissions, not by capabilities.**

**FACT.** `Next/Shell/Nav.jsx`: `const features = props.plan?.features ?? {}` and `props.auth.user.permissions`. Same confusion as §4.3, now visible in the UI.

**GAP 6 — Capability search index is empty and unused.** No embeddings written, no search service reads it.

---

## 6. IS IT AN AI *GENERATOR* OR AN AI *CONFIGURATOR*?

**You already answered this correctly in your own question, and you should trust that instinct.**

**RECOMMENDATION: build a CONFIGURATOR.** AI selects and composes capabilities from your controlled ERP engine. It does not write, generate, or deploy code. Reasons, concretely for your situation:

| Dimension | Configurator | Generator |
|---|---|---|
| Safety | AI output is a JSON config validated against a fixed registry — worst case is a wrong menu, fixable in one click | AI writes code that touches money and stock; worst case is a corrupted ledger in a customer's live business |
| Speed | Buildable in ~5 focused days on top of what you already have | 6–12 months minimum, with a sandbox/deploy pipeline you do not have |
| Testability | Finite: N capabilities × M presets. You can golden-test every preset | Infinite output space. Effectively untestable |
| Multi-tenancy | One codebase, per-tenant config rows. Your 307 migrations stay shared | Per-tenant code = per-tenant migrations = per-tenant bugs = an unmaintainable support load for one person |
| Maintenance | You ship a bug fix once, every tenant gets it | You ship a fix into 500 divergent generated codebases |
| AppSumo buyers | They want a working system in 10 minutes, not a codebase | They will not debug generated code |
| Cost | AI runs once per tenant at onboarding — cents. Your `AiSpendGuard` already exists | Unbounded token spend on an LTD (one-time payment) business model — this alone kills it |
| Limitation | Users can only get what your registry supports | — |

**The one real limitation** of the configurator: a user asking for something outside your capability registry (e.g. a law firm wanting matter-based time billing) gets nothing. **Handle this honestly in the UI:** "VenQore doesn't do that yet — request it," and log the request. That request log becomes your roadmap **and** your best market-research asset. It is a feature, not an apology.

**On honest marketing:** "Build your own ERP with AI" is a truthful claim for a configurator, as long as you never imply code generation. If you say "AI writes custom software for you," AppSumo buyers *will* test that claim and you will get refund requests. Say instead: *"Describe your business. VenQore assembles the ERP that fits it — modules, terminology, dashboards and workflows — in under two minutes. No consultants, no setup fees."* That is defensible, differentiated, and it is exactly what you can actually ship.

---

## 7. THE POSITIONING TRAP — direct answer

**Does launching as a traditional ERP now create a trap? Partially yes, but it is not the trap you fear.**

The trap is **not** technical. Document 02 shows the migration is additive and safe — no existing customer breaks.

The trap is **commercial and permanent**, and it has three parts:

1. **AppSumo listings are effectively one-shot.** Your listing page, category, reviews and comparison set are established at launch. Repositioning a live listing means renegotiating with AppSumo and asking early reviewers to re-review. It is much harder than launching correctly once.

2. **The category is brutally crowded.** "ERP/POS lifetime deal" competes against dozens of listings on price alone. "AI builds your ERP" competes against approximately nobody. Same product, radically different conversion rate and radically different perceived value per code. **Your differentiation is worth more than 12 days.**

3. **Early reviewers anchor the narrative.** The first 20 reviews define your listing forever. If they say "decent POS," AI Builder buyers later won't believe the new pitch.

**Counter-argument you should weigh honestly:** launching now gets you real users, real money and real bug reports 2 weeks earlier — and your first 20 buyers will find bugs no test suite will. With 197 failing tests three days ago, that argument is weaker than it looks. You would be shipping a red build to buy feedback you can get from a green build two weeks later.

---

## 8. THE DECISIVE VARIABLE YOU HAVE NOT CHECKED

**RECOMMENDATION — do this today, before anything else.**

You are treating "apply to AppSumo" and "go live on AppSumo" as the same event. **They are not.** AppSumo applications go through review, negotiation, listing-asset production and scheduling. That gap is typically weeks, not hours — **but I have not verified AppSumo's current timeline and you must not plan around my assumption.**

**Action:** open your AppSumo partner/marketplace application page today and confirm (a) current review turnaround, and (b) whether the product description can be edited after submission but before going live.

**If there is a multi-week review window — and there probably is — your dilemma dissolves:**
- **Apply now**, with the AI Builder positioning in the pitch (you are pitching what will be live on launch day, which is normal and honest).
- **Build the AI Builder during the review window.**
- You lose nothing. You gain the positioning *and* the two weeks.

This is the highest-value 20 minutes available to you today.

---

## 9. FINAL RECOMMENDATION — no hedging

### **WAIT. Target 12–14 days. Launch as the AI Builder. Submit the application within the next 2–3 days.**

**But not for the reason you think.** You cannot launch today regardless of positioning, because:

1. **FACT:** last full test run = exit code 2, 197 failures, 3 days old.
2. **FACT:** `AppSumo\CodeStackingTest` is failing — code stacking is the mechanism AppSumo buyers use to upgrade tiers.
3. **FACT:** `PlanTruthFailClosedTest` is failing — a paid AI add-on (`growth_engine`) is enabled by default on `ltd_2`. You would be giving away a metered AI product to every LTD buyer, forever, at a one-time price. **This is the most expensive single bug in the repository.**
4. **FACT:** the repo root ships ~200 debug scripts including `truncate_tables.php`, `clean_db.php` and `safe.env`.

Even in "Option A — launch now," you are looking at **4–6 days minimum** of fixing before you should let a paying stranger in. The genuine question is therefore not "0 days vs 12 days." It is **"6 days for a classic ERP vs 12–14 days for a differentiated AI product."**

Framed that way, the extra ~7 days buys you a category of one. **Take the 7 days.**

### Is 10–12 days realistic? — YES, with three hard conditions

**Conditions, all mandatory:**
1. **Configurator only.** Zero generative code. If you drift toward "AI writes features," the answer becomes 4+ months.
2. **Total feature freeze** on everything in Document 03 §Feature Freeze. Your latest commit is a *Composable Dashboard Builder* — that is exactly the kind of work that must stop now.
3. **Days 1–4 are spent on red tests and safety, not on AI.** If you start with the fun part, you will hit day 12 with a beautiful onboarding wizard on top of a failing financial core.

**INFERENCE on your capacity.** Your 89-day output is genuine evidence that you execute far above baseline, and the ERP engine underneath is real, which removes the largest risk. That's why I'm saying yes to 12–14 and not 30. But the honest range is **12 days if nothing surprises you, 14 if something does — and something usually does.** Plan for 14 and be delighted at 12. Do not tell yourself 10.

---

## 10. IMMEDIATE NEXT ACTION — the single most important thing

**Not architecture. Not UI. Not AI.**

> **Fix the `GoldenCompanySeeder` → `PaymentService` purchase-id mismatch and get the full test suite to exit code 0 — today.**

Specifically: `database/seeders/GoldenCompanySeeder.php:516` allocates a payment against `self::PUR_001`; `app/Engines/PaymentService.php:223` looks that id up in the `purchases` table for the tenant and fails. Find where the purchase is actually written (which table, which id) and reconcile the two. That one fix should clear ~90 of your 197 failures.

**Why this first:** you are about to build a configuration layer on top of the ERP engine. If the engine's ledger correctness is unverified, every day of AI Builder work is built on sand — and you will not know it until an AppSumo customer's balance sheet is wrong. **Get to green, then build.**

---

*Continue to Document 02 (architecture), Document 03 (day-by-day plan), Document 04 (plain-English summary).*
