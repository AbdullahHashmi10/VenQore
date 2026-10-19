<?php

namespace App\Http\Controllers;

use App\Services\Builder\BuilderEngine;
use App\Services\Builder\BuilderPolicy;
use App\Services\Builder\BuilderSession;
use App\Services\Builder\BuilderTelemetry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * BUILDER_FINAL_PLAN.md §10 — the signup builder's decision API.
 *
 * The server owns every decision; the browser only displays what comes back and
 * never maps facts to modules. All routes answer 404 unless VQ_BUILDER_V2 is on.
 */
class BuilderDiscoveryController extends Controller
{
    private const TTL_MINUTES = 180;

    public static function enabled(): bool
    {
        return (bool) config('venqore.builder_v2', false);
    }

    private function engine(): BuilderEngine
    {
        return app(BuilderEngine::class);
    }

    private function load(string $id): ?BuilderSession
    {
        $data = Cache::get('builder:v2:' . $id);

        return is_array($data) ? BuilderSession::fromArray(app(BuilderPolicy::class), $data) : null;
    }

    private function save(BuilderSession $s): void
    {
        Cache::put('builder:v2:' . $s->id, $s->toArray(), now()->addMinutes(self::TTL_MINUTES));
    }

    /** One snapshot per answer so Back can undo it (last 12 kept). */
    private function pushHistory(BuilderSession $s): void
    {
        $key = 'builder:v2:' . $s->id . ':h';
        $h = (array) Cache::get($key, []);
        $h[] = $s->toArray();
        Cache::put($key, array_slice($h, -12), now()->addMinutes(self::TTL_MINUTES));
    }

    /** Used by WorkspaceBuilderController::provision(): the server's module list for a session. */
    public static function modulesForSession(string $id, ?string $plan = null): ?array
    {
        $c = new self();
        $s = $c->load($id);

        return $s ? $c->engine()->modulesFor($s, $plan) : null;
    }

    public static function sessionFor(string $id): ?BuilderSession
    {
        return (new self())->load($id);
    }

    private function gone(): JsonResponse
    {
        return response()->json(['error' => 'session_expired', 'message' => 'Your session timed out. Please start again.'], 410);
    }

    public function start(Request $request): JsonResponse
    {
        abort_unless(self::enabled(), 404);
        $v = $request->validate([
            'sentence' => 'nullable|string|max:1000',
            'type' => 'nullable|string|max:64',
            'preset' => 'nullable|string|max:64',
        ]);
        $e = $this->engine();
        $s = $e->start($v['sentence'] ?? null, $v['type'] ?? null, $v['preset'] ?? null);
        BuilderTelemetry::record('builder.started', $s, ['route' => $s->route]);
        $out = $e->step($s);
        if (isset($out['screen'])) {
            BuilderTelemetry::record('screen.shown', $s, ['id' => $out['screen']['screen_id'], 'band' => $out['screen']['band']]);
        }
        $this->save($s);

        return response()->json($out);
    }

    public function answer(Request $request): JsonResponse
    {
        abort_unless(self::enabled(), 404);
        $v = $request->validate([
            'session_id' => 'required|string|max:64',
            'screen_id' => 'required|string|max:32',
            'version' => 'required|integer',
            'selected' => 'nullable|array|max:40',
            'selected.*' => 'string|max:64',
            'unsure' => 'nullable|boolean',
            'skip' => 'nullable|boolean',
            'explain' => 'nullable|string|max:500',
        ]);
        $s = $this->load($v['session_id']);
        if (! $s) {
            return $this->gone();
        }
        $this->pushHistory($s);
        $out = $this->engine()->answer(
            $s, $v['screen_id'], (int) $v['version'], (array) ($v['selected'] ?? []),
            (bool) ($v['unsure'] ?? false), (bool) ($v['skip'] ?? false), $v['explain'] ?? null
        );
        if (! isset($out['error'])) {
            BuilderTelemetry::record(($v['skip'] ?? false) ? 'screen.skipped' : (($v['unsure'] ?? false) ? 'screen.unsure' : 'screen.answered'), $s, ['id' => $v['screen_id']]);
            if (isset($out['screen'])) {
                BuilderTelemetry::record('screen.shown', $s, ['id' => $out['screen']['screen_id'], 'band' => $out['screen']['band']]);
            } else {
                BuilderTelemetry::record('stopped_early', $s, ['n' => $s->screensShown]);
            }
            if ($out['preview_available'] && ! $s->previewSeen) {
                $s->previewSeen = true;
                BuilderTelemetry::record('preview.shown', $s, ['after_n' => $s->screensCompleted]);
            }
        }
        $this->save($s);

        return response()->json($out, isset($out['error']) ? 409 : 200);
    }

