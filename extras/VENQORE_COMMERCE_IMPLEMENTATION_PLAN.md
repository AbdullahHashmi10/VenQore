# VenQore Commerce — storefront-to-ERP implementation plan

Prepared 2 October 2026. Status: proposed feature plan; no application changes made or runtime tests executed.

Scope/timeline update: use [VENQORE_COMMERCE_MASTER_ROADMAP.md](VENQORE_COMMERCE_MASTER_ROADMAP.md) for the owner's clarified country/city directory MVP, online percentage pricing and MVP → Version 1 → Version 2 → Version 3 delivery sequence. This earlier document remains technical audit/background material; its release scope and dates are superseded.

This is a separate plan for the storefront feature requested by the owner. It does not replace or renumber the existing technical build plan. Stage labels below belong only to this feature.

## 1. Delivery recommendation and estimates

Build a free, mobile-friendly storefront for each eligible VenQore merchant. Customers order from that merchant; staff receive and fulfil orders inside VenQore. Use the existing product, stock and accounting core. Add cross-store discovery after the individual stores work reliably.

Planning basis: one experienced developer working 30–40 focused hours/week, with AI assistance, prompt merchant feedback and an available staging environment. Estimates include implementation and focused verification, not just generated code. They are engineering judgment, not measured historical throughput. Release infrastructure repairs and unrelated POS work are separate dependencies.

| Outcome | Estimated elapsed time from a dedicated start |
|---|---|
| Attractive catalogue/setup demonstration | 2–3 weeks; no promise of safe ordering |
| Functional internal end-to-end alpha | 4–6 weeks; still requires hardening |
| Production pilot and evaluation | 8–12 weeks, including a two-week merchant pilot and normal contingency |
| Part-time delivery at 15–20 hours/week | Approximately 16–24 weeks |
| Two complementary experienced developers | Approximately 6–9 weeks; shared inventory work and pilot time limit parallel speedup |

Budget approximately 30–41 engineering days before the pilot, then two calendar weeks of merchant use. Reserve capacity toward the upper end for inventory reconciliation and edge cases. The first stage must re-estimate remaining work once the actual database, queues and deployment state are verified.

Future increments, assuming the storefront core is stable: focused marketplace discovery 4–6 additional weeks; service profiles and scheduled bookings 6–10 additional weeks; dedicated consumer mobile app 8–12 additional weeks. These are separate scope estimates, not a promise that the full network ships in three months. Urgent service dispatch, advertising and platform-managed payments need their own plans. A mature network is a 6–12+ month programme for a small team, with adoption and operational readiness determining pace.

## 2. Discovery evidence and reuse boundaries

Active application: `app-code/main-app`. Do not implement in archived copies or `production-clean-repo`. Composer requires Laravel ^12.0. Root README's Laravel 11 description is stale relative to Composer and CLAUDE.md.

| Existing source | Finding and implementation implication |
|---|---|
| `app-code/main-app/app/Http/Controllers/OnlineStoreController.php:11` | `index()` renders empty store data/stats; `update()` is unimplemented. This is a navigation/UI starting point, not a working commerce backend. |
| `app-code/main-app/resources/js/Pages/OnlineStore/OnlineStore.jsx:16` | Store enabled state is local React state. Replace it with validated persisted settings and real preview/publish behavior. |
| `app-code/main-app/routes/web.php:2293` | Existing online-store manager routes; confirm surrounding middleware before extending. |
| `app-code/main-app/app/Engines/SaleService.php:75` | Actual API: `post(array $data): object`. Existing tenant-bound posting, transactions, idempotency and FIFO/accounting behavior are the intended posting integration boundary. Verify payload and payment semantics before use. |
| `app-code/main-app/app/Http/Controllers/V3/SalesOrderController.php:108` | Conversion example calls the canonical sale engine at line 166. Use as a payload/reference pattern; do not expose this authenticated controller to shoppers. |
| `app-code/main-app/app/Http/Controllers/SalesOrderController.php:108` | Legacy pre-sales use item reservations. Its conversion at line 437 has a separate manual posting path. Do not copy that financial path into commerce. |
| `app-code/main-app/app/Services/SmartCapture/TransactionBuilderService.php:866` | A different reservation representation uses `stocks.reserved_quantity`. Reconcile representations before promising available stock. |
| `app-code/main-app/app/Models/SalesOrder.php:34` | Model comment explicitly separates orders from posted ledger balances. Keep public orders non-financial until the defined posting event. |
| `app-code/main-app/app/Traits/HasTenant.php:54` | Tenant scope depends on request context. Public requests require an explicit storefront-to-tenant resolver and explicit tenant restrictions. |
| `app-code/main-app/app/Services/WooSync/WooOrderPoster.php:43` | `post(Tenant $tenant, array $payload): array` illustrates tenant-qualified locks and retry protection. It posts FIFO/accounting directly and skips unmatched SKUs; it is not an appropriate native checkout adapter to copy wholesale. |
| `CLAUDE.md`, `extras/PHASE_0_STATUS.md` | Hosting/queue claims conflict over time. Verify actual deployed configuration; do not infer live workers or Redis from installed packages. |
| `RELEASE_AND_DEPLOYMENT_POLICY.md` | Current policy records blocked release candidates and staging requirements. Public rollout depends on an approved exact deployment candidate. |

