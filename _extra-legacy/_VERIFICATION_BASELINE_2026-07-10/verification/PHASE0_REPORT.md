# Phase 0 — Number Registry Report
## VenQore Verification Blueprint

**Date:** 2026-07-09  
**Status:** ✅ Complete  
**Confidence gained:** ~0% → ~15% (knowledge, not proof yet)

---

## What Phase 0 Produced

| Deliverable | File | Status |
|---|---|---|
| Number Registry (machine-readable) | `verification/number_registry.yaml` | ✅ Created |
| `verify:map` artisan command | `app/Console/Commands/VerifyMap.php` | ✅ Created |
| This human-readable report | `verification/PHASE0_REPORT.md` | ✅ Created |

---

## System Inventory

| Dimension | Count |
|---|---|
| Web routes (web.php) | 757 |
| API routes (api.php) | 27 |
| Controllers | 182 |
| Inertia JSX pages | 231 |
| Financial service methods (FinancialReportingService) | 26 |

---

## Registry Summary

| Classification | Count | Meaning |
|---|---|---|
| **LEDGER-DERIVED** ✅ | 17 | Reads only `journal_items`/`journal_entries` via `FinancialReportingService` or `AccountingService` |
| **TRANSACTION-DERIVED** ⚠️ | 8 | Reads raw `sales`/`purchases`/`payments` tables — bypasses ledger |
| **HYBRID** ⚠️ | 3 | Reads both ledger AND transaction tables |
| **NON-FINANCIAL** | 0 | (excluded from registry) |
| **Total registered** | **28** | |
| **Verified by tests** | 0 | → target: 100% by Phase 11 |

---

## Data Source Architecture — The Three Tiers

```
EVENT (sale, purchase, payment, webhook)
  │
  ▼
WRITE PATH
  ├─ V3 SaleController → SaleService → AccountingService → journal_entries/journal_items  ✅
  ├─ Legacy SaleController → inline postSaleJournal() → journal_entries                   ⚠️ COGS bug
  └─ WooCommerceController → InventoryService → sales table ONLY                          🚨 NO JOURNAL

LEDGER (journal_entries + journal_items)
  │
  ▼
READ PATH (reporting)
  ├─ FinancialReportingService → Trial Balance, P&L, Balance Sheet, Cash Flow, Aged AR/AP ✅
  ├─ AccountingService::getBalance() → Dashboard cards                                    ✅
  └─ Direct model queries → Sales List, Purchase List, Expense List                       ⚠️ TRANSACTION-DERIVED
```

---

## Key Findings from Scan

### ✅ Correctly Wired (LEDGER-DERIVED)

- **`DashboardController`** — 100% ledger-derived. Every card (Cash, Bank, AR, AP, Revenue MTD, COGS MTD, Net Profit MTD) flows through `AccountingService::getBalance()` or `FinancialReportingService::getProfitAndLoss()`. Zero raw DB queries in the controller.

- **`ReportController`** — A clean thin façade. All 13 public methods are single-line delegations to `FinancialReportingService`. Trial Balance, P&L, Balance Sheet, Cash Flow, Aged Receivables, Aged Payables, Party Ledger are all correctly LEDGER-DERIVED.

- **`ReportExportController`** — Delegates entirely to `FinancialReportingService`. Exports should byte-match screen reports (to be verified in Phase 5).

### ⚠️ Known Issues / Flags

| ID | Surface | Issue |
|---|---|---|
| **POS-003** | POS Checkout (legacy) | COGS fabrication on FIFO failure. **Audit Finding 1 / L001** |
| **WOO-001** | WooCommerce webhook | Sales create zero journal entries. **Audit Finding 3 / L003** |
| **POS-001** | POS Cart total | JS-side `parseFloat` arithmetic. Phase 10 target |
| **BANK-001** | Bank balances | `bank_accounts.balance` may not reconcile with GL 1010 |
| **RPT-014** | Inventory Movement | HYBRID — mixes physical and financial data |
| **STMT-001/002** | Customer/Supplier Statements | HYBRID — N+1 query risk on `payment_allocations` |

### 🐛 Bug Discovered During Scan

**`ReportController@grossProfit`** reads a `product_id` query param from the request but **does NOT pass it** to `FinancialReportingService::getGrossProfitByProduct()`. Product-level filtering is silently dropped — a correctness bug independent of the audit findings.

---

## Consistency Groups

Six groups of metrics that claim to show the same value across multiple surfaces.
Phase 6 will assert byte-equality across all members:

| Group | Metric | Surfaces | Risk |
|---|---|---|---|
| **CG-001** | Total Revenue | Dashboard, P&L, Sales Report, Export | HIGH |
| **CG-002** | Net Profit | Dashboard, P&L | MEDIUM |
| **CG-003** | Accounts Receivable | Dashboard, Aged AR, Customer Statements | HIGH |
| **CG-004** | Accounts Payable | Dashboard, Aged AP, Supplier Statements | HIGH |
| **CG-005** | Inventory Asset value | Inv. Valuation, Balance Sheet 1100, Trial Balance | **CRITICAL** |
| **CG-006** | COGS | P&L, COGS Report, Gross Profit | HIGH |

---

## How to Use the `verify:map` Command

```bash
# Standard scan — checks all financial routes against registry
php artisan verify:map

# CI mode — exits 1 if any unregistered metric route is found
php artisan verify:map --strict

# Registry statistics only
php artisan verify:map --stats

# Machine-readable JSON (for CI pipeline parsing)
php artisan verify:map --output=json
```

---

## What Happens in CI

Add this to your CI pipeline (`.github/workflows/venqore-tests.yml` or `ci.yml`):

```yaml
- name: Phase 0 — Verify all financial routes are in Number Registry
  run: php artisan verify:map --strict
```

Any new controller that displays financial data must be added to `verification/number_registry.yaml` before the PR can merge. This is the permanent guard described in Phase 0 of the blueprint.

---

## Next Steps

Phase 0 is complete. The path forward per the blueprint:

```
Phase 0 ✅ → Phase 1 (Golden Company) → Phase 2 (Ledger Invariants) → ...
```

**Fastest path to fixing the immediate inconsistencies:**
> Phase 0 → Phase 1 (minimal one-month universe) → Phase 6 (consistency sweep)
> This combination finds every "different number in different places" defect in ~2 weeks.

---

## Open Questions (to answer before Phase 1)

1. **Golden Company date range:** Should the 365-day universe include Feb 29 (leap day testing)? Blueprint recommends yes.
2. **Tenant 2:** Should it be a deliberately minimal store (1 product, 1 sale) just to test isolation, or a fuller dataset?
3. **WooCommerce fixture:** Do we have a recorded real WooCommerce webhook payload to replay, or do we need to create one?
4. **Fixed clock:** What should `Carbon::setTestNow()` be set to for the Golden Company? Suggest `2025-12-31 23:59:59` so year-end rollover is testable.
5. **Currency:** Single-currency PKR for the Golden Company, or multi-currency from the start?
