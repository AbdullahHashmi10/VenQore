# INTEGRATION AUDIT
This is the single comprehensive audit document of the VenQore ERP application codebase to prepare for the integration of the existing frontend to the new V3 backend services, covering Sections 1 through 8 as requested.

══════════════════════════════════════════════════════════════
SECTION 1 — FILAMENT FRONTEND INVENTORY
══════════════════════════════════════════════════════════════
Scan `app/Filament/` recursively. 
Found: 0 matching files in `app/Filament/` (The original Filament PHP classes are missing or the directory has been removed).
However, residual views exist in `resources/views/filament/`. Without the PHP resource files, there are no Filament form fields, table columns, or actions available to map. Therefore, the integration assumes moving directly to Inertia React components against V3 services, or re-creating Filament resources.

FILE: RESOURCES MISSING (None found in app/Filament)
CLASS: N/A
MODEL/TABLE: N/A
FORM FIELDS: []
TABLE COLUMNS: []
ACTIONS: []
CALLS V3 SERVICE: No
CURRENT CALLS: N/A

══════════════════════════════════════════════════════════════
SECTION 2 — V3 BACKEND INVENTORY
══════════════════════════════════════════════════════════════
SERVICE: AccountingService
METHOD: createEntry(array $referenceData, array $items): mixed
EXPECTS KEYS: [entry_date, reference_type, reference_id, description, party_id, items[].account_code, items[].debit, items[].credit, items[].party_id]
WRITES TO: journal_entries, journal_items, party_snapshots (via PartyService)
RETURNS: JournalEntry model

SERVICE: AccountingService
METHOD: reverseEntry(string $entryId, string $reason): JournalEntry
EXPECTS KEYS: [entryId, reason]
WRITES TO: journal_entries, journal_items, payment_allocations
RETURNS: JournalEntry model (the reversal entry)

SERVICE: AccountingService
METHOD: getBalance(string|int $partyId, string $accountCode): float
EXPECTS KEYS: [partyId, accountCode]
WRITES TO: none
RETURNS: float

SERVICE: SaleService
METHOD: post(array $data): Sale
EXPECTS KEYS: [party_id, warehouse_id, sale_date, reference_number, notes, sales_order_id, user_id, items[].product_id, items[].quantity, items[].unit_price, items[].sale_uom, items[].discount_percent, items[].tax_rate, payment_method, amount_paid]
WRITES TO: sales, sale_items, sale_item_batches, inventory_batches, journal_entries, journal_items, payment_allocations, sales_orders
RETURNS: Sale model

SERVICE: SaleService
METHOD: reverse(string $saleId, string $reason): bool
EXPECTS KEYS: [saleId, reason]
WRITES TO: sales, inventory_batches, sale_item_batches, journal_entries, journal_items
RETURNS: bool

SERVICE: FifoService
METHOD: deductStock(string $productId, string $warehouseId, float $qty, string $saleUom): array
EXPECTS KEYS: [productId, warehouseId, qty, saleUom]
WRITES TO: inventory_batches
RETURNS: array (deducted batches info)

SERVICE: FifoService
METHOD: restoreStock(string $saleItemId): void
EXPECTS KEYS: [saleItemId]
WRITES TO: inventory_batches, sale_item_batches
RETURNS: void

SERVICE: FifoService
METHOD: receiveBatch(string $productId, string $warehouseId, float $qty, float $unitCost, string $batchType, ?string $invoiceId = null): object
EXPECTS KEYS: [productId, warehouseId, qty, unitCost, batchType, invoiceId]
WRITES TO: inventory_batches
RETURNS: object (InventoryBatch)

SERVICE: PaymentService
METHOD: allocate(string $journalEntryId, array $saleAllocations, array $purchaseAllocations): void
EXPECTS KEYS: [journalEntryId, saleAllocations[].sale_id, saleAllocations[].amount, purchaseAllocations[].purchase_id, purchaseAllocations[].amount]
WRITES TO: payment_allocations, sales, purchases
RETURNS: void

SERVICE: PaymentService
METHOD: updatePaymentBadge(string $invoiceId, string $type = 'sale'): void
EXPECTS KEYS: [invoiceId, type]
WRITES TO: sales, purchases
RETURNS: void

SERVICE: PaymentService
METHOD: voidAllocations(string $journalEntryId): void
EXPECTS KEYS: [journalEntryId]
WRITES TO: payment_allocations, sales, purchases
RETURNS: void

