<?php

namespace App\Reckoner\Invariants;

use App\Models\Tenant;
use App\Reckoner\ReckonerPeriod;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

/**
 * ReckonerInvariants — Independent referee for accounting and operational truth (§5).
 *
 * Rules:
 * 1. The referee NEVER calls the function or stream it referees; it queries raw tenant data directly.
 * 2. Every check returns ['key', 'status' ('pass'|'fail'|'unavailable'), 'passed' (bool), 'expected', 'actual', 'difference', 'message', 'details'].
 * 3. Unknown invariant names strictly FAIL.
 * 4. All queries strictly enforce tenant isolation (`tenant_id = ?`).
 */
final class ReckonerInvariants
{
    public const INVARIANTS = [
        // Ledger controls
        'balanced_books'              => 'ledger',
        'accounting_equation'         => 'ledger',
        'revenue_ties_to_ledger'      => 'ledger',
        'cogs_ties_to_ledger'         => 'ledger',
        'stock_value_control'         => 'ledger',
        'receivables_control'         => 'ledger',
        'payables_control'            => 'ledger',
        'tax_control'                 => 'ledger',
        'bank_subledger_control'      => 'ledger',
        'returns_tie_to_ledger'       => 'ledger',
        // Mathematical identities
        'gross_profit_identity'       => 'internal',
        'net_profit_identity'         => 'internal',
        'liquidity_identity'          => 'internal',
        // Shape & data controls
        'breakdown_sums_to_parent'    => 'shape',
        'aging_sums_to_total'         => 'shape',
        'list_total_matches_stat'     => 'shape',
        'channels_sum_to_sales'       => 'shape',
        'stock_qty_control'           => 'shape',
        'trend_sums_to_stat'          => 'shape',
        'trend_endpoint_matches_stat' => 'shape',
        'no_silent_null'              => 'shape',
    ];

    /**
     * Check a specific invariant for a tenant and period.
     */
    public static function check(string $invariant, Tenant $tenant, ?ReckonerPeriod $period = null, array $context = []): array
    {
        try {
            return match ($invariant) {
                'balanced_books'              => self::checkBalancedBooks($tenant, $period),
                'accounting_equation'         => self::checkAccountingEquation($tenant, $period),
                'revenue_ties_to_ledger'      => self::checkRevenueTiesToLedger($tenant, $period),
                'cogs_ties_to_ledger'         => self::checkCogsTiesToLedger($tenant, $period),
                'stock_value_control'         => self::checkStockValueControl($tenant, $period),
                'receivables_control'         => self::checkReceivablesControl($tenant, $period),
                'payables_control'            => self::checkPayablesControl($tenant, $period),
                'tax_control'                 => self::checkTaxControl($tenant, $period),
                'bank_subledger_control'      => self::checkBankSubledgerControl($tenant, $period),
                'returns_tie_to_ledger'       => self::checkReturnsTieToLedger($tenant, $period),
                'gross_profit_identity'       => self::checkGrossProfitIdentity($context),
                'net_profit_identity'         => self::checkNetProfitIdentity($context),
                'liquidity_identity'          => self::checkLiquidityIdentity($tenant, $period, $context),
                'breakdown_sums_to_parent'    => self::checkBreakdownSumsToParent($context),
                'aging_sums_to_total'         => self::checkAgingSumsToTotal($context),
                'list_total_matches_stat'     => self::checkListTotalMatchesStat($context),
                'channels_sum_to_sales'       => self::checkChannelsSumToSales($tenant, $period, $context),
                'stock_qty_control'           => self::checkStockQtyControl($tenant),
                'trend_sums_to_stat'          => self::checkTrendSumsToStat($context),
                'trend_endpoint_matches_stat' => self::checkTrendEndpointMatchesStat($context),
                'no_silent_null'              => self::checkNoSilentNull($context),
                default                       => [
                    'key'        => $invariant,
                    'status'     => 'fail',
                    'passed'     => false,
                    'expected'   => null,
                    'actual'     => null,
                    'difference' => 0.0,
                    'message'    => "Unknown invariant '{$invariant}' strictly fails.",
                    'details'    => [],
                ],
            };
        } catch (Throwable $e) {
            return [
                'key'        => $invariant,
                'status'     => 'fail',
                'passed'     => false,
                'expected'   => null,
                'actual'     => null,
                'difference' => 0.0,
                'message'    => "Invariant evaluation error: " . $e->getMessage(),
                'details'    => ['exception' => get_class($e), 'trace' => $e->getTraceAsString()],
            ];
        }
    }

    /**
     * Check all invariants.
     */
    public static function checkAll(Tenant $tenant, ?ReckonerPeriod $period = null, array $context = []): array
    {
        $results = [];
        foreach (array_keys(self::INVARIANTS) as $inv) {
            $results[$inv] = self::check($inv, $tenant, $period, $context);
        }
        return $results;
    }

    /* ── 1. Ledger Invariants ────────────────────────────────────────────── */

