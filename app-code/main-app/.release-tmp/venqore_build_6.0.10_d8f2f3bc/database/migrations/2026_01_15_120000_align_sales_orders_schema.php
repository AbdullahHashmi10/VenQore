<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('sales_orders', function (Blueprint $table) {
            $table->decimal('discount', 15, 2)->default(0)->after('total_amount');
            $table->decimal('tax', 15, 2)->default(0)->after('discount');
            $table->decimal('delivery_charge', 15, 2)->default(0)->after('tax');
            $table->decimal('extra_charge_value', 15, 2)->default(0)->after('delivery_charge');
            $table->string('extra_charge_label')->nullable()->after('extra_charge_value');
        });

        Schema::table('sales_order_items', function (Blueprint $table) {
            $table->string('name')->nullable()->after('product_id');
            $table->decimal('discount', 15, 2)->default(0)->after('unit_price');
            $table->string('discount_type')->default('fixed')->after('discount');
        });
    }

    public function down(): void
    {
        Schema::table('sales_orders', function (Blueprint $table) {
            $table->dropColumn(['discount', 'tax', 'delivery_charge', 'extra_charge_value', 'extra_charge_label']);
        });
        Schema::table('sales_order_items', function (Blueprint $table) {
            $table->dropColumn(['name', 'discount', 'discount_type']);
        });
    }
};


