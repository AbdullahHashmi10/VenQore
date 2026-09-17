<?php

namespace App\Reckoner;

/**
 * The canonical Reckoner measures catalogue.
 * Source of truth: resources/data/reckoner/measures.json (§4.1).
 */
final class Measures
{
    private static ?array $measures = null;

    /**
     * All canonical measure definitions from measures.json.
     *
     * @return array<string, array{
     *   key: string,
     *   name: string,
     *   kind: string,
     *   stream: string,
     *   definition: string,
     *   sql_builder: string,
     *   date_basis: string,
     *   allowed_dims: string[],
     *   dim_caps: int,
     *   unit: string,
     *   precision: int,
     *   ledger_control: ?string,
     *   version: int
     * }>
     */
    public static function all(): array
    {
        if (self::$measures !== null) {
            return self::$measures;
        }

        return self::$measures = CardRegistry::measures();
    }

    /**
     * All measure keys.
     *
     * @return string[]
     */
    public static function keys(): array
    {
        return array_keys(self::all());
    }

    /**
     * Look up a measure definition by key.
     */
    public static function get(string $key): ?array
    {
        return self::all()[$key] ?? null;
    }

    /**
     * Check if a measure exists.
     */
    public static function has(string $key): bool
    {
        return isset(self::all()[$key]);
    }

    public static function count(): int
    {
        return count(self::all());
    }
}