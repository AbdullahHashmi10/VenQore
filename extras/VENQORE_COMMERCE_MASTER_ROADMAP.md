# VenQore Commerce — MVP to Version 3 master roadmap

Prepared: 2 October 2026. Status: proposed implementation roadmap, not implemented.

This is the current product-scope roadmap requested by the owner. It incorporates the clarified MVP: country → city → business → catalogue → cart → order → merchant fulfilment in VenQore. It supersedes the earlier commerce plan's scope and timing assumptions. The earlier `VENQORE_COMMERCE_IMPLEMENTATION_PLAN.md` remains a supporting source for the static code audit and financial/inventory contracts. Neither document replaces the existing authoritative ERP technical build plan.

## 1. Product commitment

Every release must let a real merchant publish and complete a real customer order. The first release is a public directory and ordering feature built inside VenQore. Later releases improve stores, add marketplace search, and introduce customer growth tools and services.

Basic storefront participation is free for eligible VenQore businesses. Existing business subscription rules still apply to the ERP; paid visibility is introduced later. A business should not need to buy the existing pre-sales module merely to receive its storefront orders.

Merchant journey: Online Store Setup → business details and location → publish selected existing products → choose online pricing → preview → publish → share link → receive order → confirm → prepare → hand over/deliver → record payment and complete sale.

Customer journey: choose country/city → browse businesses → open business → browse catalogue → add items → checkout as guest → receive confirmation → follow private order status → collect or receive goods.

Platform journey: enable eligible merchants → verify public profile → monitor orders/errors → suspend abusive listings if needed → support merchant → reconcile failures without changing ledger history manually.

## 2. Estimate and version boundaries

All estimates are engineering planning ranges, not measured AI throughput or guarantees. Basis: one experienced developer working approximately 30–40 focused hours/week with AI help, an available test/staging environment, timely decisions and merchant feedback. Parallel unrelated ERP repairs reduce available capacity. Pilot observation and external approvals add elapsed time even when coding is fast.

| Release | Added elapsed time | Cumulative target | Complete useful outcome |
|---|---|---|---|
| MVP | 6–8 weeks | Weeks 6–8 | Directory, public catalogues, pricing rules, guest cart/checkout, merchant orders and fulfilment |
| Version 1 | 8–10 weeks | Weeks 14–18, about month 4 | Polished stores, better catalogue navigation, fulfilment and stock reliability |
| Version 2 | 12–14 weeks | Weeks 26–32, about months 6–8 | Product/business search, accounts, comparisons and marketplace administration |
| Version 3 | 16–18 weeks | Weeks 42–50, about months 10–12 | Installable consumer experience, promotions, reviews, merchant payments and scheduled services |

These estimates support a roughly one-year programme. MVP has an approximately 3–4 week internal end-to-end milestone and a 6–8 week controlled pilot target. If shared inventory reconciliation or deployment repair expands, allow another 1–3 engineering weeks and publish a revised forecast. Broad public release follows successful pilot evidence, not a fixed date alone.

Version 3's 16–18 weeks assumes an installable web app/PWA and deliberately limited payment and booking workflows. A full native consumer app adds approximately 8–12 engineering weeks unless it replaces other scope or additional capacity is assigned. Urgent-service dispatch and platform-held multi-seller funds are separately scoped Version 4 candidates; including them all in a solo one-year commitment would be unreliable.

The earlier one-week discussion referred to a rough internal demonstration under favourable reuse assumptions. It is not a pilot-ready estimate. The earlier 2–4 week release claim did not allow adequately for the reservation/posting gaps found in this repository. This roadmap is the consolidated estimate for the specifically described complete workflow.

## 3. Documentation discovery and implementation sources

Implementation root: `app-code/main-app`. Avoid archives and production copies. Source line references reflect static inspection and must be checked again when work begins. No runtime test or live-host claim is made by this plan.

