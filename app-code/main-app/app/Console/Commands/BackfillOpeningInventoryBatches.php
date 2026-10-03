<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * BackfillOpeningInventoryBatches
 *
 * Ensures that any product with stock on hand in the `stocks` table
 * has at least one valid FIFO batch in `inventory_batches`.
 *
 * VenQore's FinancialReportingService::getInventoryValue() and low-stock queries
 * calculate inventory value and remaining stock strictly from `inventory_batches`.
 * If a seeder or legacy import inserts rows into `stocks` without seeding
 * `inventory_batches`, inventory valuation falls to $0.00 and all items flag as low stock.
 */
class BackfillOpeningInventoryBatches extends Command
{
    protected $signature = 'inventory:backfill-opening-batches
        {--tenant= : Specific tenant ID to backfill}
        {--dry-run : Preview changes without inserting batches}';

    protected $description = 'Seed missing FIFO opening batches for products that have stock in the stocks table.';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $tenantId = $this->option('tenant');

        $this->info('══════════════════════════════════════════════════════');
        $this->info('  VenQore Opening Inventory Batch Backfill');
        if ($dryRun) {
            $this->warn('  DRY-RUN MODE — No database changes will be saved');
        }
        $this->info('══════════════════════════════════════════════════════');

        $tenantsQuery = DB::table('tenants')->select('id', 'name', 'slug');
        if ($tenantId) {
            $tenantsQuery->where('id', $tenantId);
        }
        $tenants = $tenantsQuery->get();

        $totalBatchesCreated = 0;

        foreach ($tenants as $tenant) {
            // Find products for this tenant that have stocks > 0 but ZERO inventory_batches
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

            $this->line("Tenant {$tenant->id} ({$tenant->name}): found {$productsWithoutBatches->count()} products missing FIFO batches.");

            $defaultWarehouseId = DB::table('warehouses')
                ->where('tenant_id', $tenant->id)
                ->where('is_default', 1)
                ->value('id')
                ?? DB::table('warehouses')->where('tenant_id', $tenant->id)->value('id');

            foreach ($productsWithoutBatches as $product) {
                // Determine quantity from stocks table, falling back to product.stock_quantity
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

                        if (!$dryRun) {
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
                        $totalBatchesCreated++;
                    }
                } elseif ((float) $product->stock_quantity > 0 && $defaultWarehouseId) {
                    $qty = (float) $product->stock_quantity;
                    if (!$dryRun) {
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
                    $totalBatchesCreated++;
                }
            }
        }

        $this->info("Completed. {$totalBatchesCreated} FIFO batch records " . ($dryRun ? 'identified for creation' : 'created successfully') . ".");
        return self::SUCCESS;
    }
}
