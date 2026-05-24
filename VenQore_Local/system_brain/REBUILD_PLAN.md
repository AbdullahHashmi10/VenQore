# VenQore ERP — REBUILD PLAN v3.0

> **Strategy:** Build New, Don't Patch — Fresh V3 migrations + services alongside existing code.
> **Total Duration:** ~22 weeks (7 phases)
> **Prefix:** All new migrations use `_v3_` prefix. All new services go to `app/Services/V3/`.

---

## PHASE 0 — FOUNDATION & DATABASE SCHEMA
**Duration:** 2 Weeks | **Depends On:** Nothing

### Objective
Stand up every database table, every CHECK constraint, every trigger, and seed the Chart of Accounts. Nothing else moves until the schema is locked.

| Task # | Task | File/Layer | Output |
|--------|------|-----------|--------|
| 0.1 | Create `accounts` table with full COA seed | migration + seeder | 38 accounts seeded |
| 0.2 | Create `journal_entries` table | migration | Idempotency UNIQUE index |
| 0.3 | Create `journal_items` table + CHECK constraint | migration | Debit/credit mutual exclusion enforced |
| 0.4 | Create `payment_allocations` table + over-allocation trigger | migration | S-068 enforced at DB |
| 0.5 | Create `party_snapshots` table | migration | UNIQUE(party_id, account_id) |
| 0.6 | Create `inventory_batches` table + CHECK constraints | migration | remaining_qty >= 0, unit_cost > 0 on opening |
| 0.7 | Create `sale_item_batches` table | migration | Indexes on sale_item_id, inventory_batch_id |
| 0.8 | Create `product_uom_conversions` table | migration | UNIQUE(product_id, sale_uom) |
| 0.9 | Create `product_price_tiers` table | migration | Tiered pricing support |
| 0.10 | Create `discount_limits` table + seed defaults | migration + seeder | Role-based limits |
| 0.11 | Create `disaster_claims` table | migration | B29 two-step support |
| 0.12 | Create `employees` table | migration | HR foundation |
| 0.13 | Create `disassembly_boms` + `disassembly_bom_items` tables | migration | B30 support |
| 0.14 | Create `bill_of_materials` + `bom_items` tables (versioned) | migration | BOM versioning |
| 0.15 | Create `production_runs` table | migration | Manufacturing foundation |
| 0.16 | Create `system_settings` table + seed defaults | migration + seeder | roundoff_tolerance, period_lock_date |
| 0.17 | Create `sales_orders` table (no journal — pre-transaction) | migration | Price-locked orders |
| 0.18 | Run full schema validation script | test | All tables exist, all constraints fire |

### Phase 0 Verification Gate
- ✓ All tables created and migrated without error
- ✓ CHECK (remaining_qty >= 0) rejects negative INSERT
- ✓ CHECK on journal_items rejects debit > 0 AND credit > 0 on same row
- ✓ Over-allocation trigger fires on payment_allocations
- ✓ 38 accounts seeded correctly with proper types and normal balances
- ✓ Account 7000 exists with type equity

---

## PHASE 1 — CORE SERVICES (The Engine Room)
**Duration:** 3 Weeks | **Depends On:** Phase 0

### Objective
Build the 10 core V3 service classes. Every service is unit-tested in isolation before any controller touches it.

