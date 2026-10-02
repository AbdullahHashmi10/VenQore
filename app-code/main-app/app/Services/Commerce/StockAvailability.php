<?php

namespace App\Services\Commerce;

use Illuminate\Support\Facades\DB;

/**
 * Authoritative availability for online orders.
 *
 * on hand  = SUM(inventory_batches.remaining_qty)   (FIFO batches are the source of truth)
 * minus    legacy pre-sale reservations              (sales_order_items.quantity_reserved, open pre-sales)
 * minus    SmartCapture holds                        (stocks.reserved_quantity)
 * minus    active commerce holds                     (commerce_stock_holds)
 *
 * The three hold representations are subtracted conservatively (never double-count in our favour).
 * KNOWN LIMITATION (documented in the roadmap): POS paths do not read commerce holds, so an online hold
 * is a promise, not a lock, against a counter sale of the same units. Pilot policy: allocate an online
 * stock pool or pause checkout for that item.
 */
class StockAvailability
{
    public function onHand(int $tenantId, string $productId, string $warehouseId): float
    {
        return (float) DB::table('inventory_batches')
            ->where('tenant_id', $tenantId)->where('product_id', $productId)
            ->where('warehouse_id', $warehouseId)->whereNull('deleted_at')
            ->sum('remaining_qty');
    }

    public function available(int $tenantId, string $productId, string $warehouseId, ?string $excludeOrderId = null): float
    {
        $onHand = $this->onHand($tenantId, $productId, $warehouseId);

        $presale = (float) DB::table('sales_order_items as soi')
            ->join('sales_orders as so', 'soi.sales_order_id', '=', 'so.id')
            ->where('soi.tenant_id', $tenantId)->where('soi.product_id', $productId)
            ->whereNull('so.deleted_at')->whereNull('soi.deleted_at')
            ->whereNotIn('so.status', ['cancelled', 'completed', 'delivered', 'converted'])
            ->sum('soi.quantity_reserved');

        $smart = (float) DB::table('stocks')
            ->where('tenant_id', $tenantId)->where('product_id', $productId)
            ->where('warehouse_id', $warehouseId)->sum('reserved_quantity');

        $holds = DB::table('commerce_stock_holds')
            ->where('tenant_id', $tenantId)->where('product_id', $productId)
            ->where('warehouse_id', $warehouseId)->where('status', 'active');
        if ($excludeOrderId) {
            $holds->where('order_id', '!=', $excludeOrderId);
        }

        return round($onHand - $presale - $smart - (float) $holds->sum('quantity'), 4);
    }
}
