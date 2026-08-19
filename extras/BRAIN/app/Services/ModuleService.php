<?php

namespace App\Services;

use App\Models\Tenant;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/*
|==============================================================================
| STEP 6 — ModuleService
|==============================================================================
|
| The read side of the module system. Everything that needs to know "is this
| module on for this tenant?" asks here, and nowhere else.
|
| Consumers: EnsureModule middleware, HandleInertiaRequests (nav + props),
| DashboardRegistry filtering, ReportController's report map, the AI proposal
| screen, and the builder UI.
|
|------------------------------------------------------------------------------
| THE THREE STATES — do not collapse them
|------------------------------------------------------------------------------
|   entitled  — the plan allows it            (PlanRepository)
|   enabled   — the tenant switched it on     (this class)
|   permitted — this USER may see it          (permissions)
|
|   visible = entitled AND enabled AND permitted
|
| Under usage-based billing every module is entitled on every plan, so
| entitlement is effectively always true — but the check stays in visible()
| because the four paid exceptions still need it, and because deleting the
| concept would make re-introducing it a rewrite.
|
|------------------------------------------------------------------------------
| THE SAFETY RAIL THAT MATTERS MOST
|------------------------------------------------------------------------------
| A tenant with ZERO rows in tenant_modules is treated as HAVING EVERYTHING.
|
| Read that twice. It is the difference between a safe deploy and locking every
| existing customer out of their own system.
|
| The middleware ships before, during and after the backfill. Any tenant the
| backfill has not reached yet — or one created by a signup that raced the
| migration — must keep working exactly as they did yesterday. Fail OPEN on
| absence of configuration; fail CLOSED only on an explicit `enabled = false`.
|
| This is the opposite of how you'd treat a permission check, and deliberately
| so: an unconfigured module is not a denied module, it is an unasked question.
|
|------------------------------------------------------------------------------
| CACHING — mirrors PlanRepository exactly, on purpose
|------------------------------------------------------------------------------
| Same 300s TTL, same key shape, same invalidate-on-write discipline. One cache
| story in the codebase is worth more than a marginally better second one.
|==============================================================================
*/
class ModuleService
{
    /** Seconds. Matches PlanRepository's TTL deliberately — see the note above. */
    private const TTL = 300;

    /**
     * Is this module switched on for this tenant?
     *
     * Returns TRUE for an unknown module key. That looks wrong and is not: an
     * unknown key is not a module, so it cannot be "off", and the caller (the
     * route gate) must not block a route it does not understand. The integrity
     * test is what stops unknown keys existing in the first place.
     */
    public static function enabled(?Tenant $tenant, string $moduleKey): bool
    {
        if (!$tenant || !$tenant->id) {
            return true;                      // no tenant context — not our decision
        }

        if (!array_key_exists($moduleKey, config('modules', []))) {
            return true;                      // not a module; nothing to gate
        }

        $map = self::allFor($tenant);

        if ($map === []) {
            return true;                      // unconfigured tenant — see the safety rail
        }

        return $map[$moduleKey] ?? true;      // key absent from a configured tenant: still open
    }

