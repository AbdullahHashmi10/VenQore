<?php

namespace App\Reckoner\Resolvers;

final class CustomersRepeatRateResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'customers.repeat_rate';
    }
}
