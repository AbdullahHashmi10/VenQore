# VenQore — The Definitive SaaS Transformation Roadmap
**Version:** 1.0 — Master Technical Plan  
**Objective:** Transform the existing single-tenant Laravel 11 / Inertia.js / React monolith into a fully automated, globally-accessible, self-hosted SaaS capable of running thousands of tenants on a single server — with zero manual intervention on signups, zero data bleed between customers, and a payment system that runs while you sleep.

---

## How to Use This Document
This is your single source of truth for the next 4-6 weeks. Each phase is a prerequisite for the next. Do not skip ahead. Do not start Phase 2 until Phase 1 passes all its validation checks. The order is not arbitrary — it reflects the dependency chain of the architecture.

Every section includes:
- **What** needs to be built
- **Why** it cannot be skipped
- **The trap** that will burn you if you rush it
- **The validation** that tells you it is done correctly

---

## Pre-Work: The Audit Checklist (Do This Before Writing Any Code)

Before any migration, run these commands and document the output. This is your baseline.

```bash
# 1. List every table that needs tenant_id
php artisan db:show --counts

# 2. Find every place Product::all(), Sale::all(), etc. is called (no scope = danger)
grep -rn "::all()\|::get()\|DB::table" app/Http/Controllers/ --include="*.php"

# 3. Find every hardcoded currency symbol
grep -rn "Rs\.\|PKR\|\" $\"\|'£'" resources/js/ --include="*.jsx"

# 4. Find every place files are stored locally
grep -rn "Storage::put\|store('public')\|disk('public')" app/ --include="*.php"

# 5. Check current queue driver
php artisan about | grep -i queue

# 6. List all routes that would need tenant protection
php artisan route:list --except-vendor > routes_audit.txt
```

Document everything. These outputs become your checklist for knowing when each phase is complete.

---

## PHASE 0: Data Safety & Legacy Migration (Days 1-2)
**The rule:** You cannot touch your live database until this phase is complete. Your existing retail branches (AMD Outlets) are running live operations. One bad migration wipes real financial data.

### 0.1 — Create the Tenant Zero Script (CRITICAL — DO THIS FIRST)

This script must run BEFORE any new migration. It creates "Tenant 1" representing your existing business and assigns every existing row to it. Run it locally first, verify, then run on production.

```php
// database/seeders/TenantZeroSeeder.php
// This script is idempotent — safe to run multiple times

public function run(): void
{
    DB::transaction(function () {
        // Create your existing business as Tenant 1
        $tenantId = DB::table('tenants')->insertGetId([
            'id' => Str::uuid(),
            'name' => 'AMD Outlets', // your real business name
            'subdomain' => 'amd-outlets',
            'plan' => 'business',
            'status' => 'active',
            'trial_ends_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Tables that need tenant_id assigned to existing rows
        $tables = [
            'products', 'sales', 'sale_items', 'purchases', 'purchase_items',
            'parties', 'accounts', 'journal_entries', 'journal_entry_lines',
            'categories', 'warehouses', 'stocks', 'stock_movements',
            'invoices', 'invoice_items', 'expenses', 'payments',
            'users', 'settings',
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                // Only update rows that don't already have a tenant_id
                DB::table($table)
                    ->whereNull('tenant_id')
                    ->update(['tenant_id' => $tenantId]);
                
                $count = DB::table($table)->where('tenant_id', $tenantId)->count();
                $this->command->info("✓ {$table}: {$count} rows assigned to Tenant 1");
            }
        }
    });
}
```

**Validation:** After running, check: `SELECT COUNT(*) FROM products WHERE tenant_id IS NULL;` — must return 0.

### 0.2 — Backup Strategy Before Any Migration

```bash
# Before running ANY migration on production
mysqldump -u root -p venqore_db > backup_pre_saas_$(date +%Y%m%d_%H%M%S).sql

# Store in a safe location outside the project
cp backup_pre_saas_*.sql ~/backups/
```

Make this a habit. Never run a migration on production without a fresh backup from the last 5 minutes.

---

## PHASE 1: Multi-Tenancy Foundation (Days 2-8)
**Goal:** Absolute database isolation. 1,000 tenants on one server with zero data bleed.

### 1.1 — The Tenants Table

```php
// database/migrations/2026_XX_XX_create_tenants_table.php
Schema::create('tenants', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('name');
    $table->string('subdomain')->unique(); // shop-name (without .venqore.com)
    $table->enum('plan', ['starter', 'growth', 'business'])->default('starter');
    $table->enum('status', ['trial', 'active', 'suspended', 'cancelled'])->default('trial');
    $table->timestamp('trial_ends_at')->nullable();
    $table->string('lemon_squeezy_customer_id')->nullable()->index();
    $table->string('lemon_squeezy_subscription_id')->nullable()->index();
    $table->json('plan_limits')->nullable(); // override defaults per tenant if needed
    $table->string('timezone')->default('UTC');
    $table->string('currency_code', 3)->default('USD');
    $table->string('currency_symbol', 5)->default('$');
    $table->timestamp('subscription_ends_at')->nullable();
    $table->timestamps();
    $table->softDeletes();
});
```

### 1.2 — Add tenant_id to All Core Tables

