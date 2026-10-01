<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create tenant_users pivot table — Definitive Plan
 *
 * This is the heart of the multi-store system.
 * One user can belong to many stores with different roles.
 * Billing is per-store, not per-user.
 *
 * Roles:
 *   owner   → billing contact, cannot be removed
 *   admin   → full access except billing changes
 *   manager → reports + inventory, no staff management
 *   cashier → POS only + inventory view
 *   viewer  → read-only reports
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            // user_id is NULL until an invited person accepts (pending invite state)

            $table->enum('role', ['owner', 'admin', 'manager', 'cashier', 'viewer']);
            $table->enum('status', ['active', 'invited', 'suspended'])->default('active');

            // Store-specific display identity
            $table->string('display_name')->nullable();
            // NULL = show global user.name. Set = show this on receipts, POS, reports.

            // Optional POS PIN for quick login on shared tablets
            $table->string('pos_pin', 6)->nullable();

            // Invite workflow
            $table->string('invite_email')->nullable();        // locked to this email
            $table->string('invite_token', 64)->nullable()->unique();
            $table->timestamp('invite_expires_at')->nullable();
            $table->timestamp('invited_at')->nullable();
            $table->timestamp('joined_at')->nullable();

            $table->unique(['tenant_id', 'user_id']);           // one membership per store
            $table->index(['tenant_id', 'role']);
            $table->index(['tenant_id', 'status']);
            $table->index(['user_id', 'status']);
            $table->index('invite_token');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_users');
    }
};
