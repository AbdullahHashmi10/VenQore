<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\TenantPlanOverride;
use App\Services\PlanRepository;
use App\Services\PlanChangeNotifier;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TenantOverrideController extends Controller
{
    /**
     * List all tenants with override counts and usage context.
     */
    public function index(Request $request)
    {
        $tenants = Tenant::withCount('planOverrides')
            ->with(['planOverrides' => fn($q) => $q->active()])
            ->when($request->search, fn($q) =>
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('slug', 'like', "%{$request->search}%")
            )
            ->when($request->plan, fn($q) => $q->where('plan', $request->plan))
            ->orderByDesc('plan_overrides_count')
            ->paginate(30)
            ->withQueryString();

        return Inertia::render('SuperAdmin/Tenants/Overrides', [
            'tenants' => $tenants,
            'filters' => $request->only(['search', 'plan']),
        ]);
    }

    /**
     * Show override detail for a single tenant — full profile + limits.
     */
    public function show(Tenant $tenant)
    {
        $planLimits      = PlanRepository::getLimits($tenant->plan);
        $effectiveLimits = [];

        foreach ($planLimits as $key => $planDefault) {
            $override = $tenant->planOverrides()->where('override_key', $key)->active()->first();
            $effectiveLimits[$key] = [
                'plan_default' => $planDefault,
                'override'     => $override?->override_value,
                'effective'    => PlanRepository::getEffectiveLimit($tenant->id, $tenant->plan, $key),
                'expires_at'   => $override?->expires_at,
                'reason'       => $override?->reason,
                'applied_at'   => $override?->updated_at,
                'override_id'  => $override?->id,
            ];
        }

        // Load owner info
        $ownerMembership = $tenant->ownerMembership()->with('user')->first();
        $owner = $ownerMembership?->user;

        // Usage counts
        $staffCount   = \App\Models\TenantUser::where('tenant_id', $tenant->id)->where('status', 'active')->count();
        $productCount = \App\Models\Product::where('tenant_id', $tenant->id)->whereNull('deleted_at')->count();
        $salesCount   = \App\Models\Sale::where('tenant_id', $tenant->id)->whereNull('deleted_at')->count();

        return Inertia::render('SuperAdmin/Tenants/OverrideDetail', [
            'tenant' => array_merge($tenant->load('planOverrides')->toArray(), [
                'owner_name'    => $owner?->name  ?? '—',
                'owner_email'   => $owner?->email ?? '—',
                'staff_count'   => $staffCount,
                'product_count' => $productCount,
                'sales_count'   => $salesCount,
            ]),
            'effective_limits' => $effectiveLimits,
            'override_history' => $tenant->planOverrides()->orderByDesc('created_at')->get(),
            'available_keys'   => array_keys($planLimits),
        ]);
    }

    /**
     * Update tenant profile — plan, status, features, dates, locale.
     */
    public function updateTenant(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'name'                  => 'sometimes|string|max:255',
            'plan'                  => 'sometimes|string|in:trial,starter,growth,business,ltd,ltd_1,ltd_2,ltd_3',
            'status'                => 'sometimes|string|in:trial,active,suspended,cancelled',
            'trial_ends_at'         => 'nullable|date',
            'subscription_ends_at'  => 'nullable|date',
            'timezone'              => 'nullable|string|max:100',
            'currency_code'         => 'nullable|string|max:10',
            'currency_symbol'       => 'nullable|string|max:10',
            'industry'              => 'nullable|string|max:100',
            'feature_variants'      => 'boolean',
            'feature_serials'       => 'boolean',
            'feature_batches'       => 'boolean',
            'feature_manufacturing' => 'boolean',
        ]);

        $tenant->update($validated);

        if (isset($validated['plan'])) {
            PlanRepository::invalidateTenantCache($tenant->id);
        }

        return back()->with('success', "Tenant \"{$tenant->name}\" updated successfully.");
    }

    /**
     * Apply a limit override to a tenant.
     * This is the main action — triggers cache invalidation and optional notification.
     */
    public function apply(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'override_key'         => 'required|string|max:100',
            'override_value'       => 'nullable|string|max:255',
            'reason'               => 'nullable|string|max:500',
            'expires_at'           => 'nullable|date|after:now',
            'notify_user'          => 'boolean',
            'notification_message' => 'nullable|string|max:500',
        ]);

        // Capture current effective value for audit trail
        $originalValue = PlanRepository::getEffectiveLimit(
            $tenant->id, $tenant->plan, $validated['override_key']
        );

        TenantPlanOverride::updateOrCreate(
            [
                'tenant_id'    => $tenant->id,
                'override_key' => $validated['override_key'],
            ],
            [
                'override_value' => $validated['override_value'],
                'original_value' => (string) $originalValue,
                'reason'         => $validated['reason'],
                'applied_by'     => auth()->id(),
                'expires_at'     => $validated['expires_at'] ?? null,
            ]
        );

        PlanRepository::invalidateTenantCache($tenant->id);

        if ($validated['notify_user'] ?? true) {
            PlanChangeNotifier::notifyOverride(
                tenant:        $tenant,
                key:           $validated['override_key'],
                oldValue:      $originalValue,
                newValue:      $validated['override_value'],
                customMessage: $validated['notification_message'] ?? null,
                adminId:       auth()->id()
            );
        }

        return back()->with('success', "Override applied to \"{$tenant->name}\". Effective immediately.");
    }

    /**
     * Remove a specific override — tenant reverts to plan default.
     */
    public function remove(Tenant $tenant, TenantPlanOverride $override)
    {
        $override->delete();
        PlanRepository::invalidateTenantCache($tenant->id);

        return back()->with('success', "Override removed. \"{$tenant->name}\" now uses the plan default.");
    }
}
