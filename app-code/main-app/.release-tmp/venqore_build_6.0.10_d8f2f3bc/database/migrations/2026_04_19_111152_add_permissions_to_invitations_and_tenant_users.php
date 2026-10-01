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
        Schema::table('staff_invitations', function (Blueprint $table) {
            $table->json('permissions')->nullable()->after('roles');
        });

        Schema::table('tenant_users', function (Blueprint $table) {
            $table->json('permissions')->nullable()->after('role');
        });
    }

    public function down(): void
    {
        Schema::table('staff_invitations', function (Blueprint $table) {
            $table->dropColumn('permissions');
        });

        Schema::table('tenant_users', function (Blueprint $table) {
            $table->dropColumn('permissions');
        });
    }
};
