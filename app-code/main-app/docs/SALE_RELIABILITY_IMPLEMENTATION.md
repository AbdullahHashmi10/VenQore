# Sale reliability: implementation status

Date: 8 October 2026 (Asia/Karachi). Plan: `docs/SALE_RELIABILITY_PREVENTION_PLAN.md`.

Status: **Packages B–F implemented including the release protections (round 5), all sale channels and every other money path on exact paisa, behind the ZeroDrift Ledger; tested in an isolated environment. Nothing was deployed. No migration was run against any real database. No queued sale was replayed.** Packages A (evidence) and G (release rehearsal, canary, recovery) need people and production access. Do them before release.

## Round 5: the remaining release protections (9 Oct 2026)

### What was added

| Item | What it does |
|---|---|
| **FBR outbox** (`fbr_outbox` table, `App\Services\Fbr\FbrOutbox`, `fbr:flush-outbox` every minute) | The sale used to call FBR from **inside** its database transaction: the till waited on FBR while holding the sale's locks, and a sale FBR could not be reached for was never reported again. Now the sale writes one outbox row in its own transaction, the report is sent **after commit**, and the scheduler retries it (1, 5, 15, 30, 60, 120, 240, 480 minutes; then "gave up"). A 4xx from FBR is "rejected" and waits for a person; missing settings, 401/403, 5xx and timeouts are retried. Each row is claimed with one atomic UPDATE, so the till and the scheduler can never send the same report together; a claim left by a crashed worker is retried after 5 minutes. The FBR service is now built inside the sale's store, so it reads that store's FBR settings. |
| **Reconciliation report** (`sales:reconcile`, `App\Services\Reconciliation\SaleReconciliation`, daily 03:10, emails on a blocker) | Read-only; never repairs. In exact paisa with no tolerance it checks: every journal entry balances; the store trial balance; each posted sale has exactly one live journal entry; a cancelled sale is undone; the invoice total equals its parts; line revenue adds up to the sale's revenue; the revenue posted equals it; what was posted as received/owed equals the invoice; the till's payment rows equal the money posted; nothing returned beyond what was sold or bought; every completed online order has its sale at the same total; FBR reports rejected, given up or waiting over an hour; tills holding unsent sales over an hour. `--fail-on=blocker` makes it a release gate. |
| **Reconciliation inside the tests** (`Tests\Support\ReconcilesBeforeRollback`) | The sale, return, cancellation, online-order, ZeroDrift and FBR suites now run the report over everything each test wrote **before** the test's transaction is rolled back, and fail on any blocker. Wiring it in found four places where the report was wrong (return documents, invoice-engine advances on 2060, sales that keep no payment rows, cancellations of partly returned sales); the report was fixed, not the tests. |
| **Till reconnect telemetry** (`POST /s/{store}/pos/queue-status`, `pos_queue_telemetry` table) | After every sync and on reconnect, a till reports per state how many queued sales it still holds and how old the oldest is: counts and ages only, never sale content. At most every 5 minutes while something is queued, every 6 hours when empty. One row per store and device; the reconciliation report lists tills holding sales for over an hour. |
| **Separate-connection concurrency proof** (`SaleConcurrencyRaceTest`, `tests/tests/Support/concurrency/sale_post_worker.php`) | 8 OS processes, each with its own database connection, post the same checkout intent at the same instant through the real `POST /s/{store}/pos/sales`. The test checks the requests really overlapped. Result: exactly one sale, one journal entry, one payment row, and every process gets that one sale back. With different content under the same key: one sale, the other 7 get `409 idempotency_conflict` and write nothing. **Negative control:** with the `(tenant_id, idempotency_key)` unique index dropped, the same race produced 4 and then 8 sales. That index is what holds; it must exist in production. |
| **Real-browser queue tests** (`verification/sale-reliability/browser/`; how to run is at the top of `queue.browser.test.mjs`) | The real Dexie database and the real `useOfflineSync` hook in Chromium, against a small local server. (1) Rows an old build (schema v3) left behind survive the v4 upgrade and are held, not sent. (2) Two tabs syncing at the same moment send each of 12 queued sales exactly once. (3) When the browser refuses to store a sale (quota), the queue returns false instead of claiming it was kept; with normal storage the same sale is kept. (4) A sale whose answer was lost (gateway error after the server committed it) is "status unconfirmed", then found by the same key and never rung twice. |
| **CI** (`.github/workflows/sale-reliability.yml` at the repository root) | Three jobs: the money suites on **MariaDB 10.5** (checked: the job fails if the server is not 10.5) under **PHP 8.3 and 8.4**; the JS money and queue suites; and the real-browser queue tests. Make all three required status checks on `main`. |
| **Float-money lint** (`scripts/money-float-lint.php`, baseline `scripts/money-float-baseline.json`) | A ratchet over every file that posts to the books: it counts float money arithmetic (`round(a + b, 2)`, `(float)$amount * …`, `$total += (float)…`). 63 such lines remain in 17 files; most are a single quantization used on both sides of an entry, so they balance. The count can only fall; a new one fails CI with the line to fix. |
| **Old purchase returns** (`purchases:backfill-returned-qty`, dry run by default) | Restores `purchase_items.returned_qty` for returns made before the column existed, from the stock movement log (purchase returns by invoice number, debit notes by the bill they name). It only adds what the log proves and the lines do not already count; safe to run twice. Debit notes against a bill now also count toward the line's returned quantity. |
| **Depreciation, year-end close, Vyapar import: dedicated tests** (`BooksCloseZeroDriftTest`) | Depreciation: each asset's day is `balance × rate ÷ 365` on the exact stored decimals, rounded half-up once; **a second run on the same day now posts nothing** (it used to depreciate twice); another store's assets are untouched. Year-end close on old 4-decimal data posts a balancing entry and leaves every income and expense account at zero; the trial-balance check before closing is now exact paisa (it was a float sum with a 0.01 tolerance). |
| **Vyapar import, fixed** | The journal step called a method that does not exist (`validateTransactionDate`), so **no Vyapar journal was ever imported**: every file with journals hit a fatal error there. That call is now the real period-lock check. Every line also used to land on the store's first account; lines now land on the account Vyapar named (`other_accounts` → `VY-ACC-<id>`), and an entry whose account cannot be matched is skipped and counted, never guessed. The import message now says how many journals were not imported and why. |
| **`finance:audit` (hourly) no longer invents payments** | It used to create a `Payment` row (no journal entry behind it) for any "paid" sale whose payment rows looked short. The invoice engine keeps no payment rows by design, so this fired on its sales. Now it only reports them; `--fix-payments` keeps the old behaviour for a person who decides to use it. |

