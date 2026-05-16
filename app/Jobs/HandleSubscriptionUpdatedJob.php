<?php

namespace App\Jobs;

use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * HandleSubscriptionUpdatedJob — Phase 2.2
 *
 * Fired on 'subscription_updated' and 'subscription_payment_recovered'.
 * Updates the tenant's plan and status when a customer upgrades,
 * downgrades, or recovers from a failed payment.
 */
class HandleSubscriptionUpdatedJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 10;

    public function __construct(private readonly array $data) {}

    public function handle(): void
    {
        $subscriptionId = (string) ($this->data['id'] ?? '');
        $attributes     = $this->data['attributes'] ?? [];
        $variantId      = (string) ($attributes['variant_id'] ?? '');
        $lsStatus       = $attributes['status'] ?? 'active';

        $tenant = Tenant::withoutTenantScope()
            ->where('lemon_squeezy_subscription_id', $subscriptionId)
            ->first();

        if (!$tenant) {
            Log::warning("HandleSubscriptionUpdatedJob: No tenant found for subscription {$subscriptionId}");
            return;
        }

        // Map Lemon Squeezy status → VenQore status
        $status = match ($lsStatus) {
            'active'         => 'active',
            'on_trial'       => 'trial',
            'paused'         => 'suspended',
            'past_due'       => 'active',     // still accessible during grace period
            'cancelled'      => 'active',     // still active until period ends
            'expired'        => 'suspended',
            default          => $tenant->status,
        };

        // Resolve new plan
        $plan = match ($variantId) {
            (string) config('services.lemon_squeezy.starter_variant_id')  => 'starter',
            (string) config('services.lemon_squeezy.growth_variant_id')   => 'growth',
            (string) config('services.lemon_squeezy.business_variant_id') => 'business',
            default => $tenant->plan,
        };

        $tenant->update(['plan' => $plan, 'status' => $status]);

        Log::info("Tenant {$tenant->subdomain} updated: plan={$plan}, status={$status}");
    }
}
