# VENQORE — AI BUILDER MASTER MAP
**The single source of truth for implementing the VenQore AI Builder V1.**
Version 1.0 · 13 August 2026 · Derived from repository analysis at `E:\AMD POS\AMD POS\app-code\main-app`

> **How to use this document.** Sections 1–9 define the architecture. Section 10 is the implementation order. Appendix A is the proposed `config/capabilities.php`. **Appendix A is a DRAFT that you must validate** — the companion document `CAPABILITIES_FILE_GUIDE.md` tells you exactly how.

**Evidence labels used throughout:**
- **FACT** — verified in the repository, with the file named
- **INFERENCE** — reasoned from repository evidence
- **RECOMMENDATION** — professional judgement
- **NEEDS_VALIDATION** — could not be verified; you must confirm

---

# 1. CURRENT VERIFIED STATE

## 1.1 What I re-verified for this document

| Item | Value | Source |
|---|---|---|
| Named routes | **662** | `route_list.json` (UTF-16) |
| `store.*` route groups | **71** | same |
| `store.v3.*` sub-groups | **35** | same |
| **Plan-feature gate keys** | **38 distinct, 132 usages** | `routes/web.php`, `feature:` middleware |
| Permission keys | **49** | `config/permissions.php` |
| Roles | **7** (owner, admin, manager, cashier, accountant, purchasing_officer, viewer) | same |
| Dashboard cards | **20** | `app/Services/Dashboard/DashboardRegistry.php` (397 lines) |
| Terminology fallback keys | **26** | `app/Support/Terms.php` |
| Frontend page directories | **~78** | `resources/js/Pages/` |
| Engine services | **16** (5,155 lines) | `app/Engines/` |
| Existing presets | **9** | `database/seeders/BusinessTemplatesSeeder.php` |

⚠️ **FACT — a caveat you must know.** `route_list.json` is dated **2026-07-08**, five weeks old. Route names in Appendix A are drawn from it and are therefore **NEEDS_VALIDATION**. **Regenerate it before implementing:**
```bash
php artisan route:list --json > route_list_current.json
```
This is step 0 of Appendix A validation.

## 1.2 Test state

Your dashboard: **1,680 executed / 1,610 passed / 11 failed / 12 skipped / 46 incomplete / 1 risky / exit code 2.**

**INFERENCE:** 95.8% pass rate, up from 83% three days ago. Two open items: exit code is still 2, and **46 incomplete tests assert nothing** — they cannot fail, so they protect nothing. Triage them in Step 1.

## 1.3 The 38 plan-feature gate keys (FACT — the real entitlement surface)

These are what your **132 route enforcement points** actually check. This is the authoritative entitlement list, and it is far smaller and more useful than the ~269 billing matrix:

```
report_profit_loss(12)  expense_manager(9)  purchase_orders(8)  pre_sales_reservation(7)
compositions(7)  recurring_invoices(7)  b2b_proposal_builder(5)  report_party_statement(5)
production(5)  fund_management(5)  bulk_upload(4)  double_entry_ledger(4)  multi_branch(4)
debit_credit_notes(4)  invoice_reminders(4)  stock_valuation(3)  unified_party_ledger(3)
marketing_campaigns(3)  e_invoicing(3)  suppliers_directory(2)  barcode_label_print(2)
report_trial_balance(2)  discount_report(2)  cash_flow_report(2)  aged_receivables(2)
point_in_time_inventory(2)  customer_insights(2)  supplier_insights(2)  bank_reconciliation(2)
purchase_returns(2)  customer_khata(1)  auto_vat_gst(1)  stock_aging(1)  owners_daily_pulse(1)
growth_engine(1)  supplier_statements(1)  customer_statements(1)  aged_payables(1)
```

**INFERENCE — important.** Notice what is **absent**: there is no `feature:pos`, no `feature:inventory`, no `feature:sales`, no `feature:products`. **The core ERP is ungated because it is foundation.** Your codebase already made the Tier 0 / Tier 1 distinction implicitly — this document just makes it explicit.

---

# 2. THE ARCHITECTURE IN ONE DIAGRAM

```
TENANT
  │
  ├─► ENTITLEMENT      tenant_plan_overrides + plans     "what they PAID for"    [EXISTS ✅]
  │                    PlanRepository::canUseFeature()
  │
  ├─► CAPABILITY       tenant_capabilities                "what they USE"        [BUILD]
  │                    CapabilityService::enabled()
  │
  ├─► RESOLUTION       CapabilityDependencyResolver       requires/conflicts     [EXTEND]
  │
  ├─► VISIBILITY       visible = entitled AND enabled AND permitted              [BUILD]
  │
  ├─► TERMINOLOGY      tenant_terminology → Terms::       "what it's CALLED"     [EXISTS ✅]
  │
  ├─► NAVIGATION       derived from visible capabilities                          [BUILD]
  │
  ├─► DASHBOARD        DashboardRegistry filtered by visibility                   [EXTEND]
  │
  ├─► ROUTE GATE       EnsureCapability middleware                                [BUILD ⚠️]
  │
  ▼
EXISTING 662 ROUTES → EXISTING ~300 PAGES → app/Engines/* → DATABASE
                                            [DO NOT TOUCH]
```

**Everything above the route gate is new. Everything below it is your existing, working, production-proven ERP.**

---

# 3. THE THREE TIERS

## 3.1 TIER 0 — FOUNDATION (always on, invisible, AI cannot touch)

**FACT — the proof.** `app/Engines/SaleService.php` lines 19–24:
```php
public function __construct(
    private AccountingService $accounting,
    private FifoService       $fifo,
    private PaymentService    $payments,
    private TaxService        $tax,
    private UomService        $uom
```
Line 295 posts a journal entry on every sale. Line 150 deducts FIFO stock (bypassed only when `products.type === 'service'`, line 137).

**Tier 0 members:**

| Foundation | Engine/Service | Why it can never be disabled |
|---|---|---|
| Accounting / double-entry ledger | `AccountingService` (350 ln) | Constructor dependency of `SaleService`, `PurchaseService` |
| Stock ledger / FIFO | `FifoService` (305 ln), `InventoryService` (426 ln) | Constructor dependency; every non-service sale calls `deductStock()` |
| Products | `Product` model | Sales/purchases cannot reference nothing |
| Parties (customers/suppliers) | `PartyService` (141 ln) | `parties.type` enum `['customer','supplier']`; ledger requires `party_id` |
| Payments | `PaymentService` (254 ln) | Constructor dependency |
| Tax | `TaxService` (158 ln) | Constructor dependency; every line calls `calculateLineTax()` |
| UOM | `UomService` (77 ln) | Constructor dependency; `toBaseQty()` on every line |
| Sequences | `SequenceService` | `generateTransactionNumber('SAL')` — line 90 |
| Users / roles / permissions | `config/permissions.php` | 49 keys, 7 roles |
| Tenancy | `TenantMiddleware` | Isolation |
| Sales (the transaction itself) | `SaleService` (817 ln) | An ERP without transactions is not an ERP |

> **TIER 0 RULE:** if disabling it could make a number wrong, it is Tier 0. Tier 0 keys must never appear in `config/capabilities.php`, never in an AI response, never as a user toggle.

**This is your safety guarantee.** An AI that hallucinates `{"capabilities":["pos"]}` and nothing else cannot corrupt the books, because accounting was never in the list to begin with.

## 3.2 TIER 1 — SURFACE MODULES (show/hide — this IS the AI Builder)

~30 modules with their own pages, nav entries and cards. Disabling = hide nav + block routes + hide cards. **Zero engine impact.** Full list in Appendix A.

## 3.3 TIER 2 — FIELD / WORKFLOW CONFIG → **DEFERRED — V1.2+**

"Hide the payment-terms field." "Remove per-line discount." "Skip the customer field in POS."

**FACT:** these live inside individual React components across ~300 pages. There is no field-visibility infrastructure in the repo.

**RECOMMENDATION — this is the single biggest scope risk in the project. Freeze it explicitly.** V1.2 ships a plain Settings page covering the 5–6 fields customers actually complain about. Nothing more.

---

# 4. CONFIGURATION STATES

| State | Definition | Source |
|---|---|---|
| `ENTITLED` | Plan/LTD/override grants it | `PlanRepository::canUseFeature()` |
| `ENABLED` | Business switched it on | `tenant_capabilities.enabled` |
| `PERMITTED` | This user's role allows it | `config/permissions.php` |
| **`VISIBLE`** | **`ENTITLED && ENABLED && PERMITTED`** | `CapabilityService::visible()` |
| `BLOCKED` | Entitled + enabled, but a `requires` dependency is off | resolver |
| `REQUIRED` | Another enabled capability depends on it → cannot disable | resolver |
| `LOCKED_BY_DATA` | Has rows in its tables → cannot disable | data-safety check |

**FACT — a correction to my earlier `visible = entitled AND enabled`.** Permissions are a third, independent axis: `DashboardRegistry` cards already carry a `permissions` array, and `Next/Shell/Nav.jsx` already reads `props.auth.user.permissions`. Three axes, not two.

**These three must never be confused in the UI** — they need three different messages:

| Failure | Message | Action offered |
|---|---|---|
| Not entitled | "This feature requires a plan upgrade." | → Billing |
| Entitled but disabled | "This module is switched off for your business." | → Enable it |
| Not permitted | "You don't have permission for this." | → Ask your admin |

**FACT:** today all three collapse into `EnsurePlanFeature`'s single "requires a plan upgrade" → redirect to billing. Sending a user to a *billing page* because their own business turned a module off is a support ticket and a bad review. **Fixing this is Step 7.**

---

# 5. THE `tenant_capabilities` TABLE

```php
Schema::create('tenant_capabilities', function (Blueprint $table) {
    $table->id();
    $table->unsignedBigInteger('tenant_id');
    $table->string('capability_key', 64);
    $table->boolean('enabled')->default(true);
    $table->enum('source', ['preset','ai','user','system'])->default('system');
    $table->json('config')->nullable();
    $table->timestamps();

    $table->unique(['tenant_id','capability_key']);
    $table->index(['tenant_id','enabled']);
});
```

**Design decisions:**
- **No foreign key to `capabilities`** — `config/capabilities.php` is the source of truth; a stale DB row for a removed capability should be ignored, not block a migration. **INFERENCE:** matches the existing pattern (`tenant_plan_overrides.override_key` is also an unconstrained string).
- **`config` JSON is nullable and unused in V1.** Reserved for Tier 2. Do not populate it yet.
- **`source`** drives the "never silently override user choice" rule (§6, Scenario 4).
- **Caching:** mirror `PlanRepository`'s pattern — `Cache::remember("tenant_caps:{$tenantId}", 300, ...)`, invalidated on write. **Do not invent a new caching strategy.**
- **Audit:** handled by `tenant_config_versions` (§9), not by columns here.

**RECOMMENDATION: do not add `expires_at`, `applied_by`, or a polymorphic actor.** `tenant_plan_overrides` needs those because billing is time-bound; configuration is not.

---

# 6. ENTITLEMENT vs CONFIGURATION — five scenarios

**`tenant_plan_overrides` remains the billing layer. Nothing about it changes.**

**FACT — the bug being fixed.** `database/seeders/TenantDefaultSeeder.php:361`:
```php
// 1. Seed capabilities into tenant_plan_overrides
DB::table('tenant_plan_overrides')->updateOrInsert(
    ['tenant_id' => $tenant->id, 'override_key' => $capKey],
    ['override_value' => '1', 'applied_by' => 'system_template', ...]
);
```
Configuration is being written into the billing table. Step 4 redirects this to `tenant_capabilities`.

