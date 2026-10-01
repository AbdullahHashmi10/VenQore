<?php

namespace App\Reckoner\Resolvers;

final class SalesReturnsCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'sales_returns.count';
    }
}
