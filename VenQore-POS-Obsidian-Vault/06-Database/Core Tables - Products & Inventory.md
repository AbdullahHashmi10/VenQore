---
tags: [database, inventory]
---

# Core Tables — Products & Inventory

Part of [[VenQore POS - Home]] · [[Database Schema Overview]]

## `products`
uuid PK. `name`, `sku` (unique, nullable, matches WooCommerce), `type` enum `standard|weighted|composite`, `price`/`cost_price` decimal(10,2), `tax_rate` decimal(5,2), `base_unit`, `secondary_unit`, `conversion_rate`, `min_stock_alert`. Additive over time: `price_includes_tax`, `is_manufactured`, `is_expiry_tracked`, `wholesale_price`, `has_variants`, `track_serial`, `deleted_at`, `tenant_id`.

## `product_barcodes`
`product_id` FK cascade, `barcode` unique.

## `stocks`
uuid PK, `product_id` FK cascade, `quantity` decimal(10,4), `status` enum `available|expired|claim_pending|damaged`, `warehouse_id` FK.

## `stock_movements`
`product_id`, `warehouse_id` (nullable FK), `quantity` decimal(10,4) signed, `type` string (`purchase, sale, adjustment, transfer, return`), `reference_id`, `description`, `user_id`, `variant_id`.

## `inventory_batches` — ★ FIFO core table
"The beating heart of FIFO." `product_id` FK cascade, `purchase_invoice_id` (indexed string reference), `warehouse_id` FK nullOnDelete, `original_qty` decimal(12,4), **`remaining_qty` decimal(12,4)**, `unit_cost` decimal(20,4), `expiry_date`, soft deletes.
Composite index `inv_batches_fifo_idx` on `[product_id, warehouse_id, remaining_qty, created_at]` for the FIFO selection query.
Later hardened: `batch_type`, `initial_qty`, `production_run_id` (V3), `variant_id`, `seq`, a **CHECK constraint on `remaining_qty >= 0`** (fixed once after an initial bug), `tenant_id`.

## `sale_item_batches` — ★ immutable COGS trail
Junction of `sale_item_id` (FK cascade) ↔ `inventory_batch_id` (FK **restrictOnDelete** — cannot delete a batch that was ever sold from). `qty_deducted`, `unit_cost` (snapshot, immutable), `total_cogs`.

## `categories` / `brands` / `product_units`
`categories` self-references via nullable `parent_id`.

## `batches` (legacy expiry tracking, pre-FIFO)
`product_id` FK, `batch_number`, `expiry_date`, `mfg_date`, `mrp`, `quantity` — superseded by `inventory_batches` but still present.

## `product_attributes` / `product_variants` / `variant_attributes`
Supports product variant matrices (size/color etc).

## `product_uom_conversions` (V3)
`product_id`, `sale_uom`(20), `conversion_factor` decimal(15,6); unique `[product_id, sale_uom]`.

## `product_price_tiers` (V3)
`product_id`, `min_qty`, `max_qty` (nullable), `unit_price` decimal(15,2) — tiered/bulk pricing.

## `stock_takes` / `stock_take_items`
`stock_takes`: `reference_number` unique, `status` enum `draft|completed`. `stock_take_items`: `expected_quantity`, `counted_quantity`, `difference`, `cost_price` (snapshot).

## `recipes` / `recipe_ingredients`, `manufacturing_rules`, `production_runs`
Support composite-product manufacturing. See [[Models - Manufacturing & Recipes]].

## `disassembly_boms` / `disassembly_bom_items` (V3)
`allocation_percent` decimal(5,2) — must sum to 100% (enforced at app level, not DB).

## `warehouses`
uuid PK, `name`, `location`, `is_default` boolean; a default "Main Store" row is seeded directly in the migration.

## Related
- [[FIFO Inventory System]]
- [[Models - Inventory & Products]]
