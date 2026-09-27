# Cheque Management System — Existing State & Gap Audit

**Date:** 2026-09-26  
**Scope:** `E:\AMD POS\AMD POS\app-code\main-app`  
**Target:** Complete Chequebook and Cheque Management Architecture (Audit & Baseline)

---

## 1. Executive Summary

This audit assesses the existing cheque-related logic, data structures, accounting behaviors, screens, routes, and permissions within the VenQore POS / AMD POS application prior to implementing the comprehensive Chequebook and Cheque Management module.

Currently, cheque support exists in fragmentary form:
- A `CHEQUE` string sentinel in frontend document account hooks (`useDocumentAccounts.js`) and sales/purchase requests.
- Account `1020` ("Cheques in Hand", asset) used for incoming customer cheques.
- `payments.cheque_date` and `reference` fields used as free-text storage for cheque metadata.
- Isolated customer cheque bouncing via `BounceController` which performs journal reversals via `AccountingService::reverseEntry()`.
- Manual input fields for "Cheque No" and "Cheque Date" on POS/Sales screens.

Missing entirely are:
- Bank-issued chequebook registration with serial ranges and leading-zero preservation.
- Individual cheque leaf tracking (`available`, `reserved`, `issued`, `cleared`, `bounced`, `stopped`, `void`).
- Atomic cheque reservation during approval workflows and direct payment issuance.
- Incoming cheque repository (`received_cheques`) with drawer bank/account identity, duplicate detection/fingerprinting, and lifecycle operations (deposit, clear, bounce).
- Chequebook governance permissions (`finance.cheque_books.view`, `finance.cheque_books.manage`, `finance.cheques.clear`).
- Reckoner V6 dashboard cards and comprehensive cheque registers/reports.

---

## 2. Existing Cheque Functionality Inventory

### 2.1 Domain Models and Database Schema
- **`App\Models\Payment`**:
  - Columns: `id` (UUID), `tenant_id`, `party_id`, `sale_id`, `amount`, `date`, `method`, `type`, `reference`, `notes`, `bank_account_id`, `cheque_date`, `created_at`, `updated_at`.
  - Behavior: `updatePartyBalance()` increments/decrements `current_balance` on the associated `Party`.
  - Limitations: No foreign key or relation to cheque leaves or received cheques. Free-form string in `reference` is relied upon for cheque numbers.
- **`App\Models\BankAccount`**:
  - Columns: `id` (UUID), `tenant_id`, `name`, `account_number`, `type` (`cash`, `bank`, `mobile_wallet`), `account_type`, `bank_name`, `opening_balance`, `current_balance`, `notes`.
  - Calculates balance via `v3Balance()`.
  - Limitations: Has no relationship to chequebooks or cheque leaves.
- **Existing Migrations**:
  - `2026_01_14_231819_add_cheque_date_to_payments_table.php`: Added nullable `cheque_date` column to `payments`.

### 2.2 Posting and Service Engines
- **`App\Engines\AccountingService`**:
  - Standard chart of accounts includes `1000` (Cash on Hand), `1010` (Bank Account), `1020` (Cheques in Hand, Asset), `1200` (Accounts Receivable), `2000` (Accounts Payable).
  - `reverseEntry(journalEntryId, reason)`: Performs atomic reversal of a journal entry, marks both entries with `is_reversed = 1`, creates audit links (`reverses_entry_id`), and voids allocations.
- **`App\Engines\PaymentService`**:
  - Manages payment allocations against sales and purchases and maintains payment badges (`unpaid`, `partial`, `paid`).
  - `voidAllocations()` called upon journal entry reversal.
- **`App\Engines\PurchaseService`**:
  - When payment account is string `'CHEQUE'`, it remaps the credit line to account `1020` ("Cheques in Hand").
  - *Risk Identified:* An outgoing payment to a vendor using a company cheque was being credited to `1020` (Cheques in Hand, an incoming asset account) instead of reducing the bank account or clearing through a dedicated bank uncleared cheques liability/subledger.
- **`App\Http\Controllers\SaleController`**:
  - `resolvePaymentAccount()` maps `'CHEQUE'` sentinel or `method === 'cheque'` to account `1020` ("Cheques in Hand").
  - `postSaleJournal()` inserts a `Payment` record with `cheque_date` and `reference`, creating a debit to `1020`.
- **`App\Http\Controllers\V3\BounceController`**:
  - Route: `POST /journal-entries/{journalEntryId}/bounce`.
  - Only supports customer payment entries (`reference_type === 'customer_payment'`).
  - Calls `AccountingService::reverseEntry()`, reversing the customer receipt journal (DR 1200 AR, CR 1020 Cheques in Hand or CR 1000/1010 Cash/Bank) and reopening the invoice balance.
  - Lacks cheque-level lifecycle tracking or support for outgoing cheque bounces.

