<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;

/*
|==============================================================================
| STEP 7a — ModuleRouteMap
|==============================================================================
|
| Answers one question: "which modules own this route name?"
|
| WHY A MAP INSTEAD OF ->middleware('module:pos') ON EVERY ROUTE
| --------------------------------------------------------------
| The registry claims 464 route names. Annotating each one by hand means a
| 464-line diff through a 2,172-line routes file, and every route somebody
| forgets is a module that stays reachable when it is switched off. The gate
| would be exactly as complete as the person applying it was patient.
|
| Deriving the map from config/modules.php instead means:
|   - adding a module gates its routes automatically,
|   - ModuleRegistryIntegrityTest already proves every pattern resolves,
|   - ROUTE_OWNERSHIP.md already proves zero routes are unclaimed,
|   - routes/web.php is not touched at all.
|
| The per-route alias still exists for genuine exceptions — see EnsureModule.
|
| SHARED ROUTES
| -------------
| Seven routes are claimed by two modules each (mostly reports: a khata report
| belongs to both Khata and Reports). The rule is OR, not AND: the route is
| allowed when ANY owner is enabled. Requiring all owners would hide the party
| statement from someone who turned off the Reports module but still uses khata.
|
| CACHING
| -------
| Built once, cached for an hour, and keyed on a hash of the registry so a
| deploy that changes config/modules.php invalidates it without anyone
| remembering to run cache:clear. Route lists change on deploy, never at
| runtime.
|==============================================================================
*/
class ModuleRouteMap
{
    private const TTL = 3600;

    /**
     * @return array<string, string[]>  route name => owning module keys
     */
    public static function all(): array
    {
        return Cache::remember(self::cacheKey(), self::TTL, function () {
            $map = [];
            $names = array_keys(app('router')->getRoutes()->getRoutesByName());

            foreach (config('modules', []) as $moduleKey => $module) {
                foreach ($module['routes'] ?? [] as $pattern) {
                    foreach ($names as $name) {
                        if (self::matches($pattern, $name)) {
                            $map[$name][] = $moduleKey;
                        }
                    }
                }
            }

            return array_map('array_values', array_map('array_unique', $map));
        });
    }

    /** @return string[] owning module keys, empty when nothing claims it */
    public static function ownersOf(?string $routeName): array
    {
        if (!$routeName) {
            return [];
        }

        return self::all()[$routeName] ?? [];
    }

    /**
     * Platform surfaces the gate must never block, whatever else is true.
     * Settings, billing, backups, the dashboard itself.
     */
    public static function isAlwaysOn(?string $routeName): bool
    {
        if (!$routeName) {
            return true;
        }

        foreach (config('qore.always_on_routes', []) as $pattern) {
            if (self::matches($pattern, $routeName)) {
                return true;
            }
        }

        foreach (array_keys(config('qore.frozen_surfaces', [])) as $pattern) {
            if (self::matches($pattern, $routeName)) {
                return true;
            }
        }

        return false;
    }

    public static function flush(): void
    {
        Cache::forget(self::cacheKey());
    }

    /**
     * '*' is the only wildcard, and it does NOT match an empty segment:
     * 'store.pos.*' deliberately does not match 'store.pos'. Both forms are
     * listed separately in the registry where both exist — that asymmetry is
     * load-bearing, not an oversight.
     */
    private static function matches(string $pattern, string $name): bool
    {
        if (!str_contains($pattern, '*')) {
            return $pattern === $name;
        }

        return (bool) preg_match(
            '/^'.str_replace('\*', '.+', preg_quote($pattern, '/')).'$/',
            $name
        );
    }

    private static function cacheKey(): string
    {
        return 'module_route_map:'.substr(md5(serialize(array_map(
            fn ($m) => $m['routes'] ?? [],
            config('modules', [])
        ))), 0, 12);
    }
}