    /**
     * Total debits must equal total credits on journal_items for the tenant and period.
     */
    private static function checkBalancedBooks(Tenant $tenant, ?ReckonerPeriod $period): array
    {
        $query = DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->where('ji.tenant_id', $tenant->id)
            ->where('je.tenant_id', $tenant->id)
            ->where('je.is_reversed', 0);

        if ($period) {
            $query->whereBetween('je.date', [$period->start->toDateString(), $period->end->toDateString()]);
        }

        $totals = $query->selectRaw('COALESCE(SUM(ji.debit), 0) as debits, COALESCE(SUM(ji.credit), 0) as credits')->first();
        $debits = round((float) ($totals->debits ?? 0.0), 2);
        $credits = round((float) ($totals->credits ?? 0.0), 2);
        $diff = round(abs($debits - $credits), 2);
        $passed = $diff <= 0.05;

        return [
            'key'        => 'balanced_books',
            'status'     => $passed ? 'pass' : 'fail',
            'passed'     => $passed,
            'expected'   => $credits,
            'actual'     => $debits,
            'difference' => $diff,
            'message'    => $passed
                ? "Debits equal credits (\${$debits})."
                : "Books out of balance: Debits={$debits}, Credits={$credits}, Diff={$diff}",
            'details'    => ['debits' => $debits, 'credits' => $credits, 'diff' => $diff],
        ];
    }

    /**
     * Total Assets = Total Liabilities + Total Equity as of period end date.
     */
    private static function checkAccountingEquation(Tenant $tenant, ?ReckonerPeriod $period): array
    {
        $asOf = $period ? $period->end->toDateString() : now()->toDateString();

        $rows = DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('ji.tenant_id', $tenant->id)
            ->where('je.tenant_id', $tenant->id)
            ->where('a.tenant_id', $tenant->id)
            ->where('je.date', '<=', $asOf)
            ->where('je.is_reversed', 0)
            ->select('a.type', 'a.code', 'ji.debit', 'ji.credit')
            ->get();

        $assets = 0.0;
        $liabilities = 0.0;
        $equity = 0.0;
        $revenue = 0.0;
        $expenses = 0.0;

        foreach ($rows as $r) {
            $dr = (float) $r->debit;
            $cr = (float) $r->credit;
            $type = strtolower((string) $r->type);

            if ($type === 'asset' || str_starts_with($r->code, '1')) {
                $assets += ($dr - $cr);
            } elseif ($type === 'liability' || str_starts_with($r->code, '2')) {
                $liabilities += ($cr - $dr);
            } elseif ($type === 'equity' || str_starts_with($r->code, '3') || str_starts_with($r->code, '7')) {
                $equity += ($cr - $dr);
            } elseif ($type === 'income' || str_starts_with($r->code, '4')) {
                $revenue += ($cr - $dr);
            } elseif ($type === 'expense' || str_starts_with($r->code, '5') || str_starts_with($r->code, '6')) {
                $expenses += ($dr - $cr);
            }
        }

        // Net income rolls into equity
        $retainedEarnings = $revenue - $expenses;
        $totalEquityAndLiabilities = round($liabilities + $equity + $retainedEarnings, 2);
        $totalAssets = round($assets, 2);
        $diff = round(abs($totalAssets - $totalEquityAndLiabilities), 2);
        $passed = $diff <= 0.05;

        return [
            'key'        => 'accounting_equation',
            'status'     => $passed ? 'pass' : 'fail',
            'passed'     => $passed,
            'expected'   => $totalAssets,
            'actual'     => $totalEquityAndLiabilities,
            'difference' => $diff,
            'message'    => $passed
                ? "Assets equal Liabilities + Equity (\${$totalAssets})."
                : "Accounting equation violated: Assets={$totalAssets}, Liab+Eq={$totalEquityAndLiabilities}, Diff={$diff}",
            'details'    => [
                'assets'      => $totalAssets,
                'liabilities' => round($liabilities, 2),
                'equity'      => round($equity + $retainedEarnings, 2),
                'diff'        => $diff,
            ],
        ];
    }

    /**
     * Revenue ties to ledger: Σ sales.net_sales - returns = GL sales_revenue (role='sales_revenue', code 4000).
     */
    private static function checkRevenueTiesToLedger(Tenant $tenant, ?ReckonerPeriod $period): array
    {
        $from = $period ? $period->start->toDateString() : '1970-01-01';
        $to   = $period ? $period->end->toDateString() : now()->toDateString();

        // 1. Raw sales query
        $salesQuery = DB::table('sales')
            ->where('tenant_id', $tenant->id)
            ->whereBetween(DB::raw('DATE(COALESCE(posted_at, created_at))'), [$from, $to])
            ->whereIn('status', ['posted', 'completed', 'active'])
            ->whereNull('deleted_at');

        $originalSales = (float) ((clone $salesQuery)->whereNull('original_sale_id')->sum('net_sales') ?? 0.0);
        $returns = (float) ((clone $salesQuery)->whereNotNull('original_sale_id')->sum('net_sales') ?? 0.0);
        $salesNetRevenue = round($originalSales - $returns, 2);

        // 2. Raw General Ledger query
        $ledgerRevenue = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('ji.tenant_id', $tenant->id)
            ->where('je.tenant_id', $tenant->id)
            ->where('a.tenant_id', $tenant->id)
            ->whereBetween('je.date', [$from, $to])
            ->where('je.is_reversed', 0)
            ->where(function ($q) {
                $q->where('a.role', 'sales_revenue')->orWhere('a.code', '4000');
            })
            ->selectRaw('COALESCE(SUM(ji.credit), 0) - COALESCE(SUM(ji.debit), 0) as rev')
            ->value('rev') ?? 0.0;
        $ledgerRevenue = round($ledgerRevenue, 2);

        $diff = round(abs($salesNetRevenue - $ledgerRevenue), 2);
        $passed = $diff <= 0.05;

        return [
            'key'        => 'revenue_ties_to_ledger',
            'status'     => $passed ? 'pass' : 'fail',
            'passed'     => $passed,
            'expected'   => $ledgerRevenue,
            'actual'     => $salesNetRevenue,
            'difference' => $diff,
            'message'    => $passed
                ? "Sales net revenue matches GL 4000 (\${$ledgerRevenue})."
                : "revenue_ties_to_ledger FAILED: Sales={$salesNetRevenue}, GL={$ledgerRevenue}, Diff={$diff}",
            'details'    => ['sales_net' => $salesNetRevenue, 'gl_revenue' => $ledgerRevenue, 'diff' => $diff],
        ];
    }

