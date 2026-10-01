<?php

namespace App\Services;

use App\Models\Tenant;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * TrialCreditService
 * ---------------------------------------------------------------------------
 * "Pay now without losing your free days."
 *
 * VenQore trials require no card, so the trial lives in our own `tenants`
 * table — Lemon Squeezy knows nothing about it. That creates a fairness
 * problem the moment a trialling store presses "Pay Now" on day 4 of 10:
 * we take a full month's money, and the 6 unused free days silently vanish.
 *
 * Lemon Squeezy cannot solve this for us:
 *
 *   • Trial length is fixed per product/variant in their dashboard. The
 *     Checkouts API has no per-customer trial override — the only trial lever
 *     is `checkout_options.skip_trial`, which removes it entirely.
 *   • `billing_anchor` only accepts a day-of-month (1-31), and setting it to
 *     null/0 wipes any active trial.
 *   • `PATCH /subscriptions/{id}` does accept an arbitrary `trial_ends_at`,
 *     but its behaviour on an *already-charged* subscription is undocumented,
 *     so we do not build revenue logic on it.
 *
 * So we convert the unused days into money instead of time: a single-use
 * discount, generated on the fly, worth exactly the fraction of the billing
 * period the customer has not yet consumed. They pay less today, keep every
 * day they were promised, and the renewal date stays clean (a normal full
 * cycle from the payment date, at full price, because `duration` is `once`).
 *
 *   Day 4 of a 10-day trial, $30/month plan
 *   → 6 unused days ÷ 30-day cycle = 20% credit
 *   → customer pays $24.00 today, renews at $30.00 in 30 days.
 *
 * Why a PERCENT discount and not a fixed cash amount:
 * a fixed `amount` is denominated in the store's currency, and VenQore sells
 * the same plans in USD and PKR through different variants. A percentage is
 * currency-agnostic, so the same code is correct whichever variant is being
 * bought. The trade-off is integer-percent granularity (a few cents), which
 * we absorb by deriving every figure we *display* from the same rounded
 * percentage — the customer is never quoted a number Lemon Squeezy won't
 * actually charge.
 *
 * @see https://docs.lemonsqueezy.com/api/discounts/create-discount
 */
class TrialCreditService
{
    protected const API_ENDPOINT = 'https://api.lemonsqueezy.com/v1/discounts';

    /** Nominal billing-period lengths used to prorate the credit. */
    public const MONTHLY_CYCLE_DAYS = 30;
    public const ANNUAL_CYCLE_DAYS  = 365;

    /**
     * How long a generated code stays valid. Long enough that a customer can
     * read the confirmation, think, and come back; short enough that the
     * credit can never drift more than a day away from the days they actually
     * still hold.
     */
    protected const CODE_TTL_HOURS = 24;

    /**
     * Lemon Squeezy rejects checkouts under $1.00, so a credit may never take
     * the first payment all the way to zero. Expressed as a percentage ceiling
     * so it stays currency-agnostic.
     */
    protected const MAX_CREDIT_PERCENT = 95;

    /**
     * Whole days of trial the tenant still holds. 0 when the trial is over,
     * was never set, or the tenant is no longer trialling.
     *
     * Uses ceil() so a customer mid-way through a day is credited for that
     * day — we would rather be a few hours generous than shortchange someone.
     *
     * Computed straight from timestamps rather than Carbon's diffInDays so the
     * result is identical to the formula the billing page already uses to show
     * "N days remaining" (ms ÷ 86400000, rounded up), and stable across Carbon
     * major versions where diffInDays flips between int and float.
     */
    public function daysRemaining(Tenant $tenant): int
    {
        if ($tenant->status !== 'trial' || !$tenant->trial_ends_at) {
            return 0;
        }

        $seconds = $tenant->trial_ends_at->getTimestamp() - now()->getTimestamp();

        if ($seconds <= 0) {
            return 0;
        }

        return (int) ceil($seconds / 86400);
    }

    /**
     * The credit, as a whole percentage of the first payment.
     *
     * Capped at MAX_CREDIT_PERCENT so the charge stays above Lemon Squeezy's
     * $1.00 floor, and clamped to the cycle length so a mis-set trial end date
     * (e.g. a year away on a monthly plan) can never hand out a free month.
     */
    public function creditPercent(int $daysRemaining, bool $isAnnual = false): int
    {
        if ($daysRemaining <= 0) {
            return 0;
        }

        $cycleDays = $isAnnual ? self::ANNUAL_CYCLE_DAYS : self::MONTHLY_CYCLE_DAYS;
        $percent   = (int) round(min($daysRemaining, $cycleDays) / $cycleDays * 100);

        return (int) min($percent, self::MAX_CREDIT_PERCENT);
    }

    /**
     * Everything the billing UI needs to explain the offer honestly, for both
     * billing cycles at once — the customer can flip monthly/annual on the
     * client without another round-trip, and both percentages come from this
     * one authority so the displayed price always matches what will be
     * charged.
     *
     * Returns null when there is nothing to credit, which is the signal to
     * every caller to behave exactly as it did before this feature existed.
     */
    public function summaryFor(Tenant $tenant): ?array
    {
        $days = $this->daysRemaining($tenant);

        if ($days <= 0) {
            return null;
        }

        $monthly = $this->creditPercent($days, false);
        $annual  = $this->creditPercent($days, true);

        if ($monthly <= 0 && $annual <= 0) {
            return null;
        }

        return [
            'days_remaining'   => $days,
            'percent_monthly'  => $monthly,
            'percent_annual'   => $annual,
            'trial_ends_at'    => $tenant->trial_ends_at?->toIso8601String(),
            'cycle_days'       => [
                'monthly' => self::MONTHLY_CYCLE_DAYS,
                'annual'  => self::ANNUAL_CYCLE_DAYS,
            ],
        ];
    }

