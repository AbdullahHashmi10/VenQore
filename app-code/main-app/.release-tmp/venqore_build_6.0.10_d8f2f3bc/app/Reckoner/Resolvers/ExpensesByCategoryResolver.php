<?php

namespace App\Reckoner\Resolvers;

final class ExpensesByCategoryResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'expenses.by_category';
    }
}
