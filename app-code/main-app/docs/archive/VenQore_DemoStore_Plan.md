# VenQore — Demo Store Master Plan
**Goal:** A single shared demo store that any visitor can explore in any role, resets every 24 hours, handles 100 concurrent users without crashing, and converts visitors into paying customers.

---

## The Core Concept

The demo store is not a real tenant. It is a special read-mostly environment where:
- Anyone can log in instantly as any role with one click
- All users share the same live data (sales made by one user are visible to all)
- The store resets to a clean seed state every day at 6:00 AM UTC
- Users cannot change passwords, delete the store, or touch billing
- A countdown shows when the next reset is
- A "Buy Now" button is always visible
- Your platform dashboard shows how many people visited the demo today

---

## The Architecture Decision: Shared Session, Isolated Read

**The problem with 100 concurrent users:** If each demo visitor gets a real Laravel session attached to the demo tenant, and all 100 are making sales simultaneously, the POS will have race conditions, stock will go negative, and the journal will be corrupted within minutes.

**The solution:** Demo users are read-heavy, write-limited.

- Every demo user is logged in as a read-only observer by default
- Write actions (create sale, add product, adjust stock) are allowed but rate-limited per IP
- Writes go through a Demo Write Queue — serialized, never concurrent
- The UI shows a live activity feed: "Ahmed just made a sale of $240" — this makes it feel alive without every user needing to write

This means 100 users can browse simultaneously with zero performance impact. Only the rare user who actually tries to create a transaction hits the write path.

---

## Section 1 — The Demo Tenant Record

### Database Setup

```php
// The demo tenant is a normal tenant record with a special flag
// Add to tenants table:
$table->boolean('is_demo')->default(false);
$table->timestamp('demo_reset_at')->nullable(); // when it last reset
$table->unsignedInteger('demo_visit_count')->default(0); // total all-time visits
$table->unsignedInteger('demo_visit_today')->default(0); // resets daily
```

### Create the demo tenant manually (one time):

```php
// php artisan tinker
Tenant::create([
    'name'            => 'VenQore Demo Store',
    'slug'            => 'demo',
    'plan'            => 'business',    // show ALL features
    'status'          => 'active',
    'is_demo'         => true,
    'currency_code'   => 'USD',
    'currency_symbol' => '$',
    'timezone'        => 'UTC',
    'setup_completed' => true,
    'industry'        => 'fashion',     // rich demo data
    'feature_variants'      => true,
    'feature_serials'       => false,
    'feature_batches'       => false,
    'feature_manufacturing' => false,
    'trial_ends_at'   => null,          // never expires
]);
```

### The demo slug is reserved:

```php
// app/Services/SubdomainGenerator.php — add to RESERVED array:
private const RESERVED = [
    'demo', 'admin', 'api', 'www', // ... rest of list
];
```

---

## Section 2 — Demo Role Login System

### The Public Demo Login Page

URL: `venqore.com/demo`

This page never asks for email or password. It shows role cards:

```
┌─────────────────────────────────────────────────┐
│           Try VenQore — Live Demo                │
│   No sign-up. No credit card. Click any role.    │
│                                                   │
│  [👑 Store Owner]    [⚙️ Store Admin]             │
│  Full access         Operations access            │
│                                                   │
│  [📊 Manager]        [💰 Cashier]                 │
│  Reports & floor     POS only                     │
│                                                   │
│  [📦 Accountant]     [🛒 Purchasing Officer]      │
│  Finance view        Procurement view             │
│                                                   │
│  [👁️ Viewer]                                      │
│  Read-only reports                                │
│                                                   │
│  ⏱️ Demo resets in: 14h 32m                       │
│  🔴 LIVE: 7 people exploring right now           │
└─────────────────────────────────────────────────┘
```

### How it works technically

Each role card POSTs to `/demo/login` with the role name. No password needed.

```php
// routes/web.php — public routes
Route::get('/demo', [DemoController::class, 'landing'])->name('demo.landing');
Route::post('/demo/login', [DemoController::class, 'login'])->name('demo.login');
Route::post('/demo/logout', [DemoController::class, 'logout'])->name('demo.logout');
```

