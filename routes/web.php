<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\ProductAttributeController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\FundController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Inertia\Inertia;

// ═══════════════════════════════════════════════════════════════════════
// DEFINITIVE PLAN ROUTES — VenQore SaaS Multi-Store Architecture
// ═══════════════════════════════════════════════════════════════════════

// ── Public Marketing Pages ──────────────────────────────────────────────
Route::get('/features', fn() => Inertia::render('Marketing/Features'))->name('marketing.features');
Route::get('/pricing',  fn() => Inertia::render('Marketing/Pricing'))->name('marketing.pricing');
Route::get('/about',    fn() => Inertia::render('Marketing/About'))->name('marketing.about');
Route::get('/contact',  fn() => Inertia::render('Marketing/Contact'))->name('marketing.contact');
Route::post('/contact', [\App\Http\Controllers\Marketing\ContactController::class, 'store'])->name('marketing.contact.submit');

// Public static WordPress plugin download route (compiles on-the-fly)
Route::get('/downloads/venqore-sync.zip', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'downloadStaticPlugin']);
Route::get('/api/woo/plugin/check-update', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'checkPluginUpdate']);



// Blog Routes
Route::get('/blog',              [\App\Http\Controllers\Marketing\BlogController::class, 'index'])->name('blog.index');
Route::get('/blog/{slug}',       [\App\Http\Controllers\Marketing\BlogController::class, 'show'])->name('blog.show');

Route::get('/terms',   fn() => Inertia::render('Legal/Terms'))->name('terms');
Route::get('/privacy', fn() => Inertia::render('Legal/Privacy'))->name('privacy');
Route::post('/webhooks/lemon-squeezy', [\App\Http\Controllers\LemonSqueezyWebhookController::class, 'handle'])
    ->name('webhooks.lemon-squeezy');

// ── Demo Sandbox Routes ───────────────────────────────────────────────
Route::get('/demo', [\App\Http\Controllers\DemoController::class, 'landing'])->name('demo.landing');
Route::post('/demo/login', [\App\Http\Controllers\DemoController::class, 'login'])->name('demo.login');
Route::post('/demo/logout', [\App\Http\Controllers\DemoController::class, 'logout'])->name('demo.logout');


// ── VenSynQ Universal OAuth Callbacks ────────────────────────────────────────
// These fixed URLs are registered in Amazon / TikTok / eBay developer portals.
// They capture the auth code and session state, then redirect to the correct
// tenant store's callback handler automatically.
//
//   Amazon:  https://venqore.com/amazon/callback
//   TikTok:  https://venqore.com/tiktok/callback
//   eBay:    https://venqore.com/ebay/callback
//
Route::get('/amazon/callback', [\App\Http\Controllers\VenSynQController::class, 'universalCallback'])
    ->name('vensynq.universal.callback.amazon')
    ->defaults('platform', 'amazon');

Route::get('/tiktok/callback', [\App\Http\Controllers\VenSynQController::class, 'universalCallback'])
    ->name('vensynq.universal.callback.tiktok')
    ->defaults('platform', 'tiktok');

Route::get('/ebay/callback', [\App\Http\Controllers\VenSynQController::class, 'universalCallback'])
    ->name('vensynq.universal.callback.ebay')
    ->defaults('platform', 'ebay');

// ── Auth (no store context) ──────────────────────────────────────────────
Route::middleware(['auth', 'verified'])->group(function () {
    // Store hub (shown to users with 2+ stores)
    Route::get('/hub', [\App\Http\Controllers\HubController::class, 'index'])->name('hub');
    Route::get('/api/my-stores', [\App\Http\Controllers\HubController::class, 'apiList'])->name('my-stores.api');

    // Create / Join store
    Route::get('/start',     [\App\Http\Controllers\StoreController::class, 'createOrJoin'])->name('store.create-or-join');
    Route::get('/new-store', [\App\Http\Controllers\StoreController::class, 'create'])->name('store.create');
    Route::post('/new-store',[\App\Http\Controllers\StoreController::class, 'store'])->name('store.store');

    // Join by store code
    Route::get('/join',  [\App\Http\Controllers\StaffController::class, 'joinForm'])->name('store.join');
    Route::post('/join', [\App\Http\Controllers\StaffController::class, 'joinWithCode'])->name('store.join.submit');

    // ── V1 Staff Invite: Magic Link (Path A) ─────────────────
    Route::get('/invite/accept',          [\App\Http\Controllers\StaffInvitationController::class, 'acceptByToken'])->name('invite.accept');
    Route::post('/invite/accept',         [\App\Http\Controllers\StaffInvitationController::class, 'accept'])->name('invite.submit');
    Route::post('/invite/decline',        [\App\Http\Controllers\StaffInvitationController::class, 'declineByToken'])->name('invite.decline');

    // ── V1 Staff Invite: Code Validation (Path B — Hub) ───────────
    Route::post('/invite/validate-code',  [\App\Http\Controllers\StaffInvitationController::class, 'validateCode'])->name('invite.validate-code');

    // Global account settings (not store-specific)
    Route::get('/account',   [ProfileController::class, 'edit'])->name('account.edit');
    Route::patch('/account', [ProfileController::class, 'update'])->name('account.update');
});

// ── Store Context Routes ─────────────────────────────────────────────────
// All routes under /s/{store_slug}/ require auth + valid store membership
Route::middleware(['auth', 'verified', 'tenant', \App\Http\Middleware\DemoMiddleware::class])
    ->prefix('s/{store_slug}')
    ->name('store.')
    ->group(function () {
        Route::get('/', fn($store_slug) => \redirect()->route('store.pos', ['store_slug' => $store_slug]));

        // Setup wizard (no plan gate — always accessible)
        Route::get('/setup',  [\App\Http\Controllers\SetupController::class, 'index'])->name('setup');
        Route::post('/setup', [\App\Http\Controllers\SetupController::class, 'complete'])->name('setup.complete');

        // POS (on-demand API, no full catalog pre-load)
        Route::get('/pos',                     [\App\Http\Controllers\PosController::class, 'index'])->name('pos');
        // GAP 1 FIX: Dead route removed. POS sales go through V3/SaleController via Route::post('sales', ...) at line ~1165.
        // Route::post('/pos/sale', ...) was wired to PosController::completeSale() which does not exist.
        Route::get('/pos/products',            [\App\Http\Controllers\Api\PosSearchController::class, 'search'])->name('pos.search');
        Route::get('/pos/products/featured',   [\App\Http\Controllers\Api\PosSearchController::class, 'featured'])->name('pos.featured');
        Route::get('/pos/categories',          [\App\Http\Controllers\Api\PosSearchController::class, 'categories'])->name('pos.categories');
        Route::get('/pos/barcode/{code}',      [\App\Http\Controllers\Api\PosSearchController::class, 'findByBarcode'])->name('pos.barcode');
        Route::post('/pos/open-session',       [\App\Http\Controllers\PosController::class, 'openSession'])->name('pos.open');
        Route::post('/pos/close-session',      [\App\Http\Controllers\PosController::class, 'closeSession'])->name('pos.close');

        // Staff management (within this store)
        Route::get('/staff',              [\App\Http\Controllers\StaffController::class, 'index'])->name('staff');
        Route::post('/staff/invite',      [\App\Http\Controllers\StaffController::class, 'invite'])->name('staff.invite');
        Route::patch('/staff/{member}',   [\App\Http\Controllers\StaffController::class, 'update'])->name('staff.update');
        Route::delete('/staff/{member}',  [\App\Http\Controllers\StaffController::class, 'remove'])->name('staff.remove');

        // Store billing
        Route::get('/billing',         [\App\Http\Controllers\BillingController::class, 'index'])->name('billing');
        Route::get('/billing/upgrade', [\App\Http\Controllers\BillingController::class, 'upgrade'])->name('billing.upgrade');
        Route::get('/billing/portal',  [\App\Http\Controllers\BillingController::class, 'portal'])->name('billing.portal');

        // Store settings
        Route::get('/settings',                    [\App\Http\Controllers\SettingsController::class, 'index'])->name('settings');
        Route::post('/settings',                   [\App\Http\Controllers\SettingsController::class, 'update'])->name('settings.update');

        // Trial expired landing (within store context)
        Route::get('/trial-expired', fn() => Inertia::render('Errors/TrialExpired'))->name('trial.expired');

        // ── Plan Change Notifications ────────────────────────────────────
        Route::group(['prefix' => 'notifications/plan', 'as' => 'notifications.plan.'], function () {
            Route::get('/unread',         [\App\Http\Controllers\PlanNotificationController::class, 'unread'])->name('unread');
            Route::post('/mark-all-read', [\App\Http\Controllers\PlanNotificationController::class, 'markAllRead'])->name('markAllRead');
            Route::post('/{id}/read',     [\App\Http\Controllers\PlanNotificationController::class, 'markRead'])->name('read');
        });

        // ── Store Admin Panel (Restored Legacy Experience) ──────────────────
        Route::group(['prefix' => 'admin', 'as' => 'admin.'], function () {
            Route::get('/',            [\App\Http\Controllers\AdminController::class, 'index'])->name('home');
            Route::get('/dashboard',   [\App\Http\Controllers\AdminController::class, 'dashboard'])->name('dashboard');
            Route::get('/settings',    [\App\Http\Controllers\AdminController::class, 'settings'])->name('settings');
            Route::post('/settings',   [\App\Http\Controllers\AdminController::class, 'updateSettings'])->name('settings.update');
            Route::get('/users',       function ($store_slug) { return redirect()->route('store.admin.attendance', ['store_slug' => $store_slug]); })->name('users');
            Route::post('/users',      [\App\Http\Controllers\AdminController::class, 'storeUser'])->name('users.store');
            Route::get('/staff',       function ($store_slug) { return redirect()->route('store.admin.attendance', ['store_slug' => $store_slug]); })->name('staff');

            // ── V1 Staff Invitation System ─────────────────────────────────
            Route::post('/invitations',                        [\App\Http\Controllers\StaffInvitationController::class, 'store'])->name('invitations.store');
            Route::post('/invitations/{invitation}/approve',   [\App\Http\Controllers\StaffInvitationController::class, 'approve'])->name('invitations.approve');
            Route::post('/invitations/{invitation}/decline',   [\App\Http\Controllers\StaffInvitationController::class, 'decline'])->name('invitations.decline');
            Route::post('/invitations/{invitation}/revoke',    [\App\Http\Controllers\StaffInvitationController::class, 'revoke'])->name('invitations.revoke');
            Route::post('/invitations/{invitation}/resend',    [\App\Http\Controllers\StaffInvitationController::class, 'resend'])->name('invitations.resend');
            Route::get('/attendance',  [\App\Http\Controllers\Admin\StoreAdminController::class, 'attendance'])->name('attendance');
            
            Route::get('/logs',        [\App\Http\Controllers\AdminController::class, 'logs'])->name('logs');

            // Data & Disaster Recovery
            Route::get('/data-management', [\App\Http\Controllers\DataManagementController::class, 'index'])->name('data');
            Route::post('/data/export',    [\App\Http\Controllers\DataManagementController::class, 'export'])->name('data.export');
            Route::post('/data/import',    [\App\Http\Controllers\DataManagementController::class, 'import'])->name('data.import');
            
            // OVERRIDE: Removed. Raw SQL Backup/Restore strictly locked to Platform Admin.
            // Route::get('/backups',             [\App\Http\Controllers\BackupController::class, 'index'])->name('backups');
            // Route::post('/backups',            [\App\Http\Controllers\BackupController::class, 'store'])->name('backups.store');
            // Route::get('/backups/download/{filename}', [\App\Http\Controllers\BackupController::class, 'download'])->name('backups.download');
            // Route::delete('/backups/{filename}', [\App\Http\Controllers\BackupController::class, 'delete'])->name('backups.delete');
            // Route::post('/backups/email/{filename}', [\App\Http\Controllers\BackupController::class, 'email'])->name('backups.email');
            // Route::post('/backups/restore',    [\App\Http\Controllers\BackupController::class, 'restore'])->name('backups.restore');

            // Recycle Bin
            Route::get('/recycle-bin',         [\App\Http\Controllers\RecycleBinController::class, 'index'])->name('recycle-bin.index');
            Route::post('/recycle-bin/{id}/restore', [\App\Http\Controllers\RecycleBinController::class, 'restore'])->name('recycle-bin.restore');
            Route::delete('/recycle-bin/{id}/force-delete', [\App\Http\Controllers\RecycleBinController::class, 'forceDelete'])->name('recycle-bin.force-delete');
        });
    });

