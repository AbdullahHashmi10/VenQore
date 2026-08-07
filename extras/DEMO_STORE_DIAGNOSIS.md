# Demo Store — Root Cause Diagnosis

**Date:** 2026-07-26
**Scope:** Why the demo store cannot be seeded on venqore.com, why it breaks after every update, and what a permanent + self-resetting design requires.
**Status:** Diagnosis only. No fixes applied.

---

## 0. Correction to my earlier answer

Earlier in this session I told you the `409 Conflict` was an Inertia **asset-version mismatch** caused by `npm run build`, and that a hard refresh + rebuild would fix it. **That was wrong.** I have now traced it through the vendor code and it is not a caching problem at all. The real chain is below.

---

## 1. The `409 Conflict` is a red herring — it is your own error handler

Inertia's version-mismatch check only ever runs on **GET** requests:

```php
// vendor/inertiajs/inertia-laravel/src/Middleware.php:124
if ($request->method() === 'GET' && $request->header(Header::VERSION, '') !== Inertia::getVersion()) {
    $response = $this->onVersionChange($request, $response);
}
```

Your failing requests are both **POST** (`POST /demo/login`, `POST /VenQore/demo-store/reset`), so the version check never fires on them.

The 409 comes from `Inertia::location()`:

```php
// vendor/inertiajs/inertia-laravel/src/ResponseFactory.php:308
public function location($url): SymfonyResponse
{
    if (Request::inertia()) {
        return BaseResponse::make('', 409, [Header::LOCATION => ...]);
    }
```

…which your global exception handler calls for **every** Inertia error:

```php
// bootstrap/app.php:178-187
if ($request->header('X-Inertia')) {
    $statusCode = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;
    if ($statusCode === 409) { return null; }
    return \Inertia\Inertia::location(route('error.page', ['code' => $statusCode]));
}
```

### Actual chain

```
POST /demo/login?role=owner
  → DemoController::login()
  → Tenant::where('is_golden_master', true)->firstOrFail()
  → ModelNotFoundException  →  HTTP 404
  → bootstrap/app.php: Inertia::location('/error/404')
  → wire response: HTTP 409 + X-Inertia-Location: /error/404
  → browser navigates to /error/404      ← exactly what your console shows
```

**Conclusion: the underlying error is a 404 — there is no tenant row with `is_golden_master = 1` on the production database.** The 409 is just the transport for the redirect. Every symptom you reported traces back to this single missing flag.

---

## 2. Why the server has no Golden Master, and why you cannot create one

Four call sites all resolve the demo store the same way, and three of them **hard-fail** instead of bootstrapping:

| File | Line | Behaviour when no golden master exists |
|---|---|---|
| `DemoController@login` | 41 | `firstOrFail()` → 404 → `/error/404` |
| `Admin/DemoStoreController@reset` | 94 | `firstOrFail()` → 404 → `/error/404` |
| `Admin/DemoStoreController@status` | 38 | `first()` → returns `exists: false` (correct) |
| `Console/FullDemoDeployCommand` | 27-50 | **Only place that can create one** |

### Problem 2a — the Reset button is a chicken-and-egg dead end

```php
// app/Http/Controllers/Admin/DemoStoreController.php:94
$demo = Tenant::where('is_golden_master', true)->firstOrFail();
Artisan::call('demo:reset');
```

`firstOrFail()` runs **before** the seeding call. So Reset can never create the store it needs — it 404s first. Same for `demo:reset` itself (`ResetDemoStore.php:20-25` bails with "No demo tenant found!").

### Problem 2b — the Deploy button depends on shell process spawning

`deploy()` does **not** use the queue. It shells out:

```php
// app/Http/Controllers/Admin/DemoStoreController.php:143-171
$finder  = new PhpExecutableFinder();       // ← run in __construct
$process = new Process([$this->phpBin, base_path('artisan'), 'demo:full-deploy', ...]);
$process->setTimeout(300);
$process->start(...);
register_shutdown_function(fn() => $process->wait());   // ← blocks the web worker
```

On a production host this fails for any of these reasons, and all of them fail **silently** (the log file just sits at `STARTED`):

1. `proc_open` / `proc_get_status` are in `disable_functions` on most shared hosting and many cPanel/Plesk setups. `Process::start()` throws immediately.
2. `PhpExecutableFinder` under PHP-FPM frequently resolves to `php-fpm` or the wrong PHP version, not the CLI binary.
3. `register_shutdown_function(... $process->wait())` holds the FPM worker open for up to 300s → 504 from nginx/Apache long before the seed finishes.
4. The seeded workload (`DemoSalesSeeder`, 5 years of transactions) will exceed `max_execution_time` / `memory_limit` in a web context regardless.

**This is the single reason "I cannot seed the demo store on the server."** It works locally because your Windows/XAMPP PHP has `proc_open` enabled and no strict limits.

### Problem 2c — `runTests()` will also never work on production

```php
$this->vendorBin = base_path('vendor/bin/pest');
$this->config    = base_path('Tester/phpunit.xml');
```

