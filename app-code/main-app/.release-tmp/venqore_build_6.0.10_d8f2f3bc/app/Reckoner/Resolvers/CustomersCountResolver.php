<?php

namespace App\Reckoner\Resolvers;

final class CustomersCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'customers.count';
    }
}
