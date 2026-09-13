<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ecommerce_channels', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id')->index();
            $table->string('name');                                                   // "My Amazon FBM UK Store"
            $table->enum('platform', ['amazon', 'tiktok', 'ebay']);
            $table->enum('default_fulfillment_type', ['fbm', 'fba', 'jit'])->default('fbm');
            $table->decimal('fee_percentage', 5, 2)->default(0);                      // Fallback estimate e.g. 15.00
            $table->enum('fee_source', ['estimated', 'api_exact'])->default('estimated');
            $table->unsignedBigInteger('expense_category_id')->nullable();            // FK to expense_categories
            $table->uuid('warehouse_id')->nullable();                                 // FK to warehouses — set on Click 3
            $table->string('currency', 3)->default('GBP');
            $table->text('oauth_access_token')->nullable();                           // Encrypted, short-lived
            $table->text('oauth_refresh_token')->nullable();                          // Encrypted, long-lived
            $table->timestamp('access_token_expires_at')->nullable();
            $table->timestamp('refresh_token_expires_at')->nullable();
            $table->boolean('is_connected')->default(false);
            $table->timestamp('last_synced_at')->nullable();
            $table->enum('sync_status', ['idle', 'syncing', 'error'])->default('idle');
            $table->text('sync_error_message')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ecommerce_channels');
    }
};
