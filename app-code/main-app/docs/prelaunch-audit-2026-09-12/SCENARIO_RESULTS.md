# VenQore Empirical Scenario Results: 14 Core Launch Scenarios

**Audit Date:** September 12, 2026  
**Test Environment:** Dedicated Isolated Test Database (`amd_pos_test` on MariaDB 10.11)  
**Execution Harness:** `scenarios-probe.php`  
**Data Safety:** All mutations executed within strict transactional boundaries and rolled back; zero production data touched.

---

## 1. Executive Summary of Scenario Executions

All 14 prelaunch scenarios were executed against real database instances using the canonical `StoreProvisioner`, `AiBuilderService`, `DiscoverySession`, and HTTP request pipeline. 

| Scenario ID | Scenario Name | Target Persona / Boundary | Duration | Status | Key Finding |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | Solo Freelancer / Consultant | Services & Invoicing only | 1.12s | **PARTIAL FAIL** | Web POS 403, but `/new-pos` & API `/api/pos/search` return 200; stock cards seeded. |
| **02** | Small Retail Shop | Counter POS without production | 0.55s | **PASS with Leak** | POS works; `/labels` 403; but `StockModuleTabs` leaks batch/serial/BOM tabs. |
| **03** | Catalogue & Invoicing | B2B Distributor (No POS) | 0.63s | **PASS** | `/pos` blocked (403); Invoices and Products accessible (200). |
| **04** | Bakery Reseller vs Maker | Trade differentiation (BOM) | 0.00s | **PASS** | Reseller excludes cookbook/production; Maker includes them. |
| **05** | Restaurant vs Takeaway | Dining & Table service | 0.52s | **CRITICAL FAIL** | `/tables/state` returns 200 for takeaway shop; Discovery drops `table_service`. |
| **06** | Repair Workshop | Mixed Parts & Labour | 0.69s | **PASS** | Both `services` and `products` operate concurrently on invoice lines. |
| **07** | Pharmacy vs Clothing | Batches vs Variants | 0.00s | **PASS** | Pharmacy gets `batches_expiry`; Clothing gets `variants`. |
| **08** | Wholesale Business | Credit, Pricing Tiers & POs | 0.68s | **PASS with Leak** | Wholesale modules provisioned; Discovery drops `khata_credit`. |
| **09** | Report Gating | Disabled module reports | 0.62s | **PASS** | `/reports/inventory-valuation` & `/reports/discount` return 403 when modules off. |
| **10** | Module Lifecycle | Disabling / Re-enabling | 0.31s | **PASS** | Data preserved during disable; re-enabling cleanly restores access. |
| **11** | Legacy / 0-Row State | Backward compatibility | 0.26s | **PASS** | 0-row legacy tenant fails open safely; missing keys default false. |
| **12** | Multi-Tenant & RBAC | IDOR & Cashier Role | 0.66s | **SECURITY FAIL** | Cross-tenant 404 (IDOR safe), but Cashier role accessed `/settings` (HTTP 200). |
| **13** | Discovery Lifecycle | Turns, Deepen, Skip, Expiry | 0.00s | **PASS** | Deepen doubles max turns (4 -> 10); expired session rejected cleanly. |
| **14** | Direct Gating / Stale Client | Out-of-band POST writes | 1.17s | **API FAIL** | Stock adjustments blocked (405), but API `/api/work-orders` accepted write (200). |

---

## 2. Detailed Empirical Verification Records

### Scenario 01: Solo Freelancer / Consultant
- **Persona:** Independent UI/UX consultant billing hourly and project retainers from home.
- **Requested Modules:** `services`, `invoicing`, `customers`, `payments`, `expenses`, `reports`.
- **Disabled Modules:** `pos`, `products`, `inventory`, `barcodes_labels`, `cookbook`, `production_runs`, `table_service`.
- **Runtime Web Route Outcomes:**
  - `GET /s/{slug}/sales`: **HTTP 200** (Allowed)
  - `GET /s/{slug}/service-jobs`: **HTTP 200** (Allowed)
  - `GET /s/{slug}/pos`: **HTTP 403** (Blocked by `EnsureModule`)
  - `GET /s/{slug}/inventory`: **HTTP 403** (Blocked by `EnsureModule`)
  - `GET /s/{slug}/labels`: **HTTP 403** (Blocked by `EnsureModule`)
  - `GET /s/{slug}/cookbook`: **HTTP 403** (Blocked by `EnsureModule`)
