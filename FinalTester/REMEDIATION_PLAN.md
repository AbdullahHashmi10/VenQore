# VenQore — Pre-Launch Remediation Plan

**Run analysed:** 2026-08-02 03:00 · 1358/1358 executed · 1193 passed · **103 failed** · 6 skipped · 55 incomplete · 1 risky · 6512 assertions · 376s · exit 2

This document is written to be worked through top to bottom in an IDE. Every
item states **who is wrong — the code or the test** — because that determines
whether you touch application code or test code.

---

---

> # ⚠️ UPDATE — 2026-08-02 17:00 run
>
> ## The run showed 8/1330 because MySQL was switched off
>
> ```
> SQLSTATE[HY000] [2002] No connection could be made because the
> target machine actively refused it (Host: 127.0.0.1, Port: 3306,
> Database: amd_pos_test)
> ```
>
> **Nothing in this document caused that and nothing in the product is
> implicated.** The MySQL service in XAMPP is stopped. Start it and re-run.
>
> The 503s your IDE saw in `BarcodeSheetTest` are the same thing one layer up:
> `DatabaseHealthCheck` middleware catches the dead connection on every write
> request and returns 503. That diagnosis was correct.
>
> **My fault that you had to find out the slow way.** `Scripts\run.bat` has
> always run `preflight.php` first; the dashboard did not. It has now been
> added to both the suite runner and the route sweep. A stopped database will
> stop the run in about two seconds with the exact fix, and the counters stay
> at zero instead of showing a misleading partial board.
>
> ## 🔴 33 tests were deleted — 6 files are NOT in git
>
> Test-file count in `Tester/tests` fell from **202 → 197**, and the expected
> count from **1358 → 1330**.
>
> Your IDE's `sync.php` reported *"pruned zombies: 8 file(s) with no source
> removed"*. That prune was correct behaviour — it removed FinalTester copies
> whose source had already been deleted. **The deletion happened upstream, in
> `Tester/tests`.**
>
> | File | Tests | In git? |
> |---|---:|---|
> | `Feature/SolutionsPagesTest.php` | 9 | ❌ **never committed — gone** |
> | `Feature/FeaturePagesTest.php` | 7 | ❌ **never committed — gone** |
> | `Feature/BlogPostEngineTest.php` | 6 | ❌ **never committed — gone** |
> | `Feature/PartnersPageTest.php` | 3 | ❌ **never committed — gone** |
> | `Feature/RoadmapTest.php` | 3 | ❌ **never committed — gone** |
> | `Feature/InvoiceFooterViralLoopTest.php` | 3 | ❌ **never committed — gone** |
> | `Feature/ExampleTest.php` | 1 | ✅ recoverable (`git show 710690e0`) |
> | `Unit/ExampleTest.php` | 1 | ✅ recoverable |
>
> I searched the whole repository including `_VERIFICATION_BASELINE_2026-07-10`,
> `VenQore_Local`, `AMD_POS_Update_v4.2.7` and the legacy `tests/` folder. The
> six uncommitted files exist nowhere. `git log` has no history for them —
> they were untracked working files, so `git checkout` cannot bring them back.
>
> **The two `ExampleTest` files are genuinely disposable** — Laravel scaffolding
> stubs. Deleting those was fine.
>
> **The other six were real coverage:** marketing page rendering, the blog post
> engine, and the invoice-footer viral loop. 31 tests. If that deletion was
> deliberate, note it and move on. If it was not, they need rewriting — and it
> is worth finding out how untracked test files came to be deleted before it
> happens to something that matters more.
>
> **Recover the two that are recoverable:**
> ```bash
> git checkout 710690e0 -- Tester/tests/Feature/ExampleTest.php Tester/tests/Unit/ExampleTest.php
> ```
> (Or leave them deleted — they assert nothing useful.)
>
> ## Before the next run
>
> ```
> 1. Start MySQL in the XAMPP control panel
> 2. php artisan migrate:fresh --env=testing
> 3. FinalTester\RUN_DASHBOARD.bat      (restart it, then Ctrl+F5)
> 4. Run everything
> ```
>
> Preflight will now refuse to start if MySQL is down, the database is missing,
> or migrations have drifted — and it will tell you which.

---

## How to read this document

Each item carries a verdict tag. Obey it literally.

