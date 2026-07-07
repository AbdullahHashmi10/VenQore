# VenQore — Master Handoff & Continuation Guide

**Read this first. You can run the entire remaining project from this one file.**
**Last updated:** 2026-06-22 · by the auditing assistant
**Companion files (still valid):** `VenQore_MASTER_Plan_To_100.md`, `VenQore_Math_To_100_Plan.md`, `VenQore_Category3_ReadEngine_Plan.md`, `VenQore_Mathematical_Correctness_Audit.md`, `VenQore_Forensic_Audit_Report.md`, `VenQore_Build_Log.md`.

---

## 0. THE GOLDEN RULES (these are non-negotiable — breaking #1 cost us a day)

1. **COMMIT AFTER EVERY GREEN CHECKPOINT.** The moment a fix passes its test, run `git add -A && git commit -m "..."`. Never leave verified work uncommitted while doing more work. *The only way work gets "reverted while moving forward" is uncommitted edits being overwritten by a later snapshot. Committing closes that door forever.*
2. **NEVER `git add .` a mixed pile of half-finished work.** Commit one logical fix at a time, with a clear message.
3. **TESTS ARE THE SPEC. Never weaken a test to make it pass.** If a test is red, fix the *code*, or prove the test itself was wrong and say so out loud. A green test bought by editing a controller to dodge it is worse than a red one.
4. **VERIFY BY READING FILES, NOT BY TRUSTING REPORTS.** "All tests pass" is a claim until you read the diff. The auditor (me) re-reads every change before sign-off; you should too, or have a reviewer do it.
5. **The guard tests are permanent.** `SingleWriterGuardTest`, `BalanceConsistencyTest`, `CalculatorParityTest`, `FifoDeterminismTest`, `DashboardConsistencyTest` must ALWAYS be in `Tester/tests/Feature/Core/` and ALWAYS green. If one disappears or goes red, STOP — something regressed.

---

## 1. WHAT THIS PROJECT IS (the one-paragraph version for a new person)

VenQore is a multi-tenant POS/ERP (Laravel 12 + React/Inertia, MySQL). We are NOT adding features. We are making it **mathematically perfect**: every money number the customer sees must come from **one place** (one "engine"), and that place must be provably exact to the cent. The work is organized as **5 categories of the "heart"**: (1) writing money into the core, (2) the core's own math, (3) presenting money to the user, (4) pages/UI, (5) a final proof gate. The brand promise is "our maths is 100% correct — bet on it," so this is the gate to launch.

---

## 2. CURRENT STATUS — honest, file-verified scoreboard

| Category | Score | State |
|---|---:|---|
| **1 — Writing to core** (one guarded writer) | **100** | ✅ done, committed `36ac624` |
| **2 — Core math** (derived balance, rounding, no drift) | **100** | ✅ done, committed `36ac624` |
| **3 — Presenting money** (one calculator on every screen) | **~75** | engine + dashboard + AI done; **retiring the 2nd calculator and the 43-report sweep remain** |
| **4 — Pages/UI** (render health, per-page correctness) | **72** | not started |
| **5 — Proof gate** (one reconciliation test over everything) | **0** | capstone, not started |
| **OVERALL mathematical trust** | **≈85** | up from 41 at the start |

**Sellable line:** when Category 3 hits 100 and the Category 5 proof gate is green, the math is provably one-source and exact → you can put the brand claim live. After that, the manual launch checklist (Section 6) gets you to a real launch.

---

## 3. WHAT IS DONE (verified — each has a test that proves it)

All of these are committed and have a passing test. If any test below ever goes red, that item regressed.

**Money correctness (the M1 set + extras):**
- Partial returns can't refund more than sold — `Money/ReturnIntegrityTest::M1-01`
- Returns netted out of profit reports (no ghost revenue) — `ReturnIntegrityTest::M1-02`, `Money/ReportReconciliationTest`
- Force-delete can't alter closed-period books — `Money/HistoryImmutabilityTest`
- Pre-sale conversion posts COGS + correct tax — `Money/PreSaleConversionTest`
- Tax computed AFTER order discount; tax on account 2100 (not 2200) — `Money/TaxAfterDiscountTest`
- Fractional quantities persist (2.5 not 2/3) — `Money/FractionalQtyTest`
- POS open-return reduces revenue, right warehouse, idempotent — `Money/PosOpenReturnTest`
- Supplier statement shows payable with correct sign — `Money/SupplierStatementTest`
- **FIFO is deterministic (the critical fix): a `seq` tiebreaker means oldest batch is always consumed first even when timestamps tie** — `Core/FifoDeterminismTest`, `Core/CalculatorParityTest` (COGS 800 / GP 1800 on the golden transaction)

