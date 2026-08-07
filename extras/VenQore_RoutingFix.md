# VenQore — Routing & Permission Surgical Fix

> **Closes the three wounds that let store owners bleed into the Platform HQ**

| Wound | Description |
|-------|-------------|
| **Wound 1** | 400+ legacy routes have no store context — anyone can drift to platform |
| **Wound 2** | `CheckPermissions.php` grants God Mode to anyone with role `'owner'` |
| **Wound 3** | Frontend shows Platform HQ links when `store` prop is `null` |
| **Result** | Store owners see platform dashboards, reports, and hidden admin URLs |
| **Fix Time** | 1 focused day — 10 steps executed in order |

---

## What Is Actually Broken — Plain English

> Before reading the fix, read this so you understand exactly what went wrong and why the fix is structured the way it is.

| Zone | Where it lives | What should happen | What is happening now |
|------|----------------|--------------------|-----------------------|
| **Platform HQ** | `/VenQore/...` | Only you can see this. 404 for everyone else. | Store owners can reach it by accident |
| **Store World** | `/s/{store-slug}/...` | Each store owner sees only their own store | Working correctly when routes are in this zone |
| **Legacy Black Hole** | `/reports`, `/inventory`, `/pos`... | These should NOT exist as bare URLs anymore | 400+ routes still live here with no store context |

**The broken flow:**

```
Store owner clicks 'Admin Panel'
  → Frontend has no store prop (legacy, no tenant)
  → Thinks: no store = must be platform admin
  → Shows platform HQ links
  → System panics → redirects to /VenQore-login
  → Platform login page exposed to customer
```

---

## Execute Steps In Order — Do Not Skip

> Every store stays in its own sealed world.

---

### Step 1 — Fix `CheckPermissions.php`

**Remove the God Mode bypass that lets `'owner'` role through everything.**

One line in `CheckPermissions.php` currently says: *if the user's role is `'owner'`...* This was fine when one shop installed the software on their own server. Now every store owner who lands on a platform route gets silently waved through the firewall.

#### ❌ Remove This (The Bug)

```php
// REMOVE THIS COMPLETELY — this is the line causing God Mode leak
if ($user->role === 'owner' || $user->role === 'admin') {
    return $next($request); // ← This lets ANYONE with 'owner' past EVERYTHING
}
```

#### ✅ Replace With This

```php
public function handle(Request $request, Closure $next, string $permission): Response
{
    $user = Auth::user();

    // Platform routes: only is_platform_admin = true gets through
    // Everyone else gets 404 — not 403, not a redirect — 404
    if ($request->routeIs('admin.*')) {
        if (!$user->is_platform_admin) { abort(404); }
        return $next($request);
    }

    // Store routes: check the permission against their role in this store
    $membership = app()->bound('current.membership') ? app('current.membership') : null;
    if (!$membership) { return redirect()->route('hub'); }

    $map = config('permissions');
    if (!in_array($permission, $map[$membership->role] ?? [])) {
        abort(403, 'You do not have permission to access this area.');
    }

    return $next($request);
}
```

#### Also do this in your database right now

```sql
-- Set yourself as platform admin (do this once, manually in database)
UPDATE users SET is_platform_admin = 1 WHERE email = 'your@email.com';

-- Confirm no store user has is_platform_admin set
SELECT email, is_platform_admin FROM users WHERE is_platform_admin = 1;
-- Should show only your email
```

**Checklist:**
- [ ] `is_platform_admin = 1` set on your account only
- [ ] No other user has `is_platform_admin = 1`
- [ ] The `owner`/`admin` God Mode bypass line is deleted from `CheckPermissions.php`

---

### Step 2 — Create `config/permissions.php`

**One clean file that defines exactly what each store role can do.**

Create this file at `config/permissions.php`. This becomes the **single source of truth** for all store-level permissions. No more checking role strings scattered across controllers.

