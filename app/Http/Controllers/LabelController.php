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
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'settings' => 'required|array',
            'settings.width' => 'required|numeric',
            'settings.height' => 'required|numeric',
            'settings.show_price' => 'boolean',
            'settings.show_name' => 'boolean',
            'settings.show_barcode' => 'boolean',
        ]);

        $products = Product::with('barcodes')->whereIn('id', array_column($validated['items'], 'id'))->get();

        // Map quantities to products
        $printItems = [];
        foreach ($validated['items'] as $item) {
            $product = $products->find($item['id']);
            if ($product) {
                $printItems[] = [
                    'product' => $product,
                    'quantity' => $item['quantity'],
                    'barcode' => $product->barcodes->first()?->barcode ?? $product->sku
                ];
            }
        }

        $pdf = Pdf::loadView('pdf.labels', [
            'items' => $printItems,
            'settings' => $validated['settings']
        ]);

        // A4 paper for now, user can cut or we can add custom paper size logic later
        $pdf->setPaper('a4', 'portrait');

        return $pdf->stream('labels.pdf');
    }
}
