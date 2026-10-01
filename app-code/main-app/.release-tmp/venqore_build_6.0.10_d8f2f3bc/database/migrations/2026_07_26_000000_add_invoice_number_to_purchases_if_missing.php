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
        if (Schema::hasTable('purchases')) {
            Schema::table('purchases', function (Blueprint $table) {
                if (!Schema::hasColumn('purchases', 'invoice_number')) {
                    $table->string('invoice_number')->nullable()->after('warehouse_id');
                }
                if (!Schema::hasColumn('purchases', 'subtotal')) {
                    $table->decimal('subtotal', 15, 2)->default(0)->after('purchase_date');
                }
                if (!Schema::hasColumn('purchases', 'tax')) {
                    $table->decimal('tax', 15, 2)->default(0)->after('subtotal');
                }
                if (!Schema::hasColumn('purchases', 'total')) {
                    $table->decimal('total', 15, 2)->default(0)->after('tax');
                }
                if (!Schema::hasColumn('purchases', 'payment_status')) {
                    $table->string('payment_status', 20)->default('unpaid')->after('total');
                }
                if (!Schema::hasColumn('purchases', 'payment_method')) {
                    $table->string('payment_method')->nullable()->after('payment_status');
                }
                if (!Schema::hasColumn('purchases', 'journal_entry_id')) {
                    $table->uuid('journal_entry_id')->nullable()->after('payment_method');
                }
                if (!Schema::hasColumn('purchases', 'user_id')) {
                    $table->uuid('user_id')->nullable()->after('journal_entry_id');
                }
                if (!Schema::hasColumn('purchases', 'created_by')) {
                    $table->uuid('created_by')->nullable()->after('user_id');
                }
            });
        }
    }

    public function down(): void
    {
        // Intentionally a no-op to preserve data safety across drift environments.
    }
};
