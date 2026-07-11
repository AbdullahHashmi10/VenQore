# Oracle Registry — how each verification knows what "correct" is

Blueprint §5.3 / §19.3. Every suite and source in `suites.yaml` carries an
`oracle_tier`. This document defines the tiers and the honest baseline. The tier
is **machine-checked** by `RegistryDriftTest` (every member must declare a valid
tier) — it cannot be left blank or invented.

## The three tiers

| Tier | Name | What "correct" comes from | Trust weight |
|---|---|---|---|
| **T1** | Truth-anchored | An oracle independent *by construction*: a hand-derived spec + a derivation-checked calculator, or a pure ledger invariant (SUM debit = SUM credit) that no report service can influence. Disagreement means a real bug. | Highest |
| **T2** | Consistency | Compares two surfaces, or compares a page against a service that *also powers that page*. Catches drift/contradiction, but a bug in the shared service hides from both sides. Honest name: consistency, not truth. | Medium |
| **T3** | Health / structural | Existence, wiring, architecture rules, docs, meta-tests. Proves the machine is assembled correctly, not that the numbers are right. | Structural |

## The honest baseline (today)

The blueprint is explicit: **"today most of the sweep layer lands in T2."** We do not
pretend otherwise.

- The **154-route Ledger Truth Sweep** is **T2** today — its control values come from
  `FinancialReportingService`, the same service powering the pages it checks (audit
  FC-4). Phase G adds a **T1 manifest layer** for the Golden-Audit tenant and renames
  the surfaced output "Consistency Sweep" vs "Truth Sweep" so the dashboard never
  overstates.
- **`audit:data-integrity`** is **T1** — a pure double-entry invariant, independent of
  any report service.
- **`verify:sentinel`** is **T1** — a detector self-test; it only passes if the probe
  actually fires (E-12 sensitivity pattern).

## Tier assignment rules (as encoded in the generator)

- `Feature/Golden/` financial-core input/output verification, FIFO, COGS, adversarial,
  edge-cases → **T1** (verified against the hand-derived Golden manifest; Phase C makes
  the calculator *derive* rather than transcribe, hardening this claim).
- `Feature/Golden/` cross-surface / dashboard / report / formatting / clock / filter →
  **T2** (consistency across surfaces).
- `Feature/Golden/` LaunchGate / Architectural / Sentinel-audit / Golden-audit → **T3**
  (structural / gate meta-tests).
- `Feature/Money/` reconciliation & precision → **T1** (independently-derived
  expectations; mirror-logic purged in Phase D).
- `Feature/V3/` service scenario tests → **T1** (exercise the financial core directly).
- `Feature/Core/`, `Feature/Guardrails/`, `Feature/Smoke/` → **T3** (meta / architecture / smoke).
- Ledger / PaymentAllocation / Accounting integration → **T1** (ledger invariants).
- Everything else (module & misc behavioural) → **T2** (conservative default).

## Independence review requirement

Blueprint §19.3 requires signed independence review for T1 oracles. `ORACLE_INDEPENDENCE.md`
(authored in Phase D) holds the sign-off that no T1 oracle imports or re-implements the
service logic it checks. Phase C commits the hand-computation worksheets for the Golden
Company 2 dataset so a T1 claim can be audited by hand.

## Why tiers matter to the trust score

The trust model (Phase J) weights green results by tier: a wall of green T3 health checks
cannot lift the score the way T1 truth-anchored greens do. This is what stops
"counting, not weighing" (audit FC-1) at the score level, not just the gate.
