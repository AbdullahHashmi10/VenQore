# FIX GUIDE — AMD POS / VenQore

**Audit date:** 2026-08-10
**Scope:** the 6 code edits made today + the ~100 failing tests + ledger-as-source-of-truth verification
**Verdict: 🔴 NOT GREEN. Do not build yet.**

---

## 0. Executive summary — read this first

Today's session made **6 edits**. My audit finds:

| # | Edit | Verdict |
|---|------|---------|
| 1 | `PaymentService::checkOverAllocation` → read `invoices` | 🔴 **REGRESSION — this is what breaks your 90 Golden tests** |
| 2 | `SupplierPaymentController::updatePurchaseBadge` → read `invoices` | 🔴 **REGRESSION** |
| 3 | `SaleController::show()` amountPaid → `payment_allocations` | 🔴 **REGRESSION — breaks every sale receipt** |
| 4 | `SaleController::printReceipt()` amountPaid → `payment_allocations` | 🔴 **REGRESSION — same** |
| 5 | `PurchaseController::postPurchaseJournal` writes allocations | 🟠 **PARTIALLY WRONG — double-counts `paid_amount`, writes a cross-table ID** |
| 6 | `Pos.jsx` `id: data.sale_id \|\| data.id` | 🟢 **CORRECT — keep this one** |

### The single root misunderstanding

The earlier session produced **two contradictory conclusions in the same conversation** and acted on the wrong one:

- First it said: *"purchases were migrated to a dedicated `purchases` table; PaymentService querying `invoices` is the bug."*
- Then it said: *"purchases live in `invoices`; PaymentService querying `purchases` is the bug"* — **and edited the code on this basis.**

**Both statements are half-true, and that is the actual problem.** You have **two parallel purchase systems**:

| System | Writes purchases to | Files |
|---|---|---|
| **Legacy / main UI** | `invoices` (`type='purchase'`) | `App\Http\Controllers\PurchaseController` (verified: `Invoice::create` at ~line 284) |
| **V3 / financial core** | `purchases` | `V3\PurchaseController`, `V3\PurchaseReturnController`, `V3\SupplierStatementController`, `V3\PartyController`, `V3\InventoryService`, `V3\PurchaseService`, `GoldenCompanySeeder` |

Before today, `PaymentService` correctly read `purchases` — matching the whole rest of V3. Today's edit made it the **only** file in `app/Services/V3/` that reads `invoices`. That single line is why the Golden suite collapsed (details in §2, Fix 1).

---

## 1. Your architecture rule — where you actually stand

> *"Everything goes into the ledger/core, all calculation happens there, we just present it to users."*

**Status: partially true. Four active violations.**

### ✅ What is already correct

- `LedgerService::partyNetBalance()` derives party balance purely from `journal_items` + `journal_entries` (filters `is_reversed = 0`, scoped by tenant). This is correct and is your real source of truth.
- `PurchaseController` has already stopped writing `parties.current_balance` directly (comment: *"Party balance is now tracked via V3 journal only"*). Good.
- `AccountingService::createEntry` is the single write path into the ledger. Good.

### ❌ Violation V1 — five competing sources of truth for "how much is paid"

For a single purchase, the current code writes the paid amount to **four** places, and reads it from a fifth:

1. `journal_entries` / `journal_items` (reference_type `purchase_payment`) ← **this is the only one that should exist**
2. `payments` table (legacy `Payment::create`)
3. `payment_allocations` table
4. `invoices.paid_amount`
5. `invoices.status` / `purchases.payment_status` (derived badge)

Any one of these drifting produces exactly the "shows UNPAID after full payment" symptom you hit. **Fix 5 and Fix 6 below collapse this.**

### ❌ Violation V2 — `parties.current_balance` is stale but still read

Nothing maintains it any more, yet `AiController.php` (lines ~655, ~1110–1115) still reads it to answer *"what are my receivables?"* → **your AI assistant is reporting stale or zero receivables to customers.** See Fix 8.

### ❌ Violation V3 — "previous balance" on prints is computed by arithmetic, not from the ledger

Current formula: `prev = partyNetBalance() - balanceDue`.

This is only correct if the AR/AP net movement of this one document exactly equals `balanceDue`. It silently breaks with: sale returns, discounts posted to AR, round-off, bad-debt write-offs, ledger-credit refunds (`method = 'ledger_credit'` — which your return flow does use), or any manual journal touching this party on the same document. **The ledger already knows the answer; stop reconstructing it.** See Fix 3.

### ❌ Violation V4 — `payment_allocations` is a second ledger, not an index

