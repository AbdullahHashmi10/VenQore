# VenQore POS — Master Implementation Plan (85 → 92 → 100)

**Author:** Forensic audit follow-on (same ruthless, no-optimism standard as `VenQore_Forensic_Audit_Report.md`)
**Date:** 2026-06-20
**Companion docs:** `VenQore_Forensic_Audit_Report.md` (findings F1–F17), `VenQore_10_Day_Launch_Plan.md` (Days 1–10)

> **How to use this file:** This is the single source of truth from today until launch and beyond. Three milestones, in order. You start selling the moment **M1 (Sellable / 85)** is signed off — not before, because before it the system can lose money. You keep working toward **M2 (Trustworthy / 92)** while early customers use it, and toward **M3 (Perfect / 100)** over the following months. Every work item has an owner-checkable **acceptance test**. Nothing is "done" until its acceptance test passes. No item is marked done on vibes.

---

## 0. The One Thing You Must Understand First

You have been running **two separate tracks without realizing they were separate:**

1. **Launch-Readiness track** = your `VenQore_10_Day_Launch_Plan.md` (roles, security PIN, plan-gating, mobile, payments, backup). This makes the product *operable and packaged to sell*.
2. **Financial-Correctness track** = the forensic audit (F1–F17: returns, ghost revenue, pre-sale COGS, tax-on-discount, fractional quantities, tenant leak, indexes). This makes the product *safe to trust with money*.

**Your 10-day plan is ~60% done. But it contains zero items from the Financial-Correctness track.** Completing all 10 days would give you a product that has clean roles and a gated reports hub — that still refunds money it shouldn't (F1), shows three different profit numbers (F2), and leaks every tenant's bank accounts (F3).

**Therefore: "10-day plan complete" is NOT "Sellable."** Sellable = the remaining launch items **plus** the audit's blocking set. This plan merges them into one ordered backlog.

---

## 1. Scoring Rubric — what each milestone actually means

These are the definitions we will hold the line on. A dimension only counts toward a milestone when its acceptance tests pass.

| Dimension | Audit score today | **M1 Sellable = 85** | **M2 Trustworthy = 92** | **M3 Perfect = 100** |
|---|---:|---|---|---|
| **Financial Accuracy** | 38 | Returns capped & netted; pre-sale posts COGS; tax after discount; journals still balance | + multi-payment edge cases; rounding reconciliation proof; charity/expense/debit-note traced | Accountant signs off on every transaction type; multi-currency safe |
| **Inventory Accuracy** | 45 | Fractional qty (decimal); POS-return correct warehouse & sign; no over-restore | + single source of truth (stocks = Σ batches); reconciliation job green | Concurrency stress-tested; serial/batch/variant all reconcile |
| **Reporting Accuracy** | 34 | 4 profit reports net returns; supplier statement sign fixed; P&L == item-wise after a return | + all 43 reports reconcile to DB; timezone-correct | Automated per-report reconciliation suite in CI, all green |
| **Security & Multi-Tenancy** | 44 | Bank-accounts leak closed; raw-query sweep done; granular admin perms | + IDOR tests on every route; rate-limiting; secrets rotated | Full OWASP + external pen-test passed |
| **Scalability** | 24 | Core composite indexes added; P&L/low-stock de-N+1'd | + paginated listings; load-tested at 100K rows | Load-tested 1M–10M rows; query budgets enforced |
| **Customer-Sat (predicted)** | 33 | Numbers reconcile; nothing silently corrupts | + mobile usable; fast | Polished, fast, trusted |
| **Overall** | **41** | **85** | **92** | **100** |

---

## 2. Verified Status of the 10-Day Launch Plan (ruthless re-check)

I re-checked every "done" day against the actual code. Verdicts below are evidence-based (file:line). **Green = truly done. Amber = partial/wrong-as-specified. Red = not done.**

