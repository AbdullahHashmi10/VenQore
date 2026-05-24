<?php

namespace App\Services\V3;

use App\Exceptions\InsufficientStockException;
use App\Models\InventoryBatch;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class FifoService
{
    private int $tenantId;

    public function __construct()
    {
        $this->tenantId = app('current.tenant')->id;
    }
    /**
     * Deduct stock using FIFO (oldest batch first, per warehouse).
     * This is the ONLY method that reduces inventory_batches.remaining_qty.
     *
     * @return array [{batch_id, qty_taken, unit_cost, total_cost}]
     * @throws InsufficientStockException
     */
    public function deductStock(
        string|int $productId,
        string|int $warehouseId,
        float $qty,
        string $saleUom = 'PCS'
    ): array {
        // If UOM conversion is needed, caller passes already-converted base qty.
        // UomService::toBaseQty() should be called before this method if sale_uom != base_uom.

        return DB::transaction(function () use ($productId, $warehouseId, $qty) {

            // Pre-flight: check total available FIRST
            $totalAvailable = DB::table('inventory_batches')
                ->where('tenant_id', $this->tenantId)
                ->where('product_id', $productId)
                ->where('warehouse_id', $warehouseId)
                ->where('remaining_qty', '>', 0)
                ->sum('remaining_qty');
                
            $stopNegative = \App\Helpers\SettingsHelper::shouldStopNegativeStock();

            if ($totalAvailable < $qty && $stopNegative) {
                throw new InsufficientStockException(
                    $productId, $warehouseId, $qty, $totalAvailable
                );
            }

            // Lock batches for this product+warehouse, oldest first
            $batches = DB::table('inventory_batches')
                ->where('tenant_id', $this->tenantId)
                ->where('product_id', $productId)
                ->where('warehouse_id', $warehouseId)
                ->where('remaining_qty', '>', 0)
                ->orderBy('created_at', 'ASC') // FIFO — Golden Rule 3
                ->lockForUpdate()
                ->get();

            $deductions    = [];
            $remaining     = $qty;

            foreach ($batches as $batch) {
                if ($remaining <= 0) break;

                $take      = min($remaining, $batch->remaining_qty);
                $totalCost = round($take * $batch->unit_cost, 2);

                // Decrement the batch
                DB::table('inventory_batches')
                    ->where('tenant_id', $this->tenantId)
                    ->where('id', $batch->id)
                    ->decrement('remaining_qty', $take);

                $deductions[] = [
                    'batch_id'   => $batch->id,
                    'qty_taken'  => $take,
                    'unit_cost'  => (float) $batch->unit_cost,
                    'total_cost' => $totalCost,
                ];

                $remaining -= $take;
            }

            if ($remaining > 0) {
                $lastBatch = DB::table('inventory_batches')
                    ->where('tenant_id', $this->tenantId)
                    ->where('product_id', $productId)
                    ->where('warehouse_id', $warehouseId)
                    ->orderBy('created_at', 'DESC')
                    ->first();

                if (!$lastBatch) {
                    $product = DB::table('products')->where('tenant_id', $this->tenantId)->where('id', $productId)->first();
                    $unitCost = $product ? (float) ($product->cost_price ?? 0) : 0.0;
                    
                    $batchId = Str::uuid()->toString();
                    DB::table('inventory_batches')->insert([
                        'tenant_id' => $this->tenantId,
                        'id' => $batchId,
                        'product_id' => $productId,
                        'warehouse_id' => $warehouseId,
                        'batch_type' => 'negative_stock',
                        'unit_cost' => $unitCost,
                        'original_qty' => 0,
                        'initial_qty' => 0,
                        'remaining_qty' => -$remaining,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    
                    $deductions[] = [
                        'batch_id' => $batchId,
                        'qty_taken' => $remaining,
                        'unit_cost' => $unitCost,
                        'total_cost' => round($remaining * $unitCost, 2),
                    ];
                } else {
                    DB::table('inventory_batches')
                        ->where('tenant_id', $this->tenantId)
                        ->where('id', $lastBatch->id)
                        ->decrement('remaining_qty', $remaining);
                    
                    $deductions[] = [
                        'batch_id' => $lastBatch->id,
                        'qty_taken' => $remaining,
                        'unit_cost' => (float) $lastBatch->unit_cost,
                        'total_cost' => round($remaining * $lastBatch->unit_cost, 2),
                    ];
                }
            }

            return $deductions;
        });
    }

    /**
     * Restore stock to the EXACT original batches from a sale return.
     * Reads sale_item_batches, adds back to each original batch, marks rows reversed.
     */
    public function restoreStock(string|int $saleItemId): void
    {
        DB::transaction(function () use ($saleItemId) {

            $rows = DB::table('sale_item_batches')
                ->where('tenant_id', $this->tenantId)
                ->where('sale_item_id', $saleItemId)
                ->where('is_reversed', 0)
                ->get();

            foreach ($rows as $row) {
                DB::table('inventory_batches')
                    ->where('tenant_id', $this->tenantId)
                    ->where('id', $row->inventory_batch_id)
                    ->increment('remaining_qty', $row->qty_deducted);

                DB::table('sale_item_batches')
                    ->where('tenant_id', $this->tenantId)
                    ->where('id', $row->id)
                    ->update(['is_reversed' => 1]);
            }
        });
    }

    /**
     * Create a new inventory batch on purchase receipt.
     * This is the ONLY method that creates inventory_batches rows for purchases.
     */
    public function receiveBatch(
        string|int $productId,
        string|int $warehouseId,
        float      $qty,
        float      $unitCost,
        string     $batchType   = 'purchase',
        string|int|null $purchaseId     = null,
        string|int|null $productionRunId = null,
        string|null     $expiryDate      = null
    ): object {
        $id = Str::uuid()->toString();

        DB::table('inventory_batches')->insert([
            'tenant_id'         => $this->tenantId,
            'id'                => $id,
            'product_id'        => $productId,
            'warehouse_id'      => $warehouseId,
            'purchase_invoice_id' => $purchaseId,
            'production_run_id' => $productionRunId,
            'batch_type'        => $batchType,
            'unit_cost'         => $unitCost,
            'original_qty'      => $qty,
            'initial_qty'       => $qty,
            'remaining_qty'     => $qty,
            'expiry_date'       => $expiryDate,
            'created_at'        => now(),
            'updated_at'        => now(),
        ]);

        return DB::table('inventory_batches')->where('tenant_id', $this->tenantId)->where('id', $id)->first();
    }

    /**
     * Void inventory batches created by a specific purchase invoice.
     *
     * Used when a purchase is edited (update) or deleted (destroy).
     * For each batch tied to this purchase:
     *   - If intact (remaining_qty == initial_qty): safe to void — zero it out + soft-delete.
     *   - If partially consumed (remaining_qty < initial_qty): the stock has already been
     *     sold. We cannot zero it safely. We void only the unconsumed remainder and return
     *     a warning so the caller can decide (usually: block the delete or force a journal adj).
     *
     * @return array{voided_cost: float, warnings: array<string>}
     */
    public function voidPurchaseBatches(string|int $purchaseInvoiceId): array
    {
        $voidedCost = 0.0;
        $warnings   = [];

        $batches = DB::table('inventory_batches')
            ->where('tenant_id', $this->tenantId)
            ->where('purchase_invoice_id', $purchaseInvoiceId)
            ->whereNull('deleted_at')
            ->get();

        foreach ($batches as $batch) {
            $initial   = (float) $batch->initial_qty;
            $remaining = (float) $batch->remaining_qty;
            $consumed  = $initial - $remaining;

            if ($consumed > 0.001) {
                // Partially or fully consumed — only void what's still available.
                $warnings[] = "Batch {$batch->id} (product {$batch->product_id}): "
                    . "{$consumed} units already sold. Only voiding remaining {$remaining}.";
            }

            // Zero and soft-delete the batch
            DB::table('inventory_batches')
                ->where('tenant_id', $this->tenantId)
                ->where('id', $batch->id)
                ->update([
                    'remaining_qty' => 0,
                    'deleted_at'    => now(),
                    'updated_at'    => now(),
                ]);

            $voidedCost += round($remaining * (float) $batch->unit_cost, 2);
        }

        return [
            'voided_cost' => $voidedCost,
            'warnings'    => $warnings,
        ];
    }

    /**
     * Non-locking pre-flight check.
     * Use before showing the UI "sell" button — not as a substitute for deductStock's lock.
     */
    public function checkAvailability(
        string|int $productId,
        string|int $warehouseId,
        float      $qty
    ): bool {
        $available = DB::table('inventory_batches')
            ->where('tenant_id', $this->tenantId)
            ->where('product_id', $productId)
            ->where('warehouse_id', $warehouseId)
            ->where('remaining_qty', '>', 0)
            ->sum('remaining_qty');

        return $available >= $qty;
    }
}
