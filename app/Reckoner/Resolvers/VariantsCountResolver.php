<?php

namespace App\Reckoner\Resolvers;

final class VariantsCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'variants.count';
    }
}
