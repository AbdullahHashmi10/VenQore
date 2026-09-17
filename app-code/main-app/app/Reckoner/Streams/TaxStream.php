<?php

namespace App\Reckoner\Streams;

use Illuminate\Support\Facades\DB;

/**
 * TaxStream: Pure tenant-explicit reader for tax lines and rates.
 * Tables: sale_items, sales, products, tax_rates
 */
class TaxStream
{
    /**
     * Tax breakdown by rate.
     */
    public function byRate(string $from, string $to, int|string $tenantId): array
    {
        $rows = DB::table('sale_items as si')
            ->join('sales as s', 'si.sale_id', '=', 's.id')
            ->where('s.tenant_id', $tenantId)
            ->where('si.tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(s.posted_at, s.created_at))'), [$from, $to])
            ->whereIn('s.status', ['posted', 'completed', 'active'])
            ->whereNull('s.deleted_at')
            ->selectRaw('COALESCE(si.tax_rate, 0) as rate, SUM(si.tax_amount) as total_tax')
            ->groupBy('rate')
            ->get();

        $result = [];
        foreach ($rows as $r) {
            $label = ((float) $r->rate) . ' %';
            $result[$label] = round((float) $r->total_tax, 2);
        }

        return $result;
    }

    /**
     * Taxable vs exempt sales split.
     */
    public function taxableVsExempt(string $from, string $to, int|string $tenantId): array
    {
        $sales = DB::table('sales as s')
            ->where('s.tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(s.posted_at, s.created_at))'), [$from, $to])
            ->whereIn('s.status', ['posted', 'completed', 'active'])
            ->whereNull('s.deleted_at')
            ->select('s.id', 's.total_tax', 's.net_sales', 's.subtotal', 's.total')
            ->get();

        $taxable = 0.0;
        $exempt = 0.0;

        foreach ($sales as $s) {
            $amt = (float) ($s->net_sales ?? $s->subtotal ?? $s->total ?? 0.0);
            if ((float) ($s->total_tax ?? 0) > 0.0) {
                $taxable += $amt;
            } else {
                $exempt += $amt;
            }
        }

        return [
            'Taxable' => round($taxable, 2),
            'Exempt'  => round($exempt, 2),
        ];
    }
}
