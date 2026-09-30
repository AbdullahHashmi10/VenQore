# V6 Performance Fixes — VenQore main-app

**For the IDE agent.** Every item below was checked against the current code. Do them **in order**, one commit per fix, and measure before and after each (see "How to measure" at the end). Don't change behavior: module gating, plan gating, terminology and permissions must return exactly the same values they return now.

---

## Root cause in one paragraph

V6 moved the module, nav, terminology and plan-gating logic into `HandleInertiaRequests::share()`, so it runs on **every** page request. That code calls `Cache::remember()` inside loops. `.env` has `CACHE_STORE=database`, so each `Cache::remember()` call is a MySQL `SELECT` on the `cache` table, and nothing keeps the value in memory for the rest of the request. The result is hundreds of identical queries per click. On top of that, the React layout is rebuilt on every navigation, the full Ziggy route list is sent on every visit, and the header loads heavy AI components up front.

---

## FIX 1 — Memoize module and terms lookups per request (biggest win)

### Verified problem
- `app/Services/ModuleService.php` → `allFor()` calls `Cache::remember("tenant_modules:{id}")` **every time** it runs.
  - `allVisible()` calls `allEnabled()`, which calls `allFor()` once, and then calls `visible()` for **each** module. Each `visible()` call runs `enabled()`, and each `enabled()` call runs `allFor()` again.
  - `ModuleNavBuilder::build()` loops over every module and calls `visible()`, so it hits `allFor()` again for each one.
  - `EnsureModule` middleware and `DashboardRegistry` call it too.
- `app/Support/Terms.php` → `get()` calls `forTenant()`, which runs `Cache::remember("tenant_terms:{id}")`. `ModuleNavBuilder::label()` calls `Terms::get()` **once per nav item**.
- With `CACHE_STORE=database`, each of those calls is one DB query.

### Fix
Add an in-request memo layer **on top of** the existing cache. Keep the existing `Cache::remember` as the cross-request layer.

**Preferred (Laravel 12):** use the memoized cache store, if this Laravel version has it (run `php artisan --version`; `Cache::memo()` exists in 12.9 and later):
```php
return Cache::memo()->remember("tenant_modules:{$tenant->id}", self::TTL, function () use ($tenant) { ... });
```

**Fallback:** use a static array that is cleared on invalidate:
```php
// ModuleService
private static array $memo = [];

private static function allFor(Tenant $tenant): array
{
    return self::$memo[$tenant->id] ??= Cache::remember("tenant_modules:{$tenant->id}", self::TTL, function () use ($tenant) {
        /* existing body unchanged */
    });
}

public static function invalidate(int $tenantId): void
{
    unset(self::$memo[$tenantId]);
    Cache::forget("tenant_modules:{$tenantId}");
}
```
Do the same in `Terms::forTenant()` with `invalidateCache()`.

Apply the same pattern to these, which are also called many times per request:
- `PlanRepository::getEffectiveLimit()`: memoize the `tenant_override:{tenantId}:{key}` lookup (called about 30+ times per request through `planFeatures`, `limitsFor` and the `woocommerce_enabled`/`cookbook_enabled` checks). Clear the memo in the method that forgets `tenant_override:*`.
- `PlanRepository::getLimits($slug)`: memoize per slug.
- The `hasTable()` and `isDatabaseReady()` helpers in `HandleInertiaRequests`: memoize them in a private array property. They are called about 10 times per request, and each call is a cache query.

⚠️ **Queue workers, Octane and the desktop app are long-running processes.** A static memo must be cleared whenever the data changes (it is, through `invalidate()`), and it must **not** outlive a request in Octane. If Octane or a long queue worker is used, prefer `Cache::memo()` or register a reset in a request-terminating listener. Don't memoize anything keyed only by "current tenant" without the tenant id in the key.

### Also: make `visible()` cheaper
In `allVisible()` and `ModuleNavBuilder::build()`, load `config('modules')` and the tenant map once and pass them in. Don't re-read them per module. (Optional after the memo is in place.)

---

## FIX 2 — Stop using the database as the cache store

### Verified problem
`.env`: `CACHE_STORE=database`, `SESSION_DRIVER=database`, `QUEUE_CONNECTION=database`. Every cache read, even a hit, is a SQL round-trip. Every request also reads and writes the session row.

### Fix
- Local and desktop: set `CACHE_STORE=file` (or `redis` if available). Keep `SESSION_DRIVER=database` only if multi-device session listing needs it; otherwise use `file`.
- Production: use `redis` if the host has it. Otherwise use `file`.
- Run `php artisan config:clear && php artisan cache:clear` after changing it.
- Check that nothing depends on the `cache` DB table directly (search for `DB::table('cache')`). Check `Cache::lock()` usage too: the file driver supports locks, so it should be fine.