| Role | What they CAN do | What they CANNOT do |
|------|------------------|---------------------|
| `owner` | Everything in the store: POS, inventory, sales, purchases, finance, reports, staff, settings, billing | Nothing — they own the store. Billing is store-level only, never platform. |
| `admin` | Everything except billing management, store deletion, and ownership transfer | Cannot touch billing or delete the store |
| `manager` | All operational features: POS, sales, purchases, inventory, all 38 reports. Cannot manage staff. | No staff management, no settings, no billing |
| `cashier` | POS only. Can see stock levels. Can add a customer at the register. | Cannot see any financial data, staff info, or reports |
| `accountant` | All financial reports and accounting. Read-only on sales/purchases. | Cannot create sales, cannot access POS, cannot manage staff |
| `purchasing_officer` | Purchase orders, supplier management, inventory view | Cannot see sales, customers, or financial reports |
| `viewer` | Read-only access to reports and finance view | Cannot create or change anything — zero write access |

#### Usage example in routes

```php
Route::get('/staff', [StaffController::class, 'index'])
    ->middleware('permission:staff.view');

Route::post('/staff/invite', [StaffController::class, 'invite'])
    ->middleware('permission:staff.manage');
```

---

### Step 3 — Fix `routes/web.php`

**Move ALL legacy routes inside the `s/{store_slug}` tenant wrapper.**

Routes like `/reports`, `/inventory`, `/pos`, `/settings` exist as bare global URLs with no `TenantMiddleware`. Every single one of them must move into Zone 3.

#### The Four Zones — Every Route Belongs to Exactly One Zone

```
ZONE 1 — Public (No auth needed)
    /
    /pricing
    /terms
    /privacy
    /webhooks/lemon-squeezy

ZONE 2 — Auth, No Store (Logged in but no store context yet)
    /hub
    /start
    /new-store
    /join
    /invite/{token}
    /redeem
    /account
    /logout

ZONE 3 — Store World (Auth + valid store membership + TenantMiddleware)
    ALL legacy routes move here:
    /s/{store_slug}/dashboard
    /s/{store_slug}/pos/*
    /s/{store_slug}/inventory/*
    /s/{store_slug}/sales/*
    /s/{store_slug}/purchases/*
    /s/{store_slug}/finance/*
    /s/{store_slug}/reports/*
    /s/{store_slug}/staff/*
    /s/{store_slug}/settings/*
    /s/{store_slug}/billing/*

ZONE 4 — Platform HQ (SuperAdminMiddleware — 404 for everyone else)
    /VenQore/dashboard
    /VenQore/stores
    /VenQore/users
    /VenQore/revenue
```

#### Zone 3 Route Group Code

```php
// The Zone 3 wrapper — ALL store routes go inside this group
Route::middleware(['auth', 'verified', 'tenant'])
    ->prefix('s/{store_slug}')
    ->name('store.')
    ->group(function () {

        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

        // Every old /reports route becomes /s/{store_slug}/reports
        Route::prefix('reports')->name('reports.')->group(function () {
            Route::get('/', [ReportController::class, 'index'])
                ->middleware('permission:reports.view')->name('index');
            // ... all 38 reports same pattern
        });

        // Every old /inventory route becomes /s/{store_slug}/inventory
        Route::prefix('inventory')->name('inventory.')->group(function () {
            Route::get('/', [InventoryController::class, 'index'])
                ->middleware('permission:inventory.view')->name('index');
            // ... same pattern
        });

        // ... same for pos, sales, purchases, finance, staff, settings, billing
    });

// Fallback — any URL not matched above returns 404
Route::fallback(fn() => abort(404));
```

---

### Step 4 — Fix `SuperAdminMiddleware.php`

**404 for non-platform-admin — never 403, never redirect.**

> A **403** says *"this page exists but you are not allowed."* That tells attackers the route is real and worth investigating. A **404** says *"this page does not exist."* Store owners who guess platform URLs get nothing. No redirect.

```php
// app/Http/Middleware/SuperAdminMiddleware.php
public function handle(Request $request, Closure $next): Response
{
    $user = Auth::user();

    // Not logged in: 404 (not redirect to login — that reveals the route exists)
    if (!$user) { abort(404); }

    // Logged in but not platform admin: 404
    if (!$user->is_platform_admin) { abort(404); }

    return $next($request);
}
```

---

### Step 5 — Fix `OneGlanceLayout.jsx`

**The frontend must never know platform routes exist for store users.**

The current code says: *if the `store` prop is null or undefined, show Platform HQ links.* A null store should mean: go back to `/hub` to pick a store. Platform links should never appear in the store layout.

#### ❌ Remove This Pattern Completely

