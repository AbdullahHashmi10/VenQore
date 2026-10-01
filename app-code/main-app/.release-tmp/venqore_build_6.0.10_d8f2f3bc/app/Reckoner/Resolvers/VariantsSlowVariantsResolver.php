<?php

namespace App\Reckoner\Resolvers;

final class VariantsSlowVariantsResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'variants.slow_variants';
    }
}
