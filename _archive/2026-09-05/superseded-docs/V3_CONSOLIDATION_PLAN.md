# V3 CONSOLIDATION PLAN — retiring the legacy purchase island

**Date:** 2026-08-10
**Goal:** one purchase system, ledger-derived, so the "which table owns purchases?" question can never be asked again.
**Constraints you set:** live customer data must migrate · full feature parity before cutover.

---

## 0. What is actually legacy — the real scope

I mapped every writer and reader. **The scope is smaller than it feels.** Sales are already fully V3 (`sales` table); `invoices` is not a general document table any more. In practice it holds exactly two things:

| `invoices.type` | Written by |
|---|---|
| `purchase` | `PurchaseController`, `Services\PurchaseService`, `SmartFulfillmentService` |
| `purchase_return` | `Services\PurchaseService` |

Nothing else writes it. So this is **one island: purchases + purchase returns.**

### The two systems side by side

| | Legacy | V3 |
|---|---|---|
| Header | `invoices` (`type='purchase'`) | `purchases` |
| Lines | `invoice_items` | `purchase_items` |
| Returns | `invoices` (`type='purchase_return'`) | `purchase_returns` |
| Routes | `/purchases/*` — **the live UI** | `/s/{slug}/v3/purchases` |
| Frontend | `Pages/Purchases/{Create,PurchasesList,Show,Receive}.jsx` | `Pages/V3/Purchases/{Create,Index,Show,Return}.jsx` |
| Journal | ✅ `AccountingService` | ✅ `AccountingService` |
| FIFO batches | ✅ `V3\FifoService::receiveBatch()` | ✅ same |

**Two facts that make this much safer than it looks:**

1. **Both sides already post to the same ledger and the same FIFO batch engine.** Legacy calls `V3\FifoService::receiveBatch()` directly. You are not migrating accounting logic — only the header/line rows and the routes.
2. **`purchase_orders` is not a third duplicate.** It is a genuine upstream document (PO → receive). Leave it alone.

### ⭐ The insight that de-risks the whole migration

`journal_entries.reference`, `expenses.purchase_id` and `inventory_batches.purchase_id` all already point at **`invoices.id`**, and both tables use UUID primary keys.

**So: migrate each row into `purchases` keeping the exact same UUID.** Every journal entry, every batch link and every landed-cost expense stays valid with zero repointing. The only structural change is one foreign key constraint.

This turns a terrifying migration into a copy with a constraint swap.

---

## 1. Gap analysis — what must be built before cutover

### 1a. Schema gaps on `purchases`

| Column | Legacy has | `purchases` has | Action |
|---|---|---|---|
| `discount` | ✅ | ❌ | add `decimal(20,4) default 0` |
| `round_off` | ✅ | ❌ | add `decimal(20,4) default 0` |
| `notes` | ✅ | ❌ | add `text nullable` |
| `reference` | ✅ | ❌ | add `string(100) nullable` |
| `due_date` | ✅ | ❌ | add `date nullable` |
| workflow state | ✅ (overloaded on `status`) | ❌ | add `workflow_status string(30) default 'received'` |
| `paid_amount` | ✅ | ❌ | **do not add** — derive from the ledger (§4) |
| `warehouse_id` | ❌ (uses default) | ✅ NOT NULL | backfill resolves default warehouse |

### 1b. Schema gaps on `purchase_items`

| Column | Legacy `invoice_items` | `purchase_items` | Action |
|---|---|---|---|
| `variant_id` | ✅ | ❌ | add `uuid nullable` |
| `discount_amount` | ✅ | ❌ | add `decimal(20,4) default 0` |
| `business_pct` | ❌ | ✅ | backfill `100` |

### 1c. Capability gaps in V3

`V3\PurchaseService` has only `store()` and `createReturn()`. `V3\PurchaseController` has only `index/create/store/show`. Legacy has all of this and more:

