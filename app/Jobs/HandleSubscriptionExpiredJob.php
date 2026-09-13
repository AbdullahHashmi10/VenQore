<?php

namespace App\Jobs;

use App\Models\Tenant;
use App\Services\PlanRepository;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * HandleSubscriptionExpiredJob — Phase 2.2
 *
 * Fired when a subscription fully expires (period is over).
 * This is when we actually suspend access.
 */
class HandleSubscriptionExpiredJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(private readonly array $data) {}

    public function handle(): void
    {
        $subscriptionId = (string) ($this->data['id'] ?? '');

        $tenant = Tenant::where('lemon_squeezy_subscription_id', $subscriptionId)->first();

        if (!$tenant) {
            Log::warning("HandleSubscriptionExpiredJob: No tenant found for {$subscriptionId}");
            return;
        }

        app()->instance('current.tenant', $tenant);

        $tenant->update(['status' => 'cancelled']);

        // Remove Lemon Squeezy-sourced add-on overrides so features are
        // revoked when the subscription period actually ends.
        $addonOverrideKeys = ['woocommerce', 'smart_capture'];
        $removed = DB::table('tenant_plan_overrides')
            ->where('tenant_id', $tenant->id)
            ->whereIn('override_key', $addonOverrideKeys)
            ->where(function($q) {
                $q->where('reason', 'like', '%via Lemon Squeezy%')
                  ->orWhere('reason', 'like', '%(Lemon Squeezy)%');
            })
            ->delete();

        if ($removed > 0) {
            PlanRepository::invalidateTenantCache($tenant->id);
            Log::info("HandleSubscriptionExpiredJob: Removed {$removed} add-on override(s) for tenant {$tenant->id} on expiry.");
        }

        Log::info("Tenant {$tenant->slug} subscription expired — access suspended.");
    }
}

