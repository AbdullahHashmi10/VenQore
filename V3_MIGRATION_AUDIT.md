# VenQore — Legacy → V3 Audit

**Date:** 2026-08-12
**Method:** static analysis of `app/`, `routes/`, `database/migrations/`, `resources/js/`. Nothing was executed — no shell was available this session.
**Scope:** whole application.

---

## 0. How to read this

**"Legacy" in this codebase is not one thing.** There are four separate generations tangled together, and they are at very different stages:

| Generation | What it is | Status |
|---|---|---|
| **Purchase island** | `invoices` type=purchase | ✅ **Retired.** Migrated, deleted, guarded |
| **Duplicate services** | `app/Services/{Fifo,Inventory}Service` shadowing `app/Services/V3/` | 🟡 **Dead but present.** Zero live callers — see §3 |
| **Legacy ledger rows** | `transactions` table alongside `journal_entries` | 🔴 **Live.** Still written |
| **WooCommerce sales path** | webhook writes no `Sale` row | 🔴 **Live.** WOO-001 |

The honest headline: **the purchase migration is genuinely finished. The rest of the application was never migrated, and mostly never needed to be — but three real legacy paths remain, and one of them is a critical open bug.**

---

## 1. Scorecard

### Controllers — 226 total

| Bucket | Count | Notes |
|---|---:|---|
| `app/Http/Controllers/V3/` | **42** | The V3 generation |
| Auth / Marketing / SuperAdmin / Admin / Api | ~40 | No financial writes. **Not a migration target** |
| Store-level, non-financial | ~130 | Settings, staff, backups, chat, tools, labels, etc. **Not a migration target** |
| Store-level, financial, **still legacy** | **3** | See §4 |
| Store-level, financial, already V3-backed | ~11 | `SaleController`, `PosReturnController`, `ExpenseController`, `FundController`, etc. route through `V3\*Service` |

⚠️ **"226 controllers, 42 are V3" is a misleading ratio and you should not treat it as 18% done.** The overwhelming majority of those 226 have nothing to do with the ledger — a barcode label controller does not have a V3 equivalent and never will. The meaningful number is the third row: **3 controllers with a live legacy financial path.**

### Services — 115 total

| | |
|---|---|
| `app/Services/V3/` | **13** — the canonical financial engines |
| Legacy duplicates of a V3 service | **2** — `FifoService`, `InventoryService` |
| Adjacent, needs reclassifying not rewriting | **2** — `LedgerService`, `SaleReversalService` |
| Everything else (~98) | Marketing, tools, AI, growth, backups, VenSynQ. No V3 counterpart needed |

---

## 2. ✅ What is genuinely finished

**Purchases.** End to end, writes and reads:

- `PurchaseController`, `Services\PurchaseService`, `Pages/Purchases/*`, `PurchaseRouterController` — all deleted
- All `/purchases/*` routes → `V3\PurchaseController`
- Data migrated with UUIDs preserved; drift check clean; legacy rows deleted
- 14 read sites across 8 files converted (reports, dashboard, transactions, AI, owner emails, onboarding flag)
- `PurchaseIslandGuardTest` now guards **both** writes and reads

**`invoices` / `invoice_items` are now completely empty.** Not just of purchases — this codebase *never* wrote sales there. `GrowthDataSource` documents this explicitly: every writer of `invoices` hardcoded `type => 'purchase'`, so `Invoice::where('type','sale')` returned an empty set for every tenant, forever.

---

## 3. 🟡 Dead legacy code — safe to delete, no work required

These are the ones the old plan (`extras/New Positioning/v3/02_LEGACY_TO_V3.md`) budgeted **three days** for. That estimate is now stale — the call sites evaporated.

| File | Claimed callers | Actual live callers | Verdict |
|---|---|---|---|
| `app/Services/FifoService.php` | 0 | **0** | Delete |
| `app/Services/InventoryService.php` | 2 | **0** — see below | Delete |
| `app/Services/PurchaseService.php` | 0 | **0** (inert stub) | Delete |

**Why `InventoryService` has zero live callers, despite two references:**

1. `PosController.php:87` — `store(Request, InventoryService)`. **This method is not routed.** `routes/web.php` registers only `PosController@index` and `@getCategories`; `pos.open`/`pos.close` were removed 2026-08-02 and the note at line 379 records that `/pos/sale` pointed at a method that never existed. The method is unreachable.
2. `WooCommerceController.php:9,25,29` — injected into the constructor and assigned to `$this->inventoryService`, **then never called.** The actual stock deduction at line 157 uses `$this->fifo->deductStock(...)` — the V3 FifoService.

So this is an unused import and an unused constructor parameter. Deleting the file requires removing those two references first, but no behaviour changes and no characterisation test is needed.