```php
// app/Http/Controllers/DemoController.php

public function login(Request $request): RedirectResponse
{
    $role = $request->input('role', 'cashier');
    $allowedRoles = ['owner','admin','manager','cashier','accountant','purchasing_officer','viewer'];

    if (!in_array($role, $allowedRoles)) {
        $role = 'cashier';
    }

    $demoTenant = Tenant::where('is_demo', true)->firstOrFail();

    // Find or create a demo user for this role
    // Each role has one shared demo user account
    $demoUser = User::firstOrCreate(
        ['email' => "demo-{$role}@venqore-demo.internal"],
        [
            'name'     => 'Demo ' . ucfirst($role),
            'password' => bcrypt(Str::random(64)), // random, never used directly
        ]
    );

    // Ensure TenantUser record exists for this demo user
    TenantUser::firstOrCreate(
        ['tenant_id' => $demoTenant->id, 'user_id' => $demoUser->id],
        ['role' => $role, 'status' => 'active', 'joined_at' => now()]
    );

    // Log in this demo user
    Auth::login($demoUser, false); // false = don't remember
    $request->session()->regenerate();

    // Track the visit
    $demoTenant->increment('demo_visit_count');
    $demoTenant->increment('demo_visit_today');
    Cache::increment('demo_visit_live'); // for the "X people exploring" counter
    Cache::put("demo_user_{$request->session()->getId()}", true, now()->addHours(2));

    // Set last_store_id so they go straight to the demo store
    $demoUser->update(['last_store_id' => $demoTenant->id]);

    return redirect()->route('store.dashboard', ['store_slug' => 'demo']);
}
```

### Demo user restrictions via DemoMiddleware

```php
// app/Http/Middleware/DemoMiddleware.php
// Applied to all store routes when the current tenant is_demo = true

public function handle(Request $request, Closure $next): mixed
{
    $tenant = app('current.tenant');

    if (!$tenant?->is_demo) {
        return $next($request); // not demo — pass through normally
    }

    // Block these actions in demo mode:
    $blockedRoutes = [
        'store.settings.update',       // cannot change store settings
        'store.staff.invite',           // cannot invite real staff
        'store.staff.remove',           // cannot remove demo staff
        'store.billing',                // cannot access billing
        'store.billing.portal',         // cannot access payment portal
        'store.admin.users.destroy',    // cannot delete users
        'store.admin.backups.store',    // cannot create backups
    ];

    if (in_array($request->route()->getName(), $blockedRoutes)) {
        return response()->json([
            'demo'    => true,
            'message' => 'This action is disabled in the demo store.',
            'cta'     => 'Start your free trial at venqore.com',
        ], 403);
    }

    // Block password changes specifically
    if ($request->routeIs('store.admin.users.update') &&
        $request->has('password')) {
        return response()->json([
            'demo'    => true,
            'message' => 'Passwords cannot be changed in the demo store.',
        ], 403);
    }

    // Rate limit writes per IP: max 20 write operations per hour
    $writeLimit = RateLimiter::attempt(
        'demo-write:' . $request->ip(),
        20,
        fn() => null,
        3600
    );

    if (!$writeLimit && in_array($request->method(), ['POST','PUT','PATCH','DELETE'])) {
        return response()->json([
            'demo'    => true,
            'message' => 'You have made many changes in the demo. Start your free trial for unlimited access.',
            'cta_url' => route('register'),
        ], 429);
    }

    return $next($request);
}
```

---

## Section 3 — The Demo UI Banner

Every page in the demo store shows a persistent banner. It cannot be dismissed.

```jsx
// resources/js/Components/DemoBanner.jsx

export default function DemoBanner({ resetAt }) {
    const [timeLeft, setTimeLeft] = useState('');
    const buyUrl = route('register'); // or pricing page

    useEffect(() => {
        const tick = () => {
            const now = new Date();
            const reset = new Date(resetAt);
            const diff = reset - now;
            if (diff <= 0) {
                setTimeLeft('Resetting soon...');
                return;
            }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            setTimeLeft(`${h}h ${m}m`);
        };
        tick();
        const interval = setInterval(tick, 60000);
        return () => clearInterval(interval);
    }, [resetAt]);

    return (
        <div className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 
                        text-white text-sm flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-3">
                <span className="font-semibold">🎯 DEMO MODE</span>
                <span className="opacity-80">You are exploring VenQore with sample data.</span>
                <span className="opacity-60 text-xs">Resets in {timeLeft}</span>
            </div>
            <a
                href={buyUrl}
                className="bg-white text-indigo-600 font-bold px-4 py-1 rounded-lg 
                           text-xs hover:bg-indigo-50 transition-colors whitespace-nowrap"
            >
                Start Free Trial →
            </a>
        </div>
    );
}
```

