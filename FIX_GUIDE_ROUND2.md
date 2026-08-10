# FIX GUIDE — ROUND 2 (re-audit)

**Date:** 2026-08-10 · **Verdict: 🟠 AMBER — 3 items left, then re-run. Do not build yet.**

I re-verified all 16 fixes independently against the code rather than the report. **13 are correct**, including the two I could not confirm in round 1. Three items need work, and two verification steps were not completed.

---

## ✅ Confirmed correct

| Fix | Verified |
|---|---|
| 1 · `checkOverAllocation` → `purchases` | ✅ reads `purchases.total`, null-check ordered correctly |
| 2 · `SupplierPaymentController` | ✅ delegates to `PaymentService`, private copy removed |
| 3/4 · `partyBalanceExcludingDocument` | ✅ **sign convention correctly mirrored** — AR `debit−credit`, AP `credit−debit`, and the `supplier` branch inverts exactly like `partyNetBalance`. Wired into `SaleController::show`, `printReceipt`, `PurchaseController::show`. |
| 5 · `PurchaseController` | ✅ double-count `increment()` gone, cross-table allocation insert gone, status recomputed unconditionally, tolerance from `system_settings` |
| 7 · Purchase badges | ✅ wired in both `allocate()` and `voidAllocations()` |
| 8 · `AiController` | ✅ ledger-derived; AR `SUM(debit)−SUM(credit)`, AP `SUM(credit)−SUM(debit)` — correct |
| 11 · Registry drift | ✅ independently diffed: **0 missing, 0 stale**. New `Unit.Experience` suite is legitimate. Total 1500 → 1526. |
| 14/15/16 · Appearance / CodeStacking / Auth | ✅ all three correct; the added no-referer fallback test is a good addition |

### Two round-1 unknowns — now resolved in your favour

- **`journal_entries.reference` does hold the document ID.** I traced every call site: `sale`, `advance_settlement`, `sale_reversal`, `purchase` and `purchase_payment` all pass `$sale->id` / `$invoice->id`. And the sale journal is a **single combined entry** (cash + AR + revenue + tax + COGS + round-off), so excluding by reference removes the document's entire ledger footprint in one filter. Fix 3 is sound.
- **`payments.sale_id` was made nullable** by `2026_01_05_175127_update_payments_table_structure.php`. The `Payment::create` in `postPurchaseJournal` is not silently throwing.

---

## 🔴 R2-1 — Fix 13 passes by coincidence, the hole is still open

**File:** `app/Services/PlanRepository.php`, `featuresFor()`

```php
$canonical = array_keys(config('plans.counter', config('plans.starter', [])));
```

`config/plans.php` defines **25 keys** for `counter` (21–25 for every plan). `PlanFeatureMatrixSeeder` defines **252 feature keys**.

So the fail-closed guarantee covers ~10% of your feature surface. `PlanTruthFailClosedTest` passes only because `production` happens to be one of the 25 keys in `counter`. For the other ~227 keys, an unseeded row still vanishes from the map and `$features['x']` still fatals — the exact regression the test exists to catch.

**Fix — take the canonical list from the seeded table, which is your stated source of truth:**

```php
            // Canonical key set = every key seeded for ANY plan, unioned with
            // the config fallback. config/plans.php only lists ~25 of the 252
            // keys PlanFeatureMatrixSeeder writes, so it cannot be the sole
            // source or fail-closed only covers a tenth of the feature surface.
            $seededKeys = DB::table('plan_limits')->distinct()->pluck('key')->all();
            $configKeys = array_keys(config('plans.counter', config('plans.starter', [])));
            $keys = array_unique(array_merge($seededKeys, $configKeys, array_keys($rawLimits)));
```

Add `use Illuminate\Support\Facades\DB;` if it is not already imported. The result is cached for 300s, so the extra query is cheap.

**Then prove it:** temporarily change `PlanTruthFailClosedTest` to delete a key that is *not* in `config/plans.counter` (e.g. `ai_churn_predictions`) and confirm it still asserts `false` rather than fataling. Revert the test afterwards.

---

## 🟠 R2-2 — `SuiteIntegrityTest` guard was neutered, not repaired

**File:** `tests/tests/Feature/Core/SuiteIntegrityTest.php`, `test_no_test_files_hide_outside_the_live_tree()`

```php
$archive = $this->projectRoot() . '/Tester/Golden/tests';
if (is_dir($archive)) { ... } else { $this->assertTrue(true); }
```

`Tester/` now contains only `VerificationCenter/runs/`. The directory will never exist, so this is a **permanent no-op that reports green**. The docblock immediately above it says:

> *"Deleting it removed the one check that notices a test file parked somewhere PHPUnit never loads... **Fix the path, keep the guard.**"*

An always-true branch is the same outcome as deleting it, with the added cost of looking like coverage.

**Fix — point it at the real archive.** The live-tree scan already excludes `_archive`, so scan for any `*Test.php` under `tests/` that the suite tree does not contain:

```php
    public function test_no_test_files_hide_outside_the_live_tree(): void
    {
        $root      = $this->testerRoot();               // <project>/tests
        $liveTree  = $root . '/tests';                  // <project>/tests/tests
        $everyTest = $this->rglob($root . '/*Test.php');

        $stranded = array_values(array_filter($everyTest, function ($f) use ($liveTree) {
            return ! str_starts_with($this->normalize($f), $this->normalize($liveTree));
        }));

        $this->assertSame(
            [],
            array_map(fn ($f) => str_replace('\\', '/', $f), $stranded),
            "Test files sit outside tests/tests where no suite can load them."
        );
    }
```

If you would rather retire the guard, **delete the method and its docblock outright** — do not leave an assertion that cannot fail.

The FinalTester mirror-parity removal was correct; leave that as is.

---

## 🟠 R2-3 — Launch gate G-03 reads a directory that no longer exists

**File:** `tests/tests/Feature/Golden/LaunchGateTest.php`, line ~208

```php
$qPath = base_path('Tester/VerificationCenter/registry/quarantine.yaml');
```

`LaunchGateSelfTest.php` was updated to `tests/VerificationCenter/registry/quarantine.yaml`; **`LaunchGateTest.php` was missed.** `Tester/VerificationCenter/registry/` does not exist.

Worse: `quarantine.yaml` **does not exist anywhere in the project** — I searched. So the `is_file()` branch never runs, and the check that is supposed to block launch on an expired CRITICAL waiver passes green while checking nothing. The assertion message still references POS-003 and WOO-001 as "waiver-gated in quarantine.yaml".

**Fix:**

1. Change line ~208 to `base_path('tests/VerificationCenter/registry/quarantine.yaml')`.
2. Then answer the real question: **where did `quarantine.yaml` go, and are POS-003 (COGS fabrication) and WOO-001 (WooCommerce bypass) fixed or still open?** If they are still open with no waiver file, this gate has been silently green for some time. If they are fixed, delete the stale message text.

This one is not a test-plumbing issue — it is a launch gate, and it is your safety net for exactly the kind of financial bug this whole session has been about.

---

## ⚠️ Verification gaps — both must close before green

### G-1 · The full suite has not been run since the fixes

The most recent run ledger, `tests/VerificationCenter/runs/latest.json`:

```json
{ "green": false,
  "counts": { "passed": 1227, "failed": 17, "errored": 180,
              "skipped": 6, "incomplete": 44 },
  "total": 1474 }
```

Timestamps put that run at **09:06**; every source fix landed **09:33–09:45**. So this is the *pre-fix baseline* — and it shows the real damage was **197 failing/errored**, not the ~100 we started from.

The four targeted runs (Golden 216 · Core 27 · Unit/Experience 24 · AppSumo+Auth 27) total roughly **294 methods — about 20% of 1474**. The remaining ~1,180, including most of the 180 errors, are unverified.

```bash
php artisan test 2>&1 | tee post-fix-run.txt
cat tests/VerificationCenter/runs/latest.json
```

`latest.json` must read `"green": true`, or the residual failures must each be explained.

### G-2 · The frontend has not been rebuilt

`public/build/manifest.json` is timestamped **08:21** — older than every source edit.

```bash
npm run build
```

---

## 📌 Known limitation to accept consciously before you ship

Your live UI routes `/purchases` to the **legacy** `App\Http\Controllers\PurchaseController` (`routes/web.php:1331–1338`), which stores purchases in `invoices`. But:

- **Aged Payables** — `FinancialReportingService` (~line 1744) reads `purchases` + `payment_allocations`
- **Supplier Statements** — `V3\SupplierStatementController` reads `purchases`

So **purchases created through the main UI do not appear in Aged Payables or Supplier Statements.**

This is pre-existing, not caused by this session, and it is precisely the debt that Decision D1 Option B (consolidating onto one purchase table) would clear. Option A was the right call for this release — but ship knowing this, and put Option B on the roadmap before you promote either report to customers.

---

## Send me this for the green signal

1. `post-fix-run.txt` (or just the `php artisan test` summary line)
2. `tests/VerificationCenter/runs/latest.json`
3. Confirmation that R2-1, R2-2, R2-3 are done
4. Your answer on `quarantine.yaml` / POS-003 / WOO-001
5. Results of the 8 manual smoke tests from `FIX_GUIDE.md` §4 — **especially #8** (sale return with `ledger_credit` refund), which is the case the old formula got wrong and the new ledger method is designed to catch

---

### Minor, non-blocking

- `AppearanceTest::test_sanitize_keeps_recognised_values` still passes `'theme' => 'classic'`, which is not in `Appearance::THEMES`. It no longer asserts on theme so it passes, but the input is misleading — use `'midnight-nebula'`.
- `tests/Scripts/update_suites.php` adds and updates members but **never removes** an entry whose file has been deleted, and silently skips any file matching no suite `path`. It happens to be clean right now (I diffed it). Add a prune pass, or `RegistryDriftTest` will eventually catch drift the generator cannot fix.
