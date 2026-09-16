# Reckoner — 349-card contract matrix

**Companion to `RECKONER_TRUTH_REBUILD_PLAN.md`.** One row per card in `resources/data/reckoner/cards.json`, in catalogue order. Generated 2026-09-16 from a direct read of the code; nothing was changed.

This file is a *specification to encode*, not a second source. In Phase 2 its columns move INTO `cards.json` (and a new `measures.json`) and this file is regenerated from them. Do not hand-edit numbers here after that.

## How to read a row

- **Today** — what the live code path returns right now for that key (verified against `Reckoner::readMany()`, `ReckonerRegistry::all()`, `AbstractCardResolver`). "EMPTY if store has no rows" means the generic resolver first checks the table has any rows for the tenant.
- **Unit** — the unit in `cards.json` today → the correct unit. `=` means it is already right.
- **Target** — the exact business definition the Measure Engine must implement. Every flow uses tenant-local dates; every ledger read is `journal_items ⋈ journal_entries ⋈ accounts`, tenant-scoped on all three, `is_reversed = 0` (except where stated).
- **Tier** — Flow (daily rollup, any window, history back-fillable) · Ledger balance (as-of, history reconstructable from the journal) · Live (current position; history only from nightly snapshots after go-live) · On-demand (lists/rankings/distinct counts from raw rows, cached) · Derived (arithmetic over other measures) · Check (status).
- **Status** — READY (data exists; implement) · DECIDE (data exists; owner must fix the definition, see plan §6) · VERIFY (confirm a column/status value in Phase 0) · COLUMN (small migration + the write path that fills it) · FEATURE (no data is captured anywhere; card stays *unavailable* until the module feature exists).
- **Streams** — GL ledger · SH/SL sales headers/lines · PH/PL purchase headers/lines · SM/SP stock movements/positions · PB party balances · PE payments · EE expenses · TX tax · PR production · AT attendance · DS document status · MR master records.
- **Check** — the invariant that must pass for this card before it may show `ok`.

## Totals

| Today (verified) | Cards |
|---|---|
| empty always (no table) | 201 |
| generic row count | 57 |
| generic fake 0/1 | 39 |
| core: fake 0 | 14 |
| generic series count/sum | 11 |
| core: real ledger | 9 |
| core: wrong value | 9 |
| legacy source (real or near-real) | 9 |

| Target status | Cards |
|---|---|
| READY | 235 |
| DECIDE | 35 |
| FEATURE | 31 |
| VERIFY | 25 |
| COLUMN | 23 |

| Tier | Cards |
|---|---|
| Flow | 105 |
| Live | 98 |
| On-demand | 76 |
| Derived | 42 |
| Ledger balance | 24 |
| Check | 4 |

Cards whose `unit` in cards.json is wrong: **58**.

## qore (32)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 1 | `core.revenue` · stat | Ledger P&L (all income) — real | = | gl.sales_revenue: Σ(cr−dr) on role=sales_revenue (4000), je.date in window. (Decision D1: 4000 only vs all income.) | Flow | DECIDE | GL | revenue_ties_to_ledger |
| 2 | `core.revenue_trend` · trend | Ledger daily revenue — real; value = last day | = | Series of core.revenue at server grain (hour/day/week/month). Sum of points = core.revenue. | Flow | DECIDE | GL | trend_sums_to_stat |
| 3 | `core.net_profit` · stat | Ledger P&L — real | = | gl.income − gl.cogs − gl.opex (all income incl. 4100/4200/4900). | Derived | READY | GL | net_profit_identity |
| 4 | `core.profit_trend` · trend | Plots GROSS profit, labelled net | = | Series of net profit (income − cogs − opex) per grain. Today it plots gross profit — wrong. | Flow | READY | GL | trend_sums_to_stat |
| 5 | `core.gross_profit` · stat | Ledger P&L — real | = | core.revenue − core.cogs. | Derived | READY | GL | gross_profit_identity |
| 6 | `core.gross_margin_pct` · gauge | Ledger P&L — real; EMPTY when revenue 0 | = | gross_profit ÷ revenue × 100; null (not 0) when revenue = 0. | Derived | READY | GL | — |
| 7 | `core.net_margin_pct` · gauge | Ledger P&L — real; EMPTY when revenue 0 | = | net_profit ÷ revenue × 100; null when revenue = 0. | Derived | READY | GL | — |
| 8 | `core.cogs` · stat | Ledger P&L — real | = | Σ(dr−cr) on role=cogs (5000) in window. | Flow | READY | GL | cogs_ties_to_ledger |
| 9 | `core.expenses_total` · stat | Ledger P&L — real | = | Σ(dr−cr) on type=expense excluding role=cogs, in window. | Flow | READY | GL | — |
| 10 | `core.expense_ratio` · gauge | Ledger P&L — real; EMPTY when revenue 0 | = | expenses_total ÷ revenue × 100; null when revenue = 0. | Derived | READY | GL | — |
| 11 | `core.receivables` · stat | WRONG: reads non-existent key → always 0 | = | Balance of role=ar (1200) as of window end. Reuse FinanceSource finance.receivables logic. | Ledger balance | READY | GL,PB | receivables_control |
| 12 | `core.receivables_aging` · breakdown | FAKE: success 0 when any sale exists, else empty | days → **currency** | Open sale docs (invoice_total − allocations) bucketed 0-30/31-60/61-90/90+ by invoice date as of end. Buckets sum to core.receivables. | On-demand | READY | PB,SH | aging_sums_to_total |
| 13 | `core.payables` · stat | WRONG: reads non-existent key → always 0 | = | Balance of role=ap (2000) as of window end. | Ledger balance | READY | GL,PB | payables_control |
| 14 | `core.payables_aging` · breakdown | FAKE: success 0 when any sale exists, else empty | = | Open purchases (total − ledger-derived paid) bucketed by bill date. Sum = core.payables. | On-demand | READY | PB,PH | aging_sums_to_total |
| 15 | `core.total_liquidity` · stat | WRONG: non-existent key → always 0 | = | Balance of role IN (cash, bank) as of end. ONE definition (today two exist: codes 1000-1099 vs [1000,1010]). | Ledger balance | READY | GL | liquidity_identity |
| 16 | `core.liquidity_trend` · trend | WRONG: plots gross profit | = | Daily closing balance of cash+bank across window (balance series, not profit). | Ledger balance | READY | GL | — |
| 17 | `core.cash_flow_trend` · trend | WRONG: plots gross profit | = | Two series: cash_in = Σdr, cash_out = Σcr on cash/bank lines, EXCLUDING entries whose lines are all cash/bank (internal transfers). | Flow | READY | GL | — |
| 18 | `core.net_cash_position` · stat | WRONG: same 0 as liquidity | = | total_liquidity − current liabilities (AP + tax payable + customer advances). Decision D4 on loans. | Derived | DECIDE | GL | — |
| 19 | `core.working_capital` · stat | WRONG: same 0 as liquidity | count → **currency** | Σ balances where accounts.is_current AND type=asset − Σ where is_current AND type=liability. Needs accounts.is_current. | Derived | COLUMN | GL | — |
| 20 | `core.revenue_vs_prev` · stat | FAKE: success 0 when any sale exists, else empty | = | (revenue − revenue_prev_window) ÷ revenue_prev × 100; null when prev = 0. | Derived | READY | GL | — |
| 21 | `core.profit_vs_prev` · stat | FAKE: success 0 when any sale exists, else empty | = | net_profit − net_profit_prev_window (absolute). delta.pct carries the %. | Derived | READY | GL | — |
| 22 | `core.transaction_count` · stat | Counts sales rows by created_at (drafts/cancelled included) | = | Count of posted business documents in window: recognised sales + posted purchases + expenses + payments (Decision D5). | Flow | DECIDE | SH,PH,EE,PE | — |
| 23 | `core.avg_transaction_value` · stat | FAKE: success 0 when any sale exists, else empty | = | sales net revenue ÷ recognised sale count; null when count = 0. | Derived | READY | SH | — |
| 24 | `core.busiest_day` · stat | FAKE: success 0 when any sale exists, else empty | = | Day in window with max sales net revenue; value = that revenue, label = date. | On-demand | READY | SH | — |
| 25 | `core.peak_hour` · stat | FAKE: success 0 when any sale exists, else empty | count → **hour** | Hour (0-23, tenant tz) with max sales net revenue in window; value = hour, label "2–3 pm". | On-demand | READY | SH | — |
| 26 | `core.balance_sheet_ok` · status | FAKE: success 0 when any sale exists, else empty | currency → **count** | ok when Σdr = Σcr (non-reversed) AND assets = liabilities + equity as of end; fail shows the difference. | Check | READY | GL | balanced_books |
| 27 | `core.journal_entries_count` · stat | FAKE: success 0 when any sale exists, else empty | = | Count journal_entries in window with is_reversed = 0. | Flow | READY | GL | — |
| 28 | `core.audit_trail_count` · stat | FAKE: success 0 when any sale exists, else empty | = | Count store_activity_log rows in window (audit_logs has no tenant_id — do not use it). | Flow | READY | MR | — |
| 29 | `core.reversal_count` · stat | FAKE: success 0 when any sale exists, else empty | = | Count journal_entries with is_reversal = 1 in window (must NOT filter is_reversed — reversal rows carry is_reversed = 1). | Flow | READY | GL | — |
| 30 | `core.document_sequence_ok` · status | FAKE: success 0 when any sale exists, else empty | = | ok when no duplicate and no gap in sales.reference_number per register/prefix (transaction_sequences) in window. | Check | READY | SH,MR | — |
| 31 | `core.user_activity` · stat | FAKE: success 0 when any sale exists, else empty | = | Distinct user_id active in window from store_activity_log ∪ sales.user_id (non-additive: compute from raw). | Flow | READY | MR,SH | — |
| 32 | `core.plan_usage` · breakdown | FAKE: success 0 when any sale exists, else empty | days → **percent** | Breakdown: each plan limit → used ÷ limit × 100 via PlanRepository (no cross-tenant User counts). | Live | READY | MR | — |

