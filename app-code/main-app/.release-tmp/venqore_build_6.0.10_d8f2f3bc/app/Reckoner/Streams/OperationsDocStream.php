<?php

namespace App\Reckoner\Streams;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * OperationsDocStream: Pure tenant-explicit reader for quotations, sales_orders, service_jobs, proposals, recurring_invoices.
 */
class OperationsDocStream
{
    /**
     * Quotations metrics.
     */
    public function quotationsSummary(string $from, string $to, int|string $tenantId): array
    {
        $base = DB::table('quotations')
            ->where('tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(quotation_date, created_at))'), [$from, $to]);

        $count = (int) $base->count();
        $pipelineVal = (float) ((clone $base)->whereIn('status', ['sent', 'draft', 'pending'])->sum('total_amount') ?? 0.0);
        $totalVal = (float) ((clone $base)->sum('total_amount') ?? 0.0);
        $avgVal = $count > 0 ? round($totalVal / $count, 2) : 0.0;

        $accepted = (int) ((clone $base)->where('status', 'accepted')->count());
        $decided = (int) ((clone $base)->whereIn('status', ['accepted', 'rejected', 'expired'])->count());

        $expired = (int) ((clone $base)->where('status', 'expired')->orWhere(function ($q) use ($to) {
            $q->whereIn('status', ['sent', 'draft'])->whereNotNull('valid_until')->where('valid_until', '<', $to);
        })->count());

        $openList = DB::table('quotations as q')
            ->leftJoin('parties as p', 'q.party_id', '=', 'p.id')
            ->where('q.tenant_id', $tenantId)
            ->whereIn('q.status', ['sent', 'draft', 'pending'])
            ->select('q.id', 'q.quotation_number', 'p.name as customer_name', 'q.total_amount', 'q.valid_until')
            ->orderByDesc('q.total_amount')
            ->limit(10)
            ->get();

        $openItems = [];
        foreach ($openList as $item) {
            $openItems[] = [
                'id'        => $item->id,
                'reference' => $item->quotation_number,
                'customer'  => $item->customer_name ?: 'Customer #' . $item->party_id,
                'amount'    => (float) $item->total_amount,
                'value'     => (float) $item->total_amount,
            ];
        }

        $winRate = $decided > 0 ? round($accepted / $decided * 100, 2) : 0.0;

        // Expiring soon (within 7 days)
        $expiringCount = (int) DB::table('quotations')
            ->where('tenant_id', $tenantId)
            ->whereIn('status', ['sent', 'draft', 'pending'])
            ->whereNotNull('valid_until')
            ->whereBetween('valid_until', [now()->toDateString(), now()->addDays(7)->toDateString()])
            ->count();

