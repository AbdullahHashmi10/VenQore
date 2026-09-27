# Phase 1 Approval Release — Final Delivery Report

**Date:** 2026-09-23  
**Status:** All tasks complete. Changes are uncommitted and reviewable on the working tree.

---

## 1. Summary of What Was Built

Phase 1 adds seven new approval adapters that extend the existing `ApprovalAdapterInterface` pattern, wires them into `ApprovalExecutionEngine`, registers seven new permission keys, propagates those keys through the entire stack from `config/permissions.php` down to the staff-permissions UI in `Users.jsx`, and connects all Phase 1 transaction controllers to the approval interception flow.

---

## 2. Changed Files

### New files (7 active adapters + 1 deprecated shell)

| File | Document type | GL logic / delegate |
|---|---|---|
| `app/Services/Approval/Adapters/CustomerRefundApprovalAdapter.php` | *(deprecated — see note)* | File exists as a deprecation notice; NOT registered in engine or SUPPORTED_TYPES |
| `app/Services/Approval/Adapters/SupplierRefundApprovalAdapter.php` | `supplier_refund` | DR 1000/1010, CR 2000 AP; advances debit note to `refunded` |
| `app/Services/Approval/Adapters/PurchasePostingApprovalAdapter.php` | `purchase_posting` | Delegates to `V3\PurchaseService::store()` |
| `app/Services/Approval/Adapters/SalesReturnApprovalAdapter.php` | `sales_return` | Dispatches on `_path`: full/partial/legacy_sret/pos_return |
| `app/Services/Approval/Adapters/PurchaseReturnApprovalAdapter.php` | `purchase_return` | Delegates to `EnginePurchaseService::createReturn()` |
| `app/Services/Approval/Adapters/CapitalInjectionApprovalAdapter.php` | `capital_injection` | DR 1000/1010, CR 3000 Owner's Capital |
| `app/Services/Approval/Adapters/OwnerDrawingsApprovalAdapter.php` | `owner_drawings` | DR 3100 Drawings, CR 1000/1010 |
| `app/Services/Approval/Adapters/FundTransferApprovalAdapter.php` | `fund_transfer` | DR dest account, CR source account; covers cash<->bank and bank<->bank |

**Note on CustomerRefundApprovalAdapter:** A standalone customer-refund adapter was drafted but found to be architecturally wrong — a customer refund is the refund leg of a sales return and is already posted atomically by `SaleReversalService::reverse()` inside `TYPE_SALES_RETURN`. A separate `TYPE_CUSTOMER_REFUND` document would double-post. The constant `TYPE_CUSTOMER_REFUND` is retained on `ApprovalDocument` for read-compatibility but is excluded from `SUPPORTED_TYPES` and is not registered in the engine. The `finance.customer_refund` permission controls who may approve sales returns with a refund component (declared in `SalesReturnApprovalAdapter::reviewerEligibilityPermissions()`).

### New extraction services

| File | Purpose |
|---|---|
| `app/Services/LegacySalesReturnService.php` | Extracts posting logic from `ReturnController::store()` — `validateCaps()` + `process()` |
| `app/Services/PosReturnService.php` | Extracts posting logic from `PosReturnController::store()` — idempotent `process()` |

### Modified files — adapters + engine

| File | What changed |
|---|---|
| `app/Models/ApprovalDocument.php` | Added 8 new `TYPE_*` constants (1 deprecated, 7 active); `SUPPORTED_TYPES` expanded from 4 to 11 entries |
| `app/Services/Approval/ApprovalExecutionEngine.php` | Added 7 use-imports, 7 constructor parameters, 7 `$this->adapters` mappings; TYPE_CUSTOMER_REFUND intentionally excluded |

### Modified files — controllers (approval interception)

