<?php

namespace App\Reckoner\Resolvers;

final class LandedByTypeResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'landed.by_type';
    }
}