// ── Platform Owner ───────────────────────────────────────────────────────────
Route::middleware([\App\Http\Middleware\SuperAdminMiddleware::class])
    ->prefix('VenQore')
    ->name('platform.')
    ->group(function () {
        Route::get('/',                   [\App\Http\Controllers\Admin\SuperAdminController::class, 'dashboard'])->name('dashboard');

        Route::get('/run-migrations', function () {
            \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
            return 'Migrations ran successfully! Output: ' . nl2br(e(\Illuminate\Support\Facades\Artisan::output()));
        });

        Route::get('/stores',             [\App\Http\Controllers\Admin\SuperAdminController::class, 'stores'])->name('stores');
        Route::get('/users',              [\App\Http\Controllers\Admin\SuperAdminController::class, 'users'])->name('users');
        Route::post('/stores/{tenant}/suspend',      [\App\Http\Controllers\Admin\SuperAdminController::class, 'suspend'])->name('store.suspend');
        Route::post('/stores/{tenant}/activate',     [\App\Http\Controllers\Admin\SuperAdminController::class, 'activate'])->name('store.activate');
        Route::post('/stores/{tenant}/extend-trial', [\App\Http\Controllers\Admin\SuperAdminController::class, 'extendTrial'])->name('store.extend-trial');
        
        // Trash Management
        Route::delete('/stores/{tenant}/destroy',    [\App\Http\Controllers\Admin\SuperAdminController::class, 'destroyStore'])->name('store.destroy');
        Route::post('/stores/bulk-destroy',          [\App\Http\Controllers\Admin\SuperAdminController::class, 'bulkDestroyStores'])->name('stores.bulk-destroy');
        Route::post('/stores/{id}/restore',          [\App\Http\Controllers\Admin\SuperAdminController::class, 'restoreStore'])->name('store.restore');
        Route::delete('/stores/{id}/purge',          [\App\Http\Controllers\Admin\SuperAdminController::class, 'purgeStore'])->name('store.purge');
        
        Route::delete('/users/{user}/destroy',       [\App\Http\Controllers\Admin\SuperAdminController::class, 'destroyUser'])->name('user.destroy');
        Route::post('/users/bulk-destroy',           [\App\Http\Controllers\Admin\SuperAdminController::class, 'bulkDestroyUsers'])->name('users.bulk-destroy');
        Route::post('/users/{id}/restore',           [\App\Http\Controllers\Admin\SuperAdminController::class, 'restoreUser'])->name('user.restore');
        Route::delete('/users/{id}/purge',           [\App\Http\Controllers\Admin\SuperAdminController::class, 'purgeUser'])->name('user.purge');

        Route::get('/appsumo',            [\App\Http\Controllers\Admin\SuperAdminController::class, 'appsumoCodes'])->name('appsumo.index');
        Route::post('/appsumo/generate',  [\App\Http\Controllers\Admin\SuperAdminController::class, 'generateAppSumoCodes'])->name('appsumo.generate');
        Route::post('/appsumo/import',    [\App\Http\Controllers\Admin\SuperAdminController::class, 'importAppSumoCodes'])->name('appsumo.import');
        Route::get('/appsumo/export',     [\App\Http\Controllers\Admin\SuperAdminController::class, 'exportAppSumoCodes'])->name('appsumo.export');
        Route::delete('/appsumo/purge',   [\App\Http\Controllers\Admin\SuperAdminController::class, 'purgeAppSumoCodes'])->name('appsumo.purge');

        // ── V1 Support Inbox ──────────────────────────────────────────────
        Route::get('/tickets',                              [\App\Http\Controllers\Admin\SupportController::class, 'tickets'])->name('tickets');
        Route::get('/tickets/{ticket}',                     [\App\Http\Controllers\Admin\SupportController::class, 'showTicket'])->name('ticket.show');
        Route::post('/tickets/{ticket}/reply',              [\App\Http\Controllers\Admin\SupportController::class, 'reply'])->name('ticket.reply');
        Route::post('/tickets/{ticket}/status',             [\App\Http\Controllers\Admin\SupportController::class, 'updateTicketStatus'])->name('ticket.status');

        // ── Webhook Logs ──────────────────────────────────────────────────
        Route::get('/webhooks',                             [\App\Http\Controllers\Admin\SupportController::class, 'webhooks'])->name('webhooks');

        // ── Feature Flags (per-store overrides) ───────────────────────────
        Route::post('/stores/{tenant}/feature-flag',        [\App\Http\Controllers\Admin\SupportController::class, 'toggleFeatureFlag'])->name('store.feature-flag');

        // ── System Health & Monitoring ────────────────────────────────────
        Route::get('/health/errors',                         [\App\Http\Controllers\Admin\SuperAdminController::class, 'errorLogs'])->name('health.errors');
        Route::post('/health/errors/resolve-all',            [\App\Http\Controllers\Admin\SuperAdminController::class, 'resolveAllErrors'])->name('health.errors.resolve-all');
        Route::post('/health/errors/detect-fixes',           [\App\Http\Controllers\Admin\SuperAdminController::class, 'detectFixes'])->name('health.errors.detect-fixes');
        Route::post('/health/errors/{error}/resolve',        [\App\Http\Controllers\Admin\SuperAdminController::class, 'resolveError'])->name('health.errors.resolve');
        Route::get('/health/contacts',                       [\App\Http\Controllers\Admin\SuperAdminController::class, 'contactSubmissions'])->name('health.contacts');
        Route::post('/health/contacts/{contact}/read',       [\App\Http\Controllers\Admin\SuperAdminController::class, 'readContact'])->name('health.contacts.read');


        // ── Impersonation ─────────────────────────────────────────────────
        Route::post('/impersonate/{user}',                  [\App\Http\Controllers\Admin\ImpersonationController::class, 'start'])->name('impersonate.start');
        Route::post('/impersonate/end',                     [\App\Http\Controllers\Admin\ImpersonationController::class, 'end'])->name('impersonate.end');

        // ── Platform Owner Security & Profile ─────────────────────────────
        Route::post('/security/set-passcode',   [\App\Http\Controllers\Auth\PlatformOwnerAuthController::class, 'setPasscode'])->name('set-passcode');
        Route::post('/security/clear-passcode', [\App\Http\Controllers\Auth\PlatformOwnerAuthController::class, 'clearPasscode'])->name('clear-passcode');
        Route::post('/security/change-password',[\App\Http\Controllers\Auth\PlatformOwnerAuthController::class, 'changePassword'])->name('change-password');

        // ── Monetization — Plans & Platforms ──────────────────────────────
        Route::prefix('plans')->name('plans.')->group(function () {
            Route::get('/',                  [\App\Http\Controllers\SuperAdmin\PlanController::class, 'index'])->name('index');
            Route::post('/',                 [\App\Http\Controllers\SuperAdmin\PlanController::class, 'store'])->name('store');
            Route::put('/{plan}',            [\App\Http\Controllers\SuperAdmin\PlanController::class, 'update'])->name('update');
            Route::post('/{plan}/duplicate', [\App\Http\Controllers\SuperAdmin\PlanController::class, 'duplicate'])->name('duplicate');
            Route::delete('/{plan}',         [\App\Http\Controllers\SuperAdmin\PlanController::class, 'destroy'])->name('destroy');
        });

        Route::prefix('platforms')->name('platforms.')->group(function () {
            Route::get('/',           [\App\Http\Controllers\SuperAdmin\PlatformController::class, 'index'])->name('index');
            Route::post('/',          [\App\Http\Controllers\SuperAdmin\PlatformController::class, 'store'])->name('store');
            Route::put('/{platform}', [\App\Http\Controllers\SuperAdmin\PlatformController::class, 'update'])->name('update');
        });

        Route::prefix('coupons')->name('coupons.')->group(function () {
            Route::get('/',         [\App\Http\Controllers\SuperAdmin\CouponController::class, 'index'])->name('index');
            Route::post('/',        [\App\Http\Controllers\SuperAdmin\CouponController::class, 'store'])->name('store');
            Route::put('/{coupon}', [\App\Http\Controllers\SuperAdmin\CouponController::class, 'update'])->name('update');
        });

        // ── Monetization — Tenant Overrides ───────────────────────────────
        Route::prefix('tenant-overrides')->name('tenants.')->group(function () {
            Route::get('/',              [\App\Http\Controllers\SuperAdmin\TenantOverrideController::class, 'index'])->name('overrides');
            Route::get('/{tenant}',      [\App\Http\Controllers\SuperAdmin\TenantOverrideController::class, 'show'])->name('overrides.show');
            Route::patch('/{tenant}',    [\App\Http\Controllers\SuperAdmin\TenantOverrideController::class, 'updateTenant'])->name('overrides.update');
            Route::post('/{tenant}',     [\App\Http\Controllers\SuperAdmin\TenantOverrideController::class, 'apply'])->name('overrides.apply');
            Route::delete('/{tenant}/{override}', [\App\Http\Controllers\SuperAdmin\TenantOverrideController::class, 'remove'])->name('overrides.remove');
        });

        // Added Category D Platform Admin Routes
        Route::post('/admin/migration/analyze', fn() => \abort(501, 'Not yet implemented'))->name('admin.migration.analyze');

        // ── DEBUG & REPAIR ROUTES (Secured) ───────────────────────────────────
        Route::get('/debug-pos', function () {
            $output = [
                'cash_accounts' => \App\Models\BankAccount::where('account_type', 'cash')->get(),
                'all_bank_accounts' => \App\Models\BankAccount::get(),
                'recent_payments' => \App\Models\Payment::latest()->take(5)->get(),
                'recent_purchases' => \App\Models\Invoice::where('type','purchase')->latest()->take(2)->get(),
                'payments_stats' => [ // checking stats
                    'today_in' => \App\Models\Payment::where('type', 'in')->where('date', \Carbon\Carbon::today()->toDateString())->sum('amount'),
                    'today_out' => \App\Models\Payment::where('type', 'out')->where('date', \Carbon\Carbon::today()->toDateString())->sum('amount'),
                    'month_in' => \App\Models\Payment::where('type', 'in')->whereMonth('date', \Carbon\Carbon::today()->month)->sum('amount'),
                    'month_out' => \App\Models\Payment::where('type', 'out')->whereMonth('date', \Carbon\Carbon::today()->month)->sum('amount'),
                ]
            ];
            return \response()->json($output);
        });

        Route::get('/fix-payments-db', function () {
            \App\Models\Payment::where('type', 'received')->update(['type' => 'in']);
            \App\Models\Payment::where('type', 'sent')->update(['type' => 'out']);
            
            // Also fix any null dates to created_at
            $payments = \App\Models\Payment::whereNull('date')->get();
            foreach($payments as $p) {
                /** @var \App\Models\Payment $p */
                $p->date = $p->created_at->toDateString();
                $p->save();
            }
            return "OK";
        });

        Route::get('/repair-inventory-value', function () {
            $products = \App\Models\Product::all();
            $fixedC = 0;
            foreach ($products as $product) {
                // The TRUE stock quantity is already correct in the stocks table.
                $actualStock = (float) \App\Models\Stock::where('product_id', $product->id)->sum('quantity');
                
                // ─── DO FULL FIFO BATCH REPAIR HERE ────────────────────────────────
                // Distribute actual stock across the product's individual inventory_batches in FIFO order.
                $batches = \Illuminate\Support\Facades\DB::table('inventory_batches')
                    ->where('product_id', $product->id)
                    ->whereNull('deleted_at')
                    ->orderBy('created_at', 'desc') // NEWEST first, because leftover stock is the most recent purchases!
                    ->get();
                
                $poolRemaining = $actualStock;
                
                foreach ($batches as $batch) {
                    $originalQty = (float) $batch->original_qty;
                    $assignQty   = min($originalQty, max(0, $poolRemaining));
                    
                    if (abs((float)$batch->remaining_qty - $assignQty) > 0.0001) {
                        \Illuminate\Support\Facades\DB::table('inventory_batches')
                            ->where('id', $batch->id)
                            ->update([
                                'remaining_qty' => $assignQty,
                                'updated_at'    => Carbon::now(),
                            ]);
                    }
                    $poolRemaining -= $assignQty;
                }
                
                // If there's STILL stock remaining but no batches to hold it, we must create a catch-all batch
                if ($poolRemaining > 0.0001) {
                    \Illuminate\Support\Facades\DB::table('inventory_batches')->insert([
                        'id'            => (string) \Illuminate\Support\Str::orderedUuid(),
                        'product_id'    => $product->id,
                        'warehouse_id'  => \App\Models\Warehouse::first()?->id ?? 1,
                        'original_qty'  => $poolRemaining,
                        'remaining_qty' => $poolRemaining,
                        'unit_cost'     => $product->cost_price ?? 0,
                        'notes'         => 'Auto-healer fallback batch',
                        'created_at'    => Carbon::now(),
                        'updated_at'    => Carbon::now(),
                    ]);
                }
                $fixedC++;
            }
            
            // Calculate new total value to display it immediately
            $totalValue = \Illuminate\Support\Facades\DB::table('inventory_batches')
                ->whereNull('deleted_at')
                ->sum(\Illuminate\Support\Facades\DB::raw('remaining_qty * unit_cost'));
                
            return \response()->json([
                'message' => "Successfully rebuilt FIFO batches for {$fixedC} products.",
                'new_inventory_valuation' => number_format($totalValue, 2)
            ]);
        });
        
        Route::get('/run-migrations', function () {
            \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
            return 'Migrations ran successfully! Output: ' . nl2br(e(\Illuminate\Support\Facades\Artisan::output()));
        });
    });

Route::get('/', function () {
    // 1. Check Database Connection First
    try {
        \Illuminate\Support\Facades\DB::connection()->getPdo();
    } catch (\Exception $e) {
        // If DB fails, redirect to installer (which allows setting it up)
        return \redirect()->route('installer.index');
    }

    // 2. Check if Installed (Table exists)
    if (!file_exists(storage_path('installed')) || !\Illuminate\Support\Facades\Schema::hasTable('settings')) {
        return \redirect()->route('installer.index');
    }

    // 3. Auto-logout demo users when they navigate back to the main site.
    // Demo accounts use the pattern demo-{role}@venqore-demo.internal.
    // Rather than bouncing them to /hub (which is confusing), we cleanly
    // end their session so they land on the marketing page as a visitor.
    if (Auth::check()) {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if (str_ends_with($user->email, '@venqore-demo.internal')) {
            \Illuminate\Support\Facades\Cache::decrement('demo_visit_live');
            Auth::logout();
            request()->session()->invalidate();
            request()->session()->regenerateToken();
            // Fall through to render the landing page below
        } elseif ($user->isPlatformAdmin()) {
            return \redirect()->route('platform.dashboard');
        } else {
            return \redirect()->route('hub');
        }
    }

    // 4. Show the marketing landing page to unauthenticated visitors
    // On subdomain tenant installs, this still shows the setup welcome — see TenantMiddleware
    return Inertia::render('LandingPage');
})->name('welcome');



// Post-setup welcome splash (internal, not a marketing page)
Route::get('/welcome-splash', function () {
    return Inertia::render('Welcome');
})->middleware('auth')->name('welcome-splash');



// ── Phase 7: AppSumo LTD Code Redemption ──────────────────────────────────────
// Public routes — no auth required (buyers arrive from AppSumo email)
Route::get('/redeem',  [\App\Http\Controllers\AppSumoController::class, 'index'])->name('redeem');
Route::post('/redeem', [\App\Http\Controllers\AppSumoController::class, 'redeem'])->name('redeem.submit');

// Public informational pages (required by AppSumo before campaign approval)
Route::get('/what-is-included', function () {
    return Inertia::render('WhatIsIncluded');
})->name('what-is-included');

Route::get('/refund-policy', function () {
    return Inertia::render('RefundPolicy');
})->name('refund-policy');

Route::get('/terms',   fn() => Inertia::render('TermsOfService'))->name('terms');
Route::get('/privacy', fn() => Inertia::render('PrivacyPolicy'))->name('privacy');

// ── Pre-Launch §14: Health Check ─────────────────────────────────────────────
// Public — no auth. Checks DB, Redis, cache, storage, and Horizon queue health.
// Returns HTTP 200 (all ok) or HTTP 503 (any component failing).
// Monitor this with UptimeRobot every 5 minutes.
Route::get('/health', \App\Http\Controllers\HealthController::class)->name('health');


// Image Fallback Route (for Shared Hosting limits)
Route::get('/storage/{path}', function ($path) {
    $filePath = storage_path('app/public/' . $path);
    if (!file_exists($filePath)) {
        \abort(404);
    }
    $mimeType = File::mimeType($filePath);
    return \response()->file($filePath, ['Content-Type' => $mimeType]);
})->where('path', '.*');

