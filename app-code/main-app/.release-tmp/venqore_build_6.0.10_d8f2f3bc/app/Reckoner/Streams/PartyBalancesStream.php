<?php

namespace App\Reckoner\Streams;

use Illuminate\Support\Facades\DB;

/**
 * PartyBalancesStream: Pure tenant-explicit reader for customer/supplier balances.
 * Tables: journal_items, journal_entries, accounts, parties
 */
class PartyBalancesStream
{
    /**
     * Get AR and AP balances grouped by party.
     *
     * @param string $role 'ar' or 'ap'
     * @param string $asOf Date 'YYYY-MM-DD'
     * @param int|string $tenantId
     * @return array<string, float> party_id => balance
     */
    public function balancesByParty(string $role, string $asOf, int|string $tenantId): array
    {
        $code = $role === 'ar' ? '1200' : '2000';

        $rows = DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('je.tenant_id', $tenantId)
            ->where('ji.tenant_id', $tenantId)
            ->where('a.tenant_id', $tenantId)
            ->where('je.is_reversed', 0)
            ->where('je.date', '<=', $asOf)
            ->whereNotNull('ji.party_id')
            ->where(function ($q) use ($role, $code) {
                $q->where('a.role', $role)->orWhere('a.code', $code);
            })
            ->selectRaw('ji.party_id, SUM(CASE WHEN a.normal_balance = "debit" THEN ji.debit - ji.credit ELSE ji.credit - ji.debit END) as balance')
            ->groupBy('ji.party_id')
            ->get();

        $result = [];
        foreach ($rows as $r) {
            $result[$r->party_id] = round((float) $r->balance, 2);
        }

        return $result;
    }

    /**
     * Aging breakdown of open invoices/bills as of a specific date.
     * Buckets: 0-30, 31-60, 61-90, 90+
     */
    public function aging(string $type, string $asOf, int|string $tenantId): array
    {
        $buckets = [
            '0_30'  => 0.0,
            '31_60' => 0.0,
            '61_90' => 0.0,
            '90_plus' => 0.0,
        ];

        if ($type === 'ar') {
            $sales = DB::table('sales')
                ->where('tenant_id', $tenantId)
                ->where('payment_method', 'credit')
                ->where(DB::raw('DATE(COALESCE(posted_at, created_at))'), '<=', $asOf)
                ->whereIn('status', ['posted', 'completed', 'active'])
                ->whereNull('deleted_at')
                ->select('id', DB::raw('DATE(COALESCE(posted_at, created_at)) as sale_date'), 'invoice_total', 'total')
                ->get();

            foreach ($sales as $sale) {
                $total = (float) ($sale->invoice_total ?? $sale->total ?? 0.0);
                $allocated = (float) DB::table('allocations')
                    ->where('tenant_id', $tenantId)
                    ->where('sale_id', $sale->id)
                    ->where('status', 'active')
                    ->sum('allocated_amount');

                $open = $total - $allocated;
                if ($open > 0.001) {
                    $diffDays = \Carbon\Carbon::parse($sale->sale_date)->diffInDays(\Carbon\Carbon::parse($asOf));
                    if ($diffDays <= 30) {
                        $buckets['0_30'] += $open;
                    } elseif ($diffDays <= 60) {
                        $buckets['31_60'] += $open;
                    } elseif ($diffDays <= 90) {
                        $buckets['61_90'] += $open;
                    } else {
                        $buckets['90_plus'] += $open;
                    }
                }
            }
        } else {
            $purchases = DB::table('purchases')
                ->where('tenant_id', $tenantId)
                ->where('purchase_date', '<=', $asOf)
                ->where('workflow_status', '!=', 'cancelled')
                ->select('id', 'purchase_date', 'total')
                ->get();

            foreach ($purchases as $p) {
                $total = (float) $p->total;
                $allocated = (float) DB::table('allocations')
                    ->where('tenant_id', $tenantId)
                    ->where('purchase_id', $p->id)
                    ->where('status', 'active')
                    ->sum('allocated_amount');

                $open = $total - $allocated;
                if ($open > 0.001) {
                    $diffDays = \Carbon\Carbon::parse($p->purchase_date)->diffInDays(\Carbon\Carbon::parse($asOf));
                    if ($diffDays <= 30) {
                        $buckets['0_30'] += $open;
                    } elseif ($diffDays <= 60) {
                        $buckets['31_60'] += $open;
                    } elseif ($diffDays <= 90) {
                        $buckets['61_90'] += $open;
                    } else {
                        $buckets['90_plus'] += $open;
                    }
                }
            }
        }

        foreach ($buckets as &$b) {
            $b = round($b, 2);
        }

        return $buckets;
    }

    /**
     * Parties with AR balance > credit_limit > 0.
     */
    public function overLimitParties(int|string $tenantId, string $asOf): array
    {
        $balances = $this->balancesByParty('ar', $asOf, $tenantId);

        $parties = DB::table('parties')
            ->where('tenant_id', $tenantId)
            ->where('type', 'customer')
            ->whereNotNull('credit_limit')
            ->where('credit_limit', '>', 0)
            ->get();

        $overLimit = [];
        foreach ($parties as $p) {
            $bal = $balances[$p->id] ?? 0.0;
            $limit = (float) $p->credit_limit;
            if ($bal > $limit) {
                $overLimit[] = [
                    'id'           => $p->id,
                    'name'         => $p->name,
                    'balance'      => $bal,
                    'credit_limit' => $limit,
                    'over_by'      => round($bal - $limit, 2),
                ];
            }
        }

        return $overLimit;
    }
}
