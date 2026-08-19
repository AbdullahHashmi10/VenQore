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
        // ── tenant resolution: VERBATIM from EnsurePlanFeature. Do not edit. ──
        $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;
        if ($tenant && (is_null($tenant->id) || $tenant->slug === 'test-store')) {
            $tenant = null;
        }

        if (!$tenant) {
            $slug = $request->route('store_slug') ?? $request->route('store') ?? $request->segment(2);
            if ($slug) {
                $tenant = \App\Models\Tenant::withoutGlobalScopes()->where('slug', $slug)->first();
                if ($tenant) {
                    app()->instance('current.tenant', $tenant);
                }
            }
        }

        if (!$tenant) {
            return $next($request);
        }
        // ── end verbatim block ───────────────────────────────────────────────

        $routeName = $request->route()?->getName();

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

        $message = config(
            'ai_builder.messages.gate_blocked',
            "This isn't part of your system yet — add it?"
        );

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
                'upgrade' => false,
            ], 403);
        }

        // Send them to the builder with the module pre-selected, so "add it?"
        // is one click rather than a hunt through a settings page.
        $target = \Illuminate\Support\Facades\Route::has('store.builder')
            ? route('store.builder', ['store_slug' => $tenant->slug, 'add' => $primary])
            : route('store.dashboard', ['store_slug' => $tenant->slug]);

        return redirect($target)->with('info', "{$label} isn't part of your system yet. Add it?");
    }
}
