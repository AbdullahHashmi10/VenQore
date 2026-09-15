@component('mail::message')
# Your trial has ended — your data is safe ✓

Hi **{{ $user->name }}**,

Your 14-day VenQore trial for **{{ $tenant->name }}** has ended.

**The good news:** Your data is completely preserved. Every product, sale, customer, and report is still there — waiting for you.

---

## To restore access, subscribe now

@component('mail::button', ['url' => $billingUrl, 'color' => 'primary'])
Subscribe & Restore Access
@endcomponent

---

## Plans — from $49/month or free forever

| Plan | Price | Best For |
|---|---|---|
| **Solo** | Free forever | 1 person, 1 register, 500 SKUs |
| **Starter** | $49/mo | 1 location, 5,000 SKUs, full history |
| **Core** | $99/mo | Multi-branch, API, audit trail · Most popular |
| **Scale** | $299/mo | 25 seats, white-label, 2 channel syncs |

---

**Your data will be permanently deleted after 60 days of inactivity.** 

If you need more time or have questions, just reply to this email.

The VenQore Team
@endcomponent
