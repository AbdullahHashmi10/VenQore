<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Phase 1.1 — The Gross Sale vs. Net Sale
     * Adds the full financial waterfall to sale_items.
     * Every line item now stores its own complete math.
     */
    public function up(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            // The full line-level waterfall (all stored, never calculated on the fly)
            if (!Schema::hasColumn('sale_items', 'gross_amount')) {
                $table->decimal('gross_amount', 20, 4)->default(0)->after('unit_price');
            }
            if (!Schema::hasColumn('sale_items', 'discount_amount')) {
                $table->decimal('discount_amount', 20, 4)->default(0)->after('gross_amount');
            }
            if (!Schema::hasColumn('sale_items', 'net_amount')) {
                $table->decimal('net_amount', 20, 4)->default(0)->after('discount_amount');
            }
            if (!Schema::hasColumn('sale_items', 'tax_rate')) {
                $table->decimal('tax_rate', 8, 4)->default(0)->after('net_amount');
            }
            if (!Schema::hasColumn('sale_items', 'tax_amount')) {
                $table->decimal('tax_amount', 20, 4)->default(0)->after('tax_rate');
            }
            if (!Schema::hasColumn('sale_items', 'line_total')) {
                $table->decimal('line_total', 20, 4)->default(0)->after('tax_amount');
            }
        });

        // Backfill existing records with correct values derived from existing data
        // gross_amount = unit_price * quantity, net_amount = subtotal (which was price * qty pre-discount)
        // For legacy data: assume no item-level discounts, so gross = net = subtotal
        DB::statement('
            UPDATE sale_items
            SET
                gross_amount   = unit_price * (quantity + COALESCE(free_quantity, 0)),
                discount_amount = 0,
                net_amount     = unit_price * quantity,
                tax_rate       = 0,
                tax_amount     = 0,
                line_total     = unit_price * quantity
            WHERE gross_amount = 0
        ');
    }

    public function down(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropColumn(['gross_amount', 'discount_amount', 'net_amount', 'tax_rate', 'tax_amount', 'line_total']);
        });
    }
};
