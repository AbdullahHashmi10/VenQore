# Phase 1 — 23 Money-Movement Kind Reconciliation

**Date:** 2026-09-23  
**Evidence basis:** grep of `reference_type` values set across `app/` (journal entry creation sites), route permission survey, controller reads.

> The doc warns: *"Never calculate 23 minus 14: the fourteen release groups include sales, purchases and returns, while the 23 counts money movement kinds."* The 14 Phase 1 **groups** coincidentally produce 14 **kinds** because transfers are individually counted (cash→bank, bank→cash, bank→bank are three separate flow directions from one controller). The 9 later kinds are individually named below — not a placeholder range.

---

## Phase 1 — 14 kinds (all fourteen operation groups)

| # | Kind | Reference types in journal | Entry points | Phase 1 adapter | Permission(s) required |
|---|------|---------------------------|--------------|----------------|------------------------|
| 1 | **Customer receipt** | `payment` (type=in, party.type=customer) · `customer_payment` | `PaymentController::store` (payments.store) · `V3\CustomerPaymentController::store` (customer-payments.store) | `CustomerReceiptApprovalAdapter` ✅ existing | `finance.receive_payment` |
| 2 | **Customer refund** | `sale_return` with refund_amount > 0 · `payment` (type=out, party.type=customer) | `SaleReversalService::execute` (sales.return, pos.return.store, returns.store) · `PaymentController::store` direction=customer/out | `CustomerRefundApprovalAdapter` 🔲 new | `finance.customer_refund` |
| 3 | **Supplier payment** | `payment` (type=out, party.type=supplier) · `supplier_payment` | `PaymentController::store` (payments.store) · `V3\SupplierPaymentController::store` (supplier-payments.store) | `SupplierPaymentApprovalAdapter` ✅ existing | `finance.send_payment` |
| 4 | **Supplier refund** | `supplier_refund` | `DebitNoteController::refund` (debit-notes.refund, both route blocks) | `SupplierRefundApprovalAdapter` 🔲 new | `finance.supplier_refund` |
| 5 | **Admin sales invoice** | `sale` | `SaleController::store` / `InvoiceController::store` (sales.store) · POS checkout excluded (remains direct) | `SalesInvoiceApprovalAdapter` ✅ existing | `sales.create` |
| 6 | **Purchase bill posting** | `purchase` | `V3\PurchaseController::store` (purchases.store) · `V3\PurchaseController::storeReceive` (purchases.receive.store) | `PurchasePostingApprovalAdapter` 🔲 new | `purchases.create` |
| 7 | **Sales return** (all paths, combined return+refund as one approval) | `sale_return` | `SaleController::returnSale` (sales.return) · `PosReturnController::store` (pos.return.store) · `ReturnController::store` (returns.store) · `V3\SaleReturnController::store` (sales.return.store) | `SalesReturnApprovalAdapter` 🔲 new | `sales.returns` · `pos.refund` |
| 8 | **Purchase return** (combined debit-note + credit as one approval) | `purchase_return` · `debit_note` | `V3\PurchaseReturnController::store` (purchases.return.store) · `DebitNoteController::store` (debit-notes.store, both blocks) | `PurchaseReturnApprovalAdapter` 🔲 new | `purchases.returns` |
| 9 | **Operating expense** | `expense` · `operating_expense` | `ExpenseController::store` (expenses.store) · `V3\ExpenseController::store` (expenses.store) | `OperatingExpenseApprovalAdapter` ✅ existing | `finance.expenses` |
| 10 | **Capital injection** | `capital_injection` (V3\FundController type=injection) · `fund_add` (FundController::addFunds) | `FundController::addFunds` (funds.add) · `V3\FundController::store` type=injection (funds.store) | `CapitalInjectionApprovalAdapter` 🔲 new | `finance.capital_add` |
| 11 | **Owner drawings** | `owner_drawing` (V3\FundController type=drawing) · `fund_remove` (FundController::removeFunds) | `FundController::removeFunds` (funds.remove) · `V3\FundController::store` type=drawing (funds.store) | `OwnerDrawingsApprovalAdapter` 🔲 new | `finance.owner_drawings` |
| 12 | **Cash → bank transfer** | `fund_transfer` (from_type=cash, to_type=bank) | `FundController::transfer` (funds.transfer) | `FundTransferApprovalAdapter` 🔲 new (shared, direction param) | `finance.internal_transfer` |
| 13 | **Bank → cash transfer** | `fund_transfer` (from_type=bank, to_type=cash) | `FundController::transfer` (funds.transfer) | Same `FundTransferApprovalAdapter`, direction=bank→cash | `finance.internal_transfer` |
| 14 | **Bank → bank transfer** | `bank_transfer` · `fund_transfer` (from_type=bank, to_type=bank) | `FundController::transfer` (funds.transfer) · `V3\BankTransferController::store` (bank-transfers.store) | Same `FundTransferApprovalAdapter`, direction=bank→bank | `finance.internal_transfer` |

