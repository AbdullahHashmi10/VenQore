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
use App\Support\SaleStatus;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
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

        // Module gating: Qore cards (module === null) are universal; module cards require enabled module.
        if ($card['module'] !== null && !ModuleService::enabled($tenant, $card['module'])) {
            return ReckonerResult::failure(
                $compositeId,
                $key,
                'module_locked',
                "Needs the " . ($card['module']) . " module."
            );
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
        $tenantId = $ctx->tenant->id;
        $key = static::key();

        // 1. Core financial cards delegation
        if (str_starts_with($key, 'core.')) {
            return $this->resolveCoreMetric($key, $ctx, $period, $card, $id, $shape);
        }

        // 2. Query table based on streams and module with strict tenant isolation
        $table = $this->determinePrimaryTable($card);

        if (!$table || !Schema::hasTable($table)) {
            return ReckonerResult::empty($id, $key, $shape, $card, $period);
        }

        $query = DB::table($table)->where('tenant_id', $tenantId);

        if (!$query->exists()) {
            return ReckonerResult::empty($id, $key, $shape, $card, $period);
        }

        $dateCol = $this->determineDateColumn($table);
        if ($card['period_aware'] && $dateCol && Schema::hasColumn($table, $dateCol)) {
            $query->whereBetween($dateCol, [
                $period->start->toDateString() . ' 00:00:00',
                $period->end->toDateString() . ' 23:59:59',
            ]);
        }

        return $this->formatResultByShape($query, $shape, $card, $period, $id, $dateCol, $table);
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
                    'core.gross_margin_pct' => (float) ($pl['gross_profit'] ?? 0.0) / $rev * 100,
                    'core.net_margin_pct' => (float) ($pl['net_profit'] ?? 0.0) / $rev * 100,
                    'core.expense_ratio' => (float) ($pl['operating_expenses'] ?? 0.0) / $rev * 100,
                    default => 0.0,
                };
                return ReckonerResult::success($id, $key, $shape, $card, $period, [
                    'value' => round($ratio, $card['precision'] ?? 2),
                    'previous' => null,
                    'change_pct' => null,
                ]);

            case 'core.receivables':
            case 'core.payables':
                if (!$reporting) {
                    return ReckonerResult::empty($id, $key, $shape, $card, $period);
                }
                $bs = $reporting->getBalanceSheet($endDate, $tenantId);
                $val = $key === 'core.receivables'
                    ? (float) ($bs['assets']['accounts_receivable'] ?? 0.0)
                    : (float) ($bs['liabilities']['accounts_payable'] ?? 0.0);
                return ReckonerResult::success($id, $key, $shape, $card, $period, [
                    'value' => $val,
                    'previous' => null,
                    'change_pct' => null,
                ]);

            case 'core.total_liquidity':
            case 'core.net_cash_position':
            case 'core.working_capital':
                if (!$reporting) {
                    return ReckonerResult::empty($id, $key, $shape, $card, $period);
                }
                $bs = $reporting->getBalanceSheet($endDate, $tenantId);
                $cash = (float) ($bs['assets']['cash_and_bank'] ?? 0.0);
                return ReckonerResult::success($id, $key, $shape, $card, $period, [
                    'value' => $cash,
                    'previous' => null,
                    'change_pct' => null,
                ]);

            case 'core.transaction_count':
                $count = DB::table('sales')->where('tenant_id', $tenantId)
                    ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                    ->count();
                return ReckonerResult::success($id, $key, $shape, $card, $period, [
                    'value' => (int) $count,
                    'previous' => null,
                    'change_pct' => null,
                ]);

            case 'core.revenue_trend':
            case 'core.profit_trend':
            case 'core.cash_flow_trend':
            case 'core.liquidity_trend':
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
                $hasSales = DB::table('sales')->where('tenant_id', $tenantId)->exists();
                if (!$hasSales) {
                    return ReckonerResult::empty($id, $key, $shape, $card, $period);
                }
                return ReckonerResult::success($id, $key, $shape, $card, $period, [
                    'value' => 0.0,
                    'previous' => null,
                    'change_pct' => null,
                ]);
        }
    }

    protected function formatResultByShape(
        \Illuminate\Database\Query\Builder $query,
        ReckonerShape $shape,
        array $card,
        ReckonerPeriod $period,
        string $id,
        ?string $dateCol,
        string $table = ''
    ): ReckonerResult {
        $key = static::key();
        $valCol = $this->determineValueColumn($table ?: $this->determinePrimaryTable($card) ?: '');

        switch ($shape) {
            case ReckonerShape::SERIES:
                if (!$dateCol) {
                    return ReckonerResult::empty($id, $key, $shape, $card, $period);
                }
                $rows = (clone $query)->selectRaw("DATE({$dateCol}) as d, COUNT(*) as c, COALESCE(SUM({$valCol}), 0) as s")
                    ->groupBy('d')
                    ->orderBy('d')
                    ->get();
                if ($rows->isEmpty()) {
                    return ReckonerResult::empty($id, $key, $shape, $card, $period);
                }
                $series = $rows->map(fn ($r) => ['x' => $r->d, 'y' => (float) ($card['unit'] === 'currency' ? $r->s : $r->c)])->values()->all();
                $val = !empty($series) ? end($series)['y'] : 0.0;
                return ReckonerResult::success($id, $key, $shape, $card, $period, [
                    'value' => $val,
                    'series' => $series,
                ]);

            case ReckonerShape::BREAKDOWN:
                return ReckonerResult::success($id, $key, $shape, $card, $period, [
                    'value' => 0.0,
                    'slices' => [],
                    'segments' => [],
                ]);

            case ReckonerShape::RANKING:
            case ReckonerShape::TABLE:
                return ReckonerResult::success($id, $key, $shape, $card, $period, [
                    'value' => 0.0,
                    'rows' => [],
                    'truncated' => false,
                ]);

            case ReckonerShape::GAUGE:
                return ReckonerResult::success($id, $key, $shape, $card, $period, [
                    'value' => 0.0,
                ]);

            case ReckonerShape::STATUS:
                return ReckonerResult::success($id, $key, $shape, $card, $period, [
                    'value' => 1.0,
                ]);

            case ReckonerShape::SCALAR:
            default:
                $count = (int) (clone $query)->count();
                if ($count === 0) {
                    return ReckonerResult::empty($id, $key, $shape, $card, $period);
                }
                $series = [];
                if ($dateCol) {
                    try {
                        $dailyRows = (clone $query)->selectRaw("DATE({$dateCol}) as d, COUNT(*) as c, COALESCE(SUM({$valCol}), 0) as s")
                            ->groupBy('d')
                            ->orderBy('d')
                            ->get();
                        foreach ($dailyRows as $dr) {
                            $series[] = [
                                'x' => (string) $dr->d,
                                'y' => (float) (($card['unit'] ?? '') === 'currency' ? $dr->s : $dr->c)
                            ];
                        }
                    } catch (\Throwable) {}
                }
                return ReckonerResult::success($id, $key, $shape, $card, $period, [
                    'value' => (float) $count,
                    'previous' => null,
                    'change_pct' => null,
                    'series' => $series,
                ]);
        }
    }

    protected function determinePrimaryTable(array $card): ?string
    {
        $module = $card['module'] ?? '';
        $key = $card['key'] ?? '';

        if ($key === 'inventory.stock_value_trend' || $key === 'inventory.stock_value') return 'inventory_batches';
        if (str_starts_with($key, 'products.')) return 'products';
        if (str_starts_with($key, 'customers.')) return 'parties';
        if (str_starts_with($key, 'suppliers.')) return 'parties';
        if (str_starts_with($key, 'pos.')) return 'sales';
        if (str_starts_with($key, 'invoicing.')) return 'sales';
        if (str_starts_with($key, 'quotations.')) return 'quotations';
        if (str_starts_with($key, 'sales_orders.')) return 'sales_orders';
        if (str_starts_with($key, 'purchases.')) return 'purchases';
        if (str_starts_with($key, 'purchase_orders.')) return 'purchase_orders';
        if (str_starts_with($key, 'expenses.')) return 'expenses';
        if (str_starts_with($key, 'payments.')) return 'payments';
        if (str_starts_with($key, 'inventory.')) return 'products';
        if (str_starts_with($key, 'batches_expiry.')) return 'batches';
        if (str_starts_with($key, 'stock_transfers.')) return 'stock_transfers';
        if (str_starts_with($key, 'stock_takes.')) return 'stock_takes';
        if (str_starts_with($key, 'production_runs.')) return 'production_runs';
        if (str_starts_with($key, 'staff_attendance.')) return 'tenant_users';
        if (str_starts_with($key, 'bank_accounts.')) return 'bank_accounts';

        return match ($module) {
            'products' => 'products',
            'customers', 'suppliers' => 'parties',
            'pos', 'invoicing' => 'sales',
            'purchases' => 'purchases',
            'expenses' => 'expenses',
            'payments' => 'payments',
            'inventory' => 'products',
            'batches_expiry' => 'batches',
            'staff_attendance' => 'tenant_users',
            default => null,
        };
    }

    protected function determineDateColumn(string $table): ?string
    {
        return match ($table) {
            'sales' => 'posted_at',
            'purchases' => 'purchase_date',
            'expenses' => 'date',
            'payments' => 'date',
            default => 'created_at',
        };
    }

    protected function determineValueColumn(string $table): string
    {
        if ($table === 'inventory_batches') {
            return 'remaining_qty * unit_cost';
        }
        if (Schema::hasColumn($table, 'total')) return 'total';
        if (Schema::hasColumn($table, 'amount')) return 'amount';
        if (Schema::hasColumn($table, 'net_sales')) return 'net_sales';
        if (Schema::hasColumn($table, 'current_balance')) return 'current_balance';
        if (Schema::hasColumn($table, 'price')) return 'price';
        if (Schema::hasColumn($table, 'cost_price')) return 'cost_price';
        return '1';
    }
}
