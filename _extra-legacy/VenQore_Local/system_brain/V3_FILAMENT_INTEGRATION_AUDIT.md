# V3 Filament Integration Audit

This document contains a comprehensive audit of the VenQore ERP application codebase to prepare for the integration of the Filament/Inertia frontend with the new V3 backend services.

══════════════════════════════════════════════════════════════
## SECTION 1 — FILAMENT FRONTEND INVENTORY
══════════════════════════════════════════════════════════════
**Status:** No Filament resources found in `app/Filament/`.
The command `find app/Filament -type f -name "*.php" | sort` resulted in an error indicating the directory does not exist. However, there are some residual Blade views in `resources/views/filament/`, mostly for reports and a few pages (`party-ledger.blade.php`, `analytics-dashboard.blade.php`, `cookbook.blade.php`, etc.).

**Conclusion:** The application relies on Inertia.js (React/Vue) for its primary frontend (as seen in `resources/js/Pages/V3/`), or the original Filament resources were deleted/moved. Since no Filament PHP resource classes exist, there are no existing Filament form fields or actions to directly map in the classic Filament way. The integration will focus on wiring the Inertia/React frontend (or any remaining frontend components) directly to the V3 services.

══════════════════════════════════════════════════════════════
## SECTION 2 — V3 BACKEND INVENTORY
══════════════════════════════════════════════════════════════
The V3 backend consists of a complete suite of services handling all domain logic, adhering strictly to double-entry accounting and FIFO inventory principles.

### Service Inventory

1.  **AccountingService** (`app/Services/V3/AccountingService.php`)
    *   **Methods:**
        *   `createEntry(array $referenceData, array $items)`: Creates balanced `journal_entries` and `journal_items`. Automatically rebuilds `party_snapshots`.
        *   `reverseEntry(string $entryId, string $reason)`: Reverses an existing journal entry. Voids associated `payment_allocations`.
        *   `getBalance(string|int $partyId, string $accountCode)`: Retrieves balance (delegates to PartyService/live ledger).
    *   **Writes to:** `journal_entries`, `journal_items`, `party_snapshots` (via PartyService), `payment_allocations` (updates status on reversal).
    *   **Notes:** Throws `\InvalidArgumentException` if entry is unbalanced.

2.  **SaleService** (`app/Services/V3/SaleService.php`)
    *   **Methods:**
        *   `post(array $data)`: Main entry point. Calculates totals, checks limits, deducts stock via `FifoService`, posts journal entries via `AccountingService`, creates `sales` and `sale_items`, handles `sales_orders` conversion, allocates initial payments.
        *   `reverse(string $saleId, string $reason)`: Reverses a sale, restores stock, reverses journal entries.
    *   **Writes to:** `sales`, `sale_items`, `sales_orders` (updates status).
    *   **Dependencies:** `FifoService`, `AccountingService`, `TaxService`, `PaymentService`, `UomService`.

3.  **FifoService** (`app/Services/V3/FifoService.php`)
    *   **Methods:**
        *   `deductStock(string $productId, string $warehouseId, float $qty, string $saleUom)`: Deducts stock strictly oldest-first. Returns array of batches consumed.
        *   `restoreStock(string $saleItemId)`: Restores stock to the exact original batch.
        *   `receiveBatch(...)`: Creates new `inventory_batches`.
    *   **Writes to:** `inventory_batches`, `sale_item_batches` (by caller usually, or manages state).
    *   **Notes:** Enforces strict per-warehouse FIFO.

4.  **PaymentService** (`app/Services/V3/PaymentService.php`)
    *   **Methods:**
        *   `allocate(string $journalEntryId, array $saleAllocations, array $purchaseAllocations)`: Allocates payment to invoices.
        *   `updatePaymentBadge(string $invoiceId, string $type)`: Updates invoice `payment_status` ('unpaid', 'partial', 'paid'). Accounts for round-off tolerance.
        *   `voidAllocations(string $journalEntryId)`: Voids allocations and auto-updates badges.
    *   **Writes to:** `payment_allocations`, `sales`, `purchases`.