        return [
            'count'           => (float) $count,
            'pipeline_value'  => $pipelineVal,
            'avg_value'       => $avgVal,
            'win_rate'        => $winRate,
            'accepted_count'  => $accepted,
            'decided_count'   => $decided,
            'expired_count'   => (float) $expired,
            'expiring_count'  => (float) $expiringCount,
            'open_items'      => $openItems,
        ];
    }

    /**
     * Win rate trend by day/week.
     */
    public function quotationsWinRateTrend(string $from, string $to, int|string $tenantId): array
    {
        $rows = DB::table('quotations')
            ->where('tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(quotation_date, created_at))'), [$from, $to])
            ->whereIn('status', ['accepted', 'rejected', 'expired'])
            ->selectRaw('DATE(COALESCE(quotation_date, created_at)) as day, SUM(CASE WHEN status = \'accepted\' THEN 1 ELSE 0 END) as won, COUNT(*) as decided')
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->map(fn($r) => [
                'date'  => $r->day,
                'value' => $r->decided > 0 ? round($r->won / $r->decided * 100, 2) : 0.0,
            ])
            ->toArray();
        return $rows;
    }

    /**
     * Sales Orders metrics.
     */
    public function salesOrdersSummary(string $from, string $to, int|string $tenantId): array
    {
        $base = DB::table('sales_orders')
            ->where('tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(order_date, created_at))'), [$from, $to])
            ->whereNull('deleted_at');

        $count = (int) $base->count();
        $totalVal = (float) ((clone $base)->sum('total_amount') ?? 0.0);
        $pending = (int) ((clone $base)->whereIn('status', ['pending', 'processing', 'confirmed', 'open'])->count());

        $overdue = DB::table('sales_orders as so')
            ->leftJoin('parties as p', 'so.party_id', '=', 'p.id')
            ->where('so.tenant_id', $tenantId)
            ->whereNull('so.deleted_at')
            ->whereIn('so.status', ['pending', 'processing', 'open'])
            ->whereNotNull('so.delivery_date')
            ->where('so.delivery_date', '<', $to)
            ->select('so.id', 'so.order_number', 'p.name as customer_name', 'so.total_amount', 'so.delivery_date')
            ->get();

        $overdueItems = [];
        $overdueTotal = 0.0;
        foreach ($overdue as $o) {
            $amt = (float) $o->total_amount;
            $overdueTotal += $amt;
            $overdueItems[] = [
                'id'        => $o->id,
                'reference' => $o->order_number,
                'customer'  => $o->customer_name ?: 'Party #' . $o->party_id,
                'due_date'  => $o->delivery_date,
                'amount'    => $amt,
                'value'     => $amt,
            ];
        }

        $byCustomer = DB::table('sales_orders as so')
            ->leftJoin('parties as p', 'so.party_id', '=', 'p.id')
            ->where('so.tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(so.order_date, so.created_at))'), [$from, $to])
            ->whereNull('so.deleted_at')
            ->select(DB::raw('COALESCE(p.name, "Walk-in") as cust_name'), DB::raw('SUM(so.total_amount) as total'))
            ->groupBy('cust_name')
            ->get();

        $custBreakdown = [];
        foreach ($byCustomer as $bc) {
            $custBreakdown[$bc->cust_name] = round((float) $bc->total, 2);
        }

        $openValue = (float) ((clone $base)->whereIn('status', ['pending', 'processing', 'confirmed', 'open'])->sum('total_amount') ?? 0.0);
        $fulfilRate = $count > 0 ? round(($count - $pending) / $count * 100, 2) : 0.0;

        return [
            'count'         => (float) $count,
            'total_value'   => $totalVal,
            'pending_count' => (float) $pending,
            'open_count'    => (float) $pending,
            'open_value'    => $openValue,
            'overdue_count' => (float) count($overdueItems),
            'overdue_items' => $overdueItems,
            'overdue_total' => round($overdueTotal, 2),
            'fulfil_rate'   => $fulfilRate,
            'by_customer'   => $custBreakdown,
        ];
    }

    /**
     * Daily trend of sales orders value.
     */
    public function salesOrdersDailyTrend(string $from, string $to, int|string $tenantId): array
    {
        $rows = DB::table('sales_orders')
            ->where('tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(order_date, created_at))'), [$from, $to])
            ->whereNull('deleted_at')
            ->selectRaw('DATE(COALESCE(order_date, created_at)) as o_date, SUM(total_amount) as val')
            ->groupBy('o_date')
            ->get();

        $map = [];
        foreach ($rows as $r) {
            $map[$r->o_date] = round((float) $r->val, 2);
        }

        $cur = Carbon::parse($from);
        $end = Carbon::parse($to);
        $series = [];

        while ($cur->lte($end)) {
            $d = $cur->toDateString();
            $series[] = [
                'date'  => $d,
                'value' => $map[$d] ?? 0.0,
            ];
            $cur->addDay();
        }

        return $series;
    }

    /**
     * Service jobs summary.
     */
    public function serviceJobsSummary(string $from, string $to, int|string $tenantId): array
    {
        $base = DB::table('service_jobs')
            ->where('tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(scheduled_for, created_at))'), [$from, $to]);

        $count = (int) $base->count();
        $completed = (int) ((clone $base)->where('status', 'completed')->count());
        $inProgress = (int) ((clone $base)->whereIn('status', ['in_progress', 'started', 'pending'])->count());
        $revenue = (float) ((clone $base)->where('status', 'completed')->sum(DB::raw('COALESCE(actual_total, estimated_total)')) ?? 0.0);
        $avgVal = $completed > 0 ? round($revenue / $completed, 2) : 0.0;

        $overdue = (int) DB::table('service_jobs')
            ->where('tenant_id', $tenantId)
            ->whereIn('status', ['pending', 'in_progress'])
            ->whereNotNull('scheduled_for')
            ->where('scheduled_for', '<', $to)
            ->count();

        return [
            'count'          => (float) $count,
            'completed'      => (float) $completed,
            'in_progress'    => (float) $inProgress,
            'revenue'        => $revenue,
            'avg_val'        => $avgVal,
            'overdue_count'  => (float) $overdue,
        ];
    }

    /**
     * Proposals summary.
     */
    public function proposalsSummary(string $from, string $to, int|string $tenantId): array
    {
        $base = DB::table('proposals')
            ->where('tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(date, created_at))'), [$from, $to])
            ->whereNull('deleted_at');

        $count = (int) $base->count();
        $pipelineVal = (float) ((clone $base)->whereIn('status', ['sent', 'draft', 'pending'])->sum('total_amount') ?? 0.0);
        $totalVal = (float) ((clone $base)->sum('total_amount') ?? 0.0);
        $avgVal = $count > 0 ? round($totalVal / $count, 2) : 0.0;

        $accepted = (int) ((clone $base)->where('status', 'accepted')->count());
        $decided = (int) ((clone $base)->whereIn('status', ['accepted', 'rejected', 'expired'])->count());

        $stale = DB::table('proposals')
            ->where('tenant_id', $tenantId)
            ->whereIn('status', ['sent', 'draft', 'pending'])
            ->whereNull('deleted_at')
            ->where('updated_at', '<', Carbon::parse($to)->subDays(14))
            ->select('id', 'reference_number', 'customer_name', 'total_amount', 'updated_at')
            ->get();

        $staleItems = [];
        foreach ($stale as $s) {
            $staleItems[] = [
                'id'        => $s->id,
                'reference' => $s->reference_number,
                'customer'  => $s->customer_name ?: 'Customer',
                'amount'    => (float) $s->total_amount,
                'value'     => (float) $s->total_amount,
            ];
        }

        $winRate = $decided > 0 ? round($accepted / $decided * 100, 2) : 0.0;

        return [
            'count'          => (float) $count,
            'pipeline_value' => $pipelineVal,
            'avg_value'      => $avgVal,
            'accepted_count' => $accepted,
            'decided_count'  => $decided,
            'win_rate'       => $winRate,
            'stale_count'    => (float) count($staleItems),
            'stale_items'    => $staleItems,
            'avg_cycle_days' => 0.0,
        ];
    }

    /**
     * Recurring invoices metrics.
     */
    public function recurringInvoicesSummary(string $from, string $to, int|string $tenantId): array
    {
        $activeRows = DB::table('recurring_invoices')
            ->where('tenant_id', $tenantId)
            ->where('status', 'active')
            ->whereNull('deleted_at')
            ->get();

        $activeCount = count($activeRows);
        $monthlyValue = 0.0;

        foreach ($activeRows as $r) {
            $tot = (float) ($r->total_amount ?? 0.0);
            $freq = strtolower(trim((string) $r->frequency));
            $factor = match ($freq) {
                'weekly'    => 4.345,
                'biweekly'  => 2.17,
                'monthly'   => 1.0,
                'quarterly' => 1 / 3,
                'yearly'    => 1 / 12,
                default     => 1.0,
            };
            $monthlyValue += ($tot * $factor);
        }

        $now = now();
        $in7Days = (clone $now)->addDays(7);

        $dueSoon = DB::table('recurring_invoices as ri')
            ->leftJoin('parties as p', 'ri.customer_id', '=', 'p.id')
            ->where('ri.tenant_id', $tenantId)
            ->where('ri.status', 'active')
            ->whereNull('ri.deleted_at')
            ->whereBetween('ri.next_run_date', [$now->toDateString(), $in7Days->toDateString()])
            ->select('ri.id', 'ri.name', 'p.name as customer_name', 'ri.total_amount', 'ri.next_run_date')
            ->get();

        $dueItems = [];
        foreach ($dueSoon as $d) {
            $dueItems[] = [
                'id'        => $d->id,
                'name'      => $d->name ?: 'Recurring Invoice #' . $d->id,
                'customer'  => $d->customer_name ?: 'Customer',
                'amount'    => (float) $d->total_amount,
                'date'      => $d->next_run_date,
            ];
        }

        $dueNext7 = count($dueItems);

        // Churned: paused or cancelled in period
        $churnedCount = (int) DB::table('recurring_invoices')
            ->where('tenant_id', $tenantId)
            ->whereIn('status', ['paused', 'cancelled', 'expired'])
            ->whereNull('deleted_at')
            ->whereBetween(DB::raw('DATE(updated_at)'), [$from, $to])
            ->count();

        // Share of revenue: monthly_value / total sales in period * 100
        try {
            $periodRevenue = (float) (DB::table('sales')
                ->where('tenant_id', $tenantId)
                ->whereBetween(DB::raw('DATE(COALESCE(posted_at, created_at))'), [$from, $to])
                ->whereIn('status', ['posted', 'completed'])
                ->whereNull('deleted_at')
                ->sum('net_sales') ?? 0.0);
            $shareOfRevenue = $periodRevenue > 0 ? round($monthlyValue / $periodRevenue * 100, 2) : 0.0;
        } catch (\Exception $e) {
            $shareOfRevenue = 0.0;
        }

        return [
            'active_count'    => (float) $activeCount,
            'monthly_value'   => round($monthlyValue, 2),
            'due_items'       => $dueItems,
            'due_next_7'      => (float) $dueNext7,
            'churned_count'   => (float) $churnedCount,
            'share_of_revenue'=> $shareOfRevenue,
            'trend_pct'       => 0.0, // Requires historical comparison - placeholder
        ];
    }
}

