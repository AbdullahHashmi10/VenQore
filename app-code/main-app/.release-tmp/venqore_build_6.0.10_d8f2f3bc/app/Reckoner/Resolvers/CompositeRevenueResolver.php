<?php

namespace App\Reckoner\Resolvers;

final class CompositeRevenueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'composite.revenue';
    }
}
