<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds offline reserve quantity and online stock limit to storefront products.
 * Allows merchants to reserve stock for their physical/offline shop while publishing the rest online.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('storefront_products', function (Blueprint $t) {
            $t->decimal('offline_reserve_qty', 12, 4)->default(0)->after('allow_below_cost');
            $t->decimal('online_stock_limit', 12, 4)->nullable()->after('offline_reserve_qty');
        });
    }

    public function down(): void
    {
        Schema::table('storefront_products', function (Blueprint $t) {
            $t->dropColumn(['offline_reserve_qty', 'online_stock_limit']);
        });
    }
};
