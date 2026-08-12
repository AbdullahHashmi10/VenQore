> ## ⚠️ PARTIALLY SUPERSEDED — 11 August 2026
> The programme now runs from **`v3/00_MASTER_INDEX.md`** and the numbered set beside it.
> **Superseded here:** the business catalogue (§04 — now `v3/06`), the implementation sequence (§18), MVP scope (§19) and time estimates (§21). Services and field work were not in this document at all.
> **Still authoritative:** §03 asset inventory, §05–§11 configuration/dependency/terminology architecture, §12–§13 Vena and AI cost model, §14 Protocol 7, §15 security, §22 risk register.

# VenQore — Final Implementation Blueprint
## "Build Your Own ERP" + the Vena Intelligence Layer

**Prepared:** 8 August 2026 · **Status:** final planning audit before implementation
**Basis:** direct inspection of `E:\AMD POS\AMD POS` (branch `session2-fixes`, HEAD `2c25b8d9`) and `D:\Protocol Seven`
**Supersedes:** Audit I (`VENQORE_BUSINESS_OS_FORENSIC_AUDIT.md`) and Audit II (`VENQORE_AUDIT_II_BUILD_YOUR_OWN_ERP.md`) wherever they conflict
**Rule applied throughout:** where this document and the repository disagree, the repository wins. Nothing is claimed as implemented unless it was read.

---

# 01 — Executive Verdict

**The strategy is technically sound and commercially correct, and the AI principle you have arrived at is the single most important architectural decision in this document.**

> *Vena understands. VenQore presents. The user decides. The deterministic engines execute.*

That sentence should go into the codebase as a comment at the top of the Vena service, because it is what keeps this product economically viable. Everything below is built around it.

**Four verified facts that determine the whole plan:**

1. **The capability catalogue exists.** `PlanFeatureMatrixSeeder.php` defines **~250 named capability keys in 12 groups**, already labelled and grouped. This is not a thing to invent; it is a thing to promote from a seeder into a table.

2. **Per-tenant configuration exists and is already wired.** `tenant_plan_overrides` (`tenant_id`, `override_key`, `override_value`, `original_value`, `reason`, `applied_by`, `expires_at`, unique on tenant+key) is checked **before** the plan by `PlanRepository::getEffectiveLimit()`, cached 5 minutes, fail-closed, feeding **134 route enforcement points** and **76 in-code `PlanGate::` calls**. You built the composition engine and labelled it a support tool.

3. **The core engines are genuinely decoupled.** `V3/ManufacturingService` (685 lines) imports *one exception class and nothing else*. `V3/SaleService` (805 lines), the same. `V3/InventoryService` imports only `JournalEntry`. Manufacturing does not depend on Sales. The chart of accounts in `TenantDefaultSeeder` is standard accounting, not retail accounting. **A manufacturing-only or ledger-only tenant is architecturally possible today.**

4. **The gap is ~85% frontend.** Navigation is a hard-coded JSX array in a 1,905-line layout where **five of ten top-level items cannot be turned off**; unavailable sub-items render **locked with an upsell badge** instead of hidden; only **12 of ~250** capability keys are referenced anywhere in the React tree; `routes/api.php` has **zero** `plan.feature:` guards.

**Verdict: the engine is ~70% built, the experience ~15%.** The work is real but it is smaller and far less risky than a platform rewrite, because it adds tables and replaces UI rather than touching money.

**The biggest single finding for your "find everything reusable" instruction:** you are not sitting on one ERP. You are sitting on **~250 capabilities, 22 live standalone tools, 20 document generators, 13 core engines, 44 report definitions, 5 role dashboards, 21 industry presets and a build-time theme contract** — and a significant number of them are *generic engines currently wearing retail names*. Renaming them is not cosmetic; it is the cheapest market expansion available to you. §03.3 enumerates them.

**And the one rule that decides whether this succeeds:** never write tenant-specific code. Every customer request becomes either a configuration, or a platform capability everyone gets, or a "not yet." The first `if ($tenant->id === X)` is the end of the strategy.

---

# 02 — Current Architecture (verified)

## 2.1 Scale

| Measure | Count |
|---|---:|
| Models | 142 |
| Controllers | 223 |
| Services | 114 (of which `V3/` = 13 core engines) |
| Migrations | 290 · tables created ~172 |
| `Route::` in `web.php` | 991 (2,040-line file) |
| Route-level `plan.feature:` guards | **134** (39 distinct keys) |
| `PlanGate::` calls in app code | **76** (28 distinct keys) |
| `plan.feature:` guards in `api.php` | **0** ⚠️ |
| Capability keys in seeder | **~250** in 12 groups |
| React pages | 297 · components 108 · **171,285 JSX LOC** |
| Report pages 48 · report routes 72 · `report_*` keys 44 |
| Test files | 254 (suite cannot run reliably in one process — `WHY_359_FAILURES.md`) |
| Themes | 2 built + `_template.js` + build-time contract verifier |
| Industry presets | **21** (`config/industries.php`) |
| Live public tools | **22** in 4 groups (`ToolRegistry`) |

## 2.2 The layer that matters — entitlement resolution, as it actually runs

```
Request
  └─ EnsurePlanFeature middleware  (134 route points)
       └─ PlanGate::check($key)
            └─ PlanRepository::canUseFeature()
                 └─ getEffectiveLimit(tenantId, planSlug, key)
                      ├─ 1. tenant_plan_overrides   ← CHECKED FIRST, cached 300s
                      ├─ 2. plan_limits (DB, seeded)
                      ├─ 3. config/plans.php  (fallback only)
                      └─ 4. null → DENY (fail-closed, per task T2-2)
```

**This is a per-tenant capability resolver with audit trail, expiry and caching.** It is production code. It is the foundation of "Build Your Own ERP" and it already works.

## 2.3 Verified defects that block composition

| # | Defect | Evidence | Severity |
|---|---|---|---|
| D-1 | `featuresFor()` builds the frontend entitlement map by iterating **the plan's** key set. A capability enabled by tenant override but absent from that plan's rows is **allowed by the backend and invisible in the UI**. | `PlanRepository::featuresFor()` — `foreach (self::getLimits($tenant->plan) as $key => $val)` | 🔴 blocks composition entirely |
| D-2 | `routes/api.php` has zero capability guards. | `grep -c 'plan.feature:' routes/api.php` → 0 | 🔴 security |
| D-3 | Five top-level nav items (Sell, Purchase, Stock, Contacts, Money) are unconditional. | `OneGlanceLayout.jsx` `appMenuItems` | 🔴 blocks the product promise |
| D-4 | Unavailable items render `{ label: 'X', locked: true }` — greyed with an upsell badge, not hidden. | same file | 🟠 destroys the "built for me" feeling |
| D-5 | Only ~50 of ~250 keys have any enforcement; the rest are catalogue-only. | 39 route keys + 28 PlanGate keys | 🟠 |
| D-6 | Test suite cannot run in one process (`RefreshDatabaseState::$migrated` set unconditionally after a `migrate:fresh` that may have failed). | `extras/WHY_359_FAILURES.md` | 🔴 prerequisite |
| D-7 | Two live generations of the same services (`InventoryService` / `V3/InventoryService`, `PurchaseService` / `V3/PurchaseService`, `FifoService` ×2). | `app/Services` | 🟠 |
| D-8 | `DashboardController` hard-imports `Sale`, `SaleItem`, `Product`, `Party`, `Account`, `JournalEntry`, `BankAccount`. A non-retail composition gets empty charts everywhere. | file header | 🟠 |
| D-9 | Historical: three report keys used by route middleware were never seeded → fail-closed lockout for **all** plans including Business. Fixed 2026-08-07. | seeder comment | 🔴 proves a CI guard is mandatory |

---

# 03 — Existing Assets: the exhaustive reusable-building-block inventory

*This is the section you asked for: everything in the repository that can stand on its own, be renamed, and be sold or presented separately.*

## 3.1 Core engines — 13 (`app/Services/V3/` + adjacent)

