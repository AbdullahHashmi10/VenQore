<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/* Optional brand colour (#RRGGBB) that recolours the public storefront and QR menu. */
return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('storefronts') && !Schema::hasColumn('storefronts', 'brand_color')) {
            Schema::table('storefronts', function (Blueprint $table) {
                $table->string('brand_color', 7)->nullable();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('storefronts') && Schema::hasColumn('storefronts', 'brand_color')) {
            Schema::table('storefronts', function (Blueprint $table) {
                $table->dropColumn('brand_color');
            });
        }
    }
};