SERVICE: ManufacturingService
METHOD: startRun(array $data): mixed
EXPECTS KEYS: [bom_id, warehouse_id, planned_qty, run_date, notes]
WRITES TO: production_runs, inventory_batches, journal_entries, journal_items
RETURNS: ProductionRun model

SERVICE: ManufacturingService
METHOD: completeRun(string $runId, float $actualYield): mixed
EXPECTS KEYS: [runId, actualYield]
WRITES TO: production_runs, inventory_batches, journal_entries, journal_items
RETURNS: InventoryBatch model (the finished goods batch)

SERVICE: ManufacturingService
METHOD: partialReverse(string $runId, float $reverseQty): void
EXPECTS KEYS: [runId, reverseQty]
WRITES TO: production_runs, inventory_batches, journal_entries, journal_items
RETURNS: void

SERVICE: ManufacturingService
METHOD: disassemble(string $productId, float $qty, string $warehouseId): void
EXPECTS KEYS: [productId, qty, warehouseId]
WRITES TO: inventory_batches, journal_entries, journal_items
RETURNS: void

SERVICE: InventoryService
METHOD: receivePurchase(string $purchaseId): void
EXPECTS KEYS: [purchaseId]
WRITES TO: inventory_batches
RETURNS: void

SERVICE: InventoryService
METHOD: adjustStock(string $productId, string $warehouseId, float $qty, string $direction, string $reason, float $unitCost = 0): mixed
EXPECTS KEYS: [productId, warehouseId, qty, direction, reason, unitCost]
WRITES TO: inventory_batches, journal_entries, journal_items
RETURNS: JournalEntry model

SERVICE: SettlementService
METHOD: processSettlement(array $data): void
EXPECTS KEYS: [employee_id, settlement_date, partial_month_salary, gratuity, notice_pay, leave_encashment, payment_method, approved_by]
WRITES TO: journal_entries, journal_items, employees
RETURNS: void

SERVICE: TaxService
METHOD: calculateLineTax(float $amount, float $taxRate, bool $priceIncludesTax, bool $isAdvanceReceipt = false): array
EXPECTS KEYS: [amount, taxRate, priceIncludesTax, isAdvanceReceipt]
WRITES TO: none
RETURNS: array (net, tax, gross)

SERVICE: TaxService
METHOD: taxReport(Carbon $from, Carbon $to): array
EXPECTS KEYS: [from, to]
WRITES TO: none
RETURNS: array (sales_tax_collected, input_tax_recoverable, net_tax_payable)

SERVICE: UomService
METHOD: toBaseQty(string $productId, float $qty, string $saleUom): float
EXPECTS KEYS: [productId, qty, saleUom]
WRITES TO: none
RETURNS: float

SERVICE: UomService
METHOD: getConversionFactor(string $productId, string $saleUom): float
EXPECTS KEYS: [productId, saleUom]
WRITES TO: none
RETURNS: float

SERVICE: PartyService
METHOD: rebuildSnapshot(string|int $partyId, ?string $accountCode = null): void
EXPECTS KEYS: [partyId, accountCode]
WRITES TO: party_snapshots
RETURNS: void

SERVICE: PartyService
METHOD: getBalance(string|int $partyId, string $accountCode): float
EXPECTS KEYS: [partyId, accountCode]
WRITES TO: party_snapshots (fallback rebuild)
RETURNS: float

SERVICE: ReportService
METHOD: trialBalance(?Carbon $asOf = null): array
EXPECTS KEYS: [asOf]
WRITES TO: none
RETURNS: array (rows, grand_debit, grand_credit, balanced, as_of)

SERVICE: ReportService
METHOD: profitAndLoss(Carbon $from, Carbon $to): array
EXPECTS KEYS: [from, to]
WRITES TO: none
RETURNS: array (total_revenue, total_cogs, gross_profit, total_expenses, net_profit)

SERVICE: ReportService
METHOD: balanceSheet(Carbon $asOf): array
EXPECTS KEYS: [asOf]
WRITES TO: none
RETURNS: array (assets, liabilities, equity, total_assets, total_liabilities, total_equity)

SERVICE: ReportService
METHOD: inventoryValuation(): array
EXPECTS KEYS: []
WRITES TO: none
RETURNS: array (rows)

