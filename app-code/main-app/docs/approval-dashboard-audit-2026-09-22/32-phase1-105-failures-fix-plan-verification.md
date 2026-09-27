# Phase 1 Test Failures — Verified Root Causes and Fix Plan

**Date:** 2026-09-24
**Scope:** The 101–109 non-Phase-1 failures seen in the monolithic `php artisan test` run.
**Purpose:** This replaces the categorized breakdown pasted into chat (35 SSR / 28 plan-gating / 26 DB-pollution / 16 hardware-mock = 105). That breakdown does not match any file in the repo and several of its claims are contradicted by the actual test code. Below is what the evidence in the repo actually supports, and a concrete fix list for an IDE agent to execute.

---

## 0. First: the numbers don't agree with each other, and that has to be resolved before anything is "fixed"

Three different artifacts in `docs/approval-dashboard-audit-2026-09-22/` report **three different failure counts** for what is supposedly the same comparison:

| Source | Baseline failures | Current failures | Shared | Fixed | Current-only (regressions) |
|---|---|---|---|---|---|
| `full-suite-comparison.json` (monolithic run, 2026-09-23 09:16) | 109 | 101 | 86 | 14 | 0 |
| Doc 24, sharded/isolated-DB run (2026-09-23) | 104 | 93 | — | 11 | 0 |
| Your pasted summary | — | "105" | — | — | 0 (claimed) |

86 + 14 = 100, not 101 — the JSON's own breakdown doesn't sum to its own total. The pasted 4-category table (35+28+26+16=105) doesn't match either document's failure count (101 or 93) and isn't sourced from any file I could find in `docs/approval-dashboard-audit-2026-09-22/` or `docs/testing/`. It looks like it was written by inspection/guess rather than generated from the actual JUnit/Pest output.

**Action item 0:** Before trusting any "N tests fail for reason X" claim, regenerate a single authoritative run and stop relying on prose summaries of it. See Fix #0 below.

The one number that *is* consistent across both real artifacts and matters most for shipping Phase 1: **current-only failures (regressions) = 0** in both the JSON and doc 24. That part of the claim holds up. The category breakdown does not.

---

## 1. What I verified directly against the code

I read the actual test base classes and three of the specifically-named tests, since those are checkable without running PHP.

### 1a. "Monolithic Test DB Cross-Pollution (26 tests, pass in isolation)" — contradicted by the code

The claim was that legacy suites insert rows without wrapping in `DatabaseTransactions`, so count assertions see leftover rows from earlier tests in the same run.

`tests/tests/Feature/VenQoreTestCase.php` is the base class applied to nearly every Feature test via the global `pest()->extend(VenQoreTestCase::class)->in(...)` loop in `tests/tests/Pest.php` (every Feature subdirectory except `Smoke, DemoStore, Golden, Module07, Chat, Billing, Module19, Monetization, Money`, which declare their own `uses()` — those also use `VenQoreTestCase` or a sibling, just registered per-file instead of globally).

`VenQoreTestCase` does:
```php
abstract class VenQoreTestCase extends TestCase
{
    use RefreshDatabase;
    protected function refreshTestDatabase()
    {
        ...
        $this->beginDatabaseTransaction();   // every test wrapped, rolled back in teardown
    }
}
```
This is Laravel's standard per-test transaction rollback — stronger isolation than `DatabaseTransactions`, not an absence of it. Both examples the pasted summary named — `Module13\DashboardTest` and `Phase3SalesScenariosTest` — are Feature tests and would get this base class by default.

I also opened `PlanGatingAndLimitsTest.php` directly (one of the tests blamed on the same mechanism, under a different category in the summary) and it explicitly does `use DatabaseTransactions;` at the top of the class.

