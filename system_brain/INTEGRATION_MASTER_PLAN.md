# VenQore ERP — Integration Master Plan
**Purpose:** Wire the existing Inertia/React frontend to the V3 backend services and clean up all obsolete files.  
**Based on:** INTEGRATION_AUDIT.md + V3_FILAMENT_INTEGRATION_AUDIT.md  
**Status at time of writing:** Backend 100% complete (Phases 0–6 locked). Frontend fully built. 0 test failures. 50 incomplete stubs remaining.

---

## THE SITUATION IN ONE PARAGRAPH

The V3 backend is complete. 42 controllers, 10 services, 65+ routes, all tested. The frontend is Inertia/React living in `resources/js/Pages/V3/`. The old Filament PHP classes are gone — only dead blade views remain in `resources/views/filament/`. The job is: (1) delete the dead views, (2) verify every React page is calling the correct V3 route with the correct payload shape, (3) fix any field name mismatches, (4) complete the 50 scenario stubs. Nothing architectural needs to change. This is purely a wiring and cleanup job.

---

## PHASE A — DELETION (Do This First, Takes 10 Minutes)

Delete the entire filament views directory. These files have no PHP backend and will never be rendered again.

```bash
rm -rf resources/views/filament/
```

That removes 23 dead blade files in one command. Verify nothing breaks after deletion:

```bash
php artisan view:clear
php artisan route:list | grep filament
# Must return nothing — no routes should reference filament views
```

**Files being deleted (23 total):**

| File | Reason |
|------|--------|
| `resources/views/filament/pages/analytics-dashboard.blade.php` | Replaced by React Dashboard + `/v3/dashboard` |
| `resources/views/filament/pages/cookbook.blade.php` | No V3 equivalent needed |
| `resources/views/filament/pages/parked-sales.blade.php` | POS handled by React |
| `resources/views/filament/pages/party-ledger.blade.php` | Replaced by `ReportController@partyLedger` |
| `resources/views/filament/pages/reports/all-transactions-report.blade.php` | Replaced by ReportService |
| `resources/views/filament/pages/reports/balance-sheet.blade.php` | Replaced by `ReportController@balanceSheet` |
| `resources/views/filament/pages/reports/bill-wise-profit-report.blade.php` | Replaced by `ReportController@grossProfit` |
| `resources/views/filament/pages/reports/day-book.blade.php` | Replaced by Trial Balance + Cash Flow |
| `resources/views/filament/pages/reports/expense-category-report.blade.php` | Covered by P&L expenses section |
| `resources/views/filament/pages/reports/expiry-report.blade.php` | Covered by Inventory Movement |
| `resources/views/filament/pages/reports/generic-report.blade.php` | No V3 equivalent — generic stub |
| `resources/views/filament/pages/reports/itemwise-profit.blade.php` | Replaced by `ReportController@grossProfit` |
| `resources/views/filament/pages/reports/loan-module-stub.blade.php` | Replaced by `LoanController` |
| `resources/views/filament/pages/reports/low-stock-report.blade.php` | Covered by Inventory Valuation |
| `resources/views/filament/pages/reports/party-statement-report.blade.php` | Replaced by `CustomerStatementController` / `SupplierStatementController` |
| `resources/views/filament/pages/reports/profit-loss.blade.php` | Replaced by `ReportController@profitAndLoss` |
| `resources/views/filament/pages/reports/purchase-report.blade.php` | Replaced by `ReportController@purchases` |
| `resources/views/filament/pages/reports/sale-aging-report.blade.php` | Replaced by `ReportController@agedReceivables` |
| `resources/views/filament/pages/reports/sale-purchase-by-party-group-report.blade.php` | Covered by Sales + Purchase reports |
| `resources/views/filament/pages/reports/sales-report.blade.php` | Replaced by `ReportController@sales` |
| `resources/views/filament/pages/reports/stock-aging.blade.php` | Covered by Inventory Movement |
| `resources/views/filament/pages/reports/stock-report.blade.php` | Replaced by `ReportController@inventoryValuation` |
| `resources/views/filament/pages/reports/trial-balance-report.blade.php` | Replaced by `ReportController@trialBalance` |
| `resources/views/filament/pages/reports-index.blade.php` | Replaced by React reports index |
| `resources/views/filament/resources/purchases/pages/create-purchase-return.blade.php` | Replaced by `PurchaseReturnController` |