- **Vulnerabilities / Leaks Detected:**
  1. `GET /s/{slug}/new-pos`: **HTTP 200** — Unclaimed route in `ModuleRouteMap`, completely bypassing `EnsureModule`.
  2. `GET /api/pos/search`: **HTTP 200** — API routes lack `EnsureModule` middleware.
  3. `GET /s/{slug}/tables/state`: **HTTP 200** — Restaurant floor state endpoint returns data for a solo freelancer.
  4. Dashboard Seeding Leak: `TenantDefaultSeeder` seeded `sales.top_products` and `inventory.stock_value` onto the freelancer's dashboard.

---

### Scenario 02: Small Retail Shop
- **Persona:** Small brick-and-mortar boutique selling retail products over the counter.
- **Requested Modules:** `products`, `pos`, `expenses`, `reports`.
- **Disabled Modules:** `barcodes_labels`, `production_runs`, `cookbook`, `table_service`, `multi_location`.
- **Runtime Outcomes:**
  - `GET /s/{slug}/pos`: **HTTP 200** (Active)
  - `GET /s/{slug}/inventory/list`: **HTTP 200** (Active)
  - `GET /s/{slug}/labels`: **HTTP 403** (Properly blocked)
  - `GET /s/{slug}/production`: **HTTP 404** / 403 (Properly blocked)
- **Vulnerabilities / Leaks Detected:**
  - `StockModuleTabs.jsx` unconditionally renders sub-navigation tabs for "Batch Tracking", "Serial Tracking", "Production", and "Cookbook" on the inventory page. When clicked, merchants encounter 403 forbidden errors.

---

### Scenario 03: Product Catalogue & Invoicing (No Counter POS)
- **Persona:** B2B equipment distributor taking phone and email orders, shipping on invoice.
- **Configured Modules:** `products`, `invoicing`, `customers`, `expenses`, `reports` (No `pos`).
- **Runtime Outcomes:**
  - `GET /s/{slug}/pos`: **HTTP 403** (Properly blocked)
  - `GET /s/{slug}/sales/create`: **HTTP 200** (Invoice creation active)
  - `GET /s/{slug}/inventory/list`: **HTTP 200** (Catalogue accessible)
- **Verdict:** **PASS**. Clean separation between counter POS and invoicing workflow.

---

### Scenario 04: Bakery Reseller vs Bakery Maker
- **Objective:** Verify that the discovery engine distinguishes between reselling finished baked goods and operating an active commercial bakery with ingredients and production runs.
- **Reseller Discovery Output:** `['products', 'pos', 'expenses', 'reports']`. Neither `cookbook` nor `production_runs` is included.
- **Maker Discovery Output:** `['products', 'pos', 'expenses', 'reports', 'cookbook', 'production_runs', 'inventory']`. Both `cookbook` and `production_runs` are included.
- **Verdict:** **PASS**. Capability `recipe_and_bom` correctly activates recipes and production runs when manufacturing is indicated.

---

### Scenario 05: Restaurant Dine-In vs Takeaway Counter
- **Objective:** Verify isolation between dining floor plans/KOT and quick-serve counters.
- **Dine-In Tenant Config:** `table_service = true`.
- **Takeaway Tenant Config:** `table_service = false`.
- **Runtime Outcomes:**
  - Dine-In `GET /s/{slug}/tables/state`: **HTTP 200**
  - Takeaway `GET /s/{slug}/tables/state`: **HTTP 200 (CRITICAL LEAK)**