## products (10)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 33 | `products.count` · stat | COUNT(*) of products rows (not the measure) — EMPTY if store has no products rows | = | Count products (not soft-deleted) for tenant. | Live | READY | MR | — |
| 34 | `products.active_count` · stat | COUNT(*) of products rows (not the measure) — EMPTY if store has no products rows | = | Count products where is_active = 1 (confirm column added by 2026_04_13_000005). | Live | VERIFY | MR | — |
| 35 | `products.by_category` · breakdown | FAKE: success, value 0, no segments | = | Count products grouped by category_id → categories.name; "Uncategorised" bucket. Sum = products.count. | Live | READY | MR | breakdown_sums_to_parent |
| 36 | `products.catalogue_value` · stat | COUNT(*) of products rows (not the measure) — EMPTY if store has no products rows | = | Σ stock qty (stocks) × products.price — retail value of stock held. | Live | READY | SP,MR | — |
| 37 | `products.avg_margin` · gauge | FAKE: success, value 0 | = | Mean of (price − cost_price) ÷ price over products with price > 0 and cost_price > 0. | Live | READY | MR | — |
| 38 | `products.top_margin` · list | FAKE: success, value 0, no rows | = | Products sold in window ranked by (net_amount − FIFO cogs) ÷ net_amount, top 10. | On-demand | READY | SL | — |
| 39 | `products.lowest_margin` · list | FAKE: success, value 0, no rows | = | Same as top_margin, ascending, min qty sold ≥ 1. | On-demand | READY | SL | — |
| 40 | `products.never_sold` · list | FAKE: success, value 0, no rows | = | Products with no sale_items row ever (recognised sales); rows = product, created_at, stock. | On-demand | READY | SL,MR | — |
| 41 | `products.missing_cost` · stat | COUNT(*) of products rows (not the measure) — EMPTY if store has no products rows | percent → **count** | Count goods products with cost_price null/0 (unit fixed to count; card title says "Products Missing a Cost"). | Live | READY | MR | — |
| 42 | `products.new_this_period` · stat | COUNT(*) of products rows (not the measure) — EMPTY if store has no products rows | = | Count products created_at in window (tenant tz). | Flow | READY | MR | — |

## services (7)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 43 | `services.count` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Count products where type = 'service' (+ service_packages active). | Live | READY | MR | — |
| 44 | `services.revenue` · stat | EMPTY always (no table mapped) → "No activity recorded" | percent → **currency** | Σ sale_items.net_amount for products.type='service' on recognised sales in window (unit was 'percent' — wrong). | Flow | READY | SL | — |
| 45 | `services.revenue_trend` · trend | EMPTY always (no table mapped) → "No activity recorded" | = | Series of services.revenue. | Flow | READY | SL | — |
| 46 | `services.share_of_revenue` · gauge | EMPTY always (no table mapped) → "No activity recorded" | = | services.revenue ÷ sales net revenue × 100. | Derived | READY | SL | — |
| 47 | `services.top_services` · list | EMPTY always (no table mapped) → "No activity recorded" | = | Service products ranked by net_amount in window. | On-demand | READY | SL | — |
| 48 | `services.avg_ticket` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | service_jobs completed in window: Σ actual_total ÷ count. | Derived | READY | DS | — |
| 49 | `services.jobs_count` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Count service_jobs with status completed and completed_at in window. | Flow | READY | DS | — |

## customers (10)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 50 | `customers.count` · stat | COUNT(*) of parties rows (not the measure) — EMPTY if store has no parties rows | = | Count parties type IN ('customer','both'). Generic resolver today counts suppliers too. | Live | READY | MR | — |
| 51 | `customers.new` · stat | COUNT(*) of parties rows (not the measure) — EMPTY if store has no parties rows | = | Customers whose FIRST recognised sale falls in window (D6: first purchase vs created_at). | Flow | DECIDE | SH | — |
| 52 | `customers.new_trend` · trend | daily COUNT(*) of parties; value = last day — EMPTY if store has no parties rows | = | Series of customers.new. | Flow | DECIDE | SH | — |
| 53 | `customers.active` · stat | COUNT(*) of parties rows (not the measure) — EMPTY if store has no parties rows | = | Distinct party on recognised sales in window (non-additive → raw). | On-demand | READY | SH | — |
| 54 | `customers.dormant` · list | FAKE: success, value 0, no rows | = | Customers with ≥ 2 lifetime sales and none in last N days (setting, default 60). | On-demand | DECIDE | SH | — |
| 55 | `customers.repeat_rate` · gauge | FAKE: success, value 0 | = | Share of window net revenue from customers who had a recognised sale before window start. | On-demand | READY | SH | — |
| 56 | `customers.top_customers` · list | FAKE: success, value 0, no rows | = | Customers ranked by net revenue in window, top 10. | On-demand | READY | SH | — |
| 57 | `customers.avg_spend` · stat | COUNT(*) of parties rows (not the measure) — EMPTY if store has no parties rows | = | Net revenue from identified customers ÷ customers.active. | Derived | READY | SH | — |
| 58 | `customers.owing` · list | FAKE: success, value 0, no rows | count → **currency** | Per-party AR balance (journal_items.party_id on role=ar) > 0, largest first. Total = core.receivables. | On-demand | READY | PB,GL | list_total_matches_stat |
| 59 | `customers.by_area` · breakdown | FAKE: success, value 0, no segments | = | Needs a structured area/city on parties (address is free text). | Live | COLUMN | MR | — |

## suppliers (8)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 60 | `suppliers.count` · stat | COUNT(*) of parties rows (not the measure) — EMPTY if store has no parties rows | = | Count parties type IN ('supplier','both'). | Live | READY | MR | — |
| 61 | `suppliers.active` · stat | COUNT(*) of parties rows (not the measure) — EMPTY if store has no parties rows | = | Distinct party on posted purchases in window. | On-demand | READY | PH | — |
| 62 | `suppliers.top_suppliers` · list | FAKE: success, value 0, no rows | = | Suppliers ranked by purchases.total in window. | On-demand | READY | PH | — |
| 63 | `suppliers.spend_total` · stat | COUNT(*) of parties rows (not the measure) — EMPTY if store has no parties rows | = | Σ purchases.total, workflow_status posted/received, purchase_date in window (same measure as purchases.spend). | Flow | READY | PH | — |
| 64 | `suppliers.spend_trend` · trend | daily SUM(parties value col); value = last day — EMPTY if store has no parties rows | = | Series of suppliers.spend_total. | Flow | READY | PH | — |
| 65 | `suppliers.owed_list` · list | FAKE: success, value 0, no rows | count → **currency** | Per-party AP balance (role=ap by party) > 0. Total = core.payables. | On-demand | READY | PB,GL | list_total_matches_stat |
| 66 | `suppliers.concentration` · gauge | FAKE: success, value 0 | = | Largest supplier spend ÷ total spend in window × 100. | On-demand | READY | PH | — |
| 67 | `suppliers.new` · stat | COUNT(*) of parties rows (not the measure) — EMPTY if store has no parties rows | = | Count supplier parties created_at in window. | Flow | READY | MR | — |

