<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add `seq` — a monotonically-increasing tiebreaker column — to inventory_batches.
 *
 * FifoService orders batches by (created_at ASC, seq ASC) so that two batches
 * inserted within the same second are always consumed in a deterministic order.
 * Without this column the FIFO query fails with "Unknown column 'seq'".
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('inventory_batches', 'seq')) {
            return; // idempotent
        }

        Schema::table('inventory_batches', function (Blueprint $table) {
            // AUTO_INCREMENT integer; placed after `id` so it reads naturally.
            // unsignedBigInteger + autoIncrement gives us a globally-ordered
            // insertion counter without changing the UUID primary key.
            $table->unsignedBigInteger('seq')->autoIncrement()->after('id');
        });
    }

    public function down(): void
    {
        Schema::table('inventory_batches', function (Blueprint $table) {
            if (Schema::hasColumn('inventory_batches', 'seq')) {
                $table->dropColumn('seq');
            }
        });
    }
};
