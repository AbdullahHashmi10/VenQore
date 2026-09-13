<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create store_licenses table — Definitive Plan
 *
 * Decouples billing from users and stores.
 * A user owns a license. A license can be attached to a store.
 *
 * Types:
 *   trial        → auto-created on registration (14-day, card not required)
 *   subscription → created by Lemon Squeezy webhook on payment
 *   ltd          → AppSumo lifetime deal, never expires
 *
 * Sources:
 *   registration  → self-service trial
 *   lemon_squeezy → paid subscription
 *   appsumo       → lifetime deal code redemption
 *   manual        → admin granting a license
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('store_licenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            // The person who OWNS this license (paid for it or redeemed AppSumo code)

            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->nullOnDelete();
            // NULL until they create a store with it

            $table->enum('type', ['trial', 'subscription', 'ltd']);
            $table->enum('status', ['available', 'consumed', 'expired', 'cancelled']);
            $table->string('plan')->default('starter');       // what plan this unlocks
            $table->string('source')->nullable();             // 'registration','lemon_squeezy','appsumo','manual'
            $table->string('source_reference')->nullable();   // order ID or AppSumo code
            $table->timestamp('valid_until')->nullable();     // NULL = forever (LTD)
            $table->timestamp('consumed_at')->nullable();

            $table->index(['user_id', 'status']);
            $table->index('source_reference');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('store_licenses');
    }
};
