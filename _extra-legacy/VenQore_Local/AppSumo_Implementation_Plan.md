# VenQore — AppSumo Launch: Complete Implementation Plan
**Based on full codebase audit | April 2026**  
**For use with your IDE — every gap has exact file, method, and code to write**

---

## Real Assessment After Full Codebase Read

You are significantly further along than the previous document suggested. After reading every relevant file, the honest picture is:

**Already built and working (you did not know you had these):**
- `app/Services/PlanGate.php` — complete limit enforcement service, production-ready
- `app/Exceptions/PlanLimitException.php` — structured JSON response with upgrade URL, billing URL, feature name, current count vs limit
- `resources/js/Components/UpgradeModal.jsx` — complete modal component with glassmorphism design, perks list, upgrade CTA
- `resources/js/bootstrap.js` — global axios interceptor already handling `403 plan_limit` and firing `amd:plan-limit` event to open the modal
- `config/plans.php` — complete with `ltd_1`, `ltd_2`, `ltd_3` tiers properly defined
- `resources/js/Pages/Redeem.jsx` — complete redemption UI with tier comparison
- `app/Http/Controllers/AppSumoController.php` — code validation, stacking, double-redemption prevention
- `app/Http/Controllers/BillingController.php` — billing dashboard with live usage counts
- `app/Http/Controllers/StaffController.php` line 106 — `PlanGate::enforce('staff_limit', $currentCount)` already enforced
- `app/Http/Controllers/Admin/SuperAdminController.php` — full AppSumo code management panel
- `app/Models/Tenant.php` — `plan_limits` JSON column for per-tenant overrides, `getLimit()` method

**Actual gaps remaining (much smaller list than the previous document said):**

There are exactly **7 things** to fix. Some are 3 lines of code. None require new infrastructure.

---

## The 7 Gaps — Ordered by Priority

---

### GAP 1 — Route Points to Non-Existent Method (BREAKS THE APP)
**Severity: 🔴 Critical — This is a live bug. The POS sale route is wired to a method that does not exist.**

**The problem:**

In `routes/web.php` line 88:
```php
Route::post('/pos/sale', [\App\Http\Controllers\PosController::class, 'completeSale'])->name('pos.sale');
```

In `app/Http/Controllers/PosController.php`, there is no `completeSale()` method. The file has `index()`, `getCategories()`, `store()` (which processes cart items), and `checkout()` (which is deprecated and returns 410).

The actual sale creation in V3 happens at:
- Route: `Route::post('sales', [\App\Http\Controllers\V3\SaleController::class, 'store'])` (line 1165 in web.php)
- Controller: `app/Http/Controllers/V3/SaleController.php` — calls `SaleService::post()`

**Fix — choose one:**

**Option A (Recommended): Delete the dead route.**

In `routes/web.php` find line 88 and remove it:
```php
// DELETE THIS LINE:
Route::post('/pos/sale', [\App\Http\Controllers\PosController::class, 'completeSale'])->name('pos.sale');
```

The frontend POS (`Pos.jsx`) already posts to `store.sales.store` which hits the V3 route. This dead route is never called by the React frontend. It just causes a 500 if something accidentally hits it.

**Option B: Alias it to the V3 controller**
```php
// Replace line 88 in routes/web.php with:
Route::post('/pos/sale', [\App\Http\Controllers\V3\SaleController::class, 'store'])->name('pos.sale');
```

**Time to fix: 2 minutes**

---

### GAP 2 — `AppSumoController::index()` Does Not Exist (Route Mismatch)
**Severity: 🔴 Critical — Redemption page returns 500 for new users**

**The problem:**

In `routes/web.php` line 355:
```php
Route::get('/redeem', [\App\Http\Controllers\AppSumoController::class, 'index'])->name('redeem');
```

In `app/Http/Controllers/AppSumoController.php` line 31, the method is named `form()`, not `index()`. Any user arriving at `/redeem` gets a 500 error.

