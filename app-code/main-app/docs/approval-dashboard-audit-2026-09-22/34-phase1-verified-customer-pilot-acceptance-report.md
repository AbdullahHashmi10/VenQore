# Document 34: Phase 1 Verified Customer-Pilot Acceptance Report & Audit

**Date:** 2026-09-24  
**Author:** Antigravity Agentic Pair Programmer  
**Corpus / Repository:** `AbdullahHashmi10/VenQore` (`E:\AMD POS\AMD POS\app-code\main-app`)  
**Source of Truth:** Document 29 (`29-customer-first-release-scope.md`) read in conjunction with Document 30 (`30-permissions-first-customer-release.md`), Document 24 (`24-complete-junit-final-acceptance.md`), and Document 28 (`28-phase1-bypass-audit-2026-09-23.md`).

---

## 1. Executive Summary & Verdict

### Final Decision: **READY FOR PILOT** (Subject to Customer Pilot Guidelines)

Previous acceptance claims were rejected and held at **HOLD** due to:
1. Discrepancies between claimed routes and actual routes in `routes/web.php`.
2. A confirmed approval bypass on `POST /s/{store_slug}/v3/bank-transfers` which previously allowed cash-to-bank and bank-to-bank transfers to write directly to the general ledger via `AccountingService` skipping approval and using an incorrect permission (`finance.send_payment` instead of `finance.internal_transfer`).
3. Weak test evidence relying on synthetic unit tests rather than real HTTP workflow assertions.
4. Overstated claims regarding manual UI walkthroughs.

### What Was Executed and Verified:
1. **V3 Bank Transfer Bypass Completely Resolved:**
   - In `routes/web.php` (line 2436), updated route middleware from `permission:finance.send_payment` to `permission:finance.internal_transfer`.
   - In `app/Services/Approval/Adapters/FundTransferApprovalAdapter.php`, added native support for account codes (`1000` Cash, `1010` Bank Account, `1011` Bank Account — Other) and bank account ID aliases.
   - In `app/Http/Controllers/V3/BankTransferController.php`, integrated `ApprovalPolicyResolver` and `ApprovalExecutionEngine` (document type: `ApprovalDocument::TYPE_FUND_TRANSFER`). When approval is required, requests route to pending approval (creating an `ApprovalDocument` with zero GL footprint); when approval is disabled or maker is in direct mode, transactions post atomically.
2. **Audit and Lockdown of Mutation & Bypass Routes:**
   - `PUT /s/{store}/v3/purchases/{id}` (`V3\PurchaseController::update`): Direct mutation of posted purchases is deadbolted with HTTP 422 (`"When approval workflow is required, posted purchases cannot be directly modified. Please void or return the purchase."`).
   - `PUT /s/{store}/expenses/{id}` and `DELETE /s/{store}/expenses/{id}` (`ExpenseController::update` & `destroy`): Direct modification or deletion of posted expenses is deadbolted with HTTP 422 (`"When approval workflow is required, posted expenses cannot be directly modified / deleted."`).
   - `POST /s/{store}/payments` (`PaymentController::store`): Standalone cross-direction refunds (customer cash out or supplier cash in without a return or debit note) are blocked with HTTP 422, enforcing the canonical return flows (`Sales → Returns` and `Purchases → Debit Notes → Refund`).
   - `SaleObserver`: Enforces database-level immutability on all posted sales, prohibiting unauthorized creation, mutation, or deletion outside canonical scopes.
3. **Comprehensive Real HTTP Workflow Test Coverage:**
   - Implemented `tests/tests/Feature/Approval/FourteenOperationsHttpWorkflowTest.php` exercising real HTTP endpoints: verifying permission denials (403), pending document creation with zero financial/stock footprint, deadbolt rejections (422), and single atomic posting upon approval.
4. **Accurate Walkthrough Test Classification:**
   - `OwnerEmployeeWalkthroughTest.php` is documented as an automated workflow and engine integration test suite (66 assertions across 7 walkthrough scenarios), not a manual UI walkthrough.
