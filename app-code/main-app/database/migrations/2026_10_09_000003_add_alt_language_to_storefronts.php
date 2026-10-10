<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/* The one extra language a business offers on its QR menu (any language; null = English only).
   Dish names in that language live in storefront_products.public_name_ur (historic column name, holds any language). */
return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('storefronts') && !Schema::hasColumn('storefronts', 'onsite_alt_lang')) {
            Schema::table('storefronts', function (Blueprint $table) {
                $table->string('onsite_alt_lang', 8)->nullable();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('storefronts') && Schema::hasColumn('storefronts', 'onsite_alt_lang')) {
            Schema::table('storefronts', function (Blueprint $table) {
                $table->dropColumn('onsite_alt_lang');
            });
        }
    }
};
