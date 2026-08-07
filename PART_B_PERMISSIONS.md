# Part B — Permission System Audit

## 1. Library and where permissions/roles are defined

**Not Spatie laravel-permission.** `composer.json` was checked — no `spatie/laravel-permission` (or any laravel-permission package) dependency found. This is a **fully custom, hand-rolled permission system**.

**Middleware:** `app/Http/Middleware/CheckPermissions.php`, registered as the `permission` alias in `bootstrap/app.php:40`:
```php
'permission' => \App\Http\Middleware\CheckPermissions::class,
```
Used in routes as `->middleware('permission:sales.view')` (single) or `->middleware(['permission:purchases.view', 'plan.feature:suppliers_directory'])` (combined with plan gating — see §3).

**Where roles/permissions are defined (three layers):**

1. **`config/permissions.php`** — the file's own docblock calls this *"the SINGLE SOURCE OF TRUTH for all store-level permissions"* (`config/permissions.php:6`). It's a static PHP array keyed by role slug (`owner`, `admin`, `manager`, `cashier`, `accountant`, `purchasing_officer`, `viewer`), each mapping to a flat array of dotted permission strings (e.g. `'sales.view'`, `'finance.journal'`, `'admin.staff_manage'`). This is the **default permission set for a role**.
2. **`TenantUser` pivot table** — column `permissions` (JSON array). Per-user, per-store **override** of the role default. Confirmed in `app/Models/User.php:400-431`, `getPermissionsAttribute()`:
   ```php
   public function getPermissionsAttribute(): array
   {
       if ($this->is_platform_admin) return ['*'];
       $membership = $this->getActiveMembership();
       if ($membership) {
           // 1. Use custom per-user permissions set by admin (non-empty array stored in pivot)
           if (!empty($membership->permissions) && is_array($membership->permissions)) {
               return $membership->permissions;
           }
           // 2. Delegate to config/permissions.php — the CANONICAL permission map
           $role = $membership->role ?? 'viewer';
           return config('permissions.' . $role, []);
       }
       ...
       return ['pos', 'sales_view']; // fallback default if no membership
   }
   ```
3. **`users.permissions` column** — a legacy fallback path (line 419-427) used only if no active membership is found at all. The model's own comment (`User.php:436-438`) explicitly deprecates it: *"NOTE: Store-level permissions live in tenant_users.permissions, NOT here. This column is kept for backward compatibility only. Never use this to change a user's store permissions — update TenantUser directly."*

**Resolution order, confirmed by code:** per-user `TenantUser.permissions` override (if non-empty) → else role default from `config/permissions.php` → else legacy `users.permissions` column (only reached if no membership exists at all) → else hardcoded `['pos', 'sales_view']`.

**How roles are assigned to tenant staff:** via the `TenantUser` pivot model (`app/Models/TenantUser.php` — model referenced throughout, confirmed via `$user->getActiveMembership()` returning a `TenantUser`-typed membership object with `role` and `permissions` fields). One user can belong to multiple tenants via multiple `TenantUser` rows, each with its own role and optional permission-array override — consistent with the multi-tenant description in `CLAUDE.md`.

Platform-level bypass: `is_platform_admin` returns `['*']` (wildcard, all permissions) and is checked with a **separate fast path in `CheckPermissions` itself** (line 39: `if ($user->isPlatformAdmin()) { return $next($request); }`), before the granular permission array is even consulted.

## 2. Per-employee feature-visibility toggle UI — CONFIRMED TO EXIST

`resources/js/Pages/Admin/Users.jsx` is the tenant-owner-facing UI. It contains an explicit "Custom" permission mode:
```jsx
custom: { name: 'Custom', description: 'Specific permissions', icon: Settings, ... }
```
(`Users.jsx:27`) plus a granular per-checkbox toggle function:
```jsx
const togglePermission = (modId) => { ... }
```
(`Users.jsx:443`) and role-preset shortcuts (`toggleRole`, `Users.jsx:435`) that pre-fill the permission array from `ROLE_PERMISSIONS[roleKey]` before allowing further manual editing.