## pos (11)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 68 | `pos.revenue` · stat | COUNT(*) of sales rows (not the measure) — EMPTY if store has no sales rows | = | Σ sales.net_sales, recognised, channel = counter (D7: how 'counter' is identified — sales.source). | Flow | DECIDE | SH | revenue_ties_to_ledger |
| 69 | `pos.revenue_trend` · trend | daily SUM(sales value col); value = last day — EMPTY if store has no sales rows | = | Series of pos.revenue. | Flow | DECIDE | SH | — |
| 70 | `pos.sale_count` · stat | COUNT(*) of sales rows (not the measure) — EMPTY if store has no sales rows | percent → **count** | Count recognised counter sales (unit was 'percent'). | Flow | DECIDE | SH | — |
| 71 | `pos.avg_ticket` · stat | COUNT(*) of sales rows (not the measure) — EMPTY if store has no sales rows | = | pos.revenue ÷ pos.sale_count. | Derived | DECIDE | SH | — |
| 72 | `pos.max_sale` · stat | COUNT(*) of sales rows (not the measure) — EMPTY if store has no sales rows | count → **currency** | MAX(net_sales) of counter sales in window (unit was 'count'). | On-demand | DECIDE | SH | — |
| 73 | `pos.items_per_sale` · stat | COUNT(*) of sales rows (not the measure) — EMPTY if store has no sales rows | = | Σ (quantity − returned_quantity) on counter sale lines ÷ pos.sale_count. | Derived | DECIDE | SL | — |
| 74 | `pos.payment_breakdown` · breakdown | FAKE: success, value 0, no segments | = | Σ invoice_total by sales.payment_method (split tenders need payments rows — confirm). | Flow | VERIFY | SH,PE | breakdown_sums_to_parent |
| 75 | `pos.hourly_heatmap` · heatmap | FAKE: success, value 0, no rows | = | Count (and value) of counter sales by weekday × hour (tenant tz). | Flow | DECIDE | SH | — |
| 76 | `pos.weekday_split` · breakdown | FAKE: success, value 0, no segments | = | pos.revenue by weekday (tenant tz). | Flow | DECIDE | SH | breakdown_sums_to_parent |
| 77 | `pos.discount_total` · stat | COUNT(*) of sales rows (not the measure) — EMPTY if store has no sales rows | percent → **currency** | Σ total_item_discounts + global_discount on recognised sales (unit was 'percent'). | Flow | READY | SH | — |
| 78 | `pos.live_feed` · list | FAKE: success, value 0, no rows | count → **currency** | Last 10 recognised sales: time, reference, customer, invoice_total, method. | On-demand | READY | SH | — |

## invoicing (10)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 79 | `invoicing.count` · stat | COUNT(*) of sales rows (not the measure) — EMPTY if store has no sales rows | = | Count recognised non-counter sales (invoices) posted in window (D7). | Flow | DECIDE | SH | — |
| 80 | `invoicing.value` · stat | COUNT(*) of sales rows (not the measure) — EMPTY if store has no sales rows | = | Σ invoice_total of invoices in window. | Flow | DECIDE | SH | — |
| 81 | `invoicing.value_trend` · trend | daily SUM(sales value col); value = last day — EMPTY if store has no sales rows | = | Series of invoicing.value. | Flow | DECIDE | SH | — |
| 82 | `invoicing.unpaid_value` · stat | COUNT(*) of sales rows (not the measure) — EMPTY if store has no sales rows | = | Σ (invoice_total − active payment_allocations) over open invoices as of now. | Live | READY | SH,PB | — |
| 83 | `invoicing.overdue_count` · stat | COUNT(*) of sales rows (not the measure) — EMPTY if store has no sales rows | = | Open invoices with due_date < today. | Live | READY | SH | — |
| 84 | `invoicing.overdue_value` · stat | COUNT(*) of sales rows (not the measure) — EMPTY if store has no sales rows | = | Σ open amount of overdue invoices. | Live | READY | SH,PB | — |
| 85 | `invoicing.avg_invoice` · stat | COUNT(*) of sales rows (not the measure) — EMPTY if store has no sales rows | = | invoicing.value ÷ invoicing.count. | Derived | DECIDE | SH | — |
| 86 | `invoicing.avg_days_to_pay` · stat | COUNT(*) of sales rows (not the measure) — EMPTY if store has no sales rows | = | Invoices fully settled in window: amount-weighted mean of (final allocation date − posted_at). | On-demand | READY | SH,PE | — |
| 87 | `invoicing.largest_open` · list | FAKE: success, value 0, no rows | = | Open invoices by open amount desc, top 10. | On-demand | READY | SH,PB | — |
| 88 | `invoicing.draft_count` · stat | COUNT(*) of sales rows (not the measure) — EMPTY if store has no sales rows | = | Count sales with status = 'draft'. | Live | READY | DS | — |

## quotations (6)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 89 | `quotations.count` · stat | COUNT(*) of quotations rows (not the measure) — EMPTY if store has no quotations rows | = | Count quotations with quotation_date in window. | Flow | READY | DS | — |
| 90 | `quotations.open_value` · stat | COUNT(*) of quotations rows (not the measure) — EMPTY if store has no quotations rows | = | Σ total_amount where status open/sent and valid_until ≥ today (confirm status values). | Live | VERIFY | DS | — |
| 91 | `quotations.win_rate` · gauge | FAKE: success, value 0 | = | Quotations dated in window: converted/accepted ÷ decided × 100 (confirm conversion flag). | On-demand | VERIFY | DS | — |
| 92 | `quotations.win_rate_trend` · trend | daily COUNT(*) of quotations; value = last day — EMPTY if store has no quotations rows | = | win_rate per grain bucket (ratio per bucket, not a sum). | On-demand | VERIFY | DS | — |
| 93 | `quotations.avg_quote` · stat | COUNT(*) of quotations rows (not the measure) — EMPTY if store has no quotations rows | = | Σ total_amount ÷ count for quotations in window. | Derived | READY | DS | — |
| 94 | `quotations.expiring` · list | FAKE: success, value 0, no rows | = | Open quotations with valid_until within next 7 days. | On-demand | READY | DS | — |

## sales_orders (7)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 95 | `sales_orders.open_count` · stat | COUNT(*) of sales_orders rows (not the measure) — EMPTY if store has no sales_orders rows | = | Count sales_orders in open/confirmed/partial status (confirm values). | Live | VERIFY | DS | — |
| 96 | `sales_orders.open_value` · stat | COUNT(*) of sales_orders rows (not the measure) — EMPTY if store has no sales_orders rows | = | Σ total_amount of open orders (− amount_paid shown separately). | Live | VERIFY | DS | — |
| 97 | `sales_orders.count` · stat | SalesSource — periods limited; UI asks this_week → invalid_period error | = | Count sales_orders with order_date in window. Legacy key ignores the period — fix. | Flow | READY | DS | — |
| 98 | `sales_orders.value_trend` · trend | daily SUM(sales_orders value col); value = last day — EMPTY if store has no sales_orders rows | = | Σ total_amount by order_date per grain. | Flow | READY | DS | — |
| 99 | `sales_orders.fulfil_rate` · gauge | FAKE: success, value 0 | = | Orders due in window fulfilled complete on/before delivery_date ÷ due. Needs fulfilled_at. | On-demand | COLUMN | DS | — |
| 100 | `sales_orders.overdue` · list | FAKE: success, value 0, no rows | = | Open orders with delivery_date < today. | On-demand | READY | DS | — |
| 101 | `sales_orders.by_customer` · breakdown | FAKE: success, value 0, no segments | count → **currency** | Open order value grouped by party. | On-demand | READY | DS | — |

## sales_returns (6)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 102 | `sales_returns.count` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Count journal_entries reference_type = 'sale_return' (non-reversed) in window. | Flow | READY | GL,SL | — |
| 103 | `sales_returns.value` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Σ debit to role=sales_revenue on sale_return entries in window (pre-tax). | Flow | READY | GL | revenue_ties_to_ledger |
| 104 | `sales_returns.rate` · gauge | EMPTY always (no table mapped) → "No activity recorded" | = | returns.value ÷ (net revenue + returns.value) × 100. | Derived | READY | GL | — |
| 105 | `sales_returns.trend` · trend | EMPTY always (no table mapped) → "No activity recorded" | = | Series of sales_returns.value. | Flow | READY | GL | — |
| 106 | `sales_returns.top_returned` · list | EMPTY always (no table mapped) → "No activity recorded" | = | Products by returned qty in window (needs the return date per line — confirm source of return lines). | On-demand | VERIFY | SL | — |
| 107 | `sales_returns.by_reason` · breakdown | EMPTY always (no table mapped) → "No activity recorded" | = | Return value grouped by sales.refund_reason (confirm it is written per return). | On-demand | VERIFY | SH | — |

## recurring_invoices (6)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 108 | `recurring.active_count` · stat | EMPTY always (no table mapped) → "No activity recorded" | days → **count** | Count recurring_invoices status = 'active' (unit was 'days'). | Live | READY | DS | — |
| 109 | `recurring.monthly_value` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Σ items total × frequency factor (weekly 4.345, monthly 1, quarterly ⅓, yearly 1/12) for active. | Live | READY | DS | — |
| 110 | `recurring.trend` · trend | EMPTY always (no table mapped) → "No activity recorded" | = | Σ invoice_total of sales generated by recurring runs per grain (needs link sale→recurring; VERIFY). | Flow | READY | SH,DS | — |
| 111 | `recurring.due_next_7` · list | EMPTY always (no table mapped) → "No activity recorded" | days → **currency** | Active with next_run_date within 7 days: customer, date, amount. | On-demand | READY | DS | — |
| 112 | `recurring.share_of_revenue` · gauge | EMPTY always (no table mapped) → "No activity recorded" | = | recurring-generated revenue ÷ sales net revenue. | Derived | VERIFY | SH,DS | — |
| 113 | `recurring.churned` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Count set to cancelled in window. Needs cancelled_at (updated_at is not a cancellation date). | Flow | COLUMN | DS | — |