```php
// Run after TenantZeroSeeder has been executed
// Add to: products, sales, sale_items, purchases, purchase_items,
//         parties, accounts, journal_entries, journal_entry_lines,
//         categories, warehouses, stocks, stock_movements,
//         invoices, invoice_items, expenses, payments, users, settings

Schema::table('products', function (Blueprint $table) {
    $table->foreignUuid('tenant_id')->after('id')->constrained('tenants')->cascadeOnDelete();
    $table->index(['tenant_id', 'created_at']); // composite index for report queries
    $table->index(['tenant_id', 'id']);
});
// Repeat pattern for all tables above
```

**Why composite indexes:** Every query in a multi-tenant system filters by tenant_id first. Without composite indexes, a report query on 1,000-tenant database does a full table scan. With them, it hits only the relevant partition.

### 1.3 — The HasTenant Trait

```php
// app/Traits/HasTenant.php
trait HasTenant
{
    protected static function bootHasTenant(): void
    {
        // Auto-assign tenant_id on creation
        static::creating(function ($model) {
            if (app()->bound('current.tenant') && !$model->tenant_id) {
                $model->tenant_id = app('current.tenant')->id;
            }
        });

        // Global scope: all queries automatically scoped to current tenant
        static::addGlobalScope('tenant', function (Builder $builder) {
            if (app()->bound('current.tenant')) {
                $builder->where($builder->getModel()->getTable() . '.tenant_id', app('current.tenant')->id);
            }
        });
    }

    // Escape hatch for super-admin operations only
    public static function withoutTenantScope(): Builder
    {
        return static::withoutGlobalScope('tenant');
    }
}
```

Apply this trait to every Eloquent model that has a `tenant_id` column.

### 1.4 — The TenantMiddleware

```php
// app/Http/Middleware/TenantMiddleware.php
public function handle(Request $request, Closure $next): Response
{
    $host = $request->getHost(); // e.g., shop1.venqore.com
    $appDomain = config('app.domain'); // venqore.com
    
    // Extract subdomain
    $subdomain = str_replace('.' . $appDomain, '', $host);
    
    // If no subdomain or it's the main domain, skip
    if ($subdomain === $appDomain || $subdomain === 'www') {
        return $next($request);
    }
    
    $tenant = Tenant::where('subdomain', $subdomain)
        ->whereIn('status', ['trial', 'active'])
        ->first();
    
    if (!$tenant) {
        abort(404, 'This store does not exist or has been suspended.');
    }

    // Check trial expiry
    if ($tenant->status === 'trial' && $tenant->trial_ends_at < now()) {
        $tenant->update(['status' => 'suspended']);
        return redirect()->route('trial.expired');
    }
    
    // Bind to the container — this is what HasTenant reads
    app()->instance('current.tenant', $tenant);
    
    // Share with all Inertia pages
    Inertia::share('tenant', [
        'name' => $tenant->name,
        'plan' => $tenant->plan,
        'currency_symbol' => $tenant->currency_symbol,
        'subdomain' => $tenant->subdomain,
    ]);

    return $next($request);
}
```

### 1.5 — Session Cookie Fix (The Inertia Cross-Subdomain Trap)

**The problem:** By default, Laravel's session cookie is scoped to the exact domain. A user on `shop1.venqore.com` who gets redirected to `venqore.com/billing` will be logged out. This causes constant mysterious logouts that are impossible to debug after the fact.

```php
// config/session.php
'domain' => env('SESSION_DOMAIN', '.venqore.com'), // note the leading dot

// .env
SESSION_DOMAIN=".venqore.com"
SESSION_SECURE_COOKIE=true  // HTTPS only in production
```

```php
// config/cors.php
'allowed_origins_patterns' => ['#^https://.*\.venqore\.com$#'],
'supports_credentials' => true,
```

```php
// config/sanctum.php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 
    'venqore.com,*.venqore.com,localhost'
)),
```

### 1.6 — Reserved Subdomain Blocklist (The Hijacking Trap)

```php
// app/Services/SubdomainGenerator.php
class SubdomainGenerator
{
    private const RESERVED = [
        'admin', 'app', 'api', 'www', 'mail', 'smtp', 'pop', 'imap',
        'demo', 'test', 'dev', 'staging', 'beta', 'alpha', 'preview',
        'billing', 'support', 'help', 'docs', 'status', 'blog',
        'static', 'assets', 'cdn', 'media', 'img', 'images',
        'dashboard', 'login', 'signup', 'register', 'logout',
        'venqore', 'system', 'root', 'null', 'undefined',
    ];

    public static function generate(string $businessName): string
    {
        // Slugify: "John's Shop & More!" → "johns-shop-more"
        $slug = Str::slug($businessName);
        
        // Ensure it's not reserved
        if (in_array($slug, self::RESERVED)) {
            $slug = $slug . '-' . rand(100, 999);
        }
        
        // Ensure it's unique in the database
        $original = $slug;
        $counter = 1;
        while (Tenant::where('subdomain', $slug)->exists()) {
            $slug = $original . '-' . $counter++;
        }
        
        return $slug;
    }
}
```

### 1.7 — Tenant-Aware Rate Limiting (The Noisy Neighbor Trap)

