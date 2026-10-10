<?php

namespace App\Services\Vena;

use App\Reckoner\ReckonerRegistry;
use App\Services\Dashboard\DashboardRegistry;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;

/**
 * Builds the retrieval chunks Vena answers from.
 *
 * ── Single source, no second list ────────────────────────────────────────────
 * Nothing here is typed by hand except the PROCEDURES in config/vena_guides.php.
 * Everything else is read from the system's own registries:
 *
 *   modules   config/modules.php                       (what can be switched on, what it needs)
 *   screens   the named GET routes + the modules that own them + AppRegistry.js
 *             (the Omni-Search registry already holds plain-English titles/keywords)
 *   readings  ReckonerRegistry                          (every number the product can show)
 *   cards     DashboardRegistry
 *   ai        config/ai_models.php
 *   guides    config/vena_guides.php                    (step-by-step procedures)
 *
 * It is used by `php artisan venqore:manifest` (writes the JSON for tooling) and
 * by VenaKnowledge at runtime (builds in memory when the file is missing or old),
 * so Vena can never be behind the software by more than one deploy.
 *
 * Each entry: {type, id, title, text, meta}. `text` is plain and specific —
 * it is what the matcher scores a question against before any model is called.
 */
class ManifestBuilder
{
    /** Route-name fragments that are plumbing, not places a person goes. */
    private const NOISE = [
        '.api', 'api.', '.state', '.redirect', '.progress', '.legacy', 'legacy.', 'generated::',
        'dashboard-v1', 'new-dashbaord', '.search', '.export', 'sanctum.', 'store.google.',
        'eviction-status', '.unread', '.summary', 'onboarding.step',
    ];

    /**
     * @return array{entries: list<array<string,mixed>>, counts: array<string,int>, warnings: list<string>}
     */
    public static function build(): array
    {
        $entries  = [];
        $counts   = [];
        $warnings = [];

        $collectors = [
            'guides'   => fn () => self::collectGuides(),
            'modules'  => fn () => self::collectModules(),
            'screens'  => fn () => self::collectScreens(),
            'readings' => fn () => self::collectReadings(),
            'cards'    => fn () => self::collectCards(),
            'ai'       => fn () => self::collectAiFeatures(),
        ];

        foreach ($collectors as $label => $collector) {
            try {
                $found = $collector();
                $entries = array_merge($entries, $found);
                $counts[$label] = count($found);
            } catch (\Throwable $e) {
                // A missing or renamed source must never break the build.
                $warnings[] = "{$label}: skipped — {$e->getMessage()}";
                $counts[$label] = 0;
            }
        }

        usort($entries, fn ($a, $b) => [$a['type'], $a['id']] <=> [$b['type'], $b['id']]);

        return ['entries' => $entries, 'counts' => $counts, 'warnings' => $warnings];
    }

    // ── Guides ──────────────────────────────────────────────────────────────

    public static function collectGuides(): array
    {
        $out = [];

        foreach ((array) config('vena_guides', []) as $id => $g) {
            $steps = [];
            foreach ((array) ($g['steps'] ?? []) as $step) {
                $steps[] = is_array($step)
                    ? array_filter(['text' => (string) ($step['text'] ?? ''), 'route' => $step['route'] ?? null])
                    : ['text' => (string) $step];
            }

            $aliases = array_values(array_map('strval', (array) ($g['aliases'] ?? [])));

            $out[] = [
                'type'  => 'guide',
                'id'    => (string) $id,
                'title' => (string) ($g['title'] ?? $id),
                'text'  => trim(($g['title'] ?? '') . '. ' . ($g['summary'] ?? '') . ' '
                    . implode(' ', array_column($steps, 'text'))),
                'meta'  => array_filter([
                    'aliases' => $aliases,
                    'module'  => $g['module'] ?? null,
                    'route'   => $g['route'] ?? null,
                    'needs'   => $g['needs'] ?? null,
                    'summary' => $g['summary'] ?? null,
                    'steps'   => $steps,
                    'tips'    => $g['tips'] ?? null,
                ], fn ($v) => $v !== null && $v !== []),
            ];
        }

        return $out;
    }

    // ── Modules (the registry the whole product is gated by) ────────────────

    public static function collectModules(): array
    {
        $modules = (array) config('modules', []);
        $out = [];

        foreach ($modules as $key => $m) {
            if (!is_array($m)) {
                continue;
            }

            $label = (string) ($m['label'] ?? $key);
            $requires = array_map(fn ($k) => (string) ($modules[$k]['label'] ?? $k), (array) ($m['requires'] ?? []));
            $aliases = array_values(array_map('strval', (array) ($m['aliases'] ?? [])));

            $text = trim(implode(' ', array_filter([
                $label . '.',
                $m['description'] ?? null,
                $aliases ? 'Also called: ' . implode(', ', $aliases) . '.' : null,
                !empty($m['opens']) ? 'Good for: ' . $m['opens'] : null,
                $requires ? 'Needs: ' . implode(', ', $requires) . '.' : null,
            ])));

            $nav = [];
            foreach ((array) ($m['nav'] ?? []) as $n) {
                if (!empty($n['route'])) {
                    $nav[] = $n['route'];
                }
            }

            $out[] = [
                'type'  => 'module',
                'id'    => (string) $key,
                'title' => $label,
                'text'  => $text,
                'meta'  => array_filter([
                    'aliases'      => $aliases,
                    'description'  => $m['description'] ?? null,
                    'status'       => $m['status'] ?? 'live',
                    'requires'     => (array) ($m['requires'] ?? []),
                    'requires_one' => (array) ($m['requires_one'] ?? []),
                    'enhances'     => (array) ($m['enhances'] ?? []),
                    'nav'          => $nav,
                    'permissions'  => (array) ($m['permissions'] ?? []),
                    'billing'      => $m['billing'] ?? null,
                ], fn ($v) => $v !== null && $v !== []),
            ];
        }

        return $out;
    }

