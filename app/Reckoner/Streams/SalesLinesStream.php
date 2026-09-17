<?php

namespace App\Reckoner\Streams;

use Illuminate\Support\Facades\DB;

/**
 * SalesLinesStream: Pure tenant-explicit reader for sale_items table.
 * Tables: sale_items, sales, products
 */
class SalesLinesStream
{
    /**
     * Top returned products ranked by return count / quantity.
     */
    public function topReturnedProducts(string $from, string $to, int|string $tenantId, int $limit = 10): array
    {
        $rows = DB::table('sale_items as si')
            ->join('sales as s', 'si.sale_id', '=', 's.id')
            ->leftJoin('products as p', 'si.product_id', '=', 'p.id')
            ->where('s.tenant_id', $tenantId)
            ->where('si.tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(s.posted_at, s.created_at))'), [$from, $to])
            ->whereNotNull('s.original_sale_id')
            ->whereNull('si.deleted_at')
            ->select(
                'si.product_id',
                DB::raw('COALESCE(p.name, CONCAT("Product #", si.product_id)) as product_name'),
                DB::raw('SUM(si.quantity) as qty'),
                DB::raw('SUM(si.line_total) as amount')
            )
            ->groupBy('si.product_id', 'product_name')
            ->orderByDesc('qty')
            ->limit($limit)
            ->get();

        $items = [];
        foreach ($rows as $r) {
            $items[] = [
                'name'   => $r->product_name,
                'qty'    => (float) $r->qty,
                'amount' => round((float) $r->amount, 2),
                'value'  => round((float) $r->amount, 2),
            ];
        }

        return $items;
    }

    /**
     * Average realized price per product: net_amount ÷ quantity.
     */
    public function avgRealizedPrice(string $from, string $to, int|string $tenantId): array
    {
        $rows = DB::table('sale_items as si')
            ->join('sales as s', 'si.sale_id', '=', 's.id')
            ->leftJoin('products as p', 'si.product_id', '=', 'p.id')
            ->where('s.tenant_id', $tenantId)
            ->where('si.tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(s.posted_at, s.created_at))'), [$from, $to])
            ->whereIn('s.status', ['posted', 'completed', 'active'])
            ->whereNull('s.deleted_at')
            ->whereNull('s.original_sale_id')
            ->whereNull('si.deleted_at')
            ->select(
                'si.product_id',
                DB::raw('COALESCE(p.name, CONCAT("Product #", si.product_id)) as product_name'),
                DB::raw('SUM(si.net_amount) as total_net'),
                DB::raw('SUM(si.quantity) as total_qty')
            )
            ->groupBy('si.product_id', 'product_name')
            ->having('total_qty', '>', 0)
            ->get();

        $items = [];
        $totalRev = 0.0;
        $totalQty = 0.0;

        foreach ($rows as $r) {
            $rev = (float) $r->total_net;
            $qty = (float) $r->total_qty;
            $totalRev += $rev;
            $totalQty += $qty;
            $avg = $qty > 0 ? round($rev / $qty, 2) : 0.0;
            $items[] = [
                'name'           => $r->product_name,
                'realized_price' => $avg,
                'amount'         => $avg,
                'qty'            => $qty,
            ];
        }

        $headline = $totalQty > 0 ? round($totalRev / $totalQty, 2) : 0.0;

        return [
            'headline' => $headline,
            'items'    => $items,
        ];
    }

    /**
     * Discount vs list price: sum(line discounts) ÷ sum(gross_amount) * 100.
     */
    public function discountVsList(string $from, string $to, int|string $tenantId): array
    {
        $totals = DB::table('sale_items as si')
            ->join('sales as s', 'si.sale_id', '=', 's.id')
            ->where('s.tenant_id', $tenantId)
            ->where('si.tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(s.posted_at, s.created_at))'), [$from, $to])
            ->whereIn('s.status', ['posted', 'completed', 'active'])
            ->whereNull('s.deleted_at')
            ->whereNull('s.original_sale_id')
            ->whereNull('si.deleted_at')
            ->selectRaw('SUM(si.discount_amount) as total_discount, SUM(si.gross_amount) as total_gross')
            ->first();

        $discount = (float) ($totals?->total_discount ?? 0.0);
        $gross = (float) ($totals?->total_gross ?? 0.0);

        return [
            'numerator'   => $discount,
            'denominator' => $gross,
        ];
    }
}