| Reference | Read/reuse purpose |
|---|---|
| `CLAUDE.md`; `extras/PHASE_0_STATUS.md` | Existing architecture, working rules and known contradictory hosting notes |
| `DESIGN-RULES.md`; `VENQORE_LAYOUT_LAW.md`; V6 token folder named in CLAUDE.md | Merchant shell design, shared values and layout contracts |
| `app-code/main-app/app/Http/Controllers/OnlineStoreController.php:11` | Existing placeholder manager controller; update currently unimplemented |
| `app-code/main-app/resources/js/Pages/OnlineStore/OnlineStore.jsx:16` | Existing manager page; local toggle is not persisted publication |
| `app-code/main-app/routes/web.php:2293` | Existing manager routes; inspect actual surrounding permissions |
| `app-code/main-app/app/Models/Product.php:22` | Product prices, tax-inclusion flag, unit and catalogue links |
| `app-code/main-app/app/Models/Product.php:70` | `variants()` relation; verify variant stock/posting support before public exposure |
| `app-code/main-app/app/Models/Tenant.php:87` | Existing country code; city registry and public business identity still need design |
| `app-code/main-app/app/Traits/HasTenant.php:54` | Context-driven tenant restrictions; public resolver must fail closed |
| `app-code/main-app/app/Engines/SaleService.php:75` | Existing `post(array $data): object`, intended new order-to-sale posting boundary |
| `app-code/main-app/app/Http/Controllers/V3/SalesOrderController.php:108` | Copy-ready sale payload example; conversion state must be hardened |
| `app-code/main-app/app/Http/Controllers/SalesOrderController.php:108` and `:437` | Legacy reservation and manual conversion path; audit differences, do not copy its writer |
| `app-code/main-app/app/Services/SmartCapture/TransactionBuilderService.php:866` | Different hold representation in `stocks.reserved_quantity`; reconcile before guaranteed availability |
| `app-code/main-app/app/Services/WooSync/WooOrderPoster.php:43` | Tenant-qualified retry/lock patterns; not a native checkout posting adapter |
| `app-code/main-app/app/Http/Controllers/PosSaleController.php:15` | Actual POS delegation to a legacy sale path; shared stock checks require parity work |
| `app-code/main-app/package.json:6` | Actual build, lint, theme and test scripts; verify runtime and baseline first |
| `RELEASE_AND_DEPLOYMENT_POLICY.md` | Exact-candidate staging/deployment gates; current recorded release blocks are launch dependencies |

Allowed existing APIs include the actual sale engine signature, Laravel transactions/row locking, existing tenant context and design/terminology helpers. Existing payment, refund, variant and service APIs require discovery before reuse. Names proposed below are new interfaces, not assertions that they exist already. Copy verified usage patterns and adapt their contracts; never infer correctness from a class comment alone.

Read existing tests under `app-code/main-app/tests/tests/Feature`: `Money/PreSaleConversionTest.php`, `V3/SalesOrderTest.php`, `Reckoner/SaleServiceParityTest.php`, `Guardrails/OfflineSyncIdempotencyGuardTest.php`, `Security/ApiTenantResolverTest.php`, `Reports/CrossTenantReportLeakTest.php`, `Hardening/LegacySalesPathsTest.php`. Confirm the active test configuration instead of treating these paths as a complete runner command.

Additional discovery for later releases (paths below relative to `app-code/main-app`):

- `app/Services/InvoiceAssistant/DraftPricingResolver.php:34`, `unitPrice(Product $p, ?ProductVariant $v): string`: existing base-price pattern uses a positive variant price before product price. Online percentage rules are new. `app/Support/Pricing.php` and `GeoPricingService.php` concern subscription pricing, not storefront item prices.
- `app/Engines/UomService.php:38`, `toBaseQty(string $productId, float $saleQty, string $saleUom): float`: existing convention is base quantity = sale quantity / factor. Reuse the real API; do not invent independent pack conversion. Read `tests/tests/Feature/V3/Scenarios/TaxAndUomServiceTest.php` before enabling additional units.
- `app/Models/CustomerAddress.php:13`: addresses exist, but relate to Customer whereas sales use Party. Public shopper identity mapping must be verified. Warehouse location is free text; normalized directory cities need a new controlled model.
- `app/Engines/ServiceEngine.php:31`, `createJob(array $data): ServiceJob`, and `app/Http/Controllers/ServiceJobController.php:190`, `quickBook(Request $request): RedirectResponse`: service scaffolding exists, but quickBook supplies scheduled start/end that engine creation does not persist. Normal controller creation separately updates those fields. Fix this through a verified shared service before online bookings.
- `app/Services/ServiceBillingService.php:77`, `invoiceJob(ServiceJob $job): object`: canonical billing candidate. Existing controller invoice conversion still calls a legacy engine path. Read `tests/tests/Feature/Module/ServiceOnlySaleTest.php`; verify billing parity/idempotency and add capacity/overlap locking before claiming confirmed time slots.