- **Root Cause:** Route `store.tables.state` (`/s/{slug}/tables/state`) is not mapped to module `table_service` in `config/modules.php`. `EnsureModule` fails open.
- **Discovery Defect:** Answering "Yes" to `table_and_kot_management` maps to phantom key `tables`, dropping `table_service` entirely!

---

### Scenario 06: Repair Workshop (Spare Parts & Labour)
- **Persona:** Mobile phone and computer repair shop with repair tickets, technician labour, and parts inventory.
- **Configured Modules:** `services` (labour), `products` (spare parts), `invoicing`, `expenses`.
- **Runtime Outcomes:**
  - `GET /s/{slug}/service-jobs`: **HTTP 200**
  - `GET /s/{slug}/service-jobs/tools`: **HTTP 200**
  - `GET /s/{slug}/inventory/list`: **HTTP 200**
  - Invoice creation with mixed lines (labour + parts): Functional.
- **Verdict:** **PASS**. Dual service/product mechanics operate harmoniously.

---

### Scenario 07: Pharmacy vs Clothing Retailer
- **Objective:** Verify domain-appropriate inventory tracking (Batches/Expiry for medicines vs Variants/Sizes for apparel).
- **Pharmacy Discovery Output:** Includes `batches_expiry`, excludes `variants`.
- **Clothing Discovery Output:** Includes `variants`, excludes `batches_expiry`.
- **Verdict:** **PASS**. Trade affinity matrix in `CapabilityRegistry.php` cleanly separates batch tracking from clothing size variants.

---

### Scenario 08: Wholesale B2B Business
- **Persona:** Bulk FMCG distributor selling to local retailers with trade pricing, credit terms, and supplier purchasing.
- **Configured Modules:** `products`, `customers`, `suppliers`, `pricing_tiers`, `purchases`, `purchase_orders`, `khata_credit`, `expenses`, `reports`.
- **Runtime Outcomes:**
  - `GET /s/{slug}/suppliers`: **HTTP 200**
  - `GET /s/{slug}/purchases`: **HTTP 200**
  - `GET /s/{slug}/purchase-orders`: **HTTP 200**
  - `GET /s/{slug}/customers`: **HTTP 200**
- **Discovery Defect:** When configuring wholesale through conversational discovery, answering Yes to credit sales drops `khata_credit` because the capability implies `credit_sales` instead of `khata_credit`.

---

### Scenario 09: Reports Gating Under Disabled Modules
- **Objective:** Verify that disabled modules do not leave orphaned reports accessible.
- **Tenant Config:** `inventory = false`, `purchases = false`, `tax_compliance = false`, `pricing_tiers = false`, `reports = true`.
- **Runtime Outcomes:**
  - `GET /s/{slug}/reports`: **HTTP 200** (Overview reports accessible)
  - `GET /s/{slug}/reports/sales`: **HTTP 200** (Sales report accessible)
  - `GET /s/{slug}/reports/inventory-valuation`: **HTTP 403** (Blocked by `inventory` gate)
  - `GET /s/{slug}/reports/purchases`: **HTTP 403** (Blocked by `purchases` gate)
  - `GET /s/{slug}/reports/tax`: **HTTP 403** (Blocked by `tax_compliance` gate)
  - `GET /s/{slug}/reports/discount`: **HTTP 403** (Blocked by `pricing_tiers` gate)
- **Verdict:** **PASS**. `ReportsController` and `EnsureModule` strictly protect module-specific reports.

---

### Scenario 10: Module Lifecycle (Disable and Restore)
- **Objective:** Verify data safety when a module is disabled and subsequently re-enabled.
- **Procedure:**
  1. Created tenant with `inventory` enabled; created 5 products with stock levels.
  2. Executed `StoreProvisioner::syncModules($tenant, ['products', 'expenses', 'reports'])`, disabling `inventory`.
  3. Verified `inventory` was marked `is_enabled = 0` in `tenant_modules`.
  4. Queried database: All 5 products and stock movements remained intact in the database tables (`products_count = 5`).
  5. Executed `StoreProvisioner::syncModules()` restoring `inventory`.
  6. Verified `inventory` routes and UI immediately re-opened with all historic stock data fully accessible.