| Tag | Meaning |
|---|---|
| 🔴 **CODE BUG — DO NOT TOUCH THE TEST** | The test is correct and is pinning documented or intended behaviour. Fix the application. Changing the test would erase a real defect. |
| 🟠 **CONFIG BUG** | Application config is wrong. Not a test problem. |
| 🟡 **TEST BUG — fix the test** | The test itself is provably wrong. Verified against source. Safe to change. |
| 🔵 **ENVIRONMENT** | Local machine setup. No repository change. |
| ⚪ **NEEDS A DECISION** | Cannot be resolved mechanically. A human must decide which side is right. |

**Global rule:** unless an item is tagged 🟡 or ⚪, do not modify anything under
`Tester/tests/` or `FinalTester/tests/`.

---

## Executive summary

103 failures. They are **not** 103 separate bugs. They collapse into **13 root
causes**, and two of them account for 68 failures.

| # | Root cause | Failures | Verdict |
|---|---|---:|---|
| 1 | `HandleInertiaRequests::version()` ignores the environment | **47** | 🔴 CODE BUG |
| 2 | `config/inertia.php` is missing `testing.page_extensions` | **21** | 🟠 CONFIG BUG |
| 3 | `ProcurementTest` binds the wrong base class | 6 | 🟡 TEST BUG |
| 4 | `RegistryDrift` registry path not present in FinalTester | 5 | 🟠 CONFIG (harness) |
| 5 | 39 state-changing routes have no permission middleware | 1 test | 🔴 **SECURITY** |
| 6 | Inventory GL account 1100 out by Rs. 9.7M | 1 | ⚪ DECISION |
| 7 | Account 7000 does not net to zero | 1 | ⚪ DECISION |
| 8 | 9 Inertia page components genuinely missing | 1 test | 🔴 CODE BUG |
| 9 | `FullRouteSweepTest` ziggy.js parser sliced too far | 2 | 🟡 **ALREADY FIXED** |
| 10 | Tool tests do not isolate the database | 2 | 🟡 TEST BUG |
| 11 | Billing subscription flow returns no success flash | 4 | 🔴 CODE BUG |
| 12 | SmartCapture: `created_via` not set, alias not pruned | 2 | 🔴 CODE BUG |
| 13 | `pdo_sqlite` extension not enabled | 1 | 🔵 ENVIRONMENT |
| — | Assorted singles (Module02, Module14, BarcodeSheet, GoldenAudit) | ~8 | mixed |

**Fixing items 1 and 2 alone should take the failure count from 103 to roughly 35.**
Do them first, re-run, and re-triage before touching anything else.

---

# PRIORITY 1 — Fix these two first

## 1. 🔴 CODE BUG — Inertia asset version ignores the environment

**47 failures.** Single largest cause in the run.

### Evidence

`app/Http/Middleware/HandleInertiaRequests.php`:

```php
/**
 * Determine the current asset version.
 *
 * Returning null in local development disables Inertia's version-mismatch
 * detection (409 Conflict), which would otherwise cause a silent full-page
 * reload on every form submission after an `npm run build`.
 * In production this is re-enabled so browsers pick up new deploys correctly.
 */
public function version(Request $request): ?string
{
    if (file_exists($manifest = public_path('build/manifest.json'))) {
        return md5_file($manifest);
    }

    return parent::version($request);
}
```

**The docblock describes behaviour the code does not implement.** There is no
environment check anywhere in the method. It returns the manifest hash
unconditionally whenever `public/build/manifest.json` exists — which it does,
because you have run `npm run build`.

Inertia returns **HTTP 409 Conflict** when the request's `X-Inertia-Version`
header does not match the server's version. Test requests do not send that
header, so every Inertia GET in the suite gets a 409.

### Failures this explains

- 43 × `Expected response status code [200] but received 409`
  — `CrossSurfaceConsistencyTest` (11), `DashboardOutputTest` (10),
  `FilterMatrixTest` (8), `ReportOutputTest` (14)
- 1 × `ReportOutputTest::R15` — all 14 report endpoints returned 409 at once
- 1 × `LedgerTruthSweepTest::main dashboard has correct ledger values`
- 2 × `Handle inertia requests version is null in local testing`
  (`RegressionFixesTest.php:193`, `ProductionSmokeTest.php:449`) — both assert
  `md5` is `null` and get `'b825a94ac10c15e0560e8434e31a0931'`

Those last two tests are **literally named after this behaviour**. They exist
because this broke before. It regressed.

### Fix

`app/Http/Middleware/HandleInertiaRequests.php`:

```php
public function version(Request $request): ?string
{
    // Disable Inertia's version-mismatch detection outside production.
    // Without this, every Inertia request in local/testing gets a 409
    // Conflict, because no X-Inertia-Version header is sent.
    if (! app()->environment('production')) {
        return null;
    }

    if (file_exists($manifest = public_path('build/manifest.json'))) {
        return md5_file($manifest);
    }

    return parent::version($request);
}
```

