<?php

namespace App\Reckoner;

use App\Models\Tenant;
use App\Models\User;
use App\Services\PlanRepository;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

/**
 * The front door. Takes a request, runs the gates, calls a Source, caches,
 * returns a Reading. See §4.
 *
 * Resolution runs six steps, in this order, every time, with no shortcuts:
 *   1. Exists    — key is in the registry.
 *   2. Scope     — a platform metric requested in a tenant context is
 *                  not_found, not forbidden (§8 — a store must not learn
 *                  the metric exists).
 *   3. Permission — ANY-of match via $user->hasPermission().
 *   4. Plan feature — PlanRepository::featuresFor($tenant).
 *   5. Capability — cached business probe.
 *   6. Validate + resolve — period legal, args whitelisted, cache lookup,
 *      source dispatch, envelope.
 *
 * A metric that fails any gate executes zero database queries — asserted by
 * ReckonerGateTest with a query-count spy.
 */
final class Reckoner
{
    public const MAX_BATCH = 24;

    public const CAPABILITY_TTL = 600;

    /** Resolve one reading. */
    public function read(ReckonerRequest $r, User $u, ?Tenant $t): ReckonerResult
    {
        $id = $r->getCompositeId();
        return $this->readMany([$r], $u, $t)[$id] ?? ReckonerResult::failure($id, $r->key, 'resolver_failed', 'No result returned.');
    }

    /**
     * Runs gates 1–5 only (exists, scope, permission, feature, capability)
     * for every given key — no period validation, no cache lookup, no
     * source dispatch, no query beyond what the capability probe itself
     * needs (and that's cached for CAPABILITY_TTL). Built for
     * ReckonerController::catalogue(): "is this available to this
     * user/plan/business" without paying to compute every value just to
     * list what's visible.
     *
     * @param  string[]  $keys
     * @return array<string, bool> key => available
     */
    public function checkAvailability(array $keys, User $u, Tenant $t): array
    {
        $availability = [];
        $features = null;
        $capabilities = null;

        foreach ($keys as $key) {
            $definition = ReckonerRegistry::find($key);

            if ($definition === null 
                || ($definition['scope'] ?? 'tenant') === 'platform' 
                || ($definition['implemented'] ?? true) === false
                || ($definition['contract_state'] ?? null) === 'unimplemented'
            ) {
                $availability[$key] = false;

                continue;
            }

            if (! $this->passesPermissions($u, $definition['permissions'] ?? [])) {
                $availability[$key] = false;

                continue;
            }

            $features ??= $this->features($t);
            $featureKey = $definition['feature'] ?? null;
            if ($featureKey !== null && empty($features[$featureKey])) {
                $availability[$key] = false;

                continue;
            }

            $capabilities ??= $this->capabilities($t);
            $capabilityKey = $definition['capability'] ?? null;
            if ($capabilityKey !== null && empty($capabilities[$capabilityKey])) {
                $availability[$key] = false;

                continue;
            }

            // Module gate — mirrors gate 5b in readMany(), so the catalogue
            // and a read can never disagree about a switched-off module.
            if (! $this->passesModules($t, $u, $definition['module'] ?? null)) {
                $availability[$key] = false;

                continue;
            }

            $availability[$key] = true;
        }

        return $availability;
    }

