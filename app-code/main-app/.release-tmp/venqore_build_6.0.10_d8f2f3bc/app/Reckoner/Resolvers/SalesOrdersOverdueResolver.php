<?php

namespace App\Reckoner\Resolvers;

final class SalesOrdersOverdueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'sales_orders.overdue';
    }
}
