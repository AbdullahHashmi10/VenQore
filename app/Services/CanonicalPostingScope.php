<?php

namespace App\Services;

/**
 * CanonicalPostingScope
 *
 * Provides an explicit, exception-safe execution boundary for canonical financial posting.
 * Guards Eloquent observers (such as SaleObserver) from unauthorized, unapproved direct
 * model creation without disabling guards in testing or console environments.
 */
class CanonicalPostingScope
{
    private static int $depth = 0;

    /**
     * Execute a callback within the canonical posting scope.
     */
    public static function run(callable $callback): mixed
    {
        self::$depth++;
        try {
            return $callback();
        } finally {
            self::$depth = max(0, self::$depth - 1);
        }
    }

    /**
     * Check if currently executing within an authorized canonical posting scope.
     */
    public static function isActive(): bool
    {
        return self::$depth > 0;
    }

    /**
     * Reset depth (primarily for testing cleanup).
     */
    public static function reset(): void
    {
        self::$depth = 0;
    }
}
