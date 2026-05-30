<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Models\TenantUser;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

/**
 * TenantMiddleware — Definitive Plan
 *
 * Resolves the current store from the {store_id} URL route parameter.
 * URL structure: venqore.com/s/{store_id}/dashboard
 *
 * Replaces the old subdomain-based resolution entirely.
 * No wildcard DNS or wildcard SSL required.
 *
 * Flow:
 *   1. Read store_id from route parameter
 *   2. Verify authenticated user has an active membership in that store
 *   3. Check store accessibility (trial/active, not suspended)
 *   4. Bind tenant + membership to DI container
 *   5. Update last_store_id pointer (deferred after response)
 *   6. Share store data with all Inertia pages
 */
class TenantMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $storeSlug = $request->route('store_slug');

        if (!$storeSlug) {
            return redirect()->route('hub');
        }

        $user = Auth::user();

        // ── One query: get membership + tenant in one shot ─────────────────
        $membership = TenantUser::whereHas('tenant', fn($q) => $q->where('slug', $storeSlug))
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->with('tenant')
            ->first();

        if (!$membership) {
            // Not a member of this store — stale bookmark or wrong URL
            return redirect()->route('hub')
                ->with('error', 'You do not have access to that store.');
        }

        $tenant = $membership->tenant;

        // ── Trial expiry check ─────────────────────────────────────────────
        if ($tenant->status === 'trial' && $tenant->trial_ends_at?->isPast()) {
            $tenant->update(['status' => 'suspended']);
            return redirect()->route('store.trial.expired', ['store_slug' => $storeSlug]);
        }

        // ── Suspension / cancellation check ───────────────────────────────
        if (!in_array($tenant->status, ['trial', 'active'])) {
            // Allow them to visit the billing and trial expired pages to renew
            if (!$request->routeIs('store.billing*') && !$request->routeIs('store.trial.expired')) {
                return Inertia::render('Errors/StoreSuspended', [
                    'store_name'  => $tenant->name,
                    'plan'        => $tenant->plan,
                    'billing_url' => route('store.billing', ['store_slug' => $storeSlug]),
                ])->toResponse($request);
            }
        }

        // ── Bind to DI container ───────────────────────────────────────────
        // HasTenant global scope reads app('current.tenant').
        // Everything downstream is unchanged.
        app()->instance('current.tenant',     $tenant);
        app()->instance('current.membership', $membership);

        $request->route()->forgetParameter('store_slug');

        // Shared data has been merged with the main share block below.

        // ── Setup wizard redirect ──────────────────────────────────────────
        if (
            !$tenant->setup_completed &&
            !$request->routeIs('store.setup*', 'logout', 'store.billing*') &&
            !$request->is('storage/*', '_debugbar/*')
        ) {
            return redirect()->route('store.setup', ['store_slug' => $storeSlug]);
        }

        // ── Update last_store_id (deferred — zero latency) ─────────────────
        if ($user->last_store_id !== $tenant->id) {
            dispatch(function () use ($user, $tenant) {
                $user->update(['last_store_id' => $tenant->id]);
            })->afterResponse();
        }

        // ── Share store data with all Inertia pages ────────────────────────
        Inertia::share([
            'store' => [
                'id'              => $tenant->id,
                'slug'            => $tenant->slug,
                'name'            => $tenant->name,
                'plan'            => $tenant->plan,
                'status'          => $tenant->status,
                'currency_symbol' => $tenant->currency_symbol,
                'currency_code'   => $tenant->currency_code,
                'timezone'        => $tenant->timezone,
                'trial_ends_at'   => $tenant->trial_ends_at,
                'subscription_ends_at' => $tenant->subscription_ends_at,
                'setup_completed' => $tenant->setup_completed,
                'onboarding_step' => $tenant->onboarding_step,
                'logo_url'        => $tenant->logo_url,
                'logo_style'      => $tenant->logo_style,
                'features'        => $tenant->featuresArray(),
            ],
            'membership'      => $membership,
            'userRole'        => $membership->role,
            'my_role'         => $membership->role,
            'my_display_name' => $membership->display_name ?? $user->name,
            'my_pos_pin_set'  => !is_null($membership->pos_pin),
            'is_demo'         => (bool)$tenant->is_demo,
            'demo_reset_at'   => $tenant->is_demo ? $this->getNextResetTime() : null,
            'demo_live_users' => $tenant->is_demo ? \Illuminate\Support\Facades\Cache::get('demo_visit_live', 0) : null,

            // ── Plan Usage Banner (GAP 7 — AppSumo LTD) ──────────────────
            // Lazy closure: only runs when Inertia serializes the response.
            // Returns null for unlimited plans (null limit) — no query runs.
            'plan_usage' => function () use ($tenant) {
                $limit = $tenant->getLimit('transactions_per_month');
                if ($limit === null) return null; // unlimited plan — no banner shown

                $used = \App\Models\Sale::where('status', 'posted')
                    ->whereYear('created_at', now()->year)
                    ->whereMonth('created_at', now()->month)
                    ->count();

                return [
                    'transactions_used'  => $used,
                    'transactions_limit' => $limit,
                ];
            },
        ]);

        // Temporary Debug: Verify sharing store prop correctly
        \Illuminate\Support\Facades\Log::info('TenantMiddleware sharing store: ' . ($tenant->slug ?? 'NULL'));

        return $next($request);
    }

    private function getNextResetTime(): string
    {
        $next = now()->utc()->startOfDay()->addHours(6);
        if ($next->isPast()) {
            $next->addDay();
        }
        return $next->toIso8601String();
    }
}
