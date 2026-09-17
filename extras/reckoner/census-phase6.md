# Reckoner Baseline Census Report

**Date:** 2026-09-16T21:39:04+00:00
**Tenant:** `Reckoner Golden Store` (ID: `1001758`, Slug: `golden-store`, Plan: `scale`)
**Window:** `2026-08-01` to `2026-08-31`

## 1. Summary Scorecard

| Metric | Count / Status |
|---|---|
| **Total registered cards** | **349** |
| **Verified and matching golden** | **63 / 349** |
| **Contract State: Unimplemented** | 57 |
| **Contract State: Implemented Unverified** | 229 |
| **Contract State: Verified** | 63 |
| **Dispatch: Generic Resolver** | 0 |
| **Dispatch: Legacy Source** | 57 |
| **Dispatch: Unmapped** | 0 |

### Envelope Status Breakdown

| Status | Count | Meaning |
|---|---|---|
| `ok` | **238** | Resolver executed and reported success |
| `empty` | **40** | Resolver executed, reported empty/no data |
| `locked` | **14** | Gated by plan, module, or user permissions |
| `unavailable` | **57** | Contract not implemented or data not captured |

## 2. All 349 Cards Census

| # | Key | Module | Shape | Dispatch | Contract | Status | Value Today | Golden Expected | Match |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `core.revenue` | Qore | stat | MeasureEngine | verified | `ok` | 7,700.00 | 7,700.00 | YES |
| 2 | `core.revenue_trend` | Qore | trend | MeasureEngine | implemented_unverified | `ok` | 7,700.00 | - | - |
| 3 | `core.net_profit` | Qore | stat | MeasureEngine | verified | `ok` | 500.00 | 500.00 | YES |
| 4 | `core.profit_trend` | Qore | trend | MeasureEngine | implemented_unverified | `ok` | 500.00 | - | - |
| 5 | `core.gross_profit` | Qore | stat | MeasureEngine | verified | `ok` | 4,500.00 | 4,500.00 | YES |
| 6 | `core.gross_margin_pct` | Qore | gauge | MeasureEngine | verified | `ok` | 58.44 | 58.44 | YES |
| 7 | `core.net_margin_pct` | Qore | gauge | MeasureEngine | verified | `ok` | 6.49 | 6.49 | YES |
| 8 | `core.cogs` | Qore | stat | MeasureEngine | verified | `ok` | 3,200.00 | 3,200.00 | YES |
| 9 | `core.expenses_total` | Qore | stat | MeasureEngine | verified | `ok` | 4,000.00 | 4,000.00 | YES |
| 10 | `core.expense_ratio` | Qore | gauge | MeasureEngine | verified | `ok` | 51.95 | 51.95 | YES |
| 11 | `core.receivables` | Qore | stat | MeasureEngine | verified | `ok` | 2,500.00 | 2,500.00 | YES |
| 12 | `core.receivables_aging` | Qore | breakdown | MeasureEngine | verified | `ok` | 2,500.00 | 2,500.00 | YES |
| 13 | `core.payables` | Qore | stat | MeasureEngine | verified | `ok` | 3,000.00 | 3,000.00 | YES |
| 14 | `core.payables_aging` | Qore | breakdown | MeasureEngine | verified | `ok` | 3,000.00 | 3,000.00 | YES |
| 15 | `core.total_liquidity` | Qore | stat | MeasureEngine | verified | `ok` | 196,200.00 | 196,200.00 | YES |
| 16 | `core.liquidity_trend` | Qore | trend | MeasureEngine | implemented_unverified | `ok` | 196,200.00 | - | - |
| 17 | `core.cash_flow_trend` | Qore | trend | MeasureEngine | implemented_unverified | `ok` | -5,800.00 | - | - |
| 18 | `core.net_cash_position` | Qore | stat | MeasureEngine | verified | `ok` | 192,700.00 | 192,700.00 | YES |
| 19 | `core.working_capital` | Qore | stat | MeasureEngine | verified | `ok` | 201,700.00 | 201,700.00 | YES |
| 20 | `core.revenue_vs_prev` | Qore | stat | MeasureEngine | verified | `ok` | 285.00 | 285.00 | YES |
| 21 | `core.profit_vs_prev` | Qore | stat | MeasureEngine | verified | `ok` | -700.00 | -700.00 | YES |
| 22 | `core.transaction_count` | Qore | stat | MeasureEngine | implemented_unverified | `ok` | 7.00 | - | - |
| 23 | `core.avg_transaction_value` | Qore | stat | MeasureEngine | verified | `ok` | 3,850.00 | 3,850.00 | YES |
| 24 | `core.busiest_day` | Qore | stat | MeasureEngine | implemented_unverified | `ok` | 5,000.00 | - | - |
| 25 | `core.peak_hour` | Qore | stat | MeasureEngine | implemented_unverified | `ok` | 10.00 | - | - |
| 26 | `core.balance_sheet_ok` | Qore | status | MeasureEngine | verified | `ok` | 1.00 | 1.00 | YES |
| 27 | `core.journal_entries_count` | Qore | stat | MeasureEngine | verified | `ok` | 7.00 | 7.00 | YES |
| 28 | `core.audit_trail_count` | Qore | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 29 | `core.reversal_count` | Qore | stat | MeasureEngine | verified | `ok` | 1.00 | 1.00 | YES |
| 30 | `core.document_sequence_ok` | Qore | status | MeasureEngine | implemented_unverified | `ok` | 1.00 | - | - |
| 31 | `core.user_activity` | Qore | stat | MeasureEngine | implemented_unverified | `ok` | 1.00 | - | - |
| 32 | `core.plan_usage` | Qore | breakdown | MeasureEngine | implemented_unverified | `ok` | 1,400.00 | - | - |
| 33 | `products.count` | products | stat | MeasureEngine | verified | `ok` | 2.00 | 2.00 | YES |
| 34 | `products.active_count` | products | stat | MeasureEngine | implemented_unverified | `ok` | 2.00 | - | - |
| 35 | `products.by_category` | products | breakdown | MeasureEngine | implemented_unverified | `ok` | 2.00 | - | - |
| 36 | `products.catalogue_value` | products | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 37 | `products.avg_margin` | products | gauge | MeasureEngine | implemented_unverified | `empty` | null | - | - |
| 38 | `products.top_margin` | products | list | MeasureEngine | implemented_unverified | `ok` | 60.00 | - | - |
| 39 | `products.lowest_margin` | products | list | MeasureEngine | implemented_unverified | `ok` | 60.00 | - | - |
| 40 | `products.never_sold` | products | list | MeasureEngine | implemented_unverified | `ok` | 250.00 | - | - |
| 41 | `products.missing_cost` | products | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 42 | `products.new_this_period` | products | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 43 | `services.count` | services | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 44 | `services.revenue` | services | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 45 | `services.revenue_trend` | services | trend | MeasureEngine | implemented_unverified | `empty` | 0.00 | - | - |
| 46 | `services.share_of_revenue` | services | gauge | MeasureEngine | implemented_unverified | `empty` | null | - | - |
| 47 | `services.top_services` | services | list | MeasureEngine | implemented_unverified | `empty` | 0.00 | - | - |
| 48 | `services.avg_ticket` | services | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 49 | `services.jobs_count` | services | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 50 | `customers.count` | customers | stat | MeasureEngine | implemented_unverified | `ok` | 1.00 | - | - |
| 51 | `customers.new` | customers | stat | MeasureEngine | verified | `ok` | 1.00 | 1.00 | YES |
| 52 | `customers.new_trend` | customers | trend | MeasureEngine | implemented_unverified | `empty` | 0.00 | - | - |
| 53 | `customers.active` | customers | stat | MeasureEngine | verified | `ok` | 1.00 | 1.00 | YES |
| 54 | `customers.dormant` | customers | list | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 55 | `customers.repeat_rate` | customers | gauge | MeasureEngine | implemented_unverified | `empty` | null | - | - |
| 56 | `customers.top_customers` | customers | list | MeasureEngine | implemented_unverified | `ok` | 5,000.00 | - | - |
| 57 | `customers.avg_spend` | customers | stat | MeasureEngine | implemented_unverified | `ok` | 3,850.00 | - | - |
| 58 | `customers.owing` | customers | list | MeasureEngine | verified | `ok` | 2,500.00 | 2,500.00 | YES |
| 59 | `customers.by_area` | customers | breakdown | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 60 | `suppliers.count` | suppliers | stat | MeasureEngine | verified | `ok` | 2.00 | 2.00 | YES |
| 61 | `suppliers.active` | suppliers | stat | MeasureEngine | implemented_unverified | `ok` | 1.00 | - | - |
| 62 | `suppliers.top_suppliers` | suppliers | list | MeasureEngine | implemented_unverified | `ok` | 2,500.00 | - | - |
| 63 | `suppliers.spend_total` | suppliers | stat | MeasureEngine | implemented_unverified | `ok` | 2,500.00 | - | - |
| 64 | `suppliers.spend_trend` | suppliers | trend | MeasureEngine | implemented_unverified | `ok` | 2,500.00 | - | - |
| 65 | `suppliers.owed_list` | suppliers | list | MeasureEngine | verified | `ok` | 3,000.00 | 3,000.00 | YES |
| 66 | `suppliers.concentration` | suppliers | gauge | MeasureEngine | implemented_unverified | `empty` | null | - | - |
| 67 | `suppliers.new` | suppliers | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 68 | `pos.revenue` | pos | stat | MeasureEngine | verified | `ok` | 2,700.00 | 2,700.00 | YES |
| 69 | `pos.revenue_trend` | pos | trend | MeasureEngine | implemented_unverified | `ok` | 2,700.00 | - | - |
| 70 | `pos.sale_count` | pos | stat | MeasureEngine | verified | `ok` | 1.00 | 1.00 | YES |
| 71 | `pos.avg_ticket` | pos | stat | MeasureEngine | verified | `ok` | 2,700.00 | 2,700.00 | YES |
| 72 | `pos.max_sale` | pos | stat | MeasureEngine | implemented_unverified | `ok` | 2,700.00 | - | - |
| 73 | `pos.items_per_sale` | pos | stat | MeasureEngine | implemented_unverified | `ok` | 3.00 | - | - |
| 74 | `pos.payment_breakdown` | pos | breakdown | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 75 | `pos.hourly_heatmap` | pos | heatmap | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 76 | `pos.weekday_split` | pos | breakdown | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 77 | `pos.discount_total` | pos | stat | MeasureEngine | verified | `ok` | 300.00 | 300.00 | YES |
| 78 | `pos.live_feed` | pos | list | MeasureEngine | implemented_unverified | `ok` | 4,700.00 | - | - |
| 79 | `invoicing.count` | invoicing | stat | MeasureEngine | verified | `ok` | 1.00 | 1.00 | YES |
| 80 | `invoicing.value` | invoicing | stat | MeasureEngine | verified | `ok` | 5,000.00 | 5,000.00 | YES |
| 81 | `invoicing.value_trend` | invoicing | trend | MeasureEngine | implemented_unverified | `ok` | 5,000.00 | - | - |
| 82 | `invoicing.unpaid_value` | invoicing | stat | MeasureEngine | implemented_unverified | `ok` | 2,500.00 | - | - |
| 83 | `invoicing.overdue_count` | invoicing | stat | MeasureEngine | implemented_unverified | `ok` | 1.00 | - | - |
| 84 | `invoicing.overdue_value` | invoicing | stat | MeasureEngine | implemented_unverified | `ok` | 2,500.00 | - | - |
| 85 | `invoicing.avg_invoice` | invoicing | stat | MeasureEngine | implemented_unverified | `ok` | 5,000.00 | - | - |
| 86 | `invoicing.avg_days_to_pay` | invoicing | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 87 | `invoicing.largest_open` | invoicing | list | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 88 | `invoicing.draft_count` | invoicing | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 89 | `quotations.count` | quotations | stat | MeasureEngine | implemented_unverified | `locked` | - | - | - |
| 90 | `quotations.open_value` | quotations | stat | MeasureEngine | implemented_unverified | `locked` | - | - | - |
| 91 | `quotations.win_rate` | quotations | gauge | MeasureEngine | implemented_unverified | `locked` | - | - | - |
| 92 | `quotations.win_rate_trend` | quotations | trend | MeasureEngine | implemented_unverified | `locked` | - | - | - |
| 93 | `quotations.avg_quote` | quotations | stat | MeasureEngine | implemented_unverified | `locked` | - | - | - |
| 94 | `quotations.expiring` | quotations | list | MeasureEngine | implemented_unverified | `locked` | - | - | - |
| 95 | `sales_orders.open_count` | sales_orders | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 96 | `sales_orders.open_value` | sales_orders | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 97 | `sales_orders.count` | sales_orders | stat | MeasureEngine | implemented_unverified | `locked` | - | - | - |
| 98 | `sales_orders.value_trend` | sales_orders | trend | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 99 | `sales_orders.fulfil_rate` | sales_orders | gauge | MeasureEngine | implemented_unverified | `empty` | null | - | - |
| 100 | `sales_orders.overdue` | sales_orders | list | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 101 | `sales_orders.by_customer` | sales_orders | breakdown | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 102 | `sales_returns.count` | sales_returns | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 103 | `sales_returns.value` | sales_returns | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 104 | `sales_returns.rate` | sales_returns | gauge | MeasureEngine | implemented_unverified | `empty` | null | - | - |
| 105 | `sales_returns.trend` | sales_returns | trend | MeasureEngine | implemented_unverified | `empty` | 0.00 | - | - |
| 106 | `sales_returns.top_returned` | sales_returns | list | MeasureEngine | implemented_unverified | `empty` | 0.00 | - | - |
| 107 | `sales_returns.by_reason` | sales_returns | breakdown | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 108 | `recurring.active_count` | recurring_invoices | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 109 | `recurring.monthly_value` | recurring_invoices | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 110 | `recurring.trend` | recurring_invoices | trend | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 111 | `recurring.due_next_7` | recurring_invoices | list | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 112 | `recurring.share_of_revenue` | recurring_invoices | gauge | MeasureEngine | implemented_unverified | `empty` | null | - | - |
| 113 | `recurring.churned` | recurring_invoices | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 114 | `proposals.count` | b2b_proposals | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 115 | `proposals.pipeline_value` | b2b_proposals | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 116 | `proposals.win_rate` | b2b_proposals | gauge | MeasureEngine | implemented_unverified | `empty` | null | - | - |
| 117 | `proposals.avg_value` | b2b_proposals | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 118 | `proposals.stale` | b2b_proposals | list | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 119 | `proposals.avg_cycle_days` | b2b_proposals | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 120 | `pricing.tier_count` | pricing_tiers | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 121 | `pricing.revenue_by_tier` | pricing_tiers | breakdown | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 122 | `pricing.customers_by_tier` | pricing_tiers | breakdown | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 123 | `pricing.avg_realised_price` | pricing_tiers | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 124 | `pricing.discount_vs_list` | pricing_tiers | gauge | MeasureEngine | implemented_unverified | `empty` | null | - | - |
| 125 | `park.open_count` | park_recall | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 126 | `park.open_value` | park_recall | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 127 | `park.recalled_count` | park_recall | stat | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 128 | `park.abandoned_count` | park_recall | stat | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 129 | `park.oldest` | park_recall | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 130 | `tables.occupied` | table_service | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 131 | `tables.occupancy_rate` | table_service | gauge | MeasureEngine | implemented_unverified | `empty` | null | - | - |
| 132 | `tables.kitchen_pending` | table_service | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 133 | `tables.avg_turn_minutes` | table_service | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 134 | `tables.covers` | table_service | stat | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 135 | `tables.avg_cover_value` | table_service | stat | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 136 | `tables.revenue_per_table` | table_service | breakdown | MeasureEngine | implemented_unverified | `empty` | 0.00 | - | - |
| 137 | `tables.peak_occupancy` | table_service | heatmap | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 138 | `presales.count` | pre_sales | stat | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 139 | `presales.value` | pre_sales | stat | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 140 | `presales.advance_collected` | pre_sales | stat | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 141 | `presales.pending_delivery` | pre_sales | list | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 142 | `presales.overdue` | pre_sales | stat | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 143 | `inventory.stock_value` | inventory | stat | MeasureEngine | verified | `ok` | 6,500.00 | 6,500.00 | YES |
| 144 | `inventory.stock_value_trend` | inventory | trend | MeasureEngine | implemented_unverified | `ok` | 6,500.00 | - | - |
| 145 | `inventory.product_count` | inventory | stat | MeasureEngine | implemented_unverified | `ok` | 2.00 | - | - |
| 146 | `inventory.units_on_hand` | inventory | stat | MeasureEngine | verified | `ok` | 20.00 | 20.00 | YES |
| 147 | `inventory.low_stock_count` | inventory | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 148 | `inventory.low_stock_list` | inventory | list | MeasureEngine | implemented_unverified | `empty` | 0.00 | - | - |
| 149 | `inventory.out_of_stock_count` | inventory | stat | MeasureEngine | implemented_unverified | `ok` | 2.00 | - | - |
| 150 | `inventory.dead_stock_value` | inventory | stat | MeasureEngine | implemented_unverified | `ok` | 2,500.00 | - | - |
| 151 | `inventory.turnover_ratio` | inventory | gauge | MeasureEngine | implemented_unverified | `empty` | null | - | - |
| 152 | `inventory.days_of_cover` | inventory | stat | MeasureEngine | implemented_unverified | `ok` | 63.00 | - | - |
| 153 | `inventory.value_by_category` | inventory | breakdown | MeasureEngine | implemented_unverified | `ok` | 6,500.00 | - | - |
| 154 | `inventory.top_by_value` | inventory | list | MeasureEngine | implemented_unverified | `ok` | 6,500.00 | - | - |
| 155 | `locations.count` | multi_location | stat | MeasureEngine | verified | `ok` | 1.00 | 1.00 | YES |
| 156 | `locations.revenue_by_location` | multi_location | breakdown | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 157 | `locations.profit_by_location` | multi_location | breakdown | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 158 | `locations.stock_by_location` | multi_location | breakdown | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 159 | `locations.revenue_trend_by_location` | multi_location | trend | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 160 | `locations.stock_imbalance` | multi_location | list | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 161 | `transfers.pending_count` | stock_transfers | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 162 | `transfers.pending_value` | stock_transfers | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 163 | `transfers.count` | stock_transfers | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 164 | `transfers.avg_transit_days` | stock_transfers | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 165 | `transfers.discrepancy_count` | stock_transfers | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 166 | `stocktakes.pending_count` | stock_takes | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 167 | `stocktakes.variance_value` | stock_takes | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 168 | `stocktakes.variance_pct` | stock_takes | gauge | MeasureEngine | implemented_unverified | `empty` | null | - | - |
| 169 | `stocktakes.last_count_days` | stock_takes | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 170 | `stocktakes.top_variances` | stock_takes | list | MeasureEngine | implemented_unverified | `empty` | 0.00 | - | - |
| 171 | `batches.count` | batches_expiry | stat | MeasureEngine | implemented_unverified | `ok` | 2.00 | - | - |
| 172 | `batches.qty` | batches_expiry | stat | MeasureEngine | implemented_unverified | `ok` | 20.00 | - | - |
| 173 | `batches.expiring_30` | batches_expiry | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 174 | `batches.expiring_value` | batches_expiry | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 175 | `batches.expired_value` | batches_expiry | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 176 | `batches.expiry_list` | batches_expiry | list | MeasureEngine | implemented_unverified | `empty` | 0.00 | - | - |
| 177 | `batches.write_off_trend` | batches_expiry | trend | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 178 | `serials.count` | serials | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 179 | `serials.in_stock` | serials | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 180 | `serials.under_warranty` | serials | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 181 | `serials.warranty_expiring` | serials | list | MeasureEngine | implemented_unverified | `empty` | 0.00 | - | - |
| 182 | `serials.returned` | serials | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 183 | `variants.count` | variants | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 184 | `variants.top_variants` | variants | list | MeasureEngine | implemented_unverified | `empty` | 0.00 | - | - |
| 185 | `variants.slow_variants` | variants | list | MeasureEngine | implemented_unverified | `empty` | 0.00 | - | - |
| 186 | `variants.out_of_stock` | variants | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 187 | `variants.size_colour_mix` | variants | breakdown | MeasureEngine | implemented_unverified | `empty` | 0.00 | - | - |
| 188 | `barcodes.coverage_pct` | barcodes_labels | gauge | MeasureEngine | implemented_unverified | `empty` | null | - | - |
| 189 | `barcodes.missing_count` | barcodes_labels | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 190 | `barcodes.labels_printed` | barcodes_labels | stat | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 191 | `barcodes.scan_share` | barcodes_labels | gauge | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 192 | `barcodes.duplicate_count` | barcodes_labels | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 193 | `uom.count` | units_of_measure | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 194 | `uom.conversion_count` | units_of_measure | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 195 | `uom.sales_by_uom` | units_of_measure | breakdown | MeasureEngine | implemented_unverified | `empty` | 0.00 | - | - |
| 196 | `uom.missing_conversion` | units_of_measure | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 197 | `uom.bulk_vs_retail` | units_of_measure | breakdown | MeasureEngine | implemented_unverified | `empty` | 0.00 | - | - |
| 198 | `purchases.spend` | purchases | stat | MeasureEngine | verified | `ok` | 2,500.00 | 2,500.00 | YES |
| 199 | `purchases.spend_trend` | purchases | trend | MeasureEngine | implemented_unverified | `ok` | 2,500.00 | - | - |
| 200 | `purchases.count` | purchases | stat | MeasureEngine | verified | `ok` | 1.00 | 1.00 | YES |
| 201 | `purchases.unpaid_value` | purchases | stat | MeasureEngine | verified | `ok` | 3,000.00 | 3,000.00 | YES |
| 202 | `purchases.overdue_value` | purchases | stat | MeasureEngine | verified | `ok` | 3,000.00 | 3,000.00 | YES |
| 203 | `purchases.paid_to_suppliers` | purchases | stat | MeasureEngine | verified | `ok` | 5,000.00 | 5,000.00 | YES |
| 204 | `purchases.by_supplier` | purchases | breakdown | MeasureEngine | implemented_unverified | `ok` | 2,500.00 | - | - |
| 205 | `purchases.by_category` | purchases | breakdown | MeasureEngine | implemented_unverified | `ok` | 2,500.00 | - | - |
| 206 | `purchases.price_increases` | purchases | list | MeasureEngine | implemented_unverified | `empty` | 0.00 | - | - |
| 207 | `po.open_count` | purchase_orders | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 208 | `po.open_value` | purchase_orders | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 209 | `po.pending_receipt_value` | purchase_orders | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 210 | `po.overdue_count` | purchase_orders | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 211 | `po.avg_lead_days` | purchase_orders | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 212 | `po.fill_rate` | purchase_orders | gauge | MeasureEngine | implemented_unverified | `empty` | null | - | - |
| 213 | `purchase_returns.count` | purchase_returns | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 214 | `purchase_returns.value` | purchase_returns | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 215 | `purchase_returns.credit_due` | purchase_returns | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 216 | `purchase_returns.by_supplier` | purchase_returns | breakdown | MeasureEngine | implemented_unverified | `empty` | 0.00 | - | - |
| 217 | `purchase_returns.rate` | purchase_returns | gauge | MeasureEngine | implemented_unverified | `empty` | null | - | - |
| 218 | `landed.total` | landed_cost | stat | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 219 | `landed.pct_of_goods` | landed_cost | gauge | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 220 | `landed.by_type` | landed_cost | breakdown | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 221 | `landed.true_cost_gap` | landed_cost | stat | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 222 | `landed.trend` | landed_cost | trend | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 223 | `cookbook.recipe_count` | cookbook | stat | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 224 | `cookbook.recipe_cost_pct` | cookbook | gauge | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 225 | `cookbook.best_margin` | cookbook | list | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 226 | `cookbook.worst_margin` | cookbook | list | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 227 | `cookbook.ingredient_cost_trend` | cookbook | trend | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 228 | `cookbook.wastage_value` | cookbook | stat | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 229 | `production.run_count` | production_runs | stat | MeasureEngine | implemented_unverified | `locked` | - | - | - |
| 230 | `production.total_cost` | production_runs | stat | MeasureEngine | implemented_unverified | `locked` | - | - | - |
| 231 | `production.output_qty` | production_runs | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 232 | `production.cost_per_unit` | production_runs | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 233 | `production.yield_pct` | production_runs | gauge | MeasureEngine | implemented_unverified | `empty` | null | - | - |
| 234 | `production.wastage_value` | production_runs | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 235 | `production.in_progress` | production_runs | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 236 | `production.output_trend` | production_runs | trend | MeasureEngine | implemented_unverified | `empty` | 0.00 | - | - |
| 237 | `composite.count` | composite_items | stat | MeasureEngine | implemented_unverified | `locked` | - | - | - |
| 238 | `composite.revenue` | composite_items | stat | MeasureEngine | implemented_unverified | `locked` | - | - | - |
| 239 | `composite.margin` | composite_items | gauge | MeasureEngine | implemented_unverified | `locked` | - | - | - |
| 240 | `composite.top_bundles` | composite_items | list | MeasureEngine | implemented_unverified | `locked` | - | - | - |
| 241 | `composite.component_shortage` | composite_items | list | MeasureEngine | implemented_unverified | `locked` | - | - | - |
| 242 | `khata.receivable_total` | khata_credit | stat | MeasureEngine | verified | `ok` | 2,500.00 | 2,500.00 | YES |
| 243 | `khata.payable_total` | khata_credit | stat | MeasureEngine | verified | `ok` | 3,000.00 | 3,000.00 | YES |
| 244 | `khata.net_position` | khata_credit | stat | MeasureEngine | verified | `ok` | -500.00 | -500.00 | YES |
| 245 | `khata.biggest_debtors` | khata_credit | list | MeasureEngine | implemented_unverified | `ok` | 2,500.00 | - | - |
| 246 | `khata.overdue_total` | khata_credit | stat | MeasureEngine | implemented_unverified | `ok` | 5,500.00 | - | - |
| 247 | `khata.aging` | khata_credit | breakdown | MeasureEngine | implemented_unverified | `ok` | 2,500.00 | - | - |
| 248 | `khata.collected` | khata_credit | stat | MeasureEngine | verified | `ok` | 3,000.00 | 3,000.00 | YES |
| 249 | `khata.collection_trend` | khata_credit | trend | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 250 | `khata.over_limit` | khata_credit | list | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 251 | `payments.received` | payments | stat | MeasureEngine | verified | `ok` | 5,700.00 | 5,700.00 | YES |
| 252 | `payments.received_trend` | payments | trend | MeasureEngine | implemented_unverified | `ok` | 5,700.00 | - | - |
| 253 | `payments.paid` | payments | stat | MeasureEngine | verified | `ok` | 11,500.00 | 11,500.00 | YES |
| 254 | `payments.net_flow` | payments | stat | MeasureEngine | verified | `ok` | -5,800.00 | -5,800.00 | YES |
| 255 | `payments.by_method` | payments | breakdown | MeasureEngine | implemented_unverified | `ok` | 3,700.00 | - | - |
| 256 | `payments.cash_vs_digital` | payments | gauge | MeasureEngine | implemented_unverified | `ok` | 100.00 | - | - |
| 257 | `payments.unallocated` | payments | list | MeasureEngine | implemented_unverified | `empty` | 0.00 | - | - |
| 258 | `payments.bounced` | payments | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 259 | `expenses.count` | expenses | stat | MeasureEngine | verified | `ok` | 1.00 | 1.00 | YES |
| 260 | `expenses.trend` | expenses | trend | MeasureEngine | implemented_unverified | `ok` | 4,000.00 | - | - |
| 261 | `expenses.by_category` | expenses | breakdown | MeasureEngine | verified | `ok` | 4,000.00 | 4,000.00 | YES |
| 262 | `expenses.top_categories` | expenses | list | MeasureEngine | implemented_unverified | `ok` | 4,000.00 | - | - |
| 263 | `expenses.unpaid` | expenses | stat | MeasureEngine | verified | `ok` | 0.00 | 0.00 | YES |
| 264 | `expenses.largest` | expenses | list | MeasureEngine | implemented_unverified | `ok` | 4,000.00 | - | - |
| 265 | `expenses.recurring_total` | expenses | stat | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 266 | `expenses.per_day` | expenses | stat | MeasureEngine | implemented_unverified | `ok` | 129.03 | - | - |
| 267 | `expenses.vs_prev` | expenses | stat | MeasureEngine | implemented_unverified | `ok` | 4,000.00 | - | - |
| 268 | `register.open_count` | cash_register | stat | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 269 | `register.cash_in_drawer` | cash_register | stat | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 270 | `register.cash_sales` | cash_register | stat | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 271 | `register.expected_vs_actual` | cash_register | stat | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 272 | `register.variance_total` | cash_register | stat | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 273 | `register.by_staff` | cash_register | breakdown | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 274 | `register.shift_count` | cash_register | stat | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 275 | `bank.account_count` | bank_accounts | stat | MeasureEngine | implemented_unverified | `ok` | 1.00 | - | - |
| 276 | `bank.balances_total` | bank_accounts | stat | MeasureEngine | verified | `ok` | 48,000.00 | 48,000.00 | YES |
| 277 | `bank.balance_trend` | bank_accounts | trend | MeasureEngine | implemented_unverified | `ok` | 48,000.00 | - | - |
| 278 | `bank.balance_by_account` | bank_accounts | breakdown | MeasureEngine | implemented_unverified | `ok` | 48,000.00 | - | - |
| 279 | `bank.top_account` | bank_accounts | stat | MeasureEngine | implemented_unverified | `ok` | 48,000.00 | - | - |
| 280 | `bank.money_in` | bank_accounts | stat | MeasureEngine | verified | `ok` | 53,000.00 | 53,000.00 | YES |
| 281 | `bank.money_out` | bank_accounts | stat | MeasureEngine | verified | `ok` | 5,000.00 | 5,000.00 | YES |
| 282 | `bank.cash_vs_bank` | bank_accounts | breakdown | MeasureEngine | implemented_unverified | `ok` | 196,200.00 | - | - |
| 283 | `bank.idle_accounts` | bank_accounts | list | MeasureEngine | implemented_unverified | `empty` | 0.00 | - | - |
| 284 | `recon.unreconciled_count` | bank_reconciliation | stat | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 285 | `recon.unreconciled_value` | bank_reconciliation | stat | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 286 | `recon.matched_pct` | bank_reconciliation | gauge | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 287 | `recon.last_recon_days` | bank_reconciliation | stat | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 288 | `recon.difference` | bank_reconciliation | stat | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 289 | `accounting.trial_balance_ok` | accounting_workspace | status | MeasureEngine | verified | `ok` | 1.00 | 1.00 | YES |
| 290 | `accounting.assets_total` | accounting_workspace | stat | MeasureEngine | verified | `ok` | 205,200.00 | 205,200.00 | YES |
| 291 | `accounting.liabilities_total` | accounting_workspace | stat | MeasureEngine | verified | `ok` | 3,500.00 | 3,500.00 | YES |
| 292 | `accounting.equity_total` | accounting_workspace | stat | MeasureEngine | verified | `ok` | 201,700.00 | 201,700.00 | YES |
| 293 | `accounting.equity_trend` | accounting_workspace | trend | MeasureEngine | implemented_unverified | `ok` | 201,700.00 | - | - |
| 294 | `accounting.pnl_summary` | accounting_workspace | breakdown | MeasureEngine | implemented_unverified | `ok` | 19,900.00 | - | - |
| 295 | `accounting.balance_sheet` | accounting_workspace | breakdown | MeasureEngine | implemented_unverified | `ok` | 410,400.00 | - | - |
| 296 | `accounting.unposted_count` | accounting_workspace | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 297 | `accounting.drawings` | accounting_workspace | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 298 | `tax.collected` | tax_compliance | stat | MeasureEngine | verified | `ok` | 500.00 | 500.00 | YES |
| 299 | `tax.paid` | tax_compliance | stat | MeasureEngine | verified | `ok` | 0.00 | 0.00 | YES |
| 300 | `tax.net_liability` | tax_compliance | stat | MeasureEngine | verified | `ok` | 500.00 | 500.00 | YES |
| 301 | `tax.liability_trend` | tax_compliance | trend | MeasureEngine | implemented_unverified | `ok` | 500.00 | - | - |
| 302 | `tax.by_rate` | tax_compliance | breakdown | MeasureEngine | verified | `ok` | 500.00 | 500.00 | YES |
| 303 | `tax.taxable_vs_exempt` | tax_compliance | breakdown | MeasureEngine | implemented_unverified | `ok` | 7,700.00 | - | - |
| 304 | `tax.filing_due` | tax_compliance | stat | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 305 | `tax.invoices_missing_tax` | tax_compliance | list | MeasureEngine | implemented_unverified | `ok` | 2,700.00 | - | - |
| 306 | `assets.count` | fixed_assets | stat | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 307 | `assets.gross_value` | fixed_assets | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 308 | `assets.net_book_value` | fixed_assets | stat | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 309 | `assets.depreciation_period` | fixed_assets | stat | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 310 | `assets.by_category` | fixed_assets | breakdown | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 311 | `assets.warranty_amc_due` | fixed_assets | list | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 312 | `loans.count` | loans | stat | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 313 | `loans.outstanding_total` | loans | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 314 | `loans.outstanding_trend` | loans | trend | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 315 | `loans.emi_due` | loans | stat | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 316 | `loans.interest_paid` | loans | stat | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 317 | `loans.by_lender` | loans | breakdown | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 318 | `reports.pnl_shortcut` | reports | breakdown | MeasureEngine | implemented_unverified | `ok` | 19,900.00 | - | - |
| 319 | `reports.sales_shortcut` | reports | breakdown | MeasureEngine | implemented_unverified | `ok` | 15,900.00 | - | - |
| 320 | `reports.stock_shortcut` | reports | breakdown | MeasureEngine | implemented_unverified | `ok` | 6,500.00 | - | - |
| 321 | `reports.saved_count` | reports | stat | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 322 | `reports.most_used` | reports | list | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 323 | `reports.scheduled_count` | reports | stat | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 324 | `ai.top_insight` | ai_insights | status | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 325 | `ai.alerts_open` | ai_insights | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 326 | `ai.anomalies` | ai_insights | list | MeasureEngine | implemented_unverified | `empty` | 0.00 | - | - |
| 327 | `ai.forecast_revenue` | ai_insights | trend | MeasureEngine | implemented_unverified | `ok` | 3,233.33 | - | - |
| 328 | `ai.forecast_cash` | ai_insights | trend | MeasureEngine | implemented_unverified | `ok` | 198,463.31 | - | - |
| 329 | `ai.reorder_suggestions` | ai_insights | list | MeasureEngine | implemented_unverified | `empty` | 0.00 | - | - |
| 330 | `loyalty.member_count` | loyalty_gift | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 331 | `loyalty.new_members` | loyalty_gift | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 332 | `loyalty.member_revenue_share` | loyalty_gift | gauge | MeasureEngine | implemented_unverified | `empty` | null | - | - |
| 333 | `loyalty.member_avg_spend` | loyalty_gift | breakdown | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 334 | `loyalty.liability` | loyalty_gift | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 335 | `loyalty.gift_card_balance` | loyalty_gift | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 336 | `marketplace.channel_count` | marketplace_sync | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 337 | `marketplace.revenue_by_channel` | marketplace_sync | breakdown | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 338 | `marketplace.online_vs_offline` | marketplace_sync | breakdown | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 339 | `marketplace.sync_errors` | marketplace_sync | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 340 | `marketplace.stock_mismatch` | marketplace_sync | list | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 341 | `marketplace.channel_margin` | marketplace_sync | breakdown | Legacy Source | unimplemented | `unavailable` | - | - | - |
| 342 | `staff.member_count` | staff_attendance | stat | MeasureEngine | verified | `ok` | 1.00 | 1.00 | YES |
| 343 | `staff.on_shift_count` | staff_attendance | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 344 | `staff.present_today` | staff_attendance | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 345 | `staff.absent_today` | staff_attendance | list | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 346 | `staff.hours_worked` | staff_attendance | stat | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 347 | `staff.attendance_rate` | staff_attendance | gauge | MeasureEngine | implemented_unverified | `empty` | null | - | - |
| 348 | `staff.sales_by_staff` | staff_attendance | breakdown | MeasureEngine | implemented_unverified | `ok` | 0.00 | - | - |
| 349 | `staff.revenue_per_staff` | staff_attendance | stat | MeasureEngine | implemented_unverified | `ok` | 8,700.00 | - | - |