It has its own `status` (`active`/`reversed`/`written_off`) that must be kept in sync with `journal_entries.is_reversed` by hand. There is already a gap: `PaymentService::reverseAllocations()` rebuilds the badge **only for `sale_id` rows** — purchase badges are never rebuilt on reversal. See Fix 7.

---

## 2. THE FIXES — do them in this order

> Work top to bottom. Fixes 1–4 are required to get the suite running at all.
> ⚠️ Do not skip Fix 5's decision point.

---

### 🔴 FIX 1 — Revert `PaymentService::checkOverAllocation` to the `purchases` table

**File:** `app/Services/V3/PaymentService.php` (around lines 160–185)
**Fixes:** ~90 Golden / FinancialCoreVerification failures + `PurchaseInputVerificationTest`

**Why:** `GoldenCompanySeeder.php` line ~516 calls
`$this->payments->allocate($vpJe1->id, [['purchase_id' => self::PUR_001, ...]])`
where `PUR_001` was inserted into **`purchases`** by `createPurchaseRecord()` (line ~1028). With today's edit, `checkOverAllocation` looks that ID up in `invoices`, finds nothing, and throws
`InvalidArgumentException: Invoice not found`.
The seeder dies inside `setUp()`, so **every test in the Golden suite fails before its first assertion.** That is your 90.

**Replace the `else` branch with:**

```php
        if ($type === 'sale') {
            $invoice = DB::table('sales')
                ->where('tenant_id', $tid)
                ->where('id', $invoiceId)
                ->first();
            $invoiceTotal = (float) ($invoice->total ?? 0);
        } else {
            // V3 purchases live in the `purchases` table. This must stay in step
            // with V3\PurchaseService, V3\PurchaseController, V3\SupplierStatementController
            // and GoldenCompanySeeder, which all write/read `purchases`.
            // (The legacy App\Http\Controllers\PurchaseController stores its
            //  purchases in `invoices` — that flow must NOT come through here.
            //  See FIX 5.)
            $invoice = DB::table('purchases')
                ->where('tenant_id', $tid)
                ->where('id', $invoiceId)
                ->first();
            $invoiceTotal = (float) ($invoice->total ?? 0);
        }

        if (!$invoice) {
            throw new \InvalidArgumentException(
                "Invoice not found: {$invoiceId}. Tenant: {$tid}. Type: {$type}."
            );
        }
```

**Note:** move the `if (!$invoice)` check *above* the `$invoiceTotal` assignment if you prefer — but keep it, do not delete it.

**Verify:**
```bash
php artisan test tests/tests/Feature/Golden/FinancialCoreVerificationTest.php
```
Expect the "Invoice not found" errors to disappear entirely.

---

### 🔴 FIX 2 — Revert `SupplierPaymentController::updatePurchaseBadge` to `purchases`

**File:** `app/Http/Controllers/V3/SupplierPaymentController.php` (bottom of file)
**Fixes:** `ExpensePaymentInputVerificationTest::test_X05_supplier_payment_made_reduces_ap` (HTTP 500)

**Why:** Same reason as Fix 1. Also — the `invoices` version reads `->total_amount` and writes `status`, but `purchases` uses `total` and `payment_status`. Today's version updates columns that hold different meanings.

**Replace the whole method with:**

```php
    private function updatePurchaseBadge(string $purchaseId): void
    {
        $tid = app('current.tenant')->id;

        $purchase = DB::table('purchases')
            ->where('tenant_id', $tid)
            ->where('id', $purchaseId)
            ->first();
        if (!$purchase) return;

        $allocated = (float) DB::table('payment_allocations')
            ->where('tenant_id', $tid)
            ->where('purchase_id', $purchaseId)
            ->where('status', 'active')
            ->sum('allocated_amount');

        $total     = (float) ($purchase->total ?? 0);
        $tolerance = (float) (DB::table('system_settings')
            ->where('tenant_id', $tid)
            ->where('key', 'roundoff_tolerance')
            ->value('value') ?? 1.00);

        $outstanding = $total - $allocated;

        if ($allocated <= 0) {
            $status = 'unpaid';
        } elseif ($outstanding <= $tolerance) {
            $status = 'paid';
        } else {
            $status = 'partial';
        }

        DB::table('purchases')
            ->where('tenant_id', $tid)
            ->where('id', $purchaseId)
            ->update(['payment_status' => $status, 'updated_at' => now()]);
    }
```

---

### 🔴 FIX 3 — Sale receipts: stop reconstructing "previous balance", ask the ledger

**Files:** `app/Services/LedgerService.php`, `app/Http/Controllers/SaleController.php` (~lines 747–810)
**Fixes:** wrong / blank previous balance on every printed sale receipt