    // ── Screens ─────────────────────────────────────────────────────────────

    /**
     * Places a person can go: named GET routes inside a store (s/{store_slug}/…),
     * each tied to the module that owns it and, where the Omni-Search registry
     * knows it, that registry's plain-English title and keywords.
     */
    public static function collectScreens(): array
    {
        $modules  = (array) config('modules', []);
        $registry = self::appRegistry();
        $out  = [];
        $seen = [];

        foreach (Route::getRoutes() as $route) {
            $name = $route->getName();
            if (!$name || isset($seen[$name]) || !in_array('GET', $route->methods(), true)) {
                continue;
            }
            if (!str_starts_with($route->uri(), 's/{store_slug}') && $route->uri() !== 's/{store_slug}') {
                continue; // platform, marketing and public pages are not store screens
            }
            if (self::isNoise($name)) {
                continue;
            }

            $params = $route->parameterNames();
            $required = array_values(array_diff($params, ['store_slug', 'tab']));
            if ($required !== []) {
                continue; // a record page needs an id — not somewhere you can send someone
            }

            $seen[$name] = true;

            // Owning module: nav entry first (exact), then a route pattern.
            $moduleKey = null;
            foreach ($modules as $mk => $m) {
                foreach ((array) ($m['nav'] ?? []) as $n) {
                    if (($n['route'] ?? null) === $name) {
                        $moduleKey = $mk;
                        break 2;
                    }
                }
            }
            if ($moduleKey === null) {
                foreach ($modules as $mk => $m) {
                    foreach ((array) ($m['routes'] ?? []) as $pattern) {
                        if (Str::is($pattern, $name)) {
                            $moduleKey = $mk;
                            break 2;
                        }
                    }
                }
            }

            $reg = $registry[$name] ?? null;
            $moduleLabel = $moduleKey ? ($modules[$moduleKey]['label'] ?? $moduleKey) : null;
            $isNavRoot = false;
            if ($moduleKey) {
                foreach ((array) ($modules[$moduleKey]['nav'] ?? []) as $n) {
                    $isNavRoot = $isNavRoot || (($n['route'] ?? null) === $name);
                }
            }

            // A person-readable title: the Omni-Search title when it has one;
            // else the module's own name for its main page; else
            // "<Module> — <last part of the route>" so "Commerce settings"
            // reads as "Online Store — Settings".
            if ($reg) {
                $human = $reg['title'];
            } elseif ($moduleLabel && $isNavRoot) {
                $human = $moduleLabel;
            } elseif ($moduleLabel) {
                $last = Str::afterLast($name, '.');
                $human = $moduleLabel . ' — ' . ucfirst(str_replace(['-', '_'], ' ', $last));
            } else {
                $human = ucfirst(str_replace(['.', '-', '_'], ' ', Str::after($name, 'store.')));
            }

            $perms = [];
            foreach ($route->gatherMiddleware() as $mw) {
                if (is_string($mw) && str_starts_with($mw, 'permission:')) {
                    $perms = array_merge($perms, explode(',', substr($mw, 11)));
                }
            }

            $text = trim(implode(' ', array_filter([
                $human . '.',
                $reg['subtitle'] ?? null,
                $moduleLabel ? "Part of {$moduleLabel}." : null,
                !empty($reg['keywords']) ? implode(' ', $reg['keywords']) : null,
            ])));

            $out[] = [
                'type'  => 'screen',
                'id'    => $name,
                'title' => $human,
                'text'  => $text,
                'meta'  => array_filter([
                    'uri'         => $route->uri(),
                    'module'      => $moduleKey,
                    'keywords'    => $reg['keywords'] ?? null,
                    'subtitle'    => $reg['subtitle'] ?? null,
                    'permissions' => array_values(array_unique($perms)),
                    'curated'     => $reg !== null ? true : null,
                    'tab'         => in_array('tab', $params, true) ? true : null,
                ], fn ($v) => $v !== null && $v !== []),
            ];
        }

        return $out;
    }

    private static function isNoise(string $name): bool
    {
        foreach (self::NOISE as $frag) {
            if (str_contains($name, $frag)) {
                return true;
            }
        }

        return false;
    }

