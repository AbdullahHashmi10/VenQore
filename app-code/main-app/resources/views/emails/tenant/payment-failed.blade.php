@component('mail::message')
# Action Required: Payment Failed ⚠️

Hi **{{ $user->name }}**,

We were unable to process the payment for your **{{ $tenant->name }}** VenQore subscription.

**Your access is not interrupted yet.** Lemon Squeezy will automatically retry the payment. However, to avoid any interruption to your business operations, please update your billing information now.

@component('mail::button', ['url' => $billingUrl, 'color' => 'error'])
Update Payment Method
@endcomponent

---

## Common reasons for payment failure

- Card expired or billing address changed
- Insufficient funds
- Bank declined the transaction

If you continue to experience issues, please contact your bank or reply to this email.

The VenQore Team
@endcomponent
