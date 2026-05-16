<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\Party;
use App\Models\Transaction;
use App\Services\InventoryService;
use App\Services\PlanGate;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class WooCommerceController extends Controller
{
    protected $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    public function index()
    {
        // ── Phase 4.3: WooCommerce Feature Gate ────────────────────────────
        if (app()->bound('current.tenant')) {
            PlanGate::enforce('woocommerce');
        }

        return Inertia::render('WooCommerce/WooCommerce', [
            'sync_status' => [
                'connected' => false,
                'last_sync' => null
            ],
            'stats' => []
        ]);
    }

    public function webhook(Request $request)
    {
        // ── Phase 4.3: WooCommerce Feature Gate (API webhook) ───────────────
        if (app()->bound('current.tenant')) {
            PlanGate::enforce('woocommerce');
        }
        // Verify Webhook Secret (Add your logic here)
        // $signature = $request->header('x-wc-webhook-signature');

        $payload = $request->all();
        Log::info('WooCommerce Webhook Received', ['id' => $payload['id'] ?? 'unknown']);

        if (!isset($payload['line_items'])) {
            return response()->json(['message' => 'No line items found'], 200);
        }

        // Create or Get Web Customer
        $party = Party::firstOrCreate(
            ['name' => 'Web Customer'],
            ['type' => 'customer']
        );

        $itemsToProcess = [];

        foreach ($payload['line_items'] as $item) {
            $sku = $item['sku'];
            $quantity = $item['quantity'];

            $product = Product::where('sku', $sku)->first();

            if ($product) {
                $itemsToProcess[] = [
                    'id' => $product->id,
                    'quantity' => $quantity
                ];
            } else {
                Log::warning("Product with SKU $sku not found in VenQore POS");
            }
        }

        if (!empty($itemsToProcess)) {
            try {
                $total = $this->inventoryService->processSale($itemsToProcess, $party->id);

                // Record Transaction
                Transaction::create([
                    'party_id' => $party->id,
                    'invoice_id' => 'WC-' . $payload['id'],
                    'amount' => $total,
                    'type' => 'debit',
                    'running_balance' => $party->current_balance + $total, // Simplified
                ]);

                // Update party balance - [V3 SWAP] Removed: Redundant decrement/increment.
                // $party->increment('current_balance', $total);

                return response()->json(['success' => true], 200);
            } catch (\Exception $e) {
                Log::error('Error processing WooCommerce Order: ' . $e->getMessage());
                return response()->json(['error' => $e->getMessage()], 500);
            }
        }

        return response()->json(['message' => 'No matching products processed'], 200);
    }
}
