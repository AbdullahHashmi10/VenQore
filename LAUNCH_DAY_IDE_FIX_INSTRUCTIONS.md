# VenQore — Launch-Day Fix Instructions (for the IDE)

**Prepared:** 2026-07-24
**Build in question:** 5.1.5
**Author role:** Diagnosis only — no code was changed. Every instruction below is for *you* to run in the IDE. After each one there is a **Verify** step so I can confirm it was done correctly.

> **How to use this doc:** Do the items in order. Do **not** skip the Verify steps — that is how we prove each fix worked before moving on. Where a step is a data/DB or Lemon-Squeezy-dashboard action (not a code edit), it is marked **[SERVER]** or **[LEMON SQUEEZY]**.

---

## TL;DR — what's actually wrong

There are **two independent problems** stacked on top of each other in the payments/plans area, plus the rename request.

1. **Production "access denied" when editing plan prices** → Your production user has `is_platform_admin = true` (so you get *into* the dashboard) but the wrong `platform_role` value, so the stricter `isPlatformSuperAdmin()` check in `PlanController` fires `abort(403)`. **This is a DATA problem on the production database, not a code bug.** It works locally only because your local user has the correct `platform_role`.

2. **Lemon Squeezy shows USD at checkout even though the app displays PKR** → This is **expected behaviour given your current setup**, not a bug in the redirect code. The PKR number in your app is a *display-only* calculation (`price_monthly × usd_pkr_rate`). The checkout page charges whatever the Lemon Squeezy **checkout URL / variant** is set to — and your `.env` has **no PKR checkout URLs configured at all** (all `..._PKR_URL` keys are empty), and your Lemon Squeezy store is **USD-only**. Lemon Squeezy does **not** auto-convert USD→PKR at checkout. So every "Subscribe" lands on a USD checkout. You must decide how to handle PKR (see Item 2).

3. **Rename "Platform Owner" → "Hashmi Dashboard"** → user-facing display text only. 8 display strings. The internal `platform_owner` role key is **left untouched** (changing it would break auth).

---

## ITEM 1 — Fix "access denied" on plan price editing (production) 🔴 BLOCKER

### Root cause (verified)