// --- INSTALLER ROUTES ---
Route::prefix('installer')->group(function () {
    Route::get('/', [\App\Http\Controllers\InstallerController::class, 'index'])->name('installer.index');
    // API Routes for Installer
});

Route::prefix('api/installer')->middleware(\App\Http\Middleware\InstallerLock::class)->group(function () {
    Route::get('/requirements', [\App\Http\Controllers\InstallerController::class, 'checkRequirements']);
    Route::post('/check-license', [\App\Http\Controllers\InstallerController::class, 'checkLicense']);
    Route::post('/test-db', [\App\Http\Controllers\InstallerController::class, 'testDatabase']);
    Route::post('/run', [\App\Http\Controllers\InstallerController::class, 'install']);
    Route::post('/restart-server', [\App\Http\Controllers\InstallerController::class, 'restartServer']);

    // DIAGNOSTIC ENDPOINT: Visit /api/installer/diagnose in browser to see what's wrong
    Route::get('/diagnose', function () {
        $results = [];

        // 1. Check .env exists and read DB values
        $envPath = base_path('.env');
        $results['env_exists'] = file_exists($envPath);
        if ($results['env_exists']) {
            $envContent = file_get_contents($envPath);
            $envVars = [];
            foreach (explode("\n", $envContent) as $line) {
                $line = trim($line);
                if ($line && !str_starts_with($line, '#') && str_contains($line, '=')) {
                    [$key, $value] = explode('=', $line, 2);
                    $envVars[trim($key)] = trim($value, " \t\n\r\0\x0B\"'");
                }
            }
            $results['db_host'] = $envVars['DB_HOST'] ?? 'NOT SET';
            $results['db_name'] = $envVars['DB_DATABASE'] ?? 'NOT SET';
            $results['db_user'] = $envVars['DB_USERNAME'] ?? 'NOT SET';
            $results['db_pass_set'] = !empty($envVars['DB_PASSWORD']) ? 'YES' : 'NO';
            $results['cache_store'] = $envVars['CACHE_STORE'] ?? 'NOT SET (default from config)';
            $results['session_driver'] = $envVars['SESSION_DRIVER'] ?? 'NOT SET (default from config)';
            $results['app_key_set'] = !empty($envVars['APP_KEY']) ? 'YES' : 'NO';
        }

        // 2. Check runtime config
        $results['runtime_cache_driver'] = config('cache.default');
        $results['runtime_session_driver'] = config('session.driver');
        $results['runtime_db_host'] = config('database.connections.mysql.host');
        $results['runtime_db_name'] = config('database.connections.mysql.database');
        $results['runtime_db_user'] = config('database.connections.mysql.username');

        // 3. Test DB connection
        try {
            \Illuminate\Support\Facades\DB::purge('mysql');
            \Illuminate\Support\Facades\DB::reconnect('mysql');
            \Illuminate\Support\Facades\DB::connection()->getPdo();
            $results['db_connection'] = 'SUCCESS';
            $results['db_version'] = \Illuminate\Support\Facades\DB::connection()->getPdo()->getAttribute(\PDO::ATTR_SERVER_VERSION);
        } catch (\Throwable $e) {
            $results['db_connection'] = 'FAILED: ' . $e->getMessage();
        }

        // 4. Check directories
        $results['storage_writable'] = is_writable(storage_path());
        $results['views_dir_exists'] = is_dir(storage_path('framework/views'));
        $results['cache_dir_exists'] = is_dir(storage_path('framework/cache/data'));
        $results['sessions_dir_exists'] = is_dir(storage_path('framework/sessions'));
        $results['bootstrap_cache_writable'] = is_writable(base_path('bootstrap/cache'));

        // 5. PHP info
        $results['php_version'] = PHP_VERSION;
        $results['max_execution_time'] = ini_get('max_execution_time');
        $results['memory_limit'] = ini_get('memory_limit');

        // 6. Check laravel.log for recent errors
        $logPath = storage_path('logs/laravel.log');
        if (file_exists($logPath)) {
            $logContent = file_get_contents($logPath);
            $results['log_size'] = strlen($logContent) . ' bytes';
            $results['log_tail'] = substr($logContent, -2000); // Last 2000 chars
        } else {
            $results['log_tail'] = 'No log file found';
        }

        return \response()->json($results, 200, [], JSON_PRETTY_PRINT);
    });
});

// CSRF Refresh (Global)
Route::get('/refresh-csrf', [\App\Http\Controllers\CsrfController::class, 'refresh'])->name('csrf.refresh');

// --- UPDATER ROUTES ---
// Page (auth + platform_admin only)
Route::get('/updater', [\App\Http\Controllers\UpdaterController::class, 'index'])
    ->middleware(['auth', \App\Http\Middleware\UpdaterLock::class])
    ->name('updater.index');

// API (auth + platform_admin only, no InstallerLock — app must be installed)
Route::prefix('api/updater')
    ->middleware(['auth', \App\Http\Middleware\UpdaterLock::class])
    ->group(function () {
        Route::get('/info', [\App\Http\Controllers\UpdaterController::class, 'info']);
        Route::post('/run', [\App\Http\Controllers\UpdaterController::class, 'run']);
    });

Route::get('/dashboard', function() {
    /** @var \App\Models\User $user */
    $user = Auth::user();
    if ($user->isPlatformAdmin()) {
        return \redirect()->route('platform.dashboard');
    }
    return \redirect()->route('hub');
})->middleware(['auth', 'verified'])->name('dashboard');

// Error Reporting API
Route::post('/api/report-error', [\App\Http\Controllers\Api\ErrorReporterController::class, 'store'])->name('api.report-error');

// Placeholder for future routes
Route::get('/ping', fn() => \response()->json(['ok' => true]));


// ═══════════════════════════════════════════════════════════
// LEGACY ROUTE MAPPINGS — SEALED 2026-03-07
// ═══════════════════════════════════════════════════════════
Route::middleware([])->group(function () {
    // Stock Legacy Routing
    Route::any('/stock-operations/{any}',    fn() => \redirect('/stock-operations'))->where('any', '.+');
    Route::any('/stock-transfers/{any?}',    [\App\Http\Controllers\StockTransferController::class, 'store'])->where('any', '.*');
    Route::any('/stock-audit/{any?}',        fn() => \response()->json(['message' => 'Use stock-take module'], 404))->where('any', '.*');
    Route::any('/batches',                   fn() => \response()->json(['message' => 'Managed internally by FifoService'], 404));
    Route::any('/serials',                   fn() => \response()->json(['message' => 'Managed internally by FifoService'], 404));

    // Reports are mostly mapped, but let's keep the block for anything that didn't match the specific ones
    Route::any('/reports/{any}',            fn() => \abort(403, 'DEPRECATED: Use /v3/reports/*'))
         ->where('any', '^(?!(dashboard|analytics|p-and-l|balance-sheet|stock-valuation|low-stock|movement-history|expiry|sales|purchases|day-book|profit-loss|party-statement|transactions|expenses|account-ledger|tax|bank-statement|balance-sheet|all-parties|trial-balance|item-wise-profit|party-wise-profit-loss|discount|cash-flow|sale-aging|sale-orders|bill-wise-profit|expense-by-category|expense-by-item|stock-summary-by-category|item-detail|loan-statement|tax-rate|sale-purchase-by-party|item-report-by-party|party-report-by-item|sale-purchase-by-party-group)).*');
});

