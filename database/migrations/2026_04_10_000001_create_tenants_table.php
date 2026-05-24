<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Phase 1.1 — Create the tenants table
 *
 * This is the central registry for all VenQore subscribers.
 * Every other table will reference this via tenant_id.
 *
 * SQLite compatibility: Creates the final remodeled schema directly to avoid
 * SQLite limitations with ALTER TABLE drop primary key/constraint/enum modifications.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table) {
            if (DB::connection()->getDriverName() === 'sqlite') {
                // Core identity
                $table->id();
                $table->string('name');
                $table->string('slug')->unique()->nullable();
                $table->string('join_code', 8)->unique()->nullable();
                $table->string('appsumo_code')->nullable()->index();

                // Subscription
                $table->string('plan')->default('trial'); // string to avoid enum issues
                $table->string('status')->default('trial');
                $table->timestamp('trial_ends_at')->nullable();
                $table->timestamp('subscription_ends_at')->nullable();

                // Lemon Squeezy billing
                $table->string('lemon_squeezy_customer_id')->nullable()->index();
                $table->string('lemon_squeezy_subscription_id')->nullable()->index();
                $table->json('plan_limits')->nullable();  // per-tenant overrides

                // Locale / display
                $table->string('timezone')->default('UTC');
                $table->string('currency_code', 3)->default('USD');
                $table->string('currency_symbol', 10)->default('$');
                $table->string('country_code', 2)->nullable();
                $table->string('language_code', 5)->default('en');

                // Onboarding
                $table->boolean('setup_completed')->default(false);
                $table->string('industry')->nullable();

                // Feature flags per industry
                $table->boolean('feature_variants')->default(false);
                $table->boolean('feature_serials')->default(false);
                $table->boolean('feature_batches')->default(false);
                $table->boolean('feature_manufacturing')->default(false);
            } else {
                // Core identity
                $table->uuid('id')->primary();
                $table->string('name');
                $table->string('subdomain')->unique();   // shop-name (without .venqore.com)

                // Subscription
                $table->enum('plan', ['starter', 'growth', 'business'])->default('starter');
                $table->enum('status', ['trial', 'active', 'suspended', 'cancelled'])->default('trial');
                $table->timestamp('trial_ends_at')->nullable();
                $table->timestamp('subscription_ends_at')->nullable();

                // Lemon Squeezy billing
                $table->string('lemon_squeezy_customer_id')->nullable()->index();
                $table->string('lemon_squeezy_subscription_id')->nullable()->index();
                $table->json('plan_limits')->nullable();  // per-tenant overrides

                // Locale / display
                $table->string('timezone')->default('UTC');
                $table->string('currency_code', 3)->default('USD');
                $table->string('currency_symbol', 10)->default('$');

                // Onboarding
                $table->boolean('setup_completed')->default(false);
                $table->string('industry')->nullable();
            }

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