- Route: `PUT /VenQore/plans/{plan}` → `App\Http\Controllers\SuperAdmin\PlanController@update`
- Two gates run:
  - **Route group middleware** `SuperAdminMiddleware` → checks `isPlatformAdmin()` (just the `is_platform_admin` boolean). ✅ You pass this on prod (that's why you can open the dashboard).
  - **Controller middleware** inside `PlanController::middleware()` (lines 15–26) → for any method except `index`, requires `isPlatformSuperAdmin()`, which is:
    ```php
    // app/Models/User.php  (line ~186)
    return $this->isPlatformAdmin()
        && in_array($this->platform_role, ['platform_owner', 'platform_manager', 'product_manager']);
    ```
  - On production your user's `platform_role` is **not** one of those three values (likely `NULL`, `''`, or `'none'`) → `abort(403, 'Unauthorized. Platform Super Admin role required.')`.
- The `409 Conflict` you saw in the console *before* the 403 is a **separate, mostly-harmless** thing: Inertia returns 409 when the browser's loaded JS build (`app-tNB52E96.js`) is older than the server's deployed build. Your bootstrap handler intentionally returns `null` on 409 so Inertia self-refreshes. A hard refresh clears it. **The real blocker is the 403.**

### Fix — this is a DATA fix, not a code edit

**[SERVER] Step 1.1 — Inspect the production user's platform_role.**

Run on the **production** server (Laravel Tinker or a one-off SQL query):

```bash
php artisan tinker
```
```php
\App\Models\User::where('email', 'YOUR-PRODUCTION-OWNER-EMAIL')
    ->get(['id','name','email','is_platform_admin','platform_role'])
    ->toArray();
```

Or via SQL:
```sql
SELECT id, name, email, is_platform_admin, platform_role
FROM users
WHERE is_platform_admin = 1;
```

**Verify (1.1):** Report back the `is_platform_admin` and `platform_role` values for your owner account. Expected finding: `is_platform_admin = 1` but `platform_role` is `NULL` / `''` / `'none'` (anything other than `platform_owner`).

**[SERVER] Step 1.2 — Set the correct role on the production owner account.**

```php
$u = \App\Models\User::where('email', 'YOUR-PRODUCTION-OWNER-EMAIL')->first();
$u->is_platform_admin = true;
$u->platform_role = 'platform_owner';
$u->save();
```

> ⚠️ Use the literal string `platform_owner` (lowercase, underscore). Do **not** use "Hashmi Dashboard" or "Platform Owner" here — this is the internal role key that auth compares against. The rename in Item 3 does not touch this value.

**Verify (1.2):** Re-run the query from 1.1. `platform_role` must now read exactly `platform_owner`.

**Step 1.3 — Clear a fresh browser session and retry.**

1. Hard-refresh the production dashboard (Ctrl+Shift+R) to drop the stale `app-*.js` build (kills the 409).
2. Go to Plans, change a price, Save.

**Verify (1.3):** The PUT returns **200/302** (success + redirect to plans index with the "Plan updated" flash), the price persists after reload, and you are **not** bounced to `/error/403`. Tell me the result.

### If it still fails after 1.2 (secondary checks)

- **[SERVER] Config cache stale:** run `php artisan optimize:clear` then `php artisan config:cache route:cache` on production. A cached old config can keep old middleware behaviour.
- **Confirm the deployed build matches 5.1.5:** the 409 will keep reappearing on every save if the deployed `public/build/manifest.json` doesn't match what the browser downloaded. Re-run `npm run build` on/for production and redeploy `public/build`, then hard refresh.

---

## ITEM 2 — Lemon Squeezy: PKR shown in app but USD at checkout 🔴 BLOCKER (decision required)

### Root cause (verified)

- **The redirect code is correct.** `BillingController@upgrade` (lines 256–345): for a PK-geolocated, PK-verified tenant it *tries* `checkout_url_pkr`, then falls back through `config('services.lemon_squeezy.*_pkr_url')`, then finally to the **USD** `*_checkout_url`.
- **But there are no PKR URLs anywhere.** Your `.env` (checked) has `LEMON_SQUEEZY_*_CHECKOUT_URL` set (USD) and **no** `LEMON_SQUEEZY_*_PKR_URL` keys at all. The plan rows' `checkout_url_pkr` columns are also the thing you'd need to fill. So the PKR branch always falls through to the USD URL.
- **The PKR price shown in the app is display-only.** `BillingController@index` line 66 computes `price_monthly_pkr ?? round(price_monthly × usd_pkr_rate)`. That number is never sent to Lemon Squeezy. The checkout page charges whatever the LS **variant** is priced at.
- **Lemon Squeezy does NOT auto-convert USD→PKR.** A USD-store variant charges USD. The guidance you got earlier (that LS auto-converts) is incorrect. LS presentment currency options exist only if the store/variant is configured for them; a USD-only store charges USD.

### You must pick ONE of these paths

**Option A — Launch USD-only today (fastest, safest for today).**
Stop showing PKR at checkout-time so the displayed price and the charged price match.
- Make the pricing/billing UI show **USD** (or show "billed in USD" next to the PKR estimate), so customers see USD before they click Subscribe.
- Nothing on the Lemon Squeezy side changes. Payments already work in USD.

**Option B — Create real PKR products in Lemon Squeezy (correct long-term, more work).**
- **[LEMON SQUEEZY]** In your LS dashboard, create PKR-priced variants/products for each plan (Starter/Growth/Business, monthly + annual), *if* your LS account supports PKR as a settlement/presentment currency. Get the **checkout URL** for each.
- **[SERVER]** Put those URLs into production `.env` as `LEMON_SQUEEZY_STARTER_PKR_URL`, `LEMON_SQUEEZY_GROWTH_PKR_URL`, `LEMON_SQUEEZY_BUSINESS_PKR_URL` (+ annual variants), **or** fill the `checkout_url_pkr` / `checkout_url_annual_pkr` columns on each plan row via the Plans admin page.
- Then the existing code will correctly send PK-verified users to the PKR checkout.

> ⚠️ Confirm with Lemon Squeezy support/dashboard whether PKR is even an available presentment/settlement currency for your account **before** committing to Option B for today. If it's not, Option A is your launch path and Option B becomes a fast-follow.

### Verify (Item 2)

- **If Option A:** On the billing/pricing page the price the customer sees is USD (or clearly labelled "billed in USD"), and clicking Subscribe lands on a checkout showing the **same** USD figure. Tell me which page(s) you changed so I can check the copy matches the checkout.
- **If Option B:** Do a real PK-verified test upgrade → the LS checkout page shows the **PKR** amount matching the app, and a live test charge (then refund) settles. Report the LS dashboard transaction.

### Decision needed from you
Reply with **A** or **B**. If today is the hard deadline and you're unsure whether LS supports PKR, I recommend **A now, B as fast-follow**.

---

## ITEM 3 — Rename "Platform Owner" → "Hashmi Dashboard" (user-facing text only)

**Scope you approved:** user-facing display strings only. **Do NOT** change the internal role key `platform_owner`, DB values, or code comments. Changing those breaks auth.

### Edit these 8 display strings

Replace the visible text `Platform Owner` with `Hashmi Dashboard` at each location. These are the *rendered* strings only:

| # | File | Line | What it is |
|---|------|------|-----------|
| 1 | `resources/js/Layouts/PlatformLayout.jsx` | ~112 | Sidebar/header brand badge |
| 2 | `resources/js/Layouts/OneGlanceLayout.jsx` | ~1157 | Role label shown for `platform_admin` |
| 3 | `resources/js/Pages/Platform/Views.jsx` | ~866 | "Actor" column value |
| 4 | `resources/js/Pages/Settings/SettingsPanel.jsx` | ~432 | "…logs you in as Platform Owner." |
| 5 | `resources/js/Pages/Staff/Hub.jsx` | ~18 | Role badge `label: 'Platform Owner'` (the **label** only — leave the `platform_owner:` key) |
| 6 | `resources/js/Pages/SuperAdmin/DigitalHub/Index.jsx` | ~426 | Badge text |
| 7 | `app/Http/Controllers/Admin/SuperAdminController.php` | ~296 | `'role' => 'Platform Owner'` display string in the users list payload |
| 8 | `app/Http/Controllers/Admin/SuperAdminController.php` | ~865 | `abort(403, 'Unauthorized. Platform Owner role required.')` — user-visible error message |

> **IDE instruction:** For files #1–#7, change the string literal `Platform Owner` → `Hashmi Dashboard`. In #5 (`Hub.jsx`), change **only** the value of `label:`, never the object key `platform_owner:`.
> For #8, it's an error message shown to blocked users — rename if you want the branding consistent; it's optional (it's an error path). Your call.

### Do NOT touch (leave exactly as-is)

- Any occurrence of the lowercase key `platform_owner` (auth role identifier).
- The `platform_role` column comparisons in `app/Models/User.php`.
- PHP code **comments** containing "Platform Owner" (in `ImpersonationController.php`, `CleanDemoData.php`, `AccessGrant.php`, etc.) — cosmetic, not user-visible, and out of the approved scope.

### After editing

**[SERVER/BUILD] Step 3.1 —** Rebuild the frontend so the JSX changes ship:
```bash
npm run build
```
(No `ziggy:generate` needed — no routes changed.)

### Verify (Item 3)

- Grep confirms only the intended strings changed:
  ```bash
  grep -rn "Hashmi Dashboard" resources/js app
  grep -rn "'platform_owner'" app resources/js   # must STILL exist (role key intact)
  ```
- Load the platform dashboard: the brand badge and role labels read **Hashmi Dashboard**; login/permissions still work (role key untouched).

---

## ITEM 4 — Manual Launch Checklist: what's still open

`MANUAL_LAUNCH_CHECKLIST.md` in your folder is the human checklist. Below is the launch-critical subset, cross-referenced to the fixes above. Full detail is in that file.

### 🔴 Must be green before flipping the switch

- **DB backup + tested restore** of `venqore_pos` (Section 1). *Do this first — it's your rollback.*
- **Run pending migrations on production** (`php artisan migrate --force`) after the backup — includes `update_plan_prices`.
- **Item 1 above** — production owner `platform_role` fixed; plan prices editable on prod.
- **Item 2 above** — pick USD-only (A) or configure PKR (B); price shown == price charged.
- **One real end-to-end live payment + refund** through Lemon Squeezy (Section 2).
- **Webhooks reachable + signatures validate** (LemonSqueezy/WooCommerce) — check `webhook_logs`.
- **`.env` production-correct:** `APP_ENV=production`, `APP_DEBUG=false`, real keys, no test keys.
- **Change default credentials** — `platform@venqore.com / admin1234` must fail on prod.
- **Production caches** after deploy: `php artisan config:cache route:cache view:cache` (+ hard-refresh to clear the Inertia 409).
- **Queue worker/Horizon supervised** and **scheduler cron** installed (`* * * * * php artisan schedule:run`).
- **TLS valid + DNS correct** for `venqore.com`.

### 🟠 Strongly recommended

- Transactional email delivers to inbox (not spam), SPF/DKIM/DMARC.
- Error monitoring (Sentry) receiving events; uptime monitor on health route.
- Final smoke test: POS sale, purchase→pay supplier, return/refund, second-tenant isolation, offline-sync-once.
- Written rollback procedure + `php artisan down/up` maintenance mode.

### Verify (Item 4)

Tick each box in `MANUAL_LAUNCH_CHECKLIST.md` only when its "Done when" is literally true. Tell me which are done and I'll sanity-check the payment-related ones against the code.

---

## Suggested order of operations for today

1. **[SERVER]** Full DB backup of `venqore_pos` (+ copy off-server). *(Checklist §1)*
2. **[SERVER]** `php artisan migrate --force`, then `php artisan optimize:clear` → `config:cache route:cache`.
3. **Item 1** — fix production `platform_role`; verify plan-price save works (200, persists, no 403).
4. **Item 2** — decide **A** or **B**; make price-shown == price-charged; do one live charge + refund.
5. **Item 3** — rename display strings; `npm run build`; verify role key intact.
6. **Item 4** — walk the remaining 🔴 checklist boxes; final smoke test.
7. Confirm `APP_DEBUG=false`, default creds fail, rollback plan written. **Then launch.**

---

## What I need back from you (so I can verify)

- **1.1 result:** the production owner's `is_platform_admin` + `platform_role` values.
- **1.3 result:** does the plan-price save now succeed on prod?
- **Item 2 decision:** **A** or **B** (and whether LS supports PKR for your account).
- After **Item 3** build: paste the two `grep` outputs so I can confirm nothing else moved.

I will not change any code myself — send me results/screenshots at each Verify point and I'll tell you whether it's correct or needs another pass.
