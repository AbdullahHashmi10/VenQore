# VenQore Claims vs Technical Reality: Marketing, Pricing & Onboarding Audit

**Audit Date:** September 12, 2026  
**Auditor:** Principal Product Engineer & Independent Prelaunch Auditor  
**Purpose:** Systematically contrast all customer-facing promises made in marketing, pricing, onboarding, and AI flows against empirical runtime findings, providing exact safe replacement copy.

---

## 1. Classification Framework

Each public promise is evaluated under four strict standards:
- **SUPPORTED:** The code, database schema, and runtime execution completely uphold the claim without qualification.
- **PARTIALLY SUPPORTED:** The concept exists and works in parts, but contains leaks, edge-case bypasses, or UI defects.
- **UNSUPPORTED:** The claim is technically untrue or directly contradicted by empirical runtime tests.
- **UNVERIFIED:** The claim could not be verified within the current test environment or depends on external manual systems.

---

## 2. Comprehensive Claims Matrix

### A. Onboarding & AI Discovery Promises

#### Claim 1: "Software that fits your business on day one — only the tools you need, without clutter."
- **Source:** Marketing Home, About (`resources/js/Pages/Marketing/About.jsx`), Onboarding Opener.
- **Empirical Reality:** **PARTIALLY SUPPORTED / MATERIALLY FLAWED**.
  - *What works:* The top-level sidebar navigation in `OneGlanceLayout.jsx` successfully hides unselected primary modules (e.g. a solo freelancer has no POS or Inventory in the sidebar).
  - *Where it breaks:* Sub-navigation tabs across major screens (`StockModuleTabs.jsx`, `SellModuleTabs.jsx`, `PurchaseModuleTabs.jsx`, `MoneyModuleTabs.jsx`, `ContactsModuleTabs.jsx`) are hardcoded without checking `props.modules`. A solo freelancer navigating to Invoicing sees tabs for Quotations, B2B Proposals, and Recurring Invoices. An inventory user sees tabs for Production Runs, Recipes, Batches, and Serials regardless of whether they make goods or track serial numbers. Furthermore, `TenantDefaultSeeder` seeds stock valuation and product metrics onto solo dashboards.
- **Verdict:** **PARTIALLY SUPPORTED**
- **Safe Copy Recommendation:**
  > *"Start with a streamlined core tailored to your trade. We simplify your main workspace and hide unneeded main modules, while keeping advanced tools one click away as your business grows."*

---

#### Claim 2: "If customers take goods now and pay later, we add customer ledgers, credit limits and khata."
- **Source:** `ConversationalDiscovery.jsx` (Question Hint for credit sales) & `CapabilityRegistry.php`.
- **Empirical Reality:** **UNSUPPORTED (CRITICAL BUG)**.
  - Answering "Yes" to customer credit in discovery resolves capability `customer_khata_credit`.
  - In `CapabilityRegistry.php`, `customer_khata_credit` declares `'implies_modules' => ['credit_sales', 'customers', 'sales_orders']`.
  - Because the actual module in `config/modules.php` is named `khata_credit` (not `credit_sales`), `resolveModules()` executes `array_intersect($modules, $liveRegistry)` and **silently deletes credit sales from the provisioned tenant**.
  - The customer who specifically requested Khata receives only Customers and Sales Orders; the Khata Ledger module is NOT enabled.
- **Verdict:** **UNSUPPORTED**
- **Safe Copy Recommendation:**
  > *Block this claim or fix the capability mapping immediately before advertising Khata credit support in AI onboarding.*

---

#### Claim 3: "More than one shop or warehouse adds stock transfers and multi-branch management."
- **Source:** `ConversationalDiscovery.jsx` (Question Hint for multi-branch) & `CapabilityRegistry.php`.
- **Empirical Reality:** **UNSUPPORTED (CRITICAL BUG)**.
  - Answering "Two or three" or "Four or more" branches resolves `multi_branch_warehouses`.
  - `multi_branch_warehouses` declares `'implies_modules' => ['branches', 'stock_transfers', 'inventory']`.
  - The live module registry defines `multi_location`, not `branches`.
  - `multi_location` is silently dropped during `resolveModules()`.
  - The merchant receives `stock_transfers` and `inventory`, but cannot create or manage multiple warehouses.
- **Verdict:** **UNSUPPORTED**
- **Safe Copy Recommendation:**
  > *Fix `'implies_modules'` to reference `'multi_location'` before launching multi-branch marketing.*

---

#### Claim 4: "90% Match with your business — tailored by AI."
- **Source:** `DiscoverySession.php` (`finalizeProposal`) & Proposal UI.
- **Empirical Reality:** **UNSUPPORTED (FABRICATED METRIC)**.
  - In `app/Models/DiscoverySession.php` line 331, confidence is hardcoded:
    `$confidence = max(0.90, min(0.99, round($readiness, 2)));`
  - Even if the user answers a single question and has 8 unaddressed candidate capabilities (`readiness = 0.11`), the backend forces confidence to `0.90`.
  - Presenting a customer with a "90% Match" guarantee based on an arbitrary mathematical floor is deceptive.
