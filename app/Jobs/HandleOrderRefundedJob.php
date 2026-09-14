<?php

namespace App\Jobs;

use App\Mail\OrderRefundNeedsReviewMail;
use App\Models\Tenant;
use App\Services\LemonSqueezyCheckoutService;
use App\Services\PlanAiAllowance;
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
 * HandleOrderRefundedJob
 *
 * Fired on 'order_refunded' — a one-time Lemon Squeezy order was fully or
 * partially refunded. Before this job existed the webhook controller matched
 * this event to nothing (the `default` arm just logs it).
 *
 * A one-time order pays for very different things depending on which variant
 * was bought: an AI top-up, a BYOK unlock, a seat/location/register/catalogue
 * add-on, a channel sync add-on, the upload service, or — if it's a brand
 * new customer — an entire lifetime-deal tenant. This job only auto-reverses
 * the two cases that are both unambiguous and safe to reverse unattended:
 *
 *   - AI top-up: exactly undoes the fixed grant LemonSqueezyCheckoutService
 *     ::incrementAiPages() made for this same variant.
 *   - BYOK unlock: drops the tenant off unlimited/unmetered AI back to
 *     whatever its plan alone provides.
 *
 * Everything else is deliberately left to a human:
 *   - A lifetime-deal order provisions an entire tenant. There is no
 *     "un-provision a tenant" operation safe enough to fire unattended from a
 *     webhook — G07/G13 both warn against exactly this kind of automatic,
 *     data-destructive action.
 *   - Seat/location/register/catalogue/channel-sync add-ons only ever raise a
 *     limit number or flip a boolean override. ProvisionTenantJob reads the
 *     purchased quantity off the live checkout request, not something
 *     persisted per-order, so this job has no reliable record of how much
 *     THIS specific refunded order granted — guessing a decrement could
 *     remove capacity a different, still-valid purchase paid for.
 *
 * Those are logged with full context and emailed to the ops inbox instead of
 * being silently absorbed into an unhandled-event log line indistinguishable
 * from a truly unhandled event type.
 */
class HandleOrderRefundedJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries  = 3;
    public int $backoff = 30;

    public function __construct(private readonly array $payload) {}

    public function handle(): void
    {
        // Same extraction chain ProvisionTenantJob uses for the matching
        // order_created event, so a refund is matched against a purchase the
        // same way it was originally granted.
        $variantId = data_get($this->payload, 'data.attributes.variant_id')
            ?? data_get($this->payload, 'variant_id')
            ?? data_get($this->payload, 'attributes.variant_id')
            ?? data_get($this->payload, 'meta.custom_data.variant_id')
            ?? data_get($this->payload, 'custom_data.variant_id')
            ?? data_get($this->payload, 'data.attributes.first_order_item.variant_id');

        $productName = data_get($this->payload, 'data.attributes.product_name')
            ?? data_get($this->payload, 'product_name')
            ?? data_get($this->payload, 'attributes.product_name');

        $orderId    = data_get($this->payload, 'data.attributes.order_id')
            ?? data_get($this->payload, 'order_id')
            ?? data_get($this->payload, 'attributes.order_id')
            ?? data_get($this->payload, 'data.id');

        $customerId = data_get($this->payload, 'data.attributes.customer_id')
            ?? data_get($this->payload, 'customer_id')
            ?? data_get($this->payload, 'attributes.customer_id');

        $tenantId = data_get($this->payload, 'meta.custom_data.tenant_id')
            ?? data_get($this->payload, 'custom_data.tenant_id');

        $variantIdStr = $variantId !== null ? (string) $variantId : '';

        $context = [
            'order_id'     => $orderId,
            'customer_id'  => $customerId,
            'variant_id'   => $variantIdStr,
            'product_name' => $productName,
            'tenant_id'    => $tenantId,
        ];

        $aiTopupId = config('services.lemon_squeezy.ai_topup_addon_id');
        $byokId    = config('pricing.add_ons.byok.variant_id');

        if ($tenantId && $variantIdStr !== '' && $aiTopupId && $variantIdStr === (string) $aiTopupId) {
            app(LemonSqueezyCheckoutService::class)->reverseAiTopup((int) $tenantId, 200);
            Log::info('HandleOrderRefundedJob: reversed AI top-up on refund', $context);
            return;
        }

        if ($tenantId && $variantIdStr !== '' && $byokId && $byokId !== 'REPLACE_ME' && $variantIdStr === (string) $byokId) {
            $tenant = Tenant::find($tenantId);
            if ($tenant && $tenant->ai_status === 'byok') {
                DB::table('tenant_plan_overrides')
                    ->where('tenant_id', $tenant->id)
                    ->where('override_key', 'smart_capture')
                    ->where('reason', 'like', '%(byok) via Lemon Squeezy%')
                    ->delete();

                $tenant->update([
                    'ai_status'        => 'none',
                    'ai_queries_limit' => 0,
                    'ai_pages_limit'   => 0,
                ]);
                PlanAiAllowance::applyTo($tenant);
                PlanRepository::invalidateTenantCache($tenant->id);
                Log::info('HandleOrderRefundedJob: reversed BYOK unlock on refund', $context);
            }
            return;
        }

        // A lifetime-deal tenant, a seat/location/register/catalogue add-on,
        // a channel sync add-on, or the upload service — flag for a human
        // rather than guess at a reversal.
        Log::warning('HandleOrderRefundedJob: order refunded, needs manual review — no automatic reversal exists for this purchase type', $context);

        Mail::to(config('mail.notifications.contact'))->send(new OrderRefundNeedsReviewMail($context));
    }
}
