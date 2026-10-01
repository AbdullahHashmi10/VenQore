<?php

namespace App\Reckoner\Resolvers;

final class CustomersAvgSpendResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'customers.avg_spend';
    }
}
