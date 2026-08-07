# VenQore — The Definitive Architecture & Launch Plan
**Version:** Final. No more revisions to core architecture.  
**All decisions locked. This is the document you build from.**

---

## Every Decision, In One Place

| Decision | Answer | Reason |
|---|---|---|
| URL structure | `venqore.com/s/{numeric_id}/dashboard` | Permanent, collision-proof, multi-tab safe, store renames never break URLs |
| User sees in browser | Store name everywhere in UI | Number is invisible — user never types it |
| Hub page | Skip if 1 store, show if 2+ stores | Zero friction for the majority (single-store owners) |
| After login with 1 store | Go straight in, no stop | Feels instant |
| After login with 2+ stores | Show hub, remember last used | Amazon Seller experience |
| Store creation | Free 14-day trial, card required after | Lowest signup friction globally |
| AppSumo deal | $79 = Lifetime license + 2 years hosting | Industry standard, sustainable |
| AppSumo hosting end | $9/month to stay hosted or self-host free | Fair, buyers understand it |
| AppSumo code stacking | 1 code Starter, 2 codes Growth, 3 codes Business | Higher revenue per buyer |
| Staff display name | Optional override per store | Global name default, owner can rename |
| Staff invite security | Email-locked, 7-day expiry, single-use token | Bulletproof |
| Billing entity | Store pays, not user | Correct — one user can be at multiple stores |
| Hosting now | Hostinger Cloud Professional (6GB/4 core) | Fine for beta and first 50-100 users |
| Hosting migration trigger | When approaching 40 concurrent users | Move to DigitalOcean $24/month before AppSumo |

---

## The Architecture in Plain English

One login for life at `venqore.com`. Your email and password are your master key. Behind that key you can belong to as many stores as you want — as owner at your own shop, as cashier at your cousin's shop, as admin at a client's business.

When you log in: if you have one store, you go straight inside it. If you have multiple, you see your store list and pick one. Once inside, the store's ID is embedded in every URL (`venqore.com/s/98765/...`) so two browser tabs can be open on two different stores with zero interference between them.

Every store is completely isolated. No store can see another store's products, sales, customers, or finances. The isolation happens at the database query level via the `tenant_id` column and `HasTenant` global scope — the same system already built.

Billing is per store. If a store stops paying, only that store is suspended. The user's account and their access to other stores is completely unaffected.

---

## Database Schema (Final)

### users — Global Identity Only

```php
Schema::create('users', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('email')->unique();
    $table->string('password');
    $table->timestamp('email_verified_at')->nullable();
    $table->unsignedBigInteger('last_store_id')->nullable();
    // last_store_id: remembers which store to auto-enter on next login
    // FK added after tenants table exists:
    // $table->foreign('last_store_id')->references('id')->on('tenants')->nullOnDelete();
    $table->boolean('is_platform_admin')->default(false);
    $table->rememberToken();
    $table->timestamps();
    $table->softDeletes();
});
// Phone: NOT on users. Collected per-store in tenant_users if needed.
// Reason: phone numbers change, telecoms recycle them, SMS OTP is expensive at scale.
```

### tenants — Each Store

