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
        Schema::table('product_uom_conversions', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id')->index();
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_uom_conversions', function (Blueprint $table) {
            $table->dropColumn('tenant_id');
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn('tenant_id');
        });
    }
};