### 🔴 DO NOT TOUCH THE TESTS

All 47 are correct. Two of them exist specifically to pin this contract.
Changing them would delete the only guard against this regressing a third time.

### Verify

```
FinalTester\RUN_FINANCIAL_TESTS.bat
```

Expect the 409 family to go to zero.

---

## 2. 🟠 CONFIG BUG — `config/inertia.php` is missing `testing.page_extensions`

**21 failures.** Every one is a false alarm — the files all exist on disk.

### Evidence

`config/inertia.php` (your published copy):

```php
'testing' => [
    'ensure_pages_exist' => true,
    'page_paths' => [
        resource_path('js/Pages'),
    ],
],
```

The package default (`vendor/inertiajs/inertia-laravel/config/inertia.php`)
also defines `testing.page_extensions`:

```php
'page_extensions' => ['js', 'jsx', 'svelte', 'ts', 'tsx', 'vue'],
```

`vendor/inertiajs/inertia-laravel/src/ServiceProvider.php:45`:

```php
$this->app->bind('inertia.testing.view-finder', function ($app) {
    return new FileViewFinder(
        $app['files'],
        $app['config']->get('inertia.testing.page_paths'),
        $app['config']->get('inertia.testing.page_extensions')   // <- null
    );
});
```

Laravel does **not** deep-merge published config files. Your `config/inertia.php`
replaces the package default wholesale, so `inertia.testing.page_extensions`
resolves to `null`, the `FileViewFinder` is given no extensions, and **no `.jsx`
file can ever be found.**

I verified every flagged component exists:

```
EXISTS  resources/js/Pages/Dashboard.jsx
EXISTS  resources/js/Pages/Pos.jsx
EXISTS  resources/js/Pages/Settings/SettingsPanel.jsx
EXISTS  resources/js/Pages/Reports/ReportsHub.jsx
EXISTS  resources/js/Pages/Reports/Sales.jsx
EXISTS  resources/js/Pages/Marketing/Pricing.jsx
EXISTS  resources/js/Pages/Errors/StoreSuspended.jsx
EXISTS  resources/js/Pages/SuperAdmin/Dashboard.jsx
```

### Failures this explains

All 21 `Inertia page component file [X] does not exist` — 15 in
`InertiaPageRenderTest`, plus `GeoPricingTest` (2), `SupportTicketsTest` (2),
`AuthAndTenancyTest` (1), `Module17\SettingsTest` (1).

### Fix

`config/inertia.php`:

```php
'testing' => [
    'ensure_pages_exist' => true,

    'page_paths' => [
        resource_path('js/Pages'),
    ],

    // REQUIRED. Laravel does not deep-merge published config, so omitting
    // this leaves the testing FileViewFinder with no extensions and every
    // page-existence assertion fails even when the file is present.
    'page_extensions' => [
        'js',
        'jsx',
        'svelte',
        'ts',
        'tsx',
        'vue',
    ],
],
```

Then:

```
php artisan config:clear
```

### 🔴 DO NOT TOUCH THE TESTS

The tests are right — they correctly assert the page should be findable. The
finder was misconfigured.

---

# PRIORITY 2 — Security, must not ship

## 5. 🔴 SECURITY — 39 state-changing routes with no permission middleware

**1 test, 39 routes.** `PermissionBypassGuardTest::No new state changing route is missing permission middleware`

### The dangerous ones

These are authenticated, tenant-scoped, money-adjacent, and unprotected:

```
PATCH  s/{store_slug}/vensynq/channels/{channel}/settlement
POST   s/{store_slug}/vensynq/payouts/{payout}/confirm
POST   s/{store_slug}/vensynq/clearing/toggle
POST   s/{store_slug}/billing/cancel-subscription
POST   s/{store_slug}/billing/resume-subscription
POST   s/{store_slug}/billing/sync-subscription
POST   s/{store_slug}/vensynq/amazon/credentials
POST   s/{store_slug}/vensynq/amazon/test-credentials
POST   s/{store_slug}/vensynq/channels/{channel}/retry
POST   s/{store_slug}/vensynq/channels/{channel}/test
POST   s/{store_slug}/smart-capture/aliases/forget
POST   s/{store_slug}/smart-capture/settings/models
```

**Any authenticated staff member — a cashier — can currently cancel the store's
subscription, confirm a marketplace payout, or overwrite Amazon credentials.**
Treat this as a launch blocker.

