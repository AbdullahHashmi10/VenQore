---
tags: [services, manufacturing]
---

# Manufacturing & Composite Products

Part of [[VenQore POS - Home]] · [[Models - Manufacturing & Recipes]]

Three independent implementations exist:

## 1. App\Services\InventoryService::deductStock() — recipe-based
Legacy composite-product manufacturing: Mode A "Make Now" (auto-deducts raw materials when composite stock is zero) vs Mode B "Ready Made" (sells from pre-manufactured stock). Supports nested composite recipes via `Product::recipes`.

## 2. App\Services\AutoManufacturingService — rule-based
`processSale(Sale $sale)` — for each sale item, looks up an active `ManufacturingRule`, auto-manufactures if allowed.
`manufacture()` — checks ingredient stock sufficiency first, deducts each ingredient from `Stock`, computes total manufacturing cost from ingredient `cost_price`, increments the parent product's `Stock`, writes a `ManufacturingLog`. This is the engine referenced by CLAUDE.md's "Mode A: Make Now."

## 3. App\Services\V3\ManufacturingService — BOM-based, fullest implementation
Constructor deps: `AccountingService`, `FifoService`.
| Method | Purpose |
|---|---|
| `startRun(array $data)` | B17: loads active BOM, FIFO-deducts raw materials (`6400`/`1100`), optionally posts labor cost, creates `production_runs` row |
| `completeRun(runId, actualQty)` | Posts finished-goods batch at computed unit cost; handles **by-products at NRV** (S-094) |
| `partialReverse(runId, reverseQty)` | S-015: can only reverse unsold quantity (checked via `sale_item_batches`) |
| `disassemble(productId, qty, warehouseId)` | B30: breaks a "set" product into components per `disassembly_bom_items` allocation percentages (must sum to 100%), pure inventory reclassification, no P&L impact |

## Related
- [[Models - Manufacturing & Recipes]]
- [[FIFO Inventory System]]