| Engine | LOC | What it actually is, stripped of retail language | Reusable beyond retail? |
|---|---:|---|---|
| `AccountingService` | 350 | Balanced, immutable, reversal-only double-entry journal with mandatory source reference | **Universal** |
| `FifoService` | 302 | Cost-lot consumption in receipt order | Universal for anything with lots |
| `PaymentService` | 193 | Money applied against obligations, with allocation | **Universal** |
| `SettlementService` | 138 | Netting and clearing between parties | Universal |
| `TaxService` | 158 | Rule-driven tax computation, inclusive/exclusive | Universal |
| `PartyService` | 141 | Counterparty identity + materialised balance snapshot | **Universal** |
| `InventoryService` | 346 | Quantity state over a resource at a location | Universal for physical resources |
| `ManufacturingService` | 685 | **Composition engine** — a thing made of other things, consumed on an event | **Universal** (menus, kits, treatment protocols, service packages) |
| `SaleService` | 805 | Outbound value event → ledger + stock + party | Universal (any billable event) |
| `PurchaseService` | 322 | Inbound value event → ledger + stock + party | Universal |
| `UomService` | 77 | Unit conversion | Universal |
| `AuditService` | 42 | Change trail | Platform |
| `FinancialReportingService` | — | **The single source of financial truth** — every report, dashboard and AI answer routes through it | **Universal · protect absolutely** |

## 3.2 Standalone tools already built and publicly live — 22

From `App\Support\ToolRegistry` (4 groups), each backed by its own service in `app/Services/Tools/` and its own public React page:

- **Barcodes & Labels (7):** Barcode Generator · Barcode Validator · Barcode Label Sheet · Text Label Sheet · Price Tag Generator · QR Code Generator · QR Menu Generator
- **Documents (6):** Invoice · Receipt · Purchase Order · Quotation · Packing Slip · Credit Note
- **Inventory & Data (5):** Bulk SKU Generator · Product CSV Cleaner · Stock Count Sheet · Cash Drawer Count Sheet · Inventory Health Toolkit
- **Calculators (4+):** Margin · Food Cost · Payment Fee · POS ROI · Invoice Scanner

**These are already separate things.** They have their own routes, their own lead capture (`ToolLead`, `ToolLeadEvent`, `ToolUsage`), their own budget guard (`PublicToolBudgetGuard`) and their own SEO surface (`ToolSeo`). They are a working example of "present capabilities separately" — you have already proved the pattern works. **Every one of them should also appear as an in-app capability**, which most currently do not.

## 3.3 Generic engines currently wearing retail names — the highest-leverage list in this document

This is the answer to *"we need to define all the modules properly so they can be used somewhere else."* Each row is one engine, its current name, and the businesses it silently already serves.

| Engine (what it does) | Current name | Verified generic shape | Serves, with only a rename |
|---|---|---|---|
| Suspend a working session against a label, resume later | **Parked Sale** (`ParkedSale`) | `cart_data` JSON · `customer_name` · `expires_at` · `user_id`. **Nothing retail-specific.** | Restaurant **table/ticket** · salon **chair session** · workshop **job in progress** · clinic **consultation in progress** · hotel **folio** · pharmacy **held prescription** |
| A thing composed of other things, consumed on an event | **Cookbook / Recipe / BOM** | `recipes`, `recipe_ingredients`, `manufacturing_rules`, 685-line service | Restaurant **dish** · manufacturer **assembly** · salon **treatment package** · clinic **procedure kit** · gym **class plan** · builder **work package** |
| Lot identity with a shelf life | **Batch / Expiry** | `batches`, `product_batches`, expiry dates, FIFO-aware | Pharmacy **drug lot** · food **shelf life** · lab **reagent lot** · chemicals · cosmetics · agri inputs |
| Unique unit identity | **Serial / IMEI** | `product_serials` | Equipment **asset tag** · vehicle **VIN/chassis** · tools · membership **card number** · rental unit ID |
| Repeating obligation billed on a cycle | **Recurring Invoice** | `recurring_invoices` + generator command | Gym **membership** · rent · **tuition fee** · maintenance contract · retainer · SaaS-style service plan |
| Presence record with lateness rules | **Staff Attendance** | `staff_attendances`, `staff_daily_summaries`, `staff_activity_gaps`, approve/reject gap flow | **Student attendance** · gym **member check-in** · visitor log · shift roster · site sign-in |
| A place that holds quantities | **Warehouse** | `warehouses`, transfers, per-location stock | **Branch** · clinic **room** · kitchen · site store · studio · vehicle (van stock) |
| Any counterparty with a running balance | **Customer / Supplier** | `parties` + `party_snapshots`; `customers`/`suppliers` both carry `party_id` | **Patient · student · member · tenant · client · donor · applicant · vendor** |
| Moving quantity between places | **Stock Transfer** | `stock_transfers`, `stock_transfer_items` | Equipment **dispatch** · asset movement · inter-branch supply |
| Negotiated artefact → commitment → bill | **Quotation → Sales Order → Invoice** | 3 table families + converters | Estimate → **job** → bill · proposal → contract → fee note · treatment plan → course → invoice |
| An ad-hoc priced line that is not a product | **Custom Charge** | `custom_charges` | Service fee · delivery · facility fee · **consultation fee** · late fee |
| Prepaid value held against a party | **Gift Card / Store Credit** | `gift_cards`, `store_credits`, `store_credit_balances` | **Class pack** · prepaid treatment course · deposit · advance · wallet |
| Earned status against activity | **Loyalty Points** | `loyalty_points`, `loyalty_balances` | Membership tier · rewards · **student credits** |
| One thing sold in several forms | **Product Variant** | `product_variants`, `variant_attributes` | Service **tier** · room **type** · class **level** · package size |
| A published, scannable catalogue | **QR Menu** | `qr_menus` + generator | Service **menu** · price list · **treatment list** · course catalogue |
| A work instruction issued to a station | **Kitchen Order (KOT)** | `kitchen_orders` | **Work order** · job ticket · lab request · prescription fill · repair docket |
| A physical position that can be occupied | **Restaurant Table** | `restaurant_tables` | Salon **chair** · clinic **room** · gym **court** · workshop **bay** · coworking **desk** — **and note this duplicates Parked Sale (see §03.5)** |
| Landed cost spread across received items | **Landing Cost** | in `PurchaseService` | Import duty · freight · **project overhead allocation** |
| Physical count vs system count | **Stock Take** | `stock_takes`, `stock_take_items` | **Asset audit** · equipment inventory · cash count |
| Deterministic business signals with graded accuracy | **Growth Engine** | 4 brains + `InsightCatalog` + `ThresholdTuner` + `OutcomeEvaluator` | **Any** business intelligence surface — the brains are retail-worded, the machinery is not |
| Photograph → structured transaction, with a learning loop | **SmartCapture** | 8 services, alias book, supplier-code map | Any inbound document: **prescription · lab report · delivery note · timesheet · expense claim** |
| Pluggable external channel | **VenSynQ** | `PlatformRegistry` + `PlatformClient` interface + 5 clients | Any integration family — booking channels, payment rails, government portals |

**Read the right-hand column again.** Without writing a new engine, the objects you already own describe a pharmacy, a gym, a salon, a clinic, a school, a workshop, a rental firm and a coworking space. **What is missing is not capability. It is naming, navigation and scheduling.**

## 3.4 Other reusable assets

- **Theme engine** — `resources/js/theme/`: a build-time **contract** (`contract.js`) with palette ramps + semantic tokens, a `_template.js`, a generator and a **parity verifier** that fails the build on a malformed theme. Two themes shipped (`midnight-nebula`, `daylight-calm`). This is a genuinely well-designed subsystem and it is exactly what §10 needs.
- **Search index pattern** — `product_search_index`: `name_norm`, `name_soundex`, `name_metaphone`, `tokens` + `FULLTEXT`. **This is the template for capability search** (§13) and it is proven in production.
- **Answer cache pattern** — `visitor_chat_cached_answers` (`store_id`, `question_hash`, `answer`, `hits`, unique). Directly reusable for Vena.
- **AI grounding** — `AiController::executeFunction`: 8 permission-checked tools, all figures via `FinancialReportingService`. Plus `config/ai_intents.php`: 5 zero-cost SQL intents.
- **AI economics** — `ai_usage_events`, `ai_rate_buckets`, `ai_spend_counters`, `config/ai_pricing.php`, `AiSpendGuard`, `AiRateLimiter`, per-feature model routing in `config/ai_models.php` with a deprecation fallback map.
- **Role dashboards** — `Pages/Dashboards/{Accountant,Cashier,Purchasing,Viewer}.jsx` + `Admin/ExecutiveDashboard.jsx`. Five role surfaces already exist.
- **Industry presets** — 21 in `config/industries.php` with categories, units, product attributes and two behaviour flags.
- **Import/mapping** — `DataImportService`, `ImportMappingController` (upload → map → validate → process).
- **Multi-store** — `Hub`, `TenantCloner`, `SubdomainGenerator`.
- **Offline** — Dexie `LocalDB.js` (12 stores) + `SyncService.js`.

