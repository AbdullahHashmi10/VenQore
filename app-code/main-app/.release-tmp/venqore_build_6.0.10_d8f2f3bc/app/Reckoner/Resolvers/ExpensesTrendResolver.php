<?php

namespace App\Reckoner\Resolvers;

final class ExpensesTrendResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'expenses.trend';
    }
}
