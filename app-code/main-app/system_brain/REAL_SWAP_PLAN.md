# VenQore ERP — Real Swap Plan
## What Actually Needs Doing vs What The Audit Over-Flagged

The audit listed 137 methods as "NEEDS SWAP" but the majority of those
are non-financial controllers (attendance, profile, settings, cookbook,
charity, WooCommerce, etc.) that have nothing to do with accounting,
inventory, or payments. They do not need V3 swapping.

The real list is much smaller.

---

## THE TRUTH: Only 3 Categories Actually Need V3 Swapping

### CATEGORY 1 — FINANCIAL WRITE OPERATIONS (16 methods)
These post money, move stock, or record payments.
If these use the old engine, numbers will be wrong.
These are the ONLY ones that matter.

### CATEGORY 2 — REPORTS AND DASHBOARD (8 controllers)
These display financial totals to the user.
If these use old queries, the numbers shown will be inconsistent.

### CATEGORY 3 — CRITICAL RISKS (4 methods)
These write directly to financial tables bypassing all services.
Must be fixed immediately.

---

## THE REAL CHECKLIST (28 items total, not 137)

### ⚠️ CRITICAL RISKS — Fix These Before Anything Else

These 4 methods write directly to inventory_batches or
update remaining_qty without going through FifoService.
This will corrupt inventory value and COGS.

```
[ ] DashboardController@home
    — writes to inventory_batches directly
    — updates remaining_qty directly
    FIX: Remove the direct writes. Dashboard should only READ data.
    It should never write to inventory tables.

[ ] FundController@getCashHistory
    — direct DB write bypassing V3
    FIX: Read from journal_entries filtered by reference_type
    instead of maintaining a separate cash history table.

[ ] PosController@checkout
    — direct write to financial tables
    FIX: Route through SaleController@store which already
    calls V3 SaleService. PosController should call
    SaleController logic or SaleService directly.

[ ] ReturnController@store
    — direct write bypassing V3
    FIX: Call app(SaleService::class)->reverse($saleId, $reason)
    instead of manual DB writes.
```

---

### 🔴 PRIORITY 1 — Core Financial Writes (must use V3 engine)

```
[ ] SaleController@store
    STATUS: ✅ DONE (swapped in previous session)
    VERIFY: Run one sale, check trial balance = 0.00

[ ] SaleController@destroy
    — currently uses old FifoService to restore stock
    FIX: app(V3\SaleService::class)->reverse($id, $reason)

[ ] SaleController@returnSale
    — same as destroy, different entry point
    FIX: app(V3\SaleService::class)->reverse($id, $reason)

[ ] PosController@checkout
    — also in Critical Risks above
    FIX: Call app(V3\SaleService::class)->post($data)
    (same call as SaleController@store)

[ ] PurchaseController@store
    — uses old AccountingService and old FifoService
    FIX: Swap createEntry() to V3 AccountingService
         Swap batch creation to V3 FifoService::receiveBatch()

[ ] PurchaseController@storeReceive
    — receives goods against a PO, creates inventory batches
    FIX: app(V3\InventoryService::class)->receivePurchase($purchaseId)

[ ] ReturnController@store
    — also in Critical Risks above
    FIX: For sale returns: app(V3\SaleService::class)->reverse()
         For purchase returns: copy V3\PurchaseReturnController logic

[ ] PaymentController@store
    — records customer/supplier payments and allocates them
    FIX: For customer payments: copy V3\CustomerPaymentController@store
         For supplier payments: copy V3\SupplierPaymentController@store
         Key: must call PaymentService::allocate() to update badges

[ ] ExpenseController@quickAdd
    — posts expense journal entry
    FIX: app(V3\AccountingService::class)->createEntry() with
         DR 6000 / CR 1000 or 1010

[ ] FundController@addFunds
    — capital injection
    FIX: copy V3\FundController@store with type='injection'
         DR 1000/1010 / CR 3000

[ ] FundController@removeFunds
    — owner drawing
    FIX: copy V3\FundController@store with type='drawing'
         DR 3000 / CR 1000/1010

[ ] FundController@transfer
    — bank transfer between accounts
    FIX: copy V3\BankTransferController@store
         DR destination / CR source

[ ] StockOperationsController@adjust
    — stock adjustment (increase or decrease)
    FIX: app(V3\InventoryService::class)->adjustStock(...)

[ ] StockTransferController@store
    — moves stock between warehouses
    FIX: adjustStock() twice — decrease source, increase destination

[ ] ProductionController@store
    — starts a manufacturing run
    FIX: app(V3\ManufacturingService::class)->startRun($data)

[ ] ProductionController@complete
    — completes a manufacturing run
    FIX: app(V3\ManufacturingService::class)->completeRun($id, $qty)
```

