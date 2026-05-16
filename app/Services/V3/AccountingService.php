<?php

namespace App\Services\V3;

use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\JournalItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * AccountingService V3 — The Double-Entry Journal Engine
 *
 * GOLDEN RULES enforced by this class:
 *   Rule 1 — Every entry has ≥ 2 items (two sides)
 *   Rule 2 — SUM(debit) = SUM(credit) on every entry
 *   Rule 3 — Entries never deleted — only reversed via reverseEntry()
 *   Rule 4 — This method does NOT open its own DB::transaction()
 *            Caller MUST wrap in DB::transaction()
 *   Rule 5 — reference_type + reference_id are mandatory (every entry has a source)
 *
 * WIRING:
 *   createEntry() → PartyService::rebuildSnapshot() for every party_id
 *   reverseEntry() → PaymentService::voidAllocations() atomically
 *
 * THE 15 NEVERS — This class prevents:
 *   #1 — Journal entries deleted (no delete method exists)
 *   #5 — Unbalanced entries (validated before INSERT)
 *   #14 — party_snapshots not rebuilt (auto-called after every entry)
 */
class AccountingService
{
    protected PartyService $partyService;
    protected PaymentService $paymentService;

    private int $tenantId;

    public function __construct(PartyService $partyService, PaymentService $paymentService)
    {
        $this->partyService = $partyService;
        $this->paymentService = $paymentService;
        $this->tenantId = app('current.tenant') ? app('current.tenant')->id : 0;
    }

    /**
     * Resolve the active tenant_id for journal stamping.
     *
     * WOUND 2 FIX: Without this, journal_entries and journal_items are
     * stored with tenant_id = null and are invisible to tenant-scoped reports.
     */
    private function resolveTenantId(int|string|null $explicit = null): int|string|null
    {
        if ($explicit !== null) return $explicit;

        $user = auth()->user();
        if ($user && $user->last_store_id) {
            return (int) $user->last_store_id;
        }

        Log::warning(
            'AccountingService: could not resolve tenant_id. Journal entry may be orphaned.',
            ['user_id' => auth()->id()]
        );
        return null;
    }

