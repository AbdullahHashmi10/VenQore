# VenQore Verification Center

One registry. One orchestrator. One dashboard. One source of truth.

## Start here

- **Run everything:** `php artisan verify:all` (see `RUN_INSTRUCTIONS.md`)
- **Refresh the dashboard:** `php artisan verify:dashboard-data`, then open `dashboard.html`
- **Launch decision:** `php artisan verify:launch-gate`
- **Failure reports:** `php artisan verify:reports` → `reports/`

## What's here

| Path | What |
|---|---|
| `registry/suites.yaml` | Every suite + source, oracle-tiered. Validated by `RegistryDriftTest`. |
| `registry/trust_model.yaml` | The 10 weighted trust dimensions. Read by dashboard AND gate. |
| `registry/quarantine.yaml` | Honest-red waivers for known bugs (POS-003, WOO-001). |
| `registry/permission_ratchet.yaml` | 257-route permission debt, checksum-locked, burning down. |
| `registry/ORACLE_REGISTRY.md` | T1/T2/T3 tier definitions + honest baseline. |
| `dashboard.html` | The One Dashboard (measured trust, tiers, latest run). |
| `runs/` | Append-only Run Ledger evidence (one dir per run). |
| `reports/` | Business + technical report pairs per failure. |
| `bin/generate_registry.py` | Regenerate `suites.yaml` after adding/removing tests. |

## The reports (read in this order)

1. `FINAL_VERIFICATION_REPORT.md` — why the platform deserves its trust level; every audit finding → fix.
2. `TRUST_SCORE_REPORT.md` — the measured-vs-projected score and what the last mile is.
3. `COVERAGE_REPORT.md` — the numbers (1,044 methods, tier breakdown, money-path coverage).
4. `KNOWN_LIMITATIONS.md` — what's honestly not done.
5. `MIGRATION_LOG.md` — per-phase record (Phases 0, A–J).
6. `CHANGELOG.md` — every file added/modified/archived.

## The one rule that keeps it honest

Trust is **measured every run and decays on red** — the dashboard never shows an asserted
number. If you add a test, regenerate the registry (`bin/generate_registry.py`) or
`RegistryDriftTest` fails. If a known critical bug's waiver expires, the launch gate blocks.
That is the point.
