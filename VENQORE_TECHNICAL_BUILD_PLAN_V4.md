# VenQore Technical Build Plan v4

> **Version:** 4.0.0 (Master Release Spec)  
> **Target:** VenQore Enterprise ERP, POS & Multi-Store Platform v5.4.0+  
> **Status:** Active Execution (Phase 0 Complete, Phase 1 In-Progress)  
> **Repository:** `AbdullahHashmi10/VenQore`  
> **Architecture Pattern:** Dual Engine (V3 Ledger + Legacy Isolation Layer with PlanGuard Entitlements)

---

## Executive Summary & System Vision

VenQore v4.0 unifies the core retail POS/ERP system with multi-marketplace synchronization (VenSynQ), AI document processing (SmartCapture), double-entry accounting ledger isolation (V3 Accounting Engine), and automated multi-surface truth verification.

This document serves as the authoritative technical build plan for all platform engineering, database migrations, service layers, frontend Inertia/React components, and automated verification gates.

---

## Architectural Pillars

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              VENQORE CORE PLATFORM                              │
├───────────────────────┬─────────────────────────┬───────────────────────────────┤
│   MONETIZATION LAYER  │   BUSINESS ENGINE (V3)  │   INTEGRATION & SYNC (SYNC)   │
│  - PlanGuard Gate     │  - AccountingService    │  - VenSynQ Multi-Marketplace   │
│  - Entitlement Engine │  - FifoInventory Engine │  - SmartCapture AI Scanner    │
│  - AppSumo / Stripe   │  - Double-Entry Ledger  │  - WooCommerce / Amazon       │
└───────────────────────┴─────────────────────────┴───────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       VERIFICATION & TRUTH FRAMEWORK v2                         │
│  - 318 Mapped Route Metrics (LEDGER-DERIVED / TRANSACTION-DERIVED / HYBRID)    │
│  - Automated CI Gate: `php artisan verify:map --strict`                        │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase Roadmap Overview

| Phase | Description | Scope & Focus | Status |
|-------|-------------|---------------|--------|
| **Phase 0** | **Ground Truth, Data Safety & Verification Mapping** | Complete route inventory, registry generation, pre-flight safety | ✅ **COMPLETE** |
| **Phase 1** | **Multi-Tenancy Foundation & Core Ledger Services** | Tenant isolation, 38 COA accounts, `AccountingService`, `FifoService` | 🟡 In-Progress |
| **Phase 2** | **Inventory, Multi-Warehouse & Purchase Module** | Batch FIFO tracking, Purchase Orders, Zero-cost guard, Debit notes | 📋 Planned |
| **Phase 3** | **Sales, POS & Real-Time Sync Engine (VenSynQ)** | Real-time checkout, marketplace stock sync (Woo/Amazon), COGS locks | 📋 Planned |
| **Phase 4** | **AI SmartCapture & Document OCR Pipeline** | Invoice parsing, entitlement consumption, auto-reconciliation | 📋 Planned |
| **Phase 5** | **Monetization, Billing & PlanGuard Entitlements** | Tier limits, feature toggles, backfill command overrides, billing portal | 📋 Planned |
| **Phase 6** | **Multi-Surface Truth Sweep & Verification Framework v2** | Byte-level consistency across 6 CG groups, mutation scoring | 📋 Planned |
| **Phase 7** | **Production Hardening, Performance & Launch Gate** | Sub-100ms response targets, PWA offline sync, automated release build | 📋 Planned |

---

## Detailed Technical Specifications

### PHASE 0 — Ground Truth, Data Safety & Verification Mapping
**Status:** ✅ **COMPLETE**  
**Deliverables & Artifacts:**
1. **Verification Command:** `app/Console/Commands/VerifyMap.php` (`verify:map`)
2. **Number Registry:** `verification/number_registry.yaml` (318 mapped route metrics)
3. **Data Safety Isolation:** Tenant Zero preserving legacy AMD Outlets data safely before additive migrations.

**Verification Gate Checklist:**
- [x] Route discovery scanner walks 220+ routes and classifies endpoints (133 LEDGER-DERIVED, 17 TRANSACTION-DERIVED, 59 HYBRID, 105 NON-FINANCIAL).
- [x] `php artisan verify:map` executes without fatal errors and writes updated registry.
- [x] Pre-phase 0 code state committed and pushed to git branch `session2-fixes`.

---

### PHASE 1 — Multi-Tenancy Foundation & Core Ledger Services
**Target Duration:** 2 Weeks  
**Depends On:** Phase 0  
**Focus:** Isolating tenant data at database layer and locking down the V3 double-entry engine.

#### Database Migrations (V3 Schema Layer)
- `_v3_create_accounts_table.php`: Chart of Accounts (38 default accounts, Account 7000 Equity Netting).
- `_v3_create_journal_entries_table.php`: Double-entry headers with `idempotency_key` UNIQUE index.
- `_v3_create_journal_items_table.php`: Line items with CHECK constraint `(debit_amount > 0 AND credit_amount = 0) OR (debit_amount = 0 AND credit_amount > 0)`.
- `_v3_create_payment_allocations_table.php`: Over-allocation triggers preventing allocation > payment balance.
- `_v3_create_party_snapshots_table.php`: Fast ledger balance snapshot by party with `UNIQUE(party_id, account_id)`.