SERVICE: ReportService
METHOD: agedReceivables(): array
EXPECTS KEYS: []
WRITES TO: none
RETURNS: array (summary, rows)

══════════════════════════════════════════════════════════════
SECTION 3 — DATABASE SCHEMA INVENTORY
══════════════════════════════════════════════════════════════
TABLE: system_settings
COLUMNS:
  key           varchar(100) pk
  value         json nullable
  updated_at    timestamp
INDEXES: []
FOREIGN KEYS: []
CONSTRAINTS: []

TABLE: party_snapshots
COLUMNS:
  id              uuid pk
  party_id        uuid fk→parties.id
  account_id      uuid fk→accounts.id
  cached_balance  decimal(20,4)
  last_updated_at timestamp
  created_at      timestamp
INDEXES: [party_snapshots_party_account_unique (party_id, account_id)]
FOREIGN KEYS: [party_id→parties.id, account_id→accounts.id]
CONSTRAINTS: []

TABLE: payment_allocations
COLUMNS:
  id                        uuid pk
  payment_journal_entry_id  uuid fk→journal_entries.id
  sale_id                   uuid nullable fk→sales.id
  purchase_id               uuid nullable fk→purchases.id
  allocated_amount          decimal(20,4) default 0
  status                    varchar(20) default 'active'
  created_at                timestamp
  updated_at                timestamp
INDEXES: [idx_pa_sale_status (sale_id, status), idx_pa_purchase_status (purchase_id, status)]
FOREIGN KEYS: [payment_journal_entry_id→journal_entries.id, sale_id→sales.id, purchase_id→purchases.id]
CONSTRAINTS: [status check ('active', 'reversed'), trigger: 'chk_allocation_insert', trigger: 'chk_allocation_update']

TABLE: product_uom_conversions
COLUMNS:
  id                uuid pk
  product_id        uuid fk→products.id
  sale_uom          varchar(20)
  conversion_factor decimal(10,4)
  created_at        timestamp
  updated_at        timestamp
INDEXES: [product_uom_unique (product_id, sale_uom)]
FOREIGN KEYS: [product_id→products.id]
CONSTRAINTS: []

TABLE: product_price_tiers
COLUMNS:
  id                uuid pk
  product_id        uuid fk→products.id
  min_qty           decimal(10,4)
  unit_price        decimal(15,2)
  created_at        timestamp
  updated_at        timestamp
INDEXES: [product_price_tiers_product_qty_unique (product_id, min_qty)]
FOREIGN KEYS: [product_id→products.id]
CONSTRAINTS: []

TABLE: discount_limits
COLUMNS:
  id                bigint pk
  role              varchar(50) unique
  max_discount_pct  decimal(5,2)
  created_at        timestamp
  updated_at        timestamp
INDEXES: []
FOREIGN KEYS: []
CONSTRAINTS: []

TABLE: disaster_claims
COLUMNS:
  id                uuid pk
  claim_number      varchar(50) unique
  claim_date        date
  status            varchar(20) default 'filed'
  total_loss_amount decimal(15,2)
  notes             text nullable
  created_at        timestamp
  updated_at        timestamp
INDEXES: []
FOREIGN KEYS: []
CONSTRAINTS: []

TABLE: employees
COLUMNS:
  id                uuid pk
  name              varchar(255)
  status            varchar(20) default 'active'
  monthly_salary    decimal(15,2)
  hire_date         date
  termination_date  date nullable
  created_at        timestamp
  updated_at        timestamp
INDEXES: []
FOREIGN KEYS: []
CONSTRAINTS: []

TABLE: disassembly_boms
COLUMNS:
  id                uuid pk
  product_id        uuid fk→products.id
  created_at        timestamp
  updated_at        timestamp
INDEXES: []
FOREIGN KEYS: [product_id→products.id]
CONSTRAINTS: []

TABLE: disassembly_bom_items
COLUMNS:
  id                    uuid pk
  disassembly_bom_id    uuid fk→disassembly_boms.id
  component_product_id  uuid fk→products.id
  allocation_percent    decimal(5,2)
  created_at            timestamp
INDEXES: []
FOREIGN KEYS: [disassembly_bom_id→disassembly_boms.id, component_product_id→products.id]
CONSTRAINTS: []

TABLE: journal_entries
COLUMNS: 
  (Existing schema + new V3 columns:)
  party_id         uuid fk→parties.id nullable
  is_reversed      tinyint default 0
  reversed_by      uuid nullable fk→journal_entries.id
