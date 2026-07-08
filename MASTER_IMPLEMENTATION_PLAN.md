# VenQore POS — Master Implementation Plan

**Purpose of this document:** the single source of truth for what remains between the current audited state and (a) a defensible launch, and (b) a genuinely complete, 100/100 product. This supersedes and consolidates every prior roadmap, gap list, and remediation plan in this repository. It does not replace `FINAL_LAUNCH_READINESS_AUDIT.md` (the evidence base) — it converts that evidence, plus everything still-relevant in the other 20+ planning documents, into one prioritized, non-duplicated task list.

**What this document is not:** a calendar. No dates, no week numbers, no day numbers. Tasks are ordered by dependency and priority, not by time — you decide the pace.

**Ground truth hierarchy used to build this:** where documents conflicted, `FINAL_LAUNCH_READINESS_AUDIT.md` (verified against live code on 2026-07-09) wins for anything it covers. For everything else, the most recently dated document with the most specific evidence wins. Two older documents — `VenQore_Master_Roadmap.md` (root) and `VenQore_PreLaunch_Checklist.md` — describe a subdomain-per-tenant architecture that no longer matches the current single-domain, `tenant_id`-scoped implementation; their literal action items are excluded, but a few durable principles from them are carried forward as verification tasks (cascade-delete guards, dead-trial cleanup). Two other documents — `VenQore_Master_Roadmap_87_to_100.md` and `VenQore_Road_To_100.md` — predate the two most recent audits and assumed a starting score of 87/100; this plan re-baselines from the audit's actual finding of 52/100 and folds in every still-relevant item from them under its own IDs.

---

## How to read this document

- **Track A — Launch Readiness.** Everything required before this product should take a paying customer's money. IDs prefixed `L`.
- **Track B — Product Completeness.** Everything beyond the launch gate required for a complete, competitive, 100/100 product. IDs prefixed `P`.
- Every task has: ID, title, purpose, business reason, technical reason, files likely involved, prerequisites, risk if skipped, difficulty, dependencies, validation method, success criteria, launch impact, business impact, customer impact.
- **No task ID is reused. No task appears twice under different IDs**, even when it was named in multiple source documents — cross-references are noted in each task's "Sources" line instead.

---

## PART 0 — Executive Framing

### Where the product actually stands

The audit scored this **52/100 overall**, verdict **NOT READY**. The good news buried in that number: the parts of this system that were built most recently and most carefully (the V3 accounting/FIFO engine, the reporting layer, AppSumo redemption locking, Lemon Squeezy webhook verification) are genuinely strong — comparable to what a much larger, better-funded team would ship. The bad news: several of those well-built parts are not actually the code path real customers hit, and the seams between "what's built" and "what's wired up to production traffic" are where nearly every launch blocker lives.

