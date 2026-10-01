<?php

namespace App\Reckoner\Resolvers;

final class CustomersActiveResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'customers.active';
    }
}