**The problem:** Without this, one tenant with a misbehaving WooCommerce webhook floods your server and takes down all other tenants.

```php
// app/Providers/RouteServiceProvider.php
protected function configureRateLimiting(): void
{
    // Global API limit per tenant — not per IP
    RateLimiter::for('api', function (Request $request) {
        $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;
        $key = $tenant ? 'tenant:' . $tenant->id : 'ip:' . $request->ip();
        
        return Limit::perMinute(120)->by($key)->response(function () {
            return response()->json([
                'message' => 'Too many requests. Please slow down.',
                'retry_after' => 60,
            ], 429);
        });
    });

    // Stricter limit for POS endpoint (prevent bot abuse)
    RateLimiter::for('pos', function (Request $request) {
        $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;
        $key = $tenant ? 'pos-tenant:' . $tenant->id : 'pos-ip:' . $request->ip();
        return Limit::perMinute(300)->by($key);
    });

    // Auth routes — prevent brute force
    RateLimiter::for('auth', function (Request $request) {
        return Limit::perMinute(10)->by($request->ip());
    });
}
```

### 1.8 — Soft Delete Enforcement (The Financial Cascade Trap)

**The problem:** Deleting a Category cascades to Products which cascades to Sales which breaks the accounting ledger entirely. In an ERP, historical financial data is legally required to be immutable.

```php
// Add softDeletes() to every model migration that touches financial data
// Models: Product, Category, Party, Account, Warehouse

// In ProductObserver or Product model:
protected static function boot(): void
{
    parent::boot();
    
    static::deleting(function (Product $product) {
        // Prevent deletion if product has any historical sales
        $hasSales = SaleItem::where('product_id', $product->id)->exists();
        $hasPurchases = PurchaseItem::where('product_id', $product->id)->exists();
        
        if ($hasSales || $hasPurchases) {
            throw new \Exception(
                "Cannot delete '{$product->name}' — it exists in historical transactions. Archive it instead."
            );
        }
    });
}
```

Apply the same guard to: Category (has products), Account (has journal entries), Party (has invoices/sales).

### Phase 1 Validation Checklist
```
□ php artisan migrate runs without errors
□ TenantZeroSeeder: SELECT COUNT(*) FROM products WHERE tenant_id IS NULL = 0
□ Test: Create tenant_a and tenant_b locally
□ Test: Add a product as tenant_a — confirm tenant_b cannot see it
□ Test: Log in as shop1.venqore.test — log in as shop2.venqore.test — sessions are independent
□ Test: Try to create subdomain "admin" — confirm it gets blocked and renamed
□ Test: Delete a product with historical sales — confirm it throws an error
□ Test: Hit /api/products 150 times in 60 seconds — confirm 429 after 120 requests
```

---

## PHASE 2: The Auto-Provisioning Engine (Days 9-11)
**Goal:** A customer pays → everything happens automatically → they log in → you are never involved.

### 2.1 — Lemon Squeezy Webhook Listener

```php
// routes/api.php
Route::post('/webhooks/lemon-squeezy', [LemonSqueezyWebhookController::class, 'handle'])
    ->middleware('lemon-squeezy.signature'); // verify webhook signature

// app/Http/Controllers/LemonSqueezyWebhookController.php
public function handle(Request $request): JsonResponse
{
    $event = $request->input('meta.event_name');
    $data = $request->input('data');

    match($event) {
        'subscription_created', 'order_created' => $this->handleNewSubscription($data),
        'subscription_updated'                   => $this->handlePlanChange($data),
        'subscription_cancelled'                 => $this->handleCancellation($data),
        'subscription_expired'                   => $this->handleExpiry($data),
        'subscription_payment_failed'            => $this->handlePaymentFailure($data),
        default                                  => null,
    };

    return response()->json(['ok' => true]);
}

private function handleNewSubscription(array $data): void
{
    // Always dispatch to a queue — never process synchronously in a webhook
    ProvisionTenantJob::dispatch($data)->onQueue('provisioning');
}
```

### 2.2 — The ProvisionTenantJob

```php
// app/Jobs/ProvisionTenantJob.php
class ProvisionTenantJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 30; // retry after 30 seconds

    public function handle(): void
    {
        DB::transaction(function () {
            // 1. Extract customer info from Lemon Squeezy payload
            $email = $this->data['attributes']['user_email'];
            $name = $this->data['attributes']['user_name'];
            $variantId = $this->data['attributes']['variant_id'];
            $plan = $this->resolvePlan($variantId); // 'starter'|'growth'|'business'

            // 2. Generate unique subdomain
            $subdomain = SubdomainGenerator::generate($name);

            // 3. Create tenant record
            $tenant = Tenant::create([
                'id' => Str::uuid(),
                'name' => $name,
                'subdomain' => $subdomain,
                'plan' => $plan,
                'status' => 'trial',
                'trial_ends_at' => now()->addDays(14),
                'lemon_squeezy_customer_id' => $this->data['attributes']['customer_id'],
                'lemon_squeezy_subscription_id' => $this->data['id'],
                'currency_code' => 'USD',
                'currency_symbol' => '$',
            ]);

            // 4. Create admin user
            $password = Str::random(12);
            $user = User::create([
                'tenant_id' => $tenant->id,
                'name' => $name,
                'email' => $email,
                'password' => bcrypt($password),
                'role' => 'platform_admin',
            ]);

            // 5. Seed tenant defaults (chart of accounts, settings)
            TenantDefaultSeeder::seedFor($tenant);

            // 6. Create R2 storage folder
            Storage::disk('r2')->makeDirectory("tenants/{$tenant->id}");

            // 7. Send welcome email
            Mail::to($email)->send(new TenantWelcomeMail($tenant, $user, $password));

            // 8. Log for your admin dashboard
            Log::info("Tenant provisioned: {$subdomain}.venqore.com for {$email}");
        });
    }

    private function resolvePlan(string $variantId): string
    {
        return match($variantId) {
            config('lemon.starter_variant_id')  => 'starter',
            config('lemon.growth_variant_id')   => 'growth',
            config('lemon.business_variant_id') => 'business',
            default => 'starter',
        };
    }
}
```

