<?php

namespace App\Services;

use App\Jobs\ProvisionTenantJob;
use App\Models\Tenant;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * LemonSqueezySyncService — webhook safety net
 * ---------------------------------------------------------------------------
 * Provisioning normally happens when Lemon Squeezy POSTs a `subscription_created`
 * webhook to /api/webhooks/lemon-squeezy. That is a single point of failure:
 *
 *   • On a local dev server (APP_URL=http://127.0.0.1:8000) Lemon Squeezy can
 *     never reach us at all, so a successful test payment silently does nothing.
 *   • In production, a webhook can be delayed, dropped, or rejected while the
 *     customer is already staring at "Thanks for your order!".
 *
 * This service closes that gap by PULLING the truth from the Lemon Squeezy API
 * instead of waiting to be pushed. It asks "does this tenant's owner have any
 * live subscriptions in our store?" and, if so, replays them through the exact
 * same ProvisionTenantJob the webhook would have used — so the outcome is
 * byte-for-byte identical to the webhook path, including add-on entitlements.
 *
 * Deliberately scoped to SUBSCRIPTIONS only. One-time orders (the onboarding
 * upload service) create support tickets and are not idempotent, so replaying
 * them would spam duplicate tickets.
 */
class LemonSqueezySyncService
{
    protected const API_BASE = 'https://api.lemonsqueezy.com/v1';

    /** Subscription states that should grant access. */
    protected const LIVE_STATUSES = ['active', 'on_trial', 'past_due', 'cancelled'];

    /**
     * Pull this tenant's subscriptions from Lemon Squeezy and apply them.
     *
     * @return array{synced: bool, plan: ?string, message: string, count: int}
     */
    public function syncTenant(Tenant $tenant): array
    {
        $apiKey  = config('services.lemon_squeezy.api_key');
        $storeId = config('services.lemon_squeezy.store_id');

        if (!$apiKey || !$storeId) {
            return $this->result(false, null, 'Lemon Squeezy is not configured on this server.', 0);
        }

        $email = $tenant->ownerEmail();
        if (!$email) {
            return $this->result(false, null, 'This store has no owner email to match against.', 0);
        }

        $subscriptions = $this->fetchSubscriptions($apiKey, $storeId, $email);

        if ($subscriptions === null) {
            return $this->result(false, null, 'Could not reach Lemon Squeezy. Please try again in a moment.', 0);
        }

        // Keep only subscriptions that should actually grant access, oldest
        // first so the newest one wins when several exist (plan then add-ons
        // are each provisioned independently by ProvisionTenantJob).
        //
        // The email is re-checked here rather than trusting filter[user_email]
        // alone. If that filter were ever ignored or renamed by the API, an
        // unfiltered list would otherwise let one customer's subscription be
        // applied to another tenant — so we verify ownership locally too.
        $live = array_values(array_filter($subscriptions, function ($sub) use ($email) {
            $status = data_get($sub, 'attributes.status');
            $subEmail = data_get($sub, 'attributes.user_email');

            return in_array($status, self::LIVE_STATUSES, true)
                && is_string($subEmail)
                && strcasecmp(trim($subEmail), trim($email)) === 0;
        }));

        if (empty($live)) {
            return $this->result(
                false,
                null,
                'No active subscription found for ' . $email . ' yet. If you just paid, wait a few seconds and try again.',
                0
            );
        }

        usort($live, fn ($a, $b) => strcmp(
            (string) data_get($a, 'attributes.created_at'),
            (string) data_get($b, 'attributes.created_at')
        ));

        $applied = 0;
        foreach ($live as $sub) {
            if ($this->applySubscription($tenant, $sub)) {
                $applied++;
            }
        }

        $tenant->refresh();

        // ProvisionTenantJob sets plan + status but has no renewal date to work
        // from (the create webhook doesn't carry one either — subscription_updated
        // supplies it later). We do have it here, so fill it in.
        $this->applyRenewalWindow($tenant, $live);

        \App\Services\PlanRepository::invalidateTenantCache($tenant->id);

        if ($applied === 0) {
            return $this->result(
                true,
                $tenant->plan,
                'Your subscription was already up to date.',
                count($live)
            );
        }

        return $this->result(
            true,
            $tenant->plan,
            'Subscription synced — your ' . ucfirst((string) $tenant->plan) . ' plan is now active.',
            $applied
        );
    }

    /**
     * GET /v1/subscriptions filtered to our store and this customer's email.
     * Returns null on transport/API failure (distinct from "none found").
     */
    protected function fetchSubscriptions(string $apiKey, string|int $storeId, string $email): ?array
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Accept'        => 'application/vnd.api+json',
                'Content-Type'  => 'application/vnd.api+json',
            ])->timeout(15)->get(self::API_BASE . '/subscriptions', [
                'filter[store_id]'  => (string) $storeId,
                'filter[user_email]' => $email,
                'page[size]'        => 50,
            ]);
        } catch (\Throwable $e) {
            Log::error('LemonSqueezySyncService: subscriptions request threw: ' . $e->getMessage());
            return null;
        }

        if ($response->failed()) {
            Log::error('LemonSqueezySyncService: subscriptions request failed: ' . $response->body());
            return null;
        }

        return $response->json('data') ?? [];
    }

    /**
     * Replay one subscription through ProvisionTenantJob by rebuilding the
     * webhook payload shape it expects. Running it synchronously means the
     * HTTP response we return already reflects the applied plan.
     *
     * @return bool true if the job ran (it is internally idempotent).
     */
    protected function applySubscription(Tenant $tenant, array $sub): bool
    {
        $attributes = data_get($sub, 'attributes', []);
        $subscriptionId = data_get($sub, 'id');

        // Already provisioned against this exact subscription — nothing to do.
        // (ProvisionTenantJob would no-op anyway; this saves the round trip.)
        if ($subscriptionId && Tenant::where('lemon_squeezy_subscription_id', $subscriptionId)->exists()) {
            return false;
        }

        $payload = [
            'meta' => [
                'event_name'  => 'subscription_created',
                'custom_data' => ['tenant_id' => (string) $tenant->id],
            ],
            'data' => [
                'id'         => (string) $subscriptionId,
                'type'       => 'subscriptions',
                'attributes' => [
                    'user_email'      => data_get($attributes, 'user_email'),
                    'user_name'       => data_get($attributes, 'user_name'),
                    'variant_id'      => data_get($attributes, 'variant_id'),
                    'product_name'    => data_get($attributes, 'product_name'),
                    'order_id'        => data_get($attributes, 'order_id'),
                    'customer_id'     => data_get($attributes, 'customer_id'),
                    'subscription_id' => $subscriptionId,
                    'status'          => data_get($attributes, 'status'),
                ],
            ],
        ];

        try {
            // Synchronous on purpose: the user is waiting on the response.
            ProvisionTenantJob::dispatchSync($payload);
        } catch (\Throwable $e) {
            Log::error("LemonSqueezySyncService: provisioning failed for tenant {$tenant->id}: " . $e->getMessage());
            return false;
        }

        Log::info("LemonSqueezySyncService: replayed subscription {$subscriptionId} for tenant {$tenant->id} (webhook fallback).");

        return true;
    }

    /**
     * Set subscription_ends_at from the furthest renewal/end date we saw, and
     * lift the view-only flag now that the store is paid up.
     */
    protected function applyRenewalWindow(Tenant $tenant, array $subscriptions): void
    {
        $furthest = null;

        foreach ($subscriptions as $sub) {
            $date = data_get($sub, 'attributes.renews_at') ?: data_get($sub, 'attributes.ends_at');
            if (!$date) {
                continue;
            }

            try {
                $parsed = \Illuminate\Support\Carbon::parse($date);
            } catch (\Throwable) {
                continue;
            }

            if ($furthest === null || $parsed->greaterThan($furthest)) {
                $furthest = $parsed;
            }
        }

        $updates = [];

        if ($furthest) {
            $updates['subscription_ends_at'] = $furthest;
        }

        if ($tenant->view_only_since !== null) {
            $updates['view_only_since'] = null;
        }

        if ($tenant->status !== 'active') {
            $updates['status'] = 'active';
        }

        if (!empty($updates)) {
            $tenant->update($updates);
        }
    }

    protected function result(bool $synced, ?string $plan, string $message, int $count): array
    {
        return [
            'synced'  => $synced,
            'plan'    => $plan,
            'message' => $message,
            'count'   => $count,
        ];
    }
}
