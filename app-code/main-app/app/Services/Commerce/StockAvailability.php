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
    /** Made-to-order items (track_stock off) have no shelf to run out of. */
    public const UNLIMITED = 1000000.0;
    /** @var array<string,bool> */
    private array $untrackedCache = [];

    /** @var array<int,bool> */
    private array $storeTrackingOff = [];

    /** Store-wide "Track stock quantities" switch (Settings > Stock & Items). Off = unlimited selling for every product. */
    public function trackingOff(int $tenantId): bool
    {
        if (! array_key_exists($tenantId, $this->storeTrackingOff)) {
            $v = DB::table('settings')->where('tenant_id', $tenantId)->where('key', 'stock_maintenance')->value('value');
            $this->storeTrackingOff[$tenantId] = $v !== null && in_array(strtolower(trim((string) $v)), ['0', 'false', 'off', 'no', ''], true);
        }

        return $this->storeTrackingOff[$tenantId];
    }

    public function isUntracked(int $tenantId, string $productId): bool
    {
        if ($this->trackingOff($tenantId)) {
            return true;
        }
        $k = $tenantId . '|' . $productId;
        if (! array_key_exists($k, $this->untrackedCache)) {
            $this->untrackedCache[$k] = (int) DB::table('products')->where('tenant_id', $tenantId)->where('id', $productId)->value('track_stock') === 0
                && DB::table('products')->where('tenant_id', $tenantId)->where('id', $productId)->exists();
        }

        return $this->untrackedCache[$k];
    }

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
        $untracked = $this->trackingOff($tenantId)
            ? $ids
            : DB::table('products')->where('tenant_id', $tenantId)->whereIn('id', $ids)->where('track_stock', 0)->pluck('id')->all();
        foreach ($untracked as $uid) {
            $this->untrackedCache[$tenantId . '|' . $uid] = true;
        }
        foreach ($ids as $id) {
            $k = $tenantId . '|' . $warehouseId . '|' . $id;
            if (in_array($id, $untracked, true)) {
                $this->primed[$k] = self::UNLIMITED;
                $this->primedPending[$tenantId . '|' . $id] = 0.0;
                continue;
            }
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
        if ($this->isUntracked($tenantId, $productId)) {
            return self::UNLIMITED;
        }
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

    /** @var array<string,bool> */
    private array $backorderCache = [];

    /**
     * True when the owner chose to keep selling this product online with nothing on the shelf
     * (storefront_products.sell_without_stock). The order is taken and the owner sources the goods.
     */
    public function sellsWithoutStock(int $tenantId, string $productId): bool
    {
        $k = $tenantId . '|' . $productId;
        if (! array_key_exists($k, $this->backorderCache)) {
            $this->backorderCache[$k] = DB::table('storefront_products')->where('tenant_id', $tenantId)
                ->where('product_id', $productId)->where('sell_without_stock', 1)->exists();
        }

        return $this->backorderCache[$k];
    }

    /**
     * Open online orders that contain "sell without stock" products the shelf cannot cover yet.
     * Demand = every unit on open orders (waiting + accepted); supply = what is physically on hand.
     *
     * @return array{products: list<array<string,mixed>>, orders: list<array<string,mixed>>}
     */
    public function sourcingNeeds(int $tenantId): array
    {
        $rows = DB::table('commerce_order_items as i')
            ->join('commerce_orders as o', 'o.id', '=', 'i.order_id')
            ->join('storefront_products as sp', fn ($j) => $j->on('sp.product_id', '=', 'i.product_id')->on('sp.tenant_id', '=', 'o.tenant_id'))
            ->where('o.tenant_id', $tenantId)->where('sp.sell_without_stock', 1)
            ->whereIn('o.status', ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'])
            ->get(['i.product_id', 'i.title', 'i.quantity', 'o.id as order_id', 'o.public_number', 'o.customer_name', 'o.status', 'o.warehouse_id']);
        if ($rows->isEmpty()) {
            return ['products' => [], 'orders' => []];
        }

        $short = [];
        foreach ($rows->groupBy(fn ($r) => $r->warehouse_id . '|' . $r->product_id) as $group) {
            $first = $group->first();
            if (! $first->warehouse_id) {
                continue;
            }
            $demand = (float) $group->sum('quantity');
            $have = max(0.0, $this->onHand($tenantId, $first->product_id, $first->warehouse_id));
            if ($demand > $have + 0.00001) {
                $short[$first->product_id] = ['product_id' => $first->product_id, 'title' => $first->title,
                    'ordered' => round($demand, 2), 'on_hand' => round($have, 2), 'to_source' => round($demand - $have, 2)];
            }
        }

        $orders = $rows->filter(fn ($r) => isset($short[$r->product_id]))->groupBy('order_id')->map(fn ($g) => [
            'id' => $g->first()->order_id, 'number' => $g->first()->public_number, 'customer' => $g->first()->customer_name,
            'status' => $g->first()->status, 'lines' => $g->map(fn ($r) => ['title' => $r->title, 'quantity' => (float) $r->quantity])->values()->all(),
        ])->values()->all();

        return ['products' => array_values($short), 'orders' => $orders];
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
