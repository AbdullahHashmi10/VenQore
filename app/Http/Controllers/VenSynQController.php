<?php

namespace App\Http\Controllers;

use App\Models\EcommerceChannel;
use App\Models\ExpenseCategory;
use App\Models\MarketplacePayout;
use App\Models\Sale;
use App\Models\Tenant;
use App\Models\Warehouse;
use App\Services\SmartFulfillmentService;
use App\Services\VenSynQ\IntegrationHealthService;
use App\Services\VenSynQ\MarketplaceSettlementService;
use App\Services\VenSynQ\PlatformRegistry;
use App\Services\VenSynQ\Platforms\AmazonClient;
use App\Services\VenSynQ\SyncOrchestrator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;
use Inertia\Inertia;

/**
 * VenSynQController — multi-channel fulfillment command center.
 *
 * ══ T16 AUDIT: defects fixed in this file ═════════════════════════════════════
 *
 * 1. FATAL ARGUMENT MISMATCH (critical — every OAuth callback 500'd).
 *    universalCallback() invoked callbackChannel() with THREE arguments — store
 *    slug first, then platform, then request. The method signature accepts only
 *    TWO: (string $platform, Request $request). Under PHP 8.2 that is an
 *    ArgumentCountError, so the fixed marketplace redirect URLs registered in the
 *    Amazon / TikTok / eBay developer portals (/amazon/callback etc.) could NEVER
 *    complete a connection. Fixed to a two-argument call in the right order.
 *
 * 2. CROSS-TENANT IDOR.
 *    previewOrder() and processOrder() validated channel_id as `required|integer`
 *    with no ownership check, then handed it straight to SmartFulfillmentService.
 *    Any authenticated user could post another tenant's channel id and write
 *    orders into that store. Same for warehouse_id / expense_category_id on
 *    storeChannel() and updateChannel(). All now use tenant-scoped Rule::exists.
 *
 * 3. DUPLICATED SYNC LOOP.
 *    fetchLiveOrders() carried its own copy of the job's sync loop, already
 *    drifted from it. Both now delegate to SyncOrchestrator per CLAUDE.md's
 *    "thin controllers, logic in Services" rule.
 *
 * 4. UNVALIDATED PLATFORM STRINGS reached resolvePlatformClient() and threw
 *    unhandled InvalidArgumentException. Now validated against PlatformRegistry.
 */
class VenSynQController extends Controller
{
    public function __construct(
        private SmartFulfillmentService $fulfillment,
        private SyncOrchestrator $orchestrator,
        private PlatformRegistry $registry,
        private IntegrationHealthService $health,
    ) {
    }

    // ─── Command Center Dashboard ─────────────────────────────────────────────