| Task # | Task | File/Layer | Depends On | Output |
|--------|------|-----------|------------|--------|
| 1.1 | Build `AccountingService` — createEntry(), reverseEntry(), getBalance() | app/Services/V3/AccountingService.php | 0.2, 0.3 | Double-entry engine working |
| 1.2 | Build `FifoService` — deductStock(), restoreStock(), receiveBatch(), checkAvailability() | app/Services/V3/FifoService.php | 0.6, 0.7 | FIFO deductions working |
| 1.3 | Build `PaymentService` — allocate(), updatePaymentBadge(), voidAllocations() | app/Services/V3/PaymentService.php | 0.4 | Payment allocation working |
| 1.4 | Build `InventoryService` — receivePurchase(), adjustStock() | app/Services/V3/InventoryService.php | 1.2 | Batch creation working |
| 1.5 | Build `PartyService` — rebuildSnapshot(), getBalance() | app/Services/V3/PartyService.php | 0.5, 1.1 | Snapshot rebuild working |
| 1.6 | Build `TaxService` — calculateLineTax(), taxReport() | app/Services/V3/TaxService.php | 0.1 | Tax calculation working |
| 1.7 | Build `UomService` — toBaseQty(), getConversionFactor() | app/Services/V3/UomService.php | 0.8 | UOM conversion working |
| 1.8 | Build `ManufacturingService` — start(), complete(), partialReverse(), disassemble() | app/Services/V3/ManufacturingService.php | 0.14, 0.15, 1.2 | Production working |
| 1.9 | Build `SettlementService` — processSettlement() | app/Services/V3/SettlementService.php | 0.12, 1.1 | B27 working |
| 1.10 | Build `ReportService` — trialBalance(), profitLoss(), balanceSheet() | app/Services/V3/ReportService.php | 1.1 | Reports from ledger |
| 1.11 | Wire AccountingService::reverseEntry() → PaymentService::voidAllocations() | AccountingService | 1.1, 1.3 | Reversal atomicity |
| 1.12 | Wire AccountingService::createEntry() → PartyService::rebuildSnapshot() | AccountingService | 1.1, 1.5 | Snapshot auto-rebuild |
| 1.13 | Write unit tests for ALL service methods | tests/Unit/V3/ | 1.1–1.10 | 100% service coverage |
| 1.14 | Write all 120 scenario tests (stubs — pass/fail) | tests/Feature/V3/Scenarios/ | 1.13 | Scenario test matrix |

### Phase 1 Verification Gate
- ✓ AccountingService rejects unbalanced entries (debit ≠ credit)
- ✓ FifoService deducts oldest first across 5 random orderings
- ✓ PaymentService blocks over-allocation at app layer
- ✓ PartyService rebuilds snapshot within same DB::transaction()
- ✓ All 120 scenario test stubs **exist** — each test must fail with `NotImplementedException` only (never a PHP error, never a missing class error, never a database error). A stub that fails for any reason other than NotImplementedException is a broken stub, not a passing gate.

---

## PHASE 2 — INVENTORY & PURCHASE MODULE
**Duration:** 3 Weeks | **Depends On:** Phase 1

| Task # | Task | File/Layer | Depends On | Output |
|--------|------|-----------|------------|--------|
| 2.1 | Product CRUD with UOM, tax_rate, price_includes_tax | ProductController V3 | Phase 1 | Products manageable |
| 2.2 | UOM conversion configuration per product | UomController | 1.7 | Conversions configurable |
| 2.3 | Tiered pricing configuration per product | PriceTierController | 0.9 | Tiers configurable |
| 2.4 | Warehouse CRUD | WarehouseController | Phase 0 | Warehouses manageable |
| 2.5 | Cash purchase (B3) — create batches + journal | PurchaseController V3 | 1.1, 1.2, 1.4 | B3 posts correctly |
| 2.6 | Credit purchase (B6) | PurchaseController V3 | 2.5 | B6 posts, AP created |
| 2.7 | Purchase with input tax + partial ITC (S-050) | PurchaseController V3 | 2.5, 1.6 | Input tax correct |
| 2.8 | Zero-cost purchase warning (S-004) | React ZeroCostWarning | 2.5 | Warning shown |
| 2.9 | Purchase return / debit note (B18) | PurchaseReturnController | 2.5 | B18 posts correctly |
| 2.10 | Supplier payment (B5) + allocation | PaymentOutController | 1.3 | B5 + allocation working |
| 2.11 | Opening balance entry (B19) — stock + AR/AP | OpeningBalanceController | 1.1, 1.2 | B19 with zero-cost block |
| 2.12 | Supplier advance payment (B21) | AdvanceController | 1.1 | B21 posts correctly |
| 2.13 | Stock adjustment increase (B11) + decrease (B10) | StockAdjustmentController | 1.2, 1.4 | B10/B11 post correctly |
| 2.14 | Stock transfer between warehouses (B12) | StockTransferController | 1.2 | B12 works (no journal) |
| 2.15 | Supplier statement view (party balance + history) | React SupplierStatement | 1.5 | Statement accurate |

