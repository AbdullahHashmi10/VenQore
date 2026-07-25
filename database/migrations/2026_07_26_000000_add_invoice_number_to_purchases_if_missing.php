<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Defensive fix for schema drift on production.
 *
 * 2026_03_05_160908_create_purchases_table.php declares `invoice_number`,
 * but on the live venqore.com database the column doesn't exist — meaning
 * that migration was already marked as "ran" in the `migrations` table
 * before `invoice_number` was added to the file, so Laravel never applied
 * it. This left DemoPurchaseSeeder (and any real purchase creation going
 * through the same insert shape) failing with:
 *   SQLSTATE[42S22]: Column not found: 1054 Unknown column 'invoice_number'
 *
 * This migration is additive and idempotent: it only adds the column if
 * it's actually missing, so it's a no-op on any environment where the
 * original migration already applied it correctly (e.g. local dev).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('purchases') && !Schema::hasColumn('purchases', 'invoice_number')) {
            Schema::table('purchases', function (Blueprint $table) {
                $table->string('invoice_number')->nullable()->after('warehouse_id');
            });
        }
    }

    public function down(): void
    {
        // Intentionally a no-op. We don't know on this environment whether
        // the column pre-existed before this migration or was added by it,
        // so dropping it on rollback could destroy legitimate data.
    }
};
