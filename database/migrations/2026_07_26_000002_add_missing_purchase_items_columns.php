<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Defensive migration to ensure all required columns on `purchase_items` exist.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('purchase_items')) {
            Schema::table('purchase_items', function (Blueprint $table) {
                if (!Schema::hasColumn('purchase_items', 'tax_rate')) {
                    $table->decimal('tax_rate', 5, 2)->default(0)->after('unit_cost');
                }
                if (!Schema::hasColumn('purchase_items', 'business_pct')) {
                    $table->decimal('business_pct', 5, 2)->default(100)->after('tax_rate');
                }
                if (!Schema::hasColumn('purchase_items', 'line_total')) {
                    $table->decimal('line_total', 15, 2)->default(0)->after('business_pct');
                }
                if (!Schema::hasColumn('purchase_items', 'inventory_batch_id')) {
                    $table->uuid('inventory_batch_id')->nullable()->after('line_total');
                }
            });
        }
    }

    public function down(): void
    {
        // No-op for data safety.
    }
};
