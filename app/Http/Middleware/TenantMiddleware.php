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

        if (!$membership && $user && $user->isPlatformAdmin()) {
            $tenant = Tenant::where('slug', $storeSlug)->first();
            if ($tenant) {
                // Create a virtual/mock membership for the platform admin so they can access the store
                $membership = new TenantUser([
                    'user_id' => $user->id,
                    'tenant_id' => $tenant->id,
                    'role' => 'owner', // Platform superadmin acts as owner inside store contexts
                    'status' => 'active',
                ]);
                $membership->setRelation('tenant', $tenant);
            }
        }

        if (!$membership) {
            // Not a member of this store — stale bookmark or wrong URL
            return redirect()->route('hub')
                ->with('error', 'You do not have access to that store.');
        }

        $tenant = $membership->tenant;

        // ── Demo stores skip all plan/subscription/usage enforcement ─────────
        // The demo is always fully active — we never lock it into view-only mode,
        // expire it as trial, or compute usage counters against a plan.
        if ($tenant->is_demo) {
            $limitStatus = [
                'is_over_limit'    => false,
                'exceeded_feature' => null,
                'current_count'    => 0,
                'limit'            => null,
                'grace_ends_at'    => null,
            ];
            app()->instance('current.tenant',     $tenant);
            app()->instance('current.membership', $membership);
            $request->route()->forgetParameter('store_slug');
            // Skip straight to sharing store data (no limit/subscription checks).
            goto share_store_data;
        }

        // ── View-Only Lock: two independent reasons, one shared column ───────
        // view_only_since is a single column but two unrelated conditions can
        // each independently demand the tenant be locked:
        //   1. Over their usage limit, past the 3-day grace period.
        //   2. Past subscription_ends_at — set by real subscriptions (Lemon
        //      Squeezy) AND by Gift Access Links (GiftRedemptionController /
        //      StoreController), checked here on every request instead of a
        //      scheduled sweep: the lock takes effect the instant the tenant
        //      is actually used again, at zero added server cost.
        // Evaluating and clearing these independently (two separate if/else
        // blocks each unconditionally clearing view_only_since on their own
        // "healthy" branch) is a real bug: whichever check's healthy branch
        // runs would rip away a lock the OTHER check still wants active.
        // Instead: compute both reasons first, then make exactly one decision
        // — lock if either is true, unlock only if NEITHER is true.
        $limitStatus = $tenant->checkLimitsStatus();

        $overUsageLimit = false;
        if ($limitStatus['is_over_limit']) {
            if ($tenant->limit_grace_ends_at === null) {
                // Start the 3-day grace period. Not yet a lock reason.
                $tenant->limit_grace_ends_at = now()->addDays(3);
                $limitStatus['grace_ends_at'] = $tenant->limit_grace_ends_at->toIso8601String();
            } elseif ($tenant->limit_grace_ends_at->isPast()) {
                $overUsageLimit = true; // grace expired — this IS a lock reason
            }
        } elseif ($tenant->limit_grace_ends_at !== null) {
            // Back under limit — grace period no longer needed.
            $tenant->limit_grace_ends_at = null;
            $limitStatus['grace_ends_at'] = null;
        }

        // subscription_ends_at is set both by real subscriptions (Lemon
        // Squeezy) and by Gift Access Links. Only trial/active tenants are
        // considered — never overrides a status this middleware has already
        // redirected away for (trial-expired / suspended, handled below).
        $subscriptionExpired = in_array($tenant->status, ['trial', 'active'], true)
            && $tenant->subscription_ends_at !== null
            && $tenant->subscription_ends_at->isPast();

        $shouldBeLocked = $overUsageLimit || $subscriptionExpired;
        $isLocked       = $tenant->view_only_since !== null;

        if ($shouldBeLocked && !$isLocked) {
            $tenant->view_only_since = now();
        } elseif (!$shouldBeLocked && $isLocked) {
            $tenant->view_only_since = null;
        }

        if ($tenant->isDirty()) {
            $tenant->save();
        }

        // ── Pending plan downgrade check (Local simulated proration/downgrade) ──
        if (is_array($tenant->plan_limits) && isset($tenant->plan_limits['pending_downgrade'])) {
            $pd = $tenant->plan_limits['pending_downgrade'];
            if (isset($pd['plan']) && isset($pd['effective_at']) && now()->parse($pd['effective_at'])->isPast()) {
                $newLimits = $tenant->plan_limits;
                unset($newLimits['pending_downgrade']);
                
                $tenant->update([
                    'plan' => $pd['plan'],
                    'plan_limits' => $newLimits
                ]);
                
                // Clear cache
                \App\Services\PlanRepository::invalidatePlanCache($pd['plan']);
                \App\Services\PlanRepository::invalidateTenantCache($tenant->id);
                \Illuminate\Support\Facades\Log::info("Tenant {$tenant->id} successfully downgraded to {$pd['plan']} at scheduled time {$pd['effective_at']}.");
            }
        }

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

        share_store_data:

        // ── Update last_store_id (deferred — zero latency) ─────────────────
        if ($user->last_store_id !== $tenant->id) {
            // Regenerate session ID to prevent cross-tenant session fixation
            $request->session()->regenerate();

            // Clear store-specific session variables to prevent state leakage
            $keysToForget = [];
            foreach ($request->session()->all() as $key => $value) {
                if (
                    str_starts_with($key, 'store_') || 
                    str_starts_with($key, 'owner_pulse_') || 
                    str_starts_with($key, 'register_')
                ) {
                    $keysToForget[] = $key;
                }
            }
            if (!empty($keysToForget)) {
                $request->session()->forget($keysToForget);
            }

            dispatch(function () use ($user, $tenant) {
                $user->update(['last_store_id' => $tenant->id]);
            })->afterResponse();
        }

        // ── Share store data with all Inertia pages ────────────────────────
        Inertia::share([
            'allowed_reports' => \App\Services\ReportTierGate::allowedKeys(),
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
                'view_only_since' => $tenant->view_only_since,
                'setup_completed' => $tenant->setup_completed,
                'onboarding_step' => $tenant->onboarding_step,
                'logo_url'        => $tenant->logo_url,
                'logo_style'      => $tenant->logo_style,
                'google_connected'      => (bool)$tenant->google_connected,
                'google_backup_email'   => $tenant->google_backup_email,
                'google_backup_enabled' => (bool)$tenant->google_backup_enabled,
                'google_backup_retention' => (int)$tenant->google_backup_retention,
                'features'        => array_merge($tenant->featuresArray(), [
                    'chat_support'     => $tenant->getLimit('chat_support') !== false,
                    'live_chat_widget' => $tenant->getLimit('live_chat_widget') !== false,
                ]),
            ],
            'membership'      => $membership,
            'userRole'        => $membership->role,
            'my_role'         => $membership->role,
            'my_display_name' => $membership->display_name ?? $user->name,
            'my_pos_pin_set'  => !is_null($membership->pos_pin),
            'is_demo'         => (bool)$tenant->is_demo,
            'demo_reset_at'   => $tenant->is_demo ? $this->getNextResetTime() : null,
            'demo_live_users' => $tenant->is_demo ? \Illuminate\Support\Facades\Cache::get('demo_visit_live', 0) : null,
            'woocommerce_enabled' => \App\Services\PlanGate::check('woocommerce'),
            'cookbook_enabled'    => \App\Services\PlanGate::check('bill_of_materials'),
            'limit_grace_status' => [

                'active'  => $tenant->limit_grace_ends_at && now()->lt($tenant->limit_grace_ends_at),
                'ends_at' => $tenant->limit_grace_ends_at ? $tenant->limit_grace_ends_at->toIso8601String() : null,
            ],
            'onboarding_metrics' => [
                'has_products' => \App\Models\Product::exists(),
                'has_purchases' => \App\Models\Invoice::where('type', 'purchase')->exists(),
                'has_sales' => \App\Models\Sale::exists() || \App\Models\Invoice::where('type', 'sale')->exists(),
                'has_expenses' => \App\Models\Expense::exists(),
                'has_drive_sync' => (bool)$tenant->google_backup_enabled,
            ],
            'limit_grace_status_legacy' => [
                'is_over_limit'     => $limitStatus['is_over_limit'],
                'exceeded_feature'  => $limitStatus['exceeded_feature'],
                'current_count'     => $limitStatus['current_count'],
                'limit'             => $limitStatus['limit'],
                'grace_ends_at'     => $limitStatus['grace_ends_at'],
                'is_trial'          => $tenant->status === 'trial',
            ],

            // ── Plan Usage Banner (GAP 7 — AppSumo LTD) ──────────────────
            // Lazy closure: only runs when Inertia serializes the response.
            // Returns null for demo or unlimited plans — no query runs.
            'plan_usage' => function () use ($tenant) {
                if ($tenant->is_demo) return null; // demo is always unlimited
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