**Why today's edit is a regression:** it changed `$amountPaid` from `$sale->payments->sum('amount')` to a `payment_allocations` query. But I verified: **nothing writes `payment_allocations` for sales created through `SaleController` or the POS.** `Payment::create(['sale_id' => ...])` is what runs (lines ~1484 and ~1496), and `payments.sale_id` exists and is populated. So today's change made `$amountPaid` permanently **0**, which makes `balanceDue` the full invoice total, which makes `prev_balance = net − fullTotal` — **the exact bug you were trying to fix, now guaranteed on every sale.**

**Don't just revert it.** Revert-only puts back the race-condition-shaped formula. Do this instead — it satisfies your ledger rule and kills the race properly.

#### 3a. Add a ledger method that answers the question directly

In `app/Services/LedgerService.php`, add alongside `partyNetBalance()`:

```php
    /**
     * The party's AR-minus-AP balance EXCLUDING every journal entry raised by
     * one source document. This is the true "previous balance" for a print:
     * it is derived from the ledger, so returns, discounts, round-off,
     * ledger-credit refunds and manual journals are all accounted for
     * automatically — and it cannot race with the posting transaction,
     * because it filters on the document rather than subtracting an estimate.
     *
     * @param string $documentId  the sales.id / invoices.id used as
     *                            journal_entries.reference
     */
    public static function partyBalanceExcludingDocument(
        int|string $partyId,
        int|string $tenantId,
        string $documentId
    ): float {
        [$arCode, $apCode] = static::accountCodes($tenantId);

        $movement = function (string $code) use ($partyId, $tenantId, $documentId) {
            return (float) (DB::table('journal_items as ji')
                ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
                ->join('accounts as a', 'ji.account_id', '=', 'a.id')
                ->where('je.tenant_id', $tenantId)
                ->where('je.is_reversed', 0)
                ->where('ji.party_id', $partyId)
                ->where('a.code', $code)
                ->where(function ($q) use ($documentId) {
                    $q->whereNull('je.reference')
                      ->orWhere('je.reference', '!=', $documentId);
                })
                ->selectRaw('COALESCE(SUM(ji.debit),0) - COALESCE(SUM(ji.credit),0) as net')
                ->value('net') ?? 0);
        };

        return $movement($arCode) - $movement($apCode);
    }
```

> ⚠️ Check the sign convention on the last line against the existing `partyNetBalance()` body (around lines 38–60) and **match it exactly**. If `partyNetBalance` returns `$arBalance + $apBalance` or negates AP differently, mirror that. Getting this backwards flips every supplier balance.

#### 3b. Use it in `SaleController::show()` (~line 747)

Replace the whole `$amountPaid` / `$balanceDue` / `customer_prev_balance` block with:

```php
        if ($sale->customer) {
            $netBalance = LedgerService::partyNetBalance(
                $sale->customer->id,
                $sale->tenant_id
            );
            $sale->customer->current_balance = $netBalance;

            $sale->customer_net_balance  = $netBalance;
            $sale->customer_prev_balance = LedgerService::partyBalanceExcludingDocument(
                $sale->customer->id,
                $sale->tenant_id,
                $sale->id
            );
            $sale->append(['customer_net_balance', 'customer_prev_balance']);
        }
```

Delete the long explanatory comment block that currently argues with itself (lines ~764–773) — its conclusion was wrong.

#### 3c. Do the same in `SaleController::printReceipt()` (~line 795)

```php
        if ($sale->party_id) {
            $sale->customer_net_balance  = LedgerService::partyNetBalance($sale->party_id, $sale->tenant_id);
            $sale->customer_prev_balance = LedgerService::partyBalanceExcludingDocument(
                $sale->party_id, $sale->tenant_id, $sale->id
            );
        }
```

#### 3d. Confirm the journal `reference` actually holds the sale ID

Open the sale-posting path and check that `AccountingService::createEntry` is called with `'reference' => $sale->id` (not the human-readable `reference_number`). If it stores the reference number instead, use that value in the `partyBalanceExcludingDocument` call instead of `$sale->id`. **Verify this before trusting the output** — it is the one assumption the whole fix rests on.

---

### 🔴 FIX 4 — Same treatment for purchase prints

**File:** `app/Http/Controllers/PurchaseController.php` — the `show()` method (~lines 468–500)

It currently uses the same `$net - $balanceDue` shape. Apply the identical change:

```php
        $supplierNet  = LedgerService::partyNetBalance($invoice->party_id, $invoice->tenant_id);
        $supplierPrev = LedgerService::partyBalanceExcludingDocument(
            $invoice->party_id, $invoice->tenant_id, $invoice->id
        );
```

---

### 🟠 FIX 5 — `PurchaseController::postPurchaseJournal` — three real bugs introduced today

