<?php

namespace App\Reckoner\Resolvers;

final class ExpensesUnpaidResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'expenses.unpaid';
    }
}
