<?php

namespace App\Reckoner\Resolvers;

final class SalesReturnsRateResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'sales_returns.rate';
    }
}
