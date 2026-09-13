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

| Plan | Monthly | Annual (2 months free) | Best For |
|---|---|---|---|
| **Solo** | $0/mo | Free | 1 person, 1 register — free forever |
| **Starter** | $49/mo | $490/yr | 1 location, 5,000 SKUs, full history |
| **Core** | $99/mo | $990/yr | Multi-branch, API, audit trail (Most popular) |
| **Scale** | $299/mo | $2,990/yr | 25 seats, white-label, channel syncs |

@component('mail::button', ['url' => $billingUrl, 'color' => 'primary'])
Subscribe Now — Keep My Data
@endcomponent

Questions? Reply to this email.

The VenQore Team
@endcomponent
