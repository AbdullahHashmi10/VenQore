<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;

class OnboardingExperienceController extends Controller
{
    /**
     * Display the 7-step onboarding wizard.
     */
    public function index(Request $request): Response
    {
        $tenant = app('current.tenant');
        $modulesConfig = config('modules', []);
        $qoreConfig = config('qore', []);
        $aiBuilderConfig = config('ai_builder', []);

        $presets = $aiBuilderConfig['presets'] ?? [];
        // The discovery question set lives under 'discovery' in config/ai_builder.php
        // — 'questions' was never a real key there, so this prop always arrived empty.
        $questions = $aiBuilderConfig['discovery'] ?? [];

        return Inertia::render('Onboarding/Wizard', [
            'storeSlug'    => $tenant->slug,
            'tenantName'   => $tenant->name,
            'currentStep'  => $tenant->onboarding_step ?? 'welcome',
            'modules'      => $modulesConfig,
            'qore'         => $qoreConfig,
            'presets'      => $presets,
            'questions'    => $questions,
        ]);
    }

    /**
     * Submit AI discovery questionnaire or free prompt.
     */
    public function aiDiscovery(Request $request): JsonResponse
    {
        $request->validate([
            'prompt'     => 'nullable|string|max:1000',
            'answers'    => 'nullable|array',
            'industry'   => 'nullable|string',
        ]);

        $aiBuilderConfig = config('ai_builder', []);
        $presets = $aiBuilderConfig['presets'] ?? [];
        $isShippable = fn (string $key) => isset($presets[$key]) && empty($presets[$key]['blocked_by']);

        // Match against the best-fitting SHIPPABLE preset, or fall back to
        // ConfigurationAIService::guessPreset() — the deterministic, alias-scored
        // matcher already written for exactly this. Real preset keys only
        // (solo_cafe / wholesaler / retail_grocery never existed in config).
        $promptLower = strtolower($request->input('prompt', '') . ' ' . $request->input('industry', ''));

        $matchedKey = app(\App\Services\AiBuilder\ConfigurationAIService::class)
            ->guessPreset(['what' => $promptLower]);

        if (!$isShippable($matchedKey)) {
            $matchedKey = 'retail_shop';
        }

        $chosenPreset = $presets[$matchedKey] ?? reset($presets);

        return response()->json([
            'success'      => true,
            'preset_key'   => $matchedKey,
            'preset'       => $chosenPreset,
            'suggested_modules' => $chosenPreset['modules'] ?? ['products', 'pos', 'inventory', 'expenses', 'reports'],
        ]);
    }

    /**
     * Save chosen onboarding module stack & proceed.
     */
    public function applyPreset(Request $request): JsonResponse
    {
        $request->validate([
            'preset_key' => 'nullable|string',
            'modules'    => 'required|array',
        ]);

        $tenant = app('current.tenant');

        // Real preset keys only, and routed through the single writer — this
        // fixes "deselecting a module leaves it on" (partial writes here used
        // to only ever write ENABLED rows), the missing cache invalidation,
        // and the blocked_by hole all at once.
        $modules = array_values(array_intersect(
            $request->input('modules', []),
            array_keys(config('modules', []))
        ));

        if ($modules !== []) {
            app(\App\Services\AiBuilder\ApplyConfigurationService::class)->apply(
                $tenant,
                ['modules' => $modules],
                'preset',
                'Selected during onboarding wizard.'
            );
        }

        // Same rule as WorkspaceBuilderController::provision(): business_type
        // only ever becomes a real, shippable preset key, never trusted raw —
        // it drives the tenant's first dashboard board via
        // config/dashboard_presets.php. A tenant who reconfigures through a
        // different preset later gets their board re-keyed the same way.
        $presetKey = $request->input('preset_key');
        $presets = config('ai_builder.presets', []);
        if ($presetKey && isset($presets[$presetKey]) && empty($presets[$presetKey]['blocked_by'])) {
            $tenant->business_type = $presetKey;
        }

        $tenant->onboarding_step = 'building';
        $tenant->save();

        return response()->json([
            'success' => true,
            'next_step' => 'building',
        ]);
    }

    /**
     * Complete onboarding and unlock "It was recording all along" history probe.
     */
    public function completeOnboarding(Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $tenant->onboarding_completed = true;
        $tenant->onboarding_step = 'completed';
        $tenant->save();

        // Real historical insights only. months_tracked / stock_value used to be
        // hardcoded (8 months, PKR 847,300) regardless of the tenant — never
        // fabricate numbers shown back to the customer as their own data.
        $recordedSales = \App\Models\Sale::where('tenant_id', $tenant->id)->count();
        $recordedParties = \App\Models\Party::where('tenant_id', $tenant->id)->count();
        $recordedProducts = \App\Models\Product::where('tenant_id', $tenant->id)->count();

        $firstSaleAt = \App\Models\Sale::where('tenant_id', $tenant->id)->min('created_at');
        $monthsTracked = $firstSaleAt
            ? max(1, (int) ceil(\Illuminate\Support\Carbon::parse($firstSaleAt)->diffInDays(now()) / 30))
            : 0;

        $stockValue = \Illuminate\Support\Facades\Schema::hasColumn('products', 'stock_quantity')
                   && \Illuminate\Support\Facades\Schema::hasColumn('products', 'cost_price')
            ? (float) \App\Models\Product::where('tenant_id', $tenant->id)
                ->selectRaw('COALESCE(SUM(stock_quantity * cost_price), 0) as total')
                ->value('total')
            : 0.0;

        $historyProbe = [
            'has_history'       => $recordedSales > 0 || $recordedParties > 0 || $recordedProducts > 0,
            'months_tracked'    => $monthsTracked,
            'recorded_sales'    => $recordedSales,
            'recorded_parties'  => $recordedParties,
            'recorded_products' => $recordedProducts,
            'stock_value'       => $stockValue,
        ];

        return response()->json([
            'success'       => true,
            'history_probe' => $historyProbe,
            'redirect'      => route('store.dashboard', ['store_slug' => $tenant->slug]),
        ]);
    }
}