These are targeted static findings. Absence of an online-price or booking-lock API in these searches is not proof that no such code exists anywhere; recheck during the relevant implementation package.

## 4. MVP specification

### 4.1 Merchant setup and publication

One storefront per tenant initially. Configure public display name, unique URL slug, verified country/city, address, optional map reference, logo, contact details, opening hours/timezone, pickup/delivery, simple delivery instructions/flat charge, one fulfilment warehouse and one currency. Private tenant/account details are not automatically public.

Show existing products in a paginated selection table with publish switches, image/readiness indicators, public name/description override and online price preview. Allow bulk selection, bulk publication and unpublication. Require explicit merchant review; catalogue entries with unsupported units/variants or missing mandatory information remain unpublished with a clear reason. Use existing catalogue data without creating another inventory database.

Publish button validates the profile, supported products, pickup/delivery and pricing. Preview is private to authorized merchant staff. Unpublish removes the store from discovery and stops new checkout; staff can still finish outstanding orders and customers retain access to their own status links. A suspended merchant's behaviour must be explicit and preserve order records.

Share a public link and QR code. A merchant-shared URL opens that merchant directly. Country/city browsing is an alternative discovery path, not a mandatory detour.

### 4.2 Online pricing rules

Store default modes: same as regular retail price, percentage increase, percentage decrease. Per-product fixed online override takes precedence. MVP precedence: fixed product override → storefront percentage rule → regular retail price. Defer category discounts/coupons until Version 1 to avoid conflicting promotion rules.

Examples before applicable taxes/fees: base Rs. 1,000 and +10% gives Rs. 1,100; base Rs. 1,000 and −10% gives Rs. 900; fixed product override Rs. 1,050 remains Rs. 1,050 regardless of the default +10%. The storefront rule never overwrites the core retail price.

Use the existing core money representation and currency precision. Store percentage values precisely, with valid ranges; define rounding once. Preserve and test tax-inclusive versus exclusive prices rather than adding tax twice. Discounts below the core permitted cost/margin threshold require supported merchant approval at configuration or confirmation; public shoppers cannot approve them. Decide this contract before publishing discounted products.

Default percentage prices follow future core retail-price changes. Fixed overrides remain fixed until edited. Record which rule/base price produced an order line. Show bulk preview: normal price, rule, resulting online price and any publication error. Pricing updates invalidate public cached prices/quotes. At checkout, calculate all totals on the server; changed/expired quotes require shopper reconfirmation. Completed orders retain historical prices when products or rules change.

Delivery charge is separate from the product price. MVP has no product comparison claim that a marked-up storefront price is the merchant's counter price.

### 4.3 Country/city business directory

Create controlled country/city identifiers and merchant selection. Pilot cities are curated; avoid building a world geocoding system for the MVP. Display only approved/published businesses for the selected city, in a stable documented ordering with pagination. Country selection limits cities. Use store currency/timezone rather than inferring either from the visitor.

Business card: name, logo, address/city, opening status, pickup/delivery labels and Open Store. Empty city shows an honest empty state. No marketplace product search, categories, comparison engine or distance ranking in MVP. Location reflects business presence; it does not promise that delivery covers every city address.

### 4.4 Catalogue, cart and guest checkout