5.  **ManufacturingService** (`app/Services/V3/ManufacturingService.php`)
    *   **Methods:**
        *   `startRun(array $data)`: Deducts raw materials, posts WIP journal entry.
        *   `completeRun(string $runId, float $actualYield)`: Creates finished goods batch, closes WIP. Handles by-products.
        *   `partialReverse(...)`: Reverses only unsold quantity.
        *   `disassemble(...)`: Breaks set into components based on allocation percentages.
    *   **Writes to:** `production_runs`, `inventory_batches`, `journal_entries` (via AccountingService).

6.  **InventoryService** (`app/Services/V3/InventoryService.php`)
    *   **Methods:**
        *   `receivePurchase(...)`: Creates batches for purchases.
        *   `adjustStock(...)`: Increases/decreases stock, posting to adjustment gain/loss accounts.
    *   **Writes to:** `inventory_batches` (via FifoService).

7.  **SettlementService** (`app/Services/V3/SettlementService.php`)
    *   **Methods:**
        *   `processSettlement(array $data)`: Handles final employee settlement (salary, gratuity, notice pay). Posts composite journal entry. Marks employee terminated.
    *   **Writes to:** `employees`, `journal_entries` (via AccountingService).

8.  **TaxService** (`app/Services/V3/TaxService.php`)
    *   **Methods:**
        *   `calculateLineTax(...)`: Handles inclusive/exclusive tax calculations.
        *   `taxReport(...)`: Generates report separating collected vs recoverable tax.

9.  **UomService** (`app/Services/V3/UomService.php`)
    *   **Methods:**
        *   `toBaseQty(...)`: Converts sale/purchase UOM to base UOM for stock deduction.

10. **ReportService** (`app/Services/V3/ReportService.php`)
    *   **Methods:** `trialBalance()`, `profitAndLoss()`, `balanceSheet()`, `inventoryValuation()`, `agedReceivables()`, etc.
    *   **Notes:** Reads from ledger strictly skipping reversed entries.

11. **PartyService** (`app/Services/V3/PartyService.php`)
    *   **Methods:** `rebuildSnapshot()`, `getBalance()`.
    *   **Writes to:** `party_snapshots`.

### Web Routes & Controllers (v3 prefix)
*   **Products:** `ProductController`, nested `UomConversionController`, `PriceTierController`.
*   **Warehouses:** `WarehouseController`.
*   **Purchases:** `PurchaseController`, `PurchaseReturnController`, `SupplierPaymentController`, `SupplierStatementController`, `OpeningBalanceController`.
*   **Sales:** `SaleController`, `SaleReturnController`, `CustomerPaymentController`, `BounceController`, `BadDebtController`, `CustomerAdvanceController`, `SalesOrderController`, `QuotationController`, `CustomerStatementController`, `InvoicePdfController`.
*   **Manufacturing:** `BomController`, `ProductionRunController`.
*   **HR & Special:** `EmployeeController`, `PayrollController`, `EmployeeSettlementController`, `CashShortageController`, `DisasterClaimController`, `AssetController`, `DepreciationController`, `LoanController`, `ExpenseController`, `FundController`, `BankTransferController`, `DonationController`.
*   **Admin:** `RoleController`, `FiscalYearController`.
*   **Reports:** `ReportController`, `ReportExportController`, `DashboardController`.

All these controllers expect form submissions (via Inertia) and delegate to the `*Service` classes. The preferred method for the frontend is to submit HTTP requests to these controllers, which then call the services (Option A).

══════════════════════════════════════════════════════════════
## SECTION 3 — DATABASE SCHEMA INVENTORY (V3)
══════════════════════════════════════════════════════════════
V3 heavily utilizes UUIDs and composite indexes for performance.