Route::middleware(['auth', 'verified', 'tenant', \App\Http\Middleware\DemoMiddleware::class])
    ->prefix('s/{store_slug}')
    ->group(function () {
        // Compatibility Aliases for POS & AJAX (Resolves Ziggy 'route not found' while keeping URL isolation)
        Route::get('/inventory/search', [InventoryController::class, 'search'])->name('inventory.search');
        Route::get('/customers-search', [\App\Http\Controllers\PartyController::class, 'search'])->name('customers.search');
        Route::get('/api/pos/categories', [\App\Http\Controllers\PosController::class, 'getCategories'])->name('api.categories');
        Route::get('/sales/parked', [\App\Http\Controllers\SaleController::class, 'getParkedSales'])->name('sales.parked');
        Route::get('/sales/parked/{id}', [\App\Http\Controllers\SaleController::class, 'recall'])->name('sales.recall');
        Route::delete('/sales/parked/{id}', [\App\Http\Controllers\SaleController::class, 'deleteParked'])->name('sales.parked.delete');
        Route::post('/sales/park', [\App\Http\Controllers\SaleController::class, 'parkBill'])->name('sales.park');

        Route::name('store.')->group(function () {
    Route::get('/dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');
    Route::post('/onboarding/step', [\App\Http\Controllers\OnboardingController::class, 'updateStep'])->name('onboarding.step');
    Route::get('/home', [\App\Http\Controllers\DashboardController::class, 'home'])->name('home');
    Route::get('/dashboard-v1', [\App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard-v1');

    Route::get('/pos', function () {
        return Inertia::render('Pos', [
            'settings' => \App\Models\Setting::all()->pluck('value', 'key'),
        ]);
    })->middleware('permission:pos')->name('pos');

    // Inventory
    Route::get('/inventory', [InventoryController::class, 'dashboard'])->middleware('permission:inventory')->name('inventory.dashboard');
    Route::get('/inventory/list', [InventoryController::class, 'index'])->name('inventory.index');
    Route::get('/inventory/{id}/stats', [InventoryController::class, 'stats'])->name('inventory.stats');
    Route::post('/inventory', [InventoryController::class, 'store'])->name('inventory.store');
    Route::post('/inventory/bulk-destroy', [InventoryController::class, 'bulkDestroy'])->name('inventory.bulk-destroy');
    Route::post('/inventory/check-dependencies', [InventoryController::class, 'checkDependencies'])->name('inventory.check-dependencies');
    Route::get('/inventory/search', [InventoryController::class, 'search'])->name('inventory.search');
    
    Route::get('/inventory/{id}/reservations', [InventoryController::class, 'getReservations'])->name('inventory.reservations');
    Route::get('/inventory/{id}/history', [InventoryController::class, 'getHistory'])->name('inventory.history');
    Route::post('/inventory/{id}', [InventoryController::class, 'update'])->name('inventory.update');
    Route::delete('/inventory/{id}', [InventoryController::class, 'destroy'])->name('inventory.destroy');


    // Stock Operations
    Route::get('/stock-operations', [\App\Http\Controllers\StockOperationsController::class, 'index'])->name('stock-operations');
    Route::post('/stock-operations/transfer', [\App\Http\Controllers\StockOperationsController::class, 'transfer'])->name('stock-operations.transfer');
    Route::post('/stock-operations/adjust', [\App\Http\Controllers\StockOperationsController::class, 'adjust'])->name('stock-operations.adjust');
    Route::post('/stock-operations/audit', [\App\Http\Controllers\StockOperationsController::class, 'audit'])->name('stock-operations.audit');
    Route::post('/stock-operations/warehouse', [\App\Http\Controllers\StockOperationsController::class, 'storeWarehouse'])->name('stock-operations.warehouse.store');
    Route::put('/stock-operations/warehouse/{id}', [\App\Http\Controllers\StockOperationsController::class, 'updateWarehouse'])->name('stock-operations.warehouse.update');


    // Activity Log
    Route::get('/activity-log', [\App\Http\Controllers\ActivityLogController::class, 'index'])->middleware('permission:audit')->name('activity-log.index');

    // Background Sync API (Internal)
    Route::prefix('api')->name('api.')->group(function () {
        Route::get('/sync/users', [\App\Http\Controllers\Api\SyncController::class, 'users'])->name('sync.users');
        Route::get('/sync/products', [\App\Http\Controllers\Api\SyncController::class, 'products'])->name('sync.products');
        Route::get('/sync/customers', [\App\Http\Controllers\Api\SyncController::class, 'customers'])->name('sync.customers');
        Route::get('/sync/suppliers', [\App\Http\Controllers\Api\SyncController::class, 'suppliers'])->name('sync.suppliers');
        Route::get('/sync/inventory', [\App\Http\Controllers\Api\SyncController::class, 'inventory'])->name('sync.inventory');
        Route::get('/sync/taxes', [\App\Http\Controllers\Api\SyncController::class, 'taxes'])->name('sync.taxes');
        Route::post('/sync/orders/batch', [\App\Http\Controllers\Api\SyncController::class, 'batchOrders'])->name('sync.orders.batch');
        Route::post('/heartbeat', [\App\Http\Controllers\Api\HeartbeatController::class, 'store'])->name('heartbeat');
        Route::get('/check-connection', [\App\Http\Controllers\Api\SyncController::class, 'checkConnection'])->name('check-connection');
    });

    // Suppliers

    // Suppliers
    Route::resource('suppliers', \App\Http\Controllers\SupplierController::class)->middleware('permission:purchases');

    // Purchase Orders
    Route::resource('purchase-orders', \App\Http\Controllers\PurchaseOrderController::class)->middleware('permission:purchases');
    Route::post('/purchase-orders/{purchaseOrder}/receive', [\App\Http\Controllers\PurchaseOrderController::class, 'receive'])->name('purchase-orders.receive');
    Route::get('/purchase-orders/{purchaseOrder}/print', [\App\Http\Controllers\PurchaseOrderController::class, 'print'])->name('purchase-orders.print');

    // Proposals
    Route::resource('proposals', \App\Http\Controllers\ProposalController::class);
    Route::post('/proposals/{proposal}/convert', [\App\Http\Controllers\ProposalController::class, 'convertToSale'])->name('proposals.convert');
    Route::post('/proposals/{proposal}/convert-to-sale', [\App\Http\Controllers\ProposalController::class, 'convertToSale'])->name('proposals.convert-to-sale');
    Route::post('/proposals/{proposal}/convert-to-presale', [\App\Http\Controllers\ProposalController::class, 'convertToPreSale'])->name('proposals.convert-to-presale');
    Route::get('/proposals/{proposal}/print', [\App\Http\Controllers\ProposalController::class, 'print'])->name('proposals.print');

    // Sales Orders (Pre-orders with Hold)
    Route::resource('sales-orders', \App\Http\Controllers\SalesOrderController::class);
    Route::post('/sales-orders/{salesOrder}/convert', [\App\Http\Controllers\SalesOrderController::class, 'convertToSale'])->name('sales-orders.convert');
    Route::get('/sales-orders/export/excel', [\App\Http\Controllers\SalesOrderController::class, 'export'])->name('sales-orders.export');
    Route::get('/sales-orders/{salesOrder}/print', [\App\Http\Controllers\SalesOrderController::class, 'print'])->name('sales-orders.print');
    Route::post('/sales-orders/{salesOrder}/cancel', [\App\Http\Controllers\SalesOrderController::class, 'cancel'])->name('sales-orders.cancel');

    // Labels
    Route::get('/labels', [\App\Http\Controllers\LabelController::class, 'index'])->name('labels.index');
    Route::post('/labels/print', [\App\Http\Controllers\LabelController::class, 'print'])->name('labels.print');

    // Reports
    // Reports
    Route::middleware('permission:reports')->group(function () {
        Route::get('/reports', [\App\Http\Controllers\ReportController::class, 'index'])->name('reports.index');
        Route::get('/reports/sales', [\App\Http\Controllers\ReportController::class, 'sales'])->name('reports.sales');
        Route::get('/reports/purchases', [\App\Http\Controllers\ReportController::class, 'purchases'])->name('reports.purchases');
        Route::get('/reports/day-book', [\App\Http\Controllers\ReportController::class, 'dayBook'])->name('reports.day-book');
        Route::get('/reports/profit-loss', [\App\Http\Controllers\ReportController::class, 'profitLoss'])->name('reports.profit-loss');
        Route::get('/reports/party-statement', [\App\Http\Controllers\ReportController::class, 'partyStatement'])->name('reports.party-statement');
        Route::get('/reports/transactions', [\App\Http\Controllers\ReportController::class, 'transactions'])->name('reports.transactions');
        Route::get('/reports/expenses', [\App\Http\Controllers\ReportController::class, 'expenses'])->name('reports.expenses');
        Route::get('/reports/account-ledger', [\App\Http\Controllers\ReportController::class, 'accountLedger'])->name('reports.account-ledger');
        Route::get('/reports/tax', [\App\Http\Controllers\ReportController::class, 'tax'])->name('reports.tax');
        Route::get('/reports/bank-statement', [\App\Http\Controllers\ReportController::class, 'bankStatement'])->name('reports.bank-statement');

        // Existing Reports
        Route::get('/reports/stock-valuation', [\App\Http\Controllers\ReportController::class, 'stockValuation'])->name('reports.stock-valuation');
        Route::get('/reports/low-stock', [\App\Http\Controllers\ReportController::class, 'lowStock'])->name('reports.low-stock');
        Route::get('/reports/movement-history', [\App\Http\Controllers\ReportController::class, 'movementHistory'])->name('reports.movement-history');
        Route::get('/reports/expiry', [\App\Http\Controllers\ReportController::class, 'expiryReport'])->name('reports.expiry');

        // Additional 24 Reports (completing 38 total)
        Route::get('/reports/balance-sheet', [\App\Http\Controllers\ReportController::class, 'balanceSheet'])->name('reports.balance-sheet');
        Route::get('/reports/all-parties', [\App\Http\Controllers\ReportController::class, 'allParties'])->name('reports.all-parties');
        Route::get('/reports/trial-balance', [\App\Http\Controllers\ReportController::class, 'trialBalance'])->name('reports.trial-balance');
        Route::get('/reports/item-wise-profit', [\App\Http\Controllers\ReportController::class, 'itemWiseProfit'])->name('reports.item-wise-profit');
        Route::get('/reports/party-wise-profit-loss', [\App\Http\Controllers\ReportController::class, 'partyWiseProfitLoss'])->name('reports.party-wise-profit-loss');
        Route::get('/reports/discount', [\App\Http\Controllers\ReportController::class, 'discountReport'])->name('reports.discount');
        Route::get('/reports/cash-flow', [\App\Http\Controllers\ReportController::class, 'cashFlow'])->name('reports.cash-flow');
        Route::get('/reports/sale-aging', [\App\Http\Controllers\ReportController::class, 'saleAging'])->name('reports.sale-aging');
        Route::get('/reports/sale-orders', [\App\Http\Controllers\ReportController::class, 'saleOrders'])->name('reports.sale-orders');
        Route::get('/reports/bill-wise-profit', [\App\Http\Controllers\ReportController::class, 'billWiseProfit'])->name('reports.bill-wise-profit');
        Route::get('/reports/expense-by-category', [\App\Http\Controllers\ReportController::class, 'expenseByCategory'])->name('reports.expense-by-category');
        Route::get('/reports/expense-by-item', [\App\Http\Controllers\ReportController::class, 'expenseByItem'])->name('reports.expense-by-item');
        Route::get('/reports/stock-summary-by-category', [\App\Http\Controllers\ReportController::class, 'stockSummaryByCategory'])->name('reports.stock-summary-by-category');
        Route::get('/reports/item-detail', [\App\Http\Controllers\ReportController::class, 'itemDetailReport'])->name('reports.item-detail');
        Route::get('/reports/loan-statement', [\App\Http\Controllers\ReportController::class, 'loanStatement'])->name('reports.loan-statement');
        Route::get('/reports/tax-rate', [\App\Http\Controllers\ReportController::class, 'taxRateReport'])->name('reports.tax-rate');
        Route::get('/reports/sale-purchase-by-party', [\App\Http\Controllers\ReportController::class, 'salePurchaseByParty'])->name('reports.sale-purchase-by-party');
        Route::get('/reports/item-report-by-party', [\App\Http\Controllers\ReportController::class, 'itemReportByParty'])->name('reports.item-report-by-party');
        Route::get('/reports/party-report-by-item', [\App\Http\Controllers\ReportController::class, 'partyReportByItem'])->name('reports.party-report-by-item');
        Route::get('/reports/sale-purchase-by-item-category', [\App\Http\Controllers\ReportController::class, 'salePurchaseByItemCategory'])->name('reports.sale-purchase-by-item-category');
        Route::get('/reports/item-category-wise-profit-loss', [\App\Http\Controllers\ReportController::class, 'itemCategoryWiseProfitLoss'])->name('reports.item-category-wise-profit-loss');
        Route::get('/reports/item-wise-discount', [\App\Http\Controllers\ReportController::class, 'itemWiseDiscount'])->name('reports.item-wise-discount');
        Route::get('/reports/sale-order-items', [\App\Http\Controllers\ReportController::class, 'saleOrderItems'])->name('reports.sale-order-items');
        Route::get('/reports/stock-aging', [\App\Http\Controllers\ReportController::class, 'stockAging'])->name('reports.stock-aging');
        Route::get('/reports/sale-purchase-by-party-group', [\App\Http\Controllers\ReportController::class, 'salePurchaseByPartyGroup'])->name('reports.sale-purchase-by-party-group');
        Route::get('/reports/analytics', [\App\Http\Controllers\ReportController::class, 'analytics'])->name('reports.analytics');
    });

    // Cookbook
    Route::get('/cookbook', [\App\Http\Controllers\CookbookController::class, 'index'])->name('cookbook.index');
    Route::get('/cookbook/create', [\App\Http\Controllers\CookbookController::class, 'create'])->name('cookbook.create');
    Route::post('/cookbook', [\App\Http\Controllers\CookbookController::class, 'store'])->name('cookbook.store');
    Route::get('/cookbook/{id}/edit', [\App\Http\Controllers\CookbookController::class, 'edit'])->name('cookbook.edit');
    Route::put('/cookbook/{id}', [\App\Http\Controllers\CookbookController::class, 'update'])->name('cookbook.update');
    Route::delete('/cookbook/{id}', [\App\Http\Controllers\CookbookController::class, 'destroy'])->name('cookbook.destroy');
    Route::post('/cookbook/simulate', [\App\Http\Controllers\CookbookController::class, 'simulate'])->name('cookbook.simulate');

    // growth-engine
    Route::middleware('permission:reports')->group(function () {
        Route::get('/growth-engine', [\App\Http\Controllers\GrowthEngineController::class, 'index'])->name('growth-engine.index');
        Route::post('/growth-engine/refresh', [\App\Http\Controllers\GrowthEngineController::class, 'refresh'])->name('growth-engine.refresh');
        Route::get('/growth-engine/dashboard', [\App\Http\Controllers\GrowthEngineController::class, 'dashboard'])->name('growth-engine.dashboard');
        Route::get('/growth-engine/whatsapp/{id}', [\App\Http\Controllers\GrowthEngineController::class, 'generateWhatsApp'])->name('growth-engine.whatsapp');
        Route::post('/growth-engine/dismiss/{id}', [\App\Http\Controllers\GrowthEngineController::class, 'dismiss'])->name('growth-engine.dismiss');
        Route::post('/growth-engine/mark-read/{id}', [\App\Http\Controllers\GrowthEngineController::class, 'markRead'])->name('growth-engine.mark-read');
        Route::get('/growth-engine/settings', [\App\Http\Controllers\GrowthEngineController::class, 'settings'])->name('growth-engine.settings');
        Route::post('/growth-engine/settings', [\App\Http\Controllers\GrowthEngineController::class, 'updateSettings'])->name('growth-engine.update-settings');
    });

    // Global Search
    Route::get('/global-search', [\App\Http\Controllers\SearchController::class, 'search'])->name('global.search');
    // AI Query
    Route::get('/ai/query', [\App\Http\Controllers\AiController::class, 'query'])->name('ai.query');
    Route::post('/ai/test-connection', [\App\Http\Controllers\AiController::class, 'testConnection'])->name('ai.test');



    // Variants
    Route::get('/products/{product}/variants', [\App\Http\Controllers\ProductVariantController::class, 'index'])->middleware('permission:inventory')->name('products.variants.index');
    Route::post('/products/{product}/variants', [\App\Http\Controllers\ProductVariantController::class, 'store'])->middleware('permission:inventory')->name('products.variants.store');
    Route::put('/variants/{variant}', [\App\Http\Controllers\ProductVariantController::class, 'update'])->middleware('permission:inventory')->name('variants.update');
    Route::delete('/variants/{variant}', [\App\Http\Controllers\ProductVariantController::class, 'destroy'])->middleware('permission:inventory')->name('variants.destroy');

    // Attributes
    Route::get('/attributes', [ProductAttributeController::class, 'index'])->middleware('permission:inventory')->name('attributes.index');
    Route::post('/attributes', [ProductAttributeController::class, 'store'])->middleware('permission:inventory')->name('attributes.store');
    Route::put('/attributes/{attribute}', [ProductAttributeController::class, 'update'])->middleware('permission:inventory')->name('attributes.update');
    Route::delete('/attributes/{attribute}', [ProductAttributeController::class, 'destroy'])->middleware('permission:inventory')->name('attributes.destroy');

    // Categories (Phase 1 - Unification)
    Route::get('/inventory/categories', [InventoryController::class, 'categories'])->middleware('permission:inventory')->name('categories.index');
    Route::post('/categories', [InventoryController::class, 'storeCategory'])->middleware('permission:inventory')->name('categories.store');
    Route::put('/categories/{category}', [InventoryController::class, 'updateCategory'])->middleware('permission:inventory')->name('categories.update');
    Route::delete('/categories/{category}', [InventoryController::class, 'destroyCategory'])->middleware('permission:inventory')->name('categories.destroy');

    // Stock Levels
    Route::get('/inventory/stock-levels', [InventoryController::class, 'stockLevels'])->name('inventory.stock-levels');

    // Bank Accounts (Phase 1 - Unification)
    Route::get('/bank-accounts', [FinanceController::class, 'bankAccounts'])->name('bank-accounts.index');
    Route::post('/bank-accounts', [FinanceController::class, 'storeBankAccount'])->name('bank-accounts.store');
    Route::put('/bank-accounts/{bankAccount}', [FinanceController::class, 'updateBankAccount'])->name('bank-accounts.update');
    Route::delete('/bank-accounts/{bankAccount}', [FinanceController::class, 'destroyBankAccount'])->name('bank-accounts.destroy');
    Route::get('/bank-accounts/{bankAccount}/transactions', [FinanceController::class, 'bankAccountTransactions'])->name('bank-accounts.transactions');

    // ============================================
    // PHASE 2 - Party & Transaction Management
    // ============================================

    // Parties (Customers/Suppliers unified)
    Route::get('/parties', [\App\Http\Controllers\PartyController::class, 'index'])->middleware('permission:customers')->name('parties.index');
    Route::post('/parties', [\App\Http\Controllers\PartyController::class, 'store'])->middleware('permission:customers')->name('parties.store');
    Route::put('/parties/{party}', [\App\Http\Controllers\PartyController::class, 'update'])->middleware('permission:customers')->name('parties.update');
    Route::delete('/parties/{party}', [\App\Http\Controllers\PartyController::class, 'destroy'])->middleware('permission:customers')->name('parties.destroy');
    Route::delete('/parties', [\App\Http\Controllers\PartyController::class, 'bulkDestroy'])->middleware('permission:customers')->name('parties.bulk-destroy');
    Route::get('/parties/ledgers', [\App\Http\Controllers\PartyController::class, 'index'])->name('parties.ledgers');
    Route::get('/parties/{party}/ledger', [\App\Http\Controllers\PartyController::class, 'ledger'])->name('parties.ledger');

    // Expenses
    // Expenses
    Route::get('/expenses', [\App\Http\Controllers\ExpenseController::class, 'index'])->middleware('permission:finance')->name('expenses.index');
    Route::post('/expenses', [\App\Http\Controllers\ExpenseController::class, 'store'])->name('expenses.store');
    Route::post('/expenses/category', [\App\Http\Controllers\ExpenseController::class, 'storeCategory'])->name('expenses.category.store');
    Route::put('/expenses/{expense}', [\App\Http\Controllers\ExpenseController::class, 'update'])->name('expenses.update');
    Route::delete('/expenses/{expense}', [\App\Http\Controllers\ExpenseController::class, 'destroy'])->name('expenses.destroy');

    // ─── VenSynQ — Multi-Channel Fulfillment Engine ───────────────────────────
    Route::prefix('vensynq')->name('vensynq.')->group(function () {
        // Command Center Dashboard
        Route::get('/', [\App\Http\Controllers\VenSynQController::class, 'index'])->name('index');

        // Channel Management (CRUD)
        Route::post('/channels', [\App\Http\Controllers\VenSynQController::class, 'storeChannel'])->name('channels.store');
        Route::patch('/channels/{channel}', [\App\Http\Controllers\VenSynQController::class, 'updateChannel'])->name('channels.update');
        Route::delete('/channels/{channel}', [\App\Http\Controllers\VenSynQController::class, 'destroyChannel'])->name('channels.destroy');

        // Order Processing
        Route::post('/preview', [\App\Http\Controllers\VenSynQController::class, 'previewOrder'])->name('preview');
        Route::post('/process', [\App\Http\Controllers\VenSynQController::class, 'processOrder'])->name('process');

        // Dispatch & Tracking
        Route::post('/sync-tracking', [\App\Http\Controllers\VenSynQController::class, 'syncTracking'])->name('sync-tracking');

        // JIT Draft Approval
        Route::patch('/jit-drafts/{purchase}/approve', [\App\Http\Controllers\VenSynQController::class, 'approveJitDraft'])->name('jit.approve');

        // VenSynQ Settings
        Route::get('/settings', [\App\Http\Controllers\VenSynQController::class, 'settings'])->name('settings');

        // OAuth Connections & Handshakes
        Route::get('/connect/{platform}', [\App\Http\Controllers\VenSynQController::class, 'connectChannel'])->name('connect');
        Route::get('/callback/{platform}', [\App\Http\Controllers\VenSynQController::class, 'callbackChannel'])->name('callback');
        Route::delete('/channels/{channel}/disconnect', [\App\Http\Controllers\VenSynQController::class, 'disconnectChannel'])->name('channels.disconnect');

        // Live Order Fetch Sync
        Route::post('/sync-orders', [\App\Http\Controllers\VenSynQController::class, 'fetchLiveOrders'])->name('sync-orders');
    });

    // Payments
    // Payments
    Route::get('/payments', [\App\Http\Controllers\PaymentController::class, 'index'])->middleware('permission:finance')->name('payments.index');
    Route::get('/payments/in', [\App\Http\Controllers\PaymentController::class, 'createIn'])->name('payments.in');
    Route::get('/payments/out', [\App\Http\Controllers\PaymentController::class, 'createOut'])->name('payments.out');
    Route::post('/payments', [\App\Http\Controllers\PaymentController::class, 'store'])->name('payments.store');
    Route::get('/payments/{payment}', [\App\Http\Controllers\PaymentController::class, 'show'])->name('payments.show');

    // Purchases
    Route::get('/purchases', [\App\Http\Controllers\PurchaseController::class, 'index'])->name('purchases.index');
    Route::get('/purchases/create', [\App\Http\Controllers\PurchaseController::class, 'create'])->name('purchases.create');
    Route::post('/purchases', [\App\Http\Controllers\PurchaseController::class, 'store'])->name('purchases.store');
    Route::get('/purchases/{purchase}', [\App\Http\Controllers\PurchaseController::class, 'show'])->name('purchases.show');
    Route::get('/purchases/{purchase}/edit', [\App\Http\Controllers\PurchaseController::class, 'edit'])->name('purchases.edit');
    Route::put('/purchases/{purchase}', [\App\Http\Controllers\PurchaseController::class, 'update'])->name('purchases.update');
    Route::delete('/purchases/{purchase}', [\App\Http\Controllers\PurchaseController::class, 'destroy'])->name('purchases.destroy');
    Route::get('/purchases/{purchase}/receive', [\App\Http\Controllers\PurchaseController::class, 'receive'])->name('purchases.receive');

    // All Transactions
    Route::get('/transactions', [\App\Http\Controllers\TransactionController::class, 'index'])->name('transactions.index');

    // ============================================
    // PHASE 3 - Enhanced Inventory & Orders
    // ============================================

    // Stock Levels
    Route::get('/inventory/stock', [InventoryController::class, 'stockLevels'])->name('inventory.stock');

    // Sales Orders
    Route::get('/sales/pre-sales', [\App\Http\Controllers\SalesOrderController::class, 'index'])->name('pre-sales.index');
    Route::get('/sales/pre-sales/create', [\App\Http\Controllers\SalesOrderController::class, 'create'])->name('pre-sales.create');
    Route::post('/sales/pre-sales', [\App\Http\Controllers\SalesOrderController::class, 'store'])->name('pre-sales.store');
    Route::get('/sales/pre-sales/export/excel', [\App\Http\Controllers\SalesOrderController::class, 'export'])->name('pre-sales.export');
    Route::get('/sales/orders/{order}', [\App\Http\Controllers\SalesOrderController::class, 'show'])->name('sales.orders.show');
    Route::put('/sales/orders/{order}', [\App\Http\Controllers\SalesOrderController::class, 'update'])->name('sales.orders.update');
    Route::post('/sales/pre-sales/{order}/convert', [\App\Http\Controllers\SalesOrderController::class, 'convertToSale'])->name('pre-sales.convert');
    Route::delete('/sales/pre-sales/{order}', [\App\Http\Controllers\SalesOrderController::class, 'destroy'])->name('pre-sales.destroy');


    // Production Runs
    Route::get('/inventory/production', [\App\Http\Controllers\ProductionController::class, 'index'])->name('production.index');
    Route::get('/inventory/production/create', [\App\Http\Controllers\ProductionController::class, 'create'])->name('production.create');
    Route::post('/inventory/production', [\App\Http\Controllers\V3\ProductionRunController::class, 'store'])->name('production.store');
    Route::get('/inventory/production/{run}', [\App\Http\Controllers\ProductionController::class, 'show'])->name('production.show');
    Route::post('/inventory/production/{run}/complete', [\App\Http\Controllers\V3\ProductionRunController::class, 'complete'])->name('production.complete');

    // Parked Sales
    Route::get('/sales/parked-items', [\App\Http\Controllers\ParkedSaleController::class, 'index'])->name('parked-sales.index');
    Route::delete('/sales/parked-items/{sale}', [\App\Http\Controllers\ParkedSaleController::class, 'destroy'])->name('parked-sales.destroy');

    // Enhanced Purchase Receive
    Route::post('/purchases/{purchase}/receive', [\App\Http\Controllers\PurchaseController::class, 'storeReceive'])->name('purchases.receive.store');

    // Customers
    Route::resource('customers', \App\Http\Controllers\CustomerController::class);
    // Customers & Suppliers Search
    Route::get('/customers-search', [\App\Http\Controllers\PartyController::class, 'search'])->name('customers.search');
    Route::get('/suppliers-search', [\App\Http\Controllers\PartyController::class, 'search'])->name('suppliers.search');
    Route::get('/parties-search',   [\App\Http\Controllers\PartyController::class, 'search'])->name('parties.search');

    // Sales
    Route::get('/sales', [\App\Http\Controllers\SaleController::class, 'dashboard'])->middleware('permission:sales,sales_view')->name('sales.dashboard');
    Route::get('/sales/list', [\App\Http\Controllers\SaleController::class, 'index'])->middleware('permission:sales,sales_view')->name('sales.index');
    Route::get('/reports/analytics', [\App\Http\Controllers\ReportController::class, 'graphAnalytics'])->name('reports.analytics');
    Route::get('/sales/export', [\App\Http\Controllers\SaleController::class, 'export'])->name('sales.export');
    Route::post('/sales', [\App\Http\Controllers\SaleController::class, 'store'])->name('sales.store');
    Route::get('/attendance/status', [\App\Http\Controllers\AttendanceController::class, 'status'])->name('attendance.status');
    Route::post('/attendance/check-in', [\App\Http\Controllers\AttendanceController::class, 'checkIn'])->name('attendance.check-in');
    Route::post('/attendance/heartbeat', [\App\Http\Controllers\AttendanceController::class, 'heartbeat'])->name('attendance.heartbeat');
    Route::post('/attendance/check-out', [\App\Http\Controllers\AttendanceController::class, 'checkOut'])->name('attendance.check-out');
    Route::post('/attendance/log-gap', [\App\Http\Controllers\AttendanceController::class, 'logGap'])->name('attendance.log-gap');

    Route::get('/sales/{sale}/print', [\App\Http\Controllers\SaleController::class, 'printReceipt'])->name('sales.print');

    // Proposals
    Route::resource('proposals', \App\Http\Controllers\ProposalController::class);
    Route::post('/proposals/{proposal}/convert', [\App\Http\Controllers\ProposalController::class, 'convertToSale'])->name('proposals.convert');

    // Parked Sales (Hold Bill) - MUST BE BEFORE /sales/{sale}
    Route::post('/sales/bulk-destroy', [\App\Http\Controllers\SaleController::class, 'bulkDestroy'])->name('sales.bulk-destroy');
    Route::post('/sales/park', [\App\Http\Controllers\SaleController::class, 'park'])->name('sales.park');
    Route::get('/sales/parked', [\App\Http\Controllers\SaleController::class, 'getParkedSales'])->name('sales.parked');
    Route::get('/sales/parked/{id}', [\App\Http\Controllers\SaleController::class, 'recall'])->name('sales.recall');
    Route::delete('/sales/parked/{id}', [\App\Http\Controllers\SaleController::class, 'deleteParked'])->name('sales.parked.delete');
    Route::post('/sales/get-items', [\App\Http\Controllers\SaleController::class, 'getItemsByIds'])->name('sales.get-items');

    Route::get('/sales/{sale}', [\App\Http\Controllers\SaleController::class, 'show'])->name('sales.show');
    Route::get('/sales/{sale}/edit', [\App\Http\Controllers\SaleController::class, 'edit'])->name('sales.edit');
    Route::put('/sales/{sale}', [\App\Http\Controllers\SaleController::class, 'update'])->name('sales.update');
    Route::post('/sales/{sale}/cancel', [\App\Http\Controllers\SaleController::class, 'cancel'])->name('sales.cancel');
    Route::post('/sales/{sale}/return', [\App\Http\Controllers\SaleController::class, 'returnSale'])->name('sales.return');
    Route::delete('/sales/{sale}', [\App\Http\Controllers\SaleController::class, 'destroy'])->name('sales.destroy');

    // POS API Routes
    Route::get('/api/pos/categories', [\App\Http\Controllers\PosController::class, 'getCategories'])->name('api.categories');

    // Detailed Invoice
    Route::get('/sales/invoice/create', function () {
        return Inertia::render('Sales/CreateInvoice');
    })->name('sales.invoice.create');

    // Master Sales Console (Atomic Analysis)
    Route::get('/sales/master', function () {
        return Inertia::render('Sales/MasterSales');
    })->name('sales.master');

    // Pre-Sale Page (Proof of Concept - Stock Check OFF)
    Route::get('/sales/presale/create', function () {
        return Inertia::render('Sales/CreatePreSale');
    })->name('presales.create');




    // Manufacturing Rules
    Route::get('/manufacturing/rules', function () {
        return Inertia::render('Manufacturing/Rules');
    })->name('manufacturing.rules');

    // Manufacturing API
    Route::get('/api/manufacturing-rules', [\App\Http\Controllers\Api\ManufacturingRuleController::class, 'index']);
    Route::post('/api/manufacturing-rules', [\App\Http\Controllers\Api\ManufacturingRuleController::class, 'store']);
    Route::patch('/api/manufacturing-rules/{id}', [\App\Http\Controllers\Api\ManufacturingRuleController::class, 'update']);
    Route::delete('/api/manufacturing-rules/{id}', [\App\Http\Controllers\Api\ManufacturingRuleController::class, 'destroy']);

    // Categories API
    Route::get('/api/categories', function () {
        return \response()->json(\App\Models\Category::all());
    })->name('api.categories.general');

    Route::get('/api/warehouses', function () {
        return \response()->json(\App\Models\Warehouse::all());
    })->name('api.warehouses');

    // Finance Routes
    Route::get('/finance', [FinanceController::class, 'index'])->middleware('permission:finance')->name('finance');
    Route::get('/finance/receivables', [FinanceController::class, 'receivables'])->name('finance.receivables');
    Route::get('/finance/payables', [FinanceController::class, 'payables'])->name('finance.payables');

    // Fund Management (Owner Capital, Transfers, Adjustments)
    Route::get('/funds', [FundController::class, 'index'])->middleware('permission:finance')->name('funds.index');
    Route::post('/funds/add', [FundController::class, 'addFunds'])->name('funds.add');
    Route::post('/funds/remove', [FundController::class, 'removeFunds'])->name('funds.remove');
    Route::post('/funds/transfer', [FundController::class, 'transfer'])->name('funds.transfer');
    Route::post('/funds/adjust', [FundController::class, 'adjust'])->name('funds.adjust');
    Route::get('/funds/cash-history', [FundController::class, 'history'])->name('funds.history.ledger');
    Route::get('/funds/api/history', [FundController::class, 'getCashHistory'])->name('funds.cash-history');

    // Custom Charges
    Route::get('/api/custom-charges', function () {
        return \response()->json(\App\Models\CustomCharge::active()->get());
    })->name('api.custom-charges');

    Route::get('/api/bank-accounts', \App\Http\Controllers\Api\BankAccountController::class)->name('api.bank-accounts');

    // Settings Route — DEPRECATED at bare /settings
    // Store settings now live at /s/{store_slug}/settings
    // Redirect to hub — the hub will route them into the correct store
    Route::get('/settings', function () {
        return \redirect()->route('hub');
    })->name('settings');
    Route::post('/settings', [\App\Http\Controllers\SettingsController::class, 'update'])->name('settings.update');
    Route::post('/settings/charges', [\App\Http\Controllers\SettingsController::class, 'storeCharge'])->name('settings.charges.store');
    Route::put('/settings/charges/{charge}', [\App\Http\Controllers\SettingsController::class, 'updateCharge'])->name('settings.charges.update');
    Route::delete('/settings/charges/{charge}', [\App\Http\Controllers\SettingsController::class, 'deleteCharge'])->name('settings.charges.delete');

    // Charity Routes
    Route::get('/charity/stats', [\App\Http\Controllers\CharityController::class, 'stats'])->name('charity.stats');
    Route::post('/charity/add', [\App\Http\Controllers\CharityController::class, 'add'])->name('charity.add');
    Route::post('/charity/update-default', [\App\Http\Controllers\CharityController::class, 'updateDefault'])->name('charity.update-default');

    // Communication Routes
    Route::post('/sales/{id}/send-email', [\App\Http\Controllers\CommunicationController::class, 'sendEmail'])->name('sales.send-email');
    Route::post('/sales/{id}/send-whatsapp', [\App\Http\Controllers\CommunicationController::class, 'sendWhatsApp'])->name('sales.send-whatsapp');

    // Accounting Routes
    Route::get('/accounting', [\App\Http\Controllers\AccountingController::class, 'dashboard'])->name('accounting.dashboard');
    Route::get('/accounting/chart', [\App\Http\Controllers\AccountingController::class, 'index'])->name('accounting.index');
    Route::get('/accounting/p-and-l', [\App\Http\Controllers\AccountingController::class, 'profitAndLoss'])->name('accounting.pnl');
    Route::get('/accounting/balance-sheet', [\App\Http\Controllers\AccountingController::class, 'balanceSheet'])->name('accounting.balance-sheet');
    Route::get('/accounting/api/accounts', [\App\Http\Controllers\AccountingController::class, 'apiIndex'])->name('accounting.accounts.api');

    // Reports Dashboard
    // Reports Dashboard
    Route::get('/reports/dashboard', [\App\Http\Controllers\ReportController::class, 'dashboard'])->name('reports.dashboard');

    // Admin Panel (Hub) — DEPRECATED
    // The old /admin-panel is now the Store Admin at /s/{slug}/staff and /s/{slug}/settings
    // This route is kept as a redirect safety net to prevent broken bookmarks from panicking
    Route::get('/admin-panel', [\App\Http\Controllers\AdminController::class, 'index'])->name('admin.panel');

    // Data Management (Import/Export)
    Route::get('/admin-panel/data-management', [\App\Http\Controllers\DataManagementController::class, 'index'])->name('admin.data');
    Route::post('/admin-panel/data/export', [\App\Http\Controllers\DataManagementController::class, 'export'])->name('admin.data.export');
    Route::post('/admin-panel/data/import', [\App\Http\Controllers\DataManagementController::class, 'import'])->name('admin.data.import');
    Route::get('/admin-panel/data/upload-mapping', function ($store_slug) { return \redirect()->route('store.admin.data', ['store_slug' => $store_slug]); });
    Route::post('/admin-panel/data/upload-mapping', [\App\Http\Controllers\ImportMappingController::class, 'uploadForMapping'])->name('admin.data.upload-mapping');
    Route::get('/admin-panel/data/process-import', function ($store_slug) { return \redirect()->route('store.admin.data', ['store_slug' => $store_slug]); });
    Route::post('/admin-panel/data/process-import', [\App\Http\Controllers\ImportMappingController::class, 'processImport'])->name('admin.data.process-import');
    Route::post('/admin-panel/data/validate-import', [\App\Http\Controllers\ImportMappingController::class, 'validateImport'])->name('admin.data.validate-import');
    Route::get('/admin-panel/data/template', [\App\Http\Controllers\DataManagementController::class, 'template'])->name('admin.data.template');

    // Backups
    Route::get('/admin-panel/backups', [\App\Http\Controllers\BackupController::class, 'index'])->name('backups.index');
    Route::post('/admin-panel/backups', [\App\Http\Controllers\BackupController::class, 'store'])->name('backups.store');
    Route::post('/admin-panel/backups/restore', [\App\Http\Controllers\BackupController::class, 'restore'])->name('backups.restore');
    Route::post('/admin-panel/backups/import-data', [\App\Http\Controllers\BackupController::class, 'importData'])->name('backups.import');
    Route::get('/admin-panel/backups/progress', [\App\Http\Controllers\BackupController::class, 'progress'])->name('backups.progress');
    Route::get('/admin-panel/backups/{filename}', [\App\Http\Controllers\BackupController::class, 'download'])->name('backups.download');
    Route::delete('/admin-panel/backups/{filename}', [\App\Http\Controllers\BackupController::class, 'delete'])->name('backups.delete');
    Route::post('/admin-panel/backups/{filename}/email', [\App\Http\Controllers\BackupController::class, 'email'])->name('backups.email');

    Route::get('/admin-panel/dashboard', [\App\Http\Controllers\AdminController::class, 'dashboard'])->name('legacy.admin.dashboard');
    // Migration / Backup Import
    Route::get('/admin-panel/migration', [\App\Http\Controllers\MigrationController::class, 'index'])->name('legacy.admin.migration.index');
    Route::post('/admin-panel/migration/analyze', [\App\Http\Controllers\MigrationController::class, 'analyze'])->name('legacy.admin.migration.analyze');
    Route::post('/admin-panel/migration/execute', [\App\Http\Controllers\MigrationController::class, 'execute'])->name('legacy.admin.migration.execute');

    Route::get('/admin-panel/users', [\App\Http\Controllers\AdminController::class, 'users'])->middleware('permission:users')->name('legacy.admin.users');
    Route::post('/admin-panel/users', [\App\Http\Controllers\AdminController::class, 'storeUser'])->name('legacy.admin.users.store');
    Route::put('/admin-panel/users/{id}', [\App\Http\Controllers\AdminController::class, 'updateUser'])->name('legacy.admin.users.update');
    Route::delete('/admin-panel/users/{id}', [\App\Http\Controllers\AdminController::class, 'destroyUser'])->name('legacy.admin.users.destroy');
    Route::get('/admin-panel/settings', [\App\Http\Controllers\AdminController::class, 'settings'])->middleware('permission:settings')->name('legacy.admin.settings');
    Route::post('/admin-panel/settings', [\App\Http\Controllers\AdminController::class, 'updateSettings'])->name('legacy.admin.settings.update');
    Route::get('/admin-panel/logs', [\App\Http\Controllers\AdminController::class, 'logs'])->middleware('permission:audit')->name('legacy.admin.logs');
    Route::get('/admin-panel/database', [\App\Http\Controllers\AdminController::class, 'database'])->middleware('permission:settings')->name('legacy.admin.database');
    Route::get('/admin-panel/staff', [\App\Http\Controllers\AdminController::class, 'staffSummaries'])->middleware('permission:users')->name('legacy.admin.staff');

    // Staff Attendance
    Route::get('/staff-attendance', [\App\Http\Controllers\StaffAttendanceController::class, 'index'])->name('staff-attendance.index');
    Route::get('/staff-attendance/{id}', [\App\Http\Controllers\StaffAttendanceController::class, 'show'])->name('staff-attendance.show');
    Route::post('/staff-attendance/approve-gap/{id}', [\App\Http\Controllers\StaffAttendanceController::class, 'approveGap'])->name('staff-attendance.approve-gap');
    Route::post('/staff-attendance/reject-gap/{id}', [\App\Http\Controllers\StaffAttendanceController::class, 'rejectGap'])->name('staff-attendance.reject-gap');




    Route::middleware('permission:pos')->group(function () {
        Route::get('/api/loyalty/{partyId}', [\App\Http\Controllers\GrowthEngineController::class, 'customerLoyalty'])->name('loyalty.info');
        Route::post('/api/loyalty/award', [\App\Http\Controllers\GrowthEngineController::class, 'awardPoints'])->name('loyalty.award');
        Route::post('/api/loyalty/redeem', [\App\Http\Controllers\GrowthEngineController::class, 'redeemPoints'])->name('loyalty.redeem');

        // Gift Cards
        Route::post('/api/gift-cards', [\App\Http\Controllers\GrowthEngineController::class, 'createGiftCard'])->name('gift-cards.create');
        Route::get('/api/gift-cards/{code}', [\App\Http\Controllers\GrowthEngineController::class, 'checkGiftCard'])->name('gift-cards.check');
        Route::post('/api/gift-cards/use', [\App\Http\Controllers\GrowthEngineController::class, 'useGiftCard'])->name('gift-cards.use');

        // Store Credit
        Route::post('/api/store-credit/add', [\App\Http\Controllers\GrowthEngineController::class, 'addStoreCredit'])->name('store-credit.add');
        Route::post('/api/store-credit/use', [\App\Http\Controllers\GrowthEngineController::class, 'useStoreCredit'])->name('store-credit.use');
    });
    // Notifications
    Route::get('/notifications', [App\Http\Controllers\NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/mark-all-read', [App\Http\Controllers\NotificationController::class, 'markAllRead'])->name('notifications.mark-all-read');
    Route::post('/notifications/{id}/mark-read', [App\Http\Controllers\NotificationController::class, 'markAsRead'])->name('notifications.mark-read');
    Route::delete('/notifications/{id}', [App\Http\Controllers\NotificationController::class, 'destroy'])->name('notifications.destroy');

    // Profile Routes
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::post('/profile/passcode', [ProfileController::class, 'updatePasscode'])->name('profile.passcode');
    Route::post('/profile/security-pin', [\App\Http\Controllers\ProfileSecurityController::class, 'updateSecurityPin'])->name('profile.security-pin');
    Route::post('/profile/verify-security-pin', [\App\Http\Controllers\ProfileSecurityController::class, 'verifySecurityPin'])->name('profile.verify-security-pin');
    // ============================================
    // NEW FEATURES ROUTES (Returns, StockOps, etc)
    // ============================================

    // Returns History — PROBLEM 10 FIX: Permission middleware added
    // returns.create/store: requires 'returns' (owner, admin, manager, cashier)
    // returns-history: requires 'returns' or 'sales_view' (accountant read-only)
    Route::get('/returns-history', [\App\Http\Controllers\ReturnController::class, 'index'])->name('returns-history.index')->middleware('permission:returns,sales_view');
    Route::get('/returns/create', [\App\Http\Controllers\ReturnController::class, 'create'])->name('returns.create')->middleware('permission:returns');
    Route::post('/returns', [\App\Http\Controllers\ReturnController::class, 'store'])->name('returns.store')->middleware('permission:returns');
    Route::get('/returns-history/{id}', [\App\Http\Controllers\ReturnController::class, 'show'])->name('returns-history.show')->middleware('permission:returns,sales_view');

    // Recurring Invoices
    Route::get('/recurring-invoices', [\App\Http\Controllers\RecurringInvoiceController::class, 'index'])->name('recurring-invoices.index');
    Route::get('/recurring-invoices/create', [\App\Http\Controllers\RecurringInvoiceController::class, 'create'])->name('recurring-invoices.create');
    Route::post('/recurring-invoices', [\App\Http\Controllers\RecurringInvoiceController::class, 'store'])->name('recurring-invoices.store');
    Route::get('/recurring-invoices/{id}/edit', [\App\Http\Controllers\RecurringInvoiceController::class, 'edit'])->name('recurring-invoices.edit');
    Route::put('/recurring-invoices/{id}', [\App\Http\Controllers\RecurringInvoiceController::class, 'update'])->name('recurring-invoices.update');
    Route::post('/recurring-invoices/{id}/toggle', [\App\Http\Controllers\RecurringInvoiceController::class, 'toggle'])->name('recurring-invoices.toggle');
    Route::delete('/recurring-invoices/{id}', [\App\Http\Controllers\RecurringInvoiceController::class, 'destroy'])->name('recurring-invoices.destroy');

    // Stock Transfers
    Route::get('/stock-transfers', [\App\Http\Controllers\StockTransferController::class, 'index'])->middleware('permission:inventory')->name('stock-transfers.index');
    Route::get('/stock-transfers/create', [\App\Http\Controllers\StockTransferController::class, 'create'])->middleware('permission:inventory')->name('stock-transfers.create');
    Route::post('/stock-transfers', [\App\Http\Controllers\StockTransferController::class, 'store'])->middleware('permission:inventory')->name('stock-transfers.store');
    Route::get('/stock-transfers/{id}', [\App\Http\Controllers\StockTransferController::class, 'show'])->middleware('permission:inventory')->name('stock-transfers.show');
    Route::get('/stock-transfers/{id}/edit', function () { /* Placeholder */})->name('stock-transfers.edit');

    // Stock Take / Audit
    Route::get('/stock-audit', [\App\Http\Controllers\StockTakeController::class, 'index'])->middleware('permission:inventory')->name('stock-takes.index');
    Route::get('/stock-audit/create', [\App\Http\Controllers\StockTakeController::class, 'create'])->middleware('permission:inventory')->name('stock-takes.create');
    Route::post('/stock-audit', [\App\Http\Controllers\StockTakeController::class, 'store'])->middleware('permission:inventory')->name('stock-takes.store');
    Route::get('/stock-audit/{id}', [\App\Http\Controllers\StockTakeController::class, 'show'])->middleware('permission:inventory')->name('stock-takes.show');

    // Batch Tracking
    Route::get('/batches', [\App\Http\Controllers\BatchTrackingController::class, 'index'])->middleware('permission:inventory')->name('batches.index');
    Route::get('/batches/{id}', [\App\Http\Controllers\BatchTrackingController::class, 'show'])->middleware('permission:inventory')->name('batches.show');

    // Serial Tracking
    Route::get('/serials', [\App\Http\Controllers\SerialTrackingController::class, 'index'])->middleware('permission:inventory')->name('serials.index');
    Route::get('/serials/{id}', [\App\Http\Controllers\SerialTrackingController::class, 'show'])->middleware('permission:inventory')->name('serials.show');

    // Debit Notes
    Route::get('/debit-notes', [\App\Http\Controllers\DebitNoteController::class, 'index'])->name('debit-notes.index');
    Route::get('/debit-notes/create', [\App\Http\Controllers\DebitNoteController::class, 'create'])->name('debit-notes.create');
    Route::post('/debit-notes', [\App\Http\Controllers\DebitNoteController::class, 'store'])->name('debit-notes.store');
    Route::get('/debit-notes/{id}', [\App\Http\Controllers\DebitNoteController::class, 'show'])->name('debit-notes.show');

    // Bank Reconciliation
    Route::get('/bank-reconciliation', [\App\Http\Controllers\BankReconciliationController::class, 'index'])->name('bank-reconciliation.index');
    Route::post('/bank-reconciliation/import', [\App\Http\Controllers\BankReconciliationController::class, 'import'])->name('bank-reconciliation.import');

    // Invoice Reminders
    Route::get('/invoice-reminders', [\App\Http\Controllers\InvoiceReminderController::class, 'index'])->name('invoice-reminders.index');
    Route::get('/invoice-reminders/create', [\App\Http\Controllers\InvoiceReminderController::class, 'create'])->name('invoice-reminders.create');
    Route::post('/invoice-reminders', [\App\Http\Controllers\InvoiceReminderController::class, 'store'])->name('invoice-reminders.store');
    Route::post('/invoice-reminders/{id}/send', [\App\Http\Controllers\InvoiceReminderController::class, 'send'])->name('invoice-reminders.send');

    // Staff Attendance
    Route::get('/staff/attendance', [\App\Http\Controllers\StaffAttendanceController::class, 'index'])->name('staff.attendance.index');
    Route::get('/staff/attendance/{id}', [\App\Http\Controllers\StaffAttendanceController::class, 'show'])->name('staff.attendance.show');
    Route::post('/staff/attendance/gap/{id}/approve', [\App\Http\Controllers\StaffAttendanceController::class, 'approveGap'])->name('staff.attendance.approve-gap');
    Route::post('/staff/attendance/gap/{id}/reject', [\App\Http\Controllers\StaffAttendanceController::class, 'rejectGap'])->name('staff.attendance.reject-gap');

    // Marketing Campaigns
    Route::get('/marketing/campaigns', [\App\Http\Controllers\MarketingCampaignController::class, 'index'])->name('marketing-campaigns.index');
    Route::get('/marketing/campaigns/create', [\App\Http\Controllers\MarketingCampaignController::class, 'create'])->name('marketing-campaigns.create');
    Route::post('/marketing/campaigns', [\App\Http\Controllers\MarketingCampaignController::class, 'store'])->name('marketing-campaigns.store');

    // Online Store
    Route::get('/online-store-manager', [\App\Http\Controllers\OnlineStoreController::class, 'index'])->name('online-store.index');
    Route::post('/online-store-manager', [\App\Http\Controllers\OnlineStoreController::class, 'update'])->name('online-store.update');

    // ── WooCommerce Sync (Full System) ────────────────────────────────────────
    // Entry point: redirects to the new connection list
    Route::get('/woocommerce-sync', fn() => redirect()->route('store.woo.connections.index', ['store_slug' => request()->route('store_slug')]))
        ->name('woocommerce.index');
    // WooSync — Connection Management & Sync Operations
    Route::prefix('woo')->name('woo.')->group(function () {
        // Plugin download (public within auth context)
        Route::get('/connections/{connection}/download', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'downloadPlugin'])
            ->name('plugin.download');

        // Connections CRUD
        Route::get('/connections', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'index'])
            ->name('connections.index');
        Route::post('/connections', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'store'])
            ->name('connections.store');
        Route::get('/connections/{connection}/setup', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'setup'])
            ->name('connections.setup');
        Route::get('/connections/{connection}/status', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'statusJson'])
            ->name('connections.status-json');
        Route::put('/connections/{connection}/settings', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'updateSettings'])
            ->name('connections.settings');
        Route::delete('/connections/{connection}', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'destroy'])
            ->name('connections.destroy');

        // Sync Page (per connection)
        Route::get('/connections/{connection}/sync', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'syncPage'])
            ->name('connections.sync');

        // Sync Actions
        Route::post('/connections/{connection}/approve', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'approveSync'])
            ->name('connections.approve');
        Route::post('/connections/{connection}/push', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'forcePush'])
            ->name('connections.push');
        Route::post('/connections/{connection}/pull', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'forcePull'])
            ->name('connections.pull');
        Route::post('/connections/{connection}/scan', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'scanCatalog'])
            ->name('connections.scan');
        Route::post('/connections/{connection}/resolve', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'resolveConflict'])
            ->name('connections.resolve');
        Route::post('/connections/{connection}/ignore', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'ignore'])
            ->name('connections.ignore');

        // Logs
        Route::get('/connections/{connection}/logs', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'logs'])
            ->name('connections.logs');
    });

    // E-Invoicing
    Route::get('/e-invoicing', [\App\Http\Controllers\EInvoicingController::class, 'index'])->name('e-invoicing.index');
    Route::post('/e-invoicing/generate', [\App\Http\Controllers\EInvoicingController::class, 'generate'])->name('e-invoicing.generate');

    // System Reset (Admin Only)
    Route::post('/api/system/reset', [\App\Http\Controllers\Admin\SystemResetController::class, 'factoryReset'])->name('system.reset');
    Route::post('/api/system/reset/{entity}', [\App\Http\Controllers\Admin\SystemResetController::class, 'deleteEntity'])->name('system.delete-entity');

    // Added Category D Store Routes
    Route::get('/finance/accounts', fn() => \abort(501, 'Implement finance.accounts'))->name('finance.accounts');
    Route::get('/finance/journal', fn() => \abort(501, 'Implement finance.journal'))->name('finance.journal');
    Route::get('/payments/in/create', fn() => \abort(501, 'Implement payment-in.create'))->name('payment-in.create');
    Route::get('/payments/out/create', fn() => \abort(501, 'Implement payment-out.create'))->name('payment-out.create');
    Route::get('/sales/pre-sales/{order}/print', fn() => \abort(501, 'Implement pre-sales.print'))->name('pre-sales.print');
    Route::get('/debit-notes/{id}/print', fn() => \abort(501, 'Implement debit-notes.print'))->name('debit-notes.print');
    Route::put('/debit-notes/{id}', fn() => \abort(501, 'Implement debit-notes.update'))->name('debit-notes.update');
    Route::get('/purchases/{purchase}/print', fn() => \abort(501, 'Implement purchases.print'))->name('purchases.print');
    Route::get('/sales/create', fn() => \abort(501, 'Implement sales.create'))->name('sales.create');
    Route::get('/inventory/production/{run}/edit', fn() => \abort(501, 'Implement production.edit'))->name('production.edit');
    Route::get('/reports/discount-report', fn() => \abort(501, 'Implement reports.discount-report'))->name('reports.discount-report');
    Route::get('/reports/inventory-valuation', fn() => \abort(501, 'Implement reports.inventory-valuation'))->name('reports.inventory-valuation');
    });
});

