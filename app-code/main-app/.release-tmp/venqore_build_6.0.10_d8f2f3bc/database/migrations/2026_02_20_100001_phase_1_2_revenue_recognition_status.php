<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 1.2 — Revenue Recognition Infrastructure
 *
 * This migration does two things:
 *
 * 1. Canonicalizes sales.status to the Phase 1.2 state machine:
 *    - draft    → invoice being built, NO financial footprint
 *    - posted   → THE TRIGGER. Goods have changed hands. Revenue is recognized.
 *    - returned → Full reversal. Revenue un-recognized.
 *    - cancelled → Void. No financial footprint.
 *
 *    The old "completed" value maps 1:1 to "posted" — a completed sale IS a posted sale.
 *    We rename it permanently so every future query is clean.
 *
 * 2. Adds a `posted_at` timestamp — the exact millisecond revenue was recognized.
 *    This is the audit-grade record of when obligations were legally created.
 *    It is NULL for drafts and is set only when status → posted.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            // The authoritative timestamp of revenue recognition.
            // NULL = not yet recognized (draft). Non-null = revenue locked in.
            $table->timestamp('posted_at')->nullable()->after('status');
        });

        // Rename "completed" → "posted" — a completed sale is a posted sale.
        // All existing completed sales have already had their journal entries fired,
        // so they are, by definition, posted. This is not a semantic change — it is
        // a label correction to match double-entry accounting vocabulary.
        DB::statement("UPDATE sales SET status = 'posted' WHERE status = 'completed'");

        // Backfill posted_at for all existing posted sales using their created_at.
        // These sales have always had revenue recognized; we are simply recording when.
        DB::statement("UPDATE sales SET posted_at = created_at WHERE status = 'posted'");
    }

    public function down(): void
    {
        DB::statement("UPDATE sales SET status = 'completed' WHERE status = 'posted'");

        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn('posted_at');
        });
    }
};
