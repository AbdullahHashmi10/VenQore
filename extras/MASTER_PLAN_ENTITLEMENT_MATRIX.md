# Master Plan × Feature Entitlement Matrix

**Source:** `database\seeders\PlanFeatureMatrixSeeder.php` (the runtime source of truth — see `PLAN_ENTITLEMENT_SOURCE_OF_TRUTH.md`), cross-referenced against `config\plans.php`, `app\Services\PlanRepository.php`, and route middleware in `routes\web.php`.

**Legend:** ✅ included · ❌ not included · 🔒 gated behind add-on/override (built, but off by default) · ➕ add-on purchase required · 📈 usage-limited (number shown) · ♾ unlimited

Plans: **Counter** (entry, non-standard override tier) · **Starter** · **Growth** · **Business**. (Trial mirrors Starter-ish limits at lower caps; LTD tiers `ltd_1/ltd_2/ltd_3` map roughly to Starter/Growth/Business — see §LTD below.)

---

## Core limits

| Item | Counter | Starter | Growth | Business |
|---|---|---|---|---|
| SKU limit | 📈 500 | 📈 1,000 | 📈 10,000 | 📈 50,000 |
| Staff/user seats | 📈 2 | 📈 3 | 📈 10 | 📈 50 |
| Locations (warehouses) | 📈 1 | 📈 1 | 📈 3 | 📈 10 |
| Multi-branch operations | ❌ 0 | ❌ 0 | 📈 3 | 📈 10 |
| Transactions/month | — (see LTD) | ♾ null | ♾ null | ♾ null |
| Cart tabs (POS) | — | 📈 3 | 📈 10 | 📈 50 |
| Reports tier | basic | basic | advanced | advanced |
| Industry templates | 16 | 16 | 16 | 16 |

## Feature × Plan

