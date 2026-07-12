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
 * New-store creation is PLAN-GATED. A user can no longer spin up a store
 * without first choosing the plan they want to trial:
 *
 *   1. /new-store                       → plan picker (Store/SelectPlan)
 *   2. /new-store?plan=growth&interval=monthly → name + configure (Store/Create)
 *   3. POST /new-store                  → start the trial on the chosen plan
 *
 * Users who already hold an available license (AppSumo / pre-paid) skip the
 * picker entirely — their plan is predetermined by the license.
 *
 * The plan + billing interval chosen at step 1 is persisted as a
 * `billing_intent` on the tenant so the platform knows exactly what to charge
 * once the free trial ends.
 */
class StoreController extends Controller
{
    /** Subscription plans that can be trialled from the create-store flow. */
    private const TRIAL_PLAN_SLUGS = ['starter', 'growth', 'business'];

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

    /**
     * Entry point for creating a store. Behaves as a small two-step wizard
     * driven entirely off the query string so no extra routes (and therefore
     * no Ziggy regeneration) are required:
     *
     *   • Available license          → straight to the naming form (plan fixed)
     *   • ?plan=<slug>&interval=<..>  → naming form for the chosen plan
     *   • (nothing)                  → the plan picker
     */
    public function create(Request $request): Response
    {
        $user = Auth::user();

        $license = StoreLicense::withoutTenantScope()
            ->where('user_id', $user->id)
            ->where('status', 'available')
            ->first();

        // ── Path A: pre-paid / AppSumo license — plan is already decided ──────
        if ($license) {
            return Inertia::render('Store/Create', [
                'available_license' => [
                    'plan'   => $license->plan,
                    'type'   => $license->type,
                    'source' => $license->source,
                ],
                'selected_plan' => null,
                'trial_days'    => 14,
            ]);
        }

        $country = (new GeoPricingService())->resolveCountry($request);

        // ── Path B: a plan has been chosen — show the naming / details form ───
        $chosen   = strtolower((string) $request->query('plan', ''));
        $interval = $this->normalizeInterval($request->query('interval'));

        if (in_array($chosen, self::TRIAL_PLAN_SLUGS, true)) {
            $planModel = Plan::where('slug', $chosen)->first();
            $pricing   = $this->resolvePricing($planModel, $chosen, $country);
            $amount    = $interval === 'annual' ? $pricing['annual_total'] : $pricing['monthly'];

            return Inertia::render('Store/Create', [
                'available_license' => null,
                'selected_plan'     => [
                    'slug'     => $chosen,
                    'name'     => $this->planDisplayName($chosen),
                    'interval' => $interval,
                    'amount'   => $amount,
                    'cadence'  => $interval === 'annual' ? 'year' : 'month',
                    'currency' => $country === 'PK' ? 'PKR' : 'USD',
                    'symbol'   => $country === 'PK' ? 'Rs' : '$',
                ],
                'trial_days' => $planModel?->trial_days ?? 14,
            ]);
        }

        // ── Path C: no plan yet — show the plan picker ────────────────────────
        return Inertia::render('Store/SelectPlan', [
            'plans'      => $this->planCatalog($country),
            'currency'   => [
                'code'   => $country === 'PK' ? 'PKR' : 'USD',
                'symbol' => $country === 'PK' ? 'Rs' : '$',
            ],
            'trial_days' => 14,
        ]);
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
            'name'     => 'required|string|max:100',
            'plan'     => 'nullable|string|in:starter,growth,business',
            'interval' => 'nullable|string|in:monthly,annual',
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

        $chosenPlan = strtolower((string) $request->input('plan', ''));



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
            // ── Unique Store Name & Soft-Delete Re-activation Check ───────────
            $baseSlug = \Illuminate\Support\Str::slug($request->name);
            if (empty($baseSlug)) {
                $baseSlug = 'store';
            }
            if (strlen($baseSlug) < 3) {
                $baseSlug = $baseSlug . '-store';
            }

            $existingTenant = \App\Models\Tenant::withTrashed()->where('slug', $baseSlug)->first();

            if ($existingTenant) {
                // Check if the current user was or is the owner of this store
                $wasOwner = \App\Models\TenantUser::where('tenant_id', $existingTenant->id)
                    ->where('user_id', $user->id)
                    ->where('role', 'owner')
                    ->exists();

                if ($existingTenant->trashed()) {
                    if ($wasOwner) {
                        return back()->withErrors([
                            'name' => 'This store was previously deleted by you. Please contact support to reopen it.',
                        ]);
                    } else {
                        return back()->withErrors([
                            'name' => 'This store name is already taken. Please choose a unique store name.',
                        ]);
                    }
                } else {
                    if ($wasOwner) {
                        return back()->withErrors([
                            'name' => 'You already have an active store with this name.',
                        ]);
                    } else {
                        return back()->withErrors([
                            'name' => 'This store name is already in use by another account. Please choose a unique store name.',
                        ]);
                    }
                }
            }

            // ── LTD Store Limit Check ─────────────────────────────────────────
            // Count how many stores this user already owns (any status).
            $ownedStoreCount = TenantUser::where('user_id', $user->id)
                ->where('role', 'owner')
                ->count();

            // Check their AppSumo license plan for a store count ceiling.
            $appsumoLicense = StoreLicense::withoutTenantScope()
                ->where('user_id', $user->id)
                ->whereIn('status', ['available', 'consumed'])
                ->where('source', 'appsumo')
                ->orderByDesc('created_at')
                ->first();

            if ($appsumoLicense) {
                $storeLimits = [
                    'ltd_1'    => 1,
                    'ltd_2'    => 2,
                    'ltd_3'    => 4,
                    // legacy keys (pre-fix) — keep for backward compat
                    'starter'  => 1,
                    'growth'   => 2,
                    'business' => 4,
                ];
                $storeLimit = $storeLimits[$appsumoLicense->plan] ?? 1;

                if ($ownedStoreCount >= $storeLimit) {
                    return back()->withErrors([
                        'name' => "Your AppSumo plan allows a maximum of {$storeLimit} store(s). Stack another code to unlock more stores.",
                    ]);
                }
            }
            // ─────────────────────────────────────────────────────────────────

            $tenant = DB::transaction(function () use ($request, $user, $chosenPlan, $interval, $country) {
                // Claim available license or create a trial license
                $license = StoreLicense::withoutTenantScope()
                    ->where('user_id', $user->id)
                    ->where('status', 'available')
                    ->lockForUpdate()
                    ->first();

                // The plan we activate the store on: a held license always wins,
                // otherwise the plan the user selected on the pricing step.
                if ($license) {
                    $plan = $license->plan;
                } else {
                    $plan = in_array($chosenPlan, self::TRIAL_PLAN_SLUGS, true) ? $chosenPlan : 'starter';
                }

                // Trial length comes from the plan definition (fallback: 14 days).
                $trialDays    = optional(Plan::where('slug', $plan)->first())->trial_days ?? 14;
                $trialEndsAt  = now()->addDays($trialDays);

                // Base tenant attributes
                $attributes = [
                    'name'            => $request->name,
                    'slug'            => \App\Services\SubdomainGenerator::generate($request->name),
                    'plan'            => $plan,
                    'status'          => 'trial',
                    'trial_ends_at'   => $trialEndsAt,
                    'join_code'       => $this->generateJoinCode(),
                    'currency_code'   => 'PKR', // Default till setup wizard
                    'currency_symbol' => 'Rs.',
                    'timezone'        => 'Asia/Karachi',
                    'industry'        => 'retail',
                ];

                // ── Gift Access Links ───────────────────────────────────────
                // A license issued by GiftRedemptionController (source =
                // 'gift') carries a real expiry the owner chose (1 month to
                // 5 years) in valid_until. It is not a trial — the recipient
                // gets full active access for that window, not a 14-day
                // trial that would silently shorten what was promised.
                if ($license && $license->source === 'gift' && $license->valid_until) {
                    $attributes['status']               = 'active';
                    $attributes['trial_ends_at']         = null;
                    $attributes['subscription_ends_at']  = $license->valid_until;
                }

                // ── Billing intent ────────────────────────────────────────────
                // Only relevant for self-serve trials (no pre-paid license). This
                // records what the platform should charge once the trial ends.
                if (!$license) {
                    $planModel    = Plan::where('slug', $plan)->first();
                    $pricing      = $this->resolvePricing($planModel, $plan, $country);
                    $chargeAmount = $interval === 'annual' ? $pricing['annual_total'] : $pricing['monthly'];

                    $attributes['plan_limits'] = [
                        'billing_intent' => [
                            'plan'        => $plan,
                            'interval'    => $interval,
                            'amount'      => $chargeAmount,
                            'currency'    => $country === 'PK' ? 'PKR' : 'USD',
                            'cadence'     => $interval === 'annual' ? 'year' : 'month',
                            'charge_on'   => $trialEndsAt->toIso8601String(),
                            'selected_at' => now()->toIso8601String(),
                        ],
                    ];
                }

                // Create the store
                $tenant = Tenant::create($attributes);

                // Make the user the owner
                TenantUser::create([
                    'tenant_id' => $tenant->id,
                    'user_id'   => $user->id,
                    'role'      => 'owner',
                    'status'    => 'active',
                    'joined_at' => now(),
                ]);

                // Consume or create the license record
                if ($license) {
                    $license->update([
                        'tenant_id'   => $tenant->id,
                        'status'      => 'consumed',
                        'consumed_at' => now(),
                    ]);
                } else {
                    StoreLicense::create([
                        'user_id'     => $user->id,
                        'tenant_id'   => $tenant->id,
                        'type'        => 'trial',
                        'status'      => 'consumed',
                        'plan'        => $plan,
                        'source'      => 'registration',
                        'consumed_at' => now(),
                        'valid_until' => $trialEndsAt,
                    ]);
                }

                // Set as their active store
                $user->update(['last_store_id' => $tenant->id]);

                // Seed chart of accounts and default settings
                \Database\Seeders\TenantDefaultSeeder::seedFor($tenant);

                return $tenant;
            });

            $user->refresh();

            return redirect()->route('hub');
        } finally {
            $lock->release();
        }
    }

    // ──────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────

    private function generateJoinCode(): string
    {
        do {
            $code = 'VQ-' . strtoupper(Str::random(4));
        } while (Tenant::where('join_code', $code)->exists());
        return $code;
    }

    /** Normalise an arbitrary interval input to one we support. */
    private function normalizeInterval(mixed $interval): string
    {
        $interval = strtolower((string) $interval);
        return in_array($interval, ['monthly', 'annual'], true) ? $interval : 'monthly';
    }

    /** Friendly tier name shown in the UI (Enterprise == business slug). */
    private function planDisplayName(string $slug): string
    {
        return match ($slug) {
            'starter'  => 'Starter',
            'growth'   => 'Growth',
            'business' => 'Enterprise',
            default    => ucfirst($slug),
        };
    }

    /**
     * Build the list of trial-able subscription plans for the picker, with
     * geo-resolved pricing and display metadata.
     */
    private function planCatalog(string $country): array
    {
        $meta = [
            'starter' => [
                'tagline'  => 'Single-location stores getting serious about POS & inventory.',
                'features' => [
                    '1 Store Location',
                    '3 Staff Accounts',
                    '1,000 Product SKUs',
                    'Full POS Checkout',
                    'Double-Entry Khata',
                    'Email Support',
                ],
                'popular'  => false,
            ],
            'growth' => [
                'tagline'  => 'Expanding outlets that need multi-location stock routing.',
                'features' => [
                    '3 Store Locations',
                    '10 Staff Accounts',
                    '10,000 Product SKUs',
                    '3-Store Multi-Branch Sync',
                    'Batch & Expiry Tracking',
                    'WhatsApp Debt Alerts',
                ],
                'popular'  => true,
            ],
            'business' => [
                'tagline'  => 'Multi-channel operators demanding full-scale operations.',
                'features' => [
                    '10 Store Locations',
                    '50 Staff Accounts',
                    '50,000 Product SKUs',
                    'Serial / IMEI Tracking',
                    'Loyalty & Gift Cards',
                    '24/7 Priority SLA',
                ],
                'popular'  => false,
            ],
        ];

        $plans = Plan::whereIn('slug', self::TRIAL_PLAN_SLUGS)
            ->whereNull('archived_at')
            ->where('is_active', true)
            ->get()
            ->keyBy('slug');

        $catalog = [];
        foreach (self::TRIAL_PLAN_SLUGS as $slug) {
            $planModel = $plans->get($slug);
            $pricing   = $this->resolvePricing($planModel, $slug, $country);

            $catalog[] = [
                'slug'          => $slug,
                'name'          => $this->planDisplayName($slug),
                'tagline'       => $meta[$slug]['tagline'],
                'features'      => $meta[$slug]['features'],
                'popular'       => $meta[$slug]['popular'],
                'price_monthly' => $pricing['monthly'],
                'price_annual'  => $pricing['annual'],        // per-month equivalent
                'annual_total'  => $pricing['annual_total'],  // full yearly charge
                'trial_days'    => $planModel?->trial_days ?? 14,
            ];
        }

        return $catalog;
    }

    /**
     * Resolve monthly + annual pricing for a plan in the visitor's currency.
     * Falls back to sensible defaults when the DB has no price configured.
     *
     * @return array{monthly: float, annual: float, annual_total: float}
     */
    private function resolvePricing(?Plan $plan, string $slug, string $country): array
    {
        $fallbackMonthly = ['starter' => 19, 'growth' => 39, 'business' => 79];
        $base = $fallbackMonthly[$slug] ?? 19;
        $isPK = $country === 'PK';
        $rate = (float) (\App\Models\Setting::withoutGlobalScopes()->whereNull('tenant_id')->where('key', 'usd_pkr_rate')->value('value') ?: 280.0);

        if ($isPK) {
            $monthly = $plan?->price_monthly_pkr
                ? (float) $plan->price_monthly_pkr
                : ($plan?->price_monthly ? round($plan->price_monthly * $rate) : $base * $rate);
        } else {
            $monthly = $plan?->price_monthly ? (float) $plan->price_monthly : (float) $base;
        }

        // Annual total: prefer a configured annual price, otherwise apply a 20%
        // saving on twelve months.
        if ($isPK) {
            $annualTotal = $plan?->price_annual_pkr
                ? (float) $plan->price_annual_pkr
                : ($plan?->price_annual ? round($plan->price_annual * $rate) : round($monthly * 12 * 0.8));
        } else {
            $annualTotal = $plan?->price_annual ? (float) $plan->price_annual : round($monthly * 12 * 0.8);
        }

        return [
            'monthly'      => round($monthly, 2),
            'annual'       => round($annualTotal / 12, 2), // per-month equivalent for display
            'annual_total' => round($annualTotal, 2),
        ];
    }
}
