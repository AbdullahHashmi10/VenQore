# VenQore — Engineering Plan to 100% Launch-Ready

**Prepared:** 2026-07-08, by independent verification against your actual files, migrations, and git history (not the changelog). Manual/human go-live steps are separate — see `MANUAL_LAUNCH_CHECKLIST.md`. This is the engineering punch list only.

---

## 🔴 P0 — Blocking. Do these first, in order.

### 1. Resolve the dual-state repo problem
**What I found:** while verifying `Tester/tests/Feature/Guardrails/SaleFinancialValueGuardTest.php`, my file-read tool consistently showed 4 test methods (333 lines — credit sale, reversal, purchase, plus the original), while shell commands against the identical path consistently showed only 1 method (123 lines). Repeated checks, same disagreement every time. Most other files I spot-checked agreed between the two views, but this one didn't, which means two different pictures of your repository exist right now.

**Why it matters:** nothing else on this list — not the test suite, not a build, not a deploy — means anything until there's exactly one live copy of this project being edited.

**Steps:**
1. Close any other Claude/Cursor/IDE/agent session that might have this project open.
2. Check for orphaned `php`, `node`, or `git` processes in Task Manager.
3. Confirm there's no `.git/index.lock` file sitting in the repo.
4. In one terminal, run `git status` and `Get-Content "Tester/tests/Feature/Guardrails/SaleFinancialValueGuardTest.php" | Measure-Object -Line`. It should show 333 lines / 4 test methods (the more complete version — the shorter one is missing the credit-sale, reversal, and purchase value guards).

**Done when:** the same file, checked twice, shows the same content both times.

