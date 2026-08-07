# VenQore — CLASS D Route Fix Plan
# 50 routes called in frontend that do not exist in web.php
# Every item here needs a decision: add to routes, rename in frontend, or remove

---

## GROUP 1 — Auth routes that definitely exist but under different names
## These are standard Laravel auth routes — they exist in routes/auth.php not web.php
## The audit missed them because it only scanned web.php

Routes in this group (CLASS D but actually fine):
  login           → already exists as auth route
  logout          → already exists as auth route  
  register        → already exists as auth route
  password.email  → already exists as auth route
  password.request → already exists as auth route
  password.store  → already exists as auth route
  password.update → already exists as auth route
  password.confirm → already exists as auth route
  verification.send → already exists as auth route

ACTION: Run php artisan route:list | grep "login\|logout\|register\|password"
        Confirm they exist. If yes, these are CLASS A not CLASS D. No fix needed.

---

## GROUP 2 — Platform admin routes that need to be added to web.php
## These are YOUR admin panel routes for managing the platform
## They should exist under the VenQore (platform) prefix in web.php

Missing platform routes:
  admin.data.process-import
  admin.data.validate-import
  admin.migration.analyze
  admin.migration.execute
  admin.platform.change-password
  admin.platform.clear-passcode
  admin.platform.set-passcode
  admin.store.feature-flag
  admin.store.purge
  admin.store.restore
  admin.stores
  admin.user.purge
  admin.user.restore
  platform.login.pin
  platform.login.store
  backups.delete
  backups.download
  backups.email
  backups.store

ADD THESE to routes/web.php inside the SuperAdmin (VenQore prefix) group:

Route::middleware([\App\Http\Middleware\SuperAdminMiddleware::class])
    ->prefix('VenQore')
    ->name('admin.')
    ->group(function () {

        // These already exist — keep them
        // Route::get('/dashboard', ...)->name('dashboard');
        // Route::get('/stores', ...)->name('stores');

        // ADD THESE:
        Route::get('/stores', [AdminController::class, 'stores'])->name('stores');
        Route::post('/stores/{tenant}/feature-flag', [AdminController::class, 'featureFlag'])->name('store.feature-flag');
        Route::post('/stores/{tenant}/purge', [AdminController::class, 'purgeStore'])->name('store.purge');
        Route::post('/stores/{tenant}/restore', [AdminController::class, 'restoreStore'])->name('store.restore');
        Route::post('/users/{user}/purge', [AdminController::class, 'purgeUser'])->name('user.purge');
        Route::post('/users/{user}/restore', [AdminController::class, 'restoreUser'])->name('user.restore');

        Route::prefix('data')->name('data.')->group(function () {
            Route::post('/process-import', [AdminDataController::class, 'processImport'])->name('process-import');
            Route::post('/validate-import', [AdminDataController::class, 'validateImport'])->name('validate-import');
        });

        Route::prefix('migration')->name('migration.')->group(function () {
            Route::post('/analyze', [AdminMigrationController::class, 'analyze'])->name('analyze');
            Route::post('/execute', [AdminMigrationController::class, 'execute'])->name('execute');
        });

        Route::prefix('platform')->name('platform.')->group(function () {
            Route::post('/change-password', [AdminPlatformController::class, 'changePassword'])->name('change-password');
            Route::post('/clear-passcode', [AdminPlatformController::class, 'clearPasscode'])->name('clear-passcode');
            Route::post('/set-passcode', [AdminPlatformController::class, 'setPasscode'])->name('set-passcode');
        });

        Route::prefix('backups')->name('backups.')->group(function () {
            Route::delete('/{backup}', [BackupController::class, 'destroy'])->name('delete');
            Route::get('/{backup}/download', [BackupController::class, 'download'])->name('download');
            Route::post('/{backup}/email', [BackupController::class, 'email'])->name('email');
            Route::post('/', [BackupController::class, 'store'])->name('store');
        });
    });

// Platform login (separate from store login)
Route::middleware('guest')->group(function () {
    Route::get('/VenQore-login', [PlatformLoginController::class, 'create'])->name('platform.login.store');
    Route::post('/VenQore-login/pin', [PlatformLoginController::class, 'pin'])->name('platform.login.pin');
});

---

## GROUP 3 — Store routes that are missing from the store group in web.php
## These need to be ADDED inside the Zone 3 (store) middleware group

