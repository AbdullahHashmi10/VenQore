# 23-Kind Money Movement Catalogue — Phase 1 Reconciliation

**Date:** 2026-09-23  
**Status:** Complete. Produced as required by doc 29 §"Build and verify" and doc 25 §"Mandatory 23-type reconciliation".

---

## 23 Business Kinds — Complete Mapping

| # | Kind | Phase 1 group | Adapter / Document type | Entry point(s) | Status |
|---|---|---|---|---|---|
| 1 | Customer receipt (money IN from customer) | Group 1 | `customer_receipt` / `CustomerReceiptApprovalAdapter` | `PaymentController::store` (type=in, party.type=customer), `V3/CustomerPaymentController::store` | ✅ Intercepted |
| 2 | Customer refund (money OUT to customer) | Group 2 (embedded in Group 7) | `sales_return` / `SalesReturnApprovalAdapter` | Integrated as `amount_refunded` within sales-return command — not a standalone kind; no double-post | ✅ Intercepted via sales_return |
| 3 | Supplier payment (money OUT to supplier) | Group 3 | `supplier_payment` / `SupplierPaymentApprovalAdapter` | `PaymentController::store` (type=out, party.type=supplier), `V3/SupplierPaymentController::store` | ✅ Intercepted |
| 4 | Supplier refund (money IN from supplier) | Group 4 | `supplier_refund` / `SupplierRefundApprovalAdapter` | `DebitNoteController::post()`, `DebitNoteController::refund()` — both intercepted | ✅ Intercepted |
| 5 | Administrative sales invoice | Group 5 | `sales_invoice` / `SalesInvoiceApprovalAdapter` | `/sales/invoice/create` → `SaleController::store` (administrative path), `V3/SaleController::store` | ✅ Pre-existing + verified |
| 6a | Purchase/bill posting | Group 6 | `purchase_posting` / `PurchasePostingApprovalAdapter` | `V3/PurchaseController::store` | ✅ Intercepted |
| 6b | PO receive (stock+settlement) | Group 6 | `purchase_posting` / `PurchasePostingApprovalAdapter` | `V3/PurchaseController::storeReceive` | ✅ Intercepted (same adapter, `_path: receive`) |
| 7a | Sales return | Group 7 | `sales_return` / `SalesReturnApprovalAdapter` | `SaleController::returnSale`, `ReturnController::store`, `PosReturnController::store`, `V3/SaleReturnController::store` | ✅ All 4 paths intercepted |
| 7b | Sales return refund/credit effect (= kind #2) | Group 7 | Alias of kind #2 — combined with #7 per doc 29; no double-post | Same as above | ✅ Combined with #7 |
| 8a | Purchase return | Group 8 | `purchase_return` / `PurchaseReturnApprovalAdapter` | `V3/PurchaseReturnController::store` | ✅ Intercepted |
| 8b | Purchase return refund/credit effect (= kind #4) | Group 8 | Alias of kind #4 — combined with #8; debit note refund posts atomically | `DebitNoteController::refund()` — same interception as supplier_refund | ✅ Combined with #8 |
| 9 | Operating expense | Group 9 | `operating_expense` / `OperatingExpenseApprovalAdapter` | `ExpenseController::store` | ✅ Pre-existing + verified |
| 10 | Owner capital injection | Group 10 | `capital_injection` / `CapitalInjectionApprovalAdapter` | `FundController::addFunds`, `V3/FundController::store` (type=injection) | ✅ Intercepted |
| 11 | Owner withdrawal/drawing | Group 11 | `owner_drawings` / `OwnerDrawingsApprovalAdapter` | `FundController::removeFunds`, `V3/FundController::store` (type=drawing) | ✅ Intercepted |
| 12 | Cash-to-bank transfer/deposit | Groups 12–14 | `fund_transfer` / `FundTransferApprovalAdapter` | `FundController::transfer` (from_type=cash, to_type=bank) | ✅ Intercepted (single endpoint, direction via params) |
| 13 | Bank-to-cash withdrawal | Groups 12–14 | `fund_transfer` / `FundTransferApprovalAdapter` | `FundController::transfer` (from_type=bank, to_type=cash) | ✅ Intercepted (same endpoint) |
| 14 | Bank-to-bank transfer | Groups 12–14 | `fund_transfer` / `FundTransferApprovalAdapter` | `FundController::transfer` (from_type=bank, to_type=bank) | ✅ Intercepted (same endpoint) |
| 15 | Fund/balance adjustment (manual correction) | **Deferred** (Backlog group 3) | `balance_adjustment` / `BalanceAdjustmentApprovalAdapter` | `FundController::adjust` | ✅ Phase 6 — adapter and interception already built; not a Phase 1 named group |
| 16 | Gift card / store credit redemption | **Out of scope** | Not a money-movement kind | No cash-out mechanism exists; redemption reduces a liability at POS, doesn't move cash independently | ✅ Confirmed absent |
| 17 | Advances, deposits, order-specific advance flows | **Deferred** (Backlog group 1) | — | `SalesOrderController`, `PurchaseOrderController` — advance/deposit capture; partially covered by supplier_payment for settled POs | 📋 Deferred |
| 18 | Payroll, employee settlements, loans | **Deferred** (Backlog group 2) | — | `PayrollController`, `SettlementService` | 📋 Deferred |
| 19 | Standalone journals, opening balances, bad debt | **Deferred** (Backlog group 3) | — | `JournalController`, `PartyController` opening balance | 📋 Deferred |
| 20 | Stock adjustments, stocktakes, transfers, write-offs | **Deferred** (Backlog group 4) | — | `StockAdjustmentController`, `StockTransferController` | 📋 Deferred |
| 21 | Fixed assets, depreciation, disaster losses | **Deferred** (Backlog group 5) | — | `AssetController` | 📋 Deferred |
| 22 | Tax operations, fiscal-period close | **Deferred** (Backlog group 6) | — | — | 📋 Deferred |
| 23 | Marketplace payouts, bulk imports, offline sync | **Deferred** (Backlog group 7) | — | `WooSync`, `SmartCaptureController` | 📋 Deferred |

---

## Notes

**Kind #2 / #7b and Kind #4 / #8b:** These are the same underlying money movement counted from two angles.
- Customer refund is the refund leg of a sales return — one atomic command. The approval for `sales_return` covers the refund.
- Supplier refund is integrated into the purchase return / debit note flow.
- Doc 29 explicitly requires no double-post and no double-approval for one atomic command.

**Kind #15 (balance_adjustment):** Adapter and route interception are already built (Phase 6 work), but the operation is not one of doc 29's 14 named groups. It is a manual accountant/admin correction tool, deferred per the explicit decision in `phase1-approval-audit-and-reconciliation.md` §3.

**Kind #16 (gift card/store credit):** Confirmed out of scope — redemption reduces a liability balance at POS, which does not constitute an independent money-in/out movement.

---

## Phase 1 Coverage: 14 of 14 Groups — Complete

All 14 named Phase 1 groups are covered. Kinds #2 and #7b share an adapter (sales_return). Kinds #4 and #8b share an adapter (supplier_refund / purchase_return). Kinds #12, #13, #14 share an adapter (fund_transfer). Net adapters: 11 active (+ 1 deprecated TYPE_CUSTOMER_REFUND shell).

---

## Included/Deferred Action Matrix

| Operation | Phase | Intercepted | Document type |
|---|---|---|---|
| Customer receipt | Phase 1 included | ✅ | `customer_receipt` |
| Customer refund | Phase 1 included (via sales_return) | ✅ | `sales_return` |
| Supplier payment | Phase 1 included | ✅ | `supplier_payment` |
| Supplier refund | Phase 1 included | ✅ | `supplier_refund` |
| Administrative sales invoice | Phase 1 included | ✅ | `sales_invoice` |
| Purchase/bill posting | Phase 1 included | ✅ | `purchase_posting` |
| PO receive | Phase 1 included | ✅ | `purchase_posting` |
| Sales return (all 4 paths) | Phase 1 included | ✅ | `sales_return` |
| Purchase return | Phase 1 included | ✅ | `purchase_return` |
| Operating expense | Phase 1 included | ✅ | `operating_expense` |
| Owner capital injection | Phase 1 included | ✅ | `capital_injection` |
| Owner drawings/withdrawal | Phase 1 included | ✅ | `owner_drawings` |
| Cash↔bank / bank↔bank transfer | Phase 1 included | ✅ | `fund_transfer` |
| Balance adjustment | Phase 6 (built, deferred from Phase 1) | ✅ | `balance_adjustment` |
| Advances / deposit flows | Backlog 1 | 📋 Deferred | — |
| Payroll / settlements | Backlog 2 | 📋 Deferred | — |
| Standalone journals / opening balances / bad debt | Backlog 3 | 📋 Deferred | — |
| Stock adjustments / stocktakes / write-offs | Backlog 4 | 📋 Deferred | — |
| Fixed assets / depreciation | Backlog 5 | 📋 Deferred | — |
| Tax / fiscal close | Backlog 6 | 📋 Deferred | — |
| Marketplace / import / offline sync | Backlog 7 | 📋 Deferred | — |
| Register custody / shortage | Backlog 8 | 📋 Deferred | — |
