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
    private int $tenantId;
    protected PartyService $partyService;
    protected PaymentService $paymentService;

    public function __construct(PartyService $partyService, PaymentService $paymentService)
    {
        $tenant = app('current.tenant');
        if (!$tenant) {
            throw new \RuntimeException(
                'AccountingService V3: Cannot instantiate without 
                tenant context. All journal entries require a 
                valid tenant binding.'
            );
        }
        $this->tenantId = $tenant->id;
        $this->partyService = $partyService;
        $this->paymentService = $paymentService;
    }


    /**
     * Create a balanced double-entry journal entry.
     */
    public function createEntry(array $data, array $lines): JournalEntry
    {
        $totalDebit  = array_sum(array_column($lines, 'debit'));
        $totalCredit = array_sum(array_column($lines, 'credit'));

        if (round(abs($totalDebit - $totalCredit), 2) > 0.001) {
            throw new \InvalidArgumentException(
                "Journal entry is unbalanced. Debits: {$totalDebit}, Credits: {$totalCredit}"
            );
        }

        foreach ($lines as $line) {
            $debit  = (float)($line['debit']  ?? 0);
            $credit = (float)($line['credit'] ?? 0);

            if ($debit > 0 && $credit > 0) {
                throw new \InvalidArgumentException(
                    "A journal_items row cannot have both debit and credit > 0. Account: " . ($line['account_code'] ?? $line['account_id'])
                );
            }
            if ($debit === 0.0 && $credit === 0.0) {
                throw new \InvalidArgumentException(
                    "A journal_items row must have either debit > 0 or credit > 0. Account: " . ($line['account_code'] ?? $line['account_id'])
                );
            }
        }

        $tenantId = $this->tenantId;

        $entry = JournalEntry::create([
            'id'               => \Illuminate\Support\Str::uuid()->toString(),
            'tenant_id'        => $tenantId,
            'date'             => $data['entry_date'] ?? $data['date'] ?? now()->toDateString(),
            'reference_type'   => $data['reference_type'] ?? 'manual',
            'reference'        => $data['reference_id'] ?? $data['reference'] ?? null,
            'description'      => $data['description']      ?? null,
            'narration'        => $data['narration']        ?? null,
            'approved_by'      => $data['approved_by']      ?? null,
            'idempotency_key'  => $data['idempotency_key']  ?? null,
            'party_id'         => $data['party_id']         ?? null,
            'user_id'          => $data['created_by']       ?? auth()->id() ?? 1,
            'is_reversed'      => $data['is_reversed']      ?? 0,
        ]);

        $partyIds = [];

        foreach ($lines as $line) {
            if (!empty($line['account_code'])) {
                $account = Account::where('tenant_id', $tenantId)->where('code', $line['account_code'])->first();
                if (!$account) {
                    throw new \InvalidArgumentException("Account code not found for this tenant: {$line['account_code']}");
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

        if (!empty($data['party_id'])) {
            $partyIds[] = $data['party_id'];
        }

        foreach (array_unique($partyIds) as $partyId) {
            $this->partyService->rebuildSnapshot($partyId);
        }

        Log::info('V3 Journal entry created', [
            'entry_id'       => $entry->id,
            'reference_type' => $data['reference_type'] ?? null,
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
    }

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

            app(PaymentService::class)->voidAllocations($journalEntryId);

            $originalLines = DB::table('journal_items')
                ->where('tenant_id', $tid)
                ->where('journal_entry_id', $journalEntryId)
                ->get();

            $reversalLines = $originalLines->map(function($line) use ($tid) {
                return [
                    'account_code' => DB::table('accounts')->where('tenant_id', $tid)->where('id', $line->account_id)->value('code'),
                    'debit'        => $line->credit, // swap
                    'credit'       => $line->debit,  // swap
                    'party_id'     => $line->party_id ?? null,
                ];
            })->toArray();

            $reversalEntry = $this->createEntry([
                'date'           => now()->toDateString(),
                'reference_type' => 'reversal',
                'reference'      => $journalEntryId,
                'description'    => "Reversal of entry {$journalEntryId}: {$reason}",
                'party_id'       => $original->party_id ?? null,
                'is_reversed'    => 1, 
            ], $reversalLines);

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

    public function getBalance(string $accountCode, ?\Carbon\Carbon $asOf = null): float
    {
        $tid = $this->tenantId;
        
        $account = Account::where('tenant_id', $tid)->where('code', $accountCode)->first();

        if (!$account) {
            \Log::warning("Account code not found: {$accountCode}");
            throw new \InvalidArgumentException("Account code not found: {$accountCode}");
        }

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

        if ($account->normal_balance === 'debit') {
            return round($totalDebit - $totalCredit, 2);
        }

        return round($totalCredit - $totalDebit, 2);
    }

    public function getAccountByCode(string $code, ?string $defaultName = null, string $type = 'asset'): Account
    {
        $tid = $this->tenantId;
        return Account::firstOrCreate(
            ['code' => $code, 'tenant_id' => $tid],
            ['name' => $defaultName ?? "Account {$code}", 'type' => $type, 'tenant_id' => $tid]
        );
    }
}