## 3.5 Duplication to resolve while normalising (do not skip this)

| # | Duplication | Resolution |
|---|---|---|
| DUP-1 | `restaurant_tables` **and** `ParkedSale` model the same thing (an occupied position holding an open ticket) | Make **Occupancy** one capability: a labelled, resumable session against an optional position. Restaurant tables become a *configuration* of it. **Do this before adding salon chairs or clinic rooms, or you will build a third copy.** |
| DUP-2 | 6 document families (`quotations`, `proposals`, `sales_orders`, `invoices`, `sales`, `debit_notes` + purchase equivalents) | Keep `sales`/`purchases` where they are (they carry FIFO + ledger wiring). New document types go on a shared Document capability. |
| DUP-3 | 20 `Tools/*Service` PDF generators | One Document Engine with templates. Highest-ROI refactor in the repo. |
| DUP-4 | 5 notification mechanisms | One Communication capability: rule → audience → channel → template → delivery record. |
| DUP-5 | `payment_allocations` **and** `transaction_allocations` | One allocation table. `CLAUDE.md` already warns about a bug caused by this. |
| DUP-6 | 6 activity/audit tables | One activity capability with a source discriminator. |
| DUP-7 | `customers`, `suppliers`, `employees` outside/around `parties` | Party + role. The `party_id` columns show the right model was already understood. |
| DUP-8 | Two service generations (`V3/` vs legacy) | **Delete the legacy generation first.** You cannot normalise a service that exists twice. |
| DUP-9 | 5 frontend entitlement-display components / 2 prop namespaces | One `<Capability>` component, one namespace. Partly done at HEAD. |
| DUP-10 | Dead `transactions` table + 19-line `Transaction` model (one write site, `WooCommerceController:209`) | Retire. `CLAUDE.md` describes it as the core model; it is not. |

---

# 04 — The business catalogue: how many businesses can we actually serve?

Derived from §03.3, not invented. A business is "serveable" when every capability on its must-have list either exists or is a rename of something that exists.

## Tier A — Serveable today. **0 new engines.** Needs only composition + naming.

**Retail & trade (already named in `config/industries.php`, 21 presets):**
grocery/karyana · supermarket · apparel · electronics · hardware · auto parts · furniture · cosmetics · sports goods · toys · optical · pet shop · jewellery · bookstore · stationery · mobile accessories · computer shop · paint · tyre shop · building materials · agri inputs · general store

**Food:** restaurant · café · bakery · sweet shop · juice bar · cloud kitchen · caterer *(all covered by Recipes + Occupancy + KOT + POS)*

**Regulated retail:** pharmacy *(Batch + Expiry + Serial + FBR — all present)*

**B2B:** wholesale · distribution · van/route sales *(Quotation→SO→Invoice, khata, ageing, multi-warehouse, landing cost — all present)*

**≈ 30 business types, sellable this quarter.**

## Tier B — Needs one small addition: **Job / Work Order** (a KOT generalised, ~10–15 days)

mobile repair · auto workshop · appliance repair · tailoring · printing press · laundry & dry cleaning · furniture making · small manufacturing · food processing · solar installation · IT services & AMC

**≈ 11 more.**

## Tier C — Needs the **Scheduling + Non-stock Resource + Period** family (~52–73 days, one build)

gym & fitness studio · salon · barber · spa · clinic · dental · physiotherapy · diagnostic lab · veterinary · tuition centre / academy · driving school · equipment rental · car rental · event rental · photography studio · coworking space

**≈ 16 more — and they all unlock from the same single build.**

## Tier D — Needs **Relationship (projects) + Work engine** (~30–40 days on top of C)

construction · interior design · engineering consultancy · marketing agency · law firm · accounting practice · property management

**≈ 7 more.**

## Tier E — Hardest. Needs C + D + rate calendars + channel integration.

hotel · guest house · travel agency

**≈ 3 more.**

## Summary

| Tier | Businesses | New engines | Cumulative |
|---|---:|---|---:|
| **A — now** | ~30 | none | **30** |
| **B — +Work Order** | 11 | 1 small | 41 |
| **C — +Scheduling/Resource/Period** | 16 | 1 family | **57** |
| **D — +Projects** | 7 | 1 family | 64 |
| **E — +Booking** | 3 | integration | **67** |

**Two conclusions to act on:**

1. **You can honestly address ~30 business types today.** Not "someday" — today, with composition and naming. That is a bigger claim than "we're a retail POS" and it costs no new engine.
2. **Scheduling is the single highest-leverage build in the company.** One engine family moves 16 businesses from impossible to serveable. Nothing else on the roadmap has that ratio. **Hotel is the worst possible early target** — it sits behind three engine families.

---

# 05 — Configuration Architecture

## 5.1 Principle

> **Reuse before rebuild.** Do not create a parallel configuration system. `tenant_plan_overrides` already resolves per-tenant capability state, is cached, audited and fail-closed. Extend it; do not replace it.

## 5.2 What to add — three tables, nothing more

```sql
-- 1. The capability registry (promoted from PlanFeatureMatrixSeeder)
capabilities
  key            varchar(64) PK      -- 'batch_tracking'  (identical to today's keys)
  group_key      varchar(32)         -- 12 existing groups
  label          varchar(120)        -- default English name
  description    text
  icon           varchar(48)
  kind           enum('capability','limit','marketing')  -- ~250 keys are not all composable
  is_composable  bool                -- user may toggle
  requires       json                -- ['products','inventory']
  conflicts      json
  provides_nav   json                -- nav node descriptors
  provides_cards json                -- dashboard widget keys
  provides_terms json                -- terminology slots this capability owns
  min_plan       varchar(24) null
  status         enum('live','beta','soon')
  sort_order     int

-- 2. Search index for Vena — mirrors the proven product_search_index pattern
capability_search_index
  capability_key varchar(64) PK
  name_norm      varchar(191)
  aliases        text          -- 'stock, goods, items, godown, warehouse stock'
  tokens         text          -- FULLTEXT
  embedding      blob null     -- 256 floats, optional, see §13
  FULLTEXT(tokens)

-- 3. Terminology (see §11)
tenant_terminology
  tenant_id, term_key, singular, plural, updated_by
  PRIMARY KEY (tenant_id, term_key)
```

**Configuration state itself reuses `tenant_plan_overrides`.** No new state table. `override_key` = capability key, `override_value` = `'1'`/`'0'`. You get audit (`applied_by`, `reason`, `original_value`), expiry, and the existing cache for free.

## 5.3 What to fix — three defects, precisely

| Fix | Change | Why |
|---|---|---|
| **F-1 (D-1)** | `PlanRepository::featuresFor()` must iterate the **`capabilities` table**, not `getLimits($tenant->plan)` | Today an overridden-on capability outside the plan's key set is allowed by the backend and invisible in the UI. This alone breaks composition. |
| **F-2 (D-2)** | Add `plan.feature:` guards to `routes/api.php` | Zero today. A hidden capability must be genuinely unreachable. |
| **F-3 (D-5)** | Wire the ~40 composable keys that currently have no enforcement point | A toggle that changes nothing is worse than no toggle |

## 5.4 Resolution order (unchanged from today — this is the point)

```
capability_state(tenant, key) =
   1. tenant_plan_overrides           ← user's own composition
   2. plan_limits                     ← what the plan permits at all
   3. config/plans.php                ← last-resort fallback
   4. deny                            ← fail closed
```

