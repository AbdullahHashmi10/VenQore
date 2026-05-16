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

## Plans start at $19/month

| Plan | Price | Includes |
|---|---|---|
| **Starter** | $19/mo | 1 location · 1,000 SKUs · 3 staff |
| **Growth** | $39/mo | 3 locations · Unlimited SKUs · WooCommerce |
| **Business** | $79/mo | Unlimited everything · API access |

---

**Your data will be permanently deleted after 60 days of inactivity.** 

If you need more time or have questions, just reply to this email.

The VenQore Team
@endcomponent
