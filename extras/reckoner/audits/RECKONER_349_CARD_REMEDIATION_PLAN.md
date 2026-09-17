# Reckoner: 349-card correctness, 16-stream coverage, and tenant isolation

**Status:** Implementation handoff; diagnosis only. No application changes are made by this document.  
**Repository:** `app-code/main-app`  
**Prepared:** 2026-09-16  
**Audience:** IDE implementation agent, reviewer, QA, and owner.

## 1. Objective and non-negotiable rules

Deliver truthful, tenant-isolated readings for the 349 canonical dashboard cards. A card is *ready* only when its declared formula runs against authoritative data, its status is honest, and its result passes a hand-verified fixture and applicable reconciliation checks. Merely appearing in the catalog or having a resolver class is not readiness.

1. The accounting ledger is authoritative for posted financial balances and P&L. It is **not** a substitute for sale-line, stock-position, attendance, or document-status detail. These must come from their operational sources and, where applicable, reconcile to ledger control accounts.
2. Never show a fabricated `0`, empty chart, `ok`, or `passed` when calculation is missing, a required source is absent, or an invariant was not executed. A genuine numerical zero is permitted when the documented query executed and zero is the true result.
3. Every tenant read must be authorized for the acting user and scoped to the intended tenant. No tenant is inferred from an unverified `last_store_id`; no raw query relies on Eloquent's global scope.
4. Keep the current user's uncommitted Reckoner work intact. Inspect the diff before editing overlapping files. Do not alter generated artifacts by hand; change their generator/source.
5. Do not enable all 349 cards at once merely to pass a count gate. Ship verified domain slices and keep unverified cards visibly unavailable until proven.

The architecture target is the three-tier model in `extras/VENQORE_RECKONER_AND_ONBOARDING_BUILD_SPEC.md` §§2–5: shared daily base measures, live point-in-time reads, and on-demand rankings. Do **not** materialize 349 card-specific totals. The old `Claude outputs/VENQORE_RECKONER_COVERAGE_MANDATE.md` has useful correctness principles but historical 108/25 figures; do not reuse those counts as current facts.

## 2. Verified current state and corrections to the IDE report

| Finding | Evidence | Consequence |
|---|---|---|
| 349 definitions declare 16 distinct stream names, but all 349 have no `measures` mapping. | `resources/data/reckoner/cards.json`; `app/Reckoner/CardRegistry.php:37-66`; `app/Reckoner/Streams.php`; `app/Reckoner/Measures.php` | Stream labels describe intended dependencies but do not execute queries or define formulas. |
| For the generic non-core table map, **202** card keys have no table; **115** map to a table. The remaining **32** are `core.*`. | Recomputed from all 349 JSON keys using the exact key-prefix/module logic in `app/Reckoner/Resolvers/AbstractCardResolver.php:354-392`. | Unmapped cards return `empty` before any measure is computed. A mapped table still does not imply a correct measure. |
| The generic resolver returns row counts for scalar cards, successful zero/empty arrays for breakdown/ranking/table/gauge cards, and a constant `1` for status. | `app/Reckoner/Resolvers/AbstractCardResolver.php:268-352` | Plausible-looking numbers can be unrelated to a card's label. |
| Of the new card-specific resolver classes, only `InventoryStockValueResolver` overrides the generic `compute()` method. Some overlapping keys are instead dispatched to older `Sources/*` by `ReckonerRegistry`, so **do not claim exactly 348 live cards are wrong**. | `app/Reckoner/Resolvers/*`; `app/Reckoner/ReckonerRegistry.php:1767-1816`; `app/Reckoner/Reckoner.php:282-304` | Inventory of actual dispatch paths per key is required. |
| Selected old financial paths really read `journal_items`/`journal_entries`; the 16-stream pipeline and daily rollup are not wired. | `app/Services/FinancialReportingService.php:58-180`; `app/Reckoner/Sources/FinanceSource.php`; no runtime use of `Streams::`/`Measures::` and no `reckoner_daily` migration found | This is partial financial coverage, not the promised 349-card engine. |
| `core.receivables`, `core.payables`, and the cash/liquidity/working-capital group read balance-sheet keys the service does not return. Three distinct cash cards share one value. | `app/Reckoner/Resolvers/AbstractCardResolver.php:198-228`; `app/Services/FinancialReportingService.php:1457-1547` | Real balances can be rendered as zero; different metrics can incorrectly agree. |
| Six ledger tie-out methods return unconditional `passed: true`; other checks can also pass when they cannot run. | `app/Reckoner/Invariants/ReckonerInvariants.php:50-165` | Green checks are not proof of ledger reconciliation. |
| New catalog definitions set `permissions=[]` and `implemented=true`; `checkAvailability()` checks `implemented`, but `readMany()` does not. | `app/Reckoner/ReckonerRegistry.php:1790-1823`; `app/Reckoner/Reckoner.php:56-113,130-304` | Catalog and read authorization/availability can disagree. |

