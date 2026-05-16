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

    /**
     * Complete a POS sale — delegates to V3 SaleController logic.
     * Route: POST /pos/sale  (name: pos.sale)
     */
    public function completeSale(Request $request)
    {
        $request->validate([
            'items'          => 'required|array|min:1',
            'items.*.id'     => 'required|integer|exists:products,id',
            'items.*.qty'    => 'required|numeric|min:0.0001',
            'items.*.price'  => 'required|numeric|min:0',
            'payment_method' => 'required|string|in:cash,card,bank,credit,mixed',
            'tendered'       => 'nullable|numeric|min:0',
        ]);

        // Delegate to the canonical V3 SaleController to ensure accounting entries
        // are created correctly and tenant_id is always set.
        /** @var \App\Http\Controllers\V3\SaleController $v3 */
        $v3 = app(\App\Http\Controllers\V3\SaleController::class);

        // Normalise payload to the format V3 expects
        $payload = array_merge($request->all(), [
            'source' => 'pos',
        ]);

        return $v3->store(new \Illuminate\Http\Request($payload));
    }

    /**
     * Open a POS cash-drawer session.
     * Route: POST /pos/open-session  (name: pos.open)
     */
    public function openSession(Request $request)
    {
        $request->validate([
            'opening_cash' => 'required|numeric|min:0',
            'warehouse_id' => 'nullable|integer|exists:warehouses,id',
        ]);

        $tenantId = tenant('id');
        $userId   = auth()->id();

        // Check if a session is already open for this user today
        $existing = \App\Models\StaffDailySummary::where('tenant_id', $tenantId)
            ->where('user_id', $userId)
            ->whereDate('date', today())
            ->whereNull('closed_at')
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'A POS session is already open for today.',
                'session' => $existing,
            ], 409);
        }

        $session = \App\Models\StaffDailySummary::create([
            'tenant_id'    => $tenantId,
            'user_id'      => $userId,
            'date'         => today(),
            'opening_cash' => $request->opening_cash,
            'warehouse_id' => $request->warehouse_id,
            'opened_at'    => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Session opened.',
            'session' => $session,
        ]);
    }

    /**
     * Close the active POS session.
     * Route: POST /pos/close-session  (name: pos.close)
     */
    public function closeSession(Request $request)
    {
        $request->validate([
            'closing_cash' => 'required|numeric|min:0',
            'notes'        => 'nullable|string|max:500',
        ]);

        $tenantId = tenant('id');
        $userId   = auth()->id();

        $session = \App\Models\StaffDailySummary::where('tenant_id', $tenantId)
            ->where('user_id', $userId)
            ->whereDate('date', today())
            ->whereNull('closed_at')
            ->first();

        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'No open POS session found for today.',
            ], 404);
        }

        $session->update([
            'closing_cash' => $request->closing_cash,
            'cash_variance' => $request->closing_cash - ($session->opening_cash ?? 0),
            'notes'        => $request->notes,
            'closed_at'    => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Session closed.',
            'session' => $session->fresh(),
        ]);
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
