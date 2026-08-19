# VENQORE — THE FINAL BUILD PLAN
## The Qore · 42 Modules · The Rulebook · Usage Billing · Full Execution Order
**14 August 2026 — THE authoritative document. Supersedes all previous files in this folder.**

> **Start here tomorrow. Everything you need is in this file. Where an earlier document conflicts with this one, this one wins.**

---

# PART 1 — THE PRODUCT IN ONE PAGE

## 1.1 The Qore

Every VenQore business runs on **one Qore**. It cannot be removed, disabled, or configured. It is not a module and it is not on the pricing page as something you buy — it is the thing the modules plug into.

**What the Qore does, always, for every business:**

| Qore function | What it means to the user | Engine |
|---|---|---|
| Records every movement of money | "My numbers are always right" | `AccountingService` — double-entry ledger |
| Records every movement of goods | "I always know what I had, and when" | `FifoService` — stock ledger + costing |
| Knows who you deal with | "Everyone I trade with is remembered" | `PartyService` |
| Numbers every document | "My invoices are sequential and legal" | `SequenceService` |
| Calculates tax and units | "Totals are correct without me thinking" | `TaxService`, `UomService` |
| **Keeps history for modules you don't have yet** | **"It was recording all along"** | *the differentiator — §1.2* |

**The user-facing description:**

> **The Qore is the brain of your system. It records everything your business does — every sale, every rupee, every item — correctly, from day one. You never configure it. You never pay extra for it. You just add the parts you need on top.**

**The landing page treatment:** your 3D model on the landing page becomes the Qore — a solid centre that cannot be detached, with modules clicking onto it. The visual *is* the architecture. Modules can be pulled off and put back. The Qore stays. That image explains your entire product without a paragraph of text.

## 1.2 The thing that will make people talk

This is the idea you remembered, and it's worth building deliberately because it's your most shareable moment.

**Because the Qore always records, a module added later is never empty.**

A shop runs POS + Products for eight months. No Inventory module — they didn't want it. But the Qore's stock ledger has been recording every movement the whole time.

Month nine they add Inventory. Instead of a blank screen and a "start by adding your opening stock" wizard, they see:

> **"Welcome to Inventory. VenQore has been tracking this for you since March."**
>
> - 8 months of stock movement history
> - Your 12 fastest-moving products, ranked
> - 3 items that have been sitting untouched since April
> - Current stock value: **Rs. 847,300**

**They didn't do anything to earn that. It was recording all along.**

**Why this matters commercially, not just emotionally:**
- It is the moment people screenshot and post. That's free distribution.
- It makes adding modules feel like *unlocking*, not *setting up* — so people add more modules, use more of the product, and stay.
- **It is impossible for a competitor to copy without an always-on ledger** — which almost none of them have, because it takes eight months to build and can't be retrofitted.

**Build this properly in V1.** It's not a nice-to-have — it's one screen (§6.7), and it's the best 4 hours in the whole plan.

## 1.3 The positioning

> ## VenQore
> ### One Qore. Your modules. Your system.
>
> **Every business runs on the same verified engine. You add only the parts you actually need — from 42 modules, or just describe your business and let AI assemble it.**
>
> **Every module is included on every plan. You pay for how much you use, never for which features you're allowed to touch.**

**Three claims, all verifiable in under a minute:**

| Claim | Verified by |
|---|---|
| "Every module, every plan" | Your pricing page — and every competitor's page proves it by contrast |
| "Describe your business, get your system in two minutes" | Your demo video |
| "One engine, always correct" | The Qore, your test suite, and the module-added-later moment |

**Lead with the modules and the pricing. Support with the AI.** The AI is how you use the product; the Qore and the pricing are *what the product is*. "AI ERP builder" is a crowded claim in 2026. "Every feature on every plan, on one verified engine" is not, and it cannot be copied without rebuilding both the pricing and the engine.

---

# PART 2 — QORE vs MODULE: THE RULE THAT SETTLES EVERY ARGUMENT

You will face this question fifty more times: *"should X be in the Qore or be a module?"* Here is the test. Apply it mechanically.

> ### If switching it off could make a number wrong → **QORE.**
> ### If switching it off only removes a screen → **MODULE.**