```php
Schema::create('tenants', function (Blueprint $table) {
    $table->unsignedBigInteger('id')->autoIncrement(); // THE store ID (98765)
    $table->string('name');          // "Ali Shoes" — shown in UI everywhere
    $table->string('slug')->unique(); // "ali-shoes" — for display only, NOT routing
    // Slug is used: in emails, in admin dashboard, in store settings page
    // Slug is NOT used: in any URL the user navigates to

    // Billing (store-level, not user-level)
    $table->enum('plan', ['trial', 'starter', 'growth', 'business', 'ltd'])->default('trial');
    $table->enum('status', ['trial', 'active', 'suspended', 'cancelled'])->default('trial');
    $table->timestamp('trial_ends_at')->nullable();
    $table->timestamp('subscription_ends_at')->nullable();
    $table->string('lemon_squeezy_customer_id')->nullable()->index();
    $table->string('lemon_squeezy_subscription_id')->nullable()->index();
    $table->string('appsumo_code')->nullable()->index();

    // Locale & currency
    $table->string('currency_code', 3)->default('USD');
    $table->string('currency_symbol', 10)->default('$');
    $table->string('timezone')->default('UTC');
    $table->string('country_code', 2)->nullable();
    $table->string('language_code', 5)->default('en');

    // Onboarding
    $table->boolean('setup_completed')->default(false);
    $table->string('industry')->nullable();
    $table->string('join_code', 8)->unique()->nullable(); // "VQ-A3F9"

    // Feature flags (set by industry during wizard)
    $table->boolean('feature_variants')->default(false);    // fashion
    $table->boolean('feature_serials')->default(false);     // electronics
    $table->boolean('feature_batches')->default(false);     // pharmacy
    $table->boolean('feature_manufacturing')->default(false);

    // Plan limit overrides (null = use config/plans.php defaults)
    $table->json('plan_limits')->nullable();

    $table->timestamps();
    $table->softDeletes();

    $table->index(['status', 'trial_ends_at']);
    $table->index('plan');
});
```

### tenant_users — The Pivot (Heart of the System)

```php
Schema::create('tenant_users', function (Blueprint $table) {
    $table->id();
    $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
    $table->foreignId('user_id')->nullable()->constrained('users')->cascadeOnDelete();
    // user_id is NULL until an invited person accepts (pending invite state)

    $table->enum('role', ['owner', 'admin', 'manager', 'cashier', 'viewer']);
    // owner: billing contact, cannot be removed, cannot have role changed
    // admin: can invite/remove staff, access all features
    // manager: can access reports, cannot touch billing or staff
    // cashier: POS only + inventory view
    // viewer: read-only access to reports

    $table->enum('status', ['active', 'invited', 'suspended'])->default('active');

    // Store-specific identity (separate from global account)
    $table->string('display_name')->nullable();
    // NULL = show global user name. Set = show this on receipts, POS, reports.
    // Example: global name "Abdullah Hashmi", display name "Register 2"

    $table->string('pos_pin', 6)->nullable();
    // Optional PIN for quick POS login on shared tablets
    // Cashier taps their PIN instead of typing full password

    // Invite tracking
    $table->string('invite_email')->nullable(); // locked to this email
    $table->string('invite_token', 64)->nullable()->unique();
    $table->timestamp('invite_expires_at')->nullable();
    $table->timestamp('invited_at')->nullable();
    $table->timestamp('joined_at')->nullable();

    $table->unique(['tenant_id', 'user_id']);
    $table->index(['tenant_id', 'role']);
    $table->index(['tenant_id', 'status']);
    $table->index(['user_id', 'status']);
    $table->index('invite_token');
    $table->timestamps();
});
```

### store_licenses — Billing Ownership & AppSumo

```php
Schema::create('store_licenses', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained('users');
    // The person who OWNS this license (paid for it or redeemed AppSumo code)

    $table->foreignId('tenant_id')->nullable()->constrained('tenants')->nullOnDelete();
    // NULL until they create a store with it

    $table->enum('type', ['trial', 'subscription', 'ltd']);
    $table->enum('status', ['available', 'consumed', 'expired', 'cancelled']);
    $table->string('plan')->default('starter'); // what plan this unlocks
    $table->string('source')->nullable();       // 'registration', 'lemon_squeezy', 'appsumo', 'manual'
    $table->string('source_reference')->nullable(); // order ID or AppSumo code
    $table->timestamp('valid_until')->nullable(); // NULL = forever (LTD)
    $table->timestamp('consumed_at')->nullable();
    $table->timestamps();

    $table->index(['user_id', 'status']);
    $table->index('source_reference');
});
```

