<?php

namespace App\Http\Controllers;

use App\Models\EcommerceChannel;
use App\Models\ExpenseCategory;
use App\Models\Product;
use App\Models\Invoice;
use App\Models\Sale;
use App\Models\Warehouse;
use App\Services\SmartFulfillmentService;
use App\Services\VenSynQ\Platforms\AmazonClient;
use App\Services\VenSynQ\Platforms\TikTokClient;
use App\Services\VenSynQ\Platforms\EbayClient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class VenSynQController extends Controller
{
    public function __construct(
        private SmartFulfillmentService $fulfillment,
        private AmazonClient $amazon,
        private TikTokClient $tiktok,
        private EbayClient $ebay
    ) {}

    // ─── Command Center Dashboard ─────────────────────────────────────────────

    /**
     * Main VenSynQ Command Center page.
     * Shows connected channels + pending dispatches.
     */
    public function index()
    {
        $tenantId = app('current.tenant')->id;

        $channels = EcommerceChannel::where('tenant_id', $tenantId)
            ->with('expenseCategory', 'warehouse')
            ->orderBy('platform')
            ->get();

        $pendingSales = Sale::where('tenant_id', $tenantId)
            ->pendingDispatch()
            ->with(['ecommerceChannel', 'items.product'])
            ->latest()
            ->paginate(50);

        $jitDraftsCount = \App\Models\Invoice::where('tenant_id', $tenantId)
            ->where('is_jit', true)
            ->where('approval_status', 'draft')
            ->count();

        return Inertia::render('VenSynQ/Dashboard', [
            'channels'       => $channels,
            'pendingSales'   => $pendingSales,
            'jitDraftsCount' => $jitDraftsCount,
        ]);
    }

    // ─── OAuth Connection Flow ────────────────────────────────────────────────

    /**
     * Redirect to the official platform consent page (Click 1 / 2).
     */
    public function connectChannel(string $store_slug, string $platform)
    {
        try {
            // Store the store_slug in session so universalCallback can resolve
            // the correct tenant when TikTok / eBay / Amazon redirect back to
            // the fixed URL (e.g. https://venqore.com/tiktok/callback)
            session(['vensynq_oauth_store_slug' => $store_slug]);

            $client = $this->resolvePlatformClient($platform);
            return redirect()->away($client->getAuthorizationUrl());
        } catch (\Exception $e) {
            Log::error("VenSynQ connectChannel Error: " . $e->getMessage());
            return back()->with('error', "Could not initiate connection: " . $e->getMessage());
        }
    }

    /**
     * Handle incoming OAuth callback, swap credentials, and register channel (Click 3).
     */
    public function callbackChannel(string $store_slug, string $platform, Request $request)
    {
        $tenantId = app('current.tenant')->id;
        $tenantSlug = app('current.tenant')->slug;
        $code = $request->input('code') ?? 'mock_code_placeholder';

        try {
            $client = $this->resolvePlatformClient($platform);
            $tokens = $client->handleCallback($code);

            // Capture external_seller_id dynamically from platform redirects or simulation outputs
            $externalSellerId = $request->input('selling_partner_id')
                ?? $request->input('shop_id')
                ?? $request->input('seller_id')
                ?? $tokens['seller_id']
                ?? ('MOCK_' . strtoupper($platform) . '_' . mt_rand(100, 999));

            // Click 3 Fallbacks: Default Warehouse & default Expense Category
            $warehouse = Warehouse::where('tenant_id', $tenantId)->first();
            $expenseCategory = ExpenseCategory::firstOrCreate(
                [
                    'tenant_id' => $tenantId,
                    'name'      => ucfirst($platform) . " Fees",
                ],
                [
                    'is_active' => true,
                    'group'     => 'channel_fees',
                ]
            );

            $channel = EcommerceChannel::updateOrCreate(
                [
                    'tenant_id'          => $tenantId,
                    'platform'           => $platform,
                    'external_seller_id' => $externalSellerId,
                ],
                [
                    'name'                     => ucfirst($platform) . " (" . $externalSellerId . ")",
                    'default_fulfillment_type' => 'fbm',
                    'fee_percentage'           => $platform === 'amazon' ? 15.00 : ($platform === 'ebay' ? 12.00 : 8.00),
                    'fee_source'               => 'estimated',
                    'warehouse_id'             => $warehouse?->id,
                    'expense_category_id'      => $expenseCategory?->id,
                    'oauth_access_token'       => $tokens['access_token'] ?? null,
                    'oauth_refresh_token'      => $tokens['refresh_token'] ?? null,
                    'access_token_expires_at'  => isset($tokens['expires_in']) ? now()->addSeconds((int)$tokens['expires_in']) : null,
                    'refresh_token_expires_at' => $platform === 'amazon' ? now()->addYear() : ($platform === 'ebay' ? now()->addMonths(18) : now()->addDays(90)),
                    'is_connected'             => true,
                    'sync_status'              => 'idle',
                ]
            );

            return redirect()->route('store.vensynq.settings', ['store_slug' => $tenantSlug])
                ->with('success', "Marketplace \"" . ucfirst($platform) . "\" (" . $externalSellerId . ") connected successfully! Defaults assigned.");
        } catch (\Exception $e) {
            Log::error("VenSynQ callbackChannel Error: " . $e->getMessage());
            return redirect()->route('store.vensynq.settings', ['store_slug' => $tenantSlug])
                ->with('error', "Authentication failed: " . $e->getMessage());
        }
    }

    /**
     * Universal OAuth callback — receives the fixed /amazon/callback, /tiktok/callback, /ebay/callback
     * registered in each platform's developer portal.
     *
     * Resolves the originating tenant from the OAuth "state" parameter (which we encoded
     * with the store_slug when the user clicked "Connect"), then delegates to callbackChannel.
     */
    public function universalCallback(Request $request, string $platform = '')
    {
        // Primary: read the store_slug we saved to session when the user clicked "Connect"
        $storeSlug = session()->pull('vensynq_oauth_store_slug');

        // Secondary: try to decode from OAuth state parameter
        if (!$storeSlug) {
            $state = $request->input('state', '');
            if ($state) {
                $decoded = base64_decode($state, true);
                if ($decoded && str_contains($decoded, ':')) {
                    [$storeSlug] = explode(':', $decoded, 2);
                } else {
                    $storeSlug = $decoded ?: null;
                }
            }
        }

        // Fallback: if platform was passed as a route default
        if (!$platform) {
            $platform = $request->route('platform') ?? $request->input('platform', '');
        }

        // If we cannot resolve the store slug, send them to login
        if (!$storeSlug) {
            Log::warning("VenSynQ universalCallback: Could not resolve store_slug from session or state. Platform={$platform}");
            return redirect('/')->with('error', 'OAuth session expired. Please try connecting again.');
        }

        // Resolve the tenant from the slug
        $tenant = \App\Models\Tenant::where('slug', $storeSlug)->first();
        if (!$tenant) {
            return redirect('/')->with('error', 'Store not found. Please try connecting again.');
        }

        // Bind the resolved tenant into the app container
        app()->instance('current.tenant', $tenant);

        // Delegate to the standard per-store callback handler
        return $this->callbackChannel($storeSlug, $platform, $request);
    }

    /**
     * Disconnect a channel, revoking connection and credentials safely.
     */
    public function disconnectChannel(string $store_slug, EcommerceChannel $channel)
    {
        $this->authorizeChannel($channel);

        $channel->update([
            'oauth_access_token'       => null,
            'oauth_refresh_token'      => null,
            'access_token_expires_at'  => null,
            'refresh_token_expires_at' => null,
            'is_connected'             => false,
            'sync_status'              => 'idle',
        ]);

        return back()->with('success', "Marketplace store disconnected.");
    }

    // ─── Manual Synchronization Hook ──────────────────────────────────────────

    /**
     * Manually fetch recent platform orders on demand from the dashboard.
     */
    public function fetchLiveOrders()
    {
        $tenantId = app('current.tenant')->id;
        $userId   = Auth::id();

        $channels = EcommerceChannel::where('tenant_id', $tenantId)
            ->where('is_connected', true)
            ->get();

        if ($channels->isEmpty()) {
            return back()->with('error', 'No connected channels found. Please connect a store in Settings first.');
        }

        $newSalesCount = 0;

        foreach ($channels as $channel) {
            try {
                $channel->update(['sync_status' => 'syncing', 'sync_error_message' => null]);
                $client = $this->resolvePlatformClient($channel->platform);
                
                // Fetch recent platform orders
                $normalizedItems = $client->fetchOrders($channel->oauth_access_token ?? '');

                if (empty($normalizedItems)) {
                    $channel->update(['sync_status' => 'idle', 'last_synced_at' => now()]);
                    continue;
                }

                // Group items by platform order ID to create multi-line sales invoices
                $groupedOrders = collect($normalizedItems)->groupBy('channel_order_id');

                foreach ($groupedOrders as $orderId => $items) {
                    $itemsArray = $items->toArray();

                    // processDropshipSale has a duplicate check built in (Step 0)
                    $sale = $this->fulfillment->processDropshipSale(
                        $itemsArray,
                        $channel->id,
                        $tenantId,
                        $userId
                    );

                    // If a brand new sale invoice was successfully created
                    if ($sale->wasRecentlyCreated) {
                        $newSalesCount++;
                    }
                }

                $channel->update([
                    'sync_status' => 'idle',
                    'last_synced_at' => now(),
                ]);
            } catch (\Exception $e) {
                Log::error("VenSynQ Fetch Error for channel {$channel->name}: " . $e->getMessage());
                $channel->update([
                    'sync_status' => 'error',
                    'sync_error_message' => $e->getMessage(),
                ]);
            }
        }

        if ($newSalesCount > 0) {
            return back()->with('success', "Live sync completed. {$newSalesCount} new orders synced successfully.");
        }

        return back()->with('success', 'Live sync completed. All orders are up to date.');
    }

    // ─── Channel Management CRUD ──────────────────────────────────────────────

    /**
     * Store a new channel (manual mode — fallback support).
     */
    public function storeChannel(Request $request)
    {
        $validated = $request->validate([
            'name'                     => 'required|string|max:255',
            'platform'                 => 'required|in:amazon,tiktok,ebay',
            'default_fulfillment_type' => 'required|in:fbm,fba,jit',
            'fee_percentage'           => 'required|numeric|min:0|max:100',
            'warehouse_id'             => 'nullable|uuid',
            'expense_category_id'      => 'nullable|integer',
            'currency'                 => 'nullable|string|size:3',
        ]);

        $tenantId = app('current.tenant')->id;

        if ($request->boolean('auto_create_expense_category')) {
            $category = ExpenseCategory::firstOrCreate(
                ['tenant_id' => $tenantId, 'name' => "{$validated['name']} Fees"],
                ['is_active' => true, 'group' => 'channel_fees']
            );
            $validated['expense_category_id'] = $category->id;
        }

        $channel = EcommerceChannel::create([
            ...$validated,
            'tenant_id'  => $tenantId,
            'currency'   => $validated['currency'] ?? 'GBP',
            'fee_source' => 'estimated',
        ]);

        return redirect()->route('store.vensynq.settings', ['store_slug' => app('current.tenant')->slug])
            ->with('success', "Channel \"{$channel->name}\" added successfully.");
    }

    /**
     * Update channel settings.
     */
    public function updateChannel(Request $request, EcommerceChannel $channel)
    {
        $this->authorizeChannel($channel);

        $validated = $request->validate([
            'name'                     => 'sometimes|string|max:255',
            'default_fulfillment_type' => 'sometimes|in:fbm,fba,jit',
            'fee_percentage'           => 'sometimes|numeric|min:0|max:100',
            'warehouse_id'             => 'nullable|uuid',
            'expense_category_id'      => 'nullable|integer',
            'currency'                 => 'nullable|string|size:3',
        ]);

        $channel->update($validated);

        return back()->with('success', 'Channel settings updated.');
    }

    /**
     * Delete a channel (soft delete).
     */
    public function destroyChannel(EcommerceChannel $channel)
    {
        $this->authorizeChannel($channel);
        $channel->delete();
        return redirect()->route('store.vensynq.settings', ['store_slug' => app('current.tenant')->slug])->with('success', 'Channel removed.');
    }

    // ─── Pre-Save Validation Preview ─────────────────────────────────────────

    public function previewOrder(Request $request)
    {
        $request->validate([
            'channel_id' => 'required|integer',
            'items'      => 'required|array|min:1',
            'items.*.sku'              => 'required|string',
            'items.*.quantity'         => 'required|integer|min:1',
            'items.*.sale_price'       => 'required|numeric|min:0',
            'items.*.platform_fee'     => 'nullable|numeric|min:0',
            'items.*.channel_order_id' => 'nullable|string',
            'items.*.fulfillment_type' => 'nullable|in:fbm,fba,jit',
            'items.*.currency'         => 'nullable|string|size:3',
        ]);

        $tenantId = app('current.tenant')->id;
        $preview  = $this->fulfillment->previewOrderItems(
            $request->items,
            $request->channel_id,
            $tenantId
        );

        return response()->json(['preview' => $preview]);
    }

    // ─── Sale Creation (Manual Dropship Entry) ────────────────────────────────

    public function processOrder(Request $request)
    {
        $request->validate([
            'channel_id' => 'required|integer',
            'items'      => 'required|array|min:1',
            'items.*.sku'              => 'required|string',
            'items.*.quantity'         => 'required|integer|min:1',
            'items.*.sale_price'       => 'required|numeric|min:0',
            'items.*.platform_fee'     => 'nullable|numeric|min:0',
            'items.*.channel_order_id' => 'nullable|string',
            'items.*.fulfillment_type' => 'nullable|in:fbm,fba,jit',
            'items.*.currency'         => 'nullable|string|size:3',
        ]);

        $tenantId = app('current.tenant')->id;
        $userId   = Auth::id();

        $sale = $this->fulfillment->processDropshipSale(
            $request->items,
            $request->channel_id,
            $tenantId,
            $userId,
            ['notes' => $request->notes]
        );

        return redirect()->route('vensynq.index')
            ->with('success', "Order processed. Sale #{$sale->channel_order_id} created.");
    }

    // ─── Tracking Sync ────────────────────────────────────────────────────────

    /**
     * Bulk update tracking numbers and mark orders as dispatched.
     * Updates local database and dispatches platform API updates.
     */
    public function syncTracking(Request $request)
    {
        $request->validate([
            'updates'                     => 'required|array|min:1',
            'updates.*.sale_id'           => 'required|uuid',
            'updates.*.tracking_number'   => 'required|string',
            'updates.*.shipping_carrier'  => 'nullable|string',
        ]);

        $updated = 0;
        foreach ($request->updates as $update) {
            $sale = Sale::where('id', $update['sale_id'])
                ->where('is_dropship', true)
                ->first();

            if ($sale) {
                $sale->update([
                    'tracking_number'  => $update['tracking_number'],
                    'shipping_carrier' => $update['shipping_carrier'] ?? null,
                    'dispatch_status'  => 'dispatched',
                ]);
                $updated++;

                // Queue or push direct dispatch updates back to respective channel APIs
                if ($sale->ecommerce_channel_id) {
                    $channel = EcommerceChannel::find($sale->ecommerce_channel_id);
                    if ($channel && $channel->is_connected) {
                        try {
                            $client = $this->resolvePlatformClient($channel->platform);
                            $client->pushTracking(
                                $channel->oauth_access_token ?? '',
                                $sale->channel_order_id ?? $sale->id,
                                $update['tracking_number'],
                                $update['shipping_carrier'] ?? 'Other'
                            );
                        } catch (\Exception $e) {
                            Log::error("Failed to push tracking to platform {$channel->platform}: " . $e->getMessage());
                        }
                    }
                }
            }
        }

        return back()->with('success', "{$updated} order(s) marked as dispatched and tracking pushed to marketplace.");
    }

    // ─── JIT Draft Approval ───────────────────────────────────────────────────
    
    public function approveJitDraft(Request $request, \App\Models\Invoice $purchase)
    {
        $tenantId = app('current.tenant')->id;
        abort_unless($purchase->tenant_id === $tenantId, 403);

        $request->validate([
            'confirmed_cost' => 'nullable|numeric|min:0',
            'supplier_id'    => 'nullable|uuid',
        ]);

        $confirmedCost = $request->has('confirmed_cost') && $request->input('confirmed_cost') !== null
            ? (float) $request->input('confirmed_cost')
            : (float) ($purchase->total_amount ?? $purchase->subtotal ?? 0);

        $supplierId = $request->input('supplier_id') ?? $purchase->party_id;

        $this->fulfillment->approveJitDraft(
            $purchase,
            $confirmedCost,
            $supplierId
        );

        return back()->with('success', 'Supplier cost confirmed. Profit updated.');
    }

    // ─── Settings Rendering ───────────────────────────────────────────────────

    public function settings()
    {
        $tenantId = app('current.tenant')->id;

        $channels = EcommerceChannel::where('tenant_id', $tenantId)
            ->with('expenseCategory', 'warehouse')
            ->orderBy('platform')
            ->get();

        $warehouses = Warehouse::where('tenant_id', $tenantId)->get();
        $expenseCategories = ExpenseCategory::where('tenant_id', $tenantId)->get();

        return Inertia::render('VenSynQ/Settings', [
            'channels'          => $channels,
            'warehouses'        => $warehouses,
            'expenseCategories' => $expenseCategories,
        ]);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function authorizeChannel(EcommerceChannel $channel): void
    {
        $tenantId = app('current.tenant')->id;
        abort_unless($channel->tenant_id === $tenantId, 403);
    }

    private function resolvePlatformClient(string $platform)
    {
        return match (strtolower($platform)) {
            'amazon' => $this->amazon,
            'tiktok' => $this->tiktok,
            'ebay'   => $this->ebay,
            default  => throw new \InvalidArgumentException("Invalid platform: {$platform}"),
        };
    }
}
