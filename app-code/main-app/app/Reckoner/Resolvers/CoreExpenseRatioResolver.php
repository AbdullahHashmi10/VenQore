<?php

namespace App\Reckoner\Resolvers;

final class CoreExpenseRatioResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'core.expense_ratio';
    }
}
