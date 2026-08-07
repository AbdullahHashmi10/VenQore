# VenQore — Road to 100 (Two Lists: Code vs. Manual)

**Date:** 2026-06-20
**Goal:** Not just Sellable (85) — a **fully trustworthy 100 in every dimension.**
**Method:** Finish **everything the IDE can do (List A)** first. Then you run **everything only you can do (List B)** over ~2 days. You report what breaks; I write a fresh fix plan for it.

---

## 0. Audit Corrections (ruthless self-check — read first)

The forensic audit was a static map and had errors. Honesty about them is the point of this whole process.

| Finding | Original claim | Corrected truth | New severity |
|---|---|---|---|
| **F11 (indexes)** | "`->index(` = 0 across 224 migrations; Scalability 24/100; dies at 100K rows." | **FALSE NEGATIVE — my grep `->index(` mis-parsed `->` as a CLI flag.** Real count = **57 migrations** with indexes (since 2025-12). System was well-indexed. M1-08 added only 2 genuinely-missing composites. | **Low.** Scalability re-scored **≈70**, not 24. |
| **F17 (tx limit on live sale path)** | "Not enforced on routed `SaleController::store`." | Asserted from reading; M1-EX1 work implies enforcement exists elsewhere (middleware/enforcer). **Flagged for re-validation in List A.** | TBD on recheck |

**Meta-lesson (applies to the whole audit):** every *absence* claim ("X is missing / not enforced / not indexed") is now suspect until re-validated, because that's where tooling false-negatives live. Positive findings (F1–F10 etc. — "this code does the wrong thing") were read directly and have held up: all were confirmed real and fixed. The score that moves most is **Scalability (24 → ~70)**; the money findings stand.

---

## 1. Where we actually are (verified, from the build log)

- **Code track: 14 of 20 items VERIFIED on the MySQL harness.** Money is safe: returns capped + netted (F1/F2), force-delete immutability (F4), pre-sale COGS + tax (F5), tax-after-discount (F7), fractional qty (F9), supplier sign (F8), POS return (F6), tenant leak (F3), tax account 2100 (M1-06b), indexes (M1-08).
- **Harness is honest:** moved SQLite → MySQL `amd_pos_test` (Tester-Fix-0), standing "no-cheat" rule in force.
- **Remaining = mostly NOT code** (your manual launch items) + a handful of code items below.

---

## 2. LIST A — CODE (everything the IDE can do; we run the instruction→verify loop on each)

Ordered: finish the cheap/safe ones, then the big consolidation epic last (so the test suite is maximally built when we touch the riskiest thing).

### A. Finish the remaining M1 code bits (Sellable-blocking)
| ID | Item | Type | Notes / acceptance |
|---|---|---|---|
| A1 | **M1-EX1** — reads (GET) must not 403 at tx-limit | code | Locate exact 403 source; allow GET/HEAD; test: over-limit GET = 200, POST = 403 |
| A2 | **M1-11** — WooCommerce `false` on ALL tiers; Cookbook `enforce()` on every action | code | Seeder flips growth/business to `'0'`; `CookbookController` uses `PlanGate::enforce('cookbook')` on create/update/delete; gating tests |
| A3 | **F17 re-validation** — confirm `transactions_per_month` enforced on the live `POST /sales` route | code | If a gap exists, add enforcement; if already enforced, document where + add a test. Resolves the audit's open absence-claim |
| A4 | **SettingsTest whitelist** — `store_name`/`currency_symbol` rejected by validation | code | Decide: are these meant to be saveable? If yes (likely), widen the whitelist; test |

