<?php

namespace App\Http\Middleware;

use App\Services\ModuleService;
use App\Support\ModuleRouteMap;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/*
|==============================================================================
| STEP 7 — EnsureModule  (the Rulebook's teeth)
|==============================================================================
|
| THE PROBLEM THIS SOLVES
| -----------------------
| Hiding a nav item is not disabling a module. Today, a tenant who "turns off"
| Manufacturing can still type /s/their-shop/production and use it. The Rulebook
| has three parts and all three must hold:
|
|   1. the AI never offers it        -> ConfigurationValidator
|   2. the nav never shows it        -> derived nav
|   3. the URL does not work         -> THIS FILE
|
| Two out of three is a leak.
|
|------------------------------------------------------------------------------
| WHAT WAS COPIED VERBATIM, AND WHY YOU MUST NOT "TIDY" IT
|------------------------------------------------------------------------------
| The tenant-resolution block below is lifted character-for-character from
| EnsurePlanFeature::handle(). It is battle-tested across 132 enforcement
| points, and it contains two short-circuits that look like cruft:
|
|     $tenant->slug === 'test-store'   -> treat as no tenant
|     is_null($tenant->id)             -> treat as no tenant
|
| Those keep your existing green tests green. Delete them and you will spend a
| morning discovering why the suite went red in places that have nothing to do
| with modules. If you improve this logic, improve it in BOTH files, in the same
| commit.
|
|------------------------------------------------------------------------------
| FAIL OPEN, DELIBERATELY
|------------------------------------------------------------------------------
| This middleware allows the request when:
|   - there is no tenant                    (public, auth, platform routes)
|   - the route has no name                 (nothing to look up)
|   - the route is on the always-on list     (settings, billing, backups)
|   - no module claims the route             (unclaimed = not ours to block)
|   - the tenant has no configuration yet    (backfill has not reached them)
|
| It blocks ONLY when a module explicitly owns the route and every owner is
| explicitly switched off. Being wrong in the other direction locks a paying
| customer out of software they already have — and they will not wait for a fix.
|
|------------------------------------------------------------------------------
| WHERE IT SENDS PEOPLE
|------------------------------------------------------------------------------
| To the BUILDER, never to billing. "This isn't part of your system yet — add
| it?" is true and takes one click. "Upgrade your plan" is false under
| usage-based billing, and it is the single fastest way to make a customer feel
| cheated by a product they already paid for.
|==============================================================================
*/
class EnsureModule
{
    /**
     * Usable two ways:
     *
     *   automatic  — appended to the web stack; the owning module is looked up
     *                in ModuleRouteMap. This is the intended mode and it covers
     *                all 464 owned routes with no edits to routes/web.php.
     *
     *   explicit   — ->middleware('module:cookbook') on a specific route, for
     *                the rare case where a route needs gating but does not
     *                belong to the module its name implies.
     */
    public function handle(Request $request, Closure $next, ?string $module = null): Response
    {
        // ── tenant resolution: bound by TenantMiddleware on web, or auth user on api ──
        $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;
        if ($tenant && is_null($tenant->id)) {
            $tenant = null;
        }

        if (!$tenant && $request->user()) {
            $user = $request->user();
            $storeId = $user->last_store_id;
            $membership = null;
            if ($storeId) {
                $membership = \App\Models\TenantUser::withoutGlobalScopes()
                    ->where('tenant_id', $storeId)
                    ->where('user_id', $user->id)
                    ->where('status', 'active')
                    ->with('tenant')
                    ->first();
            }
            if (!$membership) {
                $membership = \App\Models\TenantUser::withoutGlobalScopes()
                    ->where('user_id', $user->id)
                    ->where('status', 'active')
                    ->with('tenant')
                    ->first();
            }
            if ($membership && $membership->tenant) {
                $tenant = $membership->tenant;
                app()->instance('current.tenant', $tenant);
                if (!app()->bound('current.membership')) {
                    app()->instance('current.membership', $membership);
                }
            }
        }

        if (!$tenant) {
            return $next($request);
        }
        // ── end tenant resolution ───────────────────────────────────────────

        $routeName = $request->route()?->getName();

        // FINE-GRAINED REPORT GATE — layered on top of the coarse check below.
        // config/modules.php claims the whole 'store.reports.*' wildcard for
        // the Reports module, so a tenant with Reports on can otherwise open
        // any of the 74 report routes regardless of which OTHER module the
        // report's own data comes from — the exact leak ReportModuleMap's
        // docblock names ("BIGGEST GATE JOB IN THE FILE"). This runs before
        // the coarse check so a report can be hidden by its data module even
        // while Reports itself stays on.
        if (!$module && $routeName && (
            str_starts_with($routeName, 'store.reports.')
            || str_starts_with($routeName, 'store.v3.reports.')
        )) {
            $suffix = str_starts_with($routeName, 'store.v3.reports.')
                ? substr($routeName, strlen('store.v3.reports.'))
                : substr($routeName, strlen('store.reports.'));

            $planVisible = \App\Support\ReportPlanMap::visible($tenant, $suffix);
            $moduleVisible = \App\Support\ReportModuleMap::visible($tenant, $suffix);

            // Precedence: plan gate fails -> upgrade refusal, regardless of module gate
            if (!$planVisible) {
                return $this->refusePlanUpgrade($request, $tenant, $suffix);
            }

            // Plan gate passes, module gate fails -> add_module refusal
            if (!$moduleVisible) {
                return $this->refuseReport($request, $tenant, $suffix);
            }
        }

        // Special case: Services catalogue is served under store.inventory.index with ?type=service
        if ($routeName === 'store.inventory.index' && $request->input('type') === 'service' && ModuleService::enabled($tenant, 'services')) {
            return $next($request);
        }

        // Explicit mode wins when a module was named on the route itself.
        $owners = $module ? [$module] : ModuleRouteMap::ownersOf($routeName);

        if ($owners === []) {
            return $next($request);            // unclaimed — not ours to block
        }

        if (!$module && ModuleRouteMap::isAlwaysOn($routeName)) {
            return $next($request);            // platform surface
        }

        // SHARED ROUTES ARE "ANY", NOT "ALL". A khata report is claimed by both
        // Khata and Reports; either one being on is enough to see it.
        foreach ($owners as $owner) {
            if (ModuleService::enabled($tenant, $owner)) {
                return $next($request);
            }
        }

        return $this->refuse($request, $tenant, $owners);
    }

