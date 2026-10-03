<?php

namespace App\Services\Commerce;

use App\Exceptions\ReservedStockException;
use Illuminate\Support\Facades\DB;

/**
 * Called by the sale engine right before FIFO deduction. A sale (POS or otherwise) may not
 * consume stock that an accepted online order is holding. The order's own sale is exempt.
 */
class HoldGuard
{
    /**
     * True while an OFFLINE-recorded sale is being synced. That sale already happened at the counter (the goods are gone),
     * so refusing it would only lose the record. It is posted, and the online order that is now short is flagged instead.
     */
    public static bool $offlineSale = false;

    /**
     * The enforcing check. Call it AFTER the inventory_batches rows for this product+warehouse are locked
     * FOR UPDATE, with $onHand summed from those locked rows (OrderService::confirm takes the same locks before
     * inserting a hold, which is what makes the two serialise).
     */
    public static function assertUnderLock(string $productId, string $warehouseId, float $baseQty, float $onHand, ?string $ownOrderId = null): void
    {
        if (self::$offlineSale) {
            return;
        }
        $held = (float) DB::table('commerce_stock_holds')
            ->where('product_id', $productId)->where('warehouse_id', $warehouseId)->where('status', 'active')
            ->when($ownOrderId, fn ($q) => $q->where('order_id', '!=', $ownOrderId))
            ->lockForUpdate()->sum('quantity'); // latest committed holds, not a stale snapshot
        if ($held > 0 && $onHand - $held < $baseQty - 0.00005) {
            throw new ReservedStockException($productId, $warehouseId, $baseQty, max(0, round($onHand - $held, 4)), self::orders($productId, $warehouseId, $ownOrderId));
        }
    }

    /** Early, advisory check (not under lock). The authoritative check is assertUnderLock inside FifoService::deductStock. */
    public static function assertSellable(string $productId, string $warehouseId, float $baseQty, ?string $ownOrderId = null): void
    {
        if (self::$offlineSale) {
            return;
        }
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
            throw new ReservedStockException($productId, $warehouseId, $baseQty, max(0, round($onHand - (float) $held, 4)), self::orders($productId, $warehouseId, $ownOrderId));
        }
    }

    private static function orders(string $productId, string $warehouseId, ?string $own): array
    {
        return DB::table('commerce_stock_holds as h')->join('commerce_orders as o', 'o.id', '=', 'h.order_id')
            ->where('h.product_id', $productId)->where('h.warehouse_id', $warehouseId)->where('h.status', 'active')
            ->when($own, fn ($q) => $q->where('h.order_id', '!=', $own))->pluck('o.public_number')->unique()->values()->all();
    }

    /**
     * After offline sales sync: any active hold that on-hand stock can no longer cover gets its order flagged for the
     * merchant (once per order). Returns the number of orders flagged.
     */
    public static function reportConflicts(int $tenantId): int
    {
        $n = 0;
        $groups = DB::table('commerce_stock_holds')->where('tenant_id', $tenantId)->where('status', 'active')
            ->groupBy('product_id', 'warehouse_id')->selectRaw('product_id, warehouse_id, SUM(quantity) held')->get();
        foreach ($groups as $g) {
            $onHand = (float) DB::table('inventory_batches')->where('tenant_id', $tenantId)->where('product_id', $g->product_id)
                ->where('warehouse_id', $g->warehouse_id)->whereNull('deleted_at')->sum('remaining_qty');
            if ($onHand + 0.00005 >= (float) $g->held) {
                continue;
            }
            $orders = DB::table('commerce_stock_holds as h')->join('commerce_orders as o', 'o.id', '=', 'h.order_id')
                ->where('h.tenant_id', $tenantId)->where('h.product_id', $g->product_id)->where('h.warehouse_id', $g->warehouse_id)->where('h.status', 'active')
                ->orderByDesc('h.created_at')->get(['o.id', 'o.public_number']);
            foreach ($orders as $o) {
                if (DB::table('commerce_notifications')->where('order_id', $o->id)->where('type', 'stock_conflict')->exists()) {
                    continue;
                }
                DB::table('commerce_notifications')->insert(['tenant_id' => $tenantId, 'order_id' => $o->id, 'type' => 'stock_conflict',
                    'title' => 'Order ' . $o->public_number . ' is short on stock: a counter sale recorded while offline used units this order holds. Fix stock or contact the customer.',
                    'created_at' => now(), 'updated_at' => now()]);
                $n++;
            }
        }
        return $n;
    }
}
