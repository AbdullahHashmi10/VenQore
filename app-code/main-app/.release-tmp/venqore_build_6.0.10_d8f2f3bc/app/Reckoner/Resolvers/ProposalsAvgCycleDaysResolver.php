<?php

namespace App\Reckoner\Resolvers;

final class ProposalsAvgCycleDaysResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'proposals.avg_cycle_days';
    }
}
