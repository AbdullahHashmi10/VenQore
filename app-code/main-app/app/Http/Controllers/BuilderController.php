<?php

namespace App\Http\Controllers;

use App\Engines\ModuleDependencyResolver;
use App\Models\Tenant;
use App\Services\AiBuilder\ApplyConfigurationService;
use App\Services\AiBuilder\ModificationParser;
use App\Services\ModuleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/*
|==============================================================================
| BuilderController — "Add modules any time, no extra cost within your plan."
|==============================================================================
|
| The change-it-later screen the Rulebook has always assumed exists:
| EnsureModule::refuse() and ReportModuleMap-gated reports both redirect to
| route('store.builder') the moment a customer hits something they haven't
| switched on, and until this controller existed that route did not.
|
| Same single writer as everywhere else — ApplyConfigurationService — and the
| same resolver everyone else in the pipeline runs through
| (ModuleDependencyResolver), so a toggle made here can never produce a
| configuration the AI-onboarding path would have refused to produce itself.
|==============================================================================
*/
class BuilderController extends Controller
{
    public function __construct(private ModuleDependencyResolver $resolver)
    {
    }

    /**
     * The builder screen. `add` (from EnsureModule's refusal redirect) is the
     * module the customer just bounced off — surfaced so "add it?" is one
     * click rather than a hunt through 46 toggles.
     */
    public function show(Request $request): Response
    {
        $tenant = app('current.tenant');
        $enabled = ModuleService::allEnabled($tenant);

        $modules = collect(config('modules', []))
            ->map(function (array $m, string $key) use ($enabled) {
                return [
                    'key'          => $key,
                    'label'        => $m['label'] ?? ucfirst(str_replace('_', ' ', $key)),
                    'description'  => $m['description'] ?? '',
                    'group'        => $m['group'] ?? 'G',
                    'status'       => $m['status'] ?? 'live',
                    'enabled'      => in_array($key, $enabled, true),
                    'requires'     => $m['requires'] ?? [],
                    'requires_one' => $m['requires_one'] ?? [],
                    'enhances'     => $m['enhances'] ?? [],
                ];
            })
            ->filter(fn ($m) => $m['status'] === 'live')   // never offer beta/building here — same rule ApplyConfigurationService's validator enforces
            ->values();

        return Inertia::render('Builder/Index', [
            'modules'      => $modules,
            'groupLabels'  => ['A' => 'Catalog', 'B' => 'Sell', 'C' => 'Stock', 'D' => 'Buy', 'E' => 'Make', 'F' => 'Money', 'G' => 'Grow'],
            'highlight'    => $request->query('add'),
            'businessType' => $tenant->business_type,
        ]);
    }

    /**
     * Preview only — never writes. Lets the frontend show "this also turns
     * on Products" or ask a requires_one question BEFORE the customer commits,
     * the same courtesy the AI-discovery pipeline gives at signup.
     */
    public function preview(Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $requested = $this->sanitizeModules($request->input('modules', []));

        $result = $this->resolver->resolve($requested);

        // Anything about to be REMOVED that something else still needs gets
        // flagged here too, so "turn off Products" surfaces "POS needs this"
        // in the same response as the requires_one questions.
        $currentlyEnabled = ModuleService::allEnabled($tenant);
        $beingRemoved = array_diff($currentlyEnabled, $result['modules']);
        $blocks = [];
        foreach ($beingRemoved as $key) {
            $verdict = $this->resolver->canDisable($currentlyEnabled, $key);
            if (!$verdict['allowed']) {
                $blocks[$key] = $verdict;
            }
        }

        return response()->json([
            'success'  => true,
            'modules'  => $result['modules'],
            'added'    => $result['added'],
            'dropped'  => $result['dropped'],
            'questions'=> $result['questions'],
            'blocks'   => $blocks,
        ]);
    }

    /**
     * What disabling this one module would hide — never delete. Shown before
     * the confirmation, not after.
     */
    public function dataAtStake(Request $request, string $module): JsonResponse
    {
        $tenant = app('current.tenant');

        if (!array_key_exists($module, config('modules', []))) {
            return response()->json(['success' => false, 'message' => 'Unknown module.'], 404);
        }

        return response()->json([
            'success'   => true,
            'module'    => $module,
            'at_stake'  => ModuleService::dataAtStake($tenant, $module),
            'cascade'   => $this->resolver->disableCascade(ModuleService::allEnabled($tenant), $module),
        ]);
    }

