<?php

namespace App\Jobs;

use App\Mail\SubscriptionCancelledMail;
use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * HandleSubscriptionCancelledJob — Phase 2.2
 *
 * Fired when a customer cancels their subscription.
 * Important: In Lemon Squeezy, 'cancelled' means they've requested cancellation
 * but are still active until the period ends. We do NOT suspend them immediately.
 * We send a confirmation email and update status when it actually expires.
 */
class HandleSubscriptionCancelledJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(private readonly array $data) {}

    public function handle(): void
    {
        $subscriptionId = (string) ($this->data['id'] ?? '');
        $attributes     = $this->data['attributes'] ?? [];
        $endsAt         = $attributes['ends_at'] ?? null;

        $tenant = Tenant::withoutTenantScope()
            ->where('lemon_squeezy_subscription_id', $subscriptionId)
            ->first();

        if (!$tenant) {
            Log::warning("HandleSubscriptionCancelledJob: No tenant found for {$subscriptionId}");
            return;
        }

        // Store end date but keep active — they paid for the period
        $tenant->update([
            'subscription_ends_at' => $endsAt ? \Carbon\Carbon::parse($endsAt) : now()->addDays(30),
        ]);

        // Find the admin user to email
        $adminUser = \App\Models\User::withoutTenantScope()
            ->where('tenant_id', $tenant->id)
            ->where('role', 'platform_admin')
            ->first();

        if ($adminUser) {
            Mail::to($adminUser->email)
                ->send(new SubscriptionCancelledMail($tenant, $adminUser));
        }

        Log::info("Tenant {$tenant->subdomain} cancelled — active until " . ($endsAt ?? 'N/A'));
    }
}