The **plan** answers *may they have it*. The **override** answers *did they choose it*. A capability is active only when both say yes. That distinction is what lets you keep exactly one capability wall (the ledger) while everything else composes freely.

---

# 06 — Dependency Architecture

## 6.1 The graph, derived from actual code coupling

Verified by reading imports and schema, not assumed:

```
double_entry_ledger ──┬── expense_manager
                      ├── customer_khata ── aged_receivables ── customer_statements
                      ├── supplier_khata ── aged_payables
                      ├── bank_reconciliation
                      └── report_profit_loss / trial_balance / cash_flow

products ─────┬── inventory ──┬── fifo_costing ── (ledger)
              │               ├── batch_tracking ── batch_expiry
              │               ├── imei_lifecycle
              │               ├── locations ── stock_transfer
              │               └── stock_take_audit
              ├── product_variants
              ├── bill_of_materials ── production ── auto_assembly_logic
              └── barcode_label_factory

parties ──────┬── customers ── loyalty_points / customer_wallet / digital_gift_cards
              ├── suppliers ── purchase_orders ── landing_costs
              └── employees ── staff_attendance ── staff_summaries

pos ──────────┬── park_recall (Occupancy)
              ├── split_payments / auto_cash_rounding / daily_cash_audit
              └── silent_webusb_printing
```

**Three rules that fall out of the graph:**

1. **`parties` and the ledger are near-universal roots.** Almost nothing composes without one of them. Treat them as always-on for any tenant above the Counter wall.
2. **`products` is *not* a root.** A services business needs `parties` + ledger + documents and no products at all. Today the code assumes products in several places (`DashboardController`, `TenantDefaultSeeder` seeds a warehouse unconditionally). This must be relaxed — it is the single most important decoupling for Tier C/D businesses.
3. **Dependencies are one-directional and shallow** — max depth 4. **A full graph engine is over-engineering.** A recursive `requires` resolve over ~250 rows in PHP, memoised, is correct and takes an afternoon.

## 6.2 Behaviour

- **Enable:** resolve `requires` transitively, present the full set (*"Enabling Production will also enable Bill of Materials, Inventory and Products"*), apply as one transaction.
- **Disable:** find dependents; if any are active, block and explain (*"Inventory is used by Batch Tracking and Production. Disable those first, or disable all three together."*). Offer "disable all three."
- **Never delete data.** Reuse the existing downgrade policy verbatim: hide, never delete; block the change if open balances exist; 30-day grace; banner explaining what is archived.
- **Validate at write time**, in the service, not in the UI. The UI shows consequences; the service enforces them.

---

# 07 — Template System

Templates are **configuration bundles**, not applications. `config/industries.php` already holds 21 presets with categories, units, attributes and behaviour flags — extend that file's shape rather than inventing a new one.

```php
'Bakery' => [
    'group' => 'Food & Beverage',
    'type'  => 'Bakery & Confectionery',
    'capabilities' => [
        'required'    => ['pos','products','inventory','parties','double_entry_ledger'],
        'recommended' => ['bill_of_materials','production','purchase_orders','expense_manager',
                          'staff_attendance','customer_khata','batch_expiry','park_recall'],
        'optional'    => ['woocommerce','loyalty_points','marketing_campaigns','qr_menu'],
        'excluded'    => ['imei_lifecycle','b2b_proposal_builder'],
    ],
    'terminology' => ['product' => 'Item', 'park_recall' => 'Custom Orders'],
    'dashboard'   => ['todays_sales','production_today','low_ingredient_stock','receivables','expenses'],
    'theme'       => 'daylight-calm',
    'categories'  => [...],   // already exists
    'units'       => [...],   // already exists
    'attributes'  => [...],   // already exists
],
```

**Rules:**
- A template **never** introduces a capability that is not in the registry. If a template needs something new, the capability is built first, for everyone.
- Templates are editable at every step — they are a starting point, never a lock-in.
- **"Build from scratch"** is always present, grouped by the 12 existing capability groups with search and dependency hints. Do not show ~250 checkboxes flat.
- **Do not chase template count.** Ship 8–10 excellent ones (Retail, Supermarket, Restaurant, Café, Bakery, Pharmacy, Wholesale, Workshop/Manufacturing, Services, Custom). `industry_templates_count` already exists as a plan key — it becomes a real number.

---

# 08 — Dynamic Navigation

**The single biggest UI change, and the one that makes the product promise true.**

## 8.1 From

A hard-coded `appMenuItems` JSX array in `OneGlanceLayout.jsx` (1,905 lines): 10 top-level items, five unconditional, sub-items rendered `locked` with an upsell badge, plus a hard-coded `MENU_PERMISSIONS` map.

## 8.2 To

```
navigation = f(active capabilities, dependencies, user permissions, terminology, role)
```

Each capability declares its nav contribution in `capabilities.provides_nav`:

```json
{ "parent": "stock", "label_term": "batch_tracking",
  "route": "store.batch-tracking.index", "sort": 30 }
```

The layout renders parents that have at least one visible child. **A capability that is off contributes nothing — no node, no badge, no lock.**

## 8.3 Hide vs lock — the rule that makes it feel bespoke

| Situation | Behaviour |
|---|---|
| Capability **not chosen** by the tenant | **Hidden.** No trace. |
| Capability **not permitted** by the user's role | **Hidden.** |
| Capability **above the plan** and never had | Hidden from nav; discoverable **only** in Settings → My ERP → *"Available on higher plans"* |
| **Capacity limit** reached (SKUs, seats, locations) | **Locked** with an explanation — this is the only legitimate lock |
| Capability **was on**, plan downgraded | Hidden + one-time notice + archived-data banner (existing downgrade policy) |

**Locks belong to capacity, never to capabilities the customer chose not to have.** This one rule is the difference between "my ERP" and "a demo of someone else's ERP."

## 8.4 Constraint

**Top-level items must be capped and stable.** Ten is already one too many (`Home` and `Dashboard` are the same idea). Target the nine from the mockups — Home · People · Work · Resources · Money · Documents · Calendar · Reports · Automations — or keep today's verbs. Either way, **enforce the cap in the registry schema**: `provides_nav.parent` must reference an existing parent. Make a tenth top-level item structurally impossible. This is what stops you rebuilding the 47-module ERP you are escaping.

---

# 09 — Dashboard Composition

## 9.1 What exists

`Dashboard.jsx` (409 lines, `DualStatCard`), `Admin/ExecutiveDashboard.jsx`, four role dashboards, `DashboardController` (805 lines) returning ~60 named data keys — **that key list is your widget catalogue, already computed**. `dashboard_layouts` does **not** exist (verified). `react-grid-layout` is in `package.json` but unused.

## 9.2 Build

```sql
dashboard_layouts
  id, tenant_id, user_id, dashboard_key, layout_json, created_at, updated_at
  UNIQUE (tenant_id, user_id, dashboard_key)
```

`layout_json` = `[{ widget_key, x, y, w, h }]`. One JSON blob; **do not normalise per-widget** (and note MariaDB 10.5 has no `JSON_TABLE` — never query inside it).

**Widget registry** lives in `capabilities.provides_cards`, so a widget can only be offered if its capability is active. Grid: **12-column snapping at 3/6/9/12 wide, 1–2 rows** (from the mockups — better than free resize, and no layout can look broken). Two pinned, non-removable widgets: the hero metric and **"Needs you today."**

**"Needs you today" is the most valuable widget you can build**, and it needs no new data: it is the Growth Engine's existing signals plus overdue invoices, low stock and pending approvals, given a face.

**Degradation:** if a capability is disabled, its widgets drop out of the saved layout silently, notified once. `DashboardController` must be split per widget so one missing data source cannot break the page (fixes D-8).

---

# 10 — Theme System

**Do not build a second styling system.** `resources/js/theme/` already has a build-time contract with palette ramps + semantic tokens, a template, a generator and a parity verifier that fails the build on a malformed theme. This is well-designed. Use it.

**Ship 5 curated themes** by adding files to `theme/themes/`:

| Theme | Character | Base |
|---|---|---|
| **Midnight** | Dark, technical | `midnight-nebula` ✅ exists |
| **Daylight** | Light, calm, professional | `daylight-calm` ✅ exists |
| **Classic** | High-contrast, dense, print-like — for accountants and older users | new |
| **Colour** | Warm, friendly — cafés, salons, retail | new |
| **Minimal** | Near-monochrome, low ornament | new |

