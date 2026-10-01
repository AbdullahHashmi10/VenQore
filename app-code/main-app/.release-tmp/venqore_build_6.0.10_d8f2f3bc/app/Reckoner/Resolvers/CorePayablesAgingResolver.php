<?php

namespace App\Reckoner\Resolvers;

final class CorePayablesAgingResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'core.payables_aging';
    }
}
