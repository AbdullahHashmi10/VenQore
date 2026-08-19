<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class WorkspaceBuilderController extends Controller
{
    /**
     * Display the Build Workspace single-page view.
     */
    public function show(Request $request): Response
    {
        $initialPrompt = $request->query('prompt', '');
        $initialPreset = $request->query('preset', '');

        $aiBuilderConfig = config('ai_builder', []);
        $presets = $aiBuilderConfig['presets'] ?? [];

        // Full catalog for the "add more features" step — previously missing
        // entirely, so users could only toggle OFF what the preset suggested,
        // never browse and add from the other ~30 live modules.
        $allModules = collect(config('modules', []))
            ->filter(fn ($m) => ($m['status'] ?? null) === 'live')
            ->map(fn ($m, $key) => [
                'key'         => $key,
                'label'       => $m['label'] ?? ucfirst(str_replace('_', ' ', $key)),
                'description' => $m['description'] ?? '',
            ])
            ->values();

        return Inertia::render('Workspace/BuildWorkspace', [
            'initialPrompt' => $initialPrompt,
            'initialPreset' => $initialPreset,
            'presets'       => $presets,
            'allModules'    => $allModules,
        ]);
    }

    /**
     * Analyze user prompt or template selection and return suggested module stack & friendly capabilities.
     */
    public function analyze(Request $request): JsonResponse
    {
        $request->validate([
            'prompt'   => 'nullable|string|max:1000',
            'preset'   => 'nullable|string',
            'industry' => 'nullable|string',
        ]);

        $prompt = strtolower($request->input('prompt', ''));
        $presetKey = $request->input('preset', '');
        $aiBuilderConfig = config('ai_builder', []);
        $presets = $aiBuilderConfig['presets'] ?? [];

        // Real preset keys live in config/ai_builder.php. Never match a preset
        // that is flagged blocked_by — it isn't shippable yet (see
        // ApplyConfigurationService::applyPreset(), which refuses these too).
        $isShippable = fn (string $key) => isset($presets[$key]) && empty($presets[$key]['blocked_by']);

        // This endpoint runs BEFORE a tenant exists (pre-signup landing page),
        // so it cannot go through ConfigurationAIService::propose() — that
        // pipeline's rate limiter, spend guard and build-count cache are all
        // keyed on tenant_id. Sending an unauthenticated visitor into a live,
        // metered model call with no tenant to bill or throttle against is
        // exactly the kind of hole an "AI-powered landing page" invites abuse
        // through. Instead we use guessPreset() — the same deterministic,
        // alias-scored matcher the real pipeline falls back to — which costs
        // nothing and needs no tenant. The full AI call is reserved for
        // post-signup reconfiguration (OnboardingExperienceController, once a
        // tenant/rate-limit scope exists).
        if ($presetKey && $isShippable($presetKey)) {
            $matchedKey = $presetKey;
        } else {
            $guessed = app(\App\Services\AiBuilder\ConfigurationAIService::class)->guessPreset(['what' => $prompt]);
            $matchedKey = $isShippable($guessed) ? $guessed : 'retail_shop';
        }

        $preset = $presets[$matchedKey] ?? [
            'label'       => 'Custom Business Workspace',
            'description' => 'Tailored workspace built for your operational needs.',
            'modules'     => ['products', 'pos', 'inventory', 'expenses', 'reports'],
        ];

        // Map technical module keys into friendly user capabilities
        $capabilitiesMap = [
            'pos'              => ['label' => 'Point of Sale Counter', 'icon' => 'pos', 'desc' => 'Fast checkout & cash register'],
            'products'         => ['label' => 'Product Catalogue', 'icon' => 'products', 'desc' => 'Items, categories & pricing'],
            'inventory'        => ['label' => 'Inventory Tracking', 'icon' => 'inventory', 'desc' => 'Stock levels & movements'],
            'services'         => ['label' => 'Services Catalog', 'icon' => 'services', 'desc' => 'Service packages & hourly billing'],
            'invoicing'        => ['label' => 'Invoices & Billing', 'icon' => 'invoicing', 'desc' => 'Tax invoices & billing statements'],
            'quotations'       => ['label' => 'Quotations & B2B Proposals', 'icon' => 'quotations', 'desc' => 'Professional customer quotes'],
            'customers'        => ['label' => 'Customer Directory', 'icon' => 'customers', 'desc' => 'Customer history & balances'],
            'expenses'         => ['label' => 'Expense Tracker', 'icon' => 'expenses', 'desc' => 'Operating cost recording'],
            'reports'          => ['label' => 'Financial Pulse & Reports', 'icon' => 'reports', 'desc' => 'Profit, loss & sales analytics'],
            'cookbook'         => ['label' => 'Recipes & Formulations', 'icon' => 'cookbook', 'desc' => 'BOM & dish ingredient costing'],
            'table_service'    => ['label' => 'Table & Floor Service', 'icon' => 'table_service', 'desc' => 'Table layouts & dining orders'],
            'purchases'        => ['label' => 'Purchasing & Stock In', 'icon' => 'purchases', 'desc' => 'Vendor bills & receiving'],
            'suppliers'        => ['label' => 'Supplier Network', 'icon' => 'suppliers', 'desc' => 'Vendor management & payables'],
            'khata_credit'     => ['label' => 'Customer Credit (Khata)', 'icon' => 'khata_credit', 'desc' => 'Ledger credit & dues'],
            'barcodes_labels'  => ['label' => 'Barcodes & Label Printing', 'icon' => 'barcodes_labels', 'desc' => 'SKU barcode tags'],
        ];

        $suggestedCapabilities = [];
        foreach ($preset['modules'] as $modKey) {
            if (isset($capabilitiesMap[$modKey])) {
                $suggestedCapabilities[] = array_merge(['key' => $modKey], $capabilitiesMap[$modKey]);
            } else {
                $suggestedCapabilities[] = [
                    'key'   => $modKey,
                    'label' => ucfirst(str_replace('_', ' ', $modKey)),
                    'desc'  => 'Operational module',
                    'icon'  => 'default',
                ];
            }
        }

        return response()->json([
            'success'      => true,
            'preset_key'   => $matchedKey,
            'preset_label' => $preset['label'] ?? 'Custom Workspace',
            'modules'      => $preset['modules'],
            'capabilities' => $suggestedCapabilities,
        ]);
    }

    /**
     * Provision tenant workspace and register/log in user.
     */
    public function provision(Request $request): JsonResponse
    {
        $request->validate([
            'business_name' => 'required|string|max:255',
            'currency'      => 'nullable|string|max:10',
            'phone'         => 'nullable|string|max:30',
            'email'         => 'required|email|max:255',
            // Password is now required. A nullable password used to fall back to
            // Str::random(12) — a string never shown or emailed to anyone, which
            // permanently locked the owner out of their own account.
            'password'      => 'required|string|min:8',
            'modules'       => 'required|array',
        ]);

        $name = $request->input('business_name');
        $slug = Str::slug($name) . '-' . Str::random(4);
        $email = strtolower($request->input('email'));
        $password = $request->input('password');

        // An email that already belongs to an account must not silently attach
        // a brand-new tenant to it — that is an account-takeover primitive.
        // Require the caller to already be authenticated as that user.
        $existingUser = User::where('email', $email)->first();
        if ($existingUser && !(Auth::check() && Auth::id() === $existingUser->id)) {
            return response()->json([
                'success' => false,
                'message' => 'An account with this email already exists. Please log in first to add a new workspace.',
            ], 409);
        }

        DB::beginTransaction();
        try {
            // 1. Create or retrieve User
            $user = $existingUser;
            if (!$user) {
                $user = User::create([
                    'name'     => $name . ' Owner',
                    'email'    => $email,
                    'password' => Hash::make($password),
                ]);
            }

            // 2. Create Tenant — starts as an actual 14-day trial, not a
            //    permanent free account. ProcessExpiredTrials / SendTrialWarnings
            //    both filter on status='trial' + trial_ends_at, so both must be
            //    set here or those commands never match this tenant.
            $tenant = Tenant::create([
                'name'            => $name,
                'slug'            => $slug,
                'phone'           => $request->input('phone'),
                'plan'            => 'trial',
                'status'          => 'trial',
                'trial_ends_at'   => now()->addDays(14),
                'setup_completed' => true,
                'onboarding_step' => 'completed',
            ]);

            // 3. Attach TenantUser pivot
            TenantUser::create([
                'tenant_id'    => $tenant->id,
                'user_id'      => $user->id,
                'role'         => 'owner',
                'status'       => 'active',
                'display_name' => $user->name,
            ]);

            $user->update(['last_store_id' => $tenant->id]);

            // 4. Initialize modules via the single-writer pipeline (validates,
            //    resolves dependencies, writes the FULL registry row set — see
            //    ApplyConfigurationService for why this must be the only writer).
            $requestedModules = array_values(array_intersect(
                $request->input('modules', []),
                array_keys(config('modules', []))
            ));

            if ($requestedModules === []) {
                $requestedModules = ['products', 'pos', 'inventory', 'expenses', 'reports'];
            }

            app(\App\Services\AiBuilder\ApplyConfigurationService::class)->apply(
                $tenant,
                ['modules' => $requestedModules],
                'preset',
                'Selected during workspace provisioning.'
            );

            DB::commit();

            // Log user in
            Auth::login($user, true);

            return response()->json([
                'success'     => true,
                'redirect'    => route('store.dashboard', ['store_slug' => $tenant->slug]),
                'tenant_slug' => $tenant->slug,
            ]);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Workspace provisioning failed: ' . $e->getMessage(),
            ], 500);
        }
    }
}