**Custom theme creator — deliberately narrow:** primary colour · accent · light/dark preference · density (comfortable/compact) · corner radius. **That is all.** Every one of these maps onto an existing token; none requires new architecture. Business owners are not designers, and an unconstrained colour editor produces unreadable UIs and support tickets.

**Cost: ~8–12 days for three themes + a 5-control picker.** This is a **SHOULD HAVE**, not a MUST — it must not delay the capability layer.

---

# 11 — Terminology System

**Your Parked Sale example is exactly right, and the code proves it.**

`ParkedSale` is `cart_data` (JSON) + `customer_name` + `expires_at` + `user_id`. There is nothing retail about it. For a restaurant, `customer_name` **is** the table. The only thing making it "a parked sale" is the strings in the UI.

**And `restaurant_tables` exists as a separate table — you already built the second copy.** Resolve DUP-1 before adding salon chairs, or you will build a third.

## 11.1 Architecture — the smallest that works

```php
// One table
tenant_terminology (tenant_id, term_key, singular, plural)

// One helper, resolved once per request into an Inertia shared prop
term('customer')        // → "Patient"
term('customer', 2)     // → "Patients"
term('park_recall')     // → "Table Management"
```

**Never rename anything in the database.** Table names, column names, model names, route names and capability keys stay in canonical English forever. Terminology is a **render-time lookup only**. This is what keeps the ledger, the tests and the API stable while the UI speaks 30 different vocabularies.

## 11.2 Scope — measured, not guessed

| Noun | Occurrences in `Pages` + `Components` + `Layouts` |
|---|---:|
| Product | 339 |
| Customer | 283 |
| Invoice | 266 |
| Sale | 222 |
| Purchase | 206 |
| Supplier | 134 |
| Party | 119 |
| Warehouse | 99 |
| Expense | 75 |
| Staff | 74 |
| **Total (11 core nouns)** | **~1,817** across 171,285 JSX lines |

**Do not convert all 1,817.** Convert, in this order: **navigation → page titles → table column headers → primary buttons → empty states.** That is roughly 400–500 sites and delivers ~80% of the perceived effect. The remaining body copy converts opportunistically, forever.

## 11.3 Term keys — start with ~25

`customer · supplier · party · product · category · variant · warehouse · stock · sale · invoice · quotation · purchase · purchase_order · expense · payment · staff · attendance · recipe · production · batch · serial · park_recall · table · report · dashboard`

Each capability declares which terms it owns (`capabilities.provides_terms`), so enabling a capability brings its vocabulary with it. Templates ship a default term set; the user can edit any of them; **Vena may suggest terminology but never applies it silently.**

## 11.4 Worked example — one engine, five businesses, zero new code

| Canonical | Retail | Restaurant | Salon | Clinic | Workshop |
|---|---|---|---|---|---|
| `park_recall` | Parked Sale | **Table / Ticket** | **Chair Session** | **Consultation** | **Open Job** |
| `party` | Customer | Guest | Client | Patient | Customer |
| `product` | Product | Dish | Service | Item | Part |
| `recipe` | Recipe | Menu Recipe | Treatment Pack | Procedure Kit | Assembly |
| `warehouse` | Warehouse | Store/Kitchen | Salon | Room | Bay |
| `staff_attendance` | Staff Attendance | Shift | Roster | Duty | Timesheet |
| `stock_take` | Stock Take | Inventory Count | Product Audit | Supply Audit | Tool Audit |

---

# 12 — Vena AI Architecture

## 12.1 The boundary, stated as law

> **Vena understands intent and finds capabilities. Vena never operates the ERP, never computes a number, and never changes configuration without an explicit user action.**

| Vena does | Vena never does |
|---|---|
| Interpret a business description | Create a sale, purchase, product or payment |
| Map natural language → capability keys | Calculate profit, tax, COGS, FIFO or balances |
| Recommend a composition | Post a journal entry |
| Explain what a capability does and depends on | Enable/disable a capability autonomously |
| Answer "do we have X?" / "where is Y?" | Change permissions, roles or accounting settings |
| Suggest dashboard cards and terminology | Modify or delete business data |
| Preview the effect of a change | Be required for any routine operation |

## 12.2 Three levels

**Level 1 — Understand.** Free text → structured intent (`business_type`, `sells_physical_goods`, `manufactures`, `takes_appointments`, `sells_on_credit`, `staff_count`, `locations`). Bounded output, small model, JSON schema enforced.

**Level 2 — Recommend.** Intent → capability set, via the registry + dependency resolver. **Mostly deterministic:** intent flags map to capability groups by rules; the LLM contributes only ranking and the explanation sentence. Output is *proposed*, always editable, never applied.

**Level 3 — Assist.** "Do we track expired medicines?" → resolve to `batch_expiry`, report state (active / available / needs plan), explain dependencies and consequences, offer **[Enable]** — a button the user presses. Also handles "where is X?" navigation.

## 12.3 Grounding — reuse what exists

`AiController::executeFunction` already routes every figure through `FinancialReportingService` with permission checks. Extend that harness with **read-only** capability tools (`search_capabilities`, `get_capability`, `get_tenant_composition`, `preview_change`) and exactly **one** write tool (`propose_composition`) which writes a *proposal*, never state. Application is a normal authenticated POST from the approval screen — the same deterministic path the manual toggle uses. **There must be exactly one code path that changes composition.**

## 12.4 Vena must be optional

```
Vena down → capability browser works → onboarding via template works → ERP works
```

Every Vena action has a manual equivalent: **Settings → My ERP → Capabilities** (grouped, searchable, dependency-aware). Vena is a faster route to the same screen, never the only route. Circuit-break on provider failure and fall through to search results with a quiet notice.

---

# 13 — AI Cost Architecture

## 13.1 Four-tier router — cheapest tier that can answer, wins

| Tier | Handles | Technique | Cost/req |
|---|---|---|---|
| **0 — Exact / alias** | "stock", "inventory", "godown", "khata", "attendance" | SQL lookup on `capability_search_index.aliases` | **$0** |
| **1 — Lexical** | "can I track expired medicines", "who owes me money" | `FULLTEXT` + soundex + metaphone — **exactly the `product_search_index` pattern already in production** | **$0** |
| **2 — Semantic** | "I want to know which staff are slacking" | Embed the query (1 small call ≈ **$0.00001**), cosine against ~250 pre-computed capability embeddings **in PHP** | **~$0.00001** |
| **3 — Reasoning** | "I run a bakery with 5 staff, custom orders, 3 suppliers" → full composition | One structured LLM call, JSON-schema output | **~$0.002–0.005** |

**Tier 3 fires roughly 1–3 times in a tenant's entire lifetime** (onboarding, plus the occasional "we've started doing X"). Tiers 0–2 handle everything else.

## 13.2 No vector database. This is important.

MariaDB 10.5 has no `VECTOR` type (documented in `CLAUDE.md`; not available until 11.7). You do **not** need one.

There are ~250 capabilities. Store each embedding as a 256-float `BLOB` on `capability_search_index`, load them once into APCu/the database cache, and compute cosine similarity in PHP. **250 × 256 multiply-adds is microseconds.** Embeddings are computed **once at deploy time**, not per tenant — the capability set is global.

> Adding Pinecone/Qdrant/pgvector here would be textbook over-engineering: new infrastructure, new failure mode, new cost, for a 250-row similarity search. **Do not.**

## 13.3 Caching — reuse the proven pattern

`visitor_chat_cached_answers` (`store_id`, `question_hash`, `answer`, `hits`, unique) already exists. Generalise it to `ai_cached_answers` with a `scope` column. Capability questions are **globally cacheable** (the answer to "do you support batch tracking" is tenant-independent) — so cache hit rates should be very high across the tenant base, not just within one.

## 13.4 Metering — already built, extend by two columns

`ai_usage_events` + `AiUsageRecorder` + `config/ai_pricing.php` + `AiSpendGuard` + `AiRateLimiter` all exist. Add: `tier_used` (0–3) and `cache_hit` (bool). That gives you the one dashboard that matters:

