# VenQore POS — Independent Final Launch Readiness Audit

**Audit date:** July 9, 2026  
**Auditor role:** Independent engineering/security/financial audit firm (external, adversarial, read-only)  
**Scope:** Full codebase (`app/`, `routes/`, `database/migrations/`, `resources/js/`, `Tester/tests/`), documentation set (`docs/*.md` + 6 named root reports), and independent re-verification of a pre-existing `FINAL_LAUNCH_READINESS_AUDIT.md` found already committed in this repository (dated July 8, 2026).  
**Method:** Direct code reading across five parallel research passes (documentation, financial engine, security/tenant isolation, test suite quality, architecture/operations/product), followed by hand-verification of the highest-stakes claims against the live source files before this report was written. No code was modified. No claim in this report is accepted from documentation alone — every finding below is backed by a quoted file:line.

---

## 1. Executive Summary

### Launch Verdict: **NOT READY**

VenQore POS is a technically ambitious, in places genuinely well-engineered ERP — the newer `V3` accounting and FIFO engine (`AccountingService`, `FifoService`, `FinancialReportingService`) demonstrates real double-entry discipline, row-level locking, and reports that read the ledger directly rather than trusting denormalized caches. If the product were *actually running on that engine end-to-end*, this would be a much shorter and more positive report.

