<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sales_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('sales_orders', 'party_id')) {
                $table->uuid('party_id')->nullable()->after('customer_id');
            }
            if (!Schema::hasColumn('sales_orders', 'warehouse_id')) {
                $table->uuid('warehouse_id')->nullable()->after('party_id');
            }
            if (!Schema::hasColumn('sales_orders', 'created_by')) {
                $table->uuid('created_by')->nullable()->after('user_id');
            }
        });

        Schema::table('sales_order_items', function (Blueprint $table) {
            if (!Schema::hasColumn('sales_order_items', 'qty')) {
                $table->decimal('qty', 10, 4)->nullable()->after('quantity_requested');
            }
            if (!Schema::hasColumn('sales_order_items', 'sale_uom')) {
                $table->string('sale_uom', 20)->nullable()->after('qty');
            }
            if (!Schema::hasColumn('sales_order_items', 'discount_percent')) {
                $table->decimal('discount_percent', 5, 2)->default(0)->after('unit_price');
            }
            if (!Schema::hasColumn('sales_order_items', 'tax_rate')) {
                $table->decimal('tax_rate', 5, 2)->default(0)->after('discount_percent');
            }
            if (!Schema::hasColumn('sales_order_items', 'line_total')) {
                $table->decimal('line_total', 15, 2)->nullable()->after('subtotal');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_orders', function (Blueprint $table) {
            $table->dropColumn(['party_id', 'warehouse_id', 'created_by']);
        });

        Schema::table('sales_order_items', function (Blueprint $table) {
            $table->dropColumn(['qty', 'sale_uom', 'discount_percent', 'tax_rate', 'line_total']);
        });
    }
};
