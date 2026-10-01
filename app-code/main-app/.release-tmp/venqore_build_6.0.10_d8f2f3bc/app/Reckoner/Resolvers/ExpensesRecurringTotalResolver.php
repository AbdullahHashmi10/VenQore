<?php

namespace App\Reckoner\Resolvers;

final class ExpensesRecurringTotalResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'expenses.recurring_total';
    }
}
