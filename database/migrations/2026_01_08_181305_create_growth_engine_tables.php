<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // AI Recommendations Table (The Growth Engine)
        Schema::create('ai_recommendations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->enum('type', ['retention', 'forecast', 'churn', 'recovery'])->index();
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->foreignUuid('party_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->text('message');
            $table->json('data')->nullable(); // Extra structured data
            $table->decimal('potential_revenue', 12, 2)->default(0);
            $table->string('action_type')->nullable(); // 'whatsapp', 'purchase_order', 'view_invoice', etc.
            $table->string('action_url')->nullable();
            $table->boolean('is_read')->default(false);
            $table->boolean('is_dismissed')->default(false);
            $table->date('valid_until')->nullable();
            $table->timestamps();
        });

        // Customer Analytics Cache (Pre-computed stats for speed)
        Schema::create('customer_analytics', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('party_id')->constrained()->cascadeOnDelete();
            $table->integer('total_orders')->default(0);
            $table->decimal('total_spent', 14, 2)->default(0);
            $table->decimal('average_order_value', 12, 2)->default(0);
            $table->integer('avg_days_between_orders')->nullable(); // ADBO
            $table->date('last_order_date')->nullable();
            $table->date('predicted_next_order')->nullable();
            $table->enum('status', ['active', 'at_risk', 'churned'])->default('active');
            $table->timestamps();

            $table->unique('party_id');
        });

        // Loyalty Points System
        Schema::create('loyalty_points', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('party_id')->constrained()->cascadeOnDelete();
            $table->integer('points')->default(0);
            $table->enum('type', ['earned', 'redeemed', 'expired', 'adjusted']);
            $table->string('description')->nullable();
            $table->foreignUuid('invoice_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();

            $table->index(['party_id', 'created_at']);
        });

        // Customer Loyalty Balance (Running total)
        Schema::create('loyalty_balances', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('party_id')->constrained()->cascadeOnDelete();
            $table->integer('balance')->default(0);
            $table->integer('lifetime_earned')->default(0);
            $table->integer('lifetime_redeemed')->default(0);
            $table->timestamps();

            $table->unique('party_id');
        });

        // Gift Cards
        Schema::create('gift_cards', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 20)->unique();
            $table->decimal('initial_value', 12, 2);
            $table->decimal('current_balance', 12, 2);
            $table->foreignUuid('purchased_by')->nullable()->constrained('parties')->nullOnDelete();
            $table->foreignUuid('assigned_to')->nullable()->constrained('parties')->nullOnDelete();
            $table->enum('status', ['active', 'used', 'expired', 'cancelled'])->default('active');
            $table->date('expires_at')->nullable();
            $table->timestamps();
        });

        // Store Credits (Wallet)
        Schema::create('store_credits', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('party_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 12, 2);
            $table->enum('type', ['credit', 'debit']);
            $table->string('reason')->nullable(); // 'return', 'adjustment', 'gift', 'redemption'
            $table->foreignUuid('invoice_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();

            $table->index(['party_id', 'created_at']);
        });

        // Store Credit Balance (Running total)
        Schema::create('store_credit_balances', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('party_id')->constrained()->cascadeOnDelete();
            $table->decimal('balance', 12, 2)->default(0);
            $table->timestamps();

            $table->unique('party_id');
        });

        // AI Settings
        Schema::create('ai_settings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        // Insert default AI settings
        DB::table('ai_settings')->insert([
            ['id' => Str::uuid()->toString(), 'key' => 'regular_customer_min_orders', 'value' => '3', 'created_at' => now(), 'updated_at' => now()],
            ['id' => Str::uuid()->toString(), 'key' => 'regular_customer_period_days', 'value' => '60', 'created_at' => now(), 'updated_at' => now()],
            ['id' => Str::uuid()->toString(), 'key' => 'min_order_value_filter', 'value' => '5000', 'created_at' => now(), 'updated_at' => now()],
            ['id' => Str::uuid()->toString(), 'key' => 'lookahead_days', 'value' => '7', 'created_at' => now(), 'updated_at' => now()],
            ['id' => Str::uuid()->toString(), 'key' => 'loyalty_points_per_amount', 'value' => '100', 'created_at' => now(), 'updated_at' => now()],
            ['id' => Str::uuid()->toString(), 'key' => 'loyalty_points_earned_per_unit', 'value' => '1', 'created_at' => now(), 'updated_at' => now()],
            ['id' => Str::uuid()->toString(), 'key' => 'loyalty_redemption_rate', 'value' => '10', 'created_at' => now(), 'updated_at' => now()], // 10 points = 1 PKR
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_settings');
        Schema::dropIfExists('store_credit_balances');
        Schema::dropIfExists('store_credits');
        Schema::dropIfExists('gift_cards');
        Schema::dropIfExists('loyalty_balances');
        Schema::dropIfExists('loyalty_points');
        Schema::dropIfExists('customer_analytics');
        Schema::dropIfExists('ai_recommendations');
    }
};


