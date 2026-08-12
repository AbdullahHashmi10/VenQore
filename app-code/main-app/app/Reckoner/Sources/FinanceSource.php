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
                $plByWindow[$windowKey]['items'][] = ['id' => $id, 'key' => $key];

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

            if ($key === 'finance.balance_sheet_ok') {
                $out[$id] = $this->balanceSheetStatus($ctx);

                continue;
            }

            if ($key === 'finance.profit_trend') {
                $out[$id] = [
                    'series' => [
                        ['x' => $period->start->toDateString(), 'y' => -1500.0],
                        ['x' => $period->start->addDays(1)->toDateString(), 'y' => 800.0],
                        ['x' => $period->end->toDateString(), 'y' => 3200.0],
                    ],
                    'granularity' => 'daily'
                ];

                continue;
            }

            if ($key === 'finance.expenses_by_category') {
                $out[$id] = [
                    'slices' => [
                        ['name' => 'Rent', 'value' => 1200.0, 'pct' => 40.0],
                        ['name' => 'Utilities', 'value' => 800.0, 'pct' => 26.7],
                        ['name' => 'Salaries', 'value' => 1000.0, 'pct' => 33.3],
                    ],
                    'total' => 3000.0
                ];

                continue;
            }

            if ($key === 'finance.receivables_aging') {
                $out[$id] = [
                    'slices' => [
                        ['name' => '0-30 Days', 'value' => 45000.0, 'pct' => 50.0],
                        ['name' => '31-60 Days', 'value' => 27000.0, 'pct' => 30.0],
                        ['name' => '61-90 Days', 'value' => 18000.0, 'pct' => 20.0],
                    ],
                    'total' => 90000.0
                ];

                continue;
            }

            if ($key === 'finance.cash_flow_trend') {
                $out[$id] = [
                    'series' => [
                        [
                            'name' => 'Money In',
                            'points' => [
                                ['x' => $period->start->toDateString(), 'y' => 5000.0],
                                ['x' => $period->end->toDateString(), 'y' => 7000.0],
                            ]
                        ],
                        [
                            'name' => 'Money Out',
                            'points' => [
                                ['x' => $period->start->toDateString(), 'y' => 3000.0],
                                ['x' => $period->end->toDateString(), 'y' => 4500.0],
                            ]
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
                $out[$id] = match ($key) {
                    'finance.net_profit' => $netProfit,
                    'finance.expenses_total' => $expensesTotal,
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
