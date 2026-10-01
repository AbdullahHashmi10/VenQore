<?php

namespace App\Reckoner\Resolvers;

final class SalesOrdersByCustomerResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'sales_orders.by_customer';
    }
}
