# VenQore — Full-Product Consistency & Correctness Audit

**Date:** 2026-06-29
**Scope of this pass:** Pricing/plan consistency across every source of truth, marketing-vs-reality (features pages), concurrency behaviour for the "100 simultaneous users" scenario, and carried-over code issues. Each finding cites the file + line so it can be fixed and re-verified.
**Method:** Read the three plan sources of truth (`config/plans.php`, `PlanFeatureMatrixSeeder` → `plan_limits`, and the hardcoded `Pricing.jsx` table) and cross-compared them; read sequence/locking code; spot-checked feature existence.

> **Headline:** You were right to suspect the pricing page. The pricing comparison table is hand-written and was never reconciled with the actual plan gates — it over-promises features to Starter that the backend blocks. Worse, there are **three** backend "sources of truth" for plan limits and they disagree with each other. None of this is a math-engine problem (that part is solid); it's a configuration/marketing-consistency problem.

---

## Severity legend
🔴 HIGH — customer-visible wrong promise, revenue/billing impact, or a feature sold-but-blocked
🟠 MEDIUM — internal contradiction that will bite, or a misleading number
🟡 LOW — cosmetic / hygiene
✅ GOOD — checked and healthy

---

## A. Pricing & Plan Consistency

### 🔴 A1 — There are THREE backend sources of plan limits and they disagree
- **`config/plans.php`** — header literally says *"This file is the single source of truth … PlanGate reads this to enforce limits."* **That statement is false.** PlanGate reads the `plan_limits` table, which is written by the seeder.
- **`PlanFeatureMatrixSeeder.php`** → `plan_limits` table — the **actual** runtime source.
- **`Pricing.jsx`** hardcoded comparison table — what the customer sees.

Concrete disagreements (config vs seeder):

| Limit | `config/plans.php` | Seeder (live) | Pricing table |
|---|---|---|---|
| SKU — growth | `null` (unlimited) | `10000` | 10,000 |
| SKU — business | `null` (unlimited) | `50000` | 50,000 |
| Staff — business | `null` (unlimited) | `50` | 50 |
| Locations — business | `null` (unlimited) | `10` | 10 |
| Owner's Daily Pulse — starter | `true` | `0` (off) | n/a |

The config file says "business = unlimited" for SKUs/staff/locations; the live seeder caps them. **Any code path that reads `config('plans...')` instead of `plan_limits` will allow unlimited where you intend a cap.** Fix: make `config/plans.php` either match the seeder exactly or delete it and point everything at `plan_limits` (and fix the misleading header comment).

### 🔴 A2 — The monthly transaction cap (the F17 fix) is effectively OFF for all paid plans
- `PlanFeatureMatrixSeeder.php:259` → `transactions_per_month` = `null` for **trial, starter, growth, business** (only LTD plans get caps: 500/2000/6000 at lines 313–315).
- `config/plans.php` says starter `2000`, growth `10000`.
- `null` = unlimited, so `PlanGate::enforce('transactions_per_month')` (the F17 enforcement you built and verified) **never triggers for subscription customers.**
- Either intentional (subscriptions are unlimited) or a seed bug — but it directly contradicts config, and it means the cap you carefully added does nothing for 4 of 7 plans. Decide and make the two files agree.

### 🔴 A3 — Pricing table promises Starter features the backend blocks
The hardcoded comparison table in `Pricing.jsx` was never reconciled with the seeder:

| Pricing table row | Table says Starter | Seeder reality | Result |
|---|---|---|---|
| Profit & Loss Statement (`Pricing.jsx:850`) | ✅ included | `report_profit_loss` starter=`0` (`Seeder:215`) | **Starter buyer sees P&L locked** |
| Bank Reconciliation (`Pricing.jsx:844`) | ✅ included | `bank_reconciliation` starter=`0` (`Seeder:188`) | **Starter buyer sees it locked** |

A Starter customer who bought because the pricing page promised P&L will hit a lock screen → "I paid for this" support ticket / refund. These are the highest-impact items.

### 🟠 A4 — Pricing table *under*-promises Cash Flow to Starter
- `Pricing.jsx:852` shows Cash Flow as Growth+ only (Starter ❌).
- `report_cash_flow` is `1` for **all** plans incl. starter (`Seeder:204`).
- Harmless to the customer but proves the table was guessed, not generated. (P&L over-promised, Cash Flow under-promised on the same page.)

### 🟠 A5 — Same page contradicts itself: dynamic cards vs hardcoded table
- The plan **cards** call `getPlanIncludes()` which reads live `plan_limits` (`Pricing.jsx:244–306`).
- The **comparison table** below is hardcoded (`Pricing.jsx:817–861`).
- If the DB ever holds different numbers (and per A1 the config thinks growth SKUs are unlimited), the card and the table on the *same screen* show different limits. Generate the table from the same source the cards use.

