<?php

namespace App\Reckoner\Custom;

use InvalidArgumentException;

/**
 * CustomCardValidator: Validates custom card specifications (§5.3, §8.2).
 *
 * Rules:
 * 1. Measure must exist in measures.json or formula must be safe arithmetic.
 * 2. Projection shape must be legal for the measure kind.
 * 3. Dimensions must be in measure.allowed_dims.
 * 4. Derived formulas are strictly limited to safe arithmetic (a / b, a - b, a + b, a * const).
 */
class CustomCardValidator
{
    protected static ?array $measuresCache = null;

    public static function loadMeasures(): array
    {
        if (self::$measuresCache === null) {
            $path = resource_path('data/reckoner/measures.json');
            self::$measuresCache = file_exists($path) ? json_decode(file_get_contents($path), true) : [];
        }
        return self::$measuresCache;
    }

    /**
     * Validates a custom card spec. Throws InvalidArgumentException if invalid.
     */
    public static function validate(array $spec): array
    {
        $measures = self::loadMeasures();

        $measureKey = $spec['measure'] ?? null;
        $formula    = $spec['formula'] ?? null;
        $shape      = strtolower($spec['shape'] ?? 'stat');
        $dims       = $spec['dims'] ?? [];

        if (!$measureKey && !$formula) {
            throw new InvalidArgumentException("Custom card spec must declare either 'measure' or 'formula'.");
        }

        if ($measureKey) {
            if (!isset($measures[$measureKey])) {
                throw new InvalidArgumentException("Measure '{$measureKey}' does not exist in the measure library.");
            }

            $measureDef = $measures[$measureKey];
            $kind = $measureDef['kind'] ?? 'flow';

            // Validate legal shapes for kind
            $legalShapes = match ($kind) {
                'flow'     => ['stat', 'scalar', 'trend', 'series', 'breakdown', 'compare'],
                'balance'  => ['stat', 'scalar', 'trend', 'series', 'breakdown', 'compare'],
                'distinct' => ['stat', 'scalar', 'list', 'ranking'],
                'position' => ['stat', 'scalar', 'gauge', 'trend', 'series', 'breakdown'],
                'derived'  => ['stat', 'scalar', 'gauge', 'compare'],
                default    => ['stat', 'scalar'],
            };

            if (!in_array($shape, $legalShapes, true)) {
                throw new InvalidArgumentException("Shape '{$shape}' is not legal for measure kind '{$kind}'.");
            }

            // Validate dims
            $allowedDims = $measureDef['allowed_dims'] ?? [];
            foreach ((array) $dims as $dim) {
                if (!in_array($dim, $allowedDims, true)) {
                    throw new InvalidArgumentException("Dimension '{$dim}' is not allowed for measure '{$measureKey}'.");
                }
            }
        }

        if ($formula) {
            self::validateFormula($formula, $measures);
        }

        return $spec;
    }

    /**
     * Validates that a derived formula uses safe arithmetic only and referenced measures exist.
     */
    public static function validateFormula(string $formula, array $measures): void
    {
        // Safe characters: letters, dots, underscores, numbers, spaces, operators (+, -, *, /), and parentheses
        if (!preg_match('/^[a-zA-Z0-9_\.\s\+\-\*\/\(\)]+$/', $formula)) {
            throw new InvalidArgumentException("Formula contains illegal characters. Only basic arithmetic (+, -, *, /) is permitted.");
        }

        // Extract measure tokens (words containing letters and dots)
        preg_match_all('/[a-zA-Z][a-zA-Z0-9_\.]*/', $formula, $matches);
        $tokens = $matches[0] ?? [];

        foreach ($tokens as $token) {
            if (!isset($measures[$token])) {
                throw new InvalidArgumentException("Formula references unknown measure '{$token}'.");
            }
        }
    }
}
