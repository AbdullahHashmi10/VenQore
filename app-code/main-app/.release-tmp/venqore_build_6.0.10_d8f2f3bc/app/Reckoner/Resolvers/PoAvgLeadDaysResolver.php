<?php

namespace App\Reckoner\Resolvers;

final class PoAvgLeadDaysResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'po.avg_lead_days';
    }
}