### Round 5 results (isolated; MariaDB presenting as 10.5, PHP 8.3)

| Suite | Result |
|---|---|
| Money suites (sale reliability, ZeroDrift, online orders, financial engine, fiscal year), each test reconciled before rollback | **172/172** |
| `SaleConcurrencyRaceTest` (8 processes, separate connections) | **2/2**; negative control without the unique index: 4 and 8 duplicate sales, as it should |
| `FbrOutboxTest` | **6/6**; negative control on the old controller: FBR called at transaction level 2 (inside the sale) |
| `ReconciliationReportTest` (each corrupted amount caught by its own check; report writes nothing) | **9/9** |
| Real-browser queue tests (Chromium) | **4/4** |
| JS: whole suite / sale-reliability suite | **475/475** / **26/26** |
| Float-money lint | 63 lines, at the baseline |
| Whole PHP suite (7,035 tests) | 341 failures/errors; compared test by test with the round-4 run: **no new failures** (6 fewer). The rest are this sandbox's environment gaps, unchanged. |

One finding from the browser tests: when a reused keep-alive connection is reset before an answer, **Chromium itself resends the POST**. The till code never sees it. Only the server's `(tenant_id, idempotency_key)` unique index stops that from becoming two sales, and the concurrency test proves the index does.

## Round 4: the ZeroDrift Ledger, and every other money path (8 Oct 2026, late night)

### The ZeroDrift Ledger

The strict ledger gate now has a name and its own class: **`App\Engines\Ledger\ZeroDrift`**. Every journal entry from every part of the product passes through it (`AccountingService::createEntry`) before a single row is written. Its rules:

| Rule | Meaning |
|---|---|
| ZD-1 NUMBER | every amount is a number (no text, NaN or infinity) |
| ZD-2 EXACT | amounts are read as exact decimals and quantized to the paisa once |
| ZD-3 POSITIVE | no negative amounts |
| ZD-4 ONE SIDE | a line is a debit or a credit, never both, never neither |
| ZD-5 BALANCED | debits = credits to the exact paisa, in integer paisa — no tolerance, nothing absorbed |
| ZD-6 NOT EMPTY | an entry has at least one line |

A refusal reads `ZeroDrift Ledger [ZD-5 BALANCED]: Journal entry is unbalanced. Debits: 100.00, Credits: 100.01 (difference -0.01)` (`ZeroDriftException`, which is an `InvalidArgumentException`, so every existing handler still catches it) and is logged as `sale.ledger_refused_unbalanced`. Inputs finer than a paisa are logged as `sale.ledger_unquantized_input`, so any producer still sending them can be found.

