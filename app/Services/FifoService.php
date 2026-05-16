<?php

namespace App\Services;

use App\Models\InventoryBatch;
use App\Models\SaleItemBatch;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * FifoService — The FIFO Deduction Engine
 *
 * This service is the mathematical heart of the ERP's inventory and COGS system.
 * It implements the FIFO (First-In, First-Out) algorithm as defined in the
 * Master Architecture Rollout Plan, Phase 2.2.
 *
 * RULE: This service is the ONLY place in the codebase that is allowed to:
 *   1. Decrement inventory_batches.remaining_qty on a sale
 *   2. Create sale_item_batches records
 *   3. Calculate the true COGS for any line item
 *
 * All calls to this service must be wrapped inside a DB::transaction().
 */
class FifoService
{
    /**
     * Process the FIFO deduction for a single sale line item.
     *
     * This method MUST be called inside an active DB transaction.
     * If the transaction rolls back, all batch deductions roll back with it.
     *
     * @param  string  $saleItemId    The UUID of the sale_item record
     * @param  string  $productId     The product being sold
     * @param  string  $warehouseId   The warehouse being sold from
     * @param  float   $quantityNeeded  Total units to deduct (includes free_quantity)
     * @return array  ['total_cogs' => float, 'batch_records_count' => int]
     *
     * @throws \Exception if insufficient stock exists across all batches
     */
    public function deductAndRecord(
        string $saleItemId,
        string $productId,
        string $warehouseId,
        float $quantityNeeded,
        ?string $variantId = null
    ): array {
        if ($quantityNeeded <= 0) {
            return ['total_cogs' => 0.0, 'batch_records_count' => 0];
        }

        // Step 1: Get all available batches, oldest first (FIFO = First-In, First-Out)
        // We lock the rows for update to prevent race conditions on concurrent checkouts.
        $query = InventoryBatch::where('product_id', $productId)
            ->where('warehouse_id', $warehouseId)
            ->where('remaining_qty', '>', 0);

        if ($variantId) {
            $query->where('variant_id', $variantId);
        } else {
            $query->whereNull('variant_id');
        }

        $batches = $query->orderBy('created_at', 'asc') // Oldest batch first — this IS the FIFO rule
            ->lockForUpdate()
            ->get();

        $remainingNeed = $quantityNeeded;
        $totalCogs      = 0.0;
        $batchRecords   = 0;

        // Step 2: Loop through batches, consuming oldest stock first
        foreach ($batches as $batch) {
            if ($remainingNeed <= 0) {
                break;
            }

            // How many can we take from this batch?
            $canTake   = min((float) $batch->remaining_qty, $remainingNeed);
            $batchCogs = $canTake * (float) $batch->unit_cost;

            // Step 3a: Record the paper trail — which batch, how many, at what cost
            SaleItemBatch::create([
                'sale_item_id'       => $saleItemId,
                'inventory_batch_id' => $batch->id,
                'qty_deducted'       => $canTake,
                'unit_cost'          => $batch->unit_cost,    // Locked-in cost snapshot
                'total_cogs'         => round($batchCogs, 4),
            ]);

            // Step 3b: Decrement the batch
            $batch->decrement('remaining_qty', $canTake);

            $totalCogs    += $batchCogs;
            $remainingNeed -= $canTake;
            $batchRecords++;
        }

        // Step 4: Safety check — did we fulfill the entire need?
        if ($remainingNeed > 0.0001) { // tolerance for float precision
            throw new \Exception(
                "FIFO stock insufficient. Product ID: {$productId}, " .
                "Needed: {$quantityNeeded}, Gap: {$remainingNeed}. " .
                "Cannot sell what you do not have."
            );
        }

        Log::info('FIFO deduction completed', [
            'sale_item_id'    => $saleItemId,
            'product_id'      => $productId,
            'qty_needed'      => $quantityNeeded,
            'total_cogs'      => round($totalCogs, 4),
            'batches_touched' => $batchRecords,
        ]);

        return [
            'total_cogs'          => round($totalCogs, 4),
            'batch_records_count' => $batchRecords,
        ];
    }

    /**
     * Create a new inventory batch when a purchase is received.
     *
     * This must be called when a purchase invoice is "posted" / "received".
     * Every call creates ONE new row — the historical record of this specific delivery.
     *
     * @param  string  $productId
     * @param  string  $warehouseId
     * @param  float   $quantity       Units received in this delivery
     * @param  float   $unitCost       What you paid per unit in this specific delivery
     * @param  string|null  $purchaseInvoiceId  Reference to the vendor bill
     * @param  string|null  $expiryDate
     * @param  string|null  $notes
     * @return InventoryBatch
     */
    public function receiveBatch(
        string  $productId,
        string  $warehouseId,
        float   $quantity,
        float   $unitCost,
        ?string $purchaseInvoiceId = null,
        ?string $expiryDate = null,
        ?string $notes = null,
        ?string $variantId = null
    ): InventoryBatch {
        return InventoryBatch::create([
            'product_id'          => $productId,
            'variant_id'          => $variantId,
            'warehouse_id'        => $warehouseId,
            'purchase_invoice_id' => $purchaseInvoiceId,
            'original_qty'        => $quantity,
            'remaining_qty'       => $quantity,   // Starts full, decrements on sale
            'unit_cost'           => $unitCost,
            'expiry_date'         => $expiryDate,
            'notes'               => $notes,
        ]);
    }

    /**
     * Calculate the real-time inventory cost value for a product.
     * Uses ONLY the inventory_batches table. Ignores products.cost_price entirely.
     *
     * This is the number that goes onto the Balance Sheet as an Asset.
     *
     * @param  string|null  $productId  null = calculate for all products
     * @param  string|null  $warehouseId
     * @return float
     */
    public function getInventoryCostValue(?string $productId = null, ?string $warehouseId = null): float
    {
        $query = InventoryBatch::where('remaining_qty', '>', 0);

        if ($productId) {
            $query->where('product_id', $productId);
        }

        if ($warehouseId) {
            $query->where('warehouse_id', $warehouseId);
        }

        return (float) $query->selectRaw('SUM(remaining_qty * unit_cost) as cost_value')
            ->value('cost_value');
    }

    /**
     * Calculate the FIFO COGS for a specific set of sale_items.
     * Reads from sale_item_batches — the permanent paper trail.
     *
     * @param  \Illuminate\Support\Collection  $saleItemIds
     * @return float
     */
    public function getCogsBySaleItems($saleItemIds): float
    {
        return (float) SaleItemBatch::whereIn('sale_item_id', $saleItemIds)
            ->sum('total_cogs');
    }

    /**
     * Check if FIFO infrastructure exists and has data for a product.
     * Used to gracefully fall back to static cost_price during transition period.
     */
    public function hasBatches(string $productId, string $warehouseId, ?string $variantId = null): bool
    {
        $query = InventoryBatch::where('product_id', $productId)
            ->where('warehouse_id', $warehouseId)
            ->where('remaining_qty', '>', 0);

        if ($variantId) {
            $query->where('variant_id', $variantId);
        } else {
            $query->whereNull('variant_id');
        }

        return $query->exists();
    }
}
