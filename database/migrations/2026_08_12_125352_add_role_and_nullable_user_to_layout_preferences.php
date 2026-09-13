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
        Schema::table('layout_preferences', function (Blueprint $table) {
            $table->dropUnique('layout_preferences_scope_unique');
        });

        Schema::table('layout_preferences', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->change();
            $table->string('role', 40)->nullable()->after('user_id');
            $table->unique(['tenant_id', 'user_id', 'role', 'surface'], 'layout_preferences_scope_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('layout_preferences', function (Blueprint $table) {
            $table->dropUnique('layout_preferences_scope_unique');
        });

        Schema::table('layout_preferences', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable(false)->change();
            $table->dropColumn('role');
            $table->unique(['tenant_id', 'user_id', 'surface'], 'layout_preferences_scope_unique');
        });
    }
};
