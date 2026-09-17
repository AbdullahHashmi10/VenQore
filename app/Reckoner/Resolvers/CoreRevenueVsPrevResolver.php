<?php

namespace App\Reckoner\Resolvers;

final class CoreRevenueVsPrevResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'core.revenue_vs_prev';
    }
}
