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

        Log::info("Tenant {$tenant->subdomain} subscription expired — access suspended.");
    }
}