## b2b_proposals (6)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 114 | `proposals.count` · stat | OperationsSource — ignores period; periods limited to live/today/this_month | = | Count proposals with date in window. Legacy key ignores the period — fix. | Flow | READY | DS | — |
| 115 | `proposals.pipeline_value` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Σ total_amount for status sent/draft not expired. | Live | READY | DS | — |
| 116 | `proposals.win_rate` · gauge | EMPTY always (no table mapped) → "No activity recorded" | = | accepted ÷ (accepted + rejected + expired) for proposals dated in window. | On-demand | READY | DS | — |
| 117 | `proposals.avg_value` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Σ total_amount ÷ count in window. | Derived | READY | DS | — |
| 118 | `proposals.stale` · list | EMPTY always (no table mapped) → "No activity recorded" | = | Open proposals with updated_at older than N days (default 14). | On-demand | READY | DS | — |
| 119 | `proposals.avg_cycle_days` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Mean (decided_at − date) for accepted in window. Needs decided_at. | On-demand | COLUMN | DS | — |

## pricing_tiers (5)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 120 | `pricing.tier_count` · stat | EMPTY always (no table mapped) → "No activity recorded" | currency → **count** | Count distinct customers.pricing_tier in use (unit was 'currency'). | Live | READY | MR | — |
| 121 | `pricing.revenue_by_tier` · breakdown | EMPTY always (no table mapped) → "No activity recorded" | = | Sales net revenue grouped by customers.pricing_tier (via customers.party_id); walk-in = "Retail". | Flow | READY | SH,MR | breakdown_sums_to_parent |
| 122 | `pricing.customers_by_tier` · breakdown | EMPTY always (no table mapped) → "No activity recorded" | = | Count customers grouped by pricing_tier. | Live | READY | MR | — |
| 123 | `pricing.avg_realised_price` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Σ net_amount ÷ Σ quantity across lines in window (D8: per unit across mixed products is only meaningful per product — consider ranking instead). | On-demand | DECIDE | SL | — |
| 124 | `pricing.discount_vs_list` · gauge | EMPTY always (no table mapped) → "No activity recorded" | = | Σ line discounts ÷ Σ gross_amount × 100. | Derived | READY | SL | — |

## park_recall (5)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 125 | `park.open_count` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Count parked_sales where expires_at is null or > now. | Live | READY | DS | — |
| 126 | `park.open_value` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Σ cart_data total of open parked sales (parse JSON once in PHP). | Live | READY | DS | — |
| 127 | `park.recalled_count` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Needs parked_sales.status + resolved_at (a recalled row is removed or unflagged today — VERIFY). | Flow | COLUMN | DS | — |
| 128 | `park.abandoned_count` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Needs parked_sales.status = abandoned/expired + resolved_at. | Flow | COLUMN | DS | — |
| 129 | `park.oldest` · stat | EMPTY always (no table mapped) → "No activity recorded" | count → **days** | Age in hours/days of the oldest open parked sale (unit 'count' → 'days'). | Live | READY | DS | — |

## table_service (8)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 130 | `tables.occupied` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Count occupancies with closed_at null (positions of kind table). | Live | READY | DS | — |
| 131 | `tables.occupancy_rate` · gauge | EMPTY always (no table mapped) → "No activity recorded" | = | Σ occupied minutes ÷ (table count × trading minutes in window) × 100. | On-demand | READY | DS | — |
| 132 | `tables.kitchen_pending` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Count work_orders kind kitchen with status not bumped/served (bumped_at null). | Live | READY | DS | — |
| 133 | `tables.avg_turn_minutes` · stat | EMPTY always (no table mapped) → "No activity recorded" | count → **minutes** | Mean (closed_at − opened_at) in minutes for occupancies closed in window (unit shown as minutes). | On-demand | READY | DS | — |
| 134 | `tables.covers` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Needs guests/covers captured on occupancies. | Flow | COLUMN | DS | — |
| 135 | `tables.avg_cover_value` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Table-service revenue ÷ covers. Needs covers. | Derived | COLUMN | DS,SH | — |
| 136 | `tables.revenue_per_table` · breakdown | EMPTY always (no table mapped) → "No activity recorded" | = | Sales linked to occupancy/position grouped by position label (confirm sale→occupancy link). | On-demand | VERIFY | SH,DS | — |
| 137 | `tables.peak_occupancy` · heatmap | EMPTY always (no table mapped) → "No activity recorded" | = | Occupied tables by weekday × hour across window. | On-demand | READY | DS | — |

## pre_sales (5)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 138 | `presales.count` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | D9: which document is a pre-order (sales_orders with amount_paid > 0? a flag?). Count in window. | Flow | DECIDE | DS | — |
| 139 | `presales.value` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Σ total of open pre-orders. | Live | DECIDE | DS | — |
| 140 | `presales.advance_collected` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Σ customer advances (role=customer_advance 2060 credits) in window. | Flow | DECIDE | GL | — |
| 141 | `presales.pending_delivery` · list | EMPTY always (no table mapped) → "No activity recorded" | = | Open pre-orders oldest first. | On-demand | DECIDE | DS | — |
| 142 | `presales.overdue` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Open pre-orders with delivery_date < today. | Live | DECIDE | DS | — |

## inventory (12)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 143 | `inventory.stock_value` · stat | FinanceSource (FIFO batches) — real | = | Σ remaining_qty × unit_cost on inventory_batches (FIFO) now. Already correct via FinanceSource. | Live | READY | SP | stock_value_control |
| 144 | `inventory.stock_value_trend` · trend | daily SUM(inventory_batches value col); value = last day — EMPTY if store has no inventory_batches rows | = | Daily closing balance of role=inventory (1100) — reconstructable history; operational FIFO shown as today point. | Ledger balance | READY | GL,SP | — |
| 145 | `inventory.product_count` · stat | InventorySource — counts all products | = | Distinct goods products with stock > 0 (today counts all products — decide). | Live | READY | SP | — |
| 146 | `inventory.units_on_hand` · stat | COUNT(*) of products rows (not the measure) — EMPTY if store has no products rows | currency → **count** | Σ stocks.quantity (unit was 'currency'). | Live | READY | SP | — |
| 147 | `inventory.low_stock_count` · stat | InventorySource — real (threshold column ambiguous) | = | 0 < qty ≤ threshold. D10: ONE threshold column (products has both alert_quantity and min_stock_alert). | Live | DECIDE | SP | — |
| 148 | `inventory.low_stock_list` · list | InventorySource — real list | = | Rows of low-stock products with qty and threshold. | On-demand | DECIDE | SP | — |
| 149 | `inventory.out_of_stock_count` · stat | InventorySource — real (includes services) | = | Goods products (not services) with qty ≤ 0. | Live | READY | SP | — |
| 150 | `inventory.dead_stock_value` · stat | COUNT(*) of products rows (not the measure) — EMPTY if store has no products rows | = | FIFO value of products with stock > 0 and no outbound sale line in last N days (default 90). | Live | READY | SP,SL | — |
| 151 | `inventory.turnover_ratio` · gauge | FAKE: success, value 0 | percent → **ratio** | COGS in window ÷ average of inventory balance at start and end (a ratio, unit was 'percent'). | Derived | READY | GL | — |
| 152 | `inventory.days_of_cover` · stat | COUNT(*) of products rows (not the measure) — EMPTY if store has no products rows | percent → **days** | Units on hand ÷ average daily units sold over last 30 days (unit was 'percent'). | Derived | READY | SP,SL | — |
| 153 | `inventory.value_by_category` · breakdown | FAKE: success, value 0, no segments | = | FIFO value grouped by product category. Sum = stock_value. | Live | READY | SP | breakdown_sums_to_parent |
| 154 | `inventory.top_by_value` · list | FAKE: success, value 0, no rows | = | Products by FIFO value desc, top 10. | On-demand | READY | SP | — |

## multi_location (6)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 155 | `locations.count` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Count warehouses active. | Live | READY | MR | — |
| 156 | `locations.revenue_by_location` · breakdown | EMPTY always (no table mapped) → "No activity recorded" | = | Sales net revenue grouped by sales.warehouse_id. | Flow | READY | SH | breakdown_sums_to_parent |
| 157 | `locations.profit_by_location` · breakdown | EMPTY always (no table mapped) → "No activity recorded" | = | D11: gross profit by warehouse (revenue − FIFO cogs); expenses carry no location today. | Flow | DECIDE | SH,SL | — |
| 158 | `locations.stock_by_location` · breakdown | EMPTY always (no table mapped) → "No activity recorded" | = | FIFO value grouped by inventory_batches.warehouse_id. | Live | READY | SP | — |
| 159 | `locations.revenue_trend_by_location` · trend | EMPTY always (no table mapped) → "No activity recorded" | = | Multi-series revenue per warehouse. | Flow | READY | SH | — |
| 160 | `locations.stock_imbalance` · list | EMPTY always (no table mapped) → "No activity recorded" | currency → **count** | Products out/low at ≥ 1 warehouse while another holds > threshold × 2. | On-demand | READY | SP | — |

