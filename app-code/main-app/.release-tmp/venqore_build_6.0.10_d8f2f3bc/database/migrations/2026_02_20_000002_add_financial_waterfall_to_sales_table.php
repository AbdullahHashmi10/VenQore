<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Phase 1.1 — The Gross Sale vs. Net Sale
     * Adds the full financial waterfall to the sales (header) table.
     * This separates Gross Sales → Discounts → Net Sales → Tax → Invoice Total.
     * net_sales is the ONLY column that represents Revenue. It is never tax-inclusive.
     */
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            // New explicitly structured columns for Phase 1.1 Gross vs Net calculation
            if (!Schema::hasColumn('sales', 'subtotal_gross')) {
                $table->decimal('subtotal_gross', 20, 4)->default(0)->after('subtotal');
            }
            if (!Schema::hasColumn('sales', 'total_item_discounts')) {
                $table->decimal('total_item_discounts', 20, 4)->default(0)->after('subtotal_gross');
            }
            if (!Schema::hasColumn('sales', 'global_discount')) {
                $table->decimal('global_discount', 20, 4)->default(0)->after('total_item_discounts');
            }
            if (!Schema::hasColumn('sales', 'net_sales')) {
                $table->decimal('net_sales', 20, 4)->default(0)->after('global_discount'); // ← THE REVENUE COLUMN
            }
            if (!Schema::hasColumn('sales', 'total_tax')) {
                $table->decimal('total_tax', 20, 4)->default(0)->after('net_sales');
            }
            if (!Schema::hasColumn('sales', 'shipping_charges')) {
                $table->decimal('shipping_charges', 20, 4)->default(0)->after('total_tax');
            }
            if (!Schema::hasColumn('sales', 'invoice_total')) {
                $table->decimal('invoice_total', 20, 4)->default(0)->after('shipping_charges');
            }
        });

        // Backfill existing records:
        // subtotal_gross = subtotal (pre-discount sum from existing data)
        // global_discount = discount (the old global discount column)
        // net_sales = subtotal - discount (no item discounts in legacy data)
        // total_tax = tax (the old tax column)
        // invoice_total = total (the existing final amount)
        DB::statement('
            UPDATE sales
            SET
                subtotal_gross     = subtotal,
                total_item_discounts = 0,
                global_discount    = COALESCE(discount, 0),
                net_sales          = subtotal - COALESCE(discount, 0),
                total_tax          = COALESCE(tax, 0),
                shipping_charges   = 0,
                invoice_total      = COALESCE(`total`, 0)
            WHERE net_sales = 0 AND subtotal > 0
        ');
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn([
                'subtotal_gross',
                'total_item_discounts',
                'global_discount',
                'net_sales',
                'total_tax',
                'shipping_charges',
                'invoice_total',
            ]);
        });
    }
};