### appsumo_codes — Code Bank

```php
Schema::create('appsumo_codes', function (Blueprint $table) {
    $table->id();
    $table->string('code')->unique();           // the actual code buyer pastes
    $table->string('plan')->default('starter'); // what plan it unlocks
    $table->integer('stack_count')->default(1); // 1, 2, or 3 (determines plan tier)
    $table->enum('status', ['available', 'consumed']);
    $table->foreignId('redeemed_by')->nullable()->constrained('users');
    $table->timestamp('redeemed_at')->nullable();
    $table->timestamps();
});
// You bulk-import these from the AppSumo dashboard before launch
// AppSumo generates the codes, you import them via artisan command
```

---

## AppSumo Code Stacking — How It Works

AppSumo buyers can buy multiple codes. Your deal advertises:
- **1 code ($79)** = Starter plan (1 location, 1,000 SKUs, 3 staff)
- **2 codes ($158)** = Growth plan (3 locations, unlimited SKUs, 10 staff)
- **3 codes ($237)** = Business plan (unlimited everything)

When they redeem, they paste all their codes one by one. Your system:

```php
public function redeem(Request $request): JsonResponse
{
    $code = strtoupper(trim($request->input('code')));
    $user = Auth::user();

    $appsumoCode = AppSumoCode::where('code', $code)
        ->where('status', 'available')
        ->lockForUpdate()
        ->firstOrFail();

    // Count how many AppSumo codes this user has already redeemed
    $existingCodeCount = StoreLicense::where('user_id', $user->id)
        ->where('source', 'appsumo')
        ->count();

    // Max 3 codes per user
    if ($existingCodeCount >= 3) {
        return response()->json([
            'error' => 'Maximum of 3 AppSumo codes can be redeemed per account.'
        ], 422);
    }

    $newTotal = $existingCodeCount + 1;

    // Determine plan based on total codes held
    $plan = match(true) {
        $newTotal >= 3 => 'business',
        $newTotal >= 2 => 'growth',
        default        => 'starter',
    };

    DB::transaction(function () use ($user, $appsumoCode, $plan, $existingCodeCount) {
        // Mark code as consumed
        $appsumoCode->update([
            'status'      => 'consumed',
            'redeemed_by' => $user->id,
            'redeemed_at' => now(),
        ]);

        if ($existingCodeCount === 0) {
            // First code — create a new LTD license
            StoreLicense::create([
                'user_id'          => $user->id,
                'type'             => 'ltd',
                'status'           => 'available',
                'plan'             => $plan,
                'source'           => 'appsumo',
                'source_reference' => $appsumoCode->code,
                'valid_until'      => null,
            ]);
        } else {
            // Additional code — upgrade their existing LTD license
            StoreLicense::where('user_id', $user->id)
                ->where('source', 'appsumo')
                ->where('type', 'ltd')
                ->update(['plan' => $plan]);

            // If they already have an active store with this license, upgrade it too
            $existingLicense = StoreLicense::where('user_id', $user->id)
                ->where('source', 'appsumo')
                ->whereNotNull('tenant_id')
                ->first();

            if ($existingLicense) {
                Tenant::where('id', $existingLicense->tenant_id)
                    ->update(['plan' => $plan]);
            }
        }
    });

    $messages = [
        1 => 'Code redeemed! You have the Starter plan. Add a 2nd code to upgrade to Growth.',
        2 => 'Upgraded to Growth plan! Add a 3rd code to unlock Business plan.',
        3 => 'Upgraded to Business plan — maximum tier unlocked!',
    ];

    return response()->json([
        'success' => true,
        'message' => $messages[$newTotal],
        'plan'    => $plan,
        'codes_redeemed' => $newTotal,
    ]);
}
```

---

## The TenantMiddleware (URL-Based, Final)