| Capability | Legacy | V3 | Must port |
|---|---|---|---|
| Edit / update | `edit()`, `update()` | ❌ | **Yes** |
| Void / delete | `destroy()` | ❌ | **Yes** |
| Receive workflow | `receive()`, `storeReceive()` | ❌ | **Yes** |
| Landed costs (extras) | ✅ value/qty allocation + `Expense` rows | ❌ | **Yes** |
| Header discount | ✅ | ❌ | **Yes** |
| Product variants | ✅ `variant_id` | ❌ | **Yes** |
| Supplier→Party resolution | ✅ auto-creates Party | ❌ | **Yes** |
| Default-warehouse fallback | ✅ | ❌ (requires explicit) | **Yes** |
| Cost-update policy | ❌ | ✅ | already ahead |

---

## 2. The phases

Each phase is independently shippable and independently revertible. **Do not start a phase until the previous one's exit criteria are green.**

---

### PHASE 0 — Stop the bleeding (½ day)

Nothing new should enter the legacy island while you work.

1. **Freeze legacy writers.** Add a one-line comment banner to `PurchaseController::store()`, `Services\PurchaseService::create*()` and `SmartFulfillmentService` (~line 305): *"LEGACY — being retired, see V3_CONSOLIDATION_PLAN.md. Do not add features here."*
2. **Add a divergence counter.** A scheduled command that logs `COUNT(*) FROM invoices WHERE type IN ('purchase','purchase_return')` daily. You want to watch this stop growing after Phase 5.
3. **Snapshot the truth.** Write `php artisan purchases:reconcile --baseline` (see Phase 3) and store today's output. Every later run is diffed against it. **This file is your proof that no rupee moved.**

**Exit:** baseline artifact committed; no new features land in legacy.

---

### PHASE 1 — Schema parity (1 day)

One migration, purely additive, safe to deploy to production immediately.

```
database/migrations/2026_08_XX_000001_add_legacy_parity_columns_to_purchases.php
```

- Add the eight `purchases` columns and two `purchase_items` columns from §1a/§1b.
- All nullable or defaulted. **No FK changes yet. No data movement.**
- Write the `down()` properly — you will use it if Phase 3 goes wrong.

**Exit:** migration runs clean on a production clone; `php artisan test` unchanged; nothing reads the new columns yet.

---

### PHASE 2 — Capability parity in V3 (5–8 days, the bulk of the work)

Build V3 up to legacy's feature set **while legacy is still serving traffic.** Nothing user-visible changes in this phase.

Port into `app/Services/V3/PurchaseService.php`:

1. **`update(string $purchaseId, array $validated)`**
   Follow the pattern legacy already uses at `PurchaseController.php:1190` — reverse the old journal with a `*_reversal` entry flagged `is_reversed = 1`, restore FIFO batches, then re-post. Do **not** mutate the original journal entry.
2. **`void(string $purchaseId)`** — reverse journal, release batches, set `workflow_status = 'cancelled'`. Never hard-delete: it breaks the ledger audit trail.
3. **`receive(string $purchaseId, array $lines)`** — port `storeReceive()`.
4. **`applyLandedCosts(string $purchaseId, array $extras)`** — port the value/quantity allocation loop and the `Expense` creation from `PurchaseController::store()` (~lines 303–345).
5. **Header discount, `variant_id`, supplier→party resolution, default-warehouse fallback.**

Controller and routes:

6. Extend `V3\PurchaseController` with `edit`, `update`, `destroy`, `receive`, `storeReceive`; extend the `Route::resource` at `routes/web.php:1858`.
7. Bring `Pages/V3/Purchases/*` up to parity with `Pages/Purchases/*`. Port `Receive.jsx`. **Delete the stray `Receive.jsx.1570596185` backup file.**

**Exit:** every legacy purchase test passes against the V3 service. Write a `V3PurchaseParityTest` that runs the same scenario through both paths and asserts identical journal lines, identical batch rows and identical party balance.

---

### PHASE 3 — Backfill (2–3 days to write, minutes to run)

```
app/Console/Commands/MigrateLegacyPurchasesCommand.php
```

**Non-negotiable properties:**

