<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create access_grants + access_grant_redemptions — Gift Access Links
 *
 * An AccessGrant is a platform-owner-generated link ("gift link") that grants
 * a chosen Plan for a chosen duration (any value/unit combo, e.g. "1 month"
 * or "5 years") with zero payment. Distinct from:
 *   - Coupon: reduces a price at checkout, does not grant access by itself.
 *   - AppSumoCode: fixed catalog of 3 hardcoded LTD tiers, code-paste redemption.
 *
 * Default usage is single-redemption (max_redemptions = 1) — "give this one
 * customer a year of Growth" — but the schema also supports a capped
 * multi-use promo link (max_redemptions > 1) without any code changes.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('access_grants', function (Blueprint $table) {
            $table->id();
            $table->string('token', 64)->unique();

            $table->foreignId('plan_id')->constrained('plans');

            $table->unsignedInteger('duration_value');
            $table->enum('duration_unit', ['day', 'month', 'year']);

            $table->string('label', 150)->nullable();

            $table->unsignedInteger('max_redemptions')->default(1);
            $table->unsignedInteger('redemption_count')->default(0);

            $table->timestamp('expires_at')->nullable();  // link itself expires if unused
            $table->timestamp('revoked_at')->nullable();

            $table->foreignId('created_by')->constrained('users');

            $table->timestamps();

            $table->index(['token', 'revoked_at']);
        });

        Schema::create('access_grant_redemptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('access_grant_id')->constrained('access_grants');
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->nullOnDelete();

            $table->timestamp('granted_until')->nullable(); // NULL only if somehow unlimited; normally always set
            $table->timestamp('redeemed_at')->useCurrent();
            $table->string('ip_address', 45)->nullable();

            $table->index(['access_grant_id', 'user_id']);
            $table->index('redeemed_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('access_grant_redemptions');
        Schema::dropIfExists('access_grants');
    }
};