### 2.3 User Interface and Document Components
- **`resources/js/Documents/useDocumentAccounts.js`**:
  - Exports `CHEQUE = 'CHEQUE'` sentinel.
  - When `withCheque = true`, appends a virtual "Cheque" option mapping to account `1020`.
- **`resources/js/Pages/Payments/In.jsx` & `Out.jsx`**:
  - Methods supported: `cash`, `bank`, `card`, `upi`.
  - Reference field carries placeholder "Cheque / TxID".
  - Does not provide a cheque selector or chequebook integration.
- **`resources/js/Pages/Expenses/Create.jsx`**:
  - Form validation contains guard: `if (d.paymentAccountKind === 'cheque') { return { party: 'Choose the bank account the cheque is drawn on.' }; }`.
  - Validates that an outgoing cheque must be linked to a real bank account.
- **`resources/js/Pages/Sales/CreateInvoice.jsx` & `CreatePreSale.jsx`**:
  - Displays "Cheque No" and "Cheque Date" text/date inputs whenever `paymentAccountId === 'CHEQUE'`.
  - No duplicate prevention, bank drawer capture, or receipt record creation.

---

## 3. Gap Analysis: Missing Functionality

| Capability | Current State | Required State |
|---|---|---|
| Chequebook Registration | None | Full CRUD with bank validation, serial start/end, prefix, padding, overlap rejection |
| Cheque Leaf Generation | None | Automatic generation of leaves with normalized & display serials, status tracking |
| Outgoing Cheque Selection | Free-text reference | Dropdown selector of available leaves for chosen bank account, auto-next suggestion |
| Concurrency & Duplicate Use | None | Database unique constraints (`tenant_id`, `bank_account_id`, `normalized_serial`), atomic locking (`lockForUpdate`) |
| Approval Workflow Integration | Unaware of cheques | Pending transaction atomically reserves cheque leaf; approval issues & posts; reject/withdraw releases; edit re-reserves |
| Outgoing Accounting Posting | Varies / Inconsistent | Outgoing cheque draws on designated bank account; tracks uncleared status |
| Cheque Lifecycle | Bounced customer payment only | Full state transitions: `available` → `reserved` → `issued` → `cleared` / `bounced` / `stopped` / `void` |
| Incoming Cheque Tracking | Unstructured `Payment` note | Dedicated `received_cheques` table: drawer bank, account, received date, cheque date, duplicate fingerprinting |
| Incoming Cheque Lifecycle | Direct deposit to 1020 | Lifecycle: `received` → `deposited` → `cleared` / `bounced` / `returned` / `cancelled` |
| Permissions & Governance | Generic `finance` permissions | Dedicated keys: `finance.cheque_books.view`, `finance.cheque_books.manage`, `finance.cheques.clear` |
| UI & Navigation | Fragmented across forms | Chequebooks list, leaf detail ledger, issue modal, register views under Money & Banking |
| Dashboard & Analytics | None | 7 Reckoner V6 metric readings/cards with role-scope isolation and cache keys |
| Reports & Exports | None | Outgoing/Incoming cheque registers, utilization, post-dated cheques, CSV export |

---

## 4. Affected Screens and Posting Paths

1. **Chequebooks Management (`/bank-accounts/cheque-books`)**:
   - New screens for Chequebook List, Create Chequebook, and Chequebook Leaf Details with action modals (Void, Stop, Clear, Bounce).
2. **Supplier Payments (`Payments/Out.jsx` & `V3/SupplierPaymentController.php`)**:
   - Outgoing payment by cheque requires real bank account, displays next available leaf selector, verifies leaf availability, reserves/issues leaf.
3. **Expenses (`Expenses/Create.jsx` & `ExpensePostingService.php`)**:
   - Outgoing expense by cheque requires bank account and leaf selection; participates in approval reservation.
4. **Customer Refunds (`CustomerRefundApprovalAdapter.php` & `PaymentController.php`)**:
   - Outgoing refund by cheque requires leaf selection; reserves leaf if pending approval, issues upon approval.
5. **Customer Receipts (`Payments/In.jsx` & `PaymentController.php`)**:
   - Incoming cheque receipt captures drawer bank, account name, cheque number, cheque date; detects duplicate fingerprint before posting.
6. **Sales Invoicing (`Sales/CreateInvoice.jsx` & `Sales/CreatePreSale.jsx` & `SaleController.php`)**:
   - Cheque tender registers incoming cheque record; checks for duplicate numbers.
