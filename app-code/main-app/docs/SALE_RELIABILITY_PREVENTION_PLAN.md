# Sale reliability: verified findings, repair plan, and release gates

Date: 8 October 2026 (Asia/Karachi)

Status: **Review and regression baseline complete; application fixes NOT implemented.** This is an incident-specific work plan, not a replacement for the repository's technical roadmap. No production access, migrations, sale recovery, or deployment was performed. Existing workspace edits were preserved.

## Decision

Adopt one versioned sale calculation contract, explicit payment allocation, strict journal validation, and a durable checkout/replay protocol. Fix the whole boundary from cashier intent to stored invoice, payment, inventory, ledger and receipt. A journal that balances is necessary but does not prove the right amounts or accounts were used.

Do **not** deploy either a generic five-paisa auto-balancer or the existing revenue-adjustment patch as the permanent solution. Do **not** treat every 500 as proof of rollback. Do **not** release recovered queued sales automatically before reconciling them against server records.

No plan can guarantee that software will never fail. The enforceable goal is: prevent this rounding mechanism by construction, detect amount disagreements before posting, retain uncertain sales, and make retries produce one durable business result.

## What was verified

References below are within `app-code/main-app` unless another root is stated. Line numbers describe the reviewed working copy and may move.

| Finding | Evidence | Confidence / limit |
|---|---|---|
| 25 identical journal errors on 7 October, from 16:38:21 to 19:57:20 in the log's timestamps | Repository-root `extras/_logs/laravel-2026-10-07.log`, first occurrence line 11348 | Confirmed count, not 27. Repeated totals do not identify a unique sale. |
| The console shows two queue IDs repeatedly receiving 500, alongside separate connection failures | User's console attachment | IDs 1 and 2 are local queue IDs. Their payloads and error response bodies are unavailable. |
| POS computes unrounded revenue/discount shares, then computes round-off before ledger normalization | `app/Http/Controllers/SaleController.php:180–277,2158–2186`; `app/Engines/AccountingService.php:87–120` | Synthetic double-rounding mechanism reproduced through the actual ledger validation. Exact incident input is unknown. |
| The client taxes the aggregate; the server rounds individual line taxes | `resources/js/Sell/core/cartMath.js`; controller tax pass | Reproduced: two 0.05 lines at 10% give client tax 0.01 versus server per-line policy 0.02. |
| POS turns 500s into local offline completion | `resources/js/Pages/Pos.jsx:2062–2129` | Confirmed in local code. Current FOH differs: it has an in-memory key and refuses offline payment; do not apply a stale description to FOH. |
| Local revenue patch changes the revenue credit by up to 0.05 | `SaleController.php:2173–2186` | Present in dirty local source, absent from the production-clean copy inspected. Neither copy proves what is deployed. |
| Queue is shared across stores and sends pending rows to the current store | `resources/js/DB/LocalDB.js:3–17`; `resources/js/Hooks/useOfflineSync.js:25–42` | Wrong-store dispatch reproduced with mocked transport. Actual cross-store server acceptance was not tested. |
| Queue marks any resolved HTTP response synced; does not check sale identity/success | `useOfflineSync.js:38–43` | A mocked 200 with `success:false` is marked synced. |
| Queue retries definitive rejection indefinitely | `useOfflineSync.js:46–73,87–90` | Repeated 422 submission reproduced. Failure of one row does **not** block the next row: test confirms the loop continues. |
| Server can return an error after sale commit | `SaleController.php:734–784` | Activity write follows commit inside the same try/catch. A failure there can produce an error with a durable sale. Failure injection still required. |
| Delivery-labeled charge is sent twice | `resources/js/Sell/core/salePayload.js:94–96`; `SaleController.php:257–267` | Reproduced: displayed 900 + 120 = 1020; payload has delivery 120 AND extra 120. The server sums both. Existing golden fixture 10 preserves this defect. |
| Default exception logging is stopped | `bootstrap/app.php:92–125`; installed Laravel `vendor/laravel/framework/src/Illuminate/Foundation/Exceptions/Handler.php:385–387` | `return false` stops further reporting. Which unobserved exception caused queue ID 2 remains unknown. |
| Backend duplicate protection already exists | `SaleController.php:108–119,760–775`; `database/migrations/2026_09_22_000001_ensure_sales_tenant_idempotency_index.php` | POS payload builder supplies no key; same-key/different-content protection is absent in the inspected checkout path. Verify deployed index and route behavior. |
| A second queue can falsely acknowledge a partly/wholly failed batch | `resources/js/Services/SyncService.js:187–208`; `app/Http/Controllers/Api/SyncController.php:234–261` | Client marks the entire batch synced from any resolved request. Server can return 200/count 0 or a partial count after per-item failures. Both client cases reproduced with mocked responses. |
| Catalog refresh can erase the previous usable catalog before replacement succeeds | `SyncService.js:230–234` | Separate clear/bulkPut operations; simulated storage failure leaves no products. |

