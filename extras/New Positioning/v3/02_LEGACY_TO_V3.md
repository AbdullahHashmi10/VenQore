# 02 — Legacy → V3 Conversion

**Do this before anything in `01_BACKEND_AND_DATA.md`.**
**Visible change: none. Ever.**

---

## 01 — Why this comes first

You cannot normalise a service that exists twice. Every rename, every capability guard, every terminology conversion in §01 has to be applied to *one* implementation. If two generations of `PurchaseService` are live, each of those changes is applied twice, tested once, and the second copy silently drifts.

There is also a documented bug that came from exactly this:

> **`CLAUDE.md`, PurchaseService Safety:** if the legacy `PurchaseService` is ever wired into routes, the double-entry payment allocation must link `PaymentAllocation` to a `JournalEntry` ID rather than a `Payment` ID, or the database trigger rejects the write.

That warning exists because a duplicate is live. Delete the duplicate and the warning becomes unnecessary.

---

## 02 — What is actually duplicated — verified 11 August 2026

`app/Services/V3/` contains **12** services. `app/Services/` (top level) contains **43** files, of which these overlap by name:

| Name | `app/Services/V3/` | `app/Services/` | Status |
|---|---|---|---|
| `FifoService` | ✅ 302 LOC, canonical | ⚠️ present | **Duplicate — delete legacy** |
| `InventoryService` | ✅ 346 LOC, canonical | ⚠️ present, still called | **Duplicate — migrate then delete** |
| `PurchaseService` | ✅ 322 LOC, canonical | ⚠️ present, unwired | **Duplicate — delete legacy** |
| `AccountingService` | ✅ canonical, widely called | — | Clean |
| `SaleService` | ✅ canonical | — | Clean |
| `PaymentService` · `SettlementService` · `TaxService` · `PartyService` · `ManufacturingService` · `UomService` · `AuditService` | ✅ | — | Clean |

Two more top-level services are **not** duplicates but are architecturally adjacent and must be classified rather than deleted:

| Service | Verdict |
|---|---|
| `LedgerService` | **Keep, but demote.** It is a static read helper (`partyNetBalance`) called from 8 models and 9 controllers. It is not a second ledger — it is a query. Rename to `PartyBalanceQuery` in §01 and move under `app/Queries/`. Do **not** fold it into `V3\AccountingService`; that service is a writer and mixing a hot read path into it will hurt. |
| `SaleReversalService` | **Keep.** Called 3× from `SaleController`. It is reversal orchestration on top of `V3\SaleService`, not a duplicate of it. Move to `app/Services/V3/SaleReversalService.php` so the generation boundary is honest. |
| `FinancialReportingService` | **Keep, protect absolutely.** Single source of financial truth; every report, dashboard and AI answer routes through it. Do not touch it in this programme beyond adding tests. |

---

## 03 — Live call sites to migrate

Verified by direct search. These are the only places the legacy generation is still reached:

```
app/Http/Controllers/PosController.php:87
    public function store(Request $request, \App\Services\InventoryService $inventoryService)

app/Http/Controllers/WooCommerceController.php:9
    use App\Services\InventoryService;
```

**Two call sites. That is the entire migration surface for `InventoryService`.**

`FifoService` (legacy) and `PurchaseService` (legacy) have **zero** live call sites — everything already resolves `\App\Services\V3\...`. They are dead files that only exist to be imported by mistake.

---

## 04 — Execution order

### Step 1 — Freeze the legacy generation (day 1)

Add a CI guard before touching anything, so no new call site can appear while the migration runs.

```php
// tests/Architecture/NoLegacyServiceGenerationTest.php
public function test_no_new_references_to_legacy_duplicated_services(): void
{
    $banned = [
        'App\Services\FifoService',
        'App\Services\PurchaseService',
        // InventoryService is added at Step 3, once its two call sites are migrated
    ];
    // scan app/, routes/, database/ for `use` and FQCN references
}
```

### Step 2 — Delete the two dead files (day 1)

```
app/Services/FifoService.php       → delete
app/Services/PurchaseService.php   → delete
```

Run the full suite. If it is green, these were genuinely dead. If anything fails, a reference was missed — fix the reference, do not restore the file.

**Also remove the now-obsolete PurchaseService Safety note from `CLAUDE.md`.** Leaving a warning about a file that no longer exists teaches every future agent something false.

### Step 3 — Migrate the two `InventoryService` call sites (days 1–3)

`PosController::store` takes the legacy service by constructor injection. The V3 service has a different surface, so this is not a find-and-replace — it needs a read of both and a behaviour-equivalence test.

**Required before the swap:** a characterisation test that runs a representative POS sale through the legacy path and snapshots the resulting stock rows, FIFO lot consumption and journal entries. Then swap to `V3\InventoryService` and assert the snapshot is byte-identical. Same for the WooCommerce stock-sync path.

This is the only genuinely risky step in the document. Budget three days, not one.

### Step 4 — Delete legacy `InventoryService`, extend the CI guard (day 4)

### Step 5 — Reclassify the two adjacent services (days 4–6)

```
app/Services/LedgerService.php        → app/Queries/PartyBalanceQuery.php
                                        (17 call sites, mechanical rename)
app/Services/SaleReversalService.php  → app/Services/V3/SaleReversalService.php
                                        (3 call sites)
```

Keep a thin deprecated alias for one release if you prefer, but there is no external consumer here — a clean rename with all 20 call sites updated in the same commit is safer than an alias somebody forgets to remove.

### Step 6 — Add the generation guard permanently (day 6)

```php
// Any service that writes to the ledger, stock or party balances
// MUST live in app/Services/V3/.
public function test_financial_writers_live_in_v3(): void
```

---

## 05 — What "V3" should mean after this

Right now `V3` is a folder name that reads like a version number, which invites a `V4` and a fourth generation. Give it a meaning instead. Two options:

| Option | Effect |
|---|---|
| **Keep `V3/`, document it** | Cheapest. Add a `README.md` in the folder: *"These 12 services are the only code permitted to write to the ledger, stock lots or party balances. Everything else calls them."* |
| **Rename to `app/Engines/`** | Truer to what they are and to the product story — "we assemble your software from engines". ~60 `use` statements plus tests. One day of mechanical work. |

**Recommendation: rename to `app/Engines/`, but not now.** Do it in the same commit window as §01's generic renames, so the whole codebase changes vocabulary once rather than twice. Until then, add the README.

---

## 06 — Acceptance criteria

- [ ] `app/Services/FifoService.php` does not exist
- [ ] `app/Services/PurchaseService.php` does not exist
- [ ] `app/Services/InventoryService.php` does not exist
- [ ] Zero references to `App\Services\{Fifo,Purchase,Inventory}Service` anywhere in `app/`, `routes/`, `database/`, `tests/`
- [ ] Characterisation test proves POS sale and WooCommerce sync produce byte-identical stock, FIFO and journal output before and after the swap
- [ ] `NoLegacyServiceGenerationTest` green in CI
- [ ] `CLAUDE.md` PurchaseService Safety note removed
- [ ] Full suite green against `amd_pos_test` (MariaDB — never SQLite)
- [ ] **Zero visible change.** No route, no page, no response shape differs.

**Estimate:** 6 working days solo with AI assistance. Step 3 is 3 of those 6.
