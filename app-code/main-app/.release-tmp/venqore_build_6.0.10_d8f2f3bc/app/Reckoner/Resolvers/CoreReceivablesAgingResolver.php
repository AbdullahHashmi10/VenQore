<?php

namespace App\Reckoner\Resolvers;

final class CoreReceivablesAgingResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'core.receivables_aging';
    }
}