### B. Trustworthy (92) — correctness & robustness the IDE can do
| ID | Item | Type | Acceptance |
|---|---|---|---|
| B1 | **M1-EX3** — exception-swallow sweep (17 controllers `abort(40x)` inside generic catch) | code | Re-throw `HttpException` before generic catch, controller by controller; test asserts intended status (403/404/422), not 500 |
| B2 | **M2-01** — tenant timezone for all daily/dashboard date filters; standardize on `posted_at` | code | Karachi-tz test: a 02:00-local sale counts on the local date |
| B3 | **M2-02** — de-N+1 P&L, Balance Sheet, low-stock, item-detail; **fix low-stock warehouse filter** | code | P&L ≤ 3 queries; low-stock honors warehouse_id |
| B4 | **M2-05** — header invariant `subtotal − discount == net_sales` | code | property test over random sales |
| B5 | **M2-09** — unify passcode systems; wire stock-adjust PIN (kill hardcoded `123456`) | code | one `security_pin` everywhere; no hardcoded passcode in repo |
| B6 | **M2-10** — multi-payment split + rounding reconciliation proofs | tests | Σ split legs == grand total; trial balance balances |
| B7 | **M1-07b** — confirm `purchase_items`/`stock_movements` qty are decimal (not int) | code | fractional purchase/movement persists exactly |
| B8 | **Tester-Fix-1** — fix the ~80-red render cascade (Vite manifest / Inertia root-view in test env) | test-infra | Auth/Smoke/page-render suites go green; dashboard can reach all-green |
| B9 | **M2-06** — per-report reconciliation tests for the 43 reports (card ↔ report ↔ DB) | tests | each report's headline == direct DB aggregate, across the 4 edge cases |
| B10 | **M2-07** — IDOR pass: every route-model binding tenant-checked | code/tests | Tenant A passing B's id → 403/404 everywhere |

### C. Perfect (100) — the structural items the IDE can do
| ID | Item | Type | Acceptance |
|---|---|---|---|
| C1 | **M3-02** — granular admin permissions (split `data.export`, `records.force_delete`, `users.manage`) | code | settings-only role blocked from export & force-delete |
| C2 | **M3-05** — money-type precision standardization across tables | migration | uniform decimal precision; cross-table aggregation drift = 0 |
| C3 | **M3-06** — cascade-delete audit (no master delete cascades into sales/journal/batches) | migration | deleting product/party/warehouse never destroys financial history |
| C4 | **M3-08** — full report-reconciliation + golden-transaction suite wired into the dashboard as a permanent gate | tests | one click proves all 43 reports + golden txn |
| **C5** | **M3-01 — THE BIG ONE: collapse legacy → single engine (your "V3 everywhere" goal)** | code epic | see §4. Do this LAST in the code track. |

> **List A is "done" when:** every item above is VERIFIED on MySQL, the Money + report-reconciliation + tenant-isolation suites are fully green, and the dashboard is green except for items that are genuinely manual.

---

## 3. LIST B — MANUAL (only you can do these; your ~2-day blitz)

No test can prove "the real credit-card purchase activated the plan." These are yours.

### Launch mechanics
1. **Lemon Squeezy live test purchase** (M1-13): real test card → confirm `subscription_created` webhook → `ProvisionTenantJob` → tenant gets plan + `active` + `StoreLicense`. Then test a plan change + a cancellation.
2. **Google Drive backup + restore** (M1-15): connect Drive on a test tenant → `Sync Now` uploads → restore a real-store backup into a local test store → spot-check totals match.
3. **A4 invoice print** (M1-14): print a real A4 invoice; check tax totals, letterhead, layout.
4. **AI chat widget + SmartCapture** (M1-14): confirm chat bubble visible/clickable on a fresh session (PWA z-index); run one SmartCapture invoice end-to-end incl. low-confidence human-escalation.
5. **Rotate marketplace secrets + confirm VenSynQ off** (M1-12): new Amazon/TikTok creds; confirm `config('vensynq.enabled')` false in prod.

### Reconciliation & role walkthroughs
6. **Reconciliation spot-check** (M1-16): VenQore "Cash in Hand" vs the actual drawer; 5–10 random products' system qty vs physical count.
7. **Run the golden transaction by hand** as Owner: buy 10@50 + 10@100, sell 15@200 credit, return 2 → confirm P&L GP == item-wise GP, trial balance balances on screen.
8. **Role boundary walkthroughs:** Owner / Manager (custom role) / Cashier / Starter / Growth — confirm each sees and is blocked from exactly what they should be.
9. **Dad's-shop regression:** run a normal day's operations live; note anything that confuses or breaks.

### Device & scale
10. **Mobile Tier-1** (M2-08): POS, dashboards, P&L on a real phone (~375px) — usable, nothing cut off.
11. **Load feel** (M3-03): seed ~100K–1M rows in a test tenant; open P&L / dashboard / item-wise; confirm acceptable response (now that we know indexes exist, this should pass — verify it).

### External (for a real 100, not blocking sale)
12. **Accountant sign-off** (M3-07): a CA reviews a simulated month across every transaction type.
13. **Security/pen-test** (M3-04): external pass on auth, IDOR, file-upload, webhook, AI prompt-injection.

