<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('sales')) {
            Schema::table('sales', function (Blueprint $table) {
                if (!Schema::hasColumn('sales', 'delivery_status')) {
                    $table->string('delivery_status', 30)->default('delivered')->after('status')->index();
                }
            });
        }

        if (Schema::hasTable('sale_items')) {
            Schema::table('sale_items', function (Blueprint $table) {
                if (!Schema::hasColumn('sale_items', 'delivered_qty')) {
                    $table->decimal('delivered_qty', 10, 4)->default(0)->after('quantity');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('sales') && Schema::hasColumn('sales', 'delivery_status')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->dropColumn('delivery_status');
            });
        }

        if (Schema::hasTable('sale_items') && Schema::hasColumn('sale_items', 'delivered_qty')) {
            Schema::table('sale_items', function (Blueprint $table) {
                $table->dropColumn('delivered_qty');
            });
        }
    }
};