Add to `OneGlanceLayout.jsx` at the very top of the layout, above everything else:

```jsx
const { store, demo_reset_at, is_demo } = usePage().props;

{is_demo && <DemoBanner resetAt={demo_reset_at} />}
```

Share the demo props from `TenantMiddleware.php`:

```php
// In TenantMiddleware, inside the Inertia::share block:
Inertia::share([
    'store'          => [...],
    'is_demo'        => $tenant->is_demo,
    'demo_reset_at'  => $tenant->is_demo ? $this->getNextResetTime() : null,
    'demo_live_users'=> $tenant->is_demo ? Cache::get('demo_visit_live', 0) : null,
]);

private function getNextResetTime(): string
{
    // Next 6 AM UTC
    $next = now()->utc()->startOfDay()->addHours(6);
    if ($next->isPast()) {
        $next->addDay();
    }
    return $next->toIso8601String();
}
```

---

## Section 4 — The 24-Hour Reset System

### The Artisan Command

```php
// app/Console/Commands/ResetDemoStore.php

class ResetDemoStore extends Command
{
    protected $signature   = 'demo:reset {--force : Skip confirmation}';
    protected $description = 'Reset the demo store to its original seed state';

    public function handle(): void
    {
        $demo = Tenant::where('is_demo', true)->firstOrFail();

        $this->info("Resetting demo store: {$demo->name}");

        DB::transaction(function () use ($demo) {

            // 1. Delete all user-generated transactional data
            // Keep: products, categories, chart of accounts, staff
            // Delete: sales, purchases, journal entries, stock movements, expenses
            $tables = [
                'sales', 'sale_items', 'sale_item_batches',
                'purchases', 'purchase_items',
                'journal_entries', 'journal_items',
                'stock_movements',
                'expenses',
                'payments',
                'invoices', 'invoice_items',
                'debit_notes',
                'proposals',
                'pre_sales', 'pre_sale_items',
                'production_runs',
                'parked_sales',
                'notifications',
            ];

            foreach ($tables as $table) {
                if (Schema::hasTable($table)) {
                    DB::table($table)->where('tenant_id', $demo->id)->delete();
                    $this->line("  Cleared: {$table}");
                }
            }

            // 2. Reset stock quantities to seed values
            DB::table('stocks')
                ->where('tenant_id', $demo->id)
                ->update(['quantity' => 100, 'reserved_quantity' => 0]);

            // 3. Re-seed transactions
            $this->call('db:seed', ['--class' => 'DemoStoreTransactionSeeder', '--force' => true]);

            // 4. Update the reset timestamp
            $demo->update([
                'demo_reset_at'    => now(),
                'demo_visit_today' => 0,
            ]);

            // 5. Clear the live visit counter
            Cache::forget('demo_visit_live');
        });

        $this->info('Demo store reset complete.');
    }
}
```

### Schedule the reset

```php
// app/Console/Kernel.php
protected function schedule(Schedule $schedule): void
{
    // Reset demo store every day at 6:00 AM UTC
    $schedule->command('demo:reset --force')
             ->dailyAt('06:00')
             ->timezone('UTC')
             ->withoutOverlapping()
             ->runInBackground()
             ->onFailure(function () {
                 Log::error('Demo store reset FAILED');
                 // Send alert to your email/Slack
             });
}
```

### The Reset Notification Toast

15 minutes before reset, show a toast to all active demo users:

```php
// Add to DemoMiddleware — check on every request if close to reset
$nextReset = $this->getNextResetTime();
$minutesUntilReset = now()->diffInMinutes($nextReset, false);

if ($minutesUntilReset > 0 && $minutesUntilReset <= 15) {
    Inertia::share('demo_reset_warning', true);
    Inertia::share('demo_reset_minutes', $minutesUntilReset);
}
```

```jsx
// In DemoBanner.jsx — show warning when close to reset
{demoResetWarning && (
    <div className="fixed bottom-4 right-4 bg-orange-500 text-white p-4 
                    rounded-xl shadow-xl z-50 max-w-sm">
        <div className="font-bold">⚠️ Demo resets in {demoResetMinutes} minutes</div>
        <div className="text-sm mt-1 opacity-90">
            All demo data will be restored to its original state.
        </div>
        <a href={route('register')}
           className="mt-2 block text-center bg-white text-orange-500 
                      font-bold py-1 rounded-lg text-sm">
            Save your work — Start free trial
        </a>
    </div>
)}
```