Online-order completion uses `app/Services/Commerce/OrderService.php:326` and `app/Engines/SaleService.php`; `app/Services/V3/SaleService.php` is a wrapper over the engine. Completion locks the order, checks its linked sale, and uses `commerce-<order-id>`. The engine rounds line gross and discount separately, unlike the POS controller. This disproves neither the missing-order report nor other engine defects. Inspect that order's status, revisions and `sale_id` to settle it. Sales orders and sale invoices are different records.

The journal totals 7725.64/7725.65 may include inventory cost entries; they are not established customer bill totals. The proposed 200,000-cart percentages were not independently reproduced and are not production incidence estimates. No supplied example should be labeled the exact failed sale.

## Review of Claude's additional assessment

The additional assessment was supplied during this review and explicitly says it was written without code access. Its useful additions have been incorporated below; its statements remain hypotheses where the code or incident evidence does not establish them.

**Adopt:** inspect database error records and unfiltered-but-tenant-scoped sale lookup; confirm original dates, source revision and index; create identity before first request; preserve paid offline evidence; test storage eviction and multi-tab recovery; add schema/architecture checks; extend reconciliation beyond sales. Inspect sales-list register/location/channel filters before concluding an online invoice is missing. Do not remove tenant boundaries to perform an “unfiltered” lookup.

**Correct or reject:**

- “Sale 2 is failing for a different reason” is possible, not proven. It may share the cause, represent a duplicate intent, or have an unrelated failure. Inspect each payload and correlation record.
- The log contains minute-spaced clusters and gaps, rather than continuous one-minute failures for the entire window. Browser/network suspension is plausible; average spacing does not establish the retry algorithm. The local timer is explicitly 60 seconds.
- `SyncController::taxes()` **always returns an empty array**. Checkout gets tax from sale/settings, and the server prioritizes the product tax rate unless `tax_exempt` is explicit. Empty tax hydration alone does not prove missing checkout tax. `inventory()` can return empty when `stock_levels_view` is denied; `products()` separately supplies `stock_quantity`. The plan must test the actual sources, scope, completeness and freshness rather than infer behavior from row counts.
- A raw-balanced entry is not proof that ledger-created rounding is the only issue. The synthetic revenue/round-off case is raw-balanced too; automatically adding another ledger adjustment could keep invoice components inconsistent. Decimal provenance and explicit, invoice-reconciled allocation are required. Keep the strict ledger guard.
- Routing **every** small shortfall or excess to an expense account would erase genuine payment differences. Do not automatically convert customer money into rounding income/loss.
- “Never reject an offline sale over validation” must mean never lose its evidence, not bypass tenant authorization, journal invariants, stock policy or fiscal locks. Securely ingest an authorized unresolved intent into a recovery inbox, retain the charged price/payment evidence, and resolve via manager-approved stock adjustment, historical product mapping, receivable/refund or other normal business process. A claimed offline payment is not proof that payment occurred.
- A 409 is not necessarily duplicate success: this code's batch route returns 409 for a disabled POS module. Require a matching canonical sale result or status lookup. A generic 500 can follow commit and cannot be labeled “not saved.”
- A new 5910 account is not a prerequisite for this plan. Existing bill-rounding accounts still need correct per-tenant code, type, normal balance, reporting role and uniqueness. `getAccountByCode` can auto-create an absent account with a default asset type; audit and test required mappings instead of assuming existence alone is sufficient.
- Do not trust imported Woo/provider totals unconditionally or hide arbitrary gaps as rounding. Preserve the external amount and rounding mode, reconcile components and settlement fees under a versioned adapter, and quarantine unexplained mismatches.
- Do not delete the local revenue patch ahead of its tested replacement. Remove it as part of the calculator cutover, preserving unrelated local edits.

