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

    private $tenantId;

    public function __construct(
        public FifoService       $fifo,
        private AccountingService $accounting
    ) {
        $this->tenantId = app('current.tenant')->id;
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
}
