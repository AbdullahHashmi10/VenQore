<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\AiBuilder\ConversationalBuilderService;
use App\Services\AiBuilder\DiscoverySession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class WorkspaceBuilderController extends Controller
{
    /**
     * Plans a visitor can pick during signup, in display order. Custom and the
     * legacy growth/business aliases are sales-led or hidden, so not offered.
     * The trial is identical whichever is picked; the choice is remembered on
     * the store (setting `intended_plan`) and Billing offers it first.
     */
    public const SIGNUP_PLANS = ['solo', 'starter', 'core', 'scale'];

    private function validSignupPlan(?string $plan): ?string
    {
        $plan = strtolower(trim((string) $plan));

        return in_array($plan, self::SIGNUP_PLANS, true) && config("pricing.plans.{$plan}") ? $plan : null;
    }

    /** Plan cards for the builder's plan step, straight from config/pricing.php. */
    private function signupPlans(): array
    {
        $num = fn ($v) => $v === null ? 'Unlimited' : number_format((int) $v);

        return collect(self::SIGNUP_PLANS)
            ->filter(fn ($k) => config("pricing.plans.{$k}"))
            ->map(function ($k) use ($num) {
                $p = config("pricing.plans.{$k}");
                $staff = $p['staff_limit'] ?? null;

                return [
                    'key'           => $k,
                    'name'          => $p['name'] ?? ucfirst($k),
                    'price_monthly' => (float) ($p['price_monthly'] ?? 0),
                    'price_annual'  => ($p['price_annual'] ?? null) !== null ? (float) $p['price_annual'] : null,
                    'badge'         => $p['value_badge'] ?? null,
                    'points'        => array_values(array_filter([
                        $staff === null ? 'Unlimited users' : ($staff === 1 ? '1 user' : "{$staff} users"),
                        $num($p['sku_limit'] ?? null) . ' products',
                        ($p['transactions_per_month'] ?? null) === null
                            ? 'Unlimited sales'
                            : $num($p['transactions_per_month']) . ' sales / month',
                        isset($p['registers']) ? ($p['registers'] === 1 ? '1 till' : "{$p['registers']} tills") : null,
                    ])),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * Display the Build Workspace single-page view.
     */
    public function show(Request $request): Response
    {
        $initialPrompt = $request->query('prompt', '');
        $initialPreset = $request->query('preset', '');

        // The marketing site's "Start building" email capture arrives as
        // ?email=, so the visitor does not retype what they just gave us.
        $initialEmail = (string) $request->query('email', '');

        // The pricing page's plan CTAs arrive as ?plan=<slug>. The 14-day trial
        // is identical whichever plan they clicked, so the choice is remembered
        // rather than applied — Billing preselects it when they come to pay.
        $plan = $this->validSignupPlan((string) $request->query('plan', ''));
        if ($plan) {
            $request->session()->put('intended_plan', $plan);
        }
        $intendedPlan = $plan ?: $this->validSignupPlan((string) $request->session()->get('intended_plan', ''));

        // Default the currency from where the visitor actually is. The form
        // used to hard-code PKR for everyone, which is the wrong first
        // impression for an international launch — and the tenant row defaults
        // to USD anyway, so the two disagreed.
        $geo             = app(\App\Services\GeoPricingService::class);
        $initialCurrency = $geo->getCurrencyInfo($geo->resolveCountry($request))['currency'] ?? 'USD';

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

                // `requires` lets the proposal screen LOCK a hard dependency and
                // say which module needs it, instead of ignoring the click. A
                // control that silently does nothing reads as broken.
                'requires'    => array_values($m['requires'] ?? []),

                // The registry already names a glyph for the nav entry. Reusing
                // it means the icon beside a module is the same one the user
                // will see in the sidebar ten minutes later.
                'icon'        => $m['nav'][0]['icon'] ?? null,
            ])
            ->values();

        return Inertia::render('Workspace/BuildWorkspace', [
            'initialPrompt'   => $initialPrompt,
            'initialPreset'   => $initialPreset,
            'initialEmail'    => $initialEmail,
            'initialCurrency' => $initialCurrency,
            'presets'         => $presets,
            'allModules'      => $allModules,

            // The discovery questions, whole, straight from the config. The page
            // renders whatever is in here — question text, option labels, order,
            // glyphs and the implies maps — and restates none of it. Adding a
            // seventh question is a config edit and nothing else.
            'discovery'       => app(\App\Services\AiBuilder\DiscoveryResolver::class)->questionSet(),
            'recommended'     => app(\App\Services\AiBuilder\DiscoveryResolver::class)->recommendations(),

            // Plan step (after the reveal). Skippable — see SIGNUP_PLANS.
            'plans'           => $this->signupPlans(),
            'intendedPlan'    => $intendedPlan,
        ]);
    }

    /**
     * Analyze user prompt or template selection and return suggested module stack & friendly capabilities.
     */
    public function analyze(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'prompt'   => 'nullable|string|max:1000',
            'preset'   => 'nullable|string',
            'industry' => 'nullable|string',

            // Discovery answers: question key => option key, or an ARRAY of
            // option keys for a multi-select question. Validated loosely on
            // purpose — DiscoveryResolver normalises both shapes and drops
            // anything that is not a real option on a visible question, so the
            // strictness that matters lives in one place rather than two.
            'answers'   => 'nullable|array',
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
        // Whether the eventual preset is a real signal or the bare "found
        // nothing, defaulted to Retail Shop" case — an explicit template pick
        // is always real; free text only counts once guessPresetDetailed()
        // actually scored something. Surfaced to the client as 'matched' below
        // so the reveal can be honest about the difference instead of
        // presenting a shrug as a confident recommendation.
        $matched = true;

        if ($presetKey && $isShippable($presetKey)) {
            $matchedKey = $presetKey;
        } else {
            $guess = app(\App\Services\AiBuilder\ConfigurationAIService::class)->guessPresetDetailed(['what' => $prompt]);
            $matchedKey = $isShippable($guess['preset']) ? $guess['preset'] : 'retail_shop';
            $matched = $guess['matched'];
        }

        // No real signal from a free-text description is exactly what the
        // demand log exists for — a plumbing company, an electrician, any
        // trade this product has no preset built for yet. Same table,
        // same 'never let the roadmap break onboarding' guard as
        // ConfigurationAIService::logUnsupported(), and the 'landing_page'
        // source config/ai_builder.php already reserves for this — unused
        // until now because nothing on this pre-signup path ever wrote to it.
        if (!$matched && trim($prompt) !== '') {
            try {
                DB::table(config('ai_builder.demand_log.table', 'feature_requests'))->insert([
                    'tenant_id'  => null,
                    'source'     => 'landing_page',
                    'raw_text'   => $request->input('prompt', ''),
                    'normalised' => trim($prompt),
                    'status'     => 'pending',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } catch (\Throwable $e) {
                // Never let a demand-log write take the builder down with it.
            }
        }

        $preset = $presets[$matchedKey] ?? [
            'label'       => 'Custom Business Workspace',
            'description' => 'Tailored workspace built for your operational needs.',
            'modules'     => ['products', 'pos', 'inventory', 'expenses', 'reports'],
        ];

        // The answers only ever ADD to the preset, and DiscoveryResolver drops
        // anything that is not a live module in config/modules.php. The client
        // applies the same map from the same config, so the stack the visitor
        // watched being built is the stack that arrives here.
        $answers  = (array) ($validated['answers'] ?? []);
        $resolver = app(\App\Services\AiBuilder\DiscoveryResolver::class);
        $modules  = $resolver->merge($preset['modules'] ?? [], $answers, true, $matchedKey);

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
        foreach ($modules as $modKey) {
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
            'success'            => true,
            'preset_key'         => $matchedKey,
            'matched'            => $matched,
            'preset_label'       => $preset['label'] ?? 'Custom Workspace',
            'preset_description' => $preset['description'] ?? $preset['blurb'] ?? 'Tailored workspace built for your operational needs.',
            'prompt'             => $request->input('prompt', ''),
            'modules'            => $modules,
            'capabilities'       => $suggestedCapabilities,

            // Written from the answer to the "what do you most want to fix"
            // question, so the proposal is headed with the visitor's own stated
            // problem rather than a module count.
            'headline'           => $resolver->headline($answers, $matchedKey),

            // Shown in their own labelled band on the proposal. Never folded
            // silently into `modules` — see config/ai_builder.php §3b.
            'recommended'        => $resolver->recommendations(),
        ]);
    }

    /**
     * Log user business demand / unsupported requests to the feature_requests table.
     */
    public function logDemand(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'prompt' => 'required|string|max:1000',
            'email'  => 'nullable|email|max:255',
            'source' => 'nullable|string|max:64',
        ]);

        try {
            DB::table(config('ai_builder.demand_log.table', 'feature_requests'))->insert([
                'tenant_id'  => null,
                'email'      => $validated['email'] ?? null,
                'source'     => $validated['source'] ?? 'build_workspace',
                'raw_text'   => $validated['prompt'],
                'normalised' => strtolower(trim($validated['prompt'])),
                'status'     => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Thank you! Your business workflow request has been noted by our product team.',
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'message' => 'Unable to record request right now. Please try again.',
            ], 500);
        }
    }

    /**
     * Prepare Google OAuth signup by saving pending workspace configuration into session.
     */
    public function prepareGoogle(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'business_name' => 'nullable|string|max:255',
            'currency'      => 'nullable|string|max:10',
            'phone'         => 'nullable|string|max:30',
            'modules'       => 'nullable|array',
            'preset_key'    => 'nullable|string|max:64',
            'plan'          => 'nullable|string|max:32',
        ]);

        $request->session()->put('pending_workspace_builder', [
            'plan'          => $this->validSignupPlan($validated['plan'] ?? null),
            'business_name' => $validated['business_name'] ?? 'My Business',
            'currency'      => $validated['currency'] ?? 'USD',
            'phone'         => $validated['phone'] ?? null,
            'modules'       => $validated['modules'] ?? [],
            'preset_key'    => $validated['preset_key'] ?? null,
        ]);

        return response()->json([
            'success'  => true,
            'auth_url' => route('auth.google'),
        ]);
    }

    /**
     * Internal helper to provision a tenant workspace for a given user.
     */
    public function provisionForUser(User $user, array $data): ?Tenant
    {
        $name = !empty($data['business_name']) ? (string) $data['business_name'] : 'My Business';
        $slug = Str::slug($name) . '-' . Str::random(4);

        DB::beginTransaction();
        try {
            $presetKey = $data['preset_key'] ?? null;
            $presets = config('ai_builder.presets', []);
            $businessType = ($presetKey && isset($presets[$presetKey]) && empty($presets[$presetKey]['blocked_by']))
                ? $presetKey
                : null;

            $currencyCode   = strtoupper((string) ($data['currency'] ?? 'USD')) ?: 'USD';
            $currencySymbol = $currencyCode === 'PKR' ? 'Rs' : '$';

            $tenant = Tenant::create([
                'name'            => $name,
                'slug'            => $slug,
                'currency_code'   => $currencyCode,
                'currency_symbol' => $currencySymbol,
                'plan'            => 'trial',
                'status'          => 'trial',
                'trial_ends_at'   => now()->addDays(14),
                'setup_completed' => true,
                'onboarding_step' => 'completed',
                'business_type'   => $businessType,
            ]);

            if ($intended = $this->validSignupPlan($data['plan'] ?? null)) {
                \App\Models\Setting::updateOrCreate(
                    ['tenant_id' => $tenant->id, 'key' => 'intended_plan'],
                    ['value' => $intended]
                );
            }

            if (!empty($data['phone'])) {
                \App\Models\Setting::updateOrCreate(
                    ['tenant_id' => $tenant->id, 'key' => 'store_phone'],
                    ['value' => (string) $data['phone']]
                );
            }

            try {
                \App\Services\PlanAiAllowance::applyTo($tenant, 'trial');
            } catch (\Throwable $e) {
                report($e);
            }

            TenantUser::create([
                'tenant_id'    => $tenant->id,
                'user_id'      => $user->id,
                'role'         => 'owner',
                'status'       => 'active',
                'display_name' => $user->name,
            ]);

            $user->update(['last_store_id' => $tenant->id]);

            $requestedModules = array_values(array_intersect(
                $data['modules'] ?? [],
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

            try {
                app()->instance('current.tenant', $tenant);
                app(\App\Http\Controllers\Api\DashboardController::class)
                    ->createDefaultDashboard($user, $tenant);
            } catch (\Throwable $e) {
                report($e);
            }

            DB::commit();
            return $tenant;

        } catch (\Throwable $e) {
            DB::rollBack();
            report($e);
            return null;
        }
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
            'password'      => ['required', 'string', Password::defaults()],
            'modules'       => 'required|array',
            // The matched preset key from analyze(). Never trusted blindly —
            // only written as business_type when it names a real, shippable
            // preset (see $businessType below) — because this one column is
            // what config/dashboard_presets.php keys the tenant's first
            // dashboard board on. Left null it silently falls through to
            // 'default', same as an unrecognised value always has.
            'preset_key'    => 'nullable|string|max:64',
            // Plan picked on the plan step (or null = "decide later").
            'plan'          => 'nullable|string|max:32',
        ]);

        $name = $request->input('business_name');
        $plan = $this->validSignupPlan($request->input('plan'));
        if ($plan) {
            $request->session()->put('intended_plan', $plan);
        }
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

        // AUTH-01 (2026-09-10): a brand-new account must prove its email with
        // the emailed code BEFORE any user, store or trial is created. The
        // builder answers travel in the (encrypted) challenge payload and are
        // provisioned by EmailOtpController::completeSignup().
        if (!$existingUser && config('venqore.email_otp_required', true)) {
            [$challenge, $error] = app(\App\Services\Auth\EmailOtpService::class)->start(
                $request,
                'signup',
                $email,
                null,
                [
                    'name'              => $name . ' Owner',
                    'password_hash'     => Hash::make($password),
                    'workspace_builder' => [
                        'business_name' => $name,
                        'currency'      => $request->input('currency'),
                        'phone'         => $request->input('phone'),
                        'modules'       => $request->input('modules', []),
                        'preset_key'    => $request->input('preset_key'),
                        'plan'          => $plan,
                    ],
                ]
            );

            if (!$challenge) {
                return response()->json(['success' => false, 'message' => $error], 429);
            }

            \App\Http\Controllers\Auth\EmailOtpController::begin($request, $challenge->id, 'signup');

            return response()->json([
                'success'  => true,
                'redirect' => route('otp.show'),
                'pending_verification' => true,
            ]);
        }

        try {
            $user = $existingUser;
            if (!$user) {
                $user = User::create([
                    'name'     => $name . ' Owner',
                    'email'    => $email,
                    'password' => Hash::make($password),
                ]);

                event(new \Illuminate\Auth\Events\Registered($user));
            }

            $tenant = $this->provisionForUser($user, [
                'business_name' => $name,
                'currency'      => $request->input('currency'),
                'phone'         => $request->input('phone'),
                'modules'       => $request->input('modules', []),
                'preset_key'    => $request->input('preset_key'),
                'plan'          => $plan,
            ]);

            if (!$tenant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Workspace provisioning failed. Please try again.',
                ], 500);
            }

            // Log user in
            Auth::login($user, true);

            return response()->json([
                'success'     => true,
                'redirect'    => route('store.dashboard', ['store_slug' => $tenant->slug]),
                'tenant_slug' => $tenant->slug,
            ]);

        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'message' => 'Workspace provisioning failed. Please try again.',
            ], 500);
        }
    }

    /**
     * Start a new dynamic conversational AI discovery session.
     */
    public function converseStart(Request $request, ConversationalBuilderService $service): JsonResponse
    {
        // Caps mirror config('ai_limits.scope.features.config_ai.max_input_chars')
        // (600). AiScopeGuard enforces the same limit inside the gateway; this
        // rejects oversize bodies before any work is done.
        $validated = $request->validate([
            'prompt' => 'required|string|max:600',
            'preset' => ['nullable', 'string', 'max:64', 'regex:/^[a-z0-9_]+$/'],
        ]);

        $result = $service->startSession(
            initialPrompt: $validated['prompt'],
            preset: $validated['preset'] ?? null
        );

        return response()->json($result);
    }

    /**
     * Advance the discovery conversation by one turn.
     */
    public function converseStep(Request $request, ConversationalBuilderService $service): JsonResponse
    {
        // session_id is a server-issued UUID (DiscoverySession::start). Replays
        // cannot burn tokens: a session makes at most DiscoverySession::MAX_TURNS
        // model calls, a completed session returns its stored proposal, and
        // off-purpose turns are rejected by the scope guard without advancing.
        $validated = $request->validate([
            'session_id'          => 'required|uuid',
            'response'            => 'required|string|max:600',
            'selected_option_key' => ['nullable', 'string', 'max:64', 'regex:/^[A-Za-z0-9_:\-]+$/'],
        ]);

        $result = $service->step(
            sessionId: $validated['session_id'],
            userResponse: $validated['response'],
            selectedOptionKey: $validated['selected_option_key'] ?? null
        );

        return response()->json($result);
    }

    /**
     * Reset / forget an active discovery session.
     */
    public function converseReset(Request $request): JsonResponse
    {
        $request->validate(['session_id' => 'nullable|uuid']);

        $sessionId = $request->input('session_id');
        if ($sessionId) {
            $session = DiscoverySession::load($sessionId);
            $session?->forget();
        }

        return response()->json(['success' => true]);
    }
}