### Additional prevention requirements from that review

Request persistent browser storage where supported, check its actual grant/quota, warn when pending sales are at risk and provide controlled export/recovery. A persistence request cannot guarantee against user deletion or hardware failure. If guaranteed offline retention is a business requirement, define a managed-device durable journal/backup requirement rather than promising it from browser storage alone. Use the intent UUID in provisional receipt identity, not only a clock-based `OFFLINE-<timestamp>` reference.

Namespace catalogs and both queue systems by tenant. Publish catalog snapshots atomically with version/freshness/completeness metadata; retain the last valid snapshot if download or storage fails. Missing/denied/unsupported resource data must not masquerade as authoritative zero stock or zero tax. Test product-specific rate overriding client tax, tax-disabled UI without `tax_exempt`, and differing per-product rates. Define tender-specific rounding, including mixed cash/card, explicitly rather than assuming whole-rupee rounding applies to every method.

For `SyncService.syncOrders`, return a result per intent, with confirmed sale identity or structured pending/rejected outcome. Mark only verified successes synced. A batch count is insufficient to identify which records succeeded. Unify the two replay protocols where practical without losing either queue's old records; add tests for nested transaction failures and the batch-only offline stock-hold behavior.

Enforce architecture rules on financial calculation boundaries: new monetary float arithmetic/rounding in controllers and adapters must fail review/CI, with a reviewed baseline for legacy migration. Do not ban all `round()` in `app/`: quantities, ratios and unrelated algorithms may legitimately use it. Presentation-only `toFixed` is formatting; it must not feed financial arithmetic. Schema checks must reject FLOAT/DOUBLE monetary storage and verify adequate decimal precision for unit costs/quantities. Add migration compatibility tests.

Run ledger/component invariants before test transactions are rolled back, and against deliberately seeded post-run datasets; a scan of an empty test database proves nothing. Whole-suite reconciliation supplements channel tests and does not cover callers the suite never exercised. Reconcile only the relevant sale/refund entries when testing full reversal: later staff-tip payouts or other unrelated settlements do not become zero simply because a sale was refunded. Refundability of charges must follow the stored business policy.

Add risk cases for incorrect device clocks, license expiry during offline operation, missing account setup on old tenants, reporting aggregation order, landed-cost allocation, payroll proration and external tax-rounding conventions. Preserve authorized unresolved intents through license/access changes without permitting unprivileged posting. Investigate the blank-plan log separately, including entitlement-denied inventory hydration; no causal link to the journal incident is established.

## Decisions on the three proposals

| Recommendation | Decision |
|---|---|
| Exact decimal calculation with finalized minor-unit amounts | Adopt, with an explicit rounding sequence and bounded precision. Merely doing `round(float * 100)` after float arithmetic is insufficient. |
| One calculation shared across channels and browser/server parity fixtures | Adopt. Include adapters for differing payloads; reject unsupported semantics rather than silently dropping them. |
| Absorb any 1–5 paisa discrepancy in revenue or a new 5910 account | Reject as a generic rule. Small missing taxes, duplicated components and real short payments are still defects. Existing 4900/5900 already represent explicit bill rounding. |
| Treat 500 as “Sale NOT saved” | Replace with outcome-aware handling. A committed sale can lose its response or fail later. Display “Status unconfirmed” until reconciled. |
| Generate a key when a sale enters the offline queue | Too late. Generate and persist it **before the first submission** and reuse it for every replay. |
| Stop every 4xx/5xx after three attempts | Replace with classification: validation needs correction; auth needs renewal; throttling honors Retry-After; transient/uncertain outcomes reconcile and back off. |
| Recover queue automatically after server deployment | Reject. Export first, establish ownership and possible prior commits, then controlled replay. |
| Regenerate golden fixtures from the corrected implementation | Do not do this blindly. Review independently calculated expected values and document each intentional behavioral change. |
| All random carts must return 201 | Only valid, authorized, stock-feasible carts. Invalid cases must assert the right rejection and zero side effects. |

