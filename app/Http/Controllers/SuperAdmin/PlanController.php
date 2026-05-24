<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Platform;
use App\Models\Tenant;
use App\Services\PlanRepository;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PlanController extends Controller
{
    public function index()
    {
        $plans = Plan::with(['platform', 'limits', 'features'])
            ->orderBy('platform_id')
            ->orderBy('sort_order')
            ->get()
            ->map(function ($plan) {
                $plan->active_tenant_count = Tenant::where('plan', $plan->slug)->count();
                return $plan;
            });

        $platforms = Platform::where('is_active', true)->get();

        return Inertia::render('SuperAdmin/Plans/Index', [
            'plans'     => $plans,
            'platforms' => $platforms,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'platform_id'    => 'required|exists:platforms,id',
            'name'           => 'required|string|max:100',
            'slug'           => 'required|string|max:100|unique:plans,slug|regex:/^[a-z0-9_]+$/',
            'type'           => 'required|in:trial,subscription,ltd,enterprise',
            'price_monthly'  => 'nullable|numeric|min:0',
            'price_annual'   => 'nullable|numeric|min:0',
            'price_lifetime' => 'nullable|numeric|min:0',
            'is_featured'    => 'boolean',
            'is_active'      => 'boolean',
            'is_visible'     => 'boolean',
            'sort_order'     => 'integer|min:0',
            'limits'         => 'array',
            'limits.*.key'   => 'required|string|max:100',
            'limits.*.value' => 'nullable|string|max:255',
            'limits.*.reset_period' => 'in:never,monthly,annually',
        ]);

        $plan = Plan::create($validated);

        foreach ($validated['limits'] ?? [] as $limit) {
            $plan->limits()->create($limit);
        }

        PlanRepository::invalidatePlanCache($plan->slug);

        return back()->with('success', "Plan \"{$plan->name}\" created. It is live immediately.");
    }

    public function update(Request $request, Plan $plan)
    {
        $validated = $request->validate([
            'name'           => 'string|max:100',
            'display_name'   => 'nullable|string|max:150',
            'description'    => 'nullable|string',
            'price_monthly'  => 'nullable|numeric|min:0',
            'price_annual'   => 'nullable|numeric|min:0',
            'price_lifetime' => 'nullable|numeric|min:0',
            'is_featured'    => 'boolean',
            'is_active'      => 'boolean',
            'is_visible'     => 'boolean',
            'sort_order'     => 'integer|min:0',
            'internal_notes' => 'nullable|string',
            'limits'         => 'array',
            'limits.*.key'   => 'required|string',
            'limits.*.value' => 'nullable|string',
            'limits.*.reset_period' => 'in:never,monthly,annually',
        ]);

        $plan->update($validated);

        // Sync limits using upsert
        foreach ($validated['limits'] ?? [] as $limit) {
            $plan->limits()->updateOrCreate(
                ['key' => $limit['key']],
                ['value' => $limit['value'], 'reset_period' => $limit['reset_period'] ?? 'never']
            );
        }

        PlanRepository::invalidatePlanCache($plan->slug);

        return back()->with('success', "Plan updated. All tenants on \"{$plan->slug}\" see the new limits immediately.");
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

        return back()->with('success', "Plan duplicated as \"{$newPlan->name}\". It is inactive — edit and activate when ready.");
    }

    public function destroy(Plan $plan)
    {
        $activeCount = Tenant::where('plan', $plan->slug)->count();

        if ($activeCount > 0) {
            return back()->withErrors([
                'plan' => "Cannot delete — {$activeCount} tenant(s) are currently on this plan. Deactivate it first (new signups are blocked but existing users are unaffected)."
            ]);
        }

        $plan->delete(); // Cascades to plan_limits and plan_features
        PlanRepository::invalidatePlanCache($plan->slug);

        return back()->with('success', "Plan deleted.");
    }
}
