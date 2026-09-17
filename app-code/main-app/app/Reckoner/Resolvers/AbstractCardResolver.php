<?php

namespace App\Reckoner\Resolvers;

use App\Models\Tenant;
use App\Reckoner\CardRegistry;
use App\Reckoner\ReckonerContext;
use App\Reckoner\ReckonerPeriod;
use App\Reckoner\ReckonerResult;
use App\Reckoner\ReckonerShape;
use App\Services\FinancialReportingService;
use App\Services\ModuleService;
use Illuminate\Support\Facades\DB;
use Throwable;

abstract class AbstractCardResolver implements CardResolverInterface
{
    public function resolve(ReckonerContext $ctx, ReckonerPeriod $period, array $args = []): ReckonerResult
    {
        $key = static::key();
        $card = CardRegistry::find($key);

        if (!$card) {
            return ReckonerResult::failure($key, $key, 'not_found', "Card definition not found for '{$key}'.");
        }

        $tenant = $ctx->tenant;
        if (!$tenant) {
            return ReckonerResult::failure($key, $key, 'forbidden', 'No tenant context.');
        }

        $compositeId = "{$key}|{$period->key}|{$period->start->toDateString()}|{$period->end->toDateString()}";

        // Module gating
        if ($card['module'] !== null && !ModuleService::enabled($tenant, $card['module'])) {
            return ReckonerResult::failure(
                $compositeId,
                $key,
                'module_locked',
                "Needs the " . ($card['module']) . " module."
            );
        }

        // Contract state check: refuse unimplemented before query
        $contractState = $card['contract_state'] ?? 'unimplemented';
        if ($contractState === 'unimplemented') {
            $matrixStatus = $card['matrix_status'] ?? 'READY';
            $code = match ($matrixStatus) {
                'FEATURE', 'COLUMN' => 'data_not_captured',
                default => 'not_built',
            };
            $reason = ($card['status_reason'] ?? null)
                ?: ($matrixStatus === 'FEATURE'
                    ? 'Not available yet — feature data is not captured in this version'
                    : ($matrixStatus === 'COLUMN'
                        ? 'Not available yet — required tracking column/event is pending migration'
                        : "Reading '{$key}' is not built yet."));

            return ReckonerResult::unavailable($compositeId, $key, $code, $reason, $card, $period);
        }

        $shape = ReckonerShape::fromCardShape($card['shape'] ?? 'stat');

        try {
            return $this->compute($ctx, $period, $card, $args, $compositeId, $shape);
        } catch (Throwable $e) {
            report($e);
            return ReckonerResult::failure(
                $compositeId,
                $key,
                'resolver_failed',
                'This reading could not be computed: ' . $e->getMessage()
            );
        }
    }

    protected function compute(
        ReckonerContext $ctx,
        ReckonerPeriod $period,
        array $card,
        array $args,
        string $id,
        ReckonerShape $shape
    ): ReckonerResult {
        $key = static::key();

        // 1. Core financial cards delegation
        if (str_starts_with($key, 'core.')) {
            return $this->resolveCoreMetric($key, $ctx, $period, $card, $id, $shape);
        }

        // Generic fallbacks have been deleted per Phase 1 §7.
        // Any non-core card reaching here without its own verified compute() override is unavailable.
        return ReckonerResult::unavailable(
            $id,
            $key,
            'not_built',
            "Card '{$key}' calculation engine is in progress.",
            $card,
            $period
        );
    }

