# IDE Instructions — Round 9: the report gate is not connected. Wire it, then fix the counts.

Authority: `SPEC_REPORTING_TIERS_FINAL.md`. This round supersedes the earlier draft of
this file — an audit of the actual code found the problem is much bigger than stale
marketing copy.

---

## The audit — what was actually measured

Counted from the code, not from the spec:

- **`ReportsHub.jsx` links 40 distinct reports.** The "40" in the spec is correct.
- **`ReportPlanMap.php` maps all 40**, with no unmapped entries. The map itself is good.
- **`ReportPlanMap` is referenced by ZERO files in `app/`.** It is a dead constant. Nothing
  enforces it.
- Enforcement is actually the per-route `plan.feature:` middleware in `routes/web.php`,
  and it was written before the re-cut. Against the 40 hub reports:

| | Count |
|---|---|
| Correctly gated (route key == `ReportPlanMap` key) | **2** |
| No `plan.feature` middleware at all | **10** |
| Gated by the wrong feature key | **28** |

- Of those 28 wrong keys, **19 name a key that does not exist in `config/plans.php`.**
  `PlanGate::check()` line 74 is `if ($limit === null) return true;` — **an unknown key
  opens the gate.** So those 19 are wide open to everyone.

**Net effect: 34 of the 40 paid reports are currently free on Solo.** Only 6 are
blocked (the 5 hanging off `report_profit_loss`, plus Owner's Daily Pulse).

There is also an upward leak: Balance Sheet, Item-wise Profit, Bill-wise Profit and
Party-wise P&L are Core reports gated by `report_profit_loss`, which is `true` on
Starter — so **$49 Starter currently gets four $99 Core reports**.

### Two off-by-ones in the spec's own arithmetic

The spec says 19 / 12 / 9. The code says 20 / 12 / 8, because:

- Starter is **20**, not 19 — the spec's Part C list names "Purchase Report" once, but
  the hub has two purchase reports (`purchases` and `purchase-returns`), both correctly
  under `report_purchase_records`.
- Scale is **8**, not 9 — the spec lists "Journal Entries" and "Chart of Accounts" as two
  reports, but the hub has one entry, `account-ledger`, covering both.

The total, 40, is unchanged — the two errors cancel. **These are the numbers of record
from here on:**

| Plan | Price | New reports | Cumulative | History shown |
|---|---|---|---|---|
| Solo | Free | none — dashboard cards only | **0** | 30 days of detail |
| Starter | $49 | 20 | **20** | Unlimited |
| Core | $99 | 12 | **32** | Unlimited |
| Scale | $299 | 8 (+ exports, scheduling) | **40** | Unlimited |

Trial and Custom get all 40. `ltd_1 → Starter`, `ltd_2 → Core`, `ltd_3 → Scale`.

---

## Task 1 — Make `ReportPlanMap` the enforcer (this is the whole round)

Do not fix 40 route lines by hand. Hand-maintained per-route keys are what produced this
drift; repeating the pattern reproduces it. Point, never copy.

1. Write `App\Http\Middleware\EnsureReportPlan`. It resolves the current route name,
   strips the `store.reports.` / `store.v3.reports.` prefix, asks
   `ReportPlanMap::requiresPlanFeature()`, and calls `PlanGate::check()` with the result.
   On failure it returns the standard upgrade response carrying
   `ReportPlanMap::tierFor()` and `decisionFor()`.
2. Apply it **to the report route groups as a group middleware** — every report route,
   including any added later, no exceptions and no per-route keys.
3. **Delete every `plan.feature:` on a `reports.*` route.** All 38 wrong or missing ones
   go; so do the 2 correct ones, because the group now covers them. After this,
   `rg -n "name\('(v3\.)?reports\." routes/web.php | rg "plan\.feature"` must return
   nothing.
4. Add a test that walks every registered route whose name starts `store.reports.` /
   `store.v3.reports.` and asserts the middleware stack contains `EnsureReportPlan`.
   That test is what stops the next drift.

## Task 2 — Close `PlanGate`'s fail-open

`PlanGate::check()` returns `true` for a key that does not exist in the plan config. That
single line is why 19 reports are open. It is a fail-open in a paywall, and the same hole
applies to every other feature key in the product, not just reports.

1. Change unknown-key behaviour to **fail closed**, and log the unknown key at warning
   level with the tenant id and the key name.
2. That change will break anything relying on a missing key resolving to "allowed", so
   before flipping it: enumerate every distinct `plan.feature:` key used anywhere in
   `routes/`, and every key passed to `PlanGate::check()` / `PlanGate::limit()` in `app/`,
   and diff that set against the keys defined in `config/plans.php`.
   **Report the missing list before changing behaviour.** Known missing so far:
   `cash_flow_report`, `customer_insights`, `discount_report`, `expense_manager`,
   `stock_valuation`, `report_party_statement`, `point_in_time_inventory`,
   `aged_receivables`, `pre_sales_reservation`, `stock_aging`, `supplier_insights`,
   `auto_vat_gst`, `report_trial_balance`.
3. Each missing key is either (a) a report key now made redundant by Task 1 — delete the
   reference, or (b) a genuine non-report feature — add it to all plan blocks with an
   explicit true/false. Never leave a key undefined.
4. Test: assert every key referenced by any route or call site exists in every plan block.

## Task 3 — The accounting back door

`/accounting/*` reaches the same ledger data through different route names, so Task 1's
report-group middleware does not cover it.

- `routes/web.php:1710` — `accounting.balance-sheet` is gated by `report_profit_loss`
  (Starter). Balance Sheet is **Core**. Change to `report_balance_sheet`.
- `routes/web.php:1709` — `accounting.pnl` gated by `report_profit_loss` is correct.
- `routes/web.php:1708` — `accounting.index` (Chart of Accounts) is gated by
  `double_entry_ledger`, which is **`true` on Solo**. Chart of Accounts is a Scale report
  (`report_ledger`) in the hub. Same screen, two answers. Gate it `report_ledger`.
- **`routes/web.php:1928–1932` register `/accounting`, `/accounting/chart`,
  `/accounting/p-and-l` and `/accounting/balance-sheet` a second time with the same route
  names and NO middleware at all.** Duplicate route names also mean Ziggy and `route()`
  resolve to the last registration. Delete the duplicate block, then run
  `php artisan route:list --name=accounting` and paste the output to prove one
  registration each.
- Sweep for any other screen that reads ledger, margin or COGS data under a non-report
  route name and gate it against the same keys.

## Task 4 — Now the pricing page

Only after Tasks 1–3, because the numbers depend on them.

`resources/js/Pages/Marketing/Pricing.jsx`:

| Line | Currently | Must become |
|---|---|---|
| 68, 71, 77 (meta / og / twitter description) | "…the complete double-entry ledger **and all reports**." | "…the complete double-entry ledger. Reports start at $49." |
| 125 (Solo bullet) | "Core Ledger (**no financial reports**)" | "Core Ledger + **9 live dashboard cards** (no report screens)" |
| 144 (Starter bullet) | "**19 Essential reports**" | "**20 Essential reports**" |
| 165 (Core bullet) | "**31 Core reports & analytics**" | "**32 Core reports & analytics**" |
| 185 (Scale bullet) | "**All 43+ reports**" | "**All 40 reports**" |
| 256 (comparison row) | "19 Essential / 31 Core / All 43+" | "20 Essential / 32 Core / All 40" |
| 256 (Solo cell) | bare cross | cross + "Dashboard cards only" |
| 360 (trial FAQ) | "**all 43 reports**" | "**all 40 reports**" |

Then in the same file:

1. Sweep: `rg -n "19 |31 |43|all reports|every report" resources/js/Pages/Marketing/Pricing.jsx`
   and fix each hit. Do not assume the table above is exhaustive.
2. Add a comparison-table row above the reports row: "Dashboard cards (sales, expenses,
   cash, stock, low stock, expiry, receivables, payables, profit peek)" — tick on all four.