    /**
     * enabled() AND the user holds at least one of the module's permissions.
     *
     * Use this for NAVIGATION and DASHBOARD CARDS. Use enabled() for the route
     * gate — the gate must not double-enforce permissions, because
     * CheckPermissions already does that and returns a better error.
     */
    public static function visible(?Tenant $tenant, string $moduleKey, $user = null): bool
    {
        if (!self::enabled($tenant, $moduleKey)) {
            return false;
        }

        $module = config("modules.{$moduleKey}");

        if (!$module) {
            return true;
        }

        // Modules that are not live must never appear in the interface, whatever
        // the tenant row says. A 'building' module with an accidental enabled=1
        // row would otherwise put a dead nav item in front of a customer.
        if (($module['status'] ?? 'live') !== 'live') {
            return false;
        }

        // The four paid exceptions still consult the plan.
        if (($module['billing'] ?? 'included') !== 'included' && $tenant) {
            $gate = $module['legacy_gate'] ?? null;
            if ($gate && !PlanRepository::canUseFeature($tenant, $gate)) {
                return false;
            }
        }

        $permissions = $module['permissions'] ?? [];

        if ($permissions === []) {
            return true;
        }

        $user = $user ?: auth()->user();

        if (!$user) {
            return false;
        }

        foreach ($permissions as $permission) {
            if (method_exists($user, 'hasPermission') && $user->hasPermission($permission)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Every enabled module key for this tenant.
     *
     * For an unconfigured tenant this returns every key in the registry, which
     * is the same fail-open promise enabled() makes.
     */
    public static function allEnabled(?Tenant $tenant): array
    {
        $registry = array_keys(config('modules', []));

        if (!$tenant || !$tenant->id) {
            return $registry;
        }

        $map = self::allFor($tenant);

        if ($map === []) {
            return $registry;
        }

        return array_values(array_filter($registry, fn ($key) => $map[$key] ?? true));
    }

    /** Enabled AND live AND permitted — what the shell should actually render. */
    public static function allVisible(?Tenant $tenant, $user = null): array
    {
        return array_values(array_filter(
            self::allEnabled($tenant),
            fn ($key) => self::visible($tenant, $key, $user)
        ));
    }

    /**
     * Switch a module on.
     *
     * Does NOT resolve dependencies — that is ModuleDependencyResolver's job,
     * and it must run BEFORE this so the user can be shown what else will be
     * switched on and why. A silent cascade is how a builder starts feeling
     * like it is arguing with you.
     *
     * ApplyConfigurationService is the only class that should call this in
     * production: one write path, one transaction, one version snapshot.
     */
    public static function enable(Tenant $tenant, string $moduleKey, string $source = 'user'): void
    {
        self::write($tenant, $moduleKey, true, $source);
    }

    /**
     * Switch a module off. HIDES; never deletes.
     *
     * Returns the row counts the caller should show the customer first. An
     * empty array means nothing is at stake.
     */
    public static function disable(Tenant $tenant, string $moduleKey, string $source = 'user'): void
    {
        self::write($tenant, $moduleKey, false, $source);
    }

    /**
     * How much of this module's data exists — for the "nothing will be deleted"
     * confirmation.
     *
     * Reads `owns_data` from the registry. Missing tables are skipped rather
     * than throwing: a registry entry may name a table a given deployment has
     * not migrated yet, and a confirmation dialog is not worth a 500.
     */
    public static function dataAtStake(Tenant $tenant, string $moduleKey): array
    {
        $tables = config("modules.{$moduleKey}.owns_data", []);
        $counts = [];

        foreach ($tables as $table) {
            try {
                if (!\Illuminate\Support\Facades\Schema::hasTable($table)) {
                    continue;
                }

                $query = DB::table($table);

                if (\Illuminate\Support\Facades\Schema::hasColumn($table, 'tenant_id')) {
                    $query->where('tenant_id', $tenant->id);
                }

                $count = $query->count();

                if ($count > 0) {
                    $counts[$table] = $count;
                }
            } catch (\Throwable) {
                // Never let a confirmation dialog crash the app.
            }
        }

        return $counts;
    }

    /**
     * Which modules would break if this one were switched off.
     * Used for: "POS and Cookbook need Products. Remove all three, or keep
     * Products just for POS?"
     */
    public static function dependents(string $moduleKey): array
    {
        $dependents = [];

        foreach (config('modules', []) as $key => $module) {
            if (in_array($moduleKey, $module['requires'] ?? [], true)) {
                $dependents[] = $key;
            }
        }

        return $dependents;
    }

    public static function invalidate(int $tenantId): void
    {
        Cache::forget("tenant_modules:{$tenantId}");
    }

    // ---------------------------------------------------------------- internals

    /** module_key => bool, or [] when the tenant has no configuration at all. */
    private static function allFor(Tenant $tenant): array
    {
        return Cache::remember("tenant_modules:{$tenant->id}", self::TTL, function () use ($tenant) {
            try {
                return DB::table('tenant_modules')
                    ->where('tenant_id', $tenant->id)
                    ->pluck('enabled', 'module_key')
                    ->map(fn ($v) => (bool) $v)
                    ->toArray();
            } catch (\Throwable) {
                // Table not migrated yet. Fail open — see the safety rail.
                return [];
            }
        });
    }

    private static function write(Tenant $tenant, string $moduleKey, bool $enabled, string $source): void
    {
        if (!array_key_exists($moduleKey, config('modules', []))) {
            // Silently ignored, exactly like an unknown key from the AI. Never
            // create a row for a module that does not exist — that is how a
            // registry ends up with orphans nobody can explain.
            return;
        }

        DB::table('tenant_modules')->updateOrInsert(
            ['tenant_id' => $tenant->id, 'module_key' => $moduleKey],
            ['enabled' => $enabled, 'source' => $source, 'updated_at' => now(), 'created_at' => now()]
        );

        self::invalidate($tenant->id);
    }
}
