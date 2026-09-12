<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use App\Models\User;
use App\Services\AiBuilder\ConversationalBuilderService;
use App\Services\AiBuilder\DiscoverySession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class WorkspaceBuilderController extends Controller
{
    /**
     * Plans a visitor can pick during signup, in display order. Custom and the
     * legacy growth/business aliases are sales-led or hidden, so not offered.
     * The trial is identical whichever is picked; the choice is remembered on
     * the store (plan_limits.billing_intent) and Billing offers it first.
     */
    public const SIGNUP_PLANS = \App\Support\PlanCatalog::SELF_SERVE;

    private function validSignupPlan(?string $plan): ?string
    {
        $plan = \App\Support\PlanCatalog::canonical(strtolower(trim((string) $plan)));

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

        // ?type=<business type key> — from a Solutions page or a direct link.
        // Opens straight on that type's setup, like ?preset= does.
        $initialType = \App\Support\BusinessTypes::exists((string) $request->query('type', ''))
            ? (string) $request->query('type')
            : '';

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
        $initialCurrency = \App\Services\StoreProvisioner::defaultCurrencyFor(
            app(\App\Services\GeoPricingService::class)->resolveCountry($request)
        );

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
            'initialType'     => $initialType,

            // The 85 business types (config/business_types.php) for the search
            // box and the one-click list — labels, sector, aliases, the preset
            // each builds on and the words the store will use.
            'businessTypes'   => \App\Support\BusinessTypes::forClient(),
            'sectors'         => \App\Support\BusinessTypes::sectors(),
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

            // Signed in already (e.g. adding a second store from /start)? The
            // account step becomes a single "Create workspace" button.
            'authUser'        => Auth::check() ? ['name' => Auth::user()->name, 'email' => Auth::user()->email] : null,

            // A signed-in owner holding a license (AppSumo / pre-paid / gift):
            // the store runs on that license, so the plan step is skipped.
            'license'         => (function () {
                $l = Auth::check() ? \App\Services\StoreProvisioner::availableLicense(Auth::user()) : null;
                return $l ? [
                    'plan'   => $l->plan,
                    'label'  => \App\Support\PlanCatalog::label($l->plan),
                    'source' => $l->source,
                ] : null;
            })(),
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
            // A business type the visitor picked (config/business_types.php).
            'business_type' => 'nullable|string|max:64',
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
        $candidates = [];

        // An explicitly picked business type wins; then an explicit preset;
        // then whatever the visitor's sentence names (catalogue first — see
        // ConfigurationAIService::guessPresetDetailed()).
        $businessType = \App\Support\BusinessTypes::exists($request->input('business_type')) ? (string) $request->input('business_type') : null;

        if ($businessType && $isShippable((string) \App\Support\BusinessTypes::presetFor($businessType))) {
            $matchedKey = \App\Support\BusinessTypes::presetFor($businessType);
        } elseif ($presetKey && $isShippable($presetKey)) {
            $matchedKey = $presetKey;
            $businessType = null;
        } else {
            $guess = app(\App\Services\AiBuilder\ConfigurationAIService::class)->guessPresetDetailed(['what' => $prompt]);
            $matchedKey = $isShippable($guess['preset']) ? $guess['preset'] : 'retail_shop';
            $matched = $guess['matched'];
            $businessType = $guess['business_type'] ?? null;
            $candidates = $guess['candidates'] ?? [];
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

        // The floor, not the ceiling. This endpoint runs the moment the
        // sentence lands, before a single question has been answered, so what
        // it returns is what the visitor watches appear in the live panel —
        // and handing a solo plumber eleven modules there, five of which he
        // never asked for and one of which he had just ruled out in writing,
        // is the whole "here is everything" pitch this flow exists to replace.
        // Answers add to this; nothing is assumed on their behalf.
        $baseModules = $businessType
            ? \App\Support\BusinessTypes::coreModulesFor($businessType)
            : ($preset['core'] ?? $preset['modules'] ?? []);

        // Facts the visitor stated outright outrank the trade's default shape.
        $registry = app(\App\Services\AiBuilder\CapabilityRegistry::class);
        $rawPrompt = (string) $request->input('prompt', '');
        $statedFacts = $registry->detectStructuredFacts($rawPrompt)['facts'] ?? [];

        // ── Read the sentence, rather than scan it for phrases ─────────────
        // The long comment above analyze() used to explain that this endpoint
        // could not reach a model because it runs before a tenant exists, so
        // there was nothing to rate limit or bill against. AiGateway has had
        // anonymous limits — per hashed IP, plus a global anonymous ceiling —
        // since the conversational builder shipped on this very page, so that
        // stopped being true a while ago. What it left behind was a landing
        // flow whose entire understanding of a business was str_contains()
        // against hand-written phrase lists: "I work alone" was heard only
        // because someone had typed that exact string into one of them.
        //
        // A reading is never load-bearing. It returns null when the model is
        // unavailable, rate limited, spend capped or off-purpose, and the
        // deterministic preset path carries the page exactly as before.
        $understanding = null;
        $reasons = [];
        if (trim($rawPrompt) !== '') {
            $understanding = app(\App\Services\AiBuilder\BusinessUnderstanding::class)->read($rawPrompt);
        }

        if ($understanding) {
            // What was read outranks what the trade usually looks like. The
            // preset still names the business and supplies its vocabulary; it
            // no longer decides what this particular person gets.
            $baseModules = app(\App\Services\AiBuilder\ModuleManifest::class)
                ->withDependencies($understanding['modules']);
            $reasons = $understanding['reasons'];
            $statedFacts = array_merge(
                $statedFacts,
                app(\App\Services\AiBuilder\BusinessUnderstanding::class)->toFacts($understanding)
            );
        }

        $ruledOut = $registry->contradictedModules($statedFacts);

        // withRecommended: false — the band owns its own members. Merging the
        // whole band here is what put three unlabelled rows inside a "12
        // MODULES" headline before a single question had been answered, which
        // is the silent padding config §3b exists to forbid.
        $modules  = $resolver->merge($baseModules, $answers, false, $matchedKey);

        // Two of the three are true for every business that opens this page, so
        // they arrive ticked; the third is offered in the band and left for the
        // visitor to decide. Anyone who actually mentioned costs already has
        // expenses from their own words rather than from this list.
        foreach ($resolver->recommendations() as $recKey => $recMeta) {
            if (!empty($recMeta['default_on']) && !in_array($recKey, $modules, true)) {
                $modules[] = $recKey;
            }
        }

        $modules  = app(\App\Services\AiBuilder\ModuleManifest::class)->withDependencies($modules);
        $modules  = array_values(array_diff($modules, $ruledOut));

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

            // The business type read from the sentence (or picked), its label,
            // and the words the store will use. When the sentence was
            // ambiguous, `candidates` feeds a "Did you mean…" row.
            'business_type'      => $businessType,
            'business_label'     => $businessType ? \App\Support\BusinessTypes::get($businessType)['label'] : null,
            'terms'              => \App\Support\BusinessTypes::termsFor($businessType ?: $matchedKey),
            'candidates'         => array_values(array_map(
                fn ($k) => ['key' => $k, 'label' => \App\Support\BusinessTypes::get($k)['label'] ?? $k],
                $matched ? [] : $candidates
            )),
            'preset_label'       => $preset['label'] ?? 'Custom Workspace',
            'preset_description' => $preset['description'] ?? $preset['blurb'] ?? 'Tailored workspace built for your operational needs.',
            'prompt'             => $request->input('prompt', ''),
            'modules'            => $modules,
            'capabilities'       => $suggestedCapabilities,

            // Why each module is here, in the visitor's own words. Empty when
            // the stack came from the deterministic path — the panel then shows
            // no reason rather than inventing one.
            'reasons'            => (object) $reasons,

            // Things they asked for that this product does not do. Named, never
            // approximated with a module that does something else.
            'unsupported'        => $understanding['unsupported'] ?? [],

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
            'business_type' => 'nullable|string|max:64',
            'plan'          => 'nullable|string|max:32',
            'timezone'      => 'nullable|string|max:64',
        ]);

        if ($nameError = \App\Services\StoreProvisioner::nameError(Auth::user(), $validated['business_name'] ?? null)) {
            return response()->json(['success' => false, 'message' => $nameError], 422);
        }

        $request->session()->put('pending_workspace_builder', [
            'timezone'      => $validated['timezone'] ?? null,
            'plan'          => $this->validSignupPlan($validated['plan'] ?? null),
            'country'       => app(\App\Services\GeoPricingService::class)->resolveCountry($request),
            'business_name' => $validated['business_name'] ?? null,
            'currency'      => $validated['currency'] ?? 'USD',
            'phone'         => $validated['phone'] ?? null,
            'modules'       => $validated['modules'] ?? [],
            'preset_key'    => $validated['preset_key'] ?? null,
            'business_type' => $validated['business_type'] ?? null,
        ]);

        return response()->json([
            'success'  => true,
            'auth_url' => route('auth.google'),
        ]);
    }

    /**
     * Provision a workspace for a user — delegates to StoreProvisioner, the
     * one place stores are created (same defaults as every other path).
     */
    public function provisionForUser(User $user, array $data): ?Tenant
    {
        try {
            if (\App\Services\StoreProvisioner::storeLimitError($user)) {
                \Illuminate\Support\Facades\Log::info('Builder provisioning blocked by store limit', ['user_id' => $user->id]);
                return null;
            }

            return app(\App\Services\StoreProvisioner::class)->create($user, [
                'name'            => $data['business_name'] ?? null,
                'currency'        => $data['currency'] ?? null,
                'timezone'        => $data['timezone'] ?? null,
                'country'         => $data['country'] ?? null,
                'phone'           => $data['phone'] ?? null,
                'preset_key'      => $data['preset_key'] ?? null,
                'business_type'   => $data['business_type'] ?? null,
                'modules'         => (array) ($data['modules'] ?? []),
                'plan'            => $this->validSignupPlan($data['plan'] ?? null),
                'setup_completed' => true,
                'license_source'  => 'registration',
            ]);
        } catch (\Throwable $e) {
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
            // Optional: blank becomes "My Business" with an auto-suffixed address.
            'business_name' => 'nullable|string|max:255',
            'currency'      => 'nullable|string|max:10',
            'phone'         => 'nullable|string|max:30',
            // Signed-in users (a second store, or arriving from /start) are not
            // asked for credentials again — the session already proves who they are.
            'email'         => Auth::check() ? 'nullable|email|max:255' : 'required|email|max:255',
            // Password is required for a new account. A nullable password used to
            // fall back to Str::random(12) — a string never shown or emailed to
            // anyone, which permanently locked the owner out of their own account.
            'password'      => Auth::check() ? ['nullable', 'string'] : ['required', 'string', Password::defaults()],
            'modules'       => 'required|array',
            // The matched preset key from analyze(). Never trusted blindly —
            // only written as business_type when it names a real, shippable
            // preset (see $businessType below) — because this one column is
            // what config/dashboard_presets.php keys the tenant's first
            // dashboard board on. Left null it silently falls through to
            // 'default', same as an unrecognised value always has.
            'preset_key'    => 'nullable|string|max:64',
            'business_type' => 'nullable|string|max:64',
            // Plan picked on the plan step (or null = "decide later").
            'plan'          => 'nullable|string|max:32',
            // Browser IANA zone — StoreProvisioner validates it.
            'timezone'      => 'nullable|string|max:64',
        ]);

        $name = $request->input('business_name');
        $plan = $this->validSignupPlan($request->input('plan'));
        if ($plan) {
            $request->session()->put('intended_plan', $plan);
        }
        $email = Auth::check() ? strtolower((string) Auth::user()->email) : strtolower($request->input('email'));
        $password = $request->input('password');
        $country = app(\App\Services\GeoPricingService::class)->resolveCountry($request);

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

        // Same unique-name rule as every other way a store is created.
        if ($nameError = \App\Services\StoreProvisioner::nameError(Auth::user(), $name)) {
            return response()->json(['success' => false, 'message' => $nameError], 422);
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
                    'name'              => ($name ?: 'Store') . ' Owner',
                    'password_hash'     => Hash::make($password),
                    'workspace_builder' => [
                        'business_name' => $name,
                        'currency'      => $request->input('currency'),
                        'phone'         => $request->input('phone'),
                        'modules'       => $request->input('modules', []),
                        'preset_key'    => $request->input('preset_key'),
                        'business_type' => $request->input('business_type'),
                        'plan'          => $plan,
                        'country'       => $country,
                        'timezone'      => $request->input('timezone'),
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
                    'name'     => ($name ?: 'Store') . ' Owner',
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
                'business_type' => $request->input('business_type'),
                'plan'          => $plan,
                'country'       => $country,
                'timezone'      => $request->input('timezone'),
            ]);

            if (!$tenant) {
                if ($limit = \App\Services\StoreProvisioner::storeLimitError($user)) {
                    return response()->json(['success' => false, 'message' => $limit], 422);
                }
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
            // A skip carries no answer, so `response` cannot be unconditionally
            // required — but an empty answer that is NOT a skip is a client bug,
            // and is rejected explicitly below rather than recorded as a turn.
            'skip'                => 'sometimes|boolean',
            'response'            => 'nullable|string|max:600',
            'selected_option_key' => ['nullable', 'string', 'max:64', 'regex:/^[A-Za-z0-9_:\-]+$/'],
            // A tick list returns several. Which capabilities those keys are
            // allowed to touch is decided from the session, not from here.
            'selected_option_keys'   => ['nullable', 'array', 'max:8'],
            'selected_option_keys.*' => ['string', 'max:64', 'regex:/^[A-Za-z0-9_:\-]+$/'],
        ]);

        $skip = (bool) ($validated['skip'] ?? false);
        $response = trim((string) ($validated['response'] ?? ''));

        // Ticking nothing on a tick list and pressing Continue is an ANSWER —
        // "none of these apply" — and a valuable one, because it settles every
        // option on the list as a no. It arrives with no response text, so the
        // empty-answer guard below has to let it through.
        $answeredList = $request->has('selected_option_keys');

        if (!$skip && !$answeredList && $response === '') {
            return response()->json([
                'success' => false,
                'message' => 'Please answer the question, or skip it.',
            ], 422);
        }

        $result = $service->step(
            sessionId: $validated['session_id'],
            userResponse: $response,
            selectedOptionKey: $skip ? null : ($validated['selected_option_key'] ?? null),
            skip: $skip,
            selectedOptionKeys: $skip ? [] : (array) ($validated['selected_option_keys'] ?? [])
        );

        return response()->json($result);
    }

    /**
     * Continue a finished conversation with the deeper round of questions.
     */
    public function converseDeepen(Request $request, ConversationalBuilderService $service): JsonResponse
    {
        $validated = $request->validate(['session_id' => 'required|uuid']);

        return response()->json($service->deepen($validated['session_id']));
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