The two places that wrote journal rows **directly**, skipping the gate, now go through it: the Vyapar data import (`DataImportService`; an entry it refuses is skipped and counted, never written) and the one-off `MigrateV3Ledger` command.

### Every other place money is posted

All about 90 call sites (55 files) that post to the books were inventoried and read.

- **Already exact by construction, no change needed** (they post one typed amount on both sides, so the ZeroDrift Ledger quantizes both identically):
  - customer receipts and supplier payments (`CustomerPaymentPostingService`, `SupplierPaymentPostingService`, `PaymentController`);
  - customer and supplier advances, refunds, owner drawings, capital injection, fund and bank transfers;
  - balance adjustments, cash shortage, donations, disaster claims, asset purchase, manual depreciation, bad-debt write-off, loan drawdown, opening balances;
  - cheques, stock adjustments, delivery-challan COGS;
  - WooCommerce orders and marketplace settlements (every part rounded, totals are sums of rounded parts).
- **Converted to exact paisa:**

| Path | Defect found | Fix |
|---|---|---|
| **Purchase returns** (`PurchaseService::createReturn`) | Each return revalued the units at the batch's 4-decimal unit cost and pro-rated tax per piece, so returning a line in pieces left paisa stuck on 1100 Inventory (test: 3 × 33.3333 back one at a time left 0.01). There was also no per-line cap. | New `bookedPurchaseLines()` splits what the purchase actually booked per line (goods after the header-discount share, landed cost, recoverable and non-recoverable tax, all by largest remainder). Each return takes a **cumulative** share (`ReturnValuation::share`), so the pieces give back exactly what came in. New column `purchase_items.returned_qty` (additive) caps returns per line. |
| **Purchases** (`PurchaseService` store, edit, receive) | Float totals rounded in several places. | Every amount quantized once; totals, paid and owed are integer sums. The purchase entry itself was already balancing in tests; this removes the float path. |
| **Expenses** (`ExpensePostingService`, `ExpenseController`) | Expense and tax rounded separately from their total (an expense of 0.005 + tax 0.005 posted 0.02 against 0.01 and was refused). An itemised voucher's header was round(Σ raw lines) while each line was stored rounded, so they could disagree. | Quantize each figure once; voucher total = exact sum of its quantized lines; paid + owed = total. |
| **Debit notes** | Goods summed from unrounded qty × price. | Each line quantized once; note = Σ lines − discount + tax; stock-cost gap compared in paisa. |
| **Final settlement** (`SettlementService`) | Salary + gratuity + notice + leave rounded once as a total but posted as separate lines (1000.005 + 3 × 0.005 → refused). | Each part quantized, totals summed exactly; recovering more advance than the settlement is refused. |
| **Payroll payment, payroll run, loan repayment** | Net = round(gross − advance) and total = round(principal + interest) against separately rounded parts. | Exact paisa. |
| **Pre-sale (sales order) conversion** (legacy `SalesOrderController`) | Pure float arithmetic: tax neither rounded nor per line; unrounded values stored (e.g. `subtotal_gross 100.0990`, `tax 17.0153`). | Now uses the shared `SaleTotals` (the same calculation as the POS and the V3 engine). Every stored amount is whole paisa and COGS is quantized once. |
| **Production run** (`ManufacturingService`) | Finished goods = round(material + labour − by-product) against separately posted parts; material cost stored unrounded, then re-rounded at completion. | Material cost quantized once at start and stored; finished goods is the exact difference. |
| **Set disassembly** | Each component's share rounded alone (33.33 / 33.33 / 33.34 % of 100.01 gave 100.00 and **the disassembly was refused**). | Largest-remainder split of the set's cost; the parts always add back exactly. |
| **Depreciation run, year-end close** | Floats summed into the entry total. | Daily depreciation quantized once and summed in paisa; closing lines and net profit come from the same quantized balances. |

### Round 4 tests (isolated, MariaDB presenting as 10.5)

