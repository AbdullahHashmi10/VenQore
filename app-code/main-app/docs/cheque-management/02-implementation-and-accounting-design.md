# Cheque Management System — Implementation & Accounting Design

**Date:** 2026-09-26  
**Status:** Approved for Implementation  
**Module:** Chequebooks & Cheque Management (`App\Services\Cheque`)

---

## 1. Architecture Overview

The Cheque Management module provides end-to-end governance over both **company-issued chequebooks** and **customer/third-party cheques received**. It is built on three core pillars:

1. **Strict Invariant Enforcement**: Multi-tenant isolation, database-enforced serial uniqueness per bank account, pessimistic row locking (`lockForUpdate()`) against double-spend/race conditions.
2. **Phase 1 Approval Workflow Seamless Integration**:
   - Maker submission of an outgoing cheque transaction in pending status **atomically reserves** the selected cheque leaf.
   - Pending transactions **never** create financial, payment, or allocation postings.
   - Reviewer approval atomically posts the financial transaction and promotes the leaf from `reserved` to `issued`.
   - Withdrawal or rejection immediately releases the reservation back to `available`.
   - Correction retains reservation if the cheque serial is unchanged; if changed, the previous leaf is released and the new one reserved atomically.
3. **Canonical Double-Entry Accounting**:
   - Canonical posting boundary preserved without creating shadow journal mechanisms.
   - Outgoing cheques draw on the company's real bank account.
   - Incoming cheques settle receivables/invoices to Cheques in Hand (`1020`) until deposited and cleared.
   - Bounces trigger idempotent reversals that reopen exact invoice/party balances and void allocations through `AccountingService::reverseEntry()`.

---

## 2. Database Schema Design

### 2.1 `cheque_books` Table

Tenant-scoped parent record for bank-issued chequebooks.

| Column | Type | Attributes / Index | Description |
|---|---|---|---|
| `id` | `uuid` | Primary Key | Project UUID convention |
| `tenant_id` | `unsignedBigInteger` | Index | Scoped to current store/tenant |
| `bank_account_id` | `uuid` | Index, FK → `bank_accounts.id` | Real bank account only (cannot be cash/wallet) |
| `book_number` | `string(100)` | Nullable | Bank's book identifier/reference |
| `prefix` | `string(20)` | Nullable | Alphabetic prefix (e.g. `CHQ-`, `PK`) |
| `serial_start` | `unsignedBigInteger` | Not Null | Starting serial number (numeric value) |
| `serial_end` | `unsignedBigInteger` | Not Null | Ending serial number (numeric value) |
| `serial_padding` | `unsignedSmallInteger` | Default `6` | Length to pad serial with leading zeroes |
| `total_leaves` | `unsignedInteger` | Not Null | `serial_end - serial_start + 1` (max 500 per book) |
| `received_date` | `date` | Not Null | Date chequebook was received from bank |
| `status` | `string(32)` | Default `'active'` | `'active'`, `'exhausted'`, `'closed'`, `'cancelled'` |
| `notes` | `text` | Nullable | Operator notes / bank dispatch details |
| `created_by` | `unsignedBigInteger` | Nullable | User ID of creator |
| `created_at` | `timestamp` | Nullable | |
| `updated_at` | `timestamp` | Nullable | |

**Indexes & Constraints**:
- `INDEX (tenant_id, bank_account_id, status)`
- Overlap detection rule: For the same `tenant_id` and `bank_account_id`, no two active/closed books may have overlapping `[serial_start, serial_end]` ranges with the same prefix.

---

### 2.2 `cheque_leaves` Table

Represents every individual leaf in a registered chequebook.

