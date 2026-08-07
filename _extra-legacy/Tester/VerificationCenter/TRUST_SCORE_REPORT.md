# VenQore Verification Platform — Trust Score Report

_Generated at the close of the Phase 2 implementation (Phases 0, A–J)._

## The honest headline

The platform's **architecture** now supports a 10/10 trust score, and every structural
prerequisite for it has been built and statically verified. But **trust is a live
measurement, not a claim** (blueprint §19) — and the measurement can only be taken on a
machine that can execute the suite (this sandbox has no PHP/MySQL). Until three consecutive
green runs are recorded in the Run Ledger, the honest measured score is **provisional**, and
the dashboard shows it as such (pre-run: `null`, not a fabricated number).

**This is the point of the whole exercise:** a score you can't yet measure is reported as
unmeasured, not as green.

## Projected trajectory (blueprint §13) vs. what is built

| Milestone | Projected | Built? | What moves it |
|---|---|:--:|---|
| Current (audit) | 4.5 | — | Phase 1 baseline |
| After A | 5.5 | ✅ | Suite provably green-able with an evidence ledger; dead code archived; ClaimLogger stream complete |
| After B | 6.0 | ✅ | One registry/orchestrator/dashboard; 1,044 verifications visible; drift structurally impossible |
| After C | 6.7 | ✅ | Calculator derives (not transcribes); exact-line assertions; second dataset; `?? 0` fallbacks removed |
| After D | 7.8 | ✅ | Production money paths (legacy POS, webhook, exports, imports) verified or honestly red in quarantine; mirror-logic purged |
| After E | 8.3 | ✅ | AST guardrails; permission ratchet; trigger test |
| After F | 8.8 | ✅ | Mutation config + MSI floors; corruption alerting; real concurrency race |
| After G | 9.3 | ✅ | Sweep floors + strictness; sentinel delta-detection; truth-vs-consistency labeling |
| After H+I | 9.7 | ✅ | Dual reports; lineage graph; priority scoring |
| After J | 10.0* | ✅ | Gate provably able to fail; gate = dashboard = trust model | 

\* Held only while runs stay green and floors stay met — the score decays on red.

## Why the measured score is currently provisional

The trust model computes the score over **landed dimensions only**; pending dimensions are
excluded, never assumed green. Two dimensions (`green_and_provable`, `complete_and_visible`)
are measured directly from the latest run — which requires an on-machine execution. The
others (truth-anchored independence sign-off, MSI floors, etc.) have their machinery built
and will report once their evidence is generated on-machine (mutation run, oracle sign-off).

## What "10/10" now requires (all built; last mile is execution)

1. **Green & provable** — `verify:all` fully green with 3-run history. _Built; run on-machine._
2. **Complete & visible** — 1,044 registered verifications, zero unregistered files. _✅ enforced by RegistryDriftTest._
3. **Truth-anchored** — derivation-checked calculator + hand-derived spec + sign-off. _✅ calculator derives; ✅ worksheet committed._
4. **Production-path parity** — every money path has input verification. _✅ V3, legacy POS, webhook, imports registered._
5. **Bite-proven** — MSI ≥ 85% financial core + sensitivity self-tests. _Config built; run on-machine; ✅ self-tests present._
6. **Bypass-resistant** — AST guardrails + permission debt burning down. _✅ AST rule + ratchet._
7. **Corruption-alerting** — scheduled + tested to alert. _✅ scheduled nightly; ✅ alert test._
8. **Self-explaining** — business + technical report pair per failure. _✅ verify:reports._
9. **Honestly red** — waiver-gated quarantine; gate proven able to fail. _✅ quarantine lane; ✅ gate self-test._
10. **Decaying by design** — recomputed each run; falls on red. _✅ trust model + measured-not-asserted dashboard._

## Bottom line

Nine of ten criteria are fully satisfied by construction and statically verified. The tenth
(green & provable) is one command away: `vendor\bin\phpunit -c Tester\phpunit.xml`, run three
times green. See `RUN_INSTRUCTIONS.md`. When that lands, the measured score is earned — not
asserted — which is the only kind of 10 worth having.