**Corrections to the pasted IDE report:** Its 202/115/32 mapping counts are reproducible. However, an `empty` result has `data.value=null` and serializes with top-level `value=null`, not a computed `0.0` (`ReckonerResult.php:114-170`). It is also unsafe to repair this by expanding prefix-to-table rules and choosing `SUM/AVG` from `unit` or `topic`: neither identifies the business formula, status rule, reversal basis, or correct account. “Only six cards touch the ledger” is too broad a claim because older source-backed keys and several core paths can call ledger-backed services. Count **actual read paths**, not metadata or class names.

No production-tenant posting completeness was tested. Code inspection proves the implementation gap, not whether every historical business transaction posted correctly to a particular tenant's ledger.

## 3. Phase 0 — documentation and API discovery (required before coding)

Read the following in full or the relevant cited sections, then record any conflicts in the implementation PR:

- `extras/VENQORE_RECKONER_AND_ONBOARDING_BUILD_SPEC.md` §§2–5 and §9: 16 streams, three-tier storage, envelope, gates, invariants, acceptance.
- `extras/VENQORE_RECKONER_BUILD_SPEC.md` §§3–4 and financial source rules: periods, as-of versus flow, gate order, cache, `FinancialReportingService` as financial truth.
- `extras/VENQORE_MODULE_BUSINESS_INTERACTIVE_MAP.html` Export section: the existing `cardStreams` source. It does **not** provide card formulas or physical table/column mappings.
- `CLAUDE.md` correctness and purchasing rules; `app-code/main-app/docs/PROJECT.md` tenancy/accounting; `app-code/main-app/docs/SECURITY.md` raw-query warning.
- Actual signatures and examples: `app/Reckoner/Reckoner.php`, `ReckonerRequest.php`, `ReckonerResult.php`, `ReckonerPeriod.php`, `Sources/ReckonerSource.php`, `Sources/SalesSource.php`, `Sources/FinanceSource.php`, `Services/FinancialReportingService.php`, `Services/ModuleService.php`, `Http/Middleware/ApiTenantResolver.php`, `Traits/HasTenant.php`.

**Allowed existing API patterns:** `Reckoner::read()` / `readMany(array $requests, User $u, ?Tenant $t)`; `ReckonerSource::supports()` and `resolveBatch(array $requests, ReckonerContext $ctx)` returning values keyed by request ID; `FinancialReportingService::getProfitAndLoss($start,$end,?tenantId)` for ledger P&L; `ReckonerPeriod::resolve(...)` for centralized windows; `ReckonerResult` success/empty/failure envelopes. `FinancialReportingService::getBalanceSheet(string $asOf)` currently takes **one** argument and uses bound tenant context—do not invent a tenant parameter without changing and testing the service contract.

**Proof of Phase 0:** A reviewed source-of-truth decision for every stream, a list of missing APIs rather than imagined methods, and an explicit resolution for the spec's stale-value contradiction (spec says stale shows a dimmed number but also says value is null whenever status is not `ok`). No implementation should depend on an unresolved contradiction.

**Guard:** Do not copy the HTML export and assume it implements the 349 calculations; it only supplies card/stream metadata.

## 4. Phase 1 — build the truth/coverage ledger and stop false success

### 4.1 Card contract matrix

Create a machine-readable, reviewable row for **each** of the 349 catalog keys. Suggested fields:

| Field | Required meaning |
|---|---|
| `key`, `module`, `permission`, `feature` | Ownership and authorization; Qore/core must still have an explicit policy. |
| `shape`, `unit`, `precision` | Output contract, not inferred from runtime value. |
| `stream_keys`, `base_measure_keys` | Declared dependencies; every measure must resolve to an implemented source. |
| `formula_or_projection` | Exact computation, e.g. “income credits minus debits on non-reversed entries within window,” not merely “sum revenue.” |
| `authoritative_service_or_table` and `join_path` | Physical provenance, including tenant predicates on each joined tenant table. |
| `date_column`, `period_kind`, `timezone`, `status_rule`, `reversal_rule` | Flow versus as-of; posted/returned/draft inclusion; event and cutoff semantics. |
| `dimension/filter_schema`, `sort/limit` | Whitelisted arguments and cardinality limits. |
| `empty_vs_zero_rule`, `comparison_rule` | Distinguish no records, genuine zero, undefined ratio, and unsupported card. |
| `ledger_control`, `expected_fixture`, `freshness_policy` | Tie-out target (if relevant), hand-verified example, TTL/invalidation. |
| `implementation_state` | `unimplemented`, `implemented_unverified`, or `verified`; only `verified` is live. |

