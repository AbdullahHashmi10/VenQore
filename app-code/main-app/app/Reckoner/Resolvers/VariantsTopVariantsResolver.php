<?php

namespace App\Reckoner\Resolvers;

final class VariantsTopVariantsResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'variants.top_variants';
    }
}
