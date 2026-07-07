# VenSynQ Enterprise Audit & Implementation Plan
**Date:** 2026-07-07 · **Auditor:** AI Chief Architect session · **Scope:** Everything named VenSynQ + all integration points (inventory, accounting, billing, security, sync, UX)

> Method: audit of actual code, not comments or prior docs. Every finding cites file + line.

---

## 1. What VenSynQ actually is today (two unrelated things share the name)

| Codebase artifact | What it really does |
|---|---|
| `app/Services/VenSynQ/VenSynQService.php` | **Cross-store (multi-tenant) sync**: copy products between tenants, consolidated revenue, cross-store stock transfer. Nothing to do with marketplaces. Only consumer: `tests/Feature/Module19/VenSynQTest.php`. |
| `VenSynQController` + `SmartFulfillmentService` + `Platforms/{Amazon,TikTok,Ebay}Client` + `VenSynQSyncJob` + `TokenRefreshJob` + `EcommerceChannel` | **Marketplace fulfillment engine** (Amazon/TikTok/eBay): OAuth connect, order pull, dropship sale creation, JIT purchase drafts, tracking push. This is the thing the enterprise vision refers to. |
| `app/Services/WooSync/*` | Completely separate WooCommerce engine (products only via webhooks; own conflict resolution, own webhook signature verification, PlanGate-gated). **Not unified** with VenSynQ. |

**Verdict: the "One Inventory. One Ledger. Every Channel." principle is violated three ways** — WooSync, VenSynQ marketplace engine, and the canonical `V3\SaleService` each have their own inventory/accounting behavior.

---

## 2. Status matrix (with evidence)

### ✅ Working
| Item | Evidence |
|---|---|
| OAuth token encryption at rest | `EcommerceChannel.php:51-69` encrypt/decrypt mutators; tokens `$hidden` |
| Duplicate order protection | `SmartFulfillmentService.php:157-170` (channel_order_id check, "Step 0") |
| Row locking on stock read | `SmartFulfillmentService.php:195-198` `lockForUpdate()` |
| Tenant check on channel CRUD | `VenSynQController::authorizeChannel()` (line 521) |
| Simulation mode for local dev | `config/vensynq.php`, all three platform clients |
| Fee expense auto-creation | `SmartFulfillmentService::createChannelFeeExpense()` |
| Tracking push (Amazon carriers mapped) | `AmazonClient::pushTracking()` + carrier map |
| Immutability of posted sales | `SaleObserver` (registered in provider) |

### ⚠️ Partially working
| Item | Evidence / gap |
|---|---|
| Platform clients | Amazon SP-API order fetch is real code but **untested against live API**, no AWS SigV4/RDT, no rate-limit handling, no pagination. TikTok/eBay clients are thinner. |
| Manual sync (`fetchLiveOrders`) | Works, but synchronous in the request cycle — a slow marketplace API blocks the web request. No queue use. |
| JIT drafts | Created and approvable, but **approval never creates stock, never posts a purchase journal, never records COGS** (`SmartFulfillmentService::approveJitDraft()` only flips status + amounts). |
| Feature flags | `PlanFeatureMatrixSeeder.php:164-168` defines `vensync_command`, `marketplace_oauth`, `commission_isolation`, `dropshipping` — **all '0' on every plan and never checked anywhere** (grep: no `PlanGate::check('vensync_command')` in app/). Gate is only `config('vensynq.enabled')` 404 in controller constructor. |

### ❌ Broken (bugs)
| # | Bug | Evidence |
|---|---|---|
| B1 | `universalCallback` passes wrong args: `$this->callbackChannel($storeSlug, $platform, $request)` but signature is `callbackChannel(string $platform, Request $request)` → TypeError / platform receives the store slug. Production OAuth callbacks **cannot work**. | `VenSynQController.php:198` vs `:91` |
| B2 | OAuth `state` mismatch: clients set `state=csrf_token()` (`AmazonClient.php:50`, `TikTokClient.php:28`, `EbayClient.php:29`) but `universalCallback` expects base64 `"store_slug:..."` (`VenSynQController.php:165-175`). State is never verified → **no CSRF/replay protection**, and tenant resolution from state can never succeed. |
| B3 | `VenSynQSyncJob.php:55` — `User::where('tenant_id', …)` but the `users` table has **no tenant_id column** (removed by `2026_04_10_100005_update_users_to_definitive_plan.php`; membership is via `tenant_users` pivot). SQL error → every channel sync fails into catch. |
| B4 | `VenSynQSyncJob` and `TokenRefreshJob` are **never scheduled or dispatched anywhere** (grep across app/ + routes/: only their own class definitions). Background sync and token rotation simply don't run. |