Route::post('/woocommerce/webhook', [\App\Http\Controllers\WooCommerceController::class, 'webhook']);

// ── Phase 4.3 & 4.4: Billing + Plan Usage ─────────────────────────────────
// MIGRATED: Added to tenant specific block above to prevent 403 context loss.

// Plan Usage API (read current tenant resource usage vs plan limits)
// Used by: React Billing page, upgrade modal, near-limit warnings
Route::middleware(['auth', 'throttle:api'])->get(
    '/api/plan/usage',
    [\App\Http\Controllers\Api\PlanUsageController::class, 'usage']
)->name('api.plan.usage');



// ── Phase 5.3: Platform Super-Admin Routes ─────────────────────────────────
// These routes are for the VenQore platform operator ONLY (you).
// Protected by 'superadmin' middleware: user->role === 'platform_admin' + no tenant_id.
// Prefix: /superadmin (distinct from per-tenant /admin-panel)
Route::prefix('superadmin')
    ->name('superadmin.')
    ->middleware(['auth', 'superadmin'])
    ->group(function () {
        Route::get('/dashboard', [\App\Http\Controllers\Admin\AdminDashboardController::class, 'index'])
            ->name('dashboard');
        Route::get('/tenants', [\App\Http\Controllers\Admin\AdminDashboardController::class, 'tenants'])
            ->name('tenants');
        Route::post('/tenants/{tenant}/suspend',    [\App\Http\Controllers\Admin\AdminDashboardController::class, 'suspend'])
            ->name('tenants.suspend');
        Route::post('/tenants/{tenant}/reactivate', [\App\Http\Controllers\Admin\AdminDashboardController::class, 'reactivate'])
            ->name('tenants.reactivate');
        Route::post('/tenants/{tenant}/upgrade',    [\App\Http\Controllers\Admin\AdminDashboardController::class, 'upgradePlan'])
            ->name('tenants.upgrade');
    });

