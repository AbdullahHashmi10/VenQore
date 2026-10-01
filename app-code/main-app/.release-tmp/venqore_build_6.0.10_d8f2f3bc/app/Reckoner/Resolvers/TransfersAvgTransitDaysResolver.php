<?php

namespace App\Reckoner\Resolvers;

final class TransfersAvgTransitDaysResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'transfers.avg_transit_days';
    }
}