`pest` is a dev dependency. If production is deployed with `composer install --no-dev` (it should be), `vendor/bin/pest` does not exist, so the "Page Health" panel is dead on the server too.

---

## 3. Why the demo dies after every update

The updater has an auto-restore hook, and **the hook itself is broken in three ways**.

```php
// app/Http/Controllers/UpdaterController.php:747-755
$demoTenantExists = Tenant::where('is_golden_master', true)->exists();
if (!$demoTenantExists) {
    Artisan::call('demo:restore', ['--force' => true]);
}
```

### Problem 3a — the snapshot recreates the tenant with the flag OFF

`demo:restore` recreates a missing tenant straight from the snapshot payload:

```php
// app/Console/Commands/DemoRestore.php:63
$demoTenant = Tenant::create($tenantData);
```

I inspected `storage/demo-snapshots/golden_master.json`:

```
tenant slug: demo | is_golden_master: False
```

`is_golden_master` is in `$fillable`, so `Tenant::create()` writes it as **false**. Result:

- The restore "succeeds."
- `is_golden_master` is still 0 everywhere.
- The next update sees `exists() === false` again and creates **another** duplicate `demo` tenant (the `id` key is not fillable, so it gets a fresh auto-increment ID).
- Repeat per update → a pile of orphan demo tenants, still no golden master, `/demo` still 404s.

This is almost certainly why "it used to work, then updates killed it."

### Problem 3b — the snapshot does not contain the store

`DemoSnapshot::TABLES` / `DemoRestore::TABLES` list 18 tables. Actual row counts in your current snapshot:

```
settings            9     invoices            0
tenant_users        7     invoice_items       0
warehouses          1     payments            0
categories          8     suppliers           0
products           23     customers           0
parties           102     stock_takes         0
inventory_batches  23     stock_take_items    0
journal_entries  4174     stock_transfers     0
```

Cross-referenced against the real schema (`Schema::create` across `database/migrations/`), the snapshot **omits every table that holds the actual business data**:

`transactions`, `transaction_allocations`, `sales`, `sale_items`, `sale_item_batches`, `purchases`, `purchase_items`, `expenses`, `stocks`, `stock_movements`, `journal_items`, `payment_allocations`, `accounts`, `bank_accounts`, `product_barcodes`, `units`, `staff_attendances`, `recipes`, `proposals`.

Two of the listed tables (`party_transactions`, `stock_adjustments`) **do not exist in the schema at all** and are silently skipped.

Consequences:

- A restore produces a demo store with products and customers but **zero sales, zero purchases, zero stock**.
- Worse: it restores **4,174 `journal_entries` with none of their `journal_items`**. That is a structurally unbalanced double-entry ledger. Given the MySQL trigger noted in `CLAUDE.md` around `PaymentAllocation` → `JournalEntry`, this is a live data-integrity hazard, not just cosmetic.

### Problem 3c — the fallback path cannot survive a web request

If the snapshot file is absent on the server (`storage/` is normally excluded from update zips), `demo:restore` falls back to:

```php
// app/Console/Commands/DemoRestore.php:45
Artisan::call('demo:full-deploy');
```

That runs the full 5-year seed **synchronously inside the updater's HTTP request**. It will time out. And the updater wraps it in `try/catch` that only logs a warning — so the update reports **success** while the demo store is left broken.

---

## 4. Why a nightly reset will drift and eventually break

`demo:reset` → `demo:full-deploy` → full wipe + full 5-year reseed. Two issues for a nightly cadence:

### Problem 4a — the wipe list is incomplete

`FullDemoDeployCommand.php:145-165` wipes 26 tables. It **misses**:

`transactions`, `transaction_allocations`, `payment_allocations`, `stock_movements`, `sale_item_batches`, `product_batches`, `purchase_returns`, `debit_notes`, `debit_note_items`, `customer_analytics`, `daily_snapshots`, `staff_daily_summaries`.

Every nightly run therefore leaves orphan rows behind while re-inserting a fresh set. Over weeks the demo's dashboard totals, ledger balances and reports diverge from the seeded data — the store looks "broken" without any single failure.

It also tries to wipe four tables that **do not exist**: `sale_payments`, `purchase_payments`, `bank_transactions`, `recipe_products`. Harmless (caught + warned), but it means nobody has run this against the real schema recently.

### Problem 4b — the schedule only runs if a system cron exists

`routes/console.php:55` registers the nightly job correctly:

```php
Schedule::command('demo:reset', ['--force' => true])
    ->dailyAt('04:00')->withoutOverlapping()->onOneServer();
```

But Laravel's scheduler is inert without an OS-level cron calling `php artisan schedule:run` every minute. **I cannot verify from here whether that cron exists on venqore.com.** If it does not, nothing has ever reset nightly. `->onOneServer()` additionally requires a working cache lock store.

### Problem 4c — a full 5-year reseed is the wrong nightly workload

Wiping and regenerating five years of transactions every night is minutes of heavy DB writes. A nightly reset should restore a prebuilt snapshot (fast, deterministic), not re-run generative seeders (slow, and drifts because seeders use `now()`-relative dates).

---

## 5. Minor issues found along the way

