<?php

namespace App\Reckoner\Resolvers;

final class CoreReceivablesResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'core.receivables';
    }
}
