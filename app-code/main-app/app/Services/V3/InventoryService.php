<?php

namespace App\Services\V3;

use Illuminate\Support\Facades\DB;
use App\Models\JournalEntry;

class InventoryService
{
    /**
     * OWNS: Batch creation on purchase, adjustment batches.
     * Calls FifoService for all stock decreases — never writes
     * remaining_qty directly.
     */

    public function __get($name) {
        if ($name === 'tenantId') {
            return app('current.tenant')->id;
        }
        return null;
    }

    public function __construct(
        public FifoService       $fifo,
        private AccountingService $accounting
    ) {
    }

    /**
     * Create one inventory_batch per purchase_item line.
     * Called after a purchase (B3/B6) is posted.
     * The journal entry is already posted by the controller —
     * this method only creates the physical stock batches.
     */
    public function receivePurchase(string $purchaseId): void
    {
        $tid = $this->tenantId;
        $purchase = DB::table('purchases')->where('tenant_id', $tid)->where('id', $purchaseId)->first();
        if (!$purchase) {
             throw new \InvalidArgumentException("Purchase un-found: {$purchaseId}");
        }

        $items = DB::table('purchase_items')
            ->where('tenant_id', $tid)
            ->where('purchase_id', $purchaseId)
            ->get();

        foreach ($items as $item) {
            $batch = $this->fifo->receiveBatch(
                productId:   $item->product_id,
                warehouseId: $purchase->warehouse_id,
                qty:         (float) $item->qty,
                unitCost:    (float) $item->unit_cost,
                batchType:   'purchase',
                purchaseId:  $purchaseId
            );

            // Link the batch back to the purchase_item for traceability
            DB::table('purchase_items')
                ->where('tenant_id', $tid)
                ->where('id', $item->id)
                ->update(['inventory_batch_id' => $batch->id]);
        }
    }