---

## Section 5 — The Demo Seed Data

The demo store must look like a real, thriving business. Use USD currency, realistic product names with real images, and a mix of transaction history.

### DemoStoreSeeder (runs once at setup)

```php
// database/seeders/DemoStoreSeeder.php
// Seeds the PERMANENT data: products, categories, staff, chart of accounts

public function run(): void
{
    $demo = Tenant::where('is_demo', true)->firstOrFail();

    app()->instance('current.tenant', $demo);

    // Categories
    $categories = [
        ['name' => 'Men\'s Clothing', 'color' => '#3B82F6'],
        ['name' => 'Women\'s Clothing', 'color' => '#EC4899'],
        ['name' => 'Footwear', 'color' => '#F59E0B'],
        ['name' => 'Accessories', 'color' => '#8B5CF6'],
        ['name' => 'Kids', 'color' => '#10B981'],
    ];

    foreach ($categories as $cat) {
        Category::create(['tenant_id' => $demo->id, ...$cat]);
    }

    // Products — 30 realistic items with Unsplash image URLs
    $products = [
        [
            'name'        => 'Classic White Oxford Shirt',
            'sku'         => 'SHIRT-WHT-001',
            'sale_price'  => 49.99,
            'cost_price'  => 18.00,
            'image_url'   => 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400',
            'category'    => 'Men\'s Clothing',
        ],
        [
            'name'        => 'Slim Fit Dark Jeans',
            'sku'         => 'JEANS-DRK-001',
            'sale_price'  => 79.99,
            'cost_price'  => 28.00,
            'image_url'   => 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
            'category'    => 'Men\'s Clothing',
        ],
        [
            'name'        => 'Women\'s Floral Summer Dress',
            'sku'         => 'DRESS-FLR-001',
            'sale_price'  => 64.99,
            'cost_price'  => 22.00,
            'image_url'   => 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400',
            'category'    => 'Women\'s Clothing',
        ],
        [
            'name'        => 'White Leather Sneakers',
            'sku'         => 'SHOE-WHT-001',
            'sale_price'  => 89.99,
            'cost_price'  => 32.00,
            'image_url'   => 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400',
            'category'    => 'Footwear',
        ],
        [
            'name'        => 'Leather Belt - Brown',
            'sku'         => 'BELT-BRN-001',
            'sale_price'  => 34.99,
            'cost_price'  => 12.00,
            'image_url'   => 'https://images.unsplash.com/photo-1624222247344-0a92a9c4b4e6?w=400',
            'category'    => 'Accessories',
        ],
        // Add 25 more products following this pattern...
        // Aim for: 8 Men's, 8 Women's, 5 Footwear, 5 Accessories, 4 Kids
    ];

    foreach ($products as $p) {
        $category = Category::where('tenant_id', $demo->id)
                            ->where('name', $p['category'])->first();
        Product::create([
            'tenant_id'   => $demo->id,
            'name'        => $p['name'],
            'sku'         => $p['sku'],
            'sale_price'  => $p['sale_price'],
            'cost_price'  => $p['cost_price'],
            'image'       => $p['image_url'],
            'category_id' => $category?->id,
            'is_active'   => true,
        ]);
        // Set stock to 100 in default warehouse
        Stock::create([
            'tenant_id'  => $demo->id,
            'product_id' => $product->id,
            'quantity'   => 100,
        ]);
    }
}
```

### DemoStoreTransactionSeeder (runs on every reset)

