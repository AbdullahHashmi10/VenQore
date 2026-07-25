<?php

namespace App\Services;

/**
 * LemonSqueezyStatus
 * ---------------------------------------------------------------------------
 * The single place that translates a Lemon Squeezy subscription status into a
 * VenQore `tenants.status` value.
 *
 * WHY THIS EXISTS
 * ---------------
 * This mapping used to be duplicated in three places that quietly disagreed:
 *
 *   - HandleSubscriptionUpdatedJob  mapped on_trial → 'trial'   (correct)
 *   - ProvisionTenantJob            hardcoded        'active'   (wrong)
 *   - LemonSqueezySyncService       forced           'active'   (wrong)
 *
 * The two wrong ones ran first — at checkout and on "Already Paid?" — so a
 * store whose Lemon Squeezy subscription was `on_trial` (which is what happens
 * whenever the purchased variant has a free-trial period configured) got
 * written to the database as `active`.
 *
 * That single wrong word broke the billing page in three visible ways at once:
 *
 *   1. The trial badge vanished        (it renders on status === 'trial')
 *   2. Pay Now / Cancel vanished       (they were gated on the same flag)
 *   3. Payment History said "On Trial" (it reads Lemon Squeezy directly)
 *
 * …leaving the customer marked as paying, unable to pay, and reading two
 * contradictory statuses on one screen. Centralising the mapping means a store
 * can no longer be `active` locally while Lemon Squeezy still calls it a trial.
 *
 * @see https://docs.lemonsqueezy.com/api/subscriptions#the-subscription-object
 */
class LemonSqueezyStatus
{
    /**
     * Lemon Squeezy statuses that should grant access to the app.
     *
     * `past_due` and `cancelled` are deliberately included: both keep working
     * until the paid period actually lapses (dunning retries, and the
     * already-paid remainder of a cancelled term).
     */
    public const LIVE = ['active', 'on_trial', 'past_due', 'cancelled'];

    /**
     * Map a Lemon Squeezy status to a VenQore tenant status.
     *
     * @param  string|null  $lsStatus  Raw `attributes.status` from the API/webhook.
     * @param  string|null  $fallback  Current tenant status, kept when Lemon
     *                                 Squeezy sends something unrecognised —
     *                                 never downgrade a store over a status
     *                                 string we don't know yet.
     */
    public static function toTenantStatus(?string $lsStatus, ?string $fallback = 'active'): string
    {
        return match ($lsStatus) {
            'active'    => 'active',

            // The customer has a subscription and a card on file, but Lemon
            // Squeezy has NOT charged them yet. They are not a paying customer
            // and must keep their trial affordances, including Pay Now.
            'on_trial'  => 'trial',

            'past_due'  => 'active',    // grace period — keep them working
            'cancelled' => 'active',    // paid through to the end of the term
            'paused'    => 'suspended',
            'expired'   => 'suspended',
            'unpaid'    => 'suspended',

            default     => $fallback ?: 'active',
        };
    }

    /**
     * True when Lemon Squeezy has taken money for this subscription.
     *
     * `on_trial` explicitly does not count. This is the test that decides
     * whether to offer a payment CTA, so treating a trial as paid is what
     * locks a customer out of paying.
     */
    public static function isPaying(?string $lsStatus): bool
    {
        return in_array($lsStatus, ['active', 'past_due', 'cancelled'], true);
    }

    /** True when the status should grant access to the app at all. */
    public static function grantsAccess(?string $lsStatus): bool
    {
        return in_array($lsStatus, self::LIVE, true);
    }
}