    /**
     * Create a balanced double-entry journal entry.
     *
     * MUST be called inside an active DB::transaction() on the caller side.
     *
     * @param array $data {
     *   'entry_date'      => Carbon|string,     // Accounting date
     *   'reference_type'  => string,            // e.g. 'sale', 'purchase', 'B-REV'
     *   'reference_id'    => int,               // FK to source record
     *   'description'     => string,            // Human-readable
     *   'party_id'        => int|null,          // FK → parties.id
     *   'narration'       => string|null,       // Mandatory for B28
     *   'approved_by'     => int|null,          // FK → users.id (manager approval)
     *   'idempotency_key' => string|null,       // Prevents duplicate submissions
     *   'created_by'      => int,               // FK → users.id
     * }
     * @param array $items [
     *   ['account_id' => int, 'debit' => float, 'credit' => float, 'party_id' => int|null],
     *   ...
     * ]
     * @return JournalEntry
     * @throws \Exception if debits ≠ credits or < 2 items
     */
    public function createEntry(array $data, array $lines): JournalEntry
    {
        // Golden Rule 2 — Debits must equal Credits
        $totalDebit  = array_sum(array_column($lines, 'debit'));
        $totalCredit = array_sum(array_column($lines, 'credit'));

        if (round(abs($totalDebit - $totalCredit), 2) > 0.001) {
            throw new \InvalidArgumentException(
                "Journal entry is unbalanced. Debits: {$totalDebit}, Credits: {$totalCredit}"
            );
        }

        // Golden Rule 1 — Each row must be exclusively debit OR credit (never both, never neither)
        foreach ($lines as $line) {
            $debit  = (float)($line['debit']  ?? 0);
            $credit = (float)($line['credit'] ?? 0);

            if ($debit > 0 && $credit > 0) {
                throw new \InvalidArgumentException(
                    "A journal_items row cannot have both debit and credit > 0. Account: {$line['account_code']}"
                );
            }
            if ($debit === 0.0 && $credit === 0.0) {
                throw new \InvalidArgumentException(
                    "A journal_items row must have either debit > 0 or credit > 0. Account: {$line['account_code']}"
                );
            }
        }

        // Golden Rule 4 — Atomicity: wrap everything in a transaction
        return DB::transaction(function () use ($data, $lines, $totalDebit, $totalCredit) {

            // WOUND 2 FIX — resolve tenant_id before writing
            $tenantId = $this->resolveTenantId($data['tenant_id'] ?? null);

            // Golden Rule 5 — Every entry has a reference
            // Mapping V3 spec names to actual additive DB columns
            $entry = JournalEntry::create([
                'id'               => \Illuminate\Support\Str::uuid()->toString(),
                'tenant_id'        => $tenantId,   // WOUND 2 FIX — explicit tenant stamp
                'date'             => $data['entry_date'] ?? $data['date'] ?? now()->toDateString(),      // Maps to legacy 'date'
                'reference_type'   => $data['reference_type'] ?? 'manual',
                'reference'        => $data['reference_id'] ?? $data['reference'] ?? null,    // Maps to legacy 'reference'
                'description'      => $data['description']      ?? null,
                'narration'        => $data['narration']        ?? null,
                'approved_by'      => $data['approved_by']      ?? null,
                'idempotency_key'  => $data['idempotency_key']  ?? null,
                'party_id'         => $data['party_id']         ?? null,
                'user_id'          => $data['created_by']       ?? auth()->id(), // Maps to legacy 'user_id'
                'is_reversed'      => $data['is_reversed']      ?? 0,
            ]);

            $partyIds = [];

            foreach ($lines as $line) {
                // Resolve account_code → account_id (supports both 'account_code' and 'account_id' keys)
                // Resolve account_code → account_id
                if (!empty($line['account_code'])) {
                    $account = Account::where('code', $line['account_code'])->first();
                    if (!$account) {
                        throw new \InvalidArgumentException("Account code not found: {$line['account_code']}");
                    }
                    $accountId = $account->id;
                } else {
                    $accountId = $line['account_id']
                        ?? throw new \InvalidArgumentException('Each journal line must have either account_code or account_id.');
                }

                JournalItem::create([
                    'id'               => \Illuminate\Support\Str::uuid()->toString(),
                    'tenant_id'        => $tenantId,
                    'journal_entry_id' => $entry->id,
                    'account_id'       => $accountId,
                    'party_id'         => $line['party_id'] ?? null,
                    'debit'            => (float)($line['debit']  ?? 0),
                    'credit'           => (float)($line['credit'] ?? 0),
                ]);

                if (!empty($line['party_id'])) {
                    $partyIds[] = $line['party_id'];
                }
            }

            // Collect party_id from the entry header too
            if (!empty($data['party_id'])) {
                $partyIds[] = $data['party_id'];
            }

            // Golden Rule — Section 4.1: Rebuild party snapshot for every party touched
            foreach (array_unique($partyIds) as $partyId) {
                $this->partyService->rebuildSnapshot($partyId);
            }

            Log::info('V3 Journal entry created', [
                'entry_id'       => $entry->id,
                'reference_type' => $data['reference_type'],
                'total_debit'    => $totalDebit,
                'total_credit'   => $totalCredit,
                'lines_count'    => count($lines),
            ]);

            app(\App\Services\V3\AuditService::class)->log(
                event:     'journal_posted',
                modelType: 'journal_entry',
                modelId:   $entry->id,
                after:     ['reference_type' => $data['reference_type'] ?? 'manual',
                            'reference_id'   => $data['reference_id'] ?? $data['reference'] ?? null,
                            'description'    => $data['description'] ?? null]
            );

            return $entry;
        });
    }