### 2.3 — Wildcard DNS + SSL (Infrastructure Step)

This is a one-time server setup. Without wildcard DNS, new subdomains won't resolve.

```bash
# On Cloudflare DNS:
# Add a wildcard A record:
# Type: A | Name: * | Content: YOUR_SERVER_IP | Proxy: YES (orange cloud)
# Type: A | Name: @ | Content: YOUR_SERVER_IP | Proxy: YES

# On your DigitalOcean server, install Certbot with wildcard SSL:
sudo apt install certbot python3-certbot-dns-cloudflare
# Configure Cloudflare API token in /etc/letsencrypt/cloudflare.ini
sudo certbot certonly --dns-cloudflare \
  --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \
  -d "venqore.com" -d "*.venqore.com"

# Update Nginx config to handle wildcard subdomains:
# /etc/nginx/sites-available/venqore
server {
    listen 443 ssl;
    server_name *.venqore.com venqore.com;
    ssl_certificate /etc/letsencrypt/live/venqore.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/venqore.com/privkey.pem;
    # ... rest of config
}
```

### 2.4 — Email Flows (The Lifecycle Engine)

These emails run the business while you sleep. Every single one must be in a queued job.

```
Welcome Email        → fires immediately on ProvisionTenantJob completion
Trial Day 7 Warning  → "7 days left on your trial"
Trial Day 12 Warning → "2 days left — your data will be preserved"
Trial Expired        → "Your trial has ended — add a card to continue"
Payment Failed       → "We couldn't charge your card — update billing"
Payment Recovered    → "Payment successful — you're back!"
Cancellation         → "Your account will close on [date] — export your data"
Data Deletion Notice → "Your data will be deleted in 30 days"
```

```php
// app/Console/Kernel.php
protected function schedule(Schedule $schedule): void
{
    $schedule->command('tenants:send-trial-reminders')->dailyAt('09:00');
    $schedule->command('tenants:process-expired-trials')->hourly();
    $schedule->command('tenants:cleanup-dead-accounts')->monthlyOn(1, '03:00');
}
```

### 2.5 — Dead Account Cleanup (The Storage Liability Trap)

**The problem:** 500 abandoned trials = potentially 500GB of orphaned product images on R2. You pay for storage you get zero value from.

```php
// app/Console/Commands/CleanupDeadAccounts.php
public function handle(): void
{
    $deadline = now()->subDays(60);
    
    $deadTenants = Tenant::where('status', 'cancelled')
        ->orWhere(function ($q) use ($deadline) {
            $q->where('status', 'suspended')
              ->where('trial_ends_at', '<', $deadline);
        })
        ->get();

    foreach ($deadTenants as $tenant) {
        // Delete in chunks to avoid memory overflow
        $tables = ['sale_items', 'sales', 'products', 'journal_entry_lines', 
                   'journal_entries', 'accounts', 'parties', 'users'];
        
        foreach ($tables as $table) {
            DB::table($table)
                ->where('tenant_id', $tenant->id)
                ->chunkById(500, function ($rows) use ($table, $tenant) {
                    DB::table($table)->whereIn('id', $rows->pluck('id'))->delete();
                });
        }
        
        // Delete R2 folder
        Storage::disk('r2')->deleteDirectory("tenants/{$tenant->id}");
        
        // Finally delete the tenant record itself
        $tenant->forceDelete();
        
        $this->info("Cleaned up tenant: {$tenant->subdomain}");
    }
}
```

### Phase 2 Validation Checklist
```
□ Lemon Squeezy sandbox: simulate a payment → ProvisionTenantJob fires
□ New tenant record created with correct plan
□ New user record created and attached to tenant
□ Welcome email received with correct subdomain and credentials
□ Log in to new-subdomain.venqore.test — lands on onboarding wizard
□ Wildcard SSL: https://anything.venqore.com shows a valid certificate
□ Test reserved subdomain: business named "Admin" gets "admin-391" or similar
□ Simulate trial expiry → account status changes to suspended
□ Cleanup command: create a cancelled tenant 61 days old → run command → verify rows deleted
```

---

## PHASE 3: Performance & Infrastructure (Days 12-15)
**Goal:** The server does not become slow or crash when multiple tenants do heavy operations simultaneously.

