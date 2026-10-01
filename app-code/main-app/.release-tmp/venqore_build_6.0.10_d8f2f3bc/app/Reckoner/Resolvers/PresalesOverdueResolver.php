<?php

namespace App\Reckoner\Resolvers;

final class PresalesOverdueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'presales.overdue';
    }
}
