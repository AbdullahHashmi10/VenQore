# VenQore Verification Blueprint

**The master implementation plan for total data-integrity verification before launch.**
Plan only — no test code here. This is the document a QA team implements phase by phase.

Corrections applied to the original brief: VenQore runs **Laravel 12** (not 11), and per project policy **all testing runs on MySQL** (`amd_pos_test`) — SQLite is banned everywhere, including tests. Smoke tests against `venqore_pos` are read-only.

---

## The Three-Direction Doctrine

Every number in VenQore lives on one of three legs. Each leg is verified independently, so a bug cannot hide by being "consistent with another bug":

1. **INPUT → CORE**: every business event (sale, purchase, return, payment, adjustment, import, webhook, job) must land in the Ledger correctly.
2. **CORE**: given a Ledger, the accounting engine must be mathematically incapable of producing a wrong statement, balance, or valuation.
3. **CORE → OUTPUT**: every card, report, chart, export, and API response must equal the Ledger — never a raw table, never a cache, never its own math.

A fourth, orthogonal direction binds them: **CONSISTENCY** — the same metric shown in N places must be byte-identical in all N.

---

## Phase 0 — System Inventory & Dependency Map

**Objective:** Before testing anything, know everything that displays a number and where that number comes from.

**Work:**
- Script-scan `routes/web.php` + `routes/api.php` → enumerate every route, its controller, and its Inertia page (181 controllers, 228 pages).
- For each controller method, record every model/service it touches (static scan for `Model::`, `DB::table`, service injections).
- Produce the **Number Registry**: a machine-readable YAML file listing every displayed metric → `{page, component, controller@method, service, source query, ledger accounts involved}`.
- Classify every metric as: `LEDGER-DERIVED` (correct), `TRANSACTION-DERIVED` (suspect — flag), `HYBRID` (suspect), `NON-FINANCIAL` (out of scope).

**Why it matters:** You cannot claim "nothing unchecked" without a total enumeration. The Registry is also the coverage denominator — coverage % = verified metrics / Registry entries.

**Risks prevented:** Blind spots; "we forgot that widget" class of failures. The classification step alone will likely surface the inconsistencies you saw in your UI review, before a single test exists.

**Tech:** PHP static analysis (nikic/php-parser or simple regex scanning), one artisan command `verify:map` that regenerates the Registry and fails CI if a new route/metric appears unregistered.

**Effort:** 3–5 days. **Runtime:** seconds. **Confidence gained:** ~0% → 15% (knowledge, not proof). **Blind spots after:** dynamic queries built from strings; JS-side calculations (covered in Phase 10).

---

## Phase 1 — The Golden Company (Deterministic Seeded Universe)

**Objective:** One fictional tenant with 365 days of fully journalized business history where every expected value is known **before** seeding.

**Design rules:**
- **Truth-first authoring.** The dataset is authored as a spec, not generated randomly. A single source file (YAML/CSV per month) declares every transaction: date, type, party, lines, tax, payment terms. The seeder is a dumb executor of that spec.
- **Expected Values Manifest.** A second machine-readable file, derived from the spec by an independent calculator (a small standalone script that knows accounting but shares zero code with the app), states for every month and for year-end: revenue, COGS, gross/net profit, cash, bank, AR, AP, tax liability, inventory valuation, per-account trial balance, per-customer/vendor balances, per-product stock and FIFO layers, expected dashboard card values, expected report totals, expected chart points.
- **Human document.** The same manifest rendered as `GOLDEN_COMPANY.md` so you personally can open any page and know what it must say for "today", "last month", "last year".
- **Content requirements:** 2+ branches, 2+ warehouses, composite products (both Make-Now and Ready-Made modes), batch + serial + multi-unit + multi-barcode products, negative-stock incidents, cash/credit/split/partial payments, overpayments, refund chains, partial refund chains, voided and reversed transactions, discounts (0%, partial, 100%), taxes at multiple rates, expenses, transfers, opening balances, seasonality (a strong month, a loss month, a zero-activity day), a WooCommerce-originated sale, an Excel-imported batch, a second tenant with data that must NEVER leak into tenant one.
- **Determinism:** fixed IDs, fixed timestamps (frozen clock via Carbon test-now), fixed sequence — re-seeding twice yields byte-identical databases. Manifest is checksummed; tests refuse to run if seed ≠ manifest version.

