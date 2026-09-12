# Round 5 — the lock UI, and getting the test suite into git

Rules of engagement from the earlier files still apply.

Round 4's backend work was verified correct: 14 keys across 30 routes, an integrity test
that names the missing key and plan, and a walk-the-map test that iterates the constant
rather than a hand-list. Two things are still outstanding.

---

## Fix 1 — The lock UI (Part C5, outstanding since Round 3)

`OneGlanceLayout.jsx` has not been modified in two rounds. Right now a Solo user who taps
Profit & Loss receives a JSON 403 and nothing else — no lock, no price, no button. The
plan gate works; there is no way for the customer to act on it. This is the entire
conversion mechanism and it is the last piece.

### 1a. The frontend cannot see plan features yet — share them first

`HandleInertiaRequests` already shares the tenant's `modules`. It does not share plan
feature flags, so the UI has no way to know which reports are locked. Add a shared prop
alongside `modules`:

```php
'planFeatures' => $tenant
    ? collect(array_unique(array_values(\App\Support\ReportPlanMap::REQUIRED_PLAN_FEATURES)))
        ->mapWithKeys(fn ($key) => [$key => \App\Services\PlanGate::check($key, $tenant)])
        ->all()
    : [],
```

Share only those 14 booleans. Do not share the whole plan-limits table — it contains
commercial configuration the browser has no need for.

### 1b. Two different behaviours, not one filter

- **Module-gated** entries stay filtered out entirely. Absent, no trace. This is what the
  Blueprint copy promises and it must stay true.
- **Plan-gated** entries render **visible, with a lock**, linking to
  `store.billing`.

Do not collapse these into a single `visible` check. They are opposite behaviours and
merging them is how the wrong one gets applied.

Apply in:
- `resources/js/Layouts/OneGlanceLayout.jsx` — the sidebar report links
- the reports index page (locate it — `ReportsLayout.jsx` is the likely host) — locked
  report cards
- wherever the P&L tile is rendered — with `profit_peek` already `true` on Solo, show the
  tile with its headline figure masked and a "See your profit" call to action, rather than
  hiding it

### 1c. One backend test

Add to `tests/tests/Feature/Module/ReportPlanGateTest.php`: an Inertia response for a Solo
tenant shares `planFeatures` containing all 14 keys, with `report_profit_loss` false; the
same for a Scale tenant with it true. Assert against the shared props, not the markup.

---

## Fix 2 — Get the test suite into git

`tests/.gitignore` line 19 is `tests/Feature/*`. Because of it, **240 of 297 test files
are untracked**, including the `Phase3FeatureGatesTest` fix from Round 4, which exists
only on this machine. The 2699-green run cannot be reproduced by anyone else, and any CI
would go red on tests nobody can see.

1. Report what that rule was originally protecting. Check the git history of
   `tests/.gitignore` and say what the entry was for — there may be a vendored or
   duplicated `Tester/` copy it was meant to exclude, in which case the rule is simply
   too wide.
2. Report the counts before changing anything:

```bash
git ls-files "app-code/main-app/tests/**/*Test.php" | wc -l
find app-code/main-app/tests -name "*Test.php" | wc -l
```

3. Narrow the rule to whatever it was actually meant to exclude, then add the real
   suites. If the original intent cannot be determined, do not guess — report it and
   stop, and in the meantime `git add -f` only these, which encode decisions made in this
   engagement and must not be lost:

```
tests/tests/Feature/Phase3FeatureGatesTest.php
tests/tests/Feature/PlanGatingAndLimitsTest.php
tests/tests/Feature/V11PlanGatingAndEntitlementsTest.php
tests/tests/Feature/RouteParameterRegressionTest.php
tests/tests/Feature/ZiggyRouteIntegrityTest.php
tests/tests/Feature/Guardrails/PermissionBypassGuardTest.php
tests/tests/Feature/Billing/RefundWebhookTest.php
tests/tests/Feature/Billing/SubscriptionStatusMappingTest.php
```

4. Report the counts again afterwards.

---

## Then

```bash
& "C:\Users\PC\AppData\Roaming\Local\lightning-services\php-8.2.23+0\bin\win64\php.exe" vendor/bin/pest --configuration tests/phpunit.xml --no-coverage --log-junit tests/reports/junit-round5.xml
npm run build
```

Summary line and every failure, raw, with test names exactly as the runner printed them.
Commit, push, and list every file in the commit. **`OneGlanceLayout.jsx` must appear in
that list** — if it does not, say why rather than omitting it silently.

No readiness score, no percentage, no verdict.