## stock_transfers (5)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 161 | `transfers.pending_count` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Count stock_transfers in pending/in_transit (confirm status values). | Live | VERIFY | DS | — |
| 162 | `transfers.pending_value` · stat | EMPTY always (no table mapped) → "No activity recorded" | days → **currency** | Σ item qty × current FIFO unit cost for pending transfers (unit was 'days'). | Live | VERIFY | DS,SP | — |
| 163 | `transfers.count` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Count transfers completed_at in window. | Flow | READY | DS | — |
| 164 | `transfers.avg_transit_days` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Mean (completed_at − transfer_date) for transfers completed in window. | On-demand | READY | DS | — |
| 165 | `transfers.discrepancy_count` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Needs stock_transfer_items.received_quantity. | On-demand | COLUMN | DS | — |

## stock_takes (5)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 166 | `stocktakes.pending_count` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Count stock_takes status draft/in_progress. | Live | READY | DS | — |
| 167 | `stocktakes.variance_value` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Σ difference × cost_price on items of stock takes completed in window (signed). | Flow | READY | DS | — |
| 168 | `stocktakes.variance_pct` · gauge | EMPTY always (no table mapped) → "No activity recorded" | = | 100 − Σ/difference/ ÷ Σ expected_quantity × 100 for completed in window. | On-demand | READY | DS | — |
| 169 | `stocktakes.last_count_days` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Days since latest completed stock take. | Live | READY | DS | — |
| 170 | `stocktakes.top_variances` · list | EMPTY always (no table mapped) → "No activity recorded" | = | Items by /difference × cost_price/ desc in window. | On-demand | READY | DS | — |

## batches_expiry (7)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 171 | `batches.count` · stat | COUNT(*) of batches rows (not the measure) — EMPTY if store has no batches rows | = | D12: inventory_batches is the batch truth (legacy batches/product_batches tables also exist). Count batches remaining_qty > 0. | Live | DECIDE | SP | — |
| 172 | `batches.qty` · stat | COUNT(*) of batches rows (not the measure) — EMPTY if store has no batches rows | = | Σ remaining_qty on inventory_batches with expiry tracking. | Live | READY | SP | — |
| 173 | `batches.expiring_30` · stat | COUNT(*) of batches rows (not the measure) — EMPTY if store has no batches rows | days → **count** | Count batches remaining_qty > 0 with expiry_date within 30 days (unit was 'days'). | Live | READY | SP | — |
| 174 | `batches.expiring_value` · stat | COUNT(*) of batches rows (not the measure) — EMPTY if store has no batches rows | = | Σ remaining_qty × unit_cost for those batches. | Live | READY | SP | — |
| 175 | `batches.expired_value` · stat | COUNT(*) of batches rows (not the measure) — EMPTY if store has no batches rows | = | Value written off for expiry in window (confirm a write-off movement/journal reference exists). | Flow | VERIFY | SM,GL | — |
| 176 | `batches.expiry_list` · list | FAKE: success, value 0, no rows | = | Batches soonest expiry first with product, qty, value. | On-demand | READY | SP | — |
| 177 | `batches.write_off_trend` · trend | daily COUNT(*) of batches; value = last day — EMPTY if store has no batches rows | count → **currency** | Series of batches.expired_value. | Flow | VERIFY | SM,GL | — |

## serials (5)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 178 | `serials.count` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Count product_serials. | Live | READY | MR | — |
| 179 | `serials.in_stock` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Count status = in_stock (confirm values). | Live | VERIFY | MR | — |
| 180 | `serials.under_warranty` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Needs product_serials.sold_at + warranty_until. | Live | COLUMN | MR | — |
| 181 | `serials.warranty_expiring` · list | EMPTY always (no table mapped) → "No activity recorded" | = | Needs warranty_until. | On-demand | COLUMN | MR | — |
| 182 | `serials.returned` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Returned in window needs a status-change date. | Flow | COLUMN | MR | — |

## variants (5)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 183 | `variants.count` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Count product_variants active. | Live | READY | MR | — |
| 184 | `variants.top_variants` · list | EMPTY always (no table mapped) → "No activity recorded" | = | Variants by Σ quantity sold in window. | On-demand | READY | SL | — |
| 185 | `variants.slow_variants` · list | EMPTY always (no table mapped) → "No activity recorded" | = | Variants in stock with lowest units sold in window. | On-demand | READY | SL,SP | — |
| 186 | `variants.out_of_stock` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | D13: variant stock lives in product_variants.stock AND inventory_batches.variant_id — pick one. | Live | DECIDE | SP | — |
| 187 | `variants.size_colour_mix` · breakdown | EMPTY always (no table mapped) → "No activity recorded" | currency → **count** | Units sold grouped by variant attribute value (variant_attributes). | On-demand | READY | SL,MR | — |

## barcodes_labels (5)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 188 | `barcodes.coverage_pct` · gauge | EMPTY always (no table mapped) → "No activity recorded" | = | Goods products with ≥ 1 active product_barcodes row (or products.sku as barcode — decide) ÷ goods products. | Live | READY | MR | — |
| 189 | `barcodes.missing_count` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Goods products with no active barcode. | Live | READY | MR | — |
| 190 | `barcodes.labels_printed` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | No label-print log exists. Needs label_print_jobs. | Flow | FEATURE | MR | — |
| 191 | `barcodes.scan_share` · gauge | EMPTY always (no table mapped) → "No activity recorded" | = | Needs sale_items.entry_method (scan/search/manual) written by the POS. | Flow | COLUMN | SL | — |
| 192 | `barcodes.duplicate_count` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Count barcodes appearing on > 1 product within the tenant. | Live | READY | MR | — |

## units_of_measure (5)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 193 | `uom.count` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Count distinct units used by products (base + secondary). | Live | READY | MR | — |
| 194 | `uom.conversion_count` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Count product_uom_conversions + product_units rows. | Live | READY | MR | — |
| 195 | `uom.sales_by_uom` · breakdown | EMPTY always (no table mapped) → "No activity recorded" | currency → **count** | Needs the selling unit on sale_items (exists on order/quote lines, not sale lines). | Flow | COLUMN | SL | — |
| 196 | `uom.missing_conversion` · stat | EMPTY always (no table mapped) → "No activity recorded" | currency → **count** | Products with secondary_unit set but conversion_rate null/0 (unit was 'currency'). | Live | READY | MR | — |
| 197 | `uom.bulk_vs_retail` · breakdown | EMPTY always (no table mapped) → "No activity recorded" | = | Needs selling unit on sale_items. | Flow | COLUMN | SL | — |

## purchases (9)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 198 | `purchases.spend` · stat | COUNT(*) of purchases rows (not the measure) — EMPTY if store has no purchases rows | = | Σ purchases.total, workflow_status posted/received (never 'invoices'), purchase_date in window. Generic resolver counts rows today. | Flow | READY | PH | — |
| 199 | `purchases.spend_trend` · trend | daily SUM(purchases value col); value = last day — EMPTY if store has no purchases rows | = | Series of purchases.spend. | Flow | READY | PH | — |
| 200 | `purchases.count` · stat | COUNT(*) of purchases rows (not the measure) — EMPTY if store has no purchases rows | = | Count posted purchases in window. | Flow | READY | PH | — |
| 201 | `purchases.unpaid_value` · stat | COUNT(*) of purchases rows (not the measure) — EMPTY if store has no purchases rows | = | Σ (total − ledger-derived paid) over open purchases. Must equal core.payables for bills (advances aside). | Live | READY | PH,GL | payables_control |
| 202 | `purchases.overdue_value` · stat | COUNT(*) of purchases rows (not the measure) — EMPTY if store has no purchases rows | = | Open amount on purchases with due_date < today. | Live | READY | PH,GL | — |
| 203 | `purchases.paid_to_suppliers` · stat | COUNT(*) of purchases rows (not the measure) — EMPTY if store has no purchases rows | count → **currency** | Σ AP debits on non-reversed purchase_payment entries in window (unit was 'count'). | Flow | READY | GL,PE | — |
| 204 | `purchases.by_supplier` · breakdown | FAKE: success, value 0, no segments | = | purchases.spend grouped by party. | Flow | READY | PH | breakdown_sums_to_parent |
| 205 | `purchases.by_category` · breakdown | FAKE: success, value 0, no segments | = | Σ purchase_items.line_total grouped by product category. | Flow | READY | PL | — |
| 206 | `purchases.price_increases` · list | FAKE: success, value 0, no rows | = | Products whose latest unit_cost > previous purchase unit_cost, with % change. | On-demand | READY | PL | — |