**Conclusion:** the "missing transaction wrapper → row leakage" explanation is very likely wrong as stated. If these tests really do fail only in the full run and pass in isolation, the cause is something else — a shared global (`Cache::flush()` interaction, a static/singleton with process-lifetime state, a `Carbon::setTestNow()` left set by a preceding test, a queue/job side effect under `QUEUE_CONNECTION=sync`, or genuine execution-order dependence through a seeded table that RefreshDatabase does NOT reset because it's seeded once per process — see `RefreshDatabaseState::$migrated` in `VenQoreTestCase::refreshTestDatabase()`). That last one is the real candidate worth checking first: `plans`/`plan_limits`/`plan_features` are seeded **once per test process**, not per test, so any test that *mutates* seeded plan/plan_limit rows instead of tenant-scoped rows would leak state across tests despite the transaction wrapper being correct. Doc 24 already partially disproves the pure "monolithic-only" theory anyway: it re-ran everything sharded with dedicated per-shard databases and most of baseline's 104 failures were still there (93 remained in current) — a real fixture-collision theory would predict most of them disappearing under sharding, and they didn't.

### 1b. "Public Marketing / SSR Daemon Expectation Tests (35 tests)" — partially right, partially mischaracterized

I read `MarketingSsrTest.php` in full. The actual assertion is:
```php
config(['inertia.ssr.enabled' => false]);
$response = $this->get($url);
$response->assertStatus(200);
$this->assertTrue(config('inertia.ssr.enabled'), "...");
```
This does **not** assert on rendered SSR HTML content, and does not require a live Node SSR daemon to produce a body. It asserts that visiting a marketing route flips the `inertia.ssr.enabled` config flag from `false` back to `true` — i.e. it's testing that some piece of app code (a middleware, service provider, or controller) turns SSR on for marketing routes specifically. If that flag-flipping code was removed, refactored, or now gated behind something else (e.g. an env check, a different config key, a provider that no longer boots in the test env), the assertion fails for a config/wiring reason, not because "no SSR daemon is running." Whether an actual daemon is involved at all depends on code this session hasn't read yet (whatever sets `inertia.ssr.enabled` at runtime). Treat the daemon explanation as unconfirmed until that code is checked (Fix #2 covers this).

### 1c. "Pre-Existing Plan Gating / Tier Definition Mismatches (28 tests)" — plausible, needs the actual diff

`PlanGatingAndLimitsTest` and `FullRouteSweepTest` are both real, well-documented tests with a legitimate, named purpose (not flaky scaffolding):
- `FullRouteSweepTest`'s own doc-comment says exactly what it catches: routes added to `routes/web.php` without `php artisan ziggy:generate` being re-run afterward, stale `ziggy.js` entries pointing at deleted routes, `Inertia::render()` calls pointing at missing `.jsx` files, and routes wired to nonexistent controllers. This is very likely a real, valid gap in this codebase — not a test that "checks hardcoded 2025 limits" the way the summary implies for the whole category. It is its own named test with its own job.
- I didn't get to the `sku_limit`/`config('plans.php')` mismatch claim specifically — that part of category 2 needs the same treatment: read the test's actual assertion and the current `config/plans.php` values side by side, not assume.

### 1d. Categories 4 (hardware mocks) — not yet verified

`TerminalAppIntegrationTest` appears in the JSON's `shared_failures` list (pre-existing on baseline too), so whatever it needs (pairing socket / device secret mock) was already broken before this session's work, consistent with the "pre-existing, not a regression" framing. I did not read this file's setup code to confirm the specific claim about what's missing.

---

## 2. Fix list — in order, for the IDE agent

Give the IDE agent this exact sequence. Do **not** let it "fix" any of these by loosening an assertion, deleting a test, or wrapping a flaky test in `markTestSkipped()` — every fix below is either a real code fix or a real test-environment fix.

### Fix #0 — Get one trustworthy number before touching anything
Run a single canonical full suite (not sharded, not monolithic-vs-baseline diffed) against a fresh migrated DB, and save raw JUnit XML:
```
php artisan test --testsuite=Unit,Feature,Routes,Performance --log-junit docs/testing/current-run-2026-09-24.xml
```
Parse it with a real XML parser (not eyeballing console output — doc 22/23's own history shows console/XML truncation already burned this project once). Get the exact list of failing test IDs. Compare that list — not a re-typed category count — against `full-suite-comparison.json`'s `shared_failures` array. Any test not in that array is new and must be explained before Phase 1 is called done.

### Fix #1 — Investigate the real cross-test pollution mechanism (don't assume `DatabaseTransactions` is missing — it isn't, for anything on `VenQoreTestCase`)
For each of the ~26 tests claimed to be order-dependent:
1. Run it alone: `php artisan test --filter=<TestName>`. Confirm pass.
2. Run the full Feature suite and confirm fail.
3. Bisect: run progressively larger prefixes of the suite until the failure reappears, to find which earlier test leaves state behind.
4. Check specifically whether the earlier test mutates a **process-scoped seeded table** (`plans`, `plan_limits`, `plan_features` — seeded once via `RefreshDatabaseState::$migrated` guard in `VenQoreTestCase::refreshTestDatabase()`, not reset by the per-test transaction rollback if the mutation itself commits outside that transaction, e.g. via `DB::unprepared`, a queued job, or an explicit `DB::commit()`).
5. Fix at the source: the offending test should not mutate shared seed data directly — it should clone/override via `TenantPlanOverride` or a fresh tenant-scoped row, the same pattern `PlanGatingAndLimitsTest::makeTenant()` already uses correctly.

### Fix #2 — Read the SSR-flag-setting code before touching `MarketingSsrTest`
Find what actually sets `config('inertia.ssr.enabled', true)` for marketing routes at runtime (search for `inertia.ssr.enabled` outside the test file — likely a middleware or `AppServiceProvider::boot()` conditional on route name/prefix). Confirm whether:
- that code still exists and still matches on the current route names (`/features`, `/pricing`, `/about`, `/contact`, `/terms`, `/privacy`, `/refund-policy`, `/blog`, `/demo`), or
- it was refactored/removed and the test is now correctly catching a real regression in SSR routing config.
Only if it's confirmed the flag-flip logic is intentionally gone (e.g. SSR was deliberately disabled for marketing pages) should the test itself be updated — and that's a product decision to confirm with the user first, not a silent test change.

### Fix #3 — Regenerate the route registry, then verify `FullRouteSweepTest` and `ZiggyRouteIntegrityTest` for real
```
php artisan route:list --json > route_list.json
php artisan ziggy:generate
```
Re-run both tests. If they still fail after regeneration, read the actual assertion failure message — it will name the specific route(s) causing the mismatch, which tells you whether it's a genuinely new route missing a "sweep story" entry in `FullRouteSweepTest::KNOWN_NAMESPACES`, or a real orphaned/broken route.

### Fix #4 — Plan/tier assertions: diff, don't assume
For every failing assertion in `PlanGatingAndLimitsTest`, `ReportingTiersTest`, `V11PlanGatingAndEntitlementsTest`: print the actual value returned by `config('plans.php')` / `PlanGate::check()` next to what the test expects, for that specific fence/limit. Fix whichever side is wrong — either the config value needs updating to match a deliberate pricing change, or the code path serving that value has a real bug. Do not change the test's expected number without confirming the intended tier definition with the user, since these are pricing-facing limits.

### Fix #5 — `TerminalAppIntegrationTest` and other hardware/legacy-mock tests
Read the test's `setUp()` to see exactly what socket/secret/mock it expects. If it requires a real terminal-pairing service that legitimately isn't part of the test environment, that's a test-infrastructure gap (needs a proper fake/mock harness), not evidence the underlying code is broken. Since this test is in the baseline's pre-existing failures too, it's lower priority than anything that regressed — but "pre-existing failure" is not the same as "safe to ignore forever."

---

## 3. What NOT to do
- Don't delete, skip, or loosen any of these tests to make the number go down. Several (`FullRouteSweepTest`, `RegistryDriftTest`, `MassAssignmentGuardTest`, `PermissionBypassGuardTest`) are explicitly written as regression guards — their whole job is to fail when something rots. A shrinking failure count achieved by weakening them is a false signal, not progress.
- Don't trust a prose "root cause breakdown" (including this one, beyond what's marked verified above) without the IDE agent re-deriving each category from an actual failure message. Categories 1c and 1d in this document are still partially unverified — mark them "assumed, needs confirmation" until Fix #4/#5 produce real diffs.
- Don't re-run tests only in the monolithic full-suite mode going forward for anything you intend to trust — doc 22–24's own history is three consecutive documents fixing "the last run's numbers weren't real" (truncated JUnit, cross-process test collisions, undercounted testcases). Use `--log-junit` with a real XML parse every time, per Fix #0.

## 4. Handoff prompt for the IDE (copy exactly)

> Read `docs/approval-dashboard-audit-2026-09-22/full-suite-comparison.json` and this fix plan in full before making any change.
>
> Execute Fix #0 first and stop. Report the exact new failing-test list (from parsed JUnit XML, not console scrollback) compared against `full-suite-comparison.json`'s `shared_failures` array — list any test present in your new run but absent from that array, since those are unexplained and must be investigated before anything else.
>
> Then work Fixes #1 through #5 in order. For each fix: state what you found (the actual assertion, the actual current value, the actual mutation if any) before applying any change. If a test's expected value needs to change, stop and say so explicitly — do not change test expectations without flagging it, since several of these are pricing/permission-tier assertions.
>
> Never mark a test `skipped`, delete a test, or loosen an assertion to reduce the failure count. A test that fails because it caught a real gap is doing its job.
>
> At the end, report: files changed, the before/after failing-test count from real parsed JUnit output, and a list of any claim in this document you found to be wrong.