#### Core Services (`app/Services/V3/`)
1. **`AccountingService`**:
   - `createEntry(array $header, array $items)`: Atomic transaction posting.
   - `reverseEntry(string $entryId, string $reason)`: Idempotent debit/credit inversion.
   - `getBalance(int $accountId, ?string $asOf = null)`: Fast balance calculation from `journal_items`.
2. **`FifoService`**:
   - `receiveBatch(int $productId, float $qty, float $unitCost, int $warehouseId)`: FIFO batch creation.
   - `deductStock(int $productId, float $qty, int $warehouseId)`: Oldest-first batch depletion.
3. **`PaymentService`**:
   - `allocate(int $paymentId, array $allocations)`: Over-payment & bill matching logic.

**Phase 1 Verification Gate:**
- [ ] `AccountingService` throws exception on unbalanced entries (`sum(debit) != sum(credit)`).
- [ ] DB constraint blocks negative inventory batch quantities (`remaining_qty >= 0`).
- [ ] All 38 default COA accounts seeded with correct normal balances.

---

### PHASE 2 — Inventory, Multi-Warehouse & Purchase System
**Target Duration:** 3 Weeks  
**Depends On:** Phase 1  

#### Key Features & Components
1. **Product CRUD & UOM Multi-Unit Engine:** Base units, sales units, conversion factors (`UomConversionController`).
2. **Tiered Pricing Engine:** Wholesale, retail, and volume discount brackets (`PriceTierController`).
3. **Purchase Orders & Receipts (B3/B6):** Batch creation, input tax credits (S-050), AP creation.
4. **Zero-Cost Purchase Protection (S-004):** Frontend/backend block on zero-unit-cost purchases unless explicitly authorized by Manager PIN.
5. **Purchase Returns & Debit Notes (B18):** Reversing inventory batches and AP ledger entries.

---

### PHASE 3 — Sales, POS & Real-Time Sync Engine (VenSynQ)
**Target Duration:** 3 Weeks  
**Depends On:** Phase 2  

#### Key Features & Components
1. **High-Speed POS Checkout:** Barcode scanner listener, offline-first offline queue, real-time total calculator.
2. **VenSynQ Multi-Marketplace Sync Engine (`app/Services/VenSynQ/`):**
   - Marketplace integrations: WooCommerce, Amazon, Shopify, eBay.
   - Real-time stock sync triggers on sale completion.
   - Command overrides backfill (`2026_08_03_120000_backfill_vensync_command_overrides.php`).
3. **COGS Accounting Protection:** Automatic COGS journal posting on every sale line; explicit fallback lock against fabricated cost estimates.

---

### PHASE 4 — AI SmartCapture & Document OCR Pipeline
**Target Duration:** 2 Weeks  
**Depends On:** Phase 1  

#### Key Features & Components
1. **Document Upload & Parsing (`AiEntitlementService`):**
   - Free scan allowance check via `AiEntitlementService::freeScanAllowance()`.
   - Multi-tenant quota enforcement.
2. **SmartCapture Aliases & Auto-Mapping:** Supplier alias resolution, automated product matching.
3. **Auto-Reconciliation:** Purchase draft creation directly from scanned vendor receipts.

---

### PHASE 5 — Monetization, Billing & PlanGuard Entitlements
**Target Duration:** 2 Weeks  
**Depends On:** Phase 1  

#### Key Features & Components
1. **PlanGuard Middleware:** Route-level entitlement enforcement (`can:access-feature`).
2. **Tier Limits & Addon Billing:** Limit enforcement for users, stores, marketplace connections, and AI scans.
3. **Billing Portal UI (`Pricing.jsx`):** Plan comparison, upgrade modals, Stripe/AppSumo license key redemption.

---

### PHASE 6 — Multi-Surface Truth Sweep & Verification Framework v2
**Target Duration:** 2 Weeks  
**Depends On:** Phase 3  

#### Key Features & Components
1. **Consistency Group Verification (6 CG Groups):**
   - Assert byte-level equality across Dashboard cards, Reports, and API outputs.
2. **Ledger Truth Sweep:** Remediate 17 `TRANSACTION-DERIVED` and 59 `HYBRID` routes toward pure `LEDGER-DERIVED` sources.
3. **Automated Mutation Testing:** Run Pest/PHPUnit mutation tests against financial service methods.

---

### PHASE 7 — Production Hardening, Performance & Launch Gate
**Target Duration:** 1 Week  
**Depends On:** Phase 6  

#### Key Features & Components
1. **Performance Sweeps:** Sub-100ms API response targets, DB query indexing optimization.
2. **Deployment Packaging:** Automated release zipping, asset compilation (`npm run build`).
3. **Final Launch Gate:** Zero strict failures on `php artisan verify:map --strict`.

---

## Verification & Execution Protocol

To verify progress during execution of any phase, run:
```bash
# 1. Verification mapping gate
E:\Software\Xampp\php\php.exe artisan verify:map --stats

# 2. Automated test suite execution
E:\Software\Xampp\php\php.exe vendor/bin/pest
```

---
*End of Technical Build Plan v4.0*
