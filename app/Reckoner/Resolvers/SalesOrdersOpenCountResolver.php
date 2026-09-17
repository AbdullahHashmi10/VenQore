<?php

namespace App\Reckoner\Resolvers;

final class SalesOrdersOpenCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'sales_orders.open_count';
    }
}
