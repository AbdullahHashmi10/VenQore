<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Tenant;
use App\Models\TenantPlanOverride;
use App\Services\PlanRepository;
use App\Services\PlanChangeNotifier;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
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
        $planSlug = $tenant->effectivePlan();
        $isLtd = str_starts_with($planSlug, 'ltd');
        $planLimits = $isLtd ? PlanRepository::getLtdSnapshot($planSlug) : PlanRepository::getLimits($planSlug);
        $canonicalKeys = PlanRepository::getCanonicalKeys();

        // Union of all plan limits + any active overrides on this tenant
        $activeOverridesMap = $tenant->planOverrides()->active()->get()->keyBy('override_key');
        $allKeysToDisplay = array_values(array_unique(array_merge(array_keys($planLimits), $activeOverridesMap->keys()->toArray())));

        $effectiveLimits = [];
        foreach ($allKeysToDisplay as $key) {
            $override = $activeOverridesMap->get($key);
            $planDefault = $planLimits[$key] ?? null;
            $effective = PlanRepository::getEffectiveLimit($tenant->id, $planSlug, $key);

            // Determine if override drops below base plan default
            $isBelow = false;
            if ($override && $override->override_value !== null && $override->override_value !== '' && $planDefault !== null && $planDefault !== '') {
                if (is_numeric($planDefault) && is_numeric($override->override_value)) {
                    $isBelow = (float)$override->override_value < (float)$planDefault;
                } elseif (($planDefault === '1' || $planDefault === true) && ($override->override_value === '0' || $override->override_value === 'false')) {
                    $isBelow = true;
                }
            }

            $effectiveLimits[$key] = [
                'plan_default' => $planDefault,
                'override'     => $override?->override_value,
                'effective'    => $effective,
                'is_below'     => $isBelow,
                'expires_at'   => $override?->expires_at,
                'reason'       => $override?->reason,
                'applied_at'   => $override?->updated_at,
                'override_id'  => $override?->id,
            ];
        }

        // Available keys metadata for arbitrary key search & grant (F13)
        $availableKeysMetadata = [];
        foreach ($canonicalKeys as $ckey) {
            $pDef = array_key_exists($ckey, $planLimits) ? $planLimits[$ckey] : null;
            $availableKeysMetadata[$ckey] = [
                'key'          => $ckey,
                'plan_default' => $pDef,
                'in_plan'      => array_key_exists($ckey, $planLimits),
            ];
        }

        // Dynamic plans catalogue (F1)
        $plans = Plan::whereNull('archived_at')->orderBy('sort_order')->get(['id', 'slug', 'name', 'display_name', 'is_ltd']);

        // Add-ons catalogue & active grants (F8)
        $pricingAddons = config('pricing.add_ons', []);
        $addonEntitlements = config('addon_entitlements', []);
        $addonsCatalogue = [];
        foreach ($pricingAddons as $slug => $details) {
            if (isset($addonEntitlements[$slug])) {
                $addonsCatalogue[$slug] = array_merge($details, [
                    'slug'         => $slug,
                    'entitlements' => $addonEntitlements[$slug],
                ]);
            }
        }

        // Group active overrides created by add-ons
        $activeAddonOverrides = $tenant->planOverrides()
            ->active()
            ->where('reason', 'like', 'add-on:%')
            ->get();

        $activeAddonsGrouped = [];
        foreach ($activeAddonOverrides as $ov) {
            $reason = $ov->reason;
            if (!isset($activeAddonsGrouped[$reason])) {
                $activeAddonsGrouped[$reason] = [
                    'reason'     => $reason,
                    'keys'       => [],
                    'expires_at' => $ov->expires_at,
                    'created_at' => $ov->created_at,
                ];
            }
            $activeAddonsGrouped[$reason]['keys'][] = [
                'key'   => $ov->override_key,
                'value' => $ov->override_value,
                'id'    => $ov->id,
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
            'effective_limits'        => $effectiveLimits,
            'override_history'        => $tenant->planOverrides()->orderByDesc('created_at')->get(),
            'available_keys'          => $canonicalKeys,
            'available_keys_metadata' => $availableKeysMetadata,
            'plans'                   => $plans,
            'addons_catalogue'        => $addonsCatalogue,
            'active_addons'           => array_values($activeAddonsGrouped),
        ]);
    }

    /**
     * Update tenant profile — plan, status, features, dates, locale.
     */
    public function updateTenant(Request $request, Tenant $tenant)
    {
        $allowedPlans = Plan::pluck('slug')
            ->merge(['trial', 'solo', 'starter', 'core', 'scale', 'custom', 'growth', 'business', 'counter', 'ltd', 'ltd_1', 'ltd_2', 'ltd_3'])
            ->unique()
            ->toArray();

        $validated = $request->validate([
            'name'                  => 'sometimes|string|max:255',
            'plan'                  => ['sometimes', 'string', Rule::in($allowedPlans)],
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
     * Triggers cache invalidation, below-plan checks, and optional notification.
     */
    public function apply(Request $request, Tenant $tenant)
    {
        $canonicalKeys = PlanRepository::getCanonicalKeys();

        $validated = $request->validate([
            'override_key'         => ['required', 'string', Rule::in($canonicalKeys)],
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

        // Check if override value is below base plan default
        $planLimits = PlanRepository::getLimits($tenant->effectivePlan());
        $planDefault = $planLimits[$validated['override_key']] ?? null;
        $isBelowPlan = false;

        if ($planDefault !== null && $validated['override_value'] !== null && $validated['override_value'] !== '') {
            if (is_numeric($planDefault) && is_numeric($validated['override_value'])) {
                $isBelowPlan = (float)$validated['override_value'] < (float)$planDefault;
            } elseif (($planDefault === '1' || $planDefault === true) && ($validated['override_value'] === '0' || $validated['override_value'] === 'false')) {
                $isBelowPlan = true;
            }
        }

        TenantPlanOverride::withoutTenantScope()->updateOrCreate(
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

        $successMessage = "Override applied to \"{$tenant->name}\". Effective immediately.";
        if ($isBelowPlan) {
            $successMessage .= " Note: this override is below the base plan default ({$planDefault}).";
        }

        return back()->with('success', $successMessage);
    }

    /**
     * Grant an add-on package in one atomic transaction (F8).
     */
    public function grantAddon(Request $request, Tenant $tenant)
    {
        $entitlements = config('addon_entitlements', []);

        $validated = $request->validate([
            'addon_slug' => ['required', 'string', Rule::in(array_keys($entitlements))],
            'quantity'   => 'required|integer|min:1|max:1000',
            'expires_at' => 'nullable|date|after:now',
            'reason'     => 'nullable|string|max:255',
        ]);

        $addonSlug = $validated['addon_slug'];
        $qty = (int) $validated['quantity'];
        $keys = $entitlements[$addonSlug] ?? [];
        $planSlug = $tenant->effectivePlan();

        $reasonTag = "add-on: {$addonSlug} x{$qty}";
        if (!empty($validated['reason'])) {
            $reasonTag .= " — {$validated['reason']}";
        }

        \Illuminate\Support\Facades\DB::transaction(function () use ($tenant, $planSlug, $keys, $qty, $reasonTag, $validated) {
            foreach ($keys as $key => $grant) {
                $isAdditive = str_starts_with($key, '+');
                $cleanKey = $isAdditive ? substr($key, 1) : $key;

                if ($isAdditive) {
                    $currentEffective = PlanRepository::getEffectiveLimit($tenant->id, $planSlug, $cleanKey);
                    $base = (is_numeric($currentEffective) && (int)$currentEffective > 0) ? (int)$currentEffective : 0;
                    $step = (int)$grant;
                    $newValue = (string)($base + ($qty * $step));
                } else {
                    $newValue = (string)$grant;
                }

                $originalValue = PlanRepository::getEffectiveLimit($tenant->id, $planSlug, $cleanKey);

                TenantPlanOverride::withoutTenantScope()->updateOrCreate(
                    [
                        'tenant_id'    => $tenant->id,
                        'override_key' => $cleanKey,
                    ],
                    [
                        'override_value' => $newValue,
                        'original_value' => (string)$originalValue,
                        'reason'         => $reasonTag,
                        'applied_by'     => auth()->id(),
                        'expires_at'     => $validated['expires_at'] ?? null,
                    ]
                );
            }
        });

        PlanRepository::invalidateTenantCache($tenant->id);

        return back()->with('success', "Add-on \"{$addonSlug}\" (x{$qty}) granted to {$tenant->name}.");
    }

    /**
     * Revoke an add-on unit, removing all matching overrides (F8).
     */
    public function revokeAddon(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'addon_reason' => 'required|string',
        ]);

        $deletedCount = TenantPlanOverride::withoutTenantScope()
            ->where('tenant_id', $tenant->id)
            ->where('reason', $validated['addon_reason'])
            ->delete();

        PlanRepository::invalidateTenantCache($tenant->id);

        return back()->with('success', "Add-on revoked ({$deletedCount} limits restored to base plan defaults).");
    }

    /**
     * Remove a specific override — tenant reverts to plan default.
     * Enforces tenant ownership check (F11).
     */
    public function remove(Tenant $tenant, TenantPlanOverride $override)
    {
        abort_unless($override->tenant_id === $tenant->id, 404, 'Override does not belong to this tenant.');

        $override->delete();
        PlanRepository::invalidateTenantCache($tenant->id);

        return back()->with('success', "Override removed. \"{$tenant->name}\" now uses the plan default.");
    }
}