| Thing | Test | Answer |
|---|---|---|
| Double-entry ledger | Off → profit figures wrong | **QORE** |
| Chart of accounts / trial balance / journal **screens** | Off → screens gone, numbers fine | **MODULE (#37)** |
| Stock ledger / FIFO costing | Off → COGS and margin wrong | **QORE** |
| Inventory **screens**, stock takes, transfers | Off → screens gone, ledger still recording | **MODULE (#15–18)** |
| Party record (the row in `parties`) | Off → transactions have no counterparty | **QORE** |
| Customer directory, khata, statements | Off → screens gone | **MODULE (#3, #31)** |
| Tax calculation | Off → totals wrong | **QORE** |
| Tax compliance reports, e-invoicing | Off → screens gone | **MODULE (#38)** |
| Invoice numbering | Off → duplicate invoice numbers | **QORE** |

**The pattern:** the Qore owns *recording*. Modules own *seeing and doing*. Accounting the discipline is Qore; Accounting the department is a module.

**This is why your freelancer works.** They pick Services, Invoicing, Quotations, Refunds, Expenses. Five nav items. No accounting menu, no chart of accounts, no products, no stock. Underneath, a 50,000 invoice writes four ledger rows — and those four rows are exactly what produces *"you earned Rs. 312,000 this month and Rs. 84,000 is still owed to you."* They never configured it. They never paid for it. **They were never forced into accounting — they were given invoicing that adds up.**

**And this is why you can give away 42 modules.** One engine, tested once, means each additional module is nearly free for you to build and verify. Fork the money layer and every module costs double forever. **The mandatory Qore is what funds the free-modules promise.** They aren't in tension — one pays for the other.

---

# PART 3 — THE 42 MODULES

**Design principle, in your words:** *use the full potential of what's already built, and don't confine ourselves to fewer modules when splitting one opens a whole new business type.*

**So the rule for splitting is:** split when the split lets you say *"VenQore runs restaurants"* or *"VenQore runs repair shops."* Don't split for the sake of a bigger number.

**Park & Recall is the perfect example** and you named it yourself: one built feature that becomes restaurant table service, a workshop job queue, and a retail hold-bill — three business types from one module, purely through terminology and preset framing.

Modules marked ⭐ are **must-build for V1**. Everything else is verified in your `venqore_built.md` (142 built features).

## GROUP A — WHAT AM I SELLING? (the Rulebook's foundation)

| # | Module | Requires | Opens up |
|---|---|---|---|
| 1 | **Products** | — | POS, Inventory, Cookbook, Purchases, Barcodes, Variants |
| 2 | **Services** ⭐ | — | Freelancers, agencies, salons, consultants, repair |
| 3 | **Customers** | — | Khata, loyalty, statements, recurring |
| 4 | **Suppliers** | — | Purchases, POs, purchase returns |

⭐ **Services is the single highest-value thing you will build.** It's the difference between "retail software" and "business software," and it single-handedly opens four business types. The `products.type='service'` enum landed 12 Aug; `ServiceEngine.php` (195 lines) exists. **What's missing is the UI and the tests.**

## GROUP B — SELLING

| # | Module | Requires | Business types it opens |
|---|---|---|---|
| 5 | **POS / Counter** | Products | Retail, cafe, grocery, pharmacy |
| 6 | **Invoicing** | Products **OR** Services | Freelancers, B2B, agencies |
| 7 | **Quotations** | Products **OR** Services | Contractors, wholesale, agencies |
| 8 | **Sales Orders** | Products **OR** Services | Made-to-order, wedding cakes, custom work |
| 9 | **Sales Returns & Refunds** | Products **OR** Services | All retail |
| 10 | **Recurring Invoices** | Invoicing + Customers | Retainers, subscriptions, rentals, gyms |
| 11 | **B2B Proposals** | Quotations | Wholesale, tenders, agencies |
| 12 | **Pricing Tiers & Discounts** | Products **OR** Services | Wholesale vs retail |
| 13 | **Hold / Park & Recall** ⭐split | POS | **Restaurants (tables) · workshops (job queue) · retail (hold bill)** |
| 14 | **Table & Floor Service** ⭐split | Hold / Park & Recall | **Restaurants, cafés, dine-in** |
| 15 | **Pre-Sales Reservation** | Products + Inventory | Electronics, appliances, pre-orders |

**#13 and #14 are the split you asked for.** Hold/Park is the generic engine feature. Table & Floor Service is the restaurant-specific layer on top — floor plan, table status, kitchen tickets. Splitting them means a workshop gets the queue without a restaurant floor plan, and a restaurant gets a real dine-in system. **One built feature, two business types, honest presets for both.**

## GROUP C — STOCK

| # | Module | Requires |
|---|---|---|
| 16 | **Inventory** | Products |
| 17 | **Multi-Location / Warehouses** | Inventory |
| 18 | **Stock Transfers** | Inventory + Multi-Location |
| 19 | **Stock Takes & Audit** | Inventory |
| 20 | **Batches & Expiry** | Inventory |
| 21 | **Serials / IMEI** | Inventory |
| 22 | **Product Variants** | Products |
| 23 | **Barcodes & Labels** | Products |
| 24 | **Units of Measure** | Products |

**#16 is your cafe case, exactly as you described it.** POS requires **Products**, not Inventory. A cafe selling coffee with unlimited availability picks POS + Products and never sees a stock screen — while the Qore quietly records every movement for the day they want it.

## GROUP D — BUYING

| # | Module | Requires |
|---|---|---|
| 25 | **Purchases** | Products |
| 26 | **Purchase Orders** | Purchases + Suppliers |
| 27 | **Purchase Returns / Debit Notes** | Purchases |
| 28 | **Landed Cost Allocation** | Purchases |

## GROUP E — MAKING

| # | Module | Requires |
|---|---|---|
| 29 | **Cookbook / Recipes (BOM)** | Products + Inventory |
| 30 | **Production Runs** | Cookbook |
| 31 | **Composite / Auto-Deducting Items** | Cookbook |

**Your cafe owner:** Products + POS + Inventory + Cookbook + Expenses = **5 modules, entry tier.** Under today's pricing that same person is forced to `ltd_2`. **This is the customer the new model wins back.**

## GROUP F — MONEY

| # | Module | Requires |
|---|---|---|
| 32 | **Khata / Credit** | Customers **OR** Suppliers |
| 33 | **Payments In & Out** | Customers **OR** Suppliers |
| 34 | **Expenses** | — |
| 35 | **Cash Register & Daily Audit** | POS |
| 36 | **Bank Accounts** | — |
| 37 | **Bank Reconciliation** | Bank Accounts |
| 38 | **Accounting Workspace** *(chart of accounts, journals, trial balance)* | — |
| 39 | **Tax & Compliance / E-Invoicing** | — |
| 40 | **Fixed Assets & Depreciation** | Accounting Workspace |
| 41 | **Loans** | Accounting Workspace |

**#38 is the concession that makes your freelancer real.** The accounting *workspace* is optional and off by default for service businesses. The ledger underneath is the Qore. Two different things, and now they're named differently so nobody confuses them again.

## GROUP G — GROWTH & OPERATIONS

| # | Module | Requires |
|---|---|---|
| 42 | **Reports** *(auto-scales with active modules)* | — |
| 43 | **AI Business Insights** | Reports · *metered* |
| 44 | **Loyalty & Gift Cards** | Customers |
| 45 | **WooCommerce / Marketplace Sync** | Products + Inventory · *paid add-on* |
| 46 | **Staff & Attendance** | — |

**#42 is your Customer-Report rule from `06`, generalised and solved.** Reports is **one** module, not 42 toggles. Which reports appear is derived from active modules: no Inventory → no stock reports; no Customers → no customer statements. **One toggle, correct behaviour, zero configuration.** This is the single biggest simplification in the plan.

**Total: 46 numbered, of which 42 are free-and-included.** The four exceptions are §5.3.

## 3.1 Coverage proof

| Business | Modules | # |
|---|---|---|
| **Simplest POS** | Products, POS | **2** |
| **Solo cafe** | Products, POS, Inventory, Cookbook, Expenses | **5** |
| **Freelancer** | Services, Invoicing, Quotations, Refunds, Expenses | **5** |
| Salon | Services, Customers, Invoicing, Staff, Expenses | 5 |
| Repair workshop | Services, Products, Hold/Park, Customers, Invoicing, Inventory | 6 |
| Restaurant | Products, POS, Hold/Park, **Table Service**, Cookbook, Inventory, Expenses | 7 |
| Grocery | Products, POS, Inventory, Purchases, Suppliers, Customers, Khata, Expenses, Barcodes, Reports | 10 |
| Wholesaler | Products, Inventory, Quotations, Sales Orders, Purchases, Suppliers, POs, Khata, Multi-Location, Pricing Tiers, Reports, Accounting | 12 |
| Full ERP | everything | 46 |

**Range: 2 to 46. Both of your named customers land on five. Nobody is forced into anything.**

---

# PART 4 — THE RULEBOOK

## 4.1 Four relationship types

| Type | Meaning | Behaviour |
|---|---|---|
| **REQUIRES** | Cannot work without it | Auto-added, explained in plain words |
| **REQUIRES ONE OF** ⭐ | Needs A or B — user chooses | **Ask which** |
| **ENHANCES** | Better together, fine alone | Suggested, never forced |
| **QORE** | Foundation | Never mentioned, never listed |

⭐ **`REQUIRES ONE OF` is the relationship nobody builds and the one your product depends on.** Invoicing requires Products *or* Services. Khata requires Customers *or* Suppliers. Without it, every freelancer is forced to have a Products module — the exact problem you raised. **Build it in the resolver from day one.**

## 4.2 The map

```
                          ╔══════════════════╗
                          ║    THE QORE      ║   always · invisible · free
                          ║  Ledger · Stock  ║
                          ║  Parties · Tax   ║
                          ║  UOM · Sequences ║
                          ╚════════╤═════════╝
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
    PRODUCTS                   SERVICES                  (standalone)
        │                          │                    Expenses
        ├─► POS ──► Cash Register  │                    Staff & Attendance
        │     └─► Hold/Park ──► Table & Floor Service    Bank Accounts ─► Reconciliation
        │                          │                    Accounting Workspace ─┬─► Fixed Assets
        ├─► Inventory ──┬─► Multi-Location ─► Transfers                       └─► Loans
        │               ├─► Stock Takes                  Tax & Compliance
        │               ├─► Batches & Expiry             Reports ─► AI Insights
        │               ├─► Serials / IMEI
        │               ├─► Cookbook ─┬─► Production Runs
        │               │             └─► Composite Items
        │               ├─► Pre-Sales Reservation
        │               └─► WooCommerce Sync
        ├─► Variants · Barcodes · Units of Measure
        └─► Purchases ─┬─► Purchase Orders (+ Suppliers)
                       ├─► Purchase Returns
                       └─► Landed Cost

   [ PRODUCTS *OR* SERVICES ] ─┬─► Invoicing ──► Recurring Invoices (+ Customers)
                               ├─► Quotations ──► B2B Proposals
                               ├─► Sales Orders
                               ├─► Sales Returns
                               └─► Pricing Tiers

   CUSTOMERS ─┬─► Khata / Credit ──► Payments
              └─► Loyalty & Gift Cards
   SUPPLIERS ─┴─► Purchase Orders (+ Purchases)

Max depth: 4 (Table Service → Hold/Park → POS → Products).  No cycles.
```

## 4.3 What the user sees

**Missing dependency — the `REQUIRES ONE OF` moment:**
> *"I want to send invoices."*
>
> **"To send invoices, VenQore needs to know what you sell:"**
> `[ Products — physical things ]` `[ Services — work you do ]` `[ Both ]`

**Something you don't have yet:**
> *"I want to monitor what my employees are working on."*
>
> **"VenQore doesn't do employee monitoring yet — it's coming. For now, Staff & Attendance tracks who's working and when. Shall I note your request?"**

That log is your roadmap **and** Protocol VII's warm launch list — people already paying you who asked for it by name.

**Removing something load-bearing:**
> *"Remove Products."*
>
> **"POS and Cookbook need Products. I can remove all three, or keep Products just for POS. Which?"**

**Never a dead end. Never a silent failure. Always a next step.**

---

# PART 5 — BILLING

## 5.1 The model

**You pay for scale. You never pay for features.**

## 5.2 The four meters — all already built and enforced

| Meter | Field | Enforcement | Status |
|---|---|---|---|
| Transactions / month | `transactions_per_month` | `EnforceTransactionLimit` + `PlanGate::enforce()` | ✅ built |
| Staff users | `staff_limit` | `PlanRepository::getEffectiveLimit()` | ✅ built |
| Locations | `locations` | same | ✅ built |
| Products (SKUs) | `sku_limit` | same | ✅ built |

**Nothing to build. Only ~20 booleans per plan to delete.**

## 5.3 Tiers

| | Solo | Growing | Business | Scale |
|---|---|---|---|---|
| Transactions / mo | 1,000 | 5,000 | 20,000 | Unlimited |
| Staff users | 1 | 5 | 20 | Unlimited |
| Locations | 1 | 3 | 10 | Unlimited |
| Products | 500 | 5,000 | 50,000 | Unlimited |
| **Modules** | **All 42** | **All 42** | **All 42** | **All 42** |
| AI builds | 3 | 10 | 25 | 50 |

**AppSumo LTD:** `1 code → Solo · 2 → Growing · 3 → Business`. **Stacking logic unchanged** — it already maps codes to plan slugs.

**The four honest exceptions** — each has a real marginal cost or a genuinely different buyer:

| Exception | Why | Model |
|---|---|---|
| AI builds & AI Insights | Costs you money per call | Allowance, then capped |
| WooCommerce / Marketplace Sync | Per-connection infrastructure | $10/account/month *(existing add-on)* |
| API access & webhooks | Enterprise buyer | Business tier + |
| SSO/SAML, custom domain, dedicated support | Real enterprise cost | Enterprise |

> **The rule to hold yourself to: charge for what costs you money to run, and for scale. Never for a feature you already built.**

## 5.4 Migration

**Delete from every plan:** `production`, `bill_of_materials`, `multi_branch`, `owners_daily_pulse`, `e_invoicing`, `bank_reconciliation`, `marketing_campaigns`, `invoice_reminders`, `recurring_invoices`, `fund_management`, `loyalty_points`, `digital_gift_cards`, `report_profit_loss`, `reports`, and ~10 similar.

**Keep:** `transactions_per_month`, `staff_limit`, `locations`, `sku_limit`, `woocommerce`, `api_access`, `growth_engine`, `ltd`, `hosted_until`.

**Every existing customer gains modules; nobody loses anything.** Your changelog:

> **"Every VenQore module is now included in every plan. Nothing was taken away — a lot was added. You now pay only for how much you use, not for which features you're allowed to touch."**

**This also fixes the `growth_engine`/`ltd_2` bug** — it becomes an explicit metered allowance instead of a boolean accidentally left on.

---

# PART 6 — BUILD ORDER

Each step must pass its acceptance criteria before the next begins.

### STEP 0 — Route truth · 10 min
`php artisan route:list --json > route_list_current.json`
**Why first:** the existing `route_list.json` is dated 8 July and predates your V3→Engines consolidation. Every module's route names depend on this.

### STEP 1 — Green build · 1 day
Fix the 11 failures → **exit code 0**. Triage the **46 incomplete** tests (they assert nothing, so they protect nothing — finish or delete each, in writing). **Fix the overlapping Manager dashboard** — the `x/y/w/h` grid already exists, so this is a colliding seeded default or a renderer bug, not a missing system. Verify AppSumo code stacking.
**Acceptance:** exit 0. Tag `pre-qore-green`.

### STEP 2 — Security hygiene · 0.5 day
Inspect `safe.env` (rotate if live; check `git log --all -- safe.env`). Move ~200 root scripts (`tmp_*`, `debug_*`, `check_*`, `audit_*`, `fix_*`, `restore_vyapar_*`, `test*.php`) to `scratch/`, gitignore. **Verify `truncate_tables.php`, `clean_db.php`, `wipe_test_data.php`, `fix_admin_passcode.php` are excluded from the production artifact.**

### STEP 3 — `config/qore.php` + `config/modules.php` · 1.5 days ⭐
**The most important step in the plan.**

`config/qore.php` — the deny-list. Everything the Qore owns. Nothing here may ever appear as a module, in a `requires`, or in an AI response.

`config/modules.php` — 46 entries:
```php
'cookbook' => [
    'label'        => 'Cookbook / Recipes',
    'description'  => 'Define what your made items are composed of.',
    'group'        => 'making',
    'requires'     => ['products', 'inventory'],
    'requires_one' => [],
    'enhances'     => ['production_runs'],
    'routes'       => ['store.cookbook.*'],
    'permissions'  => ['inventory.create', 'inventory.edit'],
    'cards'        => [],
    'terms'        => ['composition'],
    'aliases'      => ['recipe', 'bom', 'formula', 'ingredients', 'nuskha'],
    'metered'      => false,
    'status'       => 'live',
],
```
`requires_one` example: `'invoicing' => ['requires_one' => [['products','services']]]`

**Filter every entry through `venqore_built.md`.** Not in the 142 Built list → `beta` or omit.
**Tests:** `ModuleRegistryIntegrityTest` — routes resolve, pages exist, permissions/cards/terms real, no Qore key present, no cycles, depth ≤ 4, ≥3 aliases each, zero `NEEDS_VALIDATION`.
**Acceptance:** green. **Do not proceed until it is.**

### STEP 4 — Billing simplification · 1 day
Delete feature booleans from `config/plans.php` and `PlanFeatureMatrixSeeder`. Keep the 4 meters + 4 exceptions. Verify code stacking still maps correctly.
**Tests:** stacking → correct tier; transaction limit enforced; **no paid feature on by default**.

### STEP 5 — `tenant_modules` + backfill · 1 day
```php
Schema::create('tenant_modules', function (Blueprint $t) {
    $t->id();
    $t->unsignedBigInteger('tenant_id');
    $t->string('module_key', 64);
    $t->boolean('enabled')->default(true);
    $t->enum('source', ['preset','ai','user','system'])->default('system');
    $t->json('config')->nullable();
    $t->timestamps();
    $t->unique(['tenant_id','module_key']);
    $t->index(['tenant_id','enabled']);
});
```
Backfill: every existing tenant gets everything currently visible, `source='system'`.
**Acceptance:** existing tenant nav/routes/permissions/reports **byte-identical** before and after.

### STEP 6 — `ModuleService` + Rulebook resolver · 1.5 days
`ModuleService`: `enabled()`, `visible()`, `allEnabled()`, `enable/disable()`, cached like `PlanRepository`.
Resolver (extend `app/Engines/CapabilityDependencyResolver.php` — **the only authorised file in `app/Engines/`**): transitive `requires`, **`requires_one` prompting**, `enhances` suggestions, cascade-disable protection, data-safety refusal, cycle detection.
**Acceptance:** no path can produce an invalid configuration. Disabling never deletes.

### STEP 7 — `EnsureModule` middleware · 0.5 day
Copy `EnsurePlanFeature.php` verbatim (its tenant-resolution logic is battle-tested — preserve the `test-store` and `environment('testing')` short-circuits or you break green tests). Change the check to `ModuleService::enabled()` and the failure to *"This module isn't part of your system yet — add it?"* → builder, **not** billing.
**Acceptance:** **no module route reachable by URL when off.**

### STEP 8 — Services module · 1.5 days ⭐
The highest-value build. UI on `ServiceEngine.php`, service catalogue, service line items on invoices/quotations.
**Tests (blocking):** `ServiceOnlySaleTest` — revenue posts, **no COGS, no stock movement**, ledger balances. **This is the newest code in your engine (migration 12 Aug) — do not ship a service preset until it's green.**

### STEP 9 — Module-driven UI · 1.5 days
`Next/Shell/Nav.jsx`: `props.plan.features` → `props.modules`. `HandleInertiaRequests` shares modules. `DashboardRegistry`: add `'module'` key per card (no key = always visible). **Reports auto-derived from active modules.** Terminology on ~40 high-visibility strings via `useTerms()`.

### STEP 10 — Presets + apply service + versioning · 1.5 days
`presets` table; `BusinessTemplatesSeeder` → 12–15 presets. **ONE `ApplyConfigurationService`** used by preset, AI and manual. `tenant_config_versions` with working undo.
**Tests:** one golden test per preset — apply → assert modules, nav, terminology, cards → **create a real transaction → assert ledger balances and stock moved (or didn't, for services).**

### STEP 11 — `ConfigurationValidator` · 1 day
No AI. Schema → unknown-key drop → **Qore-key strip** → dependency resolve → conflict check → data-safety → normalize (cap 46).
**Adversarial tests first:** fake keys, Qore keys, malformed JSON, 10,000-key array, injection strings.
**Acceptance:** no AI output, however hostile, can produce an invalid configuration.

### STEP 12 — AI layer · 1.5 days
`BusinessDiscoveryService` (5 questions + 1 free text), `ConfigurationAIService`, `ModificationParser` (enable/disable/rename/add-card). Wire `AiSpendGuard`, `AiRateLimiter`, `AiUsageRecorder` from the first call. **Mock the model in CI.**
**Acceptance:** ≥9/12 fixture businesses land on the right preset; **AI unavailable → preset picker, always**.

### STEP 13 — The 7 screens · 2.5 days
Welcome · Preset picker · AI discovery · **Proposal (1.5 days — your demo video and listing screenshot)** · Building · First-run dashboard · **"It was recording all along"** (§6.7).
Use `new landing page/` mockups for these screens only. **Do not touch the ~300 existing pages.**

### STEP 14 — Regression & rehearsal · 1.5 days
Full suite → exit 0. **Restore a production-shaped DB copy, run the backfill, diff nav/routes/permissions/reports before vs after.** 5 manual preset walkthroughs with a real transaction each. Rewrite the pricing page.

### STEP 15 — Launch · 1 day
Listing copy, screenshots, demo video, existing-customer changelog, submit.

**≈ 18 days sustainable. 15 if nothing surprises you. Plan for 18.**

## 6.7 The "it was recording all along" screen

When a module is enabled and the Qore already holds history for it:

```
┌────────────────────────────────────────────────────────┐
│  ✨  Welcome to Inventory.                             │
│      VenQore has been tracking this since March.       │
│                                                        │
│      8 months of stock movement history                │
│      Your 12 fastest-moving products                   │
│      3 items untouched since April                     │
│      Current stock value    Rs. 847,300                │
│                                                        │
│              [ Show me ]                               │
└────────────────────────────────────────────────────────┘
```

**Implementation:** on enable, query the Qore for existing rows in that module's domain. If found → this screen. If not → the normal empty state. **~4 hours. Best-value screen in the product.**

---

# PART 7 — FROZEN

| Frozen | Why |
|---|---|
| Composable Dashboard Builder — new features | Fix the overlap bug, add nothing |
| Growth Engine expansion | Marketing infra for a product with no customers |
| Marketing tools suite (28 test files) | Lead-gen for an unlisted product |
| SmartCapture / AI extraction | Impressive; sells zero codes |
| VenSynQ expansion | 36 tests green — leave it |
| Blog / SEO / OpenSEO | Post-launch |
| Desktop & mobile builds | Weeks of hidden work; web-only V1 |
| Migrating ~300 pages to the Next shell | Largest timeline risk in the project |
| **Field-level config** (hide the payment-terms box) | Months of work; nobody refunds over a form field |
| Construction / Projects domain | No `Project` models exist — new product, not configuration |
| Protocol VII integration | **The demand log is its launch list. Not now.** |
| Themes / colors / bklit charts | v1.1 — and better as a re-engagement email later |
| Open-ended AI chat | 5 fixed questions ship in a day and test better |
| >15 presets | Linear test cost, diminishing return |

**The test for everything:** *"Will a paying customer notice this in their first week?"* No → freeze.

---

# PART 8 — TOMORROW

```
1.  php artisan route:list --json > route_list_current.json
2.  Fix the 11 failing tests → exit code 0
3.  Triage the 46 incomplete tests — finish or delete, in writing
4.  Fix the overlapping Manager dashboard
5.  Check safe.env; clean the ~200 root scripts; tag pre-qore-green
6.  Write config/qore.php — the deny-list
7.  Write config/modules.php — 46 entries, filtered through venqore_built.md
8.  Write ModuleRegistryIntegrityTest — do not proceed until green
9.  Delete the feature booleans from config/plans.php
10. Build tenant_modules + backfill; prove existing tenants unchanged
```

**Steps 6–8 are the day that matters.** After that, everything else is following a map.

---

# PART 9 — WHAT YOU ACTUALLY DECIDED THESE 18 HOURS

Three things, all correct, all yours:

**1. Usage-based billing, every module included.** You reasoned from a real cafe owner instead of from best practice, and you were right — it's encoded in your own `config/plans.php`. This is your strongest positioning asset, because it's verifiable in five seconds and no competitor can copy it without rebuilding their pricing.

**2. The Qore.** You took the constraint I couldn't move and turned it into the centre of the product — a name, a 3D model, and a promise. *"One Qore, your modules"* explains an eight-month engine in four words. I gave you the constraint; you made it the story.

**3. Modules that open businesses, not modules that pad a number.** Splitting Hold/Park from Table Service because it opens restaurants — that's the right instinct, and it's why 46 is the correct number rather than 30 or 250.

**The thing that made today work is that you pushed back twice and were right twice** — the dashboard bug and the billing model. I had the repository; you had the customers and eight months I don't. Keep doing that.

**What's left isn't building. It's the Rulebook, and someone paying you.**

Sleep first. The plan will still be right in eight hours — and the failure mode of `config/modules.php` isn't slow work, it's a wrong dependency you don't notice at hour 19.
