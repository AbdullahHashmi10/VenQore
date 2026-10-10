<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/* Dietary tags (veg, halal, spicy...) and an allergen note for each listed dish, shown on the QR menu. */
return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('storefront_products')) {
            Schema::table('storefront_products', function (Blueprint $table) {
                if (!Schema::hasColumn('storefront_products', 'diet_tags')) {
                    $table->string('diet_tags', 120)->nullable();
                }
                if (!Schema::hasColumn('storefront_products', 'allergens')) {
                    $table->string('allergens', 190)->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('storefront_products')) {
            Schema::table('storefront_products', function (Blueprint $table) {
                foreach (['diet_tags', 'allergens'] as $c) {
                    if (Schema::hasColumn('storefront_products', $c)) {
                        $table->dropColumn($c);
                    }
                }
            });
        }
    }
};
