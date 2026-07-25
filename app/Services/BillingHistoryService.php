<?php

namespace App\Services;

use App\Models\Tenant;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * BillingHistoryService
 * ---------------------------------------------------------------------------
 * Reads a tenant's real payment history out of Lemon Squeezy so the billing
 * page can answer the three questions every subscriber eventually asks:
 *
 *   "When did I pay?"   → invoice created_at
 *   "What did it cover?" → the derived period, in actual days
 *   "When does it end?"  → the subscription's renews_at / ends_at
 *
 * Lemon Squeezy is the source of truth, not our `tenants` table. Our columns
 * are a cache of provisioning outcomes and can drift (a dropped webhook, a
 * SuperAdmin override, a locally simulated plan change). Reading the invoices
 * directly means this screen is also a diagnostic: if `subscription_ends_at`
 * disagrees with what Lemon Squeezy shows here, the local column is wrong.
 *
 * Lemon Squeezy does NOT return a billing period on an invoice, so we derive
 * it: each invoice covers the span from its own payment date to the next
 * invoice's payment date, and the most recent invoice runs to the
 * subscription's renewal (or end) date. That is what surfaces "paid on July 9,
 * covered 30 days" — and it makes a mis-set billing interval obvious, because
 * a plan sold as monthly that shows 14-day periods is a product
 * misconfiguration, not a display bug.
 *
 * The discount column matters too: it is the visible proof that a trial credit
 * (see TrialCreditService) actually reached the invoice.
 *
 * @see https://docs.lemonsqueezy.com/api/subscription-invoices/list-all-subscription-invoices
 */
class BillingHistoryService
{
    protected const API_BASE = 'https://api.lemonsqueezy.com/v1';

    /**
     * Short cache. Long enough that flipping between tabs is instant, short
     * enough that a payment made 30 seconds ago shows up when the customer
     * comes looking for it.
     */
    protected const CACHE_SECONDS = 120;

    /**
     * Full billing history for a tenant, shaped for the Payment History tab.
     *
     * Never throws: billing pages must render even when Lemon Squeezy is down.
     * Every failure path returns the same envelope with an explanatory
     * `message` and an empty invoice list.
     */
    public function forTenant(Tenant $tenant, bool $fresh = false): array
    {
        $apiKey  = config('services.lemon_squeezy.api_key');
        $storeId = config('services.lemon_squeezy.store_id');

        if (!$apiKey || !$storeId) {
            return $this->envelope(
                message: 'Payment history is unavailable because Lemon Squeezy is not configured on this server.'
            );
        }

        $cacheKey = "billing_history:{$tenant->id}";

        if ($fresh) {
            Cache::forget($cacheKey);
        }

        return Cache::remember(
            $cacheKey,
            now()->addSeconds(self::CACHE_SECONDS),
            fn () => $this->build($tenant, $apiKey, (string) $storeId)
        );
    }

    /**
     * Do the actual work: resolve the subscription, pull its invoices, derive
     * the periods, and summarise.
     */
    protected function build(Tenant $tenant, string $apiKey, string $storeId): array
    {
        $subscription = $this->resolveSubscription($tenant, $apiKey, $storeId);

        if (!$subscription) {
            // No Lemon Squeezy subscription exists for this tenant. That is the
            // normal state for a trial, an LTD/AppSumo store, or a store whose
            // plan was applied locally without a real payment — and saying so
            // plainly is more useful than an empty table.
            return $this->envelope(
                message: $tenant->status === 'trial'
                    ? 'No payments yet — your store is still on its free trial.'
                    : 'No Lemon Squeezy subscription is linked to this store, so there are no payment records to show.'
            );
        }

        $subAttributes  = data_get($subscription, 'attributes', []);
        $subscriptionId = data_get($subscription, 'id');

        $invoices = $this->fetchInvoices($apiKey, $storeId, $subscriptionId);

        if ($invoices === null) {
            return $this->envelope(
                subscription: $this->presentSubscription($subAttributes, $subscriptionId),
                message: 'Could not reach Lemon Squeezy to load your payment history. Please try again in a moment.'
            );
        }

        // Defence in depth: the API is filtered by subscription, but we verify
        // ownership locally too so a filter that is ever ignored or renamed
        // cannot leak another customer's invoices onto this page.
        $ownerEmail = $tenant->ownerEmail();

        $invoices = array_values(array_filter($invoices, function ($invoice) use ($subscriptionId, $ownerEmail) {
            $belongsToSubscription = (string) data_get($invoice, 'attributes.subscription_id') === (string) $subscriptionId;

            if (!$belongsToSubscription) {
                return false;
            }

            if (!$ownerEmail) {
                return true;
            }

            $invoiceEmail = data_get($invoice, 'attributes.user_email');

            return is_string($invoiceEmail)
                && strcasecmp(trim($invoiceEmail), trim($ownerEmail)) === 0;
        }));

        return $this->envelope(
            subscription: $this->presentSubscription($subAttributes, $subscriptionId),
            invoices: $this->presentInvoices($invoices, $subAttributes),
        );
    }