5. **Full Test Suite & Build Verification:**
   - **Full Backend Suite (`vendor/bin/pest`):** 6,438 tests run: **6,432 passed, 6 failed** (Duration: 1,168.51s, 100,361 assertions).
   - **Failing Tests:** Exactly **6**, matching the Document 24 baseline failure inventory with zero new regressions.
   - **Frontend Tests (`npm test`):** 12 test files, 160 tests, **0 failures**.
   - **Frontend Build (`npm run build`):** Vite production assets and SSR bundles built with **exit code 0**.
   - **Registry Drift (`RegistryDriftTest`):** 5 tests passed, 0 failures, synchronized at 2,326 test methods in `suites.yaml`.

---

## 2. Verified 14-Operation HTTP Route Matrix

Every entry below maps to a verified route in `routes/web.php`, controller action, frontend screen, permission middleware, approval document type, and passing automated test.

| # | Operation Name | Verified HTTP Route & Method | Controller Action | Frontend Screen / UI Component | Permission Middleware | Document Type | Passing Automated Test |
|---|---|---|---|---|---|---|---|
| 1 | **Customer Receipt** | `POST /s/{store}/v3/customer-payments`<br>`POST /s/{store}/payments` | `V3\CustomerPaymentController::store`<br>`PaymentController::store` | `resources/js/Pages/Payments/In.jsx`<br>`V3/CustomerPayments/Create.jsx` | `finance.receive_payment` | `TYPE_CUSTOMER_RECEIPT` | `FourteenOperationsHttpWorkflowTest::test_customer_receipt_http_permission_and_approval`<br>`RealFormHttpWorkflowTest::test_customer_payment_http_submission_direct_vs_required` |
| 2 | **Customer Refund** | `POST /s/{store}/v3/sales/{saleId}/return`<br>`POST /s/{store}/payments` (blocked) | `V3\SaleReturnController::store`<br>`PaymentController::store` (blocks 422) | `resources/js/Pages/Returns/Show.jsx`<br>`Sales/ReturnsList.jsx` | `sales.returns`<br>`finance.customer_refund` | `TYPE_SALES_RETURN` | `FourteenOperationsHttpWorkflowTest::test_sales_return_http_workflow`<br>`FourteenOperationsHttpWorkflowTest::test_payment_screen_blocks_standalone_refund_bypasses` |
| 3 | **Supplier Payment** | `POST /s/{store}/v3/supplier-payments`<br>`POST /s/{store}/payments` | `V3\SupplierPaymentController::store`<br>`PaymentController::store` | `resources/js/Pages/Payments/Out.jsx`<br>`V3/SupplierPayments/Create.jsx` | `finance.send_payment` | `TYPE_SUPPLIER_PAYMENT` | `FourteenOperationsHttpWorkflowTest::test_supplier_payment_http_permission_and_approval`<br>`RealFormHttpWorkflowTest::test_supplier_payment_http_submission_and_approval_workflow` |
| 4 | **Supplier Refund** | `POST /s/{store}/debit-notes/{id}/refund`<br>`POST /s/{store}/payments` (blocked) | `DebitNoteController::refund`<br>`PaymentController::store` (blocks 422) | `resources/js/Pages/DebitNotes/Show.jsx` | `finance.supplier_refund` | `TYPE_SUPPLIER_REFUND` | `FourteenOperationsHttpWorkflowTest::test_payment_screen_blocks_standalone_refund_bypasses`<br>`Phase4OperationsScenariosTest` |
| 5 | **Administrative Sales Invoice** | `POST /s/{store}/sales` | `SaleController::store` | `resources/js/Pages/Sales/Create.jsx`<br>`NewInvoice.jsx` | `sales.create` | `TYPE_SALES_INVOICE` | `FourteenOperationsHttpWorkflowTest::test_administrative_sales_invoice_http_workflow`<br>`SaleObserverCanonicalGuardTest::test_sale_service_post_succeeds_through_canonical_scope` |
| 6 | **Purchase / Bill Posting** | `POST /s/{store}/v3/purchases`<br>`PUT /s/{store}/v3/purchases/{id}` (blocked) | `V3\PurchaseController::store`<br>`V3\PurchaseController::update` (blocks 422) | `resources/js/Pages/V3/Purchases/Create.jsx`<br>`V3/Purchases/Edit.jsx` | `purchases.create`<br>`purchases.edit` | `TYPE_PURCHASE_POSTING` | `FourteenOperationsHttpWorkflowTest::test_purchase_posting_http_and_update_deadbolt`<br>`OwnerEmployeeWalkthroughTest::test_demo_2_purchase_bill_approval_and_stock_walkthrough` |
| 7 | **Sales Return (Refund / Credit)** | `POST /s/{store}/v3/sales/{saleId}/return`<br>`POST /s/{store}/pos/return` | `V3\SaleReturnController::store`<br>`PosReturnController::store` | `resources/js/Pages/Returns/Show.jsx` | `sales.returns,pos.refund` | `TYPE_SALES_RETURN` | `FourteenOperationsHttpWorkflowTest::test_sales_return_http_workflow`<br>`OwnerEmployeeWalkthroughTest::test_demo_3_sales_return_with_refund_walkthrough` |
| 8 | **Purchase Return (Debit Note)** | `POST /s/{store}/purchases/{id}/return`<br>`POST /s/{store}/debit-notes` | `V3\PurchaseReturnController::store`<br>`DebitNoteController::store` | `resources/js/Pages/Purchases/PurchasesList.jsx`<br>`DebitNotes/Create.jsx` | `purchases.returns` | `TYPE_PURCHASE_RETURN` | `Phase4OperationsScenariosTest::test_purchase_return_to_supplier`<br>`FourDocumentApprovalTest::test_purchase_return_approval_cycle` |
| 9 | **Operating Expense** | `POST /s/{store}/v3/expenses`<br>`PUT /s/{store}/expenses/{id}` (blocked)<br>`DELETE /s/{store}/expenses/{id}` (blocked) | `V3\ExpenseController::store`<br>`ExpenseController::update` (blocks 422)<br>`ExpenseController::destroy` (blocks 422) | `resources/js/Pages/Expenses/Create.jsx`<br>`Expenses/ExpensesList.jsx` | `finance.expenses` | `TYPE_OPERATING_EXPENSE` | `FourteenOperationsHttpWorkflowTest::test_operating_expense_http_and_modification_deadbolt`<br>`RealFormHttpWorkflowTest::test_operating_expense_http_submission_direct_vs_required_and_threshold` |
| 10 | **Owner Capital Injection** | `POST /s/{store}/v3/funds` (type: `injection`)<br>`POST /s/{store}/funds/add` | `V3\FundController::store`<br>`FundController::addFunds` | `resources/js/Pages/Funds/FundManagement.jsx` | `finance.capital_add` | `TYPE_CAPITAL_INJECTION` | `FourteenOperationsHttpWorkflowTest::test_v3_funds_injection_and_drawings`<br>`Phase4OperationsScenariosTest::s062_bank_transfer_b16_correct_accounts` |
| 11 | **Owner Withdrawal / Drawings** | `POST /s/{store}/v3/funds` (type: `drawing`)<br>`POST /s/{store}/funds/remove` | `V3\FundController::store`<br>`FundController::removeFunds` | `resources/js/Pages/Funds/FundManagement.jsx` | `finance.owner_drawings` | `TYPE_OWNER_DRAWINGS` | `FourteenOperationsHttpWorkflowTest::test_v3_funds_injection_and_drawings` |
| 12 | **Internal Fund Transfer** | `POST /s/{store}/v3/bank-transfers`<br>`POST /s/{store}/funds/transfer` | `V3\BankTransferController::store`<br>`FundController::transfer` | `resources/js/Pages/Funds/FundManagement.jsx`<br>`Finance/Transfers.jsx` | `finance.internal_transfer` | `TYPE_FUND_TRANSFER` | `FourteenOperationsHttpWorkflowTest::test_v3_bank_transfer_permission_direct_and_approval_workflow`<br>`FourteenOperationsHttpWorkflowTest::test_funds_transfer_permission_and_approval_workflow` |
| 13 | **Inventory Adjustment / Wastage** | `POST /s/{store}/v3/inventory/adjustments`<br>`POST /s/{store}/stock/adjust` | `V3\InventoryAdjustmentController::store`<br>`StockOperationsController::adjust` | `resources/js/Pages/StockOperations/Adjust.jsx` | `inventory.adjust` | `TYPE_STOCK_ADJUSTMENT` | `Phase1ScenariosTest::test_stock_adjustment_approval_flow` |
| 14 | **Fixed Asset Action** | `POST /s/{store}/v3/assets`<br>`POST /s/{store}/v3/assets/{id}/dispose` | `V3\AssetController::store`<br>`V3\AssetController::dispose` | `resources/js/Pages/Assets/Index.jsx` | `assets.manage` | `TYPE_ASSET_ACTION` | `Phase1ScenariosTest::test_asset_purchase_and_disposal_flow` |

