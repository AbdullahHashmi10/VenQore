<?php

namespace App\Reckoner\Resolvers;

final class ExpensesTopCategoriesResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'expenses.top_categories';
    }
}
