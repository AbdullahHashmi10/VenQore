# Spec — tiered reporting across Solo / Starter / Core / Scale

Rules of engagement from the earlier instruction files still apply. This supersedes the
free-versus-paid split in `SPEC_PLAN_GATED_REPORTS.md` where the two disagree.

Plans and prices, confirmed from `config/pricing.php`: Solo $0, Starter $49, Core $99,
Scale $299, Custom $800.

---

## Part A — The tier map

The 14 keys in `ReportPlanMap` move from a two-state free/paid split to four tiers. Move
**whole families only** — never split one. A customer who can see profit but not margin
feels cheated and support hears about it.

| Feature key | Solo | Starter | Core | Scale |
|---|:--:|:--:|:--:|:--:|
| `report_profit_loss` | ✗ | ✓ | ✓ | ✓ |
| `cash_flow_report` | ✗ | ✓ | ✓ | ✓ |
| `stock_valuation` | ✗ | ✓ | ✓ | ✓ |
| `report_profitability_analysis` | ✗ | ✗ | ✓ | ✓ |
| `customer_insights` | ✗ | ✗ | ✓ | ✓ |
| `supplier_insights` | ✗ | ✗ | ✓ | ✓ |
| `discount_report` | ✗ | ✗ | ✓ | ✓ |
| `report_sales_aging` | ✗ | ✗ | ✓ | ✓ |
| `report_expense_analysis` | ✗ | ✗ | ✓ | ✓ |
| `report_export` | ✗ | ✗ | ✓ | ✓ |
| `report_trial_balance` | ✗ | ✗ | ✗ | ✓ |
| `report_sales_analysis` | ✗ | ✗ | ✗ | ✓ |
| `point_in_time_inventory` | ✗ | ✗ | ✗ | ✓ |
| `stock_aging` | ✗ | ✗ | ✗ | ✓ |

Cumulative: Solo 0, Starter 3, Core 10, Scale 14.

**Other plans:**
- `trial` — **all 14 true.** The trial must show the ceiling; the loss at day 15 is the
  conversion.
- `custom` — all 14 true.
- `ltd_1` → Starter set, `ltd_2` → Core set, `ltd_3` → Scale set. These are lifetime
  purchases; do not leave them defaulting to false or those customers lose reports they
  already paid for.

Apply in `config/plans.php`, `PlanFeatureMatrixSeeder`, and a new migration for existing
rows. All three must agree — a split between them is what produced the `multi_branch` bug.

The 25 operational reports (day book, low stock, aged receivables, party statements,
sales and purchase lists, stock movement, expiry, expenses, bank statement) stay free on
every plan. Do not gate them.

---

## Part B — The free profit summary

Solo keeps `profit_peek` = true, and it becomes a **real number, not a masked teaser.**
This changes the earlier spec: no blurred figures.

- **Free on Solo:** one plain headline for the period — money in minus money out. No cost
  of goods, no gross margin, no period comparison, no breakdown by product, customer or
  job.
- **Paid from Starter:** the full P&L — COGS, gross and net margin, period comparisons —
  and everything else in the table above.

A shopkeeper should always be able to see roughly whether the month was good. What they
pay for is understanding *why*.

---

## Part C — The AI and the dashboard must respect the same boundary

This is the important part and it is currently a hole.

`ReckonerRegistry` readings and `VenaContextController` are gated by **module**, not by
**plan**. So a Solo tenant with the Reports module on can plausibly read a profit or
margin figure from a dashboard card, or ask the assistant for it, while the P&L report
itself returns 403. If that is true, the gate is theatre.

1. **Audit all 60 Reckoner readings.** For every reading that answers a question a
   plan-gated report answers, add the same plan feature key alongside its module owner.
   Examples to start from: net profit, gross margin, COGS, stock value, profit by
   product, profit by customer, discount impact, stock ageing, sales by party. Report the
   full list of readings you gated and the key you gave each.
2. `Reckoner::checkAvailability()` and `readMany()` must return unavailable for those when
   the plan lacks the key, with a reason that names the plan — not the module, which
   would send the customer to the builder for something the builder cannot fix.
3. **Do not gate the free summary.** The `profit_peek` headline from Part B must stay
   readable on Solo.
4. `VenaContextController` must not report a capability the plan does not allow. The
   assistant should be able to say "that's on Core" — it must not answer the question.
5. The dashboard card catalogue must use `planFeatures`, so locked cards show locked
   rather than rendering a number.

---

## Part D — Copy

- Locked reports show the **tier name** on the badge — "Core", "Scale" — not a bare
  padlock. People upgrade to a named thing.
- The upgrade line names the decision, not the feature: "See which products are losing you
  money — Core" beats "Unlock advanced analytics".
- Update the pricing page and `Blueprint.jsx` to match this table exactly.
- **Do not advertise anything that does not exist today.** No forecasting, no anomaly
  alerts, no scenario modelling, no custom dashboards, no governed metrics. Sell what runs.

---

## Part E — Tests

`ReportPlanMapIntegrityTest` and `ReportPlanMapParityTest` already cover key existence and
JS/PHP agreement, and will fail if the new keys are not registered everywhere. Extend
`ReportPlanGateTest`:

1. Walk `ReportPlanMap::MAP` for each of the four plans and assert the tier table above —
   Starter gets 403 on a Core report, Core gets 200 on it, and so on. Loop the constant.
2. `trial` gets a non-403 on all 14.
3. `ltd_1`, `ltd_2`, `ltd_3` match Starter, Core and Scale respectively.
4. A Solo tenant can read the `profit_peek` summary but cannot obtain gross margin, COGS
   or profit-by-product through the Reckoner. This is the Part C regression guard — it is
   the one test that proves the gate is not theatre.

---

## Then

```bash
& "C:\Users\PC\AppData\Roaming\Local\lightning-services\php-8.2.23+0\bin\win64\php.exe" vendor/bin/pest --configuration tests/phpunit.xml --no-coverage --log-junit tests/reports/junit-round7.xml
npm test
npm run build
```

All three summary lines raw, every failure, test names as the runner printed them. Commit,
push, list the files. Update `R01-R26_TRACEABILITY.md` if any row changes status.

No readiness score, no percentage, no verdict.