Store page: brand/contact, hours, fulfilment information and paginated catalogue/menu. Product: public title, image, description, online price and supported quantity selector. No categories or search in the MVP. Support fixed-unit stock retail products first; restaurant recipes/modifiers, weighed goods and complex variants require later proven adapters.

One merchant/currency per cart. Switching stores offers to replace the current cart instead of silently mixing merchants. Persist cart locally without trusting stored prices. Removed/unpublished products and price changes receive clear checkout messages. Cart totals include delivery and tax according to merchant configuration.

Guest checkout collects name, phone, pickup/delivery choice, delivery address only when needed and optional order note. Collect only operationally needed personal information. Payment choices: COD or pay at pickup; bank transfer is included only with an explicit verification workflow. A customer claiming a transfer does not mark an order paid automatically.

Submission creates one pending order with immutable snapshots and a stable idempotency key. Double-clicks and retry after timeouts return the same order. Confirmation has public order number, summary and secure status URL. Clearly state that availability requires merchant confirmation. Rate limits and order quantity caps prevent trivial public-form abuse.

### 4.5 Merchant order inbox and completion

Online Orders: New, Active, Completed, Cancelled/Rejected; details include customer contact, quantities, agreed prices, fulfilment, notes and timestamps. Staff permissions distinguish view, accept, cancel, complete and record payment. In-app alerts are required; email is optional where configured. External messaging providers are separately configured.

Order states: pending confirmation → confirmed → preparing → ready for pickup / out for delivery → completed. Rejected, expired and cancelled have reasons. Enforce allowed transitions with a locked/versioned order and audit records. Payment states are separate: unpaid, reported transfer, verified/collected, refunded where supported. Do not imply preparation means payment.

At handover/confirmed delivery, post one sale through the verified existing engine and link it to the order. Record real money received through the canonical receipt contract. COD before collection is not cash income. If posting fails, leave the order uncompleted and surface a retryable error. Cancellation before posting releases holds; post-sale refunds/returns follow existing verified reversal mechanisms, not deletion of history.

Customer status link shows their order/status and merchant contact without exposing account balances, staff details or other orders. Links use high-entropy revocable tokens and are non-indexable; a guessable order number alone grants no access.

### 4.6 MVP stock policy

Submission is an order request; cart browsing does not hold stock. On merchant confirmation, recheck current warehouse stock and other holds atomically, then reserve for that order. Release on cancellation/expiry; consume exactly once at sale posting. Define acceptance and fulfilment deadlines and clear messages. Reject unavailable lines/order with a reason rather than silently charging for substitutions. Partial fulfilment can wait until Version 1.

Existing legacy pre-sales, SmartCapture and V3 orders represent holds differently. Discover all active representations and choose one authoritative count, preventing double counting. At minimum, confirmation and sale completion must respect all existing holds and be atomic. No guarantee of available stock is permitted while competing POS paths ignore holds.

Offline pilot default: orders require availability confirmation, with merchant stock checking; use an allocated online stock pool where possible. Offline POS must not consume allocated stock. A safety buffer helps but cannot guarantee correctness. If a store cannot operate this policy, pause its checkout instead of promising inventory that a disconnected terminal can sell. Version 1 strengthens automation across all stock-consuming paths.

## 5. MVP architecture and proposed schema

Extend the existing Laravel/React/Inertia application. Staff use the existing shell, V6 tokens and terminology. Public pages use a small shopper shell with public allowlisted projections, server-visible catalogue metadata/content and React cart interactions. Verify existing SSR support before introducing infrastructure. Use current media/storage contracts after validating upload permissions and image processing.

Proposed tables: storefronts, controlled countries/cities, storefront_products, commerce_orders, commerce_order_items, commerce_order_events, notification/outbox records; reservation schema only after identifying the existing authoritative hold representation. Use foreign keys, tenant/store ownership and database unique constraints for slug, checkout idempotency and order→sale relationship. Add versioned forward migrations; preserve current tenants and historical orders.