### 3.1 — Fix the POS Timebomb (The Browser Memory Crash)

**The problem:** `PosController::index()` currently loads the entire product catalog into the Inertia response. At 5,000 SKUs on the Growth plan, this is a multi-megabyte JSON blob that freezes the browser.

```php
// NEW: app/Http/Controllers/PosApiController.php
// Lightweight, paginated, tenant-scoped product search for POS

public function search(Request $request): JsonResponse
{
    $query = $request->get('q', '');
    $perPage = 20;

    $products = Product::select('id', 'name', 'sku', 'sale_price', 'barcode')
        ->with(['stocks' => fn($q) => $q->where('warehouse_id', $request->get('warehouse_id'))])
        ->when($query, fn($q) => 
            $q->where('name', 'LIKE', "%{$query}%")
              ->orWhere('sku', 'LIKE', "%{$query}%")
              ->orWhere('barcode', $query) // exact barcode match
        )
        ->where('is_active', true)
        ->limit($perPage)
        ->get();

    return response()->json($products);
}
```

```jsx
// resources/js/Pages/Pos/Index.jsx
// Replace the static product list with a search-as-you-type fetch

const [query, setQuery] = useState('');
const [results, setResults] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
    const timeout = setTimeout(async () => {
        if (query.length < 1) { setResults([]); return; }
        setLoading(true);
        const res = await axios.get('/api/pos/products', { params: { q: query } });
        setResults(res.data);
        setLoading(false);
    }, 250); // 250ms debounce

    return () => clearTimeout(timeout);
}, [query]);
```

**Remove from PosController::index():** Any `Product::with(...)->get()` or `Product::all()` call. The initial POS page load should pass ZERO products. Products are fetched on demand via the search API.

### 3.2 — Queue Everything Heavy

**Install Redis and Laravel Horizon:**

```bash
sudo apt install redis-server
composer require laravel/horizon
php artisan horizon:install
```

```php
// config/horizon.php — define queue workers per priority
'environments' => [
    'production' => [
        'supervisor-high' => [
            'queue' => ['provisioning', 'emails', 'high'],
            'processes' => 3,
            'tries' => 3,
        ],
        'supervisor-default' => [
            'queue' => ['default'],
            'processes' => 2,
        ],
        'supervisor-low' => [
            'queue' => ['woocommerce-sync', 'exports', 'low'],
            'processes' => 1,
        ],
    ],
],
```

**Move these operations to queued jobs:**

| Operation | Current State | Fix |
|---|---|---|
| WooCommerce stock sync | Synchronous console command | `SyncStockToWooCommerceJob` on `woocommerce-sync` queue |
| AutoManufacturing BOM | Synchronous in sale creation | `ProcessBomDeductionJob` on `default` queue |
| Report exports (PDF/Excel) | Blocking HTTP request | `GenerateReportJob` on `exports` queue |
| Welcome emails | Must already be queued | `TenantWelcomeMail` on `emails` queue |
| Trial reminder emails | Must be queued | `SendTrialReminderJob` on `emails` queue |

### 3.3 — Cloudflare R2 Storage Migration

```bash
composer require league/flysystem-aws-s3-v3
```

```php
// config/filesystems.php
'r2' => [
    'driver' => 's3',
    'key'    => env('CLOUDFLARE_R2_ACCESS_KEY_ID'),
    'secret' => env('CLOUDFLARE_R2_SECRET_ACCESS_KEY'),
    'region' => 'auto',
    'bucket' => env('CLOUDFLARE_R2_BUCKET'),
    'url'    => env('CLOUDFLARE_R2_URL'), // your public bucket URL
    'endpoint' => env('CLOUDFLARE_R2_ENDPOINT'), // https://ACCOUNT_ID.r2.cloudflarestorage.com
    'use_path_style_endpoint' => true,
],
```

**File path convention (tenant isolation on storage level):**
```
tenants/{tenant_id}/products/{filename}
tenants/{tenant_id}/receipts/{filename}
tenants/{tenant_id}/exports/{filename}
```

**Update InventoryController image upload:**
```php
// Replace: $path = $request->file('image')->store('products', 'public');
// With:
$tenantId = app('current.tenant')->id;
$path = $request->file('image')->store("tenants/{$tenantId}/products", 'r2');
```

### Phase 3 Validation Checklist
```
□ POS page loads in under 1 second with zero products
□ Typing 3 characters in POS search returns results in under 500ms
□ php artisan horizon:status shows workers running
□ Dispatch a SyncStockToWooCommerceJob — verify it runs without blocking HTTP response
□ Upload a product image — verify it appears in R2 bucket under tenants/{id}/products/
□ Product image URLs are accessible via your R2 public URL
□ Two tenants uploading images simultaneously — verify folders are separate
```

---

## PHASE 4: Plan Gating & Subscription Enforcement (Days 16-18)
**Goal:** Starter plan users cannot use Growth features. The pricing tiers are enforced in code, not on the honor system.

### 4.1 — Plan Limits Configuration