**Files to KEEP (do not touch):**

| File | Reason |
|------|--------|
| `resources/views/app.blade.php` | Root Inertia shell — the entire React app loads through this |
| `resources/views/components/layouts/app.blade.php` | Shared layout component |
| `resources/views/emails/sales/receipt.blade.php` | Email receipt template |
| `resources/views/errors/404.blade.php` | Error page |
| `resources/views/errors/500.blade.php` | Error page |
| `resources/views/errors/503.blade.php` | Used by DatabaseHealthCheck middleware |
| `resources/views/installer/problem.blade.php` | Installer |
| `resources/views/invoices/receipt.blade.php` | Receipt PDF |
| `resources/views/parties/statement-pdf.blade.php` | Party statement PDF |
| `resources/views/pdf/labels.blade.php` | Label printing |
| `resources/views/pdf/receipt.blade.php` | POS receipt |
| `resources/views/pdf/sales-order.blade.php` | Sales order PDF |
| `resources/views/v3/invoices/pdf.blade.php` | V3 invoice PDF via `InvoicePdfController` |

---

## PHASE B — FIELD NAME RECONCILIATION

These are the column renames that happened during the V3 build. Every React component that submits a form or reads a response must use the new names. Audit every `axios.post`, `router.post`, and response data read in `resources/js/Pages/V3/`.

### Rename Map (Old name → V3 name)

| Context | Old Field Name | V3 Field Name | Affects |
|---------|---------------|---------------|---------|
| Sales payload | `invoice_number` | `reference_number` | SaleController, sales table display |
| Sales payload | `sale_date` | `sale_date` | ✅ No change |
| Sale items | `qty` | `quantity` | SaleService::post() items array |
| Sale items | `cogs_amount` | `total_cogs` | sale_item_batches table read |
| Sale items | `is_promotional` | `free_quantity` | Promo line items |
| Purchase items | `cost` | `unit_cost` | PurchaseController items array |
| Payment | `is_cash` | `payment_method` | Must send enum: `'cash'` or `'bank'` or `'credit'` |
| Journal entries | `entry_date` | `date` | Any direct journal reads |
| Reports (COGS) | `total_cost` | `total_cogs` | sale_item_batches column |

### Fields the Frontend Must Now Supply (Previously Implicit)

| Field | Required By | How to Supply |
|-------|-------------|---------------|
| `warehouse_id` | SaleService, PurchaseController, StockAdjustmentController | Add warehouse selector to sale/purchase forms. Default to primary warehouse if business uses one. |
| `sale_uom` | SaleService items array | Add UOM dropdown per line item. Populate from `/v3/products/{id}/uom`. Default to base UOM. |
| `approved_by` | CashShortageController, FiscalYearController | Pass `auth().user.id` for manager-level actions |

---

## PHASE C — WIRING (The Main Work)

Work through these in priority order. Each section states: which React page needs updating, which V3 route it must call, and what the payload must look like.

---

### PRIORITY 1 — Master Data (No journal impact, lowest risk)

These are CRUD operations. Wire them first to establish the data foundation everything else depends on.

#### C1.1 — Products

**React page:** `resources/js/Pages/V3/Products/`  
**Routes to wire:**

| Action | Method | Route |
|--------|--------|-------|
| List | GET | `v3/products` |
| Create | POST | `v3/products` |
| Edit | PUT | `v3/products/{id}` |
| Delete | DELETE | `v3/products/{id}` |
| Add UOM conversion | POST | `v3/products/{id}/uom` |
| Delete UOM conversion | DELETE | `v3/products/{id}/uom/{conversionId}` |
| Add price tier | POST | `v3/products/{id}/tiers` |
| Delete price tier | DELETE | `v3/products/{id}/tiers/{tierId}` |

**Required payload for create/edit:**
```json
{
  "name": "Product Name",
  "sku": "SKU001",
  "base_uom": "PCS",
  "is_manufactured": 0,
  "reorder_level": 10
}
```

