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
        Schema::table('storefronts', function (Blueprint $table) {
            $table->boolean('orders_during_break')->default(false)->after('orders_outside_hours');
        });

        Schema::table('commerce_orders', function (Blueprint $table) {
            $table->string('bank_receipt_path')->nullable()->after('bank_reference');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('storefronts', function (Blueprint $table) {
            $table->dropColumn('orders_during_break');
        });

        Schema::table('commerce_orders', function (Blueprint $table) {
            $table->dropColumn('bank_receipt_path');
        });
    }
};