### Phase 2 Verification Gate
- ✓ Purchase creates inventory_batch with correct unit_cost
- ✓ B19 opening stock with cost=0 is BLOCKED
- ✓ Account 7000 nets to zero after valid B19 entries
- ✓ Stock adjustment B10 deducts FIFO oldest-first
- ✓ Partial ITC splits tax correctly between 2300 and 6000

---

## PHASE 3 — SALES, POS & CUSTOMER MANAGEMENT
**Duration:** 4 Weeks | **Depends On:** Phase 2

| Task # | Task | File/Layer | Depends On | Output |
|--------|------|-----------|------------|--------|
| 3.1 | Customer (party) CRUD with party_snapshots | PartyController V3 | Phase 1 | Customers manageable |
| 3.2 | POS sale form (B1 cash sale) — barcode scan, qty, UOM, tiered price, FIFO | SaleController V3 (B1) | 3.1, Phase 2 | B1 posts correctly |
| 3.3 | Credit sale (B2) | SaleController V3 (B2) | 3.2 | B2 posts, AR created |
| 3.4 | Discount enforcement (S-044: role-based limits, manager PIN) | DiscountService + PIN modal | 3.2, 0.10 | Limits enforced |
| 3.5 | Below-cost sale warning + manager PIN (S-011) | SaleController + PIN modal | 3.2 | S-011 enforced |
| 3.6 | Promotional free items (S-040) | SaleController | 3.2 | Free items at Rs.0 + COGS |
| 3.7 | Tiered pricing blended average (S-042) | UomService | 2.3 | S-042 working |
| 3.8 | UOM conversion on sale lines (S-012) | FifoService + UomService | 2.2 | Deduction in base UOM |
| 3.9 | Sale return (B9) — restoreStock(), reverse COGS | SaleReturnController V3 | 3.2, 1.2 | B9 posts correctly |
| 3.10 | Customer payment receipt (B4) + PaymentService allocation | PaymentInController V3 | 3.3, 1.3 | B4 + allocation working |
| 3.11 | Bounced cheque reversal (B25) | BounceController V3 | 3.10 | B25 posts, badge reverts |
| 3.12 | Bad debt write-off (B26) — manager approval | BadDebtController V3 | 3.3 | B26 posts correctly |
| 3.13 | Customer advance receipt (B20) — no tax posted | AdvanceController V3 | 3.1 | B20 posts, no tax |
| 3.14 | Advance settlement on delivery (S-048) | SaleController advance conversion | 3.13 | Tax posted at delivery |
| 3.15 | Sales Order (price locked, no journal, S-045) | SalesOrderController V3 | 3.1 | SO created, price locked |
| 3.16 | Convert Sales Order to Invoice | SaleController::fromOrder() | 3.15 | Conversion works |
| 3.17 | Quotation and Proforma Invoice (no journal) | QuotationController V3 | 3.1 | Docs created |
| 3.18 | Customer statement + aged receivables | React CustomerStatement | 3.10 | AR aging accurate |
| 3.19 | Invoice PDF generation | InvoicePdfController V3 | 3.2 | PDF generates correctly |

### Phase 3 Verification Gate
- ✓ FIFO sale pulling from 3 batches: sale_item_batches has 3 rows with correct costs
- ✓ Tiered pricing: 60 units across 3 tiers produces correct blended unit price
- ✓ UOM conversion: sell 500g of KG product → batch deducted by 0.5 KG
- ✓ Cashier cannot apply 25% discount without manager PIN (role limit = 10%)
- ✓ Over-allocation: Rs.15,000 on Rs.10,000 invoice throws at BOTH app AND DB level
- ✓ B25: invoice reverts to Unpaid, original B4 stays in journal
- ✓ B20 advance posts to 2100 with ZERO tax

