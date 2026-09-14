<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Phase 2.1 Infrastructure (created in Phase 1.1 implementation)
     * 
     * inventory_batches: The beating heart of FIFO.
     * Every purchase delivery creates one row here.
     * remaining_qty is decremented as items are sold (FIFO order by created_at ASC).
     * 
     * sale_item_batches: The immutable paper trail.
     * Links each sale line item to the exact batch(es) it consumed.
     * Stores the locked-in cost at time of sale — forever.
     */
    public function up(): void
    {
        // Table 1: inventory_batches
        // Represents a single delivery of goods at a specific cost.
        Schema::create('inventory_batches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('purchase_invoice_id')->nullable()->index(); // links to vendor bill reference
            $table->foreignUuid('warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();
            $table->decimal('original_qty', 12, 4)->default(0);
            $table->decimal('remaining_qty', 12, 4)->default(0); // THE CRITICAL COLUMN — decremented on sale
            $table->decimal('unit_cost', 20, 4)->default(0);     // What you paid per unit in THIS delivery
            $table->date('expiry_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Composite index for the FIFO query:
            // WHERE product_id = X AND warehouse_id = Y AND remaining_qty > 0 ORDER BY created_at ASC
            $table->index(['product_id', 'warehouse_id', 'remaining_qty', 'created_at'], 'inv_batches_fifo_idx');
        });

        // Table 2: sale_item_batches
        // The junction table: which batches were consumed to fulfill a specific sale line item.
        // This gives us the exact COGS for any sale, forever, even if batch costs change later.
        Schema::create('sale_item_batches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('sale_item_id')->constrained('sale_items')->cascadeOnDelete();
            $table->foreignUuid('inventory_batch_id')->constrained('inventory_batches')->restrictOnDelete();
            $table->decimal('qty_deducted', 12, 4)->default(0);
            $table->decimal('unit_cost', 20, 4)->default(0); // Snapshot of batch cost at time of sale — immutable
            $table->decimal('total_cogs', 20, 4)->default(0); // qty_deducted × unit_cost
            $table->timestamps();

            // Index for the COGS lookup: "Give me all batch costs for sale_item X"
            $table->index(['sale_item_id']);
            // Index for "Which sales touched this batch?" (for returns/audits)
            $table->index(['inventory_batch_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sale_item_batches');
        Schema::dropIfExists('inventory_batches');
    }
};