```php
// config/plans.php
return [
    'starter' => [
        'locations'   => 1,
        'sku_limit'   => 1000,
        'staff_limit' => 3,
        'woocommerce' => false,
        'api_access'  => false,
    ],
    'growth' => [
        'locations'   => 3,
        'sku_limit'   => null, // unlimited
        'staff_limit' => 10,
        'woocommerce' => true,
        'api_access'  => false,
    ],
    'business' => [
        'locations'   => null,
        'sku_limit'   => null,
        'staff_limit' => null,
        'woocommerce' => true,
        'api_access'  => true,
    ],
];
```

### 4.2 — The PlanGate Helper

```php
// app/Services/PlanGate.php
class PlanGate
{
    public static function check(string $feature, $currentCount = null): bool
    {
        $tenant = app('current.tenant');
        $limits = config("plans.{$tenant->plan}");
        $limit  = $limits[$feature] ?? null;

        if ($limit === null) return true; // unlimited
        if ($limit === false) return false; // feature disabled for this plan
        if ($currentCount !== null) return $currentCount < $limit;
        return true;
    }

    public static function enforce(string $feature, $currentCount = null): void
    {
        if (!self::check($feature, $currentCount)) {
            throw new PlanLimitException($feature);
        }
    }
}
```

### 4.3 — Inject Gates at the Right Points

```php
// InventoryController::store() — SKU limit
$skuCount = Product::count(); // HasTenant scope auto-filters by tenant
PlanGate::enforce('sku_limit', $skuCount);

// WarehouseController::store() — location limit
$locationCount = Warehouse::count();
PlanGate::enforce('locations', $locationCount);

// UserController::store() — staff limit
$staffCount = User::count();
PlanGate::enforce('staff_limit', $staffCount);

// SyncController — WooCommerce feature gate
PlanGate::enforce('woocommerce');
```

### 4.4 — Frontend Upgrade Prompts

When a PlanLimitException is thrown, the API returns a structured response:

```php
// app/Exceptions/PlanLimitException.php
public function render(): JsonResponse
{
    return response()->json([
        'type' => 'plan_limit',
        'message' => "You've reached the limit for your current plan.",
        'upgrade_url' => route('billing.upgrade'),
        'current_plan' => app('current.tenant')->plan,
    ], 403);
}
```

In React, intercept this globally in your Axios instance and show an upgrade modal instead of a generic error toast.

### Phase 4 Validation Checklist
```
□ Create a Starter tenant, add 1,000 products — 1,001st product returns a 403 with upgrade prompt
□ Create a Starter tenant, try to add 2nd warehouse — blocked with upgrade prompt
□ Starter tenant tries to access WooCommerce sync — blocked
□ Growth tenant adds unlimited products — no limit hit
□ Upgrade from Starter to Growth — limits immediately expand without re-login
```

---

## PHASE 5: Onboarding & Retention (Days 19-23)
**Goal:** Users who complete onboarding churn 60% less. This phase directly protects your MRR.

### 5.1 — Setup Wizard Flow

Following the design in your existing `ONBOARDING_PLAN.md`:

```php
// Add to tenants table migration (or a new migration):
$table->boolean('setup_completed')->default(false);
$table->string('industry')->nullable();

// TenantMiddleware: redirect to wizard if not completed
if (!$tenant->setup_completed && !$request->routeIs('setup.*')) {
    return redirect()->route('setup.wizard');
}
```

The wizard must set: `name`, `currency_code`, `currency_symbol`, `timezone`, `industry`. On completion: seed industry-specific categories + set `setup_completed = true`.

### 5.2 — Currency Refactor (Replace All Hardcoded Symbols)

This is Phase 1 of your existing onboarding plan and must be done before launch.

```bash
# Find every hardcoded currency symbol
grep -rn "'Rs\.'\|\"Rs\.\"\|'PKR'\|\"PKR\"\|'\$'\|\"\$\"" resources/js/ --include="*.jsx"
```

Replace all with a shared Inertia prop:

```jsx
// In every component that displays money:
// Replace: Rs. {amount}
// With:    {tenant.currency_symbol} {amount}

// The tenant object is already shared globally from TenantMiddleware via Inertia::share()
const { tenant } = usePage().props;
// Usage: {tenant.currency_symbol}{formatNumber(amount)}
```

### 5.3 — The Super-Admin Dashboard (Your Command Center)

```php
// Routes accessible only from the main domain (venqore.com/admin)
// Protected by a separate AdminMiddleware that checks for is_platform_admin flag on user

Route::prefix('admin')->middleware(['auth', 'superadmin'])->group(function () {
    Route::get('/dashboard', [AdminDashboardController::class, 'index']);
    Route::get('/tenants', [AdminDashboardController::class, 'tenants']);
    Route::post('/tenants/{tenant}/suspend', [AdminDashboardController::class, 'suspend']);
    Route::post('/tenants/{tenant}/upgrade', [AdminDashboardController::class, 'upgrade']);
});

// AdminDashboardController::index() returns:
[
    'mrr'              => $this->calculateMrr(),    // sum of active subscription values
    'tenants_total'    => Tenant::withoutTenantScope()->count(),
    'tenants_trial'    => Tenant::withoutTenantScope()->where('status', 'trial')->count(),
    'tenants_active'   => Tenant::withoutTenantScope()->where('status', 'active')->count(),
    'tenants_churned'  => Tenant::withoutTenantScope()->where('status', 'cancelled')->count(),
    'new_today'        => Tenant::withoutTenantScope()->whereDate('created_at', today())->count(),
    'storage_used_gb'  => $this->calculateStorageUsage(),
    'recent_tenants'   => Tenant::withoutTenantScope()->latest()->limit(10)->get(),
]
```