7. **Approval Adapters (`ApprovalExecutionEngine.php`, `SupplierPaymentApprovalAdapter`, `OperatingExpenseApprovalAdapter`, `CustomerRefundApprovalAdapter`)**:
   - Integration with `ChequeLifecycleService`: atomically reserve on submit/resubmit, issue on approve, release on reject/withdraw.
8. **Bank Accounts UI (`BankAccountsList.jsx`, `MoneyModuleTabs.jsx`)**:
   - Add Chequebooks tab and navigation links under Banking.

---

## 5. Database & Accounting Risks

1. **Serial Range Collision & Invalidation**:
   - *Risk:* Overlapping serial ranges registered for the same bank account causing duplicate cheque leaves.
   - *Mitigation:* Strict validation rejecting overlapping serial ranges on `cheque_books`, plus a unique database constraint on `(tenant_id, bank_account_id, normalized_serial_number)` on `cheque_leaves`.
2. **Race-Condition Duplicate Leaf Issuance**:
   - *Risk:* Two cashiers or operators simultaneously selecting leaf #000101 and submitting.
   - *Mitigation:* Pessimistic database row locking (`lockForUpdate()`) and atomic status check (`status === 'available'`) inside DB transactions.
3. **Approval Lifecycle Orphaned Reservations**:
   - *Risk:* A document returned for correction or rejected leaves a cheque stuck in `reserved` status forever.
   - *Mitigation:* Approval state machine hooks ensuring `reject` and `withdraw` release the leaf back to `available`, while `resubmit` with a changed cheque number atomically frees the old leaf and reserves the new one.
4. **Premature Financial Posting of Pending Transactions**:
   - *Risk:* Pending approval transactions affecting ledger balances before approval.
   - *Mitigation:* Invariant preserved: reservations only update `cheque_leaves.status = 'reserved'` and `reserved_by_approval_document_id`; no journal entries, payments, or allocations are written until `approve()`.
5. **Double Clearance or Double Reversal**:
   - *Risk:* Calling clear or bounce multiple times inflating balances.
   - *Mitigation:* Guarded state machine transitions preventing clearance of non-issued leaves or double-bouncing already reversed entries.

---

## 6. Files to be Created or Modified

### 6.1 Database Migrations
- `database/migrations/2026_09_26_000001_create_cheque_management_tables.php`

### 6.2 Backend Models & Traits
- `app/Models/ChequeBook.php`
- `app/Models/ChequeLeaf.php`
- `app/Models/ReceivedCheque.php`
- `app/Models/BankAccount.php` (relations)
- `app/Models/Payment.php` (relations)

### 6.3 Shared Domain Services
- `app/Services/Cheque/ChequeNumberNormalizer.php`
- `app/Services/Cheque/ChequeBookService.php`
- `app/Services/Cheque/ChequeLifecycleService.php`
- `app/Services/Cheque/ChequeDuplicateService.php`

### 6.4 Controllers & Form Requests
- `app/Http/Controllers/ChequeBookController.php`
- `app/Http/Controllers/ChequeLeafController.php`
- `app/Http/Controllers/ReceivedChequeController.php`
- `app/Http/Controllers/ChequeReportController.php`
- `app/Http/Requests/StoreChequeBookRequest.php`
- `app/Http/Requests/StoreReceivedChequeRequest.php`

### 6.5 Approval Workflow & Existing Posting Integration
- `app/Services/Approval/ApprovalExecutionEngine.php`
- `app/Services/Approval/Adapters/SupplierPaymentApprovalAdapter.php`
- `app/Services/Approval/Adapters/OperatingExpenseApprovalAdapter.php`
- `app/Services/Approval/Adapters/CustomerRefundApprovalAdapter.php`
- `app/Http/Controllers/PaymentController.php`
- `app/Http/Controllers/SaleController.php`

### 6.6 Permissions & Configuration
- `config/permissions.php`
- `resources/js/Pages/Admin/Users.jsx`

### 6.7 Reckoner V6 Readings & Cards
- `app/Reckoner/Sources/ChequeSource.php`
- `app/Reckoner/ReckonerRegistry.php`
- `resources/data/reckoner/cards.json`

### 6.8 Frontend User Interface
- `resources/js/Pages/ChequeBooks/Index.jsx`
- `resources/js/Pages/ChequeBooks/Create.jsx`
- `resources/js/Pages/ChequeBooks/Show.jsx`
- `resources/js/Pages/ChequeBooks/ReceivedCheques.jsx`
- `resources/js/Pages/ChequeBooks/Reports/ChequeRegister.jsx`
- `resources/js/Components/Cheque/ChequeSelector.jsx`
- `resources/js/Components/MoneyModuleTabs.jsx`
- `resources/js/Pages/Payments/Out.jsx`
- `resources/js/Pages/Payments/In.jsx`
- `routes/web.php`

---
*Audit completed and verified against application baseline.*