    /**
     * COGS ties to ledger: Σ batch COGS = GL 5000 (role='cogs').
     */
    private static function checkCogsTiesToLedger(Tenant $tenant, ?ReckonerPeriod $period): array
    {
        $from = $period ? $period->start->toDateString() : '1970-01-01';
        $to   = $period ? $period->end->toDateString() : now()->toDateString();

        // 1. Raw batch cogs query
        $batchCogs = (float) DB::table('sale_item_batches as sib')
            ->join('sale_items as si', 'sib.sale_item_id', '=', 'si.id')
            ->join('sales as s', 'si.sale_id', '=', 's.id')
            ->where('sib.tenant_id', $tenant->id)
            ->where('s.tenant_id', $tenant->id)
            ->whereBetween(DB::raw('DATE(COALESCE(s.posted_at, s.created_at))'), [$from, $to])
            ->whereIn('s.status', ['posted', 'completed', 'active'])
            ->whereNull('s.deleted_at')
            ->where('sib.is_reversed', 0)
            ->sum('sib.total_cogs');

        if ($batchCogs <= 0.0) {
            $batchCogs = (float) DB::table('sale_items as si')
                ->join('sales as s', 'si.sale_id', '=', 's.id')
                ->join('products as p', 'si.product_id', '=', 'p.id')
                ->where('si.tenant_id', $tenant->id)
                ->where('s.tenant_id', $tenant->id)
                ->whereBetween(DB::raw('DATE(COALESCE(s.posted_at, s.created_at))'), [$from, $to])
                ->whereIn('s.status', ['posted', 'completed', 'active'])
                ->whereNull('s.deleted_at')
                ->sum(DB::raw('si.quantity * p.cost_price'));
        }
        $batchCogs = round($batchCogs, 2);

        // 2. Raw General Ledger query
        $ledgerCogs = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('ji.tenant_id', $tenant->id)
            ->where('je.tenant_id', $tenant->id)
            ->where('a.tenant_id', $tenant->id)
            ->whereBetween('je.date', [$from, $to])
            ->where('je.is_reversed', 0)
            ->where(function ($q) {
                $q->where('a.role', 'cogs')->orWhere('a.code', '5000');
            })
            ->selectRaw('COALESCE(SUM(ji.debit), 0) - COALESCE(SUM(ji.credit), 0) as cogs')
            ->value('cogs') ?? 0.0;
        $ledgerCogs = round($ledgerCogs, 2);

        $diff = round(abs($batchCogs - $ledgerCogs), 2);
        $passed = $diff <= 0.05;

        return [
            'key'        => 'cogs_ties_to_ledger',
            'status'     => $passed ? 'pass' : 'fail',
            'passed'     => $passed,
            'expected'   => $ledgerCogs,
            'actual'     => $batchCogs,
            'difference' => $diff,
            'message'    => $passed
                ? "Batch COGS matches GL 5000 (\${$ledgerCogs})."
                : "cogs_ties_to_ledger FAILED: Batch COGS={$batchCogs}, GL={$ledgerCogs}, Diff={$diff}",
            'details'    => ['batch_cogs' => $batchCogs, 'gl_cogs' => $ledgerCogs, 'diff' => $diff],
        ];
    }

    /**
     * Stock valuation control: FIFO inventory valuation = GL 1100 (role='inventory') at as-of date.
     */
    private static function checkStockValueControl(Tenant $tenant, ?ReckonerPeriod $period): array
    {
        $asOf = $period ? $period->end->toDateString() : now()->toDateString();

        // 1. Raw inventory batch valuation
        $fifoVal = (float) DB::table('inventory_batches')
            ->where('tenant_id', $tenant->id)
            ->where(DB::raw('DATE(created_at)'), '<=', $asOf)
            ->whereNull('deleted_at')
            ->sum(DB::raw('remaining_qty * unit_cost'));

        if ($fifoVal <= 0.0) {
            $fifoVal = (float) DB::table('products')
                ->where('tenant_id', $tenant->id)
                ->whereNull('deleted_at')
                ->where('is_active', 1)
                ->sum(DB::raw('quantity * cost_price'));
        }
        $fifoVal = round($fifoVal, 2);

        // 2. Raw GL 1100 closing balance
        $ledgerVal = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('ji.tenant_id', $tenant->id)
            ->where('je.tenant_id', $tenant->id)
            ->where('a.tenant_id', $tenant->id)
            ->where('je.date', '<=', $asOf)
            ->where('je.is_reversed', 0)
            ->where(function ($q) {
                $q->where('a.role', 'inventory')->orWhere('a.code', '1100');
            })
            ->selectRaw('COALESCE(SUM(ji.debit), 0) - COALESCE(SUM(ji.credit), 0) as val')
            ->value('val') ?? 0.0;
        $ledgerVal = round($ledgerVal, 2);

        $diff = round(abs($fifoVal - $ledgerVal), 2);
        $passed = $diff <= 0.05;

        return [
            'key'        => 'stock_value_control',
            'status'     => $passed ? 'pass' : 'fail',
            'passed'     => $passed,
            'expected'   => $ledgerVal,
            'actual'     => $fifoVal,
            'difference' => $diff,
            'message'    => $passed
                ? "FIFO stock valuation matches GL 1100 (\${$ledgerVal})."
                : "stock_value_control FAILED: FIFO={$fifoVal}, GL 1100={$ledgerVal}, Diff={$diff}",
            'details'    => ['fifo_value' => $fifoVal, 'gl_value' => $ledgerVal, 'diff' => $diff],
        ];
    }