Additionally, the route at line 356 uses `redeem.submit` as the name, but `Redeem.jsx` line 29 posts to `route('appsumo.redeem')`. That route name does not exist — it should be `redeem.submit`.

**Fix — two changes:**

**Change 1:** In `app/Http/Controllers/AppSumoController.php` line 31, rename the method:
```php
// Change this:
public function form(): Response

// To this:
public function index(): Response
```

**Change 2:** In `resources/js/Pages/Redeem.jsx` line 29, fix the route name:
```jsx
// Change this:
post(route('appsumo.redeem'));

// To this:
post(route('redeem.submit'));
```

**Time to fix: 5 minutes**

---

### GAP 3 — Monthly Transaction Limit Not Defined or Enforced
**Severity: 🔴 Critical — The AppSumo listing promises 500/2,000/6,000 transactions/month. Nothing enforces this.**

**The problem:**

`config/plans.php` defines `sku_limit`, `staff_limit`, `locations`, `woocommerce`, `api_access`, `reports`, `growth_engine`, `multi_branch` — but has no `transactions_per_month` key. Without this in the config, `PlanGate` cannot check it, and the LTD limits you are advertising do not exist in code.

`app/Services/V3/SaleController::store()` calls `SaleService::post()` with no plan gate check before writing the sale.

**Fix — three steps:**

**Step 1:** Add `transactions_per_month` to `config/plans.php` for each tier:

```php
// In config/plans.php, update each plan to add transactions_per_month:

'trial' => [
    'transactions_per_month' => 500,   // ADD THIS
    'locations'    => 1,
    // ... rest of trial config
],

'starter' => [
    'transactions_per_month' => 2000,  // ADD THIS
    'locations'    => 1,
    // ... rest of starter config
],

'growth' => [
    'transactions_per_month' => 10000, // ADD THIS
    'locations'    => 3,
    // ... rest
],

'business' => [
    'transactions_per_month' => null,  // null = unlimited
    'locations'    => null,
    // ... rest
],

'ltd_1' => [
    'transactions_per_month' => 500,   // ADD THIS — AppSumo Code 1
    'locations'    => 1,
    // ... rest
],

'ltd_2' => [
    'transactions_per_month' => 2000,  // ADD THIS — AppSumo Code 2
    'locations'    => 3,
    // ... rest
],

'ltd_3' => [
    'transactions_per_month' => 6000,  // ADD THIS — AppSumo Code 3
    'locations'    => null,
    // ... rest
],
```

**Step 2:** Add the `PlanLimitException` message for the new feature key. In `app/Exceptions/PlanLimitException.php` line 30, add to the `$messages` array:
```php
'transactions_per_month' => 'You\'ve reached your monthly transaction limit. Upgrade to continue processing sales.',
```

**Step 3:** Add the transaction count check to `app/Http/Controllers/V3/SaleController.php`:
```php
<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Http\Requests\V3\StoreSaleRequest;
use App\Services\V3\SaleService;
use App\Services\PlanGate;
use App\Models\Sale;

class SaleController extends Controller
{
    public function __construct(
        private SaleService $sales
    ) {}

    public function store(StoreSaleRequest $request)
    {
        // ── Plan Guard: Monthly transaction limit ─────────────────────────
        // Count posted sales for this tenant in the current calendar month.
        // Using a direct DB count is fast (indexed on tenant_id + created_at + status).
        // No Redis needed — this query runs in under 1ms on typical store volumes.
        $monthlyCount = Sale::where('status', 'posted')
            ->whereYear('created_at', now()->year)
            ->whereMonth('created_at', now()->month)
            ->count();

        PlanGate::enforce('transactions_per_month', $monthlyCount);
        // ─────────────────────────────────────────────────────────────────

        $sale = $this->sales->post($request->validated());

        return redirect()->back()->with([
            'success'    => 'Sale posted successfully.',
            'invoice_id' => $sale->id,
            'invoice_no' => $sale->reference_number,
            'status'     => 'success',
        ]);
    }
}
```

