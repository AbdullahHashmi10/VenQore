# VenQore Independent Prelaunch Audit Report

**Audit Date:** September 12, 2026  
**Auditor:** Principal Product Engineer & Independent Prelaunch Auditor  
**Corpus / Workspace:** `AbdullahHashmi10/VenQore`  
**Git Commit ID:** `4980a8cb` (Branch: `v6-design-system-completion`)  
**Overall Prelaunch Launch Verdict:** **NOT READY / LAUNCH BLOCKED**

---

## 1. Executive Summary & The Launch Verdict

VenQore is built around an ambitious and compelling product promise:
> *"A merchant describes their business in plain language, answers a small number of honest questions, optionally explores deeper discovery, reviews a transparent configuration proposal, and receives software that fits those choices — displaying and enabling only the relevant workflows without silently including unrelated clutter."*

Following our comprehensive end-to-end audit spanning all 46 modules, 766 routes, 144 surface interfaces, 17 capability paths, and 14 empirical multi-tenant runtime scenarios against a dedicated database, our independent verdict is:

### Overall Launch Verdict: **NOT READY (BLOCKED)**
The application possesses exceptional foundational architecture — including an immutable double-entry general ledger, rigorous database-level tenant isolation, and a beautifully designed UI design system. However, **it cannot be launched today in its current state**. 

There are **six launch-blocking defects** that directly break the central product promise, create critical API security exposures, and cause the software to silently drop modules that merchants explicitly ask for during onboarding.

---

## 2. Intended Contract vs Implemented Reality

| Architectural Layer | Intended Contract | Implemented Reality | Verdict |
| :--- | :--- | :--- | :--- |
| **Conversational Onboarding** | Plain-language business intake that accurately translates merchant needs into active modules. | Answering "Yes" to dining tables, serial/IMEI tracking, customer credit (Khata), or multiple warehouses **silently drops those modules** due to phantom mapping keys in `CapabilityRegistry.php`. | **BROKEN** |
| **Discovery Completeness** | Broad coverage of the business platform. | **16 out of 43 live modules** have no capability representation or discovery questions. | **PARTIAL** |
| **Readiness & Confidence** | Honest reflection of how well the system understands the merchant's business. | The proposal engine forcibly clamps confidence to **`max(0.90, readiness)`**, displaying a fabricated "90% Match" badge even after minimal information. | **MISLEADING** |
| **Workspace Presentation** | Workspace shows only enabled tools; disabled modules are omitted from screens. | Main sidebar hides disabled modules, but **sub-navigation tabs in 5 major components leak disabled modules**, showing Production, Serials, Batches, and Proposals to users who disabled them. | **BROKEN** |
| **Backend Enforcement** | Middleware strictly protects all routes from disabled module access. | Web routes are gated via `EnsureModule`, but **`/new-pos`, `/new-invoice`, `/tables/state`, and `/manufacturing-rules` are unclaimed and fail open**. Furthermore, **the entire `/api/*` route group has zero module gating middleware**. | **CRITICAL EXPOSURE** |
| **Ledger & Accounting** | Immutable double-entry bookkeeping with strict data preservation. | Financial ledgers are append-only. Disabling operational modules never destroys or corrupts underlying transaction rows. | **VERIFIED EXCELLENT** |

---

## 3. Proven Strengths of the Codebase

It is vital to recognize what VenQore does right. The codebase demonstrates high-caliber engineering in several key areas:

1. **Immutable Double-Entry Ledger Integrity:** Financial accounting in VenQore is rock solid. In Scenario 10, disabling and re-enabling operational modules left ledger entries and historical stock movements 100% intact. Disabling a module functions as an access shutter, not a destructive data purge.
2. **Multi-Tenant Data Isolation:** Tenant isolation at the Eloquent and database query layer is robust. In Scenario 12, cross-tenant IDOR attempts against product statistics returned HTTP 404. Tenant context scoping via `TenantContext` works reliably.
3. **Resilient LLM Fencing & Fallbacks:** In our adversarial engine probes (`engine-probes.json`), the AI builder resisted out-of-scope queries (e.g. recipe requests, code generation, prompt injections) and fell back gracefully to deterministic trade classification during simulated rate limits or outages without throwing 500 errors.
4. **Clean Module Taxonomy:** `config/modules.php` provides a remarkably thorough, well-documented taxonomy of 46 distinct modules with clear feature IDs, dependencies (`requires`, `requires_one`), and terminology maps.

---

## 4. The Six Launch-Blocking Defects

### Blocker 1: Total Absence of Module Gating on API Routes (Critical Security & Perimeter Failure)
- **Finding:** In `bootstrap/app.php`, `EnsureModule::class` is attached only to the `web` middleware group. The `api` middleware group has no module gating.
- **Empirical Evidence:** In `http-probes.json` and Scenario 01, a solo freelancer tenant with POS and Manufacturing disabled successfully queried `GET /api/pos/search` (HTTP 200 with product data) and `GET /api/work-orders` (HTTP 200). In Scenario 14, an out-of-band POST to `/api/work-orders` succeeded with HTTP 200.
- **Impact:** Any mobile app, Electron client, or authenticated third party can interact with disabled modules, bypassing all billing and feature gates.