Use one source of truth for the matrix and generate registry/catalog metadata from it. Do not maintain a second hand-edited frontend list. Assert exactly 349 unique keys, no orphan resolvers, all 16 stream names declared, every referenced base measure implemented, and no `verified` row lacking a formula/fixture. The existing `CardRegistryGateTest.php:25-39` checks class existence only; extend it to contract and value gates.

### 4.2 Truth gate

- Change `ReckonerRegistry.php:1767-1816` so merging a `CardRegistry` key does not automatically mean `implemented=true`. Preserve verified older source-backed readings.
- Apply the same `implemented` gate in both `Reckoner::checkAvailability()` **and** `readMany()` before cache lookup or source dispatch. Denial must run zero source queries.
- Replace the generic resolver's “unknown table ⇒ empty”, count/zero/one fallbacks with an explicit unimplemented/unavailable result. Genuine no-row periods may still be `empty`; a real computed count can be `0` if its contract says so.
- Have the catalog/picker expose only verified cards, or expose unavailable entries with an honest reason if product requirements demand discoverability. Do not hide a saved card silently; render an explicit status.

**Verification:** Direct `/api/reckoner/read` and catalog tests agree on availability; unimplemented cards cannot return `ok`; `empty` only follows an executed, valid query; errors are not swallowed into zero. Review `ReckonerResult.php` serialization and `NewDashboard.jsx:459-599,2080-2160` together so UI status handling matches backend semantics.

**Guard:** Do not claim “all 349 ready” by returning empty or by writing 349 trivial resolver wrappers.

## 5. Phase 2 — tenant isolation and authorization (blocking security gate)

Implement this phase **before** new stream queries or rollup jobs. The Reckoner API routes use `auth` and `ApiTenantResolver` (`routes/web.php:2192-2205`), which binds `current.tenant` only after an active `TenantUser` membership (`app/Http/Middleware/ApiTenantResolver.php:19-47`). The controller rejects an unbound tenant (`app/Http/Controllers/Api/ReckonerController.php:103-135`). Keep that fail-closed behavior.

### 5.1 Query rules

1. Pass one explicit, authorized tenant ID from `ReckonerContext` into every source and service. Never substitute `user.last_store_id` as authorization. For queued jobs/backfills, load an explicitly selected tenant and bind/reset context for that job; an unbound CLI read must not become a global aggregation.
2. Every `DB::table()` / raw SQL branch must include `tenant_id = :tenantId` on its base table. If a join touches another tenant-owned table, constrain **both sides** (for example `journal_items.tenant_id` and `journal_entries.tenant_id`). A join by UUID alone is not the security boundary. See the independently scoped referee SQL in `tests/tests/Feature/Core/CalculatorParityTest.php:145-224`.
3. Eloquent `HasTenant` is a defense-in-depth global scope for model queries only (`app/Traits/HasTenant.php:50-81`). It does not scope Query Builder `DB::table()`. `withoutGlobalScopes()`/`withoutTenantScope()` must not appear in tenant card reads unless followed by a reviewed explicit tenant predicate and justified in the contract.
4. Where operational and ledger tables are joined, constrain each tenant-owned table and verify referenced entities also belong to that tenant. Avoid widening an aggregate through a nullable join or unscoped subquery.
5. Keep platform-scope metrics separate. Tenant-context requests for platform keys must return `not_found` before querying. A platform administrator viewing a tenant dashboard still gets **that tenant's** scoped data, not cross-tenant totals.
6. Define real per-card permissions. New definitions currently use `permissions=[]`, which `passesPermissions()` treats as allowed to any authenticated user. Follow the existing permission gate and `ModuleService` policy; `enabled()` means a switch is on, while `visible()` is documented for dashboard visibility. Confirm the intended product rule and apply it consistently to picker, direct API, saved cards, and exports.

### 5.2 Mandatory automated proofs

