@component('mail::message')
# Action Required: A Payment Was Refunded ⚠️

Hi **{{ $user->name }}**,

Lemon Squeezy just told us a payment on your **{{ $tenant->name }}** VenQore subscription was refunded.

**We've paused access to your store while this is reviewed.** This is an automatic safety step whenever money is returned on an active subscription — it isn't a judgment about what happened.

@component('mail::button', ['url' => $billingUrl, 'color' => 'error'])
Go to Billing
@endcomponent

---

## What to do next

- If you requested this refund and want to keep using VenQore, please contact us so we can review your account and restore access.
- If you did **not** request this refund, please contact us immediately — this can be a sign of unauthorized card activity.

Reply to this email or write to {{ config('mail.notifications.contact') }}.

The VenQore Team
@endcomponent