    /**
     * Get a ready-to-use discount code carrying this tenant's trial credit,
     * or null when there is nothing to credit / the API call failed.
     *
     * Repeated calls are cheap and safe: the code is cached per tenant, per
     * variant, per day-count, so a customer who opens and closes the checkout
     * five times reuses one code instead of littering the Lemon Squeezy
     * dashboard with five. The cache expires before the code does.
     *
     * @param  string|int|null  $variantId  When known, the discount is locked
     *         to this variant so a leaked code cannot be spent elsewhere.
     */
    public function codeFor(Tenant $tenant, string|int|null $variantId, bool $isAnnual = false): ?array
    {
        $days = $this->daysRemaining($tenant);

        if ($days <= 0) {
            return null;
        }

        $percent = $this->creditPercent($days, $isAnnual);

        if ($percent <= 0) {
            return null;
        }

        if (!$this->isConfigured()) {
            return null;
        }

        $cacheKey = sprintf(
            'trial_credit:%s:%s:%s:%d',
            $tenant->id,
            $variantId ?: 'any',
            $isAnnual ? 'annual' : 'monthly',
            $days
        );

        $cached = Cache::get($cacheKey);
        if (is_array($cached) && !empty($cached['code'])) {
            return $cached;
        }

        $code = $this->createDiscount($tenant, $variantId, $percent, $days);

        if (!$code) {
            return null;
        }

        $payload = [
            'code'           => $code,
            'percent'        => $percent,
            'days_remaining' => $days,
        ];

        // Expire the cache well before the code itself, so we never hand out a
        // code that Lemon Squeezy has already retired.
        Cache::put($cacheKey, $payload, now()->addHours(self::CODE_TTL_HOURS - 1));

        return $payload;
    }

    /**
     * Create the single-use discount in Lemon Squeezy. Returns the code.
     *
     * Deliberately restrictive, because this code is prefilled into a checkout
     * and therefore visible to the customer:
     *   • duration `once`            → first payment only; renewals are full price.
     *   • max_redemptions 1          → cannot be shared.
     *   • expires_at +24h            → cannot be hoarded until the trial is spent.
     *   • limited to the variant     → cannot be spent on a different plan.
     */
    protected function createDiscount(Tenant $tenant, string|int|null $variantId, int $percent, int $days): ?string
    {
        // Uppercase letters and digits only — Lemon Squeezy rejects anything else.
        $code = 'TRIALCREDIT' . strtoupper(Str::random(8));

        $attributes = [
            'name'                   => "Trial credit — {$days} unused day(s) — tenant #{$tenant->id}",
            'code'                   => $code,
            'amount'                 => $percent,
            'amount_type'            => 'percent',
            'duration'               => 'once',
            'is_limited_redemptions' => true,
            'max_redemptions'        => 1,
            'expires_at'             => now()->addHours(self::CODE_TTL_HOURS)->toIso8601String(),
            'test_mode'              => (bool) config('services.lemon_squeezy.test_mode', false),
        ];

        $relationships = [
            'store' => [
                'data' => [
                    'type' => 'stores',
                    'id'   => (string) config('services.lemon_squeezy.store_id'),
                ],
            ],
        ];

        // Lock to the variant being sold when we know it. On the static-URL
        // fallback path we do not, so the code stays product-wide — still
        // single-use and short-lived, which bounds the exposure.
        if ($variantId) {
            $attributes['is_limited_to_products'] = true;
            $relationships['variants'] = [
                'data' => [
                    ['type' => 'variants', 'id' => (string) $variantId],
                ],
            ];
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . config('services.lemon_squeezy.api_key'),
                'Accept'        => 'application/vnd.api+json',
                'Content-Type'  => 'application/vnd.api+json',
            ])->timeout(15)->post(self::API_ENDPOINT, [
                'data' => [
                    'type'          => 'discounts',
                    'attributes'    => $attributes,
                    'relationships' => $relationships,
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('Trial credit discount request threw an exception: ' . $e->getMessage(), [
                'tenant_id' => $tenant->id,
                'variant'   => $variantId,
                'percent'   => $percent,
            ]);
            return null;
        }

        if ($response->failed()) {
            Log::error('Trial credit discount creation failed: ' . $response->body(), [
                'tenant_id' => $tenant->id,
                'variant'   => $variantId,
                'percent'   => $percent,
            ]);
            return null;
        }

        $issuedCode = $response->json('data.attributes.code') ?: $code;

        Log::info("Trial credit issued for tenant {$tenant->id}: {$percent}% ({$days} unused day(s)), code {$issuedCode}.");

        return $issuedCode;
    }

    /**
     * Without API credentials we cannot mint discounts, and the caller must
     * fall back to charging full price rather than promising a credit it
     * cannot actually deliver.
     */
    public function isConfigured(): bool
    {
        return !empty(config('services.lemon_squeezy.api_key'))
            && !empty(config('services.lemon_squeezy.store_id'));
    }
}
