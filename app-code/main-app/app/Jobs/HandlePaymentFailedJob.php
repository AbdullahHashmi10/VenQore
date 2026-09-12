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
        // `data` here is a Subscription Invoice object (this fires on
        // 'subscription_payment_failed'), NOT a Subscription object — its own
        // `id` is the invoice id. The subscription is named in
        // attributes.subscription_id. Reading $this->data['id'] directly
        // looked up an invoice id against tenants.lemon_squeezy_subscription_id
        // and could never match, so this job silently found no tenant and the
        // failed-payment email never sent. Fall back to `id` only in case a
        // caller/test ever passes a bare Subscription object instead.
        $subscriptionId = (string) (
            $this->data['attributes']['subscription_id']
            ?? $this->data['id']
            ?? ''
        );

        $tenant = Tenant::where('lemon_squeezy_subscription_id', $subscriptionId)->first();

        if (!$tenant) {
            Log::warning("HandlePaymentFailedJob: No tenant for {$subscriptionId}");
            return;
        }

        app()->instance('current.tenant', $tenant);

        // Find the admin/owner user to email
        $adminUser = $tenant->ownerUser();

        if ($adminUser) {
            Mail::to($adminUser->email)->send(new PaymentFailedMail($tenant, $adminUser));
        }

        Log::info("Payment failed email sent for tenant {$tenant->subdomain}");
    }
}