```php
// database/seeders/DemoStoreTransactionSeeder.php
// Seeds TRANSACTION data that resets daily
// Creates realistic-looking historical data for the past 30 days

public function run(): void
{
    $demo = Tenant::where('is_demo', true)->firstOrFail();
    app()->instance('current.tenant', $demo);

    $products    = Product::where('tenant_id', $demo->id)->get();
    $customers   = Party::where('tenant_id', $demo->id)->where('type', 'customer')->get();
    $demoOwner   = User::where('email', 'demo-owner@venqore-demo.internal')->first();

    // Create 30 days of sales history
    for ($day = 30; $day >= 1; $day--) {
        $date = now()->subDays($day);
        $salesPerDay = rand(8, 25); // realistic retail volume

        for ($s = 0; $s < $salesPerDay; $s++) {
            $itemCount = rand(1, 4);
            $items = $products->random($itemCount);
            $total = 0;

            $sale = Sale::create([
                'tenant_id'    => $demo->id,
                'user_id'      => $demoOwner->id,
                'party_id'     => $customers->random()->id,
                'payment_type' => collect(['cash','card','transfer'])->random(),
                'created_at'   => $date->copy()->addHours(rand(9, 20)),
            ]);

            foreach ($items as $item) {
                $qty   = rand(1, 3);
                $price = $item->sale_price;
                $total += $qty * $price;

                SaleItem::create([
                    'tenant_id'  => $demo->id,
                    'sale_id'    => $sale->id,
                    'product_id' => $item->id,
                    'qty'        => $qty,
                    'price'      => $price,
                    'cost'       => $item->cost_price,
                ]);
            }

            $sale->update(['total' => $total, 'paid' => $total]);

            // Create corresponding journal entry
            // (call AccountingService to ensure proper double-entry)
        }
    }

    // Create a few purchase orders
    // Create a few expenses
    // This gives the reports meaningful data to display
}
```

---

## Section 6 — Platform Dashboard Demo Widget

The platform HQ dashboard gets a new card just for the demo store.

```php
// In AdminDashboardController::index() add:
'demo_stats' => [
    'visits_today'   => Tenant::where('is_demo', true)->value('demo_visit_today') ?? 0,
    'visits_total'   => Tenant::where('is_demo', true)->value('demo_visit_count') ?? 0,
    'live_now'       => Cache::get('demo_visit_live', 0),
    'next_reset'     => $this->getDemoNextReset(),
    'last_reset'     => Tenant::where('is_demo', true)->value('demo_reset_at'),
],
```

```jsx
// HQ Dashboard — Demo Store Card
<div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl p-5 text-white">
    <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">🎯 Demo Store</h3>
        <span className="text-xs bg-green-500 px-2 py-1 rounded-full">
            {demoStats.live_now} live now
        </span>
    </div>
    <div className="grid grid-cols-3 gap-4 text-center">
        <div>
            <div className="text-2xl font-bold">{demoStats.visits_today}</div>
            <div className="text-xs opacity-70">Today</div>
        </div>
        <div>
            <div className="text-2xl font-bold">{demoStats.visits_total}</div>
            <div className="text-xs opacity-70">All Time</div>
        </div>
        <div>
            <div className="text-sm font-bold">{demoStats.next_reset}</div>
            <div className="text-xs opacity-70">Next Reset</div>
        </div>
    </div>
    <button onClick={() => router.post(route('admin.demo.reset'))}
            className="mt-4 w-full text-xs bg-white/10 hover:bg-white/20 
                       py-2 rounded-lg transition-colors">
        Force Reset Now
    </button>
</div>
```

---

## Section 7 — Concurrency: Handling 100 Simultaneous Users

### Why it will not crash

1. **Read operations** (browsing products, viewing reports, looking at sales history) hit the database with no locks. 100 users reading simultaneously = no problem on a 4-core server.

2. **Write operations** (creating a sale, adding a product) are rate-limited to 20 per IP per hour. In practice, most demo visitors just browse. The few who write go through normal Laravel request handling.

3. **The demo store has no queue dependency** — no background jobs are triggered by demo transactions except the daily reset (which runs at 6 AM when traffic is lowest).

4. **Sessions are stateless** — demo users have lightweight sessions. No heavy data is stored in session. The session only holds the user_id and CSRF token.

5. **Database indexes** — the demo store's `tenant_id` is the same for all queries. All queries hit the composite index `(tenant_id, created_at)` which is already built. 100 concurrent reads against one tenant_id is fast.

### Redis caching for the live counter

```php
// Instead of hitting the database for live user count, use Redis:
// On demo login: Cache::increment('demo_visit_live');
// On demo logout/session expiry: Cache::decrement('demo_visit_live');
// The counter is approximate — that is fine for display purposes
```

### Queue isolation

The demo store's daily reset job runs on a dedicated queue:
```php
$schedule->command('demo:reset --force')
         ->dailyAt('06:00')
         ->onQueue('demo-reset'); // separate from main queue
```

---

## Section 8 — Security Rules for Demo Store

These rules prevent the demo from being abused or used to attack the platform.