| File | Where interception was inserted |
|---|---|
| `app/Http/Controllers/SaleController.php` | `returnSale()` — before the try/DB::transaction block |
| `app/Http/Controllers/ReturnController.php` | `store()` — between `$request->validate()` and the old try block; old block is now unreachable dead code |
| `app/Http/Controllers/PosReturnController.php` | `store()` — after tenant scope check; old lock/transaction block is now unreachable dead code |
| `app/Http/Controllers/DebitNoteController.php` | `post()` — between `$validated` assignment and `DB::transaction` |
| `app/Http/Controllers/V3/PurchaseReturnController.php` | `store()` — before `$this->purchaseService->createReturn()` |
| `app/Http/Controllers/V3/PurchaseController.php` | `store()` — before `$this->purchaseService->store()` |
| `app/Http/Controllers/V3/FundController.php` | `store()` — direction gate (drawings vs injection) first, then policy resolver -> engine submit if required -> PIN verify -> direct GL post |
| `app/Http/Controllers/V3/SaleReturnController.php` | `store()` — policy resolver -> engine submit if required -> direct call to `$this->sales->reverse()` |

### Modified files — settings UI

| File | What changed |
|---|---|
| `resources/js/Pages/Settings/SettingsPanel.jsx` | Added 14 state initializers, 14 formattedSettings entries, and 7 per-document approval policy cards for the new Phase 1 document types (supplier_refund, purchase_posting, sales_return, purchase_return, capital_injection, owner_drawings, fund_transfer); capital/drawings/transfer cards marked as sensitive |

### Modified files — permissions UI

| File | What changed |
|---|---|
| `app/Http/Controllers/StaffInvitationController.php` | Fixed role validation at line 195 — now includes all 19 real roles + 2 legacy ghost roles |
| `app/Http/Controllers/AdminController.php` | Fixed role validation at line 576 — same full role list |
| `resources/js/Pages/Admin/Users.jsx` | Added 7 new permission keys to `ROLE_PERMISSIONS` (admin + manager); added 7 UI entries to `PERMISSION_CATEGORIES` |

### Pre-existing files confirmed correct (no change needed)

| File | Why relevant |
|---|---|
| `config/permissions.php` | Already had all 7 new keys defined for all appropriate roles (see matrix below) |

---

## 3. Seven New Permission Keys

| Key | Who gets it by default | Purpose |
|---|---|---|
| `finance.customer_refund` | owner, admin, franchise_admin | Approve/review sales returns that include a cash/bank refund to a customer |
| `finance.supplier_refund` | owner, admin, franchise_admin | Receive/post supplier refund (debit note posted) |
| `purchases.returns` | owner, admin, franchise_admin, manager, purchasing_officer | Approve purchase return |
| `finance.capital_add` | owner, admin | Record capital injection |
| `finance.owner_drawings` | owner, admin | Record owner drawings |
| `finance.internal_transfer` | owner, admin | Transfer between cash/bank accounts |
| `approvals.configure` | owner, admin, franchise_admin | Enable/disable approval workflows, set thresholds |

---

## 4. Approval Document Types — Complete Roster (11 active, 1 deprecated constant)