**Note on Redis vs DB count:** You do not need Redis for this. The `sales` table is indexed on `tenant_id` + `created_at`. A `COUNT(*)` with two WHERE clauses on indexed columns returns in under 1ms even with tens of thousands of records. Redis would add complexity with no meaningful performance gain at your scale. If you later have tenants with 100,000+ monthly transactions, add Redis then.

**Time to fix: 30 minutes**

---

### GAP 4 — `StoreController` Does Not Enforce LTD Store Limit
**Severity: 🟠 High — An LTD Code 1 user (1 store limit) can create unlimited stores**

**The problem:**

`app/Http/Controllers/StoreController.php` method `store()` correctly finds the available license and assigns the right plan — but it never checks how many stores the user already has. An LTD user who has redeemed 1 code (limit: 1 store) can simply call `POST /new-store` again and create a second store. There is no count check.

**Note:** `config/plans.php` uses `locations` for warehouses, not stores. The store count limit is enforced via the `StoreLicense` system — one license = one store. But the stacking logic in `AppSumoController` upgrades the plan on the existing license rather than creating additional licenses for additional stores. So a Code 2 user (2 store limit) currently has 1 license and could only create 1 store.

**Fix:** Add a store limit check in `StoreController::store()` based on how many active tenants the user owns. In `app/Http/Controllers/StoreController.php`, add this block at the top of the `store()` method (before the transaction):

```php
public function store(Request $request): RedirectResponse
{
    $request->validate([
        'name' => 'required|string|max:100',
    ]);

    $user = Auth::user();

    // ── LTD Store Limit Check ─────────────────────────────────────────
    // Count stores this user already owns (active or trial).
    $ownedStoreCount = \App\Models\TenantUser::where('user_id', $user->id)
        ->where('role', 'owner')
        ->count();

    // Determine their store limit from their license
    $license = StoreLicense::where('user_id', $user->id)
        ->whereIn('status', ['available', 'consumed'])
        ->where('source', 'appsumo')
        ->orderByDesc('created_at')
        ->first();

    if ($license) {
        $storeLimits = [
            'starter'  => 1,
            'growth'   => 2,
            'business' => 4,
        ];
        $storeLimit = $storeLimits[$license->plan] ?? 1;

        if ($ownedStoreCount >= $storeLimit) {
            return back()->withErrors([
                'name' => "Your AppSumo plan allows a maximum of {$storeLimit} store(s). Stack another code to unlock more stores."
            ]);
        }
    }
    // ─────────────────────────────────────────────────────────────────

    $tenant = DB::transaction(function () use ($request, $user) {
        // ... rest of existing store creation code
    });

    // ... rest of existing method
}
```

**Time to fix: 20 minutes**

---

### GAP 5 — `AppSumoController::redeem()` Does Not Populate `plan_limits` on the Tenant
**Severity: 🟠 High — `PlanGate` reads `tenant->plan_limits` for overrides, but this JSON is never written on LTD redemption**

**The problem:**

`app/Http/Controllers/AppSumoController.php` line 127 upgrades the tenant's `plan` column (`plan = 'starter'/'growth'/'business'`) when a code is stacked. But it never writes `plan_limits` to the tenant. The `Tenant::getLimit()` method works correctly — it reads `plan_limits` first and falls back to `config/plans.php`. So for now, it falls back to config correctly.

However, you should explicitly write the limits at redemption time for two reasons:
1. If you ever need to give an LTD user a custom limit (e.g., a goodwill gesture), the `plan_limits` column is the right place — but it will overwrite the entire JSON, so it needs to start populated.
2. It makes debugging easier — you can see exactly what limits a tenant has by looking at their row, not cross-referencing config.

