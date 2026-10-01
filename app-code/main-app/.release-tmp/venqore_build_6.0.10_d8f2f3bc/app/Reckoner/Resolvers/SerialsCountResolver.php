<?php

namespace App\Reckoner\Resolvers;

final class SerialsCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'serials.count';
    }
}
