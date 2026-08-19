<?php

namespace App\Services\AiBuilder;

use App\Engines\ModuleDependencyResolver;
use App\Models\Tenant;
use App\Services\ModuleService;
use Illuminate\Support\Facades\DB;

/*
|==============================================================================
| STEP 10 — ApplyConfigurationService
|==============================================================================
|
| THE SINGLE WRITER.
|
| The preset picker uses it. The AI uses it. The manual toggle screen uses it.
| Three entry points, ONE write path, one transaction, one version snapshot,
| one set of tests.
|
| The moment there are two ways to write a configuration they diverge, and you
| spend a week finding out which one produced the broken tenant. This class
| existing is worth more than anything clever inside it.
|
|------------------------------------------------------------------------------
| CONTAINS NO AI
|------------------------------------------------------------------------------
| By the time a configuration reaches here it has been through the validator,
| the Qore strip, the dependency resolver and a human pressing a button. This
| class assumes all of that and does exactly what it is told — inside a
| transaction, with a snapshot taken first.
|==============================================================================
*/
class ApplyConfigurationService
{
    public function __construct(private ModuleDependencyResolver $resolver)
    {
    }

    /**
     * Apply a configuration and record a version.
     *
     * @param  array  $config  ['modules' => [], 'terminology' => [], 'dashboard' => []]
     * @return array{version:int, enabled:string[], disabled:string[], newly_enabled:string[]}
     *
     * @throws \InvalidArgumentException when the set is not internally valid
     */
    public function apply(Tenant $tenant, array $config, string $source = 'user', ?string $reason = null): array
    {
        $modules = array_values(array_unique($config['modules'] ?? []));

        // LAST LINE OF DEFENCE. The validator should have caught anything
        // invalid long before now — but this class is the only writer, so it
        // refuses rather than trusting its callers. A guard that only fires
        // when everything upstream is broken is exactly when you want it.
        $problems = $this->resolver->validate($modules);

        if ($problems !== []) {
            throw new \InvalidArgumentException(
                'Refusing to apply an invalid configuration: '.implode(' ', $problems)
            );
        }

        return DB::transaction(function () use ($tenant, $config, $modules, $source, $reason) {

            $before = ModuleService::allEnabled($tenant);

            // Snapshot BEFORE the write, so version N is the state you can
            // return to — not the state you just left.
            $this->snapshot($tenant, $before, $source, $reason);

            $registry = array_keys(config('modules', []));
            $newlyEnabled = array_values(array_diff($modules, $before));
            $disabled = array_values(array_diff($registry, $modules));

            $now = now();
            $rows = [];

            foreach ($registry as $key) {
                $rows[] = [
                    'tenant_id'  => $tenant->id,
                    'module_key' => $key,
                    'enabled'    => in_array($key, $modules, true),
                    'source'     => $source,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            DB::table('tenant_modules')->upsert(
                $rows,
                ['tenant_id', 'module_key'],
                ['enabled', 'source', 'updated_at']
            );

            $this->applyTerminology($tenant, $config['terminology'] ?? []);

            ModuleService::invalidate($tenant->id);

            if (method_exists(\App\Support\Terms::class, 'invalidateCache')) {
                \App\Support\Terms::invalidateCache($tenant->id);
            }

            return [
                'version'       => $this->currentVersion($tenant),
                'enabled'       => $modules,
                'disabled'      => $disabled,
                'newly_enabled' => $newlyEnabled,
            ];
        });
    }

    /**
     * Apply a named preset.
     *
     * Runs it through the resolver first, so a preset that has drifted from the
     * registry still produces a valid system rather than a broken one. The
     * golden tests should catch that drift — this catches it in production if
     * they did not.
     */
    public function applyPreset(Tenant $tenant, string $presetKey): array
    {
        $preset = config("ai_builder.presets.{$presetKey}");

        if (!$preset) {
            throw new \InvalidArgumentException("Unknown preset '{$presetKey}'.");
        }

        if (!empty($preset['blocked_by'])) {
            throw new \RuntimeException(
                "Preset '{$presetKey}' is not ready to ship: it needs ".implode(', ', $preset['blocked_by']).'.'
            );
        }

        $resolved = $this->resolver->resolve($preset['modules']);

        return $this->apply($tenant, [
            'modules'     => $resolved['modules'],
            'terminology' => $preset['terms'] ?? [],
            'dashboard'   => $preset['cards'] ?? [],
        ], 'preset', "Applied the {$preset['label']} template.");
    }

    /**
     * Undo — restore an earlier version.
     *
     * Restoring CREATES A NEW VERSION rather than deleting later ones. History
     * is append-only, so "undo the undo" works, and so a customer support
     * conversation can reconstruct what actually happened rather than what the
     * current state implies.
     */
    public function restore(Tenant $tenant, int $version): array
    {
        $snapshot = DB::table('tenant_config_versions')
            ->where('tenant_id', $tenant->id)
            ->where('version', $version)
            ->first();

        if (!$snapshot) {
            throw new \InvalidArgumentException("No version {$version} for this business.");
        }

        $modules = json_decode($snapshot->modules, true) ?: [];

        // Modules can be RETIRED between the snapshot and the restore. Drop
        // anything the registry no longer knows about rather than failing the
        // whole restore — the customer wants their system back, not a lecture.
        $modules = array_values(array_filter($modules, fn ($k) => array_key_exists($k, config('modules', []))));

        $result = $this->apply($tenant, [
            'modules'     => $modules,
            'terminology' => json_decode($snapshot->terminology ?? '[]', true) ?: [],
            'dashboard'   => json_decode($snapshot->dashboard ?? '[]', true) ?: [],
        ], 'restore', "Restored version {$version}.");

        DB::table('tenant_config_versions')
            ->where('tenant_id', $tenant->id)
            ->where('version', $result['version'])
            ->update(['restored_from' => $version]);

        return $result;
    }

    /** History for the "what changed and when" screen. */
    public function history(Tenant $tenant, int $limit = 20): array
    {
        return DB::table('tenant_config_versions')
            ->where('tenant_id', $tenant->id)
            ->orderByDesc('version')
            ->limit($limit)
            ->get(['version', 'source', 'reason', 'restored_from', 'created_at'])
            ->map(fn ($row) => (array) $row)
            ->all();
    }

    // ---------------------------------------------------------------- internals

    private function snapshot(Tenant $tenant, array $modules, string $source, ?string $reason): void
    {
        DB::table('tenant_config_versions')->insert([
            'tenant_id'   => $tenant->id,
            'version'     => $this->currentVersion($tenant) + 1,
            'modules'     => json_encode(array_values($modules)),
            'terminology' => json_encode($this->currentTerminology($tenant)),
            'dashboard'   => json_encode([]),
            'source'      => $source,
            'reason'      => $reason,
            'actor_id'    => auth()->id(),
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);
    }

    private function currentVersion(Tenant $tenant): int
    {
        return (int) DB::table('tenant_config_versions')
            ->where('tenant_id', $tenant->id)
            ->max('version');
    }

    private function currentTerminology(Tenant $tenant): array
    {
        try {
            return DB::table('tenant_terminology')
                ->where('tenant_id', $tenant->id)
                ->get()
                ->mapWithKeys(fn ($r) => [$r->term_key => ['singular' => $r->singular, 'plural' => $r->plural]])
                ->toArray();
        } catch (\Throwable) {
            return [];
        }
    }

    /**
     * Terminology writes are filtered against Terms::$fallbacks, so a made-up
     * key from an AI response cannot create a row nothing will ever read.
     */
    private function applyTerminology(Tenant $tenant, array $terminology): void
    {
        if ($terminology === []) {
            return;
        }

        $valid = array_keys(
            (new \ReflectionClass(\App\Support\Terms::class))->getStaticPropertyValue('fallbacks')
        );

        foreach ($terminology as $key => $words) {
            if (!in_array($key, $valid, true)) {
                continue;   // unknown term key — dropped silently, like any other
            }

            if (empty($words['singular']) || empty($words['plural'])) {
                continue;
            }

            DB::table('tenant_terminology')->updateOrInsert(
                ['tenant_id' => $tenant->id, 'term_key' => $key],
                [
                    'singular'   => mb_substr($words['singular'], 0, 80),
                    'plural'     => mb_substr($words['plural'], 0, 80),
                    'updated_by' => auth()->id(),
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }
    }
}