**Why it matters:** This turns every test from "does it look right" into "does it equal the pre-declared truth." The independent calculator is the crucial trick: the app and the manifest must agree, and they were computed by two different brains — agreement is evidence, not tautology.

**Dependencies:** Phase 0 (to know which features need data coverage).
**Tech:** Laravel seeders + factories reading the spec files; standalone PHP or Python calculator; frozen time.
**Effort:** 5–8 days (the biggest single investment; everything else leans on it). **Runtime:** seed in <30s on MySQL. **Confidence:** foundation — enables all later phases. **Blind spots:** scenarios not authored into the spec; mitigated by Phase 8 property tests.

---

## Phase 2 — Ledger Invariant Suite (Core Integrity, runs first, always)

**Objective:** Prove the Ledger itself can never be silently inconsistent. If this fails, nothing downstream is meaningful.

**Invariants (each is a standalone test, runnable against ANY database including read-only smoke runs on `venqore_pos`):**
- Every `JournalEntry`: Σdebits = Σcredits, to the exact decimal.
- Global: Σ all debits = Σ all credits per tenant, per branch, per period.
- Trial balance nets to zero at every month-end.
- Accounting equation: Assets = Liabilities + Equity at every point in time.
- No orphaned `JournalItem` (entry deleted), no `JournalEntry` pointing to a deleted/missing `Transaction` unless explicitly a manual entry.
- Every `TransactionAllocation` references a valid `JournalEntry` ID — never a Payment ID (the documented PurchaseService trap; make it a permanent invariant).
- No journal item with `tenant_id` differing from its entry's tenant. No cross-tenant references anywhere (FK sweep).
- Stock ledger ↔ financial ledger: inventory asset account balance = Σ(FIFO layer qty × cost) at all times.
- AR control account = Σ customer open balances; AP control = Σ vendor open balances.
- No entries dated inside a locked period; no NULL/zero-line entries; no duplicate idempotency keys.
- Decimal hygiene: no value stored with more precision than the column defines; no float-typed money anywhere (schema assertion).

**Why it matters:** These are the invariants a bank runs nightly. They catch corruption regardless of which feature caused it.

**Deliverable form:** a `verify:ledger` artisan command + PHPUnit wrappers. The command doubles as a **production health check** you can run against a live tenant read-only.

**Effort:** 3–4 days. **Runtime:** <10s on Golden Company; minutes on large data. **Confidence:** 15% → 40% for core integrity. **Blind spots:** an internally consistent but *wrong* ledger (e.g., both sides of a wrong amount) — that's Phase 3's job.

---

## Phase 3 — Input Verification (every event → correct journal)

**Objective:** For every event type that creates business data, assert the exact journal entries, stock movements, and party-balance effects.

**Method:** For each event type, a test that (a) executes the event through the **real entry point** — the HTTP endpoint, not the service directly, so middleware/validation/tenant-resolution are included — then (b) asserts the precise debit/credit lines against a per-event expectation table, and (c) asserts the Phase 2 invariants still hold.

**Event catalog to cover (each × happy path + edge variants):** cash sale, credit sale, POS offline-sync sale, WooCommerce webhook sale, sale return (full/partial), purchase, purchase return, expense, payment received/made, partial payment, overpayment, allocation to multiple invoices, transfer between funds/banks/warehouses, inventory adjustment (up/down), composite manufacture Mode A and Mode B, opening balance, journal entry (manual), Excel import, void, reversal (SaleReversalService), scheduled command effects, queued job effects.