> *"What % of Vena requests were answered for free?"* — **target ≥ 90%.**

## 13.5 Budget, expressed as an engineering rule rather than a promise

Do not commit publicly to "$0.50 per customer." Commit internally to:

> **AI cost per tenant per month, excluding SmartCapture, must stay under 1% of that tenant's subscription revenue, and must be observable daily.**

Modelled against this architecture: onboarding ≈ $0.005 once; discovery queries ≈ $0.00001 each with high cache hit; assistant answers via `ai_intents` SQL router ≈ $0. **A $18/month tenant should cost well under $0.05/month in Vena.** SmartCapture is separate, genuinely variable, and already metered and capped — keep it that way.

## 13.6 Model strategy

Keep `config/ai_models.php` per-feature routing (it already carries a deprecation fallback map for the 16 Oct 2026 model retirement). Add three keys: `capability_embed` (cheapest embedding model), `capability_resolve` (small/fast), `onboarding_compose` (the one place a stronger model earns its cost). Keep the provider abstraction — you already have Gemini/OpenAI/Anthropic/DeepSeek paths.

---

# 14 — Protocol 7

## 14.1 What it verifiably is

Node 22 / Express 5 / Sequelize / MySQL / Socket.io / Stripe **and** Lemon Squeezy / React (Vite, ~35k LOC) / Flutter (63 Dart files). Server ~6,600 LOC: 26 models, 12 route files, 3 cron jobs, 2 middleware. **No migrations. No tests.** Its own July 2026 strategic audit scores it **4.9/10** overall (security 3.5, code quality 4, monetisation 3), with "team product you can charge companies for" at **35–40%**, and data split across three sources of truth (relational tables, JSON blobs on the user row, browser localStorage).

## 14.2 What it contains that VenQore does not

| P7 concept | Model evidence | VenQore equivalent |
|---|---|---|
| **Active Focus** — what a member is working on right now | `TeamMember.activeTaskId` | ❌ none |
| **Blocked signalling** — raise a hand with a reason | `TeamMember.isBlocked`, `blockedReason` | ❌ none |
| **Proof of completion** — photo required to close a task | `TeamTask.requiresProof` + upload | ❌ none |
| **Asset checkout** — who has which thing | `TeamAsset`, `AssetCheckout` | ❌ none *(and this is the only asset-assignment model in either codebase)* |
| Attendance with lateness | `Attendance.isLate`, `lateByMinutes`, unique (user, team, date) | ✅ `staff_attendances`, `staff_activity_gaps`, `staff_daily_summaries` — **VenQore's is better** |
| Tasks / milestones | `TeamTask`, `TeamMilestone` | ❌ none |
| Habits / protocols / time blocks | `Habit`, `Protocol`, `TimeBlock` | consumer-only, **not applicable** |

## 14.3 Verdict — extract the concepts, discard the code

**Do not merge.** Different language, framework, ORM, database, auth, tenancy model (teams, not tenants) and billing. No migrations, no tests. Integration and hardening cost far exceeds native rebuild cost.

**Build a `workforce_execution` capability family natively in Laravel**, on top of the staff tables that already exist:

```
workforce_execution        (parent)
 ├── staff_tasks           assign work, due dates, states
 ├── task_proof            photo/document required to close   ← P7's best idea
 ├── active_focus          what each person is on right now   ← P7's killer feature
 ├── blocked_status        raise a hand + reason              ← P7's killer feature
 └── asset_assignment      checkout/return of equipment       ← unlocks Tier C rentals too
```

**Estimated 15–25 days**, versus 4–6 months to integrate and harden P7. It reuses `staff_attendances`, `staff_invitations`, `tenant_users`, roles, and the existing mobile PWA surface.

**Commercially this is where the "workforce seat" earns its price** (Audit I, Part II §P6): a construction firm becomes 5 operator seats + 25 cheap workforce seats. It is also a Tier B/D unlock. **Protocol 7's real value to VenQore is as a specification document, not a dependency.** Freeze the P7 codebase; keep or retire it as a separate consumer product; stop investing engineering attention in it.

---

# 15 — Security

**A hidden capability must be genuinely unreachable. UI hiding is presentation, never enforcement.**

Enforcement checklist per composable capability — all must pass before it is offered:

| Surface | Requirement | Status today |
|---|---|---|
| Web routes | `plan.feature:{key}` middleware | 🟡 134 points / 39 keys — extend to ~80 |
| **API routes** | same | 🔴 **zero — must fix** |
| Controller actions | `PlanGate::enforce()` on state-changing methods | 🟡 76 calls / 28 keys |
| Direct URL access | route middleware covers it, provided the route is guarded | 🟡 follows the above |
| Jobs & commands | guard at dispatch **and** at handle (a queued job outlives a downgrade) | ❌ not present |
| Exports | `data.export` permission **and** the source capability | 🟡 |
| Reports | `ReportTierGate` + capability | ✅ mostly |
| Webhooks (Woo/LS/marketplaces) | capability check before processing inbound payloads | 🟡 |
| Tenant isolation | `HasTenant` on all three new tables | must be enforced by construction |
| Frontend | hiding only — **never** the enforcement point | ✅ by design |

**Two mandatory CI guards** (D-9 proved the need — three report keys reached route middleware without being seeded and fail-closed-locked *every* plan including Business):

1. Every `plan.feature:{key}` in `routes/*.php` must exist in the `capabilities` table.
2. Every `capabilities` row with `is_composable = true` must have ≥1 enforcement point (route middleware or `PlanGate::` call).

---

# 16 — Existing Tenant Migration

**Nothing breaks, because existing behaviour is the default.**

```
Existing tenant
   └─ has plan P, no rows in tenant_plan_overrides
        └─ resolution falls through to plan_limits  ← today's exact behaviour
             └─ nav renders every capability their plan allows
                  └─ IDENTICAL to what they see now
```

The migration is a **backfill of zero rows**. A tenant only acquires a composition when they choose one.

**Phased rollout:**

| Phase | Who | What they see |
|---|---|---|
| 1 | All existing tenants | No change whatsoever. Registry + resolver live behind the scenes. |
| 2 | New signups only | Composition onboarding. Existing tenants unaffected. |
| 3 | All tenants | **Settings → My ERP** appears with everything already ticked. Opt-in banner: *"Tidy up your VenQore — hide what you don't use."* |
| 4 | Opt-in | Terminology, themes, dashboard layouts |
| 5 | Opt-in | Vena discovery |

**Safety rules:** disabling never deletes; the existing downgrade policy applies unchanged (hide, block on open balances, 30-day grace, archived-data banner); **one-click restore** of the full composition; a tenant that has never opened the composition screen is treated as "everything on" forever.

**A composition is not a plan change.** Hiding Manufacturing must not alter billing. Keep the two concepts separate in code or you will create refund disputes.

---

# 17 — Testing

Fix the harness first: `RefreshDatabaseState::$migrated` is set unconditionally after `$this->artisan('migrate:fresh')` regardless of exit code, so a failed migration mid-suite poisons every subsequent test (359 failures, `WHY_359_FAILURES.md`). **Until the full suite runs green in one process, composition cannot be shipped safely.** 10–14 days. Non-negotiable, first.

**Then — do not attempt to test compositions combinatorially.** ~250 capabilities is infinite. Test three things instead:

**1. Capability boundary tests** (one small test per composable capability, ~80 tests)
- enabled → route reachable, nav node present, widget offered
- disabled → route **403**, nav node absent, widget not offered, API 403
- `requires` unmet → enable is refused with a clear reason
- dependents active → disable is refused with a clear reason

**2. Named reference compositions** (6–8 only — the full existing suite runs against each)

`Retail` · `Restaurant` · `Wholesale` · `Workshop/Manufacturing` · `Pharmacy` · `Books-only (ledger, no products)` · `Services (no inventory)` · `Everything-on (regression baseline for existing tenants)`

Anything outside these is *supported but not certified* — say so internally, and add a reference composition whenever a real customer's shape recurs.