#### C1.2 — Warehouses

**React page:** `resources/js/Pages/V3/Warehouses/`  
**Routes:** GET/POST `v3/warehouses`

#### C1.3 — Parties (Customers & Suppliers)

**React page:** `resources/js/Pages/V3/Parties/`  
**Routes:**

| Action | Method | Route |
|--------|--------|-------|
| Create | POST | `v3/parties` |
| Edit | PUT | `v3/parties/{id}` |
| Delete | DELETE | `v3/parties/{id}` |
| Customer statement | GET | `v3/customers/{id}/statement` |
| Supplier statement | GET | `v3/suppliers/{id}/statement` |

---

### PRIORITY 2 — Purchases & Sales (Journal-posting transactions)

These are the highest-volume transactions. Every form submit must route through the V3 controller — never write to `sales`, `purchases`, or `journal_entries` directly from the frontend.

#### C2.1 — Purchases

**React page:** `resources/js/Pages/V3/Purchases/`  
**POST to:** `v3/purchases`

**Required payload:**
```json
{
  "party_id": "uuid",
  "warehouse_id": "uuid",
  "purchase_date": "2026-03-07",
  "items": [
    {
      "product_id": "uuid",
      "qty": 10,
      "unit_cost": 150.00,
      "tax_rate": 0.05,
      "line_total": 1575.00
    }
  ],
  "payment_method": "credit",
  "amount_paid": 0
}
```

**Purchase Return — POST to:** `v3/purchases/{purchaseId}/return`  
**Supplier Payment — POST to:** `v3/supplier-payments`

Supplier payment payload:
```json
{
  "party_id": "uuid",
  "payment_method": "bank",
  "amount": 5000.00,
  "payment_date": "2026-03-07",
  "allocations": [
    { "purchase_id": "uuid", "amount": 5000.00 }
  ]
}
```

#### C2.2 — Sales / POS

**React page:** `resources/js/Pages/V3/Sales/` and POS screen  
**POST to:** `v3/sales`

**Required payload:**
```json
{
  "party_id": "uuid",
  "warehouse_id": "uuid",
  "sale_date": "2026-03-07",
  "reference_number": "INV-0001",
  "items": [
    {
      "product_id": "uuid",
      "quantity": 5,
      "unit_price": 200.00,
      "sale_uom": "PCS",
      "discount_percent": 0,
      "tax_rate": 0.05
    }
  ],
  "payment_method": "cash",
  "amount_paid": 1050.00,
  "notes": ""
}
```

**Sale Return — POST to:** `v3/sales/{saleId}/return`  
**Customer Payment — POST to:** `v3/customer-payments`  
**Write-off — POST to:** `v3/sales/{saleId}/write-off`  
**Bounce — POST to:** `v3/customer-payments/{jeId}/bounce`  
**Invoice PDF — GET:** `v3/sales/{saleId}/pdf`

#### C2.3 — Opening Balances

**POST to:** `v3/opening-balances`  
**Check status — GET:** `v3/opening-balances/status`

---

### PRIORITY 3 — Payments, Advances, Orders

#### C3.1 — Customer Advance

**POST to:** `v3/customer-advances`
```json
{
  "party_id": "uuid",
  "amount": 5000.00,
  "payment_method": "cash",
  "receipt_date": "2026-03-07"
}
```

#### C3.2 — Supplier Advance

**POST to:** `v3/supplier-advances`

#### C3.3 — Sales Orders

**POST to:** `v3/sales-orders`  
**Convert to sale:** `v3/sales-orders/{id}/convert`  
**Cancel:** `v3/sales-orders/{id}/cancel`

#### C3.4 — Quotations

**POST to:** `v3/quotations`  
**Convert to order:** `v3/quotations/{id}/convert-to-order`

#### C3.5 — Stock Adjustments & Transfers

**POST to:** `v3/stock-adjustments`  
**POST to:** `v3/stock-transfers`

---

### PRIORITY 4 — Manufacturing & HR

#### C4.1 — Bill of Materials

