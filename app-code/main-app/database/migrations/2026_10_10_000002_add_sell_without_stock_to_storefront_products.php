<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
 * "Sell even when out of stock": the owner lists a product online and takes orders for it
 * although none is on the shelf, then sources it for the customer. Per listing, off by default.
 */
return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('storefront_products') && !Schema::hasColumn('storefront_products', 'sell_without_stock')) {
            Schema::table('storefront_products', function (Blueprint $table) {
                $table->boolean('sell_without_stock')->default(false);
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('storefront_products', 'sell_without_stock')) {
            Schema::table('storefront_products', function (Blueprint $table) {
                $table->dropColumn('sell_without_stock');
            });
        }
    }
};
