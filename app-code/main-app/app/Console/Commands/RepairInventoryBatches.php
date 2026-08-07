<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * RepairInventoryBatches
 *
 * The autoHealStockIntegrity() method in InventoryController was incorrectly
 * overwriting the most-recent inventory_batch.remaining_qty for every product
 * with that product's TOTAL stock count. This destroyed accurate FIFO multi-batch
 * data, causing the inventory value to plummet (only one poorly-costed batch
 * survived instead of the full set of properly-costed FIFO batches).
 *
 * This command repairs the damage by:
 *   1. For each product, collecting all its non-deleted inventory_batches (oldest first).
 *   2. Taking the actual current stock quantity from the stocks table.
 *   3. Distributing that quantity across the batches in FIFO order (oldest filled first).
 *   4. Updating each batch's remaining_qty accordingly.
 *
 * Net result: remaining_qty values are restored to realistic FIFO amounts,
 * and the FIFO unit_cost on each batch is preserved, restoring correct valuation.
 */
class RepairInventoryBatches extends Command
{
    protected $signature   = 'inventory:repair-batches {--dry-run : Preview changes without writing to DB}';
    protected $description = 'Restore inventory_batches.remaining_qty after auto-healer corruption.';

    public function handle(): int
    {
        $dryRun = $this->option('dry-run');

        $this->info('');
        $this->info('══════════════════════════════════════════════════════');
        $this->info('  Inventory Batch Repair');
        if ($dryRun) {
            $this->warn('  DRY-RUN MODE — No changes will be written');
        }
        $this->info('══════════════════════════════════════════════════════');
        $this->info('');

        // ─── 1. Load products that have at least one inventory_batch ──────────
        $products = DB::table('products')
            ->whereNull('deleted_at')
            ->whereExists(function ($q) {
                $q->select(DB::raw(1))
                  ->from('inventory_batches')
                  ->whereColumn('inventory_batches.product_id', 'products.id')
                  ->whereNull('inventory_batches.deleted_at');
            })
            ->select('id', 'name', 'cost_price')
            ->orderBy('name')
            ->get();

        $this->info("Found {$products->count()} products with inventory batches.");
        $this->info('');

        $totalValueBefore = 0;
        $totalValueAfter  = 0;
        $productsFixed    = 0;
        $batchesUpdated   = 0;

        foreach ($products as $product) {
            // ─── 2. Current actual stock on-hand ──────────────────────────────
            $currentStock = (float) DB::table('stocks')
                ->where('product_id', $product->id)
                ->sum('quantity');

            if ($currentStock < 0) {
                $currentStock = 0;
            }

            // ─── 3. All FIFO batches for this product, oldest first ────────────
            $batches = DB::table('inventory_batches')
                ->where('product_id', $product->id)
                ->whereNull('deleted_at')
                ->orderBy('created_at', 'asc')
                ->get();

            // ─── 4. Current inventory value for this product (before) ──────────
            $valueBefore = $batches->sum(fn($b) => (float) $b->remaining_qty * (float) $b->unit_cost);
            $totalValueBefore += $valueBefore;

            // ─── 5. Distribute currentStock across batches (FIFO: oldest first) ─
            $poolRemaining = $currentStock;
            $newRemainingMap = []; // batch_id => new remaining_qty

            foreach ($batches as $batch) {
                $originalQty = (float) $batch->original_qty;
                $assignQty   = min($originalQty, max(0, $poolRemaining));
                $newRemainingMap[$batch->id] = $assignQty;
                $poolRemaining -= $assignQty;
            }

            // ─── 6. Compute value after ──────────────────────────────────────
            $valueAfter = 0;
            foreach ($batches as $batch) {
                $valueAfter += $newRemainingMap[$batch->id] * (float) $batch->unit_cost;
            }
            $totalValueAfter += $valueAfter;

            // ─── 7. Check if anything changed ─────────────────────────────────
            $changed = false;
            foreach ($batches as $batch) {
                if (abs((float)$batch->remaining_qty - $newRemainingMap[$batch->id]) > 0.0001) {
                    $changed = true;
                    break;
                }
            }

            if (!$changed) {
                continue;
            }

            $productsFixed++;

            $this->line(sprintf(
                '  %-40s  Stock: %8.2f  Value Before: %10.2f  Value After: %10.2f  Δ: %+.2f',
                mb_substr($product->name, 0, 40),
                $currentStock,
                $valueBefore,
                $valueAfter,
                $valueAfter - $valueBefore
            ));

            // ─── 8. Write the repaired remaining_qty values ──────────────────
            if (!$dryRun) {
                foreach ($batches as $batch) {
                    $newQty = $newRemainingMap[$batch->id];
                    if (abs((float)$batch->remaining_qty - $newQty) > 0.0001) {
                        DB::table('inventory_batches')
                            ->where('id', $batch->id)
                            ->update([
                                'remaining_qty' => $newQty,
                                'updated_at'    => now(),
                            ]);
                        $batchesUpdated++;
                    }
                }
            }
        }

        $this->info('');
        $this->info('══════════════════════════════════════════════════════');
        $this->info(sprintf('  Products changed : %d', $productsFixed));
        $this->info(sprintf('  Total value before: Rs %s', number_format($totalValueBefore, 2)));
        $this->info(sprintf('  Total value after : Rs %s', number_format($totalValueAfter, 2)));
        $this->info(sprintf('  Net change        : Rs %s', number_format($totalValueAfter - $totalValueBefore, 2)));
        if (!$dryRun) {
            $this->info(sprintf('  Batches updated   : %d', $batchesUpdated));
            $this->info('');
            $this->info('  ✅ Repair complete. Refresh the inventory page to see the correct value.');
        } else {
            $this->warn('  DRY-RUN — run without --dry-run to apply changes.');
        }
        $this->info('══════════════════════════════════════════════════════');
        $this->info('');

        return Command::SUCCESS;
    }
}