Route::prefix('s/{store_slug}/v3')->name('store.v3.')->middleware(['auth', 'verified', 'tenant'])->group(function () {
    Route::resource('products', \App\Http\Controllers\V3\ProductController::class);
    Route::resource('warehouses', \App\Http\Controllers\V3\WarehouseController::class);
    Route::resource('purchases', \App\Http\Controllers\V3\PurchaseController::class)
         ->only(['index', 'create', 'store', 'show']);

    Route::get('purchases/{purchaseId}/return', [\App\Http\Controllers\V3\PurchaseReturnController::class, 'create'])->name('purchases.return.create');
    Route::post('purchases/{purchaseId}/return', [\App\Http\Controllers\V3\PurchaseReturnController::class, 'store'])->name('purchases.return.store');

    Route::post('supplier-payments', [\App\Http\Controllers\V3\SupplierPaymentController::class, 'store'])->name('supplier-payments.store');

    Route::post('opening-balances', [\App\Http\Controllers\V3\OpeningBalanceController::class, 'store'])->name('opening-balances.store');
    Route::get('opening-balances/status', [\App\Http\Controllers\V3\OpeningBalanceController::class, 'status'])->name('opening-balances.status');

    Route::post('supplier-advances', [\App\Http\Controllers\V3\SupplierAdvanceController::class, 'store'])->name('supplier-advances.store');
    Route::post('stock-adjustments', [\App\Http\Controllers\V3\StockAdjustmentController::class, 'store'])->name('stock-adjustments.store');
    Route::post('stock-transfers', [\App\Http\Controllers\V3\StockTransferController::class, 'store'])->name('stock-transfers.store');
    Route::get('suppliers/{supplierId}/statement', [\App\Http\Controllers\V3\SupplierStatementController::class, 'show'])->name('suppliers.statement');

    // Phase 3 — Sales & Customer Management
    Route::post('parties',           [\App\Http\Controllers\V3\PartyController::class, 'store'])->name('parties.store');
    Route::put('parties/{id}',       [\App\Http\Controllers\V3\PartyController::class, 'update'])->name('parties.update');
    Route::delete('parties/{id}',    [\App\Http\Controllers\V3\PartyController::class, 'destroy'])->name('parties.destroy');

    Route::post('sales', [\App\Http\Controllers\V3\SaleController::class, 'store'])->name('sales.store');
    Route::get('sales/{saleId}/pdf', [\App\Http\Controllers\V3\InvoicePdfController::class, 'show'])->name('sales.pdf');
    Route::post('sales/{saleId}/return', [\App\Http\Controllers\V3\SaleReturnController::class, 'store'])->name('sales.return.store');
    Route::post('customer-payments', [\App\Http\Controllers\V3\CustomerPaymentController::class, 'store'])->name('customer-payments.store');
    Route::post('customer-payments/{journalEntryId}/bounce', [\App\Http\Controllers\V3\BounceController::class, 'store'])->name('customer-payments.bounce');
    Route::post('sales/{saleId}/write-off', [\App\Http\Controllers\V3\BadDebtController::class, 'store'])->name('sales.write-off');
    Route::post('customer-advances', [\App\Http\Controllers\V3\CustomerAdvanceController::class, 'store'])->name('customer-advances.store');

    Route::post('sales-orders', [\App\Http\Controllers\V3\SalesOrderController::class, 'store'])->name('sales-orders.store');
    Route::post('sales-orders/{id}/cancel', [\App\Http\Controllers\V3\SalesOrderController::class, 'cancel'])->name('sales-orders.cancel');
    Route::post('sales-orders/{id}/convert', [\App\Http\Controllers\V3\SalesOrderController::class, 'convert'])->name('sales-orders.convert');

    Route::post('quotations', [\App\Http\Controllers\V3\QuotationController::class, 'store'])->name('quotations.store');
    Route::post('quotations/{id}/convert-to-order', [\App\Http\Controllers\V3\QuotationController::class, 'convertToOrder'])->name('quotations.convert-to-order');

    Route::get('customers/{customerId}/statement', [\App\Http\Controllers\V3\CustomerStatementController::class, 'show'])->name('customers.statement');

    // Nested under products
    Route::prefix('products/{productId}')->name('products.')->group(function () {
        Route::get('uom',           [\App\Http\Controllers\V3\UomConversionController::class, 'index'])  ->name('uom.index');
        Route::post('uom',          [\App\Http\Controllers\V3\UomConversionController::class, 'store'])  ->name('uom.store');
        Route::delete('uom/{id}',   [\App\Http\Controllers\V3\UomConversionController::class, 'destroy'])->name('uom.destroy');

        Route::get('tiers',         [\App\Http\Controllers\V3\PriceTierController::class, 'index'])  ->name('tiers.index');
        Route::post('tiers',        [\App\Http\Controllers\V3\PriceTierController::class, 'store'])  ->name('tiers.store');
        Route::delete('tiers/{id}', [\App\Http\Controllers\V3\PriceTierController::class, 'destroy'])->name('tiers.destroy');
    });

    // Phase 4 — Manufacturing & BOM
    Route::post('boms', [\App\Http\Controllers\V3\BomController::class, 'store'])->name('boms.store');
    Route::put('boms/{id}', [\App\Http\Controllers\V3\BomController::class, 'update'])->name('boms.update');
    Route::delete('boms/{id}', [\App\Http\Controllers\V3\BomController::class, 'destroy'])->name('boms.destroy');

    Route::post('production-runs', [\App\Http\Controllers\V3\ProductionRunController::class, 'store'])->name('production-runs.store');
    Route::post('production-runs/{id}/complete', [\App\Http\Controllers\V3\ProductionRunController::class, 'complete'])->name('production-runs.complete');
    Route::post('production-runs/{id}/reverse', [\App\Http\Controllers\V3\ProductionRunController::class, 'reverse'])->name('production-runs.reverse');
    Route::post('disassembly', [\App\Http\Controllers\V3\ProductionRunController::class, 'disassemble'])->name('disassembly.store');

    // Phase 4 — HR & Special Transactions
    Route::post('employees', [\App\Http\Controllers\V3\EmployeeController::class, 'store'])->name('employees.store');
    Route::put('employees/{id}', [\App\Http\Controllers\V3\EmployeeController::class, 'update'])->name('employees.update');
    
    Route::post('payroll/accrue', [\App\Http\Controllers\V3\PayrollController::class, 'accrue'])->name('payroll.accrue');
    Route::post('payroll/pay', [\App\Http\Controllers\V3\PayrollController::class, 'pay'])->name('payroll.pay');
    
    Route::post('employee-settlements', [\App\Http\Controllers\V3\EmployeeSettlementController::class, 'store'])->name('employee-settlements.store');
    
    Route::post('cash-shortages', [\App\Http\Controllers\V3\CashShortageController::class, 'store'])->name('cash-shortages.store');

    Route::post('disaster-claims', [\App\Http\Controllers\V3\DisasterClaimController::class, 'store'])->name('disaster-claims.store');
    Route::post('disaster-claims/{id}/recover', [\App\Http\Controllers\V3\DisasterClaimController::class, 'recover'])->name('disaster-claims.recover');

    Route::post('assets', [\App\Http\Controllers\V3\AssetController::class, 'store'])->name('assets.store');
    Route::post('depreciation', [\App\Http\Controllers\V3\DepreciationController::class, 'store'])->name('depreciation.store');

    Route::post('loans/drawdown', [\App\Http\Controllers\V3\LoanController::class, 'drawdown'])->name('loans.drawdown');
    Route::post('loans/repay', [\App\Http\Controllers\V3\LoanController::class, 'repay'])->name('loans.repay');

    Route::post('expenses', [\App\Http\Controllers\V3\ExpenseController::class, 'store'])->name('expenses.store');
    Route::post('funds', [\App\Http\Controllers\V3\FundController::class, 'store'])->name('funds.store');
    Route::post('bank-transfers', [\App\Http\Controllers\V3\BankTransferController::class, 'store'])->name('bank-transfers.store');
    Route::post('donations', [\App\Http\Controllers\V3\DonationController::class, 'store'])->name('donations.store');

    Route::put('users/{id}/role', [\App\Http\Controllers\V3\RoleController::class, 'update'])->name('users.role.update');
    Route::post('settings/discount-limits', [\App\Http\Controllers\V3\RoleController::class, 'updateDiscountLimit'])->name('settings.discount-limits');

    Route::post('fiscal-year/close', [\App\Http\Controllers\V3\FiscalYearController::class, 'close'])->name('fiscal-year.close');

    // Reports
    Route::get('reports/trial-balance', [\App\Http\Controllers\V3\ReportController::class, 'trialBalance'])->name('reports.trial-balance');
    Route::get('reports/profit-loss', [\App\Http\Controllers\V3\ReportController::class, 'profitAndLoss'])->name('reports.profit-loss');
    Route::get('reports/balance-sheet', [\App\Http\Controllers\V3\ReportController::class, 'balanceSheet'])->name('reports.balance-sheet');
    Route::get('reports/cash-flow', [\App\Http\Controllers\V3\ReportController::class, 'cashFlow'])->name('reports.cash-flow');
    Route::get('reports/aged-receivables', [\App\Http\Controllers\V3\ReportController::class, 'agedReceivables'])->name('reports.aged-receivables');
    Route::get('reports/aged-payables', [\App\Http\Controllers\V3\ReportController::class, 'agedPayables'])->name('reports.aged-payables');
    Route::get('reports/sales', [\App\Http\Controllers\V3\ReportController::class, 'sales'])->name('reports.sales');
    Route::get('reports/purchases', [\App\Http\Controllers\V3\ReportController::class, 'purchases'])->name('reports.purchases');
    Route::get('reports/inventory-valuation', [\App\Http\Controllers\V3\ReportController::class, 'inventoryValuation'])->name('reports.inventory-valuation');
    Route::get('reports/cogs', [\App\Http\Controllers\V3\ReportController::class, 'cogs'])->name('reports.cogs');
    Route::get('reports/gross-profit', [\App\Http\Controllers\V3\ReportController::class, 'grossProfit'])->name('reports.gross-profit');
    Route::get('reports/tax', [\App\Http\Controllers\V3\ReportController::class, 'tax'])->name('reports.tax');
    Route::get('reports/party-ledger/{partyId}', [\App\Http\Controllers\V3\ReportController::class, 'partyLedger'])->name('reports.party-ledger');
    Route::get('reports/inventory-movement', [\App\Http\Controllers\V3\ReportController::class, 'inventoryMovement'])->name('reports.inventory-movement');
    Route::get('reports/export', [\App\Http\Controllers\V3\ReportExportController::class, 'export'])->name('reports.export');

    // Dashboard
    Route::get('dashboard', [\App\Http\Controllers\V3\DashboardController::class, 'index']);
});