- **Idempotent** — safe to run twice (`insertOrIgnore` on the preserved UUID).
- **`--dry-run` by default.** Writing requires `--commit`.
- **Per-tenant** (`--tenant=`), so you can pilot on one customer.
- **Preserves the UUID.** This is the whole trick — do not generate new IDs.
- Wrapped in a transaction per tenant, with a printed summary.

**Mapping:**

| `invoices` | → | `purchases` |
|---|---|---|
| `id` | → | `id` ⭐ **unchanged** |
| `party_id`, `invoice_number`, `notes`, `reference`, `due_date` | → | same names |
| `date` | → | `purchase_date` |
| `subtotal` | → | `subtotal` |
| `tax` / `tax_amount` | → | `tax` |
| `discount` / `discount_amount` | → | `discount` |
| `total_amount` | → | `total` |
| `round_off` | → | `round_off` |
| `status` (`paid`/`partial`/`unpaid`) | → | `payment_status` |
| `status` (`pending`/`received`) | → | `workflow_status` |
| — | → | `warehouse_id` = tenant default |
| `is_jit`, `jit_sale_id`, `approval_status` | → | same names |
| `user_id` | → | `user_id` / `created_by` |

`invoice_items` → `purchase_items`: `quantity→qty`, `unit_price→unit_cost`, `total→line_total`, `batch_id→inventory_batch_id`, `business_pct=100`, carry `variant_id` and `discount_amount`.

`invoices` (`type='purchase_return'`) → `purchase_returns`.

**Three things the command must also do:**

1. **Backfill `payment_allocations`.** V3 aged payables and supplier statements read that table. For every migrated purchase, read its `purchase_payment` journal entries (`reference = purchase.id`, account `2000`, `is_reversed = 0`) and write one active allocation row per entry. This is what makes migrated purchases finally appear in Aged Payables.
2. **Repoint the expenses FK.** `2026_02_04_171548_add_landed_cost_to_expenses.php` hard-constrains `expenses.purchase_id → invoices(id)`. Because the UUIDs are preserved, **no data changes** — you only drop the constraint and re-add it against `purchases`. Do this in its own migration, run *after* the backfill.
3. **Set `journal_entry_id`** on each migrated row from the `reference_type='purchase'` entry.

**Reconciliation — `php artisan purchases:reconcile`.** Run before and after; the diff must be empty on every line:

- total AP balance per party (from the ledger) — **unchanged**
- count of purchases per tenant — legacy count = V3 count
- sum of `total` — equal to the sum of `total_amount` before
- every `inventory_batches.purchase_id` still resolves
- every `expenses.purchase_id` still resolves
- aged payables total — *will change*, and that is the fix; record the delta and confirm it equals the previously-invisible legacy purchases

**Exit:** dry-run on a production clone is clean; reconciliation diff empty except the expected aged-payables delta; rollback rehearsed.

---

### PHASE 4 — Dual-read verification window (1–2 weeks, no code freeze)

Migrate the data, but **keep legacy serving writes.** Both tables now hold the same purchases.

- Add a nightly `purchases:drift-check` comparing `invoices(type=purchase)` against `purchases` on count and total per tenant.
- Legacy `store()` gains a temporary shadow-write into `purchases` (same UUID) so the two stay in step during the window.
- Watch for a full billing cycle. **Any drift means stop and diagnose.**

**Exit:** 7+ consecutive days of zero drift.

---

### PHASE 5 — Cutover (½ day)

The smallest possible change, because Phases 1–4 did the work.

1. Repoint `routes/web.php:1331–1338` and `:1448` from `App\Http\Controllers\PurchaseController` to `App\Http\Controllers\V3\PurchaseController`. **Keep the route names identical** (`store.purchases.index`, `store.purchases.show`, `store.purchases.print`) so no frontend `route()` call changes.
2. Point `Pages/Purchases/*` at the V3 pages, or swap the Inertia render targets.
3. Deploy behind a per-tenant feature flag if you can. Pilot tenant first, then the rest.

**Rollback:** revert the route file. The data is in both places, so this is a one-line, zero-risk revert. **That is the point of Phase 4.**

**Exit:** pilot tenant on V3 for 72h with no support tickets; then general rollout.

