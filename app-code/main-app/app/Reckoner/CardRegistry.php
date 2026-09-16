<?php

namespace App\Reckoner;

/**
 * CardRegistry — The single source of truth for the 349 Reckoner cards.
 *
 * Source of truth: VENQORE_MODULE_BUSINESS_INTERACTIVE_MAP.html (§4.1).
 * Seeded from resources/data/reckoner/cards.json.
 */
final class CardRegistry
{
    private static ?array $cards = null;
    private static ?array $modules = null;
    private static ?array $businesses = null;
    private static ?array $presets = null;

    /**
     * All 349 cards in the catalogue.
     *
     * @return array<string, array{
     *   key: string,
     *   title: string,
     *   shape: string,
     *   viz: string,
     *   module: ?string,
     *   period: bool,
     *   weight: int,
     *   topic: ?string,
     *   insight: string,
     *   unit: string,
     *   precision: int,
     *   streams: string[],
     *   measures: string[]
     * }>
     */
    public static function all(): array
    {
        if (self::$cards !== null) {
            return self::$cards;
        }

        $path = self::resolvePath('data/reckoner/cards.json');
        $raw = json_decode((string) @file_get_contents($path), true) ?: [];

        self::$cards = [];
        foreach ($raw as $key => $card) {
            self::$cards[$key] = [
                'key' => $key,
                'title' => $card['title'],
                'shape' => $card['shape'] ?? $card['viz'] ?? 'stat',
                'viz' => $card['viz'] ?? $card['shape'] ?? 'stat',
                'module' => $card['module'] ?? null,
                'period' => (bool) ($card['period'] ?? false),
                'period_aware' => (bool) ($card['period'] ?? false),
                'weight' => (int) ($card['weight'] ?? 50),
                'topic' => $card['topic'] ?? null,
                'insight' => $card['insight'] ?? '',
                'unit' => $card['unit'] ?? 'currency',
                'precision' => (int) ($card['precision'] ?? 2),
                'streams' => (array) ($card['streams'] ?? []),
                'measures' => (array) ($card['measures'] ?? []),
            ];
        }

        return self::$cards;
    }

    public static function count(): int
    {
        return count(self::all());
    }

    public static function has(string $key): bool
    {
        return isset(self::all()[$key]);
    }

    public static function find(string $key): ?array
    {
        return self::all()[$key] ?? null;
    }

    /**
     * All 32 Qore cards (no module required).
     */
    public static function qoreCards(): array
    {
        return array_filter(self::all(), fn (array $c) => $c['module'] === null);
    }

    /**
     * Cards belonging to a specific module.
     */
    public static function moduleCards(string $module): array
    {
        return array_filter(self::all(), fn (array $c) => $c['module'] === $module);
    }

    /**
     * All 46 module definitions.
     */
    public static function modules(): array
    {
        if (self::$modules !== null) {
            return self::$modules;
        }

        $path = self::resolvePath('data/reckoner/modules.json');
        return self::$modules = json_decode((string) @file_get_contents($path), true) ?: [];
    }

    /**
     * All 85 business type configurations.
     */
    public static function businesses(): array
    {
        if (self::$businesses !== null) {
            return self::$businesses;
        }

        $path = self::resolvePath('data/reckoner/businesses.json');
        return self::$businesses = json_decode((string) @file_get_contents($path), true) ?: [];
    }

    /**
     * All 20 preset configurations.
     */
    public static function presets(): array
    {
        if (self::$presets !== null) {
            return self::$presets;
        }

        $path = self::resolvePath('data/reckoner/presets.json');
        return self::$presets = json_decode((string) @file_get_contents($path), true) ?: [];
    }

    private static function resolvePath(string $subpath): string
    {
        try {
            if (function_exists('resource_path') && function_exists('app') && app()->bound('path.resources')) {
                return resource_path($subpath);
            }
        } catch (\Throwable) {
        }

        $direct = dirname(__DIR__, 2) . '/resources/' . $subpath;
        if (file_exists($direct)) {
            return $direct;
        }

        return __DIR__ . '/../../resources/' . $subpath;
    }
}