| Day | Item | Verdict | Evidence / problem found |
|---|---|---|---|
| **1** | Granular permission enforcement (45 keys) | 🟢 Done | `CheckPermissions.php` L59 checks granular keys; `User::hasPermission` L212; legacy broad map retired |
| **2** | Backend PIN on Fund add/remove/transfer | 🟢 Done (well) | `FundController.php` L282/385/498 `Hash::check($passcode, security_pin)` |
| **2** | `PartyController::bulkDestroy` passcode wired | 🟢 Done | L481 `Hash::check`; **verify** the `nullable` passcode (L474) can't be skipped for zero-balance parties |
| **2** | Rate-limit PIN attempts | 🟢 Done | `ProfileSecurityController.php` L59–85 `RateLimiter` 5/5min |
| **2** | Unify passcode systems | 🟡 Verify | Fund uses `security_pin`; confirm settings/`admin_passcode` flow also points here |
| **3** | Charity → proper double-entry | 🟢 Done | `CharityController.php` L81 `AccountingService::createEntry()` |
| **3** | Charity enable toggle (off by default) | 🟢 Done | `charity_enabled` setting read L36 |
| **4** | Barcode "type number = qty" bug removed | 🟢 Done | Pos.jsx 700-740 now clean barcode/SKU lookup; `lastAddedItemId` remains only for intentional item-action shortcut (L1189) — **re-test on real hardware** |
| **4** | Hide WooCommerce on **all** tiers | 🔴 **Not as specified** | `PlanFeatureMatrixSeeder.php` L173 still `growth:'1', business:'1'` — plan said set FALSE everywhere |
| **4** | Disable VenSynQ | 🟢 Effectively done | `config/vensynq.php` L5 defaults `false`; controller/jobs L28/29/32 honor it. **But** live Amazon refresh-token + TikTok secret sit in working `.env` (`SIMULATION_MODE=false`) — rotate & confirm flag stays off |
| **4** | Cookbook backend gating on every action | 🟡 Partial | Only `simulate()` checks, via `PlanGate::check('bill_of_materials')` (L19) — uses `check()` not `enforce()`, wrong key, not on create/update/delete |
| **5** | PlanGate on Production/E-Invoicing/BankRec/Marketing/Invoice-Reminders | 🟢 Done | All 5 `enforce()` calls present (verified in audit) |
| **5** | Fund Management unlock + tenant-scoped | 🟢 Done | `FundController` membership scoped by `tenant_id` L279+ |
| **6** | 43-report tier gating, one shared map | 🟢 Done | `config/report_tiers.php` (44 keys) + `ReportTierGate::enforce` on **41/41** ReportController methods |
| **7** | Lemon Squeezy live test / A4 print / chat z-index / SmartCapture | 🔴 Remaining | Not verified complete — treat as TODO |
| **8** | Google Drive backup+restore proven | 🔴 Remaining | Not verified |
| **9** | Mobile Tier-1 (~25-30 views) | 🔴 Remaining | Not verified |
| **10** | Full regression + reconciliation spot-check | 🔴 Remaining | Not verified |
| **Parking** | Stock-adjust passcode hardcoded `123456` | 🟡 Partial | Frontend hardcode removed (`GlobalProviderLayout.jsx` L34 commented out); confirm the stock-update flow now checks the real PIN |

**Summary:** Days 1, 2, 3, 5, 6 are substantially done and several are high quality. **Day 4 has three real gaps (WooCommerce flag, Cookbook gating, secrets hygiene). Days 7–10 remain.** You are ~60% through the *launch* track and **0% through the *money* track.**

### New problems found during this re-check (were not in either prior doc)

- **NP-1 (Medium):** WooCommerce still enabled for Growth/Business in the feature matrix despite the plan to hide it everywhere — half-shipped feature visible to paying tiers (`PlanFeatureMatrixSeeder.php` L173–176).
- **NP-2 (Medium):** Cookbook gating is `check()` on one action under the wrong feature key — bypassable on create/update/delete by direct request (`CookbookController.php` L19).
- **NP-3 (Medium):** Live marketplace secrets (Amazon refresh token, TikTok secret, Amazon client secret) present in the working `.env` with `VENSYNQ_SIMULATION_MODE=false`. Not in git, not in release zips (good), but must be rotated before any public release and the flag confirmed off.
- **NP-4 (Low, verify):** `bulkDestroy` passcode is `nullable` — confirm a zero-balance bulk delete can't bypass PIN entirely if that's not intended.

---

## 3. The Merged Backlog (single ordered list)

Every work item, both tracks, with source, severity, effort (S ≤1d / M 2-4d / L ≥1wk), milestone, and the acceptance test that closes it. **Do them top to bottom.**

### MILESTONE 1 — SELLABLE (target 85). Start selling the day this is signed off.

