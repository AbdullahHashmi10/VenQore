<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create Activity Logging Infrastructure
 *
 * Implements Tier 1 and Tier 2 logging requirements from the Master Plan.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Tier 2: Store Activity Log (Walled Garden)
        Schema::create('store_activity_log', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            
            $table->string('action'); // e.g. 'sale.created', 'product.deleted'
            $table->string('subject_type')->nullable(); // Model name
            $table->string('subject_id')->nullable();   // UUID
            $table->json('payload')->nullable();        // Before/After data
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->boolean('is_impersonated')->default(false); // Flag for HQ actions
            
            $table->index(['tenant_id', 'action']);
            $table->index(['tenant_id', 'created_at']);
            $table->timestamps();
        });

        // Tier 1: Platform Activity Log (HQ monitoring)
        Schema::create('platform_activity_log', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            
            $table->string('action'); // e.g. 'store.suspended', 'impersonation.started'
            $table->foreignId('target_tenant_id')->nullable()->constrained('tenants')->nullOnDelete();
            $table->unsignedBigInteger('target_user_id')->nullable();
            $table->json('payload')->nullable();
            $table->string('ip_address', 45)->nullable();
            
            $table->index(['user_id', 'action']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('store_activity_log');
        Schema::dropIfExists('platform_activity_log');
    }
};
