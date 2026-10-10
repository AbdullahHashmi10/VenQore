<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/* Optional secondary brand colour (#RRGGBB) that recolours the public storefront and QR menu. */
return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('storefronts') && !Schema::hasColumn('storefronts', 'brand_color_2')) {
            Schema::table('storefronts', function (Blueprint $table) {
                $table->string('brand_color_2', 7)->nullable();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('storefronts') && Schema::hasColumn('storefronts', 'brand_color_2')) {
            Schema::table('storefronts', function (Blueprint $table) {
                $table->dropColumn('brand_color_2');
            });
        }
    }
};
