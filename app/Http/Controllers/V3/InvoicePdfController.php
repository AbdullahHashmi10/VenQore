<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\DB;

class InvoicePdfController extends Controller
{
    public function show(string $saleId)
    {
        $sale = DB::table('sales as s')->where('s.tenant_id', app('current.tenant')->id)
            ->join('parties as p', 's.party_id', '=', 'p.id')
            ->join('warehouses as w', 's.warehouse_id', '=', 'w.id')
            ->where('s.id', $saleId)
            ->select(
                's.*',
                'p.name as customer_name',
                'p.address as customer_address',
                'p.phone as customer_phone',
                'p.tax_number as customer_tax_number',
                'w.name as warehouse_name'
            )
            ->firstOrFail();

        $items = DB::table('sale_items as si')->where('si.tenant_id', app('current.tenant')->id)
            ->join('products as pr', 'si.product_id', '=', 'pr.id')
            ->where('si.sale_id', $saleId)
            ->select(
                'pr.name as product_name',
                'pr.sku',
                'si.quantity',
                'pr.base_unit as sale_uom',
                'si.unit_price',
                'si.tax_rate',
                'si.line_total',
                'si.free_quantity',
                'si.discount_amount',
                'si.gross_amount'
            )
            ->get();

        $pdf = Pdf::loadView('v3.invoices.pdf', [
            'sale'  => $sale,
            'items' => $items,
        ])->setPaper('a4', 'portrait');

        return $pdf->download("invoice-{$sale->reference_number}.pdf");
    }
}
