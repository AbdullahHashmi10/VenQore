<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'role')) {
                $table->string('role')->nullable()->after('email');
            }
            if (!Schema::hasColumn('users', 'permissions')) {
                $table->json('permissions')->nullable()->after('role');
            }
            if (!Schema::hasColumn('users', 'passcode')) {
                $table->string('passcode')->nullable()->after('password');
            }
        });

        Schema::table('tenant_users', function (Blueprint $table) {
            if (Schema::hasColumn('tenant_users', 'pos_pin')) {
                $table->string('pos_pin', 60)->nullable()->change();
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'permissions', 'passcode']);
        });

        Schema::table('tenant_users', function (Blueprint $table) {
            if (Schema::hasColumn('tenant_users', 'pos_pin')) {
                $table->string('pos_pin', 6)->nullable()->change();
            }
        });
    }
};