**Bypass detection (the adversarial heart):** additionally, for each event type, a **negative-space test**: create the raw record while suppressing journalization (test hook or direct model insert) and assert that `verify:ledger` and the Phase 5 output tests now FAIL loudly. If any report still shows the value, that report bypasses the Ledger — the test names it.

**Effort:** 8–12 days (largest test-writing phase; ~30 event types × variants). **Runtime:** 1–3 min. **Confidence:** 40% → 65%. **Blind spots:** race conditions and concurrency (Phase 9); events triggered only in production integrations (mitigate with recorded webhook fixtures).

---

## Phase 4 — Financial Core Verification (the engine's math)

**Objective:** Given the Golden Company ledger, every derived financial computation equals the Manifest.

**Coverage:**
- Trial Balance, Balance Sheet, P&L, Cash Flow, Retained Earnings — for every month, every quarter, YTD, full year, and arbitrary custom ranges (including ranges crossing year-end).
- Balance Sheet must balance for **every possible as-of date** in the 365-day window (loop all dates — cheap and brutal).
- FIFO: per-product layer-by-layer assertions after each movement in the spec; COGS per sale matches manifest; negative-stock costing rule asserted explicitly (define the rule, then test it).
- Inventory valuation = stock ledger = balance sheet inventory line (three-way tie).
- Tax computations per rate, per period, inclusive vs exclusive pricing.
- Rounding policy: define once (e.g., round half-up at 2dp at line level), test that totals of rounded lines equal stored totals; sum of 12 monthly P&Ls = annual P&L to the paisa.
- Period close/reopen, closing entries, opening balances roll-forward: December close → January opening equity must reconcile.
- Reversal correctness: any event followed by its reversal returns every affected balance to the pre-event state (test as a generic property over all event types).
- Multi-tenant: run the entire Phase 4 suite with tenant 2 active and assert tenant 1's numbers are unchanged and unreadable.

**Effort:** 6–9 days. **Runtime:** 2–4 min. **Confidence:** 65% → 78%. **Blind spots:** calculations that exist only in output-layer code (deliberately — Phase 6 outlaws those).

---

## Phase 5 — Output Verification (every surface = Ledger)

**Objective:** Every consumer of the core shows the Manifest value. No browser, no screenshots — pure HTTP + parsing.

**Method per surface type:**
- **Inertia pages (228):** hit each route with `X-Inertia` headers; the response is JSON props. Assert every financial prop against the Manifest for the seeded "today". This tests the exact payload React renders, without rendering.
- **API endpoints:** same, plain JSON.
- **Exports:** generate every PDF/Excel/CSV export against the Golden Company; parse (Excel via maatwebsite read-back, PDF via text extraction) and assert totals. Exports are the most common place for duplicated math — treat as first-class.
- **Emails/notifications/scheduled reports:** trigger with mail `log`/array driver, parse rendered content, assert values.
- **Filters:** for each filterable endpoint, run a filter matrix (date ranges incl. today/MTD/QTD/YTD/custom/cross-year, branch, warehouse, category, party, payment mode, combinations) and assert against Manifest slices. Also assert the **complement property**: filtered + inverse-filtered = unfiltered total.
- **Pagination property:** sum of all pages = reported total.
- **Permissions:** for each role in the Golden Company, assert restricted metrics are absent (not zeroed, absent) from payloads.
- **Cache honesty:** where responses are cached, mutate the ledger, assert the surface updates within its declared staleness budget (each cached metric must have one, documented in the Registry).

**Coverage accounting:** every test annotates which Number Registry entries it verifies; `verify:coverage` reports unverified metrics by name. Launch gate = zero unverified LEDGER-DERIVED metrics.