### ❌ Missing / not connected (vs. the enterprise vision)
1. **Accounting bypass (critical):** `SmartFulfillmentService::processDropshipSale()` writes `Sale::create([... 'status'=>'posted' ...])` directly — the canonical path comment in `V3\SaleService::post()` says it is "the ONLY method that writes to sales". Marketplace sales post **no journal entry at all** (no Dr AR / Cr Sales, no COGS, no inventory credit). Fee `Expense::create` also posts **no journal** (normal expenses journal via `ExpenseController::postExpenseJournalEntry()`). Result: P&L, balance sheet and inventory valuation are all wrong for every channel order.
2. **FIFO bypass (critical):** stock is deducted with `Stock::decrement('quantity')` (`SmartFulfillmentService.php:226-230`) — no `inventory_batches` FIFO deduction (`V3\FifoService::deductStock()` unused), no `StockMovement` audit record, no COGS. Batch remaining_qty drifts from Stock.quantity permanently.
3. **No provider abstraction:** no interface; controller/jobs `match()` on hardcoded platform names in 3 places. Adding a channel = architectural edits.
4. **No webhooks** for marketplaces (pull-only), no dead-letter queue, no retry policy, no conflict detection, no inventory push (stock changes in VenQore never reach Amazon/eBay/TikTok).
5. **No permission middleware** on the `/vensynq` route group (`routes/web.php:1063-1092`) — any tenant user role can process orders and manage channels; every other module uses `permission:` middleware.
6. **No plan/billing integration**, no add-on monetization, no locked-state upgrade UX (grep for "upgrade/locked" in `resources/js/Pages/VenSynQ/*` → zero hits).
7. **No Marketplace Inventory tab** in product details; no per-channel listing/price/sync visibility anywhere.
8. **No VenSynQ analytics dashboard** (revenue/fees/profit by channel); current Dashboard.jsx is an operational dispatch queue only.
9. **No reserved/committed/incoming inventory model** for channels; no multi-warehouse allocation strategy; channel maps to a single warehouse.
10. **No platform-owner console** beyond a single enable/disable toggle (`SuperAdminController::toggleVenSynQ`, web.php:448).
11. **Multi-currency is cosmetic:** `channel_currency` stored, but totals are booked at face value — no FX conversion into base currency.
12. **Taxes ignored:** every channel sale posts `tax => 0`.
13. **JIT invoice numbers** use `'JIT-'.time().'-'.rand(100,999)` — collision-prone; bypasses `SequenceService`.
14. **Onboarding wizard, credential validation/test-connection, sync preview**: none.

---

## 3. Root architectural decision

Marketplace orders must flow through the **same engines as everything else**:
- Inventory: `V3\FifoService` (batches, negative-stock policy, deterministic FIFO) + `StockMovement` audit rows.
- Ledger: `V3\AccountingService::createEntry()` (balanced, idempotency-keyed, party snapshots, audit log).
- Channel money flows through a dedicated **`1205 Marketplace Clearing`** asset account: order → Dr 1205 / Cr 4000 (+COGS pair); fees → Dr 6000-family / Cr 1205; payout → Dr bank / Cr 1205. This makes every marketplace balance reconcilable.

Long-term, all channels (WooSync included) should implement one `ChannelProvider` contract feeding one `ChannelOrderIngestionService`.

---

## 4. Phased implementation plan

