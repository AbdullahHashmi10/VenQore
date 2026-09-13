# Spec — final reporting model: cards on free, 40 reports across three paid plans

Supersedes `SPEC_PLAN_GATED_REPORTS.md` and `SPEC_TIERED_REPORTS.md` wherever they differ.
Rules of engagement from the earlier instruction files still apply.

---

## ⚠️ READ THIS FIRST — the one thing that must not be got wrong

Free tenants see **30 days of detail**. That is a **display filter, not a data policy.**

- **NOTHING IS EVER DELETED.** No purge job, no pruning, no archival delete. Ever.
- **Balances and totals are always computed from ALL data, all-time.** If a customer owes
  50,000 from invoices going back eight months, the card shows 50,000. What is hidden is
  the eight months of line items behind it — never the total itself.
- A free tenant who upgrades on day 400 must immediately see all 400 days of history,
  because it was all there the whole time.

Before changing anything: `config/plans.php` has `history_retention_days => 90` on Solo.
**Audit what that key currently does.** If any job, command or query deletes or prunes on
it, stop and report it — that is a live grenade. Introduce a separate, unambiguous key
`visible_history_days` for the display filter and leave any retention concept alone.

---

## Part A — The three dials

Reporting access is now controlled by three independent things, not one:

1. **Which reports** the plan can open at all.
2. **Card or screen** — free gets a dashboard card; paid gets the full report screen.
3. **How much** — how many days of detail, and how many rows on a card.

---

## Part B — Solo (free): cards only

Solo gets **no report screens at all.** The Reports hub is visible but every entry is
locked (see Part E). What Solo gets is a fixed set of dashboard cards.

Each card shows a headline number, and where a list makes sense, **the top 10 rows only** —
never the full list, never a drill-down, never a link to a report screen.

| Card | Headline | List |
|---|---|---|
| Sales this month | total | — |
| Expenses this month | total | — |
| Profit peek | money in − money out (no COGS, no margin) | — |
| Cash in hand | current | — |
| Stock value | total at cost | — |
| Low stock | count of items below reorder | top 10 items |
| Expiring soon | count | top 10 batches |
| Customers owe me | **all-time total** | top 5 debtors, name + amount only |
| I owe suppliers | **all-time total** | top 5 |

Rules for Solo:
- Detail views anywhere (transaction lists inside workflow screens) show the last **30
  days**. Set `visible_history_days => 30`.
- Card list rows capped at 10 (5 for the party cards). No "view all".
- The party cards show *who* and *how much*, never *since when* or *which invoices*.
- `profit_peek` stays `true` and shows a **real number, not a masked teaser.**

**Two carve-outs — these stay available on Solo at any age:**
1. **Opening or printing one specific invoice or receipt.** A customer disputing a
   three-month-old bill is running a shop, not doing analysis. The *list* stays windowed;
   an individual document by id does not.
2. Nothing else. Tax moves to Starter (see Part C) because Starter is $49 and blocking a
   legal filing obligation any higher reads as predatory.

Paid plans get `visible_history_days => null` (unlimited) and no row caps.

---

## Part C — The 40 reports across three paid plans

Every one of the 40 reports in the hub is paid. The split, by the job each tier does:

### Starter — $49 — "my records and my statements"
A single-owner shop should feel complete here.

Sales Report · Sales Orders · Sale Order Items · Daily Sales · Purchase Report · Purchase Returns · Low Stock · Stock
Movement · Stock Summary · Item Detail · Expiry · Stock Valuation · Profit & Loss · Cash
Flow · Bank Statement · Expense Report · Tax Report · Tax Rate Report · Day Book · All
Parties · Party Statement

**20 reports.**

### Core — $99 — "why is it happening"
Anything that breaks a number down by product, customer, category or time.

Sales Analytics · Item-wise Profit · Bill-wise Profit · Party-wise P&L · Discount Report ·
Sale Aging · Stock Aging · Balance Sheet · Expense Category · Customer Insights · Supplier
Insights · Owner's Daily Pulse

**12 reports.**

### Scale — $299 — "prove it and coordinate"
Accountant-grade ledger work, historical reconstruction, cross-party analysis.

Trial Balance · Account Ledger · Transactions · Point-In-Time
Inventory · Sale & Purchase by Party · Item Report by Party · Party Report by Item · Loan Statement · Export

**8 reports.** Plus exports and scheduled reports.

20 + 12 + 8 = 40.

