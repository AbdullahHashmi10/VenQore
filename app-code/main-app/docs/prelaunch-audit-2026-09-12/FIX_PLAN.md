# VenQore Remediation & Fix Plan: Launch Blockers & Fast-Follows

**Audit Date:** September 12, 2026  
**Auditor:** Principal Product Engineer & Independent Prelaunch Auditor  
**Verdict:** **LAUNCH BLOCKED UNTIL P0 REMEDIATIONS ARE VERIFIED**

---

## 1. Overview & Engineering Prioritization

This plan details the exact engineering changes required to bring VenQore into strict compliance with its core product promise. Issues are ordered strictly by risk:
- **P0 Launch Blockers:** Deficiencies that cause silent data exposure, unauthenticated capability tampering, broken customer promises, or major security leaks. Must be fixed and verified before any paying merchant is onboarded.
- **P1 Post-Launch Fast-Follows:** Capability gaps, seeder alignment, and test suite hardening that should be addressed in the first release cycle following launch.

---

## 2. P0 Launch Blockers (Must Fix Prior to Launch)

### Blocker 1: API Middleware Module Gating (Perimeter Defense)
- **Severity:** CRITICAL / HIGH SECURITY
- **Root Cause:** In `bootstrap/app.php` (lines 24-43), the `EnsureModule::class` middleware is registered solely on the `web` middleware group. The `api` middleware group has no module gating. Consequently, any authenticated API token or frontend request calling `/api/*` completely bypasses module restrictions.
- **Affected Endpoints:**
  - `GET /api/pos/search`
  - `POST /api/pos/checkout`
  - `GET /api/work-orders`
  - `POST /api/work-orders`
  - `GET /api/sync/*`
- **Files to Modify:**
  1. `app-code/main-app/bootstrap/app.php`
  2. `app-code/main-app/routes/api.php`
  3. `app-code/main-app/config/modules.php` (add API route names to module definitions)
- **Proposed Code Change:**
  In `bootstrap/app.php`:
  ```php
  $middleware->api(append: [
      \App\Http\Middleware\EnsureModule::class,
  ]);
  ```
  In `routes/api.php`: Assign route names matching `config/modules.php` patterns (e.g. `api.pos.search`, `api.manufacturing.work-orders`).
- **Effort Estimate:** 4 hours
- **Acceptance Criteria:** A tenant with `pos` disabled calling `GET /api/pos/search` receives HTTP 403 Forbidden with `{ "error": "Module pos is not enabled for this store" }`.

---

### Blocker 2: Unclaimed Web Route Gating
- **Severity:** HIGH / PROMISE VIOLATION
- **Root Cause:** In `routes/web.php`, several operational routes are not claimed by any module in `config/modules.php`. In `EnsureModule.php:128`, unclaimed routes fail open: `if ($owners === []) return $next($request);`.
- **Affected Routes:**
  - `/s/{slug}/new-pos` (`store.new-pos`, `routes/web.php:1277`)
  - `/s/{slug}/new-invoice` (`store.new-invoice`, `routes/web.php:1283`)
  - `/s/{slug}/tables/state` (`store.tables.state`, `routes/web.php:1115`)
  - `/s/{slug}/api/manufacturing-rules` (`store.manufacturing.rules`, `routes/web.php:1145`)
- **Files to Modify:**
  1. `app-code/main-app/config/modules.php`
- **Proposed Code Change:**
  - In `config/modules.php` under `'pos'`, add `'store.new-pos'` to `'routes'`.
  - Under `'invoicing'`, add `'store.new-invoice'` to `'routes'`.
  - Under `'table_service'`, add `'store.tables.state'` to `'routes'`.
  - Under `'composite_items'`, add `'store.manufacturing.rules'` to `'routes'`.
- **Effort Estimate:** 1.5 hours
- **Acceptance Criteria:** `GET /s/{slug}/new-pos` on a tenant without POS returns HTTP 403 (or redirect to dashboard with module disabled flash).

---

