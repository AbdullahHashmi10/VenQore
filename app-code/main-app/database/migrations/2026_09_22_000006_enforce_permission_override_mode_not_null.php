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
            // 1. Backfill any existing null values
            DB::table('tenant_users')
                ->whereNull('permission_override_mode')
                ->update(['permission_override_mode' => 'inherit']);

            DB::table('tenant_users')
                ->whereNull('transaction_approval_mode')
                ->update(['transaction_approval_mode' => 'inherit']);

            // 2. Modify columns to NOT NULL DEFAULT 'inherit'
            $driver = DB::getDriverName();
            if (in_array($driver, ['mysql', 'mariadb'], true)) {
                DB::statement("ALTER TABLE `tenant_users` MODIFY COLUMN `permission_override_mode` VARCHAR(20) NOT NULL DEFAULT 'inherit'");
                DB::statement("ALTER TABLE `tenant_users` MODIFY COLUMN `transaction_approval_mode` VARCHAR(20) NOT NULL DEFAULT 'inherit'");
            } else {
                Schema::table('tenant_users', function (Blueprint $table) {
                    $table->string('permission_override_mode', 20)->default('inherit')->nullable(false)->change();
                    $table->string('transaction_approval_mode', 20)->default('inherit')->nullable(false)->change();
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('tenant_users')) {
            $driver = DB::getDriverName();
            if (in_array($driver, ['mysql', 'mariadb'], true)) {
                DB::statement("ALTER TABLE `tenant_users` MODIFY COLUMN `permission_override_mode` VARCHAR(20) NULL DEFAULT 'inherit'");
                DB::statement("ALTER TABLE `tenant_users` MODIFY COLUMN `transaction_approval_mode` VARCHAR(20) NULL DEFAULT 'inherit'");
            } else {
                Schema::table('tenant_users', function (Blueprint $table) {
                    $table->string('permission_override_mode', 20)->default('inherit')->nullable()->change();
                    $table->string('transaction_approval_mode', 20)->default('inherit')->nullable()->change();
                });
            }
        }
    }
};
