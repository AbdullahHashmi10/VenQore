<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 1.2 — Audit Trail Protection for sale_item_batches
 *
 * WHY THIS EXISTS:
 * The SaleReversalService originally called $sib->delete() to clean up batch
 * deduction records when a sale was reversed. This is accounting malpractice.
 *
 * The sale_item_batches table is a financial paper trail — it proves that
 * specific inventory batches were deducted at a specific cost at a specific moment.
 * When a reversal occurs, a forensic auditor must be able to:
 *   1. See the original deduction (the batch existed, qty was taken out)
 *   2. See proof of the reversal (marked with is_reversed=true, reversed_at timestamp)
 *   3. Trace it back to the reversal event that authorized it
 *
 * If the record is deleted, the inventory_batch.remaining_qty changes without explanation.
 * That looks like silent manipulation. In a tax audit, that is catastrophic.
 *
 * THE SOLUTION:
 * Add reversal audit columns. Never run DELETE on this table from application code.
 * Instead, mark records as reversed. They stay permanently visible in the database.
 *
 * COLUMNS ADDED:
 *   is_reversed      boolean     - Has this deduction been reversed?
 *   reversed_at      timestamp   - When was the reversal executed?
 *   reversal_reason  string      - Why? (e.g. "Sale REF-001 cancelled by admin")
 *   deleted_at       timestamp   - Soft delete column (physical deletes also prohibited,
 *                                  but SoftDeletes provides an ORM safety net)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sale_item_batches', function (Blueprint $table) {
            // Reversal audit trail — the core of this migration
            $table->boolean('is_reversed')->default(false)->after('total_cogs')
                ->comment('true = this deduction was reversed by a cancellation or return');

            $table->timestamp('reversed_at')->nullable()->after('is_reversed')
                ->comment('Exact timestamp when the reversal was executed');

            $table->text('reversal_reason')->nullable()->after('reversed_at')
                ->comment('Human-readable reason: "Sale REF-001 cancelled by manager"');

            // Soft deletes as the final safety net.
            // Even if a developer accidentally calls ->delete() in future code,
            // the record is soft-deleted (deleted_at stamped) — not physically erased.
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('sale_item_batches', function (Blueprint $table) {
            $table->dropColumn(['is_reversed', 'reversed_at', 'reversal_reason', 'deleted_at']);
        });
    }
};
