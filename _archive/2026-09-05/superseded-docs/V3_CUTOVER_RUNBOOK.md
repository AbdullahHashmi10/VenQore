# V3 Cutover Runbook — legacy purchase island

**Written:** 2026-08-11
**Plan:** `V3_CONSOLIDATION_PLAN.md` · **Rules:** `CLAUDE.md` → "Purchases live in `purchases`"

All the code for Phases 0–6 is written. **None of it has been executed** — the session that wrote it had no shell, so nothing was migrated, built or tested. This document is the sequence to run, and the exact thing to check at each gate.

Do not skip a gate. Each one exists because the next step is hard to undo.

---

## Gate A — green baseline (before anything)

```bash
php artisan optimize:clear
php artisan test 2>&1 | tee post-fix-run.txt
cat tests/VerificationCenter/runs/latest.json
```

`latest.json` must read `"green": true`, or every residual failure must be explained. Starting a data migration on a red suite means you cannot tell migration breakage from pre-existing breakage.

R2-1, R2-2 and R2-3 from `FIX_GUIDE_ROUND2.md` were already applied to the code — that file is stale, ignore its checklist.

---

## Gate B — Phase 1, schema

```bash
php artisan migrate --pretend        # read it first
php artisan migrate
```

Runs `2026_08_11_000001_add_legacy_parity_columns_to_purchases`. Purely additive: 6 columns on `purchases`, 3 on `purchase_items`. Deliberately does **not** add `paid_amount`.

**Check:** `php artisan test` unchanged. Nothing reads the new columns yet.

⚠️ Do **not** run `2026_08_11_000002_repoint_expenses_purchase_fk_to_purchases` yet — it has a guard that will refuse until the backfill has run. That is intentional.

---

## Gate C — Phase 2, build and smoke the UI

```bash
php artisan ziggy:generate
npm run build
php artisan test --filter=V3PurchaseParityTest
php artisan test --filter=PurchaseIslandGuardTest
```

Then manually, on a **test tenant**, walk the V3 screens at `/s/{slug}/v3/purchases`:

1. Create a cash purchase → journal balances, FIFO batch created, stock up
2. Create a credit purchase with a header discount and a landed cost
3. Edit that purchase → original journal flagged `is_reversed`, reversal posted, new entry posted
4. Create with **Goods status = Not yet received** → no journal, no stock
5. Receive it partially, then fully → `workflow_status` goes pending → partial → received
6. Void a purchase → reversed, batches released, row still present
7. Return against a purchase → `purchase_returns` row, stock down

**Check after each:** `SELECT SUM(debit)-SUM(credit) FROM journal_items ji JOIN journal_entries je ON je.id=ji.journal_entry_id WHERE je.reference='<purchase id>'` = 0.

---

## Gate D — Phase 3, backfill

```bash
# 1. Snapshot the truth. COMMIT THIS FILE.
php artisan purchases:reconcile --baseline

# 2. Dry run on a production clone, one tenant first
php artisan purchases:migrate-legacy --tenant=<pilot-tenant-id>

# 3. Read every warning. Then commit, still one tenant
php artisan purchases:migrate-legacy --tenant=<pilot-tenant-id> --commit

# 4. Prove nothing moved
php artisan purchases:reconcile
```

**Must be true:**

- Ledger AP balance **unchanged** — any movement means stop
- Legacy purchase count = rows appearing in `purchases`
- Total carried across exactly
- Orphan batch / expense counts did not increase
- Aged payables **did** change — that is the fix, record the delta

Returns that cannot be attached to a parent purchase are **skipped and reported**, never inserted with a guessed link. Investigate every skip before proceeding.

Then, and only then:

```bash
php artisan migrate      # runs the expenses FK repoint
```

Roll the remaining tenants once the pilot reconciles clean.

---

## Gate E — Phase 4, the waiting

The shadow write is already live in legacy `PurchaseController::store()` and is on by default (`VENQORE_PURCHASE_SHADOW_WRITE=true`).

Add to the scheduler or run nightly:

```bash
php artisan purchases:drift-check
```

**Do not proceed until this has exited 0 for 7+ consecutive days.** The streak is what buys the zero-risk rollback at cutover. `storage/app/verification/purchases_drift.jsonl` is the evidence.

Any drift = a legacy write that the mirror missed. Fix it, then **restart the 7 days**.

---

## Gate F — Phase 5, cutover

Pilot one tenant first:

```env
VENQORE_PURCHASE_CUTOVER=false
VENQORE_PURCHASE_CUTOVER_TENANTS=your-pilot-slug
```

```bash
php artisan config:clear
```

The live `/purchases/*` URLs now route through `PurchaseRouterController`, which forwards to V3 for that tenant only. Route names are unchanged, so no frontend `route()` call changes.

**72 hours, no support tickets.** Then:

```env
VENQORE_PURCHASE_CUTOVER=true
```