Do this **after** Fix 1, so the query-count gain from Fix 1 is measured separately.

---

## FIX 3 — Remove the duplicate `terms` prop and the wasted work in `share()`

### Verified problem
In `HandleInertiaRequests::share()`, the `'terms'` key is defined **twice**. The second definition (an eager IIFE near the bottom) silently overwrites the first `fn ()` one. The first one is dead code.

Also, the comment says `modules`, `nav` and the other `fn ()` props are "lazy, evaluated only when the page asks". **That is wrong.** Plain closures in Inertia shared props are resolved on every full visit. Only partial reloads (`only: [...]`) skip them.

### Fix
1. Delete the second `'terms' => (function () {...})()` block. Keep the first one, and keep its `tenant_terminology` table guard by folding in the `hasTable` check.
2. Fix the misleading comment.
3. Keep `modules`, `nav`, `mobile_nav`, `terms` and `planFeatures` as props, since the shell needs them. They become cheap after Fix 1.
4. `planFeatures`: build it from `PlanRepository::featuresFor($tenant)` (one cached map) where possible, instead of 23 separate `PlanGate::check()` calls. Compare the output before and after; it must be identical.
5. `PlanGate::check()` writes `Log::warning` for unknown keys. If any `REQUIRED_PLAN_FEATURES` key is missing from config, that means a log write on **every request**. Check `storage/logs/laravel.log` for "Unknown or unseeded plan limit key". Fix the missing keys, or log once per key per request.

---

## FIX 4 — SSR: don't try to reach a server that isn't running

### Verified problem
`config/inertia.php` has `ssr.enabled = false`, but `HandleInertiaRequests::share()` does `config(['inertia.ssr.enabled' => $isMarketingRoute])`. That turns SSR on for `/`, `/register`, `/pricing`, `/terms`, `/blog/*` and the other marketing routes. If no SSR node process is listening on `127.0.0.1:13714`, each of those requests waits for the connection to fail before falling back. (The IDE measured about 2.1 s. Re-measure it yourself.)

### Fix
Only enable SSR when it has been explicitly turned on for that environment **and** the bundle exists:
```php
$ssrAllowed = (bool) env('INERTIA_SSR_ENABLED', false) // move to config/inertia.php, read via config()
    && file_exists(base_path('bootstrap/ssr/ssr.js'));
config(['inertia.ssr.enabled' => $isMarketingRoute && $ssrAllowed]);
```
- Put `'enabled_for_marketing' => env('INERTIA_SSR_ENABLED', false)` in `config/inertia.php`. Don't call `env()` outside config files, because `config:cache` breaks it.
- Local `.env`: `INERTIA_SSR_ENABLED=false`.
- Production, where `php artisan inertia:start-ssr` runs under a supervisor: `INERTIA_SSR_ENABLED=true`.
- The Windows desktop app should always be `false`.

---

## FIX 5 — Don't send the Ziggy route list as a prop on every visit

### Verified problem
`share()` includes `'ziggy' => fn () => [...(new Ziggy)->toArray(), 'location' => ...]`. Because closures resolve on every visit (see Fix 3), the whole route table goes into **every** Inertia JSON response. The IDE measured about 127 KB of a 152 KB response. `app.blade.php` already outputs `@routes`, so the client already has the routes.

### Fix
1. **First search the frontend** for anything that reads the prop: `props.ziggy`, `page.props.ziggy`, `usePage().props.ziggy`, `Ziggy.location`, and `ssr.jsx` (SSR usually needs `ziggy` from props).
2. If only `ssr.jsx` or `location` uses it, send just the location on normal visits:
   ```php
   'ziggy' => fn () => $isMarketingRoute && config('inertia.ssr.enabled')
       ? [...(new \Tighten\Ziggy\Ziggy)->toArray(), 'location' => $request->url()]
       : ['location' => $request->url()],
   ```
   Then update any client code that did `route(name, params, absolute, props.ziggy)` so it uses the global `Ziggy` from `@routes`.
3. Optional: add Ziggy `groups` or `except` in `config/ziggy.php` so `@routes` in the HTML doesn't expose platform-admin routes to tenant pages. That's smaller and safer.

---

## FIX 6 — Make `OneGlanceLayout` a persistent layout

### Verified problem
Pages such as `Pages/Dashboard.jsx` render `<OneGlanceLayout activeMenu="Dashboard">…</OneGlanceLayout>` **inside** the page component. Every page is a different component type, so on each navigation React unmounts the whole shell (sidebar, header, AiIsland, modals, intervals) and mounts it again. The `GlobalProviderLayout` wrapper in `app.jsx` persists correctly; `OneGlanceLayout` does not.