**Effort:** 10–15 days (bulk work, but mechanical once the harness exists — build the harness so one metric = ~5 lines of declaration, not a bespoke test). **Runtime:** 3–6 min. **Confidence:** 78% → 90%. **Blind spots:** client-side transforms after the payload lands (Phase 10).

---

## Phase 6 — Consistency Engine (one value, one truth)

**Objective:** Automatically detect the exact disease you found in your UI review: the same metric differing between surfaces.

**Method:**
- From the Registry, group all surfaces claiming to show the same metric (e.g., "Total Revenue, June" appears on Dashboard card, Sales report, P&L, Analytics chart, Excel export, API).
- The **Consistency Sweep** fetches all of them in one run and asserts pairwise byte-equality of the normalized value. It doesn't even need the Manifest — inconsistency is failure regardless of which value is "right" (the Manifest tests decide that separately).
- Run the sweep at multiple frozen "now" times (mid-month, month-end 23:59, month-start 00:00, year-end) to catch boundary-condition divergence — the classic cause of "dashboard says X, report says Y".
- Formatting consistency: same rounding, same currency display, via a shared formatter assertion.

**Why it matters:** This is the cheapest, highest-yield phase for brand trust. Two wrong-but-equal numbers annoy an accountant; two different numbers destroy trust instantly.

**Effort:** 3–4 days (Registry makes it nearly free). **Runtime:** <2 min. **Confidence:** 90% → 93%. **Blind spots:** metrics not yet grouped in the Registry — mitigated by Phase 0's CI gate on unregistered metrics.

---

## Phase 7 — Architectural Enforcement (the permanent guard)

**Objective:** Make violations impossible to merge, not just detectable after the fact.

**Rules (enforced by static analysis in CI):**
- No controller in `Reports/`, `Dashboard/`, analytics, or export namespaces may reference `Sale`, `Purchase`, `Transaction` models or raw `DB::table` on their tables — only Ledger-facing services/repositories.
- No `SUM(`/aggregation SQL on transaction tables outside the designated core services (grep-level rule with an explicit allowlist).
- No financial arithmetic in Blade/Inertia controllers or React (React may format, never compute money — lint rule flagging `+`/`-`/`*` on props matching money-name patterns, reviewed manually at first).
- No business logic in controllers (thin-controller rule: method length + no model writes outside services).
- Every new route must appear in the Number Registry or be explicitly marked `NON-FINANCIAL` (Phase 0 CI gate).
- No float casts on money columns; migrations adding money columns must be DECIMAL (schema lint).
- The existing NUL-byte scan and Ziggy-regeneration checks stay in the same CI stage.

**Tech:** phpat or PHPArkitect for dependency rules; custom artisan lint for the grep-level rules; ESLint custom rule for the React side.

**Effort:** 2–3 days. **Runtime:** <30s. **Confidence:** protects the other 93% from decay — arguably the highest long-term ROI in the plan. **Blind spots:** dynamic/string-built queries; reflection; keep the allowlist small and reviewed.

---

## Phase 8 — Adversarial & Corruption Detection (mutation of DATA)

**Objective:** Prove the system detects a broken world, not just behaves in a healthy one.

**Scenario library (each: corrupt → assert detection):**
- Sale without journal entries (the flagship test) — every revenue surface must show the ledger truth, and `verify:ledger` must flag the orphan transaction.
- Journal entry with debits ≠ credits injected raw → invariant suite fails, and (design decision to make now) affected reports either fail loudly or exclude — never silently include.
- Deleted product/party/user behind historical transactions → reports still correct (soft-delete handling), no crashes, no dropped rows.
- Stock layer edited to disagree with journal → three-way tie test (Phase 4) fails.
- Cross-tenant ID swapped on one journal item → tenant isolation invariant fails, and tenant A's totals unchanged.
- Backdated transaction into a locked period via raw insert → detected.
- Duplicate webhook delivery / double-submitted POS sync → exactly-once journalization (idempotency test).
- Cache poisoned with stale value → staleness budget test fails.
- Currency/precision corruption: a 3dp value in a 2dp column, a huge value near DECIMAL max, a 0.005 rounding pivot.

