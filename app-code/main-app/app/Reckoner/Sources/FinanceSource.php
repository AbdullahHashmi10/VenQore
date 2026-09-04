<?php

namespace App\Reckoner\Sources;

use App\Reckoner\ReckonerContext;
use App\Reckoner\ReckonerPeriod;
use App\Services\FinancialReportingService;
use Illuminate\Support\Facades\DB;

/**
 * Everything derived from the general ledger. Wraps FinancialReportingService
 * — the existing, unchanged source of truth — and never contains a second
 * definition of any financial figure (§2, "not a replacement").
 *
 * `revenue`, `cogs`, `gross_profit`, `net_profit`, `gross_margin_pct`,
 * `net_margin_pct` and `expenses_total` are answered from ONE
 * `getProfitAndLoss()` read per requested period, per §4.2 — seven metrics,
 * one query group.
 */
final class FinanceSource implements ReckonerSource
{
    public function __construct(protected FinancialReportingService $reporting)
    {
    }

    public function supports(): array
    {
        return [
            'finance.net_profit',
            'finance.expenses_total',
            'finance.gross_profit',
            'sales.gross_margin_pct',
            'finance.net_margin_pct',
            'finance.cogs',
            'finance.receivables',
            'finance.payables',
            'finance.total_liquidity',
            'inventory.stock_value',
            'finance.balance_sheet_ok',
            'finance.profit_trend',
            'finance.expenses_by_category',
            'finance.receivables_aging',
            'finance.cash_flow_trend',
        ];
    }