---

## PHASE 4 — MANUFACTURING, HR & SPECIAL TRANSACTIONS
**Duration:** 3 Weeks | **Depends On:** Phase 3

| Task # | Task | File/Layer | Depends On | Output |
|--------|------|-----------|------------|--------|
| 4.1 | BOM builder — products, qty per unit, 5 levels deep | BomController + React | Phase 2 | BOMs configurable |
| 4.2 | By-product configuration on BOM (S-094) | BomController enhancement | 4.1 | By-products configurable |
| 4.3 | Production run start — deduct materials, WIP entry (B16 WIP) | ManufacturingService::start() | 4.1, Phase 1 | Production starts correctly |
| 4.4 | Production run complete — FG batch, close WIP (B16 close) | ManufacturingService::complete() | 4.3 | B16 complete correct |
| 4.5 | By-product handling on completion (S-094) | ManufacturingService | 4.4 | NRV by-product batch |
| 4.6 | Partial production reversal (S-015) | ManufacturingService::partialReverse() | 4.4 | Unsold qty only |
| 4.7 | Employee CRUD | EmployeeController V3 | Phase 1 | Employees manageable |
| 4.8 | Monthly salary accrual (B7) + payment (B8) | PayrollController V3 | 4.7 | Payroll posts correctly |
| 4.9 | Final employee settlement (B27) | SettlementService + Controller | 4.7, 1.9 | B27 posts correctly |
| 4.10 | Cash shortage recording (B28) | CashShortageController V3 | Phase 1 | Manager-only, narration required |
| 4.11 | Insurance claim B29 (2-step) | DisasterClaimController V3 | Phase 1 | B29 two-step works |
| 4.12 | Fixed asset purchase journal | AssetController V3 | Phase 1 | Fixed assets tracked |
| 4.13 | Depreciation journal (B23) | DepreciationController V3 | 4.12 | B23 posts correctly |
| 4.14 | Loan drawdown (B24) + repayment with interest | LoanController V3 | Phase 1 | B24 posts correctly |
| 4.15 | Set disassembly (B30) | ManufacturingService::disassemble() | 1.8, 0.13 | B30 posts correctly |
| 4.16 | Operating expense (B13) | ExpenseController V3 | Phase 1 | B13 posts correctly |
| 4.17 | Owner drawing (B14) / capital injection (B15) | FundController V3 | Phase 1 | B14/B15 post correctly |
| 4.18 | Bank transfer (B17) | BankTransferController V3 | Phase 1 | B17 posts correctly |
| 4.19 | Charitable donation (B22) | DonationController V3 | Phase 1 | B22 posts correctly |

### Phase 4 Verification Gate
- ✓ 100-unit production run: WIP balance matches during run
- ✓ Production completion creates finished goods batch at combined cost
- ✓ B27 composite entry: 6100 + 6800 debit, 2400 + Cash credit
- ✓ B28 blocked without narration. B28 blocked for non-manager.
- ✓ B29 Step 1 and Step 2 linked by disaster_claim_id
- ✓ B30 disassembly: component costs sum to parent's FIFO cost

---

## PHASE 5 — REPORTS, DASHBOARD & FINANCIAL STATEMENTS
**Duration:** 3 Weeks | **Depends On:** Phase 4

