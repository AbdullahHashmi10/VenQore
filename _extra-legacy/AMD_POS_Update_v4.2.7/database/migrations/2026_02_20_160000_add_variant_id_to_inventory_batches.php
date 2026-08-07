<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('inventory_batches', function (Blueprint $table) {
            $table->uuid('variant_id')->nullable()->after('product_id')
                ->comment('If set, this batch is for a specific product variant');
            
            $table->foreign('variant_id')
                ->references('id')->on('product_variants')->nullOnDelete();

            // The existing index 'inv_batches_fifo_idx' only has [product_id, warehouse_id, remaining_qty, created_at].
            // We need a more specific index that includes variant_id for speed.
            $table->index(['product_id', 'variant_id', 'warehouse_id', 'remaining_qty', 'created_at'], 'inv_batches_variant_fifo_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inventory_batches', function (Blueprint $table) {
            $table->dropForeign(['variant_id']);
            $table->dropIndex('inv_batches_variant_fifo_idx');
            $table->dropColumn('variant_id');
        });
    }
};