Orders snapshot public item title/SKU/UOM, quantity, price-rule provenance, tax/currency, fees and fulfilment address. Existing product/warehouse IDs remain internal references. Public contact records are not blindly merged with historical Parties by phone/name; verify identity before granting access to old customer history.

Proposed responsibilities: public storefront resolver, directory query, catalogue query, pricing service, checkout service, shared reservation service, transition service, sale adapter and notification sender. All receive an explicit validated tenant/store context. Bind that context before constructing tenant-bound engine services; clear it between queue jobs. Reject tenant/warehouse authority supplied by the browser. Never serialize whole internal models to public pages.

Notification intent persists with the order transaction. Delivery happens after commit and has safe retries; notification failure never loses the order. Public listing/cache can be stale briefly, but checkout and confirmation use authoritative pricing/stock. Add publication cache invalidation, scheduler/worker monitoring and an order-intake kill switch.

## 6. MVP work packages

Discovery is first. Estimates total roughly 25–35 engineering days. Pilot observation overlaps final polish where safe; low customer traffic can extend elapsed pilot evaluation beyond week 8.

| Package | Effort | Implementation and references | Verification / guard |
|---|---|---|---|
| P0: contracts and baseline | 2–3 days | Read section 3; inspect actual schema, core money/receipt/hold APIs, live configuration and active test runner; deliver wireframes and order contracts | Exact posting/receipt signatures, hold authority and pilot stock policy documented; no assumed API |
| P1: schema, profile, location | 3–4 days | Extend OnlineStore controller/page and manager routes; add reviewed migrations, controlled city selection, eligibility and permissions | Persistence, slug/city integrity and cross-tenant edits tested; private profile fields never become public |
| P2: publication and prices | 3–4 days | Reuse Product price/tax/UOM patterns; product selection, readiness checks, bulk publication, percentage/fixed price rules and preview | +10%, −10%, override, inclusive tax, rounding, base price change and below-cost cases; no retail price overwrite |
| P3: public directory/catalogue | 3–4 days | Explicit public resolver/projection; country/city pages, cards, public storefront and pagination using verified UI tokens | Draft/suspended/unpublished content inaccessible; phone and keyboard use; no accidental product search/categories |
| P4: cart, checkout and status | 4–5 days | Pricing and checkout contracts; single-store cart, guest fields, quote changes, atomic order creation, tracking link | Duplicate retries, forged totals, wrong-tenant products, empty/address-invalid checkout and private status-link isolation |
| P5: fulfilment and posting | 5–7 days | V3 payload pattern plus actual SaleService/receipt APIs; order inbox, confirmation holds, transitions, fulfilment and payment | One sale/hold consumption under races; unpaid COD ledger, collected payment and cancel/reject reconciliation; no legacy manual writer copy |
| P6: hardening and pilot | 5–8 days | Existing finance/security/offline test patterns; notification retries, monitoring, staging, pilot onboarding and feedback | Relevant regression checks and concurrency database tests pass; actual release policy gates met; pilot orders reconcile |

Suggested cadence: week 1 baseline/profile; week 2 publication/pricing/directory; weeks 3–4 cart and internal full journey; weeks 4–6 fulfilment/financial verification; weeks 6–8 staging and pilot. This is a forecast, not a reason to skip a package when its acceptance criteria fail.

MVP pilot: 3–5 retail businesses in one country and a small city list, with good catalogue data and fixed-unit products. Merchants share their own links. Walk through publish → order → accept → fulfil → pay with each merchant. Track real completed orders, acceptance times, cancellations and support effort. Aim for at least 50 genuine completed orders across the pilot as useful evidence; extend observation if traffic is insufficient. Launch gates are no known tenant leak/duplicate posting/hold drift, all completed orders reconciling, restart/timeout cases passing, and staff completing without developer intervention.

## 7. Version 1 — polished stores and operations

Added estimate: 8–10 weeks. Keep all MVP workflows and data. Use pilot evidence to prioritize changes. Do not re-enter catalogues or replace historical order IDs.

