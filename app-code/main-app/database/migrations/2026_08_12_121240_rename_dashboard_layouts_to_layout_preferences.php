<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * R-10 — rename dashboard_layouts → layout_preferences
 *         rename column dashboard_key → surface
 *
 * The table is three days old and has no production rows, so a straight rename
 * is safe. The unique index is recreated under its new name.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('dashboard_layouts')) {
            return; // Already renamed or never created on this environment.
        }

        // 1. Drop the old named unique index before renaming the column.
        Schema::table('dashboard_layouts', function (Blueprint $table) {
            $table->dropUnique('dashboard_layouts_scope_unique');
        });

        // 2. Rename the column.
        Schema::table('dashboard_layouts', function (Blueprint $table) {
            $table->renameColumn('dashboard_key', 'surface');
        });

        // 3. Rename the table.
        Schema::rename('dashboard_layouts', 'layout_preferences');

        // 4. Re-create the unique index under the new table / column name.
        Schema::table('layout_preferences', function (Blueprint $table) {
            $table->unique(['tenant_id', 'user_id', 'surface'], 'layout_preferences_scope_unique');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('layout_preferences')) {
            return;
        }

        Schema::table('layout_preferences', function (Blueprint $table) {
            $table->dropUnique('layout_preferences_scope_unique');
        });

        Schema::table('layout_preferences', function (Blueprint $table) {
            $table->renameColumn('surface', 'dashboard_key');
        });

        Schema::rename('layout_preferences', 'dashboard_layouts');

        Schema::table('dashboard_layouts', function (Blueprint $table) {
            $table->unique(['tenant_id', 'user_id', 'dashboard_key'], 'dashboard_layouts_scope_unique');
        });
    }
};