### Blocker 2: Unclaimed Operational Web Routes (Fail-Open Backdoors)
- **Finding:** In `routes/web.php`, multiple operational endpoints are not mapped to any module owner in `config/modules.php`. In `EnsureModule.php:128`, unclaimed routes default to `$next($request)`.
- **Empirical Evidence:** 
  - `GET /s/{slug}/new-pos`: Returns **HTTP 200** on a tenant with POS disabled.
  - `GET /s/{slug}/tables/state`: Returns **HTTP 200** on a tenant with `table_service` disabled.
  - `GET /s/{slug}/api/manufacturing-rules`: Returns **HTTP 200** on a tenant with manufacturing disabled.

### Blocker 3: Leaking Sub-Navigation Tabs in React Shell (Broken User Experience)
- **Finding:** Five core React sub-navigation components hardcode tabs without checking `usePage().props.modules`:
  - `StockModuleTabs.jsx`: Unconditionally renders tabs for Batch Tracking, Serial Tracking, Production, Cookbook, Stock Takes, Transfers, and Units.
  - `SellModuleTabs.jsx`: Unconditionally renders Quotations, Proposals, Recurring Invoices, and E-Invoicing.
  - `PurchaseModuleTabs.jsx`: Unconditionally renders Purchase Orders and Debit Notes.
  - `MoneyModuleTabs.jsx`: Unconditionally renders Cash Register, Bank Accounts, and Reconciliation.
  - `ContactsModuleTabs.jsx`: Unconditionally renders Team and Staff Attendance for solo operators.
- **Impact:** Merchants are immediately confronted with the very clutter they were promised would be removed. Clicking these tabs results in confusing 403 Forbidden screens.

### Blocker 4: Phantom Module Key Drops in Discovery (Silent Onboarding Failure)
- **Finding:** `CapabilityRegistry.php` uses informal or legacy strings in its `'implies_modules'` definitions. When `resolveModules()` intersects candidate modules with the live registry from `config/modules.php`, mismatched keys are silently deleted:
  - `table_and_kot_management` implies `tables`, `kitchen_display` -> live key is `table_service` (DROPPED).
  - `serial_imei_tracking` implies `serial_numbers` -> live key is `serials` (DROPPED).
  - `customer_khata_credit` implies `credit_sales` -> live key is `khata_credit` (DROPPED).
  - `multi_branch_warehouses` implies `branches` -> live key is `multi_location` (DROPPED).
- **Impact:** When a merchant tells the onboarding wizard they have tables, track serial numbers, use khata, or have multiple branches, **the software provisions a tenant without those features**.

### Blocker 5: Unauthenticated Provisioning Payload Vulnerability (Parameter Tampering)
- **Finding:** `WorkspaceBuilderController::provision()` accepts a raw `modules` array from the client HTTP body (`$request->input('modules')`). It does not verify that the modules match a validated server-side `DiscoverySession`.
- **Impact:** Any visitor can bypass onboarding and post a JSON payload enabling any enterprise modules they desire.

### Blocker 6: Artificial 90% Confidence Display (Deceptive Metric)
- **Finding:** In `DiscoverySession::finalizeProposal()`, the code forces `$confidence = max(0.90, min(0.99, round($readiness, 2)))`.
- **Impact:** Even when a customer answers just 1 question and leaves 8 capabilities unknown, the system shows a green badge claiming "90% Match with your business". This is factually untrue and damages customer trust.

---

## 5. Persona-by-Persona Suitability Matrix

| Persona | Configured Modules | Runtime Result | Launch Suitability | Primary Issue |
| :--- | :--- | :--- | :--- | :--- |
| **Solo Freelancer / Consultant** | Services, Invoicing, Customers, Expenses, Reports | **FAIL** | **NOT READY** | Subtabs show quotations/proposals; dashboard seeds inventory metrics; `/new-pos` & API POS open. |
| **Small Retail Boutique** | Products, POS, Expenses, Reports | **PARTIAL** | **NOT READY** | Counter POS works well, but Inventory screen displays broken tabs for Production and Batches; Barcode printing unaskable in AI. |
| **Bakery Maker** | Products, POS, Cookbook, Production, Inventory | **PARTIAL** | **NOT READY** | Recipes and production runs function, but API work orders leak to unauthenticated tenants. |
| **Dine-In Restaurant** | POS, Table Service, Park & Recall | **FAIL** | **NOT READY** | Answering Yes to dining tables in discovery silently drops `table_service`; `/tables/state` leaks to takeaway shops. |
| **Mobile & Electronics Shop** | Products, POS, Serials, Inventory | **FAIL** | **NOT READY** | Answering Yes to IMEI in discovery silently drops `serials`; Serial Tracking tab leaks to all other users. |
| **Wholesale / Khata Distributor** | Products, Khata Credit, Purchases, Pricing Tiers | **FAIL** | **NOT READY** | Answering Yes to customer credit in discovery silently drops `khata_credit`. |

---

## 6. The Five Definitive Owner-Facing Answers

