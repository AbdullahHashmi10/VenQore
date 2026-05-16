<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Product;
use App\Helpers\SettingsHelper;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class PosController extends Controller
{
    public function index(Request $request)
    {
        // ── Phase 3.1: The POS Timebomb Fix ───────────────────────────────
        // We no longer load ALL products here. Loading 1,942 products × 5
        // eager-loaded relations on every page open was the single biggest
        // memory/CPU bottleneck in the application.
        //
        // Products are now fetched by the React POS via:
        //   GET /api/pos/featured      → initial 50 products for the grid
        //   GET /api/pos/search?q=     → debounced search (300ms)
        //   GET /api/pos/barcode/{code} → exact barcode scanner lookup
        // ──────────────────────────────────────────────────────────────────

        // Only load the recalled sale if requested (inline bill recall)
        $recalledSale = null;
        if ($request->has('recall')) {
            $recalledSale = \App\Models\Sale::with([
                'items.product.category',
                'items.product.stocks',
                'items.productVariant',
                'customer'
            ])->find($request->recall);

            // Fix image paths in recalled items
            if ($recalledSale) {
                $recalledSale->items->transform(function ($item) {
                    if ($item->product && $item->product->image_path) {
                        $item->product->image_path = Storage::url($item->product->image_path);
                    }
                    return $item;
                });
            }
        }

        // Bank accounts: small, stable, OK to load server-side
        $bankAccounts = \App\Models\Account::where('type', 'asset')
            ->where(function ($q) {
                $q->where('name', 'like', '%bank%')
                  ->orWhere('code', 'like', '101%');
            })
            ->get(['id', 'name', 'code']);

        return Inertia::render('Pos', [
            // ⬇ No more products prop — React fetches on mount
            'recalledSale' => $recalledSale,
            'bankAccounts' => $bankAccounts,
            'warehouses'   => \App\Models\Warehouse::all(['id', 'name', 'is_default']),
        ]);
    }


    public function getCategories()
    {
        $categories = \App\Models\Category::withCount('products')
            ->has('products')
            ->get();

        // Custom Sort: Phones first, then alphabetically
        $sorted = $categories->sortBy(function ($category) {
            if ($category->name === 'Phones') {
                return 0; // Top priority
            }
            return 1 . $category->name; // Alphabetical for others
        })->values();

        return response()->json($sorted);
    }

    public function store(Request $request, \App\Services\InventoryService $inventoryService)
    {
        $request->validate([
            'cart' => 'required|array',
            'cart.*.id' => 'required|exists:products,id',
            'cart.*.quantity' => 'required|numeric|min:0.0001',
        ]);

        try {
            $total = $inventoryService->processSale($request->cart);
            return response()->json(['success' => true, 'total' => $total]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function checkout(Request $request)
    {
        // FIX-15: This legacy checkout route creates Invoice records that bypass V3 accounting entirely.
        // It has been disabled. All POS sales must go through SaleController::store().
        return response()->json([
            'success' => false,
            'message' => 'This endpoint is deprecated. Use /sales endpoint instead.'
        ], 410);
    }

    private function recordPayment($invoice, $amount, $method)
    {
        $payment = \App\Models\Payment::create([
            'party_id' => $invoice->party_id,
            'amount' => $amount,
            'date' => now()->toDateString(),
            'type' => 'in',
            'method' => $method,
        ]);

        \App\Models\PaymentAllocation::create([
            'payment_id' => $payment->id,
            'invoice_id' => $invoice->id,
            'amount' => $amount,
        ]);
    }
}