    /**
     * Resolve many readings in one pass, grouped by Source so a shared
     * underlying read (e.g. the P&L) happens once per distinct period
     * window, not once per metric (§4.2, §4.4).
     *
     * @param  ReckonerRequest[]  $requests
     * @return array<string, ReckonerResult> keyed by request composite ID
     */
    public function readMany(array $requests, User $u, ?Tenant $t): array
    {
        $results = [];

        if (count($requests) > self::MAX_BATCH) {
            $requests = array_slice($requests, 0, self::MAX_BATCH);
        }

        $capabilities = null;
        $features = null;

        // Requests that pass all gates and need resolving, grouped by Source
        // class so each Source gets exactly one resolveBatch() call.
        $toResolve  = []; // sourceClass => [ ['id'=>, 'key'=>, 'period'=>, 'args'=>, 'definition'=>], ... ]
        $toDerive   = []; // derived reading items (resolved after all source reads)
        $cached     = []; // id => ReckonerResult already served from cache
        $comparisonValues = []; // id => comparison_value loaded from cache

        foreach ($requests as $request) {
            $key = $request->key;
            $id = $request->getCompositeId();

            // 1. Exists
            $definition = ReckonerRegistry::find($key);
            if ($definition === null) {
                $results[$id] = ReckonerResult::failure($id, $key, 'not_found', "No reading exists for '{$key}'.");

                continue;
            }

            // 2. Scope — a platform metric in a tenant context does not
            // even admit the metric exists.
            if (($definition['scope'] ?? 'tenant') === 'platform' && $t !== null) {
                $results[$id] = ReckonerResult::failure($id, $key, 'not_found', "No reading exists for '{$key}'.");

                continue;
            }

            // 2b. Contract State Gate — unimplemented readings refuse before cache lookup or query
            $contractState = $definition['contract_state'] ?? null;
            $isImplemented = $definition['implemented'] ?? true;
            if ($contractState === 'unimplemented' || $isImplemented === false) {
                $matrixStatus = $definition['matrix_status'] ?? 'READY';
                $code = in_array($matrixStatus, ['FEATURE', 'COLUMN'], true) ? 'data_not_captured' : 'not_built';
                $reason = ($definition['status_reason'] ?? null)
                    ?: ($matrixStatus === 'FEATURE'
                        ? 'Not available yet — feature data is not captured in this version'
                        : ($matrixStatus === 'COLUMN'
                            ? 'Not available yet — required tracking column/event is pending migration'
                            : "Reading '{$key}' is not built yet."));

                $results[$id] = ReckonerResult::unavailable($id, $key, $code, $reason, $definition, null);

                continue;
            }

            // 3. Permission (ANY-of)
            if (! $this->passesPermissions($u, $definition['permissions'] ?? [])) {
                $results[$id] = ReckonerResult::failure($id, $key, 'forbidden', 'You do not have permission to view this.');

                continue;
            }

            // 4. Plan feature. Runs independently of the capability gate — a plan that
            // does not include a feature must lock it whether or not the store happens
            // to have data for it. Correction Spec §1: plan_locked and not_applicable
            // answer different questions and neither substitutes for the other.
            if ($t !== null) {
                $features ??= $this->features($t);
                $featureKey = $definition['feature'] ?? null;
                if ($featureKey !== null && empty($features[$featureKey])) {
                    $results[$id] = ReckonerResult::failure($id, $key, 'plan_locked', 'This reading is not included in the current plan.');

                    continue;
                }
            }

            // 5. Capability
            if ($t !== null) {
                $capabilities ??= $this->capabilities($t);
                $capabilityKey = $definition['capability'] ?? null;
                if ($capabilityKey !== null && empty($capabilities[$capabilityKey])) {
                    $results[$id] = ReckonerResult::failure($id, $key, 'not_applicable', 'This store does not use this yet.');

                    continue;
                }
            }

            // 5b. Module — a reading owned by a tenant module disappears with
            // the module, exactly as its nav item does (ModuleNavBuilder).
            // This is a lock, not an empty period. The reading envelope lets
            // the card explain how to make itself available instead of looking
            // like a failed query.
            if ($t !== null && ! $this->passesModules($t, $u, $definition['module'] ?? null)) {
                $module = $definition['module'] ?? null;
                $moduleKeys = array_filter((array) $module);
                $moduleLabel = collect($moduleKeys)
                    ->map(fn (string $moduleKey) => config("modules.{$moduleKey}.label", str_replace('_', ' ', $moduleKey)))
                    ->implode(' or ');

                $results[$id] = ReckonerResult::failure(
                    $id,
                    $key,
                    'module_locked',
                    'Needs the '.($moduleLabel !== '' ? $moduleLabel : 'required').' module.'
                );

                continue;
            }

            // 6a. Validate period
            $periodKey = $request->period ?: ($definition['default_period'] ?? 'today');
            $allowedPeriods = $definition['periods'] ?? [];
            $isValidPeriod = in_array($periodKey, $allowedPeriods, true)
                || ($periodKey === 'custom' && !empty($request->custom));

            if (! $isValidPeriod) {
                $results[$id] = ReckonerResult::failure($id, $key, 'invalid_period', "Period '{$periodKey}' is not valid for '{$key}'.");

                continue;
            }

            try {
                $period = ReckonerPeriod::resolve($periodKey, $request->custom, $t);
            } catch (Throwable $e) {
                $results[$id] = ReckonerResult::failure($id, $key, 'invalid_period', $e->getMessage());

                continue;
            }

            // 6b. Arg whitelist — reject any arg not declared in dimensions or filters.
            // A reading with no 'dimensions' key accepts no args; one with 'dimensions'
            // allows exactly the declared keys plus 'filter' (which is validated separately).
            if (! empty($request->args)) {
                $declaredDims    = $definition['dimensions'] ?? null;
                $declaredFilters = $definition['filters'] ?? [];

                if ($declaredDims === null) {
                    // Reading declares no dimension schema at all — no args accepted.
                    $results[$id] = ReckonerResult::failure($id, $key, 'invalid_args', "'{$key}' does not accept arguments.");
                    continue;
                }

                foreach (array_keys($request->args) as $argKey) {
                    if ($argKey === 'filter') {
                        // Validate each filter sub-key against declared filters.
                        foreach (array_keys((array) $request->args['filter']) as $filterKey) {
                            if (! array_key_exists($filterKey, $declaredFilters)) {
                                $results[$id] = ReckonerResult::failure($id, $key, 'invalid_args', "Filter '{$filterKey}' is not declared for '{$key}'.");
                                continue 3;
                            }
                        }
                        continue;
                    }
                    if (! array_key_exists($argKey, $declaredDims)) {
                        $results[$id] = ReckonerResult::failure($id, $key, 'invalid_args', "Argument '{$argKey}' is not declared for '{$key}'.");
                        continue 2;
                    }
                }
            }

            // Cache lookup.
            $ttl = $definition['cache_ttl'] ?? 60;
            $cacheKey = $this->cacheKey($t?->id, $key, $period, $request->granularity, $request->args, $u);

            if ($ttl > 0 && Cache::has($cacheKey)) {
                $envelope = Cache::get($cacheKey);
                if (is_array($envelope) && isset($envelope['status']) && $envelope['status'] !== 'error') {
                    $cachedStatus = $envelope['status'];
                    $cachedData = $envelope['data'] ?? [];
                    $cached[$id] = ReckonerResult::fromCache(
                        id: $id,
                        key: $key,
                        definition: $definition,
                        period: $period,
                        cachedStatus: $cachedStatus,
                        cachedData: $cachedData,
                        meta: $envelope['meta'] ?? [],
                        checks: $envelope['checks'] ?? [],
                    );

                    continue;
                }
            }

            // 6c. Derived reading — resolve after all source reads complete.
            // A definition with 'derived' carries no source/method; its 'compute' closure
            // receives already-resolved scalar values keyed by reading key.
            if (isset($definition['derived'])) {
                $toDerive[] = [
                    'id'         => $id,
                    'key'        => $key,
                    'period'     => $period,
                    'args'       => $request->args,
                    'definition' => $definition,
                    'ttl'        => $ttl,
                    'cacheKey'   => $cacheKey,
                    'request'    => $request,
                ];
                continue;
            }

            // MeasureEngine dispatch for contract cards (§4, §7.4)
            $cardContract = \App\Reckoner\CardRegistry::get($key);
            $contractState = $cardContract['contract_state'] ?? 'unimplemented';
            if ($cardContract && in_array($contractState, ['verified', 'implemented_unverified'], true)) {
                $ctx = new ReckonerContext($t, $u);
                $engine = app(\App\Reckoner\Engine\MeasureEngine::class);
                $engineResults = $engine->resolve([$request], $ctx);
                if (isset($engineResults[$id])) {
                    $result = $engineResults[$id];
                    if ($ttl > 0 && $result->ok && $result->status !== 'error') {
                        Cache::put($cacheKey, [
                            'data' => $result->data,
                            'status' => $result->status,
                            'meta' => $result->meta,
                            'checks' => $result->checks,
                        ], $ttl);
                    }
                    $results[$id] = $result;
                    continue;
                }
            }

            $sourceClass = $definition['source'] ?? null;
            if (! $sourceClass || ! class_exists($sourceClass)) {
                if (\App\Reckoner\Resolvers\ResolverRegistry::has($key)) {
                    $ctx = new ReckonerContext($t, $u);
                    $result = \App\Reckoner\Resolvers\ResolverRegistry::resolve($key, $ctx, $period, $request->args ?? []);
                    if ($ttl > 0 && $result->ok && $result->status !== 'error') {
                        Cache::put($cacheKey, [
                            'data' => $result->data,
                            'status' => $result->status,
                            'meta' => $result->meta,
                            'checks' => $result->checks,
                        ], $ttl);
                    }
                    $results[$id] = $result;
                    continue;
                }

                $results[$id] = ReckonerResult::failure($id, $key, 'resolver_failed', "No source configured for '{$key}'.");

                continue;
            }

            $toResolve[$sourceClass][] = [
                'id' => $id,
                'key' => $key,
                'period' => $period,
                'args' => $request->args,
                'definition' => $definition,
                'ttl' => $ttl,
                'cacheKey' => $cacheKey,
                'is_compare' => false,
            ];

            // Comparison setup
            if (($definition['supports_comparison'] ?? false) && $period->compareStart !== null) {
                $comparePeriod = $period->comparisonWindow();
                $compareCacheKey = $this->cacheKey($t?->id, $key, $comparePeriod, $request->granularity, $request->args, $u);

                $compareValue = null;
                $compareValueCached = false;

                if ($ttl > 0 && Cache::has($compareCacheKey)) {
                    $comparePayload = Cache::get($compareCacheKey);
                    if (is_array($comparePayload) && array_key_exists('value', $comparePayload)) {
                        $compareValue = $comparePayload['value'];
                        $compareValueCached = true;
                    }
                }

                if ($compareValueCached) {
                    $comparisonValues[$id] = $compareValue;
                } else {
                    $toResolve[$sourceClass][] = [
                        'id' => $id.':cmp',
                        'key' => $key,
                        'period' => $comparePeriod,
                        'args' => $request->args,
                        'definition' => $definition,
                        'ttl' => $ttl,
                        'cacheKey' => $compareCacheKey,
                        'is_compare' => true,
                        'primary_id' => $id,
                    ];
                }
            }
        }

        $results = array_merge($results, $cached);

        $ctx = new ReckonerContext($t, $u);
        $resolvedPrimary = [];
        $resolvedCompare = [];

        foreach ($toResolve as $sourceClass => $items) {
            $source = null;
            try {
                /** @var \App\Reckoner\Sources\ReckonerSource $source */
                $source = app($sourceClass);

                $sourceRequests = array_map(fn ($i) => [
                    'id' => $i['id'],
                    'key' => $i['key'],
                    'period' => $i['period'],
                    'args' => $i['args'],
                ], $items);

                $payloads = $source->resolveBatch($sourceRequests, $ctx);
            } catch (Throwable $e) {
                report($e);

                // A source that cannot even be constructed cannot safely be
                // retried item-by-item. Return an error for its own cards only.
                if ($source === null) {
                    foreach ($items as $item) {
                        $primaryId = $item['is_compare'] ? $item['primary_id'] : $item['id'];
                        $results[$primaryId] = ReckonerResult::failure(
                            $primaryId,
                            $item['key'],
                            'resolver_failed',
                            'This reading could not be computed.',
                        );
                    }
                    continue;
                }

                /* One bad resolver must not erase every other card handled by
                 * the same source. Sources batch for speed; this retry is the
                 * containment path when that batch throws. Each request is
                 * retried alone so a bad card gets an error envelope while its
                 * neighbours still receive their reading. */
                $payloads = [];
                foreach ($items as $item) {
                    try {
                        $single = $source->resolveBatch([[
                            'id' => $item['id'],
                            'key' => $item['key'],
                            'period' => $item['period'],
                            'args' => $item['args'],
                        ]], $ctx);
                        if (array_key_exists($item['id'], $single)) {
                            $payloads[$item['id']] = $single[$item['id']];
                            continue;
                        }
                    } catch (Throwable $singleError) {
                        report($singleError);
                        $e = $singleError;
                    }

                    $primaryId = $item['is_compare'] ? $item['primary_id'] : $item['id'];
                    $unavailable = $e instanceof \App\Exceptions\MissingFinancialAccountException;
                    $results[$primaryId] = ReckonerResult::failure(
                        $primaryId,
                        $item['key'],
                        $unavailable ? 'unavailable' : 'resolver_failed',
                        $unavailable ? $e->getMessage() : 'This reading could not be computed.',
                    );
                }
            }

            foreach ($items as $item) {
                $itemId = $item['id'];
                $primaryId = $item['is_compare'] ? $item['primary_id'] : $itemId;

                // The isolated retry already produced this card's definitive
                // error envelope. Do not overwrite it with the less useful
                // generic "source did not return" message below.
                if (isset($results[$primaryId]) && ! $results[$primaryId]->ok) {
                    continue;
                }

                if (! array_key_exists($itemId, $payloads)) {
                    $results[$primaryId] = ReckonerResult::failure($primaryId, $item['key'], 'resolver_failed', "Source did not return a value.");

                    continue;
                }

                $value = $payloads[$itemId];

                // A Source returning null means "I could not compute this", never "the answer
                // is nothing". Correction Spec §1.3. The card explains itself instead of
                // rendering an empty or zero state.
                if ($value === null) {
                    $primaryId = $item['is_compare'] ? $item['primary_id'] : $itemId;
                    $results[$primaryId] = ReckonerResult::failure(
                        $primaryId,
                        $item['key'],
                        'not_applicable',
                        'This reading is not available for your store yet.',
                    );
                    continue;
                }

                if ($item['is_compare']) {
                    $primaryId = $item['primary_id'];
                    $compareNumeric = is_array($value) ? ($value['value'] ?? 0.0) : $value;
                    $resolvedCompare[$primaryId] = $compareNumeric;

                    // Cache resolved comparison as a standalone result
                    $compareData = ['value' => $compareNumeric, 'previous' => null, 'change_pct' => null, 'compare_label' => ''];
                    if ($item['ttl'] > 0) {
                        Cache::put($item['cacheKey'], $compareData, $item['ttl']);
                    }
                } else {
                    $resolvedPrimary[$itemId] = [
                        'value' => $value,
                        'item' => $item,
                    ];
                }
            }
        }

        foreach ($resolvedPrimary as $primaryId => $info) {
            $value = $info['value'];
            $item = $info['item'];
            $key = $item['key'];

            $previous = null;
            if (($item['definition']['supports_comparison'] ?? false) && $item['period']->compareStart !== null) {
                if (array_key_exists($primaryId, $comparisonValues)) {
                    $previous = $comparisonValues[$primaryId];
                } elseif (array_key_exists($primaryId, $resolvedCompare)) {
                    $previous = $resolvedCompare[$primaryId];
                }
            }

            $data = $this->shapeScalarPayload($value, $previous, $item['definition'], $item['period']);

            $isEmpty = ($data['value'] ?? null) === null && empty($data['series']);
            $status = $isEmpty ? 'empty' : 'ok';

            if ($item['ttl'] > 0) {
                Cache::put($item['cacheKey'], [
                    'data' => $data,
                    'status' => $status,
                    'meta' => ['empty' => $isEmpty, 'ttl' => $item['ttl']],
                    'checks' => [],
                ], $item['ttl']);
            }

            $results[$primaryId] = ReckonerResult::success(
                $primaryId,
                $key,
                $item['definition']['shape'],
                $item['definition'],
                $item['period'],
                $data,
                ['cached' => false, 'empty' => $isEmpty, 'ttl' => $item['ttl']],
            );
        }

        // ── Derived reading resolution ────────────────────────────────────────
        // All source-backed reads are complete; now compute derived readings
        // whose 'compute' closure receives already-resolved scalar dep values.
        foreach ($toDerive as $item) {
            $depKeys = $item['definition']['derived'];   // ['sales.revenue', 'finance.net_profit', ...]
            $compute = $item['definition']['compute'];   // fn(array $r): ?float

            $depValues = [];
            $depsOk    = true;

            foreach ($depKeys as $depKey) {
                // Look up the dep in already-resolved results (any composite ID that
                // matches this dep key with the same period window).
                $depFound = false;
                foreach ($results as $resolvedId => $resolvedResult) {
                    // The composite ID format is "{key}|{period}|{from}|{to}|{args_hash}"
                    // We match by prefix (key) for the same period context.
                    if ($resolvedResult->ok && str_starts_with($resolvedId, $depKey . '|')) {
                        $d = $resolvedResult->data;
                        $depValues[$depKey] = is_array($d) ? ($d['value'] ?? null) : $d;
                        $depFound = true;
                        break;
                    }
                }

                if (! $depFound) {
                    // Dep was not in this batch — resolve it now as a sub-read.
                    $depDef = ReckonerRegistry::find($depKey);
                    if ($depDef === null) {
                        $results[$item['id']] = ReckonerResult::failure($item['id'], $item['key'], 'resolver_failed', "Derived dep '{$depKey}' not found in registry.");
                        $depsOk = false;
                        break;
                    }

                    $depRequest = new ReckonerRequest(
                        key:    $depKey,
                        period: $item['period']->key ?? 'today',
                        custom: $item['request']->custom,
                        args:   [],
                    );
                    $depResults  = $this->readMany([$depRequest], $u, $t);
                    $depResult   = array_values($depResults)[0] ?? null;

                    if ($depResult === null || ! $depResult->ok) {
                        // Dep unavailable (permission, plan, capability, etc.) → derived not_applicable.
                        $results[$item['id']] = ReckonerResult::failure($item['id'], $item['key'], 'not_applicable', "Derived dep '{$depKey}' is not available.");
                        $depsOk = false;
                        break;
                    }

                    $d = $depResult->data;
                    $depValues[$depKey] = is_array($d) ? ($d['value'] ?? null) : $d;
                }
            }

            if (! $depsOk) {
                continue;
            }

            // Call the compute closure. null return means not_applicable (e.g. ÷0 guard).
            try {
                $computed = $compute($depValues);
            } catch (Throwable $e) {
                report($e);
                $results[$item['id']] = ReckonerResult::failure($item['id'], $item['key'], 'resolver_failed', 'Derived compute failed.');
                continue;
            }

            if ($computed === null) {
                $results[$item['id']] = ReckonerResult::failure($item['id'], $item['key'], 'not_applicable', 'Derived reading has no applicable value (e.g. revenue is zero).');
                continue;
            }

            $data = $this->shapeScalarPayload($computed, null, $item['definition'], $item['period']);

            if ($item['ttl'] > 0) {
                Cache::put($item['cacheKey'], $data, $item['ttl']);
            }

            $results[$item['id']] = ReckonerResult::success(
                $item['id'],
                $item['key'],
                $item['definition']['shape'],
                $item['definition'],
                $item['period'],
                $data,
                ['cached' => false, 'derived' => true],
            );
        }

        // Preserve request order in the returned array.
        $ordered = [];
        foreach ($requests as $request) {
            $compositeId = $request->getCompositeId();
            $ordered[$compositeId] = $results[$compositeId]
                ?? ReckonerResult::failure($compositeId, $request->key, 'resolver_failed', 'No result returned.');
        }

        return $ordered;
    }

