<?php

namespace App\Reckoner\Resolvers;

final class CustomersTopCustomersResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'customers.top_customers';
    }
}
