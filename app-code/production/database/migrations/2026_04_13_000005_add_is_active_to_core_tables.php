<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const TABLES = ['products', 'warehouses', 'parties', 'accounts'];

    public function up(): void
    {
        foreach (self::TABLES as $table) {
            if (!Schema::hasTable($table)) continue;
            if (Schema::hasColumn($table, 'is_active')) continue;

            Schema::table($table, function (Blueprint $t) {
                $t->boolean('is_active')->default(true)->after('id')->index();
            });
        }
    }

    public function down(): void
    {
        foreach (self::TABLES as $table) {
            if (!Schema::hasTable($table)) continue;
            if (!Schema::hasColumn($table, 'is_active')) continue;

            Schema::table($table, function (Blueprint $t) {
                $t->dropColumn('is_active');
            });
        }
    }
};