## Required contracts

### 1. Money calculation and persistence

Create `app/Support/Money.php` (or equivalently named value object) and `app/Services/Sales/SaleTotals.php`. Use a reviewed decimal implementation or bounded scaled-integer operations; lock any new dependency explicitly. Parse decimal **strings**, reject invalid/non-finite numbers, excessive scales, overflow and ambiguous formatting. Do not convert to binary float before exact arithmetic. Keep quantities, unit prices/costs and rates at their required precision until the defined rounding boundary; do not round quantities to two decimals.

Proposed calculation policy for current two-decimal currency posting:

1. Quantize gross per line from exact price × billed quantity, using half-up rounding. Retain exact input and its scale.
2. Calculate each line discount exactly, then quantize its monetary amount once. Free units and promotional lines must retain existing explicit treatment.
3. Calculate bill discount from finalized eligible line nets. Quantize the total discount once. Allocate whole paisa using largest remainders and immutable line IDs as tie breakers; allocation must conserve the total and never exceed an eligible line's net. Reject excessive discounts instead of masking negative values with clamps.
4. Calculate tax from the allocated line base; quantize per line consistently. Cover inclusive, exclusive, fixed, exempt, zero and mixed rates. Define inclusive fixed-tax behavior explicitly. Match the business's configured tax semantics; this plan does not establish jurisdictional tax rules.
5. Define typed charge components. Delivery must appear once; service income, tips payable and taxes retain distinct classifications. Every adapter must support or explicitly reject each charge type. Stop using display labels to decide accounting fields.
6. Sum finalized revenue, tax and charges in minor units. Apply the separately configured bill-rounding increment. `round_off_minor = invoice_total_minor - component_sum_minor`. With no bill rounding, the difference is zero; disabling bill rounding never disables currency precision.
7. Persist invoice fields, line allocations and journal lines from this same immutable result. Existing decimal database columns may remain if values are serialized as exact decimal strings. Include `calculation_version`, currency/scale, rounding-policy snapshot and source settings version.

Example of the proposed discount policy: gross 7725.00, 12.5% bill discount → discount 965.63, revenue/bill 6759.37 with no tax or bill rounding. Rounding the unrounded net instead would yield 6759.38; mixing those policies is the defect. Both runtimes and hand-reviewed fixtures must implement the chosen policy explicitly. The new audit test only requires currency precision for this example; it does not silently settle policy by a float conversion.

Keep legacy aliases (`total`/`invoice_total`, `tax`/`total_tax`, etc.) consistent. Persist allocation amounts needed for receipts, reports, refunds and cancellation; do not reconstruct them later using today's settings. Display decimals are formatting, not a calculation policy.

### 2. Payments, receivables and ledger

Create one payment allocation service used by the POS controller and engine. Validate every `payments.*` amount, method, tenant-owned account, reference and allowed tender type. The inspected controller's initial validator has no `payments` or `payments.*` rules; later checking that a value is an array does not establish a validated payment contract.

Distinguish actual tender, amount applied to invoice, cash change, unapplied customer advance, and credit receivable. The client currently clamps cash to the invoice and sets `amount_paid = cartTotal`; that is not a reliable record of money actually handed over. A server-authoritative invoice must never invent a payment or overwrite its amount to agree with the bill.

Required identities, with all values in minor units:

- `invoice = revenue + tax + delivery + other charges + service + tips + signed bill rounding`.
- `invoice = applied cash/bank + applied existing advance + authorized receivable`.
- For new monetary receipts, `actual tender = applied new payment + returned change + newly retained advance`; each method must conserve its own amounts.
- `sum journal debits = sum journal credits` exactly; assert each expected account amount separately.
- COGS and inventory movement amounts must reconcile to persisted batch allocations; their equality must not hide revenue discrepancies.

