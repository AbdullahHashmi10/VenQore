<?php

namespace App\Reckoner\Resolvers;

final class SalesOrdersOpenValueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'sales_orders.open_value';
    }
}