3. Line ~293 Solo retention note and line ~368 downgrade FAQ both say older data is
   "safely archived", which reads as *moved somewhere*. Rewrite both: nothing is ever
   deleted or moved; Solo *displays* the last 30 days of detail, while every balance and
   total is always computed from all-time data. That distinction is the promise the whole
   spec rests on — state it plainly.

## Task 5 — Every other surface

```
rg -n "43 reports|43\+|all reports|19 Essential|31 Core" app-code/main-app/resources app-code/main-app/app
rg -n "reports" app-code/main-app/app/Support/MarketingSeo.php
```

Check and report on each, even if already correct: `MarketingSeo.php` (116 KB of meta
copy), `Marketing/Features.jsx` and `Marketing/Features/*`, `Marketing/Compare/*`,
`Marketing/Docs/*`, `Blueprint.jsx`, `Reckoner.jsx`, `DashboardPreview.jsx`,
`Onboarding.jsx`, the `/build-workspace` plan picker, and the in-app billing and paywall
screens (those must render `ReportPlanMap::tierFor()` / `decisionFor()`, never their own
strings).

Where a marketing surface must hardcode a count, add a test asserting the hardcoded
number equals the count computed from `ReportPlanMap::MAP` + `FEATURE_TIERS`.

## Task 6 — `config/plans.php` housekeeping