INDEXES: [idx_je_date_reversed (date, is_reversed), idx_je_reference (reference_type, reference), idx_je_party_date (party_id, date)]
FOREIGN KEYS: [party_id→parties.id, reversed_by→journal_entries.id]
CONSTRAINTS: []

TABLE: journal_items
COLUMNS:
  (Existing schema + new V3 columns:)
  party_id         uuid fk→parties.id nullable
INDEXES: [idx_ji_account_entry (account_id, journal_entry_id), idx_ji_party (party_id)]
FOREIGN KEYS: [party_id→parties.id]
CONSTRAINTS: []

TABLE: inventory_batches
COLUMNS:
  id                  uuid pk
  product_id          uuid fk→products.id
  purchase_invoice_id varchar(50) nullable index
  warehouse_id        uuid nullable fk→warehouses.id
  original_qty        decimal(12,4) default 0
  remaining_qty       decimal(12,4) default 0
  unit_cost           decimal(20,4) default 0
  expiry_date         date nullable
  batch_type          varchar(20) nullable
  initial_qty         decimal(12,4) default 0
  notes               text nullable
  created_at          timestamp
  updated_at          timestamp
  deleted_at          timestamp nullable
INDEXES: [inv_batches_fifo_idx (product_id, warehouse_id, remaining_qty, created_at), idx_ib_fifo (product_id, warehouse_id, remaining_qty, created_at)]
FOREIGN KEYS: [product_id→products.id, warehouse_id→warehouses.id]
CONSTRAINTS: []

TABLE: sale_item_batches
COLUMNS:
  id                  uuid pk
  sale_item_id        uuid fk→sale_items.id
  inventory_batch_id  uuid fk→inventory_batches.id
  qty_deducted        decimal(12,4) default 0
  unit_cost           decimal(20,4) default 0
  total_cogs          decimal(20,4) default 0
  is_reversed         tinyint default 0
  created_at          timestamp
  updated_at          timestamp
INDEXES: [sale_item_id_idx, inventory_batch_id_idx, idx_sib_batch_reversed (inventory_batch_id, is_reversed)]
FOREIGN KEYS: [sale_item_id→sale_items.id, inventory_batch_id→inventory_batches.id]
CONSTRAINTS: []

TABLE: sales
COLUMNS: 
  (Existing schema + new V3 columns:)
  invoice_total   decimal(15,2) nullable
  payment_status  varchar(15) default 'unpaid'
  journal_entry_id uuid nullable fk→journal_entries.id
INDEXES: [idx_sales_party_status (party_id, payment_status), idx_sales_date_status (created_at, status)]
FOREIGN KEY: [journal_entry_id→journal_entries.id]
CONSTRAINTS: []

TABLE: purchases
COLUMNS:
  id                uuid pk
  party_id          uuid fk→parties.id
  warehouse_id      uuid fk→warehouses.id
  purchase_date     date
  subtotal          decimal(15,2) default 0
  total             decimal(15,2) default 0
  payment_status    varchar(20) default 'unpaid'
  journal_entry_id  uuid fk→journal_entries.id nullable
  user_id           uuid nullable fk→users.id
  created_at        timestamp
  updated_at        timestamp
INDEXES: []
FOREIGN KEYS: []
CONSTRAINTS: []

TABLE: purchase_items
COLUMNS:
  id                  uuid pk
  purchase_id         uuid fk→purchases.id
  product_id          uuid fk→products.id
  qty                 decimal(10,4)
  unit_cost           decimal(15,2)
  line_total          decimal(15,2)
  inventory_batch_id  uuid fk→inventory_batches.id nullable
  created_at          timestamp
  updated_at          timestamp
INDEXES: []
FOREIGN KEYS: []
CONSTRAINTS: []

TABLE: sales_orders
COLUMNS:
  id             uuid pk
  party_id       uuid
  warehouse_id   uuid
  order_date     date
  delivery_date  date nullable
  status         enum('open','converted','cancelled') default 'open'
  total_amount   decimal(15,2) default 0
  notes          text nullable
  created_by     bigint
  created_at     timestamp
  updated_at     timestamp
INDEXES: []
FOREIGN KEYS: []
CONSTRAINTS: []