**Also: code-level mutation testing (Infection PHP)** on the core services only (InventoryService, accounting services, FIFO logic): mutate the arithmetic, assert the test suite kills the mutant. This measures whether Phases 3–4 actually constrain the math or just execute it. Target: >90% MSI on core financial services.

**Effort:** 5–7 days. **Runtime:** scenarios 2–3 min; Infection run 20–60 min (nightly, not per-commit). **Confidence:** 93% → 96%, and it *quantifies* the earlier phases' strength. **Blind spots:** corruptions nobody imagined — partially covered by invariants being state-based rather than scenario-based.

---

## Phase 9 — Edge Cases, Time & Concurrency

**Objective:** The failure modes that only appear at boundaries.

**Time:** leap day (Golden Company year should include Feb 29 or a second mini-universe that does), DST transitions if any tenant timezone has them, tenant-timezone vs server-timezone day boundaries ("today's sales" at 00:05 local), future-dated and backdated entries, year-end rollover, reports queried across the rollover.

**Values:** 100% discount, negative discount rejection, zero-quantity lines, maximum DECIMAL magnitudes, smallest currency unit, prices like 0.335 (rounding pivot), unit conversions producing repeating decimals.

**Concurrency (MySQL makes this testable for real — a reason the MySQL-only policy pays off):** two simultaneous sales draining the same FIFO layer; concurrent payment allocations to one invoice; POS offline-sync replaying while an online sale lands; parallel period-close and posting. Method: parallel PHPUnit processes or artisan commands hitting `amd_pos_test`, then run the full invariant suite — invariants after a race are the assertion.

**Scale (nightly):** synthetic million-entry ledger; assert invariant suite and key reports complete within budget and still balance. Catches both performance cliffs and aggregation overflow bugs.

**Effort:** 5–7 days. **Runtime:** minutes (nightly scale run: ~1h). **Confidence:** 96% → 97.5%. **Blind spots:** true production-grade load patterns; hardware-specific behavior.

---

## Phase 10 — Frontend Logic Verification (the last mile)

**Objective:** The payload was correct (Phase 5); prove the pixel-side logic doesn't distort it.

**Method (no browsers, no screenshots):**
- Jest + React Testing Library on every component that receives financial props: feed it a Manifest-derived fixture payload, assert rendered text equals the expected formatted string.
- Unit-test every JS utility that touches numbers (formatCurrency, percentage, chart data mappers). Chart mappers are the highest risk — assert the mapped series arrays numerically, not visually.
- Contract fixtures: the fixtures fed to Jest are **generated by the PHP test suite** from real controller responses (recorded from the Golden Company). This welds frontend tests to backend truth — if a controller payload shape changes, fixture regeneration changes, and Jest fails. No drift.
- Dexie/offline: unit-test the POS offline cart math and the sync payload builder against the same fixtures; assert an offline-composed sale serializes to exactly what Phase 3's sync test expects as input. This closes the loop end-to-end without a browser.
- The architectural ESLint rule from Phase 7 (no money arithmetic in components) shrinks this phase's surface permanently.

**Optional thin E2E layer:** 10–15 Playwright smoke journeys (login → POS sale → dashboard reflects it → report reflects it) as a final sanity net — not the verification mechanism, just a canary that the wiring is plugged in. Keep it under 5 minutes.

**Effort:** 6–8 days. **Runtime:** Jest <1 min; smoke E2E ~5 min. **Confidence:** 97.5% → 98.5%. **Blind spots:** CSS-level truncation/overlap of correct numbers (only screenshots catch that; accept the risk or spot-check manually pre-launch).

---

## Phase 11 — Coverage Model & The Launch Gate

**Objective:** Turn "I feel confident" into a number you can defend.

