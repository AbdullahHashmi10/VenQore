<?php

namespace App\Reckoner\Resolvers;

final class ServicesRevenueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'services.revenue';
    }
}
