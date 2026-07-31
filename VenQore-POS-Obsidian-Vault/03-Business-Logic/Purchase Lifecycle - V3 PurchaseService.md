---
tags: [services, purchases, v3]
---

# Purchase Lifecycle — V3 PurchaseService

Part of [[VenQore POS - Home]] · [[V3 Accounting Engine]] · [[FIFO Inventory System]]

`App\Services\V3\PurchaseService` — constructor deps: `AccountingService`, `InventoryService`, `TaxService`.

## store(array $validated)
- Computes per-line recoverable/non-recoverable input tax (ITC split by `business_pct`).
- Posts journal: `1100` Inventory debit, `2300` ITC, `6000` non-recoverable tax expense, credit `1000` cash or `2000` AP.
- Inserts `purchases`/`purchase_items`.
- Calls `FifoService::receiveBatch()` per line to lock in unit cost.
- Updates `Product.cost_price` per a configurable policy (`always`/`increase_only`/`decrease_only`).

## createReturn(purchaseId, data)
- Validates return qty ≤ batch `remaining_qty` (cannot return already-sold stock).
- Decrements `inventory_batches`/`products.stock_quantity`/`stocks`, logs `stock_movements`.
- Posts a reversal journal, choosing the offset account based on how the original purchase was paid (`1000` cash vs `2000` AP — documented "L011 FIX" bug fix comment).

## Legacy Counterpart: App\Services\PurchaseService
No constructor deps (calls `app(V3\AccountingService::class)` inline).
- `createPurchase(array $data): Invoice` — creates `Invoice`(type=purchase) + `InvoiceItem`s, optionally `Batch` records, adds `Stock`, updates `Product.cost_price` via weighted-average cost, updates supplier `current_balance` if unpaid.
- `createPurchaseReturn(...)` — negative-quantity `InvoiceItem`s + negative `Stock`, credits supplier balance back.
- `recordPurchasePayment()` — posts a journal entry via `V3\AccountingService` and creates a `PaymentAllocation` **linked to the JournalEntry ID** — this is the exact rule documented in `CLAUDE.md`'s "PurchaseService Safety" section. See [[PaymentAllocation Trigger]].

## Related
- [[Models - Transactions & Sales]]
- [[FIFO Inventory System]]
- [[PaymentAllocation Trigger]]
