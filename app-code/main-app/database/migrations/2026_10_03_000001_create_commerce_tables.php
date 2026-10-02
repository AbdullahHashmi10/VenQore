<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * VenQore Commerce MVP — directory, storefront, public orders.
 * Forward-only, additive. Does not touch existing tables.
 * tenant ids are bigint unsigned; product/warehouse/sale/party ids are uuid strings (char 36).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commerce_countries', function (Blueprint $t) {
            $t->id();
            $t->string('code', 2)->unique();
            $t->string('name', 100);
            $t->string('currency_code', 3)->nullable();
            $t->boolean('is_active')->default(true);
            $t->timestamps();
        });

        Schema::create('commerce_cities', function (Blueprint $t) {
            $t->id();
            $t->foreignId('country_id')->constrained('commerce_countries')->cascadeOnDelete();
            $t->string('name', 100);
            $t->string('slug', 120);
            $t->unsignedInteger('sort_order')->default(0);
            $t->boolean('is_active')->default(true);
            $t->timestamps();
            $t->unique(['country_id', 'slug']);
        });

        Schema::create('storefronts', function (Blueprint $t) {
            $t->char('id', 36)->primary();
            $t->unsignedBigInteger('tenant_id')->unique();
            $t->string('slug', 80)->unique();
            $t->string('display_name', 150);
            $t->text('description')->nullable();
            $t->foreignId('country_id')->nullable()->constrained('commerce_countries')->nullOnDelete();
            $t->foreignId('city_id')->nullable()->constrained('commerce_cities')->nullOnDelete();
            $t->string('address_line', 255)->nullable();
            $t->string('map_url', 500)->nullable();
            $t->string('logo_path', 255)->nullable();
            $t->string('phone', 40)->nullable();
            $t->string('email', 150)->nullable();
            $t->json('opening_hours')->nullable();
            $t->string('timezone', 64)->default('UTC');
            $t->string('currency_code', 3)->default('PKR');
            $t->string('currency_symbol', 10)->default('Rs');
            $t->boolean('supports_pickup')->default(true);
            $t->boolean('supports_delivery')->default(false);
            $t->decimal('delivery_charge', 12, 2)->default(0);
            $t->string('delivery_note', 255)->nullable();
            $t->decimal('min_order_amount', 12, 2)->default(0);
            $t->char('warehouse_id', 36)->nullable();
            $t->enum('pricing_mode', ['same', 'increase', 'decrease'])->default('same');
            $t->decimal('pricing_percent', 7, 4)->default(0);
            $t->boolean('accept_cod')->default(true);
            $t->boolean('accept_pickup_payment')->default(true);
            $t->boolean('accept_bank_transfer')->default(false);
            $t->text('bank_instructions')->nullable();
            $t->boolean('intake_paused')->default(false);
            $t->enum('status', ['draft', 'published', 'unpublished', 'suspended'])->default('draft');
            $t->string('suspended_reason', 255)->nullable();
            $t->timestamp('published_at')->nullable();
            $t->unsignedSmallInteger('accept_deadline_minutes')->default(120);
            $t->timestamps();
            $t->index(['city_id', 'status']);
            $t->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
        });

        Schema::create('storefront_products', function (Blueprint $t) {
            $t->char('id', 36)->primary();
            $t->char('storefront_id', 36);
            $t->unsignedBigInteger('tenant_id');
            $t->char('product_id', 36);
            $t->boolean('is_published')->default(false);
            $t->string('public_name', 191)->nullable();
            $t->text('public_description')->nullable();
            $t->decimal('override_price', 20, 4)->nullable();
            $t->boolean('allow_below_cost')->default(false);
            $t->unsignedInteger('sort_order')->default(0);
            $t->timestamps();
            $t->unique(['storefront_id', 'product_id']);
            $t->index(['storefront_id', 'is_published']);
            $t->foreign('storefront_id')->references('id')->on('storefronts')->cascadeOnDelete();
        });

        Schema::create('commerce_orders', function (Blueprint $t) {
            $t->char('id', 36)->primary();
            $t->unsignedBigInteger('tenant_id');
            $t->char('storefront_id', 36);
            $t->string('public_number', 24)->unique();
            $t->char('status_token_hash', 64)->unique();
            $t->string('idempotency_key', 100);
            $t->enum('status', ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'completed', 'rejected', 'cancelled', 'expired'])->default('pending');
            $t->enum('payment_status', ['unpaid', 'transfer_reported', 'collected', 'refunded'])->default('unpaid');
            $t->enum('payment_method', ['cod', 'pickup', 'bank']);
            $t->enum('fulfilment', ['pickup', 'delivery']);
            $t->string('customer_name', 150);
            $t->string('customer_phone', 40);
            $t->text('delivery_address')->nullable();
            $t->text('customer_note')->nullable();
            $t->string('currency_code', 3);
            $t->string('currency_symbol', 10);
            $t->decimal('subtotal', 20, 2)->default(0);
            $t->decimal('tax_total', 20, 2)->default(0);
            $t->decimal('delivery_fee', 12, 2)->default(0);
            $t->decimal('total', 20, 2)->default(0);
            $t->decimal('amount_collected', 20, 2)->default(0);
            $t->string('bank_reference', 120)->nullable();
            $t->unsignedInteger('version')->default(1);
            $t->char('sale_id', 36)->nullable()->unique();
            $t->char('party_id', 36)->nullable();
            $t->char('warehouse_id', 36)->nullable();
            $t->string('reason', 255)->nullable();
            $t->timestamp('confirmed_at')->nullable();
            $t->timestamp('accept_by')->nullable();
            $t->timestamp('completed_at')->nullable();
            $t->timestamps();
            $t->unique(['storefront_id', 'idempotency_key']);
            $t->index(['tenant_id', 'status']);
            $t->foreign('storefront_id')->references('id')->on('storefronts')->cascadeOnDelete();
        });

        Schema::create('commerce_order_items', function (Blueprint $t) {
            $t->char('id', 36)->primary();
            $t->char('order_id', 36);
            $t->unsignedBigInteger('tenant_id');
            $t->char('product_id', 36);
            $t->string('title', 191);
            $t->string('sku', 191)->nullable();
            $t->string('uom', 64)->nullable();
            $t->decimal('quantity', 12, 4);
            $t->decimal('base_price', 20, 4);
            $t->string('price_rule', 20); // fixed_override | percent | regular
            $t->decimal('rule_percent', 7, 4)->nullable();
            $t->decimal('online_price', 20, 4);   // what the shopper saw (tax-inclusive if product inclusive)
            $t->decimal('net_unit_price', 20, 4); // pre-tax unit fed to the sale engine
            $t->decimal('tax_rate', 8, 4)->default(0);
            $t->boolean('price_includes_tax')->default(false);
            $t->decimal('line_net', 20, 2);
            $t->decimal('tax_amount', 20, 2);
            $t->decimal('line_total', 20, 2);
            $t->timestamps();
            $t->foreign('order_id')->references('id')->on('commerce_orders')->cascadeOnDelete();
        });

        Schema::create('commerce_order_events', function (Blueprint $t) {
            $t->id();
            $t->char('order_id', 36);
            $t->unsignedBigInteger('tenant_id');
            $t->string('type', 40);
            $t->string('from_status', 24)->nullable();
            $t->string('to_status', 24)->nullable();
            $t->string('actor_type', 12)->default('system'); // guest|staff|system
            $t->unsignedBigInteger('actor_id')->nullable();
            $t->string('note', 255)->nullable();
            $t->json('meta')->nullable();
            $t->timestamp('created_at')->useCurrent();
            $t->index('order_id');
            $t->foreign('order_id')->references('id')->on('commerce_orders')->cascadeOnDelete();
        });

        Schema::create('commerce_stock_holds', function (Blueprint $t) {
            $t->char('id', 36)->primary();
            $t->char('order_id', 36);
            $t->unsignedBigInteger('tenant_id');
            $t->char('product_id', 36);
            $t->char('warehouse_id', 36);
            $t->decimal('quantity', 14, 4); // base units
            $t->enum('status', ['active', 'released', 'consumed'])->default('active');
            $t->timestamps();
            $t->index(['tenant_id', 'product_id', 'warehouse_id', 'status'], 'csh_lookup');
            $t->foreign('order_id')->references('id')->on('commerce_orders')->cascadeOnDelete();
        });

        Schema::create('commerce_notifications', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('tenant_id');
            $t->char('order_id', 36)->nullable();
            $t->string('type', 40);
            $t->string('title', 191);
            $t->timestamp('read_at')->nullable();
            $t->timestamps();
            $t->index(['tenant_id', 'read_at']);
        });

        // Curated pilot directory (idempotent seed; real merchants extend via platform admin later).
        $now = now();
        DB::table('commerce_countries')->insert([
            ['code' => 'PK', 'name' => 'Pakistan', 'currency_code' => 'PKR', 'is_active' => 1, 'created_at' => $now, 'updated_at' => $now],
        ]);
        $pk = DB::table('commerce_countries')->where('code', 'PK')->value('id');
        $i = 0;
        foreach (['Okara', 'Lahore', 'Karachi', 'Islamabad', 'Faisalabad', 'Multan'] as $c) {
            DB::table('commerce_cities')->insert([
                'country_id' => $pk, 'name' => $c, 'slug' => strtolower($c), 'sort_order' => $i++,
                'is_active' => 1, 'created_at' => $now, 'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        foreach (['commerce_notifications', 'commerce_stock_holds', 'commerce_order_events', 'commerce_order_items', 'commerce_orders', 'storefront_products', 'storefronts', 'commerce_cities', 'commerce_countries'] as $t) {
            Schema::dropIfExists($t);
        }
    }
};
