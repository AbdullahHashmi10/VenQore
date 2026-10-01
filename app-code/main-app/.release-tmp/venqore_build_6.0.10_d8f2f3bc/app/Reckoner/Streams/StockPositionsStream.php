<?php

namespace App\Reckoner\Streams;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * StockPositionsStream: Pure tenant-scoped reader for inventory valuation and positions.
 * Tables: products, stocks, inventory_batches, categories, sale_item_batches, sales
 *
 * Invariant §4: stock_value_control
 * FIFO valuation (Σ batch.remaining_qty * batch.unit_cost) ties to GL Account 1100 (inventory).
 */
class StockPositionsStream
{
    /**
     * Total inventory stock value (FIFO batch valuation).
     */
    public function stockValuation(string $asOf, int|string $tenantId): float
    {
        $val = (float) DB::table('inventory_batches')
            ->where('tenant_id', $tenantId)
            ->where(DB::raw('DATE(created_at)'), '<=', $asOf)
            ->whereNull('deleted_at')
            ->sum(DB::raw('remaining_qty * unit_cost'));

        // Fallback to products * cost_price if no batches recorded
        if ($val <= 0.0) {
            $val = (float) DB::table('products')
                ->where('tenant_id', $tenantId)
                ->whereNull('deleted_at')
                ->where('is_active', 1)
                ->sum(DB::raw('quantity * cost_price'));
        }

        return round($val, 2);
    }

    /**
     * Total units on hand.
     */
    public function unitsOnHand(string $asOf, int|string $tenantId): float
    {
        $units = (float) DB::table('inventory_batches')
            ->where('tenant_id', $tenantId)
            ->where(DB::raw('DATE(created_at)'), '<=', $asOf)
            ->whereNull('deleted_at')
            ->sum('remaining_qty');

        if ($units <= 0.0) {
            $units = (float) DB::table('products')
                ->where('tenant_id', $tenantId)
                ->whereNull('deleted_at')
                ->where('is_active', 1)
                ->sum('quantity');
        }

        return round($units, 2);
    }

    /**
     * Low stock count: 0 < qty <= min_stock_alert (Decision D10).
     */
    public function lowStockCount(int|string $tenantId): float
    {
        $hasStocks = DB::table('stocks')->where('tenant_id', $tenantId)->exists();
        if ($hasStocks) {
            $stockSums = DB::table('stocks')
                ->where('tenant_id', $tenantId)
                ->selectRaw('product_id, SUM(quantity) as qty')
                ->groupBy('product_id')
                ->pluck('qty', 'product_id');

            $products = DB::table('products')
                ->where('tenant_id', $tenantId)
                ->whereNull('deleted_at')
                ->where(function ($q) {
                    $q->whereNull('is_active')->orWhere('is_active', 1);
                })
                ->get(['id', 'min_stock_alert', 'alert_quantity']);

            return (float) $products->filter(function ($p) use ($stockSums) {
                $qty = (float) ($stockSums[$p->id] ?? 0.0);
                $minAlert = (float) ($p->min_stock_alert ?? 0);
                $alertQty = (float) ($p->alert_quantity ?? 0);
                $thresh = $minAlert > 0 ? $minAlert : ($alertQty > 0 ? $alertQty : 5.0);
                return $qty > 0 && $qty <= $thresh;
            })->count();
        }

        return (float) DB::table('products')
            ->where('tenant_id', $tenantId)
            ->whereNull('deleted_at')
            ->where(function ($q) {
                $q->whereNull('is_active')->orWhere('is_active', 1);
            })
            ->where('quantity', '>', 0)
            ->whereRaw('quantity <= CASE WHEN COALESCE(min_stock_alert, 0) > 0 THEN min_stock_alert WHEN COALESCE(alert_quantity, 0) > 0 THEN alert_quantity ELSE 5 END')
            ->count();
    }

