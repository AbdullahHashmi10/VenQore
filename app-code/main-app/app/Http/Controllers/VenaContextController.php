<?php

namespace App\Http\Controllers;

use App\Helpers\SettingsHelper;
use App\Models\Tenant;
use App\Services\PlanRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * VenaContextController
 *
 * Returns the current tenant's subscription context to the Vena chat widget.
 * This powers subscription-awareness inside the AI system prompt:
 *   - Vena can tell a user whether a feature is on their plan.
 *   - Vena knows their limits (warehouses, users, stores).
 *   - Vena knows whether to quote Pakistani pricing (geo_verified gate).
 *
 * Route: GET /api/{store_slug}/vena/context
 * Auth:  Public (store_slug resolves tenant, no auth required for widget).
 */
class VenaContextController extends Controller
{
    public function index(Request $request, string $storeSlug): JsonResponse
    {
        // Resolve tenant from slug — same pattern as VisitorChatController
        $tenant = Tenant::where('slug', $storeSlug)->first();

        if (!$tenant) {
            return response()->json(['error' => 'Store not found.'], 404);
        }

        // ── Plan label mapping ─────────────────────────────────────────────────
        $planLabels = [
            'trial'    => 'Free Trial',
            'starter'  => 'Starter Plan',
            'growth'   => 'Growth Plan',
            'business' => 'Business Plan',
            'ltd'      => 'Lifetime Deal',
        ];

        // ── Feature flags from tenant record ──────────────────────────────────
        // base_features are always available; advanced features depend on plan.
        $features = [
            // Core — always available
            'pos'         => true,
            'invoicing'   => true,
            'expenses'    => true,
            'inventory'   => true,
            'parties'     => true,

            // Plan-gated features — read from plan limits
            'reports_basic'    => true,
            'reports_advanced' => $tenant->getLimit('reports_advanced') === true,
            'api_access'       => $tenant->getLimit('api_access') === true,
            'multi_warehouse'  => ($tenant->getLimit('warehouses') === null || $tenant->getLimit('warehouses') > 1),
            'multi_user'       => ($tenant->getLimit('users') === null || $tenant->getLimit('users') > 1),

            // Feature flags stored directly on tenant
            'variants'         => (bool) $tenant->feature_variants,
            'serials'          => (bool) $tenant->feature_serials,
            'batches'          => (bool) $tenant->feature_batches,
            'manufacturing'    => (bool) $tenant->feature_manufacturing,
        ];

        // ── Limits ────────────────────────────────────────────────────────────
        $limits = [
            'warehouses' => $tenant->getLimit('warehouses') ?? 'unlimited',
            'users'      => $tenant->getLimit('users')      ?? 'unlimited',
            'stores'     => $tenant->getLimit('stores')     ?? 'unlimited',
        ];

        // ── Geo verification ──────────────────────────────────────────────────
        // country_code is set during store setup (system-stored, not user-declared in chat).
        // This is the ONLY signal Vena uses to determine geo-specific pricing.
        // A user saying "I'm from Pakistan" in chat is NOT a verification signal.
        $countryCode  = $tenant->country_code ?? null;
        $geoVerified  = !empty($countryCode);
        $geoCountry   = $countryCode ? strtoupper($countryCode) : null;

        return response()->json([
            'plan'          => $tenant->plan,
            'plan_label'    => $planLabels[$tenant->plan] ?? ucfirst($tenant->plan),
            'status'        => $tenant->status,
            'is_trial'      => $tenant->isTrialActive(),
            'trial_ends_at' => $tenant->trial_ends_at?->toDateString(),
            'features'      => $features,
            'limits'        => $limits,
            'geo_verified'  => $geoVerified,
            'geo_country'   => $geoCountry,
        ]);
    }
}
