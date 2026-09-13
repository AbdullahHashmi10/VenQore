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
        // Guard: the create_daily_snapshots_table migration (timestamp 213000) has a later
        // timestamp, so on a fresh install this alter runs BEFORE the table is created.
        // Skip silently — the create migration will include purchases_value directly.
        if (!Schema::hasTable('daily_snapshots')) {
            return;
        }

        if (!Schema::hasColumn('daily_snapshots', 'purchases_value')) {
            Schema::table('daily_snapshots', function (Blueprint $table) {
                $table->decimal('purchases_value', 15, 2)->default(0)->after('sales_value');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('daily_snapshots') && Schema::hasColumn('daily_snapshots', 'purchases_value')) {
            Schema::table('daily_snapshots', function (Blueprint $table) {
                $table->dropColumn('purchases_value');
            });
        }
    }
};
