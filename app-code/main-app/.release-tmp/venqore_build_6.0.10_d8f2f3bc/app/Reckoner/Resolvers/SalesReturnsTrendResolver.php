<?php

namespace App\Reckoner\Resolvers;

final class SalesReturnsTrendResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'sales_returns.trend';
    }
}