## purchase_orders (6)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 207 | `po.open_count` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Count purchase_orders in open/sent/partial (confirm values). | Live | VERIFY | DS | — |
| 208 | `po.open_value` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Σ total_amount of open POs. | Live | VERIFY | DS | — |
| 209 | `po.pending_receipt_value` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Σ (quantity − received_quantity) × unit_cost on open PO lines. | Live | READY | DS | — |
| 210 | `po.overdue_count` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Open POs with expected_delivery_date < today. | Live | READY | DS | — |
| 211 | `po.avg_lead_days` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Needs received_at (or the receiving purchase linked to the PO). | On-demand | COLUMN | DS | — |
| 212 | `po.fill_rate` · gauge | EMPTY always (no table mapped) → "No activity recorded" | = | Σ received_quantity ÷ Σ quantity for POs closed in window (closing date needs VERIFY). | On-demand | READY | DS | — |

## purchase_returns (5)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 213 | `purchase_returns.count` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Count purchase_returns with return_date in window. | Flow | READY | PH | — |
| 214 | `purchase_returns.value` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Σ total_amount in window. | Flow | READY | PH | — |
| 215 | `purchase_returns.credit_due` · stat | EMPTY always (no table mapped) → "No activity recorded" | count → **currency** | Σ open debit_notes amount (unit was 'count'; confirm status flow). | Live | VERIFY | PH | — |
| 216 | `purchase_returns.by_supplier` · breakdown | EMPTY always (no table mapped) → "No activity recorded" | = | Returns value grouped by purchases.party_id. | Flow | READY | PH | — |
| 217 | `purchase_returns.rate` · gauge | EMPTY always (no table mapped) → "No activity recorded" | = | returns value ÷ purchases.spend × 100. | Derived | READY | PH | — |

## landed_cost (5)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 218 | `landed.total` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Σ expenses.amount where is_landed_cost = 1, date in window. | Flow | READY | EE | — |
| 219 | `landed.pct_of_goods` · gauge | EMPTY always (no table mapped) → "No activity recorded" | = | landed.total ÷ Σ subtotal of purchases those expenses attach to × 100. | Derived | READY | EE,PH | — |
| 220 | `landed.by_type` · breakdown | EMPTY always (no table mapped) → "No activity recorded" | = | landed.total grouped by expense category. | Flow | READY | EE | — |
| 221 | `landed.true_cost_gap` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Same money as landed.total per purchase, shown as invoice cost vs true cost. | Derived | READY | EE,PH | — |
| 222 | `landed.trend` · trend | EMPTY always (no table mapped) → "No activity recorded" | = | Series of landed.total. | Flow | READY | EE | — |

## cookbook (6)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 223 | `cookbook.recipe_count` · stat | EMPTY always (no table mapped) → "No activity recorded" | currency → **count** | Count active compositions (unit was 'currency'). | Live | READY | MR | — |
| 224 | `cookbook.recipe_cost_pct` · gauge | EMPTY always (no table mapped) → "No activity recorded" | = | Mean of ingredient cost (current FIFO/avg cost) ÷ selling price across recipes. | Live | READY | MR,SP | — |
| 225 | `cookbook.best_margin` · list | EMPTY always (no table mapped) → "No activity recorded" | = | Recipes ranked by (price − ingredient cost) ÷ price. | On-demand | READY | MR | — |
| 226 | `cookbook.worst_margin` · list | EMPTY always (no table mapped) → "No activity recorded" | = | Ascending of best_margin. | On-demand | READY | MR | — |
| 227 | `cookbook.ingredient_cost_trend` · trend | EMPTY always (no table mapped) → "No activity recorded" | = | Weighted unit_cost of ingredient products on purchase lines per grain. | Flow | READY | PL | — |
| 228 | `cookbook.wastage_value` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | No wastage capture exists (recipe wastage_percent is a plan, not an event). | Flow | FEATURE | PR | — |

## production_runs (8)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 229 | `production.run_count` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Count production_runs completed_at in window. | Flow | READY | PR | — |
| 230 | `production.total_cost` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Σ total_cost of runs completed in window. | Flow | READY | PR | — |
| 231 | `production.output_qty` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Σ actual_qty (fallback quantity_made — VERIFY) for completed runs. | Flow | READY | PR | — |
| 232 | `production.cost_per_unit` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | total_cost ÷ output_qty. | Derived | READY | PR | — |
| 233 | `production.yield_pct` · gauge | EMPTY always (no table mapped) → "No activity recorded" | = | Σ actual_qty ÷ Σ planned_qty × 100 for completed runs. | Derived | READY | PR | — |
| 234 | `production.wastage_value` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | No wastage capture on runs. | Flow | FEATURE | PR | — |
| 235 | `production.in_progress` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Count runs in in_progress/started status. | Live | READY | PR | — |
| 236 | `production.output_trend` · trend | EMPTY always (no table mapped) → "No activity recorded" | currency → **count** | Series of output_qty (unit was 'currency'). | Flow | READY | PR | — |

## composite_items (5)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 237 | `composite.count` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Count products that are compositions/kits. | Live | READY | MR | — |
| 238 | `composite.revenue` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Σ net_amount of sale lines whose product is a composition. | Flow | READY | SL | — |
| 239 | `composite.margin` · gauge | EMPTY always (no table mapped) → "No activity recorded" | = | (composite revenue − FIFO cogs of those lines) ÷ composite revenue. | Derived | READY | SL | — |
| 240 | `composite.top_bundles` · list | EMPTY always (no table mapped) → "No activity recorded" | = | Compositions by units sold in window. | On-demand | READY | SL | — |
| 241 | `composite.component_shortage` · list | EMPTY always (no table mapped) → "No activity recorded" | = | Kits where any component stock < qty_per_unit. | On-demand | READY | MR,SP | — |

## khata_credit (9)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 242 | `khata.receivable_total` · stat | EMPTY always (no table mapped) → "No activity recorded" | count → **currency** | Balance of role=ar as of end (unit was 'count'). Same measure as core.receivables. | Ledger balance | READY | GL,PB | receivables_control |
| 243 | `khata.payable_total` · stat | EMPTY always (no table mapped) → "No activity recorded" | count → **currency** | Balance of role=ap as of end (unit was 'count'). | Ledger balance | READY | GL,PB | payables_control |
| 244 | `khata.net_position` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | receivable_total − payable_total. | Derived | READY | GL | — |
| 245 | `khata.biggest_debtors` · list | EMPTY always (no table mapped) → "No activity recorded" | = | Per-party AR > 0, largest first. | On-demand | READY | PB | — |
| 246 | `khata.overdue_total` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Open amount of credit sales with due_date < today. | Live | READY | PB,SH | — |
| 247 | `khata.aging` · breakdown | EMPTY always (no table mapped) → "No activity recorded" | days → **currency** | Same as core.receivables_aging (unit was 'days'). | On-demand | READY | PB | aging_sums_to_total |
| 248 | `khata.collected` · stat | EMPTY always (no table mapped) → "No activity recorded" | count → **currency** | Σ role=ar credits on payment/receipt entries in window (unit was 'count'). | Flow | READY | GL,PE | — |
| 249 | `khata.collection_trend` · trend | EMPTY always (no table mapped) → "No activity recorded" | = | Series of khata.collected. | Flow | READY | GL | — |
| 250 | `khata.over_limit` · list | EMPTY always (no table mapped) → "No activity recorded" | count → **currency** | Parties with AR balance > credit_limit > 0. | On-demand | READY | PB,MR | — |

## payments (8)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 251 | `payments.received` · stat | COUNT(*) of payments rows (not the measure) — EMPTY if store has no payments rows | = | Same measure as cash_in (cash/bank debits, internal transfers excluded). | Flow | READY | GL,PE | — |
| 252 | `payments.received_trend` · trend | daily SUM(payments value col); value = last day — EMPTY if store has no payments rows | = | Series of payments.received. | Flow | READY | GL | — |
| 253 | `payments.paid` · stat | COUNT(*) of payments rows (not the measure) — EMPTY if store has no payments rows | = | Same measure as cash_out. | Flow | READY | GL,PE | — |
| 254 | `payments.net_flow` · stat | COUNT(*) of payments rows (not the measure) — EMPTY if store has no payments rows | = | received − paid. | Derived | READY | GL | — |
| 255 | `payments.by_method` · breakdown | FAKE: success, value 0, no segments | = | Receipts grouped by method from payments + sales.payment_method; must sum to payments.received (confirm every receipt writes a payments row). | Flow | VERIFY | PE,SH | breakdown_sums_to_parent |
| 256 | `payments.cash_vs_digital` · gauge | FAKE: success, value 0 | = | cash-method receipts ÷ payments.received. | Derived | VERIFY | PE | — |
| 257 | `payments.unallocated` · list | FAKE: success, value 0, no rows | = | Payment journal entries whose amount > Σ active payment_allocations. | On-demand | READY | PE,GL | — |
| 258 | `payments.bounced` · stat | COUNT(*) of payments rows (not the measure) — EMPTY if store has no payments rows | = | payments has no status. Needs status + bounced_at and a bounce flow. | Flow | COLUMN | PE | — |