    /**
     * The Omni-Search registry (resources/js/Data/AppRegistry.js) already holds
     * a plain-English title, subtitle and keywords per screen. Read it rather
     * than restating it. Keyed by full route name.
     *
     * @return array<string, array{title:string, subtitle:string, keywords:list<string>}>
     */
    private static function appRegistry(): array
    {
        $path = base_path('resources/js/Data/AppRegistry.js');
        if (!is_file($path)) {
            return [];
        }

        $src = (string) file_get_contents($path);
        $out = [];

        foreach (preg_split('/\{\s*\R\s*id:/u', $src) as $i => $block) {
            if ($i === 0) {
                continue;
            }
            $grab = function (string $field) use ($block): string {
                return preg_match("/{$field}:\\s*'((?:[^'\\\\]|\\\\.)*)'/u", $block, $m) ? stripslashes($m[1]) : '';
            };
            $route = $grab('route');
            $title = $grab('title');
            if ($route === '' || $title === '') {
                continue;
            }
            $name = str_starts_with($route, 'store.') ? $route : 'store.' . $route;

            $keywords = [];
            if (preg_match('/keywords:\s*\[(.*?)\]/su', $block, $km)) {
                preg_match_all("/'((?:[^'\\\\]|\\\\.)*)'/u", $km[1], $kw);
                $keywords = array_map('stripslashes', $kw[1]);
            }

            // First registry entry per route wins (they are ordered by importance).
            $out[$name] ??= ['title' => $title, 'subtitle' => $grab('subtitle'), 'keywords' => $keywords];
        }

        return $out;
    }

    // ── Readings / cards / AI features ──────────────────────────────────────

    public static function collectReadings(): array
    {
        $out = [];

        foreach (ReckonerRegistry::all() as $key => $def) {
            $dimensions = array_keys($def['dimensions'] ?? []);
            $filters    = array_keys($def['filters'] ?? []);
            $groupBy    = $def['dimensions']['group_by']['enum'] ?? [];

            $text = trim(implode(' ', array_filter([
                $def['label'] ?? $key,
                $def['generic'] ?? null,
                $def['description'] ?? null,
                ($def['domain'] ?? null) ? "Domain: {$def['domain']}." : null,
                $groupBy ? 'Can be broken down by ' . implode(', ', array_diff($groupBy, ['none'])) . '.' : null,
                $filters ? 'Can be filtered by ' . implode(', ', $filters) . '.' : null,
                isset($def['derived']) ? 'Calculated from ' . implode(' and ', (array) $def['derived']) . '.' : null,
            ])));

            $out[] = [
                'type'  => 'reading',
                'id'    => $key,
                'title' => $def['label'] ?? $key,
                'text'  => $text,
                'meta'  => array_filter([
                    'domain'       => $def['domain'] ?? null,
                    'shape'        => is_object($def['shape'] ?? null) ? (string) ($def['shape']->value ?? '') : ($def['shape'] ?? null),
                    'unit'         => $def['unit'] ?? null,
                    'periods'      => $def['periods'] ?? null,
                    'permissions'  => $def['permissions'] ?? [],
                    'dimensions'   => $dimensions,
                    'group_by'     => $groupBy,
                    'filters'      => $filters,
                    'derived_from' => $def['derived'] ?? null,
                    'drill_route'  => $def['drill_route'] ?? null,
                    'scope'        => $def['scope'] ?? 'tenant',
                ], fn ($v) => $v !== null && $v !== []),
            ];
        }

        return $out;
    }

    public static function collectCards(): array
    {
        $out = [];

        foreach (DashboardRegistry::all() as $key => $def) {
            $out[] = [
                'type'  => 'card',
                'id'    => $key,
                'title' => $def['label'] ?? $def['title'] ?? $key,
                'text'  => trim(($def['label'] ?? $key) . '. ' . ($def['description'] ?? '')
                    . ' A dashboard card the user can add to their dashboard.'),
                'meta'  => array_filter([
                    'sizes'       => $def['sizes'] ?? null,
                    'permissions' => $def['permissions'] ?? [],
                    'reading_key' => $def['reading_key'] ?? null,
                ], fn ($v) => $v !== null && $v !== []),
            ];
        }

        return $out;
    }

    public static function collectAiFeatures(): array
    {
        $out = [];

        foreach ((array) config('ai_models', []) as $feature => $profile) {
            if (!is_array($profile) || !isset($profile['model'])) {
                continue; // skip deprecation_audit and other non-profile blocks
            }

            $out[] = [
                'type'  => 'ai_feature',
                'id'    => $feature,
                'title' => ucfirst(str_replace('_', ' ', $feature)),
                'text'  => 'AI feature "' . $feature . '" runs on ' . ($profile['provider'] ?? 'gemini')
                    . ' ' . $profile['model'] . '. All AI calls route through App\\Services\\Ai\\AiGateway.',
                'meta'  => array_filter([
                    'provider'       => $profile['provider'] ?? null,
                    'model'          => $profile['model'],
                    'context_budget' => $profile['context_budget'] ?? null,
                ], fn ($v) => $v !== null),
            ];
        }

        return $out;
    }
}