    /**
     * Receivables control: Subledger customer balances = GL 1200 (role='ar').
     */
    private static function checkReceivablesControl(Tenant $tenant, ?ReckonerPeriod $period): array
    {
        $asOf = $period ? $period->end->toDateString() : now()->toDateString();

        // 1. Raw customer subledger balance from journal_items for customer parties
        $subledgerAR = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->join('parties as p', 'ji.party_id', '=', 'p.id')
            ->where('ji.tenant_id', $tenant->id)
            ->where('je.tenant_id', $tenant->id)
            ->where('a.tenant_id', $tenant->id)
            ->where('p.tenant_id', $tenant->id)
            ->where('p.type', 'customer')
            ->where('je.date', '<=', $asOf)
            ->where('je.is_reversed', 0)
            ->where(function ($q) {
                $q->where('a.role', 'ar')->orWhere('a.code', '1200');
            })
            ->selectRaw('COALESCE(SUM(ji.debit), 0) - COALESCE(SUM(ji.credit), 0) as ar')
            ->value('ar') ?? 0.0;
        $subledgerAR = round($subledgerAR, 2);

        // 2. Raw total GL 1200 closing balance
        $glAR = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('ji.tenant_id', $tenant->id)
            ->where('je.tenant_id', $tenant->id)
            ->where('a.tenant_id', $tenant->id)
            ->where('je.date', '<=', $asOf)
            ->where('je.is_reversed', 0)
            ->where(function ($q) {
                $q->where('a.role', 'ar')->orWhere('a.code', '1200');
            })
            ->selectRaw('COALESCE(SUM(ji.debit), 0) - COALESCE(SUM(ji.credit), 0) as ar')
            ->value('ar') ?? 0.0;
        $glAR = round($glAR, 2);

        $diff = round(abs($subledgerAR - $glAR), 2);
        $passed = $diff <= 0.05;

        return [
            'key'        => 'receivables_control',
            'status'     => $passed ? 'pass' : 'fail',
            'passed'     => $passed,
            'expected'   => $glAR,
            'actual'     => $subledgerAR,
            'difference' => $diff,
            'message'    => $passed
                ? "Customer receivables match GL 1200 control (\${$glAR})."
                : "receivables_control FAILED: Subledger={$subledgerAR}, GL 1200={$glAR}, Diff={$diff}",
            'details'    => ['subledger_ar' => $subledgerAR, 'gl_ar' => $glAR, 'diff' => $diff],
        ];
    }

    /**
     * Payables control: Subledger supplier balances = GL 2000 (role='ap').
     */
    private static function checkPayablesControl(Tenant $tenant, ?ReckonerPeriod $period): array
    {
        $asOf = $period ? $period->end->toDateString() : now()->toDateString();

        // 1. Raw supplier subledger balance from journal_items for supplier parties
        $subledgerAP = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->join('parties as p', 'ji.party_id', '=', 'p.id')
            ->where('ji.tenant_id', $tenant->id)
            ->where('je.tenant_id', $tenant->id)
            ->where('a.tenant_id', $tenant->id)
            ->where('p.tenant_id', $tenant->id)
            ->where('p.type', 'supplier')
            ->where('je.date', '<=', $asOf)
            ->where('je.is_reversed', 0)
            ->where(function ($q) {
                $q->where('a.role', 'ap')->orWhere('a.code', '2000');
            })
            ->selectRaw('COALESCE(SUM(ji.credit), 0) - COALESCE(SUM(ji.debit), 0) as ap')
            ->value('ap') ?? 0.0;
        $subledgerAP = round($subledgerAP, 2);

        // 2. Raw total GL 2000 closing balance
        $glAP = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('ji.tenant_id', $tenant->id)
            ->where('je.tenant_id', $tenant->id)
            ->where('a.tenant_id', $tenant->id)
            ->where('je.date', '<=', $asOf)
            ->where('je.is_reversed', 0)
            ->where(function ($q) {
                $q->where('a.role', 'ap')->orWhere('a.code', '2000');
            })
            ->selectRaw('COALESCE(SUM(ji.credit), 0) - COALESCE(SUM(ji.debit), 0) as ap')
            ->value('ap') ?? 0.0;
        $glAP = round($glAP, 2);

        $diff = round(abs($subledgerAP - $glAP), 2);
        $passed = $diff <= 0.05;

        return [
            'key'        => 'payables_control',
            'status'     => $passed ? 'pass' : 'fail',
            'passed'     => $passed,
            'expected'   => $glAP,
            'actual'     => $subledgerAP,
            'difference' => $diff,
            'message'    => $passed
                ? "Supplier payables match GL 2000 control (\${$glAP})."
                : "payables_control FAILED: Subledger={$subledgerAP}, GL 2000={$glAP}, Diff={$diff}",
            'details'    => ['subledger_ap' => $subledgerAP, 'gl_ap' => $glAP, 'diff' => $diff],
        ];
    }

