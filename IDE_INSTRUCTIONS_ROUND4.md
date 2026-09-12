# Round 4 — make the report gate actually bite, then finish the UI

Rules of engagement from the earlier instruction files still apply.

Round 3 was good work: the plan-first precedence, the regression guard, the ledger test,
the ratchet revert, and leaving the one failure failing were all correct. This round
closes the hole underneath it.

---

## Fix 1 — The plan gate silently does nothing for 18 of 30 reports

`PlanGate::check()` line 74:

```php
$limit = $tenant->getLimit($feature);
if ($limit === null)  return true;      // unknown key → ALLOWED
```

An unregistered feature key is allowed. And 18 of the 30 keys in `ReportPlanMap` do not
exist in `config/plans.php`. Twelve of them exist nowhere in the codebase at all — they
were invented when the map was written:

```
report_account_ledger        report_party_profitability   report_sales_by_party
report_sales_party_group     report_item_by_party         report_party_by_item
report_item_profit           report_category_pl           report_bill_profitability
report_graph_analytics       report_item_discounting      report_expense_by_item
```

Result: a free Solo tenant can still open item-wise profit, bill-wise profit, category
P&L, party profitability, sales by party, the analytics screen, item discounting and
expense-by-item. The suite passes because nothing exercises them.

**Do not "fix" this by flipping `PlanGate` to fail closed.** Every feature in the
application that has no explicit plan key relies on that `null → true`. Flipping it would
lock paying customers out of unrelated features across the whole product. The fix is to
stop having unregistered keys, and to make an unregistered key impossible to add (Fix 2).

### 1a. Collapse the map onto 14 real keys

Thirty keys for thirty routes is what created the drift. Rewrite `ReportPlanMap` to use
these, grouped by what a customer would actually buy:

| Feature key | Report suffixes |
|---|---|
| `report_profit_loss` | profit-loss, gross-profit, cogs, balance-sheet, refund-reasons |
| `report_trial_balance` | trial-balance, account-ledger |
| `cash_flow_report` | cash-flow |
| `stock_valuation` | stock-valuation, inventory-valuation |
| `point_in_time_inventory` | point-in-time-inventory |
| `stock_aging` | stock-aging |
| `report_sales_aging` | sale-aging |
| `customer_insights` | customer-insights |
| `supplier_insights` | supplier-insights |
| `discount_report` | discount, discount-report, item-wise-discount |
| `report_profitability_analysis` *(new)* | party-wise-profit-loss, item-wise-profit, item-category-wise-profit-loss, bill-wise-profit |
| `report_sales_analysis` *(new)* | sale-purchase-by-party, sale-purchase-by-party-group, sale-purchase-by-item-category, item-report-by-party, party-report-by-item, analytics |
| `report_expense_analysis` *(new)* | expense-by-item |
| `report_export` *(new)* | export |

### 1b. Register all 14 in all three places

They must appear, with the same value, in **`config/plans.php`**, in
**`PlanFeatureMatrixSeeder`**, and in a **new migration** that writes the rows for
existing tenants. A key present in one and missing from another is what produced the
`multi_branch` bug.

Values: `false` on `solo`. `true` on `starter`, `core`, `scale`, `trial`, `ltd_1`,
`ltd_2`, `ltd_3`.

Leave `outstanding_balance_grid`, `report_party_statement`, `aged_receivables`,
`aged_payables`, `daily_cash_audit`, `profit_peek` and `double_entry_ledger` alone —
those stay free and are not part of this map.

---

## Fix 2 — Two tests, so this cannot come back

This is the third time a non-existent key has silently mis-gated something
(`multi_branch`, `SendPaymentReminders` guarding on `'invoices'`, now this). Make it a
build failure.

Add `tests/tests/Feature/Module/ReportPlanMapIntegrityTest.php`:

1. **Registry integrity.** For every value in `ReportPlanMap`, assert the key exists in
   `config/plans.php` for every plan slug. Fail with the offending key name in the
   message. Model it on `ModuleRegistryIntegrityTest`.
2. **Every suffix is a real route.** For every key in `ReportPlanMap`, assert a route
   named `store.reports.<suffix>` or `store.v3.reports.<suffix>` is registered.

Extend `ReportPlanGateTest` with:

3. **Walk the whole map.** For each of the 30 suffixes, a Solo tenant with the Reports
   module on gets `403` with `code = plan_upgrade_required`, and a Scale tenant gets a
   non-403. Loop over `ReportPlanMap`'s constant — do not hand-list the routes, or the
   next entry added will be untested again.
4. **The free list stays free.** Same loop shape over the 25 free suffixes from the spec:
   Solo gets a non-403 on every one.

Report the raw output. If any of the 30 fails for a reason other than plan gating (a
route needing seed data, say), say which and why — do not weaken the assertion.

---

## Fix 3 — Part C5, which was skipped last round

None of this was in the Round 3 commit. Right now a Solo user clicking Profit & Loss just
gets a 403 with nowhere to go, which is the whole conversion mechanic missing.

- **`resources/js/Layouts/OneGlanceLayout.jsx`** — module-gated entries stay filtered out
  entirely. Plan-gated entries render **visible with a lock** and link to billing. Two
  different behaviours; do not merge them into one filter.
- **Reports index** — same rule. Locked cards show, with the upgrade CTA.
- **`profit_peek`** (already `true` on Solo) — show the P&L tile with its headline number
  masked and a "See your profit" CTA rather than hiding the tile.
- **`ReportExportController`** — gate on `report_export` and return the same
  `plan_upgrade_required` shape as `EnsureModule`, not a generic 403.
- **`resources/js/Pages/Marketing/Blueprint.jsx`** — one sentence distinguishing the two:
  tools you did not pick are gone; features on higher plans are shown with a lock. The
  current copy promises "absent, not greyed-out" for everything, which is now only true
  of modules.

---

## Fix 4 — The one remaining stale test

`tests/tests/Feature/Phase3FeatureGatesTest.php` line 108 asserts the counter plan (which
aliases to solo) can use `report_profit_loss`. Deliberately false now. Invert to
`assertFalse` and add:

```php
// Changed deliberately: reports are plan-gated as of SPEC_PLAN_GATED_REPORTS.
// counter aliases to solo, and solo no longer includes profit reporting.
```

---

## Fix 5 — Abuse controls on the unauthenticated AI endpoint

`POST workspace/converse/deepen` stays **public** — it is the pre-signup builder
conversation and requiring auth would break the funnel. The risk is cost, not access.

- Add Turnstile verification to the endpoint (the app already has a `turnstile`
  middleware — see the marketing contact and newsletter routes).
- Tighten the throttle below the current `30,1`.
- Add a daily spend ceiling that degrades to the deterministic fallback rather than
  calling the model once the cap is hit, and log when it trips.

Report what limits you set; do not invent a budget figure.

---

## Then

```bash
& "C:\Users\PC\AppData\Roaming\Local\lightning-services\php-8.2.23+0\bin\win64\php.exe" vendor/bin/pest --configuration tests/phpunit.xml --no-coverage --log-junit tests/reports/junit-round4.xml
npm run build
```

Summary line and every failure, raw. Paste test names exactly as the runner printed them.
Then commit and push, and list every file in the commit so the C5 frontend work can be
seen to be there.

No readiness score, no percentage, no verdict.
