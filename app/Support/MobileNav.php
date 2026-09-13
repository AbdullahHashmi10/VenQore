<?php

namespace App\Support;

use App\Models\Tenant;
use App\Services\ModuleService;
use Illuminate\Support\Facades\Route;

/**
 * Mobile Bottom Navigation Resolver (SPEC_MOBILE_BOTTOM_NAV.md + SPEC_MOBILE_NAV_ADDENDUM.md)
 *
 * Resolves 3 to 5 navigation slots:
 * 1. Home (always, slot 1)
 * 2-4. Up to 3 lowest-order enabled modules declaring nav metadata (with nav_pin priority and deduplication)
 * 5. More (always, slot 5)
 *
 * If fewer than 3 slots resolve, returns an empty array (renders nothing).
 */
class MobileNav
{
    /**
     * Resolve the mobile navigation items for a tenant.
     *
     * @param Tenant $tenant
     * @param mixed $user
     * @return array
     */
    public static function resolveForTenant(Tenant $tenant, $user = null): array
    {
        $enabledModules = ModuleService::allVisible($tenant, $user);
        $presetKey = $tenant->business_type ? BusinessTypes::presetFor($tenant->business_type) : null;

        return self::resolve($enabledModules, $presetKey, $tenant);
    }

    /**
     * Resolve navigation items given enabled modules, preset, and optional tenant.
     *
     * @param array $enabledModules
     * @param string|null $presetKey
     * @param Tenant|null $tenant
     * @return array
     */
    public static function resolve(array $enabledModules, ?string $presetKey = null, ?Tenant $tenant = null): array
    {
        $presetsConfig = config('ai_builder.presets', []);
        $modulesConfig = config('modules', []);

        // 1. Determine pinned modules for preset
        $rawPins = $presetKey && isset($presetsConfig[$presetKey]['nav_pin'])
            ? (array) $presetsConfig[$presetKey]['nav_pin']
            : [];

        // Normalize aliases: e.g. 'production' -> 'production_runs'
        $pins = [];
        foreach ($rawPins as $p) {
            $normalized = ($p === 'production') ? 'production_runs' : $p;
            if (!in_array($normalized, $pins, true)) {
                $pins[] = $normalized;
            }
        }

        // Candidates
        $pinnedCandidates = [];
        $normalCandidates = [];

        // Pinned candidates first (only if enabled and live)
        foreach ($pins as $pinMod) {
            if (in_array($pinMod, $enabledModules, true) && !empty($modulesConfig[$pinMod]['nav'])) {
                if (($modulesConfig[$pinMod]['status'] ?? 'live') !== 'live') {
                    continue;
                }
                foreach ($modulesConfig[$pinMod]['nav'] as $navEntry) {
                    $route = $navEntry['route'] ?? null;
                    if ($route && Route::has($route)) {
                        $navEntry['module'] = $pinMod;
                        $pinnedCandidates[] = $navEntry;
                    }
                }
            }
        }

        // Normal candidates for other enabled modules
        foreach ($enabledModules as $modKey) {
            if (in_array($modKey, $pins, true)) {
                continue;
            }
            if (!empty($modulesConfig[$modKey]['nav'])) {
                if (($modulesConfig[$modKey]['status'] ?? 'live') !== 'live') {
                    continue;
                }
                foreach ($modulesConfig[$modKey]['nav'] as $navEntry) {
                    $route = $navEntry['route'] ?? null;
                    if ($route && Route::has($route)) {
                        $navEntry['module'] = $modKey;
                        $normalCandidates[] = $navEntry;
                    }
                }
            }
        }

        // Sort normal candidates by order ascending
        usort($normalCandidates, function ($a, $b) {
            return ($a['order'] ?? 999) <=> ($b['order'] ?? 999);
        });

        $allCandidates = array_merge($pinnedCandidates, $normalCandidates);

        // De-duplicate by destination route
        $seenRoutes = [];
        $deduped = [];
        foreach ($allCandidates as $cand) {
            $rt = $cand['route'];
            if (!in_array($rt, $seenRoutes, true)) {
                $seenRoutes[] = $rt;
                $deduped[] = $cand;
            }
        }

        // Take top 3
        $topThree = array_slice($deduped, 0, 3);

        $items = [];
        $items[] = [
            'id'     => 'home',
            'label'  => 'Home',
            'route'  => 'store.dashboard',
            'icon'   => 'Home',
            'module' => null,
        ];

        foreach ($topThree as $cand) {
            $items[] = [
                'id'     => $cand['module'],
                'label'  => self::label($cand, $modulesConfig[$cand['module']] ?? [], $tenant),
                'route'  => $cand['route'],
                'icon'   => $cand['icon'] ?? 'Package',
                'module' => $cand['module'],
            ];
        }

        $items[] = [
            'id'     => 'more',
            'label'  => 'More',
            'route'  => null,
            'icon'   => 'Menu',
            'module' => null,
        ];

        if (count($items) < 3) {
            return [];
        }

        return $items;
    }

    /**
     * Resolve terminology label for nav entry.
     */
    private static function label(array $nav, array $module, ?Tenant $tenant = null): string
    {
        if (empty($nav['term'])) {
            return $module['label'] ?? ucfirst($nav['module'] ?? '');
        }

        try {
            if ($tenant) {
                $terms = Terms::forTenant($tenant->id);
                if (isset($terms[$nav['term']]['plural'])) {
                    return $terms[$nav['term']]['plural'];
                }
            }
            return Terms::get($nav['term'], 'plural');
        } catch (\Throwable) {
            return $module['label'] ?? ucfirst($nav['term']);
        }
    }
}