    /**
     * Out of stock count: qty <= 0.
     */
    public function outOfStockCount(int|string $tenantId): float
    {
        $hasStocks = DB::table('stocks')->where('tenant_id', $tenantId)->exists();
        if ($hasStocks) {
            $stockSums = DB::table('stocks')
                ->where('tenant_id', $tenantId)
                ->selectRaw('product_id, SUM(quantity) as qty')
                ->groupBy('product_id')
                ->pluck('qty', 'product_id');

            $products = DB::table('products')
                ->where('tenant_id', $tenantId)
                ->whereNull('deleted_at')
                ->where(function ($q) {
                    $q->whereNull('is_active')->orWhere('is_active', 1);
                })
                ->get(['id']);

            return (float) $products->filter(function ($p) use ($stockSums) {
                $qty = (float) ($stockSums[$p->id] ?? 0.0);
                return $qty <= 0;
            })->count();
        }

        return (float) DB::table('products')
            ->where('tenant_id', $tenantId)
            ->whereNull('deleted_at')
            ->where(function ($q) {
                $q->whereNull('is_active')->orWhere('is_active', 1);
            })
            ->where('quantity', '<=', 0)
            ->count();
    }

    /**
     * Low stock items list.
     */
    public function lowStockList(int|string $tenantId): array
    {
        $rows = DB::table('products')
            ->where('tenant_id', $tenantId)
            ->whereNull('deleted_at')
            ->where('is_active', 1)
            ->where('quantity', '>', 0)
            ->whereRaw('quantity <= COALESCE(min_stock_alert, alert_quantity, 5)')
            ->select('id', 'name', 'sku', 'quantity', DB::raw('COALESCE(min_stock_alert, alert_quantity, 5) as alert_qty'))
            ->orderBy('quantity')
            ->limit(20)
            ->get();

        return $rows->map(fn($r) => [
            'id'       => $r->id,
            'name'     => $r->name,
            'label'    => $r->name,
            'sku'      => $r->sku,
            'quantity' => (float)$r->quantity,
            'value'    => (float)$r->quantity,
            'alert_qty'=> (float)$r->alert_qty,
        ])->toArray();
    }

    /**
     * Valuation broken down by product category.
     */
    public function valueByCategory(string $asOf, int|string $tenantId): array
    {
        // First try inventory_batches joined with products and categories
        $rows = DB::table('inventory_batches as ib')
            ->join('products as p', 'ib.product_id', '=', 'p.id')
            ->leftJoin('categories as c', 'p.category_id', '=', 'c.id')
            ->where('ib.tenant_id', $tenantId)
            ->where('p.tenant_id', $tenantId)
            ->where(DB::raw('DATE(ib.created_at)'), '<=', $asOf)
            ->whereNull('ib.deleted_at')
            ->selectRaw('COALESCE(c.name, "Uncategorized") as cat_name, SUM(ib.remaining_qty * ib.unit_cost) as val')
            ->groupBy('cat_name')
            ->orderByDesc('val')
            ->get();

        if ($rows->isEmpty()) {
            $rows = DB::table('products as p')
                ->leftJoin('categories as c', 'p.category_id', '=', 'c.id')
                ->where('p.tenant_id', $tenantId)
                ->whereNull('p.deleted_at')
                ->where('p.is_active', 1)
                ->selectRaw('COALESCE(c.name, "Uncategorized") as cat_name, SUM(p.quantity * p.cost_price) as val')
                ->groupBy('cat_name')
                ->orderByDesc('val')
                ->get();
        }

        $out = [];
        foreach ($rows as $r) {
            $out[$r->cat_name] = round((float) $r->val, 2);
        }

        return $out;
    }

