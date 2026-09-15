<?php

namespace App\Services\VenSynQ;

use App\Models\Product;
use App\Models\Sale;
use App\Models\Warehouse;
use App\Models\Stock;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;

/**
 * VenSynQService — Post-Launch SaaS Sync Engine
 *
 * Implements cross-store synchronization, centralized dashboards, and multi-tenant transfers.
 * Highly conservative design: bypasses global tenant scope using withoutTenantScope() and
 * explicitly handles tenant contexts on write.
 */
class VenSynQService
{
    /**
     * Propagate product creation/updates across multiple stores.
     * Matches on product SKU (canonical identifier across merchant contexts).
     *
     * @param  Product  $sourceProduct
     * @param  array    $targetTenantIds
     * @return void
     */
    public function syncProductAcrossStores(Product $sourceProduct, array $targetTenantIds): void
    {
        foreach ($targetTenantIds as $tenantId) {
            Product::withoutTenantScope()->updateOrCreate(
                [
                    'tenant_id' => $tenantId,
                    'sku'       => $sourceProduct->sku,
                ],
                [
                    'name'        => $sourceProduct->name,
                    'description' => $sourceProduct->description,
                    'cost_price'  => $sourceProduct->cost_price,
                    'price'       => $sourceProduct->price,
                    'base_unit'   => $sourceProduct->base_unit ?? $sourceProduct->unit ?? 'pcs',
                    'tax_rate'    => $sourceProduct->tax_rate ?? 0.00,
                    'type'        => $sourceProduct->type ?? 'standard',
                ]
            );
        }
    }

    /**
     * Compute consolidated revenue from all posted sales across merchant's stores.
     *
     * @param  array  $tenantIds
     * @return float
     */
    public function getConsolidatedRevenue(array $tenantIds): float
    {
        return (float) Sale::withoutTenantScope()
            ->whereIn('tenant_id', $tenantIds)
            ->posted()
            ->sum('total');
    }

    /**
     * Atomically transfer stock from one store's warehouse to another.
     *
     * @param  string  $sourceWarehouseId
     * @param  string  $targetWarehouseId
     * @param  string  $sku
     * @param  float   $qty
     * @return bool
     *
     * @throws \InvalidArgumentException If source has insufficient stock
     */
    public function transferStockBetweenStores(
        string $sourceWarehouseId,
        string $targetWarehouseId,
        string $sku,
        float $qty
    ): bool {
        return DB::transaction(function () use ($sourceWarehouseId, $targetWarehouseId, $sku, $qty) {
            // Retrieve warehouses across tenants
            $sourceWarehouse = Warehouse::withoutTenantScope()->findOrFail($sourceWarehouseId);
            $targetWarehouse = Warehouse::withoutTenantScope()->findOrFail($targetWarehouseId);

            // Retrieve products in their respective tenant contexts by SKU
            $sourceProduct = Product::withoutTenantScope()
                ->where('tenant_id', $sourceWarehouse->tenant_id)
                ->where('sku', $sku)
                ->firstOrFail();

            $targetProduct = Product::withoutTenantScope()
                ->where('tenant_id', $targetWarehouse->tenant_id)
                ->where('sku', $sku)
                ->firstOrFail();

            // Retrieve source stock entry
            $sourceStock = Stock::withoutTenantScope()
                ->where('warehouse_id', $sourceWarehouseId)
                ->where('product_id', $sourceProduct->id)
                ->first();

            if (!$sourceStock || $sourceStock->quantity < $qty) {
                throw new \InvalidArgumentException("Insufficient stock in source warehouse");
            }

            // Deduct stock from source warehouse and source product aggregate
            $sourceStock->decrement('quantity', $qty);
            $sourceProduct->decrement('stock_quantity', $qty);

            // Increment (or create) stock in target warehouse and target product aggregate
            $targetStock = Stock::withoutTenantScope()
                ->where('warehouse_id', $targetWarehouseId)
                ->where('product_id', $targetProduct->id)
                ->first();

            if ($targetStock) {
                $targetStock->increment('quantity', $qty);
            } else {
                Stock::withoutTenantScope()->create([
                    'tenant_id'         => $targetWarehouse->tenant_id,
                    'warehouse_id'      => $targetWarehouseId,
                    'product_id'        => $targetProduct->id,
                    'quantity'          => $qty,
                    'reserved_quantity' => 0,
                ]);
            }
            $targetProduct->increment('stock_quantity', $qty);

            // Record audit compliance movements in both tenants
            StockMovement::withoutTenantScope()->create([
                'tenant_id'    => $sourceWarehouse->tenant_id,
                'product_id'   => $sourceProduct->id,
                'warehouse_id' => $sourceWarehouseId,
                'quantity'     => -$qty,
                'type'         => 'transfer',
                'description'  => "Cross-store transfer deduction to Warehouse {$targetWarehouseId} (Store {$targetWarehouse->tenant_id})",
            ]);

            StockMovement::withoutTenantScope()->create([
                'tenant_id'    => $targetWarehouse->tenant_id,
                'product_id'   => $targetProduct->id,
                'warehouse_id' => $targetWarehouseId,
                'quantity'     => $qty,
                'type'         => 'transfer',
                'description'  => "Cross-store transfer credit from Warehouse {$sourceWarehouseId} (Store {$sourceWarehouse->tenant_id})",
            ]);

            return true;
        });
    }
}