- `DemoController@login:67-68` increments `demo_visit_today` but nothing ever resets it to 0 — the "today" metric only grows.
- `Tenant::booted()` (`app/Models/Tenant.php:52-70`) throws a `RuntimeException` if a second tenant is saved with `is_golden_master = true`. Correct guard, but combined with the duplicate-tenant bug in 3a it means that once duplicates exist, a later *correct* fix attempt will throw instead of self-healing. Duplicates must be cleaned before flipping the flag.
- `DemoSessionService::create()` clones the master per visitor via `TenantCloner`. `TenantCloner`'s table map references `invoices` / `invoice_items`, which are empty in this data model — so per-visitor sandboxes get an incomplete copy too.

---

## 6. What I need you to confirm on the server

I can only read the local repo. Before fixing, these need checking on venqore.com:

1. `SELECT id, slug, name, is_demo, is_golden_master FROM tenants WHERE is_demo = 1 OR slug LIKE 'demo%';` — how many demo tenants exist, and does any have the flag set?
2. `php -r "var_dump(function_exists('proc_open'));"` under the **web** SAPI, not CLI — confirms whether Deploy can ever work.
3. `crontab -l` — is `* * * * * php artisan schedule:run` present?
4. Does `storage/demo-snapshots/golden_master.json` exist on the server?
5. `php artisan queue:work` / Horizon — is a queue worker actually running? (`QUEUE_CONNECTION=database`)
6. `ls vendor/bin/pest` — dev deps present or not.

---

## 7. Proposed fix plan (for your approval — nothing done yet)

### Tier 1 — get the demo working today

1. **Make the golden master self-healing instead of `firstOrFail()`.** Introduce one resolver (e.g. `DemoStoreService::goldenMaster()`) that: finds `is_golden_master = 1`; else adopts the `slug = 'demo'` tenant and sets the flag; else creates it. Every call site (`DemoController@login`, `@reset`, `@status`, `demo:restore`, `demo:snapshot`) uses it. This alone stops the `/demo` 404.
2. **Reorder `DemoStoreController@reset`** so it can bootstrap rather than 404 first.
3. **One-off cleanup command** to delete duplicate orphan demo tenants and promote exactly one — needed before the `Tenant::booted()` guard will let anything save.

### Tier 2 — make seeding actually work on the server

4. **Replace the `Symfony\Process` spawn with a queued job.** `DeployDemoStoreJob` dispatched to the `database` queue, progress written to cache/DB, the existing terminal widget polls that instead of a log file. Removes the `proc_open` dependency, the FPM-blocking `register_shutdown_function`, and the 300s timeout in one move.
5. **Add a CLI escape hatch** (`php artisan demo:full-deploy`) documented for SSH, so the dashboard is never the only path.
6. **Gate or remove the "Page Health" panel** when `vendor/bin/pest` is absent, instead of spawning a process that cannot exist.

### Tier 3 — permanent + daily reset + update-proof

7. **Rewrite the snapshot/restore table list** to match the real schema — derive it from the `tenant_id`-bearing tables programmatically rather than hardcoding, so it can never drift again. Must include `transactions`, `transaction_allocations`, `journal_items`, `sales`, `sale_items`, `purchases`, `stocks`, `stock_movements`, `expenses`.
8. **Force `is_golden_master => true` on restore** regardless of what the snapshot payload says, and never let restore create a *second* demo tenant.
9. **Change the nightly job to `demo:restore` (snapshot replay), not `demo:full-deploy` (generative reseed).** Fast, deterministic, no drift. Keep `demo:full-deploy` as the weekly/manual "rebuild the snapshot" path, followed by `demo:snapshot`.
10. **Make the snapshot survive updates.** Either commit `storage/demo-snapshots/golden_master.json` to the repo/update zip, or have the updater regenerate it post-migrate. Right now `storage/` is excluded, which is why updates lose it.
11. **Fix the updater hook** to (a) run the restore on the queue, not inline, and (b) verify the restore actually produced a flagged tenant with non-zero sales, and surface a loud warning in the update report if not — rather than swallowing it in `try/catch`.
12. **Add a date-shifting step** so a snapshot restored months later still shows "recent" activity (`DemoDateHelper` already exists for this; `TenantCloner:72-101` has the shifting logic that could be reused).

---

## Summary in one paragraph

There is no caching bug. `POST /demo/login` throws a **404** because no row in `tenants` has `is_golden_master = 1` on production; your global Inertia error handler converts that into a `409 + X-Inertia-Location: /error/404`, which is the 409 you see. You cannot create that row from the dashboard because the only code path that can create it (`demo:full-deploy`) is reached by spawning a PHP CLI subprocess from a web request — which shared/managed hosting blocks — while the Reset button `firstOrFail()`s before it can bootstrap anything. Updates make it worse rather than better: the updater's auto-restore reads a snapshot whose tenant payload has `is_golden_master = false` and which contains none of the sales, purchase, stock or `journal_items` data, so each update quietly adds another unflagged duplicate demo tenant and a structurally unbalanced ledger. The nightly reset is registered correctly but re-runs the full 5-year generative seed against an incomplete wipe list, so even when it does run it drifts.
