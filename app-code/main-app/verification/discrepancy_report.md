# VenQore Ledger Truth Audit Report

> **Generated:** 2026-09-10 05:04:15 PKT  
> **Tenant:** Golden Audit Store (`golden-audit`)  
> **Audit Date:** 2026-09-10  
> **Audit Period Seeded:** 2025-01-01 → 2026-09-10  

## Summary

| Status | Count |
|--------|-------|
| 🔢 Total Routes Scanned | **277** |
| ✅ Passed | 257 |
| ⚠️ All Zeros (Suspicious) | 6 |
| ❌ Mismatched vs Ledger | 0 |
| 🔴 HTTP Errors / Exceptions | 14 |
| ⏭️ Skipped | 0 |

## Ledger Control Values (Single Source of Truth)

| Key | Value (PKR) |
|-----|------------|
| `revenue_month` | 449,876.14 |
| `gross_profit_month` | 79,988.77 |
| `net_profit_month` | 7,970.86 |
| `operating_expenses_month` | 72,017.91 |
| `cogs_month` | 369,887.37 |
| `revenue_ytd` | 449,876.14 |
| `gross_profit_ytd` | 79,988.77 |
| `net_profit_ytd` | 7,970.86 |
| `receivables` | 6,971,965.12 |
| `payables` | 11,858,827.30 |
| `sales_tax_collected` | 76,478.98 |
| `input_tax_recoverable` | 9,508.95 |
| `tax_output_ytd` | 76,478.98 |
| `tax_input_ytd` | 9,508.95 |
| `purchases_month` | 65,443.93 |
| `purchases_ytd` | 65,443.93 |
| `cash_inflow_ytd` | 4,158,326.57 |
| `cash_outflow_ytd` | 87,201.80 |
| `expenses_ytd` | 72,017.91 |
| `trial_balance_total_debit` | 4,900,567.55 |
| `trial_balance_total_credit` | 4,900,567.55 |
| `assets_total` | 4,144,709.88 |
| `liabilities_total` | 126,739.02 |
| `inventory_value` | 2,549,718.61 |

## ⚠️ WARNING: Pages Showing All-Zero Financial Data

> These pages loaded OK but every financial prop is **0**. This indicates the data source may be bypassing the Ledger.

| # | Route | URI |
|---|-------|-----|
| 1 | `store.billing.payment-history` | `s/{store_slug}/billing/payment-history` |
| 2 | `store.smart-capture.aliases` | `s/{store_slug}/smart-capture/aliases` |
| 3 | `store.tables.state` | `s/{store_slug}/tables/state` |
| 4 | `store.growth-engine.dashboard` | `s/{store_slug}/growth-engine/dashboard` |
| 5 | `store.growth-engine.scorecard` | `s/{store_slug}/growth-engine/scorecard` |
| 6 | `store.v3.opening-balances.status` | `s/{store_slug}/v3/opening-balances/status` |

### Zero-Page Financial Props Detail

**`store.billing.payment-history`**
```
  invoice_count: 0
```

**`store.smart-capture.aliases`**
```
  stats.total: 0
```

**`store.tables.state`**
```
  positions.sum_order_total: 0
  positions.total_order_total: 0
  positions.sum_paid_total: 0
  positions.total_paid_total: 0
  positions.sum_unpaid_total: 0
  positions.total_unpaid_total: 0
```

**`store.growth-engine.dashboard`**
```
  stats.total_signals: 0
  stats.potential_revenue: 0
  stats.realised_value: 0
  stats.by_brain.sum_value: 0
  stats.by_brain.total_value: 0
```

**`store.growth-engine.scorecard`**
```
  total_generated: 0
  total_acted: 0
  total_graded: 0
  realised_value: 0
```

**`store.v3.opening-balances.status`**
```
  balance_7000: 0
```

## 🔴 HTTP Errors

