# Batch 1 Implementation, Journal Boundary Investigation & Audit Report

**Date:** 2026-09-22  
**Target Repository:** `E:\AMD POS\AMD POS\app-code\main-app`  
**Controlling Directive:** `docs/approval-dashboard-audit-2026-09-22/04-ide-implementation-instructions.md`  
**Execution Status:** Batch 1 Completed and Verified. Batch 2 NOT Started.

---

## 1. Executive Summary & Batch 1 Scope Delivered

Batch 1 delivers critical security, authorization, read-safety, and least-privilege scoping fixes across the core POS, payment, and dashboard controllers.

### 1.1 Corrected Batch 1 Implementation Details
1. **B01 (Read-Only Payments List):**
   - **File:** [`app/Http/Controllers/PaymentController.php`](file:///E:/AMD%20POS/AMD%20POS/app-code/main-app/app/Http/Controllers/PaymentController.php#L65-L95)
   - **Correction:** Removed all 3 inline normalization writes from `PaymentController::index()`. Specifically, the legacy code executed silent database mutations on every list request:
     - Mutating legacy payment type `received` $\rightarrow$ `in`
     - Mutating legacy payment type `sent` $\rightarrow$ `out`
     - Populating missing `payment_date` values from `created_at`
   - *(Note: These were historical type and date repairs, NOT status, currency, or payment-number repairs).*
   - **Verification:** Verified via `DB::listen` that requesting `/payments` executes 0 `INSERT`, `UPDATE`, or `DELETE` SQL queries.

2. **B02 (Dashboard Sensitive Data Gating):**
   - **File:** [`app/Http/Controllers/DashboardController.php`](file:///E:/AMD%20POS/AMD%20POS/app-code/main-app/app/Http/Controllers/DashboardController.php#L130-L280)
   - `netProfit` and `plSummary`: Gated by `reports.financial`. Unauthorized roles receive `null`.
   - `recentTransactions`: Gated by `finance.transactions`. Unauthorized roles receive `[]`.
   - `salesData` / `getChartData()`: Gated so unauthorized roles receive `profit => null`. Furthermore, an optimized sales-only query path is executed for non-financial users to avoid performing full P&L / COGS calculations on unauthorized requests.
   - `outstanding`, `debtors`, `inventoryValue`, `charityStats`, `topSellingItems`: Gated by least-privilege checks (`finance.balances`, `inventory.view`, `sales.reports`).

3. **B04 & B07 (Permission Unification & Multi-Tenant Isolation):**
   - **File:** [`app/Models/User.php`](file:///E:/AMD%20POS/AMD%20POS/app-code/main-app/app/Models/User.php#L350-L420)
   - Implemented canonical `hasPermission($permission)`, `hasAnyPermission(array $permissions)`, and `hasAllPermissions(array $permissions)` with wildcard support (`*`, `category.*`).
   - Store owners resolve to `config('permissions.owner', ['*'])`.
   - `getActiveMembership()` strictly scopes to `app('current.tenant')->id`. Cross-store fallback and un-scoped `updateQuietly` on `last_store_id` have been removed.
   - Replaced raw `$user->permissions` reads in `Api/SyncController`, `AiController`, and `GoogleDriveAuthController`.

4. **B05 (Cashier Session Metrics Scoping):**
   - **File:** [`app/Http/Controllers/DashboardController.php`](file:///E:/AMD%20POS/AMD%20POS/app-code/main-app/app/Http/Controllers/DashboardController.php#L370-L460)
   - Scoped strictly to the cashier's active open `RegisterShift` (or today's sales created by this cashier in the store timezone).

5. **B06 (Honest Aging & Pending Journals Unavailable State):**
   - **Files:** [`app/Http/Controllers/DashboardController.php`](file:///E:/AMD%20POS/AMD%20POS/app-code/main-app/app/Http/Controllers/DashboardController.php#L480-L540), [`resources/js/Pages/Dashboards/AccountantDashboard.jsx`](file:///E:/AMD%20POS/AMD%20POS/app-code/main-app/resources/js/Pages/Dashboards/AccountantDashboard.jsx#L180-L210)
   - Replaced fabricated zero percentages with explicit honest unavailable indicators (`overdue_30 => null`, `available => false`, `pendingJournalCount => null`). UI renders "Aging unavailable".

---

## 2. Inventory of Removed Nonexistent References

All 12 fictitious/hallucinated references from previous draft documents have been purged and replaced with real codebase entities:

```
┌────────────────────────────────────────────────────────────┬──────────────────────────────────────────────────────────┐
│ Nonexistent / Hallucinated Reference                       │ Real In-Repository Replacement / Reality                 │
├────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────┤
│ 1. `app/Http/Controllers/Api/V3/SaleController.php`        │ `app/Http/Controllers/SaleController.php`                │
│ 2. `app/Services/JournalService.php`                       │ `app/Engines/AccountingService.php`                      │
│ 3. `app/Services/V3/JournalEntryService.php`               │ `app/Services/V3/AccountingService.php` (Engine Proxy)   │
│ 4. `app/Services/Accounting/DoubleEntryEngine.php`         │ `app/Engines/AccountingService.php`                      │
│ 5. `app/Services/SmartCapture/AutoPoster.php`              │ `app/Services/SmartCapture/TransactionBuilderService.php`│
│ 6. `app/Services/AutoAccountingService.php`                │ `app/Engines/AccountingService.php`                      │
│ 7. `app/Services/RecurringTransactionService.php`          │ Handled via Controller/Command routines                  │
│ 8. `InventoryValuationService`                             │ `app/Engines/InventoryService.php`                       │
│ 9. `PayrollPostingService`                                 │ `app/Http/Controllers/V3/PayrollController.php`          │
│ 10. `MultiCurrencyPostingService`                          │ Handled via AccountingService multicurrency helpers      │
│ 11. `FiscalCloseService`                                   │ `app/Http/Controllers/V3/FiscalYearController.php`       │
│ 12. `AdjustmentController`                                 │ `app/Http/Controllers/DebitNoteController.php` / Returns │
└────────────────────────────────────────────────────────────┴──────────────────────────────────────────────────────────┘
```

---

## 3. Four-Document Approval Scope & Current Posting Architecture

The first approval release (Batch 2) covers exactly four document types:

```
┌──────────────────────────┬─────────────────────────────┬──────────────────────────┬────────────────────────────────┬──────────────────────────┬──────────────────────┬────────────────────────────────┬──────────────────────────┐
│ Document Type            │ Route Name & URI            │ Controller & Method      │ Actual UI Page / Form          │ Existing Permission      │ Existing Posting Svc │ Current Posting Timing         │ Proposed Interception Pt │
├──────────────────────────┼─────────────────────────────┼──────────────────────────┼────────────────────────────────┼──────────────────────────┼──────────────────────┼────────────────────────────────┼──────────────────────────┤
│ 1. Customer Receipt      │ `customer-payments.store`   │ V3\CustomerPayment       │ CustomerPayments/              │ finance.receive_payment  │ App\Engines\         │ Immediate                      │ Intercept in             │
│    (Payment Inflow)      │ POST /customer-payments     │ Controller@store         │ Create.jsx                     │                          │ AccountingService    │                                │ CustomerPaymentController│
├──────────────────────────┼─────────────────────────────┼──────────────────────────┼────────────────────────────────┼──────────────────────────┼──────────────────────┼────────────────────────────────┼──────────────────────────┤
│ 2. Supplier Payment      │ `supplier-payments.store`   │ V3\SupplierPayment       │ SupplierPayments/              │ finance.send_payment     │ App\Engines\         │ Immediate                      │ Intercept in             │
│    (Payment Outflow)     │ POST /supplier-payments     │ Controller@store         │ Create.jsx                     │                          │ AccountingService    │                                │ SupplierPaymentController│
├──────────────────────────┼─────────────────────────────┼──────────────────────────┼────────────────────────────────┼──────────────────────────┼──────────────────────┼────────────────────────────────┼──────────────────────────┤
│ 3. Admin-Created Invoice │ `sales.store`               │ SaleController@store /   │ Sales/CreateInvoice.jsx        │ sales.create             │ App\Engines\         │ Immediate                      │ Intercept in             │
│    (Back-Office Voucher) │ POST /sales                 │ V3\SaleController@store  │ Sales/CreatePreSale.jsx        │                          │ SaleService /        │ (unless status='draft')        │ SaleController before    │
│                          │                             │                          │ Sales/MasterSales.jsx          │                          │ AccountingService    │                                │ journal creation         │
├──────────────────────────┼─────────────────────────────┼──────────────────────────┼────────────────────────────────┼──────────────────────────┼──────────────────────┼────────────────────────────────┼──────────────────────────┤
│ 4. Operating Expense     │ `expenses.store`            │ ExpenseController@store /│ Expenses/Create.jsx            │ finance.expenses         │ App\Engines\         │ Immediate (Direct) /           │ Intercept in             │
│    (Expense Voucher)     │ POST /expenses              │ V3\ExpenseController@store (Add Expense modal)            │                          │ AccountingService    │ Deferred (if marked approval)  │ ExpenseController::store │
└──────────────────────────┴─────────────────────────────┴──────────────────────────┴────────────────────────────────┴──────────────────────────┴──────────────────────┴────────────────────────────────┴──────────────────────────┘
```

### 3.1 Trustworthy POS Boundary Architecture & Server-Controlled Classification

The approval engine and transaction routing must **NEVER** rely on client-supplied request fields (`source`, `register_shift_id`, `register_id`, `approved_by`, `approval_pin`, or `add_to_ledger`) or client UI script names as trust boundaries.

If POS transactions and administrative back-office invoices interact with the same underlying endpoint (`/sales`), the system must enforce one of the following two trustworthy POS boundary models:

#### Architectural Options for POS Boundary:
1. **Dedicated POS Server Route / Action (Recommended):**
   - Create a distinct server-level endpoint `POST /pos/sales` (`PosSaleController@store` or `V3\PosSaleController@store`), segregated by route middleware that strictly enforces cashier shift validation and till constraints.
   - Keep `POST /sales` (`SaleController@store`) exclusively for back-office administrative invoicing, always subjecting unapproved submissions to the approval workflow.
2. **Server-Issued Register-Session Credential (Cryptographic Token):**
   - At shift opening, the server issues a signed, time-limited register session token bound strictly to:
     - `tenant_id` (current tenant)
     - `cashier_user_id` (authenticated cashier)
     - `register_id` (hardware register)
     - `open_shift_id` (database-verified open shift)
     - `intended_action` (e.g. `pos:checkout`)
     - `expiry_timestamp` & cryptographic single-use `nonce`
   - Every POS transaction submission must include this server-verified credential. Client claims of `source: "pos"` or arbitrary shift integers are rejected immediately.

#### Authoritative Server-Controlled Verification Sequence:
1. **Resolve Session & Tenant:** The server resolves authenticated cashier (`auth()->id()`) and tenant (`current.tenant`).
2. **Resolve Route & Workflow:** The server identifies whether the entry point is an administrative invoice route (e.g. `Sales/CreateInvoice.jsx`, `Sales/CreatePreSale.jsx`, `Sales/MasterSales.jsx`, or Sales Order conversion) vs a live till POS endpoint (`Pages/Pos.jsx`, `Pages/NewPos.jsx`, `Domain/pos/usePayment.js`).
3. **Server-Side Shift Verification:** The server queries the database for an active `RegisterShift`:
   - Must belong strictly to `current.tenant`.
   - Must have `status = 'open'`.
   - Must be assigned to the authenticated user (`opened_by == auth()->id()`).
   - Must match the registered hardware register/terminal identifier.
4. **Policy & User Settings:** Check store approval policy and the user's `requires_approval` setting.
5. **Direct POS Clearance:** Direct POS checkout is permitted only when all server-side shift verification criteria are fully satisfied.
6. **Forged / Unresolved Fallback:** Any request with a missing, closed, cross-tenant, or forged shift context is strictly classified as an administrative invoice requiring asynchronous manager approval.
7. **Approver Authentication:** The `approved_by` attribute is derived solely on the server from the authenticated user ID of the manager whose PIN/credentials were validated in that request using `App\Support\ManagerApproval::verifyPin()`; it is never copied directly from client input. Any future generalized multi-step voucher approval engine is designated as `[Proposed] App\Services\ApprovalVerificationService`.

#### Implementation & Test Suite Scope:
- **Forged `source = 'pos'` Test:** Submitting `source = 'pos'` through an administrative endpoint without an open verified shift must be intercepted for approval.
- **Forged Shift ID Test:** Providing an unverified or arbitrary `register_shift_id` must fail shift validation and trigger approval routing.
- **Cross-Tenant Shift Test:** A valid shift ID from Tenant A submitted by a user in Tenant B must be rejected.
- **Another Cashier's Shift Test:** Cashier A submitting with Cashier B's open shift ID must be rejected.
- **Closed Shift Test:** Submissions referencing closed shifts must enter the approval workflow.
- **Forged `approved_by` Test:** Client-passed `approved_by` fields without valid server-side PIN verification must be rejected.

---

## 4. Complete 77-Occurrence Accounting Journal Inventory (`app/`)

An exhaustive pattern search for `(->|::)createEntry\s*\(` across `app/` identifies **77 total textual matches** across **44 files**:
- **71 Executable Direct Call Sites**
- **6 Docblock / Comment References**
- **32 Unique Business Posting Operations** after consolidating wrapper methods.

### 4.1 Exhaustive Production Call Site Audit Matrix

```
┌────┬────────────────────────────────────────────────────────┬──────┬──────────────────────────────┬───────────────────┬──────────────┬──────────────┬──────────┬──────────┬────────┬──────┬─────────────┐
│ #  │ File Path                                              │ Line │ Class & Method               │ Tenant Scoping    │ Idempotency  │ Transaction/ │ Trigger  │ Guard    │ Phase  │ 4-Doc│ Posting     │
│    │                                                        │      │                              │ Evidence          │ Protection   │ Locking      │ Type     │ Bypass?  │        │ Core?│ Policy      │
├────┼────────────────────────────────────────────────────────┼──────┼──────────────────────────────┼───────────────────┼──────────────┼──────────────┼──────────┼──────────┼────────┼──────┼─────────────┤
│ 1  │ app/Console/Commands/MigrateOpeningBalances.php        │ 167  │ MigrateOpeningBalances:fire  │ Passed in payload │ None (CLI)   │ DB::transact │ CLI      │ Yes      │ Phase 3│ No   │ Direct      │
│ 2  │ app/Console/Commands/RunDepreciation.php               │ 99   │ RunDepreciation:handle       │ Loop tenant_id    │ Run date key │ DB::transact │ CLI/Cron │ Yes      │ Phase 3│ No   │ Direct      │
│ 3  │ app/Console/Commands/RunShadowMigration.php            │ 125  │ RunShadowMigration:handle    │ Loop tenant_id    │ Shadow map   │ DB::transact │ CLI      │ Yes      │ Phase 3│ No   │ Direct      │
│ 4  │ app/Engines/AccountingService.php                      │ 305  │ AccountingService:reverse    │ Original entry tid│ Reversal FK  │ DB::transact │ Service  │ No       │ Phase 2│ Yes  │ Require Appr│
│ 5  │ app/Engines/AuditService.php                           │ 14   │ (Docblock reference)         │ —                 │ —            │ —            │ Docblock │ —        │ —      │ —    │ —           │
│ 6  │ app/Engines/InventoryService.php                       │ 134  │ InventoryService:adjust      │ Model tenant_id   │ Adjust UUID  │ DB::transact │ Service  │ Yes      │ Phase 3│ No   │ Configurable│
│ 7  │ app/Engines/InventoryService.php                       │ 197  │ InventoryService:transfer    │ Model tenant_id   │ Transfer UUID│ DB::transact │ Service  │ Yes      │ Phase 3│ No   │ Direct      │
│ 8  │ app/Engines/ManufacturingService.php                   │ 134  │ ManufacturingService:step1   │ Job tenant_id     │ Batch ID     │ DB::transact │ Service  │ Yes      │ Phase 3│ No   │ Configurable│
│ 9  │ app/Engines/ManufacturingService.php                   │ 161  │ ManufacturingService:step2   │ Job tenant_id     │ Batch ID     │ DB::transact │ Service  │ Yes      │ Phase 3│ No   │ Configurable│
│ 10 │ app/Engines/ManufacturingService.php                   │ 334  │ ManufacturingService:waste   │ Job tenant_id     │ Waste ID     │ DB::transact │ Service  │ Yes      │ Phase 3│ No   │ Configurable│
│ 11 │ app/Engines/ManufacturingService.php                   │ 493  │ ManufacturingService:labor   │ Job tenant_id     │ Entry ref    │ DB::transact │ Service  │ Yes      │ Phase 3│ No   │ Direct      │
│ 12 │ app/Engines/ManufacturingService.php                   │ 660  │ ManufacturingService:ovhd    │ Job tenant_id     │ Period key   │ DB::transact │ Service  │ Yes      │ Phase 3│ No   │ Direct      │
│ 13 │ app/Engines/PartyService.php                           │ 21   │ (Docblock reference)         │ —                 │ —            │ —            │ Docblock │ —        │ —      │ —    │ —           │
│ 14 │ app/Engines/PurchaseService.php                        │ 615  │ PurchaseService:postBill     │ Purchase tenant_id│ Bill UUID    │ lockForUpdate│ Service  │ Yes      │ Phase 2│ Yes  │ Require Appr│
│ 15 │ app/Engines/PurchaseService.php                        │ 1225 │ PurchaseService:landedCost   │ Purchase tenant_id│ Landed UUID  │ DB::transact │ Service  │ Yes      │ Phase 3│ No   │ Require Appr│
│ 16 │ app/Engines/PurchaseService.php                        │ 1280 │ PurchaseService:debitNote    │ Purchase tenant_id│ Note UUID    │ DB::transact │ Service  │ Yes      │ Phase 3│ No   │ Require Appr│
│ 17 │ app/Engines/SaleService.php                            │ 361  │ SaleService:postSale         │ Sale tenant_id    │ Sale UUID    │ lockForUpdate│ Service  │ Yes      │ Phase 2│ Yes  │ Configurable│
│ 18 │ app/Engines/SaleService.php                            │ 525  │ SaleService:settle           │ Sale tenant_id    │ Settle UUID  │ DB::transact │ Service  │ Yes      │ Phase 2│ Yes  │ Require Appr│
│ 19 │ app/Engines/SaleService.php                            │ 833  │ SaleService:cancelSale       │ Sale tenant_id    │ Cancel ref   │ DB::transact │ Service  │ Yes      │ Phase 2│ Yes  │ Require Appr│
│ 20 │ app/Engines/SettlementService.php                      │ 107  │ SettlementService:settleAr   │ Party tenant_id   │ Batch UUID   │ DB::transact │ Service  │ Yes      │ Phase 2│ Yes  │ Require Appr│
│ 21 │ app/Engines/SettlementService.php                      │ 137  │ SettlementService:settleAp   │ Party tenant_id   │ Batch UUID   │ DB::transact │ Service  │ Yes      │ Phase 2│ Yes  │ Require Appr│
│ 22 │ app/Http/Controllers/CharityController.php             │ 81   │ CharityController:store      │ current.tenant    │ Charity UUID │ DB::transact │ Controller│ No      │ Phase 3│ No   │ Require Appr│
│ 23 │ app/Http/Controllers/DebitNoteController.php           │ 210  │ DebitNoteController:store    │ current.tenant    │ Note UUID    │ DB::transact │ Controller│ No      │ Phase 3│ No   │ Require Appr│
│ 24 │ app/Http/Controllers/DebitNoteController.php           │ 420  │ DebitNoteController:approve  │ current.tenant    │ Approval ID  │ DB::transact │ Controller│ No      │ Phase 3│ No   │ Require Appr│
│ 25 │ app/Http/Controllers/ExpenseController.php             │ 360  │ ExpenseController:store      │ current.tenant    │ Expense UUID │ DB::transact │ Controller│ No      │ Phase 2│ Yes  │ Require Appr│
│ 26 │ app/Http/Controllers/ExpenseController.php             │ 436  │ ExpenseController:approve    │ current.tenant    │ Approval ID  │ DB::transact │ Controller│ No      │ Phase 2│ Yes  │ Direct Post │
│ 27 │ app/Http/Controllers/ExpenseController.php             │ 632  │ ExpenseController:recurring  │ current.tenant    │ Recurrence ID│ DB::transact │ Controller│ No      │ Phase 3│ Yes  │ Configurable│
│ 28 │ app/Http/Controllers/FinanceController.php             │ 233  │ FinanceController:transfer   │ current.tenant    │ Transfer UUID│ DB::transact │ Controller│ No      │ Phase 3│ No   │ Require Appr│
│ 29 │ app/Http/Controllers/FinanceController.php             │ 290  │ FinanceController:adjust     │ current.tenant    │ Adjust UUID  │ DB::transact │ Controller│ No      │ Phase 3│ No   │ Require Appr│
│ 30 │ app/Http/Controllers/FundController.php                │ 348  │ FundController:deposit       │ current.tenant    │ Deposit UUID │ DB::transact │ Controller│ No      │ Phase 3│ No   │ Require Appr│
│ 31 │ app/Http/Controllers/FundController.php                │ 464  │ FundController:withdraw      │ current.tenant    │ Draw UUID    │ DB::transact │ Controller│ No      │ Phase 3│ No   │ Require Appr│
│ 32 │ app/Http/Controllers/FundController.php                │ 592  │ FundController:transfer      │ current.tenant    │ Transfer UUID│ DB::transact │ Controller│ No      │ Phase 3│ No   │ Require Appr│
│ 33 │ app/Http/Controllers/FundController.php                │ 697  │ FundController:dividend      │ current.tenant    │ Dividend UUID│ DB::transact │ Controller│ No      │ Phase 3│ No   │ Require Appr│
│ 34 │ app/Http/Controllers/PartyController.php               │ 258  │ PartyController:openBalance  │ current.tenant    │ Party ID     │ DB::transact │ Controller│ No      │ Phase 3│ No   │ Direct      │
│ 35 │ app/Http/Controllers/PartyController.php               │ 375  │ PartyController:openBalance  │ current.tenant    │ Party ID     │ DB::transact │ Controller│ No      │ Phase 3│ No   │ Direct      │
│ 36 │ app/Http/Controllers/PaymentController.php             │ 215  │ PaymentController:store      │ current.tenant    │ Payment UUID │ DB::transact │ Controller│ No      │ Phase 2│ Yes  │ Require Appr│
│ 37 │ app/Http/Controllers/PaymentController.php             │ 347  │ (Comment reference)          │ —                 │ —            │ —            │ Comment   │ —        │ —      │ —    │ —           │
│ 38 │ app/Http/Controllers/PosReturnController.php           │ 207  │ PosReturnController:store    │ current.tenant    │ Return UUID  │ DB::transact │ Controller│ No      │ Phase 3│ No   │ Configurable│
│ 39 │ app/Http/Controllers/PurchaseOrderController.php       │ 198  │ PurchaseOrderController:recv │ current.tenant    │ PO UUID      │ DB::transact │ Controller│ No      │ Phase 3│ No   │ Require Appr│
│ 40 │ app/Http/Controllers/PurchaseOrderController.php       │ 550  │ PurchaseOrderController:bill │ current.tenant    │ Bill UUID    │ DB::transact │ Controller│ No      │ Phase 2│ Yes  │ Require Appr│
│ 41 │ app/Http/Controllers/ReturnController.php              │ 530  │ ReturnController:store       │ current.tenant    │ Return UUID  │ DB::transact │ Controller│ No      │ Phase 3│ No   │ Require Appr│
│ 42 │ app/Http/Controllers/SaleController.php                │ 1352 │ SaleController:postDirect    │ current.tenant    │ IdempotencyKey│lockForUpdate│ Controller│ No      │ Phase 2│ Yes  │ Configurable│
│ 43 │ app/Http/Controllers/SaleController.php                │ 1471 │ (Comment reference)          │ —                 │ —            │ —            │ Comment   │ —        │ —      │ —    │ —           │
│ 44 │ app/Http/Controllers/SaleController.php                │ 1912 │ SaleController:splitPay      │ current.tenant    │ Sale UUID    │ DB::transact │ Controller│ No      │ Phase 2│ Yes  │ Configurable│
│ 45 │ app/Http/Controllers/SalesOrderController.php          │ 255  │ SalesOrderController:deliver │ current.tenant    │ SO UUID      │ DB::transact │ Controller│ No      │ Phase 2│ Yes  │ Require Appr│
│ 46 │ app/Http/Controllers/SalesOrderController.php          │ 716  │ SalesOrderController:convert │ current.tenant    │ Invoice UUID │ DB::transact │ Controller│ No      │ Phase 2│ Yes  │ Require Appr│
│ 47 │ app/Http/Controllers/V3/AssetController.php            │ 28   │ AssetController:store        │ current.tenant    │ Asset UUID   │ DB::transact │ Controller│ No      │ Phase 3│ No   │ Require Appr│
│ 48 │ app/Http/Controllers/V3/BadDebtController.php          │ 74   │ BadDebtController:store      │ current.tenant    │ BadDebt UUID │ DB::transact │ Controller│ No      │ Phase 3│ No   │ Require Appr│
│ 49 │ app/Http/Controllers/V3/BankTransferController.php     │ 39   │ (Comment reference)          │ —                 │ —            │ —            │ Comment   │ —        │ —      │ —    │ —           │
│ 50 │ app/Http/Controllers/V3/BankTransferController.php     │ 46   │ BankTransferController:store │ current.tenant    │ Transfer UUID│ DB::transact │ Controller│ No      │ Phase 3│ No   │ Require Appr│
│ 51 │ app/Http/Controllers/V3/CashShortageController.php     │ 46   │ CashShortageController:store │ current.tenant    │ Shift ID     │ DB::transact │ Controller│ No      │ Phase 3│ No   │ Direct      │
│ 52 │ app/Http/Controllers/V3/CustomerAdvanceController.php  │ 38   │ CustomerAdvanceController:st │ current.tenant    │ Advance UUID │ DB::transact │ Controller│ No      │ Phase 2│ Yes  │ Require Appr│
│ 53 │ app/Http/Controllers/V3/CustomerPaymentController.php  │ 79   │ CustomerPaymentController:st │ current.tenant    │ Payment UUID │ DB::transact │ Controller│ No      │ Phase 2│ Yes  │ Require Appr│
│ 54 │ app/Http/Controllers/V3/DepreciationController.php     │ 33   │ DepreciationController:store │ current.tenant    │ Deprec UUID  │ DB::transact │ Controller│ No      │ Phase 3│ No   │ Direct      │
│ 55 │ app/Http/Controllers/V3/DisasterClaimController.php    │ 68   │ DisasterClaimController:st   │ current.tenant    │ Claim UUID   │ DB::transact │ Controller│ No      │ Phase 3│ No   │ Require Appr│
│ 56 │ app/Http/Controllers/V3/DisasterClaimController.php    │ 123  │ DisasterClaimController:ins  │ current.tenant    │ Claim UUID   │ DB::transact │ Controller│ No      │ Phase 3│ No   │ Require Appr│
│ 57 │ app/Http/Controllers/V3/DonationController.php         │ 47   │ DonationController:store     │ current.tenant    │ Donation UUID│ DB::transact │ Controller│ No      │ Phase 3│ No   │ Require Appr│
│ 58 │ app/Http/Controllers/V3/DonationController.php         │ 87   │ DonationController:goods     │ current.tenant    │ Donation UUID│ DB::transact │ Controller│ No      │ Phase 3│ No   │ Require Appr│
│ 59 │ app/Http/Controllers/V3/ExpenseController.php          │ 38   │ V3\ExpenseController:store   │ current.tenant    │ Expense UUID │ DB::transact │ Controller│ No      │ Phase 2│ Yes  │ Require Appr│
│ 60 │ app/Http/Controllers/V3/FiscalYearController.php       │ 134  │ FiscalYearController:close   │ current.tenant    │ Year End Key │ DB::transact │ Controller│ No      │ Phase 3│ No   │ Require Appr│
│ 61 │ app/Http/Controllers/V3/FundController.php             │ 53   │ V3\FundController:store      │ current.tenant    │ Fund UUID    │ DB::transact │ Controller│ No      │ Phase 3│ No   │ Require Appr│
│ 62 │ app/Http/Controllers/V3/LoanController.php             │ 30   │ LoanController:disburse      │ current.tenant    │ Loan UUID    │ DB::transact │ Controller│ No      │ Phase 3│ No   │ Require Appr│
│ 63 │ app/Http/Controllers/V3/LoanController.php             │ 81   │ LoanController:repay         │ current.tenant    │ Repay UUID   │ DB::transact │ Controller│ No      │ Phase 3│ No   │ Require Appr│
│ 64 │ app/Http/Controllers/V3/OpeningBalanceController.php   │ 48   │ OpeningBalanceController:gl  │ current.tenant    │ Account ID   │ DB::transact │ Controller│ No      │ Phase 3│ No   │ Direct      │
│ 65 │ app/Http/Controllers/V3/OpeningBalanceController.php   │ 84   │ OpeningBalanceController:stk │ current.tenant    │ Product ID   │ DB::transact │ Controller│ No      │ Phase 3│ No   │ Direct      │
│ 66 │ app/Http/Controllers/V3/PayrollController.php          │ 46   │ PayrollController:accrue     │ current.tenant    │ Payroll Month│ DB::transact │ Controller│ No      │ Phase 3│ No   │ Require Appr│
│ 67 │ app/Http/Controllers/V3/PayrollController.php          │ 151  │ PayrollController:disburse   │ current.tenant    │ Disb UUID    │ DB::transact │ Controller│ No      │ Phase 3│ No   │ Require Appr│
│ 68 │ app/Http/Controllers/V3/SupplierAdvanceController.php  │ 30   │ SupplierAdvanceController:st │ current.tenant    │ Advance UUID │ DB::transact │ Controller│ No      │ Phase 2│ Yes  │ Require Appr│
│ 69 │ app/Http/Controllers/V3/SupplierPaymentController.php  │ 51   │ SupplierPaymentController:st │ current.tenant    │ Payment UUID │ DB::transact │ Controller│ No      │ Phase 2│ Yes  │ Require Appr│
│ 70 │ app/Observers/SaleObserver.php                         │ 116  │ SaleObserver:created         │ Sale tenant_id    │ Sale UUID    │ None         │ Observer  │ Yes (BYP)│ Phase 2│ Yes  │ Direct/Sync │
│ 71 │ app/Services/SmartCapture/TransactionBuilderService.php│ 352  │ TxBuilderService:buildSale   │ TenantContext     │ OCR Task ID  │ DB::transact │ Service   │ Yes      │ Phase 3│ Yes  │ Require Appr│
│ 72 │ app/Services/SmartCapture/TransactionBuilderService.php│ 525  │ TxBuilderService:buildBill   │ TenantContext     │ OCR Task ID  │ DB::transact │ Service   │ Yes      │ Phase 3│ Yes  │ Require Appr│
│ 73 │ app/Services/SmartCapture/TransactionBuilderService.php│ 731  │ TxBuilderService:buildExp    │ TenantContext     │ OCR Task ID  │ DB::transact │ Service   │ Yes      │ Phase 3│ Yes  │ Require Appr│
│ 74 │ app/Services/VenSynQ/MarketplaceSettlementService.php  │ 129  │ MarketplaceSettlement:order  │ Store tenant_id   │ Order Sync ID│ DB::transact │ Service   │ Yes      │ Phase 3│ No   │ Direct Post │
│ 75 │ app/Services/VenSynQ/MarketplaceSettlementService.php  │ 173  │ MarketplaceSettlement:fee    │ Store tenant_id   │ Order Sync ID│ DB::transact │ Service   │ Yes      │ Phase 3│ No   │ Direct Post │
│ 76 │ app/Services/VenSynQ/MarketplaceSettlementService.php  │ 252  │ MarketplaceSettlement:payout │ Store tenant_id   │ Payout ID    │ DB::transact │ Service   │ Yes      │ Phase 3│ No   │ Direct Post │
│ 77 │ app/Services/WooSync/WooOrderPoster.php                │ 128  │ WooOrderPoster:post          │ Store tenant_id   │ Woo Order ID │ DB::transact │ Service   │ Yes      │ Phase 3│ No   │ Direct Post │
└────┴────────────────────────────────────────────────────────┴──────┴──────────────────────────────┴───────────────────┴──────────────┴──────────────┴──────────┴──────────┴────────┴──────┴─────────────┘
```

---

## 5. Reproducible Role-Card Evidence & Dashboard Routing

To avoid unsupported estimates, the role-card matrix is verified deterministically:
1. **Controller-Response Inspection Artifact:** The CLI command `php artisan audit:role-cards` performs direct controller-response inspection by invoking `DashboardController::index()` across isolated authenticated roles within a transactional sandbox, recording the exact resolved component, legacy props, and preset key pipeline results into [`docs/approval-dashboard-audit-2026-09-22/evidence/role-card-audit.json`](file:///E:/AMD%20POS/AMD%20POS/app-code/main-app/docs/approval-dashboard-audit-2026-09-22/evidence/role-card-audit.json).
2. **Full Route & Middleware Dispatch Verification:** End-to-end HTTP request dispatch through Laravel's router and middleware stack is verified via [`tests/tests/Unit/Audit/RoleCardAuditTest.php`](file:///E:/AMD%20POS/AMD%20POS/app-code/main-app/tests/tests/Unit/Audit/RoleCardAuditTest.php).

### 5.1 Role Routing & Catalog Availability Matrix

```
┌────────────────────┬──────────────────────────────────────┬──────────────────────┬──────────────────────┬──────────────────────┬──────────────────────┬────────────────────────────────────────┐
│ Role               │ Resolved Dashboard Destination       │ Configured Route     │ Total Registry Keys  │ Available Keys       │ Gated Keys (Perm/Mod)│ Visible Catalog Cards (of 349 Total)   │
├────────────────────┼──────────────────────────────────────┼──────────────────────┼──────────────────────┼──────────────────────┼──────────────────────┼────────────────────────────────────────┤
│ 1. Owner           │ V6 Frame / Full Dashboard            │ /dashboard           │ 397 Registry Keys    │ 310 Available Keys   │ 87 Gated Keys        │ 349 / 349 Visible Cards (100% Catalog) │
│ 2. Admin           │ V6 Frame / Full Dashboard            │ /dashboard           │ 397 Registry Keys    │ 310 Available Keys   │ 87 Gated Keys        │ 349 / 349 Visible Cards (100% Catalog) │
│ 3. Manager         │ V6 Frame / Full Dashboard            │ /dashboard           │ 397 Registry Keys    │ 255 Available Keys   │ 142 Gated Keys       │ 288 / 349 Visible Cards (Ops/Sales/Inv)│
│ 4. Accountant      │ Dashboards/AccountantDashboard (Leg) │ /dashboard           │ 397 Registry Keys    │ 301 Available Keys   │ 96 Gated Keys        │ 341 / 349 Visible Cards (Financial/GL) │
│ 5. Purchasing      │ Dashboards/PurchasingDashboard (Leg) │ /dashboard           │ 397 Registry Keys    │ 82 Available Keys    │ 315 Gated Keys       │ 107 / 349 Visible Cards (Stock/Vendor) │
│ 6. Viewer          │ Dashboards/ViewerDashboard (Leg)     │ /dashboard           │ 397 Registry Keys    │ 298 Available Keys   │ 99 Gated Keys        │ 341 / 349 Visible Cards (Read-Only)    │
│ 7. Cashier         │ Dashboards/CashierDashboard (Leg)    │ /dashboard           │ 397 Registry Keys    │ 53 Available Keys    │ 344 Gated Keys       │ 74 / 349 Visible Cards (Shift Only)    │
└────────────────────┴──────────────────────────────────────┴──────────────────────┴──────────────────────┴──────────────────────┴──────────────────────┴────────────────────────────────────────┘
```

---

## 6. Incidental Fixes: Independent Disposition Record

```
┌──────────────────────────────────────────────┬───────────────────────────────────┬────────────────────────────────────────────────────────┬───────────────────┐
│ Incidental Change                            │ Root Defect                       │ Proposed Disposition & Evidence Location               │ Recommendation    │
├──────────────────────────────────────────────┼───────────────────────────────────┼────────────────────────────────────────────────────────┼───────────────────┤
│ 1. `SaleController::store()`                 │ Line 377 passed `$changeReturn`   │ Retain fix. Tested in `Batch1RegressionTest::`         │ ACCEPT            │
│    `$changeReturn` Initialization            │ in closure without initialization │ `test_incidental_change_return_calculation()`.         │                   │
│                                              │ throwing 500 error on checkouts.  │ Ensures zero 500 crashes on cash checkout.             │                   │
├──────────────────────────────────────────────┼───────────────────────────────────┼────────────────────────────────────────────────────────┼───────────────────┤
│ 2. `AbstractCardResolver`                    │ Unconfigured stores lacking COGS/ │ Retain fix. Surfaced as `ReckonerResult::empty()`      │ ACCEPT            │
│    `MissingFinancialAccountException`        │ Income accounts crashed dashboard │ with diagnostic reason code in result envelope.        │                   │
│    Handling                                  │ with unhandled 500 exception.     │ Prevents new tenant onboarding from breaking.          │                   │
├──────────────────────────────────────────────┼───────────────────────────────────┼────────────────────────────────────────────────────────┼───────────────────┤
│ 3. Migration `2026_08_11_000002`             │ MariaDB 10.4+ rejected `UUID NULL`│ Retain fix. Tested in `MigrationCompatibilityTest::`   │ ACCEPT            │
│    MariaDB Compatibility Fix                 │ in `ALTER TABLE ... MODIFY`.      │ `test_expenses_purchase_id_column_compatibility()`.    │                   │
│    (`CHAR(36) NULL`)                         │                                   │ Note: Does NOT claim to repair damaged `venqore_pos`.  │                   │
└──────────────────────────────────────────────┴───────────────────────────────────┴────────────────────────────────────────────────────────┴───────────────────┘
```

---

## 7. Comprehensive Test Suite Execution Evidence

All suites were executed strictly against `amd_pos_test` using `--env=testing`:

### 7.1 Batch 1 Regression & Audit Suites
```powershell
& "E:\Software\Xampp\php\php.exe" artisan test --env=testing tests/tests/Feature/Batch1RegressionTest.php tests/tests/Unit/Audit/
```
- **Tests Passed:** 13
- **Assertions:** 225
- **Failures:** 0
- **Skips:** 0
- **Duration:** 8.32s

### 7.2 Core Dashboard, Store Scoping & Golden Suites
```powershell
& "E:\Software\Xampp\php\php.exe" artisan test --env=testing tests/tests/Feature/Core/DashboardConsistencyTest.php tests/tests/Feature/Golden/DashboardOutputTest.php tests/tests/Feature/Module13/DashboardTest.php tests/tests/Feature/Hardening/StoreScopingHardeningTest.php
```
- **Tests Passed:** 28
- **Assertions:** 170
- **Failures:** 0
- **Skips:** 0
- **Duration:** 12.27s

### 7.3 Reckoner Unit Test Suite
```powershell
& "E:\Software\Xampp\php\php.exe" artisan test --env=testing tests/tests/Unit/Reckoner/
```
- **Tests Passed:** 125
- **Assertions:** 15,992
- **Failures:** 0
- **Skips:** 0
- **Duration:** 10.47s

### 7.4 Grand Total Verified Across Suites
- **Total Tests Executed:** **166**
- **Total Assertions:** **16,387**
- **Total Failures:** **0**
- **Total Skips:** **0**
