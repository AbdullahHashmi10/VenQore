# VenQore — Build Log (Single Source of Truth)

**Purpose:** Every change we make to reach **Sellable (85)** is logged here, in order, with proof. Nothing is "done" until its acceptance test is green on the dashboard and I (the auditor) have re-read the code and signed it off.

**The loop we run for every item:**
1. I write the precise instruction here + give it to you.
2. You paste it to the IDE's AI. It implements.
3. You run the **Tester dashboard** (`Tester/dashboard/launch.bat` → http://localhost:7821).
4. You report back the result.
5. I re-read the actual code + the test output, then mark the item ✅ **VERIFIED** or ❌ **REJECTED** (with why).
6. Only ✅ moves us forward.

**Rule:** We never weaken a test to make it green. The test is the spec. We fix the code.

---

## Status Legend
`⬜ TODO` · `📨 INSTRUCTION ISSUED` · `🔁 IMPLEMENTED (awaiting verify)` · `✅ VERIFIED` · `❌ REJECTED`

---

## Current State Snapshot (2026-06-20)

- ✅ Forensic audit complete → `VenQore_Forensic_Audit_Report.md` (Findings F1–F17).
- ✅ Milestone plan complete → `VenQore_Implementation_Plan.md` (M1 Sellable / M2 Trustworthy / M3 Perfect).
- ✅ 10-Day Launch Plan re-verified. **Done:** Days 1, 2, 3, 5, 6. **Partial:** Day 4 (WooCommerce flag, Cookbook gating, secrets). **Remaining:** Days 7, 8, 9, 10.
- 🔁 Money-correctness track (F1–F17): **2 of 17 verified** (M1-01 ✅, M1-02 ✅). This is what blocks "Sellable."

---

## 🔒 STANDING RULE (added 2026-06-20, at user's direction)

**No production code (app/, routes/, config/, database/) may be changed to make a test pass** unless the test has proven a REAL bug AND the auditor has approved it. The IDE must REPORT failures with root-cause + (a) real-bug / (b) test-problem classification and STOP — never silently patch a controller or weaken a test. Test-harness infra (base TestCase, tenant binding, DB config) may be fixed freely but must be reported. A green test bought by editing a controller is worse than a red one — it hides a bug.

---

## ✅ TESTER HEALTH — Tester-Fix-0 RESOLVED 2026-06-20

**Tester-Fix-0 (was CRITICAL): harness moved from SQLite → MySQL `amd_pos_test`. ✅ VERIFIED.**
- `Tester/phpunit.xml` L74/77 → `DB_CONNECTION=mysql`, `DB_DATABASE=amd_pos_test`. ✔
- `VenQoreTestCase`: SQLite shims (DATE_FORMAT/FIELD) REMOVED; `RefreshDatabase` now refreshes MySQL. ✔
- **105-failure cascade root cause fixed correctly:** base `TestCase`/`SmokeTestCase` were binding a generic `\stdClass` as `current.tenant`; `PlanGate::check()` called `$tenant->getLimit()` → fatal. Fixed by binding an **anonymous class extending the real `App\Models\Tenant`** with a proper `getLimit()` (Tester/tests/TestCase.php L13-49). **`PlanGate` was NOT weakened** (L30-44 intact, no method_exists/fail-open). ✔
- Money suite (M1-01..M1-06b) confirmed green on MySQL. ✔
- IDE followed the new standing rule: reverted its earlier SettingsController edit, fixed root cause, and STOPPED to report a triage of remaining failures. ✔

**Remaining MySQL failures after the fix — triaged (NOT yet actioned, awaiting our calls):**
- `SerializationDragnetTest` (2) → FIXED via correct plan-tier test setup (legit, green now).
- `SettingsTest` (2) → (b) harness/validation: controller validation whitelist rejects `store_name`/`currency_symbol` keys. Candidate **real bug** (those settings should be saveable) — needs decision.
- `CodeStackingTest::read_access_is_never_blocked_at_limit` (1) → **(a) REAL BUG**: read/GET is blocked with 403 when tx limit hit; reads must never be blocked. → new item **M1-EX1**.
- `LayoutAndAdminUsersRegressionTest::cannot_update_owner_role` (1) → **(a) REAL BUG**: `AdminController::updateMember()` generic `catch(\Exception)` swallows `abort(403)` into a 500. → **M1-EX2 ✅ FIXED & VERIFIED 2026-06-20** (see below).

### M1-EX2 ✅ VERIFIED — abort(403) no longer swallowed into 500
- `AdminController::updateMember()` L826-830: `catch(HttpException) { throw $e; }` placed BEFORE the generic `catch(\Exception)`. Intended 403/404/422 rethrow; genuine errors still log+500. ✔
- `removeMember()` has no try/catch → its abort(403) already bubbled correctly (IDE's claim accurate). ✔
- `LayoutAndAdminUsersRegressionTest` green on MySQL (cannot_update_owner_role now 403; cannot_remove_owner_member stays green); Money suite stays green. ✔
- **Logged for M2 hardening (NOT fixed now, correctly flagged by IDE):** same `catch(\Throwable)`-could-swallow-abort pattern in `BillingController:46`, `DashboardController:76/169`, `RecycleBinController:236`, `WooConnectionController:208/246/512`. Candidates for an M2 sweep.

---

## ⚠️ (historical) TESTER HEALTH note — SQLite vs MySQL (now resolved above)

**Tester-Fix-0 (CRITICAL): the test harness runs on SQLite, not your production MySQL.**
- Evidence: `Tester/tests/Feature/VenQoreTestCase.php` L27–31, L37 (`RefreshDatabase` + `SQLiteConnection` shims for `DATE_FORMAT`, `FIELD`).
- Your own `CLAUDE.md` says **MySQL only; testing DB = `amd_pos_test`; SQLite NOT supported.** The harness violates this.
- **Why it matters:** a test can be GREEN on SQLite while the bug is still live on MySQL. Specifically:
  - **F9 (fractional quantity):** SQLite is typeless and stores `2.5`; MySQL `integer` column truncates to `2/3`. The SQLite test would falsely pass.
  - **Concurrency/oversell (lockForUpdate):** SQLite ignores row locks → any race test is meaningless.
  - Decimal precision, strict-mode, and date functions differ.
- **Action:** Move the harness to MySQL `amd_pos_test` (point `phpunit.xml` / `.env.testing` at it, drop the SQLite shims, keep `RefreshDatabase`). **Must be done before the F9 test (M1-07) and any concurrency test can be trusted.** Money-math tests (M1-01, M1-02) are DB-agnostic and are valid on SQLite in the meantime, so this does not block us starting.
- Status: ⬜ TODO (scheduled right before M1-07).

---

## Master Ledger — Milestone 1 (Sellable / 85)

| ID | Item | Finding | Acceptance test | Status |
|---|---|---|---|---|
| **M1-01** | `returned_quantity` + cap partial returns | F1 | `Money/ReturnIntegrityTest::M1-01` | ✅ VERIFIED |
| **M1-02** | Net returns out of 4 profit reports | F2 | `Money/ReturnIntegrityTest::M1-02 north-star` | ✅ VERIFIED |
| **M1-03** | Tenant-scope `/api/bank-accounts` + raw-query sweep | F3 | `Money/TenantLeakTest` (to add) | ⬜ TODO |
| **M1-04** | Block force-delete of journaled docs | F4 | `Money/HistoryImmutabilityTest` (to add) | ⬜ TODO |
| **M1-05** | Pre-sale conversion posts COGS + real tax | F5 | `Money/PreSaleConversionTest` (to add) | ⬜ TODO |
| **M1-06** | Tax computed after order discount | F7 | update existing `Module04` discount test | ⬜ TODO |
| **M1-07** | `sale_items.quantity` → DECIMAL(12,4) | F9 | `Money/FractionalQtyTest` (needs MySQL) | ⬜ TODO (after Tester-Fix-0) |
| **M1-08** | Core composite indexes | F11 | schema assertion test | ⬜ TODO |
| **M1-09** | POS open-return: sign + warehouse + idempotency | F6 | `Money/PosReturnTest` (to add) | ⬜ TODO |
| **M1-10** | Supplier party-statement sign | F8 | `Money/SupplierStatementTest` (to add) | ⬜ TODO |
| **M1-11** | Close Day-4 gaps (Woo flag, Cookbook enforce) | NP-1/2 | gating tests | ⬜ TODO |
| **M1-12** | Rotate marketplace secrets; confirm VenSynQ off | NP-3 | manual check | ⬜ TODO |
| **M1-13** | Lemon Squeezy live activation | Day7 | manual + webhook test | ⬜ TODO |
| **M1-14** | A4 print / chat z-index / SmartCapture | Day7 | manual | ⬜ TODO |
| **M1-15** | Google Drive backup+restore | Day8 | manual on test store | ⬜ TODO |
| **M1-16** | Reconciliation spot-check + full regression | Day10 | dashboard all-green | ⬜ TODO |

**Tester deliverable created this session:** `Tester/tests/Feature/Money/ReturnIntegrityTest.php` (2 ruthless tests, expected RED until M1-01 + M1-02 land). Registered on the dashboard as the **Money** suite (`test-runner.js` modules + keys arrays).

---

## Chronological Work Log

### 2026-06-20 · Session 1 · Setup
- Created forensic audit, implementation plan, this log.
- Built the **Money** acceptance suite and wired it into the dashboard.
- Flagged Tester-Fix-0 (SQLite vs MySQL).
- **Issued instruction for M1-01** (below).

---

### ENTRY M1-01 — `returned_quantity` + cap partial returns
**Status:** 📨 INSTRUCTION ISSUED → awaiting IDE
**Finding:** F1 (Critical) — repeated partial returns refund more than was sold.
**Acceptance test:** `Money/ReturnIntegrityTest::M1-01` must turn GREEN; `M1-02 north-star` may stay RED (needs M1-02 too); no other Money/Module04 test may regress; trial balance stays zero.

**Instruction given to IDE:** see the assistant message dated 2026-06-20 (verbatim). Summary: add `returned_quantity DECIMAL(12,4) DEFAULT 0` to `sale_items` (migration), and in `SaleController::returnSale()` cap every partial return at `quantity − returned_quantity`, increment `returned_quantity` inside the DB transaction, and base `isFullReturn()` on remaining-returnable.

**IDE result:** Reported M1-01 GREEN; Module04 (8 payment tests) no regression. M1-02 north-star still red (expected — needs M1-02).

**Auditor verdict:** ✅ **VERIFIED** (2026-06-20, re-read of actual diff — not the IDE's self-report).

Re-read line-by-line against the real files:
- **Migration** `2026_06_20_120619_..._add_returned_quantity...`: adds `decimal('returned_quantity', 12, 4)->default(0)->after('quantity')`. Correct width/scale, correct default, reversible `down()`. ✔
- **`SaleItem.php`**: `'returned_quantity'` in `$fillable` (L48) and cast `'decimal:4'` (L63). ✔
- **`SaleController::returnSale()`** (L699–702): cap = `min(requested, quantity − returned_quantity)`, with `if ($qty <= 0) continue;`. The cap reads the *persisted* `returned_quantity`, so it correctly shrinks across repeated calls. ✔
- **Increment inside transaction** (L771–772): `DB::table('sale_items')->where('id', …)->increment('returned_quantity', $qty)` — atomic, inside the `DB::transaction` closure (closes L816). No partial state on failure. ✔
- **Zero-return gate** (L775–777): `if ($returnTotal == 0 && empty($journalItems))` → `back()->withErrors(['error' => 'Nothing left to return…'])`. Blocks the 3rd return cleanly. ✔
- **`isFullReturn()`** (L847–873): compares requested against **remaining-returnable** (`quantity − returned_quantity`), skips already-cleared lines. A sale is "full" only when every line's remaining balance is cleared. ✔
- **`SaleReversalService::reverse()`** (L168–170): sets `returned_quantity = quantity` per line inside the reversal loop; docblock (L48) confirms `reverse()` runs inside a controller-level `DB::transaction()`. ✔

**Test honesty check:** `ReturnIntegrityTest::M1-01` asserts the real invariant `Σ|refunds| ≤ net_sales` **and** `assertTrialBalanceZero` — it does **not** hard-code the bug as expected (unlike the old Module04 discount test). It is the spec, and it was not weakened. ✔

**Caveats noted, not blocking:**
- Test ran on SQLite (Tester-Fix-0). M1-01 is pure money-math → DB-agnostic → valid here. Still must move harness to MySQL before M1-07 (F9).
- Could not independently re-run pest from my sandbox (no PHP — it lives in your XAMPP). Verdict is based on reading the actual code + your dashboard result, which is the agreed loop.

**M1-01 is signed off. Cleared to proceed to M1-02.**

---

### ENTRY M1-02 — Net returns out of the profit reports (NORTH STAR)
**Status:** ⬜ TODO → instruction next.
**Finding:** F2 (Critical) — item-wise profit & P&L count returned units at full value (ghost revenue).
**Acceptance test:** `Money/ReturnIntegrityTest::M1-02 north-star` must turn GREEN (report shows 13 kept units / Rs 2,600, not 15 / Rs 3,000), trial balance zero, M1-01 stays green.

**Instruction given to IDE:** issued 2026-06-20 (verbatim in assistant message). Net `returned_quantity` out of all 4 aggregation sites in `FinancialReportingService` via a per-line kept-fraction `(quantity − returned_quantity) / quantity` applied to qty, revenue, and COGS.

**IDE result:** Reported M1-02 north-star GREEN + M1-01 stays green; Module12 ReportsTest 12/12; Module21 34/34; Module15 unaffected. Also edited two test files (plan-tier setup + fund PIN seeding).

**Auditor verdict:** ✅ **VERIFIED** (2026-06-20, re-read of actual diff + test honesty check).

Re-read against real code:
- **`getGrossProfitByProduct`** (L229–232): kept-fraction `((quantity − COALESCE(returned_quantity,0)) / NULLIF(quantity,0))` applied to net_revenue, total_qty, AND total_cogs — same fraction on revenue and COGS, so margin stays honest. ✔
- **`getGrossProfitBySale`** (L270–272, `si.` alias): same fraction on revenue + COGS inside the subquery. ✔
- **`getGrossProfitByCategory`** (L344–345): same. ✔
- **`getGrossProfitByParty`** (L380–382): same. ✔
- `NULLIF(quantity,0)` guards divide-by-zero; `COALESCE(returned_quantity,0)` handles legacy NULLs; `free_quantity` kept at full value (not returnable). ✔
- **V3 `SaleService::reverse()`** (L442–445): `update(['returned_quantity' => quantity])` per line, tenant-scoped, **inside** the `DB::transaction` closure (closes L489). So V3 full reversals also net out of reports. ✔

**Test-honesty check (the IDE touched test files — I checked for cheating):**
- North-star test (ReturnIntegrityTest L175–181) is **UNCHANGED** — still asserts exactly 13 units / Rs 2,600. Not weakened. ✔
- Module12 gross-profit test asserts real invariant: 200/100/100 before return → 0/0/0 after full return. Honest. ✔
- The test edits were **legitimate setup fixes, not spec weakenings**: (a) tenant created with `plan: 'business'`/`ltd_3` so the request clears the `reports.tax` **tier gate** (the test was 403-ing on entitlement, not on the bug); (b) seeded a `security_pin` + passed `passcode` for the fund-injection test (FundController requires PIN — test was missing it). Neither changes any money assertion. ✔

**Caveat:** still SQLite (Tester-Fix-0). M1-02 is money-math → DB-agnostic → valid. MySQL move still required before M1-07.

**M1-02 signed off. F2 (ghost revenue) is closed: Item-wise Profit and P&L now net returns identically.**

---

### ENTRY M1-03 — Tenant-scope `/api/bank-accounts` + raw-query sweep (NEXT)
**Status:** ⬜ TODO → instruction next.
**Finding:** F3 (Critical) — tenant data leak; full-suite run shows `✗ strictly isolates tenant data in v3 reports and exports`.
**Acceptance test:** two-tenant test — A sees only A's bank accounts; the v3 reports/exports isolation test goes GREEN; no unscoped `DB::table()` on a tenant table.

**Auditor pre-read (2026-06-20) — confirmed leak points in live code:**
- `app/Http/Controllers/Api/BankAccountController.php` L15: `DB::table('bank_accounts')->get()` — **raw query, no tenant filter.** Bypasses `BankAccount`'s `HasTenant` global scope. Every tenant's bank accounts exposed via `/api/bank-accounts` (route L1192). **PRIMARY F3 LEAK.**
- `routes/web.php` L443: `BankAccount::get()` in an inline closure — uses the model so the global scope *should* apply; confirm it's inside tenant-bound middleware.
- `app/Http/Controllers/ReportController.php` L430: `Party::find($partyId)` — returns the party object even for a foreign tenant's id (the failing `strictly isolates tenant data` test expects `party => null`). Downstream journal queries ARE tenant-scoped (L450+), so the leak is only the `Party::find()` object resolution.

**Instruction given to IDE:** issued 2026-06-20 (verbatim in assistant message).

**IDE result:** Both leaks fixed; Module12 12/12 incl. isolation test; M1-01/M1-02 green; Module21 34/34. Raw-query sweep delivered with per-hit scoped/unscoped judgments.

**Auditor verdict:** ✅ **VERIFIED** (2026-06-20, re-read of fixed code + independent audit of the sweep's judgment calls).

Fixes confirmed in real code:
- `Api/BankAccountController.php` L15–19: now `if (!app()->bound('current.tenant')) return json([],403);` then `DB::table('bank_accounts')->where('tenant_id', $tenantId)->get()`. Primary F3 leak closed — no unscoped path. ✔
- `ReportController::partyStatement()` L430–431: `Party::where('id',$partyId)->where('tenant_id',$tenantId)->first()`. Foreign party_id now resolves to null → empty report. ✔
- V3 `ReportService::partyLedger` already scoped (`->where('tenant_id',$tid)->where('id',$partyId)->firstOrFail()`) — no change needed, confirmed. ✔
- Route L443 `BankAccount::get()` closure: confirmed inside the tenant-bound `s/{store_slug}/admin` group → `HasTenant` global scope applies. Safe. ✔

**Independent audit of the sweep's "expected/unscoped" dismissals (the dangerous part):**
- `SuperAdminController` (Admin\) + `AdminDashboardController` (Admin\) unscoped `sales`/`tenants` aggregates: I traced the routes — they sit behind `SuperAdminMiddleware` (web.php L290, `prefix('VenQore')`). Platform-admin-only by design; unscoped is correct, NOT a leak. ✔
- Child subqueries (`journal_items` WHERE journal_entry_id = journal_entries.id) constrained by a tenant-scoped parent: sound. ✔
- Seeder/command queries (ResetDemoTenant, MigrateOpeningBalances, etc.) include tenant_id: sound. ✔

**Verdict:** the two real leaks are closed and the sweep's judgment calls hold up under independent route-tracing. No hidden second leak. M1-03 signed off.

**Caveat:** still SQLite harness (Tester-Fix-0). Isolation logic here is DB-agnostic → valid. The dedicated two-tenant IDOR-on-every-route pass remains M2-07 (broader than this single endpoint).

---

### ENTRY M1-04 — Block force-delete of journaled documents
**Status:** ✅ VERIFIED
**Finding:** F4 (Critical) — force-deleting a journaled sale can alter a closed period / unbalance history.
**Acceptance test:** `Money/HistoryImmutabilityTest` — posted sale force-delete blocked + trial balance zero; unposted draft deletes fine.

**Instruction given to IDE:** issued 2026-06-20 (verbatim in assistant message).

**IDE result:** Controller guard added; legacy `is_reversed=1` line removed; new `Money/HistoryImmutabilityTest` both cases green; M1-01/02, Module12, Module21 all green. Removed redundant `uses()` from Money test files (Pest conflict).

**Auditor verdict:** ✅ **VERIFIED** (2026-06-20, re-read of controller + new test + Pest config).

Controller (`RecycleBinController::forceDelete()` sale branch, L241-269):
- `$hasJournal` check covers BOTH `reference == sale->id` AND `reference == reference_number`, tenant-scoped. ✔
- Posted sale → blocked with the exact error, NO deletes, NO journal mutation. ✔
- **The dangerous legacy line `JournalEntry::...->update(['is_reversed'=>1])` is GONE** (not bypassed) — that line was silently unbalancing the books. This was the real fix. ✔
- Draft path wrapped in `DB::transaction`; `payments()->delete()` corrected (Payment has no soft-deletes). ✔

Test honesty (I checked the `uses()` removal wasn't a cheat):
- `Pest.php` L28-53 auto-binds `VenQoreTestCase` to every `Feature/*` subdir via `->in()`, so a file-level `uses()` causes the documented "already uses" conflict. Removing it was CORRECT — `Money` tests still extend the base case via the directory binding (proven by `$this->createTenant`/`assertTrialBalanceZero` resolving and running). Not a cheat. ✔
- `HistoryImmutabilityTest` posts a REAL sale via `/s/{slug}/sales`, confirms a JournalEntry, soft-deletes, hits the REAL force-delete route, asserts sale survives + `assertTrialBalanceZero`. Genuine. ✔
- `deleteQuietly()` bypasses the model OBSERVER (a 2nd protection layer) so the test proves the CONTROLLER guard works on its own — good design, not a bypass of the thing under test. ✔

**Note for follow-up (not blocking):** `pre_sale`/`proposal`/`product` branches still force-delete without a journal check — lower risk (not the posted financial doc), logged as M2 hardening candidate.

**M1-04 signed off. Force-deleting a posted sale is impossible; the recycle bin can no longer unbalance the books.**

---

### ENTRY M1-05 — Pre-sale conversion posts COGS + real tax + payment status (NEXT)
**Status:** ⬜ TODO → instruction next.
**Finding:** F5 (Critical) — converting a pre-sale/quotation to an invoice may not post the COGS journal leg (DR COGS / CR Inventory), so inventory & P&L diverge.
**Acceptance test:** convert a pre-sale → Balance Sheet balances, Inventory drops by COGS, P&L COGS rises, GP == item-wise; tax carried correctly.

**Auditor pre-read (2026-06-20) — confirmed in live code (`SalesOrderController::convertToSale()` L280-453):**
- Journal entry posted at L430-449 has **only DR AR (1200) / CR Revenue (4000)**. The **DR COGS (5000) / CR Inventory (1100) leg is MISSING entirely** — even though `$lineCogs` is computed (L350-354) and FIFO stock is physically deducted. Result: Inventory asset overstated, P&L shows revenue with zero COGS (inflated GP), item-wise (FIFO-based) disagrees with P&L. **This is F5.**
- Tax hardcoded to `0.0` (L317, L392) with a comment admitting `sales_order_items` has no tax_rate column — any taxable pre-sale converts to a zero-tax invoice, losing the liability. Secondary F5 issue.

**Instruction given to IDE:** issued 2026-06-20 (verbatim in assistant message).

**IDE result:** COGS leg + real tax added; new `Money/PreSaleConversionTest` green; all Money + Module12 + Module21 green.

**Auditor verdict:** ✅ **VERIFIED** (2026-06-20, re-read of `convertToSale()` L433-466 + cross-checked against the authoritative sale path).

- **COGS leg present & balanced:** all four legs in ONE `createEntry()` — DR 1200 = invoiceTotal, CR 4000 = **netSales** (pre-tax), CR 2200 = totalTax (when >0), DR 5000 / CR 1100 = totalCogs (when >0). Debits (invoiceTotal+totalCogs) == credits (netSales+totalTax+totalCogs), since netSales+totalTax==invoiceTotal. ✔
- **`$totalCogs` accumulates across all lines** including the backorder static-cost fallback. ✔
- **Tax convention MATCHES the real sale path** (the part I said I'd scrutinize hardest): `SaleService::post()` L205-217 uses the identical accounts — 4000 @ netSales, 5000/1100 COGS, 2200 tax. No freelanced convention. ✔
- Revenue is now recognised NET of tax (was gross before) — consistent with `SaleService` and with the M1-02 report math. ✔

**Test honesty:** `PreSaleConversionTest` asserts the DR 5000 == 500 / CR 1100 == 500 legs via `assertJournalEntry`, trial balance zero, and `getGrossProfitByProduct` COGS == 500 (not 0). The IDE's test edits were array-key corrections (`->cogs` → `['cogs']`), not assertion weakenings. ✔

**M1-05 signed off. Pre-sale conversion now posts cost + tax correctly; Balance Sheet, P&L, and item-wise profit agree.**

---

### ENTRY M1-06 — Tax computed AFTER order-level discount (F7)
**Status:** 📨 INSTRUCTION ISSUED → awaiting IDE
**Finding:** F7 (Critical) — tax is charged on the item-net BEFORE the order-level (global/invoice) discount is subtracted, so taxable customers are overcharged tax and the tax-liability account is overstated.

**Auditor pre-read (2026-06-20) — bug is enshrined in the existing test, `Module04/PaymentProcessingTest.php` L306-385:**
- Scenario: price 500 × qty 2 = 1000 gross; item discount 50 → item-net 950; **global discount 100**; tax 10%.
- Current (WRONG) math: tax = 950 × 10% = **95**; net_sales = 1000−50−100 = 850; invoice = 850+95 = **945**.
- The bug: tax is on 950 but the customer only pays for 850 of value. **Correct:** tax base = net AFTER order discount = 850 → tax = **85** → invoice = 850+85 = **935**. Customer overcharged Rs 10 tax per discounted invoice; 2200 liability overstated.
- The legacy `SaleController` sale-store path computes the waterfall in the wrong order; the V3 `SaleService` (L105-149) applies only item-level discount and has no order-level discount term, so the primary fix is the legacy store path that the Module04 test exercises (`POST /s/{slug}/sales`).
- **The test itself currently asserts the buggy values (tax 95 / total 945) and MUST be corrected to the right ones (tax 85 / total 935) as part of this item.**

**Instruction given to IDE:** issued 2026-06-20 (verbatim in assistant message). NOTE: my instruction said credit tax to `2200` — that was MY error.

**IDE result:** 2-pass waterfall implemented; Module04 waterfall test corrected to 85/935; new `Money/TaxAfterDiscountTest` green; all Money + Module04 (8) green. IDE **overrode my `2200` and used `2100`**, justifying it against the seeder.

**Auditor verdict:** ✅ **VERIFIED** (2026-06-20, re-read of `SaleController::store()` L64-138 + seeder + new test).

- **2-pass waterfall correct:** Pass 1 gathers per-line net (tax_amt=0); Pass 2 apportions global discount proportionally by each line's net, taxes the reduced base, rounds per-line BEFORE summing. `netSales = gross − item_disc − global_disc` (L136). Collapses to 850×10%=85 single-rate, stays correct multi-rate. ✔
- **Test correction is honest:** Module04 waterfall now expects tax 85 / total 935 (was 95/945); only those two numbers + amount_paid changed. New `TaxAfterDiscountTest` asserts net 50 / tax 5 / invoice 55, CR 2100 = 5, CR 4000 = 50, DR 1000 = 55, trial balance zero. ✔
- **The IDE was RIGHT to override my account code.** Seeder L47-48: `2100 = Sales Tax Payable`, `2200 = Loans Payable`. My instruction's `2200` was wrong (carried over from M1-05 context). The IDE caught it, verified against the seeder, used `2100`. Good independent judgment — and a reminder to verify my own instructions, not just the IDE's output. ✔

**⚠️ REGRESSION FOUND IN ALREADY-VERIFIED M1-05 (honest self-correction):**
While confirming the account codes, I found that **M1-05 (`SalesOrderController::convertToSale`) and `SaleService::post()` credit sales tax to `2200` (Loans Payable), NOT `2100` (Sales Tax Payable).** The entries still BALANCE (which is why M1-05 passed and the V3 SettlementAndReportService tax test passed), but the tax is posted to the WRONG liability account — it would inflate Loans Payable and understate the tax liability on any taxable sale through the V3 path or a pre-sale conversion. I missed this on the M1-05 sign-off because I checked balance, not account classification. **This is a real defect.** Logged as **M1-06b** below; must be fixed before Sellable.

**M1-06 signed off** (SaleController store path now taxes after discount, correct 2100 account).

---

### ENTRY M1-06b — Sales tax posted to wrong account (2200 Loans Payable) in V3 sale + pre-sale conversion
**Status:** ⬜ TODO → instruction next (this turn).
**Finding:** Discovered during M1-06 verification. `SaleService::post()` (L213) and `SalesOrderController::convertToSale()` (L447) credit tax to `2200` = **Loans Payable**, not `2100` = **Sales Tax Payable** (seeder L47-48). Books balance but tax liability is misclassified.
**Acceptance test:** a taxable V3 sale AND a taxable pre-sale conversion both credit `2100` (not 2200); update `PreSaleConversionTest` to assert 2100; trial balance stays zero.

**Instruction given to IDE:** issued 2026-06-20 (verbatim).

**IDE result:** Fixed the two write paths AND found two READ paths (TaxService, ReportService) were reading tax from 2200 too — fixed all four; corrected 3 tests; all green. Full 2200 audit delivered.

**Auditor verdict:** ✅ **VERIFIED** (2026-06-20, grep of all `2200` in app/ + re-read of 4 prod files + test corrections).

- **Zero live `2200` tax usages remain** — every `2200` in app/ is now an explanatory comment. ✔
- Writes fixed: `SaleService` L213 → 2100; `SalesOrderController` L447 → 2100. ✔
- **Deeper find (bigger than I scoped):** `TaxService` L93 and `ReportService` L765 were READING tax from 2200 — so the tax REPORT was reading Loans Payable and would show wrong tax-collected even on a correctly-posted sale. Both fixed to read 2100. The IDE caught that write AND read pointed at the wrong account; now consistent on 2100. Good catch I'd under-scoped. ✔
- Tests corrected, not weakened: `PreSaleConversionTest` asserts 2100; `TaxAndUomServiceTest` seeds/asserts 2100 (method renamed to `..._2100_and_2300_breakdown`), `2300` Input Tax Recoverable correctly left untouched; `Module12/ReportsTest` injects to 2100. ✔
- `2200` legitimately remains as **Loans Payable** in the seeder (L48) and as an unrelated PKR amount in a demo seeder. ✔

**M1-06b signed off. Sales tax now posts AND reports on 2100 across all paths. This also retroactively hardens M1-05 (which I had signed off on balance alone — lesson logged: verify account classification, not just balance).**

---

### ENTRY M1-07 — `sale_items.quantity` → DECIMAL(12,4) (fractional quantity) (NEXT)
**Status:** ⬜ BLOCKED by Tester-Fix-0 (harness must move to MySQL first).
**Finding:** F9 (Critical) — quantity stored as integer truncates fractional sales (2.5kg → 2 or 3).
**Pre-req:** Tester-Fix-0 — move test harness from SQLite `:memory:` to MySQL `amd_pos_test`, because SQLite is typeless and would falsely pass a fractional test that MySQL's integer column fails.
**Acceptance test:** sell 2.5 units → `sale_items.quantity == 2.5` == `Σ qty_deducted`; must run on MySQL.

**Auditor pre-read (2026-06-20):** confirmed `sale_items.quantity` is `integer` (migration `2026_01_02_000003` L15) and `free_quantity` is `integer` (`2026_01_14_214205` L14). On MySQL these TRUNCATE fractional sales — selling 2.5 kg stores 2 or 3. (`returned_quantity` is already `decimal(12,4)` from M1-01, so target type is consistent.) This is the bug that SQLite hid; now testable on MySQL.

**Instruction given to IDE:** issued 2026-06-20 (verbatim).

**IDE result:** Migration to decimal(12,4) run on MySQL; SHOW COLUMNS proof given; SaleItem casts → decimal:4; write-path (int) audit done; new `FractionalQtyTest` green on MySQL; Money suite green.

**Auditor verdict:** ✅ **VERIFIED** (2026-06-20, re-read of migration + the flagged (int) cast + test, on MySQL harness).

- **Migration correct:** `quantity` and `free_quantity` → `decimal(12,4)` via `->change()`, integer rollback in down(). SHOW COLUMNS confirms `decimal(12,4)` on amd_pos_test. ✔
- **The one `(int) ceil()` cast (SaleController L188) is SAFE:** guarded by `if (!$product->track_serial) continue;` (L186) — runs ONLY for serial-tracked items, where fractional qty is impossible by definition (can't sell half a serial). Does NOT touch the normal fractional write path. Correctly flagged by IDE, guard verified by me. ✔
- **Normal write path reads `(float)$item['quantity']`**; FifoService deducts float `$take` with no int coercion. ✔
- SaleItem casts `quantity`/`free_quantity` → `decimal:4`, consistent with `returned_quantity`. ✔
- **Test honesty / MySQL value:** `FractionalQtyTest` asserts sale_items.quantity == 2.5, Σ qty_deducted == 2.5, batch remaining == 7.5, trial balance zero. This test would FALSELY pass on SQLite even with an int column — passing on MySQL (where int would truncate to 2/3) is REAL proof. This is exactly why Tester-Fix-0 came first. ✔

**Follow-up noted (not blocking):** if purchase_items / stock_movements store qty as integer and fractional purchases/movements are possible, they'd truncate too — candidate M1-07b for M2. (IDE to confirm those column types.)

**M1-07 signed off. Fractional quantities (2.5 kg etc.) now persist exactly end-to-end, proven on MySQL.**

---

### ENTRY M1-10 — Supplier party-statement sign (credit-normal AP) (F8)
**Status:** 📨 INSTRUCTION ISSUED → awaiting IDE
**Finding:** F8 (Critical-ish) — supplier statement shows payable with the WRONG SIGN.

**Auditor pre-read (2026-06-20), `ReportController::partyStatement()` L485-498:**
- Running balance uses `+= ($r->debit - $r->credit)` (L487) — the **debit-normal** formula, correct for customers (AR 1200). For a **supplier** (AP 2000, credit-normal), a 45,000 credit purchase posts a CREDIT to AP, so debit−credit = −45,000 → statement shows **−45,000** instead of **+45,000 payable**. Opening balance (computed just above) has the same sign issue.
- Fix: when the party is a supplier (account is credit-normal / code 2000), balance must be `credit − debit`. Customers stay `debit − credit`.

**Instruction given to IDE:** issued 2026-06-20 (verbatim).

**IDE result:** Sign flip keyed off party type; new `SupplierStatementTest` (supplier +45k, customer +10k) green on MySQL; Module12 12/12; Money M1-01..M1-10 green.

**Auditor verdict:** ✅ **VERIFIED** (2026-06-20, re-read of `partyStatement()` L444-499 + test route).

- `$isCreditNormal = ($party && $party->type === 'supplier')` (L465). Opening balance flipped for suppliers `credit − debit` (L466-468); running delta flipped per-row (L490). ✔
- **Customer behavior untouched** — still `debit − credit` (debit-normal AR). Raw debit/credit display values unchanged; only the running/closing `balance` respects normal side. ✔
- **Test honesty:** supplier case posts a REAL credit purchase via `/s/{slug}/v3/purchases` (not a fabricated journal) → AP 2000 credited → statement asserts **+45,000** (was −45,000). Customer case posts a real credit sale → **+10,000** receivable, proving no regression. Both assert trial balance zero. Genuine end-to-end. ✔

**M1-10 signed off. Supplier statements now show payables as positive; customer receivables unchanged.**

---

### ENTRY M1-09 — POS open-return: sign + warehouse + idempotency (F6)
**Status:** 📨 INSTRUCTION ISSUED → awaiting IDE
**Finding:** F6 (Critical) — POS open-return inflates revenue, restores to wrong warehouse, not idempotent.

**Auditor pre-read (2026-06-20), `PosReturnController::store()` L18-100+:**
- **Inflates revenue:** return stored as a `Sale` with `status='returned'` but `net_sales = +$returnTotal` (L54, POSITIVE). After M1-02, `getGrossProfitByProduct`/P&L include `status='returned'` → this positive net_sales is COUNTED AS REVENUE. An open-return ADDS revenue instead of subtracting it. CRITICAL ghost revenue.
- **Wrong warehouse:** stock restored to an arbitrary `limit(1)` stock row (L73-77) and FIFO `receiveBatch` warehouse picked via `->value('warehouse_id')` from ANY row for the product (L81) — not the originating warehouse.
- **No idempotency:** double-submit creates two returns / double refund (uniqid ref, no lock/dedupe).

**Instruction given to IDE:** issued 2026-06-20 (verbatim).

**IDE result:** All 3 sub-bugs fixed; new `PosOpenReturnTest` (3 cases) green on MySQL; Money 12/12, Module12/15/21 green.

**Auditor verdict:** ✅ **VERIFIED** (2026-06-20, re-read of `PosReturnController::store()` + the report-interaction test).

- **Revenue netting (the critical one) PROVEN:** Sale + SaleItem monetary cols stored NEGATIVE (L77-82, L94-96), quantity positive (L92). In `getGrossProfitByProduct` the kept-fraction is 1 (returned_quantity=0), so negative net_amount SUBTRACTS. Test asserts: sell 1@100 → net_revenue 100; open-return 1@100 → net_revenue **0.00**, cogs 0.00, trial balance zero. The return CANCELS revenue, doesn't add it. ✔ (This was the worst F6 bug, made worse by M1-02 including 'returned' — now correct.)
- **Warehouse:** `warehouse_id` required+validated (L25); stock restored scoped to (product, warehouse, tenant) (L100-109); receiveBatch uses the specified warehouse. Test 2 asserts W2 +qty, W1 unchanged. ✔
- **Idempotency:** `idempotency_key` required (L26); `Cache::lock("pos-return-lock-...")->block(5)` (L35-38) + journal-key dedupe returning the existing sale (L41-57). Test 3 asserts double-submit → one refund. ✔
- Test is honest end-to-end (real sale baseline, real `/pos/return` POST, asserts the actual report number drops). Not weakened. ✔

**M1-09 signed off. POS open-returns reduce revenue, restore to the right warehouse, and can't double-refund.**

---

### ENTRY M1-EX1 — Read/GET must not be 403-blocked when transaction limit is hit
**Status:** 📨 INSTRUCTION ISSUED → awaiting IDE
**Finding:** MySQL run — `CodeStackingTest::read_access_is_never_blocked_at_limit` fails (403 on a GET when over tx limit). Reads must always be allowed; only writes blocked.

**Auditor pre-read (2026-06-20):**
- `SubscriptionLifecycleMiddleware` L21-26 ALREADY allows GET/HEAD in view-only mode — so the read-block is NOT from here.
- The 403-on-read therefore comes from a DIFFERENT mechanism (the transactions_per_month limit enforcement — likely PlanLimitsEnforcer / a check on the sales/index route), which the IDE's earlier triage imprecisely attributed to TenantMiddleware. **The exact 403 source must be located first.**
- Instruction tells the IDE to find the precise source, report it, then allow reads there.

**Instruction given to IDE:** issued 2026-06-20 (verbatim).

**IDE result:** Found the real source was NOT a limit-block but a membership-memoization bug; fixed it; CodeStacking 13/13, PlanLimitsEnforcer 3/3, Money 12/12 green. Added companion write-still-blocked assertion.

**Auditor verdict:** ✅ **VERIFIED** (2026-06-20, re-read of User.php memo fix + CheckPermissions + the companion test).

- **Real root cause (deeper than scoped):** `User::getActiveMembership()` was called early by `HandleInertiaRequests` BEFORE tenant context bound → cached a `null` membership with `membershipResolved=true` → every later call returned stale null → permissions resolved empty → **403 on reads**. Fix (User.php L239-246): invalidate the memo when the bound tenant ≠ the cached membership's tenant, forcing re-resolution in correct tenant context. This was an app-wide intermittent-permission bug, not just a limit issue. ✔
- **Reads open, WRITES STILL BLOCKED (my chief worry — explicitly tested):** companion assertion (CodeStackingTest L565-609) posts a new sale while over limit and asserts **403 + `{type:'plan_limit', feature:'transactions_per_month'}`**. So the fix didn't open a write hole. ✔
- `SubscriptionLifecycleMiddleware` L24 now allows GET/HEAD/OPTIONS via `in_array` (reads safe in view-only). ✔
- **CheckPermissions NOT weakened:** still requires a granular permission match, aborts 403 otherwise (L60-75). Tenant isolation preserved — the fix makes membership resolution tenant-AWARE, not looser (no regression to M1-03). ✔

**Note:** the memo fix touched core auth resolution (User, CheckPermissions, TenantMiddleware). Money suite + CodeStacking + PlanLimitsEnforcer green confirm no permission/isolation regression. Worth a broad regression on next full run to be thorough.

**M1-EX1 signed off. Reads are never blocked at the tx limit; writes still are; a latent app-wide stale-membership permission bug was fixed as a bonus.**

---

### ENTRY M1-08 — Core composite indexes (F11)
**Status:** 📨 INSTRUCTION ISSUED → awaiting IDE
**Finding:** F11 — `->index(` = 0 across 224 migrations. Every report/dashboard is a full table scan + filesort; dies between 100K–1M rows.

**Audit's exact index list (Forensic Audit L213):**
`sales(tenant_id, posted_at)`, `sales(tenant_id, status)`, `sale_items(tenant_id, sale_id)`, `sale_items(product_id)`, `journal_items(account_id)`, `journal_entries(tenant_id, date, is_reversed)`, `stocks(tenant_id, product_id, warehouse_id)`, `inventory_batches(tenant_id, product_id, warehouse_id, created_at)`.

**Instruction given to IDE:** issued 2026-06-20 (verbatim).

**IDE result:** Added 2 genuinely-missing indexes, skipped the rest as already-covered; SHOW INDEX + EXPLAIN proof; migrate/rollback clean; 72 tests green.

**Auditor verdict:** ✅ **VERIFIED** (2026-06-20, re-read of migration + SHOW INDEX/EXPLAIN proof).

- **IMPORTANT correction to the audit:** F11's "zero indexes across 224 migrations" was **STALE**. A prior migration `2026_04_16_210000_add_multi_tenant_performance_indexes.php` already added many (`idx_sales_tenant_created_at`, `idx_sales_tenant_party`, `idx_je_tenant_reversed`, etc.). F11 was largely already fixed.
- M1-08 added the 2 genuinely-missing composite indexes: `idx_sales_tenant_posted (tenant_id, posted_at)` and `idx_je_tenant_date_rev (tenant_id, date, is_reversed)`. SHOW INDEX confirms both exist; EXPLAIN shows `type: range, key: idx_sales_tenant_posted`. ✔
- The migration is defensively idempotent: every add guarded by `hasIndex`/`hasColumns`/`hasEquivalentIndex`. The `hasEquivalentIndex()` helper checks column-PREFIX equivalence (correct way to detect redundancy) — it skipped sale_items/journal_items/stocks indexes that were already covered, which is RIGHT, not a lazy skip. `down()` careful. ✔
- 72 tests green (Money 12, Module04 8, Module12 12, Module15 6, Module21 34) — indexes changed speed, not results. ✔

**M1-08 signed off. The 2 missing hot-path indexes added; F11 largely pre-resolved. THIS COMPLETES THE PURE-CODE TRACK for M1.**

---

### ENTRY M1-11 (List A / A2) — WooCommerce off all tiers + Cookbook enforce
**Status:** 📨 INSTRUCTION ISSUED → awaiting IDE
**Finding:** NP-1/NP-2.

**Auditor pre-read (2026-06-20) — current real state (differs from plan's notes):**
- **WooCommerce: gap is REAL.** `PlanFeatureMatrixSeeder.php` L173-176: `woocommerce`, `woocommerce_customer_reg`, `woocommerce_stock_sync`, `woocommerce_orders_bridge` are all still `growth => '1', business => '1'` (trial/starter '0'). Must be '0' on ALL tiers.
- **Cookbook: BETTER than plan assumed.** `CookbookController` already has `PlanGate::check('bill_of_materials')` on 8 actions (L19/63/99/127/186/246/327+). Remaining: it uses `check()`+manual abort rather than `enforce()`, and need to confirm EVERY write action (store/update/destroy) is covered + the right feature key.

**Instruction given to IDE:** issued 2026-06-20 (verbatim).

**IDE result:** Woo '0' on all tiers + re-seeded; WooConnectionController gated via HasMiddleware enforce('woocommerce'); Cookbook enforce() on all 7 methods; new GatingTest green; RegressionFixes 15/15, Money 15/15.

**Auditor verdict:** ✅ **VERIFIED** (2026-06-20, re-read of seeder + controller middleware + Cookbook + GatingTest on MySQL).

- **WooCommerce off all tiers:** seeder L173-176 all four woo keys `'0'` for trial/starter/growth/business. Re-seeded (test re-seeds the real PlanFeatureMatrixSeeder, proving runtime value). ✔
- **Woo URL-blocked, not just hidden:** `WooConnectionController implements HasMiddleware` → `PlanGate::enforce('woocommerce')` before every action (L20-30). Test asserts real 403 on GET `/woo/connections` for BOTH Growth and Business. ✔
- **Cookbook enforce() on ALL 7 methods:** simulate/index/create/store/edit/update/destroy (L19/61/95/121/178/236/315). Switched from check()+manual-abort to standard enforce() convention. Every write action covered. ✔
- **Tested both directions:** Starter → 403 on store/update/destroy; BOM-enabled plan → can create (positive case, not over-blocking). ✔
- IDE also set `config/plans.php` (AppSumo LTD fallback) to disable woo — consistent with the seeder (belt-and-suspenders), not a conflict. ✔
- Test honest: beforeEach flushes cache + re-seeds real seeder; assertions are real 403s. ✔

**M1-11 signed off. WooCommerce is fully off (UI + URL) on every tier; Cookbook is gated on every action via enforce().**

---

### ENTRY F17 (List A / A3) — RE-VALIDATION: tx-limit enforcement on the live sale path
**Status:** 📨 INSTRUCTION ISSUED → awaiting IDE. **VERDICT OF RE-CHECK: F17 is a REAL gap (true positive), unlike F11.**

**Auditor re-validation (2026-06-20) — the honest split result:**
- `V3/SaleController::store` L29-34 **DOES enforce** `transactions_per_month` (counts posted sales, `PlanGate::enforce`). So enforcement EXISTS on V3 — my audit's blanket "not enforced" was imprecise.
- **BUT legacy `SaleController::store` has ZERO `transactions_per_month` enforcement** (grep = no matches).
- **The PRIMARY live route `POST /sales` (name `sales.store`, routes/web.php L1101) points at the LEGACY controller** — the unenforced one. (The L160 comment claiming "POS sales go through V3" is INACCURATE.) Our money tests POST here; the M1-06 tax fix lives here.
- **Conclusion:** a tenant CAN exceed their monthly transaction limit via the legacy `/sales` route. F17 is a genuine gap — opposite of F11 (which was a false alarm). Re-validation earns its keep both ways.

**Instruction given to IDE:** issued 2026-06-20 (verbatim) — add `transactions_per_month` enforcement to legacy `SaleController::store`, matching the V3 convention.

**IDE result:** Added enforcement to legacy store(); fixed L160 comment; 2 new F17 tests + Money suite green.

**Auditor verdict:** ✅ **VERIFIED** (2026-06-20). `SaleController::store` L37-41: counts month's posted sales (per-tenant via Sale model's global scope) and `PlanGate::enforce('transactions_per_month', $monthlyCount)` BEFORE validation/transaction — no partial sale on rejection. Matches V3 byte-for-byte. Tests: over-limit /sales → 403; under-limit → 200 (no over-block). Money suite stays green (waterfall test posts to /sales under limit, passes). ✔

**F17 signed off. The legacy /sales route now enforces the monthly transaction limit; the bypass is closed.**

---

### ENTRY M1-UI1 — Sidebar feature-locks were HARDCODED (Business showed locks for owned features)
**Status:** ✅ VERIFIED
**Finding:** User-reported live bug — a Business store saw 🔒 + "Upgrade to Growth" on Production/Cookbook/E-Invoicing/etc. that the plan actually includes.

**Root cause (confirmed by auditor):** `OneGlanceLayout.jsx` hardcoded `locked: true` on those menu items (static, never read the plan). AND `Tenant::featuresArray()` only exposed 4 flags — the gated features weren't even sent to the frontend. (Backend gating itself was correct — seeder + config both grant Business these features.)

**Fix verified:**
- `Tenant::featuresArray()` L279-289 now exposes production, bill_of_materials, e_invoicing, invoice_reminders, recurring_invoices, bank_reconciliation, marketing, growth_engine via `(bool)$this->getLimit(...)` — same source PlanGate uses. ✔
- `OneGlanceLayout.jsx` L353-376: every hardcoded `locked: true` replaced with `locked: !store?.features?.<key>`. So Business → unlocked, Starter → locked. The hardcoding is GONE. ✔
- `Tenant::effectivePlan()` added to resolve the `ltd → ltd_3` collapse (the secondary issue suspected). ✔
- Backend test asserts featuresArray returns correct per-plan flags (business=true, starter=false). ✔
- **Minor note (not a bug):** `recurring_invoices` gates on `invoice_reminders` key, `fund_management` on `bank_reconciliation` key — intentional grouping; confirm desired.

**M1-UI1 signed off. Locks are now data-driven; a Business customer sees what they paid for.**

**M1-UI1 FOLLOW-UP (2026-06-20) — second-pass fix after user reported Business STILL showed some locks:**
- **Diagnostic proved the real root cause:** the `business` plan rows were NOT seeded in the DB → `PlanRepository::getEffectiveLimit` returned null → `getLimit` returned null → `featuresArray` did `(bool)null = false` → LOCKED. (Cookbook happened to resolve true; Production/E-Invoicing/Invoice-Reminders resolved null → locked. That's the asymmetry the user saw.)
- **Fix part 1:** re-ran `PlanFeatureMatrixSeeder` so `business` rows exist.
- **Fix part 2:** `featuresArray()` L279-289 changed from `(bool)getLimit(...)` to `getLimit(...) !== false`, so null/unlimited/true/'1' = enabled, only explicit false/'0' = disabled. Verified L274-290.
- **Verified NO over-unlock:** GatingTest L207-223 asserts BOTH directions — Business `production/bom/e_invoicing/invoice_reminders` = true AND Starter = false. The `!== false` logic is safe because every key is explicitly seeded '0' for Starter (resolves false). ✔
- `recurring_invoices`/`fund_management` correctly map to real keys (`invoice_reminders`/`bank_reconciliation`), so they inherit correct per-plan values. ✔
- **Crash fix verified:** `TodaysOpportunities.jsx` L133-136 `if (!data) return null;` — clean, mirrors the forbidden guard. Build clean. ✔

**⚠️ RESIDUAL (logged, not blocking):** `!== false` is FAIL-OPEN — any FUTURE feature key missing from the seeder defaults to UNLOCKED. Safe today (all current keys explicitly seeded), but a latent footgun. Consider fail-closed (`=== true || === '1' || === null-only-for-truly-unlimited`) in an M2 hardening pass. Also: the console errors the user saw (`@vitejs/plugin-react preamble`, `step:1 404`) are DEV-SERVER/HMR noise (browser on :5173 Vite dev server), NOT app bugs — not chased.

**M1-UI1 fully resolved and verified end-to-end.**

---

---

### ENTRY A4 — Store name / currency symbol silently fail to save
**Status:** ✅ VERIFIED
**Finding:** `SettingsController::update()` validate() whitelist omitted `store_name`/`currency_symbol`; Laravel's validate() strips undeclared keys, so the sync code (L45-52) never saw them → silent data loss.

**Fix verified:** L29-30 add `settings.store_name` (max:255) + `settings.currency_symbol` (max:10, matches verified varchar(10) column). Sync logic unchanged (it was correct, just starved of data). Tests: `store_name_update_reflects_on_dashboard` now GREEN (this was the user's earlier complaint — same bug), plus new A4 persistence tests; Money suite green. ✔

**A4 also resolves the user's earlier "store name won't update on dashboard" report.**

---

### ⚠️ ENTRY A4b — TWELVE MORE settings keys silently dropped (NEW finding, escalated)
**Status:** 📨 INSTRUCTION ISSUED → awaiting IDE. **Severity: HIGH (silent data loss + security).**
**Finding:** A4's audit found the SAME silent-drop bug on 12 more keys sent by `SettingsPanel.jsx` but missing validation rules — so they DON'T persist despite "saved successfully":
`pos_auto_fill_cash, senior_mode, fbr_integration, show_margin_percentage, stop_sale_negative_stock, round_off_total, default_tax_rate, store_address, store_phone, product_cost_update_policy, enable_passcode, admin_passcode`.
**Most concerning:** `default_tax_rate` (tax!), `round_off_total`, `store_address`/`store_phone` (on invoices), and `enable_passcode`/`admin_passcode` (SECURITY settings that don't persist).
**Caveat:** some may be handled via a DIFFERENT path (e.g. `stop_sale_negative_stock` — its toggle test passes). Fix must VERIFY drop-vs-handled-elsewhere per key, not blindly whitelist.

**Instruction given to IDE:** issued 2026-06-20 (verbatim).

**IDE result:** Diagnostic table confirmed all 12 genuinely dropped; added type-appropriate rules; SettingsTest + Money + Gating green.

**Auditor verdict:** ✅ **VERIFIED** (2026-06-20, re-read of validate() rules + how admin_passcode is consumed).

- All 12 keys now whitelisted with TYPE-APPROPRIATE rules (L23-48): booleans `in:0,1`, `default_tax_rate` `numeric|min:0|max:100`, `product_cost_update_policy` proper enum, `store_address` max:500, `store_phone` max:30, `admin_passcode` digits-only max:6. Not a blanket string. ✔
- Persistence now real: tax rate, rounding, address/phone, toggles all save. `tax_rate_setting_applies_to_new_sales` stays green (the persisted value flows through). ✔
- **admin_passcode plaintext concern — investigated, NOT a regression:** `SystemResetController` L38/L60 already compares `$input === $passcode` (PLAINTEXT) — so storing it as a plain Setting row is CONSISTENT with the existing consumer. The IDE matched existing behavior, didn't break anything. ✔

**🔒 SECURITY FINDING ESCALATED (pre-existing, NOT introduced by A4b) → logged as SEC-1:**
`admin_passcode` gates FACTORY RESET / data-wipe (SystemResetController) yet is stored AND compared in PLAINTEXT (Setting row + `===`). A leaked DB backup / SQLi / insider reads the master reset passcode in the clear. This is a real weakness in the EXISTING design (the app has a proper hashed `security_pin` system it should use instead). **A4b is correct as scoped; SEC-1 is a separate hardening item for the M2/M3 security pass (M3-04). Must NOT be lost.**

**A4b signed off (settings persist). SEC-1 carried forward to the security hardening pass.**

---

### ENTRY B5 — Unify passcode system; stock-adjust PIN; kill hardcoded 123456
**Status:** ✅ VERIFIED
**Finding:** parking-lot — hardcoded stock-adjust passcode; passcode systems not unified.

**Auditor verdict:** ✅ **VERIFIED** (2026-06-21, re-read of stock-adjust guard + security_pin write paths + $fillable safety).

- **Hardcode already gone:** `GlobalProviderLayout.jsx` L34 `admin_passcode:'123456'` commented out. Remaining `123456` = demo seeders / placeholder phones / FbrService POS-ID default — all NON-passcode, confirmed harmless. ✔
- **All sensitive actions use ONE canonical hashed `security_pin`:** Fund (add/remove/transfer), PartyController::bulkDestroy, ProfileSecurity, and NOW stock-adjust — all `Hash::check($request->passcode, $membership->security_pin)`. Landscape table complete. ✔
- **Stock-adjust guard correct:** `V3\StockAdjustmentController::store` L27-44 — requires passcode ONLY when `enable_passcode='1'`, validates 6-digit, `Hash::check` vs acting membership's security_pin, 403 on mismatch (JSON+redirect), BEFORE the mutation. Mirrors FundController byte-for-byte. Same added to legacy `StockOperationsController::adjust`. ✔
- **`$fillable` security_pin addition — VERIFIED SAFE (I checked the mass-assign risk):** every `security_pin` WRITE is a controlled `Hash::make(...)` on a validated field for the acting user's OWN membership (ProfileSecurityController L38, PlatformOwnerAuth L192). NO `update($request->all())` path exists. `pos_pin` (also hashed) was ALREADY fillable — same precedent. Both `$hidden`. The fillable change was REQUIRED for Eloquent to persist the PIN (that's why the test failed until added). Not a vulnerability. ✔
- Tests: new `manual stock adjustment requires correct passcode when enable_passcode enabled` (403 wrong / success right); Fund/Legacy passcode tests + Gating + Inventory stay green. ✔

**⚠️ OPERATIONAL NOTE (not blocking):** IDE ran `migrate:fresh` on the test DB and committed+pushed to `dev` mid-session. migrate:fresh on amd_pos_test is fine (throwaway), but CONFIRM it never touched venqore_pos (production). The auto-push to dev is the IDE's workflow — verify the dev branch is intended for this.

**B5 signed off. One hashed security_pin governs every sensitive action; stock adjustment is now PIN-gated; no live hardcoded passcode.**

---

### ENTRY B7 — Fractional quantity on adjacent paths (pre-sales, transfers, proposals, variant stock)
**Status:** ✅ VERIFIED
**Finding:** integer quantity columns truncate fractional qty on paths M1-07 didn't cover.

**Auditor verdict:** ✅ **VERIFIED** (2026-06-21, re-read of migration + casts + test on MySQL).

- **Scope was bigger than the plan's 2 tables — 5 columns found integer & fixed:** `product_variants.stock`, `proposal_items.quantity`, `sales_order_items.quantity_requested` + `quantity_reserved`, `stock_transfer_items.quantity`. All → `decimal(12,4)` (matches sale_items). ✔
- **Migration clean:** every column guarded by hasTable/hasColumn; integer rollback in down(); does NOT touch sale_items (M1-07's rollback untouched). Including `quantity_reserved` was correct (sibling fractional qty, same bug). ✔
- **Casts aligned:** ProductVariant/ProposalItem/SalesOrderItem/StockTransferItem → decimal:4. ✔
- **Real write-path truncation fixed:** `ProductVariantController` validation `stock_quantity` changed `integer`→`numeric` so fractional variant stock can be entered. (Schema fix alone wouldn't have closed this.) ✔
- **Test is genuine:** `FractionalQtyAdjacentTest` creates SalesOrderItem qty 2.5, asserts BOTH the Eloquent read AND the direct `DB::table()->value()` == 2.5 — proving it persists to MySQL uncut (an int column would've failed). + a stock-transfer 2.5 case. M1-07 FractionalQtyTest stays green. ✔
- **IDE respected no-git rule** — only ran `git status` (read-only); left commits to user. ✔

**B7 signed off. Fractional quantities now persist on pre-sales, transfers, proposals, and variant stock — proven on MySQL.**

**Files changed (for user to review + commit):** migration `2026_06_21_103702_...`, ProductVariant/ProposalItem/SalesOrderItem/StockTransferItem models, ProductVariantController, FractionalQtyAdjacentTest.

---

### ENTRY B4 — Sale header invariant (subtotal − discounts == net_sales) + FOUND a real bug
**Status:** ✅ VERIFIED
**Finding:** invariant guardrail — AND the property test surfaced a genuine legacy data-loss bug.

**Auditor verdict:** ✅ **VERIFIED** (2026-06-21, re-read of the fix + checked no reader was disturbed).

- **The test found a REAL bug (its whole purpose):** legacy `SaleController::store()` COMPUTED `subtotal_gross`, `total_item_discounts`, `global_discount` but never WROTE them to `Sale::create()` → they sat at `0.0000` on every legacy sale. Fixed: L238-240 now persist all three.
- **Fix verified SAFE — no reader disturbed (I checked):** grep shows these 3 columns are only ever WRITTEN (SmartCapture TransactionBuilder, V3 SaleService), never READ for a calculation. Profit reports (M1-02) read sale_items.net_amount/returned_quantity, NOT these header cols. So populating them with real values (vs 0) changes NO report output. ✔
- **Legacy/V3 split again:** V3 SaleService L287-288 ALREADY wrote these correctly; only the legacy path was broken. (C5 consolidation will eventually kill this duality.)
- **Test is genuine:** 40 randomized iterations / 240 assertions; invariants A (waterfall), B (net+tax==invoice), C (non-negativity), D (journal balances) to 2dp w/ epsilon. Found the bug, reported the cause, did NOT weaken the invariant. No rounding drift found. ✔
- IDE respected no-git (only `git status`). ✔

**B4 signed off. Header waterfall now fully persists on the legacy path; a permanent randomized invariant test guards it forever.**

**Files changed (user to review + commit):** SaleController.php, SaleHeaderInvariantTest.php.

---

### ENTRY B2 — Tenant timezone on dashboard/date filters (F10)
**Status:** ✅ VERIFIED
**Finding:** F10 — date filters used server UTC, not tenant tz → "today's revenue" wrong for non-UTC shops.

**Auditor verdict:** ✅ **VERIFIED** (2026-06-21, re-read of the conversion + both-direction test).

- **Conversion is CORRECT (the easy-to-reverse part):** `SaleController::dashboard` L407-419 resolves `$tz` from tenant, then `Carbon::today($tz)->startOfDay()->utc()` → tenant-local midnight converted to its UTC instant; `whereBetween('created_at', [start,end])` replaces `whereDate(today())`. Same correct pattern for yesterday / month / last-month / 30-day. Applied to the right side. ✔
- **Test proves BOTH directions (not a +5 hardcode):** Karachi tenant — a sale at 21:30 UTC (02:30 Karachi today) IS counted in today's revenue (==100). UTC tenant — the SAME 21:30-UTC sale is NOT counted today (no regression). Uses `Carbon::setTestNow()` to fix the clock (correct technique), cleans up after. ✔
- All 6 dashboard date-filter sites converted (inventory table in IDE summary). JSON-response addition to dashboard() is contained + enables the test to read `stats.sales_today`. ✔
- Dashboard "today" now matches the daily report for any timezone. Money + Fractional tests stay green. IDE respected no-git. ✔

**B2 signed off. Every non-UTC shop (i.e. every Pakistani customer) now sees correct tenant-local 'today'; dashboard agrees with daily report.**

**Files changed (user to review + commit):** SaleController.php, TenantTimezoneTest.php.

---

### ENTRY B3 — De-N+1 reports + fix low-stock warehouse filter (F12)
**Status:** ✅ VERIFIED
**Finding:** F12 — low-stock ignored warehouse filter (correctness) + N+1 queries on heavy reports (perf).

**Auditor verdict:** ✅ **VERIFIED** (2026-06-21, re-read of all 4 refactors + verified money semantics unchanged).

- **Low-stock WAREHOUSE FILTER fixed (correctness):** `lowStock()` L609-610 now `->when($warehouseId, fn($q)=>$q->where('warehouse_id',...))` — the captured-but-ignored filter is now applied. Multi-warehouse shops get correct per-warehouse low-stock alerts. ✔
- **Low-stock N+1 fixed (perf):** L609-613 one grouped `Stock` query → `$stockSums` map; L617 reads in-memory. N+1 → 2 queries regardless of catalog size. ✔
- **P&L de-N+1 (L64-95) — money semantics PRESERVED (I verified):** single `GROUP BY account_id` keeps SAME filters (is_reversed=0, tenant on both tables, date range) and SAME sign conventions (income credit−debit, COGS debit−credit). Reads from pre-aggregate instead of querying per account. Numbers IDENTICAL; `2A+2` → 1 query. ✔
- **Balance Sheet + itemDetail** same de-N+1 pattern; results identical. ✔
- **Stock aggregate tenant-scoped** via the Stock model's HasTenant global scope. ✔
- **Test changes are LEGITIMATE syncs, not weakening:** the `2200→2100` edits were on the ROOT `tests/Feature/...` COPIES (project mirrors test files in both `Tester/tests/` and `tests/`); M1-06b had only fixed the Tester copies. This brings the root copies into sync. ltd_3 tier needed for v3-report gate. Not a re-touch of correct code. ✔
- Tests: LowStockWarehouseTest (warehouse-filter both ways + bounded query count) green; Money 26 passed; Module12 12 passed; TaxAndUom 10 passed. IDE respected no-git. ✔

**⚠️ Maintenance note (not a bug):** project keeps DUPLICATE test files in `Tester/tests/Feature/` AND root `tests/Feature/` — drift risk (this session's 2200→2100 sync proves they CAN diverge). Candidate cleanup for the C-series.

**B3 signed off. Low-stock honors warehouse; P&L/BS/low-stock/item-detail collapsed from N+1 to set-based SQL with identical numbers.**

**Files changed (user to review + commit):** ReportController.php, FinancialReportingService.php, root ReportsTest.php + TaxAndUomServiceTest.php (sync), LowStockWarehouseTest.php (new).

---

### ENTRY B10 — IDOR sweep (every route-model binding tenant-checked) — FOUND a real leak
**Status:** ✅ VERIFIED
**Finding:** systematic cross-tenant isolation sweep — AND it found a genuine IDOR leak.

**Auditor verdict:** ✅ **VERIFIED** (2026-06-21, re-read of the leak/fix + the test's actual assertions).

- **REAL LEAK FOUND & FIXED (B10's whole purpose):** `sales-orders` resource — controller methods typehinted `SalesOrder $order` but the resource param was `sales_order` (mismatch). Laravel then SILENTLY skipped implicit binding and injected a BLANK SalesOrder → returned 200 (no isolation) for a foreign id. NOT a global-scope failure — a param-name mismatch DISABLING binding entirely (a subtle IDOR class only a systematic test catches). Fix: `->parameters(['sales-orders' => 'order'])` (web.php L854-855) realigns param→typehint → binding resolves through HasTenant scope → 404 for foreign id. Correct root-cause fix. ✔
- **Test is genuinely thorough:** data-driven sweep over sales/purchases/parties/products/payments/bank-accounts/expenses/warehouses/proposals/sales-orders (show/edit/update/destroy + ledger), acting as Tenant A with Tenant B's real ids. THREE assertion layers: (1) status NOT 200; (2) body must NOT contain B's distinct values (B Warehouse/B Bank/Foreign Client); (3) NO-MUTATION — after all `PUT 'Hacked'` attempts, every B record still exists + unchanged, verified via withoutTenantScope(). 135 assertions. ✔
- The no-mutation layer is the strongest proof A couldn't write to B. ✔

**⚠️ MINOR polish (NOT a security hole, noted for C-series):** the status assertion accepts 302/403/404/**500**. 500 on a foreign id means the route ERRORED rather than cleanly 404'd — isolation still proven by the content + no-mutation checks (no leak, no mutation), but a clean 404 would be nicer than a 500. Cosmetic, not blocking.

**B10 signed off. A real IDOR (sales-orders) is closed; every route-model binding now provably isolates tenants via a permanent test.**

**Files changed (user to review + commit):** routes/web.php, IdorSweepTest.php (new).

---

### ENTRY B6 — Split-payment reconciliation proofs
**Status:** ✅ VERIFIED
**Finding:** guardrail — prove split-payment legs always sum to invoice_total + books balance.

**Auditor verdict:** ✅ **VERIFIED** (2026-06-21, re-read of the 4 invariants + how the credit leg is counted).

- **Invariant I (the key one) is FULL-total:** `SUM(Payment.amount WHERE sale_id) == invoice_total` (L204-210), AND each leg (cash/bank/credit) asserted individually (L216-229). The CREDIT leg IS a Payment row included in the sum — so the whole total reconciles, not just cash+bank. ✔
- Invariant II trial balance zero; III header `net_sales+tax+shipping==invoice_total`; IV credit leg decrements `current_balance` by exactly the credit amount. ✔
- Integer-cent arithmetic (L153) so legs sum exactly — correct (test's own math can't drift). ✔
- 25 iterations across 5 split shapes (heavy-cash / no-credit / heavy-credit / equal-thirds / minimal-cash). "Deterministic not random" — acceptable: reproducible regression guard, covers the meaningful cases. ✔
- **No drift found** — split path already reconciled; B6 now permanently guards it. 28 Money tests / 852 assertions green, zero regressions. IDE respected no-git. ✔

**B6 signed off. Split payments provably reconcile (legs == total, books balance) across all split shapes — guarded forever.**

**Files changed (user to review + commit):** SplitPaymentReconcileTest.php (new).

---

### ENTRY B8 — Render-cascade fix (Vite in test env) + stale root-test sync
**Status:** ✅ VERIFIED
**Finding:** Tester-Fix-1 — ~80+ reds from @vite throwing in the test env (no manifest/dev server).

**Auditor verdict:** ✅ **VERIFIED** (2026-06-21, re-read of withoutVite placement + scrutinized the money-test edits for cheating).

- **Vite fix correct:** `withoutVite()` added at `tests/TestCase.php` L12 (and SmokeTestCase), right after parent::setUp(), in the LOWEST common base — so it reaches Auth, Money (via VenQoreTestCase), and Smoke tests. @vite returns empty in tests instead of throwing ViteManifestNotFoundException. Production app.blade.php UNTOUCHED. ✔
- **Result:** root `tests/` suite ~286 failures → **531 passed, 100% green**. Tester Money suite 28 green. ✔
- **Money-test edits SCRUTINIZED — legitimate syncs, NOT cheats (I verified):** IDE edited `tests/Feature/Module04/PaymentProcessingTest` (waterfall) and `tests/Feature/Money/PreSaleConversionTest` (2200→2100). These are the STALE ROOT-DIR DUPLICATES lagging behind the verified-correct Tester copies. The edits changed them to assert the CORRECT M1-06/M1-06b values (tax 85/total 935; account 2100) — i.e. synced stale→correct, NOT weakened. Confirmed the canonical Tester copies STILL hold the correct values (PreSaleConversion L102 = 2100; no 95/945/2200 anywhere in Tester). ✔

**⚠️ Process note (honest):** IDE's diagnosis WANDERED — first blamed RefreshDatabase/"users table exists", then Vite, before landing on the real mix (Vite + stale root duplicates). End state is correct & verified, but the path was messy. **This is the 3rd time the DUPLICATE test files (tests/ vs Tester/tests/) caused drift** — strong candidate for a C-series cleanup (dedupe to one source of truth).

**B8 signed off. Render cascade gone; root suite 531 green; stale duplicate money-tests synced to verified values (not weakened).**

**Files changed (user to review + commit):** tests/TestCase.php, tests/SmokeTestCase.php, tests/Feature/Module04/PaymentProcessingTest.php, tests/Feature/Money/PreSaleConversionTest.php.

---

### ENTRY B9 — Report-reconciliation suite (43 reports) + FOUND a real tenant_id bug
**Status:** ✅ VERIFIED · **LAST B-ITEM — B-series COMPLETE**
**Finding:** reconciliation harness — AND it surfaced a latent multi-tenant COGS bug.

**Auditor verdict:** ✅ **VERIFIED** (2026-06-21, re-read of the tenant_id fix + confirmed the test uses INDEPENDENT aggregates).

- **Test methodology is RIGOROUS (the key requirement):** Tier-1 reports compared against SEPARATE `DB::table()->sum()` aggregates, NOT self-referential service calls. P&L revenue/COGS/GP (L216-218); item-wise profit incl. M1-02 north-star 13-units (L284-286); bill-wise + party-wise BOTH sum to P&L GP — cross-report reconciliation (L333-334); tax == SUM(credit to 2100) (L367-375, correct account); stock valuation == SUM(remaining_qty×unit_cost) (L392-394); trial balance debits==credits (L420-422). Tier-2 smoke-loads the rest. ✔
- **REAL BUG FOUND & FIXED (B9's purpose):** raw `DB::table('sale_item_batches')->insert()` in SaleController (L316-325), SalesOrderController, ProposalController were inserting WITHOUT `tenant_id`. Since SaleItemBatch has the HasTenant global scope, those rows were INVISIBLE to scoped reads → return-COGS proration + profit reports silently dropped them. Fix: added `'tenant_id' => $sale->tenant_id` to all 3 raw inserts. **This was a latent COGS/profit-accuracy bug in production**, caught only by reconciling against independent math. ✔
- Full suite 530 green; the reconciliation test self-re-asserts M1-02 (13 units) so the tenant_id change didn't regress return/profit math. IDE respected no-git. ✔

**B9 signed off. Money-critical reports provably reconcile to independent DB aggregates; a latent tenant_id COGS bug is fixed. ✅ ALL B-SERIES (B1–B10) COMPLETE.**

**Files changed (user to review + commit):** SaleController.php, SalesOrderController.php, ProposalController.php, ReportReconciliationTest.php.

---

## ════════ NEXT: C-SERIES (Perfection 100) — NOT YET STARTED ════════
**C1 granular perms · C2 money precision · C3 cascade-delete audit · C4 golden-txn dashboard gate · C5 ⭐LEGACY→SINGLE ENGINE (the big/dangerous one) · SEC-1 plaintext passcode.**
**⚠️ When C5 begins, auditor will issue an explicit "STARTING MOST DANGEROUS TASK" warning + go/no-go to the user FIRST.**

---

## 🏁 CODE TRACK (Sellable blockers) COMPLETE — what remains for Sellable (85) is MANUAL

All audit money/inventory/reporting/security/scalability blockers that are code-fixable are ✅ VERIFIED. Remaining M1 items are hands-on launch verification only the user can run:
- **M1-11** WooCommerce false on all tiers + Cookbook enforce (partly code, partly config) — small.
- **M1-12** Rotate marketplace secrets; confirm VenSynQ off (manual ops).
- **M1-13** Lemon Squeezy live test purchase → plan activation (manual, real payment).
- **M1-14** A4 print / chat z-index / SmartCapture final pass (manual UI).
- **M1-15** Google Drive backup + restore on a test store (manual).
- **M1-16** Reconciliation spot-check + full regression as Owner/Manager/Starter/Growth (manual).
- Minor: M1-EX-Settings (store_name/currency_symbol validation — decide), M1-07b (purchase_items/stock_movements decimal — confirm column types).

---

## ⚠️ FULL-SUITE RUN — 2026-06-20 (112 failed / 427 passed) — triage

A full `pest` run was captured. The 112 failures are **NOT** 112 money bugs. Triaged:

**A) Money/logic failures that belong to our plan (the ones that matter):**
- `✗ M1-02 north-star` + `✗ excludes returned sales and reversed cogs from gross profit` → **F2 / M1-02** (this instruction).
- `✗ excludes reversed journal entries from party statement reports` → **F8 / M1-10.**
- `✗ tax report calculates correct tax payable` + `✗ tax_report_matches_sale_items` → **F7 / M1-06.**
- `✗ strictly isolates tenant data in v3 reports and exports` → **F3 / M1-03 (tenant leak — HIGH).**
- `✗ add_money_to_bank_account` → funds/banking; investigate (candidate F-class).
- `✗ V3 SmokeTest: ping endpoint returns ok` → trivial route/health; low.

**B) Infrastructure CASCADE — one root cause, ~80+ reds (NOT sellable-blockers, but blocks "trustworthy"):**
- Entire **Auth** suite (login/register/password/profile/email-verify can't render), **guest-page SMOKE** (homepage, login, registration pages), **DRAGNET generic reports**, `ExampleTest`, and most **AppSumo CodeStacking** + **PlanManagement** pricing/plan pages.
- Symptom signature: any route that **renders a full Inertia page through the HTTP stack** fails, while pure logic/service tests pass. Almost certainly a **missing Vite manifest / Inertia root-view / asset-version** condition in the test env — i.e. `npm run build` not run before the suite, or test env not stubbing the manifest. One fix likely clears the bulk.
- Logged as **Tester-Fix-1** (infra). Scheduled into M2 (Trustworthy), NOT blocking M1 — these are test-harness/render failures, not money errors. We do not chase them one-by-one.

**C) Already-correct guardrails confirming the harness is honest (passing):** trial balance always zero, FIFO order, split-payment void, overpayment→422, credit-limit race blocks, tenant isolation on products/sales/parties, journal reversal swaps debits/credits, `sale stats exclude returned sales`, `M1-01` green. The suite is discriminating — it greens correct code and reds real bugs.

**Decision:** Continue the M1 money track in order (M1-02 now). Address Tester-Fix-1 (the cascade) as a single infra item in M2 so the dashboard can go fully green for the "trustworthy" milestone. Do not let the 112 number reorder priorities — most of it is one render fault.

---

## 📊 SCOPE RECONCILIATION — count check + blind-spot analysis (2026-06-20)

**The count is correct: 17 planned + 3 discovered = 20.**
- Planned M1 set: M1-01 … M1-17 (17). *(M1-17 = the Golden-Transaction automated test, delivered as `ReturnIntegrityTest`.)*
- Discovered during execution: **M1-06b** (tax → wrong account 2200), **M1-EX1** (GET blocked at tx-limit), **M1-EX2** (abort(403) swallowed into 500).
- Total tracked work items = **20**. ✔

**Why the audit missed those 3 (honest root-cause — these define the audit's boundary):**
1. **M1-06b → duplicate-path blind spot.** The audit deep-read the *routed* `SaleController::postSaleJournal` (correct 2100). The 2200 bug lived in `V3/SaleService` + `SalesOrderController` — duplicate sale-posting paths that were *flagged as a risk* (M3-01) but not line-audited. Confirmed: `SaleController.php:1350` = 2100 (correct); the bug was elsewhere.
2. **M1-EX1 + M1-EX2 → runtime-only blind spot.** "Does a catch swallow an abort?" / "does a middleware block GETs?" are behaviors that exist only when code runs. Static reading cannot see them; the MySQL test suite surfaced both. This is the safety net working, not the audit failing.

**Proactive blind-spot sweep (done this turn so the class doesn't ambush us at launch):**
- **Exception-swallow class (M1-EX2's family): ~44 controllers use a generic `catch(\Exception|\Throwable)`; 17 of those also call `abort(40x)` inside a try** → each is a candidate for "intended 403/404 becomes a 500." Already-listed (BillingController, DashboardController, RecycleBinController, WooConnectionController) are a subset. → **New item M1-EX3** (below).
- **V3/SaleService re-read:** account codes now all correct (4000/5000/1100/2100/1200) after M1-06b. No further misclassification in that file. ✔

### M1-EX3 — Exception-swallow sweep (⬜ TODO; severity split)
The 17 controllers that `abort(40x)` inside a generic catch must be triaged:
- **M1 (Sellable-blocking) subset:** any that swallow a **permission/authorization `abort(403)`** (turns a security denial into a 500 — masks whether the gate even fired). Fix these before launch.
- **M2 (Trustworthy) subset:** ones that only turn operational errors into 500s (ugly, not unsafe).
- Method: re-throw `HttpException` before the generic catch (the exact pattern already applied in `AdminController::updateMember` for M1-EX2), controller by controller, each with a test asserting the intended status code.

**THE REAL SELLABLE GATE (restated, because item-count ≠ done):**
"Sellable" is **not** "20 items checked off." It is: **the Money suite + the tenant-isolation + tax + report-reconciliation tests are GREEN on the MySQL harness, AND a final dynamic regression + a dad's-shop reconciliation pass clean.** The item list is a tracking aid; the green MySQL suite is the truth. Expect 1–3 more EX-class items to surface as the suite broadens — that is the system catching bugs *before* launch, which is exactly the outcome we want.

---

_(New entries are appended here as we go. Each item: instruction → IDE result → tester result → auditor verdict.)_