---

### 🟡 PRIORITY 2 — Dashboard and Reports (must show V3 numbers)

```
[ ] DashboardController@index
    — currently queries raw tables for totals
    FIX: Replace with calls to V3 AccountingService::getBalance()
         cash    = getBalance('1000')
         bank    = getBalance('1010')
         AR      = getBalance('1200')
         AP      = getBalance('2000')
         revenue = ReportService::profitAndLoss() this month

[ ] ReportController@profitLoss (or profitAndLoss)
    FIX: app(V3\ReportService::class)->profitAndLoss($from, $to)

[ ] ReportController@balanceSheet
    FIX: app(V3\ReportService::class)->balanceSheet($asOf)

[ ] ReportController@sales (or salesReport)
    FIX: app(V3\ReportService::class)->salesReport($from, $to)

[ ] ReportController@purchases
    FIX: app(V3\ReportService::class)->purchasesReport($from, $to)

[ ] ReportController@stockValuation (or inventoryValuation)
    FIX: app(V3\ReportService::class)->inventoryValuation()

[ ] ReportController@trialBalance (or dayBook)
    FIX: app(V3\ReportService::class)->trialBalance($asOf)

[ ] ReportController@agedReceivables (or saleAging)
    FIX: app(V3\ReportService::class)->agedReceivables($asOf)
```

---

### 🟢 PRIORITY 3 — These Do NOT Need V3 Swapping (ignore them)

The audit flagged these as "NEEDS SWAP" but they are wrong.
None of these touch financial calculations:

```
✅ SKIP — AttendanceController (check-in/out, no money)
✅ SKIP — CharityController (not in V3 spec, leave as-is)
✅ SKIP — CookbookController (not in V3 spec, leave as-is)
✅ SKIP — CommunicationController (WhatsApp, no money)
✅ SKIP — GrowthEngineController (marketing, no money)
✅ SKIP — HeartbeatController (ping, no money)
✅ SKIP — InstallerController (setup wizard, no money)
✅ SKIP — InvoiceReminderController (email reminders, no money)
✅ SKIP — MarketingCampaignController (no money)
✅ SKIP — MigrationController (data migration tool, separate concern)
✅ SKIP — NotificationController (no money)
✅ SKIP — OnlineStoreController (WooCommerce sync, separate concern)
✅ SKIP — ProfileController (user profile, no money)
✅ SKIP — RecurringInvoiceController (scheduling only, no money)
✅ SKIP — SearchController (read only)
✅ SKIP — SerialTrackingController (product serials, no accounting)
✅ SKIP — SettingsController (app settings, no money)
✅ SKIP — SetupController (initial setup, no money)
✅ SKIP — StaffAttendanceController (HR attendance, no money)
✅ SKIP — StockTakeController (audit tool — wire to V3 later if needed)
✅ SKIP — SyncController@batchOrders (WooCommerce, separate concern)
✅ SKIP — UpdaterController (app updater, no money)
✅ SKIP — WooCommerceController (ecommerce sync, separate concern)
✅ SKIP — AdminController (user management, no money)
✅ SKIP — BatchTrackingController (read only)
✅ SKIP — LabelController (PDF labels, no money)
✅ SKIP — EInvoicingController (FBR/tax authority — leave as-is)
✅ SKIP — RecycleBinController (soft delete management)
✅ SKIP — BackupController (database backup, no money)
✅ SKIP — ImportExportController (data import/export)
✅ SKIP — ProposalController (quotations — wire to V3 later if needed)
✅ SKIP — PurchaseOrderController (POs — wire to V3 later if needed)
✅ SKIP — SalesOrderController (SOs — wire to V3 later if needed)
✅ SKIP — ProductAttributeController (product meta, no money)
✅ SKIP — ProductVariantController (variants, no money)
✅ SKIP — CustomerController (CRUD only, no accounting)
✅ SKIP — SupplierController (CRUD only, no accounting)
✅ SKIP — ManufacturingRuleController (BOM config, no live accounting)
✅ SKIP — RecurringInvoiceController (scheduling only)
✅ SKIP — PartyController (CRUD only)
✅ SKIP — DebitNoteController (wire to V3 purchase return later)
✅ SKIP — SalesAnalyticsController (read only)
✅ SKIP — BankReconciliationController (read only)
✅ SKIP — InvoiceController (read only — PDF generation)
```

