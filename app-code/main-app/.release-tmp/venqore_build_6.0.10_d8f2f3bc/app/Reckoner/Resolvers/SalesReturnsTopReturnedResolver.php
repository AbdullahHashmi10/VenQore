<?php

namespace App\Reckoner\Resolvers;

final class SalesReturnsTopReturnedResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'sales_returns.top_returned';
    }
}
