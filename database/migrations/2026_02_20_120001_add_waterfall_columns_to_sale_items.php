<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 2.1 — The Sale Waterfall (Section 2.1 of CALCULATION_LOGIC.md)
 *
 * WHY THIS MIGRATION EXISTS:
 * SaleController::store() has been calculating and writing line-level waterfall
 * columns (gross_amount, discount_amount, net_amount, tax_rate, tax_amount, line_total)
 * since Phase 1.1, but these columns did not exist in the database.
 * Every SaleItem::create() call was silently dropping these values.
 *
 * The consequence: every sale_items row in the database has NULL/missing waterfall
 * data, making item-level gross profit, discount analysis, and net revenue per line
 * impossible to calculate correctly from stored data.
 *
 * After this migration runs, SaleController::store() will successfully persist
 * the complete line-level financial waterfall for every new sale item.
 *
 * COLUMN DEFINITIONS (from CALCULATION_LOGIC.md § 2.1):
 *
 *   gross_amount    = quantity × unit_price                    (before any discount)
 *   discount_amount = item-level discount entered at POS       (per-line reduction)
 *   net_amount      = gross_amount - discount_amount           (the taxable base)
 *   tax_rate        = tax rate assigned to this product (%)    (Phase 2 scope: 0 for now)
 *   tax_amount      = net_amount × (tax_rate / 100)            (item-level tax)
 *   line_total      = net_amount + tax_amount                  (what this line costs the customer)
 *
 * BACKWARD COMPATIBILITY:
 * The existing `subtotal` column (= unit_price × quantity, no discount) is kept
 * for backward compatibility. It is now semantically equivalent to gross_amount
 * before free-quantity adjustments. New code should read net_amount, not subtotal.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            // Only add columns that don't already exist
            if (!Schema::hasColumn('sale_items', 'gross_amount')) {
                $table->decimal('gross_amount', 20, 4)->default(0)->after('unit_price')
                    ->comment('quantity × unit_price — gross before any discount');
            }
            if (!Schema::hasColumn('sale_items', 'discount_amount')) {
                $table->decimal('discount_amount', 20, 4)->default(0)->after('gross_amount')
                    ->comment('per-line discount amount entered at POS');
            }
            if (!Schema::hasColumn('sale_items', 'net_amount')) {
                $table->decimal('net_amount', 20, 4)->default(0)->after('discount_amount')
                    ->comment('gross_amount - discount_amount — the taxable base for this line');
            }
            if (!Schema::hasColumn('sale_items', 'tax_rate')) {
                $table->decimal('tax_rate', 8, 4)->default(0)->after('net_amount')
                    ->comment('tax rate applied to this line (%). Phase 2 scope — 0 for now.');
            }
            if (!Schema::hasColumn('sale_items', 'tax_amount')) {
                $table->decimal('tax_amount', 20, 4)->default(0)->after('tax_rate')
                    ->comment('net_amount × (tax_rate / 100)');
            }
            if (!Schema::hasColumn('sale_items', 'line_total')) {
                $table->decimal('line_total', 20, 4)->default(0)->after('tax_amount')
                    ->comment('net_amount + tax_amount — true billable amount for this line');
            }
        });
    }

    public function down(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            $columns = ['gross_amount', 'discount_amount', 'net_amount', 'tax_rate', 'tax_amount', 'line_total'];
            $existing = array_filter($columns, fn($c) => Schema::hasColumn('sale_items', $c));
            if ($existing) {
                $table->dropColumn(array_values($existing));
            }
        });
    }
};