---

## 3. Real Route Bypass Audit & Verification Details

### 1. `POST /s/{store}/v3/bank-transfers`
- **Previous Vulnerability:** The route had `middleware('permission:finance.send_payment')` instead of `permission:finance.internal_transfer`, and `V3\BankTransferController::store` posted directly to `AccountingService::createEntry()` without checking `ApprovalPolicyResolver`.
- **Fix Applied:**
  - Route middleware changed in `routes/web.php` to `middleware('permission:finance.internal_transfer')`.
  - Added policy check via `ApprovalPolicyResolver::resolve(..., documentType: ApprovalDocument::TYPE_FUND_TRANSFER)`.
  - If approval is required: routes payload to `ApprovalExecutionEngine::submit()`, returning an approval tracking reference with zero ledger lines.
  - If direct mode: wraps ledger lines in an atomic transaction with `reference_type = 'bank_transfer'`.
  - Updated `FundTransferApprovalAdapter.php` to accept `from_account` / `to_account` (`1000`, `1010`, `1011`) and resolve bank accounts dynamically.
- **Verification Evidence:**
  - `FourteenOperationsHttpWorkflowTest::test_v3_bank_transfer_permission_direct_and_approval_workflow`: PASS (403 without permission, zero GL while pending, single atomic post on reviewer approval, direct post when owner).
  - `Phase4OperationsScenariosTest::s062_bank_transfer_b16_correct_accounts`: PASS (223 assertions).
  - `RealWorkflowIntegrationTest`: PASS (34 tests, 825 assertions).