**Other plans:** `trial` gets everything (the ceiling must be visible before it is lost).
`custom` gets everything. `ltd_1` → Starter set, `ltd_2` → Core set, `ltd_3` → Scale set —
these are lifetime purchases and must not silently lose reports.

---

## Part D — Re-cut the plan keys

The existing 14 keys in `ReportPlanMap` no longer align — P&L is now Starter while Balance
Sheet is Core, so that family must split. Re-cut to these 23, each aligned to exactly one
tier. **Never split a family across tiers again.**

**Starter:** `report_sales_records` (Sales Report, Sales Orders, Sale Order Items) ·
`report_purchase_records` · `report_stock_records` (Low Stock, Stock Movement, Stock
Summary, Item Detail, Expiry) · `report_stock_valuation` · `report_profit_loss` ·
`report_cash_flow` (Cash Flow, Bank Statement) · `report_expenses` · `report_tax` (Tax
Report, Tax Rate Report) · `report_day_book` · `report_party_records` (All Parties, Party
Statement)

**Core:** `report_sales_analytics` · `report_profitability` (Item-wise, Bill-wise,
Party-wise P&L) · `report_discounts` · `report_aging` (Sale Aging, Stock Aging) ·
`report_balance_sheet` · `report_expense_analysis` · `report_party_insights` (Customer +
Supplier Insights) · `owners_daily_pulse` (already exists)

**Scale:** `report_ledger` (Trial Balance, Journal Entries, Chart of Accounts, All
Transactions) · `report_point_in_time` · `report_cross_party` (Party Volume, Item Report
by Party, Party Report by Item) · `report_loans` · `report_export`

Every key must exist in `config/plans.php`, `PlanFeatureMatrixSeeder` and a migration for
existing rows. `ReportPlanMapIntegrityTest` already fails the build if one is missing —
that guard is why this re-cut is safe to do quickly.

Update `resources/js/lib/reportPlanMap.js` to match; `ReportPlanMapParityTest` enforces it.

---

## Part E — Show them how it works

A lock with no explanation teaches nothing. For each locked report in the hub:

- Show the report **name, its real description** (you already have good ones written) and
  the **tier badge** — "Starter", "Core", "Scale".
- Show a **static sample image or a two-row dummy preview** of what the report looks like.
- The upgrade line names the decision, not the feature: *"See which products are losing
  you money — Core"*.
- Do not blur real data. Either a dummy sample or nothing.

Cards on Solo that have a paid report behind them get a quiet "Full report — Starter" link
under the number.

---

## Part F — The AI and the dashboard obey the same rules

Still outstanding from the previous spec and still required.

`ReckonerRegistry` readings and `VenaContextController` are gated by module, not plan. A
Solo tenant must not be able to obtain, via a dashboard card or by asking the assistant,
anything the cards in Part B do not show — no margin, no COGS, no profit by product, no
transaction detail older than 30 days.

Audit all 60 readings, add the plan key alongside the module owner for every analytical
one, and report the list. The free card readings in Part B must stay available.

---

## Part G — Tests

1. Walk `ReportPlanMap::MAP` for Solo, Starter, Core, Scale and assert Part C exactly.
   Loop the constant, do not hand-list.
2. `trial` non-403 on all; `ltd_1/2/3` match Starter/Core/Scale.
3. **Balance integrity** — the one that matters most. Create a tenant with invoices 6
   months old and 10 days old. As Solo: the receivables card total equals the **all-time**
   sum, while the detail list returns only the last 30 days. Assert the total is NOT the
   30-day sum.
4. **Nothing deleted** — after a Solo tenant has existed past the window, the underlying
   rows are all still present in the database.
5. Upgrading Solo → Starter immediately exposes the full history.
6. Card row caps: low stock card returns at most 10 rows, party cards at most 5.
7. A Solo tenant cannot obtain gross margin, COGS or profit-by-product through the
   Reckoner or the assistant.
8. An individual invoice older than 30 days still opens on Solo.

---

## Then

```bash
& "C:\Users\PC\AppData\Roaming\Local\lightning-services\php-8.2.23+0\bin\win64\php.exe" vendor/bin/pest --configuration tests/phpunit.xml --no-coverage --log-junit tests/reports/junit-round8.xml
npm test
npm run build
```

All three summary lines raw, every failure, test names as printed. Commit, push, list files.

No readiness score, no percentage, no verdict.
