<?php

namespace App\Reckoner\Resolvers;

final class CustomersNewResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'customers.new';
    }
}
