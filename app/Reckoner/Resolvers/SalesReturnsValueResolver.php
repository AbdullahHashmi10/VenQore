<?php

namespace App\Reckoner\Resolvers;

final class SalesReturnsValueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'sales_returns.value';
    }
}