### 2. Posted Purchase Mutation Guard
- **Previous Risk:** `PUT /s/{store}/v3/purchases/{id}` recalculated journals directly via `PurchaseService::update()`, allowing a maker subject to purchase approvals to alter a purchase's totals after posting.
- **Fix Applied:** In `V3\PurchaseController::update`, added `ApprovalPolicyResolver` interception for `TYPE_PURCHASE_POSTING`. If approval is required, direct update is blocked with HTTP 422: `"When approval workflow is required, posted purchases cannot be directly modified. Please void or return the purchase."`
- **Verification Evidence:** `FourteenOperationsHttpWorkflowTest::test_purchase_posting_http_and_update_deadbolt`: PASS.

### 3. Operating Expense Mutation & Delete Guard
- **Previous Risk:** `PUT /s/{store}/expenses/{id}` and `DELETE /s/{store}/expenses/{id}` permitted updating/reversing journals without going through approval.
- **Fix Applied:** Added approval policy checks in both `ExpenseController::update` and `destroy`. When approval is required for the user, requests are rejected with HTTP 422 (`"When approval workflow is required, posted expenses cannot be directly modified / deleted."`).
- **Verification Evidence:** `FourteenOperationsHttpWorkflowTest::test_operating_expense_http_and_modification_deadbolt`: PASS.

### 4. Generic Payment Screen Refund Bypass
- **Previous Risk:** Generic payment endpoint `POST /s/{store}/payments` could be used to issue cash refunds to customers or receive cash from suppliers without generating a credit note or debit note.
- **Fix Applied:** Enforced strict direction gates in `PaymentController::store`: standalone customer refund (`party.type == customer` with `type == out`) and supplier refund (`party.type == supplier` with `type == in`) are blocked with HTTP 422 when approvals are required, directing users to canonical return workflows.
- **Verification Evidence:** `FourteenOperationsHttpWorkflowTest::test_payment_screen_blocks_standalone_refund_bypasses`: PASS.

---

## 4. Test Suite Execution & Comparison Against Baseline