| Workstream | Effort allocation | Build and verified starting references | Release proof / anti-pattern guard |
|---|---|---|---|
| Store experience | 1–2 weeks | Extend MVP shell; banners, announcements, featured products, accessible catalogue categories and within-store search | Public content filters enforced; coherent mobile navigation; no exposure of hidden products |
| Catalogue capability | 2 weeks | Product `variants()`, UOM/tax contracts, public adapter tests; variants and bulk publication/price tooling | Real variant maps to correct stock/posting identity; unsupported recipes/weighted items still blocked |
| Delivery and fulfilment | 1–2 weeks | Existing warehouse/receipt/order contracts; serviceable delivery zones, fees/minimum orders, prep estimates, business hours, print integration | Fees reconcile, invalid addresses rejected, timezone hours tested; no promise of platform-arranged courier |
| Inventory reliability | 2–3 weeks | Reservation paths and actual POS/SmartCapture/pre-sales/channel writers in section 3 | Shared availability under online/POS/transfer/adjustment races; reconcile pre-existing holds before cutover; offline tests |
| Customer convenience and analytics | 1 week | MVP tokens/orders/events; saved device cart, secure reorder, stage metrics and retrying alerts | Reorder reprices/rechecks stock; shared-device privacy; analytics never alter ledger totals |

Fit workstreams within the 8–10 week release budget using a fixed priority backlog. Complex products and stock parity can consume contingency; publish a revised forecast if they cannot fit. Receipt printing reuses current print settings and templates, with the existing thermal/full-page regressions.

Promotions: add dated store/product offers with an explicit precedence over Version 1 defaults, timezone boundaries and immutable order snapshots. Keep store-level price previews. Partial fulfilment/substitutions require customer approval, accurate totals and stock/receipt behavior; ship only after tested, otherwise retain cancellation/reorder.

Version 1 exit: merchant operations work without engineering help, checkout errors are visible/recoverable, online/counter inventory conflicts are controlled under the declared policy, and the pilot produces repeat ordering. Free commerce permission remains distinct from unrelated ERP module gating.

## 8. Version 2 — searchable marketplace

Added estimate: 12–14 weeks. Add searchable discovery on top of existing store/order APIs; retain country/city browsing and merchant-direct links.

| Workstream | Allocation | Build / references to verify | Acceptance / guard |
|---|---|---|---|
| Search/catalogue index | 3 weeks | Version 1 public catalogue and publication events; normalized categories/attributes, store-name/product search, indexing and rebuild jobs | Unpublish/suspend removes visibility; tenant boundaries hold; stale results cannot bypass live checkout checks |
| Discovery/filter UI | 2 weeks | Existing public shell; city/category/price/open/pickup/delivery filters; relevance rules and pagination | Currency/pack-size comparability explicit; missing location not falsely ranked; one merchant per cart |
| Consumer identity | 2–3 weeks | Discover existing OTP/auth API signatures; separate shopper identity, addresses, history, favourites and reorder | Guests remain supported; verify linking guest orders to accounts; no merchant-account/Party-history takeover |
| Governance/admin | 2 weeks | Discover actual platform-admin permissions; merchant verification, reports, suspension and moderation queue | Auditable actions, user reporting, clear policy states; public merchant labels truthful |
| Insights/load/pilot | 3–4 weeks | Order/events and existing infrastructure; conversion/search reporting, larger data tests and focused-area rollout | Search works at agreed scale; privacy-safe metrics; useful cross-store purchases measured |

Search result: product/store, online price/currency/UOM, city, pickup/delivery/open status and factual availability label. Similar items are not automatically treated as identical; product matching must use verified identifiers/attributes before claiming exact price comparison. A single seller handles each order and fulfilment.

Account workflow: optional verify/sign in → save address → buy using existing checkout → view only owned orders → reorder at current prices. Notifications reuse the existing order events. Verification provider choice/rate limits and message costs are explicit dependencies; do not hard-code an assumed provider.

Indexing may begin with database-backed search adequate for measured traffic. Select an external engine only after testing the supported version/infrastructure and documenting costs. Do not mandate Redis or new hosting because a package is installed. Formalize ranking rules and protect organic results from manipulation.