## expenses (9)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 259 | `expenses.count` · stat | COUNT(*) of expenses rows (not the measure) — EMPTY if store has no expenses rows | = | Count expenses dated in window. | Flow | READY | EE | — |
| 260 | `expenses.trend` · trend | daily SUM(expenses value col); value = last day — EMPTY if store has no expenses rows | = | Σ grand_total per grain (reconciles to ledger opex for expense-sourced entries). | Flow | READY | EE,GL | — |
| 261 | `expenses.by_category` · breakdown | FAKE: success, value 0, no segments | = | Σ grand_total grouped by expense_category. | Flow | READY | EE | breakdown_sums_to_parent |
| 262 | `expenses.top_categories` · list | FAKE: success, value 0, no rows | = | Categories desc, top 5. | On-demand | READY | EE | — |
| 263 | `expenses.unpaid` · stat | COUNT(*) of expenses rows (not the measure) — EMPTY if store has no expenses rows | = | Σ (grand_total − amount_paid) > 0. | Live | READY | EE | — |
| 264 | `expenses.largest` · list | FAKE: success, value 0, no rows | count → **currency** | Top 10 single expenses in window (unit was 'count'). | On-demand | READY | EE | — |
| 265 | `expenses.recurring_total` · stat | COUNT(*) of expenses rows (not the measure) — EMPTY if store has no expenses rows | = | No recurring flag/template on expenses. | Live | FEATURE | EE | — |
| 266 | `expenses.per_day` · stat | COUNT(*) of expenses rows (not the measure) — EMPTY if store has no expenses rows | = | expense total ÷ calendar days in window (elapsed days for current periods). | Derived | READY | EE | — |
| 267 | `expenses.vs_prev` · stat | COUNT(*) of expenses rows (not the measure) — EMPTY if store has no expenses rows | = | expense total − previous window total. | Derived | READY | EE | — |

## cash_register (7)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 268 | `register.open_count` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | No till shift/session table exists (registers holds devices only). | Live | FEATURE | DS | — |
| 269 | `register.cash_in_drawer` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Needs register_shifts opening float + cash movements per shift. | Live | FEATURE | DS,GL | — |
| 270 | `register.cash_sales` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Needs sales.register_shift_id. | Live | FEATURE | DS,SH | — |
| 271 | `register.expected_vs_actual` · stat | EMPTY always (no table mapped) → "No activity recorded" | count → **currency** | Needs counted_cash on shift close. | On-demand | FEATURE | DS | — |
| 272 | `register.variance_total` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Needs shift variance. | Flow | FEATURE | DS | — |
| 273 | `register.by_staff` · breakdown | EMPTY always (no table mapped) → "No activity recorded" | count → **currency** | Needs shift variance by user. | Flow | FEATURE | DS | — |
| 274 | `register.shift_count` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Needs closed shifts. | Flow | FEATURE | DS | — |

## bank_accounts (9)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 275 | `bank.account_count` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Count bank_accounts (type bank). | Live | READY | MR | — |
| 276 | `bank.balances_total` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Balance of role=bank (1010 + child accounts) as of end — ledger, not bank_accounts.current_balance. | Ledger balance | READY | GL | liquidity_identity |
| 277 | `bank.balance_trend` · trend | EMPTY always (no table mapped) → "No activity recorded" | days → **currency** | Daily closing role=bank balance (unit was 'days'). | Ledger balance | READY | GL | — |
| 278 | `bank.balance_by_account` · breakdown | EMPTY always (no table mapped) → "No activity recorded" | count → **currency** | All banks post to one GL account 1010 — per-bank needs journal_items.bank_account_id (unit was 'count'). | Ledger balance | COLUMN | GL | — |
| 279 | `bank.top_account` · stat | EMPTY always (no table mapped) → "No activity recorded" | count → **currency** | Largest of balance_by_account. | Ledger balance | COLUMN | GL | — |
| 280 | `bank.money_in` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Σ debits on role=bank lines, excluding bank-to-bank transfers (a cash deposit into bank IS money in). | Flow | READY | GL | — |
| 281 | `bank.money_out` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Σ credits on role=bank lines, excluding bank-to-bank transfers (a withdrawal to cash IS money out). | Flow | READY | GL | — |
| 282 | `bank.cash_vs_bank` · breakdown | EMPTY always (no table mapped) → "No activity recorded" | = | Two segments: role=cash balance, role=bank balance. Sum = core.total_liquidity. | Ledger balance | READY | GL | breakdown_sums_to_parent |
| 283 | `bank.idle_accounts` · list | EMPTY always (no table mapped) → "No activity recorded" | = | Accounts with no ledger movement in N days — needs the bank dimension. | On-demand | COLUMN | GL | — |

## bank_reconciliation (5)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 284 | `recon.unreconciled_count` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | No bank statement import / matching exists. Needs bank_statement_lines + reconciliation matches. | Live | FEATURE | GL | — |
| 285 | `recon.unreconciled_value` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | No bank statement import / matching exists. Needs bank_statement_lines + reconciliation matches. | Live | FEATURE | GL | — |
| 286 | `recon.matched_pct` · gauge | EMPTY always (no table mapped) → "No activity recorded" | = | No bank statement import / matching exists. Needs bank_statement_lines + reconciliation matches. | On-demand | FEATURE | GL | — |
| 287 | `recon.last_recon_days` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | No bank statement import / matching exists. Needs bank_statement_lines + reconciliation matches. | Live | FEATURE | GL | — |
| 288 | `recon.difference` · stat | EMPTY always (no table mapped) → "No activity recorded" | count → **currency** | No bank statement import / matching exists. Needs bank_statement_lines + reconciliation matches. | Live | FEATURE | GL | — |

## accounting_workspace (9)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 289 | `accounting.trial_balance_ok` · status | EMPTY always (no table mapped) → "No activity recorded" | = | ok when Σdr = Σcr on non-reversed entries up to end. | Check | READY | GL | balanced_books |
| 290 | `accounting.assets_total` · stat | EMPTY always (no table mapped) → "No activity recorded" | count → **currency** | Σ asset balances as of end (unit was 'count'). | Ledger balance | READY | GL | accounting_equation |
| 291 | `accounting.liabilities_total` · stat | EMPTY always (no table mapped) → "No activity recorded" | count → **currency** | Σ liability balances as of end. | Ledger balance | READY | GL | accounting_equation |
| 292 | `accounting.equity_total` · stat | EMPTY always (no table mapped) → "No activity recorded" | count → **currency** | Σ equity balances + retained earnings (all-time net profit) as of end. | Ledger balance | READY | GL | accounting_equation |
| 293 | `accounting.equity_trend` · trend | EMPTY always (no table mapped) → "No activity recorded" | count → **currency** | Daily closing equity incl. running retained earnings. | Ledger balance | READY | GL | — |
| 294 | `accounting.pnl_summary` · breakdown | EMPTY always (no table mapped) → "No activity recorded" | count → **currency** | Segments: revenue, cogs, gross profit, opex, net profit — identical to the P&L report for the window. | Derived | READY | GL | net_profit_identity |
| 295 | `accounting.balance_sheet` · breakdown | EMPTY always (no table mapped) → "No activity recorded" | count → **currency** | Segments: assets, liabilities, equity as of end. | Ledger balance | READY | GL | accounting_equation |
| 296 | `accounting.unposted_count` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Posted sales/purchases/expenses with no matching journal entry (source_id / journal_entry_id). | Live | READY | GL,SH,PH,EE | — |
| 297 | `accounting.drawings` · stat | EMPTY always (no table mapped) → "No activity recorded" | count → **currency** | Σ owner drawings in window (confirm posting: reference_type 'owner_drawing' and its account). | Flow | VERIFY | GL | — |

## tax_compliance (8)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 298 | `tax.collected` · stat | EMPTY always (no table mapped) → "No activity recorded" | count → **currency** | Σ(cr−dr) on role=tax_output (2100) in window (unit was 'count'). | Flow | READY | GL,TX | tax_control |
| 299 | `tax.paid` · stat | EMPTY always (no table mapped) → "No activity recorded" | count → **currency** | Σ(dr−cr) on role=tax_input (2300) in window. | Flow | READY | GL,TX | tax_control |
| 300 | `tax.net_liability` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Balance 2100 − balance 2300 as of end. | Ledger balance | READY | GL | — |
| 301 | `tax.liability_trend` · trend | EMPTY always (no table mapped) → "No activity recorded" | = | Daily closing (2100 − 2300). | Ledger balance | READY | GL | — |
| 302 | `tax.by_rate` · breakdown | EMPTY always (no table mapped) → "No activity recorded" | percent → **currency** | Σ sale_items.tax_amount grouped by tax_rate (unit was 'percent'; values are money). | Flow | READY | SL,TX | breakdown_sums_to_parent |
| 303 | `tax.taxable_vs_exempt` · breakdown | EMPTY always (no table mapped) → "No activity recorded" | = | Net revenue split: lines with tax_rate > 0 vs = 0 / exempt customers. | Flow | READY | SL | — |
| 304 | `tax.filing_due` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Needs tax filing frequency + due-day settings (settings keys, not a table). | Live | COLUMN | TX | — |
| 305 | `tax.invoices_missing_tax` · list | EMPTY always (no table mapped) → "No activity recorded" | = | Recognised sales with total_tax = 0 containing a product with tax_rate > 0. | On-demand | READY | SH,SL | — |