| ID | Item | Source | Sev | Effort | Acceptance test |
|---|---|---|---|---|---|
| M1-01 | Add `returned_quantity` to `sale_items`; cap every partial return at remaining-returnable; block over-return | F1 | 🔴 | M | Sell 5, return 3, return 3 → 2nd refunds only 2 then blocks; `Σ refunds ≤ net_sales` |
| M1-02 | Net returns out of the 4 profit reports (subtract returned qty/revenue/COGS) | F2 | 🔴 | M | After golden txn, Item-wise Profit shows **13 units** and GP == P&L GP to the cent |
| M1-03 | Tenant-scope `/api/bank-accounts`; then grep-audit all 621 raw `DB::table()` for missing tenant filter | F3, F13 | 🔴 | M | Two-tenant test: A sees only A's bank accounts; CI grep finds no unscoped tenant table |
| M1-04 | Block force-delete of journaled docs; route voids through `SaleReversalService` only | F4 | 🔴 | S | Force-delete a journaled sale → blocked; prior-month P&L identical before/after any void |
| M1-05 | Pre-sale conversion: post DR COGS / CR Inventory; carry real tax; real payment status | F5 | 🔴 | S | Convert pre-sale → BS balances, Inventory drops by COGS, P&L COGS rises, GP == item-wise |
| M1-06 | Compute tax **after** order-level discount (one waterfall: gross→item disc→order disc→tax→round) | F7 | 🔴 | S | Item 100, 10% tax, 50 order disc → invoice 55, tax 5; journal 2100 = 5 |
| M1-07 | Migrate `sale_items.quantity` (+`free_quantity`) to `DECIMAL(12,4)`; backfill | F9 | 🔴 | S | Sell 2.5 units → `sale_items.quantity = 2.5` == `Σ qty_deducted` |
| M1-08 | Add core composite indexes (sales, sale_items, journal_items, journal_entries, stocks, inventory_batches) | F11 | 🔴 | S | `EXPLAIN` shows `ref`/`range` not `ALL`; P&L < 500ms at 100K rows |
| M1-09 | POS open-return: store as negative/return type (exclude from revenue), restore original warehouse, idempotent | F6 | 🔴 | M | Open-return 1 unit → revenue reports don't rise; correct warehouse +1 once on double-submit |
| M1-10 | Fix supplier party-statement sign (credit-normal AP) | F8 | 🔴 | S | 45,000 credit purchase → supplier statement closing = **+45,000 payable** == Aged Payables |
| M1-11 | Close Day-4 gaps: WooCommerce false on all tiers (NP-1); Cookbook `enforce()` on all actions (NP-2) | Day4, NP-1/2 | 🟡 | S | Starter & Growth: Woo hidden + URL blocked; Cookbook create blocked for Starter via direct POST |
| M1-12 | Rotate marketplace secrets; confirm VenSynQ flag off in prod (NP-3) | NP-3 | 🟡 | S | New creds; `config('vensynq.enabled')` false in prod; old tokens revoked |
| M1-13 | **Day 7** — Lemon Squeezy live test purchase → plan activation chain | Day7 | — | M | Test card → `subscription_created` → tenant gets plan + active + StoreLicense |
| M1-14 | **Day 7** — A4 print, chat-widget z-index fix, SmartCapture final pass | Day7 | — | S | A4 totals correct; chat bubble clickable on fresh session; SmartCapture end-to-end |
| M1-15 | **Day 8** — Google Drive OAuth + backup + restore on local test store | Day8 | — | M | Backup of real store restores into test store; spot-checked numbers match |
| M1-16 | **Day 10** — Reconciliation spot-check (cash drawer + 10 product counts) + full regression | Day10 | — | M | No unexplained discrepancy; all M1 acceptance tests pass as Owner/Manager/Starter/Growth |
| M1-17 | Build the **Golden-Transaction test** (automated) | Verify | 🔴 | S | CI runs buy 10@50/10@100, sell 15@200 credit, return 2 → asserts every number |

**M1 exit gate:** every M1 acceptance test green + the Golden-Transaction test green. **Only then do you start selling.**

### MILESTONE 2 — TRUSTWORTHY (target 92). Work this while early customers use the product.

