# VenQore ERP — TASK CHECKLIST v3.0

> Flat checklist of every task from the Rebuild Plan. Check off as completed.

---

## PHASE 0 — FOUNDATION & DATABASE SCHEMA (2 Weeks)

- [x] 0.1 — Create `accounts` table with full COA seed (38 accounts)
- [x] 0.2 — Create `journal_entries` table with idempotency_key UNIQUE
- [x] 0.3 — Create `journal_items` table + CHECK constraint (debit/credit mutual exclusion)
- [x] 0.4 — Create `payment_allocations` table + over-allocation trigger
- [x] 0.5 — Create `party_snapshots` table with UNIQUE(party_id, account_id)
- [x] 0.6 — Create `inventory_batches` table + CHECK (remaining_qty >= 0, unit_cost > 0 on opening)
- [x] 0.7 — Create `sale_item_batches` table
- [x] 0.8 — Create `product_uom_conversions` table with UNIQUE(product_id, sale_uom)
- [x] 0.9 — Create `product_price_tiers` table
- [x] 0.10 — Create `discount_limits` table + seed defaults
- [x] 0.11 — Create `disaster_claims` table
- [x] 0.12 — Create `employees` table
- [x] 0.13 — Create `disassembly_boms` + `disassembly_bom_items` tables
- [x] 0.14 — Create `bill_of_materials` + `bom_items` tables (versioned)
- [x] 0.15 — Create `production_runs` table
- [x] 0.16 — Create `system_settings` table + seed defaults
- [x] 0.17 — Create `sales_orders` table (no journal)
- [x] 0.18 — Run full schema validation script

### Phase 0 Gate
- [x] All tables migrated without error
- [x] CHECK constraints fire correctly on invalid data
- [x] 38 accounts seeded with correct types

---

## PHASE 1 — CORE SERVICES (3 Weeks)

- [x] 1.1 — Build AccountingService (createEntry, reverseEntry, getBalance)
- [x] 1.2 — Build FifoService (deductStock, restoreStock, receiveBatch, checkAvailability)
- [x] 1.3 — Build PaymentService (allocate, updatePaymentBadge, voidAllocations)
- [x] 1.4 — Build InventoryService (receivePurchase, adjustStock)
- [x] 1.5 — Build PartyService (rebuildSnapshot, getBalance)
- [x] 1.6 — Build TaxService (calculateLineTax, taxReport)
- [x] 1.7 — Build UomService (toBaseQty, getConversionFactor)
- [x] 1.8 — Build ManufacturingService (start, complete, partialReverse, disassemble)
- [x] 1.9 — Build SettlementService (processSettlement)
- [x] 1.10 — Build ReportService (trialBalance, profitLoss, balanceSheet)
- [x] 1.11 — Wire reverseEntry → voidAllocations
- [x] 1.12 — Wire createEntry → rebuildSnapshot
- [x] 1.13 — Write unit tests for ALL service methods
- [x] 1.14 — Write all 120 scenario test stubs

### Phase 1 Gate
- [x] AccountingService rejects unbalanced entries
- [x] FifoService deducts oldest first
- [x] PaymentService blocks over-allocation
- [x] PartyService rebuilds in same transaction
- [x] All 120 scenario test stubs exist

---

## PHASE 2 — INVENTORY & PURCHASE MODULE (3 Weeks)

- [x] 2.1 — Product CRUD with UOM, tax_rate, price_includes_tax
- [x] 2.2 — UOM conversion configuration per product
- [x] 2.3 — Tiered pricing configuration per product
- [x] 2.4 — Warehouse CRUD
- [x] 2.5 — Cash purchase (B3) — create batches + journal
- [x] 2.6 — Credit purchase (B6)
- [x] 2.7 — Purchase with input tax + partial ITC (S-050)
- [x] 2.8 — Zero-cost purchase warning (S-004)
- [x] 2.9 — Purchase return / debit note (B18)
- [x] 2.10 — Supplier payment (B5) + allocation
- [x] 2.11 — Opening balance entry (B19) with zero-cost block
- [x] 2.12 — Supplier advance payment (B21)
- [x] 2.13 — Stock adjustment increase (B11) + decrease (B10)
- [x] 2.14 — Stock transfer between warehouses (B12)
- [x] 2.15 — Supplier statement view

### Phase 2 Gate
- [x] Purchase creates correct inventory_batch
- [x] B19 with cost=0 is BLOCKED
- [x] Account 7000 nets to zero
- [x] B10 deducts FIFO oldest-first

---

## PHASE 3 — SALES, POS & CUSTOMER MANAGEMENT (4 Weeks)

