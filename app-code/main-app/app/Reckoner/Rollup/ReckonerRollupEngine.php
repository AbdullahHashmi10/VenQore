<?php

namespace App\Reckoner\Rollup;

use App\Models\Tenant;
use App\Reckoner\Streams\LedgerStream;
use App\Reckoner\Streams\SalesHeadersStream;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * ReckonerRollupEngine: Pre-aggregates daily flows and closing positions into reckoner_daily (§5.1, §6.3).
 *
 * Rules:
 * 1. Strict tenant isolation on every raw query.
 * 2. Dimension guard: max 200 distinct dim_values per tenant x measure x day.
 * 3. Atomic upserts into reckoner_daily.
 * 4. Stored numbers must exactly equal live stream readers to 0.01.
 */
class ReckonerRollupEngine
{
    protected LedgerStream $ledgerStream;
    protected SalesHeadersStream $salesStream;

    public function __construct(LedgerStream $ledgerStream, SalesHeadersStream $salesStream)
    {
        $this->ledgerStream = $ledgerStream;
        $this->salesStream = $salesStream;
    }

    /**
     * Rolls up one specific business day for a tenant.
     */
    public function rollupDay(Tenant|int|string $tenant, string $day, array $targetMeasures = []): int
    {
        $tenantId = $tenant instanceof Tenant ? $tenant->id : (int) $tenant;
        $dayStr = substr($day, 0, 10);
        $computedAt = now();
        $rows = [];

        // ── 1. GL FLOW MEASURES ──────────────────────────────────────────────
        $glFlows = $this->computeGlFlows($tenantId, $dayStr);
        foreach ($glFlows as $row) {
            $rows[] = array_merge($row, [
                'tenant_id'          => $tenantId,
                'day'                => $dayStr,
                'kind'               => 'flow',
                'definition_version' => 1,
                'computed_at'        => $computedAt,
            ]);
        }

        // ── 2. SALES FLOW MEASURES ───────────────────────────────────────────
        $salesFlows = $this->computeSalesFlows($tenantId, $dayStr);
        foreach ($salesFlows as $row) {
            $rows[] = array_merge($row, [
                'tenant_id'          => $tenantId,
                'day'                => $dayStr,
                'kind'               => 'flow',
                'definition_version' => 1,
                'computed_at'        => $computedAt,
            ]);
        }

        // ── 3. PURCHASES FLOW MEASURES ───────────────────────────────────────
        $purchasesFlows = $this->computePurchasesFlows($tenantId, $dayStr);
        foreach ($purchasesFlows as $row) {
            $rows[] = array_merge($row, [
                'tenant_id'          => $tenantId,
                'day'                => $dayStr,
                'kind'               => 'flow',
                'definition_version' => 1,
                'computed_at'        => $computedAt,
            ]);
        }

        // Filter target measures if specified
        if (!empty($targetMeasures)) {
            $rows = array_filter($rows, fn($r) => in_array($r['measure'], $targetMeasures, true));
        }

        if (empty($rows)) {
            // Still clear any dirty marker for this day
            DB::table('reckoner_dirty_days')
                ->where('tenant_id', $tenantId)
                ->where('day', $dayStr)
                ->delete();
            return 0;
        }

        // Apply low-cardinality guard (≤ 200 distinct dim_values per tenant x measure x day)
        $guardedRows = $this->enforceDimensionCaps($rows);

        // Atomic Upsert in chunks
        $chunks = array_chunk($guardedRows, 100);
        $written = 0;

        foreach ($chunks as $chunk) {
            DB::table('reckoner_daily')->upsert(
                $chunk,
                ['tenant_id', 'measure', 'dim', 'dim_value', 'day'],
                ['value', 'qty', 'n', 'definition_version', 'computed_at']
            );
            $written += count($chunk);
        }

        // Clear dirty markers for this day
        DB::table('reckoner_dirty_days')
            ->where('tenant_id', $tenantId)
            ->where('day', $dayStr)
            ->delete();

        return $written;
    }

    /**
     * Process pending dirty days for a tenant.
     */
    public function rollupPending(Tenant|int|string $tenant, int $limitDays = 60): int
    {
        $tenantId = $tenant instanceof Tenant ? $tenant->id : (int) $tenant;

        $pendingDays = DB::table('reckoner_dirty_days')
            ->where('tenant_id', $tenantId)
            ->select('day')
            ->distinct()
            ->orderBy('day', 'asc')
            ->limit($limitDays)
            ->pluck('day')
            ->all();

        $totalWritten = 0;
        foreach ($pendingDays as $day) {
            $totalWritten += $this->rollupDay($tenantId, (string) $day);
        }

        return $totalWritten;
    }

