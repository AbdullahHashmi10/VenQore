# VenQore — Pre-Launch Remediation Plan

**Prepared:** 2026-07-08
**For:** self-execution (you fix, this is the map)
**Scope:** launch-critical core (POS, Sales, Purchasing, Inventory, Finance, Multi-tenant, RBAC, Terminals). VenSynQ / Smart Capture excluded except where a shared table is affected.

Each item lists: **What / Where (file:line) / Why it matters / Exact fix / Verify**. Items are ordered by priority. Line numbers are from the state on 2026-07-08 and may shift as you edit — search by the quoted code if so.

> **The single root cause behind most of P1:** your **migrations no longer reproduce `venqore_pos`**. Columns exist in production (added out-of-band during the v3 refactor) that no migration creates, so a fresh-migrated DB (`amd_pos_test`, any new install, any DR rebuild) has a *different schema* than production. That is why the mass-assignment guard is red on the test DB but `php artisan audit:mass-assignment` is green on `venqore_pos`. Fix **P1-0** and most of the rest either resolves or becomes verifiable.

---

## P0 — Security (do first, small, high-impact)

### P0-1 ✅ DONE — Cross-tenant terminal hijack (TerminalActivityController)
Already fixed this session. Guard: `Tester/tests/Feature/Guardrails/TerminalOwnershipGuardTest.php`. No action needed beyond running the guard.

### P0-2 🔴 Cross-tenant terminal hijack — **HeartbeatController** (same bug, still open)
- **Where:** `app/Http/Controllers/Api/HeartbeatController.php` (~line 56), route `POST /api/heartbeat` — **unauthenticated** (`routes/api.php`, outside `auth:sanctum`).
- **Why:** Identical to the terminal bug. An unauthenticated caller supplying a victim `device_id`/`terminal_id` plus **their own** `store_slug` triggers:
  ```php
  if ($tenant && $terminal->tenant_id !== $tenant->id) {
      $terminal->update(['tenant_id' => $tenant->id]);   // hijack
  }
  ```
  → steals another tenant's terminal.
- **Exact fix:** replace that block with the same guarded logic used in the terminal fix:
  ```php
  if ($tenant) {
      if (empty($terminal->tenant_id)) {
          $terminal->update(['tenant_id' => $tenant->id]);
      } elseif ((string) $terminal->tenant_id !== (string) $tenant->id) {
          return response()->json(['error' => 'Terminal does not belong to this store.'], 403);
      }
  }
  if ($deviceId && !$terminal->device_id) {
      $terminal->update(['device_id' => $deviceId]);
  }
  ```
- **Verify:** copy `TerminalOwnershipGuardTest` into a `HeartbeatOwnershipGuardTest` pointing at `/api/heartbeat`; assert a foreign `store_slug` cannot reassign an owned terminal and returns 403, and an unclaimed terminal can still be claimed.

### P0-3 🟠 Audit both unauthenticated device endpoints for abuse surface
- **Where:** `POST /api/terminal/activities`, `POST /api/heartbeat`, `POST /api/terminal/screenshot`.
- **Why:** All are unauthenticated and accept a `device_id`. Even after the hijack fix, anyone can create/associate terminals and push activity/screenshots by guessing a `device_id`.
- **Exact fix (choose one):** (a) add a lightweight shared-secret/DRM token check (you already have `drm.license` middleware — reuse it), or (b) rate-limit + validate `device_id` against a registered device table. At minimum add `->middleware('throttle:...')`.
- **Verify:** a request with an unknown/blank `device_id` is rejected; add a test.

---

## P1 — Schema drift & the writes it breaks (launch-critical)