### Fix
1. In each page that uses it, remove the inline wrapper and set a persistent layout:
   ```jsx
   export default function Dashboard(props) { return (<>…page content…</>); }
   Dashboard.layout = (page) => <OneGlanceLayout activeMenu="Dashboard">{page}</OneGlanceLayout>;
   ```
   `app.jsx` already handles function layouts (`originalLayout.length > 0`), so no change is needed there.
2. Props the page used to pass to the layout, such as `activeMenu`, title or header actions:
   - Static values go in the `.layout` function as above.
   - Dynamic values can move into a small context or event that the page sets, or the layout can derive them from `usePage().url` or `route().current()`.
3. Inside `OneGlanceLayout`, check effects that assumed "mount = new page" (for example, scroll reset, closing modals, resetting the search box). Change them to listen for `router.on('navigate', …)` instead.
4. Roll out in stages: first **Dashboard, POS, Inventory, Sales** (the most-used pages), then the rest. Search for `<OneGlanceLayout` under `resources/js/Pages` to get the full list.

---

## FIX 7 — Lazy-load the heavy parts of AiIsland

### Verified problem
`Components/AiIsland.jsx` imports these at the top level, so they are downloaded, parsed and mounted with the header on every page:
- `SmartCapturePanel` (large)
- `ChatWidget`
- `motion/react`, `ThinkingOrb` (animated canvas), `useDictation`, `AppRegistry`

It also starts several timers: `fetchNotifications` every 35 s, the ambient ticker every 6.5 s, and a second `setInterval` around line 492. After Fix 6 these won't restart on each click, but they still run.

### Fix
1. ```jsx
   const SmartCapturePanel = React.lazy(() => import('@/Components/SmartCapturePanel'));
   const ChatWidget = React.lazy(() => import('@/Components/ChatWidget'));
   ```
   Render each one only when its mode is open, inside `<Suspense fallback={null}>`.
2. `ThinkingOrb`: don't run its `requestAnimationFrame` loop while the island is idle or collapsed, or while `document.hidden` is true. Show a static frame or a CSS animation when resting. Also respect `prefers-reduced-motion`.
3. Pause all polling intervals while `document.visibilityState !== 'visible'`.
4. Check the interval around line 492. If it polls `sessionStorage` every second, replace it with a `storage` event or a custom `window` event.

---

## FIX 8 — Bundle hygiene (after the above)

- Add `rollup-plugin-visualizer` temporarily and run `npm run build` to see what is in `app-*.js`.
- Anything imported by `app.jsx`, `GlobalProviderLayout` or `OneGlanceLayout` ends up in the core bundle. Move rarely used modals (ActivityHub, CommandPalette, OmniSearch and others) to `React.lazy` so they load when opened.
- Make sure `recharts`, `@visx/*` and `motion` are imported only by pages that use them, not by shared layout files.
- Fonts: only `@import` the font families actually used by default. Load the others when the user picks them in appearance settings.
- Remove `chunkSizeWarningLimit: 1000` so size warnings show up again.

---

## Not a regression, but check it when comparing speeds

- `.env` has `APP_ENV=local` and `APP_DEBUG=true`. If "before V6" was being tested from `npm run build` and now it's `npm run dev`, or the reverse, the comparison isn't fair. Compare with a production build and `APP_DEBUG=false`.
- Run `php artisan config:cache route:cache view:cache` for any real speed test. Clear them before developing again.

---

## How to measure (do this before Fix 1 and after every fix)

1. **Query count per request.** Add a temporary listener in `AppServiceProvider::boot()`:
   ```php
   if (config('app.debug')) {
       $n = 0; \DB::listen(function () use (&$n) { $n++; });
       app()->terminating(function () use (&$n) { \Log::info('queries: '.$n.' '.request()->path()); });
   }
   ```
   Open `/dashboard`, `/inventory`, `/pos` and `/` as a logged-in tenant user. Record the counts. **Target after Fixes 1–3: under 40 on `/inventory`.** Remove the listener when done.
2. **Response time.** Use the browser DevTools Network tab: check TTFB and response size for the Inertia XHR when clicking between pages.
3. **Payload size.** Size of the `X-Inertia` JSON response. Target after Fix 5: under 30 KB on normal pages.
4. **Remounts.** React DevTools Profiler, going from Dashboard to Inventory: after Fix 6 the sidebar and header must **not** show as mounted.

## Regression checks after all fixes
- Turning a module off in the builder removes it from the sidebar **immediately** (confirms cache and memo invalidation).
- Renaming a term (for example, Customer → Patient) shows up in the nav right away.
- A plan override (`tenant_plan_overrides`) still gates the feature.
- Cashier-role users still don't see accounting nav items.
- Marketing pages still render. If SSR is enabled in production, "view source" still shows HTML.
- Login still works, and CSRF still refreshes after login (the `csrf_token` prop is unchanged).
- The Windows desktop app starts and navigates normally.