### 1. What can we honestly sell today?
**Nothing through the automated conversational onboarding flow.**  
If onboarded manually by an engineer or administrator who directly provisions the correct module keys into the database, VenQore can reliably support **simple over-the-counter retail** (products + POS) and **basic service invoicing** (services + invoicing). However, the automated AI flow cannot be sold today because it strips key modules (tables, serials, khata, branches) from paying customers.

### 2. Which configurations work?
- **Standard Counter Retail (Preset: `retail_shop`)**: Products, Counter POS, Expenses, and Basic Reports operate cleanly once provisioned.
- **Pure Invoicing (Preset: `freelancer`)**: Service job tracking, customer invoice generation, and expense recording work accurately at the database and transaction level.
- **Manufacturing / Bakery (Preset: `light_manufacturing`)**: Recipe definitions (BOM) and production batches correctly deduct raw materials and create finished goods.

### 3. What must be fixed before launch?
The **six P0 Launch Blockers** detailed in `FIX_PLAN.md`:
1. Register `EnsureModule` on the `api` middleware group in `bootstrap/app.php`.
2. Map `/new-pos`, `/new-invoice`, `/tables/state`, and `/manufacturing-rules` in `config/modules.php`.
3. Filter sub-navigation tabs in `StockModuleTabs.jsx`, `SellModuleTabs.jsx`, `PurchaseModuleTabs.jsx`, `MoneyModuleTabs.jsx`, and `ContactsModuleTabs.jsx`.
4. Fix the 4 phantom module mappings in `CapabilityRegistry.php` (`table_service`, `serials`, `khata_credit`, `multi_location`).
5. Bind `POST /workspace/provision` to the validated server `DiscoverySession`.
6. Remove the artificial `max(0.90, ...)` confidence floor.

### 4. What do we still not know?
- **Native Mobile & Desktop Behavior:** We have not tested how the Flutter mobile app and Electron desktop client behave when backend endpoints return 403 Forbidden once API gating is enabled.
- **Performance Under High Multi-Tenant Concurrency:** While SQLite and MariaDB functional tests pass, high-volume stress testing under simultaneous multi-tenant socket connections (e.g. real-time POS checkouts) has not been audited.
- **Unverified Third-Party Integrations:** Payment gateway webhooks (Stripe / JazzCash / EasyPaisa) and hardware thermal printer drivers remain unverified in this offline test environment.

### 5. What should we change first?
**Change `CapabilityRegistry.php` lines 206, 250, 282, and 314 today.**  
This is a 15-minute code change that immediately stops the discovery engine from dropping `table_service`, `serials`, `khata_credit`, and `multi_location`. Follow immediately with adding `EnsureModule` to `bootstrap/app.php` and filtering `StockModuleTabs.jsx`.

---

## 7. Deliverable Index & Audit Artifacts

All detailed technical evidence, CSV datasets, and reproduction harnesses are preserved in:  
`app-code/main-app/docs/prelaunch-audit-2026-09-12/`

1. [`AUDIT_REPORT.md`](file:///e:/AMD%20POS/AMD%20POS/app-code/main-app/docs/prelaunch-audit-2026-09-12/AUDIT_REPORT.md): Executive summary and launch verdicts (this document).
2. [`MODULE_TRACEABILITY.csv`](file:///e:/AMD%20POS/AMD%20POS/app-code/main-app/docs/prelaunch-audit-2026-09-12/MODULE_TRACEABILITY.csv): Complete matrix for all 46 modules across discovery, presets, gates, and evidence.
3. [`SURFACE_COVERAGE.csv`](file:///e:/AMD%20POS/AMD%20POS/app-code/main-app/docs/prelaunch-audit-2026-09-12/SURFACE_COVERAGE.csv): Exhaustive inventory of 144 UI tabs, routes, cards, and API endpoints.
4. [`DISCOVERY_COVERAGE.md`](file:///e:/AMD%20POS/AMD%20POS/app-code/main-app/docs/prelaunch-audit-2026-09-12/DISCOVERY_COVERAGE.md): Deep architectural analysis of the AI Builder, capabilities, and turn mechanics.
5. [`SCENARIO_RESULTS.md`](file:///e:/AMD%20POS/AMD%20POS/app-code/main-app/docs/prelaunch-audit-2026-09-12/SCENARIO_RESULTS.md): Empirical test logs and JSON payloads for all 14 required audit scenarios.
6. [`CLAIMS_VS_REALITY.md`](file:///e:/AMD%20POS/AMD%20POS/app-code/main-app/docs/prelaunch-audit-2026-09-12/CLAIMS_VS_REALITY.md): Customer-facing promises vs technical reality with safe copy rewrites.
7. [`FIX_PLAN.md`](file:///e:/AMD%20POS/AMD%20POS/app-code/main-app/docs/prelaunch-audit-2026-09-12/FIX_PLAN.md): Prioritized, engineering-ready remediation specifications with effort estimates.
8. [`AUDIT_LEDGER.md`](file:///e:/AMD%20POS/AMD%20POS/app-code/main-app/docs/prelaunch-audit-2026-09-12/AUDIT_LEDGER.md): Numerical accounting of denominators, inventory metrics, and audit resumption steps.