Cash change and retained advances need deterministic allocation independent of payment-list order. Validate walk-in paid status against actual allocations, not client `amount_paid` or a tolerance of 0.5. Named-customer part payments require the normal credit rules. Do not automatically write off a five-paisa debt. Explicit authorized write-offs are separate auditable operations.

Inspect the POS 2050 customer-credit mapping versus engine 2060 customer-advance mapping and existing consumers before choosing a canonical mapping. Do not rename accounts or move historical balances as part of an unrelated rounding patch.

`AccountingService::createEntry()` remains a strict invariant boundary: finite, nonnegative, currency-quantized amounts; valid account/tenant; one side per nonzero line; exact integer balance. No generic tolerance or revenue mutation. Remove the local drift patch only when the new calculator/posting path passes its regression gate. Explicit bill rounding is included by the originating transaction and reconciles to the invoice; it is never guessed from a ledger imbalance.

### 3. Checkout identity, uncertain outcomes and atomicity

Create a persisted checkout intent before making any request. Store a UUID, tenant/store ID, register/device, actor attribution, immutable business payload, original occurrence time with timezone, version and state. Avoid storing approval PINs or authentication secrets. If local persistence fails, do not claim an offline sale was saved.

Enforce tenant + idempotency-key uniqueness in the database, retaining the existing index where correct. Bind the key to a canonical business-payload hash and calculation version. Exclude refreshable credentials/approval secrets from that hash; snapshot business authorization separately. Same key + same intent returns the same canonical sale and amounts. Same key + different business payload returns a conflict with no changes. A new key must not be a generic escape from an uncertain outcome.

Add an authenticated, tenant-scoped status lookup by intent key. A lookup that races an in-flight request is not permission to issue a new key: resend only the original key or keep checking. Retain deduplication for at least the supported replay lifetime, including archived sales. Authorization remains enforced without revealing another store's sale.

Wrap sale, items, payments, allocations, stock/FIFO/serials, journals, source-order link and durable outbox event in one database transaction. Persist the reconstructable canonical response. Noncritical activity reporting must not turn a committed sale into an apparent failure. External reporting/notifications should be driven by an idempotent outbox; the current FBR call before commit needs failure-injection review because external success cannot be rolled back with SQL. Do not silently change any mandatory synchronous integration requirement—reconcile provider state explicitly if it must stay synchronous.

Test the actual `POST /s/{store}/pos/sales` wrapper, including shift/capability checks. A replay after shift closure must identify a previous committed result without creating a new sale or reassigning its shift. A never-posted old sale needs an explicit authorized recovery path, not a bypass of normal permissions.

### 4. Queue state and cashier behavior

| Outcome | State / action |
|---|---|
| Canonical success with matching intent/store, sale ID and amounts | Confirmed; persist response and receipt reference, then mark synced. |
| Contracted business rejection with guaranteed no commit | Needs correction/approval; preserve payload and error; no automatic retry loop. |
| Auth/session expiry (401/419), access loss | Await reauthentication/authorized recovery; preserve original store and actor. |
| Key/content or stale-order conflict | Needs reconciliation; do not change the key and resubmit blindly. |
| Rate limit or documented transient uncommitted error | Bounded retry with exponential backoff, jitter, and Retry-After where present. |
| Timeout, connection loss, generic 500/502/503, malformed/HTML response | Outcome uncertain; preserve intent and reconcile by the same key. No confirmed receipt or second payment capture. |
| Deliberate offline checkout before transmission | Durable pending confirmation, only if supported by existing permissions; clearly labeled provisional receipt tied to the intent. |
| Missing tenant identity, incompatible version, expired policy snapshot | Quarantine for review; never infer identity from the currently open store. |

Use a durable per-store/device sync lease and atomic row claims, with expiry/recovery after crashes. A React state flag is not a cross-tab lock; the current effect also captures its initial closure. Database uniqueness is still the final duplicate guard. Use `try/finally` to release local locks after storage failures.

Migrate IndexedDB additively; preserve old rows and export capability. Store tenant/device/intent IDs, payload version, original time, next retry, attempt count, structured error, state, canonical sale ID and response. Never erase the database to upgrade it. Old unidentified rows must remain quarantined until ownership is established. Handle logout, store switch, browser sleep, multiple tabs and storage quota failure. Sync healthy eligible rows independently of a failed row.