Allowed existing APIs: the sale engine above, existing canonical reversal/payment mechanisms after signature verification, tenant resolution patterns, and Laravel `DB::transaction`, `lockForUpdate`, queue dispatch after commit. New commerce service names below are proposed interfaces, not claimed existing APIs.

Posting parity gap: `app-code/main-app/app/Http/Controllers/PosSaleController.php:15` delegates to legacy `SaleController::store`, while legacy pre-sales conversion also performs its own posting. The new adapter should use the canonical engine, but existing POS is not proven to use that same writer. Include compatibility and shared-availability work across actual paths rather than assuming the engine's single-writer comment establishes runtime parity. V3 conversion is a payload example, not a ready-to-copy atomic order transition.

Existing test references to read in C0: `app-code/main-app/tests/tests/Feature/Money/PreSaleConversionTest.php`, `V3/SalesOrderTest.php`, `Reckoner/SaleServiceParityTest.php`, `Guardrails/OfflineSyncIdempotencyGuardTest.php`, `Security/ApiTenantResolverTest.php`, `Reports/CrossTenantReportLeakTest.php`, and `Hardening/LegacySalesPathsTest.php` (last six paths relative to that Feature directory).

Framework references: [Laravel 12 query builder and locking](https://laravel.com/docs/12.x/queries#pessimistic-locking), [Laravel 12 queues and transactions](https://laravel.com/framework/docs/12.x/queues#jobs-and-database-transactions). Confirm implementation against the installed lockfile, not another major version.

## 3. First release scope

Merchant: enable store, choose unique slug, upload logo/banner, set contact details and opening hours, select one fulfilment branch/warehouse, curate products, choose supported public prices, set pickup/delivery rules, preview and publish, share a link/QR, manage online orders and record actual payment.

Shopper: mobile catalogue, categories, search, product photos/details, supported variants, cart, guest checkout, pickup or merchant-arranged delivery, confirmation and secure order-status link. First release supports retail products with known stock and fixed units. Weighted products, bundles, recipes and complex variant configurations stay unpublished until their pricing/stock behavior is explicitly supported and tested.

Defaults: one merchant per cart; one currency per store; cash on delivery or pay at pickup; guest checkout; one curated storefront template; platform-domain path such as `/store/amd-outlets`. No DNS work is required for a path-based URL.

Basic storefront participation is free for eligible VenQore tenants. Eligibility and business subscription status remain distinct from paid ERP module permissions. Document suspension, existing-order handling and published URL behavior. Do not accidentally require the paid pre-sales entitlement just to receive a free storefront order.

Later: custom domains, consumer accounts/OTP, hosted merchant payments, promotions, global marketplace, service bookings, native app, courier integrations, ratings and advertising. No multi-seller checkout or VenQore custody of shopper funds in this release.

## 4. Architecture and data contracts

Keep this inside the Laravel monolith. Merchant pages use existing React/Inertia layouts, V6 design tokens and terminology helpers. Public pages have a separate lightweight shopper shell; use server-rendered catalogue metadata/content with React enhancements, or a tested existing SSR approach. Do not make a new microservice or app merely to publish a catalogue. Reuse managed media/storage patterns after checking upload security.

Proposed services: public store resolver; public catalogue query; checkout pricing; shared availability/reservation; order transitions; order-to-sale adapter; notifications. Each has an explicit tenant/store context. Resolve that context before constructing tenant-bound posting services, including in queued jobs. No public request supplies an authoritative tenant ID.

Proposed schema, finalized after discovery:

- `storefronts`: tenant, immutable store identity, unique slug, enabled/published state, public profile, currency, branch/warehouse, hours, fulfilment rules, version.
- `storefront_products`: storefront/product links, publication status, display text/media, price policy and supported variant mapping. Reference the existing product; do not duplicate its stock ledger.
- `commerce_orders` and items: tenant/store, opaque order ID, checkout idempotency key, customer contact/address, fulfilment method, immutable product/UOM/price/tax/delivery snapshots, currency, totals, order status, payment status, sales-order/sale references.
- Reservation representation: choose a single authority after auditing existing holds. Every hold includes tenant, warehouse, product/UOM, owner order, quantity and expiry. Avoid counting the same hold in both item reservations and `stocks.reserved_quantity`.
- Transition/audit records: actor, previous/new state, time, reason; notification/outbox delivery records. Enforce tenant-qualified unique checkout and sale-link constraints in the database.

Orders may link to an existing SalesOrder for ERP compatibility, but only through a shared service with proven invariants. Never create a second inventory or accounting engine. Separate public contact information from merchant staff accounts; verify customer identity before merging with an existing Party. Historical customer debt or internal notes must never appear in public checkout.

All totals are calculated on the server using the core money conventions. Validate published products, supported UOM, quantity bounds, public price, tax, currency, warehouse and delivery eligibility. Never trust totals submitted by the browser. Confirm revised prices with the shopper before placing an order; use versioned quotes with expiry. Snapshot prices so later catalogue edits do not change an existing order.

## 5. Order, inventory and payment behavior

Suggested order progression: pending confirmation → confirmed → preparing → ready for pickup / out for delivery → completed. Rejected, cancelled and expired are explicit terminal paths. Maintain payment status independently: unpaid → collected, with refund states only through the existing verified refund path. Define and enforce a transition matrix, actor permissions and audit reasons.

Recommended first-release posting event: pickup handover or confirmed delivery completion. Before this event, orders/holds do not create revenue or reduce physical stock. At the event, a transaction consumes that order's reservation and posts exactly one sale through `App\Engines\SaleService::post`. If engine semantics require an earlier dispatch posting, decide and test that explicitly during discovery; do not ship ambiguous recognition behavior.

COD is not cash received when the order is placed or dispatched. Record actual collection separately through canonical receipt/payment behavior; an unpaid completed sale uses the supported receivable behavior. Merchant fees, taxes and delivery charges must flow through verified core accounting rather than a manually assembled new journal. If completion fails, preserve the prior state and hold for retry; never silently mark an order completed.

Availability = sellable stock at the selected warehouse − all active reservations − configured safety buffer, floored at zero. Lock a consistent tenant/warehouse/product authority row for each item in sorted order; recompute availability and create the order/holds atomically. This must also work when no stock row exists. Cart browsing does not reserve stock. Pending orders have configurable acceptance expiry (pilot default 30 minutes); notify staff, show that deadline to shoppers, and release expired/rejected holds exactly once. Confirmed holds have a fulfilment deadline and escalation policy rather than indefinite silent retention.

POS, SmartCapture, existing pre-sales, stock adjustments, transfers and inbound online channels must honor the same reservation authority or explicitly reject conflicting changes. Consume a hold and deduct stock once at posting, without letting the order conflict with its own hold. Returns, partial fulfilment and substitutions are outside the initial public workflow; staff use an explicit supported cancellation/reorder or established sale-return process.

Offline caveat: server locking cannot protect against a disconnected POS selling cached stock. Choose a pilot policy before checkout goes live: use an allocated online warehouse/stock pool that offline POS cannot consume, or label orders as availability requests pending merchant confirmation. A safety buffer alone is not a correctness guarantee. Pause online ordering on stale inventory under a defined freshness rule. Proving offline reconnection and conflict behavior is a launch gate.

Use a stable client checkout UUID and database uniqueness for safe submission retries. Lock/version transitions so two staff cannot post the same order twice. Persist notification intent in the same transaction; send messages after commit with retries. A notification failure must not lose or duplicate an order. Status links use high-entropy revocable tokens, exclude PII from URLs and are non-indexable; public sequential order numbers alone never grant access.

## 6. Execution stages and acceptance criteria

### C0 — Discovery and contracts: 3–4 engineering days

Read the source references in section 2, current schema/migrations, actual active routes, warehouse/UOM/FIFO paths, existing payment/reversal APIs, POS/offline sync, permission and plan catalogs. Confirm current DB engine/version, cache/session drivers, scheduler/worker, storage, backups and staging deployment. Inspect existing SalesOrder/WooCommerce/tenant isolation tests. Deliver schema proposal, sale payload example, order/payment matrix, reservation reconciliation design, offline policy and wireframes. Record each actual API signature used.

Acceptance: an executable path is identified from public order to exactly one canonical sale/receipt, and conflicting reservation representations have a documented resolution. No assumed existing checkout/reservation API. Re-estimate all remaining stages. Do not modify the authoritative core plan.

### C1 — Store setup and publication: 4–5 days

Extend the real OnlineStore controller/page pattern with persistence, permissions, slug uniqueness, product curation, profile/media, hours, one warehouse, fulfilment settings, preview, publish/unpublish and QR/link sharing. Use the platform plan catalog for entitlement decisions, existing V6 tokens for staff UI, and public-specific branding controls.

Acceptance: reload preserves settings; unpublished stores/products are inaccessible publicly; two tenants cannot edit or view each other's settings; preview requires merchant permission; basic participation has no unintended paid pre-sales gate. Reject unsafe image types/oversized uploads and protect internal media.

### C2 — Shopper catalogue: 5–7 days

Build a cohesive mobile storefront: store header, categories/search, product cards, detail/variant selection, cart drawer/page, delivery/pickup information, visible opening status, loading/empty/out-of-stock states. Prefer stable product URLs and pagination. Selectively expose allowlisted public fields, never serialized full Product/Party models. Compress/resize images and lazy-load below the fold. Provide crawlable public titles/descriptions; prevent indexing private checkout/status pages.

Acceptance: complete keyboard and narrow-screen browsing, clear supported variant/UOM behavior, no internal cost/margin/stock supplier data, no unpublished product leaks, no cross-tenant media leakage. Target p75 LCP ≤2.5 seconds, INP ≤200 ms and CLS ≤0.1 when real field measurements become available; use mobile lab measurements as provisional evidence, not field proof.

### C3 — Safe checkout and shared reservations: 7–10 days

Implement the reviewed availability authority, reconcile/backfill existing holds tenant by tenant, and integrate competing server write paths. Use verified Laravel transaction/locking patterns. Add guest contact validation, price quote/version handling, branch-specific fulfilment, expiry, quantity limits, checkout deduplication and anti-abuse throttles. Public store resolver fails closed and always restricts published data to the resolved tenant.

Acceptance: two concurrent checkouts for the last unit yield at most one confirmed hold; online and connected POS cannot consume the same held unit; retry after a timeout returns the original order; stale price requires reconfirmation; cancellation/expiry cannot release a hold twice; reconciled reservations do not double count. Execute these on a production-like MySQL/MariaDB database, not SQLite alone. Offline policy is demonstrated with reconnect conflicts.

### C4 — Staff fulfilment and canonical posting: 5–7 days

Build Online Orders inbox, filters/new-order counts, order detail, permissioned transitions, reject/cancel reasons, pickup/delivery completion and payment collection. Adapt the verified V3 canonical sale payload rather than legacy manual posting. Ensure customer contact matching cannot expose another customer's history. Add invoice link only after posting and only with permitted access.

Acceptance: complete unpaid COD and paid-pickup scenarios; FIFO, balances, tax/delivery totals and cash/receivable match existing core reports; concurrent completion creates one sale; stock failure preserves the unposted order; reservation is consumed once; unrelated existing approval rules still apply. Storefront entitlement allows processing its orders without changing other paid module permissions.

### C5 — Notifications, security, operations and staging: 6–8 days

Start with in-app inbox and email where delivery is configured; SMS/WhatsApp require separately chosen providers and budgets. Add after-commit delivery, retries/dead-letter visibility, failed-order diagnostics, reservation cleanup and reconciliation reports. Test public tenant resolution, enumeration, malicious input, spam/order flooding, CSRF/session boundaries, price tampering and secure links. Add tenant rollout flags and a checkout kill switch that preserves existing orders. Confirm worker/scheduler reality and alert if cleanup or notification jobs stop.

Acceptance: integration/regression suite passes; production-like concurrency and load checks pass at an agreed pilot traffic profile; accessible mobile checkout succeeds; backup restoration and forward-compatible migration/rollback are rehearsed; exact release candidate meets RELEASE_AND_DEPLOYMENT_POLICY. A rollback disables new checkout without deleting orders or financial records. Public availability must not rely on a delayed search index/cache at checkout.

### C6 — Merchant pilot: 2 calendar weeks

Start with 3–5 willing retail merchants with good catalogue data and the selected stock policy. Onboard each, curate products/photos and have them share their own store links. Provide a daily exception review during the pilot. Expand to 10–20 merchants only after the pilot gates pass.

Exit gate: no cross-tenant exposure, duplicate posting, reservation drift or known oversell defect; all completed pilot orders reconcile to stock and ledger; restart/timeout/expiry/offline cases are proven; order acceptance and fulfilment targets are met; merchants can publish and complete orders without developer intervention. Seek at least 50 genuine completed orders across merchants as a useful pilot sample, but extend the pilot if traffic is too low. Passing synthetic checks is not evidence of shopper demand.

## 7. Verification and operating metrics

Add meaningful tests for domain invariants and failure cases; do not spend time on tests that merely repeat JSX. Existing SalesOrder, WooCommerce, canonical posting and tenant tests provide starting patterns, not proof of commerce correctness. Run targeted tests while building and the full relevant finance/inventory/permission regressions before pilot.

Required scenarios: cross-tenant product/order/media attempts; last-item races; simultaneous POS and checkout; existing pre-sale holds; different warehouses; price/tax/fee tampering; repeat submission; two staff completing; stock adjustment against holds; job retry/restart; expired/cancelled order release; sale-post transaction failure; unpaid COD; pickup payment; disabled store with outstanding orders; offline resync conflicts; worker/scheduler downtime.

Track activation, published-product completeness, catalogue→checkout→order conversion, completed/rejected/expired orders, merchant acceptance time, stock failures, repeat shoppers, fulfilment time, job failures and support effort. Record source=storefront on orders/sales so ERP reporting distinguishes the channel. Avoid PII in diagnostic logs. Evaluate marketplace investment using repeat ordering and merchant distribution results, not ERP signup counts alone.

## 8. Expansion sequence

M1 — Focused discovery, 4–6 additional weeks: opt-in searchable merchant/product index, store/category/location/price/fulfilment filters, public relevance rules and basic reporting/removal controls. Start in one area/category. Merchant-shared links continue to open that merchant's store. One seller per checkout. Availability is validated against the authoritative service, even if discovery uses an eventually consistent index. Success requires useful local supply and completed cross-store discovery purchases.

M2 — Services and appointments, 6–10 additional weeks: separate provider profile, service catalogue, service area/remote mode, staff calendars, duration/buffers, timezone rules, booking holds, cancel/reschedule and canonical job/invoice integration. Verify existing service APIs first. Prove overlapping bookings cannot claim the same provider/time slot. Do not force appointments into a product-cart inventory model. Urgent dispatch is a later extension with availability presence, expiry, first-accept locking and failed-job operations.

M3 — Consumer app, 8–12 additional weeks: consider after web repeat use justifies installation. Audit `app-code/mobile-app` before deciding reuse. Account identity, saved stores, reorder, tracking, push permissions and deep links; keep staff ERP capabilities permissioned. Cross-platform builds still require device tests and app-store review, whose timing is external.

M4 — Promotion and growth: define advertising inventory, labelled placements, targeting, budgets, billing and attribution after organic traffic exists. AI recommendations require trustworthy aggregated demand metrics and a privacy model. Do not promise ad revenue will pay for free storefront infrastructure before measuring it.

## 9. Practical work rhythm and decisions

For solo delivery, finish one vertical slice at a time: publish one product → browse → order → receive in ERP → complete → reconcile. Review progress weekly with a working demo and updated risk/estimate log. Freeze the pilot scope after C0. For two developers, one owns backend/reservations/posting, the other owns merchant/public UI; agree schemas and API contracts first. Both review the end-to-end financial path.

Decision defaults to validate in C0: retail first; one storefront fulfilment warehouse; guest checkout; platform path URL; merchant delivery/pickup; COD/pay at pickup; availability requests unless online stock can be safely allocated; no platform collection of funds; free basic participation. These allow planning now without blocking on optional preferences.

Main estimate risks: inconsistent reservations, incomplete product photos/UOM, offline stock behavior, payment/approval compatibility, unverified hosting workers and blocked deployment path. If C0 reveals wider inventory refactoring, allocate 1–3 extra engineering weeks and revise the release forecast. Repairing unrelated release infrastructure may also move the launch date; it is not included as hidden storefront effort.

First action when implementation is authorized: execute C0 and deliver the schema, exact posting/payment contracts, reservation strategy and pilot screens for review. No production deployment, package creation or application implementation is authorized by this planning document alone.
