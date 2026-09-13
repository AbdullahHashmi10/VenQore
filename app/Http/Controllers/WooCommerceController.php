<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\Party;
use App\Engines\InventoryService;
use App\Services\PlanGate;
use App\Engines\AccountingService;
use App\Engines\FifoService;
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
        if (!$secret) {
            Log::error('WooCommerce webhook rejected: connection has no webhook secret', [
                'connection_id' => $connection->id,
            ]);
            return response()->json(['error' => 'Webhook is not configured.'], 401);
        }

        $computed = base64_encode(hash_hmac('sha256', $body, $secret, true));
        if (!hash_equals($computed, $signature)) {
            Log::warning('WooCommerce webhook signature mismatch', ['connection_id' => $connection->id]);
            return response()->json(['error' => 'Invalid webhook signature.'], 401);
        }

        // Bind the resolved tenant to the DI container
        app()->instance('current.tenant', $connection->tenant);

        // ── Phase 4.3: WooCommerce Feature Gate (API webhook) ───────────────
        PlanGate::enforce('woocommerce');

        $payload = $request->all();
        Log::info('WooCommerce Webhook Received', ['id' => $payload['id'] ?? 'unknown']);

        // WOO-001 (2026-09-10): one idempotent poster for both webhook receivers —
        // order totals, tax, FIFO COGS and a balanced journal, once per order.
        try {
            $result = app(\App\Services\WooSync\WooOrderPoster::class)->post($connection->tenant, $payload);
        } catch (\Throwable $e) {
            Log::error('Error processing WooCommerce Order: ' . $e->getMessage(), ['connection_id' => $connection->id]);
            return response()->json(['error' => 'The order could not be recorded. It will be retried.'], 500);
        }

        return match ($result['status']) {
            'posted'    => response()->json(['success' => true, 'total' => $result['total']], 200),
            'duplicate' => response()->json(['success' => true, 'duplicate' => true], 200),
            default     => response()->json(['message' => $result['message'] ?? 'Ignored'], 200),
        };
    }
}
