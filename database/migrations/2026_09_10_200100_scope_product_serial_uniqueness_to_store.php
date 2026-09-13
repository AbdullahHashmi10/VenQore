<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Serial / IMEI numbers were unique across ALL stores, so two shops could
 * never record the same serial (and one store's serial revealed the other's
 * on the duplicate check). Uniqueness is per store.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('product_serials')) {
            return;
        }

        Schema::table('product_serials', function (Blueprint $table) {
            $table->dropUnique('product_serials_serial_number_unique');
            $table->unique(['tenant_id', 'serial_number'], 'product_serials_tenant_serial_unique');
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('product_serials')) {
            return;
        }

        Schema::table('product_serials', function (Blueprint $table) {
            $table->dropUnique('product_serials_tenant_serial_unique');
            $table->unique('serial_number');
        });
    }
};