### P1-0 🔴 Reconcile migrations with production schema (**the root cause**)
- **Why:** Until fixed, your test DB ≠ production, so the whole suite's guarantees are partial, and any fresh install / DR rebuild is broken.
- **Exact steps:**
  ```bash
  mysqldump --no-data venqore_pos > prod_schema.sql
  mysql -e "CREATE DATABASE schema_check"
  # point a scratch env at schema_check, then:
  php artisan migrate            # builds from migrations only
  mysqldump --no-data schema_check > migrated_schema.sql
  diff migrated_schema.sql prod_schema.sql
  ```
  For every table/column that exists in prod but not in the migrated schema, write a new migration that adds it. Repeat until `diff` is empty.
- **Verify:** `diff` is clean; then re-run the full Pest suite — the mass-assignment/fillable baselines should shrink toward empty and value tests become trustworthy.
- **Note:** This also tells you which of the items below are "add the missing column" vs "the code is wrong." Do P1-0 first; it reclassifies the rest.

### P1-1 🔴 AppSumo code import writes non-existent columns
- **Where:** `app/Console/Commands/ImportAppSumoCodes.php:89`
  ```php
  AppSumoCode::create(['code' => $code, 'campaign' => $campaign, 'status' => 'issued']);
  ```
- **Real table `appsumo_codes`:** `id, code, plan_tier, is_redeemed, redeemed_at, tenant_id, redeemed_by_email, metadata` → **no `campaign`, no `status`.**
- **Why:** AppSumo is your launch channel. On any fresh-migrated DB the import silently drops `campaign`/`status` (fillable) or throws (guarded). Codes import without campaign/status tracking.
- **Fix (pick one):** (a) add migration adding `campaign` (string, nullable) and `status` (string, default `'issued'`) to `appsumo_codes`; or (b) store both inside the existing `metadata` JSON and stop passing them as top-level keys.
- **Verify:** import a sample CSV on a fresh-migrated DB; assert `campaign`/`status` persisted (or present in `metadata`).

### P1-2 🔴 Installer writes `balance` to bank_accounts (wrong column)
- **Where:** `app/Http/Controllers/InstallerController.php:1063`
  ```php
  BankAccount::updateOrCreate(['account_number' => $row['bank_id']], [
      'name' => ..., 'balance' => $row['current_balance'] ?? 0, 'bank_name' => ...,
  ]);
  ```
- **Real table `bank_accounts`:** has `opening_balance`, `current_balance` — **no `balance`** in the create migration.
- **Why:** The installer runs on **every fresh install**. Imported bank balances silently vanish.
- **Fix:** write the real columns:
  ```php
  'current_balance' => $row['current_balance'] ?? 0,
  'opening_balance' => $row['current_balance'] ?? 0,
  ```
  (Confirm via P1-0 whether prod also added a `balance` alias column; if so, decide whether to keep it. Prefer the canonical `current_balance`.)
- **Verify:** run installer import on fresh DB; assert `current_balance` populated.

### P1-3 🔴 Purchases Excel import writes wrong item columns
- **Where:** `app/Imports/PurchasesImport.php:179`
  ```php
  PurchaseItem::create([
      'purchase_id' => ..., 'product_id' => ...,
      'quantity' => $qty, 'cost_price' => $cost, 'subtotal' => $lineTotal,
  ]);
  ```
- **Real table `purchase_items`:** `id, purchase_id, product_id, qty, unit_cost, tax_rate, business_pct, line_total, inventory_batch_id` → **no `quantity`, `cost_price`, `subtotal`.**
- **Why:** Purchase import is a live feature; on fresh DB every imported line loses qty/cost/total → purchases with zero quantities and costs, corrupting inventory valuation.
- **Fix — map to real columns:**
  ```php
  'qty' => $qty, 'unit_cost' => $cost, 'line_total' => $lineTotal,
  ```
- **Verify:** import a purchase sheet; assert `qty/unit_cost/line_total` populated and inventory value correct.

### P1-4 🔴 Debit note writes `reference` to stock_movements (wrong column)
- **Where:** `app/Http/Controllers/DebitNoteController.php:123`
  ```php
  StockMovement::create([... 'reference' => $reference, ...]);
  ```
