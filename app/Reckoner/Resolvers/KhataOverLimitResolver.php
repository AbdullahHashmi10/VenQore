<?php

namespace App\Reckoner\Resolvers;

final class KhataOverLimitResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'khata.over_limit';
    }
}