### 🟠 A6 — PKR vs USD pricing uses inconsistent FX
`Pricing.jsx:123–131` fallback prices:

| Plan | USD/mo | PKR/mo | Implied FX | LTD USD | LTD PKR | Implied FX |
|---|---|---|---|---|---|---|
| Starter | $36 | Rs 1,100 | ~31× | $79 | Rs 22,120 | 280× |
| Growth | $63 | Rs 1,800 | ~29× | $199 | Rs 55,720 | 280× |
| Enterprise | $129 | Rs 5,300 | Rs 41× | $399 | Rs 111,720 | 280× |

Monthly/annual use ~30× but LTD uses 280×. Also the **USD LTD pays for itself in ~2–3 months** ($79 LTD vs $36/mo), which is almost certainly underpriced unless it's a deliberate AppSumo loss-leader. Confirm this is intentional — at current numbers a US customer should always buy LTD over subscription.

### 🟡 A7 — Plan naming split: "Enterprise" (marketing) vs "business" (backend)
`Pricing.jsx` calls the top tier **"Enterprise Engine"**; the backend slug is `business` everywhere (`config/plans.php`, seeder). The page maps `enterprise → business` / `enterprise → ltd_3` (`Pricing.jsx:221–229`). Works, but the mismatch will confuse support, analytics, and any future dev. Pick one name.

---

## B. Marketing vs Reality

### 🔴 B1 — E-commerce sync channels are SOLD on pricing but DISABLED for everyone
- `Pricing.jsx:364–369` sells WooCommerce, Amazon, eBay, TikTok sync at $10/mo (USD) each.
- Seeder disables them on **every** plan: `woocommerce`/`woocommerce_*` = `0` (lines 173–176), and the whole VenSynQ group (`vensync_command`, `marketplace_oauth`, etc.) = `0` (lines 166–172). Your own launch checklist says "confirm VenSynQ off in prod."
- Add-on purchase *can* write a per-tenant override (`BillingController:447` updates `tenant.plan_limits`), **but I could not confirm the sync add-on flips the exact `woocommerce` key.** Given this codebase's history of key-name mismatches (M1-06b wrong account, B10 param mismatch, `recurring_invoices` gating on the `invoice_reminders` key), this needs an explicit check: **buy the WooCommerce add-on as a test tenant and confirm `/woo/connections` returns 200, not 403.** If the key doesn't match, the customer pays $10/mo and stays locked.

### 🔴 B2 — AI is the entire pitch, but every AI flag defaults to OFF
- The pricing page headline is *"Pick your plan. Power it with AI."* and sells AI Core/Lite/Pro/Ultimate.
- Seeder: `ai_assistant` (line 239), `smart_capture` (266), `growth_engine` (268), `ai_churn_predictions`/`ai_revenue_forecasting`/`ai_outreach_copy` (269–271) are **all `0` on all plans.**
- Same risk as B1: the per-tenant override on purchase must flip these exact keys. **Verify the Lemon Squeezy AI add-on → `plan_limits` override → the `ai_*` key the gate checks, end to end.** This overlaps your List-B Lemon Squeezy test — make "AI actually unlocks after purchase" an explicit assertion.

### 🟠 B3 — Loyalty & Gift Cards: advertised Enterprise, but gated behind a flag that's off everywhere
- Routes exist (`routes/web.php:1306–1313`, `GrowthEngineController`), so the feature is built.
- But they live under the **Growth Engine**, and `growth_engine` = `0` on all plans in the seeder, while the advertised flags `loyalty_points`/`digital_gift_cards` are `business=1` (Seeder:93–94).
- So there are **two different keys** for the same capability and they disagree. Confirm which key actually gates the routes; if it's `growth_engine`, loyalty/gift cards are locked for everyone including Enterprise — directly contradicting `Pricing.jsx:845`.

### 🟠 B4 — Report count is stated four different ways
- Pricing page: **"40-Report Full Suite"** (`Pricing.jsx:853`)
- Features page: **"38 Master Reports"** / "38 Verified Reports" (`Features.jsx:165,282`)
- Seeder comment: "Report Factory (40 Reports)" (`Seeder:198`)
- Internal docs: "43 reports"; forensic audit: "~57 report routes"
- Two **customer-facing** pages disagree (40 vs 38). Pick the real number and use it everywhere.

