<?php

namespace App\Services;

use App\Models\Account;
use Illuminate\Support\Facades\DB;

class LedgerService
{
    /**
     * Compute the net balance owed by or to a party.
     *
     * For a CUSTOMER  → positive = they owe us  (we have AR > payments received)
     * For a SUPPLIER  → positive = we owe them  (they have AP > payments made)
     *
     * Uses double-entry journal_items only (no stale current_balance column).
     * Excludes reversed entries. Scoped to the given tenant.
     *
     * @param  int         $partyId
     * @param  int         $tenantId
     * @param  string|null $partyType  'customer'|'supplier'|null (auto-detects from Party model if null)
     * @return float
     */
    public static function partyNetBalance(int $partyId, int $tenantId, ?string $partyType = null): float
    {
        // Resolve party type if not supplied
        if ($partyType === null) {
            $partyType = DB::table('parties')
                ->where('id', $partyId)
                ->where('tenant_id', $tenantId)
                ->value('type') ?? 'customer';
        }

        // Resolve account codes — cache per tenant to avoid repeated lookups
        [$arCode, $apCode] = static::accountCodes($tenantId);

        // Sum journal movements for this party on AR account (1200)
        $arBalance = DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('je.tenant_id', $tenantId)
            ->where('je.is_reversed', 0)
            ->where('ji.party_id', $partyId)
            ->where('a.code', $arCode)
            ->selectRaw('COALESCE(SUM(ji.debit),0) - COALESCE(SUM(ji.credit),0) as net')
            ->value('net') ?? 0;

        // Sum journal movements for this party on AP account (2000)
        $apBalance = DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('je.tenant_id', $tenantId)
            ->where('je.is_reversed', 0)
            ->where('ji.party_id', $partyId)
            ->where('a.code', $apCode)
            ->selectRaw('COALESCE(SUM(ji.credit),0) - COALESCE(SUM(ji.debit),0) as net')
            ->value('net') ?? 0;

        // For customers: AR drives what they owe (AR debit − credit)
        // For suppliers: AP drives what we owe (AP credit − debit)
        if ($partyType === 'supplier') {
            return (float) ($apBalance - $arBalance);
        }

        return (float) ($arBalance - $apBalance);
    }

    /**
     * Resolve AR and AP account codes for the tenant.
     * Cached in static array to avoid N+1 on list pages.
     */
    protected static array $accountCodeCache = [];

    protected static function accountCodes(int $tenantId): array
    {
        if (isset(static::$accountCodeCache[$tenantId])) {
            return static::$accountCodeCache[$tenantId];
        }

        $ar = Account::where('tenant_id', $tenantId)
            ->where(function ($q) { $q->where('code', '1200')->orWhere('type', 'accounts_receivable'); })
            ->orderByRaw("CASE WHEN code = '1200' THEN 0 ELSE 1 END")
            ->value('code') ?? '1200';

        $ap = Account::where('tenant_id', $tenantId)
            ->where(function ($q) { $q->where('code', '2000')->orWhere('type', 'accounts_payable'); })
            ->orderByRaw("CASE WHEN code = '2000' THEN 0 ELSE 1 END")
            ->value('code') ?? '2000';

        static::$accountCodeCache[$tenantId] = [$ar, $ap];
        return static::$accountCodeCache[$tenantId];
    }
}
