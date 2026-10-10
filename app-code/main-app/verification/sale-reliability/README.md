# Sale reliability tests

Plan: `docs/SALE_RELIABILITY_PREVENTION_PLAN.md`. Implementation status: `docs/SALE_RELIABILITY_IMPLEMENTATION.md`.

These began on 8 October 2026 as an audit suite that **failed** against the
unfixed code (11 of 15 failing — the negative control proving the tests detect
the defects). The repair (same day) makes them pass; they are now a required
gate, not a manual audit. Do not weaken an expectation or re-record a fixture
to make one pass.

## Run (from `app-code/main-app`)

```powershell
# Client: money, queue, batch/catalog audit + shared fixtures + golden till recordings + FOH
npm run test:sale-reliability

# Server, pure (no database): shared fixtures, seeded carts, payment allocation, ledger guard
& 'E:\Software\Xampp\php\php.exe' vendor/bin/pest -c tests/phpunit.xml --filter SaleReliability
& 'E:\Software\Xampp\php\php.exe' vendor/phpunit/phpunit/phpunit --no-configuration --bootstrap vendor/autoload.php verification/sale-reliability/JournalBalanceGuardTest.php

# Server, end to end on MariaDB through POST /s/{store}/pos/sales (isolated amd_pos_test only)
& 'E:\Software\Xampp\php\php.exe' vendor/bin/pest -c tests/phpunit.xml --filter PosSaleReliabilityTest
```

## What each file covers

| File | Runtime | Covers |
|---|---|---|
| `saleMoney.test.js` | Vitest | paisa representability, weighed line, per-line tax, delivery sent once |
| `offlineQueue.test.jsx` | Vitest (real hook, mocked storage/HTTP) | key reuse, store isolation, legacy quarantine, verified success, no retry of 422, healthy rows not blocked, payload preserved, uncertain → status lookup, HTML 200, 500 never "not saved", wrong-key success refused |
| `catalogAndBatch.test.js` | Vitest (real SyncService) | batch never acknowledged by count, per-order acknowledgement, atomic catalog replace |
| `JournalBalanceGuardTest.php` | PHPUnit, no DB | strict ledger rejects 1/5/50 paisa imbalances and the synthetic double-rounding |
| `resources/js/tests/saleTotalsParity.test.js` + `tests/tests/Unit/SaleReliability/SaleTotalsParityTest.php` | both | the SAME hand-computed fixtures (`resources/js/tests/fixtures/sale-totals/cases.json`) + 10,000 / 3,000 seeded valid carts |
| `tests/tests/Unit/SaleReliability/PaymentAllocationTest.php` | PHPUnit, no DB | change, advance, receivable, order-independence, refusals |
| `tests/tests/Feature/SaleReliability/PosSaleReliabilityTest.php` | Pest + MariaDB | real endpoint: exact journal per account, delivery once, change, per-line tax, total mismatch, walk-in paisa short, replay/conflict, replay after shift close, store-scoped status lookup, post-commit activity failure, bill rounding, legacy payload, batch per-order results |

Verified 8 Oct 2026 in an isolated environment (Node 22 / Vitest 4.1.11; PHP 8.3.6; MariaDB 10.11 reporting as 10.5 so the schema matches production's char(36) UUIDs). Not yet run on PHP 8.4 or real MariaDB 10.5.