**File:** `app/Http/Controllers/PurchaseController.php`, `postPurchaseJournal()`

#### Bug 5a — `paid_amount` is now DOUBLE-COUNTED 🔴

In `store()` (~line 289):
```php
'paid_amount' => $validated['amount_paid'] ?? 0,   // ← written once here
```
Then in `postPurchaseJournal()`:
```php
$invoice->increment('paid_amount', $validated['amount_paid']);  // ← added AGAIN
```

**A fully-paid Rs 10,000 purchase now records Rs 20,000 paid.** This one will corrupt live data the moment you ship.

**Fix:** delete the `increment()` line. (If you keep the denormalised column at all — see 5c.)

#### Bug 5b — the allocation row uses an `invoices.id` in a `purchases` column 🔴

`payment_allocations.purchase_id` is documented in `2026_03_05_000001_v3_foundation_schema.php` as *"FK to purchases (char 36 UUID)"*, and every V3 reader joins it against `purchases`. Today's insert puts an `invoices.id` there. That row will never join in V3, but it **will** be summed by any `WHERE purchase_id = ?` query — so it silently corrupts V3 supplier statements and aged-payables the moment the two ID spaces collide.

#### 🔷 DECISION POINT D1 — you must choose

| | Option A — **recommended for this release** | Option B — consolidate |
|---|---|---|
| **What** | Legacy `PurchaseController` stops writing `payment_allocations` entirely. Paid amount is derived from the **journal** (`reference_type = 'purchase_payment'`, `reference = invoice.id`). | Migrate the legacy purchase flow onto the `purchases` table so there is one purchase store. |
| **Risk** | Low. No schema change, no data migration. | High. Touches stock, landed costs, expenses, returns, reports. |
| **Effort** | ~1 hour | Multi-day |
| **Ledger rule** | ✅ Satisfied — the journal becomes the sole truth for legacy purchases | ✅ Satisfied |

**Take Option A now, schedule Option B.** Under Option A, replace the entire block that today's session added (from the `// ── FIX: write the payment_allocations row` comment down to the `$invoice->update(['status' => $newStatus]);` line) with:

```php
            // Payment recorded. The journal entry above ($pmJournal) IS the
            // source of truth for how much has been paid on this purchase.
            // We deliberately do NOT write payment_allocations here: that table
            // is keyed to the V3 `purchases` table, and this invoice lives in
            // `invoices`. Mixing the two ID spaces corrupts V3 statements.
            // Read the paid amount with paidAmountForInvoice() below.
```

Then add this helper to the same controller and use it in `index()`, `show()` and `edit()` in place of every `payment_allocations` / `paid_amount` read:

```php
    /**
     * Amount paid against a legacy (invoices-table) purchase, read from the ledger.
     * Sums the AP debits raised by purchase_payment entries for this invoice.
     */
    private function paidAmountForInvoice(string $invoiceId, string $tenantId): float
    {
        return (float) (DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('je.tenant_id', $tenantId)
            ->where('je.is_reversed', 0)
            ->where('je.reference_type', 'purchase_payment')
            ->where('je.reference', $invoiceId)
            ->where('a.code', '2000')
            ->sum('ji.debit') ?? 0);
    }
```

#### Bug 5c — `invoices.status` carries two different meanings 🟠

`store()` sets `'status' => $validated['status'] ?? 'pending'` (a *workflow* state).
`postPurchaseJournal()` overwrites it with `unpaid` / `partial` / `paid` (a *payment* state) — **but only when `amount_paid > 0`.** So an unpaid purchase keeps `status = 'pending'` forever and never shows as UNPAID.

**Fix:** recompute and write the payment status **unconditionally**, outside the `if (amount_paid > 0)` block, at the end of `postPurchaseJournal()`:

```php
        // Always recompute the payment badge — including the zero-paid case,
        // which previously left status stuck on 'pending'.
        $paid       = $this->paidAmountForInvoice($invoice->id, $invoice->tenant_id);
        $grandTotal = (float) $invoice->fresh()->total_amount;
        $tolerance  = (float) (DB::table('system_settings')
            ->where('tenant_id', $invoice->tenant_id)
            ->where('key', 'roundoff_tolerance')
            ->value('value') ?? 1.00);

        $invoice->update([
            'status' => $paid <= 0
                ? 'unpaid'
                : (($grandTotal - $paid) <= $tolerance ? 'paid' : 'partial'),
        ]);
```

If you need the workflow state (`pending` / `received` / `cancelled`), **add a separate `workflow_status` column** — do not overload `status`.

#### Bug 5d — hardcoded tolerance