| # | Type constant | Document type | Adapter | Status |
|---|---|---|---|---|
| 1 | `TYPE_CUSTOMER_RECEIPT` | `customer_receipt` | `CustomerReceiptApprovalAdapter` | pre-existing |
| 2 | `TYPE_SUPPLIER_PAYMENT` | `supplier_payment` | `SupplierPaymentApprovalAdapter` | pre-existing |
| 3 | `TYPE_SALES_INVOICE` | `sales_invoice` | `SalesInvoiceApprovalAdapter` | pre-existing |
| 4 | `TYPE_OPERATING_EXPENSE` | `operating_expense` | `OperatingExpenseApprovalAdapter` | pre-existing |
| — | `TYPE_CUSTOMER_REFUND` | *(embedded in sales_return)* | *(not registered)* | deprecated constant |
| 5 | `TYPE_SUPPLIER_REFUND` | `supplier_refund` | `SupplierRefundApprovalAdapter` | new |
| 6 | `TYPE_PURCHASE_POSTING` | `purchase_posting` | `PurchasePostingApprovalAdapter` | new |
| 7 | `TYPE_SALES_RETURN` | `sales_return` | `SalesReturnApprovalAdapter` | new |
| 8 | `TYPE_PURCHASE_RETURN` | `purchase_return` | `PurchaseReturnApprovalAdapter` | new |
| 9 | `TYPE_CAPITAL_INJECTION` | `capital_injection` | `CapitalInjectionApprovalAdapter` | new |
| 10 | `TYPE_OWNER_DRAWINGS` | `owner_drawings` | `OwnerDrawingsApprovalAdapter` | new |
| 11 | `TYPE_FUND_TRANSFER` | `fund_transfer` | `FundTransferApprovalAdapter` | new |

---

## 5. Role-by-Key Matrix (Phase 1 keys)

| Role | finance.customer_refund | finance.supplier_refund | purchases.returns | finance.capital_add | finance.owner_drawings | finance.internal_transfer | approvals.configure |
|---|---|---|---|---|---|---|---|
| owner | Y | Y | Y | Y | Y | Y | Y |
| admin | Y | Y | Y | Y | Y | Y | Y |
| franchise_admin | Y | Y | Y | N | N | N | Y |
| manager | N | N | Y | N | N | N | N |
| accountant | N | N | N | N | N | N | N |
| purchasing_officer | N | N | Y | N | N | N | N |
| all others | N | N | N | N | N | N | N |

Rationale for manager/accountant on refunds: The locked design decision (doc 30) treats customer and supplier refunds as a finance authority that sits above store operations management.

---

## 6. Architecture Invariants Upheld

- Single GL entry point: all adapters call only AccountingService::createEntry()
- Single purchase engine: PurchasePostingApprovalAdapter delegates to V3\PurchaseService::store(); PurchaseReturnApprovalAdapter delegates to EnginePurchaseService::createReturn()
- Single sale reversal path: SalesReturnApprovalAdapter dispatches to SaleReversalService::reverse() (full), SaleService::reverse() (partial), LegacySalesReturnService::process() (legacy SRET), or PosReturnService::process() (POS return)
- Tenant isolation: every adapter scopes bank accounts, purchases, sales, parties, and items with ->where('tenant_id', $tenant->id)
- No stored paid_amount: SupplierRefundApprovalAdapter avoids writing paid_amount; it advances debit note status and calls PaymentService::updatePurchaseBadge()
- CanonicalPostingScope::run(): all post() methods are called inside the scope's DB transaction by the engine
- ReviewerEligibilityPermissions: every adapter declares the permission(s) a reviewer must hold, enforced by assertReviewerEligible() in the engine
- Controller approval interception: all 8 Phase 1 transaction controllers now intercept at the point of posting

---

## 7. Verifications Run

All checks passed (verified by grep/file inspection; PHP tests pending PHP interpreter access):