| Column | Type | Attributes / Index | Description |
|---|---|---|---|
| `id` | `uuid` | Primary Key | Project UUID convention |
| `tenant_id` | `unsignedBigInteger` | Index | Scoped to current store/tenant |
| `cheque_book_id` | `uuid` | Index, FK → `cheque_books.id` | Cascades on delete if no leaves used |
| `bank_account_id` | `uuid` | Index, FK → `bank_accounts.id` | Denormalized for fast filtering and uniqueness |
| `normalized_serial_number` | `string(64)` | Not Null | Normalized: alphanumeric uppercase, no whitespace |
| `display_serial_number` | `string(64)` | Not Null | Formatted serial (e.g., `PK-000101`) |
| `numeric_serial` | `unsignedBigInteger` | Not Null, Index | Pure numeric component for ordering |
| `status` | `string(32)` | Default `'available'` | `available`, `reserved`, `issued`, `cleared`, `bounced`, `stopped`, `void` |
| `reserved_by_approval_document_id` | `unsignedBigInteger` | Nullable, Index | Links to `approval_documents.id` when reserved |
| `payment_id` | `uuid` | Nullable, Index | Links to `payments.id` once issued |
| `party_id` | `uuid` | Nullable, Index | Payee (Supplier, Customer, or Party) |
| `amount` | `decimal(15,2)` | Nullable | Cheque monetary value when reserved/issued |
| `issue_date` | `date` | Nullable | Date cheque was handed over / issued |
| `cheque_date` | `date` | Nullable | Date written on cheque (supports post-dating) |
| `cleared_at` | `datetime` | Nullable | When bank statement clearing was verified |
| `bounced_at` | `datetime` | Nullable | When cheque bounced |
| `voided_at` | `datetime` | Nullable | When unused leaf was voided |
| `stopped_at` | `datetime` | Nullable | When issued leaf was stopped with the bank |
| `status_reason` | `text` | Nullable | Audit reason for void, stop, bounce |
| `created_by` | `unsignedBigInteger` | Nullable | Creator |
| `updated_by` | `unsignedBigInteger` | Nullable | Last modifier |
| `created_at` | `timestamp` | Nullable | |
| `updated_at` | `timestamp` | Nullable | |

**Indexes & Constraints**:
- `UNIQUE INDEX chq_leaves_tenant_bank_serial_unique (tenant_id, bank_account_id, normalized_serial_number)`: Guarantees at database level that the same cheque serial cannot exist twice for the same bank account under any circumstances.
- `INDEX (tenant_id, status)`
- `INDEX (tenant_id, bank_account_id, status)`

---

### 2.3 `received_cheques` Table

Represents customer, client, or third-party incoming cheques received by the business.

| Column | Type | Attributes / Index | Description |
|---|---|---|---|
| `id` | `uuid` | Primary Key | Project UUID convention |
| `tenant_id` | `unsignedBigInteger` | Index | Scoped to store |
| `party_id` | `uuid` | Nullable, Index | Customer or party who handed over the cheque |
| `payment_id` | `uuid` | Nullable, Index | `payments.id` if recorded via payment screen |
| `sale_id` | `uuid` | Nullable, Index | `sales.id` if received during POS/Invoice sale |
| `journal_entry_id` | `unsignedBigInteger` | Nullable, Index | Initial receipt journal entry |
| `deposit_journal_entry_id`| `unsignedBigInteger` | Nullable, Index | Clearing/deposit journal entry |
| `cheque_number` | `string(64)` | Not Null | Cheque number as written |
| `normalized_cheque_number`| `string(64)` | Not Null, Index | Normalized alphanumeric representation |
| `drawer_name` | `string(255)` | Nullable | Name of account holder who signed cheque |
| `drawer_bank` | `string(255)` | Nullable | Bank drawn upon (e.g. Standard Chartered) |
| `drawer_branch` | `string(255)` | Nullable | Branch name / code |
| `received_date` | `date` | Not Null | Date business took possession |
| `cheque_date` | `date` | Not Null | Date on cheque (may be post-dated) |
| `amount` | `decimal(15,2)` | Not Null | Monetary value |
| `deposit_bank_account_id` | `uuid` | Nullable, Index | Bank account where cheque is deposited |
| `status` | `string(32)` | Default `'received'` | `'received'`, `'deposited'`, `'cleared'`, `'bounced'`, `'returned'`, `'cancelled'` |
| `deposited_at` | `datetime` | Nullable | Timestamp of bank deposit |
| `cleared_at` | `datetime` | Nullable | Timestamp of clearing |
| `bounced_at` | `datetime` | Nullable | Timestamp of bounce |
| `returned_at` | `datetime` | Nullable | Timestamp of return to customer |
| `duplicate_fingerprint` | `string(64)` | Index | `sha256(tenant_id + normalized_number + bank + amount + date)` |
| `status_reason` | `text` | Nullable | Rejection, return, or bounce reason |
| `notes` | `text` | Nullable | Additional remarks |
| `created_by` | `unsignedBigInteger` | Nullable | Recording employee |
| `updated_by` | `unsignedBigInteger` | Nullable | Modifier employee |
| `created_at` | `timestamp` | Nullable | |
| `updated_at` | `timestamp` | Nullable | |

**Indexes & Constraints**:
- `INDEX (tenant_id, status)`
- `INDEX (tenant_id, duplicate_fingerprint)`
- `INDEX (tenant_id, party_id)`

---

## 3. Shared Domain Services

