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

        $tenant = Tenant::where('lemon_squeezy_subscription_id', $subscriptionId)->first();

        if (!$tenant) {
            Log::warning("HandleSubscriptionUpdatedJob: No tenant found for subscription {$subscriptionId}");
            return;
        }

        // Map Lemon Squeezy status → VenQore status. Shared with the checkout
        // and "Already Paid?" paths so they can never disagree again.
        $status = \App\Services\LemonSqueezyStatus::toTenantStatus($lsStatus, $tenant->status);

        // Resolve new plan
        $plan = $tenant->plan;
        
        $counterVariants = [
            (string) config('services.lemon_squeezy.counter_variant_id'),
            (string) config('services.lemon_squeezy.counter_annual_variant_id'),
        ];
        $starterVariants = [
            (string) config('services.lemon_squeezy.starter_variant_id'),
            (string) config('services.lemon_squeezy.starter_annual_variant_id'),
        ];
        $growthVariants = [
            (string) config('services.lemon_squeezy.growth_variant_id'),
            (string) config('services.lemon_squeezy.growth_annual_variant_id'),
        ];
        $businessVariants = [
            (string) config('services.lemon_squeezy.business_variant_id'),
            (string) config('services.lemon_squeezy.business_annual_variant_id'),
        ];
        $ltd1Variants = [
            (string) config('services.lemon_squeezy.starter_ltd_variant_id'),
        ];
        $ltd2Variants = [
            (string) config('services.lemon_squeezy.growth_ltd_variant_id'),
        ];
        $ltd3Variants = [
            (string) config('services.lemon_squeezy.business_ltd_variant_id'),
        ];

        if (in_array($variantId, array_filter($counterVariants))) {
            $plan = 'counter';
        } elseif (in_array($variantId, array_filter($starterVariants))) {
            $plan = 'starter';
        } elseif (in_array($variantId, array_filter($growthVariants))) {
            $plan = 'growth';
        } elseif (in_array($variantId, array_filter($businessVariants))) {
            $plan = 'business';
        } elseif (in_array($variantId, array_filter($ltd1Variants))) {
            $plan = 'ltd_1';
        } elseif (in_array($variantId, array_filter($ltd2Variants))) {
            $plan = 'ltd_2';
        } elseif (in_array($variantId, array_filter($ltd3Variants))) {
            $plan = 'ltd_3';
        }

        app()->instance('current.tenant', $tenant);

        $tenant->update(['plan' => $plan, 'status' => $status]);

        // A plan change moves the AI ceiling with it — the allowance is part of
        // what the plan is sold as, not a separate add-on.
        try {
            \App\Services\PlanAiAllowance::applyTo($tenant, $plan);
        } catch (\Throwable $e) {
            Log::warning("PlanAiAllowance failed for tenant {$tenant->id}: " . $e->getMessage());
        }

        Log::info("Tenant {$tenant->slug} updated: plan={$plan}, status={$status}");
    }
}