Replace recall-and-delete behavior with explicit reconciliation/correction. Current recall expects `data.cart`/`party_id`, whereas checkout saves `items`/`customer_id`; an adapter is required. Do not offer permanent discard of an unresolved potentially committed sale. Audit a cancellation/resolution; retain the original intent. Fixing an uncommitted business payload creates a linked revision/new intent only after definitively resolving the old outcome.

Keep `occurred_at`, server receipt time and authorized accounting date distinct. Do not overwrite `created_at` to pretend the server received the sale earlier. Apply fiscal-period, backdate, shift and timezone policy; preserve evidence if an old period is closed. Never “fix the date by hand” after posting without the normal correction process.

FOH currently refuses offline payment and uses a key held in memory. Keep that policy while adding reload-safe identity and common outcome handling. Do not accidentally enable offline restaurant payment as a side effect of sharing POS code.

### 5. Observability and reconciliation

Correct exception reporting so the durable log still receives exceptions when the database error sink fails. Caught checkout exceptions must also produce structured events. Include correlation ID, intent key, tenant, endpoint/channel, calculation version, outcome classification, error code and safe expected/actual minor-unit totals. Redact credentials, payment details and personal data; restricted diagnostic records can hold the necessary account-level breakdown. Do not broadly log raw sale payloads or full requests.

Return a safe error code and correlation ID to the cashier. Track invariant rejection, unknown outcome, blocked replay age, duplicate prevention, payload conflicts and client/server amount mismatch. Browser queues cannot be monitored server-side while a device is disconnected; add minimal status telemetry on reconnection plus local warnings. A server-only nightly query cannot see all browser-held sales.

Use a read-only reconciliation report across invoice components, aliases, payment allocations, journal accounts, refunds, inventory and commerce order links. Make any invariant mismatch a release blocker. Monitor after rollout daily for an initial seven-day window, then under the operational policy. Do not automatically repair historical records.

## Implementation order and completion gates

These are incident work packages, not new roadmap phases.

| Order | Work and principal files | Completion gate |
|---|---|---|
| A | Preserve incident evidence: affected browser queue export, response bodies, order ID/link, deployed source/build hashes, migration ledger, store settings and timezone | Sanitized reproduction fixture or explicitly tracked missing evidence. No automatic replay of unidentified old intents. |
| B | Review policy fixtures; add pure Money/SaleTotals and payment allocation modules; extend strict ledger checks | Exact PHP/JS fixtures agree; explicit charges and payment identities hold; unexplained one-paisa imbalance still rejected. |
| C | Integrate controller store/update, POS wrapper, engine/V3 wrapper, commerce order conversion and return/cancellation adapters | Real endpoint/channel tests assert all persisted amounts, stock effects, rollback and reversals. No silent unsupported fields. |
| D | Add durable intents, request hash/status endpoint, canonical response, transaction/outbox and additive schema changes | Lost-response, post-commit failure and concurrent replay each produce one sale and one set of effects. |
| E | Update `cartMath.js`, `salePayload.js`, POS/FOH outcome handling, `useOfflineSync.js`, `SyncService.js`, `Api/SyncController.php`, `LocalDB.js` and recovery panel | Both queues acknowledge per intent; catalog replacement is atomic; isolation, storage/lease failure, stale bundle and upgrade tests pass. |
| F | Fix reporter; add reconciliation/telemetry; wire all regression suites into required CI and release checks | Tests actually discovered in each supported runner; negative controls prove checks catch defects. |
| G | Rehearse exact release and protected recovery, then canary and reconcile | Candidate backend, browser assets, schema and queue migration pass together; rollback and data preservation verified. |

B–F may be implemented in separate changes, but release compatibility must be tested as one protocol. Do not use a server-only silent write-off as a bridge for old clients. Old payloads need an explicit, bounded compatibility adapter or must be held for review. Quotes can allow online confirmation of server-authoritative totals before tender; offline intents retain their recorded price/policy and are not silently repriced at replay.

