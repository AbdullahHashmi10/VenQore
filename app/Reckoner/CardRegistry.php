<?php

namespace App\Reckoner;

use InvalidArgumentException;

/**
 * CardRegistry — The single source of truth for the 349 Reckoner cards.
 *
 * Source of truth: VENQORE_MODULE_BUSINESS_INTERACTIVE_MAP.html (§4.1).
 * Seeded from resources/data/reckoner/cards.json.
 */
final class CardRegistry
{
    public const ALLOWED_UNITS = [
        'currency', 'count', 'percent', 'ratio', 'days', 'hours', 'minutes', 'hour',
    ];

    public const ALLOWED_PERIOD_KINDS = [
        'flow', 'as_of', 'live',
    ];

    private static ?array $cards = null;
    private static ?array $measures = null;
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
     *   period_aware: bool,
     *   weight: int,
     *   topic: ?string,
     *   insight: string,
     *   unit: string,
     *   precision: int,
     *   streams: string[],
     *   measures: string[],
     *   contract_state: string,
     *   status_reason: ?string,
     *   permissions: string[],
     *   periods: string[],
     *   default_period: string,
     *   tier: string,
     *   matrix_status: string,
     *   contract: array
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
                'contract_state' => $card['contract_state'] ?? 'unimplemented',
                'status_reason' => $card['status_reason'] ?? null,
                'permissions' => (array) ($card['permissions'] ?? []),
                'periods' => (array) ($card['periods'] ?? []),
                'default_period' => $card['default_period'] ?? 'today',
                'tier' => $card['tier'] ?? 'Flow',
                'matrix_status' => $card['matrix_status'] ?? 'READY',
                'contract' => (array) ($card['contract'] ?? []),
            ];
        }

        self::validateCatalog(self::$cards);

        return self::$cards;
    }

    /**
     * Validates catalogue invariants per §7 Phase 2.
     *
     * @throws InvalidArgumentException
     */
    public static function validateCatalog(array $cards): void
    {
        if (count($cards) !== 349) {
            throw new InvalidArgumentException("CardRegistry must contain exactly 349 cards, found " . count($cards));
        }

        $measures = self::measures();

        $goldenExpected = [];
        if (class_exists('Tests\\Fixtures\\ReckonerGoldenStoreFixture')) {
            $goldenExpected = \Tests\Fixtures\ReckonerGoldenStoreFixture::EXPECTED_VALUES;
        }

        foreach ($cards as $key => $card) {
            $unit = $card['unit'] ?? null;
            if (!in_array($unit, self::ALLOWED_UNITS, true)) {
                throw new InvalidArgumentException("Card {$key} unit '{$unit}' is not in allowed vocabulary.");
            }

            $contract = $card['contract'] ?? null;
            if (!$contract) {
                throw new InvalidArgumentException("Card {$key} is missing contract block.");
            }

            $periodKind = $contract['period_kind'] ?? null;
            if (!in_array($periodKind, self::ALLOWED_PERIOD_KINDS, true)) {
                throw new InvalidArgumentException("Card {$key} contract.period_kind '{$periodKind}' is invalid.");
            }

            $contractUnit = $contract['unit'] ?? null;
            if (!in_array($contractUnit, self::ALLOWED_UNITS, true)) {
                throw new InvalidArgumentException("Card {$key} contract.unit '{$contractUnit}' is not in allowed vocabulary.");
            }

            $cardMeasures = (array) ($contract['measures'] ?? []);
            foreach ($cardMeasures as $measureKey) {
                if (!isset($measures[$measureKey])) {
                    throw new InvalidArgumentException("Card {$key} references non-existent measure '{$measureKey}'.");
                }

                $mDef = $measures[$measureKey];
                $mKind = $mDef['kind'] ?? 'flow';

                // Legality rule: balance measure cannot be aggregated as a pure daily flow stat
                if ($mKind === 'balance' && $periodKind === 'flow') {
                    throw new InvalidArgumentException("Card {$key} is flow period_kind but references balance measure '{$measureKey}'.");
                }

                // Legality rule: distinct measure cannot be stored flow
                if ($mKind === 'distinct' && $periodKind === 'flow') {
                    throw new InvalidArgumentException("Card {$key} is flow period_kind but references distinct measure '{$measureKey}'.");
                }
            }

            // Invariant: every verified card must have a golden expected value in fixture
            $isVerified = ($card['contract_state'] ?? '') === 'verified'
                || ($contract['status'] ?? '') === 'VERIFIED';

            if ($isVerified && !empty($goldenExpected) && !array_key_exists($key, $goldenExpected)) {
                throw new InvalidArgumentException("Verified card {$key} has no expected value in ReckonerGoldenStoreFixture.");
            }
        }
    }

    /**
     * All ~199 canonical measure definitions from measures.json.
     */
    public static function measures(): array
    {
        if (self::$measures !== null) {
            return self::$measures;
        }

        $path = self::resolvePath('data/reckoner/measures.json');
        return self::$measures = json_decode((string) @file_get_contents($path), true) ?: [];
    }

    /**
     * Get measure definition by key.
     */
    public static function measure(string $key): ?array
    {
        return self::measures()[$key] ?? null;
    }

    /**
     * Contract block for a specific card.
     */
    public static function contract(string $key): ?array
    {
        $card = self::find($key);
        return $card['contract'] ?? null;
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

    public static function get(string $key): ?array
    {
        return self::find($key);
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