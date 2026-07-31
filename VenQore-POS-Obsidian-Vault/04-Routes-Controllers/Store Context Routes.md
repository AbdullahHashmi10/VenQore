---
tags: [routes, store]
---

# Store Context Routes — `s/{store_slug}/*`

Part of [[VenQore POS - Home]] · [[Route Map Overview]]

The largest route group (~lines 165–1497 of `web.php`), name prefix `store.`.

## Setup / Terminal / POS
- Setup wizard, terminal pairing tokens.
- POS: `store.pos`, `store.pos.search/featured/categories/barcode`, `store.pos.open/close` (sessions), `store.pos.return.store`.

## Staff / Billing / Backups
- Staff invite, billing (upgrade/portal/cancel/resume/checkout), backup export/import, Google Drive backup sync.

## Settings
- `store.settings`, custom charges CRUD.

## SmartCapture (AI receipt/document scan)
`store.smart-capture.*` — context, extract, confirm, settings, test.

## Store Admin Panel — `store.admin.*`
See [[Three Admin Surfaces]] for the full breakdown (users, invitations, logs, data management, recycle bin, chatbot settings, Vena tickets).

## Inventory / Stock
`store.inventory.*`, `store.categories.*`, stock operations, stock transfers, stock takes/audits, batch tracking, serial tracking, product variants/attributes, production runs, cookbook (recipes), labels.

## Sales / POS Transactions
`store.sales.*` (CRUD, park/recall, cancel, return, bulk-destroy, export), pre-sales/sales orders, parked sales, proposals (convert to sale/pre-sale), debit notes, returns history, recurring invoices, invoice reminders, e-invoicing.

## Purchases
Suppliers, purchase orders (+receive/print), purchases (+receive).

## Parties / Customers / Suppliers
`store.parties.*` (+ledgers), customers resource, search endpoints.

## Finance / Accounting
`store.finance*`, bank accounts, funds (add/remove/transfer/adjust), accounting (chart/P&L/balance sheet), payments (in/out), expenses, bank reconciliation, transactions index, charity, Owner Daily Pulse (passcode-protected vault dashboard).

## Reports (~45 endpoints)
All under `store.reports.*` — daily-sales, sales, purchases, day-book, profit-loss, party-statement, tax, bank-statement, stock-valuation, low-stock, expiry, balance-sheet, trial-balance, item-wise-profit, cash-flow, sale-aging, and many more. A deprecated catch-all at the bottom of the file returns 403 for unmapped `/reports/{any}`, pointing to `/v3/reports/*` instead.

## Growth Engine / AI / Loyalty
`store.growth-engine.*`, `store.ai.*` (recommendations, smart-reorder, cash-flow-forecast), loyalty award/redeem, gift cards, store credit, global search.

## VenSynQ (Multi-Channel Fulfillment)
`store.vensynq.*` — channels CRUD, preview, process, sync-tracking, JIT draft approval, platform connect/callback.

## WooCommerce Sync
`store.woo.*` — connections index/store/setup/status/settings/destroy/sync/approve/push/pull/scan/resolve/ignore/logs, plugin download.

## Manufacturing / BOM
`store.manufacturing.rules` page + `/api/manufacturing-rules*` API.

## Staff Attendance / HR (legacy V1)
`store.attendance.*`, `store.staff-attendance.*` (duplicated under `/staff/attendance/*`).

## Marketing / Online Store
`store.marketing-campaigns.*`, `store.online-store.*`.

## Legacy Admin Panel
`/admin-panel/*` (`store.legacy.admin.*`) — deprecated, redirects into the new Data & Backup hub.

## System Reset
`store.system.reset`, `store.system.delete-entity`.

## Related
- [[Controllers Directory]]
- [[V3 ERP Routes]]
