# VenQore Prelaunch Audit Ledger & Inventory Accounting

**Audit Date:** September 12, 2026  
**Auditor:** Principal Product Engineer & Independent Prelaunch Auditor  
**Corpus / Workspace:** `AbdullahHashmi10/VenQore`  
**Git Commit ID:** `4980a8cb` (Branch: `v6-design-system-completion`)  
**Working Tree State:** 18 modified dirty files preserved untouched  
**Test Database:** `amd_pos_test` (MariaDB 10.11, 207 tables)  
**PHP Environment:** PHP 8.2.23 (cli) (`lightning-services/php-8.2.23+0`)

---

## 1. Complete System Denominators

Every calculation in this audit is grounded in verified, machine-generated inventory counts.

| Architectural Dimension | Total Inventory Count | Verified Breakdown / Status | Source File |
| :--- | :--- | :--- | :--- |
| **Modules Total** | **46** | 43 Live, 2 Beta (`landed_cost`, `composite_items`), 1 Building (`quotations`) | `config/modules.php` |
| **Discovery Capabilities** | **17** | 10 Clean, 4 Mismatched/Dropped (`table_service`, `serials`, `khata_credit`, `multi_location`), 3 Phantom/Incomplete | `app/Services/AiBuilder/CapabilityRegistry.php` |
| **Unmapped Live Modules** | **16** | 16 live modules have ZERO capability questions in discovery | `CapabilityRegistry.php` vs `modules.php` |
| **Builder Presets** | **23** | 23 predefined business archetypes | `config/ai_builder.php` |
| **Business Taxonomy** | **85** | 85 business types across 5 sectors (Retail, Services, Food, Manufacturing, Wholesale) | `app/Services/AiBuilder/BusinessCatalogue.php` |
| **Application Routes** | **766** | 766 registered HTTP routes | `routes/web.php` & `routes/api.php` |
| **Unclaimed Gated Routes** | **4** | 4 critical operational routes bypass `EnsureModule` (`new-pos`, `new-invoice`, `tables/state`, `manufacturing-rules`) | `inventory.json` & `http-probes.json` |
| **Dashboard Readings** | **60** | 60 atomic business readings defined in Reckoner | `app/Reckoner/ReckonerRegistry.php` |
| **Standard Reports** | **65** | 65 reporting views across Sales, Inventory, Finance, Production, Tax | `app/Http/Controllers/ReportsController.php` |
| **Audited Surfaces** | **144** | 46 Main Nav, 24 Sub-Tabs, 14 API/Web Routes, 60 Dashboard Cards | `SURFACE_COVERAGE.csv` |

---

## 2. Test Execution & Empirical Accounting

| Verification Suite | Denominator / Runs | Passed | Failed / Leaked | Assertions | Environment |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Canonical Unit Tests** | 27 tests | 27 | 0 | 211 assertions | PHPUnit (`tests/Unit/AiBuilder/`) |
| **Canonical Feature Tests** | 72 tests | 72 | 0 | 7,598 assertions | PHPUnit (`tests/Feature/Module/`) |
| **Audit Engine Probes** | 14 test probes | 14 | 0 | 56 invariants | `engine-probes.php` -> `engine-probes.json` |
| **Audit HTTP Probes** | 21 HTTP requests | 15 passed | 6 leaked | 42 response checks | `http-probes.php` -> `http-probes.json` |
| **Audit Launch Scenarios** | 14 personas | 9 passed | 5 failed/leaked | 84 runtime checks | `scenarios-probe.php` -> `scenarios-results.json` |
| **Total Test Operations** | **148 test runs** | **137** | **11** | **7,991 assertions** | Dedicated `amd_pos_test` |

---

## 3. Findings Ledger: Severity & Verification Status

