<?php

namespace App\Reckoner\Resolvers;

final class ExpensesLargestResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'expenses.largest';
    }
}