    /**
     * Post a stock adjustment — increase (B11) or decrease (B10).
     * Decrease uses FifoService (oldest first). Increase creates a new batch.
     *
     * @return JournalEntry The journal entry created
     */
    public function adjustStock(
        string $productId,
        string $warehouseId,
        float  $qty,
        string $direction,  // 'increase' or 'decrease'
        float  $unitCost = 0.00,
        string $reason   = ''
    ): JournalEntry {
        return DB::transaction(function () use (
            $productId, $warehouseId, $qty, $direction, $unitCost, $reason
        ) {
            if ($direction === 'decrease') {
                // B10 — Stock Adjustment Loss
                // FifoService deducts oldest-first and returns cost data
                $deductions = $this->fifo->deductStock($productId, $warehouseId, $qty, 'PCS');
                $totalCost  = array_sum(array_column($deductions, 'total_cost'));

                // Physical Stock Updates
                $stock = DB::table('stocks')->where('tenant_id', $this->tenantId)
                    ->where('product_id', $productId)
                    ->where('warehouse_id', $warehouseId)
                    ->first();
                if ($stock) {
                    DB::table('stocks')->where('tenant_id', $this->tenantId)
                        ->where('id', $stock->id)
                        ->decrement('quantity', $qty);
                } else {
                    DB::table('stocks')->insert([
                        'id'           => \Illuminate\Support\Str::uuid()->toString(),
                        'tenant_id'    => $this->tenantId,
                        'product_id'   => $productId,
                        'warehouse_id' => $warehouseId,
                        'quantity'     => -$qty,
                        'created_at'   => now(),
                        'updated_at'   => now(),
                    ]);
                }

                DB::table('products')->where('tenant_id', $this->tenantId)
                    ->where('id', $productId)
                    ->decrement('stock_quantity', $qty);

                // Stock Movement Logging
                DB::table('stock_movements')->insert([
                    'id'           => \Illuminate\Support\Str::uuid()->toString(),
                    'tenant_id'    => $this->tenantId,
                    'product_id'   => $productId,
                    'warehouse_id' => $warehouseId,
                    'quantity'     => -$qty,
                    'type'         => 'adjustment_out',
                    'reference_id' => 'V3 Adjustment',
                    'description'  => "Stock adjustment loss: {$reason}",
                    'user_id'      => auth()->id() ?? 1,
                    'created_at'   => now(),
                    'updated_at'   => now(),
                ]);

                return $this->accounting->createEntry([
                    'date'     => now()->toDateString(),
                    'reference_type' => 'stock_adjustment',
                    'reference'   => $productId,
                    'description'    => "Stock decrease adjustment: {$reason}",
                ], [
                    ['account_code' => '6300', 'debit'  => $totalCost, 'credit' => 0],
                    ['account_code' => '1100', 'debit'  => 0,          'credit' => $totalCost],
                ]);

            } else {
                // B11 — Stock Adjustment Gain
                // Create a new batch at the given unit cost
                $this->fifo->receiveBatch(
                    productId:   $productId,
                    warehouseId: $warehouseId,
                    qty:         $qty,
                    unitCost:    $unitCost,
                    batchType:   'adjustment'
                );

                $totalValue = round($qty * $unitCost, 2);

                // Physical Stock Updates
                $stock = DB::table('stocks')->where('tenant_id', $this->tenantId)
                    ->where('product_id', $productId)
                    ->where('warehouse_id', $warehouseId)
                    ->first();
                if ($stock) {
                    DB::table('stocks')->where('tenant_id', $this->tenantId)
                        ->where('id', $stock->id)
                        ->increment('quantity', $qty);
                } else {
                    DB::table('stocks')->insert([
                        'id'           => \Illuminate\Support\Str::uuid()->toString(),
                        'tenant_id'    => $this->tenantId,
                        'product_id'   => $productId,
                        'warehouse_id' => $warehouseId,
                        'quantity'     => $qty,
                        'created_at'   => now(),
                        'updated_at'   => now(),
                    ]);
                }

                DB::table('products')->where('tenant_id', $this->tenantId)
                    ->where('id', $productId)
                    ->increment('stock_quantity', $qty);

                // Stock Movement Logging
                DB::table('stock_movements')->insert([
                    'id'           => \Illuminate\Support\Str::uuid()->toString(),
                    'tenant_id'    => $this->tenantId,
                    'product_id'   => $productId,
                    'warehouse_id' => $warehouseId,
                    'quantity'     => $qty,
                    'type'         => 'adjustment_in',
                    'reference_id' => 'V3 Adjustment',
                    'description'  => "Stock adjustment gain: {$reason}",
                    'user_id'      => auth()->id() ?? 1,
                    'created_at'   => now(),
                    'updated_at'   => now(),
                ]);

                return $this->accounting->createEntry([
                    'date'     => now()->toDateString(),
                    'reference_type' => 'stock_adjustment',
                    'reference'   => $productId,
                    'description'    => "Stock increase adjustment: {$reason}",
                ], [
                    ['account_code' => '1100', 'debit'  => $totalValue, 'credit' => 0],
                    ['account_code' => '4200', 'debit'  => 0,           'credit' => $totalValue],
                ]);
            }
        });
    }