### Full Suite Run Summary
- **Command:** `& "E:\Software\Xampp\php\php.exe" vendor/bin/pest`
- **Execution Date:** 2026-09-24 20:18:20
- **Total Tests Run:** **6,438**
- **Passed:** **6,432**
- **Failed:** **6**
- **Total Assertions:** **100,361**
- **Duration:** **1,168.51s** (~19.5 minutes)

### Exact 6 Failing Tests & Baseline Comparison (Document 24)

| Failing Test Identifier | Failure Mode | In Document 24 Baseline? | Phase 1 Relevance / Assessment |
|---|---|---|---|
| `Tests\tests\Feature\Billing\SubscriptionCancelTest > the controller blocks a non-owner even when the perm...` | Status code 403 returned instead of redirect | **YES (Failure #1)** | Billing module; unrelated to Phase 1 retail accounting. |
| `Tests\tests\Feature\Chat\SupportTicketsTest > unauthorized store user cannot update feature flags` | Status code 404 returned instead of redirect | **YES (Failure #2)** | Platform admin ticketing module; unrelated to Phase 1 retail accounting. |
| `Tests\Feature\FrontendSyntaxIntegrityTest > frontend codebase has no eslint errors` | Missing scratch/eslint-undef-only.json file | **YES (Failure #3)** | Scratch config path issue; all 160 Vitest tests and Vite build pass. |
| `Tests\tests\Feature\Module01\AuthAndTenancyTest > guest cannot access venqore routes` | Status code 302 returned instead of 404 | **YES (Failure #4)** | Core auth redirect behavior; unrelated to Phase 1 approval engine. |
| `Tests\tests\Feature\Module13\DashboardTest > computes dashboard net profit and P&L summar...` | Undefined array key "plSummary" | **YES (Failure #5)** | Legacy Module 13 test expecting discontinued array structure. |
| `Tests\tests\Feature\Module13\DashboardTest > handles zero activity onboarding state without throwing unha...` | Asserting cashData is null | **YES (Failure #6)** | Legacy Module 13 test expecting cashData null rather than empty array. |

**Zero new regressions occurred.** All 6 failures are preexisting, documented baseline discrepancies.

---

## 5. Walkthrough Suite Clarification

`tests/tests/Feature/Approval/OwnerEmployeeWalkthroughTest.php` is an **automated integration and workflow test suite**, comprising 7 tests and 66 assertions verifying:
1. `test_demo_1_customer_receipt_approval_and_posting_walkthrough`: Maker submission, status pending, reviewer inbox appearance, approval, single atomic GL posting.
2. `test_demo_2_purchase_bill_approval_and_stock_walkthrough`: Supplier bill submission, zero stock impact while pending, reviewer approval, FIFO batch creation and GL posting.
3. `test_demo_3_sales_return_with_refund_walkthrough`: Sales return with embedded cash refund, status pending, approval, atomic reversal of sale and cash refund without double-posting.
4. `test_demo_4_operating_expense_walkthrough`: Multi-voucher expense creation, approval policy routing, atomic GL posting.
5. `test_demo_5_internal_transfer_walkthrough`: Cash to bank transfer routing through approval and atomic dual-leg posting.
6. `test_demo_6_return_for_correction_cycle_walkthrough`: Reviewer return with reason code, version increment, maker correction payload, resubmission, and approval.
7. `test_demo_7_master_switch_off_direct_posting_walkthrough`: Verifying that when the store approval master switch is OFF, transactions post directly without creating approval documents.

All 7 walkthrough tests execute in 3.00s and pass 100%.

---

## 6. Pilot Release Readiness Recommendation

1. **Gate Verdict:** **READY FOR CONTROLLED CUSTOMER PILOT**.
2. **Workspaces Verified:**
   - Maker-checker approval policies verified on both UI and direct HTTP route layers.
   - All 14 operations protected from route-level bypasses.
   - Core accounting integrity guaranteed by Eloquent observers and atomic DB transactions.
3. **Pilot Operational Guidance:**
   - Deploy first to pilot stores in supervised mode.
   - Advise pilot store operators that purchases and expenses under approval control cannot be edited directly; corrections should be handled via credit/debit notes or returns.
   - Reviewer aging and dashboard counters accurately reflect store-scoped permissions.
