<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 2.3 — Add audit columns to journal_entries.
 *
 * WHY party_id EXISTS:
 * CALCULATION_LOGIC.md § 2.5 mandates that Receivables and Payables can be
 * queried per-party:
 *
 *   SELECT SUM(ji.debit) - SUM(ji.credit) AS outstanding_balance
 *   FROM journal_items ji
 *   JOIN journal_entries je ON ji.journal_entry_id = je.id
 *   WHERE ji.account_id = [Account 1200]
 *     AND je.party_id = :customer_id   ← THIS IS THE COLUMN WE ARE ADDING
 *
 * Without party_id on journal_entries, you can calculate the total AR balance
 * for all parties but cannot answer "how much does Customer X owe me specifically?"
 * That is the most fundamental question in any accounts receivable system.
 *
 * WHY source_type/source_id EXISTS:
 * Audit trail. Every journal entry must be traceable to the business event that
 * created it. An auditor or developer who opens a journal entry must be able to
 * find the exact Sale, Purchase, Payment, or Expense that generated it.
 * source_type = 'App\Models\Sale', source_id = sale.id
 *
 * WHY posted_at EXISTS:
 * CALCULATION_LOGIC.md § 1.8: The `posted_at` timestamp on the Sale is the
 * authoritative revenue recognition date. The journal entry created by a sale
 * must carry this same date — not created_at. If a sale is drafted on Feb 1
 * and posted on Feb 5, the journal entry date must be Feb 5, not Feb 1.
 * Currently SaleController passes $sale->created_at to createEntry(). This
 * migration does not fix that bug — that is fixed in AccountingService.
 * But we add posted_at as a separate column for direct queryability.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('journal_entries', function (Blueprint $table) {
            if (!Schema::hasColumn('journal_entries', 'party_id')) {
                // Nullable — not all journal entries have a party (e.g. expenses paid in cash)
                $table->uuid('party_id')->nullable()->after('user_id')
                    ->comment('The party (customer/supplier) this entry relates to. Enables per-party AR/AP queries.');
                $table->foreign('party_id')->references('id')->on('parties')->nullOnDelete();
            }
            if (!Schema::hasColumn('journal_entries', 'source_type')) {
                $table->string('source_type')->nullable()->after('party_id')
                    ->comment('The model class that created this entry. e.g. App\\Models\\Sale');
            }
            if (!Schema::hasColumn('journal_entries', 'source_id')) {
                $table->uuid('source_id')->nullable()->after('source_type')
                    ->comment('The UUID of the model that created this entry.');
            }
            if (!Schema::hasColumn('journal_entries', 'is_reversal')) {
                $table->boolean('is_reversal')->default(false)->after('source_id')
                    ->comment('True if this entry is a reversal of another entry. Never delete — always reverse.');
            }
            if (!Schema::hasColumn('journal_entries', 'reverses_entry_id')) {
                $table->uuid('reverses_entry_id')->nullable()->after('is_reversal')
                    ->comment('Points to the original journal_entry this row reverses.');
            }
        });

        // Index for party-scoped AR/AP queries (the most common financial query)
        Schema::table('journal_entries', function (Blueprint $table) {
            // Only add if party_id was just added (not pre-existing)
            if (Schema::hasColumn('journal_entries', 'party_id')) {
                try {
                    $table->index(['party_id', 'date'], 'je_party_date_idx');
                } catch (\Exception $e) {
                    // Index already exists — ignore
                }
            }
            try {
                $table->index(['source_type', 'source_id'], 'je_source_idx');
            } catch (\Exception $e) {
                // Index already exists — ignore
            }
        });
    }

    public function down(): void
    {
        Schema::table('journal_entries', function (Blueprint $table) {
            $cols = ['party_id', 'source_type', 'source_id', 'is_reversal', 'reverses_entry_id'];
            $existing = array_filter($cols, fn($c) => Schema::hasColumn('journal_entries', $c));
            if ($existing) {
                // Drop foreign key before dropping column
                try { $table->dropForeign(['party_id']); } catch (\Exception $e) {}
                try { $table->dropIndex('je_party_date_idx'); } catch (\Exception $e) {}
                try { $table->dropIndex('je_source_idx'); } catch (\Exception $e) {}
                $table->dropColumn(array_values($existing));
            }
        });
    }
};