**Backend write path confirmed:** `app/Http/Controllers/AdminController.php`:
- `storeUser()` — validates `'permissions' => 'nullable|array'` (line 559), strips `admin.billing_store` for non-owners (line 600), writes to the new membership's `permissions` column (line 608, 624).
- `updateMember()` — validates `'permissions' => 'nullable|array'` (line 825), same billing-key guard (line 873), writes `$updateData['permissions'] = array_values($permissions)` (line 875) which updates the `TenantUser` pivot row directly.

So: **yes, a tenant owner/admin can toggle individual permission keys per staff member today**, through `Admin/Users.jsx` → `AdminController::storeUser`/`updateMember` → `TenantUser.permissions`. This is a real, wired, working mechanism — not aspirational.

**Not found:** a SuperAdmin (platform-level) UI to toggle a specific tenant's employee permissions from the platform side — only the tenant-owner-facing `Admin/Users.jsx` was located. Not confirmed either way whether SuperAdmin has an equivalent impersonation/override screen; flagged as an open question below.

## 3. Interaction between the permission layer and the plan-entitlement layer

**They are two fully separate systems with no shared code path, wired together only by hand, per route, by whichever developer wrote that line.**

Evidence — `CheckPermissions` (`permission:` middleware) has **zero references** to `PlanRepository`, `PlanGate`, `Plan`, `plan_limits`, or any entitlement concept. It only reads `$user->permissions` (an array of dotted strings) and `Auth::user()`.

Evidence — `EnsurePlanFeature` (`plan.feature:` middleware) has **zero references** to `$user`, permissions, or roles. It only reads `app('current.tenant')` and calls `PlanRepository::canUseFeature($tenant, $feature)`. Full body:
```php
public function handle(Request $request, Closure $next, string $feature): Response
{
    $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;
    if (!$tenant) { return $next($request); }
    if (!PlanRepository::canUseFeature($tenant, $feature)) {
        // ...403 JSON or redirect to billing...
    }
    return $next($request);
}
```
(`app/Http/Middleware/EnsurePlanFeature.php:17-42`)

**No unified check point exists.** They are combined only where a route explicitly lists both middleware names in the same array, e.g.:
```php
Route::resource('suppliers', ...)->only(['index'])->middleware(['permission:purchases.view', 'plan.feature:suppliers_directory']);
Route::middleware(['permission:reports.summary', 'plan.feature:growth_engine'])->group(function () { ... });
Route::get('/expenses', ...)->middleware(['permission:finance.expenses', 'plan.feature:expense_manager'])->name('expenses.index');
```
(`routes/web.php:1043-1052, 1150, 1221-1225`, spot-checked — pattern repeats widely across the file)

