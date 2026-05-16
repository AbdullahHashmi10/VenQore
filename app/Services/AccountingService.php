<?php

namespace App\Services;

use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\JournalItem;
use Illuminate\Support\Facades\DB;
use App\Services\V3\PartyService as V3PartyService;
use Illuminate\Support\Facades\Log;

/**
 * AccountingService — The Double-Entry Journal Engine
 *
 * Phase 2.3 Fixes:
 *
 * FIX 1 — Transaction nesting:
 *   The old createEntry() wrapped in its own DB::transaction(). When called from
 *   SaleController::store() (which has its own outer transaction), a nested
 *   transaction opens a MySQL savepoint. If createEntry() throws, the catch in
 *   DB::transaction() catches it and marks the savepoint for rollback — but then
 *   re-throws so the outer transaction also rolls back. This is correct MySQL
 *   savepoint behaviour in Laravel. HOWEVER: the old inner transaction would
 *   silently commit its savepoint on success even if the outer transaction was
 *   later rolled back by a subsequent failure (e.g. FIFO stock exception fired
 *   after journal entry creation). This is a known Laravel nested transaction
 *   subtlety. The fix: createEntry() does NOT open its own transaction. It runs
 *   bare, relying on the caller's outer transaction for atomicity. If called
 *   standalone (no outer transaction), the caller must wrap it themselves.
 *
 * FIX 2 — Date must be posted_at, not created_at:
 *   The journal entry date is the revenue recognition date. The caller passes
 *   the date explicitly. For sales, SaleController now passes $sale->posted_at.
 *
 * FIX 3 — party_id, source_type, source_id on journal_entries:
 *   These columns are now written by createEntry() when provided by the caller.
 *   They enable per-party AR/AP queries as required by § 2.5 of CALCULATION_LOGIC.md.
 *
 * FIX 4 — Trial Balance validation:
 *   The debit/credit equality check now runs before writing anything.
 *   An unbalanced entry throws immediately — no partial writes possible.
 *
 * RULE: This service must NEVER be called outside of an outer DB::transaction().
 *       SaleController, PurchaseController, PaymentController all have their own
 *       outer transactions. If you are calling this from a place that does NOT
 *       have an outer transaction, wrap the caller first.
 */
class AccountingService
{
    /**
     * Create a double-entry journal entry.
     *
     * MUST be called inside an active DB::transaction() on the caller side.
     * This method does NOT open its own transaction (see FIX 1 above).
     *
     * @param array $data {
     *   date:          string|Carbon  The financial date of this entry (use posted_at for sales)
     *   reference:     string|null    Invoice number or reference code
     *   description:   string|null    Human-readable description
     *   party_id:      string|null    UUID of the party (customer/supplier) — enables AR/AP queries
     *   source_type:   string|null    e.g. 'App\Models\Sale'
     *   source_id:     string|null    UUID of the originating model
     * }
     * @param array $items  [['account_id', 'debit', 'credit', 'description'], ...]
     * @return JournalEntry
     *
     * @throws \Exception if debits ≠ credits (journal is unbalanced)
     */
    public function createEntry(array $data, array $items): JournalEntry
    {
        // ── Step 1: Validate balance BEFORE any writes ────────────────────────
        $totalDebit  = collect($items)->sum('debit');
        $totalCredit = collect($items)->sum('credit');

        if (abs($totalDebit - $totalCredit) > 0.001) {
            throw new \Exception(
                "Journal entry is unbalanced. Debits: {$totalDebit}, Credits: {$totalCredit}. " .
                "Reference: " . ($data['reference'] ?? 'N/A')
            );
        }

        // ── Step 2: Create the journal_entries header ─────────────────────────
        $entry = JournalEntry::create([
            'date'               => $data['date'] ?? now()->toDateString(),
            'reference'          => $data['reference']    ?? null,
            'description'        => $data['description']  ?? null,
            'user_id'            => auth()->id() ?? 1,
            // Phase 2.3 columns:
            'party_id'           => $data['party_id']     ?? null,
            'source_type'        => $data['source_type']  ?? null,
            'source_id'          => $data['source_id']    ?? null,
            'is_reversal'        => $data['is_reversal']  ?? false,
            'reverses_entry_id'  => $data['reverses_entry_id'] ?? null,
        ]);

        // ── Step 3: Create journal_items and update Account.balance cache ──────
        foreach ($items as $item) {
            JournalItem::create([
                'journal_entry_id' => $entry->id,
                'account_id'       => $item['account_id'],
                'debit'            => $item['debit']  ?? 0,
                'credit'           => $item['credit'] ?? 0,
                'description'      => $item['description'] ?? null,
            ]);

            // Update Account.balance — this is a denormalised cache for the accounting
            // dashboard's "all-time" display. Financial reports NEVER read this column
            // (they read journal_items directly via FinancialReportingService).
            // It is safe to update it here as it will be corrected by any reconciliation.
            $this->updateAccountBalance($item['account_id'], $item['debit'] ?? 0, $item['credit'] ?? 0);
        }

        // ── Step 4: V3 SYNC — Rebuild party snapshots ─────────────────────────
        // In V3, party balances (khata) are derived from the journal.
        // If this entry touches a party, we must rebuild their snapshot.
        $affectedParties = [];
        if (!empty($data['party_id'])) $affectedParties[] = $data['party_id'];
        foreach ($items as $item) {
            if (!empty($item['party_id'])) $affectedParties[] = $item['party_id'];
        }

        foreach (array_unique($affectedParties) as $pid) {
            try {
                app(V3PartyService::class)->rebuildSnapshot($pid);
                Log::info("V3 Party Snapshot rebuilt for party: {$pid}");
            } catch (\Exception $e) {
                Log::warning("V3 Party Snapshot rebuild failed for party: {$pid}. Error: " . $e->getMessage());
            }
        }

        return $entry;
    }

