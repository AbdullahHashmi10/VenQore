<?php

namespace App\Reckoner\Resolvers;

final class TablesRevenuePerTableResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'tables.revenue_per_table';
    }
}