    /** Re-serve the current step of a live run (page reload, returning from the plan step). Changes nothing. */
    public function resume(Request $request): JsonResponse
    {
        abort_unless(self::enabled(), 404);
        $v = $request->validate(['session_id' => 'required|string|max:64']);
        $s = $this->load($v['session_id']);
        if (! $s) {
            return $this->gone();
        }
        $out = $this->engine()->step($s);
        $this->save($s);

        return response()->json($out);
    }

    /** Back: undo the last answer and re-serve the screen before it. */
    public function back(Request $request): JsonResponse
    {
        abort_unless(self::enabled(), 404);
        $v = $request->validate(['session_id' => 'required|string|max:64']);
        $key = 'builder:v2:' . $v['session_id'] . ':h';
        $h = (array) Cache::get($key, []);
        if (! $h) {
            return response()->json(['error' => 'nothing_to_undo'], 409);
        }
        $prev = array_pop($h);
        Cache::put($key, $h, now()->addMinutes(self::TTL_MINUTES));
        $s = BuilderSession::fromArray(app(BuilderPolicy::class), $prev);
        // The snapshot was taken while its screen was pending, so that screen is served again.
        $this->save($s);

        return response()->json($this->engine()->step($s));
    }

    public function confirmCard(Request $request): JsonResponse
    {
        abort_unless(self::enabled(), 404);
        $v = $request->validate(['session_id' => 'required|string|max:64', 'correct' => 'required|boolean', 'facts' => 'nullable|array', 'facts.*' => 'string|max:64']);
        $s = $this->load($v['session_id']);
        if (! $s) {
            return $this->gone();
        }
        $this->pushHistory($s);
        $this->engine()->resolveConfirmCard($s, (bool) $v['correct'], $v['facts'] ?? null);
        BuilderTelemetry::record('confirm_card.result', $s, ['correct' => (bool) $v['correct']]);
        $this->save($s);

        return response()->json($this->engine()->step($s));
    }

    public function revise(Request $request): JsonResponse
    {
        abort_unless(self::enabled(), 404);
        $v = $request->validate(['session_id' => 'required|string|max:64', 'fact_key' => 'required|string|max:96', 'value' => 'nullable']);
        $s = $this->load($v['session_id']);
        if (! $s) {
            return $this->gone();
        }
        $policy = app(BuilderPolicy::class);
        if (! $policy->validFact($v['fact_key']) || str_starts_with($v['fact_key'], 'owner.') || str_starts_with($v['fact_key'], 'gap.')) {
            return response()->json(['error' => 'bad_fact'], 422);
        }
        $value = $v['value'] ?? null;
        if ($value !== null && $policy->factType($v['fact_key']) === 'bool') {
            $value = filter_var($value, FILTER_VALIDATE_BOOLEAN);
        }
        try {
            $out = $this->engine()->revise($s, $v['fact_key'], $value);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['error' => 'bad_value'], 422);
        }
        BuilderTelemetry::record('fact.revised', $s, ['fact' => $v['fact_key']]);
        BuilderTelemetry::record('readback.edited', $s, ['fact' => $v['fact_key']]);
        $this->save($s);