---

## ORDERED EXECUTION — Do These In Order

```
DAY 1 — CRITICAL RISKS (stop the bleeding)
  [ ] 1. DashboardController@home — remove direct inventory_batches writes
  [ ] 2. ReturnController@store — route through V3 SaleService::reverse()
  [ ] 3. PosController@checkout — route through V3 SaleService::post()
  [ ] 4. FundController@getCashHistory — read from journal_entries not raw table

DAY 2 — CORE SALES FLOW
  [ ] 5. SaleController@destroy — V3 SaleService::reverse()
  [ ] 6. SaleController@returnSale — V3 SaleService::reverse()
  [ ] 7. PaymentController@store — V3 PaymentService::allocate()

DAY 3 — CORE PURCHASE FLOW
  [ ] 8. PurchaseController@store — V3 AccountingService + FifoService::receiveBatch()
  [ ] 9. PurchaseController@storeReceive — V3 InventoryService::receivePurchase()

DAY 4 — MONEY & STOCK
  [ ] 10. ExpenseController@quickAdd — V3 AccountingService::createEntry()
  [ ] 11. FundController@addFunds — V3 AccountingService DR/CR 3000/1000
  [ ] 12. FundController@removeFunds — V3 AccountingService DR/CR 3000/1000
  [ ] 13. FundController@transfer — V3 BankTransferController logic
  [ ] 14. StockOperationsController@adjust — V3 InventoryService::adjustStock()
  [ ] 15. StockTransferController@store — V3 InventoryService::adjustStock() x2

DAY 5 — MANUFACTURING
  [ ] 16. ProductionController@store — V3 ManufacturingService::startRun()
  [ ] 17. ProductionController@complete — V3 ManufacturingService::completeRun()

DAY 6 — DASHBOARD AND REPORTS
  [ ] 18. DashboardController@index — V3 AccountingService::getBalance() for each widget
  [ ] 19. ReportController@profitLoss — V3 ReportService::profitAndLoss()
  [ ] 20. ReportController@balanceSheet — V3 ReportService::balanceSheet()
  [ ] 21. ReportController@sales — V3 ReportService::salesReport()
  [ ] 22. ReportController@purchases — V3 ReportService::purchasesReport()
  [ ] 23. ReportController@stockValuation — V3 ReportService::inventoryValuation()
  [ ] 24. ReportController@trialBalance — V3 ReportService::trialBalance()
  [ ] 25. ReportController@agedReceivables — V3 ReportService::agedReceivables()

DAY 7 — VERIFY EVERYTHING
  [ ] 26. Run SQL: trial balance must_be_zero check
  [ ] 27. Run SQL: account 1100 vs inventory_batches check
  [ ] 28. Run full test suite: php artisan test tests/Feature/V3/
```

---

## AFTER EACH DAY — RUN THIS SQL

```sql
-- Trial balance must always equal zero
SELECT ABS(SUM(debit) - SUM(credit)) AS must_be_zero
FROM journal_items ji
JOIN journal_entries je ON ji.journal_entry_id = je.id
WHERE je.is_reversed = 0;

-- Inventory ledger must match physical batches
SELECT ABS(
    (SELECT SUM(ji.debit) - SUM(ji.credit)
     FROM journal_items ji
     JOIN journal_entries je ON ji.journal_entry_id = je.id
     JOIN accounts a ON ji.account_id = a.id
     WHERE a.code = '1100' AND je.is_reversed = 0)
    -
    (SELECT SUM(remaining_qty * unit_cost)
     FROM inventory_batches
     WHERE remaining_qty > 0 AND deleted_at IS NULL)
) AS must_be_zero;
```

Both must return 0.00 every day.
If they don't, the swap done that day has a bug. Fix it before Day+1.

---

## SUMMARY

Real items needing swap:  28
Fake items (audit noise):  109
Days to complete:          7
Risk of data corruption if done wrong: HIGH on items 1-9, LOW on items 10-28
```