**Notes:**
- `advance_settlement` (ref_type found at `SaleService.php:542`) fires automatically inside sale posting when a customer advance exists. It is not a standalone user action; it is an internal component of kind 5 (sale posting) and does not require its own adapter or approval gate.
- Kinds 12–14 share one `FundTransferApprovalAdapter` with a `direction` param derived from `from_type`/`to_type`. All three are one atomic permission key (`finance.internal_transfer`), but counted separately because they have different GL entry patterns and different user flows.

---

## Later backlog — 9 kinds (deferred from Phase 1)

| # | Kind | Reference types | Entry points | Deferred reason |
|---|------|-----------------|--------------|-----------------|
| 15 | **Customer advance** | `customer_advance` | `V3\CustomerAdvanceController::store` | Backlog group 1: advance flows |
| 16 | **Supplier advance** | `supplier_advance` | `V3\SupplierAdvanceController::store` | Backlog group 1: advance flows |
| 17 | **Order-specific advance** (sales/purchase) | `sales_order_advance` · `purchase_order_advance` | `SaleService::post` (advance path) · `PurchaseService` | Backlog group 1: advance flows |
| 18 | **Payroll / salary payment** | `salary_payment` · `salary_accrual` | `V3\PayrollController::store` | Backlog group 2: payroll/loans |
| 19 | **Loan drawdown** | `loan_drawdown` | `V3\LoanController::store` | Backlog group 2: payroll/loans |
| 20 | **Loan repayment** | `loan_repayment` | `V3\LoanController::repay` | Backlog group 2: payroll/loans |
| 21 | **Franchise / agent settlement** | `settlement_payment` · `settlement_accrual` | `SettlementService::post`, `SettlementService::paySalary` | Backlog group 3: standalone journals |
| 22 | **Bad debt write-off / bounced payment** | `bad_debt` · reversal of customer_payment with NSF/bounce flag | `V3\BounceController::store` (customer-payments.bounce) · manual journal | Backlog group 3: standalone journals |
| 23 | **Cash shortage / register overage / fund adjustment** | `cash_shortage` · `fund_adjust` | `FundController::adjust` (funds.adjust) | Backlog group 8: register custody |

---

## Reconciliation summary

| Scope | Kinds | Adapters needed | Status |
|-------|-------|-----------------|--------|
| Phase 1 | 14 | 4 existing + 10 new (kinds 2, 4, 6, 7, 8, 10, 11 + 1 shared for 12-14) | In progress |
| Later backlog | 9 | 0 built yet | Deferred |
| **Total** | **23** | | |

**Key: no kind appears twice.** Customer refund (kind 2) and sales return (kind 7) are separate: a sale can be reversed without a cash refund, and a cash refund can be paid without reversing the original sale. A combined return+refund in the POS flow is ONE approval covering both legs atomically.

**No gift cards / store credit identified as a distinct money-movement kind.** `gift_cards` table exists (Reckoner resolves `loyalty.gift_card_balance`) but gift card redemption posts as a negative receivable component of kind 1 (customer receipt) or kind 5 (sale), not as a separate GL event. If standalone gift card issuance is added later, it would be a new kind in backlog group 7.