> **The loop you asked for:** when you run List B and find problems, write them down exactly as you see them, send me the list, and I'll produce a dedicated fix plan + tests for each — same instruction→verify discipline.

---

## 4. The Big One — Legacy → Single Engine (M3-01 / your "V3 everywhere")

**You're right to want this, and right that it was deferred. Here's the honest shape of it.**

**The danger nobody mentioned:** your money fixes are currently **split across both stacks.** Some landed in the routed *legacy* path (M1-06 tax waterfall is in `SaleController::store`), some in *V3* (M1-06b was `V3/SaleService`). So the two engines are **not** feature-equal right now. If you naively "switch everything to V3," you could silently **regress a verified money fix** that only exists in the legacy path. That is the single biggest risk in this entire project.

**Safe consolidation procedure (domain by domain, never big-bang):**
1. **Inventory both stacks** per domain (sales, purchases, returns, inventory, reports): which path is routed, which fixes live where.
2. **Pick the canonical engine** per domain — usually whichever already holds the verified fixes.
3. **Port every missing fix** into the canonical engine (e.g., ensure V3 sale-store has returned_quantity cap, tax-after-discount, fractional qty, etc.).
4. **Re-point the routes** to the canonical engine for that domain only.
5. **Re-run the FULL money + report suite.** Green → proceed. Red → stop, the port missed something.
6. **Delete the dead path** for that domain only after green.
7. Repeat per domain. The test suite is the guardrail the whole way.

**Sequencing:** do this as **C5, the LAST code epic**, after B1–B10 and C1–C4 — because by then the suite is broad enough to catch a regression the instant a route switches. Attempting it earlier, with a thinner suite, is how you'd ship a silent money bug. This epic is also the prerequisite for honestly scoring **Security and Financial at 100** (you can't certify two live write paths).

---

## 5. The "V12 Turbo" idea — yes, and here's how to do it without hurting the engineering

Three separate things you've blended — keep them separate and you can have all of it:

1. **The brand name is free and you can use it today.** "V3" is an *internal namespace* customers never see. You can market the engine as **"VenQore V12 Turbo"** in all UI copy, landing pages, and the Copy Bible **without renaming a single class.** Do this now; it costs nothing.

2. **Renaming the code namespace is mechanical but should be the FINAL step.** If you want the internal namespace to literally read `V12` (or `Engine`/`Core`), it's a find-replace across imports, directories, route references, and the Tester's path arrays. Totally doable — but do it **once, after consolidation (C5)**, when there's a single stack. Renaming while two stacks exist doubles the churn and risks breaking routes mid-flight.

3. **Don't force exactly 12 components — map the story onto the architecture, not the reverse.** Let the consolidated engine be whatever shape it needs (it'll likely be ~8–15 core services). Then tell the marketing story by grouping them into **12 "cylinders"** (POS, Inventory, FIFO, Ledger, Tax, Returns, Reports, Plans/Billing, Multi-Tenancy, AI/SmartCapture, Sync, Backup is already 12 natural ones). Dad's shop = the **ECU/brain** tuning the engine is a genuinely good narrative. The danger is inventing a fake module just to hit 12 — that adds complexity for a slogan. Pick the 12 you already have.

**My recommendation:** brand "V12 Turbo" externally **now**; keep the internal namespace as-is; consolidate to one engine (C5); then optionally rename the unified namespace last. You get the fun engine story immediately and a clean codebase eventually, with zero engineering compromise.

---

## 6. Recommended order of operations

1. **Now → finish List A** through the IDE+verify loop (A1–A4, B1–B10, C1–C4), in that order.
2. **Then C5** (legacy→single engine) as the final, guarded code epic.
3. **Then you run List B** (~2 days): launch mechanics + reconciliation + device/scale.
4. **You report what breaks** → I write a targeted fix plan for each → instruction→verify until green.
5. **Final completeness pass** (I re-sweep the four blind-spot classes: duplicate paths, exception-swallow, over-aggressive gates, unscoped raw queries) → then you flip to **Sellable**, on a *proven* green MySQL suite, not a paper checklist.

**Immediate next step (my recommendation):** start List A at **A1 (M1-EX1)** or **A2 (M1-11)** — both are small, code-shaped, and go through the loop you already trust. Tell me which and I'll write the precise IDE instruction + its acceptance test.