**Also dead:** `Invoice` / `InvoiceItem` models and every remaining `Invoice::where('type','sale')` reader (`TransactionController:77`, `ReportController:1784`, `TenantMiddleware:274`). They query a table that is now empty and always was, for sales.

---

## 4. 🔴 Live legacy paths — real work remaining

### L1 — WooCommerce orders never become sales · **highest severity**

`WooCommerceController::webhook()` (routed at `web.php:1858`) processes a paid Woo order and:

- ✅ deducts stock via V3 FIFO (line 157)
- ✅ posts a double-entry journal (line 200)
- ❌ **creates no `Sale` or `SaleItem` row**
- ❌ writes a legacy `Transaction` row instead (line 209), with `running_balance` computed as `$party->current_balance + $revenueTotal` and commented *"Simplified"*

Consequence: every WooCommerce order is invisible to the `sales` tables — and therefore to sales reports, customer statements, the Growth Engine (which reads `sales`), and any per-item margin analysis. The money reaches the ledger; the document does not exist.

This is the open **WOO-001** critical bug, waivered in `tests/VerificationCenter/registry/quarantine.yaml` until **2026-12-31**.

**Work:** route the webhook through `V3\SaleService` so it produces a real `Sale`. Drop the `Transaction::create()`. Estimate: 2–3 days including a characterisation test that proves stock, FIFO and journal output are unchanged.

### L2 — POS-003, COGS fabrication · **critical, open**

`quarantine.yaml` describes it as *"COGS fabrication on FIFO failure (legacy SaleController inline journal write)"*. Also waivered to **2026-12-31**.

I did not trace this to a specific line this session. `SaleController` has 41 references to journal/accounting symbols, so it warrants its own focused pass rather than a guess. **Flagging it as unverified, not as done.**

### L3 — the `transactions` table

A legacy ledger-shaped table living alongside `journal_entries`. Still written by `WooCommerceController:209`; read by `FundController` (4 sites), `AiController`, `AuditFinancialIntegrity` (4), `Party`, `TransactionAllocation`.

`CLAUDE.md` still describes `Transaction` as a core model. That description predates the V3 ledger and is now misleading. Resolving L1 removes the only remaining writer, after which the readers can be retired.

---

## 5. Database — what is left

**Migrations pending: none for the purchase work.** Both Phase 1 and the FK repoint are written and applied:

- `2026_08_11_000001_add_legacy_parity_columns_to_purchases.php`
- `2026_08_11_000002_repoint_expenses_purchase_fk_to_purchases.php`

**Columns still to create: none.** `purchases` and `purchase_items` are at full parity. `paid_amount` is deliberately absent and must stay absent — it is derived from the ledger, and `PurchaseIslandGuardTest` asserts it never returns.

**Schema issues worth a follow-up migration (none blocking):**

| Issue | Detail |
|---|---|
| Type mismatch | `purchase_returns.created_by` is `unsignedBigInteger`; `purchases.created_by` is `uuid`. The backfill coerces and falls back to `1` |
| Table retirement | `invoices` + `invoice_items` are now empty and unreferenced by live code. The plan says keep one release, then drop |
| Table retirement | `transactions` — after L1 is fixed |

**MariaDB 10.5 constraints still apply:** no `SKIP LOCKED`, so the database queue is capped at one worker until the 10.11 LTS upgrade. That upgrade is still outstanding and is unrelated to V3.

---

## 6. Recommended order

1. **Delete the three dead service files** (§3). Half a day, zero risk, removes the biggest source of "is this still used?" confusion.
2. **Fix L1 — WooCommerce → `V3\SaleService`.** 2–3 days. This is the highest-value item: it closes WOO-001, makes Woo orders visible everywhere, and removes the last `transactions` writer.
3. **Investigate L2 — POS-003.** Scope unknown until traced. Both waivers expire 31 Dec 2026, at which point launch gate G-03 becomes a hard block.
4. **Retire `transactions` readers**, then drop `invoices`, `invoice_items`, `transactions`.
5. **Reclassify** `LedgerService` → `app/Queries/PartyBalanceQuery` and `SaleReversalService` → `app/Services/V3/`. Cosmetic; do it alongside other renames, not on its own.

---

## 7. What this audit does **not** cover

Being explicit so this is not over-trusted:

- **Nothing was executed.** No tests, no migrations, no build. Every statement here comes from reading code and on-disk artifacts.
- I did not read all 226 controllers line by line. I enumerated them, then traced the ones matching legacy-table, legacy-model and legacy-service patterns. A legacy path that uses none of those signatures could have been missed.
- **POS-003 (L2) is unverified.** I am reporting the waiver, not a diagnosis.
- Frontend was not audited beyond the purchase pages.
- Sales, POS and inventory were audited only for *legacy-generation coupling*, not for correctness.
