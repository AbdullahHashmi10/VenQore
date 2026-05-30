<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bill_of_materials', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('product_id');
            $table->integer('version')->default(1);
            $table->date('effective_from');
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('bom_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('bom_id');
            $table->uuid('product_id');
            $table->decimal('qty_per_unit', 10, 4);
            $table->boolean('is_byproduct')->default(false);
            $table->decimal('byproduct_nrv', 15, 2)->default(0);
            $table->timestamps();
        });

        Schema::table('production_runs', function (Blueprint $table) {
            if (!Schema::hasColumn('production_runs', 'bom_id')) {
                $table->uuid('bom_id')->nullable();
                $table->uuid('warehouse_id')->nullable();
                $table->decimal('planned_qty', 10, 4)->nullable();
                $table->decimal('actual_qty', 10, 4)->nullable();
                $table->decimal('wip_balance', 15, 2)->default(0);
                $table->decimal('material_cost', 15, 2)->default(0);
                $table->decimal('total_cost', 15, 2)->default(0);
                $table->uuid('journal_entry_id')->nullable();
                $table->uuid('created_by')->nullable();
                $table->timestamp('completed_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bom_items');
        Schema::dropIfExists('bill_of_materials');
        
        Schema::table('production_runs', function (Blueprint $table) {
            $table->dropColumn([
                'bom_id', 'warehouse_id', 'planned_qty', 'actual_qty', 
                'wip_balance', 'material_cost', 'total_cost', 
                'journal_entry_id', 'created_by', 'completed_at'
            ]);
        });
    }
};