- All 7 active adapter files present in app/Services/Approval/Adapters/
- ApprovalDocument::SUPPORTED_TYPES has 11 entries (TYPE_CUSTOMER_REFUND excluded)
- ApprovalExecutionEngine imports and registers all 11 adapters
- config/permissions.php defines all 7 new keys with correct role grants
- manager gets only purchases.returns; NOT finance.customer_refund or finance.supplier_refund
- accountant gets no Phase 1 keys
- franchise_admin gets refunds + returns but NOT capital/drawings/transfer
- Users.jsx ROLE_PERMISSIONS.admin has all 7 new keys
- Users.jsx ROLE_PERMISSIONS.manager has purchases.returns only
- Users.jsx PERMISSION_CATEGORIES.purchasing_suppliers has purchases.returns
- Users.jsx PERMISSION_CATEGORIES.money_finance has 5 new finance.* entries
- Users.jsx PERMISSION_CATEGORIES.store_admin has approvals.configure
- StaffInvitationController role list includes all 19 real + 2 ghost roles
- AdminController role list includes all 19 real + 2 ghost roles
- SaleController.returnSale() intercepted before try/transaction
- ReturnController.store() intercepted; old posting block unreachable
- PosReturnController.store() intercepted; old lock/transaction unreachable
- DebitNoteController.post() intercepted before DB::transaction
- V3/PurchaseReturnController.store() intercepted before createReturn()
- V3/PurchaseController.store() intercepted before purchaseService->store()
- LegacySalesReturnService::validateCaps() + ::process() created
- PosReturnService::process() created with idempotency handling
- V3/FundController.store() direction gate + policy resolver + engine submit or PIN+direct post
- V3/SaleReturnController.store() intercepted before $this->sales->reverse()
- SettingsPanel.jsx has 14 state keys (lines 117-130), 14 formattedSettings (lines 180-193), 7 JSX policy cards (lines 810-816)
- Phase1ScenariosTest.php written — 556 lines, 9 test groups
- Show.jsx correction/resubmit/withdraw UI confirmed — 715 lines

---

## 8. Items Not In This Release (deferred)

- HTTP controller endpoints for the 7 active new document types (routes + request classes)
- Frontend submission forms for the 7 new document types
- PermissionBypassGuardTest ratchet update (once the new submission routes exist)
- php artisan ziggy:generate (after route additions)
- Full test suite execution (Phase1ScenariosTest.php needs PHP interpreter)

Items originally deferred that are now complete:
- Phase1ScenariosTest.php — 556 lines written (9 test groups)
- Correction/resubmit screens — Show.jsx (715 lines) confirmed complete
- Approval settings UI — SettingsPanel.jsx cards for all 7 new document types complete
- V3/FundController approval interception added
- V3/SaleReturnController approval interception added

---

## 9. How to Commit (when ready)

git add \
  app/Models/ApprovalDocument.php \
  app/Services/Approval/ApprovalExecutionEngine.php \
  app/Services/Approval/Adapters/CustomerRefundApprovalAdapter.php \
  app/Services/Approval/Adapters/SupplierRefundApprovalAdapter.php \
  app/Services/Approval/Adapters/PurchasePostingApprovalAdapter.php \
  app/Services/Approval/Adapters/SalesReturnApprovalAdapter.php \
  app/Services/Approval/Adapters/PurchaseReturnApprovalAdapter.php \
  app/Services/Approval/Adapters/CapitalInjectionApprovalAdapter.php \
  app/Services/Approval/Adapters/OwnerDrawingsApprovalAdapter.php \
  app/Services/Approval/Adapters/FundTransferApprovalAdapter.php \
  app/Services/LegacySalesReturnService.php \
  app/Services/PosReturnService.php \
  app/Http/Controllers/SaleController.php \
  app/Http/Controllers/ReturnController.php \
  app/Http/Controllers/PosReturnController.php \
  app/Http/Controllers/DebitNoteController.php \
  app/Http/Controllers/V3/PurchaseReturnController.php \
  app/Http/Controllers/V3/PurchaseController.php \
  app/Http/Controllers/V3/FundController.php \
  app/Http/Controllers/V3/SaleReturnController.php \
  app/Http/Controllers/StaffInvitationController.php \
  app/Http/Controllers/AdminController.php \
  resources/js/Pages/Admin/Users.jsx \
  resources/js/Pages/Settings/SettingsPanel.jsx \
  resources/js/Pages/Approvals/Show.jsx \
  tests/tests/Feature/V3/Scenarios/Phase1ScenariosTest.php \
  docs/approval-dashboard-audit-2026-09-22/26-money-movement-catalogue.md \
  docs/approval-dashboard-audit-2026-09-22/27-phase1-final-delivery-report.md