## fixed_assets (6)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 306 | `assets.count` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | No fixed-asset register exists. | Live | FEATURE | MR | — |
| 307 | `assets.gross_value` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Interim: balance of role=fixed_asset (1500). Full card needs fixed_assets. | Ledger balance | FEATURE | GL | — |
| 308 | `assets.net_book_value` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Needs accumulated depreciation account + register. | Ledger balance | FEATURE | GL | — |
| 309 | `assets.depreciation_period` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Needs depreciation postings. | Flow | FEATURE | GL | — |
| 310 | `assets.by_category` · breakdown | EMPTY always (no table mapped) → "No activity recorded" | = | Needs register categories. | Live | FEATURE | MR | — |
| 311 | `assets.warranty_amc_due` · list | EMPTY always (no table mapped) → "No activity recorded" | currency → **count** | Needs register warranty/AMC dates. | On-demand | FEATURE | MR | — |

## loans (6)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 312 | `loans.count` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | No loans table exists. | Live | FEATURE | MR | — |
| 313 | `loans.outstanding_total` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Interim: balance of role=loan (2200). Full card needs loans. | Ledger balance | FEATURE | GL | — |
| 314 | `loans.outstanding_trend` · trend | EMPTY always (no table mapped) → "No activity recorded" | = | Interim: daily closing 2200. | Ledger balance | FEATURE | GL | — |
| 315 | `loans.emi_due` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Needs loan_installments. | Live | FEATURE | MR | — |
| 316 | `loans.interest_paid` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Needs an interest expense account + postings. | Flow | FEATURE | GL | — |
| 317 | `loans.by_lender` · breakdown | EMPTY always (no table mapped) → "No activity recorded" | = | Needs loans.lender / party. | Ledger balance | FEATURE | GL | — |

## reports (6)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 318 | `reports.pnl_shortcut` · breakdown | EMPTY always (no table mapped) → "No activity recorded" | = | Same payload as accounting.pnl_summary (point, never copy). | Derived | READY | GL | — |
| 319 | `reports.sales_shortcut` · breakdown | EMPTY always (no table mapped) → "No activity recorded" | = | Segments: gross sales, discounts, returns, net sales, tax for window. | Derived | READY | SH,GL | — |
| 320 | `reports.stock_shortcut` · breakdown | EMPTY always (no table mapped) → "No activity recorded" | = | Segments: stock value by category (same measure as inventory.value_by_category). | Live | READY | SP | — |
| 321 | `reports.saved_count` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | No saved-report store exists. | Live | FEATURE | MR | — |
| 322 | `reports.most_used` · list | EMPTY always (no table mapped) → "No activity recorded" | = | No report-usage log exists. | On-demand | FEATURE | MR | — |
| 323 | `reports.scheduled_count` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | No scheduled-report store exists. | Live | FEATURE | MR | — |

## ai_insights (6)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 324 | `ai.top_insight` · status | EMPTY always (no table mapped) → "No activity recorded" | = | Highest-priority ai_recommendations not dismissed and valid (confirm table is tenant-scoped). | Check | VERIFY | DS | — |
| 325 | `ai.alerts_open` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Count ai_recommendations not dismissed and valid_until ≥ now. | Live | VERIFY | DS | — |
| 326 | `ai.anomalies` · list | EMPTY always (no table mapped) → "No activity recorded" | = | D14: anomalies = measure days outside ±3σ of trailing 8 same-weekdays, computed from reckoner_daily (deterministic, no LLM). | On-demand | DECIDE | GL,SH | — |
| 327 | `ai.forecast_revenue` · trend | EMPTY always (no table mapped) → "No activity recorded" | = | Forecast series from reckoner_daily revenue (documented method, e.g. seasonal naive); labelled as forecast. | Derived | DECIDE | GL | — |
| 328 | `ai.forecast_cash` · trend | EMPTY always (no table mapped) → "No activity recorded" | = | Liquidity closing + forecast net cash flow. | Derived | DECIDE | GL | — |
| 329 | `ai.reorder_suggestions` · list | EMPTY always (no table mapped) → "No activity recorded" | = | Products where qty ≤ average daily units × lead days + threshold. | On-demand | READY | SP,SL | — |

## loyalty_gift (6)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 330 | `loyalty.member_count` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Count loyalty_balances rows (members). | Live | READY | MR | — |
| 331 | `loyalty.new_members` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Count loyalty_balances created_at in window. | Flow | READY | MR | — |
| 332 | `loyalty.member_revenue_share` · gauge | EMPTY always (no table mapped) → "No activity recorded" | = | Net revenue from member parties ÷ total net revenue. | Derived | READY | SH,MR | — |
| 333 | `loyalty.member_avg_spend` · breakdown | EMPTY always (no table mapped) → "No activity recorded" | = | Two segments: avg spend per member customer vs non-member customer in window. | On-demand | READY | SH,MR | — |
| 334 | `loyalty.liability` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Σ balance × point value — needs the point-value setting. | Live | COLUMN | MR | — |
| 335 | `loyalty.gift_card_balance` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Σ gift_cards.current_balance where status active and not expired. | Live | READY | MR | — |

## marketplace_sync (6)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 336 | `marketplace.channel_count` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Count ecommerce_channels is_connected + woo_connections active. | Live | READY | MR | — |
| 337 | `marketplace.revenue_by_channel` · breakdown | EMPTY always (no table mapped) → "No activity recorded" | = | Net revenue grouped by ecommerce_channel_id (null = in-store). | Flow | READY | SH | breakdown_sums_to_parent |
| 338 | `marketplace.online_vs_offline` · breakdown | EMPTY always (no table mapped) → "No activity recorded" | count → **currency** | Two segments of net revenue (unit was 'count'). | Flow | READY | SH | — |
| 339 | `marketplace.sync_errors` · stat | EMPTY always (no table mapped) → "No activity recorded" | = | Count woo_sync_queue failed + channels with sync_status error. | Live | READY | DS | — |
| 340 | `marketplace.stock_mismatch` · list | EMPTY always (no table mapped) → "No activity recorded" | = | woo_product_links with conflict_data / sync_status conflict. | On-demand | VERIFY | DS | — |
| 341 | `marketplace.channel_margin` · breakdown | EMPTY always (no table mapped) → "No activity recorded" | = | (net revenue − FIFO cogs − gross_platform_fee) ÷ net revenue per channel. | Flow | READY | SH,SL | — |

## staff_attendance (8)

| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |
|---|---|---|---|---|---|---|---|---|
| 342 | `staff.member_count` · stat | StaffSource — counts invited/suspended too | = | Count tenant_users status = active (legacy key counts invited/suspended too). | Live | READY | AT,MR | — |
| 343 | `staff.on_shift_count` · stat | StaffSource — server date, not store timezone | = | Attendance with check_out null and check_in on today (tenant tz, not server date). | Live | READY | AT | — |
| 344 | `staff.present_today` · stat | COUNT(*) of tenant_users rows (not the measure) — EMPTY if store has no tenant_users rows | = | Distinct user with check_in today (tenant tz). | Live | READY | AT | — |
| 345 | `staff.absent_today` · list | FAKE: success, value 0, no rows | = | Active members expected to attend (D15: which roles) with no check_in today. | On-demand | DECIDE | AT | — |
| 346 | `staff.hours_worked` · stat | COUNT(*) of tenant_users rows (not the measure) — EMPTY if store has no tenant_users rows | currency → **hours** | Σ (check_out or now − check_in) − total_gap_minutes, in hours (unit was 'currency'). | Flow | READY | AT | — |
| 347 | `staff.attendance_rate` · gauge | FAKE: success, value 0 | = | Present person-days ÷ (expected staff × working days elapsed). | On-demand | DECIDE | AT | — |
| 348 | `staff.sales_by_staff` · breakdown | FAKE: success, value 0, no segments | = | Net revenue grouped by sales.user_id. | Flow | READY | SH | breakdown_sums_to_parent |
| 349 | `staff.revenue_per_staff` · stat | COUNT(*) of tenant_users rows (not the measure) — EMPTY if store has no tenant_users rows | = | Net revenue ÷ distinct selling users in window. | Derived | READY | SH | — |