    /**
     * Commit a new module set. Same three-line contract as the preset picker
     * and the AI pipeline: resolve, validate, apply — through the one writer.
     *
     * A pending requires_one question or a blocked disable is refused here
     * exactly like preview() reports it, so a client that skips preview()
     * still cannot produce a broken or surprising configuration.
     */
    public function apply(Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $requested = $this->sanitizeModules($request->input('modules', []));
        $currentlyEnabled = ModuleService::allEnabled($tenant);

        $result = $this->resolver->resolve($requested);

        if ($result['questions'] !== []) {
            return response()->json([
                'success'   => false,
                'reason'    => 'questions_pending',
                'questions' => $result['questions'],
            ], 422);
        }

        $beingRemoved = array_diff($currentlyEnabled, $result['modules']);
        foreach ($beingRemoved as $key) {
            $verdict = $this->resolver->canDisable($currentlyEnabled, $key);
            if (!$verdict['allowed']) {
                return response()->json([
                    'success' => false,
                    'reason'  => 'disable_blocked',
                    'module'  => $key,
                    'message' => $verdict['message'],
                    'dependents' => $verdict['dependents'],
                ], 422);
            }
        }

        try {
            $applied = app(ApplyConfigurationService::class)->apply(
                $tenant,
                ['modules' => $result['modules']],
                'user',
                'Changed from the builder screen.'
            );
        } catch (\InvalidArgumentException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }

        return response()->json([
            'success' => true,
            'applied' => $applied,
            'added'   => $result['added'],
        ]);
    }

    /**
     * The plain-language box. ModificationParser is deterministic (alias
     * lookups, not a model call) for exactly this reason — a builder toggle
     * must never depend on an API being up. ENABLE/DISABLE re-enter the same
     * resolve → validate → apply path apply() uses, so a typed instruction
     * can never do something the checkbox grid could not.
     */
    public function modify(Request $request): JsonResponse
    {
        $request->validate(['text' => 'required|string|max:200']);

        $tenant = app('current.tenant');
        $parsed = app(ModificationParser::class)->parse($request->input('text'), $tenant);

        switch ($parsed['intent']) {
            case 'ENABLE':
            case 'DISABLE':
                $currentlyEnabled = ModuleService::allEnabled($tenant);
                $target = $parsed['intent'] === 'ENABLE'
                    ? array_values(array_unique([...$currentlyEnabled, $parsed['module']]))
                    : array_values(array_diff($currentlyEnabled, [$parsed['module']]));

                $result = $this->resolver->resolve($target);

                if ($result['questions'] !== []) {
                    return response()->json([
                        'success' => false, 'reason' => 'questions_pending',
                        'message' => $parsed['message'], 'questions' => $result['questions'],
                    ], 422);
                }

                if ($parsed['intent'] === 'DISABLE') {
                    $verdict = $this->resolver->canDisable($currentlyEnabled, $parsed['module']);
                    if (!$verdict['allowed']) {
                        return response()->json([
                            'success' => false, 'reason' => 'disable_blocked',
                            'message' => $verdict['message'], 'dependents' => $verdict['dependents'],
                        ], 422);
                    }
                }

                $applied = app(ApplyConfigurationService::class)->apply(
                    $tenant, ['modules' => $result['modules']], 'user',
                    "Typed: \"{$request->input('text')}\""
                );

                return response()->json([
                    'success' => true, 'intent' => $parsed['intent'],
                    'message' => $parsed['message'], 'applied' => $applied,
                ]);

            case 'RENAME':
                // The parser hands back one word ("patients"); terminology
                // storage wants both forms. A trailing-s strip is a real but
                // acceptable heuristic here — same tradeoff a preset author
                // accepts when they only bother to write one irregular case
                // by hand and let this cover the rest.
                $plural = $parsed['value'];
                $singular = preg_replace('/s$/i', '', $plural) ?: $plural;

                app(ApplyConfigurationService::class)->apply(
                    $tenant,
                    [
                        'modules'     => ModuleService::allEnabled($tenant),
                        'terminology' => [$parsed['term'] => ['singular' => $singular, 'plural' => $plural]],
                    ],
                    'user',
                    "Typed: \"{$request->input('text')}\""
                );

                return response()->json(['success' => true, 'intent' => 'RENAME', 'message' => $parsed['message']]);

            case 'ADD_CARD':
                // Dashboard territory, not module territory — the builder
                // hands this back as a friendly redirect rather than reaching
                // into a system it does not own.
                return response()->json([
                    'success' => true, 'intent' => 'ADD_CARD', 'redirect_to_dashboard' => true,
                    'message' => 'Add that from the dashboard\'s own "Add a card" button — the builder only changes modules.',
                ]);

            default:
                return response()->json([
                    'success' => false, 'intent' => 'UNKNOWN', 'message' => $parsed['message'],
                ], 422);
        }
    }

    /** Real module keys only — never trust client input past this. */
    private function sanitizeModules(array $modules): array
    {
        return array_values(array_intersect(
            array_map('strval', $modules),
            array_keys(config('modules', []))
        ));
    }
}
