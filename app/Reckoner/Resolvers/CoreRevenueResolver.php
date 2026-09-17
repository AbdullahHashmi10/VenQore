<?php

namespace App\Reckoner\Resolvers;

final class CoreRevenueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'core.revenue';
    }
}
