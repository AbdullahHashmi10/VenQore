<?php

namespace App\Reckoner\Resolvers;

final class RecurringMonthlyValueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'recurring.monthly_value';
    }
}
