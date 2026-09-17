<?php

namespace App\Reckoner\Resolvers;

final class CompositeMarginResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'composite.margin';
    }
}