| Feature | Counter | Starter | Growth | Business |
|---|---|---|---|---|
| POS core | ✅ | ✅ | ✅ | ✅ |
| Sales | ✅ | ✅ | ✅ | ✅ |
| Purchases | ✅ (per seeder overrides list, `purchase_orders` explicitly disabled for Counter — general purchases module itself not in the disabled-key list, i.e. base purchase recording ✅, but purchase *orders* ❌) | ✅ | ✅ | ✅ |
| Purchase Orders | ❌ (explicit Counter override) | ✅ | ✅ | ✅ |
| Expenses | ✅ | ✅ | ✅ | ✅ |
| Customer Khata / ledger | ❌ (explicit Counter override) | ✅ | ✅ | ✅ |
| Double-entry ledger | ❌ (explicit Counter override) | ✅ | ✅ | ✅ |
| Suppliers directory | ❌ (explicit Counter override) | ✅ | ✅ | ✅ |
| Manufacturing — Bill of Materials | ❌ (Counter override, **except** carve-out: food-prep industries get it via `PlanRepository::canUseFeature()` special case) | ❌ | ✅ | ✅ |
| Manufacturing — Production module | ❌ (Counter override) | ❌ | ✅ | ✅ |
| Auto-assembly logic / production simulator / recipe history archival | ❌ | ❌ | ✅ | ✅ |
| Multi-warehouse / stock transfer | ❌ | ❌ | ✅ | ✅ |
| Batch tracking / batch expiry | ❌ | ❌ | ✅ | ✅ |
| Barcode label factory/print, QR labels | ❌ | ❌ | ✅ | ✅ |
| IMEI scanner / IMEI lifecycle | ❌ | ❌ | ❌ | ✅ |
| Bank reconciliation | ❌ (Counter override) | ❌ | ✅ | ✅ |
| Fiscal year closing / fixed-asset depreciation | ❌ (Counter override) | ❌ | ❌ | ✅ |
| Loyalty points / digital gift cards | ❌ (Counter override) | ❌ | ❌ | ✅ |
| Wholesale pricing / B2B proposal builder | ❌ (Counter override) | ❌ | ❌ | ✅ |
| Marketing campaigns | ❌ (Counter override) | ❌ | ✅ | ✅ |
| Recurring invoices / invoice reminders | ❌ (Counter override) | ❌ | ✅ | ✅ |
| Fund management | ❌ (Counter override) | ❌ | ✅ | ✅ |
| CRM | Not found as a distinct seeded key under this exact name — behavior derives from Customer Khata/Marketing Campaigns/loyalty keys above; no single `crm` key located in the seeder. **Cannot confirm a unified "CRM" gate exists** — flag as unclear, likely bundled across several of the keys above rather than one feature. | | | |
| Reports — basic set | ✅ | ✅ | ✅ | ✅ |
| Reports — advanced/Report Builder | ❌ | ❌ | ✅ | ✅ |
| Reports — full catalog (43 seeded `report_*`/aliased keys; 52 actual `/reports/*` routes) | subset only | subset only | most | all |
| Dashboards (standard) | ✅ | ✅ | ✅ | ✅ |
| Dashboard — Owner's Daily Pulse | ❌ (Counter override) | ❌ | ✅ | ✅ |
| White-label / custom branding | ❌ (Counter override) | ❌ | ❌ | ✅ |
| Dedicated account manager / white-glove onboarding / priority + phone support | ❌ (Counter override) | ❌ | ❌ | ✅ |
| Chat support | — | ❌ | ✅ | ✅ |
| Security / activity log | — | ❌ | ❌ | ✅ |
| Soft-delete trash / demo sandbox cloner / sandbox time-shift | — | ❌ | ✅ | ✅ |
| Bulk upload | ❌ (Counter override) | ❌ | ✅ | ✅ |
| API access | ❌ | ❌ | ❌ | ✅ |
| WooCommerce sync | 🔒➕ (off for ALL plans by design — explicit owner decision 2026-07-04, sold as add-on via `TenantPlanOverride` only) | 🔒➕ | 🔒➕ | 🔒➕ |
| Growth Engine (AI retention) | 🔒➕ (off for ALL plans by design, same pattern as WooCommerce — see dedicated section below) | 🔒➕ | 🔒➕ | 🔒➕ |
| Smart Capture / Managed AI (general) | 🔒➕ off by default; on LTD tiers hard-blocked unless tenant supplies own API key (BYOK) | 🔒➕ | 🔒➕ | 🔒➕ |
| AI pages/queries quota (Counter-specific numeric caps found) | 📈 10 pages / 📈 50 queries (Counter override values) | not separately itemized in evidence gathered — likely add-on metered, not a base-plan number | same | same |
| AI churn predictions / AI revenue forecasting / AI outreach copy / AI assistant | 🔒➕ (all AI features are add-on-gated per `PlanRepository` design, not plan-tier bundled) | 🔒➕ | 🔒➕ | 🔒➕ |
| Automation (marketing/campaign automation) | ❌ (Counter override — `marketing_campaigns`) | ❌ | ✅ | ✅ |
| Forecasting (AI revenue forecasting) | 🔒➕ | 🔒➕ | 🔒➕ | 🔒➕ |
| Backups | No dedicated `backup` key found in the reviewed portion of the seeder — **not confirmed in code**, do not assume either inclusion or exclusion. |
| Offline mode (POS Dexie.js) | Not gated by a `plan_limits` key found in this search — POS offline caching appears to be a core architectural feature (per `CLAUDE.md`) rather than plan-gated. **Not confirmed as plan-gated or ungated by direct code evidence in this audit; flagged for follow-up.** |
| Audit logs | See "Security / activity log" row above (Business only). |
| Staff permissions (RBAC) | Appears to be a separate permission system (`permission:` middleware seen alongside `plan.feature:` in routes, e.g. `permission:reports.summary`) — i.e., **permissions and plan entitlement are two different, stacked middleware layers**, not the same thing. Not further itemized here as it's a distinct system from plan gating. |
| Notifications | Not found as a distinct seeded plan key in evidence gathered. Not confirmed. |
| Scheduled reports | Not found as a distinct seeded plan key in evidence gathered. Not confirmed. |
| Storage limits | No dedicated storage-quota key found in the reviewed portion of the seeder. Not confirmed. |
| Mobile access | No plan-gating key found; `amd_erp_mobile` exists as a separate app directory at repo root but its entitlement wiring (if any) was not investigated in this pass — out of scope of files searched. |
| VenSynQ | Referenced extensively in root-level planning docs (`VenSynQ_Corrected_Plan.md`, etc.) but **no `vensynq` plan-gating key was located** in `PlanFeatureMatrixSeeder.php` in the evidence gathered. Cannot confirm whether VenSynQ is plan-gated at all today — flag as unclear and worth a direct follow-up grep before making claims to the founder either way. |

> Cells marked "not found" / "not confirmed" reflect the boundary of what the research pass actually read — they are not asserted as absent from the codebase, only as absent from the evidence collected. A follow-up pass should specifically grep for `vensynq`, `backup`, `notification`, `scheduled_report`, `storage_limit`, `crm` as literal seeder keys to close these gaps before this matrix is treated as 100% complete.

---

## LTD (AppSumo Lifetime Deal) tiers