| Suite | Result |
|---|---|
| `PurchasesZeroDriftTest`: 60 seeded random purchases (4-decimal costs, discounts, round-off, landed cost, part payments); returns in pieces; 15 seeded partial-return sequences | **3/3** |
| `MoneyInOutZeroDriftTest`: 40 seeded expenses with half-paisa inputs, itemised voucher, debit note, payroll and loan, final settlement, pre-sale conversion | **6/6** |
| `ManufacturingZeroDriftTest`: disassembly at 33.33 / 33.33 / 33.34 % | **1/1** |
| **Negative control**: the same tests against the round-3 code | **8 of 10 fail**, as they should. The 2 that pass on old code: the random-purchase test (the purchase entry itself was already balancing; its defect was in returns, which do fail) and, before it was strengthened, the conversion test. |
| Whole JS suite | **475/475** (the full resources folder is now present, so the earlier `cards.json` gap is gone) |
| Whole PHP suite (7,012 tests) | 347 failures/errors, **all of them also failing on the round-3 code**. Every failing file (134 files) was rerun on both versions against the same database and compared test by test: **no new failures**. The pre-existing ones are environment gaps in this sandbox (no built Vite manifest or SSR bundle, missing Node audit scripts, stale call-site inventory for `DeliveryChallanService::dispatch`, which this work did not touch) and are unchanged. |
| Ledger log after the full run | Every `sale.ledger_refused_unbalanced` came from a test that posts an unbalanced entry on purpose (`UNBALANCED-1`, `LA-UNBAL`, `ROUND-ERR-1`, …). No real producer was refused. |

**Still not covered by a dedicated test:** the depreciation command, year-end close and the Vyapar import. They are exercised only by the existing suites (`FiscalYearTest`), or not at all in the import's case. The Vyapar import still posts every imported line to a single default account; that predates this work and needs its own fix.

## Round 3: the other sale channels (8 Oct 2026, night)

Order as requested: V3 engine, then online orders, returns and cancellations. Every channel now uses the shared exact calculation and has its own tests on MariaDB.

### 1. V3 engine: `App\Engines\SaleService::post`

This one function also serves online-order completion, sales-order conversion, service billing, recurring invoices, approved invoices and Smart Capture, so converting it converts all of them.

- The float arithmetic (28 separate `round()` calls) is replaced by `SaleTotals`. The shared calculation gained a **line discount percentage** (`discount_percent`): it is quantized once on the line gross, and anything over 100% is refused. Both runtimes have it, with 5 new hand-checked shared examples.
- Payments go through `PaymentAllocation`. The engine's own rules are unchanged:
  - 'credit' means receivable.
  - Cash or bank records `amount_received`.
  - A shortfall goes on AR; an excess becomes a Customer Advance (2060).
- The journal is built in integer paisa and checked to balance before posting. COGS is quantized once and posted on both sides. Sale lines store the exact gross, discount, net, tax and booked revenue.
- **Idempotency:**
  - **Same key, same content:** the original sale is returned.
  - **Same key, different content:** `IdempotencyConflictException` (409), and nothing is written.
  - **Sales from before this change:** keys saved without a content hash are returned as before.
- **Tests** (`EngineSaleReliabilityTest`, 10):
  - per-line discount and tax;
  - a weighed line, and half-paisa tax on small lines;
  - a part payment;
  - a credit sale;
  - overpayment to 2060 with bank to 1010;
  - a promotional line;
  - a retry returning the same sale;
  - a different payload under the same key refused;
  - a failed post writing nothing, then the retry posting once;
  - a line discount over 100% refused.

### 2. Online-order completion (Commerce)

- `OnlinePricing::line()` now runs the same `SaleTotals` the engine runs at completion. Checkout and revision totals are summed in paisa, so the order the customer agreed and the posted sale are the same number by construction.
- The completion guard used to allow a 0.01 difference. It is now an exact paisa comparison.
- **Tests** (`OnlineOrderReliabilityTest`, 7):
  - an awkward tax-inclusive price;
  - cash on delivery with a delivery fee posted as an exact receivable;
  - a bank-paid order;
  - a price rule that rounds once;
  - a completion retried once;
  - a failed completion that writes nothing, then posts once on retry;
  - **25 seeded random orders, each posting exactly its agreed total.**

### 3. Returns

The real defect was not rounding. The Returns screen (`LegacySalesReturnService`) **valued a return from the price, discount and tax rate typed on the screen**. That could refund more, or less, than the sale had booked.

- New `App\Services\Sales\ReturnValuation`: a return is worth its share of what each line **booked**, computed **cumulatively and exactly**, so a line returned in pieces always adds up to exactly what it booked.
- New additive columns `sale_items.revenue_amount` and `sale_items.bill_discount_share`, written by the POS and the engine. Older rows are valued from the sale's own posted `net_sales` / `total_tax`, spread over its lines by largest remainder, not from today's settings.
- Return paths converted:
  - engine partial returns, used by POS partial returns and V3 returns;
  - `LegacySalesReturnService`, which ignores typed prices and caps the refund at the booked value;
  - `PosReturnService` (open returns), which now values lines to the exact paisa and adds the same content check on its receipt key (409 on a mismatch).