1. **`history_retention_days => 90` on Solo.** Grep every read site
   (`rg -n "history_retention_days" app/ config/ database/ routes/ resources/ tests/`).
   **If anything deletes, prunes or archives on it, STOP and report before changing a
   line.** If nothing destructive reads it, delete the key everywhere so
   `visible_history_days` is the only concept, and prove zero references remain.
2. The legacy `growth` and `business` plan blocks still exist in full in both
   `config/plans.php` and `config/pricing.php`, duplicating Core and Scale.
   `PlanCatalog::canonical()` already normalises them. Confirm every read normalises
   before resolving a plan block, then delete both blocks. If a read does not normalise,
   fix it first. Report which you did.

## Task 7 — Tests

1. Route-coverage test (Task 1.4) — every report route carries `EnsureReportPlan`.
2. Key-existence test (Task 2.4) — every referenced feature key exists in every plan block.
3. Count test — compute per-tier counts from `ReportPlanMap` and assert 20 / 32 / 40
   cumulative. Loop the constants; do not hand-list.
4. Copy test — `Pricing.jsx` states no report count that disagrees with test 3.
5. **Solo lockout test** — as a Solo tenant, request all 40 report routes and assert 40
   upgrade responses. This is the test that would have caught today's 34.
6. **Starter ceiling test** — as Starter, assert the 12 Core and 8 Scale reports are
   blocked, especially Balance Sheet, Item-wise Profit, Bill-wise Profit and Party-wise
   P&L, which are open today.
7. Accounting back-door test — Solo and Starter against `/accounting/balance-sheet`,
   `/accounting/chart`, `/accounting/p-and-l`.
8. The spec's Part G tests: balance integrity on Solo (all-time totals vs 30-day detail
   lists), nothing-deleted, upgrade-exposes-full-history, card row caps (10 / 5), Reckoner
   and assistant cannot leak margin / COGS / profit-by-product to Solo, individual old
   invoice still opens.

## Then

```
& "C:\Users\PC\AppData\Roaming\Local\lightning-services\php-8.2.23+0\bin\win64\php.exe" vendor/bin/pest --configuration tests/phpunit.xml --no-coverage --log-junit tests/reports/junit-round9.xml
npm test
npm run build
```

All three summary lines raw, every failure, test names as printed. Commit, push, list
files changed.

No readiness score, no percentage, no verdict.
