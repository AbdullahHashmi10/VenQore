<?php

namespace App\Reckoner\Resolvers;

final class SalesOrdersCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'sales_orders.count';
    }
}
