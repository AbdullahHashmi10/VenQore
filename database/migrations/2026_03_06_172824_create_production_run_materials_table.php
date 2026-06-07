<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('production_run_materials', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('production_run_id');
            $table->uuid('bom_item_id');
            $table->uuid('inventory_batch_id');
            $table->decimal('qty_deducted', 10, 4);
            $table->decimal('unit_cost', 15, 4);
            $table->decimal('total_cost', 15, 2);
            $table->timestamp('created_at');

            // Optionally add foreign keys if production_runs and inventory_batches exist
            // $table->foreign('production_run_id')->references('id')->on('production_runs');
            // $table->foreign('inventory_batch_id')->references('id')->on('inventory_batches');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('production_run_materials');
    }
};
