# VenQore — Test Failure Root Cause Analysis

**Date:** 2026-08-05
**Run analysed:** `Tester/VerificationCenter/runs/20260805_023001_18672` — 1448 executed, 1319 passed, **79 failed**, 46 incomplete
**Scope:** diagnosis only. **No code was changed by this report.**
**Environment note:** no PHP runtime was available in the analysis sandbox, so every conclusion below is from static reading of the source. Confidence is marked per finding.

---

## 0. Executive answer to "are these code problems or test problems?"

| Verdict | Count (approx) | Meaning |
|---|---|---|
| **Real product bugs** — the code is wrong, the test is right | ~52 | Users are affected in production today |
| **Contract mismatches** — code and test disagree about the *right* answer, and the code's answer is defensible but undocumented | ~14 | Someone must decide which is truth, then fix the other side |
| **Stale test expectations** — code intentionally changed, tests weren't updated | ~11 | Test-side fix |
| **Harness drift** — registry/config out of sync | 2 | Tooling fix |

**The single most important finding:** three of the biggest clusters (403 on reports, 500 on gated routes, and the AppSumo limit assertions) all trace back to **one underlying disease — plan identity is destroyed on write and then guessed back from a magic number that has since changed.** Fix that and roughly 45 of the 79 failures go with it.

---

## 1. THE ROOT DISEASE — plan tier is lossy, and the reverse-lookup is stale

### 1.1 What happens

`app/Models/Tenant.php:410` — `setPlanAttribute()`:

```php
if (is_string($value) && str_starts_with($value, 'ltd_')) {
    $this->attributes['plan'] = 'ltd';     // ← ltd_1 / ltd_2 / ltd_3 all collapse to 'ltd'
    $this->plan_limits = PlanRepository::getLtdSnapshot($value);
}
```

The tier is **thrown away**. The only way back is to guess it from `plan_limits['transactions_per_month']`.

There are **two** reverse-lookups in the codebase and they do not agree:

| Location | Accepts | Result for a real `ltd_3` tenant (value = `8000`) |
|---|---|---|
| `Tenant::effectivePlan()` (line 394) | `500 or 1000` → ltd_1 · `2000 or 3000` → ltd_2 · `6000 or 8000` → ltd_3 | ✅ `ltd_3` — **was patched for the new numbers** |
| `ReportTierGate::tier()` (line 16) | `500` → starter · `2000` → growth · `6000` → business | ❌ **no branch matches** → returns the literal string `'ltd'` |

`ReportTierGate::check()` then does:

```php
$tenantIndex = array_search($tenantTier, self::$order);   // array_search('ltd', ['starter','growth','business']) === false
if ($tenantIndex === false) { $tenantIndex = 0; }          // ← silently demoted to STARTER
```

**Every LTD tenant — i.e. every AppSumo customer, including LTD Tier 3 — is treated as starter tier for reports.** They get `403 Upgrade to Growth/Business to unlock this report` on reports they paid for.

This is a **live production bug**, not a test artefact. It is also *silent*: the `false` from `array_search` is swallowed by a defensive default that fails **open toward the wrong side** (deny) with no log line.

### 1.2 Why the numbers moved

`transactions_per_month` for LTD tiers exists in **three** places and all three disagree:

| Source | ltd_1 | ltd_2 | ltd_3 |
|---|---|---|---|
| `config/plans.php` (lines 135/161/187) | 500 | **2000** | **6000** |
| `config/pricing.php` (lines 187/198/209) | 1000 | **3000** | **8000** |
| `database/seeders/PlanFeatureMatrixSeeder.php` (lines 372–374) | 1000 | **3000** | **8000** |

Runtime reads the **seeded table** (3000/8000). Tests assert **config/plans.php** (2000/6000). Phase 4's "single source of truth pricing" was only half-landed: the *reader* was unified, the *values* were not.

### 1.3 Failures explained by this one cause

**403 cluster on report routes (≈20 of the 34):**
`OneCoreReconciliationGateTest::Party statement closing balance`, all 8 `Money\ReportReconciliationTest` cases, both `Money\SupplierStatementTest` cases, `Smoke\InertiaPageRenderTest` (tax / trial-balance / aged-receivables), `SerializationDragnetTest` (both), `Module12\ReportsTest` (tax / customer_and_item_party / sales_orders / profit_and_loss / daily_sales), `Module21\RealWorkflowIntegrationTest::tax_report_matches_sale_items`.