- **Tests** (`ReturnsAndCancellationsReliabilityTest`):
  - the per-line discount share is persisted and sums to the bill discount;
  - returns in four pieces add up exactly in revenue, tax and cash;
  - a typed price of 9999 at 50% tax still refunds only the booked share;
  - a sale from before the new columns still returns exactly what it posted;
  - an open return of 100.005 posts 100.01 once, and a changed retry gets 409;
  - pure checks that awkward weighed quantities conserve the booked amount.

### 4. Cancellations

- A never-returned sale is cancelled by flipping its persisted journal entry, which was already exact. A partly returned sale is cancelled through the engine's remainder return, which is now exact (above).
- `SaleReversalService` now re-reads the sale's status **under a row lock**, so two cancellations arriving together cannot both reverse the sale.
- **Tests:** a cancellation mirrors every account exactly and a second attempt fails; cancelling a partly returned sale reverses exactly the remainder.
- **Not proven here:** true concurrency, meaning two database connections at the same moment. The feature tests run inside one transaction.

### Round 3 results (isolated)

- Channel suites: **43/43** (POS 18, engine 10, online orders 7, returns and cancellations 8).
- Pure PHP: 57 tests, 33,454 assertions.
- Client audit 23/23, review suite 7/7, whole JS suite 474/475. The one failure is the `cards.json` file missing from this copy.
- Two broad regression sets (about 1,400 and about 1,000 existing tests across sales, Commerce, V3, returns, golden data, approvals, ledger and sync): **no new failures against the baseline.** The ones that fail also fail on the untouched code, or need files missing from this copy.

## Round 2: cross-check fixes (8 Oct 2026, evening)

`docs/SALE_RELIABILITY_CROSSCHECK.md` found real gaps. Its tests in `verification/sale-reliability-review/` (10 cases) **all failed** against the round-1 code, which confirms every finding. All 10 now pass.

| Finding | Fix |
|---|---|
| A credit leg was counted as physical tender (Rs40 cash + Rs60 credit sent `tendered_amount` 100) | **Client:** `salePayload` counts tender from money methods only. **Server:** `PaymentAllocation` lets a reported tender add change **only** when there is a cash leg, nothing is owed and no credit was declared. Otherwise the report is ignored and logged (`sale.tender_report_ignored`). A card-only sale can never produce cash change. Endpoint test: an old till's 40+60 shape posts 1000 DR 40, 1200 DR 60, 4000 CR 100, with tendered 40 and change 0. |
| A replay did not keep the original date | Every intent carries `occurred_at`, fixed once per receipt key (`Pos.jsx` keeps it with the key). The queue resends it, and the server stores it in the new `sales.occurred_at` column and uses it for `posted_at` and the journal date. `created_at` stays the server's receipt time. A device clock more than 5 minutes in the future falls back to server time (`sale.occurred_at_in_future`). A closed period answers 422 `period_locked`, so the till keeps the intent. Endpoint tests cover a next-day replay and a future clock. |
| Export included other stores' rows | `exportUnresolved()` exports only rows belonging to this store. Rows with no owner go through a separate `exportUnassigned()`, and its button appears only for an owner, admin or manager. |
| Payload version was not enforced | The queue only sends `SENDABLE_PAYLOAD_VERSIONS = [2]`. Any other version, or a missing one, is held for review. |
| Status lookup did not check the key | A `committed` status counts only if it echoes the row's own key. |
| A success without a matching key was accepted | `classifyOutcome` requires the echoed key. A missing or different key becomes **uncertain** and is checked again by its own key, never confirmed. This means the backend must be deployed **before** the new till bundle. |
| A row whose id and slug name different stores was resolved by guessing | It is now held for review and never sent. |
| The ledger converted through floats | `createEntry` parses each amount as an exact decimal (`"1.005"`, `"0.29"`, large values) and balances in integer paisa. Inputs with more than 2 decimals are still accepted but logged (`sale.ledger_unquantized_input`), so the producers can be audited before that becomes a refusal. |
| Tender, change and occurrence time were not part of the intent hash | They are now: a resend that changes them gets 409. |

**Round 2b — mixed cash + card tender (cross-check follow-up).** A total `tendered_amount` alone cannot say how much of it was cash, so it could still create artificial change on a cash + card sale.
- **Server:** cash change now comes only from cash.
  - A v2 till sends `cash_tendered`: the notes handed over for the cash part. Change is `cash_tendered − cash applied`.
  - If `cash_tendered` is less than the cash applied, the sale is refused with 422 `cash_tender_short`.
  - An older till's total `tendered_amount` is trusted only when every money line is cash. With a card, bank or wallet line present it is ignored and logged.
  - There is never change when a credit leg is present, anything is owed, or the excess is kept as an advance.
  - `cash_tendered` is part of the intent hash.