- **Real table `stock_movements`:** `id, product_id, warehouse_id, quantity, type, reference_id, description, user_id` → **no `reference`** (there is `reference_id`).
- **Why:** Purchase-return stock movements lose their reference on fresh DB → broken audit trail for returns.
- **Fix:** decide the intent of `$reference` (it's a human string like "DN-123"). If `reference_id` is a string ref column in prod, rename the key to `reference_id`. If `reference_id` is meant for a numeric/uuid FK, instead add a `reference` string column via migration, or fold the value into `description` (already set). Confirm column type via P1-0.
- **Verify:** create a debit note; assert the movement row carries the reference.

### P1-5 🔴 Live V3 sales-order creation writes non-existent columns
- **Where:** `app/Http/Controllers/V3/SalesOrderController.php:41` (SalesOrder) and `:57` (SalesOrderItem). This is the **live** `sales-orders.store` route.
  - `SalesOrder::create([... 'warehouse_id' => ..., 'created_by' => ...])`
  - `SalesOrderItem::create([... 'qty', 'sale_uom', 'discount_percent', 'tax_rate', 'line_total' ...])`
- **Real tables:**
  - `sales_orders`: `id, order_number, customer_id, customer_name, order_date, delivery_date, status, total_amount, notes, user_id` (+ `party_id, discount, tax, ...`) → **no `warehouse_id`, no `created_by`.**
  - `sales_order_items`: `id, sales_order_id, product_id, quantity_requested, quantity_reserved, unit_price, subtotal` (+ `discount, tax, quantity`) → **no `qty, sale_uom, discount_percent, tax_rate, line_total`.**
- **Why:** Pre-sales / quotation → sales order is a live feature; on fresh DB it drops warehouse, creator, quantities, UOM, discounts, tax, and line totals — i.e. the order is largely empty.
- **Fix — review both create blocks and map to real columns:**
  - `created_by` → `user_id`; `warehouse_id` → add a migration column if the feature needs it (otherwise remove).
  - item: `qty` → `quantity` (or `quantity_requested`), `discount_percent` → `discount`, `tax_rate` → `tax`, `line_total` → `subtotal`; `sale_uom` → add column or drop.
- **Also check the other writers for the same tables** (may share the bug): `ProposalController.php:420/451`, `app/Http/Controllers/SalesOrderController.php:123/155/260` (legacy), `V3/QuotationController.php:107/129`.
- **Verify:** create a pre-sale/quote → convert; assert all item fields persisted and totals correct.

### P1-6 🟠 PaymentAllocation writers use pre-v3 semantics
- **Where:** `app/Services/PurchaseService.php:154` and `app/Http/Controllers/PosController.php:123`
  ```php
  PaymentAllocation::create(['payment_id' => ..., 'invoice_id' => ..., 'amount' => ...]);
  ```
- **Real (v3) table `payment_allocations`:** `id, payment_journal_entry_id, sale_id, purchase_id, allocated_amount, status` → the old `payment_id/invoice_id/amount` don't exist.
- **Why:** This is not just a column rename — the v3 allocation links a **payment journal entry** to a sale/purchase, not a payment→invoice. The old code is semantically incompatible.
- **Fix:** First determine if these paths are **live**:
  - `PosController::recordPayment` is called by `PosController::checkout`, which appears **unrouted** (the `/pos/sale` route is commented out — "completeSale which does not exist"). Likely **dead**; confirm and delete `checkout()`/`recordPayment()` (see P2-3).
  - `PurchaseService` — trace callers; if live, rewrite the allocation to v3 semantics (`payment_journal_entry_id`, `purchase_id`, `allocated_amount`, `status`) or route it through the v3 `AccountingService`.
- **Verify:** if live, a partial purchase payment produces a correct `payment_allocations` row and balanced journal.

### P1-7 🟠 Global activity log silently drops most fields (audit-trail gap)
- **Where:** `app/Traits/HasActivityLog.php:47` — runs on **every** model create/update/delete; writes to `StoreActivityLog` (`$table = 'activity_logs'`).
  - Writes: `subject_type, subject_id, payload, ip_address, user_agent, is_impersonated` (plus tenant_id/user_id/action).
- **Real table `activity_logs`:** `id, user_id, action, description, subject, properties, tenant_id` → **no `subject_type, subject_id, payload, ip_address, user_agent, is_impersonated`.** (`StoreActivityLog::$fillable` also lists `payload, ip_address, user_agent, is_impersonated` — all phantom.)
- **Why:** On fresh DB, every audit-log entry loses who/what/where detail (the `payload` diff, IP, UA, impersonation flag). Your audit trail is hollow exactly where you'd need it after an incident.
- **Fix (pick one):**
  - (a) Add a migration adding `subject_type (string), subject_id (string), payload (json), ip_address (string), user_agent (text), is_impersonated (bool)` to `activity_logs`, and reconcile the legacy `subject`/`properties` columns; **or**
  - (b) create a dedicated `store_activity_logs` table with the full schema and repoint the model.
- **Verify:** trigger a model update; assert the log row has payload/ip/user_agent populated.

### P1-8 🟡 Stale `$fillable`: `Tenant::onboarding_skipped`
- **Where:** `app/Models/Tenant.php:71` (`$fillable`) and `:105` (`$casts`). No migration creates `onboarding_skipped`; nothing writes it.
- **Why:** Vestigial. Harmless today but pollutes the fillable guard baseline and signals an abandoned feature.
- **Fix:** remove `onboarding_skipped` from `$fillable` and `$casts` — **or**, if the "skip onboarding" feature is intended, add the column via migration and wire it up.
- **Verify:** fillable guard baseline no longer lists it.

---

## P2 — Correctness / integrity / hygiene

### P2-1 🟠 Money-column alias reconciliation (sales & friends)
- **What:** The `sales` table carries **both** canonical (`net_sales, invoice_total, total_tax, subtotal_gross`) and legacy alias columns (`total, tax, subtotal`). `SaleService` writes both; older/other writers may write only one side.
- **Why:** Any report or writer that reads/updates one side but not the other drifts silently — the classic "dashboard says X, ledger says Y" bug.
- **Fix:** grep every writer/reader of `sales.total`, `sales.tax`, `sales.subtotal` vs the canonical columns; ensure all writers set both (or migrate everything to canonical and drop the aliases post-launch). The new `SaleFinancialValueGuardTest` pins `total==invoice_total` and `tax==total_tax` for the main path — extend it to returns/edits.
- **Verify:** guard test green across sale, return, and edit flows.

### P2-2 🟠 Tenant-scope review for models with `tenant_id` but no `HasTenant`
- **What:** These models have a `tenant_id` column but no global tenant scope, so queries are **not** auto-isolated:
  `CouponRedemption, PkVerification, PlanChangeNotification, StaffInvitation, TenantPlanOverride, WooConnection` (plus `User, TenantUser, PlatformActivityLog` which are cross-tenant/platform **by design** — leave those).
- **Why:** Any controller that queries these without a manual `where('tenant_id', …)` can leak or cross-write between tenants. **`WooConnection`** (per-store WooCommerce API creds) and **`StaffInvitation`** are the highest risk.
- **Fix:** for each of the 6, either add `use App\Traits\HasTenant;` (if every query should be store-scoped) or audit each query site to confirm an explicit tenant filter. Add them to `TenantIsolationSweepGuardTest` once scoped.
- **Verify:** extend the isolation sweep to include these models; assert no leak.

### P2-3 🟡 Remove dead / duplicated code paths
- **What / Where:**
  - `PosController::checkout()` + `recordPayment()` — no route (`/pos/sale` commented out). If confirmed unreachable, delete (also removes the P1-6 PosController allocation and the phantom `payments.type` write at `PosController:118`).
  - Duplicate sales-order controllers: legacy `App\Http\Controllers\SalesOrderController` vs `App\Http\Controllers\V3\SalesOrderController`. Confirm which serves live routes; remove or clearly quarantine the dead one.
  - `MigrationController` (writes `Sale::invoice_number`, `PurchaseOrder::order_number`) appears to be a one-time V3 ledger migration tool — confirm it's retired and remove, or guard behind a console-only command.
- **Why:** Dead code with wrong column names shows up as drift findings and confuses audits; it's also a latent footgun if a route is re-enabled.
- **Verify:** routes still resolve; suite green; drift baseline shrinks.

### P2-4 🟡 Phantom `payments.type` write
- **Where:** `PosController:118` writes `'type' => 'in'` to `Payment`; `payments` table has no `type` (`party_id, amount, date, method, reference_number, notes`). `Payment` uses `$guarded = []` → throws on fresh DB.
- **Fix:** part of deleting the dead PosController path (P2-3); if kept, drop `type` or add the column.

---

## P3 — Test & tooling hardening

### P3-1 Seed & commit the guard baselines, wire into CI
- Run the Guardrails suite once so it seeds `Tester/tests/Feature/Guardrails/baselines/*.json` (mass-assignment drift, stale fillable, unprotected write routes). **Review each seeded file** (it's the drift inventory) and commit it.
- Add to CI: `php artisan audit:mass-assignment` and the `Guardrails` suite. Fail the build on new drift.

### P3-2 Extend the mass-assignment scanner to raw `DB::table()->insert()`
- **Why:** The current scanner covers Eloquent static writes. Core financial writes use raw `DB::table('sales')->insert([...])` (e.g. `V3\SaleService`), which the scanner does **not** cover — a wrong key there fails differently (throws on missing column) and isn't guarded statically.
- **Fix:** extend `app/Support/Guardrails/MassAssignmentAnalyzer.php` to also match `DB::table('x')->insert([...])` / `->update([...])`, resolving `'x'` to the table directly (no model needed).
- **Verify:** scanner reports raw-insert drift; add to the baseline.

### P3-3 Idempotency under missing tenant context
- **Why:** `SyncController::batchOrders` dedupes via `Sale::where('id',…)->exists()` under the `HasTenant` scope. If the sync request has no bound tenant (scope falls back to `last_store_id` or `1=0`), the existence check can return false and **re-create** an already-synced sale.
- **Fix:** in `batchOrders`, do the dedupe check with `Sale::withoutGlobalScope('tenant')->where('id',…)->exists()` (id is a globally-unique UUID), so retries are idempotent regardless of context.
- **Verify:** extend `OfflineSyncIdempotencyGuardTest` to run the batch with no bound tenant and assert no duplicate.

### P3-4 Convert value-level guards to more flows
- Extend `SaleFinancialValueGuardTest` patterns to: purchases (`PurchaseService`), returns/reversals (`SaleReversalService`), and credit sales. Assert exact stored money values + `assertTrialBalanceZero` after each.

---

## Suggested execution order
1. **P0-2** (heartbeat hijack) and **P0-3** — hours, security.
2. **P1-0** (schema reconciliation) — this reclassifies P1-1…P1-8. Do the `diff` before editing individual writers; some "fixes" become "add the missing migration."
3. **P1-1, P1-2, P1-3, P1-5, P1-7** — launch-path data correctness (AppSumo, installer, purchases, sales orders, audit log).
4. **P1-4, P1-6, P2-4, P2-3** — returns reference, allocations, dead code.
5. **P2-1, P2-2** — money aliases, tenant-scope review.
6. **P3** — bake the guards into CI so none of this can silently return.

## Manual verification (can't be automated)
Real gateway sale, real purchase→stock→payment cycle with eyes on the ledger, restore-from-backup drill, email/DNS/SSL/monitoring, cross-device POS visual QA, and a final read of the committed `unprotected_write_routes.json` baseline.
