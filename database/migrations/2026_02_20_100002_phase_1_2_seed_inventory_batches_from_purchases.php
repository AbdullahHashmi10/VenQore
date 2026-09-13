<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Phase 1.2 — Seed inventory_batches from existing purchase history.
 *
 * WHY THIS EXISTS:
 * The FifoService and inventory_batches table were created in Phase 2.1 (migration 2026_02_20_000003).
 * But the PurchaseController::store() was NOT yet wired to call FifoService::receiveBatch().
 * That means ALL existing purchase records that were "received" have ZERO inventory_batch rows.
 * FIFO cannot function without batch records.
 *
 * This is the historical backfill — a one-time run to give the FIFO engine its starting memory.
 *
 * LOGIC:
 * For every invoice_item where:
 *   - The parent invoice is type='purchase' AND status IN ('received', 'partial')
 *   - No inventory_batch already exists for this invoice_item (idempotent check)
 * → Create one inventory_batch record with:
 *   - original_qty  = received_qty (what was actually received, not just ordered)
 *   - remaining_qty = received_qty - units_already_sold_via_static_cost
 *   - unit_cost     = effective_unit_cost (or unit_price if effective is zero)
 *
 * REMAINING QTY CALCULATION:
 * We cannot perfectly reconstruct which historical sale consumed which historical batch.
 * What we CAN do is take the current Stock quantity per product and distribute it across
 * the batches in FIFO order (oldest first gets remaining stock credited first).
 * This is the only mathematically defensible approach without a full FIFO re-run.
 *
 * For the remaining_qty, we use the effective unit cost from the invoice_item
 * (which already includes landed cost distribution) as the FIFO batch unit_cost.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Fetch all received purchases ordered oldest-first (true FIFO order)
        $receivedItems = DB::table('invoice_items')
            ->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
            ->where('invoices.type', 'purchase')
            ->whereIn('invoices.status', ['received', 'partial'])
            ->where('invoice_items.received_qty', '>', 0)
            ->orderBy('invoices.created_at', 'asc') // FIFO: oldest first
            ->select(
                'invoice_items.id as item_id',
                'invoice_items.product_id',
                'invoice_items.received_qty',
                'invoice_items.effective_unit_cost',
                'invoice_items.unit_price',
                'invoices.id as invoice_id',
                'invoices.created_at'
            )
            ->get();

        // Get the default warehouse
        $warehouseId = DB::table('warehouses')->value('id');

        // Get current stock per product (from the stocks table — ground truth for qty on hand)
        $currentStocks = DB::table('stocks')
            ->where('warehouse_id', $warehouseId)
            ->pluck('quantity', 'product_id')
            ->toArray();

        // Track remaining available stock per product as we assign it to batches
        // We start with what's on the shelf and assign it to batches oldest-first
        $assignableStock = $currentStocks;

        // Build batch insert array
        $batches = [];

        foreach ($receivedItems as $item) {
            // Skip if inventory_batch already exists for this invoice_item (idempotent)
            $alreadyExists = DB::table('inventory_batches')
                ->where('purchase_invoice_id', $item->invoice_id)
                ->where('product_id', $item->product_id)
                ->exists();

            if ($alreadyExists) {
                continue;
            }

            $productId    = $item->product_id;
            $receivedQty  = (float) $item->received_qty;
            // Use effective_unit_cost if set (includes landed cost). Otherwise base price.
            $unitCost     = (float) ($item->effective_unit_cost > 0
                ? $item->effective_unit_cost
                : $item->unit_price);

            // Assign remaining stock to this batch in FIFO order.
            // The oldest batch gets as much remaining stock as it originally received,
            // then the next batch gets whatever is left, and so on.
            $availableForThisBatch = $assignableStock[$productId] ?? 0;
            $remainingQty = min($receivedQty, max(0, $availableForThisBatch));

            // Reduce the pool for the next batch
            $assignableStock[$productId] = max(0, $availableForThisBatch - $remainingQty);

            $batches[] = [
                'id'                  => \Illuminate\Support\Str::uuid()->toString(),
                'product_id'          => $productId,
                'purchase_invoice_id' => $item->invoice_id,
                'warehouse_id'        => $warehouseId,
                'original_qty'        => $receivedQty,
                'remaining_qty'       => $remainingQty,
                'unit_cost'           => $unitCost,
                'expiry_date'         => null,
                'notes'               => 'Seeded by Phase 1.2 backfill migration',
                'created_at'          => $item->created_at,
                'updated_at'          => now(),
            ];
        }

        // Bulk insert all batches
        if (!empty($batches)) {
            // Insert in chunks to avoid hitting MySQL's max_allowed_packet limit
            foreach (array_chunk($batches, 500) as $chunk) {
                DB::table('inventory_batches')->insert($chunk);
            }
            \Illuminate\Support\Facades\Log::info(
                'Phase 1.2 Backfill: Created ' . count($batches) . ' inventory_batch records from purchase history.'
            );
        } else {
            \Illuminate\Support\Facades\Log::info('Phase 1.2 Backfill: No purchase history to seed (all batches already exist or no received purchases).');
        }
    }

    public function down(): void
    {
        // Remove only the batches created by this backfill (identified by notes field)
        DB::table('inventory_batches')
            ->where('notes', 'Seeded by Phase 1.2 backfill migration')
            ->delete();
    }
};
