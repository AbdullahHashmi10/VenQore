<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const TABLES = ['journal_items', 'inventory_batches', 'sale_item_batches'];

    public function up(): void
    {
        foreach (self::TABLES as $table) {
            if (!Schema::hasTable($table)) continue;
            if (Schema::hasColumn($table, 'tenant_id')) continue;

            Schema::table($table, function (Blueprint $t) use ($table) {
                // Using unsignedBigInteger for consistency with tenants.id
                $t->unsignedBigInteger('tenant_id')->nullable()->after('id')->index();
            });
        }
    }

    public function down(): void
    {
        foreach (self::TABLES as $table) {
            if (!Schema::hasTable($table)) continue;
            if (!Schema::hasColumn($table, 'tenant_id')) continue;

            Schema::table($table, function (Blueprint $t) {
                $t->dropColumn('tenant_id');
            });
        }
    }
};