### 3.1 `ChequeNumberNormalizer`
- Strips non-alphanumeric characters, converts to uppercase, removes leading zeroes from numeric portion for matching, while retaining formatted display representation.
- Computes duplicate fingerprint for incoming cheques: `hash('sha256', tenant_id . '|' . normalized_serial . '|' . strtoupper(trim(drawer_bank)) . '|' . number_format(amount, 2, '.', ''))`.

### 3.2 `ChequeBookService`
- **`registerChequeBook(tenant, bankAccount, data, user)`**:
  - Validates `bank_account_id` belongs to tenant and is of type `'bank'` (rejects cash drawer and mobile wallets).
  - Validates `serial_start <= serial_end`.
  - Enforces safe upper bound (maximum 500 leaves per book to prevent memory exhaustion).
  - Checks range overlap with any existing chequebook on the same bank account.
  - Inserts `cheque_books` row.
  - Generates individual `cheque_leaves` rows with status `'available'`, padded display serial numbers, and normalized serials.
- **`closeChequeBook(chequeBook, user)`**:
  - Marks book as `'closed'`.
  - Checks if any unused leaves should be auto-voided or retained.
- **`getNextAvailableLeaf(bankAccountId, tenant)`**:
  - Selects lowest numeric serial with `status = 'available'`.

### 3.3 `ChequeLifecycleService`
- **`reserveForApproval(tenant, bankAccountId, leafId, approvalDocId, amount, partyId, chequeDate, user)`**:
  - Runs in DB transaction with `lockForUpdate()`.
  - Ensures leaf status is `'available'`.
  - Updates `status = 'reserved'`, `reserved_by_approval_document_id = $approvalDocId`, `amount`, `party_id`, `cheque_date`.
- **`releaseReservation(approvalDocId, reason, user)`**:
  - Runs in DB transaction.
  - Finds leaf by `reserved_by_approval_document_id = $approvalDocId`.
  - Sets `status = 'available'`, clears `reserved_by_approval_document_id`, `amount`, `party_id`, `cheque_date`.
- **`issueCheque(tenant, leafId, paymentId, amount, partyId, issueDate, chequeDate, user)`**:
  - Runs in DB transaction with `lockForUpdate()`.
  - Validates leaf is in `'available'` or `'reserved'` (by the specific approved document).
  - Sets `status = 'issued'`, `payment_id = $paymentId`, `issue_date = $issueDate`, `cheque_date = $chequeDate`.
- **`clearIssuedCheque(leaf, clearedAt, user)`**:
  - Transitions leaf from `'issued'` to `'cleared'`.
- **`bounceIssuedCheque(leaf, reason, user)`**:
  - Transitions leaf from `'issued'` to `'bounced'`.
  - Triggers accounting reversal of the payment if applicable.
- **`stopCheque(leaf, reason, user)`**:
  - Transitions leaf from `'issued'` to `'stopped'`.
  - Flags payment and reverses financial effect.
- **`voidUnusedCheque(leaf, reason, user)`**:
  - Transitions leaf from `'available'` to `'void'`. Unused leaves can never be re-issued.

### 3.4 `ChequeDuplicateService`
- Analyzes incoming cheques for exact matches (same tenant, cheque number, drawer bank, amount).
- Flags soft matches (same cheque number for same customer on different date) with warning requires user confirmation.

---

## 4. State Transitions & Invariants

### 4.1 Cheque Leaf State Machine
```
[available]
    │
    ├── (Pending Approval) ─────────> [reserved]
    │                                     │
    │         (Reject / Withdraw)         │
    │ <───────────────────────────────────┘
    │                                     │
    │                                (Approved)
    │                                     ▼
    ├── (Direct Payment) ───────────> [issued] ─── (Bank Clears) ───> [cleared]
    │                                     │
    │                                     ├─── (Bank Dishonors) ─> [bounced]
    │                                     │
    │                                     └─── (Stop Payment) ───> [stopped]
    │
    └── (Void Before Use) ──────────> [void]
```

**Permitted Transitions**:
- `available` → `reserved` (Maker submits document requiring approval)
- `available` → `issued` (Direct payment posting when approval not required)
- `available` → `void` (Manager voids leaf due to physical damage/destruction)
- `reserved` → `available` (Maker withdraws document or Reviewer rejects)
- `reserved` → `issued` (Reviewer approves document; posts financial transaction)
- `issued` → `cleared` (Reconciliation confirms cheque cleared by bank)
- `issued` → `bounced` (Bank dishonors company cheque)
- `issued` → `stopped` (Company instructs bank to stop payment)

