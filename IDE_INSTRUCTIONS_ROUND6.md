# Round 6 — the verification round

Rules of engagement from the earlier files still apply.

Round 5 was good: the lock UI is wired through existing components rather than new ones,
`OneGlanceLayout.jsx` is in the commit, and the test-tracking fix is real — 59 tracked
files to 299, with the ignore rule narrowed to genuine artifacts and the original intent
(the `Tester/tests` sync workflow) actually investigated rather than guessed at.

Three things left. The third is the important one.

---

## Fix 1 — Bind the JS report map to the PHP one

`resources/js/lib/reportPlanMap.js` is a hand-copied duplicate of
`App\Support\ReportPlanMap`. There are now two sources of truth for the same mapping and
nothing checks that they agree. Add an entry to the PHP map and the JS copy goes stale
silently: the report renders unlocked, the customer clicks it, and the server 403s. That
is the exact bug class of the last two rounds — a key in one place and not another —
reintroduced by the fix for it.

They happen to agree today. Make that enforced rather than lucky.

Add `tests/tests/Feature/Module/ReportPlanMapParityTest.php`:

- Read `resources/js/lib/reportPlanMap.js` from disk.
- Extract its `REPORT_PLAN_FEATURES` pairs (a regex over `'route.name': 'feature_key'` is
  fine — this does not need a JS parser).
- For every suffix in `ReportPlanMap`, assert the JS map contains `store.reports.<suffix>`
  (or the `store.v3.reports.<suffix>` variant) and that it maps to the **same** feature key.
- Assert the reverse too: every feature key referenced in the JS map appears in the PHP map.
- Fail with the offending route name and both key values in the message.

If you would rather generate the JS file from the PHP constant at build time, that is
better still — say so and do that instead. Either way the two must not be able to drift.

---

## Fix 2 — Run the frontend test suite

Round 5 modified six components — `SidebarItem`, `OneGlanceLayout`, `ReportsLayout`,
`ReportsHub`, `ReportsNavigation`, `DashboardCardFrame` — and the only frontend check run
was `npm run build`. A successful build means it compiles, not that it behaves. The
frontend suite has not been run once in any round of this engagement.

```bash
npm test
```

Report the raw summary and every failure. Then add coverage for the new behaviour, in
whatever the project's existing frontend test style is:

- A plan-gated report renders with a lock and links to billing.
- A module-gated entry does not render at all.
- `isReportLocked` returns false when `planFeatures` is missing or empty — the UI must
  fail **open** so a prop-loading hiccup never hides a paid customer's reports.

---

## Fix 3 — Prove the 26 findings, one by one

This is the last real unknown in the codebase.

`R01`–`R26` were declared "100% resolved, READY FOR LAUNCH". The only thing that ever
confirmed that was `master_verify.php` — a script written by the same agent whose work it
graded, edited seven times until every line printed PASS, at a point when no test suite
was running and the database was unreachable. Since then, work from that same period has
been found to contain a bug that broke store creation entirely, eighteen plan keys that
gated nothing, and a UI layer reported complete twice without being touched.

None of that means the 26 are wrong. It means they are unverified.

They are testable now: there is a working database, a 2700-test suite, and the probe
harnesses in `docs/prelaunch-audit-2026-09-12/`.

### 3a. Produce a traceability table

Create `docs/prelaunch-audit-2026-09-12/R01-R26_TRACEABILITY.md`. One row per finding:

| ID | Claim | Automated test that proves it | Status |
|---|---|---|---|

`Status` is one of exactly three values, and **"the code looks right" is not one of them**:

- **PROVEN** — a named, existing, currently-passing test asserts the behaviour. Give the
  file and method name. A test that asserts a method exists, or that a config key is
  present, does not prove behaviour.
- **NOT COVERED** — no test asserts it. This is an acceptable and expected answer. Say so
  plainly.
- **REGRESSED** — you checked and it is no longer true.

Do not mark anything PROVEN by reading source. Run the test and cite it.

### 3b. Then write tests for the P0s that come back NOT COVERED

The nine P0s are R01, R02, R03, R04, R05, R06, R07, R17, R25. For each one still
uncovered, add a behavioural test. Suggested shapes:

- **R01** — a Solo tenant with `inventory` and `bank_accounts` off gets 403 on the
  warehouse and bank-account endpoints, and on returnable-sales lookup.
- **R04** — with the AI gateway forced to fail (rate limit or spend cap), a "I work alone"
  input does **not** produce the 11-module `field_service` preset; assert the resolved set
  against the stated facts.
- **R05** — `StoreProvisioner::create()` with an explicit empty `modules` array produces a
  lean workspace, not the five-module default.
- **R06** — `reminders.count`, `recurring_invoices.revenue`, `returns.qty` and
  `returns.value` are unavailable for a Solo tenant with those modules off.
- **R07** — no route reachable from the command palette returns 501.
- **R02 / R17** — frontend tests, per Fix 2.

Report each new test with its raw output. If a P0 turns out to be genuinely unfixed,
that is the single most useful thing this round can produce — say so and stop rather than
fixing it silently in the same pass.

---

## Then

```bash
& "C:\Users\PC\AppData\Roaming\Local\lightning-services\php-8.2.23+0\bin\win64\php.exe" vendor/bin/pest --configuration tests/phpunit.xml --no-coverage --log-junit tests/reports/junit-round6.xml
npm test
npm run build
```

Both summary lines, raw, and every failure. Commit, push, list the files.

The deliverable this round is the traceability table, not a green run. A table with
honest NOT COVERED rows is worth more than one with twenty-six PROVENs I cannot check.

No readiness score, no percentage, no verdict.