**POST to:** `v3/boms` (create)  
**PUT to:** `v3/boms/{id}` (new version)  
**DELETE to:** `v3/boms/{id}` (if no production runs)

BOM payload:
```json
{
  "product_id": "uuid",
  "version": 1,
  "items": [
    {
      "component_product_id": "uuid",
      "qty_per_unit": 2.0,
      "is_byproduct": false,
      "byproduct_nrv": 0
    }
  ]
}
```

#### C4.2 — Production Runs

**Start — POST to:** `v3/production-runs`
```json
{
  "bom_id": "uuid",
  "warehouse_id": "uuid",
  "planned_qty": 100,
  "run_date": "2026-03-07",
  "notes": ""
}
```

**Complete — POST to:** `v3/production-runs/{id}/complete`
```json
{ "actual_qty": 98 }
```

**Reverse — POST to:** `v3/production-runs/{id}/reverse`  
**Disassemble — POST to:** `v3/disassembly`

#### C4.3 — Employees & Payroll

**Create employee — POST to:** `v3/employees`  
**Accrue payroll — POST to:** `v3/payroll/accrue`  
**Pay payroll — POST to:** `v3/payroll/pay`  
**Settlement — POST to:** `v3/employee-settlements`

Settlement payload:
```json
{
  "employee_id": "uuid",
  "settlement_date": "2026-03-07",
  "payment_method": "bank",
  "partial_month_salary": 15000.00,
  "gratuity": 50000.00,
  "notice_pay": 0,
  "leave_encashment": 5000.00,
  "advance_deduction": 0,
  "approved_by": 1
}
```

---

### PRIORITY 5 — Special Financial Transactions

Wire these forms last. Each is a thin controller — the payload is simple.

| Transaction | Method | Route | Key Payload Fields |
|-------------|--------|-------|-------------------|
| Cash shortage | POST | `v3/cash-shortages` | `amount`, `narration` (min 10 chars), `approved_by` |
| Disaster claim (loss) | POST | `v3/disaster-claims` | `items[].product_id`, `items[].qty`, `claim_date` |
| Disaster recovery | POST | `v3/disaster-claims/{id}/recover` | `amount`, `payment_method` |
| Asset purchase | POST | `v3/assets` | `amount`, `description`, `payment_method` |
| Depreciation | POST | `v3/depreciation` | `amount`, `description`, `asset_account` |
| Loan drawdown | POST | `v3/loans/drawdown` | `amount`, `payment_method` |
| Loan repayment | POST | `v3/loans/repay` | `principal`, `interest`, `payment_method` |
| Expense | POST | `v3/expenses` | `amount`, `category`, `input_tax`, `payment_method` |
| Owner drawing | POST | `v3/funds` | `type: 'drawing'`, `amount`, `payment_method` |
| Capital injection | POST | `v3/funds` | `type: 'injection'`, `amount`, `payment_method` |
| Bank transfer | POST | `v3/bank-transfers` | `from_account`, `to_account` (must differ), `amount` |
| Donation (cash) | POST | `v3/donations` | `type: 'cash'`, `amount`, `payment_method` |
| Donation (inventory) | POST | `v3/donations` | `type: 'inventory'`, `items[].product_id`, `items[].qty` |

---

### PRIORITY 6 — Reports (Read-only, wire last)

All report pages call GET endpoints and render the returned JSON. No payload mutations.

| React Report Page | V3 Route | Query Params |
|-------------------|----------|-------------|
| Trial Balance | `GET v3/reports/trial-balance` | `?as_of=YYYY-MM-DD` |
| Profit & Loss | `GET v3/reports/profit-loss` | `?from=&to=` |
| Balance Sheet | `GET v3/reports/balance-sheet` | `?as_of=` |
| Cash Flow | `GET v3/reports/cash-flow` | `?from=&to=` |
| Aged Receivables | `GET v3/reports/aged-receivables` | `?as_of=` |
| Aged Payables | `GET v3/reports/aged-payables` | `?as_of=` |
| Sales Report | `GET v3/reports/sales` | `?from=&to=&party_id=&product_id=` |
| Purchase Report | `GET v3/reports/purchases` | `?from=&to=&party_id=` |
| Inventory Valuation | `GET v3/reports/inventory-valuation` | `?warehouse_id=` |
| COGS Report | `GET v3/reports/cogs` | `?from=&to=` |
| Gross Profit | `GET v3/reports/gross-profit` | `?from=&to=&product_id=` |
| Tax Report | `GET v3/reports/tax` | `?from=&to=` |
| Party Ledger | `GET v3/reports/party-ledger/{partyId}` | `?from=&to=` |
| Inventory Movement | `GET v3/reports/inventory-movement` | `?from=&to=&product_id=` |
| Export | `GET v3/reports/export` | `?report=&from=&to=&format=csv` |
| Dashboard | `GET v3/dashboard` | none |