| Finding ID | Description | Severity | Verification Status | Deliverable Reference |
| :--- | :--- | :--- | :--- | :--- |
| **F-01** | API routes `/api/*` lack `EnsureModule` middleware in `bootstrap/app.php`. | **CRITICAL** | `verified-fail` | `FIX_PLAN.md` (Blocker 1) |
| **F-02** | Unclaimed routes (`/new-pos`, `/tables/state`, `/manufacturing-rules`) return HTTP 200 on disabled modules. | **CRITICAL** | `verified-fail` | `FIX_PLAN.md` (Blocker 2) |
| **F-03** | Sub-navigation tabs (`StockModuleTabs`, `SellModuleTabs`, etc.) render disabled modules unconditionally. | **HIGH** | `verified-fail` | `FIX_PLAN.md` (Blocker 3) |
| **F-04** | `CapabilityRegistry` uses phantom keys, silently dropping `table_service`, `serials`, `khata_credit`, `multi_location`. | **HIGH** | `verified-fail` | `DISCOVERY_COVERAGE.md` |
| **F-05** | `WorkspaceBuilderController::provision()` accepts unauthenticated client module payloads without session validation. | **HIGH** | `verified-fail` | `FIX_PLAN.md` (Blocker 5) |
| **F-06** | `DiscoverySession::finalizeProposal()` forcibly clamps confidence to `max(0.90, readiness)`. | **MEDIUM** | `verified-fail` | `CLAIMS_VS_REALITY.md` |
| **F-07** | Cashier role can access administrative `/s/{slug}/settings` (HTTP 200). | **HIGH** | `verified-fail` | `SCENARIO_RESULTS.md` (Scenario 12) |
| **F-08** | 16 live modules have zero discovery questions or capability representations. | **MEDIUM** | `verified-fail` | `DISCOVERY_COVERAGE.md` |
| **F-09** | `TenantDefaultSeeder` hardcodes stock valuation and product metrics onto solo tenant dashboards. | **MEDIUM** | `verified-fail` | `SCENARIO_RESULTS.md` (Scenario 01) |
| **F-10** | `EnsureModule` and `EnsurePlanFeature` explicitly bypass checks when slug is `test-store`. | **MEDIUM** | `verified-fail` | `FIX_PLAN.md` (Fast-Follow 10) |

---

## 4. Residual Risks

1. **Test Suite Blindspot (`test-store` slug):** Because existing tests use `test-store`, they run with middleware bypassed, masking permission and module errors in CI.
2. **Untested Native Mobile & Desktop Clients:** The Flutter mobile app (`app-code/mobile-app`) and Electron wrapper (`app-code/windows-app`) rely on `/api/*`. With API module gating missing, native clients are exposed to all backend routes.
3. **Database Migration State:** `amd_pos_test` contains 207 tables. Legacy tenants with 0 rows in `tenant_modules` fail open safely, but have no telemetry tracking their migration status.

---

## 5. Resumption Instructions for Successor Auditors

To reproduce this audit or verify remediations after fixes are applied:
1. **Environment Setup:**
   Ensure PHP 8.2 is in PATH:
   ```bash
   export PATH="C:\Users\PC\AppData\Roaming\Local\lightning-services\php-8.2.23+0\bin\win64:$PATH"
   ```
2. **Database Verification:**
   Verify connection to `amd_pos_test`:
   ```bash
   php app-code/main-app/docs/prelaunch-audit-2026-09-12/db-check.php
   ```
3. **Re-Run Inventory & Probes:**
   ```bash
   cd app-code/main-app/docs/prelaunch-audit-2026-09-12
   php inventory.php
   php engine-probes.php
   php http-probes.php
   php scenarios-probe.php
   ```
4. **Regenerate CSV Deliverables:**
   ```bash
   node generate-module-traceability.cjs
   node generate-surface-coverage.cjs
   ```
5. **Verify Zero Data Mutations:**
   Ensure `git status` reflects only the original 18 dirty files and that all test tenant rows in `amd_pos_test` were rolled back.
