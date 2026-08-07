---
tags: [services, accounting, vensynq, marketplace, cashflow, t17]
---

# Marketplace Clearing Pipeline

Part of [[VenQore POS - Home]] · [[VenSynQ Integration Engine]] · [[V3 Accounting Engine]]

`app/Services/VenSynQ/MarketplaceSettlementService.php`

---

## The problem it solves

A $100 WooCommerce sale is **not** $100 of cash. Stripe holds it ~2 days and takes a fee.
Amazon holds it ~14 days. Before T17 the codebase got this wrong in two different ways
*at the same time*:

| Path | Behaviour before T17 | Consequence |
|---|---|---|
| `WooCommerceController::webhook()` | `DR 1000 Cash / CR 4000 Sales` | Owner sees spendable cash the gateway is still holding → overdrafts |
| `SmartFulfillmentService::processDropshipSale()` | **No journal at all** | Amazon / eBay / TikTok revenue, fees and COGS invisible on P&L and Balance Sheet |

> [!danger] The second one was the bigger bug
> Marketplace sales created Sale rows and Expense rows but never touched the general
> ledger. Every Amazon order was financially invisible.

---

## The model

```
SALE POSTED
    DR 1205 Marketplace Clearing    (gross − estimated fee)
    DR 5400 Marketplace Fees        (estimated fee)
        CR 4000 Sales Income        (gross)
    DR 5000 COGS / CR 1100 Inventory

PAYOUT CONFIRMED  (owner-driven, never automatic)
    DR 1010 Bank                    (what ACTUALLY landed)
    DR 5410 Fee Variance            (if the platform took more)
        CR 1205 Marketplace Clearing (what we expected)
        CR 5410 Fee Variance        (if we received more)

ONLINE REFUND
    DR 4000 Sales Income
        CR 1205 Marketplace Clearing
```

### Chart of accounts

| Code | Name | Type | Note |
|---|---|---|---|
| `1205` | Marketplace Clearing | asset | Receivable from the platform, **not** cash |
| `5400` | Marketplace & Gateway Fees | expense | Estimated commission |
| `5410` | Marketplace Fee Variance | expense | Estimate-vs-actual true-up |

> [!note] Why 5xxx and not 6xxx
> The original spec proposed `6150` / `6200`. This chart has no 6xxx band
> (`1000–1200`, `2000–2100`, `3000–3200`, `4000–4100`, `5000–5300`), and inventing one
> would orphan the accounts from every existing report grouping.

---

## Three decisions that shape the design

### 1. Estimates are never exact — hence 5410
The fee booked at sale time comes from `channel.fee_percentage`. It will **not** match
settlement to the cent, ever. Platforms deduct storage fees, advertising, dispute admin
and rolling reserves that no percentage can predict.

`confirmPayout()` captures `variance = actual_net − expected_net` and posts it to 5410.

> [!warning] Do not "fix" this into exact matching
> Any design promising cent-perfect reconciliation against an *estimate* produces software
> that looks broken on every single payout.

### 2. Refunds hit clearing, never the till
An online refund on an unsettled order has not touched the physical cash drawer. Deducting
it from `1000 Cash on Hand` — the naive implementation — creates a phantom till shortfall
the shopkeeper can never reconcile. `postRefundToClearing()` credits 1205 instead.

### 3. Notify, don't auto-sweep
Auto-posting `DR Bank / CR Clearing` on a timer creates deposits that may not have landed.
Once the ledger claims money arrived that didn't, bank reconciliation is unrecoverable.

`matureDuePayouts()` only flips `pending → due`. It moves **no money**. The owner confirms
what the bank statement actually shows — once per *batch*, not per order, so a fortnight of
Amazon sales is a single click.

`ecommerce_channels.auto_sweep` exists and defaults to `false`.

---

## Cutover, not backfill

Clearing is opt-in per tenant via `tenants.clearing_go_live_at`:

- `null` → pipeline off; legacy `DR 1000 Cash` posting is preserved verbatim.
- set → applies **only** to sales created at or after that timestamp.

`isClearingActive(Sale)` enforces both conditions. Historical entries are never rewritten,
so closed periods and already-filed reports stay byte-identical.

---

## Schema

### `marketplace_payouts`
One settlement batch per channel. Orders accrue into the open `pending` batch.

| Column | Purpose |
|---|---|
| `expected_gross` / `expected_fees` / `expected_reserve` / `expected_net` | What we predicted |
| `actual_net` | What the bank really received (null until confirmed) |
| `variance` | `actual_net − expected_net` → posted to 5410 |
| `expected_at` | `now() + channel.settlement_days` — drives arrival dates |
| `status` | `pending` → `due` → `confirmed` (or `cancelled`) |
| `journal_entry_id` | The DR Bank / CR Clearing entry |

### `ecommerce_channels` additions
`settlement_days`, `reserve_percentage`, `auto_sweep`, `settlement_bank_account_id`

Seeded defaults: Amazon 14d · eBay 2d · TikTok 7d · WooCommerce 2d.

### `sales` additions
`marketplace_payout_id`, `cleared_at`

---

## Bank subledger

GL account `1010` aggregates **every** bank. `BankAccount.current_balance` is the per-bank
subledger. `confirmPayout()` moves both in step via `creditBankSubledger()` — otherwise the
two views of "my bank balance" silently disagree.

---

## Routes

| Name | Method | Purpose |
|---|---|---|
| `store.vensynq.money-pipeline` | GET | JSON feed for the pipeline widget |
| `store.vensynq.payouts` | GET | Payout confirmation screen |
| `store.vensynq.payouts.confirm` | POST | The only path that moves clearing → bank |
| `store.vensynq.clearing.toggle` | POST | Set / clear the cutover timestamp |
| `store.vensynq.channels.settlement` | PATCH | Per-channel settlement terms |

---

## Frontend

| File | Purpose |
|---|---|
| `Components/MoneyPipeline.jsx` | 3-stage widget + per-channel breakdown + off-state explainer |
| `Payouts.jsx` | Confirmation screen with live variance explanation |

The middle stage is labelled **estimated** on purpose. Setting that expectation up front
prevents the "your numbers are wrong" support ticket when settlement differs.

---

## Known limitation — marketplace COGS precision

`SmartFulfillmentService` decrements `Stock` directly rather than going through
[[FIFO Inventory System]] (`V3\FifoService`), so per-batch costs are unavailable at that
point. T17 computes COGS as `product.cost_price × qty` — a **weighted-average
approximation, not true FIFO**.

This is a deliberate trade: the alternative today is posting revenue with *no* cost at all,
which overstates gross profit by 100%. Migrating this service onto `FifoService` is the
correct fix and is tracked as a follow-up.

FBA lines are excluded from COGS on purpose — that stock sits in the marketplace's
warehouse. See [[VenSynQ Integration Engine]].

---

## Tests

`tests/Feature/Module19/MarketplaceClearingT17Test.php` — 13 tests. Every one asserts the
double-entry balances, because an unbalanced marketplace journal corrupts the Balance Sheet
for every tenant using online channels.

Covered: clearing-not-cash · batch accrual · shortfall variance · overage variance ·
double-confirm guard · refund-to-clearing · clearing-off · pre-cutover sales ·
pipeline stages · reserve withholding · maturity moves no money · idempotent replay ·
fee capped at gross.

---

## See also
- [[VenSynQ Integration Engine]] · [[V3 Accounting Engine]] · [[FIFO Inventory System]]
- [[T17 - Marketplace Clearing Pipeline]] — the change log