---

## PHASE 6: The Landing Page & Demo Environment (Days 24-26)
**Goal:** Your marketing assets that work while you sleep.

### 6.1 — venqore.com Landing Page (Ship on Day 1, Polish Later)

The minimum viable landing page contains exactly these elements. Nothing else. Ship it before everything else is done.

```
1. Headline: "The Complete POS & ERP for Growing Retail Businesses"
2. Sub-headline: "Sales, Inventory, Accounting, and 38 Reports — in one browser tab. No installation. 14-day free trial."
3. A 4-minute Loom video showing: making a sale → checking stock → viewing a profit report
4. Three pricing cards (Starter $19, Growth $39, Business $79)
5. "Start Free Trial" buttons linking to /register
6. Five feature bullets (POS, Inventory, Accounting, Multi-warehouse, WooCommerce)
7. A "Book a Demo" link pointing to Calendly
```

Do not spend more than 2 days on this. Copy converts better than design at this stage.

### 6.2 — demo.venqore.com

This is your highest-converting marketing asset. Any visitor can log in and click around without creating an account.

```php
// A special tenant provisioned manually: subdomain = 'demo'
// Scheduled command resets it every night to a clean state

// app/Console/Commands/ResetDemoTenant.php
public function handle(): void
{
    $demo = Tenant::where('subdomain', 'demo')->firstOrFail();
    
    // Delete all demo data
    DB::table('products')->where('tenant_id', $demo->id)->delete();
    DB::table('sales')->where('tenant_id', $demo->id)->delete();
    // ... all tables
    
    // Re-seed with realistic sample data
    DemoDataSeeder::seedFor($demo);
    
    $this->info('Demo tenant reset at ' . now());
}

// Schedule: $schedule->command('demo:reset')->dailyAt('04:00');
```

Demo credentials displayed publicly on the landing page: `demo@venqore.com / demo1234`

---

## PHASE 7: AppSumo Preparation (Day 27-28)
**Goal:** By this point you have a working product, live tenants, and testimonials. Now you prepare the AppSumo deal.

### The AppSumo Deal Structure

Never offer lifetime hosting as a promise. Offer this:

| What They Buy | What They Get |
|---|---|
| AppSumo LTD — $79 | Lifetime license to use VenQore software |
| Included | 2 years of hosted service on venqore.com |
| After 2 years | $9/month to stay hosted — OR — export data and self-host |
| Codes stackable | 2 codes = Growth plan features, 3 codes = Business plan |

This structure is legally clean, AppSumo-approved, and buyers in the LTD community understand it.

### Requirements Before Submitting to AppSumo

```
□ Product live at venqore.com with a public URL
□ demo.venqore.com working and publicly accessible
□ 5+ real paying customers (even if friends/family at a discount)
□ Response time under 12 hours on support channel
□ No critical bugs in core flows (POS sale, inventory, basic reports)
□ A clear "What's included" page with screenshots
□ A refund policy (AppSumo requires 60 days)
```

Apply at: https://sell.appsumo.com

---

## PHASE 8: Server Setup & Production Deployment
**This is a reference section. Do this in parallel with Phase 2-3.**

### Recommended Stack

```
Server:     DigitalOcean Droplet — $24/month (4GB RAM, 2 vCPU, 80GB SSD)
Database:   MySQL 8.0 (on same server initially, separate later)
Cache:      Redis (on same server)
Queue:      Laravel Horizon (supervisord managed)
Web server: Nginx + PHP 8.3 FPM
SSL:        Cloudflare with wildcard cert via certbot
Files:      Cloudflare R2 (~$3/month)
Email:      Postmark ($1.50 per 1,000 emails)
DNS:        Cloudflare (free)
Monitoring: UptimeRobot (free) + Laravel Telescope (dev only)
```

### Supervisor Config for Horizon

```ini
; /etc/supervisor/conf.d/horizon.conf
[program:horizon]
process_name=%(program_name)s
command=php /var/www/venqore/artisan horizon
autostart=true
autorestart=true
user=www-data
redirect_stderr=true
stdout_logfile=/var/www/venqore/storage/logs/horizon.log
stopwaitsecs=3600
```

### Environment Variables Checklist

```bash
# .env — Production variables to set before launch
APP_URL=https://venqore.com
APP_DOMAIN=venqore.com
SESSION_DOMAIN=.venqore.com
SESSION_SECURE_COOKIE=true

QUEUE_CONNECTION=redis
REDIS_HOST=127.0.0.1

CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET=venqore-assets
CLOUDFLARE_R2_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
CLOUDFLARE_R2_URL=https://assets.venqore.com

LEMON_SQUEEZY_API_KEY=
LEMON_SQUEEZY_STORE_ID=
LEMON_SQUEEZY_SIGNING_SECRET=
LEMON_SQUEEZY_STARTER_VARIANT_ID=
LEMON_SQUEEZY_GROWTH_VARIANT_ID=
LEMON_SQUEEZY_BUSINESS_VARIANT_ID=

MAIL_MAILER=postmark
POSTMARK_TOKEN=
MAIL_FROM_ADDRESS=hello@venqore.com
MAIL_FROM_NAME=VenQore
```

