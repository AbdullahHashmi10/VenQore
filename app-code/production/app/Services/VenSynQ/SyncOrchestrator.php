<?php

namespace App\Services\VenSynQ;

use App\Models\EcommerceChannel;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Services\SmartFulfillmentService;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * SyncOrchestrator — the one place that turns a connected channel into local sales.
 *
 * ── Why this exists ───────────────────────────────────────────────────────────
 * VenSynQController::fetchLiveOrders() and VenSynQSyncJob::handle() contained two
 * near-identical copies of the same 50-line sync loop. They had already drifted:
 * the controller resolved clients via a helper with a default arm, the job used a
 * bare match() that threw \UnhandledMatchError. Fixing a bug in one never fixed
 * the other. CLAUDE.md requires business logic in Services and thin controllers,
 * so the loop lives here now and both callers delegate.
 */
class SyncOrchestrator
{
    public function __construct(
        private SmartFulfillmentService $fulfillment,
        private PlatformRegistry $registry,
    ) {
    }

    /**
     * Sync every connected channel for one tenant.
     *
     * @return array{synced: int, failed: int, channels: array<int, array<string, mixed>>}
     */
    public function syncTenant(Tenant $tenant, ?int $userId = null): array
    {
        $channels = EcommerceChannel::withoutTenantScope()
            ->where('tenant_id', $tenant->id)
            ->where('is_connected', true)
            ->get();

        $result = ['synced' => 0, 'failed' => 0, 'channels' => []];

        foreach ($channels as $channel) {
            $outcome = $this->syncChannel($channel, $tenant, $userId);

            $result['synced'] += $outcome['new_orders'];
            $result['failed'] += $outcome['ok'] ? 0 : 1;
            $result['channels'][] = $outcome;
        }

        return $result;
    }

    /**
     * Sync a single channel. Never throws — every failure is captured onto the
     * channel row so the dashboard's Error Inspector can show and retry it.
     *
     * @return array{channel_id: int, channel_name: string, ok: bool, new_orders: int, message: string}
     */
    public function syncChannel(EcommerceChannel $channel, ?Tenant $tenant = null, ?int $userId = null): array
    {
        $tenant ??= Tenant::find($channel->tenant_id);

        if (!$tenant) {
            return $this->failure($channel, 'Owning tenant no longer exists.');
        }

        // Bind tenant so HasTenant-scoped writes inside SmartFulfillmentService
        // land in the right tenant. Restored by the caller (see withTenant()).
        app()->instance('current.tenant', $tenant);

        $userId ??= $this->resolveOperatorId($tenant);

        if (!$userId) {
            return $this->failure($channel, 'No user is attached to this store, so orders cannot be attributed.');
        }

        // Catch Throwable, not Exception. \UnhandledMatchError and \TypeError are
        // Errors — the previous `catch (\Exception)` let them escape and abort the
        // entire run, leaving channels permanently stuck in sync_status='syncing'.
        try {
            $client = $this->registry->resolve($channel->platform);

            $channel->forceFill([
                'sync_status'        => 'syncing',
                'sync_error_message' => null,
            ])->save();

            $items = $client->fetchOrders($channel->oauth_access_token ?? '');

            if (empty($items)) {
                $channel->forceFill([
                    'sync_status'          => 'idle',
                    'last_synced_at'       => now(),
                    'consecutive_failures' => 0,
                ])->save();

                return $this->success($channel, 0, 'Up to date — no new orders.');
            }

            $newOrders = 0;

            // processDropshipSale() dedupes on channel_order_id internally, so a
            // replayed order is a no-op rather than a duplicate sale.
            foreach (collect($items)->groupBy('channel_order_id') as $orderId => $lines) {
                try {
                    $sale = $this->fulfillment->processDropshipSale(
                        $lines->toArray(),
                        $channel->id,
                        $tenant->id,
                        $userId
                    );

                    if ($sale->wasRecentlyCreated) {
                        $newOrders++;
                    }
                } catch (Throwable $e) {
                    // One bad order (unmapped SKU, missing tax code) must not
                    // abort the other 99. Log it and keep going — it surfaces in
                    // the Action Required queue.
                    Log::warning('[VenSynQ] Order skipped during sync', [
                        'channel_id' => $channel->id,
                        'platform'   => $channel->platform,
                        'order_id'   => $orderId,
                        'error'      => $e->getMessage(),
                    ]);
                }
            }

            $channel->forceFill([
                'sync_status'          => 'idle',
                'last_synced_at'       => now(),
                'consecutive_failures' => 0,
            ])->save();

            return $this->success($channel, $newOrders, $newOrders > 0
                ? "{$newOrders} new order(s) imported."
                : 'Up to date — no new orders.');
        } catch (Throwable $e) {
            Log::error('[VenSynQ] Channel sync failed', [
                'channel_id' => $channel->id,
                'platform'   => $channel->platform,
                'error'      => $e->getMessage(),
            ]);

            return $this->failure($channel, $e->getMessage());
        }
    }

