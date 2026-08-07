# VenQore — Remaining Engineering Work Before Launch

**Prepared:** 2026-07-08 (independent verification of the `session2-fixes` branch)
**Purpose:** the things still left to do in code/tests/infra before you go live, each with *why*, *exact steps*, and *how to know it's done*. Manual (human) go-live steps are in `MANUAL_LAUNCH_CHECKLIST.md`.

## How to read the status of the last session
The other agent's remediation commit (`f2b0b49`) fixed most of the data-drift items **correctly** — I verified each against your real migration columns. But three kinds of things remain: (a) items that were **suppressed by a baseline rather than actually fixed**, (b) **process gaps** in how the fixes were wired in, and (c) the **root-cause** work that was never done. This file is those.

---

## 🔴 BLOCKERS — do before launch

### R1. The new verification tests are not in your test suite
- **What I found:** the 7 new tests (`DebitNoteTest`, `PaymentAllocationTest`, `PurchasesImportTest`, `MigrationTest`, `SmartFulfillmentTest`, `V3/SalesOrderTest`, `AppSumo/ImportAppSumoCodesTest`) were written under the **root `tests/Feature/`** directory. Your suite and dashboard run **`Tester/tests/Feature/`** (`--configuration Tester/phpunit.xml`, and `phpunit.xml.dist` points only at `./Tester/tests`). These are **separate folders**, so those tests **do not run** in your suite or CI.
- **Why it matters:** they give false confidence. A regression in those areas would not be caught even though a test "exists."
- **Exact steps:**
  1. Move the 7 files from `tests/Feature/...` to the mirrored path under `Tester/tests/Feature/...` (e.g. `Tester/tests/Feature/DebitNoteTest.php`, `Tester/tests/Feature/V3/SalesOrderTest.php`, `Tester/tests/Feature/AppSumo/ImportAppSumoCodesTest.php`).
  2. Fix each file's `namespace` to match the `Tester\Tests\Feature\...` convention used by the other Tester tests, and ensure they `extend VenQoreTestCase` (not the root `Tests\TestCase`).
  3. Add them to `Tester/dashboard/test-runner.js` if you want them as their own dashboard modules (optional — they'll run inside the existing directory sweep).
- **Done when:** `"E:\Software\Xampp\php\php.exe" vendor/bin/pest --configuration Tester/phpunit.xml` shows those tests executing and passing.

### R2. Re-seed the guard baselines (they are stale)
- **What I found:** `Tester/tests/Feature/Guardrails/baselines/mass_assignment_drift.json` was seeded **before** the fixes and still lists ~18 signatures that are now fixed (e.g. `BankAccount::balance`, `PurchaseItem::quantity`, `SalesOrderItem::qty`, `StockMovement::reference`). The `stale_fillable.json` baseline correctly still lists the genuinely-unfixed items.
- **Why it matters:** the baseline is an *allow-list*. As long as `BankAccount::balance` sits in it, if someone **re-introduces** that exact bad write later, the guard will **not** catch it. A stale baseline quietly weakens the guard.
- **Exact steps:**
  1. Delete the three baseline files: `Tester/tests/Feature/Guardrails/baselines/*.json`.
  2. Re-run the Guardrails suite once — the tests re-seed the baselines from the **current** (fixed) state.
  3. **Read** the new `mass_assignment_drift.json` and `stale_fillable.json`. Every remaining entry is a real, still-open drift. Commit the regenerated files.
- **Done when:** the regenerated `mass_assignment_drift.json` contains only genuinely-open items (ideally just the MigrationController one-time-tool entries if any, and nothing from the fixed list), and `stale_fillable.json` reflects reality after R3.

### R3. Activity logging is broken on any fresh install (real, only suppressed)
- **What I found:** `app/Traits/HasActivityLog.php` (runs on **every** model create/update/delete) writes `subject_type, subject_id, payload, ip_address, user_agent, is_impersonated` to `StoreActivityLog` (`$table = 'activity_logs'`). The `activity_logs` table has **none** of those columns (it has `subject`, `properties`). The write is wrapped in `try { … } catch (\Exception $e) { /* ignore */ }`, so on a fresh-migrated DB **the entire insert throws and is silently swallowed — no activity is logged at all**. It only works on `venqore_pos` because that DB drifted to include the columns. This was **baselined, not fixed.**
- **Why it matters:** your audit trail (who changed what, from which IP, impersonation flag) silently does not exist after a fresh install or DR rebuild — exactly when you'd need it.
- **Exact steps (pick one):**
  - **Option A (recommended):** add a migration that brings `activity_logs` to the full schema the trait writes: `subject_type (string, nullable)`, `subject_id (string, nullable)`, `payload (json, nullable)`, `ip_address (string, nullable)`, `user_agent (text, nullable)`, `is_impersonated (boolean, default false)`. Keep the existing `subject`/`properties` or migrate their data. Then update `StoreActivityLog` model/`$fillable` to match.
  - **Option B:** change `StoreActivityLog` to a dedicated `store_activity_logs` table with the full schema and repoint `$table`.
  - Either way, **remove the silent `catch` swallow** (or narrow it) so a future schema mismatch is visible, not hidden.
- **Done when:** trigger any model update on a fresh-migrated DB and confirm a row lands in the log table with `payload`, `ip_address`, `user_agent` populated; the `stale_fillable.json` baseline for `StoreActivityLog` becomes empty.

### R4. Do the root-cause schema reconciliation (migrations vs production)
- **What I found:** the agent fixed the **individual** drift sites the mass-assignment scanner flagged, but did **not** run the systematic migrations-vs-`venqore_pos` diff. The scanner only sees Eloquent `Model::create()` calls — it does **not** see raw `DB::table('x')->insert([...])` writes (e.g. `V3\SaleService`) or columns that are simply present in prod and absent from migrations without any failing write. So the underlying "test DB ≠ production" condition is only *partially* closed.
- **Why it matters:** until migrations reproduce `venqore_pos`, your test suite runs on a different schema than production (green here ≠ safe there), and any DR rebuild / new self-hosted install is broken.
- **Exact steps:**
  ```bash
  mysqldump --no-data venqore_pos > prod_schema.sql
  mysql -e "CREATE DATABASE schema_check"
  # point a scratch .env at schema_check:
  php artisan migrate
  mysqldump --no-data schema_check > migrated_schema.sql
  diff migrated_schema.sql prod_schema.sql
  ```
  For every table/column present in prod but missing from the migrated schema, write a migration to add it. Repeat until `diff` is clean.
- **Done when:** `diff` is empty, and a fresh `php artisan migrate:fresh` on `amd_pos_test` produces a schema identical to production.

---

## 🟠 SHOULD-FIX before launch (correctness / safety)

### R5. Confirm the full suite is actually green *after* the fixes
- **Why:** changing `PaymentAllocation` relationships, the AppSumo write, the installer, and adding a migration can break existing tests (e.g. a test asserting old columns). Nobody has confirmed the whole suite green post-fix in this review.
- **Steps:** run the full suite and the artisan guard:
  ```bash
  "E:\Software\Xampp\php\php.exe" vendor/bin/pest --configuration Tester/phpunit.xml --no-coverage
  "E:\Software\Xampp\php\php.exe" artisan audit:mass-assignment
  ```
  Fix any red. Confirm the dashboard shows the `Guardrails` module passing.
- **Done when:** full suite green (minus intentionally-excluded SmartCapture coming-soon) and `audit:mass-assignment` exits 0.

### R6. Verify or remove the PaymentAllocation "fix" semantics + dead code
- **What I found:** the keys were renamed to `payment_journal_entry_id` / `sale_id` / `purchase_id` / `allocated_amount` (so it no longer drifts), **but** the *value* passed to `payment_journal_entry_id` is a **Payment id, not a journal-entry id** — semantically wrong. Also `PosController::recordPayment` (one of the two writers) is reached only via `PosController::checkout`, which appears **unrouted** (the `/pos/sale` route is commented out). The live POS path is `SaleController`/`SaleService`.
- **Steps:**
  1. Confirm `PosController::checkout()`/`recordPayment()` are unreachable; if so, **delete them** (removes the questionable allocation and the phantom `payments.type` write).
  2. For `PurchaseService`'s allocation, confirm it's live; if so, make `payment_journal_entry_id` actually reference the journal entry (or route the allocation through `AccountingService`).
- **Done when:** dead code removed; any live allocation writes a correct, FK-valid row and a balanced journal.

### R7. Money-column alias reconciliation (P2-1)
- **What:** `sales` keeps both canonical (`net_sales/invoice_total/total_tax/subtotal_gross`) and legacy (`total/tax/subtotal`) columns. Ensure every writer/report sets both, or migrate everything to canonical.
- **Steps:** grep all readers/writers of `sales.total`, `sales.tax`, `sales.subtotal`; make writers set both sides. Extend `SaleFinancialValueGuardTest` to returns and edits.
- **Done when:** the value guard is green across sale, return, and edit flows.

### R8. Tenant-scope review for models missing `HasTenant` (P2-2)
- **What I found:** these have a `tenant_id` but no global scope, so queries aren't auto-isolated: `CouponRedemption, PkVerification, PlanChangeNotification, StaffInvitation, TenantPlanOverride, WooConnection`. Highest risk: **`WooConnection`** (per-store WooCommerce API credentials) and **`StaffInvitation`**.
- **Steps:** for each, either add `use App\Traits\HasTenant;` or audit every query site to confirm an explicit `where('tenant_id', …)`. Add them to `TenantIsolationSweepGuardTest`.
- **Done when:** the isolation sweep includes these models and passes.

---

## 🟡 NICE-TO-HAVE / hardening (can follow launch)

### R9. Wire the guards into CI
Add to your pipeline: `php artisan audit:mass-assignment` and the `Guardrails` suite; fail the build on new drift or new unprotected write routes. Commit the reviewed baselines.

### R10. Extend the mass-assignment scanner to raw `DB::table()->insert()` (P3-2)
The scanner misses raw inserts (used by `V3\SaleService` for the core sale write). Extend `MassAssignmentAnalyzer` to also match `DB::table('x')->insert([...])`/`->update([...])`, resolving `'x'` directly to a table.

### R11. Idempotency under missing tenant context (P3-3)
In `SyncController::batchOrders`, change the dedupe check to `Sale::withoutGlobalScope('tenant')->where('id', …)->exists()` so retries are idempotent even when no tenant is bound.

### R12. Extend value-level guards (P3-4)
Add exact-value + trial-balance assertions for purchases (`PurchaseService`), returns/reversals (`SaleReversalService`), and credit sales.

### R13. Review the bundled pricing/billing changes
The remediation commit also changed `BillingController`, `resources/js/Pages/Billing/Index.jsx`, `Pricing.jsx`, `WhatIsIncluded.jsx`, and added `2026_07_08_000000_update_plan_prices.php` — **unrelated to hardening**. Verify these pricing changes are intentional and correct before launch (they affect what customers are charged).

---

## Suggested order
1. **R5** (run the suite — know your real starting point) →
2. **R1** (wire the new tests in) + **R2** (re-seed baselines) →
3. **R4** (schema reconciliation — the big one) →
4. **R3** (activity log) + **R6** (allocation/dead code) →
5. **R7, R8** →
6. **R9–R13** as time allows / post-launch.
