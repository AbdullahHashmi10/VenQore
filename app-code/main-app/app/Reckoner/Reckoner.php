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

            if ($definition === null || ($definition['scope'] ?? 'tenant') === 'platform' || ($definition['implemented'] ?? true) === false) {
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
        $toResolve = []; // sourceClass => [ ['id'=>, 'key'=>, 'period'=>, 'args'=>, 'definition'=>], ... ]
        $cached = [];    // id => ReckonerResult already served from cache
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
            // "Switched off" is not "plan-locked" and not "no data yet", so it
            // reports as not_applicable.
            if ($t !== null && ! $this->passesModules($t, $u, $definition['module'] ?? null)) {
                $results[$id] = ReckonerResult::failure($id, $key, 'not_applicable', 'This store has this module switched off.');

                continue;
            }

            // 6a. Validate period
            $periodKey = $request->period ?: ($definition['default_period'] ?? 'today');
            if (! in_array($periodKey, $definition['periods'] ?? [], true)) {
                $results[$id] = ReckonerResult::failure($id, $key, 'invalid_period', "Period '{$periodKey}' is not valid for '{$key}'.");

                continue;
            }

            try {
                $period = ReckonerPeriod::resolve($periodKey, $request->custom, $t);
            } catch (Throwable $e) {
                $results[$id] = ReckonerResult::failure($id, $key, 'invalid_period', $e->getMessage());

                continue;
            }

            // Cache lookup.
            $ttl = $definition['cache_ttl'] ?? 60;
            $cacheKey = $this->cacheKey($t?->id, $key, $period, $request->granularity, $request->args);

            if ($ttl > 0 && Cache::has($cacheKey)) {
                $payload = Cache::get($cacheKey);
                $cached[$id] = ReckonerResult::success(
                    $id,
                    $key,
                    $definition['shape'],
                    $definition,
                    $period,
                    $payload,
                    ['cached' => true],
                );

                continue;
            }

            $sourceClass = $definition['source'] ?? null;
            if (! $sourceClass || ! class_exists($sourceClass)) {
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
                $compareCacheKey = $this->cacheKey($t?->id, $key, $comparePeriod, $request->granularity, $request->args);

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

                foreach ($items as $item) {
                    $primaryId = $item['is_compare'] ? $item['primary_id'] : $item['id'];
                    $results[$primaryId] = ReckonerResult::failure($primaryId, $item['key'], 'resolver_failed', 'This reading could not be computed.');
                }

                continue;
            }

            foreach ($items as $item) {
                $itemId = $item['id'];

                if (! array_key_exists($itemId, $payloads)) {
                    $primaryId = $item['is_compare'] ? $item['primary_id'] : $itemId;
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
                    $resolvedCompare[$primaryId] = $value;

                    // Cache resolved comparison as a standalone result
                    $compareData = ['value' => $value, 'previous' => null, 'change_pct' => null, 'compare_label' => ''];
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

            if ($item['ttl'] > 0) {
                Cache::put($item['cacheKey'], $data, $item['ttl']);
            }

            $results[$primaryId] = ReckonerResult::success(
                $primaryId,
                $key,
                $item['definition']['shape'],
                $item['definition'],
                $item['period'],
                $data,
                ['cached' => false],
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

    private function cacheKey(int|string|null $tenantId, string $metric, ReckonerPeriod $period, ?string $granularity, array $args): string
    {
        return sprintf(
            'vq_reckoner:%s:%s:%s:%s:%s',
            $tenantId ?? 'null',
            $metric,
            $period->start->toDateString().'_'.$period->end->toDateString(),
            $granularity ?? '',
            md5(json_encode($args))
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
                'has_inventory' => $probe('products', fn () => \App\Models\Product::query()->exists()),
                'has_parties' => $probe('parties', fn () => \App\Models\Party::query()->exists()),
                'has_purchases' => $probe('purchases', fn () => \App\Models\Purchase::query()->exists()),
                'has_sales_orders' => $probe('sales_orders', fn () => \App\Models\SalesOrder::query()->exists()),
                'has_manufacturing' => ! empty($features['production'])
                    && $probe('compositions', fn () => \App\Models\Composition::query()->exists()),
                'has_staff' => $probe(
                    'tenant_users',
                    fn () => \App\Models\TenantUser::withoutGlobalScopes()
                        ->where('tenant_id', $tenant->id)
                        ->count() > 1,
                ),
                // Reckoner-only probes (§4.1) — default false until their
                // Phase 2/4 sources exist to make them meaningful.
                'has_restaurant' => $probe('restaurant_tables', fn () => DB::table('restaurant_tables')->where('tenant_id', $tenant->id)->exists()),
                'has_ecommerce' => $probe('ecommerce_channels', fn () => DB::table('ecommerce_channels')->where('tenant_id', $tenant->id)->exists()),
                'has_fbr' => false,
                'has_bank_accounts' => $probe('bank_accounts', fn () => \App\Models\BankAccount::query()->exists()),
                'has_production_costs' => false,
            ];
        });
    }

    public static function forgetCapabilities(int|string $tenantId): void
    {
        Cache::forget("vq_reckoner_capabilities:{$tenantId}");
    }
}