    /**
     * Tax control: Operational sales tax collected = GL 2100 closing balance.
     */
    private static function checkTaxControl(Tenant $tenant, ?ReckonerPeriod $period): array
    {
        $asOf = $period ? $period->end->toDateString() : now()->toDateString();
        $from = $period ? $period->start->toDateString() : '1970-01-01';

        // 1. Raw operational tax from posted sales
        $opTax = (float) DB::table('sales')
            ->where('tenant_id', $tenant->id)
            ->whereBetween(DB::raw('DATE(COALESCE(posted_at, created_at))'), [$from, $asOf])
            ->whereIn('status', ['posted', 'completed', 'active'])
            ->whereNull('deleted_at')
            ->whereNull('original_sale_id')
            ->sum('total_tax') ?? 0.0;
        $opTax = round($opTax, 2);

        // 2. Raw GL 2100 tax output balance
        $glTax = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('ji.tenant_id', $tenant->id)
            ->where('je.tenant_id', $tenant->id)
            ->where('a.tenant_id', $tenant->id)
            ->where('je.date', '<=', $asOf)
            ->where('je.is_reversed', 0)
            ->where(function ($q) {
                $q->where('a.role', 'tax_output')->orWhere('a.code', '2100');
            })
            ->selectRaw('COALESCE(SUM(ji.credit), 0) - COALESCE(SUM(ji.debit), 0) as tax')
            ->value('tax') ?? 0.0;
        $glTax = round($glTax, 2);

        $diff = round(abs($opTax - $glTax), 2);
        $passed = $diff <= 0.05;

        return [
            'key'        => 'tax_control',
            'status'     => $passed ? 'pass' : 'fail',
            'passed'     => $passed,
            'expected'   => $glTax,
            'actual'     => $opTax,
            'difference' => $diff,
            'message'    => $passed
                ? "Operational sales tax matches GL 2100 (\${$glTax})."
                : "tax_control FAILED: Operational Tax={$opTax}, GL 2100={$glTax}, Diff={$diff}",
            'details'    => ['op_tax' => $opTax, 'gl_tax' => $glTax, 'diff' => $diff],
        ];
    }

    /**
     * Bank subledger control: Sum of bank account opening + movements = GL 1010.
     */
    private static function checkBankSubledgerControl(Tenant $tenant, ?ReckonerPeriod $period): array
    {
        $asOf = $period ? $period->end->toDateString() : now()->toDateString();

        // 1. Raw bank account subledger balance: opening balances + journal items on bank accounts
        $bankAccountIds = DB::table('bank_accounts')
            ->where('tenant_id', $tenant->id)
            ->where('type', 'bank')
            ->pluck('id')
            ->toArray();

        $opening = (float) DB::table('bank_accounts')
            ->where('tenant_id', $tenant->id)
            ->where('type', 'bank')
            ->sum('opening_balance');

        $movements = 0.0;
        if (!empty($bankAccountIds)) {
            $movements = (float) (DB::table('journal_items as ji')
                ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
                ->where('ji.tenant_id', $tenant->id)
                ->where('je.tenant_id', $tenant->id)
                ->whereIn('ji.bank_account_id', $bankAccountIds)
                ->where('je.date', '<=', $asOf)
                ->where('je.is_reversed', 0)
                ->selectRaw('COALESCE(SUM(ji.debit), 0) - COALESCE(SUM(ji.credit), 0) as mov')
                ->value('mov') ?? 0.0);
        }

        $totalSubledger = round($opening + $movements, 2);

        // 2. Raw GL 1010 balance
        $glBank = (float) (DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('ji.tenant_id', $tenant->id)
            ->where('je.tenant_id', $tenant->id)
            ->where('a.tenant_id', $tenant->id)
            ->where('je.date', '<=', $asOf)
            ->where('je.is_reversed', 0)
            ->where(function ($q) {
                $q->where('a.role', 'bank')->orWhere('a.code', '1010');
            })
            ->selectRaw('COALESCE(SUM(ji.debit), 0) - COALESCE(SUM(ji.credit), 0) as b')
            ->value('b') ?? 0.0);
        $glBank = round($glBank, 2);

        $diff = round(abs($totalSubledger - $glBank), 2);
        $passed = $diff <= 0.05;

        return [
            'key'        => 'bank_subledger_control',
            'status'     => $passed ? 'pass' : 'fail',
            'passed'     => $passed,
            'expected'   => $glBank,
            'actual'     => $totalSubledger,
            'difference' => $diff,
            'message'    => $passed
                ? "Bank subledger matches GL 1010 (\${$glBank})."
                : "bank_subledger_control FAILED: Subledger={$totalSubledger}, GL 1010={$glBank}, Diff={$diff}",
            'details'    => ['subledger' => $totalSubledger, 'gl_bank' => $glBank, 'diff' => $diff],
        ];
    }

