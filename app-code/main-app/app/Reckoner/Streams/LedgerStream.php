<?php

namespace App\Reckoner\Streams;

use Illuminate\Support\Facades\DB;

/**
 * LedgerStream — Pure, Tenant-Scoped Reader for the General Ledger.
 *
 * Tables:
 *   - journal_entries (je)
 *   - journal_items (ji)
 *   - accounts (a)
 *
 * Strict Isolation Rules:
 *   - Every query explicitly filters `je.tenant_id = :tid`
 *   - Every query explicitly filters `ji.tenant_id = :tid`
 *   - Accounts table joined with explicit `a.tenant_id = :tid`
 *   - Reversals excluded via `je.is_reversed = 0`
 *   - Internal transfers excluded for cash in/out (entries where every line is cash/bank)
 */
class LedgerStream
{
    /**
     * Compute flows for measure keys across windows and optional dimensions.
     *
     * @param array $measureKeys e.g. ['gl.sales_revenue', 'gl.cogs', 'gl.income', 'gl.opex', 'gl.cash_in', 'gl.cash_out', 'gl.tax_collected', 'gl.tax_paid']
     * @param array $windows array of ['from' => 'YYYY-MM-DD', 'to' => 'YYYY-MM-DD']
     * @param array $dims array of dimension column names, e.g. ['account', 'party', 'bank_account']
     * @param int|string $tenantId
     * @return array
     */
    public function flows(array $measureKeys, array $windows, array $dims, int|string $tenantId): array
    {
        $tenantId = (string) $tenantId;
        $results = [];

        // Cash/Bank account IDs for internal transfer detection
        $cashBankAccounts = DB::table('accounts')
            ->where('tenant_id', $tenantId)
            ->where(function ($q) {
                $q->whereIn('role', ['cash', 'bank'])
                  ->orWhere(function ($sub) {
                      $sub->where('type', 'asset')->whereBetween('code', ['1000', '1099']);
                  });
            })
            ->pluck('id')
            ->all();

        // Find internal transfer entry IDs for this tenant
        $internalTransferEntryIds = [];
        if (!empty($cashBankAccounts)) {
            $internalTransferEntryIds = DB::table('journal_items')
                ->where('tenant_id', $tenantId)
                ->groupBy('journal_entry_id')
                ->havingRaw('COUNT(*) = SUM(CASE WHEN account_id IN (' . implode(',', array_map(fn($id) => "'{$id}'", $cashBankAccounts)) . ') THEN 1 ELSE 0 END)')
                ->pluck('journal_entry_id')
                ->all();
        }

        foreach ($windows as $windowKey => $window) {
            $from = $window['from'];
            $to = $window['to'];

            // Attempt accelerated read from reckoner_daily if closed, clean, and stored
            if (empty($dims) && $to < now()->toDateString() && \App\Reckoner\Rollup\DirtyDayTracker::isClean($tenantId, $from, $to)) {
                $expectedDays = \Carbon\CarbonPeriod::create($from, $to)->count();
                $stored = DB::table('reckoner_daily')
                    ->where('tenant_id', $tenantId)
                    ->whereIn('measure', $measureKeys)
                    ->where('dim', '')
                    ->whereBetween('day', [$from, $to])
                    ->groupBy('measure')
                    ->select('measure', DB::raw('COUNT(*) as days_cnt'), DB::raw('SUM(value) as total_val'))
                    ->get()
                    ->keyBy('measure');

                $allPresent = true;
                foreach ($measureKeys as $mk) {
                    if (!isset($stored[$mk]) || (int) $stored[$mk]->days_cnt < $expectedDays) {
                        $allPresent = false;
                        break;
                    }
                }

                if ($allPresent) {
                    foreach ($measureKeys as $mk) {
                        $results[$windowKey][$mk] = round((float) $stored[$mk]->total_val, 2);
                    }
                    continue;
                }
            }

            foreach ($measureKeys as $measureKey) {
                $query = DB::table('journal_items as ji')
                    ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
                    ->join('accounts as a', 'ji.account_id', '=', 'a.id')
                    ->where('je.tenant_id', $tenantId)
                    ->where('ji.tenant_id', $tenantId)
                    ->where('a.tenant_id', $tenantId)
                    ->where('je.is_reversed', 0)
                    ->whereBetween('je.date', [$from, $to]);

                $selectExpr = '0.0 as val';

                switch ($measureKey) {
                    case 'gl.sales_revenue':
                        $query->where('a.role', 'sales_revenue');
                        $selectExpr = 'SUM(ji.credit - ji.debit) as val';
                        break;

                    case 'gl.income':
                        $query->where(function ($q) {
                            $q->where('a.type', 'income')->orWhere('a.type', 'revenue');
                        });
                        $selectExpr = 'SUM(ji.credit - ji.debit) as val';
                        break;

                    case 'gl.cogs':
                        $query->where(function ($q) {
                            $q->where('a.role', 'cogs')->orWhere('a.code', '5000');
                        });
                        $selectExpr = 'SUM(ji.debit - ji.credit) as val';
                        break;

                    case 'gl.opex':
                        $query->where('a.type', 'expense')
                              ->where('a.role', '!=', 'cogs')
                              ->where('a.code', '!=', '5000');
                        $selectExpr = 'SUM(ji.debit - ji.credit) as val';
                        break;

                    case 'gl.cash_in':
                        $query->where(function ($q) {
                            $q->whereIn('a.role', ['cash', 'bank'])
                              ->orWhere(function ($sub) {
                                  $sub->where('type', 'asset')->whereBetween('code', ['1000', '1099']);
                              });
                        });
                        if (!empty($internalTransferEntryIds)) {
                            $query->whereNotIn('ji.journal_entry_id', $internalTransferEntryIds);
                        }
                        $selectExpr = 'SUM(CASE WHEN ji.debit > 0 THEN ji.debit ELSE 0 END) as val';
                        break;

                    case 'gl.cash_out':
                        $query->where(function ($q) {
                            $q->whereIn('a.role', ['cash', 'bank'])
                              ->orWhere(function ($sub) {
                                  $sub->where('type', 'asset')->whereBetween('code', ['1000', '1099']);
                              });
                        });
                        if (!empty($internalTransferEntryIds)) {
                            $query->whereNotIn('ji.journal_entry_id', $internalTransferEntryIds);
                        }
                        $selectExpr = 'SUM(CASE WHEN ji.credit > 0 THEN ji.credit ELSE 0 END) as val';
                        break;

                    case 'gl.tax_collected':
                        $query->where(function ($q) {
                            $q->where('a.role', 'tax_output')->orWhere('a.code', '2100');
                        });
                        $selectExpr = 'SUM(ji.credit - ji.debit) as val';
                        break;

                    case 'gl.tax_paid':
                        $query->where(function ($q) {
                            $q->where('a.role', 'tax_input')->orWhere('a.code', '2300');
                        });
                        $selectExpr = 'SUM(ji.debit - ji.credit) as val';
                        break;

                    case 'gl.journal_count':
                        $count = DB::table('journal_entries')
                            ->where('tenant_id', $tenantId)
                            ->where('is_reversed', 0)
                            ->whereBetween('date', [$from, $to])
                            ->count();
                        $results[$windowKey][$measureKey] = (float) $count;
                        continue 2;

                    case 'gl.reversal_count':
                        $revCount = DB::table('journal_entries')
                            ->where('tenant_id', $tenantId)
                            ->where('is_reversed', 1)
                            ->where('is_reversal', 1)
                            ->whereBetween('date', [$from, $to])
                            ->count();
                        $results[$windowKey][$measureKey] = (float) $revCount;
                        continue 2;

                    default:
                        $results[$windowKey][$measureKey] = 0.0;
                        continue 2;
                }

                $val = (float) ($query->selectRaw($selectExpr)->value('val') ?? 0.0);
                $results[$windowKey][$measureKey] = round($val, 2);
            }
        }

        return $results;
    }

