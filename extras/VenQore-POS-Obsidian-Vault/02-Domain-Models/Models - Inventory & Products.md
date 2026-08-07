---
tags: [models, inventory, products]
---

# Models — Inventory & Products

Part of [[VenQore POS - Home]] · [[FIFO Inventory System]]

All models use `App\Traits\HasTenant` unless noted, and UUID PKs via `HasUuids`.

## Product (`Product.php`)
`SoldDeletes`, `HasActivityLog`. Fillable: `name, sku, type, category_id, brand_id, price, cost_price, wholesale_price, wholesale_min_quantity, tax_rate, price_includes_tax, hsn_code, unit, base_unit, secondary_unit, conversion_rate, min_stock_alert, alert_quantity, stock_quantity, quantity, is_weighted, is_manufactured, is_expiry_tracked, has_variants, track_serial, description, short_description, image_path, woocommerce_id`.
Relations: `barcodes`, `variants`, `stocks`, `stockMovements`, `recipes`, `category`, `images`, `brand`, `batches`, `invoiceItems`, `productionRuns`, `wooLinks`.

## Stock (`Stock.php`)
`appends: available_quantity` = `quantity - reserved_quantity` (floored at 0). Relations: `product`, `warehouse`. Core FIFO stock-per-warehouse table (superseded conceptually by `InventoryBatch` in V3).

## Batch (`Batch.php`) — legacy expiry tracking, pre-FIFO
Casts `expiry_date`, `mfg_date` as date. Relations: `product`, `invoiceItems`.

## InventoryBatch (`InventoryBatch.php`) — ★ authoritative FIFO cost-lot table
`SoftDeletes`. Fillable: `product_id, variant_id, purchase_invoice_id, warehouse_id, original_qty, initial_qty, remaining_qty, unit_cost, expiry_date, notes`.
Scopes: `scopeAvailable` (remaining_qty > 0), `scopeFifoOrder` (available + oldest-first).
This is the table `V3\FifoService` decrements. See [[FIFO Inventory System]].

## ProductBatch — separate batch-numbering system
`SoldDeletes`. Fillable: `product_id, batch_number, manufacturing_date, expiry_date, initial_quantity, current_quantity, supplier_id, notes`.

## Warehouse (`Warehouse.php`)
`SoftDeletes`. Fillable: `name, location, is_active, is_default, contact_person, phone`. Relation: `stocks`.

## Category / Brand / Unit / ProductUnit
`Category`: self-referencing `parent`/`children`, `products` hasMany. `Brand`: `recipes` hasMany.

## ProductAttribute / ProductVariant / VariantAttribute
`ProductVariant` casts `attributes` array, `stock` decimal:4.

## ProductBarcode
Fillable: `product_id, barcode, barcode_type, is_primary, description, is_active`. Constants for barcode types (EAN13/EAN8/UPC/CODE128/CODE39/QR).

## ProductSerial
`SoftDeletes`. Fillable: `product_id, serial_number, status, warehouse_id, purchase_id, sale_id, notes`.

## ProductImage / StockMovement
`StockMovement`: `$guarded=[]`; relations `product`, `warehouse`, `user`.

## StockTake / StockTakeItem
`StockTake` auto-generates `reference_number` = `AUD-XXXXXXXX` on creating(). `StockTakeItem`: `expected_quantity, counted_quantity, difference, cost_price`.

## StockTransfer / StockTransferItem
`StockTransfer` auto-generates `reference_number` = `TRF-XXXXXXXX`. Relations: `fromWarehouse`, `toWarehouse`, `creator`, `items`.

## Related
- [[FIFO Inventory System]]
- [[Core Tables - Products & Inventory]]
- [[Models - Manufacturing & Recipes]]