    public function resolveBatch(array $requests, ReckonerContext $ctx): array
    {
        $out = [];

        // Group P&L-derived keys by their resolved period window, so a single
        // getProfitAndLoss() call answers every metric sharing that window.
        $plKeys = ['finance.net_profit', 'finance.expenses_total', 'finance.gross_profit', 'sales.gross_margin_pct', 'finance.net_margin_pct', 'finance.cogs'];
        $plByWindow = [];

        foreach ($requests as $request) {
            $key = $request['key'];
            $id = $request['id'];
            /** @var ReckonerPeriod $period */
            $period = $request['period'];

            if (in_array($key, $plKeys, true)) {
                $windowKey = $period->start->toDateString().'|'.$period->end->toDateString();
                $plByWindow[$windowKey]['period'] = $period;
                $plByWindow[$windowKey]['items'][] = ['id' => $id, 'key' => $key, 'args' => $request['args'] ?? []];

                continue;
            }

            if ($key === 'inventory.stock_value') {
                $out[$id] = (float) $this->reporting->getInventoryValue();

                continue;
            }

            if ($key === 'finance.receivables' || $key === 'finance.payables') {
                $out[$id] = $this->outstanding($ctx)[$key === 'finance.receivables' ? 'receivables' : 'payables'];

                continue;
            }

            if ($key === 'finance.total_liquidity') {
                $cashAccounts = \Illuminate\Support\Facades\DB::table('accounts')
                    ->where('tenant_id', $ctx->tenant->id)
                    ->where('type', 'asset')
                    ->whereBetween('code', ['1000', '1099'])
                    ->pluck('id')
                    ->toArray();

                if (empty($cashAccounts)) {
                    $out[$id] = 0.0;
                } else {
                    $totals = \Illuminate\Support\Facades\DB::table('journal_items as ji')
                        ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
                        ->where('ji.tenant_id', $ctx->tenant->id)
                        ->whereIn('ji.account_id', $cashAccounts)
                        ->where('je.tenant_id', $ctx->tenant->id)
                        ->where('je.date', '<=', $period->end->toDateString())
                        ->where('je.is_reversed', 0)
                        ->selectRaw('SUM(ji.debit) as total_debit, SUM(ji.credit) as total_credit')
                        ->first();

                    $debit  = (float) ($totals->total_debit  ?? 0.0);
                    $credit = (float) ($totals->total_credit ?? 0.0);
                    $out[$id] = $debit - $credit;
                }

                continue;
            }

            if ($key === 'finance.balance_sheet_ok') {
                $out[$id] = $this->balanceSheetStatus($ctx);

                continue;
            }

            if ($key === 'finance.profit_trend') {
                $granularity = match($period->key) {
                    'this_year', 'last_year', 'last_12_months' => 'monthly',
                    default => 'daily',
                };
                $profitByPeriod = $this->reporting->getProfitByPeriod($period->start->toDateString(), $period->end->toDateString(), $granularity);
                $series = [];
                foreach ($profitByPeriod as $date => $metrics) {
                    $series[] = [
                        'x' => $date,
                        'y' => (float) $metrics['profit']
                    ];
                }
                usort($series, fn($a, $b) => strcmp($a['x'], $b['x']));
                $out[$id] = [
                    'series' => $series,
                    'granularity' => $granularity
                ];

                continue;
            }

            if ($key === 'finance.expenses_by_category') {
                $cogsId = DB::table('accounts')->where('tenant_id', $ctx->tenant->id)->where('code', '5000')->value('id');

                $expenseRows = DB::table('journal_items as ji')
                    ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
                    ->join('accounts as a', 'ji.account_id', '=', 'a.id')
                    ->where('ji.tenant_id', $ctx->tenant->id)
                    ->where('je.tenant_id', $ctx->tenant->id)
                    ->where('je.is_reversed', 0)
                    ->whereBetween('je.date', [$period->start->toDateString(), $period->end->toDateString()])
                    ->where('a.type', 'expense')
                    ->when($cogsId, fn($q) => $q->where('a.id', '!=', $cogsId))
                    ->select('a.id', 'a.name', DB::raw('SUM(ji.debit) - SUM(ji.credit) as val'))
                    ->groupBy('a.id', 'a.name')
                    ->get();

                $total = 0.0;
                $slices = [];
                foreach ($expenseRows as $row) {
                    $val = (float) $row->val;
                    if ($val <= 0) continue;
                    $total += $val;
                    $slices[] = [
                        'name' => $row->name,
                        'value' => $val,
                    ];
                }

                foreach ($slices as &$slice) {
                    $slice['pct'] = $total > 0 ? round(($slice['value'] / $total) * 100, 1) : 0.0;
                }
                unset($slice);

                $out[$id] = [
                    'slices' => $slices,
                    'total' => $total
                ];

                continue;
            }

            if ($key === 'finance.receivables_aging') {
                $reportResult = $this->reporting->getAgedReceivables();
                $summary = $reportResult['summary'] ?? [];
                $total = (float) array_sum($summary);
                if ($total <= 0) {
                    $out[$id] = null;
                    continue;
                }

                $slices = [];
                foreach ($summary as $name => $value) {
                    $slices[] = [
                        'name' => $name === '90+' ? "Over 90 days" : ($name === '0-30' ? "0-30 Days" : ($name === '31-60' ? "31-60 Days" : "61-90 Days")),
                        'value' => (float) $value,
                        'pct' => $total > 0 ? round(($value / $total) * 100, 1) : 0.0,
                    ];
                }
                $out[$id] = [
                    'slices' => $slices,
                    'total' => $total,
                ];

                continue;
            }

            if ($key === 'finance.cash_flow_trend') {
                $cashAccounts = DB::table('accounts')
                    ->where('tenant_id', $ctx->tenant->id)
                    ->where('type', 'asset')
                    ->whereBetween('code', ['1000', '1099'])
                    ->pluck('id')
                    ->toArray();

                if (empty($cashAccounts)) {
                    $out[$id] = [
                        'series' => [
                            ['name' => "Money In", 'points' => []],
                            ['name' => "Money Out", 'points' => []],
                        ]
                    ];
                    continue;
                }

                $granularity = match($period->key) {
                    'this_year', 'last_year', 'last_12_months' => 'monthly',
                    default => 'daily',
                };

                $periodExpr = match ($granularity) {
                    'monthly' => "DATE_FORMAT(je.date, '%Y-%m')",
                    default   => "DATE_FORMAT(je.date, '%Y-%m-%d')",
                };

                $cashFlowRows = DB::table('journal_items as ji')
                    ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
                    ->where('ji.tenant_id', $ctx->tenant->id)
                    ->where('je.tenant_id', $ctx->tenant->id)
                    ->where('je.is_reversed', 0)
                    ->whereBetween('je.date', [$period->start->toDateString(), $period->end->toDateString()])
                    ->whereIn('ji.account_id', $cashAccounts)
                    ->selectRaw(
                        "{$periodExpr} as period, "
                        . "SUM(CASE WHEN ji.debit > 0 THEN ji.debit ELSE 0 END) as money_in, "
                        . "SUM(CASE WHEN ji.credit > 0 THEN ji.credit ELSE 0 END) as money_out"
                    )
                    ->groupBy('period')
                    ->orderBy('period')
                    ->get();

                $pointsIn = [];
                $pointsOut = [];
                foreach ($cashFlowRows as $row) {
                    $pointsIn[] = ['x' => $row->period, 'y' => round((float)$row->money_in, 2)];
                    $pointsOut[] = ['x' => $row->period, 'y' => round((float)$row->money_out, 2)];
                }

                $out[$id] = [
                    'series' => [
                        [
                            'name' => "Money In",
                            'points' => $pointsIn
                        ],
                        [
                            'name' => "Money Out",
                            'points' => $pointsOut
                        ]
                    ]
                ];

                continue;
            }
        }

        foreach ($plByWindow as $window) {
            /** @var ReckonerPeriod $period */
            $period = $window['period'];
            $pl = $this->reporting->getProfitAndLoss($period->start->toDateString(), $period->end->toDateString());

            $revenue = (float) $pl['revenue'];
            $cogs = (float) $pl['cogs'];
            $grossProfit = (float) $pl['gross_profit'];
            $netProfit = (float) $pl['net_profit'];
            // §7.18: the Expenses metric is operating expenses only —
            // total_expenses includes COGS in the P&L, this does not.
            $expensesTotal = (float) $pl['total_expenses'] - $cogs;

            foreach ($window['items'] as $item) {
                $id = $item['id'];
                $key = $item['key'];
                $args = $item['args'] ?? [];
                $out[$id] = match ($key) {
                    'finance.net_profit' => $netProfit,
                    'finance.expenses_total' => (function () use ($expensesTotal, $args, $ctx, $period) {
                        $groupBy = $args['group_by'] ?? 'none';
                        if ($groupBy === 'category') {
                            $cogsId = DB::table('accounts')->where('tenant_id', $ctx->tenant->id)->where('code', '5000')->value('id');
                            $expenseRows = DB::table('journal_items as ji')
                                ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
                                ->join('accounts as a', 'ji.account_id', '=', 'a.id')
                                ->where('ji.tenant_id', $ctx->tenant->id)
                                ->where('je.tenant_id', $ctx->tenant->id)
                                ->where('je.is_reversed', 0)
                                ->whereBetween('je.date', [$period->start->toDateString(), $period->end->toDateString()])
                                ->where('a.type', 'expense')
                                ->when($cogsId, fn($q) => $q->where('a.id', '!=', $cogsId))
                                ->select('a.name as label', DB::raw('SUM(ji.debit) - SUM(ji.credit) as val'))
                                ->groupBy('a.name')
                                ->get();
                            $rows = [];
                            foreach ($expenseRows as $row) {
                                $val = (float) $row->val;
                                if ($val <= 0) continue;
                                $rows[] = ['name' => $row->label ?: 'General', 'value' => $val];
                            }
                            return [
                                'rows' => $rows,
                                'total' => (float) array_sum(array_column($rows, 'value')),
                            ];
                        }
                        return $expensesTotal;
                    })(),
                    'finance.gross_profit' => $grossProfit,
                    'sales.gross_margin_pct' => $revenue > 0 ? round(($grossProfit / $revenue) * 100, 2) : null,
                    'finance.net_margin_pct' => $revenue > 0 ? round(($netProfit / $revenue) * 100, 2) : null,
                    'finance.cogs' => $cogs,
                    default => null,
                };
            }
        }

        return $out;
    }