    /**
     * Compute closing balances for accounts by role as of specific days.
     *
     * @param array $roles array of role strings, e.g. ['cash', 'bank', 'ar', 'ap', 'inventory', 'tax_output', 'tax_input', 'equity']
     * @param array $days array of 'YYYY-MM-DD' dates
     * @param array $dims array of dimensions e.g. ['account', 'party', 'bank_account']
     * @param int|string $tenantId
     * @return array
     */
    public function closingBalances(array $roles, array $days, array $dims, int|string $tenantId): array
    {
        $tenantId = (string) $tenantId;
        $results = [];

        foreach ($days as $asOf) {
            foreach ($roles as $role) {
                // Special handling for aggregates: liabilities, assets, equity
                if ($role === 'liabilities') {
                    $balances = DB::table('journal_items as ji')
                        ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
                        ->join('accounts as a', 'ji.account_id', '=', 'a.id')
                        ->where('je.tenant_id', $tenantId)
                        ->where('ji.tenant_id', $tenantId)
                        ->where('a.tenant_id', $tenantId)
                        ->where('a.type', 'liability')
                        ->where('je.is_reversed', 0)
                        ->where('je.date', '<=', $asOf)
                        ->selectRaw('SUM(ji.credit - ji.debit) as total')
                        ->value('total');
                    $results[$asOf][$role] = round((float) ($balances ?? 0.0), 2);
                    continue;
                }

                if ($role === 'current_assets') {
                    $balances = DB::table('journal_items as ji')
                        ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
                        ->join('accounts as a', 'ji.account_id', '=', 'a.id')
                        ->where('je.tenant_id', $tenantId)
                        ->where('ji.tenant_id', $tenantId)
                        ->where('a.tenant_id', $tenantId)
                        ->where('a.type', 'asset')
                        ->where('a.is_current', 1)
                        ->where('je.is_reversed', 0)
                        ->where('je.date', '<=', $asOf)
                        ->selectRaw('SUM(ji.debit - ji.credit) as total')
                        ->value('total');
                    $results[$asOf][$role] = round((float) ($balances ?? 0.0), 2);
                    continue;
                }

                if ($role === 'current_liabilities') {
                    $balances = DB::table('journal_items as ji')
                        ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
                        ->join('accounts as a', 'ji.account_id', '=', 'a.id')
                        ->where('je.tenant_id', $tenantId)
                        ->where('ji.tenant_id', $tenantId)
                        ->where('a.tenant_id', $tenantId)
                        ->where('a.type', 'liability')
                        ->where('a.is_current', 1)
                        ->where('je.is_reversed', 0)
                        ->where('je.date', '<=', $asOf)
                        ->selectRaw('SUM(ji.credit - ji.debit) as total')
                        ->value('total');
                    $results[$asOf][$role] = round((float) ($balances ?? 0.0), 2);
                    continue;
                }

                if ($role === 'assets') {
                    $balances = DB::table('journal_items as ji')
                        ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
                        ->join('accounts as a', 'ji.account_id', '=', 'a.id')
                        ->where('je.tenant_id', $tenantId)
                        ->where('ji.tenant_id', $tenantId)
                        ->where('a.tenant_id', $tenantId)
                        ->where('a.type', 'asset')
                        ->where('je.is_reversed', 0)
                        ->where('je.date', '<=', $asOf)
                        ->selectRaw('SUM(ji.debit - ji.credit) as total')
                        ->value('total');
                    $results[$asOf][$role] = round((float) ($balances ?? 0.0), 2);
                    continue;
                }

                if ($role === 'equity') {
                    $equityBalances = DB::table('journal_items as ji')
                        ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
                        ->join('accounts as a', 'ji.account_id', '=', 'a.id')
                        ->where('je.tenant_id', $tenantId)
                        ->where('ji.tenant_id', $tenantId)
                        ->where('a.tenant_id', $tenantId)
                        ->where('a.type', 'equity')
                        ->where('je.is_reversed', 0)
                        ->where('je.date', '<=', $asOf)
                        ->selectRaw('SUM(ji.credit - ji.debit) as total')
                        ->value('total');

                    // Add retained earnings (all-time net profit)
                    $reporting = app(\App\Services\FinancialReportingService::class);
                    $pl = $reporting->getProfitAndLoss('1900-01-01', $asOf, $tenantId);
                    $re = (float) $pl['net_profit'];

                    $totalEquity = ((float) ($equityBalances ?? 0.0)) + $re;
                    $results[$asOf][$role] = round($totalEquity, 2);
                    continue;
                }

                $query = DB::table('journal_items as ji')
                    ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
                    ->join('accounts as a', 'ji.account_id', '=', 'a.id')
                    ->where('je.tenant_id', $tenantId)
                    ->where('ji.tenant_id', $tenantId)
                    ->where('a.tenant_id', $tenantId)
                    ->where('je.is_reversed', 0)
                    ->where('je.date', '<=', $asOf);

                // Role condition with code fallback
                $query->where(function ($q) use ($role) {
                    $q->where('a.role', $role);
                    match ($role) {
                        'cash' => $q->orWhere('a.code', '1000'),
                        'bank' => $q->orWhere('a.code', '1010'),
                        'ar' => $q->orWhere('a.code', '1200'),
                        'ap' => $q->orWhere('a.code', '2000'),
                        'inventory' => $q->orWhere('a.code', '1100'),
                        'tax_output' => $q->orWhere('a.code', '2100'),
                        'tax_input' => $q->orWhere('a.code', '2300'),
                        default => null,
                    };
                });

                // Group by dims if requested
                if (in_array('bank_account', $dims, true)) {
                    $dimRows = (clone $query)
                        ->selectRaw('ji.bank_account_id, SUM(CASE WHEN a.normal_balance = "debit" THEN ji.debit - ji.credit ELSE ji.credit - ji.debit END) as balance')
                        ->groupBy('ji.bank_account_id')
                        ->get();

                    $byBank = [];
                    foreach ($dimRows as $dr) {
                        $byBank[$dr->bank_account_id ?? 'none'] = round((float) $dr->balance, 2);
                    }
                    $results[$asOf][$role . '_by_bank'] = $byBank;
                }

                // Balance signed by normal_balance
                $balance = $query->selectRaw('
                    SUM(CASE WHEN a.normal_balance = "debit" THEN ji.debit - ji.credit ELSE ji.credit - ji.debit END) as balance
                ')->value('balance');

                $results[$asOf][$role] = round((float) ($balance ?? 0.0), 2);
            }
        }

        return $results;
    }

    public function dailyFlow(string $measureKey, string $from, string $to, int|string $tenantId): array
    {
        $dates = $this->dateRange($from, $to);
        $windows = [];
        foreach ($dates as $d) {
            $windows[$d] = ['from' => $d, 'to' => $d];
        }
        $flows = $this->flows([$measureKey], $windows, [], $tenantId);
        $series = [];
        foreach ($dates as $d) {
            $series[$d] = $flows[$d][$measureKey] ?? 0.0;
        }
        return $series;
    }

    public function dailyNetProfit(string $from, string $to, int|string $tenantId): array
    {
        $dates = $this->dateRange($from, $to);
        $windows = [];
        foreach ($dates as $d) {
            $windows[$d] = ['from' => $d, 'to' => $d];
        }
        $flows = $this->flows(['gl.sales_revenue', 'gl.cogs', 'gl.opex'], $windows, [], $tenantId);
        $series = [];
        foreach ($dates as $d) {
            $f = $flows[$d];
            $series[$d] = round($f['gl.sales_revenue'] - $f['gl.cogs'] - $f['gl.opex'], 2);
        }
        return $series;
    }

    public function dailyClosingLiquidity(string $from, string $to, int|string $tenantId): array
    {
        $dates = $this->dateRange($from, $to);
        $bals = $this->closingBalances(['cash', 'bank'], $dates, [], $tenantId);
        $series = [];
        foreach ($dates as $d) {
            $series[$d] = round(($bals[$d]['cash'] ?? 0.0) + ($bals[$d]['bank'] ?? 0.0), 2);
        }
        return $series;
    }

    public function dailyCashFlowMovement(string $from, string $to, int|string $tenantId): array
    {
        $dates = $this->dateRange($from, $to);
        $windows = [];
        foreach ($dates as $d) {
            $windows[$d] = ['from' => $d, 'to' => $d];
        }
        $flows = $this->flows(['gl.cash_in', 'gl.cash_out'], $windows, [], $tenantId);
        $series = [];
        foreach ($dates as $d) {
            $series[$d] = round(($flows[$d]['gl.cash_in'] ?? 0.0) - ($flows[$d]['gl.cash_out'] ?? 0.0), 2);
        }
        return $series;
    }

    public function dailyClosingEquity(string $from, string $to, int|string $tenantId): array
    {
        $dates = $this->dateRange($from, $to);
        $bals = $this->closingBalances(['equity'], $dates, [], $tenantId);
        $series = [];
        foreach ($dates as $d) {
            $series[$d] = $bals[$d]['equity'] ?? 0.0;
        }
        return $series;
    }

    public function dailyClosingBank(string $from, string $to, int|string $tenantId): array
    {
        $dates = $this->dateRange($from, $to);
        $bals = $this->closingBalances(['bank'], $dates, [], $tenantId);
        $series = [];
        foreach ($dates as $d) {
            $series[$d] = $bals[$d]['bank'] ?? 0.0;
        }
        return $series;
    }

    public function dailyCashIn(string $from, string $to, int|string $tenantId): array
    {
        return $this->dailyFlow('gl.cash_in', $from, $to, $tenantId);
    }

    public function dailyTaxLiability(string $from, string $to, int|string $tenantId): array
    {
        $dates = $this->dateRange($from, $to);
        $bals = $this->closingBalances(['tax_output', 'tax_input'], $dates, [], $tenantId);
        $series = [];
        foreach ($dates as $d) {
            $series[$d] = round(($bals[$d]['tax_output'] ?? 0.0) - ($bals[$d]['tax_input'] ?? 0.0), 2);
        }
        return $series;
    }

    private function dateRange(string $from, string $to): array
    {
        $dates = [];
        $start = \Carbon\Carbon::parse($from);
        $end = \Carbon\Carbon::parse($to);
        while ($start->lte($end)) {
            $dates[] = $start->toDateString();
            $start->addDay();
        }
        return $dates;
    }
}
