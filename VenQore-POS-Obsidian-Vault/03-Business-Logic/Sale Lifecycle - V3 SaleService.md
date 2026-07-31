---
tags: [services, sales, v3]
---

# Sale Lifecycle — V3 SaleService

Part of [[VenQore POS - Home]] · [[V3 Accounting Engine]] · [[FIFO Inventory System]]

`App\Services\V3\SaleService` — constructor deps: `AccountingService`, `FifoService`, `PaymentService`, `TaxService`, `UomService`. The only writer of `sales`, `sale_items`, `sale_item_batches`.

## post(array $data): object
1. Idempotent via `client_sale_id`.
2. Expands tiered pricing (`applyTieredPricing()` — S-042 tiered pricing split by quantity), converts UOM→base qty.
3. Calls `FifoService::deductStock()` per line.
4. Enforces **below-cost sale guard** (`BelowCostSaleException` unless `approved_by` set).
5. Enforces **customer credit-limit check** against AR (account `1200`).
6. Builds journal lines: Revenue `4000`, COGS `5000`/`1100`, Tax Payable `2100`, cash `1000`/bank `1010`, AR `1200`, Customer Advance `2100` for overpayment.
7. Posts via `AccountingService::createEntry()`.
8. Writes `sales`/`sale_items`/`sale_item_batches`.
9. Allocates payment via `PaymentService::allocate()`.
10. Can settle a customer advance balance.

## reverse(saleId, reason, ?returnDate, items=[]): object
Supports both:
- **Partial returns** — pro-rates net revenue per unit, restores exact FIFO batches via `sale_item_batches`, posts a partial reversal journal, records a refund `Payment`, flags sale `partially_returned`/`returned`.
- **Full returns** — restores stock via `FifoService::restoreStock()`, reverses the whole journal entry via `AccountingService::reverseEntry()`, reverses all `payments` rows.

## Legacy Counterpart: SaleReversalService
`App\Services\SaleReversalService` — "the ONLY authorised path for undoing a posted sale's financial footprint... YOU DO NOT EDIT THE PAST. YOU REVERSE IT."
- Guards: only `status==='posted'`; `type` must be `'cancelled'`/`'returned'`.
- Steps: (1) reverse journal entry, (2) proportional counter-payments, (3) restore FIFO stock from `sale_item_batches` (fallback to simple `Stock` restoration for pre-FIFO sales), (4) restore `stocks`/`products.stock_quantity` aggregates, (5) transition `sales.status` via raw `DB::statement` (bypasses `SaleObserver` financial-column lock).

## Related
- [[Models - Transactions & Sales]]
- [[FIFO Inventory System]]
- [[V3 Accounting Engine]]