- [x] 3.1 — Customer (party) CRUD with party_snapshots
- [x] 3.2 — POS cash sale (B1) — barcode, qty, UOM, tiered price, FIFO
- [x] 3.3 — Credit sale (B2)
- [x] 3.4 — Discount enforcement (S-044) — role limits + manager PIN
- [x] 3.5 — Below-cost sale warning + manager PIN (S-011)
- [x] 3.6 — Promotional free items (S-040)
- [x] 3.7 — Tiered pricing blended average (S-042)
- [x] 3.8 — UOM conversion on sale lines (S-012)
- [x] 3.9 — Sale return (B9) — restoreStock + reverse COGS
- [x] 3.10 — Customer payment receipt (B4) + allocation
- [x] 3.11 — Bounced cheque reversal (B25)
- [x] 3.12 — Bad debt write-off (B26) — manager approval
- [x] 3.13 — Customer advance receipt (B20) — no tax
- [x] 3.14 — Advance settlement on delivery (S-048)
- [x] 3.15 — Sales Order (price locked, no journal, S-045)
- [x] 3.16 — Convert Sales Order to Invoice
- [x] 3.17 — Quotation and Proforma Invoice (no journal)
- [x] 3.18 — Customer statement + aged receivables
- [x] 3.19 — Invoice PDF generation

### Phase 3 Gate
- [x] FIFO sale across 3 batches — correct costs
- [x] Tiered pricing — correct blended unit price
- [x] UOM conversion — 500g → 0.5 KG deducted
- [x] Over-allocation throws at app AND DB level
- [x] B20 advance → zero tax

---

## PHASE 4 — MANUFACTURING, HR & SPECIAL TRANSACTIONS (3 Weeks)

- [x] 4.1 — BOM builder (5 levels deep)
- [x] 4.2 — By-product configuration on BOM (S-094)
- [x] 4.3 — Production run start (B16 — deduct materials, WIP entry)
- [x] 4.4 — Production run complete (B16 — FG batch, close WIP)
- [x] 4.5 — By-product handling on completion
- [x] 4.6 — Partial production reversal (S-015)
- [x] 4.7 — Employee CRUD
- [x] 4.8 — Monthly salary accrual (B7) + payment (B8)
- [x] 4.9 — Final employee settlement (B27)
- [x] 4.10 — Cash shortage recording (B28)
- [x] 4.11 — Insurance claim B29 (2-step)
- [x] 4.12 — Fixed asset purchase journal
- [x] 4.13 — Depreciation journal (B23)
- [x] 4.14 — Loan drawdown (B24) + repayment
- [x] 4.15 — Set disassembly (B30)
- [x] 4.16 — Operating expense (B13)
- [x] 4.17 — Owner drawing (B14) / capital injection (B15)
- [x] 4.18 — Bank transfer (B16)
- [x] 4.19 — Charitable donation (B22)

### Phase 4 Gate
- [x] WIP balance correct during production
- [x] B27 composite entry correct
- [x] B28 blocked without narration + non-manager
- [x] B29 steps linked by disaster_claim_id
- [x] B30 component costs sum to parent cost

---

## PHASE 5 — REPORTS, DASHBOARD & FINANCIALS (3 Weeks)

- [x] 5.1 — Trial Balance report
- [x] 5.2 — Profit & Loss Statement
- [x] 5.3 — Balance Sheet
- [x] 5.4 — Cash Flow Statement
- [x] 5.5 — Aged Receivables
- [x] 5.6 — Aged Payables
- [x] 5.7 — Sales report
- [x] 5.8 — Purchase report
- [x] 5.9 — Inventory Valuation report
- [x] 5.10 — COGS report
- [x] 5.11 — Gross Profit per product/period
- [x] 5.12 — Dashboard widgets (from ledger)
- [x] 5.13 — Tax report (2200 vs 2300)
- [x] 5.14 — Party ledger/statement
- [x] 5.15 — Inventory movement report
- [x] 5.16 — Export reports to PDF + Excel

### Phase 5 Gate
- [x] Trial Balance debits = credits
- [x] Balance Sheet balances to the paisa
- [x] Account 1100 = batch valuation
- [x] Account 5000 = sale_item_batches total
- [x] Dashboard uses AccountingService only

---

## PHASE 6 — PERFORMANCE, SECURITY & DEPLOYMENT (3 Weeks)

- [x] 6.1 — PWA manifest + service worker
- [x] 6.2 — Connection guard middleware
- [x] 6.3 — ConnectionGuard React component
- [x] 6.4 — Performance indexes migration
- [x] 6.5 — Snapshot performance test
- [x] 6.6 — Laravel queues
- [x] 6.7 — Role & permission UI
- [x] 6.8 — Fiscal year close
- [x] 6.9 — Audit log
- [x] 6.10 — Deployment script
- [x] 6.11 — 120 scenario tests passing
- [x] 6.12 — Smoke test hardening + smoke test

### Phase 6 Gate
- [x] All 120 scenario tests pass
- [x] Smoke test passes
- [x] SQL reconciliation = 0.00correct
- [ ] PWA installs correctly
- [ ] ConnectionGuard blocks offline writes
- [ ] Reports match hand-calculated values

---

## SUMMARY

| Phase | Tasks | Duration |
|-------|-------|----------|
| Phase 0 — Foundation | 18 | 2 Weeks |
| Phase 1 — Core Services | 14 | 3 Weeks |
| Phase 2 — Inventory & Purchases | 15 | 3 Weeks |
| Phase 3 — Sales & POS | 19 | 4 Weeks |
| Phase 4 — Manufacturing, HR & Special | 19 | 3 Weeks |
| Phase 5 — Reports & Dashboard | 16 | 3 Weeks |
| Phase 6 — Performance & Deployment | 12 | 3 Weeks |
| **TOTAL** | **113** | **~21 Weeks** |