```php
// app/Http/Middleware/TenantMiddleware.php

public function handle(Request $request, Closure $next): mixed
{
    $storeId = (int) $request->route('store_id');

    if (!$storeId) {
        return redirect()->route('hub');
    }

    $user = Auth::user();

    // One query: get membership + tenant together
    $membership = TenantUser::where('tenant_id', $storeId)
        ->where('user_id', $user->id)
        ->where('status', 'active')
        ->with('tenant')
        ->first();

    if (!$membership) {
        // Not a member — could be wrong URL or old bookmark
        return redirect()->route('hub')
            ->with('error', 'You do not have access to that store.');
    }

    $tenant = $membership->tenant;

    // Check trial expiry
    if ($tenant->status === 'trial' && $tenant->trial_ends_at?->isPast()) {
        $tenant->update(['status' => 'suspended']);
        return redirect()->route('trial.expired')->with('store_id', $storeId);
    }

    // Check store is accessible
    if (!in_array($tenant->status, ['trial', 'active'])) {
        return Inertia::render('Errors/StoreSuspended', [
            'store_name' => $tenant->name,
            'plan'       => $tenant->plan,
            'billing_url'=> route('store.billing', ['store_id' => $storeId]),
        ]);
    }

    // Bind — HasTenant reads this. Everything downstream is unchanged.
    app()->instance('current.tenant', $tenant);
    app()->instance('current.membership', $membership);

    // Update last_store_id after response (no added latency)
    if ($user->last_store_id !== $tenant->id) {
        dispatch(function () use ($user, $tenant) {
            $user->update(['last_store_id' => $tenant->id]);
        })->afterResponse();
    }

    // Share globally with all Inertia pages
    Inertia::share([
        'store' => [
            'id'              => $tenant->id,
            'name'            => $tenant->name,
            'plan'            => $tenant->plan,
            'status'          => $tenant->status,
            'currency_symbol' => $tenant->currency_symbol,
            'currency_code'   => $tenant->currency_code,
            'trial_ends_at'   => $tenant->trial_ends_at,
            'features'        => [
                'variants'      => $tenant->feature_variants,
                'serials'       => $tenant->feature_serials,
                'batches'       => $tenant->feature_batches,
                'manufacturing' => $tenant->feature_manufacturing,
            ],
        ],
        'my_role'         => $membership->role,
        'my_display_name' => $membership->display_name ?? $user->name,
        'my_pos_pin_set'  => !is_null($membership->pos_pin),
    ]);

    return $next($request);
}
```

---

## Login Flow (Final)

```php
public function store(LoginRequest $request): RedirectResponse
{
    $request->authenticate();
    $request->session()->regenerate();

    $user = Auth::user();

    $memberships = TenantUser::where('user_id', $user->id)
        ->where('status', 'active')
        ->with('tenant')
        ->get()
        ->filter(fn($m) => in_array($m->tenant->status, ['trial', 'active']));

    // 0 stores: new user — create or join
    if ($memberships->isEmpty()) {
        return redirect()->route('store.create-or-join');
    }

    // 1 store: go straight in
    if ($memberships->count() === 1) {
        return redirect()->route('store.dashboard', [
            'store_id' => $memberships->first()->tenant_id
        ]);
    }

    // 2+ stores: try last used first
    if ($user->last_store_id) {
        $lastStore = $memberships->firstWhere('tenant_id', $user->last_store_id);
        if ($lastStore) {
            return redirect()->route('store.dashboard', [
                'store_id' => $user->last_store_id
            ]);
        }
    }

    // 2+ stores, no last preference: show hub
    return redirect()->route('hub');
}
```

---

## Routes (Final, Complete)