| Route | Code | Snippet |
|-------|------|--------|
| `store.admin.chatbot.assist-suggestion` | 404 | {"message":"No query results for model [App\\Models\\ChatSession].","exception":"Symfony\\Component\\HttpKernel\\Excepti |
| `store.sales.recall` | 404 | {"success":false,"message":"Parked sale not found."} |
| `store.growth-engine.show` | 404 | {"message":"No query results for model [App\\Models\\AiRecommendation] RET-202501-1001","exception":"Symfony\\Component\ |
| `store.vensynq.health` | 404 | {"message":"","exception":"Symfony\\Component\\HttpKernel\\Exception\\NotFoundHttpException","file":"E:\\AMD POS\\AMD PO |
| `store.vensynq.money-pipeline` | 404 | {"message":"","exception":"Symfony\\Component\\HttpKernel\\Exception\\NotFoundHttpException","file":"E:\\AMD POS\\AMD PO |
| `store.vensynq.payouts` | 404 | {"message":"","exception":"Symfony\\Component\\HttpKernel\\Exception\\NotFoundHttpException","file":"E:\\AMD POS\\AMD PO |
| `store.woo.plugin.download` | 404 | {"message":"No query results for model [App\\Models\\WooConnection] 1","exception":"Symfony\\Component\\HttpKernel\\Exce |
| `store.woo.connections.setup` | 404 | {"message":"No query results for model [App\\Models\\WooConnection] 1","exception":"Symfony\\Component\\HttpKernel\\Exce |
| `store.woo.connections.status-json` | 404 | {"message":"No query results for model [App\\Models\\WooConnection] 1","exception":"Symfony\\Component\\HttpKernel\\Exce |
| `store.woo.connections.sync` | 404 | {"message":"No query results for model [App\\Models\\WooConnection] 1","exception":"Symfony\\Component\\HttpKernel\\Exce |
| `store.woo.connections.logs` | 404 | {"message":"No query results for model [App\\Models\\WooConnection] 1","exception":"Symfony\\Component\\HttpKernel\\Exce |

## 💥 Exceptions / Parameter Errors

| Route | Type | Error |
|-------|------|-------|
| `store.smart-capture.job-status` | PARAM_ERROR | Cannot resolve URL: Missing required parameter for [Route: store.smart-capture.job-status] [URI: s/{store_slug}/smart-capture/status/{job_id}] [Missing parameter: job_id]. |
| `store.builder.data-at-stake` | PARAM_ERROR | Cannot resolve URL: Missing required parameter for [Route: store.builder.data-at-stake] [URI: s/{store_slug}/builder/data-at-stake/{module}] [Missing parameter: module]. |
| `store.service-jobs.show` | PARAM_ERROR | Cannot resolve URL: Missing required parameter for [Route: store.service-jobs.show] [URI: s/{store_slug}/service-jobs/{serviceJob}] [Missing parameter: serviceJob]. |

## Full Scan Results (277 routes)

| Route | Status | Code | Financial Props |
|-------|--------|------|----------------|
| `store.create-or-join` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `store.ai_descriptions_balance`=0.00, `plan.limits.ai_credits_monthly`=10,000.00 (+4 more) |
| `store.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `store.ai_descriptions_balance`=0.00, `plan.limits.ai_credits_monthly`=10,000.00 (+6 more) |
| `store.join` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `store.ai_descriptions_balance`=0.00, `plan.limits.ai_credits_monthly`=10,000.00 (+4 more) |
| `store.` | ↩ REDIRECT | 302 | – |
| `store.setup` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.terminal-pairing.index` | ✅ PASS | 200 | – |
| `store.pos.recent-sales` | ✅ PASS | 200 | `data.sum_subtotal`=2,209,410.30, `data.total_subtotal`=2,209,410.30, `data.sum_subtotal_gross`=0.00 (+63 more) |
| `store.pos.modifiers` | ✅ PASS | 200 | – |
| `store.staff` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.billing` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+136 more) |
| `store.billing.payment-history` | ⚠️ ALL_ZEROS | 200 | `invoice_count`=0.00 |
| `store.settings` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.smart-capture.context` | ✅ PASS | 200 | `learning.total`=0.00, `open_documents.proposal.sum_total`=5,000.00, `open_documents.proposal.total_total`=5,000.00 (+4 more) |
| `store.smart-capture.job-status` | 💥 PARAM_ERROR |  | – |
| `store.smart-capture.settings` | ✅ PASS | 200 | – |
| `store.smart-capture.aliases` | ⚠️ ALL_ZEROS | 200 | `stats.total`=0.00 |
| `store.restaurant.dashboard` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+6 more) |
| `store.restaurant.kitchen` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.restaurant.kitchen.state` | ✅ PASS | 200 | – |
| `store.trial.expired` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.notifications.plan.unread` | 📄 NON_JSON | 200 | – |
| `store.admin.home` | ↩ REDIRECT | 302 | – |
| `store.admin.dashboard` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+23 more) |
| `store.admin.settings` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.admin.users` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+8 more) |
| `store.admin.staff` | ↩ REDIRECT | 302 | – |
| `store.admin.attendance` | ↩ REDIRECT | 302 | – |
| `store.admin.logs` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.admin.data` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.admin.data.template` | ↩ REDIRECT | 302 | – |
| `store.admin.recycle-bin.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.admin.chatbot.settings` | ✅ PASS | 200 | `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00, `ai_tiers.shop.credits`=2,000.00 (+5 more) |
| `store.admin.chatbot.inbox` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.admin.chatbot.sessions` | ✅ PASS | 200 | – |
| `store.admin.chatbot.assist-suggestion` | 🔴 HTTP_ERROR | 404 | – |
| `store.admin.chatbot.canned-responses` | ✅ PASS | 200 | – |
| `store.admin.vena.tickets` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+5 more) |
| `store.inventory.search` | ✅ PASS | 200 | – |
| `store.customers.search` | ✅ PASS | 200 | – |
| `store.sales.parked` | ✅ PASS | 200 | – |
| `store.sales.recall` | 🔴 HTTP_ERROR | 404 | – |
| `store.new-dashboard` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+75 more) |
| `store.dashboard` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+75 more) |
| `store.onboarding.v2` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.builder` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.builder.data-at-stake` | 💥 PARAM_ERROR |  | – |
| `store.home` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.dashboard-v1` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+75 more) |
| `store.overview` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+22 more) |
| `store.workspace` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.next-dashboard` | ✅ PASS | 200 | `store.ai_descriptions_balance`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+11 more) |
| `store.appearance` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.pos` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.tables.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+10 more) |
| `store.tables.state` | ⚠️ ALL_ZEROS | 200 | `positions.sum_order_total`=0.00, `positions.total_order_total`=0.00, `positions.sum_paid_total`=0.00 (+3 more) |
| `store.tables.plan` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.new-pos` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `store.ai_descriptions_balance`=0.00, `plan.limits.ai_credits_monthly`=10,000.00 (+7 more) |
| `store.new-invoice` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.inventory.dashboard` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+10 more) |
| `store.inventory.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+9 more) |
| `store.inventory.reservations` | 📄 NON_JSON | 200 | – |
| `store.inventory.history` | ✅ PASS | 200 | – |
| `store.stock-operations` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.activity-log.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.suppliers.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+7 more) |
| `store.purchase-orders.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+8 more) |
| `store.purchase-orders.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+21 more) |
| `store.purchase-orders.show` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+11 more) |
| `store.purchase-orders.edit` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+14 more) |
| `store.proposals.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+25 more) |
| `store.proposals.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+20 more) |
| `store.sales-orders.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+46 more) |
| `store.sales-orders.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+18 more) |
| `store.service-jobs.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+6 more) |
| `store.service-jobs.calendar` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.service-jobs.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.service-jobs.show` | 💥 PARAM_ERROR |  | – |
| `store.tools.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+6 more) |
| `store.labels.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.reports.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.reports.daily-sales` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+18 more) |
| `store.reports.sales` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+94 more) |
| `store.reports.purchases` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+25 more) |
| `store.reports.purchase-returns` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+16 more) |
| `store.reports.day-book` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+7 more) |
| `store.reports.profit-loss` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+14 more) |
| `store.reports.party-statement` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+12 more) |
| `store.reports.transactions` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+7 more) |
| `store.reports.expenses` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+8 more) |
| `store.reports.account-ledger` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+7 more) |
| `store.reports.tax` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+12 more) |
| `store.reports.bank-statement` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+8 more) |
| `store.reports.stock-valuation` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+16 more) |
| `store.reports.low-stock` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+5 more) |
| `store.reports.movement-history` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+10 more) |
| `store.reports.expiry` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+6 more) |
| `store.reports.balance-sheet` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+16 more) |
| `store.reports.all-parties` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+8 more) |
| `store.reports.trial-balance` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+12 more) |
| `store.reports.item-wise-profit` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+20 more) |
| `store.reports.party-wise-profit-loss` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+14 more) |
| `store.reports.discount` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+39 more) |
| `store.reports.cash-flow` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+9 more) |
| `store.reports.sale-aging` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+6 more) |
| `store.reports.sale-orders` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+26 more) |
| `store.reports.bill-wise-profit` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+10 more) |
| `store.reports.expense-by-category` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+10 more) |
| `store.reports.expense-by-item` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+8 more) |
| `store.reports.stock-summary-by-category` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+12 more) |
| `store.reports.item-detail` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+10 more) |
| `store.reports.loan-statement` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+8 more) |
| `store.reports.tax-rate` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+14 more) |
| `store.reports.sale-purchase-by-party` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+10 more) |
| `store.reports.item-report-by-party` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+8 more) |
| `store.reports.party-report-by-item` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+8 more) |
| `store.reports.sale-purchase-by-item-category` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+8 more) |
| `store.reports.item-category-wise-profit-loss` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+58 more) |
| `store.reports.item-wise-discount` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+8 more) |
| `store.reports.sale-order-items` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+6 more) |
| `store.reports.stock-aging` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+10 more) |
| `store.reports.sale-purchase-by-party-group` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+12 more) |
| `store.reports.analytics` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+10 more) |
| `store.reports.refund-reasons` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+6 more) |
| `store.reports.point-in-time-inventory` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+10 more) |
| `store.reports.point-in-time-inventory.details` | ✅ PASS | 200 | – |
| `store.reports.customer-insights` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+12 more) |
| `store.reports.customer-insights.details` | ✅ PASS | 200 | – |
| `store.reports.supplier-insights` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+16 more) |
| `store.reports.supplier-insights.details` | ✅ PASS | 200 | – |
| `store.reports.owner-daily-pulse` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.cookbook.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+16 more) |
| `store.cookbook.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+6 more) |
| `store.cookbook.edit` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+8 more) |
| `store.growth-engine.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+14 more) |
| `store.growth-engine.dashboard` | ⚠️ ALL_ZEROS | 200 | `stats.total_signals`=0.00, `stats.potential_revenue`=0.00, `stats.realised_value`=0.00 (+2 more) |
| `store.growth-engine.show` | 🔴 HTTP_ERROR | 404 | – |
| `store.growth-engine.scorecard` | ⚠️ ALL_ZEROS | 200 | `total_generated`=0.00, `total_acted`=0.00, `total_graded`=0.00 (+1 more) |
| `store.growth-engine.settings` | ✅ PASS | 200 | `settings.min_order_value_filter`=5,000.00, `settings.loyalty_points_per_amount`=100.00, `plan.limits.ai_credits_monthly`=10,000.00 (+11 more) |
| `store.global.search` | 📄 NON_JSON | 200 | – |
| `store.ai.recommendations` | ✅ PASS | 200 | – |
| `store.ai.smart-reorder` | ✅ PASS | 200 | – |
| `store.ai.cash-flow-forecast` | ✅ PASS | 200 | `current_balance`=8,358,352.71, `avg_daily_net`=0.00, `forecast.sum_projected_net_change`=0.00 (+3 more) |
| `store.attributes.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.categories.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+7 more) |
| `store.inventory.stock-levels` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+10 more) |
| `store.bank-accounts.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+10 more) |
| `store.bank-accounts.transactions` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+7 more) |
| `store.parties.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+20 more) |
| `store.parties.ledgers` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+20 more) |
| `store.parties.ledger` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+17 more) |
| `store.parties.show` | ↩ REDIRECT | 302 | – |
| `store.expenses.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+11 more) |
| `store.expenses.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+8 more) |
| `store.vensynq.health` | 🔴 HTTP_ERROR | 404 | – |
| `store.vensynq.money-pipeline` | 🔴 HTTP_ERROR | 404 | – |
| `store.vensynq.payouts` | 🔴 HTTP_ERROR | 404 | – |
| `store.payments.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+13 more) |
| `store.payments.in` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+14 more) |
| `store.payments.out` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+14 more) |
| `store.purchases.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+34 more) |
| `store.purchases.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+8 more) |
| `store.purchases.show` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+20 more) |
| `store.purchases.edit` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+21 more) |
| `store.purchases.receive` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+15 more) |
| `store.transactions.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+25 more) |
| `store.inventory.stock` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+10 more) |
| `store.pre-sales.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+46 more) |
| `store.pre-sales.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+18 more) |
| `store.production.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+6 more) |
| `store.production.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+10 more) |
| `store.funds.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+12 more) |
| `store.accounting.dashboard` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+26 more) |
| `store.accounting.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+6 more) |
| `store.accounting.pnl` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+13 more) |
| `store.accounting.balance-sheet` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+16 more) |
| `store.recurring-invoices.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+20 more) |
| `store.recurring-invoices.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+12 more) |
| `store.recurring-invoices.edit` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+20 more) |
| `store.stock-transfers.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+6 more) |
| `store.stock-transfers.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.stock-transfers.show` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.debit-notes.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+17 more) |
| `store.debit-notes.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+14 more) |
| `store.debit-notes.show` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+19 more) |
| `store.bank-reconciliation.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.invoice-reminders.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+6 more) |
| `store.invoice-reminders.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+38 more) |
| `store.marketing-campaigns.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.marketing-campaigns.create` | ↩ REDIRECT | 302 | – |
| `store.woocommerce.index` | ↩ REDIRECT | 302 | – |
| `store.woo.plugin.download` | 🔴 HTTP_ERROR | 404 | – |
| `store.woo.connections.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.woo.connections.setup` | 🔴 HTTP_ERROR | 404 | – |
| `store.woo.connections.status-json` | 🔴 HTTP_ERROR | 404 | – |
| `store.woo.connections.sync` | 🔴 HTTP_ERROR | 404 | – |
| `store.woo.connections.logs` | 🔴 HTTP_ERROR | 404 | – |
| `store.e-invoicing.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.parked-sales.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+6 more) |
| `store.customers.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+9 more) |
| `store.customers.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.suppliers.search` | ✅ PASS | 200 | – |
| `store.parties.search` | ✅ PASS | 200 | – |
| `store.sales.dashboard` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+17 more) |
| `store.sales.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+86 more) |
| `store.attendance.status` | ✅ PASS | 200 | – |
| `store.sales.show` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+23 more) |
| `store.sales.invoice.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.presales.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.manufacturing.rules` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.finance` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+23 more) |
| `store.finance.receivables` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+6 more) |
| `store.finance.payables` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+6 more) |
| `store.funds.history.ledger` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+7 more) |
| `store.charity.stats` | ✅ PASS | 200 | `default_amount`=10.00 |
| `store.reports.dashboard` | ↩ REDIRECT | 302 | – |
| `store.admin.panel` | ↩ REDIRECT | 302 | – |
| `store.legacy.admin.data` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.legacy.admin.data.template` | ↩ REDIRECT | 302 | – |
| `store.backups.index` | ↩ REDIRECT | 302 | – |
| `store.backups.progress` | ✅ PASS | 200 | – |
| `store.legacy.admin.dashboard` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+23 more) |
| `store.legacy.admin.migration.index` | ↩ REDIRECT | 302 | – |
| `store.legacy.admin.users` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+8 more) |
| `store.legacy.admin.settings` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.legacy.admin.logs` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.legacy.admin.database` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.legacy.admin.staff` | ↩ REDIRECT | 302 | – |
| `store.staff-attendance.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.notifications.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+5 more) |
| `store.profile.edit` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.profile.store-members` | ✅ PASS | 200 | – |
| `store.returns-history.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+41 more) |
| `store.returns.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.returns-history.show` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+23 more) |
| `store.stock-transfers.edit` | ↩ REDIRECT | 302 | – |
| `store.stock-takes.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+6 more) |
| `store.stock-takes.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+6 more) |
| `store.stock-takes.show` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.batches.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+7 more) |
| `store.batches.show` | ↩ REDIRECT | 302 | – |
| `store.serials.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+12 more) |
| `store.serials.show` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+7 more) |
| `store.staff.attendance.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.online-store.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.v3.products.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+6 more) |
| `store.v3.products.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.v3.products.edit` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+7 more) |
| `store.v3.warehouses.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.v3.warehouses.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.v3.warehouses.edit` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+4 more) |
| `store.v3.purchases.receive` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+15 more) |
| `store.v3.purchases.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+34 more) |
| `store.v3.purchases.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+8 more) |
| `store.v3.purchases.show` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+20 more) |
| `store.v3.purchases.edit` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+21 more) |
| `store.v3.purchases.return.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+7 more) |
| `store.v3.opening-balances.status` | ⚠️ ALL_ZEROS | 200 | `balance_7000`=0.00 |
| `store.v3.suppliers.statement` | ✅ PASS | 200 | `supplier.opening_balance`=0.00, `supplier.current_balance`=0.00, `ap_balance`=-95,373.46 (+6 more) |
| `store.v3.sales.pdf` | 📄 NON_JSON | 200 | – |
| `store.v3.customers.statement` | ✅ PASS | 200 | `customer.opening_balance`=0.00, `customer.current_balance`=0.00, `customer.credit_limit`=300,000.00 (+11 more) |
| `store.v3.products.uom.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+7 more) |
| `store.v3.products.tiers.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plan.limits.ai_credits_monthly`=10,000.00, `ai_tiers.spark.credits`=500.00 (+7 more) |
| `store.v3.reports.trial-balance` | ✅ PASS | 200 | `rows.sum_total_debit`=5,079,840.83, `rows.total_total_debit`=5,079,840.83, `rows.sum_total_credit`=5,079,840.83 (+5 more) |
| `store.v3.reports.profit-loss` | ✅ PASS | 200 | `revenue`=449,876.14, `cogs`=369,887.37, `gross_profit`=79,988.77 (+7 more) |
| `store.v3.reports.balance-sheet` | ✅ PASS | 200 | `assets.accounts.sum_balance`=4,144,709.88, `assets.accounts.total_balance`=4,144,709.88, `assets.total`=4,144,709.88 (+9 more) |
| `store.v3.reports.cash-flow` | ✅ PASS | 200 | `operating.sum_net`=4,071,124.77, `operating.total_net`=4,071,124.77, `net_operating`=4,071,124.77 (+3 more) |
| `store.v3.reports.aged-receivables` | ✅ PASS | 200 | `rows.sum_total`=378,028.55, `rows.total_total`=378,028.55, `rows.sum_balance`=378,028.55 (+2 more) |
| `store.v3.reports.aged-payables` | ✅ PASS | 200 | `rows.sum_total`=50,260.04, `rows.total_total`=50,260.04, `rows.sum_balance`=50,260.04 (+2 more) |
| `store.v3.reports.sales` | ✅ PASS | 200 | `rows.sum_tax_rate`=527.00, `rows.total_tax_rate`=527.00, `rows.sum_line_total`=526,355.12 (+7 more) |
| `store.v3.reports.purchases` | ✅ PASS | 200 | `rows.sum_unit_cost`=1,192.37, `rows.total_unit_cost`=1,192.37, `rows.sum_line_total`=65,443.93 (+2 more) |
| `store.v3.reports.inventory-valuation` | ✅ PASS | 200 | `rows.sum_total_qty`=824.00, `rows.total_total_qty`=824.00, `rows.sum_unit_cost`=88,333.45 (+11 more) |
| `store.v3.reports.cogs` | ✅ PASS | 200 | `rows.sum_total_qty_sold`=13.00, `rows.total_total_qty_sold`=13.00, `rows.sum_total_cogs`=7,910.02 (+2 more) |
| `store.v3.reports.gross-profit` | ✅ PASS | 200 | – |
| `store.v3.reports.tax` | ✅ PASS | 200 | `output_tax`=76,478.98, `input_tax`=9,508.95, `net_payable`=66,970.03 (+4 more) |
| `store.v3.reports.party-ledger` | ✅ PASS | 200 | `opening_balance`=0.00, `lines.sum_debit`=31,474.61, `lines.total_debit`=31,474.61 (+5 more) |
| `store.v3.reports.inventory-movement` | ✅ PASS | 200 | `inflows.sum_value_in`=55,934.98, `inflows.total_value_in`=55,934.98, `outflows.sum_value_out`=7,910.02 (+1 more) |
| `store.v3.dashboard` | ✅ PASS | 200 | `receivables`=6,971,965.12, `payables`=11,858,827.30, `revenue_mtd`=0.00 (+2 more) |
