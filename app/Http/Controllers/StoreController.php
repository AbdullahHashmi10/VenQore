<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Models\StoreLicense;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Services\GeoPricingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * StoreController — Definitive Plan
 *
 * Handles creating new stores and the "create or join" landing page
 * shown to new users (0 stores) after registration/login.
 *
 *   /new-store        → redirect to /build-workspace (11 Sep 2026)
 *   POST /new-store   → programmatic create (tests, old clients); goes through
 *                       the same StoreProvisioner as the builder
 *
 * Plan slugs are canonical (App\Support\PlanCatalog: solo/starter/core/scale).
 *
 * A plan chosen in the builder is persisted as `plan_limits.billing_intent`
 * on the tenant (WorkspaceBuilderController::provisionForUser) so Billing
 * knows what to offer when the trial ends.
 */
class StoreController extends Controller
{
    /** Subscription plans that can be trialled — the canonical list (PlanCatalog). */
    private const TRIAL_PLAN_SLUGS = \App\Support\PlanCatalog::SELF_SERVE;

    /**
     * Page shown to users with no stores yet.
     * Offers: create a new store OR join an existing one via join code.
     */
    public function createOrJoin(): Response
    {
        $user = Auth::user();

        // Check if they have an available license to create a store
        $availableLicense = StoreLicense::withoutTenantScope()
            ->where('user_id', $user->id)
            ->where('status', 'available')
            ->first();

        return Inertia::render('Store/CreateOrJoin', [
            'has_license'   => !is_null($availableLicense),
            'license_plan'  => $availableLicense?->plan ?? 'trial',
        ]);
    }

    /** Entry point for creating a store → the builder (?plan= carried through). */
    public function create(Request $request): RedirectResponse
    {
        // Every store is created in ONE place — /build-workspace — so it gets
        // the same modules, defaults and trial whether it is someone's first
        // store or their fifth, licensed or not. The builder recognises a
        // signed-in user (skips the account step) and a held license (skips
        // the plan step; StoreProvisioner claims it).
        $chosen = \App\Support\PlanCatalog::canonical((string) $request->query('plan', ''));

        return redirect()->route('workspace.build', in_array($chosen, self::TRIAL_PLAN_SLUGS, true) ? ['plan' => $chosen] : []);
    }

    /**
     * Create a new store for the authenticated user.
     */
    public function store(Request $request): RedirectResponse
    {
        // Normalise empty selections to null so the `nullable` rules apply.
        // (License holders submit no plan; self-serve trials always include one.)
        if ($request->input('plan') === '') {
            $request->merge(['plan' => null]);
        }
        if ($request->input('interval') === '') {
            $request->merge(['interval' => null]);
        }

        $request->validate([
            'name'          => 'required|string|max:100',
            'plan'          => 'nullable|string|in:solo,starter,core,scale,counter,growth,business',
            'interval'      => 'nullable|string|in:monthly,annual',
            'terms_consent' => 'required|accepted',
        ], [
            'terms_consent.accepted' => 'You must agree to the Terms of Service and Privacy Policy to create a store.',
        ]);

        $user = Auth::user();

        // ── Plan gate ─────────────────────────────────────────────────────────
        // A store can only be created against an available license OR a plan the
        // user explicitly selected on the pricing step. This prevents the old
        // "skip straight to a store" behaviour.
        // Note: AppSumo LTD users with consumed licenses also qualify — their
        // store-count limit is enforced separately below.
        $hasLicense = StoreLicense::withoutTenantScope()
            ->where('user_id', $user->id)
            ->where(function ($q) {
                $q->where('status', 'available')
                  // Consumed AppSumo LTD licenses still grant the right to create
                  // stores (up to the plan's store-count ceiling).
                  ->orWhere(function ($q2) {
                      $q2->where('status', 'consumed')
                         ->where('source', 'appsumo');
                  });
            })
            ->exists();

        $chosenPlan = \App\Support\PlanCatalog::canonical((string) $request->input('plan', ''));



        if (!$hasLicense && !in_array($chosenPlan, self::TRIAL_PLAN_SLUGS, true)) {
            return redirect()->route('store.create')
                ->withErrors(['plan' => 'Please choose a plan to start your free trial.']);
        }

        $interval = $this->normalizeInterval($request->input('interval'));
        $country  = (new GeoPricingService())->resolveCountry($request);

        $lockKey = 'store_create_lock_' . $user->id;
        $lock = \Illuminate\Support\Facades\Cache::lock($lockKey, 10);

        if (!$lock->get()) {
            return back()->withErrors([
                'name' => 'Store creation is already in progress. Please wait.',
            ]);
        }

        try {
            // Same name rule, store-count ceiling and creation path as the
            // builder — see App\Services\StoreProvisioner.
            if ($error = \App\Services\StoreProvisioner::nameError($user, $request->name)) {
                return back()->withErrors(['name' => $error]);
            }
            if ($error = \App\Services\StoreProvisioner::storeLimitError($user)) {
                return back()->withErrors(['name' => $error]);
            }

            app(\App\Services\StoreProvisioner::class)->create($user, [
                'name'           => $request->name,
                'country'        => $country,
                'timezone'       => $request->input('timezone'),
                'currency'       => $request->input('currency'),
                'plan'           => $chosenPlan,
                'interval'       => $interval,
                // No module choice on this form: the setup wizard runs next.
                'setup_completed'=> false,
                'license_source' => 'registration',
            ]);

            $user->refresh();

            return redirect()->route('hub');
        } finally {
            $lock->release();
        }
    }

    // ──────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────

    /** Normalise an arbitrary interval input to one we support. */
    private function normalizeInterval(mixed $interval): string
    {
        $interval = strtolower((string) $interval);
        return in_array($interval, ['monthly', 'annual'], true) ? $interval : 'monthly';
    }

    /**
     * Resolve monthly + annual pricing for a plan in the visitor's currency.
     * Falls back to sensible defaults when the DB has no price configured.
     *
     * @return array{monthly: float, annual: float, annual_total: float}
     */
    public static function resolvePricing(?Plan $plan, string $slug, string $country): array
    {
        $base = \App\Support\PlanCatalog::monthlyUsd($slug) ?: 49.0;
        $isPK = $country === 'PK';
        $rate = (float) (\App\Models\Setting::withoutGlobalScopes()->whereNull('tenant_id')->where('key', 'usd_pkr_rate')->value('value') ?: 280.0);

        if ($isPK) {
            $monthly = $plan?->price_monthly_pkr
                ? (float) $plan->price_monthly_pkr
                : ($plan?->price_monthly ? round($plan->price_monthly * $rate) : $base * $rate);
        } else {
            $monthly = $plan?->price_monthly ? (float) $plan->price_monthly : (float) $base;
        }

        // Annual total: prefer a configured annual price, otherwise apply a 2-month free
        // discount on 12 months (10 months price).
        if ($isPK) {
            $annualTotal = $plan?->price_annual_pkr
                ? (float) $plan->price_annual_pkr
                : ($plan?->price_annual ? round($plan->price_annual * $rate) : round($monthly * 10));
        } else {
            $annualTotal = $plan?->price_annual ? (float) $plan->price_annual : round($monthly * 10);
        }

        return [
            'monthly'      => round($monthly, 2),
            'annual'       => round($annualTotal / 12, 2), // per-month equivalent for display
            'annual_total' => round($annualTotal, 2),
        ];
    }
}
