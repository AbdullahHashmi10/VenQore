<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\Party;
use App\Models\Transaction;
use App\Services\InventoryService;
use App\Services\PlanGate;
use App\Services\V3\AccountingService;
use App\Services\V3\FifoService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;

class WooCommerceController extends Controller
{
    protected $inventoryService;
    protected $accounting;
    protected $fifo;

    public function __construct(
        InventoryService $inventoryService,
        AccountingService $accounting,
        FifoService $fifo
    ) {
        $this->inventoryService = $inventoryService;
        $this->accounting       = $accounting;
        $this->fifo             = $fifo;
    }

    public function index()
    {
        if (!\App\Services\PlanGate::check('woocommerce')) {
            abort(403, 'WooCommerce integration is not available on your current plan.');
        }

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

    public function webhook(Request $request, string $uuid)
    {
        // Find the active connection matching this UUID
        // Unauthenticated webhook: no tenant context is bound, so bypass the
        // HasTenant global scope and resolve the tenant from the connection itself.
        $connection = \App\Models\WooConnection::withoutTenantScope()
            ->where('uuid', $uuid)
            ->where('status', 'active')
            ->first();

        if (!$connection) {
            Log::warning('WooCommerce webhook received for unknown/inactive connection', ['uuid' => $uuid]);
            return response()->json(['error' => 'Connection not found.'], 404);
        }

        // Verify HMAC-SHA256 signature
        $signature = $request->header('x-wc-webhook-signature');
        if (!$signature) {
            return response()->json(['error' => 'Missing webhook signature.'], 401);
        }

        $body = $request->getContent();
        $secret = $connection->webhook_secret;
        if ($secret) {
            $computed = base64_encode(hash_hmac('sha256', $body, $secret, true));
            if (!hash_equals($computed, $signature)) {
                Log::warning('WooCommerce webhook signature mismatch', ['connection_id' => $connection->id]);
                return response()->json(['error' => 'Invalid webhook signature.'], 401);
            }
        }

        // Bind the resolved tenant to the DI container
        app()->instance('current.tenant', $connection->tenant);

        // ── Phase 4.3: WooCommerce Feature Gate (API webhook) ───────────────
        PlanGate::enforce('woocommerce');

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

        // Resolve the tenant's default warehouse (FifoService deducts per-warehouse).
        $warehouse = \App\Models\Warehouse::where('tenant_id', $connection->tenant->id)
            ->orderByDesc('is_default')
            ->orderBy('created_at')
            ->first();

        $itemsToProcess = [];

        foreach ($payload['line_items'] as $item) {
            $sku = $item['sku'] ?? null;
            $quantity = (float) ($item['quantity'] ?? 0);
            if (!$sku || $quantity <= 0) {
                continue;
            }

            $product = Product::where('sku', $sku)->first();

            if ($product) {
                $itemsToProcess[] = [
                    'id'       => $product->id,
                    'product'  => $product,
                    'quantity' => $quantity,
                ];
            } else {
                Log::warning("Product with SKU $sku not found in VenQore POS");
            }
        }

        if (!empty($itemsToProcess)) {
            try {
                // L012 FIX: a WooCommerce order must post a full double-entry journal,
                // exactly like a POS sale — otherwise Woo revenue/COGS are invisible on
                // the P&L and Balance Sheet. Previously this only deducted stock and wrote
                // a legacy `transactions` row, bypassing journal_items entirely.
                //
                // We deduct through the V3 FifoService (the single source of COGS truth —
                // it writes sale_item_batches audit rows and returns real batch costs),
                // then post: DR 1000 Cash + CR 4000 Revenue (Woo orders are prepaid online),
                // and DR 5000 COGS + CR 1100 Inventory. The legacy Transaction row is kept
                // so existing consumers/tests that read `transactions` still work.
                $result = DB::transaction(function () use ($itemsToProcess, $party, $warehouse, $payload, $connection) {
                    $revenueTotal = 0.0;
                    $cogsTotal    = 0.0;

                    foreach ($itemsToProcess as $line) {
                        /** @var \App\Models\Product $product */
                        $product = $line['product'];
                        $qty     = (float) $line['quantity'];

                        $revenueTotal += (float) $product->price * $qty;

                        // Real FIFO deduction → returns per-batch costs; writes sale_item_batches.
                        if ($warehouse) {
                            $deductions = $this->fifo->deductStock($product->id, $warehouse->id, $qty);
                            foreach ($deductions as $d) {
                                $cogsTotal += (float) $d['total_cost'];
                            }
                        }
                    }

                    $revenueTotal = round($revenueTotal, 2);
                    $cogsTotal    = round($cogsTotal, 2);

                    // ── Post the double-entry journal ──────────────────────────────
                    // Revenue leg: Woo orders arrive already paid online → debit Cash.
                    $journalLines = [
                        ['account_code' => '1000', 'debit' => $revenueTotal, 'credit' => 0, 'party_id' => $party->id],
                        ['account_code' => '4000', 'debit' => 0, 'credit' => $revenueTotal],
                    ];
                    // COGS leg (only when we have a real inventory cost).
                    if ($cogsTotal > 0) {
                        $journalLines[] = ['account_code' => '5000', 'debit' => $cogsTotal, 'credit' => 0];
                        $journalLines[] = ['account_code' => '1100', 'debit' => 0, 'credit' => $cogsTotal];
                    }

                    $this->accounting->createEntry([
                        'date'           => now()->toDateString(),
                        'reference_type' => 'sale',
                        'reference'      => 'WC-' . ($payload['id'] ?? Str::uuid()->toString()),
                        'description'    => 'WooCommerce order WC-' . ($payload['id'] ?? 'unknown'),
                        'party_id'       => $party->id,
                    ], $journalLines);

                    // Keep the legacy transactions row (unchanged behavior for existing readers).
                    Transaction::create([
                        'party_id'        => $party->id,
                        'invoice_id'      => 'WC-' . ($payload['id'] ?? 'unknown'),
                        'amount'          => $revenueTotal,
                        'type'            => 'debit',
                        'running_balance' => $party->current_balance + $revenueTotal, // Simplified
                    ]);

                    return $revenueTotal;
                });

                return response()->json(['success' => true, 'total' => $result], 200);
            } catch (\Exception $e) {
                Log::error('Error processing WooCommerce Order: ' . $e->getMessage());
                return response()->json(['error' => $e->getMessage()], 500);
            }
        }

        return response()->json(['message' => 'No matching products processed'], 200);
    }
}