| | ltd_1 | ltd_2 | ltd_3 |
|---|---|---|---|
| Roughly equivalent to | Starter | Growth | Business |
| Stacking | 1 code ($79) | 2 codes ($158) | 3 codes ($237), max 3/account |
| Transactions/month cap | 1,000 (legacy alt: 500) | 3,000 (legacy alt: 2,000) | 8,000 (legacy alt: 6,000) |
| Growth Engine | 🔒➕ (inherits the all-plan `'0'` default — not itemized as an LTD override in Group 10 of the seeder) |
| Smart Capture / Managed AI | Hard-blocked unless tenant configures BYOK API key (`smartcapture_api_key`/`gemini_api_key`/`openai_api_key` in `Setting`) — explicit comment: *"T8-3: Managed AI is hard-blocked on all LTD plans unless tenant provided their own API key (BYOK mode)."* |

`Tenant::effectivePlan()` derives the specific LTD tier from `plan_limits['transactions_per_month']` thresholds. The presence of both current (1000/3000/8000) and legacy (500/2000/6000) threshold values in the matcher suggests transaction caps were changed at some point and old values were retained for backward compatibility with existing tenants — not flagged as a bug, but worth a one-line confirmation from the team on whether any live tenants still carry the legacy caps.

---

## Growth Engine Investigation (dedicated section)

**Question: is Growth Engine bundled, add-on, hidden, or inconsistently gated?**

**Answer from code: it is architecturally an add-on (off by default on every base plan, unlockable only via a per-tenant `TenantPlanOverride`), but marketing and in-app billing surfaces represent it as bundled into Growth/Business — this is a direct, evidenced contradiction, not a judgment call.**

Backend (consistent within itself):
- `database\seeders\PlanFeatureMatrixSeeder.php` line 314: `'growth_engine' => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '0']`
- `config\plans.php`: every plan sets `'growth_engine' => false`, annotated `// AI add-on key — off by default on all plans (matches seeder)`.
- `resources\js\Pages\SuperAdmin\Plans\featureGroups.js` (~line 1748): mirrors the same all-`"0"` state.
- `routes\web.php:1150`: `Route::middleware(['permission:reports.summary', 'plan.feature:growth_engine'])` — real backend enforcement; without an override, no standard-plan tenant reaches the feature.

Frontend/marketing (contradicts the backend in three separate places):
1. `resources\js\Pages\Marketing\Pricing.jsx` (line 545) and `WhatIsIncluded.jsx` (line 545) name the **Growth subscription tier itself** `"Growth Engine"` — a naming collision with the AI feature of the same name, independent of the entitlement bug.
2. `resources\js\Pages\WhatIsIncluded.jsx` (line 162): `<Feature label="Growth Engine (AI Retention)" starter={false} growth={true} business={true} />` — tells prospects Growth and Business **include** it.
3. `resources\js\Pages\Billing\Index.jsx` `FEATURE_UPGRADE_TARGET` (line 43): `growth_engine: 'growth'` — tells an existing Starter-tier customer in the billing UI that upgrading to Growth unlocks Growth Engine.
4. `resources\js\Components\UpgradeModal.jsx` (line 84, 119) references "Growth Engine (AI retention)" in a feature list and defines its own `growth_engine: { icon: '✨', label: 'Growth Engine' }` map — a fifth independent reference point implying it's a normal upgrade target, not an explicit add-on purchase.

**Is it built?** Yes — fully implemented, not vaporware: `app\Services\Growth\GrowthEngine.php` (orchestrator), `app\Http\Controllers\GrowthEngineController.php`, `app\Jobs\RunGrowthEngineForTenant.php`, `app\Console\Commands\RunGrowthEngine.php` (`growth:analyze` scheduled command), `app\Services\Growth\ThresholdTuner.php`, `OutcomeEvaluator.php`, `InsightCatalog.php`, plus a full React UI at `resources\js\Pages\GrowthEngine\GrowthDashboard.jsx` / `Settings.jsx`.

**Practical consequence:** A customer who reads the pricing/what's-included page or the in-app billing upgrade prompt, upgrades specifically to get Growth Engine, will be 403'd by `EnsurePlanFeature` because the plan default is still `'0'` — unless a human manually grants a `TenantPlanOverride`. None of the customer-facing surfaces disclose that this is a separate paid add-on requiring manual provisioning. This is functionally identical to the WooCommerce situation (`Billing/Index.jsx` also wrongly maps `woocommerce: 'growth'` against an explicit backend "not included in any plan" decision).

**Severity: HIGH — this is a revenue-integrity and trust issue, not a cosmetic bug.**