| # | Scenario | entitled | enabled | visible | Result |
|---|---|---|---|---|---|
| 1 | Tier-3 buyer runs a salon, turns Manufacturing off | ✅ | ❌ | ❌ | Hidden. **Plan untouched.** Re-enable any time, free. |
| 2 | Same buyer uses Manufacturing | ✅ | ✅ | ✅ | Normal. |
| 3 | Free-plan user asks AI for Manufacturing | ❌ | — | ❌ | Validator strips it **before** the proposal screen. Proposal shows "Manufacturing — available on Business plan" as an upsell, not an error. |
| 4 | User manually enabled Purchase Orders; AI later proposes removing it | ✅ | ✅ (`source='user'`) | ✅ | **AI may never silently override `source='user'`.** Proposal must show it as an explicit diff requiring confirmation. |
| 5 | Buyer stacks an AppSumo code → upgrades to Tier 3 | ❌→✅ | ❌ | ❌→ still ❌ | **Entitlement grows; configuration does not auto-change.** They get a notification: "3 new modules are now available — add them?" |

**Scenario 5 is the one people get wrong.** Upgrading a plan must never auto-enable modules — that would silently reshape a working business's UI. Entitlement expands the *menu of what's possible*; only the user or the Builder changes what's *on*.

---

# 7. `EnsureCapability` MIDDLEWARE

**FACT:** `app/Http/Middleware/EnsurePlanFeature.php` exists (registered as `feature:`), used 132 times. **No capability middleware exists anywhere.**

**Consequence today:** hiding Inventory from nav leaves `/s/{slug}/inventory` fully reachable by URL or bookmark. Hiding without gating is decoration.

**RECOMMENDATION: copy `EnsurePlanFeature.php` exactly and change three things.** Do not invent a new pattern — the tenant-resolution logic in that file (route param → segment fallback → `withoutGlobalScopes()`) is battle-tested and must be preserved verbatim.

```php
// app/Http/Middleware/EnsureCapability.php  — alias: 'capability'
public function handle(Request $request, Closure $next, string $capability): Response
{
    // [1] tenant resolution — COPY VERBATIM from EnsurePlanFeature lines 18-36
    if (!$tenant) return $next($request);

    // [2] CHANGED: capability check instead of plan check
    if (CapabilityService::enabled($tenant, $capability)) return $next($request);

    // [3] CHANGED: distinguish the two failure reasons
    $entitled = PlanRepository::canUseFeature($tenant, $capability);

    if ($request->expectsJson() || $request->header('X-Inertia') || $request->ajax()
        || app()->environment('testing')) {
        return response()->json([
            'success'    => false,
            'code'       => $entitled ? 'capability_disabled' : 'feature_locked',
            'capability' => $capability,
            'message'    => $entitled
                ? "This module is switched off for your business."
                : "This feature requires a plan upgrade.",
            'enable_url' => $entitled ? route('store.builder', ['store_slug'=>$tenant->slug]) : null,
            'upgrade'    => !$entitled,
        ], 403);
    }

    return $entitled
        ? redirect()->route('store.builder', ['store_slug'=>$tenant->slug])
              ->with('info', "Turn on {$label} to use this.")
        : redirect()->route('store.billing', ['store_slug'=>$tenant->slug])
              ->with('warning', "The '{$capability}' feature requires a plan upgrade.");
}
```

**Ordering — this matters:**
```php
['auth', 'tenant', 'feature:xyz', 'capability:xyz', 'can:permission']
```
Entitlement → capability → permission. **Rationale:** billing is the outermost commercial boundary; a user must not be told "turn this on" for something they haven't bought. **Never replace `feature:` with `capability:` — they coexist.**

**Apply to Tier 1 route groups only. Never to Tier 0 routes.** Gating a foundation route would break the engine.

**Testing hooks:** the existing middleware short-circuits on `$tenant->slug === 'test-store'` and treats `app()->environment('testing')` as JSON. **Preserve both**, or you will break existing green tests.

---

# 8. FRONTEND MAP

## 8.1 Page classification (FACT — from `resources/js/Pages/`, ~78 dirs)

| Class | Count | Action | Examples |
|---|---|---|---|
| **Reuse unchanged** | ~250 | Nothing | All form/detail/edit screens |
| **Add capability gating only** | ~30 index pages | Route middleware, no file edit | `Inventory/`, `PurchaseOrders/`, `Manufacturing/`, `StockTransfers/`, `SerialTracking/`, `Restaurant/`, `Proposals/`, `PreSales/`, `Funds/`, `GiftCards/` |
| **Terminology support** | ~40 strings | `useTerms()` on titles/CTAs | index page `<h1>`, primary buttons, first table column |
| **New pages** | **6** | Build | Welcome, Preset picker, AI discovery, **Proposal**, Building, First-run dashboard |

**The 6 new screens live in `resources/js/Next/`** (currently 7 files). **RECOMMENDATION:** use the mockups in `new landing page/` (`LandingPage.jsx`, `VenQoreLanding.jsx`, `Features.jsx`) for the *visual language* of these 6 screens only. Do not propagate that design into the 300 existing pages.

## 8.2 Navigation

**FACT:** `resources/js/Next/Shell/Nav.jsx` reads `props.plan?.features` and `props.auth.user.permissions`, and already calls `useTerms()`.
**Change:** add `props.capabilities`, gate on all three. **This is a ~20-line change to one file** — the hardest architectural work is already done.

**RECOMMENDATION: derive nav, don't store it.** Nav = union of `provides_nav` across visible capabilities, sorted by `order`, labelled through `Terms::`. No `tenant_navigation` table in V1 — it's a sync-bug generator with no V1 payoff.

## 8.3 Terminology (FACT — `app/Support/Terms.php`, 26 fallback keys)

`customer, supplier, product, service, category, stock, location, sale, purchase, invoice, quotation, order, return, payment, expense, staff, shift, attendance, occupancy, position, job, technician, contract, report, dashboard`

**FACT:** `Terms::` is referenced in exactly **one** file — `HandleInertiaRequests.php:230` — and consumed only by `Next/Shell/Nav.jsx` via `useTerms()`. The pipeline works end-to-end; it's just applied in one place.

**V1 target: 12 keys × ~40 locations.**

| Key | Default | V1? | Where (V1 only) |
|---|---|---|---|
| `customer` | Customer | ✅ | nav, Parties index title, "New Customer" CTA, dashboard cards |
| `product` | Product | ✅ | nav, Products index title, CTA, first column |
| `stock` | Stock | ✅ | nav, Inventory index title, low-stock card |
| `supplier` | Supplier | ✅ | nav, Suppliers index title, CTA |
| `sale` | Sale | ✅ | nav, Sales index title |
| `invoice` | Invoice | ✅ | nav, invoice list title |
| `expense` | Expense | ✅ | nav, Expenses index |
| `location` | Location | ✅ | nav (Warehouses), warehouse selector label |
| `quotation` | Quotation | ✅ | nav, Quotations index |
| `position` | Position | ✅ | Restaurant tables nav + title |
| `job` | Job | ✅ | Service jobs nav + title |
| `composition` | *(not in Terms.php)* | ✅ | **NEEDS_VALIDATION — add key**; Recipes/BOM nav |
| others (14) | — | ❌ V1.1 | Settings page lets users edit them manually |

**Hard cap: 40 string replacements.** Ship a **Terminology settings page** so a user who cares can fix anything you missed — this converts an incompleteness into a feature.

## 8.4 Dashboard

**FACT:** `DashboardRegistry::all()` defines **20 cards**, each with `title, description, category, sizes, default_size, permissions[], default?`. **There is no `capability` key.**

**Change:** add `'capability' => 'x'` to each card and filter by visibility. Proposed mapping:

| Card | Capability | Card | Capability |
|---|---|---|---|
| `revenue_today` | *(Tier 0 — always)* | `top_customers` | `customers_directory` |
| `sales_summary` | *(Tier 0)* | `low_stock` | `inventory` |
| `net_profit` | *(Tier 0)* | `inventory_value` | `inventory` |
| `expenses` | `expenses` | `top_products` | *(Tier 0)* |
| `cash_position` | *(Tier 0)* | `recent_purchases` | `purchases` |
| `revenue_trend` | *(Tier 0)* | `open_orders` | `sales_orders` |
| `receivables` | `khata_credit` | `production_output` | `production` |
| `payables` | `purchases` | `active_staff` | `staff_management` |
| `customer_count` | `customers_directory` | `needs_attention` | *(Tier 0)* |
| | | `quick_actions` | *(Tier 0)* |
| | | `ai_insights` | `ai_insights` |

**RECOMMENDATION:** cards without a `capability` key default to always-visible (Tier 0). This keeps the change additive and backward-compatible — existing dashboards are unaffected until a capability is explicitly assigned.

---

# 9. AI LAYER

## 9.1 The pipeline (deterministic order — AI touches only step 2)

```
1. DISCOVERY          5 fixed questions + 1 free text
2. AI                 → raw JSON                          ← ONLY AI STEP
3. SCHEMA VALIDATION   malformed → fallback to preset picker
4. UNKNOWN-KEY FILTER  drop anything not in config/capabilities.php  (silent)
5. TIER-0 STRIP        drop any foundation key             (silent)
6. ENTITLEMENT FILTER  move unentitled → "upgrade to add"  (shown as upsell)
7. DEPENDENCY RESOLVE  cascade-enable `requires`
8. CONFLICT CHECK      reject conflicting pairs
9. DATA-SAFETY CHECK   refuse disabling capabilities holding rows
10. NORMALIZE          dedupe, sort, cap at 40 capabilities
11. PROPOSAL SCREEN    ← USER SEES AND EDITS. NEVER SKIPPED.
12. USER APPROVES
13. ApplyConfigurationService  transactional, no AI
14. VERSION SNAPSHOT   tenant_config_versions
```

**Steps 3–10 are pure PHP with zero AI.** The AI proposes; the validator disposes. **AI never decides validity.**

## 9.2 The ten AI safety rules

1. AI never writes to the database.
2. AI never generates PHP, SQL, migrations, routes, schema, financial logic or any executable code.
3. AI output is untrusted input — validated deterministically.
4. Unknown keys silently dropped (never surfaced as errors — a dropped hallucination should be invisible).
5. Tier 0 keys silently stripped.
6. Unentitled capabilities filtered to an upsell list, never enabled.
7. Conflicts rejected.
8. **A proposal is always shown before apply. No auto-apply, ever.**
9. AI failure never blocks onboarding → preset picker fallback.
10. Every configuration operation is versioned and revertible.

## 9.3 Cost control (FACT — `app/Services/Ai/` = `AiRateLimiter`, `AiSpendGuard`, `AiUsageRecorder`, all exist)

| Operation | V1 limit | On exceed |
|---|---|---|
| Onboarding build | 3 per tenant lifetime | → preset picker |
| Re-configure ("Customize my system") | 10 / month | → manual toggles (still fully functional) |
| Modification command | 20 / month | → manual toggles |

**RECOMMENDATION:** hitting a limit must never block configuration — it only removes the *AI convenience*. Manual toggling and preset switching stay unlimited and free forever. On an LTD, this caps your marginal cost at roughly 13 model calls per tenant per month while the product remains fully usable. **Wire all three existing guards from the first call, not "later."**

---

# 10. IMPLEMENTATION ORDER

**Strictly sequential. Each step's acceptance criteria must pass before the next begins.** Parallelism noted where safe.

---

