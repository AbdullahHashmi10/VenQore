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

        if (!$query || strlen($query) < 2) {
            return response()->json([]);
        }

        $results = [];

        // 1. Natural Language Stock Check
        // Detects: "how much sugar", "stock of sugar", "sugar stock", "how many sugar left"
        if (preg_match('/(how many|how much|stock|left|qty|quantity)/i', $query)) {
            // Remove common "question" words to isolate the product name
            $cleanName = preg_replace('/(how many|how much|stock|is|there|left|of|qty|quantity|do|we|have|\?)/i', '', $query);
            $cleanName = trim($cleanName);

            if (!empty($cleanName)) {
                $stockProduct = Product::where('name', 'like', "%{$cleanName}%")->first();
                if ($stockProduct) {
                    $results[] = [
                        'type' => 'Answer',
                        'title' => "Stock Level: {$stockProduct->name}",
                        'subtitle' => "{$stockProduct->stock_quantity} {$stockProduct->unit} remaining in stock.", // Assuming stock_quantity exists
                        'url' => route('inventory.stock', ['search' => $stockProduct->code]),
                        'icon' => 'Box' // Helper for frontend
                    ];
                }
            }
        }

        // 2. Standard Search (Products)
        $products = Product::where('name', 'like', "%{$query}%")
            ->orWhere('code', 'like', "%{$query}%")
            ->limit(5)
            ->get()
            ->map(function ($product) {
                return [
                    'type' => 'Product',
                    'title' => $product->name,
                    'subtitle' => $product->code,
                    'url' => route('inventory.stock', ['search' => $product->code])
                ];
            });

        // 3. Standard Search (Parties)
        $parties = Party::where('name', 'like', "%{$query}%")
            ->orWhere('phone', 'like', "%{$query}%")
            ->limit(5)
            ->get()
            ->map(function ($party) {
                return [
                    'type' => 'Party',
                    'title' => $party->name,
                    'subtitle' => $party->phone,
                    'url' => route('parties.ledger', $party->id)
                ];
            });

        // 4. Standard Search (Invoices)
        $invoices = Invoice::where('invoice_number', 'like', "%{$query}%")
            ->limit(5)
            ->get()
            ->map(function ($invoice) {
                return [
                    'type' => 'Invoice',
                    'title' => $invoice->invoice_number,
                    'subtitle' => $invoice->type . ' - ' . $invoice->total_amount,
                    'url' => route('sales.show', $invoice->id)
                ];
            });

        return response()->json(array_merge($results, $products->toArray(), $parties->toArray(), $invoices->toArray()));
    }
}
