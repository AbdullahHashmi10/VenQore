<?php

namespace App\Reckoner\Resolvers;

final class CoreExpensesTotalResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'core.expenses_total';
    }
}