Today's code hardcodes `$tolerance = 1.0`. `SupplierPaymentController` and `PaymentService` both read `system_settings.roundoff_tolerance`. The snippet above already fixes this — make sure no `= 1.0` literal survives.

#### Bug 5e — null tenant fallback

```php
$tid = app()->bound('current.tenant') ? app('current.tenant')->id : null;
```
A NULL `tenant_id` row is invisible to every tenant-scoped read but still counts in un-scoped sums. If you keep any insert here, **throw instead of defaulting to null.** (Under Option A this line disappears with the block.)

---

### 🟠 FIX 6 — Drop the legacy `Payment::create` double-write, or mark it clearly

**File:** `app/Http/Controllers/PurchaseController.php`, inside `postPurchaseJournal()`

```php
\App\Models\Payment::create([...]);   // ← writes the payments table
```

Note `payments.sale_id` is `NOT NULL` with an FK to `sales` (see `2026_01_02_000004_create_payments_table.php`) — **check whether this insert is even succeeding**, or whether a later migration made it nullable. If it is failing silently inside the transaction, that is another live bug.

Either way: this row is a 4th source of truth. Once Fix 5 lands, either delete it or add a comment stating it is an **operational record only, never read for balances** — and then confirm by grep that nothing reads it for purchases.

---

### 🟠 FIX 7 — `PaymentService` never maintains purchase badges

**File:** `app/Services/V3/PaymentService.php`

Two gaps:

1. **`allocate()`** (~line 66) calls `updatePaymentBadge()` only `if ($isSale)`. Purchase allocations never refresh `purchases.payment_status`.
2. **`reverseAllocations()`** (~line 150) loops `if ($row->sale_id)` only. Reversing a supplier payment leaves the purchase showing PAID.

**Fix:** add a `updatePurchaseBadge(string $purchaseId)` method to `PaymentService` (same body as Fix 2, reading `purchases`), then:

- in `allocate()`: `else { $this->updatePurchaseBadge($allocation['purchase_id']); }`
- in `reverseAllocations()`: `elseif ($row->purchase_id) { $this->updatePurchaseBadge($row->purchase_id); }`

Then delete the private copy in `SupplierPaymentController` and call `$this->payments->updatePurchaseBadge(...)` instead — **one method, one owner.** The docblock on `updatePaymentBadge` already promises *"THIS IS THE ONLY METHOD THAT WRITES payment_status"*; make that true for purchases too.

---

### 🟠 FIX 8 — AI assistant is reading a dead column

**File:** `app/Http/Controllers/AiController.php` (lines ~655, ~1110–1115)

Nothing maintains `parties.current_balance` any more, but these lines still report it as receivables/payables to the user.

**Fix:** replace every `$party->current_balance` and `Party::where('current_balance', ...)` in this file with `LedgerService::partyNetBalance($party->id, $party->tenant_id)`.

For the aggregate queries (lines ~1110–1115), you cannot filter on a computed value in SQL — build the receivables list from the ledger instead:

```php
$balances = DB::table('journal_items as ji')
    ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
    ->join('accounts as a', 'ji.account_id', '=', 'a.id')
    ->join('parties as p', 'ji.party_id', '=', 'p.id')
    ->where('je.tenant_id', $tenantId)
    ->where('je.is_reversed', 0)
    ->where('a.code', '1200')          // AR
    ->groupBy('p.id', 'p.name')
    ->havingRaw('SUM(ji.debit) - SUM(ji.credit) > 0')
    ->selectRaw('p.id, p.name, SUM(ji.debit) - SUM(ji.credit) as balance')
    ->get();
```

Then **either** drop `parties.current_balance` in a migration **or** add a comment on the column marking it as legacy/unmaintained, so nobody reads it again. Leaving an unmaintained balance column in the schema is how this bug comes back.

---

### 🟡 FIX 9 — Missing tenant scoping on the allocation queries

Today's edits added `payment_allocations` queries in `SaleController` (~lines 758, 801) and `PurchaseController` with **no `tenant_id` filter**. `2026_04_13_210000_harden_tenant_isolation_on_remaining_tables.php` explicitly added `tenant_id` to this table for a reason.

UUID keys make a collision unlikely, not impossible — and it breaks the isolation guarantee your Guardrails tests assert. **If any of these queries survive Fixes 3–5, add `->where('tenant_id', $tenantId)`.** Grep after you finish:

```bash
grep -rn "payment_allocations" app/ | grep -v "tenant_id"
```
This should return **nothing**.

---

### 🟢 FIX 10 — Keep the `Pos.jsx` change

**File:** `resources/js/Pages/Pos.jsx` (~line 1121)

```js
id: data.sale_id || data.id,   // ← ensures quickPrint fetches fresh server data
```