    protected function resolveCoreMetric(
        string $key,
        ReckonerContext $ctx,
        ReckonerPeriod $period,
        array $card,
        string $id,
        ReckonerShape $shape
    ): ReckonerResult {
        $tenantId = $ctx->tenant->id;
        $startDate = $period->start->toDateString();
        $endDate = $period->end->toDateString();

        try {
            $reporting = app(FinancialReportingService::class);
        } catch (Throwable) {
            $reporting = null;
        }

        switch ($key) {
            case 'core.revenue':
            case 'core.cogs':
            case 'core.gross_profit':
            case 'core.net_profit':
            case 'core.expenses_total':
                if (!$reporting) {
                    return ReckonerResult::empty($id, $key, $shape, $card, $period);
                }
                $pl = $reporting->getProfitAndLoss($startDate, $endDate, $tenantId);
                $metricMap = [
                    'core.revenue' => 'revenue',
                    'core.cogs' => 'cogs',
                    'core.gross_profit' => 'gross_profit',
                    'core.net_profit' => 'net_profit',
                    'core.expenses_total' => 'operating_expenses',
                ];
                $val = (float) ($pl[$metricMap[$key]] ?? 0.0);

                $prevVal = null;
                $changePct = null;
                if ($period->compareStart !== null && $period->compareEnd !== null) {
                    try {
                        $prevPl = $reporting->getProfitAndLoss(
                            $period->compareStart->toDateString(),
                            $period->compareEnd->toDateString(),
                            $tenantId
                        );
                        $prevVal = (float) ($prevPl[$metricMap[$key]] ?? 0.0);
                        if ($prevVal != 0) {
                            $changePct = round((($val - $prevVal) / abs($prevVal)) * 100, 1);
                        }
                    } catch (\Throwable) {}
                }

                $series = [];
                try {
                    $byPeriod = $reporting->getProfitByPeriod($startDate, $endDate, 'daily', $tenantId);
                    $seriesField = match ($key) {
                        'core.revenue' => 'revenue',
                        'core.cogs' => 'cogs',
                        'core.gross_profit', 'core.net_profit' => 'profit',
                        default => 'profit',
                    };
                    foreach ($byPeriod as $d => $m) {
                        $series[] = ['x' => (string) $d, 'y' => (float) ($m[$seriesField] ?? 0.0)];
                    }
                } catch (\Throwable) {}

                return ReckonerResult::success($id, $key, $shape, $card, $period, [
                    'value' => $val,
                    'previous' => $prevVal,
                    'change_pct' => $changePct,
                    'series' => $series,
                ]);

            case 'core.gross_margin_pct':
            case 'core.net_margin_pct':
            case 'core.expense_ratio':
                if (!$reporting) {
                    return ReckonerResult::empty($id, $key, $shape, $card, $period);
                }
                $pl = $reporting->getProfitAndLoss($startDate, $endDate, $tenantId);
                $rev = (float) ($pl['revenue'] ?? 0.0);
                if ($rev <= 0.0) {
                    return ReckonerResult::empty($id, $key, $shape, $card, $period);
                }
                $ratio = match ($key) {
                    'core.gross_margin_pct' => ((float) ($pl['gross_profit'] ?? 0.0) / $rev) * 100,
                    'core.net_margin_pct' => ((float) ($pl['net_profit'] ?? 0.0) / $rev) * 100,
                    'core.expense_ratio' => ((float) ($pl['operating_expenses'] ?? 0.0) / $rev) * 100,
                    default => 0.0,
                };
                return ReckonerResult::success($id, $key, $shape, $card, $period, [
                    'value' => round($ratio, $card['precision'] ?? 2),
                    'previous' => null,
                    'change_pct' => null,
                ]);

            case 'core.receivables':
            case 'core.payables':
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

                $val = $key === 'core.receivables'
                    ? $net('1200', 'COALESCE(SUM(journal_items.debit),0) - COALESCE(SUM(journal_items.credit),0)')
                    : $net('2000', 'COALESCE(SUM(journal_items.credit),0) - COALESCE(SUM(journal_items.debit),0)');

                return ReckonerResult::success($id, $key, $shape, $card, $period, [
                    'value' => $val,
                    'previous' => null,
                    'change_pct' => null,
                ]);

            case 'core.total_liquidity':
            case 'core.net_cash_position':
            case 'core.working_capital':
                $cashAccounts = DB::table('accounts')
                    ->where('tenant_id', $tenantId)
                    ->where('type', 'asset')
                    ->whereBetween('code', ['1000', '1099'])
                    ->pluck('id')
                    ->toArray();

                $val = 0.0;
                if (!empty($cashAccounts)) {
                    $totals = DB::table('journal_items as ji')
                        ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
                        ->where('ji.tenant_id', $tenantId)
                        ->whereIn('ji.account_id', $cashAccounts)
                        ->where('je.tenant_id', $tenantId)
                        ->where('je.date', '<=', $endDate)
                        ->where('je.is_reversed', 0)
                        ->selectRaw('SUM(ji.debit) as total_debit, SUM(ji.credit) as total_credit')
                        ->first();

                    $debit = (float) ($totals->total_debit ?? 0.0);
                    $credit = (float) ($totals->total_credit ?? 0.0);
                    $val = $debit - $credit;
                }

                return ReckonerResult::success($id, $key, $shape, $card, $period, [
                    'value' => $val,
                    'previous' => null,
                    'change_pct' => null,
                ]);

            case 'core.balance_sheet_ok':
                $diff = (float) DB::table('journal_items')
                    ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                    ->where('journal_items.tenant_id', $tenantId)
                    ->where('journal_entries.tenant_id', $tenantId)
                    ->where('journal_entries.is_reversed', 0)
                    ->selectRaw('COALESCE(SUM(journal_items.debit),0) - COALESCE(SUM(journal_items.credit),0) as diff')
                    ->value('diff');

                $balanced = abs($diff) < 0.01;

                return ReckonerResult::success($id, $key, $shape, $card, $period, [
                    'value' => $balanced ? 1 : 0,
                    'state' => $balanced ? 'balanced' : 'out_of_balance',
                    'label' => $balanced ? 'Balanced' : 'Out of Balance',
                    'severity' => $balanced ? 'ok' : 'critical',
                ]);

            case 'core.receivables_aging':
            case 'core.payables_aging':
                $reportResult = $reporting ? ($key === 'core.receivables_aging' ? $reporting->getAgedReceivables() : $reporting->getAgedPayables()) : [];
                $summary = $reportResult['summary'] ?? [];
                $total = (float) array_sum($summary);
                $slices = [];
                foreach ($summary as $name => $val) {
                    $slices[] = [
                        'name' => $name === '90+' ? "Over 90 days" : ($name === '0-30' ? "0-30 Days" : ($name === '31-60' ? "31-60 Days" : "61-90 Days")),
                        'value' => (float) $val,
                        'pct' => $total > 0 ? round(($val / $total) * 100, 1) : 0.0,
                    ];
                }

                return ReckonerResult::success($id, $key, $shape, $card, $period, [
                    'value' => $total,
                    'slices' => $slices,
                    'segments' => $slices,
                    'total' => $total,
                ]);

            case 'core.transaction_count':
                $count = (int) DB::table('sales')->where('tenant_id', $tenantId)
                    ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                    ->count();

                return ReckonerResult::success($id, $key, $shape, $card, $period, [
                    'value' => $count,
                    'previous' => null,
                    'change_pct' => null,
                ]);

            case 'core.revenue_trend':
            case 'core.profit_trend':
                if (!$reporting) {
                    return ReckonerResult::empty($id, $key, $shape, $card, $period);
                }
                $byPeriod = $reporting->getProfitByPeriod($startDate, $endDate, 'daily', $tenantId);
                $series = [];
                $metricField = $key === 'core.revenue_trend' ? 'revenue' : 'profit';
                foreach ($byPeriod as $d => $m) {
                    $series[] = ['x' => (string) $d, 'y' => (float) ($m[$metricField] ?? 0.0)];
                }

                return ReckonerResult::success($id, $key, $shape, $card, $period, [
                    'value' => !empty($series) ? end($series)['y'] : 0.0,
                    'series' => $series,
                ]);

            default:
                if (($card['contract_state'] ?? '') !== 'unimplemented') {
                    $engine = app(\App\Reckoner\Engine\MeasureEngine::class);
                    $req = new \App\Reckoner\ReckonerRequest($key, $period->key);
                    $res = $engine->resolve([$req], $ctx);
                    $comp = $req->getCompositeId();
                    if (isset($res[$comp])) {
                        return $res[$comp];
                    }
                }

                return ReckonerResult::unavailable(
                    $id,
                    $key,
                    'not_built',
                    "Core card '{$key}' calculation is not built yet.",
                    $card,
                    $period
                );
        }
    }
}