    public function index(MarketplaceSettlementService $settlement)
    {
        $tenant   = app('current.tenant');
        $tenantId = $tenant->id;

        // Mature any batch whose settlement window has elapsed, so the owner is
        // prompted to confirm the moment money is due.
        $settlement->matureDuePayouts($tenant);

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
            // Computed from local state only — no network I/O, so the dashboard
            // paints instantly instead of blocking on a marketplace API.
            'health'         => $this->health->summarize($channels),
            'serverTime'     => now()->toIso8601String(),
            // T17 — Money Pipeline: online sales → held by platforms → in bank.
            'pipeline'        => $settlement->pipeline($tenantId),
            'clearingEnabled' => $tenant->clearing_go_live_at !== null,
        ]);
    }

    /**
     * Poll endpoint for the dashboard's live health badge + freshness timestamps.
     * Returns JSON so the UI can refresh without a full Inertia round-trip.
     */
    public function healthStatus()
    {
        $tenantId = app('current.tenant')->id;

        $channels = EcommerceChannel::where('tenant_id', $tenantId)
            ->orderBy('platform')
            ->get();

        return response()->json([
            'health'     => $this->health->summarize($channels),
            'serverTime' => now()->toIso8601String(),
        ]);
    }

    // ─── OAuth Connection Flow ────────────────────────────────────────────────

    public function connectChannel(string $platform, Request $request)
    {
        if (!$this->registry->isEnabled($platform)) {
            return back()->with('error', "The {$this->registry->label($platform)} integration is not available right now.");
        }

        try {
            session(['vensynq_oauth_store_slug' => app('current.tenant')->slug]);

            $client = $this->registry->resolve($platform);
            if ($platform === 'amazon' && $client instanceof \App\Services\VenSynQ\Platforms\AmazonClient) {
                $region = $request->query('region');
                session(['vensynq_oauth_amazon_region' => $region]);
                $authUrl = $client->getAuthorizationUrlForRegion($region);
            } else {
                $authUrl = $client->getAuthorizationUrl();
            }

            return redirect()->away($authUrl);
        } catch (\Throwable $e) {
            Log::error('[VenSynQ] connectChannel failed', ['platform' => $platform, 'error' => $e->getMessage()]);

            return back()->with('error', 'Could not start the connection: ' . $e->getMessage());
        }
    }

    /**
     * Handle the OAuth callback, swap credentials, and register the channel.
     */
    public function callbackChannel(string $platform, Request $request)
    {
        $tenant     = app('current.tenant');
        $tenantSlug = $tenant->slug;

        if (!$this->registry->isEnabled($platform)) {
            return redirect()->route('store.vensynq.settings', ['store_slug' => $tenantSlug])
                ->with('error', "The {$this->registry->label($platform)} integration is not available right now.");
        }

        try {
            $client = $this->registry->resolve($platform);
            $tokens = $client->handleCallback($request->input('code') ?? 'mock_code_placeholder');

            $externalSellerId = $request->input('selling_partner_id')
                ?? $request->input('shop_id')
                ?? $request->input('seller_id')
                ?? $tokens['seller_id']
                ?? ('MOCK_' . strtoupper($platform) . '_' . mt_rand(100, 999));

            $region = session('vensynq_oauth_amazon_region');

            $channel = $this->upsertChannel($tenant->id, $platform, $externalSellerId, [
                'oauth_access_token'       => $tokens['access_token'] ?? null,
                'oauth_refresh_token'      => $tokens['refresh_token'] ?? null,
                'access_token_expires_at'  => isset($tokens['expires_in'])
                    ? now()->addSeconds((int) $tokens['expires_in'])
                    : null,
                'auth_method'              => $platform === 'woocommerce' ? 'plugin' : 'oauth',
                'region'                   => $region,
            ]);

            return redirect()->route('store.vensynq.settings', ['store_slug' => $tenantSlug])
                ->with('success', $this->registry->label($platform) . " ({$channel->external_seller_id}) connected successfully.");
        } catch (\Throwable $e) {
            Log::error('[VenSynQ] callbackChannel failed', ['platform' => $platform, 'error' => $e->getMessage()]);

            return redirect()->route('store.vensynq.settings', ['store_slug' => $tenantSlug])
                ->with('error', 'Authentication failed: ' . $e->getMessage());
        }
    }

    /**
     * Universal OAuth callback for the fixed URLs registered in each developer
     * portal (/amazon/callback, /tiktok/callback, /ebay/callback).
     *
     * These routes sit OUTSIDE the store-slug group, so no tenant is bound when
     * they are hit. We resolve the tenant from the session value stashed at
     * connect time, falling back to the OAuth `state` parameter.
     */
    public function universalCallback(Request $request, string $platform = '')
    {
        $storeSlug = session()->pull('vensynq_oauth_store_slug');

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

        if (!$platform) {
            $platform = $request->route('platform')
                ?? $request->route()?->defaults['platform']
                ?? $request->input('platform', '');
        }

        if (!$storeSlug) {
            Log::warning('[VenSynQ] universalCallback could not resolve a store slug.', ['platform' => $platform]);

            return redirect('/')->with('error', 'That connection link expired. Please try connecting again.');
        }

        $tenant = Tenant::where('slug', $storeSlug)->first();

        if (!$tenant) {
            return redirect('/')->with('error', 'Store not found. Please try connecting again.');
        }

        app()->instance('current.tenant', $tenant);

        // ── T16 FIX ──────────────────────────────────────────────────────────
        // The previous implementation passed THREE arguments here — store slug,
        // platform, request — against a TWO-parameter signature, with the slug
        // sitting in the platform position. That is an ArgumentCountError on
        // every single marketplace callback, so no channel could ever connect
        // through the fixed developer-portal redirect URLs.
        return $this->callbackChannel($platform, $request);
    }

    public function disconnectChannel(EcommerceChannel $channel)
    {
        $this->authorizeChannel($channel);

        $channel->update([
            'oauth_access_token'       => null,
            'oauth_refresh_token'      => null,
            'access_token_expires_at'  => null,
            'refresh_token_expires_at' => null,
            'is_connected'             => false,
            'sync_status'              => 'idle',
            'sync_error_message'       => null,
            'consecutive_failures'     => 0,
        ]);

        return back()->with('success', 'Marketplace disconnected.');
    }

    // ─── Amazon SP-API 3-Step Credential Wizard (T16 §2) ──────────────────────

    /**
     * Step 3 of the wizard: validate a credential set WITHOUT persisting it.
     *
     * Kept separate from the save endpoint so the merchant gets an instant
     * pass/fail before committing, and so a bad key pair never lands in the DB.
     */
    public function testAmazonCredentials(Request $request, AmazonClient $amazon)
    {
        $validated = $request->validate([
            'client_id'     => 'required|string|max:255',
            'client_secret' => 'required|string|max:255',
            'refresh_token' => 'required|string|max:2048',
        ]);

        $result = $amazon->validateCredentials(
            $validated['client_id'],
            $validated['client_secret'],
            $validated['refresh_token'],
        );

        // Always HTTP 200 — the wizard renders the message inline. A 4xx here
        // would trip Inertia's error modal and hide the actual reason.
        return response()->json([
            'ok'      => $result['ok'],
            'message' => $result['message'],
        ]);
    }

    /**
     * Persist a validated Amazon credential set as a connected channel.
     */
    public function storeAmazonCredentials(Request $request, AmazonClient $amazon)
    {
        $validated = $request->validate([
            'client_id'     => 'required|string|max:255',
            'client_secret' => 'required|string|max:255',
            'refresh_token' => 'required|string|max:2048',
            'seller_id'     => 'required|string|max:255',
            'name'          => 'nullable|string|max:255',
            'region'        => 'nullable|string|max:255',
        ]);

        // Re-validate server-side. The client may have skipped the test step, and
        // trusting a UI-only check would let a dead credential set be saved as
        // "connected" and then fail silently on the next background sync.
        $result = $amazon->validateCredentials(
            $validated['client_id'],
            $validated['client_secret'],
            $validated['refresh_token'],
        );

        if (!$result['ok']) {
            return back()->withErrors(['refresh_token' => $result['message']]);
        }

        $tenantId = app('current.tenant')->id;

        $this->upsertChannel($tenantId, 'amazon', $validated['seller_id'], [
            'name'                     => $validated['name'] ?: 'Amazon (' . $validated['seller_id'] . ')',
            'oauth_access_token'       => $result['access_token'] ?? null,
            'oauth_refresh_token'      => $validated['refresh_token'],
            'access_token_expires_at'  => now()->addSeconds((int) ($result['expires_in'] ?? 3600)),
            'refresh_token_expires_at' => now()->addYear(),
            'auth_method'              => 'credentials',
            'region'                   => $validated['region'] ?? 'eu',
        ]);

        return redirect()->route('store.vensynq.settings', ['store_slug' => app('current.tenant')->slug])
            ->with('success', 'Amazon connected successfully. Press Sync Now to import your first orders.');
    }

    /**
     * Live "Test Connection" for an already-saved channel — powers the amber/green
     * recheck button next to each channel on the settings screen.
     */
    public function testChannelConnection(EcommerceChannel $channel)
    {
        $this->authorizeChannel($channel);

        try {
            $result = $this->registry->resolve($channel->platform)
                ->testConnection($channel->oauth_access_token ?? '');
        } catch (\Throwable $e) {
            $result = ['ok' => false, 'message' => $e->getMessage()];
        }

        // Record the probe so the health badge reflects it immediately.
        $channel->forceFill($result['ok']
            ? ['sync_status' => 'idle', 'sync_error_message' => null, 'consecutive_failures' => 0]
            : ['sync_status' => 'error', 'sync_error_message' => $result['message'], 'last_error_at' => now()]
        )->save();

        return response()->json($result);
    }

    // ─── Synchronization ──────────────────────────────────────────────────────

    /**
     * "Sync Now" — manual trigger from the dashboard.
     */
    public function fetchLiveOrders()
    {
        $tenant = app('current.tenant');

        $hasConnected = EcommerceChannel::where('tenant_id', $tenant->id)
            ->where('is_connected', true)
            ->exists();

        if (!$hasConnected) {
            return back()->with('error', 'No connected channels yet. Connect a marketplace in Settings first.');
        }

        $result = $this->orchestrator->syncTenant($tenant, Auth::id());

        if ($result['failed'] > 0) {
            return back()->with(
                'error',
                "Sync finished with {$result['failed']} channel(s) in error. Open the Error Inspector for details."
            );
        }

        return back()->with('success', $result['synced'] > 0
            ? "Sync complete — {$result['synced']} new order(s) imported."
            : 'Sync complete. Everything is up to date.');
    }

    /**
     * "Retry Failed Sync" — re-runs one channel from the Error Inspector.
     */
    public function retryChannelSync(EcommerceChannel $channel)
    {
        $this->authorizeChannel($channel);

        if (!$channel->is_connected) {
            return back()->with('error', 'Reconnect this channel before retrying.');
        }

        $outcome = $this->orchestrator->syncChannel($channel, app('current.tenant'), Auth::id());

        return $outcome['ok']
            ? back()->with('success', "{$channel->name}: {$outcome['message']}")
            : back()->with('error', "{$channel->name} still failing — {$outcome['message']}");
    }

    // ─── Channel Management CRUD ──────────────────────────────────────────────

    public function storeChannel(Request $request)
    {
        $tenantId = app('current.tenant')->id;

        $validated = $request->validate([
            'name'                     => 'required|string|max:255',
            'platform'                 => ['required', $this->registry->enabledValidationRule()],
            'default_fulfillment_type' => 'required|in:fbm,fba,jit',
            'fee_percentage'           => 'required|numeric|min:0|max:100',
            'warehouse_id'             => ['nullable', 'uuid', $this->ownedBy('warehouses', $tenantId)],
            'expense_category_id'      => ['nullable', 'integer', $this->ownedBy('expense_categories', $tenantId)],
            'currency'                 => 'nullable|string|size:3',
        ]);

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
            ->with('success', "Channel \"{$channel->name}\" added.");
    }

    public function updateChannel(Request $request, EcommerceChannel $channel)
    {
        $this->authorizeChannel($channel);

        $tenantId = app('current.tenant')->id;

        $validated = $request->validate([
            'name'                     => 'sometimes|string|max:255',
            'default_fulfillment_type' => 'sometimes|in:fbm,fba,jit',
            'fee_percentage'           => 'sometimes|numeric|min:0|max:100',
            'warehouse_id'             => ['nullable', 'uuid', $this->ownedBy('warehouses', $tenantId)],
            'expense_category_id'      => ['nullable', 'integer', $this->ownedBy('expense_categories', $tenantId)],
            'currency'                 => 'nullable|string|size:3',
        ]);

        $channel->update($validated);

        return back()->with('success', 'Channel settings updated.');
    }

    public function destroyChannel(EcommerceChannel $channel)
    {
        $this->authorizeChannel($channel);
        $channel->delete();

        return redirect()->route('store.vensynq.settings', ['store_slug' => app('current.tenant')->slug])
            ->with('success', 'Channel removed.');
    }

    // ─── Order Processing ─────────────────────────────────────────────────────

    public function previewOrder(Request $request)
    {
        $tenantId = app('current.tenant')->id;

        $request->validate($this->orderRules($tenantId));

        return response()->json([
            'preview' => $this->fulfillment->previewOrderItems($request->items, $request->channel_id, $tenantId),
        ]);
    }

    public function processOrder(Request $request)
    {
        $tenantId = app('current.tenant')->id;

        $request->validate($this->orderRules($tenantId));

        $sale = $this->fulfillment->processDropshipSale(
            $request->items,
            $request->channel_id,
            $tenantId,
            Auth::id(),
            ['notes' => $request->notes]
        );

        return redirect()->route('store.vensynq.index', ['store_slug' => app('current.tenant')->slug])
            ->with('success', "Order processed. Sale #{$sale->channel_order_id} created.");
    }

    // ─── Tracking Sync ────────────────────────────────────────────────────────

    public function syncTracking(Request $request)
    {
        $request->validate([
            'updates'                    => 'required|array|min:1',
            'updates.*.sale_id'          => 'required|uuid',
            'updates.*.tracking_number'  => 'required|string|max:255',
            'updates.*.shipping_carrier' => 'nullable|string|max:100',
        ]);

        $tenantId = app('current.tenant')->id;
        $updated  = 0;
        $pushFailures = [];

        foreach ($request->updates as $update) {
            // Explicit tenant_id: this must never be able to mutate another
            // store's sale even if the global scope is bypassed upstream.
            $sale = Sale::where('tenant_id', $tenantId)
                ->where('id', $update['sale_id'])
                ->where('is_dropship', true)
                ->first();

            if (!$sale) {
                continue;
            }

            $sale->update([
                'tracking_number'  => $update['tracking_number'],
                'shipping_carrier' => $update['shipping_carrier'] ?? null,
                'dispatch_status'  => 'dispatched',
            ]);
            $updated++;

            if (!$sale->ecommerce_channel_id) {
                continue;
            }

            $channel = EcommerceChannel::where('tenant_id', $tenantId)
                ->find($sale->ecommerce_channel_id);

            if (!$channel || !$channel->is_connected) {
                continue;
            }

            // A marketplace push failure must not roll back the local dispatch —
            // the goods have physically shipped. Collect and report instead.
            try {
                $pushed = $this->registry->resolve($channel->platform)->pushTracking(
                    $channel->oauth_access_token ?? '',
                    $sale->channel_order_id ?? $sale->id,
                    $update['tracking_number'],
                    $update['shipping_carrier'] ?? 'Other'
                );

                if (!$pushed) {
                    $pushFailures[] = $channel->name;
                }
            } catch (\Throwable $e) {
                Log::error('[VenSynQ] Tracking push failed', [
                    'channel_id' => $channel->id,
                    'error'      => $e->getMessage(),
                ]);
                $pushFailures[] = $channel->name;
            }
        }

        $message = "{$updated} order(s) marked as dispatched.";

        if ($pushFailures !== []) {
            $message .= ' Tracking could not be pushed to: ' . implode(', ', array_unique($pushFailures))
                      . '. These are queued in Action Required.';
        }

        return back()->with($pushFailures === [] ? 'success' : 'warning', $message);
    }

    // ─── JIT Draft Approval ───────────────────────────────────────────────────

    public function approveJitDraft(Request $request, \App\Models\Invoice $purchase)
    {
        abort_unless($purchase->tenant_id === app('current.tenant')->id, 403);

        $request->validate([
            'confirmed_cost' => 'nullable|numeric|min:0',
            'supplier_id'    => 'nullable|uuid',
        ]);

        $confirmedCost = $request->filled('confirmed_cost')
            ? (float) $request->input('confirmed_cost')
            : (float) ($purchase->total_amount ?? $purchase->subtotal ?? 0);

        $this->fulfillment->approveJitDraft(
            $purchase,
            $confirmedCost,
            $request->input('supplier_id') ?? $purchase->party_id
        );

        return back()->with('success', 'Supplier cost confirmed. Profit updated.');
    }

    // ─── T17: Marketplace Clearing / Money Pipeline ───────────────────────────

    /**
     * JSON feed for the Money Pipeline widget.
     * Matures any batch whose settlement window has elapsed so the owner is
     * prompted the moment money is expected, without needing a scheduled job.
     */
    public function moneyPipeline(MarketplaceSettlementService $settlement)
    {
        $tenant = app('current.tenant');

        $settlement->matureDuePayouts($tenant);

        return response()->json([
            'pipeline'        => $settlement->pipeline($tenant->id),
            'clearingEnabled' => $tenant->clearing_go_live_at !== null,
        ]);
    }

    /**
     * Payouts awaiting owner confirmation, plus recent confirmed history.
     */
    public function payouts(MarketplaceSettlementService $settlement)
    {
        $tenant = app('current.tenant');

        $settlement->matureDuePayouts($tenant);

        return Inertia::render('VenSynQ/Payouts', [
            'due' => MarketplacePayout::where('tenant_id', $tenant->id)
                ->due()->with('channel')->orderBy('expected_at')->get(),
            'pending' => MarketplacePayout::where('tenant_id', $tenant->id)
                ->pending()->with('channel')->orderBy('expected_at')->get(),
            'recent' => MarketplacePayout::where('tenant_id', $tenant->id)
                ->confirmed()->with('channel')->latest('confirmed_at')->limit(25)->get(),
            'pipeline'     => $settlement->pipeline($tenant->id),
            'bankAccounts' => \App\Models\BankAccount::where('tenant_id', $tenant->id)->get(['id', 'name', 'bank_name']),
        ]);
    }

    /**
     * Owner confirms a payout actually landed. The ONLY path that moves money
     * from 1205 Clearing into 1010 Bank.
     */
    public function confirmPayout(
        Request $request,
        MarketplacePayout $payout,
        MarketplaceSettlementService $settlement
    ) {
        abort_unless($payout->tenant_id === app('current.tenant')->id, 403);

        $validated = $request->validate([
            // Deliberately required, not defaulted to the expected figure. The
            // whole point is to capture what the BANK says, which is routinely
            // a few pounds off our estimate.
            'actual_net'         => 'required|numeric|min:0',
            'bank_account_id'    => ['nullable', 'uuid', $this->ownedBy('bank_accounts', app('current.tenant')->id)],
            'external_payout_id' => 'nullable|string|max:255',
        ]);

        try {
            $confirmed = $settlement->confirmPayout(
                $payout,
                (float) $validated['actual_net'],
                $validated['bank_account_id'] ?? null,
                Auth::id(),
                $validated['external_payout_id'] ?? null,
            );
        } catch (\Throwable $e) {
            Log::error('[T17] Payout confirmation failed', ['payout_id' => $payout->id, 'error' => $e->getMessage()]);

            return back()->with('error', 'Could not confirm the payout: ' . $e->getMessage());
        }

        $variance = (float) $confirmed->variance;

        if (abs($variance) >= 0.01) {
            // Surfaced rather than swallowed — an unexplained shortfall is
            // usually a storage/advertising fee the owner should know about.
            $direction = $variance < 0 ? 'less' : 'more';

            return back()->with(
                'warning',
                sprintf(
                    'Payout confirmed. You received %s %s than estimated (%s). The difference was posted to Marketplace Fee Variance.',
                    number_format(abs($variance), 2),
                    $direction,
                    number_format($variance, 2)
                )
            );
        }

        return back()->with('success', 'Payout confirmed and deposited to your bank account.');
    }

    /**
     * Turn the clearing pipeline on for this tenant, from now forward.
     */
    public function enableClearing(Request $request)
    {
        $tenant = app('current.tenant');

        $request->validate(['enabled' => 'required|boolean']);

        // Cutover is set to NOW on enable. Historical sales are never touched,
        // so existing reports and closed periods remain byte-identical.
        $tenant->forceFill([
            'clearing_go_live_at' => $request->boolean('enabled') ? now() : null,
        ])->save();

        return back()->with('success', $request->boolean('enabled')
            ? 'Marketplace Clearing is on. Online sales from now on will be held in the clearing pool until you confirm each payout.'
            : 'Marketplace Clearing is off. Online sales will post straight to cash again.');
    }

    /**
     * Per-channel settlement terms (payout delay, reserve, destination bank).
     */
    public function updateSettlement(Request $request, EcommerceChannel $channel)
    {
        $this->authorizeChannel($channel);

        $validated = $request->validate([
            'settlement_days'            => 'required|integer|min:0|max:120',
            'reserve_percentage'         => 'nullable|numeric|min:0|max:100',
            'auto_sweep'                 => 'nullable|boolean',
            'settlement_bank_account_id' => ['nullable', 'uuid', $this->ownedBy('bank_accounts', app('current.tenant')->id)],
        ]);

        $channel->update($validated);

        return back()->with('success', "Settlement terms updated for {$channel->name}.");
    }

    // ─── Settings ─────────────────────────────────────────────────────────────

    public function settings()
    {
        $tenantId = app('current.tenant')->id;

        $channels = EcommerceChannel::where('tenant_id', $tenantId)
            ->with('expenseCategory', 'warehouse')
            ->orderBy('platform')
            ->get();

        return Inertia::render('VenSynQ/Settings', [
            'channels'          => $channels,
            'warehouses'        => Warehouse::where('tenant_id', $tenantId)->get(),
            'expenseCategories' => ExpenseCategory::where('tenant_id', $tenantId)->get(),
            'health'            => $this->health->summarize($channels),
            'platforms'         => collect($this->registry->enabled())
                ->map(fn ($p) => [
                    'key'          => $p,
                    'label'        => $this->registry->label($p),
                    'default_fee'  => $this->registry->defaultFeePercentage($p),
                    'rotates_token'=> $this->registry->rotatesTokens($p),
                ])->values(),
            'simulationMode'    => (bool) config('vensynq.simulation_mode'),
        ]);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function authorizeChannel(EcommerceChannel $channel): void
    {
        abort_unless($channel->tenant_id === app('current.tenant')->id, 403);
    }

    /**
     * Tenant-scoped existence rule. Closes the IDOR described at the top of this
     * class: a foreign key is only valid if it belongs to the current tenant.
     */
    private function ownedBy(string $table, int|string $tenantId): Exists
    {
        return Rule::exists($table, 'id')->where('tenant_id', $tenantId);
    }

    /**
     * Shared validation for previewOrder / processOrder, including the
     * tenant-scoped channel_id check that was previously missing.
     */
    private function orderRules(int|string $tenantId): array
    {
        return [
            'channel_id'               => ['required', 'integer', $this->ownedBy('ecommerce_channels', $tenantId)],
            'items'                    => 'required|array|min:1',
            'items.*.sku'              => 'required|string|max:255',
            'items.*.quantity'         => 'required|integer|min:1',
            'items.*.sale_price'       => 'required|numeric|min:0',
            'items.*.platform_fee'     => 'nullable|numeric|min:0',
            'items.*.channel_order_id' => 'nullable|string|max:255',
            'items.*.fulfillment_type' => 'nullable|in:fbm,fba,jit',
            'items.*.currency'         => 'nullable|string|size:3',
        ];
    }

    /**
     * Create or refresh a channel row. Shared by the OAuth callback and the
     * Amazon credential wizard so both paths apply identical defaults.
     */
    private function upsertChannel(int|string $tenantId, string $platform, string $sellerId, array $attributes): EcommerceChannel
    {
        $warehouse = Warehouse::where('tenant_id', $tenantId)
            ->orderByDesc('is_default')
            ->orderBy('created_at')
            ->first();

        $expenseCategory = ExpenseCategory::firstOrCreate(
            ['tenant_id' => $tenantId, 'name' => $this->registry->label($platform) . ' Fees'],
            ['is_active' => true, 'group' => 'channel_fees']
        );

        return EcommerceChannel::updateOrCreate(
            [
                'tenant_id'          => $tenantId,
                'platform'           => $platform,
                'external_seller_id' => $sellerId,
            ],
            array_merge([
                'name'                     => $this->registry->label($platform) . " ({$sellerId})",
                'default_fulfillment_type' => 'fbm',
                'fee_percentage'           => $this->registry->defaultFeePercentage($platform),
                'fee_source'               => 'estimated',
                'warehouse_id'             => $warehouse?->id,
                'expense_category_id'      => $expenseCategory?->id,
                'refresh_token_expires_at' => match ($platform) {
                    'amazon' => now()->addYear(),
                    'ebay'   => now()->addMonths(18),
                    'tiktok' => now()->addDays(90),
                    default  => null,
                },
                'is_connected'             => true,
                'sync_status'              => 'idle',
                'sync_error_message'       => null,
                'consecutive_failures'     => 0,
            ], $attributes)
        );
    }
}
