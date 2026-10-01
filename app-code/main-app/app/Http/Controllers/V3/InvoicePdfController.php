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
            ->leftJoin('parties as p', fn ($join) => $join->on('s.party_id', '=', 'p.id')->on('s.tenant_id', '=', 'p.tenant_id'))
            ->leftJoin('warehouses as w', fn ($join) => $join->on('s.warehouse_id', '=', 'w.id')->on('s.tenant_id', '=', 'w.tenant_id'))
            ->where('s.id', $docId)->whereNull('s.deleted_at')
            ->select(
                's.*',
                'p.name as customer_name',
                'p.address as customer_address',
                'p.phone as customer_phone',
                DB::raw("'' as customer_tax_number"),
                'w.name as warehouse_name'
            )
            ->firstOrFail();

        abort_if(in_array($sale->status, ['draft', 'void', 'voided', 'cancelled'], true), 422, 'This document has not been issued.');

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
            ->leftJoin('products as pr', function ($join) {
                $join->on('si.product_id', '=', 'pr.id')->on('pr.tenant_id', '=', 'si.tenant_id');
            })
            ->where('si.sale_id', $docId)->whereNull('si.deleted_at')
            ->select(
                DB::raw("COALESCE(pr.name, 'Item') as product_name"),
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
        // This endpoint supplies customer downloads and WhatsApp attachments.
        $showMargin = false;

        $settings = \App\Models\Setting::where('tenant_id', app('current.tenant')->id)->pluck('value', 'key');
        $paid = (float) DB::table('payments')->where('tenant_id', app('current.tenant')->id)->where('sale_id', $sale->id)->sum('amount');
        $pdf = Pdf::loadView('v3.invoices.pdf', [
            'sale'         => $sale,
            'settings'     => $settings,
            'paid'         => $paid,
            'items'        => $items,
            'primaryColor' => $primaryColor,
            'theme'        => $theme,
            'showMargin'   => $showMargin,
            'isReturn'     => $isReturn,
            'docTitle'     => $docTitle,
            'docRef'       => $docRef,
        ])->setPaper('a4', 'portrait');

        $filename = preg_replace('/[^A-Za-z0-9._-]/', '-', $docRef);
        return $pdf->download("{$docPrefix}-{$filename}.pdf");
    }
}
