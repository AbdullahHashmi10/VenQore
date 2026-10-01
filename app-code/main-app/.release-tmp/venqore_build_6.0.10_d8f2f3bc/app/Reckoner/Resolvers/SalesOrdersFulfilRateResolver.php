<?php

namespace App\Reckoner\Resolvers;

final class SalesOrdersFulfilRateResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'sales_orders.fulfil_rate';
    }
}