- **Two-tenant adversarial fixture:** seed A, record each of the 349 card results (or every verified card during staged rollout), insert high-valued B data into *every relevant source type*, and prove A is unchanged. Then prove B receives its own result. Extend `tests/tests/Feature/Reckoner/Laws/L1TenantIsolationTest.php` and use `tests/tests/Feature/Golden/AdversarialCorruptionTest.php:311-385` as examples.
- **Warm-cache switch:** fetch A, then B, then A without `Cache::flush()`. Assert no cross-tenant data and no stale A/B response alias. Current L1 tests flush cache and do not establish this proof.
- **Authorization:** inactive/suspended/no-membership user cannot bind a tenant or read card data (`tests/tests/Feature/Security/ApiTenantResolverTest.php`); insufficient card permission and disabled module cause zero source queries. Do not rely on UI hiding.
- **Query inspection:** log/inspect executed tenant-owned-table queries (including joined aliases and subqueries), plus a deliberately contaminated cross-tenant fixture. Static grep alone is not sufficient for joins.
- **Jobs:** simulate backfill/probe for A and B in one worker process; ensure context is reset between jobs and queries, cache entries, and rollup rows stay within the selected tenant.

**Guard:** Never weaken the `HasTenant` hard block or bypass membership checks to make a card return data. A missing tenant is an authorization failure, not a reason to query globally.

## 6. Phase 3 — implement the 16 stream adapters and canonical measures

The 16 names in `app/Reckoner/Streams.php` are conceptual contracts, **not** existing stream processors. Implement sources that return tenant-scoped, period-aware facts. Reuse `Sources/ReckonerSource.php` and the grouped-window batching pattern in `Sources/SalesSource.php:37-63` / `Sources/FinanceSource.php:47-115`; do not implement 349 independent SQL queries.

| Stream family | Authoritative direction and minimum validation |
|---|---|
| `ledger.journal`, `ledger.accounts` | Non-reversed `journal_items` joined to `journal_entries` and account taxonomy; explicit tenant on all tables; period movements versus as-of balances distinguished. Financial facts should reuse `FinancialReportingService` where it already defines them. |
| `sales.headers`, `sales.lines` | Posted/partially returned/returned semantics, discounts, tax and FIFO COGS from authoritative sale and cost layers. Reconcile revenue/COGS to books. |
| `purchase.headers`, `purchase.lines` | Current `purchases`/`purchase_items`, not legacy `invoices`; keep workflow status distinct from payment status. Paid amount derives from ledger postings. |
| `stock.movements`, `stock.positions` | Movement history versus current or historical position; batch valuation basis explicitly chosen. Do not silently replace a valid zero batch value with `stocks × products.cost_price`. Reconcile inventory control. |
| `party.balances`, `payment.entries`, `expense.entries`, `tax.entries` | Receivable/payable as-of cutoff, allocation, reversal, tax-rate and expense-category semantics. Control-account reconciliation where applicable. |
| `production.entries`, `attendance.entries`, `doc.status`, `master.registry` | Operational records/statuses, scoped to tenant; ledger tie-out only for their monetary components. No assumption that all 16 streams reside in the GL. |

For each stream, document physical tables/columns, indexes, tenant and join predicates, date/status filters, reversal handling, nullable behavior, and normalized output. Use explicit numeric decimal semantics and round at the canonical settlement boundary. `FinancialReportingService::getProfitAndLoss()` is an existing ledger-backed pattern, but note that it currently may seed missing accounts on read (`:94-100`); a pure dashboard read should not quietly mutate accounting setup. Resolve that as a separate reviewed change before treating reads as side-effect-free.

**Verification:** One test per stream against populated, empty, reversed, backdated, and second-tenant records; query-count tests for batching; independent referee aggregate for each financial control. All stream queries use the same `ReckonerPeriod` boundaries and tenant timezone. No stream falls back to a different business definition merely because its preferred value is zero.

**Guard:** Do not implement a “generic table mapper” or choose `SUM(total)` based on `unit=currency`. The same table can support count, outstanding, gross, net, overdue, and historical balances with different rules.

## 7. Phase 4 — compose and verify all card projections

Connect contract-matrix entries to canonical base measures and exact projections. Families should reuse calculations:

- A stat, trend, comparison, and breakdown of revenue must derive from the **same revenue definition**. Grouped segments conserve the parent total within defined rounding.
- Gross profit = revenue − COGS; net profit = gross profit − operating expenses. Margin percentages are derived and undefined when the denominator is zero; never report a fabricated 0%.
- Liquidity, net cash position, and working capital are separate formulas. Fix the current duplicate-cash implementation and balance-sheet key mismatch before validating their cards.
- Flow cards (`revenue this month`) sum the requested transaction interval. As-of cards (`receivables on date`) use all non-reversed activity **up to** the cutoff. Current stock positions must not be presented as historical values without reconstructing movement history.
- Ranking, feed, breakdown, gauge, status, and trend shapes need real payloads. A truncated ranking must advertise truncation; status must come from a documented predicate, not constant `1`.
- Some legacy `Sources/*` readings already compute real values. Map new card aliases to those canonical calculations where semantics truly match; do not duplicate SQL or assume similarly named keys are identical.

Add a hand-verified expected result for every card in the golden fixture and compare the entire envelope: value, shape, unit, period, status, rows/series/segments, source provenance, and applicable checks. The 349-card completeness test must fail if any card is `verified` without a numerical fixture. Preserve Qore/core access for zero-module tenants subject to explicit role policy.

**Verification:** Run all 349 against populated and empty tenants. Against the populated fixture, each supported card has a real expected value; against empty data, it has a documented genuine zero/empty/not-applicable outcome, never generic success. Test returns, discounts, partial payments, negative balances, zero denominators, and reversals.

**Guard:** Do not copy a current output into the expected fixture; calculate the expected amount independently and review every changed golden number.

## 8. Phase 5 — make reconciliation real and fail honestly

Implement the 16 declared invariants in `app/Reckoner/Invariants/ReckonerInvariants.php` per `extras/VENQORE_RECKONER_AND_ONBOARDING_BUILD_SPEC.md` §5. Replace unconditional passes for revenue, COGS, AR, AP, inventory, tax, liquidity, aging, and list checks with actual comparisons. If a required table/account is missing or a query throws, report failed/unavailable—never `passed=true` by default. Unknown invariant names must fail closed.

Minimum ledger controls for a tenant and consistent cutoff:

| Control | Independent comparison |
|---|---|
| Revenue | Operational net recognized sales versus income-account credit minus debit, with returns/reversals aligned. |
| COGS | FIFO cost of recognized sale lines versus ledger COGS debit minus credit (account taxonomy/code 5000 as currently used). |
| Receivables / payables | Sum party subledger balances versus AR/AP control accounts at the same `as_of` date. |
| Stock value | Inventory batches/positions under the chosen valuation policy versus inventory GL control account; differences surfaced, not silently substituted. |
| Tax | Input/output operational tax versus corresponding ledger control accounts. |
| Accounting equation | Assets = liabilities + equity, using the actual `getBalanceSheet()` return structure. |

Use `tests/tests/Feature/Core/CalculatorParityTest.php:145-224` and `tests/tests/Feature/Golden/CogsReconciliationTest.php:96-125` for independent referee patterns. Fix `checkBalancedBooks()` to use actual `journal_entries.date` (it currently filters only if `entry_date` exists). Stop `checkAccountingEquation()` from turning any exception into a pass. Distinguish a reconciliation **mismatch** (known wrong value) from a check **unavailable** (cannot establish correctness). The exact production blocking/alert policy must be reviewed with the owner; do not hide a demonstrably wrong monetary figure behind a green tile.

**Verification:** Deliberately corrupt one source at a time and prove the relevant check fails; restore it and prove the check passes. Insert backdated and reversed entries and prove historical controls recompute correctly. Run all 16 checks against both fixture tenants.

**Guard:** Do not test an invariant with values supplied from the same function on both sides; its referee must be independent.

## 9. Phase 6 — caching, historical speed, and dashboard freshness

Correctness precedes optimization. Preserve tenant+metric+window+granularity+args identity from `Reckoner::cacheKey()` (`app/Reckoner/Reckoner.php:647-657`) and include contract/version identity if formulas change. Fix `ReckonerRequest::getCompositeId()` so distinct granularities cannot collide in a single batch (`ReckonerRequest.php:19-27`). Cache the full status/provenance/freshness envelope, or reconstruct it faithfully: currently a cached `empty` payload is rebuilt as `success` (`Reckoner.php:255-269,282-299`).

For dashboard memory in `resources/js/Pages/NewDashboard.jsx:357-455`, a nonempty `LIVE_RECKONER_DATA` entry currently prevents refetch indefinitely within the mounted engine. Add expiry/revalidation based on server `asOf`/policy; evict on tenant switch, period switch, relevant domain event, and auth/module change. Never use a `latest` reading from one period or tenant as if it answered another. On request failure, do not cache an error as a permanent value.