        return response()->json($out);
    }

    public function override(Request $request): JsonResponse
    {
        abort_unless(self::enabled(), 404);
        $v = $request->validate(['session_id' => 'required|string|max:64', 'module' => 'required|string|max:64', 'action' => 'required|in:add,remove']);
        $s = $this->load($v['session_id']);
        if (! $s) {
            return $this->gone();
        }
        $out = $this->engine()->override($s, $v['module'], $v['action']);
        BuilderTelemetry::record($v['action'] === 'add' ? 'missing.added' : 'readback.edited', $s, ['module' => $v['module'], 'action' => $v['action']]);
        $this->save($s);

        return response()->json($out, isset($out['error']) ? 422 : 200);
    }

    /** "Search everything": modules by label, alias or description, with their state for this session. */
    public function search(Request $request): JsonResponse
    {
        abort_unless(self::enabled(), 404);
        $v = $request->validate(['session_id' => 'required|string|max:64', 'q' => 'required|string|min:2|max:80']);
        $s = $this->load($v['session_id']);
        if (! $s) {
            return $this->gone();
        }
        $policy = app(BuilderPolicy::class);
        $included = array_flip($this->engine()->modulesFor($s));
        $gate = new \App\Services\Builder\CapabilityGate($policy);
        $q = mb_strtolower(trim($v['q']));
        $hits = [];
        foreach ($policy->modules as $key => $m) {
            $hay = mb_strtolower($m['label'] . ' ' . ($m['description'] ?? '') . ' ' . implode(' ', (array) ($m['aliases'] ?? [])));
            if (! str_contains($hay, $q)) {
                continue;
            }
            $g = $gate->check($key);
            $hits[] = [
                'module' => $key, 'label' => $m['label'], 'description' => $m['description'] ?? '',
                'state' => isset($included[$key]) ? 'included' : ($g['ok'] ? 'addable' : 'coming_soon'),
                'note' => isset($included[$key]) ? 'Already included.' : ($g['ok'] ? 'Add — free' : 'Coming soon — notify me'),
            ];
            if (count($hits) >= 12) {
                break;
            }
        }
        BuilderTelemetry::record('missing.searched', $s, ['q' => $q, 'hit' => count($hits) > 0]);

        return response()->json(['hits' => $hits]);
    }

    /** "Browse all tools": every module with its state. */
    public function catalogue(Request $request): JsonResponse
    {
        abort_unless(self::enabled(), 404);
        $v = $request->validate(['session_id' => 'required|string|max:64']);
        $s = $this->load($v['session_id']);
        if (! $s) {
            return $this->gone();
        }
        $policy = app(BuilderPolicy::class);
        $included = array_flip($this->engine()->modulesFor($s));
        $gate = new \App\Services\Builder\CapabilityGate($policy);
        $areas = (array) $policy->workflows['areas'];
        $out = [];
        foreach ($policy->modules as $key => $m) {
            $g = $gate->check($key);
            $out[] = [
                'module' => $key, 'label' => $m['label'], 'description' => $m['description'] ?? '',
                'requires' => array_map(fn ($d) => $policy->moduleLabel($d), (array) ($m['requires'] ?? [])),
                'state' => isset($included[$key]) ? 'included' : ($g['ok'] ? 'addable' : 'coming_soon'),
            ];
        }

        return response()->json(['modules' => $out, 'areas' => $areas]);
    }

    /** "Can't find it? Tell us." → the demand log, with the answers attached. */
    public function missing(Request $request): JsonResponse
    {
        abort_unless(self::enabled(), 404);
        $v = $request->validate(['session_id' => 'required|string|max:64', 'text' => 'required|string|min:3|max:500', 'email' => 'nullable|email|max:255']);
        $s = $this->load($v['session_id']);
        if (! $s) {
            return $this->gone();
        }
        $out = $this->engine()->missing($s, $v['text'], $v['email'] ?? null);
        $snapshot = $this->engine()->review($s);
        $context = json_encode([
            'session' => $s->id, 'type' => $s->typeKey, 'summary' => $snapshot['summary'],
            'modules' => $snapshot['modules'], 'policy' => BuilderPolicy::VERSION,
        ], JSON_UNESCAPED_UNICODE);
        try {
            DB::table(config('ai_builder.demand_log.table', 'feature_requests'))->insert([
                'tenant_id' => null,
                'email' => $v['email'] ?? null,
                'source' => 'builder_missing',
                'raw_text' => mb_substr($v['text'] . "\n---\n" . $context, 0, 4000),
                'normalised' => mb_strtolower(trim($v['text'])),
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json(['ok' => false, 'message' => 'Unable to record this right now. Please try again.'], 500);
        }
        BuilderTelemetry::record('missing.requested', $s);
        $this->save($s);

        return response()->json(['ok' => true, 'message' => $out['message']]);
    }

    public function review(Request $request, string $id): JsonResponse
    {
        abort_unless(self::enabled(), 404);
        $s = $this->load($id);
        if (! $s) {
            return $this->gone();
        }

        return response()->json($this->engine()->review($s));
    }

    public function confirmReadback(Request $request): JsonResponse
    {
        abort_unless(self::enabled(), 404);
        $v = $request->validate(['session_id' => 'required|string|max:64']);
        $s = $this->load($v['session_id']);
        if (! $s) {
            return $this->gone();
        }
        BuilderTelemetry::record('readback.confirmed', $s, ['n_screens' => $s->screensShown]);

        return response()->json(['ok' => true]);
    }
}
