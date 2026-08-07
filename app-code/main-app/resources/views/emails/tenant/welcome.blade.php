@component('mail::message')
# Your VenQore store is ready! 🎉

Hi **{{ $user->name }}**,

Welcome to VenQore — your complete POS & ERP system is live and waiting for you.

---

## Your Login Details

| | |
|---|---|
| **Store URL** | [{{ config('app.url') }}/s/{{ $tenant->slug }}]({{ $dashboardUrl }}) |
| **Email** | {{ $user->email }} |
| **Temporary Password** | `{{ $temporaryPassword }}` |

> **Important:** Please change your password immediately after your first login.

---

## What to do next

1. **Log in** at your store URL above
2. **Complete the setup wizard** — takes about 3 minutes
3. **Add your first product** and make your first sale

@component('mail::button', ['url' => $loginUrl, 'color' => 'primary'])
Go to My Store →
@endcomponent

---

## Your 14-day trial includes

✅ Full POS & invoicing  
✅ Unlimited products during trial  
✅ Inventory management  
✅ Double-entry accounting  
✅ 38 built-in reports  

No credit card required during your trial.

---

**Need help?** Reply to this email or visit our [support docs](https://docs.venqore.com).

The VenQore Team
@endcomponent