- **Client:** `salePayload` sends `cash_tendered`. The change it shows is capped at the cash given, and is zero when there is a credit leg or the excess is kept as an advance.
- **Tests:**
  - `MixedTenderTest` (7 cases).
  - 3 new client cases in `saleMoney.test.js`.
  - Endpoint case: card 60 + cash 40 with an inflated tender of 500 records change 0. The same payment with a Rs50 note for the cash part records exactly 10 change. Both post cash 40 / bank 60 / revenue 100.
  - All 13 golden till recordings gained `cash_tendered` (the same value as the cash paid in each).

Two test-fixture edits were made, both because the contract now requires it:
- The audit queue rows carry `payload_version: 2`.
- The fake servers in two tests now echo the receipt key, as a v2 server always does.

The golden till test removes `occurred_at` (a timestamp, so it differs every run) after checking it is a valid date.

**Results (isolated):**
- Review suite: 7/7 JS and 3/3 PHP.
- Audit suite: 20/20.
- PHP pure tests: 52 tests, 33,440 assertions (after round 2b), including the exact-decimal ledger and mixed-tender tests.
- Endpoint suite on MariaDB: **18/18** (after round 2b).
- Whole JS suite: 469/470. The one failure is `cards.json`, which is missing from this copy.
- Existing PHP sale, ledger, approval and sync tests: **no failures that are not also failures on the untouched code**.

**Your MariaDB 10.4.32 (XAMPP) is not the target.** Production is 10.5, and my runs used 10.11 configured to report itself as 10.5. Neither result is proof for 10.5. Run the suites on a real MariaDB 10.5 before release.

## What changed (round 1)

### B: One exact calculation (contract v2)

| File | What it does |
|---|---|
| `resources/js/Sell/core/money.js` / `app/Support/Money.php` | Exact decimals (BigInt / brick/math, already locked in composer.lock through laravel/framework) become integer paisa **once**, rounding half-up. They refuse malformed input (`"1,000"`, NaN, more than 6 decimals), negatives where not allowed, and overflow. Allocation uses the largest remainder. |
| `resources/js/Sell/core/saleTotals.js` / `app/Services/Sales/SaleTotals.php` | The sequence from the plan: line gross, then line discount, then the bill discount (rounded once and allocated), then per-line tax (exclusive / inclusive / fixed), then typed charges, then explicit bill rounding. The result is `round_off = invoice − components`. |
| `resources/js/tests/fixtures/sale-totals/cases.json` | **Hand-computed** fixtures (28 cases, including error cases). JS and PHP both run the same file. |
| `resources/js/Sell/core/cartMath.js` | Now an adapter over saleTotals. It returns the same names the screens already read. It also uses a product's own tax rate when one is set (the rule the server already applied). Cart lines carry `product_tax_rate` (Pos.jsx `addToCart`, FOH `useFohOrder`). |
| `app/Services/Sales/PaymentAllocation.php` | Keeps applied money, cash change, customer advance, receivable and tendered amount separate. The identities are asserted. Change only comes out of cash. A bank or card overpayment with no customer advance is refused. A walk-in sale must be paid in full, to the paisa (the old 0.50 tolerance is gone). |
| `app/Engines/AccountingService.php` | `createEntry` refuses non-numeric, non-finite and negative amounts, and balances in **integer paisa**. There is still no tolerance and no adjustment. |

### C: Server integration (`SaleController::store` and `update`)

- The float waterfall in both `store()` and `update()` is replaced by `calculateSaleLines()` (SaleTotals). `update()` used to tax at 4 decimals.
- New validation for `payments.*` (method, amount, account, reference), plus `tendered_amount`, `change_return`, `expected_total`, `calculation_version` and `bill_rounding`.
- **`expected_total`:** if the till's total differs from the server's by even one paisa, the server answers 422 `total_mismatch` and writes **nothing**.
- `postSaleJournal()` is rewritten so that every line comes from the calculation and the allocation. Each account amount is explicit, and the entry is balance-checked in paisa before it reaches the ledger. **The local revenue "drift" patch is removed.**
- **Legacy adapter (explicit and bounded):** a payload without `calculation_version` gets float noise bounded to 6 decimals. Its double-sent "Delivery fee" (`delivery_charge == extra_charge_value` with a delivery label) is folded into one charge and logged as `legacy_delivery_double_folded`.