ADD THESE inside the store middleware group:
Route::middleware(['auth', 'verified', 'tenant'])
    ->prefix('s/{store_slug}')
    ->name('store.')
    ->group(function () {

        // ── Finance (currently missing) ──────────────────────────────
        Route::prefix('finance')->name('finance.')->group(function () {
            Route::get('/accounts', [FinanceController::class, 'accounts'])->name('accounts');
            Route::get('/journal', [FinanceController::class, 'journal'])->name('journal');
        });

        // ── Payments (currently missing create routes) ───────────────
        Route::get('/payments/in/create', [PaymentController::class, 'createIn'])->name('payment-in.create');
        Route::get('/payments/out/create', [PaymentController::class, 'createOut'])->name('payment-out.create');

        // ── Pre-Sales print (currently missing) ──────────────────────
        Route::get('/pre-sales/{preSale}/print', [PreSaleController::class, 'print'])->name('pre-sales.print');

        // ── Debit Notes (missing print and update) ───────────────────
        Route::get('/debit-notes/{debitNote}/print', [DebitNoteController::class, 'print'])->name('debit-notes.print');
        Route::put('/debit-notes/{debitNote}', [DebitNoteController::class, 'update'])->name('debit-notes.update');

        // ── Purchases print (missing) ─────────────────────────────────
        Route::get('/purchases/{purchase}/print', [PurchaseController::class, 'print'])->name('purchases.print');

        // ── Sales (missing routes) ────────────────────────────────────
        Route::get('/sales/create', [SaleController::class, 'create'])->name('sales.create');
        Route::get('/sales/presale/create', [SaleController::class, 'presaleCreate'])->name('sales.presale.create');

        // ── Production edit (missing) ─────────────────────────────────
        Route::get('/production/{production}/edit', [ProductionController::class, 'edit'])->name('production.edit');

        // ── Products index alias (missing) ────────────────────────────
        // store.products.index is used but store.inventory.index is the real route
        // Fix in frontend: change store.products.index → store.inventory.index
        // OR add an alias route:
        Route::get('/products', function() {
            return redirect()->route('store.inventory.index', ['store_slug' => request()->route('store_slug')]);
        })->name('products.index');

        // ── Reports missing variants ──────────────────────────────────
        Route::get('/reports/discount-report', [ReportController::class, 'discountReport'])->name('reports.discount-report');
        Route::get('/reports/inventory-valuation', [ReportController::class, 'inventoryValuation'])->name('reports.inventory-valuation');

        // ── Recycle bin (missing) ─────────────────────────────────────
        Route::prefix('recycle-bin')->name('recycle-bin.')->group(function () {
            Route::delete('/{id}/force', [RecycleBinController::class, 'forceDelete'])->name('force-delete');
            Route::post('/{id}/restore', [RecycleBinController::class, 'restore'])->name('restore');
        });
    });

---

## GROUP 4 — Routes that need frontend fix not backend fix

These routes are called in the frontend but the correct route already exists
under a different name. Fix the frontend call, do not add a duplicate route.

| Called in frontend | Correct route to use | Files to fix |
|---|---|---|
| store.products.index | store.inventory.index | StockOperations.jsx and others |
| sales.presale.show | store.pre-sales.show | PreSales/BestPreSales.jsx |
| setup.index | store.setup | Setup pages |
| auth.google | (remove or add Google OAuth) | Login page |

For each of these, give your IDE:

In StockOperations.jsx and any file calling route('store.products.index'):
  Change to: route('store.inventory.index', { store_slug: store.slug })

In PreSales/BestPreSales.jsx calling route('sales.presale.show'):
  Change to: route('store.pre-sales.show', { store_slug: store.slug, id: X })

For auth.google — only add if you actually have Google OAuth configured.
If not, remove the button from the login page that references it.

---

## EXACT PROMPT FOR YOUR IDE

Give your IDE this prompt now:

"""
I have a definitive list of routes that need to be fixed. 
Do exactly what is described below. Do not deviate.

PART 1 — Add missing routes to routes/web.php

Find the store middleware group in routes/web.php:
Route::middleware(['auth', 'verified', 'tenant'])
    ->prefix('s/{store_slug}')
    ->name('store.')

Inside that group, add these routes IF they do not already exist:

Route::prefix('finance')->name('finance.')->group(function () {
    Route::get('/accounts', [FinanceController::class, 'accounts'])->name('accounts');
    Route::get('/journal', [FinanceController::class, 'journal'])->name('journal');
});
Route::get('/payments/in/create', [PaymentController::class, 'createIn'])->name('payment-in.create');
Route::get('/payments/out/create', [PaymentController::class, 'createOut'])->name('payment-out.create');
Route::get('/pre-sales/{id}/print', [PreSaleController::class, 'print'])->name('pre-sales.print');
Route::get('/debit-notes/{id}/print', [DebitNoteController::class, 'print'])->name('debit-notes.print');
Route::put('/debit-notes/{id}', [DebitNoteController::class, 'update'])->name('debit-notes.update');
Route::get('/purchases/{id}/print', [PurchaseController::class, 'print'])->name('purchases.print');
Route::get('/sales/create', [SaleController::class, 'create'])->name('sales.create');
Route::get('/sales/presale/create', [SaleController::class, 'presaleCreate'])->name('sales.presale.create');
Route::get('/production/{id}/edit', [ProductionController::class, 'edit'])->name('production.edit');
Route::get('/reports/discount-report', [ReportController::class, 'discountReport'])->name('reports.discount-report');
Route::get('/reports/inventory-valuation', [ReportController::class, 'inventoryValuation'])->name('reports.inventory-valuation');

For the controller references above: check if those controller methods already 
exist in the codebase. If a controller method exists, use the existing one.
If it does not exist, create a simple stub:
  public function print($id) { /* TODO */ abort(501, 'Not implemented'); }

PART 2 — Fix frontend calls that use wrong route names

File: resources/js/Pages/StockOperations.jsx (and any file with store.products.index)
  Change: route('store.products.index', ...)
  To:     route('store.inventory.index', { store_slug: store.slug })

Run: grep -rn "store.products.index" resources/js/ --include="*.jsx"
Fix every file found.

File: resources/js/Pages/PreSales/BestPreSales.jsx
  Change: route('sales.presale.show', ...)
  To:     route('store.pre-sales.show', { store_slug: store.slug, ... })

PART 3 — Run these commands after all changes:

php artisan ziggy:generate
npm run dev

Report back:
- Confirm each route was added to web.php
- Confirm each frontend file was updated
- Any controller methods that did not exist and were stubbed
- Result of npm run dev (any remaining errors)
"""
