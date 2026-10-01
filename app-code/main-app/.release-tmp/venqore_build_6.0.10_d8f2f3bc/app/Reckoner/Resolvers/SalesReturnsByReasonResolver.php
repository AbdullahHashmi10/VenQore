<?php

namespace App\Reckoner\Resolvers;

final class SalesReturnsByReasonResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'sales_returns.by_reason';
    }
}
