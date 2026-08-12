<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Reckoner\Reckoner;
use App\Reckoner\ReckonerRegistry;
use App\Reckoner\ReckonerRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * §9 Phase 5 — the only two HTTP endpoints the Reckoner exposes.
 *
 *   GET  /api/reckoner/catalogue   Readings available to this user/plan/business.
 *   POST /api/reckoner/read        Batch read, max 24 (Reckoner::MAX_BATCH).
 *
 * Follows the exact auth/tenant-resolution pattern PlanUsageController
 * already uses (`/api/plan/usage`, registered in web.php under the
 * ['auth', 'throttle:api'] group with the `tenant` middleware upstream of it
 * resolving `current.tenant`) — not sanctum, since this is a session-
 * authenticated Inertia app route, not a mobile/API-token endpoint.
 */
class ReckonerController extends Controller
{
    /**
     * The catalogue, scope-filtered (§8 — platform metrics never appear
     * here) and reduced to only what this user/plan/business can currently
     * see. Query params never change WHAT is returned to a user who cannot
     * see it — filtering happens against the same gates readMany() runs
     * (permission, feature, capability), so this list and what /read will
     * actually answer can never disagree.
     */
    public function catalogue(Request $request): JsonResponse
    {
        if (! app()->bound('current.tenant')) {
            return response()->json(['error' => 'No tenant context'], 400);
        }

        $tenant = app('current.tenant');
        $user = $request->user();

        if (! $user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $reckoner = app(Reckoner::class);
        $entries = [];

        // Gates only (§4.1) — no period resolution, no cache lookup, no
        // source dispatch. The catalogue's job is "what can this user see",
        // not "what is every value right now"; checkAvailability() runs the
        // same permission/feature/capability checks readMany() runs, so the
        // two can never disagree about what's visible, without paying to
        // compute a value for every metric on every catalogue request.
        $keys = array_keys(array_filter(
            ReckonerRegistry::all(),
            fn (array $definition) => ($definition['scope'] ?? 'tenant') === 'tenant',
        ));

        $availability = $reckoner->checkAvailability($keys, $user, $tenant);

        foreach ($availability as $key => $available) {
            if (! $available) {
                continue;
            }

            $definition = ReckonerRegistry::find($key);

            $entries[] = [
                'key' => $key,
                'domain' => $definition['domain'],
                'label' => $definition['label'],
                'generic' => $definition['generic'],
                'description' => $definition['description'],
                'help' => $definition['help'],
                'shape' => $definition['shape']->value,
                'unit' => $definition['unit'],
                'direction' => $definition['direction'],
                'signed' => $definition['signed'],
                'periods' => $definition['periods'],
                'default_period' => $definition['default_period'],
                'supports_comparison' => $definition['supports_comparison'],
                'supports_series' => $definition['supports_series'],
                'drill_route' => $definition['drill_route'],
                'charts' => \App\Reckoner\ReckonerCharts::for($definition['shape']),
                'default_chart' => \App\Reckoner\ReckonerCharts::default($definition['shape']),
            ];
        }

        return response()->json(['data' => $entries]);
    }

    /**
     * Batch read. Body: {"requests": [{"key":"sales.revenue","period":"today"}, ...]}
     * Capped at Reckoner::MAX_BATCH — readMany() itself enforces this even
     * if a caller sends more.
     */
    public function read(Request $request): JsonResponse
    {
        if (! app()->bound('current.tenant')) {
            return response()->json(['error' => 'No tenant context'], 400);
        }

        $tenant = app('current.tenant');
        $user = $request->user();

        if (! $user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'requests' => 'required|array|min:1|max:'.Reckoner::MAX_BATCH,
            'requests.*.key' => 'required|string',
            'requests.*.period' => 'nullable|string',
            'requests.*.custom' => 'nullable|array',
            'requests.*.custom.from' => 'nullable|date',
            'requests.*.custom.to' => 'nullable|date',
            'requests.*.granularity' => 'nullable|string',
            'requests.*.args' => 'nullable|array',
        ]);

        $requests = array_map(fn (array $r) => new ReckonerRequest(
            key: $r['key'],
            period: $r['period'] ?? 'today',
            custom: $r['custom'] ?? null,
            granularity: $r['granularity'] ?? null,
            args: $r['args'] ?? [],
        ), $validated['requests']);

        $results = app(Reckoner::class)->readMany($requests, $user, $tenant);

        return response()->json([
            'data' => array_map(fn ($result) => $result->toArray(), array_values($results)),
        ]);
    }
}
