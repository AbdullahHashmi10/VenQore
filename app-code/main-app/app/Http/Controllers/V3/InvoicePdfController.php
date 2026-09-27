<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\DB;

class InvoicePdfController extends Controller
{
    public function show(string $saleId)
    {
        return $this->renderPdf($saleId, 'sale');
    }

    public function showReturn(string $returnId)
    {
        return $this->renderPdf($returnId, 'return');
    }

    private function renderPdf(string $docId, string $expectedType = 'sale')
    {
        $sale = DB::table('sales as s')->where('s.tenant_id', app('current.tenant')->id)
            ->leftJoin('parties as p', 's.party_id', '=', 'p.id')
            ->leftJoin('warehouses as w', 's.warehouse_id', '=', 'w.id')
            ->where('s.id', $docId)
            ->select(
                's.*',
                'p.name as customer_name',
                'p.address as customer_address',
                'p.phone as customer_phone',
                DB::raw("'' as customer_tax_number"),
                'w.name as warehouse_name'
            )
            ->firstOrFail();

        $isActualReturn = ($sale->status === 'returned')
            || str_starts_with((string)$sale->reference_number, 'RET-');

        if ($expectedType === 'return') {
            if (!$isActualReturn) {
                abort(404, 'Return document not found or transaction is not a return.');
            }
            $isReturn = true;
        } else {
            if ($isActualReturn) {
                return redirect()->route('store.v3.returns.pdf', [
                    'store_slug' => app('current.tenant')->slug,
                    'returnId'   => $sale->id,
                ]);
            }
            $isReturn = false;
        }

        $docTitle = $isReturn ? 'CREDIT NOTE / SALE RETURN' : 'INVOICE';
        $docPrefix = $isReturn ? 'credit-note' : 'invoice';
        $docRef = $sale->reference_number ?: ($isReturn ? "RET-{$sale->id}" : "INV-{$sale->id}");

        $items = DB::table('sale_items as si')->where('si.tenant_id', app('current.tenant')->id)
            ->join('products as pr', 'si.product_id', '=', 'pr.id')
            ->where('si.sale_id', $docId)
            ->select(
                'pr.name as product_name',
                'pr.sku',
                'pr.cost_price',
                'si.quantity',
                'pr.base_unit as sale_uom',
                'si.unit_price',
                'si.tax_rate',
                'si.tax_amount',
                'si.line_total',
                'si.free_quantity',
                'si.discount_amount',
                'si.gross_amount'
            )
            ->get();

        $primaryColor = \App\Models\Setting::where('tenant_id', app('current.tenant')->id)->where('key', 'invoice_primary_color')->value('value') ?? ($isReturn ? '#dc2626' : '#2563eb');
        $theme = \App\Models\Setting::where('tenant_id', app('current.tenant')->id)->where('key', 'invoice_theme')->value('value') ?? 'classic';
        $showMargin = !$isReturn && (\App\Models\Setting::where('tenant_id', app('current.tenant')->id)->where('key', 'show_margin_on_invoice')->value('value') === '1');

        $pdf = Pdf::loadView('v3.invoices.pdf', [
            'sale'         => $sale,
            'items'        => $items,
            'primaryColor' => $primaryColor,
            'theme'        => $theme,
            'showMargin'   => $showMargin,
            'isReturn'     => $isReturn,
            'docTitle'     => $docTitle,
            'docRef'       => $docRef,
        ])->setPaper('a4', 'portrait');

        return $pdf->download("{$docPrefix}-{$docRef}.pdf");
    }
}
