<?php

namespace App\Reckoner\Streams;

use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * OperationsSpecialtyStream: Pure tenant-explicit stream reader for Phase 4 Slice 4d.
 *
 * Covers:
 * - Park & Recall: occupancies (source_type = 'parked_sale')
 * - Table Service: occupancies, positions, work_orders
 * - Reports: P&L shortcut, Sales shortcut, Stock shortcut
 * - AI Insights: ai_recommendations, daily statistical anomalies, forecasts, reorder alerts
 * - Fixed Assets & Loans: Interim general ledger role balances (1500, 2200)
 */
class OperationsSpecialtyStream
{
    public function __construct(
        protected LedgerStream $ledgerStream,
        protected SalesHeadersStream $salesHeadersStream,
        protected StockPositionsStream $stockPositionsStream
    ) {}

    /**
     * Parked sales summary.
     */
    public function parkSummary(string $from, string $to, int|string $tenantId): array
    {
        $openRows = DB::table('occupancies')
            ->where('tenant_id', $tenantId)
            ->where('source_type', 'parked_sale')
            ->whereNull('closed_at')
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->get(['session_data', 'opened_at']);

        $openCount = $openRows->count();
        $openValue = 0.0;
        $oldestOpenedAt = null;

        foreach ($openRows as $row) {
            if ($row->opened_at && (!$oldestOpenedAt || $row->opened_at < $oldestOpenedAt)) {
                $oldestOpenedAt = $row->opened_at;
            }

            if (!empty($row->session_data)) {
                $data = json_decode($row->session_data, true);
                if (is_array($data)) {
                    $openValue += (float) ($data['cart_total'] ?? $data['total'] ?? $data['grand_total'] ?? 0.0);
                }
            }
        }

        $oldestDays = $oldestOpenedAt
            ? round(Carbon::parse($oldestOpenedAt)->diffInSeconds(now()) / 86400, 1)
            : 0.0;

        return [
            'open_count' => (float) $openCount,
            'open_value' => round($openValue, 2),
            'oldest'     => $oldestDays,
        ];
    }

    /**
     * Restaurant table service metrics.
     */
    public function tablesSummary(string $from, string $to, int|string $tenantId): array
    {
        // 1. Occupied tables count (currently open table occupancies, excluding parked sales)
        $occupiedCount = (int) DB::table('occupancies')
            ->where('tenant_id', $tenantId)
            ->whereNull('closed_at')
            ->where(function ($q) {
                $q->whereNull('source_type')->orWhere('source_type', '!=', 'parked_sale');
            })
            ->count();

        // 2. Kitchen pending work orders
        $kitchenPending = (int) DB::table('work_orders')
            ->where('tenant_id', $tenantId)
            ->where('kind', 'kitchen')
            ->whereNull('bumped_at')
            ->count();

        // 3. Average turn minutes for occupancies closed in window
        $closedDurations = DB::table('occupancies')
            ->where('tenant_id', $tenantId)
            ->whereNotNull('closed_at')
            ->whereBetween(DB::raw('DATE(closed_at)'), [$from, $to])
            ->where(function ($q) {
                $q->whereNull('source_type')->orWhere('source_type', '!=', 'parked_sale');
            })
            ->selectRaw('TIMESTAMPDIFF(MINUTE, opened_at, closed_at) as duration')
            ->pluck('duration');

        $avgTurnMinutes = $closedDurations->count() > 0 ? round($closedDurations->avg(), 1) : 0.0;

        // 4. Occupancy rate: occupied minutes ÷ (table count × trading minutes)
        $totalTables = DB::table('positions')->where('tenant_id', $tenantId)->count();
        if ($totalTables === 0) {
            $totalTables = DB::table('occupancies')
                ->where('tenant_id', $tenantId)
                ->whereNotNull('position_id')
                ->distinct()
                ->count('position_id');
        }

        $daysInPeriod = max(1, Carbon::parse($from)->diffInDays(Carbon::parse($to)) + 1);
        $tradingMinutes = $daysInPeriod * 12 * 60; // 12-hour trading day

        $occupiedMinutes = (float) (DB::table('occupancies')
            ->where('tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(opened_at)'), [$from, $to])
            ->where(function ($q) {
                $q->whereNull('source_type')->orWhere('source_type', '!=', 'parked_sale');
            })
            ->selectRaw('SUM(TIMESTAMPDIFF(MINUTE, opened_at, COALESCE(closed_at, NOW()))) as total_mins')
            ->value('total_mins') ?? 0.0);

