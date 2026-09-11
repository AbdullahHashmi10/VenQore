<?php

namespace App\Jobs;

use App\Mail\SubscriptionPaymentRefundedMail;
use App\Models\Tenant;
use App\Services\PlanRepository;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * HandleSubscriptionPaymentRefundedJob
 *
 * Fired on 'subscription_payment_refunded' — a specific recurring charge on
 * an otherwise-live subscription was refunded (goodwill refund, dispute, or
 * chargeback). Before this job existed the webhook controller matched this
 * event to nothing (its `default` arm just logs it), so a refunded customer
 * kept full access until Lemon Squeezy separately reported the subscription
 * itself as expired or cancelled — which may be weeks away, or may never
 * happen if the subscription otherwise stays current.
 *
 * `data` here is a Subscription Invoice object, not a Subscription object —
 * see the comment in HandleSubscriptionUpdatedJob for the field-shape
 * difference this implies.
 *
 * This suspends access immediately, the same way
 * HandleSubscriptionExpiredJob does, and emails the tenant's platform admin
 * so a human can review whether this was a legitimate partial refund (in
 * which case they can manually reinstate the store) or the leading edge of a
 * chargeback. It deliberately does NOT try to guess which — that is exactly
 * the kind of "silently reverse money" logic G07/G14 warn against.
 */
class HandleSubscriptionPaymentRefundedJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(private readonly array $data) {}

    public function handle(): void
    {
        $attributes     = $this->data['attributes'] ?? [];
        $subscriptionId = (string) ($attributes['subscription_id'] ?? $this->data['id'] ?? '');
        $refundedAmount = $attributes['refunded_amount_usd'] ?? $attributes['refunded_amount'] ?? null;

        if ($subscriptionId === '') {
            Log::warning('HandleSubscriptionPaymentRefundedJob: payload carried no subscription_id', [
                'invoice_id' => $this->data['id'] ?? null,
            ]);
            return;
        }

        $tenant = Tenant::where('lemon_squeezy_subscription_id', $subscriptionId)->first();

        if (!$tenant) {
            Log::warning("HandleSubscriptionPaymentRefundedJob: No tenant found for subscription {$subscriptionId}");
            return;
        }

        app()->instance('current.tenant', $tenant);

        $tenant->update(['status' => 'suspended']);

        // Same add-on cleanup HandleSubscriptionExpiredJob performs on a full
        // expiry — a refunded payment is at least as serious a signal.
        $addonOverrideKeys = ['woocommerce', 'smart_capture'];
        $removed = DB::table('tenant_plan_overrides')
            ->where('tenant_id', $tenant->id)
            ->whereIn('override_key', $addonOverrideKeys)
            ->where(function ($q) {
                $q->where('reason', 'like', '%via Lemon Squeezy%')
                  ->orWhere('reason', 'like', '%(Lemon Squeezy)%');
            })
            ->delete();

        if ($removed > 0) {
            PlanRepository::invalidateTenantCache($tenant->id);
        }

        $adminUser = \App\Models\User::whereHas('memberships', function ($q) use ($tenant) {
            $q->where('tenant_id', $tenant->id)->where('role', 'platform_admin');
        })->first();

        if ($adminUser) {
            Mail::to($adminUser->email)
                ->send(new SubscriptionPaymentRefundedMail($tenant, $adminUser));
        }

        Log::warning("Tenant {$tenant->slug} subscription payment refunded (amount: " . ($refundedAmount ?? 'unknown') . ") — access suspended pending review.");
    }
}