| Task # | Task | File/Layer | Depends On | Output |
|--------|------|-----------|------------|--------|
| 5.1 | Trial Balance report | ReportService::trialBalance() | Phase 1 | Balances correctly |
| 5.2 | Profit & Loss Statement | ReportService::profitLoss() | 5.1 | P&L correct |
| 5.3 | Balance Sheet | ReportService::balanceSheet() | 5.1 | Assets = Liabilities + Equity |
| 5.4 | Cash Flow Statement | ReportService::cashFlow() | 5.1 | CF statement correct |
| 5.5 | Aged Receivables | ReportService::agedReceivables() | 3.10 | Aging correct |
| 5.6 | Aged Payables | ReportService::agedPayables() | Phase 2 | AP aging correct |
| 5.7 | Sales report (by date, product, customer) | ReportService::salesReport() | Phase 3 | Sales data correct |
| 5.8 | Purchase report (by date, product, supplier) | ReportService::purchasesReport() | Phase 2 | Purchase data correct |
| 5.9 | Inventory Valuation report | ReportService::inventoryValuation() | Phase 2 | SUM(qty × cost) |
| 5.10 | COGS report (from sale_item_batches) | ReportService::cogsReport() | Phase 3 | COGS = account 5000 |
| 5.11 | Gross Profit per product/period | ReportService::grossProfit() | 5.10 | Margins accurate |
| 5.12 | Dashboard widgets — Cash, Bank, AR, AP, Revenue, COGS, Net Profit | React Dashboard + Recharts | 5.1–5.4 | Dashboard live |
| 5.13 | Tax report — 2200 vs 2300 | ReportService::taxReport() | Phase 3 | Tax figures correct |
| 5.14 | Party ledger/statement | ReportService::partyLedger() | Phase 3 | Ledger accurate |
| 5.15 | Inventory movement report | ReportService::inventoryMovement() | Phase 2 | Movement report correct |
| 5.16 | Export all reports to PDF + Excel | ReportExportController V3 | 5.1–5.15 | Export working |

### Phase 5 Verification Gate
- ✓ Trial Balance: SUM(all debits) = SUM(all credits) across all time
- ✓ Balance Sheet: Assets = Liabilities + Equity (to the paisa)
- ✓ Account 1100 = SUM(inventory_batches.remaining_qty × unit_cost)
- ✓ Account 5000 = SUM(sale_item_batches.total_cost)
- ✓ Account 7000 nets to zero
- ✓ Dashboard Cash widget = AccountingService::getBalance("1000")

---

## PHASE 6 — PERFORMANCE, SECURITY & DEPLOYMENT
**Duration:** 3 Weeks | **Depends On:** Phase 5

| Task # | Task | File/Layer | Depends On | Output |
|--------|------|-----------|------------|--------|
| 6.1 | PWA manifest + service worker (installable) | public/manifest.json + sw.js | Phase 5 | App installable |
| 6.2 | Connection guard middleware | DatabaseHealthCheck middleware | Phase 3 | No offline writes |
| 6.3 | Network connectivity banner (ConnectionGuard) | React ConnectionGuard.jsx | 6.2 | POS locks when offline |
| 6.4 | MySQL query optimization — indexes on journal_items, inventory_batches | migration | Phase 1 | Queries fast |
| 6.5 | party_snapshots performance test | tests/Performance/ | 6.4 | Snapshot < 2ms |
| 6.6 | Laravel queues for heavy jobs | config/queue.php | Phase 5 | Queue working |
| 6.7 | Role & permission UI | RoleController + React | Phase 1 | Permissions configurable |
| 6.8 | Fiscal year close — zero P&L into 3100 | FiscalYearController V3 | Phase 5 | Year-close working |
| 6.9 | Audit log — journal entry with user, IP, approved_by | AuditService V3 | Phase 1 | Full audit trail |
| 6.10 | Deployment script | deploy.sh | All phases | Deploy automated |
| 6.11 | Run all 120 scenario tests on production environment | tests/Feature/ | All phases | All scenarios pass |
| 6.12 | Deployment hardening + smoke test | Final validation | 6.11 | Production ready |

### Phase 6 Verification Gate
- ✓ All 120 scenario tests pass
- ✓ All 32 B-transactions produce correct journal entries
- ✓ Trial Balance = zero difference on fully-seeded test data
- ✓ PWA installs on desktop Chrome and tablet Safari
- ✓ ConnectionGuard blocks all financial writes when offline
- ✓ All report numbers match hand-calculated expected values