Only then implement the spec's `reckoner_daily` history tier for appropriate **flow** base measures, live read-through for current positions, and on-demand high-cardinality rankings. Design the schema for the actual DB engine: the spec's illustrative nullable `dim` inside a primary key cannot be copied literally to an engine that disallows nullable PK columns. Use a reviewed non-null dimension sentinel or surrogate/unique design. Dispatch rollups **after commit**, debounced by tenant+day. Recompute affected dates after backdated postings/reversals; nightly repair the recent window; provide an explicit tenant-scoped backfill command and reconciliation before activating rollup reads. A stale/failed job must not silently change a true value to zero.

**Verification:** Live source and rollup return equal values; warm/cold caches preserve status; A/B warm-cache isolation; backdated/reversal invalidation; one worker processing successive tenants; period-switch latency target from spec only after correctness; no extra source queries on denied reads.

**Guard:** Do not materialize one row per card; do not precompute current stock/open documents as if they were historical flow. Do not deploy a 365-day backfill without a bounded, resumable runbook and production-data safety review.

## 10. Phase 7 — release, monitoring, and final acceptance

Release verified families in slices: (1) core financial and accounting, (2) sales/POS and purchasing, (3) inventory/parties/payments/tax, (4) remaining operations. A module/card moves to `verified` only after its contract, tenant tests, golden expected value, and relevant reconciliation pass. Keep legacy known-good keys compatible while transitioning; compare old and new readings where definitions match.

Build the spec's scheduled `reckoner:probe` only after statuses and invariants are real. It should sample each active tenant and card/period, record status and failed checks, and alert on errors or unexpected empty rates. Logs must carry tenant ID, card key, period, source and correlation ID, but no customer PII, payment instrument secret, or cross-tenant raw data. Probe and backfill jobs require explicit tenant context and must reset it between iterations.

Final release gates:

- [ ] Exactly 349 canonical card contracts, with 349 reviewed formulas/projections and expected populated-fixture results; no orphan resolver or undeclared measure.
- [ ] Every live card's result matches its independent golden expectation and declared shape/status/period; unsupported cards cannot return `ok`.
- [ ] All 16 streams have documented physical provenance and tenant-scoped source tests; the ledger-backed controls reconcile.
- [ ] All 16 invariants are executable, with intentional corruption tests proving failure. No unconditional `passed=true` placeholders remain.
- [ ] Two-tenant, warm-cache switch, joined-query, denied-read-zero-query, worker-context, and platform-versus-tenant isolation tests pass for the live catalog.
- [ ] Historical as-of, backdated posting, reversal, period timezone, comparison, and rollup/live parity tests pass.
- [ ] Catalog, direct API, saved dashboard, exports and UI use the same verification/gating result. No tenant-facing sample/placeholder figures.
- [ ] An operator can identify which card/stream failed and why without exposing another tenant's data.

## 11. Suggested implementation handoff to the IDE

> Implement this document phase by phase. First produce the 349-row contract/dispatch matrix and the failing populated/empty/two-tenant baseline; review it before changing calculations. Preserve existing uncommitted edits. Phase 1 must make unimplemented readings unavailable in both catalog and direct reads. Phase 2 must establish tenant/permission isolation for every source and warm cache. Then implement shared stream/base-measure families and real card projections, using `FinancialReportingService` as the established financial truth and independent referee tests for ledger controls. Do not “fix” missing cards by expanding a prefix table or inferring formulas from units. Make the 16 invariants executable and adversarially tested. Add rollups, backfill and freshness only after live calculations reconcile. At each phase provide a changed-file list, test commands/results, failing/remaining card keys, and a numerical coverage count. Do not assert 349/349 until every expected golden result and isolation gate passes.

## 12. References and scope notes

Relevant source anchors are listed in the phases above. Additional existing tests include `tests/tests/Feature/Reckoner/Laws/L1TenantIsolationTest.php`, `L6PermissionLawTest.php`, `tests/tests/Unit/Reckoner/ReckonerBatchKeyTest.php`, and `tests/tests/Feature/Security/ApiTenantResolverTest.php`. Re-read these before implementation: an existing law that iterates `ReckonerRegistry::all()` may include newly registered cards but still fail to prove numerical accuracy, and L1 currently flushes cache before reads, so it does not prove warm-cache isolation.

This is a source-code handoff, not a live-tenant audit. It deliberately does not certify production postings, migrations, queue health, or account balances. Those require controlled read-only reconciliation against representative tenants before enabling all cards.
