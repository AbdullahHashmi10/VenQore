---
tags: [models, manufacturing, composite-products]
---

# Models — Manufacturing & Composite Products

Part of [[VenQore POS - Home]] · [[Manufacturing & Composite Products]]

## Recipe / RecipeIngredient / RecipeMedia
`Recipe`: bill-of-materials for composite/manufactured products. Self-referencing `parentRecipe`/`versions` for version control (`parent_recipe_id`). `RecipeMedia`: SOP videos/images per step; accessor converts YouTube URLs to embed format.

## ManufacturingRule / ManufacturingIngredient / ManufacturingLog — Mode A "Make Now"
`ManufacturingRule`: `canManufacture()` checks `is_active`.
`ManufacturingIngredient`: `getRequiredQuantity($producedQuantity)`, `hasEnoughStock($requiredQty)` (checks `Stock` at warehouse_id=1 — **hardcoded warehouse**, a known limitation).
`ManufacturingLog`: casts `deductions` array.

## ProductionLog / ProductionLogIngredient / ProductionRun — Mode B "Ready Made"
`ProductionLog`: static `generateBatchCode()` — sequential `BATCH-YYYY-NNNN` per year.

## DigitalProduct
Not tenant-scoped, unrelated to POS inventory — tracks the platform's own software product/roadmap items.

## Related
- [[Manufacturing & Composite Products]] (services)
- [[Models - Inventory & Products]]
