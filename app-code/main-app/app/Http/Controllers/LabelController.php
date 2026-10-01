<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class LabelController extends Controller
{
    public function index()
    {
        return Inertia::render('Labels/LabelPrinter', [
            'products' => Product::with('barcodes')->select('id', 'name', 'sku', 'price')->get()
        ]);
    }

    public function print(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1|max:100',
            'items.*.id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1|max:100',
            'settings' => 'required|array',
            'settings.width' => 'required|numeric|min:10|max:190',
            'settings.height' => 'required|numeric|min:10|max:277',
            'settings.show_price' => 'boolean',
            'settings.show_name' => 'boolean',
            'settings.show_barcode' => 'boolean',
            'settings.show_qrcode' => 'boolean',
        ]);

        $products = Product::with('barcodes')->whereIn('id', array_column($validated['items'], 'id'))->get();

        abort_if($products->count() !== count(array_unique(array_column($validated['items'], 'id'))), 422, 'One or more products are unavailable in this store.');
        abort_if(array_sum(array_column($validated['items'], 'quantity')) > 1000, 422, 'Print at most 1000 labels at a time.');

        // Map quantities to products
        $printItems = [];
        foreach ($validated['items'] as $item) {
            $product = $products->find($item['id']);
            if ($product) {
                $productUrl = url("/s/" . app('current.tenant')->slug . "/store/products/" . $product->id);
                $printItems[] = [
                    'product' => $product,
                    'quantity' => $item['quantity'],
                    'barcode' => $product->barcodes->first()?->barcode ?? $product->sku,
                    'qrcode_url' => $productUrl,
                ];
            }
        }

        $pdf = Pdf::loadView('pdf.labels', [
            'items' => $printItems,
            'settings' => $validated['settings']
        ])->setOptions(['isRemoteEnabled' => false]);

        // A4 paper for now, user can cut or we can add custom paper size logic later
        $pdf->setPaper('a4', 'portrait');

        return $pdf->stream('labels.pdf');
    }
}