    /**
     * Receivables/payables: net movement on GL 1200/2000, non-reversed
     * entries only — exactly what WidgetDataService::outstanding() already
     * does. Reproduced here rather than improved on so the two surfaces
     * cannot drift (§7.4).
     */
    protected function outstanding(ReckonerContext $ctx): array
    {
        $tenantId = $ctx->tenant->id;

        $net = function (string $code, string $expression) use ($tenantId) {
            return (float) DB::table('journal_items')
                ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                ->join('accounts', 'journal_items.account_id', '=', 'accounts.id')
                ->where('accounts.tenant_id', $tenantId)
                ->where('accounts.code', $code)
                ->where('journal_entries.tenant_id', $tenantId)
                ->where('journal_entries.is_reversed', 0)
                ->selectRaw("{$expression} as net")
                ->value('net');
        };

        return [
            'receivables' => max(0, $net('1200', 'COALESCE(SUM(journal_items.debit),0) - COALESCE(SUM(journal_items.credit),0)')),
            'payables' => max(0, $net('2000', 'COALESCE(SUM(journal_items.credit),0) - COALESCE(SUM(journal_items.debit),0)')),
        ];
    }

    /**
     * §7.19 — a status, not a KPI to trend. Double-entry bookkeeping
     * guarantees SUM(debit) = SUM(credit) across every non-reversed
     * journal_items row for a tenant when every posting is balanced; this
     * is a structural invariant, not an invented business rule, so it is
     * safe to check directly rather than needing an existing method to
     * wrap. A non-zero difference means some code path posted an unbalanced
     * entry — a bug, not a fact about the business.
     */
    private function balanceSheetStatus(ReckonerContext $ctx): array
    {
        $tenantId = $ctx->tenant->id;

        $diff = (float) DB::table('journal_items')
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_items.tenant_id', $tenantId)
            ->where('journal_entries.tenant_id', $tenantId)
            ->where('journal_entries.is_reversed', 0)
            ->selectRaw('COALESCE(SUM(journal_items.debit),0) - COALESCE(SUM(journal_items.credit),0) as diff')
            ->value('diff');

        $balanced = abs($diff) < 0.01;

        return [
            'state' => $balanced ? 'balanced' : 'out_of_balance',
            'label' => $balanced ? 'Balanced' : ($diff > 0 ? 'Out of Balance (Dr)' : 'Out of Balance (Cr)'),
            'detail' => $balanced ? null : round($diff, 2),
            'severity' => $balanced ? 'ok' : 'critical',
        ];
    }
}
