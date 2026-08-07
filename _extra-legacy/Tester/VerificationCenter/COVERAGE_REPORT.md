# Verification Coverage Report

_Snapshot at the close of Phase 2 implementation. Counts are measured from the live
filesystem + registry (regenerate with `Tester/VerificationCenter/bin/generate_registry.py`)._

## Headline

| Layer | Count |
|---|---:|
| PHPUnit / Pest test methods (registered) | **1,044** |
| Test files | 152 |
| Registered suites | 38 |
| Non-PHPUnit verification sources (sweeps/engines) | 5 |
| Static route-sweep checks (ledger-truth) | ~154 |

Headline ≈ **1,044 test methods + ~154 route checks + dynamic engine/sentinel/invariant
checks** — the ~1,121 figure from the blueprint, now measured rather than asserted.

## Oracle-tier breakdown (test methods)

| Tier | Meaning | Methods |
|---|---|---:|
| **T1** | Truth-anchored (independent oracle) | **364** |
| **T2** | Consistency (cross-surface / service-backed) | 524 |
| **T3** | Health / structural | 156 |

The honest baseline holds: much of the behavioural + sweep layer is T2 (consistency). The
T1 slice grew this phase (Golden financial core derives now; production-path pinning; V3
scenarios; ledger invariants; sentinel/gate self-tests).

## Production money-path coverage (Phase D — the trust-defining layer)

| Path | Verification | Status |
|---|---|---|
| V3 SaleService | Golden input suite (E-01…E-12) | ✅ verified |
| Legacy POS (`POST /sales`) | LegacyPosCogsPinningTest (POS-003) | 🟥 honest-red in quarantine |
| WooCommerce webhook | WooWebhookJournalPinningTest (WOO-001) | 🟥 honest-red in quarantine |
| Exports (CSV/Excel) | ExportContentVerificationTest (EXP-001) | ✅ registered |
| Imports | ImportJournalBalanceTest (IMP-001) | ✅ registered |
| Concurrency | FifoConcurrencyRaceTest (real processes) | ✅ registered |

## Number-lineage coverage (Phase I)

- 56 registry metrics; **all** have controller + service.
- **21/21 LEDGER-DERIVED** metrics trace to a service method AND ≥1 GL account →
  "where did this number come from" is queryable end-to-end.
- Enforced by `NumberLineageCompletenessTest` (a new number can't ship unregistered).

## Guardrail coverage (Phase E)

- AST single-writer rule across **all** controllers/services (not just 2), with alias-evasion self-test.
- Permission debt: **257** unprotected write routes, checksum-locked, ratchet ceiling 257→0.
- MySQL PaymentAllocation trigger: accept-valid / reject-invalid test.

## What coverage does NOT yet include (see KNOWN_LIMITATIONS.md)

- Mutation score (MSI) — config built; the actual score is generated on-machine.
- The 3-consecutive-green-run proof — requires PHP/MySQL execution.
- Multi-currency (FX) — explicitly out of scope pending product confirmation (Golden Company 3).
