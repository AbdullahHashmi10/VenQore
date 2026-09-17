<?php

namespace App\Reckoner\Resolvers;

final class CoreWorkingCapitalResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'core.working_capital';
    }
}
