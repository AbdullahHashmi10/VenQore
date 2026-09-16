<?php

namespace App\Reckoner\Resolvers;

final class CustomersDormantResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'customers.dormant';
    }
}
