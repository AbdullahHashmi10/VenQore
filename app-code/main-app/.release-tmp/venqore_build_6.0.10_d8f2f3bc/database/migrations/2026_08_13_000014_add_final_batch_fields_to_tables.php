<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->string('custom_domain')->nullable()->after('slug');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->string('supplier_sku')->nullable()->after('sku');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn('custom_domain');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('supplier_sku');
        });
    }
};
