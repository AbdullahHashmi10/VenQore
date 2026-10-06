<?php

namespace App\Reckoner\Resolvers;

final class CoreRecentSalesResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'core.recent_sales';
    }
}
