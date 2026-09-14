@component('mail::message')
# Order Refund Needs Manual Review

Lemon Squeezy reported an `order_refunded` event that VenQore could not automatically reverse.

| Field | Value |
|---|---|
| Order ID | {{ $context['order_id'] ?? 'unknown' }} |
| Customer ID | {{ $context['customer_id'] ?? 'unknown' }} |
| Variant ID | {{ $context['variant_id'] ?: 'unknown' }} |
| Product | {{ $context['product_name'] ?? 'unknown' }} |
| Tenant ID (if known) | {{ $context['tenant_id'] ?? 'not linked to an existing tenant — likely a new lifetime-deal signup' }} |

**No access or entitlement has been changed automatically.** Common cases this can be:

- A lifetime-deal purchase (a whole tenant was provisioned for this order) — decide whether to suspend that store.
- An extra seat, location, register, or catalogue add-on — decide whether to lower the tenant's limit back down.
- A channel sync add-on (WooCommerce/Amazon/eBay/TikTok) or the upload service.

Look up the order in the Lemon Squeezy dashboard by Order ID for full details, then act in the Hashmi Dashboard or database as needed.
@endcomponent