**3. Vena tests — no live LLM calls in CI**
- Tier 0/1/2 resolution correctness on a fixed alias/query corpus (deterministic, free)
- **Hallucination guard:** Vena must never return a capability key absent from the registry — assert against the registry, not against the model
- Unsupported request → honest *"we don't have that yet"* (this is the highest-risk behaviour)
- Ambiguity → clarifying question, not a guess
- Vena unavailable → manual browser and ERP fully functional
- Cost regression: assert ≥90% of a fixed corpus resolves at tier ≤2

**4. Existing estate** — the Golden suite (ledger truth, FIFO determinism, cross-surface consistency) must stay green throughout. **Add a CI rule: any diff touching `app/Services/V3/Accounting*`, `Fifo*`, `Payment*` or `Settlement*` requires a full Golden run.**

---

# 18 — Implementation Sequence

Derived from actual coupling, not from a generic backend→frontend→AI split.

```
0  SAFETY            test harness · delete legacy service generation · CI key guard · API guards
        ↓
1  NORMALISE         capabilities table (promote ~250 keys) · classify composable vs limit vs marketing
        ↓            resolve DUP-1 (Occupancy) · retire dead transactions table
        ↓
2  RESOLVE           fix featuresFor() (D-1) · dependency resolver · enable/disable service
        ↓
3  ENFORCE           wire ~40 unguarded composable keys · job/export/webhook guards
        ↓            ── backend composition now provably works ──
        ↓
4  NAVIGATION        registry-driven nav · hide-not-lock · cap top-level items
        ↓
5  MY ERP            Settings → capability browser (manual path, before any AI)
        ↓            ── SHIPPABLE: "Build your own VenQore" ──
        ↓
6  DASHBOARD         dashboard_layouts · widget registry · edit mode · split DashboardController
        ↓
7  TEMPLATES         extend config/industries.php with capability bundles · 8–10 templates
        ↓
8  TERMINOLOGY       tenant_terminology · term() helper · nav/titles/headers/buttons/empty states
        ↓            ── SHIPPABLE: "VenQore speaks your language" ──
        ↓
9  ONBOARDING        business type → few questions → recommendation → build (deterministic, no AI)
        ↓
10 THEMES            3 new themes + 5-control picker            [SHOULD HAVE]
        ↓
11 VENA L1+L3        capability_search_index · tiers 0–2 · discovery + explain + [Enable]
        ↓
12 VENA L2           onboarding composition from free text (tier 3)
        ↓            ── SHIPPABLE: "Describe your business, VenQore assembles your ERP" ──
        ↓
13 COST              tier/cache telemetry · budget dashboard · global answer cache
        ↓
14 WORKFORCE         P7 concepts native: tasks · proof · focus · blocked · asset checkout
        ↓
15 SCHEDULING        Scheduling + non-stock Resource + Period   → unlocks 16 businesses
```

**Three ordering rules that matter:**
- **Enforcement (3) must precede navigation (4).** Hiding before enforcing ships a security hole.
- **Manual browser (5) must precede Vena (11).** Vena needs something to point at, and the ERP must work without it.
- **Terminology (8) must precede templates shipping publicly (7).** A restaurant template that says "Parked Sale" undercuts the entire pitch.

---

# 19 — MVP

**"Build Your Own ERP is real"** = steps **0 → 5**, plus 7 and 8 to make it *feel* real.

**MUST HAVE**
- Test harness green in one process
- `capabilities` table with ~80 composable keys correctly classified
- Dependency resolver (enable cascade, disable block)
- `featuresFor()` fixed; API guards added; ~40 unguarded keys wired
- Registry-driven navigation, hide-not-lock
- **Settings → My ERP** — manual capability browser, grouped and searchable
- Onboarding: pick a template **or** build from scratch → composition applied
- 8–10 templates
- Terminology on nav, titles, table headers, buttons, empty states (~25 term keys)
- Existing tenants unchanged; one-click restore
- 6–8 reference compositions green in CI

**SHOULD HAVE (same release if time allows)**
- Dashboard composition (`dashboard_layouts` + widget registry)
- 3 additional themes + 5-control picker
- Vena Level 3 (discovery + explain + [Enable]) at tiers 0–2 only — **no LLM required**

**LATER**
- Vena Level 2 (free-text → full composition, tier 3)
- Workforce execution family
- Scheduling / Resource / Period
- Document engine consolidation
- Custom fields

**What must NOT delay the MVP:** themes, Vena, animations, template count beyond 10, custom fields, the document engine, mobile-specific screens.

**MVP acceptance test, in one sentence:** *a new tenant chooses "Workshop", never sees POS or Cookbook anywhere in the product, sees "Job" instead of "Parked Sale", and an existing retail tenant notices no difference at all.*

---

# 20 — Post-MVP

| Release | Content | Unlocks |
|---|---|---|
| **R2** | Dashboard composition · themes · Vena L3 (free tiers) | "Your ERP, your view" |
| **R3** | Vena L2 (free-text onboarding) · cost telemetry | **"Describe your business, VenQore assembles your ERP"** — the investor demo |
| **R4** | Workforce execution (P7 concepts) · workforce seats | Tier B businesses + a new pricing line |
| **R5** | **Scheduling + Resource + Period** | **16 Tier C businesses at once** |
| **R6** | Document engine · custom fields | "Ask us for anything" becomes configuration |
| **R7** | Projects/Relationship | Tier D businesses |

---

# 21 — Time Estimates

Evidence-based, from measured coupling. Three columns because they differ materially. "Solo + AI coding" assumes disciplined AI-assisted implementation with human review — realistic for well-specified, repetitive work (registry population, guard wiring, terminology substitution) and much less helpful for architectural judgement and debugging.

| # | Work | Solo + AI | Solo | +1 engineer (parallel) |
|---|---|---:|---:|---:|
| 0 | Safety: test harness, dead-service deletion, CI guards, API guards | 10–14 d | 15–20 d | 7–10 d |
| 1 | Capability normalisation (~250 keys, classify, DUP-1 Occupancy, retire dead table) | 8–12 d | 14–18 d | 6–9 d |
| 2 | Resolver + dependency engine + enable/disable service | 6–9 d | 10–14 d | 5–7 d |
| 3 | Enforcement: ~40 keys + jobs/exports/webhooks | 8–12 d | 14–18 d | 6–9 d |
| 4 | Registry-driven navigation, hide-not-lock | 8–12 d | 14–20 d | 6–10 d |
| 5 | Settings → My ERP browser | 5–8 d | 8–12 d | 4–6 d |
| 6 | Dashboard composition | 12–18 d | 20–28 d | 9–14 d |
| 7 | Templates (8–10) | 5–8 d | 8–12 d | 4–6 d |
| 8 | Terminology (~25 keys, ~450 sites) | 10–15 d | 18–25 d | 8–12 d |
| 9 | Onboarding flow (deterministic) | 6–9 d | 10–14 d | 5–7 d |
| 10 | Themes (3 new + picker) | 6–9 d | 10–14 d | 5–7 d |
| 11 | Vena L1+L3, tiers 0–2, search index | 10–15 d | 16–22 d | 8–11 d |
| 12 | Vena L2, tier 3, onboarding composition | 8–12 d | 12–18 d | 6–9 d |
| 13 | Cost telemetry + budget dashboard | 3–5 d | 5–8 d | 2–4 d |
| 14 | Workforce execution (P7 concepts) | 15–22 d | 22–32 d | 11–16 d |
| 15 | Scheduling + Resource + Period | 40–55 d | 55–75 d | 25–35 d |

## Milestones

| Milestone | Steps | Solo + AI | Solo | +1 engineer |
|---|---|---|---|---|
| **M1 — Composition works (internal)** | 0–3 | 32–47 d ≈ **7–10 wks** | 53–70 d ≈ 11–14 wks | 24–35 d ≈ 5–7 wks |
| **M2 — "Build Your Own ERP" live** *(MVP)* | +4,5,7,8,9 | 66–99 d ≈ **13–20 wks** | 111–153 d ≈ 22–31 wks | 51–76 d ≈ 7–11 wks |
| **M3 — "Your ERP, your view"** | +6,10 | 84–126 d ≈ 17–25 wks | 141–195 d ≈ 28–39 wks | 65–97 d ≈ 9–14 wks |
| **M4 — "Describe your business…"** *(investor demo)* | +11,12,13 | 105–158 d ≈ **21–32 wks** | 174–243 d ≈ 35–49 wks | 81–121 d ≈ **11–17 wks** |
| **M5 — Scheduling family (16 businesses)** | +14,15 | 160–235 d ≈ 32–47 wks | 251–350 d ≈ 50–70 wks | 117–172 d ≈ 17–25 wks |