**Strict Prohibitions**:
- Once `issued`, `cleared`, `bounced`, `stopped`, or `void`, a leaf can **never** return to `available` or `reserved`.
- A leaf can never be deleted if it has an audit trail, approval link, or payment reference.

---

### 4.2 Received Cheque State Machine
```
[received] ──> [deposited] ──> [cleared]
    │               │
    │               ├──> [bounced]
    │               └──> [returned]
    └──> [cancelled]
```

---

## 5. Accounting Entries & Canonical Posting Boundary

Every ledger post is routed through `App\Engines\AccountingService`.

### 5.1 Outgoing Cheque (Company Paying Supplier or Expense)
1. **Upon Issuance (Direct or Approved)**:
   - Supplier Payment:
     - **DR** `2000` Accounts Payable (Supplier debt decreases)
     - **CR** `1010` Bank Account (or Bank Subledger)
     - *Record:* `cheque_leaves.status = 'issued'`.
   - Operating Expense:
     - **DR** `6000` Operating Expense
     - **CR** `1010` Bank Account
     - *Record:* `cheque_leaves.status = 'issued'`.
   - Customer Refund:
     - **DR** `1200` Accounts Receivable (Clears customer credit)
     - **CR** `1010` Bank Account
     - *Record:* `cheque_leaves.status = 'issued'`.
2. **Upon Clearing**:
   - Leaf marked `'cleared'`, `cleared_at` recorded. No additional P&L or AP entry needed as the original entry already credited the bank ledger.
3. **Upon Bouncing / Stop Payment**:
   - Reverses the original entry via `AccountingService::reverseEntry()`:
     - **DR** `1010` Bank Account
     - **CR** `2000` Accounts Payable / `6000` Expense / `1200` AR
   - Leaf marked `'bounced'` or `'stopped'`.
   - Supplier bill / customer balance reopened.

### 5.2 Incoming Cheque (Customer Paying Invoice)
1. **Upon Receipt (`POST /sales` or `POST /payments`)**:
   - **DR** `1020` Cheques in Hand (Current Asset)
   - **CR** `1200` Accounts Receivable (or Revenue if POS cash-equivalent sale)
   - *Record:* `received_cheques.status = 'received'`.
2. **Upon Bank Deposit (`POST /received-cheques/{id}/deposit`)**:
   - **DR** `1010` Bank Account (Selected bank)
   - **CR** `1020` Cheques in Hand
   - *Record:* `received_cheques.status = 'deposited'`, `deposit_bank_account_id`.
3. **Upon Clearing (`POST /received-cheques/{id}/clear`)**:
   - *Record:* `received_cheques.status = 'cleared'`, `cleared_at`.
4. **Upon Bouncing (`POST /received-cheques/{id}/bounce`)**:
   - Reverse the deposit entry (if deposited) and reverse the original receipt entry via `AccountingService::reverseEntry()`:
     - **DR** `1200` Accounts Receivable (Invoice reopened)
     - **CR** `1010` Bank Account (if deposited) or `1020` Cheques in Hand (if un-deposited)
   - Rebuilds payment badges on the original sale invoice via `PaymentService::updatePaymentBadge()`.
   - Idempotent and auditable.

---

## 6. Permissions & Role Matrix

| Permission Key | Description | Default Roles Granted |
|---|---|---|
| `finance.cheque_books.view` | View chequebooks, leaves, and registers | `owner`, `admin`, `accountant`, `manager` |
| `finance.cheque_books.manage` | Register, edit, close chequebooks, void leaves | `owner`, `admin` |
| `finance.cheques.clear` | Mark cheques as cleared, deposited, or bounced | `owner`, `admin`, `accountant` |

*Note:* Creating a payment or expense that issues a cheque still requires the respective transaction authority (`finance.send_payment`, `finance.expenses`, `finance.customer_refund`). Cheque management permissions do not grant general financial posting privileges.

---

## 7. Reckoner V6 Metrics & Dashboard Readings

1. `cheque.available_leaves` — Count of leaves with status `available` across active chequebooks.
2. `cheque.reserved_approvals` — Count of leaves locked in `reserved` status awaiting approval review.
3. `cheque.issued_uncleared` — Total amount of issued cheques not yet marked cleared.
4. `cheque.post_dated_due` — Cheques dated in the future maturing within the next 7 days.
5. `cheque.received_undeposited` — Customer cheques in hand awaiting bank deposit.
6. `cheque.deposited_uncleared` — Deposited customer cheques awaiting realization.
7. `cheque.bounced_action_needed` — Cheques dishonored requiring collection or follow-up.

---
*Design verified and aligned with VenQore Phase 1 approvals and canonical accounting engine.*
