<?php

namespace App\Reckoner\Streams;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * SalesHeadersStream: Pure tenant-explicit reader for sales table.
 * Tables: sales, allocations, parties, tenant_users, users
 */
class SalesHeadersStream
{
    /**
     * Counter (POS) sales summary.
     */
    public function posSummary(string $from, string $to, int|string $tenantId): array
    {
        $base = DB::table('sales')
            ->where('tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(posted_at, created_at))'), [$from, $to])
            ->whereNull('deleted_at')
            ->whereNull('original_sale_id');

        $posted = (clone $base)
            ->where('source', 'pos')
            ->whereIn('status', ['posted', 'completed', 'active']);

        $netRevenue = (float) ($posted->sum('net_sales') ?? 0.0);
        $count = (int) $posted->count();
        $avgSale = $count > 0 ? round($netRevenue / $count, 2) : 0.0;
        $discounts = (float) ($posted->sum('discount') ?? 0.0);

        $voidedCount = (int) (clone $base)
            ->where('source', 'pos')
            ->where('status', 'voided')
            ->count();

        $maxSale = (float) ((clone $posted)->max('net_sales') ?? 0.0);
        $itemsCount = (float) DB::table('sale_items as si')
            ->join('sales as s', 'si.sale_id', '=', 's.id')
            ->where('s.tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(s.posted_at, s.created_at))'), [$from, $to])
            ->where('s.source', 'pos')
            ->whereIn('s.status', ['posted', 'completed', 'active'])
            ->whereNull('s.deleted_at')
            ->whereNull('s.original_sale_id')
            ->sum('si.quantity');
        $itemsPerSale = $count > 0 ? round($itemsCount / $count, 2) : 0.0;

        return [
            'revenue'           => $netRevenue,
            'net_sales'         => $netRevenue,
            'count'             => (float) $count,
            'transaction_count' => (float) $count,
            'avg_sale'          => $avgSale,
            'max_sale'          => $maxSale,
            'items_per_sale'    => $itemsPerSale,
            'discounts'         => $discounts,
            'discounts_given'   => $discounts,
            'voided_count'      => (float) $voidedCount,
        ];
    }

    /**
     * Invoice screen sales summary.
     */
    public function invoiceSummary(string $from, string $to, int|string $tenantId): array
    {
        $posted = DB::table('sales')
            ->where('tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(posted_at, created_at))'), [$from, $to])
            ->where('source', '!=', 'pos')
            ->whereIn('status', ['posted', 'completed', 'active'])
            ->whereNull('deleted_at')
            ->whereNull('original_sale_id');

        $netRevenue = (float) ($posted->sum('net_sales') ?? 0.0);
        $count = (int) $posted->count();
        $taxInvoiced = (float) ($posted->sum('total_tax') ?? 0.0);
        $avgInvoice = $count > 0 ? round($netRevenue / $count, 2) : 0.0;

        return [
            'revenue'         => $netRevenue,
            'total_invoiced'  => $netRevenue,
            'count'           => (float) $count,
            'invoice_count'   => (float) $count,
            'tax_invoiced'    => $taxInvoiced,
            'avg_invoice'     => $avgInvoice,
            'avg_days_to_pay' => 0.0,
        ];
    }

    /**
     * Channel split: Counter vs Invoice vs Marketplace.
     */
    public function channelSplit(string $from, string $to, int|string $tenantId): array
    {
        $sales = DB::table('sales')
            ->where('tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(posted_at, created_at))'), [$from, $to])
            ->whereIn('status', ['posted', 'completed', 'active'])
            ->whereNull('deleted_at')
            ->whereNull('original_sale_id')
            ->select('source', 'ecommerce_channel_id', 'net_sales')
            ->get();

        $counter = 0.0;
        $invoicing = 0.0;
        $marketplace = 0.0;

        foreach ($sales as $s) {
            $amt = (float) ($s->net_sales ?? 0.0);
            if (!empty($s->ecommerce_channel_id)) {
                $marketplace += $amt;
            } elseif ($s->source === 'pos') {
                $counter += $amt;
            } else {
                $invoicing += $amt;
            }
        }

        return [
            'Counter'     => round($counter, 2),
            'Invoicing'   => round($invoicing, 2),
            'Marketplace' => round($marketplace, 2),
        ];
    }

    /**
     * Tender split for counter sales (cash vs other methods).
     */
    public function tenderSplit(string $from, string $to, int|string $tenantId, ?string $source = null): array
    {
        $q = DB::table('sales')
            ->where('tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(posted_at, created_at))'), [$from, $to])
            ->whereIn('status', ['posted', 'completed', 'active'])
            ->whereNull('deleted_at')
            ->whereNull('original_sale_id');

        if ($source !== null) {
            $q->where('source', $source);
        }

        $rows = $q->selectRaw("COALESCE(NULLIF(payment_method, ''), 'cash') as method_name, SUM(net_sales) as total")
            ->groupBy('method_name')
            ->get();

        $split = [];
        foreach ($rows as $r) {
            $m = ucfirst(strtolower(trim((string) $r->method_name)));
            $split[$m] = round((float) $r->total, 2);
        }

        return $split;
    }

    /**
     * Hourly heatmap: matrix of weekday (0=Sun..6=Sat) x hour (0..23).
     */
    public function hourlyHeatmap(string $from, string $to, int|string $tenantId, ?string $source = null): array
    {
        $q = DB::table('sales')
            ->where('tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(posted_at, created_at))'), [$from, $to])
            ->whereIn('status', ['posted', 'completed', 'active'])
            ->whereNull('deleted_at')
            ->whereNull('original_sale_id');

        if ($source !== null) {
            $q->where('source', $source);
        }

        $rows = $q->selectRaw("DAYOFWEEK(COALESCE(posted_at, created_at)) - 1 as wday, HOUR(COALESCE(posted_at, created_at)) as hr, SUM(net_sales) as val")
            ->groupBy('wday', 'hr')
            ->get();

        $matrix = [];
        foreach ($rows as $r) {
            $matrix[(int) $r->wday][(int) $r->hr] = round((float) $r->val, 2);
        }

        return $matrix;
    }

    /**
     * Unpaid or overdue invoices list.
     */
    public function invoiceAgingList(string $asOf, int|string $tenantId, bool $overdueOnly = false): array
    {
        $q = DB::table('sales as s')
            ->leftJoin('parties as p', 's.party_id', '=', 'p.id')
            ->where('s.tenant_id', $tenantId)
            ->where(DB::raw('DATE(COALESCE(s.posted_at, s.created_at))'), '<=', $asOf)
            ->where('s.source', '!=', 'pos')
            ->whereIn('s.status', ['posted', 'completed', 'active'])
            ->whereNull('s.deleted_at')
            ->whereNull('s.original_sale_id');

        if ($overdueOnly) {
            $q->whereNotNull('s.due_date')->where('s.due_date', '<', $asOf);
        }

        $sales = $q->select(
            's.id',
            's.reference_number',
            's.party_id',
            'p.name as customer_name',
            DB::raw('DATE(COALESCE(s.posted_at, s.created_at)) as invoice_date'),
            's.due_date',
            's.total as invoice_total',
            's.net_sales'
        )->get();

        $items = [];
        $totalUnpaid = 0.0;

        foreach ($sales as $s) {
            $total = (float) ($s->invoice_total ?? $s->net_sales ?? 0.0);
            $allocated = (float) DB::table('allocations')
                ->where('tenant_id', $tenantId)
                ->where('sale_id', $s->id)
                ->where('status', 'active')
                ->sum('allocated_amount');

            $open = $total - $allocated;
            if ($open > 0.01) {
                $totalUnpaid += $open;
                $items[] = [
                    'id'               => $s->id,
                    'reference'        => $s->reference_number,
                    'customer'         => $s->customer_name ?: 'Customer #' . $s->party_id,
                    'date'             => $s->invoice_date,
                    'due_date'         => $s->due_date,
                    'total'            => $total,
                    'unpaid_amount'    => round($open, 2),
                    'amount'           => round($open, 2),
                ];
            }
        }

        return [
            'items' => $items,
            'total' => round($totalUnpaid, 2),
            'count' => count($items),
        ];
    }

    /**
     * Sales Returns summary.
     */
    public function returnsSummary(string $from, string $to, int|string $tenantId): array
    {
        $returns = DB::table('sales as s')
            ->where('s.tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(s.posted_at, s.created_at))'), [$from, $to])
            ->whereNotNull('s.original_sale_id')
            ->whereNull('s.deleted_at')
            ->get();

        $count = count($returns);
        $totalValue = 0.0;
        $reasons = [];

        foreach ($returns as $r) {
            $amt = abs((float) ($r->total ?? $r->net_sales ?? 0.0));
            $totalValue += $amt;
            $reason = trim((string) ($r->return_reason ?: 'Not specified'));
            $reasons[$reason] = ($reasons[$reason] ?? 0.0) + $amt;
        }

        // Qty returned from sale_items
        $totalQty = (float) DB::table('sale_items as si')
            ->join('sales as s', 'si.sale_id', '=', 's.id')
            ->where('s.tenant_id', $tenantId)
            ->where('si.tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(s.posted_at, s.created_at))'), [$from, $to])
            ->whereNotNull('s.original_sale_id')
            ->whereNull('si.deleted_at')
            ->sum('si.quantity');

        return [
            'count'      => (float) $count,
            'value'      => round($totalValue, 2),
            'qty'        => round($totalQty, 2),
            'by_reason'  => $reasons,
        ];
    }

    /**
     * Daily revenue trend for POS or Invoicing.
     */
    public function dailyRevenueTrend(string $from, string $to, int|string $tenantId, ?string $source = null): array
    {
        $q = DB::table('sales')
            ->where('tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(posted_at, created_at))'), [$from, $to])
            ->whereIn('status', ['posted', 'completed', 'active'])
            ->whereNull('deleted_at')
            ->whereNull('original_sale_id');

        if ($source === 'pos') {
            $q->where('source', 'pos');
        } elseif ($source === 'invoice') {
            $q->where('source', '!=', 'pos');
        }

        $rows = $q->selectRaw('DATE(COALESCE(posted_at, created_at)) as day, SUM(net_sales) as val')
            ->groupBy('day')
            ->orderBy('day')
            ->get();

        $map = [];
        foreach ($rows as $r) {
            $map[$r->day] = (float) $r->val;
        }

        $cur = Carbon::parse($from);
        $end = Carbon::parse($to);
        $points = [];
        while ($cur->lte($end)) {
            $d = $cur->toDateString();
            $points[] = [
                'date' => $d,
                'value' => $map[$d] ?? 0.0,
            ];
            $cur->addDay();
        }

        return $points;
    }

    public function invoiceAging(string $asOf, int|string $tenantId, bool $overdueOnly = false): array
    {
        return $this->invoiceAgingList($asOf, $tenantId, $overdueOnly);
    }
}
