<?php

namespace App\Services\Growth;

use App\Models\GrowthMetricSnapshot;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * MetricSnapshotter — writes the tenant's daily KPI row.
 *
 * Small class, large consequence. Without a stored time-series the engine can
 * only ever compare a number against a constant someone typed into the code.
 * With it, every brain can ask "is this normal FOR THIS BUSINESS?" — which is
 * the difference between an alert and an insight.
 *
 * It also powers the dashboard trend charts and gives the owner a permanent
 * record even if underlying transactions are later edited or voided.
 */
class MetricSnapshotter
{
    public function __construct(
        private readonly GrowthDataSource $data
    ) {
    }

    /**
     * Snapshot a specific day (defaults to yesterday, since today is partial).
     */
    public function snapshot(int|string $tenantId, ?Carbon $date = null): GrowthMetricSnapshot
    {
        $date  = ($date ?? now()->subDay())->startOfDay();
        $start = $date->toDateString() . ' 00:00:00';
        $end   = $date->toDateString() . ' 23:59:59';

        $sales = DB::selectOne("
            SELECT
                COUNT(DISTINCT s.id)                       AS order_count,
                COALESCE(SUM(s.invoice_total), 0)          AS revenue,
                COALESCE(AVG(s.invoice_total), 0)          AS aov,
                COALESCE(SUM(s.total_item_discounts + s.global_discount), 0) AS discount,
                COUNT(DISTINCT s.party_id)                 AS unique_customers
            FROM sales s
            WHERE s.tenant_id = ?
              AND s.deleted_at IS NULL
              AND s.status IN ('posted','partially_returned')
              AND s.posted_at BETWEEN ? AND ?
        ", [$tenantId, $start, $end]);

        $items = DB::selectOne("
            SELECT
                COALESCE(SUM(si.net_amount - COALESCE(b.cogs, si.cost_price * si.quantity)), 0) AS margin,
                COALESCE(SUM(COALESCE(b.cogs, si.cost_price * si.quantity)), 0)                 AS cogs,
                COUNT(si.id)                                                                     AS lines,
                COALESCE(SUM(si.returned_quantity * (si.net_amount / NULLIF(si.quantity,0))), 0) AS returns_value
            FROM sale_items si
            INNER JOIN sales s ON s.id = si.sale_id
                 AND s.tenant_id = ? AND s.deleted_at IS NULL
                 AND s.status IN ('posted','partially_returned')
                 AND s.posted_at BETWEEN ? AND ?
            LEFT JOIN (
                SELECT sale_item_id, SUM(total_cogs) AS cogs
                FROM sale_item_batches WHERE is_reversed = 0 GROUP BY sale_item_id
            ) b ON b.sale_item_id = si.id
            WHERE si.tenant_id = ? AND si.deleted_at IS NULL
        ", [$tenantId, $start, $end, $tenantId]);

        // New vs returning: a customer whose FIRST ever order was on this day.
        $newCustomers = (int) DB::selectOne("
            SELECT COUNT(*) AS n FROM (
                SELECT party_id, MIN(DATE(posted_at)) AS first_day
                FROM sales
                WHERE tenant_id = ? AND deleted_at IS NULL
                  AND status IN ('posted','partially_returned')
                GROUP BY party_id
            ) f WHERE f.first_day = ?
        ", [$tenantId, $date->toDateString()])->n;

        $cashCollected = (float) DB::table('allocations')
            ->where('tenant_id', $tenantId)
            ->where('status', 'active')
            ->whereBetween('created_at', [$start, $end])
            ->sum('allocated_amount');

        $receivables = array_sum($this->data->receivablesByParty($tenantId));
        $payables    = array_sum($this->data->payablesByParty($tenantId));

        $stockouts = (int) DB::selectOne("
            SELECT COUNT(*) AS n FROM products pr
            WHERE pr.tenant_id = ? AND pr.deleted_at IS NULL
              AND NOT EXISTS (
                SELECT 1 FROM inventory_batches ib
                WHERE ib.product_id = pr.id AND ib.tenant_id = ?
                  AND ib.deleted_at IS NULL AND ib.remaining_qty > 0
              )
              AND EXISTS (
                SELECT 1 FROM sale_items si
                INNER JOIN sales s ON s.id = si.sale_id
                WHERE si.product_id = pr.id AND si.tenant_id = ?
                  AND s.posted_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                  AND s.status IN ('posted','partially_returned')
              )
        ", [$tenantId, $tenantId, $tenantId])->n;

        $revenue = (float) ($sales->revenue ?? 0);
        $margin  = (float) ($items->margin ?? 0);
        $orders  = (int) ($sales->order_count ?? 0);
        $unique  = (int) ($sales->unique_customers ?? 0);

        $payload = [
            'revenue'                 => $revenue,
            'gross_margin'            => $margin,
            'margin_pct'              => $revenue > 0 ? round($margin / $revenue * 100, 4) : 0,
            'cogs'                    => (float) ($items->cogs ?? 0),
            'discount_given'          => (float) ($sales->discount ?? 0),
            'order_count'             => $orders,
            'avg_order_value'         => (float) ($sales->aov ?? 0),
            'avg_basket_size'         => $orders > 0 ? round(((int) ($items->lines ?? 0)) / $orders, 2) : 0,
            'unique_customers'        => $unique,
            'new_customers'           => $newCustomers,
            'returning_customers'     => max(0, $unique - $newCustomers),
            'returns_value'           => (float) ($items->returns_value ?? 0),
            'receivables_outstanding' => $receivables,
            'payables_outstanding'    => $payables,
            'cash_collected'          => $cashCollected,
            'inventory_value'         => $this->data->inventoryValue($tenantId),
            'stockout_count'          => $stockouts,
            'updated_at'              => now(),
        ];

        $existing = GrowthMetricSnapshot::withoutTenantScope()
            ->where('tenant_id', $tenantId)
            ->whereDate('snapshot_date', $date->toDateString())
            ->first();

        if ($existing) {
            $existing->update($payload);
            return $existing;
        }

        return GrowthMetricSnapshot::withoutTenantScope()->create(array_merge($payload, [
            'id'            => (string) Str::uuid(),
            'tenant_id'     => $tenantId,
            'snapshot_date' => $date->toDateString(),
            'created_at'    => now(),
        ]));
    }

    /**
     * Backfill history so a tenant does not have to wait months before the
     * baseline-driven insights become available. Runs once on first deep pass.
     */
    public function backfill(int|string $tenantId, int $days = 90): int
    {
        $existing = GrowthMetricSnapshot::withoutTenantScope()
            ->where('tenant_id', $tenantId)
            ->count();

        if ($existing >= $days * 0.5) {
            return 0; // Already have enough history.
        }

        $done = 0;
        for ($i = $days; $i >= 1; $i--) {
            $this->snapshot($tenantId, now()->subDays($i));
            $done++;
        }

        return $done;
    }
}