All of these create tenants with `createTenant(..., 'ltd_3')` and then read a growth/business-tier report.

**`Reports\CrossTenantReportLeakTest` — "UNCLASSIFIED: HttpResponseException"** is the *same* 403. `ReportTierGate::enforce()` uses `abort(response()->json(...))`, which throws a raw `HttpResponseException` instead of an `HttpException`; PHPUnit reports it as an uncaught exception rather than an HTTP status. Two bugs in one line — wrong tier, and an abort style that hides the status from the harness.

**Assertion cluster:**
`AppSumo\CodeStackingTest` (3 cases: 3000≠2000, 8000≠6000), `Core\PlanTruthFailClosedTest`, `Module11\BillingTest::two_codes_stacked_upgrades_to_ltd2`.

### 1.4 How to fix

**Do not patch `ReportTierGate::tier()` with the new magic numbers.** That is the third time this reverse-lookup would be hand-synced and it will rot again. Fix the cause:

1. **Stop destroying the tier.** Add a `plan_tier` column (or keep `plan` as `ltd_1|ltd_2|ltd_3` and add a separate `license_type = 'ltd'` flag). Migrate existing rows using `effectivePlan()` once, at migration time.
2. Delete both reverse-lookups (`Tenant::effectivePlan()` numeric branch and `ReportTierGate::tier()` numeric branch). Have `ReportTierGate::tier()` read the stored tier and map `ltd_1→starter, ltd_2→growth, ltd_3→business` — the `$map` it already has, which is currently dead code because `plan` is never `ltd_1` by the time it is read.
3. **Fail loudly, not silently.** In `ReportTierGate::check()`, when `array_search($tenantTier, self::$order) === false`, log an error and **allow** (fail-open for a paying tenant) rather than silently demoting to starter. Denying a paid feature because of an internal lookup miss is the worst possible default.
4. **Pick one home for plan limits.** Recommended: the seeded `plan_limits` table is truth; `config/plans.php` keeps only the key *shape* (which is already what `getLtdSnapshot()`'s docblock claims it does) and its numeric values are deleted so they cannot drift again. Then update `config/pricing.php` and the tests to read from `PlanRepository`, not from a literal.
5. Add a guard test: *"every value in `config/plans.php` that also exists in `plan_limits` must match"* — so a future drift fails one obvious test instead of forty obscure ones.

**If you need the numbers decided first:** `VENQORE_PRICING_AND_STRATEGY.md` should be the arbiter. Whichever it says (1000/3000/8000 or 500/2000/6000) wins, and the other two files get changed to match. Do not split the difference.

---

## 2. HTTP 500 cluster — `EnsurePlanFeature` redirects to a route that does not exist

**8 failures. This is a live 500 in production and the highest-severity item in the run.**

`app/Http/Middleware/EnsurePlanFeature.php:36`:

```php
return redirect()->route('billing.index')->with('warning', "...");
```

There is **no route named `billing.index`**. `routes/web.php:366` registers it as `->name('billing')` (and, inside the `store.` group, as `store.billing`).

So every non-JSON request that hits a plan-gated route the tenant does not own throws `RouteNotFoundException` → **HTTP 500 error page** instead of a redirect to the upgrade screen.

`ZiggyRouteIntegrityTest` independently caught the same missing name on the frontend: `resources/js/Components/PlanGate.jsx` also calls `route('billing.index')`, so **the upgrade wall component itself crashes** when it renders.

**Failures explained:**
`RegressionFixesTest::Report tier gating restricts access` (expects 403, got 500), `RegressionFixesTest::New features plan gating` (403→500), `InertiaPageRenderTest::Owner can render cash flow report` (200→500), `Module12\ReportsTest::cash_flow_report_loads_with_filters_and_data` (200→500), `Money\GatingTest::Cookbook works on a plan WITH bill_of_materials` (500), `OwnersDailyPulseTest` (200→500), `DocumentConversionTest` ×2 (302→500).

**Fix:**

- In `EnsurePlanFeature`, use the tenant-scoped name: `redirect()->route('store.billing', ['store_slug' => $tenant->slug])`. The bare `billing` route lives outside the store group and will not have tenant context.
- Fix `PlanGate.jsx` to call `route('store.billing', { store_slug: ... })`.
- **Add a guard test** that walks every `redirect()->route('...')` and `route('...')` string in `app/` and asserts the name is registered. You already have the JS-side version (`ZiggyRouteIntegrityTest`); the PHP side has no equivalent, which is why this shipped.

### 2.1 Same middleware, second bug: 402 vs 403

`EnsurePlanFeature` returns **402 Payment Required** for JSON. Tests expect **403**.

- `Money\GatingTest::Cookbook create/update/delete blocked on a plan without bill_of_materials` — expects 403, got 402
- `Module14\AiEngineTest::isolates ai settings per tenant` — expects 2xx/3xx, got 402

This is a **contract mismatch, not a bug** — but it is currently a three-way inconsistency and that *is* a bug:

| Denial reason | JSON response | Web response |
|---|---|---|
| `EnsurePlanFeature` | **402** | redirect (currently 500) |
| `PlanLimitException::render()` | **403** | `back()` with flash |
| `EnforceTransactionLimit` | **403** | **302** `back()` |
| `ReportTierGate::enforce()` | **403** (via raw `HttpResponseException`) | same |

Four gates, three status codes, four response shapes. The frontend cannot write one interceptor for this.

**Fix:** pick one. Recommendation — **402 for "your plan does not include this feature"**, **403 for "you lack permission"**, and a single JSON envelope (`{type, code, feature, message, upgrade_url}`) emitted by all of them. Then update the tests to match, in one commit, with the decision written into `CLAUDE.md`.

### 2.2 Route key mismatch on Cookbook

`routes/web.php:1134-1140` gates all cookbook routes on `plan.feature:recipes`, but `Money\GatingTest` and `PlanRepository::canUseFeature()` (line 210) both treat `recipes` and `bill_of_materials` as the same entitlement. A plan that grants `bill_of_materials` but not `recipes` is denied. Decide on one key and use it in the route, the seeder, and the test.

---

## 3. 302 cluster — `EnforceTransactionLimit` has no JSON contract, and lives on only half the routes

**9 failures.**

`app/Http/Middleware/EnforceTransactionLimit.php:39-43` returns 403 JSON when `$request->expectsJson()`, otherwise `redirect()->back()` → **302**.

`AppSumo\CodeStackingTest::Transaction limit blocks write at threshold` and `::Read access is never blocked at limit` use `$this->post(...)` (not `postJson`), so they take the redirect branch and see 302.
`Module04\PaymentProcessingTest` (4 cases) and `Money\ReturnIntegrityTest` (2 cases) hit the same branch.

**Is this a code problem or a test problem?** Both, and the code problem is worse:

1. `redirect()->back()` on a POS checkout with no `Referer` header redirects to `/`. A cashier who hits the monthly cap gets bounced to the dashboard with a flash message they may never see. That is a **bad product behaviour**, independent of tests.
2. The tests are also wrong to assert a bare 403 without sending JSON — but they are testing the right *intent*.

**Fix:**

- Make the middleware return the same envelope as §2.1 regardless of `expectsJson()` when the request is a POS/API write; use Inertia's `back()->with(...)` only for genuine full-page form posts.
- Then update the tests to `postJson`.

### 3.1 Bigger structural problem found while tracing this

There are **two separate `/s/{store_slug}` route groups with different middleware stacks**:

| Group | Line | Middleware |
|---|---|---|
| Group A | `routes/web.php:335` | auth, verified, tenant, **lifecycle**, drm, Demo, NoIndex, **EnforceHostedUntil** |
| Group B | `routes/web.php:970` | auth, verified, tenant, drm, Demo, NoIndex |

**Group B contains POS sales, all reports, purchases, cookbook, and settings** — i.e. the routes that matter. It has **neither `lifecycle` nor `EnforceHostedUntil`**.

So Phase 8's "wire transaction and hosting expiry middlewares to production routes" landed on the group that does *not* contain the write endpoints. **AppSumo hosting expiry is not enforced on sales.** An LTD tenant past `hosted_until` can keep selling forever.

This is not currently caught by any failing test — which makes it a **false negative in your suite**, the category you said matters most. Add a test that asserts every state-changing store route carries the hosting/lifecycle stack.

### 3.2 Double enforcement, two different answers

`SaleController::store()` line 49 *also* enforces the monthly cap:

```php
$monthlyCount = Sale::where('status','posted')->whereBetween('created_at', [$start,$end])->count();
PlanGate::enforce('transactions_per_month', $monthlyCount);
```

So `POST /sales` is limit-checked **twice**, by two components, with two different response shapes, and the controller counts `created_at` while the middleware counts a denormalised `tenants.transactions_this_month` counter. These can disagree.

**Remaining 403s on `POST /sales`** (`Module03\PosTerminalTest` ×2, `Module04::routes sale checkout cash overpayment`, `Module10\WooCommerceTest`, `Module15\PartiesLedgerTest` ×3, `Module17\SettingsTest` ×2, `Money\GatingTest::F17 under the limit`, `GoldenTransactionTest`) come from **one of exactly two emitters** — `PlanLimitException::render()` (403 JSON) or `EnforceTransactionLimit` (403 JSON). Static reading cannot separate them because both fire on the same condition.

**Diagnostic to run first (30 seconds, decides the fix):**

```bash
php artisan test --filter="F17: a tenant under the limit can still post a sale" -v
# then dump the body:
#   in the test, temporarily add  $response->dump();
# The JSON envelope tells you which:
#   {"type":"plan_limit",...}                  → PlanLimitException  (SaleController line 49)
#   {"code":"TRANSACTION_LIMIT_REACHED",...}   → EnforceTransactionLimit
```

**Fix either way:** delete one of the two enforcement points. Keep the middleware (it is declarative and testable), remove the inline `PlanGate::enforce` from `SaleController::store`, and make the middleware's counter authoritative.

---

## 4. AI metering — vocabulary renamed, contracts not migrated

**5 failures.**

`database/migrations/2026_08_04_000005_rename_ai_scans_to_pages_in_tenants.php` renamed `tenants.ai_scans_used → ai_pages_used` and `ai_scans_limit → ai_pages_limit`. `Tenant::$fillable` was updated. **Nothing else was.**

| Failure | Cause |
|---|---|
| `AiAndSyncEntitlementTest::monthly reset...` — `MissingAttributeException: ai_scans_used` | Test uses the old column name |
| `AiAndSyncEntitlementTest::free tier allowance comes from config` — `Undefined array key "scans_limit"` | Service return-key renamed to `pages_limit`, caller not updated |
| `AiAndSyncEntitlementTest::add-on provisioning survives NOT NULL applied_by` | assertion on renamed field |
| `Core\RecentFixesAuditTest::Provision tenant job stamps correct ai quotas` — got `0`, expected `200` | `ProvisionTenantJob` (lines 193-211) now writes the **new** quotas 500/1000/2000/4000; the test asserts the **old** 200 queries / 150 scans. `ai_queries_limit` came back `0`, so the job is also not setting it at all for that variant |
| `Module11\BillingTest::two_codes_stacked_upgrades_to_ltd2` | plan-limit array shape changed |

**Is this code or test?** Mostly test — the rename was deliberate (T2-1 "scans → pages"). **But two real bugs are hiding inside:**

1. `ai_queries_limit` returning `0` from `ProvisionTenantJob` is a genuine defect — a paying Lite subscriber gets zero AI queries. Verify `ProvisionTenantJob` line 289 sets `ai_queries_limit` on every branch, not just `ai_pages_limit`.
2. Grep for surviving `ai_scans_` references in `app/` and `resources/js/` — anything still reading the old name is now a runtime error, not a test failure. The migration used `hasColumn()` guards, so it is idempotent, but callers were not swept.

**Fix:** update the five tests to the new vocabulary and the new quota numbers **only after** confirming `ai_queries_limit` is genuinely being written. Do not update the test to expect `0`.

---

## 5. `ai_usage_events.raw_payload` — a Phase-5 feature that is a permanent no-op

**1 failure** (`MassAssignmentGuardTest`) **but a bigger truth problem.**

`database/migrations/2026_08_04_000001_create_ai_usage_events_table.php` creates the table with **no `raw_payload` column**.

`app/Console/Commands/PruneScanImagesCommand.php:56` is written defensively:

```php
if (DB::getSchemaBuilder()->hasTable('ai_usage_events') && DB::getSchemaBuilder()->hasColumn('ai_usage_events','raw_payload')) {
    ... ->update(['raw_payload' => null]);
}
```

The column never exists, so **the Phase-5 "scan image pruning" job silently does nothing on every install, forever.** The `hasColumn()` guard converts a loud failure into a permanent silent skip. `MassAssignmentGuardTest` caught the write side; nothing catches the no-op.

This is exactly the false-positive class you flagged: the changelog says the feature shipped, the tests are green on it, and it has never run.

**Fix:** decide whether raw payloads should be stored at all (they may contain customer invoice data — see the data-privacy work in Phase 5). Then either add the column in a migration, or **delete the pruning branch entirely** and remove the claim from `CHANGELOG_AI_SCAN_V2.md` / the Phase 5 status file. Do not leave the `hasColumn()` guard in place as a silent skip.

---

## 6. Public tools — a shipped page with no routes

**8 failures** (`Tools\BarcodeLabelSheetToolTest` ×7, `ZiggyRouteIntegrityTest`).

`resources/js/Pages/Marketing/Tools/BarcodeLabelSheet.jsx` calls `route('tools.barcode-label.sheet')` and `route('tools.barcode-label.parse')`. **Neither route exists.** `routes/web.php:89-101` registers `tools.barcode` / `tools.barcode.render` / `tools.barcode.sheet` — a different tool.

So the Barcode Label Sheet page is reachable-but-broken (it throws on render, since Ziggy `route()` on an unknown name throws).

**Related:** `Tools\ToolSeoCoverageTest` — `tools.invoice-scanner` and `tools.invoice-scanner.submit` (registered at `routes/web.php:104-105`) have **no `ToolSeo` entry**, so the AI-crawler visibility work from Phase 7 does not cover the flagship tool.

**Fix:** either register the three `tools.barcode-label.*` routes and point them at `BarcodeToolController`, or delete the JSX page and its test. Add the two `ToolSeo` rows. Both are cheap.

---

## 7. Guardrail ratchets — working as designed, treat as a to-do list

These two are **not broken tests.** They are the ratchets doing their job.

**`PermissionBypassGuardTest`: 285 unprotected write routes vs a ceiling of 281.**
Four new state-changing routes were added in Phase 7–9 without `permission:` middleware. `POST /sales` (line 1421) is itself one of the unprotected ones — it carries only `EnforceTransactionLimit`, no permission check, so any authenticated store member including a `viewer` can post a sale.

**Do not raise the ceiling.** Find the four and protect them:

```bash
php artisan route:list --method=POST --json | \
  php -r '$r=json_decode(stream_get_contents(STDIN),true); foreach($r as $x){ if(!str_contains(json_encode($x["middleware"]??[]),"permission:")) echo $x["uri"]," ",($x["name"]??"-"),"\n"; }'
```

**`NumberLineageCompletenessTest`: 100+ metrics with `[no ledger_accounts]`.**
Every report metric is expected to declare which ledger accounts it derives from. The new V3 report surface and the point-in-time/insights reports were added without lineage entries. This is a **documentation debt** test — the fix is populating the lineage registry, not changing the test. Worth doing: it is the only thing standing between you and "this number came from somewhere, we're not sure where."

**`Core\RegistryDriftTest` ×2 — harness only.**
`suites.yaml` lives at both `Tester/VerificationCenter/registry/` and `FinalTester/VerificationCenter/registry/`, and the ten new `tests/Feature/Phase*Test.php` files (in the **repo root** `tests/`, a third test root) are registered in neither. 1499 methods on disk vs 1429 declared.

You now have **three test roots**: `tests/`, `Tester/tests/`, `FinalTester/tests/`. Regenerating `suites.yaml` will paper over it; consolidating to one root is the real fix.

---

## 8. Remaining individual failures

| Test | Status | Likely cause | Verdict |
|---|---|---|---|
| `Chat\SmartCaptureSafetyTest::party chosen before scanning` | 200→**422** | Payload looks valid against `SmartCaptureController:185-204`. Most likely `smartcapture.max_files` resolving to `0`, making `max:{$maxFiles}` reject every request. Dump `$response->json('errors')` to confirm. | **Code** if max_files is 0 — that would break *all* scanning in production |
| `DemoStore\PageHealthTest::[PAGE-26] cookbook / recipes list loads` | 500 | §2 (`billing.index`) + §2.2 (recipes vs bill_of_materials key) | Code |
| `Smoke\ProductionSmokeTest::[SMOKE-16] WooCommerce plugin update check endpoint` | 500 | No route matching `plugin/update` or `update-check` found in `routes/`. Endpoint appears unregistered. | Code — the WP plugin auto-updater is dead |
| `Smoke\SerializationDragnetTest::generic reports return valid prop bags` | 403 | §1 | Code |
| `DocumentConversionTest` ×2 | 302→500 | §2 | Code |

---

## 9. Two things the suite is **not** catching (false negatives)

You said a false positive is worse than a failure. These are the ones I found.

1. **Hosting expiry is not enforced on sales** (§3.1). Route group B has no `EnforceHostedUntil`. Phase 8 is marked complete and has 61 passing tests; none of them assert the middleware is attached to the routes that take money. Add: *"every POST/PUT/PATCH/DELETE under `/s/{slug}` resolves a route whose middleware includes `EnforceHostedUntil` and `lifecycle`."*

2. **Scan-image pruning never runs** (§5). Guarded by `hasColumn()` against a column that does not exist. Green tests, zero execution.

Two more worth watching:

3. **Tests run on the `mysql` driver, production runs `mariadb`.** `.env.testing` and both `phpunit.xml` files set `DB_CONNECTION=mysql`; `.env` sets `mariadb`. `CLAUDE.md` explicitly warns that the `mysql` driver defaults to `utf8mb4_0900_ai_ci`, a collation MariaDB 10.5 does not have. **The test suite cannot catch a MariaDB incompatibility.** Set `DB_CONNECTION=mariadb` in both phpunit configs and `.env.testing`.

4. **`ReportTierGate::check()` fails closed on an internal error** (§1.4 item 3). Any future tier string it doesn't recognise silently denies a paying customer with no log line. That is a bug generator.

---

## 10. Suggested order of work

| # | Action | Unblocks | Risk |
|---|---|---|---|
| 1 | Fix `billing.index` → `store.billing` in `EnsurePlanFeature` **and** `PlanGate.jsx` | 8 failures + a live 500 | None |
| 2 | Decide the LTD transaction numbers (pricing doc is the arbiter); make the seeded table the only source; delete the numeric values from `config/plans.php` and `config/pricing.php` | 5 assertion failures | Low — needs a data migration for existing tenants |
| 3 | Stop collapsing `ltd_*` → `ltd`; store the tier; delete both numeric reverse-lookups | ~22 failures, incl. the whole 403 report cluster | Medium — migration + backfill |
| 4 | Make `ReportTierGate::check()` fail **open** with an error log on unknown tier | Prevents recurrence | None |
| 5 | Unify the four denial responses on one status + one envelope; update tests | ~11 failures | Low |
| 6 | Remove the duplicate limit check from `SaleController::store` | ~10 failures | Low |
| 7 | Attach `lifecycle` + `EnforceHostedUntil` to route group B | **False negative** | Medium — will start blocking expired tenants, which is the point |
| 8 | Sweep `ai_scans_*` → `ai_pages_*`; verify `ai_queries_limit` is written | 5 failures | Low |
| 9 | Register or delete the barcode-label routes; add the 2 `ToolSeo` rows | 8 failures | None |
| 10 | Protect the 4 new write routes; **do not raise the ratchet** | 1 failure | Low |
| 11 | Resolve `ai_usage_events.raw_payload` — add the column or delete the feature and the claim | 1 failure + **false negative** | None |
| 12 | Set `DB_CONNECTION=mariadb` in test configs; consolidate the three test roots; regenerate `suites.yaml` | 2 failures + **false negative** | Low |

Items 1–4 are one focused day and account for roughly 45 of the 79.

---

## Appendix — verification commands

```bash
# Confirm which gate emits the 403 on POST /sales (§3.2)
php artisan test --filter="F17: a tenant under the limit" -v

# Confirm the missing route name
php artisan route:list | grep -i billing

# Confirm the plan-limit three-way split
php artisan tinker --execute="
  dump(config('plans.ltd_2.transactions_per_month'));
  dump(config('pricing.ltd_plans.ltd_tier_2.transactions_per_month'));
  dump(App\Services\PlanRepository::getLimits('ltd_2')['transactions_per_month'] ?? null);
"

# Confirm the tier collapse
php artisan tinker --execute="
  \$t = App\Models\Tenant::first(); \$t->plan = 'ltd_3';
  dump(\$t->getAttributes()['plan']);                       // expect 'ltd'
  dump(App\Services\ReportTierGate::tier(\$t->plan));       // expect 'ltd'  ← the bug
"

# Confirm max_files (§8)
php artisan tinker --execute="dump(config('smartcapture.max_files'));"

# List unprotected write routes (§7)
php artisan route:list --method=POST
```