### Blocker 3: Leaking Sub-Navigation Tabs in React Shell
- **Severity:** HIGH / PRODUCT PROMISE VIOLATION
- **Root Cause:** Unlike `OneGlanceLayout.jsx` and `ReportsNavigation.jsx`, five major resource sub-navigation components render all feature tabs unconditionally without inspecting `props.modules`:
  - `StockModuleTabs.jsx`: Leaks Batch Tracking, Serials, Production, Cookbook, Stock Takes, Transfers, Units.
  - `SellModuleTabs.jsx`: Leaks Quotations, Proposals, Sales Orders, Returns History, Recurring Invoices, E-Invoicing.
  - `PurchaseModuleTabs.jsx`: Leaks Purchase Orders, Debit Notes.
  - `MoneyModuleTabs.jsx`: Leaks Cash Register, Bank Accounts, Reconciliation.
  - `ContactsModuleTabs.jsx`: Leaks Team, Attendance, Summaries.
- **Files to Modify:**
  1. `resources/js/Components/Modules/StockModuleTabs.jsx`
  2. `resources/js/Components/Modules/SellModuleTabs.jsx`
  3. `resources/js/Components/Modules/PurchaseModuleTabs.jsx`
  4. `resources/js/Components/Modules/MoneyModuleTabs.jsx`
  5. `resources/js/Components/Modules/ContactsModuleTabs.jsx`
- **Proposed Code Change:**
  In each component, extract `modules` from Inertia page props:
  ```jsx
  const { modules = [] } = usePage().props;
  const hasModule = (key) => modules.includes(key);

  // Filter tabs array before rendering
  const visibleTabs = tabs.filter(tab => !tab.module || hasModule(tab.module));
  ```
- **Effort Estimate:** 3.5 hours
- **Acceptance Criteria:** A merchant with only `products` enabled visiting `/inventory/list` sees ONLY the "Inventory List" and "Categories" tabs. Tabs for Production, Recipes, Batches, and Serials are omitted.

---

### Blocker 4: CapabilityRegistry Phantom Mappings (Discovery Drops)
- **Severity:** HIGH / INTEGRITY DEFECT
- **Root Cause:** In `CapabilityRegistry.php`, the `'implies_modules'` arrays use phantom or legacy module names that do not exist in `config/modules.php`. In `resolveModules()`, `array_intersect($modules, $liveRegistry)` silently drops them:
  - `table_and_kot_management` -> uses `tables`, `kitchen_display` (real key is `table_service`)
  - `serial_imei_tracking` -> uses `serial_numbers` (real key is `serials`)
  - `customer_khata_credit` -> uses `credit_sales` (real key is `khata_credit`)
  - `multi_branch_warehouses` -> uses `branches` (real key is `multi_location`)
- **Files to Modify:**
  1. `app-code/main-app/app/Services/AiBuilder/CapabilityRegistry.php`
- **Proposed Code Change:**
  Update lines 206, 250, 282, 314 in `CapabilityRegistry.php`:
  ```php
  // multi_branch_warehouses:
  'implies_modules' => ['multi_location', 'stock_transfers', 'inventory'],

  // serial_imei_tracking:
  'implies_modules' => ['serials', 'inventory'],

  // table_and_kot_management:
  'implies_modules' => ['table_service', 'pos'],

  // customer_khata_credit:
  'implies_modules' => ['khata_credit', 'customers', 'sales_orders'],
  ```
- **Effort Estimate:** 1 hour
- **Acceptance Criteria:** Unit test `CapabilityRegistryTest` confirms that resolving `table_and_kot_management` includes `table_service`, and resolving `customer_khata_credit` includes `khata_credit`.

---

### Blocker 5: Secure Provisioning Endpoint Binding
- **Severity:** HIGH / TAMPERING VULNERABILITY
- **Root Cause:** `WorkspaceBuilderController::provision()` accepts `$request->input('modules')` directly from the client POST body. It does not verify that the modules match the server-side `DiscoverySession` or validate module dependencies. Any attacker or modified client script can post `modules: ["products", "pos", "accounting_workspace", ...]` on a plan that should not allow it.
- **Files to Modify:**
  1. `app-code/main-app/app/Http/Controllers/WorkspaceBuilderController.php`
