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
 * Holds are enforced, not just promised: HoldGuard blocks POS sales, stock transfers and stock adjustments from
 * consuming units an accepted online order is holding.
 */
class StockAvailability
{
    /** @var array<string,float> request-scoped cache filled by prime() so a catalogue page does not query per product */
    private array $primed = [];
    private array $primedPending = [];

    /** Compute availability and waiting-order demand for many products with a handful of grouped queries. */
    public function prime(int $tenantId, string $warehouseId, array $productIds): void
    {
        $ids = array_values(array_unique(array_filter($productIds)));
        if (! $ids) {
            return;
        }
        $onHand = DB::table('inventory_batches')->where('tenant_id', $tenantId)->where('warehouse_id', $warehouseId)->whereNull('deleted_at')
            ->whereIn('product_id', $ids)->groupBy('product_id')->selectRaw('product_id, SUM(remaining_qty) q')->pluck('q', 'product_id');
        $presale = DB::table('sales_order_items as soi')->join('sales_orders as so', 'soi.sales_order_id', '=', 'so.id')
            ->where('soi.tenant_id', $tenantId)->whereIn('soi.product_id', $ids)->whereNull('so.deleted_at')->whereNull('soi.deleted_at')
            ->whereNotIn('so.status', ['cancelled', 'completed', 'delivered', 'converted'])->groupBy('soi.product_id')->selectRaw('soi.product_id, SUM(soi.quantity_reserved) q')->pluck('q', 'product_id');
        $smart = DB::table('stocks')->where('tenant_id', $tenantId)->where('warehouse_id', $warehouseId)->whereIn('product_id', $ids)
            ->groupBy('product_id')->selectRaw('product_id, SUM(reserved_quantity) q')->pluck('q', 'product_id');
        $holds = DB::table('commerce_stock_holds')->where('tenant_id', $tenantId)->where('warehouse_id', $warehouseId)->where('status', 'active')
            ->whereIn('product_id', $ids)->groupBy('product_id')->selectRaw('product_id, SUM(quantity) q')->pluck('q', 'product_id');
        $pending = DB::table('commerce_order_items as i')->join('commerce_orders as o', 'o.id', '=', 'i.order_id')
            ->where('o.tenant_id', $tenantId)->where('o.status', 'pending')->whereIn('i.product_id', $ids)->groupBy('i.product_id')->selectRaw('i.product_id, SUM(i.quantity) q')->pluck('q', 'product_id');
        foreach ($ids as $id) {
            $k = $tenantId . '|' . $warehouseId . '|' . $id;
            $this->primed[$k] = round((float) ($onHand[$id] ?? 0) - (float) ($presale[$id] ?? 0) - (float) ($smart[$id] ?? 0) - (float) ($holds[$id] ?? 0), 4);
            $this->primedPending[$tenantId . '|' . $id] = (float) ($pending[$id] ?? 0);
        }
    }

    public function onHand(int $tenantId, string $productId, string $warehouseId, bool $locking = false): float
    {
        $q = DB::table('inventory_batches')
            ->where('tenant_id', $tenantId)->where('product_id', $productId)
            ->where('warehouse_id', $warehouseId)->whereNull('deleted_at');
        // A locking read returns the latest COMMITTED rows. A plain SELECT inside a REPEATABLE READ transaction
        // returns the snapshot taken at the transaction's first read and can miss a sale committed while we waited.
        return (float) ($locking ? $q->lockForUpdate()->sum('remaining_qty') : $q->sum('remaining_qty'));
    }

    public function available(int $tenantId, string $productId, string $warehouseId, ?string $excludeOrderId = null, bool $locking = false): float
    {
        if (! $locking && ! $excludeOrderId && isset($this->primed[$tenantId . '|' . $warehouseId . '|' . $productId])) {
            return $this->primed[$tenantId . '|' . $warehouseId . '|' . $productId];
        }
        $onHand = $this->onHand($tenantId, $productId, $warehouseId, $locking);

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

        return round($onHand - $presale - $smart - (float) ($locking ? $holds->lockForUpdate()->sum('quantity') : $holds->sum('quantity')), 4);
    }

    /** Units customers have ordered that the business has not accepted yet (they hold nothing, but they compete for the same stock). */
    public function pendingDemand(int $tenantId, string $productId): float
    {
        if (isset($this->primedPending[$tenantId . '|' . $productId])) {
            return $this->primedPending[$tenantId . '|' . $productId];
        }
        return (float) DB::table('commerce_order_items as i')->join('commerce_orders as o', 'o.id', '=', 'i.order_id')
            ->where('o.tenant_id', $tenantId)->where('o.status', 'pending')->where('i.product_id', $productId)->sum('i.quantity');
    }
}