**Coverage dimensions, each reported by `verify:coverage`:**
- **Metric coverage:** Registry entries verified / total (target: 100% of LEDGER-DERIVED).
- **Event coverage:** event types with Phase 3 tests / event catalog (target: 100%).
- **Surface coverage:** routes with Phase 5 assertions / financial routes (target: 100%).
- **Filter coverage:** filter combinations exercised / declared filter matrix.
- **Invariant coverage:** invariants implemented / invariant list.
- **Mutation score:** Infection MSI on core services (target ≥90%).
- **Consistency coverage:** metric groups swept / groups in Registry.
- Plus classic line/branch coverage on `app/Services` as a floor, not a goal.

**The Launch Gate (all must be green):**
1. `verify:map` — no unregistered metrics.
2. `verify:ledger` — all invariants pass on Golden Company AND (read-only) on `venqore_pos`.
3. Full suite green on `amd_pos_test`.
4. Consistency sweep: zero divergent metric groups at all four frozen clock positions.
5. All flagged `TRANSACTION-DERIVED` metrics from Phase 0 refactored or explicitly waived with a signed reason.
6. Mutation MSI ≥ target.
7. Nightly scale run within budget.

**Post-launch:** `verify:ledger` runs nightly against production (read-only) per tenant; any invariant break pages you before a customer sees it. This is the "internally self-verifying product" end state.

**Effort:** 2–3 days. **Runtime:** seconds. **Confidence:** makes the 98.5% *provable and monitorable*.

---

## Execution Order & Budget

| # | Phase | Effort | Depends on | Confidence after |
|---|-------|--------|-----------|------------------|
| 0 | Inventory & Registry | 3–5 d | — | ~15% |
| 1 | Golden Company | 5–8 d | 0 | foundation |
| 2 | Ledger Invariants | 3–4 d | 1 | ~40% |
| 3 | Input Verification | 8–12 d | 1,2 | ~65% |
| 4 | Core Math | 6–9 d | 1,2 | ~78% |
| 5 | Output Verification | 10–15 d | 1,4 | ~90% |
| 6 | Consistency Engine | 3–4 d | 0,5 | ~93% |
| 7 | Architecture Guard | 2–3 d | 0 (parallel) | protects gains |
| 8 | Adversarial + Mutation | 5–7 d | 3,4,5 | ~96% |
| 9 | Edge/Time/Concurrency | 5–7 d | 3,4 | ~97.5% |
| 10 | Frontend Logic | 6–8 d | 5 | ~98.5% |
| 11 | Coverage & Gate | 2–3 d | all | provable |

Total: roughly **58–85 engineering days** (≈ 3–4 months for one senior engineer, 6–8 weeks for two). Percentages are engineering estimates of risk retired, not mathematical facts.

**Fastest path to your immediate pain (the pre-launch inconsistencies):** Phase 0 → Phase 1 (minimal one-month universe) → Phase 6 consistency sweep. That combination finds every "different number in different places" defect in about 2 weeks, while the rest of the fortress is built behind it.

---

## Standing Self-Challenge (repeat at every phase review)

- What could still go wrong that no test here fails on?
- Which metric was added last week and is it in the Registry?
- Would this suite have caught the exact inconsistencies found in the final UI review? (Reconstruct each one as a regression test — mandatory.)
- What would a Big Four auditor sample? (Pick 25 random Golden Company transactions and trace each end-to-end by hand once — human audit of the machine.)
- What would Stripe do that we haven't? (Their answer: invariants in production, not just in CI — Phase 11's nightly run is non-negotiable.)

**Known residual blind spots, accepted consciously:** visual/CSS defects on correct data; third-party outage behavior (WooCommerce API down mid-sync — add a fixture test if time allows); human misreading of correct numbers (a UX problem, not a data problem); scenarios absent from both the spec and anyone's imagination — the invariant suite is the only defense against unknown unknowns, which is why it runs first, always, everywhere.