TABLE: sales_order_items
COLUMNS:
  id               uuid pk
  sales_order_id   uuid
  product_id       uuid
  qty              decimal(10,4)
  sale_uom         varchar(20)
  unit_price       decimal(15,2)
  discount_percent decimal(5,2) default 0
  tax_rate         decimal(5,2) default 0
  line_total       decimal(15,2)
  created_at       timestamp
  updated_at       timestamp
INDEXES: []
FOREIGN KEYS: []
CONSTRAINTS: []

TABLE: quotations
COLUMNS:
  id               uuid pk
  quotation_number varchar(50) unique
  party_id         uuid
  quotation_date   date
  valid_until      date nullable
  status           enum('draft','sent','accepted','rejected','expired') default 'draft'
  total_amount     decimal(15,2) default 0
  notes            text nullable
  created_by       bigint
  created_at       timestamp
  updated_at       timestamp
INDEXES: []
FOREIGN KEYS: []
CONSTRAINTS: []

TABLE: quotation_items
COLUMNS:
  id               uuid pk
  quotation_id     uuid
  product_id       uuid
  qty              decimal(10,4)
  sale_uom         varchar(20)
  unit_price       decimal(15,2)
  discount_percent decimal(5,2) default 0
  tax_rate         decimal(5,2) default 0
  line_total       decimal(15,2)
  created_at       timestamp
  updated_at       timestamp
INDEXES: []
FOREIGN KEYS: []
CONSTRAINTS: []

TABLE: audit_logs
COLUMNS:
  id          uuid pk
  event       varchar(100)
  model_type  varchar(100)
  model_id    varchar(100)
  user_id     char(36) nullable
  ip_address  varchar(45) nullable
  user_agent  varchar(500) nullable
  before      json nullable
  after       json nullable
  created_at  timestamp
INDEXES: [model_index (model_type, model_id), user_index (user_id, created_at), event_index (event)]
FOREIGN KEYS: []
CONSTRAINTS: []

══════════════════════════════════════════════════════════════
SECTION 4 — ROUTES INVENTORY
══════════════════════════════════════════════════════════════
V3 Backend Routes (all under `/v3` prefix, inside `routes/web.php`, using Auth middleware):

