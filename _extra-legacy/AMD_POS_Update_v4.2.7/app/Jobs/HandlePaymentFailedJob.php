<?php

namespace App\Jobs;

use App\Mail\PaymentFailedMail;
use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * HandlePaymentFailedJob — Phase 2.2
 *
 * Fired on 'subscription_payment_failed'.
 * Notifies the user their card failed without immediately suspending access.
 * Lemon Squeezy has its own retry logic — we just need to let the user know.
 */
class HandlePaymentFailedJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(private readonly array $data) {}

    public function handle(): void
    {
        $subscriptionId = (string) ($this->data['id'] ?? '');

        $tenant = Tenant::where('lemon_squeezy_subscription_id', $subscriptionId)->first();

        if (!$tenant) {
            Log::warning("HandlePaymentFailedJob: No tenant for {$subscriptionId}");
            return;
        }

        app()->instance('current.tenant', $tenant);

        // Find the admin user to email via TenantUser pivot
        $adminUser = \App\Models\User::whereHas('memberships', function ($q) use ($tenant) {
            $q->where('tenant_id', $tenant->id)->where('role', 'platform_admin');
        })->first();

        if ($adminUser) {
            Mail::to($adminUser->email)->send(new PaymentFailedMail($tenant, $adminUser));
        }

        Log::info("Payment failed email sent for tenant {$tenant->subdomain}");
    }
}
