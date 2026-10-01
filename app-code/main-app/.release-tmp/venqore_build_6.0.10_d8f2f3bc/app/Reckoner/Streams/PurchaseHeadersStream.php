<?php

namespace App\Reckoner\Streams;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * PurchaseHeadersStream: Pure tenant-scoped reader for purchases and supplier payables.
 * Tables: purchases, purchase_items, purchase_orders, purchase_returns, suppliers, parties, accounts, journal_items
 */
class PurchaseHeadersStream
{
    /**
     * Recognized purchases summary in period.
     */
    public function purchaseSummary(string $from, string $to, int|string $tenantId): array
    {
        $base = DB::table('purchases')
            ->where('tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(purchase_date, created_at))'), [$from, $to]);

        $spend = (float) ($base->sum('total') ?? 0.0);
        $count = (int) $base->count();
        $avgBill = $count > 0 ? round($spend / $count, 2) : 0.0;

        return [
            'spend'    => $spend,
            'count'    => (float) $count,
            'avg_bill' => $avgBill,
        ];
    }

    /**
     * Unpaid and overdue purchases aging as of date.
     */
    public function purchaseAging(string $asOf, int|string $tenantId, bool $overdueOnly = false): array
    {
        // 1. Calculate from AP journal items (the ledger truth)
        $apBalance = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('je.tenant_id', $tenantId)
            ->where('ji.tenant_id', $tenantId)
            ->where('a.tenant_id', $tenantId)
            ->where('je.is_reversed', 0)
            ->where('je.date', '<=', $asOf)
            ->where(function ($q) {
                $q->where('a.role', 'ap')->orWhere('a.code', '2000');
            })
            ->sum(DB::raw('ji.credit - ji.debit')) ?? 0.0;

        // Overdue check from purchases table
        $overdueQuery = DB::table('purchases')
            ->where('tenant_id', $tenantId)
            ->where(DB::raw('DATE(COALESCE(purchase_date, created_at))'), '<=', $asOf)
            ->whereNotNull('due_date')
            ->where('due_date', '<', $asOf)
            ->whereIn('payment_status', ['unpaid', 'partial', 'pending']);

        $overdueValue = (float) ($overdueQuery->sum('total') ?? 0.0);
        if ($overdueValue > $apBalance && $apBalance > 0) {
            $overdueValue = $apBalance;
        }

        return [
            'unpaid_value'  => round(max(0.0, $apBalance), 2),
            'overdue_value' => round(max(0.0, $overdueValue > 0 ? $overdueValue : $apBalance), 2),
        ];
    }

    /**
     * Payments made to suppliers in period.
     */
    public function paidToSuppliers(string $from, string $to, int|string $tenantId): float
    {
        // Outflows hitting AP account
        $paid = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('je.tenant_id', $tenantId)
            ->where('ji.tenant_id', $tenantId)
            ->where('a.tenant_id', $tenantId)
            ->where('je.is_reversed', 0)
            ->whereBetween('je.date', [$from, $to])
            ->where(function ($q) {
                $q->where('a.role', 'ap')->orWhere('a.code', '2000');
            })
            ->sum('ji.debit') ?? 0.0;

        return round($paid, 2);
    }

    /**
     * Spend by supplier breakdown.
     */
    public function bySupplier(string $from, string $to, int|string $tenantId): array
    {
        $rows = DB::table('purchases as p')
            ->leftJoin('parties as pt', 'p.party_id', '=', 'pt.id')
            ->where('p.tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(p.purchase_date, p.created_at))'), [$from, $to])
            ->selectRaw('COALESCE(pt.name, "Direct Supplier") as sup_name, SUM(p.total) as val')
            ->groupBy('sup_name')
            ->orderByDesc('val')
            ->get();

        $out = [];
        foreach ($rows as $r) {
            $out[$r->sup_name] = round((float) $r->val, 2);
        }

        return $out;
    }

    /**
     * Spend by product category breakdown.
     */
    public function byCategory(string $from, string $to, int|string $tenantId): array
    {
        $rows = DB::table('purchase_items as pi')
            ->join('purchases as p', 'pi.purchase_id', '=', 'p.id')
            ->join('products as prod', 'pi.product_id', '=', 'prod.id')
            ->leftJoin('categories as c', 'prod.category_id', '=', 'c.id')
            ->where('p.tenant_id', $tenantId)
            ->where('pi.tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(p.purchase_date, p.created_at))'), [$from, $to])
            ->selectRaw('COALESCE(c.name, "General") as cat_name, SUM(COALESCE(pi.line_total, pi.qty * pi.unit_cost)) as val')
            ->groupBy('cat_name')
            ->orderByDesc('val')
            ->get();

        $out = [];
        foreach ($rows as $r) {
            $out[$r->cat_name] = round((float) $r->val, 2);
        }

        return $out;
    }

    /**
     * Daily purchase spend trend.
     */
    public function dailySpendTrend(string $from, string $to, int|string $tenantId): array
    {
        $rows = DB::table('purchases')
            ->where('tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(purchase_date, created_at))'), [$from, $to])
            ->selectRaw('DATE(COALESCE(purchase_date, created_at)) as day, SUM(total) as val')
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
                'date'  => $d,
                'value' => $map[$d] ?? 0.0,
            ];
            $cur->addDay();
        }

        return $points;
    }

    /**
     * Purchase Orders summary.
     */
    public function purchaseOrdersSummary(string $from, string $to, int|string $tenantId): array
    {
        $base = DB::table('purchase_orders')
            ->where('tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(order_date, created_at))'), [$from, $to])
            ->whereNull('deleted_at');

        $open = (clone $base)->whereIn('status', ['pending', 'open', 'sent', 'processing', 'ordered']);
        $openCount = (float) $open->count();
        $openValue = (float) ($open->sum('total_amount') ?? 0.0);

        $overdueCount = (float) ((clone $open)
            ->whereNotNull('expected_delivery_date')
            ->where('expected_delivery_date', '<', $to)
            ->count());

        $totalCount = (int) $base->count();
        $receivedCount = (int) ((clone $base)->whereIn('status', ['received', 'completed'])->count());
        $fillRate = $totalCount > 0 ? round($receivedCount / $totalCount * 100, 2) : 0.0;

        return [
            'open_count'            => $openCount,
            'open_value'            => $openValue,
            'pending_receipt_value' => $openValue,
            'overdue_count'         => $overdueCount,
            'avg_lead_days'         => 0.0,
            'fill_rate'             => $fillRate,
        ];
    }

    /**
     * Purchase returns summary.
     */
    public function purchaseReturnsSummary(string $from, string $to, int|string $tenantId): array
    {
        $base = DB::table('purchase_returns')
            ->where('tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(return_date, created_at))'), [$from, $to]);

        $count = (float) $base->count();
        $val = (float) ($base->sum('total_amount') ?? 0.0);

        $purchasesSpend = (float) (DB::table('purchases')
            ->where('tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(purchase_date, created_at))'), [$from, $to])
            ->sum('total') ?? 0.0);

        $rate = $purchasesSpend > 0 ? round($val / $purchasesSpend * 100, 2) : 0.0;

        return [
            'count'      => $count,
            'value'      => $val,
            'credit_due' => $val,
            'rate'       => $rate,
            'by_supplier'=> [],
        ];
    }
}
