<?php

namespace App\Reckoner\Resolvers;

final class ExpensesPerDayResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'expenses.per_day';
    }
}
