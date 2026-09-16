<?php

namespace App\Reckoner\Resolvers;

final class CorePeakHourResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'core.peak_hour';
    }
}