**The old Filament report blades mapped to V3 routes as follows** (for reference when checking if any React report page was previously pointing to a dead route):

| Old Filament Blade | Now served by |
|--------------------|---------------|
| `trial-balance-report` | `ReportController@trialBalance` |
| `profit-loss` | `ReportController@profitAndLoss` |
| `balance-sheet` | `ReportController@balanceSheet` |
| `sales-report` | `ReportController@sales` |
| `purchase-report` | `ReportController@purchases` |
| `stock-report` | `ReportController@inventoryValuation` |
| `party-statement-report` | `CustomerStatementController` / `SupplierStatementController` |
| `party-ledger` | `ReportController@partyLedger` |
| `sale-aging-report` | `ReportController@agedReceivables` |
| `bill-wise-profit-report` | `ReportController@grossProfit` |
| `itemwise-profit` | `ReportController@grossProfit` |
| `day-book` | `ReportController@trialBalance` (filter by date) |
| `analytics-dashboard` | `DashboardController@index` |

---

### PRIORITY 7 — Admin

| Action | Method | Route | Notes |
|--------|--------|-------|-------|
| Change user role | PUT | `v3/users/{id}/role` | Admin only. Body: `{ "role": "admin\|manager\|cashier" }` |
| Set discount limit | POST | `v3/settings/discount-limits` | Body: `{ "role": "cashier", "max_discount_percent": 10 }` |
| Fiscal year close | POST | `v3/fiscal-year/close` | Body: `{ "fiscal_year_end": "2026-03-31", "approved_by": 1 }` |

---

## PHASE D — THREE ABSOLUTE RULES FOR THE FRONTEND

These are not guidelines. Violating any one of them will silently corrupt financial data.

**Rule 1 — Never write to financial tables directly.**  
No React page, no Axios call, no Inertia form should ever POST to a route that writes to `journal_entries`, `journal_items`, `inventory_batches`, or `payment_allocations` except through the V3 controllers. The controllers call the services. The services enforce double-entry and FIFO. Bypassing them breaks both.

**Rule 2 — Never update `payment_status` from the frontend.**  
`payment_status` on `sales` and `purchases` is maintained exclusively by `PaymentService::updatePaymentBadge()`. If the frontend tries to set it directly (e.g. `sale.payment_status = 'paid'`), it will get out of sync with actual allocations and the aged receivables report will be wrong.

**Rule 3 — Never update `remaining_qty` from the frontend.**  
`inventory_batches.remaining_qty` is maintained exclusively by `FifoService`. Any direct update corrupts COGS calculations, inventory valuation, and the 1100 ledger reconciliation.

---

## PHASE E — SCENARIO STUBS (50 Remaining)

Complete these after the wiring is stable so the tests can seed real data against the live schema.

### Batch 1 — Purchasing & Stock (11 stubs)
S-003, S-006, S-007, S-010, S-050, S-053, S-054, S-059, S-101, S-102, S-105

Pattern for all: seed `party (supplier)` + `product` + `warehouse` → call `PurchaseController` or `StockAdjustmentController` → assert `journal_items` debit/credit accounts.

### Batch 2 — Sales Core (20 stubs)
S-002, S-005, S-009, S-011, S-017, S-018, S-020, S-021, S-023, S-024, S-028, S-029, S-033, S-039, S-040, S-044, S-045, S-046, S-049, S-062

