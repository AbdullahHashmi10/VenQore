<?php

namespace App\Reckoner\Resolvers;

final class ExpensesRecentResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'expenses.recent';
    }
}
