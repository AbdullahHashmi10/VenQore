<?php

namespace App\Reckoner\Resolvers;

final class CorePayablesResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'core.payables';
    }
}
