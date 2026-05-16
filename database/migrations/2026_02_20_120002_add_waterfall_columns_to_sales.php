<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 2.1 — The Sale Waterfall (Section 2.1 of CALCULATION_LOGIC.md)
 *
 * WHY THIS MIGRATION EXISTS:
 * SaleController::store() writes `subtotal_gross`, `total_item_discounts`,
 * `global_discount`, `net_sales`, `total_tax`, `shipping_charges`, and
 * `invoice_total` to the sales header on every sale. The columns did not exist.
 * Every Sale::create() was silently discarding these values.
 *
 * This means every sale in the database currently has:
 *   - net_sales = NULL  (Revenue is missing)
 *   - invoice_total = NULL  (The canonical "what the customer owes" is missing)
 *
 * And every financial query that tries to use net_sales falls back to `total`,
 * which is tax-inclusive — inflating Revenue by the tax amount on every sale.
 *
 * COLUMN DEFINITIONS (from CALCULATION_LOGIC.md § 2.1):
 *
 *   subtotal_gross        = SUM(sale_items.gross_amount)
 *   total_item_discounts  = SUM(sale_items.discount_amount)
 *   global_discount       = bill-level discount entered at checkout
 *   net_sales             = subtotal_gross - total_item_discounts - global_discount
 *                         ► THIS IS REVENUE. The P&L reads this.
 *   total_tax             = SUM(sale_items.tax_amount) — goes to Tax Payable, NOT Revenue
 *   shipping_charges      = extra fees added to invoice
 *   invoice_total         = net_sales + total_tax + shipping_charges
 *                         ► This is what the customer OWES. AR = invoice_total.
 *
 * BACKWARD COMPATIBILITY:
 * The existing columns (`subtotal`, `tax`, `discount`, `total`) are kept unchanged.
 * - `subtotal` maps to subtotal_gross (gross sales before discounts)
 * - `tax` maps to total_tax
 * - `discount` maps to global_discount
 * - `total` maps to invoice_total (rounded)
 * New code reads the waterfall columns. Legacy queries keep reading the old columns.
 *
 * Also adds `posted_at` and `tendered_amount` if they are missing.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            if (!Schema::hasColumn('sales', 'subtotal_gross')) {
                $table->decimal('subtotal_gross', 20, 4)->default(0)->after('subtotal')
                    ->comment('SUM(sale_items.gross_amount) — gross sales before any discount');
            }
            if (!Schema::hasColumn('sales', 'total_item_discounts')) {
                $table->decimal('total_item_discounts', 20, 4)->default(0)->after('subtotal_gross')
                    ->comment('SUM(sale_items.discount_amount) — total per-line discounts');
            }
            if (!Schema::hasColumn('sales', 'global_discount')) {
                $table->decimal('global_discount', 20, 4)->default(0)->after('total_item_discounts')
                    ->comment('Bill-level discount applied at checkout (not per-item)');
            }
            if (!Schema::hasColumn('sales', 'net_sales')) {
                $table->decimal('net_sales', 20, 4)->default(0)->after('global_discount')
                    ->comment('THE REVENUE COLUMN: subtotal_gross - total_item_discounts - global_discount. Never tax-inclusive.');
            }
            if (!Schema::hasColumn('sales', 'total_tax')) {
                $table->decimal('total_tax', 20, 4)->default(0)->after('net_sales')
                    ->comment('SUM(sale_items.tax_amount). Goes to Tax Payable liability. NOT Revenue.');
            }
            if (!Schema::hasColumn('sales', 'shipping_charges')) {
                $table->decimal('shipping_charges', 20, 4)->default(0)->after('total_tax')
                    ->comment('Extra delivery/handling fees added to the invoice');
            }
            if (!Schema::hasColumn('sales', 'invoice_total')) {
                $table->decimal('invoice_total', 20, 4)->default(0)->after('shipping_charges')
                    ->comment('net_sales + total_tax + shipping_charges. What the customer owes. AR source.');
            }
            if (!Schema::hasColumn('sales', 'tendered_amount')) {
                $table->decimal('tendered_amount', 20, 4)->default(0)->after('invoice_total')
                    ->comment('Cash/card amount tendered by the customer at POS');
            }
            if (!Schema::hasColumn('sales', 'change_return')) {
                $table->decimal('change_return', 20, 4)->default(0)->after('tendered_amount')
                    ->comment('Change given back to customer: tendered_amount - invoice_total');
            }
            if (!Schema::hasColumn('sales', 'round_off')) {
                $table->decimal('round_off', 20, 4)->default(0)->after('change_return')
                    ->comment('Rounding difference applied to final invoice total');
            }
            if (!Schema::hasColumn('sales', 'posted_at')) {
                $table->timestamp('posted_at')->nullable()->after('round_off')
                    ->comment('Revenue recognition timestamp (accrual date). NULL = draft/unposted.');
            }
        });

        // Backfill: for existing sales, populate waterfall columns from legacy columns
        // net_sales = total - tax (the best approximation we can make without item-level data)
        // invoice_total = total (they are the same thing in the old schema)
        \Illuminate\Support\Facades\DB::statement("
            UPDATE sales
            SET
                subtotal_gross       = COALESCE(subtotal, 0),
                total_item_discounts = 0,
                global_discount      = COALESCE(`discount`, 0),
                net_sales            = GREATEST(0, COALESCE(total, 0) - COALESCE(tax, 0)),
                total_tax            = COALESCE(tax, 0),
                shipping_charges     = 0,
                invoice_total        = COALESCE(total, 0)
            WHERE net_sales = 0
        ");
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $columns = [
                'subtotal_gross', 'total_item_discounts', 'global_discount',
                'net_sales', 'total_tax', 'shipping_charges', 'invoice_total',
                'tendered_amount', 'change_return', 'round_off', 'posted_at',
            ];
            $existing = array_filter($columns, fn($c) => Schema::hasColumn('sales', $c));
            if ($existing) {
                $table->dropColumn(array_values($existing));
            }
        });
    }
};
