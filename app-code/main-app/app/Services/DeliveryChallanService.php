<?php

namespace App\Services;

use App\Engines\FifoService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * The single place goods are dispatched against a sale.
 * Used by SaleController::storeDispatch and the approval adapter.
 *
 * - Records a numbered delivery challan from the chosen warehouse.
 * - Moves delivered_qty / delivery_status.
 * - Deducts stock from the dispatching warehouse ONLY for sales flagged
 *   stock_at_dispatch (stock for other sales already left at sale time).
 */
class DeliveryChallanService
{
    public function dispatch(int $tenantId, string $saleId, array $items, ?string $warehouseId, array $meta = [], ?int $userId = null): object
    {
        return DB::transaction(function () use ($tenantId, $saleId, $items, $warehouseId, $meta, $userId) {
            $sale = DB::table('sales')->where('tenant_id', $tenantId)->where('id', $saleId)->lockForUpdate()->firstOrFail();
            $saleItems = DB::table('sale_items')->where('tenant_id', $tenantId)->where('sale_id', $saleId)->get()->keyBy('id');

            if (!in_array($sale->status, ['posted', 'partially_returned'], true) || !empty($sale->deleted_at)) {
                throw new \DomainException('This invoice is voided or not posted, so nothing can be dispatched against it.');
            }

            $warehouseId = $warehouseId ?: $sale->warehouse_id;
            $warehouse = DB::table('warehouses')->where('tenant_id', $tenantId)->where('id', $warehouseId)
                ->whereNull('deleted_at')->where('is_active', 1)->first();
            if (!$warehouse) {
                throw new \DomainException('Choose an active warehouse to dispatch from.');
            }

            $deduct = !empty($sale->stock_at_dispatch);
            $challanId = Str::uuid()->toString();
            $lines = [];
            $dispatchCogs = 0.0;

            foreach ($items as $line) {
                $item = $saleItems[$line['sale_item_id'] ?? ''] ?? null;
                $qty = (float) ($line['dispatching_qty'] ?? 0);
                if (!$item || $qty <= 0) {
                    continue;
                }
                $remaining = (float) $item->quantity - (float) ($item->delivered_qty ?? 0);
                if ($qty > $remaining + 0.0001) {
                    throw new \DomainException("Cannot dispatch {$qty} — only {$remaining} remaining on item.");
                }

                if ($deduct) {
                    $dispatchCogs += $this->releaseStock($tenantId, $sale, $item, $qty, $warehouseId, $userId);
                }

                DB::table('sale_items')->where('tenant_id', $tenantId)->where('id', $item->id)->update([
                    'delivered_qty' => (float) ($item->delivered_qty ?? 0) + $qty,
                    'updated_at'    => now(),
                ]);

                $lines[] = [
                    'id' => Str::uuid()->toString(), 'tenant_id' => $tenantId,
                    'delivery_challan_id' => $challanId, 'sale_item_id' => $item->id,
                    'product_id' => $item->product_id, 'qty' => $qty,
                    'created_at' => now(), 'updated_at' => now(),
                ];
            }

            if (!$lines) {
                throw new \DomainException('Enter a dispatch quantity for at least one item.');
            }

            DB::table('delivery_challans')->insert([
                'id' => $challanId, 'tenant_id' => $tenantId, 'sale_id' => $saleId,
                'warehouse_id' => $warehouseId,
                'challan_number' => SequenceService::generateTransactionNumber('DC'),
                'dispatched_on' => now()->toDateString(),
                'carrier_name' => $meta['carrier_name'] ?? null,
                'tracking_number' => $meta['tracking_number'] ?? null,
                'notes' => $meta['notes'] ?? null,
                'stock_deducted' => $deduct,
                'created_by' => $userId,
                'created_at' => now(), 'updated_at' => now(),
            ]);
            DB::table('delivery_challan_items')->insert($lines);

            if ($deduct && $dispatchCogs > 0) {
                $acc = app(\App\Engines\AccountingService::class);
                $cogsAcc = $acc->getAccountByCode('5000', 'Cost of Goods Sold', 'expense');
                $invAcc  = $acc->getAccountByCode('1100', 'Inventory Asset', 'asset');
                $acc->createEntry([
                    'date'           => now()->toDateString(),
                    'reference_type' => 'sale_dispatch',
                    'reference'      => $saleId,
                    'description'    => "Cost of goods dispatched — #{$sale->reference_number}",
                    'party_id'       => $sale->party_id ?? null,
                ], [
                    ['account_id' => $cogsAcc->id, 'debit' => round($dispatchCogs, 2), 'credit' => 0, 'description' => "COGS — dispatch #{$sale->reference_number}"],
                    ['account_id' => $invAcc->id, 'debit' => 0, 'credit' => round($dispatchCogs, 2), 'description' => "Inventory reduction — dispatch #{$sale->reference_number}"],
                ]);
            }

            $fresh = DB::table('sale_items')->where('tenant_id', $tenantId)->where('sale_id', $saleId)->get();
            $all = $fresh->every(fn ($i) => (float) ($i->delivered_qty ?? 0) >= (float) $i->quantity - 0.0001);
            $any = $fresh->contains(fn ($i) => (float) ($i->delivered_qty ?? 0) > 0);
            $status = $all ? 'delivered' : ($any ? 'partial' : 'pending');
            DB::table('sales')->where('tenant_id', $tenantId)->where('id', $saleId)
                ->update(['delivery_status' => $status, 'updated_at' => now()]);

            return (object) ['challan_id' => $challanId, 'delivery_status' => $status];
        });
    }