### D: Checkout identity

- New migration `2026_10_08_000001_add_sale_intent_and_calculation_columns.php` (additive only). It adds `sales.idempotency_request_hash` and `sales.calculation_version`. The code only writes these columns when they exist, so the code can roll out before the migration.
- `CheckoutIntent::requestHash()` hashes the business content only. Approval PIN, shift and register are excluded.
  - Same key with the same content returns the canonical committed sale.
  - Same key with different content returns **409 `idempotency_conflict`** and changes nothing.
  - Lookups ignore every scope, so a soft-deleted sale still owns its key.
- `GET /s/{store}/pos/sales/intent/{key}` (`store.pos.sales.intent`) returns `committed` with the canonical sale, or `not_found`. It is scoped to the store.
- `PosSaleController` answers a replay **before** the shift check. A sale replayed after its shift was closed returns the original sale and is not reassigned to a new shift.
- The activity log after commit can no longer turn a committed sale into a 500. Unexpected failures return `outcome: unknown` plus a `correlation_id`, never raw exception text.

### E: Client and queues

- **`salePayload.js`:**
  - Delivery goes in `delivery_charge` **or** `extra_charge_value`, never both.
  - Cash lines are clamped, and the real tender and change are sent separately.
  - `amount_paid` is now the money actually applied.
  - `tax_exempt` follows the register's tax switch, and `bill_rounding` follows the round-off switch.
  - `expected_total` and `calculation_version` are sent.
  - "Add to ledger" keeps the overpayment as an advance. This was silently lost before.
- **`Pos.jsx` checkout:**
  - The receipt key is created **before the first request** and stored on the sale. The intent is saved to IndexedDB as `uncertain`, with a claim so the background loop leaves the live request alone.
  - The outcome is classified. A confirmed sale is marked synced. A definitive refusal leaves the cart in place and drops the key. 401/403/419 mean nothing was posted.
  - A 5xx, timeout or HTML answer gets a receipt labelled **"PENDING-…" / status unconfirmed** and is reconciled with the same key. It is never labelled "not saved".
- **`useOfflineSync.js`:**
  - Rows are sent only to the store they were rung in. A row with no owner, or no key, is **held for review**.
  - A row is marked `synced` only on a canonical success that names a sale and the matching key.
  - 422 goes to `needs_attention` and is not retried. 409 goes to `conflict`. 429 and 5xx back off with jitter and honour `Retry-After`.
  - An `uncertain` row first asks the status endpoint, then resends with the same key.
  - There is a tab lock plus Web Locks across tabs. One failing row never blocks the next.
  - Nothing unresolved is deleted any more: there is "Mark resolved" (the row is kept), "Check & send again" and **Export**. The browser is also asked for persistent storage, and the Sync Hub warns if it is refused.
- **`LocalDB.js`:** v4 is additive (new indexes only; no table cleared).
- **`SyncService.js`:** the batch is acknowledged **per order**, from the server's `results`, and only for this store's rows. Catalog and staff are replaced in one transaction. An empty `inventory`/`taxes` list never wipes the previous copy.
- **`Api/SyncController::batchOrders`:** returns one result per order (`committed` / `rejected` / `unknown`). There is no longer an outer transaction that could roll back sales already counted.
- **FOH (`Foh/Index.jsx`, `useFohCheckout.js`):**
  - The receipt key now survives a reload (sessionStorage, per order) and is cleared only on settle or on a definitive refusal.
  - A lost answer is reported as "status unconfirmed — press Pay again (same key)".
  - **Offline payment is still refused**, as before.

### F: Observability and test wiring

- `bootstrap/app.php`: the reporter no longer `return false`s, so exceptions reach `laravel.log` again.
- `app/Support/SaleEvents.php`: structured, redacted `sale.*` log events with a correlation id, tenant, user, endpoint and channel.
- `npm run test:sale-reliability` runs all the client gates. The PHP tests sit in the canonical `tests/phpunit.xml` Unit and Feature suites.

## Reviewed fixture changes (not re-recorded)

All 13 golden till recordings were edited by a reviewed script, not re-recorded. Each file's `contract_v2_changes` lists what changed:

- Every recording gains `tendered_amount`, `change_return`, `tax_exempt`, `bill_rounding`, `expected_total` and `calculation_version`.
- **08-rounding:** tax 31.8614 becomes 31.86 (per-line, half-up). The shown total of 219 is unchanged.
- **10-delivery-fee:** `extra_charge_value` 120 becomes 0. The v1 recording sent the 120 delivery twice, and the server posted 1140 against 1020 shown.

