<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\Party;
use App\Models\Invoice;
use App\Models\ProductionRun;

class SearchController extends Controller
{
    public function search(Request $request)
    {
        $query = $request->input('query');
        $storeSlug = $request->route('store_slug');
        $tenantId = app('current.tenant')->id;

        if (!$query || strlen($query) < 2) {
            return response()->json([]);
        }

        $results = [];

        // 1. Natural Language Stock Check
        if (preg_match('/(how many|how much|stock|left|qty|quantity)/i', $query)) {
            $cleanName = preg_replace('/(how many|how much|stock|is|there|left|of|qty|quantity|do|we|have|\?)/i', '', $query);
            $cleanName = trim($cleanName);

            if (!empty($cleanName)) {
                $stockProduct = Product::where('tenant_id', $tenantId)
                    ->where('name', 'like', "%{$cleanName}%")
                    ->first();
                if ($stockProduct) {
                    $results[] = [
                        'type' => 'Answer',
                        'title' => "Stock Level: {$stockProduct->name}",
                        'subtitle' => "{$stockProduct->stock_quantity} {$stockProduct->unit} remaining in stock.",
                        'url' => route('store.inventory.stock', ['store_slug' => $storeSlug, 'search' => $stockProduct->sku]),
                        'icon' => 'Box'
                    ];
                }
            }
        }

        // 2. Standard Search (Products)
        $products = Product::where('tenant_id', $tenantId)
            ->where(function($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('sku', 'like', "%{$query}%");
            })
            ->limit(5)
            ->get()
            ->map(function ($product) use ($storeSlug) {
                return [
                    'type' => 'Product',
                    'title' => $product->name,
                    'subtitle' => $product->sku,
                    'url' => route('store.inventory.stock', ['store_slug' => $storeSlug, 'search' => $product->sku])
                ];
            });

        // 3. Standard Search (Parties)
        $parties = Party::where('tenant_id', $tenantId)
            ->where(function($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('phone', 'like', "%{$query}%");
            })
            ->limit(5)
            ->get()
            ->map(function ($party) use ($storeSlug) {
                return [
                    'type' => 'Party',
                    'title' => $party->name,
                    'subtitle' => $party->phone,
                    'url' => route('store.parties.ledger', ['store_slug' => $storeSlug, 'party' => $party->id])
                ];
            });

        // 4. Standard Search (Invoices)
        $invoices = Invoice::where('tenant_id', $tenantId)
            ->where('invoice_number', 'like', "%{$query}%")
            ->limit(5)
            ->get()
            ->map(function ($invoice) use ($storeSlug) {
                return [
                    'type' => 'Invoice',
                    'title' => $invoice->invoice_number,
                    'subtitle' => $invoice->type . ' - ' . $invoice->total_amount,
                    'url' => route('store.sales.index', ['store_slug' => $storeSlug, 'search' => $invoice->invoice_number])
                ];
            });

        return response()->json(array_merge($results, $products->toArray(), $parties->toArray(), $invoices->toArray()));
    }
}