*   `journal_entries`: Core accounting table. `is_reversed` flag used heavily.
*   `journal_items`: The most queried table. `party_id` nullable for AR/AP tracking.
*   `party_snapshots`: Cached balances for performance (maintained by `PartyService`).
*   `inventory_batches`: Core FIFO table. `remaining_qty` is decremented.
*   `sale_item_batches`: Junction table linking sale items to exact batches for immutable COGS.
*   `payment_allocations`: Links payments to specific invoices. Uses DB triggers `chk_allocation_insert` and `chk_allocation_update` to prevent over-allocation at standard database level.
*   `product_uom_conversions`: Handles multiple selling units.
*   `product_price_tiers`: Handles tiered pricing.
*   `sales`, `sale_items`, `purchases`, `purchase_items`: Transaction tables.
*   `sales_orders`, `sales_order_items`, `quotations`, `quotation_items`: Pre-sales tables.
*   `bill_of_materials`, `bom_items`, `production_runs`, `disassembly_boms`, `disassembly_bom_items`: Manufacturing tables.
*   `employees`: HR tracking.
*   `disaster_claims`: For insurance claim workflows.
*   `system_settings`: Key-value store (e.g., `roundoff_tolerance`).
*   `audit_logs`: Detailed before/after JSON logging.

══════════════════════════════════════════════════════════════
## SECTION 6 — WIRING GAP ANALYSIS
══════════════════════════════════════════════════════════════
Since classic Filament PHP classes do not exist, the "wiring" involves connecting the Inertia.js React/Vue frontend pages to the V3 Laravel Controllers defined in `routes/web.php` (under the `v3` prefix).

**Data Contract Verification Required:**
The frontend must send data matching the exact shape expected by the V3 controllers (which usually validate via FormRequests). We must ensure:
1.  **UUIDs:** The frontend must send UUIDs for all foreign keys (`party_id`, `warehouse_id`, `product_id`).
2.  **Sale/Purchase Payloads:** Must match the expected nested arrays (e.g., `sale_items` containing `product_id`, `qty`, `unit_price`, `sale_uom`).
3.  **No Direct Manipulations:** The frontend must not attempt to manually update `payment_status` or `remaining_qty`; it must exclusively rely on controller endpoints which invoke `PaymentService` and `FifoService`.

══════════════════════════════════════════════════════════════
## SECTION 7 — TEST SUITE STATUS
══════════════════════════════════════════════════════════════
The V3 backend logic is heavily tested via Scenario Tests located in `tests/Feature/V3/Scenarios/`.

*   **Passed Tests:** Extensive coverage for `FifoService`, `ManufacturingService`, `AccountingService`, `SettlementAndReportServiceTest`, `PaymentService`, `TaxAndUomService`, `InventoryAndPartyServiceTest`.
*   **Incomplete Stubs:** `ScenarioStubsTest.php` contains exactly **50** `markTestIncomplete` stubs. These represent scenarios from the rulebook that have not yet been fully implemented or tested (e.g., `S-003`, `S-006`, `S-007`, `S-053`).
*   **Active Failures:** The user reported 17 active failures in the previous output, which need immediate resolution according to the Phase 6 gate definition.

══════════════════════════════════════════════════════════════
## SECTION 8 — ACTION PLAN
══════════════════════════════════════════════════════════════

1.  **Resolve Active Failures:** Fix the 17 failing tests in the V3 scenario suite first. These are often caused by outdated payloads (e.g., `invoice_number` vs `reference_number`) or missing seed data.
2.  **Implement Scenario Stubs:** Systematically implement the 50 pending stubs in `ScenarioStubsTest.php`. This will ensure full compliance with the V3 Rulebook.
3.  **Frontend Wiring (Inertia -> Controllers):** Audit the React/Vue components in `resources/js/Pages/V3/` to ensure their axios/Inertia requests point to the newly defined `v3.*` named routes with payloads that match the V3 requests.
4.  **View Cleanup:** The old blade views in `resources/views/filament/` (especially reports) are likely obsolete as V3 relies on `ReportService` yielding data to Inertia or API endpoints. These can be safely deleted or moved to an archive once the Inertia reporting dashboards are confirmed operational.
5.  **Performance Gate:** Ensure `add_v3_performance_indexes.php` migration has run successfully to support rapid dashboard load times.
