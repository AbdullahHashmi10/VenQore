<?php

namespace App\Reckoner\Resolvers;

final class ExpensesCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'expenses.count';
    }
}