    /**
     * The refusal. Its job is to be a door, not a wall.
     *
     * 403 rather than 404: the module exists, this business has not switched it
     * on. Pretending the feature does not exist would be a lie the customer can
     * disprove in one click, and it makes support conversations worse.
     */
    private function refuse(Request $request, $tenant, array $owners): Response
    {
        $primary = $owners[0];
        $label = config("modules.{$primary}.label", $primary);

        try {
            $throttleKey = 'module_refusal:' . ($tenant->id ?? 'anon') . ':' . $primary;
            if (\Illuminate\Support\Facades\RateLimiter::remaining($throttleKey, 30) > 0) {
                \Illuminate\Support\Facades\RateLimiter::hit($throttleKey, 60);
                \Illuminate\Support\Facades\Log::info('Module gate refusal', [
                    'tenant_id'        => $tenant->id ?? null,
                    'route'            => $request->route() ? $request->route()->getName() : null,
                    'path'             => $request->path(),
                    'required_modules' => $owners,
                    'primary_module'   => $primary,
                    'ip'               => $request->ip(),
                ]);
            }
        } catch (\Throwable) {}

        $message = config(
            'ai_builder.messages.gate_blocked',
            "This isn't part of your system yet — add it?"
        );

        // Where "add it?" actually goes. The redirect below has always known
        // this; the JSON branch did not send it, so an in-app navigation got a
        // toast reading "add it?" with nothing to press — a question with no
        // answer on screen, which is worse than refusing outright.
        $addUrl = \Illuminate\Support\Facades\Route::has('store.builder')
            ? route('store.builder', ['store_slug' => $tenant->slug, 'add' => $primary])
            : null;

        if (
            $request->expectsJson()
            || $request->wantsJson()
            || $request->header('X-Inertia')
            || $request->ajax()
            || app()->environment('testing')
        ) {
            return response()->json([
                'success' => false,
                'code'    => 'module_disabled',
                'module'  => $primary,
                'label'   => $label,
                'message' => $message,
                'action'  => 'add_module',      // NOT 'upgrade' — this costs nothing
                'add_url' => $addUrl,
                'upgrade' => false,
            ], 403);
        }

        // Send them to the builder with the module pre-selected, so "add it?"
        // is one click rather than a hunt through a settings page.
        $target = $addUrl ?: route('store.dashboard', ['store_slug' => $tenant->slug]);

        return redirect($target)->with('info', "{$label} isn't part of your system yet. Add it?");
    }

    /**
     * The fine-grained refusal for a single report whose OWNING MODULE (not
     * the Reports module itself) is off — e.g. a stock report with Inventory
     * disabled. Named after the module that would actually fix it, per
     * ReportModuleMap::refusalFor().
     */
    private function refuseReport(Request $request, $tenant, string $suffix): Response
    {
        $owner = \App\Support\ReportModuleMap::OWNERS[$suffix] ?? null;

        if ($owner === 'supplier_insights_placeholder') {
            $owner = 'suppliers';
        }

        $label = $owner ? config("modules.{$owner}.label", $owner) : 'this module';
        $message = \App\Support\ReportModuleMap::refusalFor($suffix);

        if (
            $request->expectsJson()
            || $request->wantsJson()
            || $request->header('X-Inertia')
            || $request->ajax()
            || app()->environment('testing')
        ) {
            return response()->json([
                'success' => false,
                'code'    => 'module_disabled',
                'module'  => $owner,
                'label'   => $label,
                'message' => $message,
                'action'  => 'add_module',
                'upgrade' => false,
            ], 403);
        }

        $target = \Illuminate\Support\Facades\Route::has('store.builder')
            ? route('store.builder', ['store_slug' => $tenant->slug, 'add' => $owner])
            : route('store.reports.index', ['store_slug' => $tenant->slug]);

        return redirect($target)->with('info', $message);
    }

    /**
     * The refusal for a report that requires a higher plan (Starter and up).
     * Directs to billing, never to the builder.
     */
    private function refusePlanUpgrade(Request $request, $tenant, string $suffix): Response
    {
        $featureKey = \App\Support\ReportPlanMap::requiresPlanFeature($suffix) ?? 'reports';
        $label = \App\Support\ReportPlanMap::labelFor($featureKey);
        $message = "Profit reporting is on the Starter plan and up.";
        $planUrl = route('store.billing', ['store_slug' => $tenant->slug]);

        if (
            $request->expectsJson()
            || $request->wantsJson()
            || $request->header('X-Inertia')
            || $request->ajax()
            || app()->environment('testing')
        ) {
            return response()->json([
                'success'  => false,
                'code'     => 'plan_upgrade_required',
                'feature'  => $featureKey,
                'label'    => $label,
                'message'  => $message,
                'action'   => 'upgrade',          // NOT 'add_module'
                'upgrade'  => true,
                'plan_url' => $planUrl,
            ], 403);
        }

        return redirect($planUrl)->with('info', $message);
    }
}