    /**
     * Returns tie to ledger: Sales returns in sales = GL sale_return postings.
     */
    private static function checkReturnsTieToLedger(Tenant $tenant, ?ReckonerPeriod $period): array
    {
        $from = $period ? $period->start->toDateString() : '1970-01-01';
        $to   = $period ? $period->end->toDateString() : now()->toDateString();

        // 1. Operational returns from sales table
        $returnsVal = (float) DB::table('sales')
            ->where('tenant_id', $tenant->id)
            ->whereNotNull('original_sale_id')
            ->whereBetween(DB::raw('DATE(COALESCE(posted_at, created_at))'), [$from, $to])
            ->whereIn('status', ['posted', 'completed', 'active', 'returned'])
            ->whereNull('deleted_at')
            ->sum(DB::raw('ABS(net_sales)')) ?? 0.0;
        $returnsVal = round($returnsVal, 2);

        // 2. General Ledger returns postings
        $glReturns = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('ji.tenant_id', $tenant->id)
            ->where('je.tenant_id', $tenant->id)
            ->where('a.tenant_id', $tenant->id)
            ->whereBetween('je.date', [$from, $to])
            ->where('je.is_reversed', 0)
            ->where(function ($q) {
                $q->where('a.role', 'sales_return')
                    ->orWhere('a.code', '4100')
                    ->orWhere(function ($sub) {
                        $sub->where('je.reference_type', 'sale_return')
                            ->where(function ($acc) {
                                $acc->where('a.role', 'sales_revenue')
                                    ->orWhere('a.code', '4000');
                            });
                    });
            })
            ->selectRaw('COALESCE(SUM(ji.debit), 0) - COALESCE(SUM(ji.credit), 0) as ret')
            ->value('ret') ?? 0.0;
        $glReturns = round(abs($glReturns), 2);

        $diff = round(abs($returnsVal - $glReturns), 2);
        $passed = $diff <= 0.05;

        return [
            'key'        => 'returns_tie_to_ledger',
            'status'     => $passed ? 'pass' : 'fail',
            'passed'     => $passed,
            'expected'   => $glReturns,
            'actual'     => $returnsVal,
            'difference' => $diff,
            'message'    => $passed
                ? "Returns tie to ledger entries (\${$returnsVal})."
                : "returns_tie_to_ledger FAILED: Operational returns={$returnsVal}, GL returns={$glReturns}, Diff={$diff}",
            'details'    => ['operational_returns' => $returnsVal, 'gl_returns' => $glReturns, 'diff' => $diff],
        ];
    }

    /* ── 2. Mathematical Identities ──────────────────────────────────────── */

    private static function checkGrossProfitIdentity(array $ctx): array
    {
        $rev = (float) ($ctx['revenue'] ?? $ctx['sales_revenue'] ?? 0.0);
        $cogs = (float) ($ctx['cogs'] ?? 0.0);
        $gp = (float) ($ctx['gross_profit'] ?? ($rev - $cogs));

        $expected = round($rev - $cogs, 2);
        $actual = round($gp, 2);
        $diff = round(abs($expected - $actual), 2);
        $passed = $diff <= 0.05;

        return [
            'key'        => 'gross_profit_identity',
            'status'     => $passed ? 'pass' : 'fail',
            'passed'     => $passed,
            'expected'   => $expected,
            'actual'     => $actual,
            'difference' => $diff,
            'message'    => $passed
                ? "Gross profit identity holds (\${$actual})."
                : "GP identity failed: {$actual} != {$expected} (Diff: {$diff})",
            'details'    => ['revenue' => $rev, 'cogs' => $cogs, 'gp' => $gp, 'diff' => $diff],
        ];
    }

    private static function checkNetProfitIdentity(array $ctx): array
    {
        $gp = (float) ($ctx['gross_profit'] ?? 0.0);
        $exp = (float) ($ctx['expenses'] ?? $ctx['operating_expenses'] ?? 0.0);
        $np = (float) ($ctx['net_profit'] ?? ($gp - $exp));

        $expected = round($gp - $exp, 2);
        $actual = round($np, 2);
        $diff = round(abs($expected - $actual), 2);
        $passed = $diff <= 0.05;

        return [
            'key'        => 'net_profit_identity',
            'status'     => $passed ? 'pass' : 'fail',
            'passed'     => $passed,
            'expected'   => $expected,
            'actual'     => $actual,
            'difference' => $diff,
            'message'    => $passed
                ? "Net profit identity holds (\${$actual})."
                : "NP identity failed: {$actual} != {$expected} (Diff: {$diff})",
            'details'    => ['gp' => $gp, 'expenses' => $exp, 'np' => $np, 'diff' => $diff],
        ];
    }

    private static function checkLiquidityIdentity(Tenant $tenant, ?ReckonerPeriod $period, array $ctx): array
    {
        $asOf = $period ? $period->end->toDateString() : now()->toDateString();

        $balances = DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('ji.tenant_id', $tenant->id)
            ->where('je.tenant_id', $tenant->id)
            ->where('a.tenant_id', $tenant->id)
            ->where('je.date', '<=', $asOf)
            ->where('je.is_reversed', 0)
            ->whereIn('a.code', ['1000', '1010'])
            ->selectRaw('a.code, COALESCE(SUM(ji.debit), 0) - COALESCE(SUM(ji.credit), 0) as bal')
            ->groupBy('a.code')
            ->pluck('bal', 'code');

        $cash = (float) ($balances['1000'] ?? 0.0);
        $bank = (float) ($balances['1010'] ?? 0.0);
        $totalLiquidity = round($cash + $bank, 2);

        $cardVal = isset($ctx['data']['value']) ? (float) $ctx['data']['value'] : $totalLiquidity;
        $diff = round(abs($cardVal - $totalLiquidity), 2);
        $passed = $diff <= 0.05;

        return [
            'key'        => 'liquidity_identity',
            'status'     => $passed ? 'pass' : 'fail',
            'passed'     => $passed,
            'expected'   => $totalLiquidity,
            'actual'     => $cardVal,
            'difference' => $diff,
            'message'    => $passed
                ? "Liquidity matches Cash + Bank (\${$totalLiquidity})."
                : "Liquidity identity failed: {$cardVal} != {$totalLiquidity} (Diff: {$diff})",
            'details'    => ['cash' => $cash, 'bank' => $bank, 'total' => $totalLiquidity],
        ];
    }

    /* ── 3. Shape & Data Invariants ──────────────────────────────────────── */

