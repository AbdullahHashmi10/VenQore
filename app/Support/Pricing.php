<?php

namespace App\Support;

final class Pricing
{
    /** Resolve a configured variant ID, or fail before a checkout is attempted. */
    public static function variantId(string $configPath): string
    {
        $id = config($configPath);

        if (blank($id) || $id === 'REPLACE_ME') {
            throw new \RuntimeException(
                "Lemon Squeezy variant id missing for [{$configPath}]. " .
                'Set the corresponding LEMON_SQUEEZY_* env value.'
            );
        }

        return (string) $id;
    }
}