Version 2 exit: participating merchants have adequate local supply, search leads to completed orders, identity/security tests pass, moderated reports have an operator, and merchant-shared traffic still goes directly to that merchant. ERP signup totals alone do not prove marketplace usefulness.

## 9. Version 3 — first-year commerce network

Added estimate: 16–18 weeks for bounded workstreams below. Reconfirm priorities against Version 2 usage. Maximum scope is a focused first implementation in each stream, not every Amazon/Uber feature.

| Workstream | Allocation | Complete workflow / reference discovery | Acceptance / guard |
|---|---|---|---|
| Consumer PWA | 3 weeks | Audit `app-code/mobile-app` and supported web install/push patterns; install → discover → order → receive status → reorder | Device/browser tests; deep links and logout privacy; offline cache never accepts stale checkout prices |
| Promotions | 3 weeks | Existing merchant/order/events; campaign → budget/payment → labelled placement → attribution → report | Budget/spend limits under concurrency, auditable refunds/credits, sponsored labels; isolate ad billing from merchant sale ledger |
| Reviews/trust | 2 weeks | Verified completed orders and moderation; eligible shopper → review → merchant reply → report/moderate | One permitted review per eligible transaction policy, no review forgery; operator-backed complaints process |
| Merchant online payments | 3–4 weeks | Chosen gateway's current official docs and existing receipt/refund contracts; checkout → gateway → signed callback → receipt → refund/reconcile | Verify amount/currency/tenant, duplicate/out-of-order callback, delayed success, timeout and refund cases; no platform-held split settlement |
| Scheduled services | 3–4 weeks | Discover real service/job/invoice and staff-calendar APIs; provider profile → service/slot → booking → confirmation → job → invoice/payment | Appointment duration, buffers, timezone, no overlapping slots, reschedule/cancel/retry; table seating reservations are not assumed service calendars |
| Recommendations/integration pilot | 2 weeks | Version 2 privacy-safe marketplace metrics and actual ERP queries; merchant insight → review suggestion → approve action → measure | Suggestions show source/limits; no automatic price/publication changes or other-merchant private data |

Pick one initial payment provider/market and one initial service booking model. Gateway onboarding, app-store review, message verification and merchant response times are external dependencies; approval delays are not coding estimates. Services have local/on-site, remote or either modes and appropriate service areas. Unavailable providers cannot receive an appointment simply because a product stock row exists.

Version 3 exit: all inherited order/ledger invariants pass; each new workflow has real pilot usage; support/moderation responsibilities are staffed; gateway receipts reconcile; booking calendars prevent collisions; campaign budgets cannot overrun through retries; optional recommendations require merchant acceptance.

## 10. Optional Version 4 — separately estimated extensions

Do not promise these inside the one-year solo scope without trading out Version 3 features:

- Native shopper app: roughly 8–12 additional engineering weeks after auditing mobile code; store-review time extra. Reuse commerce/identity APIs and permissions; test real devices.
- Urgent service dispatch: roughly 6–10 additional weeks for request→eligible available nearby providers→first accepted provider→job→completion. Requires location/presence consent, request expiry, acceptance locking, safety/support policies and failure escalation.
- Platform-arranged courier delivery: estimate after a chosen provider and coverage audit; includes booking, tracking, failed deliveries, reconciliation and operating support.
- VenQore-held funds/multi-seller checkout: no credible estimate before settlement, provider, jurisdiction and operating model are decided. Requires a separate design and current provider/legal verification.
- Supplier/B2B network: separately scope verified suppliers, catalogue imports and linked purchase-order workflows; never assume a shopper cart creates a compliant supplier purchase automatically.

## 11. Cross-version verification and migration discipline

Tests protect domain failures: wrong-tenant catalogue/media/order requests; manipulated prices/taxes/delivery; idempotent checkout; concurrent order completion; reservation consumption/release; real MySQL/MariaDB last-item races; actual offline sync; unpaid COD and received payment; failing notification jobs; disabled store with outstanding orders. Later add variant/UOM, search index, account ownership, callback signatures, booking overlap and campaign budget cases.

