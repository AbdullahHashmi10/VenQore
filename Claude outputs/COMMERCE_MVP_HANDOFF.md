# VenQore Commerce MVP — Handoff (2026-10-03)

## Status
Built and synced to `app-code/main-app`. **Not deployed.** Backend verified by 52 passing tests (cloud, MariaDB). Frontend compiles (`vite build` clean) but has **not been viewed in a browser**.

## Run on your machine
1. `php artisan migrate` (adds 9 `commerce_*`/`storefront*` tables; seeds Pakistan + 6 cities)
2. `npm run build` (or dev)
3. `php artisan test tests/tests/Feature/Commerce`

Merchant UI: sidebar "Online Store" -> redirects to `s/{store}/online-store`. Public: `/shop`, `/shop/{slug}`, `/order-status/{token}`.

## What's in
Merchant setup (profile, city, warehouse, hours, pricing rule), publish/bulk publish, % and fixed online price, public catalogue, guest cart + idempotent checkout, secret status link, order inbox with state machine, stock hold on accept, sale posted via SaleService on completion, payment status separate from fulfilment, `commerce:expire-orders` scheduled every 5 min.

## Honest limitations
- POS sales ignore commerce stock holds.
- COD/unpaid orders post as a credit sale (receivable); later payment uses your existing receivables flow.
- Delivery fee posts as a service line.
- Only simple fixed-unit standard products can be published (no variants, weighed, serial, recipe, tiers).
- Public pages were built without your Claude Design file (could not import; needs `/design-login`). Restyle pending.
- Roadmap pilot/launch gates (50 real orders, staging) are not met.
- Cloud-only workarounds (not in your repo): fresh-migrate issues with the expenses FK on MariaDB native uuid and a CardRegistry migration — pre-existing, worth checking.

## Files
Migration `2026_10_03_000001_create_commerce_tables.php`; `app/Services/Commerce/*`; `app/Http/Controllers/Commerce/*`; `routes/commerce.php`; `resources/js/Pages/{Commerce,OnlineStore}/*`; `resources/js/Components/Commerce/*`; `resources/js/lib/commerce.js`; tests in `tests/tests/Feature/Commerce`.
