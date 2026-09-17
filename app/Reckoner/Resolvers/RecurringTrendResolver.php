<?php

namespace App\Reckoner\Resolvers;

final class RecurringTrendResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'recurring.trend';
    }
}