    /**
     * Backfill a date range for a tenant.
     */
    public function backfill(
        Tenant|int|string $tenant,
        string $from,
        string $to,
        array $targetMeasures = [],
        bool $dryRun = false
    ): array {
        $tenantId = $tenant instanceof Tenant ? $tenant->id : (int) $tenant;
        $period = CarbonPeriod::create($from, $to);
        $daysCount = 0;
        $rowsWritten = 0;

        foreach ($period as $dt) {
            $dayStr = $dt->toDateString();
            $daysCount++;
            if (!$dryRun) {
                $rowsWritten += $this->rollupDay($tenantId, $dayStr, $targetMeasures);
            }
        }

        return [
            'tenant_id'    => $tenantId,
            'from'         => $from,
            'to'           => $to,
            'days_count'   => $daysCount,
            'rows_written' => $rowsWritten,
            'dry_run'      => $dryRun,
        ];
    }

    /**
     * Compute GL flow measures for a day.
     */
    protected function computeGlFlows(int $tenantId, string $day): array
    {
        $rows = [];

        // 1. Total revenue, income, cogs, opex, tax via LedgerStream logic
        $measures = [
            'gl.sales_revenue',
            'gl.income',
            'gl.cogs',
            'gl.opex',
            'gl.cash_in',
            'gl.cash_out',
            'gl.tax_collected',
            'gl.tax_paid',
        ];

        $flows = $this->ledgerStream->flows($measures, ['d' => ['from' => $day, 'to' => $day]], [], $tenantId)['d'] ?? [];

        foreach ($measures as $m) {
            $val = (float) ($flows[$m] ?? 0.0);
            $rows[] = [
                'measure'   => $m,
                'dim'       => '',
                'dim_value' => '',
                'value'     => $val,
                'qty'       => 0.0,
                'n'         => $val != 0.0 ? 1 : 0,
            ];
        }

        // 2. Breakdown of cash/bank flows by bank_account if dimension exists
        $bankFlows = DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('ji.tenant_id', $tenantId)
            ->where('je.tenant_id', $tenantId)
            ->where('a.tenant_id', $tenantId)
            ->where('je.date', $day)
            ->where('je.is_reversed', 0)
            ->whereIn('a.role', ['cash', 'bank'])
            ->whereNotNull('ji.bank_account_id')
            ->select(
                'ji.bank_account_id',
                DB::raw('COALESCE(SUM(ji.debit), 0) as dr'),
                DB::raw('COALESCE(SUM(ji.credit), 0) as cr'),
                DB::raw('COUNT(*) as cnt')
            )
            ->groupBy('ji.bank_account_id')
            ->get();

        foreach ($bankFlows as $bf) {
            $rows[] = [
                'measure'   => 'gl.cash_in',
                'dim'       => 'bank_account',
                'dim_value' => (string) $bf->bank_account_id,
                'value'     => (float) $bf->dr,
                'qty'       => 0.0,
                'n'         => (int) $bf->cnt,
            ];
            $rows[] = [
                'measure'   => 'gl.cash_out',
                'dim'       => 'bank_account',
                'dim_value' => (string) $bf->bank_account_id,
                'value'     => (float) $bf->cr,
                'qty'       => 0.0,
                'n'         => (int) $bf->cnt,
            ];
        }

        return $rows;
    }

