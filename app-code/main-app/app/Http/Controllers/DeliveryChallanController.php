<?php

namespace App\Http\Controllers;

use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\DB;

class DeliveryChallanController extends Controller
{
    /** A challan that was actually dispatched (has a number, a warehouse, a date). */
    public function print(string $challan)
    {
        $tenantId = app('current.tenant')->id;
        $c = DB::table('delivery_challans')->where('tenant_id', $tenantId)->where('id', $challan)->firstOrFail();

        $lines = DB::table('delivery_challan_items as i')
            ->join('products as p', 'p.id', '=', 'i.product_id')
            ->where('i.tenant_id', $tenantId)->where('i.delivery_challan_id', $c->id)
            ->select('p.name', 'p.sku', 'p.base_unit', 'i.qty')->get();

        return $this->render($tenantId, $c->sale_id, $c->warehouse_id, $c->challan_number, $c->dispatched_on, $lines, $c);
    }

    /** "Preview Delivery Challan" on any invoice: the whole invoice, from the invoice's warehouse. */
    public function previewForSale(string $saleId)
    {
        $tenantId = app('current.tenant')->id;
        $sale = DB::table('sales')->where('tenant_id', $tenantId)->where('id', $saleId)->firstOrFail();

        $lines = DB::table('sale_items as i')
            ->join('products as p', 'p.id', '=', 'i.product_id')
            ->where('i.tenant_id', $tenantId)->where('i.sale_id', $sale->id)
            ->select('p.name', 'p.sku', 'p.base_unit', 'i.quantity as qty')->get();

        return $this->render($tenantId, $sale->id, $sale->warehouse_id, 'PREVIEW-' . $sale->reference_number, now()->toDateString(), $lines, null);
    }

    private function render($tenantId, $saleId, $warehouseId, $number, $date, $lines, $challan)
    {
        $sale = DB::table('sales')->where('tenant_id', $tenantId)->where('id', $saleId)->first();
        $customer = $sale && $sale->customer_id
            ? DB::table('parties')->where('tenant_id', $tenantId)->where('id', $sale->customer_id)->first()
            : null;
        $warehouse = $warehouseId
            ? DB::table('warehouses')->where('tenant_id', $tenantId)->where('id', $warehouseId)->first()
            : null;

        $pdf = Pdf::loadView('pdf.delivery-challan', [
            'number'    => $number,
            'date'      => $date,
            'sale'      => $sale,
            'customer'  => $customer,
            'warehouse' => $warehouse,
            'lines'     => $lines,
            'challan'   => $challan,
            'settings'  => \App\Models\Setting::all()->pluck('value', 'key'),
        ])->setOptions(['isRemoteEnabled' => false]);

        return $pdf->stream('delivery-challan-' . preg_replace('/[^A-Za-z0-9._-]/', '-', (string) $number) . '.pdf');
    }
}
