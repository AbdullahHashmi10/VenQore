<?php

namespace App\Reckoner\Resolvers;

final class CustomersNewTrendResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'customers.new_trend';
    }
}