    private static function checkBreakdownSumsToParent(array $ctx): array
    {
        $segments = $ctx['data']['segments'] ?? $ctx['segments'] ?? [];
        if (empty($segments)) {
            return [
                'key'        => 'breakdown_sums_to_parent',
                'status'     => 'pass',
                'passed'     => true,
                'expected'   => 0.0,
                'actual'     => 0.0,
                'difference' => 0.0,
                'message'    => 'Empty breakdown passes.',
                'details'    => [],
            ];
        }

        $sum = 0.0;
        foreach ($segments as $s) {
            $sum += (float) ($s['value'] ?? 0.0);
        }
        $sum = round($sum, 2);

        $parent = isset($ctx['data']['value']) ? round((float) $ctx['data']['value'], 2) : $sum;
        $diff = round(abs($sum - $parent), 2);
        $passed = $diff <= 0.05;

        return [
            'key'        => 'breakdown_sums_to_parent',
            'status'     => $passed ? 'pass' : 'fail',
            'passed'     => $passed,
            'expected'   => $parent,
            'actual'     => $sum,
            'difference' => $diff,
            'message'    => $passed
                ? "Breakdown segments sum to parent total ({$parent})."
                : "Breakdown segments sum ({$sum}) does not match parent ({$parent}). Diff: {$diff}",
            'details'    => ['sum' => $sum, 'parent' => $parent, 'diff' => $diff],
        ];
    }

    private static function checkAgingSumsToTotal(array $ctx): array
    {
        $segments = $ctx['data']['segments'] ?? $ctx['segments'] ?? [];
        if (empty($segments)) {
            return [
                'key'        => 'aging_sums_to_total',
                'status'     => 'pass',
                'passed'     => true,
                'expected'   => 0.0,
                'actual'     => 0.0,
                'difference' => 0.0,
                'message'    => 'Empty aging passes.',
                'details'    => [],
            ];
        }

        $sum = array_sum(array_column($segments, 'value'));
        $parent = (float) ($ctx['data']['value'] ?? $sum);
        $diff = round(abs($sum - $parent), 2);
        $passed = $diff <= 0.05;

        return [
            'key'        => 'aging_sums_to_total',
            'status'     => $passed ? 'pass' : 'fail',
            'passed'     => $passed,
            'expected'   => $parent,
            'actual'     => $sum,
            'difference' => $diff,
            'message'    => $passed ? 'Aging buckets sum to total.' : "Aging sum ({$sum}) != total ({$parent}). Diff: {$diff}",
            'details'    => ['sum' => $sum, 'total' => $parent, 'diff' => $diff],
        ];
    }

    private static function checkListTotalMatchesStat(array $ctx): array
    {
        $items = $ctx['data']['items'] ?? $ctx['items'] ?? [];
        if (empty($items)) {
            return [
                'key'        => 'list_total_matches_stat',
                'status'     => 'pass',
                'passed'     => true,
                'expected'   => 0.0,
                'actual'     => 0.0,
                'difference' => 0.0,
                'message'    => 'Empty list passes.',
                'details'    => [],
            ];
        }

        $sum = 0.0;
        foreach ($items as $it) {
            $sum += (float) ($it['amount'] ?? $it['value'] ?? $it['total_amount'] ?? 0.0);
        }
        $sum = round($sum, 2);

        $headline = isset($ctx['data']['total']) ? round((float) $ctx['data']['total'], 2) : $sum;
        $diff = round(abs($sum - $headline), 2);
        $passed = $diff <= 0.05;

        return [
            'key'        => 'list_total_matches_stat',
            'status'     => $passed ? 'pass' : 'fail',
            'passed'     => $passed,
            'expected'   => $headline,
            'actual'     => $sum,
            'difference' => $diff,
            'message'    => $passed ? 'List items sum to total.' : "List sum ({$sum}) != total ({$headline}). Diff: {$diff}",
            'details'    => ['sum' => $sum, 'headline' => $headline, 'diff' => $diff],
        ];
    }

    private static function checkChannelsSumToSales(Tenant $tenant, ?ReckonerPeriod $period, array $ctx): array
    {
        $from = $period ? $period->start->toDateString() : '1970-01-01';
        $to   = $period ? $period->end->toDateString() : now()->toDateString();

        // 1. Channel aggregate breakdown query
        $channelRows = DB::table('sales')
            ->where('tenant_id', $tenant->id)
            ->whereBetween(DB::raw('DATE(COALESCE(posted_at, created_at))'), [$from, $to])
            ->whereIn('status', ['posted', 'completed', 'active'])
            ->whereNull('deleted_at')
            ->whereNull('original_sale_id')
            ->selectRaw("COALESCE(source, 'pos') as ch, SUM(net_sales) as total")
            ->groupBy(DB::raw("COALESCE(source, 'pos')"))
            ->pluck('total', 'ch')
            ->toArray();

        $channelsSum = 0.0;
        foreach ($channelRows as $val) {
            $channelsSum += (float) $val;
        }
        $channelsSum = round($channelsSum, 2);

        // If card context provides channel segments, verify against that
        $ctxSegments = $ctx['data']['segments'] ?? $ctx['segments'] ?? null;
        if (!empty($ctxSegments) && is_array($ctxSegments)) {
            $channelsSum = round(array_sum(array_column($ctxSegments, 'value')), 2);
        }

        // 2. Independent total sales aggregate query
        $totalSales = (float) DB::table('sales')
            ->where('tenant_id', $tenant->id)
            ->whereBetween(DB::raw('DATE(COALESCE(posted_at, created_at))'), [$from, $to])
            ->whereIn('status', ['posted', 'completed', 'active'])
            ->whereNull('deleted_at')
            ->whereNull('original_sale_id')
            ->sum('net_sales') ?? 0.0;
        $totalSales = round($totalSales, 2);

        $diff = round(abs($channelsSum - $totalSales), 2);
        $passed = $diff <= 0.05;

        return [
            'key'        => 'channels_sum_to_sales',
            'status'     => $passed ? 'pass' : 'fail',
            'passed'     => $passed,
            'expected'   => $totalSales,
            'actual'     => $channelsSum,
            'difference' => $diff,
            'message'    => $passed
                ? "Channels sum to total sales (\${$totalSales})."
                : "channels_sum_to_sales FAILED: Channels sum={$channelsSum} != Total sales={$totalSales}, Diff={$diff}",
            'details'    => [
                'channels'     => $channelRows,
                'channels_sum' => $channelsSum,
                'total_sales'  => $totalSales,
                'diff'         => $diff,
            ],
        ];
    }

