<?php

namespace App\Services\V3;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PartyService
{
    private $tenantId;

    public function __construct() {
        $this->tenantId = app('current.tenant')->id;
    }
    /**
     * OWNS: party_snapshots
     * Called automatically by AccountingService::createEntry()
     * for every party_id present in journal lines.
     */

    /**
     * Rebuild the cached balance for a party from the live ledger.
     * If accountCode is null, rebuilds all accounts this party appears on.
     */
    public function rebuildSnapshot(string|int $partyId, ?string $accountCode = null): void
    {
        $tid = $this->tenantId;
        // Determine which accounts to rebuild
        if ($accountCode !== null) {
            $account = DB::table('accounts')->where('tenant_id', $tid)->where('code', $accountCode)->first();
            $accountIds = $account ? [$account->id => $account] : [];
        } else {
            // Find all accounts this party has journal_items on
            $accountIds = DB::table('journal_items')
                ->where('journal_items.tenant_id', $tid)
                ->join('accounts', function($join) use ($tid) {
                    $join->on('journal_items.account_id', '=', 'accounts.id')
                         ->where('accounts.tenant_id', $tid);
                })
                ->where('journal_items.party_id', $partyId)
                ->select('accounts.id', 'accounts.code', 'accounts.normal_balance')
                ->distinct()
                ->get()
                ->keyBy('id');
        }

        foreach ($accountIds as $accountId => $account) {
            $this->rebuildSingleSnapshot($partyId, $accountId, $account);
        }
    }

    /**
     * Get the cached balance for a party on a specific account.
     * Falls back to live ledger query if snapshot is missing.
     */
    public function getBalance(string|int $partyId, string $accountCode): float
    {
        $tid = $this->tenantId;
        $account = DB::table('accounts')->where('tenant_id', $tid)->where('code', $accountCode)->first();
        if (!$account) return 0.00;

        $snapshot = DB::table('party_snapshots')
            ->where('tenant_id', $tid)
            ->where('party_id', $partyId)
            ->where('account_id', $account->id)
            ->first();

        if ($snapshot) {
            return (float) $snapshot->cached_balance;
        }

        // Fallback — rebuild from live ledger and return
        $this->rebuildSingleSnapshot($partyId, $account->id, $account);

        $rebuilt = DB::table('party_snapshots')
            ->where('tenant_id', $tid)
            ->where('party_id', $partyId)
            ->where('account_id', $account->id)
            ->first();

        return $rebuilt ? (float) $rebuilt->cached_balance : 0.00;
    }

    // ─── Private ──────────────────────────────────────────────────────

    private function rebuildSingleSnapshot(
        string|int $partyId,
        string|int $accountId,
        object $account
    ): void {
        $tid = $this->tenantId;
        $totals = DB::table('journal_items')
            ->where('journal_items.tenant_id', $tid)
            ->join('journal_entries', function($join) use ($tid) {
                $join->on('journal_items.journal_entry_id', '=', 'journal_entries.id')
                     ->where('journal_entries.tenant_id', $tid);
            })
            ->where('journal_items.party_id', $partyId)
            ->where('journal_items.account_id', $accountId)
            ->where('journal_entries.is_reversed', 0)
            ->selectRaw('SUM(debit) as total_debit, SUM(credit) as total_credit')
            ->first();

        $totalDebit  = (float) ($totals->total_debit  ?? 0);
        $totalCredit = (float) ($totals->total_credit ?? 0);

        $balance = $account->normal_balance === 'debit'
            ? round($totalDebit - $totalCredit, 2)
            : round($totalCredit - $totalDebit, 2);

        $existing = DB::table('party_snapshots')
            ->where('tenant_id', $tid)
            ->where('party_id', $partyId)
            ->where('account_id', $accountId)
            ->first();

        if ($existing) {
            DB::table('party_snapshots')
                ->where('tenant_id', $tid)
                ->where('party_id', $partyId)
                ->where('account_id', $accountId)
                ->update([
                    'cached_balance'  => $balance,
                    'last_updated_at' => now(),
                ]);
        } else {
            DB::table('party_snapshots')->insert([
                'id'              => Str::uuid()->toString(),
                'tenant_id'       => $tid,
                'party_id'        => $partyId,
                'account_id'      => $accountId,
                'cached_balance'  => $balance,
                'last_updated_at' => now(),
            ]);
        }
    }
}