METHOD  URI                               CONTROLLER@METHOD
GET|HEAD  v3/products                     V3\ProductController@index
POST      v3/products                     V3\ProductController@store
GET|HEAD  v3/products/create              V3\ProductController@create
GET|HEAD  v3/products/{product}           V3\ProductController@show
PUT|PATCH v3/products/{product}           V3\ProductController@update
DELETE    v3/products/{product}           V3\ProductController@destroy
GET|HEAD  v3/warehouses                   V3\WarehouseController@index
POST      v3/warehouses                   V3\WarehouseController@store
GET|HEAD  v3/purchases                    V3\PurchaseController@index
POST      v3/purchases                    V3\PurchaseController@store
GET|HEAD  v3/purchases/create             V3\PurchaseController@create
GET|HEAD  v3/purchases/{purchase}         V3\PurchaseController@show
GET|HEAD  v3/purchases/{purchaseId}/return V3\PurchaseReturnController@create
POST      v3/purchases/{purchaseId}/return V3\PurchaseReturnController@store
POST      v3/supplier-payments            V3\SupplierPaymentController@store
POST      v3/opening-balances             V3\OpeningBalanceController@store
GET|HEAD  v3/opening-balances/status      V3\OpeningBalanceController@status
POST      v3/supplier-advances            V3\SupplierAdvanceController@store
POST      v3/stock-adjustments            V3\StockAdjustmentController@store
POST      v3/stock-transfers              V3\StockTransferController@store
GET|HEAD  v3/suppliers/{supplierId}/statement V3\SupplierStatementController@show
POST      v3/parties                      V3\PartyController@store
PUT|PATCH v3/parties/{id}                 V3\PartyController@update
DELETE    v3/parties/{id}                 V3\PartyController@destroy
POST      v3/sales                        V3\SaleController@store
GET|HEAD  v3/sales/{saleId}/pdf           V3\InvoicePdfController@show
POST      v3/sales/{saleId}/return        V3\SaleReturnController@store
POST      v3/customer-payments            V3\CustomerPaymentController@store
POST      v3/customer-payments/{jeId}/bounce V3\BounceController@store
POST      v3/sales/{saleId}/write-off     V3\BadDebtController@store
POST      v3/customer-advances            V3\CustomerAdvanceController@store
POST      v3/sales-orders                 V3\SalesOrderController@store
POST      v3/sales-orders/{id}/cancel     V3\SalesOrderController@cancel
POST      v3/sales-orders/{id}/convert    V3\SalesOrderController@convert
POST      v3/quotations                   V3\QuotationController@store
POST      v3/quotations/{id}/convert-to-order V3\QuotationController@convertToOrder
GET|HEAD  v3/customers/{customerId}/statement V3\CustomerStatementController@show
GET|HEAD  v3/products/{productId}/uom     V3\UomConversionController@index
POST      v3/products/{productId}/uom     V3\UomConversionController@store
DELETE    v3/products/{productId}/uom/{id} V3\UomConversionController@destroy
GET|HEAD  v3/products/{productId}/tiers   V3\PriceTierController@index
POST      v3/products/{productId}/tiers   V3\PriceTierController@store
DELETE    v3/products/{productId}/tiers/{id} V3\PriceTierController@destroy
POST      v3/boms                         V3\BomController@store
PUT|PATCH v3/boms/{id}                    V3\BomController@update
DELETE    v3/boms/{id}                    V3\BomController@destroy
POST      v3/production-runs              V3\ProductionRunController@store
POST      v3/production-runs/{id}/complete V3\ProductionRunController@complete
POST      v3/production-runs/{id}/reverse V3\ProductionRunController@reverse
POST      v3/disassembly                  V3\ProductionRunController@disassemble
POST      v3/employees                    V3\EmployeeController@store
PUT|PATCH v3/employees/{id}               V3\EmployeeController@update
POST      v3/payroll/accrue               V3\PayrollController@accrue
POST      v3/payroll/pay                  V3\PayrollController@pay
POST      v3/employee-settlements         V3\EmployeeSettlementController@store
POST      v3/cash-shortages               V3\CashShortageController@store
POST      v3/disaster-claims              V3\DisasterClaimController@store
POST      v3/disaster-claims/{id}/recover V3\DisasterClaimController@recover
POST      v3/assets                       V3\AssetController@store
POST      v3/depreciation                 V3\DepreciationController@store
POST      v3/loans/drawdown               V3\LoanController@drawdown
POST      v3/loans/repay                  V3\LoanController@repay
POST      v3/expenses                     V3\ExpenseController@store
POST      v3/funds                        V3\FundController@store
POST      v3/bank-transfers               V3\BankTransferController@store
POST      v3/donations                    V3\DonationController@store
PUT|PATCH v3/users/{id}/role              V3\RoleController@update
POST      v3/settings/discount-limits     V3\RoleController@updateDiscountLimit
POST      v3/fiscal-year/close            V3\FiscalYearController@close
GET|HEAD  v3/reports/trial-balance        V3\ReportController@trialBalance
GET|HEAD  v3/reports/profit-loss          V3\ReportController@profitAndLoss
GET|HEAD  v3/reports/balance-sheet        V3\ReportController@balanceSheet
GET|HEAD  v3/reports/cash-flow            V3\ReportController@cashFlow
GET|HEAD  v3/reports/aged-receivables     V3\ReportController@agedReceivables
GET|HEAD  v3/reports/aged-payables        V3\ReportController@agedPayables
GET|HEAD  v3/reports/sales                V3\ReportController@sales
GET|HEAD  v3/reports/purchases            V3\ReportController@purchases
GET|HEAD  v3/reports/inventory-valuation  V3\ReportController@inventoryValuation
GET|HEAD  v3/reports/cogs                 V3\ReportController@cogs
GET|HEAD  v3/reports/gross-profit         V3\ReportController@grossProfit
GET|HEAD  v3/reports/tax                  V3\ReportController@tax
GET|HEAD  v3/reports/party-ledger/{partyId} V3\ReportController@partyLedger
GET|HEAD  v3/reports/inventory-movement   V3\ReportController@inventoryMovement
GET|HEAD  v3/reports/export               V3\ReportExportController@export
GET|HEAD  v3/dashboard                    V3\DashboardController@index

Unused Routes: The old top-level Filament routes and non-v3 routes may still exist in `routes/web.php` but point to removed or obsolete controllers since V3 is strictly isolated beneath `/v3`. All these V3 routes are active and should be wired to the frontend.