| ID | Item | Source | Sev | Effort | Acceptance test |
|---|---|---|---|---|---|
| M2-01 | Tenant timezone for all daily/dashboard date filters; standardize on `posted_at` | F10 | 🟠 | M | Karachi tz: 02:00-local sale counts on local date; dashboard == daily report |
| M2-02 | De-N+1 P&L, Balance Sheet, low-stock, item-detail; fix low-stock warehouse filter | F12 | 🟠 | M | P&L ≤ 3 queries; low-stock ≤ 2 and honors warehouse filter |
| M2-03 | Enforce `transactions_per_month` on the live `POST /sales` route (middleware/observer) | F17 | 🟡 | M | 500-tx plan blocks the 501st sale via the real route |
| M2-04 | Single source of truth for stock (stocks = Σ inventory_batches via projection/view); net negative-stock batches | F14 | 🟠 | L | Reconciliation job: `stocks.quantity == Σ remaining_qty` per product/warehouse, always |
| M2-05 | Header discount invariant: `subtotal − discount == net_sales` | F15 | 🟡 | S | Property test over random sales asserts the invariant |
| M2-06 | Per-report reconciliation tests for all 43 (card ↔ report ↔ DB) | Audit §4 | 🟠 | L | Each report has a test comparing its headline to a direct DB aggregate |
| M2-07 | IDOR pass: every route-model binding tenant-checked; rate-limit auth/PIN/API | F13, Sec | 🟠 | M | Tenant A passing B's id into any route param → 403/404 |
| M2-08 | **Day 9** — Mobile Tier-1 (~25-30 critical views) | Day9 | — | M | POS, dashboards, P&L usable at 375px on real phone |
| M2-09 | Unify passcode systems fully (NP-4) + stock-adjust PIN wired | Day2/Parking | 🟡 | S | All sensitive actions use one `security_pin`; no hardcoded passcode anywhere |
| M2-10 | Multi-payment split + rounding reconciliation proofs | Audit §B | 🟠 | M | Split cash/card/credit sale: Σ splits == grand total; trial balance balances |

**M2 exit gate:** all M2 acceptance tests green; a real pilot store runs a full week with no money/inventory discrepancy.

### MILESTONE 3 — PERFECT (target 100). The long tail.

| ID | Item | Source | Sev | Effort | Acceptance test |
|---|---|---|---|---|---|
| M3-01 | **Collapse the V3/legacy duality** — one lineage for SaleController, InventoryService, ProductController, FifoService; delete the other | Audit §6 | 🔴 | L | Only one write path per domain; dead controllers deleted; all tests green |
| M3-02 | Granular admin permissions (split `data.export`, `records.force_delete`, `users.manage`) | F16 | 🟡 | S | Settings-only role blocked from export & force-delete |
| M3-03 | Load test 1M then 10M rows; add query budgets; paginate everything | F11/Perf | 🟠 | L | P&L p95 < 300ms at 1M; no endpoint > 1s at 1M |
| M3-04 | Full OWASP pass + external pen-test (XSS, CSRF, SQLi, file-upload, webhook, AI prompt-injection) | Sec §10 | 🟠 | L | Clean pen-test report; AI endpoints tenant-scoped & entitlement-gated |
| M3-05 | Money-type precision standardization across all tables | Audit §6 | 🟡 | M | All money columns same precision; cross-table aggregation drift = 0 |
| M3-06 | Cascade-delete audit: no master delete cascades into sales/journal/batches | Audit §6 | 🟡 | S | Deleting a product/party/warehouse never destroys financial history |
| M3-07 | Accountant sign-off across every transaction type + a closed-period lock | Fin | 🟠 | M | CA reviews books for a full simulated month; posted periods immutable |
| M3-08 | Full report-reconciliation suite in CI (all 43, all four edge cases) | Audit §4 | 🟠 | L | CI gate: every report passes timezone/soft-delete/null/returns cases |

**M3 exit gate:** every dimension's "100" column in §1 demonstrably met, with the automated suites that prove it running in CI.

---

## 4. Schedule (realistic, solo full-time; halve with a 2-3 dev team)

> Estimates assume you, full-time, knowing this code. The V3/legacy duality (M3-01) is the single biggest schedule risk — it's deferred to M3 deliberately so it doesn't block selling.

| Phase | Calendar | Contents | You exit with |
|---|---|---|---|
| **Sprint A — Money safety** | **Week 1–2** | M1-01 → M1-10 + M1-17 (the audit blockers + golden test) | The product stops losing money |
| **Sprint B — Launch finish** | **Week 3** | M1-11 → M1-16 (Day 4 gaps + Days 7,8,10 + regression) | **M1 SELLABLE — begin selling** |
| **Sprint C — Trust I** | **Week 4–5** | M2-01, M2-02, M2-03, M2-05, M2-09, M2-10 | Reports reconcile, timezone-correct, fast |
| **Sprint D — Trust II** | **Week 6–7** | M2-04, M2-06, M2-07, M2-08 (mobile, single-source stock, recon suite, IDOR) | **M2 TRUSTWORTHY** |
| **Phase E — Perfection** | **Month 3–5** | M3-01 → M3-08 | **M3 PERFECT (100)** |

