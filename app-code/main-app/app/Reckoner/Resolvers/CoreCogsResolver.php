<?php

namespace App\Reckoner\Resolvers;

final class CoreCogsResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'core.cogs';
    }
}
