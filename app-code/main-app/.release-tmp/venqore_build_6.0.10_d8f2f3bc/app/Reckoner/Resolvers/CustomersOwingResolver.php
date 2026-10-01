<?php

namespace App\Reckoner\Resolvers;

final class CustomersOwingResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'customers.owing';
    }
}