```php
// routes/web.php

// Public
Route::get('/', [MarketingController::class, 'index'])->name('home');
Route::get('/pricing', [MarketingController::class, 'pricing'])->name('pricing');
Route::get('/demo', fn() => redirect('/s/' . config('app.demo_store_id') . '/dashboard'));
Route::get('/terms', fn() => Inertia::render('Legal/Terms'));
Route::get('/privacy', fn() => Inertia::render('Legal/Privacy'));
Route::post('/webhooks/lemon-squeezy', [LemonSqueezyWebhookController::class, 'handle'])
    ->middleware('lemon-squeezy.signature');

// Guest only
Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'create'])->name('login');
    Route::post('/login', [LoginController::class, 'store']);
    Route::get('/register', [RegisterController::class, 'create'])->name('register');
    Route::post('/register', [RegisterController::class, 'store']);
    Route::get('/forgot-password', [PasswordController::class, 'create']);
    Route::post('/forgot-password', [PasswordController::class, 'email']);
    Route::get('/reset-password/{token}', [PasswordController::class, 'reset'])->name('password.reset');
    Route::post('/reset-password', [PasswordController::class, 'update']);
});

// Auth, no store context
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/hub', [HubController::class, 'index'])->name('hub');
    Route::get('/start', [StoreController::class, 'createOrJoin'])->name('store.create-or-join');
    Route::get('/new-store', [StoreController::class, 'create'])->name('store.create');
    Route::post('/new-store', [StoreController::class, 'store']);
    Route::get('/join', [StaffController::class, 'joinForm'])->name('store.join');
    Route::post('/join', [StaffController::class, 'joinWithCode']);
    Route::get('/invite/{token}', [StaffController::class, 'acceptInvite'])->name('invite.accept');
    Route::get('/redeem', [AppSumoController::class, 'form'])->name('redeem');
    Route::post('/redeem', [AppSumoController::class, 'redeem']);
    Route::get('/account', [AccountController::class, 'edit'])->name('account.edit');
    Route::patch('/account', [AccountController::class, 'update']);
    Route::delete('/logout', [LoginController::class, 'destroy'])->name('logout');
    Route::get('/api/my-stores', [HubController::class, 'apiList']); // for switcher dropdown
});

// Store context routes — all require auth + valid store membership
Route::middleware(['auth', 'verified', 'tenant'])
    ->prefix('s/{store_id}')
    ->name('store.')
    ->group(function () {

        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
        Route::get('/setup', [SetupController::class, 'index'])->name('setup');
        Route::post('/setup', [SetupController::class, 'complete']);

        // POS
        Route::get('/pos', [PosController::class, 'index'])->name('pos');
        Route::post('/pos/sale', [PosController::class, 'completeSale'])->name('pos.sale');
        Route::get('/pos/products', [PosSearchController::class, 'search'])->name('pos.search');
        Route::post('/pos/open-session', [PosController::class, 'openSession'])->name('pos.open');
        Route::post('/pos/close-session', [PosController::class, 'closeSession'])->name('pos.close');

        // Inventory
        Route::resource('products', ProductController::class);
        Route::resource('categories', CategoryController::class);
        Route::resource('warehouses', WarehouseController::class);
        Route::post('/stock-adjustment', [StockController::class, 'adjust'])->name('stock.adjust');
        Route::post('/stock-transfer', [StockController::class, 'transfer'])->name('stock.transfer');

        // Parties (customers & suppliers)
        Route::resource('parties', PartyController::class);

        // Sales & Purchases
        Route::resource('sales', SaleController::class);
        Route::resource('purchases', PurchaseController::class);
        Route::resource('invoices', InvoiceController::class);

        // Accounting
        Route::get('/accounts', [AccountController::class, 'index'])->name('accounts');
        Route::resource('journal-entries', JournalEntryController::class);
        Route::get('/accounting/reconciliation', [ReconciliationController::class, 'index']);

        // Reports (all 38)
        Route::prefix('reports')->name('reports.')->group(function () {
            Route::get('/profit-loss', [ReportController::class, 'profitLoss']);
            Route::get('/balance-sheet', [ReportController::class, 'balanceSheet']);
            Route::get('/cash-flow', [ReportController::class, 'cashFlow']);
            Route::get('/sales-summary', [ReportController::class, 'salesSummary']);
            // ... all other reports
            Route::post('/export', [ReportController::class, 'export'])->name('export');
        });

        // Settings
        Route::get('/settings', [StoreSettingsController::class, 'index'])->name('settings');
        Route::patch('/settings/profile', [StoreSettingsController::class, 'updateProfile']);
        Route::patch('/settings/currency', [StoreSettingsController::class, 'updateCurrency']);
        Route::patch('/settings/features', [StoreSettingsController::class, 'updateFeatures']);

        // Staff management
        Route::get('/staff', [StaffController::class, 'index'])->name('staff');
        Route::post('/staff/invite', [StaffController::class, 'invite'])->name('staff.invite');
        Route::delete('/staff/{member}', [StaffController::class, 'remove'])->name('staff.remove');
        Route::patch('/staff/{member}', [StaffController::class, 'update'])->name('staff.update');

        // Billing (for this specific store)
        Route::get('/billing', [BillingController::class, 'index'])->name('billing');
        Route::get('/billing/portal', [BillingController::class, 'portal'])->name('billing.portal');
        // Lemon Squeezy customer portal handles all billing changes
    });

// Super admin (you only)
Route::middleware(['auth', 'superadmin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [AdminController::class, 'dashboard'])->name('dashboard');
    Route::get('/stores', [AdminController::class, 'stores'])->name('stores');
    Route::get('/users', [AdminController::class, 'users'])->name('users');
    Route::post('/stores/{tenant}/suspend', [AdminController::class, 'suspend']);
    Route::post('/stores/{tenant}/activate', [AdminController::class, 'activate']);
    Route::post('/appsumo/import', [AdminController::class, 'importAppSumoCodes']);
});
```

