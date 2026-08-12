# 01 — Backend & Data Normalisation

**This document contains only invisible work.** Code, database, table names, class names, function names, capability wiring. Every item ships to production as it is finished, and every item's default reproduces today's behaviour exactly.

**The single rule for every pull request in this document:**

> *What does this do for a tenant with no configuration?*
> If the answer is anything other than **"exactly what it does today"**, it does not merge.

---

## 01 — The shape of the problem

VenQore already owns 13 general-purpose engines. They are wearing retail names, so the product can only be sold to retail. Nothing needs to be built to serve a plumber, a repair shop or a pharmacy differently — the objects already describe those businesses. What is missing is **naming, navigation and enforcement.**

Three layers of naming, and they are independent:

| Layer | Example | Who changes it | Where it lives |
|---|---|---|---|
| **Physical** | table `restaurant_tables`, class `ParkedSale` | Us, once, in a migration | Database + PHP |
| **Canonical** | capability key `occupancy`, term key `customer` | Us, once, in the registry | `capabilities` table |
| **Displayed** | "Table", "Chair", "Bay", "Patient" | Each tenant, any time | `tenant_terminology` |

**Do not conflate them.** A tenant renaming "Customer" to "Patient" must never touch a column name. Physical renames happen for our clarity; displayed renames happen for theirs.

---

## 02 — Physical renames: the generic-engine normalisation

Derived from the verified engine table in `VENQORE_FINAL_IMPLEMENTATION_BLUEPRINT.md` §03.3. Ordered by risk, lowest first.

### 02.1 — The rename ledger

| # | Today | Becomes | Risk | Notes |
|---|---|---|---|---|
| R-1 | `App\Services\LedgerService` | `App\Queries\PartyBalanceQuery` | 🟢 | 17 call sites, mechanical. Covered in §02. |
| R-2 | `App\Services\V3\*` | `App\Engines\*` | 🟢 | ~60 `use` statements. Do in one commit. |
| R-3 | `kitchen_orders` | `work_orders` + `kind` column (`kitchen`\|`job`\|`repair`\|`prep`) | 🟠 | Feeds §03 directly — the Job engine *is* this table generalised |
| R-4 | `restaurant_tables` + `ParkedSale` | **one** `occupancies` table | 🔴 | **DUP-1. Highest value, highest risk. Do it before Services.** |
| R-5 | `custom_charges` | `ad_hoc_lines` | 🟢 | Service fee, delivery, consultation fee, late fee |
| R-6 | `recipes` / `recipe_ingredients` | `compositions` / `composition_items` | 🟠 | 685-LOC `ManufacturingService` is the largest consumer |
| R-7 | `warehouses` | keep the table, rename the *concept* to **Location** in terminology only | 🟢 | Physical rename not worth the churn; the term key does the work |
| R-8 | `payment_allocations` + `transaction_allocations` | **one** `allocations` table | 🔴 | DUP-5. `CLAUDE.md` documents a live bug caused by this. |
| R-9 | Dead `transactions` table + 19-line `Transaction` model | **retire** | 🟢 | One write site: `WooCommerceController:209`. `CLAUDE.md` wrongly calls it the core model — correct that too. |

### 02.2 — R-4, the Occupancy unification, in detail

This is the one that must not be skipped, and it must happen **before** §03 adds job bays or §06 adds salon chairs. Otherwise you build a third copy of the same idea.

Both tables model the identical concept: *a labelled, resumable working session, optionally attached to a physical position.*