    /**
     * Deliver-later sales: stock and its cost leave NOW, from the dispatching
     * warehouse — the same moves SaleController::store makes for a normal sale.
     * Returns the cost of goods released.
     */
    private function releaseStock(int $tenantId, object $sale, object $item, float $qty, string $warehouseId, ?int $userId): float
    {
        $product = DB::table('products')->where('tenant_id', $tenantId)->where('id', $item->product_id)->first();
        if (!$product || $product->type === 'service' || (isset($product->track_stock) && !$product->track_stock)) {
            return 0.0;
        }

        // Free units ride along with the paid ones, in proportion.
        $paid = (float) $item->quantity;
        $free = $paid > 0 ? round((float) ($item->free_quantity ?? 0) * ($qty / $paid), 4) : 0.0;
        $stockQty = $qty + $free;

        // A chosen batch only applies if it sits in the warehouse we dispatch from.
        $preferred = $item->preferred_batch_id ?? null;
        if ($preferred && !DB::table('inventory_batches')->where('tenant_id', $tenantId)->where('id', $preferred)->where('warehouse_id', $warehouseId)->exists()) {
            $preferred = null;
        }

        $deductions = app(FifoService::class)->deductStock(
            productId: $item->product_id,
            warehouseId: $warehouseId,
            qty: $stockQty,
            preferredBatchId: $preferred
        );

        $cogs = 0.0;
        foreach ($deductions as $d) {
            $cogs += (float) $d['total_cost'];
            DB::table('sale_item_batches')->insert([
                'id'                 => Str::uuid()->toString(),
                'tenant_id'          => $tenantId,
                'sale_item_id'       => $item->id,
                'inventory_batch_id' => $d['batch_id'],
                'qty_deducted'       => $d['qty_taken'],
                'unit_cost'          => $d['unit_cost'],
                'total_cogs'         => $d['total_cost'],
                'created_at'         => now(), 'updated_at' => now(),
            ]);
        }

        // Average cost of everything released so far on this line.
        $agg = DB::table('sale_item_batches')->where('tenant_id', $tenantId)->where('sale_item_id', $item->id)
            ->where('is_reversed', 0)->selectRaw('SUM(total_cogs) as c, SUM(qty_deducted) as q')->first();
        if ($agg && (float) $agg->q > 0) {
            DB::table('sale_items')->where('tenant_id', $tenantId)->where('id', $item->id)
                ->update(['cost_price' => round((float) $agg->c / (float) $agg->q, 4)]);
        }

        // The denormalised counters the POS and stock lists read.
        if (!empty($item->product_variant_id)) {
            \App\Models\ProductVariant::find($item->product_variant_id)?->decrement('stock', $stockQty);
        } else {
            $stockRow = \App\Models\Stock::where('product_id', $item->product_id)->where('warehouse_id', $warehouseId)->first();
            if ($stockRow) {
                $stockRow->decrement('quantity', $stockQty);
            } else {
                \App\Models\Stock::create(['product_id' => $item->product_id, 'warehouse_id' => $warehouseId, 'quantity' => -$stockQty]);
            }
        }
        \App\Models\Product::where('id', $item->product_id)->decrement('stock_quantity', $stockQty);
        \App\Models\StockMovement::create([
            'product_id' => $item->product_id, 'warehouse_id' => $warehouseId,
            'type' => 'sale', 'quantity' => -$stockQty,
            'reference_id' => $sale->reference_number, 'user_id' => $userId,
        ]);

        return $cogs;
    }
}
