<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Sale reliability (8 Oct 2026) — additive only.
 *
 *  sales.idempotency_request_hash  sha256 of the business payload bound to the
 *                                  idempotency key (same key + different content → 409)
 *  sales.calculation_version       which sale calculation contract produced the
 *                                  stored amounts (2 = exact minor units, SaleTotals)
 *  sales.occurred_at               when the till rang the sale (offline replay keeps it)
 *
 * Existing rows keep NULL: they were posted by the legacy calculation and are
 * never recalculated. The existing (tenant_id, idempotency_key) unique index is
 * unchanged. No data is moved or dropped.
 */
return new class extends Migration
{
    public function up(): void
    {
        $this->saleItemColumns();
        $this->purchaseItemColumns();
        if (!Schema::hasTable('sales')) {
            return;
        }
        Schema::table('sales', function (Blueprint $table) {
            if (!Schema::hasColumn('sales', 'idempotency_request_hash')) {
                $table->char('idempotency_request_hash', 64)->nullable();
            }
            if (!Schema::hasColumn('sales', 'calculation_version')) {
                $table->unsignedSmallInteger('calculation_version')->nullable();
            }
            if (!Schema::hasColumn('sales', 'occurred_at')) {
                // When the till rang the sale. created_at stays the server's
                // receipt time; posted_at stays the accounting date.
                $table->timestamp('occurred_at')->nullable();
            }
        });
    }

    /**
     * sale_items.revenue_amount       what this line booked to revenue (ex tax,
     *                                 after its share of the bill discount)
     * sale_items.bill_discount_share  this line's exact share of the bill discount
     * Returns and cancellations refund what was BOOKED, from these — never by
     * re-pricing today. Old rows keep NULL and are valued from the sale's own
     * posted totals (see ReturnValuation).
     */
    private function saleItemColumns(): void
    {
        if (!Schema::hasTable('sale_items')) {
            return;
        }
        Schema::table('sale_items', function (Blueprint $table) {
            if (!Schema::hasColumn('sale_items', 'revenue_amount')) {
                $table->decimal('revenue_amount', 20, 4)->nullable();
            }
            if (!Schema::hasColumn('sale_items', 'bill_discount_share')) {
                $table->decimal('bill_discount_share', 20, 4)->nullable();
            }
        });
    }

    /**
     * purchase_items.returned_qty  how much of the line has gone back to the
     *                              supplier — caps returns and lets each return
     *                              take a cumulative (exact) share of what the
     *                              line booked (value, landed cost, tax).
     */
    private function purchaseItemColumns(): void
    {
        if (Schema::hasTable('purchase_items') && !Schema::hasColumn('purchase_items', 'returned_qty')) {
            Schema::table('purchase_items', function (Blueprint $table) {
                $table->decimal('returned_qty', 20, 4)->default(0);
            });
        }
    }

    public function down(): void
    {
        // Intentionally additive: dropping these would erase the duplicate-intent
        // evidence for sales posted under contract v2. Code rollback is safe with
        // the columns present (they are only written when they exist).
    }
};