**Category 1 — one writer:** every journal write goes through `V3\AccountingService::createEntry()`; legacy `AccountingService` deleted; a static guard test bans raw `JournalItem::create` outside the engine — `Core/SingleWriterGuardTest`.

**Category 2 — core math:** `accounts.balance` is DERIVED from the journal (accessor on `Account` model), never written by `createEntry`, so it can't drift; money rounds to 2dp at the journal boundary, intermediate math carries 4dp — `Core/BalanceConsistencyTest`.

**Category 3 (partial):** `FinancialReportingService` is the anointed single engine; RS-only methods (aged AR/AP, trial balance, registers, COGS, party ledger, inventory movement) ported in; the **Dashboard** reads only the engine (`getProfitByPeriod`, buckets by business date, one query); the **AI assistant** reads revenue from the engine — `Core/CalculatorParityTest`, `Core/DashboardConsistencyTest`.

**Milestone/launch items already committed (in git history):** granular admin permissions; exception-swallowing (abort→500) fixes; PIN unification + stock-adjust passcode; report-reconciliation suite; plan gating + WooCommerce/Cookbook locks; mobile nav; FK cascade hardening; tenant-leak fix on `/api/bank-accounts`; tester moved to MySQL (`amd_pos_test`).

---

## 4. WHAT IS LEFT — in exact order, with the test that closes each

Do these top to bottom. Each is one instruction → IDE implements → run its test → commit.

### Category 3 — finish presentation (the current focus)
- **C3.3 — Retire the second calculator.** Six controllers still use `V3\ReportService`: `AdminController:31`, `FinanceController:191`, `InventoryController:18/29/230`, `V3/DashboardController:7`, `V3/ReportController:7`, `V3/ReportExportController:6`. Repoint each to `FinancialReportingService` (port any missing method first, with a reconciliation test), then delete/shim `V3\ReportService`.
  - **Acceptance:** a `Core/NoSecondCalculatorTest` static-grep test proving no controller imports `V3\ReportService`; all those pages still return correct numbers vs direct DB.
- **C3.4 — Full reconciliation sweep.** Map all 91 Inertia pages + 43 reports + receipts to confirm each reads only the engine; add per-report reconciliation (card ↔ report ↔ DB) across the 4 edge cases (timezone, soft-delete, null, returns).
  - **Acceptance:** `Reports/FullReconciliationSuite` green.

### Category 4 — pages/UI honest
- **C4.1 — Fix the test-env render cascade (Tester-Fix-1):** ~80 page-render tests fail only because the test runner lacks the Vite manifest/Inertia root-view; prod is fine. Stub it so render tests run.
- **C4.2 — Per-page load + correctness pass:** every Inertia route returns 200 and shows engine-sourced numbers; resolve the settings validation whitelist (`store_name`/`currency_symbol`).

### Category 5 — the capstone proof gate
- **C5.1 — `Heart/OneCoreReconciliationGate`:** ONE permanent test asserting journal ⟷ derived balance ⟷ every report ⟷ every dashboard card ⟷ every receipt reconcile to the cent across cash/credit/split/partial-return/reversal/purchase/purchase-return/expense/fund-transfer/pre-sale. When green, the brand claim is provable.

### Then: the manual launch track (only the owner can do these) — see Section 6.

---

## 5. THE WORKING METHOD (how every item gets done)

The loop that has worked all along:

1. **Auditor writes a precise instruction** (file paths, exact change, acceptance test, "report back the raw output").
2. **You paste it to the IDE's AI.** It implements + writes/updates the acceptance test.
3. **Run the test** (Section 7).
4. **Auditor (or a reviewer) re-reads the actual diff** — not the summary — and re-derives any headline number by hand. Sign ✅ VERIFIED or ❌ REJECTED with the exact reason.
5. **On ✅ → `git commit` immediately** (Golden Rule #1). On ❌ → fix and repeat.

**Instruction template (copy this shape):**
```
GOAL: <one sentence>.
STANDING RULE: no test weakened; a failing assertion is a real finding — report + stop.
STEP 1..n: <exact files, exact changes>
ACCEPTANCE: <new/updated test name> green; <specific numbers it must show>; whole Money+Core suites stay green.
REPORT BACK: the diffs + the RAW test output. Do NOT mark done — it gets verified.
```

**How the auditor verifies (so a reviewer can do the same):** read the changed files directly; confirm the test asserts the *correct* number (re-derive it by hand from first principles, e.g. FIFO COGS = oldest-batch-first); confirm no existing test was weakened; confirm the guard tests still pass; confirm it was committed.

---

## 6. THE MANUAL LAUNCH TRACK (owner-only; no test can prove these)

After the math is at 100, these get you to a real launch (details in `VenQore_MASTER_Plan_To_100.md` Phase D):
- Lemon Squeezy live test purchase → confirm plan activation chain.
- Google Drive backup + restore on a test store → numbers match.
- A4 invoice print; AI chat widget visible; SmartCapture end-to-end.
- Rotate the marketplace secrets sitting in `.env`; confirm VenSynQ stays off.
- Reconciliation spot-check at the real shop (cash drawer + physical stock count).
- Role walkthroughs (Owner/Manager/Cashier/Starter/Growth).
- Mobile Tier-1 views on a real phone.
- (For a true 100: accountant sign-off + external pen-test.)

---

## 7. THE TEST SUITE = THE SOURCE OF TRUTH

- **Dashboard:** `Tester/dashboard/launch.bat` → http://localhost:7821 (Node runner streams results).
- **CLI:** `E:\Software\Xampp\php\php.exe artisan test Tester/tests/Feature/Core Tester/tests/Feature/Money`
- **DB:** MySQL `amd_pos_test` (NOT SQLite — this matters; SQLite hid real bugs).
- **The five guard tests** in `Tester/tests/Feature/Core/` must always exist and pass:
  `SingleWriterGuardTest`, `BalanceConsistencyTest`, `CalculatorParityTest`, `FifoDeterminismTest`, `DashboardConsistencyTest`.
- The **golden transaction** is the north star: buy 10@50 + 10@100, sell 15@200 on credit, return 2 → Net Sales 2600, **COGS 800, Gross Profit 1800**, AR 2600, AP 1500, inventory 700, trial balance zero. Any report/screen that disagrees with these is wrong.

---

## 8. GIT DISCIPLINE (the exact workflow that prevents the regression that just happened)

```
# After a fix is verified green:
git add -A
git commit -m "fix(<item>): <what changed> — <test that proves it> green"

# Before starting a NEW item, make sure the tree is clean:
git status        # should show nothing uncommitted
```
- One commit per logical item. Clear message naming the item and its test.
- If `git status` ever shows a pile of uncommitted changes, STOP and commit before doing anything else.
- Never let the IDE run `git add .` over a mix of finished + half-finished work.

**Right now (2026-06-22) there are uncommitted changes** to FundController, SaleController, Account.php, SaleReversalService, V3/AccountingService, V3/FifoService. **Action:** run the Core+Money suite; if green, `git add -A && git commit -m "reconcile follow-ups: getTenantId refactor + FIFO determinism + dashboard tz"`. Do this before anything else.

---

## 9. ONE-PAGE SUMMARY FOR A NEW PERSON

> VenQore is a POS/ERP being hardened so every money number is provably correct from one source. We work in a strict loop: a precise instruction → the IDE implements it with a test → we re-read the diff and re-derive the number by hand → we commit. The "heart" has 5 categories: writing money (DONE), core math (DONE), presenting money (75% — finishing now), pages (next), and a final proof gate (last). The single source of truth is the test suite in `Tester/tests/Feature/Core` and `/Money`, run against MySQL `amd_pos_test`; the north-star check is the "golden transaction" (COGS 800, gross profit 1800). The cardinal rule, learned the hard way: **commit after every green test**, never leave verified work uncommitted, and never weaken a test to make it pass. The remaining work is in Section 4 of this file, in order, each with its acceptance test. Start at C3.3 (retire `V3\ReportService`), then C3.4, C4, C5, then the manual launch track in Section 6.

---

*If something looks regressed: run the five guard tests. If they're green, the heart is intact. If one is red or missing, find the last good commit (`git log`), diff it, and restore — then commit immediately.*
