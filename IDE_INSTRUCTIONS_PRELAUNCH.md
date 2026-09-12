# Pre-launch instructions for the IDE

Run these in order. Do not skip ahead. Everything below is to be executed from
`E:\AMD POS\AMD POS\app-code\main-app` unless a step says otherwise.

---

## Rules of engagement — read before running anything

These are not optional and they override any instinct to produce a green result.

1. **Do not edit a test to make it pass.** If a test fails, that is the deliverable.
   Report the failure verbatim and stop. A test changed to accommodate the code is
   not evidence of anything.
2. **Do not write a new verification script.** Use the suites that already exist in
   the repository. A script authored to grade this work is not independent.
3. **Paste raw terminal output**, unedited, including warnings and failures. Do not
   summarise into a table, do not compute percentages, do not add a status verdict.
4. **Do not delete any file** — not scratch files, not probe output, not reports.
5. **Do not report a total** ("X/X passed") unless it came from a single command that
   ran the whole suite. Adding up separately-run directories is not a total.
6. If a step cannot complete, say exactly which step and why, and stop there. Do not
   substitute a different check and continue.

---

## Step 0 — Repair `git status`

`git status` is currently returning stale, empty results because the filesystem
monitor is broken. It emits `warning: Empty last update token` and then reports a
clean tree even when ~56 files are modified. Every "working tree is clean" claim from
the last two sessions came from this bug.

```bash
git config --unset-all core.fsmonitor
git config core.untrackedCache false
git update-index --really-refresh
git status --short --untracked-files=no
```

Paste the raw output of the last command. It should list modified files, not be empty.

---

## Step 1 — Snapshot the current state before changing anything

```bash
git rev-parse HEAD
git branch --show-current
git diff --stat
git status --short --untracked-files=all
```

Paste all four outputs raw.

---

## Step 2 — Commit everything to a new branch

The work from the last two sessions is uncommitted and exists only in the working
folder. Get it into git before anything else. Use a **new branch** so the existing
branch is untouched.

```bash
git checkout -b prelaunch/r01-r26-fixes
git add -A "app-code/main-app/app" "app-code/main-app/config" "app-code/main-app/routes" "app-code/main-app/database" "app-code/main-app/resources"
git status --short
```

Review that list, then:

```bash
git commit -m "fix(prelaunch): R01-R26 module gating, route ownership, builder fidelity and UI fail-closed behaviour"
git push -u origin prelaunch/r01-r26-fixes
git rev-parse HEAD
```

Paste the commit hash and the push confirmation.

### Also note (do not act yet, just report)

`tests/.gitignore` line 19 contains `tests/Feature/*`. As a result **240 of the 297
test files on disk are untracked**. That means the test suite cannot be reviewed,
diffed, or reproduced by anyone else, and edits to tests leave no trail.

Report which of these are untracked, without changing the ignore rules yet:

```bash
git status --short --untracked-files=all -- "app-code/main-app/tests" | head -50
```

---

## Step 3 — Get the test database running

The last session searched for `mysqld.exe`, MariaDB folders, MySQL services and
ports 3306–3308 and found nothing, so **no test has actually run to completion in
the last two sessions.** The reason is that this is a **Local (by Flywheel)** setup —
the PHP binary in use is under
`C:\Users\PC\AppData\Roaming\Local\lightning-services\php-8.2.23+0\`. Local's MySQL
is a sibling of that folder and **only runs while the site is started inside the
Local app**, on a per-site port, not 3306.

Do this:

1. Open the **Local** app and start the site that owns `amd_pos_test`.
2. In Local, open that site → **Database** tab → note the **host, port, user,
   password, and socket**.
3. Confirm the binary exists and report the version:

```bash
dir "C:\Users\PC\AppData\Roaming\Local\lightning-services"
```

4. Verify connectivity before running any test, substituting the port from Local:

```bash
& "C:\Users\PC\AppData\Roaming\Local\lightning-services\mysql-8.0.16+6\bin\win64\bin\mysql.exe" -h 127.0.0.1 -P <PORT> -u root -proot -e "SHOW DATABASES;"
```

If the path differs, use whatever `mysql-*` folder the `dir` above listed.

**If you cannot get a database connection, stop here and say so.** Do not proceed to
Step 4 and do not report any test result.

---

## Step 4 — Run the whole suite, once, unmodified

One command. Not a selection of directories.

```bash
& "C:\Users\PC\AppData\Roaming\Local\lightning-services\php-8.2.23+0\bin\win64\php.exe" vendor/bin/pest --configuration tests/phpunit.xml --no-coverage --log-junit tests/reports/junit-prelaunch.xml
```

Report, raw:

- the final summary line (tests, assertions, failures, errors, skipped, risky, duration)
- the **full list of every failing and errored test with its message**
- confirmation that `tests/reports/junit-prelaunch.xml` was written, and its file size

Failures are expected and are the point of this step. Do not fix them yet. Do not
re-run with filters to get a cleaner number.

---

## Step 5 — Fix the remaining fail-open in ModuleService

`R10` was reported as PASS but only two of its three parts are fixed. The unknown-key
case and the `allEnabled()` parity case are correct now. This one is not:

In `app/Services/ModuleService.php`, `allFor()` currently swallows **every**
`Throwable` and returns `[]`, and both `enabled()` and `allEnabled()` treat an empty
map as "all modules on". So a transient database error silently enables every module
for every tenant — and the result gets cached for 300 seconds.

Replace `allFor()` with:

```php
private static function allFor(Tenant $tenant): array
{
    return Cache::remember("tenant_modules:{$tenant->id}", self::TTL, function () use ($tenant) {
        // A genuinely un-migrated table is the only case the safety rail covers.
        // Any other database failure must surface, not silently enable everything.
        if (!Schema::hasTable('tenant_modules')) {
            return [];
        }

        return DB::table('tenant_modules')
            ->where('tenant_id', $tenant->id)
            ->pluck('enabled', 'module_key')
            ->map(fn ($v) => (bool) $v)
            ->toArray();
    });
}
```

Add the import if it is missing:

```php
use Illuminate\Support\Facades\Schema;
```

Also fix the now-false docblock above `enabled()`. It still reads *"Returns TRUE for
an unknown module key. That looks wrong and is not"*, while the code below it returns
`false`. Replace that paragraph so it describes the current fail-closed behaviour.

---

## Step 6 — Re-run and report

```bash
& "C:\Users\PC\AppData\Roaming\Local\lightning-services\php-8.2.23+0\bin\win64\php.exe" vendor/bin/pest --configuration tests/phpunit.xml --no-coverage --log-junit tests/reports/junit-prelaunch-2.xml
git add -A "app-code/main-app/app"
git commit -m "fix(modules): fail closed on database error instead of enabling every module"
git push
git rev-parse HEAD
```

---

## What to send back

Exactly these, raw and unedited:

1. Output of Step 0 `git status --short`
2. The commit hash and push confirmation from Step 2
3. The untracked-tests list from Step 2
4. Whether the database connected, and the port used
5. The **full** Step 4 summary line and every failure message
6. The Step 6 summary line and final commit hash

Do not add a readiness score, a percentage, or a launch verdict. Those are decided
after the raw output is reviewed, not by the tool that produced it.
