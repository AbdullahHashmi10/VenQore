# Skipped-test audit

Audit date: 2026-09-10  
Source run: `tests/reports/junit.xml` (2026-09-08)  
Reported skipped tests: **134**

## Disposition

| Count | Area | Why skipped | Classification | Required action |
|---:|---|---|---|---|
| 122 | `Reckoner/Laws/L8RegistryContractTest` | Data-provider cases deliberately select one of two mutually exclusive contracts: source-backed readings skip derived-reading assertions, while derived readings skip source-backed assertions. Two platform readings also have no tenant permission requirement. | Structural/data-driven; legitimate, but noisy | Replace skip-based branching with separate providers for source-backed and derived readings so non-applicable cases are not reported as skips. This is test-harness cleanup, not a launch correctness failure. |
| 4 | `Tools/QrCodeToolTest` | Raster/render assertions require the optional `endroid/qr-code` package, which was not installed in the recorded environment. Payload-format tests still run. | Dependency-dependent | Install and lock the QR package if QR rendering is launch scope; otherwise keep the feature hidden and retain the explicit skip. |
| 2 | `Golden/ArchitecturalEnforcementTest` | Static-analysis inputs were absent in the recorded checkout. The helper marks a missing source file as skipped. | Suspicious/environment drift | Re-run after autoload restoration and record the exact missing paths. A canonical source file must not silently disappear in CI. |
| 1 | `Golden/EdgeCasesTimeConcurrencyTest` | Environment-dependent edge/concurrency prerequisite was unavailable. | Environment-dependent | Run in the MySQL integration lane and record the emitted skip reason in the next JUnit artefact. |
| 1 | `Guardrails/FifoConcurrencyRaceTest` | Requires MySQL row locks and a worker process/script visible to spawned PHP processes. | Environment-dependent; legitimate locally | Keep in a dedicated serial MySQL integration job. A launch candidate needs at least one green run from that lane. |
| 1 | `Guardrails/PaymentAllocationTriggerTest` | Requires MySQL and the `chk_allocation_insert` trigger. | Environment-dependent; legitimate locally | CI must migrate MySQL and run this test; absence of the trigger in CI is a failure in environment provisioning, not a reason to waive the invariant. |
| 1 | `Production/LegacyPosCogsPinningTest` | Quarantined known issue `POS-003`; the test remains incomplete while its waiver is valid. | Known defect/quarantine | Track the waiver expiry and do not count this as passing coverage. Remove quarantine only after FIFO-derived COGS behavior is proven. |
| 1 | `Production/WooWebhookJournalPinningTest` | Quarantined known issue `WOO-001`; the test remains incomplete while its waiver is valid. | Known defect/quarantine | Track the waiver expiry and do not count this as passing coverage. Remove quarantine only after webhook-created sales produce a balanced journal. |
| 1 | `Reckoner/ReckonerConsistencyTest` | Fixture lacks an inventory-capable seeded product, so the capability gate blocks the assertion. | Fixture gap | Seed the required product/capability explicitly; this should not remain a permanent skip. |

Total classified: **134 / 134**.

## Gate policy

- Skipped and incomplete tests are not green evidence.
- MySQL/trigger/concurrency checks belong in a serial integration lane; never run database-mutating suites in parallel against the same schema.
- Quarantine entries need an owner, reason, and expiry. An expired waiver must turn the test red.
- The next complete run should write a new JUnit file rather than overwrite this historical artefact, then this audit should be updated with exact runtime messages.

## Current rerun constraint

The repository now requires PHP **8.4.1 or newer**. The available local PHP is **8.2.12**, so a normal `composer dump-autoload` and the post-T-21 PHPUnit run cannot complete on this machine. `composer dump-autoload --ignore-platform-reqs` successfully regenerated the classmap and restored all 13 `App\\Services\\V3` entries, but it is not a substitute for the required PHP 8.4 CI run.
