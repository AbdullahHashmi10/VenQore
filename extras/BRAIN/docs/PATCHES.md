# PATCHES

### Nine edits to your repository, with line numbers and reasoning. Nothing here has been applied — apply them yourself, one at a time, running the suite between each.

**15 August 2026 · against `app-code/main-app` as of the 13 Aug commit of `routes/web.php` (2,172 lines)**

---

## How to use this

Ordered by severity. **P1 and P2 are live bugs that cost you money or leave a gate open** — do those first, today. P3–P5 unblock the module registry. P6–P9 are hygiene.

Line numbers are from the current file. **They shift as you apply patches**, so re-find each hunk by its surrounding text rather than trusting the number after your first edit.

After all of them: `php artisan route:list --json > route_list_current.json`, then re-run

```
python3 tools/extract_routes.py routes/web.php > routes.txt
php tools/route_ownership.php routes.txt
```

and confirm it still reports `unclaimed=0`.

---

# P1 — A paid feature is free for everyone, right now

**File:** `routes/web.php` **Line:** 1518
**Severity:** revenue. Every tenant on every plan can use the B2B Proposal Builder today.

The proposals resource is registered **twice**:

```php
// line 1130 — correct, gated
Route::resource('proposals', \App\Http\Controllers\ProposalController::class)
    ->middleware('plan.feature:b2b_proposal_builder');

// line 1518 — NO GATE
Route::resource('proposals', \App\Http\Controllers\ProposalController::class);
```

Laravel keeps the **last** registration for each route name, so the ungated one wins. All eleven `proposals.*` routes are currently reachable without the entitlement.

**Fix — delete line 1518:**

```diff
     // Proposals
-    Route::resource('proposals', \App\Http\Controllers\ProposalController::class);
     Route::post('/proposals/{proposal}/convert', [\App\Http\Controllers\ProposalController::class, 'convertToSale'])->name('proposals.convert');
```

**Then verify:** `php artisan route:list --name=proposals` — every row should show `plan.feature:b2b_proposal_builder` in its middleware.

> This is precisely the failure `CAPABILITIES_FILE_GUIDE.md` warns about: *"a wrong entitlement key … or get a paid feature free forever."* It was not a wrong key — it was a duplicate registration, which is harder to spot and does the same damage.
>
> **Note the irony to enjoy for one second and then act on:** Step 4 of the build plan deletes this gate anyway, because Proposals becomes free on every plan. Fix it first regardless — you want to remove a gate deliberately, not discover it was never enforced.

---

# P2 — `/pos` is registered twice, and the unprotected one wins

**File:** `routes/web.php` **Line:** 377
**Severity:** authorisation. The POS screen is reachable without `permission:pos.checkout`.

```php
// line 377 — outer store. group, NO permission middleware
Route::get('/pos', [\App\Http\Controllers\PosController::class, 'index'])->name('pos');

// line 1073 — inner store. group, WITH the permission check
Route::get('/pos', [\App\Http\Controllers\PosController::class, 'index'])
    ->middleware('permission:pos.checkout')->name('pos');
```

Both resolve to the name `store.pos` and both serve the URI `/s/{store_slug}/pos`. Laravel dispatches the **first** match, so line 377 — the one with no permission check — is the route that actually serves your point of sale.

**Fix — delete line 377** (keep 1073, which is correctly protected):

```diff
         // POS (on-demand API, no full catalog pre-load)
-        Route::get('/pos',                     [\App\Http\Controllers\PosController::class, 'index'])->name('pos');
         Route::get('/pos/products',            [\App\Http\Controllers\Api\PosSearchController::class, 'search'])->name('pos.search');
```

**Then verify:** log in as a user WITHOUT `pos.checkout` and open `/s/{slug}/pos`. It must 403.

> While you are here: `store.pos` is an **exact route name**, not a prefix. The pattern `store.pos.*` does not match it. `config/modules.php` lists both forms for module #5 deliberately — do not tidy that into one line.