Audit other producers of `AccountingService::createEntry` (purchases, purchase returns, settlements, expenses, payroll and integrations) for the same late-rounding mechanism. Convert affected producers with domain-specific component tests; do not loosen the ledger to accommodate them. Inventory the real call sites rather than relying on an unverified count of 90.

## Automated test specification

### Added and executed in this review

The isolated audit suite is in `verification/sale-reliability/`. It imports the actual client calculator/payload functions, queue hook and SyncService; storage and HTTP are mocked. PHP cases call the actual ledger validation without Laravel/database initialization. This does not constitute an endpoint, real IndexedDB, or production-database test.

| Suite | Result |
|---|---|
| New money + queues/catalog audit suite, 15 tests | **4 pass, 11 fail**, exposing the current defects; normal assertions, not skipped or inverted expected failures. |
| New ledger balance guard, 5 tests / 12 assertions | **5 pass**. Rejects one/five/fifty-paisa mismatches and reproduces the synthetic double-rounding rejection. |
| Existing `resources/js/tests/saleCoreMath.test.js`, 13 cases | **13 pass**. These are characterization fixtures, not independent correctness proofs. |

The eleven failing audit cases cover fractional discount totals, weighed totals, aggregate/per-line tax mismatch, delivery duplication, wrong-store replay, unidentified legacy replay, false-success acknowledgment, repeated definitive rejection, two forms of incorrect batch acknowledgment, and catalog loss on replacement failure. Passing queue cases preserve payload/key and prove that a bad first sale does not block a valid second sale. These are eleven failing test cases, not eleven independently established production incidents.

The opt-in suite keeps this planning deliverable from silently changing the default test selection. During implementation it must become a required CI gate, not remain a manual audit. Keep the ordinary failing assertions until the defects are fixed; do not switch them to expected-failure markers. Fixtures that preserve known defects need reviewed corrections, not wholesale rerecording.

Observed runtime: Node/Vitest 4.1.11; PHP **8.2.12** / PHPUnit 11.5.56 from the available executable. Repository notes about PHP 8.4 are not proof of this runtime or of production. Verify actual target PHP/MariaDB versions before release. Initial sandbox runs could not access PHP's autoloader or rename Vitest temporary files; approved isolated reruns executed successfully and produced the results above.

### Required before release (not yet implemented/executed)

| Test group | Cases and required assertions |
|---|---|
| Pure money fixtures | Values below/at/above half paisa; 100.005; 7725 at 12.5%; 1.235 × 399; 0, tiny and large valid quantities; overflow; malformed/non-finite inputs; all configured rounding settings. Exact outputs, never tolerance-based assertions. |
| Allocations | One-paisa discount over three equal lines → one deterministic recipient; zero weights; excessive/negative discount rejection; stable line IDs and reorder invariance; high line count. Shares conserve the total. |
| Tax/charges | Inclusive/exclusive/fixed/exempt/mixed taxes; free/promotional quantities; modifier prices; delivery-only/extra-only/both intentional charges; service and tips. Assert each classification and zero duplicate charges. |
| Payments | Cash, named credit, split methods in every order, cash change, bank overpayment, retained/applied advance, zero invoice, walk-in partial payment, missing/foreign accounts and tiny real shortfall. Assert payment rows, paid status and each account, not just net balance. |
| Channel matrix | Real POS wrapper; manual create/edit; engine/V3 create; commerce completion; FOH payment; sales-order conversion; batch offline/import/recurring paths where enabled. Use each channel's actual middleware and response contract. |
| Atomicity | Inject failure after sale/items/payment/FIFO/serial/journal work and before commit. Assert no partial durable business effects. Inject activity/response/outbox failure after commit; status/replay must recover exactly one committed result. |
| Duplicate/concurrency | Concurrent same key + same content on separate DB connections; same key + changed content; different stores using same key; double tap; multi-tab replay; request still in flight after timeout; duplicate outbox delivery. One effect set; no leaked cross-store result. |
| Database reality | Isolated database matching deployed MariaDB major/version, DECIMAL scale and constraints; actual unique index, transaction/savepoint behavior, lock contention/deadlock retries. Do not substitute SQLite for concurrency proof. Never run destructive test reset against a user store. |
| Browser recovery | Actual IndexedDB upgrade from v3 with old rows; store/user switch, reload mid-request, restart, expired lease, disk quota/transaction failure; 200 HTML/login redirect; 401/403/409/419/422/429/500/502/503; stale service worker/backend combination. Retain unresolved intents and truthful receipts. |
| Returns and edits | Successive partial returns to full; reordered returns; concurrent return/void; refund plus remaining receivable/advance; edit reversal/repost failure; retired product or changed tax setting. Sum all refunds/remaining allocations to original persisted amounts; restore correct FIFO/serial quantities once. |
| Permissions/dates | Closed shift/fiscal period, midnight and original timezone, backdate limits, revoked user membership, approval required/expired. No reassignment to a new store or shift and no stored manager PIN. |
| Observability | Logger database unavailable; caught/uncaught error with correlation ID; safe redaction; failed/unknown queue age telemetry on reconnect; reconciliation report catches an intentionally corrupted amount in test data. |
| Historical compatibility | Existing local revenue-patched invoices, old payloads, legacy amount aliases, missing allocation/version fields. Never recalculate posted history using the new calculator without an explicit correction. |