    /**
     * Top products by inventory value.
     */
    public function topStockByValue(string $asOf, int|string $tenantId): array
    {
        $rows = DB::table('inventory_batches as ib')
            ->join('products as p', 'ib.product_id', '=', 'p.id')
            ->where('ib.tenant_id', $tenantId)
            ->where('p.tenant_id', $tenantId)
            ->where(DB::raw('DATE(ib.created_at)'), '<=', $asOf)
            ->whereNull('ib.deleted_at')
            ->selectRaw('p.id, p.name, p.sku, SUM(ib.remaining_qty * ib.unit_cost) as total_val, SUM(ib.remaining_qty) as total_qty')
            ->groupBy('p.id', 'p.name', 'p.sku')
            ->orderByDesc('total_val')
            ->limit(10)
            ->get();

        if ($rows->isEmpty()) {
            $rows = DB::table('products as p')
                ->where('p.tenant_id', $tenantId)
                ->whereNull('p.deleted_at')
                ->where('p.is_active', 1)
                ->selectRaw('p.id, p.name, p.sku, (p.quantity * p.cost_price) as total_val, p.quantity as total_qty')
                ->orderByDesc('total_val')
                ->limit(10)
                ->get();
        }

        return $rows->map(fn($r) => [
            'id'       => $r->id,
            'label'    => $r->name,
            'name'     => $r->name,
            'sku'      => $r->sku,
            'value'    => round((float)$r->total_val, 2),
            'amount'   => round((float)$r->total_val, 2),
            'quantity' => (float)$r->total_qty,
        ])->toArray();
    }

    /**
     * Dead stock value: items in stock with 0 sales in the period.
     */
    public function deadStockValue(string $asOf, string $from, int|string $tenantId): float
    {
        $soldProductIds = DB::table('sale_items as si')
            ->join('sales as s', 'si.sale_id', '=', 's.id')
            ->where('s.tenant_id', $tenantId)
            ->where('si.tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(s.posted_at, s.created_at))'), [$from, $asOf])
            ->whereIn('s.status', ['posted', 'completed', 'active'])
            ->whereNull('s.deleted_at')
            ->pluck('si.product_id')
            ->unique()
            ->toArray();

        $deadVal = (float) DB::table('inventory_batches')
            ->where('tenant_id', $tenantId)
            ->where(DB::raw('DATE(created_at)'), '<=', $asOf)
            ->whereNull('deleted_at')
            ->whereNotIn('product_id', $soldProductIds)
            ->sum(DB::raw('remaining_qty * unit_cost'));

        return round($deadVal, 2);
    }

    /**
     * Turnover ratio: COGS in period / stock valuation.
     */
    public function turnoverRatio(string $from, string $to, int|string $tenantId): ?float
    {
        $cogs = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('je.tenant_id', $tenantId)
            ->where('ji.tenant_id', $tenantId)
            ->where('a.tenant_id', $tenantId)
            ->where('je.is_reversed', 0)
            ->whereBetween('je.date', [$from, $to])
            ->where(function ($q) {
                $q->where('a.role', 'cogs')->orWhere('a.code', '5000');
            })
            ->sum(DB::raw('ji.debit - ji.credit'));

        $avgStock = $this->stockValuation($to, $tenantId);
        if ($avgStock <= 0.0) {
            return null;
        }

        return round($cogs / $avgStock, 2);
    }

    /**
     * Days of cover: (stock value / COGS per day).
     */
    public function daysOfCover(string $from, string $to, int|string $tenantId): float
    {
        $stock = $this->stockValuation($to, $tenantId);
        $days = max(1, Carbon::parse($from)->diffInDays(Carbon::parse($to)) + 1);

        $cogs = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('je.tenant_id', $tenantId)
            ->where('ji.tenant_id', $tenantId)
            ->where('a.tenant_id', $tenantId)
            ->where('je.is_reversed', 0)
            ->whereBetween('je.date', [$from, $to])
            ->where(function ($q) {
                $q->where('a.role', 'cogs')->orWhere('a.code', '5000');
            })
            ->sum(DB::raw('ji.debit - ji.credit'));

        $dailyBurn = $days > 0 ? ($cogs / $days) : 0.0;
        if ($dailyBurn <= 0.0) {
            return 999.0;
        }

        return round($stock / $dailyBurn, 1);
    }

    /**
     * Valuation trend series.
     */
    public function valuationTrend(string $from, string $to, int|string $tenantId): array
    {
        $curVal = $this->stockValuation($to, $tenantId);
        $cur = Carbon::parse($from);
        $end = Carbon::parse($to);
        $points = [];

        while ($cur->lte($end)) {
            $points[] = [
                'date'  => $cur->toDateString(),
                'value' => $curVal,
            ];
            $cur->addDay();
        }

        return $points;
    }
}
