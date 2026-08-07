<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create Staff Invitation and Permission Override Tables
 */
return new class extends Migration
{
    public function up(): void
    {
        // Formal Invitation system (email + token)
        Schema::create('staff_invitations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('invited_by')->constrained('users')->cascadeOnDelete();
            $table->string('email');
            $table->string('role');
            $table->string('token', 64)->unique();
            $table->timestamp('expires_at');
            $table->timestamp('accepted_at')->nullable();
            
            $table->index(['tenant_id', 'email']);
            $table->index('token');
            $table->timestamps();
        });

        // Granular overrides for specific staff on specific modules
        Schema::create('tenant_permission_overrides', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_user_id')->constrained('tenant_users')->cascadeOnDelete();
            $table->string('permission'); // e.g. 'finance.view', 'pos.void'
            $table->boolean('is_allowed')->default(true);
            
            $table->unique(['tenant_user_id', 'permission']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_invitations');
        Schema::dropIfExists('tenant_permission_overrides');
    }
};