```jsx
// BROKEN — REMOVE THIS
const menuItems = (!store || userRole === 'platform_admin') ? [
    { name: 'Admin Home', route: 'admin.home' },      // ← Platform links in store layout!
    { name: 'Dashboard', route: 'admin.dashboard' },  // ← Should never be here
] : [
    { name: 'Dashboard', route: 'store.dashboard' },
];
```

#### ✅ Replace With This

```jsx
// FIXED — store layout never references platform routes
const { store, my_role } = usePage().props;

// If no store context: redirect to hub immediately
// This is the ONLY fallback — never show platform links
if (!store) {
    window.location.href = '/hub';
    return null;
}

// Permission helper — checks against store role only
const permissionMap = {
    owner:              ['inventory.view','sales.view','reports.view','staff.view','settings.view','billing.view'],
    admin:              ['inventory.view','sales.view','reports.view','staff.view','settings.view'],
    manager:            ['inventory.view','sales.view','reports.view'],
    cashier:            ['inventory.view'],
    accountant:         ['sales.view','finance.view','reports.view'],
    purchasing_officer: ['purchases.view','inventory.view'],
    viewer:             ['reports.view'],
};

const can = (p) => permissionMap[my_role]?.includes(p) ?? false;

// Menu items — all routes stay inside /s/{store.slug}/
const menuItems = [
    { name: 'Dashboard', route: route('store.dashboard',   { store_slug: store.slug }) },
    { name: 'POS',       route: route('store.pos.index',   { store_slug: store.slug }) },
    can('inventory.view') && { name: 'Inventory', route: route('store.inventory.index', { store_slug: store.slug }) },
    can('sales.view')     && { name: 'Sales',     route: route('store.sales.index',     { store_slug: store.slug }) },
    can('reports.view')   && { name: 'Reports',   route: route('store.reports.index',   { store_slug: store.slug }) },
    can('staff.view')     && { name: 'Staff',     route: route('store.staff.index',     { store_slug: store.slug }) },
    can('settings.view')  && { name: 'Settings',  route: route('store.settings.index',  { store_slug: store.slug }) },
    can('billing.view')   && { name: 'Billing',   route: route('store.billing.index',   { store_slug: store.slug }) },
].filter(Boolean);
```

> The button previously labelled **'Admin Panel'** that pushed users to `/admin-panel` must be removed entirely. In the new structure there is no 'admin panel' concept — there is just the store. Staff management lives at `/s/{slug}/staff`. The button that used to say 'Admin Panel' should now say **'Staff'**.

---

### Step 6 — Fix Store Owner Role Assignment

**When a store is created, assign owner role correctly — never platform role.**

```php
// app/Http/Controllers/StoreController.php — store creation
// After creating the tenant record:
TenantUser::create([
    'tenant_id' => $tenant->id,
    'user_id'   => $user->id,
    'role'      => 'owner', // ← Store owner role only
    'status'    => 'active',
    'joined_at' => now(),
]);

// NEVER set is_platform_admin here
// is_platform_admin is ONLY set manually in the database for you
// A store owner creating a store is NOT a platform admin

// Verify after creation:
// SELECT is_platform_admin FROM users WHERE id = {new_user_id};
// Must return: 0
```

---

### Step 7 — Fix `SetupController.php`

**Wizard sets store settings only — never touches platform or permissions.**

```php
// app/Http/Controllers/SetupController.php — wizard completion
public function complete(Request $request, string $store_slug): RedirectResponse
{
    $tenant     = app('current.tenant');
    $membership = app('current.membership');

    $tenant->update([
        'name'            => $request->input('business_name'),
        'currency_code'   => $request->input('currency_code'),
        'currency_symbol' => $request->input('currency_symbol'),
        'timezone'        => $request->input('timezone'),
        'industry'        => $request->input('industry'),
        'setup_completed' => true,
    ]);

    // Industry feature flags
    $industry = $request->input('industry');
    $tenant->update([
        'feature_variants'      => in_array($industry, ['fashion','apparel']),
        'feature_serials'       => in_array($industry, ['electronics','it','mobile']),
        'feature_batches'       => in_array($industry, ['pharmacy','medical']),
        'feature_manufacturing' => in_array($industry, ['bakery','factory']),
    ]);

    // Redirect stays inside the store — never goes to platform
    return redirect()->route('store.dashboard', ['store_slug' => $store_slug]);
}
```