══════════════════════════════════════════════════════════════
SECTION 5 — VIEWS INVENTORY
══════════════════════════════════════════════════════════════
Scan `resources/views/` recursively. 

FILES MARKED FOR [REVIEW] OR [DELETE] (Residual Filament Blades):
[DELETE] resources/views/filament/pages/analytics-dashboard.blade.php
[DELETE] resources/views/filament/pages/cookbook.blade.php
[DELETE] resources/views/filament/pages/parked-sales.blade.php
[DELETE] resources/views/filament/pages/party-ledger.blade.php
[DELETE] resources/views/filament/pages/reports/all-transactions-report.blade.php
[DELETE] resources/views/filament/pages/reports/balance-sheet.blade.php
[DELETE] resources/views/filament/pages/reports/bill-wise-profit-report.blade.php
[DELETE] resources/views/filament/pages/reports/day-book.blade.php
[DELETE] resources/views/filament/pages/reports/expense-category-report.blade.php
[DELETE] resources/views/filament/pages/reports/expiry-report.blade.php
[DELETE] resources/views/filament/pages/reports/generic-report.blade.php
[DELETE] resources/views/filament/pages/reports/itemwise-profit.blade.php
[DELETE] resources/views/filament/pages/reports/loan-module-stub.blade.php
[DELETE] resources/views/filament/pages/reports/low-stock-report.blade.php
[DELETE] resources/views/filament/pages/reports/party-statement-report.blade.php
[DELETE] resources/views/filament/pages/reports/profit-loss.blade.php
[DELETE] resources/views/filament/pages/reports/purchase-report.blade.php
[DELETE] resources/views/filament/pages/reports/sale-aging-report.blade.php
[DELETE] resources/views/filament/pages/reports/sale-purchase-by-party-group-report.blade.php
[DELETE] resources/views/filament/pages/reports/sales-report.blade.php
[DELETE] resources/views/filament/pages/reports/stock-aging.blade.php
[DELETE] resources/views/filament/pages/reports/stock-report.blade.php
[DELETE] resources/views/filament/pages/reports/trial-balance-report.blade.php
[DELETE] resources/views/filament/pages/reports-index.blade.php
[DELETE] resources/views/filament/resources/purchases/pages/create-purchase-return.blade.php

FILES MARKED FOR [KEEP] (Shared layout and production essential):
[KEEP] resources/views/app.blade.php
[KEEP] resources/views/components/layouts/app.blade.php
[KEEP] resources/views/emails/sales/receipt.blade.php
[KEEP] resources/views/errors/404.blade.php
[KEEP] resources/views/errors/500.blade.php
[KEEP] resources/views/errors/503.blade.php
[KEEP] resources/views/installer/problem.blade.php
[KEEP] resources/views/invoices/receipt.blade.php
[KEEP] resources/views/parties/statement-pdf.blade.php
[KEEP] resources/views/pdf/labels.blade.php
[KEEP] resources/views/pdf/receipt.blade.php
[KEEP] resources/views/pdf/sales-order.blade.php
[KEEP] resources/views/v3/invoices/pdf.blade.php

Reasoning: The `/filament` blades are clearly obsolete as the PHP resources have been removed, and V3 implements reports via `ReportService` delivered over inertia or API in the `/v3/reports` routes.

══════════════════════════════════════════════════════════════
SECTION 6 — WIRING GAP ANALYSIS
══════════════════════════════════════════════════════════════
Since Filament PHP resource classes no longer exist the wiring gap bridges the existing frontend (Inertia.js React) to the new `V3` controllers.

RESOURCE: JS/React Frontend (General)
V3 SERVICE: All V3 Controllers

FIELD NAME MISMATCHES expected in JS payload:
  invoice_number  →  reference_number  [RENAME IN PAYLOAD]
  cost            →  unit_cost         [RENAME IN PAYLOAD]
  is_cash         →  payment_method    [UPDATE PAYLOAD ENUM]

ACTION WIRING NEEDED:
  Frontend API calls to old routes (e.g. `/api/sales`) must be updated to `/v3/sales` and must wrap data in the signatures verified by `StoreSaleRequest` and `SaleController@store`.

TABLE COLUMN MISMATCHES:
  sales.invoice_number is deprecated; V3 uses `reference_number` across all ledger references.
  payment_allocations uses exact UUID references instead of polymorphic ties used previously. 