    /**
     * Find this tenant's subscription.
     *
     * Prefers the ID we already stored at provisioning time. Falls back to
     * looking it up by the owner's email so the tab still works when the local
     * column was never written — precisely the situation where a customer most
     * needs to see proof of payment.
     */
    protected function resolveSubscription(Tenant $tenant, string $apiKey, string $storeId): ?array
    {
        if ($tenant->lemon_squeezy_subscription_id) {
            $direct = $this->request($apiKey, '/subscriptions/' . $tenant->lemon_squeezy_subscription_id);

            if (is_array($direct) && data_get($direct, 'data.id')) {
                return data_get($direct, 'data');
            }
        }

        $email = $tenant->ownerEmail();

        if (!$email) {
            return null;
        }

        $response = $this->request($apiKey, '/subscriptions', [
            'filter[store_id]'   => $storeId,
            'filter[user_email]' => $email,
            'page[size]'         => 50,
        ]);

        $subscriptions = data_get($response, 'data') ?? [];

        if (empty($subscriptions)) {
            return null;
        }

        // Re-verify the email locally, then take the most recently created —
        // that is the subscription currently governing access.
        $owned = array_values(array_filter($subscriptions, function ($sub) use ($email) {
            $subEmail = data_get($sub, 'attributes.user_email');

            return is_string($subEmail) && strcasecmp(trim($subEmail), trim($email)) === 0;
        }));

        if (empty($owned)) {
            return null;
        }

        usort($owned, fn ($a, $b) => strcmp(
            (string) data_get($b, 'attributes.created_at'),
            (string) data_get($a, 'attributes.created_at')
        ));

        return $owned[0];
    }

    /**
     * @return array<int, array>|null  null signals a transport failure, as
     *         distinct from an empty list (a subscription with no invoices yet).
     */
    protected function fetchInvoices(string $apiKey, string $storeId, string|int|null $subscriptionId): ?array
    {
        $response = $this->request($apiKey, '/subscription-invoices', [
            'filter[store_id]'        => $storeId,
            'filter[subscription_id]' => (string) $subscriptionId,
            'page[size]'              => 50,
        ]);

        if ($response === null) {
            return null;
        }

        return data_get($response, 'data') ?? [];
    }

    /**
     * The "where do I stand right now" summary shown above the table.
     */
    protected function presentSubscription(array $attributes, string|int|null $subscriptionId = null): array
    {
        $status   = data_get($attributes, 'status');
        $renewsAt = $this->parse(data_get($attributes, 'renews_at'));
        $endsAt   = $this->parse(data_get($attributes, 'ends_at'));

        // A cancelled subscription still runs to ends_at (the grace period the
        // customer already paid for), so that is the date that matters to them.
        $expiresAt = $endsAt ?: $renewsAt;

        return [
            // The ID lives on the resource, not in attributes — pass it through
            // rather than reading a key the real API never returns.
            'id'                 => $subscriptionId,
            'status'             => $status,
            'status_formatted'   => data_get($attributes, 'status_formatted'),
            'product_name'       => data_get($attributes, 'product_name'),
            'variant_name'       => data_get($attributes, 'variant_name'),
            'card'               => $this->presentCard($attributes),
            'is_cancelled'       => (bool) data_get($attributes, 'cancelled'),
            'renews_at'          => $renewsAt?->toIso8601String(),
            'ends_at'            => $endsAt?->toIso8601String(),
            'trial_ends_at'      => $this->parse(data_get($attributes, 'trial_ends_at'))?->toIso8601String(),
            'expires_at'         => $expiresAt?->toIso8601String(),
            'days_until_expiry'  => $expiresAt ? $this->daysBetween(now(), $expiresAt) : null,
            'test_mode'          => (bool) data_get($attributes, 'test_mode'),

            // Signed, single-purpose Lemon Squeezy URL that opens just the card
            // form for THIS subscription — no account login, nothing else
            // exposed. This is what replaces the generic "Billing Portal" link,
            // which dropped the customer at app.lemonsqueezy.com/my-orders and
            // demanded a separate login with their purchase email — a dead end
            // for guest checkouts. Expires, so it is never cached beyond the
            // usual 120s envelope.
            'update_card_url'    => data_get($attributes, 'urls.update_payment_method'),
        ];
    }