- **Proposed Code Change:**
  Require a valid `session_id` in the provision request. Re-resolve modules from the persisted `DiscoverySession` record rather than trusting the client payload:
  ```php
  $session = DiscoverySession::where('session_id', $request->input('session_id'))->firstOrFail();
  $modules = app(CapabilityRegistry::class)->resolveModules(
      $session->confirmed_capabilities,
      $session->preset,
      $session->extracted_facts
  );
  ```
- **Effort Estimate:** 2.5 hours
- **Acceptance Criteria:** Provisioning fails if `session_id` is invalid or expired. Arbitrary client-injected module arrays are ignored.

---

### Blocker 6: Eliminate Artificial Confidence Clamping
- **Severity:** MEDIUM / HONESTY DEFECT
- **Root Cause:** In `DiscoverySession::finalizeProposal()`, the calculation `$confidence = max(0.90, min(0.99, round($readiness, 2)))` forces a fabricated 90% floor.
- **Files to Modify:**
  1. `app-code/main-app/app/Models/DiscoverySession.php`
  2. `resources/js/Components/Builder/ConversationalDiscovery.jsx`
- **Proposed Code Change:**
  Remove the `max(0.90, ...)` floor:
  ```php
  $confidence = round(count($this->confirmed_capabilities) / max(1, count($this->candidate_capabilities)), 2);
  ```
- **Effort Estimate:** 1 hour
- **Acceptance Criteria:** A 1-turn session with 1 confirmed capability out of 6 candidates reports an honest confidence of 17% (or displays qualitative text: "Initial Match").

---

## 3. P1 Fast-Follows (Post-Launch Cycle 1)

### Fast-Follow 7: Add Missing Discovery Capabilities
- **Description:** 16 live modules currently have no capability questions in `CapabilityRegistry.php`. Most urgently, Barcode Printing (`barcodes_labels`), Recurring Invoices (`recurring_invoices`), and Bank Reconciliation (`bank_reconciliation`) need capability definitions.
- **Effort:** 6 hours

### Fast-Follow 8: Align Dashboard Seeding and Reckoner Registry
- **Description:** In `TenantDefaultSeeder.php`, remove hardcoded `sales.top_products` and `inventory.stock_value` from the base seeder; seed only metrics belonging to enabled modules. Update `ReckonerRegistry::MODULE_MAP` so that readings like `proposals.count` and `recurring_invoices.count` are mapped to their respective modules instead of treating them as universal core readings.
- **Effort:** 4 hours

### Fast-Follow 9: Enforce Role Middleware on Store Settings
- **Description:** In `routes/web.php`, add `role:owner,admin` middleware to `/s/{slug}/settings` and related configuration routes to prevent users with the `cashier` role from accessing store administration.
- **Effort:** 2 hours

### Fast-Follow 10: Deprecate `test-store` Bypass Loophole
- **Description:** In `EnsureModule.php:83` and `EnsurePlanFeature.php`, remove `$tenant->slug === 'test-store'`. Update test fixtures to use explicit mock configuration or real synthetic tenants so test suites test the exact middleware code running in production.
- **Effort:** 3 hours

---

## 4. Remediation Schedule & Resource Estimate

| Phase | Items | Total Estimated Hours | Required Verification |
| :--- | :--- | :--- | :--- |
| **Phase 1: P0 Blockers** | Blockers 1 through 6 | **13.5 Hours** (1.5 - 2 Engineering Days) | Full run of `scenarios-probe.php` with 100% pass on API gating and subtab leakage. |
| **Phase 2: P1 Fast-Follows** | Fast-Follows 7 through 10 | **15.0 Hours** (2 Engineering Days) | Seeder tests, RBAC tests, test suite cleanup. |
| **Total Effort** | All 10 Items | **28.5 Hours** | Zero regressions on existing 99 canonical tests. |