Use meaningful backend integration tests and focused cart/checkout/transition UI tests. Compare order completion against stock, FIFO/COGS, ledger, cash/receivables and existing reports. Read core test patterns before writing assertions; avoid tests that simply mirror markup. SQLite success alone is not concurrency proof.

Verification commands are selected from the actual project scripts/test configuration. Baseline failures are recorded separately; run affected tests while building, then relevant finance/inventory/permission/offline regressions plus frontend lint/build/theme checks before release. Review migrations on a protected production-like staging copy, validate the exact candidate under RELEASE_AND_DEPLOYMENT_POLICY and rehearse recovery. This plan does not authorize live deployment.

Upgrade rule: retain storefront IDs/slugs, published links, order snapshots, checkout idempotency keys and sale relationships. Add backward-compatible schema first, backfill scoped data with reconciliation, deploy new readers/writers behind flags, then enable per cohort. Rollback stops new intake/features while preserving completed transactions and status access. Never retroactively recalculate order prices, delete financial history or blindly rewrite recorded migrations.

Metrics: stores enabled/published, profile/product readiness, catalogue views, cart/checkouts, submitted/accepted/completed/cancelled orders, stock failures, time to accept/fulfil, job failures and merchant support effort. Later measure repeat shoppers and cross-store discovery purchases. Keep PII out of logs and publish a retention/access policy appropriate to real order handling.

## 12. How Codex would implement this with the owner

I can inspect the repository, create migrations/models/services/controllers, build staff and public screens, implement price rules/cart/order states, integrate existing stock/accounting APIs, write meaningful tests, run available checks and prepare reviewable deployment instructions. Work happens in active sessions; this document does not establish continuous background execution.

Execution cycle: read current status and applicable instructions → check actual working-tree changes → define a small acceptance-tested task → implement → run targeted checks → show a working result and evidence → update progress and risks → continue to the next dependent task. Preserve unrelated edits. Commit/PR/deployment are separate actions governed by user scope and repository policy.

First implementation session: verify P0 contracts and baseline, confirm the location/price/stock decisions, then build the first safe slice (merchant profile and persistent publication settings) where dependencies permit. The first end-to-end slice uses one store, one fixed-unit product, one guest order and one verified completion; broaden only after its stock/ledger assertions pass.

Do not give a guaranteed number of Codex hours from calendar developer estimates. There is no measured completion rate for this project's commerce work. AI can accelerate code and UI drafts, but debugging real stock/posting paths, provider setup, testing, staging and pilot observation remain work. After the first 2–3 substantial implementation sessions, record actual tasks/checks completed and produce a throughput-based forecast. Translate that forecast into weeks using the owner's actual session availability, rather than pretending Codex works 40 unattended hours/week.

Owner inputs: choose pilot merchants/cities, ensure catalogue photos are usable, confirm merchant fulfilment/payment policies, supply staging/provider access when required, review real screens and coordinate pilot feedback. Codex handles technical work within authorized scope; external merchant onboarding and live service approvals need the relevant people.

Use workstream ownership when parallel agents are explicitly authorized: backend/stock/posting, public/merchant UI, and verification/integration. Agree shared schema/contracts first; multiple agents cannot eliminate serial posting decisions or real pilot waiting. More agents do not imply a proportional reduction in dates.

## 13. Progress ledger and handoff template

Current state: roadmap written; earlier static core audit available; no commerce application implementation or runtime verification completed.

For every package, maintain: status (not started/in progress/verified/blocked), owned files, actual APIs used, implementation summary, tests and exact results, migration considerations, remaining failure cases, next task and revised effort. Mark verified only when acceptance criteria pass. Each later chat resumes from this ledger and the current source rather than treating the roadmap as proof of implementation.

Release decision record: version/scope, exact revision/artifact, enabled merchant cohort, tested paths, backup/recovery evidence, unresolved limitations, who operates support, and next expansion gate. An elapsed calendar deadline never substitutes for this evidence.