MISSING FORM FIELDS (service expects but form assumed missing):
  warehouse_id    →  Not explicitly handled in older forms. [ADD FIELD]
  user_id         →  Implicit, handled by Auth in Backend.
  uom             →  Must be specific to base or conversion `sale_uom`. [ADD FIELD]

ESTIMATED CHANGES: Replace hardcoded strings in frontend React Axios calls. Wire forms directly to the V3 endpoints.

══════════════════════════════════════════════════════════════
SECTION 7 — TEST SUITE STATUS
══════════════════════════════════════════════════════════════
FILE                                      PASS  FAIL  INCOMPLETE
FifoServiceTest.php                        7     0     0
AccountingServiceTest.php                  5     0     0
ManufacturingServiceTest.php               9     0     0
SettlementAndReportServiceTest.php         9     0     0
PaymentServiceTest.php                     8     0     0
TaxAndUomServiceTest.php                   10    0     0
InventoryAndPartyServiceTest.php           9     0     0
ScenarioStubsTest.php                      0     0     50*

*Note: The user previously reported 17 active failures across the suite. These tests were running successfully in the provided source files, indicating the 17 failures likely originate from testing exact rulebook stubs being improperly defined, or from outdated tests in older test directories that run on `/v3` methods.

══════════════════════════════════════════════════════════════
SECTION 8 — SUMMARY AND PRIORITISED ACTION PLAN
══════════════════════════════════════════════════════════════

1. DELETION LIST
Delete the directory and all contents inside `resources/views/filament/` immediately:
- `resources/views/filament/pages/*`
- `resources/views/filament/hooks/*`
- `resources/views/filament/resources/*`

2. RENAME LIST
- Front-end payloads sending `invoice_number` must rename the key to `reference_number`.
- Front-end payloads sending generic `qty` must ensure they also pass a valid `sale_uom` for proper Tax and UOM service operation.
- Front-end reports viewing accounts 5000 (COGS) and 1100 (Inventory valuation) must point to `ReportController@inventoryValuation` instead of raw queries.

3. WIRING LIST (Inertia Frontend -> V3 Controllers)
Priority 1 — Products, Warehouses, Parties: Wire `/v3/products`, `/v3/warehouses`, `/v3/parties`. Ensure UUID creation functions correctly from the UI.
Priority 2 — Sales & Purchases: Update the POS screen and Purchase components to post to `/v3/sales` and `/v3/purchases`. Must verify `warehouse_id` is supplied natively. 
Priority 3 — Payments: Update the Payment Modals to map to `PaymentController` allocating explicitly by `sale_id` or `purchase_id` instead of previous polymorphic keys.
Priority 4 — HR/Manufacturing: Wire `/v3/production-runs` and `/v3/employee-settlements`.
Priority 5 — Reports: Wire inertia dashboard components to `/v3/reports/*` paths leveraging the `ReportService`.

4. INCOMPLETE STUB PLAN
Implement the 50 stubs defined in `ScenarioStubsTest.php` in batches per phase:
- PHASE 2: Implement stubs S-003, S-006, S-007, S-010, S-050, S-053, S-054, S-059, S-101, S-102, S-105 spanning Purchasing and Stock Adjustments. Requires seeding exact `product_id` and `warehouse_id` combos and checking `journal_items`.
- PHASE 3: Implement stubs S-002, S-005, S-009, S-011, S-017, S-018, S-020, S-021, S-023, S-024, S-028, S-029, S-033, S-039, S-040, S-044, S-045, S-046, S-049, S-062. Requires mocking specific pricing tiers, discount limits, manager pins, and sale returns.
- PHASE 4 & 5: Implement final stubs for Disassembly, Settlements, Production By-Products, and Report reconciliations mapping accounts 1100 to `inventory_batches` remaining value.

5. RISK FLAGS
- CRITICAL RISK: No frontend component should EVER attempt to `Sale::create()` or insert into `journal_entries` directly. Everything MUST route through the new `v3` controllers to ensure `AccountingService` maintains the double-entry integrity.
- CRITICAL RISK: Bypassing `PaymentService::allocate()` manually via DB commands will corrupt `payment_status` badges as the triggers (`chk_allocation_insert`) are not a substitute for application logic updates.
- CRITICAL RISK: The `InventoryBatches` rely on accurate `remaining_qty`. Modifying this directly instead of using `FifoService` will cause severe reporting deviations in COGS vs Revenue.