    /**
     * Compute Sales flow measures for a day.
     */
    protected function computeSalesFlows(int $tenantId, string $day): array
    {
        $rows = [];

        $sales = DB::table('sales')
            ->where('tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(posted_at, created_at))'), [$day, $day])
            ->whereIn('status', ['posted', 'completed', 'active'])
            ->whereNull('deleted_at')
            ->select(
                'source',
                'ecommerce_channel_id',
                'original_sale_id',
                DB::raw('COALESCE(SUM(subtotal), 0) as gross_sales'),
                DB::raw('COALESCE(SUM(net_sales), 0) as net_sales'),
                DB::raw('COALESCE(SUM(discount), 0) as discounts'),
                DB::raw('COALESCE(SUM(tax), 0) as taxes'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('source', 'ecommerce_channel_id', 'original_sale_id')
            ->get();

        $totalGross = 0.0;
        $totalNet = 0.0;
        $totalDiscount = 0.0;
        $totalTax = 0.0;
        $totalCount = 0;

        foreach ($sales as $s) {
            $isReturn = !empty($s->original_sale_id);
            $sign = $isReturn ? -1.0 : 1.0;

            $net = (float) $s->net_sales;
            $gross = (float) $s->gross_sales;
            $disc = (float) $s->discounts;
            $tax = (float) $s->taxes;
            $cnt = (int) $s->count;

            if (!$isReturn) {
                $totalGross += $gross;
                $totalDiscount += $disc;
                $totalTax += $tax;
                $totalCount += $cnt;
            }

            $totalNet += ($sign * $net);

            // Channel dimension: 'marketplace' if ecommerce_channel_id set, else 'pos' or 'invoicing'
            $channel = !empty($s->ecommerce_channel_id)
                ? 'marketplace'
                : ($s->source === 'pos' ? 'pos' : 'invoicing');

            $rows[] = [
                'measure'   => 'sales.net_revenue',
                'dim'       => 'channel',
                'dim_value' => (string) $channel,
                'value'     => round($sign * $net, 4),
                'qty'       => 0.0,
                'n'         => $cnt,
            ];
        }

        // Totals (dim = '')
        $rows[] = [
            'measure'   => 'sales.gross_revenue',
            'dim'       => '',
            'dim_value' => '',
            'value'     => round($totalGross, 4),
            'qty'       => 0.0,
            'n'         => $totalCount,
        ];
        $rows[] = [
            'measure'   => 'sales.net_revenue',
            'dim'       => '',
            'dim_value' => '',
            'value'     => round($totalNet, 4),
            'qty'       => 0.0,
            'n'         => $totalCount,
        ];
        $rows[] = [
            'measure'   => 'sales.order_count',
            'dim'       => '',
            'dim_value' => '',
            'value'     => (float) $totalCount,
            'qty'       => 0.0,
            'n'         => $totalCount,
        ];
        $rows[] = [
            'measure'   => 'sales.discount_amount',
            'dim'       => '',
            'dim_value' => '',
            'value'     => round($totalDiscount, 4),
            'qty'       => 0.0,
            'n'         => $totalCount,
        ];
        $rows[] = [
            'measure'   => 'sales.tax_amount',
            'dim'       => '',
            'dim_value' => '',
            'value'     => round($totalTax, 4),
            'qty'       => 0.0,
            'n'         => $totalCount,
        ];

        return $rows;
    }

    /**
     * Compute Purchases flow measures for a day.
     */
    protected function computePurchasesFlows(int $tenantId, string $day): array
    {
        $rows = [];

        $purchases = DB::table('purchases')
            ->where('tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(purchase_date, created_at))'), [$day, $day])
            ->select(
                DB::raw('COALESCE(SUM(total), 0) as spend'),
                DB::raw('COUNT(*) as cnt')
            )
            ->first();

        $spend = (float) ($purchases->spend ?? 0.0);
        $cnt = (int) ($purchases->cnt ?? 0);

        $rows[] = [
            'measure'   => 'purchases.total_spend',
            'dim'       => '',
            'dim_value' => '',
            'value'     => round($spend, 4),
            'qty'       => 0.0,
            'n'         => $cnt,
        ];
        $rows[] = [
            'measure'   => 'purchases.bill_count',
            'dim'       => '',
            'dim_value' => '',
            'value'     => (float) $cnt,
            'qty'       => 0.0,
            'n'         => $cnt,
        ];

        return $rows;
    }

    /**
     * Enforce dimension cap: max 200 distinct dim_values per tenant x measure x day.
     */
    protected function enforceDimensionCaps(array $rows): array
    {
        $grouped = [];
        $result = [];

        foreach ($rows as $r) {
            $m = $r['measure'];
            $dim = $r['dim'];
            $val = $r['dim_value'];

            if ($dim === '') {
                $result[] = $r;
                continue;
            }

            $key = "{$m}:{$dim}";
            if (!isset($grouped[$key])) {
                $grouped[$key] = [];
            }

            if (count($grouped[$key]) < 200) {
                $grouped[$key][] = $r;
                $result[] = $r;
            }
        }

        return $result;
    }
}
