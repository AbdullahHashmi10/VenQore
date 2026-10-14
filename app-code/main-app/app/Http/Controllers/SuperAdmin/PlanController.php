<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Platform;
use App\Models\Tenant;
use App\Services\PlanRepository;
use App\Services\Platform\PlanRestorer;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PlanController extends Controller implements \Illuminate\Routing\Controllers\HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new \Illuminate\Routing\Controllers\Middleware(function ($request, $next) {
                if ($request->route()->getActionMethod() !== 'index') {
                    if (!auth()->user()->isPlatformSuperAdmin()) {
                        abort(403, 'Unauthorized. Platform Super Admin role required.');
                    }
                }
                return $next($request);
            }),
        ];
    }

    public function index()
    {
        $plans = Plan::with(['platform', 'limits', 'features'])
            ->orderBy('platform_id')
            ->orderBy('sort_order')
            ->get()
            ->map(function ($plan) {
                $plan->active_tenant_count = self::tenantCountFor($plan->slug);
                $plan->is_core = in_array($plan->slug, PlanRestorer::CORE, true);
                $plan->is_legacy_alias = array_key_exists($plan->slug, PlanRestorer::ALIASES);
                return $plan;
            });

        $platforms = Platform::where('is_active', true)->get();
        $canonicalKeys = PlanRepository::getCanonicalKeys();

        return Inertia::render('SuperAdmin/Plans/Index', [
            'plans'          => $plans,
            'platforms'      => $platforms,
            'canonical_keys' => $canonicalKeys,
            'missing_core'   => app(PlanRestorer::class)->missingCore(),
        ]);
    }

    /**
     * Tenants on this plan, counting legacy alias rows (solo also covers
     * 'counter') and LTD tenants, which are stored as plan='ltd' with the
     * tier in plan_limits.ltd_tier.
     */
    private static function tenantCountFor(string $slug): int
    {
        $slugs = [$slug];
        foreach (PlanRestorer::ALIASES as $alias => $canonical) {
            if ($canonical === $slug) {
                $slugs[] = $alias;
            }
        }
        $count = Tenant::whereIn('plan', $slugs)->count();

        if (str_starts_with($slug, 'ltd_')) {
            $count += Tenant::where('plan', 'ltd')->get(['id', 'plan', 'plan_limits'])
                ->filter(fn ($t) => $t->effectivePlan() === $slug)
                ->count();
        }

        return $count;
    }

    /** Re-create any core plan (solo, starter, …) that was deleted. */
    public function restoreDefaults()
    {
        $created = app(PlanRestorer::class)->restoreMissing();

        return redirect()->route('platform.plans.index')->with(
            'success',
            $created
                ? 'Restored: ' . implode(', ', $created) . '. Review their limits in the feature matrix.'
                : 'All core plans are already present.'
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'platform_id'    => 'required|exists:platforms,id',
            'name'           => 'required|string|max:100',
            'slug'           => ['required', 'string', 'max:100', 'unique:plans,slug', 'regex:/^[a-z0-9_]+$/', \Illuminate\Validation\Rule::notIn(PlanRestorer::RESERVED)],
            'copy_from_plan_id' => 'nullable|integer|exists:plans,id',
            'display_name'   => 'nullable|string|max:150',
            'description'    => 'nullable|string',
            'internal_notes' => 'nullable|string',
            'type'           => 'required|in:trial,subscription,ltd,enterprise',
            'price_monthly'  => 'nullable|numeric|min:0',
            'price_annual'   => 'nullable|numeric|min:0',
            'price_lifetime' => 'nullable|numeric|min:0',
            'price_monthly_pkr'  => 'nullable|numeric|min:0',
            'price_annual_pkr'   => 'nullable|numeric|min:0',
            'price_lifetime_pkr' => 'nullable|numeric|min:0',
            'checkout_url_usd'   => 'nullable|string|url',
            'checkout_url_pkr'   => 'nullable|string|url',
            'is_featured'    => 'boolean',
            'is_active'      => 'boolean',
            'is_visible'     => 'boolean',
            'is_ltd'         => 'boolean',
            'trial_days'     => 'nullable|integer|min:0|max:365',
            'sort_order'     => 'integer|min:0',
            'limits'         => 'array',
            'limits.*.key'   => 'required|string|max:100',
            'limits.*.value' => 'nullable|string|max:255',
            'limits.*.reset_period' => 'in:never,monthly,annually',
        ]);

        // LTD plans are always flagged as lifetime regardless of the checkbox (T3.2).
        if (($validated['type'] ?? null) === 'ltd') {
            $validated['is_ltd'] = true;
        }

        $plan = Plan::create(collect($validated)->except(['limits', 'copy_from_plan_id'])->all());

        // Start from a COMPLETE limit set, then apply what the form filled in.
        // A plan with only the form's handful of keys fails closed on every
        // other feature (PlanRepository denies missing keys).
        $restorer = app(PlanRestorer::class);
        if (!empty($validated['copy_from_plan_id'])) {
            $base = $restorer->limitsOfPlan((int) $validated['copy_from_plan_id']);
        } elseif (in_array($plan->slug, PlanRestorer::CORE, true)) {
            $base = $restorer->defaultLimitsFor($plan->slug);
        } else {
            $starterId = Plan::where('slug', 'starter')->value('id');
            $base = $starterId ? $restorer->limitsOfPlan($starterId) : $restorer->defaultLimitsFor('starter');
        }
        foreach ($validated['limits'] ?? [] as $limit) {
            // Blank on the create form means "inherit from the template", not "unlimited".
            if (($limit['value'] ?? '') !== '' && $limit['value'] !== null) {
                $base[$limit['key']] = $limit['value'];
            }
        }
        $restorer->writeLimits($plan->id, $base);

        if (!empty($validated['copy_from_plan_id'])) {
            $source = Plan::with('features')->find($validated['copy_from_plan_id']);
            foreach ($source?->features ?? [] as $feature) {
                $plan->features()->create($feature->only(['feature', 'is_included', 'tooltip', 'sort_order']));
            }
        }

        PlanRepository::invalidatePlanCache($plan->slug);
        \App\Services\Platform\PlanPricingService::flush();

        return redirect()->route('platform.plans.index')->with('success', "Plan \"{$plan->name}\" created. It is live immediately.");
    }

    public function bulkUpdate(Request $request)
    {
        $canonicalKeys = PlanRepository::getCanonicalKeys();

        $validated = $request->validate([
            'changes' => 'required|array',
            'changes.*' => 'array',
        ]);

        // Validate all keys against canonical registry (F10)
        foreach ($validated['changes'] as $planId => $limits) {
            foreach (array_keys($limits) as $key) {
                if (!in_array($key, $canonicalKeys, true)) {
                    abort(422, "Unknown or non-canonical feature key: '{$key}'.");
                }
            }
        }

        \Illuminate\Support\Facades\DB::transaction(function () use ($validated) {
            foreach ($validated['changes'] as $planId => $limits) {
                $plan = Plan::find($planId);
                if (!$plan) continue;

                foreach ($limits as $key => $value) {
                    $plan->limits()->updateOrCreate(
                        ['key' => $key],
                        [
                            'value' => $value !== null ? (string)$value : null,
                            'reset_period' => PlanRepository::getResetPeriod($key)
                        ]
                    );
                }

                PlanRepository::invalidatePlanCache($plan->slug);
            }
        });

        \App\Services\Platform\PlanPricingService::flush();

        return redirect()->route('platform.plans.index')->with('success', 'Bulk feature matrix limits updated successfully.');
    }

    public function update(Request $request, Plan $plan)
    {
        \Illuminate\Support\Facades\Log::info('PlanController::update called', [
            'plan_id'   => $plan->id,
            'plan_slug' => $plan->slug,
            'input'     => $request->except(['limits']),
        ]);

        // Normalize: convert empty checkout URL strings to null before validation
        // (Laravel 11 doesn't include ConvertEmptyStringsToNull middleware by default)
        $urlFields = ['checkout_url_usd', 'checkout_url_pkr', 'checkout_url_annual', 'checkout_url_annual_pkr'];
        foreach ($urlFields as $field) {
            if ($request->has($field) && $request->input($field) === '') {
                $request->merge([$field => null]);
            }
        }

        $validated = $request->validate([
            'name'           => 'string|max:100',
            'display_name'   => 'nullable|string|max:150',
            'description'    => 'nullable|string',
            'price_monthly'  => 'nullable|numeric|min:0',
            'price_annual'   => 'nullable|numeric|min:0',
            'price_lifetime' => 'nullable|numeric|min:0',
            'price_monthly_pkr'  => 'nullable|numeric|min:0',
            'price_annual_pkr'   => 'nullable|numeric|min:0',
            'price_lifetime_pkr' => 'nullable|numeric|min:0',
            'checkout_url_usd'   => 'nullable|url',
            'checkout_url_pkr'   => 'nullable|url',
            'is_featured'    => 'boolean',
            'is_active'      => 'boolean',
            'is_visible'     => 'boolean',
            'is_ltd'         => 'boolean',
            'trial_days'     => 'nullable|integer|min:0|max:365',
            'sort_order'     => 'integer|min:0',
            'internal_notes' => 'nullable|string',
            'limits'         => 'array',
            'limits.*.key'   => 'required|string',
            'limits.*.value' => 'nullable|string',
            'limits.*.reset_period' => 'in:never,monthly,annually',
        ]);

        // Strip limits from mass-assignment — they are synced separately below
        $planData = collect($validated)->except(['limits'])->map(function ($v, $k) {
            // Convert empty string checkout URLs to null to avoid overwriting with ''
            if (in_array($k, ['checkout_url_usd', 'checkout_url_pkr', 'checkout_url_annual', 'checkout_url_annual_pkr'])
                && $v === '') {
                return null;
            }
            return $v;
        })->toArray();

        $plan->update($planData);

        // Sync limits using upsert
        foreach ($validated['limits'] ?? [] as $limit) {
            $plan->limits()->updateOrCreate(
                ['key' => $limit['key']],
                ['value' => $limit['value'], 'reset_period' => $limit['reset_period'] ?? 'never']
            );
        }

        PlanRepository::invalidatePlanCache($plan->slug);
        \App\Services\Platform\PlanPricingService::flush();

        return redirect()->route('platform.plans.index')->with('success', "Plan updated. All tenants on \"{$plan->slug}\" see the new limits immediately.");
    }

    public function duplicate(Plan $plan)
    {
        $newPlan = $plan->replicate();
        $newPlan->name      = $plan->name . ' (Copy)';
        $newPlan->slug      = $plan->slug . '_copy_' . time();
        $newPlan->is_active = false; // Start inactive — admin must review before activating
        $newPlan->save();

        foreach ($plan->limits as $limit) {
            $newPlan->limits()->create($limit->only(['key', 'value', 'reset_period']));
        }

        foreach ($plan->features as $feature) {
            $newPlan->features()->create($feature->only(['feature', 'is_included', 'tooltip', 'sort_order']));
        }

        return redirect()->route('platform.plans.index')->with('success', "Plan duplicated as \"{$newPlan->name}\". It is inactive — edit and activate when ready.");
    }

    public function destroy(Plan $plan)
    {
        if (in_array($plan->slug, PlanRestorer::CORE, true)) {
            return back()->withErrors([
                'plan' => "\"{$plan->name}\" is a core plan and cannot be deleted. Archive it to hide it instead.",
            ]);
        }

        $activeCount = self::tenantCountFor($plan->slug);

        if ($activeCount > 0) {
            return back()->withErrors([
                'plan' => "Cannot delete — {$activeCount} tenant(s) are currently on this plan. Deactivate it first (new signups are blocked but existing users are unaffected)."
            ]);
        }

        $plan->delete(); // Cascades to plan_limits and plan_features
        PlanRepository::invalidatePlanCache($plan->slug);
        \App\Services\Platform\PlanPricingService::flush();

        return redirect()->route('platform.plans.index')->with('success', "Plan deleted.");
    }

    public function archive(Plan $plan)
    {
        $plan->update(['archived_at' => now(), 'is_active' => false]);
        PlanRepository::invalidatePlanCache($plan->slug);
        \App\Services\Platform\PlanPricingService::flush();

        return redirect()->route('platform.plans.index')->with('success', "Plan \"{$plan->name}\" archived.");
    }

    public function unarchive(Plan $plan)
    {
        $plan->update(['archived_at' => null]);
        PlanRepository::invalidatePlanCache($plan->slug);
        \App\Services\Platform\PlanPricingService::flush();

        return redirect()->route('platform.plans.index')->with('success', "Plan \"{$plan->name}\" unarchived.");
    }
}