This one is correct. `PrintService.quickPrint()` gates its server re-fetch on `sale.id`, and the POS response only carries `sale_id`. **Leave it.** It only pays off once Fix 3 lands, though — right now it fetches a wrong balance faster.

---

## 3. TEST FIXES

### FIX 11 — Registry drift (`RegistryDriftTest`) — 🟢 trivial

Exactly **4** live test files are missing from `tests/VerificationCenter/registry/suites.yaml`, and **0** stale entries (I diffed it):

```
tests/Feature/Guardrails/PlanEntitlementIntegrityTest.php
tests/Unit/Experience/AppearanceTest.php
tests/Unit/Experience/UserPreferenceTest.php
tests/Unit/Experience/WidgetRegistryTest.php
```

**Fix — just regenerate:**
```bash
php tests/Scripts/update_suites.php
```
Then confirm `meta.phpunit_test_methods_total` in the yaml went up, and re-run `RegistryDriftTest`. Do **not** hand-edit the yaml — the method counts must match the generator's own parser.

---

### FIX 12 — `SuiteIntegrityTest` — path convention is out of date

The folder restructure renamed `Tester/tests` → `tests/tests` and **deleted `FinalTester` entirely** (I confirmed: `FinalTester/` does not exist; `Tester/` now contains only an empty `VerificationCenter/`).

The test still asserts:
- `<root>/Tester/Golden/tests` archive guard — path gone
- `<root>/Tester/tests` vs `<root>/FinalTester/tests` mirror parity — **the mirror concept no longer exists**

**Fix, in `tests/tests/Feature/Core/SuiteIntegrityTest.php`:**

1. Update `testerRoot()`'s comment — `dirname(__DIR__, 3)` now resolves to `<root>/tests`, which is correct. No code change needed there.
2. **Delete the FinalTester mirror-parity assertion** (~lines 189–225). There is no second tree to drift from. Replace the method body with a short comment recording *why* it was removed, and the date.
3. Repoint the archive guard from `Tester/Golden/tests` to whatever the new archive location is. If you no longer keep an archive tree, delete the guard.
4. Update the `phpunit.xml` assertion (~line 230) to the real current path.

Also: **delete the orphaned `Tester/` directory** once you have confirmed nothing references it.

---

### FIX 13 — `PlanTruthFailClosedTest` — fix the **production code**, not the test

**Error:** `Undefined array key "production"`

**Cause:** `PlanRepository::featuresFor()` (line ~251) builds the map by iterating **only the seeded rows**:

```php
$rawLimits = self::getLimits($tenant->plan ?? 'starter');
foreach ($rawLimits as $key => $val) { $map[$key] = self::canUseFeature($tenant, $key); }
```

The test deletes the `production` row to simulate an unseeded key, so the key vanishes from the map entirely and `$features['production']` throws.

**The test is right and the code is wrong.** "Fail-closed" means an unknown feature resolves to `false`, not that it disappears. Right now the frontend gets `undefined` (falsy by luck), and any server-side `$features['x']` fatals.

**Fix — `app/Services/PlanRepository.php`, `featuresFor()`:**

```php
    public static function featuresFor(\App\Models\Tenant $tenant): array
    {
        $cacheKey = "tenant_features_map:{$tenant->id}:{$tenant->plan}";
        return Cache::remember($cacheKey, 300, function () use ($tenant) {
            $rawLimits = self::getLimits($tenant->plan ?? 'starter');

            // Fail-closed: the map must contain EVERY known feature key, not
            // just the seeded ones. A key missing from plan_limits resolves to
            // false — it must never be absent, because an absent key reads as
            // "undefined" on the frontend and fatals on the backend.
            $canonical = array_keys(config('plans.starter', []));
            $keys = array_unique(array_merge($canonical, array_keys($rawLimits)));

            $map = [];
            foreach ($keys as $key) {
                $map[$key] = self::canUseFeature($tenant, $key);
            }
            return $map;
        });
    }
```

> Confirm `config('plans.starter')` is the right canonical key source for your config shape — if `config/plans.php` nests plans differently, point `$canonical` at whichever array holds the full feature key list. Then confirm `canUseFeature()` itself returns `false` (not `true`) for an unseeded key.

**Do not** "fix" this by changing the test to `$features['production'] ?? false` — that hides a real fail-open hole.

---

### FIX 14 — `AppearanceTest` (3 failures) — tests are stale, code is right

All three assert on behaviour that was deliberately changed. **Update the test file** `tests/tests/Unit/Experience/AppearanceTest.php`:

**14a. `test_sanitize_keeps_recognised_values` (~line 46)**
`sanitize()` now *pins* `font`, `density` and `radius` to defaults (deliberate — the comment at `Appearance.php:252–264` explains it is the security gate against replayed/hand-crafted requests). Change lines ~60–62 from:
```php
$this->assertSame('serif',   $clean['font']);
$this->assertSame('compact', $clean['density']);
$this->assertSame('sharp',   $clean['radius']);
```
to:
```php
// Typography, density and radius are pinned at the sanitize gate (2026-08).
// Supplying them must be ignored, not honoured.
$defaults = Appearance::defaults();
$this->assertSame($defaults['font'],    $clean['font']);
$this->assertSame($defaults['density'], $clean['density']);
$this->assertSame($defaults['radius'],  $clean['radius']);
```
Consider renaming the test to `test_sanitize_keeps_recognised_values_and_pins_withdrawn_ones`.

**14b. `test_sanitize_without_fill_returns_only_supplied_keys` (~line 122)**
It passes `['theme' => 'colour']`, but `THEMES` is now `['midnight-nebula', 'daylight-calm']` — `colour` was retired, so it is rejected and (with `$fill = false`) dropped. Use a live theme:
```php
$partial = Appearance::sanitize(['theme' => 'daylight-calm'], false);
$this->assertSame(['theme' => 'daylight-calm'], $partial);
```

**14c. `test_html_attributes_survive_an_empty_appearance` (~line 157)**
Asserts `'minimal'`; the default is now `'midnight-nebula'`. Don't hardcode it again:
```php
$this->assertSame(Appearance::defaults()['theme'], $attributes['data-vq-theme']);
```

---

### FIX 15 — `CodeStackingTest::growth_engine` — test is stale, product decision already shipped

The test (`tests/tests/Feature/AppSumo/CodeStackingTest.php` ~line 201) cites a "Session-3 correction" saying `growth_engine` is `'0'` everywhere. That was **superseded on 2026-08-08**:

- `PlanFeatureMatrixSeeder.php:317` → `'growth' => '1', 'business' => '1'` *(comment: "Phase 1 change - 2026-08-08")*
- `config/plans.php:175` → `ltd_2: 'growth_engine' => true` *("enabled on LTD 2 (Phase 1)")*
- `config/plans.php:202` → `ltd_3: 'growth_engine' => true`
- LTD tiers inherit from their base plan (`ltd_2 = growth`) — seeder lines ~353–356

Seeder and config **agree**. The change was applied deliberately and consistently in both places; only the test was missed.

**Fix — invert the assertion and record why:**
```php
        // 2026-08-08 (Phase 1): growth_engine ships ON for Growth/Business, and
        // therefore for ltd_2/ltd_3 which inherit from them. Confirmed in both
        // PlanFeatureMatrixSeeder (Group 10) and config/plans.php ltd_2/ltd_3.
        // Supersedes the Session-3 note that assumed it was off everywhere.
        $this->assertTrue(
            (bool) $tenant->getLimit('growth_engine'),
            'ltd_2 inherits growth_engine from the growth plan (Phase 1, 2026-08-08).'
        );
```

> ⚠️ **Confirm with your product owner before flipping this.** If `growth_engine` was *not* meant to reach AppSumo LTD buyers, the fix is the opposite: add `if (str_starts_with($slug, 'ltd_') && $key === 'growth_engine') $val = '0';` to the seeder's override block (~line 390) and set `config/plans.php` ltd_2/ltd_3 back to `false`. **You cannot leave it half-done** — right now every LTD-2 customer has the AI add-on for free.

---

### FIX 16 — `AuthenticationTest` CSRF — test is stale, the bugfix is correct

`bootstrap/app.php` (~line 175) now redirects to the **referer** instead of `fullUrl()`. That is right — redirecting to the POST URL produced a 405. The test sends no `Referer`, so it falls through to `url('/')`, but asserts `url('/_test/csrf-mismatch')`.

**Careful:** `$this->from()` in Laravel sets the *session* previous-URL, **not** the `Referer` header. You must set the header explicitly.

**Fix — `tests/tests/Feature/Auth/AuthenticationTest.php` ~line 137:**
```php
    public function test_csrf_token_mismatch_redirects_inertia_to_the_referring_page(): void
    {
        \Illuminate\Support\Facades\Route::post('/_test/csrf-mismatch', function () {
            throw new \Illuminate\Session\TokenMismatchException();
        })->middleware('web');

        $response = $this->withSession([])->post('/_test/csrf-mismatch', [], [
            'X-Inertia' => 'true',
            'Referer'   => url('/dashboard'),
        ]);

        $response->assertStatus(409);
        // Must NOT be the POST URL — that produces a 405 on reload. See bootstrap/app.php.
        $response->assertHeader('X-Inertia-Location', url('/dashboard'));
        $response->assertSessionHas('error', 'Your session has expired. Please try again.');
    }

    public function test_csrf_mismatch_without_referer_falls_back_to_root(): void
    {
        \Illuminate\Support\Facades\Route::post('/_test/csrf-mismatch', function () {
            throw new \Illuminate\Session\TokenMismatchException();
        })->middleware('web');

        $response = $this->withSession([])->post('/_test/csrf-mismatch', [], ['X-Inertia' => 'true']);

        $response->assertStatus(409);
        $response->assertHeader('X-Inertia-Location', url('/'));
    }
```