    public function transferStock(
        string $productId,
        string $fromWarehouseId,
        string $toWarehouseId,
        float  $qty,
        ?string $reason = null
    ): void {
        DB::transaction(function () use ($productId, $fromWarehouseId, $toWarehouseId, $qty, $reason) {
            // Lock batches in source warehouse oldest-first (FIFO order)
            $batches = DB::table('inventory_batches')
                ->where('tenant_id', $this->tenantId)
                ->where('product_id',   $productId)
                ->where('warehouse_id', $fromWarehouseId)
                ->where('remaining_qty', '>', 0)
                ->orderBy('created_at', 'ASC')
                ->lockForUpdate()
                ->get();

            $totalAvailable = $batches->sum('remaining_qty');

            if ($totalAvailable < $qty) {
                throw new \App\Exceptions\InsufficientStockException(
                    $productId,
                    $fromWarehouseId,
                    $qty,
                    $totalAvailable
                );
            }

            $remaining = $qty;

            foreach ($batches as $batch) {
                if ($remaining <= 0) break;

                $take = min($remaining, (float) $batch->remaining_qty);

                // Reduce source batch
                DB::table('inventory_batches')
                    ->where('tenant_id', $this->tenantId)
                    ->where('id', $batch->id)
                    ->decrement('remaining_qty', $take);

                // Create new batch in destination warehouse with correct tenant_id
                DB::table('inventory_batches')->insert([
                    'id'            => \Illuminate\Support\Str::uuid()->toString(),
                    'tenant_id'     => $this->tenantId,
                    'product_id'    => $batch->product_id,
                    'warehouse_id'  => $toWarehouseId,
                    'batch_type'    => 'purchase',
                    'unit_cost'     => $batch->unit_cost,
                    'initial_qty'   => $take,
                    'original_qty'  => $take,
                    'remaining_qty' => $take,
                    'purchase_invoice_id' => $batch->purchase_invoice_id ?? null,
                    'notes'         => 'Transferred from warehouse ' .
                                      $fromWarehouseId .
                                      ($reason ? ': ' . $reason : ''),
                    'created_at'    => $batch->created_at,
                    'updated_at'    => now(),
                ]);

                $remaining -= $take;
            }

            // Decrement source warehouse stock
            $sourceStock = DB::table('stocks')
                ->where('tenant_id', $this->tenantId)
                ->where('product_id', $productId)
                ->where('warehouse_id', $fromWarehouseId)
                ->first();
            if ($sourceStock) {
                DB::table('stocks')
                    ->where('tenant_id', $this->tenantId)
                    ->where('id', $sourceStock->id)
                    ->decrement('quantity', $qty);
            } else {
                DB::table('stocks')->insert([
                    'id'           => \Illuminate\Support\Str::uuid()->toString(),
                    'tenant_id'    => $this->tenantId,
                    'product_id'   => $productId,
                    'warehouse_id' => $fromWarehouseId,
                    'quantity'     => -$qty,
                    'created_at'   => now(),
                    'updated_at'   => now(),
                ]);
            }

            // Increment/create destination warehouse stock
            $destStock = DB::table('stocks')
                ->where('tenant_id', $this->tenantId)
                ->where('product_id', $productId)
                ->where('warehouse_id', $toWarehouseId)
                ->first();
            if ($destStock) {
                DB::table('stocks')
                    ->where('tenant_id', $this->tenantId)
                    ->where('id', $destStock->id)
                    ->increment('quantity', $qty);
            } else {
                DB::table('stocks')->insert([
                    'id'           => \Illuminate\Support\Str::uuid()->toString(),
                    'tenant_id'    => $this->tenantId,
                    'product_id'   => $productId,
                    'warehouse_id' => $toWarehouseId,
                    'quantity'     => $qty,
                    'created_at'   => now(),
                    'updated_at'   => now(),
                ]);
            }

            // Log stock movements
            DB::table('stock_movements')->insert([
                [
                    'id'           => \Illuminate\Support\Str::uuid()->toString(),
                    'tenant_id'    => $this->tenantId,
                    'product_id'   => $productId,
                    'warehouse_id' => $fromWarehouseId,
                    'quantity'     => -$qty,
                    'type'         => 'transfer_out',
                    'reference_id' => 'V3 Transfer',
                    'description'  => "Transfer to Warehouse #" . $toWarehouseId . ($reason ? ': ' . $reason : ''),
                    'user_id'      => auth()->id() ?? 1,
                    'created_at'   => now(),
                    'updated_at'   => now(),
                ],
                [
                    'id'           => \Illuminate\Support\Str::uuid()->toString(),
                    'tenant_id'    => $this->tenantId,
                    'product_id'   => $productId,
                    'warehouse_id' => $toWarehouseId,
                    'quantity'     => $qty,
                    'type'         => 'transfer_in',
                    'reference_id' => 'V3 Transfer',
                    'description'  => "Transfer from Warehouse #" . $fromWarehouseId . ($reason ? ': ' . $reason : ''),
                    'user_id'      => auth()->id() ?? 1,
                    'created_at'   => now(),
                    'updated_at'   => now(),
                ]
            ]);
        });
    }
}
