# Delivery Challan + Warehouses — Findings and Plan (7 Oct 2026)

Status: PLAN ONLY. No application code has been changed.

## How to add a warehouse today
- Sidebar: Stock Operations > Warehouses tab (`/stock-operations?tab=warehouses`) > "Add Warehouse".
- Alternative page: `/warehouses` (V3 Warehouses > "+ New Warehouse"). Not linked from the sidebar.
- Needs permission `admin.warehouses`. Second and later warehouses need the plan feature `multi_branch` and the `locations` limit.

## Findings (read from the code)
1. **"Preview Delivery Challan" does nothing.** Buttons in `SalesHistory.jsx` (2 places) and `PreSales.jsx` have no click handler; `TransactionMasterUI.jsx` passes an `onDeliveryChallan` nobody supplies. No challan route, view, table or number series exists.
2. **"Dispatch Goods" (`SaleController::storeDispatch` and `SalesInvoiceApprovalAdapter::postDispatch`) would crash.** It calls `FifoService::deductStock(... saleItemId: ...)`; that parameter does not exist.
3. **Nothing ever creates a sale with `delivery_status = pending`.** Column defaults to `delivered`, and `SaleService::post` deducts stock at sale time. So Goods Out lists nothing, and if it did, stock would be deducted twice.
4. **Dispatch is locked to `sales.warehouse_id`.** No way to dispatch from another warehouse, and no stock check per warehouse before dispatch.
5. **Two warehouse creators, different rules.** `StockOperationsController::storeWarehouse` skips the plan gate, unique-name check, default handling, and ignores contact person/phone on create. `V3\WarehouseController` has them.
6. **V3 `destroy` hard-deletes via raw DB** while the UI/messages say "deactivate"; the model uses SoftDeletes. It only checks `inventory_batches`, not sales/transfers referencing the warehouse.
7. Inactive warehouses are still returned by `/api/warehouses` (`Warehouse::all()`).

## Plan
**Phase 1 — Warehouse hygiene (low risk)**
- One creation path: StockOperations store/update delegate to the same validation (unique per store, plan gate, default rule, contact/phone).
- `destroy` becomes true deactivate (is_active=0) when any document references it; hard delete only if never used.
- `/api/warehouses` and pickers return active warehouses only.
- Link "Warehouses" to one canonical page.

**Phase 2 — Real Delivery Challan**
- New tables `delivery_challans` (tenant_id, number, sale_id, warehouse_id, dispatched_by, carrier, tracking, notes, date) and `delivery_challan_items` (sale_item_id, product_id, qty, batch refs).
- Per-store number series DC-0001.
- Printable PDF (`pdf/delivery-challan.blade.php`): store header, **dispatching warehouse name + address**, customer, items and quantities (no prices option), received-by signature block.
- Wire the dead buttons to the PDF; challan list per sale.

**Phase 3 — Dispatch from any warehouse**
- Goods Out gets a warehouse picker per dispatch (default = sale's warehouse), live availability per line, block if short.
- Fix the `deductStock` call; reuse the same code in the approval adapter (one shared method) and create the challan inside the same transaction.

**Phase 4 — Deliver-later sales (decision needed)**
- Option A: stock leaves at sale time (today). Challan is just a document for goods already invoiced. No double deduction.
- Option B: "Deliver later" sales reserve/skip deduction and stock leaves at dispatch. More accurate for warehouses but changes COGS timing and returns logic.

**Verification:** new tests in `tests/tests/Feature/Hardening/` (tenant scoping, per-warehouse stock, no double deduction, numbering), run `php artisan ziggy:generate`, then `php tests/Scripts/update_suites.php`.

## Separate: batch selection on a sale
Feasible. Needs an optional `batch_id` per line passed to `FifoService::deductStock` (and POS/invoice UI picker). Not part of this plan.

## Build status (7 Oct 2026, same day)
Built (NOT yet run — no PHP on the build machine; run migrate, `php artisan ziggy:generate`, then tests):
- Phase 1: StockOperations warehouse create/update now enforce unique name, plan gate, default rule, contact/phone; V3 destroy deactivates when the warehouse has history; `/api/warehouses` active only.
- Phase 2: migration `2026_10_11_000001_create_delivery_challans.php` (challans, items, `sales.stock_at_dispatch`), `DeliveryChallanService`, `DeliveryChallanController`, `pdf/delivery-challan.blade.php`, routes `sales.challan` and `delivery-challans.print`; "Preview Delivery Challan" in SalesHistory wired.
- Phase 3: Goods Out has a warehouse picker + per-warehouse stock; dispatch (direct and approval path) uses the shared service; crashing `saleItemId` call removed.
NOT built: Phase 4 — per-sale choice "stock out at sale" vs "at dispatch". Flag column exists; `SaleService::post` must skip FIFO/COGS when set and post COGS in the dispatch. Needs PHP + tests (accounting). PreSales.jsx challan button also still dead.

## Update — batch picker + per-sale stock timing (7 Oct 2026, evening)
All PHP files pass `php -l`; JSX parses. Nothing has been run against a database. Do before use: `php artisan migrate`, `php artisan ziggy:generate`, `php artisan test`.

**Batch selection** (invoice page `CreateInvoice`): new "Take from batch" column. Shows only for products with 2+ batches; default "Oldest first (auto)". Picks send `items[].batch_id`; `FifoService::deductStock(..., preferredBatchId:)` takes from that batch first, then FIFO for any shortfall. Endpoint: `GET /api/products/{id}/batches` (no cost shown). Not yet in the POS screen (`Pos.jsx`) or Pre-sale.

**Per-sale stock timing**: invoice header "Stock goes out: At sale | At dispatch".
- At dispatch: `SaleController::store` skips FIFO, stock counters and COGS; sets `sales.stock_at_dispatch=1`, `delivery_status='pending'`; remembers the chosen batch in `sale_items.preferred_batch_id`.
- Goods Out → `DeliveryChallanService::releaseStock`: FIFO deduct from the chosen warehouse, `sale_item_batches`, stock counters, StockMovement, `sale_items.cost_price`, and a journal `sale_dispatch` (DR 5000 / CR 1100) per dispatch.
- Void (`SaleReversalService`) also reverses `sale_dispatch` entries; an undispatched line restores nothing.
- Guards: deliver-later sales cannot be edited, cannot go through approval, and cannot be returned until fully dispatched.
Known limits: free units ship in proportion to paid units; partly-returned-then-voided deliver-later sales are not specifically handled.
