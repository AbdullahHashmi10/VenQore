<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('tenant_users')) {
            // 1. Ensure permission_override_mode is non-null with default 'inherit'
            if (!Schema::hasColumn('tenant_users', 'permission_override_mode')) {
                Schema::table('tenant_users', function (Blueprint $table) {
                    $table->string('permission_override_mode', 20)->default('inherit')->after('permissions');
                });
            } else {
                DB::table('tenant_users')
                    ->whereNull('permission_override_mode')
                    ->update(['permission_override_mode' => 'inherit']);
            }

            // 2. Ensure transaction_approval_mode & audit columns exist
            Schema::table('tenant_users', function (Blueprint $table) {
                if (!Schema::hasColumn('tenant_users', 'transaction_approval_mode')) {
                    $table->string('transaction_approval_mode', 20)->default('inherit')->after('permission_override_mode');
                }
                if (!Schema::hasColumn('tenant_users', 'approval_mode_changed_by')) {
                    $table->unsignedBigInteger('approval_mode_changed_by')->nullable()->after('transaction_approval_mode');
                }
                if (!Schema::hasColumn('tenant_users', 'approval_mode_changed_at')) {
                    $table->timestamp('approval_mode_changed_at')->nullable()->after('approval_mode_changed_by');
                }
            });

            DB::table('tenant_users')
                ->whereNull('transaction_approval_mode')
                ->update(['transaction_approval_mode' => 'inherit']);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Safe non-destructive down migration
    }
};