    /**
     * Normalise invoices oldest-first and give each one the period it paid for.
     */
    protected function presentInvoices(array $invoices, array $subAttributes): array
    {
        if (empty($invoices)) {
            return [];
        }

        // Oldest first, so each invoice's period can end where the next begins.
        usort($invoices, fn ($a, $b) => strcmp(
            (string) data_get($a, 'attributes.created_at'),
            (string) data_get($b, 'attributes.created_at')
        ));

        // The newest invoice's period runs to the subscription's own end date.
        $finalPeriodEnd = $this->parse(data_get($subAttributes, 'ends_at'))
            ?: $this->parse(data_get($subAttributes, 'renews_at'));

        $count = count($invoices);
        $rows  = [];

        foreach ($invoices as $index => $invoice) {
            $attributes  = data_get($invoice, 'attributes', []);
            $periodStart = $this->parse(data_get($attributes, 'created_at'));

            $periodEnd = $index + 1 < $count
                ? $this->parse(data_get($invoices[$index + 1], 'attributes.created_at'))
                : $finalPeriodEnd;

            $periodDays = ($periodStart && $periodEnd)
                ? $this->daysBetween($periodStart, $periodEnd)
                : null;

            $discountCents = (int) data_get($attributes, 'discount_total', 0);

            $rows[] = [
                'id'               => data_get($invoice, 'id'),
                'paid_at'          => $periodStart?->toIso8601String(),
                'billing_reason'   => data_get($attributes, 'billing_reason'),
                'status'           => data_get($attributes, 'status'),
                'status_formatted' => data_get($attributes, 'status_formatted'),
                'refunded'         => (bool) data_get($attributes, 'refunded'),

                'subtotal'         => data_get($attributes, 'subtotal_formatted'),
                'discount_total'   => data_get($attributes, 'discount_total_formatted'),
                'tax'              => data_get($attributes, 'tax_formatted'),
                'total'            => data_get($attributes, 'total_formatted'),
                'currency'         => data_get($attributes, 'currency'),

                // Drives the "credit applied" badge — the visible proof that a
                // trial credit made it onto the invoice.
                'has_discount'     => $discountCents > 0,
                'total_usd_cents'  => (int) data_get($attributes, 'total_usd', 0),

                'period_start'     => $periodStart?->toIso8601String(),
                'period_end'       => $periodEnd?->toIso8601String(),
                'period_days'      => $periodDays,

                'card'             => $this->presentCard($attributes),
                'invoice_url'      => data_get($attributes, 'urls.invoice_url'),
                'test_mode'        => (bool) data_get($attributes, 'test_mode'),
            ];
        }

        // Newest first for display — most people are looking for the last charge.
        return array_reverse($rows);
    }

    protected function presentCard(array $attributes): ?string
    {
        $brand = data_get($attributes, 'card_brand');
        $last4 = data_get($attributes, 'card_last_four');

        if (!$brand && !$last4) {
            return null;
        }

        return trim(ucfirst((string) $brand) . ($last4 ? " ••••{$last4}" : ''));
    }

    /**
     * Whole days between two moments, rounded up, never negative. Matches the
     * day-counting convention used everywhere else in the billing UI.
     */
    protected function daysBetween(Carbon $from, Carbon $to): int
    {
        $seconds = $to->getTimestamp() - $from->getTimestamp();

        return $seconds <= 0 ? 0 : (int) ceil($seconds / 86400);
    }

    protected function parse(mixed $date): ?Carbon
    {
        if (!$date) {
            return null;
        }

        try {
            return Carbon::parse($date);
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * Single GET against the Lemon Squeezy API. Returns the decoded body, or
     * null on any transport or HTTP failure (already logged).
     */
    protected function request(string $apiKey, string $path, array $query = []): ?array
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Accept'        => 'application/vnd.api+json',
                'Content-Type'  => 'application/vnd.api+json',
            ])->timeout(15)->get(self::API_BASE . $path, $query);
        } catch (\Throwable $e) {
            Log::error("BillingHistoryService: request to {$path} threw: " . $e->getMessage());
            return null;
        }

        if ($response->failed()) {
            Log::error("BillingHistoryService: request to {$path} failed: " . $response->body());
            return null;
        }

        return $response->json() ?? [];
    }

    /**
     * Consistent response shape for every outcome, so the frontend never has to
     * guess which keys exist.
     */
    protected function envelope(?array $subscription = null, array $invoices = [], ?string $message = null): array
    {
        $paidInvoices = array_values(array_filter(
            $invoices,
            fn ($invoice) => $invoice['status'] === 'paid' && !$invoice['refunded']
        ));

        $lifetimeUsdCents = array_sum(array_column($paidInvoices, 'total_usd_cents'));

        return [
            'subscription'  => $subscription,
            'invoices'      => $invoices,
            'invoice_count' => count($invoices),
            'lifetime_usd'  => $lifetimeUsdCents > 0
                ? '$' . number_format($lifetimeUsdCents / 100, 2)
                : null,
            'message'       => $message,
            'fetched_at'    => now()->toIso8601String(),
        ];
    }
}
