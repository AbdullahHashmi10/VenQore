<?php

namespace App\Reckoner\Resolvers;

final class VariantsSizeColourMixResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'variants.size_colour_mix';
    }
}
