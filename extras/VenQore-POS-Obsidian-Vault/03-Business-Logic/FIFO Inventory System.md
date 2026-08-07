---
tags: [services, inventory, fifo]
---

# FIFO Inventory System

Part of [[VenQore POS - Home]] · [[Two Generations - Legacy vs V3]]

## Two Implementations Coexist

### V3\FifoService (current, authoritative)
"The ONLY method that reduces `inventory_batches.remaining_qty`." No constructor deps (resolves tenant via `app('current.tenant')`).
| Method | Purpose |
|---|---|
| `deductStock(productId, warehouseId, qty, saleUom='PCS')` | Locks batches oldest-first (`created_at ASC, seq ASC`) `FOR UPDATE`, deducts across batches. If stock runs out, creates a `negative_stock` batch type rather than going negative on a real batch — unless `SettingsHelper::shouldStopNegativeStock()`, which throws `InsufficientStockException` |
| `restoreStock(saleItemId)` | Reverses `sale_item_batches` back onto original `inventory_batches` |
| `receiveBatch(...)` | The only creator of purchase/manufactured/adjustment batches |
| `voidPurchaseBatches(purchaseInvoiceId)` | Zeroes/soft-deletes batches tied to a purchase on edit/delete; warns if units were already sold |
| `checkAvailability()` | Non-locking pre-flight stock check |

### App\Services\FifoService (legacy, distinct class)
"The mathematical heart of the ERP's inventory and COGS system... the ONLY place allowed to decrement `inventory_batches.remaining_qty`" (in this generation).
| Method | Purpose |
|---|---|
| `deductAndRecord(saleItemId, productId, warehouseId, quantityNeeded, ?variantId)` | Locks batches FOR UPDATE, oldest-first, creates a `SaleItemBatch` per batch touched (cost snapshot locked at deduction time). **Throws if insufficient — no negative stock allowed here**, contrast with V3 |
| `getInventoryCostValue(?productId, ?warehouseId)` | Balance Sheet inventory asset value — reads only `inventory_batches`, ignores `products.cost_price` |
| `getCogsBySaleItems()`, `hasBatches()` | Supporting queries |

## InventoryService (V3) — batch creation orchestrator
"Owns batch creation on purchase, adjustment batches. Calls FifoService for all stock decreases — never writes remaining_qty directly."
- `receivePurchase(string $purchaseId)` — creates one `inventory_batch` per `purchase_item`.
- `adjustStock(...)` — `'decrease'` (posts `6300`/`1100`) or `'increase'` (creates a new batch, posts `1100`/`4200`).
- `transferStock(...)` — locks source batches FIFO-order, moves quantity into new destination batches, logs `stock_movements` both directions.

## Legacy Composite-Product FIFO (App\Services\InventoryService)
`deductStock(Product, $quantity)` — if `type==='composite'`, checks pre-made `Stock`; if enough exists, deducts from batches (Mode B); otherwise recursively deducts raw materials via `recipes` (Mode A), supporting nested composite recipes. See [[Manufacturing & Composite Products]].

## The Golden Rule
> Never physically delete a `SaleItemBatch`. Reversal marks `is_reversed=true`. Never compute Gross Profit from `sale_items` alone — always use `sale_item_batches` for COGS.

## Related
- [[Models - Inventory & Products]]
- [[Sale Lifecycle - V3 SaleService]]
- [[Core Tables - Products & Inventory]]