    /**
     * SCALAR shape only in Phase 1 — every metric in the initial catalogue
     * is a scalar. Other shapes are returned by their Source untouched once
     * Phase 2 sources start producing them.
     */
    private function shapeScalarPayload(mixed $value, mixed $previous, array $definition, ReckonerPeriod $period): mixed
    {
        if ($definition['shape'] !== ReckonerShape::SCALAR) {
            return $value;
        }

        if (is_array($value)) {
            $current = is_numeric($value['value'] ?? null) ? (float) $value['value'] : (is_numeric($value['count'] ?? null) ? (float) $value['count'] : null);
            $prev = $previous ?? ($value['previous'] ?? null);
            return array_merge($value, [
                'value'         => $current,
                'previous'      => $prev,
                'change_pct'    => ($prev !== null && $prev > 0 && $current !== null)
                    ? round((($current - $prev) / $prev) * 100, 1)
                    : ($value['change_pct'] ?? null),
                'compare_label' => $period->compareLabel ?: ($value['compare_label'] ?? ''),
                'series'        => $value['series'] ?? null,
            ]);
        }

        $current = is_numeric($value) ? (float) $value : null;

        return [
            'value'      => $current,
            'previous'   => $previous,
            // Growth against a zero baseline is undefined, not infinite.
            // "+100%" because last month was zero is a lie the user will act on.
            'change_pct' => ($previous !== null && $previous > 0 && $current !== null)
                ? round((($current - $previous) / $previous) * 100, 1)
                : null,
            'compare_label' => $period->compareLabel,
        ];
    }