---

## Hostinger Cloud Professional — Honest Assessment

**6GB RAM, 4 CPU cores. Here is the truth:**

| Stage | Concurrent Users | Can Hostinger Handle It? |
|---|---|---|
| Beta (0–20 users) | 5–15 concurrent | Yes, comfortably |
| Early growth (20–60 users) | 15–40 concurrent | Yes, with PHP-FPM tuned |
| Pre-AppSumo (60–100 users) | 40–80 concurrent | Borderline — monitor closely |
| AppSumo launch day (200+ users) | 100–300 concurrent | No — will throw 503 errors |

**Tuning for Hostinger (do this now):**

Hostinger Cloud uses LiteSpeed web server, not Nginx. The good news: LiteSpeed handles PHP better than Nginx at the same specs. The tuning you need:

```
PHP Workers: Set to 20 in Hostinger hPanel → PHP Configuration
PHP Memory Limit: 256M
PHP Max Execution Time: 120
OPcache: Enable in hPanel → PHP Configuration → Extensions
```

**Redis on Hostinger:** Hostinger Cloud allows Redis via SSH. Enable it and configure your `.env`:
```
CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
```

Without Redis, your queue workers run on the database which adds load. With Redis, queues and cache are separated and Hostinger handles your beta traffic fine.

**The migration trigger:** When you hit 40 concurrent users consistently (check via `who` in SSH or Hostinger's bandwidth graph showing sustained high traffic), migrate to DigitalOcean. Not before — you are paying $0 extra right now, so stay until it actually hurts.

---

## ProvisionTenantJob (Final)

```php
class ProvisionTenantJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 30;

    public function __construct(private array $payload) {}

    public function handle(): void
    {
        DB::transaction(function () {
            $email    = $this->payload['user_email'];
            $name     = $this->payload['user_name'];
            $plan     = $this->resolvePlan($this->payload['variant_id']);
            $orderId  = $this->payload['order_id'];

            // Create or find the global user
            $password = Str::random(12);
            $user = User::firstOrCreate(
                ['email' => $email],
                ['name' => $name, 'password' => bcrypt($password)]
            );
            $isNewUser = $user->wasRecentlyCreated;

            // Create the store (tenant)
            $tenant = Tenant::create([
                'name'          => $name . "'s Store", // they rename in setup wizard
                'slug'          => $this->uniqueSlug($name),
                'plan'          => $plan,
                'status'        => 'trial',
                'trial_ends_at' => now()->addDays(14),
                'join_code'     => $this->generateJoinCode(),
                'currency_code' => 'USD',
                'lemon_squeezy_customer_id'     => $this->payload['customer_id'],
                'lemon_squeezy_subscription_id' => $this->payload['subscription_id'],
            ]);

            // Make user the owner
            TenantUser::create([
                'tenant_id' => $tenant->id,
                'user_id'   => $user->id,
                'role'      => 'owner',
                'status'    => 'active',
                'joined_at' => now(),
            ]);

            // Create and consume the license
            StoreLicense::create([
                'user_id'          => $user->id,
                'tenant_id'        => $tenant->id,
                'type'             => 'subscription',
                'status'           => 'consumed',
                'plan'             => $plan,
                'source'           => 'lemon_squeezy',
                'source_reference' => $orderId,
                'consumed_at'      => now(),
            ]);

            $user->update(['last_store_id' => $tenant->id]);

            // Seed defaults
            TenantDefaultSeeder::seedFor($tenant);
            Storage::disk('r2')->makeDirectory("tenants/{$tenant->id}");

            // Welcome email
            Mail::to($email)->queue(
                new TenantWelcomeMail($tenant, $user, $isNewUser ? $password : null)
                // If user already existed (bought a second store), don't send password
            );
        });
    }

    private function resolvePlan(string $variantId): string
    {
        return match($variantId) {
            config('services.lemon_squeezy.starter_variant') => 'starter',
            config('services.lemon_squeezy.growth_variant')  => 'growth',
            config('services.lemon_squeezy.business_variant')=> 'business',
            default => 'starter',
        };
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $i = 1;
        while (Tenant::where('slug', $slug)->exists()) {
            $slug = $base . '-' . $i++;
        }
        return $slug;
    }

    private function generateJoinCode(): string
    {
        do {
            $code = 'VQ-' . strtoupper(Str::random(4));
        } while (Tenant::where('join_code', $code)->exists());
        return $code;
    }
}
```

---

## The Complete Build Order (What to Actually Code)

Work through this in sequence. Each step is a prerequisite for the next.

```
STEP 1 — DATABASE (2 days)
□ Write migration: store_licenses table
□ Write migration: tenant_users table
□ Write migration: appsumo_codes table
□ Write migration: update tenants (add slug, join_code, feature flags, remove subdomain)
□ Write migration: update users (remove tenant_id, add last_store_id)
□ Update TenantZeroSeeder:
    - Creates TenantUser record (role=owner) for existing AMD Outlets users
    - Creates a consumed StoreLicense for the existing store
    - Sets last_store_id on existing users
□ Test migrations locally: fresh migrate + seeder passes
□ Verify: SELECT COUNT(*) FROM products WHERE tenant_id IS NULL = 0

STEP 2 — MODELS (1 day)
□ Update User model: remove HasTenant, add tenantMemberships(), activeTenants()
□ Create TenantUser model with relationships
□ Create StoreLicense model
□ Create AppSumoCode model
□ Update Tenant model: add memberships(), owner(), ownerEmail()
□ All other models (Product, Sale, etc.): HasTenant unchanged

STEP 3 — MIDDLEWARE (1 day)
□ Rewrite TenantMiddleware to read store_id from URL route parameter
□ Update rate limiting in RouteServiceProvider to use tenant ID from route
□ Test: two browser tabs, two different store_ids, confirm isolation

STEP 4 — AUTH CONTROLLERS (1 day)
□ Update LoginController: 3-case routing (0/1/2+ stores)
□ Update RegisterController: auto-create trial StoreLicense on registration
□ Password reset: confirm it works on venqore.com without store context

STEP 5 — STORE MANAGEMENT (2 days)
□ HubController: store list page + /api/my-stores endpoint
□ StoreController: create-or-join page, create store with license check
□ AppSumoController: redemption form + stacking logic
□ BillingController: Lemon Squeezy customer portal redirect

STEP 6 — STAFF SYSTEM (1 day)
□ StaffController: invite (email-locked), acceptInvite, joinWithCode
□ Staff update: display name override, role change, suspend
□ Invite email template
□ Join code generation on tenant create

STEP 7 — ROUTES (0.5 days)
□ Rewrite routes/web.php to final structure above
□ Update all route() helper calls in controllers to include store_id
□ Update all Inertia Link components to use new URLs

STEP 8 — FRONTEND PAGES (2 days)
□ Hub/Index.jsx: store picker with pending invites
□ Store/CreateOrJoin.jsx: new user landing
□ Store/Create.jsx: new store form
□ Store/NeedsLicense.jsx: upgrade prompt
□ Redeem.jsx: AppSumo code entry with stacking feedback
□ Auth/StoreSwitcher.jsx: in-app dropdown, lazy loads, shows active store
□ Update all pages: replace hardcoded currency with {store.currency_symbol}

STEP 9 — PROVISIONING (0.5 days)
□ Update ProvisionTenantJob to use new schema
□ Update LemonSqueezyWebhookController for all event types
□ Test full flow: simulated webhook → job runs → store created → email sent

STEP 10 — CLEANUP (0.5 days)
□ Remove config/session.php domain trick (back to null)
□ Remove wildcard Nginx config (not needed)
□ Update Pre-Launch checklist: remove subdomain tests, add URL-based tests
□ Run full checklist from Section 3 (isolation tests with new architecture)
```

**Total estimated time: 11-13 focused development days**

---

## What Stays Exactly the Same

Zero changes needed to:
- `HasTenant` trait and all global query scopes
- `tenant_id` on all data tables
- All 38 ERP reports (they read from `app('current.tenant')` — unchanged)
- PlanGate service and config/plans.php
- Cloudflare R2 storage paths (`tenants/{tenant_id}/...`)
- Laravel Horizon and all queue configuration
- POS search API
- Onboarding setup wizard logic
- Admin super-dashboard
- All email templates except welcome email (minor update)
- WooCommerce sync
- Manufacturing/BOM logic
- All accounting engine code

---

## The AppSumo Launch Sequence

```
Month 1-2: Build the 10 steps above. Beta with 5-10 real users on Hostinger.
Month 3:   Apply to AppSumo at sell.appsumo.com
           Requirements before applying:
           □ venqore.com live with demo at /demo
           □ 5+ real paying users (even at discount)
           □ Support email responds within 12 hours
           □ No critical bugs in core POS → sale → report flow
           □ Refund policy: 60 days (AppSumo requires this)

Month 4:   AppSumo review period (2-6 weeks)
           During this time: migrate to DigitalOcean $24/month

Month 5:   AppSumo launch
           Target: 100-300 LTD sales = $7,900-$23,700
           This funds: VPS upgrade, first support hire, 6 months runway

Month 6+:  Recurring subscriptions growing
           $19/$39/$79 per month
           LTD users on $9/month hosting after 2 years
```

---

## The Single Number to Track

**MRR (Monthly Recurring Revenue)**

When this hits $3,000:
- Server ($25) covered
- Support hire ($300) covered  
- Your living expenses covered
- Everything above is profit or reinvestment

When this hits $8,000:
- You hire a part-time developer
- You are no longer the only person fixing bugs
- You wake up, check the dashboard, build the next feature

That is the business. The architecture above is how you get there without rebuilding anything twice.
```