        $occupancyRateData = [
            'numerator'   => $occupiedMinutes,
            'denominator' => (float) ($totalTables * $tradingMinutes),
        ];

        // 5. Revenue per table breakdown
        $revenueRows = DB::table('occupancies as o')
            ->leftJoin('positions as p', 'o.position_id', '=', 'p.id')
            ->where('o.tenant_id', $tenantId)
            ->where('o.source_type', 'restaurant_table')
            ->whereBetween(DB::raw('DATE(o.opened_at)'), [$from, $to])
            ->select('o.session_data', DB::raw('COALESCE(p.label, o.label, "Unknown Table") as table_label'))
            ->get();

        $revByTable = [];
        foreach ($revenueRows as $row) {
            $label = $row->table_label;
            $amt = 0.0;
            if (!empty($row->session_data)) {
                $data = json_decode($row->session_data, true);
                if (is_array($data)) {
                    $amt = (float) ($data['settled_total'] ?? $data['cart_total'] ?? $data['total'] ?? 0.0);
                }
            }
            $revByTable[$label] = ($revByTable[$label] ?? 0.0) + $amt;
        }

        // 6. Peak occupancy heatmap: weekday (0=Sun..6=Sat) x hour (0..23)
        $heatmapRows = DB::table('occupancies')
            ->where('tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(opened_at)'), [$from, $to])
            ->where(function ($q) {
                $q->whereNull('source_type')->orWhere('source_type', '!=', 'parked_sale');
            })
            ->selectRaw('DAYOFWEEK(opened_at) - 1 as weekday, HOUR(opened_at) as hr, COUNT(*) as cnt')
            ->groupBy('weekday', 'hr')
            ->get();

        $matrix = [];
        for ($w = 0; $w < 7; $w++) {
            $matrix[$w] = array_fill(0, 24, 0);
        }
        foreach ($heatmapRows as $hr) {
            $w = (int) $hr->weekday;
            $h = (int) $hr->hr;
            if (isset($matrix[$w][$h])) {
                $matrix[$w][$h] = (int) $hr->cnt;
            }
        }

        return [
            'occupied'          => (float) $occupiedCount,
            'kitchen_pending'   => (float) $kitchenPending,
            'avg_turn_minutes'  => $avgTurnMinutes,
            'occupancy_rate'    => $occupancyRateData,
            'revenue_per_table' => $revByTable,
            'peak_occupancy'    => $matrix,
        ];
    }

    /**
     * Reports shortcut metrics.
     */
    public function reportsSummary(string $from, string $to, int|string $tenantId): array
    {
        // 1. PnL Shortcut: Revenue, COGS, Gross Profit, Operating Expenses, Net Profit (same as accounting.pnl_summary)
        $flows = $this->ledgerStream->flows(['gl.sales_revenue', 'gl.cogs', 'gl.opex'], ['w' => ['from' => $from, 'to' => $to]], [], $tenantId)['w'];
        $rev = (float) ($flows['gl.sales_revenue'] ?? 0.0);
        $cogs = (float) ($flows['gl.cogs'] ?? 0.0);
        $gp = $rev - $cogs;
        $opex = (float) ($flows['gl.opex'] ?? 0.0);
        $np = $gp - $opex;

        $pnlSegments = [
            'Revenue'      => $rev,
            'COGS'         => $cogs,
            'Gross Profit' => $gp,
            'OPEX'         => $opex,
            'Net Profit'   => $np,
        ];

        // 2. Sales Shortcut: Gross Sales, Discounts, Returns, Net Sales, Tax
        $base = DB::table('sales')
            ->where('tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(posted_at, created_at))'), [$from, $to])
            ->whereIn('status', ['posted', 'completed', 'active'])
            ->whereNull('deleted_at');

        $grossSales = (float) ((clone $base)->whereNull('original_sale_id')->sum(DB::raw('net_sales + discount')) ?? 0.0);
        $discount   = (float) ((clone $base)->whereNull('original_sale_id')->sum('discount') ?? 0.0);
        $returns    = (float) ((clone $base)->whereNotNull('original_sale_id')->sum('net_sales') ?? 0.0);
        $netSales   = (float) ((clone $base)->whereNull('original_sale_id')->sum('net_sales') ?? 0.0) - $returns;
        $tax        = (float) ((clone $base)->whereNull('original_sale_id')->sum('total_tax') ?? 0.0);

        $salesSegments = [
            'Gross Sales' => $grossSales,
            'Discounts'   => -$discount,
            'Returns'     => -$returns,
            'Net Sales'   => $netSales,
            'Tax'         => $tax,
        ];

        // 3. Stock Shortcut: stock value by category
        $asOf = $to;
        $stockByCategory = $this->stockPositionsStream->valueByCategory($asOf, $tenantId);

        return [
            'pnl_shortcut'   => $pnlSegments,
            'sales_shortcut' => $salesSegments,
            'stock_shortcut' => $stockByCategory,
        ];
    }

    /**
     * AI insights metrics.
     */
    public function aiSummary(string $from, string $to, int|string $tenantId): array
    {
        $today = Carbon::parse($to)->toDateString();

        // 1. Top recommendation & open alerts
        $alertsQuery = DB::table('ai_recommendations')
            ->where('tenant_id', $tenantId)
            ->where('is_dismissed', 0)
            ->where(function ($q) use ($today) {
                $q->whereNull('valid_until')->orWhere('valid_until', '>=', $today);
            });

        $openCount = (int) $alertsQuery->count();

        $topRec = (clone $alertsQuery)
            ->orderByRaw("FIELD(priority, 'critical', 'high', 'medium', 'low'), impact_score DESC")
            ->first();

        $topInsight = [
            'passed'     => $topRec !== null,
            'message'    => $topRec ? "{$topRec->title}: {$topRec->message}" : 'No active recommendations',
            'difference' => 0.0,
        ];

        // 2. Anomalies: days outside ±3σ of trailing weekday baseline
        $dailySales = DB::table('sales')
            ->where('tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(posted_at, created_at))'), [
                Carbon::parse($from)->subDays(60)->toDateString(),
                $to
            ])
            ->whereIn('status', ['posted', 'completed', 'active'])
            ->whereNull('deleted_at')
            ->selectRaw('DATE(COALESCE(posted_at, created_at)) as day, DAYOFWEEK(COALESCE(posted_at, created_at)) as dow, SUM(net_sales) as revenue')
            ->groupBy('day', 'dow')
            ->get();

        $byDow = [];
        $revByDay = [];
        foreach ($dailySales as $row) {
            $byDow[$row->dow][] = (float) $row->revenue;
            $revByDay[$row->day] = (float) $row->revenue;
        }

        $anomalies = [];
        $pPeriod = CarbonPeriod::create($from, $to);
        foreach ($pPeriod as $dt) {
            $dStr = $dt->toDateString();
            $dow = $dt->dayOfWeekIso + 1; // 1=Sun in mysql
            $vals = $byDow[$dow] ?? [];
            if (count($vals) >= 4) {
                $mean = array_sum($vals) / count($vals);
                $variance = 0.0;
                foreach ($vals as $v) {
                    $variance += pow($v - $mean, 2);
                }
                $std = sqrt($variance / count($vals));
                $dayRev = $revByDay[$dStr] ?? 0.0;
                if ($std > 0 && abs($dayRev - $mean) > (3 * $std)) {
                    $anomalies[] = [
                        'date'       => $dStr,
                        'revenue'    => $dayRev,
                        'expected'   => round($mean, 2),
                        'difference' => round($dayRev - $mean, 2),
                        'sigma'      => round(abs($dayRev - $mean) / $std, 1),
                    ];
                }
            }
        }

        // 3. Forecast Revenue (next 7 days based on moving average)
        $avgDailySales = count($revByDay) > 0 ? (array_sum($revByDay) / count($revByDay)) : 0.0;
        $forecastRevenuePoints = [];
        for ($i = 1; $i <= 7; $i++) {
            $fDate = Carbon::parse($to)->addDays($i)->toDateString();
            $forecastRevenuePoints[] = [
                'date'     => $fDate,
                'value'    => round($avgDailySales, 2),
                'forecast' => true,
            ];
        }

        // 4. Forecast Cash
        $liquidity = (float) ($this->ledgerStream->closingBalances(['cash', 'bank'], [$to], [], $tenantId)[$to]['cash'] ?? 0.0)
            + (float) ($this->ledgerStream->closingBalances(['cash', 'bank'], [$to], [], $tenantId)[$to]['bank'] ?? 0.0);

        $forecastCashPoints = [];
        $runningCash = $liquidity;
        for ($i = 1; $i <= 7; $i++) {
            $fDate = Carbon::parse($to)->addDays($i)->toDateString();
            $runningCash += round($avgDailySales * 0.1, 2); // Net margin estimate
            $forecastCashPoints[] = [
                'date'     => $fDate,
                'value'    => round($runningCash, 2),
                'forecast' => true,
            ];
        }

        // 5. Reorder suggestions
        $reorderItems = DB::table('products as p')
            ->leftJoin('inventory_batches as ib', function ($j) use ($tenantId) {
                $j->on('p.id', '=', 'ib.product_id')
                    ->where('ib.tenant_id', '=', $tenantId);
            })
            ->where('p.tenant_id', $tenantId)
            ->where('p.is_active', 1)
            ->groupBy('p.id', 'p.name', 'p.min_stock_alert', 'p.cost_price')
            ->havingRaw('COALESCE(SUM(ib.remaining_qty), 0) <= COALESCE(p.min_stock_alert, 5)')
            ->selectRaw('p.id, p.name, COALESCE(p.min_stock_alert, 5) as alert_level, COALESCE(SUM(ib.remaining_qty), 0) as current_qty, p.cost_price')
            ->limit(10)
            ->get()
            ->map(fn($r) => [
                'id'          => $r->id,
                'product'     => $r->name,
                'current_qty' => (float) $r->current_qty,
                'reorder_qty' => (float) $r->alert_level,
                'cost'        => (float) $r->cost_price,
            ])
            ->toArray();

        return [
            'top_insight'         => $topInsight,
            'alerts_open'         => (float) $openCount,
            'anomalies'           => $anomalies,
            'forecast_revenue'    => $forecastRevenuePoints,
            'forecast_cash'       => $forecastCashPoints,
            'reorder_suggestions' => $reorderItems,
        ];
    }

    /**
     * Interim General Ledger balances for Fixed Assets (1500) and Loans (2200).
     */
    public function interimLedgerSummary(string $from, string $to, int|string $tenantId): array
    {
        $balances = $this->ledgerStream->closingBalances([
            'fixed_asset', 'loan'
        ], [$to], [], $tenantId);

        $grossAssets = (float) ($balances[$to]['fixed_asset'] ?? 0.0);
        $totalLoans = (float) ($balances[$to]['loan'] ?? 0.0);

        // Daily trend of loan closing balances
        $days = CarbonPeriod::create($from, $to);
        $dayStrings = [];
        foreach ($days as $d) {
            $dayStrings[] = $d->toDateString();
        }

        $dailyLoanBalances = $this->ledgerStream->closingBalances([
            'loan'
        ], $dayStrings, [], $tenantId);

        $loanTrend = [];
        foreach ($dayStrings as $d) {
            $loanTrend[] = [
                'date'  => $d,
                'value' => (float) ($dailyLoanBalances[$d]['loan'] ?? 0.0),
            ];
        }

        return [
            'assets_gross_value'     => $grossAssets,
            'loans_outstanding_total' => $totalLoans,
            'loans_outstanding_trend' => $loanTrend,
        ];
    }
}