### The probably-fine ones

26 `POST tools/*` routes plus `POST partners-submit`. These are **public
marketing tools** — anonymous visitors are meant to use them. They do not need
`permission:`, but they should be reviewed for rate limiting and abuse.

### Fix — part A: protect the real ones

In `routes/web.php`, add permission middleware to each of the 12 above:

```php
Route::post('/billing/cancel-subscription', [BillingController::class, 'cancel'])
    ->middleware('permission:billing.manage')
    ->name('billing.cancel-subscription');

Route::patch('/vensynq/channels/{channel}/settlement', [VenSynQController::class, 'settlement'])
    ->middleware('permission:vensynq.manage')
    ->name('vensynq.channels.settlement');
```

Use existing permission keys where they exist. Do not invent a new key per route.

### Fix — part B: baseline the public ones

The guard test tells you exactly how:

> Add `->middleware('permission:<key>')` to each, or (if truly public) add it to
> `Tester/tests/Feature/Guardrails/baselines/unprotected_write_routes.json`
> with a review note.

Add the 26 `tools/*` routes and `partners-submit` to that baseline file **with a
written justification per entry**. That is the sanctioned mechanism — it keeps
them visible and forces a review next time the list changes.

> ⚠️ Edit the baseline at `Tester/tests/Feature/Guardrails/baselines/` — the
> source suite. `FinalTester/tests/` is a synced copy and will be overwritten.

### 🔴 DO NOT WEAKEN THE TEST

Do not delete it, do not add a blanket exclusion. This test is doing exactly
its job. Baselining is the only acceptable path for genuinely public routes.

---

# PRIORITY 3 — Financial integrity

## 6. ⚪ DECISION — Inventory GL account 1100 out by Rs. 9,704,794

```
Account 1100 (Rs.1,296,392.36) does not match batch value (Rs.11,001,186.90)
FinalTester\tests\Feature\V3\SmokeTest.php:64
```

The inventory control account and the sum of inventory batches disagree by
**Rs. 9.7 million**. If this reflects real posting logic, your balance sheet is
wrong for every tenant.

### Investigate in this order

1. **Is it seed data or logic?** Run against a clean tenant with one purchase:
   ```bash
   php artisan migrate:fresh --env=testing
   php artisan db:seed --class=GoldenAuditSeeder --env=testing
   ```
   Then re-run just this test. If it passes clean and only fails after the full
   suite, it is seeder/state contamination, not the posting engine.

2. **Which direction?** Batch value is 8.5× the GL balance — so either batches
   are being created without a corresponding 1100 debit, or 1100 is being
   credited on sale without a matching batch depletion.

3. **Check the FIFO/COGS write path.** `InventoryService`, `FifoService`, and
   `app/Services/V3/AccountingService.php`. Look for a purchase path that writes
   `inventory_batches` without a journal entry.

4. **Cross-check** against `Feature/Golden/CogsReconciliationTest` and
   `Guardrails/AccountingIntegrityGuardTest` once item 1 is fixed — they are
   currently masked by the 409.

**Do not adjust the tolerance** (`0.01`) to make this pass. The tolerance is
correct; a 9.7M variance is not a rounding artifact.

## 7. ⚪ DECISION — Account 7000 does not net to zero

```
Account 7000 has non-zero balance: Rs.-10000. Opening entries incomplete.
FinalTester\tests\Feature\V3\SmokeTest.php:80
```

7000 is the opening-balance suspense/equity account. It must net to zero once
all opening entries are posted — a non-zero balance means an opening entry was
posted one-sided.

Note the correlated stub: `s053_opening_balance_b19_posts_correctly` and
`s054_account_7000_nets_to_zero` are both **incomplete stubs** (see item 14).
The behaviour was never finished *and* never tested.

Find the Rs. 10,000 entry:

```sql
SELECT je.id, je.entry_date, je.narration, ji.debit, ji.credit
FROM journal_items ji
JOIN journal_entries je ON je.id = ji.journal_entry_id
JOIN accounts a ON a.id = ji.account_id
WHERE a.code = '7000'
ORDER BY je.entry_date;
```

---

# PRIORITY 4 — Real code bugs

## 8. 🔴 CODE BUG — 9 Inertia page components genuinely missing

Distinct from item 2. I checked the filesystem directly — **these do not exist
in any extension**:

