<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Defensive migration to ensure all required columns on `purchases` exist.
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
        // No-op for data safety.
    }
};
