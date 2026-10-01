<?php

namespace App\Reckoner\Streams;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * StockOperationsStream: Pure tenant-scoped reader for stock operations, catalog, and production.
 * Tables: stock_transfers, stock_takes, stock_take_items, inventory_batches,
 *         product_variants, product_serials, units, compositions, composition_items,
 *         production_runs, suppliers, parties, products, categories, sales, purchase_items
 */
class StockOperationsStream
{
    /**
     * Stock Transfers summary.
     */
    public function stockTransfersSummary(string $from, string $to, int|string $tenantId): array
    {
        $base = DB::table('stock_transfers')
            ->where('tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(transfer_date, created_at))'), [$from, $to])
            ->whereNull('deleted_at');

        $count = (float) $base->count();
        $pending = (float) ((clone $base)->whereIn('status', ['pending', 'in_transit', 'draft'])->count());

        $pendingValue = (float) DB::table('stock_transfer_items as sti')
            ->join('stock_transfers as st', 'sti.stock_transfer_id', '=', 'st.id')
            ->join('products as p', 'sti.product_id', '=', 'p.id')
            ->where('st.tenant_id', $tenantId)
            ->where('p.tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(st.transfer_date, st.created_at))'), [$from, $to])
            ->whereIn('st.status', ['pending', 'in_transit', 'draft'])
            ->whereNull('st.deleted_at')
            ->sum(DB::raw('sti.quantity * p.cost_price'));

        return [
            'count'             => $count,
            'pending_count'     => $pending,
            'pending_value'     => round($pendingValue, 2),
            'avg_transit_days'  => 0.0,
            'discrepancy_count' => 0.0,
        ];
    }

    /**
     * Stock Takes (audits & counts) summary.
     */
    public function stockTakesSummary(string $from, string $to, int|string $tenantId): array
    {
        $base = DB::table('stock_takes')
            ->where('tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(date, created_at))'), [$from, $to])
            ->whereNull('deleted_at');

        $pending = (float) ((clone $base)->whereIn('status', ['draft', 'pending', 'in_progress'])->count());

        $items = DB::table('stock_take_items as sti')
            ->join('stock_takes as st', 'sti.stock_take_id', '=', 'st.id')
            ->join('products as p', 'sti.product_id', '=', 'p.id')
            ->where('st.tenant_id', $tenantId)
            ->where('p.tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(st.date, st.created_at))'), [$from, $to])
            ->whereNull('st.deleted_at')
            ->select('p.name', 'sti.expected_quantity', 'sti.counted_quantity', 'sti.difference', 'sti.cost_price')
            ->get();

        $varianceValue = 0.0;
        $totalCountedVal = 0.0;
        $topVariances = [];

        foreach ($items as $it) {
            $cost = (float) ($it->cost_price ?: 0.0);
            $diff = (float) ($it->difference ?? ($it->counted_quantity - $it->expected_quantity));
            $diffVal = abs($diff * $cost);
            $varianceValue += ($diff * $cost);
            $totalCountedVal += ((float)$it->counted_quantity * $cost);

            if (abs($diff) > 0.001) {
                $topVariances[] = [
                    'label'      => $it->name,
                    'name'       => $it->name,
                    'difference' => $diff,
                    'amount'     => round($diffVal, 2),
                    'value'      => round($diffVal, 2),
                ];
            }
        }

        $variancePct = $totalCountedVal > 0 ? round(abs($varianceValue) / $totalCountedVal * 100, 2) : 0.0;

        usort($topVariances, fn($a, $b) => $b['amount'] <=> $a['amount']);

        $lastCountDate = DB::table('stock_takes')
            ->where('tenant_id', $tenantId)
            ->whereIn('status', ['completed', 'approved'])
            ->whereNull('deleted_at')
            ->max('date');

        $lastCountDays = $lastCountDate ? (float) max(0, Carbon::parse($lastCountDate)->diffInDays(now())) : 0.0;

        return [
            'pending_count'   => $pending,
            'variance_value'  => round($varianceValue, 2),
            'variance_pct'    => $variancePct,
            'last_count_days' => $lastCountDays,
            'top_variances'   => array_slice($topVariances, 0, 10),
        ];
    }

    /**
     * Batches & Expiry metrics.
     */
    public function batchesSummary(string $asOf, int|string $tenantId): array
    {
        $base = DB::table('inventory_batches')
            ->where('inventory_batches.tenant_id', $tenantId)
            ->where('inventory_batches.remaining_qty', '>', 0)
            ->whereNull('inventory_batches.deleted_at');

        $count = (float) (clone $base)->count();
        $qty = (float) ((clone $base)->sum('inventory_batches.remaining_qty') ?? 0.0);

        $asOfDate = Carbon::parse($asOf);
        $plus30 = $asOfDate->copy()->addDays(30)->toDateString();

        $expiring30Query = (clone $base)
            ->whereNotNull('inventory_batches.expiry_date')
            ->whereBetween('inventory_batches.expiry_date', [$asOf, $plus30]);

        $expiring30 = (float) $expiring30Query->count();
        $expiringValue = (float) ($expiring30Query->sum(DB::raw('inventory_batches.remaining_qty * inventory_batches.unit_cost')) ?? 0.0);

        $expiredQuery = (clone $base)
            ->whereNotNull('inventory_batches.expiry_date')
            ->where('inventory_batches.expiry_date', '<', $asOf);

        $expiredValue = (float) ($expiredQuery->sum(DB::raw('inventory_batches.remaining_qty * inventory_batches.unit_cost')) ?? 0.0);

        $expiryList = (clone $base)
            ->join('products as p', function ($j) use ($tenantId) {
                $j->on('inventory_batches.product_id', '=', 'p.id')
                  ->where('p.tenant_id', $tenantId);
            })
            ->whereNotNull('inventory_batches.expiry_date')
            ->where('inventory_batches.expiry_date', '>=', $asOf)
            ->select('inventory_batches.id', 'p.name', 'inventory_batches.batch_type', 'inventory_batches.remaining_qty', 'inventory_batches.expiry_date', DB::raw('(inventory_batches.remaining_qty * inventory_batches.unit_cost) as val'))
            ->orderBy('inventory_batches.expiry_date')
            ->limit(10)
            ->get()
            ->map(fn($r) => [
                'id'       => $r->id,
                'label'    => "{$r->name} (Exp: {$r->expiry_date})",
                'name'     => $r->name,
                'expiry'   => $r->expiry_date,
                'quantity' => (float)$r->remaining_qty,
                'value'    => round((float)$r->val, 2),
                'amount'   => round((float)$r->val, 2),
            ])
            ->toArray();

        return [
            'count'          => $count,
            'qty'            => $qty,
            'expiring_30'    => $expiring30,
            'expiring_value' => round($expiringValue, 2),
            'expired_value'  => round($expiredValue, 2),
            'expiry_list'    => $expiryList,
        ];
    }

    /**
     * Product Serials metrics.
     */
    public function serialsSummary(string $asOf, int|string $tenantId): array
    {
        $base = DB::table('product_serials')
            ->where('tenant_id', $tenantId)
            ->whereNull('deleted_at');

        $count = (float) $base->count();
        $inStock = (float) ((clone $base)->whereIn('status', ['available', 'in_stock'])->count());
        $underWarranty = (float) ((clone $base)->whereIn('status', ['sold', 'active'])->count());
        $returned = (float) ((clone $base)->whereIn('status', ['returned', 'defective'])->count());

        return [
            'count'             => $count,
            'in_stock'          => $inStock,
            'under_warranty'    => $underWarranty,
            'warranty_expiring' => [],
            'returned'          => $returned,
        ];
    }

    /**
     * Product Variants metrics.
     */
    public function variantsSummary(string $asOf, int|string $tenantId): array
    {
        $base = DB::table('product_variants')
            ->where('tenant_id', $tenantId)
            ->where('is_active', 1);

        $count = (float) $base->count();
        $outOfStock = (float) ((clone $base)->where('stock', '<=', 0)->count());

        $topVariants = (clone $base)
            ->select('id', 'variant_name', 'sku', 'stock', 'price')
            ->orderByDesc('stock')
            ->limit(10)
            ->get()
            ->map(fn($r) => [
                'label'  => $r->variant_name ?: $r->sku,
                'value'  => (float)$r->stock,
                'amount' => (float)$r->stock,
            ])
            ->toArray();

        return [
            'count'             => $count,
            'top_variants'      => $topVariants,
            'slow_variants'     => [],
            'out_of_stock'      => $outOfStock,
            'size_colour_mix'   => [],
        ];
    }

    /**
     * Units of Measure summary.
     */
    public function uomSummary(int|string $tenantId): array
    {
        $base = DB::table('units')->where('tenant_id', $tenantId);
        $count = (float) $base->count();
        $conversionCount = (float) ((clone $base)->whereNotNull('operator_value')->where('operator_value', '>', 1)->count());

        return [
            'count'              => $count,
            'conversion_count'   => $conversionCount,
            'sales_by_uom'       => [],
            'missing_conversion' => 0.0,
            'bulk_vs_retail'     => [],
        ];
    }

    /**
     * Composite products / bundles summary.
     */
    public function compositeSummary(string $from, string $to, int|string $tenantId): array
    {
        $base = DB::table('compositions')
            ->where('tenant_id', $tenantId)
            ->where('is_active', 1);

        $count = (float) $base->count();

        // Revenue of composite products
        $compProductIds = (clone $base)->pluck('product_id')->toArray();
        $revenue = 0.0;
        if (!empty($compProductIds)) {
            $revenue = (float) DB::table('sale_items as si')
                ->join('sales as s', 'si.sale_id', '=', 's.id')
                ->where('s.tenant_id', $tenantId)
                ->where('si.tenant_id', $tenantId)
                ->whereIn('si.product_id', $compProductIds)
                ->whereBetween(DB::raw('DATE(COALESCE(s.posted_at, s.created_at))'), [$from, $to])
                ->whereIn('s.status', ['posted', 'completed', 'active'])
                ->whereNull('s.deleted_at')
                ->whereNull('s.original_sale_id')
                ->sum('si.subtotal');
        }

        return [
            'count'              => $count,
            'revenue'            => round($revenue, 2),
            'margin'             => null,
            'top_bundles'        => [],
            'component_shortage' => [],
        ];
    }

    /**
     * Production runs summary.
     */
    public function productionRunsSummary(string $from, string $to, int|string $tenantId): array
    {
        $base = DB::table('production_runs')
            ->where('tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(date, created_at))'), [$from, $to]);

        $count = (float) $base->count();
        $totalCost = (float) ((clone $base)->sum('total_cost') ?? 0.0);
        $outputQty = (float) ((clone $base)->sum('actual_qty') ?? 0.0);
        $inProgress = (float) ((clone $base)->whereIn('status', ['in_progress', 'started', 'pending'])->count());

        $costPerUnit = $outputQty > 0 ? round($totalCost / $outputQty, 2) : 0.0;
        $plannedQty = (float) ((clone $base)->sum('planned_qty') ?? 0.0);
        $yieldPct = $plannedQty > 0 ? round($outputQty / $plannedQty * 100, 2) : 0.0;

        return [
            'run_count'     => $count,
            'total_cost'    => round($totalCost, 2),
            'output_qty'    => $outputQty,
            'cost_per_unit' => $costPerUnit,
            'yield_pct'     => $yieldPct,
            'in_progress'   => $inProgress,
            'output_trend'  => [],
        ];
    }

    /**
     * Suppliers summary metrics.
     */
    public function suppliersSummary(string $from, string $to, int|string $tenantId): array
    {
        $base = DB::table('parties')
            ->where('tenant_id', $tenantId)
            ->where('type', 'supplier')
            ->whereNull('deleted_at');

        $count = (float) $base->count();

        // Active suppliers in period: had a purchase or payment in the window
        $activeSuppliers = DB::table('purchases')
            ->where('tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(purchase_date, created_at))'), [$from, $to])
            ->whereNotNull('party_id')
            ->distinct('party_id')
            ->count('party_id');

        $spendTotal = (float) (DB::table('purchases')
            ->where('tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(purchase_date, created_at))'), [$from, $to])
            ->sum('total') ?? 0.0);

        // Top suppliers ranked by purchase spend
        $top = DB::table('purchases as p')
            ->leftJoin('parties as pt', 'p.party_id', '=', 'pt.id')
            ->where('p.tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(p.purchase_date, p.created_at))'), [$from, $to])
            ->selectRaw('COALESCE(pt.name, "Supplier") as name, SUM(p.total) as total')
            ->groupBy('name')
            ->orderByDesc('total')
            ->limit(10)
            ->get()
            ->map(fn($r) => [
                'label'  => $r->name,
                'name'   => $r->name,
                'amount' => round((float)$r->total, 2),
                'value'  => round((float)$r->total, 2),
            ])
            ->toArray();

        $top3Spend = array_sum(array_slice(array_column($top, 'amount'), 0, 3));
        $concentration = $spendTotal > 0 ? round($top3Spend / $spendTotal * 100, 2) : 0.0;

        $newSuppliers = (float) ((clone $base)
            ->whereBetween(DB::raw('DATE(created_at)'), [$from, $to])
            ->count());

        return [
            'count'         => $count,
            'active'        => (float) $activeSuppliers,
            'spend_total'   => $spendTotal,
            'top_suppliers' => $top,
            'concentration' => $concentration,
            'new'           => $newSuppliers,
        ];
    }

    /**
     * Products catalog summary.
     */
    public function productsSummary(string $from, string $to, int|string $tenantId): array
    {
        $base = DB::table('products')
            ->where('tenant_id', $tenantId)
            ->whereNull('deleted_at');

        $count = (float) (clone $base)->count();
        $active = (float) ((clone $base)->where('is_active', 1)->count());

        $byCategory = DB::table('products as p')
            ->leftJoin('categories as c', 'p.category_id', '=', 'c.id')
            ->where('p.tenant_id', $tenantId)
            ->whereNull('p.deleted_at')
            ->selectRaw('COALESCE(c.name, "Uncategorized") as cat_name, COUNT(*) as cnt')
            ->groupBy('cat_name')
            ->orderByDesc('cnt')
            ->get();

        $catBreakdown = [];
        foreach ($byCategory as $bc) {
            $catBreakdown[$bc->cat_name] = (float) $bc->cnt;
        }

        $catalogueVal = (float) ((clone $base)->sum(DB::raw('price * COALESCE(quantity, 0)')) ?? 0.0);

        // Margin calculations
        $productsWithCost = (clone $base)->where('price', '>', 0)->where('cost_price', '>', 0)->get();
        $marginSum = 0.0;
        $marginCount = 0;
        $marginRows = [];

        foreach ($productsWithCost as $p) {
            $pr = (float) $p->price;
            $cp = (float) $p->cost_price;
            $m = round(($pr - $cp) / $pr * 100, 2);
            $marginSum += $m;
            $marginCount++;
            $marginRows[] = [
                'id'     => $p->id,
                'name'   => $p->name,
                'label'  => $p->name,
                'margin' => $m,
                'value'  => $m,
                'amount' => $m,
            ];
        }

        $avgMargin = $marginCount > 0 ? round($marginSum / $marginCount, 2) : 0.0;

        usort($marginRows, fn($a, $b) => $b['margin'] <=> $a['margin']);
        $topMargin = array_slice($marginRows, 0, 10);
        $lowestMargin = array_slice(array_reverse($marginRows), 0, 10);

        // Never sold products: products not in sale_items
        $soldIds = DB::table('sale_items as si')
            ->join('sales as s', 'si.sale_id', '=', 's.id')
            ->where('s.tenant_id', $tenantId)
            ->whereNull('s.deleted_at')
            ->pluck('si.product_id')
            ->unique()
            ->toArray();

        $neverSold = (clone $base)
            ->whereNotIn('id', $soldIds)
            ->select('id', 'name', 'sku', 'price')
            ->limit(10)
            ->get()
            ->map(fn($r) => [
                'id'     => $r->id,
                'name'   => $r->name,
                'label'  => $r->name,
                'value'  => (float)$r->price,
                'amount' => (float)$r->price,
            ])
            ->toArray();

        $missingCost = (float) ((clone $base)->where(function ($q) {
            $q->whereNull('cost_price')->orWhere('cost_price', '<=', 0);
        })->count());

        $newThisPeriod = (float) ((clone $base)
            ->whereBetween(DB::raw('DATE(created_at)'), [$from, $to])
            ->count());

        return [
            'count'           => $count,
            'active_count'    => $active,
            'by_category'     => $catBreakdown,
            'catalogue_value' => round($catalogueVal, 2),
            'avg_margin'      => $avgMargin,
            'top_margin'      => $topMargin,
            'lowest_margin'   => $lowestMargin,
            'never_sold'      => $neverSold,
            'missing_cost'    => $missingCost,
            'new_this_period' => $newThisPeriod,
        ];
    }
}
