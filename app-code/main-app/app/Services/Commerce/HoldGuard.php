<?php

namespace App\Services\Commerce;

use App\Exceptions\InsufficientStockException;
use Illuminate\Support\Facades\DB;

/**
 * Called by the sale engine right before FIFO deduction. A sale (POS or otherwise) may not
 * consume stock that an accepted online order is holding. The order's own sale is exempt.
 */
class HoldGuard
{
    public static function assertSellable(string $productId, string $warehouseId, float $baseQty, ?string $ownOrderId = null): void
    {
        $held = DB::table('commerce_stock_holds')
            ->where('product_id', $productId)->where('warehouse_id', $warehouseId)->where('status', 'active')
            ->when($ownOrderId, fn ($q) => $q->where('order_id', '!=', $ownOrderId))
            ->sum('quantity');
        if ((float) $held <= 0) {
            return;
        }
        $onHand = (float) DB::table('inventory_batches')
            ->where('product_id', $productId)->where('warehouse_id', $warehouseId)
            ->whereNull('deleted_at')->sum('remaining_qty');
        if ($onHand - (float) $held < $baseQty - 0.00005) {
            throw new InsufficientStockException($productId, $warehouseId, $baseQty, max(0, round($onHand - (float) $held, 4)));
        }
    }
}