---

### PHASE 6 — Decommission and lock the door (2 days)

This is the phase that answers *"so we don't have to worry again."* Do not skip it — an un-decommissioned legacy path grows back.

1. **Stop the shadow write.** Remove it from legacy `store()`.
2. **Delete the legacy code:** `App\Http\Controllers\PurchaseController`, `App\Services\PurchaseService`, `Pages/Purchases/*`. Repoint `SmartFulfillmentService` (~line 305) at `V3\PurchaseService`.
3. **Archive, then drop.** Export `invoices` where type is purchase/purchase_return to cold storage. Then a migration that deletes those rows. Keep the `invoices` table itself for one release before dropping — it is cheap insurance.
4. **Fix `Expense::purchase()`** — `app/Models/Expense.php:37` still says `belongsTo(Invoice::class, 'purchase_id')`. Repoint it to the `Purchase` model.
5. **Build the guardrail.** Add to `tests/tests/Feature/Golden/ArchitecturalEnforcementTest.php`:

```php
    /**
     * The legacy purchase island was retired 2026-XX. Nothing may recreate it.
     * This test is the reason we only had to do that migration once.
     */
    public function test_no_code_writes_purchases_to_the_invoices_table(): void
    {
        $offenders = [];
        foreach ($this->rglob(app_path() . '/*.php') as $file) {
            $src = file_get_contents($file);
            if (preg_match("/type'\s*=>\s*'purchase/", $src)) {
                $offenders[] = str_replace(base_path(), '', $file);
            }
        }
        $this->assertSame([], $offenders,
            "Purchases must be written to `purchases`, never `invoices`. See V3_CONSOLIDATION_PLAN.md.");
    }

    public function test_purchase_paid_amounts_are_never_stored_denormalised(): void
    {
        $this->assertFalse(
            Schema::hasColumn('purchases', 'paid_amount'),
            'Paid amount is derived from the ledger. A stored column will drift — that is the bug this migration fixed.'
        );
    }
```

6. **Write it down.** Add a short "Purchases live in `purchases`. Full stop." section to `CLAUDE.md` so future sessions cannot re-derive the wrong answer — which is exactly how this session started.

---

## 3. Timeline

| Phase | Effort | Elapsed | Risk |
|---|---|---|---|
| 0 · Freeze | ½ day | ½ day | none |
| 1 · Schema | 1 day | 1.5 days | none — additive |
| 2 · Parity | 5–8 days | ~2 weeks | medium — the real work |
| 3 · Backfill | 2–3 days | ~2.5 weeks | **high — mitigated by dry-run + UUID preservation** |
| 4 · Dual-read | 1–2 weeks wall-clock | ~4 weeks | low, and this is what buys the safe rollback |
| 5 · Cutover | ½ day | ~4 weeks | low |
| 6 · Decommission | 2 days | ~4.5 weeks | none |

**≈ 4–5 weeks elapsed, ~12–15 working days of effort.** Phase 4 is mostly waiting.

---

## 4. Non-negotiable principles

1. **Preserve UUIDs.** Everything else in this plan depends on it.
2. **Never hard-delete a posted document.** Reverse the journal, mark cancelled.
3. **The ledger is the only source of truth for money.** Do not add `paid_amount` to `purchases` — derive it. The guardrail test in Phase 6 enforces this.
4. **`payment_status` / `workflow_status` are separate columns.** Overloading one field is what left unpaid purchases stuck on `pending`.
5. **One method owns each write.** `PaymentService::updatePurchaseBadge()` is the only writer of `purchases.payment_status`. Keep it that way.
6. **Every phase is revertible on its own.** If you cannot describe the rollback, the phase is not ready.

---

## 5. Do this before Phase 0

Close out `FIX_GUIDE_ROUND2.md` first — R2-1, R2-2, R2-3 plus the full test run and the rebuild. **Starting a migration on a suite that was last measured at `green: false` (17 failed, 180 errored of 1474) means you will not be able to tell migration breakage from pre-existing breakage.**

A green baseline is the single most valuable thing you can have before Phase 1.
