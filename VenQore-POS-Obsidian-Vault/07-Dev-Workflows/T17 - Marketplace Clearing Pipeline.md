---
tags: [changelog, ticket, accounting, vensynq, t17]
---

# T17 — Marketplace Clearing Pipeline (Cash vs Clearing)

Part of [[VenQore POS - Home]] · [[Marketplace Clearing Pipeline]] · [[T16 - VenSynQ Integration Audit]]

**Date:** 2026-08-01 · **Scope:** Phase 1 foundation + refund fix · **Status:** code complete, verification pending

---

## Decisions taken

| Question | Decision |
|---|---|
| Historical data | **Cutover only.** `tenants.clearing_go_live_at`; nothing before it is rewritten |
| Settlement behaviour | **Notify only.** Owner confirms each payout; `auto_sweep` defaults false |
| Scope | **Phase 1 foundation + refund fix.** Mapping wizard, Cash Radar, payout chips deferred |

---

## The bug this exposed

The starting question was "should Woo post to Cash or Clearing?". Investigating it turned up
something larger:

> `SmartFulfillmentService::processDropshipSale()` posted **no journal entry at all**.

Marketplace sales created a `Sale` row and an `Expense` row, and stopped. Amazon, eBay and
TikTok revenue, fees and COGS never reached the general ledger. Meanwhile WooCommerce posted
`DR 1000 Cash`, overstating spendable cash.

So the pre-T17 state was: **Woo overstated cash, and every other marketplace was
financially invisible.**

---

## What was built

| Area | Change |
|---|---|
| Chart | `1205` Marketplace Clearing, `5400` Marketplace Fees, `5410` Fee Variance |
| Service | `MarketplaceSettlementService` — post to clearing, confirm payout, refund, pipeline, maturity |
| Model | `MarketplacePayout` — expected vs actual settlement batches |
| Schema | `marketplace_payouts`; settlement columns on `ecommerce_channels`; `marketplace_payout_id`/`cleared_at` on `sales`; `clearing_go_live_at` on `tenants` |
| Wiring | `processDropshipSale()` now posts to clearing; Woo webhook switches to 1205 **after cutover only** |
| Fix | Online refunds credit 1205 instead of raiding `1000 Cash on Hand` |
| UI | `MoneyPipeline.jsx` (3-stage widget), `Payouts.jsx` (confirmation + live variance) |
| Routes | 5 new, ziggy patched |
| Tests | 13 ledger-balance tests |

### Settlement defaults seeded
Amazon 14d · eBay 2d · TikTok 7d · WooCommerce 2d — overridable per channel.

---

## Deliberate design choices

**Fee estimates are never exact.** `5410` exists precisely because they aren't. Anyone
tempted to make the numbers "match to the cent" should read
[[Marketplace Clearing Pipeline]] first.

**Auto-sweep is off by default.** Posting bank deposits that may not have landed is worse
than the ghost-cash problem it solves — it makes bank reconciliation unrecoverable.

**Fee is capped at gross revenue.** A misconfigured `fee_percentage` can never drive the
clearing balance negative.

**Posting is idempotent.** A replayed webhook is a no-op: the sale is skipped once it
carries a `marketplace_payout_id`, and entries carry `idempotency_key`.

---

## Where I pushed back on the original spec

| Proposed | Verdict |
|---|---|
| `6150` / `6200` account codes | **Renumbered to 5400/5410.** No 6xxx band exists in this chart |
| Cash vs Accrual toggle | **Cut.** "Same ledger, both views" is not achievable as described — real cash-basis needs every expense linked to payment date, and cash-basis COGS for an inventory business is misleading. Most jurisdictions require accrual once you hold stock. Should be a **cashflow statement**, not a P&L switch |
| Gateway Audit Guard | **Deferred.** Needs real settlement feeds (SP-API Finances, Stripe `balance_transactions`). Diffing against our own estimate yields only false positives |
| "Numbers match to the exact cent" | **Rejected as a goal.** Replaced with explicit variance true-up |
| Auto-sweep | **Kept, but opt-in and off by default** |
| Refunds → clearing pool | **Promoted to Phase 1.** Cheapest item on the list and a real correctness bug |

---

## Verification status

| Gate | Status |
|---|---|
| PHP structural lint, no NUL bytes | ✅ 10 files |
| JSX parse | ✅ 6 files |
| `ziggy.js` valid, 920 routes | ✅ |
| `php artisan test` | ⏳ no PHP in build sandbox |
| `php artisan migrate` | ⏳ no MySQL in build sandbox |
| `npm run build` | ⏳ `node_modules` is a Windows install |

### Run locally

```bash
php artisan migrate
php artisan db:seed --class=AccountSeeder    # adds 1205 / 5400 / 5410
php artisan ziggy:generate
npm run build
php artisan test --filter=T17
php artisan test
```

> [!important] Enabling clearing
> The pipeline stays dormant until a tenant turns it on (dashboard → "Turn on Clearing",
> or set `clearing_go_live_at`). Until then behaviour is byte-identical to pre-T17.

---

## Follow-ups

- **Marketplace COGS precision** — currently `cost_price × qty`, not true FIFO. Fix by
  migrating `SmartFulfillmentService` onto `V3\FifoService`. See [[FIFO Inventory System]].
- **Real settlement ingestion** (SP-API Finances / Stripe) — unlocks Gateway Audit Guard
  and exact fee capture.
- **Cash Arrival forecasting** — the data model already supports it via `expected_at`.
- **Payout destination chips** (pay supplier bill / owner drawings) — touches AP and equity,
  needs its own journal review.
- **Multi-currency FX on payout** — needs an FX rate source and a realised gain/loss account.