| Rule | Implementation |
|---|---|
| Cannot change passwords | DemoMiddleware blocks password fields in update requests |
| Cannot delete the store | DemoMiddleware blocks store.admin routes for destructive ops |
| Cannot invite real staff | DemoMiddleware blocks staff.invite |
| Cannot access billing | DemoMiddleware blocks billing routes |
| Cannot export real data | Demo data is fake — but block CSV exports anyway |
| Rate limited writes | 20 write ops per IP per hour |
| Session timeout | Demo sessions expire after 2 hours of inactivity |
| No email sending | Demo sale emails are suppressed (log to file, not sent) |
| No WooCommerce sync | Feature disabled for demo tenant |
| IP logging | All demo writes logged with IP for abuse detection |

### Suppress email sending for demo:

```php
// app/Listeners/SuppressDemoEmails.php
// Register in EventServiceProvider

public function handle(MessageSending $event): bool
{
    $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;
    if ($tenant?->is_demo) {
        Log::info('Demo email suppressed: ' . $event->message->getSubject());
        return false; // returning false cancels the email
    }
    return true;
}
```

---

## Section 9 — The "Buy Now" Button in the Header

The existing trial countdown in the header gets replaced/supplemented for demo users.

```jsx
// In OneGlanceLayout.jsx — the header center area
// For demo users: show Buy Now button instead of trial days

{is_demo ? (
    <a
        href={route('register')}
        className="bg-gradient-to-r from-indigo-500 to-purple-500 
                   text-white font-bold px-6 py-2 rounded-xl text-sm
                   hover:from-indigo-600 hover:to-purple-600 
                   transition-all shadow-lg shadow-indigo-500/30
                   animate-pulse"
    >
        🚀 Start Free Trial
    </a>
) : (
    // existing trial countdown component
    <TrialCountdown daysLeft={trialDaysLeft} />
)}
```

---

## Section 10 — Build Order (Implementation Sequence)

```
□ Step 1 — Database
  □ Add is_demo, demo_reset_at, demo_visit_count, demo_visit_today to tenants table
  □ Run migration
  □ Create the demo tenant record manually

□ Step 2 — Seed the demo store
  □ Write DemoStoreSeeder (permanent data: products with images, categories, staff)
  □ Write DemoStoreTransactionSeeder (daily data: sales, purchases, expenses)
  □ Run: php artisan db:seed --class=DemoStoreSeeder
  □ Verify: log in and confirm products show with images, reports have data

□ Step 3 — Demo login page
  □ Create DemoController with landing() and login() methods
  □ Create resources/js/Pages/Demo/Landing.jsx with role cards
  □ Add routes to web.php (public, no auth required)
  □ Test: click each role card, confirm login and correct permissions

□ Step 4 — DemoMiddleware
  □ Create app/Http/Middleware/DemoMiddleware.php
  □ Register in Kernel.php
  □ Apply after TenantMiddleware in the store route group
  □ Test: try to change password in demo — confirm blocked

□ Step 5 — Demo banner and Buy Now button
  □ Create DemoBanner.jsx component
  □ Add to OneGlanceLayout.jsx
  □ Share is_demo and demo_reset_at from TenantMiddleware
  □ Test: demo store shows banner, non-demo stores do not

□ Step 6 — Reset command
  □ Create ResetDemoStore command
  □ Create DemoStoreTransactionSeeder
  □ Schedule in Kernel.php
  □ Test manually: php artisan demo:reset --force
  □ Verify: data is gone and re-seeded

□ Step 7 — Platform dashboard widget
  □ Add demo_stats to AdminDashboardController
  □ Add demo card to HQ dashboard JSX
  □ Add force reset button
  □ Test: visit demo as 3 different roles, check counter increments

□ Step 8 — Security hardening
  □ Confirm all DemoMiddleware blocks are working
  □ Test rate limiting: make 21 POSTs in quick succession
  □ Confirm email suppression works
  □ Confirm session expires after 2 hours

□ Step 9 — Final demo review
  □ Walk through the demo as each of the 7 roles
  □ Confirm reports show data
  □ Confirm POS works
  □ Confirm everything looks professional with real product images
  □ Share the demo URL with one real person and watch what they do
```

---

## The One Rule That Makes This Convert

The demo exists to make someone pull out their credit card. Every design decision should serve that goal.

The reset countdown creates urgency. The "7 people exploring right now" creates social proof. The role switching creates discovery. The "Start Free Trial" button in the banner should be the most visually prominent element on every demo page.

After someone spends 10 minutes in the demo as Store Owner and sees their P&L, their inventory dashboard, their POS working — the friction to sign up is nearly zero. They have already seen it work.