---

## 4. VERIFICATION — run these before you build

Work through in order. **Do not proceed past a red step.**

```bash
cd "E:\AMD POS\AMD POS\app-code\main-app"

# 1. Syntax — must be silent
find app tests database -name "*.php" -print0 | xargs -0 -n1 php -l | grep -v "No syntax errors"

# 2. Regenerate the registry (FIX 11)
php tests/Scripts/update_suites.php

# 3. Rebuild the test DB from scratch — the seeder is the canary
php artisan migrate:fresh --seed --env=testing

# 4. The suite that was 90-red — run it FIRST
php artisan test tests/tests/Feature/Golden/

# 5. The rest
php artisan test tests/tests/Feature/Core/
php artisan test tests/tests/Unit/Experience/
php artisan test tests/tests/Feature/AppSumo/CodeStackingTest.php
php artisan test tests/tests/Feature/Auth/AuthenticationTest.php

# 6. Everything
php artisan test

# 7. Frontend
npm run build
```

### Hygiene greps — all four must return nothing

```bash
# No V3 file may read `invoices` for purchases
grep -rn "table('invoices')" app/Services/V3/ app/Http/Controllers/V3/

# No un-scoped allocation query
grep -rn "payment_allocations" app/ | grep -v "tenant_id"

# No hardcoded tolerance
grep -rn "tolerance = 1.0\|tolerance = 1;" app/

# No live reads of the dead balance column
grep -rn "current_balance" app/Http/Controllers/AiController.php
```

### Manual smoke test — the two bugs that started this

1. **Purchase, paid in full** → list shows **PAID**, paid amount equals total (**not** double).
2. **Purchase, partially paid** → shows **PARTIAL** with the correct remainder.
3. **Purchase, unpaid** → shows **UNPAID** (not `pending`).
4. **Standalone supplier payment** against an open purchase → badge flips, AP drops in the ledger.
5. **Reverse that payment** → badge flips back to UNPAID.
6. **POS credit sale to a customer with an existing balance** → printed receipt's *Previous Balance* equals the ledger balance **before** the sale; *Net Balance* equals it **after**. Cross-check both against the party statement.
7. **POS fully-paid cash sale** → previous balance unchanged by the sale, net balance = previous.
8. **Sale return with `ledger_credit` refund** → previous/net balances on the reprint still reconcile. *(This is the case the old `net − balanceDue` formula got wrong and Fix 3 is designed to catch.)*

---

## 5. When you come back for the green signal

Send me:

1. Full output of `php artisan test` (the summary line at minimum).
2. Output of the four hygiene greps in §4.
3. Which way you went on **Decision D1** (Fix 5) and **Fix 15** (growth_engine).
4. Results of the 8 manual smoke tests.

I will re-audit and either give you the green light or flag what is left.

---

## Appendix — findings I could not fully verify

| Item | Why | What to check yourself |
|---|---|---|
| Whether the 90 Golden failures **pre-dated** today's `PaymentService` edit | `git status` timed out on this volume; I could not diff against HEAD | Run `git diff HEAD -- app/Services/V3/PaymentService.php` and `git stash` the day's work, then run the Golden suite, to see the true baseline |
| Whether `journal_entries.reference` holds `sale->id` or `sale->reference_number` | Would need to trace every `createEntry` call site in the sale-posting path | **Fix 3 depends on this** — verify before trusting the new previous-balance output |
| Whether `Payment::create` in `postPurchaseJournal` currently succeeds | `payments.sale_id` is `NOT NULL` + FK to `sales` in the original migration; a later migration may have relaxed it | `SHOW CREATE TABLE payments;` — if `sale_id` is still `NOT NULL`, that insert is throwing inside the transaction |
| Sign convention in `partyNetBalance` for AP | I read lines 24–54; the final return was past my window | Read the last lines of the method and mirror it exactly in `partyBalanceExcludingDocument` |
| Exact count of currently-failing tests | No PHP runtime in my sandbox — I could not execute the suite | Step 6 in §4 gives you the real number |