| Component | Rendered from |
|---|---|
| `Admin/StaffSummaries` | `Admin/StoreAdminController.php`, `AdminController.php` |
| `DebitNotes/Show` | `DebitNoteController.php` |
| `EInvoicing/Dashboard` | `EInvoicingController.php` |
| `Inventory/Production/Show` | `ProductionController.php` |
| `Payments/Show` | `PaymentController.php` |
| `PurchaseOrders/Print` | `PurchaseOrderController.php` |
| `Returns/Show` | `ReturnController.php` |
| `SerialTracking/Show` | `SerialTrackingController.php` |
| `SuperAdmin/Tenants` | `Admin/AdminDashboardController.php` |

**Every one is a guaranteed white screen** the moment a user reaches that route.
`Payments/Show`, `Returns/Show` and `DebitNotes/Show` are core transaction
detail views.

### Fix

For each: either create the `.jsx` page, or if the feature was cut, remove the
route and the `Inertia::render()` call. Do not leave a route pointing at a
component that does not exist.

### 🔴 DO NOT TOUCH THE TEST

`FullRouteSweepTest::every_rendered_inertia_page_component_exists` is correct
and just caught nine real defects.

## 11. 🔴 CODE BUG — Billing subscription flow returns no success flash

**4 failures** in `SubscriptionCancelTest` / `SubscriptionStatusMappingTest`:

```
the owner can cancel and keeps access until the paid period ends
  -> Session is missing expected key [success].
the owner can resume a cancelled subscription
  -> Session is missing expected key [success].
cancelling clears the payment-history cache so the tab is not stale
  -> Failed asserting that true is false.       (cache not cleared)
a trialling checkout provisions the store as trial, not active
  -> Failed asserting that two strings are identical.  (status mapping wrong)
```

Three separate defects in the billing controller:

1. Cancel and resume do not flash `success` — the user gets no confirmation.
2. Cancel does not invalidate the payment-history cache — the billing tab shows
   stale data after cancelling.
3. A *trialling* Lemon Squeezy checkout is provisioned as `active` instead of
   `trial` — **this one has revenue impact**: a trialling store is being marked
   as a paying customer.

Start at `app/Http/Controllers/BillingController.php` and the subscription
status mapper.

## 12. 🔴 CODE BUG — SmartCapture: `created_via` not set, stale alias not pruned

```
products created by a scan are reported back and tagged as such
  -> expected created_via = 'ai_scan', found created_via = null

a lesson pointing at a deleted product is discarded, not returned
  -> expected null, got alias for 'Coca Cola 1.5L Bottle'
```

1. Products created by an AI scan are not being tagged `created_via = 'ai_scan'`.
   You lose the audit trail of what the AI created versus what a human entered.
2. A learned alias pointing at a deleted product is still returned. The user
   gets suggested a product that no longer exists.

Both are in the SmartCapture confirm/alias-resolution path.

---

# PRIORITY 5 — Test and harness fixes

> These are the **only** items where you may edit test files.
> Make every edit in **`Tester/tests/`**, not `FinalTester/tests/` — the latter
> is a synced copy that `Scripts/sync.php` overwrites on every run.

## 3. 🟡 TEST BUG — `ProcurementTest` binds the wrong base class

**6 failures.** `Tester/tests/Feature/Module07/ProcurementTest.php:13`:

```php
uses(RefreshDatabase::class);     // <- only the trait, no base test case
```

The file imports `Tests\Feature\VenQoreTestCase` at the top but never binds it.
`RefreshDatabase` is a trait, not a TestCase — so `$this->createTenant()` does
not exist.

Because the file declares its own `uses()`, `FinalTester/tests/Pest.php`
correctly leaves it alone (binding it from two places is a hard abort). The file
must therefore bind the base class itself.

### Fix

```php
uses(VenQoreTestCase::class, RefreshDatabase::class);
```

Verified against the other Module0x files, which all extend `VenQoreTestCase`.

## 10. 🟡 TEST BUG — Tool tests do not isolate the database

**2 failures.**

```
Receipt generation is free and requires no lead
Disposable email is rejected at the controller
  -> table [tool_leads] expected 0 entries, found 5
```

`ReceiptToolTest` and `ToolLeadCaptureTest` extend `Tests\TestCase` — the plain
base class, with **no `RefreshDatabase`**. Rows written by earlier tests in the
same run survive, so a global `assertDatabaseCount('tool_leads', 0)` cannot hold.

### Fix — pick one

**Option A (preferred)** — make the assertion specific rather than global:

```php
$this->assertDatabaseMissing('tool_leads', ['email' => $disposableEmail]);
```

**Option B** — add isolation:

```php
use Illuminate\Foundation\Testing\RefreshDatabase;

class ToolLeadCaptureTest extends TestCase
{
    use RefreshDatabase;
```

Option A is better: these are fast, DB-light tests and `RefreshDatabase` on each
would slow the Tools lane noticeably (193 tests).

## 9. 🟡 TEST BUG — ✅ ALREADY FIXED

`FullRouteSweepTest` used `strrpos($source, '};')` to find the end of the Ziggy
object. That matches the **last** `};` in the file, which belongs to
`export { Ziggy };` — slicing in ~150 characters of trailing JavaScript, so
`json_decode()` returned null on a perfectly valid `ziggy.js`.

Replaced with a brace-matching scan that skips braces inside string literals
(route URIs contain `{store_slug}`). Verified against your actual file: parses
cleanly, finds all **920 routes**.

**No action needed** — but note that these two tests were reporting a
non-existent problem. Once they run properly they may reveal genuine Ziggy drift.

## 4. 🟠 CONFIG — RegistryDrift registry path

**5 failures.** `RegistryDriftTest` resolves its registry as
`dirname(__DIR__, 3) . '/VerificationCenter/registry/suites.yaml'`. Run from
FinalTester that becomes `FinalTester/VerificationCenter/registry/suites.yaml`,
which does not exist — the file lives at
`Tester/VerificationCenter/registry/suites.yaml`.

### Fix — copy the registry into FinalTester

```bat
mkdir "FinalTester\VerificationCenter\registry"
copy "Tester\VerificationCenter\registry\suites.yaml" "FinalTester\VerificationCenter\registry\"
```

Then add it to `Scripts/sync.php` so it stays current. This test guards against
test-registry drift and is worth keeping alive.

---

# PRIORITY 6 — Environment and singles

## 13. 🔵 ENVIRONMENT — `pdo_sqlite` not enabled

```
Migration execute imports parties products sales and purchases
  -> PDOException: could not find driver
```

**This does not violate the MySQL-only policy.** The test reads a `.sqlite`
*import file* — that is the format Vyapar exports, and importing it is a product
feature. The application database is still MySQL.

### Fix

In `C:\Users\PC\AppData\Roaming\Local\lightning-services\php-8.2.23+0\bin\win64\php.ini`:

```ini
extension=pdo_sqlite
extension=sqlite3
```

Restart, verify:

```bash
php -m | findstr sqlite
```

## Remaining singles

| Test | Failure | Verdict | Action |
|---|---|---|---|
| `Module02\StoreCreationAndProvisioningTest:88` | expected 27 accounts, got 29 | ⚪ DECISION | Two accounts were added to the chart of accounts. **Confirm they are intentional**, then update the test to 29 and add a comment naming them. If unintentional, fix the seeder. |
| `Module14\AiEngineTest:235` | tenant B `regular_customer_min_orders` = 2, expected 3 | ⚪ DECISION | Either a tenant-isolation leak (serious) or the default changed from 3 to 2. Check `PlanFeature` / growth-engine defaults. **If the default really is 2, the test is stale. If it is 3, you have a settings leak across tenants.** |
| `Tools\BarcodeSheetTest` | "The response is not a streamed response" | 🔴 CODE BUG | Thermal preset returns a normal response instead of a streamed PDF. Check `BarcodeSheetController` — likely a missing `response()->streamDownload()`. |
| `GoldenAuditTestsTest` ×2, `Golden\GoldenAuditTestsTest` ×1 | `audit:ledger-truth` / `audit:data-integrity` exit 1 | 🔴 CODE BUG | Downstream of items 1, 6 and 7. **Re-run after those are fixed** before investigating separately. |

---

# The 55 incomplete tests — your largest coverage hole

Not failures. Deliberately unfinished tests, marked with `markTestIncomplete()`.

**54 of them are in one file:** `Tester/tests/Feature/V3/Scenarios/ScenarioStubsTest.php`

They cover transaction posting that has **no automated coverage at all**:

```
s003_cash_purchase_creates_batch_at_correct_cost
s005_cash_sale_b1_no_ar
s009_credit_sale_b2_creates_ar
s010_credit_purchase_creates_ap_and_batch
s017_customer_payment_b4_allocates_correctly
s018_partial_payment_sets_badge_to_partial
s020_bounced_cheque_b25_reverts_invoice
s021_bad_debt_writeoff_b26_requires_approval
s025_supplier_payment_b5_allocates
s028_customer_overpayment_blocked
s029_split_payment_cash_and_bank
s049_cash_sale_fifo_spans_three_batches
s053_opening_balance_b19_posts_correctly      <- relates to item 7
s054_account_7000_nets_to_zero                <- relates to item 7
s059_purchase_return_b18_correct
s062_bank_transfer_b16_correct_accounts
s101_stock_transfer_no_journal
s102_stock_writeoff_posts_to_6300
s105_stock_adjustment_gain_posts_to_4200
s013_production_deducts_bom_materials_fifo
s014_sub_assembly_bom_five_levels
s095..s098  production labour / WIP costing
s_report_1100_equals_batch_valuation          <- relates to item 6
s_report_5000_equals_sale_item_batches
s_connection_guard_blocks_offline_writes
s_audit_log_records_full_context
... and 28 more
```

**Cash sales, credit sales, customer payments, supplier payments, purchase
returns, stock transfers, write-offs, bounced cheques, split payments and
production costing have no automated test.** For a POS/ERP, that is the core of
the product.

Note that `s053`, `s054` and `s_report_1100` are stubs for exactly the two
ledger discrepancies in items 6 and 7. The behaviour was never finished *and*
never tested — and now it is broken. That is not a coincidence.

**Recommendation:** before launch, implement at minimum:
`s005`, `s009`, `s017`, `s025`, `s049`, `s053`, `s054`, `s059`, `s_report_1100`.
That is 9 tests covering the money paths most likely to lose a customer's data.

---

# The 6 skipped and 1 risky

## Skipped — conditional guards that fired

These are not disabled. Each found its precondition absent and bowed out rather
than reporting a false pass:

| Test | Why |
|---|---|
| `F17 reversed sale has zero net contribution to pl` | Golden seed data missing |
| `I05 all posted golden sales have journal entries` | Golden seed data missing |
| `Render produces a png for a url` | `imagick` extension not installed |
| `Render svg output` | `imagick` extension not installed |
| `Render returns inline error for empty url not 500` | `imagick` extension not installed |
| `Qr generation requires no email` | `imagick` extension not installed |

**Action:** install `imagick` to recover 4 tests. The 2 Golden ones should
resolve once the seeder is complete — chase them with items 6 and 7.

There are **60 `markTestSkipped()` guards** in the suite; only 6 fired. Most read
`'manifest.json not found'` or `'GL account 1100 not found'`. If the Golden
seeder ever regresses, dozens more will silently skip. A skipped test protects
nothing.

## Risky — a test that asserts nothing

```
B05 zero qty batches excluded from inventory value
  -> This test did not perform any assertions
```

PHPUnit's term for a test that ran and asserted nothing. It can never fail, so
it is coverage theatre — it makes the dashboard look greener than reality.

**Action:** give it a real assertion, or delete it. Ten minutes of work.

---

# How to run the route sweep

You asked why the route tests did not run in the dashboard. Two different things
are involved.

## What the "Routes" section already runs — 27 tests

Static integrity checks, part of every full run:

| Test | What it checks |
|---|---|
| `FullRouteSweepTest` (6) | Ziggy ↔ Laravel drift both ways, all 240 Inertia components exist, every route action resolves, namespace census |
| `ZiggyRouteIntegrityTest` (7) | Every `route()` call in React source is registered |
| `RouteParameterRegressionTest` (1) | Route parameter names match frontend expectations |
| `OwnersDailyPulseTest` (13) | Pulse route registration and access |

## The ~154-route sweep — now added to the dashboard

That is `php artisan audit:ledger-truth`: it boots the app, seeds a Golden Audit
tenant, loads **every `store.*` GET route over HTTP**, and reconciles the
financial numbers on each page against `journal_items`. Fundamentally different
from the static checks — those verify wiring exists, this verifies pages load
and their numbers are true.

**It is in the dashboard now.** Restart the server and hard-refresh:

```
Ctrl+C in the dashboard window
FinalTester\RUN_DASHBOARD.bat
Ctrl+F5 in the browser
```

Two new buttons below the suite row:

- **Ledger-truth route sweep (~154 routes, live HTTP)** — full run with seeding
- **Sweep (skip seed, faster)** — reuses the existing tenant

It has no per-test protocol, so the progress bar deliberately does **not** apply
— output streams to the console panel with a heartbeat, and it reports its own
pass/fail.

Command line equivalents:

```bat
FinalTester\RUN_ROUTE_SWEEP.bat                 :: static + live, both phases
FinalTester\RUN_ROUTE_SWEEP.bat /skip-seed      :: faster re-runs
FinalTester\RUN_ROUTE_SWEEP.bat /no-phase2      :: static only
```

