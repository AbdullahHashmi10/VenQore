# IDE Instructions — Round 10: finish Round 9

Round 9 moved correctly-gated reports from 2/40 to 27/40. Three of its four tasks are
unfinished. Verified against the current working tree, not the summary.

---

## 1. Nine reports still have no gate at all

Same `permission:reports.summary` block, just skipped:

| Route | Line | Should be |
|---|---|---|
| `/reports/sales` | 1437 | Starter |
| `/reports/day-book` | 1440 | Starter |
| `/reports/tax` | 1446 | Starter |
| `/reports/bank-statement` | 1447 | Starter |
| `/reports/stock-valuation` | 1450 | Starter |
| `/reports/low-stock` | 1451 | Starter |
| `/reports/movement-history` | 1452 | Starter |
| `/reports/expiry` | 1453 | Starter |
| `/reports/analytics` | 1481 **and** 1795 | Core |

All nine are open to Solo right now. Gate each with its `ReportPlanMap` key.

## 2. The V3 block (≈2357–2371) is a second registration with the old keys

Same route names, different gate. Where the two disagree the weaker one is what a
tenant can reach:

| Report | Line 14xx gate | Line 23xx gate |
|---|---|---|
| `trial-balance` | `report_ledger` | `report_trial_balance` — **key absent from plans.php → opens** |
| `cash-flow` | `report_cash_flow` | `cash_flow_report` — **key absent → opens** |
| `balance-sheet` | `report_balance_sheet` (Core) | `report_profit_loss` (Starter) |
| `purchases` | `report_purchase_records` | `purchase_orders` — true on Solo |
| `sales`, `tax` | ungated | ungated |

Resolve the duplication — one registration per report name — then `php artisan
route:list --name=reports` and paste it. Duplicate route names also mean Ziggy resolves
to whichever registers last.

**This is why Round 9's per-route approach keeps leaking.** Do Task 1 of Round 9 as
written: one group middleware reading `ReportPlanMap`, zero per-route `plan.feature:` on
any `reports.*` route, plus the test that asserts every report route carries it. Then
none of the above can recur.

## 3. `PlanGate` still fails open — file untouched

`app/Services/PlanGate.php` line 74 is still `if ($limit === null) return true;`. An
undefined feature key still grants access, product-wide. Round 9 Task 2 stands as
written: enumerate every key referenced in `routes/` and every `PlanGate::check()` call
site, diff against `config/plans.php`, **report the missing list**, then fail closed with
a warning log.

## 4. The accounting back door is untouched

- `routes/web.php:1928–1932` still register `/accounting`, `/accounting/chart`,
  `/accounting/p-and-l`, `/accounting/balance-sheet` a **second time with no middleware**.
  Delete that block.
- `:1708` Chart of Accounts is gated `double_entry_ledger`, which is **`true` on Solo**.
  It is a Scale report in the hub. Gate `report_ledger`.
- `:1710` Balance Sheet is gated `report_profit_loss` (Starter). Gate
  `report_balance_sheet` (Core).

## 5. The counts are wrong, and the test that would have caught it was removed

`ReportPlanMapCountTest` originally asserted 19/12/9 per tier. That failed, because the
code says 20/12/8. The response was to delete the per-tier count assertions and assert
10/8/5 *feature keys* instead — which is not the same claim and does not pin any number
the pricing page states.

The real counts, from `ReportsHub.jsx` (40 reports) mapped through `ReportPlanMap`:

- **Starter 20** — the hub has two purchase reports, `purchases` and `purchase-returns`,
  both under `report_purchase_records`. The spec's Part C prose names "Purchase Report"
  once.
- **Core 12** — correct.
- **Scale 8** — `account-ledger` is one hub entry; the spec's Part C counts Journal
  Entries and Chart of Accounts as two.

Cumulative: **20 / 32 / 40.**

Do this:

1. `Pricing.jsx`: "19 Essential" → "20 Essential" (both occurrences), "31 Core" → "32
   Core" (both occurrences). "All 40" is already right.
2. Same substitution in `MarketingSeo.php`, `public/v6/pricing.html`,
   `public/v6/index.html`, `resources/design-reference/v6/pricing.html`, `public/llms.txt`
   — Round 9 wrote 19/31 into all of them.
3. `SPEC_REPORTING_TIERS_FINAL.md` Part C: correct the two prose lists so the spec stops
   disagreeing with the code.
4. Restore the per-tier count assertion in `ReportPlanMapCountTest`, computing counts by
   looping `MAP` + `FEATURE_TIERS`, asserting 20 / 12 / 8 and cumulative 20 / 32 / 40.
   Keep the 10/8/5 key-count assertion as well — it tests something different.
5. `PricingPageReportingTiersTest` must assert the numbers computed in (4), not literals.
   A copy test that hardcodes the same wrong number as the page passes while both are
   wrong.

**If a test fails, say so and stop. Do not weaken the assertion to make it pass** — that
is what happened here, and it shipped 19/31 to five files.

## 6. Still not reported from Round 9

Task 5's grep sweep found and changed `MarketingSeo.php`, the three v6 HTML files and
`llms.txt`, but no before/after list was given. List what each said and what it says now.

## Then

```
& "C:\Users\PC\AppData\Roaming\Local\lightning-services\php-8.2.23+0\bin\win64\php.exe" vendor/bin/pest --configuration tests/phpunit.xml --no-coverage --log-junit tests/reports/junit-round10.xml
npm test
npm run build
```

Plus, before that: a Solo lockout test that requests all 40 report routes as a Solo
tenant and asserts 40 upgrade responses, and a Starter ceiling test asserting the 12 Core
and 8 Scale reports are blocked. Those two are the only proof that items 1–4 are actually
fixed.

All three summary lines raw, every failure, test names as printed. Commit, push, list
files.

No readiness score, no percentage, no verdict.
