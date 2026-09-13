<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * L017 — V3 Sales Order schema alignment (part 2).
 *
 * Background:
 *   The original sales_order_items table (2026_01_10) defined:
 *       quantity_requested  INTEGER   NOT NULL   (no default)
 *   The V3 SalesOrderController writes `qty` (a decimal) and NEVER writes
 *   `quantity_requested`. On a strict-mode MySQL install that insert FAILS
 *   (missing NOT NULL column); on a non-strict install it silently stores 0,
 *   and every reader that reads `quantity_requested` (ReportController,
 *   InventoryController, the reservation logic) sees a zero quantity.
 *
 *   A prior migration (2026_07_08_000001) already ADDED the missing V3 columns
 *   (qty, sale_uom, discount_percent, tax_rate, line_total). This migration
 *   finishes the alignment so the two quantity columns can coexist safely:
 *
 *   1. Make quantity_requested a DECIMAL(10,4) (fractional sales are supported
 *      system-wide — 2.5 kg etc — and the model already casts it decimal:4).
 *   2. Give quantity_requested and quantity_reserved a default of 0 so a V3
 *      insert that (until the controller fix ships) only sets `qty` cannot fail.
 *   3. Backfill quantity_requested from qty for any rows already written by V3
 *      where quantity_requested is 0/NULL but qty has a real value.
 *
 * This is additive and idempotent. It does not drop or rename anything.
 */
return new class extends Migration
{
    public function up(): void
    {
        // 1 + 2: widen quantity_requested to decimal and make both qty columns safe-defaulted.
        // Use raw ALTER so we don't require doctrine/dbal for the column-type change.
        if (Schema::hasColumn('sales_order_items', 'quantity_requested')) {
            DB::statement("ALTER TABLE `sales_order_items`
                MODIFY `quantity_requested` DECIMAL(15,4) NOT NULL DEFAULT 0");
        }
        if (Schema::hasColumn('sales_order_items', 'quantity_reserved')) {
            DB::statement("ALTER TABLE `sales_order_items`
                MODIFY `quantity_reserved` DECIMAL(15,4) NOT NULL DEFAULT 0");
        }

        // 3: backfill quantity_requested from qty for rows the V3 controller wrote
        //    with only `qty` set (quantity_requested left at 0).
        if (Schema::hasColumn('sales_order_items', 'qty')
            && Schema::hasColumn('sales_order_items', 'quantity_requested')) {
            DB::statement("UPDATE `sales_order_items`
                SET `quantity_requested` = `qty`
                WHERE (`quantity_requested` IS NULL OR `quantity_requested` = 0)
                  AND `qty` IS NOT NULL AND `qty` > 0");
        }

        // Also backfill subtotal from line_total where subtotal is empty but line_total exists,
        // so item-level totals are consistent for both conventions.
        if (Schema::hasColumn('sales_order_items', 'line_total')
            && Schema::hasColumn('sales_order_items', 'subtotal')) {
            DB::statement("UPDATE `sales_order_items`
                SET `subtotal` = `line_total`
                WHERE (`subtotal` IS NULL OR `subtotal` = 0)
                  AND `line_total` IS NOT NULL AND `line_total` > 0");
        }
    }

    public function down(): void
    {
        // Revert the defaults only. We intentionally do NOT revert the widened
        // type or the backfilled data, as narrowing back to INTEGER would be lossy
        // for fractional quantities.
        if (Schema::hasColumn('sales_order_items', 'quantity_requested')) {
            DB::statement("ALTER TABLE `sales_order_items`
                MODIFY `quantity_requested` DECIMAL(15,4) NOT NULL");
        }
    }
};