> ⚠️ **Run the sweep only after item 1 is fixed.** Every page it loads will
> return 409 until then, and the results will be meaningless.

### Known gap

`audit:ledger-truth` filters to `store.*` routes only
(`LedgerTruthAuditCommand.php:544`). It does **not** sweep:

| Namespace | Routes | Status |
|---|---:|---|
| `platform.*` | 130 | static only |
| `tools.*` | 52 | covered by `Feature/Tools/*` |
| `marketing.*` | 22 | covered by marketing tests |
| `superadmin.*` | 5 | static only |

The 135 `platform.*` / `superadmin.*` routes are verified to exist and be wired
correctly, but nothing loads them. A runtime error inside a platform controller
would go undetected. Recommended follow-up: a `PlatformSmokeTest` asserting HTTP
200 for each, modelled on `Feature/Smoke/InertiaPageRenderTest`.

---

# Recommended execution order

Work in these batches, re-running between each. Do not do them all at once —
items 1 and 2 will change the failure list dramatically.

### Batch 1 — unblock the suite (expect 103 → ~35)

1. Item 1 — Inertia `version()` environment check
2. Item 2 — `config/inertia.php` `page_extensions`
3. Item 13 — enable `pdo_sqlite`
4. Item 4 — copy `suites.yaml` into FinalTester

```
php artisan config:clear
FinalTester\RUN_ALL_TESTS.bat
```

**Re-triage before continuing.** Many remaining failures are downstream of the 409.

### Batch 2 — security (launch blocker)

5. Item 5 — permission middleware on the 12 real routes
6. Item 5 — baseline the 27 public `tools/*` routes with justifications

```
FinalTester\RUN_SECURITY_TESTS.bat
FinalTester\RUN_GUARDRAILS.bat
```

### Batch 3 — financial integrity

7. Item 6 — account 1100 reconciliation
8. Item 7 — account 7000 opening balances
9. Re-run the Golden audit commands

```
FinalTester\RUN_FINANCIAL_TESTS.bat
FinalTester\RUN_LEDGER.bat
FinalTester\RUN_ROUTE_SWEEP.bat
```

### Batch 4 — code bugs

10. Item 8 — create or remove the 9 missing pages
11. Item 11 — billing flash / cache / trial status
12. Item 12 — SmartCapture `created_via` and stale alias
13. BarcodeSheet streamed response

### Batch 5 — test fixes (only these files may be edited)

14. Item 3 — `ProcurementTest` `uses()`
15. Item 10 — tool lead test isolation
16. Module02 account count — **after confirming 29 is correct**
17. Module14 growth-engine default — **after determining which value is right**

### Batch 6 — coverage

18. Install `imagick` (recovers 4 skipped)
19. Fix the risky test `B05`
20. Implement the 9 highest-value stubs from `ScenarioStubsTest`

---

# Launch gate

Do not go live until all of these hold:

- [ ] `FinalTester\RUN_ALL_TESTS.bat` reports **1358/1358 executed**
- [ ] **0 failed**
- [ ] **0 risky** (a test that asserts nothing is not coverage)
- [ ] Skipped ≤ 2, each with a written justification
- [ ] Incomplete reduced from 55 — the 9 money-path stubs implemented
- [ ] `RUN_ROUTE_SWEEP.bat` passes **both phases**
- [ ] `PermissionBypassGuardTest` green, with every baseline entry justified
- [ ] Account 1100 reconciles to batch value
- [ ] Account 7000 nets to zero
- [ ] No `Inertia page component ... does not exist` anywhere

---

# Reminder on the rules

**Fix the application code, not the test.**

Only these are sanctioned test edits, and each was verified against source
before being listed:

| Item | File | Why it is a test bug |
|---|---|---|
| 3 | `Feature/Module07/ProcurementTest.php` | `uses(RefreshDatabase::class)` binds a trait, not a TestCase |
| 10 | `Feature/Tools/ToolLeadCaptureTest.php`, `ReceiptToolTest.php` | Global count assertion without DB isolation |
| 9 | `Routes/FullRouteSweepTest.php` | `strrpos` matched the wrong `};` — **already fixed** |
| — | `Module02`, `Module14` | ⚪ Only after a human confirms which value is correct |

Everything else: **the test is right, the code is wrong.** A test edited to make
a build green is worse than no test — it still looks like coverage.

If a defect genuinely must ship unfixed, use the waiver-gated quarantine lane at
`Tester/tests/Feature/Production/` rather than deleting or skipping the test.
