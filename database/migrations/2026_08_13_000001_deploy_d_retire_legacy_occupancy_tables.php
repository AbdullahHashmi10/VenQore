<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Deploy D — R-4 Occupancy Unification: Retire Legacy Tables.
 *
 * This is the final step of the four-stage occupancy rollout:
 *   Deploy A — Dual-write to both legacy + canonical tables           (DONE)
 *   Deploy B — Shadow-compare soak via vq:compare-occupancy           (DONE)
 *   Deploy C — Flip reads to canonical Position/Occupancy tables      (DONE)
 *   Deploy D — Drop legacy restaurant_tables and parked_sales tables  ← THIS MIGRATION
 *
 * Safe to run because:
 *   - All controllers now read/write canonical Position/Occupancy exclusively.
 *   - No model or controller imports RestaurantTable or ParkedSale for live data.
 *   - WorkOrder.table_id foreign key is dropped first (soft-reference, no hard FK existed).
 */
return new class extends Migration
{
    public function up(): void
    {
        // Drop the WorkOrder.table_id column that referenced restaurant_tables
        if (Schema::hasColumn('work_orders', 'table_id')) {
            Schema::table('work_orders', function (Blueprint $table) {
                $table->dropColumn('table_id');
            });
        }
        if (Schema::hasColumn('work_orders', 'table_number')) {
            Schema::table('work_orders', function (Blueprint $table) {
                $table->dropColumn('table_number');
            });
        }

        // Retire legacy tables
        Schema::dropIfExists('restaurant_tables');
        Schema::dropIfExists('parked_sales');
    }

    public function down(): void
    {
        // Restore restaurant_tables
        Schema::create('restaurant_tables', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id')->nullable()->index();
            $table->string('table_number');
            $table->string('name')->nullable();
            $table->unsignedInteger('capacity')->default(4);
            $table->string('status')->default('available');
            $table->decimal('order_total', 10, 2)->default(0);
            $table->timestamps();
        });

        // Restore parked_sales
        Schema::create('parked_sales', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->unsignedBigInteger('tenant_id')->nullable()->index();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->json('cart_data')->nullable();
            $table->string('customer_name')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        // Restore work_orders columns
        Schema::table('work_orders', function (Blueprint $table) {
            $table->unsignedBigInteger('table_id')->nullable();
            $table->string('table_number')->nullable();
        });
    }
};