### STEP 0 — Regenerate route truth
**Goal:** replace 5-week-old route data.
**Command:** `php artisan route:list --json > route_list_current.json`
**Acceptance:** file exists, ≥662 routes, UTF-8.
**Effort:** 5 min. **Parallel:** —
**Why first:** every route name in Appendix A depends on it.

---

### STEP 1 — Green build
**Goal:** exit code 0.
**Files:** whichever the 11 failures name. **Priority: `PlanTruthFailClosedTest` (`growth_engine` on by default on `ltd_2` = free metered AI to every LTD buyer) and `AppSumo\CodeStackingTest` (wrong tier on stacking = refunds).**
**Also:** triage the **46 incomplete** tests — list each, decide finish-or-delete. An incomplete test is a hole with a green label on it.
**Tests:** `RUN_FULL.bat`
**Acceptance:** exit code 0. Incomplete count documented with a written decision each.
**Rollback:** git tag `pre-builder-green` when achieved.
**Effort:** 0.5–1 day. **Parallel:** no — everything depends on this.

---

### STEP 2 — Security & hygiene
**Goal:** repo is safe to hand to a partner or auditor.
**Actions:** inspect `safe.env` (rotate if it holds live credentials; check `git log --all -- safe.env`); move ~200 root scripts (`tmp_*`, `debug_*`, `check_*`, `audit_*`, `fix_*`, `restore_vyapar_*`, `test*.php`, `first()))`, `*.log`) into `scratch/` and gitignore; **verify `truncate_tables.php`, `clean_db.php`, `wipe_test_data.php`, `fix_admin_passcode.php`, `create_test_user.php` are excluded from the production artifact.**
**Acceptance:** no secrets in repo or history; clean root; deploy manifest excludes dev scripts.
**Effort:** 0.5 day. **Parallel:** ✅ with Step 1.

---

### STEP 3 — Validate & write `config/capabilities.php`
**Goal:** the source of truth exists and every entry is verified.
**Files created:** `config/capabilities.php`
**Method:** take Appendix A, run the validation protocol in `CAPABILITIES_FILE_GUIDE.md`.
**Tests:** `CapabilityRegistryIntegrityTest` — every `routes[]` entry resolves via `Route::has()`; every `pages[]` file exists; every `permissions[]` key is in `config/permissions.php`; every `provides_cards[]` key is in `DashboardRegistry::all()`; every `provides_terms[]` key is in `Terms::$fallbacks`; every `requires[]` key exists in the registry; no circular dependencies; **no Tier 0 key present**.
**Acceptance:** the test passes with **zero `NEEDS_VALIDATION` remaining**.
**Effort:** 1 day (mostly verification, not typing). **Parallel:** no.
**⚠️ This is the highest-leverage step in the project. Do not rush it.**

---

