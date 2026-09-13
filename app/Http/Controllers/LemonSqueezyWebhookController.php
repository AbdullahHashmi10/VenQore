<?php

namespace App\Http\Controllers;

use App\Jobs\ProvisionTenantJob;
use App\Jobs\HandleSubscriptionUpdatedJob;
use App\Jobs\HandleSubscriptionCancelledJob;
use App\Jobs\HandleSubscriptionExpiredJob;
use App\Jobs\HandlePaymentFailedJob;
use App\Jobs\HandleOrderRefundedJob;
use App\Jobs\HandleSubscriptionPaymentRefundedJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * LemonSqueezyWebhookController — Phase 2.1
 *
 * Receives all lifecycle events from Lemon Squeezy and dispatches
 * them to queued jobs. The controller itself is intentionally thin —
 * it validates the event type, dispatches to a queue, and returns 200
 * within milliseconds. All processing happens async.
 *
 * CRITICAL: Never do heavy work synchronously in a webhook handler.
 * If this request times out, Lemon Squeezy will retry — causing
 * duplicate provisioning if not handled idempotently in the job.
 *
 * Route: POST /api/webhooks/lemon-squeezy
 * Middleware: lemon-squeezy.signature (verifies HMAC-SHA256 signature)
 */
class LemonSqueezyWebhookController extends Controller
{
    public function handle(Request $request): JsonResponse
    {
        $event = $request->input('meta.event_name');
        $data  = $request->input('data', []);

        Log::info("Lemon Squeezy webhook received: {$event}", [
            'customer_id' => data_get($data, 'attributes.customer_id'),
        ]);

        // ── Route to the correct queued job ───────────────────────────────
        match ($event) {
            // New subscription created OR one-time order (appsumo-style)
            'subscription_created',
            'order_created'           => ProvisionTenantJob::dispatch($request->all())->onQueue('provisioning'),

            // Plan changed (upgrade or downgrade)
            'subscription_updated'    => HandleSubscriptionUpdatedJob::dispatch($data)->onQueue('provisioning'),

            // Customer cancelled (but still active until period end)
            'subscription_cancelled'  => HandleSubscriptionCancelledJob::dispatch($data)->onQueue('provisioning'),

            // Subscription fully expired (access should be cut off)
            'subscription_expired'    => HandleSubscriptionExpiredJob::dispatch($data)->onQueue('provisioning'),

            // Payment failed — notify user, don't suspend immediately
            'subscription_payment_failed' => HandlePaymentFailedJob::dispatch($data)->onQueue('emails'),

            // Payment recovered after failure
            'subscription_payment_recovered' => HandleSubscriptionUpdatedJob::dispatch($data)->onQueue('provisioning'),

            // A specific recurring charge on an otherwise-live subscription
            // was refunded (goodwill refund, dispute or chargeback). Suspend
            // access now rather than waiting for a separate expiry event that
            // may be weeks away or may never come.
            'subscription_payment_refunded' => HandleSubscriptionPaymentRefundedJob::dispatch($data)->onQueue('provisioning'),

            // A one-time order (AI top-up, BYOK unlock, lifetime deal, or an
            // add-on) was fully or partially refunded. Needs the full payload
            // (not just `data`) because add-on purchases are only linkable to
            // a tenant via meta.custom_data.tenant_id.
            'order_refunded' => HandleOrderRefundedJob::dispatch($request->all())->onQueue('provisioning'),

            // Unknown event — log and ignore safely
            default => Log::info("Unhandled Lemon Squeezy event: {$event}"),
        };

        // Always return 200 quickly. Lemon Squeezy retries on non-2xx.
        return response()->json(['ok' => true]);
    }
}
