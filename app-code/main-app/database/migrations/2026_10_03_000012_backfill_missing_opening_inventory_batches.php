<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Backfill missing opening FIFO batches in `inventory_batches` for products
     * that have quantities in `stocks` but no batch records.
     */
    public function up(): void
    {
        $tenants = DB::table('tenants')->select('id')->get();

        foreach ($tenants as $tenant) {
            $productsWithoutBatches = DB::table('products as p')
                ->where('p.tenant_id', $tenant->id)
                ->whereNull('p.deleted_at')
                ->where(function ($q) {
                    $q->where('p.type', '!=', 'service')->orWhereNull('p.type');
                })
                ->whereNotExists(function ($q) {
                    $q->select(DB::raw(1))
                        ->from('inventory_batches as ib')
                        ->whereColumn('ib.product_id', 'p.id')
                        ->whereNull('ib.deleted_at');
                })
                ->select('p.id', 'p.name', 'p.cost_price', 'p.price', 'p.stock_quantity', 'p.tenant_id', 'p.created_at')
                ->get();

            if ($productsWithoutBatches->isEmpty()) {
                continue;
            }

            $defaultWarehouseId = DB::table('warehouses')
                ->where('tenant_id', $tenant->id)
                ->where('is_default', 1)
                ->value('id')
                ?? DB::table('warehouses')->where('tenant_id', $tenant->id)->value('id');

            foreach ($productsWithoutBatches as $product) {
                $stockRows = DB::table('stocks')
                    ->where('tenant_id', $tenant->id)
                    ->where('product_id', $product->id)
                    ->get();

                $cost = (float) $product->cost_price;
                if ($cost <= 0) {
                    $cost = (float) ($product->price > 0 ? round($product->price * 0.7, 2) : 1.00);
                }

                if ($stockRows->isNotEmpty()) {
                    foreach ($stockRows as $stock) {
                        $qty = (float) $stock->quantity;
                        if ($qty <= 0) continue;

                        $warehouseId = $stock->warehouse_id ?: $defaultWarehouseId;

                        DB::table('inventory_batches')->insert([
                            'id'            => (string) Str::uuid(),
                            'tenant_id'     => $tenant->id,
                            'product_id'    => $product->id,
                            'warehouse_id'  => $warehouseId,
                            'batch_type'    => 'opening',
                            'initial_qty'   => $qty,
                            'original_qty'  => $qty,
                            'remaining_qty' => $qty,
                            'unit_cost'     => $cost,
                            'notes'         => 'Auto-backfilled opening stock batch',
                            'created_at'    => $stock->created_at ?? $product->created_at ?? now(),
                            'updated_at'    => now(),
                        ]);
                    }
                } elseif ((float) $product->stock_quantity > 0 && $defaultWarehouseId) {
                    $qty = (float) $product->stock_quantity;
                    DB::table('inventory_batches')->insert([
                        'id'            => (string) Str::uuid(),
                        'tenant_id'     => $tenant->id,
                        'product_id'    => $product->id,
                        'warehouse_id'  => $defaultWarehouseId,
                        'batch_type'    => 'opening',
                        'initial_qty'   => $qty,
                        'original_qty'  => $qty,
                        'remaining_qty' => $qty,
                        'unit_cost'     => $cost,
                        'notes'         => 'Auto-backfilled opening stock batch from product stock_quantity',
                        'created_at'    => $product->created_at ?? now(),
                        'updated_at'    => now(),
                    ]);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Safe no-op or only remove batches with our specific note if needed
        DB::table('inventory_batches')
            ->whereIn('notes', [
                'Auto-backfilled opening stock batch',
                'Auto-backfilled opening stock batch from product stock_quantity'
            ])
            ->delete();
    }
};