### STEP 4 — `tenant_capabilities` + backfill
**Files created:** `database/migrations/xxxx_create_tenant_capabilities_table.php`, `database/migrations/xxxx_backfill_tenant_capabilities.php`, `app/Models/TenantCapability.php`
**Files modified:** `database/seeders/TenantDefaultSeeder.php` (line ~361: write `tenant_capabilities`, **not** `tenant_plan_overrides`)
**Backfill logic:** for every existing tenant, enable every capability currently visible to them (`source='system'`).
**Tests:** `ExistingTenantBackfillTest` — snapshot nav + accessible routes + permissions + reports before and after; assert identical.
**Acceptance:** existing tenant behaviour **byte-identical**. `tenant_plan_overrides` untouched.
**Rollback:** migration `down()` drops the table; no data loss (it's derived).
**Effort:** 1 day. **Parallel:** no.

---

### STEP 5 — `CapabilityService`
**Files created:** `app/Services/CapabilityService.php`
**API:** `enabled(Tenant,$key): bool` · `entitled(Tenant,$key): bool` · `visible(Tenant,$key,?User): bool` · `allEnabled(Tenant): array` · `enable/disable(Tenant,$key,$source)` · `invalidateCache(int $tenantId)`
**Pattern:** mirror `PlanRepository`'s caching exactly (`Cache::remember`, 300s, invalidate on write).
**Tests:** unit tests for all 7 states in §4.
**Acceptance:** `visible()` correct across the full entitled × enabled × permitted matrix.
**Effort:** 0.5 day. **Parallel:** ✅ with Step 6.

---

### STEP 6 — Extend `CapabilityDependencyResolver`
**Files modified:** `app/Engines/CapabilityDependencyResolver.php` (86 lines today)
**⚠️ This file is inside `app/Engines/` — the DO-NOT-TOUCH directory. It is the sole authorised exception**, because it is a configuration utility, not a business engine. Do not touch its 15 siblings.
**Must add:** transitive `requires` cascade-enable · `conflicts` rejection · **cascade-disable protection** (disabling `inventory` while `manufacturing` is on → refuse with explanation) · **data-safety refusal** (row-count check before disable) · circular-dependency detection.
**Tests:** `manufacturing` → auto-enables `inventory`; disabling `inventory` with `manufacturing` on is refused; disabling a capability with rows is refused; circular deps throw at boot.
**Acceptance:** no configuration path can produce an invalid state.
**Effort:** 1 day. **Parallel:** ✅ with Step 5.

---

### STEP 7 — `EnsureCapability` middleware
**Files created:** `app/Http/Middleware/EnsureCapability.php`
**Files modified:** `bootstrap/app.php` (register alias `capability`), `routes/web.php` (apply to Tier 1 groups)
**Tests:** disabled capability + direct URL → 403/redirect to builder, **not** billing · unentitled → billing · no permission → permission error · **three distinct codes: `capability_disabled` / `feature_locked` / permission**
**Acceptance:** **no Tier 1 route reachable by URL when its capability is off.** All 132 existing `feature:` gates still pass.
**Rollback:** remove alias; routes degrade to entitlement-only (current behaviour).
**Effort:** 1 day. **Parallel:** no.
**This is the step that turns "hidden" into "configured."**

---

### STEP 8 — Capability-driven nav + dashboard + terminology
**Files modified:** `resources/js/Next/Shell/Nav.jsx` (add `props.capabilities`) · `app/Http/Middleware/HandleInertiaRequests.php` (share capabilities) · `app/Services/Dashboard/DashboardRegistry.php` (add `capability` key per card) · ~40 page strings via `useTerms()`
**Tests:** nav contains exactly the visible capabilities; dashboard hides cards for disabled capabilities; renaming customer→Client changes nav + index titles + CTAs.
**Acceptance:** toggling a capability visibly changes nav and dashboard with no reload errors.
**Effort:** 1 day. **Parallel:** ✅ with Step 9.

---

### STEP 9 — `ApplyConfigurationService` + versioning + presets
**Files created:** `app/Services/Configuration/ApplyConfigurationService.php` · `database/migrations/xxxx_create_tenant_config_versions_table.php` · `database/migrations/xxxx_create_presets_table.php`
**Files modified:** `database/seeders/BusinessTemplatesSeeder.php` (populate `presets` table; 9 → 12–15)
**`tenant_config_versions`:** `id, tenant_id, version, before_json, after_json, source(preset|ai|user|system), actor_user_id, note, created_at` + `revert()`
**Critical:** **ONE apply path** used by preset, AI and manual. Transactional. Never calls AI.
**Tests:** one golden test per preset — apply to fresh tenant → assert capabilities, nav, terminology, dashboard → **create a real sale → assert ledger balances and stock moved.**
**Acceptance:** all 12–15 preset golden tests pass. Undo restores previous state exactly.
**Effort:** 1.5 days. **Parallel:** ✅ with Step 8.

---

### STEP 10 — `ConfigurationValidator` (no AI)
**Files created:** `app/Services/AiBuilder/ConfigurationValidator.php`
**Implements pipeline steps 3–10 from §9.1.**
**Tests (adversarial — write these first):** unknown key dropped · Tier 0 key stripped · unentitled filtered to upsell · malformed JSON → fallback · 10,000-key array → capped at 40 · prompt-injection string in `reasoning` → stored as text, never executed · missing dependency → auto-resolved · conflict → rejected.
**Acceptance:** **no AI output, however hostile, can produce an invalid tenant configuration.**
**Effort:** 1 day. **Parallel:** no.
**Build this BEFORE the AI service. The validator is the safety net; never write the trapeze act first.**

---

### STEP 11 — AI services
**Files created:** `app/Services/AiBuilder/BusinessDiscoveryService.php` · `ConfigurationAIService.php` · `ModificationParser.php`
**Files modified:** wire `AiSpendGuard`, `AiRateLimiter`, `AiUsageRecorder`
**Tests:** 12 fixture descriptions → expected preset (bakery, salon, phone shop, pharmacy, restaurant, hardware, clothing, wholesaler, freelancer, supermarket, repair shop, grocery). **Mock the model — never call a live API in CI.**
**Acceptance:** ≥9/12 land on the correct preset; 12/12 produce *valid* configurations. AI unavailable → preset picker.
**Effort:** 1.5 days. **Parallel:** no.

---

### STEP 12 — The 6 screens
**Files created (in `resources/js/Next/Screens/Builder/`):** `Welcome.jsx` · `PresetPicker.jsx` · `Discovery.jsx` · **`Proposal.jsx`** · `Building.jsx` · `FirstRun.jsx`
**Files modified:** `app/Http/Controllers/SetupController.php` — **this is where the presets finally connect to the wizard the user actually sees** (currently `complete()` writes only `Setting` rows and never touches capabilities or terminology)
**Acceptance:** signup → description → proposal → edit → apply → working ERP, end to end, no console errors.
**Effort:** 2.5 days (**Proposal.jsx gets 1.5 of them**). **Parallel:** no.

---

### STEP 13 — Migration rehearsal & regression
**Actions:** restore a production-shaped DB copy → run backfill → diff nav/routes/permissions/reports/plan before vs after → full suite → 5 manual preset walkthroughs (create a real sale in each) → **service-only golden test must pass before the Salon/Freelancer presets ship**
**Acceptance:** existing tenant unchanged; exit code 0; all preset tests green.
**Effort:** 1 day. **Parallel:** no.

---

### STEP 14 — Launch assets & submit
Listing copy, screenshots (Proposal screen leads), demo video, changelog for existing customers, submit.
**Effort:** 1 day.

**Total: ~13 working days**, ~2 of which are parallelisable → **11–12 days realistic, 14 with contingency.**

---

# 11. FILE MAP

## CREATE
```
config/capabilities.php                                          ← Appendix A
app/Models/TenantCapability.php
app/Services/CapabilityService.php
app/Services/Configuration/ApplyConfigurationService.php
app/Services/AiBuilder/BusinessDiscoveryService.php
app/Services/AiBuilder/ConfigurationAIService.php
app/Services/AiBuilder/ConfigurationValidator.php
app/Services/AiBuilder/ModificationParser.php
app/Http/Middleware/EnsureCapability.php
app/Http/Controllers/BuilderController.php
database/migrations/xxxx_create_tenant_capabilities_table.php
database/migrations/xxxx_create_tenant_config_versions_table.php
database/migrations/xxxx_create_presets_table.php
database/migrations/xxxx_backfill_tenant_capabilities.php
resources/js/Next/Screens/Builder/{Welcome,PresetPicker,Discovery,Proposal,Building,FirstRun}.jsx
tests/Feature/Capability/{RegistryIntegrity,DependencyResolver,EnsureCapability,DataSafety}Test.php
tests/Feature/Builder/{Validator,Adversarial,ApplyConfiguration,PresetGolden,ServiceOnlySale}Test.php
tests/Feature/Migration/ExistingTenantBackfillTest.php
```

## MODIFY
```
database/seeders/TenantDefaultSeeder.php          ← line ~361: write tenant_capabilities not overrides
database/seeders/BusinessTemplatesSeeder.php      ← populate presets table; 9 → 12-15
database/seeders/CapabilitiesRegistrySeeder.php   ← read config/capabilities.php; DELETE the
                                                     file_get_contents()+preg_match() scraping
app/Engines/CapabilityDependencyResolver.php      ← ONLY authorised file in app/Engines/
app/Services/Dashboard/DashboardRegistry.php      ← add 'capability' key per card
app/Http/Middleware/HandleInertiaRequests.php     ← share capabilities alongside terms
app/Http/Controllers/SetupController.php          ← connect presets to the real wizard
resources/js/Next/Shell/Nav.jsx                   ← plan.features → capabilities
routes/web.php                                    ← add capability: middleware to Tier 1 groups
bootstrap/app.php                                 ← register 'capability' alias
~40 page strings                                  ← useTerms()
```

## DO NOT TOUCH
```
app/Engines/*                    ← except CapabilityDependencyResolver.php
  AccountingService, FifoService, InventoryService, ManufacturingService,
  PaymentService, PurchaseService, SaleService, SaleReversalService,
  SettlementService, TaxService, UomService, PartyService, OccupancyEngine,
  ServiceEngine, AuditService
app/Http/Middleware/EnsurePlanFeature.php    ← copy it, never edit it
app/Services/PlanRepository.php              ← entitlement layer is correct
database/migrations/* (existing 307)         ← additive only
resources/js/Pages/* (~300 files)            ← except ~40 terminology strings
The 132 existing feature: gates              ← coexist with capability:
```

---

# 12. LAUNCH READINESS MATRIX

| Area | Current | Required for V1 | Test | Blocking? |
|---|---|---|---|---|
| ERP engine | 🟢 8 months, production use | no change | existing 1,610 | — |
| Test suite | 🟡 11 fail, 46 incomplete, exit 2 | exit 0 | `RUN_FULL.bat` | **YES** |
| `growth_engine` on ltd_2 | 🔴 free metered AI to LTD buyers | off by default | `PlanTruthFailClosedTest` | **YES** |
| AppSumo code stacking | 🔴 failing | correct tier on stack | `CodeStackingTest` | **YES** |
| Capability registry | 🔴 auto-scraped from billing | hand-written, verified | `RegistryIntegrityTest` | **YES** |
| `tenant_capabilities` | 🔴 absent | table + backfill | `ExistingTenantBackfillTest` | **YES** |
| `EnsureCapability` | 🔴 absent | gates all Tier 1 routes | `EnsureCapabilityTest` | **YES** |
| Dependency resolver | 🟡 86 lines | cascade + data-safety | `DependencyResolverTest` | **YES** |
| Apply service + versioning | 🔴 absent | one path, transactional, undo | `ApplyConfigurationTest` | **YES** |
| Presets | 🟡 9, disconnected | 12–15, wired to wizard | `PresetGoldenTest` | **YES** |
| Service-only sale | 🟡 code 1 day old | ledger correct, no stock move | `ServiceOnlySaleTest` | **YES** (for salon/freelancer presets) |
| AI validator | 🔴 absent | rejects all hostile input | `AdversarialTest` | **YES** |
| AI service | 🔴 absent | ≥9/12 fixtures + fallback | `ConfigurationAITest` | **YES** |
| 6 screens | 🔴 absent | end-to-end flow | manual + smoke | **YES** |
| Existing-customer migration | 🔴 unwritten | byte-identical | rehearsal on prod-shaped DB | **YES** |
| Terminology | 🟡 1 location | ~40 locations + settings page | `TerminologyTest` | NO (degrade to 20) |
| Security hygiene | 🟡 `safe.env`, 200 scripts | clean | manual | **YES** |
| Tenant isolation | 🟢 13/13 | unchanged | existing | — |
| Tier 2 field config | 🔴 absent | **NOT IN V1** | — | NO |

---

# 13. FEATURE FREEZE — DO NOT WORK ON

| Frozen | Why |
|---|---|
| Composable Dashboard Builder (further phases) | Already sufficient; presets just pick cards |
| Growth Engine / GrowthBrainStat / GrowthSignalEvent | Marketing infra for a product with no customers |
| Marketing tools suite (28 test files) | Lead-gen for an unlisted product |
| SmartCapture / AI extraction | Impressive; sells zero codes |
| VenSynQ expansion | 36 tests green — leave it exactly there |
| Blog / SEO / OpenSEO | Post-launch |
| Desktop & mobile builds (`app-code/windows-app`, `mobile-app`) | Weeks of hidden work; web-only V1 |
| Migrating ~300 pages to the Next shell | Largest timeline risk in the project |
| **Tier 2 field-level configuration** | **Months of work; no buyer refunds over a form field** |
| Construction / Projects domain | No `Project` models exist — new product, not configuration |
| Any new ERP module | You already have more modules than competitors |
| Open-ended AI chat builder | 5 fixed questions ship in a day and test better |
| Embeddings in `capability_search_index` | Aliases + fulltext suffice for ~30 capabilities |
| >15 presets | Linear test cost, diminishing return |
| `tenant_navigation` table | Derive nav; don't store it |

**The test for every decision:** *"Will a paying AppSumo customer notice this in their first week?"* No → freeze.

---

# 14. THE NEXT 10 ACTIONS

```
1.  php artisan route:list --json > route_list_current.json
2.  Fix the 11 failing tests → exit code 0.
    Priority: growth_engine-on-ltd_2, then AppSumo code stacking.
3.  Triage the 46 incomplete tests — finish or delete each, in writing.
4.  Inspect safe.env; rotate credentials if live; clean ~200 root scripts.
    Tag the commit pre-builder-green.
5.  Validate Appendix A against the fresh route list using
    CAPABILITIES_FILE_GUIDE.md. Resolve every NEEDS_VALIDATION.
6.  Write config/capabilities.php. Write CapabilityRegistryIntegrityTest.
    Do not proceed until it is green.
7.  Create tenant_capabilities + backfill migration.
    Prove existing tenants are byte-identical.
8.  Build CapabilityService and extend CapabilityDependencyResolver.
9.  Build EnsureCapability middleware; apply to Tier 1 route groups.
    Prove no disabled route is reachable by URL.
10. Wire nav + dashboard + terminology to capabilities.
    You now have a demoable "Build Your Own ERP" — before writing one line of AI.
```

**Note what step 10 means:** after these ten actions, you can *demo the product* — toggle capabilities and watch the ERP reshape itself. The AI is a natural-language front door onto a system that already works. **Build the house before the doorbell.**

---

# 15. WHAT "100% READY" MEANS

**BACKEND 100%** — registry verified & tested · `tenant_capabilities` live with backfill proven · `CapabilityService` correct across all 7 states · resolver handles cascade + conflicts + data-safety · `EnsureCapability` on every Tier 1 route · one apply path · versioning with working undo · exit code 0.

**AI 100%** — discovery funnel live · valid JSON ≥9/12 fixtures · validator rejects every adversarial case · apply transactional · fallback to preset picker on any failure · all three spend guards wired.

**UI 100%** — 6 screens live · capability-driven nav · capability-filtered dashboard · 12 terminology keys in ~40 places · "⚙ Customize my system" entry point · proposal screen fully editable.

**PRODUCTION 100%** — no secrets in repo or history · dev scripts excluded from artifact · tenant isolation green · debug off · backups verified · rollback tag exists.

**APPSUMO 100%** — every listing claim true of shipped code · code stacking correct · no paid feature on by default · AI costs bounded per tenant · demo video · screenshots · support flow · existing-customer changelog.

---

# APPENDIX A — PROPOSED `config/capabilities.php`

> **⚠️ THIS IS A DRAFT REQUIRING VALIDATION.**
> Route names derive from `route_list.json` dated **2026-07-08**. Page paths derive from directory names, not verified file-by-file. Every entry marked `NEEDS_VALIDATION` must be confirmed or corrected before use. **Read `CAPABILITIES_FILE_GUIDE.md` before touching this file.**

```php
<?php

/*
|--------------------------------------------------------------------------
| VenQore Capability Registry — Tier 1 Surface Modules
|--------------------------------------------------------------------------
| SOURCE OF TRUTH for the AI Builder. Everything reads from this file:
| the AI prompt, the validator, presets, navigation, dashboard, route gates.
|
| TIER 0 (accounting, FIFO/stock ledger, products, parties, payments, tax,
| UOM, sequences, users, permissions, tenancy, sales) IS NOT LISTED HERE.
| Foundation is always on and must never be user- or AI-controllable.
|
| RULES
|  1. Only list capabilities with a WORKING implementation.
|  2. 'entitlement' must be an existing feature: key in routes/web.php, or null.
|  3. 'routes' must resolve via Route::has().
|  4. 'requires' may only reference other keys in THIS file.
|  5. 'provides_cards' must exist in DashboardRegistry::all().
|  6. 'provides_terms' must exist in Terms::$fallbacks.
|  7. 'permissions' must exist in config/permissions.php.
|  8. status: live | beta | soon | NEEDS_VALIDATION
|
| If you cannot verify something, mark it NEEDS_VALIDATION. Never invent.
*/

return [

    /*
    |--------------------------------------------------------------------
    | GROUP: SELLING
    |--------------------------------------------------------------------
    */

    'pos' => [
        'group'          => 'selling',
        'label'          => 'Point of Sale',
        'description'    => 'Fast counter checkout with barcode scanning and receipts.',
        'requires'       => [],
        'optional'       => ['barcodes', 'loyalty', 'gift_cards', 'parked_sales', 'restaurant_tables'],
        'conflicts'      => [],
        'entitlement'    => null,               // ungated — core
        'routes'         => ['store.pos.*'],
        'pages'          => ['Pos.jsx'],
        'permissions'    => ['pos.checkout', 'pos.open_session', 'pos.close_session'],
        'provides_nav'   => [['route' => 'store.pos.index', 'term' => 'sale', 'icon' => 'ShoppingCart', 'order' => 10]],
        'provides_cards' => [],
        'provides_terms' => ['sale'],
        'aliases'        => ['point of sale', 'counter', 'checkout', 'till', 'cash register', 'billing counter'],
        'status'         => 'live',
    ],

    'parked_sales' => [
        'group'          => 'selling',
        'label'          => 'Held / Parked Sales',
        'description'    => 'Park a sale mid-transaction and resume it later.',
        'requires'       => ['pos'],
        'optional'       => [],
        'conflicts'      => [],
        'entitlement'    => null,
        'routes'         => ['store.parked-sales.*'],
        'pages'          => ['Sales/'],                       // NEEDS_VALIDATION
        'permissions'    => ['pos.checkout'],
        'provides_nav'   => [],                               // surfaced inside POS
        'provides_cards' => [],
        'provides_terms' => [],
        'aliases'        => ['hold sale', 'park sale', 'suspend transaction'],
        'status'         => 'NEEDS_VALIDATION',
    ],

    'returns' => [
        'group'          => 'selling',
        'label'          => 'Sales Returns',
        'description'    => 'Accept returns and issue refunds or credit.',
        'requires'       => [],
        'optional'       => ['store_credit'],
        'conflicts'      => [],
        'entitlement'    => null,
        'routes'         => ['store.returns.*', 'store.returns-history.*'],
        'pages'          => ['Returns/'],
        'permissions'    => ['sales.returns', 'pos.refund'],
        'provides_nav'   => [['route' => 'store.returns.index', 'term' => 'return', 'icon' => 'RefreshCcw', 'order' => 40]],
        'provides_cards' => [],
        'provides_terms' => ['return'],
        'aliases'        => ['refund', 'sales return', 'return goods', 'wapsi'],
        'status'         => 'live',
    ],

    'quotations' => [
        'group'          => 'selling',
        'label'          => 'Quotations',
        'description'    => 'Send price quotes and convert accepted ones into sales.',
        'requires'       => [],
        'optional'       => ['sales_orders'],
        'conflicts'      => [],
        'entitlement'    => null,                             // NEEDS_VALIDATION
        'routes'         => ['store.v3.quotations.*'],
        'pages'          => ['V3/'],                          // NEEDS_VALIDATION
        'permissions'    => ['sales.quotations'],
        'provides_nav'   => [['route' => 'store.v3.quotations.index', 'term' => 'quotation', 'icon' => 'FileText', 'order' => 45]],
        'provides_cards' => [],
        'provides_terms' => ['quotation'],
        'aliases'        => ['quote', 'estimate', 'proforma', 'price quote'],
        'status'         => 'live',
    ],

    'sales_orders' => [
        'group'          => 'selling',
        'label'          => 'Sales Orders',
        'description'    => 'Take advance orders and fulfil them later.',
        'requires'       => [],
        'optional'       => ['quotations'],
        'conflicts'      => [],
        'entitlement'    => null,                             // NEEDS_VALIDATION
        'routes'         => ['store.sales-orders.*', 'store.v3.sales-orders.*'],
        'pages'          => ['SalesOrders/'],
        'permissions'    => ['sales.create', 'sales.view'],
        'provides_nav'   => [['route' => 'store.sales-orders.index', 'term' => 'order', 'icon' => 'ClipboardList', 'order' => 46]],
        'provides_cards' => ['open_orders'],
        'provides_terms' => ['order'],
        'aliases'        => ['order booking', 'advance order', 'custom order', 'pre-order'],
        'status'         => 'live',
    ],

    'pre_sales' => [
        'group'          => 'selling',
        'label'          => 'Pre-Sales & Reservations',
        'description'    => 'Reserve stock against a future sale.',
        'requires'       => ['inventory'],
        'optional'       => [],
        'conflicts'      => [],
        'entitlement'    => 'pre_sales_reservation',          // FACT — 7 route gates
        'routes'         => ['store.pre-sales.*', 'store.presales.*'],
        'pages'          => ['PreSales/'],
        'permissions'    => ['sales.create'],
        'provides_nav'   => [['route' => 'store.pre-sales.index', 'term' => 'order', 'icon' => 'CalendarClock', 'order' => 47]],
        'provides_cards' => [],
        'provides_terms' => [],
        'aliases'        => ['reservation', 'booking', 'advance booking'],
        'status'         => 'live',
    ],

    'b2b_proposals' => [
        'group'          => 'selling',
        'label'          => 'B2B Proposal Builder',
        'description'    => 'Build detailed multi-item business proposals.',
        'requires'       => ['quotations'],
        'optional'       => [],
        'conflicts'      => [],
        'entitlement'    => 'b2b_proposal_builder',           // FACT — 5 route gates
        'routes'         => ['store.proposals.*'],
        'pages'          => ['Proposals/'],
        'permissions'    => ['sales.quotations'],
        'provides_nav'   => [['route' => 'store.proposals.index', 'term' => 'quotation', 'icon' => 'FileSignature', 'order' => 48]],
        'provides_cards' => [],
        'provides_terms' => [],
        'aliases'        => ['proposal', 'tender', 'b2b quote', 'bid'],
        'status'         => 'live',
    ],

    /*
    |--------------------------------------------------------------------
    | GROUP: INVENTORY
    |--------------------------------------------------------------------
    | NOTE: the FIFO stock LEDGER is Tier 0 and always runs. These
    | capabilities control the VISIBILITY of stock management surfaces.
    */

    'inventory' => [
        'group'          => 'inventory',
        'label'          => 'Inventory',
        'description'    => 'See and manage stock levels, movements and valuation.',
        'requires'       => [],
        'optional'       => ['warehouses', 'stock_takes', 'stock_transfers', 'batch_expiry', 'serials'],
        'conflicts'      => [],
        'entitlement'    => null,
        'routes'         => ['store.inventory.*', 'store.stock-operations.*'],
        'pages'          => ['Inventory/', 'StockOperations.jsx'],
        'permissions'    => ['inventory.view', 'inventory.adjust', 'inventory.create', 'inventory.edit'],
        'provides_nav'   => [['route' => 'store.inventory.index', 'term' => 'stock', 'icon' => 'Package', 'order' => 30]],
        'provides_cards' => ['low_stock', 'inventory_value'],
        'provides_terms' => ['stock'],
        'aliases'        => ['stock', 'materials', 'godown', 'store room', 'stock management', 'warehouse stock'],
        'status'         => 'live',
    ],

    'warehouses' => [
        'group'          => 'inventory',
        'label'          => 'Multiple Locations',
        'description'    => 'Run more than one shop, branch or storage location.',
        'requires'       => ['inventory'],
        'optional'       => ['stock_transfers'],
        'conflicts'      => [],
        'entitlement'    => 'multi_branch',                   // FACT — 4 route gates
        'routes'         => ['store.v3.warehouses.*'],
        'pages'          => ['V3/'],                          // NEEDS_VALIDATION
        'permissions'    => ['admin.warehouses'],
        'provides_nav'   => [['route' => 'store.v3.warehouses.index', 'term' => 'location', 'icon' => 'Building2', 'order' => 32]],
        'provides_cards' => [],
        'provides_terms' => ['location'],
        'aliases'        => ['branch', 'warehouse', 'godown', 'multi location', 'outlet', 'yard'],
        'status'         => 'live',
    ],

    'stock_transfers' => [
        'group'          => 'inventory',
        'label'          => 'Stock Transfers',
        'description'    => 'Move stock between locations with full tracking.',
        'requires'       => ['inventory', 'warehouses'],
        'optional'       => [],
        'conflicts'      => [],
        'entitlement'    => 'multi_branch',                   // NEEDS_VALIDATION
        'routes'         => ['store.stock-transfers.*', 'store.v3.stock-transfers.*'],
        'pages'          => ['StockTransfers/'],
        'permissions'    => ['inventory.transfer'],
        'provides_nav'   => [['route' => 'store.stock-transfers.index', 'term' => 'stock', 'icon' => 'ArrowLeftRight', 'order' => 33]],
        'provides_cards' => [],
        'provides_terms' => [],
        'aliases'        => ['transfer stock', 'branch transfer', 'move inventory'],
        'status'         => 'live',
    ],

    'stock_takes' => [
        'group'          => 'inventory',
        'label'          => 'Stock Takes',
        'description'    => 'Physical stock counts and reconciliation.',
        'requires'       => ['inventory'],
        'optional'       => ['barcodes'],
        'conflicts'      => [],
        'entitlement'    => null,
        'routes'         => ['store.stock-takes.*'],
        'pages'          => ['StockTake/'],
        'permissions'    => ['inventory.adjust'],
        'provides_nav'   => [['route' => 'store.stock-takes.index', 'term' => 'stock', 'icon' => 'ClipboardCheck', 'order' => 34]],
        'provides_cards' => [],
        'provides_terms' => [],
        'aliases'        => ['stock count', 'physical count', 'audit stock', 'stock check'],
        'status'         => 'live',
    ],

    'batch_expiry' => [
        'group'          => 'inventory',
        'label'          => 'Batches & Expiry',
        'description'    => 'Track batch numbers and expiry dates.',
        'requires'       => ['inventory'],
        'optional'       => [],
        'conflicts'      => [],
        'entitlement'    => null,                             // NEEDS_VALIDATION
        'routes'         => ['store.batches.*'],
        'pages'          => ['BatchTracking/'],
        'permissions'    => ['inventory.view', 'inventory.edit'],
        'provides_nav'   => [['route' => 'store.batches.index', 'term' => 'stock', 'icon' => 'Layers', 'order' => 35]],
        'provides_cards' => [],
        'provides_terms' => [],
        'aliases'        => ['batch', 'expiry', 'lot', 'shelf life', 'best before'],
        'status'         => 'live',
    ],

    'serials' => [
        'group'          => 'inventory',
        'label'          => 'Serial / IMEI Tracking',
        'description'    => 'Track individual units by serial or IMEI number.',
        'requires'       => ['inventory'],
        'optional'       => ['warranty'],
        'conflicts'      => [],
        'entitlement'    => null,                             // NEEDS_VALIDATION
        'routes'         => ['store.serials.*'],
        'pages'          => ['SerialTracking/'],
        'permissions'    => ['inventory.view', 'inventory.edit'],
        'provides_nav'   => [['route' => 'store.serials.index', 'term' => 'product', 'icon' => 'ScanLine', 'order' => 36]],
        'provides_cards' => [],
        'provides_terms' => [],
        'aliases'        => ['imei', 'serial number', 'unit tracking', 'device tracking'],
        'status'         => 'live',
    ],

    'variants' => [
        'group'          => 'inventory',
        'label'          => 'Product Variants',
        'description'    => 'Size, colour and other variations of one product.',
        'requires'       => [],
        'optional'       => [],
        'conflicts'      => [],
        'entitlement'    => null,                             // NEEDS_VALIDATION
        'routes'         => ['store.variants.*', 'store.attributes.*'],
        'pages'          => ['Inventory/'],                   // NEEDS_VALIDATION
        'permissions'    => ['inventory.create', 'inventory.edit'],
        'provides_nav'   => [],                               // surfaced inside Products
        'provides_terms' => ['product'],
        'provides_cards' => [],
        'aliases'        => ['size color', 'variations', 'attributes', 'sku variants'],
        'status'         => 'live',
    ],

    'barcodes' => [
        'group'          => 'inventory',
        'label'          => 'Barcodes & Labels',
        'description'    => 'Generate and print barcode labels and price tags.',
        'requires'       => [],
        'optional'       => [],
        'conflicts'      => [],
        'entitlement'    => 'barcode_label_print',            // FACT — 2 route gates
        'routes'         => ['store.labels.*'],
        'pages'          => ['Labels/'],
        'permissions'    => ['inventory.barcodes'],
        'provides_nav'   => [['route' => 'store.labels.index', 'term' => 'product', 'icon' => 'Barcode', 'order' => 37]],
        'provides_cards' => [],
        'provides_terms' => [],
        'aliases'        => ['barcode', 'label printing', 'price tag', 'scanner'],
        'status'         => 'live',
    ],

    /*
    |--------------------------------------------------------------------
    | GROUP: BUYING
    |--------------------------------------------------------------------
    */

    'purchases' => [
        'group'          => 'buying',
        'label'          => 'Purchases',
        'description'    => 'Record stock purchases and supplier bills.',
        'requires'       => [],
        'optional'       => ['suppliers', 'purchase_orders', 'purchase_returns'],
        'conflicts'      => [],
        'entitlement'    => null,
        'routes'         => ['store.purchases.*', 'store.v3.purchases.*'],
        'pages'          => ['V3/'],                          // NEEDS_VALIDATION
        'permissions'    => ['purchases.view', 'purchases.create', 'purchases.edit'],
        'provides_nav'   => [['route' => 'store.purchases.index', 'term' => 'purchase', 'icon' => 'ShoppingBag', 'order' => 20]],
        'provides_cards' => ['recent_purchases', 'payables'],
        'provides_terms' => ['purchase'],
        'aliases'        => ['buying', 'procurement', 'supplier bills', 'stock in', 'kharid'],
        'status'         => 'live',
    ],

    'suppliers' => [
        'group'          => 'buying',
        'label'          => 'Suppliers',
        'description'    => 'Supplier directory with balances and statements.',
        'requires'       => [],
        'optional'       => ['purchases'],
        'conflicts'      => [],
        'entitlement'    => 'suppliers_directory',            // FACT — 2 route gates
        'routes'         => ['store.suppliers.*', 'store.v3.suppliers.*'],
        'pages'          => ['Suppliers/'],
        'permissions'    => ['purchases.suppliers'],
        'provides_nav'   => [['route' => 'store.suppliers.index', 'term' => 'supplier', 'icon' => 'Truck', 'order' => 22]],
        'provides_cards' => [],
        'provides_terms' => ['supplier'],
        'aliases'        => ['vendor', 'supplier', 'party', 'wholesaler', 'distributor'],
        'status'         => 'live',
    ],

    'purchase_orders' => [
        'group'          => 'buying',
        'label'          => 'Purchase Orders',
        'description'    => 'Raise POs to suppliers and receive against them.',
        'requires'       => ['purchases', 'suppliers'],
        'optional'       => [],
        'conflicts'      => [],
        'entitlement'    => 'purchase_orders',                // FACT — 8 route gates
        'routes'         => ['store.purchase-orders.*'],
        'pages'          => ['PurchaseOrders/'],
        'permissions'    => ['purchases.create'],
        'provides_nav'   => [['route' => 'store.purchase-orders.index', 'term' => 'order', 'icon' => 'FileInput', 'order' => 23]],
        'provides_cards' => [],
        'provides_terms' => ['order'],
        'aliases'        => ['po', 'purchase order', 'indent', 'requisition'],
        'status'         => 'live',
    ],

    'purchase_returns' => [
        'group'          => 'buying',
        'label'          => 'Purchase Returns',
        'description'    => 'Return goods to suppliers and adjust balances.',
        'requires'       => ['purchases'],
        'optional'       => ['debit_credit_notes'],
        'conflicts'      => [],
        'entitlement'    => 'purchase_returns',               // FACT — 2 route gates
        'routes'         => ['store.debit-notes.*'],          // NEEDS_VALIDATION
        'pages'          => ['DebitNotes/'],
        'permissions'    => ['purchases.void'],
        'provides_nav'   => [],
        'provides_cards' => [],
        'provides_terms' => ['return'],
        'aliases'        => ['return to supplier', 'purchase return', 'debit note'],
        'status'         => 'live',
    ],

    'debit_credit_notes' => [
        'group'          => 'buying',
        'label'          => 'Debit & Credit Notes',
        'description'    => 'Formal adjustment notes against parties.',
        'requires'       => [],
        'optional'       => [],
        'conflicts'      => [],
        'entitlement'    => 'debit_credit_notes',             // FACT — 4 route gates
        'routes'         => ['store.debit-notes.*'],
        'pages'          => ['DebitNotes/'],
        'permissions'    => ['finance.transactions'],
        'provides_nav'   => [['route' => 'store.debit-notes.index', 'term' => 'invoice', 'icon' => 'FileMinus', 'order' => 24]],
        'provides_cards' => [],
        'provides_terms' => [],
        'aliases'        => ['debit note', 'credit note', 'adjustment note'],
        'status'         => 'live',
    ],

    /*
    |--------------------------------------------------------------------
    | GROUP: PRODUCTION
    |--------------------------------------------------------------------
    */

    'compositions' => [
        'group'          => 'production',
        'label'          => 'Recipes / Bill of Materials',
        'description'    => 'Define what a made item is composed of.',
        'requires'       => ['inventory'],
        'optional'       => ['production'],
        'conflicts'      => [],
        'entitlement'    => 'compositions',                   // FACT — 7 route gates
        'routes'         => ['store.cookbook.*', 'store.v3.boms.*'],
        'pages'          => ['Cookbook/'],
        'permissions'    => ['inventory.create', 'inventory.edit'],
        'provides_nav'   => [['route' => 'store.cookbook.index', 'term' => 'product', 'icon' => 'BookOpen', 'order' => 50]],
        'provides_cards' => [],
        'provides_terms' => [],                               // NEEDS 'composition' key added to Terms.php
        'aliases'        => ['recipe', 'bom', 'bill of materials', 'formula', 'ingredients'],
        'status'         => 'live',
    ],

    'production' => [
        'group'          => 'production',
        'label'          => 'Manufacturing',
        'description'    => 'Run production, consume materials, produce finished goods.',
        'requires'       => ['inventory', 'compositions'],
        'optional'       => ['warehouses'],
        'conflicts'      => [],
        'entitlement'    => 'production',                     // FACT — 5 route gates
        'routes'         => ['store.production.*', 'store.manufacturing.*', 'store.v3.production-runs.*'],
        'pages'          => ['Manufacturing/'],
        'permissions'    => ['inventory.adjust', 'inventory.create'],
        'provides_nav'   => [['route' => 'store.production.index', 'term' => 'product', 'icon' => 'Factory', 'order' => 51]],
        'provides_cards' => ['production_output'],
        'provides_terms' => [],
        'aliases'        => ['manufacturing', 'production', 'assembly', 'making', 'baking'],
        'status'         => 'live',
    ],

    /*
    |--------------------------------------------------------------------
    | GROUP: CUSTOMERS & MONEY
    |--------------------------------------------------------------------
    */

    'customers_directory' => [
        'group'          => 'customers',
        'label'          => 'Customers',
        'description'    => 'Customer directory with history and balances.',
        'requires'       => [],
        'optional'       => ['khata_credit', 'loyalty'],
        'conflicts'      => [],
        'entitlement'    => null,
        'routes'         => ['store.customers.*', 'store.parties.*'],
        'pages'          => ['Parties/'],
        'permissions'    => ['sales.view'],
        'provides_nav'   => [['route' => 'store.customers.index', 'term' => 'customer', 'icon' => 'Users', 'order' => 25]],
        'provides_cards' => ['customer_count', 'top_customers'],
        'provides_terms' => ['customer'],
        'aliases'        => ['customers', 'clients', 'patients', 'guests', 'members', 'buyers'],
        'status'         => 'live',
    ],

    'khata_credit' => [
        'group'          => 'customers',
        'label'          => 'Credit / Khata',
        'description'    => 'Let customers buy on credit and track what they owe.',
        'requires'       => ['customers_directory'],
        'optional'       => ['invoice_reminders'],
        'conflicts'      => [],
        'entitlement'    => 'customer_khata',                 // FACT — 1 route gate
        'routes'         => ['store.payments.*', 'store.v3.customer-payments.*'],
        'pages'          => ['Payments/'],
        'permissions'    => ['finance.receive_payment', 'finance.balances'],
        'provides_nav'   => [['route' => 'store.payments.index', 'term' => 'payment', 'icon' => 'Wallet', 'order' => 26]],
        'provides_cards' => ['receivables'],
        'provides_terms' => ['payment'],
        'aliases'        => ['khata', 'credit', 'udhaar', 'receivables', 'pay later', 'account sales'],
        'status'         => 'live',
    ],

    'loyalty' => [
        'group'          => 'customers',
        'label'          => 'Loyalty Points',
        'description'    => 'Reward repeat customers with points.',
        'requires'       => ['customers_directory'],
        'optional'       => ['pos'],
        'conflicts'      => [],
        'entitlement'    => null,                             // NEEDS_VALIDATION
        'routes'         => ['store.loyalty.*'],
        'pages'          => ['Store/'],                       // NEEDS_VALIDATION
        'permissions'    => ['sales.view'],
        'provides_nav'   => [['route' => 'store.loyalty.index', 'term' => 'customer', 'icon' => 'Star', 'order' => 27]],
        'provides_cards' => [],
        'provides_terms' => [],
        'aliases'        => ['loyalty', 'points', 'rewards', 'membership'],
        'status'         => 'live',
    ],

    'gift_cards' => [
        'group'          => 'customers',
        'label'          => 'Gift Cards & Store Credit',
        'description'    => 'Sell gift cards and hold store credit balances.',
        'requires'       => ['customers_directory'],
        'optional'       => ['pos'],
        'conflicts'      => [],
        'entitlement'    => null,                             // NEEDS_VALIDATION
        'routes'         => ['store.gift-cards.*', 'store.store-credit.*'],
        'pages'          => ['Gift/'],
        'permissions'    => ['sales.create'],
        'provides_nav'   => [['route' => 'store.gift-cards.index', 'term' => 'customer', 'icon' => 'Gift', 'order' => 28]],
        'provides_cards' => [],
        'provides_terms' => [],
        'aliases'        => ['gift card', 'voucher', 'store credit', 'gift voucher'],
        'status'         => 'live',
    ],

    'expenses' => [
        'group'          => 'money',
        'label'          => 'Expenses',
        'description'    => 'Record and categorise business expenses.',
        'requires'       => [],
        'optional'       => [],
        'conflicts'      => [],
        'entitlement'    => 'expense_manager',                // FACT — 9 route gates
        'routes'         => ['store.expenses.*', 'store.v3.expenses.*'],
        'pages'          => ['Expenses/'],
        'permissions'    => ['finance.expenses'],
        'provides_nav'   => [['route' => 'store.expenses.index', 'term' => 'expense', 'icon' => 'Receipt', 'order' => 60]],
        'provides_cards' => ['expenses'],
        'provides_terms' => ['expense'],
        'aliases'        => ['expenses', 'costs', 'kharcha', 'outgoings', 'bills'],
        'status'         => 'live',
    ],

    'bank_accounts' => [
        'group'          => 'money',
        'label'          => 'Bank Accounts',
        'description'    => 'Track bank balances and transfers.',
        'requires'       => [],
        'optional'       => ['bank_reconciliation'],
        'conflicts'      => [],
        'entitlement'    => null,                             // NEEDS_VALIDATION
        'routes'         => ['store.bank-accounts.*', 'store.v3.bank-transfers.*'],
        'pages'          => ['BankAccounts/'],
        'permissions'    => ['finance.balances'],
        'provides_nav'   => [['route' => 'store.bank-accounts.index', 'term' => 'payment', 'icon' => 'Landmark', 'order' => 61]],
        'provides_cards' => ['cash_position'],
        'provides_terms' => [],
        'aliases'        => ['bank', 'bank account', 'accounts'],
        'status'         => 'live',
    ],

    'bank_reconciliation' => [
        'group'          => 'money',
        'label'          => 'Bank Reconciliation',
        'description'    => 'Match bank statements against your books.',
        'requires'       => ['bank_accounts'],
        'optional'       => [],
        'conflicts'      => [],
        'entitlement'    => 'bank_reconciliation',            // FACT — 2 route gates
        'routes'         => ['store.bank-reconciliation.*'],
        'pages'          => ['BankReconciliation/'],
        'permissions'    => ['finance.balances', 'reports.financial'],
        'provides_nav'   => [['route' => 'store.bank-reconciliation.index', 'term' => 'report', 'icon' => 'GitCompare', 'order' => 62]],
        'provides_cards' => [],
        'provides_terms' => [],
        'aliases'        => ['reconcile', 'bank matching', 'statement matching'],
        'status'         => 'live',
    ],

    'fund_management' => [
        'group'          => 'money',
        'label'          => 'Funds & Cash Management',
        'description'    => 'Manage cash drawers, funds and internal transfers.',
        'requires'       => [],
        'optional'       => ['bank_accounts'],
        'conflicts'      => [],
        'entitlement'    => 'fund_management',                // FACT — 5 route gates
        'routes'         => ['store.funds.*', 'store.v3.funds.*'],
        'pages'          => ['Funds/'],
        'permissions'    => ['finance.balances', 'finance.transactions'],
        'provides_nav'   => [['route' => 'store.funds.index', 'term' => 'payment', 'icon' => 'Coins', 'order' => 63]],
        'provides_cards' => [],
        'provides_terms' => [],
        'aliases'        => ['cash management', 'funds', 'drawer', 'petty cash'],
        'status'         => 'live',
    ],

    'recurring_invoices' => [
        'group'          => 'money',
        'label'          => 'Recurring Invoices',
        'description'    => 'Automatically issue invoices on a schedule.',
        'requires'       => ['customers_directory'],
        'optional'       => ['invoice_reminders'],
        'conflicts'      => [],
        'entitlement'    => 'recurring_invoices',             // FACT — 7 route gates
        'routes'         => ['store.recurring-invoices.*'],
        'pages'          => ['RecurringInvoices/'],
        'permissions'    => ['sales.create'],
        'provides_nav'   => [['route' => 'store.recurring-invoices.index', 'term' => 'invoice', 'icon' => 'Repeat', 'order' => 64]],
        'provides_cards' => [],
        'provides_terms' => ['invoice'],
        'aliases'        => ['subscription billing', 'recurring', 'auto invoice', 'retainer'],
        'status'         => 'live',
    ],

    'invoice_reminders' => [
        'group'          => 'money',
        'label'          => 'Payment Reminders',
        'description'    => 'Chase customers for unpaid invoices automatically.',
        'requires'       => ['khata_credit'],
        'optional'       => [],
        'conflicts'      => [],
        'entitlement'    => 'invoice_reminders',              // FACT — 4 route gates
        'routes'         => ['store.invoice-reminders.*'],
        'pages'          => ['Reminders/'],
        'permissions'    => ['finance.receive_payment'],
        'provides_nav'   => [],
        'provides_cards' => [],
        'provides_terms' => [],
        'aliases'        => ['reminder', 'dunning', 'follow up', 'chase payment'],
        'status'         => 'live',
    ],

    'e_invoicing' => [
        'group'          => 'money',
        'label'          => 'E-Invoicing / FBR',
        'description'    => 'Government-compliant electronic invoicing.',
        'requires'       => [],
        'optional'       => [],
        'conflicts'      => [],
        'entitlement'    => 'e_invoicing',                    // FACT — 3 route gates
        'routes'         => ['store.e-invoicing.*'],
        'pages'          => ['EInvoicing/'],
        'permissions'    => ['admin.taxes_methods'],
        'provides_nav'   => [['route' => 'store.e-invoicing.index', 'term' => 'invoice', 'icon' => 'BadgeCheck', 'order' => 65]],
        'provides_cards' => [],
        'provides_terms' => [],
        'aliases'        => ['fbr', 'e-invoice', 'tax compliance', 'digital invoice'],
        'status'         => 'live',
    ],

    /*
    |--------------------------------------------------------------------
    | GROUP: OPERATIONS
    |--------------------------------------------------------------------
    */

    'restaurant_tables' => [
        'group'          => 'operations',
        'label'          => 'Tables & Dine-In',
        'description'    => 'Table management, orders and kitchen tickets.',
        'requires'       => ['pos'],
        'optional'       => ['compositions'],
        'conflicts'      => [],
        'entitlement'    => null,                             // NEEDS_VALIDATION
        'routes'         => [],                               // NEEDS_VALIDATION — no store.restaurant.* in route list
        'pages'          => ['Restaurant/'],
        'permissions'    => ['pos.checkout'],
        'provides_nav'   => [],                               // NEEDS_VALIDATION
        'provides_cards' => [],
        'provides_terms' => ['position', 'occupancy'],
        'aliases'        => ['tables', 'dine in', 'restaurant', 'cafe', 'seating', 'kot'],
        'status'         => 'NEEDS_VALIDATION',
    ],

    'service_jobs' => [
        'group'          => 'operations',
        'label'          => 'Service Jobs',
        'description'    => 'Job cards for repair, service and appointment work.',
        'requires'       => ['customers_directory'],
        'optional'       => ['inventory'],
        'conflicts'      => [],
        'entitlement'    => null,                             // NEEDS_VALIDATION
        'routes'         => [],                               // NEEDS_VALIDATION — ServiceEngine is 1 day old
        'pages'          => [],                               // NEEDS_VALIDATION
        'permissions'    => ['sales.create'],
        'provides_nav'   => [],                               // NEEDS_VALIDATION
        'provides_cards' => [],
        'provides_terms' => ['job', 'technician', 'service'],
        'aliases'        => ['job card', 'repair', 'service', 'appointment', 'work order'],
        'status'         => 'NEEDS_VALIDATION',               // ⚠️ migration dated 2026_08_12 — least proven code
    ],

    'staff_management' => [
        'group'          => 'operations',
        'label'          => 'Staff & Attendance',
        'description'    => 'Staff accounts, shifts and attendance tracking.',
        'requires'       => [],
        'optional'       => [],
        'conflicts'      => [],
        'entitlement'    => null,                             // NEEDS_VALIDATION
        'routes'         => ['store.staff.*', 'store.attendance.*', 'store.staff-attendance.*'],
        'pages'          => ['Staff/', 'StaffAttendance/'],
        'permissions'    => ['admin.staff_view', 'admin.staff_manage', 'users.manage'],
        'provides_nav'   => [['route' => 'store.staff.index', 'term' => 'staff', 'icon' => 'UserCog', 'order' => 70]],
        'provides_cards' => ['active_staff'],
        'provides_terms' => ['staff', 'shift', 'attendance'],
        'aliases'        => ['staff', 'employees', 'workers', 'team', 'attendance'],
        'status'         => 'live',
    ],

    'woocommerce' => [
        'group'          => 'channels',
        'label'          => 'WooCommerce Sync',
        'description'    => 'Sync products, stock and orders with a WooCommerce store.',
        'requires'       => ['inventory'],
        'optional'       => [],
        'conflicts'      => [],
        'entitlement'    => null,                             // NEEDS_VALIDATION — likely a paid add-on
        'routes'         => ['store.woocommerce.*', 'store.online-store.*'],
        'pages'          => ['WooCommerce/', 'OnlineStore/'],
        'permissions'    => ['vensynq.manage'],
        'provides_nav'   => [['route' => 'store.woocommerce.index', 'term' => 'product', 'icon' => 'Globe', 'order' => 80]],
        'provides_cards' => [],
        'provides_terms' => [],
        'aliases'        => ['woocommerce', 'online store', 'ecommerce', 'website sync', 'woo'],
        'status'         => 'live',
    ],

    'bulk_upload' => [
        'group'          => 'operations',
        'label'          => 'Bulk Import',
        'description'    => 'Import products, customers and stock from spreadsheets.',
        'requires'       => [],
        'optional'       => [],
        'conflicts'      => [],
        'entitlement'    => 'bulk_upload',                    // FACT — 4 route gates
        'routes'         => ['store.import.*', 'store.import-export.*'],
        'pages'          => [],                               // NEEDS_VALIDATION
        'permissions'    => ['data.export', 'inventory.create'],
        'provides_nav'   => [],
        'provides_cards' => [],
        'provides_terms' => [],
        'aliases'        => ['import', 'bulk upload', 'csv import', 'excel import', 'migration'],
        'status'         => 'live',
    ],

    /*
    |--------------------------------------------------------------------
    | GROUP: REPORTING
    |--------------------------------------------------------------------
    | Reports are bundled into three tiers rather than exposed as ~15
    | separate toggles. RECOMMENDATION: nobody wants to configure reports
    | individually during onboarding.
    */

    'reports_basic' => [
        'group'          => 'reporting',
        'label'          => 'Basic Reports',
        'description'    => 'Daily sales, stock and cash reports.',
        'requires'       => [],
        'optional'       => [],
        'conflicts'      => [],
        'entitlement'    => null,
        'routes'         => ['store.reports.*'],
        'pages'          => ['Reports/'],
        'permissions'    => ['reports.summary', 'reports.stock'],
        'provides_nav'   => [['route' => 'store.reports.index', 'term' => 'report', 'icon' => 'BarChart3', 'order' => 90]],
        'provides_cards' => ['revenue_trend'],
        'provides_terms' => ['report'],
        'aliases'        => ['reports', 'reporting', 'analytics', 'summary'],
        'status'         => 'live',
    ],

    'reports_financial' => [
        'group'          => 'reporting',
        'label'          => 'Financial Reports',
        'description'    => 'Profit & loss, trial balance, cash flow, ageing.',
        'requires'       => ['reports_basic'],
        'optional'       => [],
        'conflicts'      => [],
        'entitlement'    => 'report_profit_loss',             // FACT — 12 route gates (most-gated feature)
        'routes'         => ['store.reports.*', 'store.accounting.*'],
        'pages'          => ['Reports/', 'Accounting/'],
        'permissions'    => ['reports.financial', 'finance.journal'],
        'provides_nav'   => [['route' => 'store.accounting.index', 'term' => 'report', 'icon' => 'BookText', 'order' => 91]],
        'provides_cards' => ['net_profit'],
        'provides_terms' => [],
        'aliases'        => ['profit loss', 'p&l', 'balance sheet', 'trial balance', 'financial statements'],
        'status'         => 'live',
    ],

    'reports_advanced' => [
        'group'          => 'reporting',
        'label'          => 'Advanced Insights',
        'description'    => 'Customer/supplier insights, stock ageing, valuation, discounts.',
        'requires'       => ['reports_basic'],
        'optional'       => [],
        'conflicts'      => [],
        'entitlement'    => 'customer_insights',              // NEEDS_VALIDATION — spans several keys
        'routes'         => ['store.reports.*'],
        'pages'          => ['Reports/'],
        'permissions'    => ['reports.performance', 'reports.audit'],
        'provides_nav'   => [],
        'provides_cards' => [],
        'provides_terms' => [],
        'aliases'        => ['insights', 'analytics', 'business intelligence', 'ageing'],
        'status'         => 'live',
    ],

    'ai_insights' => [
        'group'          => 'reporting',
        'label'          => 'AI Assistant',
        'description'    => 'Ask questions about your business in plain language.',
        'requires'       => ['reports_basic'],
        'optional'       => [],
        'conflicts'      => [],
        'entitlement'    => 'growth_engine',                  // ⚠️ FACT — currently ON by default on ltd_2. FIX FIRST.
        'routes'         => ['store.ai.*'],
        'pages'          => [],                               // NEEDS_VALIDATION
        'permissions'    => ['reports.summary'],
        'provides_nav'   => [],
        'provides_cards' => ['ai_insights'],
        'provides_terms' => [],
        'aliases'        => ['ai', 'assistant', 'chat', 'ask'],
        'status'         => 'live',
    ],

];
```

**Draft count: 34 Tier 1 capabilities** across 8 groups (selling 7, inventory 8, buying 5, production 2, customers 4, money 7, operations 5, reporting 4 — some overlap in grouping). Within the 25–35 target.

**Entries requiring validation before use: 12** (marked `NEEDS_VALIDATION`). Two are structural risks: **`service_jobs`** (engine is one day old) and **`restaurant_tables`** (no matching routes found in the July route list).

---

# APPENDIX B — DEPENDENCY GRAPH

```
TIER 0 — FOUNDATION (always present, never listed, never toggleable)
├── Accounting / double-entry ledger      AccountingService
├── Stock ledger / FIFO                   FifoService · InventoryService
├── Products                              Product
├── Parties (customers + suppliers)       PartyService
├── Payments                              PaymentService
├── Tax                                   TaxService
├── UOM                                   UomService
├── Sequences                             SequenceService
├── Sales transaction                     SaleService
└── Users · Permissions · Tenancy

TIER 1 — SURFACE MODULES

SELLING
  pos ──────────────────────► (foundation only)
   ├── parked_sales ─────────► requires pos
   └── restaurant_tables ────► requires pos
  returns ──────────────────► (foundation only)
  quotations ───────────────► (foundation only)
   └── b2b_proposals ───────► requires quotations
  sales_orders ─────────────► (foundation only)
  pre_sales ────────────────► requires inventory

INVENTORY
  inventory ────────────────► (foundation only)
   ├── warehouses ──────────► requires inventory
   │    └── stock_transfers ► requires inventory + warehouses
   ├── stock_takes ─────────► requires inventory
   ├── batch_expiry ────────► requires inventory
   └── serials ─────────────► requires inventory
  variants ─────────────────► (foundation only)
  barcodes ─────────────────► (foundation only)

BUYING
  purchases ────────────────► (foundation only)
   ├── purchase_returns ────► requires purchases
   └── purchase_orders ─────► requires purchases + suppliers
  suppliers ────────────────► (foundation only)
  debit_credit_notes ───────► (foundation only)

PRODUCTION
  compositions ─────────────► requires inventory
   └── production ──────────► requires inventory + compositions

CUSTOMERS
  customers_directory ──────► (foundation only)
   ├── khata_credit ────────► requires customers_directory
   │    └── invoice_reminders ► requires khata_credit
   ├── loyalty ─────────────► requires customers_directory
   ├── gift_cards ──────────► requires customers_directory
   └── recurring_invoices ──► requires customers_directory

MONEY
  expenses · fund_management · e_invoicing ► (foundation only)
  bank_accounts ────────────► (foundation only)
   └── bank_reconciliation ─► requires bank_accounts

OPERATIONS
  staff_management · bulk_upload ► (foundation only)
  service_jobs ─────────────► requires customers_directory
  woocommerce ──────────────► requires inventory

REPORTING
  reports_basic ────────────► (foundation only)
   ├── reports_financial ───► requires reports_basic
   ├── reports_advanced ────► requires reports_basic
   └── ai_insights ─────────► requires reports_basic

CONFLICTS: none identified.   INFERENCE: correct — this is a show/hide
system, so no two surfaces are mutually exclusive.
Maximum dependency depth: 3 (stock_transfers → warehouses → inventory).
No cycles.
```

**Dependency-type legend:**

| Type | Meaning | Enforcement |
|---|---|---|
| **Required** | Cannot function without it | Cascade-enable; refuse cascade-disable |
| **UX** | Works, but makes no sense alone | Warn in proposal; allow |
| **Optional** | Enhancement | Suggest in proposal; never auto-enable |
| **Foundation** | Tier 0, always present | Never expressed in the registry |

---

# APPENDIX C — AI CONFIGURATION SCHEMA

```json
{
  "type": "object",
  "required": ["preset", "capabilities", "reasoning"],
  "additionalProperties": false,
  "properties": {
    "preset":       { "type": "string", "description": "closest preset key, or 'custom'" },
    "confidence":   { "type": "number", "minimum": 0, "maximum": 1 },
    "capabilities": {
      "type": "array", "maxItems": 40,
      "items": { "type": "string", "maxLength": 64, "pattern": "^[a-z0-9_]+$" }
    },
    "terminology": {
      "type": "object", "maxProperties": 12,
      "additionalProperties": {
        "type": "object",
        "required": ["singular", "plural"],
        "properties": {
          "singular": { "type": "string", "maxLength": 40 },
          "plural":   { "type": "string", "maxLength": 40 }
        }
      }
    },
    "dashboard":   { "type": "array", "maxItems": 12, "items": { "type": "string", "maxLength": 64 } },
    "reasoning":   { "type": "string", "maxLength": 600 },
    "unsupported": {
      "type": "array", "maxItems": 5,
      "items": { "type": "string", "maxLength": 120 },
      "description": "things the user asked for that the registry cannot provide"
    }
  }
}
```

**Deliberately excluded:** `warnings`, `required_confirmations`, `dependencies`. **Rationale:** all three are computed deterministically by the validator from `config/capabilities.php`. Letting the AI produce them creates two sources of truth and lets a model's opinion override your rules.

**`unsupported` is the most commercially valuable field in the schema.** It is your product-demand log. Store every entry with the tenant id and the original description — this becomes your roadmap, priced by real demand.

**Length caps are security controls**, not tidiness: they bound token cost, prevent memory-exhaustion via a giant array, and cap the blast radius of prompt injection. Enforce them in the validator, not just the schema.

---

# APPENDIX D — PRESET MATRIX (V1: 13 presets)

Existing 9 (FACT, `BusinessTemplatesSeeder.php`): `retail_store`, `fashion_variants`, `electronics_serials`, `hardware_materials`, `restaurant_cafe`, `bakery_production`, `pharmacy`, + 2 unread.

| # | Preset | Tier 1 capabilities | Key terminology | Test status |
|---|---|---|---|---|
| 1 | **POS Only** ⭐ | pos, returns, barcodes, reports_basic | — | **NEW — must write** |
| 2 | **Retail / Grocery** ⭐ | pos, inventory, purchases, suppliers, customers_directory, khata_credit, expenses, barcodes, reports_basic | stock=Stock | exists |
| 3 | Supermarket | + warehouses, stock_transfers, stock_takes, staff_management | location=Branch | exists |
| 4 | Fashion & Apparel | pos, inventory, variants, customers_directory, loyalty, barcodes, reports_basic | product=Article | exists |
| 5 | Electronics | pos, inventory, serials, purchases, suppliers, reports_basic | serial=IMEI | exists |
| 6 | Hardware / Building | pos, inventory, purchases, suppliers, quotations, khata_credit, reports_basic | product=Item, location=Yard | exists |
| 7 | Restaurant / Café | pos, restaurant_tables, compositions, reports_basic | customer=Guest, position=Table | exists ⚠️ |
| 8 | Bakery / Production | pos, inventory, compositions, production, batch_expiry, sales_orders | composition=Recipe | exists |
| 9 | Pharmacy | pos, inventory, batch_expiry, purchases, suppliers, customers_directory | — | exists |
| 10 | Wholesale / Distribution | quotations, sales_orders, purchases, suppliers, purchase_orders, khata_credit, warehouses, reports_financial | customer=Buyer | **NEW** |
| 11 | **Salon / Service** ⭐ | service_jobs, customers_directory, pos, staff_management, reports_basic | customer=Client, job=Appointment | **NEW ⚠️ BLOCKED on service-only test** |
| 12 | Repair / Workshop | service_jobs, inventory, customers_directory, staff_management | job=Job Card | **NEW ⚠️ BLOCKED** |
| 13 | Freelancer / Agency | customers_directory, quotations, recurring_invoices, khata_credit, expenses, reports_basic | customer=Client | **NEW — simplest preset; proves "remove modules"** |

⭐ = the three presets that must be perfect. **Every preset ships with `reports_basic`; foundation is automatic and never listed.**

**⚠️ Presets 11 and 12 must not ship until `ServiceOnlySaleTest` passes.** Preset 7 depends on `restaurant_tables`, currently `NEEDS_VALIDATION`.

**Preset golden test (one per preset):**
```
fresh tenant → apply preset → assert capabilities set → assert nav items
→ assert terminology → assert dashboard cards → CREATE A REAL SALE
→ assert ledger balances → assert stock moved (or didn't, for service)
```
The last three lines are what make it a *golden* test rather than a configuration test.

---

# APPENDIX E — V1 TEST MATRIX

| Test | Type | Purpose | Expected | Blocking |
|---|---|---|---|---|
| `RUN_FULL.bat` | Regression | Nothing broke | exit 0 | **YES** |
| `PlanTruthFailClosedTest` | Entitlement | No paid feature on by default | pass | **YES** |
| `AppSumo\CodeStackingTest` | Billing | Stacking → correct tier | pass | **YES** |
| `CapabilityRegistryIntegrityTest` | Unit | Every route/page/card/term/perm resolves | 0 orphans | **YES** |
| `TierZeroExclusionTest` | Unit | No foundation key in registry | pass | **YES** |
| `CircularDependencyTest` | Unit | No cycles | pass | **YES** |
| `DependencyResolverCascadeTest` | Unit | production → auto inventory+compositions | pass | **YES** |
| `CascadeDisableProtectionTest` | Unit | inventory off while production on → refused | pass | **YES** |
| `DataSafetyDisableTest` | Feature | Capability with rows → refuse disable | pass | **YES** |
| `DisableDoesNotDeleteTest` | Feature | Disable → data intact; re-enable → restored | pass | **YES** |
| `EnsureCapabilityTest` | Feature | Disabled route unreachable by URL | 403/redirect | **YES** |
| `ThreeFailureCodesTest` | Feature | disabled ≠ unentitled ≠ unpermitted | 3 distinct codes | **YES** |
| `EntitlementBypassTest` | Security | Unentitled cannot be enabled | pass | **YES** |
| `TenantConfigIsolationTest` | Security | Tenant A config never leaks to B | pass | **YES** |
| `ExistingTenantBackfillTest` | Migration | Before == after | identical | **YES** |
| `PresetGoldenTest` ×13 | Golden | Preset → working ERP + real sale | 13 pass | **YES** |
| **`ServiceOnlySaleTest`** | Golden | Service sale: revenue posts, no COGS, no stock move, ledger balances | pass | **YES** (blocks presets 11–12) |
| `ValidatorUnknownKeyTest` | Adversarial | Fake key silently dropped | pass | **YES** |
| `ValidatorTierZeroStripTest` | Adversarial | Foundation key stripped | pass | **YES** |
| `ValidatorMalformedJsonTest` | Adversarial | Garbage → preset fallback, no 500 | pass | **YES** |
| `ValidatorOversizeTest` | Adversarial | 10,000 keys → capped at 40 | pass | **YES** |
| `ValidatorInjectionTest` | Adversarial | Injection string → stored as text only | pass | **YES** |
| `AiUnavailableFallbackTest` | Integration | API down → preset picker | pass | **YES** |
| `AiFixtureAccuracyTest` | Integration | 12 descriptions → correct preset | ≥9/12 | NO |
| `ConfigVersionRevertTest` | Feature | Undo restores exact prior state | pass | **YES** |
| `CompositionGeneratorTest` | Composition | 100 random valid configs apply cleanly | 0 exceptions | NO (high value) |
| `TerminologyPropagationTest` | Feature | Rename → nav + titles + CTAs change | pass | NO |

**`CompositionGeneratorTest` is optional but is the single most persuasive proof that VenQore is genuinely configurable** — and it's the demo that impresses a technical investor. Load the registry, generate 100 dependency-valid random configurations, apply each, assert no exceptions and correct nav. Build it if Day 9 buffer survives.

---

# APPENDIX F — WHAT "100% READY" MEANS

See §15. **The one-line version:**

> **VenQore is ready to sell when a stranger can sign up, describe their business in one sentence, see a system they recognise as theirs, edit it, apply it, make a real sale that lands correctly in the ledger — and when every existing customer's system is provably unchanged.**

Everything in this document exists to make that one sentence true.

---

**END OF MASTER MAP**

*Next: read `CAPABILITIES_FILE_GUIDE.md` before touching Appendix A.*