    private function cacheKey(int|string|null $tenantId, string $metric, ReckonerPeriod $period, ?string $granularity, array $args, ?User $user = null): string
    {
        $isPersonal = str_starts_with($metric, 'approval.my_')
            || str_starts_with($metric, 'cashier.')
            || str_starts_with($metric, 'staff.my_')
            || in_array($metric, ['approval.awaiting_review', 'approval.pending_aging'], true);

        $scope = ($isPersonal && $user) ? 'u_' . $user->id : 'tenant';

        return sprintf(
            'vq_reckoner:%s:%s:%s:%s:%s:%s',
            $tenantId ?? 'null',
            $metric,
            $period->start->toDateString().'_'.$period->end->toDateString(),
            $granularity ?? '',
            md5(json_encode($args)),
            $scope
        );
    }

    /* ------------------------------------------------------------------ *
     * Gate helpers — logic ported verbatim from WidgetRegistry (§4.1).
     * ------------------------------------------------------------------ */

    /**
     * The module gate. `null` = core reading, never gated. A string is one
     * owning module; an array means the reading survives while ANY listed
     * module is visible. Uses ModuleService::enabled() (not visible()) so a
     * beta module a tenant has switched on still feeds its cards — the
     * permission dimension is already gate 3's job.
     */
    private function passesModules(?Tenant $tenant, User $user, string|array|null $module): bool
    {
        if ($module === null || $tenant === null) {
            return true;
        }

        foreach ((array) $module as $moduleKey) {
            if (\App\Services\ModuleService::enabled($tenant, $moduleKey)) {
                return true;
            }
        }

        return false;
    }