The golden test still mounts the real Pos.jsx. It checks that the receipt key is a UUID, then leaves it out of the comparison.

The FOH test now expects "unconfirmed" instead of "NOT recorded", as the plan requires.

## Test results (isolated environment)

The environment was Node 22 / Vitest 4.1.11, PHP 8.3.6, and MariaDB 10.11 presenting as 10.5 so the UUID columns are char(36) like production.

| Suite | Result |
|---|---|
| Audit suite `verification/sale-reliability` (15 original + 5 new) | **20/20 pass** (was 4/15) |
| Shared fixtures + 10,000 seeded carts (JS) | 30/30 |
| Shared fixtures + 3,000 seeded carts + Money (PHP) | 31/31 |
| PaymentAllocation (PHP) | 11/11 |
| Ledger guard (PHP) | 5/5 |
| Real endpoint on MariaDB `PosSaleReliabilityTest` | **14/14** |
| Golden till recordings (real Pos.jsx) / saleCoreMath / FOH | 13 / 13 / all pass |
| Whole JS suite | 447/448. The only failure, `cards.json`, was already failing and is caused by files missing from this copy. |
| Existing PHP sale, ledger, approval, sync and payment suites (about 1,000 tests) | **No new failures against the baseline.** Two split-payment tests did regress, and that was fixed: see the open decision on credit legs below. The remaining failures also fail on the untouched code, or are environment issues in this copy (missing Vite manifest, `resources/data`, layout-law.json, and a Faker email collision). |

## Open decisions (not changed here: owner's call)

1. **Credit legs and the credit limit.** A split payment's explicit `credit` leg still does **not** count against the customer's credit limit. Only an undeclared shortfall does, which is existing behaviour. A split with a credit leg is also still recorded as `payment_status = paid`; `money_status` holds the strict money-only status internally. Changing either is a policy decision.
2. **2050 vs 2060** (customer credit vs customer advance). The mapping is unchanged.
3. **Tender-specific rounding** (cash vs card). Bill rounding is still one store setting, switched per sale by the till.
4. **Payment rows for `credit` legs** are still created, because `Payment::booted` and the shift reports depend on them.

## Not done yet (blocks release)

- **A: evidence.** Export both queue rows from the affected browser **before** shipping the new bundle. The new code keeps old rows: rows without a store are quarantined, and are never replayed automatically. Also collect response bodies, the order ID/link, the deployed source/build hashes, the migration ledger, store settings and timezone.
- ~~Other channels still use their own arithmetic~~: **done in round 3** (V3 engine, online orders, returns, cancellations). Purchases and every other money path: **done in round 4**. Still on their own arithmetic: QR or table on-site order display totals (`OnsiteOrderService`); these post nothing to the books until the till rings them up through the POS.
- ~~Other `createEntry` producers~~: **done in round 4**; their remaining tests and the Vyapar account mapping **done in round 5**.
- ~~Old purchase returns~~, ~~separate-connection concurrency proof~~, ~~FBR outbox~~, ~~reconciliation report and reconnect telemetry~~, ~~CI wiring and float lint~~, ~~real-browser IndexedDB tests~~: **done in round 5** (above).
- **Run the new migrations** with the release: `purchase_items.returned_qty` (round 4), `fbr_outbox` and `pos_queue_telemetry` (round 5). All additive. Then run `php artisan purchases:backfill-returned-qty` (dry run), read it, and run it again with `--apply`.
- **Make the CI jobs required** on `main` (repository Settings → Branches). The workflow file cannot do that by itself.
- **The first real MariaDB 10.5 + PHP 8.4 run** happens in that CI job. This sandbox has only PHP 8.3 and MariaDB 10.11 presenting itself as 10.5, so the round-5 results above are not that run. Read the job's first result before releasing.
- **Run the full PHP suite and `sales:reconcile --fail-on=blocker` on a copy of production data** before release. The report has only seen test data.
- **Check FBR's `USIN` field.** `FbrService` sends the store-wide `fbr_usin` setting with every invoice. Check FBR's integration spec for whether USIN should instead be unique per invoice; this was not changed.
- **FBR duplicates after a crash.** If a process dies after FBR accepted a report but before the outbox row was updated, the retry 5 minutes later sends it again. FBR may then hold it twice. Rare, and visible in the outbox (`attempts`), but not prevented.
- **G: release.** Run the migration, then the backend, then the bundle (an old bundle against the new backend works through the legacy adapter). Follow `RELEASE_AND_DEPLOYMENT_POLICY.md`, run a canary, reconcile daily for seven days, and replay one reconciled sale at a time.