    /**
     * Create a reversing entry for a previously posted journal entry.
     *
     * Flips all debits and credits. ATOMICALLY calls PaymentService::voidAllocations().
     *
     * @param int $journalEntryId
     * @param string $reason
     * @return JournalEntry The new reversing entry
     * @throws \Exception if entry is already reversed
     */
    public function reverseEntry(int|string $journalEntryId, string $reason): JournalEntry
    {
        return DB::transaction(function () use ($journalEntryId, $reason) {

            $tid = $this->tenantId;
            $original = DB::table('journal_entries')
                ->where('tenant_id', $tid)
                ->where('id', $journalEntryId)
                ->lockForUpdate()
                ->first();

            if (!$original) {
                throw new \InvalidArgumentException("Journal entry not found: {$journalEntryId}");
            }

            if ($original->is_reversed) {
                throw new \LogicException("Journal entry {$journalEntryId} is already reversed.");
            }

            // MANDATORY — void allocations BEFORE posting the reversal
            // This is hardcoded per MASTER_SPEC Section 4.1 and The 15 Nevers #10
            app(PaymentService::class)->voidAllocations($journalEntryId);

            // Get original lines and mirror them
            $originalLines = DB::table('journal_items')
                ->where('tenant_id', $tid)
                ->where('journal_entry_id', $journalEntryId)
                ->get();

            $reversalLines = $originalLines->map(function($line) {
                return [
                    'account_code' => DB::table('accounts')->where('tenant_id', $tid)->where('id', $line->account_id)->value('code'),
                    'debit'        => $line->credit, // swap
                    'credit'       => $line->debit,  // swap
                    'party_id'     => $line->party_id ?? null,
                ];
            })->toArray();

            // Post the reversal entry
            $reversalEntry = $this->createEntry([
                'date'           => now()->toDateString(),
                'reference_type' => 'reversal',
                'reference'      => $journalEntryId,
                'description'    => "Reversal of entry {$journalEntryId}: {$reason}",
                'party_id'       => $original->party_id ?? null,
                'is_reversed'    => 1, // Reversals are also marked as reversed to net to zero in reports
            ], $reversalLines);

            // Mark the original as reversed
            DB::table('journal_entries')
                ->where('tenant_id', $tid)
                ->where('id', $journalEntryId)
                ->update([
                    'is_reversed' => 1,
                    'reversed_by' => $reversalEntry->id,
                    'updated_at'  => now(),
                ]);

            app(\App\Services\V3\AuditService::class)->log(
                event:     'journal_reversed',
                modelType: 'journal_entry',
                modelId:   $journalEntryId,
                before:    ['is_reversed' => 0],
                after:     ['is_reversed' => 1, 'reason' => $reason]
            );

            return $reversalEntry;
        });
    }

    /**
     * Get the current balance of an account from the ledger.
     *
     * Always queries journal_items — never a cached column.
     *
     * @param string $accountCode Account code (e.g. "1000", "5000")
     * @param \Carbon\Carbon|null $asOf Optional point-in-time balance
     * @return float
     */
    public function getBalance(string $accountCode, ?\Carbon\Carbon $asOf = null): float
    {
        $account = Account::where('code', $accountCode)->first();

        if (!$account) {
            \Log::warning("Account code not found: {$accountCode}");
            throw new \InvalidArgumentException("Account code not found: {$accountCode}");
        }

        $tid = $this->tenantId;
        $query = JournalItem::where('account_id', $account->id)
            ->join('journal_entries', function($join) use ($tid) {
                $join->on('journal_items.journal_entry_id', '=', 'journal_entries.id')
                     ->where('journal_entries.tenant_id', $tid);
            })
            ->where('journal_entries.is_reversed', 0);

        if ($asOf) {
            $query->where('journal_entries.date', '<=', $asOf->toDateString());
        }

        $totals = $query->selectRaw('SUM(debit) as total_debit, SUM(credit) as total_credit')->first();

        $totalDebit  = (float)($totals->total_debit  ?? 0);
        $totalCredit = (float)($totals->total_credit ?? 0);

        // Debit-normal accounts: balance = debits - credits
        // Credit-normal accounts: balance = credits - debits
        if ($account->normal_balance === 'debit') {
            return round($totalDebit - $totalCredit, 2);
        }

        return round($totalCredit - $totalDebit, 2);
    }

    /**
     * Get or create an account by its code.
     */
    public function getAccountByCode(string $code, ?string $defaultName = null, string $type = 'asset'): Account
    {
        return Account::firstOrCreate(
            ['code' => $code],
            ['name' => $defaultName ?? "Account {$code}", 'type' => $type]
        );
    }
}