    private function passesPermissions(User $user, array $permissions): bool
    {
        if (empty($permissions)) {
            return true;
        }

        foreach ($permissions as $permission) {
            try {
                if ($user->hasPermission($permission)) {
                    return true;
                }
            } catch (Throwable) {
                // An unknown permission key is a missing grant, not an open door.
            }
        }

        return false;
    }

    private function features(Tenant $tenant): array
    {
        try {
            return PlanRepository::featuresFor($tenant);
        } catch (Throwable) {
            return [];
        }
    }

    /**
     * Same probes as WidgetRegistry::capabilities(), plus the Reckoner-only
     * ones this build spec adds (§4.1). Cached 10 minutes per tenant.
     */
    private function capabilities(Tenant $tenant): array
    {
        return Cache::remember("vq_reckoner_capabilities:{$tenant->id}", self::CAPABILITY_TTL, function () use ($tenant) {
            $features = $this->features($tenant);

            $probe = function (string $table, callable $query) {
                try {
                    return Schema::hasTable($table) ? (bool) $query() : false;
                } catch (Throwable) {
                    return false;
                }
            };

            return [
                'has_inventory' => $probe('products', fn () => DB::table('products')->where('tenant_id', $tenant->id)->whereNull('deleted_at')->exists()),
                'has_parties' => $probe('parties', fn () => DB::table('parties')->where('tenant_id', $tenant->id)->whereNull('deleted_at')->exists()),
                'has_purchases' => $probe('purchases', fn () => DB::table('purchases')->where('tenant_id', $tenant->id)->whereNull('deleted_at')->exists()),
                'has_sales_orders' => $probe('sales_orders', fn () => DB::table('sales_orders')->where('tenant_id', $tenant->id)->whereNull('deleted_at')->exists()),
                'has_manufacturing' => ! empty($features['production'])
                    && $probe('compositions', fn () => DB::table('compositions')->where('tenant_id', $tenant->id)->whereNull('deleted_at')->exists()),
                'has_staff' => $probe(
                    'tenant_users',
                    fn () => \App\Models\TenantUser::withoutGlobalScopes()
                        ->where('tenant_id', $tenant->id)
                        ->count() >= 1,
                ),
                // Reckoner-only probes (§4.1) — default false until their
                // Phase 2/4 sources exist to make them meaningful.
                'has_restaurant' => $probe('occupancies', fn () => DB::table('occupancies')->where('tenant_id', $tenant->id)->exists()),
                'has_ecommerce' => $probe('ecommerce_channels', fn () => DB::table('ecommerce_channels')->where('tenant_id', $tenant->id)->exists()),
                'has_fbr' => false,
                'has_bank_accounts' => $probe('bank_accounts', fn () => DB::table('bank_accounts')->where('tenant_id', $tenant->id)->whereNull('deleted_at')->exists()),
                'has_production_costs' => false,
            ];
        });
    }

    public static function forgetCapabilities(int|string $tenantId): void
    {
        Cache::forget("vq_reckoner_capabilities:{$tenantId}");
    }
}
