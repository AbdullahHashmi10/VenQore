# Test Inventory and Duplicate Analysis

Complete forensic inventory of every test in the repository, as of the
consolidation. Nothing was deleted; everything below is classification only.

Regenerate the raw data at any time:

```
php FinalTester/Scripts/expected.php     # authoritative, from PHPUnit
```

---

## 1. Where tests were found

A full-repository sweep (excluding `vendor/`, `node_modules/`, `.git/`) found
these test directories:

| Location | Status | Files | Test methods | Executed? |
|---|---|---|---|---|
| `Tester/tests/` | **LIVE** — composer maps `Tests\` here | 227 | 1322 | Yes |
| `tests/` | **STALE COPY** — legacy | 88 | 642 | Only by accident (see §3) |
| `FinalTester/tests/` | **NEW** — unified workspace | 231 | 1358 | Yes |
| `resources/js/tests/` | Frontend JS | — | — | Separate toolchain |
| `AMD_POS_Update_v4.2.7/Tester/` | Release snapshot | — | — | No — archive |
| `VenQore_Local/tests/` | Local working copy | — | — | No — archive |
| `_VERIFICATION_BASELINE_2026-07-10/` | Frozen baseline | — | — | No — archive, intentional |
| `amd_erp_mobile/test/` | Flutter mobile | — | — | Separate toolchain |

The four archive locations are point-in-time snapshots. They are correctly
excluded and should stay that way — a frozen baseline you can diff against is
worth keeping.

### Supporting infrastructure found

- **PHPUnit configs:** `phpunit.xml.dist` (root, points at `Tester/tests`),
  `Tester/phpunit.xml` (points at `tests/` relative to `Tester/`), plus archived copies
- **Pest configs:** `Tester/tests/Pest.php`, `tests/Pest.php`
- **Bootstrap:** `Tester/bootstrap.php`
- **Base classes:** `TestCase`, `VenQoreTestCase`, `SmokeTestCase`,
  `InputVerificationTestCase`, `OutputVerificationTestCase`, `SentinelTestCase`
- **Support:** `GoldenSeedManager`, `Quarantine`, `RequiresGoldenCompany`,
  `RunLedgerExtension`, `RunLedgerCollector`, `fifo_deduct_worker.php`
- **Verification engines:** 10 classes under `Feature/Golden/Verification/Engines/`
- **Artisan test commands:** `audit:ledger-truth`, `verify:dashboard-data`,
  `GoldenVerifyCommand`, `AuditFinancialIntegrity`, `AuditMassAssignment`,
  `PermissionsCoverage`, `DataIntegrityAuditCommand`, `ConcurrencyTest`
- **Runners:** 3 Node dashboards (ports 7821/7822/7823), 4 BAT launchers,
  `run_production_smoke_tests.ps1`
- **Run ledger:** 22 recorded runs under `Tester/VerificationCenter/runs/`

---

## 2. Breakdown by area (FinalTester, 1358 tests)

| Area | Files | Tests |
|---|---:|---:|
| Golden (financial verification) | 23 | 217 |
| Tools (public calculators) | 28 | 193 |
| V3 service scenarios | 11 | 135 |
| Smoke | 3 | 66 |
| Chat / SmartCapture | 6 | 60 |
| Money (financial integrity) | 21 | 52 |
| Billing | 5 | 40 |
| DemoStore | 2 | 39 |
| Module19 (VenSynQ + marketplace) | 4 | 35 |
| Module21 (real workflow integration) | 1 | 34 |
| Auth | 6 | 28 |
| Guardrails | 12 | 28 |
| Core (architectural invariants) | 11 | 27 |
| Module05 (financial engine) | 1 | 22 |
| Modules 01–20 (remaining) | 20 | 158 |
| Root-level Feature tests | 47 | 156 |
| Production (quarantine lane) | 4 | 5 |
| Routes (new) | 1 | 6 |
| Unit | 2 | 9 |
| Performance | 1 | 1 |

Note the shape: 217 tests on Golden financial verification and 193 on public
marketing tools. The financial core is genuinely well covered. Some operational
modules are covered by a single file — see §5.

---

## 3. The execution gap — the most important finding

The run ledger is unambiguous. Compare `argv` across recorded runs:

| Run | argv | Total executed |
|---|---|---:|
| 2026-08-01 16:27 | `pest -c Tester/phpunit.xml` | **1322** |
| 2026-08-02 01:18 | `pest --configuration Tester/phpunit.xml` | **1322** |
| 2026-08-02 01:25 | `pest tests --configuration Tester/phpunit.xml` | **642** |
| 2026-08-02 01:28 | `pest tests --configuration Tester/phpunit.xml` | **642** |

The dashboard (`Tester/VerificationCenter/test-runner.js` line 228) builds its
command with a positional `tests` argument:

```js
const modules = ['tests'];
const cmd = `... vendor/bin/pest ${modules.join(' ')} --configuration Tester/phpunit.xml ...`;
```

A positional path argument overrides the configuration's testsuite paths.
Relative to the project root, `tests` resolves to the **stale legacy folder** —
and 642 is exactly the legacy folder's test-method count.

**Every dashboard-initiated run for the life of that file executed 642 tests
from a stale copy while appearing to test the product.** 716 tests — 53% of the
estate — were never running.

FinalTester eliminates this by construction: `Scripts/run.bat` is the only
execution path and never passes a positional path.

---

## 4. Duplicate analysis

`tests/` (legacy, 88 files) against `Tester/tests/` (live, 227 files):

| Classification | Count | Verdict |
|---|---:|---|
| **Byte-identical duplicates** | 49 | Dead weight. Harmless but confusing. |
| **Diverged duplicates** | 36 | **Dangerous.** Same path, different content. |
| **Orphans (legacy only)** | 3 | **Rescued into FinalTester.** |

### Diverged duplicates — the legacy copy is behind

In every case the live version has more or equal tests. Notable gaps:

| File | Legacy | Live | Lost if legacy ran |
|---|---:|---:|---|
| `Feature/DocumentConversionTest.php` | 4 | 8 | 4 tests |
| `Feature/RegressionFixesTest.php` | 11 | 15 | 4 tests |
| `Feature/SystemResetTest.php` | 6 | 8 | 2 tests |
| `Feature/Module08/InventoryTest.php` | 7 | 8 | 1 test |
| `Feature/Auth/AuthenticationTest.php` | 12 | 13 | 1 test |
| `Feature/TerminalAppIntegrationTest.php` | 5 | 6 | 1 test |
| `Feature/Module17/SettingsTest.php` | 10 | 8 | *legacy has 2 extra* |

Also diverged: `VenQoreTestCase.php` (414 vs 517 lines) and `SmokeTestCase.php`
— the legacy base classes are materially older, which is why legacy runs
produced such different error profiles.

`Module17/SettingsTest.php` is the one case where legacy has *more* tests than
live. Worth a human look: either two tests were deliberately removed, or they
were lost. Both copies are preserved; nothing was decided automatically.

### The 3 orphans — rescued

These existed **only** in the legacy folder and were therefore in no executed
suite. All three are high-value ledger tests:

| File | Tests | What it protects |
|---|---:|---|
| `Feature/Module19/VenSynQIntegrationT16Test.php` | 15 | VenSynQ platform clients (Amazon, eBay, TikTok, Woo), integration health. Each pins a specific defect from the T16 audit. |
| `Feature/Module19/MarketplaceClearingT17Test.php` | 13 | Marketplace clearing pipeline. Every test asserts double-entry stays balanced — an unbalanced marketplace journal silently corrupts the Balance Sheet for every tenant using online channels. |
| `Feature/GoldenAuditTestsTest.php` | 2 | Runs the ledger-truth audit and the Golden Audit seeder as a test. |

**30 tests guarding marketplace ledger integrity were sitting in a folder
nothing executed.** They are now in `FinalTester/tests/` and run with everything
else.

### Dead / archived, left in place

- `Tester/_archive/2026-07_Golden-legacy-copy/` — 20 files, superseded
- `Tester/_archive/2026-07_dead-base-class/` — explicitly dead
- `Tester/dashboard/{`, `Tester/VerificationCenter/{` — zero-byte files from a
  shell redirect accident
- `Tester/VerificationCenter/_*.txt` — six zero-byte scratch files
- `dashboard.html.bak_pre_merge_2026-07-11`

Correctly archived and clearly labelled. Leave them.

---

## 5. Coverage gaps

Ranked by risk to launch.

**High**

1. **Offline sync** — `Module18/OfflineDrmTest.php`, 7 tests, for the
   Dexie/IndexedDB offline POS. This is the feature most likely to lose a
   customer's money and it has the thinnest coverage relative to its risk.
   There is one idempotency guardrail; there is no test for conflict resolution
   on reconnect.
2. **Manufacturing / composite products** — `Module09`, 7 tests, for Mode A
   (make-now, auto-deduct raw materials) and Mode B (ready-made). The FIFO
   interaction here is intricate and under-tested.
3. **Platform / SuperAdmin routes** — 130 `platform.*` and 5 `superadmin.*`
   routes are not swept by `audit:ledger-truth`, which filters to `store.*`.
   The new `FullRouteSweepTest` covers them statically; nothing exercises them
   over HTTP.

**Medium**

4. **Concurrency** — one FIFO race guardrail (`FifoConcurrencyRaceTest`) and a
   worker script. Multi-terminal simultaneous sale against one stock batch is
   the classic POS failure and deserves more.
5. **Performance** — a single test (`SnapshotPerformanceTest`). No regression
   budget on POS load or report generation.
6. **Woo webhook replay** — pinning tests exist, but idempotency under
   duplicate webhook delivery is thin.

**Low**

7. Tools have 193 tests for public marketing calculators — the best-covered
   area in the estate, and not where launch risk lives. Not a criticism, just
   worth knowing when reading the totals.

---

## 6. Excluded from execution — and why

Every discovered test now belongs to an executed suite, with these deliberate
exceptions:

| Excluded | Why |
|---|---|
| `Tester/_archive/**` | Explicitly archived, superseded copies |
| `AMD_POS_Update_v4.2.7/**` | Release snapshot |
| `VenQore_Local/**` | Local working copy |
| `_VERIFICATION_BASELINE_2026-07-10/**` | Frozen baseline for diffing |
| `resources/js/tests/**` | Frontend JS, different toolchain |
| `amd_erp_mobile/test/**` | Flutter, different toolchain |
| `tests/**` (legacy) | Superseded — 3 orphans rescued, rest are stale duplicates |
| Support classes, engines, base classes | Not tests; no `Test.php` suffix |

Nothing is silently ignored.