---

# P3 — Add the `composition` terminology key

**File:** `app/Support/Terms.php`
**Severity:** blocks the Cookbook module (#29) from shipping with correct terminology.

`Terms::$fallbacks` has 25 keys and none of them is `composition`. A bakery wants to call it a *Recipe*; a workshop wants *Bill of Materials*; a pharmacy wants *Formula*. Right now they all get the hardcoded label.

**Fix — add one line at the end of the `$fallbacks` array:**

```diff
         'report' => ['singular' => 'Report', 'plural' => 'Reports'],
         'dashboard' => ['singular' => 'Dashboard', 'plural' => 'Dashboards'],
+        'composition' => ['singular' => 'Recipe', 'plural' => 'Recipes'],
     ];
```

**Then** add `'composition'` to the `terms` array of module `cookbook` in `config/modules.php` — in that order, or `ModuleRegistryIntegrityTest::test_every_terminology_key_is_real` will fail.

> Default it to *Recipe*, not *Composition*. "Composition" is what the database calls it; "Recipe" is what a human calls it. The whole point of the terminology layer is that the user never meets your table names.

---

# P4 — Four park/recall routes are registered twice, with different names

**File:** `routes/web.php` **Lines:** 1008–1011 and 1525–1528
**Severity:** gate bypass for module #13.

```php
// 1008-1011 — between the two store. groups, so NO prefix:
//   sales.parked, sales.recall, sales.parked.delete, sales.park
// 1525-1528 — inside the second store. group:
//   store.sales.parked, store.sales.recall, store.sales.parked.delete, store.sales.park
```

Eight route names, four features. `config/modules.php` currently lists **all eight** so the gate cannot be bypassed — but that is a workaround, not a fix.

**Fix — delete lines 1008–1011** (the unprefixed set), keeping the store-prefixed ones:

```diff
-        Route::get('/sales/parked', [\App\Http\Controllers\SaleController::class, 'getParkedSales'])->name('sales.parked');
-        Route::get('/sales/parked/{id}', [\App\Http\Controllers\SaleController::class, 'recall'])->name('sales.recall');
-        Route::delete('/sales/parked/{id}', [\App\Http\Controllers\SaleController::class, 'deleteParked'])->name('sales.parked.delete');
-        Route::post('/sales/park', [\App\Http\Controllers\SaleController::class, 'parkBill'])->name('sales.park');
```

**Before deleting, grep the frontend:**

```bash
grep -rn "route('sales\.\(park\|parked\|recall\)" resources/js/
```

Any hit must be changed to the `store.` form in the same commit. Then remove the four unprefixed names from module #13 in `config/modules.php`.

---

# P5 — Two more duplicate route pairs, same shape

**File:** `routes/web.php`
**Severity:** gate hygiene. Same class of bug as P4, lower blast radius.

| Duplicate | Unprefixed | Store-prefixed | URI |
|---|---|---|---|
| Inventory search | line 1005 `inventory.search` | line 1082 `store.inventory.search` | `/inventory/search` |
| Customer search | line 1006 `customers.search` | line 1499 `store.customers.search` | `/customers-search` |

**Fix — delete lines 1005 and 1006**, grep `resources/js/` for `route('inventory.search'` and `route('customers.search'` first, then remove the two unprefixed names from modules #1 and #3.

**Also, separately:** `store.inventory.stock` (line 1393) and `store.inventory.stock-levels` (line 1274) both call `InventoryController@stockLevels`. Two names, one method, two URIs. Retire whichever the frontend does not use.

---

# P6 — Debit notes return HTTP 501 to a paying customer

**File:** wherever `abort(501, 'Implement debit-notes.print')` lives
**Severity:** visible product defect. Catalog feature #84 documents this openly.

Create and view work. Print and update are literal unimplemented stubs.

**Fix — one of two, not neither:**

1. Implement the two endpoints (print reuses your existing PDF pipeline), or
2. Hide the Print and Edit buttons on the debit-note page until they exist.

```bash
grep -rn "abort(501" routes/ app/
```

> A 501 in front of a customer reads as broken software. A missing button reads as software that does not do that yet. The second is survivable; the first is a refund. Option 2 is twenty minutes.

---

# P7 — Fix `growth_engine` before you build the AI layer

**File:** `config/plans.php` and `PlanFeatureMatrixSeeder`
**Severity:** revenue, and it is currently failing a test.

`PlanTruthFailClosedTest` fails because `growth_engine` is **on by default on `ltd_2`** — a metered AI feature given free, forever, to lifetime buyers who paid once.

**Fix:** set `growth_engine => false` on `ltd_2` (and check `ltd_1`/`ltd_3` while you are there), reseed the matrix, get the test green.

**Do this BEFORE writing `config/modules.php`'s AI entry into anything live.** If you build the registry and the AI layer on top of the bug, it stops being visible as a bug and becomes "how it works".

---

# P8 — Two spellings of pre-sales

**File:** `routes/web.php` **Line:** 1563
**Severity:** low, but it is the kind of thing that costs an hour at the worst moment.

`store.pre-sales.*` (7 names) and `store.presales.create` (1 name, no hyphen) both exist.

**Fix:** rename `presales.create` → `pre-sales.create`, or redirect it. Then drop `'store.presales.*'` from module #15.

---

# P9 — Restaurant routes have no permission checks at all

**File:** `routes/web.php` **Lines:** ~449–451
**Severity:** decide, then document.

```php
Route::get('/restaurant/dashboard', ...)->name('restaurant.dashboard');   // no middleware
Route::get('/restaurant/kitchen',   ...)->name('restaurant.kitchen');     // no middleware
Route::post('/restaurant/table/{id}/status', ...)->name('restaurant.table.status');  // no middleware
```

Any authenticated user on the tenant can open the kitchen display and change table status. `api.occupancies.occupy` and `.release` correctly check `pos.checkout`; these three check nothing.

**Fix — add the permission you actually want:**

```diff
-Route::get('/restaurant/dashboard', [...])->name('restaurant.dashboard');
+Route::get('/restaurant/dashboard', [...])->middleware('permission:pos.checkout')->name('restaurant.dashboard');
```

> This might be deliberate — a kitchen screen on a tablet with no login friction is a real design choice. If so, write that down next to the route. An unprotected route with no comment is indistinguishable from an oversight, and the next person to read it will "fix" it.

---

## Not a patch, but do it in the same sitting

**Regenerate the route list.** Everything above, and every route pattern in `config/modules.php`, is derived from a static read of `routes/web.php`. It is careful, and it is still an approximation:

```bash
php artisan route:list --json > route_list_current.json
```

Then run `ModuleRegistryIntegrityTest`. It will tell you, by name, every pattern that matches nothing. **Expect it to fail the first time — that is what it is for.** Every failure it reports is a route the gate would not have protected.

---

## Summary

| | Patch | File | Severity |
|---|---|---|---|
| P1 | Duplicate ungated `proposals` resource | `routes/web.php:1518` | **Revenue — live now** |
| P2 | Duplicate unprotected `/pos` | `routes/web.php:377` | **Authorisation — live now** |
| P3 | Missing `composition` term key | `app/Support/Terms.php` | Blocks #29 |
| P4 | Duplicate park/recall routes ×4 | `routes/web.php:1008-1011` | Gate bypass |
| P5 | Duplicate search routes ×2 + duplicate stock route | `routes/web.php:1005,1006,1393` | Gate hygiene |
| P6 | `abort(501)` debit-note stubs | debit notes controller | Visible defect |
| P7 | `growth_engine` on by default on `ltd_2` | `config/plans.php` | Revenue + failing test |
| P8 | `presales` vs `pre-sales` | `routes/web.php:1563` | Low |
| P9 | Unprotected restaurant routes | `routes/web.php:449-451` | Decide + document |
