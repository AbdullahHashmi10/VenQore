<?php

namespace App\Reckoner\Resolvers;

final class CoreBusiestDayResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'core.busiest_day';
    }
}
