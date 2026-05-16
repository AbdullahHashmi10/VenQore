<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Update users table — Definitive Plan
 *
 * Changes:
 *  - Remove HasTenant trait dependency (users are global, not per-store)
 *  - Remove tenant_id column (users belong to stores via tenant_users pivot)
 *  - Add last_store_id (remembers which store to auto-enter on next login)
 *  - Remove old 'role' column (role is per-store in tenant_users now)
 *  - Remove 'passcode' column (replaced by pos_pin in tenant_users)
 *  - Remove 'permissions' column (role-based in tenant_users)
 *  - Add is_platform_admin
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Add new global identity fields
            if (!Schema::hasColumn('users', 'last_store_id')) {
                $table->unsignedBigInteger('last_store_id')->nullable()->after('email_verified_at');
            }
            if (!Schema::hasColumn('users', 'is_platform_admin')) {
                $table->boolean('is_platform_admin')->default(false)->after('last_store_id');
            }
            if (!Schema::hasColumn('users', 'deleted_at')) {
                $table->softDeletes();
            }

            // Remove old single-tenant fields that are now in tenant_users
            // Drop in correct order (remove indexes first)
            $columnsToRemove = [];
            if (Schema::hasColumn('users', 'tenant_id')) $columnsToRemove[] = 'tenant_id';
            if (Schema::hasColumn('users', 'role'))      $columnsToRemove[] = 'role';
            if (Schema::hasColumn('users', 'permissions')) $columnsToRemove[] = 'permissions';
            if (Schema::hasColumn('users', 'passcode'))  $columnsToRemove[] = 'passcode';

            if (!empty($columnsToRemove)) {
                // Drop index on tenant_id first if it exists
                try { $table->dropIndex('users_tenant_id_index'); } catch (\Throwable) {}
                $table->dropColumn($columnsToRemove);
            }
        });

        // FK: last_store_id → tenants.id (added after tenants table exists)
        // Use raw SQL to avoid issue if tenants PK migration hasn't landed
        try {
            Schema::table('users', function (Blueprint $table) {
                $table->foreign('last_store_id')
                      ->references('id')
                      ->on('tenants')
                      ->nullOnDelete();
            });
        } catch (\Throwable) {
            // defer FK if tenants PK is still UUID (will be corrected by reindex migration)
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeignIfExists('users_last_store_id_foreign');
            $table->dropColumn(['last_store_id', 'is_platform_admin']);

            // Restore removed columns
            $table->string('role')->nullable()->after('name');
            $table->json('permissions')->nullable();
            $table->string('passcode')->nullable();
            $table->string('tenant_id')->nullable();
        });
    }
};