    /**
     * Create a reversing entry for a previously posted journal entry.
     *
     * Used by SaleReversalService when a posted sale is cancelled/returned.
     * The reversal entry has all debits and credits flipped.
     * Both the original entry and this reversal are permanently preserved —
     * neither is ever deleted.
     *
     * @param JournalEntry $original   The entry being reversed
     * @param string       $reason     Why it is being reversed
     * @param string|null  $partyId    The party on the reversal entry
     * @param string|null  $sourceType The source model class
     * @param string|null  $sourceId   The source model UUID
     * @return JournalEntry The new reversing entry
     */
    public function createReversingEntry(
        JournalEntry $original,
        string $reason,
        ?string $partyId = null,
        ?string $sourceType = null,
        ?string $sourceId = null
    ): JournalEntry {
        $original->load('items');

        // Flip all debits and credits
        $reversedItems = $original->items->map(function ($item) {
            return [
                'account_id'  => $item->account_id,
                'debit'       => $item->credit,   // credit becomes debit
                'credit'      => $item->debit,    // debit becomes credit
                'description' => 'REVERSAL: ' . ($item->description ?? ''),
            ];
        })->toArray();

        return $this->createEntry([
            'date'               => now()->toDateString(),
            'reference'          => 'REV-' . $original->reference,
            'description'        => 'Reversal of entry ' . $original->reference . '. Reason: ' . $reason,
            'party_id'           => $partyId,
            'source_type'        => $sourceType,
            'source_id'          => $sourceId,
            'is_reversal'        => true,
            'reverses_entry_id'  => $original->id,
        ], $reversedItems);
    }

    /**
     * Update the denormalised Account.balance cache.
     *
     * This is an optimistic cache — it will drift if journal entries are
     * created outside this service (direct DB inserts, imports, etc.).
     * The FinancialReportingService NEVER reads this column for P&L or AR/AP.
     */
    private function updateAccountBalance(string $accountId, float $debit, float $credit): void
    {
        $account = Account::findOrFail($accountId);

        // Debit-normal accounts (asset, expense): debit increases, credit decreases
        // Credit-normal accounts (liability, equity, income): credit increases, debit decreases
        if (in_array($account->type, ['asset', 'expense'])) {
            $account->increment('balance', $debit - $credit);
        } else {
            $account->increment('balance', $credit - $debit);
        }
    }

    /**
     * Get or create a chart-of-accounts record by code.
     * Used by SaleController and PurchaseController to resolve account IDs
     * without hardcoding UUIDs.
     */
    public function getAccountByCode(string $code, ?string $defaultName = null, string $type = 'asset'): Account
    {
        return Account::firstOrCreate(
            ['code' => $code],
            ['name' => $defaultName ?? $code, 'type' => $type, 'is_active' => true]
        );
    }
}
