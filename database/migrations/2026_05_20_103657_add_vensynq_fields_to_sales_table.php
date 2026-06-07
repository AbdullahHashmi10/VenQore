<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            // ── VenSynQ: Channel Order Identification ─────────────────────────
            $table->boolean('is_dropship')->default(false)->after('notes');
            $table->unsignedBigInteger('ecommerce_channel_id')->nullable()->after('is_dropship');
            $table->string('channel_store_name')->nullable()->after('ecommerce_channel_id');
            $table->string('channel_order_id')->nullable()->after('channel_store_name');

            // ── VenSynQ: Fulfillment Type ──────────────────────────────────────
            // fbm  = deduct from home warehouse
            // fba  = revenue only, no local stock deduction (Amazon holds the stock)
            // jit  = buyer day purchased, auto-create JIT purchase draft
            $table->enum('fulfillment_type', ['fbm', 'fba', 'jit'])->default('fbm')->after('channel_order_id');

            // ── VenSynQ: Dispatch & Logistics ─────────────────────────────────
            $table->string('tracking_number')->nullable()->after('fulfillment_type');
            $table->string('shipping_carrier')->nullable()->after('tracking_number');
            $table->enum('dispatch_status', ['pending', 'dispatched', 'cancelled'])->default('pending')->after('shipping_carrier');

            // ── VenSynQ: Financial Accuracy Flags ─────────────────────────────
            // false = profit is ESTIMATED (JIT costs not yet confirmed by client)
            // true  = all linked JIT drafts approved, profit is CONFIRMED
            $table->boolean('financial_reconciled')->default(false)->after('dispatch_status');
            $table->string('channel_currency', 3)->default('GBP')->after('financial_reconciled');
            $table->decimal('gross_platform_fee', 10, 2)->nullable()->after('channel_currency');

            // ── VenSynQ: Unique index to prevent duplicate order ingestion ─────
            // Prevents duplicate invoices if cron runs twice or file uploaded twice
            $table->index(['tenant_id', 'ecommerce_channel_id', 'channel_order_id'], 'vensynq_channel_order_unique');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropIndex('vensynq_channel_order_unique');
            $table->dropColumn([
                'is_dropship',
                'ecommerce_channel_id',
                'channel_store_name',
                'channel_order_id',
                'fulfillment_type',
                'tracking_number',
                'shipping_carrier',
                'dispatch_status',
                'financial_reconciled',
                'channel_currency',
                'gross_platform_fee',
            ]);
        });
    }
};