    /**
     * Push an absolute stock level for one SKU to every connected channel that
     * supports stock writes. Called after a POS sale changes on-hand quantity.
     *
     * Returns the channels that refused the update so the caller can flag them
     * in the Action Required queue rather than failing the sale itself — a POS
     * sale must never roll back because a marketplace API was slow.
     *
     * @return array<int, string> channel names that could not be updated
     */
    public function pushStockForSku(Tenant $tenant, string $sku, float $quantity): array
    {
        $channels = EcommerceChannel::withoutTenantScope()
            ->where('tenant_id', $tenant->id)
            ->where('is_connected', true)
            ->get();

        $failed = [];

        foreach ($channels as $channel) {
            try {
                $client = $this->registry->resolve($channel->platform);

                if (!$client->pushStock($channel->oauth_access_token ?? '', $sku, $quantity)) {
                    $failed[] = $channel->name;
                }
            } catch (Throwable $e) {
                Log::warning('[VenSynQ] Stock push failed', [
                    'channel_id' => $channel->id,
                    'sku'        => $sku,
                    'error'      => $e->getMessage(),
                ]);
                $failed[] = $channel->name;
            }
        }

        return $failed;
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Find a user who can own the imported sales.
     *
     * The previous implementation ran User::where('tenant_id', $id) — but per
     * CLAUDE.md a User belongs to many tenants through the TenantUser pivot, and
     * users has no tenant_id column. That query either threw a SQL error or, on
     * schemas where the column lingers, silently returned nothing and fell back
     * to the hardcoded `?? 1`, attributing another store's sales to user #1.
     */
    private function resolveOperatorId(Tenant $tenant): ?int
    {
        $membership = TenantUser::where('tenant_id', $tenant->id)
            ->whereNotNull('user_id')       // invited-but-unaccepted rows have none
            ->where('status', 'active')     // never attribute sales to a suspended account
            ->orderByRaw("CASE WHEN role = 'owner' THEN 0 WHEN role = 'admin' THEN 1 ELSE 2 END")
            ->orderBy('id')
            ->first();

        return $membership?->user_id;
    }

    private function success(EcommerceChannel $channel, int $newOrders, string $message): array
    {
        return [
            'channel_id'   => $channel->id,
            'channel_name' => $channel->name,
            'ok'           => true,
            'new_orders'   => $newOrders,
            'message'      => $message,
        ];
    }

    private function failure(EcommerceChannel $channel, string $message): array
    {
        $channel->forceFill([
            'sync_status'          => 'error',
            'sync_error_message'   => $message,
            'last_error_at'        => now(),
            'consecutive_failures' => (int) ($channel->consecutive_failures ?? 0) + 1,
        ])->save();

        return [
            'channel_id'   => $channel->id,
            'channel_name' => $channel->name,
            'ok'           => false,
            'new_orders'   => 0,
            'message'      => $message,
        ];
    }
}