```sql
CREATE TABLE occupancies (
    id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    tenant_id       BIGINT UNSIGNED NOT NULL,
    position_id     BIGINT UNSIGNED NULL,      -- FK positions.id; NULL = no physical position
    label           VARCHAR(120) NOT NULL,     -- "Ahmed", "Table 4", "Bay 2", "Job #118"
    session_data    JSON NULL,                 -- was ParkedSale.cart_data
    party_id        BIGINT UNSIGNED NULL,      -- optional counterparty
    opened_by       BIGINT UNSIGNED NOT NULL,
    opened_at       TIMESTAMP NOT NULL,
    expires_at      TIMESTAMP NULL,
    closed_at       TIMESTAMP NULL,
    source_type     VARCHAR(40) NULL,          -- polymorphic close target
    source_id       BIGINT UNSIGNED NULL,
    INDEX (tenant_id, closed_at),
    INDEX (tenant_id, position_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE positions (
    id          BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    tenant_id   BIGINT UNSIGNED NOT NULL,
    zone        VARCHAR(80) NULL,              -- floor, room, workshop area
    code        VARCHAR(40) NOT NULL,          -- "T4", "BAY-2", "CHAIR-1"
    capacity    SMALLINT NULL,
    status      ENUM('available','occupied','out_of_service') DEFAULT 'available',
    sort_order  INT DEFAULT 0,
    UNIQUE (tenant_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

> **MariaDB 10.5.** `utf8mb4_unicode_ci`, never `utf8mb4_0900_*`. No `SKIP LOCKED`, no `JSON_TABLE`.

**Migration path — four deploys, each individually invisible:**

1. **Deploy A.** Create `occupancies` + `positions`. Backfill from both `parked_sales` and `restaurant_tables`. Dual-write: every existing write path also writes to the new tables. Old tables remain the read source. *Nothing changes.*
2. **Deploy B.** Shadow-read: on every read, fetch from both, compare, log any divergence, return the **old** result. Run for 7 days with zero divergence logged. *Nothing changes.*
3. **Deploy C.** Flip the read source to `occupancies`. Keep dual-write. *Nothing changes* — proven by Deploy B.
4. **Deploy D.** Stop dual-writing. Drop `parked_sales` and `restaurant_tables` after a 30-day retention window.

You already have a `RunShadowMigration` console command in the repo. Reuse its pattern rather than inventing one.

**What this unlocks the moment it lands:** restaurant table, salon chair, workshop bay, clinic room, coworking desk, held prescription, hotel folio — all one capability with different terminology and a different `positions` seed. Zero further engine work.

### 02.3 — Rename discipline

Every rename in this document follows the same four-step shape, and no rename is allowed to skip a step:

```
1. Add the new name alongside the old        → nothing changes
2. Dual-write / alias, old name still reads  → nothing changes
3. Shadow-compare for ≥7 days, zero diffs    → nothing changes
4. Flip reads, then remove the old name      → nothing changes
```

A rename that goes straight from step 1 to step 4 is a rewrite wearing a rename's costume.

---

## 03 — The capability registry

Reuses the finding from Audit II: **`tenant_plan_overrides` already exists** and `PlanRepository::getEffectiveLimit()` already consults it *before* the plan, with `override_key`, `original_value`, `applied_by`, `expires_at`, a unique constraint per (tenant, key), 5-minute caching and fail-closed defaults, feeding 134 route enforcement points. **`PlanFeatureMatrixSeeder` already catalogues 269 named capabilities in 12 groups.**

> **The composition engine is roughly 70% built and was labelled a SuperAdmin support tool.** Extend it. Do not build a second one.

### 03.1 — Three new tables, nothing more

```sql
-- 1. The registry: promote PlanFeatureMatrixSeeder from a seeder to a table
CREATE TABLE capabilities (
    `key`          VARCHAR(64) PRIMARY KEY,   -- identical strings to today's keys
    group_key      VARCHAR(32) NOT NULL,      -- the 12 existing groups
    label          VARCHAR(120) NOT NULL,
    description    TEXT NULL,
    icon           VARCHAR(48) NULL,
    kind           ENUM('capability','limit','marketing') NOT NULL,
    is_composable  TINYINT(1) NOT NULL DEFAULT 0,
    requires       JSON NULL,                 -- ["products","inventory"]
    conflicts      JSON NULL,
    provides_nav   JSON NULL,                 -- nav node descriptors
    provides_cards JSON NULL,                 -- dashboard widget keys
    provides_terms JSON NULL,                 -- terminology slots it owns
    min_plan       VARCHAR(24) NULL,
    status         ENUM('live','beta','soon') NOT NULL DEFAULT 'live',
    sort_order     INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Search index — mirrors the proven product_search_index pattern exactly
CREATE TABLE capability_search_index (
    capability_key VARCHAR(64) PRIMARY KEY,
    name_norm      VARCHAR(191) NOT NULL,
    name_soundex   VARCHAR(32) NULL,
    name_metaphone VARCHAR(64) NULL,
    aliases        TEXT NULL,      -- 'stock, goods, items, godown, maal'
    tokens         TEXT NULL,
    embedding      BLOB NULL,      -- 256 floats, optional
    FULLTEXT (tokens)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Terminology
CREATE TABLE tenant_terminology (
    tenant_id  BIGINT UNSIGNED NOT NULL,
    term_key   VARCHAR(48) NOT NULL,
    singular   VARCHAR(80) NOT NULL,
    plural     VARCHAR(80) NOT NULL,
    updated_by BIGINT UNSIGNED NULL,
    updated_at TIMESTAMP NULL,
    PRIMARY KEY (tenant_id, term_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Configuration state itself adds no table.** `tenant_plan_overrides.override_key` = capability key, `override_value` = `'1'`/`'0'`. Audit trail, expiry and cache come free.

### 03.2 — Resolution order — deliberately unchanged

```
capability_state(tenant, key) =
   1. tenant_plan_overrides    ← what the user chose
   2. plan_limits              ← what the plan permits at all
   3. config/plans.php         ← last-resort fallback
   4. deny                     ← fail closed
```

The **plan** answers *may they have it*. The **override** answers *did they choose it*. Active requires both. That distinction is what lets exactly one capability be a hard wall (the double-entry ledger) while everything else composes freely.

### 03.3 — Three defects to fix, precisely

| Fix | Change | Why it blocks composition |
|---|---|---|
| **F-1** | `PlanRepository::featuresFor()` must iterate the `capabilities` table, not `getLimits($tenant->plan)` | Today a capability overridden **on** but outside the plan's key set is permitted by the backend and invisible in the UI. This alone breaks composition. |
| **F-2** | Add `plan.feature:` guards to `routes/api.php` — currently **zero** | A hidden capability must be genuinely unreachable, not merely unlinked. Without this, hide-not-lock is a security hole. |
| **F-3** | Wire the ~40 composable keys that have no enforcement point at all | A toggle that changes nothing is worse than no toggle |

**F-2 is the one that must not slip.** The new UI hides capabilities instead of showing them locked. Hiding a menu item whose API route is open is not a feature, it is a vulnerability. **Enforce before you hide.**

### 03.4 — Also guard jobs, exports and offline sync

Route middleware is not the whole surface. Add the same check to:

- queued jobs (`app/Jobs/`) — a job that runs after a capability is switched off must fail closed
- Excel exports (`app/Exports/`) and imports (`app/Imports/`)
- the offline sync endpoint (`Api/SyncController`) — the Dexie client caches whatever it is given
- scheduled commands (`woocommerce:sync-stock`, recurring invoice generation, depreciation)

---

## 04 — Dependency graph

Derived from real imports and schema, not invented:

```
double_entry_ledger ──┬── expense_manager
                      ├── customer_khata ── aged_receivables ── customer_statements
                      ├── supplier_khata ── aged_payables
                      ├── bank_reconciliation
                      └── profit_loss / trial_balance / cash_flow

products ─────┬── inventory ──┬── fifo_costing ── (ledger)
              │               ├── batch_tracking ── batch_expiry
              │               ├── serial_lifecycle
              │               ├── locations ── stock_transfer
              │               └── stock_take_audit
              ├── product_variants
              ├── composition ── production ── auto_assembly
              └── barcode_label_factory

parties ──────┬── customers ── loyalty / wallet / gift_cards
              ├── suppliers ── purchase_orders ── landing_costs
              └── employees ── attendance ── summaries

pos ──────────┬── occupancy            (R-4)
              ├── split_payments / cash_rounding / daily_cash_audit
              └── webusb_printing

services ─────┬── work_orders          (R-3, see 03_SERVICES)
              ├── technicians ── employees
              └── contracts ── recurring_invoices
```

**Three rules that fall straight out of the graph:**

1. **The ledger is the one hard wall.** Everything financial depends on it and it can never be switched off. Every *other* capability composes.
2. **Enabling a capability enables its `requires` closure**, and the user is shown that closure before confirming, not after.
3. **Disabling a capability with dependents is refused**, with the dependent list named. Never silently cascade a disable — that is how a tenant loses their ageing report because they turned off "khata".

---

## 05 — Terminology system

### 05.1 — Architecture: the smallest thing that works

**Server:** `App\Support\Terms::get($key)` reads `tenant_terminology` through the existing settings cache, falls back to the canonical English in `capabilities.provides_terms`.
**Client:** the resolved map is shared once via `HandleInertiaRequests::share()` — the same place `Appearance::forRequest()` is already shared — and consumed by a `t()` helper.

```js
// resources/js/lib/terms.js
import { usePage } from '@inertiajs/react';

export function useTerms() {
    const map = usePage().props.terms ?? {};
    return {
        t:  (key, fallback) => map[key]?.singular ?? fallback ?? key,
        tp: (key, fallback) => map[key]?.plural   ?? fallback ?? key,
    };
}
```

**With an empty map, `t('customer', 'Customer')` returns `"Customer"`.** That is what makes the whole conversion invisible.

### 05.2 — The starting 25 term keys

```
customer · supplier · product · service · category · stock · location
sale · purchase · invoice · quotation · order · return · payment
expense · staff · shift · attendance · occupancy · position
job · technician · contract · report · dashboard
```

### 05.3 — Worked example: one engine, five businesses, zero new code

| Term key | Retail | Restaurant | Pharmacy | Electrician | Repair shop |
|---|---|---|---|---|---|
| `customer` | Customer | Guest | Patient | Client | Customer |
| `product` | Product | Item | Medicine | Material | Part |
| `service` | — | — | — | Service | Repair |
| `occupancy` | Held sale | Table | Held Rx | Site visit | Job in bay |
| `position` | — | Table | Counter | — | Bay |
| `job` | — | Ticket | — | Job | Repair job |
| `technician` | — | — | — | Electrician | Technician |
| `stock` | Stock | Inventory | Stock | Van stock | Parts stock |

**Same tables. Same services. Same ledger.** Everything above is rows in `tenant_terminology`.

### 05.4 — Conversion scope and the rule that keeps it safe

Roughly **450 edit sites** across the existing pages. Every one is a mechanical `"Customer"` → `{t('customer', 'Customer')}`.

> **Terminology parity test:** snapshot every converted page with an **empty** terminology map and assert **zero rendered string diffs**. Any diff is a typo in the conversion, not a feature. This runs on every commit.

---

## 06 — Navigation from the registry

Today's navigation is a hard-coded JSX array in which five of ten top-level items cannot be turned off, and unavailable items render **locked** rather than hidden.

**Target:** the nav tree is computed from `capabilities.provides_nav` filtered by the tenant's resolved capability state and the user's role.

**Making it invisible:** with the registry seeded so every existing tenant resolves to "everything their plan allows" — today's answer — the computed tree must be **byte-identical** to the hard-coded array. That is the nav parity suite: 8 reference tenants × 7 roles = 56 comparisons, on every commit.

**Hide vs lock — the rule.** Once F-2 lands and hidden means unreachable:

- Capability the tenant **chose off** → **hidden**. It is not part of their business.
- Capability their **plan does not include** → **shown, locked, with an upgrade path**. This is a sales surface and hiding it costs revenue.

The distinction is what makes a composed ERP feel bespoke rather than crippled.

**Performance.** Today's static array is free; resolution is not. Cache the resolved nav tree keyed on `tenant + role + capability-set hash`, on the same 300-second cache `featuresFor()` already uses. Measure p95 during the soak, not after.

---

## 07 — Dashboard composition

**The storage already exists.** `2026_08_08_000001_create_experience_preference_tables.php` created both `user_preferences` and `dashboard_layouts` three days ago, and both are well designed:

```php
dashboard_layouts:  tenant_id · user_id · dashboard_key(40) · layout(longText) · timestamps
                    UNIQUE (tenant_id, user_id, dashboard_key)
                    // dashboard_key: "only 'workspace' exists today; the column is
                    // here so a second configurable surface does not need a schema change"

user_preferences:   user_id · tenant_id(nullable) · key(64) · value(longText)
                    UNIQUE (user_id, tenant_id, key)
                    // nullable tenant_id = the user's account-wide default
```

`longText` rather than a `json` column is the right call on MariaDB 10.5, and it is already documented in the migration.

**Two changes, both small:**

| # | Change | Why |
|---|---|---|
| **R-10** | Rename `dashboard_layouts` → `layout_preferences`, `dashboard_key` → `surface` | The table is already generic; only its name is not. Surfaces in V1: `workspace`, `pos`, and one per list view. The table is three days old and has no production rows — rename it now, before it has history. |
| **R-11** | Add a nullable `role` to the unique key, and allow `user_id = NULL` for the store default | Needed so an owner can set a default arrangement that seeds new staff without overriding a choice someone already made — the same precedence `Appearance` already implements |

**Then the real work, which is not storage:** split `DashboardController` so each widget resolves independently. Today it is one method computing everything, which means a tenant without `inventory` still pays for the stock queries and one widget's exception blanks the whole page.

**Default with no row must render today's dashboard exactly** — that is the dashboard parity test.

---

## 08 — What is already built — do not rebuild it

Verified in the code on 11 August 2026. Blueprint V2 listed several of these as work items; they are done.

| Blueprint V2 item | Actual state |
|---|---|
| Emit all themes as scoped CSS blocks | ✅ Done — generator emits `[data-vq-theme="…"]` blocks |
| Server-render the theme attribute before first paint | ✅ Done — `Appearance::htmlAttributes()` → `app.blade.php` |
| Tenant custom-colour override block | ✅ Done — `applyAppearance()` in `app.jsx`, synchronous, pre-render, with an 11-stop perceptual ramp from `theme/color.js` |
| `ui_version` column on `tenants` | ⚠️ **Partially** — implemented as `Appearance::EXPERIENCES = ['classic','new']`, stored per **user** in `user_preferences`, not per tenant |
| Theme resolution precedence | ✅ Done — user-per-store → user-account-wide → store default → system default |
| New shell scaffold | ⚠️ Started — `Pages/Workspace/Dashboard.jsx`, `Pages/Workspace/Overview.jsx`, `WorkspaceDashboardController` |

**The two remaining pieces:**

1. **Promote `experience` to tenant level.** Add `tenants.experience` (default `'classic'`) as the tenant default, keeping the per-user preference as an override. Rollout rings need a tenant-level switch; a per-user-only switch cannot express "this whole store is on the new experience".
2. **Re-verify the three retired themes.** `Appearance::THEMES` is currently pinned to `['midnight-nebula','daylight-calm']` with an honest comment: *Minimal, Classic and Colour were built but never verified across all screens.* That comment is right. Re-verifying them is part of §04's screen work, not a separate project, and they stay out of `THEMES` until every screen in the new UI has been looked at in each.

Also note `Appearance::sanitize()` currently **pins** font, density and radius to their defaults regardless of input. That was the right call while the picker was withdrawn. Unpinning them is a §04 decision, gated on the same per-screen verification.

---

## 09 — Acceptance criteria

**Physical**

- [ ] R-1 … R-9 complete, each via the four-step rename discipline
- [ ] `occupancies` + `positions` live; `parked_sales` and `restaurant_tables` dropped after 30-day retention
- [ ] One `allocations` table; the `CLAUDE.md` allocation warning removed as obsolete
- [ ] Dead `transactions` table retired; `CLAUDE.md` corrected

**Registry**

- [ ] `capabilities` seeded from `PlanFeatureMatrixSeeder`, all 269 keys classified `capability`/`limit`/`marketing`
- [ ] `is_composable` set deliberately per key, not defaulted in bulk
- [ ] Dependency `requires`/`conflicts` populated from the §04 graph
- [ ] F-1, F-2, F-3 closed
- [ ] Jobs, exports, imports, offline sync and scheduled commands all guarded

**Parity — the evidence that earns the reveal**

- [ ] **Enforcement parity:** tenant with zero override rows → every capability resolves to today's boolean
- [ ] **Nav parity:** 8 reference tenants × 7 roles, registry vs legacy array, byte-identical
- [ ] **Terminology parity:** empty map → zero rendered string diffs
- [ ] **Dashboard parity:** no `dashboard_layouts` row → today's exact widgets and order
- [ ] **Theme parity:** `[data-vq-theme="midnight-nebula"]` byte-identical to today's output
- [ ] p95 page latency within 10% of the pre-change baseline
- [ ] Zero support tickets attributable to any of this work

**Estimate:** 5–7 weeks solo with AI assistance; 3–4 weeks with one engineer. R-4 (Occupancy) is roughly a third of it and should not be compressed.