Use at least 10,000 seeded pure valid-cart combinations in fast CI, hand-reviewed shared PHP/JS fixtures, and a bounded real-endpoint sample in pull-request CI. Run the broader 2,000-valid-cart endpoint matrix and concurrency/fault-injection cases in the required pre-release lane on an isolated MariaDB database. Invalid generators must assert correct rejection. Preserve seeds and minimized failures. More samples improve coverage; they do not prove correctness by themselves.

Property assertions must independently check component conservation, legal amount bounds, exact journal accounts, invoice/receipt/payment equality, idempotency and atomic rollback. Include negative controls: omit a tax line, duplicate a charge, change an intent payload or replay to a foreign store and prove the suite detects each fault. Do not merely run the same calculator on both sides of an assertion.

Test discovery needs explicit attention: root `phpunit.xml` currently selects `tests/Feature`; many financial tests live under `tests/tests/Feature` with separate suite configuration. The existing `OfflineSyncIdempotencyGuardTest` exercises `SyncController::batchOrders`, not the actual POS queue's `POST /pos/sales`. Register the new tests in the required runner and verify discovery counts. Suite generation alone is not proof CI executes them.

## Recovery and rollout procedure

1. Preserve both browser queue rows and receipt references before any migration/replay. Export sensitive payloads to controlled storage; commit only sanitized fixtures. Do not clear browser data or manually ring the sales again.
2. Verify the deployed source/build revision and migration ledger, actual runtime versions, store settings, timezone and original order link. Inspect response bodies and `error_logs`; do not assume both pending rows share the logged cause.
3. Search for possibly committed sales using existing intent/client IDs where available and compare receipts, actor, time, amounts and stock/payment effects. Matching totals alone do not prove identity. Legacy rows without an original key need explicit reconciliation before assigning a recovery key.
4. Reproduce the sanitized actual incidents on isolated staging with production-equivalent database behavior. Add the recovered cases to the regression fixtures; if unavailable, keep that acceptance item explicitly unresolved.
5. Rehearse additive migrations and IndexedDB upgrade, mixed old/new clients, failure recovery and code rollback. Preserve old protocol readers through the transition. Validate the exact candidate under repository-root `RELEASE_AND_DEPLOYMENT_POLICY.md`; this document authorizes no production deployment or blocked updater ZIP.
6. Use a bounded canary with structured correlation and reconciliation, then replay one reconciled sale under its stable intent. Verify sale, payments, stock, journal, date/shift and receipt, then process the next. Pause on any mismatch; retain the original row and recovery audit trail.
7. Verify normal, fractional, taxed, delivery, refund and disconnected/reconnected checkout on the final deployed bundle. Reconcile affected stores daily for the initial window. Rollback code must retain new queue records and deduplication identity; do not drop data or reverse financial records as a deployment rollback.

Release acceptance is **all** required contracts and tests passing, the exact artifact validated, incident disposition documented, and no unexplained reconciliation difference. A green journal-only test or a temporarily empty queue is not completion.