- **Verdict:** **PASS (Zero Data Loss)**. Disabling a module acts as an access shutter, not a destructive wipe.

---

### Scenario 11: Tenant Backward Compatibility (0-Row Legacy & Missing Keys)
- **Objective:** Verify fallback semantics for unmigrated or corrupted tenant records.
- **Test 1 (0-Row Legacy Tenant):** Created tenant with 0 rows in `tenant_modules`.
  - `ModuleService::isEnabled('inventory')`: Returns `true` (Fails open to preserve legacy uptime).
  - `ModuleService::isEnabled('pos')`: Returns `true`.
- **Test 2 (Configured Tenant with Missing Key):** Tenant has active rows in `tenant_modules`, but query checks an unconfigured module.
  - Returns `false`.
- **Test 3 (Unknown / Typos in Module Key):** Query checks `'non_existent_random_module'`.
  - Returns `true` (Fails open to prevent breaking core features on typos).
- **Verdict:** **PASS**. Fails open safely for legacy stores while enforcing strict boundaries on provisioned tenants.

---

### Scenario 12: Multi-Tenant Isolation & Role-Based Access Control
- **Objective:** Verify cross-tenant isolation (IDOR protection) and employee privilege containment.
- **Test 1 (Cross-Tenant Access):**
  - Tenant A owner attempted to query Product B (`UUID: 01a09381-736a-73ff-bd8e-94eb4aa25380`) belonging to Tenant B via `/s/{tenantA}/inventory/{productB}/stats`.
  - Outcome: **HTTP 404** (Multi-tenant scoping correctly prevented cross-tenant leakage).
- **Test 2 (Cashier Privilege Boundary):**
  - Cashier Joe assigned role `'cashier'` on Tenant A.
  - Cashier attempted `GET /s/{tenantA}/settings`.
  - Outcome: **HTTP 200 (SECURITY VULNERABILITY)**. The store settings page does not enforce role-based middleware (`role:owner|admin`), allowing cashiers to view administrative settings.

---

### Scenario 13: Discovery Session Lifecycle
- **Objective:** Test multi-turn conversational session mechanics, skipping, deepening, and session expiry.
- **Test Run:**
  - Initial session created: `initial_depth = 1`, `initial_max_turns = 4`.
  - Recorded a skip turn: Engine properly marked capability as skipped and moved to next candidate.
  - Deepened session (`deepen()`): `depth` upgraded to `2`, `max_turns` expanded from 4 to 10.
  - Session expiration: Set `expires_at` in the past. Attempting to query or finalize the session cleanly returned `null`.
- **Verdict:** **PASS**. Session state machine behaves predictably.

---

### Scenario 14: Direct Gating vs Stale Client (Write Attempts)
- **Objective:** Verify backend API enforcement when a malicious or stale client bypasses the UI and issues direct write mutations to disabled module endpoints.
- **Test 1 (Stock Adjustment Write):**
  - Tenant has `inventory = false`.
  - Issued write to stock adjustment endpoint.
  - Outcome: Blocked (HTTP 405 / 403).
- **Test 2 (Manufacturing Work Order API):**
  - Tenant has `production_runs = false`.
  - Issued `POST /api/work-orders` with work order payload.
  - Outcome: **HTTP 200 (API LEAK)**. The API controller accepted and processed the work order because `routes/api.php` has zero module gating.

---

## 3. Residual Risks & Gating Failures Summary

From the 14 empirical scenarios, three critical failure categories emerge:
1. **API Perimeter Vulnerability:** Scenarios 01 and 14 proved that `routes/api.php` is completely unshielded by module gating. Any authenticated API token or mobile client can invoke disabled modules.
2. **Unclaimed Web Routes:** Scenarios 01 and 05 proved that `/new-pos` and `/tables/state` are omitted from `config/modules.php`, creating HTTP 200 backdoors on disabled modules.
3. **Role Enforcement Gap:** Scenario 12 proved that store settings lack role-based checks, granting cashiers access to store configurations.