**But critically:** The `AppSumoController` assigns `plan = 'starter'/'growth'/'business'` — but your LTD-specific plans in config are `ltd_1`/`ltd_2`/`ltd_3`. This means a Code 1 user gets `plan = 'starter'` but `config/plans.php` has both `starter` (subscription) and `ltd_1` (LTD). Right now they map to the same limits, but `ltd_1` has the `ltd => true` and `hosted_until` flags that `starter` does not. A user on `plan = 'starter'` from LTD would NOT have `ltd = true` and could potentially be treated as a subscription user by any future billing logic.

**Fix:** Update `AppSumoController::redeem()` to:
1. Assign `ltd_1`/`ltd_2`/`ltd_3` plan values (not `starter`/`growth`/`business`)
2. Write `plan_limits` to the tenant

In `app/Http/Controllers/AppSumoController.php`, change the plan mapping at line 87:
```php
// Change this:
$plan = match(true) {
    $newTotal >= 3 => 'business',
    $newTotal >= 2 => 'growth',
    default        => 'starter',
};

// To this:
$plan = match(true) {
    $newTotal >= 3 => 'ltd_3',
    $newTotal >= 2 => 'ltd_2',
    default        => 'ltd_1',
};
```

And when updating the tenant in the stacking block (line 126-128), also write plan_limits:
```php
if ($existingLicense) {
    Tenant::where('id', $existingLicense->tenant_id)
          ->update([
              'plan'        => $plan,
              'plan_limits' => config("plans.{$plan}"), // Write the limits explicitly
          ]);
}
```

And when creating the first license (line 103-111), also store plan name correctly:
```php
StoreLicense::create([
    'user_id'          => $user->id,
    'type'             => 'ltd',
    'status'           => 'available',
    'plan'             => $plan,   // Now correctly 'ltd_1'
    'source'           => 'appsumo',
    'source_reference' => $appsumoCode->code,
    'valid_until'      => null,
]);
```

Also fix the messages array at line 132 to reflect the correct plan names:
```php
$messages = [
    1 => 'Code redeemed! You\'re on LTD Starter (ltd_1). Add a 2nd code to upgrade to LTD Growth.',
    2 => 'Upgraded to LTD Growth (ltd_2)! Add a 3rd code to unlock LTD Business.',
    3 => 'Upgraded to LTD Business (ltd_3) — maximum tier unlocked!',
];
```

**Time to fix: 25 minutes**

---

### GAP 6 — `UpgradeModal` Not Mounted in Layout
**Severity: 🟠 High — The modal exists and the interceptor fires the event, but nothing renders the modal**

**The problem:**

`UpgradeModal.jsx` comments say: *"Auto-mounted in OneGlanceLayout — no manual import needed."* But checking `OneGlanceLayout.jsx`, the `<UpgradeModal />` component is not imported or rendered anywhere in the file. The event fires from `bootstrap.js` correctly, but since the modal is never mounted in the DOM, nothing happens.

**Fix:** In `resources/js/Layouts/OneGlanceLayout.jsx`, add the import and the component rendering.

Find the imports section at the top of the file and add:
```jsx
import UpgradeModal from '@/Components/UpgradeModal';
```

Then find where other global modals or overlays are rendered (likely near the end of the JSX, before the closing `</div>` of the root element), and add:
```jsx
{/* Global plan limit modal — triggered by axios interceptor in bootstrap.js */}
<UpgradeModal />
```

**Time to fix: 5 minutes**

---

### GAP 7 — Warning Banner (80% / 95% Threshold) Does Not Exist
**Severity: 🟡 Medium — Users hit the limit wall without any prior warning**

**The problem:**

There is no component or backend logic that shows a warning at 80% or 95% of the monthly transaction limit. The first signal a user gets is when the sale fails with the UpgradeModal. This is poor UX and causes panic, not upgrade decisions.

**Fix — two parts:**

**Part A:** Create a new component `resources/js/Components/PlanUsageBanner.jsx`:

```jsx
import React from 'react';
import { usePage, router } from '@inertiajs/react';
import { AlertTriangle, Zap } from 'lucide-react';

/**
 * PlanUsageBanner
 *
 * Shows a warning when the tenant is approaching their monthly transaction limit.
 * Triggered at 80% (yellow) and 95% (orange).
 * Mount this in OneGlanceLayout above the main content area.
 *
 * Reads from: props.plan_usage (passed by TenantMiddleware or DashboardController)
 */
export default function PlanUsageBanner() {
    const { store, plan_usage } = usePage().props;

    if (!plan_usage || plan_usage.transactions_limit === null) return null; // unlimited plan

    const { transactions_used, transactions_limit } = plan_usage;
    const pct = transactions_limit > 0 ? (transactions_used / transactions_limit) * 100 : 0;

    if (pct < 80) return null; // Under 80% — no banner

    const isUrgent  = pct >= 95;
    const isCapped  = pct >= 100;

    const bgColor   = isCapped ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
                    : isUrgent ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800'
                    : 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800';

    const textColor = isCapped ? 'text-red-700 dark:text-red-300'
                    : isUrgent ? 'text-orange-700 dark:text-orange-300'
                    : 'text-yellow-700 dark:text-yellow-300';

    const message   = isCapped
        ? `You've used all ${transactions_limit} transactions this month. New sales are paused. Resets on the 1st.`
        : isUrgent
        ? `You've used ${transactions_used} of ${transactions_limit} transactions (${Math.round(pct)}%). Almost at your limit.`
        : `You've used ${transactions_used} of ${transactions_limit} transactions (${Math.round(pct)}%) this month.`;

    return (
        <div className={`flex items-center justify-between gap-4 px-5 py-3 border-b text-sm font-medium ${bgColor} ${textColor}`}>
            <div className="flex items-center gap-2.5">
                <AlertTriangle size={15} className="shrink-0" />
                <span>{message}</span>
            </div>
            <button
                onClick={() => router.visit(route('store.billing', { store_slug: store?.slug }))}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap
                    ${isCapped || isUrgent
                        ? 'bg-orange-500 text-white hover:bg-orange-600'
                        : 'bg-yellow-500 text-white hover:bg-yellow-600'
                    } transition-colors`}
            >
                <Zap size={11} /> Upgrade
            </button>
        </div>
    );
}
```

**Part B:** Pass `plan_usage` from the backend. The cleanest place is `TenantMiddleware.php`, which already shares data via `Inertia::share()`. Add to the `Inertia::share()` call in `app/Http/Middleware/TenantMiddleware.php`:

```php
// Find the Inertia::share() block in TenantMiddleware and add:
'plan_usage' => function () use ($tenant) {
    if (!$tenant) return null;
    
    $limit = $tenant->getLimit('transactions_per_month');
    if ($limit === null) return null; // unlimited — no banner needed
    
    $used = \App\Models\Sale::where('status', 'posted')
        ->whereYear('created_at', now()->year)
        ->whereMonth('created_at', now()->month)
        ->count();

    return [
        'transactions_used'  => $used,
        'transactions_limit' => $limit,
    ];
},
```

**Part C:** Mount the banner in `OneGlanceLayout.jsx`. Import it and place it just above the main content area (below the top nav bar):

```jsx
import PlanUsageBanner from '@/Components/PlanUsageBanner';

// In the JSX, above {children}:
<PlanUsageBanner />
{children}
```

**Important note:** The `plan_usage` query runs on every page load for all tenants. For LTD users (who have a transaction limit), this is one extra COUNT query per request. For subscription users on unlimited plans, the function returns null immediately. This is acceptable at current scale. Cache it in Redis for 60 seconds if it becomes a concern later.

**Time to fix: 2 hours**

---

## Business Decision: Acquisition / Shutdown Policy

This was flagged as missing — AppSumo buyers ask about it in Q&A and it costs you sales when unanswered.

**Recommended prepared answer (paste this into your AppSumo Q&A when asked):**

> "Great question. In the event VenQore is acquired, the LTD terms transfer to the acquiring entity as a binding obligation — this will be stated in any acquisition agreement. In the unlikely event we need to shut the product down, we commit to providing a minimum of 12 months advance notice, full data export in standard formats (CSV/JSON), and a pro-rated refund calculated on any subscription payments made after the LTD purchase. Your core business data is never held hostage. We will also open-source the core codebase in a shutdown scenario so existing users can self-host."

You do not need to build anything for this. You just need this answer ready.

---

## What the `UpgradeModal` Shows for LTD Users

Currently `UpgradeModal.jsx` shows subscription plan perks (Growth, Business). For LTD users who hit a limit, the modal should instead show the AppSumo stacking CTA — "Stack another code to upgrade" — not a subscription checkout link.

**Fix:** In `resources/js/Components/UpgradeModal.jsx`, add LTD-specific logic:

```jsx
// After line 84 (where upgradeTo is determined), add:
const isLtd = currentPlan?.startsWith('ltd_');
const ltdTier = isLtd ? parseInt(currentPlan.replace('ltd_', '')) : 0;
const canStackMore = isLtd && ltdTier < 3;
```

Then replace the primary CTA button (the `<a href={upgradeUrl}>` block) with:

```jsx
{isLtd ? (
    canStackMore ? (
        // LTD user who can stack more codes
        <a
            href="https://appsumo.com/products/venqore" // your AppSumo listing URL
            target="_blank"
            rel="noopener"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg"
        >
            <Sparkles size={16} />
            Stack Another AppSumo Code
            <ArrowRight size={14} />
        </a>
    ) : (
        // LTD user at max tier — must subscribe
        <a
            href={upgradeUrl}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 transition-all shadow-lg"
        >
            <Sparkles size={16} />
            Upgrade to Subscription
            <ArrowRight size={14} />
        </a>
    )
) : (
    // Regular subscription user
    <a href={upgradeUrl} className="...existing classes...">
        <Sparkles size={16} />
        Upgrade to {upgradeTo.charAt(0).toUpperCase() + upgradeTo.slice(1)}
        <ArrowRight size={14} />
    </a>
)}
```

**Time to fix: 30 minutes**

---

## Complete Work Summary

| # | Gap | File(s) | Est. Time | Severity |
|---|-----|---------|-----------|----------|
| 1 | Dead POS route (`completeSale` missing) | `routes/web.php` line 88 | 2 min | 🔴 Critical |
| 2 | Redeem page 500 error (method + route name mismatch) | `AppSumoController.php` line 31, `Redeem.jsx` line 29 | 5 min | 🔴 Critical |
| 3 | Monthly transaction limit not defined or enforced | `config/plans.php`, `PlanLimitException.php`, `V3/SaleController.php` | 30 min | 🔴 Critical |
| 4 | LTD users can create unlimited stores | `StoreController.php` `store()` method | 20 min | 🟠 High |
| 5 | AppSumo codes set wrong plan keys (starter vs ltd_1) | `AppSumoController.php` line 87 + 127 | 25 min | 🟠 High |
| 6 | UpgradeModal never mounted in layout | `OneGlanceLayout.jsx` (import + render) | 5 min | 🟠 High |
| 7 | No 80%/95% warning banner | New `PlanUsageBanner.jsx`, `TenantMiddleware.php`, `OneGlanceLayout.jsx` | 2 hrs | 🟡 Medium |
| + | UpgradeModal LTD-specific CTA (stack vs subscribe) | `UpgradeModal.jsx` | 30 min | 🟡 Medium |

**Total estimated development time: ~4–5 hours of focused work**

If you do the 3 critical items (Gaps 1, 2, 3) first, the core enforcement is live in under an hour. The High items (4, 5, 6) add another 50 minutes. Gap 7 and the UpgradeModal LTD CTA are polish but should be done before going live.

---

## Full Pre-Launch Checklist (Updated for Your Actual State)

### Already Done ✅
- [x] `PlanGate` service — production-ready
- [x] `PlanLimitException` — structured 403 response with feature, message, upgrade URL
- [x] Axios interceptor — catches `403 plan_limit` and fires `amd:plan-limit` event
- [x] `UpgradeModal` component — complete UI
- [x] `config/plans.php` — all 7 plan tiers defined including `ltd_1`/`ltd_2`/`ltd_3`
- [x] Staff limit enforced — `StaffController` line 106 has `PlanGate::enforce('staff_limit')`
- [x] Product (SKU) limit enforced — `InventoryController` and `V3/ProductController`
- [x] Warehouse (locations) limit enforced — `V3/WarehouseController`
- [x] WooCommerce gate — `WooCommerceController`
- [x] Growth Engine gate — `GrowthEngineController` line 85
- [x] Redemption page UI — `Redeem.jsx` complete
- [x] Redemption logic — `AppSumoController::redeem()` with stacking + double-redemption prevention
- [x] SuperAdmin code management panel — generate, import, export, purge
- [x] `BillingController` — live usage counts shown to tenants
- [x] `UpgradeModal` — mounted where? Nowhere yet — this is Gap 6

### Must Build Before Launch 🔴
- [ ] Fix dead `pos.sale` route (Gap 1 — 2 minutes)
- [ ] Fix redeem page 500 error (Gap 2 — 5 minutes)
- [ ] Add `transactions_per_month` to config and enforce in `V3/SaleController` (Gap 3 — 30 minutes)
- [ ] Fix AppSumo plan keys to use `ltd_1`/`ltd_2`/`ltd_3` (Gap 5 — 25 minutes)
- [ ] Add `<UpgradeModal />` to `OneGlanceLayout` (Gap 6 — 5 minutes)
- [ ] Add store creation count check to `StoreController` (Gap 4 — 20 minutes)
- [ ] Build `PlanUsageBanner` + wire `plan_usage` from `TenantMiddleware` (Gap 7 — 2 hours)
- [ ] Update `UpgradeModal` for LTD-specific CTA (stack vs subscribe) — 30 minutes
- [ ] Write the "What Your LTD Includes" documentation page on your website
- [ ] Write and test the welcome email sent to new LTD users
- [ ] Generate your AppSumo codes in the SuperAdmin panel (they already work)
- [ ] Write your AppSumo listing description and Q&A
- [ ] Prepare your acquisition/shutdown Q&A answer (use the text above)
- [ ] End-to-end test: redeem a code, hit the transaction limit, verify UpgradeModal appears

### Can Do After Launch (First 30 Days) 🟠
- [ ] Usage meter widget in billing page (showing 480/500 with progress bar)
- [ ] Email notification at 80% transaction threshold
- [ ] Admin tenant monitoring dashboard (who is using how much)
- [ ] Rate limit on code redemption endpoint (5 attempts/min/IP)

---

## Final Timeline with These Numbers

| Day | Task | Hours |
|-----|------|-------|
| Day 1 | Fix Gaps 1, 2, 5, 6 (critical + plan key) | 1 hr |
| Day 1–2 | Build Gap 3 (transaction limit enforcement) | 3 hrs |
| Day 2 | Build Gap 4 (store count check) | 1 hr |
| Day 3–4 | Build Gap 7 (warning banner + TenantMiddleware) | 3 hrs |
| Day 4 | Build UpgradeModal LTD CTA | 1 hr |
| Day 5 | End-to-end testing of full redemption + limit flow | 2 hrs |
| Day 6–7 | Write AppSumo listing, Q&A, welcome email, documentation page | 4 hrs |
| Day 8 | Submit to AppSumo for review | — |
| Day 8–21 | AppSumo review period (1–2 weeks typical) | — |
| **Day 22–28** | **Launch** | — |

**Realistic launch date: 3–4 weeks from today.** The code work is 3–4 days. The content and testing work is 3 days. AppSumo's review takes 1–2 weeks. You cannot compress that review window.

---

*VenQore Internal | April 2026 | Based on full codebase audit*
