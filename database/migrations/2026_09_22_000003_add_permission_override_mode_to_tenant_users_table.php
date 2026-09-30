<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('tenant_users') && !Schema::hasColumn('tenant_users', 'permission_override_mode')) {
            Schema::table('tenant_users', function (Blueprint $table) {
                $table->string('permission_override_mode', 20)->nullable()->after('permissions');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('tenant_users') && Schema::hasColumn('tenant_users', 'permission_override_mode')) {
            Schema::table('tenant_users', function (Blueprint $table) {
                $table->dropColumn('permission_override_mode');
            });
        }
    }
};
