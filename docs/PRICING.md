# PRICING.md — Monetization Design

> Current implementation: plans/limits in DB (seeder), LemonSqueezy variants (monthly/annual/LTD/add-ons), geo pricing (PKR), grace→view-only enforcement, LTD stacking. This doc keeps what's built, tunes numbers, and defines policy.

## 1. Recommended price card (keep current numbers — they're right)

| | **Starter $19/mo** | **Growth $39/mo** ★ | **Business $79/mo** |
|---|---|---|---|
| Annual (2 months free) | $190/yr | $390/yr | $790/yr |
| Pakistan (PKR, geo) | ₨2,900/mo | ₨5,900/mo | ₨11,900/mo |
| Locations | 1 | 3 | 10 |
| SKUs | 1,000 | 10,000 | Unlimited |
| Staff | 3 | 10 | 50 |
| Transactions | Unlimited | Unlimited | Unlimited |
| Reports | Basic **+ P&L** (activation hook — keep!) | Advanced | All + exports |
| Production/BOM, e-invoicing, reconciliation, campaigns, reminders, recurring, funds | — | ✅ | ✅ |
| Loyalty, gift cards, API access, priority support | — | — | ✅ |
| WooCommerce / marketplace channels | Add-on | Add-on | 1 channel incl., rest add-on |
| AI (SmartCapture/Growth) | Add-on tiers | Add-on tiers | AI Lite included |

PKR guidance: don't FX-convert (that yields ₨5,300/₨10,900/₨22,000 — too high). Price to local willingness-to-pay vs Vyapar (₨~200/mo equiv) and Marg AMC: Starter ₨2,900 positions as "serious but reachable." Revisit quarterly; geo layer already supports session override + caching.

**Add-ons (env catalog already exists):** channels $9/mo each (Woo/Amazon/eBay/TikTok) · AI Starter $5 / Lite $9 / Pro $19 / Ultimate $39 / BYOK $5 · upload service one-time. Add-ons are margin protection: metered costs (AI tokens, sync API load) never hide inside flat plans.

## 2. AppSumo LTD (implemented: $49/$99/$179, stack 1/2/3)
- Caps: 500/2,000/6,000 tx/mo (already enforced via `transactions_per_month`); hosting 2 years then $9/mo hosting fee (documented in plans config — surface it EXPLICITLY on the deal page to avoid refund storms).
- Economics: assume AppSumo takes ~60–70% net of refunds (10–15% typical refund rate in the category). Model: 1,500 codes × $79 avg × 35% net ≈ **$41k cash** + ~3–5% of LTD users convert to add-ons/hosting later. LTD is a *customer-acquisition + cash* event, not a business model.
- Protections already built: tx caps, SKU/staff/location caps, AI excluded (add-on only), fail-closed flags, `scopeBillable` keeps MRR honest, grace→view-only instead of hard lock (retention-friendly). Add: LTD tier badge in-app + "stack one more code" upsell during the 60-day window.
- **Tier-3 restraint:** never include API access + unlimited staff in LTD — API is the abuse vector (bots syncing marketplaces on a $179 lifetime plan). Current seeder should keep `api_access=false` on all LTD tiers. Verify before launch.

## 3. Trials, grace, refunds, movement
- **Trial:** 14 days, no card (current). Add day-7 "here's your P&L from your real data" email — the aha artifact.
- **Grace:** limit-breach → 3-day grace → view-only (never delete data). Payment failure: 3 retries over 10 days (LemonSqueezy dunning) → 7-day grace → view-only 90 days → archive export offered. View-only forever beats deletion: dormant stores reactivate.
- **Refunds:** 14-day no-questions on first subscription charge; LTD refunds are AppSumo's 60-day policy (theirs, honor it); no refunds on metered AI add-on consumption. Refund playbook: always offer downgrade + 1-month credit first.
- **Upgrades:** immediate, prorated (LemonSqueezy handles). **Downgrades:** end-of-cycle (pending_downgrade mechanism already implemented). Over-limit on downgrade → same grace machinery.
- **Grandfathering:** price changes never touch existing subscribers for 12 months minimum; LTD terms immutable. Announce changes 30 days ahead. (Plan versioning: add `plans.version` column when first price change happens.)
- **Coupons:** launch (PH25 = 25% off 3 months), win-back (WB50 one month), partner codes. `Coupon`/`CouponRedemption` already modeled — cap redemptions + expiry always.

## 4. Unit economics guardrails
- Infra COGS/tenant ≈ $0.15–0.60/mo at monolith density (hundreds of tenants per 8GB box) + AI COGS metered → gross margin >90% on subs.
- Support is the real COGS: budget 1 support hour ≈ $6–10; Starter breaks even at <1.5 tickets/mo — deflect via demo store, docs, Vena chatbot (all built).
- Target LTV:CAC > 4. At $39 avg ARPU, 3% monthly churn → LTV ≈ $1,000 → CAC ceiling $250 (fine for content/community motion; too thin for paid ads until churn proven <2.5%).
- **KPI stack:** trial→paid ≥ 25% (with concierge import), logo churn ≤ 3%/mo year-1, add-on attach ≥ 20%, LTD→hosting-fee retention (year 3) ≥ 60%.

## 5. Abuse prevention (mostly built — verify + finish)
Tx caps on LTD ✅ · fail-closed flags ✅ · per-endpoint throttles (finish H6) · AI quotas + entitlements ✅ · storage quota per tenant (ADD — uploads currently unmetered) · one trial per email/store fingerprint (ADD light check) · seat = active membership (enforced) ✅ · demo isolated ✅.

## 6. Pricing page copy rules
Lead with Growth (featured ✅) · anchor against "POS + accountant + inventory app = $150+/mo separately" · show PKR toggle for PK visitors automatically (geo works) · FAQ must state: data export always free (churn-fear reducer, and it's true — exports exist) · LTD page must state tx caps + hosting-after-2-years in plain type.
