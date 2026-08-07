@component('mail::message')
# Your trial ends in {{ $daysLeft }} {{ $daysLeft === 1 ? 'day' : 'days' }}

Hi **{{ $user->name }}**,

@if($daysLeft <= 2)
⚠️ **This is your final reminder.** Your VenQore trial for **{{ $tenant->name }}** expires very soon.
@else
A friendly reminder that your VenQore trial for **{{ $tenant->name }}** has {{ $daysLeft }} days remaining.
@endif

---

## Your data is safe

All your products, sales, and settings are securely stored. When you subscribe, everything continues exactly where you left off — no re-setup required.

## Pricing

| Plan | Monthly | Best For |
|---|---|---|
| **Starter** | $19/mo | Single location, up to 1,000 SKUs |
| **Growth** | $39/mo | Up to 3 locations, unlimited SKUs |
| **Business** | $79/mo | Unlimited everything + API access |

@component('mail::button', ['url' => $billingUrl, 'color' => 'primary'])
Subscribe Now — Keep My Data
@endcomponent

Questions? Reply to this email.

The VenQore Team
@endcomponent
