<?php

namespace App\Reckoner\Resolvers;

final class PosRevenueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'pos.revenue';
    }
}
