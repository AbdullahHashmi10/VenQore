# Cross-check of Claude's sale-reliability implementation

Date: 8 October 2026 (Asia/Karachi)

## Verdict

Claude implemented a substantial POS-path repair and the available isolated suites pass. It is **not release-ready and does not yet fix every sales channel**. The status document is honest about several blockers, but the working code has additional correctness gaps that its tests do not cover.

## What is genuinely present

- `Money` and `SaleTotals` are shared between JavaScript and PHP, use minor units, and have parity fixtures plus seeded property checks.
- POS `SaleController::store()` and `update()` use the new calculation path.
- The revenue drift patch was removed; `AccountingService` has an exact minor-unit balance check with no tolerance.
- Explicit delivery/extra charge fields prevent the new POS payload from sending delivery twice; a narrowly identified legacy duplicate is folded once.
- POS intents are created before the first request, use a store-scoped idempotency key, and can be queried.
- The post-commit activity failure no longer turns a committed sale into a normal 500.
- POS queue states, store ownership, status lookup, retries and export/resolution UI are substantially improved.
- Generic batch sync now returns per-order outcomes; catalog replacement uses a transaction and does not wipe withheld inventory/tax data.
- Exception reporting is allowed to continue to the normal application log.

Available checks on this machine:

- Sale reliability client suite: **20/20 pass** (from the prior run).
- Shared client suite: **63/63 pass** (from the prior run).
- Pure PHP Money/SaleTotals/PaymentAllocation suite: **42 tests, 33422 assertions pass**.
- Strict ledger review: **5/5 pass**.
- MariaDB endpoint suite was claimed by Claude as 14/14 in its isolated environment, but was not independently rerun here. The local database is MariaDB 10.4.32, while the stated target is MariaDB 10.5; that version difference must be resolved before relying on the claim.

## Release-blocking findings

### 1. Split credit is counted as physical tender in the JavaScript payload

`resources/js/Sell/core/salePayload.js` computes:

```js
const tendered = (paymentData.payments || [])
    .reduce((a, p) => a + minorOf(p.amount), 0n);
```

This includes a `credit` payment leg. For a Rs100 invoice with Rs40 cash and Rs60 credit, the payload reports `tendered_amount = 100`, even though only Rs40 was physically received. The server-side `PaymentAllocation` correctly treats credit as receivable, so the client and server disagree about tendered amount. Depending on `add_to_ledger`, this can affect change, advance, payment status and shift reporting.

The focused review test `remainingRisks.test.jsx` catches this shape. The fix is to compute physical tender from non-credit methods only; keep the credit leg as receivable. Then test cash + credit, card + credit, mixed orderings, and customer advances through the real endpoint.

### 2. Queue replay does not preserve the original accounting date

`useOfflineSync.js` stores `occurred_at`, but `sendOne()` posts `{ ...row.data, idempotency_key: key }` and does not map the stored occurrence date into `sale_date` or another server-recognized accounting-date field. The server therefore defaults to the replay day unless the original payload already had `sale_date`.

This contradicts the implementation claim that original dates are preserved. The queue must persist the original business date/time separately and the server must accept it under the normal backdate/fiscal-period policy. Never silently rewrite `created_at`; preserve occurrence time, posted time and authorized accounting date as separate fields.

### 3. Export can include another store's unresolved rows

`exportUnresolved()` calls `rowsIn(UNRESOLVED)` and serializes every row. It does not apply `belongsHere()` or quarantine filtering, even though normal sending does. On a shared browser, an export from store A can include unresolved rows belonging to store B. This is both a tenant-isolation and sensitive-data issue.

The export must filter to the active tenant/store, with a separate manager-authorized multi-store export if one is ever needed. The focused review test covers this.

### 4. Queue payload versions are stored but not enforced

Rows store `payload_version`, but `sendOne()` does not reject or quarantine an unknown future version. An upgraded client could post a payload it cannot interpret safely. Add an explicit version check before any network call; known legacy versions need a bounded adapter, and unknown versions must be quarantined with export/review.

### 5. Status lookup accepts a committed result without checking the key

In `useOfflineSync.js`, an uncertain row is marked synced when the status endpoint returns `outcome === 'committed'` and a `sale_id`. It does not verify that the response `idempotency_key` equals the row key. A tenant-scoped endpoint is good isolation, but the response still needs identity matching. Otherwise a server/router defect could associate the wrong committed sale with the intent.

### 6. Some success responses remain accepted without a returned matching key

`classifyOutcome()` uses `const keyOk = !data.idempotency_key || !intentKey || data.idempotency_key === intentKey`. A response with no idempotency key is accepted if it has `success` and `sale_id`. For new contract-v2 requests, the key should be mandatory in the canonical response. Only explicitly versioned legacy responses may omit it, and those need a separate compatibility path and audit event.

### 7. Other sale channels still use separate arithmetic

Claude explicitly confirms that `app/Engines/SaleService.php` (including commerce/online completion), returns/cancellations, and V3 paths are not converted. A POS-only fix cannot promise the same defect is gone across the product. Those paths need the same `SaleTotals`, persisted allocation data and channel-specific fixtures before the overall problem can be called fixed.

### 8. Strict ledger validation still converts floats at the boundary

`AccountingService::createEntry()` receives ordinary decimal values, rounds them with PHP float `round()`, then converts to minor units. This is a strong guard compared with the old tolerance, but it is not itself exact decimal arithmetic. Every producer must pass already-finalized amounts; the ledger must remain a validator, not a calculator. Add a test with decimal strings such as `0.29`, `1.005` and large amounts, and audit all callers for float construction.

### 9. Concurrency and browser persistence remain unproven

Claude acknowledges that same-key concurrent requests on separate database connections, real IndexedDB v3→v4 upgrades, multi-tab behavior, storage quota, and the PHP 8.4/MariaDB 10.5 target have not been fully tested. The in-process/unit tests and one-transaction feature tests cannot prove those properties.

### 10. FBR/outbox and reconciliation are unfinished

The FBR call still occurs before the database commit. There is no completed reconciliation report or reconnect telemetry, and CI does not yet require the new suites. These are release gates for a financial checkout path, not optional cleanup.

## Payment-policy decision that remains open

The implementation intentionally leaves credit-leg treatment, account code 2050 versus 2060, and cash/card rounding policy unchanged. Those are valid business decisions, but they must be written down and tested. Until the split-credit tender mismatch above is corrected, the current behavior is internally inconsistent even if the policy is unchanged.

## What can be said now

Claude did not “fix everything.” It delivered a strong, tested first implementation for the POS checkout and queue path. It materially reduces the original one-paisa failure and the false-offline loop, but it is still a staging candidate. Do not run the migration, deploy the bundle, or replay the two old queue rows until the release blockers above are fixed, the actual affected payloads are exported, and the target MariaDB/PHP test matrix passes.