Pattern for all: seed `party (customer)` + `product` + `inventory batch` → call `SaleService::post()` → assert `sale_item_batches.total_cogs`, `journal_items` for accounts 4000/5000/1200, and `inventory_batches.remaining_qty`.

Notable stubs in this batch:
- S-011 (below-cost sale): assert warning is returned, sale posts if manager override provided
- S-017 (return): assert stock restored to original batch, journal reversed
- S-023/S-024 (tiered pricing): seed `product_price_tiers` rows, assert correct unit price applied

### Batch 3 — Manufacturing & HR (10 stubs)
S-013, S-015, S-016, S-094 (by-products), plus HR settlement stubs

Pattern: seed `bill_of_materials` + `bom_items` + raw material batches → call `ManufacturingService::startRun()` then `completeRun()` → assert WIP journal zeroed, FG batch created at correct unit cost.

### Batch 4 — Reports & Reconciliation (9 stubs)
Assert `ReportService` output matches hand-calculated values against seeded data.

Critical assertions:
- `trialBalance()['balanced'] === true`
- `balanceSheet()['balanced'] === true`  
- `cogsReport()['reconciled'] === true` (5000 ledger = sale_item_batches sum)
- `inventoryValuation()['grand_total']` = account 1100 balance

---

## EXECUTION ORDER SUMMARY

```
Day 1:   Phase A  — Delete filament views (rm -rf, 10 minutes)
Day 1:   Phase B  — Audit all React pages for field name mismatches
Day 2-3: Phase C1 — Wire Products, Warehouses, Parties
Day 4-5: Phase C2 — Wire Purchases and Sales (most critical)
Day 6:   Phase C3 — Wire Payments, Orders, Advances
Day 7:   Phase C4 — Wire Manufacturing and HR
Day 8:   Phase C5 — Wire Special Transactions
Day 9:   Phase C6 — Wire all 15 Report pages
Day 10:  Phase C7 — Wire Admin pages
Day 11+: Phase E  — Complete 50 scenario stubs in 4 batches
Final:   Re-run full test suite. All 120 must pass.
```

---

## HOW TO AUDIT EACH REACT PAGE (Checklist Per Page)

For every file in `resources/js/Pages/V3/`, run through this checklist:

```
[ ] Identify the HTTP calls — every axios.post / router.post / axios.get
[ ] Check the URL — does it point to a /v3/ route?
[ ] Check field names in the payload — use the rename map in Phase B
[ ] Check that warehouse_id is included where required
[ ] Check that sale_uom is included on line items
[ ] Check that payment_method is a valid enum ('cash','bank','credit')
[ ] Check response data reads — updated column names (reference_number, total_cogs)
[ ] Confirm no direct DB manipulation — no raw table writes bypassing controllers
[ ] Test the form end-to-end against the local dev database
[ ] Run the relevant scenario test after wiring to confirm backend integrity
```

---

## RISK FLAGS (From Audit — Must Not Be Ignored)

| Risk | Location | Consequence if ignored |
|------|----------|----------------------|
| Frontend calls `Sale::create()` directly | Any old non-V3 sale form | No FIFO deduction, no journal entry, inventory and ledger corrupt |
| Frontend updates `payment_status` directly | Payment form | Aged receivables wrong, payment badges wrong |
| Frontend writes to `inventory_batches.remaining_qty` | Any stock form | COGS wrong, 1100 reconciliation fails |
| Frontend calls `journal_entries` directly | Any accounting form | Double-entry not enforced, trial balance will not balance |
| Old non-V3 routes still active in web.php | `routes/web.php` lines before 804 | Old routes may bypass V3 entirely — audit and disable them |

**Action on the last risk:** Run this and review every route above line 804 in web.php:
```bash
grep -n "Route::" routes/web.php | head -50
```
Any route pointing to a non-V3 controller that handles sales, purchases, payments, or inventory must be either redirected to the V3 equivalent or disabled.

---

*Generated from INTEGRATION_AUDIT.md and V3_FILAMENT_INTEGRATION_AUDIT.md*  
*Backend: 100% complete | Frontend wiring: 0% complete | Scenario stubs: 69/120 passing*