- **Verdict:** **UNSUPPORTED**
- **Safe Copy Recommendation:**
  > *"Recommended Starter Configuration based on your answers." (Remove the percentage badge entirely or calculate genuine coverage percentage).*

---

### B. Security, Architecture & Ledger Promises

#### Claim 5: "Immutable double-entry general ledger with zero data tampering."
- **Source:** Marketing About, Ledger Showcase (`resources/js/Pages/Marketing/Ledger.jsx`).
- **Empirical Reality:** **SUPPORTED**.
  - Our database inspection and Scenario 10 verification confirm that financial journals, trial balances, and transaction records are strictly append-only.
  - Disabling or re-enabling operational modules (`syncModules`) does not truncate, alter, or orphan underlying transaction rows or ledger entries.
- **Verdict:** **SUPPORTED**
- **Safe Copy Recommendation:**
  > *"Built on an immutable double-entry ledger that records every sale, payment, and expense with audit-grade integrity."*

---

#### Claim 6: "Complete Multi-Tenant Isolation: Your data is strictly private and unreachable by other stores."
- **Source:** Security Page (`resources/js/Pages/Marketing/Security.jsx`).
- **Empirical Reality:** **PARTIALLY SUPPORTED**.
  - *Database & Model Layer:* **SUPPORTED**. Cross-tenant queries are scoped by `tenant_id` via global scopes and `TenantContext`. In Scenario 12, cross-tenant resource access returned HTTP 404.
  - *API & Role Boundaries:* **DEFECTIVE**. Scenario 12 revealed that cashiers can access administrative `/settings`. Furthermore, API routes `/api/*` lack module gating middleware, allowing any authenticated tenant user to call POS, work order, and sync endpoints regardless of store tier or disabled module state.
- **Verdict:** **PARTIALLY SUPPORTED**
- **Safe Copy Recommendation:**
  > *"Strict tenant data isolation ensures your store data is never visible to other organizations. Role permissions allow granular staff access."* (Pending fix for settings access).

---

### C. Pricing & Plan Promises

#### Claim 7: "Every paid plan carries universal business modules, the full double-entry ledger and all 43 financial reports."
- **Source:** Pricing Page (`resources/js/Pages/Marketing/Pricing.jsx:96`).
- **Empirical Reality:** **PARTIALLY SUPPORTED / FACTUALLY INACCURATE**.
  - *Ledger & Core Modules:* Universal modules are accessible across plans.
  - *Report Count Discrepancy:* The codebase does not have "43 financial reports". In `inventory.json`, there are **65 total report definitions** across all categories, of which only 18 are purely financial.
  - *Disabled Module Gating on Reports:* Scenario 09 proved that when an operational module is disabled (e.g. inventory or purchases), its associated reports are gated and return HTTP 403. A merchant without inventory cannot access "all reports".
- **Verdict:** **PARTIALLY SUPPORTED**
- **Safe Copy Recommendation:**
  > *"Every plan includes our core double-entry accounting ledger and comprehensive financial reports matching your enabled modules."*

---

#### Claim 8: "Free forever, no implementation fee, no credit card required to start."
- **Source:** Pricing Hero & Onboarding Gate.
- **Empirical Reality:** **SUPPORTED**.
  - The onboarding wizard allows full workspace creation, discovery exploration, and tenant provisioning without requiring Stripe tokens, credit card forms, or upfront payment credentials.
  - The free tier provisions an operational store in the database.
- **Verdict:** **SUPPORTED**
- **Safe Copy Recommendation:**
  > *Keep existing copy; this promise is fully honoured by the software.*

---

## 3. Summary of Honest Marketing Commitments

| Public Surface | Current Promise | Audit Finding | Immediate Action Required |
| :--- | :--- | :--- | :--- |
| **Discovery Proposal** | "90% Confidence Match" | Mathematical clamp `max(0.90, ...)` | Replace with "Proposed Setup" badge. |
| **Discovery Chat** | "We add Khata / Credit ledgers" | `khata_credit` dropped silently | Fix `CapabilityRegistry` mapping. |
| **Discovery Chat** | "Adds multi-branch warehouses" | `multi_location` dropped silently | Fix `CapabilityRegistry` mapping. |
| **Pricing Page** | "All 43 financial reports" | 65 total reports, gated by module | Update text to "comprehensive reports". |
| **Workspace Navigation** | "Only the tools you need" | Leaking tabs in 5 major views | Filter tabs by `props.modules`. |
| **API Boundary** | "Enterprise-grade API security" | Zero module gating on `/api/*` | Add `EnsureModule` to API middleware. |