### Phase 0 — Critical correctness & security fixes *(implemented in this session)*
1. Fix `universalCallback` argument bug (B1).
2. Harden OAuth `state`: signed base64 `slug:nonce` generated per connect, stored in session, verified in callback (B2) — consistent across Amazon/TikTok/eBay clients.
3. Fix sync job user resolution via `tenant_users` pivot (B3).
4. Schedule `VenSynQSyncJob` (15 min) and `TokenRefreshJob` (10 min), gated on `config('vensynq.enabled')` (B4).
5. **Financial integrity:** route `processDropshipSale()` through FIFO + double-entry:
   - FIFO batch deduction for FBM portion (fallback to legacy Stock table kept in sync), `StockMovement` audit rows,
   - balanced journal: Dr 1205 Marketplace Clearing / Cr 4000 Sales; Dr 5000 COGS / Cr 1100 Inventory (FIFO cost),
   - FBA lines: revenue-only journal (no inventory),
   - fee expense journal: Dr 6000 / Cr 1205, idempotency-keyed.
6. **Access control:** new `vensynq.access` middleware (config switch + `PlanGate::check('vensync_command')`) on the tenant route group; JIT sequence numbers via `SequenceService`.

### Phase 1 — Provider abstraction & sync engine (next session)
`ChannelProviderInterface` (auth, fetchOrders, pushInventory, pushTracking, verifyWebhook); provider registry; per-channel queued sync jobs with retries/backoff + dead-letter table; `channel_sync_logs`; health status on channel; inventory **push** on stock change (mirror `amd:sync-stock` dirty-flag pattern); JIT approval → real purchase posting (stock in + journal).

### Phase 2 — Product & listing layer
`channel_listings` table (product_id, channel_id, marketplace SKU/ID, listing status, price, qty snapshots, last push/pull, last error); **Marketplace Inventory tab** in product details with the full field list from the spec; distribution charts.

### Phase 3 — Dashboards & finance
Revenue/fees/profit/orders by channel (posted journals as source of truth), sync-queue & webhook health widgets, refunds/returns/chargeback flows via `SaleReversalService`, FX conversion at booking time, marketplace tax mapping.

### Phase 4 — Billing & platform console
Marketplace add-ons (per-channel pricing) on plans/limits; upgrade-prompt locked UX; platform-owner console: global channel toggles, tenant usage, force resync, connection reset, log viewer.

### Phase 5 — Onboarding wizard & future channels
Connect wizard (validate → test → import → match → preview → confirm); Shopify/Etsy/Walmart/Daraz/Noon/CSV/FTP providers on the Phase 1 contract.

---

## 5. How to enable (current state, after Phase 0)

1. **Platform switch:** `.env` → `VENSYNQ_ENABLED=true` (or SuperAdmin → VenSynQ toggle), `php artisan optimize:clear`.
2. **Plan flag:** set `vensync_command = 1` on the target plan (SuperAdmin → Plans) — Phase 0 now enforces this; the seeder default is 0 everywhere.
3. **Simulation:** leave `VENSYNQ_SIMULATION_MODE=true` for local dev — connect/sync work end-to-end with mock data (SKUs PROD-A101/B202/C303 must exist to test).
4. **Amazon (real):** SP-API app in Seller Central Developer Console → set `VENSYNQ_AMAZON_CLIENT_ID/SECRET/MARKETPLACE_ID/BASE_URL`; sandbox: `VENSYNQ_SANDBOX_MODE=true` + `VENSYNQ_AMAZON_REFRESH_TOKEN`. Redirect URL: `https://venqore.com/amazon/callback`.
5. **TikTok / eBay:** developer-portal apps → `VENSYNQ_TIKTOK_APP_KEY/SECRET`, `VENSYNQ_EBAY_CLIENT_ID/SECRET`; callbacks `/tiktok/callback`, `/ebay/callback`.
6. **Workers:** `php artisan queue:work` (or Horizon) + `php artisan schedule:work` — background order sync and token refresh now run automatically every 15/10 minutes.
7. **Chart of accounts:** account `1205 Marketplace Clearing` is auto-created on first channel order; `4000/5000/1100/6000` must exist (standard seeded chart).
8. **Common mistakes:** forgetting `optimize:clear` after env changes; testing with SKUs not present in the catalog (sale fails with SKU-not-found); expecting background sync without a queue worker.

---

## 6. Out-of-scope notes
- `VenSynQService` (cross-store) is intact and untouched; recommend renaming to `CrossStoreSyncService` later to end the naming collision.
- WooSync unification is deliberately deferred to Phase 1 (it works and is signature-verified today; don't destabilize it).
