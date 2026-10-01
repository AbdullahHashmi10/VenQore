<?php

namespace App\Reckoner\Resolvers;

final class SalesOrdersValueTrendResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'sales_orders.value_trend';
    }
}
