# VenQore — Remediation Round 2

**Run:** 2026-08-02 22:12 · 1330/1330 executed · **1267 passed** · **13 failed** · 4 skipped · 46 incomplete · 0 risky · 6678 assertions · 402s
**Route sweep:** 248 routes scanned · 185 PASS · **0 MISMATCH vs ledger** · 54 ALL_ZEROS · 5 HTTP errors · exit 1

> **Round 1 → Round 2: 103 failures → 13.** The Inertia version fix and the
> `page_extensions` config fix landed and cleared 68 failures between them.
> Risky is now 0. Nothing regressed.

---

## Verdict tags

| Tag | Meaning |
|---|---|
| 🔴 **CODE BUG — DO NOT TOUCH THE TEST** | Test is correct. Fix the application. |
| 🟠 **CONFIG / HARNESS** | Configuration or test-infrastructure path. Not product logic. |
| 🟡 **TEST BUG — fix the test** | Verified against source. Safe to edit. |
| 🔵 **ENVIRONMENT** | Local machine. No repository change. |
| ⚪ **NEEDS A DECISION** | A human must choose. |

---

## Summary of the 13

| # | Failure | Cause | Verdict |
|---|---|---|---|
| 1 | 3 stale Ziggy entries | routes deleted, `ziggy:generate` not run | 🟠 **30-second fix** |
| 2 | `SuiteIntegrityTest` — `Golden/tests` missing | guards a path that no longer exists | 🟡 TEST BUG |
| 3 | `RegistryDrift` ×2 — 46 files unregistered, 1583 vs 1385 | `suites.yaml` never regenerated | 🟠 HARNESS |
| 4 | `PermissionBypassGuard` — 2 billing routes | **real authorization hole** | 🔴 SECURITY |
| 5 | `S054 account 7000 nets to zero` — found 13,200.50 | **real ledger defect** | 🔴 CODE BUG |
| 6 | `F17 reversed sale` — no reversed entries | Golden seeder drift | 🔴 CODE BUG |
| 7 | `I05 all posted golden sales` — no TXN-* sales | Golden seeder drift | 🔴 CODE BUG |
| 8 | `GoldenAuditTests :: Ledger truth audit` exit 1 | downstream of the sweep | 🔴 (resolves with #12) |
| 9 | `SubscriptionStatusMapping` — trial vs active | **revenue impact** | 🔴 CODE BUG |
| 10 | VenSynQ `t16_universal_callback` → 404 | route/test mismatch | ⚪ DECISION |
| 11 | `BarcodeSheetTest` — not a streamed response | test expects streaming, code returns normal | ⚪ DECISION |
| 12 | `MigrationTest` — could not find driver | `pdo_sqlite` off | 🔵 ENVIRONMENT |
| 13 | Route sweep exit 1 | 5×404 + 54 ALL_ZEROS + floor breach | mixed — see Part B |

**Items 4, 5, 6, 7 and 9 are the launch blockers.** Everything else is
housekeeping or a decision.

---

# PART A — The 13 test failures

## 1. 🟠 Three stale Ziggy entries — do this first, it takes 30 seconds

```
resources/js/ziggy.js contains route names that no longer exist in Laravel:
  - store.pos.open
  - store.pos.close
  - store.sales.get-items
```

Your IDE removed these routes in Batch 1/2 — confirmed in `routes/web.php`:

```php
// line 359:  pos.open / pos.close removed 2026-08-02 — see PosController note above.
// line 1365: sales.get-items removed 2026-08-02 — no frontend caller, returned full …
```

The routes are gone; `ziggy.js` still advertises them. Any `route('store.pos.open')`
left in the React source produces a dead URL.

### Fix

```bash
php artisan ziggy:generate
npm run build
```

**This is exactly the failure mode `FullRouteSweepTest` was written to catch,
and it caught it on the first real run.** `CLAUDE.md` already mandates
regenerating Ziggy after any route change — this is that rule being enforced.

### 🔴 DO NOT TOUCH THE TEST.

---

## 2. 🟡 TEST BUG — `SuiteIntegrityTest` guards a directory that no longer exists

```
Expected E:\AMD POS\AMD POS\FinalTester/Golden/tests to exist as the archived
dead-copy location this test guards. If it was intentionally removed, delete
this test rather than letting it silently assert nothing.
```

The test's own message tells you what to do. It guards `Tester/Golden/tests` —
an archived dead copy — and asserts no runnable `*Test.php` hides there. Two
things changed:

1. Running from FinalTester, `testerRoot()` resolves to `FinalTester/`, so it
   looks for `FinalTester/Golden/tests`, which never existed.
2. The archived copy was cleaned up, so the guard has nothing left to guard.

### Fix — Option A (preferred): delete the test method

The original author anticipated this and wrote the instruction into the failure
message. The dead copy is gone; the guard is obsolete.

Delete `test_no_test_files_hide_outside_the_live_tree` from
`Tester/tests/Feature/Core/SuiteIntegrityTest.php`. Leave the rest of the class.

### Fix — Option B: re-point it at the real tester root

If you want to keep guarding for stray test files, change `testerRoot()` to
resolve `Tester/` explicitly rather than relative to the running suite, and
`skipIf` when the directory is absent.

Option A is honest. A guard over a directory that cannot exist is noise.

---

## 3. 🟠 HARNESS — `suites.yaml` registry is stale

Two failures, one cause.

```
Live test files not present in suites.yaml (registry drift):  [46 files]
Registry declares 1583 phpunit test methods but the filesystem has 1385.
```

> **Note the number: 1583.** That is where your original "1583 tests" figure came
> from — a hand-maintained registry that has been out of date for a long time.
> The filesystem has 1385 methods; PHPUnit collects 1330 executable tests. The
> registry was never the truth.

The 46 unregistered files are all legitimately live — Billing, Chat, Tools,
Module19, Routes. They were added after `suites.yaml` was last generated.

### Fix

Regenerate the registry with its Phase B generator, then copy it into FinalTester
so `RegistryDriftTest` can find it from either tree:

```bat
:: regenerate (find the generator — likely artisan or a script under Tester/)
php artisan verify:generate-registry
:: or whatever the Phase B generator command is

mkdir "FinalTester\VerificationCenter\registry"
copy "Tester\VerificationCenter\registry\suites.yaml" "FinalTester\VerificationCenter\registry\"
```

Then add that path to `FinalTester/Scripts/sync.php` so it stays current.

**If the generator no longer exists,** this test is guarding a registry nobody
maintains. In that case delete `RegistryDriftTest` and record the decision — a
drift guard against an abandoned artifact produces permanent red for no benefit.
⚪ That is a decision for you.

---

## 4. 🔴 SECURITY — two billing routes still unprotected

```
NEW state-changing route(s) shipped WITHOUT permission: middleware —
real authorization hole:
  - POST s/{store_slug}/billing/cancel-subscription
  - POST s/{store_slug}/billing/resume-subscription
```

Down from 39 to 2 — good progress. But these two are the worst of the original
list. **Any authenticated staff member, including a cashier, can cancel the
store's subscription.**

### Fix

In `routes/web.php`, on both routes:

```php
Route::post('/billing/cancel-subscription', [BillingController::class, 'cancel'])
    ->middleware('permission:billing.manage')
    ->name('billing.cancel-subscription');

Route::post('/billing/resume-subscription', [BillingController::class, 'resume'])
    ->middleware('permission:billing.manage')
    ->name('billing.resume-subscription');
```

Note `billing/sync-subscription` was fixed in the last batch — apply the same
permission key for consistency.

### 🔴 DO NOT BASELINE THESE.

The baseline is for genuinely public routes (the `tools/*` set). Cancelling a
paid subscription is not public.

---

## 5. 🔴 CODE BUG — account 7000 does not net to zero

```
Account 7000 must net to zero after B19 opening entries — found 13200.5.
ScenarioStubsTest.php:397
```

**This is now a real implemented test, not a stub.** Your IDE implemented
`S054` — that is why it moved from "incomplete" to "failing", and why incomplete
dropped 55 → 46. The test is doing its job on its first run.

Account 7000 is the opening-balance suspense/equity account. It must net to zero
once every opening entry is posted. **Rs. 13,200.50 left over means at least one
opening entry was posted one-sided.**

The figure moved (Rs. 10,000 in Round 1 → Rs. 13,200.50 now), which means the
imbalance tracks the seed data rather than being a fixed constant — consistent
with a posting-path defect, not a stale fixture.

### Investigate

```sql
SELECT je.id, je.entry_date, je.narration,
       SUM(ji.debit) AS dr, SUM(ji.credit) AS cr
FROM journal_items ji
JOIN journal_entries je ON je.id = ji.journal_entry_id
JOIN accounts a        ON a.id  = ji.account_id
WHERE a.code = '7000'
GROUP BY je.id, je.entry_date, je.narration
HAVING dr <> cr
ORDER BY je.entry_date;
```

Then read the B19 opening-balance posting path in
`app/Services/V3/AccountingService.php` and `MigrateOpeningBalances`.

**Do not change the tolerance.** Zero is the correct expectation for a suspense
account.

---

## 6 & 7. 🔴 CODE BUG — the Golden seeder is not producing sales or returns

Two failures, one cause.

```
F17: No reversed entries found in Golden Company — seed may not include sale
     returns; GoldenSeedManager guarantees this data exists, so an empty
     result here means the seeder or schema drifted.

I05: [I-05] No TXN-* sales found — GoldenCompanySeeder may not have run;
     GoldenSeedManager guarantees this data exists, so an empty result here
     means the seeder or schema drifted.
```

Both messages were written by someone who anticipated exactly this. The Golden
Company fixture is supposed to contain `TXN-*` sales and at least one reversed
sale. It currently contains neither.

**This matters more than two red tests.** The Golden fixture is the control data
for the entire financial verification suite — 253 tests in the Financial Engine
area depend on it. If it is not seeding sales, a large part of your financial
coverage is asserting against an empty dataset and passing vacuously.

The route sweep corroborates this: **54 routes returned ALL_ZEROS** — pages
rendering with every financial number at zero (see Part B).

### Investigate in this order

1. Does `GoldenCompanySeeder` still run to completion? Run it alone and watch
   for a silent exception:
   ```bash
   php artisan migrate:fresh --env=testing
   php artisan db:seed --class=GoldenCompanySeeder --env=testing
   ```
2. Check the sales it should create:
   ```sql
   SELECT COUNT(*) FROM transactions WHERE reference LIKE 'TXN-%';
   SELECT COUNT(*) FROM journal_entries WHERE is_reversed = 1;
   ```
3. Schema drift is named as a suspect in both messages — compare the columns
   the seeder writes against the current migrations. A renamed column would make
   the seeder fail silently on those rows.

Related: `GoldenSeedManager` is checksum-guarded and seeds once per process. If
the checksum matches a previously-seeded state, it may be **skipping** the seed
entirely. Check that first — it is the cheapest explanation.

---

## 8. 🔴 `GoldenAuditTests :: Ledger truth audit` — exit 1

This test runs `php artisan audit:ledger-truth` and asserts exit code 0. The
sweep is currently exiting 1 for the reasons in Part B.

**Do not investigate this separately.** It will resolve when the sweep passes.
Re-run after items 5, 6, 7 and Part B.

---

## 9. 🔴 CODE BUG — trialling checkout provisions the store as `active`

```
a trialling checkout provisions the store as trial, not active
Failed asserting that two strings are identical.
SubscriptionStatusMappingTest.php:83
```

Carried over from Round 1 and still unfixed. A Lemon Squeezy checkout in
`trialling` state is being written as `active`.

**Revenue impact:** a trialling store is recorded as a paying customer. Trial
conversion metrics are wrong, trial-expiry automation will not fire for these
stores, and they may retain access after the trial ends without paying.

Fix the Lemon Squeezy status → tenant status mapping. `trialling` must map to
`trial`, not `active`.

### 🔴 DO NOT TOUCH THE TEST.

---

## 10. ⚪ DECISION — VenSynQ universal callback returns 404

```
t16_universal_callback_delegates_to_callback_channel_end_to_end
Expected [201, 301, 302, 303, 307, 308] but received 404.
```

`VenSynQController::universalCallback()` exists, and the routes are registered
at **top level**, not under the store prefix:

```php
// routes/web.php:274
Route::get('/amazon/callback', [VenSynQController::class, 'universalCallback'])
    ->name('vensynq.universal.callback.amazon');
Route::get('/tiktok/callback', ...)->name('vensynq.universal.callback.tiktok');
Route::get('/ebay/callback',  ...)->name('vensynq.universal.callback.ebay');
```

The test is one of the **30 rescued orphans** — it sat in the dead `tests/`
folder for months and is only now executing. It was written against an older
URL shape.

**Decide which is right:**

- If callbacks are meant to be tenant-scoped (`/s/{slug}/vensynq/callback/...`),
  the **route** is wrong → 🔴 fix the code.
- If OAuth callbacks are meant to be top-level (usual, since the provider
  redirects to a fixed registered URL), the **test** is stale → 🟡 update it to
  hit `/amazon/callback`.

I lean toward the second — OAuth redirect URIs are registered with the provider
and cannot carry a tenant slug. But confirm against your Amazon/eBay/TikTok app
configuration before changing anything.

---

## 11. ⚪ DECISION — `BarcodeSheetTest :: Thermal preset produces a pdf`

```
The response is not a streamed response.
```

Your IDE explicitly reverted this in Batch 2: *"Reverted BarcodeToolController::sheet()
to standard response()"*. The test still expects `assertStreamedResponse`.

**Decide:**

- If PDFs should stream (better for large sheets — no memory spike, faster
  first byte), the **code** is wrong → restore `response()->streamDownload()`.
- If a normal response is correct, the **test** is stale → 🟡 change it to
  `assertDownload()` / assert `Content-Type: application/pdf`.

Given barcode sheets can be hundreds of labels, streaming is the better
engineering choice. But your IDE reverted it deliberately, so there may be a
reason — check the commit note before flipping it back.

---

## 12. 🔵 ENVIRONMENT — `pdo_sqlite` still disabled

```
MigrationTest :: PDOException: could not find driver
```

Unchanged from Round 1, and your earlier analysis was exactly right: this reads
a **Vyapar backup file**, which is internally SQLite. It has nothing to do with
VenQore's own database, and does not violate the MySQL-only rule in `CLAUDE.md`.

Enable in `E:\Software\Xampp\php\php.ini`:

```ini
extension=pdo_sqlite
extension=sqlite3
```

Verify: `php -m | findstr sqlite`

**If you are not shipping Vyapar migration,** delete the feature and its test
instead — do not leave a permanently red test for a feature nobody uses.

---

# PART B — Route sweep

```
✅ PASS                    185
⚠️ ALL_ZEROS (suspicious)   54
❌ MISMATCH (vs Ledger)      0     <-- excellent
🔴 HTTP Errors               5
🔢 Total Scanned           248
```

## The headline is good news

**Zero ledger mismatches across 185 verified routes.** Every page that rendered
financial numbers reconciled exactly against `journal_items` — revenue,
receivables, payables, COGS, inventory value, trial balance. Your financial
reporting layer is telling the truth.

Note also: **248 routes scanned, not 154.** The sweep is dynamic, so it picked up
every route added since that number was written. The `RUN_ROUTE_SWEEP.bat` banner
text still says ~154 — cosmetic, worth updating.

## B1. 🔴 The 5 HTTP 404s

### `store.purchase-orders.create` — Laravel route-ordering bug

This is a **real defect**, not a test artifact. `routes/web.php:1039-1042`:

```php
Route::resource('purchase-orders', PurchaseOrderController::class)->only(['index', 'show'])->middleware('permission:purchases.view');
Route::resource('purchase-orders', PurchaseOrderController::class)->only(['create', 'store'])->middleware('permission:purchases.create');
Route::resource('purchase-orders', PurchaseOrderController::class)->only(['edit', 'update'])->middleware('permission:purchases.edit');
Route::resource('purchase-orders', PurchaseOrderController::class)->only(['destroy'])->middleware('permission:purchases.void');
```

`show` is registered as `purchase-orders/{purchase_order}` **before**
`purchase-orders/create`. Laravel matches in registration order, so
`/purchase-orders/create` hits the `show` route with `{purchase_order} = "create"`,
model binding fails, and the user gets **404 instead of the create form.**

**Users cannot create a purchase order from this URL right now.**

#### Fix — register `create` before the wildcard

```php
// create/store FIRST — a literal segment must beat {purchase_order}
Route::resource('purchase-orders', PurchaseOrderController::class)
    ->only(['create', 'store'])->middleware('permission:purchases.create');

Route::resource('purchase-orders', PurchaseOrderController::class)
    ->only(['index', 'show'])->middleware('permission:purchases.view');

Route::resource('purchase-orders', PurchaseOrderController::class)
    ->only(['edit', 'update'])->middleware('permission:purchases.edit');

Route::resource('purchase-orders', PurchaseOrderController::class)
    ->only(['destroy'])->middleware('permission:purchases.void');
```

> **Check every other resource split the same way.** This pattern — splitting one
> `Route::resource` across several calls for different middleware — will bite
> anywhere `show` is declared before `create`. Grep for `->only(['index', 'show'])`.

### `store.growth-engine.show` — 404

Route is registered. Likely the sweep's synthetic parameter does not resolve to a
seeded record. Verify manually before treating it as a defect: open a real
growth-engine record in the app. If that works, this is a sweep fixture gap; if
it 404s, it is real.

### `store.vensynq.health`, `.money-pipeline`, `.payouts` — 404

`VenSynQController` has `healthStatus()`, `moneyPipeline()` and payout methods,
and the routes are registered inside the `vensynq` prefix group — but they 404
when hit. Most likely a **method-name mismatch** between the route definition
and the controller (`health` vs `healthStatus`), or a middleware rejecting before
the controller runs.

Check each route's `->uses()` target against the actual method name in
`app/Http/Controllers/VenSynQController.php`.

## B2. ⚠️ The 54 ALL_ZEROS routes — read this together with items 6 & 7

These pages returned 200 with **every financial figure at zero**. The sweep flags
them as unverifiable rather than passing, which is the right call: a page showing
all zeros cannot be reconciled against a ledger.

Affected areas include `store.settings`, `store.pos`, `store.home`,
`store.reports.index`, `store.reports.day-book`, `store.reports.low-stock`,
`store.growth-engine.dashboard`, `store.v3.warehouses.*`, `store.batches.index`,
`store.bank-reconciliation.index`.

**Two possible explanations, and they need separating:**

1. **Legitimate** — many of these are forms and index pages that genuinely have
   no financial props (`store.customers.create`, `store.returns.create`,
   `store.v3.products.create`). Zeros are correct there.
2. **Symptomatic** — if the Golden seeder is not producing sales (items 6 & 7),
   then report pages *should* have numbers and are showing zeros because there
   is no data.

`store.reports.day-book`, `store.reports.low-stock`, `store.reports.expiry` and
`store.growth-engine.dashboard` showing zeros while `store.reports.sales` and
`store.reports.profit-loss` PASS is the tell — **the seed is partial**.

**Fix items 6 and 7 first, then re-run the sweep.** Expect most ALL_ZEROS to
resolve. Whatever remains is legitimately non-financial and should be added to
the sweep's known-non-financial list so it stops flagging them.

## B3. Route scan floor breached

```
Route scan floor breached: scanned 243 < floor 248
```

248 routes discovered, 243 classified — 5 unaccounted for, matching the 5 HTTP
errors. This resolves when B1 is fixed. The floor check is working as designed:
it proves how much the sweep actually swept.

## B4. How to run the sweep

Already wired into the dashboard — two buttons under the suite row:

| Action | What it does |
|---|---|
| **Ledger-truth route sweep** | Full run, seeds the Golden Audit tenant (~40s) |
| **Sweep (skip seed, faster)** | Reuses the existing tenant |

Command line:

```bat
FinalTester\RUN_ROUTE_SWEEP.bat                 :: static phase + live phase
FinalTester\RUN_ROUTE_SWEEP.bat /skip-seed      :: faster re-runs
FinalTester\RUN_ROUTE_SWEEP.bat /no-phase2      :: static only
```

Reports land at `verification/discrepancy_report.md` and
`FinalTester/logs/last-sweep.log`.

### Still not swept over HTTP

`audit:ledger-truth` filters to `store.*` only. **135 `platform.*` and
`superadmin.*` routes** are verified to exist and be wired, but nothing loads
them. Recommended: add `PlatformSmokeTest` asserting HTTP 200 for each, modelled
on `Feature/Smoke/InertiaPageRenderTest`.

---

# PART C — The 31 recovered tests

Six test files were deleted in Batch 1/2 and were **not** in git, any archive
snapshot, the stash, or any of 30 release zips. I confirmed that exhaustively.

**They were recoverable from an unexpected place:** the append-only run ledger
at `Tester/VerificationCenter/runs/*/tests.jsonl` records the name of every test
that has ever executed. All 31 method names came from there and have been
reimplemented against the current controllers.

> That ledger just paid for itself. Whoever built it — keep it.

| File | Tests | Notes |
|---|---:|---|
| `Feature/SolutionsPagesTest.php` | 9 | 6 industry slugs + hub + 404 + sitemap |
| `Feature/FeaturePagesTest.php` | 8 | +1 added: `growth-engine` slug had no test |
| `Feature/BlogPostEngineTest.php` | 7 | +1 added: unpublished/scheduled posts must 404 |
| `Feature/PartnersPageTest.php` | 4 | +1 added: validation rejects incomplete submissions |
| `Feature/RoadmapTest.php` | 3 | exact reconstruction |
| `Feature/InvoiceFooterViralLoopTest.php` | 4 | +1 added: sweeps all 10 export templates |

All written to **`Tester/tests/`** — the source suite. `Scripts/sync.php` will
copy them into FinalTester on the next run.

### ⚠️ One reconstruction could not be completed

`BlogPostEngineTest::blog_show_page_includes_blogposting_json_ld_schema`

The ledger proves this test existed and passed, so `/blog/{slug}` emitted
BlogPosting JSON-LD at some point. **No JSON-LD emitter exists today** in
`BlogController`, `formatPost()`, or the Blog page components.

Either the feature regressed, or it lives somewhere my search missed. I wrote
the test to **fail loudly with that explanation** rather than delete it or
weaken it into a no-op. Read the failure message before acting on it.

### Expected count after these land

**1330 + 35 = ~1365.** Verify with:

```bash
php FinalTester\Scripts\expected.php
```

### Why this happened, and how to stop it

Those six files were **untracked** — never `git add`ed. That is why deletion was
irreversible. Worth a `git status` habit before any cleanup pass, and worth
committing the reconstructions immediately.

---

# Execution order

### Batch 1 — quick wins (~10 minutes)

1. `php artisan ziggy:generate && npm run build` — item 1
2. Enable `pdo_sqlite` — item 12
3. Delete the obsolete `SuiteIntegrityTest` method — item 2
4. Regenerate `suites.yaml` and copy into FinalTester — item 3
5. `git add` the six reconstructed test files

### Batch 2 — security (launch blocker)

6. `permission:billing.manage` on cancel + resume — item 4

### Batch 3 — the seeder, which unblocks the most

7. Fix `GoldenCompanySeeder` / `GoldenSeedManager` — items 6, 7
8. Re-run: expect F17, I05, most of the 54 ALL_ZEROS, and item 8 to clear

### Batch 4 — financial integrity

9. Account 7000 opening-balance imbalance — item 5
10. `trialling` → `trial` status mapping — item 9

### Batch 5 — routes

11. Reorder the `purchase-orders` resource — Part B1
12. Fix the 3 VenSynQ method-name mismatches — Part B1
13. Verify `growth-engine.show` manually — Part B1

### Batch 6 — decisions

14. VenSynQ callback URL shape — item 10
15. Barcode sheet streaming — item 11
16. Update the `~154 routes` banner to 248

---

# Launch gate

- [ ] `RUN_ALL_TESTS.bat` — **0 failed**, 0 risky
- [ ] Expected count ≈ 1365 with the reconstructed tests
- [ ] `RUN_ROUTE_SWEEP.bat` — both phases pass, exit 0
- [ ] Route sweep: 0 HTTP errors, ALL_ZEROS only on genuinely non-financial pages
- [ ] `PermissionBypassGuardTest` green
- [ ] Account 7000 nets to zero
- [ ] Golden seeder produces TXN-* sales and reversed entries
- [ ] Skipped ≤ 2, each justified
- [ ] Incomplete reduced from 46 — money-path stubs implemented
- [ ] Six reconstructed test files committed to git

---

# The rule, again

**Fix the application code, not the test.**

Sanctioned test edits this round, each verified against source:

| Item | File | Why |
|---|---|---|
| 2 | `Core/SuiteIntegrityTest.php` | Guards a directory that no longer exists; the test's own message says to delete it |
| 3 | `Core/RegistryDriftTest.php` | ⚪ Only if the Phase B generator is truly abandoned |
| 10 | `Module19/VenSynQIntegrationT16Test.php` | ⚪ Only after confirming the OAuth callback URL shape |
| 11 | `Tools/BarcodeSheetTest.php` | ⚪ Only after deciding whether PDFs should stream |

Everything else: **the test is right, the code is wrong.**
