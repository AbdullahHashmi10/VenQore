# VenQore — Hide All PKR Pricing (Reversible) — IDE Instructions

**Prepared:** 2026-07-24
**Goal:** Hide every PKR-facing element from customers for the USD-only launch, using a **single master switch** so it can be turned back ON later with a one-line change. **No PKR code is deleted** — only gated.
**Keep untouched:** the "Hashmi Dashboard" rename (already done) and all USD pricing.

> **Design:** Both `Pricing.jsx` and `Billing/Index.jsx` already compute a flag `isPK` from `geo.currency` / `country`. Every PKR banner, toggle, and estimate is downstream of that flag. We introduce one constant, `PKR_ENABLED`, and force `isPK` to be `false` while it's off. Flip `PKR_ENABLED` back to `true` later and everything returns exactly as it was.

---

## STEP 1 — `resources/js/Pages/Marketing/Pricing.jsx`

**1a. Add the master switch and neutralize `isPK`.**

Find (around line 96):
```javascript
    const isPK = geo.currency === 'PKR';
```
Replace with:
```javascript
    // ── PKR MASTER SWITCH ──────────────────────────────────────────────
    // Set to true to re-enable all Pakistani PKR pricing UI (banner, toggle,
    // Rs estimates). Kept OFF for the USD-only launch. Flip to true to restore.
    const PKR_ENABLED = false;
    const isPK = PKR_ENABLED && geo.currency === 'PKR';
```

**1b. Force the currency toggle default to USD.**

Find (around line 99):
```javascript
    const [currencyDisplay, setCurrencyDisplay] = useState(isPK ? 'PKR' : 'USD');
```
Leave as-is — because `isPK` is now always `false`, this already defaults to `'USD'`. No change needed, but confirm it reads exactly this.

**Why this is enough for Pricing.jsx:** the "SPECIAL GIFT UNLOCKED / Special Pakistan Subsidized Rates" banner and the "Subsidized PKR Rate ↔ Global USD Rate" toggle (lines ~485–530) are wrapped in `{isPK && ( … )}`. With `isPK` forced false, the entire block does not render. Every `pkrEstimate` / `≈ Rs …` line is likewise `if (isPK)` — all suppressed. USD prices are unaffected.

---

## STEP 2 — `resources/js/Pages/Billing/Index.jsx`

This file has **two** `isPK` definitions (two component scopes) **and** a separate CNIC verification panel. Handle all three.

**2a. Add the master switch once, at the top of the file** (just inside the first component, or as a module-level const above the components). Place this near the top, after the imports:
```javascript
// ── PKR MASTER SWITCH (see Pricing.jsx) — OFF for USD-only launch ──────
const PKR_ENABLED = false;
```

**2b. Neutralize the first `isPK`** (around line 114):
```javascript
    const isPK = geo.currency === 'PKR';
```
→
```javascript
    const isPK = PKR_ENABLED && geo.currency === 'PKR';
```

**2c. Neutralize the second `isPK`** (around line 284, inside the main `BillingIndex` export):
```javascript
    const isPK = country === 'PK' && pk_verification?.status === 'approved';
```
→
```javascript
    const isPK = PKR_ENABLED && country === 'PK' && pk_verification?.status === 'approved';
```

This hides: the "Special Pakistan Business Subsidized Rates Active" banner + "Subsidized PKR Price ↔ Global USD Price" toggle (lines ~805–849), and every `≈ Rs …` estimate in the plan cards and proration modal.

**2d. Hide the CNIC verification panel** (the "Submit your CNIC to unlock PKR checkouts" section). It is rendered around line 767 as `<PkVerificationPanel … />` and is gated by `pk_verification`, NOT `isPK`. Wrap its render in the switch.

Find (around line 767):
```javascript
                            <PkVerificationPanel
```
Locate the full element (it spans a few lines to its closing `/>`). Wrap the whole element:
```javascript
                            {PKR_ENABLED && (
                              <PkVerificationPanel
                                  … (existing props unchanged) …
                              />
                            )}
```
> If the panel sits inside a tab or card whose header also says "Regional / PKR", hide that header/tab trigger the same way (`{PKR_ENABLED && ( … )}`). Search the file for the tab label that opens this panel and gate it too, so there's no empty "PKR" tab left behind.

**2e. (Optional cleanup) The `currencyDisplay` default** (around line 309):
```javascript
    const [currencyDisplay, setCurrencyDisplay] = useState(isPK ? 'PKR' : 'USD');
```
Leave as-is — `isPK` is now false so it defaults to `'USD'`. Confirm only.

---

## STEP 3 — Backend safety (no PKR checkout can be reached)

The redirect logic in `app/Http/Controllers/BillingController.php@upgrade` sends PK-verified users to `checkout_url_pkr` **only if it is set**, else falls back to USD. For USD-only launch, ensure nothing is set:

**3a. [SERVER] Confirm no PKR checkout URLs are configured on production:**
- In the **Plans admin** (Hashmi Dashboard → Plans), confirm every plan's `checkout_url_pkr` and `checkout_url_annual_pkr` fields are **empty**.
- In production `.env`, confirm there are **no** `LEMON_SQUEEZY_*_PKR_URL` values set (they should be absent — verified absent in local `.env`).

If any are filled (e.g. a leftover test PKR product), clear them. With them empty, the code falls back to the USD checkout URLs automatically. **No code change needed here** — this is config verification only.

---

## STEP 4 — Rebuild

Because a route file changed earlier in this session, regenerate Ziggy first, then build:
```bash
php artisan ziggy:generate
npm run build
```

---

## STEP 5 — Verify (before pushing)

Run these greps and eyeball the app:

```bash
# The master switches exist and are OFF:
grep -n "PKR_ENABLED" resources/js/Pages/Marketing/Pricing.jsx resources/js/Pages/Billing/Index.jsx

# isPK is gated by the switch in all three spots:
grep -n "PKR_ENABLED && " resources/js/Pages/Marketing/Pricing.jsx resources/js/Pages/Billing/Index.jsx
```

Manual check (as a Pakistan-geolocated / PK-verified test user):
- Pricing page: **no** green "Special Pakistan Subsidized Rates" banner, **no** PKR/USD toggle, **no** `≈ Rs …` lines. All prices show `$`.
- Billing/upgrade page: same — no PKR banner, no toggle, no Rs estimates, **no CNIC "unlock PKR" panel/tab**.
- A non-PK (USD) user sees the normal USD pricing, unchanged.

---

## HOW TO TURN PKR BACK ON LATER (when the PKR Lemon Squeezy store is ready)

1. In **both** `Pricing.jsx` and `Billing/Index.jsx`, change:
   ```javascript
   const PKR_ENABLED = false;
   ```
   to
   ```javascript
   const PKR_ENABLED = true;
   ```
2. In the **Plans admin**, paste the PKR store's checkout URLs into each plan's `checkout_url_pkr` (+ annual).
3. `php artisan ziggy:generate` (only if routes changed) and `npm run build`.

Everything — banners, toggle, Rs estimates, CNIC panel, PKR checkout routing — returns exactly as before. Nothing was deleted.

---

## What this does NOT touch
- **Hashmi Dashboard rename** — untouched, stays as-is.
- **USD prices and checkout** — untouched.
- **The owner-role migration** — untouched.
- **PKR calculation code / product data** — preserved, only gated behind `PKR_ENABLED`.