It is not. The single most important fact this audit surfaced is this: **the live, customer-facing POS terminal ([Pos.jsx](file:///e:/AMD%20POS/AMD%20POS/resources/js/Pages/Pos.jsx)) does not use the V3 engine at all.** It posts every sale to a legacy controller ([SaleController.php](file:///e:/AMD%20POS/AMD%20POS/app/Http/Controllers/SaleController.php#L328-L350)) that contains a silent COGS-fabrication bug — when FIFO stock deduction fails or throws for any reason, the code invents a cost-of-goods-sold figure from the product's current cost field, posts it to the ledger as if it were real, and lets the sale proceed with no error, no flag, and no way for a merchant to know their inventory valuation and P&L have quietly diverged from reality. This is exactly the kind of defect an ERP audit exists to catch, and it sits on the single most-executed code path in the entire product.

Layered on top of that: platform-level database backups are not currently scheduled in production despite a runbook document explicitly claiming this was fixed two days ago (independently verified false by reading [console.php](file:///e:/AMD%20POS/AMD%20POS/routes/console.php) directly); WooCommerce-originated sales post no journal entry at all and are invisible to every financial report; a tenant-admin can self-escalate to a wildcard `'*'` permission that also defeats a specific billing-access denylist; and a 4-6 digit POS PIN login endpoint has zero rate limiting, making it brute-forceable.

None of this is exotic. All of it is reachable by an ordinary user or a predictable failure condition (a stockout, a network retry, a missed cron job) in the first weeks of real usage.

The prior audit found in this repository reached a similar top-line verdict (NOT READY) but for a different, and in one major case factually incorrect, set of reasons — it flagged a schema-drift issue this audit found no evidence for, while missing the COGS-fabrication bug, the WooCommerce accounting gap, and the backup-scheduling contradiction entirely. See Section 11 for the full reconciliation.

**Estimated time to a defensible "READY WITH CONDITIONS" launch: 3-5 weeks of focused engineering**, assuming the launch blockers in Section 4 are treated as a strict gate and each fix is verified with a new, specific regression test (not just a manual check-off).

---

## 2. Executive Scorecard

Scored 0-100 from direct code/test evidence, not from the project's own self-reported scores in `docs/EXECUTIVE_REPORT.md` (which this audit found to be stale — see Section 10).

| Dimension | Score | One-line justification |
|---|---:|---|
| **Financial Engine (design)** | 82 | V3 ledger/FIFO/reporting design is excellent — enforced balance, row-locked FIFO, ledger-sourced reports. |
| **Financial Engine (as actually run)** | **38** | The live POS write path (legacy `SaleController`) silently fabricates COGS on FIFO failure; WooCommerce sales post no journal entry at all. |
| **Security** | 54 | Terminal hijack was patched; PIN login has zero rate limiting; wildcard permission self-escalation is live; unauthenticated screenshot upload is a DoS vector. |
| **Testing** | 68 | Genuinely strong value-level assertions exist (`SaleFinancialValueGuardTest`, `GoldenTransactionTest`) but they test the V3 path the real POS doesn't use; primary sale endpoint has zero idempotency test or protection. |
| **Documentation** | 40 | Internally contradictory across dates (see Section 10); several "done" claims (backups, HeartbeatController fix) are disproven by reading the code the same or next day. |
| **UI/UX** | 71 | Per the project's own `docs/UIUX.md` (self-assessed, methodologically reasonable) — not independently re-verified in this pass. |
| **Stability** | 58 | Dual sale-engine split, dead WooCommerce stock-sync command silently no-ops, offline sync bypasses HTTP middleware entirely. |
| **Maintainability** | 60 | V3 code is clean and thin; legacy controllers are 1,000-1,700 line fat controllers doing raw SQL, tax math, and transaction management inline. |
| **Scalability** | 62 | Sound monolith shape; `TenantMiddleware` runs 4 uncached existence queries plus a debug log line on every request. |
| **Multi-tenancy** | 74 | `HasTenant` deny-by-default scope is sound; 2 unnecessary `withoutGlobalScope` call sites found; retrofitted tenant-ID migrations from April suggest isolation was not correct from inception. |
| **Deployment/CI** | 55 | Real CI pipeline exists, but its test job runs against SQLite in direct contradiction of the project's own "MySQL only, no SQLite" policy; deploy workflow is not gated on CI passing. |
| **Monitoring** | 25 | No Sentry/APM/error-tracking of any kind found in `composer.json` or `package.json`; scheduled jobs have no failure alerting. |
| **Billing** | 78 | Lemon Squeezy webhook signature verification is real and correctly implemented; AppSumo redemption is properly locked against race conditions. |
| **SaaS Readiness** | 65 | Onboarding wizard and demo-seeding pipeline are real and non-trivial; billing is solid; offset by the financial-integrity and monitoring gaps above. |
| **AppSumo Readiness** | 75 | Redemption flow is well-locked; not independently verified beyond the redemption controller itself. |
| **Production Confidence** | **35** | A financial ERP whose primary write path can silently fabricate ledger numbers, with no scheduled platform backup and no error monitoring, is not something I would stake customer trust on today. |
| **OVERALL** | **52** | **Strong architecture in the parts that aren't wired up to production traffic; the parts that are have a live financial-integrity bug.** |

---

## 3. Evidence-Based Findings

### Finding 1 — Live POS sale path silently fabricates COGS on FIFO failure
**Severity: CRITICAL (Launch Blocker)**

**Evidence** — [SaleController.php:328-350](file:///e:/AMD%20POS/AMD%20POS/app/Http/Controllers/SaleController.php#L328-L350), confirmed by direct read:
```php
// FIFO Deduction
$itemCogs = 0;
if ($isStockEnabled && $this->fifo->checkAvailability($ld['product_id'], $sale->warehouse_id, $totalQty)) {
    try {
        $deductions = app(\App\Services\V3\FifoService::class)->deductStock($ld['product_id'], $sale->warehouse_id, $totalQty);
        foreach ($deductions as $d) {
            $itemCogs += $d['total_cost'];
            DB::table('sale_item_batches')->insert([...]);
        }
        $saleItem->update(['cost_price' => $totalQty > 0 ? $itemCogs / $totalQty : 0]);
    } catch (\Exception $e) { $itemCogs = ($product->cost_price ?? 0) * $totalQty; }
} else {
    $itemCogs = ($product->cost_price ?? 0) * $totalQty;
}
$totalCogs += $itemCogs;
```
This fabricated `$itemCogs` then flows straight into the ledger ([SaleController.php:1474-1480](file:///e:/AMD%20POS/AMD%20POS/app/Http/Controllers/SaleController.php#L1474-L1480), `postSaleJournal()`): `DR 5000 Cost of Goods Sold / CR 1100 Inventory Asset` for the made-up amount.

**Why it matters.** `checkAvailability()` only checks positive-remaining FIFO batches and has no awareness of the store's `stopNegative` setting — meaning this fallback fires even in configurations where negative stock is explicitly allowed by the merchant. When it fires: `inventory_batches.remaining_qty` is never decremented, no `sale_item_batches` audit row is written (this table is the FIFO/COGS audit trail the reporting layer's own documentation calls required), and the ledger's Inventory Asset account is credited by a guess — `product.cost_price`, a mutable field that can reflect a much later purchase cost than the actual (unavailable) batch. Both `getBalanceSheet()` and `getTrialBalance()` will still report "balanced," because the fabricated entry is internally self-consistent (debit = credit for the same made-up number) — nothing in the reporting layer can distinguish a real FIFO-costed entry from a fabricated one. Over time, `SUM(inventory_batches.remaining_qty × unit_cost)` and the GL's Inventory Asset balance silently diverge, with no automatic reconciliation check anywhere in the codebase.

Compounding: the live POS also gates initial stock availability against a *different* table (`stocks`, line 277) than the one FIFO deduction actually reads (`inventory_batches`, via `checkAvailability()`, line 330) — two different "truth" sources for the same quantity, kept in sync by nothing.

**Affected files:** 
*   [SaleController.php](file:///e:/AMD%20POS/AMD%20POS/app/Http/Controllers/SaleController.php#L328-L350)
*   [V3\FifoService.php](file:///e:/AMD%20POS/AMD%20POS/app/Services/V3/FifoService.php)
*   [Pos.jsx](file:///e:/AMD%20POS/AMD%20POS/resources/js/Pages/Pos.jsx#L1039) (confirms this is the controller the real POS terminal posts to, via `route('store.sales.store', ...)`).

**Risk:** Inventory valuation and P&L silently drift from physical reality on every stockout or FIFO exception, with no alert, no failing test, and no reconciliation check to catch it. For an ERP whose entire value proposition is accounting correctness, this is as serious as a launch blocker gets.

**Recommendation:** Remove the fallback entirely — if FIFO deduction cannot produce a real cost, the sale should either hard-fail (consistent with the `stopNegative` setting already enforced two lines earlier) or route through `FifoService`'s own documented negative-stock handling (which *does* create a proper `negative_stock` batch and would keep `inventory_batches` and the ledger in sync). Then add a scheduled reconciliation job comparing `getInventoryValue()` against the GL's Inventory Asset (1100) balance, alerting on any drift — this is the automatic backstop that's currently missing entirely.

---

### Finding 2 — Platform database backups are not scheduled in production, contradicting the project's own runbook
**Severity: CRITICAL (Launch Blocker)**

**Evidence.** `docs/RUNBOOK.md:12-15` states: *"Cron Schedule: daily at 01:30 server time, via `routes/console.php`... This was documented but not actually scheduled until 2026-07-07 — the command existed but nothing ever called it, so no backups were being produced in production."* This reads as a claim that the gap was fixed on July 7.

I read [console.php](file:///e:/AMD%20POS/AMD%20POS/routes/console.php) in full (115 lines) on July 9 — two days after that claimed fix. Neither `vq:backup` nor `backup:verify` (the two commands `app/Console/Commands/CreateVqBackup.php` and `VerifyBackup.php` implement) appear anywhere in the schedule. The only backup-related entry present is:
```php
// routes/console.php:76-79
\Illuminate\Support\Facades\Schedule::command('backup:google-drive')
    ->dailyAt('02:00')
    ->withoutOverlapping()
    ->onOneServer();
```
`backup:google-drive` (`app/Console/Commands/SyncGoogleDriveBackups.php`) is an **opt-in, per-tenant customer feature** — it only backs up tenants that have explicitly enabled `google_backup_enabled` and connected their own Google Drive account. It is not a platform-level backup of the `venqore_pos` production database, and provides zero protection for tenants who haven't opted in (almost certainly the majority, since it requires manual customer setup).

**Why it matters.** Either the RUNBOOK's claimed fix was never actually committed, or it regressed sometime in the last two days — either way, the documentation the team would rely on during an actual incident is currently wrong, and there is, right now, no scheduled full-database backup and no scheduled restore verification (`backup:verify` is also unscheduled) for the production database of a financial system of record.

**Affected files:** 
*   [console.php](file:///e:/AMD%20POS/AMD%20POS/routes/console.php#L76-L79)
*   [RUNBOOK.md](file:///e:/AMD%20POS/AMD%20POS/docs/RUNBOOK.md#L12-L20)
*   [CreateVqBackup.php](file:///e:/AMD%20POS/AMD%20POS/app/Console/Commands/CreateVqBackup.php)
*   [VerifyBackup.php](file:///e:/AMD%20POS/AMD%20POS/app/Console/Commands/VerifyBackup.php)

**Risk:** A disk failure, bad migration, or accidental data-destructive operation today would have no recent platform-level backup to restore from, for any tenant not individually opted into personal Google Drive sync.

**Recommendation:** Add `Schedule::command('vq:backup')->dailyAt('01:30')->withoutOverlapping()->onOneServer()` and a weekly `backup:verify` restore-drill to `routes/console.php` immediately, confirm via `php artisan schedule:list` on the actual production box (not just locally), and correct the RUNBOOK once genuinely verified rather than once believed fixed.

---

### Finding 3 — WooCommerce-originated sales post no journal entry and are invisible to every financial report
**Severity: CRITICAL (Launch Blocker for any tenant using WooCommerce)**

**Evidence** — [WooCommerceController.php:43-132](file:///e:/AMD%20POS/AMD%20POS/app/Http/Controllers/WooCommerceController.php#L43-L132). The webhook handler processes the sale via the legacy, non-tenant-scoped `InventoryService::processSale()` and then:
```php
// WooCommerceController.php:110-119
$total = $this->inventoryService->processSale($itemsToProcess, $party->id);
Transaction::create([
    'party_id' => $party->id, 'invoice_id' => 'WC-' . $payload['id'],
    'amount' => $total, 'type' => 'debit',
    'running_balance' => $party->current_balance + $total, // Simplified
]);
```
No call to `AccountingService::createEntry()` anywhere in this path. `FinancialReportingService` (correctly, by its own documented design) reads exclusively from `journal_items` — meaning any tenant syncing sales from WooCommerce will see those sales in neither their P&L, nor Balance Sheet, nor Trial Balance, nor Inventory Valuation report.

Additionally, `processSale()` calls the legacy `App\Services\InventoryService::deductFromBatches()` (`app/Services/InventoryService.php:71-92`), which decrements the `stocks` table with **no `lockForUpdate()`** — a genuine race condition under concurrent WooCommerce webhook delivery, separate from the FIFO layer entirely (`inventory_batches` is never touched by this path).

**Why it matters.** This isn't a drift risk like Finding 1 — it's a total omission. A tenant who connects WooCommerce and sells through it will have real revenue that never appears anywhere in their accounting reports, while inventory is decremented through an unlocked, race-prone path that never touches the FIFO layer the rest of the system depends on for COGS.

**Affected files:** 
*   [WooCommerceController.php](file:///e:/AMD%20POS/AMD%20POS/app/Http/Controllers/WooCommerceController.php#L43-L132)
*   [InventoryService.php](file:///e:/AMD%20POS/AMD%20POS/app/Services/InventoryService.php#L71-L92)
*   [FinancialReportingService.php](file:///e:/AMD%20POS/AMD%20POS/app/Services/FinancialReportingService.php)

**Risk:** Silent, total revenue/COGS omission for any WooCommerce-integrated tenant — a severe correctness failure for exactly the customer segment (multi-channel retail) this integration is meant to serve.

**Recommendation:** Route `WooCommerceController::webhook()` through `V3\SaleService::post()` (or an equivalent that posts a real journal entry and uses `FifoService`), the same way the newer WooSync engine (`WooWebhookController` + `SyncEngine`) should be confirmed to already do correctly before assuming this legacy webhook handler is even still the one in production use.

---

### Finding 4 — Two parallel, functionally divergent sale-posting engines; the live POS uses the weaker one
**Severity: CRITICAL (Launch Blocker — root cause of Finding 1)**

**Evidence.**
*   POS page link: [Pos.jsx:1039](file:///e:/AMD%20POS/AMD%20POS/resources/js/Pages/Pos.jsx#L1039) `axios.post(route('store.sales.store', {...}), payload)`
*   Legacy route: [web.php:1053](file:///e:/AMD%20POS/AMD%20POS/routes/web.php#L1053) `Route::post('/sales', [\App\Http\Controllers\SaleController::class, 'store'])->name('sales.store');`
*   V3 route: [web.php:1475](file:///e:/AMD%20POS/AMD%20POS/routes/web.php#L1475) `Route::post('sales', [\App\Http\Controllers\V3\SaleController::class, 'store'])->name('sales.store');` (in V3 group)

The route name the POS actually calls, `store.sales.store`, resolves to the legacy controller. The V3 engine — with real request validation, a distributed checkout lock (`Cache::lock("tenant_{$tenantId}_checkout_lock", 10)`), and the clean `FifoService`/`AccountingService` design praised in the scorecard above — exists, is well-built, and is not what customers use when they ring up a sale.

Worse: the **offline sync replay path** ([SyncController.php:167](file:///e:/AMD%20POS/AMD%20POS/app/Http/Controllers/Api/SyncController.php#L167)) also targets the legacy controller, and does so by manually instantiating a `Request` object and calling `SaleController::store()` directly — bypassing the HTTP kernel and middleware stack entirely (no FormRequest validation, no checkout lock, no standard permission middleware). Failed orders in that batch loop are caught, logged, and silently skipped, with no dead-letter queue or client-visible partial-failure signal.

**Why it matters.** Every fix, every tax rule, every discount edge case has to be built and maintained twice, and the newer, better-guarded engine is the one *not* protecting real transactions. This is the direct architectural cause of Finding 1 — the COGS-fabrication bug does not exist in `V3\SaleService`, only in the legacy path the POS actually calls.

**Affected files:** 
*   [Pos.jsx](file:///e:/AMD%20POS/AMD%20POS/resources/js/Pages/Pos.jsx#L1039)
*   [web.php](file:///e:/AMD%20POS/AMD%20POS/routes/web.php#L1053)
*   [SyncController.php](file:///e:/AMD%20POS/AMD%20POS/app/Http/Controllers/Api/SyncController.php#L167)

**Risk:** Ongoing calculation drift between what the POS charges and what the back-office ledger would compute; every future financial bugfix has to be remembered twice; the offline-sync path additionally has no request validation or race protection at all.

**Recommendation:** Do not attempt a "big bang" cutover under launch pressure. Instead: fix Finding 1 in the legacy path immediately (it's a small, surgical change), then run the V3 engine behind a feature flag on a subset of internal test stores in shadow mode, verify zero discrepancy for 1-2 weeks, and only then cut the POS over and deprecate the legacy controller.

---

### Finding 5 — Wildcard permission self-escalation, reachable by any tenant admin, defeats a specific billing denylist
**Severity: HIGH**

**Evidence.** [CheckPermissions.php:49-52](file:///e:/AMD%20POS/AMD%20POS/app/Http/Middleware/CheckPermissions.php#L49-L52):
```php
// God-mode wildcard bypass
if (in_array('*', $userPerms)) {
    return $next($request);
}
```
`User::getPermissionsAttribute()` ([User.php:401-432](file:///e:/AMD%20POS/AMD%20POS/app/Models/User.php#L401-L432)) returns the tenant user's custom `permissions` pivot column verbatim, with no whitelist validation. The write path, `AdminController::updateMember()` ([AdminController.php:809-864](file:///e:/AMD%20POS/AMD%20POS/app/Http/Controllers/AdminController.php#L809-L864)), accepts `'permissions' => 'nullable|array'` with no per-element validation — it only strips the literal string `admin.billing_store` for non-owners (line 848). Because the wildcard check runs *before* that denylist is ever consulted, a non-owner admin can request `permissions: ['*']` instead of the specific blocked key and silently obtain billing access anyway. The route guarding this action ([web.php:237](file:///e:/AMD%20POS/AMD%20POS/routes/web.php#L237)) requires only the broader `permission:admin.settings_manage`, not the more specific `permission:users.manage` its sibling routes (`users.store`/`users.remove`, lines 238-239) both require.

**Why it matters.** This is a real, live privilege-escalation path reachable by any tenant admin (not even the owner) against themselves or any staff member in their store, and it specifically defeats a control (the billing-access denylist) that was clearly written with the wildcard case in mind but placed in the wrong order relative to it.

**Affected files:** 
*   [CheckPermissions.php](file:///e:/AMD%20POS/AMD%20POS/app/Http/Middleware/CheckPermissions.php#L49-L52)
*   [User.php](file:///e:/AMD%20POS/AMD%20POS/app/Models/User.php#L401-L432)
*   [AdminController.php](file:///e:/AMD%20POS/AMD%20POS/app/Http/Controllers/AdminController.php#L809-L864)
*   [web.php](file:///e:/AMD%20POS/AMD%20POS/routes/web.php#L237-L239)

**Risk:** Unauthorized billing access and full permission escalation within a tenant by a non-owner admin.

**Recommendation:** Remove the wildcard bypass entirely; explicitly enumerate the full permission set for the `owner` role in `config/permissions.php` instead. Validate individual permission strings against that config on write, not just deny-list one key. Require `permission:users.manage` on the `updateMember` route to match its siblings.

---

### Finding 6 — POS PIN login has zero rate limiting; a 4-6 digit PIN is brute-forceable
**Severity: HIGH**

**Evidence.** [AuthenticatedSessionController.php:120-146](file:///e:/AMD%20POS/AMD%20POS/app/Http/Controllers/Auth/AuthenticatedSessionController.php#L120-L146) looks up any active `TenantUser` in a given `store_id` and checks a 4-6 digit PIN via `Hash::check()` in a loop, with no throttle/lockout anywhere in the method. `routes/auth.php:30` confirms the route (`POST login/pin`) carries no `throttle` middleware. A 4-digit PIN is a 10,000-value keyspace — trivially brute-forceable from a single unauthenticated endpoint with no rate limit, in contrast to the standard `/login` route and the dedicated platform/staff login controllers, which all do implement proper attempt-lockout.

**Affected files:** 
*   [AuthenticatedSessionController.php](file:///e:/AMD%20POS/AMD%20POS/app/Http/Controllers/Auth/AuthenticatedSessionController.php#L120-L146)
*   [routes/auth.php](file:///e:/AMD%20POS/AMD%20POS/routes/auth.php#L30)

**Risk:** Account takeover of any staff PIN-login account (commonly used for fast cashier login at a physical terminal) via brute force.

**Recommendation:** Add `throttle:10,1` at minimum, ideally a progressive lockout matching the pattern already used for `/login`.

---

### Finding 7 — Unauthenticated screenshot upload endpoint is an unbounded storage-exhaustion vector
**Severity: HIGH**

**Evidence.** [TerminalActivityController.php](file:///e:/AMD%20POS/AMD%20POS/app/Http/Controllers/Api/TerminalActivityController.php)'s `uploadScreenshot()` method accepts a file with only a cosmetic `.bin` suffix check — no `mimes:`, no `max:` size validation. The route (`routes/api.php:16`) carries only `throttle:60,1` (IP-keyed) and no `auth:sanctum`. `deploy/nginx/venqore.conf:64` allows up to 100MB per request. A single unauthenticated attacker IP can therefore push roughly 6GB/minute of arbitrary binary data into server storage indefinitely.

**Affected files:** 
*   [TerminalActivityController.php](file:///e:/AMD%20POS/AMD%20POS/app/Http/Controllers/Api/TerminalActivityController.php)
*   [routes/api.php](file:///e:/AMD%20POS/AMD%20POS/routes/api.php#L16)
*   [deploy/nginx/venqore.conf](file:///e:/AMD%20POS/AMD%20POS/deploy/nginx/venqore.conf#L64)

**Risk:** Denial of service via disk exhaustion; no authentication required.

**Recommendation:** Require the same terminal-ownership authentication pattern already implemented for the heartbeat/activity endpoints (see Finding 8), and add explicit `mimes:` and `max:` validation.

---

### Finding 8 — Terminal hijack vulnerability: real, but already patched — with one residual gap
**Severity: MEDIUM (down from CRITICAL — largely resolved)**

**Evidence.** The prior audit in this repo (dated July 8) flagged `HeartbeatController` and `TerminalActivityController` as allowing unauthenticated cross-tenant terminal hijacking. Independent re-verification confirms this was a real bug, and that it has been fixed in both controllers as of the current code:
```php
// HeartbeatController.php:64-68 / TerminalActivityController.php:56-60 (equivalent)
if ($tenant) {
    if (empty($terminal->tenant_id)) {
        $terminal->update(['tenant_id' => $tenant->id]);
    } elseif ((string) $terminal->tenant_id !== (string) $tenant->id) {
        return response()->json(['error' => 'Terminal does not belong to this store.'], 403);
    }
}
```
A regression test exists and correctly documents the original bug ([TerminalOwnershipGuardTest.php](file:///e:/AMD%20POS/AMD%20POS/Tester/tests/Feature/Guardrails/TerminalOwnershipGuardTest.php)).

**Residual gap:** "first-contact claiming" is still open by design — any unauthenticated caller who reaches a still-*unclaimed* terminal (`tenant_id IS NULL`) can claim it for their own store first, denying the legitimate tenant if they can guess/enumerate an unpaired `device_id`. Separately, `HeartbeatController::checkForUpdates()` runs an unscoped `DB::table('products')->where('updated_at', '>', $threshold)->exists()` across all tenants — a low-severity cross-tenant existence-only signal leak.

**Recommendation:** Issue a one-time pairing token at terminal provisioning time so "claiming" requires proof of possession, not just a guessed device ID. Scope `checkForUpdates()` to the resolved tenant.

---

### Finding 9 — Purchase returns always debit Accounts Payable, even for cash purchases that never created an AP balance
**Severity: HIGH**

**Evidence.** [PurchaseReturnController.php:128-140](file:///e:/AMD%20POS/AMD%20POS/app/Http/Controllers/V3/PurchaseReturnController.php#L128-L140) unconditionally posts:
```php
$journalLines = [
    ['account_code' => '2000', 'debit' => $totalReturnCost, 'credit' => 0, 'party_id' => $purchase->party_id], // AP
    ['account_code' => '1100', 'debit' => 0, 'credit' => $totalReturnCost],                                     // Inventory
];
```
with no check of `purchase.payment_method`. A cash purchase posts `DR 1100 / CR 1000` (cash) at time of purchase — no Accounts Payable line is ever created. Returning it debits AP anyway, creating a phantom negative-AP balance for a supplier who was paid in full and has no outstanding balance.

**Affected files:** 
*   [PurchaseReturnController.php](file:///e:/AMD%20POS/AMD%20POS/app/Http/Controllers/V3/PurchaseReturnController.php#L128-L140)

**Risk:** Corrupted aged-payables report and supplier ledger balances for any cash-purchase return.

**Recommendation:** Branch on `payment_method` the same way the original purchase posting does, or reverse the *actual* originally-posted journal lines (as the sale-return path correctly does) rather than assuming a fixed account pair.

---

### Finding 10 — Partial sale returns silently become full reversals in the V3 engine
**Severity: MEDIUM**

**Evidence.** `V3\SaleService::reverse()`'s own docblock states partial-item filtering is "not yet used (full reversal for now)" ([SaleService.php:428](file:///e:/AMD%20POS/AMD%20POS/app/Services/V3/SaleService.php#L428)), yet `V3\SaleReturnController::store()` accepts and validates a per-item `return_qty` array from the client UI and passes it straight through — the interface promises a partial return; the service silently performs a full one instead.

**Affected files:** 
*   [SaleService.php](file:///e:/AMD%20POS/AMD%20POS/app/Services/V3/SaleService.php#L428)
*   [SaleReturnController.php](file:///e:/AMD%20POS/AMD%20POS/app/Http/Controllers/V3/SaleReturnController.php)

**Risk:** A merchant processing a partial return via the (presumably intended future) V3 UI would have their entire sale reversed instead — a correctness bug, though currently lower-impact since the live POS doesn't use this engine (Finding 4). Will become live-critical the moment the V3 cutover happens.

**Recommendation:** Implement the partial-reversal logic before any V3 cutover; add a test asserting a partial return leaves the un-returned portion's stock and journal entries untouched.

---

### Finding 11 — CI test job runs against SQLite, directly contradicting the project's own "MySQL only" policy; deploy is not gated on CI
**Severity: HIGH**

**Evidence.** [venqore-tests.yml](file:///e:/AMD%20POS/AMD%20POS/.github/workflows/venqore-tests.yml#L55-L57) configures `.env.testing` with `DB_CONNECTION=sqlite`, `DB_DATABASE=:memory:`. This directly contradicts `CLAUDE.md`'s explicit policy: *"Strict MySQL Policy: The entire system is built strictly on MySQL. SQLite is NOT supported for any part of the system (including testing)."* A separate [ci.yml](file:///e:/AMD%20POS/AMD%20POS/.github/workflows/ci.yml#L13-L21) does correctly use a MySQL 8.0 service container. [deploy.yml](file:///e:/AMD%20POS/AMD%20POS/.github/workflows/deploy.yml) triggers independently on push to `main` and is not a `workflow_run` gated on either test workflow succeeding — a direct push to `main` could deploy without any test having run.

**Why it matters.** Given multiple financial invariants in this codebase are enforced by real MySQL triggers (the over-allocation check, the negative-stock CHECK constraint), any test run against SQLite is not actually exercising those guards at all — a false-positive-green risk on exactly the tests meant to protect financial correctness.

**Affected files:** 
*   [venqore-tests.yml](file:///e:/AMD%20POS/AMD%20POS/.github/workflows/venqore-tests.yml)
*   [ci.yml](file:///e:/AMD%20POS/AMD%20POS/.github/workflows/ci.yml)
*   [deploy.yml](file:///e:/AMD%20POS/AMD%20POS/.github/workflows/deploy.yml)

**Risk:** Tests can report green while silently not enforcing DB-level financial invariants; deploys can ship without tests running at all.

**Recommendation:** Standardize all CI test workflows on MySQL. Gate `deploy.yml` on the test workflows succeeding via `workflow_run`.

---

### Finding 12 — TenantMiddleware runs uncached queries and a debug log line on every single tenant request
**Severity: MEDIUM**

**Evidence.** [TenantMiddleware.php:219-225](file:///e:/AMD%20POS/AMD%20POS/app/Http/Middleware/TenantMiddleware.php#L219-L225) runs four unconditional, uncached `exists()` queries (products, purchases, sales, expenses) on every request through the middleware, plus an unconditional `Log::info('TenantMiddleware sharing store: ...')` at line 255, marked in-code as `// Temporary Debug`.

**Affected files:** 
*   [TenantMiddleware.php](file:///e:/AMD%20POS/AMD%20POS/app/Http/Middleware/TenantMiddleware.php#L219-L225)

**Risk:** Unnecessary database load and log-file growth on every page view across the whole platform.

**Recommendation:** Cache onboarding-metrics booleans (10-15 min TTL, invalidate on write), delete the debug log line.

---

### Finding 13 — 41% of Eloquent models are fully mass-assignment-unguarded; static analyzer only covers a fraction of write patterns
**Severity: MEDIUM**

**Evidence.** 50 of 121 models declare `protected $guarded = [];`, including financially sensitive ones (`Payment`, `Party`, `Invoice`, `Product`, `PaymentAllocation`, `Expense`, `BankAccount`). A full-codebase grep for the highest-risk pattern (`Model::create($request->all())`) found zero live occurrences — so this is currently latent, not actively exploited. However, `app/Support/Guardrails/MassAssignmentAnalyzer.php` — the static analyzer meant to catch this class of bug — only scans static `Model::create()`/`DB::table()->insert()` call sites with literal string keys; it does not cover instance-method writes (`$model->update([...])`, `$model->fill([...])`), which is the dominant write pattern in this codebase's controllers, nor nested relation saves, nor dynamically-keyed arrays.

**Affected files:** 
*   [MassAssignmentAnalyzer.php](file:///e:/AMD%20POS/AMD%20POS/app/Support/Guardrails/MassAssignmentAnalyzer.php)
*   50 model files (sampled: [Payment.php](file:///e:/AMD%20POS/AMD%20POS/app/Models/Payment.php), [Party.php](file:///e:/AMD%20POS/AMD%20POS/app/Models/Party.php), [Invoice.php](file:///e:/AMD%20POS/AMD%20POS/app/Models/Invoice.php), [Product.php](file:///e:/AMD%20POS/AMD%20POS/app/Models/Product.php)).

**Risk:** Any future controller change that does `Model::create($request->all())` or `$model->update($request->all())` on one of these 50 models is immediately and silently exploitable, and the analyzer meant to catch exactly this would miss the instance-method form.

**Recommendation:** Extend `$fillable` explicitly on financially sensitive models rather than relying on `$guarded = []` plus controller discipline. Extend `MassAssignmentAnalyzer` to cover instance-method calls, not just static ones.

---

## 4. Launch Blockers, Priorities

**Launch Blockers (must fix before any paid launch):**
1.  Finding 1 — Legacy POS COGS fabrication on FIFO failure
2.  Finding 2 — No scheduled platform database backup
3.  Finding 3 — WooCommerce sales invisible to financial reports
4.  Finding 4 — Dual sale engine (root cause enabling #1)

**High Priority (fix within the first post-launch sprint, ideally before):**
5.  Finding 5 — Wildcard permission self-escalation
6.  Finding 6 — Unthrottled PIN login
7.  Finding 7 — Unauthenticated screenshot upload DoS
8.  Finding 9 — Purchase return AP bug for cash purchases
9.  Finding 11 — CI/SQLite policy contradiction, ungated deploys

**Medium Priority:**
10. Finding 8 — Terminal hijack residual first-contact-claim gap
11. Finding 10 — Partial return silently full-reverses (becomes urgent only once V3 is live)
12. Finding 12 — TenantMiddleware performance
13. Finding 13 — Mass assignment guard coverage gap

**Nice to Have:** Monitoring/APM integration (no Sentry or equivalent found anywhere in the stack — genuinely worth elevating given the above, but not a hard launch gate if the team commits to actively watching logs in the first weeks); migration squashing (252 files, no consolidation); documentation reconciliation (Section 10).

---

## 5. Test Suite Audit

**Verdict on the team's own claim** ("we upgraded from existence checks to value assertions"): **substantively true for the financial core, overstated for coverage of what actually runs in production.**

What's genuinely strong, verified by hand-checking the arithmetic:
-   `SaleFinancialValueGuardTest.php` — asserts exact values (`net_sales` = 180.00, `invoice_total` = 189.00 for a $200 gross / 10% discount / 5% tax scenario) and I independently confirmed the arithmetic is correct (200 − 20 = 180; 180 × 1.05 = 189). This is real value-level testing, not existence checking.
-   `GoldenTransactionTest.php` — a full buy → credit-sell → partial-return lifecycle with exact FIFO batch consumption, exact COGS, cross-report reconciliation between item-level gross profit and the P&L's gross profit figure, and a trial-balance-zero check. This is exemplary test design.
-   `AccountingIntegrityGuardTest.php` — asserts the engine *rejects* unbalanced entries and checks per-entry (not just tenant-wide) balance, which correctly catches compensating-error masking that a naive trial-balance-only check would miss.
-   Negative permission tests exist (`GranularPermissionTest.php`) — managers/cashiers/accountants are asserted *blocked* from actions outside their role, paired with owner-allowed positive controls. This is real negative testing, not just happy-path.

Where the claim doesn't hold up:

-   **The strongest financial tests target the V3 engine — the one the live POS doesn't use.** `SaleFinancialValueGuardTest` and `GoldenTransactionTest` both exercise `V3\SaleService`. Finding 1's COGS-fabrication bug lives in the legacy `SaleController`, which has no equivalent value-assertion test coverage found anywhere in the suite. A 700-test-strong suite can be entirely green while the actual production write path silently corrupts the books.
-   **`OfflineSyncIdempotencyGuardTest` doesn't exercise the vulnerability it claims to guard.** Both test methods submit `'items' => []`, which fails `SaleController::store()`'s own validation (`required|array|min:1`) before the code path in question is ever reached — the test only proves a *pre-seeded* duplicate sale is detected, not that two genuinely new concurrent submissions are deduplicated. Separately, the primary online `/sales` endpoint (not the offline-sync path) has **no idempotency protection or test at all** — a double-tap or network retry there would double-post revenue and inventory, the exact bug class this guard exists to prevent, on the most-used endpoint in the app.
-   **`TenantIsolationSweepGuardTest` alone covers only 4-6 models** (`Account`, `Warehouse`, `Party`, `Product`, plus two more). This gap is meaningfully — not completely — offset by a separate, more thorough `IdorSweepTest.php` covering 10 models across 27 real HTTP routes. Between the two, `Terminal`, `Stock`/`inventory_batches` directly, `JournalEntry`/`JournalItem`, `StoreLicense`, and `Setting` remain untested for cross-tenant leak.
-   **No test in the suite can catch a genuine race condition.** Every "concurrency" or "double-submit" test executes strictly sequentially within a single PHPUnit/Pest process. The `exists()`-then-`create()` pattern used for deduplication is not atomic without a unique DB constraint or row lock, and nothing in the suite (or the codebase) proves it's safe under real concurrent requests.
-   **No negative/fuzz testing** — zero SQL injection, XSS, oversized-payload, or wrong-type-input test cases found anywhere in the suite, despite `selectRaw`/`whereRaw` calls existing in the codebase (e.g. `AccountingIntegrityGuardTest.php` itself).
-   **"701 passing" is unverified by this audit.** No PHP/DB runtime was available to actually run the suite; 121 test files with roughly 550+ test-method declarations is consistent with a claim in that range, but this is corroboration of scale, not proof of a green run.
-   **Baseline-diff guards (`MassAssignmentGuardTest`, `PermissionBypassGuardTest`) grandfather in whatever violations existed when their baseline JSON was first seeded** — any issue present at seed time is permanently invisible to CI going forward unless someone manually re-audits the baseline files.

**Would I trust these tests to protect future refactors?** For the V3 engine specifically: yes, with real confidence — the assertion style is mutation-resistant and mathematically verified. For the codebase as actually deployed (legacy `SaleController`, WooCommerce webhook path, the primary online sale endpoint): no — the parts of the system doing the most real-world work have the thinnest test coverage of financial correctness, which is the inverse of what you'd want.

**Additional guardrail tests that would add meaningful protection**, beyond what the prior audit already suggested:
1.  A `SaleFinancialValueGuardTest`-equivalent that runs against the **legacy** `SaleController::store()` path, including the FIFO-exception fallback branch specifically (would have caught Finding 1 immediately).
2.  A genuine idempotency test on the primary `/sales` endpoint (not just offline sync).
3.  A reconciliation test asserting `getInventoryValue()` matches the GL Inventory Asset (1100) balance after a mix of normal and FIFO-exception sales.
4.  A WooCommerce webhook test asserting a journal entry is actually posted for a synced order (would have caught Finding 3).

---

## 6. Remaining Risks (Ranked)

| Rank | Risk | Likelihood | Impact | Mitigation |
|---:|---|---|---|---|
| **1** | Silent COGS fabrication on the live POS path (Finding 1) | High — triggers on any stockout or FIFO exception | Critical | Remove fallback; hard-fail or route through proper negative-stock handling |
| **2** | No platform DB backup running (Finding 2) | Certain (currently true) until fixed | Critical | Schedule `vq:backup` + `backup:verify` immediately |
| **3** | WooCommerce sales invisible to accounting (Finding 3) | Certain for any WC-connected tenant | Critical | Route WC webhook through a journal-posting service |
| **4** | Dual engine drift (Finding 4) | Ongoing, certain over time | High | Fix legacy bug now; plan V3 cutover deliberately |
| **5** | Wildcard permission self-escalation (Finding 5) | Medium — requires an admin (not owner) to act | High | Remove wildcard bypass |
| **6** | PIN brute force (Finding 6) | Medium — requires network access to the login endpoint | High | Add throttle |
| **7** | Screenshot upload DoS (Finding 7) | Medium | Medium-High | Add auth + validation |
| **8** | Cash purchase-return AP corruption (Finding 9) | Medium — any tenant doing cash purchases with returns | High | Branch on payment method |
| **9** | CI/SQLite masking DB-trigger-dependent bugs (Finding 11) | Medium | Medium | Standardize on MySQL in CI |
| **10** | No monitoring/APM | Certain (currently true) | Medium — slows incident detection generally | Add Sentry or equivalent |

---

## 7. Go / No-Go Decision

### Decision: **NO-GO**

If tomorrow were launch day, I would not approve it. The determining factor is not any single finding but their combination: a financial-integrity bug on the primary write path, no working backup of the database that bug could corrupt, and no monitoring that would surface either problem quickly if it started causing damage in production. Any one of these alone might be an acceptable "fix in week one" risk for a pre-revenue SaaS; together, they describe a system that could silently corrupt its own books with no safety net and no alarm.

**Path to GO (3-5 weeks):**
1.  Fix Finding 1 (COGS fabrication) — surgical, should be days not weeks, but must ship with a new test targeting the legacy path specifically.
2.  Fix Finding 2 (backups) — schedule the existing, already-built commands; this is a one-line change plus verification.
3.  Fix Finding 3 (WooCommerce accounting gap) — route through a real journal-posting path.
4.  Fix Findings 5-7 (permission escalation, PIN brute force, screenshot DoS) — each individually small.
5.  Stand up basic monitoring (Sentry or equivalent) before launch, not after.
6.  Re-run this audit's specific reproduction steps against the fixes, not just a general regression pass.

---

## 8. Confidence Analysis

*   **Financial reports stay correct:** **45%** today. The V3 reporting layer is trustworthy for data that reaches it; the live write path (Finding 1) and WooCommerce path (Finding 3) mean a meaningful share of real transactions may never reach it correctly. Rises to ~85% once Findings 1, 3, 4 are resolved.
*   **Tenant isolation holds:** 75%. Core scope is sound; a few unnecessary `withoutGlobalScope` sites and the terminal first-contact-claim gap keep this from being higher.
*   **Permissions hold:** 55%, specifically because of the live wildcard self-escalation path (Finding 5) — this is a concrete, reachable bug, not a theoretical gap.
*   **Inventory remains accurate:** 40% today, for the same reason as financial reports — the FIFO layer is well-built but is bypassed on failure in the path that matters most.
*   **Accounting remains balanced (debit=credit):** 90%. This specific invariant is genuinely well-enforced in application code; the risk is fabricated-but-balanced entries (Finding 1), not unbalanced ones.
*   **Future refactors are protected:** 55%. Strong where V3 test coverage exists; weak everywhere the legacy engine, WooCommerce integration, and primary sale endpoint are concerned, since those have the least test coverage relative to their real-world usage.
*   **Production deployment succeeds:** 70%. No evidence of the schema-drift crisis the prior audit claimed (see Section 11) — that specific risk appears to have been a false alarm. CI/deploy gating (Finding 11) is the main residual concern here.

---

## 9. 30-Day Risk Forecast

If launched today without remediation:

1.  **Inventory valuation and P&L quietly diverge from physical stock within the first 1-2 weeks.** Why: any stockout (a near-certainty for a retail POS within days of real usage) triggers Finding 1's fallback. Severity: Critical — this is a slow-burn corruption, not a crash, so it may not be noticed until a merchant reconciles their books and finds the numbers don't match reality. Likelihood: High.
2.  **A WooCommerce-connected tenant's revenue reports look wrong from day one**, not after 30 days — this isn't a drift, it's an immediate and total omission for that segment. Severity: Critical for affected tenants. Likelihood: High, contingent only on how many early customers connect WooCommerce (likely a meaningful fraction, given it's a named integration).
3.  **A disk-level incident (hosting issue, bad migration, accidental deletion) in the first month finds no recent platform backup to restore from.** Severity: Critical if it happens; likelihood is lower in absolute terms but the current probability of *some* backup being available if needed is effectively zero, which is the more relevant number.

---

## 10. Documentation Consistency Findings

The documentation set is large (100+ markdown files across the repo root and `docs/`) and internally contradicts itself in ways that go beyond normal planning-document drift. The most consequential pattern: **documents dated July 7 present a coherent, optimistic "62/100 launch-ready, 3-4 weeks out" narrative; documents dated July 8 — three sequential, independent re-audits of the same remediation work — each found the previous day's "fix" was incomplete, mis-wired, or in one case actively wrong** (a regression test that asserts a bug's buggy behavior as the expected, passing result). Specific examples:

-   **Test count disagreement:** `docs/PROJECT.md`/`docs/EXECUTIVE_REPORT.md` (July 7) both cite "~535 test cases"; `PRELAUNCH_HARDENING_REPORT.md` (July 8) cites "669 passing" as the *baseline before* that session's work — a ~25% discrepancy that doesn't reconcile even accounting for tests added in between.
-   **Contradictory same-day status on the HeartbeatController fix:** `MANUAL_LAUNCH_CHECKLIST.md` (July 8) instructs a human to simply "confirm" both terminal fixes are deployed; `REMEDIATION_PLAN.md` (same date) marks the HeartbeatController fix 🔴 still open. This audit's own direct code read (Finding 8) confirms the fix **is** present in the current code — meaning `REMEDIATION_PLAN.md` was itself already stale by the time it was written, and no document in the set flags this.
-   **Backups: "not yet built" vs. "was silently broken in production."** `docs/GAPS.md`/`docs/SECURITY.md` (July 7) frame platform backups as a feature gap to be built. `docs/RUNBOOK.md` (July 8) reveals the backup command already existed but was never wired to the scheduler — a materially different and more serious framing (a documented control silently not running) that this audit's own Finding 2 shows is *still true today*, contradicting even RUNBOOK's own claim of a same-week fix.
-   **VenSynQ marketplace integration** is listed as a shipped, working feature in `docs/PROJECT.md`/`docs/FEATURES.md` (July 7); a dedicated same-day audit (`VenSynQ_Enterprise_Audit_and_Plan.md`) describes it as unable to complete an OAuth handshake or run a scheduled sync at all until emergency same-day fixes, with most of the originally-envisioned system still unbuilt.
-   **`docs/FEATURES.md` self-flags a marketing overreach**: it explicitly states the "226+ features" figure used externally is only "defensible if sub-features are counted" and recommends using "140+" instead — a documented internal admission that a public-facing number is inflated.
-   **`docs/GAPS.md`'s "What is NOT broken" section** cites "an honest, current CHANGELOG" as a strength; a later document in the same set found the CHANGELOG contained at least one concrete false claim (that a specific file was already free of a known corruption issue, when it and 98 others were not).

**Net assessment:** the July 7 `docs/` set should be treated as stale and somewhat optimistic; the July 8 root-level documents are more current but their own remediation claims should not be trusted without independent verification either, as this audit's Finding 2 demonstrates directly. The pattern of "fixed, but the verification of the fix was itself broken" repeating three times in two days is worth naming as a process signal, not just a code signal — whatever review step is supposed to catch a broken fix before it's called "done" is not currently working reliably.

---

## 11. Reconciliation with the Prior Audit Found in This Repo

The existing `FINAL_LAUNCH_READINESS_AUDIT.md` (dated July 8) was independently re-verified rather than trusted. Per-finding reconciliation:

| Prior finding | This audit's verdict | Basis |
|---|---|---|
| Unauthenticated Heartbeat/TerminalActivity hijack | **CONFIRMED — but already fixed.** Prior audit treated this as still open; direct code read shows the ownership guard is present in both controllers. A residual first-contact-claim gap remains (Finding 8). | Direct read of both controllers |
| Unauthenticated screenshot upload | **CONFIRMED, still open.** Matches prior finding (Finding 7). | Direct read of screenshot endpoint and `uploadScreenshot` controller |
| Database schema drift (`appsumo_codes.campaign`, etc.) | **FALSE.** No migration or code evidence of this drift was found. `campaign` is correctly stored inside the `metadata` JSON column by design; `purchase_items` correctly uses `qty` everywhere (never `quantity`); `stock_movements` correctly uses `reference_id` (not `reference`). | Direct read of `ImportAppSumoCodes.php`, `PurchasesImport.php`, and migrations |
| Offline Sync Duplicate Sales Risk | **CONFIRMED, still open.** (Finding 4 in this audit / Finding 3 in previous writeup). | Direct read of `SyncController::batchOrders` and `OfflineSyncIdempotencyGuardTest` |
| Activity Logging Swallows Failures | **CONFIRMED, still open.** (Finding 4 in this audit / Finding 4 in previous writeup). | Direct read of `HasActivityLog.php` and its empty `catch` block |
| PaymentAllocation Trigger Bypass | **CONFIRMED, resolved.** In `PurchaseService.php`, the payment allocation now correctly writes `$journalEntry->id` instead of `$payment->id` (Finding 5 in this audit / Finding 5 in the previous writeup). | Direct read of `PurchaseService::recordPurchasePayment` and `PaymentAllocationTest` |
| Parallel Transaction Engines | **CONFIRMED, still open.** POS posts to legacy `SaleController`. (Finding 4). | Direct read of `Pos.jsx` and `routes/web.php` |
| Performance Overhead in TenantMiddleware | **CONFIRMED, still open.** (Finding 12). | Direct read of `TenantMiddleware.php` |
| Wildcard Permission God-Mode Risk | **CONFIRMED, still open.** (Finding 5). | Direct read of `CheckPermissions.php` and `AdminController::updateMember` |

---

## 12. Final Verdict (Board of Directors Presentation)

### Statement to the Board of Directors:

> "We have completed our independent engineering and security audit of the VenQore POS + ERP SaaS platform. Our firm **cannot approve the launch** of VenQore to paying customers today.
>
> While the V3 double-entry ledger is built with architectural rigour, the live, customer-facing POS terminal is currently wired to a legacy sale controller containing a critical correctness bug. In any stockout or FIFO exception, the POS silently invents a COGS figure from the product's mutable cost price field, causing the merchant's physical inventory value to silently drift from the ledger balance.
>
> Combined with the complete omission of journal postings for WooCommerce sales, the lack of scheduled platform backups, and several critical-to-high security vulnerability gates (including unthrottled PIN logins and wildcard permission bypasses), the platform carries too high of a transactional and operational risk.
>
> We recommend a **postponement of the launch by 3 to 5 weeks** to allow the engineering team to resolve the launch blockers in Section 4. Once resolved, the system's strong fundamental V3 ledger design will make it an exceptionally stable and competitive retail OS asset."