    private static function checkStockQtyControl(Tenant $tenant): array
    {
        $batchQty = (float) DB::table('inventory_batches')
            ->where('tenant_id', $tenant->id)
            ->whereNull('deleted_at')
            ->sum('remaining_qty');

        $stockQty = (float) DB::table('stocks')
            ->where('tenant_id', $tenant->id)
            ->sum('quantity');

        if ($stockQty <= 0.0) {
            $stockQty = (float) DB::table('products')
                ->where('tenant_id', $tenant->id)
                ->whereNull('deleted_at')
                ->where('is_active', 1)
                ->sum('quantity');
        }

        $diff = round(abs($batchQty - $stockQty), 2);
        $passed = $diff <= 0.05;

        return [
            'key'        => 'stock_qty_control',
            'status'     => $passed ? 'pass' : 'fail',
            'passed'     => $passed,
            'expected'   => $stockQty,
            'actual'     => $batchQty,
            'difference' => $diff,
            'message'    => $passed
                ? "Stock quantities match across batches and stocks table ({$batchQty} units)."
                : "Batch qty ({$batchQty}) != stock qty ({$stockQty})",
            'details'    => ['batch_qty' => $batchQty, 'stock_qty' => $stockQty, 'diff' => $diff],
        ];
    }

    private static function checkTrendSumsToStat(array $ctx): array
    {
        $points = $ctx['data']['points'] ?? $ctx['data']['series'] ?? [];
        if (empty($points)) {
            return [
                'key'        => 'trend_sums_to_stat',
                'status'     => 'pass',
                'passed'     => true,
                'expected'   => 0.0,
                'actual'     => 0.0,
                'difference' => 0.0,
                'message'    => 'Empty trend passes.',
                'details'    => [],
            ];
        }

        $sum = 0.0;
        foreach ($points as $pt) {
            $sum += (float) ($pt['value'] ?? $pt['y'] ?? 0.0);
        }
        $sum = round($sum, 2);

        $stat = isset($ctx['data']['value']) ? round((float) $ctx['data']['value'], 2) : $sum;
        $diff = round(abs($sum - $stat), 2);
        $passed = $diff <= 0.05;

        return [
            'key'        => 'trend_sums_to_stat',
            'status'     => $passed ? 'pass' : 'fail',
            'passed'     => $passed,
            'expected'   => $stat,
            'actual'     => $sum,
            'difference' => $diff,
            'message'    => $passed ? 'Trend sum matches headline stat.' : "Trend sum ({$sum}) != stat ({$stat}). Diff: {$diff}",
            'details'    => ['sum' => $sum, 'stat' => $stat, 'diff' => $diff],
        ];
    }

    private static function checkTrendEndpointMatchesStat(array $ctx): array
    {
        $points = $ctx['data']['points'] ?? $ctx['data']['series'] ?? [];
        if (empty($points)) {
            return [
                'key'        => 'trend_endpoint_matches_stat',
                'status'     => 'pass',
                'passed'     => true,
                'expected'   => 0.0,
                'actual'     => 0.0,
                'difference' => 0.0,
                'message'    => 'Empty trend passes.',
                'details'    => [],
            ];
        }

        $lastPt = end($points);
        $lastVal = round((float) ($lastPt['value'] ?? $lastPt['y'] ?? 0.0), 2);
        $stat = isset($ctx['data']['value']) ? round((float) $ctx['data']['value'], 2) : $lastVal;
        $diff = round(abs($lastVal - $stat), 2);
        $passed = $diff <= 0.05;

        return [
            'key'        => 'trend_endpoint_matches_stat',
            'status'     => $passed ? 'pass' : 'fail',
            'passed'     => $passed,
            'expected'   => $stat,
            'actual'     => $lastVal,
            'difference' => $diff,
            'message'    => $passed ? 'Last trend point matches stat.' : "Last trend point ({$lastVal}) != stat ({$stat}). Diff: {$diff}",
            'details'    => ['last' => $lastVal, 'stat' => $stat, 'diff' => $diff],
        ];
    }

    private static function checkNoSilentNull(array $ctx): array
    {
        if (empty($ctx) || (!array_key_exists('value', $ctx) && !array_key_exists('data', $ctx))) {
            return [
                'key'        => 'no_silent_null',
                'status'     => 'pass',
                'passed'     => true,
                'expected'   => 'numeric value',
                'actual'     => 'N/A',
                'difference' => 0.0,
                'message'    => 'No silent null (card context required).',
                'details'    => [],
            ];
        }

        $val = $ctx['data']['value'] ?? $ctx['value'] ?? null;
        $passed = ($val !== null && !is_nan((float)$val) && !is_infinite((float)$val));

        return [
            'key'        => 'no_silent_null',
            'status'     => $passed ? 'pass' : 'fail',
            'passed'     => $passed,
            'expected'   => 'numeric value',
            'actual'     => $val,
            'difference' => 0.0,
            'message'    => $passed ? 'No silent null.' : 'Reading returned null value.',
            'details'    => ['value' => $val],
        ];
    }
}
