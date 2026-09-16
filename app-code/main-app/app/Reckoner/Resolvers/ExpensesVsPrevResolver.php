<?php

namespace App\Reckoner\Resolvers;

final class ExpensesVsPrevResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'expenses.vs_prev';
    }
}
