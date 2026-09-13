<?php

namespace App\Console\Commands;

use App\Reckoner\ReckonerRegistry;
use App\Services\Dashboard\DashboardRegistry;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Route;

/**
 * Generates the VenQore system manifest — the machine-readable map of what this
 * system can do, for Vena to answer "where is X / can I see Y" without reading code.
 *
 * ── Two rules this file exists to enforce ───────────────────────────────────
 *
 * 1. GENERATED, NEVER HAND-EDITED. Every hand-maintained second copy of a truth
 *    in this codebase has drifted (config/ai_models.php was dead config; the V6
 *    catalog listed 108 readings against 25 real ones). The manifest is a build
 *    artifact. If it is wrong, fix the registry, not the manifest.
 *
 * 2. RETRIEVED, NEVER PROMPT-STUFFED. Entries are small, self-describing chunks
 *    with a `text` field written for matching. Vena searches this file and pulls
 *    the two or three entries it needs. Never send the whole manifest to a model:
 *    a large prompt is slower AND less accurate, which is the exact mistake the
 *    AI Consolidation Mandate exists to prevent.
 *
 * Usage:
 *   php artisan venqore:manifest              # write storage/app/system-manifest.json
 *   php artisan venqore:manifest --check      # exit 1 if the written file is stale (CI)
 *   php artisan venqore:manifest --pretty     # human-readable output
 */
class GenerateSystemManifest extends Command
{
    protected $signature = 'venqore:manifest
                            {--check : Exit non-zero if the on-disk manifest is stale}
                            {--pretty : Pretty-print the JSON}';

    protected $description = 'Generate the system manifest Vena uses to answer questions about the product';

    private const PATH = 'system-manifest.json';

    public function handle(): int
    {
        $entries = [];

        foreach ([
            'readings' => fn () => $this->collectReadings(),
            'cards'    => fn () => $this->collectCards(),
            'screens'  => fn () => $this->collectScreens(),
            'ai'       => fn () => $this->collectAiFeatures(),
        ] as $label => $collector) {
            try {
                $found = $collector();
                $entries = array_merge($entries, $found);
                $this->line(sprintf('  %-9s %d entries', $label, count($found)));
            } catch (\Throwable $e) {
                // A missing or renamed source must never break the build. Report and continue.
                $this->warn("  {$label}: skipped — {$e->getMessage()}");
            }
        }

        usort($entries, fn ($a, $b) => [$a['type'], $a['id']] <=> [$b['type'], $b['id']]);

        // Content hash excludes generated_at so an unchanged system produces a
        // stable hash — that is what makes --check meaningful.
        $payload = [
            'schema_version' => 1,
            'entry_count'    => count($entries),
            'content_hash'   => hash('sha256', json_encode($entries)),
            'entries'        => $entries,
        ];

        $flags = JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
            | ($this->option('pretty') ? JSON_PRETTY_PRINT : 0);

        $json = json_encode($payload, $flags);
        $disk = storage_path('app/' . self::PATH);

        if ($this->option('check')) {
            if (! file_exists($disk)) {
                $this->error('Manifest missing. Run: php artisan venqore:manifest');
                return self::FAILURE;
            }
            $existing = json_decode((string) file_get_contents($disk), true);
            if (($existing['content_hash'] ?? null) !== $payload['content_hash']) {
                $this->error('Manifest is STALE — the registries changed since it was generated.');
                $this->line('Run: php artisan venqore:manifest');
                return self::FAILURE;
            }
            $this->info("Manifest is current ({$payload['entry_count']} entries).");
            return self::SUCCESS;
        }

        // generated_at is written to disk but deliberately not hashed.
        $payload['generated_at'] = now()->toIso8601String();
        file_put_contents($disk, json_encode($payload, $flags));

        $this->info("Wrote {$payload['entry_count']} entries to storage/app/" . self::PATH);
        return self::SUCCESS;
    }

    // ── Collectors ──────────────────────────────────────────────────────────
    // Each returns retrieval chunks: {type, id, title, text, meta}.
    // `text` is the matchable sentence. Keep it plain and specific — it is what
    // a local matcher scores a user's question against before any model is called.

    private function collectReadings(): array
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

    private function collectCards(): array
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

    /**
     * Named GET routes — "where do I find X" is the most common question a user
     * asks, and the route name is the answer. POST/PUT/DELETE and wildcards are
     * excluded: they are actions, not places.
     */
    private function collectScreens(): array
    {
        $out  = [];
        $seen = [];

        foreach (Route::getRoutes() as $route) {
            $name = $route->getName();
            if (! $name || isset($seen[$name])) {
                continue;
            }
            if (! in_array('GET', $route->methods(), true)) {
                continue;
            }
            if (str_starts_with($name, 'api.') || str_starts_with($name, 'sanctum.')
                || str_contains($name, 'generated::')) {
                continue;
            }

            $seen[$name] = true;
            $human = ucfirst(str_replace(['.', '-', '_'], ' ', $name));

            $out[] = [
                'type'  => 'screen',
                'id'    => $name,
                'title' => $human,
                'text'  => "{$human}. Found at /" . ltrim($route->uri(), '/') . '.',
                'meta'  => array_filter([
                    'uri'        => $route->uri(),
                    'middleware' => array_values(array_filter(
                        $route->gatherMiddleware(),
                        fn ($m) => is_string($m) && str_contains($m, 'permission')
                    )),
                ], fn ($v) => $v !== null && $v !== []),
            ];
        }

        return $out;
    }

    private function collectAiFeatures(): array
    {
        $out = [];

        foreach ((array) config('ai_models', []) as $feature => $profile) {
            if (! is_array($profile) || ! isset($profile['model'])) {
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