## Calendar (ERP maintenance and sales continuing — apply ×1.6–1.9)

| | Solo + AI | Solo | +1 engineer |
|---|---|---|---|
| **MVP live** | **5–7 months** | 9–13 months | **3–4.5 months** |
| **Investor demo (M4)** | **8–12 months** | 14–20 months | **5–7 months** |
| **16 new businesses (M5)** | 12–18 months | 20–28 months | 7–10 months |

**Honest read:** solo with AI assistance you are roughly **6 months to MVP and 10 months to the demo**. With one experienced engineer — and specifically a **senior React engineer**, since ~85% of the gap is frontend — you are **4 months and 6 months**. That hire roughly halves the calendar and is the highest-leverage spend available.

---

# 22 — Risk Register

### 🔴 CRITICAL

| # | Risk | Mitigation |
|---|---|---|
| R1 | **"Ask us and we'll add it" becomes bespoke consulting.** Twenty customers, twenty special cases, a platform that gets *harder* to generalise with every sale. Slow and comfortable enough that you would not notice for a year. | Written rule: yes only if it composes, or becomes a registry capability for everyone. **Never `if ($tenant->id === X)`.** Track registry count monthly; tenant-specific code paths must stay at zero. |
| R2 | **Shipping composition before enforcement** — hidden but reachable capability | Sequence step 3 before 4. CI guard 2 (every composable key has an enforcement point). API guards (D-2). |
| R3 | **Test harness unreliable** — cannot verify anything | Step 0. Blocking. |
| R4 | **Financial core contamination** | Freeze `V3/`. New layers call in, never out. CI: any diff to Accounting/Fifo/Payment/Settlement requires a Golden run. |
| R5 | **Vena hallucinates a capability that doesn't exist** — worse than saying no | Vena may only return registry keys; assert this in tests, not in the prompt. Explicit "we don't have that yet" path. |

### 🟠 HIGH

| # | Risk | Mitigation |
|---|---|---|
| R6 | **Vertical drift** — one small special case per new business. `restaurant_tables` + `RestaurantDashboardController` already set the precedent | DUP-1 first. Every future vertical = capability + configuration + vocabulary. Zero new vertical tables. |
| R7 | **`products` assumed everywhere** — blocks all Tier C/D services businesses | Decouple in step 1–2: `DashboardController` (D-8), `TenantDefaultSeeder` (unconditional warehouse), report pages |
| R8 | **Terminology scope creep** — 1,817 sites | Hard stop at nav/titles/headers/buttons/empty states. Body copy converts opportunistically, forever. |
| R9 | **Capability count becomes overwhelming** — ~250 checkboxes | Classify: only ~80 are user-composable. The rest are limits or marketing rows. Group by the 12 existing groups. |
| R10 | **Offline layer is retail-shaped** — 12 hard-coded Dexie stores | State plainly that offline covers POS + stock. Do not promise it for other compositions. |
| R11 | **Marketing outruns the registry** | Announce a vertical only when its capability gap is ≤2 registry entries. |

### 🟡 MEDIUM

| # | Risk | Mitigation |
|---|---|---|
| R12 | AI cost drift as Vena usage grows | Tier + cache telemetry from day one; ≥90% free-tier target; existing `AiSpendGuard` caps |
| R13 | MariaDB 10.5 (EOL): no `JSON_TABLE`, no `VECTOR`, no `SKIP LOCKED`, one queue worker | Never query inside `layout_json`. PHP-side cosine (§13.2). Plan the 10.11 LTS upgrade before Scheduling. |
| R14 | Composition ≠ plan confusion in billing | Keep them separate in code; hiding a capability never changes the invoice |
| R15 | Support load — every composition a slightly different product | 6–8 certified reference compositions; anything else is supported-not-certified |
| R16 | `CLAUDE.md` contains a materially false architectural claim (`Transaction` as core model) | Correct it in step 1 |

---

# 23 — Definition of Done

**"Build Your Own ERP" may not launch until every line is true.**

**Foundation**
- [ ] Full test suite green in a single process, three consecutive runs
- [ ] Legacy service generation deleted; one `InventoryService`, one `PurchaseService`, one `FifoService`
- [ ] CI guard: every `plan.feature:` key exists in `capabilities`
- [ ] CI guard: every composable capability has ≥1 enforcement point
- [ ] CI guard: diffs to `V3/Accounting|Fifo|Payment|Settlement` require a Golden run

**Capability system**
- [ ] `capabilities` table populated from the ~250 seeder keys, each classified `capability` / `limit` / `marketing`
- [ ] ~80 composable capabilities each carry `requires`, `provides_nav`, `provides_cards`, `provides_terms`
- [ ] Dependency resolver: enable cascades, disable blocks with a readable reason
- [ ] `featuresFor()` iterates the registry, not the plan key set (D-1 closed)
- [ ] `routes/api.php` guarded (D-2 closed)
- [ ] Jobs, exports and webhooks guarded

**Experience**
- [ ] Navigation renders wholly from the registry; **no hard-coded menu array remains**
- [ ] Every top-level item is conditional; a tenth top-level item is structurally impossible
- [ ] Disabled capabilities are **absent**, not locked; locks appear for capacity only
- [ ] Settings → My ERP: grouped, searchable, dependency-aware, works with Vena offline
- [ ] Onboarding: template **or** build-from-scratch, with a preview before commit
- [ ] 8–10 templates, each a pure configuration bundle with zero vertical code
- [ ] ~25 term keys applied to nav, titles, table headers, buttons, empty states
- [ ] A Workshop tenant sees "Job", never "Parked Sale"; a Restaurant tenant sees "Table"

**Safety**
- [ ] 6–8 reference compositions pass the full suite
- [ ] Boundary test per composable capability: enabled reachable / disabled 403 on web **and** API
- [ ] Existing tenants: zero rows in `tenant_plan_overrides` → byte-identical experience
- [ ] Disable never deletes; open-balance block honoured; one-click restore verified
- [ ] Tenant isolation test on all three new tables

**Vena (if shipped in this release)**
- [ ] Never returns a key absent from the registry (asserted in tests)
- [ ] Never changes state — only proposes; one code path applies composition
- [ ] Answers "we don't have that yet" honestly on unsupported requests
- [ ] ≥90% of a fixed query corpus resolves at tier ≤2 (no LLM)
- [ ] With Vena disabled: browser, onboarding and ERP fully functional
- [ ] `ai_usage_events` records `tier_used` and `cache_hit` on every request

**Truth**
- [ ] Every claim on the pricing and marketing pages is enforceable in code (`FEATURE_GATING_AUDIT.md` found four Critical false promises — all must be closed)
- [ ] `CLAUDE.md` corrected
- [ ] Composition changes never alter billing

---

## Closing note — the ten principles, applied

| Principle | How this plan honours it |
|---|---|
| Reuse before rebuild | `tenant_plan_overrides`, `PlanGate`, the theme contract, `product_search_index`, `visitor_chat_cached_answers` are all extended, not replaced. Three new tables total. |
| Configuration before customisation | Templates and compositions are data. Custom fields are deliberately post-MVP. |
| Deterministic before AI | Steps 0–10 contain no AI at all. The product is complete and sellable before Vena exists. |
| User choice before autonomous AI | Vena proposes; one deterministic code path applies; the manual browser always works. |
| Platform capability before tenant code | R1's written rule; registry count as the monthly metric. |
| AI understanding before AI execution | Vena has four read tools and one propose tool. Zero execute tools. |
| Existing customers must not break | Migration is a backfill of zero rows. Default = today's behaviour. |
| AI cost economically insignificant | Four-tier router, ≥90% free, no vector DB, global answer cache, existing spend guards. |
| ERP functions without Vena | Explicit Definition-of-Done item, explicitly tested. |
| Every feature makes the platform more reusable | §03.3 — the engines are already generic; naming them so is the cheapest market expansion available. |

