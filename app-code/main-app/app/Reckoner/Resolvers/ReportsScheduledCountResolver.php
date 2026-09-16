<?php

namespace App\Reckoner\Resolvers;

final class ReportsScheduledCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'reports.scheduled_count';
    }
}