---

### Step 8 — Create a Separate Platform Login

**The regular `/login` is for store users only. Your platform has its own hidden login.**

Right now there is one `/login` page for everyone. You should have a completely separate URL, not linked anywhere on the public site. Store users use `/login`. You use `/VenQore-login`. If a store owner guesses the platform URL, they cannot log in there because the platform login rejects non-platform-admin accounts.

```php
// routes/web.php — add this
// Platform login — separate URL, not linked anywhere public
Route::middleware('guest')->group(function () {
    Route::get('/VenQore-login', [PlatformLoginController::class, 'create'])
        ->name('platform.login');
    Route::post('/VenQore-login', [PlatformLoginController::class, 'store'])
        ->middleware('throttle:5,1'); // 5 attempts per minute max
});

// PlatformLoginController::store()
public function store(LoginRequest $request): RedirectResponse
{
    $request->authenticate();
    $user = Auth::user();

    if (!$user->is_platform_admin) {
        Auth::logout();
        return back()->withErrors(['email' => 'Invalid credentials.']);
        // Generic error — does not reveal whether account exists
    }

    $request->session()->regenerate();
    return redirect()->route('admin.dashboard');
}
```

---

## ✅ Execution Checklist — Do These In This Exact Sequence

- [ ] Set `is_platform_admin = 1` for your account in the database
- [ ] Confirm no other user has `is_platform_admin = 1`
- [ ] Delete the `owner`/`admin` God Mode bypass from `CheckPermissions.php`
- [ ] Create `config/permissions.php` with the role permission map
- [ ] Move ALL legacy routes (`/reports`, `/inventory`, `/pos`, etc.) into Zone 3 (`s/{store_slug}`)
- [ ] Add `Route::fallback(fn() => abort(404))` at the end of `routes/web.php`
- [ ] Rewrite `SuperAdminMiddleware.php` to return 404 for non-platform-admin
- [ ] Fix `OneGlanceLayout.jsx` — remove platform links, add null-store redirect to `/hub`
- [ ] Remove the 'Admin Panel' button that went to `/admin-panel`
- [ ] Fix `StoreController.php` — confirm owner `TenantUser` record is created correctly
- [ ] Fix `SetupController.php` — wizard never touches platform role or `is_platform_admin`
- [ ] Add `/VenQore-login` as a separate platform login route

---

## 🧪 Tests — Run All of These

```bash
# Verify only public/auth routes exist outside store/admin zones
php artisan route:list | grep -v store | grep -v admin
# Must return only public/auth routes
```

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Platform isolation | Log in as store owner → navigate to `/VenQore/dashboard` | **404** |
| Settings redirect | Log in as store owner → click 'Admin Panel' or 'Settings' | Goes to `/s/{slug}/settings` |
| Legacy route gone | Log in as store owner → visit `/reports` | **404** (route no longer exists bare) |
| Cashier reports blocked | Log in as cashier → visit `/s/{slug}/reports` | **403** (within store context) |
| Cashier staff blocked | Log in as cashier → visit `/s/{slug}/staff` | **403** |
| Platform login works | Log in via `/VenQore-login` as yourself | Reaches `/VenQore/dashboard` |
| Data isolation | Create two stores → check data after route changes | Each store sees only its own data |

---

## After This Fix — The Mental Model

| Who | What they do | What they see | What they cannot see or reach |
|-----|-------------|---------------|-------------------------------|
| **Store Owner** | Signs up, creates store, manages everything inside it | `/s/my-store/*` with full owner permissions | Any `/VenQore/*` URL (gets 404). Any other store's data. Platform login page. |
| **Store Cashier** | Operates POS only | `/s/my-store/dashboard` and `/s/my-store/pos` only | Reports, staff, settings, finance (all get 403 within store context) |
| **You (Platform Admin)** | Manages all stores, billing, users | `/VenQore/*` via `/VenQore-login` | Nothing is hidden — but you access it separately, not via `/login` |
| **Anyone guessing URLs** | Tries `/VenQore/dashboard`, `/admin-panel`, etc. | **404** — page does not exist | No hint that the platform layer exists at all |
