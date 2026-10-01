@component('mail::message')
# Your access ends in {{ $daysLeft }} {{ $daysLeft === 1 ? 'day' : 'days' }}

Hi **{{ $user->name }}**,

@if($daysLeft <= 2)
⚠️ **This is your final reminder.** Access to **{{ $tenant->name }}** ends on **{{ $endsAt }}**.
@else
A friendly reminder that access to **{{ $tenant->name }}** ends on **{{ $endsAt }}** — {{ $daysLeft }} days from now.
@endif

---

## What happens when it ends

Your store does **not** get suspended or deleted. It moves to **View-Only mode**: you can still see all your data, print past receipts, and export reports — but new sales, new products, and other changes are paused until you subscribe again.

## Your data is safe

All your products, sales, and settings stay exactly as they are. The moment you subscribe, everything continues right where you left off — no re-setup required.

@component('mail::button', ['url' => $billingUrl, 'color' => 'primary'])
Subscribe Now — Keep Full Access
@endcomponent

Questions? Reply to this email.

The VenQore Team
@endcomponent
