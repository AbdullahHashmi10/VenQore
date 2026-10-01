<?php

namespace App\Reckoner\Resolvers;

final class CustomersByAreaResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'customers.by_area';
    }
}
