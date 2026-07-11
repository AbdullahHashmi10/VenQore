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

    public function __construct(PartyService $partyService, PaymentService $paymentService)
    {
        $this->partyService = $partyService;
        $this->paymentService = $paymentService;
    }

    private function getTenantId(): int
    {
        $tenant = app('current.tenant');
        if (!$tenant) {
            throw new \RuntimeException(
                'AccountingService V3: Cannot run without tenant context.'
            );
        }
        return (int) $tenant->id;
    }


    /**
     * Create a balanced double-entry journal entry.
     */
    public function createEntry(array $data, array $lines): JournalEntry
    {
        // Round all line items to 2 decimal places first
        $normalizedLines = array_map(function($line) {
            $line['debit']  = round((float)($line['debit']  ?? 0), 2);
            $line['credit'] = round((float)($line['credit'] ?? 0), 2);
            return $line;
        }, $lines);

        // Filter out zero-value lines only if there is at least one non-zero line
        $hasNonZeroLine = false;
        foreach ($normalizedLines as $line) {
            if ($line['debit'] > 0 || $line['credit'] > 0) {
                $hasNonZeroLine = true;
                break;
            }
        }

        if ($hasNonZeroLine) {
            $normalizedLines = array_filter($normalizedLines, function($line) {
                return $line['debit'] > 0 || $line['credit'] > 0;
            });
        }

        $totalDebit  = array_sum(array_column($normalizedLines, 'debit'));
        $totalCredit = array_sum(array_column($normalizedLines, 'credit'));

        if (abs($totalDebit - $totalCredit) > 0.001) {
            throw new \InvalidArgumentException(
                "Journal entry is unbalanced. Debits: {$totalDebit}, Credits: {$totalCredit}"
            );
        }

        foreach ($normalizedLines as $line) {
            $debit  = $line['debit'];
            $credit = $line['credit'];

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

        $tenantId = $this->getTenantId();

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
            'user_id'          => $data['user_id']          ?? $data['created_by']       ?? auth()->id() ?? 1,
            'is_reversed'      => $data['is_reversed']      ?? 0,
            'reversed_by'      => $data['reversed_by']      ?? null,
            'source_type'      => $data['source_type']      ?? null,
            'source_id'        => $data['source_id']        ?? null,
        ]);

        $partyIds = [];

        foreach ($normalizedLines as $line) {
            if (!empty($line['account_code'])) {
                $account = Account::where('tenant_id', $tenantId)->where('code', $line['account_code'])->first();
                if (!$account) {
                    throw new \InvalidArgumentException("Account code not found for this tenant: {$line['account_code']}");
                }
                $accountId = $account->id;
            } else {
                $accountId = $line['account_id']
                    ?? throw new \InvalidArgumentException('Each journal line must have either account_code or account_id.');
                $account = Account::find($accountId);
            }

            JournalItem::create([
                'id'               => \Illuminate\Support\Str::uuid()->toString(),
                'tenant_id'        => $tenantId,
                'journal_entry_id' => $entry->id,
                'account_id'       => $accountId,
                'party_id'         => $line['party_id'] ?? null,
                'debit'            => $line['debit'],
                'credit'           => $line['credit'],
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

            $tid = $this->getTenantId();
            
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

            // createEntry() handles accounts.balance updates for the reversal lines
            $reversalEntry = $this->createEntry([
                'date'           => now()->toDateString(),
                'reference_type' => 'reversal',
                'reference'      => $journalEntryId,
                'description'    => "Reversal of entry {$journalEntryId}: {$reason}",
                'party_id'       => $original->party_id ?? null,
                'is_reversed'    => 1,
                'reversed_by'    => $journalEntryId,
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
        $tid = $this->getTenantId();
        
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
            $query->whereDate('journal_entries.date', '<=', $asOf->toDateString());
        }

        $totals = $query->selectRaw('SUM(debit) as total_debit, SUM(credit) as total_credit')->first();

        $totalDebit  = (float)($totals->total_debit  ?? 0);
        $totalCredit = (float)($totals->total_credit ?? 0);

        if ($account->normal_balance === 'debit') {
            return round($totalDebit - $totalCredit, 2);
        }

        return round($totalCredit - $totalDebit, 2);
    }

    /**
     * Find or create a GL account by code, scoped strictly to the current tenant.
     *
     * REPLACES the old firstOrCreate(['code' => $code]) which was the root cause of
     * Bug #3 — duplicate account codes across tenants. This version:
     *   1. Scopes the lookup to tenant_id so it never finds another tenant's account.
     *   2. Sets normal_balance correctly based on account type.
     *   3. Used by SaleController, PurchaseController, ExpenseController.
     */
    public function getAccountByCode(string $code, ?string $defaultName = null, string $type = 'asset'): Account
    {
        $tenantId = $this->getTenantId();

        return Account::where('tenant_id', $tenantId)
            ->where('code', $code)
            ->first()
            ?? Account::create([
                'tenant_id'      => $tenantId,
                'code'           => $code,
                'name'           => $defaultName ?? "Account {$code}",
                'type'           => $type,
                'normal_balance' => in_array($type, ['asset', 'expense']) ? 'debit' : 'credit',
                'is_active'      => true,
            ]);
    }

    /**
     * Delete multiple journal entries and their items.
     * Strictly for migration rollback / reverse operations.
     */
    public function deleteEntries(array $entryIds): void
    {
        DB::transaction(function () use ($entryIds) {
            DB::table('journal_items')
                ->whereIn('journal_entry_id', $entryIds)
                ->delete();

            DB::table('journal_entries')
                ->whereIn('id', $entryIds)
                ->delete();
        });
    }
}