### 2. Land the file-corruption fix for real
**What I found:** during this session I found and stripped trailing NUL-byte padding from **99 files** — not just `routes/web.php` (which the prior session's changelog wrongly claimed was already clean), but `composer.json`, `bootstrap/app.php`, core controllers (`SaleController.php`, `PosController.php`, `SuperAdminController.php`), core models (`Sale`, `Payment`, `Stock`, `Invoice`, `JournalEntry`, `Tenant`), `routes/api.php`, `routes/console.php`, both Guardrails baseline JSON files, and several production frontend files (`app.jsx`, `Pos.jsx`, `Dashboard.jsx`, `public/sw.js`). I verified every one against the git-committed version byte-for-byte first — real content was intact, this was purely appended garbage — so stripping it was safe.

**Why it matters:** a trailing NUL byte after valid code/JSON is enough to break a strict parser (JSON especially) or just be landmine junk in source control. It also means whatever wrote these files originally (some tool in a prior session, or a sync layer) may still be active — see item 1.

**Steps:**
1. After item 1 is resolved, re-scan the real file system for trailing `\x00` bytes across `.php`/`.json`/`.js`/`.jsx`/`.md` files (excluding `vendor/`, `node_modules/`, `.git/`, `storage/`).
2. Strip any found, confirm byte-for-byte match against `git show HEAD:<path>` first.
3. Commit as its own standalone commit — don't bundle with other work, so it's easy to isolate if anything regresses.

**Done when:** `git status` is clean of "corruption" diffs, and the scan finds zero files ending in NUL bytes.

### 3. Fix the PaymentAllocation semantic bug (R6 — confirmed still open)
**What I found:** `app/Services/PurchaseService.php::recordPurchasePayment` writes a `Payment` record's own id into `PaymentAllocation.payment_journal_entry_id` — a column that's supposed to hold a journal entry id. There's a real MySQL `BEFORE INSERT` trigger (`chk_allocation_insert`) that looks up `journal_items WHERE journal_entry_id = NEW.payment_journal_entry_id` to enforce over-allocation limits. Feed it a Payment id instead of a journal entry id and the lookup finds nothing, `v_payment_total` becomes `NULL`, and the `> ` comparison against `NULL` is never true in MySQL — so the guard silently never fires. This is exactly the "silent $0 / silent corruption" bug class this whole hardening effort was meant to kill, and it survived two rounds of review.

**Made worse, not better, by the last session:** the new test `Tester/tests/PaymentAllocationTest.php` (line 66) asserts `$allocation->payment_journal_entry_id === $payment->id` — i.e. it locks the bug in as the expected, passing behavior. Anyone who fixes it correctly later will break this test and may revert the fix.

**Scope:** `PurchaseService` isn't wired to any controller or route right now (confirmed — nothing outside its own file and this one test references it), so today it's unreachable from production. That limits the blast radius, but not the correctness problem, and it will bite the moment someone wires it up without re-checking this.

**Steps:**
1. In `recordPurchasePayment`, create or resolve a real `JournalEntry` for the purchase payment (mirror how `V3\PaymentService::allocate` receives `$journalEntry->id` from its callers — that pattern is correct).
2. Pass that journal entry id into `PaymentAllocation::create(['payment_journal_entry_id' => ...])`, not `$payment->id`.
3. Rewrite `PaymentAllocationTest.php` line 66 to assert against the journal entry id.
4. Add a new test asserting that allocating more than the journal entry's total actually throws/fails (right now nothing proves the trigger works on this path at all).

**Done when:** the allocation row references a real journal entry, and an over-allocation attempt on the legacy purchase path actually fails.

### 4. Review and commit the 72-file uncommitted diff
**What I found:** the working tree has substantial changes beyond the last commit (`3b2e3c5`, which only removed debug routes) — `app/Support/Guardrails/MassAssignmentAnalyzer.php` (+222/-lines), `SaleFinancialValueGuardTest.php`, `MassAssignmentGuardTest.php`, several controllers and models, plus doc/dashboard files. This is real engineering work sitting unprotected in the working directory.

**Steps:** once item 1 confirms which file states are real, go through `git diff` file by file, confirm each change is intentional, and commit in logical groups with real messages — not one giant "various fixes" commit.

**Done when:** `git status` is clean or fully staged with reviewed, described commits.

---

## 🟠 P1 — Should fix before launch

### 5. Run `php -l` across the whole repo
I have no PHP interpreter in my environment, so I could only verify `routes/web.php` structurally with an external JS-based PHP parser — I could not do this for the other 98 files I touched.
```
Get-ChildItem -Recurse -Filter *.php -Exclude vendor,node_modules | ForEach-Object { php -l $_.FullName } 2>&1 | Select-String -NotMatch "No syntax errors"
```
**Done when:** no output (every file parses clean).

### 6. Run the real test suite + guard
```
"E:\Software\Xampp\php\php.exe" vendor/bin/pest --configuration Tester/phpunit.xml --no-coverage
"E:\Software\Xampp\php\php.exe" artisan audit:mass-assignment
```
I verified R1 (tests are in the right folder with the right namespace/base class), R3 (activity log columns genuinely exist and match the trait's writes), R7 (value guards cover sale/credit-sale/reversal/purchase with real assertions), and R8 (tenant-scope exceptions are deliberately documented, not oversights) by reading the code directly — these look solid. But nobody has run the suite itself since these fixes landed. Do that now.

**Done when:** suite green, guard exits 0.

### 7. R4 — migrations vs production schema diff
Still unverifiable from my side (no access to your production DB). Original steps stand:
```
mysqldump --no-data venqore_pos > prod_schema.sql
mysql -e "CREATE DATABASE schema_check"
# point a scratch .env at schema_check, then:
php artisan migrate
mysqldump --no-data schema_check > migrated_schema.sql
diff migrated_schema.sql prod_schema.sql
```
**Done when:** diff is empty.

### 8. Remove the silent exception-swallow in `HasActivityLog`
The trait's write is now schema-correct (verified), but still wrapped in `catch (\Exception $e) { /* ignore */ }`. That means a *future* schema drift will silently kill your audit trail again with no signal. Replace the empty catch with at least a `Log::error(...)`, or narrow it to a specific `QueryException` check.

---

## 🟡 P2 — Nice to have, can trail launch

### 9. Guard against `PurchaseService` ever being wired up unreviewed
Since it's currently dead code with a live correctness bug (item 3), add a note in code review guidelines / CI: if a PR adds a route to `PurchaseService`, block it until the payment_journal_entry_id fix is confirmed.

### 10. Add a corruption check to CI
A one-line grep for NUL bytes (`\x00`) in tracked text files, run pre-commit or in CI, would have caught the 99-file corruption in item 2 automatically instead of requiring a manual audit.

---

## Suggested order
1 (resolve dual-state) → 2 (land corruption fix) → 4 (commit real work) → 3 (fix R6) → 5, 6 (lint + test suite) → 7 (schema diff) → 8 → 9, 10 as time allows.