### 🟠 B5 — Features page claims "Multi-currency with real-time exchange rates"
- `Features.jsx:125`. The `multi_currency` flag is on for all plans (`Seeder:256`), but the only currency logic I found is **display-side geo pricing (USD/PKR) on the marketing page** — not transactional multi-currency with live FX. Your own C2 audit flagged "multi-currency" as a non-existent feature. Either build it, soften the claim, or remove it (false-advertising risk).

---

## C. Concurrency — the "100 simultaneous users" scenario

### ✅ C1 — Core write-safety is solid
- **Invoice/transaction numbers:** `SequenceService::generateTransactionNumber` wraps the increment in `DB::transaction` + `lockForUpdate()` on the sequence row (`SequenceService.php:49–77`) → no duplicate invoice numbers under concurrency. A `reference_number` unique index backs it up.
- **Stock oversell:** FIFO deduction is row-locked (`FifoService::deductStock` `lockForUpdate`, per the forensic audit) → two cashiers selling the last unit can't both succeed.
- **POS returns:** idempotent (cache lock + journal-key dedupe, M1-09).

### 🟠 C2 — One hot row per store throttles checkout under load
- Every terminal defaults to register **`R1`** — the per-terminal ID is a TODO (`SequenceService.php:40`). So all cashiers in a store share one `transaction_sequences` row and **serialize** on its `lockForUpdate`. Correct (no duplicates) but it's a contention bottleneck: 100 simultaneous sales in one tenant queue behind a single row lock. For real multi-terminal stores, give each terminal its own `register_id` so they don't block each other.

### 🟠 C3 — Re-test tenant/permission resolution under concurrency
- The stale-membership memo bug (M1-EX1) was an app-wide auth-resolution issue where tenant context could resolve to the wrong/stale membership. It's fixed, but it's exactly the class of bug that resurfaces under heavy concurrent multi-tenant traffic. Add a concurrent-request isolation test before you trust 100 simultaneous mixed-tenant users.

---

## D. Carried-over code issues (still open from prior audits)

- 🟠 **D1 — Criterion-3 (one-source presentation) not finished.** `AdminController` has ~15 raw `sum()`/`count()`/`DB::table` aggregates (not via the core engine), and parts of the AI assistant compute their own numbers. Main money screens (Dashboard/P&L/reports) are wired to the core; these admin/AI corners are not. → an admin screen can show a number that doesn't match the core.
- 🟠 **D2 — SEC-1:** reset/admin passcode hardening. Status ambiguous (the old plaintext compare in `SystemResetController` no longer matched my search) — verify it now uses the hashed `security_pin`.
- 🟠 **D3 — `featuresArray()` fail-open.** The `!== false` logic means any **new** feature key not present in the seeder defaults to **unlocked**. Safe today (all keys seeded) but a footgun the moment someone adds a feature and forgets to seed it.
- 🟡 **D4 — Engine duality (C5).** Two `SaleController`s / `FifoService`s / `InventoryService`s still coexist. You've (reasonably) deprioritized this, but it's why a fix can land on one path only — which already happened once (M1-06b tax went to the wrong account in the V3 path only). Keep the guard/reconciliation tests green as the safety net.
- 🟡 **D5 — Dead file shipped.** `resources/js/Pages/LandingPage.backup-20260628-100044.jsx` (59 KB) sits next to the live `LandingPage.jsx` (118 KB). Remove backups from the repo so they can't be imported or drift.

---

## E. Scope honesty — what this pass did NOT cover

This was a targeted deep-dive on the highest-risk consistency surfaces (pricing, plans, features, concurrency, residual code). It did **not** include: a render pass on all 91 Inertia pages, A4/thermal print layout, mobile cut-off per screen, email/receipt templates, every one of 173 controllers' route-by-route behaviour, or a real load test at 100k+ rows. Those remain worthwhile (several are in your manual List B). Happy to take any one area and go page-by-page next.

---

## Suggested fix order (cheapest, highest-impact first)
1. **A3** — fix the Starter rows on the pricing table (P&L, Bank Reconciliation) so you don't promise what you lock. *(minutes)*
2. **A1/A2** — reconcile `config/plans.php` with the seeder (or delete config and fix the header), and decide the real `transactions_per_month` caps. *(small)*
3. **B1/B2** — test that buying a WooCommerce/AI add-on actually unlocks the gate key. *(part of your Lemon Squeezy List-B test)*
4. **B4** — pick one report number (38/40/43) and use it on both marketing pages. *(minutes)*
5. **A5** — generate the comparison table from `plan_limits` so the page can never contradict itself again. *(small-medium)*
6. **B3, B5, D1–D5** — the rest, as hardening.

*None of these touch the verified money engine. They're configuration and copy — which is exactly where "are we consistent?" lives.*