This plan treats that seam — **legacy vs. V3, documented vs. actual, sold vs. unlocked** — as the central theme, because it recurs across security, financial correctness, billing, and even the documentation set itself (see the audit's Section 10 and 11). Fixing individual bugs without fixing that pattern will produce another round of "fixed, but the fix wasn't actually wired in" — which is exactly what happened three times in the two days before this audit (Section 10 of the audit document).

### The two questions this plan answers

**"How do we get to 100/100 for launch?"** — Track A. A launch-ready product does not need every feature; it needs to not lie to its users about their money, not leak data across tenants, not fall over when a cron job stops firing, and not sell things it doesn't deliver. Track A is intentionally narrower than Track B.

**"How do we get to 100/100 as a product?"** — Track B. This is the fuller vision: the receipt-printer integration that unlocks "real shops," the design system, the localization, the mobile app, the report drill-down that's the actual competitive moat. Track B is where "good enough to launch" becomes "the product we actually set out to build."

---

## PART 1 — TRACK A: LAUNCH READINESS

### A0. Repository Integrity Pre-Flight (do this before anything else)

These are not features or fixes — they're confirming the ground under the rest of this plan is solid. Skipping this phase risks repeating the exact failure pattern documented in the audit's Section 10 (successive sessions each finding the last one's "fix" wasn't real).

**L001 — Confirm single, consistent working copy of the repository**
- **Purpose:** A prior session (`LAUNCH_READINESS_ENGINEERING_PLAN.md`) found the same file returning different content depending on whether it was read via file-read tool vs. shell (`SaleFinancialValueGuardTest.php`: 333 lines vs. 123 lines) — evidence of a stale cache, orphaned process, or unresolved lock state.
- **Business reason:** every other task in this plan assumes "the code" is one unambiguous thing. If it isn't, fixes can be applied to the wrong copy and silently not ship.
- **Technical reason:** rules out editor swap files, stale PHP-FPM opcache, or a duplicate mounted directory being edited instead of the git-tracked one. The audit itself noted multiple full duplicate codebase copies exist alongside the canonical repo (`AMD_POS_Update_v4.2.7/`, `VenQore_Local/`, a stale worktree).
- **Files involved:** none directly — this is an environment check.
- **Prerequisites:** none.
- **Risk if skipped:** every subsequent fix in this plan could be applied to a copy nobody deploys from.
- **Difficulty:** Trivial. **Est. hours:** 1-2.
- **Owner:** whoever has shell + editor access to the actual deploy source.
- **Dependencies:** blocks everything else in Track A practically speaking, though not a hard technical dependency.
- **Validation:** `git status`, `git worktree list`, confirm no stray duplicate directories are being edited; confirm one canonical path is what CI/deploy actually builds from.
- **Success criteria:** one git working tree, no orphaned worktrees (`git worktree prune`), duplicate directories explicitly archived or deleted, documented which path is canonical.
- **Launch impact:** Foundational. **Business impact:** Prevents wasted engineering effort. **Customer impact:** Indirect but total.
- **Sources:** `LAUNCH_READINESS_ENGINEERING_PLAN.md` item 1.

**L002 — Repo-wide `php -l` syntax verification after prior NUL-byte remediation**
- **Purpose:** A prior session stripped trailing NUL-byte corruption from 99 files (including `composer.json`, `routes/web.php`, `SaleController.php`, core models, and frontend files) but had no PHP interpreter available to confirm every file still parses correctly afterward.
- **Business reason:** an unnoticed syntax break in a core file (e.g., `Sale.php`, `JournalEntry.php`) could be a silent fatal-error time bomb.
- **Technical reason:** `\x00` byte corruption is exactly the kind of thing that can pass a naive diff review while breaking PHP's tokenizer.
- **Files involved:** all 99 files listed in `LAUNCH_READINESS_ENGINEERING_PLAN.md` item 2, at minimum; ideally the whole `app/` and `routes/` tree.
- **Prerequisites:** L001.
- **Risk if skipped:** a fatal parse error discovered in production instead of before launch.
- **Difficulty:** Trivial. **Est. hours:** 1.
- **Validation:** `find app routes database -name "*.php" -exec php -l {} \;` (or equivalent CI step), zero syntax errors.
- **Success criteria:** clean lint pass, committed as a CI gate (see L003) so it can't silently regress.
- **Launch impact:** High (prevents a full outage class). **Business impact:** Avoids emergency firefighting during launch week. **Customer impact:** Prevents total service failure.
- **Sources:** `LAUNCH_READINESS_ENGINEERING_PLAN.md` items 2, 10.

**L003 — Add a CI gate for trailing NUL-byte corruption and PHP syntax**
- **Purpose:** CLAUDE.md already documents a rule that CI blocks NUL-byte corruption via a Python scan — `LAUNCH_READINESS_ENGINEERING_PLAN.md` found 99 files with exactly this corruption anyway, meaning either the rule isn't actually enforced in CI today or was added after the corruption occurred.
- **Business reason:** this corruption class has demonstrably happened at scale once already; without an automated gate it can happen again silently.
- **Technical reason:** cheap, fast, deterministic check with zero false-positive risk.
- **Files involved:** `.github/workflows/ci.yml`.
- **Prerequisites:** L002.
- **Risk if skipped:** repeat of the exact corruption incident.
- **Difficulty:** Easy. **Est. hours:** 2.
- **Validation:** intentionally commit a NUL-byte-corrupted test file on a branch, confirm CI fails it, then revert.
- **Success criteria:** CI red on any NUL-byte or syntax-error commit.
- **Launch impact:** Medium. **Business impact:** Prevents recurrence of a known incident class. **Customer impact:** Indirect.
- **Sources:** `LAUNCH_READINESS_ENGINEERING_PLAN.md` item 10; `CLAUDE.md`.

**L004 — Commit or deliberately discard the 72-file uncommitted working-tree diff**
- **Purpose:** at time of the prior remediation session, 72 files of real engineering work (including `MassAssignmentAnalyzer.php` and guard tests) sat uncommitted.
- **Business reason:** uncommitted work is invisible to CI, invisible to code review, and one `git clean` away from being lost entirely.
- **Files involved:** whatever `git status --porcelain` currently shows.
- **Prerequisites:** L001.
- **Risk if skipped:** silent loss of already-completed remediation work; conflicting assumptions about what's "already fixed."
- **Difficulty:** Trivial. **Est. hours:** 1-3 depending on diff size.
- **Validation:** `git status` shows a clean tree; every intentional change is in a commit or PR.
- **Success criteria:** zero uncommitted files that represent real work.
- **Launch impact:** High (this is the difference between "fixed" and "believed fixed"). **Sources:** `LAUNCH_READINESS_ENGINEERING_PLAN.md` item 4.

**L005 — Run and document a migrations-vs-production schema diff**
- **Purpose:** two independent remediation sessions (`REMAINING_WORK_PLAN.md`, `REMEDIATION_PLAN.md`) found live code writing to columns that don't exist in migrations — meaning `amd_pos_test` (CI/test DB) and `venqore_pos` (production) are running different schemas, and nobody has quantified how different.
- **Business reason:** this is the root cause of at least 5 separate data-corruption bugs listed below (L010-L014) and means "tests pass" does not currently imply "works in production" or "works on a fresh install."
- **Technical reason:** a systematic diff (e.g., `php artisan schema:dump` against both databases, or a migration-generated scratch DB compared column-by-column against a `venqore_pos` structure export) turns "unknown-sized problem" into a concrete, closeable list.
- **Files involved:** `database/migrations/*`, a new diagnostic script/command.
- **Prerequisites:** L001.
- **Risk if skipped:** every fresh install, every disaster-recovery restore, and every CI test run rests on an unverified assumption.
- **Difficulty:** Medium. **Est. hours:** 4-8.
- **Validation:** produce a written diff report listing every column present in one schema and not the other.
- **Success criteria:** a complete, specific list — not a spot-check — of every schema discrepancy, feeding directly into L010-L014 and any others the diff surfaces that aren't already known.
- **Launch impact:** Critical — this is the single highest-leverage diagnostic task in this entire plan. **Business impact:** Prevents fresh-install and DR failures for every future customer/incident. **Customer impact:** Directly prevents broken onboarding for self-hosted customers and catastrophic DR failure for SaaS customers.
- **Sources:** `REMAINING_WORK_PLAN.md` R4; `REMEDIATION_PLAN.md` P1-0; independently, the audit found the prior report's *specific examples* of drift (appsumo_codes.campaign, purchase_items.quantity, stock_movements.reference) were false — reinforcing that a real, systematic diff (not spot-checks) is needed rather than trusting either prior claim.

---

### A1. Critical Financial-Integrity Blockers (from the audit — do not launch without these)

**L006 — Remove the COGS-fabrication fallback in the legacy `SaleController::store()`**
- **Purpose:** eliminate the single most severe defect found in this codebase — a silent, undetectable fabrication of cost-of-goods-sold on the live POS sale path.
- **Business reason:** this is a financial-correctness ERP; a merchant's P&L and inventory valuation silently drifting from reality is an existential product-trust risk, not a bug to triage later.
- **Technical reason:** `checkAvailability()` failing or `deductStock()` throwing currently falls through to `$product->cost_price * $totalQty` instead of a real FIFO cost, with no error surfaced and no `sale_item_batches` audit row written.
- **Files involved:** `app/Http/Controllers/SaleController.php:270-360, 1474-1480`; `app/Services/V3/FifoService.php` (for the correct negative-stock handling to route into instead).
- **Prerequisites:** L005 (understand full schema state first, since this touches `inventory_batches` writes).
- **Implementation order:** (1) decide product behavior — hard-fail the sale when FIFO can't produce a real cost, or route through `FifoService`'s existing negative-stock batch creation (recommended, since it already exists and keeps `inventory_batches` in sync); (2) remove the `catch` that silently swallows the exception; (3) remove the `else` branch that fabricates cost from `product.cost_price`; (4) add the reconciliation task L007 as a permanent backstop.
- **Risk if skipped:** ongoing silent corruption of every merchant's inventory valuation and P&L on every stockout — this will happen in week one of real usage, not as an edge case.
- **Difficulty:** Medium (surgical but touches the hottest code path in the app — needs careful testing). **Est. hours:** 8-16 including test-writing.
- **Owner:** senior backend engineer familiar with the FIFO/accounting engine.
- **Dependencies:** blocks L008 (dual-engine cutover planning) conceptually, since this bug is the reason the legacy engine can't be trusted as-is.
- **Validation:** new test simulating a FIFO exception/insufficient-batch scenario on the legacy path, asserting the sale either fails cleanly or posts a correct negative-stock-costed entry — not a fabricated one.
- **Success criteria:** zero code paths where COGS can be posted to the ledger without a corresponding, real `inventory_batches`/`sale_item_batches` change.
- **Launch impact:** Blocker — the single highest-priority item in this entire document. **Business impact:** Prevents the exact failure mode ("this ERP's numbers were wrong") most damaging to a product whose entire pitch is accounting correctness. **Customer impact:** Direct and severe if not fixed; invisible (as it should be) once fixed.
- **Sources:** `FINAL_LAUNCH_READINESS_AUDIT.md` Finding 1.

**L007 — Build an automated Inventory-Asset-vs-GL reconciliation check**
- **Purpose:** a permanent backstop that would have caught Finding 1 automatically, and will catch any future variant of the same failure class.
- **Business reason:** balanced-but-wrong is worse than obviously-broken, because nothing today can tell the difference. This task makes that distinction detectable going forward without relying on a human noticing.
- **Technical reason:** compare `FinancialReportingService::getInventoryValue()` (SUM of `inventory_batches.remaining_qty × unit_cost`) against the GL's Inventory Asset (account 1100) balance on a schedule; alert on any drift beyond a tiny rounding tolerance.
- **Files involved:** new scheduled command, `app/Services/FinancialReportingService.php`, `routes/console.php`.
- **Prerequisites:** L006.
- **Risk if skipped:** any future bug of this shape (balanced-but-fabricated ledger entry) goes undetected indefinitely, exactly as this one did.
- **Difficulty:** Medium. **Est. hours:** 6-10.
- **Validation:** deliberately introduce a drift in a test environment, confirm the check fires.
- **Success criteria:** scheduled job runs, alerts (not just logs — see L040 on monitoring) on any nonzero drift beyond tolerance, per tenant.
- **Launch impact:** High — this is the safety net the audit explicitly found missing. **Sources:** `FINAL_LAUNCH_READINESS_AUDIT.md` Finding 1 recommendation.

**L008 — Inventory which financial fixes live in which sale engine before any cutover decision**
- **Purpose:** `VenQore_Road_To_100.md` flags a critical nuance the audit's own recommendation doesn't fully cover: fixes to tax-waterfall math and other financial edge cases have landed unevenly across the legacy `SaleController` and V3 `SaleService` — a naive full cutover to V3 risks silently *regressing* an already-verified legacy fix that was never ported.
- **Business reason:** cutting over to "the cleaner engine" is not automatically safe; it could trade a known bug for an unknown regression.
- **Technical reason:** requires a side-by-side diff of tax/discount/rounding logic between `SaleController::store()` and `V3\SaleService::post()`.
- **Files involved:** `app/Http/Controllers/SaleController.php`, `app/Services/V3/SaleService.php`.
- **Prerequisites:** none (can run in parallel with L006).
- **Risk if skipped:** V3 cutover (L009) reintroduces a previously-fixed bug.
- **Difficulty:** Medium. **Est. hours:** 8-12.
- **Validation:** a written parity document listing every financial calculation and which engine currently has the "more correct" version.
- **Success criteria:** no financial logic difference between the two engines is unaccounted for before L009 begins.
- **Launch impact:** High (risk-reduction for the cutover, not itself launch-blocking if L006 lands independently). **Sources:** `VenQore_Road_To_100.md` "C5/M3-01."

**L009 — Execute the legacy-to-V3 sale engine cutover in shadow mode, then switch over**
- **Purpose:** eliminate the dual-engine architecture that is the root cause of Finding 1 and a permanent double-maintenance burden.
- **Business reason:** every future financial bugfix currently has to be built and verified twice; this is not sustainable and is actively dangerous (per L006/L008).
- **Technical reason:** route POS checkout (`Pos.jsx:1039`) and the offline-sync replay path (`SyncController.php:167`) to `V3\SaleService::post()` instead of the legacy controller, behind a per-tenant feature flag, running in shadow mode (both engines process the same sale, results compared, only the flagged engine's result is authoritative) before fully cutting over.
- **Files involved:** `resources/js/Pages/Pos.jsx:1039`; `app/Http/Controllers/Api/SyncController.php:167`; `routes/web.php:1053, 1451-1475`; `app/Http/Controllers/V3/SaleController.php`.
- **Prerequisites:** L006, L008, L010 (partial-return fix, since V3 can't yet safely handle a feature the legacy engine already supports).
- **Risk if skipped:** permanent dual-maintenance burden and recurring risk of exactly the class of bug this audit found.
- **Difficulty:** Hard. **Est. hours:** 40-80 across shadow-mode instrumentation, verification period, and cutover.
- **Validation:** zero discrepancy between shadow-mode legacy and V3 results across a real traffic sample before flipping the flag; full regression suite green on V3 path including offline sync.
- **Success criteria:** POS and offline sync both post exclusively through V3; legacy `SaleController::store()` is deprecated (kept only for historical read access, or removed).
- **Launch impact:** Not a hard pre-launch blocker on its own if L006 lands as a standalone fix — but strongly recommended before launch if timeline allows, since it closes the root cause rather than one symptom. If deferred past launch, must be Track A's first post-launch priority.
- **Business impact:** Removes the single largest source of future financial-correctness risk. **Customer impact:** None directly if done correctly (invisible engine swap); severe if done hastily without L008/L010.
- **Sources:** `FINAL_LAUNCH_READINESS_AUDIT.md` Finding 4; `VenQore_Road_To_100.md`.

**L010 — Fix partial sale returns silently performing full reversals in V3**
- **Purpose:** `V3\SaleService::reverse()` accepts a partial-item return request from the UI but silently performs a full reversal instead — currently low-impact because the legacy engine (which does support real partial returns) is what's live, but this becomes launch-critical the moment L009 ships.
- **Business reason:** a merchant processing what they believe is a partial return would have their entire sale reversed — a direct financial-correctness bug once V3 is live.
- **Files involved:** `app/Services/V3/SaleService.php:428`; `app/Http/Controllers/V3/SaleReturnController.php`.
- **Prerequisites:** none technically, but must complete before L009's cutover.
- **Risk if skipped:** blocks safe V3 cutover; if cutover happens anyway, a real regression versus current legacy behavior.
- **Difficulty:** Medium-Hard. **Est. hours:** 16-24.
- **Validation:** new test asserting a partial return leaves the un-returned portion's stock and journal entries untouched, matching the legacy engine's existing partial-return test coverage.
- **Success criteria:** V3 partial returns produce the same financial outcome as the legacy engine's equivalent flow.
- **Launch impact:** Blocker for L009 specifically, not for launch overall if V3 cutover is deferred. **Sources:** `FINAL_LAUNCH_READINESS_AUDIT.md` Finding 10.

**L011 — Fix Purchase Return posting to Accounts Payable for cash purchases**
- **Purpose:** `V3\PurchaseReturnController::store()` unconditionally debits Accounts Payable on any purchase return, even when the original purchase was paid in cash and never created an AP balance — creating a phantom negative-AP balance.
- **Files involved:** `app/Http/Controllers/V3/PurchaseReturnController.php:125-140`.
- **Prerequisites:** none.
- **Risk if skipped:** corrupted aged-payables report and supplier ledger balance for any cash-purchase return — a real, reachable bug for any tenant doing cash purchasing.
- **Difficulty:** Medium. **Est. hours:** 6-10.
- **Validation:** new test covering a cash-purchase return, asserting no AP line is posted (or the actual originally-posted lines are reversed instead of a fixed account pair assumption).
- **Success criteria:** purchase returns branch correctly on payment method, matching how the original purchase posting already does.
- **Launch impact:** Blocker (financial correctness, reachable by any real merchant). **Sources:** `FINAL_LAUNCH_READINESS_AUDIT.md` Finding 9.

**L012 — Fix WooCommerce sales posting no journal entry**
- **Purpose:** `WooCommerceController::webhook()` creates a legacy `Transaction` row but never calls `AccountingService::createEntry()` — WooCommerce-originated sales are entirely invisible to every P&L, Balance Sheet, Trial Balance, and Inventory Valuation report.
- **Business reason:** any tenant connecting WooCommerce (a named, marketed integration) will have real revenue silently missing from their own accounting reports — a total omission, not a drift.
- **Technical reason:** also uses the legacy, non-tenant-scoped, non-locked `InventoryService::deductFromBatches()` rather than the FIFO layer — a second, independent bug in the same code path.
- **Files involved:** `app/Http/Controllers/WooCommerceController.php:43-132`; `app/Services/InventoryService.php:71-92`.
- **Prerequisites:** should confirm first whether the newer `WooSync/WooWebhookController` + `SyncEngine` (found during the architecture research pass) is the one actually receiving production traffic, or whether this older `WooCommerceController` still is — do not fix the wrong one.
- **Risk if skipped:** silent, total revenue omission for an entire customer segment (multi-channel retail — a named target market).
- **Difficulty:** Medium-Hard. **Est. hours:** 16-24.
- **Validation:** new test asserting a synced WooCommerce order produces a real, balanced journal entry and a correct FIFO deduction.
- **Success criteria:** WooCommerce sales appear correctly in every financial report.
- **Launch impact:** Blocker for any tenant using WooCommerce; not a blocker for tenants who don't, but WooCommerce integration should not be marketed as functional until this ships. **Sources:** `FINAL_LAUNCH_READINESS_AUDIT.md` Finding 3.

**L013 — Fix AppSumo code import writing to non-existent columns**
- **Purpose:** `campaign`/`status` columns referenced by the AppSumo code importer don't exist in the `appsumo_codes` migration — silently dropped or throws on a schema-correct (fresh) database.
- **Business reason:** directly threatens the AppSumo launch channel, a named go-to-market strategy for this product.
- **Files involved:** the AppSumo code import command; `database/migrations/*_create_appsumo_codes_table.php` (or a new migration to add the columns, depending on what L005's diff concludes is correct).
- **Prerequisites:** L005.
- **Risk if skipped:** AppSumo code batch imports fail or silently corrupt data at the exact moment a launch campaign needs them to work.
- **Difficulty:** Easy-Medium. **Est. hours:** 4-6.
- **Validation:** run the import command against a fresh-migrated database, confirm no errors and correct data.
- **Success criteria:** AppSumo code import works identically on a fresh install as it does on the current (drifted) production database.
- **Launch impact:** Blocker if AppSumo is part of the launch plan (it is, per multiple docs). **Sources:** `REMEDIATION_PLAN.md` P1-1.

**L014 — Fix Installer writing bank balances to non-existent column**
- **Purpose:** the self-hosted installer writes imported bank balances to a `balance` column that doesn't exist (`bank_accounts` real columns are `opening_balance`/`current_balance`) — balances silently vanish on every fresh self-hosted install.
- **Files involved:** `app/Http/Controllers/InstallerController.php` (or wherever this write occurs).
- **Prerequisites:** L005.
- **Risk if skipped:** every new self-hosted customer's imported bank balances are silently lost during setup.
- **Difficulty:** Easy. **Est. hours:** 2-4.
- **Validation:** fresh install with sample bank-balance data, confirm balances persist correctly.
- **Success criteria:** installer bank-balance import works on a fresh schema.
- **Launch impact:** Blocker if self-hosted/on-prem is a launch channel; otherwise High priority. **Sources:** `REMEDIATION_PLAN.md` P1-2.

**L015 — Fix Purchases Excel import writing wrong column names**
- **Purpose:** the purchases importer writes `quantity`/`cost_price`/`subtotal` instead of the real columns `qty`/`unit_cost`/`line_total` — imports silently produce zero quantity and cost on a fresh database, corrupting inventory valuation from day one.
- **Files involved:** `app/Imports/PurchasesImport.php`.
- **Prerequisites:** L005.
- **Risk if skipped:** every fresh-install customer who imports historical purchase data gets silently corrupted opening inventory valuation.
- **Difficulty:** Easy-Medium. **Est. hours:** 4-6.
- **Validation:** import a sample purchases spreadsheet on a fresh-migrated database, confirm quantities and costs land correctly and FIFO batches are created.
- **Success criteria:** purchase import produces correct, non-zero quantities/costs matching the source file.
- **Launch impact:** Blocker — this directly corrupts the exact data (inventory cost basis) this product's whole value proposition depends on, for any customer migrating from another system (a primary onboarding path per the sales/marketing docs). **Sources:** `REMEDIATION_PLAN.md` P1-3.

**L016 — Fix debit note stock movements writing wrong column name**
- **Purpose:** writes `reference` instead of `reference_id` on `stock_movements` — broken purchase-return audit trail on a fresh database.
- **Files involved:** debit note / purchase return stock-movement writer.
- **Prerequisites:** L005.
- **Risk if skipped:** broken audit trail for purchase returns on fresh installs.
- **Difficulty:** Trivial. **Est. hours:** 1-2.
- **Validation:** create a debit note on a fresh-migrated DB, confirm the stock movement record is written and queryable.
- **Success criteria:** purchase-return audit trail intact on fresh schema.
- **Launch impact:** High. **Sources:** `REMEDIATION_PLAN.md` P1-4.

**L017 — Fix live V3 Sales Order creation writing to non-existent columns**
- **Purpose:** the `sales-orders.store` route — a live, currently-routed feature — writes to columns on `sales_orders`/`sales_order_items` that don't exist on a fresh schema, silently dropping warehouse, creator, quantities, UOM, discount, tax, and line totals. Quotation-to-sales-order conversion produces largely empty records.
- **Business reason:** unlike most of the schema-drift bugs (which mainly hit imports/installers), this is a live, everyday feature — any customer using Sales Orders on a properly-migrated database hits this immediately.
- **Files involved:** the V3 Sales Order creation controller/service; suspected duplicate bug in `ProposalController.php:420/451` and legacy `SalesOrderController.php` — must check both.
- **Prerequisites:** L005.
- **Risk if skipped:** Sales Orders — a core feature — is broken for any customer on a correctly-migrated database (i.e., every new SaaS signup, not just fresh installs).
- **Difficulty:** Medium. **Est. hours:** 8-12, more if the Proposal/legacy duplicates need separate fixes.
- **Validation:** create a quotation, convert to sales order, confirm all fields (warehouse, creator, quantities, UOM, discount, tax, line totals) are correctly populated.
- **Success criteria:** Sales Order creation works correctly for every new tenant, not just the drifted production database.
- **Launch impact:** Blocker — this is a live, core, everyday feature that is currently broken for anyone not on the specific drifted production schema. **Sources:** `REMEDIATION_PLAN.md` P1-5.

**L018 — Fix `PaymentAllocation` semantic bug and the test that locks it in as correct**
- **Purpose:** `PurchaseService::recordPurchasePayment` writes a Payment ID into a column meant to hold a Journal Entry ID, silently defeating the MySQL over-allocation trigger. This exact controller is currently dead code (not routed), but the regression test written for it (`PaymentAllocationTest.php:66`) **asserts the buggy value as the expected, passing result** — meaning if anyone correctly fixes and re-routes this code later, this test will actively fight the fix.
- **Business reason:** a landmine specifically engineered to defeat future correction — the worst kind of technical debt because it looks like protection.
- **Files involved:** `app/Services/PurchaseService.php:180-184`; `Tester/tests/Feature/PaymentAllocationTest.php:66`.
- **Prerequisites:** none.
- **Risk if skipped:** if this dead code is ever wired up (a real possibility — nothing prevents it), the bug reactivates and the test that should catch it instead defends it.
- **Difficulty:** Easy. **Est. hours:** 3-5.
- **Validation:** rewrite the test to assert the *correct* value (journal entry ID, not payment ID); confirm the trigger's over-allocation check actually fires when it should.
- **Success criteria:** the test would fail on the current buggy behavior and pass only on the correct fix.
- **Launch impact:** Medium (dead code today, but this is a landmine — fix now while cheap rather than after it's live). **Sources:** `REMAINING_WORK_PLAN.md` R6; `LAUNCH_READINESS_ENGINEERING_PLAN.md` item 3; independently confirmed fixed-everywhere-else by the audit's Finding (this task is specifically about the dead code + the bad test, not the live paths, which the audit confirmed are already correct).

---

### A2. Operational Blockers

**L019 — Schedule platform database backups and restore verification**
- **Purpose:** `routes/console.php` does not schedule `vq:backup` or `backup:verify` — both commands already exist and are well-built, they are simply never invoked. `docs/RUNBOOK.md` claims this was fixed two days before this audit; it was not, or it regressed.
- **Business reason:** a financial system of record with no working backup is a single hardware failure away from catastrophic, unrecoverable data loss for every tenant.
- **Files involved:** `routes/console.php`; `app/Console/Commands/CreateVqBackup.php`; `app/Console/Commands/VerifyBackup.php`; `docs/RUNBOOK.md` (correct the claim once genuinely verified).
- **Prerequisites:** none — this is close to a one-line change.
- **Risk if skipped:** total, unrecoverable data loss on any disk failure or catastrophic bug.
- **Difficulty:** Trivial (scheduling) + Medium (offsite/S3 copy, per RUNBOOK's own admission that backups currently only write to local disk). **Est. hours:** 2 (scheduling) + 8-16 (S3/offsite copy).
- **Validation:** `php artisan schedule:list` on the actual production box shows both commands; a real restore drill is executed and documented, not just scheduled.
- **Success criteria:** daily backup runs automatically, weekly restore-verification runs automatically, backups are copied offsite (not just local disk), and RUNBOOK.md is corrected to reflect verified (not assumed) status.
- **Launch impact:** Blocker. **Business impact:** This is table-stakes for any SaaS handling financial data — its absence would be disqualifying to any serious enterprise buyer or investor due-diligence process. **Customer impact:** Catastrophic if a data-loss event occurs while unscheduled.
- **Sources:** `FINAL_LAUNCH_READINESS_AUDIT.md` Finding 2.

**L020 — Stand up basic error monitoring / APM**
- **Purpose:** no Sentry, Bugsnag, or equivalent tool was found anywhere in `composer.json` or `package.json` — the team currently has no way to learn about production errors except a customer reporting them or manually reading log files.
- **Business reason:** every finding in this document that involves "silently fails" (COGS fabrication, activity logging, scheduled job failures) is far less dangerous with real-time error alerting in place — this is the single highest-leverage monitoring investment available.
- **Files involved:** `composer.json`, new middleware/config for whichever tool is chosen.
- **Prerequisites:** none.
- **Risk if skipped:** every other bug in this plan (fixed or not) becomes harder to detect in production.
- **Difficulty:** Easy-Medium. **Est. hours:** 8-16.
- **Validation:** deliberately trigger a test exception in staging, confirm it surfaces in the monitoring dashboard with tenant/user context.
- **Success criteria:** unhandled exceptions across the app (backend and frontend) are captured with enough context to diagnose without needing to reproduce; alerting configured for error-rate spikes.
- **Launch impact:** Blocker-adjacent — not itself a data-integrity bug, but the team's ability to respond to the first weeks of real traffic depends on it. **Sources:** `FINAL_LAUNCH_READINESS_AUDIT.md` scorecard (Monitoring: 25/100); `docs/GAPS.md`.

**L021 — Add failure alerting for scheduled/cron jobs**
- **Purpose:** ~20 scheduled jobs run in `routes/console.php` with no failure alerting found anywhere — exactly the failure mode that caused L019's backup gap to go unnoticed (the scheduler entry for backups was simply missing, and nothing alerted anyone).
- **Business reason:** the same silent-failure pattern that caused the backup gap can recur for any of the other ~20 scheduled jobs (trial reminders, low-stock alerts, WooCommerce sync, chat cleanup) without this.
- **Files involved:** `routes/console.php`.
- **Prerequisites:** L020 (use the same monitoring tool for consistency).
- **Risk if skipped:** the exact class of incident that already happened once (documented backup gap) recurs for a different job with nobody noticing.
- **Difficulty:** Easy. **Est. hours:** 4-8.
- **Validation:** simulate a job failure, confirm an alert fires.
- **Success criteria:** every scheduled command has `->emailOutputOnFailure()` or equivalent monitoring-service ping (Healthchecks.io/Cronitor/or the L020 tool); a "heartbeat missing" alert exists for jobs that should run but silently stopped being scheduled at all.
- **Launch impact:** High. **Sources:** research pass Part B, item 13.

**L022 — Fix CI test workflow using SQLite in contradiction of project policy**
- **Purpose:** `.github/workflows/venqore-tests.yml` configures tests against SQLite in-memory, directly contradicting `CLAUDE.md`'s explicit "MySQL only, no SQLite for any part of the system including testing" policy — and meaning several MySQL-trigger-enforced financial invariants (over-allocation check, negative-stock CHECK constraint) are never actually exercised by this workflow.
- **Business reason:** false-positive-green test runs on exactly the tests meant to protect financial correctness.
- **Files involved:** `.github/workflows/venqore-tests.yml`; `.github/workflows/ci.yml` (already correctly uses MySQL — use as the template).
- **Prerequisites:** L005 (this workflow's MySQL test DB must also be schema-verified against production).
- **Risk if skipped:** DB-trigger-dependent bugs continue to slip through a "green" CI run.
- **Difficulty:** Easy-Medium. **Est. hours:** 4-6.
- **Validation:** confirm the workflow now uses a MySQL service container; confirm a deliberately-broken trigger-dependent test fails under the new config where it would have passed under SQLite.
- **Success criteria:** all CI test workflows run against MySQL exclusively.
- **Launch impact:** Blocker-adjacent (undermines confidence in every other "tests pass" claim in this plan). **Sources:** `FINAL_LAUNCH_READINESS_AUDIT.md` Finding 11.

**L023 — Gate the deploy workflow on CI test success**
- **Purpose:** `.github/workflows/deploy.yml` triggers independently on push to `main`, not as a `workflow_run` gated on the test workflows succeeding — a direct push to `main` could deploy without any test having run.
- **Files involved:** `.github/workflows/deploy.yml`.
- **Prerequisites:** L022 (gate on a trustworthy test run, not the SQLite one).
- **Risk if skipped:** any change, including an accidental one, can reach production with zero automated verification.
- **Difficulty:** Easy. **Est. hours:** 2-4.
- **Validation:** push a deliberately failing test to a branch, confirm deploy does not proceed; confirm normal green-path deploys still work.
- **Success criteria:** deploy is technically incapable of running against code that hasn't passed CI.
- **Launch impact:** High. **Sources:** `FINAL_LAUNCH_READINESS_AUDIT.md` Finding 11; research pass Part B item 8.

**L024 — Fix non-functional activity/audit logging on fresh-migrated databases**
- **Purpose:** `HasActivityLog` writes 6 columns that don't exist in the migrated `activity_logs` schema; the write is wrapped in an empty/swallowing catch (confirmed by the audit's security pass to actually log via `Log::error()` today — but `REMAINING_WORK_PLAN.md` and `REMEDIATION_PLAN.md`, reading a slightly different state, found the underlying write still fails on a fresh DB). Reconcile which is currently true and fix the root schema gap either way.
- **Business reason:** the audit trail of who did what, when, is a compliance and incident-response requirement — for a system handling terminal activity screenshots and staff monitoring (per `docs/IMPLEMENTATION.md` T18's compliance-pack task), this is not optional.
- **Files involved:** `app/Traits/HasActivityLog.php`; the `activity_logs` migration (add missing columns per L005's diff).
- **Prerequisites:** L005.
- **Risk if skipped:** zero audit trail on any fresh install or disaster-recovery rebuild — discoverable only during an actual incident, which is the worst possible time.
- **Difficulty:** Easy-Medium. **Est. hours:** 4-8.
- **Validation:** fresh-migrate a database, trigger several loggable actions, confirm `activity_logs` rows are actually written with full detail (not just a `Log::error()` fallback).
- **Success criteria:** activity logging works identically on a fresh install as on the current production database.
- **Launch impact:** High. **Sources:** `REMAINING_WORK_PLAN.md` R3; `REMEDIATION_PLAN.md` P1-7; audit's security pass (Claim 4, found already fixed on the current code state at time of audit — re-verify this specifically as part of L005 since two other documents dispute it).

**L025 — Apply `HasTenant` scoping to the 6 models that have `tenant_id` but no global scope**
- **Purpose:** `CouponRedemption`, `PkVerification`, `PlanChangeNotification`, `StaffInvitation`, `TenantPlanOverride`, and `WooConnection` all have a `tenant_id` column but are not auto-isolated by the `HasTenant` trait — a distinct class of tenant-isolation gap from the `withoutGlobalScope` call sites the audit already reviewed (those were intentional and mostly justified; these are simply missing the scope entirely).
- **Business reason:** `WooConnection` holds per-store API credentials — a cross-tenant leak here is a credential leak, not just a data leak.
- **Files involved:** the 6 model files listed above.
- **Prerequisites:** none.
- **Risk if skipped:** any future controller code that queries these models without manually adding a `tenant_id` filter leaks cross-tenant, silently, with no test currently positioned to catch it (the audit's `TenantIsolationSweepGuardTest` covers a different 4-6 models; `IdorSweepTest` covers 10 others — neither list includes these 6).
- **Difficulty:** Medium (need to verify no code currently double-filters in a way that would break with the scope added). **Est. hours:** 12-16 for all 6, including tests.
- **Validation:** add `TenantIsolationSweepGuardTest`-style coverage for all 6 models specifically.
- **Success criteria:** all 6 models auto-scope by tenant; a cross-tenant access test for each passes.
- **Launch impact:** Blocker (WooConnection specifically — credential leak potential); High for the other 5. **Sources:** `REMAINING_WORK_PLAN.md` R8; `REMEDIATION_PLAN.md` P2-2.

---

### A3. Security Blockers (from the audit)

**L026 — Remove the wildcard `'*'` permission bypass and fix the `updateMember` permission-gate mismatch**
- **Purpose:** any tenant admin (not even the owner) can currently self-escalate to full permissions including billing access, defeating a specific denylist that assumes the wildcard case can't occur.
- **Files involved:** `app/Http/Middleware/CheckPermissions.php:49-52`; `app/Models/User.php:401-432`; `app/Http/Controllers/AdminController.php:809-864`; `routes/web.php:237-239`.
- **Prerequisites:** none.
- **Risk if skipped:** live privilege escalation, reachable today by any tenant admin.
- **Difficulty:** Medium. **Est. hours:** 8-12.
- **Validation:** attempt the exact escalation path the audit documented (`permissions: ['*']` via `updateMember`), confirm it's now rejected; confirm the platform-admin legitimate use of full access still works via an explicit, non-wildcard mechanism.
- **Success criteria:** no permission string other than an explicit, config-validated list can grant access; `updateMember` requires the same `permission:users.manage` its siblings require.
- **Launch impact:** Blocker. **Sources:** `FINAL_LAUNCH_READINESS_AUDIT.md` Finding 5.

**L027 — Add rate limiting to the POS PIN login endpoint**
- **Purpose:** `storePosPin()` has zero throttle/lockout on a 4-6 digit PIN — trivially brute-forceable.
- **Files involved:** `app/Http/Controllers/Auth/AuthenticatedSessionController.php:120-146`; `routes/auth.php:30`.
- **Prerequisites:** none.
- **Risk if skipped:** account takeover of any staff PIN-login account via brute force from a single unauthenticated endpoint.
- **Difficulty:** Trivial. **Est. hours:** 2-3.
- **Validation:** confirm throttle triggers after N attempts; confirm the legitimate cashier flow still works normally.
- **Success criteria:** matches the lockout discipline already present on `/login`.
- **Launch impact:** Blocker. **Sources:** `FINAL_LAUNCH_READINESS_AUDIT.md` Finding 6.

**L028 — Authenticate and validate the terminal screenshot upload endpoint**
- **Purpose:** unauthenticated, unvalidated file upload accepting up to 100MB per request at 60 req/min is an open storage-exhaustion DoS vector.
- **Files involved:** `app/Http/Controllers/Api/TerminalActivityController.php` (uploadScreenshot); `routes/api.php:16`.
- **Prerequisites:** consider pairing with L032 (terminal pairing tokens) so this and the terminal-hijack residual gap are closed by the same mechanism.
- **Risk if skipped:** trivial, unauthenticated disk-exhaustion attack against production.
- **Difficulty:** Easy-Medium. **Est. hours:** 4-8.
- **Validation:** confirm unauthenticated requests are rejected; confirm oversized/wrong-mime-type files are rejected.
- **Success criteria:** endpoint requires proven terminal ownership and enforces `mimes:`/`max:` validation.
- **Launch impact:** Blocker. **Sources:** `FINAL_LAUNCH_READINESS_AUDIT.md` Finding 7.

**L029 — Fix cash-purchase-return AP corruption** — *(duplicate of L011; not repeated as a separate task — cross-referenced here for completeness of the security/financial blocker grouping.)*

**L030 — Fix `AdminController::updateSettings` unvalidated logo upload**
- **Purpose:** an authenticated tenant admin can upload any file type (no `mimes:`/`max:` validation) into a public-facing storage path via the settings logo upload.
- **Files involved:** `app/Http/Controllers/AdminController.php:412-429`.
- **Prerequisites:** none.
- **Risk if skipped:** an authenticated-but-malicious tenant admin could upload an arbitrary file (e.g., an HTML file with embedded script, or a large file) to a public path.
- **Difficulty:** Trivial. **Est. hours:** 1-2.
- **Validation:** attempt to upload a non-image file, confirm rejection.
- **Success criteria:** logo upload enforces the same validation standard as other properly-validated uploads elsewhere in the codebase (`DataManagementController.php`, `ExpenseController.php` are correct examples to copy).
- **Launch impact:** High. **Sources:** security research pass, item 11.

**L031 — Remove the dead, never-referenced `auth` named rate limiter or wire it up**
- **Purpose:** a named `auth` rate limiter (10/min per IP) is defined in `AppServiceProvider.php` but never referenced by any route — dead configuration that looks like a control but isn't one.
- **Files involved:** `app/Providers/AppServiceProvider.php`; `routes/auth.php`.
- **Risk if skipped:** false sense of security reading the code; low direct risk since other mechanisms (LoginRequest lockout) partially cover this.
- **Difficulty:** Trivial. **Est. hours:** 1-2.
- **Success criteria:** either the limiter is applied where intended, or removed if genuinely redundant with existing per-controller lockout.
- **Launch impact:** Medium. **Sources:** security research pass, item 13.

**L032 — Add proof-of-possession pairing for terminal claiming (closes residual hijack gap)**
- **Purpose:** the terminal-hijack bug the prior audit flagged is fixed for *already-claimed* terminals, but any unauthenticated caller can still be first to claim a not-yet-paired terminal by guessing/enumerating its `device_id`.
- **Files involved:** `app/Http/Controllers/Api/HeartbeatController.php`; `app/Http/Controllers/Api/TerminalActivityController.php`; terminal provisioning flow.
- **Risk if skipped:** a low-but-nonzero-probability denial-of-service against a legitimate tenant trying to pair a new terminal.
- **Difficulty:** Medium. **Est. hours:** 8-16.
- **Validation:** confirm a terminal can only be claimed with a one-time pairing token issued at provisioning, not by device-ID guessing alone.
- **Success criteria:** first-contact claiming requires proof of possession.
- **Launch impact:** Medium (not launch-blocking, but should follow soon after). **Sources:** `FINAL_LAUNCH_READINESS_AUDIT.md` Finding 8.

**L033 — Scope `HeartbeatController::checkForUpdates()` to the resolved tenant**
- **Purpose:** currently runs an unscoped existence check across all tenants' products — a low-severity but real cross-tenant activity-signal leak.
- **Files involved:** `app/Http/Controllers/Api/HeartbeatController.php`.
- **Difficulty:** Trivial. **Est. hours:** 1-2.
- **Launch impact:** Low-Medium. **Sources:** `FINAL_LAUNCH_READINESS_AUDIT.md` Finding 8 (residual note).

**L034 — Explicitly enumerate `$fillable` on financially sensitive models instead of relying on `$guarded = []`**
- **Purpose:** 50 of 121 models (41%) — including `Payment`, `Party`, `Invoice`, `Product`, `PaymentAllocation`, `Expense`, `BankAccount` — are fully mass-assignment-unguarded. Currently latent (no live `Model::create($request->all())` pattern found), but one careless future change away from being exploitable.
- **Files involved:** the 50 model files; priority order should be the financially-sensitive ones listed above first.
- **Risk if skipped:** a single future controller change becomes immediately and silently exploitable, with the existing static analyzer (see L035) unable to catch the most common vulnerable pattern.
- **Difficulty:** Medium (need to verify nothing currently relies on writing to a field that isn't explicitly whitelisted). **Est. hours:** 16-24 for the highest-priority financial models; more for full coverage.
- **Validation:** attempt a mass-assignment attack against each hardened model in a test, confirm it's rejected.
- **Success criteria:** every financially sensitive model has an explicit `$fillable` array; a documented policy exists for why any model still uses `$guarded = []`.
- **Launch impact:** High (not immediately exploitable today, but a foundational hardening step). **Sources:** `FINAL_LAUNCH_READINESS_AUDIT.md` Finding 13.

**L035 — Extend `MassAssignmentAnalyzer` to cover instance-method writes**
- **Purpose:** the analyzer only scans static `Model::create()`/`DB::table()->insert()` calls — it does not catch `$model->update([...])` or `$model->fill([...])`, which is the dominant write pattern in this codebase's controllers.
- **Files involved:** `app/Support/Guardrails/MassAssignmentAnalyzer.php`.
- **Prerequisites:** none, but most valuable once L034 gives it something meaningful to protect.
- **Difficulty:** Hard (requires type inference to resolve the receiver's model class from a static token scan). **Est. hours:** 24-40.
- **Success criteria:** the analyzer flags an instance-method mass-assignment violation in a deliberate test case.
- **Launch impact:** Medium (defense-in-depth, not itself a live vulnerability). **Sources:** security research pass, item 7; `VenQore_Master_Roadmap_87_to_100.md` VNQ-094.

**L036 — Refresh the mass-assignment and permission-bypass guard test baselines**
- **Purpose:** `mass_assignment_drift.json` and similar baseline-diff files contain ~18 already-fixed signatures still sitting in the allow-list — meaning a regression back to that exact bad state would go silently uncaught by CI.
- **Files involved:** `Tester/tests/Feature/Guardrails/baselines/*.json`.
- **Prerequisites:** should happen after L034/L035, not before (re-baseline once, after hardening, not before).
- **Difficulty:** Easy. **Est. hours:** 4-6.
- **Validation:** manually review the baseline diff, confirm no genuinely-still-broken item is being newly excluded.
- **Success criteria:** baseline reflects only intentionally-accepted risk, not stale grandfathering of fixed bugs.
- **Launch impact:** Medium. **Sources:** `REMAINING_WORK_PLAN.md` R2.

**L037 — Move and re-enable the 7 tests currently in the wrong test directory**
- **Purpose:** 7 regression tests covering DebitNote, PaymentAllocation, PurchasesImport, Migration, SmartFulfillment, V3 SalesOrder, and AppSumo import currently live in `tests/Feature/` instead of `Tester/tests/Feature/` and never execute in the real suite or CI — false confidence.
- **Files involved:** the 7 misplaced test files (identify via `find . -name "*Test.php" -path "*/tests/Feature/*" -not -path "*/Tester/*"`).
- **Prerequisites:** none — should happen early since it may reveal that some of L013-L018's fixes were already (incorrectly) assumed tested.
- **Difficulty:** Trivial. **Est. hours:** 2-4.
- **Validation:** confirm all 7 now run as part of the standard suite/CI invocation.
- **Success criteria:** zero test files exist outside the directory the suite/CI actually executes.
- **Launch impact:** High (directly affects confidence in several other tasks in this plan). **Sources:** `REMAINING_WORK_PLAN.md` R1.

**L038 — Add a genuine idempotency test and protection to the primary online `/sales` endpoint**
- **Purpose:** unlike offline sync (which has a dedup check, albeit an imperfectly-tested one), the standard authenticated `/sales` POST endpoint — the most-used transaction path in the entire app — has zero idempotency protection or test coverage. A network retry or double-click here double-posts revenue and inventory.
- **Files involved:** `app/Http/Controllers/SaleController.php::store()` (or its V3 replacement if L009 has landed by this point).
- **Prerequisites:** ideally after L009 if sequencing allows (fix it once, in the engine that will actually be live), but should not be delayed past launch regardless of engine.
- **Difficulty:** Medium. **Est. hours:** 12-16.
- **Validation:** new test firing two genuinely-new (not pre-seeded) duplicate submissions at the live endpoint, asserting exactly one sale is created — closing the exact blind spot the audit found in the existing `OfflineSyncIdempotencyGuardTest`.
- **Success criteria:** double-submission of a new sale via the primary endpoint is provably deduplicated, not just assumed safe.
- **Launch impact:** Blocker — this is the most-used endpoint in the app and currently has the least protection against the exact bug class (duplicate financial postings) this whole audit is concerned with. **Sources:** `FINAL_LAUNCH_READINESS_AUDIT.md` Section 5 (test suite audit).

**L039 — Add a genuine concurrency/race-condition test for FIFO deduction and sale creation**
- **Purpose:** every "concurrency" test in the current suite executes sequentially within one process; nothing proves the `exists()`-then-`create()` and FIFO-lock patterns are actually safe under genuine concurrent requests.
- **Files involved:** new test infrastructure (may require a multi-process or multi-connection test harness, e.g., spawning parallel HTTP requests against a running test server rather than in-process PHPUnit calls).
- **Prerequisites:** L038.
- **Difficulty:** Hard (test infrastructure, not application code). **Est. hours:** 16-24.
- **Success criteria:** at least one test genuinely exercises two concurrent database connections racing against the same FIFO batch or sale-dedup check, and passes.
- **Launch impact:** High confidence-builder, not itself a code fix. **Sources:** `FINAL_LAUNCH_READINESS_AUDIT.md` Section 5.

**L040 — Monitoring integration for the reconciliation, backup, and cron-failure alerts (ties L007, L019, L021 together)**
- **Purpose:** consolidate the alerting requirements from the tasks above into a single monitoring setup decision so they don't get implemented as three inconsistent, one-off notification mechanisms.
- **Files involved:** whichever tool is chosen in L020.
- **Prerequisites:** L020.
- **Difficulty:** Easy (mostly wiring, once L020 exists). **Est. hours:** 4-8.
- **Launch impact:** High (this is what makes L007/L019/L021 actually operationally meaningful rather than theoretical). **Sources:** synthesis of L007, L019, L020, L021.

---

## PART 2 — TRACK B: PRODUCT COMPLETENESS

Track B assumes Track A is either complete or in progress. These are the items that separate "launched safely" from "actually the product this team set out to build." Grouped by theme; IDs continue from P001.

### B1. Financial Precision & Second-Order Correctness

**P001 — Migrate money math from PHP floats to a fixed-precision representation**
- **Purpose:** `V3\AccountingService`, `FifoService`, legacy `SaleController`, and `FinancialReportingService` all currently do float arithmetic with a 0.001 epsilon tolerance — workable at small scale, but a genuine drift risk as transaction volume and calculation chains grow (multi-line discounts, multi-currency, compounding rounding across returns/partial payments).
- **Business reason:** at meaningful scale, float drift is not hypothetical — it's a matter of when, not if, and this product's entire value proposition is precision.
- **Technical reason:** move to BCMath, a dedicated Money value object, or integer minor-units storage throughout the financial write path.
- **Files involved:** `app/Services/V3/AccountingService.php`, `app/Services/V3/FifoService.php`, `app/Http/Controllers/SaleController.php`, `app/Services/FinancialReportingService.php`.
- **Prerequisites:** ideally after L009 (fix once, in the surviving engine).
- **Risk if skipped:** slow-burn precision drift indistinguishable from Finding 1's symptom (numbers quietly stop matching) but from a completely different root cause, at higher transaction volume.
- **Difficulty:** Hard (touches the entire financial write path). **Est. hours:** 60-100.
- **Validation:** property-based test running thousands of randomized multi-line, multi-discount, multi-tax scenarios, asserting exact reconciliation with no epsilon tolerance needed.
- **Success criteria:** all financial calculations produce bit-exact, reproducible results without relying on approximate-equality tolerance.
- **Launch impact:** Not launch-blocking at current expected volume, but should be scheduled as the first major post-launch financial-engine investment. **Sources:** `docs/GAPS.md` C2.

**P002 — Standardize decimal precision on purchase/movement quantities**
- **Purpose:** confirm consistent decimal precision across `qty` fields in purchases, stock movements, and FIFO batches — a named but unconfirmed-status item from an earlier audit pass.
- **Files involved:** relevant migrations and model casts across `purchase_items`, `stock_movements`, `inventory_batches`.
- **Difficulty:** Medium. **Est. hours:** 8-12.
- **Launch impact:** Medium. **Sources:** `VenQore_Road_To_100.md` B8.

**P003 — Add reconciliation tests for all ~43 individual financial/inventory reports**
- **Purpose:** the audit's `GoldenTransactionTest`/`ReportsTest` prove correctness for a handful of report types; `V1_RELEASE_CHECKLIST.md` shows the large majority of the ~30-43 individual report pages were never even manually smoke-tested, let alone reconciliation-tested.
- **Files involved:** `app/Services/FinancialReportingService.php` and each report's controller/route.
- **Prerequisites:** P001 ideally, though not required to start.
- **Difficulty:** Hard (volume of work, not conceptual difficulty). **Est. hours:** 80-120 for full coverage; can be parallelized across reports.
- **Success criteria:** every report a customer can view has at least one automated test proving its output reconciles against the source ledger data.
- **Launch impact:** High priority, not a hard blocker if the highest-traffic reports (P&L, Balance Sheet, Trial Balance, Inventory Valuation — already covered) are solid. **Sources:** `VenQore_Road_To_100.md` B9; `V1_RELEASE_CHECKLIST.md`.

**P004 — Remove `AdminController`'s raw SQL aggregates that bypass `FinancialReportingService`**
- **Purpose:** ~15 raw `sum()/count()/DB::table()` aggregates in `AdminController` compute financial figures independently of the canonical reporting service — a "second calculator" that can silently disagree with the first.
- **Files involved:** `app/Http/Controllers/AdminController.php`.
- **Difficulty:** Medium. **Est. hours:** 16-24.
- **Success criteria:** every admin-facing financial figure is sourced from `FinancialReportingService`, not a parallel calculation.
- **Launch impact:** Medium-High (a real "which number do I trust" risk for internal/admin users). **Sources:** `VenQore_Master_Roadmap_87_to_100.md` VNQ-001.

**P005 — Verify/fix cascade-delete guards on financially-referenced records**
- **Purpose:** confirm the system actually blocks deleting a Product/Category/Party/Account/Warehouse that has historical transactions — an older document raised this as a required control; no current document confirms whether it's implemented.
- **Files involved:** relevant model delete methods/observers across Product, Party, Account, Warehouse.
- **Difficulty:** Medium. **Est. hours:** 12-20 (verification + fixes where missing).
- **Success criteria:** attempting to delete any entity with historical financial references is blocked with a clear error, not a silent orphan/cascade.
- **Launch impact:** High if currently missing — this is a real data-integrity risk in daily use, not just an edge case. **Sources:** `VenQore_Master_Roadmap.md` (root); `VenQore_Road_To_100.md` C3.

**P006 — Verify and remove hardcoded `123456` stock-adjustment PIN if present**
- **Purpose:** an earlier audit pass flagged a hardcoded stock-adjustment PIN — not confirmed by the current audit (out of scope of that pass) but concrete and quotable enough to warrant a direct verification.
- **Files involved:** wherever stock-adjustment PIN validation occurs (search for the literal string).
- **Difficulty:** Trivial once located. **Est. hours:** 2-4.
- **Launch impact:** High if confirmed present (a hardcoded bypass credential is a real vulnerability), Low if already resolved. **Sources:** `VenQore_Road_To_100.md` B6.

---

### B2. Billing & Plan-Gating Truth

**P007 — Reconcile the three disagreeing sources of plan-limit truth**
- **Purpose:** `config/plans.php`, the `PlanFeatureMatrixSeeder`, and the hardcoded pricing table in `Pricing.jsx` currently disagree with each other (Starter tier shown with P&L/Bank Reconciliation the seeder actually locks; `transactions_per_month` unlimited in the seeder for every paid plan despite being a marketed differentiator).
- **Business reason:** this is a direct billing-integrity and customer-trust issue — customers may be sold features they don't receive, or receive features they didn't pay for, either of which is a support/refund/legal exposure.
- **Files involved:** `config/plans.php`, `database/seeders/PlanFeatureMatrixSeeder.php`, `resources/js/Pages/Pricing.jsx` (or wherever the pricing table now lives).
- **Prerequisites:** none — should happen early in Track B, ideally before any paid marketing push.
- **Risk if skipped:** the audit's research explicitly called this a "refund magnet."
- **Difficulty:** Medium-Hard (requires deciding a single source of truth and migrating the other two to read from it, not just aligning values once). **Est. hours:** 24-40.
- **Validation:** for every plan tier, purchase (in a test environment) and confirm exactly the advertised features are unlocked and exactly the advertised limits are enforced.
- **Success criteria:** one canonical source of plan/feature truth; pricing page, seeder, and runtime enforcement all read from it.
- **Launch impact:** Should be resolved before any paid customer acquisition begins, even if not a hard technical launch blocker. **Sources:** `VenQore_Master_Roadmap_87_to_100.md` VNQ-010/011/012.

**P008 — Verify paid add-ons (WooCommerce/marketplace sync, AI tier) actually unlock on purchase**
- **Purpose:** these are sold on the pricing page while their backing feature flags default to off in the seeder; unverified whether purchasing actually flips the gate.
- **Files involved:** billing/subscription provisioning logic; feature-flag gate checks for each add-on.
- **Prerequisites:** P007, P012 (fail-open fix) — do this after the gating mechanism itself is trustworthy.
- **Difficulty:** Medium. **Est. hours:** 16-24.
- **Validation:** purchase each add-on as a test tenant, confirm the gated functionality actually becomes available.
- **Success criteria:** every priced add-on demonstrably unlocks its feature end-to-end.
- **Launch impact:** Should be resolved before marketing/selling these specific add-ons, even if the base product launches without them being sold yet. **Sources:** `VenQore_Master_Roadmap_87_to_100.md` VNQ-018/019.

**P009 — Verify LTD (lifetime deal) tier-3 excludes API access**
- **Purpose:** `docs/PRICING.md` itself flags this as a required pre-launch check — API access on a lifetime plan is the primary abuse vector for AI/sync features with ongoing marginal cost.
- **Files involved:** LTD tier feature-flag configuration.
- **Difficulty:** Trivial to verify, Medium to fix if wrong. **Est. hours:** 2-8.
- **Launch impact:** Blocker specifically for the AppSumo/LTD launch channel. **Sources:** `docs/PRICING.md`.

**P010 — Add per-tenant storage quota enforcement**
- **Purpose:** uploads are currently unmetered — an abuse vector for the SaaS billing model (unlimited free storage via a low-tier plan).
- **Files involved:** file upload handlers; a new usage-tracking mechanism.
- **Difficulty:** Medium. **Est. hours:** 16-24.
- **Launch impact:** Medium (real but slow-burn cost risk, not urgent for week one). **Sources:** `docs/PRICING.md`.

**P011 — Add one-trial-per-email/fingerprint abuse check**
- **Purpose:** currently no check preventing the same person from creating unlimited trial accounts.
- **Files involved:** signup/trial provisioning flow.
- **Difficulty:** Medium. **Est. hours:** 12-16.
- **Launch impact:** Medium. **Sources:** `docs/PRICING.md`.

**P012 — Fix `featuresArray()` failing open on unseeded feature keys**
- **Purpose:** a new/unseeded feature key currently defaults to unlocked rather than locked — meaning any newly-added feature flag is accidentally free for everyone until explicitly gated, which is both a billing leak and an easy mistake for future development to fall into repeatedly.
- **Files involved:** the feature-flag resolution logic (wherever `featuresArray()` is defined).
- **Prerequisites:** should happen before P008.
- **Difficulty:** Easy-Medium. **Est. hours:** 6-10.
- **Success criteria:** an unseeded feature key defaults to locked; a test confirms this explicitly.
- **Launch impact:** High — this is a systemic pattern that will keep causing billing leaks on every future feature addition until fixed. **Sources:** `VenQore_Master_Roadmap_87_to_100.md` VNQ-003.

**P013 — Add `plans.version` column for price-change grandfathering**
- **Purpose:** needed the first time pricing changes after launch; better to have before it's urgently needed.
- **Files involved:** `plans` migration, billing logic.
- **Difficulty:** Medium. **Est. hours:** 12-16.
- **Launch impact:** Low for launch itself, but should exist before the first post-launch price change. **Sources:** `docs/PRICING.md`.

**P014 — Reconcile the report-count discrepancy across customer-facing surfaces**
- **Purpose:** the number of available reports is stated 4 different ways (38/40/43/57) across the Features page, Pricing page, docs, and actual routes — a credibility problem specifically damaging for a precision/accounting-focused brand.
- **Files involved:** marketing copy, `docs/FEATURES.md`, actual route count.
- **Difficulty:** Easy (once someone authoritatively counts the actual routes). **Est. hours:** 4-8.
- **Launch impact:** Medium (brand credibility, not functional). **Sources:** `VenQore_Master_Roadmap_87_to_100.md` VNQ-021; audit Section 10.

---

### B3. The Product's Actual Competitive Moat (highest strategic priority in Track B)

**P015 — Build report drill-down from P&L/dashboard figures to source journal entries/receipts**
- **Purpose:** described consistently across `docs/ROADMAP.md`, `docs/FEATURES.md`, `docs/UIUX.md`, and the 87→100 doc as "the demonstrable moat" and "the product thesis made tangible" — and it is not built yet.
- **Business reason:** this is the single feature most likely to differentiate this product from cheaper competitors (Vyapar, Loyverse) in a sales demo — being able to click a number on a report and see the exact transaction that produced it is a trust-building, jaw-dropping moment for a skeptical small-business buyer.
- **Files involved:** `app/Services/FinancialReportingService.php` (needs to expose linkable source references), all report frontend pages.
- **Prerequisites:** P001 recommended first (precision), P003 pairs naturally with this (drill-down and reconciliation testing reinforce each other).
- **Difficulty:** Hard. **Est. hours:** 60-100.
- **Success criteria:** from any report line item, a user can click through to the originating sale/purchase/journal entry.
- **Launch impact:** Not launch-blocking, but should be the single highest-priority post-launch (or pre-launch if timeline allows) product investment — this is what turns "another POS" into "the accounting-grade POS."
- **Sources:** `docs/ROADMAP.md`, `docs/FEATURES.md`, `docs/UIUX.md`, `VenQore_Master_Roadmap_87_to_100.md`.

**P016 — Build receipt printer / cash-drawer hardware integration**
- **Purpose:** explicitly ranked "the #1 hard blocker for real shops" across multiple docs — browser-only printing is not acceptable for a physical retail POS.
- **Business reason:** without this, the product cannot actually be used in a real physical store, which is the core use case.
- **Technical reason:** requires an ESC/POS integration path — either WebUSB (browser-native, limited hardware support) or a lightweight local print-server/QZ-Tray bridge (broader hardware support, requires customer-side installation).
- **Files involved:** new frontend integration layer, `Pos.jsx` (post-decomposition, see P018).
- **Prerequisites:** a technical spike/decision (WebUSB vs. print-server) should happen early, since it affects several other POS UX decisions.
- **Difficulty:** Hard. **Est. hours:** 80-140 depending on chosen approach and hardware compatibility testing.
- **Success criteria:** a real receipt printer and cash drawer can be triggered directly from a completed POS sale, tested against at least 2-3 common thermal printer models.
- **Launch impact:** Should be resolved before any serious in-person retail sales push, even if not required for a limited/beta launch to businesses that can tolerate manual printing initially.
- **Sources:** `docs/FEATURES.md`, `docs/ROADMAP.md` ("#1 hard blocker for real shops").

**P017 — Productize the data-import concierge (Vyapar/Excel/Square CSV templates)**
- **Purpose:** the underlying `DataImportService` and mapping UI already exist; this is about packaging it as an explicit, guided onboarding/sales touchpoint rather than a raw technical capability.
- **Business reason:** switching-cost reduction is one of the highest-leverage conversion levers for a product competing against entrenched incumbents (Vyapar, Square) — "we'll migrate your data for you" is a strong sales motion that currently isn't productized.
- **Files involved:** existing import service/UI, new guided-import onboarding flow.
- **Difficulty:** Medium. **Est. hours:** 24-40.
- **Success criteria:** a new signup can select "I'm switching from Vyapar/Excel/Square," upload their export, and see a mapped preview before committing.
- **Launch impact:** High business value, not a technical blocker. **Sources:** `docs/FEATURES.md`, `docs/SALES.md`.

**P018 — Decompose `Pos.jsx` (3,577 lines) into maintainable components**
- **Purpose:** flagged independently by `docs/GAPS.md`, `docs/UIUX.md`, and `docs/ROADMAP.md` as both a maintainability risk (bugs hide in a file this size) and a UX risk (no visible offline-queue state, hard to add the printer integration cleanly on top of it).
- **Prerequisites:** should happen before or alongside P016 (printer integration), since adding hardware integration to a 3,577-line component compounds the problem.
- **Difficulty:** Hard (large refactor of the single most business-critical frontend component; requires careful regression testing throughout). **Est. hours:** 60-100.
- **Success criteria:** POS functionality is split into logically separate, independently testable components; a visible offline-sync-queue indicator/retry UI is added as part of the decomposition (addresses a real UX gap simultaneously).
- **Launch impact:** Not launch-blocking, but should precede P016 and any other major POS feature work. **Sources:** `docs/GAPS.md`, `docs/UIUX.md`, `docs/ROADMAP.md`.

---

### B4. Design System & UX Polish

**P019 — Build a design-token layer and eliminate hardcoded hex colors**
- **Purpose:** 186 unique hardcoded hex colors exist across the app with zero design tokens in `tailwind.config.js` — this is the single largest lever for making the product feel "premium" rather than "functional but rough," per the 87→100 audit's own framing.
- **Files involved:** `tailwind.config.js`, every component currently using inline hex values.
- **Difficulty:** Hard (large surface area, mostly mechanical but extensive). **Est. hours:** 60-100.
- **Success criteria:** zero hardcoded hex colors remain outside the token definitions; a single token change can restyle the app consistently.
- **Launch impact:** Not blocking, high value for perceived quality. **Sources:** `VenQore_Master_Roadmap_87_to_100.md` (design system section).

**P020 — Roll out `EmptyState` components across all report/index pages**
- **Purpose:** only ~2 of 44 report pages have explicit empty states — every other page renders blank for a new store, which is the exact moment (first login after signup) a product most needs to look intentional and helpful.
- **Files involved:** the existing `EmptyState` component (per `docs/IMPLEMENTATION.md` T13), all report/index pages missing it.
- **Difficulty:** Medium (mechanical but wide surface area). **Est. hours:** 40-60.
- **Success criteria:** every list/report page shows a helpful, on-brand empty state instead of a blank table for new tenants.
- **Launch impact:** Should be resolved before launch if possible — this is literally the first-impression screen for every new signup. **Sources:** `docs/UIUX.md`, `docs/IMPLEMENTATION.md` T13.

**P021 — Add a toast/notification library and standardize form-error patterns**
- **Purpose:** currently no consistent toast system; form errors are handled inconsistently across the app.
- **Difficulty:** Medium. **Est. hours:** 24-40.
- **Launch impact:** Medium-High UX consistency win. **Sources:** `VenQore_Master_Roadmap_87_to_100.md`.

**P022 — Consolidate 6 overlapping layout shells into one**
- **Difficulty:** Hard (structural refactor). **Est. hours:** 40-60.
- **Launch impact:** Medium (maintainability, indirect UX consistency). **Sources:** `VenQore_Master_Roadmap_87_to_100.md`.

**P023 — Accessibility pass: ARIA attributes, keyboard navigation, contrast, touch targets**
- **Purpose:** only 2 of 102 components have any ARIA attributes; accessibility scored 35/100 in the project's own self-assessment.
- **Files involved:** app-wide, prioritize POS and the top 10 highest-traffic forms first.
- **Difficulty:** Hard (breadth). **Est. hours:** 80-120 for meaningful coverage, more for full WCAG AA.
- **Launch impact:** Medium for launch, High for any enterprise/accessibility-conscious customer or eventual compliance requirement. **Sources:** `docs/UIUX.md`; `VenQore_Master_Roadmap_87_to_100.md` VNQ-070-074.

**P024 — Mobile/tablet responsiveness verification and fixes for POS specifically**
- **Purpose:** the project's own UIUX self-assessment scores mobile responsiveness 60/100 and explicitly marks it "unverified" — with POS-on-tablet flagged as the critical untested path (many small retailers use a tablet as their primary POS device).
- **Difficulty:** Medium-Hard. **Est. hours:** 40-60.
- **Launch impact:** High if tablet POS is a real expected use case for the target market (very likely, given the small-retail focus). **Sources:** `docs/UIUX.md`.

**P025 — Command palette (⌘K) and optimistic UI on POS cart interactions**
- **Difficulty:** Medium-Hard. **Est. hours:** 40-60 combined.
- **Launch impact:** Low for launch, meaningful for perceived product quality afterward. **Sources:** `VenQore_Master_Roadmap_87_to_100.md`.

**P026 — Currency/number/date formatting utility; remove hardcoded currency symbols**
- **Purpose:** `ONBOARDING_PLAN.md` flags hardcoded `Rs`/`PKR`/`$`/`£` strings in the frontend instead of reading `settings.currency_symbol` dynamically — a real bug for any non-Pakistan customer, not just a polish item.
- **Files involved:** frontend components with hardcoded currency strings (search for the literal symbols).
- **Difficulty:** Medium. **Est. hours:** 16-24.
- **Success criteria:** every currency display reads from tenant settings; no hardcoded currency symbol remains.
- **Launch impact:** High if any non-Pakistan customer is expected at launch — this is a correctness bug for them, not cosmetic. **Sources:** `ONBOARDING_PLAN.md`.

**P027 — Fix category-creation inline-form bug in `ProductModal.jsx`/`PremiumSelect.jsx`**
- **Purpose:** flagged as an "immediate Phase 1 fix" in the onboarding plan; status unconfirmed as fixed.
- **Difficulty:** Easy-Medium once located. **Est. hours:** 4-8.
- **Launch impact:** Medium-High if still broken — category creation is a first-five-minutes onboarding action. **Sources:** `ONBOARDING_PLAN.md`.

---

### B5. Localization & Market-Specific Features

**P028 — Urdu/RTL localization framework**
- **Purpose:** Pakistan is explicitly the beachhead market per multiple docs, yet there's no `lang/` RTL strategy today.
- **Difficulty:** Hard (framework-level, touches layout direction across the whole app). **Est. hours:** 100-160.
- **Launch impact:** Not blocking for an English-language soft launch, but should be prioritized early post-launch given the stated market strategy. **Sources:** `docs/GAPS.md` M8; `docs/FEATURES.md`.

**P029 — JazzCash/Easypaisa payment link integration**
- **Purpose:** named local payment methods for the target market, currently unbuilt.
- **Difficulty:** Medium-Hard (third-party payment gateway integration). **Est. hours:** 40-60.
- **Launch impact:** Medium, high strategic value for the stated market. **Sources:** `docs/FEATURES.md`.

**P030 — WhatsApp Business API receipts**
- **Purpose:** named feature, gated on WhatsApp API approval (external dependency, start early).
- **Difficulty:** Medium (mostly integration + approval-process lead time). **Est. hours:** 30-50 engineering + external approval lead time.
- **Launch impact:** Not blocking. **Sources:** `docs/ROADMAP.md`, `docs/FEATURES.md`.

**P031 — Kitchen Display / restaurant mode (KOT)**
- **Difficulty:** Hard (new feature surface). **Est. hours:** 100+.
- **Launch impact:** Not blocking unless restaurant is a launch-priority vertical. **Sources:** `docs/FEATURES.md`.

**P032 — Customer-facing invoice portal**
- **Difficulty:** Medium-Hard. **Est. hours:** 60-80.
- **Launch impact:** Not blocking, meaningful for B2B-leaning customers. **Sources:** `docs/FEATURES.md`.

**P033 — Tally/QuickBooks export bridge for accountant acceptance**
- **Purpose:** named explicitly as needed for accountant sign-off in the sales motion — small business owners often defer to their accountant's tooling preference.
- **Difficulty:** Medium. **Est. hours:** 30-50.
- **Launch impact:** Medium-High business value (removes a real sales objection). **Sources:** `docs/SALES.md`, `docs/COMPETITOR.md`.

**P034 — Mobile companion app (owner dashboard + stock lookup)**
- **Purpose:** separate Flutter plan already exists as its own document; treat as a distinct, larger initiative rather than folding into this plan's estimates.
- **Difficulty:** Very Hard (new platform). **Est. hours:** out of scope for hour-estimation here — track against the dedicated Flutter plan document.
- **Launch impact:** Not blocking. **Sources:** `docs/FEATURES.md`; `AMD_ERP_Flutter_Mobile_Plan.md` (not read in this pass — read before scoping).

**P035 — Public REST API**
- **Purpose:** feature flag already exists in the plan/billing system; the actual API is unbuilt.
- **Difficulty:** Hard. **Est. hours:** 80-120 for a genuinely documented, versioned, rate-limited public API.
- **Launch impact:** Not blocking for initial launch; relevant for any integration-partner or enterprise conversations. **Sources:** `docs/FEATURES.md`.

**P036 — Shopify channel for VenSynQ marketplace sync**
- **Prerequisites:** should follow, not precede, getting the existing VenSynQ Amazon/eBay/TikTok integration genuinely stable (the audit's research found this integration was non-functional until emergency same-day fixes just before this plan was written — verify current real stability before adding a new channel).
- **Difficulty:** Medium-Hard. **Est. hours:** 40-60.
- **Launch impact:** Not blocking. **Sources:** `docs/FEATURES.md`.

---

### B6. Onboarding & Activation

**P037 — Verify/complete the industry-based Setup Wizard "magic step"**
- **Purpose:** the wizard is designed to auto-seed categories/attributes by business type (Fashion→variants, Electronics→serials, Pharmacy→batch/expiry, Jewelry→high-precision weights) — described as planned but not confirmed shipped by any current document.
- **Files involved:** `resources/js/Pages/SetupWizard.jsx`; `app/Http/Controllers/SetupController.php` (both confirmed to exist and be non-trivial per the architecture research pass — this task is about confirming the industry-specific seeding specifically, not the wizard's existence generally).
- **Difficulty:** Medium (verification) + Medium (completing any gaps found). **Est. hours:** 16-30.
- **Launch impact:** High — this is described as "the magic step" that differentiates onboarding from a generic empty-state setup. **Sources:** `ONBOARDING_PLAN.md`.

**P038 — Build staff-specific simplified onboarding tour**
- **Purpose:** distinct from the owner's full setup wizard — a cashier/staff member logging in for the first time needs a different, narrower tour.
- **Difficulty:** Medium. **Est. hours:** 20-30.
- **Launch impact:** Medium. **Sources:** `ONBOARDING_PLAN.md`.

**P039 — Build the persistent activation checklist component**
- **Purpose:** named in `docs/IMPLEMENTATION.md` T14 alongside EmptyState work — helps new tenants understand what setup steps remain.
- **Difficulty:** Medium. **Est. hours:** 16-24.
- **Launch impact:** Medium-High (directly affects trial-to-paid activation rate, which the growth docs identify as the key early metric). **Sources:** `docs/IMPLEMENTATION.md` T14.

**P040 — Day-7 "here's your real P&L" activation email**
- **Purpose:** named in `docs/PRICING.md` as a not-yet-built activation/retention touchpoint.
- **Difficulty:** Easy-Medium. **Est. hours:** 8-16.
- **Launch impact:** Medium (retention lever, not launch-blocking). **Sources:** `docs/PRICING.md`.

---

### B7. Compliance, Trust & Support Infrastructure

**P041 — GDPR-style data export/deletion self-service (or documented manual process)**
- **Purpose:** flagged as required "even if manual for now" — status in current codebase unknown.
- **Difficulty:** Medium (self-service) or Easy (documented manual process as an interim step). **Est. hours:** 8 (manual process doc) to 40 (self-service feature).
- **Launch impact:** Medium — increasingly expected even from small-business SaaS, and a real requirement for any EU-adjacent customer. **Sources:** `VenQore_PreLaunch_Checklist.md`.

**P042 — CAN-SPAM compliance on transactional emails (unsubscribe link, physical address)**
- **Difficulty:** Trivial-Easy. **Est. hours:** 4-8.
- **Launch impact:** Should be resolved before launch — this is a legal compliance requirement, not a nice-to-have, for any email sent to US-based customers/leads. **Sources:** `VenQore_PreLaunch_Checklist.md`.

**P043 — Confirm `/health` endpoint contract (per-dependency status: DB/redis/storage/queue)**
- **Purpose:** `MANUAL_LAUNCH_CHECKLIST.md` references a `HealthController` as already existing; confirm it actually reports per-dependency status rather than a generic 200.
- **Difficulty:** Easy (verification) + Easy (fixes if incomplete). **Est. hours:** 4-8.
- **Launch impact:** Medium — meaningfully improves incident-response speed when paired with L020/L021's monitoring. **Sources:** `VenQore_PreLaunch_Checklist.md`.

**P044 — File-upload security hardening: MIME-type verification (not extension-only), block SVG uploads**
- **Purpose:** confirm uploads are validated by actual content type, not just file extension (an `evil.php.jpg` should be rejected); confirm SVG uploads are blocked (a known XSS vector via embedded scripts).
- **Files involved:** all file-upload handlers app-wide.
- **Prerequisites:** pairs naturally with L028, L030.
- **Difficulty:** Medium. **Est. hours:** 16-24.
- **Launch impact:** High — a concrete, testable security requirement. **Sources:** `VenQore_PreLaunch_Checklist.md`.

**P045 — Mail deliverability verification: SPF/DKIM/DMARC, mail-tester.com score, real inbox test**
- **Purpose:** transactional email deliverability is currently unverified; a low spam score would quietly undermine trial reminders, receipts, and activation emails without anyone noticing until support tickets pile up.
- **Difficulty:** Easy-Medium (mostly DNS/provider configuration). **Est. hours:** 8-16.
- **Success criteria:** mail-tester.com score of 8/10 or better; confirmed inbox (not spam) delivery on major providers (Gmail, Outlook).
- **Launch impact:** Should be resolved before launch. **Sources:** `MANUAL_LAUNCH_CHECKLIST.md`; `VenQore_PreLaunch_Checklist.md`.

**P046 — Live-gateway payment and AppSumo redemption end-to-end tests (not sandbox)**
- **Purpose:** explicitly required by `MANUAL_LAUNCH_CHECKLIST.md` — a real transaction and a real AppSumo code redemption, not test-mode simulations.
- **Difficulty:** Easy (execution) but requires careful handling of real money/real codes in a controlled way.  **Est. hours:** 8-16.
- **Launch impact:** Blocker-adjacent — should happen in final pre-launch verification, not skipped in favor of sandbox-only testing. **Sources:** `MANUAL_LAUNCH_CHECKLIST.md`.

**P047 — Write and test a rollback procedure, executed by someone other than its author**
- **Purpose:** explicitly required by the manual checklist; a rollback plan nobody but its author can execute is not a real rollback plan.
- **Difficulty:** Easy-Medium. **Est. hours:** 8-16 including the actual drill.
- **Launch impact:** Should be resolved before launch. **Sources:** `MANUAL_LAUNCH_CHECKLIST.md`.

**P048 — Cross-browser and cross-device QA pass (Chrome/Firefox/Edge/Safari, mobile, tablet)**
- **Purpose:** `V1_RELEASE_CHECKLIST.md` shows this was never completed — entirely unchecked.
- **Difficulty:** Medium (execution effort, not technical difficulty). **Est. hours:** 24-40.
- **Launch impact:** High — POS-on-tablet and cross-browser correctness are directly customer-facing on day one. **Sources:** `V1_RELEASE_CHECKLIST.md`.

**P049 — Complete the fresh-install simulation checklist (`migrate:fresh --seed`, default login, storage symlink)**
- **Purpose:** marked CRITICAL in `V1_RELEASE_CHECKLIST.md` but left unchecked — and directly relevant given L005/L013-L018's schema-drift findings, since this is exactly the scenario those bugs manifest in.
- **Prerequisites:** L005, L013-L018 (this task is effectively the acceptance test for that whole cluster of fixes).
- **Difficulty:** Easy (execution) once the underlying bugs are fixed. **Est. hours:** 4-8.
- **Success criteria:** a completely fresh install, seeded from scratch, works end-to-end with no manual database patching.
- **Launch impact:** Blocker — this is the acceptance criterion proving L005's entire cluster of fixes actually worked. **Sources:** `V1_RELEASE_CHECKLIST.md`.

**P050 — Load test at realistic and stretch scale (200 concurrent trials / 1k sales/min; 100k-1M row reports)**
- **Purpose:** explicitly specified in `docs/LAUNCH.md` as a required T-30-day step; no evidence it has ever been run.
- **Difficulty:** Medium (tooling: k6 or similar) + dependent on what it finds. **Est. hours:** 16-24 for the test itself, unknown additional hours if it surfaces performance problems.
- **Launch impact:** Should be resolved before any paid marketing push, even if a soft/limited launch proceeds without it. **Sources:** `docs/LAUNCH.md`; `VenQore_Master_Roadmap_87_to_100.md` VNQ-080.

**P051 — Fact-check and correct the public feature-count claims ("226+" vs "140+") and the `V1_MASTER_FEATURE_CHECKLIST.md` source list**
- **Purpose:** the project's own `docs/FEATURES.md` self-flags the public "226+" number as only defensible with heavy caveats and recommends "140+"; the likely source document contains multiple unverified/aspirational claims (real-time FBR compliance reporting, AI "Retention/Forecasting/Churn Brains," hardware load-shedding detection) that should be fact-checked before any of them appear in customer-facing marketing.
- **Files involved:** marketing copy, website, `V1_MASTER_FEATURE_CHECKLIST.md`.
- **Difficulty:** Medium (requires a genuine feature-by-feature audit of what's actually shipped vs. aspirational). **Est. hours:** 16-24.
- **Launch impact:** Medium-High (false marketing claims are a direct legal/trust liability, distinct from the internal documentation-consistency issue the audit already flagged). **Sources:** `docs/FEATURES.md`; audit Section 10.

**P052 — Write the 10 required SEO comparison pages**
- **Purpose:** `docs/MARKETING.md` calls these "highest intent" content and specifies writing all 10 (vs Loyverse, Vyapar, Square, Lightspeed, Marg, Tally, Zoho, Odoo, ERPNext, QuickBooks) early.
- **Difficulty:** Medium (content work, not engineering — but should be scheduled and tracked here since it's a named launch dependency). **Est. hours:** 40-60 (content creation).
- **Launch impact:** Not a technical blocker, high early-growth value. **Sources:** `docs/MARKETING.md`.

---

## PART 3 — PRIORITY MATRICES

### 3.1 By Severity

| Critical (block launch) | High (fix immediately post-launch or before if timeline allows) | Medium (first 90 days post-launch) | Low (backlog) |
|---|---|---|---|
| L001-L005 (repo integrity + schema diff) | L008-L010 (V3 cutover prep) | L032, L033 (residual terminal gaps) | P025 (command palette) |
| L006, L007 (COGS fabrication + reconciliation) | L020-L024 (monitoring, CI/deploy gating) | L035, L036 (analyzer coverage, baseline refresh) | P028-P036 (localization, market features) |
| L011-L018 (schema-drift financial bugs) | L025 (missing tenant scopes) | P002-P006 (precision/cascade guards) | P034 (mobile app — track separately) |
| L019 (backups) | L034, L037-L039 (mass assignment, test infra, idempotency, concurrency) | P019-P027 (design system, UX polish) | |
| L026-L028, L030 (permission escalation, PIN, uploads) | P007-P014 (billing/plan-gating truth) | P037-P043 (onboarding, compliance) | |
| P049 (fresh-install acceptance test) | P015-P018 (moat features, POS decomposition) | P044-P052 (final QA, load test, content) | |
| P042, P046, P047 (compliance, live payment test, rollback) | | | |

### 3.2 Quick Wins (high impact, low effort — do these first regardless of sequencing)

- L016 (debit note column fix) — 1-2 hrs
- L027 (PIN rate limiting) — 2-3 hrs
- L033 (scope checkForUpdates) — 1-2 hrs
- L030 (logo upload validation) — 1-2 hrs
- L031 (dead rate limiter) — 1-2 hrs
- L013, L014 (AppSumo import, installer bank balance columns) — 2-6 hrs each
- P006 (verify hardcoded PIN) — 2-4 hrs
- P012 (fail-open feature flags) — 6-10 hrs
- P042 (CAN-SPAM compliance) — 4-8 hrs

### 3.3 Highest ROI (business value per engineering hour)

1. **L006** (COGS fabrication fix) — single highest-leverage fix in the entire plan; small effort, removes the most severe finding.
2. **L019** (schedule existing backup commands) — the hard work is already built; this is almost pure configuration.
3. **P012** (fail-open feature flags) — closes a systemic billing-leak pattern that would otherwise recur with every future feature.
4. **P007** (plan-limit truth reconciliation) — directly prevents refund/trust damage before any paid marketing spend.
5. **L038** (idempotency on primary sales endpoint) — closes the largest remaining gap in financial-correctness testing for modest effort.

### 3.4 Largest Risk if Left Undone

1. L006 — silent financial corruption on the primary sale path.
2. L019 — total, unrecoverable data loss exposure.
3. L012 — total revenue omission for an entire marketed integration.
4. L017 — a live, core feature (Sales Orders) broken for every new customer.
5. L026 — live privilege escalation.

### 3.5 Largest Business Value

1. P015 (report drill-down) — the actual competitive moat.
2. P016 (receipt printer integration) — unlocks the core physical-retail use case entirely.
3. P017 (import concierge productization) — directly reduces switching cost, the primary sales objection.
4. P007/P008 (billing truth) — protects revenue integrity and prevents refund cycles.
5. L009 (V3 cutover) — removes the structural cause of recurring financial bugs, compounding value over time.

### 3.6 Biggest Security Win

L026 (wildcard permission fix) > L027 (PIN throttling) > L025 (missing tenant scopes) > L028 (screenshot upload auth) > P044 (upload MIME validation).

### 3.7 Biggest Stability Win

L001-L005 (repo/schema integrity) > L020/L021 (monitoring + cron alerting) > L022/L023 (CI/deploy gating) > L039 (concurrency testing).

### 3.8 Biggest UX Win

P018 (Pos.jsx decomposition) > P020 (empty states) > P016 (printer integration) > P024 (tablet responsiveness) > P019 (design tokens).

### 3.9 Biggest Revenue Win

P007/P008 (billing truth + add-on verification) > P015 (drill-down moat feature) > P017 (import concierge) > P052 (SEO comparison pages) > P009 (LTD API restraint, prevents abuse-driven cost).

---

## PART 4 — DEPENDENCY GRAPH

```
L001 (single working copy)
  └─▶ L002 (php -l verification)
        └─▶ L003 (CI corruption gate)
  └─▶ L004 (commit/discard uncommitted diff)
  └─▶ L005 (schema diff — HIGH LEVERAGE, unlocks the next 6 tasks)
        ├─▶ L006 (COGS fabrication fix) ──▶ L007 (reconciliation backstop)
        │         └─▶ L008 (engine parity inventory) ──▶ L009 (V3 cutover)
        │                                                    ├─▶ L010 (partial return fix) [must precede full cutover]
        │                                                    └─▶ L038 (idempotency on primary endpoint) [do in surviving engine]
        ├─▶ L013 (AppSumo import columns)
        ├─▶ L014 (installer bank balance)
        ├─▶ L015 (purchases import columns)
        ├─▶ L016 (debit note columns)
        ├─▶ L017 (Sales Order columns)
        └─▶ L024 (activity log columns)
              └─▶ P049 (fresh-install acceptance test — validates the entire L005 cluster)

L011 (purchase return AP fix) — independent, no dependencies
L012 (WooCommerce accounting) — independent, but verify which WC controller is live first
L018 (PaymentAllocation test fix) — independent

L019 (backups) — independent, near-zero dependency, do immediately
L020 (monitoring) ──▶ L021 (cron alerting) ──▶ L040 (consolidate L007/L019/L021 alerts)
L022 (CI MySQL fix) ──▶ L023 (deploy gating)

L025 (tenant scope on 6 models) — independent
L026 (wildcard permission fix) — independent
L027 (PIN rate limit) — independent
L028 (screenshot upload auth) ──▶ pairs with L032 (terminal pairing tokens)
L030 (logo upload validation) — independent

L034 (explicit $fillable) ──▶ L035 (analyzer instance-method coverage) ──▶ L036 (baseline refresh)
L037 (fix misplaced tests) — should happen EARLY, before trusting any "already tested" claim in this plan

── Track A complete / launch gate ──

P001 (float→precision migration) ──▶ P002 (decimal standardization) ──▶ P003 (report reconciliation tests)
P004 (remove AdminController raw aggregates) — independent
P005 (cascade-delete guards) — independent
P007 (plan-limit truth) ──▶ P008 (add-on unlock verification) ──▶ P009 (LTD API check)
P012 (fail-open flags) — should precede P008
P015 (drill-down) — benefits from P001, P003 first
P016 (printer integration) — benefits from P018 (Pos.jsx decomposition) first
P018 (Pos.jsx decomposition) — should precede P016, P025
```

**Never-before rules (explicit ordering constraints):**
- Never attempt L009 (V3 cutover) before L006, L008, and L010 are complete — this is the exact sequencing failure the audit's Section 10 documents happening three times already.
- Never treat any "test passes" claim as confirmation until L037 (misplaced tests) is resolved.
- Never schedule P008 (add-on unlock verification) before P012 (fail-open fix) — verifying unlock behavior against a fail-open gate produces false confidence.
- Never begin P016 (printer hardware integration) inside the current monolithic `Pos.jsx` — do P018 first.

---

## PART 5 — SCORING: CURRENT VS. POST-PLAN

| Dimension | Current | Post-Track-A | Post-Track-B | Confidence |
|---|---:|---:|---:|---|
| Architecture | 60 | 72 | 88 | High — L009/P018 are well-scoped refactors |
| Backend | 55 | 78 | 90 | High for Track A; Medium for full P001 precision migration |
| Frontend | 62 | 68 | 88 | Medium — P018/P019 are large surface-area efforts |
| UI | 65 | 68 | 90 | Medium — depends on design-system execution quality |
| UX | 60 | 70 | 88 | Medium-High |
| Testing | 68 | 85 | 92 | High — the gaps found are specific and closeable |
| Financial correctness (design) | 82 | 85 | 92 | High |
| Financial correctness (as run) | 38 | 88 | 95 | High once L006/L009 land |
| Accounting | 70 | 90 | 95 | High |
| Security | 54 | 82 | 90 | High — findings are specific and mostly small fixes |
| Performance | 62 | 70 | 85 | Medium — depends on P050 load-test findings |
| Scalability | 62 | 72 | 85 | Medium |
| Documentation | 40 | 75 | 90 | Medium-High — requires ongoing discipline, not just one pass |
| Developer Experience | 58 | 75 | 88 | High |
| Business Readiness | 55 | 80 | 92 | High |
| Sales Readiness | 60 | 78 | 92 | Medium-High — depends on P017 execution |
| AppSumo Readiness | 75 | 90 | 95 | High |
| Enterprise Readiness | 35 | 55 | 75 | Medium — enterprise readiness needs more than this plan covers (SSO, audit export, SLA tooling — explicitly out of scope, see Section 7 below) |
| Website | 70 | 75 | 88 | Medium |
| Brand/Trust | 55 | 78 | 90 | Medium-High — depends on P051 fact-check discipline |
| **Launch Readiness** | **52** | **90** | **97** | **High for the Track A jump; the last few points require real production traffic experience, not just code** |
| **Overall Product** | **58** | **75** | **93** | **High** |

---

## PART 6 — ANSWERS TO THE FINAL QUESTIONS

**1. Are we ready to launch?** No. Confirmed by the audit and unchanged by this planning pass — if anything, this pass found the true remaining-work surface is larger than the audit alone suggested (the schema-drift cluster alone is 6 additional concrete bugs beyond what the audit scored).

**2. If not, exactly why not?** The audit's four launch blockers (COGS fabrication, missing backups, WooCommerce accounting gap, dual sale engines) remain the headline reasons. This plan adds a second, equally serious cluster this audit didn't fully quantify: a family of schema-drift bugs (L013-L018) that break AppSumo import, self-hosted installer, purchases import, and — most seriously — live Sales Order creation, on any correctly-migrated database. Both clusters trace to the same root pattern: code and schema, or code and its intended engine, silently diverging without anything catching it.

**3. If this implementation plan is completed, what launch score will we reach?** Approximately **90/100** after Track A alone, based on the scoring table above — genuinely launch-ready, with the caveat that a few points (production-scale confidence, enterprise trust signals) are earned by operating in production, not by writing more code.

**4. Will we reach 100/100?** Not from Track A alone, and realistically not from Track B alone either — see question 5.

**5. If not, what still prevents 100/100?** Three things no implementation plan can fully close on paper: (a) **production track record** — a system only earns the last few points of "production confidence" by actually running correctly under real customer load for a meaningful period, which is time, not code; (b) **enterprise-grade trust infrastructure** genuinely out of this plan's scope as written — SSO/SAML, exportable compliance audit logs, formal SLA tooling, SOC 2-style controls — none of which are blocking for a small-business launch but all of which cap "Enterprise Readiness" until built; (c) **the float-to-precision migration (P001)** and **full report reconciliation (P003)** are large enough efforts that "100/100 financial correctness" is honestly a 90-95 target from this plan, with the last stretch requiring sustained operation at real transaction volume to fully validate.

**6. Besides the manual launch checklist, what remains?** Everything in Track B that isn't already folded into a Track A prerequisite — most importantly P015 (drill-down) and P016 (printer integration), which are product-completeness items, not launch blockers, but are what separates "technically launched" from "actually winning against Vyapar/Loyverse in a sales demo."

**7. Is there anything missing from every audit done so far?** Yes, three things this planning pass surfaced that no single audit fully owned: (a) the schema-drift bug cluster's full blast radius — the audit found it as a general risk category but this pass traced it to 6 specific broken features (L013-L018); (b) the plan-limit/billing-truth crisis (P007/P008/P012) — a real, quotable "refund magnet" risk that the security/financial audit didn't examine because it's a business-logic-correctness issue, not a security or accounting-engine issue; (c) the fact that a huge swath of the application (per `V1_RELEASE_CHECKLIST.md`) has literally never been manually verified — most individual reports, cross-browser behavior, the fresh-install path. No amount of code-reading audit substitutes for that checklist actually being run.

**8. What blind spots still exist?** This plan, like the audit before it, is built entirely from reading code and documents — nothing here has been executed against a running system. Every "should work" and "confirmed fixed" claim in Track A needs a real execution pass (P049's fresh-install test, P046's live payment test, P048's cross-browser pass) before being trusted. The V3 accounting engine's correctness is verified by strong tests, but those tests have also never been run in this session — their "passing" status is inherited from documentation, not independently confirmed by executing them. Enterprise-specific requirements (SSO, formal compliance certifications) were out of scope for every audit so far including this plan, and should be explicitly scoped as a separate initiative if enterprise sales become a priority.

**9. What would you add that nobody has mentioned?** A **change-management discipline for this exact failure pattern going forward**: every one of the recurring problems in this codebase's history (fix claimed, verification broken; schema drift; tests that don't run) shares one root cause — a fix and its proof-of-fix were allowed to ship as separate, unlinked events. The single highest-leverage process change this plan can recommend beyond its task list: **no task in this document should be marked complete without its own named validation step (already included above) being executed and its result attached to the task, not just described as "should pass."** This is worth adopting as a standing engineering policy, not a one-time task.

**10. If this were your own SaaS company, would you launch after completing this plan? Why?** Yes, after Track A plus P049, P046, P047, P048, P042, P045 specifically (the launch-adjacent items in Track B that function as final acceptance criteria even though they're not pure code fixes). At that point the product would have a well-tested, singular financial engine; verified backups and monitoring; closed security gaps; a genuinely fresh-installable, schema-consistent database; and honest billing. That is a legitimate, defensible launch — not a perfect product, but an honest one, which for a financial ERP is the higher bar. I would not wait for the rest of Track B (drill-down, printer integration, localization, mobile app) — those compound the product's competitive position over time, but none of them are what stands between this system and being safe to trust with a customer's books today.

---

*This document does not modify, fix, or implement anything. It is a planning artifact synthesized from `FINAL_LAUNCH_READINESS_AUDIT.md` and 22 additional source documents, cross-referenced for consistency and gaps. Every task traces to a specific source; nothing here is invented without evidentiary basis in either the audit's direct code verification or a prior planning document's specific, quotable finding.*