require __DIR__ . '/auth.php';

// Version Check Route
Route::get('/api/app-version', function () {
    $manifestPath = public_path('build/manifest.json');
    if (file_exists($manifestPath)) {
        return \response()->json(['version' => filemtime($manifestPath)]);
    }
// Change every 5 mins in dev for testing
    return \response()->json(['version' => 'dev-' . floor(time() / 300)]);
});

if (app()->environment('local')) {
    // ── Emergency Rescue Route ──────────────────────────────────────────────────
    // Visit /rescue-cache BEFORE running the updater if you get a heroicons error.
    // This clears the stale bootstrap cache that causes the "prefix not defined" error.
    Route::get('/rescue-cache', function() {
        $cleared = [];
        $errors = [];

        // 1. Clear bootstrap/cache/*.php (config.php, services.php, packages.php etc.)
        $cacheDir = base_path('bootstrap/cache');
        if (is_dir($cacheDir)) {
            foreach (glob($cacheDir . '/*.php') as $file) {
                if (basename($file) !== '.gitignore') {
                    if (@unlink($file)) {
                        $cleared[] = 'bootstrap/cache/' . basename($file);
                    } else {
                        $errors[] = 'Could not delete: ' . basename($file);
                    }
                }
            }
        }

        // 2. Write correct blade-heroicons config if missing
        $heroiconsConfig = config_path('blade-heroicons.php');
        if (!file_exists($heroiconsConfig)) {
            $content = "<?php\nreturn [\n    'prefix' => 'heroicon',\n    'fallback' => '',\n    'class' => '',\n    'attributes' => [],\n];\n";
            if (file_put_contents($heroiconsConfig, $content)) {
                $cleared[] = 'Wrote config/blade-heroicons.php';
            } else {
                $errors[] = 'Could not write config/blade-heroicons.php';
            }
        }

        // 3. Remove broken blade-icons.php if it exists (we accidentally created this)
        $badConfig = config_path('blade-icons.php');
        if (file_exists($badConfig)) {
            if (@unlink($badConfig)) {
                $cleared[] = 'Removed config/blade-icons.php (was causing conflict)';
            }
        }

        return \response()->json([
            'message' => 'Cache rescue complete. You can now run the updater.',
            'cleared' => $cleared,
            'errors' => $errors,
        ]);
    });


    Route::get('/patch-system', function() {
        // 1. Fix old purchases that never generated Journal Entries
        $user = \App\Models\User::first();
        if ($user) {
            Auth::login($user);
        }
        
        $accounting = app(\App\Services\AccountingService::class);
        $payableAccount = $accounting->getAccountByCode('2000', 'Accounts Payable', 'liability');
        $cashAccount = $accounting->getAccountByCode('1000', 'Cash in Hand', 'asset');
        $bankAccount = $accounting->getAccountByCode('1010', 'Bank Account', 'asset');
        
        $purchases = \App\Models\Invoice::where('type', 'purchase')->get();
        $fixedC = 0;
        foreach($purchases as $invoice) {
            $hasEntry = \App\Models\JournalEntry::where('source_type', \App\Models\Invoice::class)->where('source_id', $invoice->id)->exists();
            if (!$hasEntry) {
                // Find payments associated with this purchase.
                // Wait, we didn't track invoice_id on payments until recently? The reference usually has invoice number.
                $payments = \App\Models\Payment::where('reference', $invoice->invoice_number)->get();
                foreach($payments as $pmt) {
                    if ($pmt->amount > 0) {
                        $logAccount = ($pmt->method === 'cash') ? $cashAccount : $bankAccount;
                        $journalItems = [
                            [
                                'account_id'  => $payableAccount->id,
                                'debit'       => $pmt->amount,
                                'credit'      => 0,
                                'description' => "Payment for Purchase #{$invoice->invoice_number}",
                            ],
                            [
                                'account_id'  => $logAccount->id,
                                'debit'       => 0,
                                'credit'      => $pmt->amount,
                                'description' => "Payment for Purchase #{$invoice->invoice_number}",
                            ]
                        ];
                        $accounting->createEntry([
                            'date'        => $pmt->date ?? $invoice->date,
                            'reference'   => $invoice->invoice_number,
                            'description' => "Auto journal — Purchase #{$invoice->invoice_number}",
                            'party_id'    => $invoice->party_id,
                            'source_type' => \App\Models\Invoice::class,
                            'source_id'   => $invoice->id,
                        ], $journalItems);
                        $fixedC++;
                    }
                }
            }
        }
        return \response()->json(['message' => "Patched $fixedC missing purchase journal entries for older data!"]);
    });

    Route::get('/fix-timestamps', function() {
        // Fix returns whose created_at was manually backdated.
        // UUID v7 IDs contain the real creation timestamp — extract it.
        $fixed = 0;
        $details = [];

        $returns = \App\Models\Sale::where('status', 'returned')->get();
        foreach ($returns as $ret) {
            /** @var \App\Models\Sale $ret */
            // UUID v7: first 48 bits (12 hex chars) = milliseconds since epoch
            $hexTimestamp = str_replace('-', '', substr($ret->id, 0, 13));
            $hexTimestamp = substr($hexTimestamp, 0, 12);
            $msTimestamp = hexdec($hexTimestamp);
            $realCreatedAt = \Carbon\Carbon::createFromTimestampMs($msTimestamp);

            // If created_at differs from UUID timestamp by more than 1 minute, it was backdated
            $diff = abs($ret->created_at->diffInMinutes($realCreatedAt));
            if ($diff > 1) {
                $oldDate = $ret->created_at->toDateTimeString();
                $ret->created_at = $realCreatedAt;
                $ret->updated_at = $realCreatedAt;
                $ret->timestamps = false; // Prevent Laravel from overriding
                $ret->save();
                $ret->timestamps = true;

                $details[] = [
                    'ref' => $ret->reference_number,
                    'was' => $oldDate,
                    'corrected_to' => $realCreatedAt->toDateTimeString(),
                ];
                $fixed++;
            }
        }

        return \response()->json([
            'message' => "Fixed $fixed backdated return timestamps using UUID v7 real creation time.",
            'details' => $details,
        ]);
    });

    Route::get('/debug-inventory', function() {
        try { $batches = \Illuminate\Support\Facades\DB::table('inventory_batches')->get(); } catch (\Exception $e) { $batches = 'TABLE NOT FOUND: ' . $e->getMessage(); }
        $products = \App\Models\Product::all(['id', 'name', 'stock_quantity', 'cost_price', 'price']);
        try { $stocks = \Illuminate\Support\Facades\DB::table('stocks')->get(); } catch (\Exception $e) { $stocks = 'TABLE NOT FOUND'; }
        try { $movements = \Illuminate\Support\Facades\DB::table('stock_movements')->get(); } catch (\Exception $e) { $movements = 'TABLE NOT FOUND'; }
        return \response()->json([
            'inventory_batches' => $batches,
            'products' => $products,
            'stocks' => $stocks,
            'stock_movements' => $movements,
        ]);
    });

    Route::get('/fix-batch-inventory', function() {
        $DB = \Illuminate\Support\Facades\DB::getFacadeRoot();
        $products = \App\Models\Product::all();
        $fixed = 0;
        $details = [];

        foreach ($products as $product) {
            // Calculate correct stock from movements
            $movements = \Illuminate\Support\Facades\DB::table('stock_movements')
                ->where('product_id', $product->id)->get();

            $correctStock = 0;
            foreach ($movements as $mv) {
                if (in_array($mv->type, ['purchase', 'return', 'initial_stock', 'production'])) {
                    $correctStock += abs((float)$mv->quantity);
                } elseif ($mv->type === 'sale') {
                    $correctStock -= abs((float)$mv->quantity);
                } elseif ($mv->type === 'adjustment') {
                    $correctStock += (float)$mv->quantity;
                }
            }

            // Find the most recent batch for this product
            $batch = \Illuminate\Support\Facades\DB::table('inventory_batches')
                ->where('product_id', $product->id)
                ->whereNull('deleted_at')
                ->orderByDesc('created_at')
                ->first();

            if ($batch && (float)$batch->remaining_qty != $correctStock) {
                \Illuminate\Support\Facades\DB::table('inventory_batches')
                    ->where('id', $batch->id)
                    ->update(['remaining_qty' => max(0, $correctStock), 'updated_at' => Carbon::now()]);
                $details[] = [
                    'product' => $product->name,
                    'batch_was' => (float)$batch->remaining_qty,
                    'corrected_to' => $correctStock,
                ];
                $fixed++;
            } elseif (!$batch && $correctStock > 0) {
                // No batch exists but stock exists — create one
                \Illuminate\Support\Facades\DB::table('inventory_batches')->insert([
                    'id' => (string) \Illuminate\Support\Str::orderedUuid(),
                    'product_id' => $product->id,
                    'warehouse_id' => \App\Models\Warehouse::first()?->id ?? 1,
                    'original_qty' => $correctStock,
                    'remaining_qty' => $correctStock,
                    'unit_cost' => $product->cost_price ?? 0,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);
                $details[] = [
                    'product' => $product->name,
                    'batch_was' => 'NONE',
                    'corrected_to' => $correctStock,
                ];
                $fixed++;
            }
        }

        return \response()->json([
            'message' => "Fixed $fixed product inventory batches.",
            'details' => $details,
        ]);
    });

    Route::get('/fix-inventory', function() {
        $products = \App\Models\Product::all();
        $fixedCount = 0;
        $details = [];

        foreach ($products as $product) {
            // === SOURCE OF TRUTH: StockMovements ===
            // Positive movements: purchase, return, initial_stock, adjustment (positive), production
            // Negative movements: sale (logged as negative qty in some systems, or positive with type 'sale' meaning stock OUT)
            
            // Let's just SUM all movements. The convention is:
            // purchase/return/initial_stock/adjustment = positive qty (stock IN)
            // sale = negative qty (stock OUT) ... BUT some systems log sale as positive with type context.
            
            // Check the actual data pattern:
            $movements = \App\Models\StockMovement::where('product_id', $product->id)->get();
            
            $correctStock = 0;
            foreach ($movements as $mv) {
                if (in_array($mv->type, ['purchase', 'return', 'initial_stock', 'production'])) {
                    $correctStock += abs($mv->quantity); // These ADD stock
                } elseif ($mv->type === 'sale') {
                    $correctStock -= abs($mv->quantity); // These REMOVE stock
                } elseif ($mv->type === 'adjustment') {
                    $correctStock += $mv->quantity; // Adjustments can be +/-
                } elseif ($mv->type === 'transfer') {
                    $correctStock += $mv->quantity; // Transfers can be +/-
                } else {
                    $correctStock += $mv->quantity; // Unknown types, use raw value
                }
            }
            
            $correctStock = max(0, $correctStock); // Floor at 0
            
            $currentProductStock = (int) $product->stock_quantity;
            $currentStockTable = (int) \App\Models\Stock::where('product_id', $product->id)->sum('quantity');
            
            $needsFix = ($currentProductStock != $correctStock) || ($currentStockTable != $correctStock);
            
            if ($needsFix) {
                // Fix Product table
                $product->stock_quantity = $correctStock;
                $product->save();
                
                // Fix Stock table (warehouse level)
                $stock = \App\Models\Stock::where('product_id', $product->id)->first();
                if ($stock) {
                    $stock->quantity = $correctStock;
                    $stock->save();
                }
                
                $details[] = [
                    'product' => $product->name,
                    'was_product' => $currentProductStock,
                    'was_stock_table' => $currentStockTable,
                    'corrected_to' => $correctStock,
                    'movements_count' => $movements->count(),
                ];
                $fixedCount++;
            }
        }

        return \response()->json([
            'message' => "Fixed $fixedCount products based on movement history (source of truth).",
            'details' => $details,
        ]);
    });
}

// Updater Test Version v1.18 - Routing Fix Applied.
Route::get('/debug-error', function () {
    if (request('key') !== 'venqoredebug777') {
        abort(403);
    }
    $logPath = storage_path('logs/laravel.log');
    if (!file_exists($logPath)) {
        return 'Log file does not exist.';
    }
    $content = file_get_contents($logPath);
    $length = strlen($content);
    if ($length > 80000) {
        $content = substr($content, -80000);
    }
    return response($content)->header('Content-Type', 'text/plain');
});

// ── FALLBACK: 404 for any URL not matched above ────────────────────────────
// This is the last line of defense. Every URL that doesn't match a route
// above returns a clean 404 — no redirect, no hint that anything exists.
// This means /admin-panel, /reports, /inventory (bare) all 404 for guessers.
Route::fallback(fn() => \abort(404));