**Rollback at any point:** set it back to `false`, `php artisan config:clear`. The data lives in both tables, so this is a one-line revert.

---

## Gate G — Phase 6, decommission

**Only after the above.** This is the irreversible part, so it is deliberately last.

1. `VENQORE_PURCHASE_SHADOW_WRITE=false`, then delete `PurchaseController::shadowWriteToV3()`
2. Repoint `SmartFulfillmentService` (~line 305, JIT drafts) at `V3\PurchaseService`
3. Delete `app/Http/Controllers/PurchaseController.php`, `app/Services/PurchaseService.php` (already an inert stub), `resources/js/Pages/Purchases/*`, and the stray `resources/js/Pages/Purchases/Receive.jsx.1570596185`
4. Point `routes/web.php` `/purchases/*` straight at `V3\PurchaseController` and delete `PurchaseRouterController`
5. Fix `app/Models/Expense.php:37` — `belongsTo(Invoice::class, 'purchase_id')` → `Purchase::class`
6. Empty `LEGACY_ALLOWLIST` in `PurchaseIslandGuardTest`; it must stay empty
7. Export `invoices` where type is purchase/purchase_return to cold storage, then delete those rows. **Keep the `invoices` table itself for one release** — cheap insurance
8. `php artisan purchases:divergence-count` must report zero

---

---

## Gate H — the read sweep (added 2026-08-11, after Gate G)

Gates A–G only ever tracked **writers**. That was a hole. Once the legacy rows were deleted, seventeen read sites across eleven files were still querying `invoices` for purchases — and an emptied table returns zero rows rather than throwing, so everything stayed green while the numbers went blank.

Converted:

| File | What was blank |
|---|---|
| `ReportController.php` | the purchase report itself, party-wise report, party group summary |
| `TransactionController.php` | purchases missing from All Transactions |
| `DashboardController.php` | recent purchase orders, monthly spend, supplier widget |
| `AiController.php` | AI answers about purchase totals and cash reconciliation |
| `OwnerDailyPulseService.php` | daily owner email |
| `SendWeeklyBusinessSummaries.php` | weekly owner email |
| `TenantMiddleware.php` | `has_purchases` onboarding flag |
| `AdminController.php` | monthly purchase totals |

Dead legacy legs removed from `FinancialReportingService` (supplier insights + price history), `ReportController` (supplier sourcing) and `AuditFinancialIntegrity` (STEP 2, which reconciled against `invoices.paid_amount` — a column V3 deliberately does not have). `MigrateV3Ledger::migrateLegacyPurchases()` is now a loud no-op instead of a silent zero.

Two `->where('type', 'purchase')` hits were **false positives** and correctly left alone: `InventoryController:857` and `DebitNoteController:145` both filter `stock_movements.type`, not `invoices.type`.

`PurchaseIslandGuardTest` now has `test_no_code_reads_purchases_out_of_the_invoices_table()` so this cannot recur.

**Run after this gate:**

```bash
php artisan optimize:clear
php artisan test --filter=PurchaseIslandGuardTest
php artisan test
npm run build
```

Then eyeball, with at least one purchase in the database: the purchase report, the purchasing dashboard, All Transactions, and a fresh tenant's onboarding (`has_purchases` must flip to true after the first purchase).

---

## Things you should know before you start

**Three deliberate divergences from legacy accounting.** These are documented in the `V3\PurchaseService` class docblock. A naive legacy-vs-V3 journal comparison will show differences — that is correct, not a bug:

1. **Landed costs are capitalised, not double-counted.** Legacy folded them into `effective_unit_cost` (reaching COGS via FIFO) *and* debited an expense account for the same money. It also debited account 5100, which `TenantDefaultSeeder` defines as "Salaries & Wages".
2. **Landed costs no longer inflate the supplier's payable.** Legacy credited them to the supplier's AP with their `party_id`. Freight and customs are not owed to the goods supplier.
3. **An unreceived purchase posts no journal.** Legacy debited Inventory with no matching FIFO batch, which breaks ledger↔stock reconciliation.

**Two open CRITICAL bugs are waivered until 2026-12-31** — POS-003 (COGS fabrication) and WOO-001 (WooCommerce ledger bypass), in `tests/VerificationCenter/registry/quarantine.yaml`. Launch gate G-03 passes today and becomes a hard block on 1 Jan 2027.

**Known Phase 5 polish item, not blocking.** The V3 Inertia pages hardcode `route('store.v3.purchases.*')` for their internal links. Served under the legacy `/purchases` URLs they still work — those routes exist — but the address bar will show `/v3/`. Controller *redirects* already follow the incoming route family; the in-page links do not. Worth cleaning up before you delete the legacy pages.

**`purchase_returns.created_by` is `unsignedBigInteger` while `purchases.created_by` is a `uuid`.** The schema is inconsistent. The backfill coerces and falls back to `1`. Worth a follow-up migration.