**Net:** ~**3 weeks to start selling**, ~**7 weeks to Trustworthy**, ~**4–5 months to a true 100** — solo. This matches the earlier estimate, now itemized.

---

## 5. Verification Harness (build these once; they protect you forever)

You cannot claim a score without proof. Build these test fixtures early (M1-17 is the first):

1. **Golden Transaction (automated):** Buy 10@50 + 10@100 → Sell 15@200 on credit → Partial-return 2. Assert: Net Sales, COGS, Gross Profit, AR, trial-balance-balanced, **and Item-wise Profit shows 13 kept units with GP == P&L GP.** Re-run on every commit.
2. **Tenant-Isolation suite:** Seed Tenant A + B. For every list/report/export/API, assert A never sees B's rows. Include the raw-query endpoints (bank-accounts, heartbeat).
3. **Reconciliation job:** Nightly assert `stocks.quantity == Σ inventory_batches.remaining_qty` and `accounts.balance == journal-derived balance` per tenant; alert on drift.
4. **Report-reconciliation matrix:** For each of the 43 reports, a test comparing its headline number to a direct `DB::table()` aggregate, across the four edge cases (timezone, soft-delete, null, returns).
5. **CI lint gate:** Fail the build on any bare `DB::table('<tenant-scoped table>')` lacking a tenant predicate.

---

## 6. Go / No-Go Gates

**M1 (Sell) — ALL must be true:**
- [ ] Golden-Transaction test green (returns net correctly, three profit numbers agree)
- [ ] Partial return cannot exceed sold quantity (M1-01)
- [ ] `/api/bank-accounts` + raw-query sweep tenant-safe (M1-03)
- [ ] Force-delete cannot alter a closed period (M1-04)
- [ ] Pre-sale conversion posts COGS; tax-after-discount correct (M1-05/06)
- [ ] Fractional quantities persist (M1-07); core indexes added (M1-08)
- [ ] POS return doesn't inflate revenue; supplier statement sign correct (M1-09/10)
- [ ] Day-4 gaps closed; secrets rotated (M1-11/12)
- [ ] Lemon Squeezy activation, A4 print, backup/restore proven (M1-13/14/15)
- [ ] Reconciliation spot-check clean; full regression green (M1-16)

If any money/security box is unchecked → **NO-GO.** A cosmetic/mobile gap can ship as a noted week-1 fix; a money or tenant gap cannot.

**M2 (Trustworthy):** all M2 acceptance tests + one pilot store clean for a week.
**M3 (Perfect):** every "100" column in §1 met with CI suites proving it.

---

## 7. Carried Over From Your 10-Day Plan (do not lose these)

**Fast-Follow (weeks 2–4 post-launch):** fresh-baseline reconciliation with dad's shop; historical stock valuation (`inventory_batch_movements`); SmartCapture multi-image (5/scan) + handwritten/multilingual OCR; staff login testing; Mobile Tier-2 (sell/purchase/stock list+create). → folded into **M2-04, M2-06, M2-08**.

**Long-Term Roadmap:** VenSynQ build-out (Amazon SP-API, eBay, TikTok); WooCommerce two-way sync incl. the Pipeline A/B accounting-gap fix (route Woo orders through `V3\SaleService::post()`); Mobile Tier-3 (SuperAdmin/admin views); **full V3 cleanup / delete 15+ legacy controllers** → this is **M3-01, the keystone of reaching 100**; AppSumo / Product Hunt / G2 / Capterra listings.

**Parking Lot:** stock-adjustment passcode → **M2-09**.

---

## 8. The Honest Bottom Line

Your instinct is right: **ship at Sellable, then harden in public.** That's the correct strategy *as long as "Sellable" is defined by money-safety, not by the 10-day checklist.* The 10-day plan you built is good work and most of it is genuinely done — but it was always a *packaging* plan, and packaging a system that miscounts returns and shows three profit numbers just ships the problem faster.

The good news, repeated from the audit because it matters: the accounting **spine** already works — balanced journals, a textbook reversal engine, FIFO with row-locks, trustworthy ledger reports. The blocking list (M1-01 → M1-10) is mostly **Small/Medium** effort precisely because you're not rebuilding the engine; you're fixing the lifecycle around it: return-quantity accounting, return-netting, the pre-sale COGS leg, tax ordering, one decimal column, one tenant filter, and a handful of indexes.

**Do Sprint A (≈2 weeks). Re-run the Golden Transaction until the Item-wise Profit report and the P&L agree to the cent after a return. The day that passes, you are sellable — and unlike today, you'll deserve to be.**
