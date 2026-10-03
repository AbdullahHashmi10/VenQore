<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('storefronts', function (Blueprint $t) {
            $t->string('announcement', 240)->nullable();
            $t->string('banner_path', 191)->nullable();
            $t->unsignedSmallInteger('prep_minutes')->nullable();
            $t->json('delivery_zones')->nullable();
        });
        Schema::table('storefront_products', function (Blueprint $t) {
            $t->boolean('is_featured')->default(false);
        });
        Schema::table('commerce_orders', function (Blueprint $t) {
            $t->string('delivery_zone', 120)->nullable();
            $t->char('promotion_id', 36)->nullable();
            $t->string('promo_name', 120)->nullable();
            $t->string('promo_code', 40)->nullable();
            $t->decimal('discount_total', 20, 2)->default(0);
        });
        Schema::table('commerce_order_items', function (Blueprint $t) {
            $t->decimal('list_price', 20, 4)->nullable();
            $t->decimal('discount_percent', 7, 4)->default(0);
        });
        Schema::create('commerce_promotions', function (Blueprint $t) {
            $t->char('id', 36)->primary();
            $t->unsignedBigInteger('tenant_id');
            $t->char('storefront_id', 36);
            $t->string('name', 120);
            $t->string('code', 40)->nullable();
            $t->decimal('percent', 5, 2);
            $t->string('scope', 12)->default('store'); // store | category
            $t->char('category_id', 36)->nullable();
            $t->dateTime('starts_at')->nullable(); // UTC
            $t->dateTime('ends_at')->nullable();   // UTC
            $t->decimal('min_order', 20, 2)->default(0);
            $t->unsignedInteger('max_uses')->nullable();
            $t->unsignedInteger('uses')->default(0);
            $t->boolean('is_active')->default(true);
            $t->timestamps();
            $t->unique(['storefront_id', 'code']);
            $t->index(['storefront_id', 'is_active']);
            $t->foreign('storefront_id')->references('id')->on('storefronts')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commerce_promotions');
        Schema::table('commerce_order_items', fn (Blueprint $t) => $t->dropColumn(['list_price', 'discount_percent']));
        Schema::table('commerce_orders', fn (Blueprint $t) => $t->dropColumn(['delivery_zone', 'promotion_id', 'promo_name', 'promo_code', 'discount_total']));
        Schema::table('storefront_products', fn (Blueprint $t) => $t->dropColumn('is_featured'));
        Schema::table('storefronts', fn (Blueprint $t) => $t->dropColumn(['announcement', 'banner_path', 'prep_minutes', 'delivery_zones']));
    }
};