---

## Master Dependency Order — Do Not Deviate

```
Phase 0: Backup + TenantZeroSeeder       ← MUST run before any migration
Phase 1: Multi-tenancy + Middleware       ← MUST work before Phase 2
Phase 2: Auto-provisioning + Webhooks     ← MUST work before marketing
Phase 3: Performance + Queues + R2        ← MUST work before public launch
Phase 4: Plan gating                      ← MUST work before accepting real money
Phase 5: Onboarding wizard + Admin panel  ← Ship before AppSumo
Phase 6: Landing page + Demo              ← Ship as early as possible (day 1 MVP)
Phase 7: AppSumo application              ← Only after 5+ real customers
Phase 8: Server config                    ← Runs in parallel from Phase 2
```

---

## Things That Will Burn You If Not Addressed (Complete List)

| Trap | Where It Bites | Fix Reference |
|---|---|---|
| No TenantZeroSeeder before migration | Wipes live AMD Outlets data | Phase 0.1 |
| tenant_id made NOT NULL before seeder | Fatal migration error on existing data | Phase 0.1 |
| Session cookie not set to `.venqore.com` | Users randomly logged out across subdomains | Phase 1.5 |
| No subdomain reserved word list | `admin.venqore.com` hijacked by a random user | Phase 1.6 |
| No rate limiting per tenant | One bad tenant crashes server for all others | Phase 1.7 |
| Hard cascade deletes on financial data | Delete a category → destroy accounting ledger | Phase 1.8 |
| POS loading full product catalog | Browser freezes at 2,000+ SKUs | Phase 3.1 |
| WooCommerce sync is synchronous | One sync stalls the server for all tenants | Phase 3.2 |
| Local disk storage | Breaks on multi-server, can't be backed up easily | Phase 3.3 |
| No composite indexes on tenant_id | Reports become slow as tenants grow | Phase 1.2 |
| Webhook processing is synchronous | Slow payment provider causes request timeout, provisioning fails | Phase 2.1 |
| Demo tenant not reset nightly | Demo accumulates garbage data, looks broken to prospects | Phase 6.2 |
| No cleanup for dead trials | Storage costs grow forever for zero-value accounts | Phase 2.5 |
| Hardcoded currency symbols | Breaks for any non-PKR customer immediately | Phase 5.2 |
| No plan gating at API level | Starter users can call Growth features via the API directly | Phase 4.3 |

---

## Progress Tracker

```
PHASE 0 — Data Safety
  □ 0.1 TenantZeroSeeder written and tested locally
  □ 0.2 Production backup confirmed

PHASE 1 — Multi-Tenancy
  □ 1.1 tenants table migration
  □ 1.2 tenant_id added to all core tables with composite indexes
  □ 1.3 HasTenant trait applied to all models
  □ 1.4 TenantMiddleware built and applied to routes
  □ 1.5 Session domain set to .venqore.com
  □ 1.6 Reserved subdomain blocklist in SubdomainGenerator
  □ 1.7 Tenant-aware rate limiting in RouteServiceProvider
  □ 1.8 Soft deletes on financial models + cascade delete guards
  □ VALIDATION: Two tenants, zero data bleed confirmed

PHASE 2 — Auto-Provisioning
  □ 2.1 Lemon Squeezy webhook listener
  □ 2.2 ProvisionTenantJob with retry logic
  □ 2.3 Wildcard DNS + SSL on Cloudflare + Nginx
  □ 2.4 All email flows written and queued
  □ 2.5 Cleanup command for dead accounts
  □ VALIDATION: Full signup-to-login flow automated

PHASE 3 — Performance
  □ 3.1 POS search API endpoint + React debounce
  □ 3.2 Horizon installed, all heavy jobs queued
  □ 3.3 R2 storage configured, all uploads migrated
  □ VALIDATION: POS loads fast, uploads go to R2

PHASE 4 — Gating
  □ 4.1 plans.php config
  □ 4.2 PlanGate service
  □ 4.3 Gates injected at all limit points
  □ 4.4 Frontend upgrade prompts
  □ VALIDATION: Starter user blocked at 1,001st SKU

PHASE 5 — Onboarding
  □ 5.1 Setup wizard
  □ 5.2 Currency symbols fully dynamic
  □ 5.3 Super-admin dashboard
  □ VALIDATION: Fresh tenant sees wizard, completes it, lands on dashboard

PHASE 6 — Marketing Assets
  □ 6.1 venqore.com landing page live
  □ 6.2 demo.venqore.com live with nightly reset
  □ VALIDATION: Any stranger can sign up and try the demo

PHASE 7 — AppSumo
  □ 7.1 5+ real paying customers acquired
  □ 7.2 AppSumo application submitted
```

---

*This document is your build spec. Every item on the tracker corresponds to a section above with the implementation detail. Work top to bottom. Check the box only when the validation test passes — not when the code is written.*