**Order of checks (confirmed by Laravel's middleware pipeline semantics + the literal array order used everywhere sampled):** `permission:` is listed **first**, `plan.feature:` **second**, in every combined route found in this pass. Laravel executes route middleware in the order listed, so **permission is checked before plan entitlement** on every route that has both. This means: a staff member without the right permission gets a 403 (`CheckPermissions` line 70) before the system ever checks whether the tenant's plan even includes that feature — the plan-lock response (with its `upgrade: true`, "requires a plan upgrade" messaging) is only reached if the user already has permission. This ordering is consistent everywhere sampled but is **not itself enforced or validated by any shared framework/base-controller/trait** — it is simply the convention every route happened to follow in the samples checked. A developer adding a new route must remember to add **both** middleware strings, in the right combination, by hand; nothing fails loudly if one is forgotten (a route with only `plan.feature:` and no `permission:` would let any authenticated staff member through regardless of role, and a route with only `permission:` and no `plan.feature:` would let a Counter-tier tenant use a feature that should be plan-gated). **Not confirmed** whether such a gap currently exists anywhere in `routes/web.php` — that would require a full route-by-route diff against a canonical required-checks list, which is out of scope for this pass but flagged as the natural next audit (see prior `PLAN_ENTITLEMENT_SOURCE_OF_TRUTH.md`'s finding of the report-keys gap, which is the same class of risk one layer down).

## 4. How Part A's dashboard cards read permission state

**Ad-hoc, local, third system — not the same as `CheckPermissions`/`config/permissions.php`, and not the plan-entitlement `PlanGate`/`usePlan` system either**, though it reads the *same underlying data* (`auth.user.permissions`) that `CheckPermissions` produces server-side.

`resources/js/Pages/Dashboard.jsx:40-46`:
```jsx
const userPerms = auth?.user?.permissions || [];
const hasPerm = (...keys) => keys.some(k => userPerms.some(p => p === k || p.startsWith(k + '.')));
const canSales = isAdmin || hasPerm('sales', 'reports');
const canFinance = isAdmin || hasPerm('finance');
const canInventory = isAdmin || hasPerm('inventory');
const canReports = isAdmin || hasPerm('reports');
const canPurchases = isAdmin || hasPerm('purchases');
```

This reads `auth.user.permissions` — presumably the same array produced by `User::getPermissionsAttribute()` and shared to the frontend via an Inertia shared prop (the prop-sharing point itself, e.g. a `HandleInertiaRequests` middleware, was **not traced** in this pass — flagged below). It reimplements its own prefix-matching logic (`hasPerm`) locally in the component rather than calling any shared hook or utility — there is no `usePermissions()` hook analogous to `usePlan()` found anywhere in `resources/js/Hooks/`. Every page that wants to gate UI by permission must, apparently, write this same `some(p => p === k || p.startsWith(k + '.'))` logic itself (or something like it) rather than import a canonical helper.

Compare to the plan-feature system's frontend reader, `usePlan.js` (`resources/js/Hooks/usePlan.js:6-9`):
```js
const hasFeature = (featureKey) => {
    if (!plan || !plan.features) return true;   // fails OPEN if plan/features missing
    return Boolean(plan.features[featureKey]);
};
```
Note this **fails open** (defaults to `true`/allowed) if the `plan` prop or `plan.features` is absent — the opposite of the backend's documented fail-closed default described in `PLAN_ENTITLEMENT_SOURCE_OF_TRUTH.md` (`"if ($val === null) return false; // Default deny per T2-2"`). This is a second, independent fail-open/fail-closed mismatch beyond what the prior audit found, specific to the frontend hook. Not confirmed whether `plan`/`plan.features` is ever actually missing in production (would require tracing the Inertia shared-prop provider), but if it ever is, the frontend would silently show gated UI that the backend would then 403 on click — the inverse of a UX bug, a "false-positive-then-blocked" experience.

**Conclusion:** Three independent read paths for what is conceptually two different kinds of gating (permission vs. plan) exist across the app:
1. `CheckPermissions` middleware (backend authority for permission).
2. `EnsurePlanFeature` / `PlanRepository::canUseFeature()` (backend authority for plan).
3. `Dashboard.jsx`'s inline `hasPerm()` (frontend, permission, ad-hoc, fail-closed by omission since `userPerms` defaults to `[]`).
4. `usePlan().hasFeature()` (frontend, plan, fail-**open** if props missing) — used by `PlanGate.jsx`/`FeatureLock.jsx`, not by `Dashboard.jsx`.

`Dashboard.jsx` uses only #3 for all its card gating — it does not reference `usePlan`, `PlanGate`, or any plan-feature key anywhere in the file (confirmed by absence of those imports/identifiers when the file was read in full for Part A).

---

## Open questions for the founder

1. Where is the Inertia shared prop `auth.user.permissions` actually populated server-side (which middleware/service provider), and does it always mirror `User::getPermissionsAttribute()` in real time, or could it go stale within a session if an admin edits a staff member's permissions while they're logged in? Not traced in this pass.
2. Is there a SuperAdmin-side (platform-level) UI to view or override a specific tenant's employee permissions, separate from the tenant-owner's own `Admin/Users.jsx`? Not found in this pass — flagged as "does not exist" only in the sense that no such file was located; a further targeted search of `resources/js/Pages/SuperAdmin/` would be needed to fully rule it out.
3. Should `permission:` vs `plan.feature:` ordering (and the requirement to include both where applicable) be enforced by a lint rule, a custom route macro, or a single combined middleware, rather than left to convention? The current architecture has no mechanism to catch a route that has one but not the other.
4. Is the frontend `usePlan().hasFeature()` fail-open behavior (defaults to `true` when `plan`/`plan.features` is missing) intentional, or should it match the backend's fail-closed default? If unintentional, it's a second instance of the same class of bug the prior audit already flagged for the backend resolution chain, but inverted in direction and located in different code.
5. Should `Dashboard.jsx`'s local `hasPerm()` be extracted into a shared `usePermissions()` hook (mirroring `usePlan()`) so every page reads permission state the same way, instead of each page re-implementing the `startsWith('.')` prefix match independently?
