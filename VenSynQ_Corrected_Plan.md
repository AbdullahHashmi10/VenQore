# VenSynQ — Multi-Channel E-Commerce Fulfillment Engine
## Corrected Master Implementation Plan · VenQore ERP

> **Document Purpose:** This document supersedes the original Gemini-generated VenSynQ plan. It corrects all identified architectural errors, fills missing logic gaps, and provides a production-ready build sequence for the VenQore development team.

---

## Table of Contents

1. [What VenSynQ Is — Corrected Scope](#1-what-vensynq-is--corrected-scope)
2. [Database Schema — Corrected & Complete](#2-database-schema--corrected--complete)
3. [SmartFulfillmentService — Corrected Logic](#3-smartfulfillmentservice--corrected-logic)
4. [Phase 1 — Manual Mode (Corrected Build Order)](#4-phase-1--manual-mode-corrected-build-order)
5. [Phase 2 — File Upload Bridge (Corrected Parsers)](#5-phase-2--file-upload-bridge-corrected-parsers)
6. [Phase 3 — Live API Automation (Corrected Architecture)](#6-phase-3--live-api-automation-corrected-architecture)
7. [OAuth Connection Flow — Complete](#7-oauth-connection-flow--complete)
8. [Phase 4 — VenSynQ OmniChat (Do Not Build Yet)](#8-phase-4--vensynq-omnichat-do-not-build-yet)
9. [Complete Build Order — Master Sequence](#9-complete-build-order--master-sequence)
10. [Revenue Model](#10-revenue-model)

---

## 1. What VenSynQ Is — Corrected Scope

VenSynQ is a premium add-on module inside VenQore that turns the platform into a **Unified Multi-Channel Order Fulfillment Command Center**. It serves both dropshippers and inventory holders operating across Amazon (FBM and FBA), TikTok Shop, and eBay.

**Pricing:** $5/month per connected channel account. A client running 3 channels pays $15/month extra MRR on top of their base VenQore plan.

### 1.1 The Four Pain Points It Solves

| Pain Point | Root Cause | VenSynQ Solution |
|---|---|---|
| Mixed Inventory Chaos | No split between home warehouse stock and JIT day-bought stock | Smart Fulfillment Engine checks warehouse first, auto-generates JIT purchase drafts only for shortfalls |
| No Real Profit Visibility | Platform fees, COGS, and revenues tracked in separate tools | Unified ledger: revenue, JIT cost, and channel fees all posted to existing VenQore tables automatically |
| Triple Data Entry | Every channel sale re-entered manually into accounting software | Phase 1: single manual entry form. Phase 3: zero entry, 6AM API sync |
| Tracking Nightmare | Tracking numbers entered separately in each seller portal | One-click Sync Tracking button pushes to Amazon, TikTok, eBay simultaneously |

### 1.2 Who Uses This — Both Models Supported

The original plan only addressed dropshippers. The system must serve both user types without friction:

| Seller Type | How They Use VenSynQ | What Changes |
|---|---|---|
| Pure Inventory Holder | Sells only from their home warehouse. No JIT purchasing needed. | SmartFulfillmentService deducts stock normally. No draft purchase is ever created. Channel fee expense still auto-posts. |
| Pure Dropshipper | Buys everything day-of to fulfill orders. Warehouse always at 0. | Every item triggers JIT draft purchase. Client fills in supplier cost daily. |
| Mixed Model (Most Common) | Holds top sellers in warehouse, dropships slow movers. | System deducts available stock, then creates JIT draft only for the shortfall quantity. Both actions happen per-SKU, not per-order. |

---

## 2. Database Schema — Corrected & Complete

The IDE plan had the right structure but missed critical fields. Below is the full corrected schema for all three migrations.

### 2.1 Migration: alter `sales` table

| Column | Type | Default | Purpose & Correction Notes |
|---|---|---|---|
| `is_dropship` | boolean | false | Flags this sale as a channel order. Bypasses negative stock error when true. |
| `channel_store_name` | string, nullable | null | Human name: "Amazon FBM Store 1". Links display to ecommerce_channels. |
| `ecommerce_channel_id` | FK to ecommerce_channels, nullable | null | **ADDED:** Foreign key properly links sale to channel record. Original plan had no FK, only a string name. This enables fee lookups and API sync. |
| `channel_order_id` | string, nullable | null | External platform order ID. **MUST have unique index per tenant+channel** to prevent duplicate sync entries. |
| `fulfillment_type` | enum: `fbm`, `fba`, `jit` | fbm | **CRITICAL FIX:** Distinguishes FBM (deduct home warehouse), FBA (no local deduction, revenue only), JIT (auto-purchase). Original plan missed FBA entirely. |
| `tracking_number` | string, nullable | null | Set after dispatch. |
| `shipping_carrier` | string, nullable | null | Royal Mail, Evri, DPD, etc. |
| `dispatch_status` | enum: `pending`, `dispatched`, `cancelled` | pending | |
| `financial_reconciled` | boolean | false | **ADDED:** True only when all JIT draft purchases linked to this sale are approved. Until true, profit shown on dashboard is **estimated**, not confirmed. |
| `channel_currency` | string(3) | GBP | **ADDED:** Prevents currency mixing when client later adds international stores. Stores ISO code per sale. |
| `gross_platform_fee` | decimal(10,2), nullable | null | **ADDED:** In Phase 3, stores the exact fee from API. In Phase 1, stores the estimated fee. Dashboard shows which one applies. |

> **CRITICAL:** Add a unique composite index on `(tenant_id, ecommerce_channel_id, channel_order_id)` on the sales table. This is the single most important protection against duplicate orders when the cron job runs or a file is uploaded twice. Without it, a server hiccup will create duplicate invoices silently.

---

### 2.2 Migration: alter `purchases` table

| Column | Type | Default | Purpose & Correction Notes |
|---|---|---|---|
| `is_jit` | boolean | false | Flags auto-generated JIT purchases. |
| `jit_sale_id` | FK to sales, nullable | null | Links draft purchase back to originating sale. |
| `jit_sku` | string, nullable | null | **ADDED:** Stores which specific SKU this JIT purchase covers. A sale with 5 shortfall SKUs creates 5 separate draft purchases, one per SKU. |
| `jit_quantity` | integer, nullable | null | **ADDED:** The exact shortfall quantity, not the full ordered quantity. If 10 ordered and 3 in warehouse, `jit_quantity = 7`. |
| `approval_status` | enum: `draft`, `approved` | draft | Draft = awaiting client to fill supplier cost. Approved = COGS locked in. |
| `fee_estimate_used` | boolean | false | **ADDED:** Tracks if the channel fee on the linked sale was an estimate (Phase 1) or exact (Phase 3). Helps reconciliation audit trail. |

---

### 2.3 Migration: create `ecommerce_channels` table

| Column | Type | Notes |
|---|---|---|
| `id` | bigint, PK | |
| `tenant_id` | FK to tenants | Required for multi-tenancy. Must be scoped in all queries. |
| `name` | string | e.g. "My Amazon FBM UK Store" |
| `platform` | enum: `amazon`, `tiktok`, `ebay` | |
| `default_fulfillment_type` | enum: `fbm`, `fba`, `jit` | **ADDED:** Channel-level default. Amazon FBA channels default to `fba`. FBM channels default to `fbm`. Can be overridden per-SKU in Phase 2+. |
| `fee_percentage` | decimal(5,2) | Fallback estimate fee. Used in Phase 1. e.g. `15.00` for Amazon. |
| `fee_source` | enum: `estimated`, `api_exact` | **ADDED:** Tracks if `gross_platform_fee` on sales is estimated or API-confirmed. Auto-switches to `api_exact` in Phase 3. |
| `expense_account_id` | FK to accounts/expense_categories | **CORRECTED:** FK to the actual chart of accounts table, not a plain string. Auto-creates the account if not exists on channel setup. |
| `warehouse_id` | FK to warehouses, nullable | **ADDED:** Which physical warehouse fulfills FBM orders for this channel. Set during Click 3 of OAuth flow. |
| `currency` | string(3), default GBP | **ADDED:** ISO currency code for this channel. Prevents currency mixing. |
| `oauth_access_token` | text, encrypted, nullable | Short-lived token. Refreshed automatically by health-check job. |
| `oauth_refresh_token` | text, encrypted, nullable | **SEPARATED** from access token. Stored with its own expiry column. |
| `access_token_expires_at` | timestamp, nullable | **ADDED:** Health-check job proactively refreshes before this timestamp. |
| `refresh_token_expires_at` | timestamp, nullable | **ADDED:** System emails client to reconnect before this date. |
| `is_connected` | boolean, default false | True after successful OAuth. Set to false if token refresh fails. |
| `last_synced_at` | timestamp, nullable | **ADDED:** Records last successful sync. Used to detect silent failures. |
| `sync_status` | enum: `idle`, `syncing`, `error` | **ADDED:** Live status of cron job for this channel. Shown in UI. |
| `sync_error_message` | text, nullable | **ADDED:** Last error from cron. Shown in channel card so client knows what went wrong. |

---

## 3. SmartFulfillmentService — Corrected Logic

This is the core engine. Every data source (manual form, file upload, API) feeds into this single service. The original plan had the right concept but missed the FBA split, the race condition fix, and the per-SKU JIT draft separation.

### 3.1 The Normalized Input Contract

All three data sources must convert their raw data into this single internal object before calling the service:

```
NormalizedOrderItem {
    sku              : string
    quantity          : int
    sale_price        : decimal
    platform_fee      : decimal|null   // null in Phase 1 = use fee_percentage estimate
    channel_id        : int            // FK to ecommerce_channels.id
    channel_order_id  : string
    fulfillment_type  : fbm|fba|jit   // CRITICAL: determines inventory action
    currency          : string(3)      // ISO code from channel
}
```

### 3.2 The Corrected Processing Flow

The service runs inside a **database transaction**. All steps are atomic — if any step fails, nothing is written.

| Step | Action | FBM Behavior | FBA Behavior | JIT Behavior |
|---|---|---|---|---|
| 0 | Duplicate check | Query: does a sale exist for this `tenant + channel + channel_order_id`? If yes, skip entirely. Do not throw error. | Same | Same |
| 1 | Pre-validation snapshot | Lock product row: `Product::lockForUpdate()`. Read current `stock_qty`. Lock held until transaction commits — prevents race conditions. | Skip lock. FBA does not touch local inventory. | Skip lock. JIT always creates purchase regardless. |
| 2 | Inventory split calculation | `available = min(stock_qty, quantity)`. `shortfall = quantity - available`. | `available = 0`. `shortfall = 0`. FBA stock lives at Amazon, not in VenQore. | `available = 0`. `shortfall = quantity`. All units need purchasing. |
| 3 | Sale record creation | Create Sale record with gross revenue, `fulfillment_type`, channel fields. `financial_reconciled = false`. | Same, but `fulfillment_type = fba`. No local stock deduction. | Same, `fulfillment_type = jit`. |
| 4 | Stock deduction | Deduct available qty from warehouse: `stock_qty -= available`. | **No deduction.** FBA inventory is not tracked in VenQore local warehouse. | No deduction unless hybrid: if some stock exists, deduct available, create JIT draft for shortfall. |
| 5 | JIT purchase draft | Create draft purchase only if `shortfall > 0`. Use `product.default_cost_price` as placeholder. Set `is_jit=true`, `approval_status=draft`, `jit_sku`, `jit_quantity=shortfall`. | **No JIT draft.** FBA items are pre-stocked at Amazon. | Always create JIT draft for full quantity. |
| 6 | Platform fee expense | `fee = platform_fee ?? (sale_total * channel.fee_percentage / 100)`. Create Expense entry against channel expense account. Set `fee_source` accordingly. | Same. FBA also has fees. | Same. |
| 7 | financial_reconciled update | If no JIT drafts were created (all from stock), set `financial_reconciled = true` immediately. | Set to `true` immediately. No drafts to resolve. | Set to `false`. Must wait for client to approve draft cost. |
| 8 | Commit transaction | All writes committed atomically. | Same | Same |

### 3.3 The Pre-Save Validation Preview

Shown to the user **before** the transaction runs. Read-only soft preview — no locks held. When user clicks Confirm, the actual transaction with locks runs fresh.

| Column Shown | Source | Color Code |
|---|---|---|
| SKU | Input data | Red row if SKU not found |
| Product Name | `products` table lookup | Red row if SKU not found |
| Ordered Qty | Input data | — |
| In Warehouse Now | Current `stock_qty` (soft read, no lock) | — |
| Action | Calculated from `fulfillment_type` | 🟢 Green = deduct stock · 🟡 Amber = partial deduct + JIT draft · 🔵 Blue = FBA (revenue only) · 🔴 Red = SKU not found |
| Estimated Cost (JIT) | `product.default_cost_price * shortfall_qty` | Shows only for Amber/JIT rows |
| Estimated Fee | `sale_price * channel.fee_percentage / 100` | Shown for all rows |

> **Important UX Note:** The word "Estimated" must appear visibly next to all financial figures on this preview screen and on the dashboard until `financial_reconciled = true`. This prevents the client from treating draft numbers as final profit figures.

---

## 4. Phase 1 — Manual Mode (Corrected Build Order)

Phase 1 is **fully shippable without any API**. Clients can manage their entire dropshipping workflow from day one. The build sequence is ordered to unblock testing at each step.

| # | Task | What To Build | Unblocks |
|---|---|---|---|
| 1 | Database Migrations | Run all three migrations in order: `ecommerce_channels`, then alter `sales`, then alter `purchases`. Add the unique composite index on sales. | Everything else |
| 2 | Model Updates | Update `Sale.php`: add fillable fields, `hasMany(Purchase, jit_sale_id)`, `belongsTo(EcommerceChannel)`. Update `Purchase.php`: add fillable, `belongsTo(Sale, jit_sale_id)`. Create `EcommerceChannel.php` with `HasTenant` trait and `hasMany(Sale)`. | Service layer |
| 3 | SmartFulfillmentService.php | Build `processDropshipSale($items, $channelId)`. Implement all 8 steps from Section 3.2. Unit-test all three `fulfillment_type` paths (fbm, fba, jit) with factory data before wiring to UI. | All sale creation |
| 4 | VenSynQ Channel Setup UI | React page to create/edit `ecommerce_channels` records. Fields: name, platform, `default_fulfillment_type`, `fee_percentage`, warehouse assignment, expense account. Client sets up their stores here before doing anything else. | Command Center |
| 5 | Sale Creation Form Update | Add "Channel Order" toggle to manual sale entry form. When toggled on: show channel selector, order ID field, `fulfillment_type` override. On submit, route to `SmartFulfillmentService` instead of standard POS flow. Show Pre-Save Validation Preview before confirming. | Manual dropship entry |
| 6 | VenSynQ Command Center Page | Main React dashboard. Three panels: Connected Channels (cards), Pending Fulfillment Table (inline tracking input), Action Bar (Sync Tracking + Fetch Orders buttons). Wire `GET /vensynq` and `POST /vensynq/sync-tracking` Inertia endpoints. | Client daily workflow |
| 7 | JIT Draft Section in Purchases | Add "JIT Drafts — Action Required" tab to Purchases page. Filter: `is_jit=true AND approval_status=draft`. Show inline editable cost field and supplier selector per row. Approve button calls `PATCH /purchases/{id}/approve` which sets `approval_status=approved` and updates `financial_reconciled` on the linked sale if all its drafts are now approved. | Profit accuracy |
| 8 | financial_reconciled Dashboard Signal | On the main VenQore dashboard, wrap any profit/margin figure derived from a VenSynQ sale with a visual indicator. Show a clock icon and "Estimated" label while `financial_reconciled=false`. Switch to a checkmark and the confirmed figure once true. | Accounting trust |

> **TIP:** Phase 1 alone is a fully shippable, sellable product. Clients can pay $5/channel/month from day one while Phase 3 is being built in the background.

---

## 5. Phase 2 — File Upload Bridge (Corrected Parsers)

The original plan had incorrect column mappings and missed the FBA detection issue. These are the corrected parsers for each platform.

The parser for each platform outputs a `NormalizedOrderItem` object. This is the **same contract** that the Phase 3 API response will output after normalisation. The `SmartFulfillmentService` from Phase 1 runs on this object without any modification.

### 5.1 Amazon Parser — Corrected

| Our Internal Field | Amazon Column to Read | Correction vs Original Plan |
|---|---|---|
| `sku` | `sku` | Correct in original |
| `quantity` | `quantity-purchased` | Correct in original |
| `sale_price` | `item-price` | Correct — requires the custom report with financial columns added |
| `platform_fee` | `null` in Phase 2 | No fee column in order export. Use `fee_percentage` estimate. Phase 3 API provides exact fee. |
| `fulfillment_type` | **`fulfilled-by` column** | **CRITICAL FIX:** Original plan used `ship-service-level` which does NOT distinguish FBA from FBM. The `fulfilled-by` column returns `"Amazon"` for FBA or `"Merchant"` for FBM. This column must be added to the custom Amazon report. Without it, FBA orders will incorrectly deduct home warehouse stock. |
| `channel_order_id` | `order-id` | Correct in original |
| `currency` | `currency` | Must be added to custom report. Required for international sellers. |

### 5.2 TikTok Parser — Corrected

| Our Internal Field | TikTok Column to Read | Notes |
|---|---|---|
| `sku` | `Seller SKU` | Correct |
| `quantity` | `Quantity` | Correct |
| `sale_price` | `SKU Subtotal After Discount` | Correct — actual buyer payment |
| `platform_fee` | `SKU Platform Discount` | **Partial.** Platform discount ≠ TikTok commission. This is what TikTok subsidizes on seller behalf. Actual TikTok commission (typically 2–8%) is not in order export. Use `fee_percentage` estimate and label as estimated. |
| `fulfillment_type` | Always `fbm` for TikTok Shop UK | TikTok does not have FBA-equivalent in UK. All orders are seller-fulfilled. Set `fbm` by default. |
| `channel_order_id` | `Order ID` column | Verify exact column name from actual export header |

### 5.3 eBay Parser — Corrected

| Our Internal Field | eBay Column to Read | Correction vs Original Plan |
|---|---|---|
| `sku` | `Custom label` | Correct |
| `quantity` | `Quantity` | Correct |
| `sale_price` | `Sold for` | Correct |
| `platform_fee` | `Additional fee` column | **CRITICAL FIX:** The `Additional fee` column in eBay order exports does **NOT** contain the Final Value Fee (FVF), which is eBay's primary commission (typically 12–15%). FVF only appears in the Financial Transactions Report under Payments in Seller Hub. In Phase 2, use `fee_percentage` estimate. In Phase 3, the API provides exact fees via the Financial API. |
| `fulfillment_type` | Always `fbm` | eBay has no FBA equivalent. All orders are seller-fulfilled. |
| `channel_order_id` | `Order number` | Verify exact column name |

---

## 6. Phase 3 — Live API Automation (Corrected Architecture)

### 6.1 Token Lifecycle Management — The Missing Piece

The original plan said tokens are stored and it "just works forever." This is wrong and will cause silent failures in production.

| Platform | Access Token Lifespan | Refresh Token Lifespan | Risk if Not Handled |
|---|---|---|---|
| Amazon SP-API | 1 hour | Up to 1 year (rotates) | Cron job fails silently every hour. Client sees no data after 7am. |
| TikTok Shop | 30 days | 90 days | After 90 days of no use, client is permanently disconnected with no warning. |
| eBay | 2 hours | 18 months | Cron fails after 2 hours if refresh not implemented. |

**Required:** Build a separate `TokenRefreshJob` that runs every 30 minutes independent of the sync cron. It checks `access_token_expires_at` for all connected channels. If expiry is within 15 minutes, it proactively calls the platform refresh endpoint and updates `oauth_access_token` and `access_token_expires_at`. If the refresh fails (e.g. refresh token also expired), it sets `is_connected=false`, `sync_status=error`, and sends a notification to the tenant admin with a one-click reconnect link.

### 6.2 Corrected Cron Job Timing

The original plan scheduled the cron at midnight. This is the wrong time. Dropshippers need to see their orders before they leave for the wholesale market.

| Job | Correct Time | Reason |
|---|---|---|
| `VenSynQSyncJob` (order fetch + invoice creation) | **6:00 AM** | Client wakes up, sees all orders from yesterday, can head to market with accurate JIT quantities |
| `TokenRefreshJob` | Every 30 minutes | Proactively refreshes access tokens before expiry |
| `TokenHealthCheckJob` | Daily at 5:50 AM | Runs 10 minutes before sync. If any channel token is unhealthy, sends alert email to tenant. Sync skips unhealthy channels gracefully rather than crashing. |
| `ReconciliationReminderJob` | Daily at 10:00 AM | Checks for sales where `financial_reconciled=false` and JIT drafts are still in draft status from more than 24 hours ago. Sends in-app notification: "You have X supplier costs to confirm." |

### 6.3 The Sync Job Step-by-Step

Each channel runs in an isolated try-catch so one failed channel does not stop others.

1. Load all `ecommerce_channels` where `is_connected=true` and `sync_status != syncing`.
2. Set `sync_status=syncing` for all loaded channels.
3. For each channel, run inside isolated try-catch:
   1. Call platform API for orders with status "shipped" or "fulfilled" in the last **25 hours** (not 24 — to catch edge cases around DST and server clock drift).
   2. For each order returned, check if a sale already exists for `tenant + channel + channel_order_id`. Skip if exists (duplicate protection).
   3. Normalize API response into `NormalizedOrderItem` objects using the platform-specific adapter.
   4. For FBA orders: set `fulfillment_type=fba`. For FBM/JIT: set based on `channel.default_fulfillment_type`.
   5. For platform fees: use exact fee from API response (not estimate). Set `fee_source=api_exact` and `gross_platform_fee=exact amount`.
   6. Call `SmartFulfillmentService::processDropshipSale()` with the normalized items.
   7. On success: set `sync_status=idle`, `last_synced_at=now()`, clear `sync_error_message`.
   8. On catch: set `sync_status=error`, `sync_error_message=exception message`. Do NOT retry automatically. Show error in channel card UI. Send alert to tenant admin.

### 6.4 Tracking Sync — Corrected Endpoints

| Platform | Endpoint | Key Fields to Send | Notes |
|---|---|---|---|
| Amazon SP-API | `POST /orders/v0/orders/{orderId}/shipment` | `marketplaceId`, `fulfillmentDate`, `carrierCode`, `carrierName`, `shippingMethod`, `shipperTrackingNumber` | Requires Seller ID header. Amazon validates `carrierCode` against their approved list. |
| TikTok Shop | `POST /api/logistics/shipping/update` | `order_id`, `package_id`, `tracking_number`, `shipping_provider_id` | `shipping_provider_id` must match TikTok's provider list, not a free-text carrier name. Build a mapping table: Evri → TikTok provider ID, Royal Mail → TikTok provider ID. |
| eBay | `POST /sell/fulfillment/v1/order/{orderId}/shippingFulfillment` | `lineItems` array, `shippedDate`, `shippingCarrierCode`, `trackingNumber` | `shippingCarrierCode` must use eBay's carrier enum values, not free text. |

> **Carrier Mapping Required:** All three platforms use their own internal carrier code systems. Build a `carrier_mappings` config file that translates the client's free-text input (Royal Mail, Evri, DPD) to the correct platform-specific codes before calling the API. Without this, tracking sync will fail with validation errors on every push.

---

## 7. OAuth Connection Flow — Complete

### 7.1 Developer Registration (One-Time — You Do This)

| Platform | Where to Register | What You Get | Time Estimate |
|---|---|---|---|
| Amazon SP-API | developer.amazonservices.com → Register as Developer | App Client ID, Client Secret, IAM ARN | 1–3 days for approval |
| TikTok Shop | partner.tiktokshop.com → Become a Partner | App Key, App Secret | 3–7 days review |
| eBay | developer.ebay.com → Register App | App ID (Client ID), Cert ID (Client Secret), Dev ID | 1–2 days |

### 7.2 The 3-Click Seamless Connection Flow

**Click 1 — Select the Channel**

Client goes to the VenSynQ Settings panel. They see a grid of marketplace platforms with large logos. They click "Connect Store" next to their desired platform.

**Click 2 — Grant Official Permissions**

VenQore redirects them to the marketplace's official authorization page. The client approves VenSynQ's permissions. They click "Authorize".

> Behind the scenes: the marketplace appends an authorization code to the redirect URL. The Laravel backend automatically swaps it for a secure Access Token and a long-term Refresh Token. Both stored encrypted via Laravel's `encrypt()` helper (uses `APP_KEY`). Never stored in plaintext. Never logged.

**Click 3 — Confirm and Route Settings**

Client is redirected back to a success page inside VenQore. They answer two questions:

| Question | UI Element | Stored In |
|---|---|---|
| Which warehouse should fulfill FBM orders from this channel? | Dropdown of existing VenQore warehouse locations | `ecommerce_channels.warehouse_id` |
| Which expense category should we log platform fees under? | Dropdown of existing expense accounts + option to auto-create new one named "[Channel Name] Fees" | `ecommerce_channels.expense_account_id` |

They click "Save & Activate". Channel card turns green with a "Live Sync Active" badge.

### 7.3 The Three Backend Routes Required

```
GET  /vensynq/connect/{platform}      — builds auth URL, redirects to platform
GET  /vensynq/callback/{platform}     — receives code, exchanges for tokens, stores encrypted, sets is_connected=true
DELETE /vensynq/channels/{id}/disconnect — revokes token with platform, clears tokens, sets is_connected=false
```

### 7.4 Automatic Token Refresh (Silent, Background)

Because `oauth_refresh_token` and `refresh_token_expires_at` are stored separately, the `TokenRefreshJob` running every 30 minutes can silently get a new `oauth_access_token` without any input from the client. The client never has to log in again unless their refresh token expires (90 days for TikTok, 18 months for eBay, up to 1 year for Amazon).

When a refresh token expires: set `is_connected=false`, `sync_status=error`, email client with a one-click reconnect URL.

---

## 8. Phase 4 — VenSynQ OmniChat (Do Not Build Yet)

> **BLOCKED — TikTok ISV Requirement**
>
> TikTok Shop messaging API access is restricted to approved **Independent Software Vendors (ISVs)**. This requires a formal application to TikTok's partner program with proof of existing client base and a review process that can take weeks to months. You cannot access buyer messages via TikTok API as a standard developer. **Do not promise this feature to clients until ISV status is confirmed.**

### What CAN be built without ISV status:

- **eBay Messaging API** — Available to all registered developers. Can fetch and reply to buyer messages. Build this first as it has no approval gating.
- **Amazon Buyer-Seller Messaging** — Available via SP-API Messaging API. Limited to pre-approved message templates. Cannot send arbitrary text.
- **Amazon email relay** — The encrypted buyer email (`marketplace.amazon.co.uk` address) can be displayed inside VenQore. Client replies via their own email client.

**Recommendation:** Build Phase 4 only after ISV status is granted for TikTok. Build eBay messaging first as a proof of concept.

---

## 9. Complete Build Order — Master Sequence

| Week | Deliverable | Key Tasks | Shippable? |
|---|---|---|---|
| 1 | Database + Service Layer | Run all 3 migrations. Build `EcommerceChannel` model. Build `SmartFulfillmentService` with all 3 fulfillment types. Write unit tests for fbm/fba/jit paths. Add unique index. | No (backend only) |
| 1–2 | Channel Setup UI + Manual Entry | Channel creation form in React. Modify sale creation form with dropship toggle, channel selector, Pre-Save Validation Preview. Wire `SmartFulfillmentService` to sale submit. | ✅ Yes — Phase 1 Alpha |
| 2 | Command Center + JIT Drafts | VenSynQ Command Center page (3 panels). JIT Drafts tab in Purchases. `financial_reconciled` dashboard signal. Local Sync Tracking button. | ✅ Yes — Phase 1 Complete |
| 3 | File Upload Bridge | Build Amazon, TikTok, eBay file parsers with corrected column mappings. Include `fulfilled-by` column for FBA detection. Parser outputs `NormalizedOrderItem`, runs `SmartFulfillmentService`. | ✅ Yes — Phase 2 |
| 4 | TokenRefreshJob + OAuth Flows | Register developer accounts on all 3 platforms. Build OAuth initiate/callback/disconnect routes. Build `TokenRefreshJob` and `TokenHealthCheckJob`. Store encrypted tokens. | No (API backend only) |
| 5 | Live API Sync Cron | Build `VenSynQSyncJob` with per-channel try-catch isolation. Wire to 6AM scheduler. Build platform adapters for Amazon SP-API, TikTok Shop API, eBay Fulfillment API. Test with real sandbox accounts. | ✅ Yes — Phase 3 Alpha |
| 6 | Tracking Push + Polish | Build `carrier_mappings` config. Wire Sync Tracking button to async API dispatch jobs. Build `ReconciliationReminderJob`. Add `sync_status`/error display to channel cards. End-to-end testing. | ✅ Yes — Phase 3 Complete |

> **IMPORTANT:** Every line of code written in Phase 1 is permanent and directly used in Phase 3. Nothing gets deleted or rewritten. The API simply becomes the data source instead of manual entry.

---

## 10. Revenue Model

| Client Setup | Monthly Extra MRR | Annual Extra MRR |
|---|---|---|
| 1 channel (1 Amazon FBM) | $5 | $60 |
| 2 channels (Amazon + TikTok) | $10 | $120 |
| 3 channels (Amazon + TikTok + eBay) | $15 | $180 |
| 4 channels (2 Amazon stores + TikTok + eBay) | $20 | $240 |
| Power seller (5+ channels) | $25+ | $300+ |

Phase 1 alone (manual mode) is fully sellable. Clients can pay the $5/channel/month from day one while Phase 3 is being built in the background. This generates revenue before API work is complete. Once their inventory and accounting are synced inside VenSynQ, they will not cancel.

---

*VenSynQ — Corrected Master Plan · Every line written in Phase 1 is permanent and used in Phase 3. No throwaway code.*
